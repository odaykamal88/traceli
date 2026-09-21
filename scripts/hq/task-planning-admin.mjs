import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import pg from 'pg'

// Operator only. Bind the admin connection to the existing Railway preview
// database; never save or print credentials, and never run the migration glob.
let client, phase = 'configuration'
try {
  const mode = process.argv[2] || 'inspect'
  if (!['inspect', 'migrate'].includes(mode)) throw new Error('Invalid mode')
  if (process.env.HQ_OPERATOR_ENV_FILE) process.loadEnvFile(process.env.HQ_OPERATOR_ENV_FILE)
  const config = JSON.parse(await readFile(new URL('../../workers/hq/railway-service.json', import.meta.url), 'utf8'))
  const vars = JSON.parse(execFileSync(process.env.RAILWAY_CLI_PATH || 'railway', ['variable', 'list', '--project', config.projectId, '--environment', config.environmentId, '--service', config.serviceId, '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))
  const runner = new URL(vars.HQ_WORKER_DATABASE_URL), admin = new URL(process.env.DATABASE_URL_UNPOOLED)
  if (!['postgres:', 'postgresql:'].includes(admin.protocol) || !['postgres:', 'postgresql:'].includes(runner.protocol) || runner.hostname.replace('-pooler', '') !== admin.hostname.replace('-pooler', '') || runner.pathname !== admin.pathname || runner.searchParams.get('sslmode') !== 'verify-full') throw new Error('Preview binding mismatch')
  admin.searchParams.set('sslmode', 'verify-full')
  client = new pg.Client({ connectionString: admin.toString(), connectionTimeoutMillis: 10000, statement_timeout: 20000, query_timeout: 22000 })
  phase = 'preview-preflight'
  await client.connect()
  const binding = (await client.query("SELECT organization_id FROM hq_cloud_bindings WHERE login_name=$1 AND kind='runner' AND enabled", [runner.username])).rows[0]
  if (!binding || !(await client.query('SELECT 1 FROM hq_operating_ingestors WHERE organization_id=$1 AND enabled', [binding.organization_id])).rowCount) throw new Error('Preview identities unavailable')
  const name = '0012_hq_task_planning_metadata.sql'
  const sql = await readFile(new URL('../../db/migrations/' + name, import.meta.url), 'utf8')
  const checksum = createHash('sha256').update(sql).digest('hex')
  const prerequisite = '0006_hq_operating_feed.sql'
  const prerequisiteHash = createHash('sha256').update(await readFile(new URL('../../db/migrations/' + prerequisite, import.meta.url))).digest('hex')
  if ((await client.query('SELECT checksum FROM traceli_schema_migrations WHERE name=$1', [prerequisite])).rows[0]?.checksum !== prerequisiteHash) throw new Error('Source feed migration differs')
  const before = (await client.query("SELECT oid,proowner,proacl::text FROM pg_proc WHERE oid='hq_operating_ingest(jsonb)'::regprocedure")).rows[0]
  if (mode === 'inspect') {
    const prior = (await client.query('SELECT checksum FROM traceli_schema_migrations WHERE name=$1', [name])).rows[0]
    console.log(JSON.stringify({ migration: name, checksum, prerequisite_verified: true, applied: !!prior, checksum_matches: prior ? prior.checksum === checksum : null, changes: 'Optional task priority and revision metadata only' }))
  } else {
    phase = 'metadata-migration'
    if (!sql.startsWith('BEGIN;') || !sql.trimEnd().endsWith('COMMIT;')) throw new Error('Unexpected transaction shape')
    await client.query('BEGIN')
    await client.query("SELECT pg_advisory_xact_lock(hashtext('hq-task-planning-migration-0012'))")
    const prior = (await client.query('SELECT checksum FROM traceli_schema_migrations WHERE name=$1', [name])).rows[0]
    if (prior && prior.checksum !== checksum) throw new Error('Applied migration differs')
    if (!prior) {
      await client.query(sql.slice(6).trimEnd().slice(0, -7))
      const after = (await client.query("SELECT oid,proowner,proacl::text FROM pg_proc WHERE oid='hq_operating_ingest(jsonb)'::regprocedure")).rows[0]
      if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Function identity or permissions changed')
      await client.query('INSERT INTO traceli_schema_migrations(name,checksum) VALUES($1,$2)', [name, checksum])
    }
    await client.query('COMMIT')
    console.log(JSON.stringify({ migration: name, checksum, verified: true, other_migrations_applied: false }))
  }
} catch {
  await client?.query('ROLLBACK').catch(() => {})
  console.error('HQ task metadata operation failed at ' + phase + '; credential and database output suppressed.')
  process.exitCode = 1
} finally {
  await client?.end()
}
