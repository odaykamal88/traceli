import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { CaseCardShell } from '@/components/case-card-shell'
import { GlossaryText } from '@/components/glossary-text'
import { readerFacingText } from '@/lib/case-card-presentation/reader-text'
import { listCaseCards } from '@/lib/case-cards/catalog'

const cards = listCaseCards()
const anyPublished = cards.some(card => card.publicationState === 'published')

export const metadata: Metadata = {
  title: { absolute: 'Case cards — Trace-li' },
  description: 'Public Trace-li case cards for pre-signature award assurance. A card is either a verified frozen record or a labeled fixture awaiting a founder freeze.',
  alternates: { canonical: '/cases' },
  robots: anyPublished ? { index: true, follow: true } : { index: false, follow: false },
}

export default function CaseCardsPage() {
  return (
    <CaseCardShell>
      <header className="border-b border-[#d8d5cc] bg-[#eef2ed] px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-[1100px]">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2f8876]">Trace-li · pre-signature award assurance</p>
          <h1 className="mt-4 font-display text-5xl leading-none tracking-[-0.03em] sm:text-7xl">Case cards</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#52696a]">A public card cites one frozen Field Registry record. Until that freeze exists, the card says so and does not invent hashes.</p>
        </div>
      </header>
      <div className="px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-[1100px]">
          {cards.length === 0 ? (
            <p className="rounded-2xl border border-[#d8d5cc] bg-white px-5 py-8 text-sm leading-6 text-[#52696a]">No case cards are published.</p>
          ) : (
            <ul className="divide-y divide-[#d8d5cc] border-y border-[#d8d5cc]">
              {cards.map(card => (
                <li key={card.slug} className="py-8">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2f8876]">{card.statusLabel}</p>
                  <h2 className="mt-3 font-display text-3xl leading-tight tracking-[-0.03em] sm:text-4xl">
                    <Link href={`/cases/${card.slug}`} className="hover:text-[#1f6f61]">{card.title}</Link>
                  </h2>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-[#52696a]">
                    <GlossaryText text={readerFacingText(card.lede)} />
                  </p>
                  <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
                    <Link href={`/cases/${card.slug}`} className="inline-flex min-h-11 items-center gap-2 text-[#1f6f61]">
                      Open the card <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                    <Link href={`/cases/${card.slug}.json`} className="inline-flex min-h-11 items-center text-[#145246] underline decoration-[#b7ddd4] underline-offset-4">
                      JSON
                    </Link>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </CaseCardShell>
  )
}
