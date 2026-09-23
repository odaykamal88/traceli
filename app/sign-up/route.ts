import { redirectToInvitation } from '@/lib/auth/desk-auth'

export const dynamic = 'force-dynamic'

/**
 * Public self-serve signup is closed.
 * An invitation_token is accepted here so a dashboard sign-up URL can point at this path.
 * Anything else explains that Trace-li accounts are by invitation.
 */
export const GET = async (request: Request) => {
  await redirectToInvitation(request)
}
