import { Fragment } from 'react'

import { Acronym } from '@/components/acronym'
import { takeGlossaryTerms, type GlossaryId } from '@/lib/case-card-presentation/glossary'

export function GlossaryText({ text, seen }: { text: string; seen: Set<GlossaryId> }) {
  const parts = takeGlossaryTerms(text, seen)
  return parts.map((part, index) =>
    part.type === 'text' ? (
      <Fragment key={index}>{part.text}</Fragment>
    ) : (
      <Acronym key={`${part.id}-${index}`} id={part.id}>
        {part.surface}
      </Acronym>
    ),
  )
}
