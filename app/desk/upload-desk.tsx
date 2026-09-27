'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type RefObject } from 'react'

import { HubPath } from '@/app/hub/path'

import DeskChecklist from '@/app/desk/checklist'
import { deskExtractionFailure, deskFreezeCopy, deskWorkingCopy } from '@/lib/desk/failure-copy'
import {
  deskJudgmentChoices,
  draftDeskReasonFromView,
  sanitizeDeskChoice,
  sanitizeDeskReason,
  sanitizeUploadDeskJudgment,
  shortHash,
  type UploadDeskChoiceId,
  type UploadDeskJudgmentView,
} from '@/lib/desk/judgment'
import {
  decisionIssue,
  decisionsForRows,
  sanitizeReviewerDecisions,
  sanitizeUploadChecklist,
  type ReviewerDecision,
  type UploadChecklist,
} from '@/lib/desk/review'
import { deskAwardStoryFromView, formatDeskInstant, type DeskAwardStory } from '@/lib/desk/story'
import {
  sanitizeUploadDeskView,
  uploadDeskStorageKey,
  type UploadDeskPackId,
  type UploadDeskView,
} from '@/lib/desk/view'
import { readHubLibraryResult, type DeskTenderContext } from '@/lib/hub/library'
import { readActiveDesk, resolveDeskContinuity, writeActiveDesk } from '@/lib/hub/desk-continuity'

import s from './desk.module.css'

export type DeskPackOption = {
  packId: UploadDeskPackId
  name: string
  version: string
  blurb: string
}

type Props = {
  viewer: {
    name: string
    role: string
    organizationId: string
    mode: 'workos' | 'demo'
  }
  providerId: string
  packs: DeskPackOption[]
  initialPackId?: UploadDeskPackId | null
  engagementId?: string | null
}

type StoredDesk = {
  view: UploadDeskView | null
  checklist: UploadChecklist | null
  decisions: ReviewerDecision[] | null
  judgment: UploadDeskJudgmentView | null
  draft: { choice: UploadDeskChoiceId | '', reason: string } | null
  engagementId: string | null
}

function sanitizeDraft(value: unknown): StoredDesk['draft'] {
  if (!value || typeof value !== 'object') return null
  const draft = value as Record<string, unknown>
  if (typeof draft.reason !== 'string' || draft.reason.length > 2000) return null
  if (draft.choice === '') return { choice: '', reason: draft.reason }
  const choice = sanitizeDeskChoice(draft.choice)
  if (!choice) return null
  return { choice: choice.choice, reason: draft.reason }
}

function readStored(organizationId: string): StoredDesk | null {
  try {
    const raw = sessionStorage.getItem(uploadDeskStorageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      organizationId?: string
      view?: unknown
      judgment?: unknown
      draft?: unknown
      engagementId?: unknown
    }
    if (parsed.organizationId !== organizationId) return null
    const view = sanitizeUploadDeskView(parsed.view)
    const checklist = sanitizeUploadChecklist((parsed as { checklist?: unknown }).checklist)
    const decisions = checklist ? sanitizeReviewerDecisions((parsed as { decisions?: unknown }).decisions, checklist.rows) : null
    if (!view && !checklist) return null
    const draft = sanitizeDraft(parsed.draft)
    const engagementId = typeof parsed.engagementId === 'string' ? parsed.engagementId : null
    if (!view || parsed.judgment == null) {
      return { view, checklist, decisions, judgment: null, draft, engagementId }
    }
    const judgment = sanitizeUploadDeskJudgment(parsed.judgment)
    if (!judgment || !judgmentMatchesView(view, judgment)) {
      return { view, checklist: null, decisions: null, judgment: null, draft, engagementId }
    }
    return { view, checklist: null, decisions: null, judgment, draft: null, engagementId }
  } catch {
    return null
  }
}

function judgmentMatchesView(view: UploadDeskView, judgment: UploadDeskJudgmentView) {
  return judgment.record.supersedesRecordId === view.record.recordId
    && judgment.record.snapshotHash === view.record.snapshotHash
    && judgment.packId === view.packId
}

function writeStored(
  organizationId: string,
  view: UploadDeskView | null,
  judgment: UploadDeskJudgmentView | null,
  draft: StoredDesk['draft'] = null,
  engagementId: string | null = null,
  checklist: UploadChecklist | null = null,
  decisions: ReviewerDecision[] | null = null,
) {
  sessionStorage.setItem(uploadDeskStorageKey, JSON.stringify({
    organizationId,
    view,
    judgment,
    draft,
    engagementId,
    checklist,
    decisions,
  }))
}

function clearStored() {
  sessionStorage.removeItem(uploadDeskStorageKey)
}

type DeskNotice = {
  summary: string
  detail: string
}

function deskNotice(summary: string, detail = ''): DeskNotice {
  return { summary, detail }
}

function plural(count: number, singular: string, pluralLabel: string) {
  return `${count} ${count === 1 ? singular : pluralLabel}`
}

function attestationBadge(view: UploadDeskView, fieldId: string) {
  const method = view.snapshot.fields.find(field => field.fieldId === fieldId)?.provenance.verificationMethod
  if (method === 'reviewer_attested') return <span className={s.badgeReview}>Reviewer attested</span>
  if (method === 'adapter_extract') return <span className={s.badgeExtracted}>Extracted</span>
  return null
}

function emphasize(text: string, emphasis: string | null) {
  if (!emphasis) return text
  const index = text.indexOf(emphasis)
  if (index < 0) return text
  return <>{text.slice(0, index)}<strong>{emphasis}</strong>{text.slice(index + emphasis.length)}</>
}

export default function UploadDesk({ viewer, providerId, packs, initialPackId = null, engagementId = null }: Props) {
  const mountedRef = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const judgmentHeadingRef = useRef<HTMLHeadingElement>(null)
  const recordHeadingRef = useRef<HTMLHeadingElement>(null)
  const checklistHeadingRef = useRef<HTMLHeadingElement>(null)
  const focusTarget = useRef<'judgment' | 'record' | 'checklist' | null>(null)
  const reasonId = useId()
  const [pending, setPending] = useState(false)
  const [freezing, setFreezing] = useState(false)
  const [judging, setJudging] = useState(false)
  const [error, setError] = useState<DeskNotice | null>(null)
  const [checklistError, setChecklistError] = useState<string | null>(null)
  const [judgmentError, setJudgmentError] = useState<string | null>(null)
  const [reportError, setReportError] = useState<string | null>(null)
  const [reportPending, setReportPending] = useState(false)
  const [result, setResult] = useState<UploadDeskView | null>(null)
  const [checklist, setChecklist] = useState<UploadChecklist | null>(null)
  const [decisions, setDecisions] = useState<ReviewerDecision[]>([])
  const [judgment, setJudgment] = useState<UploadDeskJudgmentView | null>(null)
  const [restored, setRestored] = useState(false)
  const [fileLabel, setFileLabel] = useState<string | null>(null)
  const [choice, setChoice] = useState<UploadDeskChoiceId | ''>('')
  const [reason, setReason] = useState('')
  const [announce, setAnnounce] = useState('')
  const [packId, setPackId] = useState<UploadDeskPackId | ''>(initialPackId ?? '')
  const [tender, setTender] = useState<DeskTenderContext | null>(null)
  const [tenderProblem, setTenderProblem] = useState<string | null>(null)
  const [blockUpload, setBlockUpload] = useState(false)
  const [storageError, setStorageError] = useState<string | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    setRestored(false)
    setResult(null)
    setChecklist(null)
    setDecisions([])
    setJudgment(null)
    setChoice('')
    setReason('')
    const libraryResult = readHubLibraryResult(viewer.organizationId)
    const stored = readStored(viewer.organizationId)
    const active = readActiveDesk(viewer.organizationId)
    const query = new URLSearchParams(window.location.search)
    const continuity = resolveDeskContinuity({
      library: libraryResult.ok ? libraryResult.state : { organizationId: viewer.organizationId, uploads: [], engagements: [] },
      requestedTenderId: engagementId,
      requestedTenderPresent: query.has('engagement'),
      requestedPackId: initialPackId,
      requestedPackPresent: query.has('pack'),
      activeTenderId: active?.engagementId ?? null,
      activePackId: active?.packId ?? null,
      storedTenderId: stored?.engagementId ?? null,
      storedPackId: stored?.view?.packId ?? stored?.checklist?.packId ?? null,
      hasStored: Boolean(stored),
    })
    setTender(continuity.tender)
    setPackId(continuity.packId ?? '')
    setTenderProblem(libraryResult.ok ? continuity.problem : libraryResult.error)
    setBlockUpload(libraryResult.ok ? continuity.blockUpload : query.has('engagement'))
    if (stored && continuity.restore && libraryResult.ok) {
      setResult(stored.view)
      setChecklist(stored.view ? null : stored.checklist)
      setDecisions(stored.view || !stored.checklist ? [] : decisionsForRows(stored.checklist.rows, stored.decisions))
      setJudgment(stored.judgment)
      if (stored.view && !stored.judgment) {
        if (stored.draft) {
          setChoice(stored.draft.choice)
          setReason(stored.draft.reason)
        } else {
          primeDraft(stored.view)
        }
      }
    }
    setRestored(true)
  }, [viewer.organizationId, engagementId, initialPackId])

  useEffect(() => {
    if (!restored || blockUpload || !packId) return
    try {
      writeActiveDesk(viewer.organizationId, { engagementId: tender?.id ?? null, packId })
      setStorageError(current => current?.startsWith('This browser could not remember the active tender.') ? null : current)
    } catch {
      setStorageError('This browser could not remember the active tender. Reopen it from the Knowledge hub if you leave this page.')
    }
  }, [restored, blockUpload, packId, tender, viewer.organizationId])

  function persist(view: UploadDeskView | null, record: UploadDeskJudgmentView | null, draft: StoredDesk['draft'] = null,
    checklistValue: UploadChecklist | null = null, decisionValues: ReviewerDecision[] | null = null) {
    if (!mountedRef.current) return false
    try {
      writeStored(viewer.organizationId, view, record, draft, tender?.id ?? null, checklistValue, decisionValues)
      setStorageError(current => current?.startsWith('This browser could not remember the active tender.') ? current : null)
      return true
    } catch {
      setStorageError('This browser could not save the desk record. Keep this page open; the work may be lost if you leave or refresh.')
      return false
    }
  }

  useEffect(() => {
    if (!restored || !result || judgment) return
    persist(result, null, { choice, reason })
  }, [restored, result, judgment, choice, reason, viewer.organizationId, tender])

  useEffect(() => {
    if (!restored || result || !checklist) return
    persist(null, null, null, checklist, decisions)
  }, [restored, result, checklist, decisions, viewer.organizationId, tender])

  useEffect(() => {
    const target = focusTarget.current
    if (!target) return
    focusTarget.current = null
    if (target === 'judgment') judgmentHeadingRef.current?.focus()
    if (target === 'record') recordHeadingRef.current?.focus()
    if (target === 'checklist') checklistHeadingRef.current?.focus()
  }, [result, judgment, checklist])

  function primeDraft(view: UploadDeskView) {
    setChoice(view.readiness === 'green' ? '' : 'request')
    setReason(draftDeskReasonFromView(view))
    setJudgmentError(null)
    setAnnounce('')
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (judging || freezing || blockUpload) return
    const form = event.currentTarget
    const data = new FormData(form)
    if (!(data.get('file') instanceof File) || (data.get('file') as File).size < 1) {
      setError(deskNotice('Choose a file to upload.'))
      return
    }
    setPending(true)
    setError(null)
    setChecklistError(null)
    try {
      const response = await fetch('/api/desk/checklist', { method: 'POST', body: data })
      const body = await response.json().catch(() => null) as { error?: string } | UploadChecklist | null
      if (!response.ok) {
        setError(deskExtractionFailure(body) ?? deskNotice('The packet could not be read into a checklist. Try again.'))
        return
      }
      const next = sanitizeUploadChecklist(body)
      if (!next || next.organizationId !== viewer.organizationId || (tender && next.packId !== tender.primaryPackId)) {
        setError(deskNotice('The checklist came back in an unexpected shape. Nothing was stored.'))
        return
      }
      const nextDecisions = decisionsForRows(next.rows, null)
      persist(null, null, null, next, nextDecisions)
      focusTarget.current = 'checklist'
      setJudgment(null)
      setResult(null)
      setChoice('')
      setReason('')
      setDecisions(nextDecisions)
      setChecklist(next)
      setAnnounce('Checklist ready.')
    } catch {
      setError(deskNotice('The desk could not be reached. Check your connection and try again.'))
    } finally {
      setPending(false)
    }
  }

  function startAnother() {
    formRef.current?.reset()
    setFileLabel(null)
    try {
      clearStored()
      setStorageError(null)
    } catch {
      setStorageError('This browser could not clear the saved desk record. Check browser storage before leaving.')
    }
    setResult(null)
    setChecklist(null)
    setDecisions([])
    setJudgment(null)
    setChoice('')
    setReason('')
    setError(null)
    setChecklistError(null)
    setJudgmentError(null)
    setReportError(null)
    setAnnounce('')
    setPackId(tender?.primaryPackId ?? initialPackId ?? '')
  }

  function updateDecision(key: string, patch: Partial<ReviewerDecision>) {
    setChecklistError(null)
    setDecisions(current => current.map(decision => decision.key === key ? { ...decision, ...patch, key } : decision))
  }

  async function freezeChecklist() {
    if (!checklist || freezing || pending || judging) return
    const issue = checklist.rows.map(row => {
      const decision = decisions.find(item => item.key === row.key)
      return decision ? decisionIssue(row.title, decision) : `Check “${row.title}”.`
    }).find(item => item)
    if (issue) {
      setChecklistError(issue)
      return
    }
    setFreezing(true)
    setChecklistError(null)
    setAnnounce('')
    try {
      const response = await fetch('/api/desk/freeze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ checklist, decisions }),
      })
      const body = await response.json().catch(() => null) as { error?: string } | unknown
      if (!response.ok) {
        const message = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
          ? body.error
          : 'The checklist could not be frozen. Try again.'
        setChecklistError(message)
        return
      }
      const view = sanitizeUploadDeskView(body)
      if (!view || view.organizationId !== viewer.organizationId || view.sourceFileHash !== checklist.sourceFileHash || view.packId !== checklist.packId) {
        setChecklistError('The freeze came back in an unexpected shape. The checklist is unchanged.')
        return
      }
      persist(view, null)
      focusTarget.current = 'judgment'
      primeDraft(view)
      setChecklist(null)
      setDecisions([])
      setJudgment(null)
      setResult(view)
      setAnnounce('Assessment frozen.')
    } catch {
      setChecklistError('The desk could not be reached. Check your connection and try again.')
    } finally {
      setFreezing(false)
    }
  }

  async function confirmJudgment() {
    if (!result || judging || pending) return
    if (!choice) {
      setJudgmentError('Choose a disposition.')
      return
    }
    const reasonText = sanitizeDeskReason(reason)
    if (!reasonText) {
      setJudgmentError('Enter a reason between 20 and 2,000 characters.')
      return
    }
    setJudging(true)
    setJudgmentError(null)
    setAnnounce('')
    try {
      const response = await fetch('/api/desk/disposition', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ decision: choice, reason: reasonText, view: result }),
      })
      const body = await response.json().catch(() => null) as { error?: string } | unknown
      if (!response.ok) {
        const message = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
          ? body.error
          : 'The judgment could not be frozen. Try again.'
        setJudgmentError(message)
        return
      }
      const recorded = sanitizeUploadDeskJudgment(body)
      if (!recorded || !judgmentMatchesView(result, recorded)) {
        setJudgmentError('The judgment came back in an unexpected shape. The assessment freeze is unchanged.')
        return
      }
      persist(result, recorded)
      focusTarget.current = 'record'
      setAnnounce('Record frozen · verified')
      setJudgment(recorded)
    } catch {
      setJudgmentError('The desk could not be reached. Check your connection and try again.')
    } finally {
      setJudging(false)
    }
  }

  async function downloadPilotReport() {
    if (!result || !judgment || reportPending) return
    setReportPending(true)
    setReportError(null)
    setAnnounce('Preparing the pilot report.')
    try {
      const response = await fetch('/api/desk/pilot-report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ view: result, judgment }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null
        setReportError(body?.error ?? 'The pilot report could not be prepared. Try again.')
        setAnnounce('')
        return
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      const disposition = response.headers.get('content-disposition') ?? ''
      const match = /filename="([^"]+)"/.exec(disposition)
      anchor.href = url
      anchor.download = match?.[1] ?? 'trace-li-pilot-report.pdf'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      setAnnounce('Pilot report downloaded.')
    } catch {
      setReportError('The pilot report could not be downloaded. Check your connection and try again.')
      setAnnounce('')
    } finally {
      setReportPending(false)
    }
  }

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value)
      setAnnounce(`${label} copied.`)
    } catch {
      setAnnounce(`${label} could not be copied. Select it and copy.`)
    }
  }

  const story = result ? deskAwardStoryFromView(result, viewer.name) : null
  const selectedPack = packs.find(pack => pack.packId === packId)
  const providerNote = providerId === 'mock'
    ? 'Extraction is the offline mock. It hashes the file and does not read the document body.'
    : `Extraction provider is ${providerId}. Trace-li still refuses to store file bytes or vendor payloads.`
  const sessionNote = viewer.mode === 'demo'
    ? 'This is the local fixture session.'
    : 'You are signed in. The file is not kept after this request.'
  const reasonLength = reason.trim().length
  const busy = pending || freezing || judging
  const recordedChoice = judgment ? deskJudgmentChoices.find(item => item.id === judgment.choice) : undefined

  return (
    <div className={s.page} data-has-result={result ? 'true' : undefined}>
      <header className={s.intro}>
        <h1>Award desk</h1>
        <p className={s.lede}>
          {judgment
            ? 'The golden thread is frozen in this browser. Copy the registry ids, or start another packet when you are done.'
            : result
              ? 'Trace-li froze this checklist. Review the prep, then record your judgment to finish the golden thread. The file itself is not stored.'
              : checklist
                ? 'The checklist is ready. Fix open items that are in the file, then freeze the assessment. Trace-li does not decide the award.'
                : tender
                  ? `Upload the packet for ${tender.name}. Trace-li reads it against ${selectedPack?.name ?? 'the seeded pack'} and waits for your checklist before the freeze.`
                  : 'Upload a packet against a seeded pack. Check the checklist, then freeze a citeable golden thread. Humans dispose; Trace-li freezes the proof.'}
        </p>
        {tender ? <HubPath current={judgment ? 'freeze' : 'desk'} tender={tender} /> : null}
        {restored && !tender ? (
          <p className={s.cue} data-testid="desk-cold-cue">
            New here? <Link href="/hub">Start in the Knowledge hub</Link>.
          </p>
        ) : null}
      </header>
      {tenderProblem ? <p className={s.alert} role="alert" data-testid="tender-problem">{tenderProblem} <Link href="/hub">Open Knowledge hub</Link>.</p> : null}
      {storageError ? <p className={s.alert} role="alert" data-testid="desk-storage-error">{storageError}</p> : null}
      {tender ? (
        <aside className={s.banner} data-testid="tender-context">
          <p className={s.eyebrow}>This tender</p>
          <h2>{tender.name}</h2>
          <p>
            Pack in play: {selectedPack?.name ?? tender.primaryPackId}. One Trace-li pack drives judgment on this award.
          </p>
          {tender.uploads.length === 0 ? (
            <p>No manuals attached. The seeded pack alone is enough.</p>
          ) : (
            <>
              <p>Conditions in play · not evaluated</p>
              <ul className={s.plainList}>
                {tender.uploads.map(upload => <li key={upload.id}>{upload.label}</li>)}
              </ul>
            </>
          )}
        </aside>
      ) : null}
      {checklist && !result ? (
        <DeskChecklist
          checklist={checklist}
          decisions={decisions}
          freezing={freezing}
          error={checklistError}
          headingRef={checklistHeadingRef}
          onDecision={updateDecision}
          onFreeze={freezeChecklist}
        />
      ) : null}
      {result && story ? (
        <AwardResult
          result={result}
          story={story}
          judgment={judgment}
          recordedChoice={recordedChoice}
          judging={judging}
          announce={announce}
          judgmentError={judgmentError}
          choice={choice}
          reason={reason}
          reasonId={reasonId}
          reasonLength={reasonLength}
          reviewerName={viewer.name}
          judgmentHeadingRef={judgmentHeadingRef}
          recordHeadingRef={recordHeadingRef}
          onChoice={next => {
            setChoice(next)
            setJudgmentError(null)
          }}
          onReason={setReason}
          onConfirm={confirmJudgment}
          onCopy={copyValue}
          onDownloadReport={downloadPilotReport}
          reportPending={reportPending}
          reportError={reportError}
          tender={tender}
        />
      ) : null}
      <form ref={formRef} className={`${s.card} ${s.startCard}`} onSubmit={onSubmit} aria-busy={pending}>
        {result || checklist ? (
          <p className={`${s.help} ${s.leadIn}`}>Choose another pack and file to replace this checklist, or clear it.</p>
        ) : null}
        {tender ? <input type="hidden" name="procurementReference" value={tender.name} /> : null}
        <fieldset>
          <legend>Donor pack</legend>
          <div className={s.packs}>
            {packs.map(pack => (
              <label className={s.pack} key={pack.packId} data-testid={`pack-${pack.packId}`}>
                <input
                  type="radio"
                  name="packId"
                  value={pack.packId}
                  required
                  disabled={busy || blockUpload || Boolean(tender && tender.primaryPackId !== pack.packId)}
                  checked={packId === pack.packId}
                  onChange={() => setPackId(pack.packId)}
                />
                <span>
                  <strong>{pack.name}</strong>
                  <span>{pack.blurb} Version {pack.version}.</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className={s.file}>
          <label className={s.fileLegend} htmlFor="packet-file">Packet file</label>
          <div className={s.fileControl}>
            <input
              id="packet-file"
              className={s.fileInput}
              name="file"
              type="file"
              required
              disabled={busy || blockUpload}
              aria-describedby="packet-file-help"
              accept=".pdf,.docx,.xlsx,.eml,.msg,.txt,.png,.jpg,.jpeg,application/pdf,text/plain"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const file = event.currentTarget.files?.[0]
                setFileLabel(file && file.size > 0 ? file.name : null)
              }}
            />
            <label className={s.fileButton} htmlFor="packet-file">Choose file</label>
            <span className={s.fileName} data-empty={fileLabel ? undefined : 'true'}>
              {fileLabel ?? 'No file selected'}
            </span>
          </div>
          <span className={s.help} id="packet-file-help">PDF, Word, Excel, email, text, or image. Up to 8 MB.</span>
        </div>
        <div className={s.actions}>
          <button className={s.primary} type="submit" disabled={busy || blockUpload}>
            {pending ? deskWorkingCopy.button : checklist ? 'Extract again' : 'Extract packet'}
          </button>
          {result || checklist ? (
            <button className={s.secondary} type="button" onClick={startAnother} disabled={busy}>
              Start another packet
            </button>
          ) : null}
        </div>
        <p className={s.status} role="status" aria-live="polite">{pending || freezing ? (
          <span className={s.working}>
            <span className={s.spinner} aria-hidden="true" />
            <span>{freezing ? deskFreezeCopy.status : deskWorkingCopy.status}</span>
          </span>
        ) : null}</p>
        {error ? (
          <p className={s.alert} role="alert">
            {error.summary}
            {error.detail ? <span className={s.alertDetail}>{error.detail}</span> : null}
          </p>
        ) : null}
        <p className={`${s.help} ${s.providerNote}`}>{providerNote} {sessionNote}</p>
      </form>
      {!result && !checklist ? (
        <p className={s.empty}>
          {restored
            ? tender
              ? 'No checklist yet. Upload the packet to start one for this tender.'
              : 'No checklist yet.'
            : 'Loading the last record from this browser…'}
        </p>
      ) : null}
      <p className={s.footer}>
        <Link href="/hub">Knowledge hub</Link>
        <span aria-hidden="true"> · </span>
        <Link href="/demo">Try the fictional walkthrough</Link>
      </p>
    </div>
  )
}

function AwardResult({
  result,
  story,
  judgment,
  recordedChoice,
  judging,
  announce,
  judgmentError,
  choice,
  reason,
  reasonId,
  reasonLength,
  reviewerName,
  judgmentHeadingRef,
  recordHeadingRef,
  onChoice,
  onReason,
  onConfirm,
  onCopy,
  onDownloadReport,
  reportPending,
  reportError,
  tender,
}: {
  result: UploadDeskView
  story: DeskAwardStory
  judgment: UploadDeskJudgmentView | null
  recordedChoice: (typeof deskJudgmentChoices)[number] | undefined
  judging: boolean
  announce: string
  judgmentError: string | null
  choice: UploadDeskChoiceId | ''
  reason: string
  reasonId: string
  reasonLength: number
  reviewerName: string
  judgmentHeadingRef: RefObject<HTMLHeadingElement | null>
  recordHeadingRef: RefObject<HTMLHeadingElement | null>
  onChoice: (choice: UploadDeskChoiceId) => void
  onReason: (reason: string) => void
  onConfirm: () => void
  onCopy: (value: string, label: string) => void
  onDownloadReport: () => void
  reportPending: boolean
  reportError: string | null
  tender: DeskTenderContext | null
}) {
  const mapped = result.fields.filter(field => field.fromPacket)
  const missing = result.fields.filter(field => !field.fromPacket)
  return (
    <section className={s.results} aria-labelledby={judgment ? 'decision-record-title' : 'judgment-title'}>
      <p className={s.live} role="status" aria-live="polite">{judging ? 'Freezing your judgment…' : announce}</p>
      <div className={s.awardLayout}>
        <aside className={s.metaPanel}>
          <p className={s.eyebrow}>Packet</p>
          <dl>
            <div className={s.metaBlock}><dt>File</dt><dd>{result.fileName}</dd></div>
            <div className={s.metaBlock}><dt>Pack</dt><dd>{result.packName}</dd></div>
            <div className={s.metaBlock}><dt>Version</dt><dd>{result.packVersion}</dd></div>
            <div className={s.metaBlock}><dt>Reference</dt><dd>{result.procurementReference}</dd></div>
            <div className={s.metaBlock}><dt>Reviewer</dt><dd>{reviewerName}</dd></div>
          </dl>
        </aside>
        <div>
          {judgment ? (
            <div className={s.record} data-testid="decision-record">
              <div className={s.recordHeader}>
                <p className={s.eyebrow}>Decision record</p>
                <h2 id="decision-record-title" ref={recordHeadingRef} tabIndex={-1}>
                  Decision record · {result.procurementReference}
                </h2>
                <div className={s.recordStatus}>
                  <span className={s.bar} aria-hidden="true" />
                  {recordedChoice?.status ?? 'Judgment recorded'}
                </div>
                <p className={s.freezeNote} data-testid="golden-thread">
                  Golden thread. This is the citeable pre-signature freeze for this tender. Humans dispose; Trace-li freezes the proof.
                </p>
              </div>
              <div className={s.recordSection}>
                <h3>Packet</h3>
                <p><strong>{result.fileName}</strong></p>
                <p className={s.muted}>{result.packName} · version {result.packVersion}</p>
              </div>
              <div className={s.recordSection}>
                <h3>Evidence state</h3>
                {story.evidenceLines.map(line => <p key={line}>{line}</p>)}
              </div>
              <div className={s.recordSection}>
                <h3>Packet prep summary</h3>
                <p>{story.prepSummary}</p>
                <p className={s.who}>Packet prep · {formatDeskInstant(result.record.frozenAt)}</p>
              </div>
              <div className={s.recordSection}>
                <h3>Human disposition</h3>
                <p><strong>{recordedChoice?.label ?? 'Judgment recorded'}</strong></p>
                <p data-testid="recorded-reason">{judgment.reason}</p>
                {judgment.waiver ? (
                  <p>
                    Desk-session exception note {judgment.waiver.waiverId}. Authority is this signed-in reviewer. This is not a formal organization waiver.
                  </p>
                ) : null}
                <p className={s.who}>{reviewerName} · {formatDeskInstant(judgment.record.frozenAt)}</p>
              </div>
              <div className={s.recordSection}>
                <h3>Pack at disposition</h3>
                <table className={s.packTable}>
                  <thead>
                    <tr>
                      <th>Pack</th>
                      <th>Version</th>
                      <th>Readiness</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{judgment.packName}</td>
                      <td>{judgment.packVersion}</td>
                      <td>{judgment.readiness}</td>
                    </tr>
                  </tbody>
                </table>
                <p className={s.freezeNote}>Frozen at disposition. Starting another packet does not rewrite this record.</p>
              </div>
              {tender ? (
                <div className={s.recordSection} data-testid="conditions-in-play">
                  <h3>Conditions in play · not evaluated</h3>
                  {tender.uploads.length === 0 ? (
                    <p>No manuals were attached. The seeded pack alone was evaluated.</p>
                  ) : (
                    <>
                      <p>These files were attached to the tender. Trace-li did not evaluate them as pack rules.</p>
                      <ul className={s.plainList}>
                        {tender.uploads.map(upload => <li key={upload.id}>{upload.label}</li>)}
                      </ul>
                    </>
                  )}
                </div>
              ) : null}
              <div className={s.recordSection} data-testid="frozen-registry">
                <h3>Frozen registry record</h3>
                <p className={s.frozenBadge} data-testid="record-frozen-badge">Record frozen · verified</p>
                <dl className={s.frozenMeta}>
                  <div>
                    <dt>Record id</dt>
                    <dd data-testid="frozen-record-id">{judgment.record.recordId}</dd>
                  </div>
                  <div>
                    <dt>Snapshot hash</dt>
                    <dd title={judgment.record.snapshotHash} data-testid="frozen-snapshot-hash">
                      {shortHash(judgment.record.snapshotHash)}
                    </dd>
                  </div>
                  <div>
                    <dt>Packs hash</dt>
                    <dd title={judgment.record.packsHash}>{shortHash(judgment.record.packsHash)}</dd>
                  </div>
                  <div>
                    <dt>Pipeline</dt>
                    <dd>{judgment.readiness} · {plural(judgment.findingCount, 'finding', 'findings')}</dd>
                  </div>
                  <div>
                    <dt>Supersedes</dt>
                    <dd>{judgment.record.supersedesRecordId}</dd>
                  </div>
                </dl>
                <p className={s.freezeNote}>
                  Trace-li cites registry fields and pack provenance only — not source file bytes. Method: {judgment.record.hashMethod}.
                </p>
              </div>
              <div className={s.recordActions}>
                <button className={s.mint} type="button" onClick={() => onCopy(judgment.record.recordId, 'Record id')}>
                  Copy record id
                </button>
                <button className={s.secondary} type="button" onClick={() => onCopy(judgment.record.snapshotHash, 'Snapshot hash')}>
                  Copy snapshot hash
                </button>
                <button
                  className={s.primary}
                  type="button"
                  data-testid="download-pilot-report"
                  onClick={onDownloadReport}
                  disabled={reportPending}
                  aria-busy={reportPending}
                >
                  {reportPending ? 'Preparing the pilot report…' : 'Download pilot report (PDF)'}
                </button>
              </div>
              <p className={s.freezeNote}>
                A plain-language memo of this freeze, for a procurement or grants lead to forward. Trace-li does not certify the award.
              </p>
              {reportError ? <p className={s.alert} role="alert">{reportError}</p> : null}
            </div>
          ) : (
            <>
              <div
                className={`${s.statusPill} ${story.pill.tone === 'ready' ? s.statusReady : ''}`}
                data-testid="prep-status"
              >
                <span className={s.dotLive} aria-hidden="true" />
                {story.pill.label}
              </div>
              <div className={s.sectionHead}>
                <h2 id="packet-prep-title">Packet prep</h2>
                <span className={s.sub}>{story.frozenLabel}</span>
              </div>
              <ol className={s.timeline} data-testid="packet-timeline">
                {story.steps.map(step => (
                  <li key={step.id}>
                    <span className={s.node} aria-hidden="true" />
                    <div className={s.phase}>{step.phase}</div>
                    <div className={s.work}>
                      {emphasize(step.work, step.emphasis)}
                      {step.gap ? <> <span className={s.tagGap}>gap</span></> : null}
                    </div>
                  </li>
                ))}
              </ol>
              <div className={s.prepLine}>
                <span className={s.prepMark} aria-hidden="true" />
                <p className={s.prepTitle}>
                  {story.packTitle} <span className={s.prepVersion}>version {story.packVersion}</span>
                </p>
              </div>
              <div className={s.splitPanels} data-testid="split-panels">
                <div className={`${s.panel} ${s.panelShow}`}>
                  <div className={s.panelTitle}>What the file can show</div>
                  <ul>
                    {story.canShow.map(item => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div className={`${s.panel} ${s.panelNeed}`}>
                  <div className={s.panelTitle}>What still needs you</div>
                  <ul>
                    {story.stillNeeds.map(line => (
                      line.kind === 'or'
                        ? <li key="or" className={s.or}>— or —</li>
                        : <li key={line.text}>{line.text}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className={`${s.card} ${s.formCard}`} data-testid="judgment-form">
                <p className={s.eyebrow}>{result.procurementReference}</p>
                <h2 id="judgment-title" ref={judgmentHeadingRef} tabIndex={-1}>Record disposition</h2>
                <p className={s.lead}>
                  Your judgment becomes the decision record. It writes a new Trace-li freeze that supersedes the assessment. The draft is a starting point — edit it freely.
                </p>
                {judgmentError ? <p className={s.alert} role="alert">{judgmentError}</p> : null}
                <fieldset className={s.field} disabled={judging}>
                  <legend className={s.fieldLabel} id="decision-label">Decision</legend>
                  <div
                    className={s.radioGroup}
                    role="radiogroup"
                    aria-labelledby="decision-label"
                    aria-describedby={choice === 'exception' ? 'exception-note' : undefined}
                  >
                    {deskJudgmentChoices.map(option => (
                      <label key={option.id} className={`${s.radioOption} ${choice === option.id ? s.radioSelected : ''}`}>
                        <input
                          type="radio"
                          name="disposition"
                          value={option.id}
                          checked={choice === option.id}
                          disabled={judging}
                          onChange={() => onChoice(option.id)}
                        />
                        <span>
                          <span className={s.optLabel}>{option.label}</span>
                          <span className={s.optHint}>{option.hint}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                {choice === 'exception' ? (
                  <p className={`${s.help} ${s.exceptionNote}`} id="exception-note">
                    Accepting with an exception adds a desk-session exception note on the new record. It is not a formal organization waiver.
                  </p>
                ) : null}
                <div className={`${s.field} ${s.reason}`}>
                  <label className={s.fieldLabel} htmlFor={reasonId}>Reason</label>
                  <textarea
                    id={reasonId}
                    className={s.textarea}
                    value={reason}
                    onChange={event => onReason(event.target.value)}
                    minLength={20}
                    maxLength={2000}
                    spellCheck
                    disabled={judging}
                    aria-invalid={reasonLength > 0 && (reasonLength < 20 || reasonLength > 2000)}
                    aria-describedby="reason-help reason-count"
                  />
                  <p className={s.help} id="reason-help">Edit the draft. 20–2,000 characters. Kept in this browser until you start another packet.</p>
                  <p className={s.help} id="reason-count">{reasonLength} / 2,000</p>
                </div>
                <div className={`${s.actions} ${s.formActions}`}>
                  <button
                    className={s.primary}
                    type="button"
                    onClick={onConfirm}
                    disabled={judging}
                    aria-busy={judging}
                    data-testid="confirm-judgment"
                  >
                    {judging ? 'Freezing judgment…' : 'Confirm judgment'}
                  </button>
                </div>
              </div>
            </>
          )}
          <details className={s.detail}>
            <summary>Findings and pack fields</summary>
            <h3 className={s.sectionTitle}>Findings ({result.findingCount})</h3>
            {result.findings.length === 0 ? (
              <p>No findings on this freeze.</p>
            ) : (
              <ul className={s.findings}>
                {result.findings.map(finding => (
                  <li className={s.finding} key={finding.findingId}>
                    <header>
                      <strong>{finding.title}</strong>
                      <span className={s.badge}>{finding.severity}</span>
                    </header>
                    <p>{finding.summary}</p>
                  </li>
                ))}
              </ul>
            )}
            <h3 className={s.sectionTitle}>Mapped from the packet ({mapped.length})</h3>
            {mapped.length === 0 ? (
              <p>
                No fragment mapped onto a registry field.
                {result.unmappedFragmentCount > 0
                  ? ` ${result.unmappedFragmentCount} fragment${result.unmappedFragmentCount === 1 ? '' : 's'} stayed unmapped.`
                  : ''}
              </p>
            ) : (
              <ul className={s.fields}>
                {mapped.map(field => (
                  <li className={s.fieldRow} key={field.fieldId}>
                    <span className={s.key}>{field.key}</span>
                    <span className={s.badge}>{field.state}</span>
                    {attestationBadge(result, field.fieldId)}
                    <p>{field.detail}</p>
                  </li>
                ))}
              </ul>
            )}
            <h3 className={s.sectionTitle}>Pack fields still missing ({missing.length})</h3>
            {missing.length === 0 ? (
              <p>Every pack field was present on the registry snapshot.</p>
            ) : (
              <ul className={s.fields}>
                {missing.map(field => (
                  <li className={s.fieldRow} key={field.fieldId}>
                    <span className={s.key}>{field.key}</span>
                    <span className={s.badge}>{field.state}</span>
                    {attestationBadge(result, field.fieldId)}
                    <p>{field.detail}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className={s.help}>
              Assessment record {result.record.recordId}. Disposition {result.record.disposition.replaceAll('_', ' ')}.
              {' '}Snapshot hash {shortHash(result.record.snapshotHash)}.
              {' '}A row still missing was not stated in the packet. A mapped missing row means the packet states that control is absent. A negative value is an adverse fact. None of these is a pass.
              This view stays in this browser until you start another packet. The file is not stored.
            </p>
          </details>
        </div>
      </div>
    </section>
  )
}
