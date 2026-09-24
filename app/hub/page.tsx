import type { Metadata } from 'next'
import Link from 'next/link'

import { DeskAccessRequired, DeskShell, DeskUnavailable } from '@/app/desk/shell'
import { openSignedInDesk } from '@/lib/desk/gate'
import { listDonorPacks } from '@/lib/field-registry/packs'
import { hubSeedSources, hubSynthesisNote } from '@/lib/hub/library'

import s from '../desk/desk.module.css'
import HubUploads from './hub-uploads'
import { HubPath } from './path'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Knowledge hub',
  description: 'Seeded Trace-li control sources and organisation manuals for a tender.',
  robots: { index: false, follow: false },
}

export default async function HubPage() {
  const gate = await openSignedInDesk()
  if (gate.status === 'unavailable') return <DeskUnavailable />
  if (gate.status === 'denied') return <DeskAccessRequired />

  const seeds = listDonorPacks().map(pack => ({
    packId: pack.packId,
    name: pack.name,
    version: pack.version,
    summary: hubSeedSources[pack.packId].summary,
    ruleCount: pack.rules.length,
  }))

  return (
    <DeskShell
      viewer={{ name: gate.viewer.name, role: gate.viewer.role }}
      showSignOut={gate.viewer.mode === 'workos'}
      current="hub"
    >
      <div className={s.page}>
        <header className={s.intro}>
          <p className={s.eyebrow}>Control sources</p>
          <h1>Knowledge hub</h1>
          <p className={s.lede}>
            A library of control sources, separate from any one tender. Pick a seeded pack, attach your manuals if you have them, then freeze the award on the desk. Humans dispose; Trace-li freezes the proof.
          </p>
          <HubPath current="hub" />
        </header>
        <p className={s.actions}>
          <Link className={s.primary} href="/hub/tender">Start a tender</Link>
        </p>
        <section className={s.section} aria-labelledby="seeded-sources">
          <h2 id="seeded-sources">Seeded packs</h2>
          <p className={s.help}>{hubSynthesisNote} One seeded pack drives a freeze.</p>
          <div className={s.sourceGrid} data-testid="hub-seeds">
            {seeds.map(seed => (
              <article key={seed.packId} className={s.sourceCard}>
                <p className={s.tagQuiet}>Public-control synthesis</p>
                <h3>{seed.name}</h3>
                <p>{seed.summary}</p>
                <p className={s.help}>Version {seed.version}. {seed.ruleCount} deterministic checks.</p>
                <p className={s.sourceAction}>
                  <Link className={s.secondary} href={`/desk?pack=${seed.packId}`}>Open on the award desk</Link>
                </p>
              </article>
            ))}
          </div>
        </section>
        <HubUploads organizationId={gate.viewer.organizationId} />
      </div>
    </DeskShell>
  )
}
