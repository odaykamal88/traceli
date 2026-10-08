import 'server-only'

import { publishCaseCard, type CaseCardExport } from '@/lib/field-registry/case-card'

import { gfOig25005Draft } from '@/lib/case-cards/gf-oig-25-005'
import { oios2020005Draft } from '@/lib/case-cards/oios-2020-005-iraq-forensic'
import { oios2025098Draft } from '@/lib/case-cards/oios-2025-098-cbpf-reserve'
import { unfpaAnnex413Draft } from '@/lib/case-cards/unfpa-annex4-13-esa-ip'
import { unfpaAnnex421Draft } from '@/lib/case-cards/unfpa-annex4-21-arab-vendor'
import { unfpaSudanDraft } from '@/lib/case-cards/unfpa-ia-2025-29-sudan'
import { ifrcEbolaDraft } from '@/lib/case-cards/ifrc-ebola-supplier-payments'
import { hrwSyriaDraft } from '@/lib/case-cards/hrw-sldp-syria-procurement'
import { ircSyriaDraft } from '@/lib/case-cards/irc-syria-procurement-settlement'

const cards: readonly CaseCardExport[] = [
  publishCaseCard(gfOig25005Draft()),
  publishCaseCard(unfpaAnnex413Draft()),
  publishCaseCard(unfpaAnnex421Draft()),
  publishCaseCard(unfpaSudanDraft()),
  publishCaseCard(oios2025098Draft()),
  publishCaseCard(oios2020005Draft()),
  publishCaseCard(ifrcEbolaDraft()),
  publishCaseCard(hrwSyriaDraft()),
  publishCaseCard(ircSyriaDraft()),
]

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
