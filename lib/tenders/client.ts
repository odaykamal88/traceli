import { tenderRetentionPolicySchema } from '@/lib/tenders/contract'
import type { ReviewerDecision } from '@/lib/desk/review'
import type { TenderDetail, TenderIssuedRecord, TenderManual, TenderPacket, TenderSummary, TenderRetentionPolicy } from '@/lib/tenders/contract'

const activeTenderKey = 'traceli.tender.active.v1'
const tenderIdPattern = /^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i

export function tenderNavigationHref(tenderId: string | null): string {
  return tenderId && tenderIdPattern.test(tenderId) ? `/desk?tender=${encodeURIComponent(tenderId)}` : '/hub'
}

/** Navigation hint only. Every destination is authorized again by the server. */
export function readActiveTenderNavigation(organizationId: string): string | null {
  try {
    const raw = sessionStorage.getItem(activeTenderKey)
    if (!raw) return null
    const value = JSON.parse(raw) as Record<string, unknown>
    return value.organizationId === organizationId && typeof value.tenderId === 'string' && tenderIdPattern.test(value.tenderId)
      ? value.tenderId : null
  } catch { return null }
}

export function writeActiveTenderNavigation(organizationId: string, tenderId: string) {
  if (!organizationId || !tenderIdPattern.test(tenderId)) return
  try { sessionStorage.setItem(activeTenderKey, JSON.stringify({ organizationId, tenderId })) }
  catch { /* Current URL still works when browser storage is unavailable. */ }
}

export class TenderRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null,
    readonly latestRevision: number | null,
  ) { super(message); this.name = 'TenderRequestError' }
}

export function tenderIdempotencyKey() {
  return crypto.randomUUID()
}

async function readResponse<T>(response: Response): Promise<T> {
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const problem = body && typeof body === 'object' ? body as Record<string, unknown> : null
    throw new TenderRequestError(
      typeof problem?.error === 'string' ? problem.error : 'The tender service could not complete this request.',
      response.status,
      typeof problem?.code === 'string' ? problem.code : null,
      typeof problem?.latestRevision === 'number' ? problem.latestRevision : null,
    )
  }
  if (!body || typeof body !== 'object') throw new TenderRequestError('The tender service returned an unexpected response.', 500, null, null)
  return body as T
}

async function jsonRequest<T>(url: string, method: 'POST' | 'PUT' | 'DELETE', value: object): Promise<T> {
  return readResponse<T>(await fetch(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(value),
    cache: 'no-store',
  }))
}

export async function listTenders(cursor?: string): Promise<{ items: TenderSummary[], nextCursor: string | null }> {
  const url = cursor ? `/api/tenders?cursor=${encodeURIComponent(cursor)}` : '/api/tenders'
  return readResponse(await fetch(url, { cache: 'no-store' }))
}

export type TenderPolicyAcceptance = { classification: 'synthetic' | 'customer'; policyVersion: string; consent: true }

function policyResponseError(): never {
  throw new TenderRequestError('The service returned an invalid processing notice. Try loading it again.', 500, 'invalid_policy_response', null)
}

function validatedPolicy(value: unknown): TenderRetentionPolicy {
  const parsed = tenderRetentionPolicySchema.safeParse(value)
  if (!parsed.success || parsed.data.retentionDays !== 30 || (parsed.data.classification === 'customer' && parsed.data.providerId !== 'talonic')) return policyResponseError()
  return parsed.data
}

function validExpiry(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value)
}

export async function getTenderPolicies(): Promise<{ policies: TenderRetentionPolicy[]; customerAvailable: boolean }> {
  const value = await readResponse<Record<string, unknown>>(await fetch('/api/tenders/policy', { cache: 'no-store' }))
  if (!Array.isArray(value.policies) || value.policies.length < 1 || value.policies.length > 2 || typeof value.customerAvailable !== 'boolean') return policyResponseError()
  const policies = value.policies.map(validatedPolicy)
  if (new Set(policies.map(policy => policy.classification)).size !== policies.length || value.customerAvailable !== policies.some(policy => policy.classification === 'customer')) return policyResponseError()
  return { policies, customerAvailable: value.customerAvailable }
}


export async function createTender(title: string, primaryPackId: string, idempotencyKey: string, acceptance: TenderPolicyAcceptance): Promise<TenderDetail> {
  return validatedTenderDetail(await jsonRequest('/api/tenders', 'POST', { title, primaryPackId, idempotencyKey, ...acceptance }))
}

export async function deleteTender(tenderId: string, idempotencyKey: string): Promise<{ deleted: true; receiptId: string; deletedAt: string }> {
  return jsonRequest(`/api/tenders/${encodeURIComponent(tenderId)}`, 'DELETE', { idempotencyKey })
}

function validatedTenderDetail(detail: TenderDetail): TenderDetail {
  if (!detail.tender || !['synthetic', 'customer'].includes(detail.tender.classification) || !validExpiry(detail.expiresAt) || !validExpiry(detail.tender.expiresAt) || detail.expiresAt !== detail.tender.expiresAt) return policyResponseError()
  if (detail.policy === null) {
    if (detail.expiresAt !== null) return policyResponseError()
  } else {
    detail.policy = validatedPolicy(detail.policy)
    if (detail.expiresAt === null || detail.tender.classification !== detail.policy.classification) return policyResponseError()
  }
  return detail
}


export async function getTender(tenderId: string): Promise<TenderDetail> {
  return validatedTenderDetail(await readResponse(await fetch(`/api/tenders/${encodeURIComponent(tenderId)}`, { cache: 'no-store' })))
}

export async function extractTenderPacket(tenderId: string, file: File, classification: 'synthetic' | 'customer', expectedRevision: number, idempotencyKey: string, acceptance: TenderPolicyAcceptance): Promise<TenderPacket> {
  const form = new FormData()
  form.set('file', file)
  form.set('classification', classification)
  form.set('expectedRevision', String(expectedRevision))
  form.set('idempotencyKey', idempotencyKey)
  if (acceptance) {
    form.set('classification', acceptance.classification)
    form.set('policyVersion', acceptance.policyVersion)
    form.set('consent', String(acceptance.consent))
  }
  return readResponse(await fetch(`/api/tenders/${encodeURIComponent(tenderId)}/packets`, { method: 'POST', body: form, cache: 'no-store' }))
}

export async function addTenderManual(tenderId: string, file: File, label: string, expectedRevision: number, idempotencyKey: string, acceptance: TenderPolicyAcceptance): Promise<TenderManual> {
  const form = new FormData()
  form.set('file', file)
  form.set('label', label)
  form.set('expectedRevision', String(expectedRevision))
  form.set('idempotencyKey', idempotencyKey)
  if (acceptance) {
    form.set('classification', acceptance.classification)
    form.set('policyVersion', acceptance.policyVersion)
    form.set('consent', String(acceptance.consent))
  }
  return readResponse(await fetch(`/api/tenders/${encodeURIComponent(tenderId)}/manuals`, { method: 'POST', body: form, cache: 'no-store' }))
}

export async function saveTenderDraft(tenderId: string, input: {
  packetReceiptId: string
  decisions: ReviewerDecision[]
  manualVersionIds: string[]
  expectedRevision: number
  idempotencyKey: string
}): Promise<TenderDetail> {
  return validatedTenderDetail(await jsonRequest(`/api/tenders/${encodeURIComponent(tenderId)}/draft`, 'PUT', input))
}

export async function issueTenderAssessment(tenderId: string, expectedRevision: number, idempotencyKey = tenderIdempotencyKey()): Promise<TenderIssuedRecord> {
  return jsonRequest(`/api/tenders/${encodeURIComponent(tenderId)}/assessments`, 'POST', { expectedRevision, idempotencyKey })
}

export async function issueTenderJudgment(tenderId: string, input: {
  expectedRevision: number
  assessmentId: string
  assessmentHash: string
  action: 'request' | 'escalate' | 'exception'
  reason: string
  idempotencyKey: string
}): Promise<TenderIssuedRecord> {
  return jsonRequest(`/api/tenders/${encodeURIComponent(tenderId)}/judgments`, 'POST', input)
}

export async function getTenderRecord(tenderId: string, recordId: string): Promise<TenderIssuedRecord> {
  return readResponse(await fetch(`/api/tenders/${encodeURIComponent(tenderId)}/records/${encodeURIComponent(recordId)}`, { cache: 'no-store' }))
}

export async function downloadTenderReport(tenderId: string, recordId: string): Promise<{ blob: Blob, fileName: string }> {
  const response = await fetch(`/api/tenders/${encodeURIComponent(tenderId)}/records/${encodeURIComponent(recordId)}/pilot-report`, { cache: 'no-store' })
  if (!response.ok) {
    await readResponse(response)
    throw new TenderRequestError('The pilot report could not be prepared.', response.status, null, null)
  }
  const match = /filename="([^"]+)"/.exec(response.headers.get('content-disposition') ?? '')
  return { blob: await response.blob(), fileName: match?.[1] ?? 'traceli-pilot-report.pdf' }
}
