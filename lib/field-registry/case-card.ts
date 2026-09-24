import 'server-only'

import { z } from 'zod'

import { verifyFrozenRecord, type FrozenDecisionRecord } from '@/lib/field-registry/freeze'
import {
  awardRegistrySnapshotSchema,
  frozenDecisionRecordSchema,
  hashSchema,
  idSchema,
  readinessLevels,
  type AwardRegistrySnapshot,
} from '@/lib/field-registry/schema'

/**
 * Public Case Card export. Composes the frozen decision record instead of
 * copying it. A fixture leaves the freeze slot empty so no hash is invented.
 */

const shortText = z.string().trim().min(1).max(240)
const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const fieldKeySchema = z.string().trim().regex(/^[a-z][a-z0-9_.]{0,119}$/)
const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const caseCardRecordKinds = ['fixture', 'frozen'] as const
export const caseCardPublicationStates = ['awaiting_founder_freeze', 'published'] as const
export const caseCardPackScopes = ['finding-slice', 'full-pack'] as const
export const patternTicketStatuses = ['stub', 'proposed', 'accepted'] as const

export const patternTicketSchema = z.strictObject({
  schemaVersion: z.literal('pattern-ticket-v1'),
  ticketId: idSchema,
  title: shortText,
  statement: z.string().trim().min(20).max(800),
  status: z.enum(patternTicketStatuses),
  packId: idSchema,
  ruleId: idSchema.nullable(),
  fieldKey: fieldKeySchema.nullable(),
  sourceCaseSlugs: z.array(slugSchema).min(1).max(16),
})

const findingSchema = z.strictObject({
  findingId: idSchema,
  title: shortText,
  summary: z.string().trim().min(20).max(1000),
  sourceLabel: shortText,
})

const sourceSchema = z.strictObject({
  sourceId: idSchema,
  title: shortText,
  publisher: shortText,
  url: z.string().url(),
  publishedOn: daySchema,
  locator: shortText,
})

const packRefSchema = z.strictObject({
  packId: idSchema,
  version: z.string().trim().min(1).max(80),
  name: shortText,
})

export const caseCardExportSchema = z.strictObject({
  schemaVersion: z.literal('case-card-export-v1'),
  frozenRecordSchemaVersion: z.literal('frozen-decision-record-v1'),
  product: z.literal('Trace-li'),
  slug: slugSchema,
  title: shortText,
  lede: z.string().trim().min(20).max(400),
  caseId: idSchema,
  recordKind: z.enum(caseCardRecordKinds),
  publicationState: z.enum(caseCardPublicationStates),
  statusLabel: shortText,
  packScope: z.enum(caseCardPackScopes),
  packsStamped: z.boolean(),
  packsInForce: z.array(packRefSchema).min(1).max(64),
  readiness: z.enum(readinessLevels).nullable(),
  readinessNote: z.string().trim().min(20).max(500),
  dispositionSummary: z.string().trim().min(20).max(2200),
  frozenRecordId: idSchema.nullable(),
  snapshotHash: hashSchema.nullable(),
  packsHash: hashSchema.nullable(),
  hashMethod: z.literal('sha256:sorted-json-v1').nullable(),
  hashNote: z.string().trim().min(20).max(500),
  fixtureSnapshot: awardRegistrySnapshotSchema.nullable(),
  frozenRecord: frozenDecisionRecordSchema.nullable(),
  findings: z.array(findingSchema).min(1).max(12),
  narrative: z.strictObject({
    officialRecord: z.string().trim().min(20).max(1200),
    whatWasMissing: z.string().trim().min(20).max(1200),
    whatFollowed: z.string().trim().min(20).max(1200),
    assuranceQuestion: z.string().trim().min(20).max(800),
    whereTraceLiFits: z.string().trim().min(20).max(1200),
  }),
  patternTicketIds: z.array(idSchema).min(1).max(16),
  patternTickets: z.array(patternTicketSchema).min(1).max(16),
  primarySources: z.array(sourceSchema).min(1).max(8),
  primarySourceFile: z.strictObject({
    url: z.string().url(),
    sha256: hashSchema,
    retrievedOn: daySchema,
    label: shortText,
  }),
  redaction: z.strictObject({
    policyId: z.literal('case-card-redaction-v1'),
    public: z.array(z.string().trim().min(1).max(240)).min(1).max(12),
    withheld: z.array(z.string().trim().min(1).max(240)).min(1).max(12),
  }),
  claimBoundary: z.string().trim().min(20).max(800),
}).superRefine((card, ctx) => {
  const ticketIds = card.patternTickets.map(ticket => ticket.ticketId)
  if (ticketIds.join('\u0000') !== card.patternTicketIds.join('\u0000')) {
    ctx.addIssue({ code: 'custom', message: 'Pattern ticket ids must match the attached tickets, in order.' })
  }
  if (new Set(ticketIds).size !== ticketIds.length) {
    ctx.addIssue({ code: 'custom', message: 'Pattern ticket ids must be unique on a case card.' })
  }
  for (const ticket of card.patternTickets) {
    if (!ticket.sourceCaseSlugs.includes(card.slug)) {
      ctx.addIssue({ code: 'custom', message: 'Each pattern ticket must name this case slug.' })
    }
  }

  if (card.recordKind === 'fixture') {
    if (card.publicationState !== 'awaiting_founder_freeze') {
      ctx.addIssue({ code: 'custom', message: 'A fixture stays awaiting founder freeze until a real record replaces it.' })
    }
    if (card.packsStamped || card.frozenRecord || card.frozenRecordId || card.snapshotHash || card.packsHash || card.hashMethod || card.readiness) {
      ctx.addIssue({ code: 'custom', message: 'A fixture must not carry freeze hashes, a readiness color, or a frozen record.' })
    }
    if (!card.fixtureSnapshot) {
      ctx.addIssue({ code: 'custom', message: 'A fixture must include the registry snapshot it is demonstrating.' })
    } else if (card.fixtureSnapshot.classification !== 'public-source') {
      ctx.addIssue({ code: 'custom', message: 'A public case fixture must be classified public-source.' })
    }
    return
  }

  if (card.publicationState !== 'published' || !card.packsStamped || !card.frozenRecord || card.fixtureSnapshot) {
    ctx.addIssue({ code: 'custom', message: 'A published card carries one verified frozen record and no fixture snapshot.' })
  }
  if (!card.frozenRecord) return
  if (card.frozenRecordId !== card.frozenRecord.recordId) {
    ctx.addIssue({ code: 'custom', message: 'The frozen record id on the card must be the record id.' })
  }
  if (card.snapshotHash !== card.frozenRecord.snapshotHash || card.packsHash !== card.frozenRecord.packsHash) {
    ctx.addIssue({ code: 'custom', message: 'Card hashes must be the frozen record hashes.' })
  }
  if (card.hashMethod !== card.frozenRecord.hashMethod) {
    ctx.addIssue({ code: 'custom', message: 'Card hash method must be the frozen record hash method.' })
  }
  if (card.readiness !== card.frozenRecord.pipelineStatus.readiness) {
    ctx.addIssue({ code: 'custom', message: 'Card readiness must be the frozen pipeline readiness.' })
  }
  const stamped = card.frozenRecord.packsInForce.map(pack => `${pack.packId}\u0000${pack.version}\u0000${pack.name}`)
  const shown = card.packsInForce.map(pack => `${pack.packId}\u0000${pack.version}\u0000${pack.name}`)
  if (stamped.join('\u0001') !== shown.join('\u0001')) {
    ctx.addIssue({ code: 'custom', message: 'Packs on the card must match the packs stamped in the frozen record.' })
  }
})

export type PatternTicket = z.infer<typeof patternTicketSchema>
export type PatternTicketStatus = (typeof patternTicketStatuses)[number]
export type CaseCardExport = z.infer<typeof caseCardExportSchema>
export type CaseCardRecordKind = (typeof caseCardRecordKinds)[number]
export type CaseCardPublicationState = (typeof caseCardPublicationStates)[number]
export type CaseCardPackScope = (typeof caseCardPackScopes)[number]

const narrativeSchema = caseCardExportSchema.shape.narrative
const redactionSchema = caseCardExportSchema.shape.redaction

export type CaseCardDraft = {
  slug: string
  title: string
  lede: string
  caseId: string
  packScope: CaseCardPackScope
  findings: z.infer<typeof findingSchema>[]
  narrative: z.infer<typeof narrativeSchema>
  patternTicketIds: string[]
  patternTickets: PatternTicket[]
  primarySources: z.infer<typeof sourceSchema>[]
  primarySourceFile: {
    url: string
    sha256: string
    retrievedOn: string
    label: string
  }
  redaction: z.infer<typeof redactionSchema>
  claimBoundary: string
  fixtureSnapshot: AwardRegistrySnapshot
  /** Null until a founder-confirmed freeze is checked in. Do not fill this with invented hashes. */
  frozenRecord: unknown | null
}

const decisionLabels: Record<FrozenDecisionRecord['disposition']['decision'], string> = {
  request_evidence: 'Request evidence',
  accept_with_exception: 'Accept with exception',
  escalate: 'Escalate',
  accept_assessment: 'Accept assessment',
  request_rule_review: 'Request rule review',
  override_assessment: 'Override assessment',
  decline_decision: 'Decline decision',
}

const FIXTURE_STATUS = 'Fixture · awaiting founder freeze'
const FIXTURE_READINESS = 'Not issued. This fixture has not been through a desk freeze, so readiness is left blank rather than shown as unknown, red, amber, or green.'
const FIXTURE_DISPOSITION = 'No disposition. A founder-confirmed desk freeze has not been recorded.'
const FIXTURE_HASH = 'Snapshot and packs hashes are omitted. They are produced only by freezeAtJudgment (sha256:sorted-json-v1). The sha256 on the primary source file is the public source PDF, not a freeze hash.'

/**
 * Build the public export. A null frozen record stays a labeled fixture.
 * A real freeze is verified before any hash is shown.
 */
export function publishCaseCard(draft: CaseCardDraft): CaseCardExport {
  const snapshot = awardRegistrySnapshotSchema.parse(structuredClone(draft.fixtureSnapshot))
  const frozen = draft.frozenRecord == null ? null : verifyFrozenRecord(draft.frozenRecord)
  const packsInForce = frozen
    ? frozen.packsInForce.map(pack => ({ packId: pack.packId, version: pack.version, name: pack.name }))
    : [{
        packId: snapshot.framework.frameworkId,
        version: snapshot.framework.version,
        name: snapshot.framework.name,
      }]

  const card = frozen
    ? {
        schemaVersion: 'case-card-export-v1' as const,
        frozenRecordSchemaVersion: 'frozen-decision-record-v1' as const,
        product: 'Trace-li' as const,
        slug: draft.slug,
        title: draft.title,
        lede: draft.lede,
        caseId: draft.caseId,
        recordKind: 'frozen' as const,
        publicationState: 'published' as const,
        statusLabel: 'Published frozen record',
        packScope: draft.packScope,
        packsStamped: true,
        packsInForce,
        readiness: frozen.pipelineStatus.readiness,
        readinessNote: `Frozen pipeline readiness is ${frozen.pipelineStatus.readiness}.`,
        dispositionSummary: `${decisionLabels[frozen.disposition.decision]}. ${frozen.disposition.rationale}`,
        frozenRecordId: frozen.recordId,
        snapshotHash: frozen.snapshotHash,
        packsHash: frozen.packsHash,
        hashMethod: frozen.hashMethod,
        hashNote: 'Snapshot and packs hashes were produced by freezeAtJudgment and checked with verifyFrozenRecord.',
        fixtureSnapshot: null,
        frozenRecord: frozen,
        findings: draft.findings,
        narrative: draft.narrative,
        patternTicketIds: draft.patternTicketIds,
        patternTickets: draft.patternTickets,
        primarySources: draft.primarySources,
        primarySourceFile: draft.primarySourceFile,
        redaction: draft.redaction,
        claimBoundary: draft.claimBoundary,
      }
    : {
        schemaVersion: 'case-card-export-v1' as const,
        frozenRecordSchemaVersion: 'frozen-decision-record-v1' as const,
        product: 'Trace-li' as const,
        slug: draft.slug,
        title: draft.title,
        lede: draft.lede,
        caseId: draft.caseId,
        recordKind: 'fixture' as const,
        publicationState: 'awaiting_founder_freeze' as const,
        statusLabel: FIXTURE_STATUS,
        packScope: draft.packScope,
        packsStamped: false,
        packsInForce,
        readiness: null,
        readinessNote: FIXTURE_READINESS,
        dispositionSummary: FIXTURE_DISPOSITION,
        frozenRecordId: null,
        snapshotHash: null,
        packsHash: null,
        hashMethod: null,
        hashNote: FIXTURE_HASH,
        fixtureSnapshot: snapshot,
        frozenRecord: null,
        findings: draft.findings,
        narrative: draft.narrative,
        patternTicketIds: draft.patternTicketIds,
        patternTickets: draft.patternTickets,
        primarySources: draft.primarySources,
        primarySourceFile: draft.primarySourceFile,
        redaction: draft.redaction,
        claimBoundary: draft.claimBoundary,
      }

  return caseCardExportSchema.parse(card)
}
