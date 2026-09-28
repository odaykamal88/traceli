import Link from 'next/link'
import { deskTenderHref } from '@/lib/hub/desk-continuity'
import type { DeskTenderContext } from '@/lib/hub/library'

import s from '../desk/desk.module.css'

const steps = [
  { id: 'hub', label: 'Knowledge hub', href: '/hub' },
  { id: 'tender', label: 'New tender', href: '/hub/tender' },
  { id: 'desk', label: 'Award desk', href: '/desk' },
  { id: 'freeze', label: 'Golden thread' },
] as const

export function HubPath({ current, tender }: { current: 'hub' | 'tender' | 'desk' | 'freeze', tender?: DeskTenderContext | null }) {
  return (
    <ol className={s.path} aria-label="Path">
      {steps.map(step => {
        const here = step.id === current
        const label = step.id === 'tender' && tender ? tender.name : step.label
        const linked = 'href' in step && !here && !(step.id === 'tender' && tender)
        return (
          <li key={step.id} aria-current={here ? 'step' : undefined}>
            {linked && 'href' in step ? <Link href={step.id === 'desk' && tender ? deskTenderHref(tender) : step.href}>{label}</Link> : label}
          </li>
        )
      })}
    </ol>
  )
}
