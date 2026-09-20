import assert from 'node:assert/strict'
import { test } from 'node:test'
import { evaluateJev, jevSmokePacket, publicJevReceipt } from '../../lib/hq/jev.ts'

const key='fixture-credential-DO-NOT-EXPORT'
const answer={model:'jev-1.13.0',answers:{receipt_present:{type:'noul',noul:0.73}},usage:{input_tokens:40,output_tokens:9}}
const run=(body=answer,options={})=>evaluateJev(jevSmokePacket,{apiKey:key,fetcher:async()=>Response.json(body),...options})
test('fixed synthetic request preserves noul probability, provenance, returned model and usage',async()=>{
 let sent
 const r=await run(answer,{fetcher:async(url,init)=>{sent={url,...init};return Response.json(answer)}})
 assert.equal(sent.url,'https://api.typesafe.ai/v1/systemone');assert.equal(sent.redirect,'error');assert.equal(sent.headers.Authorization,'Bearer '+key)
 assert.deepEqual(JSON.parse(sent.body),jevSmokePacket.request);assert.equal(r.status,'ok');assert.equal(r.normalized.receipt_present.noul,0.73)
 assert.equal(r.returned_model,'jev-1.13.0');assert.equal(r.input_hash.length,64);assert.deepEqual(r.raw_response,answer);assert.deepEqual(r.usage,answer.usage)
 assert.equal(r.policy_disposition,'not_evaluated');assert.equal(r.human_decision,'not_evaluated');assert.equal(r.cost_usd,null)
 assert.equal('raw_response' in publicJevReceipt(r),false);assert.equal(JSON.stringify(r).includes(key),false)
})
test('missing key and invalid/private input never dispatch',async()=>{
 let calls=0;const fetcher=async()=>{calls++;throw Error('unexpected')}
 assert.equal((await evaluateJev({...jevSmokePacket,classification:'private'},{apiKey:key,fetcher})).status,'invalid_input')
 assert.equal((await evaluateJev(jevSmokePacket,{apiKey:'',fetcher})).status,'missing_key');assert.equal(calls,0)
})
test('absent usage is unavailable, not zero; malformed usage is invalid',async()=>{
 const {usage,...body}=answer;const r=await run(body);assert.equal(r.status,'ok');assert.equal(r.usage,null);assert.equal(r.usage_status,'unavailable')
 assert.equal((await run({...answer,usage:{input_tokens:-1,output_tokens:0}})).status,'invalid_output')
})
test('missing model, missing/extra answers and non-finite/out-of-range probability fail closed',async()=>{
 for(const body of [{...answer,model:undefined},{...answer,answers:{}},{...answer,answers:{...answer.answers,extra:{type:'noul',noul:1}}},{...answer,answers:{receipt_present:{type:'noul',noul:1.2}}}]){
  const r=await run(body);assert.equal(r.status,'invalid_output');assert.equal(r.normalized,null);assert.equal(r.policy_disposition,'not_evaluated')
 }
})
test('choice validates keys, maximum choice and distribution mass',async()=>{
 const packet={...jevSmokePacket,request:{...jevSmokePacket.request,questions:{q:{type:'choice',instructions:'Choose',criteria:{present:'Present',unknown:'Unknown'}}}}}
 const valid={model:'jev-1.13.0',answers:{q:{type:'choice',choice:'present',confidence:0.6,probabilities:{present:0.8,unknown:0.2}}}}
 const check=body=>evaluateJev(packet,{apiKey:key,fetcher:async()=>Response.json(body)})
 assert.equal((await check(valid)).status,'ok')
 for(const patch of [{choice:'unknown'},{probabilities:{present:0.8}},{probabilities:{present:0.8,unknown:0.8}},{confidence:-1}])assert.equal((await check({...valid,answers:{q:{...valid.answers.q,...patch}}})).status,'invalid_output')
})
test('score retains a fractional probability-weighted value and checks rubric',async()=>{
 const packet={...jevSmokePacket,request:{...jevSmokePacket.request,questions:{q:{type:'score',instructions:'Rate',criteria:['None','Some','All']}}}}
 const a={type:'score',score:1.25,confidence:0.4,probabilities:{0:0,1:0.75,2:0.25},legend:{0:'None',1:'Some',2:'All'}}
 const check=q=>evaluateJev(packet,{apiKey:key,fetcher:async()=>Response.json({model:'jev-1.13.0',answers:{q}})})
 assert.equal((await check(a)).normalized.q.score,1.25)
 assert.equal((await check({...a,score:2})).status,'invalid_output')
 assert.equal((await check({...a,legend:{0:'Other',1:'Some',2:'All'}})).status,'invalid_output')
})
test('HTTP failures have explicit states, discard bodies and never retry',async()=>{
 for(const [status,expected]of [[401,'authentication_error'],[403,'authentication_error'],[402,'budget_error'],[429,'rate_limited'],[529,'provider_error']]){
  let calls=0;const r=await run(null,{fetcher:async()=>{calls++;return new Response(key,{status})}})
  assert.equal(r.status,expected);assert.equal(calls,1);assert.equal(r.raw_response,null);assert.equal(JSON.stringify(r).includes(key),false)
 }
})
test('timeout consumes only one request; exception strings are not exposed',async()=>{
 let calls=0;const r=await run(null,{timeoutMs:5,fetcher:async(_url,{signal})=>{calls++;return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error(key))))}})
 assert.equal(r.status,'timeout');assert.equal(calls,1);assert.equal(JSON.stringify(r).includes(key),false)
 assert.equal((await run(null,{fetcher:async()=>{throw Error(key)}})).status,'network_error')
})
test('oversized, non-JSON and credential-echoing responses are discarded',async()=>{
 const escaped=JSON.stringify({...answer,debug:key}).replace('fixture','\\u0066ixture')
 for(const body of ['x'.repeat(32001),'not JSON',JSON.stringify({...answer,debug:key}),escaped]){
  const r=await run(null,{fetcher:async()=>new Response(body)});assert.equal(r.status,'invalid_output');assert.equal(r.raw_response,null);assert.equal(JSON.stringify(r).includes(key),false)
 }
})
