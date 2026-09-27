/**
 * Everyday words for /cases and case card pages.
 * Stored card text, the JSON export, and the “Check this record yourself”
 * section keep pack, snapshot, and findings.
 */

const FIELD_KEY = /[a-z][a-z0-9_]*\.[a-z0-9_.]+/

export function readerFacingText(text: string): string {
  return text
    .replace(/\b(\d+)\s+findings\b/g, '$1 open items')
    .replace(/\bPacks\b/g, 'Checklists')
    .replace(/\bpacks\b/g, 'checklists')
    .replace(/\bPack\b/g, 'Checklist')
    .replace(/\bpack\b/g, 'checklist')
}

export function splitLeadSentence(text: string): { lead: string; rest: string } {
  const index = text.indexOf('. ')
  if (index === -1) return { lead: text, rest: '' }
  return { lead: text.slice(0, index), rest: text.slice(index + 2) }
}

/** First stored sentence, including its period. Splits on ". " so "US$0.5" stays intact. */
export function firstSentence(text: string): string {
  const trimmed = text.trim()
  const { lead } = splitLeadSentence(trimmed)
  if (lead === trimmed) return trimmed
  return lead.endsWith('.') ? lead : `${lead}.`
}

export function containsFieldKey(text: string): boolean {
  return FIELD_KEY.test(text)
}

const MISSING_EVIDENCE_SURFACE = 'This card is a pre-signature missing-evidence surface.'
const MISSING_EVIDENCE_READER = 'This card separates the official findings from the evidence recorded in its checklist.'

/** Presentation only. Stored claim boundaries and the JSON export keep the original sentence. */
export function readerBoundary(text: string): string {
  return text.replaceAll(MISSING_EVIDENCE_SURFACE, MISSING_EVIDENCE_READER)
}
