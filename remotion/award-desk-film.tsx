import type { ReactNode } from 'react'
import { AlertTriangle, ArrowRight, Check, Lock, Plus } from 'lucide-react'
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import {
  Chapter,
  Cursor,
  Disclosure,
  ProductWindow,
  Scene,
  TraceliMark,
  clamp,
  display,
  mono,
  palette,
  sans,
} from './traceli-film'

export const awardDeskFilmFrames = 2010

const beats = {
  intro: { from: 0, duration: 165 },
  library: { from: 150, duration: 480 },
  desk: { from: 615, duration: 255 },
  prep: { from: 855, duration: 330 },
  disposition: { from: 1170, duration: 285 },
  record: { from: 1440, duration: 345 },
  outro: { from: 1770, duration: 240 },
} as const

const inForcePacks = [
  {
    name: 'Procurement manual v4.1',
    plain: 'How your org runs competitive tenders and evaluation panels.',
    category: 'Procurement',
    version: '4.1',
  },
  {
    name: 'ECHO-style donor conditions',
    plain: 'Donor conditions Trace may check when funds are framed as ECHO-style.',
    category: 'Donor',
    version: '2026.2',
  },
  {
    name: 'Multilateral sanctions hygiene',
    plain: 'Basic sanctions and integrity hygiene — illustrative, not a live list feed.',
    category: 'Sanctions & integrity',
    version: '1.0',
  },
  {
    name: 'Safeguarding policy v3.0',
    plain: 'Safeguarding contacts, SEA channels, and child-risk screens for field awards.',
    category: 'Safeguarding',
    version: '3.0',
  },
] as const

const catalogPacks = [
  {
    name: 'Global Fund PR/selection themes',
    plain: 'Themes around Principal Recipient selection and related-party disclosure.',
    category: 'Donor',
  },
  {
    name: 'Past precedent Kenya Shelter RFP 2025',
    plain: 'A locked fictional lesson from last year’s Kenya Shelter RFP.',
    category: 'Past flags',
  },
] as const

function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'mint' | 'amber' | 'ghost' }) {
  const tones = {
    neutral: { background: '#eef0ee', color: palette.ink },
    mint: { background: '#e5f4ef', color: palette.mintDark },
    amber: { background: palette.amberSoft, color: '#6f4d0f' },
    ghost: { background: '#f3f2ee', color: '#5c656b' },
  }
  const selected = tones[tone]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        borderRadius: 999,
        background: selected.background,
        color: selected.color,
        fontFamily: mono,
        fontSize: 8,
        fontWeight: 750,
        letterSpacing: '.06em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  )
}

function Switch({ on, position }: { on: boolean; position?: number }) {
  const knob = position ?? (on ? 1 : 0)
  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 4 }}>
      <div
        style={{
          width: 42,
          height: 24,
          borderRadius: 99,
          background: on ? palette.navy : '#d7d8d4',
          padding: 3,
          boxShadow: 'inset 0 1px 2px rgba(7,29,57,.18)',
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 99,
            background: 'white',
            transform: `translateX(${knob * 18}px)`,
            boxShadow: '0 1px 3px rgba(7,29,57,.25)',
          }}
        />
      </div>
      <span style={{ fontFamily: mono, fontSize: 8, fontWeight: 750, letterSpacing: '.08em', color: on ? palette.mintDark : palette.muted }}>
        {on ? 'ON' : 'OFF'}
      </span>
    </div>
  )
}

function clickPulse(frame: number, at: number) {
  return clamp(frame, [at, at + 8], [0, 1]) * clamp(frame, [at + 8, at + 20], [1, 0])
}

function IntroScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const first = spring({ frame: frame - 12, fps, config: { damping: 18, mass: 0.8, stiffness: 95 } })
  const second = spring({ frame: frame - 24, fps, config: { damping: 18, mass: 0.8, stiffness: 95 } })
  const windowSpring = spring({ frame: frame - 62, fps, config: { damping: 20, mass: 1.1, stiffness: 88 } })
  const chips = [
    { label: 'After you sign', x: 72, y: 118, delay: 8 },
    { label: 'The question later', x: 1010, y: 118, delay: 16 },
    { label: 'Your name on it', x: 86, y: 500, delay: 24 },
    { label: 'What you can show', x: 1024, y: 478, delay: 32 },
  ]
  return (
    <Scene duration={beats.intro.duration} background={palette.lavender} fadeIn={8}>
      <AbsoluteFill
        style={{
          backgroundImage:
            'radial-gradient(circle at 74% 16%, rgba(255,255,255,.74), transparent 24%), linear-gradient(rgba(33,0,61,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(33,0,61,.045) 1px, transparent 1px)',
          backgroundSize: 'auto, 44px 44px, 44px 44px',
          transform: `scale(${1 + frame / 3200})`,
        }}
      />
      <div style={{ position: 'absolute', left: 52, top: 36 }}>
        <TraceliMark dark />
      </div>
      <div style={{ position: 'absolute', right: 52, top: 42 }}>
        <Chapter>Award desk</Chapter>
      </div>
      {chips.map((chip, index) => {
        const enter = clamp(frame, [chip.delay, chip.delay + 24], [0, 1])
        const float = Math.sin((frame * 0.2 + index * 28) / 10) * 5
        return (
          <div
            key={chip.label}
            style={{
              position: 'absolute',
              left: chip.x,
              top: chip.y + float,
              opacity: enter * 0.74,
              transform: `translateY(${(1 - enter) * 16}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              border: '1px solid rgba(33,0,61,.14)',
              background: 'rgba(255,255,255,.48)',
              padding: '8px 11px',
              borderRadius: 10,
              color: palette.plum,
              fontFamily: mono,
              fontSize: 8.5,
              fontWeight: 700,
            }}
          >
            {chip.label}
          </div>
        )
      })}
      <div style={{ position: 'absolute', left: 36, right: 36, top: 176, textAlign: 'center' }}>
        <div style={{ height: 78, overflow: 'hidden' }}>
          <div
            style={{
              transform: `translateY(${(1 - first) * 84}px)`,
              opacity: first,
              color: palette.plum,
              fontFamily: display,
              fontSize: 58,
              letterSpacing: '-.045em',
              lineHeight: 1.08,
              whiteSpace: 'nowrap',
            }}
          >
            You won't be judged on what you signed.
          </div>
        </div>
        <div style={{ height: 78, overflow: 'hidden', marginTop: 4 }}>
          <div
            style={{
              transform: `translateY(${(1 - second) * 84}px)`,
              opacity: second,
              color: palette.plum,
              fontFamily: display,
              fontSize: 58,
              letterSpacing: '-.045em',
              lineHeight: 1.08,
              whiteSpace: 'nowrap',
            }}
          >
            You'll be judged on what you can show.
          </div>
        </div>
        <div style={{ marginTop: 16, color: 'rgba(33,0,61,.62)', fontSize: 16, opacity: clamp(frame, [46, 70], [0, 1]) }}>
          The question comes after the signature.
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 310,
          right: 310,
          bottom: -118,
          height: 210,
          transform: `translateY(${(1 - windowSpring) * 70}px) scale(${0.94 + windowSpring * 0.06})`,
          opacity: windowSpring,
        }}
      >
        <ProductWindow crumb="The file" title="What you can show" style={{ height: 250 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 12, padding: 16 }}>
            <div style={{ borderRadius: 12, background: palette.navy, color: 'white', padding: '14px 16px' }}>
              <div style={{ fontFamily: mono, color: palette.mint, fontSize: 8, letterSpacing: '.12em', textTransform: 'uppercase' }}>
                The question
              </div>
              <div style={{ marginTop: 8, fontFamily: display, fontSize: 26, letterSpacing: '-.04em' }}>What did you check?</div>
            </div>
            <div style={{ borderRadius: 12, border: `1px solid ${palette.line}`, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 720 }}>Your name stays on it</div>
              <div style={{ marginTop: 8, color: palette.muted, fontSize: 10, lineHeight: 1.45 }}>
                The signature does not answer for you.
              </div>
            </div>
          </div>
        </ProductWindow>
      </div>
      <Disclosure />
    </Scene>
  )
}

function LibraryScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const stage = spring({ frame: frame - 4, fps, config: { damping: 20, stiffness: 92 } })
  const offAmount = clamp(frame, [150, 168], [0, 1]) * clamp(frame, [236, 254], [1, 0])
  const sanctionsOn = offAmount < 0.5
  const inForce = sanctionsOn ? 4 : 3
  const drawer = clamp(frame, [332, 362], [0, 1])
  const toastOff = clamp(frame, [158, 172], [0, 1]) * clamp(frame, [214, 232], [1, 0])
  const toastOn = clamp(frame, [250, 266], [0, 1]) * clamp(frame, [308, 326], [1, 0])
  const toToggle = clamp(frame, [72, 138], [0, 1])
  const toAdd = clamp(frame, [268, 318], [0, 1])
  const toCatalog = clamp(frame, [348, 392], [0, 1])
  const clickOff = clickPulse(frame, 146)
  const clickOn = clickPulse(frame, 232)
  const clickAdd = clickPulse(frame, 328)
  const points = [
    { x: 900, y: 600 },
    { x: 1152, y: 478 },
    { x: 1036, y: 284 },
    { x: 1164, y: 404 },
  ]
  const mix = (from: { x: number; y: number }, to: { x: number; y: number }, amount: number) => ({
    x: from.x + (to.x - from.x) * amount,
    y: from.y + (to.y - from.y) * amount,
  })
  const point = toCatalog > 0
    ? mix(points[2], points[3], toCatalog)
    : toAdd > 0
      ? mix(points[1], points[2], toAdd)
      : mix(points[0], points[1], toToggle)
  const x = point.x
  const y = point.y
  const click = Math.max(clickOff, clickOn, clickAdd)

  return (
    <Scene duration={beats.library.duration} background={palette.paper}>
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(7,29,57,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(7,29,57,.035) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />
      <div style={{ position: 'absolute', left: 56, top: 34 }}>
        <Chapter>01 · Rule library</Chapter>
      </div>
      <div style={{ position: 'absolute', left: 56, top: 78, color: palette.ink, fontFamily: display, fontSize: 46, letterSpacing: '-.048em' }}>
        What is checking tonight?
      </div>
      <div style={{ position: 'absolute', right: 58, top: 92, width: 360, color: palette.muted, fontSize: 13, lineHeight: 1.5 }}>
        Flip one off and overnight prep stops using it. Packs left on are the ones Trace may cite.
      </div>
      <ProductWindow
        crumb="Workspace"
        title="Rule library"
        style={{
          position: 'absolute',
          left: 52,
          right: 52,
          top: 164,
          height: 490,
          transform: `translateY(${(1 - stage) * 36}px) scale(${0.975 + stage * 0.025})`,
          opacity: stage,
        }}
      >
        <div style={{ position: 'relative', height: 400, padding: '14px 18px 16px', background: '#fcfbf8' }}>
          <div style={{ height: 38, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, color: palette.muted }}>
              <span style={{ color: palette.ink, fontFamily: display, fontSize: 22, letterSpacing: '-.04em' }}>{inForce}</span>
              <span style={{ marginLeft: 8 }}>packs in force tonight</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  height: 34,
                  padding: '0 12px',
                  borderRadius: 10,
                  border: `1px solid ${clickAdd > 0 ? palette.ink : palette.line}`,
                  background: 'white',
                  fontSize: 11,
                  fontWeight: 700,
                  transform: `scale(${1 - clickAdd * 0.04})`,
                }}
              >
                <Plus size={13} /> Add a pack
              </div>
              <div style={{ height: 34, padding: '0 12px', borderRadius: 10, border: `1px solid ${palette.line}`, background: 'white', display: 'flex', alignItems: 'center', gap: 8, color: palette.muted, fontSize: 11 }}>
                Category <span style={{ color: palette.ink, fontWeight: 700 }}>All</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            {inForcePacks.map((pack, index) => {
              const enter = clamp(frame, [16 + index * 10, 36 + index * 10], [0, 1])
              const on = index === 2 ? sanctionsOn : true
              return (
                <div
                  key={pack.name}
                  style={{
                    height: 64,
                    display: 'grid',
                    gridTemplateColumns: '1fr 56px',
                    alignItems: 'center',
                    gap: 12,
                    padding: '0 14px',
                    borderRadius: 12,
                    background: 'white',
                    border: `1px solid ${index === 2 && !on ? '#e4d7b0' : palette.line}`,
                    boxShadow: index === 2 && offAmount > 0.2 ? 'inset 3px 0 #d3a13f' : 'none',
                    opacity: enter,
                    transform: `translateY(${(1 - enter) * 14}px)`,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 720, letterSpacing: '-.02em' }}>{pack.name}</div>
                      <Tag>{pack.category}</Tag>
                      <Tag tone="ghost">Illustrative</Tag>
                    </div>
                    <div style={{ marginTop: 4, color: palette.muted, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pack.plain}</div>
                  </div>
                  <Switch on={on} position={index === 2 ? 1 - offAmount : undefined} />
                </div>
              )
            })}
          </div>
          <div
            style={{
              position: 'absolute',
              left: 18,
              bottom: 14,
              padding: '8px 10px',
              borderRadius: 9,
              background: palette.ink,
              color: 'white',
              fontSize: 10.5,
              fontWeight: 650,
              opacity: Math.max(toastOff, toastOn),
              transform: `translateY(${(1 - Math.max(toastOff, toastOn)) * 8}px)`,
            }}
          >
            {toastOn > toastOff ? 'On — overnight prep may cite this pack' : 'Off — overnight prep will stop using it'}
          </div>
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: 390,
              background: 'white',
              borderLeft: `1px solid ${palette.line}`,
              boxShadow: '-18px 0 40px rgba(7,29,57,.08)',
              transform: `translateX(${(1 - drawer) * 40}px)`,
              opacity: drawer,
              padding: '16px 16px 14px',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: '.12em', textTransform: 'uppercase', color: palette.mintDark }}>Add a pack</div>
            <div style={{ marginTop: 6, fontSize: 16, fontWeight: 720 }}>From Trace catalog</div>
            <div style={{ marginTop: 6, color: palette.muted, fontSize: 11, lineHeight: 1.45 }}>Not on tonight’s switchboard. Adding one turns it on for overnight prep.</div>
            <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
              {catalogPacks.map((pack) => (
                <div key={pack.name} style={{ border: `1px solid ${palette.line}`, borderRadius: 12, padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 720 }}>{pack.name}</div>
                    <div style={{ marginTop: 3, color: palette.muted, fontSize: 10, lineHeight: 1.35 }}>{pack.plain}</div>
                    <div style={{ marginTop: 6 }}><Tag>{pack.category}</Tag></div>
                  </div>
                  <div style={{ padding: '7px 10px', borderRadius: 8, background: palette.mint, color: palette.navy, fontSize: 10, fontWeight: 750 }}>Add</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ProductWindow>
      <Cursor x={x} y={y} click={click} label={toCatalog > 0.65 ? 'Catalog' : clickAdd > 0.2 ? 'Add a pack' : click > 0.2 ? (sanctionsOn ? 'Turn on' : 'Turn off') : undefined} />
      <Disclosure />
    </Scene>
  )
}

function DeskScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const stage = spring({ frame: frame - 6, fps, config: { damping: 20, stiffness: 90 } })
  const travel = clamp(frame, [118, 188], [0, 1])
  const click = clickPulse(frame, 196)
  const x = interpolate(travel, [0, 1], [900, 368])
  const y = interpolate(travel, [0, 1], [280, 528])
  return (
    <Scene duration={beats.desk.duration} background={palette.lavenderSoft}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(circle at 12% 8%, white, transparent 28%), radial-gradient(circle at 88% 90%, rgba(120,216,196,.22), transparent 26%)' }} />
      <div style={{ position: 'absolute', left: 56, top: 34 }}>
        <Chapter>02 · Award desk</Chapter>
      </div>
      <div style={{ position: 'absolute', left: 56, top: 78, color: palette.plum, fontFamily: display, fontSize: 46, letterSpacing: '-.048em' }}>
        The file is waiting.
      </div>
      <div style={{ position: 'absolute', right: 58, top: 90, width: 340, color: 'rgba(33,0,61,.62)', fontSize: 13, lineHeight: 1.5 }}>
        Programme kickoff Thursday. A reviewer asked why Northstar won. The packet is incomplete.
      </div>
      <ProductWindow
        crumb="Award desk"
        title="Good morning"
        style={{
          position: 'absolute',
          left: 52,
          right: 52,
          top: 164,
          height: 490,
          transform: `translateY(${(1 - stage) * 34}px)`,
          opacity: stage,
        }}
      >
        <div style={{ height: 400, background: palette.ivory, padding: '26px 0 20px' }}>
          <div style={{ width: 680, margin: '0 auto' }}>
            <div style={{ fontSize: 28, fontWeight: 650, letterSpacing: '-.03em' }}>Good morning, Leila.</div>
            <div style={{ marginTop: 4, color: palette.muted, fontSize: 13 }}>Monday 9:02 · Cairo</div>
            <div
              style={{
                marginTop: 18,
                background: 'white',
                borderRadius: 12,
                border: `1px solid ${palette.line}`,
                borderLeft: `4px solid ${palette.amber}`,
                boxShadow: '0 10px 28px rgba(7,29,57,.06)',
                padding: '18px 20px 16px',
              }}
            >
              <Tag tone="amber">
                <span style={{ width: 6, height: 6, borderRadius: 9, background: palette.amber }} /> Needs reconstruction
              </Tag>
              <div style={{ marginTop: 10, fontSize: 20, fontWeight: 720, letterSpacing: '-.03em' }}>Emergency Shelter & NFI Logistics</div>
              <div style={{ marginTop: 4, fontFamily: mono, fontSize: 11, color: palette.muted }}>RFP-2026-041</div>
              <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.45, maxWidth: 520 }}>
                Programme kickoff Thursday. Reviewer asked why Northstar won. The packet is incomplete.
              </div>
              <div
                style={{
                  marginTop: 14,
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 9,
                  background: palette.navy,
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 700,
                  transform: `scale(${1 - click * 0.05})`,
                }}
              >
                Open award desk
              </div>
            </div>
            {[
              ['Cold-chain pharma transport · RFP-2026-028', 'Locked · award closed'],
              ['WASH kit last-mile · RFP-2026-033', 'OK · evidence complete'],
            ].map(([title, status], index) => (
              <div key={title} style={{ marginTop: index === 0 ? 12 : 8, height: 42, borderRadius: 10, border: `1px solid ${palette.line}`, background: 'rgba(255,255,255,.55)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', color: palette.muted, fontSize: 12 }}>
                <span>{title}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{index === 0 ? <Lock size={12} /> : <Check size={12} />} {status}</span>
              </div>
            ))}
          </div>
        </div>
      </ProductWindow>
      <Cursor x={x} y={y} click={click} label={frame > 188 ? 'Open award desk' : undefined} />
      <Disclosure />
    </Scene>
  )
}

function PrepScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const stage = spring({ frame: frame - 4, fps, config: { damping: 20, stiffness: 90 } })
  const packsIn = spring({ frame: frame - 168, fps, config: { damping: 16, stiffness: 110 } })
  const steps = [
    { time: '23:14', text: 'Linked governing requirement 07 — country-specific delivery capacity', gap: false },
    { time: '01:02', text: 'Checked packet — 23/27 evidence items linked (86%)', gap: false },
    { time: '03:48', text: 'Flagged gap — no Ethiopia-specific capacity evidence linked to Northstar', gap: true },
    { time: '06:41', text: 'Drafted a request for the missing evidence and a note for Leila', gap: false },
  ]
  const travel = clamp(frame, [200, 270], [0, 1])
  const x = interpolate(travel, [0, 1], [320, 790])
  const y = interpolate(travel, [0, 1], [260, 436])
  return (
    <Scene duration={beats.prep.duration} background={palette.paper}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(circle at 80% 0%, rgba(245,232,196,.65), transparent 32%)' }} />
      <div style={{ position: 'absolute', left: 56, top: 34 }}>
        <Chapter>02 · Award desk</Chapter>
      </div>
      <div style={{ position: 'absolute', left: 56, top: 78, color: palette.ink, fontFamily: display, fontSize: 44, letterSpacing: '-.048em' }}>
        Overnight, the gap is named.
      </div>
      <div style={{ position: 'absolute', right: 58, top: 90, width: 360, color: palette.muted, fontSize: 13, lineHeight: 1.5 }}>
        Trace cites the packs in force, scores the packet, and drafts a note. The disposition stays with Leila.
      </div>
      <ProductWindow
        crumb="Award desk"
        title="RFP-2026-041 · Emergency Shelter & NFI Logistics"
        style={{
          position: 'absolute',
          left: 52,
          right: 52,
          top: 160,
          height: 496,
          transform: `translateY(${(1 - stage) * 28}px)`,
          opacity: stage,
        }}
      >
        <div style={{ height: 406, display: 'grid', gridTemplateColumns: '210px 1fr', background: palette.ivory }}>
          <div style={{ borderRight: `1px solid ${palette.line}`, padding: '18px 16px' }}>
            <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: '.14em', textTransform: 'uppercase', color: palette.muted }}>Award</div>
            {[
              ['RFP', 'RFP-2026-041'],
              ['Supplier', 'Northstar Relief'],
              ['Owner', 'Sarah Ahmed'],
              ['Title', 'Emergency Shelter & NFI Logistics'],
            ].map(([label, value]) => (
              <div key={label} style={{ marginTop: 12 }}>
                <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: '.08em', textTransform: 'uppercase', color: palette.muted }}>{label}</div>
                <div style={{ marginTop: 3, fontSize: 12.5, fontWeight: 700, letterSpacing: '-.02em' }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '16px 18px 14px', position: 'relative' }}>
            <Tag tone="amber">
              <span style={{ width: 6, height: 6, borderRadius: 9, background: '#c8922a' }} /> Human decision required
            </Tag>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 720, letterSpacing: '-.03em' }}>Agent overnight prep</div>
              <div style={{ color: palette.muted, fontSize: 11 }}>Done · Sun 23:14 – Mon 06:41</div>
            </div>
            <div style={{ marginTop: 8, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: '#d7ebe4' }} />
              {steps.map((step, index) => {
                const enter = clamp(frame, [28 + index * 28, 52 + index * 28], [0, 1])
                return (
                  <div key={step.time} style={{ display: 'grid', gridTemplateColumns: '16px 52px 1fr auto', gap: 8, alignItems: 'center', height: 40, opacity: enter, transform: `translateY(${(1 - enter) * 10}px)` }}>
                    <div style={{ width: 16, height: 16, borderRadius: 99, background: step.gap ? palette.amberSoft : '#e5f4ef', border: `2px solid ${step.gap ? palette.amber : palette.mint}` }} />
                    <div style={{ fontFamily: mono, fontSize: 10, color: palette.muted }}>{step.time}</div>
                    <div style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{step.text}</div>
                    <div>{step.gap ? <Tag tone="amber">gap</Tag> : null}</div>
                  </div>
                )
              })}
            </div>
            <div
              style={{
                marginTop: 4,
                borderRadius: 12,
                background: '#e7f6f1',
                border: '1px solid #c7e6dc',
                padding: '10px 12px',
                opacity: packsIn,
                transform: `translateY(${(1 - packsIn) * 12}px)`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 720 }}>
                <span style={{ width: 8, height: 8, borderRadius: 9, background: palette.mintDark }} />
                Checked against 4 packs in force
              </div>
              <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 16px' }}>
                {inForcePacks.map((pack) => (
                  <div key={pack.name} style={{ fontSize: 11, color: palette.ink }}>
                    {pack.name.replace(' v4.1', '').replace(' v3.0', '')}{' '}
                    <span style={{ fontFamily: mono, color: palette.muted, fontSize: 10 }}>v{pack.version}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ProductWindow>
      <Cursor x={x} y={y} label={frame > 250 ? 'Ethiopia gap' : undefined} />
      <Disclosure />
    </Scene>
  )
}

function DispositionScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const stage = spring({ frame: frame - 6, fps, config: { damping: 18, stiffness: 100 } })
  const options = [
    { title: 'Request evidence', hint: 'Hold reconstruction open until Ethiopia capacity is linked', selected: true },
    { title: 'Accept with exception', hint: 'Document why the gap is accepted for kickoff', selected: false },
    { title: 'Escalate', hint: 'Route to compliance lead before programme kickoff', selected: false },
  ]
  const travel = clamp(frame, [150, 214], [0, 1])
  const click = clickPulse(frame, 220)
  const confirmed = clamp(frame, [232, 252], [0, 1])
  const x = interpolate(travel, [0, 1], [720, 268])
  const y = interpolate(travel, [0, 1], [340, 596])
  return (
    <Scene duration={beats.disposition.duration} background={palette.lavenderSoft}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, white, transparent 36%)' }} />
      <div style={{ position: 'absolute', left: 56, top: 32 }}>
        <Chapter>03 · Disposition</Chapter>
      </div>
      <div style={{ position: 'absolute', left: 56, top: 74, color: palette.plum, fontFamily: display, fontSize: 44, letterSpacing: '-.048em' }}>
        The decision stays with Leila.
      </div>
      <div style={{ position: 'absolute', right: 58, top: 86, width: 340, color: 'rgba(33,0,61,.62)', fontSize: 13, lineHeight: 1.5 }}>
        Request evidence, accept with exception, or escalate. The agent draft is only a starting point.
      </div>
      <ProductWindow
        crumb="Award desk"
        title="Record disposition"
        style={{
          position: 'absolute',
          left: 180,
          right: 180,
          top: 156,
          height: 500,
          transform: `translateY(${(1 - stage) * 26}px) scale(${0.98 + stage * 0.02})`,
          opacity: stage,
        }}
      >
        <div style={{ height: 410, background: '#fcfbf8', padding: '16px 22px 14px' }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: palette.muted }}>RFP-2026-041</div>
          <div style={{ marginTop: 4, fontSize: 22, fontWeight: 720, letterSpacing: '-.03em' }}>Record disposition</div>
          <div style={{ marginTop: 4, color: palette.muted, fontSize: 12 }}>Your judgment becomes part of the decision record.</div>
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            {options.map((option, index) => {
              const enter = clamp(frame, [18 + index * 12, 40 + index * 12], [0, 1])
              return (
                <div
                  key={option.title}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '22px 1fr',
                    gap: 10,
                    alignItems: 'center',
                    padding: '9px 12px',
                    borderRadius: 12,
                    border: `1.5px solid ${option.selected ? palette.ink : palette.line}`,
                    background: 'white',
                    opacity: enter,
                    transform: `translateY(${(1 - enter) * 10}px)`,
                  }}
                >
                  <div style={{ width: 16, height: 16, borderRadius: 99, border: `1.5px solid ${option.selected ? palette.ink : '#c5c7c2'}`, display: 'grid', placeItems: 'center' }}>
                    {option.selected && <div style={{ width: 8, height: 8, borderRadius: 99, background: palette.ink }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.04em', textTransform: 'uppercase' }}>{option.title}</div>
                    <div style={{ marginTop: 2, color: palette.muted, fontSize: 11 }}>{option.hint}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 10, borderRadius: 10, border: `1px solid ${palette.line}`, background: 'white', padding: '8px 10px', color: palette.ink, fontSize: 11, lineHeight: 1.45, opacity: clamp(frame, [70, 100], [0, 1]) }}>
            Northstar’s award rests on country-specific delivery capacity (Req 07). Kenya and Sudan hubs are evidenced; Ethiopia is named in Annex B but no capacity letter is linked.
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                height: 36,
                padding: '0 14px',
                borderRadius: 9,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: confirmed > 0.6 ? palette.mintDark : palette.navy,
                color: 'white',
                fontSize: 12,
                fontWeight: 700,
                transform: `scale(${1 - click * 0.05})`,
              }}
            >
              {confirmed > 0.6 ? <Check size={14} /> : null}
              {confirmed > 0.6 ? 'Disposition recorded' : 'Confirm disposition'}
            </div>
          </div>
        </div>
      </ProductWindow>
      <Cursor x={x} y={y} click={click} label={frame > 210 && confirmed < 0.5 ? 'Confirm' : undefined} />
      <Disclosure />
    </Scene>
  )
}

function RecordScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const card = spring({ frame: frame - 8, fps, config: { damping: 18, stiffness: 90 } })
  const side = spring({ frame: frame - 150, fps, config: { damping: 16, stiffness: 100 } })
  const off = clamp(frame, [176, 206], [0, 1])
  const lock = spring({ frame: frame - 214, fps, config: { damping: 14, stiffness: 120 } })
  const safeguardingOn = off < 0.5
  return (
    <Scene duration={beats.record.duration} background={palette.navy}>
      <AbsoluteFill
        style={{
          backgroundImage:
            'radial-gradient(circle at 82% 12%, rgba(120,216,196,.16), transparent 28%), radial-gradient(circle at 10% 86%, rgba(114,76,210,.2), transparent 32%)',
        }}
      />
      <div style={{ position: 'absolute', left: 52, top: 32 }}>
        <Chapter dark>04 · Frozen record</Chapter>
      </div>
      <div style={{ position: 'absolute', left: 52, top: 74, color: palette.ivory, fontFamily: display, fontSize: 44, letterSpacing: '-.048em' }}>
        The packs freeze with the judgment.
      </div>
      <div style={{ position: 'absolute', right: 54, top: 86, width: 360, color: 'rgba(255,255,255,.55)', fontSize: 13, lineHeight: 1.5 }}>
        Turning a pack off the next morning changes tonight’s prep. It does not rewrite this file.
      </div>
      <div style={{ position: 'absolute', left: 52, right: 52, top: 168, height: 490, display: 'grid', gridTemplateColumns: '1.35fr .78fr', gap: 16 }}>
        <div
          style={{
            borderRadius: 22,
            background: 'rgba(255,255,255,.96)',
            color: palette.ink,
            padding: '18px 20px 16px',
            boxShadow: '0 28px 70px rgba(0,0,0,.28)',
            transform: `translateY(${(1 - card) * 24}px)`,
            opacity: card,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: '.12em', textTransform: 'uppercase', color: palette.mintDark }}>Shareable record</div>
              <div style={{ marginTop: 5, fontSize: 22, fontWeight: 720, letterSpacing: '-.03em' }}>Decision record · RFP-2026-041</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: lock, transform: `scale(${0.8 + lock * 0.2})` }}>
              <Lock size={14} color={palette.mintDark} />
              <span style={{ fontSize: 11, fontWeight: 700, color: palette.mintDark }}>Frozen</span>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <Tag tone="mint">Reconstruction in progress — evidence requested</Tag>
          </div>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ borderRadius: 12, background: '#f6f4ef', padding: '10px 12px' }}>
              <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: palette.muted }}>Requirement</div>
              <div style={{ marginTop: 4, fontSize: 12, fontWeight: 720 }}>07 — Country-specific delivery capacity</div>
            </div>
            <div style={{ borderRadius: 12, background: '#f6f4ef', padding: '10px 12px' }}>
              <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: palette.muted }}>Evidence state</div>
              <div style={{ marginTop: 4, fontSize: 12, fontWeight: 720 }}>23 of 27 linked · 86%</div>
              <div style={{ marginTop: 3, color: palette.muted, fontSize: 10.5 }}>Gap: no Ethiopia-specific capacity evidence</div>
            </div>
          </div>
          <div style={{ marginTop: 12, fontFamily: mono, fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: palette.muted }}>
            Governing packs at disposition
          </div>
          <div style={{ marginTop: 6, border: `1px solid ${palette.line}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr .5fr .9fr', padding: '7px 10px', background: '#f4f3ef', fontFamily: mono, fontSize: 8, letterSpacing: '.08em', textTransform: 'uppercase', color: palette.muted }}>
              <span>Pack</span><span>Version</span><span>Category</span>
            </div>
            {inForcePacks.map((pack, index) => {
              const enter = clamp(frame, [40 + index * 10, 62 + index * 10], [0, 1])
              const highlight = pack.category === 'Safeguarding' && off > 0.45
              return (
                <div
                  key={pack.name}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.5fr .5fr .9fr',
                    padding: '8px 10px',
                    borderTop: `1px solid ${palette.line}`,
                    fontSize: 11.5,
                    alignItems: 'center',
                    background: highlight ? '#e7f6f1' : 'white',
                    opacity: enter,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{pack.name}</span>
                  <span style={{ fontFamily: mono }}>{pack.version}</span>
                  <span style={{ color: palette.muted }}>{pack.category}</span>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, fontWeight: 650, color: palette.ink, opacity: lock }}>
            Frozen at disposition. Turning a pack off later does not rewrite this record.
          </div>
          <div style={{ marginTop: 4, color: palette.muted, fontSize: 11, opacity: lock }}>
            Request evidence · Leila Hassan · Monday 9:14 · Cairo
          </div>
        </div>
        <div
          style={{
            borderRadius: 22,
            border: '1px solid rgba(255,255,255,.14)',
            background: 'rgba(255,255,255,.06)',
            color: 'white',
            padding: 20,
            transform: `translateY(${(1 - side) * 20}px)`,
            opacity: side,
          }}
        >
          <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: '.12em', textTransform: 'uppercase', color: palette.mint }}>The next morning</div>
          <div style={{ marginTop: 8, fontFamily: display, fontSize: 28, letterSpacing: '-.04em', lineHeight: 1.05 }}>Library changes. This file does not.</div>
          <div style={{ marginTop: 16, borderRadius: 14, background: 'rgba(255,255,255,.94)', color: palette.ink, padding: '12px 12px 10px' }}>
            <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: palette.muted }}>Rule library</div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 720 }}>Safeguarding policy v3.0</div>
                <div style={{ marginTop: 3, color: palette.muted, fontSize: 10.5 }}>{safeguardingOn ? 'On for new awards' : 'Off for new awards'}</div>
              </div>
              <Switch on={safeguardingOn} position={1 - off} />
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'flex-start', color: 'rgba(255,255,255,.78)', fontSize: 12, lineHeight: 1.45, opacity: off }}>
            <AlertTriangle size={15} color={palette.amber} style={{ flex: '0 0 auto', marginTop: 1 }} />
            <span>Off — overnight prep will stop using it. RFP-2026-041 still cites v3.0.</span>
          </div>
        </div>
      </div>
      <Disclosure dark />
    </Scene>
  )
}

function OutroScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const line = clamp(frame, [12, 78], [0, 1])
  const logo = spring({ frame: frame - 18, fps, config: { damping: 16, stiffness: 88 } })
  const headline = spring({ frame: frame - 42, fps, config: { damping: 19, stiffness: 95 } })
  const cta = clamp(frame, [96, 132], [0, 1])
  return (
    <Scene duration={beats.outro.duration} background={palette.lavender} fadeOut={0}>
      <AbsoluteFill
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 30%, rgba(255,255,255,.86), transparent 34%), linear-gradient(rgba(33,0,61,.038) 1px, transparent 1px), linear-gradient(90deg, rgba(33,0,61,.038) 1px, transparent 1px)',
          backgroundSize: 'auto, 46px 46px, 46px 46px',
        }}
      />
      <svg viewBox="0 0 1280 720" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <path d="M-40 520 C180 400 300 560 470 390 S760 210 900 340 S1120 500 1340 300" fill="none" stroke="rgba(33,0,61,.12)" strokeWidth="2" />
        <path d="M-40 520 C180 400 300 560 470 390 S760 210 900 340 S1120 500 1340 300" fill="none" stroke={palette.mintDark} strokeWidth="4" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - line} />
      </svg>
      {[
        { x: 250, y: 470, delay: 24 },
        { x: 468, y: 386, delay: 40 },
        { x: 896, y: 336, delay: 56 },
        { x: 1124, y: 412, delay: 72 },
      ].map((node, index) => {
        const enter = clamp(frame, [node.delay, node.delay + 16], [0, 1])
        return (
          <div
            key={node.x}
            style={{
              position: 'absolute',
              left: node.x,
              top: node.y,
              width: 13,
              height: 13,
              borderRadius: 99,
              background: index === 3 ? palette.plum : palette.mint,
              border: '3px solid rgba(255,255,255,.85)',
              boxShadow: `0 0 0 ${enter * 9}px rgba(120,216,196,.14)`,
              transform: `scale(${enter})`,
            }}
          />
        )
      })}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 78, display: 'flex', justifyContent: 'center', opacity: logo, transform: `translateY(${(1 - logo) * 18}px)` }}>
        <TraceliMark dark />
      </div>
      <div style={{ position: 'absolute', left: 120, right: 120, top: 168, textAlign: 'center', opacity: headline, transform: `translateY(${(1 - headline) * 36}px)` }}>
        <div style={{ color: palette.plum, fontFamily: display, fontSize: 72, lineHeight: 0.98, letterSpacing: '-.05em' }}>Before you sign,</div>
        <div style={{ marginTop: 6, color: palette.plum, fontFamily: display, fontSize: 72, lineHeight: 0.98, letterSpacing: '-.05em' }}>the packs are already frozen.</div>
        <div style={{ marginTop: 26, color: 'rgba(33,0,61,.58)', fontSize: 16 }}>What checked tonight. What you decided. What the file keeps.</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 86, display: 'flex', justifyContent: 'center', opacity: cta, transform: `translateY(${(1 - cta) * 14}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, borderRadius: 13, background: palette.plum, color: 'white', padding: '14px 18px 14px 22px', boxShadow: '0 14px 35px rgba(33,0,61,.18)', fontSize: 13, fontWeight: 720 }}>
          Open Award desk
          <span style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 99, background: palette.mint, color: palette.plum }}>
            <ArrowRight size={15} />
          </span>
        </div>
      </div>
      <Disclosure />
    </Scene>
  )
}

export function TraceliAwardDeskFilm() {
  return (
    <AbsoluteFill style={{ background: palette.navy, fontFamily: sans }}>
      <Sequence from={beats.intro.from} durationInFrames={beats.intro.duration}><IntroScene /></Sequence>
      <Sequence from={beats.library.from} durationInFrames={beats.library.duration}><LibraryScene /></Sequence>
      <Sequence from={beats.desk.from} durationInFrames={beats.desk.duration}><DeskScene /></Sequence>
      <Sequence from={beats.prep.from} durationInFrames={beats.prep.duration}><PrepScene /></Sequence>
      <Sequence from={beats.disposition.from} durationInFrames={beats.disposition.duration}><DispositionScene /></Sequence>
      <Sequence from={beats.record.from} durationInFrames={beats.record.duration}><RecordScene /></Sequence>
      <Sequence from={beats.outro.from} durationInFrames={beats.outro.duration}><OutroScene /></Sequence>
    </AbsoluteFill>
  )
}

export const awardDeskPosterFrame = 1668
