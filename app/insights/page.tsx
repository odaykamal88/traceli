import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ResearchSiteShell } from '@/components/research-site-shell'

export const metadata: Metadata = {
  title: 'Before You Sign | Traceli Research',
  description: 'Real cases. Costly lessons. Better-prepared procurement decisions.',
  alternates: { canonical: 'https://www.trace-li.com/insights' },
  robots: { index: true, follow: true },
}

const articles = [
  { href: '/insights/the-app-was-delivered-the-fallout-lasted-years', title: 'The app was delivered. The fallout lasted years.', lede: 'ArriveCAN shows how a procurement decision can become a problem that outlives the project.', date: '12 September 2026', issue: '02', image: '/research/before-you-sign-02/slide-1.png', width: 1080, height: 1350 },
  { href: '/insights/the-award-was-signed-the-proof-was-not-ready', title: 'The award was signed. The proof was not ready.', lede: 'Four official records show how procurement evidence gaps become audit, financial, funding and integrity problems.', date: '9 September 2026', issue: '01', image: '/research/before-you-sign-01/cover.png', width: 1600, height: 900 },
] as const

export default function ResearchIndexPage() {
  return <ResearchSiteShell>
    <header className="border-b border-[#d8d5cc] bg-[#eef2ed] px-5 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1100px]">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2f8876]">Traceli Research Desk</p>
        <h1 className="mt-5 font-display text-6xl leading-none tracking-[-0.03em] sm:text-8xl">Before You Sign.</h1>
        <p className="mt-6 max-w-2xl text-xl leading-8 text-[#52696a]">Real cases. Costly lessons. Better-prepared procurement decisions.</p>
      </div>
    </header>
    <div className="px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1100px] divide-y divide-[#d8d5cc]">
        {articles.map(article => <article key={article.issue} className="grid items-center gap-8 py-10 first:pt-0 sm:grid-cols-[220px_1fr] lg:gap-14">
          <Link href={article.href} tabIndex={-1} aria-hidden="true" className="block max-w-[280px]"><Image src={article.image} alt="" width={article.width} height={article.height} sizes="280px" className="h-auto w-full rounded-lg" /></Link>
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#748087]">Research note {article.issue} · {article.date}</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] tracking-[-0.025em] sm:text-5xl"><Link href={article.href} className="hover:text-[#1f6f61]">{article.title}</Link></h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#52696a]">{article.lede}</p>
            <Link href={article.href} className="mt-6 inline-flex min-h-11 items-center gap-3 font-semibold text-[#1f6f61]">Read the case<ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
        </article>)}
      </div>
    </div>
  </ResearchSiteShell>
}
