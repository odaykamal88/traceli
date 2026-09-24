/**
 * Absolute URLs passed to AuthKit `signOut({ returnTo })`.
 * WorkOS only redirects back when the full URL is listed under
 * Dashboard → Redirects → Sign-out. Paths stay static, with no query,
 * so the allowlist entry can match exactly.
 */
const PUBLIC_HOST = /^[a-z0-9.-]+(?::\d{1,5})?$/

export const signedOutPath = '/auth/signed-out'
export const accountSwitchPath = '/auth/switch'

export function requestPublicOrigin(request: Request): string {
  const url = new URL(request.url)
  const forwarded = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase()
  const urlProto = url.protocol === 'https:' ? 'https' : url.protocol === 'http:' ? 'http' : null
  const proto = forwarded === 'https' || forwarded === 'http' ? forwarded : urlProto
  const hostHeader = request.headers.get('host')?.trim().toLowerCase()
  const host = hostHeader && PUBLIC_HOST.test(hostHeader) ? hostHeader : url.host
  if ((proto !== 'http' && proto !== 'https') || !PUBLIC_HOST.test(host)) {
    throw new Error('Sign-out return origin is not an http(s) host.')
  }
  return `${proto}://${host}`
}

export function signOutReturnTo(request: Request): string {
  return `${requestPublicOrigin(request)}${signedOutPath}`
}

export function accountSwitchReturnTo(request: Request): string {
  return `${requestPublicOrigin(request)}${accountSwitchPath}`
}
