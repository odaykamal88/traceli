// Fictional lifecycle checks against an explicitly provisioned disposable loopback database only.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mock } from 'node:test'
import pg from 'pg'

const address = new URL(process.env.DATABASE_URL || 'invalid:')
if (!['postgres:','postgresql:'].includes(address.protocol) || !['127.0.0.1','localhost','[::1]'].includes(address.hostname) || address.search || address.hash || process.env.NODE_ENV==='production' || process.env.VERCEL) throw new Error('Retention checks require a disposable nonproduction loopback PostgreSQL database.')
const inputs=[]
const {MockExtractionProvider}=await import('../../lib/field-registry/extract-mock.ts')
mock.module('../../lib/field-registry/extract-provider.ts',{namedExports:{
  resolveExtractionProviderId:()=>process.env.TRACE_EXTRACTION_PROVIDER==='talonic'?'talonic':'mock',
  getExtractionProvider:()=>({extract:async input=>{
    inputs.push({...input,bytes:undefined})
    const result=await new MockExtractionProvider().extract(input)
    return {...result,providerId:process.env.TRACE_EXTRACTION_PROVIDER==='talonic'?'talonic':'mock'}
  }}),
}})
const {createTender,issuePacket,addManualVersion,saveDraft,issueAssessment,issueJudgment,readTender,readTenderRecord,listTenders,downloadTenderReport,deleteTender,expireTenderBatch}=await import('../../lib/tenders/store.ts')
const {getTenderPolicies}=await import('../../lib/tenders/retention.ts')
const {getDatabasePool}=await import('../../lib/db/client.ts')
const pool=new pg.Pool({connectionString:address.href,max:5})
const run=randomUUID().replaceAll('-',''),org=`org_retention_${run}`,otherOrg=`org_retention_other_${run}`
const director={id:`retention-director-${run}`,name:'Fictional retained actor name',email:'fixture@example.invalid',organizationId:org,role:'Procurement Director',mode:'demo'}
const applicationRole=`retention_fixture_${run}`
let restrictedPool
const other={...director,organizationId:otherOrg}
const key=()=>randomUUID()
const ack=(viewer,classification='synthetic')=>({classification,policyVersion:getTenderPolicies(viewer).policies.find(p=>p.classification===classification).version,consent:true})
const create=(viewer,title,classification='synthetic')=>createTender(viewer,{title,primaryPackId:'global-fund',idempotencyKey:key(),...ack(viewer,classification)})
async function tenant(scope,fn){
  const client=await restrictedPool.connect()
  try{await client.query('begin');await client.query('set local role traceli_app');await client.query("select set_config('app.organization_id',$1,true)",[scope]);const result=await fn(client);await client.query('commit');return result}
  catch(error){await client.query('rollback');throw error}finally{client.release()}
}
let checks=0
async function check(name,fn){await fn();checks++;console.log(`PASS ${name}`)}
async function count(table,id){const result=await pool.query(`select count(*)::int as amount from ${table} where organization_id=$1 and procurement_id=$2`,[org,id]);return result.rows[0].amount}
// Only test-fixture clock travel. The real application cannot rewrite these pinned timestamps.
async function ageTender(id){
  const client=await pool.connect()
  try{await client.query('begin');await client.query('alter table tender_workspaces disable trigger tender_workspace_cursor_only');await client.query("update tender_workspaces set created_at=created_at-interval '744 hours',expires_at=expires_at-interval '744 hours' where organization_id=$1 and procurement_id=$2 and retention_state='managed'",[org,id]);await client.query('alter table tender_workspaces enable trigger tender_workspace_cursor_only');await client.query('commit')}
  catch(error){await client.query('rollback');throw error}finally{client.release()}
}
async function lifecycle(classification='synthetic',viewer=director){
  const detail=await create(viewer,'Fictional sensitive-title sentinel',classification),id=detail.tender.id,acknowledgement=ack(viewer,classification)
  const packet=await issuePacket(viewer,id,{fileName:'fictional-packet.txt',mediaType:'text/plain',bytes:new TextEncoder().encode('Fictional procurement evidence only.'),expectedRevision:0,idempotencyKey:key(),...acknowledgement})
  const manual=await addManualVersion(viewer,id,{fileName:'fictional-manual.txt',mediaType:'text/plain',bytes:new TextEncoder().encode('Fictional reference only.'),expectedRevision:0,idempotencyKey:key(),...acknowledgement})
  const next=await addManualVersion(viewer,id,{fileName:'fictional-manual-v2.txt',mediaType:'text/plain',bytes:new TextEncoder().encode('Fictional reference version two.'),supersedesId:manual.id,expectedRevision:0,idempotencyKey:key(),...acknowledgement})
  const decisions=packet.checklist.rows.map(row=>({key:row.key,action:'confirm',value:'',page:'',quote:'',note:''}))
  await saveDraft(viewer,id,{packetReceiptId:packet.receiptId,decisions,manualVersionIds:[next.id],expectedRevision:0,idempotencyKey:key()})
  await saveDraft(viewer,id,{packetReceiptId:packet.receiptId,decisions,manualVersionIds:[next.id],expectedRevision:1,idempotencyKey:key()})
  const assessment=await issueAssessment(viewer,id,{expectedRevision:2,idempotencyKey:key()})
  const judgment=await issueJudgment(viewer,id,{expectedRevision:2,assessmentId:assessment.id,assessmentHash:assessment.payloadHash,action:'request',reason:'Fictional reviewer requests additional evidence for the missing controls.',idempotencyKey:key()})
  const report=await downloadTenderReport(viewer,id,judgment.id)
  return {id,packet,assessment,judgment,report}
}
const envKeys=['TRACE_EXTRACTION_PROVIDER','TRACELI_TENDER_ORGANIZATIONS','TRACELI_TENDER_CUSTOMER_ORGANIZATIONS','TRACELI_TENDER_CUSTOMER_RETENTION_DAYS','TRACELI_TENDER_CUSTOMER_POLICY_VERSION','TRACELI_TENDER_CUSTOMER_PROVIDER_DISCLOSURE']
const oldEnv=Object.fromEntries(envKeys.map(name=>[name,process.env[name]]))
try{
  process.env.TRACE_EXTRACTION_PROVIDER='mock'
  await pool.query(`create role ${applicationRole} login password 'fictional_retention_fixture' noinherit nobypassrls nosuperuser nocreatedb nocreaterole`)
  await pool.query(`grant traceli_app to ${applicationRole}`)
  const restrictedAddress=new URL(address);restrictedAddress.username=applicationRole;restrictedAddress.password='fictional_retention_fixture'
  restrictedPool=new pg.Pool({connectionString:restrictedAddress.href,max:3})
  await pool.query('insert into organizations(id,name) values($1,$3),($2,$3)',[org,otherOrg,'Disposable fictional retention organization'])
  const full=await lifecycle(),neighbor=await create(director,'Same-organization survivor'),otherNeighbor=await create(other,'Other-organization survivor')
  await check('managed policy pins exactly 30 days, metadata only, and scoped deletion permission',async()=>{
    const detail=await readTender(director,full.id)
    assert.equal(detail.policy.retentionDays,30)
    assert.equal(detail.capabilities.canDelete,true)
    assert.equal(detail.tender.classification,'synthetic')
    assert.equal(inputs[0].packId,'global-fund')
    await assert.rejects(deleteTender({...director,role:'Procurement Officer'},full.id,{idempotencyKey:key()}),e=>e.code==='forbidden')
    await assert.rejects(deleteTender(other,full.id,{idempotencyKey:key()}),e=>e.code==='unavailable')
  })
  await check('ordinary application mutation, role assumption and forged purge setting are refused',async()=>{
    await assert.rejects(tenant(org,c=>c.query('delete from tender_packet_receipts where procurement_id=$1',[full.id])),/permission denied|immutable/)
    await assert.rejects(tenant(org,c=>c.query('update tender_draft_revisions set payload_hash=$2 where procurement_id=$1',[full.id,'0'.repeat(64)])),/permission denied|immutable/)
    await assert.rejects(tenant(org,c=>c.query('set local role traceli_retention_executor')),/permission denied/)
    await assert.rejects(tenant(org,async c=>{await c.query("select set_config('app.retention_purge','true',true)");return c.query('delete from tender_issued_records where procurement_id=$1',[full.id])}),/permission denied|immutable/)
    await assert.rejects(tenant(org,c=>c.query("update tender_workspaces set expires_at=expires_at+interval '24 hours' where procurement_id=$1",[full.id])),/immutable|identity/)
  })
  await check('managed policy constraints reject missing JSON keys instead of accepting SQL NULL',async()=>{
    await assert.rejects(tenant(org,async c=>{
      const id=key()
      await c.query("insert into procurements(id,organization_id,reference,title,region,status,blocker_summary) values($1,$2,$1,'Malformed-policy fixture','Unknown','draft','')",[id,org])
      await c.query("insert into tender_workspaces(organization_id,procurement_id,owner_id,primary_pack_id,pack_version,retention_state,classification,policy,policy_hash,created_at,expires_at) values($1,$2,$3,'global-fund',$4,'managed','synthetic','{}',$5,now(),now()+interval '720 hours')",[org,id,director.id,neighbor.tender.packVersion,'0'.repeat(64)])
    }),/tender_policy_expiry/)
  })
  await check('purge requires expiry or a scoped deletion request and never bypasses RLS',async()=>{
    await assert.rejects(tenant(org,c=>c.query('select * from tender_purge($1,$2,$3,null)',[org,full.id,key()])),/not ended/)
    await assert.rejects(tenant(org,c=>c.query('select * from tender_purge($1,$2,$3,null)',[otherOrg,otherNeighbor.tender.id,key()])),/Unavailable retention scope/)
    await assert.rejects(tenant(org,c=>c.query('select * from tender_purge($1,$2,$3,$4)',[org,full.id,key(),key()])),/Unavailable deletion request/)
    const role=await pool.query("select rolcanlogin,rolbypassrls,rolsuper from pg_roles where rolname='traceli_retention_executor'")
    assert.deepEqual(role.rows[0],{rolcanlogin:false,rolbypassrls:false,rolsuper:false})
  })
  const deletionKey=key();let deleted
  await check('whole-tender deletion removes every copy, self-linked lineage, customer metadata and audit/outbox',async()=>{
    deleted=await deleteTender(director,full.id,{idempotencyKey:deletionKey})
    assert.equal(deleted.deleted,true)
    for(const table of ['tender_workspaces','tender_access','tender_manual_versions','tender_packet_receipts','tender_draft_revisions','tender_draft_manuals','tender_issued_records','tender_commands','tender_export_receipts','tender_deletion_requests','audit_events'])assert.equal(await count(table,full.id),0,table)
    assert.equal((await pool.query('select count(*)::int as amount from procurements where id=$1',[full.id])).rows[0].amount,0)
    assert.equal((await pool.query('select count(*)::int as amount from outbox_events where organization_id=$1 and aggregate_id=$2',[org,full.id])).rows[0].amount,0)
    assert.equal((await readTender(director,neighbor.tender.id)).tender.id,neighbor.tender.id)
    assert.equal((await readTender(other,otherNeighbor.tender.id)).tender.id,otherNeighbor.tender.id)
    await assert.rejects(readTender(director,full.id),e=>e.code==='unavailable')
    await assert.rejects(readTenderRecord(director,full.id,full.judgment.id),e=>e.code==='unavailable')
  })
  await check('deletion receipt replay is actor-bound, tenant-scoped, minimal and finite',async()=>{
    assert.deepEqual(await deleteTender(director,full.id,{idempotencyKey:deletionKey}),deleted)
    await assert.rejects(deleteTender({...director,id:'another-director'},full.id,{idempotencyKey:deletionKey}),e=>e.code==='idempotency_conflict')
    const row=(await pool.query('select * from tender_deletion_receipts where id=$1',[deleted.receiptId])).rows[0]
    assert.equal(row.expires_at-row.deleted_at,30*86_400_000)
    assert.ok(!JSON.stringify(row).includes('Fictional sensitive-title'))
    assert.ok(!JSON.stringify(row).includes('fictional-packet'))
    assert.ok(!JSON.stringify(row).includes(director.id))
    assert.equal((await tenant(otherOrg,c=>c.query('select id from tender_deletion_receipts where id=$1',[deleted.receiptId]))).rowCount,0)
  })
  const expired=await lifecycle();await ageTender(expired.id)
  await check('expiry immediately gates reads, saves, packet replay, issuance and export before scheduled cleanup',async()=>{
    const expiredError=e=>e.code==='expired'
    await assert.rejects(readTender(director,expired.id),expiredError)
    await assert.rejects(readTenderRecord(director,expired.id,expired.judgment.id),expiredError)
    await assert.rejects(issueAssessment(director,expired.id,{expectedRevision:2,idempotencyKey:key()}),expiredError)
    await assert.rejects(downloadTenderReport(director,expired.id,expired.judgment.id),expiredError)
    await assert.rejects(saveDraft(director,expired.id,{packetReceiptId:expired.packet.receiptId,decisions:[],manualVersionIds:[],expectedRevision:2,idempotencyKey:key()}),expiredError)
    await assert.rejects(issuePacket(director,expired.id,{fileName:'fictional.txt',mediaType:'text/plain',bytes:new TextEncoder().encode('Fictional'),expectedRevision:2,idempotencyKey:key(),...ack(director)}),expiredError)
    assert.ok(!(await listTenders(director)).items.some(item=>item.id===expired.id))
    assert.ok(await count('tender_issued_records',expired.id)>0)
  })
  const legacyId=key()
  await pool.query("insert into procurements(id,organization_id,reference,title,region,status,blocker_summary) values($1,$2,$1,'Legacy preserved fixture','Unknown','draft','')",[legacyId,org])
  await pool.query("insert into tender_workspaces(organization_id,procurement_id,owner_id,primary_pack_id,pack_version,created_at) values($1,$2,$3,'global-fund',$4,'2020-01-01T00:00:00Z')",[org,legacyId,director.id,neighbor.tender.packVersion])
  await check('legacy records never acquire expiry or deletion eligibility, even with a forged request',async()=>{
    const detail=await readTender(director,legacyId)
    assert.equal(detail.policy,null);assert.equal(detail.expiresAt,null);assert.equal(detail.capabilities.canDelete,false)
    await assert.rejects(deleteTender(director,legacyId,{idempotencyKey:key()}),e=>e.code==='legacy_preserved')
    await assert.rejects(tenant(org,async c=>{const requestId=key();await c.query('insert into tender_deletion_requests(id,organization_id,procurement_id,idempotency_key,input_hash) values($1,$2,$3,$4,$5)',[requestId,org,legacyId,key(),'0'.repeat(64)]);return c.query('select * from tender_purge($1,$2,$3,$4)',[org,legacyId,key(),requestId])}),/Legacy tender/)
  })
  await check('daily sweep is bounded, tenant-scoped, excludes legacy and deletes the whole expired graph',async()=>{
    const result=await expireTenderBatch(org,{limit:1})
    assert.equal(result.deleted,1)
    assert.equal(await count('tender_issued_records',expired.id),0)
    assert.equal(await count('audit_events',expired.id),0)
    assert.equal((await readTender(director,legacyId)).policy,null)
    assert.equal((await readTender(other,otherNeighbor.tender.id)).tender.id,otherNeighbor.tender.id)
    assert.equal((await expireTenderBatch(org,{limit:1})).deleted,0)
  })
  await check('finite deletion receipts expire without rewriting any live tender evidence',async()=>{
    const client=await pool.connect()
    try{await client.query('begin');await client.query('alter table tender_deletion_receipts disable trigger tender_no_mutation');await client.query("update tender_deletion_receipts set deleted_at=deleted_at-interval '744 hours',expires_at=expires_at-interval '744 hours' where id=$1",[deleted.receiptId]);await client.query('alter table tender_deletion_receipts enable trigger tender_no_mutation');await client.query('commit')}finally{client.release()}
    const result=await expireTenderBatch(org,{limit:10})
    assert.equal(result.receiptsExpired,1)
    assert.equal((await pool.query('select count(*)::int as amount from tender_deletion_receipts where id=$1',[deleted.receiptId])).rows[0].amount,0)
    assert.equal((await readTender(director,neighbor.tender.id)).tender.id,neighbor.tender.id)
  })
  const rollback=await lifecycle(),documentId=key()
  await pool.query("insert into source_documents(id,organization_id,procurement_id,name,kind,access_boundary) values($1,$2,$3,'Fictional linked source','manual','Panel and procurement team')",[documentId,org,rollback.id])
  await check('unrelated dependency failure rolls back every deleted row, request and cursor atomically',async()=>{
    await assert.rejects(deleteTender(director,rollback.id,{idempotencyKey:key()}))
    assert.equal((await readTender(director,rollback.id)).draft.revision,2)
    assert.equal(await count('tender_issued_records',rollback.id),2)
    assert.equal(await count('tender_deletion_requests',rollback.id),0)
    assert.ok(await count('audit_events',rollback.id)>0)
  })
  await pool.query('delete from source_documents where id=$1',[documentId])
  await check('concurrent delete and record issuance serialize without orphan records or duplicate purge',async()=>{
    const results=await Promise.allSettled([deleteTender(director,rollback.id,{idempotencyKey:key()}),issueAssessment(director,rollback.id,{expectedRevision:2,idempotencyKey:key()})])
    assert.equal(results[0].status,'fulfilled')
    assert.equal(await count('tender_issued_records',rollback.id),0)
    assert.equal(await count('tender_workspaces',rollback.id),0)
  })
  process.env.TRACE_EXTRACTION_PROVIDER='talonic'
  process.env.TRACELI_TENDER_ORGANIZATIONS=org
  process.env.TRACELI_TENDER_CUSTOMER_ORGANIZATIONS=org
  process.env.TRACELI_TENDER_CUSTOMER_RETENTION_DAYS='30'
  process.env.TRACELI_TENDER_CUSTOMER_POLICY_VERSION='fictional-approved-route-v1'
  process.env.TRACELI_TENDER_CUSTOMER_PROVIDER_DISCLOSURE='Fictional processor disclosure for mocked provider verification only.'
  await check('mocked Talonic customer flow pins selected pack and retains customer classification through draft, record and PDF',async()=>{
    const customer=await lifecycle('customer',{...director,mode:'workos'})
    assert.equal(inputs.at(-1).packId,'global-fund')
    assert.equal(customer.packet.checklist.snapshot.classification,'customer')
    assert.equal(customer.assessment.payload.snapshot.classification,'customer')
    assert.equal(customer.judgment.payload.snapshot.classification,'customer')
    const detail=await readTender(director,customer.id)
    assert.equal(detail.draft.checklist.snapshot.classification,'customer')
    const {PDFDocument,PDFName,PDFArray,decodePDFRawStream}=await import('pdf-lib')
    const pdf=await PDFDocument.load(customer.report.bytes),content=[]
    for(const page of pdf.getPages()){
      const streams=page.node.lookup(PDFName.of('Contents'))
      for(const stream of streams instanceof PDFArray?streams.asArray():[streams])content.push(decodePDFRawStream(pdf.context.lookup(stream)).decode())
    }
    const body=Buffer.concat(content.map(chunk=>Buffer.from(chunk))).toString('latin1')
    assert.ok(body.includes(Buffer.from('Sanitized customer material').toString('hex').toUpperCase())||body.includes('Sanitized customer material'))
    await deleteTender(director,customer.id,{idempotencyKey:key()})
    assert.equal(await count('audit_events',customer.id),0)
  })
  console.log(`Tender retention PostgreSQL integration: ${checks} checks passed; only fictional disposable fixtures used; no external provider calls.`)
}finally{
  for(const name of envKeys){if(oldEnv[name]===undefined)delete process.env[name];else process.env[name]=oldEnv[name]}
  await getDatabasePool().end()
  if(restrictedPool)await restrictedPool.end()
  await pool.query(`drop role if exists ${applicationRole}`)
  await pool.end()
}
