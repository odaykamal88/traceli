import { redirectToInvitation } from '@/lib/auth/desk-auth'

export const dynamic = 'force-dynamic'

/** User invitation URL. A valid invitation_token opens AuthKit sign-in; signup stays closed without one. */
export const GET = async (request: Request) => {
  await redirectToInvitation(request)
}
