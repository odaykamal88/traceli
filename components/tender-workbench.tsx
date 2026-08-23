'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Copy,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileLock2,
  FileText,
  Filter,
  GitBranch,
  HelpCircle,
  History,
  LayoutDashboard,
  Link2,
  Lock,
  MessageSquareText,
  PanelRight,
  RefreshCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  WandSparkles,
  X,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  baseAuditEvents,
  defaultScenario,
  draftingSources,
  governingSources,
  modelLedger,
  portfolioCases,
  requirements,
  scenarioOptions,
  suppliers,
  type AuditCategory,
  type AuditEvent,
  type Scenario,
  type Tone,
} from '@/lib/traceli-demo-data'

type View =
  | 'demo'
  | 'portfolio'
  | 'draft'
  | 'overview'
  | 'golden'
  | 'submissions'
  | 'requirements'
  | 'clarifications'
  | 'audit'
  | 'rules'
  | 'models'

type WhySubject = 'requirement' | 'exception' | 'source' | 'coverage' | 'governance'

type Drawer =
  | { type: 'evidence' }
  | { type: 'why'; subject: WhySubject }
  | { type: 'clarification' }
  | { type: 'decision' }
  | { type: 'event'; eventId: string }
  | { type: 'settings' }
  | null

type NavigationItem = {
  id: View
  label: string
  icon: LucideIcon
}

const navigation: Array<{ label: string; items: NavigationItem[] }> = [
  {
    label: 'Assurance portfolio',
    items: [
      { id: 'portfolio', label: 'Portfolio home', icon: BriefcaseBusiness },
      { id: 'draft', label: 'Plan & draft', icon: WandSparkles },
    ],
  },
  {
    label: 'Active procurement',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'golden', label: 'Golden thread', icon: GitBranch },
      { id: 'submissions', label: 'Submissions', icon: FileCheck2 },
      { id: 'requirements', label: 'Requirements', icon: ClipboardCheck },
      { id: 'clarifications', label: 'Clarifications', icon: MessageSquareText },
      { id: 'audit', label: 'Audit trail', icon: History },
      { id: 'rules', label: 'Governing rules', icon: BookOpen },
    ],
  },
  {
    label: 'Administration',
    items: [{ id: 'models', label: 'Model ledger', icon: Database }],
  },
]

const auditFilters: Array<'All' | AuditCategory> = [
  'All',
  'Human action',
  'Traceli finding',
  'Approval',
  'Policy change',
  'Supplier event',
]

function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  const styles: Record<Tone, string> = {
    neutral: 'bg-secondary text-muted-foreground',
    teal: 'bg-accent text-accent-foreground',
    amber: 'bg-[#f2e3b8] text-[#6f4d0f]',
    blue: 'bg-[#dce7ee] text-primary',
    ink: 'bg-primary text-primary-foreground',
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold', styles[tone])}>
      {children}
    </span>
  )
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">{children}</p>
}

function SourceLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-left font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {children}
      <ExternalLink className="size-3" aria-hidden="true" />
    </button>
  )
}

export default function TenderWorkbench() {
  const [view, setView] = useState<View>('demo')
  const [drawer, setDrawer] = useState<Drawer>(null)
  const [scenario, setScenario] = useState<Scenario>(defaultScenario)
  const [clarificationReceived, setClarificationReceived] = useState(false)
  const [approvalsRemaining, setApprovalsRemaining] = useState(2)
  const [declarationOutstanding, setDeclarationOutstanding] = useState(true)
  const [decisionLocked, setDecisionLocked] = useState(false)
  const [query, setQuery] = useState('')
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'missing' | 'clarification' | 'owner'>('all')
  const [auditFilter, setAuditFilter] = useState<'All' | AuditCategory>('All')
  const [notice, setNotice] = useState('')
  const [draftText, setDraftText] = useState(
    'The supplier shall demonstrate the capacity to deliver emergency shelter kits within 72 hours in each named country, supported by warehouse, partner or distribution-plan evidence.',
  )
  const [policyChecked, setPolicyChecked] = useState(true)
  const [humanApproved, setHumanApproved] = useState(false)
  const [criteriaLocked, setCriteriaLocked] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const next = { ...defaultScenario }

    if (scenarioOptions.organization.includes(params.get('org') as Scenario['organization'])) {
      next.organization = params.get('org') as Scenario['organization']
    }
    if (scenarioOptions.procurement.includes(params.get('mode') as Scenario['procurement'])) {
      next.procurement = params.get('mode') as Scenario['procurement']
    }
    if (scenarioOptions.policy.includes(params.get('policy') as Scenario['policy'])) {
      next.policy = params.get('policy') as Scenario['policy']
    }
    if (scenarioOptions.geography.includes(params.get('geo') as Scenario['geography'])) {
      next.geography = params.get('geo') as Scenario['geography']
    }
    if (scenarioOptions.currency.includes(params.get('currency') as Scenario['currency'])) {
      next.currency = params.get('currency') as Scenario['currency']
    }
    if (scenarioOptions.role.includes(params.get('role') as Scenario['role'])) {
      next.role = params.get('role') as Scenario['role']
    }

    setScenario(next)
  }, [])

  useEffect(() => {
    if (!drawer) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawer(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [drawer])

  const evidenceCoverage = clarificationReceived ? 100 : 86
  const blockerCount = (clarificationReceived ? 0 : 1) + approvalsRemaining + (declarationOutstanding ? 1 : 0)
  const readinessState = decisionLocked ? 'Decision locked' : blockerCount === 0 ? 'Ready to lock' : 'Blocked'
  const decisionState = decisionLocked ? 'Locked' : blockerCount === 0 ? 'Ready to lock' : 'Draft'

  const readinessDetail = decisionLocked
    ? 'Locked record · chronology sealed'
    : blockerCount === 0
      ? 'All evidence and human controls resolved'
      : `${blockerCount} blocker${blockerCount === 1 ? '' : 's'} · ${[
          clarificationReceived ? null : '1 evidence gap',
          approvalsRemaining ? `${approvalsRemaining} approval${approvalsRemaining === 1 ? '' : 's'}` : null,
          declarationOutstanding ? '1 declaration' : null,
        ]
          .filter(Boolean)
          .join(', ')}`

  const auditEvents = useMemo(() => {
    const events = [...baseAuditEvents]
    if (clarificationReceived) {
      events.push(
        {
          id: 'evt-06',
          time: '19 Aug · 09:26',
          title: 'Clarification response received and attached',
          actor: 'Northstar Relief · supplier',
          category: 'Supplier event',
          source: 'CLR-004-R1 · Ethiopia distribution plan',
          snapshot: 'Addis Ababa partner agreement and 72-hour distribution plan attached to REQ-07.',
        },
        {
          id: 'evt-07',
          time: '19 Aug · 09:41',
          title: 'REQ-07 marked satisfied after human review',
          actor: 'Sarah Ahmed · reviewer',
          category: 'Human action',
          source: 'REQ-07 · determination v3',
          snapshot: 'Reviewer confirmed that the attached Ethiopia plan satisfies the geographic-capacity obligation.',
        },
      )
    }
    if (approvalsRemaining === 0 && !declarationOutstanding) {
      events.push({
        id: 'evt-08',
        time: '19 Aug · 10:12',
        title: 'Panel approvals and conflict declarations completed',
        actor: 'Amina Malik · panel chair',
        category: 'Approval',
        source: 'Panel sign-off register · v5',
        snapshot: 'Two panel approvals recorded and the final conflict-of-interest declaration signed.',
      })
    }
    if (decisionLocked) {
      events.push({
        id: 'evt-09',
        time: '19 Aug · 10:18',
        title: 'Decision record locked',
        actor: 'Amina Malik · procurement director',
        category: 'Approval',
        source: 'Decision record DR-041 · hash 84f3…c91a',
        snapshot: 'The record was locked after evidence coverage reached 100% and all human controls were completed.',
      })
    }
    return events
  }, [approvalsRemaining, clarificationReceived, decisionLocked, declarationOutstanding])

  const visibleAuditEvents = useMemo(
    () => (auditFilter === 'All' ? auditEvents : auditEvents.filter((event) => event.category === auditFilter)),
    [auditEvents, auditFilter],
  )

  const queryString = useMemo(() => {
    return new URLSearchParams({
      org: scenario.organization,
      mode: scenario.procurement,
      policy: scenario.policy,
      geo: scenario.geography,
      currency: scenario.currency,
      role: scenario.role,
    }).toString()
  }, [scenario])

  const navigate = (nextView: View) => {
    setView(nextView)
    setDrawer(null)
    window.scrollTo(0, 0)
  }

  const resetDemo = () => {
    navigate('demo')
    setClarificationReceived(false)
    setApprovalsRemaining(2)
    setDeclarationOutstanding(true)
    setDecisionLocked(false)
    setQuery('')
    setSubmissionFilter('all')
    setAuditFilter('All')
    setDraftText(
      'The supplier shall demonstrate the capacity to deliver emergency shelter kits within 72 hours in each named country, supported by warehouse, partner or distribution-plan evidence.',
    )
    setPolicyChecked(true)
    setHumanApproved(false)
    setCriteriaLocked(false)
    setNotice('')
  }

  const receiveClarification = () => {
    setClarificationReceived(true)
    navigate('overview')
    setNotice('Clarification attached: REQ-07, evidence coverage and audit chronology updated together.')
  }

  const completeSignOff = () => {
    setApprovalsRemaining(0)
    setDeclarationOutstanding(false)
    setDrawer({ type: 'decision' })
    setNotice('Human approvals and the final declaration are recorded. The decision record is ready to lock.')
  }

  const lockDecision = () => {
    setDecisionLocked(true)
    navigate('audit')
    setNotice('Decision record locked. The immutable event is now visible in the audit chronology.')
  }

  const openExampleAuditRecord = () => {
    setClarificationReceived(true)
    setApprovalsRemaining(0)
    setDeclarationOutstanding(false)
    setDecisionLocked(true)
    navigate('audit')
  }

  const updateScenario = <K extends keyof Scenario>(key: K, value: Scenario[K]) => {
    setScenario((current) => ({ ...current, [key]: value }))
    setNotice('Buyer scenario updated locally. No deployment required.')
  }

  const copyScenarioLink = async () => {
    const link = `${window.location.origin}${window.location.pathname}?${queryString}`
    try {
      await navigator.clipboard.writeText(link)
      setNotice('Shareable buyer-scenario link copied.')
    } catch {
      setNotice(`Copy this scenario link: ${link}`)
    }
  }

  const openAuditEvent = (eventId: string) => setDrawer({ type: 'event', eventId })

  const caseTitle = `${scenario.procurement.startsWith('Emergency') ? 'Emergency ' : ''}Shelter & NFI Logistics — ${scenario.geography}`
  const exceptionThreshold = scenario.currency === 'EUR' ? '€150,000' : '$165,000'
  const selectedEvent = drawer?.type === 'event' ? auditEvents.find((event) => event.id === drawer.eventId) : undefined

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only z-[70] bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 lg:px-7">
          <button type="button" onClick={() => resetDemo()} className="flex items-center gap-3 text-left">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">traceli</span>
              <span className="hidden text-xs text-muted-foreground sm:block">Continuous procurement assurance</span>
            </span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <Pill tone="teal">
              <span className="size-1.5 rounded-full bg-accent-foreground" aria-hidden="true" />
              <span className="hidden sm:inline">DIHAD · 90-second story</span>
              <span className="sm:hidden">90 sec</span>
            </Pill>
            {view === 'demo' ? (
              <button
                type="button"
                onClick={() => navigate('portfolio')}
                className="hidden items-center gap-2 text-xs font-semibold text-primary hover:underline md:inline-flex"
              >
                Open live workspace
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => resetDemo()}
                  className="inline-flex items-center gap-2 bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 sm:px-4 sm:text-sm"
                >
                  <Sparkles className="size-4" aria-hidden="true" />
                  Back to story
                </button>
                <button
                  type="button"
                  onClick={() => setDrawer({ type: 'settings' })}
                  aria-label="Open DIHAD demo settings"
                  className="border border-border p-2 text-primary hover:bg-secondary"
                >
                  <Settings2 className="size-4" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        {view !== 'demo' ? <aside className="hidden w-64 shrink-0 border-r border-border px-4 py-5 lg:block">
          <div className="mb-5 border border-border bg-secondary p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Active procurement</p>
                <p className="mt-3 text-sm font-semibold leading-5">{caseTitle}</p>
              </div>
              <Pill tone={readinessState === 'Blocked' ? 'amber' : 'teal'}>{readinessState}</Pill>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">RFP-2026-041 · {scenario.organization}</p>
            <p className="mt-3 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">{readinessDetail}</p>
          </div>

          <nav aria-label="Primary navigation" className="space-y-5">
            {navigation.map((section) => (
              <div key={section.label}>
                <p className="mb-1 px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{section.label}</p>
                <div className="flex flex-col gap-1">
                  {section.items.map(({ id, label, icon: Icon }) => (
                    <button
                      type="button"
                      key={id}
                      onClick={() => navigate(id)}
                      aria-current={view === id ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 text-left text-sm',
                        view === id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-7 border border-border bg-card p-4">
            <p className="text-xs font-semibold">Governance boundary</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Traceli finds, links and challenges evidence. People determine compliance and award.</p>
            <button
              type="button"
              onClick={() => setDrawer({ type: 'why', subject: 'governance' })}
              className="mt-3 text-xs font-semibold text-primary"
            >
              Why this boundary matters
            </button>
          </div>
        </aside> : null}

        <main
          id="main-content"
          className={cn(
            'min-w-0 flex-1',
            view === 'demo' ? 'px-4 py-6 sm:px-8 lg:px-12 lg:py-10' : 'px-4 py-5 sm:px-6 lg:px-9 lg:py-7',
          )}
        >
          {view !== 'demo' ? <nav aria-label="Mobile navigation" className="-mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-border px-4 pb-3 lg:hidden">
            {navigation.flatMap((section) => section.items).map(({ id, label }) => (
              <button
                type="button"
                key={id}
                onClick={() => navigate(id)}
                aria-current={view === id ? 'page' : undefined}
                className={cn(
                  'shrink-0 px-3 py-2 text-xs font-semibold',
                  view === id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </nav> : null}

          {view !== 'demo' && view !== 'portfolio' && view !== 'draft' && view !== 'models' ? (
            <CaseHeader
              caseTitle={caseTitle}
              organization={scenario.organization}
              role={scenario.role}
              decisionState={decisionState}
              onDecision={() => setDrawer({ type: 'decision' })}
            />
          ) : null}

          {view === 'demo' ? (
            <DemoScreen
              onOpenWorkspace={() => navigate('portfolio')}
              onOpenAudit={openExampleAuditRecord}
            />
          ) : null}
          {view === 'portfolio' ? (
            <PortfolioScreen
              activeEvidenceCoverage={evidenceCoverage}
              activeReadiness={readinessState}
              activeBlocker={readinessDetail}
              policy={scenario.policy}
              role={scenario.role}
              onOpenCase={() => navigate('overview')}
              onOpenAudit={() => navigate('audit')}
              onOpenRules={() => navigate('rules')}
            />
          ) : null}
          {view === 'draft' ? (
            <PlanDraftScreen
              scenario={scenario}
              draftText={draftText}
              setDraftText={setDraftText}
              policyChecked={policyChecked}
              setPolicyChecked={setPolicyChecked}
              humanApproved={humanApproved}
              setHumanApproved={setHumanApproved}
              criteriaLocked={criteriaLocked}
              setCriteriaLocked={setCriteriaLocked}
              onSource={() => setDrawer({ type: 'why', subject: 'source' })}
              onModels={() => navigate('models')}
              setNotice={setNotice}
            />
          ) : null}
          {view === 'overview' ? (
            <OverviewScreen
              evidenceCoverage={evidenceCoverage}
              readinessState={readinessState}
              readinessDetail={readinessDetail}
              decisionState={decisionState}
              clarificationReceived={clarificationReceived}
              approvalsRemaining={approvalsRemaining}
              declarationOutstanding={declarationOutstanding}
              onNavigate={navigate}
              onCoverage={() => setDrawer({ type: 'why', subject: 'coverage' })}
              onDecision={() => setDrawer({ type: 'decision' })}
            />
          ) : null}
          {view === 'golden' ? (
            <GoldenThreadScreen
              clarificationReceived={clarificationReceived}
              onEvidence={() => setDrawer({ type: 'evidence' })}
              onWhyRequirement={() => setDrawer({ type: 'why', subject: 'requirement' })}
              onClarification={() => setDrawer({ type: 'clarification' })}
            />
          ) : null}
          {view === 'submissions' ? (
            <SubmissionsScreen
              filter={submissionFilter}
              setFilter={setSubmissionFilter}
              clarificationReceived={clarificationReceived}
              onEvidence={() => setDrawer({ type: 'evidence' })}
            />
          ) : null}
          {view === 'requirements' ? (
            <RequirementsScreen
              query={query}
              setQuery={setQuery}
              clarificationReceived={clarificationReceived}
              onWhy={() => setDrawer({ type: 'why', subject: 'requirement' })}
            />
          ) : null}
          {view === 'clarifications' ? (
            <ClarificationsScreen clarificationReceived={clarificationReceived} onReceive={receiveClarification} />
          ) : null}
          {view === 'audit' ? (
            <AuditScreen events={visibleAuditEvents} filter={auditFilter} setFilter={setAuditFilter} onOpen={openAuditEvent} />
          ) : null}
          {view === 'rules' ? (
            <RulesScreen
              policy={scenario.policy}
              threshold={exceptionThreshold}
              onWhyException={() => setDrawer({ type: 'why', subject: 'exception' })}
              onSource={() => setDrawer({ type: 'why', subject: 'source' })}
            />
          ) : null}
          {view === 'models' ? <ModelLedgerScreen /> : null}
        </main>
      </div>

      <div aria-live="polite" className="pointer-events-none fixed bottom-3 left-3 z-[60] max-w-sm sm:bottom-5 sm:left-5">
        {notice && view !== 'demo' ? <div className="border border-primary/20 bg-primary px-4 py-3 text-xs font-medium text-primary-foreground shadow-lg">{notice}</div> : null}
      </div>

      {drawer ? (
        <DrawerFrame drawer={drawer} onClose={() => setDrawer(null)}>
          <DrawerContent
            drawer={drawer}
            clarificationReceived={clarificationReceived}
            evidenceCoverage={evidenceCoverage}
            readinessState={readinessState}
            readinessDetail={readinessDetail}
            decisionState={decisionState}
            selectedEvent={selectedEvent}
            scenario={scenario}
            queryString={queryString}
            threshold={exceptionThreshold}
            onReceiveClarification={receiveClarification}
            onOpenClarification={() => setDrawer({ type: 'clarification' })}
            onCompleteSignOff={completeSignOff}
            onLockDecision={lockDecision}
            onUpdateScenario={updateScenario}
            onCopyScenario={copyScenarioLink}
            onReset={resetDemo}
          />
        </DrawerFrame>
      ) : null}
    </div>
  )
}

function DemoScreen({
  onOpenWorkspace,
  onOpenAudit,
}: {
  onOpenWorkspace: () => void
  onOpenAudit: () => void
}) {
  const answerSignals = [
    ['Requirements', '27 / 27', 'Every finding evidenced'],
    ['Panel evaluation', '91 / 100', 'Named reviewers'],
    ['Approvals', '4 / 4', 'Declarations complete'],
    ['Integrity review', 'Resolved', 'Concern and response retained'],
  ]

  const lifecycle = [
    ['01', 'Plan', 'Policy and past tenders applied'],
    ['02', 'Publish', 'Criteria and matrix locked'],
    ['03', 'Receive', 'Bids, questions and answers linked'],
    ['04', 'Decide', 'Evidence, comments and approvals retained'],
    ['05', 'Prove', 'Audit-ready record already complete'],
  ]

  return (
    <section aria-labelledby="story-heading" className="mx-auto max-w-6xl">
      <section className="flex min-h-[calc(100vh-9rem)] flex-col justify-center py-5 sm:py-8">
        <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Eyebrow>Continuous procurement assurance</Eyebrow>
              <Pill tone="neutral">For UN agencies & NGOs</Pill>
            </div>
            <Pill tone="amber">
              <AlertCircle className="size-3.5" aria-hidden="true" />
              Before the auditor—or headline—asks
            </Pill>
            <h1 id="story-heading" className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              Every award,
              <span className="block text-primary">audit ready.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Traceli keeps every rule, bid, question, approval and risk signal linked—so you can explain exactly why a supplier won without rebuilding the story.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#proof" className="inline-flex items-center justify-center gap-2 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                See the proof
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <button type="button" onClick={onOpenWorkspace} className="px-4 py-3 text-sm font-semibold text-primary hover:bg-secondary">
                Open live workspace
              </button>
            </div>
          </div>

          <aside aria-label="Source-linked award answer" className="overflow-hidden border border-border bg-card shadow-[0_24px_70px_-40px_rgba(22,49,78,0.55)]">
            <div className="flex items-center justify-between gap-4 border-b border-border bg-secondary/60 px-5 py-4">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Award record · DR-041</p>
                <p className="mt-1 text-sm font-semibold">Emergency logistics · Horn of Africa</p>
              </div>
              <Pill tone="teal">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                Ready
              </Pill>
            </div>

            <div className="p-6 sm:p-7">
              <Eyebrow>Ask Traceli</Eyebrow>
              <h2 className="mt-3 text-2xl font-semibold leading-9">Why did Northstar Relief win?</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Eligible. Highest evaluated compliant offer. All approvals complete.
              </p>

              <div className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-2">
                {answerSignals.map(([label, value, detail]) => (
                  <div key={label} className="bg-card p-4">
                    <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                    <p className="mt-2 text-xl font-semibold">{value}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
                  </div>
                ))}
              </div>

              <button type="button" onClick={onOpenAudit} className="mt-5 flex w-full items-center justify-between gap-4 bg-primary px-4 py-3 text-left text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                <span>
                  Open the proof
                  <span className="mt-0.5 block text-xs font-normal text-primary-foreground/65">Every claim opens its source</span>
                </span>
                <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
              </button>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">Fictional cached record · no live data required</p>
            </div>
          </aside>
        </div>
      </section>

      <section id="proof" aria-labelledby="proof-heading" className="scroll-mt-20 flex min-h-[calc(100vh-5rem)] flex-col justify-center border-t border-border py-16">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <Eyebrow>One golden thread</Eyebrow>
            <h2 id="proof-heading" className="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              The portal runs the tender.
              <span className="block text-primary">Traceli keeps the proof.</span>
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            Across your knowledge base, tender portals, inboxes and evaluation process, one record builds itself as the work happens.
          </p>
        </div>

        <ol className="mt-10 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-5" aria-label="Procurement assurance lifecycle">
          {lifecycle.map(([number, title, detail], index) => (
            <li key={title} className="relative bg-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] font-semibold text-muted-foreground">{number}</span>
                <CheckCircle2 className="size-4 text-accent-foreground" aria-hidden="true" />
              </div>
              <h3 className="mt-8 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
              {index < lifecycle.length - 1 ? (
                <ArrowRight className="absolute -right-2.5 top-1/2 z-10 hidden size-5 -translate-y-1/2 bg-background text-primary md:block" aria-hidden="true" />
              ) : null}
            </li>
          ))}
        </ol>

        <div className="mt-6 grid overflow-hidden bg-primary text-primary-foreground lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-7 sm:p-9">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">The category</p>
            <h3 className="mt-3 text-3xl font-semibold leading-tight">Not another tender portal.</h3>
            <p className="mt-3 max-w-xl text-base leading-7 text-primary-foreground/70">
              Traceli is the assurance layer across all of them: the permanent, source-linked record of what happened, who decided and why.
            </p>
          </div>
          <div className="flex flex-col justify-center border-t border-primary-foreground/15 bg-primary-foreground/[0.06] p-7 sm:p-9 lg:border-l lg:border-t-0">
            <p className="text-sm text-primary-foreground/65">The result</p>
            <p className="mt-2 text-2xl font-semibold">Run procurement once. Defend it whenever scrutiny arrives.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={onOpenAudit} className="inline-flex items-center gap-2 bg-card px-5 py-3 text-sm font-semibold text-primary hover:bg-card/90">
                Inspect the audit record
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={onOpenWorkspace} className="px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/10">
                Explore the workspace
              </button>
            </div>
          </div>
        </div>
      </section>
    </section>
  )
}
function CaseHeader({
  caseTitle,
  organization,
  role,
  decisionState,
  onDecision,
}: {
  caseTitle: string
  organization: Scenario['organization']
  role: Scenario['role']
  decisionState: string
  onDecision: () => void
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 border-b border-border pb-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <Eyebrow>Procurement workspace / RFP-2026-041</Eyebrow>
          <h1 className="mt-2 max-w-4xl text-2xl font-semibold tracking-tight sm:text-3xl">{caseTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{organization} · {role} view</p>
        </div>
        <button
          type="button"
          onClick={onDecision}
          className="inline-flex items-center justify-center gap-2 bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <FileLock2 className="size-4" aria-hidden="true" />
          Decision record · {decisionState}
        </button>
      </div>
      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">The working record for a defensible panel decision. Traceli does not score bids or make award decisions.</p>
    </div>
  )
}

function PortfolioScreen({
  activeEvidenceCoverage,
  activeReadiness,
  activeBlocker,
  policy,
  role,
  onOpenCase,
  onOpenAudit,
  onOpenRules,
}: {
  activeEvidenceCoverage: number
  activeReadiness: string
  activeBlocker: string
  policy: Scenario['policy']
  role: Scenario['role']
  onOpenCase: () => void
  onOpenAudit: () => void
  onOpenRules: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
        <div>
          <Eyebrow>Institutional assurance / {role} view</Eyebrow>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Which awards would be hardest to defend tomorrow?</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Portfolio-level visibility across evidence gaps, donor exceptions, approval controls and locked decision records.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onOpenRules} className="border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary">Policy impact</button>
          <button type="button" onClick={onOpenAudit} className="bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Recent locked records</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active procurements" value="12" detail="Across 5 regions and 3 operating teams" tone="blue" />
        <Metric label="Decision readiness" value="4 blocked" detail="2 awards due within seven days" tone="amber" />
        <Metric label="Donor exceptions" value="2 unresolved" detail={`Highest exposure governed by ${policy}`} tone="amber" />
        <Metric label="Policy change impact" value="3 cases" detail="Manual v4.2 review due before award" tone="teal" />
      </div>

      <section className="border border-border bg-card">
        <div className="flex flex-col justify-between gap-3 border-b border-border p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold">Awards approaching decision</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Sorted by defensibility risk, not commercial score.</p>
          </div>
          <Pill tone="neutral">Live from the assurance register</Pill>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <caption className="sr-only">Active procurements and their decision readiness</caption>
            <thead className="bg-secondary/70 text-xs">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Procurement</th>
                <th scope="col" className="px-4 py-3 font-semibold">Award</th>
                <th scope="col" className="px-4 py-3 font-semibold">Evidence coverage</th>
                <th scope="col" className="px-4 py-3 font-semibold">Decision readiness</th>
                <th scope="col" className="px-4 py-3 font-semibold">Governing policy</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {portfolioCases.map((item, index) => {
                const isActive = index === 0
                return (
                  <tr key={item.id} className="border-t border-border align-top hover:bg-secondary/40">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.id} · {item.region} · {item.team}</p>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{item.awardDate}</td>
                    <td className="px-4 py-4">
                      <p className="font-mono text-sm">{isActive ? activeEvidenceCoverage : item.evidenceCoverage}%</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">Required links with cited evidence</p>
                    </td>
                    <td className="px-4 py-4">
                      <Pill tone={isActive ? (activeReadiness === 'Blocked' ? 'amber' : 'teal') : item.tone}>
                        {isActive ? activeReadiness : item.readiness}
                      </Pill>
                      <p className="mt-2 max-w-[240px] text-[11px] leading-4 text-muted-foreground">{isActive ? activeBlocker : item.blocker}</p>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{item.policy}</td>
                    <td className="px-5 py-4 text-right">
                      <button type="button" onClick={isActive ? onOpenCase : undefined} className="inline-flex items-center gap-1 text-xs font-semibold text-primary disabled:text-muted-foreground">
                        {isActive ? 'Open assurance record' : 'Preview case'}
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Repeated control failures" eyebrow="Institutional memory">
          <ControlFinding count="6 cases" title="Conflict declarations completed late" detail="Repeated across MENA and East Africa" />
          <ControlFinding count="4 cases" title="Geographic capacity inferred too broadly" detail="Now monitored through CTRL-11" />
          <ControlFinding count="3 cases" title="Donor threshold approval attached after review" detail="Policy reminder added before opening" />
        </Panel>
        <Panel title="Policy versions at risk" eyebrow="Change impact">
          <div className="space-y-4 text-sm">
            <div>
              <div className="flex justify-between gap-3"><strong>Procurement Manual v4.2</strong><Pill tone="amber">3 affected</Pill></div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">New panel-independence declaration effective 01 September.</p>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex justify-between gap-3"><strong>ECHO conditions v2026.2</strong><Pill tone="teal">Current</Pill></div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Four threshold controls synced across 7 procurements.</p>
            </div>
          </div>
        </Panel>
        <Panel title="Recent locked records" eyebrow="Defensible outcomes">
          <RecordItem id="DR-038" title="Dignity kits framework" time="Locked yesterday · 16:22" />
          <RecordItem id="DR-035" title="Emergency water trucking" time="Locked 17 Aug · 11:04" />
          <RecordItem id="DR-029" title="Nutrition supply transport" time="Locked 15 Aug · 09:38" />
        </Panel>
      </div>
    </div>
  )
}

function ControlFinding({ count, title, detail }: { count: string; title: string; detail: string }) {
  return (
    <div className="flex gap-3 border-b border-border py-3 first:pt-0 last:border-0 last:pb-0">
      <span className="font-mono text-xs font-semibold text-[#6f4d0f]">{count}</span>
      <div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div>
    </div>
  )
}

function RecordItem({ id, title, time }: { id: string; title: string; time: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-border py-3 first:pt-0 last:border-0 last:pb-0">
      <FileLock2 className="mt-0.5 size-4 shrink-0 text-accent-foreground" aria-hidden="true" />
      <div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs text-muted-foreground">{id} · {time}</p></div>
    </div>
  )
}

function PlanDraftScreen({
  scenario,
  draftText,
  setDraftText,
  policyChecked,
  setPolicyChecked,
  humanApproved,
  setHumanApproved,
  criteriaLocked,
  setCriteriaLocked,
  onSource,
  onModels,
  setNotice,
}: {
  scenario: Scenario
  draftText: string
  setDraftText: (value: string) => void
  policyChecked: boolean
  setPolicyChecked: (value: boolean) => void
  humanApproved: boolean
  setHumanApproved: (value: boolean) => void
  criteriaLocked: boolean
  setCriteriaLocked: (value: boolean) => void
  onSource: () => void
  onModels: () => void
  setNotice: (value: string) => void
}) {
  const stages = [
    ['Select source pack', true],
    ['Retrieve precedents', true],
    ['Draft clause', true],
    ['Policy challenge', policyChecked],
    ['Human approval', humanApproved],
    ['Lock criteria', criteriaLocked],
  ] as const

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
        <div>
          <Eyebrow>Pre-publication assurance / Plan & draft</Eyebrow>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Draft the rule before evaluating the response.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">A policy-grounded workspace for {scenario.procurement.toLowerCase()} under {scenario.policy}. Sources, disagreements and human ownership stay visible.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill tone="teal"><BadgeCheck className="size-3.5" aria-hidden="true" />Drafted from 6 approved sources</Pill>
          <Pill tone={policyChecked ? 'teal' : 'amber'}><Sparkles className="size-3.5" aria-hidden="true" />{policyChecked ? 'Independently checked' : 'Independent check required'}</Pill>
        </div>
      </div>

      <ol className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6" aria-label="Tender drafting workflow">
        {stages.map(([label, complete], index) => (
          <li key={label} className={cn('border p-3 text-xs', complete ? 'border-accent-foreground/30 bg-accent/60' : 'border-border bg-card')}>
            <div className="flex items-center justify-between"><span className="font-mono text-[10px]">0{index + 1}</span>{complete ? <CheckCircle2 className="size-4 text-accent-foreground" aria-hidden="true" /> : <Clock3 className="size-4 text-muted-foreground" aria-hidden="true" />}</div>
            <p className="mt-3 font-semibold">{label}</p>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="border border-border bg-card">
          <div className="border-b border-border p-5">
            <h2 className="font-semibold">Approved source pack</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Retrieval is permission-aware. Every source keeps its version and access boundary.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <caption className="sr-only">Approved sources used to draft the tender clause</caption>
              <thead className="bg-secondary/70 text-xs"><tr><th className="px-4 py-3">Source</th><th className="px-4 py-3">Version</th><th className="px-4 py-3">Access boundary</th><th className="px-4 py-3 text-right">Trace</th></tr></thead>
              <tbody>
                {draftingSources.map((source) => (
                  <tr key={source.name} className="border-t border-border text-xs">
                    <td className="px-4 py-3"><p className="font-semibold text-foreground">{source.name}</p><p className="mt-1 text-muted-foreground">{source.category}</p></td>
                    <td className="px-4 py-3 text-muted-foreground">{source.version}</td>
                    <td className="px-4 py-3 text-muted-foreground">{source.access}</td>
                    <td className="px-4 py-3 text-right"><button type="button" onClick={onSource} className="font-semibold text-primary">Open</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex flex-col gap-5">
          <Panel title="Emergency delivery capacity" eyebrow="Proposed clause · CTRL-11">
            <label htmlFor="draft-clause" className="text-xs font-semibold">Human-editable clause wording</label>
            <textarea id="draft-clause" value={draftText} onChange={(event) => setDraftText(event.target.value)} rows={5} className="mt-2 w-full resize-y border border-input bg-background p-3 text-sm leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-ring/30" />
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
              <div className="bg-secondary p-3"><strong>Control satisfied</strong><p className="mt-1 leading-5 text-muted-foreground">Operational capacity must be evidenced for each named country.</p></div>
              <div className="bg-secondary p-3"><strong>Human owner</strong><p className="mt-1 leading-5 text-muted-foreground">Leila Mansour · Category manager</p></div>
            </div>
          </Panel>

          <Panel title="Independent policy challenge" eyebrow="Material disagreements only">
            <div className="border border-[#c9b15b] bg-[#fbf5df] p-4">
              <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 size-4 shrink-0 text-[#6f4d0f]" aria-hidden="true" /><div><p className="text-sm font-semibold">One interpretation needs a human decision</p><p className="mt-2 text-sm leading-6 text-muted-foreground">The 72-hour obligation is clear. ECHO conditions do not require warehouse ownership, so the draft correctly permits partner or distribution-plan evidence.</p></div></div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={onModels} className="inline-flex items-center gap-2 text-xs font-semibold text-primary"><Database className="size-4" aria-hidden="true" />Open administrative model trace</button>
              <button type="button" onClick={() => { setPolicyChecked(true); setNotice('Independent policy challenge completed and recorded.') }} className="border border-border px-3 py-2 text-xs font-semibold hover:bg-secondary"><RefreshCcw className="mr-2 inline size-3.5" aria-hidden="true" />Re-run cached check</button>
            </div>
          </Panel>

          <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-secondary p-4">
            <div><p className="text-sm font-semibold">Human approval and criteria lock</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Locking freezes the criterion before submissions are opened.</p></div>
            <div className="flex gap-2">
              <button type="button" disabled={!policyChecked || humanApproved} onClick={() => { setHumanApproved(true); setNotice('Clause approved by the human owner.') }} className="border border-border bg-card px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50">{humanApproved ? 'Approved' : 'Approve clause'}</button>
              <button type="button" disabled={!humanApproved || criteriaLocked} onClick={() => { setCriteriaLocked(true); setNotice('Evaluation criteria locked before bid opening.') }} className="inline-flex items-center gap-2 bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"><Lock className="size-3.5" aria-hidden="true" />{criteriaLocked ? 'Criteria locked' : 'Lock criteria'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OverviewScreen({
  evidenceCoverage,
  readinessState,
  readinessDetail,
  decisionState,
  clarificationReceived,
  approvalsRemaining,
  declarationOutstanding,
  onNavigate,
  onCoverage,
  onDecision,
}: {
  evidenceCoverage: number
  readinessState: string
  readinessDetail: string
  decisionState: string
  clarificationReceived: boolean
  approvalsRemaining: number
  declarationOutstanding: boolean
  onNavigate: (view: View) => void
  onCoverage: () => void
  onDecision: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3" aria-live="polite">
        <Metric label="Evidence coverage" value={`${evidenceCoverage}%`} detail={`${clarificationReceived ? '27' : '23'} of 27 required evidence links resolved`} tone={clarificationReceived ? 'teal' : 'blue'} action="Explain denominator" onAction={onCoverage} />
        <Metric label="Decision readiness" value={readinessState} detail={readinessDetail} tone={readinessState === 'Blocked' ? 'amber' : 'teal'} />
        <Metric label="Decision record" value={decisionState} detail={decisionState === 'Draft' ? 'Preview only · export remains gated' : decisionState === 'Ready to lock' ? 'All blockers resolved · human lock required' : 'Locked with immutable chronology'} tone={decisionState === 'Draft' ? 'blue' : 'teal'} action="Open record" onAction={onDecision} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="font-semibold">Golden thread</h2><p className="mt-1 text-xs text-muted-foreground">One obligation from clause to evidence to human judgment.</p></div><button type="button" onClick={() => onNavigate('golden')} className="inline-flex items-center gap-1 text-xs font-semibold text-primary">Open REQ-07 <ArrowRight className="size-3.5" aria-hidden="true" /></button></div>
          <div className="flex flex-wrap items-center gap-2 p-5 text-xs">
            {['Tender §4.2', 'REQ-07', 'Criterion 3', 'Northstar Relief', clarificationReceived ? 'Evidence attached' : 'Evidence gap', clarificationReceived ? 'Satisfied' : 'Clarify'].map((item, index, items) => (
              <span key={item} className="flex items-center gap-2"><span className={cn('rounded px-2.5 py-2', index === items.length - 1 ? (clarificationReceived ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground') : 'bg-secondary')}>{item}</span>{index < items.length - 1 ? <ArrowRight className="size-3 text-muted-foreground" aria-hidden="true" /> : null}</span>
            ))}
          </div>
        </section>
        <Panel title="Human controls" eyebrow="Decision readiness">
          <ControlState label="Correct procurement method" state="Pass" />
          <ControlState label="Criteria locked before opening" state="Pass" />
          <ControlState label="Panel approvals" state={approvalsRemaining ? `${approvalsRemaining} outstanding` : 'Complete'} />
          <ControlState label="Conflict declarations" state={declarationOutstanding ? '1 outstanding' : 'Complete'} />
        </Panel>
      </div>

      <section className="border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="font-semibold">What needs attention</h2><p className="mt-1 text-xs text-muted-foreground">Every blocker has an owner, source and next action.</p></div><button type="button" onClick={() => onNavigate('submissions')} className="text-xs font-semibold text-primary">Review submissions</button></div>
        <div className="grid gap-3 p-5 md:grid-cols-3">
          <Attention title="Northstar Relief · REQ-07" body={clarificationReceived ? 'Clarification attached and reviewer determination updated' : 'Ethiopia distribution evidence not located'} tone={clarificationReceived ? 'teal' : 'amber'} onClick={() => onNavigate('golden')} />
          <Attention title="Panel approvals" body={approvalsRemaining ? `${approvalsRemaining} reviewer approvals remain outstanding` : 'All reviewer approvals recorded'} tone={approvalsRemaining ? 'amber' : 'teal'} onClick={onDecision} />
          <Attention title="Conflict declaration" body={declarationOutstanding ? 'One signed declaration is still required' : 'All declarations complete'} tone={declarationOutstanding ? 'amber' : 'teal'} onClick={() => onNavigate('requirements')} />
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <Panel title="Donor threshold exception" eyebrow="Process control"><p className="text-sm leading-6 text-muted-foreground">Procurement value exceeds the prepared donor threshold. Additional grants approval must be attached before lock.</p><button type="button" onClick={() => onNavigate('rules')} className="mt-4 text-xs font-semibold text-primary">Open governing rule</button></Panel>
        <Panel title="Kenya Shelter RFP 2025" eyebrow="Related precedent"><p className="text-sm leading-6 text-muted-foreground">The same geographic-capacity wording produced a clarification. Traceli preserved the approved resolution for reuse, not blind copying.</p><button type="button" onClick={() => onNavigate('draft')} className="mt-4 text-xs font-semibold text-primary">Inspect drafting trace</button></Panel>
      </div>
    </div>
  )
}

function Metric({ label, value, detail, tone, action, onAction }: { label: string; value: string; detail: string; tone: 'teal' | 'amber' | 'blue'; action?: string; onAction?: () => void }) {
  return (
    <div className="border border-border bg-card p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">{detail}</p>
      <div className="mt-4 flex items-end justify-between gap-3"><div className={cn('h-1 w-16', tone === 'teal' ? 'bg-accent-foreground' : tone === 'amber' ? 'bg-[#a9781e]' : 'bg-primary')} />{action && onAction ? <button type="button" onClick={onAction} className="text-[11px] font-semibold text-primary">{action}</button> : null}</div>
    </div>
  )
}

function ControlState({ label, state }: { label: string; state: string }) {
  const passing = state === 'Pass' || state === 'Complete'
  return <div className="flex items-center justify-between gap-3 border-b border-border py-3 first:pt-0 last:border-0 last:pb-0"><span className="flex items-center gap-2 text-sm">{passing ? <Check className="size-4 text-accent-foreground" aria-hidden="true" /> : <AlertCircle className="size-4 text-[#8b6014]" aria-hidden="true" />}{label}</span><span className="text-xs text-muted-foreground">{state}</span></div>
}

function Attention({ title, body, tone, onClick }: { title: string; body: string; tone: 'amber' | 'teal'; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="border border-border p-4 text-left hover:bg-secondary"><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold">{title}</p>{tone === 'teal' ? <CheckCircle2 className="size-4 shrink-0 text-accent-foreground" aria-hidden="true" /> : <AlertCircle className="size-4 shrink-0 text-[#8b6014]" aria-hidden="true" />}</div><p className="mt-2 text-xs leading-5 text-muted-foreground">{body}</p></button>
}

function GoldenThreadScreen({ clarificationReceived, onEvidence, onWhyRequirement, onClarification }: { clarificationReceived: boolean; onEvidence: () => void; onWhyRequirement: () => void; onClarification: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2 border border-border bg-secondary px-4 py-3 text-xs">
        {['Tender §4.2', 'REQ-07', 'Criterion 3', 'Northstar Relief', clarificationReceived ? 'Evidence attached' : 'Evidence gap', clarificationReceived ? 'Satisfied' : 'Clarification'].map((item, index, items) => (
          <span key={item} className="flex items-center gap-2"><button type="button" onClick={index < 3 ? onWhyRequirement : index === 4 ? onEvidence : undefined} className={cn('rounded bg-card px-2 py-1.5', index < 3 || index === 4 ? 'underline decoration-primary/40 underline-offset-4' : '', index === items.length - 1 ? 'bg-primary text-primary-foreground no-underline' : '')}>{item}</button>{index < items.length - 1 ? <ArrowRight className="size-3 text-muted-foreground" aria-hidden="true" /> : null}</span>
        ))}
      </div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><Eyebrow>Golden thread / requirement review</Eyebrow><h2 className="mt-2 text-2xl font-semibold">REQ-07 · Emergency delivery capacity</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Every observation is linked to governing text. Traceli found the evidence; the reviewer determines what it means.</p></div><Pill tone={clarificationReceived ? 'teal' : 'amber'}>{clarificationReceived ? 'Human determination · satisfied' : 'Human determination · clarification required'}</Pill></div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="1 · Source tender clause" eyebrow="RFP-2026-041 · p.14" action={<button type="button" onClick={onWhyRequirement} className="text-xs font-semibold text-primary"><HelpCircle className="mr-1 inline size-4" aria-hidden="true" />Why is this here?</button>}><blockquote className="border-l-2 border-primary pl-4 text-sm leading-6">“The supplier must demonstrate capacity to deliver emergency shelter kits within 72 hours across Kenya, Somalia and Ethiopia.”</blockquote><p className="mt-4 text-xs text-muted-foreground">Section 4.2 · Operational reach and feasibility</p></Panel>
        <Panel title="2 · Extracted requirement" eyebrow="Traceli finding" action={<Pill tone="blue">Tender obligation</Pill>}><p className="text-sm leading-6">Supplier demonstrates operational capacity in all three named countries, with warehouse, partner or distribution-plan evidence.</p><p className="mt-4 text-xs text-muted-foreground">Mapped from <SourceLink onClick={onWhyRequirement}>RFP §4.2 p.14</SourceLink></p></Panel>
        <Panel title="3 · Evaluation criterion" eyebrow="Criterion 3 · 25%" action={<button type="button" onClick={onWhyRequirement} className="text-xs font-semibold text-primary">Inspect link</button>}><p className="text-sm font-medium">Operational reach and feasibility</p><div className="mt-4 flex justify-between text-xs text-muted-foreground"><span>Owner · Programme team</span><span>Locked · 02 Apr 2026</span></div></Panel>
        <Panel title="4 · Northstar Relief response" eyebrow="Supplier submission · SUB-014" action={<Pill tone="neutral">Evidence found for {clarificationReceived ? '24' : '21'} of 24</Pill>}><p className="text-sm leading-6">“We maintain regional stock and partner capacity for rapid deployment across the Horn of Africa.”</p><p className="mt-3 text-xs text-muted-foreground">Response p.38 · submitted 16 Apr 2026, 14:32</p></Panel>
      </div>
      <Panel title="5 · Evidence mapping" eyebrow="Cited passages, not a supplier score" action={<span className="text-xs text-muted-foreground">3 evidence items</span>}>
        <div className="grid gap-3 md:grid-cols-3"><EvidenceCard title="Kenya warehouse certificate" state="Supporting passage located" tone="teal" page="38" onClick={onEvidence} /><EvidenceCard title="Somalia partner agreement" state="Supporting passage located" tone="teal" page="41" onClick={onEvidence} /><EvidenceCard title="Ethiopia distribution plan" state={clarificationReceived ? 'Clarification attached and reviewed' : 'Required evidence not located'} tone={clarificationReceived ? 'teal' : 'amber'} page={clarificationReceived ? '2' : '—'} onClick={onEvidence} /></div>
      </Panel>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="6 · Human review" eyebrow="Reviewer determination"><div className="flex items-start gap-3"><div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#f2e3b8] text-[#6f4d0f]"><Users className="size-4" aria-hidden="true" /></div><div><p className="text-sm font-semibold">{clarificationReceived ? 'REQ-07 satisfied after clarification' : 'Clarification required'}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{clarificationReceived ? 'Sarah Ahmed reviewed the attached Ethiopia plan and recorded the human determination.' : 'The Ethiopia capacity evidence is missing. Do not infer compliance from regional language covering the other two countries.'}</p></div></div></Panel>
        <Panel title="7 · Clarification action" eyebrow="Human-owned workflow"><p className="text-sm leading-6 text-muted-foreground">The request preserves the source requirement, supplier response, owner and received evidence in one trace.</p><button type="button" onClick={onClarification} className="mt-4 inline-flex items-center gap-2 bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><MessageSquareText className="size-4" aria-hidden="true" />{clarificationReceived ? 'View resolved clarification' : 'Open clarification'}</button></Panel>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-secondary p-4"><p className="text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Governance boundary:</strong> Traceli finds evidence and preserves provenance. The panel makes the determination.</p><button type="button" onClick={onWhyRequirement} className="inline-flex items-center gap-2 text-xs font-semibold text-primary"><HelpCircle className="size-4" aria-hidden="true" />Inspect provenance</button></div>
    </div>
  )
}

function EvidenceCard({ title, state, tone, page, onClick }: { title: string; state: string; tone: 'teal' | 'amber'; page: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="border border-border p-4 text-left hover:bg-secondary"><div className="flex items-center justify-between gap-2"><FileText className="size-5 text-primary" aria-hidden="true" />{tone === 'teal' ? <Check className="size-4 text-accent-foreground" aria-hidden="true" /> : <AlertCircle className="size-4 text-[#8b6014]" aria-hidden="true" />}</div><p className="mt-4 text-sm font-medium">{title}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{state}</p><span className="mt-3 block text-xs font-semibold text-primary">Open passage · p. {page}</span></button>
}

function SubmissionsScreen({ filter, setFilter, clarificationReceived, onEvidence }: { filter: 'all' | 'missing' | 'clarification' | 'owner'; setFilter: (filter: 'all' | 'missing' | 'clarification' | 'owner') => void; clarificationReceived: boolean; onEvidence: () => void }) {
  const visible = suppliers.filter((supplier) => filter === 'all' || (filter === 'owner' ? supplier.owner === 'Sarah Ahmed' : supplier.filter === filter))
  return (
    <div className="flex flex-col gap-5">
      <div><Eyebrow>Submission review</Eyebrow><h2 className="mt-2 text-2xl font-semibold">Review evidence coverage. Keep judgment with the panel.</h2><p className="mt-2 text-sm text-muted-foreground">Four fictional suppliers · no automated bid scoring.</p></div>
      <div className="flex flex-wrap gap-2" aria-label="Filter submissions"><Filter className="mt-2 size-4 text-muted-foreground" aria-hidden="true" />{[['all', 'All'], ['missing', 'Missing evidence'], ['clarification', 'Open clarification'], ['owner', 'Owned by me']].map(([id, label]) => <button type="button" key={id} onClick={() => setFilter(id as typeof filter)} className={cn('px-3 py-2 text-xs font-semibold', filter === id ? 'bg-primary text-primary-foreground' : 'border border-border bg-card')}>{label}</button>)}</div>
      <section className="border border-border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left"><caption className="sr-only">Supplier submissions and evidence coverage</caption><thead className="bg-secondary/70 text-xs"><tr><th scope="col" className="px-5 py-3">Supplier</th><th scope="col" className="px-4 py-3">Evidence coverage</th><th scope="col" className="px-4 py-3">Reviewer state</th><th scope="col" className="px-4 py-3">Owner</th><th scope="col" className="px-5 py-3 text-right">Review</th></tr></thead><tbody>{visible.map((supplier) => { const found = supplier.name.startsWith('Northstar') && clarificationReceived ? 24 : supplier.evidenceFound; const state = supplier.name.startsWith('Northstar') && clarificationReceived ? 'Ready for panel' : supplier.status; const tone = supplier.name.startsWith('Northstar') && clarificationReceived ? 'teal' : supplier.tone; return <tr key={supplier.name} className="border-t border-border"><td className="px-5 py-4"><p className="text-sm font-semibold">{supplier.name}</p><p className="mt-1 text-xs text-muted-foreground">Submission received · virus scan passed</p></td><td className="px-4 py-4"><p className="text-xs font-semibold">Evidence found for {found} of 24 requirements</p><div className="mt-2 h-1.5 w-40 bg-secondary" role="progressbar" aria-label={`${supplier.name} evidence coverage`} aria-valuemin={0} aria-valuemax={24} aria-valuenow={found}><div className={cn('h-full', tone === 'teal' ? 'bg-accent-foreground' : 'bg-[#a9781e]')} style={{ width: `${(found / 24) * 100}%` }} /></div></td><td className="px-4 py-4"><Pill tone={tone}>{state}</Pill></td><td className="px-4 py-4 text-xs text-muted-foreground">{supplier.owner}</td><td className="px-5 py-4 text-right"><button type="button" onClick={onEvidence} className="inline-flex items-center gap-1 text-xs font-semibold text-primary">Open evidence review <ArrowRight className="size-3.5" aria-hidden="true" /></button></td></tr>})}</tbody></table></div></section>
    </div>
  )
}

function RequirementsScreen({ query, setQuery, clarificationReceived, onWhy }: { query: string; setQuery: (query: string) => void; clarificationReceived: boolean; onWhy: () => void }) {
  const rows = requirements.filter((item) => `${item.id} ${item.title}`.toLowerCase().includes(query.toLowerCase()))
  return (
    <div className="flex flex-col gap-5">
      <div><Eyebrow>Requirement register</Eyebrow><h2 className="mt-2 text-2xl font-semibold">24 obligations, each with a source and owner.</h2><p className="mt-2 text-sm text-muted-foreground">Policy checks, affected suppliers and exception states remain inspectable.</p></div>
      <div className="sm:w-96"><label htmlFor="requirement-search" className="mb-2 block text-xs font-semibold">Search requirement register</label><div className="flex items-center gap-2 border border-input bg-card px-3 py-2"><Search className="size-4 text-muted-foreground" aria-hidden="true" /><input id="requirement-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try REQ-07 or emergency delivery" className="w-full bg-transparent text-sm outline-none" /></div></div>
      <section className="border border-border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left"><caption className="sr-only">Requirements, sources, owners and exception states</caption><thead className="bg-secondary/70 text-xs"><tr><th scope="col" className="px-5 py-3">Requirement</th><th scope="col" className="px-4 py-3">Origin</th><th scope="col" className="px-4 py-3">Owner</th><th scope="col" className="px-4 py-3">Last policy check</th><th scope="col" className="px-4 py-3">Affected</th><th scope="col" className="px-4 py-3">Exception state</th><th scope="col" className="px-5 py-3 text-right">Trace</th></tr></thead><tbody>{rows.map((item) => { const isReq07 = item.id === 'REQ-07'; return <tr key={item.id} className="border-t border-border align-top"><td className="px-5 py-4"><p className="text-sm font-semibold">{item.id}</p><p className="mt-1 text-xs text-muted-foreground">{item.title}</p><p className="mt-2 text-[11px] text-primary">{item.controls}</p></td><td className="px-4 py-4 text-xs leading-5 text-muted-foreground">{item.origin}</td><td className="px-4 py-4 text-xs text-muted-foreground">{item.owner}</td><td className="px-4 py-4 text-xs text-muted-foreground">{item.policyCheck}</td><td className="px-4 py-4 text-xs text-muted-foreground">{item.affected}</td><td className="px-4 py-4"><Pill tone={isReq07 && clarificationReceived ? 'teal' : item.tone}>{isReq07 && clarificationReceived ? 'Satisfied after clarification' : item.state}</Pill></td><td className="px-5 py-4 text-right"><button type="button" onClick={onWhy} className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><Link2 className="size-3.5" aria-hidden="true" />Inspect source</button></td></tr>})}</tbody></table></div></section>
    </div>
  )
}

function ClarificationsScreen({ clarificationReceived, onReceive }: { clarificationReceived: boolean; onReceive: () => void }) {
  return (
    <div className="flex flex-col gap-5"><div><Eyebrow>Clarification queue</Eyebrow><h2 className="mt-2 text-2xl font-semibold">Close the gap without losing the reason.</h2><p className="mt-2 text-sm text-muted-foreground">Source requirement, supplier evidence and human action remain visible in one workspace.</p></div>
      <section className="border border-border bg-card"><div className="flex flex-col justify-between gap-3 border-b border-border p-5 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold">Northstar Relief Logistics · CLR-004</p><p className="mt-1 text-xs text-muted-foreground">Owner · Amina Malik · Due 19 Aug 2026</p></div><Pill tone={clarificationReceived ? 'teal' : 'amber'}>{clarificationReceived ? 'Resolved and attached' : 'Response received · review required'}</Pill></div>
        <div className="grid gap-0 lg:grid-cols-2"><div className="border-b border-border p-5 lg:border-b-0 lg:border-r"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Why the clarification exists</p><h3 className="mt-2 font-semibold">REQ-07 · Emergency delivery capacity</h3><blockquote className="mt-4 border-l-2 border-primary pl-4 text-sm leading-6">“Capacity to deliver within 72 hours across Kenya, Somalia and Ethiopia.”</blockquote><div className="mt-4 bg-secondary p-4"><p className="text-xs font-semibold">Supplier response · p.38</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Regional capacity was described, but no Ethiopia warehouse, partner or distribution plan was named.</p></div></div>
          <div className="p-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Supplier response · received 19 Aug</p><h3 className="mt-2 font-semibold">Ethiopia distribution plan</h3><p className="mt-4 text-sm leading-6">Northstar attached its Addis Ababa partner agreement, dispatch roster and a country-specific 72-hour delivery route plan.</p><div className="mt-4 flex items-center gap-3 border border-accent-foreground/30 bg-accent/60 p-4"><FileCheck2 className="size-5 text-accent-foreground" aria-hidden="true" /><div><p className="text-sm font-semibold">CLR-004-R1.pdf</p><p className="mt-1 text-xs text-muted-foreground">3 pages · supplier-signed · malware scan passed</p></div></div>{clarificationReceived ? <div className="mt-5 flex items-start gap-3"><CheckCircle2 className="mt-0.5 size-5 text-accent-foreground" aria-hidden="true" /><div><p className="text-sm font-semibold">Attached to REQ-07 and reviewed</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Evidence coverage, requirement state and audit chronology were updated together.</p></div></div> : <button type="button" onClick={onReceive} className="mt-5 w-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Attach response to REQ-07 and record determination</button>}</div></div>
      </section>
    </div>
  )
}

function AuditScreen({ events, filter, setFilter, onOpen }: { events: AuditEvent[]; filter: 'All' | AuditCategory; setFilter: (filter: 'All' | AuditCategory) => void; onOpen: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-5"><div><Eyebrow>Forensic audit trail</Eyebrow><h2 className="mt-2 text-2xl font-semibold">A chronology someone can inspect and defend.</h2><p className="mt-2 text-sm text-muted-foreground">Every event opens the exact snapshot, source and actor preserved at that moment.</p></div>
      <div className="flex flex-wrap gap-2" aria-label="Filter audit trail"><Filter className="mt-2 size-4 text-muted-foreground" aria-hidden="true" />{auditFilters.map((item) => <button type="button" key={item} onClick={() => setFilter(item)} className={cn('px-3 py-2 text-xs font-semibold', filter === item ? 'bg-primary text-primary-foreground' : 'border border-border bg-card')}>{item}</button>)}</div>
      <section className="border border-border bg-card p-5"><div className="flex flex-col">{events.map((event, index) => <button type="button" key={event.id} onClick={() => onOpen(event.id)} className="group flex gap-4 text-left"><div className="flex flex-col items-center"><span className={cn('mt-2 size-2 rounded-full', event.category === 'Traceli finding' ? 'bg-[#a9781e]' : event.category === 'Approval' ? 'bg-primary' : 'bg-accent-foreground')} />{index < events.length - 1 ? <span className="mt-2 h-full min-h-16 w-px bg-border" /> : null}</div><div className="flex-1 border-b border-border pb-5 group-last:border-0 group-last:pb-0"><div className="flex flex-col justify-between gap-2 sm:flex-row"><div><p className="text-sm font-semibold group-hover:text-primary">{event.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{event.actor} · {event.source}</p></div><div className="flex items-center gap-2"><Pill tone={event.category === 'Traceli finding' ? 'amber' : event.category === 'Approval' ? 'blue' : 'teal'}>{event.category}</Pill><span className="text-xs text-muted-foreground">{event.time}</span></div></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{event.snapshot}</p><span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">Inspect event snapshot <Eye className="size-3.5" aria-hidden="true" /></span></div></button>)}</div></section>
    </div>
  )
}

function RulesScreen({ policy, threshold, onWhyException, onSource }: { policy: Scenario['policy']; threshold: string; onWhyException: () => void; onSource: () => void }) {
  return (
    <div className="flex flex-col gap-5"><div><Eyebrow>Connected sources / {policy}</Eyebrow><h2 className="mt-2 text-2xl font-semibold">The obligations behind the obligation.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Version, ownership, synchronization, affected controls, repository and access boundary stay attached to every governing source.</p></div>
      <section className="border border-border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-left"><caption className="sr-only">Governing sources connected to this procurement</caption><thead className="bg-secondary/70 text-xs"><tr><th className="px-5 py-3">Source</th><th className="px-4 py-3">Version</th><th className="px-4 py-3">Owner / effective</th><th className="px-4 py-3">Last sync</th><th className="px-4 py-3">Affected controls</th><th className="px-4 py-3">Repository</th><th className="px-4 py-3">Access boundary</th><th className="px-5 py-3 text-right">Trace</th></tr></thead><tbody>{governingSources.map((source) => <tr key={source.name} className="border-t border-border align-top"><td className="px-5 py-4"><p className="text-sm font-semibold">{source.name}</p><p className="mt-1 text-xs text-muted-foreground">{source.type}</p></td><td className="px-4 py-4 text-xs text-muted-foreground">{source.version}</td><td className="px-4 py-4 text-xs leading-5 text-muted-foreground">{source.owner}<br />Effective {source.effective}</td><td className="px-4 py-4 text-xs text-muted-foreground">{source.synced}</td><td className="px-4 py-4 text-xs text-muted-foreground">{source.controls}</td><td className="px-4 py-4 text-xs text-muted-foreground">{source.repository}</td><td className="px-4 py-4 text-xs text-muted-foreground">{source.access}</td><td className="px-5 py-4 text-right"><button type="button" onClick={onSource} className="inline-flex items-center gap-1 text-xs font-semibold text-primary">Open source <ExternalLink className="size-3.5" aria-hidden="true" /></button></td></tr>)}</tbody></table></div></section>
      <div className="border border-[#c9b15b] bg-[#fbf5df] p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="text-sm font-semibold">Potential process exception · donor threshold</p><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Procurement value exceeds {threshold}; additional approval is required under {policy}. This is a process control, not a supplier finding.</p></div><Pill tone="amber">Approval required</Pill></div><button type="button" onClick={onWhyException} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary"><HelpCircle className="size-4" aria-hidden="true" />Why is this exception here?</button></div>
    </div>
  )
}

function ModelLedgerScreen() {
  return (
    <div className="flex flex-col gap-5"><div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end"><div><Eyebrow>Administrative trace / model ledger</Eyebrow><h1 className="mt-2 text-3xl font-semibold tracking-tight">Model-independent intelligence, measured by task.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Provider details stay here. Procurement users see drafting, policy check and independent verification—with evidence retained regardless of model.</p></div><Pill tone="neutral"><Database className="size-3.5" aria-hidden="true" />Admin-only detail</Pill></div>
      <div className="grid gap-4 sm:grid-cols-3"><Metric label="Routing policy" value="Task-specific" detail="Each task uses a measured quality, cost and resilience target" tone="blue" /><Metric label="Fallback readiness" value="3 routes" detail="Provider-independent fallbacks configured for critical tasks" tone="teal" /><Metric label="Provenance retained" value="100%" detail="Source spans, versions, checks and human resolutions persisted" tone="teal" /></div>
      <section className="border border-border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[1150px] text-left"><caption className="sr-only">Administrative model routing ledger</caption><thead className="bg-secondary/70 text-xs"><tr><th className="px-5 py-3">Procurement task</th><th className="px-4 py-3">Routing goal</th><th className="px-4 py-3">Provider / model</th><th className="px-4 py-3">Version</th><th className="px-4 py-3">Result retained</th><th className="px-4 py-3">Latency</th><th className="px-5 py-3">Fallback</th></tr></thead><tbody>{modelLedger.map((run) => <tr key={run.task} className="border-t border-border align-top"><td className="px-5 py-4 text-sm font-semibold">{run.task}</td><td className="px-4 py-4 text-xs leading-5 text-muted-foreground">{run.route}</td><td className="px-4 py-4 text-xs text-muted-foreground"><strong className="text-foreground">{run.provider}</strong><br />{run.model}</td><td className="px-4 py-4 font-mono text-[11px] text-muted-foreground">{run.version}</td><td className="px-4 py-4 text-xs leading-5 text-muted-foreground">{run.result}</td><td className="px-4 py-4 text-xs text-muted-foreground">{run.latency}</td><td className="px-5 py-4 text-xs text-muted-foreground">{run.fallback}</td></tr>)}</tbody></table></div></section>
      <div className="border border-border bg-secondary p-5"><p className="text-sm font-semibold">What survives a frontier-model release</p><p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">Traceli owns the procurement control graph, source permissions, task evaluations, human resolutions and decision chronology. Models remain replaceable workers inside that assurance system.</p></div>
    </div>
  )
}

function Panel({ title, eyebrow, action, children }: { title: string; eyebrow: string; action?: ReactNode; children: ReactNode }) {
  return <section className="border border-border bg-card p-5"><div className="mb-4 flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{eyebrow}</p><h3 className="mt-1 font-semibold">{title}</h3></div>{action}</div>{children}</section>
}

function DrawerFrame({ drawer, onClose, children }: { drawer: Exclude<Drawer, null>; onClose: () => void; children: ReactNode }) {
  const labels = {
    evidence: ['Evidence inspection', 'Ethiopia distribution plan'],
    why: ['Provenance explanation', drawer.type === 'why' && drawer.subject === 'exception' ? 'Why this process exception exists' : 'Why this item is here'],
    clarification: ['Clarification response · CLR-004', 'Close the evidence gap'],
    decision: ['Decision record', 'Readiness-gated decision record'],
    event: ['Audit event snapshot', 'What existed at this moment'],
    settings: ['DIHAD meeting controls', 'Personalize this cached scenario'],
  } as const
  const [eyebrow, title] = labels[drawer.type]

  return (
    <div className="fixed inset-0 z-50"><button type="button" onClick={onClose} aria-label="Close side panel" className="absolute inset-0 bg-foreground/25" /><aside role="dialog" aria-modal="true" aria-labelledby="drawer-title" className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-border bg-card shadow-2xl"><div className="flex items-start justify-between border-b border-border p-5"><div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h2 id="drawer-title" className="mt-1 text-xl font-semibold">{title}</h2></div><button type="button" autoFocus onClick={onClose} aria-label="Close side panel" className="p-2 text-muted-foreground hover:bg-secondary"><X className="size-4" aria-hidden="true" /></button></div><div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div></aside></div>
  )
}

function DrawerContent({
  drawer,
  clarificationReceived,
  evidenceCoverage,
  readinessState,
  readinessDetail,
  decisionState,
  selectedEvent,
  scenario,
  queryString,
  threshold,
  onReceiveClarification,
  onOpenClarification,
  onCompleteSignOff,
  onLockDecision,
  onUpdateScenario,
  onCopyScenario,
  onReset,
}: {
  drawer: Exclude<Drawer, null>
  clarificationReceived: boolean
  evidenceCoverage: number
  readinessState: string
  readinessDetail: string
  decisionState: string
  selectedEvent?: AuditEvent
  scenario: Scenario
  queryString: string
  threshold: string
  onReceiveClarification: () => void
  onOpenClarification: () => void
  onCompleteSignOff: () => void
  onLockDecision: () => void
  onUpdateScenario: <K extends keyof Scenario>(key: K, value: Scenario[K]) => void
  onCopyScenario: () => void
  onReset: () => void
}) {
  if (drawer.type === 'evidence') {
    return <div className="flex flex-col gap-5"><Pill tone={clarificationReceived ? 'teal' : 'amber'}>{clarificationReceived ? 'Evidence attached and reviewed' : 'Required evidence not located'}</Pill><div className="border border-border bg-secondary p-5"><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{clarificationReceived ? 'Clarification response · p.2' : 'Supplier response · p.38'}</p><p className="mt-3 text-sm leading-6">{clarificationReceived ? '“Our Addis Ababa partner holds 1,200 shelter kits and can dispatch to the named distribution hubs within 72 hours.”' : '“We maintain regional stock and partner capacity for rapid deployment across the Horn of Africa.”'}</p></div>{clarificationReceived ? <div className="border border-accent-foreground/30 bg-accent/60 p-5"><p className="text-sm font-semibold">Human determination recorded</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Sarah Ahmed confirmed the passage and attached documents satisfy the Ethiopia-specific obligation.</p></div> : <div className="border border-[#c9b15b] bg-[#fbf5df] p-5"><p className="text-sm font-semibold">Evidence gap</p><p className="mt-2 text-sm leading-6 text-muted-foreground">No passage names an Ethiopia warehouse, partner or distribution plan. Traceli will not infer this from general regional language.</p></div>}<button type="button" onClick={onOpenClarification} className="bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">{clarificationReceived ? 'Open resolved clarification' : 'Open supplier clarification'}</button></div>
  }

  if (drawer.type === 'why') {
    if (drawer.subject === 'exception') return <WhyException threshold={threshold} policy={scenario.policy} />
    if (drawer.subject === 'coverage') return <WhyCoverage evidenceCoverage={evidenceCoverage} clarificationReceived={clarificationReceived} />
    if (drawer.subject === 'source') return <WhySource />
    if (drawer.subject === 'governance') return <WhyGovernance />
    return <WhyRequirement />
  }

  if (drawer.type === 'clarification') {
    return <div className="flex flex-col gap-5"><Pill tone={clarificationReceived ? 'teal' : 'amber'}>{clarificationReceived ? 'Resolved and attached' : 'Supplier response received'}</Pill><div className="border border-border bg-secondary p-5"><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Request · CLR-004</p><p className="mt-3 text-sm leading-6">Please provide evidence demonstrating operational capacity in Ethiopia as required under Section 4.2 of the RFP.</p></div><div className="border border-accent-foreground/30 bg-accent/60 p-5"><p className="text-sm font-semibold">CLR-004-R1 · Ethiopia distribution plan</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Addis Ababa partner agreement, dispatch roster and country-specific 72-hour route plan attached.</p></div>{clarificationReceived ? <p className="text-sm leading-6 text-muted-foreground">The response is linked to REQ-07, the reviewer determination and the event chronology.</p> : <button type="button" onClick={onReceiveClarification} className="bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Attach response and update readiness</button>}</div>
  }

  if (drawer.type === 'decision') {
    const locked = decisionState === 'Locked'
    const ready = decisionState === 'Ready to lock'
    return <div className="flex flex-col gap-5"><div className={cn('border p-5', locked || ready ? 'border-accent-foreground/30 bg-accent/60' : 'border-[#c9b15b] bg-[#fbf5df]')}><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">Decision record · {decisionState}</p><Pill tone={locked || ready ? 'teal' : 'amber'}>{readinessState}</Pill></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{locked ? 'The record is sealed with its source and actor chronology.' : ready ? 'All blockers are resolved. A named human owner must lock the record.' : `Preview only. ${readinessDetail}.`}</p></div><div className="grid gap-3 sm:grid-cols-2"><StatusLine label="Evidence coverage" value={`${evidenceCoverage}%`} passing={evidenceCoverage === 100} /><StatusLine label="Decision readiness" value={readinessState} passing={ready || locked} /><StatusLine label="Panel approvals" value={ready || locked ? 'Complete' : '2 outstanding'} passing={ready || locked} /><StatusLine label="Conflict declarations" value={ready || locked ? 'Complete' : '1 outstanding'} passing={ready || locked} /></div><div className="space-y-3">{['Procurement details and governing-source versions', 'Panel members and criteria locked before opening', 'Requirement findings and cited supplier evidence', 'Clarifications, conflicts, comments and approvals', 'Complete chronology with source and actor labels'].map((item) => <div key={item} className="flex items-center gap-3 border-b border-border pb-3 text-sm"><Check className="size-4 text-accent-foreground" aria-hidden="true" />{item}</div>)}</div>{locked ? <button type="button" onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Download className="size-4" aria-hidden="true" />Export locked decision record</button> : ready ? <button type="button" onClick={onLockDecision} className="inline-flex items-center justify-center gap-2 bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Lock className="size-4" aria-hidden="true" />Lock record and inspect audit event</button> : <button type="button" onClick={onCompleteSignOff} disabled={!clarificationReceived} className="bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{clarificationReceived ? 'Record demo approvals and declaration' : 'Resolve evidence gap before sign-off'}</button>}</div>
  }

  if (drawer.type === 'event') {
    return selectedEvent ? <div className="flex flex-col gap-5"><div className="flex items-center justify-between gap-3"><Pill tone={selectedEvent.category === 'Traceli finding' ? 'amber' : selectedEvent.category === 'Approval' ? 'blue' : 'teal'}>{selectedEvent.category}</Pill><span className="font-mono text-[11px] text-muted-foreground">{selectedEvent.time}</span></div><div><p className="text-xs font-semibold text-muted-foreground">Event</p><p className="mt-2 text-lg font-semibold">{selectedEvent.title}</p></div><div className="grid gap-3 sm:grid-cols-2"><div className="bg-secondary p-4"><p className="text-xs font-semibold">Actor</p><p className="mt-2 text-sm">{selectedEvent.actor}</p></div><div className="bg-secondary p-4"><p className="text-xs font-semibold">Preserved source</p><p className="mt-2 text-sm">{selectedEvent.source}</p></div></div><div className="border-l-2 border-primary pl-4"><p className="text-xs font-semibold text-muted-foreground">Snapshot at event time</p><p className="mt-2 text-sm leading-6">{selectedEvent.snapshot}</p></div><button type="button" className="inline-flex items-center gap-2 text-xs font-semibold text-primary"><PanelRight className="size-4" aria-hidden="true" />Open versioned source record</button></div> : <p className="text-sm text-muted-foreground">Event snapshot not found.</p>
  }

  return <SettingsContent scenario={scenario} queryString={queryString} onUpdate={onUpdateScenario} onCopy={onCopyScenario} onReset={onReset} />
}

function WhyRequirement() {
  return <div className="flex flex-col gap-5"><Pill tone="blue">Source-grounded requirement</Pill><p className="text-sm leading-6">REQ-07 was extracted from Section 4.2, page 14 of RFP-2026-041 and confirmed by Sarah Ahmed.</p><blockquote className="border-l-2 border-primary pl-4 text-sm leading-6">“The supplier must demonstrate capacity to deliver emergency shelter kits within 72 hours across Kenya, Somalia and Ethiopia.”</blockquote><div className="grid gap-3 sm:grid-cols-2"><div className="bg-secondary p-4"><p className="text-xs font-semibold">Control link</p><p className="mt-2 text-sm">CTRL-11 · operational reach</p></div><div className="bg-secondary p-4"><p className="text-xs font-semibold">Criterion link</p><p className="mt-2 text-sm">Criterion 3 · locked 02 Apr</p></div></div><p className="text-sm leading-6 text-muted-foreground">The connection exists because the panel explicitly mapped the tender obligation to the pre-locked operational-reach criterion. It is not inferred from the supplier response.</p></div>
}

function WhyException({ threshold, policy }: { threshold: string; policy: Scenario['policy'] }) {
  return <div className="flex flex-col gap-5"><Pill tone="amber">Process control · not a supplier finding</Pill><p className="text-sm leading-6">The approved budget exceeds {threshold}, which triggers an additional approval under {policy}.</p><div className="border-l-2 border-[#a9781e] pl-4 text-sm leading-6">“Procurements above the delegated threshold require written grants and procurement approval before award.”</div><div className="grid gap-3 sm:grid-cols-2"><div className="bg-secondary p-4"><p className="text-xs font-semibold">Source</p><p className="mt-2 text-sm">Donor conditions · §5.2</p></div><div className="bg-secondary p-4"><p className="text-xs font-semibold">Owner</p><p className="mt-2 text-sm">Grants & compliance</p></div></div><p className="text-sm leading-6 text-muted-foreground">This explanation is intentionally different from REQ-07 provenance: it concerns the procurement process, not supplier evidence.</p></div>
}

function WhyCoverage({ evidenceCoverage, clarificationReceived }: { evidenceCoverage: number; clarificationReceived: boolean }) {
  return <div className="flex flex-col gap-5"><Pill tone="blue">Evidence denominator explained</Pill><p className="text-sm leading-6">Evidence coverage is {evidenceCoverage}% because {clarificationReceived ? '27 of 27' : '23 of 27'} required evidence links contain a cited passage or reviewed attachment.</p><div className="bg-secondary p-5"><p className="text-sm font-semibold">Included in the denominator</p><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground"><li>Required supplier-document evidence links</li><li>Mandatory declarations and certificates expected from submissions</li><li>Clarification attachments once reviewed and linked</li></ul></div><div className="border border-border p-5"><p className="text-sm font-semibold">Excluded from evidence coverage</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Panel approvals, process exceptions and conflict declarations remain separate decision-readiness controls. Evidence coverage is never a supplier score.</p></div></div>
}

function WhySource() {
  return <div className="flex flex-col gap-5"><Pill tone="blue">Connected source metadata</Pill><div><p className="text-sm font-semibold">Procurement Manual v4.1</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Approved policy source connected from the controlled policy repository.</p></div><div className="grid gap-3 sm:grid-cols-2"><StatusLine label="Owner" value="Global procurement policy" passing /><StatusLine label="Effective" value="01 Jan 2026" passing /><StatusLine label="Last sync" value="18 Aug · 22:08 UTC" passing /><StatusLine label="Access" value="All staff · read only" passing /></div><div className="border-l-2 border-primary pl-4 text-sm leading-6">The retrieved passage and version are preserved with every draft clause or control that depends on this source.</div></div>
}

function WhyGovernance() {
  return <div className="flex flex-col gap-5"><Pill tone="teal">Human judgment remains explicit</Pill><p className="text-sm leading-6">Traceli can extract obligations, locate evidence, surface gaps and challenge policy consistency. It does not decide compliance or award.</p><div className="grid gap-3"><StatusLine label="Traceli owns" value="Source links, controls, versions and chronology" passing /><StatusLine label="Reviewers own" value="Interpretation and requirement determinations" passing /><StatusLine label="Panel owns" value="Compliance conclusions and award recommendation" passing /></div><p className="text-sm leading-6 text-muted-foreground">This boundary is visible in the buyer workflow and preserved in the final decision record.</p></div>
}

function StatusLine({ label, value, passing }: { label: string; value: string; passing: boolean }) {
  return <div className="border border-border p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-2 text-sm font-medium">{value}</p></div>{passing ? <CheckCircle2 className="size-4 shrink-0 text-accent-foreground" aria-hidden="true" /> : <AlertCircle className="size-4 shrink-0 text-[#8b6014]" aria-hidden="true" />}</div></div>
}

function SettingsContent({ scenario, queryString, onUpdate, onCopy, onReset }: { scenario: Scenario; queryString: string; onUpdate: <K extends keyof Scenario>(key: K, value: Scenario[K]) => void; onCopy: () => void; onReset: () => void }) {
  return <div className="flex flex-col gap-5"><div className="border border-accent-foreground/30 bg-accent/60 p-4"><p className="text-sm font-semibold">Meeting-safe personalization</p><p className="mt-2 text-xs leading-5 text-muted-foreground">All switches use cached fictional data. No code edit, model call or expo Wi-Fi upload is required.</p></div><div className="grid gap-4 sm:grid-cols-2"><ScenarioSelect label="Organization" value={scenario.organization} options={scenarioOptions.organization} onChange={(value) => onUpdate('organization', value as Scenario['organization'])} /><ScenarioSelect label="Procurement mode" value={scenario.procurement} options={scenarioOptions.procurement} onChange={(value) => onUpdate('procurement', value as Scenario['procurement'])} /><ScenarioSelect label="Policy pack" value={scenario.policy} options={scenarioOptions.policy} onChange={(value) => onUpdate('policy', value as Scenario['policy'])} /><ScenarioSelect label="Geography" value={scenario.geography} options={scenarioOptions.geography} onChange={(value) => onUpdate('geography', value as Scenario['geography'])} /><ScenarioSelect label="Currency" value={scenario.currency} options={scenarioOptions.currency} onChange={(value) => onUpdate('currency', value as Scenario['currency'])} /><ScenarioSelect label="Buyer view" value={scenario.role} options={scenarioOptions.role} onChange={(value) => onUpdate('role', value as Scenario['role'])} /></div><div className="border border-border bg-secondary p-4"><p className="text-xs font-semibold">Shareable preset</p><p className="mt-2 break-all font-mono text-[10px] leading-5 text-muted-foreground">?{queryString}</p><button type="button" onClick={onCopy} className="mt-3 inline-flex items-center gap-2 bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Copy className="size-3.5" aria-hidden="true" />Copy scenario link</button></div><button type="button" onClick={onReset} className="inline-flex items-center justify-center gap-2 border border-border px-4 py-3 text-sm font-semibold hover:bg-secondary"><RefreshCcw className="size-4" aria-hidden="true" />Reset cached scenario</button></div>
}

function ScenarioSelect({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  const id = `scenario-${label.toLowerCase().replaceAll(' ', '-')}`
  return <label htmlFor={id} className="text-xs font-semibold">{label}<select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full border border-input bg-card p-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-ring/30">{options.map((option) => <option key={option}>{option}</option>)}</select></label>
}
