'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TenderPolicyDisclosure } from '@/app/work/tender-policy'
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'

import DeskChecklist from '@/app/desk/checklist'
import { decisionIssue, decisionsForRows, type ReviewerDecision } from '@/lib/desk/review'
import { sameManualVersions, sameReviewerDecision, sameReviewerDecisions } from '@/lib/tenders/client-state'
import {
  addTenderManual, deleteTender, downloadTenderReport, extractTenderPacket, getTender, getTenderRecord,
  issueTenderAssessment, issueTenderJudgment, saveTenderDraft, TenderRequestError, tenderIdempotencyKey,
} from '@/lib/tenders/client'
import type { TenderDetail, TenderIssuedRecord, TenderPacket, TenderRecordSummary } from '@/lib/tenders/contract'

import type { DeskPackOption } from './upload-desk'
import s from './desk.module.css'
import { TenderNavigationGuard } from './tender-navigation-guard'
import { clearPendingDraft, clearPendingDraftIfMatching, keepPendingDraft, readPendingDraft, type PendingDraft } from '@/lib/tenders/pending-draft'

type SaveState = 'idle' | 'saving' | 'saved' | 'failed' | 'conflict'
type Classification = '' | 'synthetic' | 'customer'
const maximumUploadBytes = 4 * 1024 * 1024

function niceKind(kind: TenderRecordSummary['kind']) {
  if (kind === 'assessment') return 'Assessment'
  if (kind === 'exception_proposal') return 'Exception proposed · approval not recorded'
  return 'Human judgment'
}

function recordFields(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function retainedOutcome(record: TenderIssuedRecord) {
  const payload = recordFields(record.payload)
  const disposition = recordFields(payload?.disposition)
  const pipeline = recordFields(payload?.pipelineStatus)
  const reasonValue = record.kind === 'exception_proposal' ? payload?.reason : disposition?.rationale
  const reason = typeof reasonValue === 'string' && reasonValue.trim() ? reasonValue : null
  if (record.kind === 'exception_proposal') {
    return { outcome: payload?.status === 'approval_not_recorded' ? 'Exception proposed · approval not recorded' : 'Exception proposal status unavailable', readiness: null, reason }
  }
  if (record.kind === 'human_judgment') {
    return { outcome: disposition?.decision === 'request_evidence' ? 'Request evidence' : disposition?.decision === 'escalate' ? 'Escalate' : 'Retained outcome unavailable', readiness: null, reason }
  }
  const readiness = pipeline?.readiness
  return {
    outcome: disposition?.decision === 'request_evidence' ? 'Request evidence recommended' : disposition?.decision === 'accept_assessment' ? 'No open rule findings' : 'Assessment outcome unavailable',
    readiness: readiness === 'green' ? 'Green' : readiness === 'amber' ? 'Amber' : readiness === 'red' ? 'Red' : 'Unknown',
    reason,
  }
}

function draftSignature(receiptId: string, decisions: ReviewerDecision[], manualIds: string[], revision: number) {
  return JSON.stringify([receiptId, [...decisions].sort((left, right) => left.key.localeCompare(right.key)).map(item => [item.key, item.action, item.value, item.page, item.quote, item.note]), [...manualIds].sort(), revision])
}

function message(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback
}

export default function DurableTenderDesk({ tenderId, organizationId, viewerId, packs }: { tenderId: string | null, organizationId: string, viewerId: string, packs: DeskPackOption[], fixtureMode: boolean }) {
  const router = useRouter()
  const [deleteName, setDeleteName] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [packetConsent, setPacketConsent] = useState(false)
  const pendingScope = { organizationId, viewerId, tenderId: tenderId ?? '' }
  const pendingRef = useRef<PendingDraft | null>(null)
  const [recovered, setRecovered] = useState(false)
  const [detail, setDetail] = useState<TenderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [packet, setPacket] = useState<TenderPacket | null>(null)
  const [decisions, setDecisions] = useState<ReviewerDecision[]>([])
  const [manualIds, setManualIds] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const packetFileRef = useRef<HTMLInputElement>(null)
  const [classification, setClassification] = useState<Classification>('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [manualFile, setManualFile] = useState<File | null>(null)
  const manualFileRef = useRef<HTMLInputElement>(null)
  const [manualLabel, setManualLabel] = useState('')
  const [manualConsent, setManualConsent] = useState(false)
  const [addingManual, setAddingManual] = useState(false)
  const [manualError, setManualError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const versionRef = useRef(0)
  const savedVersionRef = useRef(0)
  const savingRef = useRef(false)
  const commandKeys = useRef<Record<string, { signature: string, key: string }>>({})
  const fileTokens = useRef(new WeakMap<File, string>())
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [conflictDetail, setConflictDetail] = useState<TenderDetail | null>(null)
  const [issuing, setIssuing] = useState(false)
  const [issueError, setIssueError] = useState<string | null>(null)
  const [judgmentAction, setJudgmentAction] = useState<'request' | 'escalate' | 'exception' | ''>('')
  const [judgmentReason, setJudgmentReason] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<TenderIssuedRecord | null>(null)
  const [recordLoading, setRecordLoading] = useState(false)
  const [recordError, setRecordError] = useState<string | null>(null)
  const [reportPending, setReportPending] = useState(false)
  const [preparedReport, setPreparedReport] = useState<{ url: string; fileName: string; recordId: string } | null>(null)
  const reportGeneration = useRef(0)
  const checklistHeadingRef = useRef<HTMLHeadingElement>(null)

  const load = useCallback(async (discard = false) => {
    reportGeneration.current += 1
    setPreparedReport(null)
    const scope = { organizationId, viewerId, tenderId: tenderId ?? '' }
    if (discard) { clearPendingDraft(scope); pendingRef.current = null; setRecovered(false) }
    if (!tenderId) { setLoading(false); return }
    setLoading(true)
    setLoadError(null)
    try {
      const loaded = await getTender(tenderId)
      setDetail(loaded)
      const current = loaded.packets.find(item => item.receiptId === loaded.draft?.packetReceiptId) ?? (!loaded.draft ? loaded.packets[0] ?? null : null)
      setPacket(current)
      setDecisions(current ? decisionsForRows(current.checklist.rows, loaded.draft?.decisions ?? null) : [])
      setManualIds(loaded.draft?.manualVersionIds ?? [])
      const unsavedReceipt = Boolean(current && !loaded.draft && loaded.capabilities.canEdit)
      versionRef.current = unsavedReceipt ? 1 : 0
      savedVersionRef.current = 0
      setVersion(versionRef.current)
      setSaveState(loaded.draft ? 'saved' : 'idle')
      setSaveError(null)
      setConflictDetail(null)
      if (!loaded.capabilities.canEdit) clearPendingDraft(scope)
      const pending = loaded.capabilities.canEdit && !discard ? readPendingDraft(scope) : null
      if (pending) {
        const receipt = loaded.packets.find(item => item.receiptId === pending.packetReceiptId)
        if (receipt) {
          setPacket(receipt)
          setDecisions(decisionsForRows(receipt.checklist.rows, pending.decisions))
          setManualIds(pending.manualVersionIds)
          const missingManuals = pending.manualVersionIds.filter(id => !loaded.manuals.some(item => item.id === id))
          versionRef.current = 1
          setVersion(1)
          setRecovered(true)
          if (loaded.revision !== pending.expectedRevision || missingManuals.length > 0) {
            setConflictDetail(loaded)
            setSaveState('conflict')
            setSaveError(missingManuals.length > 0
              ? 'Recovered manual selections are unavailable in the current tender detail. Your original selections remain here. Reload the latest draft and reselect manual versions before saving.'
              : 'Recovered unsaved edits differ from a newer server revision. Compare before choosing which draft to keep.')
          } else setSaveState('idle')
        } else clearPendingDraft(scope)
      }
    } catch (cause) {
      if (cause instanceof TenderRequestError && (cause.status === 403 || cause.status === 404)) {
        clearPendingDraft(scope); pendingRef.current = null; setRecovered(false)
        setDetail(null); setPacket(null); setDecisions([]); setManualIds([]); setSelectedRecord(null); setConflictDetail(null)
        setFile(null); setManualFile(null); commandKeys.current = {}
      }
      setLoadError(cause instanceof TenderRequestError && (cause.status === 403 || cause.status === 404)
        ? 'This tender is unavailable. It may have expired, been deleted, or your access may have changed. Unsaved tender data has been cleared.'
        : message(cause, 'The tender could not be loaded. Try again.'))
    } finally { setLoading(false) }
  }, [tenderId, organizationId, viewerId])

  useEffect(() => { void load() }, [load])
  useEffect(() => () => { reportGeneration.current += 1 }, [])

  function clearUnavailable(cause: unknown) {
    if (!(cause instanceof TenderRequestError) || (cause.status !== 403 && cause.status !== 404)) return false
    reportGeneration.current += 1; setPreparedReport(null)
    clearPendingDraft(pendingScope); pendingRef.current = null; commandKeys.current = {}
    setDetail(null); setPacket(null); setDecisions([]); setManualIds([]); setSelectedRecord(null); setConflictDetail(null)
    setFile(null); setManualFile(null); setRecovered(false)
    setLoadError('This tender is unavailable. It may have expired, been deleted, or your access may have changed. Unsaved tender data has been cleared.')
    return true
  }

  async function removeTender(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!tenderId || !detail?.capabilities.canDelete || deleteName !== detail.tender.title || deleting) return
    setDeleting(true); setDeleteError(null)
    try {
      await deleteTender(tenderId, commandKey('delete', tenderId))
      reportGeneration.current += 1; setPreparedReport(null)
      clearPendingDraft(pendingScope); pendingRef.current = null; commandKeys.current = {}
      setDetail(null); setPacket(null); setDecisions([]); setManualIds([]); setSelectedRecord(null); setFile(null); setManualFile(null)
      router.replace('/work'); router.refresh()
    } catch (cause) { if (!clearUnavailable(cause)) setDeleteError(message(cause, 'The tender could not be deleted. Retry to confirm the result.')) }
    finally { setDeleting(false) }
  }

  function changed() {
    versionRef.current += 1
    setVersion(versionRef.current)
    setSaveState(current => current === 'conflict' ? current : 'idle')
    setSaveError(null)
  }

  function updateDecision(key: string, patch: Partial<ReviewerDecision>) {
    setDecisions(current => current.map(item => item.key === key ? { ...item, ...patch, key } : item))
    changed()
  }

  function toggleManual(id: string) {
    setManualIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
    if (packet) changed()
  }

  function selectPacket(receipt: TenderPacket) {
    if (receipt.receiptId === packet?.receiptId) return
    setPacket(receipt)
    setDecisions(receipt.receiptId === detail?.draft?.packetReceiptId
      ? decisionsForRows(receipt.checklist.rows, detail.draft.decisions)
      : decisionsForRows(receipt.checklist.rows, null))
    if (detail?.capabilities.canEdit) changed()
  }

  const checklist = packet?.checklist ?? null
  const validationIssue = checklist?.rows.map(row => {
    const decision = decisions.find(item => item.key === row.key)
    return decision ? decisionIssue(row.title, decision) : `Review “${row.title}”.`
  }).find(Boolean) ?? null
  const dirty = version !== savedVersionRef.current
  pendingRef.current = !loading && dirty && detail?.capabilities.canEdit && packet ? {
    packetReceiptId: packet.receiptId, decisions, manualVersionIds: manualIds,
    expectedRevision: saveState === 'conflict' ? (readPendingDraft(pendingScope)?.expectedRevision ?? detail.revision) : detail.revision,
  } : null
  useEffect(() => {
    const scope = { organizationId, viewerId, tenderId: tenderId ?? '' }
    if (pendingRef.current) keepPendingDraft(scope, pendingRef.current)
    return () => { if (pendingRef.current) keepPendingDraft(scope, pendingRef.current) }
  }, [organizationId, viewerId, tenderId, version, saveState])


  function commandKey(scope: string, signature: string) {
    const existing = commandKeys.current[scope]
    if (existing?.signature === signature) return existing.key
    const key = tenderIdempotencyKey()
    commandKeys.current[scope] = { signature, key }
    return key
  }

  function fileToken(value: File) {
    const existing = fileTokens.current.get(value)
    if (existing) return existing
    const token = tenderIdempotencyKey()
    fileTokens.current.set(value, token)
    return token
  }

  async function persistDraft(force = false) {
    if (!tenderId || !detail || !packet || !detail.capabilities.canEdit || uploading || addingManual || deleting || savingRef.current || saveState === 'conflict') return
    if (!dirty && !force) return
    savingRef.current = true
    const targetVersion = versionRef.current
    const submittedDecisions = decisions.map(item => ({ ...item }))
    const submittedManualIds = [...manualIds]
    const expectedRevision = detail.revision
    setSaveState('saving')
    setSaveError(null)
    try {
      const signature = draftSignature(packet.receiptId, submittedDecisions, submittedManualIds, expectedRevision)
      const updated = await saveTenderDraft(tenderId, {
        packetReceiptId: packet.receiptId,
        decisions: submittedDecisions,
        manualVersionIds: submittedManualIds,
        expectedRevision,
        idempotencyKey: commandKey('draft', signature),
      })
      const sameDraft = updated.draft?.packetReceiptId === packet.receiptId
        && updated.draft.revision === expectedRevision + 1
        && sameReviewerDecisions(updated.draft.decisions, submittedDecisions)
        && sameManualVersions(updated.draft.manualVersionIds, submittedManualIds)
      if (!sameDraft) {
        setConflictDetail(updated)
        setSaveState('conflict')
        setSaveError('The server has a different current draft. Your edits remain here for comparison.')
        return
      }
      setDetail(updated)
      savedVersionRef.current = targetVersion
      if (versionRef.current === targetVersion) {
        clearPendingDraftIfMatching(pendingScope, { packetReceiptId: packet.receiptId, decisions: submittedDecisions, manualVersionIds: submittedManualIds, expectedRevision })
        pendingRef.current = null
        setRecovered(false)
      }
      setSaveState('saved')
    } catch (cause) {
      if (clearUnavailable(cause)) return
      if (cause instanceof TenderRequestError && cause.status === 409) {
        setSaveState('conflict')
        setSaveError('Another version was saved. Your edits are still here. Compare or reload before saving again.')
      } else {
        setSaveState('failed')
        setSaveError(message(cause, 'Could not save. Retry when the connection is available.'))
      }
    } finally { savingRef.current = false }
  }

  useEffect(() => {
    if (!dirty || !packet || uploading || addingManual || deleting || saveState === 'failed' || saveState === 'conflict') return
    const timer = window.setTimeout(() => { void persistDraft() }, 700)
    return () => window.clearTimeout(timer)
    // A completed save changes saveState, which schedules any edits made during that request.
  }, [version, packet, saveState, detail?.revision, uploading, addingManual, deleting])

  async function extract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!tenderId || !detail?.policy || !file || uploading || addingManual || issuing || deleting) return
    if (file.size > maximumUploadBytes) { setUploadError('This file is too large. Choose a packet of 4 MB or less.'); return }
    if (classification !== detail.policy.classification || !packetConsent) {
      setUploadError('Classify the file to match this tender and acknowledge the processing notice before extracting it.')
      return
    }
    if (dirty || saveState === 'saving' || saveState === 'conflict') {
      setUploadError('Save or resolve the current checklist before selecting a new packet.')
      return
    }
    setUploading(true)
    setUploadError(null)
    try {
      const expectedRevision = detail.revision
      const acceptance = { classification: detail.policy.classification, policyVersion: detail.policy.version, consent: true as const }
      const receipt = await extractTenderPacket(tenderId, file, classification, expectedRevision,
        commandKey('packet', JSON.stringify([fileToken(file), expectedRevision, acceptance])), acceptance)
      const initialDecisions = decisionsForRows(receipt.checklist.rows, null)
      setPacket(receipt)
      setDecisions(initialDecisions)
      setDetail(current => current ? { ...current, packets: current.packets.some(item => item.receiptId === receipt.receiptId) ? current.packets : [receipt, ...current.packets] } : current)
      setFile(null)
      setPacketConsent(false)
      if (packetFileRef.current) packetFileRef.current.value = ''
      delete commandKeys.current.packet
      versionRef.current += 1
      const targetVersion = versionRef.current
      setVersion(targetVersion)
      const pending = { packetReceiptId: receipt.receiptId, decisions: initialDecisions, manualVersionIds: manualIds, expectedRevision }
      pendingRef.current = pending
      keepPendingDraft(pendingScope, pending)
      setSaveState('saving')
      try {
        const signature = draftSignature(receipt.receiptId, initialDecisions, manualIds, expectedRevision)
        const updated = await saveTenderDraft(tenderId, { ...pending, idempotencyKey: commandKey('draft', signature) })
        if (updated.draft?.packetReceiptId !== receipt.receiptId || updated.draft.revision !== expectedRevision + 1 || !sameReviewerDecisions(updated.draft.decisions, initialDecisions) || !sameManualVersions(updated.draft.manualVersionIds, manualIds)) {
          setConflictDetail(updated); setSaveState('conflict')
          setSaveError('The latest saved draft uses a different packet. Compare it before saving this receipt.')
        } else {
          setDetail(updated)
          savedVersionRef.current = targetVersion
          if (versionRef.current === targetVersion) {
            clearPendingDraftIfMatching(pendingScope, pending)
            pendingRef.current = null
          }
          setSaveState('saved'); setSaveError(null)
        }
      } catch (cause) {
        if (clearUnavailable(cause)) return
        setSaveState(cause instanceof TenderRequestError && cause.status === 409 ? 'conflict' : 'failed')
        setSaveError('The extraction receipt was saved, but its review draft could not be saved. Retry saving or compare the latest version before leaving this page.')
      }
      checklistHeadingRef.current?.focus()
    } catch (cause) {
      if (clearUnavailable(cause)) return
      setUploadError(message(cause, 'The packet could not be extracted. Try again.'))
    } finally { setUploading(false) }
  }

  async function addManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!tenderId || !detail?.policy || !manualFile || !manualConsent || addingManual || uploading || issuing || deleting || saveState === 'saving') return
    if (manualFile.size > maximumUploadBytes) { setManualError('This file is too large. Choose a manual of 4 MB or less.'); return }
    setAddingManual(true)
    setManualError(null)
    try {
      const label = manualLabel.trim() || manualFile.name
      const expectedRevision = detail.revision
      const added = await addTenderManual(tenderId, manualFile, label, detail.revision,
        commandKey('manual', JSON.stringify([fileToken(manualFile), label, detail.revision, detail.policy.version])),
        { classification: detail.policy.classification, policyVersion: detail.policy.version, consent: true })
      const updated = await getTender(tenderId)
      setDetail(updated)
      setManualIds(current => [...current, added.id])
      if (packet) changed()
      if (updated.revision !== expectedRevision) {
        setConflictDetail(updated)
        setSaveState('conflict')
        setSaveError('Another draft was saved while the manual was recorded. Compare before attaching it.')
      }
      setManualFile(null)
      if (manualFileRef.current) manualFileRef.current.value = ''
      setManualLabel('')
      setManualConsent(false)
      delete commandKeys.current.manual
    } catch (cause) {
      if (clearUnavailable(cause)) return
      setManualError(message(cause, 'The manual version could not be recorded. Try again.'))
    } finally { setAddingManual(false) }
  }

  async function compare() {
    if (!tenderId) return
    try { setConflictDetail(await getTender(tenderId)) }
    catch (cause) { if (!clearUnavailable(cause)) setSaveError(message(cause, 'The latest version could not be loaded.')) }
  }

  function issueFailure(cause: unknown, fallback: string) {
    if (clearUnavailable(cause)) return
    const explanation = message(cause, fallback)
    setIssueError(explanation)
    if (cause instanceof TenderRequestError && cause.status === 409) {
      setSaveState('conflict')
      setSaveError('The tender changed before issuance. Compare the latest revision before trying again.')
      void compare()
    }
  }

  function keepMyEdits() {
    if (!conflictDetail) return
    setDetail(conflictDetail)
    setConflictDetail(null)
    setSaveState('idle')
    setSaveError(null)
    versionRef.current += 1
    setVersion(versionRef.current)
  }

  async function issueAssessment() {
    if (!tenderId || !detail?.draft || currentAssessment || dirty || saveState !== 'saved' || issuing || uploading || addingManual || deleting) return
    setIssuing(true)
    setIssueError(null)
    try {
      const issued = await issueTenderAssessment(tenderId, detail.revision,
        commandKey('assessment', String(detail.revision)))
      setSelectedRecord(issued)
      setDetail(await getTender(tenderId))
    } catch (cause) { issueFailure(cause, 'The assessment could not be issued.') }
    finally { setIssuing(false) }
  }

  const currentAssessment = detail?.records.find(record => record.kind === 'assessment' && record.draftId === detail.draft?.id) ?? null

  async function issueJudgment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!tenderId || !detail || !currentAssessment || !judgmentAction || issuing || uploading || addingManual || deleting) return
    if (judgmentReason.trim().length < 20) { setIssueError('Enter a reason of at least 20 characters.'); return }
    setIssuing(true)
    setIssueError(null)
    try {
      const signature = JSON.stringify([detail.revision, currentAssessment.id, currentAssessment.payloadHash, judgmentAction, judgmentReason.trim()])
      const issued = await issueTenderJudgment(tenderId, {
        expectedRevision: detail.revision,
        assessmentId: currentAssessment.id,
        assessmentHash: currentAssessment.payloadHash,
        action: judgmentAction,
        reason: judgmentReason.trim(),
        idempotencyKey: commandKey('judgment', signature),
      })
      setSelectedRecord(issued)
      setDetail(await getTender(tenderId))
      setJudgmentReason('')
      setJudgmentAction('')
    } catch (cause) { issueFailure(cause, 'The judgment could not be recorded.') }
    finally { setIssuing(false) }
  }

  async function openRecord(recordId: string) {
    if (!tenderId) return
    setRecordLoading(true)
    setRecordError(null)
    try { setSelectedRecord(await getTenderRecord(tenderId, recordId)) }
    catch (cause) { if (!clearUnavailable(cause)) setRecordError(message(cause, 'The issued record could not be opened.')) }
    finally { setRecordLoading(false) }
  }

  async function download(recordId: string) {
    if (!tenderId || reportPending) return
    const generation = reportGeneration.current
    setReportPending(true)
    setRecordError(null)
    try {
      const report = await downloadTenderReport(tenderId, recordId)
      if (generation !== reportGeneration.current) return
      setPreparedReport({ url: URL.createObjectURL(report.blob), fileName: report.fileName, recordId })
    } catch (cause) { if (!clearUnavailable(cause)) setRecordError(message(cause, 'The PDF could not be prepared. Try again.')) }
    finally { setReportPending(false) }
  }

  useEffect(() => {
    if (!preparedReport) return
    const expiry = detail?.expiresAt ? Date.parse(detail.expiresAt) : Infinity
    const lifetime = Math.max(0, Math.min(5 * 60 * 1000, expiry - Date.now()))
    const timer = window.setTimeout(() => setPreparedReport(current => current?.url === preparedReport.url ? null : current), lifetime)
    return () => { window.clearTimeout(timer); URL.revokeObjectURL(preparedReport.url) }
  }, [preparedReport, detail?.expiresAt])

  if (!tenderId) return <div className={s.page}><h1>Award desk</h1><p className={s.empty}>Choose a saved tender before working on a packet.</p><Link className={s.primary} href="/work">Open My work</Link></div>
  if (loading && !detail) return <div className={s.page}><h1>Award desk</h1><p className={s.empty} role="status">Loading tender…</p></div>
  if (loadError && !detail) return <div className={s.page}><h1>Award desk</h1><p className={s.alert} role="alert">{loadError}</p><button className={s.secondary} type="button" onClick={() => void load()}>Try again</button><Link href="/work">My work</Link></div>
  if (!detail) return null

  const pack = packs.find(item => item.packId === detail.tender.primaryPackId)
  const selectedOutcome = selectedRecord ? retainedOutcome(selectedRecord) : null
  const selectedAssessmentChild = selectedRecord?.kind === 'assessment' ? detail.records.find(record => record.parentRecordId === selectedRecord.id) : null
  const canFreeze = Boolean(detail.capabilities.canAssess && detail.draft && !currentAssessment && !dirty && saveState === 'saved' && !issuing && !uploading && !addingManual && !deleting && !validationIssue)
  const latestDraftRecord = detail.records.find(record => record.draftId === detail.draft?.id && record.kind !== 'assessment')
  const latestDecisions = conflictDetail?.draft?.decisions ?? []
  const latestByKey = new Map(latestDecisions.map(item => [item.key, item]))
  const mineByKey = new Map(decisions.map(item => [item.key, item]))
  const changedRows = [...new Set([...latestByKey.keys(), ...mineByKey.keys()])].sort().flatMap(key => {
    const latest = latestByKey.get(key)
    const mine = mineByKey.get(key)
    return sameReviewerDecision(latest, mine) ? [] : [{ key, latest, mine }]
  })

  const progress = dirty || saveState === 'saving' || saveState === 'conflict'
    ? { ...detail.tender.progress, stage: 'review', section: 'review',
      status: saveState === 'conflict' ? 'Saved versions need comparison' : saveState === 'failed' ? 'Your latest edits have not saved' : saveState === 'saving' ? 'Saving your latest edits' : 'Your latest edits are not yet saved',
      nextAction: saveState === 'conflict' ? 'Compare saved versions' : saveState === 'failed' ? 'Retry saving your review' : 'Continue review' }
    : detail.tender.progress

  return <div className={s.page} data-testid="durable-tender-desk">
    <TenderNavigationGuard enabled={dirty || saveState === 'saving'} />
    <nav aria-label="Breadcrumb"><Link href="/work">My work</Link> / <span>{detail.tender.title}</span></nav>
    <header className={s.intro}>
      <p className={s.eyebrow}>Saved tender · {detail.tender.reference}</p>
      <h1>{detail.tender.title}</h1>
      <p className={s.lede}>{progress.status}. {progress.nextAction}.</p>
      <p className={s.actions}><a className={s.primary} href={`#${progress.section}`}>{progress.nextAction}</a></p>
      <nav aria-label="Tender workflow"><ol className={s.path}>{(["evidence", "review", "decision", "record"] as const).map(step => <li key={step} aria-current={progress.stage === step ? "step" : undefined}><a href={`#${step}`}>{step[0].toUpperCase() + step.slice(1)}</a></li>)}</ol></nav>
      <section className={s.card} aria-labelledby="tender-details"><h2 id="tender-details">Details</h2><p>{pack?.name ?? detail.tender.primaryPackId} · pinned version {detail.tender.packVersion}</p><p className={s.help}>{detail.tender.classification === 'synthetic' ? 'Synthetic demonstration' : 'Sanitized customer material'} · {detail.expiresAt ? `expires ${new Date(detail.expiresAt).toLocaleString()}` : 'Legacy record · earlier policy'}</p><p className={s.help}>Owner: {detail.tender.owner.label} · Reference: {detail.tender.reference}</p><details><summary>Saved version information</summary><p className={s.help}>Revision {detail.revision} · updated {new Date(detail.tender.updatedAt).toLocaleString()}</p>{detail.policy ? <TenderPolicyDisclosure policy={detail.policy} expiresAt={detail.expiresAt ?? undefined} /> : <p className={s.help}>Legacy saved record. Preserved under its earlier policy, with no automatic expiry. Start a new tender to upload files under the current processing notice.</p>}</details></section>
    </header>
    {recovered ? <p className={s.alert} role="status">Recovered unsaved edits from this session. They become server saved only after saving succeeds.</p> : null}
    {loadError ? <p className={s.alert} role="alert">{loadError}</p> : null}

    <section id="evidence" className={s.section} aria-labelledby="evidence-heading">
    <h2 id="evidence-heading">Evidence</h2>
    {detail.capabilities.canEdit && detail.policy ? <section className={s.card} aria-labelledby="packet-heading">
      <h2 id="packet-heading">Packet</h2>
      <p className={s.help}>Each extraction creates a server receipt tied to this tender and its pinned pack. Select a new file only when you need a new receipt.</p>
      <form onSubmit={extract}>
        <fieldset disabled={uploading}>
          <legend>Classify this file</legend>
          <label className={s.radioOption}><input type="radio" name="classification" checked={classification === 'synthetic'} onChange={() => { setClassification('synthetic'); setPacketConsent(false) }} disabled={detail.policy.classification !== 'synthetic'} /> Synthetic demonstration</label>
          <label className={s.radioOption}><input type="radio" name="classification" checked={classification === 'customer'} onChange={() => { setClassification('customer'); setPacketConsent(false) }} disabled={detail.policy.classification !== 'customer'} /> Sanitized customer document</label>
        </fieldset>
        <TenderPolicyDisclosure policy={detail.policy} expiresAt={detail.expiresAt ?? undefined} />
        <label className={s.fieldLabel} htmlFor="durable-packet">Packet file</label>
        <p className={s.help}>Maximum file size: 4 MB.</p>
        <input ref={packetFileRef} id="durable-packet" type="file" accept=".pdf,.docx,.xlsx,.eml,.msg,.txt,.png,.jpg,.jpeg,application/pdf,text/plain" onChange={(event: ChangeEvent<HTMLInputElement>) => { const selected = event.target.files?.[0] ?? null; setFile(selected); setPacketConsent(false); setUploadError(selected && selected.size > maximumUploadBytes ? 'This file is too large. Choose a packet of 4 MB or less.' : null) }} disabled={uploading} />
        <label className={s.radioOption}><input type="checkbox" checked={packetConsent} onChange={event => setPacketConsent(event.target.checked)} disabled={uploading} />I understand the processing notice and confirm this file is {detail.policy.classification === 'synthetic' ? 'a synthetic demonstration with no real customer data' : 'irreversibly sanitized customer material authorized for this processing route'}.</label>
        <div className={s.actions}><button className={s.primary} type="submit" disabled={!file || file.size > maximumUploadBytes || classification !== detail.policy.classification || !packetConsent || uploading || addingManual || issuing || deleting || dirty || saveState === 'saving' || saveState === 'conflict'}>{uploading ? 'Extracting…' : 'Extract packet'}</button></div>
        {uploadError ? <p className={s.alert} role="alert">{uploadError} <button className={s.secondary} type="button" onClick={() => { if (!dirty || window.confirm('Reload this tender and discard unsaved edits?')) void load(true) }}>Reload tender</button></p> : null}
      </form>
    </section> : null}

    {detail.packets.length ? <details className={s.card} open={!packet ? true : undefined}>
      <summary>Packet receipt history ({detail.packets.length})</summary>
      <p className={s.help}>Select a saved extraction to review it again. Reusing a receipt does not reread the file.</p>
      <ul className={s.uploadList}>{detail.packets.map(receipt => <li className={s.uploadItem} key={receipt.receiptId}>
        <div><strong>{receipt.checklist.fileName}</strong><p className={s.help}>{detail.tender.classification === 'synthetic' ? 'Synthetic demonstration' : 'Customer document'} · extracted {new Date(receipt.createdAt).toLocaleString()} · {receipt.checklist.rows.length} checklist rows</p></div>
        <button className={s.secondary} type="button" onClick={() => selectPacket(receipt)} disabled={dirty || saveState === 'saving' || packet?.receiptId === receipt.receiptId}>{packet?.receiptId === receipt.receiptId ? 'In review' : 'Review receipt'}</button>
      </li>)}</ul>
    </details> : null}

    <details className={s.card}>
      <summary>Manual versions · optional ({detail.manuals.length})</summary>
      <p className={s.help}>Manuals are references, not pack rules. Each uploaded version is immutable; only metadata and a verified hash are retained.</p>
      {detail.manuals.length ? <ul className={s.uploadList}>{detail.manuals.map(manual => <li className={s.uploadItem} key={manual.id}>
        <label><input type="checkbox" checked={manualIds.includes(manual.id)} onChange={() => toggleManual(manual.id)} disabled={!detail.capabilities.canEdit} /> <strong>{manual.label}</strong> · version {manual.ordinal}</label>
        <span className={s.help}>{manual.fileName} · {manual.hashKind === 'server_verified_upload' ? 'File verified' : 'Browser declaration, unverified'}</span>
      </li>)}</ul> : <p className={s.empty}>No manual versions recorded.</p>}
      {!packet && manualIds.length ? <p className={s.help}>These selections will be saved when you choose a packet receipt and review its checklist.</p> : null}
      {detail.capabilities.canEdit && detail.policy ? <form onSubmit={addManual} className={s.uploadForm}>
        <label className={s.fieldLabel} htmlFor="manual-label">Manual label</label>
        <input id="manual-label" className={s.textInput} value={manualLabel} onChange={event => setManualLabel(event.target.value)} maxLength={160} placeholder="Optional label" />
        <label className={s.fieldLabel} htmlFor="manual-file">Select the file to verify</label>
        <p className={s.help}>Maximum file size: 4 MB. The file is used to verify its metadata and hash, then discarded.</p>
        <input ref={manualFileRef} id="manual-file" type="file" accept=".pdf,.docx,.xlsx,.eml,.msg,.txt,.png,.jpg,.jpeg,application/pdf,text/plain" onChange={event => { const selected = event.target.files?.[0] ?? null; setManualFile(selected); setManualConsent(false); setManualError(selected && selected.size > maximumUploadBytes ? 'This file is too large. Choose a manual of 4 MB or less.' : null) }} />
        <label className={s.radioOption}><input type="checkbox" checked={manualConsent} onChange={event => setManualConsent(event.target.checked)} /> I understand the processing notice above and confirm this file is {detail.policy.classification === 'synthetic' ? 'a synthetic demonstration with no real customer data' : 'irreversibly sanitized customer material authorized for this processing route'}.</label>
        <div className={s.actions}><button className={s.secondary} type="submit" disabled={!manualFile || manualFile.size > maximumUploadBytes || !manualConsent || addingManual || uploading || issuing || deleting || saveState === 'saving'}>{addingManual ? 'Recording…' : 'Record manual version'}</button></div>
        {manualError ? <p className={s.alert} role="alert">{manualError} <button className={s.secondary} type="button" onClick={() => { if (!dirty || window.confirm('Reload this tender and discard unsaved edits?')) void load(true) }}>Reload tender</button></p> : null}
      </form> : null}
    </details>
    </section>

    <section id="review" className={s.section} aria-labelledby="review-heading">
    <h2 id="review-heading">Review</h2>
    {checklist ? <>
      <div className={s.card} role="status" aria-live="polite">
        <strong>{saveState === 'saving' ? 'Saving…' : saveState === 'saved' && !dirty ? `Saved · revision ${detail.revision}${detail.draft ? ` · ${new Date(detail.draft.createdAt).toLocaleString()}` : ''}` : saveState === 'failed' ? 'Could not save — retry' : saveState === 'conflict' ? 'Save conflict' : 'Unsaved edits'}</strong>
        {saveError ? <p className={s.alert} role="alert">{saveError}</p> : null}
        {dirty && saveState !== 'conflict' && saveState !== 'failed' ? <button className={s.secondary} type="button" onClick={() => void persistDraft(true)} disabled={saveState === 'saving' || uploading}>Save review now</button> : null}
        {saveState === 'failed' ? <button className={s.secondary} type="button" onClick={() => { setSaveState('idle'); void persistDraft(true) }}>Retry save</button> : null}
        {saveState === 'conflict' ? <div className={s.actions}>
          <button className={s.secondary} type="button" onClick={() => void compare()}>Compare with latest</button>
          <button className={s.secondary} type="button" onClick={() => void load(true)}>Reload latest and discard my edits</button>
        </div> : null}
        {conflictDetail ? <div className={s.card}>
          <h3>Latest saved revision {conflictDetail.revision}</h3>
          <p className={s.help}>Your form remains on screen. Your packet: {packet?.checklist.fileName ?? 'none'}. Latest saved packet: {conflictDetail.draft?.checklist.fileName ?? 'none'}.</p>
          <p className={s.help}>Your selected manual versions: {manualIds.length}. Latest saved: {conflictDetail.draft?.manualVersionIds.length ?? 0}. Rows that differ:</p>
          {changedRows.length === 0 ? <p className={s.help}>No reviewed row values differ. The conflict may be a packet or manual change.</p> : null}
          <ul className={s.plainList}>{changedRows.map(({ key, latest, mine }) =>
            <li key={key}><strong>{key}</strong>: latest “{latest?.action ?? 'not reviewed'}”{latest?.value ? `, ${latest.value.slice(0, 120)}` : ''}{latest?.page ? `, page ${latest.page}` : ''}; yours “{mine?.action ?? 'not reviewed'}”{mine?.value ? `, ${mine.value.slice(0, 120)}` : ''}{mine?.page ? `, page ${mine.page}` : ''}.</li>)}</ul>
          <div className={s.actions}><button className={s.primary} type="button" onClick={keepMyEdits}>Replace latest draft with my packet and edits</button><button className={s.secondary} type="button" onClick={() => void load(true)}>Use latest saved revision</button></div>
        </div> : null}
      </div>
      <DeskChecklist checklist={checklist} decisions={decisions} freezing={issuing} error={issueError} headingRef={checklistHeadingRef} onDecision={updateDecision} onFreeze={issueAssessment} freezeDisabled={!canFreeze} readOnly={!detail.capabilities.canEdit || deleting} />
      {dirty ? <p className={s.help}>Assessment is available after every edit is saved to the current revision.</p> : null}
    </> : <p className={s.empty}>{detail.packets.length ? "Choose a retained packet in Evidence to view its checklist." : detail.capabilities.canEdit && detail.policy ? "No checklist yet. Add a packet in Evidence." : "No retained checklist is available for this tender."}</p>}

    </section>
    <section id="decision" className={s.section} aria-labelledby="decision-heading">
      <h2 id="decision-heading">Decision</h2>
      {!currentAssessment ? <p className={s.help}>Complete and save the review, then issue its assessment.</p> : latestDraftRecord ? <p className={s.help}>A disposition has been recorded for this assessment. Open it in Record below.</p> : !detail.capabilities.canJudge ? <p className={s.help}>The saved assessment is ready for an authorized decision-maker.</p> : null}
    {currentAssessment ? <p className={s.actions}><button className={s.secondary} type="button" onClick={() => void openRecord(currentAssessment.id)} disabled={recordLoading}>Open assessment</button><a href="#record">Go to issued records</a></p> : null}
    {!currentAssessment && checklist && detail.capabilities.canAssess ? <div className={s.actions}><button className={s.primary} type="button" onClick={() => void issueAssessment()} disabled={!canFreeze}>{issuing ? 'Issuing…' : 'Issue assessment'}</button></div> : null}
    {currentAssessment && !latestDraftRecord && detail.capabilities.canJudge ? <form className={s.card} onSubmit={issueJudgment}>
      <h2>Record a disposition</h2>
      <p className={s.help}>This action uses the server issued assessment {currentAssessment.id}. It does not authorize an award.</p>
      <fieldset disabled={issuing}>
        <legend>Disposition</legend>
        <label className={s.radioOption}><input type="radio" name="action" checked={judgmentAction === 'request'} onChange={() => setJudgmentAction('request')} /> Request evidence</label>
        <label className={s.radioOption}><input type="radio" name="action" checked={judgmentAction === 'escalate'} onChange={() => setJudgmentAction('escalate')} /> Escalate</label>
        {detail.capabilities.canProposeException ? <label className={s.radioOption}><input type="radio" name="action" checked={judgmentAction === 'exception'} onChange={() => setJudgmentAction('exception')} /> Propose exception</label> : null}
      </fieldset>
      {judgmentAction === 'exception' ? <p className={s.help}>Exception proposed; approval not recorded. A separate formal approval is required.</p> : null}
      <label className={s.fieldLabel} htmlFor="judgment-reason">Reason</label>
      <textarea id="judgment-reason" className={s.textarea} value={judgmentReason} onChange={event => setJudgmentReason(event.target.value)} minLength={20} maxLength={2000} required rows={5} />
      <div className={s.actions}><button className={s.primary} type="submit" disabled={!judgmentAction || judgmentReason.trim().length < 20 || issuing || uploading || addingManual || deleting}>{issuing ? 'Recording…' : judgmentAction === 'exception' ? 'Record exception proposal' : 'Record judgment'}</button></div>
      {issueError ? <p className={s.alert} role="alert">{issueError}</p> : null}
    </form> : null}

    </section>
    <section id="record" className={s.section} aria-labelledby="issued-records">
      <h2 id="issued-records">Record</h2>
      {detail.records.length === 0 ? <p className={s.empty}>No assessment or judgment has been issued.</p> : <ul className={s.uploadList}>{detail.records.map(record => <li className={s.uploadItem} key={record.id}>
        <div><p className={s.tag}>{niceKind(record.kind)}</p><p className={s.help}>Issued {new Date(record.issuedAt).toLocaleString()}</p><details><summary>Record identifiers</summary><p className={s.help}>{record.id} · snapshot {record.snapshotHash.slice(0, 12)}…</p></details></div>
        <div className={s.actions}><button className={s.secondary} type="button" onClick={() => void openRecord(record.id)} disabled={recordLoading}>Open</button>{detail.capabilities.canExport ? <button className={s.secondary} type="button" onClick={() => void download(record.id)} disabled={reportPending}>{reportPending ? 'Preparing…' : 'Prepare PDF'}</button> : null}</div>
      </li>)}</ul>}
      {recordError ? <p className={s.alert} role="alert">{recordError}</p> : null}
      {preparedReport ? <div className={s.card} data-testid="prepared-report">
        <p role="status">Your PDF is ready. Select the link below to save it.</p>
        <p className={s.help}>{preparedReport.fileName}. This link stays available in this page for up to five minutes.</p>
        <a className={s.primary} href={preparedReport.url} download={preparedReport.fileName}>Download prepared PDF</a>
      </div> : null}
      {detail.expiresAt ? <p className={s.help}>Records and reports are available until {new Date(detail.expiresAt).toLocaleString()}, or until this tender is deleted. Download a report before that date if you need your own copy.</p> : <p className={s.help}>This legacy record is preserved under its earlier policy, with no automatic expiry.</p>}
      {selectedRecord && selectedOutcome ? <div className={s.card} data-testid="issued-record">
        <p className={s.eyebrow}>Verified server record</p>
        <h3>{selectedRecord.kind === 'exception_proposal' ? 'Exception proposal' : niceKind(selectedRecord.kind)}</h3>
        <p><strong>{selectedOutcome.outcome}</strong></p>
        {selectedRecord.kind === 'assessment' ? <>
          <p>Saved readiness: {selectedOutcome.readiness}.</p>
          <p className={s.help}>{selectedAssessmentChild?.kind === 'exception_proposal' ? 'An exception is proposed for this assessment; approval is not recorded. Open that record to read its reason.' : selectedAssessmentChild ? 'A human disposition is recorded for this assessment. Open that record to read the decision.' : 'Human disposition pending for this assessment.'}</p>
        </> : null}
        <h4>Retained reason</h4>
        {selectedOutcome.reason ? <p style={{ whiteSpace: 'pre-wrap' }}>{selectedOutcome.reason}</p> : <p className={s.help}>No retained reason is available.</p>}
        <p className={s.help}>This record does not authorize an award.</p>
        <p className={s.help}>Issued {new Date(selectedRecord.issuedAt).toLocaleString()}</p>
        <details><summary>Verification identifiers</summary>
          <p className={s.help}>Record {selectedRecord.id} · draft {selectedRecord.draftId}</p>
          {selectedRecord.parentRecordId ? <p className={s.help}>Parent assessment {selectedRecord.parentRecordId}</p> : null}
          <p className={s.help}>Payload hash {selectedRecord.payloadHash}</p>
          <p className={s.help}>Snapshot hash {selectedRecord.snapshotHash} · packs hash {selectedRecord.packsHash}</p>
        </details>
      </div> : null}
    </section>
    {detail.capabilities.canDelete ? <details className={s.card}>
      <summary>Delete this tender</summary>
      <p>This permanently removes “{detail.tender.title}”, its extracted evidence, manual metadata, drafts and issued records from Traceli. Copies already downloaded cannot be removed from other devices.</p>
      <form onSubmit={removeTender}>
        <label className={s.fieldLabel} htmlFor="delete-tender-name">Type the tender name to confirm</label>
        <input id="delete-tender-name" className={s.textInput} value={deleteName} onChange={event => setDeleteName(event.target.value)} disabled={deleting} autoComplete="off" />
        <div className={s.actions}><button className={s.secondary} type="submit" disabled={deleteName !== detail.tender.title || deleting || uploading || addingManual || saveState === 'saving' || issuing}>{deleting ? 'Deleting…' : 'Permanently delete tender'}</button></div>
        {deleteError ? <p className={s.alert} role="alert">{deleteError}</p> : null}
      </form>
    </details> : null}
  </div>
}
