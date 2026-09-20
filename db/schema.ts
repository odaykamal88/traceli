import { sql } from 'drizzle-orm'
import * as hqSchema from '@/db/hq-schema'
import {
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const procurements = pgTable(
  'procurements',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id),
    reference: text('reference').notNull(),
    title: text('title').notNull(),
    region: text('region').notNull(),
    status: text('status').notNull(),
    evidenceCoverage: integer('evidence_coverage').default(0).notNull(),
    blockerSummary: text('blocker_summary').notNull(),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('procurements_org_id_id_unique').on(table.organizationId, table.id),
    uniqueIndex('procurements_org_reference_unique').on(table.organizationId, table.reference),
    index('procurements_org_updated_idx').on(table.organizationId, table.updatedAt),
  ],
)

export const sourceDocuments = pgTable(
  'source_documents',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id),
    procurementId: text('procurement_id').notNull(),
    name: text('name').notNull(),
    kind: text('kind').notNull(),
    accessBoundary: text('access_boundary').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('source_documents_org_id_id_unique').on(table.organizationId, table.id),
    index('source_documents_procurement_idx').on(table.organizationId, table.procurementId),
    foreignKey({
      columns: [table.organizationId, table.procurementId],
      foreignColumns: [procurements.organizationId, procurements.id],
      name: 'source_documents_procurement_tenant_fk',
    }),
  ],
)

export const sourceVersions = pgTable(
  'source_versions',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id),
    sourceDocumentId: text('source_document_id').notNull(),
    versionLabel: text('version_label').notNull(),
    contentHash: text('content_hash').notNull(),
    effectiveAt: timestamp('effective_at', { withTimezone: true }),
    effectiveDateStatus: text('effective_date_status').default('legacy_unverified').notNull(),
    effectiveDateBasis: text('effective_date_basis'),
    effectiveDateUnknownReason: text('effective_date_unknown_reason').default('Legacy date has no retained verification basis.'),
    contentHashKind: text('content_hash_kind').default('metadata_unverified').notNull(),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('source_versions_org_id_id_unique').on(table.organizationId, table.id),
    index('source_versions_source_idx').on(table.organizationId, table.sourceDocumentId),
    foreignKey({
      columns: [table.organizationId, table.sourceDocumentId],
      foreignColumns: [sourceDocuments.organizationId, sourceDocuments.id],
      name: 'source_versions_source_tenant_fk',
    }),
  ],
)

export const requirements = pgTable(
  'requirements',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id),
    procurementId: text('procurement_id').notNull(),
    sourceVersionId: text('source_version_id').notNull(),
    code: text('code').notNull(),
    title: text('title').notNull(),
    sourceAnchor: text('source_anchor').notNull(),
    state: text('state').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('requirements_org_id_id_unique').on(table.organizationId, table.id),
    uniqueIndex('requirements_org_procurement_code_unique').on(
      table.organizationId,
      table.procurementId,
      table.code,
    ),
    foreignKey({
      columns: [table.organizationId, table.procurementId],
      foreignColumns: [procurements.organizationId, procurements.id],
      name: 'requirements_procurement_tenant_fk',
    }),
    foreignKey({
      columns: [table.organizationId, table.sourceVersionId],
      foreignColumns: [sourceVersions.organizationId, sourceVersions.id],
      name: 'requirements_source_version_tenant_fk',
    }),
  ],
)

export const findings = pgTable(
  'findings',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id),
    procurementId: text('procurement_id').notNull(),
    requirementId: text('requirement_id').notNull(),
    supplierName: text('supplier_name').notNull(),
    status: text('status').notNull(),
    humanDetermination: text('human_determination'),
    reviewerId: text('reviewer_id'),
    reviewerName: text('reviewer_name'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('findings_org_id_id_unique').on(table.organizationId, table.id),
    index('findings_procurement_status_idx').on(
      table.organizationId,
      table.procurementId,
      table.status,
    ),
    foreignKey({
      columns: [table.organizationId, table.procurementId],
      foreignColumns: [procurements.organizationId, procurements.id],
      name: 'findings_procurement_tenant_fk',
    }),
    foreignKey({
      columns: [table.organizationId, table.requirementId],
      foreignColumns: [requirements.organizationId, requirements.id],
      name: 'findings_requirement_tenant_fk',
    }),
  ],
)

export const decisions = pgTable(
  'decisions',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id),
    procurementId: text('procurement_id').notNull(),
    state: text('state').notNull(),
    version: integer('version').default(1).notNull(),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    rootHash: text('root_hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('decisions_org_id_id_unique').on(table.organizationId, table.id),
    uniqueIndex('decisions_org_procurement_unique').on(table.organizationId, table.procurementId),
    foreignKey({
      columns: [table.organizationId, table.procurementId],
      foreignColumns: [procurements.organizationId, procurements.id],
      name: 'decisions_procurement_tenant_fk',
    }),
  ],
)

export const auditEvents = pgTable(
  'audit_events',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id),
    procurementId: text('procurement_id').notNull(),
    sequence: integer('sequence').notNull(),
    eventType: text('event_type').notNull(),
    actorId: text('actor_id').notNull(),
    actorName: text('actor_name').notNull(),
    sourceLabel: text('source_label').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
    previousHash: text('previous_hash'),
    eventHash: text('event_hash').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('audit_events_org_procurement_sequence_unique').on(
      table.organizationId,
      table.procurementId,
      table.sequence,
    ),
    index('audit_events_org_occurred_idx').on(table.organizationId, table.occurredAt),
    foreignKey({
      columns: [table.organizationId, table.procurementId],
      foreignColumns: [procurements.organizationId, procurements.id],
      name: 'audit_events_procurement_tenant_fk',
    }),
  ],
)

export const outboxEvents = pgTable(
  'outbox_events',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id),
    aggregateType: text('aggregate_type').notNull(),
    aggregateId: text('aggregate_id').notNull(),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
  },
  (table) => [
    index('outbox_events_unpublished_idx').on(table.organizationId, table.publishedAt),
  ],
)

export const schema = {
  ...hqSchema,
  organizations,
  procurements,
  sourceDocuments,
  sourceVersions,
  requirements,
  findings,
  decisions,
  auditEvents,
  outboxEvents,
}
