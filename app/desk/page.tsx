import type { Metadata } from 'next'

import { openSignedInDesk } from '@/lib/desk/gate'
import { resolveExtractionProviderId } from '@/lib/field-registry/extract-provider'
import { listDonorPacks } from '@/lib/field-registry/packs'
import { hubEngagementParam, hubPackParam, hubSeedSources } from '@/lib/hub/library'

import { DeskAccessRequired, DeskShell, DeskUnavailable } from './shell'
import UploadDesk, { type DeskPackOption } from './upload-desk'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Award desk',
  description: 'Sign in, upload a packet, run a donor pack, and freeze a Trace-li record.',
  robots: { index: false, follow: false },
}

export default async function DeskPage({
  searchParams,
}: {
  searchParams: Promise<{ pack?: string | string[], engagement?: string | string[] }>
}) {
  const gate = await openSignedInDesk()
  if (gate.status === 'unavailable') return <DeskUnavailable />
  if (gate.status === 'denied') return <DeskAccessRequired />

  let providerId = 'mock'
  try {
    providerId = resolveExtractionProviderId()
  } catch {
    return <DeskUnavailable />
  }
  const query = await searchParams
  const packs: DeskPackOption[] = listDonorPacks().map(pack => ({
    packId: pack.packId,
    name: pack.name,
    version: pack.version,
    blurb: hubSeedSources[pack.packId].blurb,
  }))
  return (
    <DeskShell viewer={{ name: gate.viewer.name, role: gate.viewer.role }} showSignOut={gate.viewer.mode === 'workos'} current="desk">
      <UploadDesk
        viewer={{
          name: gate.viewer.name,
          role: gate.viewer.role,
          organizationId: gate.viewer.organizationId,
          mode: gate.viewer.mode,
        }}
        providerId={providerId}
        packs={packs}
        initialPackId={hubPackParam(query.pack)}
        engagementId={hubEngagementParam(query.engagement)}
      />
    </DeskShell>
  )
}
