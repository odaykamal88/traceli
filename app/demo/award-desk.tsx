'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { Lock } from 'lucide-react'
import {
  agentDraftReason,
  awardDeskDecisions,
  awardDeskScenario,
  awardDeskSlug,
  awardDeskStorageKey,
  decisionCopy,
  defaultAwardDeskDisposition,
  sanitizeDisposition,
  type AwardDeskDecisionId,
  type AwardDeskDisposition,
} from '@/lib/award-desk'
import s from './award-desk.module.css'

export type AwardDeskScreen = 'desk' | 'award' | 'disposition' | 'record'
type AwardDeskPreset = 'request' | 'edit' | 'now'
type AwardDeskNotice = 'workspace' | 'auth' | null

type Props = {
  screen: AwardDeskScreen
  notice?: AwardDeskNotice
  preset?: AwardDeskPreset
}

function noticeFromParams(params: URLSearchParams): AwardDeskNotice {
  if (params.get('workspace') === 'unavailable') return 'workspace'
  if (params.get('auth') === 'unavailable') return 'auth'
  return null
}

function presetFromParams(params: URLSearchParams): AwardDeskPreset | undefined {
  const preset = params.get('preset')
  return preset === 'request' || preset === 'edit' || preset === 'now' ? preset : undefined
}

const awardHref = `/demo/${awardDeskSlug}`

function emphasize(text: string, emphasis: string | null) {
  if (!emphasis) return text
  const index = text.indexOf(emphasis)
  if (index < 0) return text
  return <>{text.slice(0, index)}<strong>{emphasis}</strong>{text.slice(index + emphasis.length)}</>
}

function readStored(): AwardDeskDisposition | null {
  try {
    const raw = sessionStorage.getItem(awardDeskStorageKey)
    if (!raw) return null
    return sanitizeDisposition(JSON.parse(raw) as { decision: string; reason: string })
  } catch {
    return null
  }
}

function writeStored(value: AwardDeskDisposition) {
  sessionStorage.setItem(awardDeskStorageKey, JSON.stringify(value))
}

function noticeCopy(notice: 'workspace' | 'auth' | null) {
  if (notice === 'workspace') return 'The protected workspace is not available in this environment. This public desk uses fictional data only.'
  if (notice === 'auth') return 'Sign-in is not available here. Continue on this public desk with fictional data.'
  return null
}

export function AwardDeskFromQuery({ screen }: { screen: AwardDeskScreen }) {
  const searchParams = useSearchParams()
  return <AwardDesk screen={screen} notice={noticeFromParams(searchParams)} preset={presetFromParams(searchParams)} />
}

export default function AwardDesk({ screen, notice = null, preset }: Props) {
  const router = useRouter()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const reasonRef = useRef<HTMLTextAreaElement>(null)
  const reasonId = useId()
  const [decision, setDecision] = useState<AwardDeskDecisionId>('request')
  const [reason, setReason] = useState(agentDraftReason)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [recorded, setRecorded] = useState<AwardDeskDisposition>(defaultAwardDeskDisposition)

  useEffect(() => {
    headingRef.current?.focus()
  }, [screen])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && screen !== 'desk') router.push('/demo')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router, screen])

  useEffect(() => {
    if (screen !== 'disposition') return
    setError('')
    if (preset === 'request' || preset === 'edit' || !reason.trim()) setReason(agentDraftReason)
    if (preset === 'request' || preset === 'edit' || preset === 'now') setDecision('request')
    if (preset === 'edit') {
      const id = window.setTimeout(() => {
        reasonRef.current?.focus()
        const value = reasonRef.current?.value ?? ''
        reasonRef.current?.setSelectionRange(value.length, value.length)
      }, 50)
      return () => window.clearTimeout(id)
    }
  }, [preset, screen])

  useEffect(() => {
    if (screen !== 'record') return
    setRecorded(readStored() ?? defaultAwardDeskDisposition)
  }, [screen])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(''), 2200)
    return () => window.clearTimeout(id)
  }, [toast])

  function confirmDisposition() {
    setError('')
    try {
      const next = sanitizeDisposition({ decision, reason })
      writeStored(next)
      setRecorded(next)
      router.push(`${awardHref}/record`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The disposition could not be recorded.')
    }
  }

  async function copyLink() {
    const url = `${window.location.origin}${awardHref}/record`
    try {
      await navigator.clipboard.writeText(url)
      setToast('Link copied')
    } catch {
      setToast('Copy the address bar — clipboard is blocked here')
    }
  }

  const banner = noticeCopy(notice)
  const recordedCopy = decisionCopy(recorded.decision)

  return (
    <div className={s.shell} data-testid="award-desk" data-screen={screen}>
      <a className={s.skip} href="#award-desk-main">Skip to award desk</a>
      <header className={s.topbar}>
        <Link className={s.wordmark} href="/">Traceli</Link>
        <div className={s.topbarMeta}>
          <span>Award desk</span>
          <span className={s.dot} aria-hidden="true" />
          <span>Demo</span>
        </div>
      </header>
      {banner && <p className={s.notice} role="status">{banner}</p>}
      <main id="award-desk-main" tabIndex={-1} className={s.main}>
        {screen === 'desk' && (
          <section className={s.screen} aria-labelledby="desk-title">
            <div className={s.greeting}>
              <h1 id="desk-title" ref={headingRef} tabIndex={-1} data-testid="desk-greeting">{`Good morning, ${awardDeskScenario.reviewer.firstName}.`}</h1>
              <p className={s.time}>{awardDeskScenario.reviewer.greetingTime} · {awardDeskScenario.reviewer.locale}</p>
            </div>
            <article className={`${s.card} ${s.primaryCard}`}>
              <div className={s.cardLabel} data-testid="needs-reconstruction"><span className={s.pulse} aria-hidden="true" /> Needs reconstruction</div>
              <h2>{awardDeskScenario.title}</h2>
              <p className={s.rfpId}>{awardDeskScenario.rfp}</p>
              <p className={s.stakes}>{awardDeskScenario.stakes}</p>
              <Link className={`${s.btn} ${s.btnPrimary}`} href={awardHref}>Open award desk</Link>
            </article>
            <div className={s.secondaryRows}>
              {awardDeskScenario.quietRows.map(row => (
                <div className={s.rowQuiet} key={row.title}>
                  <span>{row.title}</span>
                  <span className={s.statusTag}><Lock size={12} strokeWidth={1.75} aria-hidden="true" /> {row.status}</span>
                </div>
              ))}
            </div>
            <p className={s.demoNote}>
              {awardDeskScenario.disclaimer} · <Link href="/method">How Trace reasons</Link>
            </p>
          </section>
        )}

        {screen === 'award' && (
          <section className={s.screen} aria-labelledby="award-title">
            <div className={s.backLink}>
              <Link className={`${s.btn} ${s.btnGhost}`} href="/demo">← Desk</Link>
            </div>
            <div className={s.deskLayout}>
              <aside className={s.metaPanel}>
                <p className={s.eyebrow}>Award</p>
                <dl>
                  <div className={s.metaBlock}><dt>RFP</dt><dd>{awardDeskScenario.rfp}</dd></div>
                  <div className={s.metaBlock}><dt>Supplier</dt><dd>{awardDeskScenario.supplier}</dd></div>
                  <div className={s.metaBlock}><dt>Owner</dt><dd>{awardDeskScenario.owner}</dd></div>
                  <div className={s.metaBlock}><dt>Title</dt><dd>{awardDeskScenario.title}</dd></div>
                </dl>
              </aside>
              <div>
                <div className={s.statusPill}><span className={s.dotLive} aria-hidden="true" /> Human decision required</div>
                <div className={s.sectionHead}>
                  <h2 id="award-title" ref={headingRef} tabIndex={-1}>Agent overnight prep</h2>
                  <span className={s.sub}>{awardDeskScenario.agentWindow}</span>
                </div>
                <ol className={s.timeline} data-testid="agent-timeline">
                  {awardDeskScenario.timeline.map(item => (
                    <li key={item.time}>
                      <span className={s.node} aria-hidden="true" />
                      <div className={s.ts}>{item.time}</div>
                      <div className={s.work}>
                        {emphasize(item.work, item.emphasis)}
                        {item.gap && <span className={s.tagGap}>gap</span>}
                      </div>
                    </li>
                  ))}
                </ol>
                <div className={s.splitPanels}>
                  <div className={`${s.panel} ${s.panelShow}`}>
                    <div className={s.panelTitle}>What the file can show</div>
                    <p>Requirement {awardDeskScenario.requirement.id} — {awardDeskScenario.requirement.title.toLowerCase()}</p>
                    <p className={s.reqSnippet}>“{awardDeskScenario.requirement.text}”</p>
                    <ul>
                      {awardDeskScenario.fileCanShow.map(item => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div className={`${s.panel} ${s.panelNeed}`}>
                    <div className={s.panelTitle}>What still needs you</div>
                    <ul>
                      <li>{awardDeskScenario.stillNeeds[0]}</li>
                      <li className={s.or}>— or —</li>
                      <li>{awardDeskScenario.stillNeeds[1]}</li>
                    </ul>
                  </div>
                </div>
                <div className={s.actions}>
                  <Link className={`${s.btn} ${s.btnPrimary}`} href={`${awardHref}/disposition?preset=request`}>Accept agent draft &amp; request evidence</Link>
                  <Link className={`${s.btn} ${s.btnSecondary}`} href={`${awardHref}/disposition?preset=edit`}>Edit draft</Link>
                  <Link className={`${s.btn} ${s.btnGhost}`} href={`${awardHref}/disposition?preset=now`}>Record disposition now</Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {screen === 'disposition' && (
          <section className={s.screen} aria-labelledby="disposition-title">
            <div className={s.backLink}>
              <Link className={`${s.btn} ${s.btnGhost}`} href={awardHref}>← Award desk</Link>
            </div>
            <div className={`${s.card} ${s.formCard}`} data-testid="disposition-form">
              <p className={s.eyebrow}>{awardDeskScenario.rfp}</p>
              <h1 id="disposition-title" ref={headingRef} tabIndex={-1}>Record disposition</h1>
              <p className={s.lead}>Your judgment becomes part of the decision record. The agent draft is a starting point — edit freely.</p>
              {error && <p className={s.error} role="alert">{error}</p>}
              <div className={s.field}>
                <span className={s.fieldLabel} id="decision-label">Decision</span>
                <div className={s.radioGroup} role="radiogroup" aria-labelledby="decision-label">
                  {awardDeskDecisions.map(option => (
                    <label key={option.id} className={`${s.radioOption} ${decision === option.id ? s.radioSelected : ''}`}>
                      <input
                        type="radio"
                        name="decision"
                        value={option.id}
                        checked={decision === option.id}
                        onChange={() => setDecision(option.id)}
                      />
                      <div>
                        <div className={s.optLabel}>{option.label}</div>
                        <div className={s.optHint}>{option.hint}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className={s.field}>
                <label className={s.fieldLabel} htmlFor={reasonId}>Reason</label>
                <textarea
                  id={reasonId}
                  ref={reasonRef}
                  className={s.textarea}
                  value={reason}
                  onChange={event => setReason(event.target.value)}
                  minLength={20}
                  maxLength={2000}
                  spellCheck
                  aria-describedby="reason-help"
                />
                <p id="reason-help" className={s.demoNote}>Use fictional information only. 20–2,000 characters. Kept in this browser tab.</p>
              </div>
              <div className={s.actions}>
                <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={confirmDisposition}>Confirm disposition</button>
                <Link className={`${s.btn} ${s.btnGhost}`} href={awardHref}>Cancel</Link>
              </div>
            </div>
          </section>
        )}

        {screen === 'record' && (
          <section className={`${s.screen} ${s.record}`} aria-labelledby="record-title" data-testid="decision-record">
            <div className={s.recordHeader}>
              <p className={s.eyebrow}>Shareable record</p>
              <h1 id="record-title" ref={headingRef} tabIndex={-1}>Decision record · {awardDeskScenario.rfp}</h1>
              <div className={s.recordStatus}><span className={s.bar} aria-hidden="true" /> {recordedCopy.recordStatus}</div>
            </div>
            <div className={s.recordSection}>
              <h3>Requirement</h3>
              <p><strong>{awardDeskScenario.requirement.id} — {awardDeskScenario.requirement.title}</strong></p>
              <p className={s.muted}>“{awardDeskScenario.requirement.text}”</p>
            </div>
            <div className={s.recordSection}>
              <h3>Evidence state</h3>
              <p>{awardDeskScenario.packet.linked} of {awardDeskScenario.packet.total} packet items linked ({awardDeskScenario.packet.percent}%).</p>
              <p>Linked: {awardDeskScenario.packet.linkedItems.join(', ')}.</p>
              <p>Gap: {awardDeskScenario.packet.gap}.</p>
            </div>
            <div className={s.recordSection}>
              <h3>Agent prep summary</h3>
              <p>Overnight run linked Req 07, scored packet completeness, flagged the Ethiopia gap, and drafted a disposition note for the human reviewer.</p>
              <p className={s.who}>Agent prep · {awardDeskScenario.agentRange}</p>
            </div>
            <div className={s.recordSection}>
              <h3>Human disposition</h3>
              <p><strong>{recordedCopy.label}</strong></p>
              <p data-testid="recorded-reason">{recorded.reason}</p>
              <p className={s.who}>{recorded.recordedAtLabel}</p>
            </div>
            <div className={s.recordActions}>
              <button type="button" className={`${s.btn} ${s.btnMint}`} onClick={copyLink}>Copy link</button>
              <button type="button" className={`${s.btn} ${s.btnSecondary}`} onClick={() => setToast('PDF export is not included in this public demo')}>Download PDF</button>
              <Link className={`${s.btn} ${s.btnGhost}`} href="/demo">Back to desk</Link>
            </div>
            <p className={s.tinyFooter}>
              Fictional demo · {awardDeskScenario.caveats[2]} · <Link href="/method">How Trace reasons</Link>
            </p>
          </section>
        )}
      </main>
      <div className={`${s.toast} ${toast ? s.toastShow : ''}`} role="status" aria-live="polite">{toast}</div>
    </div>
  )
}
