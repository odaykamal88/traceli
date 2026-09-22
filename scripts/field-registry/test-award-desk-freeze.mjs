import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AWARD_DESK_FREEZE_AT,
  AWARD_DESK_FREEZE_BY,
  awardDeskShelterSnapshot,
  dispositionFromAwardDeskDecision,
  evaluateDonorPacks,
  freezeAwardDeskDisposition,
  judgeAwardDeskPacks,
  packToggleFromRulePack,
  verifyFrozenRecord,
} from '../../lib/field-registry/index.ts'
import {
  agentDraftReason,
  awardDeskScenario,
  sanitizeDisposition,
  sanitizeFrozenRecordView,
  shortHash,
} from '../../lib/award-desk.ts'
import {
  addCatalogPack,
  freezeGoverningPacks,
  inForcePacks,
  seedInForcePacks,
  seedRuleLibraryBoard,
} from '../../lib/rule-library.ts'
import { globalFundFailSnapshot } from '../../lib/field-registry/packs/fixtures.ts'

test('Award desk shelter snapshot matches RFP-2026-041 and keeps value states distinct', () => {
  const snapshot = awardDeskShelterSnapshot()
  assert.equal(snapshot.awardId, awardDeskScenario.slug)
  assert.equal(snapshot.procurementReference, 'RFP-2026-041')
  assert.equal(snapshot.classification, 'synthetic')
  const byKey = Object.fromEntries(snapshot.fields.map(field => [field.key, field.value.state]))
  assert.equal(byKey['capacity.kenya'], 'present')
  assert.equal(byKey['capacity.ethiopia'], 'missing')
  assert.equal(byKey['coverage.declared'], 'present')
  assert.equal(byKey['coverage.supported'], 'present')
  assert.equal(byKey['capacity.ethiopia_denied'], 'negative')
  assert.ok(snapshot.fields.every(field => field.provenance.sourceFileHash.length === 64))
  assert.equal(JSON.stringify(snapshot).includes('bytes'), false)
})

test('default seed packs freeze via synthetic shelter judgment (Ethiopia gap → red)', () => {
  const packs = freezeGoverningPacks(seedInForcePacks())
  const result = freezeAwardDeskDisposition({
    decision: 'request',
    reason: agentDraftReason,
    governingPacks: packs,
  })
  assert.equal(result.record.frozenAt, AWARD_DESK_FREEZE_AT)
  assert.equal(result.record.frozenBy, AWARD_DESK_FREEZE_BY)
  assert.equal(result.record.disposition.decision, 'request_evidence')
  assert.equal(result.record.pipelineStatus.readiness, 'red')
  assert.ok(result.judgment)
  assert.ok(result.judgment.findings.length >= 1)
  assert.equal(result.record.snapshotHash, result.judgment.snapshotHash)
  assert.equal(result.view.recordId, result.record.recordId)
  assert.equal(result.view.snapshotHash, result.record.snapshotHash)
  assert.equal(result.view.packsHash, result.record.packsHash)
  assert.equal(result.view.readiness, 'red')
  assert.equal(result.view.findingCount, result.judgment.findings.length)
  assert.deepEqual(result.view.packIds, result.record.packsInForce.map(pack => pack.packId))
  assert.equal(verifyFrozenRecord(structuredClone(result.record)).snapshotHash, result.view.snapshotHash)
})

test('exception disposition attaches the demo waiver and freezes', () => {
  const result = freezeAwardDeskDisposition({
    decision: 'exception',
    reason: 'Accept the Ethiopia gap for kickoff with a named exception on the fictional award file.',
    governingPacks: freezeGoverningPacks(seedInForcePacks()),
  })
  assert.equal(result.record.disposition.decision, 'accept_with_exception')
  assert.equal(result.record.disposition.waiverRefs.length, 1)
  assert.equal(result.record.disposition.waiverRefs[0].waiverId, 'waiver_ethiopia_demo')
  assert.equal(result.view.dispositionDecision, 'accept_with_exception')
})

test('global-fund in force routes judgment through evaluateDonorPacks', () => {
  let board = seedRuleLibraryBoard()
  board = addCatalogPack(board, 'global-fund')
  const packs = freezeGoverningPacks(inForcePacks(board).filter(pack => pack.id === 'global-fund'))
  assert.equal(packs.length, 1)
  assert.equal(packs[0].id, 'global-fund')

  const snapshot = globalFundFailSnapshot()
  const judgment = judgeAwardDeskPacks(
    snapshot,
    packs.map(pack => packToggleFromRulePack({ ...pack, orgDefault: true })),
  )
  const donor = evaluateDonorPacks(snapshot, ['global-fund'])
  assert.equal(judgment.pipelineStatus.readiness, 'red')
  assert.deepEqual(judgment.pipelineStatus.deterministicFlags, donor.pipelineStatus.deterministicFlags)

  const result = freezeAwardDeskDisposition({
    decision: 'request',
    reason: 'Hold signature until Global Fund competition and COI registry fields are corrected.',
    governingPacks: packs,
    snapshot,
    recordId: 'record_gf_award_desk_wire_v1',
  })
  assert.equal(result.record.packsInForce[0].packId, 'global-fund')
  assert.equal(result.record.pipelineStatus.readiness, 'red')
  assert.equal(result.record.snapshot.awardId, snapshot.awardId)
  assert.equal(result.view.packIds[0], 'global-fund')
})

test('toggling packs off after freeze does not rewrite the frozen hashes', () => {
  const original = freezeGoverningPacks(seedInForcePacks())
  const frozen = freezeAwardDeskDisposition({
    decision: 'escalate',
    reason: 'Route the Ethiopia capacity gap to compliance before programme kickoff on Thursday.',
    governingPacks: original,
  })
  const snapshotHash = frozen.record.snapshotHash
  const packsHash = frozen.record.packsHash
  const fewer = original.slice(1)
  assert.ok(fewer.length < original.length)
  const again = freezeAwardDeskDisposition({
    decision: 'escalate',
    reason: 'Route the Ethiopia capacity gap to compliance before programme kickoff on Thursday.',
    governingPacks: fewer,
    recordId: 'record_rfp-2026-041_escalate_v2',
  })
  assert.equal(frozen.record.snapshotHash, snapshotHash)
  assert.equal(frozen.record.packsHash, packsHash)
  assert.equal(again.record.snapshotHash, snapshotHash)
  assert.notEqual(again.record.packsHash, packsHash)
  assert.equal(verifyFrozenRecord(structuredClone(frozen.record)).packsHash, packsHash)
})

test('client view sanitizer and shortHash stay strict', () => {
  const result = freezeAwardDeskDisposition({
    decision: 'request',
    reason: agentDraftReason,
    governingPacks: freezeGoverningPacks(seedInForcePacks()),
  })
  const view = sanitizeFrozenRecordView(result.view)
  assert.equal(view.recordId, result.view.recordId)
  assert.equal(shortHash(view.snapshotHash).includes('…'), true)
  assert.throws(() => sanitizeFrozenRecordView({ ...view, snapshotHash: 'nope' }))
  assert.throws(() => sanitizeFrozenRecordView({ ...view, hashMethod: 'md5' }))
  const disposition = sanitizeDisposition({
    decision: 'request',
    reason: agentDraftReason,
    governingPacks: freezeGoverningPacks(seedInForcePacks()),
  })
  assert.equal(disposition.decision, 'request')
  assert.equal(
    dispositionFromAwardDeskDecision({
      decision: disposition.decision,
      actorId: AWARD_DESK_FREEZE_BY,
      actorRole: 'Procurement Officer',
      timestamp: AWARD_DESK_FREEZE_AT,
      rationale: disposition.reason,
    }).decision,
    'request_evidence',
  )
})

test('rewritten frozen clone fails verifyFrozenRecord', () => {
  const result = freezeAwardDeskDisposition({
    decision: 'request',
    reason: agentDraftReason,
    governingPacks: freezeGoverningPacks(seedInForcePacks()),
  })
  const clone = structuredClone(result.record)
  clone.snapshot.fields[0].value = { state: 'present', value: 'Invented letter' }
  assert.throws(() => verifyFrozenRecord(clone))
})
