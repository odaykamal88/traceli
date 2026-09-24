import Link from 'next/link'

import s from '../desk/desk.module.css'

const steps = [
  { id: 'hub', label: 'Knowledge hub', href: '/hub' },
  { id: 'tender', label: 'New tender', href: '/hub/tender' },
  { id: 'desk', label: 'Award desk', href: '/desk' },
  { id: 'freeze', label: 'Freeze' },
] as const

export function HubPath({ current }: { current: 'hub' | 'tender' | 'desk' }) {
  return (
    <ol className={s.path} aria-label="Path">
      {steps.map(step => {
        const here = step.id === current
        return (
          <li key={step.id} aria-current={here ? 'step' : undefined}>
            {'href' in step && !here ? <Link href={step.href}>{step.label}</Link> : step.label}
          </li>
        )
      })}
    </ol>
  )
}
