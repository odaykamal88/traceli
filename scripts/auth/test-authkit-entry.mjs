import assert from 'node:assert/strict'
import { after, beforeEach, mock, test } from 'node:test'

import { appendAuthkitHandoff, readQueryToken } from '../../lib/auth/authkit-handoff.ts'
import { accountSwitchReturnTo, signOutReturnTo } from '../../lib/auth/public-origin.ts'

const invite = 'inviteTokenValue00000001'
const reset = 'resetTokenValue000000001'
const originalEnv = { ...process.env }
let sessionUser = null
let signInOptions = null
let signOutOptions = null
let signUpCalls = 0

const redirect = (destination) => {
  throw new Error(`redirect:${destination}`)
}

mock.module('@workos-inc/authkit-nextjs', {
  namedExports: {
    withAuth: async () => ({ user: sessionUser }),
    getSignInUrl: async (options) => {
      signInOptions = options
      return 'https://api.workos.com/user_management/authorize?provider=authkit'
    },
    getSignUpUrl: async () => {
      signUpCalls += 1
      throw new Error('public signup must stay closed')
    },
    signOut: async (options) => {
      signOutOptions = options ?? null
      throw new Error(`redirect:signout:${options?.returnTo ?? ''}`)
    },
  },
})
mock.module('next/navigation', { namedExports: { redirect } })

const { GET: login } = await import('../../app/login/route.ts')
const { GET: initiate } = await import('../../app/auth/login/route.ts')
const { GET: accountSwitch } = await import('../../app/auth/switch/route.ts')
const { GET: inviteRoute } = await import('../../app/invite/route.ts')
const { GET: signUp } = await import('../../app/sign-up/route.ts')
const { GET: resetPassword } = await import('../../app/reset-password/route.ts')
const { POST: deskSignOut } = await import('../../app/desk/sign-out/route.ts')
const { POST: switchAccount } = await import('../../app/desk/switch-account/route.ts')

function configureWorkOS() {
  process.env.WORKOS_CLIENT_ID = 'client_test'
  process.env.WORKOS_API_KEY = 'sk_test'
  process.env.WORKOS_COOKIE_PASSWORD = 'x'.repeat(32)
  process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI = 'https://www.trace-li.com/auth/callback'
}

beforeEach(() => {
  configureWorkOS()
  sessionUser = null
  signInOptions = null
  signOutOptions = null
  signUpCalls = 0
})

after(() => {
  process.env = originalEnv
  mock.restoreAll()
})

test('token reader accepts one safe value and drops duplicates or junk', () => {
  const ok = new URL(`https://www.trace-li.com/invite?invitation_token=${invite}`)
  assert.equal(readQueryToken(ok, 'invitation_token'), invite)

  const duplicated = new URL(`https://www.trace-li.com/invite?invitation_token=${invite}&invitation_token=${reset}`)
  assert.equal(readQueryToken(duplicated, 'invitation_token'), null)

  const injected = new URL('https://www.trace-li.com/invite?invitation_token=inviteTokenValue00000001%26redirect_uri%3Dhttps%3A%2F%2Fevil.example')
  assert.equal(readQueryToken(injected, 'invitation_token'), null)

  const short = new URL('https://www.trace-li.com/reset-password?token=too-short')
  assert.equal(readQueryToken(short, 'token'), null)
})

test('handoff appends authorize params and refuses a non-http target', () => {
  const url = appendAuthkitHandoff('https://api.workos.com/user_management/authorize?provider=authkit', {
    invitationToken: invite,
    passwordResetToken: reset,
  })
  const parsed = new URL(url)
  assert.equal(parsed.searchParams.get('invitation_token'), invite)
  assert.equal(parsed.searchParams.get('password_reset_token'), reset)
  assert.equal(parsed.searchParams.get('provider'), 'authkit')
  assert.throws(() => appendAuthkitHandoff('javascript:alert(1)', { invitationToken: invite }))
})

test('signed-in product login goes to the desk and ignores a caller return path', async () => {
  sessionUser = { id: 'user_signed_in' }
  await assert.rejects(
    () => login(new Request('https://www.trace-li.com/login?returnTo=https://evil.example&role=workspace-admin')),
    /redirect:\/desk$/,
  )
  assert.equal(signInOptions, null)
  assert.equal(signUpCalls, 0)
})

test('sign-out return targets are static absolute paths', () => {
  const production = new Request('https://internal.invalid/desk/sign-out', {
    headers: { host: 'www.trace-li.com', 'x-forwarded-proto': 'https' },
  })
  assert.equal(signOutReturnTo(production), 'https://www.trace-li.com/auth/signed-out')
  assert.equal(accountSwitchReturnTo(production), 'https://www.trace-li.com/auth/switch')

  const apex = new Request('https://trace-li.com/desk/sign-out')
  assert.equal(signOutReturnTo(apex), 'https://trace-li.com/auth/signed-out')

  const local = new Request('http://localhost:3000/desk/sign-out', {
    headers: { host: 'localhost:3000', 'x-forwarded-proto': 'http' },
  })
  assert.equal(signOutReturnTo(local), 'http://localhost:3000/auth/signed-out')
  assert.equal(accountSwitchReturnTo(local), 'http://localhost:3000/auth/switch')

  const tampered = new Request('https://www.trace-li.com/desk/sign-out', {
    headers: { host: 'www.trace-li.com/login', 'x-forwarded-proto': 'javascript' },
  })
  assert.equal(signOutReturnTo(tampered), 'https://www.trace-li.com/auth/signed-out')
  assert.equal(new URL(signOutReturnTo(tampered)).search, '')
  assert.equal(new URL(accountSwitchReturnTo(production)).search, '')
})

test('signed-out product login starts AuthKit for the desk', async () => {
  await assert.rejects(
    () => login(new Request('https://www.trace-li.com/login')),
    /redirect:https:\/\/api\.workos\.com\/user_management\/authorize\?provider=authkit$/,
  )
  assert.deepEqual(signInOptions, { returnTo: '/desk' })
})

test('a signed-in switch does not return to the desk before the session is cleared', async () => {
  sessionUser = { id: 'user_signed_in' }
  const cases = [
    [login, 'https://www.trace-li.com/login?switch=1&returnTo=https://evil.example'],
    [accountSwitch, 'https://www.trace-li.com/auth/switch?returnTo=/desk'],
  ]
  for (const [route, href] of cases) {
    signInOptions = null
    signOutOptions = null
    await assert.rejects(
      () => route(new Request(href, { headers: { host: 'www.trace-li.com', 'x-forwarded-proto': 'https' } })),
      /redirect:signout:https:\/\/www\.trace-li\.com\/auth\/switch$/,
    )
    assert.equal(signInOptions, null)
    assert.deepEqual(signOutOptions, { returnTo: 'https://www.trace-li.com/auth/switch' })
  }
})

test('a signed-out switch starts AuthKit with an account choice and does not go to the desk', async () => {
  await assert.rejects(
    () => accountSwitch(new Request('https://www.trace-li.com/auth/switch')),
    /redirect:https:\/\/api\.workos\.com\/user_management\/authorize\?provider=authkit$/,
  )
  assert.deepEqual(signInOptions, { returnTo: '/desk', prompt: 'consent' })
  assert.equal(signOutOptions, null)

  signInOptions = null
  await assert.rejects(
    () => login(new Request('https://www.trace-li.com/login?switch=1')),
    /redirect:https:\/\/api\.workos\.com\/user_management\/authorize\?provider=authkit$/,
  )
  assert.deepEqual(signInOptions, { returnTo: '/desk', prompt: 'consent' })
})

test('a duplicated switch flag does not bypass the signed-in desk short-circuit', async () => {
  sessionUser = { id: 'user_signed_in' }
  await assert.rejects(
    () => login(new Request('https://www.trace-li.com/login?switch=1&switch=1')),
    /redirect:\/desk$/,
  )
  assert.equal(signInOptions, null)
  assert.equal(signOutOptions, null)
})

test('an invitation or reset token on login still continues into AuthKit when switch is also set', async () => {
  sessionUser = { id: 'user_signed_in' }
  await assert.rejects(
    () => login(new Request(`https://www.trace-li.com/login?switch=1&invitation_token=${invite}`)),
    /redirect:https:\/\/api\.workos\.com\/user_management\/authorize\?provider=authkit&invitation_token=inviteTokenValue00000001$/,
  )
  assert.deepEqual(signInOptions, { returnTo: '/desk' })
  assert.equal(signOutOptions, null)

  signInOptions = null
  await assert.rejects(
    () => login(new Request(`https://www.trace-li.com/login?switch=1&password_reset_token=${reset}`)),
    /redirect:https:\/\/api\.workos\.com\/user_management\/authorize\?provider=authkit&password_reset_token=resetTokenValue000000001$/,
  )
  assert.deepEqual(signInOptions, { returnTo: '/desk' })
  assert.equal(signOutOptions, null)
})

test('a signed-in visitor with an invitation token still continues into AuthKit', async () => {
  sessionUser = { id: 'user_signed_in' }
  await assert.rejects(
    () => login(new Request(`https://www.trace-li.com/login?invitation_token=${invite}&returnTo=https://evil.example`)),
    /redirect:https:\/\/api\.workos\.com\/user_management\/authorize\?provider=authkit&invitation_token=inviteTokenValue00000001$/,
  )
  assert.deepEqual(signInOptions, { returnTo: '/desk' })
})

test('initiate login always starts AuthKit, including for a signed-in visitor', async () => {
  sessionUser = { id: 'user_signed_in' }
  await assert.rejects(
    () => initiate(new Request(`https://www.trace-li.com/auth/login?password_reset_token=${reset}&organizationId=org_evil`)),
    /redirect:https:\/\/api\.workos\.com\/user_management\/authorize\?provider=authkit&password_reset_token=resetTokenValue000000001$/,
  )
  assert.deepEqual(signInOptions, { returnTo: '/desk' })
})

test('invite and sign-up stay closed without a token', async () => {
  for (const route of [inviteRoute, signUp]) {
    signUpCalls = 0
    signInOptions = null
    await assert.rejects(
      () => route(new Request('https://www.trace-li.com/sign-up')),
      /redirect:\/auth\/invite-only$/,
    )
    assert.equal(signInOptions, null)
    assert.equal(signUpCalls, 0)
  }
})

test('a valid invitation starts desk sign-in with the token and does not open signup', async () => {
  await assert.rejects(
    () => inviteRoute(new Request(`https://www.trace-li.com/invite?invitation_token=${invite}`)),
    /redirect:https:\/\/api\.workos\.com\/user_management\/authorize\?provider=authkit&invitation_token=inviteTokenValue00000001$/,
  )
  assert.deepEqual(signInOptions, { returnTo: '/desk' })
  assert.equal(signUpCalls, 0)
})

test('password reset reads the email token and drops a conflicting pair', async () => {
  await assert.rejects(
    () => resetPassword(new Request(`https://www.trace-li.com/reset-password?token=${reset}`)),
    /redirect:https:\/\/api\.workos\.com\/user_management\/authorize\?provider=authkit&password_reset_token=resetTokenValue000000001$/,
  )
  assert.deepEqual(signInOptions, { returnTo: '/desk' })

  signInOptions = null
  await assert.rejects(
    () => resetPassword(new Request(`https://www.trace-li.com/reset-password?token=${reset}&password_reset_token=${invite}`)),
    /redirect:\/auth\/reset-required$/,
  )
  assert.equal(signInOptions, null)
})

test('sign-out and switch-account return to static public paths, not /login', async () => {
  const headers = { host: 'www.trace-li.com', 'x-forwarded-proto': 'https' }
  await assert.rejects(
    () => deskSignOut(new Request('https://internal.invalid/desk/sign-out', { method: 'POST', headers })),
    /redirect:signout:https:\/\/www\.trace-li\.com\/auth\/signed-out$/,
  )
  assert.deepEqual(signOutOptions, { returnTo: 'https://www.trace-li.com/auth/signed-out' })
  assert.equal(signInOptions, null)

  signOutOptions = null
  await assert.rejects(
    () => switchAccount(new Request('https://internal.invalid/desk/switch-account', { method: 'POST', headers })),
    /redirect:signout:https:\/\/www\.trace-li\.com\/auth\/switch$/,
  )
  assert.deepEqual(signOutOptions, { returnTo: 'https://www.trace-li.com/auth/switch' })
  assert.doesNotMatch(signOutOptions.returnTo, /\/login/)
})

test('missing WorkOS configuration does not start AuthKit or echo the token', async () => {
  delete process.env.WORKOS_API_KEY
  await assert.rejects(
    () => login(new Request('https://www.trace-li.com/login')),
    /redirect:\/desk\?auth=unavailable$/,
  )
  await assert.rejects(
    () => initiate(new Request('https://www.trace-li.com/auth/login')),
    /redirect:\/desk\?auth=unavailable$/,
  )
  await assert.rejects(
    () => inviteRoute(new Request(`https://www.trace-li.com/invite?invitation_token=${invite}`)),
    /redirect:\/auth\/invite-only\?auth=unavailable$/,
  )
  await assert.rejects(
    () => resetPassword(new Request('https://www.trace-li.com/reset-password')),
    /redirect:\/auth\/reset-required$/,
  )
  await assert.rejects(
    () => deskSignOut(new Request('https://www.trace-li.com/desk/sign-out', { method: 'POST' })),
    /redirect:\/auth\/signed-out$/,
  )
  await assert.rejects(
    () => switchAccount(new Request('https://www.trace-li.com/desk/switch-account', { method: 'POST' })),
    /redirect:\/auth\/signed-out$/,
  )
  await assert.rejects(
    () => accountSwitch(new Request('https://www.trace-li.com/auth/switch')),
    /redirect:\/auth\/signed-out$/,
  )
  assert.equal(signInOptions, null)
  assert.equal(signOutOptions, null)
  assert.equal(signUpCalls, 0)
})
