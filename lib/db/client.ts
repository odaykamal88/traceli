import 'server-only'

import { attachDatabasePool } from '@vercel/functions'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { schema } from '@/db/schema'

let pool: Pool | undefined
let database: NodePgDatabase<typeof schema> | undefined

function databaseUrl() {
  const value = process.env.DATABASE_URL

  if (!value) {
    throw new Error('The protected workspace database is not configured.')
  }

  return value
}

export function getDatabasePool() {
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl(),
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 5_000,
      max: 10,
    })
    attachDatabasePool(pool)
  }

  return pool
}

export function getDatabase() {
  if (!database) {
    database = drizzle(getDatabasePool(), { schema })
  }

  return database
}
