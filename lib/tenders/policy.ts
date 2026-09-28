import 'server-only'

import { and, eq } from 'drizzle-orm'

import { tenderAccess, tenderWorkspaces } from '@/db/tender-schema'
import type { TenantTransaction } from '@/lib/db/tenant'
import { traceRole } from '@/lib/trace/access-policy'
import type { WorkspaceViewer } from '@/lib/workspace-viewer'
import { assertTenderActive, retainedTenderPolicy } from '@/lib/tenders/retention'
import { TenderError } from '@/lib/tenders/contract'

const elevatedRoles = new Set(['Procurement Director', 'Workspace Admin'])
const editRoles = new Set(['Procurement Officer', 'Panel Member', ...elevatedRoles])
const assessRoles = new Set(['Procurement Officer', ...elevatedRoles])
const allRoles = new Set([...editRoles, 'Auditor'])

export type TenderAction = 'read' | 'edit' | 'assess' | 'judge' | 'grant' | 'export' | 'delete'

export function tenderCapabilities(viewer: WorkspaceViewer, grant: 'read' | 'review' | null, isOwner = false) {
  const elevated = elevatedRoles.has(viewer.role)
  const canRead = allRoles.has(viewer.role) && (elevated || grant !== null || (viewer.role === 'Procurement Officer' && isOwner))
  const canEdit = canRead && editRoles.has(viewer.role) && (elevated || grant === 'review')
  return {
    canRead,
    canEdit,
    canAssess: canEdit && assessRoles.has(viewer.role),
    canJudge: canEdit && assessRoles.has(viewer.role),
    canProposeException: canEdit && elevated,
    canGrant: canRead && elevated,
    canExport: canRead,
    canDelete: canRead && elevated,
  }
}

export async function authorizeTender(tx: TenantTransaction, viewer: WorkspaceViewer, tenderId: string, action: TenderAction) {
  const [workspace] = await tx.select().from(tenderWorkspaces).where(and(eq(tenderWorkspaces.organizationId,viewer.organizationId),eq(tenderWorkspaces.procurementId,tenderId))).limit(1)
  if (!workspace) throw new TenderError(404,'unavailable','This tender is unavailable.')
  const [row] = await tx.select({access:tenderAccess.access}).from(tenderAccess).where(and(eq(tenderAccess.organizationId,viewer.organizationId),eq(tenderAccess.procurementId,tenderId),eq(tenderAccess.userId,viewer.id))).limit(1)
  const grant = row?.access === 'read' || row?.access === 'review' ? row.access : null
  const capabilities = tenderCapabilities(viewer,grant,workspace.ownerId===viewer.id)
  if (!capabilities.canRead) throw new TenderError(404,'unavailable','This tender is unavailable.')
  retainedTenderPolicy(workspace)
  if (action !== 'delete') assertTenderActive(workspace)
  if (action === 'delete' && workspace.retentionState !== 'managed') throw new TenderError(403,'legacy_preserved','This earlier tender is preserved and is outside the new deletion policy.')
  const allowed = action === 'read' ? capabilities.canRead : action === 'edit' ? capabilities.canEdit : action === 'assess' ? capabilities.canAssess : action === 'judge' ? capabilities.canJudge : action === 'grant' ? capabilities.canGrant : action === 'delete' ? capabilities.canDelete : capabilities.canExport
  if (!allowed) throw new TenderError(403,'forbidden','This action is unavailable for your role.')
  return { workspace, capabilities }
}

/** WorkOS remains the identity authority. Ambiguous or inactive memberships fail closed. */
export async function verifyTenderGrantTarget(organizationId: string, userId: string): Promise<string> {
  try {
    const {getWorkOS}=await import('@workos-inc/authkit-nextjs')
    const result = await getWorkOS().userManagement.listOrganizationMemberships({userId,organizationId,statuses:['active'],limit:100})
    const role = traceRole(result.data,userId,organizationId)
    if (!role || !allRoles.has(role)) throw new Error('unverified')
    return role
  } catch {
    throw new TenderError(400,'invalid_grantee','The requested member could not be verified in this organization.')
  }
}
