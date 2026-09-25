import assert from 'node:assert/strict'
import { mock, test } from 'node:test'
import { MockExtractionProvider } from '../../lib/field-registry/extract-mock.ts'
import { hashJson, verifyFrozenRecord } from '../../lib/field-registry/freeze.ts'
import { awardRegistrySnapshotSchema } from '../../lib/field-registry/schema.ts'
import { DeskReviewError } from '../../lib/desk/review-apply.ts'
import { decisionsForRows } from '../../lib/desk/review.ts'
import { freezeReviewedPacket, freezeUploadedPacket, prepareUploadChecklist } from '../../lib/desk/freeze-upload.ts'

const secret = 'SECRET_FILE_BYTES_SHOULD_NOT_LEAK'
const secretBytes = new TextEncoder().encode(secret)
const frozenAt = '2026-09-22T12:00:00.000Z'
const actor = {
  organizationId: 'org_trace_demo',
  actorId: 'user_fixture_reviewer',
  actorRole: 'Procurement Officer',
}

function presentDecision(page = '4') {
  return {
    key: 'eligibility.contractor_capable',
    action: 'present',
    value: 'true',
    page,
    quote: 'The contractor is able to perform this work.',
    note: '',
  }
}

async function packet() {
  const provider = new MockExtractionProvider()
  const extraction = await provider.extract({
    fileName: 'packet.txt',
    mediaType: 'text/plain',
    bytes: secretBytes,
    organizationId: actor.organizationId,
  })
  const direct = freezeUploadedPacket({
    extraction,
    packId: 'global-fund',
    ...actor,
    frozenAt,
  })
  const checklist = prepareUploadChecklist({
    extraction,
    packId: 'global-fund',
    organizationId: actor.organizationId,
    asOf: frozenAt,
  })
  return { extraction, direct, checklist }
}

test('an untouched checklist freezes to the same hashes as the extract', async () => {
  const { direct, checklist } = await packet()
  const reviewed = freezeReviewedPacket({
    checklist,
    decisions: [],
    ...actor,
    frozenAt,
  })
  assert.equal(reviewed.record.snapshotHash, direct.record.snapshotHash)
  assert.equal(reviewed.record.packsHash, direct.record.packsHash)
  assert.equal(hashJson(reviewed.record.snapshot), direct.record.snapshotHash)
  assert.equal(reviewed.view.findingCount, direct.view.findingCount)
  assert.equal(reviewed.view.readiness, direct.view.readiness)
  for (const field of reviewed.record.snapshot.fields) {
    assert.equal(field.provenance.verificationMethod, 'adapter_extract')
    assert.equal(Object.hasOwn(field.provenance, 'extractedValue'), false)
    assert.equal(Object.hasOwn(field.provenance, 'reviewedBy'), false)
    assert.equal(Object.hasOwn(field.provenance, 'reviewQuote'), false)
  }
  const reparsed = awardRegistrySnapshotSchema.parse(structuredClone(direct.record.snapshot))
  assert.equal(hashJson(reparsed), direct.record.snapshotHash)
  assert.equal(JSON.stringify(reviewed.record).includes(secret), false)
})

test('a reviewer edit keeps the extract, recomputes findings, and hashes stably', async () => {
  const { direct, checklist } = await packet()
  const titles = checklist.rows.map(row => row.title)
  assert.ok(titles.includes('Contractor ability to perform must be affirmed'))
  assert.ok(checklist.rows.some(row => row.open))
  const decisions = decisionsForRows(checklist.rows, [presentDecision()])
  const reviewed = freezeReviewedPacket({
    checklist,
    decisions,
    ...actor,
    frozenAt,
  })
  const again = freezeReviewedPacket({
    checklist,
    decisions,
    ...actor,
    frozenAt,
  })
  assert.equal(again.record.snapshotHash, reviewed.record.snapshotHash)
  assert.equal(again.record.packsHash, reviewed.record.packsHash)
  assert.notEqual(reviewed.record.snapshotHash, direct.record.snapshotHash)

  const field = reviewed.record.snapshot.fields.find(item => item.key === 'eligibility.contractor_capable')
  assert.equal(field.value.state, 'present')
  assert.equal(field.value.value, true)
  assert.equal(field.provenance.verificationMethod, 'reviewer_attested')
  assert.equal(field.provenance.extractedVerificationMethod, 'adapter_extract')
  assert.deepEqual(field.provenance.extractedValue, { state: 'missing', reason: 'Not extracted from this packet.' })
  assert.equal(field.provenance.extractedSourceRef.kind, 'page')
  assert.equal(field.provenance.reviewedBy, actor.actorId)
  assert.equal(field.provenance.reviewedAt, frozenAt)
  assert.equal(field.provenance.sourceRef.id, 'page-4')
  assert.match(field.provenance.reviewQuote, /able to perform/)
  assert.match(field.provenance.sourceRef.label, /^Quote: /)
  assert.equal(reviewed.view.fields.find(item => item.key === field.key)?.fromPacket, true)
  assert.equal(reviewed.view.findings.some(finding => finding.code === 'gf_eligibility_not_met'), false)
  assert.ok(reviewed.view.findingCount < direct.view.findingCount)
  assert.equal(reviewed.view.readiness, 'red')
  assert.equal(verifyFrozenRecord(reviewed.record).snapshotHash, reviewed.record.snapshotHash)

  const moved = freezeReviewedPacket({
    checklist,
    decisions: decisionsForRows(checklist.rows, [presentDecision('9')]),
    ...actor,
    frozenAt,
  })
  assert.notEqual(moved.record.snapshotHash, reviewed.record.snapshotHash)

  const stated = freezeReviewedPacket({
    checklist,
    decisions: decisionsForRows(checklist.rows, [{
      key: 'integrity.coi_disclosed',
      action: 'stated_absent',
      value: '',
      page: '3',
      quote: 'No conflict of interest disclosure is on file.',
      note: '',
    }]),
    ...actor,
    frozenAt,
  })
  const absent = stated.record.snapshot.fields.find(item => item.key === 'integrity.coi_disclosed')
  assert.equal(absent.value.state, 'missing')
  assert.match(absent.value.reason, /^Stated absent in this packet: /)
  assert.equal(absent.provenance.verificationMethod, 'reviewer_attested')
  assert.equal(stated.view.findings.some(finding => finding.code === 'gf_coi_not_disclosed'), true)

  assert.throws(
    () => freezeReviewedPacket({
      checklist,
      decisions: decisionsForRows(checklist.rows, [{ ...presentDecision(), page: '' }]),
      ...actor,
      frozenAt,
    }),
    DeskReviewError,
  )

  const tampered = structuredClone(reviewed.record)
  delete tampered.snapshot.fields.find(item => item.key === 'eligibility.contractor_capable').provenance.extractedValue
  assert.throws(() => verifyFrozenRecord(tampered))
})

test('the checklist route does not freeze, and freeze records the session reviewer', async () => {
  mock.module('next/headers', {
    namedExports: { headers: async () => new Headers({ host: '127.0.0.1' }) },
  })
  mock.module('@workos-inc/authkit-nextjs', {
    namedExports: {
      withAuth: async () => { throw new Error('no session') },
      getWorkOS: () => { throw new Error('no workos') },
    },
  })
  mock.module(new URL('../../lib/workspace-access.ts', import.meta.url).href, {
    namedExports: { isWorkOSConfigured: () => false },
  })
  process.env.TRACELI_TRACE_MODE = 'local'
  process.env.NODE_ENV = 'development'
  delete process.env.VERCEL
  process.env.DATABASE_URL = 'postgres://trace:trace@127.0.0.1:5432/trace'
  delete process.env.TRACE_EXTRACTION_PROVIDER

  const { POST: postChecklist } = await import('../../app/api/desk/checklist/route.ts')
  const { POST: postFreeze } = await import('../../app/api/desk/freeze/route.ts')
  const form = new FormData()
  form.set('file', new File([secretBytes], 'packet.txt', { type: 'text/plain' }))
  form.set('packId', 'global-fund')
  const extracted = await postChecklist(new Request('http://127.0.0.1/api/desk/checklist', {
    method: 'POST',
    headers: { host: '127.0.0.1', origin: 'http://127.0.0.1' },
    body: form,
  }))
  assert.equal(extracted.status, 200, await extracted.clone().text())
  const checklist = await extracted.json()
  assert.equal(checklist.schemaVersion, 'upload-desk-checklist-v1')
  assert.equal(checklist.organizationId, 'org_trace_local')
  assert.equal(checklist.record, undefined)
  assert.ok(checklist.rows.length > 10)
  assert.equal(JSON.stringify(checklist).includes(secret), false)

  const frozen = await postFreeze(new Request('http://127.0.0.1/api/desk/freeze', {
    method: 'POST',
    headers: { host: '127.0.0.1', origin: 'http://127.0.0.1', 'content-type': 'application/json' },
    body: JSON.stringify({
      checklist,
      decisions: [{
        key: 'award.contract_value_usd',
        action: 'present',
        value: '150000',
        page: '6',
        quote: 'Contract value USD 150000.',
        note: '',
      }],
    }),
  }))
  assert.equal(frozen.status, 200, await frozen.clone().text())
  const view = await frozen.json()
  const value = view.snapshot.fields.find(field => field.key === 'award.contract_value_usd')
  assert.equal(value.provenance.verificationMethod, 'reviewer_attested')
  assert.equal(value.provenance.reviewedBy, 'fixture-reviewer')
  assert.equal(value.value.value, 150000)
  assert.equal(view.record.snapshotHash, hashJson(view.snapshot))
  const refused = await postFreeze(new Request('http://127.0.0.1/api/desk/freeze', {
    method: 'POST',
    headers: { host: '127.0.0.1', origin: 'http://127.0.0.1', 'content-type': 'application/json' },
    body: JSON.stringify({
      checklist,
      decisions: [{ ...presentDecision(), key: 'award.contract_value_usd', page: 'nope' }],
    }),
  }))
  assert.equal(refused.status, 400)
})
