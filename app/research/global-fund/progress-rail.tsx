'use client'

import { useEffect, useRef } from 'react'

export function ReadingProgressRail() {
  const bar = useRef<HTMLDivElement>(null)
  const fill = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const track = bar.current
    const indicator = fill.current
    const article = document.getElementById('article-body')
    if (!track || !indicator) return

    let ticking = false
    const update = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
      const winH = window.innerHeight || document.documentElement.clientHeight || 0
      let start = 0
      let end = document.documentElement.scrollHeight || document.body.scrollHeight || 0
      if (article) {
        const top = article.getBoundingClientRect().top + scrollTop
        start = top
        end = top + article.offsetHeight
      }
      const readable = Math.max(end - start - winH, 1)
      const pct = Math.max(0, Math.min(100, ((scrollTop - start) / readable) * 100))
      indicator.style.width = `${pct.toFixed(2)}%`
      track.setAttribute('aria-valuenow', String(Math.round(pct)))
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(() => {
        update()
        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', update)
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div
      ref={bar}
      className="gf-read-progress"
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
    >
      <span ref={fill} />
    </div>
  )
}
