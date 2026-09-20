import assert from 'node:assert/strict'
import { beforeEach, after, mock, test } from 'node:test'
const original={...process.env};let events,calls,ownerMode,dbFails,providerFails,commits
const binding={ownerUserId:'user_00000000000000000000000001',organizationId:'org_00000000000000000000000001'}
mock.module(new URL('../../lib/hq/access.ts',import.meta.url).href,{namedExports:{requireHQViewer:async()=>{if(ownerMode==='denied')throw Error('denied');return {mode:ownerMode}}}})
mock.module(new URL('../../lib/db/client.ts',import.meta.url).href,{namedExports:{getDatabasePool:()=>({connect:async()=>{
 if(dbFails)throw Error('database unavailable')
 return {release(){},async query(sql,values){
  if(sql==='COMMIT')commits++
  if(sql.includes('INSERT INTO hq_events')){
   const id=values[1];if(events.has(id)){assert.match(sql,/ON CONFLICT/);return {rows:[],rowCount:0}}
   events.set(id,{id,evidence:JSON.parse(values[3])});return {rows:[{id}],rowCount:1}
  }
  if(sql.startsWith('SELECT id,evidence'))return {rows:[...events.values()]}
  return {rows:[],rowCount:0}
 }}
}})}})
mock.module(new URL('../../lib/hq/jev.ts',import.meta.url).href,{namedExports:{JEV_SMOKE_ID:'jev-connectivity-20260920-v1',jevSmokePacket:{classification:'synthetic'},jsonHash:()=> 'a'.repeat(64),publicJevReceipt:r=>r,evaluateJev:async()=>{assert.ok(commits>=1,'reservation committed before provider');calls++;if(providerFails)throw Error('interrupted');return {status:'ok',policy_disposition:'not_evaluated'}}}})
const {jevPreviewAllowed,readJevSmoke,runJevSmoke}=await import('../../lib/hq/jev-smoke.ts')
const {GET,POST}=await import('../../app/api/hq/jev-smoke/route.ts')
beforeEach(()=>{process.env={...original,VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'codex/trace-li-hq',TRACELI_HQ_OWNER_USER_ID:binding.ownerUserId,TRACELI_HQ_ORGANIZATION_ID:binding.organizationId,TYPESAFE_API_KEY:'fixture-secret'};events=new Map();calls=0;commits=0;ownerMode='workos';dbFails=false;providerFails=false})
after(()=>{process.env=original;mock.restoreAll()})
const post=(options={})=>new Request('https://hq.example.invalid/api/hq/jev-smoke',{method:'POST',headers:{origin:'https://hq.example.invalid','sec-fetch-site':'same-origin','content-type':'application/x-www-form-urlencoded',...options.headers},body:options.body??'test_id=jev-connectivity-20260920-v1'})
test('GET never generates; repeated POST returns original receipt without another call',async()=>{
 const page=await GET();assert.equal(page.status,200);assert.equal(page.headers.get('Referrer-Policy'),'same-origin');assert.equal(calls,0)
 assert.equal((await POST(post())).status,200);assert.equal(calls,1)
 const again=await (await POST(post())).json();assert.equal(again.reused,true);assert.equal(calls,1);assert.equal(events.size,2)
 await GET();assert.equal(calls,1)
})
test('preview and owner gates reject production, other branch and local access',async()=>{
 assert.equal(jevPreviewAllowed({VERCEL_ENV:'production',VERCEL_GIT_COMMIT_REF:'codex/trace-li-hq'}),false)
 process.env.VERCEL_ENV='production';assert.equal((await POST(post())).status,404)
 process.env.VERCEL_ENV='preview';process.env.VERCEL_GIT_COMMIT_REF='other';assert.equal((await GET()).status,404)
 process.env.VERCEL_GIT_COMMIT_REF='codex/trace-li-hq';ownerMode='local';assert.equal((await POST(post())).status,404)
 ownerMode='denied';await assert.rejects(()=>POST(post()),/denied/);assert.equal(calls,0);assert.equal(events.size,0)
})
test('foreign origin, unexpected input and extra fields never reserve or dispatch',async()=>{
 assert.equal((await POST(post({headers:{origin:'https://other.invalid'}}))).status,403)
 assert.equal((await POST(post({headers:{origin:'null'}}))).status,403)
 assert.equal((await POST(post({headers:{'sec-fetch-site':'cross-site'}}))).status,403)
 assert.equal((await POST(post({body:'test_id=other'}))).status,400)
 assert.equal((await POST(post({body:'test_id=jev-connectivity-20260920-v1&state=private'}))).status,400)
 assert.equal((await POST(post({body:'x'.repeat(257)}))).status,413)
 assert.equal(calls,0);assert.equal(events.size,0)
})
test('missing key or storage fails before reservation/provider call',async()=>{
 delete process.env.TYPESAFE_API_KEY;assert.equal((await runJevSmoke(binding)).state,'missing_key');assert.equal(events.size,0)
 process.env.TYPESAFE_API_KEY='fixture-secret';dbFails=true;assert.equal((await GET()).status,503);assert.equal((await POST(post())).status,503);assert.equal(calls,0)
})
test('concurrent callers share durable reservation; interrupted calls stay unknown',async()=>{
 await Promise.all([runJevSmoke(binding),runJevSmoke(binding)]);assert.equal(calls,1)
 events.clear();calls=0;providerFails=true;await assert.rejects(()=>runJevSmoke(binding),/interrupted/)
 providerFails=false;assert.equal((await runJevSmoke(binding)).state,'unknown');assert.equal(calls,1);assert.equal((await readJevSmoke(binding)).state,'unknown')
})
