'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { deskTenderHref } from '@/lib/hub/desk-continuity'
import { readHubLibraryResult, type HubEngagement } from '@/lib/hub/library'

import s from '../desk/desk.module.css'

export default function SavedTenders({ organizationId, packNames }: {
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
