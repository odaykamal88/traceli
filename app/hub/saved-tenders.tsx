'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { deskTenderHref } from '@/lib/hub/desk-continuity'
import { readHubLibraryResult, type HubEngagement } from '@/lib/hub/library'
import { createTender, listTenders, tenderIdempotencyKey } from '@/lib/tenders/client'
import type { TenderSummary } from '@/lib/tenders/contract'

import s from '../desk/desk.module.css'

export default function SavedTenders({ organizationId, packNames, durable = false, canCreate = true }: {
  organizationId: string
  packNames: Record<string, string>
  durable?: boolean
  canCreate?: boolean
}) {
  return durable
    ? <DurableSavedTenders organizationId={organizationId} packNames={packNames} canCreate={canCreate} />
    : <BrowserSavedTenders organizationId={organizationId} packNames={packNames} />
}

function BrowserSavedTenders({ organizationId, packNames }: {
  organizationId: string
  packNames: Record<string, string>
}) {
  const [tenders, setTenders] = useState<HubEngagement[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const result = readHubLibraryResult(organizationId)
    if (result.ok) setTenders(result.state.engagements)
    else setError(result.error)
  }, [organizationId])

  return (
    <section className={s.section} aria-labelledby="saved-tenders">
      <h2 id="saved-tenders">Saved tenders in this browser</h2>
      <p className={s.help}>These tender names and pack choices are saved only in this browser for your organization. They are not available on other devices. Packet files are not stored here.</p>
      {error ? <p className={s.alert} role="alert">{error}</p> : null}
      {!error && tenders === null ? <p className={s.empty}>Loading saved tenders…</p> : null}
      {tenders?.length === 0 ? <p className={s.empty}>No saved tenders here yet. Start one above.</p> : null}
      {tenders && tenders.length > 0 ? (
        <ul className={s.uploadList} data-testid="saved-tenders">
          {tenders.map(tender => (
            <li className={s.uploadItem} key={tender.id}>
              <div>
                <p className={s.tag}>Saved in this browser</p>
                <strong>{tender.name}</strong>
                <p className={s.help}>Pack: {packNames[tender.primaryPackId] ?? tender.primaryPackId}</p>
              </div>
              <Link className={s.secondary} href={deskTenderHref(tender)}>Open on the award desk</Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function DurableSavedTenders({ organizationId, packNames, canCreate }: { organizationId: string, packNames: Record<string, string>, canCreate: boolean }) {
  const router = useRouter()
  const importKey = useRef<{ signature: string, key: string } | null>(null)
  const [tenders, setTenders] = useState<TenderSummary[] | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [moreError, setMoreError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<HubEngagement[]>([])
  const [candidate, setCandidate] = useState<HubEngagement | null>(null)
  const [candidateName, setCandidateName] = useState('')
  const [candidatePack, setCandidatePack] = useState('')
  const [manualNames, setManualNames] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    let active = true
    listTenders().then(result => {
      if (active) { setTenders(result.items); setNextCursor(result.nextCursor) }
    }).catch(() => { if (active) setError('Saved tenders are unavailable. Try loading the list again.') })
    const local = readHubLibraryResult(organizationId)
    if (local.ok) {
      setCandidates(local.state.engagements)
      setManualNames(Object.fromEntries(local.state.uploads.map(upload => [upload.id, `${upload.label} (${upload.fileName}; browser-declared hash ${upload.contentHash.slice(0, 12)}…, unverified)`])))
    }
    return () => { active = false }
  }, [organizationId])

  async function retry() {
    setError(null)
    setTenders(null)
    try { const result = await listTenders(); setTenders(result.items); setNextCursor(result.nextCursor) }
    catch { setError('Saved tenders are unavailable. Try loading the list again.') }
  }

  async function more() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    setMoreError(null)
    try {
      const result = await listTenders(nextCursor)
      setTenders(current => [...(current ?? []), ...result.items])
      setNextCursor(result.nextCursor)
    } catch { setMoreError('More tenders could not be loaded. Retry below; the loaded tenders are still available.') }
    finally { setLoadingMore(false) }
  }

  function startReview(item: HubEngagement) {
    setCandidate(item)
    setCandidateName(item.name)
    setCandidatePack(item.primaryPackId)
    setError(null)
    importKey.current = null
  }

  async function importCandidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!candidate || importing) return
    setImporting(true)
    setError(null)
    const signature = JSON.stringify([candidate.id, candidateName.trim(), candidatePack])
    if (importKey.current?.signature !== signature) importKey.current = { signature, key: tenderIdempotencyKey() }
    try {
      const created = await createTender(candidateName.trim(), candidatePack, importKey.current.key)
      router.push(`/work/${encodeURIComponent(created.tender.id)}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The tender could not be created. Your browser copy is still here.')
    } finally { setImporting(false) }
  }

  return (
    <section className={s.section} aria-labelledby="saved-tenders">
      <h2 id="saved-tenders">Saved tenders</h2>
      <p className={s.help}>Open a tender to continue from its saved checklist and issued records.</p>
      {tenders === null && !error ? <p className={s.empty} role="status">Loading tenders…</p> : null}
      {error ? <p className={s.alert} role="alert">{error} <button className={s.secondary} type="button" onClick={retry}>Retry list</button></p> : null}
      {tenders?.length === 0 ? <p className={s.empty}>No saved tenders yet. Start a tender, or ask a procurement owner to share one with you.</p> : null}
      {tenders && tenders.length > 0 ? <ul className={s.uploadList} data-testid="saved-tenders">
        {tenders.map(tender => <li className={s.uploadItem} key={tender.id}>
          <div>
            <p className={s.tag}>{tender.progress.status}</p>
            <strong>{tender.title}</strong>
            <p className={s.help}>Owner: {tender.owner.label} · {tender.progress.nextAction}</p>
            <p className={s.help}>{tender.reference} · {packNames[tender.primaryPackId] ?? tender.primaryPackId} · updated {new Date(tender.updatedAt).toLocaleString()}</p>
          </div>
          <Link className={s.secondary} href={`/work/${encodeURIComponent(tender.id)}#${tender.progress.section}`} aria-label={`${tender.progress.nextAction}: ${tender.title}`}>{tender.progress.nextAction}</Link>
        </li>)}
      </ul> : null}
      {moreError ? <p className={s.alert} role="alert">{moreError}</p> : null}
      {nextCursor ? <button className={s.secondary} type="button" onClick={() => void more()} disabled={loadingMore}>{loadingMore ? 'Loading…' : moreError ? 'Retry more tenders' : 'Load more tenders'}</button> : null}
      {canCreate && candidates.length > 0 ? <details className={s.card}>
        <summary>Browser tenders available to review</summary>
        <p className={s.help}>These names, pack choices and manual labels came from this browser. They are unverified and have not been added to your saved workspace. Old browser freezes cannot become issued records.</p>
        {!candidate ? <ul className={s.uploadList}>
          {candidates.map(item => <li className={s.uploadItem} key={item.id}>
            <div><strong>{item.name}</strong><p className={s.help}>{packNames[item.primaryPackId] ?? item.primaryPackId} · {item.attachedUploadIds.length} manual references</p></div>
            <button className={s.secondary} type="button" onClick={() => startReview(item)}>Review import</button>
          </li>)}
        </ul> : <form onSubmit={importCandidate}>
          <div className={s.named}>
            <label className={s.fieldLabel} htmlFor="import-name">Tender name</label>
            <input id="import-name" className={s.textInput} value={candidateName} onChange={event => setCandidateName(event.target.value)} required maxLength={160} />
          </div>
          <fieldset>
            <legend>Pack for the new draft</legend>
            <select className={s.textInput} value={candidatePack} onChange={event => setCandidatePack(event.target.value)} required>
              {Object.entries(packNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </fieldset>
          <p className={s.help}>Browser manual labels: {candidate.attachedUploadIds.length ? candidate.attachedUploadIds.map(id => manualNames[id] ?? 'Unknown browser manual').join(', ') : 'none'}. No manual reference or hash will be imported. Reselect each file in the tender to verify it.</p>
          <p className={s.help}>Import creates an empty server draft. It does not import a checklist, judgment, PDF or browser freeze.</p>
          <div className={s.actions}>
            <button className={s.primary} type="submit" disabled={importing}>{importing ? 'Creating draft…' : 'Create reviewed draft'}</button>
            <button className={s.secondary} type="button" onClick={() => setCandidate(null)} disabled={importing}>Cancel</button>
          </div>
        </form>}
      </details> : null}
    </section>
  )
}
