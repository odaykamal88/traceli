import type { JudgmentRule } from '@/lib/field-registry/judgment'
import { getDonorPack } from '@/lib/field-registry/packs'
import { fieldKeysForDonorPack } from '@/lib/field-registry/pack-schema'
import { PACK_STATEMENTS, type PackStatement } from '@/lib/field-registry/pack-statements'
import type { DonorPackId } from '@/lib/field-registry/packs/types'
import { statedAbsentReasonPrefix, type Fragment, type RegistryField } from '@/lib/field-registry/schema'

/**
 * Read pack keys only from fragments tagged `document_text`.
 * A field is filled when the text names that key's state, or when a
 * full-phrase statement for that key matches. Keyword overlap is not a match.
 * An explicit absence never becomes a present or true value.
 * The stored quote is the sentence that contains the match, without a
 * running header, a `Page N` marker, or markdown emphasis.
 * `required_present` absences stay missing, with a reason, because a
 * negative value would not raise that rule. Boolean controls expected to be
 * true are recorded negative false, which still raises the finding.
 */

export const DOCUMENT_TEXT_TAG = 'document_text'
export const STATED_ABSENT_PREFIX = statedAbsentReasonPrefix

const ABSENCE_LANGUAGE = /\b(not on file|not met|none listed|no approved|no policy-compliant|not certified|are blank|is blank|scores blank|no criteria|no evaluation criteria|no individual scores|not approved|no regional director|does not certify|does not state|do not state)\b/i
const BARE_AFFIRMATION = /^(true|yes|y|present|met|satisfied|ok)\.?$/i

type Reading = {
  key: string
  polarity: 'absent' | 'present'
  quote: string
  at: number
  fragment: Fragment
  page: number
}

function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1)}…`
}

function normalize(text: string) {
  return text
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]+/g, ' ')
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .trim()
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function fallbackPage(fragment: Fragment) {
  const match = /^page-(\d+)$/.exec(fragment.sourceRef.id)
  if (!match) return 1
  const page = Number(match[1])
  return page >= 1 && page <= 10000 ? page : 1
}

function pageAt(text: string, index: number, fallback: number) {
  const re = /\bpage\s+(\d{1,4})\b/gi
  let page = fallback
  for (let match = re.exec(text); match; match = re.exec(text)) {
    if (match.index > index) break
    const next = Number(match[1])
    if (next >= 1 && next <= 10000) page = next
  }
  return page
}

function sentenceBounds(text: string, index: number, length: number) {
  const windowStart = Math.max(0, index - 180)
  let start = windowStart
  for (let cursor = index - 1; cursor >= windowStart; cursor -= 1) {
    const next = text[cursor + 1]
    if (text[cursor] === '.' && (next === undefined || /\s/.test(next))) {
      start = cursor + 1
      break
    }
  }
  const windowEnd = Math.min(text.length, index + length + 180)
  let end = windowEnd
  for (let cursor = index + length; cursor < windowEnd; cursor += 1) {
    const next = text[cursor + 1]
    if (text[cursor] === '.' && (next === undefined || /\s/.test(next))) {
      end = cursor + 1
      break
    }
  }
  return { start, end }
}

/**
 * A stored quote is the sentence that contains the match.
 * Running headers often glue on at a file extension (".md") or a page
 * marker. Those are not part of the sentence. Markdown emphasis is not either.
 */
function cleanQuote(sentence: string, matchAt: number) {
  const at = Math.max(0, Math.min(matchAt, sentence.length))
  const before = sentence.slice(0, at)
  const pageRe = /\bpage\s+\d{1,4}\b/gi
  let cut = 0
  for (const match of before.matchAll(pageRe)) {
    cut = (match.index ?? 0) + match[0].length
  }
  let quote = cut > 0 ? sentence.slice(cut) : sentence
  const banner = /^(?:[^·•\n]{0,120}[·•]\s*)+/.exec(quote)
  if (banner && banner[0].length <= 240 && /\b(file|packet|rehearsal|page|md)\b/i.test(banner[0])) {
    quote = quote.slice(banner[0].length).replace(/^(?:not a [A-Za-z]+ file\s*)+/i, '')
  } else {
    quote = quote.replace(/^(?:not a [A-Za-z]+ file\s*)+/i, '')
  }
  const phraseAt = sentence.slice(at).replace(/\*\*|__/g, '').slice(0, 24).trim().toLowerCase()
  quote = quote
    .replace(/\*\*|__/g, '')
    .replace(/\bpage\s+\d{1,4}\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (phraseAt && !quote.toLowerCase().includes(phraseAt.slice(0, Math.min(12, phraseAt.length)))) {
    return sentence.replace(/\*\*|__/g, '').replace(/\bpage\s+\d{1,4}\b/gi, ' ').replace(/\s+/g, ' ').trim()
  }
  return quote
}

function quoteAt(text: string, index: number, length: number) {
  const bounds = sentenceBounds(text, index, length)
  return cleanQuote(text.slice(bounds.start, bounds.end), index - bounds.start)
}

function containsOtherKey(text: string, key: string, keys: readonly string[]) {
  const lower = text.toLowerCase()
  return keys.some(other => other !== key && lower.includes(other))
}

function ruleFor(rules: readonly JudgmentRule[], key: string) {
  for (const rule of rules) {
    if ('fieldKey' in rule && rule.fieldKey === key) return rule
  }
  return undefined
}

function statementsFor(keys: ReadonlySet<string>) {
  return PACK_STATEMENTS.filter(statement => keys.has(statement.key))
}

function pushClause(
  readings: Reading[],
  statement: PackStatement,
  text: string,
  fragment: Fragment,
  keys: readonly string[],
) {
  const patterns = [
    ...(statement.absent ?? []).map(pattern => ({ pattern, polarity: 'absent' as const })),
    ...(statement.present ?? []).map(pattern => ({ pattern, polarity: 'present' as const })),
  ]
  for (const entry of patterns) {
    const match = entry.pattern.exec(text)
    if (!match || match.index < 0) continue
    const sentence = quoteAt(text, match.index, match[0].length)
    const absentSentence = ABSENCE_LANGUAGE.test(sentence) || ABSENCE_LANGUAGE.test(match[0])
    const polarity = entry.polarity === 'present' && absentSentence ? 'absent' : entry.polarity
    const quote = sentence || match[0].replace(/\*\*|__/g, '').replace(/\s+/g, ' ').trim()
    if (!quote) continue
    if (containsOtherKey(quote, statement.key, keys) && polarity === 'present') continue
    readings.push({
      key: statement.key,
      polarity,
      quote: clip(quote, 400),
      at: match.index,
      fragment,
      page: pageAt(text, match.index, fallbackPage(fragment)),
    })
  }
}

function explicitCues(text: string, keys: readonly string[], fragment: Fragment, readings: Reading[]) {
  if (keys.length === 0) return
  const ordered = [...keys].sort((left, right) => right.length - left.length)
  const re = new RegExp(
    `(?:^|[^a-z0-9_])(${ordered.map(escapeRegExp).join('|')})(?![a-z0-9_])([\\s\\S]{0,420}?)\\b(missing|present)\\s*:\\s*([^\\n]{3,280})`,
    'gi',
  )
  for (let match = re.exec(text); match; match = re.exec(text)) {
    const key = match[1]?.toLowerCase() ?? ''
    if (!keys.includes(key)) continue
    const gap = match[2] ?? ''
    const state = (match[3] ?? '').toLowerCase()
    const rawDetail = match[4] ?? ''
    const detail = clip(cleanQuote(rawDetail, rawDetail.length), 400)
    if (!detail || containsOtherKey(gap, key, keys) || containsOtherKey(detail, key, keys)) continue
    if (/^[a-z][a-z0-9_.]+$/.test(detail.split(/\s/)[0] ?? '') && keys.includes((detail.split(/\s/)[0] ?? '').replace(/[:.]$/, ''))) {
      continue
    }
    const at = match.index + (match[0].length - (match[3]?.length ?? 0) - detail.length)
    if (state === 'missing' || ABSENCE_LANGUAGE.test(detail)) {
      readings.push({
        key,
        polarity: 'absent',
        quote: detail,
        at: match.index,
        fragment,
        page: pageAt(text, at, fallbackPage(fragment)),
      })
      continue
    }
    if (BARE_AFFIRMATION.test(detail)) continue
    readings.push({
      key,
      polarity: 'present',
      quote: detail,
      at: match.index,
      fragment,
      page: pageAt(text, match.index, fallbackPage(fragment)),
    })
  }
}

function wholeToken(quote: string, expected: string | number | boolean) {
  if (typeof expected !== 'string' && typeof expected !== 'number') return false
  const token = String(expected).toLowerCase()
  return quote.toLowerCase().split(/[^a-z0-9_]+/).filter(Boolean).includes(token)
}

function singleAllowed(quote: string, allowed: readonly (string | number | boolean)[]) {
  const tokens = new Set(quote.toLowerCase().split(/[^a-z0-9_]+/).filter(Boolean))
  const hits = allowed.filter(value => typeof value === 'string' && tokens.has(value.toLowerCase()))
  return hits.length === 1 ? hits[0] : null
}

function attested(quote: string) {
  return new Set(quote.toLowerCase().split(/[^a-z0-9-]+/).filter(token => token.length > 0))
}

function valueFor(reading: Reading, rule: JudgmentRule): RegistryField['value'] | null {
  const quote = clip(reading.quote, 400)
  if (!quote) return null
  if (reading.polarity === 'absent') {
    if (rule.kind === 'value_must_equal' && rule.expected === true) {
      return { state: 'negative', value: false }
    }
    return { state: 'missing', reason: clip(`${STATED_ABSENT_PREFIX}${quote}`, 500) }
  }
  if (ABSENCE_LANGUAGE.test(quote) || BARE_AFFIRMATION.test(quote)) return null
  if (rule.kind === 'value_must_equal' && rule.expected === true) {
    return quote.length >= 8 ? { state: 'present', value: true } : null
  }
  if (rule.kind === 'value_must_equal') {
    return wholeToken(quote, rule.expected) ? { state: 'present', value: rule.expected } : null
  }
  if (rule.kind === 'required_present') {
    return { state: 'present', value: clip(quote, 4000) }
  }
  if (rule.kind === 'value_must_be_one_of') {
    const token = singleAllowed(quote, rule.allowed)
    return token === null ? null : { state: 'present', value: token }
  }
  if (rule.kind === 'text_must_include') {
    const have = attested(quote)
    if (!rule.tokens.every(token => have.has(token))) return null
    return { state: 'present', value: clip(quote, 4000) }
  }
  if (rule.kind === 'required_when_value_in') {
    if (rule.allowedValues) {
      const token = singleAllowed(quote, rule.allowedValues)
      return token === null ? null : { state: 'present', value: token }
    }
    return { state: 'present', value: clip(quote, 4000) }
  }
  return null
}

function choose(readings: readonly Reading[]) {
  const absent = readings.filter(reading => reading.polarity === 'absent').sort((left, right) => left.at - right.at)
  if (absent.length > 0) return absent[0]
  return [...readings].sort((left, right) => left.at - right.at)[0]
}

export function alignPackFields(
  fragments: readonly Fragment[],
  packId: DonorPackId,
): { fields: RegistryField[] } {
  const keys = fieldKeysForDonorPack(packId)
  const keySet = new Set<string>(keys)
  const rules = getDonorPack(packId).rules
  const corpus = fragments.filter(fragment => fragment.tags?.includes(DOCUMENT_TEXT_TAG))
  const readings: Reading[] = []
  const statements = statementsFor(keySet)
  for (const fragment of corpus) {
    const text = normalize(fragment.text)
    if (!text) continue
    explicitCues(text, keys, fragment, readings)
    for (const statement of statements) pushClause(readings, statement, text, fragment, keys)
  }
  const fields: RegistryField[] = []
  for (const key of keys) {
    const group = readings.filter(reading => reading.key === key)
    if (group.length === 0) continue
    const reading = choose(group)
    if (!reading) continue
    const rule = ruleFor(rules, key)
    if (!rule) continue
    const value = valueFor(reading, rule)
    if (!value) continue
    const quote = clip(reading.quote, 220)
    fields.push({
      fieldId: `field.packet.${key}`,
      entityKind: 'evidence',
      entityId: `evidence.packet.${key}`,
      key,
      value,
      provenance: {
        sourceFileHash: reading.fragment.sourceFileHash,
        sourceRef: {
          kind: 'page',
          id: `page-${reading.page}`,
          label: clip(`Quote: ${quote}`, 240),
        },
        extractedAt: reading.fragment.extractedAt,
        confidence: reading.fragment.confidence,
        verificationMethod: 'adapter_extract',
      },
    })
  }
  return { fields }
}
