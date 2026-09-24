import Link from 'next/link'
import type { ReactNode } from 'react'

import s from './desk.module.css'

export function DeskShell({
  children,
  viewer,
  showSignOut,
  current,
}: {
  children: ReactNode
  viewer?: { name: string, role: string }
  showSignOut?: boolean
  current?: 'hub' | 'desk'
}) {
  return (
    <div className={s.shell}>
      <a className={s.skip} href="#desk-main">{current === 'hub' ? 'Skip to knowledge hub' : 'Skip to award desk'}</a>
      <header className={s.topbar}>
        <div className={s.topbarLeft}>
          <Link className={s.wordmark} href="/desk">Traceli</Link>
          <nav className={s.nav} aria-label="Award assurance">
            <Link href="/hub" aria-current={current === 'hub' ? 'page' : undefined}>Knowledge hub</Link>
            <Link href="/desk" aria-current={current === 'desk' ? 'page' : undefined}>Award desk</Link>
          </nav>
        </div>
        <div className={s.topbarMeta}>
          <span>{current === 'hub' ? 'Knowledge hub' : 'Award desk'}</span>
          <span className={s.dot} aria-hidden="true" />
          {viewer ? <span>{viewer.name} · {viewer.role}</span> : <span>Sign-in required</span>}
          {showSignOut ? (
            <form className={s.signOut} action="/desk/sign-out" method="post">
              <button type="submit">Sign out</button>
            </form>
          ) : null}
        </div>
      </header>
      <main className={s.main} id="desk-main">
        {children}
      </main>
    </div>
  )
}

export function DeskUnavailable() {
  return (
    <DeskShell>
      <p className={s.eyebrow}>Award desk</p>
      <h1>Sign-in is not available here</h1>
      <p className={s.lede}>
        The award desk needs the same WorkOS sign-in as the rest of Trace-li.
        This environment does not have that session turned on.
      </p>
      <p className={s.lede}>
        The public walkthrough is still open. It uses a fictional packet and does not ask you to sign in.
      </p>
      <p>
        <Link className={s.linkButton} href="/demo">Open the public walkthrough</Link>
      </p>
    </DeskShell>
  )
}

export function DeskAccessRequired() {
  return (
    <DeskShell showSignOut>
      <p className={s.eyebrow}>Award desk</p>
      <h1>This session cannot open the desk</h1>
      <p className={s.lede}>
        Sign in with an active procurement, panel, auditor, or workspace admin role.
        The account needs a verified email and one organization membership.
      </p>
      <p>
        <Link className={s.linkButton} href="/login">Try another sign-in</Link>
      </p>
    </DeskShell>
  )
}
