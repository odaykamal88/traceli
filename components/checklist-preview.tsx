'use client'

import { Children, cloneElement, isValidElement, useId, useState, type ReactElement, type ReactNode } from 'react'

import { CHECKLIST_PREVIEW_LIMIT } from '@/lib/case-card-presentation/preview-limit'

/**
 * Shows the first few checklist rows. “Show all (n)” reveals the rest.
 * Collapsed rows stay in the DOM with the hidden attribute so a printed page
 * can still include them.
 */
export function ChecklistPreview({ total, children }: { total: number; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const listId = useId()
  const items = Children.toArray(children)
  const expandable = total > CHECKLIST_PREVIEW_LIMIT

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-[#d8d5cc] bg-white">
      <ul id={listId} className="divide-y divide-[#d8d5cc]">
        {items.map((item, index) => {
          if (!expandable || index < CHECKLIST_PREVIEW_LIMIT) return item
          if (!isValidElement(item)) return item
          const element = item as ReactElement<{ className?: string; hidden?: boolean }>
          return cloneElement(element, {
            hidden: open ? undefined : true,
            className: [element.props.className, 'checklist-more'].filter(Boolean).join(' '),
          })
        })}
      </ul>
      {expandable ? (
        <button
          type="button"
          className="checklist-toggle flex min-h-11 w-full items-center border-t border-[#d8d5cc] px-4 text-left text-sm font-semibold text-[#1f6f61] hover:bg-[#f7f3eb] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2f8876] sm:px-5"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen(value => !value)}
        >
          {open ? 'Show fewer' : `Show all (${total})`}
        </button>
      ) : null}
    </div>
  )
}
