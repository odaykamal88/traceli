import assert from 'node:assert/strict'
import { test } from 'node:test'
import { retentionJobScope } from '../../lib/tenders/retention-job.ts'
const secret = 'fictional-expiry-secret-01234567890123456789'
const request = (authorization) => new Request('https://example.invalid/api/cron/tender-retention?organizationId=org_attacker', { headers: authorization ? { authorization } : {} })
test('expiry job denies absent/short/mismatched secrets before reading tenant configuration', () => {
  for (const env of [{}, { CRON_SECRET: 'short' }, { CRON_SECRET: secret }]) assert.equal(retentionJobScope(request(), env), null)
  assert.equal(retentionJobScope(request(`Bearer ${secret}x`), { CRON_SECRET: secret }), null)
  assert.equal(retentionJobScope(request(`Bearer ${secret.replace('0','1')}`), { CRON_SECRET: secret }), null)
})
test('expiry scope comes only from valid deployment tenants and works with rollout off', () => {
  const env = { CRON_SECRET: secret, TRACELI_TENDER_ORGANIZATIONS: 'org_one,org_two,org_one', TRACELI_TENDER_WORKSPACES: '0' }
  assert.deepEqual(retentionJobScope(request(`Bearer ${secret}`), env), ['org_one','org_two'])
  for (const scope of ['', 'org_good,bad', Array.from({length:51},(_,i)=>`org_${i}`).join(',')]) assert.throws(()=>retentionJobScope(request(`Bearer ${secret}`), {...env,TRACELI_TENDER_ORGANIZATIONS:scope}))
})
