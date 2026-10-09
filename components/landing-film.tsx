'use client'

import Image from 'next/image'
import { useLayoutEffect, useRef, useState } from 'react'
import { Maximize2, Play, X } from 'lucide-react'

const filmSrc = '/trace-li-promo-1080.mp4'
const filmPoster = '/trace-li-promo-1080-poster.png'

export function LandingFilm({ open, onOpen, onClose }: {
  open: boolean
  onOpen: () => void
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [needsPlay, setNeedsPlay] = useState(false)

  useLayoutEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    const video = videoRef.current
    if (!dialog) return

    setLoading(true)
    setFailed(false)
    setNeedsPlay(false)
    dialog.showModal()
    const previousOverflow = document.body.style.overflow
    const previousPadding = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbarWidth}px`
    }
    document.body.style.overflow = 'hidden'
    void video?.play().catch(() => setNeedsPlay(true))

    return () => {
      video?.pause()
      if (dialog.open) dialog.close()
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPadding
    }
  }, [open])

  return (
    <div id="walkthrough" className="min-w-0">
      <button
        type="button"
        onClick={onOpen}
        aria-label="Watch the 55-second Traceli film in a larger player"
        aria-haspopup="dialog"
        aria-controls="landing-film"
        className="group block w-full overflow-hidden rounded-xl border border-white/25 bg-[#081f2e] text-left transition-colors hover:border-white/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#78d8c4]"
      >
        <div className="relative aspect-video">
          <Image src={filmPoster} alt="Illustrative award file with the award rationale marked as missing" width={1920} height={1080} preload sizes="(min-width: 1800px) 852px, (min-width: 1024px) 52vw, 100vw" className="h-full w-full object-contain" />
          <span className="absolute bottom-4 right-4" aria-hidden="true">
            <span className="flex size-12 items-center justify-center rounded-full border border-white/60 bg-[#fbf5ea] text-[#071d39] shadow-lg transition-colors group-hover:bg-white sm:size-14">
              <Play className="ml-0.5 size-5 fill-current" />
            </span>
          </span>
        </div>
        <span className="flex min-h-16 items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
          <span className="text-sm font-medium text-[#fbf5ea]">Watch the film <span className="ml-2 text-white/60">55 sec</span></span>
          <Maximize2 className="size-4 text-white/65" aria-hidden="true" />
        </span>
      </button>
      <p className="mt-3 px-1 text-xs leading-5 text-white/65">Illustrative film. Tender and supplier data are fictional.</p>

      <dialog
        ref={dialogRef}
        id="landing-film"
        aria-labelledby="landing-film-title"
        aria-describedby="landing-film-note"
        onClose={onClose}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button, a[href], video[controls]'))
          const first = controls[0]
          const last = controls.at(-1)
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last?.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first?.focus()
          }
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close()
        }}
        className="landing-film-dialog m-auto w-[calc(100%_-_2rem)] max-w-6xl max-h-[calc(100dvh_-_2rem)] overflow-y-auto rounded-[20px] border border-white/20 bg-[#061a33] p-0 text-[#fbf5ea] shadow-2xl backdrop:bg-[#020b17]/90"
      >
        <div>
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <h2 id="landing-film-title" className="text-base font-medium">Traceli in 55 seconds</h2>
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close video" autoFocus className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#78d8c4]">
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          {open && <video
            ref={videoRef}
            controls
            muted
            playsInline
            preload="metadata"
            poster={filmPoster}
            aria-label="Traceli promotional film"
            onLoadStart={() => setLoading(true)}
            onWaiting={() => setLoading(true)}
            onCanPlay={() => setLoading(false)}
            onPlaying={() => { setLoading(false); setNeedsPlay(false) }}
            onError={() => { setFailed(true); setLoading(false) }}
            className="block aspect-video max-h-[72dvh] w-full bg-[#081f2e] object-contain"
          >
            <source src={filmSrc} type="video/mp4" onError={() => { setFailed(true); setLoading(false) }} />
            Your browser cannot play this video. Use the direct video link below.
          </video>}
          <div className="space-y-2 px-4 py-4 sm:px-6">
            {open && <p role="status" className="text-sm text-white/80">{failed ? 'The film could not load. Use the direct video link below.' : loading ? 'Loading film…' : needsPlay ? 'Press play to start the film.' : null}</p>}
            <p id="landing-film-note" className="text-xs leading-5 text-white/65">Illustrative film. Tender and supplier data are fictional. <a href={filmSrc} target="_blank" rel="noreferrer" className="ml-1 underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#78d8c4]">Open video directly</a></p>
          </div>
        </div>
      </dialog>
    </div>
  )
}
