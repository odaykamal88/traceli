import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import pg from 'pg'

const databaseUrl = process.env.DATABASE_URL_UNPOOLED

if (!databaseUrl) {
  throw new Error('DATABASE_URL_UNPOOLED is required for schema migrations.')
}

const migrationsDirectory = resolve('db/migrations')
const migrationFiles = (await readdir(migrationsDirectory))
  .filter((name) => name.endsWith('.sql'))
  .sort()
const client = new pg.Client({ connectionString: databaseUrl })

await client.connect()

try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS traceli_schema_migrations (
      name text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `)

  for (const name of migrationFiles) {
    const migration = await readFile(resolve(migrationsDirectory, name), 'utf8')
    const checksum = createHash('sha256').update(migration).digest('hex')
    const existing = await client.query(
      'SELECT checksum FROM traceli_schema_migrations WHERE name = $1',
      [name],
    )

    if (existing.rowCount) {
      if (existing.rows[0].checksum !== checksum) {
        throw new Error(`Applied migration ${name} has changed.`)
      }
      continue
    }

    await client.query(migration)
    await client.query(
      'INSERT INTO traceli_schema_migrations (name, checksum) VALUES ($1, $2)',
      [name, checksum],
    )
    console.log(`Applied ${name}`)
  }
} finally {
  await client.end()
}
