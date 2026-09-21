import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Database,
  ExternalLink,
  FileLock2,
  GitBranch,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Award assurance documentation',
  description: 'How Traceli tests award readiness and connects procurement rules, evidence, human decisions and approvals.',
}
type Availability = 'Demo available' | 'In implementation' | 'Private alpha planned' | 'Pilot dependent'

const sections = [
  { href: '#available-now', label: 'Available now' },
  { href: '#why-assurance', label: 'Why award assurance' },
  { href: '#control-model', label: 'Control model' },
  { href: '#security', label: 'Security and data' },
  { href: '#workflow', label: 'Procurement workflow' },
  { href: '#integrations', label: 'Integrations' },
  { href: '#mcp', label: 'MCP' },
]

const workflow = [
  ['01', 'Map governing controls', 'Donor conditions, institutional policy, local rules and tender commitments become one versioned control profile.'],
  ['02', 'Lock criteria and ownership', 'A named officer confirms the criteria, evidence requirements, decision rights and required approvals.'],
  ['03', 'Link the award evidence', 'Supplier proof, reviewer judgments, clarifications, integrity concerns and exceptions stay connected to each control.'],
  ['04', 'Resolve or explicitly except', 'Unsupported and ambiguous claims remain visible until a named human resolves or accepts the exception.'],
  ['05', 'Approve and issue the pack', 'The canonical record preserves who decided, what supported the decision and what remained open at sign-off.'],
] as const

const publicCases = [
  {
    metric: 'Audit finding',
    title: 'Incomplete bid evaluation files',
    detail: 'UN OIOS found that bid evaluations at UNMISS were not timely and their documentation was inadequate, and recommended complete evaluation files and delay justifications.',
    source: 'UN OIOS · Report 2024/064',
    href: 'https://oios.un.org/system/files/confidential-files/Reports/2024_064_pd.pdf',
  },
  {
    metric: '€7.5m',
    title: 'Irregular procurement and ineligible payments',
    detail: 'OLAF found that an EU agency tender breached sound financial management and prevented proper competition; the resulting payments were considered ineligible.',
    source: 'European Anti-Fraud Office · 2025',
    href: 'https://ec.europa.eu/olaf-report/2025/investigative-activities/protection-of-eu-funds_en.html#an-irregular-tender-procedure',
  },
  {
    metric: '€112m',
    title: 'Future funding behind remediation',
    detail: 'After finding contracts awarded without competition or through rigged competition, fake offers and inflated prices, OLAF recommended protecting future IPARD funding until remedial measures were in place.',
    source: 'European Anti-Fraud Office · 2023',
    href: 'https://ec.europa.eu/olaf-report/2023/investigative-activities/preventing-undue-expenditure_en.html#serious-misuse-of-eu-pre-accession-agricultural-funds',
  },
  {
    metric: '63 months',
    title: 'Debarment for false bid experience',
    detail: 'The World Bank debarred a supplier for fraudulent practices after it falsely claimed past experience in bids for two financed projects in Afghanistan.',
    source: 'World Bank Group · 2025',
    href: 'https://www.worldbank.org/en/news/press-release/2025/06/18/world-bank-group-debars-pars-tableau-company-jsc',
  },
] as const

function TraceliMark() {
  return (
    <span className="flex items-center gap-3">
      <ShieldCheck className="size-7 stroke-[1.6]" aria-hidden="true" />
      <span className="font-mono text-[13px] font-semibold uppercase tracking-[0.29em]">traceli</span>
    </span>
  )
}

function AvailabilityPill({ status }: { status: Availability }) {
  const styles: Record<Availability, string> = {
    'Demo available': 'border-[#9bcbbf] bg-[#e2f2ed] text-[#1f6e5d]',
    'In implementation': 'border-[#c8b374] bg-[#f8edcf] text-[#765416]',
    'Private alpha planned': 'border-[#a8bdd0] bg-[#e5edf3] text-[#345b77]',
    'Pilot dependent': 'border-[#d2cec4] bg-[#f0ede6] text-[#626d72]',
  }

  return <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold', styles[status])}>{status}</span>
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-[#2f8876]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-[#617078]">{description}</p>
    </div>
  )
}

function PrincipleCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-2xl border border-[#d8d5cc] bg-white p-5">
      <span className="flex size-10 items-center justify-center rounded-xl bg-[#071d39] text-[#78d8c4]"><Icon className="size-4" aria-hidden="true" /></span>
      <h3 className="mt-5 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-xs leading-6 text-[#617078]">{children}</p>
    </article>
  )
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#f7f3eb] text-[#071d39]">
      <a href="#docs-content" className="sr-only z-[80] rounded-lg bg-[#071d39] px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to documentation</a>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#061a33]/95 text-[#fbf5ea] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1450px] items-center justify-between gap-5 px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/" aria-label="Traceli home"><TraceliMark /></Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" className="hidden items-center gap-2 px-3 py-2 text-sm font-medium text-white/60 transition hover:text-white sm:inline-flex"><ArrowLeft className="size-4" aria-hidden="true" />Back to story</Link>
            <Link href="/demo" className="group inline-flex min-h-11 items-center gap-3 rounded-xl border border-white/18 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#78d8c4]/55 hover:bg-white/[0.08]">Open demo<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1450px] lg:grid-cols-[250px_1fr]">
        <aside className="hidden border-r border-[#d8d5cc] px-6 py-10 lg:sticky lg:top-[77px] lg:block lg:h-[calc(100vh-77px)]">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#7b858a]">Documentation</p>
          <nav aria-label="Documentation sections" className="mt-5 flex flex-col gap-1">
            {sections.map((section) => <a key={section.href} href={section.href} className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#66737a] transition hover:bg-white hover:text-[#071d39]">{section.label}</a>)}
          </nav>
          <div className="mt-8 rounded-2xl border border-[#a5d3c8] bg-[#e6f3ee] p-4">
            <p className="text-xs font-semibold">Availability is explicit</p>
            <p className="mt-2 text-[11px] leading-5 text-[#55716b]">These pages distinguish what works in the demo, what is being implemented and what depends on a pilot.</p>
          </div>
        </aside>

        <main id="docs-content" className="min-w-0 px-5 py-12 sm:px-8 lg:px-12 lg:py-16 xl:px-16">
          <div className="max-w-5xl">
            <div className="max-w-4xl border-b border-[#d8d5cc] pb-14">
              <div className="flex flex-wrap items-center gap-2"><AvailabilityPill status="Demo available" /><span className="text-xs text-[#7a858b]">Availability reviewed 21 September 2026</span></div>
              <h1 className="mt-6 font-display text-6xl leading-[0.9] tracking-[-0.035em] sm:text-7xl">Prove the award before you sign it.</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-[#5f6f77]">Traceli is the award-assurance layer for donor-funded procurement. It connects governing rules, supplier evidence, human judgment and required approval before donor review, complaint or audit.</p>
            </div>

            <section id="available-now" className="scroll-mt-28 border-b border-[#d8d5cc] py-14">
              <SectionHeading eyebrow="Available now" title="Follow one decision from evidence to review." description="The public Trace demo shows the current evidence workflow: inspect a fictional rule, see what the supplied evidence supports, add a new evidence version, record a review and download the demonstration record." />
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <PrincipleCard icon={BookOpenCheck} title="Public Trace demo">Eight fictional scenarios distinguish missing evidence, failed requirements, rule conflicts and unavailable model results. Reviews stay in the browser tab; the download is a simulation.</PrincipleCard>
                <PrincipleCard icon={UserCheck} title="Protected workflow">The separate authenticated Trace implementation supports stored evidence versions, human review and controlled exports. Hosted activation and customer-data use remain gated.</PrincipleCard>
                <PrincipleCard icon={FileLock2} title="Real sources and decisions">Official-source admission, customer permissions and production document handling still require verification. The public demonstration makes no real procurement or compliance determination.</PrincipleCard>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-5 text-sm font-semibold">
                <Link href="/demo" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#071d39] px-5 py-3 text-white">Try the Trace demo<ArrowRight className="size-4" aria-hidden="true" /></Link>
                <Link href="/demo/classic" className="text-[#1f6f61] underline underline-offset-4">Earlier procurement walkthrough</Link>
              </div>
            </section>

            <section id="why-assurance" className="scroll-mt-28 border-b border-[#d8d5cc] py-14">
              <SectionHeading eyebrow="Why award assurance" title="The cost of missing proof appears after the decision." description="Public institutional records show four consequence categories: audit findings, ineligible spend, funding conditions and integrity sanctions. Award assurance moves the proof test before sign-off." />
              <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-[#d8d5cc] bg-[#d8d5cc] sm:grid-cols-2">
                {publicCases.map(({ metric, title, detail, source, href }) => (
                  <article key={title} className="flex min-h-[250px] flex-col bg-white p-5 sm:p-6">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2f8876]">{metric}</p>
                    <h3 className="mt-5 text-base font-semibold">{title}</h3>
                    <p className="mt-2 text-xs leading-6 text-[#617078]">{detail}</p>
                    <a href={href} target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[11px] font-semibold text-[#2f8876] hover:underline">{source}<ExternalLink className="size-3" aria-hidden="true" /></a>
                  </article>
                ))}
              </div>
              <p className="mt-5 text-[11px] leading-5 text-[#748087]">These are public records from the issuing institutions. They are not Traceli customers or endorsements, and Traceli does not claim it would have prevented the outcomes. See the governed research register in the repository for claim status and review rules.</p>
            </section>

            <section id="control-model" className="scroll-mt-28 border-b border-[#d8d5cc] py-14">
              <SectionHeading eyebrow="Control model" title="A pre-award gate, not another system of record." description="The tender portal runs the procedure and the ERP records the commitment. Traceli tests whether each material award claim is supported, unresolved or explicitly excepted, then assembles the Traceli Award Assurance Pack." />
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <PrincipleCard icon={BookOpenCheck} title="Map the controls">Approved donor, institutional, local and tender rules remain versioned and cited.</PrincipleCard>
                <PrincipleCard icon={UserCheck} title="Resolve the gaps">Models can locate and challenge evidence; named humans decide, approve and accept exceptions.</PrincipleCard>
                <PrincipleCard icon={FileLock2} title="Issue the pack">The signed decision record preserves the rule, evidence, judgment, approval and chronology behind the award.</PrincipleCard>
              </div>
              <div className="mt-5 rounded-2xl border border-[#a5d3c8] bg-[#e6f3ee] p-5">
                <p className="text-sm font-semibold">Readiness language is bounded</p>
                <p className="mt-2 text-xs leading-6 text-[#55716b]">`Ready` means the configured control profile is complete or has named, approved exceptions. It is not legal advice, a compliance certification or a guarantee that an audit or donor will accept the award.</p>
              </div>
            </section>

            <section id="security" className="scroll-mt-28 border-b border-[#d8d5cc] py-14">
              <div className="flex flex-wrap items-start justify-between gap-4"><SectionHeading eyebrow="Security and data" title="The document boundary comes first." description="Real buyer documents will enter Traceli only after the private file room, organization isolation, scanning, retention and access evidence pass their pilot gates." /><AvailabilityPill status="In implementation" /></div>
              <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-[#d8d5cc] bg-[#d8d5cc] sm:grid-cols-2">
                {[
                  [LockKeyhole, 'Tenant isolation', 'Required for customer use: server authorization on every read, write, search, export and generated URL.'],
                  [Database, 'Private evidence custody', 'Required for customer use: private, versioned originals and short-lived access after a fresh authorization check.'],
                  [KeyRound, 'Minimum model exposure', 'Required for customer use: minimal provider disclosure under explicit buyer policy. The public demo makes no model calls.'],
                  [ShieldCheck, 'No autonomous award', 'Models do not exclude suppliers, approve exceptions or make the award decision.'],
                ].map(([Icon, title, detail]) => {
                  const ItemIcon = Icon as LucideIcon
                  return <div key={title as string} className="bg-white p-5"><ItemIcon className="size-5 text-[#2f8876]" aria-hidden="true" /><p className="mt-4 text-sm font-semibold">{title as string}</p><p className="mt-2 text-xs leading-6 text-[#617078]">{detail as string}</p></div>
                })}
              </div>
            </section>

            <section id="workflow" className="scroll-mt-28 border-b border-[#d8d5cc] py-14">
              <div className="flex flex-wrap items-start justify-between gap-4"><SectionHeading eyebrow="Procurement workflow" title="From governing controls to signed proof." description="Traceli complements the buyer's existing tender portal and ERP. It keeps the assurance record across the process and exposes unresolved claims before approval." /><AvailabilityPill status="Demo available" /></div>
              <ol className="mt-8 overflow-hidden rounded-2xl border border-[#d8d5cc] bg-white">
                {workflow.map(([number, title, detail], index) => <li key={number} className={cn('grid gap-3 p-5 sm:grid-cols-[48px_220px_1fr] sm:items-start', index > 0 && 'border-t border-[#e1ded5]')}><span className="font-mono text-[10px] font-semibold text-[#2f8876]">{number}</span><span className="text-sm font-semibold">{title}</span><span className="text-xs leading-6 text-[#617078]">{detail}</span></li>)}
              </ol>
            </section>

            <section id="integrations" className="scroll-mt-28 border-b border-[#d8d5cc] py-14">
              <div className="flex flex-wrap items-start justify-between gap-4"><SectionHeading eyebrow="Integrations" title="Alongside the systems buyers already use." description="The first connector will be selected by a signed pilot—not by building a speculative catalogue." /><AvailabilityPill status="Pilot dependent" /></div>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  ['Tender portals', 'Import procurement metadata, documents and status without replacing the source portal.'],
                  ['ERP and finance', 'Synchronize durable identifiers, approval references and award status through a controlled adapter.'],
                  ['SIEM and audit', 'Deliver administrative events while Traceli retains the procurement-specific decision record.'],
                ].map(([title, detail]) => <article key={title} className="rounded-2xl border border-[#d8d5cc] bg-white p-5"><p className="text-sm font-semibold">{title}</p><p className="mt-2 text-xs leading-6 text-[#617078]">{detail}</p></article>)}
              </div>
            </section>

            <section id="mcp" className="scroll-mt-28 py-14">
              <div className="flex flex-wrap items-start justify-between gap-4"><SectionHeading eyebrow="MCP" title="Permissioned access wherever teams work." description="MCP will be a thin, audited access channel over the same tenant, document and human-decision rules as the Traceli application." /><AvailabilityPill status="Private alpha planned" /></div>
              <div className="mt-8 rounded-2xl bg-[#071d39] p-6 text-white sm:p-8">
                <div className="flex items-start gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-[#78d8c4]"><GitBranch className="size-5" aria-hidden="true" /></span><div><p className="text-base font-semibold">Planned first boundary: read-only tools</p><p className="mt-2 max-w-2xl text-xs leading-6 text-white/55">List procurements, inspect status, open permission-checked requirements, search approved sources and verify decision records. No raw unrestricted document download and no autonomous award actions.</p></div></div>
                <div className="mt-6 grid gap-2 font-mono text-[10px] sm:grid-cols-2">
                  {['get_procurement_status', 'get_requirement', 'search_approved_sources', 'verify_decision_record'].map((tool) => <div key={tool} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-white/68"><CheckCircle2 className="size-3.5 text-[#78d8c4]" aria-hidden="true" />{tool}</div>)}
                </div>
                <p className="mt-5 text-[10px] leading-5 text-white/38">Setup instructions will be published only after cross-tenant isolation, citation controls and document-exfiltration tests pass in at least two supported clients.</p>
              </div>
            </section>

            <div className="rounded-[26px] bg-[#dff1eb] p-7 sm:p-9">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-[#2f8876]">Founding paid pilot</p>
              <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-semibold tracking-[-0.03em]">Bring one completed tender.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#52696a]">Run a six-week retrospective assurance pilot. Traceli reconstructs the rules-to-award record and tests it with an independent reviewer; sensitive documents move only after the contractual and security gate passes.</p></div><a href="mailto:hello@trace-li.com?subject=Award%20Assurance%20Pilot" className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-xl bg-[#071d39] px-5 py-3 text-sm font-semibold text-white">Discuss a paid pilot<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></a></div>
            </div>

            <footer className="mt-14 flex flex-col gap-4 border-t border-[#d8d5cc] pt-7 text-xs text-[#758087] sm:flex-row sm:items-center sm:justify-between"><span>Traceli · Award assurance for donor-funded procurement</span><a href="https://www.ungm.org/Public/Notice/254522" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-[#2f8876] hover:underline">Walkthrough tender source<ExternalLink className="size-3" aria-hidden="true" /></a></footer>
          </div>
        </main>
      </div>
    </div>
  )
}
