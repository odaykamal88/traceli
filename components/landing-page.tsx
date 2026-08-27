'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  ExternalLink,
  FileInput,
  Fingerprint,
  GitBranch,
  ListChecks,
  Pause,
  Play,
  RotateCcw,
  ScanSearch,
  Waypoints,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'

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
    title: 'Close the evidence gaps',
    detail: 'Keep supplier proof, reviewer judgment, clarifications and exceptions visible before the decision is signed.',
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
    href: 'https://oios.un.org/file/10525/download?token=XrBorFi3',
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
  const filmRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [filmPlaying, setFilmPlaying] = useState(false)

  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    videoRef.current?.pause()
    setFilmPlaying(false)
  }, [])

  const startFilm = () => {
    const video = videoRef.current
    if (video) {
      video.currentTime = 0
      void video.play()
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    filmRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' })
  }

  const toggleFilm = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      void video.play()
    } else {
      video.pause()
    }
  }

  const replayFilm = () => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    void video.play()
  }

  return (
    <div className="min-h-screen bg-[#061a33] text-[#fbf5ea]">
      <a href="#main-content" className="sr-only z-[80] rounded-lg bg-[#fbf5ea] px-4 py-2 text-[#071d39] focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to main content</a>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#061a33]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-5 py-4 sm:px-8 lg:px-12">
          <Link href="/" aria-label="Traceli home"><TraceliMark /></Link>
          <nav aria-label="Public navigation" className="flex items-center gap-2 sm:gap-5">
            <Link href="/docs" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-white/62 transition hover:bg-white/[0.06] hover:text-white sm:inline-flex">Documentation</Link>
            <Link href="/demo" className="group inline-flex min-h-11 items-center gap-3 rounded-xl border border-white/18 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#78d8c4]/55 hover:bg-white/[0.08]">
              Open demo
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section className="relative isolate overflow-hidden border-b border-white/10">
          <Image src="/traceli-proof-console-bg.png" alt="" fill priority sizes="100vw" aria-hidden="true" className="pointer-events-none -z-10 object-cover opacity-80" />
          <div className="mx-auto grid max-w-[1500px] items-center gap-12 px-5 py-14 sm:px-8 sm:py-18 lg:min-h-[720px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-12 lg:py-20">
            <div className="max-w-[650px]">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#78d8c4]/35 bg-[#0a2b46]/70 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase leading-4 tracking-[0.12em] text-[#8be1cf] sm:text-[10px] sm:tracking-[0.16em]">
                <span className="size-1.5 shrink-0 rounded-full bg-[#78d8c4]" aria-hidden="true" />
                Award assurance for donor-funded procurement
              </div>
              <h1 className="mt-7 font-display text-[clamp(3rem,6.8vw,7.2rem)] leading-[0.88] tracking-[-0.035em] text-[#fbf5ea]">
                Prove the award
                <span className="block">before you sign it.</span>
              </h1>
              <p className="mt-7 max-w-[570px] text-lg leading-8 text-white/66 sm:text-xl">
                Traceli shows whether every material award decision is connected to the governing rule, supplier evidence, human judgment and required approval—before donor review, complaint or audit.
              </p>
              <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <button type="button" onClick={startFilm} className="group inline-flex min-h-14 items-center gap-4 rounded-xl bg-[#fbf5ea] px-6 py-3.5 text-sm font-semibold text-[#071d39] shadow-[0_14px_34px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 hover:bg-white">
                  <span className="flex size-8 items-center justify-center rounded-full bg-[#071d39] text-white"><Play className="ml-0.5 size-3.5 fill-current" aria-hidden="true" /></span>
                  Watch the award-proof story
                </button>
                <Link href="/demo" className="group inline-flex min-h-12 items-center gap-3 px-2 text-sm font-semibold text-white/78 transition hover:text-white">
                  Open demo workspace
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </div>
              <p className="mt-6 flex items-center gap-2 text-xs text-white/42"><Clock3 className="size-3.5" aria-hidden="true" />A complete rule-to-award-proof story in 44 seconds.</p>
            </div>

            <div id="walkthrough" ref={filmRef} className="scroll-mt-28">
              <div className="relative overflow-hidden rounded-[24px] border border-white/20 bg-[#f8f4eb] shadow-[0_28px_90px_rgba(5,18,37,0.45)]">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  poster="/traceli-tender-to-proof-poster.png"
                  aria-label="Traceli product film showing a tender moving from a clean workspace to an audit-ready award record"
                  onCanPlay={(event) => {
                    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && event.currentTarget.paused) {
                      void event.currentTarget.play()
                    }
                  }}
                  onPlay={() => setFilmPlaying(true)}
                  onPause={() => setFilmPlaying(false)}
                  className="aspect-video w-full bg-[#f8f4eb] object-cover"
                >
                  <source src="/traceli-tender-to-proof.mp4" type="video/mp4" />
                </video>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#061a33]/72 to-transparent" aria-hidden="true" />
                <div className="absolute left-3 top-3 rounded-full border border-white/45 bg-[#061a33]/72 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.13em] text-white backdrop-blur-md sm:left-4 sm:top-4">
                  Product film · 44 sec
                </div>
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 sm:inset-x-4 sm:bottom-4">
                  <button type="button" onClick={toggleFilm} aria-label={filmPlaying ? 'Pause product film' : 'Play product film'} className="flex size-11 items-center justify-center rounded-full border border-white/25 bg-[#061a33]/82 text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-[#071d39]">
                    {filmPlaying ? <Pause className="size-4 fill-current" aria-hidden="true" /> : <Play className="ml-0.5 size-4 fill-current" aria-hidden="true" />}
                  </button>
                  <button type="button" onClick={replayFilm} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-[#061a33]/82 px-4 text-[11px] font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-[#071d39]">
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    Start again
                  </button>
                </div>
              </div>
              <p className="mt-3 text-center text-[10px] leading-4 text-white/38">Illustrative product film. Tender and supplier data shown are fictional.</p>
            </div>
          </div>

          <div className="mx-auto max-w-[1500px] border-t border-white/10 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
            <div className="grid gap-7 lg:grid-cols-[280px_1fr] lg:items-center lg:gap-12">
              <div className="max-w-[270px]">
                <p className="font-display text-[1.7rem] leading-[1.02] tracking-[-0.025em] text-[#fbf5ea]">Built by the people from</p>
                <p className="mt-3 text-[10px] leading-5 text-white/42">Individual prior experience—not customers, partners or endorsements.</p>
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

        <section aria-labelledby="case-evidence-heading" className="border-b border-[#d8d5cc] bg-[#f7f3eb] px-5 py-20 text-[#071d39] sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[1320px]">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div className="max-w-xl">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2f8876]">Why award assurance</p>
                <h2 id="case-evidence-heading" className="mt-4 font-display text-5xl leading-[0.96] tracking-[-0.025em] sm:text-6xl">The consequences do not stay inside procurement.</h2>
                <p className="mt-5 text-base leading-7 text-[#617078]">Public institutional records show the pattern: weak decision evidence can become an audit finding, ineligible spend, a condition on future funding or an integrity sanction.</p>
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
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2f8876]">The pre-award control gate</p>
              <h2 id="outcomes-heading" className="mt-4 font-display text-5xl leading-[0.96] tracking-[-0.025em] sm:text-6xl">Make proof a condition of award readiness.</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#617078]">Your portal can run the tender and your ERP can post the commitment. Traceli shows whether the source-linked award record is supported, unresolved or explicitly excepted before sign-off.</p>
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
              <a href="mailto:hello@trace-li.com?subject=Award%20Assurance%20Pilot" className="group inline-flex min-h-14 items-center gap-4 rounded-xl bg-[#071d39] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(7,29,57,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0d3057]">Discuss a paid pilot<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></a>
              <Link href="/demo" className="inline-flex min-h-14 items-center px-5 py-3.5 text-sm font-semibold text-[#1f6f61] transition hover:text-[#124c43]">Open the demo workspace</Link>
            </div>
            <p className="mx-auto mt-5 max-w-2xl text-xs leading-5 text-[#52696a]">No sensitive document enters Traceli until the NDA, data classification, approved transfer route and security gate are agreed.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#061a33] px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <TraceliMark compact />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/45"><Link href="/docs" className="hover:text-white">Documentation</Link><Link href="/demo" className="hover:text-white">Interactive demo</Link><a href="mailto:hello@trace-li.com" className="hover:text-white">hello@trace-li.com</a><span>Award assurance for donor-funded procurement</span></div>
        </div>
      </footer>
    </div>
  )
}
