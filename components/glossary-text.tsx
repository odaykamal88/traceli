import { Fragment } from 'react'

import { Acronym } from '@/components/acronym'
import { splitGlossary } from '@/lib/case-card-presentation/glossary'

export function GlossaryText({ text }: { text: string }) {
  const parts = splitGlossary(text)
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
