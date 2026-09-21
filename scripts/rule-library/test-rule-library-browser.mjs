import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.RULE_LIBRARY_TEST_URL || 'http://127.0.0.1:3047'
const target = new URL(base)
if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password) throw Error('Use an HTTP(S) origin without credentials.')
const output = resolve(process.env.RULE_LIBRARY_BROWSER_OUTPUT || '/tmp/rule-library-browser')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) })
const context = await browser.newContext({ viewport: { width: 1360, height: 960 } })
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
  await context.route(`${target.origin}/_vercel/insights/script.js`, route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* Hosted telemetry is unavailable on this loopback test server. */' }))
}
const page = await context.newPage()
page.setDefaultTimeout(15000)
const check = async (name, run) => { await run(); checks.push({ name, status: 'passed' }); console.log(`PASS ${name}`) }
try {
  const origin = base.replace(/\/$/, '')
  const response = await page.goto(`${origin}/workspace/library`)
  assert.equal(response.status(), 200)
  await check('Rule library switchboard is the workspace home and names packs in force', async () => {
    await page.getByRole('heading', { name: 'What is checking tonight?' }).waitFor()
    assert.match(await page.getByTestId('inforce-count').innerText(), /4 packs in force tonight/)
    assert.match(await page.getByTestId('rule-switchboard').innerText(), /Procurement manual/)
    assert.match(await page.getByTestId('rule-switchboard').innerText(), /Illustrative/)
    assert.doesNotMatch(await page.locator('main').innerText(), /In force\s*\|\s*Catalog\s*\|\s*Uploads/)
    assert.equal(await page.getByRole('link', { name: 'Rule library' }).count(), 1)
    assert.equal(await page.locator('[data-nextjs-dialog]').count(), 0)
  })
  await check('Add a pack opens catalog or upload, not peer tabs', async () => {
    await page.getByRole('button', { name: 'Add a pack' }).click()
    await page.getByRole('heading', { name: 'Add a pack' }).waitFor()
    await page.getByRole('button', { name: /From Trace catalog/ }).click()
    await page.getByRole('heading', { name: 'From Trace catalog' }).waitFor()
    assert.match(await page.locator('[aria-label="Add a pack"]').innerText(), /Global Fund/)
    await page.getByRole('button', { name: 'Add', exact: true }).first().click()
    await page.getByRole('button', { name: 'Close' }).click()
    assert.match(await page.getByTestId('inforce-count').innerText(), /5 packs in force tonight/)
  })
  await check('Award desk cites live in-force packs and freezes them on the record', async () => {
    await page.goto(`${origin}/demo/rfp-2026-041`)
    await page.getByRole('heading', { name: 'Agent overnight prep' }).waitFor()
    assert.match(await page.getByTestId('packs-in-force').innerText(), /Checked against 5 packs in force/)
    await page.getByRole('link', { name: 'Accept agent draft & request evidence' }).click()
    await page.getByRole('button', { name: 'Confirm disposition' }).click()
    await page.getByTestId('frozen-packs').waitFor()
    assert.match(await page.getByTestId('frozen-packs').innerText(), /Frozen at disposition/)
    assert.match(await page.getByTestId('frozen-packs').innerText(), /Global Fund/)
  })
  await check('Public /demo stays Award desk and is not a second library', async () => {
    await page.goto(`${origin}/demo`)
    await page.getByRole('heading', { name: 'Good morning, Leila.' }).waitFor()
    assert.doesNotMatch(await page.locator('main').innerText(), /What is checking tonight\?/)
    assert.match(await page.locator('main').innerText(), /Needs reconstruction/)
  })
  await check('Desktop and narrow library layouts stay within the viewport', async () => {
    await page.goto(`${origin}/workspace/library`)
    await page.getByRole('heading', { name: 'What is checking tonight?' }).waitFor()
    await page.screenshot({ path: `${output}/library-desktop.png`, fullPage: true })
    await page.setViewportSize({ width: 375, height: 850 })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'horizontal overflow at 375px')
    await page.screenshot({ path: `${output}/library-mobile.png`, fullPage: true })
  })
  await check('No browser errors or private Trace/HQ API requests occurred', async () => {
    assert.deepEqual(errors, [])
    assert.deepEqual(consoleErrors, [])
    assert.deepEqual(forbiddenRequests, [])
  })
  await writeFile(`${output}/report.json`, JSON.stringify({ status: 'passed', checkedAt: new Date().toISOString(), base, checks, limitations: ['Fictional workspace Rule library and Award desk wiring only; this does not verify authenticated persistence or customer intake.'] }, null, 2))
  console.log(`Passed ${checks.length} Rule library browser checks; screenshots and report: ${output}`)
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true })
  await writeFile(`${output}/report.json`, JSON.stringify({ status: 'failed', checkedAt: new Date().toISOString(), base, checks, browserErrors: errors, consoleErrors, forbiddenRequests, error: String(error) }, null, 2))
  throw error
} finally { await browser.close() }
