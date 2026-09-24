import { redirectToAccountSwitch } from '@/lib/auth/desk-auth'

export const dynamic = 'force-dynamic'

/**
 * Account switch. WorkOS sign-out returns here after the session is cleared.
 * Always starts AuthKit with consent. Does not send a signed-in visitor to the desk.
 */
export const GET = async (request: Request) => {
  await redirectToAccountSwitch(request)
}
