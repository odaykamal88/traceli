/**
 * Render a Trace-li pilot report from a desk session JSON file.
 *
 *   node --conditions=react-server --experimental-strip-types --import ./scripts/field-registry/register.mjs \
 *     scripts/pilot-report/render.mjs session.json --out report.pdf --reviewer "Amina Yusuf" --role "Procurement Director"
 *
 * The session is the browser souvenir `{ view, judgment }` (or the desk
 * storage object with those fields). It does not contain the packet bytes.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { buildPilotReport } from '../../lib/pilot-report/build.ts'
import { renderPilotReportPdf } from '../../lib/pilot-report/pdf.ts'
import { sessionFromJson } from '../../lib/pilot-report/session.ts'

function arg(name) {
  const index = process.argv.indexOf(name)
  if (index < 0) return undefined
  return process.argv[index + 1]
}

const file = process.argv[2]
if (!file || file.startsWith('--')) {
  console.error('Usage: render.mjs <session.json> [--out report.pdf] [--reviewer Name] [--role Role]')
  process.exit(1)
}

const out = resolve(arg('--out') || file.replace(/\.json$/i, '') + '.pdf')
const raw = JSON.parse(await readFile(resolve(file), 'utf8'))
const session = sessionFromJson(raw, {
  reviewerName: arg('--reviewer'),
  reviewerRole: arg('--role') ?? null,
})
const report = buildPilotReport(session)
const pdf = await renderPilotReportPdf(report)
await writeFile(out, pdf)
console.log(out)
