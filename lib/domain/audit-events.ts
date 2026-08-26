import 'server-only'

import { createHash, randomUUID } from 'node:crypto'

import { and, desc, eq, sql } from 'drizzle-orm'

import { auditEvents, outboxEvents } from '@/db/schema'
import type { TenantTransaction } from '@/lib/db/tenant'
import type { WorkspaceViewer } from '@/lib/workspace-viewer'

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(',')}]`
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)

    return `{${entries.join(',')}}`
  }

  return JSON.stringify(value)
}

export async function appendAuditEvent(
  transaction: TenantTransaction,
  input: {
    viewer: WorkspaceViewer
    procurementId: string
    eventType: string
    sourceLabel: string
    payload: Record<string, unknown>
    occurredAt?: Date
  },
) {
  await transaction.execute(
    sql`select pg_advisory_xact_lock(hashtextextended(${input.procurementId}, 0))`,
  )

  const [previousEvent] = await transaction
    .select({ sequence: auditEvents.sequence, eventHash: auditEvents.eventHash })
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.organizationId, input.viewer.organizationId),
        eq(auditEvents.procurementId, input.procurementId),
      ),
    )
    .orderBy(desc(auditEvents.sequence))
    .limit(1)

  const occurredAt = input.occurredAt ?? new Date()
  const sequence = (previousEvent?.sequence ?? 0) + 1
  const previousHash = previousEvent?.eventHash ?? null
  const eventId = randomUUID()
  const hashMaterial = stableJson({
    actorId: input.viewer.id,
    eventId,
    eventType: input.eventType,
    occurredAt: occurredAt.toISOString(),
    organizationId: input.viewer.organizationId,
    payload: input.payload,
    previousHash,
    procurementId: input.procurementId,
    sequence,
    sourceLabel: input.sourceLabel,
  })
  const eventHash = createHash('sha256').update(hashMaterial).digest('hex')

  await transaction.insert(auditEvents).values({
    id: eventId,
    organizationId: input.viewer.organizationId,
    procurementId: input.procurementId,
    sequence,
    eventType: input.eventType,
    actorId: input.viewer.id,
    actorName: input.viewer.name,
    sourceLabel: input.sourceLabel,
    payload: input.payload,
    previousHash,
    eventHash,
    occurredAt,
  })

  await transaction.insert(outboxEvents).values({
    id: randomUUID(),
    organizationId: input.viewer.organizationId,
    aggregateType: 'procurement',
    aggregateId: input.procurementId,
    eventType: input.eventType,
    payload: { auditEventId: eventId, eventHash },
    occurredAt,
  })

  return { eventId, eventHash, sequence }
}
