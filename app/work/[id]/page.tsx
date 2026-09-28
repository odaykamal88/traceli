import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { DeskAccessRequired, DeskShell, DeskUnavailable } from '@/app/desk/shell'
import DurableTenderDesk from '@/app/desk/tender-desk'
import { openSignedInDesk } from '@/lib/desk/gate'
import { listDonorPacks } from '@/lib/field-registry/packs'
import { hubSeedSources } from '@/lib/hub/library'
import { tenderWorkspacesEnabled } from '@/lib/tenders/config'
import { tenderIdSchema } from '@/lib/tenders/contract'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Tender workspace', robots: { index: false, follow: false } }
export default async function TenderWorkPage({ params }: { params: Promise<{ id: string }> }) {
  if (!tenderWorkspacesEnabled()) redirect('/desk')
  const gate = await openSignedInDesk()
  if (gate.status === 'unavailable') return <DeskUnavailable />
  if (gate.status === 'denied') return <DeskAccessRequired />
  const { id } = await params
  if (!tenderIdSchema.safeParse(id).success) notFound()
  const packs = listDonorPacks().map(pack => ({packId: pack.packId, name: pack.name, version: pack.version, blurb: hubSeedSources[pack.packId].blurb}))
  return <DeskShell viewer={gate.viewer} showSignOut={gate.viewer.mode === 'workos'} current="desk" durable>
    <DurableTenderDesk key={`${gate.viewer.organizationId}:${gate.viewer.id}:${id}`} tenderId={id} organizationId={gate.viewer.organizationId} viewerId={gate.viewer.id} packs={packs} fixtureMode={gate.viewer.mode === 'demo'} />
  </DeskShell>
}
