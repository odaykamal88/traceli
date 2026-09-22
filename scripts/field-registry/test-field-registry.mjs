import assert from 'node:assert/strict'
import test from 'node:test'
import { ZodError } from 'zod'
import {
  dispositionFromAwardDeskDecision,
  FieldRegistryError,
  fragmentSchema,
  freezeAtJudgment,
  hashJson,
  packToggleFromRulePack,
  verifyFrozenRecord,
} from '../../lib/field-registry/index.ts'
import { inForcePacks, seedInForcePacks, seedRuleLibraryBoard, toggleOrgDefault } from '../../lib/rule-library.ts'

const hash = 'ab'.repeat(32)
const frozenAt = '2026-09-22T06:41:00.000Z'
const frozenBy = 'user_leila'
const rationale = 'Request Ethiopia-specific evidence and keep the overnight reconstruction open for the reviewer.'

function provenance(sourceRef) {
  return {
    sourceFileHash: hash,
    sourceRef,
    extractedAt: '2026-09-21T23:14:00.000Z',
    confidence: 0.9,
    verificationMethod: 'unverified',
  }
}

function snapshot() {
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
    fields: [
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
        fieldId: 'field_ethiopia_denial',
        entityKind: 'evidence',
        entityId: 'evidence_ethiopia_denial',
        key: 'capacity.ethiopia_denied',
        value: { state: 'negative', value: false },
        provenance: provenance({ kind: 'message', id: 'msg-441', label: 'Supplier mail' }),
      },
    ],
    asOf: '2026-09-22T06:00:00.000Z',
  }
}

function judgment(packs, extras = {}) {
  return {
    recordId: 'record_rfp-2026-041_v1',
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
    ...extras,
  }
}

test('snapshot keeps present, missing, and negative apart and requires provenance', () => {
  const body = snapshot()
  const record = freezeAtJudgment(body, judgment([]))
  assert.deepEqual(record.snapshot.fields.map(field => field.value.state), ['present', 'missing', 'negative'])
  const broken = snapshot()
  delete broken.fields[1].provenance
  assert.throws(() => freezeAtJudgment(broken, judgment([])), ZodError)
  const duplicate = snapshot()
  duplicate.fields.push({ ...duplicate.fields[0], fieldId: 'field_copy' })
  assert.throws(() => freezeAtJudgment(duplicate, judgment([])), ZodError)
})

test('freeze stamps packs, hashes the snapshot independently of pack order, and rejects mutation', () => {
  const packs = seedInForcePacks().map(packToggleFromRulePack)
  const reversed = [...packs].reverse()
  const first = freezeAtJudgment(snapshot(), judgment(packs))
  const second = freezeAtJudgment(snapshot(), judgment(reversed, { recordId: 'record_rfp-2026-041_v2' }))
  assert.equal(first.hashMethod, 'sha256:sorted-json-v1')
  assert.equal(first.snapshotHash, second.snapshotHash)
  assert.equal(first.packsHash, second.packsHash)
  assert.deepEqual(first.packsInForce.map(pack => pack.packId), [...first.packsInForce.map(pack => pack.packId)].sort())
  assert.equal(first.packsInForce[0].frozenAt, frozenAt)
  assert.equal(first.packsInForce[0].frozenBy, frozenBy)
  assert.equal(first.pipelineStatus.readiness, 'unknown')
  assert.equal(first.snapshotHash, hashJson(first.snapshot))
  assert.equal(first.packsHash, hashJson(first.packsInForce))
  assert.equal(Object.isFrozen(first), true)
  assert.equal(Object.isFrozen(first.packsInForce), true)
  assert.equal(Object.isFrozen(first.snapshot), true)
  assert.throws(() => {
    first.snapshotHash = 'f'.repeat(64)
  }, TypeError)
  assert.throws(() => {
    first.packsInForce.push(first.packsInForce[0])
  }, TypeError)
  assert.throws(() => {
    first.packsInForce[0].toggledScope.orgDefault = false
  }, TypeError)
  const live = snapshot()
  const frozen = freezeAtJudgment(live, judgment(packs, { recordId: 'record_rfp-2026-041_v3' }))
  live.procurementReference = 'RFP-CHANGED'
  live.fields.pop()
  assert.equal(frozen.snapshot.procurementReference, 'RFP-2026-041')
  assert.equal(frozen.snapshot.fields.length, 3)
  assert.equal(frozen.snapshotHash, hashJson(frozen.snapshot))
})

test('toggling a pack OFF after freeze does not change the frozen packs list or snapshot hash', () => {
  const originalPacks = seedInForcePacks()
  const turnedOff = originalPacks[0].id
  const frozen = freezeAtJudgment(snapshot(), judgment(originalPacks.map(packToggleFromRulePack)))
  const snapshotHash = frozen.snapshotHash
  const packsHash = frozen.packsHash
  const frozenList = frozen.packsInForce.map(pack => `${pack.packId}@${pack.version}:${pack.toggledScope.orgDefault}`)

  const board = toggleOrgDefault(seedRuleLibraryBoard(), turnedOff)
  const liveAfter = inForcePacks(board)
  assert.equal(liveAfter.some(pack => pack.id === turnedOff), false)
  assert.equal(frozen.packsInForce.some(pack => pack.packId === turnedOff), true)
  assert.equal(frozen.packsInForce.find(pack => pack.packId === turnedOff).toggledScope.orgDefault, true)
  assert.deepEqual(
    frozen.packsInForce.map(pack => `${pack.packId}@${pack.version}:${pack.toggledScope.orgDefault}`),
    frozenList,
  )
  assert.equal(frozen.snapshotHash, snapshotHash)
  assert.equal(frozen.packsHash, packsHash)

  const again = freezeAtJudgment(snapshot(), judgment(liveAfter.map(packToggleFromRulePack), {
    recordId: 'record_rfp-2026-041_after_toggle',
  }))
  assert.equal(again.snapshotHash, snapshotHash)
  assert.notEqual(again.packsHash, packsHash)
  assert.equal(again.packsInForce.some(pack => pack.packId === turnedOff), false)
  assert.equal(frozen.packsHash, packsHash)
  assert.equal(verifyFrozenRecord(frozen).snapshotHash, snapshotHash)
})

test('a rewritten clone fails hash verification', () => {
  const frozen = freezeAtJudgment(snapshot(), judgment(seedInForcePacks().map(packToggleFromRulePack)))
  const rewrittenPacks = structuredClone(frozen)
  rewrittenPacks.packsInForce[0].version = '9.9'
  assert.throws(() => verifyFrozenRecord(rewrittenPacks), FieldRegistryError)
  const rewrittenSnapshot = structuredClone(frozen)
  rewrittenSnapshot.snapshot.fields[1].value = { state: 'present', value: 'Invented Ethiopia letter' }
  assert.throws(() => verifyFrozenRecord(rewrittenSnapshot), FieldRegistryError)
  assert.equal(frozen.snapshot.fields[1].value.state, 'missing')
})

test('Award desk decisions map onto disposition stubs and waivers stay on exceptions', () => {
  const request = dispositionFromAwardDeskDecision({
    decision: 'request',
    actorId: frozenBy,
    actorRole: 'Procurement Officer',
    timestamp: frozenAt,
    rationale,
  })
  assert.equal(request.decision, 'request_evidence')
  assert.deepEqual(request.waiverRefs, [])
  const escalate = dispositionFromAwardDeskDecision({
    decision: 'escalate',
    actorId: frozenBy,
    actorRole: 'Procurement Director',
    timestamp: frozenAt,
    rationale: 'Route the Ethiopia capacity gap to the compliance lead before programme kickoff.',
  })
  assert.equal(escalate.decision, 'escalate')
  assert.throws(() => dispositionFromAwardDeskDecision({
    decision: 'exception',
    actorId: frozenBy,
    actorRole: 'Procurement Director',
    timestamp: frozenAt,
    rationale: 'Accept the Ethiopia gap for kickoff with a named exception on the award file.',
  }), ZodError)
  const exception = dispositionFromAwardDeskDecision({
    decision: 'exception',
    actorId: frozenBy,
    actorRole: 'Procurement Director',
    timestamp: frozenAt,
    rationale: 'Accept the Ethiopia gap for kickoff with a named exception on the award file.',
    waiverRefs: [{ waiverId: 'waiver_ethiopia', authorityRef: 'authority_director' }],
  })
  assert.equal(exception.decision, 'accept_with_exception')
  const off = packToggleFromRulePack({ ...seedInForcePacks()[0], orgDefault: false })
  assert.throws(() => freezeAtJudgment(snapshot(), judgment([off])), ZodError)
})

test('extraction fragments carry provenance and do not admit file bytes', () => {
  const fragment = fragmentSchema.parse({
    fragmentId: 'fragment_annex_b',
    sourceFileHash: hash,
    sourceRef: { kind: 'cell', id: 'sheet1-b4' },
    text: 'Ethiopia is named in Annex B.',
    extractedAt: '2026-09-21T23:14:00.000Z',
    confidence: 0.4,
    extractorId: 'adapter_fixture',
  })
  assert.equal(fragment.sourceRef.kind, 'cell')
  assert.throws(() => fragmentSchema.parse({ ...fragment, bytes: [1, 2, 3] }), ZodError)
  const record = freezeAtJudgment(snapshot(), judgment([]))
  assert.equal(JSON.stringify(record).includes('bytes'), false)
})
