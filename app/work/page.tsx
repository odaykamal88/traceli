import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { DeskAccessRequired, DeskShell, DeskUnavailable } from '@/app/desk/shell'
import SavedTenders from '@/app/hub/saved-tenders'
import { openSignedInDesk } from '@/lib/desk/gate'
import { listDonorPacks } from '@/lib/field-registry/packs'
import { tenderWorkspacesEnabled } from '@/lib/tenders/config'
import s from '@/app/desk/desk.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'My work', robots: { index: false, follow: false } }
export default async function WorkPage() {
  if (!tenderWorkspacesEnabled()) redirect('/hub')
  const gate = await openSignedInDesk()
  if (gate.status === 'unavailable') return <DeskUnavailable />
  if (gate.status === 'denied') return <DeskAccessRequired />
  const canCreate = ['Procurement Officer', 'Procurement Director', 'Workspace Admin'].includes(gate.viewer.role)
  return <DeskShell viewer={gate.viewer} showSignOut={gate.viewer.mode === 'workos'} current="work" durable>
    <div className={s.page}>
      <header className={s.intro}><p className={s.eyebrow}>Your workspace</p><h1>My work</h1><p className={s.lede}>Find a saved tender and continue where you left off.</p></header>
      {canCreate ? <p className={s.actions}><Link className={s.primary} href="/work/new">Start a tender</Link></p> : <p className={s.help}>Your role can open tenders shared with you. A procurement owner can start a new tender.</p>}
      <SavedTenders organizationId={gate.viewer.organizationId} packNames={Object.fromEntries(listDonorPacks().map(pack => [pack.packId, pack.name]))} durable canCreate={canCreate} />
    </div>
  </DeskShell>
}
