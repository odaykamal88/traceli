import Link from 'next/link'
import type { CloudState } from '@/lib/hq/cloud-reader'
import styles from './hq.module.css'

const dollars = (value: number) => '$' + (value / 1_000_000).toFixed(2)
const time = (value: string) => new Date(value).toLocaleString('en-GB', { timeZone: 'Africa/Cairo', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' Cairo'

export function CloudPanel({ state }: { state: CloudState }) {
  const snapshot = state.snapshot
  return <section className={styles.panel} aria-label="Cloud worker">
    <div className={styles.sectionTitle}><h2>Cloud worker</h2><span className={styles.badge}>{state.connection === 'connected' ? 'Database connected' : state.connection === 'not-configured' ? 'Setup pending' : 'Status unavailable'}</span></div>
    <p>Institutional Memory drafts an HQ readiness brief from an approved snapshot. Every draft waits for Supervisor review.</p>
    {snapshot ? <>
      <p className={styles.small}>Checked {time(snapshot.checked_at)}. A connected database does not establish that a worker or schedule is running.</p>
      {snapshot.workers.length ? snapshot.workers.map(worker => <div className={styles.event} key={worker.actor}>
        <span className={styles.badge}>{worker.enabled ? 'Pilot permitted' : 'Pilot paused'}</span><div><strong>Readiness brief</strong>
          <p>{dollars(worker.reserved_microusd)} held against {dollars(worker.monthly_limit_microusd)} monthly model allowance.</p>
          <small>Each possible model call holds $0.05, including interrupted calls. Hosting is separate. Pricing review due {time(worker.pricing_valid_until)}.</small>
        </div>
      </div>) : <p>No cloud worker has been registered.</p>}
      {snapshot.runs.length ? snapshot.runs.map(run => <details className={styles.job} key={run.id}>
        <summary><span>{run.job_id}<small>{time(run.started_at)} · Attempt {run.attempt}</small></span><span className={styles.badge}>{run.status === 'review' ? 'Draft awaiting review' : run.status}</span></summary>
        <div className={styles.detail}>
          <p>{run.cost_uncertain ? 'Provider cost is unconfirmed; the full reservation remains counted.' : run.estimated_microusd !== null ? `Estimated token cost: ${dollars(run.estimated_microusd)}. Final billing is not yet reconciled.` : 'No model cost recorded.'}</p>
          {run.draft ? <><h3>{run.draft.summary}</h3><ul>{run.draft.observations.map((item, i) => <li key={i}><p>{item.statement}</p><small>Sources: {item.source_refs.join(', ')}</small></li>)}</ul>
            {!!run.draft.questions.length && <><h4>Open questions</h4><ul>{run.draft.questions.map((question, i) => <li key={i}>{question}</li>)}</ul></>}
            <p className={styles.small}>Saved draft · SHA-256 {run.content_hash}. Source references require review; this is not canonical company memory.</p></> : <p>No draft has been saved for this attempt.</p>}
        </div>
      </details>) : <p>No cloud run has been recorded.</p>}
    </> : <p>{state.connection === 'not-configured' ? 'The worker package is prepared. Cloud database setup, credentials and the pilot budget still need to be completed.' : 'The cloud status could not be verified. No success or failure is inferred from missing status.'}</p>}
    <Link href="/hq?doc=CLOUD_WORKER_PILOT.md">Review the pilot scope, limits and activation steps →</Link>
  </section>
}
