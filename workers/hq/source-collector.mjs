import { createHash } from 'node:crypto'
import { lookup } from 'node:dns/promises'
import { request } from 'node:https'
import { isIP, BlockList } from 'node:net'

// Reviewed public-source targets. Neither queue text nor fetched content can
// choose an endpoint, headers, provider, filesystem path or another tool.
export const SOURCES = Object.freeze({
  'wb-ipf-2025': { title: 'World Bank IPF Procurement Regulations, seventh edition, September 2025', url: 'https://thedocs.worldbank.org/en/doc/c84273d1b230aeb2b0b8134de5dc8cd7-0290012025/original/Procurement-Regulations-7th-Edition-Sep-2025.pdf', sha256: '7f118ac8fa8949ef23790d84f74c975a98c4bba4effd69328ead58d71578b6f3' },
  'adb-directive-2026': { title: 'ADB Procurement Directive for Borrowers', url: 'https://www.adb.org/sites/default/files/institutional-document/1144641/procurement-directive-adb-borrowers.pdf', sha256: '14006d5077000d3be2ca9e858ab1175aae6293eae66525ef2f2a6de4025e2928' },
  'saudi-law-ar-2019': { title: 'Saudi Government Tenders and Procurement Law, Arabic base instrument', url: 'https://ncgr.gov.sa/documents/194168/197296/tender2019%2BN.pdf/8f40185e-8b92-7260-e18d-a03b16955794?download=true&t=1781209588289&version=1.0', sha256: '09677b3e5f3308a58982dde8d949d8c71024ce6db273bc282ae4deac516680ec' },
  'uae-law-ar-2023': { title: 'UAE Federal Government Procurement Law 11/2023, Arabic instrument', url: 'https://mof.gov.ae/wp-content/uploads/2024/01/%D9%82%D8%A7%D9%86%D9%88%D9%86-%D8%A7%D9%84%D9%85%D8%B4%D8%AA%D8%B1%D9%8A%D8%A7%D8%AA-%D9%81%D9%8A-%D8%A7%D9%84%D8%AD%D9%83%D9%88%D9%85%D8%A9-%D8%A7%D9%84%D8%A7%D8%AA%D8%AD%D8%A7%D8%AF%D9%8A%D8%A9.pdf', sha256: '82b19b1c36115867514d099f3a48d8054284495c70b0da54aa13093fe9a0087d' },
})
for (const source of Object.values(SOURCES)) Object.freeze(source)
export const MAX_BYTES = 4 * 1024 * 1024
const denied = new BlockList()
for (const [ip, bits] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',4],['240.0.0.0',4]]) denied.addSubnet(ip,bits,'ipv4')
const global6 = new BlockList(); global6.addSubnet('2000::',3,'ipv6')
for (const [ip,bits] of [['2001::',23],['2001:db8::',32],['2002::',16],['3fff::',20]]) denied.addSubnet(ip,bits,'ipv6')
export function isPublicAddress(address) {
  const family=isIP(address)
  return family===4 ? !denied.check(address,'ipv4') : family===6 && global6.check(address,'ipv6') && !denied.check(address,'ipv6')
}
export function validateSource(source) {
  const fixed=SOURCES[source?.id]
  if (!fixed || source.url!==fixed.url || source.sha256!==fixed.sha256) throw new Error('Source is not approved')
  return new URL(fixed.url)
}
function failure(id,status) { return { id, status, captured_at:new Date().toISOString() } }

export async function collectSource(source, { deadline=performance.now()+45000, lookupImpl=lookup, requestImpl=request }={}) {
  const url=validateSource(source)
  const remaining=Math.min(45000,Math.floor(deadline-performance.now()))
  if (remaining<=0) return failure(source.id,'deadline')
  const controller=new AbortController()
  const timer=setTimeout(()=>controller.abort(),remaining)
  try {
    const addresses=await Promise.race([lookupImpl(url.hostname,{all:true,verbatim:true}),new Promise((_,reject)=>controller.signal.addEventListener('abort',()=>reject(new Error('deadline')),{once:true}))])
    if (!addresses.length || addresses.some(x=>!isPublicAddress(x.address))) return failure(source.id,'network_error')
    // Pin the vetted address to this TLS connection; certificate verification
    // still uses the original hostname. No redirects, cookies or credentials.
    const pinned=addresses[0]
    return await new Promise(resolve=>{
      let finished=false
      const end=value=>{if(!finished){finished=true;resolve(value)}}
      const req=requestImpl(url,{method:'GET',agent:false,signal:controller.signal,servername:url.hostname,
        headers:{Accept:'application/pdf','Accept-Encoding':'identity','User-Agent':'Traceli-Source-Inventory/1.0'},
        lookup:(_host,options,callback)=>options.all ? callback(null,[pinned]) : callback(null,pinned.address,pinned.family),
      },res=>{
        const fail=status=>{res.destroy();end(failure(source.id,status))}
        if(res.statusCode!==200) return fail('http_error')
        if((res.headers['content-type']||'').split(';')[0].trim().toLowerCase()!=='application/pdf') return fail('content_type')
        if(res.headers['content-encoding'] && res.headers['content-encoding']!=='identity') return fail('content_encoding')
        if(Number(res.headers['content-length'])>MAX_BYTES) return fail('too_large')
        let size=0; const chunks=[]
        res.on('data',chunk=>{size+=chunk.length;if(size>MAX_BYTES)fail('too_large');else chunks.push(chunk)})
        res.on('error',()=>end(failure(source.id,controller.signal.aborted?'deadline':'network_error')))
        res.on('end',()=>{
          if(finished)return
          const bytes=Buffer.concat(chunks)
          if(!bytes.subarray(0,5).equals(Buffer.from('%PDF-'))) return fail('not_pdf')
          if(createHash('sha256').update(bytes).digest('hex')!==source.sha256) return fail('digest_mismatch')
          end({id:source.id,status:'retained',captured_at:new Date().toISOString(),bytes_base64:bytes.toString('base64')})
        })
      })
      req.on('error',()=>end(failure(source.id,controller.signal.aborted?'deadline':'network_error')))
      req.end()
    })
  } catch { return failure(source.id,controller.signal.aborted?'deadline':'network_error') }
  finally { clearTimeout(timer) }
}

export async function runSourceCycle({ db, collect=collectSource, monotonicNow=()=>performance.now(), overallDeadline=Infinity }) {
  const started=monotonicNow()
  const claim=(await db.query('SELECT public.hq_source_claim() AS claim')).rows[0].claim
  if(!claim)return null
  if(!Array.isArray(claim.sources)||claim.sources.length<1||claim.sources.length>4||new Set(claim.sources.map(s=>s.id)).size!==claim.sources.length||!Number.isFinite(claim.lease_remaining_ms)||claim.lease_remaining_ms<20000||claim.lease_remaining_ms>120000)throw new Error('Invalid source claim')
  claim.sources.forEach(validateSource)
  const deadline=Math.min(started+Math.min(100000,claim.lease_remaining_ms-15000),overallDeadline-15000)
  const results=[]
  for(const source of claim.sources)results.push(await collect(source,{deadline}))
  const result=(await db.query('SELECT public.hq_source_submit($1,$2,$3,$4::jsonb) AS result',[claim.run_id,claim.lease_token,claim.manifest_hash,JSON.stringify(results)])).rows[0].result
  return {...result,model_called:false}
}
