import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import test from 'node:test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const validator = resolve(root, 'scripts/validate-env.mjs')

// Deliberately do not inherit the caller's environment: secrets and local .env
// settings must not affect these validation cases.
const base = {
  NODE_ENV: 'production',
  VERCEL: '1',
  VERCEL_ENV: 'production',
  TRACELI_TRACE_MODE: 'workos',
  TRACELI_TENDER_WORKSPACES: '1',
  TRACELI_TENDER_ORGANIZATIONS: 'org_approved_alpha',
  TRACELI_TENDER_CUSTOMER_ORGANIZATIONS: 'org_approved_alpha',
  TRACELI_TENDER_CUSTOMER_RETENTION_DAYS: '30',
  TRACELI_TENDER_CUSTOMER_POLICY_VERSION: 'pilot-policy-v1',
  TRACELI_TENDER_CUSTOMER_PROVIDER_DISCLOSURE: 'Sanitized documents are sent to the approved extraction provider.',
  TRACE_EXTRACTION_PROVIDER: 'talonic',
  TRACE_TALONIC_API_KEY: 'fixture-only-not-a-real-secret',
  CRON_SECRET: 'fixture-cron-secret-that-is-longer-than-32-characters',
  WORKOS_CLIENT_ID: 'client_fixture',
  WORKOS_API_KEY: 'sk_fixture',
  WORKOS_COOKIE_PASSWORD: 'fixture-password-with-at-least-thirty-two-characters',
  NEXT_PUBLIC_WORKOS_REDIRECT_URI: 'https://example.test/callback',
  DATABASE_URL: 'postgresql://fixture:fixture@localhost:5432/traceli',
  DATABASE_URL_UNPOOLED: 'postgresql://fixture:fixture@localhost:5432/traceli',
}

function run(overrides = {}) {
  const env = { ...base }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null) delete env[key]
    else env[key] = value
  }
  const result = spawnSync(process.execPath, [validator], {
    cwd: root,
    env,
    encoding: 'utf8',
  })
  assert.equal(result.error, undefined, result.error?.message)
  return { status: result.status, stdout: result.stdout, stderr: result.stderr }
}

function rejects(overrides, message) {
  const result = run(overrides)
  assert.notEqual(result.status, 0, `expected validation failure; stdout: ${result.stdout}`)
  assert.match(result.stderr, message)
}

test('valid hosted tender workspace and customer policy configuration passes', () => {
  const result = run()
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Environment configuration valid/)
})

test('hosted workspace rollout requires an explicitly admitted organization', () => {
  rejects({ TRACELI_TENDER_ORGANIZATIONS: '' }, /explicitly admitted retention organizations/)
})

test('admitted cleanup organizations require database and a 32-character cron secret even with rollout off', () => {
  rejects({ TRACELI_TENDER_WORKSPACES: '0', CRON_SECRET: 'too-short' }, /Hosted tender retention requires a database and a CRON_SECRET/)
  rejects({ TRACELI_TENDER_WORKSPACES: '0', DATABASE_URL: null, DATABASE_URL_UNPOOLED: null }, /Hosted tender retention requires a database and a CRON_SECRET/)
})

test('admitted and customer organization lists reject malformed tenant IDs', () => {
  rejects({ TRACELI_TENDER_ORGANIZATIONS: 'org_approved_alpha,not-an-org' }, /TRACELI_TENDER_ORGANIZATIONS must contain/)
  rejects({ TRACELI_TENDER_CUSTOMER_ORGANIZATIONS: 'org_other_customer!' }, /TRACELI_TENDER_CUSTOMER_ORGANIZATIONS must contain/)
})

test('customer organizations must be a subset of admitted cleanup organizations', () => {
  rejects({ TRACELI_TENDER_CUSTOMER_ORGANIZATIONS: 'org_other_customer' }, /must also be admitted for retention cleanup/)
})

test('customer policy requires the approved 30-day retention period', () => {
  rejects({ TRACELI_TENDER_CUSTOMER_RETENTION_DAYS: '29' }, /approved 30-day policy/)
})

test('customer policy requires the Talonic extraction route', () => {
  rejects({ TRACE_EXTRACTION_PROVIDER: 'mock' }, /approved 30-day policy/)
})

test('customer policy requires a version and provider disclosure', () => {
  rejects({ TRACELI_TENDER_CUSTOMER_POLICY_VERSION: null }, /approved 30-day policy/)
  rejects({ TRACELI_TENDER_CUSTOMER_PROVIDER_DISCLOSURE: '  ' }, /approved 30-day policy/)
})
