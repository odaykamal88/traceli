import assert from 'node:assert/strict'
import test from 'node:test'
import { ZodError } from 'zod'
import {
  SYNTHETIC_SHELTER_RULES,
  dispositionFromAwardDeskDecision,
  evaluateJudgment,
  freezeAtJudgment,
  isContradiction,
  judgmentPassed,
  packToggleFromRulePack,
  snapshotHashOf,
} from '../../lib/field-registry/index.ts'
import { seedInForcePacks } from '../../lib/rule-library.ts'

const hash = 'cd'.repeat(32)
const frozenAt = '2026-09-22T07:15:00.000Z'
const frozenBy = 'user_leila'
const rationale = 'Hold the overnight reconstruction until Ethiopia capacity and coverage claims agree on the registry.'

function provenance(sourceRef) {
  return {
    sourceFileHash: hash,
    sourceRef,
    extractedAt: '2026-09-21T23:14:00.000Z',
    confidence: 0.91,
    verificationMethod: 'deterministic_check',
  }
}

function baseSnapshot(fields) {
  return {
    schemaVersion: 'award-registry-snapshot-v1',
    registryVersion: 1,
    classification: 'synthetic',
    organizationId: 'org_trace_demo',
    projectId: 'project_kenya_shelter',
    awardId: 'rfp-2026-041',
    procurementReference: 'RFP-2026-041',
    donor: { donorId: 'donor_echo_style', name: 'ECHO-style illustrative donor' },
    framework: {
      frameworkId: 'echo-donor-conditions',
      name: 'ECHO-style donor conditions',
      version: '2026.2',
    },
    fields,
    asOf: '2026-09-22T07:00:00.000Z',
  }
}

/** Pass fixture: required capacity present; declared and supported coverage agree. */
function passSnapshot() {
  return baseSnapshot([
    {
      fieldId: 'field_kenya_hub',
      entityKind: 'evidence',
      entityId: 'evidence_kenya_hub',
      key: 'capacity.kenya',
      value: { state: 'present', value: 'Regional hub letter on file' },
      provenance: provenance({ kind: 'page', id: 'hub-kenya', label: 'Kenya hub letter' }),
    },
    {
      fieldId: 'field_ethiopia_capacity',
      entityKind: 'evidence',
      entityId: 'evidence_ethiopia_capacity',
      key: 'capacity.ethiopia',
      value: { state: 'present', value: 'Addis warehouse letter on file' },
      provenance: provenance({ kind: 'page', id: 'hub-ethiopia', label: 'Ethiopia capacity letter' }),
    },
    {
      fieldId: 'field_coverage_declared',
      entityKind: 'criterion',
      entityId: 'criterion_coverage',
      key: 'coverage.declared',
      value: { state: 'present', value: 'Kenya+Ethiopia' },
      provenance: provenance({ kind: 'page', id: 'annex-b', label: 'Annex B' }),
    },
    {
      fieldId: 'field_coverage_supported',
      entityKind: 'evidence',
      entityId: 'evidence_coverage',
      key: 'coverage.supported',
      value: { state: 'present', value: 'Kenya+Ethiopia' },
      provenance: provenance({ kind: 'page', id: 'coverage-map', label: 'Coverage map' }),
    },
  ])
}

/** Fail fixture: Ethiopia capacity missing; coverage values disagree. */
function failSnapshot() {
  return baseSnapshot([
    {
      fieldId: 'field_kenya_hub',
      entityKind: 'evidence',
      entityId: 'evidence_kenya_hub',
      key: 'capacity.kenya',
      value: { state: 'present', value: 'Regional hub letter on file' },
      provenance: provenance({ kind: 'page', id: 'hub-kenya', label: 'Kenya hub letter' }),
    },
    {
      fieldId: 'field_ethiopia_capacity',
      entityKind: 'evidence',
      entityId: 'evidence_ethiopia_capacity',
      key: 'capacity.ethiopia',
      value: { state: 'missing', reason: 'No Ethiopia-specific capacity letter is linked to the winning claim.' },
      provenance: provenance({ kind: 'page', id: 'annex-b', label: 'Annex B' }),
    },
    {
      fieldId: 'field_coverage_declared',
      entityKind: 'criterion',
      entityId: 'criterion_coverage',
      key: 'coverage.declared',
      value: { state: 'present', value: 'Kenya+Ethiopia' },
      provenance: provenance({ kind: 'page', id: 'annex-b', label: 'Annex B' }),
    },
    {
      fieldId: 'field_coverage_supported',
      entityKind: 'evidence',
      entityId: 'evidence_coverage',
      key: 'coverage.supported',
      value: { state: 'present', value: 'Kenya only' },
      provenance: provenance({ kind: 'page', id: 'coverage-map', label: 'Coverage map' }),
    },
  ])
}

test('pass fixture: required fields present and coverage agrees', () => {
  const snapshot = passSnapshot()
  const result = evaluateJudgment(snapshot, SYNTHETIC_SHELTER_RULES)
  assert.equal(result.schemaVersion, 'judgment-result-v0')
  assert.equal(result.findings.length, 0)
  assert.equal(result.pipelineStatus.readiness, 'green')
  assert.equal(result.pipelineStatus.deterministicFlags.length, SYNTHETIC_SHELTER_RULES.length)
  assert.equal(result.pipelineStatus.deterministicFlags.every(flag => flag.passed), true)
  assert.deepEqual(result.pipelineStatus.semanticAnomalyIds, [])
  assert.equal(result.snapshotHash, snapshotHashOf(snapshot))
  assert.equal(judgmentPassed(result), true)
})

test('fail fixture: required missing and disagreeing coverage emit findings with provenance pointers', () => {
  const result = evaluateJudgment(failSnapshot(), SYNTHETIC_SHELTER_RULES)
  assert.equal(judgmentPassed(result), false)
  assert.equal(result.pipelineStatus.readiness, 'red')
  assert.equal(result.findings.length, 2)

  const missing = result.findings.find(finding => finding.kind === 'required_missing')
  const disagree = result.findings.find(finding => finding.kind === 'values_disagree')
  assert.ok(missing)
  assert.ok(disagree)
  assert.equal(missing.code, 'required_field_missing')
  assert.deepEqual(missing.involvedFieldKeys, ['capacity.ethiopia'])
  assert.equal(missing.evidence.length, 1)
  assert.equal(missing.evidence[0].sourceFileHash, hash)
  assert.equal(missing.evidence[0].sourceRef.kind, 'page')
  assert.equal(missing.evidence[0].sourceRef.id, 'annex-b')
  assert.equal('bytes' in missing.evidence[0], false)

  assert.equal(isContradiction(disagree), true)
  assert.deepEqual(disagree.involvedFieldKeys, ['coverage.declared', 'coverage.supported'])
  assert.equal(disagree.evidence.length, 2)
  assert.ok(result.pipelineStatus.semanticAnomalyIds.includes(disagree.findingId))
  assert.equal(
    result.pipelineStatus.deterministicFlags.filter(flag => !flag.passed).length,
    2,
  )
})

test('failing judgment pipelineStatus freezes with the snapshot without Award desk changes', () => {
  const snapshot = failSnapshot()
  const judgment = evaluateJudgment(snapshot)
  const packs = seedInForcePacks().map(packToggleFromRulePack)
  const record = freezeAtJudgment(snapshot, {
    recordId: 'record_rfp-2026-041_judgment_v0',
    supersedesRecordId: null,
    frozenAt,
    frozenBy,
    packs,
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
  assert.equal(record.pipelineStatus.readiness, 'red')
  assert.deepEqual(record.pipelineStatus.semanticAnomalyIds, judgment.pipelineStatus.semanticAnomalyIds)
  assert.equal(record.pipelineStatus.deterministicFlags.some(flag => flag.passed === false), true)
})

test('judgment rejects snapshots without provenance and never accepts a file-shaped input as a rule', () => {
  const broken = failSnapshot()
  delete broken.fields[0].provenance
  assert.throws(() => evaluateJudgment(broken), ZodError)
  assert.throws(
    () => evaluateJudgment(failSnapshot(), [{
      ruleId: 'rule_bad',
      kind: 'required_present',
      fieldKey: 'capacity.kenya',
      bytes: new Uint8Array([1, 2, 3]),
    }]),
    ZodError,
  )
})
