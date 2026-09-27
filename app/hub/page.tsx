import type { Metadata } from 'next'
import Link from 'next/link'

import { DeskAccessRequired, DeskShell, DeskUnavailable } from '@/app/desk/shell'
import { openSignedInDesk } from '@/lib/desk/gate'
import { listDonorPacks } from '@/lib/field-registry/packs'
import { hubSeedSources, hubSynthesisNote } from '@/lib/hub/library'
import { tenderWorkspacesEnabled } from '@/lib/tenders/config'

import s from '../desk/desk.module.css'
import HubUploads from './hub-uploads'
import { HubPath } from './path'
import SavedTenders from './saved-tenders'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Knowledge hub',
  description: 'Choose a Trace-li seeded pack, name one tender, and freeze a citeable golden thread.',
  robots: { index: false, follow: false },
}

export default async function HubPage() {
  const gate = await openSignedInDesk()
  if (gate.status === 'unavailable') return <DeskUnavailable />
  if (gate.status === 'denied') return <DeskAccessRequired />
  const durable = tenderWorkspacesEnabled()

  const seeds = listDonorPacks().map(pack => ({
    packId: pack.packId,
    name: pack.name,
    version: pack.version,
    summary: hubSeedSources[pack.packId].summary,
    ruleCount: pack.rules.length,
  }))

  return (
    <DeskShell
      viewer={{ name: gate.viewer.name, role: gate.viewer.role, organizationId: gate.viewer.organizationId }}
      showSignOut={gate.viewer.mode === 'workos'}
      current="hub"
      durable={durable}
    >
      <div className={s.page}>
        <header className={s.intro}>
          <p className={s.eyebrow}>Before the award</p>
          <h1>Knowledge hub</h1>
          <p className={s.lede}>{durable
            ? 'Start or resume a tender. Choose the public-control pack that will judge its packet, then review and save the checklist before issuing a record.'
            : 'This workspace saves tender names and desk work in this browser only. Choose a seeded pack, then start a browser tender.'}</p>
          <HubPath current="hub" />
        </header>
        <p className={s.actions}>
          <Link className={s.primary} href="/hub/tender">Start a tender</Link>
        </p>
        <SavedTenders key={gate.viewer.organizationId} organizationId={gate.viewer.organizationId} packNames={Object.fromEntries(seeds.map(seed => [seed.packId, seed.name]))} durable={durable} />
        <section className={s.section} aria-labelledby="seeded-sources">
          <h2 id="seeded-sources">Start from a Trace-li pack</h2>
          <p className={s.help}>{hubSynthesisNote} One pack drives the freeze.</p>
          <div className={s.sourceGrid} data-testid="hub-seeds">
            {seeds.map(seed => (
              <article key={seed.packId} className={s.sourceCard}>
                <p className={s.tagQuiet}>Public-control synthesis</p>
                <h3>{seed.name}</h3>
                <p>{seed.summary}</p>
                <p className={s.help}>Version {seed.version}. {seed.ruleCount} deterministic checks.</p>
                <p className={s.sourceAction}>
                  <Link className={s.secondary} href={durable ? '/hub/tender' : `/desk?pack=${seed.packId}`}>{durable ? 'Start a tender' : 'Open on the award desk'}</Link>
                </p>
              </article>
            ))}
          </div>
        </section>
        {durable ? <p className={s.help}>Optional manuals can be recorded against a tender after you open it. File bytes are discarded after verification.</p> : <HubUploads organizationId={gate.viewer.organizationId} />}
      </div>
    </DeskShell>
  )
}
