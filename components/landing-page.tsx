'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  ExternalLink,
  FileInput,
  Fingerprint,
  GitBranch,
  ListChecks,
  ScanSearch,
  Waypoints,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { LandingFilm } from '@/components/landing-film'

const bookingHref = 'https://cal.com/oqemal/30min'

const outcomes: Array<{
  title: string
  detail: string
  eyebrow: string
  icon: LucideIcon
  detailIcon: LucideIcon
  tone: 'mint' | 'blue' | 'violet'
}> = [
  {
    eyebrow: '01 · Control',
    title: 'Map the award controls',
    detail: 'Connect donor, institutional and local rules to the criteria, evidence and approvals that govern the award.',
    icon: FileInput,
    detailIcon: ListChecks,
    tone: 'mint',
  },
  {
    eyebrow: '02 · Resolve',
    title: 'Surface the evidence gaps',
    detail: 'Keep supplier proof, reviewer judgment, clarifications and exceptions visible for human disposition before the decision is signed.',
    icon: ScanSearch,
    detailIcon: Waypoints,
    tone: 'blue',
  },
  {
    eyebrow: '03 · Prove',
    title: 'Issue the assurance pack',
    detail: 'Give reviewers one source-linked record of the rules, evidence, human decisions, exceptions and approvals.',
    icon: BadgeCheck,
    detailIcon: Fingerprint,
    tone: 'violet',
  },
]

const publicCases = [
  {
    metric: 'Audit finding',
    title: 'Incomplete files weakened auditability',
    detail: 'UN OIOS found that bid evaluations at UNMISS were not timely and their documentation was inadequate.',
    source: 'UN OIOS · Report 2024/064',
    href: 'https://oios.un.org/system/files/confidential-files/Reports/2024_064_pd.pdf',
  },
  {
    metric: '€7.5m',
    title: 'Payments became ineligible',
    detail: 'OLAF found an EU agency tender irregular after failures in transparency, equal treatment and proper competition.',
    source: 'European Anti-Fraud Office · 2025',
    href: 'https://ec.europa.eu/olaf-report/2025/investigative-activities/protection-of-eu-funds_en.html#an-irregular-tender-procedure',
  },
  {
    metric: '€112m',
    title: 'Future funding required remediation',
    detail: 'After uncovering rigged competition and fake offers, OLAF recommended protecting future IPARD funding until remedial measures were in place.',
    source: 'European Anti-Fraud Office · 2023',
    href: 'https://ec.europa.eu/olaf-report/2023/investigative-activities/preventing-undue-expenditure_en.html#serious-misuse-of-eu-pre-accession-agricultural-funds',
  },
  {
    metric: '63 months',
    title: 'False bid experience led to debarment',
    detail: 'The World Bank debarred a supplier that falsely claimed past experience in bids for two financed projects.',
    source: 'World Bank Group · 2025',
    href: 'https://www.worldbank.org/en/news/press-release/2025/06/18/world-bank-group-debars-pars-tableau-company-jsc',
  },
] as const

const faqItems = [
  {
    question: 'Does Traceli replace our ERP or tender portal?',
    answer: 'No. Those systems remain authoritative for the procedures and transactions they record. Traceli connects the rule, evidence, judgment, exception and approval needed to defend the award across those sources.',
  },
  {
    question: 'Does Traceli certify donor or legal compliance?',
    answer: "No. Traceli surfaces configured controls and supporting evidence for human review. Your authorized people remain responsible for the decision and any compliance determination.",
  },
  {
    question: 'Does Traceli replace internal audit?',
    answer: 'No. It helps the operating team maintain a testable award record before audit and gives independent reviewers a source-linked pack to inspect.',
  },
  {
    question: 'What happens to sensitive procurement data?',
    answer: 'No sensitive file enters the pilot until the NDA, data classification, approved transfer route, processing terms and technical security gate are agreed.',
  },
  {
    question: 'What does the first pilot cover?',
    answer: 'One organization, one completed tender and one six-week retrospective. We reconstruct the rules-to-award evidence chain, expose unresolved proof and test the resulting pack with an independent reviewer.',
  },
  {
    question: 'Where does the budget come from?',
    answer: 'There is no assumed software budget line. The customer identifies and approves the permitted route, which may sit with programme assurance, audit remediation, internal controls, procurement improvement, fiduciary strengthening or technical assistance.',
  },
] as const

const experienceMarks = [
  {
    name: 'World Food Programme',
    src: 'https://designsystem.wfp.org/_next/static/media/wfp-logo-en.22_z48y8y3c-e.svg',
    className: 'h-12 max-w-[150px]',
  },
  {
    name: 'UN Climate Change',
    src: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/UNFCCC_logo_with_text.svg',
    className: 'h-10 max-w-[158px]',
  },
  {
    name: 'Oxfam',
    src: 'https://www.oxfam.org/themes/custom/oxfamint/images/logo.png',
    className: 'h-12 max-w-[120px]',
  },
  {
    name: 'Google',
    src: 'https://www.gstatic.com/images/branding/googlelogo/svg/googlelogo_clr_74x24px.svg',
    className: 'h-8 max-w-[116px]',
  },
  {
    name: 'Careem',
    src: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Careem_Logo.svg',
    className: 'h-9 max-w-[132px]',
  },
] as const

const glyphTones = {
  mint: {
    glow: 'bg-[#74e0c4]',
    surface: 'from-[#e8faf4] via-white to-[#d8f4eb]',
    primary: 'text-[#0c594d]',
    detail: 'bg-[#0b2a43] text-[#8be1cf]',
  },
  blue: {
    glow: 'bg-[#74aaf2]',
    surface: 'from-[#ecf4ff] via-white to-[#dceaff]',
    primary: 'text-[#174f8f]',
    detail: 'bg-[#102a4b] text-[#9bc7ff]',
  },
  violet: {
    glow: 'bg-[#9e8cf3]',
    surface: 'from-[#f2efff] via-white to-[#e6e0ff]',
    primary: 'text-[#55449d]',
    detail: 'bg-[#201e4f] text-[#c9beff]',
  },
} as const

function OutcomeGlyph({ icon: Icon, detailIcon: DetailIcon, tone }: { icon: LucideIcon; detailIcon: LucideIcon; tone: keyof typeof glyphTones }) {
  const palette = glyphTones[tone]

  return (
    <span className={cn('relative flex size-16 items-center justify-center overflow-hidden rounded-[19px] border border-[#dce1e7] bg-gradient-to-br shadow-[0_12px_28px_rgba(7,29,57,0.13),inset_0_1px_0_rgba(255,255,255,0.9)]', palette.surface)}>
      <span className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(7,29,57,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(7,29,57,0.18)_1px,transparent_1px)] [background-size:12px_12px]" aria-hidden="true" />
      <span className={cn('absolute -right-4 -top-4 size-10 rounded-full blur-xl', palette.glow)} aria-hidden="true" />
      <Icon className={cn('relative size-7 stroke-[1.65]', palette.primary)} aria-hidden="true" />
      <span className={cn('absolute bottom-1.5 right-1.5 flex size-5 items-center justify-center rounded-[7px] border border-white/30 shadow-sm', palette.detail)}>
        <DetailIcon className="size-2.5 stroke-[1.8]" aria-hidden="true" />
      </span>
    </span>
  )
}

function TraceliMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className={cn('relative flex shrink-0 items-center justify-center', compact ? 'size-8' : 'size-9')} aria-hidden="true">
        <span className="absolute inset-[3px] rotate-45 rounded-[8px] border border-[#8be1cf]/65 bg-gradient-to-br from-[#0d3953] to-[#071d39] shadow-[0_6px_18px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.16)]" />
        <span className="absolute inset-[7px] rotate-45 rounded-[5px] border border-white/20" />
        <Waypoints className={cn('relative text-[#fbf5ea] drop-shadow-sm', compact ? 'size-4' : 'size-[18px]', 'stroke-[1.75]')} />
        <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full border border-[#061a33] bg-[#78d8c4] shadow-[0_0_8px_rgba(120,216,196,0.8)]" />
      </span>
      <span className="font-mono text-[13px] font-semibold uppercase tracking-[0.27em] text-[#fbf5ea]">traceli</span>
    </span>
  )
}

export default function LandingPage() {
  const [filmOpen, setFilmOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#061a33] text-[#fbf5ea]">
      <a href="#main-content" className="sr-only z-[80] rounded-lg bg-[#fbf5ea] px-4 py-2 text-[#071d39] focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to main content</a>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#061a33]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-x-3 gap-y-3 px-5 py-3 sm:gap-5 sm:px-8 sm:py-4 lg:flex-nowrap lg:px-12">
          <Link href="/" aria-label="Traceli home"><TraceliMark /></Link>
          <nav aria-label="Public navigation" className="flex items-center gap-1.5 sm:gap-3 lg:gap-5">
            <Link href="/insights" className="hidden whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-white/62 transition hover:bg-white/[0.06] hover:text-white sm:inline-flex">Research</Link>
            <Link href="/docs" className="hidden whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-white/62 transition hover:bg-white/[0.06] hover:text-white sm:inline-flex">Documentation</Link>
            <Link href="/login" className="inline-flex min-h-11 items-center whitespace-nowrap rounded-xl border border-white/18 px-3 py-2.5 text-sm font-semibold text-white transition hover:border-[#78d8c4]/55 hover:bg-white/[0.08] sm:px-4">
              Login
            </Link>
            <Link href="/demo" className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#78d8c4]">
              Open demo
              <ArrowRight className="hidden size-4 sm:block" aria-hidden="true" />
            </Link>
          </nav>
        </div>
        <nav aria-label="Mobile public navigation" className="overflow-x-auto border-t border-white/10 sm:hidden">
          <div className="mx-auto flex min-w-max max-w-[1800px] items-center gap-5 px-5 py-2.5 text-xs font-medium text-white/65">
            <Link href="/insights" className="py-1 hover:text-white">Research</Link>
            <Link href="/docs" className="py-1 hover:text-white">Documentation</Link>
          </div>
        </nav>
      </header>

      <main id="main-content">
        <section aria-labelledby="landing-heading" className="border-b border-white/10 bg-[#061a33]">
          <div className="mx-auto grid max-w-[1800px] items-center gap-8 px-5 py-10 sm:gap-10 sm:px-8 sm:py-16 lg:min-h-[620px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-12 lg:px-12 xl:gap-16 xl:py-20 2xl:min-h-[700px]">
            <div className="min-w-0">
              <p className="max-w-[540px] font-mono text-[11px] font-medium uppercase leading-5 tracking-[0.1em] text-white/75 sm:text-xs">Award assurance for donor-funded procurement</p>
              <h1 id="landing-heading" className="mt-5 text-balance font-display text-[clamp(2.75rem,5.7vw,5.25rem)] leading-[0.98] tracking-[-0.035em] text-[#fbf5ea] lg:text-[clamp(3rem,5.5vw,6.5rem)]">
                Be ready to
                <span className="block">explain the award.</span>
              </h1>
              <p className="mt-6 max-w-[540px] text-base leading-7 text-white/75 sm:text-lg 2xl:text-xl 2xl:leading-8">
                Traceli connects the rules, evidence and human decisions behind one procurement file—so you can see what’s missing and prepare for review.
              </p>
              <div className="mt-8">
                <a href={bookingHref} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-6 rounded-md bg-[#fbf5ea] px-6 py-3 text-sm font-semibold text-[#071d39] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#78d8c4]">
                  Discuss one file
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </div>
              <details className="mt-5 max-w-[460px] text-sm leading-6 text-white/70">
                <summary className="w-fit cursor-pointer rounded-sm py-1 underline decoration-white/30 underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#78d8c4]">How the pilot works</summary>
                <p className="mt-3">Start with one completed procurement file, the question it needs to answer, and your review date. We agree a bounded six-week paid pilot. Your existing process remains authoritative, and no sensitive files move before the data route is agreed.</p>
              </details>
            </div>
            <LandingFilm open={filmOpen} onOpen={() => setFilmOpen(true)} onClose={() => setFilmOpen(false)} />
          </div>

          <div className="mx-auto max-w-[1800px] border-t border-white/10 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
            <div className="grid gap-7 lg:grid-cols-[280px_1fr] lg:items-center lg:gap-12">
              <div className="max-w-[270px]">
                <p className="font-display text-[1.7rem] leading-[1.02] tracking-[-0.025em] text-[#fbf5ea]">Built by the people from</p>
                <p className="mt-3 text-xs leading-5 text-white/65">Individual prior experience—not customers, partners or endorsements.</p>
              </div>
              <ul aria-label="Organizations where the Traceli team has prior professional experience" className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/14 bg-white/14 shadow-[0_14px_38px_rgba(0,0,0,0.12)] sm:grid-cols-5">
                {experienceMarks.map(({ name, src, className }) => (
                  <li key={name} className="group flex min-h-24 items-center justify-center bg-white/[0.055] px-5 py-6 backdrop-blur-[5px] transition-colors last:col-span-2 hover:bg-white/[0.09] sm:min-h-28 sm:last:col-span-1">
                    <img
                      src={src}
                      alt={name}
                      loading="lazy"
                      decoding="async"
                      className={cn('w-auto object-contain brightness-0 invert opacity-75 grayscale drop-shadow-[0_1px_8px_rgba(6,26,51,0.28)] transition duration-300 group-hover:scale-[1.025] group-hover:opacity-90', className)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section aria-labelledby="featured-research-heading" className="border-b border-[#d8d5cc] bg-[#e4ede7] px-5 py-14 text-[#071d39] sm:px-8 lg:px-12 lg:py-20">
          <div className="mx-auto grid max-w-[1320px] items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div className="max-w-lg">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2f8876]">Featured research · Before You Sign</p>
              <h2 id="featured-research-heading" className="mt-5 font-display text-5xl leading-[0.98] tracking-[-0.025em] sm:text-6xl">The award was signed. The proof was not ready.</h2>
              <p className="mt-6 text-base leading-7 text-[#45565d]">Four official records and seven questions for one completed award. Explore the visual briefing and the evidence behind it.</p>
              <Link href="/insights/the-award-was-signed-the-proof-was-not-ready#visual-briefing" className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-xl bg-[#071d39] px-5 text-sm font-semibold text-white hover:bg-[#0d3057]">Explore the seven-slide briefing<ArrowRight className="size-4" aria-hidden="true" /></Link>
            </div>
            <Link href="/insights/the-award-was-signed-the-proof-was-not-ready#visual-briefing" aria-label="View the illustrated award-evidence briefing" className="group grid grid-cols-2 items-center gap-3 sm:gap-5">
              <Image src="/research/before-you-sign-01/carousel/01-cover.png" alt="" width={1080} height={1350} unoptimized className="h-auto w-full rounded-xl border border-[#071d39]/15 shadow-[0_15px_40px_rgba(7,29,57,0.12)] transition-transform motion-safe:group-hover:-translate-y-1" />
              <Image src="/research/before-you-sign-01/carousel/03-auditability-financial-eligibility.png" alt="" width={1080} height={1350} unoptimized className="mt-8 h-auto w-full rounded-xl border border-[#071d39]/15 shadow-[0_15px_40px_rgba(7,29,57,0.12)] transition-transform motion-safe:group-hover:-translate-y-1 sm:mt-12" />
            </Link>
          </div>
        </section>

        <section aria-labelledby="case-evidence-heading" className="border-b border-[#d8d5cc] bg-[#f7f3eb] px-5 py-20 text-[#071d39] sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[1320px]">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div className="max-w-xl">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2f8876]">Public award-assurance cases</p>
                <h2 id="case-evidence-heading" className="mt-4 font-display text-5xl leading-[0.96] tracking-[-0.025em] sm:text-6xl">When award proof breaks down.</h2>
                <p className="mt-5 text-base leading-7 text-[#617078]">Public institutional records show the pattern: weak decision evidence can become an audit finding, ineligible spend, a condition on future funding or an integrity sanction.</p>
                <Link href="/insights/the-award-was-signed-the-proof-was-not-ready" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1f6f61] hover:underline">Read the evidence and methodology<ArrowRight className="size-4" aria-hidden="true" /></Link>
              </div>
              <div className="grid gap-px overflow-hidden rounded-[24px] border border-[#d8d5cc] bg-[#d8d5cc] sm:grid-cols-2">
                {publicCases.map(({ metric, title, detail, source, href }) => (
                  <article key={title} className="flex min-h-[270px] flex-col bg-white p-6 sm:p-7">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2f8876]">{metric}</p>
                    <h3 className="mt-6 text-xl font-semibold tracking-[-0.025em]">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#617078]">{detail}</p>
                    <a href={href} target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-2 pt-7 text-xs font-semibold text-[#2f8876] hover:underline">
                      {source}<ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  </article>
                ))}
              </div>
            </div>
            <p className="mt-6 max-w-4xl text-[11px] leading-5 text-[#748087]">These are public records from the issuing institutions—not Traceli customers, endorsements or claims that Traceli would have prevented the outcomes. They illustrate the consequence categories the assurance model is designed to address.</p>
          </div>
        </section>

        <section aria-labelledby="outcomes-heading" className="bg-[#eef2ed] px-5 py-20 text-[#071d39] sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[1320px]">
            <div className="max-w-3xl">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2f8876]">How Traceli supports your award process</p>
              <h2 id="outcomes-heading" className="mt-4 font-display text-5xl leading-[0.96] tracking-[-0.025em] sm:text-6xl">Make proof a condition of award readiness.</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#617078]">Keep the systems that run procurement. Add one assurance path that shows what governed the decision, which evidence was accepted, where human judgment was applied and whether the required approval is present.</p>
            </div>
            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              {outcomes.map(({ title, detail, eyebrow, icon, detailIcon, tone }) => (
                <Link key={title} href="/demo" className="group rounded-[24px] border border-[#d8d5cc] bg-white p-6 shadow-[0_18px_50px_rgba(7,29,57,0.055)] transition hover:-translate-y-1 hover:border-[#93c9bd] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f8876] sm:p-8">
                  <div className="flex items-start justify-between gap-5">
                    <OutcomeGlyph icon={icon} detailIcon={detailIcon} tone={tone} />
                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-[#7a858b]">{eyebrow}</span>
                  </div>
                  <h3 className="mt-10 text-2xl font-semibold tracking-[-0.025em]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#617078]">{detail}</p>
                  <span className="mt-8 inline-flex items-center gap-2 text-xs font-semibold text-[#2f8876]">See the assurance workflow<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="faq-heading" className="border-t border-[#d8d5cc] bg-[#f7f3eb] px-5 py-20 text-[#071d39] sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div className="max-w-lg">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2f8876]">FAQ</p>
              <h2 id="faq-heading" className="mt-4 font-display text-5xl leading-[0.96] tracking-[-0.025em] sm:text-6xl">What accountable teams ask first.</h2>
              <p className="mt-5 text-base leading-7 text-[#617078]">The first pilot is deliberately bounded. These answers clarify where Traceli fits, what remains human-owned and what must be agreed before work begins.</p>
            </div>
            <div className="divide-y divide-[#d8d5cc] border-y border-[#d8d5cc]">
              {faqItems.map(({ question, answer }) => (
                <details key={question} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left text-lg font-semibold tracking-[-0.02em] marker:content-none">
                    {question}
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#bfc8c5] text-xl font-normal text-[#2f8876] transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="max-w-3xl pb-6 pr-14 text-sm leading-7 text-[#617078]">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#071d39] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="mx-auto grid max-w-[1320px] gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-3xl">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#78d8c4]">Documentation</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Inspect the control model, evidence and boundaries.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/56">See how Traceli defines award readiness, assembles the assurance pack, handles sensitive evidence and keeps humans accountable—with availability labelled honestly.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Link href="/docs" className="group inline-flex min-h-13 items-center justify-center gap-3 rounded-xl bg-[#fbf5ea] px-5 py-3 text-sm font-semibold text-[#071d39] transition hover:bg-white">Read the documentation<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>
              <Link href="/docs#mcp" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-white/18 px-5 py-3 text-sm font-semibold text-white/76 transition hover:bg-white/[0.06] hover:text-white"><GitBranch className="size-4 text-[#78d8c4]" aria-hidden="true" />MCP · planned</Link>
            </div>
          </div>
        </section>

        <section className="bg-[#f7f3eb] px-5 py-20 text-[#071d39] sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[1060px] rounded-[30px] bg-[#dff1eb] px-6 py-12 text-center sm:px-10 lg:px-16 lg:py-16">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2f8876]">Founding paid pilot</p>
            <h2 className="mx-auto mt-4 max-w-3xl font-display text-5xl leading-[0.94] tracking-[-0.025em] sm:text-6xl">Bring one completed tender.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#52696a]">In a six-week retrospective, reconstruct the rules-to-award evidence chain, expose missing proof and test whether an independent reviewer can defend the decision.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href={bookingHref} target="_blank" rel="noreferrer" className="group inline-flex min-h-14 items-center gap-4 rounded-xl bg-[#071d39] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(7,29,57,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0d3057]">Test one completed tender<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></a>
              <Link href="/demo" className="inline-flex min-h-14 items-center px-5 py-3.5 text-sm font-semibold text-[#1f6f61] transition hover:text-[#124c43]">Open Award desk</Link>
            </div>
            <p className="mx-auto mt-5 max-w-2xl text-xs leading-5 text-[#52696a]">No sensitive document enters Traceli until the NDA, data classification, approved transfer route and security gate are agreed.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#061a33] px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <TraceliMark compact />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/45"><Link href="/login" className="hover:text-white">Login</Link><Link href="/docs" className="hover:text-white">Documentation</Link><Link href="/cases" className="hover:text-white">Case cards</Link><Link href="/research/global-fund" className="hover:text-white">Global Fund research</Link><Link href="/research/unfpa" className="hover:text-white">UNFPA research</Link><Link href="/research/ocha-cbpf" className="hover:text-white">OCHA research</Link><Link href="/demo" className="hover:text-white">Award desk</Link><Link href="/method" className="hover:text-white">How Trace reasons</Link><a href="mailto:hello@trace-li.com" className="hover:text-white">hello@trace-li.com</a><span>Award assurance for donor-funded procurement</span></div>
        </div>
      </footer>
    </div>
  )
}
