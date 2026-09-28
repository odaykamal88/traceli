import { integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'

const org = () => text('organization_id').notNull()
const procurement = () => text('procurement_id').notNull()
const at = (name: string) => timestamp(name, { withTimezone: true }).defaultNow().notNull()
const json = (name: string) => jsonb(name).$type<Record<string, unknown>>().notNull()

export const tenderWorkspaces = pgTable('tender_workspaces', {
  organizationId: org(), procurementId: procurement(), ownerId: text('owner_id').notNull(),
  primaryPackId: text('primary_pack_id').notNull(), packVersion: text('pack_version').notNull(),
  currentRevision: integer('current_revision').default(0).notNull(), currentDraftId: text('current_draft_id'),
  currentAssessmentId: text('current_assessment_id'), currentJudgmentId: text('current_judgment_id'), updatedAt: at('updated_at'),
}, t => [primaryKey({ columns: [t.organizationId, t.procurementId] }), index('tender_workspaces_owner_idx').on(t.organizationId,t.ownerId,t.updatedAt)])

export const tenderAccess = pgTable('tender_access', {
  organizationId: org(), procurementId: procurement(), userId: text('user_id').notNull(), access: text('access').notNull(),
  grantedBy: text('granted_by').notNull(), grantedAt: at('granted_at'),
}, t => [primaryKey({ columns: [t.organizationId,t.procurementId,t.userId] }), index('tender_access_user_idx').on(t.organizationId,t.userId,t.procurementId)])

export const tenderManualVersions = pgTable('tender_manual_versions', {
  id: text('id').primaryKey(), organizationId: org(), procurementId: procurement(), ordinal: integer('ordinal').notNull(),
  versionLabel: text('version_label').notNull(), label: text('label').notNull(), originalFilename: text('original_filename').notNull(),
  mediaType: text('media_type').notNull(), byteSize: integer('byte_size').notNull(), sha256: text('sha256').notNull(),
  hashKind: text('hash_kind').notNull(), sourceVersionId: text('source_version_id'), supersedesId: text('supersedes_id'),
  recordedBy: text('recorded_by').notNull(), recordedAt: at('recorded_at'),
}, t => [uniqueIndex('tender_manual_scope_id').on(t.organizationId,t.procurementId,t.id),uniqueIndex('tender_manual_scope_ordinal').on(t.organizationId,t.procurementId,t.ordinal)])

export const tenderPacketReceipts = pgTable('tender_packet_receipts', {
  id: text('id').primaryKey(), organizationId: org(), procurementId: procurement(), packId: text('pack_id').notNull(),
  packVersion: text('pack_version').notNull(), packDefinition: json('pack_definition'), packDefinitionHash: text('pack_definition_hash').notNull(),
  sourceSha256: text('source_sha256').notNull(), originalFilename: text('original_filename').notNull(), mediaType: text('media_type').notNull(),
  byteSize: integer('byte_size').notNull(), providerId: text('provider_id').notNull(), classification: text('classification').notNull(),
  payload: json('payload'), payloadHash: text('payload_hash').notNull(), issuedBy: text('issued_by').notNull(), issuedAt: at('issued_at'),
}, t => [uniqueIndex('tender_packet_scope_id').on(t.organizationId,t.procurementId,t.id),index('tender_packet_receipts_scope_time_idx').on(t.organizationId,t.procurementId,t.issuedAt)])

export const tenderDraftRevisions = pgTable('tender_draft_revisions', {
  id: text('id').primaryKey(), organizationId: org(), procurementId: procurement(), revision: integer('revision').notNull(),
  parentDraftId: text('parent_draft_id'), packetReceiptId: text('packet_receipt_id').notNull(), payload: json('payload'),
  payloadHash: text('payload_hash').notNull(), actorId: text('actor_id').notNull(), createdAt: at('created_at'),
}, t => [uniqueIndex('tender_draft_scope_id').on(t.organizationId,t.procurementId,t.id),uniqueIndex('tender_draft_scope_revision').on(t.organizationId,t.procurementId,t.revision)])

export const tenderDraftManuals = pgTable('tender_draft_manuals', {
  organizationId: org(), procurementId: procurement(), draftId: text('draft_id').notNull(), manualVersionId: text('manual_version_id').notNull(),
}, t => [primaryKey({ columns: [t.organizationId,t.procurementId,t.draftId,t.manualVersionId] })])

export const tenderIssuedRecords = pgTable('tender_issued_records', {
  id: text('id').primaryKey(), organizationId: org(), procurementId: procurement(), kind: text('kind').notNull(),
  draftId: text('draft_id').notNull(), parentRecordId: text('parent_record_id'), payload: json('payload'),
  snapshotHash: text('snapshot_hash').notNull(), packsHash: text('packs_hash').notNull(), payloadHash: text('payload_hash').notNull(),
  issuedBy: text('issued_by').notNull(), issuedAt: at('issued_at'),
}, t => [uniqueIndex('tender_record_scope_id').on(t.organizationId,t.procurementId,t.id),index('tender_issued_records_scope_time_idx').on(t.organizationId,t.procurementId,t.issuedAt)])

export const tenderCommands = pgTable('tender_commands', {
  id: text('id').primaryKey(), organizationId: org(), procurementId: procurement(), actorId: text('actor_id').notNull(),
  action: text('action').notNull(), idempotencyKey: text('idempotency_key').notNull(), inputHash: text('input_hash').notNull(),
  responseId: text('response_id').notNull(), createdAt: at('created_at'),
}, t => [uniqueIndex('tender_command_idempotency').on(t.organizationId,t.action,t.idempotencyKey)])

export const tenderExportReceipts = pgTable('tender_export_receipts', {
  id: text('id').primaryKey(), organizationId: org(), procurementId: procurement(), recordId: text('record_id').notNull(),
  actorId: text('actor_id').notNull(), pdfSha256: text('pdf_sha256').notNull(), exportedAt: at('exported_at'),
})
