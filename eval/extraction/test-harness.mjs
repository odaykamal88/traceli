import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { TALONIC_PACK_PIPELINE_VERSION } from '../../lib/field-registry/extract-talonic.ts'
import {
  EvalInputError,
  defaultEnvelopeDir,
  defaultPacketsDir,
  loadCorpus,
  pipelineVersion,
  runCorpus,
  validateAnswerSheet,
} from './corpus.mjs'
import { renderMarkdown } from './report.mjs'
import { scorePair, valuesMatch } from './score.mjs'

const UNFPA_READ = [
  'ip.threshold_approver',
  'procurement.po_or_contract',
  'procurement.rfq_criteria_and_scores',
  'procurement.rir',
]

function metricsOf(report, fileName) {
  const file = report.files.find(item => item.file === fileName)
  assert.ok(file, fileName)
  return file
}

test('normalised values match case, whitespace, and numeric strings', () => {
  assert.equal(valuesMatch(' Clear ', 'clear'), true)
  assert.equal(valuesMatch('USD  184000', 'usd 184000'), true)
  assert.equal(valuesMatch('184000', 184000), true)
  assert.equal(valuesMatch(true, 'true'), true)
  assert.equal(valuesMatch('reserve', 'standard'), false)
  const missed = scorePair(
    { state: 'present', statedAbsent: false, value: 'reserve', page: 1 },
    { state: 'missing', statedAbsent: false, value: null, page: null, read: false },
  )
  assert.equal(missed.falseMissing, true)
  assert.equal(missed.falsePresent, false)
  assert.equal(missed.presentFound, false)
  const invented = scorePair(
    { state: 'missing', statedAbsent: false, value: null, page: null },
    { state: 'present', statedAbsent: false, value: true, page: 1, read: true },
  )
  assert.equal(invented.falsePresent, true)
  assert.equal(invented.falseMissing, false)
})

test('fixture packets score the desk pipeline without calling Talonic', async () => {
  assert.equal(pipelineVersion, 'trace-v4')
  assert.equal(TALONIC_PACK_PIPELINE_VERSION, 'trace-v4')
  const cacheDir = await mkdtemp(join(tmpdir(), 'traceli-eval-cache-'))
  const original = globalThis.fetch
  let networkCalls = 0
  globalThis.fetch = async () => {
    networkCalls += 1
    throw new Error('network')
  }
  try {
    const report = await runCorpus({ dir: defaultPacketsDir, mode: 'cached', cacheDir })
    assert.equal(networkCalls, 0)
    assert.equal(report.pipelineVersion, 'trace-v4')
    assert.equal(report.mode, 'cached')
    assert.equal(report.files.length, 3)
    assert.equal(report.splits, null)
    assert.equal(report.overall.keys, 77)
    assert.equal(report.overall.stateCorrect, 68)
    assert.equal(report.overall.present, 12)
    assert.equal(report.overall.presentFound, 3)
    assert.equal(report.overall.falseMissing, 9)
    assert.equal(report.overall.falsePresent, 0)
    assert.equal(report.overall.statedAbsent, 7)
    assert.equal(report.overall.statedAbsentDetected, 5)
    assert.equal(report.overall.falseStatedAbsent, 0)
    assert.equal(report.overall.valueMatched, 5)
    assert.equal(report.overall.valueGiven, 14)
    assert.equal(report.overall.pageMatched, 8)
    assert.equal(report.overall.pageGiven, 19)
    assert.equal(report.overall.keysRead, 8)

    const unfpa = metricsOf(report, 'unfpa-ia-2025-29-sudan-rehearsal.pdf')
    assert.equal(unfpa.packId, 'unfpa')
    assert.equal(unfpa.responseSource, 'fixture')
    assert.equal(unfpa.metrics.stateCorrect, 27)
    assert.equal(unfpa.metrics.keysRead, 4)
    assert.equal(unfpa.metrics.present, 0)
    assert.equal(unfpa.metrics.falsePresent, 0)
    assert.equal(unfpa.metrics.statedAbsentDetected, 4)
    const unfpaRead = unfpa.keys
      .filter(key => key.predicted.statedAbsent || key.predicted.state !== 'missing')
      .map(key => key.key)
      .sort()
    assert.deepEqual(unfpaRead, [...UNFPA_READ].sort())
    const approver = unfpa.keys.find(key => key.key === 'ip.threshold_approver')
    assert.equal(approver.predicted.state, 'negative')
    assert.equal(approver.predicted.value, false)
    assert.equal(approver.predicted.page, 1)

    const globalFund = metricsOf(report, 'gf-short-synthetic.pdf')
    assert.equal(globalFund.metrics.keys, 26)
    assert.equal(globalFund.metrics.presentFound, 3)
    assert.equal(globalFund.metrics.falseMissing, 4)
    assert.equal(globalFund.metrics.falsePresent, 0)
    assert.equal(globalFund.metrics.keysRead, 4)
    assert.equal(globalFund.misses.some(miss => miss.key === 'sr.capacity_assessed' && miss.statedAbsentMiss), true)

    const ocha = metricsOf(report, 'ocha-short-synthetic.pdf')
    assert.equal(ocha.metrics.keys, 24)
    assert.equal(ocha.metrics.keysRead, 0)
    assert.equal(ocha.metrics.falseMissing, 5)
    assert.equal(ocha.metrics.present, 5)
    assert.equal(ocha.metrics.falsePresent, 0)
    const modality = ocha.keys.find(key => key.key === 'allocation.modality')
    assert.equal(modality.gold.value, 'reserve')
    assert.equal(modality.predicted.state, 'missing')
    assert.equal(modality.falseMissing, true)

    const markdown = renderMarkdown(report)
    assert.match(markdown, /False-missing rate \| 75\.0% \(9\/12\)/)
    assert.match(markdown, /Keys read from the packet \| 0\/24/)
    assert.match(markdown, /ocha-cbpf \| `allocation.modality`/)
    assert.equal(report.confusion.length, 77)
  } finally {
    globalThis.fetch = original
  }
})

test('a runtime cache is preferred over the committed fixture envelope', async () => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'traceli-eval-hit-'))
  const packets = await loadCorpus(defaultPacketsDir)
  const sample = packets[0]
  const cachePath = join(cacheDir, pipelineVersion, sample.sheet.packId)
  await mkdir(cachePath, { recursive: true })
  const seeded = JSON.parse(await readFile(
    join(defaultEnvelopeDir, pipelineVersion, sample.sheet.packId, `${sample.sha256}.json`),
    'utf8',
  ))
  seeded.source = 'live'
  await writeFile(join(cachePath, `${sample.sha256}.json`), `${JSON.stringify(seeded)}\n`)
  const report = await runCorpus({ dir: defaultPacketsDir, mode: 'cached', cacheDir })
  const hit = report.files.find(file => file.file === sample.name)
  assert.equal(hit.responseSource, 'cache')
  assert.equal(report.files.filter(file => file.responseSource === 'fixture').length, 2)
})

test('holdout files are reported as their own split', async () => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'traceli-eval-hold-'))
  const report = await runCorpus({
    dir: defaultPacketsDir,
    mode: 'cached',
    cacheDir,
    holdout: ['ocha-short-synthetic.pdf'],
  })
  assert.deepEqual(report.splits.test.files, ['ocha-short-synthetic.pdf'])
  assert.equal(report.splits.test.metrics.falseMissing, 5)
  assert.equal(report.splits.test.metrics.keysRead, 0)
  assert.equal(report.splits.train.metrics.falseMissing, 4)
  assert.equal(report.splits.train.files.length, 2)
  const markdown = renderMarkdown(report)
  assert.match(markdown, /## Test/)
  assert.match(markdown, /## Train/)
})

test('live mode does not call Talonic when the API key is missing', async () => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'traceli-eval-live-'))
  let networkCalls = 0
  await assert.rejects(
    () => runCorpus({
      dir: defaultPacketsDir,
      mode: 'live',
      cacheDir,
      env: {},
      fetchImpl: async () => {
        networkCalls += 1
        throw new Error('network')
      },
    }),
    /TRACE_TALONIC_API_KEY/,
  )
  assert.equal(networkCalls, 0)
})

test('an answer sheet must cover the pack and match the PDF', async () => {
  const packets = await loadCorpus(defaultPacketsDir)
  const sample = packets.find(packet => packet.sheet.packId === 'unfpa')
  const broken = structuredClone(sample.sheet)
  delete broken.fields['ip.unpp_profile']
  assert.throws(
    () => validateAnswerSheet({ ...broken, fields: broken.fields }, sample.name, sample.sha256, sample.packKeys),
    EvalInputError,
  )
  await assert.rejects(
    () => runCorpus({ dir: defaultPacketsDir, mode: 'cached', holdout: ['missing.pdf'] }),
    /Holdout file is not/,
  )
})
