import type { Metadata } from 'next'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import Link from 'next/link'

import { ResearchSiteShell } from '@/components/research-site-shell'
import { renderSources } from './render-sources'

const sourcesMarkdown = readFileSync(join(process.cwd(), 'content/research/global-fund/SOURCES.md'), 'utf8')

const description = 'Primary Global Fund OIG locators for every quantitative or status claim in the Trace-li research note.'

export const metadata: Metadata = {
  title: { absolute: 'Sources — Global Fund OIG research — Trace-li' },
  description,
  alternates: { canonical: 'https://www.trace-li.com/research/global-fund/sources' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Sources — Global Fund OIG research',
    description,
    url: 'https://www.trace-li.com/research/global-fund/sources',
  },
}

const sourcesCss = `
.gf-sources { background: #fbf5ea; color: #061a33; padding: 48px 20px 80px; }
.gf-sources .sheet { max-width: 1040px; margin: 0 auto; }
.gf-sources .back { font-size: 14px; font-weight: 600; }
.gf-sources h1 { font-size: clamp(2.1rem, 4vw, 3.3rem); line-height: 1.08; letter-spacing: -0.03em; margin: 18px 0 12px; }
.gf-sources h2 { font-size: 1.45rem; margin: 40px 0 12px; letter-spacing: -0.02em; }
.gf-sources h3 { font-size: 1.05rem; margin: 28px 0 10px; }
.gf-sources p, .gf-sources li { font-size: 16px; line-height: 1.6; max-width: 760px; }
.gf-sources a { color: #1a3352; }
.gf-sources a:hover { color: #061a33; }
.gf-sources hr { border: 0; border-top: 1px solid #e6ddd0; margin: 28px 0; }
.gf-sources .table-wrap { overflow-x: auto; margin: 12px 0 24px; }
.gf-sources table { width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.45; min-width: 640px; }
.gf-sources th, .gf-sources td { border-bottom: 1px solid #e6ddd0; text-align: left; vertical-align: top; padding: 10px 12px; }
.gf-sources th { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #1a3352; }
.gf-sources code { font-size: 0.92em; }
.gf-sources a { overflow-wrap: anywhere; }
`

export default function GlobalFundSourcesPage() {
  return (
    <ResearchSiteShell traceLi>
      <style dangerouslySetInnerHTML={{ __html: sourcesCss }} />
      <div className="gf-sources">
        <div className="sheet">
          <p className="back"><Link href="/research/global-fund">Back to the note</Link></p>
          {renderSources(sourcesMarkdown)}
        </div>
      </div>
    </ResearchSiteShell>
  )
}
