import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { DeskAccessRequired, DeskShell, DeskUnavailable } from '@/app/desk/shell'
import NewTender from '@/app/hub/tender/new-tender'
import { openSignedInDesk } from '@/lib/desk/gate'
import { listDonorPacks } from '@/lib/field-registry/packs'
import { hubPackParam, hubSeedSources } from '@/lib/hub/library'
import { tenderWorkspacesEnabled } from '@/lib/tenders/config'
import s from '@/app/desk/desk.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'New tender', robots: { index: false, follow: false } }
export default async function NewWorkPage({ searchParams }: { searchParams: Promise<{ pack?: string | string[] }> }) {
  if (!tenderWorkspacesEnabled()) redirect('/hub/tender')
  const gate = await openSignedInDesk()
  if (gate.status === 'unavailable') return <DeskUnavailable />
  if (gate.status === 'denied') return <DeskAccessRequired />
  const initialPackId = hubPackParam((await searchParams).pack)
  const seeds = listDonorPacks().map(pack => ({packId: pack.packId, name: pack.name, version: pack.version, summary: hubSeedSources[pack.packId].summary}))
  const canCreate = ['Procurement Officer', 'Procurement Director', 'Workspace Admin'].includes(gate.viewer.role)
  return <DeskShell viewer={gate.viewer} showSignOut={gate.viewer.mode === 'workos'} current="work" durable>
    <div className={s.page}>
      <nav aria-label="Breadcrumb"><Link href="/work">My work</Link> / New tender</nav>
      <header className={s.intro}><p className={s.eyebrow}>Details</p><h1>New tender</h1><p className={s.lede}>Name this tender and choose its pack once. Then add evidence and review the saved checklist.</p></header>
      {canCreate ? <NewTender organizationId={gate.viewer.organizationId} seeds={seeds} durable initialPackId={initialPackId} /> : <p className={s.alert}>Your role cannot create tenders. Open a tender shared with you from My work.</p>}
    </div>
  </DeskShell>
}
