'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { ArrowDownToLine, ArrowRight, Check, ChevronRight, FileText, RotateCcw, ShieldCheck } from 'lucide-react'
import type { TraceOutcome, TraceScenario } from '@/lib/trace/contract'
import { buildPublicDemoExport, createSimulatedReview, defaultDemoAction, demoReviewActions, publicScenarioOptions, type DemoReviewAction, type PublicDemoCase, type PublicDemoPacket, type SimulatedReview } from '@/lib/trace/public-demo'
import s from './public-demo.module.css'

const outcomeLabels: Record<TraceOutcome, string> = {
  unknown: 'More evidence needed', satisfied: 'Evidence supports this requirement',
  not_satisfied: 'Requirement not met in this record', not_applicable: 'Does not apply to this decision', conflict: 'Conflicting rules need review',
}
const actionLabel = (action: DemoReviewAction) => demoReviewActions.find(item => item.id === action)?.label

export default function PublicTraceDemo({ packet }: { packet: PublicDemoPacket }) {
  const [scenario, setScenario] = useState<TraceScenario>('missing')
  const [entries, setEntries] = useState<PublicDemoCase[]>([packet.cases.missing])
  const [selectedId, setSelectedId] = useState(packet.cases.missing.snapshot.id)
  const [reviews, setReviews] = useState<SimulatedReview[]>([])
  const [action, setAction] = useState<DemoReviewAction>('request_evidence')
  const [rationale, setRationale] = useState('')
  const [authority, setAuthority] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const resultRef = useRef<HTMLHeadingElement>(null)
  const reviewRef = useRef<HTMLHeadingElement>(null)
  const entry = entries.find(item => item.snapshot.id === selectedId) ?? entries[0]
  const snapshot = entry.snapshot
  const selectedReviews = reviews.filter(review => review.snapshotId === selectedId)
  const historical = selectedId !== entries[entries.length - 1].snapshot.id
  const selectedScenario = publicScenarioOptions.find(item => item.id === scenario)!
  const modelIncomplete = snapshot.model.state !== 'completed'

  function clearDraft(next: PublicDemoCase) {
    setAction(defaultDemoAction(next.snapshot)); setRationale(''); setAuthority(false); setError('')
  }
  function startScenario(nextScenario: TraceScenario) {
    const next = packet.cases[nextScenario]
    setScenario(nextScenario); setEntries([next]); setSelectedId(next.snapshot.id); setReviews([])
    clearDraft(next); setNotice('Fresh example opened. Previous practice reviews have been cleared.')
  }
  function reset() {
    startScenario('missing'); setNotice('Demo reset. All practice reviews and typed notes have been cleared.')
  }
  function revise() {
    if (historical || entries.length !== 1 || scenario !== 'missing') return
    const revised = packet.revisedMissing
    setEntries([packet.cases.missing, revised]); setSelectedId(revised.snapshot.id); clearDraft(revised)
    setNotice('Version 2 includes the fictional signed note. Version 1 and its practice reviews remain available.')
    resultRef.current?.focus()
  }
  function selectVersion(next: PublicDemoCase) {
    setSelectedId(next.snapshot.id); clearDraft(next); setNotice(`Viewing version ${next.snapshot.version}.`)
  }
  function recordReview() {
    setError('')
    try {
      if (historical) throw new Error('Open the current version to record a practice review.')
      const review = createSimulatedReview(entry, { action, rationale, authority, sequence: reviews.length + 1, now: new Date().toISOString() })
      setReviews(current => [...current, review]); setRationale(''); setAuthority(false)
      setNotice('Practice review recorded in this tab. The evidence check remains unchanged. You can now download the demo record.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The practice review could not be recorded.') }
  }
  function download() {
    setError('')
    try {
      const payload = buildPublicDemoExport(entries, reviews, selectedId, new Date().toISOString())
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
      const anchor = document.createElement('a')
      anchor.href = url; anchor.download = `traceli-demo-${scenario}-v${snapshot.version}.json`
      document.body.appendChild(anchor); anchor.click(); anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice('Demo record downloaded. It contains fictional snapshots and your practice reviews; no server record was created.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The download could not be created. Try again in this browser.') }
  }

  return <div className={s.shell}>
    <a className={s.skip} href="#demo-main">Skip to demo</a>
    <header className={s.header}>
      <Link className={s.brand} href="/" aria-label="Traceli home"><ShieldCheck size={25} strokeWidth={1.5} aria-hidden="true" /><span>traceli</span></Link>
      <nav aria-label="Public navigation"><Link href="/demo">Award desk</Link><Link href="/docs">How it works</Link><Link href="/insights">Research</Link></nav>
    </header>
    <main id="demo-main" tabIndex={-1} className={s.main}>
      <section className={s.intro} aria-labelledby="demo-title">
        <div><p className={s.eyebrow}>How Trace reasons</p><h1 id="demo-title">Trace an award decision.</h1>
          <p className={s.lede}>A method sandbox for diligence: see what the evidence supports, what needs attention, and why a human makes the next call.</p></div>
        <span className={s.demoBadge}><span aria-hidden="true" />Public demo · Fictional data</span>
      </section>
      <div className={s.boundary}><ShieldCheck size={17} aria-hidden="true" /><p>Changes stay in this browser tab and clear on refresh. No live model calls, uploads or real procurement approvals.</p></div>
      <ol className={s.steps} aria-label="Demo journey">
        {['Inspect the evidence', 'Understand the check', 'Record a practice review', 'Keep the demo record'].map((label, index) => <li key={label}><span>{String(index + 1).padStart(2, '0')}</span>{label}{index < 3 && <ChevronRight size={14} aria-hidden="true" />}</li>)}
      </ol>
      <noscript><p className={s.error}>JavaScript is required for the interactive demo. The fictional evidence below remains readable.</p></noscript>
      {error && <p className={s.error} role="alert">{error}</p>}
      <p className={notice ? s.notice : s.emptyNotice} role="status" aria-live="polite">{notice}</p>
      <div className={s.layout}>
        <aside className={s.sidebar} aria-label="Choose a fictional case">
          <section className={s.scenarioPanel}>
            <p className={s.eyebrow}>One decision, explained</p><h2>Try a case.</h2>
            <label className={s.label} htmlFor="demo-scenario">Choose a scenario</label>
            <select id="demo-scenario" className={s.select} value={scenario} onChange={event => startScenario(event.target.value as TraceScenario)}>
              {publicScenarioOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
            <p className={s.scenarioDescription}>{selectedScenario.description}</p>
            <p className={s.small}>Choosing another case starts a fresh practice session.</p>
            <button type="button" className={s.reset} onClick={reset}><RotateCcw size={14} aria-hidden="true" />Reset demo</button>
          </section>
          <section className={s.historyPanel} aria-labelledby="versions-title">
            <h2 id="versions-title">Evidence versions</h2>
            <ol className={s.history}>{entries.map(item => <li key={item.snapshot.id}><button type="button" aria-current={item.snapshot.id === selectedId ? 'true' : undefined} onClick={() => selectVersion(item)}>
              <span>Version {item.snapshot.version}</span><small>{item.snapshot.version === 1 ? 'Original supplied packet' : 'Fictional signed note added'}</small>
              {item.snapshot.id === selectedId && <Check size={15} aria-hidden="true" />}
            </button></li>)}</ol>
            <p className={s.small}>New evidence creates a new version. Earlier evidence and practice reviews stay separate.</p>
          </section>
          <Link href="/demo" className={s.classic}>Back to Award desk<ArrowRight size={14} aria-hidden="true" /></Link>
          <Link href="/method/classic" className={s.classic}>Earlier procurement walkthrough<ArrowRight size={14} aria-hidden="true" /></Link>
        </aside>
        <div className={s.content}>
          <section className={s.result} data-outcome={snapshot.policy.result} aria-labelledby="result-title">
            <div className={s.resultTop}><p className={s.eyebrow}>Evidence check</p><span className={s.version}>Version {snapshot.version} · {historical ? 'Historical' : 'Current example'}</span></div>
            <h2 id="result-title" ref={resultRef} tabIndex={-1} data-testid="policy-result">{outcomeLabels[snapshot.policy.result]}</h2>
            <p className={s.reason} data-testid="policy-reason">{snapshot.policy.reason}</p>
            {modelIncomplete && <p className={s.incomplete}>Combined assessment incomplete. The offline model example {snapshot.model.state === 'timeout' ? 'timed out' : 'returned an invalid response'}; the evidence check alone does not clear the decision.</p>}
            {historical && <p className={s.incomplete}>An earlier evidence version. Open Version 2 to continue the practice review.</p>}
            <div className={s.next}><div><p className={s.eyebrow}>What happens next</p><p>{snapshot.policy.nextAction}</p></div>
              {!historical && scenario === 'missing' && snapshot.version === 1 ? <button type="button" className={s.primary} onClick={revise}>Add fictional signed note<ArrowRight size={16} aria-hidden="true" /></button> : !historical ?
                <a className={s.primary} href="#practice-review" onClick={() => reviewRef.current?.focus()}>Continue to human review<ArrowRight size={16} aria-hidden="true" /></a> : null}
            </div>
            <details className={s.disclosure}>
              <summary>Inspect the rule and source evidence<span aria-hidden="true">+</span></summary>
              <div className={s.disclosureBody}><div className={s.rule}><p className={s.eyebrow}>Fictional requirement</p><p>{snapshot.rule.text}</p><small>{snapshot.rule.locator} · Fictional decision date {snapshot.decisionDate.value}</small></div>
                {snapshot.missingEvidence.map(item => <p key={item} className={s.missing}><strong>Not in this packet:</strong> {item}</p>)}
                {snapshot.evidence.map(item => <div className={s.evidence} key={item.id}><FileText size={17} aria-hidden="true" /><div><p>{item.text}</p><small>{item.locator} · {item.limitations}</small></div></div>)}
                {snapshot.sources.map(source => <details className={s.source} key={source.id}><summary>{source.title}</summary><p className={s.small}>{source.edition} · Effective date: {source.effectiveDate.value ?? `Unknown — ${source.effectiveDate.unknownReason}`}</p><pre>{source.content}</pre>
                  <p className={s.small}>SHA-256 of these exact fictional source bytes</p><code className={s.hash}>{source.byteHash}</code></details>)}
              </div>
            </details>
            <details className={s.disclosure}>
              <summary>See how the model and policy differ<span aria-hidden="true">+</span></summary>
              <div className={s.disclosureBody}><p className={s.small}>The rule check uses supplied evidence. A model assessment is a separate input; neither makes the procurement decision.</p>
                <div className={s.modelGrid}><div><p className={s.eyebrow}>Deterministic check</p><strong>{outcomeLabels[snapshot.policy.result]}</strong><p className={s.small}>Applicability: {snapshot.policy.applicability.replaceAll('_', ' ')}.</p></div>
                  <div><p className={s.eyebrow}>Offline model example</p><strong>{snapshot.model.state === 'completed' ? 'Mock response available' : snapshot.model.state === 'timeout' ? 'Timed out' : 'Invalid response'}</strong><p className={s.small}>No provider request was made.</p></div></div>
                {snapshot.model.distribution && <dl className={s.probabilities}><div><dt>Supports</dt><dd>{Math.round(snapshot.model.distribution.supports * 100)}%</dd></div><div><dt>Does not support</dt><dd>{Math.round(snapshot.model.distribution.doesNotSupport * 100)}%</dd></div><div><dt>Unknown</dt><dd>{Math.round(snapshot.model.distribution.unknown * 100)}%</dd></div></dl>}
                <p className={s.small}>These probabilities are fictional, not measured accuracy. High model confidence cannot reverse a failed rule check.</p>
              </div>
            </details>
          </section>
          <section className={s.panel} id="practice-review" aria-labelledby="review-title">
            <div className={s.panelHeading}><span className={s.number}>03</span><div><p className={s.eyebrow}>Human judgment</p><h2 id="review-title" ref={reviewRef} tabIndex={-1}>Your review stays with this evidence.</h2></div></div>
            <p className={s.bodyText}>Practise recording the next decision and the reason behind it. This review is a browser simulation, with no authenticated reviewer or real approval.</p>
            <div data-testid="practice-reviews">{selectedReviews.map(review => <article className={s.reviewReceipt} key={review.sequence}><p><Check size={16} aria-hidden="true" /><strong>{actionLabel(review.action)}</strong></p><blockquote>{review.rationale}</blockquote><small>Practice review {review.sequence} · Evidence version {snapshot.version} · Original check unchanged</small></article>)}</div>
            {historical ? <p className={s.small}>Historical practice reviews are preserved. Select the current version to record another.</p> : <form onSubmit={event => { event.preventDefault(); recordReview() }} className={s.form}>
              <label className={s.label} htmlFor="practice-decision">Practice decision</label>
              <select id="practice-decision" className={s.select} value={action} onChange={event => { setAction(event.target.value as DemoReviewAction); setAuthority(false) }}>
                {demoReviewActions.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}
              </select>
              <label className={s.label} htmlFor="practice-rationale">Reason for this practice decision</label>
              <textarea id="practice-rationale" className={s.textarea} value={rationale} onChange={event => setRationale(event.target.value)} minLength={20} maxLength={2000} required aria-describedby="rationale-help" placeholder="For example: The dated fictional note supports this scoped check. The award still needs its own approval." />
              <p id="rationale-help" className={s.small}>Use fictional information only. 20–2,000 characters; kept in this tab and included if you download.</p>
              {action === 'override_assessment' && <div className={s.override}><label><input type="checkbox" required checked={authority} onChange={event => setAuthority(event.target.checked)} />I am using the fictional exception authority.</label><p className={s.small}>The override preserves the original check and cites the supplied fictional evidence.</p></div>}
              <button className={s.primary} type="submit" disabled={action === 'override_assessment' && snapshot.evidence.length === 0}>Record practice review<Check size={16} aria-hidden="true" /></button>
              {action === 'override_assessment' && !snapshot.evidence.length && <p className={s.small}>Add the fictional evidence before practising an override.</p>}
            </form>}
          </section>
          <section className={s.export} aria-labelledby="export-title">
            <div className={s.panelHeading}><span className={s.number}>04</span><div><p className={s.eyebrow}>A record you can inspect</p><h2 id="export-title">Keep the evidence and the explanation.</h2></div></div>
            <p className={s.bodyText}>Download the fictional source evidence, rule check, version history and your practice reviews in one JSON file.</p>
            <button type="button" className={s.download} onClick={download} disabled={!selectedReviews.length || historical}><ArrowDownToLine size={17} aria-hidden="true" />Download demo record</button>
            <p className={s.small}>{selectedReviews.length ? 'A demonstration file, not an authenticated approval or a protected workspace export.' : 'Record a practice review of the current version to enable the download.'}</p>
            <details className={s.exportDetails}><summary>What this record verifies</summary><p>Each snapshot has a hash of its exact public contents. Source hashes match the included fictional text. Practice reviews are kept separately from those immutable example snapshots.</p><p>No hash proves legal authority, reviewer identity or permanent storage. This public demo creates no server record, grants or access permissions.</p><p className={s.small}>Current snapshot SHA-256</p><code className={s.hash}>{entry.snapshotHash}</code></details>
          </section>
        </div>
      </div>
      <footer className={s.footer}><p>Evidence. Policy. Human review.<br /><span>Fictional examples for exploring how Trace reasons. The product demo is Award desk.</span></p><Link href="/demo">Open Award desk<ArrowRight size={15} aria-hidden="true" /></Link></footer>
    </main>
  </div>
}
