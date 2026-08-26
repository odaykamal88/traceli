import 'server-only'

import { sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import { schema } from '@/db/schema'
import { getDatabase } from '@/lib/db/client'

export type TenantTransaction = NodePgDatabase<typeof schema>

export async function withTenant<T>(
  organizationId: string,
  operation: (transaction: TenantTransaction) => Promise<T>,
) {
  if (!organizationId.startsWith('org_')) {
    throw new Error('Invalid organization context.')
  }

  return getDatabase().transaction(async (transaction) => {
    await transaction.execute(sql.raw('set local role traceli_app'))
    await transaction.execute(
      sql`select set_config('app.organization_id', ${organizationId}, true)`,
    )

    return operation(transaction as TenantTransaction)
  })
}
