import Link from 'next/link'

import { ChecklistPreview } from '@/components/checklist-preview'
import { GlossaryText } from '@/components/glossary-text'
import { checklistRowDetail, groupChecklistFields } from '@/lib/case-card-presentation/checklist'
import type { GlossaryId } from '@/lib/case-card-presentation/glossary'
import { firstSentence, readerBoundary, readerFacingText } from '@/lib/case-card-presentation/reader-text'
import type { CaseCardExport } from '@/lib/field-registry/case-card'
import type { RegistryField } from '@/lib/field-registry/schema'

function fieldState(field: RegistryField) {
  if (field.value.state === 'missing') return 'Missing'
  if (field.value.state === 'negative') return 'Negative'
  return 'Present'
}

function storedFieldBody(field: RegistryField) {
  if (field.value.state === 'missing') return field.value.reason
  return String(field.value.value)
}

function Reader({ text, seen }: { text: string; seen: Set<GlossaryId> }) {
  return <GlossaryText text={readerFacingText(text)} seen={seen} />
}

function Stored({ text, seen }: { text: string; seen: Set<GlossaryId> }) {
  return <GlossaryText text={text} seen={seen} />
}

export function CaseCardView({ card }: { card: CaseCardExport }) {
  const seen = new Set<GlossaryId>()
  const snapshot = card.fixtureSnapshot ?? card.frozenRecord?.snapshot ?? null
  const awaiting = card.publicationState === 'awaiting_founder_freeze'
  const jsonHref = `/cases/${card.slug}.json`
  const packIds = card.packsInForce.map(pack => pack.packId)
  const groups = snapshot ? groupChecklistFields(snapshot.fields, packIds, card.patternTickets) : []
  const checklistNames = card.packsInForce.map(pack => pack.name).join('; ')
  const happened = firstSentence(card.narrative.officialRecord)
  const officialFinding = firstSentence(card.narrative.whatWasMissing)

  return (
    <article className="px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold leading-6 text-[#145246]">{card.statusLabel}</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          <GlossaryText text={card.title} seen={seen} />
        </h1>
        <p className="mt-4 text-base leading-7 text-[#52696a]">
          <Reader text={card.lede} seen={seen} />
        </p>

        <section className="mt-8" aria-labelledby="happened-heading">
          <h2 id="happened-heading" className="text-sm font-semibold text-[#145246]">What happened</h2>
          <p className="mt-2 text-lg leading-8 text-[#24343a]">
            <Reader text={happened} seen={seen} />
          </p>
        </section>

        <section className="mt-8" aria-labelledby="missing-heading">
          <h2 id="missing-heading" className="text-sm font-semibold text-[#145246]">What the source found</h2>
          <p className="mt-2 text-lg leading-8 text-[#24343a]">
            <Reader text={officialFinding} seen={seen} />
          </p>
        </section>

        {snapshot ? (
          <section className="mt-10" aria-labelledby="checklist-heading">
            <h2 id="checklist-heading" className="font-display text-3xl tracking-[-0.03em]">Checklist</h2>
            <p className="mt-3 text-base leading-7 text-[#24343a]">
              Checklist: <GlossaryText text={checklistNames} seen={seen} />
            </p>
            <div className="mt-6 space-y-8">
              {groups.filter(group => group.rows.length > 0).map(group => (
                <div key={group.id}>
                  <h3 className="text-lg font-semibold tracking-[-0.02em]">{group.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#617078]">{group.hint}</p>
                  <ChecklistPreview total={group.rows.length}>
                    {group.rows.map(row => (
                      <li key={row.fieldId} className="px-4 py-4 sm:px-5">
                        <p className="text-base font-semibold leading-6 text-[#071d39]">
                          <Reader text={row.title} seen={seen} />
                        </p>
                        {checklistRowDetail(group.id, row.quote) ? (
                          <p className="mt-2 text-sm leading-6 text-[#24343a]">
                            <Reader text={row.quote} seen={seen} />
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ChecklistPreview>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-10" aria-labelledby="boundary-heading">
          <h2 id="boundary-heading" className="text-sm font-semibold text-[#145246]">Boundary</h2>
          <p className="mt-2 text-base leading-7 text-[#52696a]">
            <GlossaryText text={readerBoundary(card.claimBoundary)} seen={seen} />
          </p>
        </section>

        <details id="check-this-record" className="mt-10 rounded-2xl border border-[#d8d5cc] bg-white">
          <summary className="cursor-pointer px-4 py-4 text-base font-semibold text-[#071d39] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f8876] sm:px-5">
            Check this record yourself
          </summary>
          <div className="space-y-8 border-t border-[#d8d5cc] px-4 py-5 sm:px-5">
            <p className="text-sm leading-6 text-[#24343a]">
              {card.snapshotHash && card.packsHash
                ? 'The snapshot hash and the packs hash let a reader recompute this record and confirm it has not changed.'
                : 'Hashes are not issued on this fixture. When a freeze exists, the snapshot hash and the packs hash let a reader recompute the record and confirm it has not changed.'}
            </p>
            <p className="text-sm leading-6">
              <Link href={jsonHref} className="font-semibold text-[#1f6f61] underline decoration-[#b7ddd4] underline-offset-4 hover:text-[#145246]">
                JSON export
              </Link>
            </p>

            <section aria-labelledby="record-summary-heading">
              <h3 id="record-summary-heading" className="text-sm font-semibold">Summary</h3>
              <p className="mt-2 text-sm leading-6 text-[#24343a]">
                <Stored text={card.lede} seen={seen} />
              </p>
              <p className="mt-3 text-sm leading-6 text-[#617078]">
                {card.statusLabel}. {card.product} {awaiting ? 'has not frozen this record. Hashes are not issued.' : 'verified this frozen record before showing hashes.'}
              </p>
            </section>

            <section aria-labelledby="record-official-heading">
              <h3 id="record-official-heading" className="text-sm font-semibold">What the source says</h3>
              <p className="mt-2 text-sm leading-6 text-[#24343a]">
                <Stored text={card.narrative.officialRecord} seen={seen} />
              </p>
            </section>

            <section aria-labelledby="record-missing-heading">
              <h3 id="record-missing-heading" className="text-sm font-semibold">What was missing</h3>
              <p className="mt-2 text-sm leading-6 text-[#24343a]">
                <Stored text={card.narrative.whatWasMissing} seen={seen} />
              </p>
            </section>

            <section aria-labelledby="record-findings-heading">
              <h3 id="record-findings-heading" className="text-sm font-semibold">Findings</h3>
              <ol className="mt-3 space-y-4">
                {card.findings.map((finding, index) => (
                  <li key={finding.findingId}>
                    <p className="text-sm font-semibold leading-6 text-[#071d39]">
                      {index + 1}. <Stored text={finding.title} seen={seen} />
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#24343a]">
                      <Stored text={finding.summary} seen={seen} />
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#748087]">
                      <Stored text={finding.sourceLabel} seen={seen} />
                    </p>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="record-followed-heading">
              <h3 id="record-followed-heading" className="text-sm font-semibold">What followed</h3>
              <p className="mt-2 text-sm leading-6 text-[#24343a]">
                <Stored text={card.narrative.whatFollowed} seen={seen} />
              </p>
            </section>

            <section aria-labelledby="record-question-heading">
              <h3 id="record-question-heading" className="text-sm font-semibold">The award-assurance question</h3>
              <p className="mt-2 text-sm leading-6 text-[#24343a]">
                <Stored text={card.narrative.assuranceQuestion} seen={seen} />
              </p>
              <h4 className="mt-4 text-sm font-semibold">Where Trace-li fits</h4>
              <p className="mt-2 text-sm leading-6 text-[#24343a]">
                <Stored text={card.narrative.whereTraceLiFits} seen={seen} />
              </p>
            </section>

            <section aria-labelledby="record-decision-heading">
              <h3 id="record-decision-heading" className="text-sm font-semibold">Readiness and disposition</h3>
              <p className="mt-2 text-sm leading-6 text-[#24343a]">
                <Stored text={card.readiness ?? 'Not issued'} seen={seen} />
              </p>
              <p className="mt-2 text-sm leading-6 text-[#617078]">
                <Stored text={card.readinessNote} seen={seen} />
              </p>
              <p className="mt-2 text-sm leading-6 text-[#24343a]">
                <Stored text={card.dispositionSummary} seen={seen} />
              </p>
              <p className="mt-2 text-sm leading-6 text-[#617078]">
                Checklist scope {card.packScope === 'finding-slice' ? 'finding slice. Not a full Grant Regulations judgment.' : 'full checklist. Judged against the packs in force.'}
                {' '}
                {card.packsStamped ? 'Stamped in force on the frozen record.' : 'Shown for shape. Not stamped in force.'}
                {' '}
                Schema {card.schemaVersion}.
              </p>
            </section>

            <section aria-labelledby="record-tickets-heading">
              <h3 id="record-tickets-heading" className="text-sm font-semibold">Pattern tickets</h3>
              <p className="mt-2 text-sm leading-6 text-[#617078]">Stable ids for later checklist and judgment changes. A stub is seeded here. It is not yet an accepted rule.</p>
              <ul className="mt-3 space-y-4">
                {card.patternTickets.map(ticket => (
                  <li key={ticket.ticketId} id={ticket.ticketId} className="scroll-mt-24">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2f8876]">{ticket.status}</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#071d39]">
                      <Stored text={ticket.title} seen={seen} />
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-[#145246]">{ticket.ticketId}</p>
                    <p className="mt-2 text-sm leading-6 text-[#24343a]">
                      <Stored text={ticket.statement} seen={seen} />
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#748087]">
                      Pack {ticket.packId}
                      {ticket.ruleId ? ` · rule ${ticket.ruleId}` : ' · no pack rule yet'}
                      {ticket.fieldKey ? ` · ${ticket.fieldKey}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="record-sources-heading">
              <h3 id="record-sources-heading" className="text-sm font-semibold">Primary sources</h3>
              <ul className="mt-3 space-y-4">
                {card.primarySources.map(source => (
                  <li key={source.sourceId}>
                    <p className="text-xs leading-5 text-[#748087]">
                      <Stored text={source.publisher} seen={seen} /> · {source.publishedOn}
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6">
                      <a href={source.url} className="underline decoration-[#b7ddd4] underline-offset-4 hover:text-[#145246]" rel="noreferrer">{source.title}</a>
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#52696a]">
                      <Stored text={source.locator} seen={seen} />
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm font-semibold">Public source file</p>
              <p className="mt-1 text-sm leading-6 text-[#52696a]">{card.primarySourceFile.label}</p>
              <p className="mt-2 break-all font-mono text-xs leading-5 text-[#145246]">{card.primarySourceFile.sha256}</p>
            </section>

            <section aria-labelledby="record-redaction-heading">
              <h3 id="record-redaction-heading" className="text-sm font-semibold">Redaction</h3>
              <div className="mt-3 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold">Public</h4>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[#52696a]">
                    {card.redaction.public.map(item => <li key={item}><Stored text={item} seen={seen} /></li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Withheld</h4>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[#52696a]">
                    {card.redaction.withheld.map(item => <li key={item}><Stored text={item} seen={seen} /></li>)}
                  </ul>
                </div>
              </div>
            </section>

            {snapshot ? (
              <section aria-labelledby="record-hashes-heading">
                <h3 id="record-hashes-heading" className="text-sm font-semibold">Hashes and registry fields</h3>
                <dl className="mt-3 space-y-3">
                  <Technical term="Snapshot hash" value={card.snapshotHash ?? 'Not issued'} />
                  <Technical term="Packs hash" value={card.packsHash ?? 'Not issued'} />
                  <Technical term="Hash method" value={card.hashMethod ?? 'Not issued'} />
                  <Technical term="Frozen record id" value={card.frozenRecordId ?? 'Not assigned'} />
                  <Technical term="Case id" value={card.caseId} />
                  {card.frozenRecord ? <Technical term="Supersedes record id" value={card.frozenRecord.supersedesRecordId ?? 'None'} /> : null}
                  <Technical term="Organization id" value={snapshot.organizationId} />
                  <Technical term="Project id" value={snapshot.projectId} />
                  <Technical term="Award id" value={snapshot.awardId} />
                </dl>
                <p className="mt-3 text-sm leading-6 text-[#617078]">{card.hashNote}</p>
                <h4 className="mt-4 text-sm font-semibold">Pack ids</h4>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-[#24343a]">
                  {card.packsInForce.map(pack => (
                    <li key={`${pack.packId}-${pack.version}`} className="break-all font-mono text-xs text-[#145246]">
                      {pack.name} · {pack.packId} · {pack.version}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm leading-6 text-[#617078]">
                  Classification {snapshot.classification}. Reference {snapshot.procurementReference}. Donor {snapshot.donor.name}. Each value is present, missing, or negative. {awaiting ? 'Verification on this fixture is unverified until a founder freeze.' : 'This snapshot is the one inside the founder desk freeze.'}
                </p>
                <ul className="mt-3 divide-y divide-[#d8d5cc] overflow-hidden rounded-2xl border border-[#d8d5cc]">
                  {snapshot.fields.map(field => (
                    <li key={field.fieldId} className="px-4 py-4">
                      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
                        <code className="min-w-0 break-all text-sm text-[#145246]">{field.key}</code>
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#748087]">{fieldState(field)}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#24343a]">{storedFieldBody(field)}</p>
                      <p className="mt-2 text-xs leading-5 text-[#748087]">
                        {field.provenance.sourceRef.label ?? field.provenance.sourceRef.id} · {field.provenance.verificationMethod}
                      </p>
                      <p className="mt-1 break-all text-xs leading-5 text-[#748087]">
                        Field id {field.fieldId} · entity {field.entityKind} {field.entityId} · source {field.provenance.sourceRef.kind} {field.provenance.sourceRef.id} · confidence {field.provenance.confidence} · source file {field.provenance.sourceFileHash}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </details>
      </div>
    </article>
  )
}

function Technical({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#748087]">{term}</dt>
      <dd className="mt-1 break-all font-mono text-xs leading-5 text-[#071d39]">{value}</dd>
    </div>
  )
}
