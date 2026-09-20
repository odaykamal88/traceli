import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { dateFactSchema, decisionInputSchema, evaluationSchema, scenarioIds, traceUnitSchema } from '../../lib/trace/contract.ts';
import { buildTraceUnit, canonicalJson, hashBytes, hashJson, validateHumanDecision, validateTraceUnit } from '../../lib/trace/fixtures.ts';
import { buildTraceExport } from '../../lib/trace/export.ts';

const now = '2026-09-20T20:00:00.000Z';
const fixture = (scenario = 'missing', extra = {}) => buildTraceUnit({ id: `unit-${scenario}`, organizationId: 'org-fixture', procurementId: 'proc-fixture', actorId: 'CREATOR-PRIVATE-SENTINEL', scenario, now, ...extra });
const without = (value, key) => Object.fromEntries(Object.entries(value).filter(([name]) => name !== key));
const rehash = (unit) => { unit.artifactHash = hashJson(without(unit, 'artifactHash')); return unit; };
const human = (unit, changes = {}) => {
  const record = { id: 'decision-1', unitId: unit.id, organizationId: unit.organizationId, procurementId: unit.procurementId, sequence: 1,
    classification: 'synthetic', version: 1, createdBy: 'REVIEWER-PRIVATE-SENTINEL', sourceJobId: 'trace-synthetic-v1', recordState: 'draft', supersedesId: null,
    actorId: 'REVIEWER-PRIVATE-SENTINEL', actorRole: 'Procurement Director', action: 'accept_assessment', rationale: 'RATIONALE-PRIVATE-SENTINEL confirms this limited fictional assessment.', createdAt: now,
    unitHash: unit.artifactHash, inputHash: unit.inputHash, policyHash: unit.policyAssessment.hash, citedEvidenceIds: [], authorityRef: null, originalOutcome: unit.policyAssessment.result, ...changes };
  return { ...record, hash: hashJson(record) };
};

test('all eight offline scenarios preserve model/policy separation and honest unknown states', () => {
  const expected = { missing: ['unknown', 'needs_evidence'], satisfied: ['satisfied', 'ready_for_review'], failed: ['not_satisfied', 'needs_rule_review'], excluded: ['not_applicable', 'ready_for_review'], conflict: ['conflict', 'needs_rule_review'], unknown_date: ['unknown', 'needs_rule_review'], timeout: ['satisfied', 'cannot_evaluate'], invalid_model: ['satisfied', 'cannot_evaluate'] };
  for (const scenario of scenarioIds) {
    const unit = fixture(scenario);
    assert.deepEqual([unit.policyAssessment.result, unit.policyAssessment.proposedDisposition], expected[scenario]);
    assert.equal(unit.evaluation.usage.requests, 0);
    assert.equal(unit.realDecisionEligible, false);
    assert.equal(unit.benchmarkEligible, false);
    assert.deepEqual(validateTraceUnit(JSON.parse(JSON.stringify(unit))), unit);
  }
  assert.equal(fixture('failed').evaluation.distribution.supports, 0.97);
  assert.equal(fixture('missing').evidenceSnapshot.missingItems[0].code, 'signed_review_note');
  assert.equal(fixture('unknown_date').sourceVersions[0].effectiveDate.value, null);
  assert.equal(fixture('unknown_date').profile.result, 'unknown');
  assert.equal(fixture('conflict').profile.result, 'conflict');
});

test('strict schemas reject extras, invalid calendar facts, invented unknown dates and nonfinite probabilities', () => {
  assert.throws(() => traceUnitSchema.parse({ ...fixture(), injected: true }));
  for (const value of ['2026-02-30', '2026-13-01', '', '0000-00-00']) assert.throws(() => dateFactSchema.parse({ value, precision: 'day', basisRef: 'source-1', unknownReason: null }));
  assert.throws(() => dateFactSchema.parse({ value: null, precision: 'day', basisRef: null, unknownReason: 'Unknown' }));
  assert.throws(() => dateFactSchema.parse({ value: null, precision: 'unknown', basisRef: 'retrieval-date', unknownReason: 'Unknown' }));
  for (const distribution of [{ supports: Infinity, doesNotSupport: 0, unknown: 0 }, { supports: 0.8, doesNotSupport: 0.8, unknown: 0.1 }, { supports: 1.2, doesNotSupport: -0.2, unknown: 0 }]) assert.throws(() => evaluationSchema.parse({ ...fixture('satisfied').evaluation, distribution }));
  assert.throws(() => evaluationSchema.parse({ ...fixture('timeout').evaluation, distribution: { supports: 1, doesNotSupport: 0, unknown: 0 } }));
  assert.throws(() => canonicalJson({ invalid: undefined }));
  assert.throws(() => canonicalJson({ invalid: NaN }));
});

test('meaningful byte, source manifest, snapshot, frozen input and policy hashes verify independently', () => {
  const unit = fixture('satisfied');
  for (const source of unit.sourceVersions) assert.equal(hashBytes(source.content), source.byteHash);
  assert.equal(hashJson(without(unit.evidenceSnapshot, 'hash')), unit.evidenceSnapshot.hash);
  assert.equal(hashJson(unit.evaluation.inputManifest), unit.inputHash);
  assert.equal(unit.evaluation.inputManifest.profileHash, hashJson(unit.profile));
  assert.equal(hashJson(without(unit.policyAssessment, 'hash')), unit.policyAssessment.hash);
  assert.equal(hashJson(without(unit, 'artifactHash')), unit.artifactHash);
  assert.equal(hashJson({ z: [3, 2], a: 1 }), hashJson({ a: 1, z: [3, 2] }));
  assert.notEqual(hashBytes('source\n'), hashBytes('source'));
});

test('foreign tenant and same-tenant foreign-procurement child references fail even with a new outer hash', () => {
  for (const field of ['organizationId', 'procurementId']) {
    const unit = fixture('satisfied');
    unit.sourceVersions[0][field] = `other-${field}`;
    assert.throws(() => validateTraceUnit(rehash(unit)));
  }
  const unit = fixture('satisfied');
  unit.evidenceSnapshot.assertions[1].sourceVersionIds = ['foreign-source'];
  unit.evidenceSnapshot.hash = hashJson(without(unit.evidenceSnapshot, 'hash'));
  assert.throws(() => validateTraceUnit(rehash(unit)));
});

test('corrupted bytes, invented source content, false policy results and oversize payloads fail closed', () => {
  const bytes = fixture(); bytes.sourceVersions[0].content += 'tamper'; assert.throws(() => validateTraceUnit(rehash(bytes)));
  const forged = fixture(); forged.sourceVersions[0].content += 'PRIVATE-ANNOTATION'; forged.sourceVersions[0].byteHash = hashBytes(forged.sourceVersions[0].content); assert.throws(() => validateTraceUnit(rehash(forged)));
  const policy = fixture('failed'); policy.policyAssessment.result = 'satisfied'; policy.policyAssessment.hash = hashJson(without(policy.policyAssessment, 'hash')); assert.throws(() => validateTraceUnit(rehash(policy)));
  const large = fixture(); large.sourceVersions[0].content = 'x'.repeat(16385); assert.throws(() => validateTraceUnit(rehash(large)));
  const huge = fixture(); huge.limitations = ['x'.repeat(129 * 1024)]; assert.throws(() => validateTraceUnit(huge));
});

test('evidence-only revision preserves lane/case and exact source/profile/policy while changing snapshot', () => {
  const previous = fixture('missing'); const frozen = canonicalJson(previous);
  const revised = fixture('satisfied', { id: 'unit-revision', previousUnit: previous, actorId: 'new-creator' });
  assert.equal(revised.lane, 'U'); assert.equal(revised.caseId, previous.caseId); assert.equal(revised.logicalUnitId, previous.logicalUnitId);
  for (const key of ['profile', 'obligation', 'constraints', 'policyPack']) assert.deepEqual(revised[key], previous[key]);
  assert.deepEqual(revised.sourceVersions[0], previous.sourceVersions[0]);
  assert.notEqual(revised.evidenceSnapshot.hash, previous.evidenceSnapshot.hash); assert.notEqual(revised.inputHash, previous.inputHash);
  assert.equal(revised.previousUnitId, previous.id); assert.equal(revised.policyAssessment.result, 'satisfied');
  assert.equal(canonicalJson(previous), frozen);
  const again = fixture('satisfied', { id: 'unit-second-revision', previousUnit: revised });
  assert.equal(again.policyAssessment.result, 'satisfied'); assert.deepEqual(again.profile, previous.profile);
  assert.throws(() => fixture('satisfied', { id: 'bad-scope', organizationId: 'org-other', previousUnit: previous }));
  assert.throws(() => fixture('satisfied', { id: 'bad-proc', procurementId: 'proc-other', previousUnit: previous }));
  assert.throws(() => fixture('satisfied', { id: 'bad-version', version: 9, previousUnit: previous }));
  assert.throws(() => fixture('satisfied', { id: 'no-previous', previousUnitId: previous.id, version: 2 }));
});

test('explicit source correction appends a new source version and binds new policy/input hashes', () => {
  const previous = fixture('unknown_date');
  const revised = fixture('satisfied', { id: 'unit-corrected', previousUnit: previous, revisionKind: 'source_correction' });
  assert.equal(revised.lane, 'G'); assert.equal(revised.caseId, previous.caseId);
  assert.equal(previous.sourceVersions[0].effectiveDate.value, null);
  assert.equal(revised.sourceVersions[0].effectiveDate.value, '2026-08-01');
  assert.equal(revised.sourceVersions[0].supersedesId, previous.sourceVersions[0].id);
  assert.equal(revised.sourceVersions[0].documentId, previous.sourceVersions[0].documentId);
  assert.notEqual(revised.sourceVersions[0].byteHash, previous.sourceVersions[0].byteHash);
  assert.notEqual(revised.policyPack.digest, previous.policyPack.digest);
  assert.notEqual(revised.inputHash, previous.inputHash); assert.equal(revised.policyAssessment.result, 'satisfied');
});

test('human decisions require exact hashes, rationale, source-linked citations and actual override authority', () => {
  const unit = fixture('failed'); assert.equal(validateHumanDecision(human(unit), unit).originalOutcome, 'not_satisfied');
  const valid = { unitId: unit.id, expectedUnitHash: unit.artifactHash, expectedInputHash: unit.inputHash, expectedPolicyHash: unit.policyAssessment.hash, expectedSequence: 0, action: 'override_assessment', rationale: 'A scoped fictional exception requires the supplied record.', citedEvidenceIds: [unit.evidenceSnapshot.assertions[0].id], authorityRef: 'fixture-exception-v1', idempotencyKey: randomUUID() };
  assert.equal(decisionInputSchema.parse(valid).action, 'override_assessment');
  for (const changes of [{ rationale: 'brief' }, { citedEvidenceIds: [] }, { authorityRef: 'model-confidence' }, { expectedSequence: -1 }, { actorId: 'spoofed' }]) assert.throws(() => decisionInputSchema.parse({ ...valid, ...changes }));
  for (const changes of [{ unitHash: '0'.repeat(64) }, { policyHash: '0'.repeat(64) }, { inputHash: '0'.repeat(64) }, { originalOutcome: 'satisfied' }, { procurementId: 'foreign-proc' }, { organizationId: 'foreign-org' }, { citedEvidenceIds: ['foreign-evidence'] }, { createdBy: 'spoofed-creator' }, { version: 2 }, { supersedesId: 'nonexistent-decision' }]) assert.throws(() => validateHumanDecision(human(unit, changes), unit));
  assert.throws(() => validateHumanDecision(human(unit, { action: 'override_assessment', actorRole: 'Procurement Officer', authorityRef: 'fixture-exception-v1', citedEvidenceIds: [unit.evidenceSnapshot.assertions[0].id] }), unit));
  const override = validateHumanDecision(human(unit, { action: 'override_assessment', authorityRef: 'fixture-exception-v1', citedEvidenceIds: [unit.evidenceSnapshot.assertions[1].id] }), unit);
  assert.equal(override.originalOutcome, 'not_satisfied'); assert.equal(unit.policyAssessment.result, 'not_satisfied');
});

test('full export reconstructs exact disclosed record; allowlisted redaction leaks no creator/reviewer/rationale', () => {
  const unit = fixture('failed'); const decisions = [human(unit)];
  const grant = { recipientId: 'RECIPIENT-PRIVATE-SENTINEL', purpose: 'PURPOSE-PRIVATE-SENTINEL for this fictional workflow.', grantedAt: now, expiresAt: '2026-09-20T20:15:00.000Z' };
  const full = buildTraceExport({ unit, decisions, mode: 'full', grantId: 'grant-full', createdAt: now, grant });
  assert.deepEqual(full.payload.unit, unit); assert.deepEqual(full.payload.decisions, decisions);
  assert.equal(full.payload.authorization.recipientId, grant.recipientId); assert.equal(full.payload.authorization.purpose, grant.purpose);
  assert.equal(full.payload.authorization.action, 'download_self'); assert.equal(full.payload.authorization.unitHash, unit.artifactHash);
  assert.equal(hashJson(full.payload), full.payloadHash);
  const redacted = buildTraceExport({ unit, decisions, mode: 'redacted', grantId: 'grant-redacted', createdAt: now, grant });
  const serialized = JSON.stringify(redacted);
  for (const sentinel of ['CREATOR-PRIVATE-SENTINEL', 'REVIEWER-PRIVATE-SENTINEL', 'RATIONALE-PRIVATE-SENTINEL', 'RECIPIENT-PRIVATE-SENTINEL', 'PURPOSE-PRIVATE-SENTINEL']) assert.ok(!serialized.includes(sentinel));
  assert.equal(redacted.payload.authorization.expiresAt, grant.expiresAt); assert.equal(redacted.payload.authorization.grantedAt, now);
  assert.equal(redacted.payload.authorization.recipientId, undefined); assert.equal(redacted.payload.authorization.purpose, undefined);
  assert.ok(redacted.payload.redactionManifest.some(({ path }) => path === 'authorization.recipientId'));
  assert.ok(redacted.payload.redactionManifest.some(({ path }) => path === 'authorization.purpose'));
  assert.ok(redacted.payload.redactionManifest.length > 0); assert.equal(redacted.payload.decisions[0].originalOutcome, 'not_satisfied');
  assert.equal(hashJson(redacted.payload), redacted.payloadHash); assert.notEqual(full.payloadHash, redacted.payloadHash);
  for (const source of redacted.payload.unit.sources) assert.equal(hashBytes(source.content), source.byteHash);
  assert.equal(redacted.payload.provenance.originalUnitHash, unit.artifactHash);
  const two = human(unit, { id: 'decision-2', sequence: 2, version: 2, supersedesId: decisions[0].id, action: 'request_rule_review' });
  assert.equal(buildTraceExport({ unit, decisions: [...decisions, two], mode: 'redacted', grantId: 'grant-chain', createdAt: now, grant }).payload.decisions.length, 2);
  const brokenChain = human(unit, { id: 'decision-2', sequence: 2, version: 2, supersedesId: 'different-decision', action: 'request_rule_review' });
  assert.equal(validateHumanDecision(brokenChain, unit).supersedesId, 'different-decision');
  assert.throws(() => buildTraceExport({ unit, decisions: [...decisions, brokenChain], mode: 'redacted', grantId: 'bad-chain', createdAt: now, grant }));
  assert.throws(() => buildTraceExport({ unit, decisions: [human(unit, { sequence: 2 })], mode: 'redacted', grantId: 'bad-grant', createdAt: now, grant }));
  assert.throws(() => buildTraceExport({ unit, decisions, mode: 'private', grantId: 'bad-grant', createdAt: now, grant }));
  for (const changes of [{ grantedAt: '2026-09-20T20:01:00.000Z' }, { expiresAt: now }, { expiresAt: '2026-09-20T20:15:01.000Z' }, { grantedAt: '2026-02-30T20:00:00.000Z' }]) assert.throws(() => buildTraceExport({ unit, decisions, mode: 'full', grantId: 'bad-time', createdAt: now, grant: { ...grant, ...changes } }));
});
