import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import pg from 'pg'
import { applyMigrations } from './migration-runner.mjs'
const url = new URL(process.env.DATABASE_URL ?? 'invalid:')
if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['127.0.0.1','localhost','[::1]'].includes(url.hostname) || url.search || url.hash || process.env.NODE_ENV === 'production' || process.env.VERCEL) throw new Error('Only disposable loopback databases may run migration tests.')
const databaseName = `migration_runner_${randomUUID().replaceAll('-', '')}`
const directory = await mkdtemp(join(tmpdir(), 'traceli-migration-test-'))
const admin = new pg.Client({ connectionString: url.href })
let client, created = false
await admin.connect()
try {
  await admin.query(`CREATE DATABASE ${databaseName}`); created = true
  url.pathname = `/${databaseName}`
  client = new pg.Client({ connectionString: url.href }); await client.connect()
  await writeFile(join(directory,'0001_fixture.sql'), 'BEGIN; CREATE TABLE fixture (id integer PRIMARY KEY); COMMIT;')
  await writeFile(join(directory,'0002_fixture.sql'), 'BEGIN; INSERT INTO nonexistent_fixture VALUES (1); COMMIT;')
  await assert.rejects(applyMigrations(client,directory), error => error.code === '42P01')
  const failed = await client.query("SELECT to_regclass('public.fixture') AS fixture, to_regclass('public.traceli_schema_migrations') AS ledger")
  assert.deepEqual(failed.rows[0], { fixture:null, ledger:null })
  console.log('PASS failed migration rolls back earlier pending schema and ledger together')
  await writeFile(join(directory,'0002_fixture.sql'), 'BEGIN; INSERT INTO fixture VALUES (1); COMMIT;')
  assert.deepEqual(await applyMigrations(client,directory), ['0001_fixture.sql','0002_fixture.sql'])
  assert.deepEqual(await applyMigrations(client,directory), [])
  assert.equal((await client.query('SELECT count(*)::int AS n FROM fixture')).rows[0].n, 1)
  console.log('PASS successful migration records atomically and replay is idempotent')
  await writeFile(join(directory,'0002_fixture.sql'), 'BEGIN; INSERT INTO fixture VALUES (2); COMMIT;')
  await writeFile(join(directory,'0003_fixture.sql'), 'BEGIN; CREATE TABLE later_fixture (id integer); COMMIT;')
  await assert.rejects(applyMigrations(client,directory), /has changed/)
  assert.equal((await client.query("SELECT to_regclass('public.later_fixture') AS relation")).rows[0].relation, null)
  console.log('PASS changed history rejects all pending changes')
} finally {
  if (client) await client.end()
  if (created) await admin.query(`DROP DATABASE ${databaseName}`)
  await admin.end()
  await rm(directory,{recursive:true,force:true})
}
