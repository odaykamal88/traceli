import pg from 'pg'
import { applyMigrations } from './migration-runner.mjs'
const databaseUrl = process.env.DATABASE_URL_UNPOOLED
if (!databaseUrl) throw new Error('DATABASE_URL_UNPOOLED is required for schema migrations.')
const client = new pg.Client({ connectionString: databaseUrl })
await client.connect()
try { for (const name of await applyMigrations(client)) console.log(`Applied ${name}`) }
finally { await client.end() }
