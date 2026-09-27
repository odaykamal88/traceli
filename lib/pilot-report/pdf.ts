/**
 * Printable pilot memo. Page size is the overlap of A4 and US Letter
 * (A4 width, Letter height) so the file prints at 100% on both.
 *
 * Page 1 stands alone: the decision, readiness, open items, and at most
 * five things to ask for. The checklist follows. Check codes sit in a
 * small footer on the last page. One accent colour marks readiness.
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'

import type { PilotReport } from '@/lib/pilot-report/build'

export const PILOT_PAGE_WIDTH = 595.28
export const PILOT_PAGE_HEIGHT = 792

const MARGIN_X = 56
const CONTENT_TOP = PILOT_PAGE_HEIGHT - 78
const CONTENT_BOTTOM = 48
const CONTENT_WIDTH = PILOT_PAGE_WIDTH - MARGIN_X * 2

const navy = rgb(7 / 255, 29 / 255, 57 / 255)
const muted = rgb(90 / 255, 104 / 255, 112 / 255)
const rule = rgb(214 / 255, 208 / 255, 196 / 255)
const readinessAccent = {
  red: rgb(176 / 255, 52 / 255, 42 / 255),
  amber: rgb(176 / 255, 112 / 255, 24 / 255),
  green: rgb(28 / 255, 112 / 255, 78 / 255),
  unknown: muted,
} as const

function pdfText(value: string) {
  return value
    .replace(/\u2018|\u2019|\u2032/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/[^\u0009\u000A\u000D\u0020-\u00FF]/g, '')
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const clean = pdfText(text).replace(/\s+/g, ' ').trim()
  if (!clean) return ['']
  const words = clean.split(' ')
  const lines: string[] = []
  let current = ''
  const pushLong = (word: string) => {
    let chunk = ''
    for (const char of word) {
      const trial = chunk + char
      if (font.widthOfTextAtSize(trial, size) > maxWidth && chunk) {
        lines.push(chunk)
        chunk = char
      } else {
        chunk = trial
      }
    }
    return chunk
  }
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next
      continue
    }
    if (current) lines.push(current)
    if (font.widthOfTextAtSize(word, size) <= maxWidth) current = word
    else current = pushLong(word)
  }
  if (current) lines.push(current)
  return lines.length > 0 ? lines : ['']
}

function clipLines(lines: string[], max: number) {
  if (lines.length <= max) return lines
  const kept = lines.slice(0, max)
  const last = kept[max - 1] ?? ''
  kept[max - 1] = last.length > 3 ? `${last.slice(0, -1).trimEnd()}...` : last
  return kept
}

type Draw = {
  doc: PDFDocument
  page: PDFPage
  y: number
  font: PDFFont
  bold: PDFFont
  mono: PDFFont
}

function addPage(draw: Draw): Draw {
  const page = draw.doc.addPage([PILOT_PAGE_WIDTH, PILOT_PAGE_HEIGHT])
  page.drawText('Trace-li', {
    x: MARGIN_X,
    y: PILOT_PAGE_HEIGHT - 40,
    size: 12,
    font: draw.bold,
    color: navy,
  })
  const label = 'Pilot report'
  const labelWidth = draw.font.widthOfTextAtSize(label, 9)
  page.drawText(label, {
    x: PILOT_PAGE_WIDTH - MARGIN_X - labelWidth,
    y: PILOT_PAGE_HEIGHT - 38,
    size: 9,
    font: draw.font,
    color: muted,
  })
  page.drawLine({
    start: { x: MARGIN_X, y: PILOT_PAGE_HEIGHT - 52 },
    end: { x: PILOT_PAGE_WIDTH - MARGIN_X, y: PILOT_PAGE_HEIGHT - 52 },
    thickness: 0.6,
    color: rule,
  })
  return { ...draw, page, y: CONTENT_TOP }
}

function ensure(draw: Draw, needed: number) {
  if (draw.y - needed >= CONTENT_BOTTOM) return draw
  return addPage(draw)
}

function drawWrapped(draw: Draw, text: string, font: PDFFont, size: number, color: ReturnType<typeof rgb>, maxLines?: number, gap = 5) {
  const lines = maxLines ? clipLines(wrap(text, font, size, CONTENT_WIDTH), maxLines) : wrap(text, font, size, CONTENT_WIDTH)
  const lineHeight = size + gap
  let next = draw
  for (const line of lines) {
    next = ensure(next, lineHeight)
    next.page.drawText(line, { x: MARGIN_X, y: next.y - size, size, font, color })
    next = { ...next, y: next.y - lineHeight }
  }
  return next
}

function heading(draw: Draw, text: string) {
  let next = ensure(draw, 40)
  next = { ...next, y: next.y - 18 }
  next.page.drawText(pdfText(text), { x: MARGIN_X, y: next.y - 14, size: 13, font: next.bold, color: navy })
  return { ...next, y: next.y - 24 }
}

function checklistRow(draw: Draw, title: string, detail: string, confirmation: string | null, showDetail: boolean) {
  const detailWidth = showDetail ? 168 : 0
  const titleWidth = CONTENT_WIDTH - detailWidth - (showDetail ? 18 : 0)
  const titleLines = wrap(title, draw.bold, 10, titleWidth)
  const detailLines = showDetail ? wrap(detail, draw.font, 9, detailWidth) : []
  const marker = confirmation ? clipLines(wrap(confirmation, draw.font, 8, titleWidth), 2) : []
  const bodyRows = Math.max(titleLines.length, detailLines.length, 1)
  const height = bodyRows * 13 + marker.length * 11 + 8
  let next = ensure(draw, height)
  titleLines.forEach((line, index) => {
    next.page.drawText(line, { x: MARGIN_X, y: next.y - 11 - index * 13, size: 10, font: next.bold, color: navy })
  })
  if (showDetail) {
    detailLines.forEach((line, index) => {
      next.page.drawText(line, {
        x: MARGIN_X + titleWidth + 18,
        y: next.y - 11 - index * 13,
        size: 9,
        font: next.font,
        color: muted,
      })
    })
  }
  marker.forEach((line, index) => {
    next.page.drawText(line, {
      x: MARGIN_X,
      y: next.y - 11 - bodyRows * 13 - index * 11,
      size: 8,
      font: next.font,
      color: muted,
    })
  })
  const bottom = next.y - height + 2
  next.page.drawLine({
    start: { x: MARGIN_X, y: bottom },
    end: { x: MARGIN_X + CONTENT_WIDTH, y: bottom },
    thickness: 0.3,
    color: rule,
  })
  return { ...next, y: bottom - 2 }
}

function stampFooters(doc: PDFDocument, font: PDFFont) {
  const pages = doc.getPages()
  pages.forEach((page, index) => {
    const label = `Page ${index + 1} of ${pages.length}`
    const width = font.widthOfTextAtSize(label, 8)
    page.drawText(label, {
      x: PILOT_PAGE_WIDTH - MARGIN_X - width,
      y: 22,
      size: 8,
      font,
      color: muted,
    })
  })
}

function drawFirstPage(draw: Draw, report: PilotReport) {
  const reviewer = report.reviewerRole ? `${report.reviewerName}, ${report.reviewerRole}` : report.reviewerName
  const identity = [
    report.fileName,
    report.procurementReference,
    `${report.donorName}  ·  ${report.packName}  ·  version ${report.packVersion}`,
    `Frozen ${report.frozenAtLabel}  ·  ${reviewer}`,
  ]
  let next = draw
  for (const line of identity) {
    const lines = clipLines(wrap(line, next.font, 10, CONTENT_WIDTH), 2)
    for (const part of lines) {
      next.page.drawText(part, { x: MARGIN_X, y: next.y - 11, size: 10, font: next.font, color: muted })
      next = { ...next, y: next.y - 16 }
    }
  }
  next = { ...next, y: next.y - 28 }

  const decisionLines = wrap(report.decisionSentence, next.bold, 16, CONTENT_WIDTH)
  for (const line of decisionLines) {
    next.page.drawText(line, { x: MARGIN_X, y: next.y - 16, size: 16, font: next.bold, color: navy })
    next = { ...next, y: next.y - 22 }
  }
  next = { ...next, y: next.y - 18 }

  const accent = readinessAccent[report.readiness]
  next.page.drawRectangle({
    x: MARGIN_X,
    y: next.y - 18,
    width: 4,
    height: 18,
    color: accent,
  })
  next.page.drawText(pdfText(report.readinessLabel), {
    x: MARGIN_X + 14,
    y: next.y - 16,
    size: 20,
    font: next.bold,
    color: accent,
  })
  next = { ...next, y: next.y - 36 }
  next.page.drawText(pdfText(report.openItemLine), {
    x: MARGIN_X,
    y: next.y - 14,
    size: 13,
    font: next.font,
    color: navy,
  })
  next = { ...next, y: next.y - 40 }

  next.page.drawText('What to ask for', {
    x: MARGIN_X,
    y: next.y - 13,
    size: 13,
    font: next.bold,
    color: navy,
  })
  next = { ...next, y: next.y - 26 }

  if (report.frontAskLines.length === 0) {
    const empty = report.openItemCount === 0
      ? 'Nothing to ask for before you sign.'
      : 'The open items are listed in the checklist.'
    return drawWrapped(next, empty, next.font, 12, navy, 2, 4)
  }

  report.frontAskLines.forEach((line, index) => {
    const number = `${index + 1}.`
    const numberWidth = next.bold.widthOfTextAtSize(number, 12)
    const textWidth = CONTENT_WIDTH - numberWidth - 10
    const parts = clipLines(wrap(line, next.font, 12, textWidth), 2)
    parts.forEach((part, partIndex) => {
      if (partIndex === 0) {
        next.page.drawText(number, { x: MARGIN_X, y: next.y - 12, size: 12, font: next.bold, color: navy })
      }
      next.page.drawText(part, {
        x: MARGIN_X + numberWidth + 10,
        y: next.y - 12,
        size: 12,
        font: next.font,
        color: navy,
      })
      next = { ...next, y: next.y - 17 }
    })
    next = { ...next, y: next.y - 6 }
  })

  if (report.furtherOpenItemCount > 0) {
    const more = report.furtherOpenItemCount === 1
      ? 'And 1 more open item is in the checklist.'
      : `And ${report.furtherOpenItemCount} more open items are in the checklist.`
    next = { ...next, y: next.y - 6 }
    next = drawWrapped(next, more, next.font, 11, muted, 2, 3)
  }
  return next
}

function drawChecklist(draw: Draw, report: PilotReport) {
  let next = heading(draw, 'The reviewer\'s reason')
  next = drawWrapped(next, report.printedReason, next.font, 11, navy, undefined, 4)
  next = { ...next, y: next.y - 8 }
  next = heading(next, 'Checklist')
  next = drawWrapped(next, 'The full list from this file. Each line uses the checklist\'s own words.', next.font, 10, muted, 3, 3)
  for (const group of report.groups) {
    next = { ...next, y: next.y - 16 }
    next = ensure(next, 22)
    next.page.drawText(pdfText(group.heading), { x: MARGIN_X, y: next.y - 12, size: 12, font: next.bold, color: navy })
    next = { ...next, y: next.y - 20 }
    if (group.rows.length === 0) {
      next = drawWrapped(next, 'None.', next.font, 10, muted, 1, 2)
      continue
    }
    for (const row of group.rows) {
      next = checklistRow(next, row.title, row.detail, row.confirmationNote, group.id !== 'missing')
    }
  }
  return next
}

function drawVerification(draw: Draw, report: PilotReport) {
  const checks: [string, string][] = [
    ['Record id', report.verification.recordId],
    ['Snapshot hash', report.verification.snapshotHash],
    ['Packs hash', report.verification.packsHash],
    ['Hash method', report.verification.hashMethod],
  ]
  const sentence = wrap(report.verification.recompute, draw.font, 9, CONTENT_WIDTH)
  const boundary = wrap(report.boundary, draw.font, 9, CONTENT_WIDTH)
  const needed = 28 + checks.length * 12 + sentence.length * 12 + 10 + boundary.length * 12 + 8
  let next = draw.y - 24 < CONTENT_BOTTOM + needed ? addPage(draw) : { ...draw, y: draw.y - 28 }
  next.page.drawText('To check this note', { x: MARGIN_X, y: next.y - 10, size: 9, font: next.bold, color: muted })
  next = { ...next, y: next.y - 16 }
  for (const [label, value] of checks) {
    const lines = wrap(value, next.mono, 7.5, CONTENT_WIDTH - 118)
    const height = Math.max(12, lines.length * 10)
    next = ensure(next, height)
    next.page.drawText(label, { x: MARGIN_X, y: next.y - 8, size: 8, font: next.font, color: muted })
    lines.forEach((line, index) => {
      next.page.drawText(line, { x: MARGIN_X + 118, y: next.y - 8 - index * 10, size: 7.5, font: next.mono, color: navy })
    })
    next = { ...next, y: next.y - height }
  }
  next = { ...next, y: next.y - 8 }
  next = drawWrapped(next, report.verification.recompute, next.font, 9, navy, undefined, 3)
  next = { ...next, y: next.y - 8 }
  next.page.drawLine({
    start: { x: MARGIN_X, y: next.y },
    end: { x: MARGIN_X + CONTENT_WIDTH, y: next.y },
    thickness: 0.4,
    color: rule,
  })
  next = { ...next, y: next.y - 8 }
  return drawWrapped(next, report.boundary, next.font, 9, navy, undefined, 3)
}

export async function renderPilotReportPdf(report: PilotReport): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(`Trace-li pilot report - ${pdfText(report.procurementReference)}`)
  doc.setAuthor('Trace-li')
  doc.setCreator('Trace-li')
  doc.setProducer('Trace-li')
  doc.setLanguage('en-GB')
  doc.setSubject('Pilot report for one frozen checklist')
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const mono = await doc.embedFont(StandardFonts.Courier)
  let draw = addPage({ doc, page: undefined as unknown as PDFPage, y: 0, font, bold, mono })
  drawFirstPage(draw, report)
  draw = addPage(draw)
  draw = drawChecklist(draw, report)
  drawVerification(draw, report)
  stampFooters(doc, font)
  return doc.save()
}
