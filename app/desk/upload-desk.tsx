'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'

import { deskExtractionFailure, deskWorkingCopy } from '@/lib/desk/failure-copy'
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
    next: 'Review the findings. This freeze asks for evidence before sign-off.',
  },
  amber: {
    label: 'Amber · warnings',
    className: s.readinessAmber,
    next: 'Review the warnings. This freeze asks for evidence before sign-off.',
  },
  green: {
    label: 'Green · pack checks passed',
    className: s.readinessGreen,
    next: 'Pack checks passed. Review the record before sign-off. This is not a certification.',
  },
  unknown: {
    label: 'Unknown · not judged',
    className: s.readinessUnknown,
    next: 'Judgment did not produce a readiness colour. Review the record before sign-off.',
  },
}

function readStored(organizationId: string): UploadDeskView | null {
  try {
    const raw = sessionStorage.getItem(uploadDeskStorageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { organizationId?: string, view?: unknown }
    if (parsed.organizationId !== organizationId) return null
    return sanitizeUploadDeskView(parsed.view)
  } catch {
    return null
  }
}

function writeStored(organizationId: string, view: UploadDeskView) {
  sessionStorage.setItem(uploadDeskStorageKey, JSON.stringify({ organizationId, view }))
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

export default function UploadDesk({ viewer, providerId, packs }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const resultsRef = useRef<HTMLHeadingElement>(null)
  const shouldFocusResult = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<DeskNotice | null>(null)
  const [result, setResult] = useState<UploadDeskView | null>(null)
  const [restored, setRestored] = useState(false)
  const [fileLabel, setFileLabel] = useState<string | null>(null)

  useEffect(() => {
    const stored = readStored(viewer.organizationId)
    if (stored) setResult(stored)
    setRestored(true)
  }, [viewer.organizationId])

  useEffect(() => {
    if (!shouldFocusResult.current || !result) return
    shouldFocusResult.current = false
    resultsRef.current?.focus()
  }, [result])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
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
      writeStored(viewer.organizationId, view)
      shouldFocusResult.current = true
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
    setError(null)
  }

  const readiness = result ? readinessCopy[result.readiness] : null
  const mapped = result?.fields.filter(field => field.fromPacket) ?? []
  const missing = result?.fields.filter(field => !field.fromPacket) ?? []
  const providerNote = providerId === 'mock'
    ? 'Extraction is the offline mock. It hashes the file and does not read the document body.'
    : `Extraction provider is ${providerId}. This desk still refuses to store file bytes or vendor payloads.`

  return (
    <>
      <p className={s.eyebrow}>Award assurance</p>
      <h1>Upload a packet</h1>
      <p className={s.lede}>
        Choose a donor pack, upload one file, and Trace-li will extract it, map registry fields, run the pack, and freeze a record.
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
                <input type="radio" name="packId" value={pack.packId} required disabled={pending} />
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
              disabled={pending}
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
          <button className={s.primary} type="submit" disabled={pending}>
            {pending ? deskWorkingCopy.button : 'Extract and freeze'}
          </button>
          {result ? (
            <button className={s.secondary} type="button" onClick={startAnother} disabled={pending}>
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
        <section className={s.results} aria-labelledby="frozen-heading">
          <h2 id="frozen-heading" ref={resultsRef} tabIndex={-1}>Frozen record</h2>
          <p className={`${s.readiness} ${readiness.className}`}>{readiness.label}</p>
          <p>{readiness.next}</p>
          <dl className={s.meta}>
            <div>
              <label htmlFor="record-id">Record id</label>
              <input id="record-id" readOnly value={result.record.recordId} />
            </div>
            <div>
              <label htmlFor="snapshot-hash">Snapshot hash</label>
              <input id="snapshot-hash" readOnly value={result.record.snapshotHash} />
            </div>
            <div>
              <label htmlFor="packs-hash">Packs hash</label>
              <input id="packs-hash" readOnly value={result.record.packsHash} />
            </div>
          </dl>
          <p className={s.help}>
            {result.packName}. Disposition {result.record.disposition.replace(/_/g, ' ')}.
            {' '}Frozen {result.record.frozenAt} by {result.record.frozenBy}.
            {' '}File hash {result.sourceFileHash}. Award {result.awardId}.
          </p>
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
            Missing means the packet did not yield the field. It is not a negative finding.
            This view stays in this browser until you start another packet. The file is not stored.
          </p>
        </section>
      ) : restored ? (
        <p className={s.footer}>No frozen record yet. Choose a pack and upload a file.</p>
      ) : (
        <p className={s.footer}>Loading the last record from this browser…</p>
      )}
      <p className={s.footer}>
        <Link href="/demo">Public Award desk walkthrough</Link>
      </p>
    </>
  )
}
