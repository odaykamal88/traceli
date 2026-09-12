import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Download } from 'lucide-react'

import { ResearchSiteShell } from '@/components/research-site-shell'
import { ResearchBriefingCarousel } from '@/components/research-briefing-carousel'
import content from './article-content.json'

const canonical = 'https://www.trace-li.com/insights/the-app-was-delivered-the-fallout-lasted-years'
const imageRoot = '/research/before-you-sign-02'

export const metadata: Metadata = {
  title: content.title,
  description: content.lede,
  alternates: { canonical },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'article', title: content.title, description: content.lede,
    url: canonical, authors: ['Traceli Research Desk'], publishedTime: '2026-09-12',
    images: [{ url: `${imageRoot}/slide-1.png`, width: 1080, height: 1350, alt: content.title }],
  },
}

type InlinePart = { type: string; text: string; href?: string }

function Paragraph({ parts }: { parts: InlinePart[] }) {
  return <p>{parts.map((part, index) => {
    if (part.type === 'link') return <a key={index} href={part.href}>{part.text}</a>
    if (part.type === 'strong') return <strong key={index}>{part.text}</strong>
    if (part.type === 'em') return <em key={index}>{part.text}</em>
    return part.text
  })}</p>
}

export default function ArriveCANArticlePage() {
  return (
    <ResearchSiteShell>
      <article>
        <header className="border-b border-[#d8d5cc] bg-[#eef2ed] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <div className="mx-auto max-w-[1100px]">
            <Link href="/insights" className="text-sm font-semibold text-[#1f6f61] hover:underline">Before You Sign / Research</Link>
            <p className="mt-10 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2f8876]">ArriveCAN · Research note 02</p>
            <h1 className="mt-5 max-w-5xl font-display text-[clamp(3.5rem,8vw,7.8rem)] leading-[0.9] tracking-[-0.04em]">{content.title}</h1>
            <p className="mt-8 max-w-3xl text-xl leading-8 text-[#52696a] sm:text-2xl sm:leading-9">{content.lede}</p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-[#c9d2ce] pt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#748087]">
              <span>Traceli Research Desk</span><time dateTime="2026-09-12">12 September 2026</time><span>5-minute read</span>
            </div>
            <figure className="mt-10">
              <Image src={`${imageRoot}/editorial.png`} alt="Editorial illustration of a hearing-room microphone, unbranded phone and closed folder. This is not an actual ArriveCAN hearing." width={1536} height={1024} sizes="(max-width: 1100px) 100vw, 1100px" className="max-h-[480px] w-full rounded-xl object-cover" />
              <figcaption className="mt-3 text-xs leading-6 text-[#617078]">AI-generated editorial illustration.</figcaption>
            </figure>
          </div>
        </header>

        <ResearchBriefingCarousel slides={content.slides} imageRoot={imageRoot} pdfHref={`${imageRoot}/briefing.pdf`} heading="The fallout, in eight frames." introduction="The ArriveCAN case: uncertain cost, public criticism, the wait for answers and a supplier's exclusion from future federal work." />

        <div className="px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <div className="mx-auto grid max-w-[1100px] gap-12 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-16">
            <div className="min-w-0 space-y-12 text-[17px] leading-8 text-[#45565d] [&_a]:font-medium [&_a]:text-[#1f6f61] [&_a]:underline [&_a]:decoration-[#1f6f61]/25 [&_a]:underline-offset-4">
              <div className="space-y-5 text-xl leading-9 text-[#30454c]">{content.opening.map((parts, index) => <Paragraph key={index} parts={parts} />)}</div>
              {content.sections.map(section => (
                <section key={section.id} id={section.id} className="scroll-mt-28 border-t border-[#d8d5cc] pt-10">
                  <h2 className="font-display text-4xl leading-[1.05] tracking-[-0.025em] text-[#071d39] sm:text-5xl">{section.title}</h2>
                  <div className="mt-7 space-y-5">{section.paragraphs.map((parts, index) => <Paragraph key={index} parts={parts} />)}</div>
                </section>
              ))}
            </div>
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <nav aria-label="Article contents" className="rounded-2xl border border-[#d8d5cc] bg-white p-5">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2f8876]">In this note</p>
                <div className="mt-5 flex flex-col gap-4 text-sm leading-6 text-[#617078]">{content.sections.map(section => <a key={section.id} href={`#${section.id}`} className="hover:text-[#1f6f61]">{section.title}</a>)}</div>
              </nav>
              <a href={`${imageRoot}/briefing.pdf`} target="_blank" rel="noreferrer" className="mt-4 flex min-h-12 items-center gap-3 rounded-xl bg-[#071d39] p-5 text-sm font-semibold text-white"><Download className="size-4 shrink-0" aria-hidden="true" />Download the carousel</a>
            </aside>
          </div>
        </div>
        <div className="border-t border-[#d8d5cc] px-5 py-12 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1100px]"><Link href="/insights" className="inline-flex min-h-11 items-center gap-3 font-semibold text-[#1f6f61]">More from Before You Sign<ArrowRight className="size-4" aria-hidden="true" /></Link></div>
        </div>
      </article>
    </ResearchSiteShell>
  )
}
