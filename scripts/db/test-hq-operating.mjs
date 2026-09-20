import assert from 'node:assert/strict'
import { randomUUID, createHash } from 'node:crypto'
import pg from 'pg'
import { runCycle, runOnce } from '../../workers/hq/worker.mjs'

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
  await admin.query('GRANT ALL ON hq_operating_ingestors,hq_operating_sources,hq_operating_checks TO hq_cloud_fixture_owner')
  for (const fn of ['hq_operating_ingest(jsonb)', 'hq_operating_tick()', 'hq_operating_snapshot()']) await admin.query('ALTER FUNCTION '+fn+' OWNER TO hq_cloud_fixture_owner')
  const f = await fixture('feed'), other = await fixture('other')
  const ingestor = 'hq_ingest_' + suffix
  await admin.query(`CREATE ROLE ${ingestor} LOGIN NOINHERIT NOSUPERUSER NOCREATEROLE NOCREATEDB NOBYPASSRLS`)
  await admin.query(`GRANT traceli_hq_source_ingestor TO ${ingestor} WITH INHERIT FALSE`)
  await admin.query("INSERT INTO hq_operating_ingestors VALUES($1,$2,true,'appgprj_6a94833e5918819180fb17a031f5711e')", [ingestor, f.org])
  const source = await login(ingestor, 'traceli_hq_source_ingestor')
  const packet = { schema_version: 1, source_id: 'appgprj_6a94833e5918819180fb17a031f5711e', captured_at: new Date().toISOString(), records: { tasks: [], metrics: [{ id:'fixture', label:'Fictional metric', current:0, target:1, sort_order:1 }], reviews: [], latest: [], receipt_count:0 } }
  const ingest = p => source.query('SELECT hq_operating_ingest($1) value',[JSON.stringify(p)]).then(r=>r.rows[0].value)
  const tick = () => f.worker.query('SELECT hq_operating_tick() value').then(r=>r.rows[0].value)
  const view = client => client.query('SELECT hq_operating_snapshot() value').then(r=>r.rows[0].value)
  assert.equal((await tick()).status, 'source_missing')
  for (const client of [source, f.worker, f.viewer]) for (const table of ['hq_operating_ingestors','hq_operating_sources','hq_operating_checks','procurements']) await assert.rejects(client.query('SELECT * FROM '+table), /permission denied/)
  await assert.rejects(source.query('SELECT hq_cloud_claim()'), /permission denied/)
  await assert.rejects(f.viewer.query('SELECT hq_operating_tick()'), /permission denied/)
  await source.query("SELECT set_config('app.organization_id',$1,false)",[other.org])
  assert.equal((await ingest(packet)).status,'changed')
  assert.equal((await view(other.viewer)).source,null)
  assert.equal((await ingest(packet)).status,'unchanged')
  await assert.rejects(ingest({...packet, records:{...packet.records, contacts:['private']}}), /Invalid minimized/)
  await assert.rejects(ingest({...packet, source_id:'other'}), /Invalid source/)
  await assert.rejects(ingest({...packet, captured_at:'2000-01-01T00:00:00Z'}), /Expired/)
  await assert.rejects(ingest({...packet, records:{...packet.records, receipt_count:1}}), /Conflicting capture/)
  assert.equal((await ingest({...packet, captured_at:new Date(Date.parse(packet.captured_at)-1000).toISOString()})).status,'older_packet_ignored')
  assert.equal((await tick()).model_eligible,true)
  assert.equal((await tick()).model_eligible,true) // Preparation without a claim can recover.
  await admin.query("UPDATE hq_operating_sources SET captured_at=clock_timestamp()-interval '25 hours' WHERE organization_id=$1",[f.org])
  assert.equal((await tick()).status,'source_stale')
  await ingest({...packet, captured_at:new Date().toISOString()})
  await admin.query('UPDATE hq_cloud_policies SET enabled=false WHERE login_name=$1',[f.runner])
  assert.equal((await tick()).status,'model_policy_paused')
  await admin.query('UPDATE hq_cloud_policies SET enabled=true,monthly_limit_microusd=0 WHERE login_name=$1',[f.runner])
  assert.equal((await tick()).status,'budget_exhausted')
  await admin.query('UPDATE hq_cloud_policies SET monthly_limit_microusd=100000 WHERE login_name=$1',[f.runner])
  let calls=0
  const result = await runCycle({db:f.worker, apiKey:'fictional', fetchImpl: async (url, opts) => {
    calls++; const input=JSON.parse(JSON.parse(opts.body).input)
    assert.ok(!JSON.stringify(input).includes('Fictional metric')) // labels excluded
    const ref=input.sources[0].ref
    const body={summary:'Fixture only',observations:[{statement:'No live evidence.',source_refs:[ref]}],questions:[]}
    return Response.json({id:'fixture_reply',status:'completed',usage:{input_tokens:1000,output_tokens:100},output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(body)}]}]})
  }})
  assert.equal(result.status,'review'); assert.equal(calls,1)
  assert.equal((await tick()).status,'review_pending')
  const skip=await runCycle({db:f.worker,fetchImpl:()=>{throw new Error('No extra spend')}})
  assert.equal(skip.model_called,false)
  await admin.query('BEGIN'); await admin.query("SELECT set_config('app.hq_actor_id','fixture_supervisor',true)")
  await admin.query("UPDATE hq_jobs SET status='accepted',reviewer_id='fixture_supervisor',review_evidence='Fictional test only' WHERE organization_id=$1 AND id=$2",[f.org,result.job_id]); await admin.query('COMMIT')
  assert.equal((await tick()).status,'unchanged')
  const read=await view(f.viewer)
  assert.ok(read.checks.length>=10); assert.equal(read.source.records.metrics[0].current,0)
  console.log(JSON.stringify({passed:'Restricted ingest, tenant isolation, replay, field minimization, recovery, freshness, budget, one-call cycle, review hold and accepted dedupe',paid_calls:0,checks:read.checks.length}))
} finally { await Promise.allSettled(clients.map(c=>c.end())); await admin.end() }
