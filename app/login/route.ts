import { redirectToDeskSignIn } from '@/lib/auth/desk-auth'

export const dynamic = 'force-dynamic'

/**
 * Product sign-in for the upload desk.
 * Return path is `/desk`. The callback stays `/auth/callback`.
 * Invitation and password-reset tokens on this URL are handed to AuthKit
 * even when a session cookie is already present.
 */
export const GET = async (request: Request) => {
  await redirectToDeskSignIn(request)
}
