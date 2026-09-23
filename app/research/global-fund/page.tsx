import type { Metadata } from 'next'
import localFont from 'next/font/local'

import { ResearchSiteShell } from '@/components/research-site-shell'
import { articleBodyHtml } from './article-body'
import { articleCss } from './article-css'
import { ReadingProgressRail } from './progress-rail'

const articleSans = localFont({
  src: './fonts/IBMPlexSans-Variable.ttf',
  variable: '--font-gf-sans',
  display: 'swap',
  weight: '100 700',
})

const title = 'The award was signed. The proof was not ready.'
const description = 'Four public Global Fund OIG files on pre-signature proof: Togo GF-OIG-25-005, Ghana GF-OIG-26-008, Zambia GF-OIG-23-022, and RDT GF-OIG-26-006.'
const canonical = 'https://www.trace-li.com/research/global-fund'

export const metadata: Metadata = {
  title: { absolute: `${title} — Trace-li` },
  description,
  alternates: { canonical },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'article',
    title,
    description,
    url: canonical,
    authors: ['Trace-li Research Desk'],
    images: [{
      url: '/research/global-fund/charts/06-value-chain-map.png',
      width: 2430,
      height: 1467,
      alt: 'Trace-li value-chain map: intake, rule map, evidence gaps, judgment, and freeze.',
    }],
  },
}

export default function GlobalFundResearchPage() {
  return (
    <ResearchSiteShell readingProgress={<ReadingProgressRail />} traceLi>
      <style dangerouslySetInnerHTML={{ __html: articleCss }} />
      <article className={`gf-article ${articleSans.variable}`} dangerouslySetInnerHTML={{ __html: articleBodyHtml }} />
    </ResearchSiteShell>
  )
}
