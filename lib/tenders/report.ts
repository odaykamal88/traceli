import 'server-only'

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { FrozenDecisionRecord } from '@/lib/field-registry/freeze'
import type { TenderDetail, TenderIssuedRecord } from '@/lib/tenders/contract'
import { TenderError } from '@/lib/tenders/contract'

/** Render only the retained record and its pinned draft. No catalog lookup or browser payload. */
export async function renderTenderReport(detail: TenderDetail, record: TenderIssuedRecord): Promise<{ bytes: Uint8Array; fileName: string }> {
  if (!detail.draft || detail.draft.id !== record.draftId) throw new TenderError(409, 'integrity', 'The retained record is unavailable.')
  const proposal = record.kind === 'exception_proposal'
  const frozen = proposal ? null : record.payload as FrozenDecisionRecord
  const snapshot = proposal ? detail.draft.checklist.snapshot : frozen?.snapshot
  const classification = snapshot?.classification
  if (!snapshot || (classification !== 'synthetic' && classification !== 'customer')
    || detail.tender.classification !== classification
    || detail.draft.checklist.snapshot?.classification !== classification
    || (detail.policy !== null && detail.policy?.classification !== classification)) {
    throw new TenderError(409, 'integrity', 'The retained record classification is unavailable or inconsistent.')
  }
  const doc = await PDFDocument.create()
  doc.setTitle(`Trace-li saved record: ${detail.tender.reference}`)
  doc.setAuthor('Trace-li')
  doc.setCreationDate(new Date(record.issuedAt))
  doc.setModificationDate(new Date(record.issuedAt))
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const navy = rgb(0.09, 0.15, 0.22)
  const gray = rgb(0.32, 0.36, 0.40)
  let page: PDFPage
  let y = 0
  // Standard PDF fonts do not cover all Unicode. Normalize punctuation and visibly
  // replace unsupported glyphs instead of failing an otherwise valid export.
  const clean = (value: unknown) => String(value ?? '').normalize('NFKC').replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2013\u2014]/g, '-').replace(/[^\x20-\x7e\n]/g, '?')
  function newPage() {
    page = doc.addPage([595.28, 841.89])
    page.drawRectangle({ x: 0, y: 790, width: 595.28, height: 51.89, color: rgb(0.97, 0.96, 0.92) })
    page.drawText('TRACE-LI  /  SAVED TENDER RECORD', { x: 42, y: 809, font: bold, size: 10, color: navy })
    page.drawText(`${classification === 'synthetic' ? 'Synthetic fixture' : 'Customer record'} - page ${doc.getPageCount()}`, { x: 42, y: 24, font: regular, size: 8, color: gray })
    y = 765
  }
  function wrappedLines(value: unknown, size: number, font: PDFFont) {
    const lines: string[] = []
    for (const paragraph of clean(value).split('\n')) {
      let line = ''
      const words = paragraph.split(/\s+/).flatMap(word => {
        const chunks: string[] = []
        let chunk = ''
        for (const ch of word) {
          if (font.widthOfTextAtSize(chunk + ch, size) > 505) { chunks.push(chunk); chunk = '' }
          chunk += ch
        }
        chunks.push(chunk)
        return chunks
      })
      for (const word of words) {
        if (line && font.widthOfTextAtSize(`${line} ${word}`, size) > 510) {
          lines.push(line); line = word
        } else line += `${line ? ' ' : ''}${word}`
      }
      lines.push(line)
    }
    return lines
  }
  function text(value: unknown, size = 10, font: PDFFont = regular) {
    for (const line of wrappedLines(value, size, font)) {
      if (y < 55) newPage()
      page.drawText(line, { x: 42, y, font, size, color: navy }); y -= size + 5
    }
  }
  function evidenceBlock(lines: { value: string; bold?: boolean }[]) {
    const height = lines.reduce((total, line) => total + wrappedLines(line.value, 10, line.bold ? bold : regular).length * 15, 0) + 4
    // Keep an ordinary row together. A row longer than one page starts fresh
    // and continues through text's normal pagination without clipping content.
    if (y - height < 55 && (height <= 710 || y < 765)) newPage()
    for (const line of lines) text(line.value, 10, line.bold ? bold : regular)
    y -= 4
  }
  function section(title: string) {
    const headingAndBodyHeight = 10 + wrappedLines(title, 12, bold).length * 17 + 3 + 30
    if (y - headingAndBodyHeight < 55) newPage()
    y -= 10; text(title, 12, bold); y -= 3
  }
  newPage()
  text(detail.tender.title, 18, bold)
  text(detail.tender.reference, 10)
  text(`Issued ${record.issuedAt} | saved draft revision ${detail.draft.revision}`)
  text(`Record ${record.id}`)
  section('Outcome')
  if (proposal) {
    text('Exception proposed; approval not recorded.', 12, bold)
    text((record.payload as Record<string, unknown>).reason ?? (record.payload as Record<string, unknown>).rationale ?? '')
    text(`Assessment reference: ${record.parentRecordId}`)
  } else if (record.kind === 'assessment') {
    text('Assessment issued. Human decision not yet recorded.', 12, bold)
    text(`Readiness: ${frozen!.pipelineStatus.readiness}`)
  } else {
    text(frozen!.disposition.decision === 'request_evidence' ? 'Evidence requested.' : 'Escalated for review.', 12, bold)
    text(frozen!.disposition.rationale)
    text(`Recorded by ${frozen!.disposition.actorId} (${frozen!.disposition.actorRole})`)
  }
  text(`${classification === 'synthetic' ? 'Synthetic fixture. ' : ''}Trace-li does not authorize the award. Missing evidence is not a negative finding or proof of fraud.`)
  section('Reviewed evidence')
  const decisions = new Map(detail.draft.decisions.map(d => [d.key, d]))
  const fields = new Map(snapshot.fields.map(f => [f.fieldId, f]))
  for (const row of detail.draft.checklist.rows) {
    const field = fields.get(row.fieldId)
    const decision = decisions.get(row.key)
    const lines: { value: string; bold?: boolean }[] = [{ value: row.title, bold: true }]
    if (proposal) {
      const reviewLabels = { confirm: 'Confirm as extracted', present: 'Marked present', negative: 'Marked negative', stated_absent: 'Stated absent', missing: 'Left missing' }
      lines.push({ value: `Review: ${decision ? reviewLabels[decision.action] : row.state}` })
      lines.push({ value: `Value: ${decision?.value || row.valueText}` })
      lines.push({ value: `Page: ${decision?.page || row.page || 'Not recorded'}` })
      lines.push({ value: `Citation: ${decision?.quote || row.quote || 'Not recorded'}` })
      if (decision?.note) lines.push({ value: `Note: ${decision.note}` })
    } else {
      const value = field?.value
      const state = value?.state ?? row.state
      const statuses = { missing: 'Missing evidence', negative: 'Negative finding', present: 'Present' }
      lines.push({ value: `Status: ${statuses[state]}` })
      lines.push({ value: value?.state === 'missing' ? `Reason: ${value.reason}` : `Value: ${value ? String(value.value) : row.valueText}` })
      lines.push({ value: `Citation: ${decision?.quote || row.quote || 'Not recorded'} | page ${decision?.page || row.page || 'not recorded'}` })
    }
    evidenceBlock(lines)
  }
  section('Data policy')
  text(`Classification: ${classification === 'synthetic' ? 'Fictional test data' : 'Sanitized customer material'}`)
  text(detail.expiresAt ? `Traceli record expiry: ${detail.expiresAt}` : 'Earlier record preserved outside the new retention and deletion policy.')
  if (detail.policy) text(detail.policy.providerDisclosure)
  text('Downloaded copies remain under the recipient’s control.')
  section('References retained with this draft')
  text(`Packet: ${detail.draft.checklist.fileName}`)
  text(`Packet SHA-256: ${detail.draft.checklist.sourceFileHash}`)
  text(`Pack: ${detail.draft.checklist.packName} (${detail.draft.checklist.packVersion})`)
  const manualIds = new Set(detail.draft.manualVersionIds)
  const manuals = detail.manuals.filter(manual => manualIds.has(manual.id))
  if (!manuals.length) text('No manual versions attached.')
  for (const manual of manuals) {
    text(`${manual.label} - version ${manual.ordinal}; reference only, not evaluated as rules.`)
    text(`File: ${manual.fileName} | provenance: ${manual.hashKind}`)
    text(`SHA-256: ${manual.sha256}`)
  }
  section('Record verification')
  text(`Payload SHA-256: ${record.payloadHash}`)
  text(`Snapshot SHA-256: ${record.snapshotHash}`)
  text(`Packs SHA-256: ${record.packsHash}`)
  text('This PDF was rendered from an authorized, verified server record. Hashes establish record consistency, not the truth of the source evidence. Source file bytes are not retained by this workflow.')
  return { bytes: await doc.save(), fileName: `traceli-${record.id}.pdf` }
}
