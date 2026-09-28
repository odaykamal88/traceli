import { deskTenderContext, hubEngagementParam, isHubPackId, type DeskTenderContext, type DonorPackId, type HubLibraryState } from '@/lib/hub/library'

const activeDeskKey = 'traceli.uploadDesk.active.v1'

export type ActiveDesk = { engagementId: string | null, packId: DonorPackId | null }

export function readActiveDesk(organizationId: string): ActiveDesk | null {
  try {
    const raw = sessionStorage.getItem(activeDeskKey)
    if (!raw) return null
    const value = JSON.parse(raw) as Record<string, unknown>
    if (value.organizationId !== organizationId) return null
    const engagementId = typeof value.engagementId === 'string' ? hubEngagementParam(value.engagementId) : null
    const packId = typeof value.packId === 'string' && isHubPackId(value.packId) ? value.packId : null
    return engagementId || packId ? { engagementId, packId } : null
  } catch {
    return null
  }
}

export function writeActiveDesk(organizationId: string, active: ActiveDesk): void {
  sessionStorage.setItem(activeDeskKey, JSON.stringify({ organizationId, ...active }))
}

export type DeskContinuity = {
  tender: DeskTenderContext | null
  packId: DonorPackId | null
  restore: boolean
  problem: string | null
  blockUpload: boolean
}

/** Resolve the URL first, then the last browser-held desk record. Never cross tender or pack identities. */
export function resolveDeskContinuity(input: {
  library: HubLibraryState
  requestedTenderId: string | null
  requestedTenderPresent: boolean
  requestedPackId: DonorPackId | null
  requestedPackPresent: boolean
  activeTenderId: string | null
  activePackId: DonorPackId | null
  storedTenderId: string | null
  storedPackId: string | null
  hasStored: boolean
}): DeskContinuity {
  const {
    library, requestedTenderId, requestedTenderPresent, requestedPackId, requestedPackPresent,
    activeTenderId, activePackId,
    storedTenderId, storedPackId, hasStored,
  } = input
  if (requestedTenderPresent && !requestedTenderId) {
    return { tender: null, packId: requestedPackId, restore: false, problem: 'This tender link is invalid. Open a saved tender from the Knowledge hub.', blockUpload: true }
  }
  if (requestedPackPresent && !requestedPackId) {
    return { tender: null, packId: null, restore: false, problem: 'This pack link is invalid. Choose a seeded pack from the Knowledge hub.', blockUpload: true }
  }
  const effectiveTenderId = requestedTenderId ?? (requestedPackPresent ? null : activeTenderId ?? (activePackId ? null : storedTenderId))
  const tender = effectiveTenderId ? deskTenderContext(library, effectiveTenderId) : null
  if (effectiveTenderId && !tender) {
    return {
      tender: null, packId: requestedPackId, restore: false,
      problem: 'This tender is not saved in this browser for your organization. Open a saved tender from the Knowledge hub.',
      blockUpload: requestedTenderPresent,
    }
  }
  if (tender && requestedPackId && requestedPackId !== tender.primaryPackId) {
    return {
      tender, packId: tender.primaryPackId, restore: false,
      problem: 'The pack in this link does not match the saved tender. The tender pack is selected; the previous desk record was not restored.',
      blockUpload: false,
    }
  }
  const packId = tender?.primaryPackId ?? requestedPackId ?? activePackId ?? (storedPackId && isHubPackId(storedPackId) ? storedPackId : null)
  const sameTender = storedTenderId === (tender?.id ?? null)
  const samePack = Boolean(storedPackId && packId && storedPackId === packId)
  return {
    tender,
    packId,
    restore: hasStored && sameTender && samePack,
    problem: hasStored && sameTender && !samePack && tender
      ? 'The previous desk record used a different pack, so it was not restored for this tender.'
      : null,
    blockUpload: false,
  }
}

export function deskTenderHref(tender: Pick<DeskTenderContext, 'id' | 'primaryPackId'>): string {
  return `/desk?pack=${encodeURIComponent(tender.primaryPackId)}&engagement=${encodeURIComponent(tender.id)}`
}

export function deskNavigationHref(input: {
  pathname: string | null
  query: Pick<URLSearchParams, 'get' | 'has'>
  library: HubLibraryState | null
  active: ActiveDesk | null
}): string {
  const { pathname, query, library, active } = input
  if (pathname === '/desk' && (query.has('engagement') || query.has('pack'))) {
    const engagement = hubEngagementParam(query.get('engagement') ?? undefined)
    const pack = hubPackId(query.get('pack'))
    if (engagement) {
      const tender = library ? deskTenderContext(library, engagement) : null
      return tender ? deskTenderHref(tender) : '/hub'
    }
    if (pack && !query.has('engagement')) return `/desk?pack=${encodeURIComponent(pack)}`
    return '/hub'
  }
  if (active?.engagementId) {
    const tender = library ? deskTenderContext(library, active.engagementId) : null
    return tender ? deskTenderHref(tender) : '/desk'
  }
  return active?.packId ? `/desk?pack=${encodeURIComponent(active.packId)}` : '/desk'
}

function hubPackId(value: string | null): DonorPackId | null {
  return value && isHubPackId(value) ? value : null
}
