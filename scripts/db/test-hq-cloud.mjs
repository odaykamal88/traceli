import assert from 'node:assert/strict'
import { randomUUID, createHash } from 'node:crypto'
import pg from 'pg'
import { runOnce } from '../../workers/hq/worker.mjs'

const address = new URL(process.env.HQ_TEST_DATABASE_URL || 'postgresql://postgres@127.0.0.1:55439/traceli_hq_test')
if (address.hostname !== '127.0.0.1' || address.pathname !== '/traceli_hq_test' || address.search || !address.port) throw new Error('Only isolated local HQ fixtures are permitted')
const admin = new pg.Client({ connectionString: address.toString() }); await admin.connect()
// Reproduce the managed Postgres owner boundary: SECURITY DEFINER is not a
// superuser escape hatch. Existing forced tenant policies must still pass.
await admin.query(`DO $$ BEGIN IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='hq_cloud_fixture_owner') THEN
  CREATE ROLE hq_cloud_fixture_owner NOLOGIN INHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB;
END IF; END $$;
GRANT traceli_hq_supervisor,traceli_hq_librarian TO hq_cloud_fixture_owner WITH INHERIT TRUE;
GRANT USAGE,CREATE ON SCHEMA public TO hq_cloud_fixture_owner;
GRANT ALL ON hq_cloud_bindings,hq_cloud_policies,hq_cloud_artifacts,hq_cloud_charges,hq_jobs,hq_runs,hq_scopes,hq_events TO hq_cloud_fixture_owner;`)
for (const signature of ['hq_cloud_identity(text)', 'hq_cloud_claim()', 'hq_cloud_reserve(text,text)', 'hq_cloud_submit(text,text,jsonb,jsonb)', 'hq_cloud_snapshot()']) await admin.query('ALTER FUNCTION ' + signature + ' OWNER TO hq_cloud_fixture_owner')
const clients = []; const passed = []; const suffix = randomUUID().replaceAll('-', '').slice(0, 10)
const inputs = [{ ref: 'fixture:approved', text: 'Fictional HQ snapshot. No real buyer evidence or live worker result.' }]
const draft = { summary: 'Fictional draft for review', observations: [{ statement: 'No live result is established.', source_refs: ['fixture:approved'] }], questions: [] }
const usage = { input_tokens: 1000, output_tokens: 100, response_id: 'fixture_response' }

async function login(name, role) {
  const u = new URL(address); u.username = name; u.password = ''
  const c = new pg.Client({ connectionString: u.toString() }); await c.connect(); clients.push(c); await c.query('SET ROLE ' + role); return c
}
async function fixture(label) {
  const org = `org_cloud_${suffix}_${label}`, runner = `hq_run_${suffix}_${label}`, reader = `hq_read_${suffix}_${label}`
  await admin.query('INSERT INTO organizations(id,name) VALUES($1,$2)', [org, 'Fictional cloud boundary test'])
  await admin.query("INSERT INTO hq_scopes(organization_id,id,kind,mandate_id,name) VALUES($1,'institutional-memory','mandate','institutional-memory','Fictional memory')", [org])
  for (const [name, kind, role] of [[runner, 'runner', 'traceli_hq_cloud_runner'], [reader, 'reader', 'traceli_hq_cloud_reader']]) {
    await admin.query(`CREATE ROLE ${name} LOGIN NOINHERIT NOSUPERUSER NOCREATEROLE NOCREATEDB NOBYPASSRLS`)
    await admin.query(`GRANT ${role} TO ${name} WITH INHERIT FALSE`)
    await admin.query('INSERT INTO hq_cloud_bindings(login_name,kind,organization_id,actor_id,enabled) VALUES($1::text::name,$2,$3,$1::text,true)', [name, kind, org])
  }
  await admin.query("INSERT INTO hq_cloud_policies(login_name,enabled,funding_reference,monthly_limit_microusd,pricing_valid_until,inputs) VALUES($1,true,'fixture:no-paid-calls',100000,clock_timestamp()+interval '1 day',$2)", [runner, JSON.stringify(inputs)])
  return { org, runner, reader, worker: await login(runner, 'traceli_hq_cloud_runner'), competitor: await login(runner, 'traceli_hq_cloud_runner'), viewer: await login(reader, 'traceli_hq_cloud_reader') }
}
const claim = async c => (await c.query('SELECT hq_cloud_claim() AS value')).rows[0].value
const snapshot = async c => (await c.query('SELECT hq_cloud_snapshot() AS value')).rows[0].value
const reserve = (f, c) => f.worker.query('SELECT hq_cloud_reserve($1,$2)', [c.run_id, c.lease_token])
const submit = (f, c, body = draft) => f.worker.query('SELECT hq_cloud_submit($1,$2,$3,$4) AS value', [c.run_id, c.lease_token, JSON.stringify(body), JSON.stringify(usage)])
try {
  const a = await fixture('a'), b = await fixture('b')
  assert.equal((await a.worker.query('SELECT session_user')).rows[0].session_user, a.runner)
  for (const table of ['hq_jobs', 'hq_runs', 'hq_cloud_bindings', 'hq_cloud_policies', 'hq_cloud_artifacts', 'hq_cloud_charges', 'hq_memory_versions', 'procurements']) {
    await assert.rejects(a.worker.query('SELECT * FROM ' + table), /permission denied/)
    await assert.rejects(a.viewer.query('SELECT * FROM ' + table), /permission denied/)
  }
  for (const role of ['traceli_hq_worker', 'traceli_hq_supervisor', 'traceli_hq_librarian', 'traceli_app']) await assert.rejects(a.worker.query('SET ROLE ' + role), /permission denied/)
  await assert.rejects(a.viewer.query('SELECT hq_cloud_claim()'), /permission denied/)
  await assert.rejects(a.worker.query("SELECT hq_cloud_identity('runner')"), /permission denied/)
  await a.worker.query('RESET ROLE'); await assert.rejects(claim(a.worker), /permission denied/); await a.worker.query('SET ROLE traceli_hq_cloud_runner')
  passed.push('Real restricted LOGIN; no inherited/direct table access, broker escalation, customer data or reader mutations')

  await a.worker.query("SELECT set_config('app.organization_id',$1,false),set_config('app.hq_actor_id','spoof',false),set_config('app.hq_mandate_id','build',false)", [b.org])
  const claims = await Promise.all([claim(a.worker), claim(a.competitor)])
  assert.equal(claims.filter(Boolean).length, 1); const c = claims.find(Boolean)
  assert.equal((await admin.query('SELECT organization_id FROM hq_runs WHERE id=$1', [c.run_id])).rows[0].organization_id, a.org)
  assert.equal((await snapshot(b.viewer)).runs.length, 0)
  const safe = JSON.stringify(await snapshot(a.viewer)); assert.ok(!safe.includes(c.lease_token)); assert.ok(!safe.includes('inputs_context')); assert.ok(!safe.includes('login_name'))
  passed.push('Spoofed settings cannot change identity; concurrent claim deduplication; reader tenant isolation and token redaction')

  const reservations = await Promise.allSettled([reserve(a, c), a.competitor.query('SELECT hq_cloud_reserve($1,$2)', [c.run_id, c.lease_token])])
  assert.equal(reservations.filter(r => r.status === 'fulfilled').length, 1)
  await assert.rejects(submit(a, { ...c, lease_token: randomUUID() }), /lease/)
  await assert.rejects(submit(a, c, { ...draft, observations: [{ statement: 'unsupported', source_refs: ['unknown'] }] }), /Unapproved source/)
  const accepted = (await submit(a, c)).rows[0].value
  const artifact = (await admin.query('SELECT body::text AS bytes,content_hash FROM hq_cloud_artifacts WHERE run_id=$1', [c.run_id])).rows[0]
  assert.equal(artifact.content_hash, createHash('sha256').update(artifact.bytes).digest('hex')); assert.equal(accepted.artifactHash, artifact.content_hash)
  assert.equal((await snapshot(a.viewer)).runs[0].status, 'review'); assert.equal(await claim(a.worker), null)
  await assert.rejects(submit(a, c), /lease/)
  await assert.rejects(admin.query("UPDATE hq_cloud_artifacts SET body='{}' WHERE run_id=$1", [c.run_id]), /append-only/)
  assert.equal(Number((await admin.query('SELECT reserved_microusd FROM hq_cloud_charges WHERE run_id=$1', [c.run_id])).rows[0].reserved_microusd), 50000)
  passed.push('Reservation race and replay prevention; immutable DB-hashed artifact; atomic review submission; no self-acceptance; conservative charge retained')

  await admin.query('UPDATE hq_cloud_policies SET monthly_limit_microusd=50000 WHERE login_name=$1', [b.runner])
  const old = await claim(b.worker); await reserve(b, old)
  await admin.query("UPDATE hq_jobs SET lease_until=clock_timestamp()-interval '1 second' WHERE organization_id=$1 AND id=$2", [b.org, old.job_id])
  await assert.rejects(submit(b, old), /lease/)
  const next = await claim(b.worker); assert.notEqual(next.lease_token, old.lease_token)
  await assert.rejects(submit(b, old), /lease/); await assert.rejects(reserve(b, next), /budget exhausted/)
  assert.equal((await snapshot(b.viewer)).runs.find(r => r.id === old.run_id).cost_uncertain, true)
  await admin.query('UPDATE hq_cloud_policies SET monthly_limit_microusd=100000 WHERE login_name=$1', [b.runner]); await reserve(b, next)
  await admin.query('UPDATE hq_cloud_bindings SET enabled=false WHERE login_name=$1', [b.runner]); await assert.rejects(submit(b, next), /identity denied/)
  await admin.query('UPDATE hq_cloud_bindings SET enabled=true WHERE login_name=$1', [b.runner]); await admin.query('UPDATE hq_cloud_policies SET enabled=false WHERE login_name=$1', [b.runner]); await assert.rejects(submit(b, next), /paused/)
  await admin.query('UPDATE hq_cloud_policies SET enabled=true WHERE login_name=$1', [b.runner])
  await admin.query("UPDATE hq_jobs SET lease_until=clock_timestamp()-interval '1 second' WHERE organization_id=$1 AND id=$2", [b.org, next.job_id])
  assert.equal(await claim(b.worker), null)
  assert.equal((await admin.query('SELECT status FROM hq_jobs WHERE organization_id=$1 AND id=$2', [b.org, next.job_id])).rows[0].status, 'failed')
  passed.push('Expired/replaced leases fenced; unknown crash costs retained; monthly cap; revocation/pause; two-attempt stop')

  const d = await fixture('d')
  await admin.query('UPDATE hq_cloud_policies SET funding_reference=NULL WHERE login_name=$1', [d.runner]); assert.equal(await claim(d.worker), null)
  await admin.query("UPDATE hq_cloud_policies SET funding_reference='fixture',pricing_valid_until=clock_timestamp()-interval '1 second' WHERE login_name=$1", [d.runner]); assert.equal(await claim(d.worker), null)
  await admin.query(`ALTER ROLE ${d.runner} INHERIT`); await assert.rejects(claim(d.worker), /Unsafe cloud login/); await admin.query(`ALTER ROLE ${d.runner} NOINHERIT`)
  await admin.query(`GRANT traceli_hq_supervisor TO ${d.runner}`); await assert.rejects(claim(d.worker), /Unsafe cloud login/); await admin.query(`REVOKE traceli_hq_supervisor FROM ${d.runner}`)
  await admin.query("UPDATE hq_cloud_policies SET pricing_valid_until=clock_timestamp()+interval '1 day' WHERE login_name=$1", [d.runner])
  const dc = await claim(d.worker)
  await admin.query("UPDATE hq_runs SET started_at=clock_timestamp()-interval '5 minutes' WHERE organization_id=$1 AND id=$2", [d.org, dc.run_id]).catch(async () => {
    // Fixture-only administrative clock aging; production API cannot do this.
    await admin.query('ALTER TABLE hq_runs DISABLE TRIGGER hq_run_guard')
    try { await admin.query("UPDATE hq_runs SET started_at=clock_timestamp()-interval '5 minutes' WHERE organization_id=$1 AND id=$2", [d.org, dc.run_id]) } finally { await admin.query('ALTER TABLE hq_runs ENABLE TRIGGER hq_run_guard') }
  })
  await admin.query("UPDATE hq_jobs SET lease_until=clock_timestamp()-interval '1 second' WHERE organization_id=$1 AND id=$2", [d.org, dc.job_id]); assert.equal(await claim(d.worker), null)
  passed.push('Missing funding, stale pricing, unsafe memberships and cumulative elapsed-time cap fail closed')

  const e = await fixture('e')
  await admin.query('DELETE FROM hq_cloud_policies WHERE login_name=$1', [e.runner]); await admin.query('DELETE FROM hq_cloud_bindings WHERE login_name=$1', [e.runner])
  await assert.rejects(claim(e.worker), /identity denied/)
  const f = await fixture('f')
  await admin.query('UPDATE hq_cloud_policies SET monthly_limit_microusd=50000 WHERE login_name=$1', [f.runner])
  const first = await claim(f.worker); await reserve(f, first)
  await admin.query("UPDATE hq_cloud_charges SET period=(date_trunc('month',clock_timestamp() AT TIME ZONE 'UTC')-interval '1 month')::date WHERE run_id=$1", [first.run_id])
  await admin.query("UPDATE hq_jobs SET lease_until=clock_timestamp()-interval '1 second' WHERE organization_id=$1 AND id=$2", [f.org, first.job_id])
  const second = await claim(f.worker); await reserve(f, second)
  assert.equal((await snapshot(f.viewer)).workers[0].reserved_microusd, 50000)
  assert.equal(Number((await admin.query('SELECT sum(reserved_microusd) AS held FROM hq_cloud_charges WHERE login_name=$1', [f.runner])).rows[0].held), 100000)
  const g = await fixture('g')
  await admin.query("INSERT INTO hq_jobs(organization_id,id,mandate_id,objective,contract,approval_level,source_system,external_id) VALUES($1,'cloud-brief-'||to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYYMMDD'),'institutional-memory','Fictional D1 mirror','{}','Green','operating_room','fixture-task')", [g.org])
  await assert.rejects(claim(g.worker), /contract mismatch/)
  const h = await fixture('h')
  await admin.query("INSERT INTO hq_jobs(organization_id,id,mandate_id,objective,contract,approval_level) VALUES($1,'cloud-brief-'||to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYYMMDD'),'institutional-memory','Unapproved native job','{}','Green')", [h.org])
  await assert.rejects(claim(h.worker), /contract mismatch/)
  passed.push('Unknown LOGIN denied; UTC monthly rollover retains prior charges; Operating Room mirror cannot be dispatched')

  const i = await fixture('i'); let calls = 0
  const completed = await runOnce({ db: i.worker, apiKey: 'fixture-not-a-key', fetchImpl: async () => {
    calls++
    return Response.json({ id: 'fixture_provider_reply', status: 'completed', usage: { input_tokens: 1000, output_tokens: 100 }, output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(draft) }] }] })
  } })
  assert.equal(calls, 1); assert.equal(completed.status, 'review')
  const persisted = (await snapshot(i.viewer)).runs[0]
  assert.equal(persisted.content_hash, completed.artifact_hash); assert.deepEqual(persisted.draft, draft)
  assert.equal(persisted.estimated_microusd, 370)
  passed.push('Integrated fixed runner → restricted database → mocked provider → immutable draft → independent reader')

  console.log(JSON.stringify({ passed: passed.length, checks: passed, paid_calls: 0 }, null, 2))
} finally { await Promise.allSettled(clients.map(c => c.end())); await admin.end() }
