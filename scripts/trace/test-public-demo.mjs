import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.PUBLIC_DEMO_TEST_URL || 'http://127.0.0.1:3045'
const target = new URL(base)
if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password) throw Error('Use an HTTP(S) origin without credentials.')
const output = resolve(process.env.PUBLIC_DEMO_BROWSER_OUTPUT || '/private/tmp/trace-public-demo-browser')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) })
const context = await browser.newContext({ viewport: { width: 1360, height: 960 }, acceptDownloads: true })
const errors = [], consoleErrors = [], forbiddenRequests = [], checks = []
context.on('request', request => {
  if (/^\/api\/(trace|hq)(\/|$)/.test(new URL(request.url()).pathname)) forbiddenRequests.push({ method: request.method(), url: request.url() })
})
context.on('page', current => {
  current.on('pageerror', error => errors.push(error.message))
  current.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
})
const localTelemetryStub = ['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname)
if (localTelemetryStub) {
  // Vercel supplies this platform script only on hosted deployments. Keep the local application console meaningful.
  await context.route(`${target.origin}/_vercel/insights/script.js`, route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* Hosted telemetry is unavailable on this loopback test server. */' }))
}
const page = await context.newPage()
page.setDefaultTimeout(15000)
const check = async (name, run) => { await run(); checks.push({ name, status: 'passed' }); console.log(`PASS ${name}`) }
const select = value => page.getByLabel('Choose a scenario', { exact: true }).selectOption(value)
const result = () => page.getByTestId('policy-result')
const reviews = () => page.getByTestId('practice-reviews')
const rationale = () => page.getByLabel('Reason for this practice decision', { exact: true })
const decision = () => page.getByLabel('Practice decision', { exact: true })
const reset = () => page.getByRole('button', { name: 'Reset demo', exact: true }).click()
async function saveReview(text) {
  await rationale().fill(text)
  await page.getByRole('button', { name: 'Record practice review', exact: true }).click()
  await reviews().getByText(text, { exact: true }).waitFor()
}
async function download() {
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download demo record', exact: true }).click()
  const file = await pending
  assert.match(file.suggestedFilename(), /\.json$/)
  return JSON.parse(await readFile(await file.path(), 'utf8'))
}
const hash = value => createHash('sha256').update(value).digest('hex')
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
  return JSON.stringify(value)
}
try {
  const response = await page.goto(`${base.replace(/\/$/, '')}/demo`)
  assert.equal(response.status(), 200)
  await page.getByLabel('Choose a scenario', { exact: true }).waitFor()
  await check('Public demo starts with missing evidence and makes its fictional scope visible', async () => {
    assert.equal(await page.getByLabel('Choose a scenario', { exact: true }).inputValue(), 'missing')
    assert.match(await result().innerText(), /More evidence needed/)
    assert.match(await page.locator('main').innerText(), /fictional/i)
    assert.equal(await page.locator('[data-nextjs-dialog]').count(), 0)
  })
  await check('Keyboard skip link reaches the demo and download waits for a review', async () => {
    await page.keyboard.press('Tab')
    assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Skip to demo')
    await page.keyboard.press('Enter')
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'demo-main')
    assert.equal(await page.getByRole('button', { name: 'Download demo record', exact: true }).isDisabled(), true)
  })
  await check('Empty review rationale cannot create a practice decision', async () => {
    await page.getByRole('button', { name: 'Record practice review', exact: true }).click()
    assert.equal(await reviews().locator('article').count(), 0)
  })
  await check('Signed evidence revision preserves visible history and requires a separate human review', async () => {
    await page.getByRole('button', { name: 'Add fictional signed note', exact: true }).click()
    assert.match(await result().innerText(), /Evidence supports this requirement/)
    await page.getByRole('button', { name: /^Version 1/ }).click()
    assert.match(await result().innerText(), /More evidence needed/)
    await page.getByRole('button', { name: /^Version 2/ }).click()
    assert.match(await result().innerText(), /Evidence supports this requirement/)
    assert.equal(await rationale().inputValue(), '')
  })
  await check('A reasoned practice review is downloadable as a fictional demo record', async () => {
    await decision().selectOption('accept_assessment')
    await saveReview('The fictional signed note supports this requirement for this evidence version.')
    const record = await download()
    assert.equal(record.schemaVersion, 'trace-public-demo-v1')
    assert.equal(record.realDecisionEligible, false)
    assert.equal(record.benchmarkEligible, false)
    assert.equal(record.provenance.providerCalls, 0)
    assert.equal(record.snapshots.length, 2)
    for (const entry of record.snapshots) {
      assert.equal(hash(canonical(entry.snapshot)), entry.snapshotHash)
      for (const source of entry.snapshot.sources) assert.equal(hash(source.content), source.byteHash)
    }
    const [original, revised] = record.snapshots.map(entry => entry.snapshot)
    assert.equal(original.policy.result, 'unknown')
    assert.equal(revised.policy.result, 'satisfied')
    assert.equal(original.lane, 'U')
    assert.equal(revised.lane, original.lane)
    assert.deepEqual(revised.rule, original.rule)
    assert.deepEqual(revised.sources.find(source => source.id === original.rule.sourceId), original.sources.find(source => source.id === original.rule.sourceId))
    assert.equal(revised.version, 2)
    assert.equal(revised.previousSnapshotId, original.id)
    assert.equal(record.selectedSnapshotId, revised.id)
    assert.equal(record.simulatedReviews.length, 1)
    assert.equal(record.simulatedReviews[0].snapshotHash, record.snapshots[1].snapshotHash)
    assert.equal(record.simulatedReviews[0].authenticated, false)
    assert.equal(record.simulatedReviews[0].rationale, 'The fictional signed note supports this requirement for this evidence version.')
    await writeFile(`${output}/reviewed-record.json`, JSON.stringify(record, null, 2))
  })
  await check('Reset clears the practice record and unsaved text', async () => {
    await rationale().fill('Unsaved fictional review text that must not survive reset.')
    await reset()
    assert.equal(await rationale().inputValue(), '')
    assert.match(await result().innerText(), /More evidence needed/)
    assert.equal(await page.getByRole('button', { name: /^Version 2/ }).count(), 0)
    assert.ok(!(await reviews().innerText()).includes('The fictional signed note supports'))
  })
  for (const [scenario, expected] of [
    ['missing', /More evidence needed/], ['satisfied', /Evidence supports this requirement/],
    ['failed', /Requirement not met in this record/], ['excluded', /Does not apply to this decision/],
    ['conflict', /Conflicting rules need review/], ['unknown_date', /More evidence needed/],
    ['timeout', /Evidence supports this requirement/], ['invalid_model', /Evidence supports this requirement/],
  ]) {
    await check(`Scenario ${scenario} renders its own policy result`, async () => {
      await select(scenario)
      assert.match(await result().innerText(), expected)
      if (['timeout', 'invalid_model'].includes(scenario)) {
        assert.match(await page.locator('main').innerText(), /unavailable|timed out|invalid response/i)
      }
      if (scenario === 'unknown_date') assert.match(await page.getByTestId('policy-reason').innerText(), /effective|date|applicab/i)
    })
  }
  await check('Human override requires explicit fictional authority and preserves the failed policy', async () => {
    await select('failed')
    const original = await result().innerText()
    await decision().selectOption('override_assessment')
    await rationale().fill('This fictional exception records a separate human action and keeps the failed requirement visible.')
    await page.getByRole('button', { name: 'Record practice review', exact: true }).click()
    assert.ok(!(await reviews().innerText()).includes('This fictional exception records'))
    await page.getByRole('checkbox', { name: 'I am using the fictional exception authority.', exact: true }).check()
    await page.getByRole('button', { name: 'Record practice review', exact: true }).click()
    await reviews().getByText('This fictional exception records a separate human action and keeps the failed requirement visible.', { exact: true }).waitFor()
    assert.equal(await result().innerText(), original)
    const record = await download()
    assert.equal(record.snapshots[0].snapshot.policy.result, 'not_satisfied')
    assert.equal(record.simulatedReviews[0].originalPolicyResult, 'not_satisfied')
    assert.equal(record.simulatedReviews[0].action, 'override_assessment')
    assert.equal(record.simulatedReviews[0].fictionalExceptionAuthority, true)
    assert.equal(hash(canonical(record.snapshots[0].snapshot)), record.snapshots[0].snapshotHash)
  })
  await check('New tabs and page reloads do not inherit practice reviews or drafts', async () => {
    await rationale().fill('Fictional unsaved text in the original tab.')
    const other = await context.newPage()
    await other.goto(`${base.replace(/\/$/, '')}/demo`)
    await other.getByLabel('Choose a scenario', { exact: true }).waitFor()
    assert.equal(await other.getByLabel('Choose a scenario', { exact: true }).inputValue(), 'missing')
    assert.equal(await other.getByLabel('Reason for this practice decision', { exact: true }).inputValue(), '')
    assert.ok(!(await other.getByTestId('practice-reviews').innerText()).includes('This fictional exception records'))
    await other.close()
    await page.reload()
    await page.getByLabel('Choose a scenario', { exact: true }).waitFor()
    assert.equal(await page.getByLabel('Choose a scenario', { exact: true }).inputValue(), 'missing')
    assert.equal(await rationale().inputValue(), '')
    assert.ok(!(await reviews().innerText()).includes('This fictional exception records'))
  })
  await check('Desktop and narrow layouts keep provenance and controls within the viewport', async () => {
    await select('conflict')
    const disclosure = page.locator('details > summary').first()
    await disclosure.focus()
    const wasOpen = await disclosure.evaluate(element => element.parentElement.open)
    await page.keyboard.press('Enter')
    assert.equal(await disclosure.evaluate(element => element.parentElement.open), !wasOpen)
    await page.locator('details > summary').evaluateAll(summaries => summaries.forEach(summary => { summary.parentElement.open = true }))
    await page.screenshot({ path: `${output}/desktop.png`, fullPage: true })
    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 850 })
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `horizontal overflow at ${width}px`)
      await page.getByRole('button', { name: 'Record practice review', exact: true }).scrollIntoViewIfNeeded()
      await page.screenshot({ path: `${output}/mobile-${width}.png`, fullPage: true })
    }
  })
  await check('No browser errors or private Trace/HQ API requests occurred', async () => {
    assert.deepEqual(errors, [])
    assert.deepEqual(consoleErrors, [])
    assert.deepEqual(forbiddenRequests, [])
  })
  await writeFile(`${output}/report.json`, JSON.stringify({ status: 'passed', checkedAt: new Date().toISOString(), base, localTelemetryStub, checks, browserErrors: errors, consoleErrors, forbiddenRequests, limitations: ['Public fictional simulation only; this does not verify authenticated persistence, official rules or customer intake.'] }, null, 2))
  console.log(`Passed ${checks.length} public demo browser checks; screenshots and report: ${output}`)
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true })
  await writeFile(`${output}/report.json`, JSON.stringify({ status: 'failed', checkedAt: new Date().toISOString(), base, localTelemetryStub, checks, browserErrors: errors, consoleErrors, forbiddenRequests, error: String(error) }, null, 2))
  throw error
} finally { await browser.close() }
