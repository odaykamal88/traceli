'use client'

import { useId, useRef } from 'react'

import { glossaryById, type GlossaryId } from '@/lib/case-card-presentation/glossary'

/**
 * Inline abbreviation. Keyboard focus and a tap move focus here; hover, focus,
 * and that tap show the same sentence. The title is the screen-reader expansion,
 * and aria-describedby points at the visible tooltip.
 */
function placeTooltip(anchor: HTMLElement, tip: HTMLElement) {
  const box = anchor.getBoundingClientRect()
  const width = Math.min(288, window.innerWidth - 32)
  let left = box.left + box.width / 2 - width / 2
  left = Math.max(16, Math.min(left, window.innerWidth - width - 16))
  tip.style.position = 'fixed'
  tip.style.width = `${width}px`
  tip.style.left = `${left}px`
  tip.style.top = `${Math.min(box.bottom + 8, window.innerHeight - 16)}px`
}

export function Acronym({ id, children }: { id: GlossaryId; children: string }) {
  const entry = glossaryById[id]
  const tipId = useId()
  const tipRef = useRef<HTMLSpanElement>(null)

  function place(target: HTMLElement) {
    if (tipRef.current) placeTooltip(target, tipRef.current)
  }

  return (
    <span className="glossary-wrap">
      <abbr
        title={entry.definition}
        tabIndex={0}
        aria-describedby={tipId}
        onClick={event => {
          event.preventDefault()
          place(event.currentTarget)
        }}
        onMouseEnter={event => place(event.currentTarget)}
        onFocus={event => place(event.currentTarget)}
        onKeyDown={event => {
          if (event.key !== 'Escape') return
          event.currentTarget.blur()
        }}
        className="glossary-term"
      >
        {children}
      </abbr>
      <span ref={tipRef} id={tipId} role="tooltip" className="glossary-tip">
        {entry.definition}
      </span>
    </span>
  )
}
