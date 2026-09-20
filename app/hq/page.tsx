import 'server-only'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import styles from './hq.module.css'
import { isStale, readRuntime } from './runtime'
import { RuntimePanel } from './runtime-panel'
import { RuntimeRefresh } from './runtime-refresh'
import { requireHQViewer } from '@/lib/hq/access'
import { readCloudHQ } from '@/lib/hq/cloud-reader'
import { CloudPanel } from './cloud-panel'
import { ControlHome, Milestones, NeedsOday, Activity, Feedback, Lessons, DeskEvidence, SourceConnection, type DeskResults, type Control, type Room } from './control-room'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Trace-li HQ · Company operations', robots: { index: false, follow: false } }
type Mandate = (typeof import('@/docs/hq/data/mandates.json'))[number]
type Job = (typeof import('@/docs/hq/data/jobs.json'))[number]
type Queue = (typeof import('@/docs/hq/data/queues.json'))[number]
type Decision = (typeof import('@/docs/hq/data/decisions.json'))[number]
type Event = (typeof import('@/docs/hq/data/events.json'))[number]
type Approval = (typeof import('@/docs/hq/data/approvals.json'))[number]
type Proposal = (typeof import('@/docs/hq/data/memory-proposals.json'))[number]
type Loop = (typeof import('@/docs/hq/data/loops.json'))[number]
const root = path.join(process.cwd(), 'docs/hq')
const views = [['overview','Operating Room'],['milestones','Milestones'],['needs-you','Needs Oday'],['queues','Workstreams'],['activity','Activity'],['feedback','Feedback'],['lessons','Lessons'],['systems','Systems'],['mandates','Mandates'],['jobs','Jobs'],['approvals','Approvals'],['decisions','Decisions'],['memory','Memory'],['library','Library'],['trace','Sample Trace']]
async function read<T>(name: string): Promise<T> { return JSON.parse(await readFile(path.join(root, 'data', name + '.json'), 'utf8')) }
async function documents(dir = ''): Promise<string[]> {
  const entries = await readdir(path.join(root, dir), { withFileTypes: true })
  const paths = await Promise.all(entries.map(async e => e.isDirectory() ? documents(path.join(dir,e.name)) : e.name.endsWith('.md') ? [path.join(dir,e.name)] : []))
  return paths.flat().sort()
}
function Badge({ children }: {children: React.ReactNode}) { return <span className={styles.badge}>{children}</span> }
function DocLink({file, children}: {file:string, children:React.ReactNode}) {return <Link href={'/hq?doc='+encodeURIComponent(file)}>{children}</Link>}
function JobCard({job}: {job: Job}) {return <details className={styles.job}>
  <summary><span className={styles.mono}>{job.id}</span><span>{job.objective}<small>{job.persona} · {job.approval.level} · {job.deadline_sla.active_minutes} active min after dispatch</small></span><Badge>{job.status.replaceAll('_',' ')}</Badge></summary>
  <div className={styles.detail}><p><strong>Expected output</strong> {job.expected_output.path}</p><ul>{job.acceptance_criteria.map(x=><li key={x}>{x}</li>)}</ul>
  <p><strong>Dependencies</strong> {job.dependencies.join(', ') || 'None'}</p><p><strong>Review</strong> {job.reviewer}</p>{job.blocker&&<p className={styles.alert}>{job.blocker}</p>}
  <p><strong>Result</strong> {job.result.summary || 'No accepted result yet.'}</p><p><strong>Measured cost</strong> {job.cost.actual === null ? 'Unavailable' : '$'+job.cost.actual} · No new spending authority</p>
  <details><summary>Full job contract</summary><pre>{JSON.stringify(job,null,2)}</pre></details></div>
  </details>}

export default async function HQ({searchParams}: {searchParams: Promise<Record<string,string|string[]|undefined>>}) {
  // Authorize before reading any company records, library files or runtime status.
  const viewer = await requireHQViewer()
  const query=await searchParams
  const get=(key:string)=>typeof query[key]==='string'? query[key] as string:''
  const view=views.some(v=>v[0]===get('view'))?get('view'):'overview'
  const [mandates,jobs,queues,decisions,savedEvents,approvals,proposals,loops,docs,runtime,cloud,control,savedRoom,savedDeskResults]=await Promise.all([read<Mandate[]>('mandates'),read<Job[]>('jobs'),read<Queue[]>('queues'),read<Decision[]>('decisions'),read<Event[]>('events'),read<Approval[]>('approvals'),read<Proposal[]>('memory-proposals'),read<Loop[]>('loops'),documents(),readRuntime(),readCloudHQ(),read<Control>('control-room'),read<Room>('operating-room'),read<DeskResults>('desk-results')])
  const source = cloud.snapshot?.operating.source
  const room: Room = source ? { ...savedRoom, checked_at: source.captured_at, source_kind: 'Signed Operating Room metadata', tasks: source.records.tasks, metrics: source.records.metrics, reviews: source.records.reviews } : savedRoom
  const deskResults: DeskResults = source ? { ...savedDeskResults, checked_at: source.captured_at, receipt_count: source.records.receipt_count, latest: source.records.latest } : savedDeskResults
  const events: Event[] = [...savedEvents, ...(cloud.snapshot?.operating.checks || []).map(check => ({ id: 'cloud-check-' + check.id, at: check.checked_at, actor: 'Railway / Librarian', type: 'source_check', subject: 'Cloud metadata check · ' + check.status.replaceAll('_', ' '), summary: check.model_eligible ? 'Changed source metadata qualified for a bounded draft attempt. Open Systems for the actual run result.' : 'No model call: ' + check.status.replaceAll('_', ' ') + '. Source capture time is separate from this worker check.', evidence_ref: 'operations/EFFICIENT_CLOUD_LOOP.md' }))]
  const doc=get('doc'); if(doc&&!docs.includes(doc)) notFound()
  const documentText=doc?await readFile(path.join(root,doc),'utf8'):null
  const filtered=jobs.filter(j=>(!get('owner')||j.owner===get('owner'))&&(!get('status')||j.status===get('status'))&&JSON.stringify(j).toLowerCase().includes(get('q').toLowerCase()))
  const label=doc?doc.split('/').pop()?.replace('.md','').replaceAll('_',' '):views.find(v=>v[0]===view)?.[1]
  const enabled=runtime?.schedules.filter(s=>s.status==='ACTIVE').length
  return <div className={styles.hq}><RuntimeRefresh/>
    <aside className={styles.sidebar}><Link href="/hq" className={styles.brand}>Trace-li<span>HQ</span></Link><p className={styles.eyebrow}>COMPANY OPERATIONS</p>
      <nav aria-label="HQ navigation">{views.filter(([id])=>['overview','milestones','needs-you','queues','activity','feedback','lessons','systems'].includes(id)).map(([id,title])=><Link key={id} href={'/hq?view='+id} aria-current={!doc&&view===id?'page':undefined}>{title}</Link>)}</nav><details className={styles.referenceNav} open={!!doc||['mandates','jobs','approvals','decisions','memory','library','trace'].includes(view)}><summary>Records & reference</summary><nav aria-label="HQ records">{views.filter(([id])=>['mandates','jobs','approvals','decisions','memory','library','trace'].includes(id)).map(([id,title])=><Link key={id} href={'/hq?view='+id} aria-current={!doc&&view===id?'page':undefined}>{title}</Link>)}</nav></details>
      <div className={styles.sidebarBottom}><p><strong>Oday</strong><br/>Founder</p><p><strong>Supervisor</strong><br/>Mandates & review</p><Link href="/">Open Trace-li ↗</Link></div>
    </aside>
    <main className={styles.main}>
      <header className={styles.top}><div><p className={styles.eyebrow}>TRACE-LI HQ / {doc?'LIBRARY':'PORTFOLIO'}</p><h1>{label}</h1></div><div className={styles.snapshot}><Badge>{viewer.mode === 'local' ? 'Local review' : 'Private owner access'}</Badge><p>Page refreshed · {new Date().toLocaleTimeString('en-GB',{timeZone:'Africa/Cairo',hour:'2-digit',minute:'2-digit'})} Cairo</p><a href={'/hq'+(doc?'?doc='+encodeURIComponent(doc):'?view='+view)}>Refresh records</a></div></header>
      {view==='systems'&&<div className={styles.notice}>{runtime ? `${enabled} desktop schedules ${isStale(runtime.checked_at) ? 'enabled at last check' : 'enabled'} · Supervised internal work` : 'Desktop schedule status unavailable'} · Consequential actions require Oday’s approval</div>}
      {documentText!==null?<article className={styles.document}><p><Link href="/hq?view=library">← Library</Link></p><pre>{documentText.split(/(\[[^\]]+\]\([^)]+\))/g).map((part,index)=>{
        const match=part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if(!match)return part
        if(/^https?:\/\//.test(match[2]))return <a key={index} href={match[2]} target="_blank" rel="noopener noreferrer">{match[1]}</a>
        const target=path.posix.normalize(path.posix.join(path.posix.dirname(doc),match[2]))
        return docs.includes(target)?<DocLink key={index} file={target}>{match[1]}</DocLink>:part
      })}</pre></article>:<>
      {view==='overview'&&<ControlHome control={control} room={room} events={events} cloud={cloud}/>}
      {view==='milestones'&&<><p className={styles.intro}>Outcome targets and evidence gates. Prepared artifacts do not count as buyer progress.</p><Milestones control={control} room={room}/></>}
      {view==='needs-you'&&<NeedsOday control={control} room={room}/>}
      {view==='activity'&&<Activity events={events}/>}
      {view==='feedback'&&<Feedback control={control} room={room}/>}
      {view==='lessons'&&<Lessons control={control}/>}
      {view==='systems'&&<><SourceConnection cloud={cloud}/><CloudPanel state={cloud}/><DeskEvidence results={deskResults}/><RuntimePanel runtime={runtime}/><section className={styles.panel}><h2>Business and social evidence</h2><p>The operating overview uses {source ? 'signed metadata captured' : 'a saved fallback snapshot read'} from the original Operating Room on {new Date(room.checked_at).toLocaleString('en-GB',{timeZone:'Africa/Cairo'})} Cairo. Source reads and changes push metadata to HQ. A daily cloud check does not reread the private source. LinkedIn and X analytics are not connected.</p><DocLink file="operations/DASHBOARD_MAINTENANCE.md">Sources, freshness and update procedure →</DocLink></section><section className={styles.panel}><h2>Mandate routines</h2><p>Routine definitions and verified execution are separate records.</p>{loops.map(l=><div className={styles.event} key={l.id}><Badge>{l.state}</Badge><div><strong>{l.name}</strong><p>{l.trigger}</p><small>{l.owner}</small></div></div>)}</section></>}
      {view==='mandates'&&<><p className={styles.intro}>Durable mandates, replaceable personas. Each card opens its objective, constraints and handoffs.</p><div className={styles.mandates}>{mandates.map((m,i)=><details className={styles.mandate} key={m.id}><summary><span className={styles.mono}>0{i+1} / {m.persona}</span><h2>{m.name}</h2><p>{m.objective}</p><Badge>{jobs.some(j=>j.owner===m.id&&j.status==='running')?'Job running':'Chartered'}</Badge></summary><div className={styles.detail}><p><strong>Thesis</strong> {m.thesis}</p><p><strong>Memory</strong> {m.memory}</p><p><strong>Tools</strong> {m.tools.join('; ')}</p><p><strong>Forbidden</strong> {m.forbidden.join('; ')}</p><p><strong>KPIs</strong></p><ul>{m.kpis.map(k=><li key={k}>{k}</li>)}</ul><p><strong>Prepared loops</strong></p><ul>{m.triggers.map(k=><li key={k}>{k}</li>)}</ul><p>{m.escalation}</p><DocLink file={m.charter}>Read complete charter →</DocLink><p><Link href={'/hq?view=jobs&owner='+m.id}>Open mandate jobs</Link></p><small>Performance baseline: unknown · Spending follows the mandate and any approved pilot supplement</small></div></details>)}</div></>}
      {view==='queues'&&<>{queues.map(q=><section className={styles.panel} key={q.id} id={'stream-'+q.id}><div className={styles.sectionTitle}><h2><span className={styles.queueLetter}>{q.id}</span>{q.title}</h2><Badge>Active queue</Badge></div><p>{q.objective}</p><p className={styles.muted}>{q.handoff}</p>{jobs.filter(j=>j.workstream===q.id).map(j=><JobCard key={j.id} job={j}/>)}<p className={styles.small}>{q.rules}</p></section>)}</>}
      {view==='jobs'&&<><form className={styles.filters} action="/hq"><input type="hidden" name="view" value="jobs"/><label>Search<input name="q" defaultValue={get('q')} placeholder="Objective, evidence or job ID"/></label><label>Mandate<select name="owner" defaultValue={get('owner')}><option value="">All mandates</option>{mandates.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label><label>Status<select name="status" defaultValue={get('status')}><option value="">All statuses</option>{['ready','running','review','changes_requested','accepted','blocked','failed','awaiting_approval'].map(s=><option key={s}>{s}</option>)}</select></label><button>Apply filters</button><Link href="/hq?view=jobs">Clear</Link></form><p>{filtered.length} jobs match</p><section className={styles.panel}>{filtered.length?filtered.map(j=><JobCard key={j.id} job={j}/>):<p>No jobs match. Clear the filters to see the full queue.</p>}</section></>}
      {view==='approvals'&&<><p className={styles.intro}>Approval is specific to an action, artifact, audience and expiry. These packets are incomplete. This review shell cannot approve or execute them.</p>{approvals.map(a=><section key={a.id} className={styles.panel}><Badge>{a.level} · {a.status.replaceAll('_',' ')}</Badge><h2>{a.action}</h2><p>{a.reason}</p><p>Decision owner: {a.owner} · Related job: {a.job}</p><button disabled>Awaiting complete action packet</button></section>)}<DocLink file="AGENT_CONSTITUTION.md">Read Green / Amber / Red rules →</DocLink></>}
      {view==='decisions'&&<section className={styles.panel}>{decisions.map(d=><details key={d.id} className={styles.decision}><summary><span className={styles.mono}>{d.id}</span><strong>{d.decision}</strong><Badge>{d.status}</Badge></summary><div className={styles.detail}><p>{d.rationale}</p><p><strong>Authority</strong> {d.authority} · {d.approval_level} · {d.scope}</p><p><strong>Consequences</strong> {d.consequences.join(' ')}</p><p><strong>Evidence</strong> {d.evidence_refs.join(', ')}</p><p><strong>Review trigger</strong> {d.review_trigger}</p><small>Recorded {d.recorded_at}; original decision date {d.decided_at || 'not recorded'}. {d.execution_authorized?'Limited internal implementation authorized.':'No specific future execution authorized.'}</small></div></details>)}</section>}
      {view==='memory'&&<><section className={styles.panel}><h2>Durable storage foundation</h2><p>Postgres stores scoped cloud jobs, worker attempts, immutable drafts and review status in the managed preview database. The business overview uses a dated snapshot of the original Operating Room; canonical company memory still requires review and promotion.</p><DocLink file="POSTGRES_FOUNDATION.md">Read the storage foundation and rollout →</DocLink><p><DocLink file="QM_ASSESSMENT.md">Read the QM worker assessment →</DocLink></p></section><div className={styles.metrics}>{[['Company','Canonical policy & positioning'],['Mandate','Methods & performance'],['Case / project','Scoped evidence & chronology'],['Decision Ledger','Authority & supersession']].map(([t,s])=><div key={t}><h3>{t}</h3><p>{s}</p></div>)}</div><section className={styles.panel}><h2>Promotion inbox</h2><p>Worker proposal → Librarian checks sources and conflicts → Supervisor approves exact diff → canonical change event.</p>{proposals.map(p=><div className={styles.exception} key={p.id}><Badge>{p.status}</Badge><h3>{p.summary}</h3><p>{p.diff}</p><small>{p.scope} · {p.reviewer} · {p.canonical_write}</small></div>)}</section><p>No private customer memory has been imported. Agent drafts do not become company facts automatically.</p></>}
      {view==='library'&&<section className={styles.panel}><h2>Operating package</h2><p>Constitution, charters, work queues, implementation contracts and reviewable outputs.</p><div className={styles.library}>{docs.filter(d=>!d.startsWith('memory/mandates/')).map(d=><DocLink key={d} file={d}>{d.replaceAll('_',' ').replace('.md','')}</DocLink>)}</div></section>}
      {view==='trace'&&<article className={styles.trace}><div className={styles.sectionTitle}><Badge>Fictional discovery sample</Badge><span className={styles.mono}>FIC-TRACE-001 / v1</span></div><h2>The purchase is recorded.<br/>The comparison is still missing.</h2><p>Example transaction: purchase of field storage equipment. All names, rules and records below are invented for the walkthrough.</p><div className={styles.traceConclusion}><span>REVIEW CONCLUSION</span><h3>The available record does not yet support closing the procurement review.</h3><p>The fictional rule requires a comparison record. The sample contains an order and approval note, but no comparison. This is an evidence gap, not a misconduct finding.</p></div>
      <ol className={styles.chain}><li><h3>Obligation</h3><details><summary>Open fictional policy · §3.2</summary><p>“Record the comparison and rationale before closing the review.” Invented sample policy v1. This is not a donor or legal requirement.</p></details></li><li><h3>Approval</h3><details><summary>Open fictional approval · NOTE-01</summary><p>Sample operations reviewer approved the purchase request on 10 September 2026. The note does not include a comparison or establish that the review was complete.</p></details></li><li><h3>Supporting evidence</h3><details><summary>Open fictional order · PO-001</summary><p>Order: field storage equipment, example amount 1,200 units of fictional currency. Recorded 11 September 2026. This example proves only what its invented order record says.</p></details></li><li><h3>Missing evidence</h3><p>Comparison and rationale · owner: procurement reviewer · due: unagreed.</p><details><summary>Preview missing-evidence request</summary><p>“Please attach the comparison used for this purchase, or record why it was not required, with the applicable rule.” Draft only; no message is sent.</p></details></li><li><h3>Unresolved exception</h3><p>Was an exception permitted and approved? Unknown. A reviewer must attach evidence before resolving this question.</p></li></ol>
      <div className={styles.columns}><section><h3>Recipient scope</h3><p>Local fictional walkthrough only. No access grant, expiry enforcement or external sharing is active.</p><DocLink file="specs/TRACE_AND_SHARING.md">Read the secure sharing requirements</DocLink></section><section><h3>Trace another transaction</h3><p>In discovery: name the next transaction and the role who would need its evidence. No request is submitted from this sample.</p><DocLink file="specs/TRACE_AND_SHARING.md">Open the discovery test</DocLink></section></div><footer>Prepared 14 September 2026 · Fictional sources · No byte-integrity verification, reviewer certification or real customer evidence.</footer></article>}
      </>}
      <footer className={styles.footer}>Trace-li HQ · Charters govern work. Evidence governs acceptance. Oday governs consequential action.</footer>
    </main>
  </div>
}
