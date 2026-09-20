import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import pg from 'pg'

const address = new URL(process.env.HQ_TEST_DATABASE_URL || 'postgresql://postgres@127.0.0.1:55439/traceli_hq_test')
if (address.hostname !== '127.0.0.1' || address.pathname !== '/traceli_hq_test' || address.search || !address.port) throw new Error('Only isolated local HQ fixtures permitted')
const admin = new pg.Client({ connectionString: address.toString() }); await admin.connect()
const suffix=randomUUID().replaceAll('-','').slice(0,10), clients=[]
const org='readout_'+suffix, runner='readout_run_'+suffix, reader='readout_read_'+suffix
const owner='readout_owner_'+suffix
async function login(name,role) {
  const u=new URL(address); u.username=name; u.password="fixture"
  const c=new pg.Client({connectionString:u.toString()}); await c.connect(); clients.push(c); await c.query('SET ROLE '+role); return c
}
try {
  // Run SECURITY DEFINER as a non-superuser with forced RLS, matching Neon.
  await admin.query(`CREATE ROLE ${owner} NOLOGIN INHERIT NOSUPERUSER NOBYPASSRLS; GRANT traceli_hq_supervisor,traceli_hq_librarian TO ${owner}; GRANT USAGE,CREATE ON SCHEMA public TO ${owner}; GRANT ALL ON hq_readout_authorizations,hq_operating_sources,hq_operating_checks,hq_cloud_bindings,hq_cloud_policies,hq_cloud_artifacts,hq_cloud_charges,hq_jobs,hq_runs,hq_scopes,hq_events TO ${owner}`)
  for(const fn of ['hq_cloud_identity(text)','hq_customer_readout()','hq_operating_tick()','hq_operating_model_tick()','hq_cloud_snapshot()']) await admin.query('ALTER FUNCTION '+fn+' OWNER TO '+owner)
  await admin.query('INSERT INTO organizations(id,name) VALUES($1,$2)',[org,'Fictional customer readout test'])
  await admin.query("INSERT INTO hq_scopes(organization_id,id,kind,mandate_id,name) VALUES($1,'institutional-memory','mandate','institutional-memory','Fixture')",[org])
  for(const [name,kind,role] of [[runner,'runner','traceli_hq_cloud_runner'],[reader,'reader','traceli_hq_cloud_reader']]) {
    await admin.query(`CREATE ROLE ${name} LOGIN PASSWORD 'fixture' NOINHERIT NOSUPERUSER NOBYPASSRLS; GRANT ${role} TO ${name} WITH INHERIT FALSE`)
    await admin.query('INSERT INTO hq_cloud_bindings(login_name,kind,organization_id,actor_id,enabled) VALUES($1::text::name,$2,$3,$1::text,true)',[name,kind,org])
  }
  await admin.query("INSERT INTO hq_cloud_policies(login_name,enabled,funding_reference,pricing_valid_until,inputs) VALUES($1,true,'fixture',now()+interval '1 day','[{\"ref\":\"fixture\",\"text\":\"fictional\"}]')",[runner])
  const worker=await login(runner,'traceli_hq_cloud_runner'), viewer=await login(reader,'traceli_hq_cloud_reader')
  const run=()=>worker.query('SELECT hq_customer_readout() AS value').then(r=>r.rows[0].value)
  assert.equal((await run()).status,'not_authorized')
  await assert.rejects(viewer.query('SELECT hq_customer_readout()'),/permission denied/)
  for(const c of [worker,viewer]) for(const table of ['hq_readout_authorizations','hq_cloud_artifacts','hq_jobs','procurements']) await assert.rejects(c.query('SELECT * FROM '+table),/permission denied/)
  await admin.query("INSERT INTO hq_readout_authorizations(login_name,task_id,claim_id,claim_until,source_hash) VALUES($1,38,$2,now()+interval '40 minutes',$3)",[runner,randomUUID(),'a'.repeat(64)])
  assert.equal((await run()).status,'source_missing')
  const records={tasks:Array.from({length:12},(_,i)=>({id:28+i,status:i===10?'doing':'todo',owner:i===10?'Codex':'Oday',week:'2026-09-14'})),metrics:['w4-people','w4-sent','w4-conversations','w4-next-steps'].map((id,i)=>({id,current:0,target:[10,10,5,1][i]}))}
  await admin.query("INSERT INTO hq_operating_sources(organization_id,source_id,captured_at,records,content_hash) VALUES($1,'appgprj_6a94833e5918819180fb17a031f5711e',now()-interval '25 hours',$2,$3)",[org,records,'a'.repeat(64)])
  assert.equal((await run()).status,'source_stale')
  await admin.query('UPDATE hq_operating_sources SET captured_at=now(),content_hash=$2 WHERE organization_id=$1',[org,'b'.repeat(64)])
  assert.equal((await run()).status,'source_changed')
  await admin.query('UPDATE hq_operating_sources SET content_hash=$2 WHERE organization_id=$1',[org,'a'.repeat(64)])
  await admin.query('UPDATE hq_cloud_policies SET enabled=false WHERE login_name=$1',[runner])
  assert.equal((await run()).status,'policy_paused')
  await admin.query('UPDATE hq_cloud_policies SET enabled=true WHERE login_name=$1',[runner])
  records.metrics[2].current=1
  await admin.query('UPDATE hq_operating_sources SET records=$2 WHERE organization_id=$1',[org,records])
  assert.equal((await run()).status,'inputs_need_review')
  records.metrics[2].current=0; records.metrics[2].target=6
  await admin.query('UPDATE hq_operating_sources SET records=$2 WHERE organization_id=$1',[org,records])
  assert.equal((await run()).status,'inputs_need_review')
  records.metrics[2].target=5; records.tasks[10].status='todo'
  await admin.query('UPDATE hq_operating_sources SET records=$2 WHERE organization_id=$1',[org,records])
  assert.equal((await run()).status,'task_not_claimed')
  records.tasks[10].status='doing'
  await admin.query('UPDATE hq_operating_sources SET records=$2 WHERE organization_id=$1',[org,records])
  // Simulate a disconnect/rollback before commit. No partial artifact survives.
  await worker.query('BEGIN'); const lost=await run(); assert.equal(lost.status,'review'); await worker.query('ROLLBACK')
  assert.equal((await admin.query('SELECT count(*)::int n FROM hq_cloud_artifacts WHERE organization_id=$1',[org])).rows[0].n,0)
  const competitor=await login(runner,'traceli_hq_cloud_runner')
  const result=await Promise.all([run(),competitor.query('SELECT hq_customer_readout() value').then(r=>r.rows[0].value)])
  assert.deepEqual(result.map(r=>r.status).sort(),['already_submitted','review']); assert.equal(result[0].artifactHash,result[1].artifactHash)
  const replay=await run(); assert.equal(replay.artifactHash,result[0].artifactHash)
  const tick=(await worker.query('SELECT hq_operating_tick() value')).rows[0].value
  assert.equal(tick.model_eligible,false); assert.equal(tick.model_called,false)
  const snap=(await viewer.query('SELECT hq_cloud_snapshot() value')).rows[0].value
  assert.equal(snap.runs.length,1); assert.equal(snap.runs[0].status,'review'); assert.equal(snap.runs[0].estimated_microusd,0)
  assert.match(snap.runs[0].draft.observations[1].statement,/denominators are unavailable/)
  assert.equal((await admin.query('SELECT count(*)::int n FROM hq_cloud_charges WHERE organization_id=$1',[org])).rows[0].n,0)
  assert.equal((await admin.query('SELECT input_tokens,output_tokens,cost_usd FROM hq_runs WHERE organization_id=$1',[org])).rows[0].input_tokens,'0')
  await assert.rejects(admin.query('UPDATE hq_cloud_artifacts SET body=body WHERE organization_id=$1',[org]),/append-only|immutable/i)
  console.log(JSON.stringify({passed:'Authorization, restricted role, freshness, source pinning, policy pause, changed evidence, task claim, rollback recovery, concurrent dedupe, immutable artifact, HQ readback and zero model charges',model_calls:0}))
} finally { await Promise.allSettled(clients.map(c=>c.end())); await admin.end() }
