import assert from 'node:assert/strict'
import { inflateSync } from 'node:zlib'
import { after, mock, test } from 'node:test'

import { MockExtractionProvider } from '../../lib/field-registry/extract-mock.ts'
import { STATED_ABSENT_PREFIX } from '../../lib/field-registry/pack-align.ts'
import { GLOBAL_FUND_RULES } from '../../lib/field-registry/packs/global-fund.ts'
import {
  GF_OIG_25_005_PACKS_HASH,
  GF_OIG_25_005_RECORD_ID,
  GF_OIG_25_005_SNAPSHOT_HASH,
  gfOig25005FrozenRecord,
} from '../../lib/case-cards/gf-oig-25-005-freeze.ts'
import {
  OIOS_2025_098_PACKS_HASH,
  OIOS_2025_098_RECORD_ID,
  OIOS_2025_098_SNAPSHOT_HASH,
  oios2025098FrozenRecord,
} from '../../lib/case-cards/oios-2025-098-cbpf-reserve-freeze.ts'
import { freezeUploadedPacket, supersedeUploadedPacket } from '../../lib/desk/freeze-upload.ts'
import { evaluateDonorPack } from '../../lib/field-registry/packs/index.ts'
import {
  PILOT_BOUNDARY,
  PILOT_HASH_RECOMPUTE,
  PilotReportError,
  buildPilotReport,
  evidenceRequestForRule,
  groupPilotChecklist,
} from '../../lib/pilot-report/build.ts'
import { hashJson } from '../../lib/field-registry/freeze.ts'
import { PILOT_PAGE_HEIGHT, PILOT_PAGE_WIDTH, renderPilotReportPdf } from '../../lib/pilot-report/pdf.ts'
import { sessionFromFrozenRecord, sessionFromJson } from '../../lib/pilot-report/session.ts'
import { PDFDocument } from 'pdf-lib'

const envKeys = ['TRACELI_TRACE_MODE', 'NODE_ENV', 'VERCEL', 'DATABASE_URL', 'TRACE_EXTRACTION_PROVIDER']
const savedEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]))

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

const { POST } = await import('../../app/api/desk/pilot-report/route.ts')

after(() => {
  for (const key of envKeys) {
    if (savedEnv[key] === undefined) delete process.env[key]
    else process.env[key] = savedEnv[key]
  }
})

function enableLocal() {
  process.env.TRACELI_TRACE_MODE = 'local'
  process.env.NODE_ENV = 'development'
  delete process.env.VERCEL
  process.env.DATABASE_URL = 'postgres://trace:trace@127.0.0.1:5432/trace'
  delete process.env.TRACE_EXTRACTION_PROVIDER
}

function disableTrace() {
  process.env.TRACELI_TRACE_MODE = 'disabled'
  delete process.env.VERCEL
  delete process.env.TRACE_EXTRACTION_PROVIDER
}

function row(groups, id, title) {
  return groups.find(group => group.id === id)?.rows.find(item => item.title === title)
}

function pdfPlainText(bytes) {
  const raw = Buffer.from(bytes)
  const parts = []
  let cursor = 0
  while (cursor < raw.length) {
    const start = raw.indexOf('stream', cursor)
    if (start < 0) break
    let bodyStart = start + 'stream'.length
    if (raw[bodyStart] === 0x0d && raw[bodyStart + 1] === 0x0a) bodyStart += 2
    else if (raw[bodyStart] === 0x0a) bodyStart += 1
    const end = raw.indexOf('endstream', bodyStart)
    if (end < 0) break
    const body = raw.subarray(bodyStart, end)
    try {
      parts.push(inflateSync(body).toString('latin1'))
    } catch {
      parts.push(body.toString('latin1'))
    }
    cursor = end + 'endstream'.length
  }
  return parts.join('\n').replace(/<([0-9A-Fa-f]+)>/g, (match, hex) => {
    if (hex.length % 2 !== 0) return match
    return Buffer.from(hex, 'hex').toString('latin1')
  })
}

test('checklist groups use human titles, quotes, pages, and an optional reviewer marker', () => {
  const groups = groupPilotChecklist([
    {
      key: 'eligibility.contractor_capable',
      value: { state: 'present', value: true },
      sourceRef: { kind: 'page', id: 'page-3', label: 'Quote: The contractor can perform the work.' },
      verificationMethod: 'adapter_extract',
    },
    {
      key: 'integrity.coi_disclosed',
      value: { state: 'present', value: true },
      sourceRef: { kind: 'page', id: 'page-5', label: 'Quote: Conflicts were disclosed.' },
      verificationMethod: 'reviewer_attested',
      reviewedBy: 'Ada Lovelace',
      reviewedAt: '2026-09-22T12:05:00.000Z',
    },
    {
      key: 'documentation.award_rationale_on_file',
      value: { state: 'present', value: true },
      sourceRef: { kind: 'page', id: 'page-6' },
      verificationMethod: 'reviewer_attested',
    },
    {
      key: 'procurement.competitive_or_exempt',
      value: { state: 'present', value: true },
      sourceRef: { kind: 'page', id: 'page-4' },
      reviewedBy: 'Ada Lovelace',
      reviewedAt: '2026-09-22T12:05:00.000Z',
    },
    {
      key: 'procurement.competition_or_exemption_documented',
      value: { state: 'missing', reason: `${STATED_ABSENT_PREFIX}No competition file is in the packet.` },
      sourceRef: { kind: 'page', id: 'page-7', label: 'Quote: No competition file is in the packet.' },
    },
    {
      key: 'threshold.method_aligned',
      value: { state: 'negative', value: false },
      sourceRef: { kind: 'page', id: 'page-8', label: 'Quote: The method is not aligned to the threshold.' },
      verificationMethod: 'human_confirmed',
    },
    {
      key: 'award.contract_value_usd',
      value: { state: 'missing', reason: 'Not extracted from this packet.' },
      sourceRef: { kind: 'page', id: 'packet', label: 'packet.pdf' },
    },
    {
      key: 'pricing.table',
      value: { state: 'missing', reason: 'Not extracted from this packet.' },
      sourceRef: { kind: 'page', id: 'packet', label: 'packet.pdf' },
    },
  ], GLOBAL_FUND_RULES)

  assert.deepEqual(groups.map(group => group.heading), [
    'On file',
    'Stated absent in the file',
    'Marked negative',
    'Missing',
  ])
  const onFile = row(groups, 'on_file', 'Contractor ability to perform must be affirmed')
  assert.equal(onFile.detail, 'Page 3')
  assert.equal(onFile.confirmedByReviewer, false)
  const confirmed = row(groups, 'on_file', 'Conflict of interest disclosure required')
  assert.equal(confirmed.detail, 'Page 5')
  assert.equal(confirmed.confirmedByReviewer, true)
  assert.equal(confirmed.confirmationNote, 'Confirmed by reviewer · Ada Lovelace · 22 Sep 2026, 12:05 UTC')
  const attestedOnly = row(groups, 'on_file', 'Award rationale documentation required')
  assert.equal(attestedOnly.confirmedByReviewer, true)
  assert.equal(attestedOnly.confirmationNote, 'Confirmed by reviewer')
  const namedWithoutFlag = row(groups, 'on_file', 'Award must be competitive or an established exemption')
  assert.equal(namedWithoutFlag.detail, 'Page 4')
  assert.equal(namedWithoutFlag.confirmedByReviewer, false)
  assert.equal(namedWithoutFlag.confirmationNote, null)
  assert.equal(onFile.confirmationNote, null)
  const absent = row(groups, 'stated_absent', 'Competition or sole-source exemption documentation required')
  assert.match(absent.detail, /Page 7/)
  assert.match(absent.detail, /No competition file is in the packet/)
  assert.equal(absent.confirmedByReviewer, false)
  assert.equal(absent.confirmationNote, null)
  const negative = row(groups, 'negative', 'Procurement method must align with value threshold')
  assert.match(negative.detail, /The method is not aligned to the threshold/)
  assert.equal(negative.confirmedByReviewer, false)
  const missing = row(groups, 'missing', 'Contract value must be on the registry')
  assert.equal(missing.detail, 'Not in this file.')
  assert.equal(missing.confirmedByReviewer, false)
  const rendered = JSON.stringify(groups)
  assert.equal(rendered.includes('eligibility.contractor_capable'), false)
  assert.equal(rendered.includes('integrity.coi_disclosed'), false)
  assert.equal(rendered.includes('pricing.table'), false)
  assert.equal(rendered.includes('award.contract_value_usd'), false)
})

test('auditor requests use the pack rule text and an optional remediation field', () => {
  const rule = GLOBAL_FUND_RULES.find(item => item.fieldKey === 'integrity.coi_disclosed')
  const request = evidenceRequestForRule(rule)
  assert.match(request, /Ask for this evidence: Conflict of interest disclosure required/)
  assert.equal(request.includes('integrity.coi_disclosed'), false)
  const withRemediation = evidenceRequestForRule({
    ...rule,
    remediation: 'File the signed conflict note named by this rule.',
  })
  assert.match(withRemediation, /Conflict of interest disclosure required/)
  assert.match(withRemediation, /File the signed conflict note named by this rule/)
  assert.equal(withRemediation.includes('must be investigated as fraud'), false)
})

test('published freezes keep their hashes and human checklist titles', () => {
  for (const sample of [
    {
      record: gfOig25005FrozenRecord(),
      recordId: GF_OIG_25_005_RECORD_ID,
      snapshotHash: GF_OIG_25_005_SNAPSHOT_HASH,
      packsHash: GF_OIG_25_005_PACKS_HASH,
      title: 'Conflict of interest disclosure required',
      file: 'gf-oig-25-005-rehearsal.pdf',
    },
    {
      record: oios2025098FrozenRecord(),
      recordId: OIOS_2025_098_RECORD_ID,
      snapshotHash: OIOS_2025_098_SNAPSHOT_HASH,
      packsHash: OIOS_2025_098_PACKS_HASH,
      title: 'Allocation modality must be standard or reserve',
      file: 'oios-2025-098-cbpf-rehearsal.pdf',
    },
  ]) {
    const session = sessionFromFrozenRecord(sample.record, { reviewerName: 'Workspace Admin' })
    const report = buildPilotReport(session)
    const evaluated = evaluateDonorPack(sample.record.snapshot, sample.record.snapshot.framework.frameworkId, {
      evaluatedAt: sample.record.frozenAt,
    })
    const open = evaluated.findings.filter(finding => finding.severity === 'blocker' || finding.severity === 'warning').length
    const blockers = evaluated.findings.filter(finding => finding.severity === 'blocker').length
    assert.equal(report.wordmark, 'Trace-li')
    assert.equal(report.fileName, sample.file)
    assert.equal(report.verification.recordId, sample.recordId)
    assert.equal(report.verification.snapshotHash, sample.snapshotHash)
    assert.equal(report.verification.packsHash, sample.packsHash)
    assert.equal(report.verification.hashMethod, 'sha256:sorted-json-v1')
    assert.equal(report.verification.recompute, PILOT_HASH_RECOMPUTE)
    assert.equal(report.boundary, PILOT_BOUNDARY)
    assert.equal(report.openItemCount, open)
    assert.equal(report.auditorAsks.length, blockers)
    assert.match(report.summary, /not ready \(red\)/)
    assert.match(report.summary, /request evidence/)
    assert.match(report.summary, new RegExp(sample.record.disposition.rationale.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    assert.equal(report.groups.find(group => group.id === 'on_file').rows.length, 0)
    assert.equal(report.groups.find(group => group.id === 'stated_absent').rows.length, 0)
    assert.equal(report.groups.find(group => group.id === 'negative').rows.length, 0)
    assert.ok(report.groups.find(group => group.id === 'missing').rows.some(item => item.title === sample.title))
    assert.equal(report.groups.every(group => group.rows.every(item => item.confirmedByReviewer === false)), true)
    for (const ask of report.auditorAsks) {
      assert.match(ask.request, /^Ask for this evidence: /)
      assert.equal(/^[a-z][a-z0-9_.]+$/.test(ask.title), false)
    }
    const tampered = sessionFromJson(JSON.parse(JSON.stringify(session)))
    tampered.judgment = {
      ...tampered.judgment,
      record: { ...tampered.judgment.record, snapshotHash: 'ab'.repeat(32) },
    }
    assert.throws(() => buildPilotReport(tampered), error => error instanceof PilotReportError)
  }
})

test('the PDF is a real document sized for A4 and US Letter', async () => {
  const report = buildPilotReport(sessionFromFrozenRecord(gfOig25005FrozenRecord(), { reviewerName: 'Workspace Admin' }))
  const bytes = await renderPilotReportPdf(report)
  assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), '%PDF-')
  const loaded = await PDFDocument.load(bytes)
  assert.match(loaded.getTitle() ?? '', /Trace-li/)
  assert.ok(loaded.getPageCount() >= 1)
  const page = loaded.getPage(0)
  const size = page.getSize()
  assert.equal(size.width, PILOT_PAGE_WIDTH)
  assert.equal(size.height, PILOT_PAGE_HEIGHT)
  assert.ok(size.width <= 595.28 + 0.01)
  assert.ok(size.width <= 612)
  assert.ok(size.height <= 792 + 0.01)
  assert.ok(size.height <= 841.89)
})

test('the signed-in desk route returns a PDF for that org only', async () => {
  enableLocal()
  const provider = new MockExtractionProvider()
  const extraction = await provider.extract({
    fileName: 'packet.txt',
    mediaType: 'text/plain',
    bytes: new TextEncoder().encode('packet'),
    organizationId: 'org_trace_local',
  })
  const frozen = freezeUploadedPacket({
    extraction,
    packId: 'global-fund',
    organizationId: 'org_trace_local',
    actorId: 'fixture-reviewer',
    actorRole: 'Procurement Director',
    procurementReference: 'RFP-LOCAL-41',
    frozenAt: '2026-09-22T12:00:00.000Z',
  })
  const judged = supersedeUploadedPacket({
    view: frozen.view,
    decision: 'escalate',
    reason: 'Send this packet for review before sign-off. The checklist is still open.',
    organizationId: 'org_trace_local',
    actorId: 'fixture-reviewer',
    actorRole: 'Procurement Director',
    frozenAt: '2026-09-22T12:30:00.000Z',
  })
  const payload = { view: frozen.view, judgment: judged.judgment }
  const response = await POST(new Request('http://127.0.0.1/api/desk/pilot-report', {
    method: 'POST',
    headers: { host: '127.0.0.1', origin: 'http://127.0.0.1', 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  }))
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type') ?? '', /application\/pdf/)
  assert.match(response.headers.get('content-disposition') ?? '', /trace-li-pilot-report-rfp-local-41\.pdf/)
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0')
  const bytes = Buffer.from(await response.arrayBuffer())
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-')
  assert.equal(bytes.includes(Buffer.from('packet')), false)
  assert.equal(pdfPlainText(bytes).includes('Confirmed by reviewer'), false)

  const attested = structuredClone(payload)
  const field = attested.view.snapshot.fields.find(item => item.key === 'integrity.coi_disclosed')
    ?? attested.view.snapshot.fields[0]
  field.provenance.verificationMethod = 'reviewer_attested'
  field.provenance.reviewedBy = 'Ada Lovelace'
  field.provenance.reviewedAt = '2026-09-22T12:05:00.000Z'
  const attestedHash = hashJson(attested.view.snapshot)
  attested.view.record.snapshotHash = attestedHash
  attested.judgment.record.snapshotHash = attestedHash
  const attestedResponse = await POST(new Request('http://127.0.0.1/api/desk/pilot-report', {
    method: 'POST',
    headers: { host: '127.0.0.1', origin: 'http://127.0.0.1', 'content-type': 'application/json' },
    body: JSON.stringify(attested),
  }))
  assert.equal(attestedResponse.status, 200)
  const attestedText = pdfPlainText(Buffer.from(await attestedResponse.arrayBuffer()))
  assert.equal(attestedText.includes('Confirmed by reviewer'), true)
  assert.equal(attestedText.includes('Ada Lovelace'), true)
  assert.equal(attestedText.includes('22 Sep 2026, 12:05 UTC'), true)

  const unnamed = structuredClone(payload)
  const unnamedField = unnamed.view.snapshot.fields[0]
  unnamedField.provenance.verificationMethod = 'reviewer_attested'
  delete unnamedField.provenance.reviewedBy
  delete unnamedField.provenance.reviewedAt
  const unnamedHash = hashJson(unnamed.view.snapshot)
  unnamed.view.record.snapshotHash = unnamedHash
  unnamed.judgment.record.snapshotHash = unnamedHash
  const unnamedResponse = await POST(new Request('http://127.0.0.1/api/desk/pilot-report', {
    method: 'POST',
    headers: { host: '127.0.0.1', origin: 'http://127.0.0.1', 'content-type': 'application/json' },
    body: JSON.stringify(unnamed),
  }))
  assert.equal(unnamedResponse.status, 200)
  const unnamedText = pdfPlainText(Buffer.from(await unnamedResponse.arrayBuffer()))
  assert.equal(unnamedText.includes('Confirmed by reviewer'), true)
  assert.equal(unnamedText.includes('Ada Lovelace'), false)
  assert.equal(unnamedText.includes('12:05 UTC'), false)

  const foreign = structuredClone(payload)
  foreign.view.organizationId = 'org_other'
  foreign.view.snapshot.organizationId = 'org_other'
  const refused = await POST(new Request('http://127.0.0.1/api/desk/pilot-report', {
    method: 'POST',
    headers: { host: '127.0.0.1', origin: 'http://127.0.0.1', 'content-type': 'application/json' },
    body: JSON.stringify(foreign),
  }))
  assert.equal(refused.status, 403)

  disableTrace()
  const anonymous = await POST(new Request('http://127.0.0.1/api/desk/pilot-report', {
    method: 'POST',
    headers: { host: '127.0.0.1', origin: 'http://127.0.0.1', 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  }))
  assert.equal(anonymous.status, 403)
})
