import type { CaseCardDraft } from '@/lib/field-registry/case-card'
import type { RegistryField } from '@/lib/field-registry/schema'

import { patternTicketsFor } from '@/lib/case-cards/pattern-tickets'
import { sourceField } from '@/lib/case-cards/public-source-field'

type ResearchField = {
  key: string
  value: RegistryField['value']
  locator: string
}

type ResearchFixture = Omit<CaseCardDraft, 'fixtureSnapshot' | 'frozenRecord' | 'patternTickets'> & {
  frameworkId: string
  frameworkName: string
  donor: { donorId: string; name: string }
  retrievedAt: string
  fields: ResearchField[]
}

/** Proposed review questions only: no institutional rule pack or desk judgment is asserted. */
export function researchFixture(input: ResearchFixture): CaseCardDraft {
  const { frameworkId, frameworkName, donor, retrievedAt, fields, ...draft } = input
  return {
    ...draft,
    patternTickets: patternTicketsFor(draft.patternTicketIds),
    fixtureSnapshot: {
      schemaVersion: 'award-registry-snapshot-v1',
      registryVersion: 1,
      classification: 'public-source',
      organizationId: 'org:public-case-cards',
      projectId: `project:${draft.slug}`,
      awardId: `research:${draft.slug}`,
      procurementReference: draft.slug,
      donor,
      framework: { frameworkId, name: frameworkName, version: 'research-2026-10-08' },
      asOf: retrievedAt,
      fields: fields.map(field => sourceField(
        `field:${draft.slug}:${field.key}`,
        `evidence:${draft.slug}:${field.key}`,
        field.key,
        field.value,
        draft.primarySourceFile.sha256,
        retrievedAt,
        `source:${draft.slug}:${field.key}`,
        field.locator,
      )),
    },
    frozenRecord: null,
  }
}
