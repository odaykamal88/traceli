// Exercises WorkOS membership verification plus tender access grants in a disposable loopback DB.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import pg from 'pg'
import { mock, test } from 'node:test'
import { getDatabasePool } from '../../lib/db/client.ts'

const databaseUrl = process.env.DATABASE_URL
let parsedUrl
try { parsedUrl = new URL(databaseUrl || 'invalid:') } catch { parsedUrl = new URL('invalid:') }
if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol)
  || !['127.0.0.1', 'localhost', '[::1]'].includes(parsedUrl.hostname)
  || parsedUrl.search || parsedUrl.hash
  || process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  throw new Error('Tender access integration tests require an isolated nonproduction loopback PostgreSQL database.')
}

const run = randomUUID().replaceAll('-', '')
const org = `org_tender_access_${run}`
const memberships = []
const workosCalls = []
mock.module('@workos-inc/authkit-nextjs', {
  namedExports: {
    getWorkOS: () => ({
      userManagement: {
        listOrganizationMemberships: async input => {
          workosCalls.push(input)
          return { data: structuredClone(memberships) }
        },
      },
    }),
  },
})
const { TenderError } = await import('../../lib/tenders/contract.ts')
const { createTender, grantTenderAccess, readTender, revokeTenderAccess } = await import('../../lib/tenders/store.ts')

function idempotencyKey(label) { return `${label}-${randomUUID()}` }
function member(userId, organizationId, status = 'active', slug = 'panel-member') {
  return { userId, organizationId, status, role: { slug }, roles: [] }
}
function expectCode(code, status) {
  return error => error instanceof TenderError && error.code === code && error.status === status
}

test('tender grants require exactly one active same-organization WorkOS role and revoke live access', async () => {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 3 })
  try {
    const director = { id: `access-director-${run}`, name: 'Fictional director', email: 'director@example.invalid', organizationId: org, role: 'Procurement Director', mode: 'demo' }
    const targetId = `access-panel-${run}`
    await pool.query('insert into organizations(id,name) values($1,$2)', [org, 'Disposable fictional tender access fixtures'])
    const created = await createTender(director, { title: 'Tender access fixture', primaryPackId: 'global-fund', idempotencyKey: idempotencyKey('create') })
    const tenderId = created.tender.id

    memberships.splice(0, memberships.length,
      member(targetId, org, 'inactive'),
      member(targetId, org, 'active', 'panel-member'))
    const granted = await grantTenderAccess(director, tenderId, { userId: targetId, access: 'review', idempotencyKey: idempotencyKey('grant') })
    assert.deepEqual(granted, { userId: targetId, access: 'review' })
    assert.equal(workosCalls.at(-1).userId, targetId)
    assert.equal(workosCalls.at(-1).organizationId, org)
    assert.deepEqual(workosCalls.at(-1).statuses, ['active'])
    const panel = { ...director, id: targetId, role: 'Panel Member' }
    assert.equal((await readTender(panel, tenderId)).capabilities.canEdit, true)
    assert.equal((await readTender(panel, tenderId)).capabilities.canAssess, false)

    memberships.splice(0, memberships.length, member(targetId, org, 'inactive'))
    await assert.rejects(grantTenderAccess(director, tenderId, { userId: targetId, access: 'review', idempotencyKey: idempotencyKey('grant-altered') }), expectCode('invalid_grantee', 400))
    memberships.splice(0, memberships.length,
      member(targetId, org), member(targetId, org))
    await assert.rejects(grantTenderAccess(director, tenderId, { userId: targetId, access: 'review', idempotencyKey: idempotencyKey('grant-ambiguous') }), expectCode('invalid_grantee', 400))
    memberships.splice(0, memberships.length, member(targetId, `org_wrong_${run}`))
    await assert.rejects(grantTenderAccess(director, tenderId, { userId: targetId, access: 'review', idempotencyKey: idempotencyKey('grant-wrong-org') }), expectCode('invalid_grantee', 400))
    memberships.splice(0, memberships.length, member(targetId, org, 'active', 'supplier'))
    await assert.rejects(grantTenderAccess(director, tenderId, { userId: targetId, access: 'review', idempotencyKey: idempotencyKey('grant-wrong-role') }), expectCode('invalid_grantee', 400))
    assert.equal((await readTender(panel, tenderId)).capabilities.canEdit, true)

    const revoked = await revokeTenderAccess(director, tenderId, { userId: targetId, idempotencyKey: idempotencyKey('revoke') })
    assert.deepEqual(revoked, { userId: targetId, revoked: true })
    await assert.rejects(readTender(panel, tenderId), expectCode('unavailable', 404))
    console.log('PASS mocked WorkOS target membership, grant role, and revocation boundaries')
  } finally {
    await pool.end()
    await getDatabasePool().end()
  }
})
