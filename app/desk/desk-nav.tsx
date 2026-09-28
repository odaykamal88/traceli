'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

import { deskNavigationHref, readActiveDesk } from '@/lib/hub/desk-continuity'
import { readHubLibraryResult } from '@/lib/hub/library'

import s from './desk.module.css'

export function DeskNav({ current, organizationId, durable = false }: { current?: 'hub' | 'desk' | 'work', organizationId?: string, durable?: boolean }) {
  const [deskHref, setDeskHref] = useState(durable ? '/work' : '/desk')
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (durable) {
      setDeskHref('/work')
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
      <Link className={s.wordmark} href={durable ? "/work" : deskHref}>Trace-li</Link>
      <nav className={s.nav} aria-label="Award assurance">
        {durable ? <Link href="/work" aria-current={current === "work" ? "page" : undefined}>My work</Link> : null}
        <Link href="/hub" aria-current={current === 'hub' ? 'page' : undefined}>Knowledge hub</Link>
        {durable ? (pathname.startsWith("/work/") && pathname !== "/work/new" ? <Link href={pathname} aria-current="page">Current tender</Link> : null) : <Link href={deskHref} aria-current={current === 'desk' ? 'page' : undefined}>Award desk</Link>}
      </nav>
    </div>
  )
}
