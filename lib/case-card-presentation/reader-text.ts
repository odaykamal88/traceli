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

export function containsFieldKey(text: string): boolean {
  return FIELD_KEY.test(text)
}
