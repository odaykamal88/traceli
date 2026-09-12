'use client'

import Image from 'next/image'
import { useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Download, ExternalLink } from 'lucide-react'

const defaultSlides = [
  { file: '01-cover.png', title: 'The award record', alt: 'The award was signed. The proof was not ready. A trace connects governing rule, source evidence, named human judgment, exception and approval.' },
  { file: '02-control-moment.png', title: 'The control moment', alt: 'A donor or auditor asks why the supplier won. The trace connects the governing rule, source evidence, named human judgment, exception and approval. The human decision point remains visible.' },
  { file: '03-auditability-financial-eligibility.png', title: 'Auditability and financial eligibility', alt: 'UN OIOS found inadequate bid-evaluation documentation at UNMISS; recommendations were accepted and later implemented. OLAF reported a €7.5 million financial impact and considered corresponding payments ineligible. These are different procedural outcomes.' },
  { file: '04-funding-continuity-integrity-exposure.png', title: 'Funding continuity and integrity exposure', alt: 'OLAF recommended protecting €112 million in future IPARD funding until remedial measures were in place, without establishing suspension or recovery. The World Bank imposed a 63-month settlement-based debarment after false experience claims in two financed-project bids.' },
  { file: '05-recurring-question.png', title: 'The recurring question', alt: 'Could the accountable team prove the award before signing it? Four consequence families surround the award record: auditability, financial eligibility, funding continuity and integrity exposure. These are not prevalence or prevention claims.' },
  { file: '06-seven-questions.png', title: 'Seven questions for one award', alt: 'Seven questions test the governing rule, supplier evidence, named reviewer and timestamp, clarifications and exceptions, chronology, unresolved issues and exportable award record. The complete questions appear in the article below.' },
  { file: '07-where-traceli-fits.png', title: 'Where Traceli fits', alt: 'Be ready to explain the award. Traceli helps reconstruct procurement evidence and prepare a source-linked file for human review. Discuss one procurement file. Traceli does not certify compliance, replace audit, guarantee an outcome or make the award decision.' },
] as const

type BriefingProps = {
  slides?: readonly { file: string; title: string; alt: string }[]
  imageRoot?: string
  pdfHref?: string
  heading?: ReactNode
  introduction?: string
}

export function ResearchBriefingCarousel({
  slides = defaultSlides,
  imageRoot = '/research/before-you-sign-01/carousel',
  pdfHref = '/research/before-you-sign-01/briefing.pdf',
  heading = <>The award record,<br />in seven frames.</>,
  introduction = 'Four official records. Seven questions for one completed award. Explore the briefing, then read the full analysis below.',
}: BriefingProps = {}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const goTo = (index: number) => {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({
      left: Math.max(0, Math.min(slides.length - 1, index)) * track.clientWidth,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
  }

  return (
    <section id="visual-briefing" aria-labelledby="visual-briefing-heading" className="scroll-mt-32 border-b border-[#d8d5cc] bg-[#e4ede7] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto grid max-w-[1100px] items-center gap-10 lg:grid-cols-[0.85fr_1fr] lg:gap-20">
        <div className="max-w-md">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2f8876]">Before You Sign · Visual briefing</p>
          <h2 id="visual-briefing-heading" className="mt-5 font-display text-5xl leading-[0.98] tracking-[-0.025em] sm:text-6xl">{heading}</h2>
          <p className="mt-6 text-lg leading-8 text-[#45565d]">{introduction}</p>
          <a href={pdfHref} className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-xl bg-[#071d39] px-5 text-sm font-semibold text-white hover:bg-[#0d3057]" target="_blank" rel="noreferrer"><Download className="size-4" aria-hidden="true" />Download the complete briefing</a>
          <p className="mt-4 text-xs leading-6 text-[#617078]">{slides.length} pages · PDF · Sources included</p>
        </div>

        <div role="region" aria-roledescription="carousel" aria-label={`${slides.length}-page research briefing`} className="mx-auto w-full max-w-[440px] min-w-0">
          <div
            ref={trackRef}
            tabIndex={0}
            aria-label="Briefing slides. Use left and right arrow keys to change slides."
            onScroll={event => {
              const track = event.currentTarget
              setActive(Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / track.clientWidth))))
            }}
            onKeyDown={event => {
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                event.preventDefault()
                goTo(event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : active + (event.key === 'ArrowLeft' ? -1 : 1))
              }
            }}
            className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-xl border border-[#071d39]/15 bg-[#071d39] shadow-[0_20px_55px_rgba(7,29,57,0.14)] outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#2f8876] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {slides.map((slide, index) => (
              <figure key={slide.file} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}: ${slide.title}`} className="w-full shrink-0 snap-start snap-always">
                <Image src={`${imageRoot}/${slide.file}`} alt={slide.alt} width={1080} height={1350} unoptimized className="h-auto w-full" />
              </figure>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between gap-3">
            <button type="button" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Previous briefing slide" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#b7c7bf] bg-white/70 text-[#071d39] hover:bg-white disabled:cursor-default disabled:opacity-35"><ArrowLeft className="size-4" aria-hidden="true" /></button>
            <p aria-live="polite" aria-atomic="true" className="text-center text-xs leading-5 text-[#45565d]"><span className="font-mono font-semibold">{active + 1} / {slides.length}</span><br />{slides[active].title}</p>
            <button type="button" onClick={() => goTo(active + 1)} disabled={active === slides.length - 1} aria-label="Next briefing slide" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#b7c7bf] bg-white/70 text-[#071d39] hover:bg-white disabled:cursor-default disabled:opacity-35"><ArrowRight className="size-4" aria-hidden="true" /></button>
          </div>
          <div className="mt-2 flex justify-center gap-1" aria-label="Choose a briefing slide">
            {slides.map((slide, index) => <button key={slide.file} type="button" onClick={() => goTo(index)} aria-label={`Show slide ${index + 1}: ${slide.title}`} aria-current={active === index ? 'true' : undefined} className="flex size-10 items-center justify-center rounded-lg hover:bg-white/60"><span aria-hidden="true" className={`h-1.5 rounded-full ${active === index ? 'w-5 bg-[#071d39]' : 'w-1.5 bg-[#8b9f95]'}`} /></button>)}
          </div>
          <a href={`${imageRoot}/${slides[active].file}`} target="_blank" rel="noreferrer" className="mx-auto mt-2 flex w-fit min-h-10 items-center gap-2 text-xs font-semibold text-[#1f6f61] underline-offset-4 hover:underline">Open this slide at full size<ExternalLink className="size-3" aria-hidden="true" /></a>
        </div>
      </div>
    </section>
  )
}
