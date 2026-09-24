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

const title = 'Reserve allocation without a pre-selection freeze.'
const description = 'Three public OIOS files on CBPF pre-signature proof: 2025/098 reserve pre-selection and scorecards, Iraq 2020/005 forensic timing, and Ethiopia 2017/014 as a vintage pass-through case.'
const canonical = 'https://www.trace-li.com/research/ocha-cbpf'

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
      url: '/research/ocha-cbpf/charts/06-value-chain-map.png',
      width: 1600,
      height: 900,
      alt: 'Trace-li value-chain map for OCHA CBPF gaps: intake, rule map, evidence gaps, judgment, and freeze.',
    }],
  },
}

export default function OchaCbpfResearchPage() {
  return (
    <ResearchSiteShell readingProgress={<ReadingProgressRail />} traceLi>
      <style dangerouslySetInnerHTML={{ __html: articleCss }} />
      <article className={`gf-article ${articleSans.variable}`} dangerouslySetInnerHTML={{ __html: articleBodyHtml }} />
    </ResearchSiteShell>
  )
}
