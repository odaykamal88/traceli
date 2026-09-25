/**
 * Render sample pilot reports from published founder freezes.
 * Writes PDFs under docs/examples/pilot-reports/ (gitignored).
 * Skips the UNFPA Sudan freeze when that module is not in the tree.
 * node --conditions=react-server --experimental-strip-types --import ./scripts/field-registry/register.mjs scripts/pilot-report/render-samples.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { gfOig25005FrozenRecord } from '../../lib/case-cards/gf-oig-25-005-freeze.ts'
import { oios2025098FrozenRecord } from '../../lib/case-cards/oios-2025-098-cbpf-reserve-freeze.ts'
import { buildPilotReport } from '../../lib/pilot-report/build.ts'
import { renderPilotReportPdf } from '../../lib/pilot-report/pdf.ts'
import { sessionFromFrozenRecord } from '../../lib/pilot-report/session.ts'

const outDir = resolve('docs/examples/pilot-reports')
await mkdir(outDir, { recursive: true })

const samples = [
  { file: 'gf-oig-25-005.pdf', record: gfOig25005FrozenRecord() },
  { file: 'oios-2025-098-cbpf-reserve.pdf', record: oios2025098FrozenRecord() },
]

const sudanUrl = new URL('../../lib/case-cards/unfpa-ia-2025-29-sudan-freeze.ts', import.meta.url)
try {
  const mod = await import(sudanUrl.href)
  const record = typeof mod.unfpaSudanFrozenRecord === 'function'
    ? mod.unfpaSudanFrozenRecord()
    : typeof mod.unfpaIa202529FrozenRecord === 'function'
      ? mod.unfpaIa202529FrozenRecord()
      : null
  if (record) samples.push({ file: 'unfpa-ia-2025-29-sudan.pdf', record })
  else console.log('UNFPA Sudan freeze module is present but has no frozen-record export. Skipped.')
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_MODULE_NOT_FOUND') {
    console.log('UNFPA Sudan freeze is not in this tree yet. Skipped.')
  } else {
    throw error
  }
}

for (const sample of samples) {
  const session = sessionFromFrozenRecord(sample.record, { reviewerName: sample.record.disposition.actorRole })
  const report = buildPilotReport(session)
  const pdf = await renderPilotReportPdf(report)
  const path = resolve(outDir, sample.file)
  await writeFile(path, pdf)
  console.log(`${path}  record ${report.verification.recordId}`)
}
