/**
 * Printable pilot memo. Page size is the overlap of A4 and US Letter
 * (A4 width, Letter height) so the file prints at 100% on both.
 * Text is drawn, not painted as an image. Standard fonts cover Latin-1.
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'

import type { PilotReport } from '@/lib/pilot-report/build'

export const PILOT_PAGE_WIDTH = 595.28
export const PILOT_PAGE_HEIGHT = 792

const MARGIN_X = 48
const HEADER = 46
const FOOTER = 36
const CONTENT_TOP = PILOT_PAGE_HEIGHT - HEADER - 18
const CONTENT_BOTTOM = FOOTER + 16
const CONTENT_WIDTH = PILOT_PAGE_WIDTH - MARGIN_X * 2

const navy = rgb(7 / 255, 29 / 255, 57 / 255)
const ivory = rgb(251 / 255, 245 / 255, 234 / 255)
const mint = rgb(120 / 255, 216 / 255, 196 / 255)
const muted = rgb(82 / 255, 105 / 255, 106 / 255)
const rule = rgb(214 / 255, 208 / 255, 196 / 255)
const paper = rgb(1, 1, 1)

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
  page.drawRectangle({ x: 0, y: PILOT_PAGE_HEIGHT - HEADER, width: PILOT_PAGE_WIDTH, height: HEADER, color: navy })
  page.drawCircle({ x: MARGIN_X + 5, y: PILOT_PAGE_HEIGHT - 24, size: 4.5, color: mint })
  page.drawText('Trace-li', { x: MARGIN_X + 16, y: PILOT_PAGE_HEIGHT - 29, size: 16, font: draw.bold, color: ivory })
  const label = 'Pilot report'
  const labelWidth = draw.font.widthOfTextAtSize(label, 10)
  page.drawText(label, {
    x: PILOT_PAGE_WIDTH - MARGIN_X - labelWidth,
    y: PILOT_PAGE_HEIGHT - 26,
    size: 10,
    font: draw.font,
    color: ivory,
  })
  return { ...draw, page, y: CONTENT_TOP }
}

function ensure(draw: Draw, needed: number) {
  if (draw.y - needed >= CONTENT_BOTTOM) return draw
  return addPage(draw)
}

function drawLines(draw: Draw, lines: string[], font: PDFFont, size: number, color: ReturnType<typeof rgb>, gap = 4) {
  const lineHeight = size + gap
  let next = draw
  for (const line of lines) {
    next = ensure(next, lineHeight)
    next.page.drawText(line, { x: MARGIN_X, y: next.y - size, size, font, color })
    next = { ...next, y: next.y - lineHeight }
  }
  return next
}

function paragraph(draw: Draw, text: string, size = 11, color = navy, font?: PDFFont) {
  const face = font ?? draw.font
  const lines = wrap(text, face, size, CONTENT_WIDTH)
  return drawLines(draw, lines, face, size, color, 4)
}

function heading(draw: Draw, text: string) {
  let next = ensure(draw, 28)
  next = { ...next, y: next.y - 8 }
  next.page.drawRectangle({ x: MARGIN_X, y: next.y - 12, width: 18, height: 3, color: mint })
  next.page.drawText(pdfText(text), { x: MARGIN_X + 24, y: next.y - 14, size: 13, font: next.bold, color: navy })
  return { ...next, y: next.y - 24 }
}

function metaRow(draw: Draw, label: string, value: string) {
  const labelWidth = 132
  const valueWidth = CONTENT_WIDTH - labelWidth
  const lines = wrap(value, draw.font, 10, valueWidth)
  const height = Math.max(16, lines.length * 14 + 4)
  let next = ensure(draw, height)
  next.page.drawText(pdfText(label), { x: MARGIN_X, y: next.y - 11, size: 9, font: next.bold, color: muted })
  lines.forEach((line, index) => {
    next.page.drawText(line, { x: MARGIN_X + labelWidth, y: next.y - 11 - index * 14, size: 10, font: next.font, color: navy })
  })
  return { ...next, y: next.y - height }
}

function checklistRow(draw: Draw, title: string, detail: string, confirmed: boolean) {
  const titleWidth = CONTENT_WIDTH * 0.62
  const detailWidth = CONTENT_WIDTH - titleWidth - 12
  const titleLines = wrap(title, draw.bold, 10, titleWidth)
  const marker = confirmed ? ['Confirmed by reviewer'] : []
  const detailLines = wrap(detail, draw.font, 9, detailWidth)
  const leftCount = titleLines.length + marker.length
  const rows = Math.max(leftCount, detailLines.length, 1)
  const height = rows * 13 + 10
  let next = ensure(draw, height)
  titleLines.forEach((line, index) => {
    next.page.drawText(line, { x: MARGIN_X, y: next.y - 12 - index * 13, size: 10, font: next.bold, color: navy })
  })
  marker.forEach((line, index) => {
    next.page.drawText(line, {
      x: MARGIN_X,
      y: next.y - 12 - (titleLines.length + index) * 13,
      size: 8,
      font: next.font,
      color: navy,
    })
  })
  detailLines.forEach((line, index) => {
    next.page.drawText(line, {
      x: MARGIN_X + titleWidth + 12,
      y: next.y - 12 - index * 13,
      size: 9,
      font: next.font,
      color: muted,
    })
  })
  const bottom = next.y - height + 2
  next.page.drawLine({
    start: { x: MARGIN_X, y: bottom },
    end: { x: MARGIN_X + CONTENT_WIDTH, y: bottom },
    thickness: 0.4,
    color: rule,
  })
  return { ...next, y: bottom - 4 }
}

function stampFooters(doc: PDFDocument, font: PDFFont) {
  const pages = doc.getPages()
  pages.forEach((page, index) => {
    const label = `Trace-li  ·  Page ${index + 1} of ${pages.length}  ·  Prints on A4 and US Letter`
    page.drawText(label, { x: MARGIN_X, y: 18, size: 8, font, color: muted })
  })
}

export async function renderPilotReportPdf(report: PilotReport): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(`Trace-li pilot report - ${pdfText(report.procurementReference)}`)
  doc.setAuthor('Trace-li')
  doc.setCreator('Trace-li')
  doc.setProducer('Trace-li')
  doc.setLanguage('en-GB')
  doc.setSubject('Pilot report for one frozen award checklist')
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const mono = await doc.embedFont(StandardFonts.Courier)
  let draw = addPage({ doc, page: undefined as unknown as PDFPage, y: 0, font, bold, mono })

  draw = heading(draw, 'Pilot report')
  const reviewer = report.reviewerRole ? `${report.reviewerName} · ${report.reviewerRole}` : report.reviewerName
  const meta: [string, string][] = [
    ['File', report.fileName],
    ['Procurement reference', report.procurementReference],
    ['Donor', report.donorName],
    ['Checklist', report.packName],
    ['Checklist version', report.packVersion],
    ['Frozen', report.frozenAtLabel],
    ['Reviewer', reviewer],
  ]
  for (const [label, value] of meta) draw = metaRow(draw, label, value)

  draw = heading(draw, 'Summary')
  draw = paragraph(draw, report.summary, 11, navy)
  draw = { ...draw, y: draw.y - 6 }

  draw = heading(draw, 'Checklist')
  draw = paragraph(draw, 'Grouped from the frozen file. Titles are the checklist\'s own words.', 10, muted)
  for (const group of report.groups) {
    draw = { ...draw, y: draw.y - 8 }
    draw = ensure(draw, 22)
    draw.page.drawText(pdfText(group.heading), { x: MARGIN_X, y: draw.y - 12, size: 11, font: draw.bold, color: navy })
    draw = { ...draw, y: draw.y - 18 }
    if (group.rows.length === 0) {
      draw = paragraph(draw, 'None.', 10, muted)
      continue
    }
    for (const row of group.rows) {
      draw = checklistRow(draw, row.title, row.detail, row.confirmedByReviewer)
    }
  }

  draw = heading(draw, 'What an auditor would ask for next')
  if (report.auditorAsks.length === 0) {
    draw = paragraph(draw, 'No blocker is open on this checklist, so this report does not ask for further evidence.', 11, navy)
  } else {
    draw = paragraph(draw, 'Each blocker below uses the checklist rule\'s own wording. Nothing here is a new policy.', 10, muted)
    report.auditorAsks.forEach((ask, index) => {
      draw = { ...draw, y: draw.y - 6 }
      const onlyTitle = ask.request === `Ask for this evidence: ${ask.title.replace(/\.+$/, '')}.`
      if (onlyTitle) {
        draw = paragraph(draw, `${index + 1}. ${ask.request}`, 11, navy)
      } else {
        draw = paragraph(draw, `${index + 1}. ${ask.title}`, 11, navy, draw.bold)
        draw = paragraph(draw, ask.request, 10, navy)
      }
    })
  }

  draw = heading(draw, 'How to check this freeze')
  const checks: [string, string][] = [
    ['Record id', report.verification.recordId],
    ['Snapshot hash', report.verification.snapshotHash],
    ['Packs hash', report.verification.packsHash],
    ['Hash method', report.verification.hashMethod],
  ]
  for (const [label, value] of checks) {
    const lines = wrap(value, draw.mono, 8, CONTENT_WIDTH - 132)
    const height = Math.max(16, lines.length * 11 + 4)
    draw = ensure(draw, height)
    draw.page.drawText(label, { x: MARGIN_X, y: draw.y - 10, size: 9, font: draw.bold, color: muted })
    lines.forEach((line, index) => {
      draw.page.drawText(line, { x: MARGIN_X + 132, y: draw.y - 10 - index * 11, size: 8, font: draw.mono, color: navy })
    })
    draw = { ...draw, y: draw.y - height }
  }
  draw = { ...draw, y: draw.y - 6 }
  draw = paragraph(draw, report.verification.recompute, 10, navy)

  draw = { ...draw, y: draw.y - 10 }
  const boundaryLines = wrap(report.boundary, draw.font, 9, CONTENT_WIDTH - 16)
  const boxHeight = boundaryLines.length * 12 + 16
  draw = ensure(draw, boxHeight + 8)
  draw.page.drawRectangle({
    x: MARGIN_X,
    y: draw.y - boxHeight,
    width: CONTENT_WIDTH,
    height: boxHeight,
    color: paper,
    borderColor: navy,
    borderWidth: 0.8,
  })
  boundaryLines.forEach((line, index) => {
    draw.page.drawText(line, { x: MARGIN_X + 8, y: draw.y - 14 - index * 12, size: 9, font: draw.font, color: navy })
  })

  stampFooters(doc, font)
  return doc.save()
}
