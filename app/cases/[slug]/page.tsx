import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CaseCardShell } from '@/components/case-card-shell'
import { CaseCardView } from '@/components/case-card-view'
import { getCaseCard, listCaseCardSlugs } from '@/lib/case-cards/catalog'
import { caseCardSocialMetadata } from '@/lib/case-cards/social'

type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return listCaseCardSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const card = getCaseCard(slug)
  if (!card) {
    return { title: { absolute: 'Case card not found — Trace-li' }, robots: { index: false, follow: false } }
  }
  const social = caseCardSocialMetadata(card)
  return {
    title: { absolute: social.title },
    description: card.lede,
    alternates: { canonical: social.url },
    robots: social.robots,
    openGraph: social.openGraph,
    twitter: social.twitter,
  }
}

export default async function CaseCardPage({ params }: PageProps) {
  const { slug } = await params
  const card = getCaseCard(slug)
  if (!card) notFound()
  return (
    <CaseCardShell>
      <CaseCardView card={card} />
    </CaseCardShell>
  )
}
