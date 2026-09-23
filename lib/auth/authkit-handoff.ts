/**
 * Query values AuthKit accepts on the hosted authorize URL.
 * `@workos-inc/authkit-nextjs` getSignInUrl does not take invitation or
 * password-reset tokens, so the app appends the same query names the
 * User Management authorize endpoint already documents.
 */
const AUTHKIT_TOKEN = /^[A-Za-z0-9_-]{20,512}$/

export type AuthkitHandoff = {
  invitationToken?: string
  passwordResetToken?: string
}

export function readQueryToken(url: URL, name: string): string | null {
  const values = url.searchParams.getAll(name)
  if (values.length !== 1) return null
  return AUTHKIT_TOKEN.test(values[0]) ? values[0] : null
}

export function appendAuthkitHandoff(authorizationUrl: string, handoff: AuthkitHandoff = {}): string {
  if (!handoff.invitationToken && !handoff.passwordResetToken) return authorizationUrl

  const url = new URL(authorizationUrl)
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('AuthKit redirect must use http or https.')
  }
  if (handoff.invitationToken) url.searchParams.set('invitation_token', handoff.invitationToken)
  if (handoff.passwordResetToken) url.searchParams.set('password_reset_token', handoff.passwordResetToken)
  return url.toString()
}
