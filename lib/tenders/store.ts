import 'server-only'

import { createHash, randomUUID } from 'node:crypto'
import { and, desc, eq, inArray, isNotNull, lt, or, sql } from 'drizzle-orm'

import { procurements } from '@/db/schema'
import { tenderAccess, tenderCommands, tenderDraftManuals, tenderDraftRevisions, tenderExportReceipts, tenderIssuedRecords, tenderManualVersions, tenderPacketReceipts, tenderWorkspaces } from '@/db/tender-schema'
import { applyReviewerDecisions } from '@/lib/desk/review-apply'
import { incompleteCorrectionCount, sanitizeReviewerDecisions } from '@/lib/desk/review'
import { prepareUploadChecklist } from '@/lib/desk/freeze-upload'
import { withTenant, type TenantTransaction } from '@/lib/db/tenant'
import { appendAuditEvent } from '@/lib/domain/audit-events'
import { extractParsedUpload } from '@/lib/field-registry/extract-upload'
import { extractionFileName, resolveExtractionMedia } from '@/lib/field-registry/extract'
import { dispositionFromAwardDeskDecision, freezeAtJudgment, hashJson } from '@/lib/field-registry/freeze'
import { evaluateJudgment } from '@/lib/field-registry/judgment'
import type { JudgmentRule } from '@/lib/field-registry/judgment'
import { getDonorPack, isDonorPackId } from '@/lib/field-registry/packs'
import { packToggleForDonorPack, type DonorPack } from '@/lib/field-registry/packs/types'
import { resolveExtractionProviderId } from '@/lib/field-registry/extract-provider'
import { dispositionSchema, type ActorRole, type AwardRegistrySnapshot } from '@/lib/field-registry/schema'
import type { WorkspaceViewer } from '@/lib/workspace-viewer'
import { createTenderSchema, idempotencyKeySchema, issueAssessmentSchema, issueJudgmentSchema, revisionSchema, saveDraftSchema, tenderIdSchema, TenderError, type TenderDetail, type TenderDraft, type TenderIssuedRecord, type TenderManual, type TenderPacket, type TenderRecordSummary, type TenderSummary } from '@/lib/tenders/contract'
import { verifyDraftRow, verifyIssuedRow, verifyPacketRow } from '@/lib/tenders/integrity'
import { authorizeTender, tenderCapabilities, verifyTenderGrantTarget, type TenderAction } from '@/lib/tenders/policy'
import { tenderOwner, tenderProgress, type TenderWorkflowState } from '@/lib/tenders/workflow'
import { renderTenderReport } from '@/lib/tenders/report'
import { hasWorkspaceReadRole } from '@/lib/workspace-policy'

const MAX_FILE_BYTES = 8 * 1024 * 1024
const MAX_JSON_BYTES = 180000
type FileParts = { fileName: string; mediaType: string; bytes: Uint8Array<ArrayBuffer> }
type CommandAction = 'create' | 'manual' | 'packet' | 'draft' | 'assessment' | 'judgment' | 'grant' | 'revoke'
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')
const iso = (date: Date) => date.toISOString()
const scope = (organizationId:string,procurementId:string) => and(eq(tenderWorkspaces.organizationId,organizationId),eq(tenderWorkspaces.procurementId,procurementId))
const recordScope = (organizationId:string,procurementId:string) => and(eq(tenderIssuedRecords.organizationId,organizationId),eq(tenderIssuedRecords.procurementId,procurementId))

function assertViewer(viewer: WorkspaceViewer) {
  if (!viewer.id || !/^org_[A-Za-z0-9_-]+$/.test(viewer.organizationId)) throw new TenderError(403,'unavailable','This workspace is unavailable.')
}
function id(value: unknown): string {
  const parsed = tenderIdSchema.safeParse(value)
  if (!parsed.success) throw new TenderError(404,'unavailable','This tender is unavailable.')
  return parsed.data
}
function boundedJson(value: unknown) {
  if (Buffer.byteLength(JSON.stringify(value),'utf8') > MAX_JSON_BYTES) throw new TenderError(413,'too_large','The saved record is too large.')
}
function fileParts(input: FileParts) {
  if (!(input.bytes instanceof Uint8Array) || input.bytes.byteLength < 1 || input.bytes.byteLength > MAX_FILE_BYTES) throw new TenderError(400,'invalid_file','Choose a file smaller than 8 MB.')
  const fileName = extractionFileName(input.fileName)
  const mediaType = resolveExtractionMedia(fileName,input.mediaType)
  return {fileName,mediaType,bytes:input.bytes,sha256:sha256(input.bytes)}
}
function summary(procurement: typeof procurements.$inferSelect, workspace: typeof tenderWorkspaces.$inferSelect, viewer:WorkspaceViewer, capabilities:ReturnType<typeof tenderCapabilities>, state:TenderWorkflowState): TenderSummary {
  return {id:procurement.id,reference:procurement.reference,title:procurement.title,primaryPackId:workspace.primaryPackId,packVersion:workspace.packVersion,revision:workspace.currentRevision,updatedAt:iso(workspace.updatedAt),latestRecordKind:state==='assessment_current'?'assessment':state==='human_decision_current'?'human_judgment':state==='exception_proposed'?'exception_proposal':null,owner:tenderOwner(workspace.ownerId,viewer.id),progress:tenderProgress(state,capabilities,viewer.mode==='demo'&&resolveExtractionProviderId()==='mock')}
}
function manual(row:typeof tenderManualVersions.$inferSelect):TenderManual { return {id:row.id,ordinal:row.ordinal,label:row.label,fileName:row.originalFilename,mediaType:row.mediaType,byteSize:row.byteSize,sha256:row.sha256,hashKind:row.hashKind as TenderManual['hashKind'],recordedAt:iso(row.recordedAt)} }
function packet(row:typeof tenderPacketReceipts.$inferSelect):TenderPacket { return {receiptId:row.id,checklist:verifyPacketRow(row),packDefinitionHash:row.packDefinitionHash,sourceSha256:row.sourceSha256,createdAt:iso(row.issuedAt)} }
function recordSummary(row:typeof tenderIssuedRecords.$inferSelect):TenderRecordSummary { return {id:row.id,kind:row.kind as TenderRecordSummary['kind'],draftId:row.draftId,parentRecordId:row.parentRecordId,snapshotHash:row.snapshotHash,packsHash:row.packsHash,payloadHash:row.payloadHash,issuedAt:iso(row.issuedAt)} }

type WorkflowWorkspace = typeof tenderWorkspaces.$inferSelect
type WorkflowDraft = typeof tenderDraftRevisions.$inferSelect
type WorkflowPacket = typeof tenderPacketReceipts.$inferSelect
type WorkflowRecord = typeof tenderIssuedRecords.$inferSelect

function currentWorkflow(workspace:WorkflowWorkspace,draft:WorkflowDraft|null,receipt:WorkflowPacket|null,assessment:WorkflowRecord|null,judgment:WorkflowRecord|null,manualIds:string[]):TenderWorkflowState {
  const fail = ():never => { throw new TenderError(500,'integrity','The current tender progress failed its integrity check.') }
  if (!draft) {
    if(workspace.currentDraftId||workspace.currentRevision!==0||workspace.currentAssessmentId||workspace.currentJudgmentId) return fail()
    if(receipt) {
      verifyPacketRow(receipt)
      if(receipt.packId!==workspace.primaryPackId||receipt.packVersion!==workspace.packVersion)return fail()
    }
    return receipt?'packet_ready':'no_packet'
  }
  if(draft.id!==workspace.currentDraftId||draft.revision!==workspace.currentRevision||!receipt||receipt.id!==draft.packetReceiptId||receipt.packId!==workspace.primaryPackId||receipt.packVersion!==workspace.packVersion)return fail()
  const checklist=verifyPacketRow(receipt),payload=verifyDraftRow(draft)
  const decisions=sanitizeReviewerDecisions(payload.decisions,checklist.rows)
  if(!decisions||hashJson(manualIds.sort())!==payload.manualIdsHash)return fail()
  const incomplete=incompleteCorrectionCount(checklist.rows,decisions)>0
  if(payload.complete!==!incomplete)return fail()
  if(incomplete){
    if(payload.reviewedSnapshot!==null||payload.reviewedSnapshotHash!==null||workspace.currentAssessmentId||workspace.currentJudgmentId)return fail()
    return 'correction_incomplete'
  }
  const snapshot=pinnedSnapshot(draft,receipt),pack=pinnedPack(receipt)
  if(!workspace.currentAssessmentId){if(workspace.currentJudgmentId)return fail();return 'review_ready'}
  if(!assessment||assessment.id!==workspace.currentAssessmentId||assessment.kind!=='assessment'||assessment.draftId!==draft.id||assessment.parentRecordId!==null||assessment.snapshotHash!==hashJson(snapshot))return fail()
  const frozen=verifyIssuedRow(assessment) as ReturnType<typeof freezeAtJudgment>
  const expectedPack=packToggleForDonorPack(pack)
  const frozenPacks=frozen.packsInForce.map(({packId,version,name,toggledScope})=>({packId,version,name,toggledScope}))
  if(frozen.packsInForce.length!==1||hashJson(frozenPacks)!==hashJson([expectedPack]))return fail()
  const evaluation=evaluateJudgment(snapshot,pack.rules as JudgmentRule[],{evaluatedAt:frozen.frozenAt})
  const expectedDecision=evaluation.pipelineStatus.readiness==='green'?'accept_assessment':'request_evidence'
  if(hashJson(evaluation.pipelineStatus)!==hashJson(frozen.pipelineStatus)||frozen.disposition.decision!==expectedDecision||frozen.disposition.waiverRefs.length!==0)return fail()
  if(!workspace.currentJudgmentId)return 'assessment_current'
  if(!judgment||judgment.id!==workspace.currentJudgmentId||judgment.draftId!==draft.id||judgment.parentRecordId!==assessment.id||judgment.snapshotHash!==assessment.snapshotHash)return fail()
  const actual=verifyIssuedRow(judgment)
  if(judgment.kind==='exception_proposal'){
    const proposal=actual as Record<string,unknown>
    if(proposal.assessmentId!==assessment.id||proposal.assessmentHash!==assessment.payloadHash||proposal.draftId!==draft.id||judgment.packsHash!==assessment.packsHash)return fail()
    return 'exception_proposed'
  }
  if(judgment.kind!=='human_judgment')return fail()
  const child=actual as ReturnType<typeof freezeAtJudgment>
  if(!['request_evidence','escalate'].includes(child.disposition.decision)||child.disposition.waiverRefs.length!==0||child.supersedesRecordId!==assessment.id||hashJson(child.pipelineStatus)!==hashJson(frozen.pipelineStatus)||hashJson(child.packsInForce.map(({packId,version,name,toggledScope})=>({packId,version,name,toggledScope})))!==hashJson(frozenPacks))return fail()
  return 'human_decision_current'
}

/** At most five batched queries per page; no detail reads or historical scans per row. */
async function workflowStates(tx:TenantTransaction,viewer:WorkspaceViewer,workspaces:WorkflowWorkspace[]):Promise<Map<string,TenderWorkflowState>> {
  const states=new Map<string,TenderWorkflowState>()
  if(!workspaces.length)return states
  const draftIds=workspaces.flatMap(w=>w.currentDraftId?[w.currentDraftId]:[])
  const drafts=draftIds.length?await tx.select().from(tenderDraftRevisions).where(and(eq(tenderDraftRevisions.organizationId,viewer.organizationId),inArray(tenderDraftRevisions.procurementId,workspaces.map(w=>w.procurementId)),inArray(tenderDraftRevisions.id,draftIds))):[]
  const packetIds=drafts.map(d=>d.packetReceiptId)
  const pinnedPackets=packetIds.length?await tx.select().from(tenderPacketReceipts).where(and(eq(tenderPacketReceipts.organizationId,viewer.organizationId),inArray(tenderPacketReceipts.procurementId,workspaces.map(w=>w.procurementId)),inArray(tenderPacketReceipts.id,packetIds))):[]
  const withoutDraft=workspaces.filter(w=>!w.currentDraftId).map(w=>w.procurementId)
  const recentPackets=withoutDraft.length?await tx.selectDistinctOn([tenderPacketReceipts.procurementId]).from(tenderPacketReceipts).where(and(eq(tenderPacketReceipts.organizationId,viewer.organizationId),inArray(tenderPacketReceipts.procurementId,withoutDraft))).orderBy(tenderPacketReceipts.procurementId,desc(tenderPacketReceipts.issuedAt),desc(tenderPacketReceipts.id)):[]
  const recordIds=workspaces.flatMap(w=>[w.currentAssessmentId,w.currentJudgmentId].filter((value):value is string=>value!==null))
  const records=recordIds.length?await tx.select().from(tenderIssuedRecords).where(and(eq(tenderIssuedRecords.organizationId,viewer.organizationId),inArray(tenderIssuedRecords.procurementId,workspaces.map(w=>w.procurementId)),inArray(tenderIssuedRecords.id,recordIds))):[]
  const manuals=draftIds.length?await tx.select({draftId:tenderDraftManuals.draftId,procurementId:tenderDraftManuals.procurementId,id:tenderDraftManuals.manualVersionId,retainedId:tenderManualVersions.id}).from(tenderDraftManuals).leftJoin(tenderManualVersions,and(eq(tenderManualVersions.organizationId,tenderDraftManuals.organizationId),eq(tenderManualVersions.procurementId,tenderDraftManuals.procurementId),eq(tenderManualVersions.id,tenderDraftManuals.manualVersionId))).where(and(eq(tenderDraftManuals.organizationId,viewer.organizationId),inArray(tenderDraftManuals.procurementId,workspaces.map(w=>w.procurementId)),inArray(tenderDraftManuals.draftId,draftIds))):[]
  for(const workspace of workspaces){
    const draft=drafts.find(d=>d.id===workspace.currentDraftId&&d.procurementId===workspace.procurementId)??null
    const receipt=(draft?pinnedPackets.find(p=>p.id===draft.packetReceiptId&&p.procurementId===workspace.procurementId):recentPackets.find(p=>p.procurementId===workspace.procurementId))??null
    const assessment=records.find(r=>r.id===workspace.currentAssessmentId&&r.procurementId===workspace.procurementId)??null
    const judgment=records.find(r=>r.id===workspace.currentJudgmentId&&r.procurementId===workspace.procurementId)??null
    const links=manuals.filter(m=>m.draftId===workspace.currentDraftId&&m.procurementId===workspace.procurementId)
    if(links.some(m=>!m.retainedId)||links.length>32)throw new TenderError(500,'integrity','The saved manual links failed their integrity check.')
    states.set(workspace.procurementId,currentWorkflow(workspace,draft,receipt,assessment,judgment,links.map(m=>m.id)))
  }
  return states
}

async function lockTender(tx:TenantTransaction,viewer:WorkspaceViewer,tenderId:string,action:TenderAction) {
  await tx.execute(sql`select 1 from tender_workspaces where organization_id = ${viewer.organizationId} and procurement_id = ${tenderId} for update`)
  return authorizeTender(tx,viewer,tenderId,action)
}
async function audit(tx:TenantTransaction,viewer:WorkspaceViewer,tenderId:string,eventType:string,payload:Record<string,unknown>) {
  await appendAuditEvent(tx,{viewer,procurementId:tenderId,eventType,sourceLabel:'Tender workspace',payload})
}
async function commandLock(tx:TenantTransaction,viewer:WorkspaceViewer,action:CommandAction,key:string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`${viewer.organizationId}:${action}:${key}`}, 7))`)
}
async function commandReplay(tx:TenantTransaction,viewer:WorkspaceViewer,action:CommandAction,key:string,input:unknown) {
  const inputHash = hashJson({actorId:viewer.id,action,input})
  const [prior] = await tx.select().from(tenderCommands).where(and(eq(tenderCommands.organizationId,viewer.organizationId),eq(tenderCommands.action,action),eq(tenderCommands.idempotencyKey,key))).limit(1)
  if (prior && (prior.actorId !== viewer.id || prior.inputHash !== inputHash)) throw new TenderError(409,'idempotency_conflict','This command key was already used for different input.')
  return {prior,inputHash}
}
async function saveCommand(tx:TenantTransaction,viewer:WorkspaceViewer,tenderId:string,action:CommandAction,key:string,inputHash:string,responseId:string) {
  await tx.insert(tenderCommands).values({id:randomUUID(),organizationId:viewer.organizationId,procurementId:tenderId,actorId:viewer.id,action,idempotencyKey:key,inputHash,responseId})
}
async function oneProcurement(tx:TenantTransaction,viewer:WorkspaceViewer,tenderId:string) {
  const [row] = await tx.select().from(procurements).where(and(eq(procurements.organizationId,viewer.organizationId),eq(procurements.id,tenderId))).limit(1)
  if (!row) throw new TenderError(404,'unavailable','This tender is unavailable.')
  return row
}
async function onePacket(tx:TenantTransaction,viewer:WorkspaceViewer,tenderId:string,packetId:string) {
  const [row] = await tx.select().from(tenderPacketReceipts).where(and(eq(tenderPacketReceipts.organizationId,viewer.organizationId),eq(tenderPacketReceipts.procurementId,tenderId),eq(tenderPacketReceipts.id,packetId))).limit(1)
  if (!row) throw new TenderError(400,'invalid_link','The packet receipt is unavailable for this tender.')
  verifyPacketRow(row)
  return row
}
async function oneDraft(tx:TenantTransaction,viewer:WorkspaceViewer,tenderId:string,draftId:string) {
  const [row] = await tx.select().from(tenderDraftRevisions).where(and(eq(tenderDraftRevisions.organizationId,viewer.organizationId),eq(tenderDraftRevisions.procurementId,tenderId),eq(tenderDraftRevisions.id,draftId))).limit(1)
  if (!row) throw new TenderError(500,'integrity','The saved draft is unavailable.')
  verifyDraftRow(row)
  return row
}
async function oneRecord(tx:TenantTransaction,viewer:WorkspaceViewer,tenderId:string,recordId:string) {
  const [row] = await tx.select().from(tenderIssuedRecords).where(and(recordScope(viewer.organizationId,tenderId),eq(tenderIssuedRecords.id,recordId))).limit(1)
  if (!row) throw new TenderError(404,'unavailable','This record is unavailable.')
  verifyIssuedRow(row)
  return row
}
async function draftFromRow(tx:TenantTransaction,viewer:WorkspaceViewer,tenderId:string,row:typeof tenderDraftRevisions.$inferSelect):Promise<TenderDraft> {
  const receipt = await onePacket(tx,viewer,tenderId,row.packetReceiptId)
  const payload = verifyDraftRow(row)
  const joins = await tx.select({id:tenderDraftManuals.manualVersionId}).from(tenderDraftManuals).where(and(eq(tenderDraftManuals.organizationId,viewer.organizationId),eq(tenderDraftManuals.procurementId,tenderId),eq(tenderDraftManuals.draftId,row.id)))
  const manualVersionIds = joins.map(join=>join.id).sort()
  if (hashJson(manualVersionIds) !== payload.manualIdsHash) throw new TenderError(500,'integrity','The saved manual links failed their integrity check.')
  return {id:row.id,revision:row.revision,packetReceiptId:receipt.id,checklist:verifyPacketRow(receipt),decisions:payload.decisions as TenderDraft['decisions'],manualVersionIds,reviewedSnapshotHash:payload.reviewedSnapshotHash as string|null,createdAt:iso(row.createdAt)}
}

async function detail(tx:TenantTransaction,viewer:WorkspaceViewer,tenderId:string):Promise<TenderDetail> {
  const {workspace,capabilities}=await authorizeTender(tx,viewer,tenderId,'read')
  const procurement=await oneProcurement(tx,viewer,tenderId)
  // A transaction uses one pg client; run its queries sequentially.
  const manualRows = await tx.select().from(tenderManualVersions).where(and(eq(tenderManualVersions.organizationId,viewer.organizationId),eq(tenderManualVersions.procurementId,tenderId))).orderBy(desc(tenderManualVersions.ordinal)).limit(50)
  const packetRows = await tx.select().from(tenderPacketReceipts).where(and(eq(tenderPacketReceipts.organizationId,viewer.organizationId),eq(tenderPacketReceipts.procurementId,tenderId))).orderBy(desc(tenderPacketReceipts.issuedAt),desc(tenderPacketReceipts.id)).limit(50)
  const recordRows = await tx.select().from(tenderIssuedRecords).where(recordScope(viewer.organizationId,tenderId)).orderBy(desc(tenderIssuedRecords.issuedAt)).limit(100)
  const draftRow=workspace.currentDraftId?await oneDraft(tx,viewer,tenderId,workspace.currentDraftId):null
  const currentDraft=draftRow?await draftFromRow(tx,viewer,tenderId,draftRow):null
  // Keep history bounded while always including the exact evidence pinned by
  // the current draft, even when newer uploads pushed it out of the window.
  if(currentDraft&&!packetRows.some(row=>row.id===currentDraft.packetReceiptId)){
    packetRows.push(await onePacket(tx,viewer,tenderId,currentDraft.packetReceiptId))
  }
  if(currentDraft){
    const recentIds=new Set(manualRows.map(row=>row.id))
    const missingIds=currentDraft.manualVersionIds.filter(manualId=>!recentIds.has(manualId))
    if(missingIds.length){
      const pinned=await tx.select().from(tenderManualVersions).where(and(eq(tenderManualVersions.organizationId,viewer.organizationId),eq(tenderManualVersions.procurementId,tenderId),inArray(tenderManualVersions.id,missingIds)))
      if(pinned.length!==missingIds.length)throw new TenderError(500,'integrity','A pinned manual version is unavailable.')
      manualRows.push(...pinned)
    }
  }
  const assessment=workspace.currentAssessmentId?(recordRows.find(row=>row.id===workspace.currentAssessmentId)??await oneRecord(tx,viewer,tenderId,workspace.currentAssessmentId)):null
  const judgment=workspace.currentJudgmentId?(recordRows.find(row=>row.id===workspace.currentJudgmentId)??await oneRecord(tx,viewer,tenderId,workspace.currentJudgmentId)):null
  const receipt=currentDraft?packetRows.find(row=>row.id===currentDraft.packetReceiptId)??null:packetRows[0]??null
  const state=currentWorkflow(workspace,draftRow,receipt,assessment,judgment,currentDraft?.manualVersionIds??[])
  return {tender:summary(procurement,workspace,viewer,capabilities,state),revision:workspace.currentRevision,etag:`"tender-${workspace.currentRevision}"`,draft:currentDraft,packets:packetRows.map(packet),manuals:manualRows.map(manual),records:recordRows.map(recordSummary),capabilities:{canEdit:capabilities.canEdit,canAssess:capabilities.canAssess,canJudge:capabilities.canJudge,canProposeException:capabilities.canProposeException,canGrant:capabilities.canGrant,canExport:capabilities.canExport}}
}

export async function createTender(viewer:WorkspaceViewer,input:unknown):Promise<TenderDetail> {
  assertViewer(viewer)
  if (!['Procurement Officer','Procurement Director','Workspace Admin'].includes(viewer.role)) throw new TenderError(403,'forbidden','This role cannot create tenders.')
  const command=createTenderSchema.parse(input)
  const pack=getDonorPack(command.primaryPackId)
  return withTenant(viewer.organizationId,async tx=>{
    await commandLock(tx,viewer,'create',command.idempotencyKey)
    const {prior,inputHash}=await commandReplay(tx,viewer,'create',command.idempotencyKey,{title:command.title,primaryPackId:command.primaryPackId})
    if(prior) return detail(tx,viewer,prior.responseId)
    const tenderId=randomUUID(), now=new Date()
    await tx.insert(procurements).values({id:tenderId,organizationId:viewer.organizationId,reference:`TENDER-${tenderId}`,title:command.title,region:'Unknown',status:'draft',evidenceCoverage:0,blockerSummary:'',version:1,createdAt:now,updatedAt:now})
    await tx.insert(tenderWorkspaces).values({organizationId:viewer.organizationId,procurementId:tenderId,ownerId:viewer.id,primaryPackId:command.primaryPackId,packVersion:pack.version,currentRevision:0,updatedAt:now})
    await tx.insert(tenderAccess).values({organizationId:viewer.organizationId,procurementId:tenderId,userId:viewer.id,access:'review',grantedBy:viewer.id,grantedAt:now})
    await audit(tx,viewer,tenderId,'tender.created',{title:command.title,primaryPackId:command.primaryPackId,packVersion:pack.version})
    await saveCommand(tx,viewer,tenderId,'create',command.idempotencyKey,inputHash,tenderId)
    return detail(tx,viewer,tenderId)
  })
}

export async function listTenders(viewer:WorkspaceViewer,input:{limit?:number;cursor?:string}={}):Promise<{items:TenderSummary[];nextCursor:string|null}> {
  assertViewer(viewer)
  if(!hasWorkspaceReadRole(viewer.role))throw new TenderError(403,'forbidden','This workspace is unavailable.')
  const limit=Math.max(1,Math.min(50,Math.trunc(input.limit??20)))
  let cursor:{updatedAt:string;id:string}|null=null
  if(input.cursor){try{const parsed=JSON.parse(Buffer.from(input.cursor,'base64url').toString('utf8'));if(typeof parsed.updatedAt==='string'&&!Number.isNaN(new Date(parsed.updatedAt).valueOf())&&tenderIdSchema.safeParse(parsed.id).success)cursor=parsed}catch{/* invalid */} if(!cursor)throw new TenderError(400,'invalid_cursor','The list cursor is invalid.')}
  return withTenant(viewer.organizationId,async tx=>{
    const base=cursor?and(eq(tenderWorkspaces.organizationId,viewer.organizationId),or(lt(tenderWorkspaces.updatedAt,new Date(cursor.updatedAt)),and(eq(tenderWorkspaces.updatedAt,new Date(cursor.updatedAt)),lt(tenderWorkspaces.procurementId,cursor.id)))):eq(tenderWorkspaces.organizationId,viewer.organizationId)
    const where=['Procurement Director','Workspace Admin'].includes(viewer.role)?base:viewer.role==='Procurement Officer'?and(base,or(isNotNull(tenderAccess.userId),eq(tenderWorkspaces.ownerId,viewer.id))):and(base,isNotNull(tenderAccess.userId))
    const rows=await tx.select({workspace:tenderWorkspaces,procurement:procurements,access:tenderAccess.access}).from(tenderWorkspaces).innerJoin(procurements,and(eq(procurements.organizationId,tenderWorkspaces.organizationId),eq(procurements.id,tenderWorkspaces.procurementId))).leftJoin(tenderAccess,and(eq(tenderAccess.organizationId,tenderWorkspaces.organizationId),eq(tenderAccess.procurementId,tenderWorkspaces.procurementId),eq(tenderAccess.userId,viewer.id))).where(where).orderBy(desc(tenderWorkspaces.updatedAt),desc(tenderWorkspaces.procurementId)).limit(limit+1)
    const page=rows.slice(0,limit)
    const last=page.at(-1)?.workspace
    const states=await workflowStates(tx,viewer,page.map(row=>row.workspace))
    return {items:page.map(row=>summary(row.procurement,row.workspace,viewer,tenderCapabilities(viewer,row.access==='read'||row.access==='review'?row.access:null,row.workspace.ownerId===viewer.id),states.get(row.workspace.procurementId)??'unknown')),nextCursor:rows.length>limit&&last?Buffer.from(JSON.stringify({updatedAt:iso(last.updatedAt),id:last.procurementId})).toString('base64url'):null}
  },'read only')
}

export async function readTender(viewer:WorkspaceViewer,tenderId:string):Promise<TenderDetail> { assertViewer(viewer);id(tenderId);return withTenant(viewer.organizationId,tx=>detail(tx,viewer,tenderId),'read only') }

export async function addManualVersion(viewer:WorkspaceViewer,tenderId:string,input:FileParts&{label?:string;supersedesId?:string;expectedRevision:number;idempotencyKey:string}):Promise<TenderManual> {
  assertViewer(viewer);id(tenderId)
  if(viewer.mode!=='demo') throw new TenderError(403,'retention_gate','Customer file metadata cannot be retained until a retention policy is configured.')
  const parts=fileParts(input), expected=revisionSchema.parse(input.expectedRevision), key=idempotencyKeySchema.parse(input.idempotencyKey)
  const label=typeof input.label==='string'?input.label.trim():parts.fileName
  if(label.length<1||label.length>160)throw new TenderError(400,'invalid_label','Name the manual in 160 characters or fewer.')
  const supersedesId=input.supersedesId?id(input.supersedesId):null
  return withTenant(viewer.organizationId,async tx=>{
    await commandLock(tx,viewer,'manual',key)
    const {workspace}=await lockTender(tx,viewer,tenderId,'edit')
    const {prior,inputHash}=await commandReplay(tx,viewer,'manual',key,{tenderId,label,fileName:parts.fileName,mediaType:parts.mediaType,sha256:parts.sha256,expected,supersedesId})
    if(prior){const [row]=await tx.select().from(tenderManualVersions).where(and(eq(tenderManualVersions.organizationId,viewer.organizationId),eq(tenderManualVersions.procurementId,tenderId),eq(tenderManualVersions.id,prior.responseId))).limit(1);if(!row)throw new TenderError(500,'integrity','The manual receipt is unavailable.');return manual(row)}
    if(workspace.currentRevision!==expected)throw new TenderError(409,'stale_revision','A newer revision exists.',workspace.currentRevision)
    if(supersedesId){const [old]=await tx.select().from(tenderManualVersions).where(and(eq(tenderManualVersions.organizationId,viewer.organizationId),eq(tenderManualVersions.procurementId,tenderId),eq(tenderManualVersions.id,supersedesId))).limit(1);if(!old)throw new TenderError(400,'invalid_link','The prior manual is unavailable for this tender.')}
    const [latest]=await tx.select({ordinal:tenderManualVersions.ordinal}).from(tenderManualVersions).where(and(eq(tenderManualVersions.organizationId,viewer.organizationId),eq(tenderManualVersions.procurementId,tenderId))).orderBy(desc(tenderManualVersions.ordinal)).limit(1)
    const row={id:randomUUID(),organizationId:viewer.organizationId,procurementId:tenderId,ordinal:(latest?.ordinal??0)+1,versionLabel:`v${(latest?.ordinal??0)+1}`,label,originalFilename:parts.fileName,mediaType:parts.mediaType,byteSize:parts.bytes.byteLength,sha256:parts.sha256,hashKind:'server_verified_upload',sourceVersionId:null,supersedesId,recordedBy:viewer.id,recordedAt:new Date()}
    await tx.insert(tenderManualVersions).values(row)
    await audit(tx,viewer,tenderId,'tender.manual_recorded',{manualVersionId:row.id,sha256:row.sha256,hashKind:row.hashKind,supersedesId})
    await saveCommand(tx,viewer,tenderId,'manual',key,inputHash,row.id)
    return manual(row)
  })
}

export async function issuePacket(viewer:WorkspaceViewer,tenderId:string,input:FileParts&{classification:'synthetic';expectedRevision:number;idempotencyKey:string}):Promise<TenderPacket> {
  assertViewer(viewer);id(tenderId)
  if(viewer.mode!=='demo'||input.classification!=='synthetic')throw new TenderError(403,'retention_gate','Packet persistence is available for local synthetic fixtures only.')
  if(resolveExtractionProviderId()!=='mock')throw new TenderError(403,'retention_gate','Synthetic packet persistence requires the local mock extractor.')
  const parts=fileParts(input),expected=revisionSchema.parse(input.expectedRevision),key=idempotencyKeySchema.parse(input.idempotencyKey)
  // Authorization precedes the provider call. The write transaction checks it again.
  const context=await withTenant(viewer.organizationId,async tx=>{
    const {workspace}=await authorizeTender(tx,viewer,tenderId,'edit')
    const {prior}=await commandReplay(tx,viewer,'packet',key,{tenderId,fileName:parts.fileName,mediaType:parts.mediaType,sha256:parts.sha256,expected,classification:'synthetic'})
    if(prior){const row=await onePacket(tx,viewer,tenderId,prior.responseId);return {packId:null,packVersion:null,reference:null,replay:packet(row)} as const}
    if(workspace.currentRevision!==expected)throw new TenderError(409,'stale_revision','A newer revision exists.',workspace.currentRevision)
    const procurement=await oneProcurement(tx,viewer,tenderId)
    return {packId:workspace.primaryPackId,packVersion:workspace.packVersion,reference:procurement.reference,replay:null} as const
  },'read only')
  if(context.replay)return context.replay
  if(!context.packId||!isDonorPackId(context.packId)||!context.reference)throw new TenderError(500,'integrity','The saved pack is unavailable.')
  const packDefinition=structuredClone(getDonorPack(context.packId)) as Record<string,unknown>
  if(packDefinition.version!==context.packVersion)throw new TenderError(409,'pack_changed','The pinned pack version is unavailable for new extraction.')
  const extraction=await extractParsedUpload({fileName:parts.fileName,mediaType:parts.mediaType,bytes:parts.bytes,awardId:`award.${tenderId}`},{organizationId:viewer.organizationId})
  if(extraction.sourceFileHash!==parts.sha256)throw new TenderError(500,'integrity','The extracted file hash did not match the uploaded bytes.')
  const checklist=prepareUploadChecklist({extraction,packId:context.packId,organizationId:viewer.organizationId,procurementReference:context.reference})
  const payload={checklist}
  boundedJson(payload);boundedJson(packDefinition)
  return withTenant(viewer.organizationId,async tx=>{
    await commandLock(tx,viewer,'packet',key)
    const {workspace}=await lockTender(tx,viewer,tenderId,'edit')
    const {prior,inputHash}=await commandReplay(tx,viewer,'packet',key,{tenderId,fileName:parts.fileName,mediaType:parts.mediaType,sha256:parts.sha256,expected,classification:'synthetic'})
    if(prior){const row=await onePacket(tx,viewer,tenderId,prior.responseId);return packet(row)}
    if(workspace.currentRevision!==expected)throw new TenderError(409,'stale_revision','A newer revision exists.',workspace.currentRevision)
    if(workspace.primaryPackId!==context.packId||workspace.packVersion!==context.packVersion)throw new TenderError(409,'pack_changed','The tender pack changed during extraction.')
    const row={id:randomUUID(),organizationId:viewer.organizationId,procurementId:tenderId,packId:context.packId,packVersion:context.packVersion,packDefinition,packDefinitionHash:hashJson(packDefinition),sourceSha256:parts.sha256,originalFilename:parts.fileName,mediaType:parts.mediaType,byteSize:parts.bytes.byteLength,providerId:extraction.providerId,classification:'synthetic',payload,payloadHash:hashJson(payload),issuedBy:viewer.id,issuedAt:new Date()}
    await tx.insert(tenderPacketReceipts).values(row)
    await audit(tx,viewer,tenderId,'tender.packet_issued',{packetReceiptId:row.id,sourceSha256:row.sourceSha256,packDefinitionHash:row.packDefinitionHash,classification:row.classification})
    await saveCommand(tx,viewer,tenderId,'packet',key,inputHash,row.id)
    return packet(row)
  })
}

export async function saveDraft(viewer:WorkspaceViewer,tenderId:string,input:unknown):Promise<TenderDetail> {
  assertViewer(viewer);id(tenderId)
  const command=saveDraftSchema.parse(input)
  return withTenant(viewer.organizationId,async tx=>{
    await commandLock(tx,viewer,'draft',command.idempotencyKey)
    const {workspace}=await lockTender(tx,viewer,tenderId,'edit')
    const {idempotencyKey:_,...commandBody}=command
    const {prior,inputHash}=await commandReplay(tx,viewer,'draft',command.idempotencyKey,{tenderId,...commandBody})
    if(prior){const [saved]=await tx.select({revision:tenderDraftRevisions.revision}).from(tenderDraftRevisions).where(and(eq(tenderDraftRevisions.organizationId,viewer.organizationId),eq(tenderDraftRevisions.procurementId,tenderId),eq(tenderDraftRevisions.id,prior.responseId))).limit(1);if(!saved)throw new TenderError(500,'integrity','The original saved draft is unavailable.');if(workspace.currentRevision!==saved.revision)throw new TenderError(409,'stale_revision','This command succeeded, but a newer revision now exists.',workspace.currentRevision);return detail(tx,viewer,tenderId)}
    if(workspace.currentRevision!==command.expectedRevision)throw new TenderError(409,'stale_revision','A newer revision exists.',workspace.currentRevision)
    const receipt=await onePacket(tx,viewer,tenderId,command.packetReceiptId)
    if(receipt.packId!==workspace.primaryPackId||receipt.packVersion!==workspace.packVersion)throw new TenderError(400,'invalid_link','The packet pack does not match this tender.')
    const checklist=verifyPacketRow(receipt)
    const decisions=sanitizeReviewerDecisions(command.decisions,checklist.rows)
    if(!decisions)throw new TenderError(400,'invalid_decisions','The checklist decisions do not match the packet.')
    const manualIds=[...new Set(command.manualVersionIds)].sort()
    if(manualIds.length!==command.manualVersionIds.length)throw new TenderError(400,'invalid_link','A manual was selected more than once.')
    if(manualIds.length){const found=await tx.select({id:tenderManualVersions.id}).from(tenderManualVersions).where(and(eq(tenderManualVersions.organizationId,viewer.organizationId),eq(tenderManualVersions.procurementId,tenderId),inArray(tenderManualVersions.id,manualIds)));if(found.length!==manualIds.length)throw new TenderError(400,'invalid_link','A manual version is unavailable for this tender.')}
    const now=new Date(), reviewedAt=iso(now)
    const incomplete=incompleteCorrectionCount(checklist.rows,decisions)>0
    const reviewedSnapshot=incomplete?null:applyReviewerDecisions(checklist.snapshot,decisions,new Map(checklist.rows.map(row=>[row.key,row.title])),{reviewedBy:viewer.id,reviewedAt})
    const payload={decisions,manualIdsHash:hashJson(manualIds),reviewedSnapshot,reviewedSnapshotHash:reviewedSnapshot?hashJson(reviewedSnapshot):null,reviewedBy:viewer.id,reviewedAt,complete:!incomplete}
    boundedJson(payload)
    const draftId=randomUUID(), revision=workspace.currentRevision+1
    await tx.insert(tenderDraftRevisions).values({id:draftId,organizationId:viewer.organizationId,procurementId:tenderId,revision,parentDraftId:workspace.currentDraftId,packetReceiptId:receipt.id,payload,payloadHash:hashJson(payload),actorId:viewer.id,createdAt:now})
    for(const manualId of manualIds)await tx.insert(tenderDraftManuals).values({organizationId:viewer.organizationId,procurementId:tenderId,draftId,manualVersionId:manualId})
    await tx.update(tenderWorkspaces).set({currentRevision:revision,currentDraftId:draftId,currentAssessmentId:null,currentJudgmentId:null,updatedAt:now}).where(scope(viewer.organizationId,tenderId))
    await tx.update(procurements).set({updatedAt:now,version:sql`${procurements.version}+1`}).where(and(eq(procurements.organizationId,viewer.organizationId),eq(procurements.id,tenderId)))
    await audit(tx,viewer,tenderId,'tender.draft_saved',{draftId,revision,packetReceiptId:receipt.id,reviewedSnapshotHash:payload.reviewedSnapshotHash})
    await saveCommand(tx,viewer,tenderId,'draft',command.idempotencyKey,inputHash,draftId)
    return detail(tx,viewer,tenderId)
  })
}

function actorRole(viewer:WorkspaceViewer):ActorRole {
  if(viewer.role==='Procurement Officer'||viewer.role==='Procurement Director'||viewer.role==='Workspace Admin')return viewer.role
  throw new TenderError(403,'forbidden','This role cannot issue a record.')
}
function pinnedSnapshot(draft:typeof tenderDraftRevisions.$inferSelect, receipt:typeof tenderPacketReceipts.$inferSelect):AwardRegistrySnapshot {
  const checklist=verifyPacketRow(receipt),payload=verifyDraftRow(draft)
  if(payload.complete!==true||!payload.reviewedSnapshot||typeof payload.reviewedAt!=='string'||typeof payload.reviewedBy!=='string')throw new TenderError(400,'incomplete_draft','Complete the checklist before issuing an assessment.')
  const decisions=sanitizeReviewerDecisions(payload.decisions,checklist.rows)
  if(!decisions)throw new TenderError(500,'integrity','The saved decisions failed their integrity check.')
  const rebuilt=applyReviewerDecisions(checklist.snapshot,decisions,new Map(checklist.rows.map(row=>[row.key,row.title])),{reviewedBy:payload.reviewedBy,reviewedAt:payload.reviewedAt})
  if(hashJson(rebuilt)!==payload.reviewedSnapshotHash||hashJson(payload.reviewedSnapshot)!==payload.reviewedSnapshotHash)throw new TenderError(500,'integrity','The reviewed snapshot failed its integrity check.')
  return rebuilt
}
function pinnedPack(receipt:typeof tenderPacketReceipts.$inferSelect):DonorPack {
  verifyPacketRow(receipt)
  const pack=receipt.packDefinition as unknown as DonorPack
  if(!pack||!Array.isArray(pack.rules)||pack.packId!==receipt.packId||pack.version!==receipt.packVersion)throw new TenderError(500,'integrity','The pinned pack is invalid.')
  return pack
}
function issued(row:typeof tenderIssuedRecords.$inferSelect):TenderIssuedRecord { return {...recordSummary(row),payload:verifyIssuedRow(row)} }
async function checkRecordLineage(tx:TenantTransaction,viewer:WorkspaceViewer,tenderId:string,row:typeof tenderIssuedRecords.$inferSelect) {
  const draft=await oneDraft(tx,viewer,tenderId,row.draftId)
  const receipt=await onePacket(tx,viewer,tenderId,draft.packetReceiptId)
  const snapshot=pinnedSnapshot(draft,receipt)
  if(hashJson(snapshot)!==row.snapshotHash)throw new TenderError(500,'integrity','The issued snapshot no longer matches its draft.')
  const pack=pinnedPack(receipt)
  const actual=verifyIssuedRow(row)
  if(row.kind==='assessment'||row.kind==='human_judgment'){
    const frozen=actual as ReturnType<typeof freezeAtJudgment>
    const expectedPack=packToggleForDonorPack(pack)
    if(frozen.packsInForce.length!==1||hashJson(frozen.packsInForce.map(({packId,version,name,toggledScope})=>({packId,version,name,toggledScope})))!==hashJson([expectedPack]))throw new TenderError(500,'integrity','The frozen pack differs from the pinned pack definition.')
  }
  if(row.kind==='assessment'){
    if(row.parentRecordId!==null)throw new TenderError(500,'integrity','Assessment lineage is invalid.')
    const frozen=actual as ReturnType<typeof freezeAtJudgment>
    const evaluation=evaluateJudgment(snapshot,pack.rules as JudgmentRule[],{evaluatedAt:frozen.frozenAt})
    if(hashJson(evaluation.pipelineStatus)!==hashJson(frozen.pipelineStatus))throw new TenderError(500,'integrity','The retained assessment differs from its pinned rules.')
    const expectedDecision=evaluation.pipelineStatus.readiness==='green'?'accept_assessment':'request_evidence'
    if(frozen.disposition.decision!==expectedDecision||frozen.disposition.waiverRefs.length!==0)throw new TenderError(500,'integrity','The assessment disposition differs from its pinned rules.')
  }else{
    if(!row.parentRecordId)throw new TenderError(500,'integrity','Judgment lineage is invalid.')
    const parent=await oneRecord(tx,viewer,tenderId,row.parentRecordId)
    if(parent.kind!=='assessment'||parent.draftId!==row.draftId||parent.snapshotHash!==row.snapshotHash)throw new TenderError(500,'integrity','Judgment lineage is invalid.')
    const parentRecord=verifyIssuedRow(parent) as ReturnType<typeof freezeAtJudgment>
    const parentEvaluation=evaluateJudgment(snapshot,pack.rules as JudgmentRule[],{evaluatedAt:parentRecord.frozenAt})
    if(hashJson(parentEvaluation.pipelineStatus)!==hashJson(parentRecord.pipelineStatus))throw new TenderError(500,'integrity','The assessment differs from its pinned rules.')
    if(row.kind==='human_judgment'){
      const childRecord=actual as ReturnType<typeof freezeAtJudgment>
      if(!['request_evidence','escalate'].includes(childRecord.disposition.decision)||childRecord.disposition.waiverRefs.length!==0)throw new TenderError(500,'integrity','The human judgment disposition is invalid.')
      if(childRecord.supersedesRecordId!==parent.id||hashJson(childRecord.packsInForce.map(({packId,version,name,toggledScope})=>({packId,version,name,toggledScope})))!==hashJson(parentRecord.packsInForce.map(({packId,version,name,toggledScope})=>({packId,version,name,toggledScope})))||hashJson(childRecord.pipelineStatus)!==hashJson(parentRecord.pipelineStatus))throw new TenderError(500,'integrity','Judgment lineage is invalid.')
    }
    if(row.kind==='exception_proposal'){
      const proposal=actual as Record<string,unknown>
      if(proposal.assessmentId!==parent.id||proposal.assessmentHash!==parent.payloadHash||proposal.draftId!==row.draftId||row.packsHash!==parent.packsHash)throw new TenderError(500,'integrity','Exception proposal lineage is invalid.')
    }
  }
  if(pack.packId!==receipt.packId)throw new TenderError(500,'integrity','The pinned pack is invalid.')
  return {draft,receipt,pack}
}

export async function issueAssessment(viewer:WorkspaceViewer,tenderId:string,input:unknown):Promise<TenderIssuedRecord> {
  assertViewer(viewer);id(tenderId)
  const command=issueAssessmentSchema.parse(input)
  return withTenant(viewer.organizationId,async tx=>{
    await commandLock(tx,viewer,'assessment',command.idempotencyKey)
    const {workspace}=await lockTender(tx,viewer,tenderId,'assess')
    const {prior,inputHash}=await commandReplay(tx,viewer,'assessment',command.idempotencyKey,{tenderId,expectedRevision:command.expectedRevision})
    if(prior)return issued(await oneRecord(tx,viewer,tenderId,prior.responseId))
    if(workspace.currentRevision!==command.expectedRevision)throw new TenderError(409,'stale_revision','A newer revision exists.',workspace.currentRevision)
    if(!workspace.currentDraftId)throw new TenderError(400,'empty_draft','Save a reviewed checklist first.')
    if(workspace.currentAssessmentId)throw new TenderError(409,'already_assessed','This revision already has an assessment.',workspace.currentRevision)
    const draft=await oneDraft(tx,viewer,tenderId,workspace.currentDraftId)
    const receipt=await onePacket(tx,viewer,tenderId,draft.packetReceiptId)
    const snapshot=pinnedSnapshot(draft,receipt),pack=pinnedPack(receipt),now=new Date(),issuedAt=iso(now)
    const judgment=evaluateJudgment(snapshot,pack.rules as JudgmentRule[],{evaluatedAt:issuedAt})
    const decision=judgment.pipelineStatus.readiness==='green'?'accept_assessment':'request_evidence'
    const disposition=dispositionSchema.parse({decision,waiverRefs:[],actorId:viewer.id,actorRole:actorRole(viewer),timestamp:issuedAt,rationale:judgment.findings.length?`The pinned ${pack.name} pack raised ${judgment.findings.length} finding(s). Review the listed evidence before sign-off.`:`The pinned ${pack.name} pack has no open rule findings. This is an assessment, not award authorization.`})
    const recordId=randomUUID()
    const frozen=freezeAtJudgment(snapshot,{recordId,supersedesRecordId:null,frozenAt:issuedAt,frozenBy:viewer.id,packs:[packToggleForDonorPack(pack)],disposition,pipelineStatus:judgment.pipelineStatus})
    boundedJson(frozen)
    const row={id:recordId,organizationId:viewer.organizationId,procurementId:tenderId,kind:'assessment',draftId:draft.id,parentRecordId:null,payload:structuredClone(frozen) as Record<string,unknown>,snapshotHash:frozen.snapshotHash,packsHash:frozen.packsHash,payloadHash:hashJson(frozen),issuedBy:viewer.id,issuedAt:now}
    await tx.insert(tenderIssuedRecords).values(row)
    await tx.update(tenderWorkspaces).set({currentAssessmentId:recordId,currentJudgmentId:null,updatedAt:now}).where(scope(viewer.organizationId,tenderId))
    await audit(tx,viewer,tenderId,'tender.assessment_issued',{recordId,draftId:draft.id,snapshotHash:row.snapshotHash,packsHash:row.packsHash,payloadHash:row.payloadHash})
    await saveCommand(tx,viewer,tenderId,'assessment',command.idempotencyKey,inputHash,recordId)
    return issued(row)
  })
}

export async function issueJudgment(viewer:WorkspaceViewer,tenderId:string,input:unknown):Promise<TenderIssuedRecord> {
  assertViewer(viewer);id(tenderId)
  const command=issueJudgmentSchema.parse(input)
  return withTenant(viewer.organizationId,async tx=>{
    await commandLock(tx,viewer,'judgment',command.idempotencyKey)
    const {workspace}=await lockTender(tx,viewer,tenderId,'judge')
    const {idempotencyKey:_,...commandBody}=command
    const {prior,inputHash}=await commandReplay(tx,viewer,'judgment',command.idempotencyKey,{tenderId,...commandBody})
    if(prior)return issued(await oneRecord(tx,viewer,tenderId,prior.responseId))
    if(workspace.currentRevision!==command.expectedRevision)throw new TenderError(409,'stale_revision','A newer revision exists.',workspace.currentRevision)
    if(command.action==='exception'&&!['Procurement Director','Workspace Admin'].includes(viewer.role))throw new TenderError(403,'forbidden','Only a director or workspace admin can propose an exception.')
    if(workspace.currentAssessmentId!==command.assessmentId||workspace.currentJudgmentId)throw new TenderError(409,'assessment_changed','This assessment is no longer current.',workspace.currentRevision)
    const assessment=await oneRecord(tx,viewer,tenderId,command.assessmentId)
    if(assessment.kind!=='assessment'||assessment.payloadHash!==command.assessmentHash)throw new TenderError(409,'assessment_changed','This assessment is no longer current.',workspace.currentRevision)
    const {draft,receipt,pack}=await checkRecordLineage(tx,viewer,tenderId,assessment)
    if(workspace.currentDraftId!==draft.id)throw new TenderError(409,'stale_revision','A newer revision exists.',workspace.currentRevision)
    const snapshot=pinnedSnapshot(draft,receipt),now=new Date(),issuedAt=iso(now),recordId=randomUUID()
    let kind:'human_judgment'|'exception_proposal',payload:Record<string,unknown>
    if(command.action==='exception'){
      kind='exception_proposal'
      payload={schemaVersion:'exception-proposal-v1',recordId,assessmentId:assessment.id,assessmentHash:assessment.payloadHash,draftId:draft.id,actorId:viewer.id,actorRole:actorRole(viewer),issuedAt,reason:command.reason,status:'approval_not_recorded',snapshotHash:assessment.snapshotHash,packsHash:assessment.packsHash}
    }else{
      kind='human_judgment'
      const choice=command.action==='request'?'request':'escalate'
      const disposition=dispositionFromAwardDeskDecision({decision:choice,actorId:viewer.id,actorRole:actorRole(viewer),timestamp:issuedAt,rationale:command.reason})
      const frozen=freezeAtJudgment(snapshot,{recordId,supersedesRecordId:assessment.id,frozenAt:issuedAt,frozenBy:viewer.id,packs:[packToggleForDonorPack(pack)],disposition,pipelineStatus:(verifyIssuedRow(assessment) as {pipelineStatus:unknown}).pipelineStatus})
      if(frozen.snapshotHash!==assessment.snapshotHash)throw new TenderError(500,'integrity','The judgment differs from the issued assessment.')
      payload=structuredClone(frozen) as Record<string,unknown>
    }
    boundedJson(payload)
    const row={id:recordId,organizationId:viewer.organizationId,procurementId:tenderId,kind,draftId:draft.id,parentRecordId:assessment.id,payload,snapshotHash:assessment.snapshotHash,packsHash:kind==='human_judgment'?(payload.packsHash as string):assessment.packsHash,payloadHash:hashJson(payload),issuedBy:viewer.id,issuedAt:now}
    await tx.insert(tenderIssuedRecords).values(row)
    await tx.update(tenderWorkspaces).set({currentJudgmentId:recordId,updatedAt:now}).where(scope(viewer.organizationId,tenderId))
    await audit(tx,viewer,tenderId,kind==='exception_proposal'?'tender.exception_proposed':'tender.judgment_issued',{recordId,assessmentId:assessment.id,draftId:draft.id,kind,payloadHash:row.payloadHash})
    await saveCommand(tx,viewer,tenderId,'judgment',command.idempotencyKey,inputHash,recordId)
    return issued(row)
  })
}

export async function readTenderRecord(viewer:WorkspaceViewer,tenderId:string,recordId:string):Promise<TenderIssuedRecord> {
  assertViewer(viewer);id(tenderId);id(recordId)
  return withTenant(viewer.organizationId,async tx=>{await authorizeTender(tx,viewer,tenderId,'read');const row=await oneRecord(tx,viewer,tenderId,recordId);await checkRecordLineage(tx,viewer,tenderId,row);return issued(row)},'read only')
}

export async function downloadTenderReport(viewer:WorkspaceViewer,tenderId:string,recordId:string):Promise<{bytes:Uint8Array;fileName:string}> {
  assertViewer(viewer);id(tenderId);id(recordId)
  return withTenant(viewer.organizationId,async tx=>{
    await lockTender(tx,viewer,tenderId,'export')
    const row=await oneRecord(tx,viewer,tenderId,recordId)
    await checkRecordLineage(tx,viewer,tenderId,row)
    const current=await detail(tx,viewer,tenderId)
    const draftRow=await oneDraft(tx,viewer,tenderId,row.draftId)
    const exactDraft=await draftFromRow(tx,viewer,tenderId,draftRow)
    const manualRows=exactDraft.manualVersionIds.length?await tx.select().from(tenderManualVersions).where(and(eq(tenderManualVersions.organizationId,viewer.organizationId),eq(tenderManualVersions.procurementId,tenderId),inArray(tenderManualVersions.id,exactDraft.manualVersionIds))):[]
    if(manualRows.length!==exactDraft.manualVersionIds.length)throw new TenderError(500,'integrity','A referenced manual version is unavailable.')
    const renderDetail={...current,draft:exactDraft,manuals:manualRows.map(manual)}
    const result=await renderTenderReport(renderDetail,issued(row))
    await tx.insert(tenderExportReceipts).values({id:randomUUID(),organizationId:viewer.organizationId,procurementId:tenderId,recordId,actorId:viewer.id,pdfSha256:sha256(result.bytes),exportedAt:new Date()})
    await audit(tx,viewer,tenderId,'tender.record_exported',{recordId,pdfSha256:sha256(result.bytes)})
    return result
  })
}

export async function grantTenderAccess(viewer:WorkspaceViewer,tenderId:string,input:{userId:string;access:'read'|'review';idempotencyKey:string}):Promise<{userId:string;access:'read'|'review'}> {
  assertViewer(viewer);id(tenderId)
  if(typeof input?.userId!=='string'||input.userId.length<1||input.userId.length>160||!['read','review'].includes(input.access))throw new TenderError(400,'invalid_grant','Choose an active member and access level.')
  const key=idempotencyKeySchema.parse(input.idempotencyKey)
  await withTenant(viewer.organizationId,tx=>authorizeTender(tx,viewer,tenderId,'grant'),'read only')
  await verifyTenderGrantTarget(viewer.organizationId,input.userId)
  return withTenant(viewer.organizationId,async tx=>{
    await commandLock(tx,viewer,'grant',key)
    await lockTender(tx,viewer,tenderId,'grant')
    const {prior,inputHash}=await commandReplay(tx,viewer,'grant',key,{tenderId,userId:input.userId,access:input.access})
    if(prior)return {userId:input.userId,access:input.access}
    await tx.insert(tenderAccess).values({organizationId:viewer.organizationId,procurementId:tenderId,userId:input.userId,access:input.access,grantedBy:viewer.id,grantedAt:new Date()}).onConflictDoUpdate({target:[tenderAccess.organizationId,tenderAccess.procurementId,tenderAccess.userId],set:{access:input.access,grantedBy:viewer.id,grantedAt:new Date()}})
    await audit(tx,viewer,tenderId,'tender.access_granted',{userId:input.userId,access:input.access})
    await saveCommand(tx,viewer,tenderId,'grant',key,inputHash,input.userId)
    return {userId:input.userId,access:input.access}
  })
}

export async function revokeTenderAccess(viewer:WorkspaceViewer,tenderId:string,input:{userId:string;idempotencyKey:string}):Promise<{userId:string;revoked:true}> {
  assertViewer(viewer);id(tenderId)
  if(typeof input?.userId!=='string'||input.userId.length<1||input.userId.length>160)throw new TenderError(400,'invalid_grant','Choose a member to remove.')
  const key=idempotencyKeySchema.parse(input.idempotencyKey)
  return withTenant(viewer.organizationId,async tx=>{
    await commandLock(tx,viewer,'revoke',key)
    await lockTender(tx,viewer,tenderId,'grant')
    const {prior,inputHash}=await commandReplay(tx,viewer,'revoke',key,{tenderId,userId:input.userId})
    if(prior)return {userId:input.userId,revoked:true}
    await tx.delete(tenderAccess).where(and(eq(tenderAccess.organizationId,viewer.organizationId),eq(tenderAccess.procurementId,tenderId),eq(tenderAccess.userId,input.userId)))
    await audit(tx,viewer,tenderId,'tender.access_revoked',{userId:input.userId})
    await saveCommand(tx,viewer,tenderId,'revoke',key,inputHash,input.userId)
    return {userId:input.userId,revoked:true}
  })
}
