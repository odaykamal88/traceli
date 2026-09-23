import type { ReactNode } from 'react'
import { Check, Lock } from 'lucide-react'
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

/** 52.0s at 30fps. Read-hold before each product panel; under a Reel. */
export const awardDeskFilmFrames = 1560

const beats = {
  open: { from: 0, duration: 200 },
  pain: { from: 184, duration: 270 },
  turn: { from: 438, duration: 240 },
  relief: { from: 662, duration: 500 },
  payoff: { from: 1146, duration: 260 },
  end: { from: 1390, duration: 170 },
} as const

/**
 * Stagger: guide text is readable by frame 22.
 * The product panel stays off until frame 48 — a 26-frame read (~0.87s) —
 * then slides in. It leaves over frames duration-32..duration-16 so the
 * copy is still up through the 16-frame chapter crossfade.
 */
const UI_IN = 48
const sceneFade = 16

const ui = { x: 596, y: 28, w: 640, h: 664 }

const packs = [
  { name: 'Procurement manual', version: '4.1', category: 'Procurement' },
  { name: 'ECHO-style donor conditions', version: '2026.2', category: 'Donor' },
  { name: 'Multilateral sanctions hygiene', version: '1.0', category: 'Sanctions' },
  { name: 'Safeguarding policy', version: '3.0', category: 'Safeguarding' },
] as const

const snap = { damping: 18, stiffness: 170, mass: 0.55 }
const readIn = { damping: 22, stiffness: 78, mass: 0.9 }
const panelIn = { damping: 22, stiffness: 70, mass: 1 }

function clickPulse(frame: number, at: number) {
  return clamp(frame, [at, at + 6], [0, 1]) * clamp(frame, [at + 6, at + 14], [1, 0])
}

function Switch({ on, position }: { on: boolean; position?: number }) {
  const knob = position ?? (on ? 1 : 0)
  return (
    <div style={{ width: 44, height: 26, borderRadius: 99, background: on ? palette.navy : '#d5d6d2', padding: 3 }}>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 99,
          background: 'white',
          transform: `translateX(${knob * 18}px)`,
          boxShadow: '0 1px 3px rgba(7,29,57,.28)',
        }}
      />
    </div>
  )
}

function Guide({
  chapter,
  lines,
  note,
  dark = false,
}: {
  chapter: string
  lines: readonly string[]
  note?: string
  dark?: boolean
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame: frame - 2, fps, config: readIn })
  return (
    <div
      style={{
        position: 'absolute',
        left: 44,
        top: 36,
        bottom: 48,
        width: 520,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        opacity: enter,
        transform: `translateY(${(1 - enter) * 18}px)`,
      }}
    >
      <Chapter dark={dark}>{chapter}</Chapter>
      <div style={{ marginTop: 18 }}>
        {lines.map((line) => (
          <div
            key={line}
            style={{
              color: dark ? palette.ivory : palette.plum,
              fontFamily: display,
              fontSize: 40,
              lineHeight: 1.08,
              letterSpacing: '-.04em',
            }}
          >
            {line}
          </div>
        ))}
      </div>
      {note ? (
        <div style={{ marginTop: 18, maxWidth: 420, color: dark ? 'rgba(255,255,255,.62)' : 'rgba(33,0,61,.62)', fontSize: 16, lineHeight: 1.4 }}>
          {note}
        </div>
      ) : null}
    </div>
  )
}

function Stage({
  children,
  title,
  crumb = 'The file',
  enterAt = UI_IN,
  duration,
  fade = 1,
}: {
  children: ReactNode
  title: string
  crumb?: string
  enterAt?: number
  duration: number
  fade?: number
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame: frame - enterAt, fps, config: panelIn })
  const leave = clamp(frame, [duration - 32, duration - 16], [1, 0])
  return (
    <ProductWindow
      crumb={crumb}
      title={title}
      style={{
        position: 'absolute',
        left: ui.x,
        top: ui.y,
        width: ui.w,
        height: ui.h,
        opacity: enter * leave * fade,
        transform: `translateX(${(1 - enter) * 36}px)`,
      }}
    >
      <div style={{ height: ui.h - 90, background: '#fcfbf8', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>{children}</div>
    </ProductWindow>
  )
}

function OpenScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const first = spring({ frame: frame - 6, fps, config: readIn })
  const second = spring({ frame: frame - 18, fps, config: readIn })
  const sub = clamp(frame, [58, 76], [0, 1])
  return (
    <Scene duration={beats.open.duration} background={palette.lavender} fadeIn={8} fadeOut={sceneFade}>
      <AbsoluteFill
        style={{
          backgroundImage:
            'radial-gradient(circle at 70% 18%, rgba(255,255,255,.78), transparent 28%), linear-gradient(rgba(33,0,61,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(33,0,61,.045) 1px, transparent 1px)',
          backgroundSize: 'auto, 44px 44px, 44px 44px',
        }}
      />
      <div style={{ position: 'absolute', left: 48, top: 36 }}>
        <TraceliMark dark />
      </div>
      <div style={{ position: 'absolute', left: 48, right: 48, top: 210, textAlign: 'center' }}>
        <div style={{ height: 78, overflow: 'hidden' }}>
          <div style={{ transform: `translateY(${(1 - first) * 84}px)`, opacity: first, color: palette.plum, fontFamily: display, fontSize: 54, letterSpacing: '-.045em', lineHeight: 1.08, whiteSpace: 'nowrap' }}>
            You won't be judged on what you signed.
          </div>
        </div>
        <div style={{ height: 78, overflow: 'hidden', marginTop: 2 }}>
          <div style={{ transform: `translateY(${(1 - second) * 84}px)`, opacity: second, color: palette.plum, fontFamily: display, fontSize: 54, letterSpacing: '-.045em', lineHeight: 1.08, whiteSpace: 'nowrap' }}>
            You'll be judged on what you can show.
          </div>
        </div>
        <div style={{ marginTop: 18, color: 'rgba(33,0,61,.62)', fontSize: 18, opacity: sub, transform: `translateY(${(1 - sub) * 8}px)` }}>
          After the ink, they ask what you checked.
        </div>
      </div>
      <Disclosure />
    </Scene>
  )
}

function PainScene() {
  const frame = useCurrentFrame()
  const travel = clamp(frame, [78, 108], [0, 1])
  const x = interpolate(travel, [0, 1], [ui.x + 80, ui.x + 160])
  const y = interpolate(travel, [0, 1], [ui.y + 220, ui.y + 480])
  return (
    <Scene duration={beats.pain.duration} background={palette.lavenderSoft} fadeIn={sceneFade} fadeOut={sceneFade}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(circle at 18% 10%, white, transparent 32%)' }} />
      <Guide
        chapter="The risk"
        lines={['The award is ready to sign.', "The file can't yet say what you checked."]}
      />
      <Stage title="RFP-2026-041" crumb="Award" duration={beats.pain.duration}>
        <div style={{ padding: '22px 22px 18px' }}>
          <div style={{ fontSize: 26, fontWeight: 680, letterSpacing: '-.03em' }}>Good morning, Leila.</div>
          <div style={{ marginTop: 4, color: palette.muted, fontSize: 14 }}>Monday 9:02 · Cairo</div>
          <div style={{ marginTop: 16, borderRadius: 14, border: `1px solid ${palette.line}`, borderLeft: `4px solid ${palette.amber}`, background: 'white', padding: '16px 16px 14px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 99, background: palette.amberSoft, color: '#6f4d0f', fontFamily: mono, fontSize: 10, fontWeight: 750, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              <span style={{ width: 6, height: 6, borderRadius: 9, background: palette.amber }} />
              Ready to sign
            </div>
            <div style={{ marginTop: 10, fontSize: 18, fontWeight: 730, letterSpacing: '-.03em' }}>Emergency Shelter & NFI Logistics</div>
            <div style={{ marginTop: 4, fontFamily: mono, fontSize: 12, color: palette.muted }}>RFP-2026-041 · Northstar Relief</div>
            <div style={{ marginTop: 12, fontSize: 15, lineHeight: 1.4 }}>Kickoff Thursday. The signature can happen today.</div>
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: '#f6f1e4', color: '#6f4d0f', fontSize: 14, fontWeight: 700 }}>
              Nothing held yet. No check is on the file.
            </div>
          </div>
        </div>
      </Stage>
      {frame >= 72 ? <Cursor x={x} y={y} /> : null}
      <Disclosure />
    </Scene>
  )
}

function TurnScene() {
  const frame = useCurrentFrame()
  return (
    <Scene duration={beats.turn.duration} background={palette.paper} fadeIn={sceneFade} fadeOut={sceneFade}>
      <AbsoluteFill
        style={{
          backgroundImage: 'linear-gradient(rgba(7,29,57,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(7,29,57,.035) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />
      <Guide
        chapter="Before overnight"
        lines={['First, decide what this award has to survive.', "Not more paperwork — the questions you'll be asked."]}
      />
      <Stage title="Questions this award must answer" crumb="Before overnight" duration={beats.turn.duration}>
        <div style={{ padding: '16px 16px 12px', display: 'grid', gap: 8 }}>
          {packs.map((pack, index) => {
            const enter = clamp(frame, [52 + index * 8, 66 + index * 8], [0, 1])
            const turned = clamp(frame, [72 + index * 10, 86 + index * 10], [0, 1])
            return (
              <div
                key={pack.name}
                style={{
                  height: 78,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '0 14px',
                  borderRadius: 12,
                  background: 'white',
                  border: `1px solid ${palette.line}`,
                  opacity: enter,
                  transform: `translateX(${(1 - enter) * 16}px)`,
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 730 }}>{pack.name}</div>
                  <div style={{ marginTop: 3, color: palette.muted, fontSize: 12 }}>{turned > 0.55 ? 'On for this award' : 'Off'}</div>
                </div>
                <Switch on={turned > 0.5} position={turned} />
              </div>
            )
          })}
        </div>
      </Stage>
      <Disclosure />
    </Scene>
  )
}

function ReliefScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const chapterIn = spring({ frame: frame - 2, fps, config: readIn })
  const line1In = clamp(frame, [2, 20], [0, 1])
  const line1Out = clamp(frame, [176, 194], [1, 0])
  const line2In = clamp(frame, [178, 196], [0, 1])
  const nightFade = clamp(frame, [186, 206], [1, 0])
  const morningEnter = spring({ frame: frame - 224, fps, config: panelIn })
  const presence = Math.max(nightFade, morningEnter)
  const click = clickPulse(frame, 302)
  const confirmed = clamp(frame, [310, 324], [0, 1])
  const gapTravel = clamp(frame, [108, 132], [0, 1])
  const gapX = interpolate(gapTravel, [0, 1], [ui.x + 280, ui.x + 590])
  const gapY = interpolate(gapTravel, [0, 1], [ui.y + 300, ui.y + 454])
  const confirmTravel = clamp(frame, [268, 296], [0, 1])
  const confirmX = interpolate(confirmTravel, [0, 1], [ui.x + 80, ui.x + 150])
  const confirmY = interpolate(confirmTravel, [0, 1], [ui.y + 280, ui.y + 532])
  const steps = [
    { time: '23:14', text: 'Delivery promise linked', gap: false },
    { time: '01:02', text: '23 of 27 items checked', gap: false },
    { time: '03:48', text: 'Ethiopia capacity — not on the file', gap: true },
    { time: '06:41', text: 'Waiting for Leila', gap: false },
  ]
  return (
    <Scene duration={beats.relief.duration} background={palette.paper} fadeIn={sceneFade} fadeOut={sceneFade}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(circle at 80% 0%, rgba(245,232,196,.45), transparent 34%)' }} />
      <div
        style={{
          position: 'absolute',
          left: 44,
          top: 36,
          bottom: 48,
          width: 520,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          opacity: chapterIn,
          transform: `translateY(${(1 - chapterIn) * 18}px)`,
        }}
      >
        <Chapter>Overnight → morning</Chapter>
        <div style={{ marginTop: 18, position: 'relative', minHeight: 140 }}>
          <CopyBlock opacity={line1In * line1Out} shift={(1 - line1In) * 16} lines={["Checks run while you're away."]} />
          <CopyBlock opacity={line2In} shift={(1 - line2In) * 16} lines={['Morning: you decide with the evidence already there.']} />
        </div>
      </div>
      <Stage title="RFP-2026-041" crumb="Northstar Relief" duration={beats.relief.duration} fade={presence}>
        <div style={{ position: 'relative', height: ui.h - 90 }}>
          <div style={{ position: 'absolute', inset: 0, padding: '72px 18px 16px', opacity: nightFade, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 730 }}>Checks running · RFP-2026-041</div>
            <div style={{ marginTop: 4, color: palette.muted, fontSize: 13 }}>Sun 23:14 – Mon 06:41 · while Leila is away</div>
            <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
              {steps.map((step, index) => {
                const enter = clamp(frame, [56 + index * 10, 68 + index * 10], [0, 1])
                return (
                  <div key={step.time} style={{ display: 'grid', gridTemplateColumns: '52px 1fr auto', gap: 8, alignItems: 'center', minHeight: 36, opacity: enter, transform: `translateY(${(1 - enter) * 8}px)` }}>
                    <div style={{ fontFamily: mono, fontSize: 12, color: palette.muted }}>{step.time}</div>
                    <div style={{ fontSize: 14, fontWeight: step.gap ? 730 : 560 }}>{step.text}</div>
                    {step.gap ? <span style={{ padding: '3px 7px', borderRadius: 99, background: palette.amberSoft, color: '#6f4d0f', fontSize: 11, fontWeight: 750 }}>Gap</span> : <Check size={14} color={palette.mintDark} />}
                  </div>
                )
              })}
            </div>
          </div>
          <div style={{ position: 'absolute', inset: 0, padding: '28px 18px 16px', opacity: morningEnter > 0 ? 1 : 0, background: '#fcfbf8', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: palette.muted }}>Monday 9:02 · Cairo</div>
            <div style={{ marginTop: 4, fontSize: 20, fontWeight: 730 }}>Your call</div>
            <div style={{ marginTop: 10, borderRadius: 12, background: '#f6f1e4', color: '#6f4d0f', padding: '10px 12px', fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>
              Already there: Ethiopia capacity is not on the file.
            </div>
            <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              {([
                ['Request the missing proof', 'Hold until Ethiopia is on the file', true],
                ['Accept the gap', 'Say why kickoff can live with it', false],
                ['Escalate', 'Send it to compliance first', false],
              ] as const).map(([title, hint, selected], index) => (
                <div key={title} style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: 10, alignItems: 'center', padding: '9px 12px', borderRadius: 12, border: `1.5px solid ${selected ? palette.ink : palette.line}`, background: 'white', opacity: clamp(frame, [230 + index * 4, 238 + index * 4], [0, 1]) }}>
                  <div style={{ width: 14, height: 14, borderRadius: 99, border: `1.5px solid ${selected ? palette.ink : '#c5c7c2'}`, display: 'grid', placeItems: 'center' }}>
                    {selected ? <div style={{ width: 7, height: 7, borderRadius: 99, background: palette.ink }} /> : null}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 730 }}>{title}</div>
                    <div style={{ marginTop: 2, color: palette.muted, fontSize: 12 }}>{hint}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 14px', borderRadius: 10, background: confirmed > 0.5 ? palette.mintDark : palette.navy, color: 'white', fontSize: 14, fontWeight: 730, transform: `scale(${1 - click * 0.04})` }}>
              {confirmed > 0.5 ? <Check size={15} /> : null}
              {confirmed > 0.5 ? 'Decision is on the file' : 'Record the decision'}
            </div>
          </div>
        </div>
      </Stage>
      {frame >= 96 && frame < 176 ? <Cursor x={gapX} y={gapY} /> : null}
      {frame >= 260 && frame < 360 ? <Cursor x={confirmX} y={confirmY} click={click} /> : null}
      <Disclosure />
    </Scene>
  )
}

function CopyBlock({ lines, opacity, shift = 0 }: { lines: string[]; opacity: number; shift?: number }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, opacity, transform: `translateY(${shift}px)` }}>
      {lines.map((line) => (
        <div key={line} style={{ color: palette.plum, fontFamily: display, fontSize: 40, lineHeight: 1.08, letterSpacing: '-.04em' }}>
          {line}
        </div>
      ))}
    </div>
  )
}

function PayoffScene() {
  const frame = useCurrentFrame()
  const off = clamp(frame, [92, 116], [0, 1])
  const on = off < 0.45
  const travel = clamp(frame, [64, 86], [0, 1])
  const click = clickPulse(frame, 90)
  const x = interpolate(travel, [0, 1], [ui.x + 220, ui.x + 589])
  const y = interpolate(travel, [0, 1], [ui.y + 200, ui.y + 280])
  return (
    <Scene duration={beats.payoff.duration} background={palette.navy} fadeIn={sceneFade} fadeOut={sceneFade}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(circle at 84% 12%, rgba(120,216,196,.16), transparent 28%)' }} />
      <Guide
        dark
        chapter="What stays"
        lines={['Tomorrow you can turn a check off.', 'What you signed against still shows on the record.']}
      />
      <Stage title="RFP-2026-041" crumb="The next morning" duration={beats.payoff.duration}>
        <div style={{ padding: '16px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 12px', borderRadius: 12, background: 'white', border: `1px solid ${on ? palette.line : '#e4d7b0'}` }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 730 }}>Safeguarding policy v3.0</div>
              <div style={{ marginTop: 3, color: palette.muted, fontSize: 13 }}>{on ? 'On for new awards' : "Off for tomorrow's awards"}</div>
            </div>
            <Switch on={on} position={1 - off} />
          </div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, color: palette.mintDark, fontSize: 13, fontWeight: 730, opacity: Math.max(off, 0.35) }}>
            <Lock size={14} /> Signed against · still on this record
          </div>
          <div style={{ marginTop: 10, borderRadius: 12, overflow: 'hidden', border: `1px solid ${palette.line}` }}>
            {packs.map((pack, index) => {
              const hold = pack.category === 'Safeguarding'
              return (
                <div key={pack.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: hold ? '#e7f6f1' : 'white', borderTop: index === 0 ? 'none' : `1px solid ${palette.line}`, fontSize: 13 }}>
                  <span style={{ fontWeight: 700 }}>{pack.name}</span>
                  <span style={{ fontFamily: mono, color: palette.muted }}>v{pack.version}{hold ? ' · signed against' : ''}</span>
                </div>
              )
            })}
          </div>
        </div>
      </Stage>
      {frame >= 60 ? <Cursor x={x} y={y} click={click} /> : null}
      <Disclosure dark />
    </Scene>
  )
}

function EndScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const logo = spring({ frame: frame - 8, fps, config: readIn })
  const line = spring({ frame: frame - 40, fps, config: readIn })
  const second = spring({ frame: frame - 78, fps, config: readIn })
  return (
    <Scene duration={beats.end.duration} background={palette.lavender} fadeIn={sceneFade} fadeOut={0}>
      <AbsoluteFill
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 32%, rgba(255,255,255,.86), transparent 34%), linear-gradient(rgba(33,0,61,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(33,0,61,.04) 1px, transparent 1px)',
          backgroundSize: 'auto, 46px 46px, 46px 46px',
        }}
      />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 188, display: 'flex', justifyContent: 'center', opacity: logo, transform: `translateY(${(1 - logo) * 14}px)` }}>
        <TraceliMark dark />
      </div>
      <div style={{ position: 'absolute', left: 64, right: 64, top: 268, textAlign: 'center' }}>
        <div style={{ opacity: line, transform: `translateY(${(1 - line) * 16}px)`, color: palette.plum, fontFamily: display, fontSize: 58, letterSpacing: '-.045em', lineHeight: 1.05 }}>
          Trace — Before you sign.
        </div>
        <div style={{ marginTop: 16, opacity: second, transform: `translateY(${(1 - second) * 10}px)`, color: 'rgba(33,0,61,.62)', fontSize: 18 }}>
          A file that still answers the question.
        </div>
      </div>
      <Disclosure />
    </Scene>
  )
}

export function TraceliAwardDeskFilm() {
  return (
    <AbsoluteFill style={{ background: palette.navy, fontFamily: sans }}>
      <Sequence from={beats.open.from} durationInFrames={beats.open.duration}><OpenScene /></Sequence>
      <Sequence from={beats.pain.from} durationInFrames={beats.pain.duration}><PainScene /></Sequence>
      <Sequence from={beats.turn.from} durationInFrames={beats.turn.duration}><TurnScene /></Sequence>
      <Sequence from={beats.relief.from} durationInFrames={beats.relief.duration}><ReliefScene /></Sequence>
      <Sequence from={beats.payoff.from} durationInFrames={beats.payoff.duration}><PayoffScene /></Sequence>
      <Sequence from={beats.end.from} durationInFrames={beats.end.duration}><EndScene /></Sequence>
    </AbsoluteFill>
  )
}

/** Payoff, once the morning switch is off and the record still lists v3.0. */
export const awardDeskPosterFrame = 1280
