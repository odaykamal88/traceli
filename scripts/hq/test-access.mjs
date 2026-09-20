import assert from 'node:assert/strict'
import { after, beforeEach, mock, test } from 'node:test'
import { spawnSync } from 'node:child_process'
import { registerHooks } from 'node:module'
import { hqAccessMode, hqBinding } from '../../lib/hq/access-policy.ts'

const owner = 'user_00000000000000000000000001'
const org = 'org_00000000000000000000000001'
const other = 'user_00000000000000000000000002'
const originalEnv = { ...process.env }
let session, user, membership, providerError, configured, calls, signInOptions
const denied = () => { throw new Error('not-found') }
const redirect = destination => { throw new Error('redirect:' + destination) }
// Next's bundler resolves this extensionless entry; match that resolution in Node.
registerHooks({ resolve(specifier, context, nextResolve) {
  return nextResolve(specifier === 'next/navigation' ? 'next/navigation.js' : specifier, context)
} })
mock.module('@workos-inc/authkit-nextjs', { namedExports: {
  withAuth: async () => { calls.push('session'); return session },
  getWorkOS: () => ({ userManagement: {
    getUser: async id => { calls.push('user:' + id); if (providerError) throw new Error('fixture outage'); return user },
    listOrganizationMemberships: async options => {
      assert.deepEqual(options, { userId: owner, organizationId: org, statuses: ['active'], limit: 100 })
      calls.push('membership'); return { data: membership ? [membership] : [] }
    },
  } }),
  getSignInUrl: async options => { signInOptions = options; return 'https://login.fixture.invalid' },
} })
mock.module('next/navigation', { namedExports: { notFound: denied, redirect } })
mock.module(new URL('../../lib/workspace-access.ts', import.meta.url).href, {
  namedExports: { isWorkOSConfigured: () => configured },
})
const { requireHQViewer } = await import('../../lib/hq/access.ts')
const { GET: signIn } = await import('../../app/hq/sign-in/route.ts')

beforeEach(() => {
  process.env.NODE_ENV = 'production'
  process.env.TRACELI_HQ_ACCESS = 'workos'
  process.env.TRACELI_HQ_OWNER_USER_ID = owner
  process.env.TRACELI_HQ_ORGANIZATION_ID = org
  delete process.env.VERCEL
  user = { id: owner, emailVerified: true }
  session = { user, organizationId: org }
  membership = { userId: owner, organizationId: org, status: 'active', role: { slug: 'org-hq-owner' } }
  providerError = false; configured = true; calls = []; signInOptions = null
})
after(() => { process.env = originalEnv; mock.restoreAll() })

test('production and hosted development never inherit local access', () => {
  for (const request of [undefined, 'local', 'disabled', 'typo']) {
    assert.equal(hqAccessMode({ NODE_ENV: 'production', TRACELI_HQ_ACCESS: request }), 'disabled')
    assert.equal(hqAccessMode({ NODE_ENV: 'development', VERCEL: '1', TRACELI_HQ_ACCESS: request }), 'disabled')
  }
  assert.equal(hqAccessMode({ NODE_ENV: 'development' }), 'local')
})
test('missing or malformed identity binding never calls identity provider', async () => {
  delete process.env.TRACELI_HQ_OWNER_USER_ID
  await assert.rejects(requireHQViewer, /not-found/)
  assert.deepEqual(calls, [])
  assert.equal(hqBinding({ TRACELI_HQ_OWNER_USER_ID: '*', TRACELI_HQ_ORGANIZATION_ID: org }), null)
})
test('missing WorkOS configuration fails closed before private reads', async () => {
  configured = false
  await assert.rejects(requireHQViewer, /not-found/)
  assert.deepEqual(calls, [])
})
test('signed-out viewer goes to fixed HQ sign-in route', async () => {
  session = { user: null }
  await assert.rejects(requireHQViewer, /redirect:\/hq\/sign-in/)
  assert.deepEqual(calls, ['session'])
})
test('a different user with an HQ role is denied', async () => {
  session.user = { id: other, emailVerified: true }; session.role = 'org-hq-owner'
  await assert.rejects(requireHQViewer, /not-found/)
  assert.deepEqual(calls, ['session'])
})
test('wrong organization and impersonated sessions are denied', async () => {
  session.organizationId = 'org_00000000000000000000000002'
  await assert.rejects(requireHQViewer, /not-found/)
  session.organizationId = org; session.impersonator = { email: 'fixture@example.invalid' }
  await assert.rejects(requireHQViewer, /not-found/)
  assert.ok(!calls.includes('membership'))
})
test('unverified email in either current user or session is denied', async () => {
  session.user = { ...user, emailVerified: false }
  await assert.rejects(requireHQViewer, /not-found/)
  session.user = { ...user }; user = { ...user, emailVerified: false }
  await assert.rejects(requireHQViewer, /not-found/)
})
test('procurement admin does not inherit HQ ownership', async () => {
  membership.role.slug = 'workspace-admin'; session.role = 'workspace-admin'
  await assert.rejects(requireHQViewer, /not-found/)
})
test('old owner claim cannot override removed membership, role or changed subject', async () => {
  session.role = 'org-hq-owner'
  membership.status = 'inactive'
  await assert.rejects(requireHQViewer, /not-found/)
  membership.status = 'pending'
  await assert.rejects(requireHQViewer, /not-found/)
  membership.status = 'active'; membership.role.slug = 'member'
  await assert.rejects(requireHQViewer, /not-found/)
  membership.role.slug = 'org-hq-owner'; membership.userId = other
  await assert.rejects(requireHQViewer, /not-found/)
  membership = null
  await assert.rejects(requireHQViewer, /not-found/)
})
test('provider failure denies access', async () => {
  providerError = true
  const log = mock.method(console, 'error', () => {})
  await assert.rejects(requireHQViewer, /not-found/)
  assert.equal(log.mock.callCount(), 1)
  log.mock.restore()
})
test('bound verified owner with current role gets only a read-view result', async () => {
  assert.deepEqual(await requireHQViewer(), { mode: 'workos' })
  membership.role.slug = 'member'; membership.roles = [{ slug: 'org-hq-owner' }]
  assert.deepEqual(await requireHQViewer(), { mode: 'workos' })
  assert.equal(calls.filter(x => x === 'membership').length, 2)
})
test('sign-in is fixed to the bound organization and returns to HQ', async () => {
  await assert.rejects(() => signIn(new Request('https://fixture.invalid/hq/sign-in?returnTo=https://evil.invalid&role=hq-owner')), /redirect:https:\/\/login.fixture.invalid/)
  assert.deepEqual(signInOptions, { organizationId: org, returnTo: '/hq' })
  process.env.TRACELI_HQ_ACCESS = 'disabled'
  await assert.rejects(signIn, /not-found/)
})
test('build preflight refuses incomplete auth and local mode in production', () => {
  const base = { PATH: process.env.PATH, NODE_ENV: 'production' }
  for (const mode of ['local', 'workos', 'typo']) {
    const result = spawnSync(process.execPath, ['scripts/validate-env.mjs'], { env: { ...base, TRACELI_HQ_ACCESS: mode }, encoding: 'utf8' })
    assert.notEqual(result.status, 0, mode)
  }
  assert.equal(spawnSync(process.execPath, ['scripts/validate-env.mjs'], { env: base }).status, 0)
})
