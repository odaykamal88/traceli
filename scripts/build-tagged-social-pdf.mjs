#!/usr/bin/env node

import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDirectory, '..')
const runtimePlaywright = path.join(
  os.homedir(),
  '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

let chromium
try {
  ;({ chromium } = require('playwright'))
} catch {
  ;({ chromium } = require(runtimePlaywright))
}

const release = process.env.TRACELI_SOCIAL_RELEASE === '1'
const outputPath = path.join(root, release ? 'output/pdf/before-you-sign-01-linkedin-document.pdf' : 'output/pdf/before-you-sign-01-linkedin-document-review.pdf')
const imageRoot = path.join(root, release ? 'output/social/before-you-sign-01-release/linkedin' : 'output/social/before-you-sign-01/linkedin')

const pages = [
  {
    file: '01-cover.png',
    alt: 'Cover. The award was signed. The proof was not ready. Four official records and one award-assurance question. A five-part trace connects governing rule, source evidence, named human judgment, exception and approval. Before You Sign, by Traceli Research Desk. Internal review - not approved.',
  },
  {
    file: '02-control-moment.png',
    alt: 'The control moment. A donor or auditor asks why the supplier won. The answer may exist across valid systems and files, but another person should be able to follow it without reconstructing the decision from memory. The trace shows governing rule, source evidence, named human judgment, exception and approval. The human decision point remains visible; this is not an automatic source-to-award path. Internal review - not approved.',
  },
  {
    file: '03-auditability-financial-eligibility.png',
    alt: 'Two official records. Auditability: a final UN OIOS internal-audit report found that UNMISS bid evaluations were not timely and their documentation was inadequate; recommendations were accepted and later recorded as implemented. Financial eligibility: an OLAF investigative finding and recommendations stated a 7.5 million euro financial impact and considered corresponding payments ineligible; this is not presented as a final judgment or completed recovery. Internal review - not approved.',
  },
  {
    file: '04-funding-continuity-integrity-exposure.png',
    alt: 'Two official records. Funding continuity: OLAF investigative findings and recommendations advised protecting 112 million euros of future IPARD funding until remedial measures were in place; the source does not establish that the amount was suspended or recovered. Integrity exposure: a World Bank settlement-based debarment lasted 63 months after false past-experience claims in two financed-project bids; the company acknowledged responsibility. Internal review - not approved.',
  },
  {
    file: '05-recurring-question.png',
    alt: 'The recurring control question: could the accountable team prove the award before signing it? Four consequence families surround the award proof record: auditability, financial eligibility, funding continuity and integrity exposure. The records show consequence categories, not prevalence, customer outcomes or prevention claims. Internal review - not approved.',
  },
  {
    file: '06-seven-questions.png',
    alt: 'Seven questions for one completed award. Can each criterion open its governing rule? Can each material supplier claim open its source evidence? Is each consequential judgment tied to a named reviewer and timestamp? Are clarifications, conflicts and exceptions visible with their dispositions? Does the chronology show what changed, who changed it and why? Can the signatory see unresolved issues before approval? Can an independent reviewer export a coherent record without relying on personal memory? A weak answer is not proof of misconduct; it signals that the record may not yet be ready. Internal review - not approved.',
  },
  {
    file: '07-where-traceli-fits.png',
    alt: 'Where Traceli fits. Map the award controls, surface evidence gaps for named human disposition and prepare a source-linked file. Traceli does not certify compliance, replace audit, make the award decision or guarantee an outcome. Call to action: discuss one procurement file at cal.com/oqemal/30min. Internal review - not approved.',
  },
]

const pageLinks = {
  2: [
    { href: 'https://oios.un.org/system/files/confidential-files/Reports/2024_064_pd.pdf', label: 'UN OIOS report 2024/064', left: 64, top: 1152, width: 430, height: 38 },
    { href: 'https://ec.europa.eu/olaf-report/2025/investigative-activities/protection-of-eu-funds_en.html#an-irregular-tender-procedure', label: 'OLAF Report 2025, irregular tender procedure', left: 558, top: 1152, width: 458, height: 38 },
  ],
  3: [
    { href: 'https://ec.europa.eu/olaf-report/2023/investigative-activities/preventing-undue-expenditure_en.html#serious-misuse-of-eu-pre-accession-agricultural-funds', label: 'OLAF Report 2023, IPARD funds', left: 64, top: 1152, width: 430, height: 38 },
    { href: 'https://www.worldbank.org/en/news/press-release/2025/06/18/world-bank-group-debars-pars-tableau-company-jsc', label: 'World Bank Group debarment notice, 18 June 2025', left: 558, top: 1152, width: 458, height: 38 },
  ],
  6: [
    { href: 'https://cal.com/oqemal/30min', label: 'Contact Traceli to test one completed tender', left: 64, top: 1110, width: 952, height: 102 },
  ],
}

const escapeAttribute = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

const renderedPages = await Promise.all(pages.map(async ({ file, alt }, index) => {
  if (release) alt = alt.replace(' Internal review - not approved.', '')
  const png = await readFile(path.join(imageRoot, file))
  const source = `data:image/png;base64,${png.toString('base64')}`
  const links = (pageLinks[index] ?? []).map(({ href, label, left, top, width, height }) => `<a class="source-link" href="${href}" aria-label="${escapeAttribute(label)}" style="left:${left}px;top:${top}px;width:${width}px;height:${height}px">${escapeAttribute(label)}</a>`).join('')
  return `<section class="page" aria-label="Page ${index + 1} of ${pages.length}"><img src="${source}" alt="${escapeAttribute(alt)}" />${links}</section>`
}))

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>The award was signed. The proof was not ready.${release ? '' : ' - Review copy'}</title>
    <style>
      @page { size: 1080px 1350px; margin: 0; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #f7f3eb; }
      .page { position: relative; width: 1080px; height: 1350px; margin: 0; padding: 0; break-after: page; overflow: hidden; }
      .page:last-child { break-after: auto; }
      img { display: block; width: 1080px; height: 1350px; object-fit: contain; }
      .source-link { position: absolute; display: block; overflow: hidden; color: transparent; font-size: 1px; opacity: 0.001; }
    </style>
  </head>
  <body><main aria-label="Before You Sign 01 document">${renderedPages.join('')}</main></body>
</html>`

const chromePath = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].find((candidate) => candidate && existsSync(candidate))

const browser = await chromium.launch({
  headless: true,
  ...(chromePath ? { executablePath: chromePath } : {}),
})
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } })
  await page.setContent(html, { waitUntil: 'load' })
  await page.emulateMedia({ media: 'print' })
  await page.pdf({
    path: outputPath,
    printBackground: true,
    preferCSSPageSize: true,
    tagged: true,
    outline: true,
  })
} finally {
  await browser.close()
}

process.stdout.write(`Created tagged review PDF: ${outputPath}\n`)
