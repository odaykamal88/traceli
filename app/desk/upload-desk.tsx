'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react'

import { deskExtractionFailure, deskWorkingCopy } from '@/lib/desk/failure-copy'
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
  sanitizeUploadDeskView,
  uploadDeskStorageKey,
  type UploadDeskReadiness,
  type UploadDeskView,
} from '@/lib/desk/view'

import s from './desk.module.css'

export type DeskPackOption = {
  packId: 'global-fund' | 'fcdo-prime'
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
}

const readinessCopy: Record<UploadDeskReadiness, { label: string, className: string, next: string }> = {
  red: {
    label: 'Red · evidence gaps',
    className: s.readinessRed,
    next: 'Evidence gaps are still open. Record your judgment below.',
  },
  amber: {
    label: 'Amber · warnings',
    className: s.readinessAmber,
    next: 'Warnings are still open. Record your judgment below.',
  },
  green: {
    label: 'Green · pack checks passed',
    className: s.readinessGreen,
    next: 'Pack checks passed. You can still request evidence, accept with a desk-session exception, or escalate. This is not a certification.',
  },
  unknown: {
    label: 'Unknown · not judged',
    className: s.readinessUnknown,
    next: 'Readiness did not come back with a colour. Record your judgment before sign-off.',
  },
}

type StoredDesk = {
  view: UploadDeskView
  judgment: UploadDeskJudgmentView | null
  draft: { choice: UploadDeskChoiceId | '', reason: string } | null
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
    const parsed = JSON.parse(raw) as { organizationId?: string, view?: unknown, judgment?: unknown, draft?: unknown }
    if (parsed.organizationId !== organizationId) return null
    const view = sanitizeUploadDeskView(parsed.view)
    if (!view) return null
    const draft = sanitizeDraft(parsed.draft)
    if (parsed.judgment == null) return { view, judgment: null, draft }
    const judgment = sanitizeUploadDeskJudgment(parsed.judgment)
    if (!judgment || !judgmentMatchesView(view, judgment)) return { view, judgment: null, draft }
    return { view, judgment, draft: null }
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
  view: UploadDeskView,
  judgment: UploadDeskJudgmentView | null,
  draft: StoredDesk['draft'] = null,
) {
  sessionStorage.setItem(uploadDeskStorageKey, JSON.stringify({ organizationId, view, judgment, draft }))
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

export default function UploadDesk({ viewer, providerId, packs }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const judgmentHeadingRef = useRef<HTMLHeadingElement>(null)
  const recordHeadingRef = useRef<HTMLHeadingElement>(null)
  const focusTarget = useRef<'judgment' | 'record' | null>(null)
  const reasonId = useId()
  const [pending, setPending] = useState(false)
  const [judging, setJudging] = useState(false)
  const [error, setError] = useState<DeskNotice | null>(null)
  const [judgmentError, setJudgmentError] = useState<string | null>(null)
  const [result, setResult] = useState<UploadDeskView | null>(null)
  const [judgment, setJudgment] = useState<UploadDeskJudgmentView | null>(null)
  const [restored, setRestored] = useState(false)
  const [fileLabel, setFileLabel] = useState<string | null>(null)
  const [choice, setChoice] = useState<UploadDeskChoiceId | ''>('')
  const [reason, setReason] = useState('')
  const [announce, setAnnounce] = useState('')

  useEffect(() => {
    const stored = readStored(viewer.organizationId)
    if (stored) {
      setResult(stored.view)
      setJudgment(stored.judgment)
      if (!stored.judgment) {
        if (stored.draft) {
          setChoice(stored.draft.choice)
          setReason(stored.draft.reason)
        } else {
          primeDraft(stored.view)
        }
      }
    }
    setRestored(true)
  }, [viewer.organizationId])

  useEffect(() => {
    if (!restored || !result || judgment) return
    writeStored(viewer.organizationId, result, null, { choice, reason })
  }, [restored, result, judgment, choice, reason, viewer.organizationId])

  useEffect(() => {
    const target = focusTarget.current
    if (!target) return
    focusTarget.current = null
    if (target === 'judgment') judgmentHeadingRef.current?.focus()
    if (target === 'record') recordHeadingRef.current?.focus()
  }, [result, judgment])

  function primeDraft(view: UploadDeskView) {
    setChoice(view.readiness === 'green' ? '' : 'request')
    setReason(draftDeskReasonFromView(view))
    setJudgmentError(null)
    setAnnounce('')
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (judging) return
    const form = event.currentTarget
    const data = new FormData(form)
    if (!(data.get('file') instanceof File) || (data.get('file') as File).size < 1) {
      setError(deskNotice('Choose a file to upload.'))
      return
    }
    setPending(true)
    setError(null)
    try {
      const response = await fetch('/api/desk', { method: 'POST', body: data })
      const body = await response.json().catch(() => null) as { error?: string } | UploadDeskView | null
      if (!response.ok) {
        setError(deskExtractionFailure(body) ?? deskNotice('The packet could not be frozen. Try again.'))
        return
      }
      const view = sanitizeUploadDeskView(body)
      if (!view || view.organizationId !== viewer.organizationId) {
        setError(deskNotice('The freeze came back in an unexpected shape. Nothing was stored.'))
        return
      }
      writeStored(viewer.organizationId, view, null)
      focusTarget.current = 'judgment'
      primeDraft(view)
      setJudgment(null)
      setResult(view)
    } catch {
      setError(deskNotice('The desk could not be reached. Check your connection and try again.'))
    } finally {
      setPending(false)
    }
  }

  function startAnother() {
    formRef.current?.reset()
    setFileLabel(null)
    clearStored()
    setResult(null)
    setJudgment(null)
    setChoice('')
    setReason('')
    setError(null)
    setJudgmentError(null)
    setAnnounce('')
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
      writeStored(viewer.organizationId, result, recorded)
      focusTarget.current = 'record'
      setAnnounce('Record frozen · verified')
      setJudgment(recorded)
    } catch {
      setJudgmentError('The desk could not be reached. Check your connection and try again.')
    } finally {
      setJudging(false)
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

  const readiness = result ? readinessCopy[result.readiness] : null
  const mapped = result?.fields.filter(field => field.fromPacket) ?? []
  const missing = result?.fields.filter(field => !field.fromPacket) ?? []
  const providerNote = providerId === 'mock'
    ? 'Extraction is the offline mock. It hashes the file and does not read the document body.'
    : `Extraction provider is ${providerId}. This desk still refuses to store file bytes or vendor payloads.`
  const reasonLength = reason.trim().length
  const busy = pending || judging
  const steps = [
    { id: 'extract', label: 'Extract', state: 'done' as const },
    { id: 'judge', label: 'Judge', state: 'done' as const },
    { id: 'freeze', label: 'Freeze', state: 'done' as const },
    { id: 'yours', label: 'Your judgment', state: judgment ? 'done' as const : 'current' as const },
  ]

  return (
    <>
      <p className={s.eyebrow}>Award assurance</p>
      <h1>Upload a packet</h1>
      <p className={s.lede}>
        Choose a donor pack and upload one file. Trace-li extracts it, runs the pack, and freezes an assessment. Then record your judgment.
      </p>
      <form ref={formRef} className={s.card} onSubmit={onSubmit} aria-busy={pending}>
        <p className={s.note}>
          {providerNote}
          {' '}
          {viewer.mode === 'demo'
            ? 'This is the local fixture session.'
            : 'You are signed in. The file is not kept after this request.'}
        </p>
        <fieldset>
          <legend>Donor pack</legend>
          <div className={s.packs}>
            {packs.map(pack => (
              <label className={s.pack} key={pack.packId}>
                <input type="radio" name="packId" value={pack.packId} required disabled={busy} />
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
              disabled={busy}
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
          <button className={s.primary} type="submit" disabled={busy}>
            {pending ? deskWorkingCopy.button : 'Extract and freeze'}
          </button>
          {result ? (
            <button className={s.secondary} type="button" onClick={startAnother} disabled={busy}>
              Start another packet
            </button>
          ) : null}
        </div>
        <p className={s.status} role="status" aria-live="polite">
          {pending ? (
            <span className={s.working}>
              <span className={s.spinner} aria-hidden="true" />
              <span>{deskWorkingCopy.status}</span>
            </span>
          ) : ''}
        </p>
        {error ? (
          <p className={s.alert} role="alert">
            {error.summary}
            {error.detail ? <span className={s.alertDetail}>{error.detail}</span> : null}
          </p>
        ) : null}
      </form>

      {result && readiness ? (
        <section className={s.results} aria-labelledby={judgment ? 'decision-record-title' : 'judgment-title'}>
          <ol className={s.rail} aria-label="Progress" data-testid="progress-rail">
            {steps.map((step, index) => (
              <li key={step.id} data-state={step.state} aria-current={step.state === 'current' ? 'step' : undefined}>
                {index > 0 ? <span className={s.railSep} aria-hidden="true">→</span> : null}
                <span>{step.label}</span>
              </li>
            ))}
          </ol>
          <p className={`${s.readiness} ${readiness.className}`}>{readiness.label}</p>
          <p>{readiness.next}</p>
          <p className={s.help}>
            {result.packName}. {plural(result.findingCount, 'finding', 'findings')}. {plural(missing.length, 'pack field', 'pack fields')} still missing.
            {' '}Assessment record {result.record.recordId}. Snapshot {shortHash(result.record.snapshotHash)}.
          </p>
          <p className={s.status} role="status" aria-live="polite">
            {judging ? 'Freezing your judgment…' : announce}
          </p>

          {judgment ? (
            <div className={`${s.card} ${s.recordCard}`} data-testid="decision-record">
              <h2 id="decision-record-title" ref={recordHeadingRef} tabIndex={-1}>Decision record</h2>
              <p className={s.verified} data-testid="record-frozen-badge">Record frozen · verified</p>
              <p className={s.statusLine}>{deskJudgmentChoices.find(item => item.id === judgment.choice)?.status}</p>
              <h3 className={s.sectionTitle}>Reason</h3>
              <p data-testid="recorded-reason">{judgment.reason}</p>
              <p>
                {judgment.packName}. Version {judgment.packVersion}. Readiness {judgment.readiness}. {plural(judgment.findingCount, 'finding', 'findings')}.
              </p>
              {judgment.waiver ? (
                <p className={s.note}>
                  Desk-session exception note {judgment.waiver.waiverId}. Authority is this signed-in reviewer. This is not a formal organization waiver.
                </p>
              ) : null}
              <dl className={s.meta}>
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
              </dl>
              <p className={s.help}>Supersedes {judgment.record.supersedesRecordId}.</p>
              <div className={s.actions}>
                <button className={s.secondary} type="button" onClick={() => copyValue(judgment.record.recordId, 'Record id')}>
                  Copy record id
                </button>
                <button className={s.secondary} type="button" onClick={() => copyValue(judgment.record.snapshotHash, 'Snapshot hash')}>
                  Copy snapshot hash
                </button>
              </div>
            </div>
          ) : (
            <div className={`${s.card} ${s.judgment}`} data-testid="judgment-form">
              <h2 id="judgment-title" ref={judgmentHeadingRef} tabIndex={-1}>Your judgment</h2>
              <p>Your judgment writes a new Trace-li record that supersedes the assessment freeze. The assessment itself stays as it was.</p>
              {judgmentError ? <p className={s.alert} role="alert">{judgmentError}</p> : null}
              <fieldset className={s.choiceSet} disabled={judging}>
                <legend id="decision-label">Decision</legend>
                <div className={s.packs} role="radiogroup" aria-labelledby="decision-label" aria-describedby={choice === 'exception' ? 'exception-note' : undefined}>
                  {deskJudgmentChoices.map(option => (
                    <label className={s.pack} key={option.id}>
                      <input
                        type="radio"
                        name="disposition"
                        value={option.id}
                        checked={choice === option.id}
                        disabled={judging}
                        onChange={() => {
                          setChoice(option.id)
                          setJudgmentError(null)
                        }}
                      />
                      <span>
                        <strong>{option.label}</strong>
                        <span>{option.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {choice === 'exception' ? (
                <p className={s.note} id="exception-note">
                  Accepting with an exception adds a desk-session exception note on the new record. It is not a formal organization waiver.
                </p>
              ) : null}
              <div className={s.reason}>
                <label className={s.fileLegend} htmlFor={reasonId}>Reason</label>
                <textarea
                  id={reasonId}
                  className={s.textarea}
                  value={reason}
                  onChange={event => setReason(event.target.value)}
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
              <div className={s.actions}>
                <button
                  className={s.primary}
                  type="button"
                  onClick={confirmJudgment}
                  disabled={judging}
                  aria-busy={judging}
                  data-testid="confirm-judgment"
                >
                  {judging ? 'Freezing judgment…' : 'Confirm judgment'}
                </button>
              </div>
            </div>
          )}

          <details className={s.detail}>
            <summary>Findings and pack fields</summary>
            <h3 className={s.sectionTitle}>Findings ({result.findingCount})</h3>
            {result.findings.length === 0 ? (
              <p>No findings. The pack checks passed on the registry fields.</p>
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
                    <p>{field.detail}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className={s.help}>
              Assessment record {result.record.recordId}. Disposition {result.record.disposition.replaceAll('_', ' ')}.
              {' '}Snapshot hash {shortHash(result.record.snapshotHash)}.
              {' '}Missing means the packet did not yield the field. It is not a negative finding.
              This view stays in this browser until you start another packet. The file is not stored.
            </p>
          </details>
        </section>
      ) : restored ? (
        <p className={s.footer}>No frozen record yet. Choose a pack and upload a file.</p>
      ) : (
        <p className={s.footer}>Loading the last record from this browser…</p>
      )}
      <p className={s.footer}>
        <Link href="/demo">Try the fictional walkthrough</Link>
      </p>
    </>
  )
}
