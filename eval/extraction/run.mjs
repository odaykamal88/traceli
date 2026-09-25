/**
 * Score pack extraction against answer sheets.
 *
 * Cached mode replays a stored Talonic body through the desk client.
 * Live mode calls Talonic and writes that body into the gitignored cache.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { EvalInputError, defaultReportDir, runCorpus } from './corpus.mjs'
import { renderJson, renderMarkdown } from './report.mjs'

const { values } = parseArgs({
  options: {
    dir: { type: 'string' },
    mode: { type: 'string', default: 'cached' },
    out: { type: 'string' },
    holdout: { type: 'string' },
    cache: { type: 'string' },
    help: { type: 'boolean', default: false },
  },
  strict: true,
})

function help() {
  return [
    'Usage: pnpm eval:extraction -- [--dir path] [--mode cached|live] [--out path] [--holdout a.pdf,b.pdf] [--cache path]',
    '',
    'Default directory: eval/extraction/fixtures/packets',
    'Default mode: cached. Cached mode never calls Talonic.',
    'Live mode reads TRACE_TALONIC_API_KEY and TRACE_TALONIC_BASE_URL the same way as the desk.',
    'Hold out files to report a test split separately from the rest.',
  ].join('\n')
}

if (values.help) {
  process.stdout.write(`${help()}\n`)
} else {
  try {
    const report = await runCorpus({
      dir: values.dir,
      mode: values.mode,
      cacheDir: values.cache,
      holdout: (values.holdout ?? '').split(',').map(name => name.trim()).filter(Boolean),
    })
    const outDir = resolve(values.out ?? defaultReportDir)
    await mkdir(outDir, { recursive: true })
    const markdownPath = resolve(outDir, 'extraction-accuracy.md')
    const jsonPath = resolve(outDir, 'extraction-accuracy.json')
    await writeFile(markdownPath, renderMarkdown(report))
    await writeFile(jsonPath, renderJson(report))
    const overall = report.overall
    process.stdout.write(
      [
        `Trace-li extraction accuracy (${report.mode}, ${report.pipelineVersion})`,
        `Files: ${report.files.length}`,
        `State accuracy: ${overall.stateCorrect}/${overall.keys}`,
        `False-missing: ${overall.present ? `${overall.falseMissing}/${overall.present}` : 'n/a'}`,
        `False-present: ${overall.notPresent ? `${overall.falsePresent}/${overall.notPresent}` : 'n/a'}`,
        `Keys read: ${overall.keysRead}/${overall.keys}`,
        `Markdown: ${markdownPath}`,
        `JSON: ${jsonPath}`,
        '',
      ].join('\n'),
    )
  } catch (error) {
    const message = error instanceof EvalInputError || error instanceof Error
      ? error.message
      : 'Extraction accuracy scoring failed.'
    process.stderr.write(`${message}\n\n${help()}\n`)
    process.exitCode = 1
  }
}
