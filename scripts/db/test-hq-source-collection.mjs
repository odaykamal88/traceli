import assert from 'node:assert/strict'
import {randomUUID,createHash} from 'node:crypto'
import pg from 'pg'
const address=new URL(process.env.HQ_TEST_DATABASE_URL||'postgresql://postgres:fixture@127.0.0.1:55441/traceli_hq_test')
if(address.hostname!=='127.0.0.1'||address.pathname!=='/traceli_hq_test'||address.search)throw new Error('Local isolated fixture only')
const admin=new pg.Client({connectionString:address.toString()});await admin.connect()
const suffix=randomUUID().slice(0,8),org='src_'+suffix,runner='src_run_'+suffix,reader='src_read_'+suffix,owner='src_owner_'+suffix,clients=[],checks=[]
const bytes=Buffer.from('%PDF-1.0\nFictional source fixture, not a real rule.\n'),sha=createHash('sha256').update(bytes).digest('hex')
const spec=[{id:'fixture',title:'Fictional PDF',url:'https://example.org/fixture.pdf',sha256:sha}]
async function login(name,role){const u=new URL(address);u.username=name;u.password='fixture';const c=new pg.Client({connectionString:u.toString()});await c.connect();await c.query('SET ROLE '+role);clients.push(c);return c}
async function job(id,{enabled=true,expires="48 hours",max=2}={}) {
 await admin.query("INSERT INTO hq_jobs(organization_id,id,mandate_id,objective,contract,approval_level,max_attempts) VALUES($1,$2,'institutional-memory','Fixture',$3,'Green',$4)",[org,id,{charter_version:'source-collection-1',source_task_id:49},max])
 await admin.query("INSERT INTO hq_source_authorizations(organization_id,job_id,login_name,task_id,source_claim_id,authorization_ref,expires_at,enabled,manifest,manifest_hash) VALUES($1,$2,$3,49,$4,'fixture',clock_timestamp()+$5::interval,$6,$7,'placeholder')",[org,id,runner,randomUUID(),expires,enabled,JSON.stringify(spec)])
}
try {
 await admin.query(`CREATE ROLE ${owner} NOLOGIN INHERIT NOSUPERUSER NOBYPASSRLS;GRANT traceli_hq_supervisor,traceli_hq_librarian TO ${owner};GRANT USAGE,CREATE ON SCHEMA public TO ${owner};GRANT ALL ON hq_source_authorizations,hq_source_evidence,hq_cloud_bindings,hq_cloud_policies,hq_cloud_artifacts,hq_cloud_charges,hq_jobs,hq_runs,hq_scopes,hq_events,hq_operating_checks,hq_operating_sources TO ${owner}`)
 for(const fn of ['hq_cloud_identity(text)','hq_source_claim()','hq_source_submit(text,text,text,jsonb)','hq_cloud_snapshot()','hq_cloud_base_snapshot()'])await admin.query('ALTER FUNCTION '+fn+' OWNER TO '+owner)
 await admin.query('INSERT INTO organizations(id,name) VALUES($1,$2)',[org,'Fictional source test'])
 await admin.query("INSERT INTO hq_scopes(organization_id,id,kind,mandate_id,name) VALUES($1,'institutional-memory','mandate','institutional-memory','Fixture')",[org])
 for(const [name,kind,role] of [[runner,'runner','traceli_hq_cloud_runner'],[reader,'reader','traceli_hq_cloud_reader']]){
  await admin.query(`CREATE ROLE ${name} LOGIN PASSWORD 'fixture' NOINHERIT NOSUPERUSER NOBYPASSRLS;GRANT ${role} TO ${name} WITH INHERIT FALSE`)
  await admin.query('INSERT INTO hq_cloud_bindings(login_name,kind,organization_id,actor_id,enabled) VALUES($1::text::name,$2,$3,$1::text,true)',[name,kind,org])
 }
 await admin.query("INSERT INTO hq_cloud_policies(login_name,enabled,funding_reference,pricing_valid_until,inputs) VALUES($1,true,'fixture',now()+interval '1 day','[{\"ref\":\"fixture\",\"text\":\"fixture\"}]')",[runner])
 const worker=await login(runner,'traceli_hq_cloud_runner'),viewer=await login(reader,'traceli_hq_cloud_reader'),other=await login(runner,'traceli_hq_cloud_runner')
 const claim=()=>worker.query('SELECT hq_source_claim() v').then(x=>x.rows[0].v)
 const submit=(c,result=[{id:'fixture',status:'retained',captured_at:new Date().toISOString(),bytes_base64:bytes.toString('base64')}])=>worker.query('SELECT hq_source_submit($1,$2,$3,$4) v',[c.run_id,c.lease_token,c.manifest_hash,JSON.stringify(result)]).then(x=>x.rows[0].v)
 assert.equal(await claim(),null)
 await assert.rejects(viewer.query('SELECT hq_source_claim()'),/permission denied/)
 for(const c of [viewer,worker])for(const t of ['hq_source_authorizations','hq_source_evidence','procurements','hq_jobs'])await assert.rejects(c.query('SELECT * FROM '+t),/permission denied/)
 checks.push('restricted roles and no-job idle')
 await job('a')
 // Hold a committed revocation behind the exact binding lock the worker waits
 // for: its first identity read sees the old row, its second must see disabled.
 const workerPid=(await worker.query('SELECT pg_backend_pid() pid')).rows[0].pid
 const adminPid=(await admin.query('SELECT pg_backend_pid() pid')).rows[0].pid
 let waitingClaim
 await admin.query('BEGIN')
 try {
  await admin.query('UPDATE hq_cloud_bindings SET enabled=false WHERE login_name=$1',[runner])
  waitingClaim=claim().then(value=>({value}),error=>({error}))
  let blocked=false
  const until=Date.now()+1000
  while(Date.now()<until){
   const state=(await admin.query('SELECT $2::int = ANY(pg_blocking_pids($1::int)) blocked',[workerPid,adminPid])).rows[0]
   if(state.blocked){blocked=true;break}
   await new Promise(resolve=>setTimeout(resolve,5))
  }
  assert.equal(blocked,true,'claim must wait on the binding revocation transaction')
  await admin.query('COMMIT')
 } catch(error) { await admin.query('ROLLBACK');if(waitingClaim)await waitingClaim;throw error }
 const deniedAfterWait=await waitingClaim
 assert.match(deniedAfterWait.error?.message||'',/Cloud identity denied/)
 assert.equal((await admin.query("SELECT attempts FROM hq_jobs WHERE organization_id=$1 AND id='a'",[org])).rows[0].attempts,0)
 await admin.query('UPDATE hq_cloud_bindings SET enabled=true WHERE login_name=$1',[runner])
 checks.push('binding revocation committed while claim waits is revalidated before dispatch')
 await admin.query('UPDATE hq_cloud_policies SET enabled=false WHERE login_name=$1',[runner]);assert.equal(await claim(),null)
 await admin.query('UPDATE hq_cloud_policies SET enabled=true WHERE login_name=$1',[runner])
 const concurrent=await Promise.all([claim(),other.query('SELECT hq_source_claim() v').then(x=>x.rows[0].v)]),c=concurrent.find(Boolean);assert.equal(concurrent.filter(Boolean).length,1)
 checks.push('policy pause and concurrent single lease')
 // Check the table constraint itself, independently of the submit validator.
 for(const [payload,digest] of [[null,null],[null,sha],[bytes,null]])await assert.rejects(
  admin.query("INSERT INTO hq_source_evidence(organization_id,job_id,run_id,source_id,captured_at,status,bytes,byte_hash) VALUES($1,'a',$2,'null-fixture',clock_timestamp(),'retained',$3,$4)",[org,c.run_id,payload,digest]),
  error=>error.code==='23514'&&error.table==='hq_source_evidence',
 )
 checks.push('direct retained evidence rejects NULL bytes and NULL hashes at the table boundary')
 for(const altered of [{...c,lease_token:null},{...c,lease_token:'wrong'},{...c,manifest_hash:null},{...c,manifest_hash:'0'.repeat(64)},{...c,run_id:'missing'}])await assert.rejects(submit(altered),/denied|mismatch/)
 await assert.rejects(submit(c,[{id:'fixture',status:'retained',captured_at:new Date().toISOString(),bytes_base64:Buffer.from('%PDF-bad').toString('base64')}]),/digest/)
 await assert.rejects(submit(c,[{id:'fixture',status:'retained',captured_at:new Date().toISOString(),bytes_base64:null}]),/payload/)
 await assert.rejects(submit(c,[{id:'wrong',status:'deadline',captured_at:new Date().toISOString()}]),/Invalid source/)
 await assert.rejects(submit(c,[{id:'fixture',status:'deadline',captured_at:new Date().toISOString(),extra:'leak'}]),/extra data/)
 await assert.rejects(submit(c,[{id:'fixture',status:'retained',captured_at:'2000-01-01T00:00:00Z',bytes_base64:bytes.toString('base64')}]),/time invalid/)
 checks.push('wrong/null lease, manifest, source set, byte hash, null bytes, extra fields, timestamp denied')
 await admin.query('UPDATE hq_source_authorizations SET enabled=false WHERE organization_id=$1 AND job_id=\'a\'',[org]);await assert.rejects(submit(c),/inactive/)
 await admin.query('UPDATE hq_source_authorizations SET enabled=true WHERE organization_id=$1 AND job_id=\'a\'',[org])
 await worker.query('BEGIN');await submit(c);await worker.query('ROLLBACK')
 assert.equal((await admin.query('SELECT count(*)::int n FROM hq_source_evidence WHERE organization_id=$1',[org])).rows[0].n,0)
 const saved=await submit(c),replay=await submit(c);assert.equal(replay.artifactHash,saved.artifactHash);assert.equal(replay.status,'already_submitted')
 await assert.rejects(submit({...c,lease_token:null}),/denied/)
 await admin.query('UPDATE hq_source_authorizations SET enabled=false WHERE organization_id=$1 AND job_id=\'a\'',[org]);await assert.rejects(submit(c),/inactive/)
 await admin.query('UPDATE hq_source_authorizations SET enabled=true WHERE organization_id=$1 AND job_id=\'a\'',[org])
 const evidence=(await admin.query('SELECT bytes,byte_hash FROM hq_source_evidence WHERE organization_id=$1',[org])).rows[0];assert.deepEqual(evidence.bytes,bytes);assert.equal(evidence.byte_hash,sha)
 await assert.rejects(admin.query('UPDATE hq_source_evidence SET bytes=bytes WHERE organization_id=$1',[org]),/append-only/)
 await assert.rejects(admin.query('UPDATE hq_source_authorizations SET manifest=\'[]\' WHERE organization_id=$1',[org]),/version-bound/)
 checks.push('revocation and paused replay; atomic rollback, exact replay, verified immutable bytes')
 const snapshot=(await viewer.query('SELECT hq_cloud_snapshot() v')).rows[0].v
 assert.equal(snapshot.runs[0].content_hash,saved.artifactHash);assert.equal(snapshot.runs[0].estimated_microusd,0);assert.equal(JSON.stringify(snapshot).includes(bytes.toString('base64')),false)
 assert.equal((await admin.query('SELECT count(*)::int n FROM hq_cloud_charges WHERE organization_id=$1',[org])).rows[0].n,0)
 checks.push('restricted HQ summary readback and zero model charges')
 await job('b');const first=await claim();await admin.query("UPDATE hq_jobs SET lease_until=clock_timestamp()-interval '1 second' WHERE organization_id=$1 AND id='b'",[org])
 const second=await claim();assert.notEqual(first.lease_token,second.lease_token);await assert.rejects(submit(first),/lease denied/)
 await admin.query("UPDATE hq_jobs SET lease_until=clock_timestamp()-interval '1 second' WHERE organization_id=$1 AND id='b'",[org]);await job('c');const next=await claim();assert.ok(next)
 assert.equal((await admin.query("SELECT status FROM hq_jobs WHERE organization_id=$1 AND id='b'",[org])).rows[0].status,'failed')
 const partial=await submit(next,[{id:'fixture',status:'http_error',captured_at:new Date().toISOString()}]);assert.equal(partial.retained_sources,0);assert.equal((await submit(next)).artifactHash,partial.artifactHash)
 checks.push('expired attempt recovery, exhausted job does not wedge queue, immutable partial review')
 // Seed the boundary directly as fixture administrator: authorization itself
 // is immutable, so do not rewrite it or wait two minutes to make this state.
 await job('d-near-expiry',{expires:'124 seconds'})
 const expiredRun=randomUUID(),expiredToken=randomUUID(),expiredLease=new Date(Date.now()-1000).toISOString()
 await admin.query("UPDATE hq_jobs SET status='running',attempts=1,worker_id=$2,lease_token=$3,lease_until=$4 WHERE organization_id=$1 AND id='d-near-expiry'",[org,runner,expiredToken,expiredLease])
 await admin.query("INSERT INTO hq_runs(organization_id,id,job_id,mandate_id,attempt,worker_id,lease_token,lease_until,status) VALUES($1,$2,'d-near-expiry','institutional-memory',1,$3,$4,$5,'running')",[org,expiredRun,runner,expiredToken,expiredLease])
 const nearExpiry=(await admin.query("SELECT j.attempts<j.max_attempts retry_left,a.expires_at>clock_timestamp() still_authorized,a.expires_at<=clock_timestamp()+interval '125 seconds' insufficient_window FROM hq_jobs j JOIN hq_source_authorizations a ON (a.organization_id,a.job_id)=(j.organization_id,j.id) WHERE j.organization_id=$1 AND j.id='d-near-expiry'",[org])).rows[0]
 assert.deepEqual(nearExpiry,{retry_left:true,still_authorized:true,insufficient_window:true})
 await job('e-after-expiry')
 const afterExpiry=await claim();assert.ok(afterExpiry)
 assert.equal((await admin.query('SELECT job_id FROM hq_runs WHERE organization_id=$1 AND id=$2',[org,afterExpiry.run_id])).rows[0].job_id,'e-after-expiry')
 assert.equal((await admin.query("SELECT status FROM hq_jobs WHERE organization_id=$1 AND id='d-near-expiry'",[org])).rows[0].status,'failed')
 const recoverySnapshot=(await viewer.query('SELECT hq_cloud_snapshot() v')).rows[0].v
 assert.equal(recoverySnapshot.runs.find(run=>run.id===expiredRun)?.status,'expired')
 await submit(afterExpiry,[{id:'fixture',status:'deadline',captured_at:new Date().toISOString()}])
 checks.push('expired lease with <=125s authorization and retry left releases queue and preserves expired run')
 console.log(JSON.stringify({passed:checks,groups:checks.length,model_calls:0}))
} finally {await Promise.allSettled(clients.map(c=>c.end()));await admin.end()}
