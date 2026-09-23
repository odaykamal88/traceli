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
  fcdoPrimeIddHitDispositionedSnapshot,
  fcdoPrimeIddHitSnapshot,
  fcdoPrimeIddMissingSnapshot,
  freezeAtJudgment,
  freezeAwardDeskDisposition,
  getDonorPack,
  globalFundIddHitDispositionedSnapshot,
  globalFundIddHitSnapshot,
  globalFundIddMissingSnapshot,
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
  assert.equal(getDonorPack('global-fund').version, '2026.2')
  assert.equal(getDonorPack('fcdo-prime').audience, 'fcdo-commercial-prime')
  assert.equal(getDonorPack('fcdo-prime').version, '2026.2')
  assert.equal(isDonorPackId('global-fund'), true)
  assert.equal(isDonorPackId('ofac'), false)
  assert.equal(isDonorPackId('usaid'), false)
  assert.throws(() => getDonorPack('usaid'), DonorPackError)
  assert.throws(() => getDonorPack('ofac'), DonorPackError)

  const gfRules = getDonorPack('global-fund').rules
  const fcdoRules = getDonorPack('fcdo-prime').rules
  const gfIdd = gfRules.filter(rule => rule.ruleId.startsWith('gf_idd_'))
  const fcdoIdd = fcdoRules.filter(rule => rule.ruleId.startsWith('fcdo_idd_'))
  assert.ok(gfIdd.length > fcdoIdd.length)
  assert.ok(gfIdd.some(rule => rule.ruleId === 'gf_idd_screen_scope'))
  assert.ok(fcdoIdd.some(rule => rule.ruleId === 'fcdo_idd_uk_sanctions_scope'))
  assert.equal(fcdoIdd.filter(rule => rule.severity === 'blocker').length < gfIdd.filter(rule => rule.severity === 'blocker').length, true)
  assert.ok(gfRules.length + fcdoRules.length <= 64)
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

function codes(result) {
  return new Set(result.findings.map(finding => finding.code))
}

test('global-fund IDD gate: missing evidence blocks, and a missing result is not a hit', () => {
  const result = evaluateDonorPack(globalFundIddMissingSnapshot(), 'global-fund')
  assert.equal(result.pipelineStatus.readiness, 'red')
  const found = codes(result)
  for (const code of [
    'gf_idd_subject_missing',
    'gf_idd_affiliated_persons_missing',
    'gf_idd_screen_scope_incomplete',
    'gf_idd_screen_date_missing',
    'gf_idd_list_vintage_missing',
    'gf_idd_modality_invalid',
    'gf_idd_result_invalid',
    'gf_idd_evidence_missing',
  ]) {
    assert.equal(found.has(code), true, code)
  }
  assert.equal(found.has('gf_idd_hit_needs_decision'), false)
  assert.equal(found.has('gf_idd_hit_needs_owner'), false)
  assert.ok(result.findings.every(finding => finding.evidence.every(pointer => !('bytes' in pointer))))
})

test('global-fund IDD gate: prose scope is not a list match, and a hit needs a disposition', () => {
  const prose = globalFundIddMissingSnapshot()
  prose.awardId = 'gf-pr-sr-2026-011-idd-prose'
  prose.fields = prose.fields.map(field => field.key === 'idd.screen_scope'
    ? { ...field, value: { state: 'present', value: 'United Nations, OFAC, US State Department, Switzerland, debarment and ineligibility' } }
    : field)
  const proseResult = evaluateDonorPack(prose, 'global-fund')
  const proseFinding = proseResult.findings.find(finding => finding.code === 'gf_idd_screen_scope_incomplete')
  assert.ok(proseFinding)
  assert.match(proseFinding.summary, /un/)
  assert.match(proseFinding.summary, /us-state/)
  assert.equal(proseFinding.summary.includes('OFAC SDN'), false)

  const hit = evaluateDonorPack(globalFundIddHitSnapshot(), 'global-fund')
  assert.equal(hit.pipelineStatus.readiness, 'red')
  const hitCodes = codes(hit)
  for (const code of [
    'gf_idd_hit_needs_owner',
    'gf_idd_hit_needs_decision',
    'gf_idd_hit_needs_rationale',
    'gf_idd_hit_not_communicable',
  ]) {
    assert.equal(hitCodes.has(code), true, code)
  }
  assert.equal(hitCodes.has('gf_idd_subject_missing'), false)
  assert.equal(hitCodes.has('gf_idd_evidence_missing'), false)

  const closed = evaluateDonorPack(globalFundIddHitDispositionedSnapshot(), 'global-fund')
  assert.equal(judgmentPassed(closed), true)
  assert.equal(closed.pipelineStatus.readiness, 'green')
})

test('global-fund IDD gaps freeze from the Award desk', () => {
  const snapshot = globalFundIddMissingSnapshot()
  const result = freezeAwardDeskDisposition({
    decision: 'request',
    reason: 'Hold signature until Restrictive Measures screening evidence is on the registry.',
    governingPacks: [{
      id: 'global-fund',
      name: 'Global Fund Grant Regulations v1',
      version: '2026.2',
      category: 'donor',
      showOnRecord: true,
    }],
    snapshot,
    recordId: 'record_gf_idd_missing_v1',
  })
  assert.equal(result.record.packsInForce[0].packId, 'global-fund')
  assert.equal(result.record.pipelineStatus.readiness, 'red')
  assert.equal(result.view.readiness, 'red')
  assert.ok(result.judgment.findings.some(finding => finding.code === 'gf_idd_evidence_missing'))
  assert.equal(result.view.findingCount, result.judgment.findings.length)
  assert.equal(result.record.disposition.decision, 'request_evidence')
})

test('fcdo-prime sanctions overlay: missing evidence, hit, and dispositioned hit', () => {
  const missing = evaluateDonorPack(fcdoPrimeIddMissingSnapshot(), 'fcdo-prime')
  assert.equal(missing.pipelineStatus.readiness, 'red')
  const missingCodes = codes(missing)
  for (const code of [
    'fcdo_idd_subject_missing',
    'fcdo_idd_connected_persons_missing',
    'fcdo_idd_uk_sanctions_scope_incomplete',
    'fcdo_idd_screen_date_missing',
    'fcdo_idd_evidence_missing',
    'fcdo_idd_debarment_missing',
  ]) {
    assert.equal(missingCodes.has(code), true, code)
  }
  assert.equal(missingCodes.has('fcdo_idd_hit_needs_decision'), false)

  const hit = evaluateDonorPack(fcdoPrimeIddHitSnapshot(), 'fcdo-prime')
  assert.equal(hit.pipelineStatus.readiness, 'red')
  const hitCodes = codes(hit)
  assert.equal(hitCodes.has('fcdo_idd_hit_needs_decision'), true)
  assert.equal(hitCodes.has('fcdo_idd_hit_needs_owner'), true)
  assert.equal(hitCodes.has('fcdo_idd_hit_needs_rationale'), true)
  assert.equal(hit.findings.find(finding => finding.code === 'fcdo_idd_hit_needs_owner').severity, 'warning')
  assert.equal(hit.findings.find(finding => finding.code === 'fcdo_idd_hit_needs_decision').severity, 'blocker')
  assert.equal(hitCodes.has('fcdo_idd_uk_sanctions_scope_incomplete'), false)

  const closed = evaluateDonorPack(fcdoPrimeIddHitDispositionedSnapshot(), 'fcdo-prime')
  assert.equal(judgmentPassed(closed), true)

  const frozen = freezeAwardDeskDisposition({
    decision: 'request',
    reason: 'Hold signature until the UK sanctions hit has a select, continue, or terminate decision.',
    governingPacks: [{
      id: 'fcdo-prime',
      name: 'FCDO commercial prime award desk v1',
      version: '2026.2',
      category: 'donor',
      showOnRecord: true,
    }],
    snapshot: fcdoPrimeIddHitSnapshot(),
    recordId: 'record_fcdo_idd_hit_v1',
  })
  assert.equal(frozen.record.pipelineStatus.readiness, 'red')
  assert.equal(frozen.record.packsInForce[0].packId, 'fcdo-prime')
  assert.ok(frozen.judgment.findings.some(finding => finding.code === 'fcdo_idd_hit_needs_decision'))
})
