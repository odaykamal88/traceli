import { createHash } from 'node:crypto'

import pg from 'pg'

const databaseUrl = process.env.DATABASE_URL_UNPOOLED
const primaryOrganizationId = process.env.TRACELI_SEED_ORGANIZATION_ID

if (!databaseUrl || !primaryOrganizationId) {
  throw new Error(
    'DATABASE_URL_UNPOOLED and TRACELI_SEED_ORGANIZATION_ID are required for seeding.',
  )
}

const secondaryOrganizationId = 'org_traceli_isolation_secondary'
const client = new pg.Client({ connectionString: databaseUrl })

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

async function seedOrganization({ organizationId, name, suffix }) {
  await client.query('BEGIN')
  try {
    await client.query("SELECT set_config('app.organization_id', $1, true)", [organizationId])
    await client.query(
      `INSERT INTO organizations (id, name)
       VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [organizationId, name],
    )

    const procurementId = `procurement-rfp-2026-041-${suffix}`
    const sourceId = `source-rfp-2026-041-${suffix}`
    const sourceVersionId = `source-version-rfp-2026-041-${suffix}`
    const requirementId = `requirement-req-07-${suffix}`
    const findingId = `finding-req-07-northstar-${suffix}`

    await client.query(
      `INSERT INTO procurements (
        id, organization_id, reference, title, region, status,
        evidence_coverage, blocker_summary
      ) VALUES ($1, $2, 'RFP-2026-041', 'Emergency Shelter & NFI Logistics',
        'Horn of Africa', 'evaluation', 86, '1 evidence gap, 2 approvals and 1 declaration')
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        region = EXCLUDED.region,
        updated_at = now()`,
      [procurementId, organizationId],
    )

    await client.query(
      `INSERT INTO source_documents (
        id, organization_id, procurement_id, name, kind, access_boundary
      ) VALUES ($1, $2, $3, 'RFP-2026-041', 'tender', 'Panel and procurement team')
      ON CONFLICT (id) DO NOTHING`,
      [sourceId, organizationId, procurementId],
    )

    await client.query(
      `INSERT INTO source_versions (
        id, organization_id, source_document_id, version_label, content_hash,
        effective_at, locked_at
      ) VALUES ($1, $2, $3, 'Published · 02 Apr 2026', $4,
        '2026-04-02T08:00:00Z', '2026-04-02T08:00:00Z')
      ON CONFLICT (id) DO NOTHING`,
      [
        sourceVersionId,
        organizationId,
        sourceId,
        createHash('sha256').update(`fictional-rfp-2026-041-${suffix}`).digest('hex'),
      ],
    )

    await client.query(
      `INSERT INTO requirements (
        id, organization_id, procurement_id, source_version_id, code, title,
        source_anchor, state
      ) VALUES ($1, $2, $3, $4, 'REQ-07', 'Emergency delivery capacity',
        'RFP §4.2 · page 14', 'needs_clarification')
      ON CONFLICT (id) DO NOTHING`,
      [requirementId, organizationId, procurementId, sourceVersionId],
    )

    await client.query(
      `INSERT INTO findings (
        id, organization_id, procurement_id, requirement_id, supplier_name, status
      ) VALUES ($1, $2, $3, $4, 'Northstar Relief Logistics', 'missing_evidence')
      ON CONFLICT (id) DO NOTHING`,
      [findingId, organizationId, procurementId, requirementId],
    )

    await client.query(
      `INSERT INTO decisions (id, organization_id, procurement_id, state)
       VALUES ($1, $2, $3, 'draft')
       ON CONFLICT (id) DO NOTHING`,
      [`decision-rfp-2026-041-${suffix}`, organizationId, procurementId],
    )

    const seedEvents = [
      {
        id: `audit-01-${suffix}`,
        eventType: 'procurement.created',
        sourceLabel: 'RFP-2026-041 · procurement record',
        payload: { reference: 'RFP-2026-041', status: 'evaluation' },
        occurredAt: '2026-08-18T08:45:00.000Z',
      },
      {
        id: `audit-02-${suffix}`,
        eventType: 'source.version_locked',
        sourceLabel: 'RFP-2026-041 · published version',
        payload: { sourceVersionId, versionLabel: 'Published · 02 Apr 2026' },
        occurredAt: '2026-08-18T08:48:00.000Z',
      },
      {
        id: `audit-03-${suffix}`,
        eventType: 'requirement.extracted',
        sourceLabel: 'RFP §4.2 · page 14',
        payload: { code: 'REQ-07', requirementId },
        occurredAt: '2026-08-18T08:52:00.000Z',
      },
      {
        id: `audit-04-${suffix}`,
        eventType: 'finding.opened',
        sourceLabel: 'Northstar submission · evidence mapping',
        payload: { findingId, requirementId, status: 'missing_evidence' },
        occurredAt: '2026-08-19T09:14:00.000Z',
      },
    ]

    let previousHash = null
    for (const [index, event] of seedEvents.entries()) {
      const sequence = index + 1
      const hashMaterial = stableJson({
        actorId: 'seed-system',
        eventId: event.id,
        eventType: event.eventType,
        occurredAt: event.occurredAt,
        organizationId,
        payload: event.payload,
        previousHash,
        procurementId,
        sequence,
        sourceLabel: event.sourceLabel,
      })
      const eventHash = createHash('sha256').update(hashMaterial).digest('hex')

      await client.query(
        `INSERT INTO audit_events (
          id, organization_id, procurement_id, sequence, event_type, actor_id,
          actor_name, source_label, payload, previous_hash, event_hash, occurred_at
        ) VALUES ($1, $2, $3, $4, $5, 'seed-system', 'Traceli migration', $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING`,
        [
          event.id,
          organizationId,
          procurementId,
          sequence,
          event.eventType,
          event.sourceLabel,
          event.payload,
          previousHash,
          eventHash,
          event.occurredAt,
        ],
      )
      previousHash = eventHash
    }

    await client.query('COMMIT')
    return { findingId, organizationId, procurementId }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
}

await client.connect()

try {
  const primary = await seedOrganization({
    organizationId: primaryOrganizationId,
    name: 'Relief Operations',
    suffix: 'alpha',
  })
  const secondary = await seedOrganization({
    organizationId: secondaryOrganizationId,
    name: 'Isolation Test Organization',
    suffix: 'beta',
  })

  console.log(JSON.stringify({ primary, secondary }, null, 2))
} finally {
  await client.end()
}
