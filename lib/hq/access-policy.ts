// Only server-owned configuration and verified WorkOS records may enter this policy.
// A model, request parameter, email match or procurement role cannot grant HQ access.
export type HQBinding = { ownerUserId: string; organizationId: string }
export type HQSession = {
  user: { id: string; emailVerified: boolean } | null
  organizationId?: string
  impersonator?: unknown
}
export type HQMembership = {
  userId: string
  organizationId: string
  status: string
  role?: { slug: string }
  roles?: { slug: string }[]
}

export function hqAccessMode(env: Record<string, string | undefined>): 'local' | 'workos' | 'disabled' {
  const requested = env.TRACELI_HQ_ACCESS
  if (requested === 'workos') return 'workos'
  if ((!requested || requested === 'local') && env.NODE_ENV === 'development' && !env.VERCEL) return 'local'
  return 'disabled'
}

export function hqBinding(env: Record<string, string | undefined>): HQBinding | null {
  const ownerUserId = env.TRACELI_HQ_OWNER_USER_ID || ''
  const organizationId = env.TRACELI_HQ_ORGANIZATION_ID || ''
  if (!/^user_[A-Z0-9]{26}$/.test(ownerUserId) || !/^org_[A-Z0-9]{26}$/.test(organizationId)) return null
  return { ownerUserId, organizationId }
}

export function isBoundHQSession(binding: HQBinding, session: HQSession): boolean {
  return session.user?.id === binding.ownerUserId &&
    session.user.emailVerified === true &&
    session.organizationId === binding.organizationId &&
    !session.impersonator
}

export function isActiveHQOwner(binding: HQBinding, user: { id: string; emailVerified: boolean }, memberships: HQMembership[]): boolean {
  return user.id === binding.ownerUserId && user.emailVerified === true && memberships.some(m =>
    m.userId === binding.ownerUserId && m.organizationId === binding.organizationId &&
    m.status === 'active' && (m.role?.slug === 'org-hq-owner' || m.roles?.some(role => role.slug === 'org-hq-owner')),
  )
}
