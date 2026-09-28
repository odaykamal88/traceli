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
  description: 'Explore public-control pack references for Trace-li tender reviews.',
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
            ? 'Explore the public-control packs available for your tenders. Each tender uses one pinned pack version.'
            : 'This workspace saves tender names and desk work in this browser only. Choose a seeded pack, then start a browser tender.'}</p>
          {!durable ? <HubPath current="hub" /> : null}
        </header>
        {!durable ? <p className={s.actions}>
          <Link className={s.primary} href="/hub/tender">Start a tender</Link>
        </p> : null}
        {!durable ? <SavedTenders key={gate.viewer.organizationId} organizationId={gate.viewer.organizationId} packNames={Object.fromEntries(seeds.map(seed => [seed.packId, seed.name]))} durable={durable} /> : null}
        <section className={s.section} aria-labelledby="seeded-sources">
          <h2 id="seeded-sources">{durable ? "Trace-li pack library" : "Start from a Trace-li pack"}</h2>
          <p className={s.help}>{hubSynthesisNote} {durable ? "One pack drives each tender assessment." : "One pack drives the freeze."}</p>
          <div className={s.sourceGrid} data-testid="hub-seeds">
            {seeds.map(seed => (
              <article key={seed.packId} className={s.sourceCard}>
                <p className={s.tagQuiet}>Public-control synthesis</p>
                <h3>{seed.name}</h3>
                <p>{seed.summary}</p>
                <p className={s.help}>Version {seed.version}. {seed.ruleCount} deterministic checks.</p>
                {!durable || ["Procurement Officer", "Procurement Director", "Workspace Admin"].includes(gate.viewer.role) ? <p className={s.sourceAction}>
                  <Link className={s.secondary} href={durable ? `/work/new?pack=${encodeURIComponent(seed.packId)}` : `/desk?pack=${seed.packId}`} aria-label={durable ? `Start a tender with ${seed.name}` : undefined}>{durable ? 'Start a tender' : 'Open on the award desk'}</Link>
                </p> : null}
              </article>
            ))}
          </div>
        </section>
        {durable ? <p className={s.help}>Optional manuals can be recorded against a tender after you open it. File bytes are discarded after verification.</p> : <HubUploads organizationId={gate.viewer.organizationId} />}
      </div>
    </DeskShell>
  )
}
