import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getTenderPolicies, acknowledgeTenderPolicy, acknowledgeTenderUpload, retainedTenderPolicy, assertTenderActive, tenderExpiry } from '../../lib/tenders/retention.ts'
import { hashJson } from '../../lib/field-registry/freeze.ts'
import { MockExtractionProvider } from '../../lib/field-registry/extract-mock.ts'
import { prepareUploadChecklist } from '../../lib/desk/freeze-upload.ts'
import { verifyPacketRow } from '../../lib/tenders/integrity.ts'
import { getDonorPack } from '../../lib/field-registry/packs/index.ts'

const fixture = {organizationId:'org_fixture',mode:'demo'}
const hosted = {...fixture,mode:'workos'}
const keys = ['TRACE_EXTRACTION_PROVIDER','TRACELI_TENDER_ORGANIZATIONS','TRACELI_TENDER_CUSTOMER_ORGANIZATIONS','TRACELI_TENDER_CUSTOMER_RETENTION_DAYS','TRACELI_TENDER_CUSTOMER_POLICY_VERSION','TRACELI_TENDER_CUSTOMER_PROVIDER_DISCLOSURE']
function environment(fn) {
  const saved = Object.fromEntries(keys.map(k=>[k,process.env[k]]))
  for(const key of keys)delete process.env[key]
  try { return fn() } finally { for(const key of keys){if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key]} }
}
test('hosted intake requires explicit organization admission; synthetic policy is finite and has no external mock processing',()=>environment(()=>{
  assert.throws(()=>getTenderPolicies(hosted), e=>e.code==='organization_disabled')
  process.env.TRACELI_TENDER_ORGANIZATIONS=fixture.organizationId
  const result=getTenderPolicies(hosted)
  assert.equal(result.customerAvailable,false)
  assert.equal(result.policies[0].retentionDays,30)
  assert.equal(result.policies[0].sourceBytesRetained,false)
  assert.equal(result.policies[0].providerId,'mock')
}))
test('customer policy needs allowlisted organization, 30-day selection, exact version/disclosure and real provider',()=>environment(()=>{
  process.env.TRACELI_TENDER_ORGANIZATIONS=fixture.organizationId
  process.env.TRACELI_TENDER_CUSTOMER_ORGANIZATIONS=fixture.organizationId
  process.env.TRACELI_TENDER_CUSTOMER_RETENTION_DAYS='30'
  process.env.TRACELI_TENDER_CUSTOMER_POLICY_VERSION='approved-test-v1'
  process.env.TRACELI_TENDER_CUSTOMER_PROVIDER_DISCLOSURE='Fictional provider processing disclosure, not a legal approval.'
  assert.equal(getTenderPolicies(hosted).customerAvailable,false)
  process.env.TRACE_EXTRACTION_PROVIDER='talonic'
  const policy=getTenderPolicies(hosted).policies.find(p=>p.classification==='customer')
  assert.ok(policy)
  const ack={classification:'customer',policyVersion:policy.version,consent:true}
  assert.deepEqual(acknowledgeTenderPolicy(hosted,ack),policy)
  assert.throws(()=>acknowledgeTenderPolicy(hosted,{...ack,consent:false}))
  process.env.TRACELI_TENDER_CUSTOMER_PROVIDER_DISCLOSURE='Changed processing conditions.'
  assert.throws(()=>acknowledgeTenderPolicy(hosted,ack),e=>e.code==='policy_changed')
  process.env.TRACELI_TENDER_CUSTOMER_RETENTION_DAYS='90'
  assert.equal(getTenderPolicies(hosted).customerAvailable,false)
  process.env.TRACELI_TENDER_CUSTOMER_RETENTION_DAYS='30'
  process.env.TRACELI_TENDER_CUSTOMER_ORGANIZATIONS='org_other'
  assert.equal(getTenderPolicies(hosted).customerAvailable,false)
}))
test('pinned policy integrity, fixed expiry and legacy preservation fail closed',()=>environment(()=>{
  const policy=getTenderPolicies(fixture).policies[0],createdAt=new Date('2026-01-01T00:00:00Z')
  const workspace={retentionState:'managed',classification:'synthetic',policy,policyHash:hashJson(policy),createdAt,expiresAt:tenderExpiry(createdAt,policy),deletionRequestedAt:null}
  assert.equal(workspace.expiresAt.toISOString(),'2026-01-31T00:00:00.000Z')
  assert.deepEqual(retainedTenderPolicy(workspace),policy)
  assert.throws(()=>retainedTenderPolicy({...workspace,expiresAt:new Date('2026-02-01T00:00:00Z')}),e=>e.code==='integrity')
  assert.throws(()=>assertTenderActive(workspace,new Date('2026-01-31T00:00:00Z')),e=>e.code==='expired')
  const legacy={...workspace,retentionState:'legacy_preserved',policy:null,policyHash:null,expiresAt:null}
  assert.equal(retainedTenderPolicy(legacy),null)
  assert.doesNotThrow(()=>assertTenderActive(legacy,new Date('2050-01-01T00:00:00Z')))
  assert.throws(()=>acknowledgeTenderUpload(fixture,legacy,{classification:'synthetic',policyVersion:policy.version,consent:true}),e=>e.code==='legacy_preserved')
}))
test('classification is propagated into extracted snapshot and verified independently of receipt hashes',async()=>{
  const id='730c47ba-7b62-49ef-a3cf-040bddbda715'
  const extraction=await new MockExtractionProvider().extract({fileName:'fictional.txt',mediaType:'text/plain',bytes:new TextEncoder().encode('Fictional test packet.'),organizationId:'org_fixture',awardId:`award.${id}`,packId:'global-fund'})
  const checklist=prepareUploadChecklist({extraction,packId:'global-fund',organizationId:'org_fixture',classification:'customer'})
  assert.equal(checklist.snapshot.classification,'customer')
  const pack=getDonorPack('global-fund'),payload={checklist}
  const row={payload,payloadHash:hashJson(payload),packDefinition:pack,packDefinitionHash:hashJson(pack),sourceSha256:extraction.sourceFileHash,packId:'global-fund',packVersion:pack.version,organizationId:'org_fixture',procurementId:id,providerId:extraction.providerId,originalFilename:extraction.fileName,mediaType:extraction.mediaType,classification:'customer'}
  assert.equal(verifyPacketRow(row).snapshot.classification,'customer')
  assert.throws(()=>verifyPacketRow({...row,classification:'synthetic'}),e=>e.code==='integrity')
})
