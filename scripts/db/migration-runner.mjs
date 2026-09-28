import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
export async function applyMigrations(client, directory = resolve('db/migrations')) {
  const names = (await readdir(directory)).filter(name => name.endsWith('.sql')).sort()
  const migrations = await Promise.all(names.map(async name => {
    const source = await readFile(resolve(directory, name), 'utf8')
    const match = /^\s*BEGIN;\s*([\s\S]*?)\s*COMMIT;\s*$/i.exec(source)
    if (!match) throw new Error(`Migration ${name} needs an explicit outer transaction.`)
    return { name, body: match[1], checksum: createHash('sha256').update(source).digest('hex') }
  }))
  const applied = []
  await client.query('BEGIN')
  try {
    await client.query("SET LOCAL lock_timeout = '5s'")
    await client.query("SET LOCAL statement_timeout = '120s'")
    await client.query("SELECT pg_advisory_xact_lock(hashtext('traceli-schema-migrations'))")
    await client.query('CREATE TABLE IF NOT EXISTS traceli_schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())')
    const ledger = await client.query('SELECT name, checksum FROM traceli_schema_migrations')
    for (const migration of migrations) {
      const existing = ledger.rows.find(row => row.name === migration.name)
      if (existing && existing.checksum !== migration.checksum) throw new Error(`Applied migration ${migration.name} has changed.`)
    }
    for (const migration of migrations) {
      if (ledger.rows.some(row => row.name === migration.name)) continue
      await client.query(migration.body)
      await client.query('INSERT INTO traceli_schema_migrations (name, checksum) VALUES ($1, $2)', [migration.name, migration.checksum])
      applied.push(migration.name)
    }
    await client.query('COMMIT')
    return applied
  } catch (error) { await client.query('ROLLBACK'); throw error }
}
