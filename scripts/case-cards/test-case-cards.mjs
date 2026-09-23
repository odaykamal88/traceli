import assert from 'node:assert/strict'
import test from 'node:test'

import { getCaseCard, listCaseCards } from '../../lib/case-cards/catalog.ts'
import { GF_OIG_25_005_PDF_SHA256, gfOig25005Draft } from '../../lib/case-cards/gf-oig-25-005.ts'
import { listPatternTickets } from '../../lib/case-cards/pattern-tickets.ts'
import {
  FieldRegistryError,
  GLOBAL_FUND_PACK,
  GLOBAL_FUND_RULES,
  dispositionFromAwardDeskDecision,
  freezeAtJudgment,
  packToggleForDonorPack,
  publishCaseCard,
} from '../../lib/field-registry/index.ts'

const card = getCaseCard('gf-oig-25-005')

test('the public Togo card is a labeled fixture with no freeze hashes', () => {
  assert.ok(card)
  assert.equal(listCaseCards().length, 1)
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
  const ruleIds = new Set(GLOBAL_FUND_RULES.map(rule => rule.ruleId))
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
