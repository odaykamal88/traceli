// Prove 0010 refuses to admit inconsistent legacy links before altering history.
// Creates and destroys only its own randomly named loopback database.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import pg from 'pg'
const url = new URL(process.env.DATABASE_URL || 'invalid:')
if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.search || url.hash || process.env.NODE_ENV === 'production' || process.env.VERCEL) throw new Error('Migration verification requires an isolated nonproduction loopback PostgreSQL database.')
const databaseName = `trace_preflight_${randomUUID().replaceAll('-', '')}`
const admin = new pg.Client({ connectionString: url.href })
await admin.connect()
let created = false
let client
try {
  await admin.query(`create database ${databaseName}`)
  created = true
  url.pathname = `/${databaseName}`
  client = new pg.Client({ connectionString: url.href })
  await client.connect()
  for (const name of ['0001_tenant_safe_control_graph.sql', '0002_restricted_application_role.sql']) await client.query(await readFile(new URL(`../../db/migrations/${name}`, import.meta.url), 'utf8'))
  await client.query("insert into organizations(id,name) values('org_preflight','Fictional preflight tenant')")
  await client.query("insert into procurements(id,organization_id,reference,title,region,status,blocker_summary) values('p1','org_preflight','P1','Fixture','Fictional','draft','Fixture'),('p2','org_preflight','P2','Fixture','Fictional','draft','Fixture')")
  await client.query("insert into source_documents(id,organization_id,procurement_id,name,kind,access_boundary) values('doc','org_preflight','p1','Fixture','fixture','internal')")
  await client.query("insert into source_versions(id,organization_id,source_document_id,version_label,content_hash,effective_at,locked_at) values('version','org_preflight','doc','v1','metadata-only','2026-01-01T00:00:00Z',now())")
  await client.query("insert into requirements(id,organization_id,procurement_id,source_version_id,code,title,source_anchor,state) values('requirement','org_preflight','p2','version','REQ1','Fixture','line1','draft')")
  const migration = await readFile(new URL('../../db/migrations/0010_trace_workflow.sql', import.meta.url), 'utf8')
  await assert.rejects(client.query(migration), /preflight: inconsistent legacy procurement links/)
  await client.query('rollback')
  assert.equal((await client.query("select is_nullable from information_schema.columns where table_name='source_versions' and column_name='effective_at'")).rows[0].is_nullable, 'NO')
  console.log('PASS preflight rejects requirement/source procurement mismatch without changing schema')
  await client.query("update requirements set procurement_id='p1' where id='requirement'")
  await client.query("insert into findings(id,organization_id,procurement_id,requirement_id,supplier_name,status) values('finding','org_preflight','p2','requirement','Fictional supplier','unknown')")
  await assert.rejects(client.query(migration), /preflight: inconsistent legacy procurement links/)
  await client.query('rollback')
  assert.equal((await client.query("select procurement_id from findings where id='finding'")).rows[0].procurement_id, 'p2')
  console.log('PASS preflight rejects finding/requirement procurement mismatch without rewriting history')
  await client.query("update findings set procurement_id='p1' where id='finding'")
  await client.query(migration)
  const retained = (await client.query("select effective_at,effective_date_status,content_hash_kind,procurement_id from source_versions where id='version'")).rows[0]
  assert.equal(retained.effective_at.toISOString(), '2026-01-01T00:00:00.000Z')
  assert.equal(retained.effective_date_status, 'legacy_unverified')
  assert.equal(retained.content_hash_kind, 'metadata_unverified')
  assert.equal(retained.procurement_id, 'p1')
  await assert.rejects(client.query("update source_versions set content_hash='changed' where id='version'"), /immutable/)
  console.log('PASS valid upgrade retains original legacy date/hash provenance and freezes locked source versions')
} finally {
  if (client) await client.end()
  if (created) await admin.query(`drop database ${databaseName}`)
  await admin.end()
}
