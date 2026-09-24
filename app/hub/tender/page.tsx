import type { Metadata } from 'next'
import Link from 'next/link'

import { DeskAccessRequired, DeskShell, DeskUnavailable } from '@/app/desk/shell'
import { openSignedInDesk } from '@/lib/desk/gate'
import { listDonorPacks } from '@/lib/field-registry/packs'
import { hubSeedSources } from '@/lib/hub/library'

import s from '../../desk/desk.module.css'
import { HubPath } from '../path'
import NewTender from './new-tender'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'New tender',
  description: 'Name a tender, choose a seeded Trace-li pack, and attach organisation manuals.',
  robots: { index: false, follow: false },
}

export default async function NewTenderPage() {
  const gate = await openSignedInDesk()
  if (gate.status === 'unavailable') return <DeskUnavailable />
  if (gate.status === 'denied') return <DeskAccessRequired />

  const seeds = listDonorPacks().map(pack => ({
    packId: pack.packId,
    name: pack.name,
    version: pack.version,
    summary: hubSeedSources[pack.packId].summary,
  }))

  return (
    <DeskShell
      viewer={{ name: gate.viewer.name, role: gate.viewer.role }}
      showSignOut={gate.viewer.mode === 'workos'}
      current="hub"
    >
      <div className={s.page}>
        <header className={s.intro}>
          <p className={s.eyebrow}>Engagement</p>
          <h1>New tender</h1>
          <p className={s.lede}>
            Name the piece of work, choose the seeded pack that drives the freeze, and attach any manuals as conditions in play.
          </p>
          <HubPath current="tender" />
        </header>
        <NewTender organizationId={gate.viewer.organizationId} seeds={seeds} />
        <p className={s.footer}>
          <Link href="/hub">Back to Knowledge hub</Link>
        </p>
      </div>
    </DeskShell>
  )
}
