// This integration suite writes fictional fixtures only into a disposable loopback DB.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import pg from 'pg'
import { getDatabasePool } from '../../lib/db/client.ts'
import { createTraceUnit, readTraceUnit, listTraceUnits, recordTraceDecision, createTraceExport, downloadTraceExport, revokeTraceExport } from '../../lib/trace/store.ts'
import { buildTraceUnit, hashJson } from '../../lib/trace/fixtures.ts'

const databaseUrl = process.env.DATABASE_URL
const url = new URL(databaseUrl || 'invalid:')
if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.search || url.hash || process.env.NODE_ENV === 'production' || process.env.VERCEL) throw new Error('Trace integration tests require an isolated nonproduction loopback PostgreSQL database.')
const pool = new pg.Pool({ connectionString: databaseUrl, max: 4 })
const run = randomUUID().replaceAll('-', '')
const org = `org_trace_test_${run}`
const otherOrg = `org_trace_other_${run}`
const viewer = { id: `test-reviewer-${run}`, name: 'Fictional reviewer', email: 'fixture@example.invalid', organizationId: org, role: 'Procurement Director', mode: 'demo' }
const outsider = { ...viewer, organizationId: otherOrg }
const officer = { ...viewer, id: `test-officer-${run}`, role: 'Procurement Officer' }
const auditor = { ...viewer, id: `test-auditor-${run}`, role: 'Auditor' }
let checks = 0
async function check(name, fn) { await fn(); checks++; console.log(`PASS ${name}`) }
function denied(code) { return error => error?.code === code }
function decision(record, fields = {}) { return { unitId: record.unit.id, expectedUnitHash: record.artifactHash, expectedInputHash: record.unit.inputHash, expectedPolicyHash: record.unit.policyAssessment.hash, expectedSequence: record.decisionSequence, action: 'accept_assessment', rationale: 'Fictional scoped assessment acknowledged for local testing only.', citedEvidenceIds: [], authorityRef: null, idempotencyKey: randomUUID(), ...fields } }
function grant(record, fields = {}) { return { unitId: record.unit.id, expectedUnitHash: record.artifactHash, expectedSequence: record.decisionSequence, mode: 'redacted', purpose: 'Local synthetic review verification', idempotencyKey: randomUUID(), ...fields } }
async function inTenant(organizationId, fn) { const client = await pool.connect(); try { await client.query('begin'); await client.query('set local role traceli_app'); await client.query("select set_config('app.organization_id',$1,true)", [organizationId]); const result = await fn(client); await client.query('commit'); return result } catch(error) { await client.query('rollback'); throw error } finally { client.release() } }
async function insertUnit(client, unit, prev = unit.previousUnitId) { return client.query('insert into trace_units(id,organization_id,procurement_id,previous_unit_id,version,artifact_hash,payload,actor_id) values($1,$2,$3,$4,$5,$6,$7,$8)', [unit.id, unit.organizationId, unit.procurementId, prev, unit.version, unit.artifactHash, unit, viewer.id]) }

try {
  await pool.query('insert into organizations(id,name) values($1,$2),($3,$2)', [org, 'Disposable fictional Trace integration organization', otherOrg])
  const baseCommand = { scenario: 'missing', idempotencyKey: randomUUID() }
  let missing = await createTraceUnit(viewer, baseCommand)
  let satisfied
  await check('fixture create, read, missing evidence remains unknown', async () => { assert.equal(missing.unit.policyAssessment.result, 'unknown'); assert.equal(missing.unit.policyAssessment.proposedDisposition, 'needs_evidence'); assert.equal((await readTraceUnit(viewer, missing.unit.id)).artifactHash, missing.artifactHash) })
  await check('all bounded scenarios persist with independently visible model and policy', async () => {
    const expected = { satisfied: 'satisfied', failed: 'not_satisfied', excluded: 'not_applicable', conflict: 'conflict', unknown_date: 'unknown', timeout: 'satisfied', invalid_model: 'satisfied' }
    for (const [scenario, result] of Object.entries(expected)) {
      const record = await createTraceUnit(viewer, { scenario, idempotencyKey: randomUUID() })
      assert.equal(record.unit.policyAssessment.result, result)
      assert.equal((await readTraceUnit(viewer, record.unit.id)).artifactHash, record.artifactHash)
      if (scenario === 'satisfied') satisfied = record
      if (scenario === 'failed') assert.ok(record.unit.evaluation.distribution.supports > 0.8)
      if (['timeout', 'invalid_model'].includes(scenario)) assert.equal(record.unit.policyAssessment.proposedDisposition, 'cannot_evaluate')
    }
  })
  await check('idempotent same command; changed content and different actor rejected', async () => {
    assert.equal((await createTraceUnit(viewer, baseCommand)).unit.id, missing.unit.id)
    await assert.rejects(createTraceUnit(viewer, { ...baseCommand, scenario: 'satisfied' }), denied('idempotency_conflict'))
    await assert.rejects(createTraceUnit(officer, baseCommand), denied('idempotency_conflict'))
  })
  await check('cross-tenant read/list and revoked or weak roles denied', async () => {
    await assert.rejects(readTraceUnit(outsider, missing.unit.id), denied('not_found'))
    assert.equal((await listTraceUnits(outsider)).length, 0)
    await assert.rejects(readTraceUnit({ ...viewer, role: 'removed' }, missing.unit.id), denied('denied'))
    await assert.rejects(createTraceUnit(auditor, { scenario: 'missing', idempotencyKey: randomUUID() }), denied('denied'))
    await assert.rejects(createTraceExport(auditor, grant(satisfied, { mode: 'full' })), denied('denied'))
    await assert.rejects(recordTraceDecision(officer, decision(satisfied, { action: 'override_assessment', authorityRef: 'fixture-exception-v1', citedEvidenceIds: [satisfied.unit.evidenceSnapshot.assertions[0].id] })), denied('denied'))
  })
  await check('strict invalid decision, foreign evidence, unreviewed export, and stale hashes rejected', async () => {
    await assert.rejects(createTraceExport(viewer, grant(satisfied)), denied('invalid'))
    await assert.rejects(recordTraceDecision(viewer, decision(satisfied, { extraField: 'not accepted' })), denied('invalid'))
    await assert.rejects(recordTraceDecision(viewer, decision(satisfied, { rationale: 'short' })), denied('invalid'))
    await assert.rejects(recordTraceDecision(viewer, decision(satisfied, { citedEvidenceIds: ['foreign-version-evidence'] })), denied('invalid'))
    await assert.rejects(recordTraceDecision(viewer, decision(satisfied, { expectedPolicyHash: 'a'.repeat(64) })), denied('stale'))
  })
  await check('concurrent decisions produce one receipt and one stale-write conflict', async () => {
    const results = await Promise.allSettled([recordTraceDecision(viewer, decision(satisfied)), recordTraceDecision(viewer, decision(satisfied))])
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1)
    assert.equal(results.filter(result => result.status === 'rejected' && result.reason.code === 'stale').length, 1)
    satisfied = await readTraceUnit(viewer, satisfied.unit.id)
    assert.equal(satisfied.decisionSequence, 1)
  })
  let override
  await check('authorized override preserves policy and binds rationale/version/authority', async () => {
    const input = decision(satisfied, { action: 'override_assessment', rationale: 'PRIVATE_TEST_RATIONALE: fictional exception review retained only in the full record.', citedEvidenceIds: [satisfied.unit.evidenceSnapshot.assertions[0].id], authorityRef: 'fixture-exception-v1' })
    override = await recordTraceDecision(viewer, input)
    assert.equal(override.originalOutcome, 'satisfied')
    assert.equal(override.unitHash, satisfied.artifactHash)
    assert.equal((await recordTraceDecision(viewer, input)).id, override.id)
    await assert.rejects(recordTraceDecision(viewer, { ...input, rationale: 'Different content must never reuse the previous receipt.' }), denied('idempotency_conflict'))
    satisfied = await readTraceUnit(viewer, satisfied.unit.id)
    assert.equal(satisfied.decisionSequence, 2)
  })
  let redactedGrant
  await check('reconstructible full/redacted exports verify hashes without identity or rationale leakage', async () => {
    redactedGrant = await createTraceExport(viewer, grant(satisfied, { purpose: 'PRIVATE_EXPORT_PURPOSE synthetic review' }))
    const fullGrant = await createTraceExport(viewer, grant(satisfied, { mode: 'full', purpose: 'PRIVATE_EXPORT_PURPOSE synthetic review' }))
    const redacted = await downloadTraceExport(viewer, redactedGrant.id)
    const full = await downloadTraceExport(viewer, fullGrant.id)
    assert.equal(redacted.payloadHash, hashJson(redacted.payload))
    assert.equal(full.payloadHash, hashJson(full.payload))
    assert.ok(JSON.stringify(full).includes('PRIVATE_TEST_RATIONALE'))
    assert.equal(full.payload.authorization.recipientId, viewer.id)
    assert.ok(JSON.stringify(full).includes('PRIVATE_EXPORT_PURPOSE'))
    assert.ok(!JSON.stringify(redacted).includes('PRIVATE_EXPORT_PURPOSE'))
    assert.equal(redacted.payload.authorization.expiresAt, redactedGrant.expiresAt)
    assert.ok(!JSON.stringify(redacted).includes('PRIVATE_TEST_RATIONALE'))
    assert.ok(!JSON.stringify(redacted).includes(viewer.id))
    assert.ok(JSON.stringify(redacted).includes(satisfied.artifactHash))
    await assert.rejects(downloadTraceExport({ ...viewer, id: 'different-recipient' }, redactedGrant.id), denied('not_found'))
    await assert.rejects(downloadTraceExport({ ...viewer, role: 'Auditor' }, fullGrant.id), denied('denied'))
    await assert.rejects(downloadTraceExport(outsider, fullGrant.id), denied('not_found'))
  })
  await check('grant expiry and revocation rechecked at each download', async () => {
    const expiredId = randomUUID()
    await pool.query("insert into trace_export_grants(id,organization_id,procurement_id,unit_id,artifact_hash,decision_sequence,recipient_id,mode,purpose,created_at,expires_at) values($1,$2,$3,$4,$5,$6,$7,'redacted','Expired fictional test',now()-interval '20 minutes',now()-interval '10 minutes')", [expiredId, org, satisfied.unit.procurementId, satisfied.unit.id, satisfied.artifactHash, satisfied.decisionSequence, viewer.id])
    await assert.rejects(downloadTraceExport(viewer, expiredId), denied('denied'))
    await revokeTraceExport(viewer, redactedGrant.id)
    await revokeTraceExport(viewer, redactedGrant.id)
    await assert.rejects(downloadTraceExport(viewer, redactedGrant.id), denied('denied'))
  })
  await check('new decisions invalidate grants made against earlier review sequence', async () => {
    const oldGrant = await createTraceExport(viewer, grant(satisfied))
    await recordTraceDecision(viewer, decision(satisfied, { action: 'request_evidence' }))
    await assert.rejects(downloadTraceExport(viewer, oldGrant.id), denied('stale'))
    satisfied = await readTraceUnit(viewer, satisfied.unit.id)
  })
  await check('revision race retains immutable previous source; old review/export becomes stale', async () => {
    await recordTraceDecision(viewer, decision(missing, { action: 'request_evidence' }))
    missing = await readTraceUnit(viewer, missing.unit.id)
    const oldGrant = await createTraceExport(viewer, grant(missing))
    const revisions = await Promise.allSettled([1, 2].map(() => createTraceUnit(viewer, { scenario: 'satisfied', previousUnitId: missing.unit.id, expectedUnitHash: missing.artifactHash, expectedSequence: missing.decisionSequence, idempotencyKey: randomUUID() })))
    assert.equal(revisions.filter(result => result.status === 'fulfilled').length, 1)
    assert.equal(revisions.filter(result => result.status === 'rejected' && result.reason.code === 'stale').length, 1)
    const updated = revisions.find(result => result.status === 'fulfilled').value
    assert.equal(updated.unit.procurementId, missing.unit.procurementId)
    assert.equal(updated.unit.version, 2)
    assert.equal(updated.unit.sourceVersions[0].byteHash, missing.unit.sourceVersions[0].byteHash)
    assert.equal(updated.unit.policyPack.digest, missing.unit.policyPack.digest)
    assert.equal(updated.unit.lane, missing.unit.lane)
    assert.equal((await readTraceUnit(viewer, missing.unit.id)).supersededBy, updated.unit.id)
    assert.equal((await readTraceUnit(viewer, missing.unit.id)).artifactHash, missing.artifactHash)
    await assert.rejects(recordTraceDecision(viewer, decision(missing)), denied('stale'))
    await assert.rejects(createTraceExport(viewer, grant(missing)), denied('stale'))
    await assert.rejects(downloadTraceExport(viewer, oldGrant.id), denied('stale'))
    const corrected = await createTraceUnit(viewer, { scenario: 'satisfied', revisionKind: 'source_correction', previousUnitId: updated.unit.id, expectedUnitHash: updated.artifactHash, expectedSequence: 0, idempotencyKey: randomUUID() })
    assert.notEqual(corrected.unit.sourceVersions[0].byteHash, updated.unit.sourceVersions[0].byteHash)
    assert.equal(corrected.unit.previousUnitId, updated.unit.id)
    assert.equal((await readTraceUnit(viewer, updated.unit.id)).artifactHash, updated.artifactHash)
  })
  await check('restricted SQL role enforces tenant RLS and immutable units/decisions/grants/receipts', async () => {
    const rows = await inTenant(otherOrg, client => client.query('select id from trace_units where id=$1', [satisfied.unit.id]))
    assert.equal(rows.rowCount, 0)
    const foreignUnit = buildTraceUnit({ id: randomUUID(), organizationId: otherOrg, procurementId: satisfied.unit.procurementId, actorId: viewer.id, scenario: 'satisfied' })
    await assert.rejects(inTenant(org, client => insertUnit(client, foreignUnit)), /row-level security|foreign key/)
    for (const table of ['trace_units', 'trace_human_decisions', 'trace_export_grants', 'trace_export_receipts', 'trace_commands']) {
      await assert.rejects(inTenant(org, client => client.query(`update ${table} set id=id where organization_id=$1`, [org])), /permission denied|immutable/)
      await assert.rejects(pool.query(`delete from ${table} where organization_id=$1`, [org]), /immutable/)
    }
  })
  await check('same-tenant foreign-procurement version/decision/grant/revocation/receipt links rejected', async () => {
    const foreignPrevious = await createTraceUnit(viewer, { scenario: 'missing', idempotencyKey: randomUUID() })
    const foreignUnit = buildTraceUnit({ id: randomUUID(), organizationId: org, procurementId: satisfied.unit.procurementId, actorId: viewer.id, scenario: 'satisfied' })
    foreignUnit.previousUnitId = foreignPrevious.unit.id
    const foreignDecision = { ...override, id: randomUUID(), sequence: 99, procurementId: missing.unit.procurementId }
    const scopeGrant = await createTraceExport(viewer, grant(satisfied))
    await assert.rejects(inTenant(org, client => insertUnit(client, foreignUnit)), /foreign key/)
    await assert.rejects(inTenant(org, client => client.query('insert into trace_human_decisions(id,organization_id,procurement_id,unit_id,sequence,payload) values($1,$2,$3,$4,99,$5)', [foreignDecision.id, org, missing.unit.procurementId, satisfied.unit.id, foreignDecision])), /foreign key/)
    await assert.rejects(inTenant(org, client => client.query("insert into trace_export_grants(id,organization_id,procurement_id,unit_id,artifact_hash,decision_sequence,recipient_id,mode,purpose,expires_at) values($1,$2,$3,$4,$5,0,$6,'redacted','Scope mismatch fixture',now()+interval '10 minutes')", [randomUUID(), org, missing.unit.procurementId, satisfied.unit.id, satisfied.artifactHash, viewer.id])), /foreign key/)
    await assert.rejects(inTenant(org, client => client.query('insert into trace_export_revocations(id,organization_id,procurement_id,grant_id,actor_id) values($1,$2,$3,$4,$5)', [randomUUID(), org, missing.unit.procurementId, scopeGrant.id, viewer.id])), /foreign key/)
    await assert.rejects(inTenant(org, client => client.query('insert into trace_export_receipts(id,organization_id,procurement_id,unit_id,grant_id,recipient_id,payload_hash) values($1,$2,$3,$4,$5,$6,$7)', [randomUUID(), org, missing.unit.procurementId, missing.unit.id, scopeGrant.id, viewer.id, 'a'.repeat(64)])), /foreign key/)
  })
  await check('SQL null scope and mismatched actor payloads cannot bypass constraints', async () => {
    const unit = buildTraceUnit({ id: randomUUID(), organizationId: org, procurementId: satisfied.unit.procurementId, actorId: viewer.id, scenario: 'satisfied' })
    const nullPayload = { ...unit, organizationId: null }
    await assert.rejects(inTenant(org, client => client.query('insert into trace_units(id,organization_id,procurement_id,version,artifact_hash,payload,actor_id) values($1,$2,$3,1,$4,$5,$6)', [unit.id, org, unit.procurementId, unit.artifactHash, nullPayload, viewer.id])), /check constraint/)
    await assert.rejects(inTenant(org, client => client.query('insert into trace_units(id,organization_id,procurement_id,version,artifact_hash,payload,actor_id) values($1,$2,$3,1,$4,$5,$6)', [unit.id, org, unit.procurementId, unit.artifactHash, unit, 'wrong-actor'])), /check constraint/)
    const id = randomUUID()
    await assert.rejects(inTenant(org, client => client.query('insert into trace_human_decisions(id,organization_id,procurement_id,unit_id,sequence,payload) values($1,$2,$3,$4,99,$5)', [id, org, satisfied.unit.procurementId, satisfied.unit.id, { ...override, id, organizationId: null, sequence: 99 }])), /check constraint/)
  })
  await check('tampered stored source bytes fail read-time integrity validation', async () => {
    const corrupt = buildTraceUnit({ id: randomUUID(), organizationId: org, procurementId: satisfied.unit.procurementId, actorId: viewer.id, scenario: 'satisfied' })
    corrupt.sourceVersions[0].content += '\nTampered fictional bytes.'
    await insertUnit(pool, corrupt)
    await assert.rejects(readTraceUnit(viewer, corrupt.id), denied('invalid'))
  })
  await check('legacy sources preserve unknown provenance and enforce scope/locked immutability', async () => {
    const doc = randomUUID(), version = randomUUID(), req = randomUUID(), finding = randomUUID()
    await pool.query("insert into source_documents(id,organization_id,procurement_id,name,kind,access_boundary) values($1,$2,$3,'Legacy fixture','fixture','internal')", [doc, org, satisfied.unit.procurementId])
    for (const fields of [{ status: 'verified', effective: '2026-01-01', basis: null, reason: null }, { status: 'verified', effective: '2026-01-01', basis: '  ', reason: null }, { status: 'unknown', effective: null, basis: null, reason: null }]) {
      await assert.rejects(pool.query("insert into source_versions(id,organization_id,source_document_id,version_label,content_hash,effective_at,effective_date_status,effective_date_basis,effective_date_unknown_reason) values($1,$2,$3,'bad-date','metadata-only',$4,$5,$6,$7)", [randomUUID(), org, doc, fields.effective, fields.status, fields.basis, fields.reason]), /check constraint/)
    }
    await pool.query("insert into source_versions(id,organization_id,source_document_id,version_label,content_hash,effective_at,locked_at) values($1,$2,$3,'fixture','legacy-metadata-only',null,now())", [version, org, doc])
    const source = (await pool.query('select * from source_versions where id=$1', [version])).rows[0]
    assert.equal(source.effective_at, null); assert.equal(source.effective_date_status, 'legacy_unverified'); assert.equal(source.content_hash_kind, 'metadata_unverified'); assert.equal(source.procurement_id, satisfied.unit.procurementId)
    await pool.query("insert into requirements(id,organization_id,procurement_id,source_version_id,code,title,source_anchor,state) values($1,$2,$3,$4,'TRACE-LEGACY','Fixture requirement','fixture:1','draft')", [req, org, satisfied.unit.procurementId, version])
    await pool.query("insert into findings(id,organization_id,procurement_id,requirement_id,supplier_name,status) values($1,$2,$3,$4,'Fictional supplier','unknown')", [finding, org, satisfied.unit.procurementId, req])
    await assert.rejects(pool.query('update source_versions set effective_at=now() where id=$1', [version]), /immutable/)
    await assert.rejects(pool.query('delete from source_versions where id=$1', [version]), /immutable/)
    await assert.rejects(pool.query('update source_documents set procurement_id=$1 where id=$2', [missing.unit.procurementId, doc]), /foreign key/)
    await assert.rejects(pool.query('update requirements set procurement_id=$1 where id=$2', [missing.unit.procurementId, req]), /foreign key/)
    await assert.rejects(pool.query('update findings set procurement_id=$1 where id=$2', [missing.unit.procurementId, finding]), /foreign key/)
  })
  await check('audit failure rolls back unit, scaffold and idempotency receipt; retry succeeds', async () => {
    const rollbackActor = `rollback-${run}`
    const fn = `trace_test_fail_${run}`
    await pool.query(`create function ${fn}() returns trigger language plpgsql as $$ begin if NEW.actor_id = '${rollbackActor}' then raise exception 'Synthetic audit rollback test'; end if; return NEW; end $$`)
    await pool.query(`create trigger ${fn} before insert on audit_events for each row execute function ${fn}()`)
    const actor = { ...viewer, id: rollbackActor }
    const command = { scenario: 'missing', idempotencyKey: randomUUID() }
    const before = Number((await pool.query('select count(*) from procurements where organization_id=$1', [org])).rows[0].count)
    try {
      await assert.rejects(createTraceUnit(actor, command), error => /Synthetic audit rollback test/.test(error?.cause?.message || error?.message || ''))
      assert.equal(Number((await pool.query('select count(*) from procurements where organization_id=$1', [org])).rows[0].count), before)
      assert.equal(Number((await pool.query('select count(*) from trace_commands where idempotency_key=$1', [command.idempotencyKey])).rows[0].count), 0)
    } finally { await pool.query(`drop trigger ${fn} on audit_events`); await pool.query(`drop function ${fn}()`); }
    const retry = await createTraceUnit(actor, command)
    assert.ok(retry.unit.id)
    assert.equal(Number((await pool.query('select count(*) from audit_events where organization_id=$1 and actor_id=$2', [org, rollbackActor])).rows[0].count), 1)
  })
  console.log(`Trace PostgreSQL integration: ${checks} checks passed; synthetic test tenant retained for disposable-DB inspection.`)
} finally {
  await pool.end()
  await getDatabasePool().end()
}
