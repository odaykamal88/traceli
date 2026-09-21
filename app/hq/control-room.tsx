import Link from 'next/link'
import type { CloudState } from '@/lib/hq/cloud-reader'
import type { OperatingTask } from '@/lib/hq/operating-contract'
import { metricProgress, newestFirst, snapshotAge, taskPriorityLabel, updatesDeskUrl, requestTaskState } from './control-model'
import s from './control-room.module.css'

export type Control = typeof import('@/docs/hq/data/control-room.json')
type SavedRoom = typeof import('@/docs/hq/data/operating-room.json')
export type Room = Omit<SavedRoom, 'tasks'> & { tasks: OperatingTask[] }
export type DeskResults = typeof import('@/docs/hq/data/desk-results.json')
type Event = (typeof import('@/docs/hq/data/events.json'))[number]

export function recordedTime(at: string) {
  if (!at.includes('T')) return new Date(at + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Cairo' })
  return new Date(at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Cairo' }) + ' Cairo'
}

function Evidence({ file, label = 'View evidence' }: { file: string; label?: string }) {
  return <Link className={s.evidence} href={'/hq?doc=' + encodeURIComponent(file)}>{label} <span aria-hidden="true">↗</span></Link>
}

function Status({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: string }) {
  return <span className={`${s.status} ${tone === 'good' ? s.good : tone === 'warning' ? s.warning : ''}`}>{children}</span>
}

function SectionTitle({ number, title, href, action }: { number?: string; title: string; href?: string; action?: string }) {
  return <div className={s.sectionTitle}><h2>{number && <span>{number}</span>}{title}</h2>{href && <Link href={href}>{action || 'View all'} <span aria-hidden="true">→</span></Link>}</div>
}

export function Milestones({ control, room }: { control: Control; room: Room }) {
  const milestone = control.business_milestone
  const main = metricProgress(room.metrics.find(m => m.id === 'w4-next-steps'))
  const complete = main !== null && main.remaining === 0
  const duePassed = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()) > milestone.due
  const cloud = control.cloud_milestone
  const gatesDone = cloud.gates.filter(g => g.status === 'done').length
  return <div className={s.milestoneGrid}>
    <article className={`${s.card} ${s.primaryMilestone}`}>
      <div className={s.cardTop}><p className={s.kicker}>NEXT BUSINESS MILESTONE</p><Status tone={complete ? 'good' : 'warning'}>{complete ? 'Target recorded · verify evidence' : duePassed ? 'Target date passed · reconcile evidence' : 'At risk · evidence missing'}</Status></div>
      <h3>{milestone.title}</h3><p className={s.definition}>{milestone.definition}</p>
      <div className={s.goalLine}><strong>{main ? main.current : '—'} <span>/ {main?.target ?? 1} recorded</span></strong><span>{milestone.period}</span></div>
      {main && <progress className={s.progress} max={main.target} value={Math.min(main.current, main.target)} aria-label="Dated commercial next steps recorded"/>}
      <div className={s.funnel}>{milestone.metric_ids.map((id, index) => {
        const metric = room.metrics.find(m => m.id === id)
        const progress = metricProgress(metric)
        return <div key={id}><span className={s.stepNumber}>0{index + 1}</span><strong>{progress ? progress.current : '—'}<span> / {progress?.target ?? '—'}</span></strong><p>{metric?.label ?? 'Evidence unavailable'}</p></div>
      })}</div>
      <p className={s.fine}>Recorded counts from the original board; missing receipts may leave activity uncounted. Targets are outcomes, not a percentage of effort completed.</p>
      <div className={s.nextAction}><span>Next move</span><p>{milestone.next}</p></div>
      <div className={s.cardFooter}><span>{milestone.owner}</span><Evidence file={milestone.evidence_ref} label="Milestone & done criteria"/></div>
    </article>
    <article className={s.card}>
      <p className={s.kicker}>SUPPORTING MILESTONE / CLOUD</p><h3>{cloud.title}</h3>
      <div className={s.goalLine}><strong>{gatesDone}<span> / {cloud.gates.length} gates evidenced</span></strong></div>
      <progress className={s.progress} max={cloud.gates.length} value={gatesDone} aria-label="Cloud migration readiness gates evidenced"/>
      <ul className={s.checklist}>{cloud.gates.map(g => <li key={g.title}><span className={g.status === 'done' ? s.checkDone : s.checkPending} aria-label={g.status === 'done' ? 'Complete' : 'Pending'}>{g.status === 'done' ? '✓' : '○'}</span>{g.title}</li>)}</ul>
      <p className={s.fine}>Readiness checklist as of {recordedTime(cloud.reviewed_at)}. This is not a delivery estimate. A daily timer alone does not prove a scheduled run.</p>
      <div className={s.nextAction}><span>Next move · {cloud.owner}</span><p>{cloud.next}</p></div>
      <Evidence file={cloud.evidence_ref} label="Cloud acceptance record"/>
    </article>
  </div>
}

export function NeedsOday({ control, room, compact = false }: { control: Control; room: Room; compact?: boolean }) {
  const pending = room.reviews.filter(r => r.status === 'pending')
  const asks = control.asks.map(ask => ({ ask, ...requestTaskState(ask.task_ids, room.tasks) }))
    .filter(({ ask, current }) => current.some(id => ask.id !== 'editorial-review' || pending.some(review => review.task_id === id)))
  return <section id="needs-you" className={s.anchor}>
    <SectionTitle number="02" title="What I need from you" href={compact ? '/hq?view=needs-you' : undefined} action="All requests & reviews"/>
    <p className={s.sectionNote}><a href={updatesDeskUrl()}>Open Updates →</a> Add a note, return work to the backlog or move it to later in the private Operating Room.</p>
    {!asks.length && <p className={s.sectionNote}>No current requests in this snapshot. Deferred work remains visible in <Link href="/hq?view=tasks">Tasks</Link>.</p>}
    <div className={s.askGrid}>{asks.map(({ ask, current, later, completed, completeRequest }) => <article className={`${s.card} ${s.askCard}`} key={ask.id}>
      <div className={s.cardTop}><Status tone="warning">{ask.priority}</Status><span className={s.fine}>{current.map(id => '#' + id).join(' · ')}</span></div>
      <h3>{completeRequest ? ask.title : 'Update the remaining ' + (current.length === 1 ? 'task' : 'tasks')}</h3>
      {completeRequest ? <><p>{ask.why}</p><details className={s.disclosure}><summary>What to provide</summary><p>{ask.request}</p><p className={s.fine}>{ask.next_owner}</p></details></> : <p>Open the current {current.length === 1 ? 'task' : 'tasks'} below to review its next step and add your update.</p>}
      <div className={s.linkRow}>{current.map(id => <a key={id} href={updatesDeskUrl(id)}>Update #{id} →</a>)}</div>
      {later.length > 0 && <p className={s.fine}>Later: {later.map(id => '#' + id).join(', ')}</p>}
      {completed.length > 0 && <p className={s.fine}>Completed: {completed.map(id => '#' + id).join(', ')}</p>}
    </article>)}</div>
    {!compact && <article className={s.card}><h3>Review queue <span className={s.fine}>· {pending.length} pending at last read</span></h3><p className={s.fine}>Open a task to read its packet and record your update. Moving work to later keeps its review pending.</p>{pending.length ? pending.map(review => <div className={s.reviewRow} key={review.id}><span>#{review.task_id}</span><div><strong><a href={updatesDeskUrl(review.task_id)}>{review.title}</a></strong><p className={s.fine}>{taskPriorityLabel(room.tasks.find(t => t.id === review.task_id)?.priority)}</p></div><Status>Pending</Status></div>) : <p>No pending reviews in this snapshot.</p>}<a className={s.actionLink} href={updatesDeskUrl()}>Open Updates →</a></article>}
  </section>
}

export function TaskBoard({ room }: { room: Room }) {
  const groups = [
    { title: 'Current work', tasks: room.tasks.filter(task => task.status !== 'done' && task.priority !== 'later') },
    { title: 'Later', tasks: room.tasks.filter(task => task.status !== 'done' && task.priority === 'later') },
    { title: 'Completed', tasks: room.tasks.filter(task => task.status === 'done') },
  ]
  const status: Record<OperatingTask['status'], string> = { todo: 'To do', doing: 'Doing', blocked: 'Blocked', review: 'Review', done: 'Done' }
  return <section className={s.anchor}>
    <p className={s.sectionNote}>Open a task in Updates to add context or change its priority. Status and priority below reflect the board read on {recordedTime(room.checked_at)}. A blocked task may need Codex work, a source or buyer evidence.</p>
    <p><a className={s.actionLink} href={updatesDeskUrl()}>Add an update →</a></p>
    {groups.map(group => <details key={group.title} className={`${s.card} ${s.taskGroup}`} open={group.title !== 'Completed'}>
      <summary>{group.title} <span className={s.fine}>· {group.tasks.length}</span></summary>
      {group.tasks.length ? group.tasks.map(task => <div className={s.reviewRow} key={task.id}>
        <span>#{task.id}</span><div><strong><a href={updatesDeskUrl(task.id)}>{task.title}</a></strong><p className={s.fine}>{task.owner} · {taskPriorityLabel(task.priority)} · Due {task.due}</p></div><Status tone={task.status === 'done' ? 'good' : task.status === 'blocked' ? 'warning' : 'neutral'}>{status[task.status]}</Status>
      </div>) : <p className={s.fine}>No tasks in this group.</p>}
    </details>)}
  </section>
}

export function Blockers({ control }: { control: Control }) {
  return <section id="blockers" className={s.anchor}><SectionTitle number="03" title="What is blocking us"/><div className={s.blockerGrid}>{control.blockers.map(blocker => <article className={`${s.card} ${s.blockerCard}`} key={blocker.id}>
    <Status tone="warning">Blocked</Status><h3>{blocker.title}</h3><p>{blocker.impact}</p><div className={s.nextAction}><span>Unblock · {blocker.owner}</span><p>{blocker.next}</p></div><Evidence file={blocker.evidence_ref}/>
  </article>)}</div></section>
}

export function WorkstreamSummary({ control }: { control: Control }) {
  return <section id="workstreams" className={s.anchor}><SectionTitle number="04" title="Workstreams" href="/hq?view=queues" action="Open work queues"/><div className={s.streamList}>
    <div className={s.streamHeader}><span>Workstream / owner</span><span>Where it stands</span><span>Next useful step</span></div>
    {control.workstreams.map(w => <article className={s.streamRow} key={w.id}>
      <div className={s.streamName}><span className={s.letter}>{w.id}</span><div><h3><Link href={'/hq?view=queues#stream-' + w.id}>{w.name}</Link></h3><p>{w.owner}</p></div></div>
      <div><Status tone={w.tone}>{w.state}</Status><p>{w.now}</p></div><div><p>{w.next}</p><Evidence file={w.evidence_ref}/></div>
    </article>)}
  </div></section>
}

export function Feedback({ control, room }: { control: Control; room: Room }) {
  return <section id="feedback" className={s.anchor}><SectionTitle number="05" title="LinkedIn, X & buyer feedback"/>
    <div className={s.feedbackHeadline}><strong>Distribution exists. Buyer uptake is still unproven.</strong><p>Latest owner update · {recordedTime(room.owner_update.recorded_at)}: {room.owner_update.summary} Analytics are not connected.</p></div>
    <div className={s.channelGrid}>{control.channels.map(channel => <article className={s.card} key={channel.name}><div className={s.cardTop}><h3>{channel.name}</h3><span className={s.fine}>Record: {recordedTime(channel.recorded_at)}</span></div><Status tone={channel.name === 'X' ? 'warning' : 'neutral'}>{channel.state}</Status><p>{channel.publication}</p><div className={s.feedbackNote}><span>Uptake / feedback</span><p>{channel.feedback}</p></div><div className={s.nextAction}><span>Next evidence needed</span><p>{channel.next}</p></div><div className={s.linkRow}>{channel.links.map(link => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a>)}</div></article>)}</div>
    <p className={s.fine}>Publication history comes from dated release records; post links are not a live analytics feed. <Evidence file="operations/OPERATING_EVIDENCE.md" label="Read source and measurement limits"/></p>
  </section>
}

export function Lessons({ control, compact = false }: { control: Control; compact?: boolean }) {
  return <section id="lessons" className={s.anchor}><SectionTitle number="06" title="Lessons & improvements" href={compact ? '/hq?view=lessons' : undefined} action="Open the learning log"/>
    <p className={s.sectionNote}>What happened → what we changed → what to check next. These are documented lessons; they do not establish an autonomous self-improvement loop.</p>
    <div className={s.lessonGrid}>{(compact ? control.lessons.slice(0, 2) : control.lessons).map(lesson => <article className={s.card} key={lesson.id}><div className={s.cardTop}><span className={s.fine}>{lesson.id} · {recordedTime(lesson.observed_at)}</span><Status tone={lesson.state === 'Applied' ? 'good' : 'neutral'}>{lesson.state}</Status></div><h3>{lesson.title}</h3><p>{lesson.observation}</p><div className={s.nextAction}><span>{lesson.state === 'Proposed' ? 'Proposed change' : 'Change made'}</span><p>{lesson.change}</p></div><p className={s.fine}><strong>Next check:</strong> {lesson.next_check}</p><Evidence file={lesson.evidence_ref}/></article>)}</div>
    {!compact && <p className={s.fine}>Last learning-readiness review: 11 September, gate unmet. A fresh readiness review is required before enabling proposal loops. <Evidence file="operations/OPERATING_EVIDENCE.md" label="Read the recorded gate"/></p>}
  </section>
}

export function Activity({ events, compact = false }: { events: Event[]; compact?: boolean }) {
  const sorted = newestFirst(events)
  return <section id="activity" className={s.anchor}><SectionTitle title={compact ? 'What happened recently' : 'Activity & decisions over time'} href={compact ? '/hq?view=activity' : undefined} action="Full activity log"/>
    <div className={s.activityList}>{(compact ? sorted.slice(0, 4) : sorted).map(event => <article className={s.activityRow} key={event.id}>
      <time dateTime={event.at}>{recordedTime(event.at)}</time><div><h3>{event.subject}</h3><p>{event.summary}</p><div className={s.cardFooter}><span>{event.actor} · {event.type.replaceAll('_', ' ')}</span>{event.evidence_ref.endsWith('.md') ? <Evidence file={event.evidence_ref}/> : <Link href="/hq?view=jobs">Open job records ↗</Link>}</div></div>
    </article>)}</div>
  </section>
}

export function DeskEvidence({ results }: { results: DeskResults }) {
  const names: Record<string, string> = { 'execution-desk': 'Execution Desk', 'editorial-desk': 'Editorial Desk', 'customer-learning': 'Customer Learning', 'funding-watch': 'Funding Watch', 'learning-readiness': 'Learning Readiness', 'security-posture': 'Security Posture', 'change-assurance': 'CI', 'production-smoke': 'Production smoke', 'dependency-updates': 'Dependency updates' }
  return <section className={s.anchor}><SectionTitle title="Latest saved desk results"/><p className={s.sectionNote}>Read {recordedTime(results.checked_at)} from {results.receipt_count} original receipts. These are the latest saved outcomes, not live execution or current health checks.</p><div className={s.card}>{newestFirst(results.latest).map(result => <div className={s.reviewRow} key={result.id}><span aria-hidden="true">↳</span><div><strong>{names[result.job_id] || result.job_id}</strong><p className={s.fine}>{recordedTime(result.at)}</p></div><Status tone={result.outcome === 'Passed' || result.outcome === 'Completed' ? 'good' : 'warning'}>{result.outcome}</Status></div>)}<a className={s.actionLink} href={results.source_url} target="_blank" rel="noopener noreferrer">Inspect original receipts ↗</a></div></section>
}

export function ControlHome({ control, room, events, cloud }: { control: Control; room: Room; events: Event[]; cloud: CloudState }) {
  const fresh = snapshotAge(room.checked_at)
  const latestRun = cloud.snapshot?.runs.slice().sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at))[0]
  const lastBoardChange = room.tasks.map(task => task.updated_at).sort().at(-1)
  return <div className={s.control}>
    <section className={s.brief} aria-label="Supervisor brief">
      <div><p className={s.kicker}>SUPERVISOR BRIEF · {recordedTime(control.reviewed_at)}</p><h2>The next bottleneck is buyer evidence.</h2><p>The cloud pilot has an accepted result. Now we need the actual outreach record and substantive conversations to turn the prepared work into a commercial next step.</p></div>
      <div className={s.briefAside}><span className={s.kicker}>ONE PLACE TO UPDATE</span><strong>What changed or should wait?</strong><p>Add a note or move a task to later in the private Operating Room.</p><a href={updatesDeskUrl()}>Open Updates →</a></div>
    </section>
    <nav className={s.quickNav} aria-label="Operating room questions"><a href="#milestones"><span>01</span>How close are we?</a><a href="#needs-you"><span>02</span>What needs me?</a><a href="#blockers"><span>03</span>What is blocked?</a><a href="#activity"><span>04</span>What changed?</a></nav>
    <div className={s.sourceStrip}><span><i className={fresh === 'recent' ? s.dot : s.dotWarning}/>{fresh === 'recent' ? 'Board read' : 'Board snapshot needs refresh'} · {recordedTime(room.checked_at)}</span>{lastBoardChange && <span>Last task change: {recordedTime(lastBoardChange)}</span>}<span>Cloud: {cloud.connection === 'connected' ? latestRun ? 'latest draft ' + latestRun.status : 'no run recorded' : 'live status unavailable'}</span><Link href="/hq?view=systems">Sources & system status ↗</Link></div>
    <SourceConnection cloud={cloud} compact/><section id="milestones" className={s.anchor}><SectionTitle number="01" title="Progress toward the next milestone" href="/hq?view=milestones" action="Milestones & criteria"/><Milestones control={control} room={room}/></section>
    <NeedsOday control={control} room={room} compact/>
    <div className={s.activityWrap}><Activity events={events} compact/></div>
    <Blockers control={control}/><WorkstreamSummary control={control}/><Feedback control={control} room={room}/><Lessons control={control} compact/>
    <p className={s.fine}>Board counts and review status use the signed source mirror when connected, with a dated fallback if unavailable. Source reads and changes push updates; refreshing HQ reads the saved mirror. Narrative priorities, lessons and social feedback still need reviewed evidence updates. <Evidence file="operations/DASHBOARD_MAINTENANCE.md" label="How this room stays current"/></p>
  </div>
}

export function SourceConnection({ cloud, compact = false }: { cloud: CloudState; compact?: boolean }) {
  const source = cloud.snapshot?.operating.source, check = cloud.snapshot?.operating.checks[0]
  const fresh = source && Date.now() - Date.parse(source.captured_at) < 86400000
  return <section className={s.card} aria-label="Cloud source connection">
    <div className={s.cardTop}><h3>Cloud operations feed</h3><Status tone={fresh ? 'good' : 'warning'}>{source ? fresh ? 'Source received' : 'Source needs refresh' : 'Using saved fallback'}</Status></div>
    <p>Source read: {source ? recordedTime(source.captured_at) : 'No signed source received'}. Worker check: {check ? recordedTime(check.checked_at) + ' · ' + check.status.replaceAll('_', ' ') : 'No feed check recorded'}.</p>
    <p className={s.fine}>Metadata checks use zero model tokens. Luna drafts only changed, fresh evidence; pending review stops further generation. Source updates arrive when the original room is read or changed.</p>
    {!compact && <><p>Source older than 24 hours pauses generation. Delivery failure preserves the source record and retries on its next read/change. This is not continuous polling of the private source.</p><Evidence file="operations/EFFICIENT_CLOUD_LOOP.md" label="Loop charter, limits & recovery"/></>}
  </section>
}
