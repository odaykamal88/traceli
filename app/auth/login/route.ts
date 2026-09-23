import { redirectToInitiateLogin } from '@/lib/auth/desk-auth'

export const dynamic = 'force-dynamic'

/**
 * Initiate login URL for the WorkOS Redirects tab.
 * Always starts AuthKit. Do not render a sign-in page here.
 */
export const GET = async (request: Request) => {
  await redirectToInitiateLogin(request)
}
