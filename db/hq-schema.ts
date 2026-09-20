import { bigint, integer, jsonb, numeric, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'

// SQL migration 0003 owns foreign keys, RLS, role grants, checks and mutation guards.
// These models expose the same columns to the existing typed database foundation.
const org = () => text('organization_id').notNull()
const at = (name:string) => timestamp(name,{withTimezone:true}).defaultNow().notNull()
const document = (name:string) => jsonb(name).$type<Record<string,unknown>>()

export const hqScopes=pgTable('hq_scopes',{
  organizationId:org(),id:text('id').notNull(),kind:text('kind').notNull(),mandateId:text('mandate_id'),name:text('name').notNull(),definition:document('definition').notNull(),createdAt:at('created_at'),
},t=>[primaryKey({columns:[t.organizationId,t.id]})])
export const hqJobs=pgTable('hq_jobs',{
  organizationId:org(),id:text('id').notNull(),mandateId:text('mandate_id').notNull(),sourceSystem:text('source_system').notNull(),externalId:text('external_id'),objective:text('objective').notNull(),contract:document('contract').notNull(),approvalLevel:text('approval_level').notNull(),status:text('status').notNull(),attempts:integer('attempts').notNull(),maxAttempts:integer('max_attempts').notNull(),leaseToken:text('lease_token'),leaseUntil:timestamp('lease_until',{withTimezone:true}),workerId:text('worker_id'),result:document('result'),reviewerId:text('reviewer_id'),reviewEvidence:text('review_evidence'),createdAt:at('created_at'),updatedAt:at('updated_at'),
},t=>[primaryKey({columns:[t.organizationId,t.id]})])
export const hqRuns=pgTable('hq_runs',{
  organizationId:org(),id:text('id').notNull(),jobId:text('job_id').notNull(),mandateId:text('mandate_id').notNull(),attempt:integer('attempt').notNull(),workerId:text('worker_id').notNull(),leaseToken:text('lease_token').notNull(),leaseUntil:timestamp('lease_until',{withTimezone:true}).notNull(),status:text('status').notNull(),startedAt:at('started_at'),finishedAt:timestamp('finished_at',{withTimezone:true}),result:document('result'),costUsd:numeric('cost_usd',{precision:14,scale:6}),inputTokens:bigint('input_tokens',{mode:'bigint'}),outputTokens:bigint('output_tokens',{mode:'bigint'}),
},t=>[primaryKey({columns:[t.organizationId,t.id]})])
export const hqMemoryProposals=pgTable('hq_memory_proposals',{
  organizationId:org(),id:text('id').notNull(),scopeId:text('scope_id').notNull(),memoryKey:text('memory_key').notNull(),baseVersion:integer('base_version').notNull(),authorId:text('author_id').notNull(),jobId:text('job_id'),content:text('content').notNull(),contentHash:text('content_hash').notNull(),evidenceRefs:jsonb('evidence_refs').$type<string[]>().notNull(),knowledgeKind:text('knowledge_kind').notNull(),classification:text('classification').notNull(),createdAt:at('created_at'),
},t=>[primaryKey({columns:[t.organizationId,t.id]})])
export const hqMemoryReviews=pgTable('hq_memory_reviews',{
  organizationId:org(),id:text('id').notNull(),proposalId:text('proposal_id').notNull(),reviewerId:text('reviewer_id').notNull(),decision:text('decision').notNull(),contentHash:text('content_hash').notNull(),rationale:text('rationale').notNull(),createdAt:at('created_at'),
},t=>[primaryKey({columns:[t.organizationId,t.id]})])
export const hqMemoryVersions=pgTable('hq_memory_versions',{
  organizationId:org(),scopeId:text('scope_id').notNull(),memoryKey:text('memory_key').notNull(),version:integer('version').notNull(),proposalId:text('proposal_id').notNull(),reviewId:text('review_id').notNull(),promotedBy:text('promoted_by').notNull(),content:text('content').notNull(),contentHash:text('content_hash').notNull(),createdAt:at('created_at'),
},t=>[primaryKey({columns:[t.organizationId,t.scopeId,t.memoryKey,t.version]})])
export const hqDecisionLedger=pgTable('hq_decision_ledger',{
  organizationId:org(),id:text('id').notNull(),actorId:text('actor_id').notNull(),approvalLevel:text('approval_level').notNull(),decision:text('decision').notNull(),rationale:text('rationale').notNull(),evidenceRefs:jsonb('evidence_refs').$type<string[]>().notNull(),supersedesId:text('supersedes_id'),recordedAt:at('recorded_at'),
},t=>[primaryKey({columns:[t.organizationId,t.id]})])
export const hqEvents=pgTable('hq_events',{
  organizationId:org(),id:text('id').notNull(),mandateId:text('mandate_id').notNull(),jobId:text('job_id'),actorId:text('actor_id').notNull(),eventType:text('event_type').notNull(),evidence:document('evidence').notNull(),occurredAt:at('occurred_at'),
},t=>[primaryKey({columns:[t.organizationId,t.id]})])
