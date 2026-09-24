import 'server-only'

import { headers } from 'next/headers'

import { requireTraceViewer, TraceAccessError } from '@/lib/trace/access'
import { isLoopbackHost, localTraceEnabled } from '@/lib/trace/access-policy'
import { isWorkOSConfigured } from '@/lib/workspace-access'
import type { WorkspaceViewer } from '@/lib/workspace-viewer'

export type SignedInDesk =
  | { status: 'unavailable' }
  | { status: 'denied' }
  | { status: 'ready', viewer: WorkspaceViewer }

async function localDeskOpen() {
  if (!localTraceEnabled(process.env)) return false
  const host = (await headers()).get('host') || ''
  try {
    return isLoopbackHost(new URL(`http://${host}`).hostname)
  } catch {
    return false
  }
}

/** Same session gate as the award desk. Organisation comes from the session, not the client. */
export async function openSignedInDesk(): Promise<SignedInDesk> {
  const local = await localDeskOpen()
  if (!local && (process.env.TRACELI_TRACE_MODE !== 'workos' || !isWorkOSConfigured())) {
    return { status: 'unavailable' }
  }
  try {
    const viewer = await requireTraceViewer()
    return { status: 'ready', viewer }
  } catch (error) {
    if (error instanceof TraceAccessError) return { status: 'denied' }
    throw error
  }
}
