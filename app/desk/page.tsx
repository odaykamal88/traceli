import type { Metadata } from 'next'
import { headers } from 'next/headers'

import { resolveExtractionProviderId } from '@/lib/field-registry/extract-provider'
import { listDonorPacks } from '@/lib/field-registry/packs'
import { requireTraceViewer, TraceAccessError } from '@/lib/trace/access'
import { isLoopbackHost, localTraceEnabled } from '@/lib/trace/access-policy'
import { isWorkOSConfigured } from '@/lib/workspace-access'

import { DeskAccessRequired, DeskShell, DeskUnavailable } from './shell'
import UploadDesk, { type DeskPackOption } from './upload-desk'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Award desk',
  description: 'Sign in, upload a packet, run a donor pack, and freeze a Trace-li record.',
  robots: { index: false, follow: false },
}

const blurbs: Record<DeskPackOption['packId'], string> = {
  'global-fund': 'PR and sub-recipient award checks.',
  'fcdo-prime': 'Commercial prime checks for FCDO-funded awards.',
}

async function localDeskOpen() {
  if (!localTraceEnabled(process.env)) return false
  const host = (await headers()).get('host') || ''
  try {
    return isLoopbackHost(new URL(`http://${host}`).hostname)
  } catch {
    return false
  }
}

export default async function DeskPage() {
  const local = await localDeskOpen()
  if (!local && (process.env.TRACELI_TRACE_MODE !== 'workos' || !isWorkOSConfigured())) {
    return <DeskUnavailable />
  }

  try {
    const viewer = await requireTraceViewer()
    let providerId = 'mock'
    try {
      providerId = resolveExtractionProviderId()
    } catch {
      return <DeskUnavailable />
    }
    const packs: DeskPackOption[] = listDonorPacks().map(pack => ({
      packId: pack.packId,
      name: pack.name,
      version: pack.version,
      blurb: blurbs[pack.packId],
    }))
    return (
      <DeskShell viewer={{ name: viewer.name, role: viewer.role }} showSignOut={viewer.mode === 'workos'}>
        <UploadDesk
          viewer={{
            name: viewer.name,
            role: viewer.role,
            organizationId: viewer.organizationId,
            mode: viewer.mode,
          }}
          providerId={providerId}
          packs={packs}
        />
      </DeskShell>
    )
  } catch (error) {
    if (error instanceof TraceAccessError) return <DeskAccessRequired />
    throw error
  }
}
