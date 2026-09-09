import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ExternalLink, FileCheck2 } from 'lucide-react'

import { ResearchSiteShell } from '@/components/research-site-shell'
import { ResearchBriefingCarousel } from '@/components/research-briefing-carousel'
import content from './article-content.json'

export const metadata: Metadata = {
  title: 'The award was signed. The proof was not ready.',
  description: 'Four official records show how procurement evidence gaps become audit, financial, funding and integrity problems.',
  alternates: { canonical: 'https://www.trace-li.com/insights/the-award-was-signed-the-proof-was-not-ready' },
  robots: { index: true, follow: true },
  openGraph: { type: 'article', title: 'The award was signed. The proof was not ready.', description: 'Four official records and seven questions for one completed procurement award.', url: 'https://www.trace-li.com/insights/the-award-was-signed-the-proof-was-not-ready', authors: ['Traceli Research Desk'], images: [{ url: '/research/before-you-sign-01/cover.png', width: 1600, height: 900, alt: 'The award was signed. The proof was not ready. Traceli Research Desk.' }] },
}

const sources = [
  {
    institution: 'UN Office of Internal Oversight Services',
    title: 'UNMISS local procurement: audit report 2024/064',
    href: 'https://oios.un.org/system/files/confidential-files/Reports/2024_064_pd.pdf',
    note: 'Final internal-audit report. Recommendations accepted by UNMISS and later recorded as implemented.',
  },
  { institution: 'UN Office of Internal Oversight Services', title: 'Recommendation implementation table, July 2026', href: 'https://oios.un.org/sites/default/files/2026-07/Rec_implementation_rate_IAD_20260731.pdf', note: 'Page 7 records both important recommendations for report 2024/064 as implemented: 2 of 2.' },
  {
    institution: 'European Anti-Fraud Office',
    title: 'OLAF Report 2025: an irregular tender procedure',
    href: 'https://ec.europa.eu/olaf-report/2025/investigative-activities/protection-of-eu-funds_en.html#an-irregular-tender-procedure',
    note: 'OLAF reported a €7.5 million financial impact and considered the corresponding payments ineligible.',
  },
  {
    institution: 'European Anti-Fraud Office',
    title: 'OLAF Report 2023: serious misuse of EU pre-accession agricultural funds',
    href: 'https://ec.europa.eu/olaf-report/2023/investigative-activities/preventing-undue-expenditure_en.html#serious-misuse-of-eu-pre-accession-agricultural-funds',
    note: 'OLAF recommended protecting €112 million in future IPARD funding until remedial measures were in place.',
  },
  {
    institution: 'World Bank Group',
    title: 'World Bank Group debars Pars Tableau Company JSC',
    href: 'https://www.worldbank.org/en/news/press-release/2025/06/18/world-bank-group-debars-pars-tableau-company-jsc',
    note: 'The settlement followed false claims of past experience in bids for two World Bank-financed projects.',
  },
] as const

const caseImages: Record<string, { file: string; alt: string }> = {
  auditability: { file: '02-auditability.png', alt: 'UN OIOS: incomplete bid-evaluation documentation at UNMISS weakened auditability. Final internal audit; recommendations accepted and later implemented.' },
  'financial-eligibility': { file: '03-financial-eligibility.png', alt: 'OLAF reported a €7.5 million financial impact and considered corresponding payments ineligible. Investigative findings and recommendations, not a final judgment or completed recovery.' },
  'funding-continuity': { file: '04-funding-continuity.png', alt: 'OLAF recommended protecting €112 million in future IPARD funding until remedial measures were in place. The source does not establish suspension or recovery.' },
  'integrity-exposure': { file: '05-integrity-exposure.png', alt: 'World Bank: a 63-month settlement-based debarment followed false past-experience claims in bids for two financed projects.' },
}

function ArticleSection({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-[#d8d5cc] pt-12 first:border-t-0 first:pt-0">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2f8876]">{eyebrow}</p>
      <h2 className="mt-4 font-display text-4xl leading-[0.98] tracking-[-0.025em] sm:text-5xl">{title}</h2>
      <div className="mt-7 space-y-5 text-[17px] leading-8 text-[#45565d] [&_a]:font-medium [&_a]:text-[#1f6f61] [&_a]:underline [&_a]:decoration-[#1f6f61]/25 [&_a]:underline-offset-4">{children}</div>
    </section>
  )
}

export default function ResearchArticlePage() {
  return (
    <ResearchSiteShell>
      <article>
        <header className="border-b border-[#d8d5cc] bg-[#eef2ed] px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-[1100px]">
            <p className="mt-10 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2f8876]">Award assurance · Research note 01</p>
            <h1 className="mt-5 max-w-5xl font-display text-[clamp(3.6rem,8.5vw,8.3rem)] leading-[0.84] tracking-[-0.04em]">The award was signed. The proof was not ready.</h1>
            <p className="mt-8 max-w-3xl text-xl leading-8 text-[#52696a] sm:text-2xl sm:leading-9">Four official records show how procurement evidence gaps become audit, financial, funding and integrity problems.</p>
            <a href="#visual-briefing" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#1f6f61] hover:underline">Explore the visual briefing<ArrowRight className="size-4" aria-hidden="true" /></a>
            <div className="mt-9 flex flex-wrap gap-x-8 gap-y-3 border-t border-[#c9d2ce] pt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#748087]">
              <span>Traceli Research Desk</span>
              <span>9 September 2026</span>
              <span>8-minute read</span>
            </div>
          </div>
        </header>

        <ResearchBriefingCarousel />

        <div className="px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <div className="mx-auto grid max-w-[1100px] gap-12 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-16">
            <div className="space-y-14">
              <div className="space-y-5 text-xl leading-9 text-[#30454c]">
                {content.opening.map((paragraph, index) => <p key={paragraph} className={index === 0 ? 'font-display text-3xl leading-[1.15] text-[#071d39] sm:text-4xl' : undefined}>{paragraph}</p>)}
              </div>
              {content.sections.map((section, index) => (
                <ArticleSection key={section.id} id={section.id} eyebrow={index < 4 ? `Consequence ${String(index + 1).padStart(2, '0')}` : 'The award record'} title={section.title}>
                  {caseImages[section.id] && <a href={`/research/before-you-sign-01/cards/${caseImages[section.id].file}`} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-[#d8d5cc] !no-underline"><Image src={`/research/before-you-sign-01/cards/${caseImages[section.id].file}`} alt={caseImages[section.id].alt} width={1600} height={900} unoptimized className="h-auto w-full" /></a>}
                  {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                  {section.questions && <ol className="!mt-8 list-none space-y-3">{section.questions.map((question, index) => <li key={question} className="grid grid-cols-[34px_1fr] gap-3"><span className="flex size-8 items-center justify-center rounded-full bg-[#dff1eb] font-mono text-[10px] font-semibold text-[#1f6f61]" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span>{question}</span></li>)}</ol>}
                  {section.after?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                  {section.id === 'where-traceli-fits' && <div className="!mt-9 rounded-2xl bg-[#071d39] p-7 text-white sm:p-9"><FileCheck2 className="size-8 text-[#78d8c4]" aria-hidden="true" /><a href="https://cal.com/oqemal/30min" target="_blank" rel="noreferrer" className="group mt-6 inline-flex items-center gap-3 !text-[#8be1cf] !no-underline">Discuss one procurement file<ArrowRight className="size-4" aria-hidden="true" /></a></div>}
                </ArticleSection>
              ))}
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-2xl border border-[#d8d5cc] bg-white p-5">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2f8876]">In this note</p>
                <nav aria-label="Article contents" className="mt-5 flex flex-col gap-3 text-sm text-[#617078]">
                  <a href="#visual-briefing" className="hover:text-[#1f6f61]">Visual briefing</a>
                  <a href="#auditability" className="hover:text-[#1f6f61]">Auditability</a>
                  <a href="#financial-eligibility" className="hover:text-[#1f6f61]">Financial eligibility</a>
                  <a href="#funding-continuity" className="hover:text-[#1f6f61]">Funding continuity</a>
                  <a href="#integrity-exposure" className="hover:text-[#1f6f61]">Integrity exposure</a>
                  <a href="#the-recurring-control-question" className="hover:text-[#1f6f61]">Control question</a>
                  <a href="#where-traceli-fits" className="hover:text-[#1f6f61]">Where Traceli fits</a>
                </nav>
              </div>
              <a href="/research/before-you-sign-01/briefing.pdf" className="mt-4 inline-flex w-full items-center justify-between gap-3 rounded-2xl bg-[#071d39] p-5 text-sm font-semibold text-white" target="_blank" rel="noreferrer">Download the briefing PDF<ExternalLink className="size-4 shrink-0" aria-hidden="true" /></a>
              <div className="mt-4 rounded-2xl border border-[#d8d5cc] bg-[#fffdf8] p-5 text-xs leading-6 text-[#617078]">
                <p className="font-semibold text-[#30454c]">Boundary note</p>
                <p className="mt-2">The institutions cited are not presented as Traceli customers, partners or endorsers. Their public records illustrate consequence categories, not claims that Traceli would have prevented the outcomes.</p>
              </div>
            </aside>
          </div>
        </div>

        <section aria-labelledby="sources-heading" className="border-t border-[#d8d5cc] bg-[#eef2ed] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="mx-auto max-w-[1100px]">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2f8876]">Methods and sources</p>
            <h2 id="sources-heading" className="mt-4 font-display text-4xl leading-tight sm:text-5xl">Official records, read for control consequences.</h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#617078]">This note uses public records from their issuing institutions. It summarizes the stated findings and outcomes, then identifies the award-assurance question they raise. It does not make an independent finding about the underlying parties.</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {sources.map(({ institution, title, href, note }) => (
                <a key={title} href={href} target="_blank" rel="noreferrer" className="group flex min-h-[220px] flex-col rounded-2xl border border-[#d8d5cc] bg-white p-6 transition hover:-translate-y-1 hover:border-[#93c9bd]">
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-[#2f8876]">{institution}</p>
                  <h3 className="mt-5 text-lg font-semibold leading-6 tracking-[-0.02em]">{title}</h3>
                  <p className="mt-3 text-xs leading-6 text-[#617078]">{note}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-6 text-xs font-semibold text-[#1f6f61]">Open official source<ExternalLink className="size-3.5" aria-hidden="true" /></span>
                </a>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/" className="inline-flex min-h-12 items-center rounded-xl border border-[#bfc8c5] bg-white px-5 text-sm font-semibold text-[#30454c] hover:border-[#93c9bd]">Traceli home</Link>
              <a href="mailto:hello@trace-li.com" className="inline-flex min-h-12 items-center rounded-xl bg-[#071d39] px-5 text-sm font-semibold text-white hover:bg-[#0d3057]">Request a source correction</a>
            </div>
          </div>
        </section>
      </article>
    </ResearchSiteShell>
  )
}
