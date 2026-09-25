/**
 * Run award PDFs through the desk Talonic client and pack snapshot,
 * then score them against answer sheets.
 */

import { createHash } from 'node:crypto'
import { readdir, readFile, mkdir, writeFile, rename } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ExtractionError, sourceFileHashOf } from '../../lib/field-registry/extract.ts'
import { TALONIC_PACK_PIPELINE_VERSION, TalonicExtractionProvider } from '../../lib/field-registry/extract-talonic.ts'
import { snapshotFromUpload } from '../../lib/desk/freeze-upload.ts'
import { STATED_ABSENT_PREFIX } from '../../lib/field-registry/pack-align.ts'
import { fieldKeysForDonorPack } from '../../lib/field-registry/pack-schema.ts'
import { getDonorPack, isDonorPackId } from '../../lib/field-registry/packs/index.ts'

import { buildReport } from './report.mjs'
import { accumulate, emptyMetrics, scorePair } from './score.mjs'

const root = fileURLToPath(new URL('.', import.meta.url))

export const defaultPacketsDir = resolve(root, 'fixtures/packets')
export const defaultEnvelopeDir = resolve(root, 'fixtures/envelopes')
export const defaultCacheDir = resolve(root, '.cache')
export const defaultReportDir = resolve(root, 'reports')
export const pipelineVersion = TALONIC_PACK_PIPELINE_VERSION

/** Same sentence as `missingField` in the desk snapshot. An unread key uses this reason. */
const UNREAD_REASON = 'Not extracted from this packet.'
const SHEET_KEYS = ['file', 'packId', 'packVersion', 'sha256', 'pages', 'fields', 'split']
const FIELD_KEYS = ['state', 'statedAbsent', 'value', 'page', 'quote', 'note']
const STATES = new Set(['present', 'missing', 'negative'])
const EVAL_ORGANIZATION = 'org_eval_extraction'
const REPLAY_KEY = 'tlnc_eval_cache_replay'

export class EvalInputError extends Error {
  constructor(message) {
    super(message)
    this.name = 'EvalInputError'
  }
}

function cacheFile(dir, packId, sha256) {
  return join(dir, pipelineVersion, packId, `${sha256}.json`)
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function predictionFromField(field) {
  const label = field.provenance?.sourceRef?.label ?? ''
  const quoteFromLabel = label.startsWith('Quote: ') ? label.slice('Quote: '.length).trim() : ''
  const pageMatch = /^page-(\d+)$/.exec(field.provenance?.sourceRef?.id ?? '')
  const page = pageMatch ? Number(pageMatch[1]) : null
  if (field.value.state === 'missing') {
    const statedAbsent = field.value.reason.startsWith(STATED_ABSENT_PREFIX)
    const quote = statedAbsent ? field.value.reason.slice(STATED_ABSENT_PREFIX.length).trim() : null
    return {
      state: 'missing',
      statedAbsent,
      value: null,
      page,
      quote: quote || null,
      read: statedAbsent,
    }
  }
  if (field.value.state === 'negative') {
    return {
      state: 'negative',
      statedAbsent: true,
      value: field.value.value,
      page,
      quote: quoteFromLabel || null,
      read: true,
    }
  }
  return {
    state: 'present',
    statedAbsent: false,
    value: field.value.value,
    page,
    quote: quoteFromLabel || null,
    read: true,
  }
}

function requireString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new EvalInputError(`${label} must be a non-empty string.`)
  return value.trim()
}

export function validateAnswerSheet(sheet, pdfName, sha256, packKeys) {
  if (!isObject(sheet)) throw new EvalInputError(`${pdfName} answer sheet must be a JSON object.`)
  const extra = Object.keys(sheet).filter(key => !SHEET_KEYS.includes(key))
  if (extra.length > 0) throw new EvalInputError(`${pdfName} answer sheet has unknown fields: ${extra.join(', ')}.`)
  const file = requireString(sheet.file, `${pdfName} file`)
  if (file !== pdfName) throw new EvalInputError(`${pdfName} answer sheet names ${file}.`)
  const packId = requireString(sheet.packId, `${pdfName} packId`)
  if (!isDonorPackId(packId)) throw new EvalInputError(`${pdfName} packId ${packId} is not a desk pack.`)
  const packVersion = requireString(sheet.packVersion, `${pdfName} packVersion`)
  const current = getDonorPack(packId).version
  if (packVersion !== current) {
    throw new EvalInputError(`${pdfName} packVersion is ${packVersion}. The desk pack is ${current}.`)
  }
  const hash = requireString(sheet.sha256, `${pdfName} sha256`).toLowerCase()
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new EvalInputError(`${pdfName} sha256 is not 64 hex characters.`)
  if (hash !== sha256) throw new EvalInputError(`${pdfName} sha256 does not match the PDF bytes.`)
  if (!Number.isInteger(sheet.pages) || sheet.pages < 1 || sheet.pages > 10000) {
    throw new EvalInputError(`${pdfName} pages must be a positive integer.`)
  }
  if (sheet.split !== undefined && sheet.split !== 'train' && sheet.split !== 'test') {
    throw new EvalInputError(`${pdfName} split must be train or test.`)
  }
  if (!isObject(sheet.fields)) throw new EvalInputError(`${pdfName} fields must be an object.`)
  const expected = new Set(packKeys)
  const seen = Object.keys(sheet.fields)
  const missing = packKeys.filter(key => !Object.hasOwn(sheet.fields, key))
  const unknown = seen.filter(key => !expected.has(key))
  if (missing.length > 0) throw new EvalInputError(`${pdfName} answer sheet is missing ${missing.join(', ')}.`)
  if (unknown.length > 0) throw new EvalInputError(`${pdfName} answer sheet has unknown keys: ${unknown.join(', ')}.`)
  for (const key of packKeys) {
    const entry = sheet.fields[key]
    if (!isObject(entry)) throw new EvalInputError(`${pdfName} ${key} must be an object.`)
    const fieldExtra = Object.keys(entry).filter(name => !FIELD_KEYS.includes(name))
    if (fieldExtra.length > 0) {
      throw new EvalInputError(`${pdfName} ${key} has unknown fields: ${fieldExtra.join(', ')}.`)
    }
    if (!STATES.has(entry.state)) throw new EvalInputError(`${pdfName} ${key} state must be present, missing, or negative.`)
    if (typeof entry.statedAbsent !== 'boolean') throw new EvalInputError(`${pdfName} ${key} statedAbsent must be boolean.`)
    if (entry.state === 'present' && entry.statedAbsent) {
      throw new EvalInputError(`${pdfName} ${key} cannot be present and stated absent.`)
    }
    if (entry.state === 'missing' && entry.value !== null) {
      throw new EvalInputError(`${pdfName} ${key} missing value must be null.`)
    }
    if (entry.state !== 'missing' && (entry.value === null || entry.value === undefined)) {
      throw new EvalInputError(`${pdfName} ${key} needs a value when the state is ${entry.state}.`)
    }
    if (entry.value !== null && !['string', 'number', 'boolean'].includes(typeof entry.value)) {
      throw new EvalInputError(`${pdfName} ${key} value must be a string, number, boolean, or null.`)
    }
    if (entry.page !== null && (!Number.isInteger(entry.page) || entry.page < 1 || entry.page > 10000)) {
      throw new EvalInputError(`${pdfName} ${key} page must be a positive integer or null.`)
    }
    if (entry.quote !== null && typeof entry.quote !== 'string') {
      throw new EvalInputError(`${pdfName} ${key} quote must be a string or null.`)
    }
    if (typeof entry.note !== 'string') throw new EvalInputError(`${pdfName} ${key} note must be a string.`)
  }
  return { file, packId, packVersion, sha256: hash, pages: sheet.pages, split: sheet.split ?? 'train', fields: sheet.fields }
}

async function readEnvelope(path, expected) {
  let parsed
  try {
    parsed = JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if (error && error.code === 'ENOENT') return null
    throw new EvalInputError(`Could not read cached Talonic response ${path}.`)
  }
  if (!isObject(parsed) || !isObject(parsed.envelope)) return null
  if (parsed.pipelineVersion !== pipelineVersion) return null
  if (parsed.packId !== expected.packId) return null
  if (parsed.sha256 !== expected.sha256) return null
  return parsed
}

function scrub(value, secret) {
  if (!secret) return value
  return JSON.parse(JSON.stringify(value).split(secret).join('[redacted]'))
}

async function writeEnvelope(path, record) {
  await mkdir(dirname(path), { recursive: true })
  const temporary = `${path}.${createHash('sha256').update(path).digest('hex').slice(0, 8)}.tmp`
  await writeFile(temporary, `${JSON.stringify(record, null, 2)}\n`)
  await rename(temporary, path)
}

function replayFetch(envelope) {
  const body = JSON.stringify(envelope)
  return async () => new Response(body, {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function recordingFetch(inner, sink) {
  return async (url, init) => {
    const response = await inner(url, init)
    if (response.status === 200 || response.status === 201) {
      const text = await response.clone().text()
      try {
        const json = JSON.parse(text)
        const markdown = typeof json?.markdown === 'string' && json.markdown.trim()
        const data = isObject(json?.data) && Object.keys(json.data).length > 0
        if (markdown || data) sink.envelope = json
      } catch {
        // Poll bodies that are not JSON are not a completed extract.
      }
    }
    return response
  }
}

async function extractPacket({ fileName, bytes, packId, envelope, env, fetchImpl }) {
  const replay = Boolean(envelope)
  const sink = { envelope: null }
  const provider = new TalonicExtractionProvider({
    env: replay
      ? {
        TRACE_TALONIC_API_KEY: REPLAY_KEY,
        TRACE_TALONIC_BASE_URL: 'https://api.talonic.com/v1',
      }
      : env,
    fetchImpl: replay ? replayFetch(envelope) : recordingFetch(fetchImpl, sink),
    now: () => new Date('2026-09-25T00:00:00.000Z'),
  })
  let extraction
  try {
    extraction = await provider.extract({
      fileName,
      mediaType: 'application/pdf',
      bytes,
      packId,
      organizationId: EVAL_ORGANIZATION,
    })
  } catch (error) {
    if (error instanceof ExtractionError) {
      throw new EvalInputError(`${fileName}: ${error.message}`)
    }
    throw error
  }
  const extractedAt = extraction.fragments[0]?.extractedAt ?? '2026-09-25T00:00:00.000Z'
  const mapped = snapshotFromUpload(extraction, packId, {
    organizationId: EVAL_ORGANIZATION,
    awardId: `award.${extraction.sourceFileHash.slice(0, 16)}`,
    procurementReference: `EVAL-${extraction.sourceFileHash.slice(0, 12)}`,
    asOf: extractedAt,
  })
  return { extraction, mapped, captured: sink.envelope }
}

function scoreFile(sheet, packKeys, mapped) {
  const byKey = new Map(mapped.snapshot.fields.map(field => [field.key, field]))
  const metrics = emptyMetrics()
  const keys = []
  const misses = []
  for (const key of packKeys) {
    const field = byKey.get(key)
    if (!field) throw new EvalInputError(`${sheet.file} desk snapshot has no ${key}.`)
    const predicted = predictionFromField(field)
    if (!predicted.read && field.value.state === 'missing' && field.value.reason !== UNREAD_REASON) {
      predicted.read = true
    }
    const gold = {
      state: sheet.fields[key].state,
      statedAbsent: sheet.fields[key].statedAbsent,
      value: sheet.fields[key].value,
      page: sheet.fields[key].page,
      quote: sheet.fields[key].quote,
    }
    const scored = scorePair(gold, predicted)
    accumulate(metrics, gold, predicted, scored)
    const statedAbsentMiss = gold.statedAbsent === true && !scored.statedAbsentDetected
    const row = { key, gold, predicted, statedAbsentMiss, ...scored }
    keys.push(row)
    if (!scored.stateMatch || scored.falseMissing || scored.falsePresent || statedAbsentMiss || scored.falseStatedAbsent) {
      misses.push(row)
    }
  }
  return { metrics, keys, misses }
}

function bumpConfusion(confusion, packId, row) {
  const id = `${packId}\0${row.key}`
  const entry = confusion.get(id) ?? {
    packId,
    key: row.key,
    files: 0,
    stateCorrect: 0,
    falseMissing: 0,
    falsePresent: 0,
    readings: {},
  }
  entry.files += 1
  if (row.stateMatch) entry.stateCorrect += 1
  if (row.falseMissing) entry.falseMissing += 1
  if (row.falsePresent) entry.falsePresent += 1
  const pair = `${row.gold.state}->${row.predicted.state}`
  entry.readings[pair] = (entry.readings[pair] ?? 0) + 1
  confusion.set(id, entry)
}

export async function loadCorpus(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const pdfs = entries
    .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.pdf'))
    .map(entry => entry.name)
    .sort()
  if (pdfs.length === 0) throw new EvalInputError(`No PDF files in ${dir}.`)
  const packets = []
  for (const name of pdfs) {
    const sheetPath = join(dir, `${basename(name, '.pdf')}.json`)
    let sheetJson
    try {
      sheetJson = JSON.parse(await readFile(sheetPath, 'utf8'))
    } catch (error) {
      if (error && error.code === 'ENOENT') throw new EvalInputError(`${name} has no answer sheet at ${sheetPath}.`)
      throw new EvalInputError(`${name} answer sheet is not valid JSON.`)
    }
    const bytes = new Uint8Array(await readFile(join(dir, name)))
    if (bytes.byteLength < 5 || Buffer.from(bytes.subarray(0, 5)).toString('latin1') !== '%PDF-') {
      throw new EvalInputError(`${name} is not a PDF.`)
    }
    const sha256 = sourceFileHashOf(bytes)
    const packIdGuess = typeof sheetJson?.packId === 'string' ? sheetJson.packId : ''
    const packKeys = isDonorPackId(packIdGuess) ? fieldKeysForDonorPack(packIdGuess) : []
    const sheet = validateAnswerSheet(sheetJson, name, sha256, packKeys)
    packets.push({ name, bytes, sha256, sheet, packKeys })
  }
  return packets
}

export async function runCorpus(options) {
  const dir = resolve(options.dir ?? defaultPacketsDir)
  const mode = options.mode ?? 'cached'
  if (mode !== 'cached' && mode !== 'live') throw new EvalInputError('Mode must be cached or live.')
  const cacheDir = resolve(options.cacheDir ?? defaultCacheDir)
  const envelopeDir = resolve(options.envelopeDir ?? defaultEnvelopeDir)
  const env = options.env ?? process.env
  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  const holdout = new Set((options.holdout ?? []).filter(Boolean))
  const packets = await loadCorpus(dir)
  const unknownHoldout = [...holdout].filter(name => !packets.some(packet => packet.name === name))
  if (unknownHoldout.length > 0) {
    throw new EvalInputError(`Holdout file is not in ${dir}: ${unknownHoldout.join(', ')}.`)
  }
  const confusion = new Map()
  const files = []
  for (const packet of packets) {
    const split = holdout.has(packet.name) ? 'test' : packet.sheet.split
    const expected = { packId: packet.sheet.packId, sha256: packet.sha256 }
    let envelope = null
    let responseSource = 'live'
    if (mode === 'cached') {
      const cached = await readEnvelope(cacheFile(cacheDir, packet.sheet.packId, packet.sha256), expected)
      const seeded = cached ?? await readEnvelope(
        cacheFile(envelopeDir, packet.sheet.packId, packet.sha256),
        expected,
      )
      if (!seeded) {
        throw new EvalInputError(
          `No cached Talonic response for ${packet.name} (${packet.sha256}). `
          + 'Run `pnpm eval:extraction -- --mode live` with TRACE_TALONIC_API_KEY set. '
          + 'Cached mode does not call Talonic.',
        )
      }
      envelope = seeded.envelope
      responseSource = cached ? 'cache' : 'fixture'
    }
    const { mapped, captured } = await extractPacket({
      fileName: packet.name,
      bytes: packet.bytes,
      packId: packet.sheet.packId,
      envelope,
      env,
      fetchImpl,
    })
    if (mode === 'live') {
      if (!captured) throw new EvalInputError(`${packet.name}: Talonic returned no extraction body to cache.`)
      const secret = env.TRACE_TALONIC_API_KEY?.trim() ?? ''
      await writeEnvelope(cacheFile(cacheDir, packet.sheet.packId, packet.sha256), {
        pipelineVersion,
        packId: packet.sheet.packId,
        sha256: packet.sha256,
        file: packet.name,
        source: 'live',
        envelope: scrub(captured, secret),
      })
      responseSource = 'live'
    }
    const scored = scoreFile(packet.sheet, packet.packKeys, mapped)
    for (const row of scored.keys) bumpConfusion(confusion, packet.sheet.packId, row)
    files.push({
      file: packet.name,
      packId: packet.sheet.packId,
      packVersion: packet.sheet.packVersion,
      sha256: packet.sha256,
      pages: packet.sheet.pages,
      split,
      responseSource,
      metrics: scored.metrics,
      misses: scored.misses.map(miss => ({
        key: miss.key,
        falseMissing: miss.falseMissing,
        falsePresent: miss.falsePresent,
        statedAbsentMiss: miss.statedAbsentMiss,
        gold: miss.gold,
        predicted: {
          state: miss.predicted.state,
          statedAbsent: miss.predicted.statedAbsent,
          value: miss.predicted.value,
          page: miss.predicted.page,
          quote: miss.predicted.quote,
        },
      })),
      keys: scored.keys.map(row => ({
        key: row.key,
        stateMatch: row.stateMatch,
        falseMissing: row.falseMissing,
        falsePresent: row.falsePresent,
        valueMatch: row.valueCompared ? row.valueMatch : null,
        pageMatch: row.pageCompared ? row.pageMatch : null,
        gold: row.gold,
        predicted: {
          state: row.predicted.state,
          statedAbsent: row.predicted.statedAbsent,
          value: row.predicted.value,
          page: row.predicted.page,
        },
      })),
    })
  }
  return buildReport({
    pipelineVersion,
    mode,
    files,
    confusion: [...confusion.values()],
  })
}
