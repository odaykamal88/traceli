/**
 * Per-key comparison of a desk pack reading against an answer sheet.
 * Rates are micro-averages: every key on every file counts once.
 */

export const FIELD_STATES = ['present', 'missing', 'negative']

export function normalizeComparable(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const text = value
    .normalize('NFKC')
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
  if (text === 'true') return true
  if (text === 'false') return false
  if (/^-?\d+(?:\.\d+)?$/.test(text)) return Number(text)
  return text
}

export function valuesMatch(gold, predicted) {
  return Object.is(normalizeComparable(gold), normalizeComparable(predicted))
}

export function emptyMetrics() {
  return {
    keys: 0,
    stateCorrect: 0,
    present: 0,
    presentFound: 0,
    falseMissing: 0,
    presentOther: 0,
    notPresent: 0,
    falsePresent: 0,
    statedAbsent: 0,
    statedAbsentDetected: 0,
    notStatedAbsent: 0,
    falseStatedAbsent: 0,
    valueGiven: 0,
    valueMatched: 0,
    pageGiven: 0,
    pageMatched: 0,
    keysRead: 0,
  }
}

export function scorePair(gold, predicted) {
  const stateMatch = gold.state === predicted.state
  const falseMissing = gold.state === 'present' && predicted.state === 'missing'
  const falsePresent = predicted.state === 'present' && gold.state !== 'present'
  const presentFound = gold.state === 'present' && predicted.state === 'present'
  const statedAbsentDetected = gold.statedAbsent === true && predicted.statedAbsent === true
  const falseStatedAbsent = gold.statedAbsent !== true && predicted.statedAbsent === true
  const valueCompared = gold.value !== null && gold.value !== undefined
  const valueMatch = valueCompared
    && predicted.value !== null
    && predicted.value !== undefined
    && valuesMatch(gold.value, predicted.value)
  const pageCompared = Number.isInteger(gold.page)
  const pageMatch = pageCompared && predicted.page === gold.page
  return {
    stateMatch,
    falseMissing,
    falsePresent,
    presentFound,
    statedAbsentDetected,
    falseStatedAbsent,
    valueCompared,
    valueMatch,
    pageCompared,
    pageMatch,
  }
}

export function accumulate(metrics, gold, predicted, scored) {
  metrics.keys += 1
  if (scored.stateMatch) metrics.stateCorrect += 1
  if (gold.state === 'present') {
    metrics.present += 1
    if (scored.presentFound) metrics.presentFound += 1
    else if (scored.falseMissing) metrics.falseMissing += 1
    else metrics.presentOther += 1
  } else {
    metrics.notPresent += 1
    if (scored.falsePresent) metrics.falsePresent += 1
  }
  if (gold.statedAbsent === true) {
    metrics.statedAbsent += 1
    if (scored.statedAbsentDetected) metrics.statedAbsentDetected += 1
  } else {
    metrics.notStatedAbsent += 1
    if (scored.falseStatedAbsent) metrics.falseStatedAbsent += 1
  }
  if (scored.valueCompared) {
    metrics.valueGiven += 1
    if (scored.valueMatch) metrics.valueMatched += 1
  }
  if (scored.pageCompared) {
    metrics.pageGiven += 1
    if (scored.pageMatch) metrics.pageMatched += 1
  }
  if (predicted.read) metrics.keysRead += 1
}

export function ratio(numerator, denominator) {
  if (!denominator) return null
  return numerator / denominator
}

export function finishMetrics(metrics) {
  return {
    ...metrics,
    stateAccuracy: ratio(metrics.stateCorrect, metrics.keys),
    presentRecall: ratio(metrics.presentFound, metrics.present),
    falseMissingRate: ratio(metrics.falseMissing, metrics.present),
    falsePresentRate: ratio(metrics.falsePresent, metrics.notPresent),
    statedAbsentDetection: ratio(metrics.statedAbsentDetected, metrics.statedAbsent),
    statedAbsentFalseRate: ratio(metrics.falseStatedAbsent, metrics.notStatedAbsent),
    valueMatch: ratio(metrics.valueMatched, metrics.valueGiven),
    pageMatch: ratio(metrics.pageMatched, metrics.pageGiven),
    keysReadRate: ratio(metrics.keysRead, metrics.keys),
  }
}

export function addMetrics(target, source) {
  for (const key of Object.keys(emptyMetrics())) target[key] += source[key]
}
