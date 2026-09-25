import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { inflateSync } from 'node:zlib'

import { freezeUploadedPacket } from '../../lib/desk/freeze-upload.ts'
import { extractionResultSchema } from '../../lib/field-registry/extract.ts'
import { verifyFrozenRecord } from '../../lib/field-registry/freeze.ts'
import { STATED_ABSENT_PREFIX } from '../../lib/field-registry/pack-align.ts'
import { UNFPA_FIELD_KEYS } from '../../lib/field-registry/packs/unfpa.ts'

const PDF_SHA256 = 'be80723e5df1013dfc8c9244bdcc342742db769dabab254ae0d4ddd8e93ad7d2'
const HASH = 'ab'.repeat(32)
const EXTRACTED_AT = '2026-09-25T00:00:00.000Z'
const UNREAD = 'Not extracted from this packet.'

function fragment(id, text, extra = {}) {
  return {
    fragmentId: id,
    sourceFileHash: HASH,
    sourceRef: { kind: 'page', id: extra.page ?? 'page-1', label: 'packet.pdf' },
    text,
    extractedAt: EXTRACTED_AT,
    confidence: 0.8,
    extractorId: 'extractor.test',
    kind: extra.kind ?? 'text',
    ...(extra.tags ? { tags: extra.tags } : {}),
  }
}

function freeze(fragments, packId = 'unfpa') {
  const sourceFileHash = fragments[0]?.sourceFileHash ?? HASH
  return freezeUploadedPacket({
    extraction: extractionResultSchema.parse({
      schemaVersion: 'extraction-result-v1',
      providerId: 'talonic',
      extractorId: 'extractor.test',
      fileName: 'packet.pdf',
      mediaType: 'application/pdf',
      sourceFileHash,
      fragments,
    }),
    packId,
    organizationId: 'org_trace_demo',
    actorId: 'user_fixture_reviewer',
    actorRole: 'Procurement Officer',
    procurementReference: 'Rehearsal · IA/2025-29 Sudan pre-award file (synthetic)',
    frozenAt: EXTRACTED_AT,
  })
}

function field(outcome, key) {
  const found = outcome.record.snapshot.fields.find(item => item.key === key)
  assert.ok(found, key)
  return found
}

function ascii85Decode(input) {
  const body = input.replace(/\s+/g, '').replace(/~>$/, '')
  const out = []
  for (let index = 0; index < body.length;) {
    if (body[index] === 'z') {
      out.push(0, 0, 0, 0)
      index += 1
      continue
    }
    const chunk = body.slice(index, index + 5)
    index += chunk.length
    if (chunk.length < 2) break
    let value = 0
    for (let place = 0; place < 5; place += 1) {
      const code = place < chunk.length ? chunk.charCodeAt(place) : 117
      value = value * 85 + (code - 33)
    }
    const bytes = [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255]
    out.push(...bytes.slice(0, chunk.length - 1))
  }
  return Buffer.from(out)
}

function pdfLiteral(value) {
  let text = ''
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]
    if (char !== '\\') {
      const code = char.charCodeAt(0)
      if (code === 0x96 || code === 0x97) text += '-'
      else if (code < 32) text += ' '
      else text += char
      continue
    }
    const next = value[index + 1] ?? ''
    const mapped = { n: '\n', r: '\n', t: ' ', b: '', f: '', '(': '(', ')': ')', '\\': '\\' }
    if (mapped[next] !== undefined) {
      text += mapped[next]
      index += 1
      continue
    }
    if (/[0-7]/.test(next)) {
      let octal = ''
      while (index + 1 < value.length && octal.length < 3 && /[0-7]/.test(value[index + 1])) {
        octal += value[index + 1]
        index += 1
      }
      text += String.fromCharCode(Number.parseInt(octal, 8))
      continue
    }
  }
  return text
}

function rehearsalText(pdf) {
  const parts = []
  let cursor = 0
  const source = pdf.toString('latin1')
  while (cursor < source.length) {
    const start = source.indexOf('stream\n', cursor)
    if (start < 0) break
    const end = source.indexOf('endstream', start)
    if (end < 0) break
    const raw = source.slice(start + 'stream\n'.length, end).trim()
    cursor = end + 'endstream'.length
    if (!raw.includes('~>')) continue
    const content = inflateSync(ascii85Decode(raw)).toString('latin1')
    for (const match of content.matchAll(/\((?:\\.|[^\\)])*\)/g)) {
      parts.push(pdfLiteral(match[0].slice(1, -1)))
    }
  }
  return parts.join('\n')
}

test('a stated field is mapped with provenance', () => {
  const outcome = freeze([
    fragment('frag.present', 'UNPP profile validated 2026-07-01 for the implementing partner.', {
      tags: ['document_text'],
    }),
  ])
  const profile = field(outcome, 'ip.unpp_profile')
  assert.equal(profile.value.state, 'present')
  assert.match(profile.value.state === 'present' ? String(profile.value.value) : '', /UNPP profile validated 2026-07-01/)
  assert.equal(profile.provenance.verificationMethod, 'adapter_extract')
  assert.equal(profile.provenance.sourceFileHash, HASH)
  assert.equal(profile.provenance.sourceRef.kind, 'page')
  assert.equal(profile.provenance.sourceRef.id, 'page-1')
  assert.match(profile.provenance.sourceRef.label ?? '', /UNPP profile validated/)
  assert.equal(outcome.view.fields.find(item => item.key === 'ip.unpp_profile')?.fromPacket, true)
  const unread = field(outcome, 'ip.hact_micro_assessment')
  assert.equal(unread.value.state, 'missing')
  assert.equal(unread.value.state === 'missing' ? unread.value.reason : '', UNREAD)
  assert.equal(verifyFrozenRecord(outcome.record).recordId, outcome.record.recordId)
})

test('an explicit absence stays negative or missing, and never present', () => {
  const outcome = freeze([
    fragment(
      'frag.absent',
      'No approved purchase order was issued before the goods were received. No Regional Director approval is on file. The individual score cells are blank.',
      { tags: ['document_text'] },
    ),
  ])
  const po = field(outcome, 'procurement.po_or_contract')
  assert.equal(po.value.state, 'missing')
  assert.match(po.value.state === 'missing' ? po.value.reason : '', new RegExp(`^${STATED_ABSENT_PREFIX}`))
  assert.match(po.value.state === 'missing' ? po.value.reason : '', /no approved purchase order/i)
  assert.equal(outcome.view.fields.find(item => item.key === 'procurement.po_or_contract')?.fromPacket, true)
  const approver = field(outcome, 'ip.threshold_approver')
  assert.equal(approver.value.state, 'negative')
  assert.equal(approver.value.state === 'negative' ? approver.value.value : null, false)
  assert.match(outcome.view.fields.find(item => item.key === 'ip.threshold_approver')?.detail ?? '', /Negative: false/)
  assert.match(approver.provenance.sourceRef.label ?? '', /Regional Director approval/i)
  const scores = field(outcome, 'procurement.rfq_criteria_and_scores')
  assert.equal(scores.value.state, 'missing')
  assert.match(scores.value.state === 'missing' ? scores.value.reason : '', /blank/i)
  assert.equal(field(outcome, 'ip.competitive_or_waiver').value.state, 'missing')
  assert.equal(
    field(outcome, 'ip.competitive_or_waiver').value.state === 'missing'
      ? field(outcome, 'ip.competitive_or_waiver').value.reason
      : '',
    UNREAD,
  )
})

test('unknown content and keyword overlap stay unmapped', () => {
  const outcome = freeze([
    fragment('frag.unknown', 'Rainfall in the rehearsal county was below the seasonal average.', {
      tags: ['document_text'],
    }),
    fragment(
      'frag.overlap',
      'The training slide mentions a purchase order, evaluation scores, and a regional director in general terms. IP selection path: non-competitive. Approval on file: Representative approval only.',
      { tags: ['document_text'] },
    ),
    fragment('frag.bare', 'ip.threshold_approver present: true', { tags: ['document_text'] }),
  ])
  for (const key of UNFPA_FIELD_KEYS) {
    const item = field(outcome, key)
    assert.equal(item.value.state, 'missing', key)
    assert.equal(item.value.state === 'missing' ? item.value.reason : '', UNREAD, key)
    assert.equal(outcome.view.fields.find(view => view.key === key)?.fromPacket, false, key)
  }
  assert.equal(outcome.view.unmappedFragmentCount, 3)
  assert.equal(outcome.view.fields.some(item => item.key === 'waiver.noted'), false)
})

test('a waiver fragment still maps, and a hallucinated pack value does not override the document', () => {
  const outcome = freeze([
    fragment('frag.waiver', 'Waiver stub for packet.pdf. Authority is not decided here.', { kind: 'waiver' }),
    fragment('frag.doc', 'No Regional Director approval is on file.', { tags: ['document_text'] }),
    fragment('frag.invented', 'ip.threshold_approver: true'),
  ])
  const waiver = outcome.record.snapshot.fields.find(item => item.key === 'waiver.noted')
  assert.equal(waiver?.value.state, 'present')
  assert.equal(outcome.view.fields.find(item => item.key === 'waiver.noted')?.fromPacket, true)
  const approver = field(outcome, 'ip.threshold_approver')
  assert.equal(approver.value.state, 'negative')
  assert.equal(approver.value.state === 'negative' ? approver.value.value : null, false)
  assert.equal(outcome.view.unmappedFragmentCount, 2)
})

test('the UNFPA rehearsal packet fills only the controls it states', () => {
  const pdf = readFileSync(new URL('../../fixtures/desk/unfpa-ia-2025-29-sudan-rehearsal.pdf', import.meta.url))
  const hash = createHash('sha256').update(pdf).digest('hex')
  assert.equal(hash, PDF_SHA256)
  const text = rehearsalText(pdf)
  assert.match(text, /No Regional Director approval is\s+on file/)
  assert.match(text, /individual score cells are blank/)
  assert.match(text, /No approved purchase order/)
  assert.match(text, /no policy-compliant RIR/)
  assert.match(text, /non-competitive/)
  const outcome = freeze([
    fragment('frag.rehearsal', text, { tags: ['document_text'] }),
  ].map(item => ({ ...item, sourceFileHash: hash })))
  assert.equal(outcome.view.sourceFileHash, hash)
  assert.equal(outcome.view.packVersion, '2026.1')
  assert.equal(outcome.record.snapshot.framework.version, '2026.1')
  assert.equal(outcome.view.readiness, 'red')
  assert.equal(outcome.view.findingCount, 26)
  assert.equal(outcome.view.findings.filter(item => item.severity === 'blocker').length, 20)
  assert.equal(outcome.view.findings.filter(item => item.severity === 'warning').length, 6)
  assert.equal(outcome.record.disposition.decision, 'request_evidence')
  assert.equal(outcome.view.unmappedFragmentCount, 1)
  assert.equal(verifyFrozenRecord(outcome.record).packsHash, outcome.record.packsHash)

  const read = {
    'ip.threshold_approver': 'negative',
    'procurement.rfq_criteria_and_scores': 'missing',
    'procurement.po_or_contract': 'missing',
    'procurement.rir': 'missing',
  }
  for (const key of UNFPA_FIELD_KEYS) {
    const item = field(outcome, key)
    const view = outcome.view.fields.find(entry => entry.key === key)
    if (read[key]) {
      assert.equal(item.value.state, read[key], key)
      assert.equal(view?.fromPacket, true, key)
      if (item.value.state === 'negative') assert.equal(item.value.value, false, key)
      if (item.value.state === 'missing') {
        assert.match(item.value.reason, new RegExp(`^${STATED_ABSENT_PREFIX}`), key)
        assert.notEqual(item.value.reason, UNREAD, key)
      }
    } else {
      assert.equal(item.value.state, 'missing', key)
      assert.equal(item.value.state === 'missing' ? item.value.reason : '', UNREAD, key)
      assert.equal(view?.fromPacket, false, key)
    }
  }
  assert.equal(field(outcome, 'ip.competitive_or_waiver').value.state, 'missing')
  assert.equal(field(outcome, 'procurement.rir').provenance.sourceRef.id, 'page-2')
  assert.equal(field(outcome, 'ip.threshold_approver').provenance.sourceRef.id, 'page-1')
  assert.equal(field(outcome, 'procurement.po_or_contract').provenance.sourceRef.id, 'page-1')
  assert.equal(outcome.record.snapshot.fields.some(item => item.key === 'audit.office_rating'), false)
  const approverFinding = outcome.view.findings.find(item => item.code === 'unfpa_ip_threshold_approver_missing')
  assert.match(approverFinding?.summary ?? '', /negative:false/)
  const poFinding = outcome.view.findings.find(item => item.code === 'unfpa_procurement_po_missing')
  assert.match(poFinding?.summary ?? '', /Stated absent in this packet/)
})
