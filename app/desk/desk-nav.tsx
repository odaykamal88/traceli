'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

import { deskNavigationHref, readActiveDesk } from '@/lib/hub/desk-continuity'
import { readHubLibraryResult } from '@/lib/hub/library'
import { readActiveTenderNavigation, tenderNavigationHref, writeActiveTenderNavigation } from '@/lib/tenders/client'

import s from './desk.module.css'

export function DeskNav({ current, organizationId, durable = false }: { current?: 'hub' | 'desk', organizationId?: string, durable?: boolean }) {
  const [deskHref, setDeskHref] = useState(durable ? '/hub' : '/desk')
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (durable) {
      const fromUrl = pathname === '/desk' ? searchParams.get('tender') : null
      if (organizationId && fromUrl) writeActiveTenderNavigation(organizationId, fromUrl)
      const activeTender = organizationId ? readActiveTenderNavigation(organizationId) : null
      const selected = pathname === '/desk' && fromUrl ? fromUrl : activeTender
      setDeskHref(tenderNavigationHref(selected))
      return
    }
    const active = organizationId ? readActiveDesk(organizationId) : null
    const result = organizationId ? readHubLibraryResult(organizationId) : null
    setDeskHref(deskNavigationHref({
      pathname,
      query: searchParams,
      library: result?.ok ? result.state : null,
      active,
    }))
  }, [pathname, searchParams, organizationId, durable])

  return (
    <div className={s.topbarLeft}>
      <Link className={s.wordmark} href={deskHref}>Trace-li</Link>
      <nav className={s.nav} aria-label="Award assurance">
        <Link href="/hub" aria-current={current === 'hub' ? 'page' : undefined}>Knowledge hub</Link>
        <Link href={deskHref} aria-current={current === 'desk' ? 'page' : undefined}>Award desk</Link>
      </nav>
    </div>
  )
}
