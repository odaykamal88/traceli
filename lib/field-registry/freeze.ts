import 'server-only'

import { createHash } from 'node:crypto'

import {
  awardDeskDecisionIds,
  awardRegistrySnapshotSchema,
  dispositionSchema,
  freezeAtJudgmentInputSchema,
  frozenDecisionRecordSchema,
  reviewerAttestationError,
  type ActorRole,
  type AwardDeskDecisionId,
  type AwardRegistrySnapshot,
  type Disposition,
  type FrozenDecisionRecordBody,
  type PackInForce,
  type WaiverRef,
} from '@/lib/field-registry/schema'

export const FIELD_REGISTRY_HASH_METHOD = 'sha256:sorted-json-v1' as const

export class FieldRegistryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FieldRegistryError'
  }
}

type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T

/** Runtime-frozen record. Packs in force and both hashes reject later assignment. */
export type FrozenDecisionRecord = DeepReadonly<FrozenDecisionRecordBody>

const awardDeskDecisions: Record<AwardDeskDecisionId, Disposition['decision']> = {
  request: 'request_evidence',
  exception: 'accept_with_exception',
  escalate: 'escalate',
}

/**
 * Same canonical bytes as `canonicalJson` in `lib/trace/fixtures.ts`:
 * object keys sort lexically, array order is preserved, only finite JSON is admitted.
 * Copied here so the registry helper stays free of the Trace fixture module.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(item => canonicalJson(item)).join(',')}]`
  if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const entries = Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`)
    return `{${entries.join(',')}}`
  }
  throw new FieldRegistryError('Field Registry integrity: only finite JSON values are hashable.')
}

export function hashJson(value: unknown) {
  return createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex')
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  return Object.freeze(value)
}

function defaultPipelineStatus() {
  return {
    schemaVersion: 'pipeline-status-v1' as const,
    deterministicFlags: [],
    semanticAnomalyIds: [],
    readiness: 'unknown' as const,
  }
}

function stampPacks(
  packs: readonly { packId: string; version: string; name: string; toggledScope: PackInForce['toggledScope'] }[],
  frozenAt: string,
  frozenBy: string,
): PackInForce[] {
  return packs
    .map(pack => ({
      packId: pack.packId,
      version: pack.version,
      name: pack.name,
      toggledScope: {
        orgDefault: pack.toggledScope.orgDefault,
        showOnRecord: pack.toggledScope.showOnRecord,
        category: pack.toggledScope.category,
      },
      frozenAt,
      frozenBy,
    }))
    .sort((left, right) => left.packId.localeCompare(right.packId))
}

/**
 * Freeze the registry snapshot and the packs that are in force at judgment.
 * Later pack toggles are a different board. They do not rewrite this record.
 * The helper trusts its caller for identity: Platform must pass the server-derived actor and organization.
 */
export function freezeAtJudgment(snapshot: unknown, packs: unknown): FrozenDecisionRecord {
  const parsedSnapshot = awardRegistrySnapshotSchema.parse(structuredClone(snapshot))
  const parsed = freezeAtJudgmentInputSchema.parse(structuredClone(packs))
  const packsInForce = stampPacks(parsed.packs, parsed.frozenAt, parsed.frozenBy)
  const record = {
    schemaVersion: 'frozen-decision-record-v1' as const,
    recordId: parsed.recordId,
    supersedesRecordId: parsed.supersedesRecordId,
    frozenAt: parsed.frozenAt,
    frozenBy: parsed.frozenBy,
    snapshot: parsedSnapshot,
    snapshotHash: hashJson(parsedSnapshot),
    packsHash: hashJson(packsInForce),
    hashMethod: FIELD_REGISTRY_HASH_METHOD,
    packsInForce,
    disposition: parsed.disposition,
    pipelineStatus: parsed.pipelineStatus ?? defaultPipelineStatus(),
  }
  return verifyFrozenRecord(record)
}

/** Recompute hashes. Platform calls this on every read of a stored frozen record. */
export function verifyFrozenRecord(record: unknown): FrozenDecisionRecord {
  const parsed = frozenDecisionRecordSchema.parse(structuredClone(record))
  if (parsed.snapshotHash !== hashJson(parsed.snapshot)) {
    throw new FieldRegistryError('Snapshot hash does not match the frozen snapshot.')
  }
  if (parsed.packsHash !== hashJson(parsed.packsInForce)) {
    throw new FieldRegistryError('Packs hash does not match the frozen packs in force.')
  }
  if (parsed.hashMethod !== FIELD_REGISTRY_HASH_METHOD) {
    throw new FieldRegistryError('Frozen record uses an unknown hash method.')
  }
  if (parsed.disposition.actorId !== parsed.frozenBy || parsed.disposition.timestamp !== parsed.frozenAt) {
    throw new FieldRegistryError('Frozen record actor and time must match the disposition.')
  }
  if (parsed.supersedesRecordId === parsed.recordId) {
    throw new FieldRegistryError('A frozen record cannot supersede itself.')
  }
  for (const pack of parsed.packsInForce) {
    const stamped = pack.frozenAt === parsed.frozenAt && pack.frozenBy === parsed.frozenBy && pack.toggledScope.orgDefault === true
    if (!stamped) {
      throw new FieldRegistryError('Every frozen pack must stay in force under the judgment actor and time.')
    }
  }
  for (const field of parsed.snapshot.fields) {
    const issue = reviewerAttestationError(field)
    if (issue) throw new FieldRegistryError(issue)
  }
  return deepFreeze(parsed) as FrozenDecisionRecord
}

/** Copy a Rule library pack into the freeze input. An explicit org-default off is preserved and then rejected. */
export function packToggleFromRulePack(pack: {
  id: string
  name: string
  version: string
  category: string
  showOnRecord: boolean
  orgDefault?: boolean
}) {
  return {
    packId: pack.id,
    name: pack.name,
    version: pack.version,
    toggledScope: {
      orgDefault: pack.orgDefault ?? true,
      showOnRecord: pack.showOnRecord,
      category: pack.category,
    },
  }
}

export function dispositionFromAwardDeskDecision(input: {
  decision: AwardDeskDecisionId
  actorId: string
  actorRole: ActorRole
  timestamp: string
  rationale: string
  waiverRefs?: WaiverRef[]
}) {
  if (!awardDeskDecisionIds.includes(input.decision)) {
    throw new FieldRegistryError('Unknown Award desk disposition.')
  }
  return dispositionSchema.parse({
    decision: awardDeskDecisions[input.decision],
    waiverRefs: input.waiverRefs ?? [],
    actorId: input.actorId,
    actorRole: input.actorRole,
    timestamp: input.timestamp,
    rationale: input.rationale,
  })
}

export function snapshotHashOf(snapshot: AwardRegistrySnapshot) {
  return hashJson(awardRegistrySnapshotSchema.parse(snapshot))
}
