import 'server-only'

import { publishCaseCard, type CaseCardExport } from '@/lib/field-registry/case-card'

import { gfOig25005Draft } from '@/lib/case-cards/gf-oig-25-005'

const cards: readonly CaseCardExport[] = [publishCaseCard(gfOig25005Draft())]

const bySlug = new Map(cards.map(card => [card.slug, card]))

export function listCaseCards(): readonly CaseCardExport[] {
  return cards
}

export function getCaseCard(slug: string): CaseCardExport | undefined {
  return bySlug.get(slug)
}

export function listCaseCardSlugs(): string[] {
  return cards.map(card => card.slug)
}
