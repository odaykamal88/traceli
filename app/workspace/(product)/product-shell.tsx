'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import {
  inForceSignature,
  ruleLibraryPrepSignatureKey,
  ruleLibraryStorageKey,
  sanitizeStoredBoard,
} from '@/lib/rule-library'
import { workspaceProductPaths } from '@/lib/workspace-product'
import s from './product.module.css'

const nav = [
  { id: 'awards', href: workspaceProductPaths.awards, label: 'Awards' },
  { id: 'library', href: workspaceProductPaths.library, label: 'Rule library' },
  { id: 'records', href: workspaceProductPaths.records, label: 'Decision records' },
  { id: 'settings', href: workspaceProductPaths.settings, label: 'Settings' },
] as const

function activeId(pathname: string) {
  if (pathname.startsWith(workspaceProductPaths.library)) return 'library'
  if (pathname.startsWith(workspaceProductPaths.records)) return 'records'
  if (pathname.startsWith(workspaceProductPaths.settings)) return 'settings'
  return 'awards'
}

export function notifyRuleLibraryChange() {
  window.dispatchEvent(new Event('traceli-rule-library-change'))
}

export default function ProductShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const current = activeId(pathname)
  const [reprep, setReprep] = useState(false)

  useEffect(() => {
    function readBadge() {
      try {
        const raw = sessionStorage.getItem(ruleLibraryStorageKey)
        const board = sanitizeStoredBoard(raw ? JSON.parse(raw) : null)
        const prep = sessionStorage.getItem(ruleLibraryPrepSignatureKey)
        const now = inForceSignature(board)
        setReprep(Boolean(prep) && prep !== now)
      } catch {
        setReprep(false)
      }
    }
    readBadge()
    window.addEventListener('focus', readBadge)
    window.addEventListener('traceli-rule-library-change', readBadge)
    return () => {
      window.removeEventListener('focus', readBadge)
      window.removeEventListener('traceli-rule-library-change', readBadge)
    }
  }, [pathname])

  return (
    <div className={s.shell} data-testid="workspace-product">
      <a className={s.skip} href="#workspace-product-main">Skip to content</a>
      <header className={s.topbar}>
        <div className={s.topbarLeft}>
          <Link className={s.wordmark} href="/">Traceli</Link>
          <nav className={s.nav} aria-label="Product">
            {nav.map(item => (
              <Link
                key={item.id}
                href={item.href}
                className={current === item.id ? s.active : undefined}
                aria-current={current === item.id ? 'page' : undefined}
              >
                {item.label}
                {item.id === 'awards' && reprep ? (
                  <span className={s.badge}>Re-prep may be needed</span>
                ) : null}
              </Link>
            ))}
          </nav>
        </div>
        <div className={s.topbarMeta}>
          <span>Leila · Programme lead</span>
          <span className={s.dot} aria-hidden="true" />
          <span>Workspace</span>
        </div>
      </header>
      <main id="workspace-product-main" tabIndex={-1} className={s.main}>
        {children}
      </main>
    </div>
  )
}
