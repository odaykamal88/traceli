import { basename } from 'node:path'
import { parseArgs } from 'node:util'

import { ExtractionError, mediaTypeForFileName } from '../../lib/field-registry/extract.ts'
import { getExtractionProvider } from '../../lib/field-registry/extract-provider.ts'

const { values, positionals } = parseArgs({
  options: { file: { type: 'string' } },
  allowPositionals: true,
  strict: false,
})

const flagged = positionals.find(arg => arg.startsWith('--file='))?.slice('--file='.length)
const positional = positionals.find(arg => arg !== '--' && !arg.startsWith('-'))
const file = values.file || flagged || positional || process.env.npm_config_file
if (!file) {
  process.stderr.write('Usage: pnpm extract:stub -- --file=path\n')
  process.exitCode = 1
} else {
  try {
    const fileName = basename(file)
    const result = await getExtractionProvider().extract({
      fileName,
      mediaType: mediaTypeForFileName(fileName),
      path: file,
    })
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  } catch (error) {
    const code = error instanceof ExtractionError ? error.code : 'failed'
    const message = error instanceof Error ? error.message : 'Extraction failed.'
    process.stderr.write(`${code}: ${message}\n`)
    process.exitCode = 1
  }
}
