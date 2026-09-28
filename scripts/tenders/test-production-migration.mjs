// Rehearse the observed production ledger order with fictional legacy data only.
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { mkdtemp, readdir, copyFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import pg from 'pg'
import { applyMigrations } from '../db/migration-runner.mjs'

const address=new URL(process.env.DATABASE_URL || 'invalid:')
if(!['postgres:','postgresql:'].includes(address.protocol)||!['127.0.0.1','localhost','[::1]'].includes(address.hostname)||address.search||address.hash||process.env.NODE_ENV==='production'||process.env.VERCEL)throw new Error('Migration rehearsal requires a disposable nonproduction loopback database.')
const name=`tender_production_order_${randomUUID().replaceAll('-','')}`,admin=new pg.Client({connectionString:address.href})
const root=resolve('db/migrations'),temporary=await mkdtemp(join(tmpdir(),'tender-production-order-'))
const initial=join(temporary,'initial'),beforeRetention=join(temporary,'before-retention')
const {mkdir}=await import('node:fs/promises')
await mkdir(initial);await mkdir(beforeRetention)
const names=(await readdir(root)).filter(n=>n.endsWith('.sql')).sort()
for(const migration of names){
  if(!migration.startsWith('0010')&&!migration.startsWith('0012')&&!migration.startsWith('0013'))await copyFile(join(root,migration),join(initial,migration))
  if(!migration.startsWith('0013'))await copyFile(join(root,migration),join(beforeRetention,migration))
}
const fingerprint = async client => {
  const rows={}
  rows.procurements=(await client.query('select id,organization_id,reference,title,region,status,evidence_coverage,blocker_summary,version,created_at,updated_at from procurements order by id')).rows
  rows.documents=(await client.query('select id,organization_id,procurement_id,name,kind,access_boundary,created_at from source_documents order by id')).rows
  rows.versions=(await client.query('select id,organization_id,source_document_id,version_label,content_hash,effective_at,locked_at,created_at from source_versions order by id')).rows
  rows.requirements=(await client.query('select * from requirements order by id')).rows
  rows.findings=(await client.query('select * from findings order by id')).rows
  return createHash('sha256').update(JSON.stringify(rows)).digest('hex')
}
let client,created=false
await admin.connect()
try{
  await admin.query(`create database ${name}`);created=true
  const scoped=new URL(address);scoped.pathname=`/${name}`
  client=new pg.Client({connectionString:scoped.href});await client.connect()
  await applyMigrations(client,initial)
  const ledger=(await client.query('select name from traceli_schema_migrations order by name')).rows.map(r=>r.name)
  assert.equal(ledger.length,10);assert.ok(ledger.at(-1).startsWith('0011'))
  await client.query("insert into organizations(id,name) values('org_production_rehearsal','Fictional retained organization')")
  await client.query("insert into procurements(id,organization_id,reference,title,region,status,blocker_summary) values('legacy-a','org_production_rehearsal','A','Legacy fixture A','Unknown','draft',''),('legacy-b','org_production_rehearsal','B','Legacy fixture B','Unknown','draft','')")
  await client.query("insert into source_documents(id,organization_id,procurement_id,name,kind,access_boundary) values('doc-a','org_production_rehearsal','legacy-a','Fictional source A','manual','Panel and procurement team'),('doc-b','org_production_rehearsal','legacy-b','Fictional source B','manual','All staff · read only')")
  await client.query("insert into source_versions(id,organization_id,source_document_id,version_label,content_hash,effective_at,locked_at) values('version-a','org_production_rehearsal','doc-a','v1','retained-metadata-a','2026-01-01T00:00:00Z','2026-01-02T00:00:00Z'),('version-b','org_production_rehearsal','doc-b','v2','retained-metadata-b','2026-02-01T00:00:00Z','2026-02-02T00:00:00Z')")
  await client.query("insert into requirements(id,organization_id,procurement_id,source_version_id,code,title,source_anchor,state) values('req-a','org_production_rehearsal','legacy-a','version-a','REQ-A','Fictional retained requirement','page-1','unknown')")
  await client.query("insert into findings(id,organization_id,procurement_id,requirement_id,supplier_name,status) values('finding-a','org_production_rehearsal','legacy-a','req-a','Fictional retained supplier','unknown')")
  const before=await fingerprint(client)
  const applied=await applyMigrations(client,root)
  assert.deepEqual(applied,['0010_trace_workflow.sql','0012_tender_workspaces.sql','0013_tender_retention.sql'])
  assert.equal(await fingerprint(client),before)
  assert.equal((await client.query("select count(*)::int as amount from source_versions where effective_date_status='legacy_unverified' and content_hash_kind='metadata_unverified'")).rows[0].amount,2)
  assert.deepEqual(await applyMigrations(client,root),[])
  console.log('PASS observed production order 0001–0009 plus 0011 atomically admits 0010/0012/0013; original legacy source fingerprints unchanged; replay is a no-op')
  await client.end();client=null
  const legacyName=`tender_legacy_retention_${randomUUID().replaceAll('-','')}`
  await admin.query(`create database ${legacyName}`)
  try{
    scoped.pathname=`/${legacyName}`;client=new pg.Client({connectionString:scoped.href});await client.connect()
    await applyMigrations(client,beforeRetention)
    await client.query("insert into organizations(id,name) values('org_earlier_tender','Fictional earlier tender organization')")
    await client.query("insert into procurements(id,organization_id,reference,title,region,status,blocker_summary) values('earlier-tender','org_earlier_tender','EARLIER','Fictional earlier record','Unknown','draft','')")
    await client.query("insert into tender_workspaces(organization_id,procurement_id,owner_id,primary_pack_id,pack_version,updated_at) values('org_earlier_tender','earlier-tender','earlier-actor','global-fund','earlier-version','2020-01-01T00:00:00Z')")
    await client.query("insert into tender_packet_receipts(id,organization_id,procurement_id,pack_id,pack_version,pack_definition,pack_definition_hash,source_sha256,original_filename,media_type,byte_size,provider_id,classification,payload,payload_hash,issued_by) values('earlier-packet','org_earlier_tender','earlier-tender','global-fund','earlier-version','{}',$1,$1,'fictional-earlier.txt','text/plain',123,'mock','synthetic','{\"originalRecordSentinel\":\"Preserve these bytes\"}',$1,'earlier-actor')",['0'.repeat(64)])
    const original=(await client.query("select * from tender_packet_receipts where id='earlier-packet'")).rows[0]
    assert.deepEqual(await applyMigrations(client,root),['0013_tender_retention.sql'])
    assert.deepEqual((await client.query("select * from tender_packet_receipts where id='earlier-packet'")).rows[0],original)
    const retained=(await client.query("select retention_state,policy,policy_hash,expires_at,updated_at from tender_workspaces where procurement_id='earlier-tender'")).rows[0]
    assert.equal(retained.retention_state,'legacy_preserved');assert.equal(retained.policy,null);assert.equal(retained.expires_at,null);assert.equal(retained.policy_hash,null);assert.equal(retained.updated_at.toISOString(),'2020-01-01T00:00:00.000Z')
    console.log('PASS 0013 adds no expiry or deletion policy to an existing tender and preserves its original immutable receipt and timestamps')
    await client.query('begin')
    await client.query('set local role traceli_app')
    await client.query("select set_config('app.organization_id','org_earlier_tender',true)")
    await assert.rejects(client.query("insert into tender_manual_versions(id,organization_id,procurement_id,ordinal,version_label,label,original_filename,media_type,byte_size,sha256,hash_kind,recorded_by) values('oversized-manual','org_earlier_tender','earlier-tender',1,'v1','Fictional','fictional.txt','text/plain',4194305,$1,'server_verified_upload','fictional-actor')",['0'.repeat(64)]),/exceeds 4 MB/)
    await client.query('rollback')
    console.log('PASS final migration refuses durable upload metadata above 4 MiB under ordinary application role')
  }finally{if(client){await client.end();client=null}await admin.query(`drop database ${legacyName}`)}
}finally{
  if(client)await client.end()
  if(created)await admin.query(`drop database ${name}`)
  await admin.end();await rm(temporary,{recursive:true,force:true})
}
