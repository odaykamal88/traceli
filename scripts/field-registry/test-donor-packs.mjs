import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DonorPackError,
  dispositionFromAwardDeskDecision,
  donorPackFixtures,
  donorPackIds,
  evaluateDonorPack,
  evaluateDonorPacks,
  evaluatePlaybook,
  freezeAtJudgment,
  getDonorPack,
  isDonorPackId,
  judgmentPassed,
  listDonorPacks,
  packToggleForId,
  packToggleFromRulePack,
} from '../../lib/field-registry/index.ts'
import { addCatalogPack, seedRuleLibraryBoard } from '../../lib/rule-library.ts'

const frozenAt = '2026-09-22T12:30:00.000Z'
const frozenBy = 'user_leila'
const rationale = 'Hold signature until competition documentation and threshold alignment are corrected on the registry.'

test('pack registry exposes global-fund and fcdo-prime only', () => {
  assert.deepEqual([...donorPackIds], ['global-fund', 'fcdo-prime'])
  assert.equal(listDonorPacks().length, 2)
  assert.equal(getDonorPack('global-fund').audience, 'global-fund-pr-sr')
  assert.equal(getDonorPack('fcdo-prime').audience, 'fcdo-commercial-prime')
  assert.equal(isDonorPackId('global-fund'), true)
  assert.equal(isDonorPackId('usaid'), false)
  assert.throws(() => getDonorPack('usaid'), DonorPackError)
})

for (const packId of donorPackIds) {
  test(`${packId} pass fixture is green with no findings`, () => {
    const { pass, rules } = donorPackFixtures[packId]
    const result = evaluateDonorPack(pass(), packId)
    assert.equal(judgmentPassed(result), true)
    assert.equal(result.findings.length, 0)
    assert.equal(result.pipelineStatus.readiness, 'green')
    assert.equal(result.pipelineStatus.deterministicFlags.length, rules.length)
    assert.ok(result.pipelineStatus.deterministicFlags.every(flag => flag.passed))
  })

  test(`${packId} fail fixture is red with coded findings and freezes`, () => {
    const { fail, pack } = donorPackFixtures[packId]
    const snapshot = fail()
    const judgment = evaluateDonorPack(snapshot, packId)
    assert.equal(judgmentPassed(judgment), false)
    assert.equal(judgment.pipelineStatus.readiness, 'red')
    assert.ok(judgment.findings.length >= 3)
    assert.ok(judgment.findings.every(finding => finding.code.startsWith(packId === 'global-fund' ? 'gf_' : 'fcdo_')))
    assert.ok(judgment.findings.every(finding => finding.evidence.every(pointer => !('bytes' in pointer))))

    const playbookStatus = evaluatePlaybook({
      snapshot,
      packs: [packToggleForId(packId)],
    })
    assert.equal(playbookStatus.readiness, 'red')
    assert.deepEqual(playbookStatus.deterministicFlags, judgment.pipelineStatus.deterministicFlags)

    const record = freezeAtJudgment(snapshot, {
      recordId: `record_${packId}_fail_v1`,
      supersedesRecordId: null,
      frozenAt,
      frozenBy,
      packs: [packToggleForId(packId)],
      disposition: dispositionFromAwardDeskDecision({
        decision: 'request',
        actorId: frozenBy,
        actorRole: 'Procurement Officer',
        timestamp: frozenAt,
        rationale,
      }),
      pipelineStatus: judgment.pipelineStatus,
    })
    assert.equal(record.snapshotHash, judgment.snapshotHash)
    assert.equal(record.packsInForce[0].packId, pack.packId)
    assert.equal(record.pipelineStatus.readiness, 'red')
  })
}

test('evaluateDonorPacks rejects empty known-pack selection', () => {
  assert.throws(
    () => evaluateDonorPacks(donorPackFixtures['global-fund'].pass(), ['usaid']),
    DonorPackError,
  )
})

test('Rule library catalog ids match donor pack ids for freeze bridging', () => {
  let board = seedRuleLibraryBoard()
  board = addCatalogPack(board, 'global-fund')
  board = addCatalogPack(board, 'fcdo-prime')
  const gf = board.find(pack => pack.id === 'global-fund')
  const fcdo = board.find(pack => pack.id === 'fcdo-prime')
  assert.ok(gf?.onBoard && gf.orgDefault)
  assert.ok(fcdo?.onBoard && fcdo.orgDefault)
  const gfToggle = packToggleFromRulePack(gf)
  const fcdoToggle = packToggleFromRulePack(fcdo)
  assert.equal(gfToggle.packId, 'global-fund')
  assert.equal(fcdoToggle.packId, 'fcdo-prime')
  assert.equal(
    evaluateDonorPacks(donorPackFixtures['global-fund'].pass(), [gfToggle.packId]).pipelineStatus.readiness,
    'green',
  )
  assert.equal(
    evaluateDonorPacks(donorPackFixtures['fcdo-prime'].pass(), [fcdoToggle.packId]).pipelineStatus.readiness,
    'green',
  )
})
