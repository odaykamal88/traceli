import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import pg from 'pg'

const address = new URL(process.env.HQ_TEST_DATABASE_URL || 'postgresql://postgres@127.0.0.1:55441/traceli_hq_test')
if (address.hostname !== '127.0.0.1' || address.pathname !== '/traceli_hq_test' || address.search || !address.port) throw new Error('Only isolated local HQ fixtures are permitted')
const admin = new pg.Client({ connectionString: address.toString() })
await admin.connect()
const suffix = randomUUID().replaceAll('-', '').slice(0, 10)
const owner = `hq_plan_owner_${suffix}`, ingestor = `hq_plan_ingest_${suffix}`, org = `org_plan_${suffix}`
const password = `fixture_${randomUUID().replaceAll('-', '')}`
let source
try {
  // Test the actual SECURITY DEFINER with a non-superuser owner and a restricted
  // session_user, matching the separate hosted ingestion principal boundary.
  await admin.query(`CREATE ROLE ${owner} NOLOGIN NOINHERIT NOSUPERUSER NOCREATEROLE NOCREATEDB NOBYPASSRLS;
    GRANT USAGE,CREATE ON SCHEMA public TO ${owner};
    GRANT ALL ON hq_operating_ingestors,hq_operating_sources TO ${owner};
    ALTER FUNCTION hq_operating_ingest(jsonb) OWNER TO ${owner};
    CREATE ROLE ${ingestor} LOGIN PASSWORD '${password}' NOINHERIT NOSUPERUSER NOCREATEROLE NOCREATEDB NOBYPASSRLS;
    GRANT traceli_hq_source_ingestor TO ${ingestor} WITH INHERIT FALSE;`)
  await admin.query('INSERT INTO organizations(id,name) VALUES($1,$2)', [org, 'Fictional task planning fixture'])
  await admin.query("INSERT INTO hq_operating_ingestors VALUES($1,$2,true,'appgprj_6a94833e5918819180fb17a031f5711e')", [ingestor, org])
  const url = new URL(address); url.username = ingestor; url.password = password
  source = new pg.Client({ connectionString: url.toString() }); await source.connect()
  await source.query('SET ROLE traceli_hq_source_ingestor')
  await assert.rejects(source.query('SELECT * FROM hq_operating_sources'), /permission denied/)
  const base = { id: 48, title: 'Fictional task', owner: 'Codex', lane: 'Platform', status: 'blocked', due: 'TBD', week: '2026-09-14', updated_at: new Date().toISOString() }
  let at = Date.now()
  const packet = task => ({ schema_version: 1, source_id: 'appgprj_6a94833e5918819180fb17a031f5711e', captured_at: new Date(++at).toISOString(), records: { tasks: [task], metrics: [], reviews: [], latest: [], receipt_count: 0 } })
  const ingest = p => source.query('SELECT hq_operating_ingest($1::jsonb) value', [JSON.stringify(p)]).then(result => result.rows[0].value)
  const saved = () => admin.query('SELECT records FROM hq_operating_sources WHERE organization_id=$1', [org]).then(result => result.rows[0].records.tasks[0])
  assert.equal((await ingest(packet(base))).status, 'changed')
  assert.deepEqual(await saved(), base)
  const extended = { ...base, priority: 'later', revision: 3 }
  const current = packet(extended)
  assert.equal((await ingest(current)).status, 'changed')
  assert.deepEqual(await saved(), extended)
  assert.equal((await ingest(current)).status, 'unchanged')
  await assert.rejects(ingest({ ...current, records: { ...current.records, tasks: [{ ...extended, priority: 'normal' }] } }), /Conflicting capture replay/)
  for (const fields of [{ priority: null }, { priority: 'urgent' }, { priority: 1 }, { revision: null }, { revision: '1' }, { revision: -1 }, { revision: 1.5 }, { revision: 9007199254740992 }]) {
    await assert.rejects(ingest(packet({ ...base, ...fields })), /Invalid task (priority|revision)/)
  }
  for (const field of ['note', 'packet', 'update_count', 'latest_update_at']) {
    await assert.rejects(ingest(packet({ ...base, [field]: 'private' })), /Non-metadata field rejected/)
  }
  assert.deepEqual(await saved(), extended) // Every rejected packet leaves the mirror unchanged.
  assert.equal((await ingest(packet({ ...base, priority: 'normal', revision: 0 }))).status, 'changed')
  assert.equal((await ingest(packet({ ...base, revision: Number.MAX_SAFE_INTEGER }))).status, 'changed')
  assert.equal((await ingest(packet(base))).status, 'changed') // Source rollback remains compatible.
  await admin.query('UPDATE hq_operating_ingestors SET enabled=false WHERE login_name=$1', [ingestor])
  await assert.rejects(ingest(packet(extended)), /Source identity denied/)
  console.log(JSON.stringify({ passed: 'Legacy and extended metadata, immutable replay, invalid/null values, private fields, unchanged rejection state, restricted/revoked source identity', rejected_variants: 12, paid_calls: 0 }))
} finally {
  await source?.end()
  await admin.end()
}
