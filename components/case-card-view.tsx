import Link from 'next/link'

import type { CaseCardExport } from '@/lib/field-registry/case-card'
import type { RegistryField } from '@/lib/field-registry/schema'

function shortHash(hash: string | null) {
  if (!hash) return 'Not issued'
  return `${hash.slice(0, 12)}…${hash.slice(-6)}`
}

function fieldState(field: RegistryField) {
  if (field.value.state === 'missing') return 'Missing'
  if (field.value.state === 'negative') return 'Negative'
  return 'Present'
}

function fieldBody(field: RegistryField) {
  if (field.value.state === 'missing') return field.value.reason
  return String(field.value.value)
}

export function CaseCardView({ card }: { card: CaseCardExport }) {
  const snapshot = card.fixtureSnapshot ?? card.frozenRecord?.snapshot ?? null
  const awaiting = card.publicationState === 'awaiting_founder_freeze'
  const jsonHref = `/cases/${card.slug}.json`

  return (
    <article className="px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-[1100px]">
        <p role="note" className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${awaiting ? 'border-[#e0c48a] bg-[#f8efd8] text-[#5c4314]' : 'border-[#b7ddd4] bg-[#e7f6f1] text-[#145246]'}`}>
          {card.statusLabel}. {card.product} {awaiting ? 'has not frozen this record. Hashes below are not issued.' : 'verified this frozen record before showing hashes.'}
        </p>

        <header className="mt-8 max-w-3xl">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2f8876]">Trace-li case card · {card.caseId}</p>
          <h1 className="mt-4 font-display text-4xl leading-[1.02] tracking-[-0.03em] sm:text-6xl">{card.title}</h1>
          <p className="mt-5 text-lg leading-8 text-[#52696a]">{card.lede}</p>
        </header>

        <dl className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-[#d8d5cc] bg-[#d8d5cc] sm:grid-cols-2">
          <Fact term="Pack" value={card.packsInForce.map(pack => `${pack.name} (${pack.packId} ${pack.version})`).join('; ')} note={card.packsStamped ? 'Stamped in force on the frozen record.' : 'Shown for shape. Not stamped in force.'} />
          <Fact term="Pack scope" value={card.packScope === 'finding-slice' ? 'Finding slice' : 'Full pack'} note={card.packScope === 'finding-slice' ? 'Not a full Grant Regulations judgment.' : 'Judged against the packs in force.'} />
          <Fact term="Readiness" value={card.readiness ?? 'Not issued'} note={card.readinessNote} />
          <Fact term="Disposition" value={card.frozenRecord ? card.frozenRecord.disposition.decision : 'Not recorded'} note={card.dispositionSummary} />
          <Fact term="Frozen record id" value={card.frozenRecordId ?? 'Not assigned'} />
          <Fact term="Snapshot hash" value={shortHash(card.snapshotHash)} note={card.snapshotHash ?? undefined} mono />
          <Fact term="Packs hash" value={shortHash(card.packsHash)} note={card.packsHash ?? undefined} mono />
        </dl>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#617078]">{card.hashNote}</p>

        <section className="mt-14 max-w-3xl" aria-labelledby="official-record-heading">
          <h2 id="official-record-heading" className="font-display text-3xl tracking-[-0.03em]">What the official record says</h2>
          <p className="mt-4 text-base leading-7 text-[#24343a]">{card.narrative.officialRecord}</p>
        </section>

        <section className="mt-10 max-w-3xl" aria-labelledby="missing-heading">
          <h2 id="missing-heading" className="font-display text-3xl tracking-[-0.03em]">What was missing</h2>
          <p className="mt-4 text-base leading-7 text-[#24343a]">{card.narrative.whatWasMissing}</p>
          <ol className="mt-6 space-y-4">
            {card.findings.map((finding, index) => (
              <li key={finding.findingId} className="rounded-2xl border border-[#d8d5cc] bg-white p-5">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2f8876]">Finding {index + 1} · {finding.sourceLabel}</p>
                <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em]">{finding.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#52696a]">{finding.summary}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 max-w-3xl" aria-labelledby="followed-heading">
          <h2 id="followed-heading" className="font-display text-3xl tracking-[-0.03em]">What followed</h2>
          <p className="mt-4 text-base leading-7 text-[#24343a]">{card.narrative.whatFollowed}</p>
        </section>

        <section className="mt-10 max-w-3xl" aria-labelledby="question-heading">
          <h2 id="question-heading" className="font-display text-3xl tracking-[-0.03em]">The award-assurance question</h2>
          <p className="mt-4 text-base leading-7 text-[#24343a]">{card.narrative.assuranceQuestion}</p>
          <h3 className="mt-8 text-lg font-semibold">Where Trace-li fits</h3>
          <p className="mt-3 text-base leading-7 text-[#24343a]">{card.narrative.whereTraceLiFits}</p>
        </section>

        {snapshot ? (
          <section className="mt-14" aria-labelledby="registry-heading">
            <h2 id="registry-heading" className="font-display text-3xl tracking-[-0.03em]">Registry snapshot</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#617078]">
              Classification {snapshot.classification}. Reference {snapshot.procurementReference}. Donor {snapshot.donor.name}. Each value is present, missing, or negative. {awaiting ? 'Verification on this fixture is unverified until a founder freeze.' : 'This snapshot is the one inside the founder desk freeze.'}
            </p>
            <ul className="mt-6 divide-y divide-[#d8d5cc] overflow-hidden rounded-2xl border border-[#d8d5cc] bg-white">
              {snapshot.fields.map(field => (
                <li key={field.fieldId} className="px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <code className="text-sm text-[#145246]">{field.key}</code>
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#748087]">{fieldState(field)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#24343a]">{fieldBody(field)}</p>
                  <p className="mt-2 text-xs leading-5 text-[#748087]">{field.provenance.sourceRef.label ?? field.provenance.sourceRef.id} · {field.provenance.verificationMethod}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-14" aria-labelledby="tickets-heading">
          <h2 id="tickets-heading" className="font-display text-3xl tracking-[-0.03em]">Pattern tickets</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#617078]">Stable ids for later pack and judgment changes. A stub is seeded here. It is not yet an accepted rule.</p>
          <ul className="mt-6 space-y-4">
            {card.patternTickets.map(ticket => (
              <li key={ticket.ticketId} id={ticket.ticketId} className="scroll-mt-24 rounded-2xl border border-[#d8d5cc] bg-white p-5">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2f8876]">{ticket.status}</p>
                <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em]">{ticket.title}</h3>
                <p className="mt-2 break-all font-mono text-xs text-[#145246]">{ticket.ticketId}</p>
                <p className="mt-3 text-sm leading-6 text-[#52696a]">{ticket.statement}</p>
                <p className="mt-3 text-xs leading-5 text-[#748087]">
                  Pack {ticket.packId}
                  {ticket.ruleId ? ` · rule ${ticket.ruleId}` : ' · no pack rule yet'}
                  {ticket.fieldKey ? ` · ${ticket.fieldKey}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14" aria-labelledby="sources-heading">
          <h2 id="sources-heading" className="font-display text-3xl tracking-[-0.03em]">Primary sources</h2>
          <ul className="mt-6 space-y-4">
            {card.primarySources.map(source => (
              <li key={source.sourceId} className="rounded-2xl border border-[#d8d5cc] bg-white p-5">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#748087]">{source.publisher} · {source.publishedOn}</p>
                <h3 className="mt-2 text-lg font-semibold">
                  <a href={source.url} className="underline decoration-[#b7ddd4] underline-offset-4 hover:text-[#145246]" rel="noreferrer">{source.title}</a>
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#52696a]">{source.locator}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-2xl border border-[#d8d5cc] bg-white p-5">
            <p className="text-sm font-semibold">Public source file</p>
            <p className="mt-2 text-sm leading-6 text-[#52696a]">{card.primarySourceFile.label}</p>
            <p className="mt-3 break-all font-mono text-xs leading-5 text-[#145246]">{card.primarySourceFile.sha256}</p>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="redaction-heading">
          <h2 id="redaction-heading" className="font-display text-3xl tracking-[-0.03em]">Redaction</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#d8d5cc] bg-white p-5">
              <h3 className="text-sm font-semibold">Public</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#52696a]">
                {card.redaction.public.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-[#d8d5cc] bg-white p-5">
              <h3 className="text-sm font-semibold">Withheld</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#52696a]">
                {card.redaction.withheld.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-14 rounded-2xl border border-[#d8d5cc] bg-[#eef2ed] p-5 sm:p-6" aria-labelledby="boundary-heading">
          <h2 id="boundary-heading" className="text-lg font-semibold">Boundary</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#52696a]">{card.claimBoundary}</p>
          <p className="mt-4 text-sm leading-6">
            <Link href={jsonHref} className="font-semibold text-[#1f6f61] underline decoration-[#b7ddd4] underline-offset-4 hover:text-[#145246]">JSON export</Link>
            <span className="text-[#748087]"> · same facts as this page · schema {card.schemaVersion}</span>
          </p>
        </section>
      </div>
    </article>
  )
}

function Fact({ term, value, note, mono = false }: { term: string; value: string; note?: string; mono?: boolean }) {
  return (
    <div className="bg-white p-4 sm:p-5">
      <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#748087]">{term}</dt>
      <dd className={`mt-2 text-sm leading-6 text-[#071d39] ${mono ? 'break-all font-mono' : ''}`} title={note}>{value}</dd>
      {note && note !== value ? <p className="mt-2 text-xs leading-5 text-[#617078]">{note}</p> : null}
    </div>
  )
}
