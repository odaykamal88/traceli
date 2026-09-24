import assert from 'node:assert/strict'
import test from 'node:test'

import { getCaseCard, listCaseCards } from '../../lib/case-cards/catalog.ts'
import {
  GF_OIG_25_005_ACTOR_ROLE,
  GF_OIG_25_005_PACKS_HASH,
  GF_OIG_25_005_RECORD_ID,
  GF_OIG_25_005_SNAPSHOT_HASH,
  GF_OIG_25_005_SUPERSEDES_RECORD_ID,
} from '../../lib/case-cards/gf-oig-25-005-freeze.ts'
import { GF_OIG_25_005_PDF_SHA256, gfOig25005Draft, gfOig25005FixtureSnapshot } from '../../lib/case-cards/gf-oig-25-005.ts'
import { OIOS_2020_005_PDF_SHA256 } from '../../lib/case-cards/oios-2020-005-iraq-forensic.ts'
import {
  OIOS_2025_098_ACTOR_ROLE,
  OIOS_2025_098_PACKS_HASH,
  OIOS_2025_098_RECORD_ID,
  OIOS_2025_098_SNAPSHOT_HASH,
  OIOS_2025_098_SUPERSEDES_RECORD_ID,
} from '../../lib/case-cards/oios-2025-098-cbpf-reserve-freeze.ts'
import { OIOS_2025_098_PDF_SHA256, oios2025098Draft, oios2025098FixtureSnapshot } from '../../lib/case-cards/oios-2025-098-cbpf-reserve.ts'
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
  evaluateDonorPack,
  freezeAtJudgment,
  getDonorPack,
  packToggleForDonorPack,
  publishCaseCard,
  verifyFrozenRecord,
} from '../../lib/field-registry/index.ts'

const card = getCaseCard('gf-oig-25-005')
const ochaCard = getCaseCard('oios-2025-098-cbpf-reserve')

test('the public Togo card publishes the founder Freeze #1', () => {
  assert.ok(card)
  assert.equal(listCaseCards().length, 6)
  const draft = gfOig25005Draft()
  const published = publishCaseCard(draft)
  const record = verifyFrozenRecord(published.frozenRecord)
  const judged = evaluateDonorPack(record.snapshot, 'global-fund', { evaluatedAt: record.frozenAt })
  assert.equal(published.product, 'Trace-li')
  assert.equal(card.product, 'Trace-li')
  assert.equal(card.schemaVersion, 'case-card-export-v1')
  assert.equal(published.recordKind, 'frozen')
  assert.equal(published.publicationState, 'published')
  assert.equal(card.publicationState, 'published')
  assert.equal(published.fixtureSnapshot, null)
  assert.equal(card.fixtureSnapshot, null)
  assert.equal(published.packsStamped, true)
  assert.equal(published.hashMethod, 'sha256:sorted-json-v1')
  assert.equal(published.snapshotHash, GF_OIG_25_005_SNAPSHOT_HASH)
  assert.equal(published.packsHash, GF_OIG_25_005_PACKS_HASH)
  assert.equal(record.snapshotHash, GF_OIG_25_005_SNAPSHOT_HASH)
  assert.equal(record.packsHash, GF_OIG_25_005_PACKS_HASH)
  assert.equal(record.recordId, GF_OIG_25_005_RECORD_ID)
  assert.equal(record.supersedesRecordId, GF_OIG_25_005_SUPERSEDES_RECORD_ID)
  assert.equal(published.frozenRecordId, record.recordId)
  assert.equal(card.snapshotHash, record.snapshotHash)
  assert.equal(card.packsHash, record.packsHash)
  assert.equal(record.pipelineStatus.readiness, 'red')
  assert.equal(published.readiness, 'red')
  assert.equal(judged.pipelineStatus.readiness, 'red')
  assert.equal(judged.findings.length, 22)
  assert.equal(record.disposition.decision, 'request_evidence')
  assert.equal(record.disposition.actorRole, GF_OIG_25_005_ACTOR_ROLE)
  assert.equal(record.disposition.waiverRefs.length, 0)
  assert.equal(record.frozenAt, '2026-09-24T13:06:59.035Z')
  assert.equal(record.frozenBy, 'user_01M2MDYWCDDT13QGCTJHHSYD1C')
  assert.equal(record.packsInForce[0].packId, 'global-fund')
  assert.equal(record.packsInForce[0].version, GLOBAL_FUND_PACK.version)
  assert.equal(record.snapshot.fields.length, 26)
  assert.equal(record.snapshot.fields.every(field => field.value.state === 'missing'), true)
  assert.equal(card.primarySourceFile.sha256, GF_OIG_25_005_PDF_SHA256)
  assert.equal(card.primarySourceFile.sha256.length, 64)
  assert.notEqual(card.primarySourceFile.sha256, card.snapshotHash)
  assert.match(card.claimBoundary, /prevents fraud/)
  assert.match(card.statusLabel, /Published frozen record/)
  assert.match(card.redaction.withheld.join('\n'), /founder desk freeze/)
  const fixture = gfOig25005FixtureSnapshot()
  assert.equal(draft.fixtureSnapshot.classification, 'public-source')
  assert.equal(fixture.classification, 'public-source')
  assert.equal(fixture.framework.frameworkId, 'global-fund')
  assert.equal(fixture.framework.version, GLOBAL_FUND_PACK.version)
  for (const field of fixture.fields) {
    assert.equal(field.provenance.sourceFileHash, GF_OIG_25_005_PDF_SHA256)
    assert.equal(field.provenance.verificationMethod, 'unverified')
  }
})

test('the public OIOS 2025/098 card publishes founder Freeze #2', () => {
  assert.ok(ochaCard)
  const draft = oios2025098Draft()
  const published = publishCaseCard(draft)
  const record = verifyFrozenRecord(published.frozenRecord)
  const judged = evaluateDonorPack(record.snapshot, 'ocha-cbpf', { evaluatedAt: record.frozenAt })
  assert.equal(published.product, 'Trace-li')
  assert.equal(ochaCard.product, 'Trace-li')
  assert.equal(published.recordKind, 'frozen')
  assert.equal(published.publicationState, 'published')
  assert.equal(ochaCard.publicationState, 'published')
  assert.equal(published.fixtureSnapshot, null)
  assert.equal(ochaCard.fixtureSnapshot, null)
  assert.equal(published.packsStamped, true)
  assert.equal(published.hashMethod, 'sha256:sorted-json-v1')
  assert.equal(published.snapshotHash, OIOS_2025_098_SNAPSHOT_HASH)
  assert.equal(published.packsHash, OIOS_2025_098_PACKS_HASH)
  assert.equal(record.snapshotHash, OIOS_2025_098_SNAPSHOT_HASH)
  assert.equal(record.packsHash, OIOS_2025_098_PACKS_HASH)
  assert.equal(record.recordId, OIOS_2025_098_RECORD_ID)
  assert.equal(record.supersedesRecordId, OIOS_2025_098_SUPERSEDES_RECORD_ID)
  assert.equal(published.frozenRecordId, record.recordId)
  assert.equal(ochaCard.snapshotHash, record.snapshotHash)
  assert.equal(ochaCard.packsHash, record.packsHash)
  assert.equal(record.pipelineStatus.readiness, 'red')
  assert.equal(published.readiness, 'red')
  assert.equal(judged.pipelineStatus.readiness, 'red')
  assert.equal(judged.findings.length, 20)
  assert.equal(record.disposition.decision, 'request_evidence')
  assert.equal(record.disposition.actorRole, OIOS_2025_098_ACTOR_ROLE)
  assert.equal(record.disposition.waiverRefs.length, 0)
  assert.equal(record.frozenAt, '2026-09-24T17:27:04.560Z')
  assert.equal(record.frozenBy, 'user_01M2MDYWCDDT13QGCTJHHSYD1C')
  assert.equal(record.packsInForce[0].packId, 'ocha-cbpf')
  assert.equal(record.packsInForce[0].version, OCHA_CBPF_PACK.version)
  assert.equal(record.snapshot.fields.length, 24)
  assert.equal(record.snapshot.fields.every(field => field.value.state === 'missing'), true)
  assert.equal(record.snapshot.classification, 'synthetic')
  const modality = record.snapshot.fields.find(field => field.key === 'allocation.modality')
  const sanctions = record.snapshot.fields.find(field => field.key === 'misconduct.secretariat_sanctions_regime')
  assert.equal(modality.value.state, 'missing')
  assert.equal(modality.value.reason, 'Not extracted from this packet.')
  assert.equal(sanctions.value.state, 'missing')
  assert.equal(sanctions.value.reason, 'Not extracted from this packet.')
  assert.equal(ochaCard.primarySourceFile.sha256, OIOS_2025_098_PDF_SHA256)
  assert.notEqual(ochaCard.primarySourceFile.sha256, ochaCard.snapshotHash)
  assert.match(ochaCard.claimBoundary, /prevents fraud/)
  assert.match(ochaCard.statusLabel, /Published frozen record/)
  assert.match(ochaCard.redaction.withheld.join('\n'), /founder desk freeze/)
  const fixture = oios2025098FixtureSnapshot()
  assert.equal(draft.fixtureSnapshot.classification, 'public-source')
  assert.equal(fixture.classification, 'public-source')
  assert.equal(fixture.framework.frameworkId, 'ocha-cbpf')
  assert.equal(fixture.framework.version, OCHA_CBPF_PACK.version)
  assert.equal(fixture.fields.find(field => field.key === 'allocation.modality').value.state, 'present')
  for (const field of fixture.fields) {
    assert.equal(field.provenance.sourceFileHash, OIOS_2025_098_PDF_SHA256)
    assert.equal(field.provenance.verificationMethod, 'unverified')
  }
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

test('an unknown slug is absent and the Togo draft carries the founder freeze', () => {
  assert.equal(getCaseCard('not-a-case'), undefined)
  const record = verifyFrozenRecord(gfOig25005Draft().frozenRecord)
  assert.equal(record.snapshotHash, GF_OIG_25_005_SNAPSHOT_HASH)
  assert.equal(record.packsHash, GF_OIG_25_005_PACKS_HASH)
})

test('a second freeze of the public-source fixture does not replace the founder record', () => {
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
  assert.equal(getCaseCard('gf-oig-25-005').snapshotHash, GF_OIG_25_005_SNAPSHOT_HASH)
  assert.notEqual(published.snapshotHash, GF_OIG_25_005_SNAPSHOT_HASH)

  const tampered = structuredClone(record)
  tampered.snapshot.procurementReference = 'CHANGED'
  assert.throws(() => publishCaseCard({ ...gfOig25005Draft(), frozenRecord: tampered }), FieldRegistryError)
})

const publicFixtures = [
  ['unfpa-annex4-13-esa-ip', 'unfpa', UNFPA_PACK.version, UNFPA_ANNEX4_PDF_SHA256],
  ['unfpa-annex4-21-arab-vendor', 'unfpa', UNFPA_PACK.version, UNFPA_ANNEX4_PDF_SHA256],
  ['unfpa-ia-2025-29-sudan', 'unfpa', UNFPA_PACK.version, UNFPA_SUDAN_PDF_SHA256],
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
