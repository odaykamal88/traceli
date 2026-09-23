import type { ReactNode } from 'react'
import Link from 'next/link'
import { Waypoints } from 'lucide-react'

function TraceLiMark() {
  return (
    <span className="flex items-center gap-3">
      <span className="relative flex size-9 shrink-0 items-center justify-center" aria-hidden="true">
        <span className="absolute inset-[3px] rotate-45 rounded-[8px] border border-[#8be1cf]/65 bg-gradient-to-br from-[#0d3953] to-[#071d39] shadow-[0_6px_18px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.16)]" />
        <span className="absolute inset-[7px] rotate-45 rounded-[5px] border border-white/20" />
        <Waypoints className="relative size-[18px] stroke-[1.75] text-[#fbf5ea] drop-shadow-sm" />
        <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full border border-[#061a33] bg-[#78d8c4] shadow-[0_0_8px_rgba(120,216,196,0.8)]" />
      </span>
      <span className="font-display text-[1.35rem] leading-none tracking-[-0.03em] text-[#fbf5ea]">Trace-li</span>
    </span>
  )
}

const navigation = [
  { href: '/cases', label: 'Case cards' },
  { href: '/demo', label: 'Fictional desk' },
] as const

export function CaseCardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f3eb] text-[#071d39]">
      <a href="#main-content" className="sr-only z-[80] rounded-lg bg-[#fbf5ea] px-4 py-2 text-[#071d39] focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#061a33]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-5 px-5 py-4 sm:px-8">
          <Link href="/" aria-label="Trace-li home">
            <TraceLiMark />
          </Link>
          <nav aria-label="Case card navigation" className="flex items-center gap-1">
            {navigation.map(({ href, label }) => (
              <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-medium text-white/72 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#78d8c4]">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="border-t border-white/10 bg-[#061a33] px-5 py-8 text-white sm:px-8">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <TraceLiMark />
            <p className="mt-3 max-w-md text-sm leading-6 text-white/55">Pre-signature award assurance. A case card cites a frozen record, or says plainly that the freeze is still waiting.</p>
          </div>
          <p className="text-xs text-white/45">
            <a href="mailto:hello@trace-li.com" className="underline decoration-white/20 underline-offset-4 hover:text-white">hello@trace-li.com</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
