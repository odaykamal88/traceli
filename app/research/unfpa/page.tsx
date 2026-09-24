import type { Metadata } from 'next'
import localFont from 'next/font/local'

import { ResearchSiteShell } from '@/components/research-site-shell'
import { articleCss } from '../global-fund/article-css'
import { ReadingProgressRail } from '../global-fund/progress-rail'
import { articleBodyHtml } from './article-body'

const articleSans = localFont({
  src: '../global-fund/fonts/IBMPlexSans-Variable.ttf',
  variable: '--font-gf-sans',
  display: 'swap',
  weight: '100 700',
})

const title = 'The workplan was signed. The competition file was not.'
const description = 'Three public UNFPA OAIS files on pre-signature proof: Annex 4 entries 13 and 21, and the Sudan country-office audit IA/2025-29.'
const canonical = 'https://www.trace-li.com/research/unfpa'

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
      url: '/research/unfpa/charts/04-value-chain-map.png',
      width: 1600,
      height: 900,
      alt: 'Trace-li value-chain map for UNFPA OAIS gaps: intake, rule map, evidence gaps, judgment, and freeze.',
    }],
  },
}

export default function UnfpaResearchPage() {
  return (
    <ResearchSiteShell readingProgress={<ReadingProgressRail />} traceLi>
      <style dangerouslySetInnerHTML={{ __html: `${articleCss}
.gf-article .bignums { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.gf-article .bignum { min-width: 0; }
.gf-article .bignum .num { overflow-wrap: anywhere; }
@media (max-width: 720px) {
  .gf-article .bignums { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 520px) {
  .gf-article .bignums { grid-template-columns: 1fr; }
}` }} />
      <article className={`gf-article ${articleSans.variable}`} dangerouslySetInnerHTML={{ __html: articleBodyHtml }} />
    </ResearchSiteShell>
  )
}
