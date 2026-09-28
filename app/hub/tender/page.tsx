import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { hubPackParam } from '@/lib/hub/library'

import { DeskAccessRequired, DeskShell, DeskUnavailable } from '@/app/desk/shell'
import { openSignedInDesk } from '@/lib/desk/gate'
import { listDonorPacks } from '@/lib/field-registry/packs'
import { hubSeedSources } from '@/lib/hub/library'
import { tenderWorkspacesEnabled } from '@/lib/tenders/config'

import s from '../../desk/desk.module.css'
import { HubPath } from '../path'
import NewTender from './new-tender'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'New tender',
  description: 'Name one award, pick the Trace-li pack that will drive judgment, and continue to the award desk.',
  robots: { index: false, follow: false },
}

export default async function NewTenderPage({ searchParams }: { searchParams: Promise<{ pack?: string | string[] }> }) {
  const gate = await openSignedInDesk()
  if (gate.status === 'unavailable') return <DeskUnavailable />
  if (gate.status === 'denied') return <DeskAccessRequired />
  const durable = tenderWorkspacesEnabled()
  if (durable) {
    const pack = hubPackParam((await searchParams).pack)
    redirect(pack ? `/work/new?pack=${encodeURIComponent(pack)}` : "/work/new")
  }

  const seeds = listDonorPacks().map(pack => ({
    packId: pack.packId,
    name: pack.name,
    version: pack.version,
    summary: hubSeedSources[pack.packId].summary,
  }))

  return (
    <DeskShell
      viewer={{ name: gate.viewer.name, role: gate.viewer.role, organizationId: gate.viewer.organizationId }}
      showSignOut={gate.viewer.mode === 'workos'}
      current="hub"
      durable={durable}
    >
      <div className={s.page}>
        <header className={s.intro}>
          <p className={s.eyebrow}>One piece of work</p>
          <h1>New tender</h1>
          <p className={s.lede}>{durable
            ? 'Name this tender and choose its public-control pack. Its reference is assigned by the server. You can add optional manual versions after opening it.'
            : 'This tender is saved in this browser only. Name the award and choose the seeded pack that will drive judgment.'}</p>
          <HubPath current="tender" />
        </header>
        <NewTender organizationId={gate.viewer.organizationId} seeds={seeds} durable={durable} />
        <p className={s.footer}>
          <Link href="/hub">Back to Knowledge hub</Link>
        </p>
      </div>
    </DeskShell>
  )
}
