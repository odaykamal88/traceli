import 'server-only'

import { and, asc, count, desc, eq, ne } from 'drizzle-orm'

import {
  auditEvents,
  findings,
  organizations,
  procurements,
  requirements,
} from '@/db/schema'
import { withTenant } from '@/lib/db/tenant'
import type { WorkspaceSnapshot } from '@/lib/workspace-snapshot'
import type { WorkspaceViewer } from '@/lib/workspace-viewer'

export class WorkspaceDataUnavailableError extends Error {
  constructor() {
    super('No tenant-scoped pilot workspace is provisioned for this organization.')
  }
}

export async function getWorkspaceSnapshot(
  viewer: WorkspaceViewer,
): Promise<WorkspaceSnapshot> {
  return withTenant(viewer.organizationId, async (transaction) => {
    const [organization] = await transaction
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, viewer.organizationId))
      .limit(1)

    if (!organization) {
      throw new WorkspaceDataUnavailableError()
    }

    const [procurement] = await transaction
      .select({
        id: procurements.id,
        reference: procurements.reference,
        title: procurements.title,
        region: procurements.region,
        status: procurements.status,
        evidenceCoverage: procurements.evidenceCoverage,
        blockerSummary: procurements.blockerSummary,
        version: procurements.version,
      })
      .from(procurements)
      .where(eq(procurements.organizationId, viewer.organizationId))
      .orderBy(desc(procurements.updatedAt))
      .limit(1)

    if (!procurement) {
      throw new WorkspaceDataUnavailableError()
    }

    const [[requirementMetric], [findingMetric], [eventMetric], [lastEvent], [primaryFinding]] =
      await Promise.all([
        transaction
          .select({ value: count() })
          .from(requirements)
          .where(
            and(
              eq(requirements.organizationId, viewer.organizationId),
              eq(requirements.procurementId, procurement.id),
            ),
          ),
        transaction
          .select({ value: count() })
          .from(findings)
          .where(
            and(
              eq(findings.organizationId, viewer.organizationId),
              eq(findings.procurementId, procurement.id),
              ne(findings.status, 'satisfied'),
            ),
          ),
        transaction
          .select({ value: count() })
          .from(auditEvents)
          .where(
            and(
              eq(auditEvents.organizationId, viewer.organizationId),
              eq(auditEvents.procurementId, procurement.id),
            ),
          ),
        transaction
          .select({ occurredAt: auditEvents.occurredAt })
          .from(auditEvents)
          .where(
            and(
              eq(auditEvents.organizationId, viewer.organizationId),
              eq(auditEvents.procurementId, procurement.id),
            ),
          )
          .orderBy(desc(auditEvents.sequence))
          .limit(1),
        transaction
          .select({ id: findings.id, status: findings.status, version: findings.version })
          .from(findings)
          .where(
            and(
              eq(findings.organizationId, viewer.organizationId),
              eq(findings.procurementId, procurement.id),
            ),
          )
          .orderBy(asc(findings.createdAt))
          .limit(1),
      ])

    return {
      organization,
      procurement,
      primaryFinding: primaryFinding ?? null,
      assurance: {
        requirementCount: requirementMetric?.value ?? 0,
        openFindingCount: findingMetric?.value ?? 0,
        auditEventCount: eventMetric?.value ?? 0,
        lastEventAt: lastEvent?.occurredAt.toISOString() ?? null,
      },
      source: 'postgres',
    }
  })
}
