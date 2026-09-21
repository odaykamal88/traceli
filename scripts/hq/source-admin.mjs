import {execFileSync} from 'node:child_process'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import pg from 'pg'
import {SOURCES} from '../../workers/hq/source-collector.mjs'

// Operator only; never included in the Railway deployment. Credentials stay
// in memory and are never printed, copied to a file or placed in child argv.
if (process.env.HQ_OPERATOR_ENV_FILE) process.loadEnvFile(process.env.HQ_OPERATOR_ENV_FILE)
const cli=process.env.RAILWAY_CLI_PATH || 'railway'
const config=JSON.parse(await readFile(new URL('../../workers/hq/railway-service.json',import.meta.url),'utf8'))
let vars
try {vars=JSON.parse(execFileSync(cli,['variable','list','--project',config.projectId,'--environment',config.environmentId,'--service',config.serviceId,'--json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}))}
catch {throw new Error('Preview credential lookup failed; output suppressed')}
if(typeof vars.HQ_WORKER_DATABASE_URL!=='string')throw new Error('Existing worker credential unavailable')
let runnerURL,adminURL
try {runnerURL=new URL(vars.HQ_WORKER_DATABASE_URL);adminURL=new URL(process.env.DATABASE_URL_UNPOOLED)}
catch {throw new Error('Preview credential format invalid; value suppressed')}
if(runnerURL.hostname.replace('-pooler','')!==adminURL.hostname.replace('-pooler','')||runnerURL.pathname!==adminURL.pathname||runnerURL.searchParams.get('sslmode')!=='verify-full')throw new Error('Preview database binding mismatch')
adminURL.searchParams.set('sslmode','verify-full')
const admin=new pg.Client({connectionString:adminURL.toString(),connectionTimeoutMillis:10000,statement_timeout:20000,query_timeout:22000})
try {
 await admin.connect()
 const b=(await admin.query('SELECT login_name,organization_id,actor_id,enabled FROM hq_cloud_bindings WHERE login_name=$1 AND kind=\'runner\'',[runnerURL.username])).rows[0]
 if(!b||!b.enabled)throw new Error('Existing preview runner binding unavailable')
 await admin.query("SELECT set_config('app.organization_id',$1,false),set_config('app.hq_actor_id','supervisor-source-20260921',false),set_config('app.hq_mandate_id','institutional-memory',false)",[b.organization_id])
 const mode=process.argv[2]||'inspect'
 if(mode==='inspect') {
   console.log(JSON.stringify({database_host:adminURL.hostname,organization_id:b.organization_id,runner:b.login_name,migrations:(await admin.query('SELECT name FROM traceli_schema_migrations ORDER BY name')).rows,source_schema:(await admin.query("SELECT to_regclass('hq_source_authorizations') IS NOT NULL ready")).rows[0].ready}))
 } else if(mode==='migrate') {
   // Apply only this reviewed HQ migration; do not promote product migration0010.
   const name='0011_hq_source_collection.sql',sql=await readFile(new URL('../../db/migrations/'+name,import.meta.url),'utf8'),checksum=createHash('sha256').update(sql).digest('hex')
   if(!sql.startsWith('BEGIN;')||!sql.trimEnd().endsWith('COMMIT;'))throw new Error('Unexpected migration transaction shape')
   await admin.query('BEGIN')
   await admin.query("SELECT pg_advisory_xact_lock(hashtext('hq-source-migration-0011'))")
   const prior=(await admin.query('SELECT checksum FROM traceli_schema_migrations WHERE name=$1',[name])).rows[0]
   if(prior&&prior.checksum!==checksum)throw new Error('Applied migration differs')
   if(!prior){await admin.query(sql.slice(6).trimEnd().slice(0,-7));await admin.query('INSERT INTO traceli_schema_migrations(name,checksum) VALUES($1,$2)',[name,checksum])}
   await admin.query('COMMIT')
   console.log(JSON.stringify({migration:name,verified:true}))
 } else if(mode==='provision') {
   const task=Number(process.argv[3]);if(![49,50].includes(task))throw new Error('Named source task required')
   const specs=(task===49?['wb-ipf-2025','adb-directive-2026']:['saudi-law-ar-2019','uae-law-ar-2023']).map(id=>({id,...SOURCES[id]}))
   const job='official-sources-'+task+'-20260921',claim=task===49?'49b2efbd-f5a4-4e87-a3ac-7742a2cd61f8':'f57583bc-f6a2-4340-8f90-1ea627b83875'
   await admin.query('BEGIN')
   const existing=(await admin.query('SELECT manifest FROM hq_source_authorizations WHERE organization_id=$1 AND job_id=$2',[b.organization_id,job])).rows[0]
   if(existing){if(JSON.stringify(existing.manifest)!==JSON.stringify(JSON.parse(JSON.stringify(specs)))){const same=(await admin.query('SELECT $1::jsonb=$2::jsonb same',[JSON.stringify(existing.manifest),JSON.stringify(specs)])).rows[0].same;if(!same)throw new Error('Existing job manifest differs')}}
   else {
    await admin.query("INSERT INTO hq_jobs(organization_id,id,mandate_id,source_system,objective,contract,approval_level,max_attempts) VALUES($1,$2,'institutional-memory','hq',$3,$4,'Green',2)",[b.organization_id,job,'Retrieve pinned official-source evidence for original task '+task,JSON.stringify({charter_version:'source-collection-1',source_task_id:task,reviewer:'Independent source Auditor then Supervisor; domain admission remains separate'})])
    await admin.query("INSERT INTO hq_source_authorizations(organization_id,job_id,login_name,task_id,source_claim_id,authorization_ref,expires_at,manifest,manifest_hash) VALUES($1,$2,$3,$4,$5,'oday-proceed-cloud-source-work-20260921',clock_timestamp()+interval '48 hours',$6,'placeholder')",[b.organization_id,job,b.login_name,task,claim,JSON.stringify(specs)])
   }
   await admin.query('COMMIT');console.log(JSON.stringify({job,task,authorization:(await admin.query('SELECT authorized_at,expires_at,manifest_hash FROM hq_source_authorizations WHERE organization_id=$1 AND job_id=$2',[b.organization_id,job])).rows[0]}))
 } else if(mode==='readback') {
   const jobs=(await admin.query("SELECT id,status,attempts,result FROM hq_jobs WHERE organization_id=$1 AND contract->>'charter_version'='source-collection-1' ORDER BY id",[b.organization_id])).rows
   const sources=(await admin.query('SELECT job_id,source_id,status,captured_at,octet_length(bytes) byte_length,byte_hash FROM hq_source_evidence WHERE organization_id=$1 ORDER BY job_id,source_id',[b.organization_id])).rows
   console.log(JSON.stringify({checked_at:new Date().toISOString(),jobs,sources,model_charges:(await admin.query('SELECT count(*)::int count FROM hq_cloud_charges c JOIN hq_jobs j ON(j.organization_id,j.id)=(c.organization_id,(SELECT job_id FROM hq_runs WHERE organization_id=c.organization_id AND id=c.run_id)) WHERE c.organization_id=$1 AND j.contract->>\'charter_version\'=\'source-collection-1\'',[b.organization_id])).rows[0].count}))
 } else throw new Error('Unknown mode')
} finally {await admin.end()}
