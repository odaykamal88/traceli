import 'server-only'

import { hashJson, verifyFrozenRecord } from '@/lib/field-registry/freeze'
import { sanitizeUploadChecklist } from '@/lib/desk/review'
import { TenderError } from '@/lib/tenders/contract'

export function verifyPacketRow(row: { payload: Record<string,unknown>; payloadHash: string; packDefinition: Record<string,unknown>; packDefinitionHash: string; sourceSha256: string; packId: string; packVersion: string; organizationId:string; procurementId:string; providerId:string; classification:string; originalFilename:string; mediaType:string }) {
  if (hashJson(row.payload) !== row.payloadHash || hashJson(row.packDefinition) !== row.packDefinitionHash) throw new TenderError(500,'integrity','The saved packet failed its integrity check.')
  const checklist = sanitizeUploadChecklist(row.payload.checklist)
  if (!checklist || hashJson(checklist.snapshot) !== checklist.snapshotHash || checklist.sourceFileHash !== row.sourceSha256 || checklist.packId !== row.packId || checklist.packVersion !== row.packVersion || checklist.organizationId !== row.organizationId || checklist.awardId !== `award.${row.procurementId}` || checklist.providerId !== row.providerId || checklist.snapshot.classification !== row.classification || checklist.fileName !== row.originalFilename || checklist.mediaType !== row.mediaType) throw new TenderError(500,'integrity','The saved packet failed its integrity check.')
  if (row.packDefinition.packId !== row.packId || row.packDefinition.version !== row.packVersion) throw new TenderError(500,'integrity','The saved pack failed its integrity check.')
  return checklist
}

export function verifyDraftRow(row: {payload:Record<string,unknown>;payloadHash:string;actorId:string;createdAt:Date}) {
  if (hashJson(row.payload) !== row.payloadHash || row.payload.reviewedBy !== row.actorId || row.payload.reviewedAt !== row.createdAt.toISOString()) throw new TenderError(500,'integrity','The saved draft failed its integrity check.')
  return row.payload
}

export function verifyIssuedRow(row: {payload:Record<string,unknown>;payloadHash:string;snapshotHash:string;packsHash:string;kind:string;id:string;issuedBy:string;issuedAt:Date}) {
  if (hashJson(row.payload) !== row.payloadHash) throw new TenderError(500,'integrity','The issued record failed its integrity check.')
  if (row.kind === 'assessment' || row.kind === 'human_judgment') {
    const record = verifyFrozenRecord(row.payload)
    if (record.recordId !== row.id || record.snapshotHash !== row.snapshotHash || record.packsHash !== row.packsHash || record.frozenBy !== row.issuedBy || record.frozenAt !== row.issuedAt.toISOString()) throw new TenderError(500,'integrity','The issued record failed its integrity check.')
    return record
  }
  const p = row.payload
  if (p.schemaVersion !== 'exception-proposal-v1' || p.recordId !== row.id || p.snapshotHash !== row.snapshotHash || p.packsHash !== row.packsHash || p.actorId !== row.issuedBy || p.issuedAt !== row.issuedAt.toISOString() || p.status !== 'approval_not_recorded') throw new TenderError(500,'integrity','The exception proposal failed its integrity check.')
  return p
}
