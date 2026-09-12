import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, Waypoints } from 'lucide-react'

const bookingHref = 'https://cal.com/oqemal/30min'

const navigation = [
  { href: '/insights', label: 'Research' },
  { href: '/docs', label: 'Documentation' },
] as const

function TraceliMark() {
  return (
    <span className="flex items-center gap-3">
      <span className="relative flex size-9 shrink-0 items-center justify-center" aria-hidden="true">
        <span className="absolute inset-[3px] rotate-45 rounded-[8px] border border-[#8be1cf]/65 bg-gradient-to-br from-[#0d3953] to-[#071d39] shadow-[0_6px_18px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.16)]" />
        <span className="absolute inset-[7px] rotate-45 rounded-[5px] border border-white/20" />
        <Waypoints className="relative size-[18px] stroke-[1.75] text-[#fbf5ea] drop-shadow-sm" />
        <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full border border-[#061a33] bg-[#78d8c4] shadow-[0_0_8px_rgba(120,216,196,0.8)]" />
      </span>
      <span className="font-mono text-[13px] font-semibold uppercase tracking-[0.27em] text-[#fbf5ea]">traceli</span>
    </span>
  )
}

export function ResearchSiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f3eb] text-[#071d39]">
      <a href="#main-content" className="sr-only z-[80] rounded-lg bg-[#fbf5ea] px-4 py-2 text-[#071d39] focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#061a33]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-5 px-5 py-4 sm:px-8 lg:px-12">
          <Link href="/" aria-label="Traceli home">
            <TraceliMark />
          </Link>
          <nav aria-label="Public navigation" className="flex items-center gap-1 sm:gap-2">
            {navigation.map(({ href, label }) => (
              <Link key={href} href={href} className="hidden rounded-lg px-3 py-2 text-sm font-medium text-white/62 transition hover:bg-white/[0.06] hover:text-white md:inline-flex">
                {label}
              </Link>
            ))}
            <Link href="/demo" className="group ml-1 inline-flex min-h-11 items-center gap-3 rounded-xl border border-white/18 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#78d8c4]/55 hover:bg-white/[0.08]">
              Open demo
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </nav>
        </div>
        <nav aria-label="Mobile public navigation" className="overflow-x-auto border-t border-white/10 md:hidden">
          <div className="mx-auto flex min-w-max max-w-[1320px] items-center gap-5 px-5 py-2.5 text-xs font-medium text-white/58 sm:px-8">
            {navigation.map(({ href, label }) => <Link key={href} href={href} className="py-1 hover:text-white">{label}</Link>)}
          </div>
        </nav>
      </header>

      <main id="main-content">{children}</main>

      <footer className="border-t border-white/10 bg-[#061a33] px-5 py-10 text-white sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1320px] gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <Link href="/" aria-label="Traceli home">
              <TraceliMark />
            </Link>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/48">Procurement evidence and audit-response support. Start with one completed procurement file, the question it needs to answer, and the date the answer is due.</p>
          </div>
          <div className="flex max-w-xl flex-wrap gap-x-5 gap-y-3 text-xs text-white/55 md:justify-end">
            {navigation.map(({ href, label }) => <Link key={href} href={href} className="hover:text-white">{label}</Link>)}
            <a href={bookingHref} target="_blank" rel="noreferrer" className="hover:text-white">Discuss one procurement file</a>
          </div>
        </div>
        <div className="mx-auto mt-8 flex max-w-[1320px] flex-col gap-2 border-t border-white/10 pt-6 text-[11px] leading-5 text-white/38 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Traceli.</p>
          <p>Public-site contact: <a href="mailto:hello@trace-li.com" className="underline decoration-white/20 underline-offset-4 hover:text-white">hello@trace-li.com</a></p>
        </div>
      </footer>
    </div>
  )
}
