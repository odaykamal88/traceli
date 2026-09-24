import assert from 'node:assert/strict'
import test from 'node:test'

import { getCaseCard, listCaseCards } from '../../lib/case-cards/catalog.ts'
import { GF_OIG_25_005_PDF_SHA256, gfOig25005Draft } from '../../lib/case-cards/gf-oig-25-005.ts'
import { OIOS_2020_005_PDF_SHA256 } from '../../lib/case-cards/oios-2020-005-iraq-forensic.ts'
import { OIOS_2025_098_PDF_SHA256 } from '../../lib/case-cards/oios-2025-098-cbpf-reserve.ts'
import { listPatternTickets } from '../../lib/case-cards/pattern-tickets.ts'
import { UNFPA_ANNEX4_PDF_SHA256 } from '../../lib/case-cards/unfpa-annex4-13-esa-ip.ts'
import { UNFPA_SUDAN_PDF_SHA256 } from '../../lib/case-cards/unfpa-ia-2025-29-sudan.ts'
import { unfpaSudanDraft } from '../../lib/case-cards/unfpa-ia-2025-29-sudan.ts'
import {
  FieldRegistryError,
  GLOBAL_FUND_PACK,
  OCHA_CBPF_PACK,
  UNFPA_PACK,
  dispositionFromAwardDeskDecision,
  freezeAtJudgment,
  getDonorPack,
  packToggleForDonorPack,
  publishCaseCard,
} from '../../lib/field-registry/index.ts'

const card = getCaseCard('gf-oig-25-005')

test('the public Togo card is a labeled fixture with no freeze hashes', () => {
  assert.ok(card)
  assert.equal(listCaseCards().length, 6)
  assert.equal(card.product, 'Trace-li')
  assert.equal(card.schemaVersion, 'case-card-export-v1')
  assert.equal(card.recordKind, 'fixture')
  assert.equal(card.publicationState, 'awaiting_founder_freeze')
  assert.equal(card.frozenRecord, null)
  assert.equal(card.frozenRecordId, null)
  assert.equal(card.snapshotHash, null)
  assert.equal(card.packsHash, null)
  assert.equal(card.hashMethod, null)
  assert.equal(card.readiness, null)
  assert.equal(card.packsStamped, false)
  assert.equal(card.fixtureSnapshot.classification, 'public-source')
  assert.equal(card.fixtureSnapshot.framework.frameworkId, 'global-fund')
  assert.equal(card.fixtureSnapshot.framework.version, GLOBAL_FUND_PACK.version)
  assert.equal(card.primarySourceFile.sha256, GF_OIG_25_005_PDF_SHA256)
  assert.equal(card.primarySourceFile.sha256.length, 64)
  for (const field of card.fixtureSnapshot.fields) {
    assert.equal(field.provenance.sourceFileHash, GF_OIG_25_005_PDF_SHA256)
    assert.equal(field.provenance.verificationMethod, 'unverified')
  }
  assert.match(card.claimBoundary, /prevents fraud/)
  assert.match(card.statusLabel, /awaiting founder freeze/)
})

test('pattern ticket ids are stable and only cite rules that exist', () => {
  const ids = listPatternTickets().map(ticket => ticket.ticketId)
  assert.equal(new Set(ids).size, ids.length)
  assert.deepEqual(card.patternTicketIds, [
    'pt:gf-oig-25-005:competition-exception-docs',
    'pt:gf-oig-25-005:procurement-file-completeness',
    'pt:gf-oig-25-005:extension-authority',
  ])
  const ruleIds = new Set(getDonorPack('global-fund').rules.map(rule => rule.ruleId))
  assert.equal(card.patternTickets[0].ruleId, 'gf_procurement_competition_docs')
  assert.equal(ruleIds.has(card.patternTickets[0].ruleId), true)
  assert.equal(card.patternTickets[1].ruleId, null)
  assert.equal(card.patternTickets[2].ruleId, null)
  for (const ticket of card.patternTickets) {
    assert.equal(ticket.status, 'stub')
    assert.equal(ticket.sourceCaseSlugs.includes('gf-oig-25-005'), true)
  }
})

test('an unknown slug is absent and the catalog freeze slot stays empty', () => {
  assert.equal(getCaseCard('not-a-case'), undefined)
  assert.equal(gfOig25005Draft().frozenRecord, null)
})

test('a verified freeze can drop in without changing the public fixture', () => {
  const frozenAt = '2026-09-23T12:00:00.000Z'
  const frozenBy = 'user_founder'
  const record = freezeAtJudgment(gfOig25005Draft().fixtureSnapshot, {
    recordId: 'record:gf-oig-25-005:test',
    supersedesRecordId: null,
    frozenAt,
    frozenBy,
    packs: [packToggleForDonorPack(GLOBAL_FUND_PACK)],
    disposition: dispositionFromAwardDeskDecision({
      decision: 'request',
      actorId: frozenBy,
      actorRole: 'Procurement Officer',
      timestamp: frozenAt,
      rationale: 'Request the missing competition, file, and extension records before any signature.',
    }),
  })
  const published = publishCaseCard({ ...gfOig25005Draft(), frozenRecord: record })
  assert.equal(published.recordKind, 'frozen')
  assert.equal(published.publicationState, 'published')
  assert.equal(published.snapshotHash, record.snapshotHash)
  assert.equal(published.packsHash, record.packsHash)
  assert.equal(published.hashMethod, 'sha256:sorted-json-v1')
  assert.equal(published.fixtureSnapshot, null)
  assert.equal(published.frozenRecordId, record.recordId)
  assert.equal(published.readiness, record.pipelineStatus.readiness)
  assert.equal(getCaseCard('gf-oig-25-005').snapshotHash, null)

  const tampered = structuredClone(record)
  tampered.snapshot.procurementReference = 'CHANGED'
  assert.throws(() => publishCaseCard({ ...gfOig25005Draft(), frozenRecord: tampered }), FieldRegistryError)
})

const publicFixtures = [
  ['unfpa-annex4-13-esa-ip', 'unfpa', UNFPA_PACK.version, UNFPA_ANNEX4_PDF_SHA256],
  ['unfpa-annex4-21-arab-vendor', 'unfpa', UNFPA_PACK.version, UNFPA_ANNEX4_PDF_SHA256],
  ['unfpa-ia-2025-29-sudan', 'unfpa', UNFPA_PACK.version, UNFPA_SUDAN_PDF_SHA256],
  ['oios-2025-098-cbpf-reserve', 'ocha-cbpf', OCHA_CBPF_PACK.version, OIOS_2025_098_PDF_SHA256],
  ['oios-2020-005-iraq-forensic', 'ocha-cbpf', OCHA_CBPF_PACK.version, OIOS_2020_005_PDF_SHA256],
]

test('UNFPA and OCHA cards are labeled fixtures with source-file hashes only', () => {
  for (const [slug, packId, version, sha] of publicFixtures) {
    const published = getCaseCard(slug)
    assert.ok(published, slug)
    assert.equal(published.product, 'Trace-li')
    assert.equal(published.recordKind, 'fixture')
    assert.equal(published.publicationState, 'awaiting_founder_freeze')
    assert.equal(published.frozenRecord, null)
    assert.equal(published.snapshotHash, null)
    assert.equal(published.packsHash, null)
    assert.equal(published.hashMethod, null)
    assert.equal(published.readiness, null)
    assert.equal(published.packsStamped, false)
    assert.equal(published.fixtureSnapshot.framework.frameworkId, packId)
    assert.equal(published.fixtureSnapshot.framework.version, version)
    assert.equal(published.fixtureSnapshot.classification, 'public-source')
    assert.equal(published.primarySourceFile.sha256, sha)
    assert.match(published.claimBoundary, /prevents fraud/)
    assert.match(published.statusLabel, /awaiting founder freeze/)
    assert.equal(published.hashNote.includes('freeze hash'), true)
    for (const field of published.fixtureSnapshot.fields) {
      assert.equal(field.provenance.sourceFileHash, sha)
      assert.equal(field.provenance.verificationMethod, 'unverified')
    }
  }
  const esa = getCaseCard('unfpa-annex4-13-esa-ip')
  const arab = getCaseCard('unfpa-annex4-21-arab-vendor')
  assert.equal(/Kenya|Zambia|John|Jane/.test(esa.title + esa.lede + esa.narrative.officialRecord), false)
  assert.equal(/Kenya|Zambia|John|Jane/.test(arab.title + arab.lede + arab.narrative.officialRecord), false)
  assert.match(esa.narrative.officialRecord, /East and Southern Africa/)
  assert.match(arab.narrative.officialRecord, /Arab States/)
})

test('pattern tickets cite pack rules that exist, except the forensic non-equivalence', () => {
  const tickets = listPatternTickets()
  const byPack = new Map()
  for (const ticket of tickets) {
    if (!byPack.has(ticket.packId)) byPack.set(ticket.packId, new Set(getDonorPack(ticket.packId).rules.map(rule => rule.ruleId)))
    if (ticket.ruleId) assert.equal(byPack.get(ticket.packId).has(ticket.ruleId), true, ticket.ticketId)
    assert.equal(ticket.status, 'stub')
  }
  const forensic = tickets.find(ticket => ticket.ticketId === 'pt:oios-2020-005:forensic-backlog-not-presignature')
  assert.equal(forensic.ruleId, null)
  assert.equal(forensic.fieldKey, 'assurance.forensic_is_not_presignature_proof')
  assert.equal(getDonorPack('ocha-cbpf').rules.some(rule => rule.fieldKey === forensic.fieldKey), false)
  const sudan = getCaseCard('unfpa-ia-2025-29-sudan')
  assert.deepEqual(sudan.patternTicketIds, [
    'pt:unfpa-ia-2025-29:threshold-approver',
    'pt:unfpa-ia-2025-29:rfq-criteria-scores',
    'pt:unfpa-ia-2025-29:po-before-delivery',
    'pt:unfpa-ia-2025-29:rir-on-file',
  ])
})

test('a verified Sudan freeze can drop in without changing the public fixture', () => {
  const frozenAt = '2026-09-24T12:00:00.000Z'
  const frozenBy = 'user_founder'
  const draft = unfpaSudanDraft()
  const record = freezeAtJudgment(draft.fixtureSnapshot, {
    recordId: 'record:unfpa-ia-2025-29:test',
    supersedesRecordId: null,
    frozenAt,
    frozenBy,
    packs: [packToggleForDonorPack(UNFPA_PACK)],
    disposition: dispositionFromAwardDeskDecision({
      decision: 'request',
      actorId: frozenBy,
      actorRole: 'Procurement Officer',
      timestamp: frozenAt,
      rationale: 'Request the missing approver, RFQ scores, purchase order, and receiving report before any signature.',
    }),
  })
  const published = publishCaseCard({ ...draft, frozenRecord: record })
  assert.equal(published.recordKind, 'frozen')
  assert.equal(published.publicationState, 'published')
  assert.equal(published.snapshotHash, record.snapshotHash)
  assert.equal(published.packsHash, record.packsHash)
  assert.equal(published.fixtureSnapshot, null)
  assert.equal(published.packsInForce[0].packId, 'unfpa')
  assert.equal(getCaseCard('unfpa-ia-2025-29-sudan').snapshotHash, null)
})
