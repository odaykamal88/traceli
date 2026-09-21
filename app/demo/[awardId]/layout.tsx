import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { awardDeskScenario, awardDeskSlug } from '@/lib/award-desk'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ awardId: awardDeskSlug }]
}

export const metadata: Metadata = {
  title: `${awardDeskScenario.title} · Award desk`,
  description: 'Fictional overnight agent prep and a named evidence gap for a humanitarian logistics award.',
  robots: { index: false, follow: true },
}

export default async function AwardLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ awardId: string }>
}) {
  const { awardId } = await params
  if (awardId !== awardDeskSlug) notFound()
  return children
}
