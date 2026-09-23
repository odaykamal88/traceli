import { redirectToPasswordReset } from '@/lib/auth/desk-auth'

export const dynamic = 'force-dynamic'

/** Password reset URL. WorkOS appends `token`; the authorize handoff uses `password_reset_token`. */
export const GET = async (request: Request) => {
  await redirectToPasswordReset(request)
}
