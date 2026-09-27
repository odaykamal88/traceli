/**
 * Replay a PDF as desk markdown without calling Talonic.
 * Text is poppler `pdftotext` in default mode, one page at a time,
 * with a `Page N` marker so pack alignment can read the page.
 */

import { execFile } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export async function localTextMarkdown(bytes, pages) {
  if (!Number.isInteger(pages) || pages < 1) {
    throw new Error('local-text replay needs the answer-sheet page count.')
  }
  const dir = await mkdtemp(join(tmpdir(), 'traceli-local-text-'))
  const pdfPath = join(dir, 'packet.pdf')
  try {
    await writeFile(pdfPath, bytes)
    const parts = []
    for (let page = 1; page <= pages; page += 1) {
      const { stdout } = await execFileAsync('pdftotext', [
        '-f', String(page),
        '-l', String(page),
        '-enc', 'UTF-8',
        pdfPath,
        '-',
      ], { maxBuffer: 8 * 1024 * 1024 })
      parts.push(`Page ${page}\n${stdout.replace(/\s+$/u, '')}`)
    }
    return parts.join('\n\n')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

export function localTextEnvelope(markdown) {
  return {
    status: 'complete',
    created_at: '2026-09-25T00:00:00.000Z',
    markdown,
    data: {},
    confidence: { overall: 0.5 },
  }
}
