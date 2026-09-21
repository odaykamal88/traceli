import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.AWARD_DESK_TEST_URL || 'http://127.0.0.1:3046'
const target = new URL(base)
if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password) throw Error('Use an HTTP(S) origin without credentials.')
const output = resolve(process.env.AWARD_DESK_BROWSER_OUTPUT || '/tmp/award-desk-browser')
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
  const response = await page.goto(`${origin}/demo`)
  assert.equal(response.status(), 200)
  await check('Award desk is the /demo landing and names the reconstruction', async () => {
    await page.getByRole('heading', { name: 'Good morning, Leila.' }).waitFor()
    assert.match(await page.locator('main').innerText(), /Needs reconstruction/)
    assert.match(await page.locator('main').innerText(), /Public demo · Fictional data/)
    assert.equal(await page.getByRole('link', { name: 'How Trace reasons' }).count(), 1)
    assert.equal(await page.locator('[data-nextjs-dialog]').count(), 0)
    assert.doesNotMatch(await page.locator('main').innerText(), /SHA-256|classic vs interactive/i)
  })
  await check('Overnight prep and a named gap are visible before the human act', async () => {
    await page.getByRole('link', { name: 'Open award desk' }).click()
    await page.getByRole('heading', { name: 'Agent overnight prep' }).waitFor()
    assert.match(await page.getByTestId('agent-timeline').innerText(), /23:14/)
    assert.match(await page.locator('main').innerText(), /Human decision required/)
    assert.match(await page.locator('main').innerText(), /Ethiopia/)
  })
  await check('Recording a disposition lands on a shareable decision record', async () => {
    await page.getByRole('link', { name: 'Accept agent draft & request evidence' }).click()
    await page.getByRole('heading', { name: 'Record disposition' }).waitFor()
    await page.getByRole('button', { name: 'Confirm disposition' }).click()
    await page.getByRole('heading', { name: 'Decision record · RFP-2026-041' }).waitFor()
    assert.match(await page.getByTestId('recorded-reason').innerText(), /Ethiopia/)
    assert.match(await page.locator('main').innerText(), /Reconstruction in progress/)
    assert.ok(page.url().includes('/demo/rfp-2026-041/record'))
  })
  await check('/demo/classic redirects into Award desk and /method is not the landing', async () => {
    const classic = await page.goto(`${origin}/demo/classic`, { waitUntil: 'domcontentloaded' })
    assert.ok(classic)
    await page.getByRole('heading', { name: 'Good morning, Leila.' }).waitFor()
    const method = await page.goto(`${origin}/method`)
    assert.equal(method.status(), 200)
    await page.getByRole('heading', { name: 'Trace an award decision.' }).waitFor()
  })
  await check('Desktop and narrow layouts stay within the viewport', async () => {
    await page.goto(`${origin}/demo`)
    await page.screenshot({ path: `${output}/desk-desktop.png`, fullPage: true })
    await page.setViewportSize({ width: 375, height: 850 })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'horizontal overflow at 375px')
    await page.screenshot({ path: `${output}/desk-mobile.png`, fullPage: true })
  })
  await check('No browser errors or private Trace/HQ API requests occurred', async () => {
    assert.deepEqual(errors, [])
    assert.deepEqual(consoleErrors, [])
    assert.deepEqual(forbiddenRequests, [])
  })
  await writeFile(`${output}/report.json`, JSON.stringify({ status: 'passed', checkedAt: new Date().toISOString(), base, checks, limitations: ['Public fictional Award desk only; this does not verify authenticated persistence or customer intake.'] }, null, 2))
  console.log(`Passed ${checks.length} Award desk browser checks; screenshots and report: ${output}`)
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true })
  await writeFile(`${output}/report.json`, JSON.stringify({ status: 'failed', checkedAt: new Date().toISOString(), base, checks, browserErrors: errors, consoleErrors, forbiddenRequests, error: String(error) }, null, 2))
  throw error
} finally { await browser.close() }
