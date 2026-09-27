/**
 * Markdown and JSON reports for one extraction-accuracy run.
 */

import { emptyMetrics, finishMetrics } from './score.mjs'

const RATE_ROWS = [
  ['stateAccuracy', 'State accuracy', 'keys whose desk state matches the answer sheet'],
  ['presentRecall', 'Recall on present', 'truly present keys the desk also reported present'],
  ['falseMissingRate', 'False-missing rate', 'truly present keys the desk reported missing'],
  ['falsePresentRate', 'False-present rate', 'keys that are not present and the desk reported present'],
  ['statedAbsentDetection', 'Stated-absent detection', 'stated absences the desk recorded'],
  ['valueMatch', 'Value match', 'normalised value, where the answer sheet gives one'],
  ['pageMatch', 'Page match', 'page, where the answer sheet gives one'],
  ['quoteMatch', 'Quote match', 'whitespace-collapsed quote, where the answer sheet gives one'],
]

function percent(rate) {
  if (rate === null || rate === undefined) return null
  return `${(rate * 100).toFixed(1)}%`
}

function fraction(numerator, denominator, emptyLabel) {
  if (!denominator) return `n/a (${emptyLabel})`
  const rate = numerator / denominator
  return `${percent(rate)} (${numerator}/${denominator})`
}

function metricLine(metrics, key) {
  if (key === 'stateAccuracy') return fraction(metrics.stateCorrect, metrics.keys, 'no keys')
  if (key === 'presentRecall') return fraction(metrics.presentFound, metrics.present, 'no present keys')
  if (key === 'falseMissingRate') return fraction(metrics.falseMissing, metrics.present, 'no present keys')
  if (key === 'falsePresentRate') return fraction(metrics.falsePresent, metrics.notPresent, 'no non-present keys')
  if (key === 'statedAbsentDetection') {
    return fraction(metrics.statedAbsentDetected, metrics.statedAbsent, 'no stated absences')
  }
  if (key === 'valueMatch') return fraction(metrics.valueMatched, metrics.valueGiven, 'no values given')
  if (key === 'pageMatch') return fraction(metrics.pageMatched, metrics.pageGiven, 'no pages given')
  if (key === 'quoteMatch') return fraction(metrics.quoteMatched, metrics.quoteGiven, 'no quotes given')
  return ''
}

function sortedGroups(groups) {
  return [...groups].sort((left, right) => left.label.localeCompare(right.label))
}

function markdownTable(metrics) {
  const lines = [
    '| Metric | Result |',
    '| --- | --- |',
  ]
  for (const [key, label] of RATE_ROWS) {
    lines.push(`| ${label} | ${metricLine(metrics, key)} |`)
  }
  lines.push(`| Keys read from the packet | ${metrics.keysRead}/${metrics.keys} |`)
  return lines.join('\n')
}

function showValue(value) {
  if (value === null || value === undefined) return 'null'
  const raw = typeof value === 'string' ? value : String(value)
  const clean = raw.replace(/\s+/g, ' ').replace(/\|/g, '/').trim()
  return clean.length > 80 ? `${clean.slice(0, 79)}…` : clean
}

function fileSection(file) {
  const lines = [
    `### ${file.file}`,
    '',
    `Pack \`${file.packId}\` ${file.packVersion}. ${file.pages} pages. Split \`${file.split}\`. Response \`${file.responseSource}\`. SHA-256 \`${file.sha256}\`.`,
    '',
    markdownTable(file.metrics),
  ]
  if (file.misses.length === 0) {
    lines.push('', 'Every scored key matched the answer-sheet state.')
    return lines.join('\n')
  }
  lines.push('', '| Key | Answer | Desk | False missing | False present | Stated absent (answer / desk) | Answer value | Desk value |', '| --- | --- | --- | --- | --- | --- | --- | --- |')
  for (const miss of file.misses) {
    const absent = `${miss.gold.statedAbsent ? 'yes' : 'no'} / ${miss.predicted.statedAbsent ? 'yes' : 'no'}`
    lines.push(`| \`${miss.key}\` | ${miss.gold.state} | ${miss.predicted.state} | ${miss.falseMissing ? 'yes' : ''} | ${miss.falsePresent ? 'yes' : ''} | ${absent} | ${showValue(miss.gold.value)} | ${showValue(miss.predicted.value)} |`)
  }
  return lines.join('\n')
}

function confusionTable(rows) {
  const lines = [
    '| Pack | Key | Files | State | False missing | False present | Readings |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ]
  const ordered = [...rows].sort((left, right) => {
    if (right.falseMissing !== left.falseMissing) return right.falseMissing - left.falseMissing
    if (right.falsePresent !== left.falsePresent) return right.falsePresent - left.falsePresent
    if (left.stateCorrect / left.files !== right.stateCorrect / right.files) {
      return left.stateCorrect / left.files - right.stateCorrect / right.files
    }
    if (left.packId !== right.packId) return left.packId.localeCompare(right.packId)
    return left.key.localeCompare(right.key)
  })
  for (const row of ordered) {
    const readings = Object.entries(row.readings)
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .map(([pair, count]) => `${pair} × ${count}`)
      .join('; ')
    lines.push(`| ${row.packId} | \`${row.key}\` | ${row.files} | ${row.stateCorrect}/${row.files} | ${row.falseMissing} | ${row.falsePresent} | ${readings} |`)
  }
  return lines.join('\n')
}

function groupSection(title, groups) {
  const blocks = [`## ${title}`, '']
  for (const group of sortedGroups(groups)) {
    blocks.push(`### ${group.label}`, '', markdownTable(group.metrics), '')
  }
  return blocks.join('\n').trimEnd()
}

export function renderMarkdown(report) {
  const parts = [
    '# Trace-li extraction accuracy',
    '',
    `Pipeline \`${report.pipelineVersion}\`. Mode \`${report.mode}\`. ${report.files.length} file${report.files.length === 1 ? '' : 's'}.`,
    '',
    'False-missing is the share of keys that are truly present and that the desk reported missing. That is the rate to drive down. False-present is the share of keys that are not present and that the desk reported present.',
    '',
    'A stated absence is detected when the answer sheet sets `statedAbsent` and the desk stores a missing reason beginning with `Stated absent in this packet:`, or stores `negative` for that same key. A negative whose answer sheet sets `statedAbsent` to false is an adverse fact. It is not counted as a false stated-absence. Value match ignores case and collapses whitespace. Page match counts only keys whose answer sheet names a page. Quote match collapses whitespace runs to one space and compares the answer-sheet sentence with the desk quote; it does not fold case.',
    '',
    '## Overall',
    '',
    markdownTable(report.overall),
    '',
    groupSection('By pack', report.packs),
    '',
    '## By file',
    '',
    report.files.map(fileSection).join('\n\n'),
  ]
  if (report.splits) {
    parts.push(
      '',
      '## Train',
      '',
      `${report.splits.train.files.length} file${report.splits.train.files.length === 1 ? '' : 's'}.`,
      '',
      markdownTable(report.splits.train.metrics),
      '',
      '## Test',
      '',
      `${report.splits.test.files.length} file${report.splits.test.files.length === 1 ? '' : 's'}.`,
      '',
      markdownTable(report.splits.test.metrics),
    )
  }
  parts.push(
    '',
    '## Per-key confusion',
    '',
    'Each row is one pack key across the files in this run. Readings are answer state to desk state.',
    '',
    confusionTable(report.confusion),
    '',
  )
  return `${parts.join('\n')}\n`
}

export function renderJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`
}

export function buildReport({ pipelineVersion, mode, files, confusion }) {
  const overall = finishMetrics(sumFiles(files))
  const packs = groupBy(files, file => file.packId).map(group => ({
    label: group.label,
    metrics: finishMetrics(sumFiles(group.files)),
  }))
  const splits = files.some(file => file.split === 'test')
    ? {
      train: splitBlock(files.filter(file => file.split !== 'test')),
      test: splitBlock(files.filter(file => file.split === 'test')),
    }
    : null
  return {
    pipelineVersion,
    mode,
    overall,
    packs,
    splits,
    files: files.map(file => ({
      ...file,
      metrics: finishMetrics(file.metrics),
    })),
    confusion,
  }
}

function sumFiles(files) {
  return files.reduce((metrics, file) => {
    for (const key of Object.keys(metrics)) metrics[key] += file.metrics[key]
    return metrics
  }, emptyMetrics())
}

function groupBy(files, labelOf) {
  const map = new Map()
  for (const file of files) {
    const label = labelOf(file)
    const group = map.get(label) ?? { label, files: [] }
    group.files.push(file)
    map.set(label, group)
  }
  return [...map.values()]
}

function splitBlock(files) {
  return {
    files: files.map(file => file.file),
    metrics: finishMetrics(sumFiles(files)),
  }
}
