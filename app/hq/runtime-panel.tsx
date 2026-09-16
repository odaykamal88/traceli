import Link from 'next/link'
import { isStale, operatingRoomUrl, type Runtime } from './runtime'
import styles from './hq.module.css'

function time(at: string) {
  return new Date(at).toLocaleString('en-GB', {timeZone:'Africa/Cairo',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) + ' Cairo'
}

export function RuntimePanel({runtime}: {runtime: Runtime | null}) {
  const room = runtime?.room
  const fresh = runtime?.connection === 'connected' && !isStale(room?.fetched_at)
  return <section className={styles.panel} aria-label="Scheduled operations">
    <div className={styles.sectionTitle}><h2>Scheduled operations</h2><a href={operatingRoomUrl} target="_blank" rel="noopener noreferrer">Open Operating Room ↗</a></div>
    <p>The existing desks carry the mandates. A schedule being enabled and a result being saved are separate facts.</p>
    {runtime ? <>
      <p className={fresh ? styles.small : styles.alert}>{fresh ? 'Operating Room connected' : 'Operating Room evidence needs refresh'} · {room ? 'last read '+time(room.fetched_at) : 'no saved evidence yet'}. Schedule settings checked {time(runtime.checked_at)}.</p>
      {room && <div className={styles.metrics}>
        {[[room.task_count,'Operating Room tasks'],[room.pending_reviews,'Pending reviews'],[room.unexpired_claims,'Active task claims at last read'],[room.receipt_count,'Saved run receipts']].map(([value,label])=><div key={label}><strong>{value}</strong><small>{label}</small></div>)}
      </div>}
      {runtime.schedules.map(schedule => {
        const receipt = room?.latest_receipts[schedule.job_id]
        return <div className={styles.event} key={schedule.id}>
          <span><span className={styles.badge}>{schedule.status==='ACTIVE' ? (isStale(runtime.checked_at)?'Enabled at last check':'Schedule enabled') : schedule.status==='PAUSED'?'Paused':'Unknown'}</span></span>
          <div><strong>{schedule.name}</strong><p>{schedule.mandate} · {schedule.cadence}</p>
            <p>{receipt ? <>Latest saved result: <strong>{receipt.outcome}</strong> · {time(receipt.at)}</> : 'No verified result available.'}</p>
            <small>{schedule.hq_handoff_configured?'HQ charters and A–G handoff connected':'HQ handoff not yet connected'}</small>
          </div>
        </div>
      })}
      {!!room?.pending_reviews && <p>Review packets awaiting disposition: {room.pending_review_task_ids.map(id=>'#'+id).join(', ')}. Open the Operating Room to inspect the exact work.</p>}
      {!!runtime.pending_local_receipts && <p className={styles.alert}>{runtime.pending_local_receipts} local receipt(s) awaiting confirmed delivery.</p>}
    </> : <p className={styles.alert}>Runtime status is unavailable. This does not mean the existing schedules are disabled.</p>}
    <p className={styles.small}>The page rereads its saved status every 30 seconds. Desks refresh that status during runs; this page does not dispatch workers. Local schedules need the computer on and the desktop app running. Pause or run a desk from Scheduled in the app.</p>
    <Link href="/hq?doc=RUNTIME_HANDOFF.md">Read activation scope and workstream handoffs →</Link>
  </section>
}
