import 'server-only'

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { FrozenDecisionRecord } from '@/lib/field-registry/freeze'
import type { TenderDetail, TenderIssuedRecord } from '@/lib/tenders/contract'
import { TenderError } from '@/lib/tenders/contract'

/** Render only the retained record and its pinned draft. No catalog lookup or browser payload. */
export async function renderTenderReport(detail: TenderDetail, record: TenderIssuedRecord): Promise<{ bytes: Uint8Array; fileName: string }> {
  if (!detail.draft || detail.draft.id !== record.draftId) throw new TenderError(409, 'integrity', 'The retained record is unavailable.')
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
    page.drawText(`Synthetic fixture - page ${doc.getPageCount()}`, { x: 42, y: 24, font: regular, size: 8, color: gray })
    y = 765
  }
  function text(value: unknown, size = 10, font: PDFFont = regular) {
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
          if (y < 55) newPage()
          page.drawText(line, { x: 42, y, font, size, color: navy }); y -= size + 5; line = word
        } else line += `${line ? ' ' : ''}${word}`
      }
      if (y < 55) newPage()
      page.drawText(line, { x: 42, y, font, size, color: navy }); y -= size + 5
    }
  }
  function section(title: string) { y -= 10; text(title, 12, bold); y -= 3 }
  newPage()
  text(detail.tender.title, 18, bold)
  text(detail.tender.reference, 10)
  text(`Issued ${record.issuedAt} | saved draft revision ${detail.draft.revision}`)
  text(`Record ${record.id}`)
  section('Outcome')
  const proposal = record.kind === 'exception_proposal'
  const frozen = proposal ? null : record.payload as FrozenDecisionRecord
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
  text('Synthetic fixture. Trace-li does not authorize the award. Missing evidence is not a negative finding or proof of fraud.')
  section('Reviewed evidence')
  const snapshot = frozen?.snapshot ?? detail.draft.checklist.snapshot
  const decisions = new Map(detail.draft.decisions.map(d => [d.key, d]))
  const fields = new Map(snapshot.fields.map(f => [f.fieldId, f]))
  for (const row of detail.draft.checklist.rows) {
    const field = fields.get(row.fieldId)
    const decision = decisions.get(row.key)
    text(row.title, 10, bold)
    if (proposal) {
      text(`Review: ${decision?.action ?? row.state}`)
      text(`Value: ${decision?.value || row.valueText}`)
      text(`Page: ${decision?.page || row.page || 'Not recorded'}`)
      text(`Citation: ${decision?.quote || row.quote || 'Not recorded'}`)
      if (decision?.note) text(`Note: ${decision.note}`)
    } else {
      text(`Status: ${field?.value.state ?? row.state}`)
      text(`Value: ${field ? JSON.stringify(field.value) : row.valueText}`)
      text(`Citation: ${decision?.quote || row.quote || 'Not recorded'} | page ${decision?.page || row.page || 'not recorded'}`)
    }
    y -= 4
  }
  section('Data policy')
  text(`Classification: ${detail.tender.classification === 'synthetic' ? 'Fictional test data' : 'Sanitized customer material'}`)
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
