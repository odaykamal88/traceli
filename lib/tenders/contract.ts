import { z } from 'zod'

import type { UploadChecklist, ReviewerDecision } from '@/lib/desk/review'
import type { FrozenDecisionRecord } from '@/lib/field-registry/freeze'

export const tenderIdSchema = z.uuid()
export const idempotencyKeySchema = z.string().trim().min(8).max(160).regex(/^[A-Za-z0-9._:-]+$/)
export const revisionSchema = z.number().int().min(0)
export const createTenderSchema = z.strictObject({ title: z.string().trim().min(1).max(160), primaryPackId: z.enum(['global-fund','fcdo-prime','unfpa','ocha-cbpf']), idempotencyKey: idempotencyKeySchema })
export const saveDraftSchema = z.strictObject({ packetReceiptId: tenderIdSchema, decisions: z.array(z.strictObject({ key: z.string().min(1).max(120), action: z.enum(['confirm','present','negative','stated_absent','missing']), value: z.string().max(4000), page: z.string().max(8), quote: z.string().max(500), note: z.string().max(500) })).max(256), manualVersionIds: z.array(tenderIdSchema).max(32), expectedRevision: revisionSchema, idempotencyKey: idempotencyKeySchema })
export const issueAssessmentSchema = z.strictObject({ expectedRevision: revisionSchema, idempotencyKey: idempotencyKeySchema })
export const issueJudgmentSchema = z.strictObject({ expectedRevision: revisionSchema, assessmentId: tenderIdSchema, assessmentHash: z.string().regex(/^[a-f0-9]{64}$/), action: z.enum(['request','escalate','exception']), reason: z.string().trim().min(20).max(2000), idempotencyKey: idempotencyKeySchema })

export type TenderSummary = { id: string; reference: string; title: string; primaryPackId: string; packVersion: string; revision: number; updatedAt: string; latestRecordKind: string | null }
export type TenderManual = { id: string; ordinal: number; label: string; fileName: string; mediaType: string; byteSize: number; sha256: string; hashKind: 'server_verified_upload' | 'client_declared_unverified'; recordedAt: string }
export type TenderPacket = { receiptId: string; checklist: UploadChecklist; packDefinitionHash: string; sourceSha256: string; createdAt: string }
export type TenderDraft = { id: string; revision: number; packetReceiptId: string; checklist: UploadChecklist; decisions: ReviewerDecision[]; manualVersionIds: string[]; reviewedSnapshotHash: string | null; createdAt: string }
export type TenderRecordSummary = { id: string; kind: 'assessment' | 'human_judgment' | 'exception_proposal'; draftId: string; parentRecordId: string | null; snapshotHash: string; packsHash: string; payloadHash: string; issuedAt: string }
export type TenderDetail = { tender: TenderSummary; revision: number; etag: string; draft: TenderDraft | null; packets: TenderPacket[]; manuals: TenderManual[]; records: TenderRecordSummary[]; capabilities: { canEdit: boolean; canAssess: boolean; canJudge: boolean; canProposeException: boolean; canGrant: boolean; canExport: boolean } }
export type TenderIssuedRecord = TenderRecordSummary & { payload: FrozenDecisionRecord | Record<string, unknown> }

export class TenderError extends Error {
  readonly status: 400 | 403 | 404 | 409 | 413 | 500
  readonly code: string
  readonly latestRevision?: number
  constructor(status: 400 | 403 | 404 | 409 | 413 | 500, code: string, message: string, latestRevision?: number) { super(message); this.name = 'TenderError'; this.status=status; this.code=code; this.latestRevision=latestRevision }
}
