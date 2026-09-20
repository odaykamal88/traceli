import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.TRACE_TEST_URL || 'http://127.0.0.1:3044'
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname)) throw Error('Browser tests require loopback synthetic mode.')
const output = resolve(process.env.TRACE_BROWSER_OUTPUT || '/private/tmp/trace-browser')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) })
const context = await browser.newContext({ viewport: { width: 1360, height: 960 }, acceptDownloads: true })
const page = await context.newPage()
const errors = [], checks = []
page.on('pageerror', error => errors.push(error.message))
const check = (name, fn) => Promise.resolve().then(fn).then(() => checks.push({ name, status: 'passed' }))
async function waitReady() { await page.getByRole('button', { name: 'Start Trace', exact: true }).waitFor(); await page.waitForFunction(() => !document.querySelector('button')?.disabled && !document.querySelector('#scenario')?.disabled) }
async function start(scenario) {
  await page.getByLabel('Fictional packet').selectOption(scenario)
  await page.getByRole('button', { name: 'Start Trace', exact: true }).click()
  await page.getByText('Synthetic evidence frozen and checks recorded.', { exact: false }).waitFor()
}
async function current() { return page.evaluate(async () => (await (await fetch('/api/trace')).json())[0]) }
async function api(operation, input) { return page.evaluate(async ({ operation, input }) => {
  const response = await fetch('/api/trace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ operation, input }) })
  return { status: response.status, payload: await response.json() }
}, { operation, input }) }
async function decision(rationale) {
  await page.getByLabel('Reason for your decision').fill(rationale)
  await page.getByRole('button', { name: 'Save human decision', exact: true }).click()
  await page.getByText('Human decision saved against this exact evidence and policy version.', { exact: true }).waitFor()
}
async function download() {
  await page.getByRole('button', { name: 'Prepare export', exact: true }).click()
  const link = page.getByRole('link', { name: 'Download JSON pack', exact: true })
  await link.waitFor()
  const url = await link.getAttribute('href')
  const pending = page.waitForEvent('download')
  await link.click()
  const file = await pending
  const path = await file.path()
  return { value: JSON.parse(await readFile(path, 'utf8')), url }
}
function canonical(value) { return Array.isArray(value) ? `[${value.map(canonical).join(',')}]` : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` : JSON.stringify(value) }
const hash = value => createHash('sha256').update(value).digest('hex')
try {
  await page.goto(`${base}/workspace/trace`)
  await waitReady()
  await check('Keyboard skip link reaches main; fixture controls render without error overlay', async () => {
    await page.keyboard.press('Tab')
    assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Skip to main content')
    await page.keyboard.press('Enter')
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'trace-main')
    assert.equal(await page.locator('[data-nextjs-dialog]').count(), 0)
  })
  await check('Missing evidence remains unknown with useful next action and source disclosure', async () => {
    await start('missing')
    await page.getByRole('heading', { name: 'More evidence needed', exact: true }).waitFor()
    const r = await current()
    assert.equal(r.unit.policyAssessment.result, 'unknown')
    assert.equal(r.unit.policyAssessment.proposedDisposition, 'needs_evidence')
    await page.getByText('View evidence and reasoning', { exact: true }).click()
    const source = page.locator('details').filter({ has: page.locator('a', { hasText: 'Open source record' }) }).last()
    await source.locator('summary').click()
    assert.ok((await source.innerText()).includes('Effective date'))
    const sourceUrl = await source.getByRole('link', { name: 'Open source record' }).getAttribute('href')
    const response = await context.request.get(`${base}${sourceUrl}`)
    assert.equal(response.status(), 200)
    const bytes = await response.json(); assert.equal(hash(bytes.content), bytes.byteHash)
  })
  let previous
  await check('Evidence revision preserves original U rule context and immutable history', async () => {
    previous = await current()
    await page.getByRole('button', { name: 'Add fictional signed note', exact: true }).click()
    await page.getByText('New evidence version saved.', { exact: false }).waitFor()
    const r = await current()
    assert.equal(r.unit.lane, previous.unit.lane)
    assert.deepEqual(r.unit.obligation, previous.unit.obligation)
    assert.equal(r.unit.version, 2)
    assert.equal(r.unit.previousUnitId, previous.unit.id)
    assert.equal(r.unit.policyAssessment.result, 'satisfied')
    await page.getByRole('heading', { name: 'Evidence supports this requirement', exact: true }).waitFor()
    assert.equal(r.decisionSequence, 0)
  })
  await check('Human decision persists with rationale and exact version', async () => {
    await page.getByLabel('Decision', { exact: true }).selectOption('accept_assessment')
    await decision('BROWSER_PRIVATE_RATIONALE: The supplied fictional signed note supports this scoped requirement.')
    const r = await current()
    assert.equal(r.decisionSequence, 1)
    assert.equal(r.decisions[0].unitHash, r.artifactHash)
  })
  await check('Redacted and full downloads verify hashes; revocation denies future downloads', async () => {
    const redacted = await download()
    assert.equal(hash(canonical(redacted.value.payload)), redacted.value.payloadHash)
    assert.ok(!JSON.stringify(redacted.value).includes('BROWSER_PRIVATE_RATIONALE'))
    assert.ok(!JSON.stringify(redacted.value).includes('fixture-reviewer'))
    await page.getByRole('button', { name: 'Revoke download', exact: true }).click()
    await page.getByText('Future downloads revoked.', { exact: false }).waitFor()
    assert.equal((await context.request.get(`${base}${redacted.url}`)).status(), 403)
    await page.getByLabel('Included information').selectOption('full')
    const full = await download()
    assert.equal(hash(canonical(full.value.payload)), full.value.payloadHash)
    assert.ok(JSON.stringify(full.value).includes('BROWSER_PRIVATE_RATIONALE'))
    assert.ok(full.value.payload.unit.sourceVersions.every(source => hash(source.content) === source.byteHash))
  })
  await check('Concurrent review returns visible conflict and preserves unsaved rationale', async () => {
    const draft = 'Preserved browser draft while another review changes this exact record.'
    await page.getByLabel('Reason for your decision').fill(draft)
    const r = await current()
    const saved = await api('decide', { unitId: r.unit.id, expectedUnitHash: r.artifactHash, expectedInputHash: r.unit.inputHash,
      expectedPolicyHash: r.unit.policyAssessment.hash, expectedSequence: r.decisionSequence, action: 'request_evidence',
      rationale: 'Concurrent synthetic reviewer requested an additional record for this fixture.', citedEvidenceIds: [], authorityRef: null, idempotencyKey: crypto.randomUUID() })
    assert.equal(saved.status, 200)
    await page.getByRole('button', { name: 'Save human decision', exact: true }).click()
    const conflict = page.getByRole('alert').filter({ hasText: 'This record changed' })
    await conflict.waitFor()
    assert.match(await conflict.innerText(), /record changed/)
    assert.equal(await page.getByLabel('Reason for your decision').inputValue(), draft)
    await page.getByRole('button', { name: 'Reload latest record', exact: true }).click()
    await page.waitForFunction(() => !document.querySelector('#rationale').disabled)
    assert.equal(await page.getByLabel('Reason for your decision').inputValue(), draft)
  })
  await check('Mandatory failure stays visible with high mock confidence; override preserves it', async () => {
    await start('failed')
    await page.getByRole('heading', { name: 'Requirement not met in this record', exact: true }).waitFor()
    assert.ok((await current()).unit.evaluation.distribution.supports > .9)
    await page.getByLabel('Decision', { exact: true }).selectOption('override_assessment')
    await page.getByRole('checkbox').check()
    await decision('Fixture exception review: retain the adverse policy finding and apply the cited fictional authority.')
    const r = await current(); assert.equal(r.decisions[0].action, 'override_assessment'); assert.equal(r.decisions[0].originalOutcome, 'not_satisfied')
    await page.getByRole('heading', { name: 'Requirement not met in this record', exact: true }).waitFor()
  })
  for (const [scenario, result, disposition] of [['conflict', 'conflict', 'needs_rule_review'], ['excluded', 'not_applicable', 'ready_for_review'],
    ['unknown_date', 'unknown', 'needs_rule_review'], ['timeout', 'satisfied', 'cannot_evaluate'], ['invalid_model', 'satisfied', 'cannot_evaluate']]) {
    await check(`Scenario ${scenario}: separate evidence and processing state`, async () => {
      await start(scenario)
      const r = await current(); assert.equal(r.unit.policyAssessment.result, result); assert.equal(r.unit.policyAssessment.proposedDisposition, disposition)
      if (['timeout', 'invalid_model'].includes(scenario)) await page.getByRole('heading', { name: 'Model assessment unavailable', exact: true }).waitFor()
    })
  }
  await check('Desktop and 320/375px layouts keep open provenance readable, keyboard disclosures work', async () => {
    await start('conflict')
    await page.getByText('View evidence and reasoning', { exact: true }).click()
    const technical = page.getByText('View version and integrity details', { exact: true })
    await technical.focus(); await page.keyboard.press('Enter')
    assert.equal(await technical.evaluate(el => el.parentElement.open), true)
    await page.screenshot({ path: `${output}/desktop.png`, fullPage: true })
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 850 })
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `horizontal overflow at ${width}`)
      await page.getByRole('button', { name: 'Save human decision', exact: true }).scrollIntoViewIfNeeded()
      await page.screenshot({ path: `${output}/mobile-${width}.png`, fullPage: true })
    }
  })
  await check('Unknown direct source and cross-origin mutation disclose no record', async () => {
    const r = await current()
    const missing = await context.request.get(`${base}/api/trace?unitId=${r.unit.id}&sourceId=not-a-source`)
    assert.equal(missing.status(), 404)
    assert.ok(!(await missing.text()).includes('content'))
    const denied = await context.request.post(`${base}/api/trace`, { headers: { origin: 'https://foreign.invalid' }, data: { operation: 'create', input: { scenario: 'missing', idempotencyKey: crypto.randomUUID() } } })
    assert.equal(denied.status(), 403)
  })
  await check('Lost create response retries the same command without a duplicate unit', async () => {
    const before = await page.evaluate(async () => (await (await fetch('/api/trace')).json()).length)
    let dropped = false
    const interceptor = async route => {
      if (!dropped && route.request().method() === 'POST' && route.request().postDataJSON()?.operation === 'create') {
        dropped = true
        const response = await route.fetch()
        assert.equal(response.status(), 200)
        await route.abort('failed')
      } else await route.continue()
    }
    await page.route('**/api/trace', interceptor)
    await page.getByLabel('Fictional packet').selectOption('missing')
    await page.getByRole('button', { name: 'Start Trace', exact: true }).click()
    await page.getByRole('alert').filter({ hasText: 'Connection interrupted' }).waitFor()
    await page.unroute('**/api/trace', interceptor)
    await page.getByRole('button', { name: 'Start Trace', exact: true }).click()
    await page.getByText('Synthetic evidence frozen and checks recorded.', { exact: false }).waitFor()
    assert.equal(await page.evaluate(async () => (await (await fetch('/api/trace')).json()).length), before + 1)
  })
  assert.deepEqual(errors, [])
  await writeFile(`${output}/report.json`, JSON.stringify({ status: 'passed', checkedAt: new Date().toISOString(), base, checks, browserErrors: errors, limitations: ['Synthetic local identities and fixtures only; no human comprehension study or production/WorkOS browser session.'] }, null, 2))
  console.log(`Passed ${checks.length} complete browser checks; screenshots and report: ${output}`)
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true })
  await writeFile(`${output}/report.json`, JSON.stringify({ status: 'failed', checks, browserErrors: errors, error: String(error) }, null, 2))
  throw error
} finally { await browser.close() }
