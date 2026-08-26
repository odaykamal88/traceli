import 'server-only'

import { and, eq, sql } from 'drizzle-orm'

import { findings, procurements } from '@/db/schema'
import { withTenant } from '@/lib/db/tenant'
import { appendAuditEvent } from '@/lib/domain/audit-events'
import type { WorkspaceViewer } from '@/lib/workspace-viewer'

const findingReviewerRoles = new Set([
  'Procurement Officer',
  'Panel Member',
  'Procurement Director',
  'Workspace Admin',
])

export class FindingConflictError extends Error {}
export class FindingForbiddenError extends Error {}

export async function recordFindingDetermination(
  viewer: WorkspaceViewer,
  input: {
    findingId: string
    expectedVersion: number
    determination: 'satisfied' | 'not_satisfied'
    reason: string
  },
) {
  if (!findingReviewerRoles.has(viewer.role)) {
    throw new FindingForbiddenError('This role cannot record a supplier finding.')
  }

  if (!input.reason.trim() || input.reason.length > 1_000 || input.expectedVersion < 1) {
    throw new Error('Invalid finding determination.')
  }

  return withTenant(viewer.organizationId, async (transaction) => {
    const [updatedFinding] = await transaction
      .update(findings)
      .set({
        status: input.determination,
        humanDetermination: input.reason.trim(),
        reviewerId: viewer.id,
        reviewerName: viewer.name,
        reviewedAt: new Date(),
        updatedAt: new Date(),
        version: input.expectedVersion + 1,
      })
      .where(
        and(
          eq(findings.id, input.findingId),
          eq(findings.organizationId, viewer.organizationId),
          eq(findings.version, input.expectedVersion),
        ),
      )
      .returning({
        id: findings.id,
        procurementId: findings.procurementId,
        requirementId: findings.requirementId,
        status: findings.status,
        version: findings.version,
      })

    if (!updatedFinding) {
      throw new FindingConflictError('The finding changed or is not available in this workspace.')
    }

    const [procurement] = await transaction
      .update(procurements)
      .set({
        evidenceCoverage: input.determination === 'satisfied' ? 100 : 86,
        blockerSummary:
          input.determination === 'satisfied'
            ? '2 approvals and 1 declaration remain'
            : 'Evidence gap remains open',
        updatedAt: new Date(),
        version: sql`${procurements.version} + 1`,
      })
      .where(
        and(
          eq(procurements.id, updatedFinding.procurementId),
          eq(procurements.organizationId, viewer.organizationId),
        ),
      )
      .returning({ id: procurements.id })

    if (!procurement) {
      throw new FindingConflictError('The procurement is not available in this workspace.')
    }

    const audit = await appendAuditEvent(transaction, {
      viewer,
      procurementId: updatedFinding.procurementId,
      eventType: 'finding.human_determination_recorded',
      sourceLabel: `${updatedFinding.requirementId} · reviewer determination`,
      payload: {
        determination: input.determination,
        findingId: updatedFinding.id,
        findingVersion: updatedFinding.version,
        reason: input.reason.trim(),
        requirementId: updatedFinding.requirementId,
      },
    })

    return {
      findingId: updatedFinding.id,
      findingVersion: updatedFinding.version,
      status: updatedFinding.status,
      auditEventId: audit.eventId,
      auditSequence: audit.sequence,
    }
  })
}
