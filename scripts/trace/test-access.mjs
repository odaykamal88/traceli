import assert from 'node:assert/strict'
import { after, beforeEach, mock, test } from 'node:test'
import { registerHooks } from 'node:module'
import { localTraceEnabled, traceRole } from '../../lib/trace/access-policy.ts'

const env = { ...process.env }
const actor = 'user_fixture', org = 'org_fixture'
let session, user, memberships, unavailable, host, calls, configured
registerHooks({ resolve(specifier, context, nextResolve) {
  return nextResolve(specifier === 'next/headers' ? 'next/headers.js' : specifier, context)
} })
mock.module('next/headers', { namedExports: { headers: async () => new Headers({ host }) } })
mock.module('@workos-inc/authkit-nextjs', { namedExports: {
  withAuth: async () => { calls++; return session },
  getWorkOS: () => ({ userManagement: {
    getUser: async () => { if (unavailable) throw Error('private diagnostic'); return user },
    listOrganizationMemberships: async () => ({ data: memberships }),
  } }),
} })
mock.module(new URL('../../lib/workspace-access.ts', import.meta.url).href, {
  namedExports: { isWorkOSConfigured: () => configured },
})
const { requireTraceViewer } = await import('../../lib/trace/access.ts')
const { readTraceCommand, traceHttpError } = await import('../../lib/trace/http.ts')

beforeEach(() => {
  process.env.TRACELI_TRACE_MODE = 'workos'; process.env.NODE_ENV = 'production'; delete process.env.VERCEL
  user = { id: actor, emailVerified: true, email: 'fixture@example.invalid', firstName: 'Fixture' }
  session = { user: { ...user }, organizationId: org, role: 'workspace-admin' }
  memberships = [{ userId: actor, organizationId: org, status: 'active', role: { slug: 'auditor' } }]
  unavailable = false; configured = true; calls = 0; host = '127.0.0.1:3044'
})
after(() => { process.env = env; mock.restoreAll() })

test('local identity is explicit, development-only and cannot target remote DB or connection overrides', () => {
  const base = { TRACELI_TRACE_MODE: 'local', NODE_ENV: 'development', DATABASE_URL: 'postgresql://fixture@127.0.0.1:55442/postgres' }
  assert.equal(localTraceEnabled(base), true)
  for (const change of [ { TRACELI_TRACE_MODE: undefined }, { NODE_ENV: 'production' }, { VERCEL: '1' },
    ...['postgresql://remote.invalid/db', 'postgresql://127.0.0.1.evil.invalid/db',
      'postgresql://127.0.0.1/db?host=remote.invalid', 'postgresql://127.0.0.1/db?service=remote',
      'https://127.0.0.1/db', 'postgresql://127.0.0.1@remote.invalid/db', 'broken'].map(DATABASE_URL => ({ DATABASE_URL })) ]) {
    assert.equal(localTraceEnabled({ ...base, ...change }), false, JSON.stringify(change))
  }
})
test('no session or unverified identity is denied', async () => {
  session.user = null; await assert.rejects(requireTraceViewer, /unavailable/)
  session.user = { ...user, emailVerified: false }; await assert.rejects(requireTraceViewer, /unavailable/)
})
test('session role cannot override removed membership or downgraded current role', async () => {
  assert.equal((await requireTraceViewer()).role, 'Auditor')
  memberships = []; await assert.rejects(requireTraceViewer, /unavailable/)
})
test('wrong tenant, wrong actor and inactive membership fail closed', async () => {
  for (const change of [{ organizationId: 'org_other' }, { userId: 'user_other' }, { status: 'inactive' }]) {
    memberships = [{ userId: actor, organizationId: org, status: 'active', role: { slug: 'workspace-admin' }, ...change }]
    await assert.rejects(requireTraceViewer, /unavailable/)
  }
})
test('ambiguous memberships and unknown roles cannot add privileges', () => {
  assert.equal(traceRole([...memberships, ...memberships], actor, org), null)
  memberships[0].role.slug = 'org-hq-owner'
  assert.equal(traceRole(memberships, actor, org), null)
})
test('impersonation, auth lookup outage and changed current subject deny', async () => {
  session.impersonator = {}; await assert.rejects(requireTraceViewer, /unavailable/)
  delete session.impersonator; unavailable = true; await assert.rejects(requireTraceViewer, /unavailable/)
  unavailable = false; user.id = 'other'; await assert.rejects(requireTraceViewer, /unavailable/)
})
test('each operation checks fresh membership', async () => {
  await requireTraceViewer(); memberships[0].role.slug = 'procurement-director'
  assert.equal((await requireTraceViewer()).role, 'Procurement Director')
  memberships[0].status = 'inactive'; await assert.rejects(requireTraceViewer, /unavailable/)
  assert.equal(calls, 3)
})
test('disabled or incomplete auth never resolves a session', async () => {
  configured = false; await assert.rejects(requireTraceViewer, /unavailable/)
  configured = true; process.env.TRACELI_TRACE_MODE = 'disabled'; await assert.rejects(requireTraceViewer, /unavailable/)
  assert.equal(calls, 0)
})
test('local identity rejects a non-loopback request host', async () => {
  process.env.TRACELI_TRACE_MODE = 'local'; process.env.NODE_ENV = 'development'
  process.env.DATABASE_URL = 'postgresql://fixture@127.0.0.1:55442/postgres'
  assert.equal((await requireTraceViewer()).organizationId, 'org_trace_local')
  host = 'remote.invalid'; await assert.rejects(requireTraceViewer, /unavailable/)
})
test('mutation parser rejects missing/cross origin and oversized streams', async () => {
  const req = (body, origin = 'http://127.0.0.1:3044') => new Request('http://127.0.0.1:3044/api/trace', {
    method: 'POST', body, headers: { origin, host: '127.0.0.1:3044', 'content-type': 'application/json' },
  })
  assert.deepEqual(await readTraceCommand(req('{"action":"fixture"}')), { action: 'fixture' })
  await assert.rejects(() => readTraceCommand(req('{}', 'https://other.invalid')))
  await assert.rejects(() => readTraceCommand(req('x'.repeat(8193))))
  await assert.rejects(() => readTraceCommand(req('{invalid')))
})
test('HTTP errors never expose arbitrary backend diagnostics', async () => {
  const response = traceHttpError(new Error('secret raw record'))
  assert.equal(response.status, 503)
  assert.ok(!(await response.text()).includes('secret'))
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0')
})
