import 'server-only'

import { getSignInUrl, signOut, withAuth } from '@workos-inc/authkit-nextjs'
import { redirect } from 'next/navigation'

import { appendAuthkitHandoff, readQueryToken, type AuthkitHandoff } from '@/lib/auth/authkit-handoff'
import { accountSwitchReturnTo } from '@/lib/auth/public-origin'
import { isWorkOSConfigured } from '@/lib/workspace-access'

export const deskReturnPath = '/desk'

export function handoffFromLoginUrl(url: URL): AuthkitHandoff {
  return {
    invitationToken: readQueryToken(url, 'invitation_token') ?? undefined,
    passwordResetToken: readQueryToken(url, 'password_reset_token') ?? undefined,
  }
}

export function passwordResetTokenFromUrl(url: URL): string | null {
  const token = readQueryToken(url, 'token')
  const named = readQueryToken(url, 'password_reset_token')
  if (token && named && token !== named) return null
  return token ?? named
}

export async function redirectToDeskAuthkit(handoff: AuthkitHandoff = {}) {
  const authorizationUrl = await getSignInUrl({ returnTo: deskReturnPath })
  redirect(appendAuthkitHandoff(authorizationUrl, handoff))
}

/** A single `switch=1` asks to leave the current account. Anything else stays a normal product login. */
export function loginRequestsAccountSwitch(url: URL): boolean {
  const values = url.searchParams.getAll('switch')
  return values.length === 1 && values[0] === '1'
}

/**
 * Clear a current session, then start AuthKit with `prompt: 'consent'`
 * so the visitor can choose an account. Never sends that visitor to the desk.
 */
export async function redirectToAccountSwitch(request: Request) {
  if (!isWorkOSConfigured()) redirect('/auth/signed-out')

  const session = await withAuth()
  if (session.user) {
    await signOut({ returnTo: accountSwitchReturnTo(request) })
  }

  const authorizationUrl = await getSignInUrl({ returnTo: deskReturnPath, prompt: 'consent' })
  redirect(authorizationUrl)
}

/** Product Login link. A signed-in visitor goes to the desk unless this request is continuing an invite or reset, or switching accounts. */
export async function redirectToDeskSignIn(request: Request) {
  if (!isWorkOSConfigured()) redirect('/desk?auth=unavailable')

  const url = new URL(request.url)
  const handoff = handoffFromLoginUrl(url)
  if (handoff.invitationToken || handoff.passwordResetToken) {
    await redirectToDeskAuthkit(handoff)
    return
  }
  if (loginRequestsAccountSwitch(url)) {
    await redirectToAccountSwitch(request)
    return
  }

  const session = await withAuth()
  if (session.user) redirect('/desk')
  await redirectToDeskAuthkit()
}

/**
 * WorkOS Initiate login URL. Always starts AuthKit so password-reset and
 * invitation emails can finish PKCE on this host.
 */
export async function redirectToInitiateLogin(request: Request) {
  if (!isWorkOSConfigured()) redirect('/desk?auth=unavailable')
  await redirectToDeskAuthkit(handoffFromLoginUrl(new URL(request.url)))
}

export async function redirectToInvitation(request: Request) {
  const invitationToken = readQueryToken(new URL(request.url), 'invitation_token')
  if (!isWorkOSConfigured()) {
    redirect(invitationToken ? '/auth/invite-only?auth=unavailable' : '/auth/invite-only')
  }
  if (!invitationToken) redirect('/auth/invite-only')
  await redirectToDeskAuthkit({ invitationToken })
}

export async function redirectToPasswordReset(request: Request) {
  const passwordResetToken = passwordResetTokenFromUrl(new URL(request.url))
  if (!isWorkOSConfigured()) {
    redirect(passwordResetToken ? '/auth/reset-required?auth=unavailable' : '/auth/reset-required')
  }
  if (!passwordResetToken) redirect('/auth/reset-required')
  await redirectToDeskAuthkit({ passwordResetToken })
}
