import { z } from 'zod'

/**
 * Field Registry v1. Pure validation for award snapshots, packs in force,
 * and the frozen decision record. Persistence, authorization, extraction,
 * and playbook evaluation live with their owners; this module does not
 * read files or decide awards.
 */

export const idSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/)
export const hashSchema = z.string().regex(/^[a-f0-9]{64}$/)
const shortText = z.string().trim().min(1).max(240)
const rationale = z.string().trim().min(20).max(2000)

/**
 * synthetic: fictional desk fixtures.
 * customer: a tenant packet.
 * public-source: mapped from a public primary record, not a customer file.
 */
export const snapshotClassifications = ['synthetic', 'customer', 'public-source'] as const
export const entityKinds = ['award', 'supplier', 'requirement', 'criterion', 'evidence', 'finding'] as const
export const sourceRefKinds = ['page', 'node', 'cell', 'message'] as const
export const verificationMethods = ['unverified', 'adapter_extract', 'human_confirmed', 'deterministic_check'] as const
export const fieldValueStates = ['present', 'missing', 'negative'] as const
export const dispositionDecisions = [
  'request_evidence',
  'accept_with_exception',
  'escalate',
  'accept_assessment',
  'request_rule_review',
  'override_assessment',
  'decline_decision',
] as const
export const actorRoles = [
  'Procurement Officer',
  'Panel Member',
  'Procurement Director',
  'Auditor',
  'Workspace Admin',
] as const
export const readinessLevels = ['unknown', 'red', 'amber', 'green'] as const
export const awardDeskDecisionIds = ['request', 'exception', 'escalate'] as const

export const sourceRefSchema = z.strictObject({
  kind: z.enum(sourceRefKinds),
  id: idSchema,
  label: shortText.optional(),
})

export const fieldProvenanceSchema = z.strictObject({
  sourceFileHash: hashSchema,
  sourceRef: sourceRefSchema,
  extractedAt: z.iso.datetime(),
  confidence: z.number().min(0).max(1),
  verificationMethod: z.enum(verificationMethods),
})

const scalarValue = z.union([z.string().trim().min(1).max(4000), z.number().finite(), z.boolean()])

/** Missing means the packet did not contain the fact. Negative means the packet supports an adverse fact. */
export const fieldValueSchema = z.discriminatedUnion('state', [
  z.strictObject({ state: z.literal('present'), value: scalarValue }),
  z.strictObject({ state: z.literal('missing'), reason: z.string().trim().min(1).max(500) }),
  z.strictObject({ state: z.literal('negative'), value: scalarValue }),
])

export const registryFieldSchema = z.strictObject({
  fieldId: idSchema,
  entityKind: z.enum(entityKinds),
  entityId: idSchema,
  key: z.string().trim().regex(/^[a-z][a-z0-9_.]{0,119}$/),
  value: fieldValueSchema,
  provenance: fieldProvenanceSchema,
})

export const donorRefSchema = z.strictObject({
  donorId: idSchema,
  name: shortText,
})

export const frameworkRefSchema = z.strictObject({
  frameworkId: idSchema,
  name: shortText,
  version: z.string().trim().min(1).max(80),
})

export const awardRegistrySnapshotSchema = z.strictObject({
  schemaVersion: z.literal('award-registry-snapshot-v1'),
  registryVersion: z.number().int().min(1).max(10000),
  classification: z.enum(snapshotClassifications),
  organizationId: idSchema,
  projectId: idSchema,
  awardId: idSchema,
  procurementReference: z.string().trim().min(1).max(80),
  donor: donorRefSchema,
  framework: frameworkRefSchema,
  fields: z.array(registryFieldSchema).max(256),
  asOf: z.iso.datetime(),
}).superRefine((snapshot, ctx) => {
  const fieldIds = snapshot.fields.map(field => field.fieldId)
  if (new Set(fieldIds).size !== fieldIds.length) {
    ctx.addIssue({ code: 'custom', message: 'Field ids must be unique within a snapshot.' })
  }
  const identities = snapshot.fields.map(field => `${field.entityId}\u0000${field.key}`)
  if (new Set(identities).size !== identities.length) {
    ctx.addIssue({ code: 'custom', message: 'Each entity has one value per field key.' })
  }
})

export const toggledScopeSchema = z.strictObject({
  orgDefault: z.literal(true),
  showOnRecord: z.boolean(),
  category: z.string().trim().min(1).max(80),
})

export const packToggleSchema = z.strictObject({
  packId: idSchema,
  version: z.string().trim().min(1).max(80),
  name: shortText,
  toggledScope: toggledScopeSchema,
})

export const packInForceSchema = z.strictObject({
  packId: idSchema,
  version: z.string().trim().min(1).max(80),
  name: shortText,
  toggledScope: toggledScopeSchema,
  frozenAt: z.iso.datetime(),
  frozenBy: idSchema,
})

const waiverDecisions = new Set<string>(['accept_with_exception', 'override_assessment'])

export const waiverRefSchema = z.strictObject({
  waiverId: idSchema,
  authorityRef: idSchema,
})

export const dispositionSchema = z.strictObject({
  decision: z.enum(dispositionDecisions),
  waiverRefs: z.array(waiverRefSchema).max(16),
  actorId: idSchema,
  actorRole: z.enum(actorRoles),
  timestamp: z.iso.datetime(),
  rationale,
}).superRefine((disposition, ctx) => {
  const needsWaiver = waiverDecisions.has(disposition.decision)
  if (needsWaiver && disposition.waiverRefs.length === 0) {
    ctx.addIssue({ code: 'custom', message: 'Exception and override dispositions require a waiver reference.' })
  }
  if (!needsWaiver && disposition.waiverRefs.length > 0) {
    ctx.addIssue({ code: 'custom', message: 'Waiver references belong only on an exception or override.' })
  }
})

export const deterministicFlagSchema = z.strictObject({
  flagId: idSchema,
  code: z.string().trim().min(1).max(80),
  passed: z.boolean(),
})

/**
 * Filled by P4 `evaluateJudgment` (or later P3 playbooks). Omitted at freeze
 * becomes empty flags and readiness `unknown` — the loop has not run.
 */
export const pipelineStatusSchema = z.strictObject({
  schemaVersion: z.literal('pipeline-status-v1'),
  deterministicFlags: z.array(deterministicFlagSchema).max(64),
  semanticAnomalyIds: z.array(idSchema).max(64),
  readiness: z.enum(readinessLevels),
})

export const freezeAtJudgmentInputSchema = z.strictObject({
  recordId: idSchema,
  supersedesRecordId: idSchema.nullable(),
  frozenAt: z.iso.datetime(),
  frozenBy: idSchema,
  packs: z.array(packToggleSchema).max(64),
  disposition: dispositionSchema,
  pipelineStatus: pipelineStatusSchema.optional(),
}).superRefine((input, ctx) => {
  if (input.disposition.actorId !== input.frozenBy) {
    ctx.addIssue({ code: 'custom', message: 'Disposition actor must be the freeze actor.' })
  }
  if (input.disposition.timestamp !== input.frozenAt) {
    ctx.addIssue({ code: 'custom', message: 'Disposition timestamp must be the freeze time.' })
  }
  if (input.supersedesRecordId === input.recordId) {
    ctx.addIssue({ code: 'custom', message: 'A frozen record cannot supersede itself.' })
  }
  const packIds = input.packs.map(pack => pack.packId)
  if (new Set(packIds).size !== packIds.length) {
    ctx.addIssue({ code: 'custom', message: 'Pack ids must be unique at freeze.' })
  }
})

export const frozenDecisionRecordSchema = z.strictObject({
  schemaVersion: z.literal('frozen-decision-record-v1'),
  recordId: idSchema,
  supersedesRecordId: idSchema.nullable(),
  frozenAt: z.iso.datetime(),
  frozenBy: idSchema,
  snapshot: awardRegistrySnapshotSchema,
  snapshotHash: hashSchema,
  packsHash: hashSchema,
  hashMethod: z.literal('sha256:sorted-json-v1'),
  packsInForce: z.array(packInForceSchema).max(64),
  disposition: dispositionSchema,
  pipelineStatus: pipelineStatusSchema,
})

/**
 * Kind hints are for later alignment onto registry fields.
 * They are optional, closed, and vendor-neutral. A provider-specific payload is not a kind.
 */
export const fragmentKindHints = [
  'text',
  'pricing_table',
  'waiver',
  'email_header',
  'capacity_letter',
  'annex',
] as const

export const fragmentSpanSchema = z.strictObject({
  text: z.string().min(1).max(4000),
  label: z.string().trim().min(1).max(80).optional(),
})

export const fragmentSchema = z.strictObject({
  fragmentId: idSchema,
  sourceFileHash: hashSchema,
  sourceRef: sourceRefSchema,
  text: z.string().min(1).max(16000),
  extractedAt: z.iso.datetime(),
  confidence: z.number().min(0).max(1),
  extractorId: idSchema,
  kind: z.enum(fragmentKindHints).optional(),
  tags: z.array(z.string().trim().regex(/^[a-z][a-z0-9_]{0,63}$/)).max(16).optional(),
  spans: z.array(fragmentSpanSchema).max(32).optional(),
})

export type SourceRef = z.infer<typeof sourceRefSchema>
export type FieldProvenance = z.infer<typeof fieldProvenanceSchema>
export type FieldValue = z.infer<typeof fieldValueSchema>
export type RegistryField = z.infer<typeof registryFieldSchema>
export type AwardRegistrySnapshot = z.infer<typeof awardRegistrySnapshotSchema>
export type ToggledScope = z.infer<typeof toggledScopeSchema>
export type PackToggle = z.infer<typeof packToggleSchema>
export type PackInForce = z.infer<typeof packInForceSchema>
export type WaiverRef = z.infer<typeof waiverRefSchema>
export type Disposition = z.infer<typeof dispositionSchema>
export type PipelineStatus = z.infer<typeof pipelineStatusSchema>
export type FreezeAtJudgmentInput = z.infer<typeof freezeAtJudgmentInputSchema>
export type FrozenDecisionRecordBody = z.infer<typeof frozenDecisionRecordSchema>
export type FragmentKindHint = (typeof fragmentKindHints)[number]
export type FragmentSpan = z.infer<typeof fragmentSpanSchema>
export type Fragment = z.infer<typeof fragmentSchema>
export type AwardDeskDecisionId = (typeof awardDeskDecisionIds)[number]
export type ActorRole = (typeof actorRoles)[number]
