import Link from 'next/link'
import { Suspense, type ReactNode } from 'react'

import s from './desk.module.css'
import { DeskNav } from './desk-nav'

export function DeskShell({
  children,
  viewer,
  showSignOut,
  current,
  durable = false,
}: {
  children: ReactNode
  viewer?: { name: string, role: string, organizationId?: string }
  showSignOut?: boolean
  current?: 'hub' | 'desk'
  durable?: boolean
}) {
  return (
    <div className={s.shell}>
      <a className={s.skip} href="#desk-main">{current === 'hub' ? 'Skip to knowledge hub' : 'Skip to award desk'}</a>
      <header className={s.topbar}>
        <Suspense fallback={
          <div className={s.topbarLeft}>
            <Link className={s.wordmark} href={durable ? '/hub' : '/desk'}>Trace-li</Link>
            <nav className={s.nav} aria-label="Award assurance">
              <Link href="/hub">Knowledge hub</Link>
              <Link href={durable ? '/hub' : '/desk'}>Award desk</Link>
            </nav>
          </div>
        }>
          <DeskNav current={current} organizationId={viewer?.organizationId} durable={durable} />
        </Suspense>
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
        Sign out leaves this account on a signed-out page. Try another sign-in clears it, then lets you choose a different account.
      </p>
      <form className={`${s.signOut} ${s.recovery}`} action="/desk/switch-account" method="post">
        <button className={s.linkButton} type="submit">Try another sign-in</button>
      </form>
    </DeskShell>
  )
}

export function DeskSignedOut() {
  return (
    <div className={s.shell}>
      <a className={s.skip} href="#desk-main">Skip to signed-out note</a>
      <header className={s.topbar}>
        <Link className={s.wordmark} href="/">Trace-li</Link>
        <div className={s.topbarMeta}>
          <span>Signed out</span>
        </div>
      </header>
      <main className={s.main} id="desk-main">
        <p className={s.eyebrow}>Trace-li</p>
        <h1>You are signed out</h1>
        <p className={s.lede}>
          This browser is no longer signed in. Sign in when you want to open the award desk, or use the public walkthrough. The walkthrough uses a fictional packet and does not ask you to sign in.
        </p>
        <p className={`${s.actions} ${s.recovery}`}>
          <Link className={s.primary} href="/login">Sign in</Link>
          <Link className={s.secondary} href="/demo">Open the public walkthrough</Link>
        </p>
      </main>
    </div>
  )
}
