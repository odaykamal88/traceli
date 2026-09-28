import 'server-only'

import { hashJson } from '@/lib/field-registry/freeze'
import { resolveExtractionProviderId } from '@/lib/field-registry/extract-provider'
import { TenderError, policyAcknowledgementSchema, tenderRetentionPolicySchema, type TenderPolicyAcknowledgement, type TenderRetentionPolicy } from '@/lib/tenders/contract'
import type { WorkspaceViewer } from '@/lib/workspace-viewer'

const day = 86_400_000
type PolicyViewer = Pick<WorkspaceViewer, 'organizationId' | 'mode'>

export function assertTenderOrganization(viewer: PolicyViewer) {
  if (viewer.mode === 'demo' && process.env.NODE_ENV !== 'production' && !process.env.VERCEL) return
  const admitted = (process.env.TRACELI_TENDER_ORGANIZATIONS ?? '').split(',').map(s => s.trim()).filter(Boolean)
  if (!admitted.includes(viewer.organizationId)) throw new TenderError(403, 'organization_disabled', 'Saved tender intake is not enabled for this organization.')
}

/** Policy configuration is trusted server configuration, never a browser assertion. */
export function getTenderPolicies(viewer: PolicyViewer): { policies: TenderRetentionPolicy[]; customerAvailable: boolean } {
  assertTenderOrganization(viewer)
  const providerId = resolveExtractionProviderId()
  const disclosure = providerId === 'mock'
    ? 'Fictional test extraction runs locally without an external extraction provider.'
    : 'The fictional file is sent to Talonic for extraction. Traceli does not retain file bytes. Talonic processing and retention are separate from Traceli retention.'
  const synthetic = { classification: 'synthetic' as const, retentionDays: 30, description: 'Fictional test data only. Access to names, file metadata, extracted values, short quotes, edits and issued records ends 30 days from creation. This tender is deleted together by the next successful daily cleanup. Database backup retention is separate and has not been verified by this policy.', providerId, providerDisclosure: disclosure, sourceBytesRetained: false as const }
  const policies: TenderRetentionPolicy[] = [{ ...synthetic, version: `synthetic-${hashJson(synthetic).slice(0,24)}` }]
  const organizations = (process.env.TRACELI_TENDER_CUSTOMER_ORGANIZATIONS ?? '').split(',').map(s => s.trim()).filter(Boolean)
  const rawDays = process.env.TRACELI_TENDER_CUSTOMER_RETENTION_DAYS ?? ''
  const retentionDays = /^\d+$/.test(rawDays) ? Number(rawDays) : 0
  const configuredVersion = process.env.TRACELI_TENDER_CUSTOMER_POLICY_VERSION?.trim() ?? ''
  const providerDisclosure = process.env.TRACELI_TENDER_CUSTOMER_PROVIDER_DISCLOSURE?.trim() ?? ''
  if (providerId === 'talonic' && organizations.includes(viewer.organizationId) && retentionDays === 30 && configuredVersion && configuredVersion.length <= 64 && providerDisclosure && providerDisclosure.length <= 2000) {
    const customer = { classification: 'customer' as const, retentionDays, description: `Only irreversibly sanitized customer material within the organization's approved processing route. Access to names, file metadata, extracted values, short quotes, edits and issued records ends ${retentionDays} days from creation. This tender is deleted together by the next successful daily cleanup. Database backup retention is separate and has not been verified by this policy. This acknowledgement does not establish processing agreements or approve sensitive data.`, providerId, providerDisclosure, sourceBytesRetained: false as const }
    policies.push({ ...customer, version: `${configuredVersion}-${hashJson(customer).slice(0,24)}` })
  }
  return { policies, customerAvailable: policies.some(p => p.classification === 'customer') }
}

export function acknowledgeTenderPolicy(viewer: PolicyViewer, input: unknown): TenderRetentionPolicy {
  const acknowledgement = policyAcknowledgementSchema.parse(input)
  const policy = getTenderPolicies(viewer).policies.find(p => p.classification === acknowledgement.classification)
  if (!policy) throw new TenderError(403, 'customer_data_disabled', 'Customer intake is not enabled for this organization and processing route.')
  if (acknowledgement.policyVersion !== policy.version) throw new TenderError(409, 'policy_changed', 'The data policy changed. Review it again before continuing.')
  return policy
}

export function retainedTenderPolicy(workspace: { retentionState: string; policy: Record<string, unknown>|null; policyHash: string|null; classification: string; expiresAt: Date|null; createdAt: Date }): TenderRetentionPolicy|null {
  if (workspace.retentionState === 'legacy_preserved' && workspace.policy === null && workspace.policyHash === null && workspace.expiresAt === null) return null
  const parsed = tenderRetentionPolicySchema.safeParse(workspace.policy)
  if (workspace.retentionState !== 'managed' || !parsed.success || hashJson(parsed.data) !== workspace.policyHash || parsed.data.classification !== workspace.classification || !workspace.expiresAt || workspace.expiresAt.getTime() !== workspace.createdAt.getTime() + parsed.data.retentionDays * day) throw new TenderError(500, 'integrity', 'The retained data policy failed its integrity check.')
  return parsed.data
}

export function acknowledgeTenderUpload(viewer: PolicyViewer, workspace: Parameters<typeof retainedTenderPolicy>[0], acknowledgement: TenderPolicyAcknowledgement) {
  const pinned = retainedTenderPolicy(workspace)
  if (!pinned) throw new TenderError(403, 'legacy_preserved', 'Create a new tender under the current data policy before adding files. This earlier record is preserved.')
  const current = acknowledgeTenderPolicy(viewer, acknowledgement)
  if (current.version !== pinned.version || current.classification !== pinned.classification) throw new TenderError(409, 'policy_changed', 'This tender uses a different data policy. Create a tender under the current policy for new uploads.')
  return pinned
}

export function tenderExpiry(createdAt: Date, policy: TenderRetentionPolicy) { return new Date(createdAt.getTime() + policy.retentionDays * day) }

export function assertTenderActive(workspace: { expiresAt: Date|null; deletionRequestedAt: Date | null }, now = new Date()) {
  if (workspace.deletionRequestedAt) throw new TenderError(404, 'deleted', 'This tender has been deleted.')
  if (workspace.expiresAt && workspace.expiresAt <= now) throw new TenderError(404, 'expired', 'This tender has expired under its data policy.')
}
