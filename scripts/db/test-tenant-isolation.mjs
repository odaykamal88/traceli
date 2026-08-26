import assert from 'node:assert/strict'

import pg from 'pg'

const databaseUrl = process.env.DATABASE_URL
const primaryOrganizationId = process.env.TRACELI_SEED_ORGANIZATION_ID
const secondaryOrganizationId = 'org_traceli_isolation_secondary'

if (!databaseUrl || !primaryOrganizationId) {
  throw new Error('DATABASE_URL and TRACELI_SEED_ORGANIZATION_ID are required for tests.')
}

const pool = new pg.Pool({ connectionString: databaseUrl, max: 3 })

async function inTenant(organizationId, operation) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SET LOCAL ROLE traceli_app')
    await client.query("SELECT set_config('app.organization_id', $1, true)", [organizationId])
    const result = await operation(client)
    await client.query('ROLLBACK')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

try {
  const primaryRows = await inTenant(primaryOrganizationId, (client) =>
    client.query('SELECT id, organization_id FROM procurements ORDER BY id'),
  )
  assert.equal(primaryRows.rowCount, 1)
  assert.equal(primaryRows.rows[0].organization_id, primaryOrganizationId)

  const secondaryRows = await inTenant(secondaryOrganizationId, (client) =>
    client.query('SELECT id, organization_id FROM procurements ORDER BY id'),
  )
  assert.equal(secondaryRows.rowCount, 1)
  assert.equal(secondaryRows.rows[0].organization_id, secondaryOrganizationId)

  const guessedSecondaryProcurement = secondaryRows.rows[0].id
  const crossTenantRead = await inTenant(primaryOrganizationId, (client) =>
    client.query('SELECT id FROM procurements WHERE id = $1', [guessedSecondaryProcurement]),
  )
  assert.equal(crossTenantRead.rowCount, 0)

  await assert.rejects(
    () =>
      inTenant(primaryOrganizationId, (client) =>
        client.query(
          `INSERT INTO findings (
            id, organization_id, procurement_id, requirement_id, supplier_name, status
          ) VALUES ('cross-tenant-write', $1, $2, 'requirement-req-07-beta', 'Blocked', 'missing_evidence')`,
          [primaryOrganizationId, guessedSecondaryProcurement],
        ),
      ),
    /foreign key|row-level security/i,
  )

  await assert.rejects(
    () =>
      inTenant(primaryOrganizationId, (client) =>
        client.query("UPDATE audit_events SET actor_name = 'Changed' WHERE sequence = 1"),
      ),
    /append-only|permission denied/i,
  )

  console.log('Tenant isolation, cross-tenant write denial, and append-only audit checks passed.')
} finally {
  await pool.end()
}
