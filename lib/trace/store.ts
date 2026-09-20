import 'server-only'

import { randomUUID } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { withTenant, type TenantTransaction } from '@/lib/db/tenant'
import { appendAuditEvent } from '@/lib/domain/audit-events'
import type { WorkspaceViewer } from '@/lib/workspace-viewer'
import { hasWorkspaceReadRole } from '@/lib/workspace-policy'
import { decisionInputSchema, humanDecisionSchema, scenarioSchema, type TraceUnit, type HumanDecision } from '@/lib/trace/contract'
import { buildTraceUnit, hashJson, validateTraceUnit, validateHumanDecision } from '@/lib/trace/fixtures'
import { buildTraceExport } from '@/lib/trace/export'

export class TraceStoreError extends Error {
  code: 'invalid' | 'denied' | 'not_found' | 'stale' | 'idempotency_conflict'
  constructor(code: TraceStoreError['code'], message: string) {
    super(message)
    this.code = code
    this.name = 'TraceStoreError'
  }
}
export { TraceStoreError as TraceError }

const uuid = z.uuid()
const hash = z.string().regex(/^[0-9a-f]{64}$/)
const idempotency = z.string().min(16).max(100).regex(/^[a-zA-Z0-9_-]+$/)
const createInput = z.strictObject({ scenario: scenarioSchema, idempotencyKey: idempotency, previousUnitId: uuid.optional(), expectedUnitHash: hash.optional(), expectedSequence: z.number().int().min(0).optional(), revisionKind: z.enum(['evidence', 'source_correction']).optional() })
const grantInput = z.strictObject({ unitId: uuid, expectedUnitHash: hash, expectedSequence: z.number().int().min(0), mode: z.enum(['redacted', 'full']), purpose: z.string().trim().min(10).max(200), idempotencyKey: idempotency })
const writeRoles = new Set(['Procurement Officer', 'Procurement Director', 'Workspace Admin'])
const elevatedRoles = new Set(['Procurement Director', 'Workspace Admin'])
export type TraceRecord = { unit: TraceUnit; artifactHash: string; decisions: HumanDecision[]; decisionSequence: number; supersededBy: string | null }
export type TraceGrant = { id: string; unitId: string; artifactHash: string; decisionSequence: number; mode: 'redacted' | 'full'; purpose: string; createdAt: string; expiresAt: string }

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input)
  if (!result.success) throw new TraceStoreError('invalid', 'Check the supplied fields and try again.')
  return result.data
}
function authorize(viewer: WorkspaceViewer, write = false, elevated = false) {
  if (!viewer || !viewer.id || !/^org_[a-zA-Z0-9_-]+$/.test(viewer.organizationId) || !hasWorkspaceReadRole(viewer.role) || (write && !writeRoles.has(viewer.role)) || (elevated && !elevatedRoles.has(viewer.role))) {
    throw new TraceStoreError('denied', 'This action is not available with your current access.')
  }
}
function missing(): never { throw new TraceStoreError('not_found', 'This Trace record is unavailable.') }
function stale(): never { throw new TraceStoreError('stale', 'This record changed. Reload the latest version before continuing.') }
async function lock(transaction: TenantTransaction, key: string) { await transaction.execute(sql`select pg_advisory_xact_lock(hashtextextended(${key}, 0))`) }
async function audit(transaction: TenantTransaction, viewer: WorkspaceViewer, procurementId: string, eventType: string, payload: Record<string, unknown>) {
  await appendAuditEvent(transaction, { viewer, procurementId, eventType, sourceLabel: 'Synthetic Trace workflow', payload })
}
async function getRecord(transaction: TenantTransaction, id: string): Promise<TraceRecord> {
  const result = await transaction.execute(sql`select id, organization_id, procurement_id, artifact_hash, actor_id, payload from trace_units where id = ${id}`)
  const row = result.rows[0]
  if (!row) missing()
  let unit: TraceUnit
  try { unit = validateTraceUnit(row.payload) } catch { throw new TraceStoreError('invalid', 'The retained Trace record failed integrity verification.') }
  if (unit.id !== row.id || unit.organizationId !== row.organization_id || unit.procurementId !== row.procurement_id || unit.artifactHash !== row.artifact_hash || unit.createdBy !== row.actor_id) throw new TraceStoreError('invalid', 'The retained Trace record failed integrity verification.')
  const [decisionRows, successorRows] = await Promise.all([
    transaction.execute(sql`select id, organization_id, procurement_id, unit_id, sequence, payload from trace_human_decisions where unit_id = ${id} order by sequence`),
    transaction.execute(sql`select id from trace_units where previous_unit_id = ${id} limit 1`),
  ])
  const decisions = decisionRows.rows.map((entry, index) => {
    let decision: HumanDecision
    try { decision = validateHumanDecision(entry.payload, unit) } catch { throw new TraceStoreError('invalid', 'The retained human decision failed integrity verification.') }
    if (decision.id !== entry.id || decision.organizationId !== entry.organization_id || decision.procurementId !== entry.procurement_id || decision.unitId !== entry.unit_id || decision.sequence !== entry.sequence) throw new TraceStoreError('invalid', 'The retained human decision failed integrity verification.')
    const { hash: retainedHash, ...material } = decision
    if (retainedHash !== hashJson(material) || decision.unitId !== unit.id || decision.organizationId !== unit.organizationId || decision.procurementId !== unit.procurementId || decision.unitHash !== unit.artifactHash || decision.inputHash !== unit.inputHash || decision.policyHash !== unit.policyAssessment.hash || decision.sequence !== index + 1 || decision.supersedesId !== (index ? decisionRows.rows[index - 1].id : null)) throw new TraceStoreError('invalid', 'The retained human decision failed integrity verification.')
    return decision
  })
  return { unit, artifactHash: unit.artifactHash, decisions, decisionSequence: decisions.length, supersededBy: (successorRows.rows[0]?.id as string | undefined) ?? null }
}
async function getLockedRecord(transaction: TenantTransaction, id: string) {
  const initial = await transaction.execute(sql`select procurement_id from trace_units where id = ${id}`)
  if (!initial.rows[0]) missing()
  await lock(transaction, initial.rows[0].procurement_id as string)
  return getRecord(transaction, id)
}
function expectCurrent(record: TraceRecord, expectedHash: string, expectedSequence: number) {
  if (record.supersededBy || record.artifactHash !== expectedHash || record.decisionSequence !== expectedSequence) stale()
}
async function replay(transaction: TenantTransaction, viewer: WorkspaceViewer, action: string, key: string, command: unknown) {
  await lock(transaction, `${viewer.organizationId}:trace:${action}:${key}`)
  const inputHash = hashJson({ organizationId: viewer.organizationId, actorId: viewer.id, actorRole: viewer.role, action, command })
  const result = await transaction.execute(sql`select input_hash, actor_id, response_id from trace_commands where action = ${action} and idempotency_key = ${key}`)
  if (result.rows[0] && (result.rows[0].input_hash !== inputHash || result.rows[0].actor_id !== viewer.id)) throw new TraceStoreError('idempotency_conflict', 'This request key was already used for different input. Start a new action.')
  return { inputHash, responseId: result.rows[0]?.response_id as string | undefined }
}
async function saveCommand(transaction: TenantTransaction, viewer: WorkspaceViewer, procurementId: string, action: string, key: string, inputHash: string, responseId: string) {
  await transaction.execute(sql`insert into trace_commands (id, organization_id, procurement_id, actor_id, action, idempotency_key, input_hash, response_id) values (${randomUUID()}, ${viewer.organizationId}, ${procurementId}, ${viewer.id}, ${action}, ${key}, ${inputHash}, ${responseId})`)
}
export async function listTraceUnits(viewer: WorkspaceViewer): Promise<TraceRecord[]> {
  authorize(viewer)
  return withTenant(viewer.organizationId, async transaction => {
    const rows = await transaction.execute(sql`select id from trace_units order by created_at desc, id desc limit 40`)
    const records: TraceRecord[] = []
    for (const row of rows.rows) records.push(await getRecord(transaction, row.id as string))
    return records
  }, 'read only')
}
export async function readTraceUnit(viewer: WorkspaceViewer, id: string): Promise<TraceRecord> {
  authorize(viewer)
  return withTenant(viewer.organizationId, transaction => getRecord(transaction, parse(uuid, id)), 'read only')
}
export async function createTraceUnit(viewer: WorkspaceViewer, input: unknown): Promise<TraceRecord> {
  authorize(viewer, true)
  const command = parse(createInput, input)
  if (command.previousUnitId ? command.expectedUnitHash === undefined || command.expectedSequence === undefined : command.expectedUnitHash !== undefined || command.expectedSequence !== undefined || command.revisionKind !== undefined) throw new TraceStoreError('invalid', 'A revision must identify the exact previous version and review sequence.')
  return withTenant(viewer.organizationId, async transaction => {
    const prior = await replay(transaction, viewer, 'create_unit', command.idempotencyKey, command)
    if (prior.responseId) return getRecord(transaction, prior.responseId)
    const previous = command.previousUnitId ? await getLockedRecord(transaction, command.previousUnitId) : null
    if (previous) {
      expectCurrent(previous, command.expectedUnitHash!, command.expectedSequence!)
      if ((command.revisionKind === 'source_correction' && command.scenario !== previous.unit.scenario) || (command.revisionKind !== 'source_correction' && command.scenario !== 'satisfied')) throw new TraceStoreError('invalid', 'Choose the fixed signed-note revision or preserve the scenario when correcting its source.')
    }
    const procurementId = previous?.unit.procurementId ?? randomUUID()
    if (!previous) {
      await lock(transaction, procurementId)
      await transaction.execute(sql`insert into procurements (id, organization_id, reference, title, region, status, blocker_summary) values (${procurementId}, ${viewer.organizationId}, ${`TRACE-${procurementId}`}, 'Fictional Trace review case', 'Synthetic fixture', 'review', 'Synthetic evidence; no real procurement authorization')`)
    }
    const unit = buildTraceUnit({ id: randomUUID(), organizationId: viewer.organizationId, procurementId, actorId: viewer.id, scenario: command.scenario, revisionKind: command.revisionKind, previousUnit: previous?.unit, previousUnitId: previous?.unit.id, version: (previous?.unit.version ?? 0) + 1 })
    validateTraceUnit(unit)
    await transaction.execute(sql`insert into trace_units (id, organization_id, procurement_id, previous_unit_id, version, artifact_hash, payload, actor_id) values (${unit.id}, ${viewer.organizationId}, ${procurementId}, ${previous?.unit.id ?? null}, ${unit.version}, ${unit.artifactHash}, ${JSON.stringify(unit)}::jsonb, ${viewer.id})`)
    await audit(transaction, viewer, procurementId, previous ? 'trace.unit_revised' : 'trace.unit_created', { unitId: unit.id, artifactHash: unit.artifactHash, previousUnitId: previous?.unit.id ?? null, synthetic: true })
    await saveCommand(transaction, viewer, procurementId, 'create_unit', command.idempotencyKey, prior.inputHash, unit.id)
    return { unit, artifactHash: unit.artifactHash, decisions: [], decisionSequence: 0, supersededBy: null }
  })
}
export async function recordTraceDecision(viewer: WorkspaceViewer, input: unknown): Promise<HumanDecision> {
  authorize(viewer, true)
  const command = parse(decisionInputSchema, input)
  if (command.action === 'override_assessment') authorize(viewer, true, true)
  return withTenant(viewer.organizationId, async transaction => {
    const prior = await replay(transaction, viewer, 'human_decision', command.idempotencyKey, command)
    if (prior.responseId) {
      const record = await getRecord(transaction, command.unitId)
      return record.decisions.find(decision => decision.id === prior.responseId) ?? missing()
    }
    const record = await getLockedRecord(transaction, command.unitId)
    expectCurrent(record, command.expectedUnitHash, command.expectedSequence)
    if (command.expectedInputHash !== record.unit.inputHash || command.expectedPolicyHash !== record.unit.policyAssessment.hash) stale()
    if (command.citedEvidenceIds.some(id => !record.unit.evidenceSnapshot.assertions.some(assertion => assertion.id === id))) throw new TraceStoreError('invalid', 'Cited evidence must belong to this exact Trace version.')
    const material = {
      id: randomUUID(), unitId: record.unit.id, organizationId: viewer.organizationId, procurementId: record.unit.procurementId,
      sequence: record.decisionSequence + 1, version: record.decisionSequence + 1, classification: 'synthetic', createdBy: viewer.id, sourceJobId: 'trace-synthetic-v1', recordState: 'draft', supersedesId: record.decisions.at(-1)?.id ?? null, actorId: viewer.id, actorRole: viewer.role, action: command.action, rationale: command.rationale,
      createdAt: new Date().toISOString(), unitHash: record.artifactHash, inputHash: record.unit.inputHash, policyHash: record.unit.policyAssessment.hash,
      citedEvidenceIds: command.citedEvidenceIds, authorityRef: command.authorityRef, originalOutcome: record.unit.policyAssessment.result,
    }
    const decision = parse(humanDecisionSchema, { ...material, hash: hashJson(material) })
    validateHumanDecision(decision, record.unit)
    await transaction.execute(sql`insert into trace_human_decisions (id, organization_id, procurement_id, unit_id, sequence, payload) values (${decision.id}, ${viewer.organizationId}, ${record.unit.procurementId}, ${record.unit.id}, ${decision.sequence}, ${JSON.stringify(decision)}::jsonb)`)
    await audit(transaction, viewer, record.unit.procurementId, 'trace.human_decision', { unitId: record.unit.id, decisionId: decision.id, sequence: decision.sequence, action: decision.action, decisionHash: decision.hash })
    await saveCommand(transaction, viewer, record.unit.procurementId, 'human_decision', command.idempotencyKey, prior.inputHash, decision.id)
    return decision
  })
}
function grantFromRow(row: Record<string, unknown>): TraceGrant {
  return { id: row.id as string, unitId: row.unit_id as string, artifactHash: row.artifact_hash as string, decisionSequence: row.decision_sequence as number, mode: row.mode as 'full' | 'redacted', purpose: row.purpose as string, createdAt: new Date(row.created_at as string).toISOString(), expiresAt: new Date(row.expires_at as string).toISOString() }
}
export async function createTraceExport(viewer: WorkspaceViewer, input: unknown): Promise<TraceGrant> {
  authorize(viewer)
  const command = parse(grantInput, input)
  if (command.mode === 'full') authorize(viewer, false, true)
  return withTenant(viewer.organizationId, async transaction => {
    const prior = await replay(transaction, viewer, 'export_grant', command.idempotencyKey, command)
    if (prior.responseId) {
      const existing = await transaction.execute(sql`select * from trace_export_grants where id = ${prior.responseId} and recipient_id = ${viewer.id}`)
      return existing.rows[0] ? grantFromRow(existing.rows[0]) : missing()
    }
    const record = await getLockedRecord(transaction, command.unitId)
    expectCurrent(record, command.expectedUnitHash, command.expectedSequence)
    if (record.decisionSequence === 0) throw new TraceStoreError('invalid', 'Record a human decision before creating an export.')
    const now = new Date()
    const expires = new Date(now.getTime() + 15 * 60 * 1000)
    const id = randomUUID()
    const result = await transaction.execute(sql`insert into trace_export_grants (id, organization_id, procurement_id, unit_id, artifact_hash, decision_sequence, recipient_id, mode, purpose, created_at, expires_at) values (${id}, ${viewer.organizationId}, ${record.unit.procurementId}, ${record.unit.id}, ${record.artifactHash}, ${record.decisionSequence}, ${viewer.id}, ${command.mode}, ${command.purpose}, ${now.toISOString()}, ${expires.toISOString()}) returning *`)
    await audit(transaction, viewer, record.unit.procurementId, 'trace.export_granted', { grantId: id, unitId: record.unit.id, mode: command.mode, decisionSequence: record.decisionSequence, expiresAt: expires.toISOString() })
    await saveCommand(transaction, viewer, record.unit.procurementId, 'export_grant', command.idempotencyKey, prior.inputHash, id)
    return grantFromRow(result.rows[0])
  })
}
export async function downloadTraceExport(viewer: WorkspaceViewer, grantId: string) {
  authorize(viewer)
  const id = parse(uuid, grantId)
  return withTenant(viewer.organizationId, async transaction => {
    const result = await transaction.execute(sql`select * from trace_export_grants where id = ${id} and recipient_id = ${viewer.id}`)
    const row = result.rows[0]
    if (!row) missing()
    const grant = grantFromRow(row)
    if (grant.mode === 'full') authorize(viewer, false, true)
    const record = await getLockedRecord(transaction, grant.unitId)
    expectCurrent(record, grant.artifactHash, grant.decisionSequence)
    const revocations = await transaction.execute(sql`select id from trace_export_revocations where grant_id = ${id}`)
    if (Date.parse(grant.expiresAt) <= Date.now() || revocations.rowCount) throw new TraceStoreError('denied', 'This download has expired or been revoked. Create a new export.')
    const payload = buildTraceExport({ unit: record.unit, decisions: record.decisions, mode: grant.mode, grantId: grant.id, grant: { recipientId: viewer.id, purpose: grant.purpose, grantedAt: grant.createdAt, expiresAt: grant.expiresAt }, createdAt: new Date().toISOString() })
    const receiptId = randomUUID()
    await transaction.execute(sql`insert into trace_export_receipts (id, organization_id, procurement_id, unit_id, grant_id, recipient_id, payload_hash) values (${receiptId}, ${viewer.organizationId}, ${record.unit.procurementId}, ${record.unit.id}, ${grant.id}, ${viewer.id}, ${payload.payloadHash})`)
    await audit(transaction, viewer, record.unit.procurementId, 'trace.export_downloaded', { receiptId, grantId: grant.id, unitId: record.unit.id, payloadHash: payload.payloadHash, mode: grant.mode })
    return payload
  })
}
export async function revokeTraceExport(viewer: WorkspaceViewer, grantId: string): Promise<{ revoked: true }> {
  authorize(viewer)
  const id = parse(uuid, grantId)
  return withTenant(viewer.organizationId, async transaction => {
    const result = await transaction.execute(sql`select * from trace_export_grants where id = ${id} and recipient_id = ${viewer.id}`)
    const row = result.rows[0]
    if (!row) missing()
    await lock(transaction, row.procurement_id as string)
    const existing = await transaction.execute(sql`select id from trace_export_revocations where grant_id = ${id}`)
    if (!existing.rowCount) {
      await transaction.execute(sql`insert into trace_export_revocations (id, organization_id, procurement_id, grant_id, actor_id) values (${randomUUID()}, ${viewer.organizationId}, ${row.procurement_id}, ${id}, ${viewer.id})`)
      await audit(transaction, viewer, row.procurement_id as string, 'trace.export_revoked', { grantId: id, unitId: row.unit_id })
    }
    return { revoked: true }
  })
}
