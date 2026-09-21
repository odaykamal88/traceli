import test from 'node:test'
import assert from 'node:assert/strict'
import {EventEmitter} from 'node:events'
import {Readable} from 'node:stream'
import {SOURCES,MAX_BYTES,isPublicAddress,validateSource,collectSource,runSourceCycle} from './source-collector.mjs'
const source={id:'wb-ipf-2025',...SOURCES['wb-ipf-2025']}
const publicLookup=async()=>[{address:'93.184.216.34',family:4}]
function response(status,headers,bytes,inspect=()=>{}) { return (url,options,callback)=>{
  inspect(url,options)
  const req=new EventEmitter();req.end=()=>{const res=Readable.from(bytes);res.statusCode=status;res.headers=headers;callback(res)};return req
} }
test('reject non-public DNS answers including mapped IPv6 and special ranges',()=>{
  for(const ip of ['127.0.0.1','10.1.2.3','100.64.0.1','169.254.169.254','172.16.0.1','192.168.1.1','198.18.0.1','224.0.0.1','::1','::ffff:127.0.0.1','fc00::1','fe80::1','2001:db8::1','2002:7f00:1::','not-ip'])assert.equal(isPublicAddress(ip),false,ip)
  assert.equal(isPublicAddress('93.184.216.34'),true);assert.equal(isPublicAddress('2606:4700::1111'),true)
})
test('exact manifest prevents endpoint/header/URL substitutions',()=>{
  validateSource(source)
  for(const url of ['http://127.0.0.1/',source.url+'#x',source.url.replace('thedocs.','evil.'),'https://user:pass@thedocs.worldbank.org/'])assert.throws(()=>validateSource({...source,url}))
  assert.throws(()=>validateSource({...source,sha256:'0'.repeat(64)}))
})
test('DNS failure prevents any connection',async()=>{
  let connected=false
  const r=await collectSource(source,{lookupImpl:async()=>[{address:'127.0.0.1',family:4}],requestImpl:()=>{connected=true}})
  assert.equal(r.status,'network_error');assert.equal(connected,false)
})
test('pin approved DNS result and reject all redirects without sending credentials',async()=>{
  const r=await collectSource(source,{lookupImpl:publicLookup,requestImpl:response(302,{location:'http://127.0.0.1'},[],(url,o)=>{
    assert.equal(o.servername,url.hostname);assert.equal(o.agent,false)
    assert.deepEqual(Object.keys(o.headers).sort(),['Accept','Accept-Encoding','User-Agent'])
    o.lookup('ignored',{},(err,address,family)=>{assert.equal(err,null);assert.equal(address,'93.184.216.34');assert.equal(family,4)})
  })})
  assert.equal(r.status,'http_error');assert.equal(r.bytes_base64,undefined)
})
test('reject invalid content types, encoding, declared and streamed oversized data',async()=>{
  for(const [headers,chunks,status] of [
    [{'content-type':'text/html'},[],'content_type'],
    [{'content-type':'application/pdf','content-encoding':'gzip'},[],'content_encoding'],
    [{'content-type':'application/pdf','content-length':String(MAX_BYTES+1)},[],'too_large'],
    [{'content-type':'application/pdf'},[Buffer.alloc(MAX_BYTES+1)],'too_large'],
    [{'content-type':'application/pdf'},[Buffer.from('<html>blocked</html>')],'not_pdf'],
    [{'content-type':'application/pdf'},[Buffer.from('%PDF-false')],'digest_mismatch'],
  ]) assert.equal((await collectSource(source,{lookupImpl:publicLookup,requestImpl:response(200,headers,chunks)})).status,status)
})
test('elapsed deadline cannot begin a network attempt',async()=>{
  const r=await collectSource(source,{deadline:0,lookupImpl:()=>{throw new Error('must not call')}});assert.equal(r.status,'deadline')
})
test('DNS wait and interrupted response bodies stop without retaining partial bytes',async()=>{
  const dns=await collectSource(source,{deadline:performance.now()+15,lookupImpl:()=>new Promise(()=>{})})
  assert.equal(dns.status,'deadline')
  for(const abort of [false,true]) {
    const result=await collectSource(source,{deadline:performance.now()+25,lookupImpl:publicLookup,requestImpl:(_url,options,callback)=>{
      const req=new EventEmitter()
      req.end=()=>{
        const res=new Readable({read(){}});res.statusCode=200;res.headers={'content-type':'application/pdf'};callback(res)
        res.push(Buffer.from('%PDF-partial'))
        if(abort)options.signal.addEventListener('abort',()=>{res.destroy(new Error('aborted'));req.emit('error',new Error('aborted'))},{once:true})
        else res.destroy(new Error('body interrupted'))
      }
      return req
    }})
    assert.equal(result.status,abort?'deadline':'network_error');assert.equal(result.bytes_base64,undefined)
  }
})
test('overall worker deadline reserves submission time even after slow connection',async()=>{
  const deadlines=[],sources=[source,{id:'adb-directive-2026',...SOURCES['adb-directive-2026']}]
  let calls=0
  const db={query:async()=>++calls===1?{rows:[{claim:{run_id:'r',lease_token:'t',manifest_hash:'h',sources,lease_remaining_ms:119900}}]}:{rows:[{result:{status:'review'}}]}}
  await runSourceCycle({db,monotonicNow:()=>60000,overallDeadline:105000,collect:async(s,o)=>{deadlines.push(o.deadline);return{id:s.id,status:'deadline',captured_at:new Date().toISOString()}}})
  assert.deepEqual(deadlines,[90000,90000])
})
test('no authorized job makes no network call',async()=>{
  assert.equal(await runSourceCycle({db:{query:async()=>({rows:[{claim:null}]})},collect:()=>{throw new Error('must not call')}}),null)
})
test('claim pins every result and submits bounded failure without inventing bytes',async()=>{
  const calls=[]
  const db={query:async(sql,args)=>{calls.push({sql,args});return calls.length===1?{rows:[{claim:{run_id:'r',lease_token:'t',manifest_hash:'h',sources:[source],lease_remaining_ms:119900}}]}:{rows:[{result:{status:'review'}}]}}}
  assert.deepEqual(await runSourceCycle({db,collect:async()=>({id:source.id,status:'http_error',captured_at:new Date().toISOString()})}),{status:'review',model_called:false})
  assert.deepEqual(calls[1].args.slice(0,3),['r','t','h']);assert.equal(JSON.parse(calls[1].args[3])[0].bytes_base64,undefined)
})
