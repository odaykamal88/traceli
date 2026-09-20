'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { scenarioOptions, decisionActions, type TraceScenario, type TraceOutcome, type DateFact, type ExportMode } from '@/lib/trace/contract'
import type { TraceRecord } from '@/lib/trace/store'
import s from './trace.module.css'

const outcomeLabels: Record<TraceOutcome, string> = {
  satisfied: 'Evidence supports this requirement', not_satisfied: 'Requirement not met in this record',
  unknown: 'More evidence needed', not_applicable: 'Does not apply to this decision', conflict: 'Rule or evidence conflict',
}
const actionLabels = {
  accept_assessment: 'Accept this scoped assessment', request_evidence: 'Request evidence',
  request_rule_review: 'Request rule review', override_assessment: 'Record an override', decline_decision: 'Decline to decide',
}
type DecisionAction = typeof decisionActions[number]
type Grant = { id: string; unitId: string; mode: ExportMode; expiresAt: string }
function dateLabel(date: DateFact) { return date.value || `Unknown — ${date.unknownReason}` }
function timeLabel(value: string) { return new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) }

async function request<T>(path: string, command?: { operation: string; input: unknown }): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, command ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(command) } : { cache: 'no-store' })
  } catch { throw new Error('Connection interrupted. Try this action again; your draft has been kept.') }
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error || 'This request is unavailable. Try reloading the record.')
  return payload as T
}

export default function TraceWorkbench({ role, local }: { role: string; local: boolean }) {
  const [records, setRecords] = useState<TraceRecord[]>([])
  const [record, setRecord] = useState<TraceRecord | null>(null)
  const [scenario, setScenario] = useState<TraceScenario>('missing')
  const [action, setAction] = useState<DecisionAction>('request_evidence')
  const [rationale, setRationale] = useState('')
  const [authority, setAuthority] = useState(false)
  const [mode, setMode] = useState<ExportMode>('redacted')
  const [grant, setGrant] = useState<Grant | null>(null)
  const [busy, setBusy] = useState('Loading records…')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const resultRef = useRef<HTMLElement>(null)
  const pendingCommands = useRef(new Map<string, string>())
  const mayReview = ['Procurement Officer', 'Procurement Director', 'Workspace Admin'].includes(role)
  const mayOverride = ['Procurement Director', 'Workspace Admin'].includes(role)

  async function mutate<T>(operation: string, input: Record<string, unknown>): Promise<T> {
    const fingerprint = JSON.stringify({ operation, input })
    const idempotencyKey = pendingCommands.current.get(fingerprint) || crypto.randomUUID()
    pendingCommands.current.set(fingerprint, idempotencyKey)
    const result = await request<T>('/api/trace', { operation, input: { ...input, idempotencyKey } })
    pendingCommands.current.delete(fingerprint)
    return result
  }

  useEffect(() => {
    let active = true
    request<TraceRecord[]>('/api/trace').then(rows => { if (active) { setRecords(rows); if (rows[0]) selectRecord(rows[0]) } })
      .catch(e => { if (active) setError(e.message) }).finally(() => { if (active) setBusy('') })
    return () => { active = false }
  }, [])

  function selectRecord(next: TraceRecord, preserveDraft = false) {
    setRecord(next); setGrant(null)
    if (!preserveDraft) {
      setRationale(''); setAuthority(false)
      setAction(next.unit.policyAssessment.proposedDisposition === 'needs_rule_review' ? 'request_rule_review' :
        next.unit.policyAssessment.proposedDisposition === 'needs_evidence' ? 'request_evidence' : 'accept_assessment')
    }
  }
  async function refresh(selectedId?: string, preserveDraft = false) {
    const rows = await request<TraceRecord[]>('/api/trace')
    setRecords(rows)
    const selected = selectedId ? await request<TraceRecord>(`/api/trace?unitId=${encodeURIComponent(selectedId)}`) : rows[0]
    if (selected) selectRecord(selected, preserveDraft)
  }
  async function perform(label: string, operation: () => Promise<void>) {
    setBusy(label); setError(''); setNotice('')
    try { await operation() } catch (e) { setError(e instanceof Error ? e.message : 'The request could not be completed. Your draft has been kept.') }
    finally { setBusy('') }
  }
  async function create(revision = false) {
    await perform(revision ? 'Freezing revised evidence…' : 'Running the fixture checks…', async () => {
      const next = await mutate<TraceRecord>('create', {
        scenario: revision ? 'satisfied' : scenario,
        ...(revision && record ? { previousUnitId: record.unit.id, expectedUnitHash: record.artifactHash, expectedSequence: record.decisionSequence } : {}),
      })
      await refresh(next.unit.id)
      setNotice(revision ? 'New evidence version saved. The earlier record and decisions remain in history.' : 'Synthetic evidence frozen and checks recorded. Human review is pending.')
      resultRef.current?.focus()
    })
  }
  const unit = record?.unit
  const policy = unit?.policyAssessment
  const latestDecision = record?.decisions.at(-1)
  const historical = Boolean(record?.supersededBy)

  return <div className={s.shell}>
    <a className={s.skip} href="#trace-main">Skip to main content</a>
    <header className={s.header}>
      <Link href="/" className={s.brand}>trace<span>li</span></Link>
      <nav aria-label="Main"><Link href="/workspace">Workspace</Link><Link href="/docs">How it works</Link></nav>
    </header>
    <main id="trace-main" tabIndex={-1} className={s.main}>
      <div className={s.intro}><div><div className={s.eyebrow}>Evidence → policy → human review</div>
        <h1>Trace a decision</h1><p>See what the record supports, what needs attention, and the next step. Every decision stays linked to the evidence reviewed.</p></div>
        <span className={s.badge}>Synthetic {local ? 'local ' : ''}workspace</span></div>
      <p className={s.notice}>Fictional evidence and rules for testing this workflow. No live model calls, real procurement approval or benchmark result.</p>
      {error && <div role="alert" className={s.error}>{error} {record && <button className={s.textButton} disabled={Boolean(busy)} onClick={() => perform('Reloading…', () => refresh(record.unit.id, true))}>Reload latest record</button>}</div>}
      {notice && <p role="status" className={s.success}>{notice}</p>}
      <p className={s.help} role="status" aria-live="polite">{busy || ''}</p>
      <div className={s.layout}>
        <aside className={s.sidebar} aria-label="Synthetic cases">
          <section className={s.panel}><h2>Try a case</h2>
            <label htmlFor="scenario" className={s.label}>Fictional packet</label>
            <select id="scenario" className={s.select} value={scenario} onChange={e => setScenario(e.target.value as TraceScenario)} disabled={Boolean(busy)}>
              {scenarioOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <p className={s.help}>{scenarioOptions.find(o => o.id === scenario)?.description}</p>
            <button className={`${s.button} ${s.wide}`} disabled={Boolean(busy) || !mayReview} onClick={() => create()}>Start Trace</button>
            {!mayReview && <p className={s.help}>Your role can inspect and export records. A procurement reviewer starts new cases.</p>}
          </section>
          <details className={s.panel}><summary className={s.historyHeading}>Record history ({records.length})</summary>
            {!records.length && <p className={s.help}>Your frozen records will appear here.</p>}
            <ol className={s.history}>{records.map(r => <li key={r.unit.id}>
              <button disabled={Boolean(busy)} aria-current={r.unit.id === unit?.id ? 'true' : undefined} onClick={() => perform('Opening record…', async () => { selectRecord(await request<TraceRecord>(`/api/trace?unitId=${r.unit.id}`)) })}>
                {scenarioOptions.find(option => option.id === r.unit.scenario)?.label.replace(/ · [UMG]$/, '')} · {r.unit.lane}<small>Version {r.unit.version} · {r.supersededBy ? 'Historical' : r.decisions.length ? 'Reviewed' : 'Review pending'}</small>
              </button></li>)}</ol>
          </details>
        </aside>
        <div className={s.stack}>
          {!unit || !record || !policy ? <section className={`${s.panel} ${s.empty}`}><h2>Start with one requirement</h2><p>Choose a fictional packet to freeze its evidence, run the checks and record your review. The missing-note case shows the full evidence-to-export flow.</p></section> : <>
            {historical && <div className={s.notice}>Historical version. New evidence requires a new review; this record is preserved as it was.
              <button className={s.textButton} disabled={Boolean(busy)} onClick={() => perform('Opening current version…', () => refresh(record.supersededBy!))}>Open newer version</button></div>}
            <section ref={resultRef} tabIndex={-1} className={`${s.panel} ${s.result}`} data-outcome={policy.result} aria-labelledby="policy-heading">
              <div className={s.eyebrow}>Policy check · {unit.lane} fixture</div>
              <p className={s.context}>{unit.profile.institution} · {unit.profile.procedure} · Version {unit.version}</p>
              <h2 id="policy-heading">{outcomeLabels[policy.result]}</h2>
              <p className={s.reason}>{policy.reason}</p>
              <div className={s.next}><strong>Next action</strong><p>{policy.nextAction}</p>
                {unit.scenario === 'missing' && !historical && mayReview ? <button className={`${s.button} ${s.wide}`} disabled={Boolean(busy)} onClick={() => create(true)}>Add fictional signed note</button> :
                  !historical && mayReview && <a className={s.textButton} href="#human-review">Continue to human review</a>}
              </div>
              <div className={s.status}><span>Evidence as of {timeLabel(unit.evidenceSnapshot.asOf)}</span><span>{latestDecision ? 'Human decision recorded' : 'Human review pending'}</span></div>
              <details className={s.details}><summary>View evidence and reasoning</summary>
                <p><strong>Requirement:</strong> {unit.obligation.normalizedRequirement}</p>
                <p><strong>Decision date:</strong> {dateLabel(unit.decisionDate)}</p>
                <p><strong>Applicability:</strong> {policy.applicability.replaceAll('_', ' ')}. {unit.profile.missingContext.join(' ')}</p>
                {unit.evidenceSnapshot.missingItems.map(item => <p key={item.code}><strong>Requested evidence:</strong> {item.description} · Owner: {item.owner}</p>)}
                {unit.evidenceSnapshot.assertions.map(a => <div key={a.id} className={s.source}><h3>{a.kind.replaceAll('_', ' ')}</h3><p>{a.text}</p><p className={s.help}>{a.limitations}</p></div>)}
                {unit.sourceVersions.map(source => <details className={s.source} key={source.id}><summary>{source.title} · {source.edition}</summary>
                  <p><strong>Effective date:</strong> {dateLabel(source.effectiveDate)}</p>
                  <p><strong>Locator:</strong> {unit.evidenceSnapshot.sourceManifest.find(m => m.sourceVersionId === source.id)?.locator}</p>
                  <blockquote className={s.quote}>{source.content}</blockquote>
                  <p className={s.mono}>SHA-256 of retained bytes: {source.byteHash}</p>
                  <a className={s.textButton} href={`/api/trace?unitId=${unit.id}&sourceId=${encodeURIComponent(source.id)}`} target="_blank" rel="noreferrer">Open source record</a>
                </details>)}
              </details>
              <details className={s.details}><summary>View version and integrity details</summary>
                <dl className={s.facts}><dt>Unit version ID</dt><dd className={s.mono}>{unit.id}</dd><dt>Frozen artifact hash</dt><dd className={s.mono}>{unit.artifactHash}</dd>
                  <dt>Snapshot hash</dt><dd className={s.mono}>{unit.evidenceSnapshot.hash}</dd><dt>Policy version</dt><dd>{unit.policyPack.implementationVersion}</dd>
                  <dt>Policy digest</dt><dd className={s.mono}>{unit.policyPack.digest}</dd><dt>Assessment hash</dt><dd className={s.mono}>{policy.hash}</dd>
                  <dt>Disposition</dt><dd>{policy.proposedDisposition.replaceAll('_', ' ')}</dd><dt>Later outcome</dt><dd>Unknown — synthetic example only</dd></dl>
                <p className={s.help}>Hashes bind retained bytes and exact record versions. They do not establish source truth or legal authority.</p>
              </details>
            </section>
            <section className={s.panel}><div className={s.eyebrow}>Model assessment</div><h2>{unit.evaluation.state === 'completed' ? 'Offline assessment recorded' : 'Model assessment unavailable'}</h2>
              <p className={s.help}>{unit.evaluation.state === 'completed' ? 'Mock response for this fictional packet. The policy check above keeps its own result.' : `The ${unit.evaluation.state === 'timeout' ? 'timeout' : 'invalid response'} fixture cannot clear this decision. No provider retry was made.`}</p>
              <details className={s.details}><summary>View mock assessment</summary><p>Provider: offline fixture · Model: {unit.evaluation.returnedModel} · External requests: 0</p>
                {unit.evaluation.distribution && <dl className={s.facts}>{Object.entries(unit.evaluation.distribution).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{(value * 100).toFixed(1)}%</dd></div>)}</dl>}
                <p>{unit.evaluation.semanticFindings.join(' ')}</p><p className={s.help}>A model probability is not approval or a calibrated performance claim.</p></details>
            </section>
            <section className={s.panel} id="human-review"><div className={s.eyebrow}>Human decision</div><h2>{latestDecision ? 'Review recorded' : 'Your review is needed'}</h2>
              <p className={s.help}>Record what should happen next for this exact evidence version. Acceptance covers this assessment only.</p>
              {record.decisions.map(d => <div className={s.receipt} key={d.id}><strong>{actionLabels[d.action]}</strong><p>{d.rationale}</p><p className={s.help}>{d.actorRole} · {timeLabel(d.createdAt)} · Decision {d.sequence}</p>
                {d.action === 'override_assessment' && <p className={s.help}>Original policy result: {outcomeLabels[d.originalOutcome]}. Authority: {d.authorityRef}</p>}</div>)}
              {!historical && mayReview && <form onSubmit={event => { event.preventDefault(); perform('Saving your decision…', async () => {
                await mutate('decide', { unitId: unit.id, expectedUnitHash: record.artifactHash, expectedInputHash: unit.inputHash,
                  expectedPolicyHash: policy.hash, expectedSequence: record.decisionSequence, action, rationale,
                  citedEvidenceIds: unit.evidenceSnapshot.assertions.map(a => a.id), authorityRef: action === 'override_assessment' && authority ? 'fixture-exception-v1' : null })
                await refresh(unit.id); setNotice('Human decision saved against this exact evidence and policy version.')
              }) }}>
                <div className={s.field}><label className={s.label} htmlFor="decision-action">Decision</label><select id="decision-action" className={s.select} value={action} onChange={e => setAction(e.target.value as DecisionAction)} disabled={Boolean(busy)}>
                  {decisionActions.filter(a => a !== 'override_assessment' || mayOverride).map(a => <option key={a} value={a}>{actionLabels[a]}</option>)}</select></div>
                <div className={s.field}><label className={s.label} htmlFor="rationale">Reason for your decision</label><textarea id="rationale" className={s.textarea} value={rationale} onChange={e => setRationale(e.target.value)} minLength={20} maxLength={2000} required disabled={Boolean(busy)} aria-describedby="rationale-help" />
                  <p id="rationale-help" className={s.help}>20–2,000 characters. Use fictional information only. Your reason is saved with your identity and this evidence version.</p></div>
                {action === 'override_assessment' && <div className={s.field}><label className={s.label}><input type="checkbox" checked={authority} onChange={e => setAuthority(e.target.checked)} required /> I am applying the fictional exception authority to the cited evidence.</label><p className={s.help}>Authority: fixture-exception-v1. This records an override; it preserves the original policy result.</p></div>}
                <button className={s.button} disabled={Boolean(busy) || (action === 'override_assessment' && unit.evidenceSnapshot.assertions.length === 0)}>Save human decision</button>
                {action === 'override_assessment' && !unit.evidenceSnapshot.assertions.length && <p className={s.help}>An override needs supplied evidence to cite. Add the fictional note first.</p>}
              </form>}
              {!mayReview && <p className={s.help}>Your current role can inspect this review. An authorized procurement reviewer records decisions.</p>}
            </section>
            <section className={s.panel}><div className={s.eyebrow}>Reconstructible export</div><h2>Keep the review record</h2><p className={s.help}>Download a JSON pack for your own review. Includes exact source versions, policy, model and decision history. Nothing is published or shared.</p>
              <div className={s.field}><label htmlFor="export-mode" className={s.label}>Included information</label><select id="export-mode" className={s.select} value={mode} disabled={Boolean(busy) || historical} onChange={e => { setMode(e.target.value as ExportMode); setGrant(null) }}>
                <option value="redacted">Redacted — omit reviewer identity and rationale</option>{mayOverride && <option value="full">Full — include reviewer identity and rationale</option>}</select></div>
              <div className={s.row}><button className={s.secondary} disabled={Boolean(busy) || historical || !latestDecision} onClick={() => perform('Preparing export…', async () => {
                const next = await mutate<Grant>('grant', { unitId: unit.id, expectedUnitHash: record.artifactHash, expectedSequence: record.decisionSequence,
                  mode, purpose: 'Personal synthetic workflow review' })
                setGrant(next); setNotice('Export prepared for your current access. The download expires in 15 minutes.')
              })}>Prepare export</button>
              {grant && <><a className={s.button} href={`/api/trace/export?grantId=${grant.id}`}>Download JSON pack</a><button className={s.textButton} disabled={Boolean(busy)} onClick={() => perform('Revoking download…', async () => { await request('/api/trace', { operation: 'revoke', input: { grantId: grant.id } }); setGrant(null); setNotice('Future downloads revoked. Existing downloaded copies cannot be recalled.') })}>Revoke download</button></>}</div>
              {!latestDecision && <p className={s.help}>Record a human decision to prepare an export.</p>}
              {grant && <p className={s.help}>Valid until {timeLabel(grant.expiresAt)}. Any new review or evidence version invalidates this download.</p>}
            </section>
          </>}
          <p className={s.footer}>Fixture-only workflow · No real source or legal applicability admitted · Later outcomes remain unknown.</p>
        </div>
      </div>
    </main>
  </div>
}
