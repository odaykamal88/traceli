'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { guardedDestination } from '@/lib/tenders/unsaved-navigation'
import s from './tender-navigation-guard.module.css'

/** Keep the confirmation in the page so its controls are accessible and testable. */
export function TenderNavigationGuard({ enabled }: { enabled: boolean }) {
  const router = useRouter()
  const [destination, setDestination] = useState<string | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const originLink = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled) return
    const warnUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    const guardLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null
      if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return
      const next = guardedDestination(link.href, window.location.href)
      if (!next) return
      event.preventDefault()
      event.stopImmediatePropagation()
      originLink.current = link
      setDestination(next)
    }
    window.addEventListener('beforeunload', warnUnload)
    document.addEventListener('click', guardLink, true)
    return () => {
      window.removeEventListener('beforeunload', warnUnload)
      document.removeEventListener('click', guardLink, true)
    }
  }, [enabled])

  useEffect(() => {
    if (destination && !dialog.current?.open) dialog.current?.showModal()
  }, [destination])

  function stay() {
    dialog.current?.close()
    setDestination(null)
    originLink.current?.focus()
  }

  function leave() {
    if (!destination) return
    const next = destination
    dialog.current?.close()
    setDestination(null)
    router.push(next)
  }

  return <dialog ref={dialog} className={s.dialog} aria-labelledby="leave-tender-title" aria-describedby="leave-tender-description" onCancel={event => { event.preventDefault(); stay() }}>
    <h2 id="leave-tender-title">{enabled ? 'Leave with unsaved edits?' : 'Your edits have been saved'}</h2>
    <p id="leave-tender-description">{enabled
      ? 'Some edits have not finished saving. Stay here to finish or retry the save. Leaving may lose those edits.'
      : 'You can continue to the page you selected, or stay on this tender.'}</p>
    <div className={s.actions}>
      <button type="button" onClick={stay} autoFocus>Stay on tender</button>
      <button type="button" className={s.leave} onClick={leave}>{enabled ? 'Leave without waiting' : 'Continue'}</button>
    </div>
  </dialog>
}
