import assert from 'node:assert/strict'
import { inflateSync } from 'node:zlib'
import { after, mock, test } from 'node:test'

import { MockExtractionProvider } from '../../lib/field-registry/extract-mock.ts'
import { STATED_ABSENT_PREFIX } from '../../lib/field-registry/pack-align.ts'
import { GLOBAL_FUND_RULES } from '../../lib/field-registry/packs/global-fund.ts'
import { OCHA_CBPF_RULES } from '../../lib/field-registry/packs/ocha-cbpf.ts'
import { listDonorPacks } from '../../lib/field-registry/packs/index.ts'
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
  askForLine,
  frontAskLinesFor,
  buildPilotReport,
  clientFacingReason,
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

function pdfPages(bytes) {
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
  return parts
    .map(part => part.replace(/<([0-9A-Fa-f]+)>/g, (match, hex) => {
      if (hex.length % 2 !== 0) return match
      return Buffer.from(hex, 'hex').toString('latin1')
    }))
    .filter(part => part.includes('Tj'))
}

function pdfPlainText(bytes) {
  return pdfPages(bytes).join('\n')
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

test('ask lines name the thing to request and leave other titles alone', () => {
  assert.equal(askForLine('Award rationale documentation required'), 'Award rationale documentation')
  assert.equal(askForLine('Conflict of interest disclosure required'), 'Conflict of interest disclosure')
  assert.equal(askForLine('Contract value must be on the registry'), 'Contract value')
  assert.equal(askForLine('Affiliated and key persons, with roles, required on the IDD record'), 'Affiliated and key persons, with roles, on the IDD record')
  assert.equal(askForLine('List vintage cited by the screening evidence is required'), 'List vintage cited by the screening evidence')
  assert.equal(askForLine('Award must be competitive or an established exemption'), 'Award must be competitive or an established exemption')
  assert.equal(askForLine('Bid solicitation notice to prospective bidders'), 'Bid solicitation notice to prospective bidders')
  assert.equal(
    askForLine('Allocation strategy filed, including reserve pre-selection criteria'),
    'Allocation strategy, including reserve pre-selection criteria',
  )
  assert.equal(
    askForLine('Annex 7 declarations required, including conflict of interest and designated entity'),
    'Annex 7 declarations, including conflict of interest and designated entity',
  )
  assert.equal(
    askForLine('Annex 9 fraud notification path recorded, including the 48-hour partner duty'),
    'Annex 9 fraud notification path, including the 48-hour partner duty',
  )
})

test('seeded pack ask lines do not read as rules', () => {
  const banned = /\b(required|must|filed|recorded)\b/i
  const expected = new Map([
    ['gf_procurement_competitive_or_exempt', 'Proof the award was competitive, or the exemption used'],
    ['ocha_allocation_strategy', 'Allocation strategy, including reserve pre-selection criteria'],
    ['ocha_partner_annex7', 'Annex 7 declarations, including conflict of interest and designated entity'],
    ['ocha_misconduct_annex9', 'Annex 9 fraud notification path, including the 48-hour partner duty'],
  ])
  assert.ok(listDonorPacks().length >= 4)
  for (const pack of listDonorPacks()) {
    assert.ok(pack.rules.length > 0, pack.packId)
    for (const rule of pack.rules) {
      const line = frontAskLinesFor([{ title: rule.title }], [], [rule], 1)[0]
      assert.equal(banned.test(line), false, `${pack.packId} ${rule.ruleId}: ${line}`)
      const wanted = expected.get(rule.ruleId)
      if (wanted) {
        assert.equal(line, wanted)
        assert.notEqual(rule.title, line)
      }
    }
  }
  const competitive = GLOBAL_FUND_RULES.find(rule => rule.ruleId === 'gf_procurement_competitive_or_exempt')
  assert.equal(competitive.title, 'Award must be competitive or an established exemption')
  const annex = OCHA_CBPF_RULES.find(rule => rule.ruleId === 'ocha_partner_annex7')
  assert.match(annex.title, /required/)
})

test('an untouched desk draft is replaced, and an edited reason drops keys and instructions', () => {
  const draft = 'Global Fund Grant Regulations v1 readiness is red. 22 findings. Pack fields still missing: eligibility.contractor_capable, integrity.coi_disclosed, and 18 more. Evidence is still open. Edit this draft, then confirm your judgment.'
  assert.equal(
    clientFacingReason(draft, 'request_evidence', draft),
    'The reviewer asked for the missing evidence before signing.',
  )
  assert.equal(
    clientFacingReason(draft, 'escalate', draft),
    'The reviewer escalated this before signing.',
  )
  const edited = 'The committee still needs the signed conflict note for eligibility.contractor_capable. Edit this draft, then confirm your judgment. Please send it before Friday.'
  const printed = clientFacingReason(edited, 'request_evidence', draft)
  assert.match(printed, /signed conflict note/)
  assert.match(printed, /before Friday/)
  assert.equal(printed.includes('eligibility.contractor_capable'), false)
  assert.equal(printed.includes('Edit this draft'), false)
  assert.equal(/[a-z_]+\.[a-z_]+/.test(printed), false)
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
    const openRows = report.groups.filter(group => group.id !== 'on_file').reduce((sum, group) => sum + group.rows.length, 0)
    const blockers = evaluated.findings.filter(finding => finding.severity === 'blocker').length
    assert.equal(report.wordmark, 'Trace-li')
    assert.equal(report.fileName, sample.file)
    assert.equal(report.verification.recordId, sample.recordId)
    assert.equal(report.verification.snapshotHash, sample.snapshotHash)
    assert.equal(report.verification.packsHash, sample.packsHash)
    assert.equal(report.verification.hashMethod, 'sha256:sorted-json-v1')
    assert.equal(report.verification.recompute, PILOT_HASH_RECOMPUTE)
    assert.equal(report.boundary, PILOT_BOUNDARY)
    assert.equal(report.openItemCount, openRows)
    assert.equal(report.frontAskLines.length + report.furtherOpenItemCount, openRows)
    assert.equal(report.auditorAsks.length, blockers)
    assert.match(report.summary, /not ready \(red\)/)
    assert.match(report.summary, /request evidence/)
    assert.match(report.summary, /open items/)
    assert.match(report.summary, new RegExp(sample.record.disposition.rationale.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    assert.equal(report.decisionSentence, 'The decision is to request evidence before you sign.')
    assert.equal(report.printedReason, 'The reviewer asked for the missing evidence before signing.')
    assert.equal(report.printedReason.includes('Edit this draft'), false)
    assert.equal(/[a-z_]+\.[a-z_]+/.test(report.printedReason), false)
    assert.equal(report.readinessLabel, 'Not ready')
    assert.match(report.openItemLine, /^\d+ open items\.$/)
    assert.ok(report.frontAskLines.length >= 3 && report.frontAskLines.length <= 5)
    assert.equal(report.furtherOpenItemCount, report.openItemCount - report.frontAskLines.length)
    assert.equal(report.decisionSentence.includes(sample.record.disposition.rationale.slice(0, 40)), false)
    for (const line of report.frontAskLines) {
      assert.equal(/^[a-z][a-z0-9_.]+$/.test(line), false)
      assert.equal(/\b(required|must|filed|recorded)\b/i.test(line), false, line)
    }
    if (sample.file.startsWith('gf-')) {
      assert.ok(report.frontAskLines.includes('Proof the award was competitive, or the exemption used'))
    }
    if (sample.file.startsWith('oios-')) {
      assert.ok(report.frontAskLines.includes('Allocation strategy, including reserve pre-selection criteria'))
    }
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
  assert.ok(loaded.getPageCount() >= 2)
  const pages = pdfPages(bytes)
  assert.ok(pages.length >= 2)
  const first = pages[0]
  const last = pages[pages.length - 1]
  const rest = pages.slice(1).join('\n')
  assert.match(first, /The decision is to request evidence before you sign/)
  assert.match(first, /Not ready/)
  assert.match(first, /open items/)
  assert.match(first, /What to ask for/)
  assert.match(first, /Proof the award was competitive, or the exemption used/)
  assert.equal(first.includes('Award must be competitive'), false)
  assert.match(rest, /Award must be competitive or an established exemption/)
  for (const line of report.frontAskLines) assert.match(first, new RegExp(line.slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.equal(first.includes(report.verification.snapshotHash), false)
  assert.equal(first.includes(report.verification.packsHash), false)
  assert.equal(first.includes(report.verification.recordId), false)
  assert.equal(first.includes('On file'), false)
  assert.equal(first.includes('Snapshot hash'), false)
  assert.match(rest, /Checklist/)
  assert.match(rest, /On file/)
  assert.match(rest, /Missing/)
  assert.match(rest, /The reviewer asked for the missing evidence before signing/)
  assert.equal(rest.includes('Edit this draft'), false)
  assert.equal(rest.includes('Not in this file'), false)
  assert.match(first, new RegExp(`${report.openItemCount} open items`))
  if (report.furtherOpenItemCount > 0) {
    assert.match(first, new RegExp(`And ${report.furtherOpenItemCount} more open items`))
  }
  const packKey = /[a-z_]+\.[a-z_]+/
  pages.slice(0, -1).forEach((page, index) => {
    const withoutFileName = report.fileName ? page.split(report.fileName).join(' ') : page
    const hit = withoutFileName.match(packKey)
    assert.equal(hit, null, `page ${index + 1} includes ${hit?.[0] ?? ''}`)
  })
  assert.match(last, new RegExp(report.verification.recordId))
  assert.match(last, new RegExp(report.verification.snapshotHash))
  assert.match(last, new RegExp(report.verification.packsHash))
  assert.match(last, /These codes confirm this note still matches the frozen checklist/)
  assert.match(last, /does not certify the award/)
  assert.match(last, /not a finding of fraud/)
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
