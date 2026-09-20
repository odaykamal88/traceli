import assert from 'node:assert/strict'
import { randomUUID, createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import pg from 'pg'
import { createHQStore } from '../../lib/hq/store.ts'

// This executable deliberately cannot target a hosted or ordinary application DB.
const connectionString=process.env.HQ_TEST_DATABASE_URL
if(!connectionString) throw new Error('HQ_TEST_DATABASE_URL is required; use an isolated local test database.')
const target=new URL(connectionString)
if(target.hostname!=='127.0.0.1'||target.pathname!=='/traceli_hq_test'||target.search||!target.port) throw new Error('Only the isolated loopback traceli_hq_test database is allowed.')
const pool=new pg.Pool({connectionString,max:4})
const suffix=randomUUID().replaceAll('-','').slice(0,12)
const orgA='org_hq_test_'+suffix,orgB='org_hq_other_'+suffix
const principal=(role,actorId,mandateId='build',organizationId=orgA)=>({role,actorId,mandateId,organizationId})
const supervisor=principal('supervisor','supervisor_test')
const worker=principal('worker','builder_test')
const librarian=principal('librarian','librarian_test','institutional-memory')
const sup=createHQStore(supervisor,pool),build=createHQStore(worker,pool),lib=createHQStore(librarian,pool)
const completed=[]
const result={summary:'Fictional local test output',artifactRef:'fixture:output',artifactHash:'a'.repeat(64),evidenceRefs:['fixture:check']}
const job=(id,extra={})=>{
  const p={id,mandateId:'build',objective:'Test a bounded internal job',approvalLevel:'Green',...extra}
  return {...p,contract:{id,owner:p.mandateId,objective:p.objective,charter_version:'fixture-1',trigger:{type:'manual',reference:'fixture:request',dedupe_key:id},inputs_context:['fixture:context'],allowed_tools:['fixture:local-tests'],allowed_memory:{read:['fixture:own-scope'],write:['fixture:drafts']},expected_output:{path:'fixture:output',schema_ref:'fixture:output-schema',description:'Fictional test output'},acceptance_criteria:['fixture:verified'],reviewer:'Independent fixture reviewer',deadline_sla:{active_minutes:15,review_within_hours:24},approval:{level:p.approvalLevel},dependencies:[],limits:{max_tool_calls:10,max_revisions:2},cost:{new_spend_limit:0},...extra.contract}}
}
const proposal=(id,extra={})=>({id,scopeId:'build',key:'lesson',baseVersion:0,content:'Fictional source-backed lesson',evidenceRefs:['fixture:source'],kind:'fact',...extra})
async function sqlAs(p,query,values=[]) {
  const c=await pool.connect()
  try {
    await c.query('BEGIN')
    const roles={worker:'traceli_hq_worker',supervisor:'traceli_hq_supervisor',librarian:'traceli_hq_librarian',app:'traceli_app'}
    await c.query('SET LOCAL ROLE '+roles[p.role])
    await c.query("SELECT set_config('app.organization_id',$1,true),set_config('app.hq_actor_id',$2,true),set_config('app.hq_mandate_id',$3,true)",[p.organizationId,p.actorId,p.mandateId])
    const r=await c.query(query,values)
    await c.query('ROLLBACK')
    return r
  } catch(e) {await c.query('ROLLBACK');throw e} finally {c.release()}
}

try {
  await pool.query('INSERT INTO organizations(id,name) VALUES($1,$2),($3,$4)',[orgA,'Fictional HQ tenant A',orgB,'Fictional HQ tenant B'])
  for(const organizationId of [orgA,orgB]) {
    const s=createHQStore({...supervisor,organizationId},pool)
    for(const id of ['build','risk','institutional-memory']) await s.registerScope({id,kind:'mandate',mandateId:id,name:id,definition:{fixture:true}})
    await s.registerScope({id:'company',kind:'company',mandateId:null,name:'Company memory',definition:{fixture:true}})
    await s.registerScope({id:'case_build',kind:'case',mandateId:'build',name:'Fictional case',definition:{fixture:true}})
  }
  await createHQStore({...supervisor,organizationId:orgB},pool).enqueueJob(job('other-tenant-job'))
  await sup.enqueueJob(job('risk-job',{mandateId:'risk'}))
  await sup.enqueueJob(job('job-1'))
  await sup.enqueueJob(job('job-1'))
  await assert.rejects(()=>sup.enqueueJob(job('job-1',{objective:'Changed contract'})),/different contract/)
  assert.deepEqual((await build.listJobs()).map(j=>j.id),['job-1'])
  assert.equal(await build.claimJob('risk-job'),null)
  assert.equal(await build.claimJob('other-tenant-job'),null)
  await assert.rejects(()=>sqlAs({...worker,role:'app'},'SELECT * FROM hq_jobs'),/permission denied/)
  completed.push('Tenant and mandate isolation; ordinary app role denied HQ access; job ID deduplication')

  const claims=await Promise.all([build.claimJob('job-1'),build.claimJob('job-1')])
  assert.equal(claims.filter(Boolean).length,1)
  const claim=claims.find(Boolean)
  await sup.enqueueJob(job('job-2'))
  await assert.rejects(()=>build.claimJob('job-2'),/hq_one_running_job_per_mandate/)
  await assert.rejects(()=>build.submitJob('job-1',randomUUID(),result),/lease required/)
  await build.submitJob('job-1',claim.leaseToken,result)
  await assert.rejects(()=>build.acceptJob('job-1','self approval'),/denied/)
  await assert.rejects(()=>createHQStore({...supervisor,actorId:worker.actorId},pool).acceptJob('job-1','self approval'),/independent reviewer/)
  await sup.acceptJob('job-1','Independent fixture check passed')
  await assert.rejects(()=>build.submitJob('job-1',claim.leaseToken,result),/lease required/)
  completed.push('Concurrent claim deduplication; one active job per mandate; fencing; independent output acceptance')

  for(const level of ['Amber','Red']) {await sup.enqueueJob(job('gated-'+level,{approvalLevel:level}));assert.equal(await build.claimJob('gated-'+level),null)}
  await sup.enqueueJob(job('room-mirror',{sourceSystem:'operating_room',externalId:'44'}))
  assert.equal(await build.claimJob('room-mirror'),null)
  completed.push('Amber/Red and Operating Room mirrors cannot be dispatched by HQ workers')

  const expired=await build.claimJob('job-2',1)
  await new Promise(resolve=>setTimeout(resolve,1100))
  await assert.rejects(()=>build.submitJob('job-2',expired.leaseToken,result),/lease required/)
  const replacement=createHQStore({...worker,actorId:'replacement_builder'},pool)
  const resumed=await replacement.claimJob('job-2',1)
  assert.equal(resumed.job.attempts,2)
  await assert.rejects(()=>build.submitJob('job-2',expired.leaseToken,result),/lease required/)
  await new Promise(resolve=>setTimeout(resolve,1100))
  assert.equal(await replacement.claimJob('job-2'),null)
  const attempts=await pool.query('SELECT attempt,cost_usd FROM hq_runs WHERE organization_id=$1 AND job_id=$2 ORDER BY attempt',[orgA,'job-2'])
  assert.deepEqual(attempts.rows.map(r=>r.attempt),[1,2])
  assert.ok(attempts.rows.every(r=>r.cost_usd===null))
  await sup.stopExpiredJob('job-2','Attempt cap reached; retain history for Supervisor review')
  assert.equal((await build.listJobs()).find(j=>j.id==='job-2').status,'failed')
  completed.push('Expired worker rejected; replacement attempt retained; attempt cap enforced; unknown cost remains null')

  await assert.rejects(()=>sup.enqueueJob({...job('incomplete'),contract:{}}))
  await sup.enqueueJob(job('dependent',{contract:{dependencies:['risk-job']}}))
  assert.equal(await build.claimJob('dependent'),null)
  const risk=createHQStore(principal('worker','risk_test','risk'),pool)
  const riskClaim=await risk.claimJob('risk-job')
  await risk.submitJob('risk-job',riskClaim.leaseToken,result)
  assert.equal(await build.claimJob('dependent'),null)
  await sup.acceptJob('risk-job','Independent prerequisite check')
  const dep=await build.claimJob('dependent')
  assert.ok(dep)
  await build.submitJob('dependent',dep.leaseToken,result)
  await sup.acceptJob('dependent','Dependency evidence inspected')
  const statuses=await sqlAs(worker,'SELECT * FROM hq_job_status')
  assert.ok(statuses.rows.some(r=>r.id==='risk-job'&&r.status==='accepted'))
  assert.ok(!statuses.rows.some(r=>r.id==='other-tenant-job'))
  assert.deepEqual(Object.keys(statuses.rows[0]).sort(),['id','status'])
  completed.push('Incomplete contracts denied; cross-mandate prerequisites checked without exposing contracts or another tenant')

  await sup.enqueueJob(job('short-budget',{contract:{deadline_sla:{active_minutes:0.1,review_within_hours:24}}}))
  await assert.rejects(()=>sqlAs(worker,`UPDATE hq_jobs SET status='running',attempts=1,lease_token=$2,lease_until=clock_timestamp()+interval '15 minutes',worker_id=$3 WHERE id=$1`,['short-budget',randomUUID(),worker.actorId]),/active-time budget exceeded/)
  const beforeShort=Date.now()
  const shortClaim=await build.claimJob('short-budget',900)
  assert.ok(shortClaim)
  const shortLease=new Date(shortClaim.job.lease_until).getTime()-beforeShort
  assert.ok(shortLease>0&&shortLease<7000,`Expected approximately six seconds, got ${shortLease}ms`)
  await build.submitJob('short-budget',shortClaim.leaseToken,result)
  await sup.acceptJob('short-budget','Job-specific lease cap verified')
  completed.push('Short job budget caps a longer requested lease; direct over-budget worker claims are denied')


  await assert.rejects(()=>build.proposeMemory(proposal('cross-mandate',{scopeId:'risk'})),/row-level security/)
  await assert.rejects(()=>build.proposeMemory(proposal('cross-job',{jobId:'risk-job'})),/unavailable in this scope/)
  const p=await build.proposeMemory(proposal('proposal-1'))
  assert.equal(p.content_hash,createHash('sha256').update(p.content).digest('hex'))
  await assert.rejects(()=>build.reviewMemory(p.id,p.content_hash,'approved','self approval'),/denied/)
  await assert.rejects(()=>createHQStore({...supervisor,actorId:worker.actorId},pool).reviewMemory(p.id,p.content_hash,'approved','self approval'),/independent actor/)
  await assert.rejects(()=>sup.reviewMemory(p.id,'b'.repeat(64),'approved','wrong bytes'),/exact proposal/)
  const review=await sup.reviewMemory(p.id,p.content_hash,'approved','Verified fixture and no conflict')
  await assert.rejects(()=>sup.promoteMemory(p.id,review.id),/denied/)
  await assert.rejects(()=>sqlAs(worker,`INSERT INTO hq_memory_versions(organization_id,scope_id,memory_key,version,proposal_id,review_id,promoted_by,content) VALUES($1,'build','lesson',1,$2,$3,$4,'Injected')`,[orgA,p.id,review.id,worker.actorId]),/permission denied/)
  const v=await lib.promoteMemory(p.id,review.id)
  assert.equal(v.version,1)
  assert.equal((await build.readMemory('build'))[0].content,p.content)
  assert.equal((await createHQStore(principal('worker','auditor_test','risk'),pool).readMemory('build')).length,0)
  assert.equal((await createHQStore({...worker,organizationId:orgB},pool).readMemory('build')).length,0)
  completed.push('Scoped proposal access; database-computed hashes; independent exact review; Librarian-only canonical promotion')

  const stale=await build.proposeMemory(proposal('stale-proposal',{content:'An outdated alternative'}))
  const staleReview=await sup.reviewMemory(stale.id,stale.content_hash,'approved','Review against old base')
  await assert.rejects(()=>lib.promoteMemory(stale.id,staleReview.id),/Stale memory base/)
  const rejected=await build.proposeMemory(proposal('rejected-proposal',{key:'rejected'}))
  const rejection=await sup.reviewMemory(rejected.id,rejected.content_hash,'rejected','Unsupported fixture')
  await assert.rejects(()=>lib.promoteMemory(rejected.id,rejection.id),/exact approved proposal/)
  const second=await build.proposeMemory(proposal('proposal-2',{baseVersion:1,content:'Fictional corrected lesson'}))
  const secondReview=await sup.reviewMemory(second.id,second.content_hash,'approved','Reviewed correction')
  await lib.promoteMemory(second.id,secondReview.id)
  assert.equal((await build.readMemory('build'))[0].version,2)
  await assert.rejects(()=>pool.query("UPDATE hq_memory_proposals SET content='changed' WHERE organization_id=$1 AND id=$2",[orgA,p.id]),/append-only/)
  await assert.rejects(()=>pool.query('DELETE FROM hq_memory_versions WHERE organization_id=$1',[orgA]),/append-only/)
  assert.equal((await pool.query('SELECT * FROM hq_memory_versions WHERE organization_id=$1',[orgA])).rowCount,2)
  completed.push('Rejected/stale promotions denied; version history preserved; mutation blocked even for the test owner')

  const first=await build.proposeMemory(proposal('race-1',{key:'concurrent'}))
  const other=await build.proposeMemory(proposal('race-2',{key:'concurrent',content:'A competing correction'}))
  const reviewFirst=await sup.reviewMemory(first.id,first.content_hash,'approved','Race fixture one')
  const reviewOther=await sup.reviewMemory(other.id,other.content_hash,'approved','Race fixture two')
  const promoted=await Promise.allSettled([lib.promoteMemory(first.id,reviewFirst.id),lib.promoteMemory(other.id,reviewOther.id)])
  assert.equal(promoted.filter(r=>r.status==='fulfilled').length,1)
  assert.equal(promoted.filter(r=>r.status==='rejected').length,1)
  completed.push('Concurrent promotions from one base cannot fork or overwrite canonical memory')

  await sup.recordDecision({id:'decision-1',approvalLevel:'Amber',decision:'Run one internal fixture',rationale:'Test',evidenceRefs:['fixture:approval']})
  await sup.recordDecision({id:'decision-2',approvalLevel:'Amber',decision:'Revise the internal fixture',rationale:'New evidence',evidenceRefs:['fixture:correction'],supersedesId:'decision-1'})
  await assert.rejects(()=>sqlAs(worker,'INSERT INTO hq_decision_ledger(organization_id,id,actor_id,approval_level,decision,rationale,evidence_refs) VALUES($1,$2,$3,$4,$5,$6,$7)',[orgA,'forged','worker','Red','approve','fake','["fake"]']),/permission denied/)
  await assert.rejects(()=>pool.query("UPDATE hq_decision_ledger SET decision='rewrite' WHERE organization_id=$1",[orgA]),/append-only/)
  const resets=await pool.query("SELECT current_user,nullif(current_setting('app.organization_id',true),'') AS tenant")
  assert.equal(resets.rows[0].current_user,'postgres');assert.equal(resets.rows[0].tenant,null)
  completed.push('Decision supersession is append-only; workers cannot forge ledger entries; pooled transaction identity resets')

  const restartPool=new pg.Pool({connectionString,max:1})
  try {assert.equal((await createHQStore(worker,restartPool).readMemory('build')).find(m=>m.memory_key==='lesson').version,2)} finally {await restartPool.end()}
  completed.push('Canonical memory survives a fresh application connection')
  await mkdir('work/hq',{recursive:true})
  await writeFile('work/hq/postgres-test-evidence.json',JSON.stringify({at:new Date().toISOString(),organizationId:orgA,checks:completed,postgresVersion:(await pool.query('SHOW server_version')).rows[0].server_version,expectedHead:2},null,2)+'\n')
  console.log(JSON.stringify({passed:completed.length,checks:completed},null,2))
} finally {await pool.end()}
