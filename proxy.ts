import { authkit, handleAuthkitHeaders } from '@workos-inc/authkit-nextjs'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { isLoopbackHost, localTraceEnabled } from '@/lib/trace/access-policy'
import { isWorkspaceProductPath } from '@/lib/workspace-product'

const workOSConfigured = Boolean(
  process.env.WORKOS_CLIENT_ID &&
    process.env.WORKOS_API_KEY &&
    process.env.WORKOS_COOKIE_PASSWORD &&
    process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
)

function isUploadDeskPage(pathname: string) {
  return pathname === '/desk' || pathname.startsWith('/desk/')
}

function isUploadDeskApi(pathname: string) {
  return pathname === '/api/desk' || pathname.startsWith('/api/desk/')
}

export default async function proxy(request: NextRequest) {
  const isTrace = request.nextUrl.pathname === '/workspace/trace' || request.nextUrl.pathname.startsWith('/api/trace')
  const isDesk = isUploadDeskPage(request.nextUrl.pathname) || isUploadDeskApi(request.nextUrl.pathname)
  if ((isTrace || isDesk) && localTraceEnabled(process.env) && isLoopbackHost(request.nextUrl.hostname)) {
    return NextResponse.next()
  }
  const isProtectedWorkspace = request.nextUrl.pathname.startsWith('/workspace')

  if (!workOSConfigured) {
    if (isWorkspaceProductPath(request.nextUrl.pathname)) {
      return NextResponse.next()
    }
    if (isProtectedWorkspace) {
      const demoUrl = new URL('/demo', request.url)
      demoUrl.search = request.nextUrl.search
      demoUrl.searchParams.set('workspace', 'unavailable')
      return NextResponse.redirect(demoUrl)
    }

    return NextResponse.next()
  }

  const { session, headers, authorizationUrl } = await authkit(request)

  if ((isProtectedWorkspace || isUploadDeskPage(request.nextUrl.pathname)) && !session.user && authorizationUrl) {
    return handleAuthkitHeaders(request, headers, { redirect: authorizationUrl })
  }

  return handleAuthkitHeaders(request, headers)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}
