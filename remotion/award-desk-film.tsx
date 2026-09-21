import type { ReactNode } from 'react'
import { AlertTriangle, ArrowRight, Check, Lock } from 'lucide-react'
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

/** 50.0s at 30fps. Under a Reel, faster than the previous 67s cut. */
export const awardDeskFilmFrames = 1500

const beats = {
  open: { from: 0, duration: 200 },
  pain: { from: 188, duration: 250 },
  turn: { from: 426, duration: 190 },
  relief: { from: 604, duration: 540 },
  payoff: { from: 1132, duration: 210 },
  end: { from: 1330, duration: 170 },
} as const

const ui = { x: 596, y: 28, w: 640, h: 664 }

const packs = [
  { name: 'Procurement manual', version: '4.1', category: 'Procurement' },
  { name: 'ECHO-style donor conditions', version: '2026.2', category: 'Donor' },
  { name: 'Multilateral sanctions hygiene', version: '1.0', category: 'Sanctions' },
  { name: 'Safeguarding policy', version: '3.0', category: 'Safeguarding' },
] as const

const snap = { damping: 18, stiffness: 170, mass: 0.55 }

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
  const enter = spring({ frame: frame - 2, fps, config: snap })
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
  enterAt = 0,
}: {
  children: ReactNode
  title: string
  crumb?: string
  enterAt?: number
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame: frame - enterAt, fps, config: snap })
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
        opacity: enter,
        transform: `translateY(${(1 - enter) * 22}px)`,
      }}
    >
      <div style={{ height: ui.h - 90, background: '#fcfbf8', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>{children}</div>
    </ProductWindow>
  )
}

function OpenScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const first = spring({ frame: frame - 8, fps, config: snap })
  const second = spring({ frame: frame - 16, fps, config: snap })
  const sub = clamp(frame, [28, 42], [0, 1])
  return (
    <Scene duration={beats.open.duration} background={palette.lavender} fadeIn={6} fadeOut={8}>
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
      <div style={{ position: 'absolute', right: 48, top: 40 }}>
        <Chapter>Problem</Chapter>
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
        <div style={{ marginTop: 18, color: 'rgba(33,0,61,.62)', fontSize: 18, opacity: sub }}>
          The question comes after the signature.
        </div>
      </div>
      <Disclosure />
    </Scene>
  )
}

function PainScene() {
  const frame = useCurrentFrame()
  const travel = clamp(frame, [28, 52], [0, 1])
  const x = interpolate(travel, [0, 1], [ui.x + 40, ui.x + 110])
  const y = interpolate(travel, [0, 1], [ui.y + 180, ui.y + 352])
  return (
    <Scene duration={beats.pain.duration} background={palette.lavenderSoft} fadeIn={8} fadeOut={8}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(circle at 18% 10%, white, transparent 32%)' }} />
      <Guide
        chapter="The cost"
        lines={['Overnight hope is cheap.', 'An empty file, when they ask, is expensive.']}
      />
      <Stage title="RFP-2026-041" crumb="Award">
        <div style={{ padding: '22px 22px 18px' }}>
          <div style={{ fontSize: 26, fontWeight: 680, letterSpacing: '-.03em' }}>Good morning, Leila.</div>
          <div style={{ marginTop: 4, color: palette.muted, fontSize: 14 }}>Monday 9:02 · Cairo</div>
          <div style={{ marginTop: 16, borderRadius: 14, border: `1px solid ${palette.line}`, borderLeft: `4px solid ${palette.amber}`, background: 'white', padding: '16px 16px 14px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 99, background: palette.amberSoft, color: '#6f4d0f', fontFamily: mono, fontSize: 10, fontWeight: 750, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              <span style={{ width: 6, height: 6, borderRadius: 9, background: palette.amber }} />
              Waiting on you
            </div>
            <div style={{ marginTop: 10, fontSize: 18, fontWeight: 730, letterSpacing: '-.03em' }}>Emergency Shelter & NFI Logistics</div>
            <div style={{ marginTop: 4, fontFamily: mono, fontSize: 12, color: palette.muted }}>RFP-2026-041 · Northstar Relief</div>
            <div style={{ marginTop: 12, fontSize: 15, lineHeight: 1.4 }}>Kickoff Thursday. They will ask why this supplier won.</div>
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: '#f6f1e4', color: '#6f4d0f', fontSize: 14, fontWeight: 700 }}>
              Nothing you can show yet.
            </div>
          </div>
        </div>
      </Stage>
      <Cursor x={x} y={y} />
      <Disclosure />
    </Scene>
  )
}

function TurnScene() {
  const frame = useCurrentFrame()
  return (
    <Scene duration={beats.turn.duration} background={palette.paper} fadeIn={8} fadeOut={8}>
      <AbsoluteFill
        style={{
          backgroundImage: 'linear-gradient(rgba(7,29,57,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(7,29,57,.035) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />
      <Guide
        chapter="Proof"
        lines={["What saves you isn't more rules.", "It's proof that still holds."]}
        note="When they ask, you can point at what was checked."
      />
      <Stage title="What was left on" crumb="Before the night">
        <div style={{ padding: '16px 16px 12px', display: 'grid', gap: 8 }}>
          {packs.map((pack, index) => {
            const enter = clamp(frame, [8 + index * 7, 20 + index * 7], [0, 1])
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
                  <div style={{ marginTop: 3, color: palette.muted, fontSize: 12 }}>{pack.category} · v{pack.version}</div>
                </div>
                <Switch on />
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
  const night = clamp(frame, [158, 174], [1, 0])
  const nameIn = clamp(frame, [166, 182], [0, 1]) * clamp(frame, [338, 354], [1, 0])
  const fileIn = clamp(frame, [346, 362], [0, 1])
  const click = clickPulse(frame, 250)
  const confirmed = clamp(frame, [258, 272], [0, 1])
  const gapTravel = clamp(frame, [70, 98], [0, 1])
  const gapX = interpolate(gapTravel, [0, 1], [ui.x + 200, ui.x + 590])
  const gapY = interpolate(gapTravel, [0, 1], [ui.y + 240, ui.y + 340])
  const confirmX = interpolate(clamp(frame, [210, 242], [0, 1]), [0, 1], [ui.x + 40, ui.x + 102])
  const confirmY = interpolate(clamp(frame, [210, 242], [0, 1]), [0, 1], [ui.y + 260, ui.y + 447])
  const steps = [
    { time: '23:14', text: 'Linked the delivery promise', gap: false },
    { time: '01:02', text: '23 of 27 items on the file', gap: false },
    { time: '03:48', text: 'Ethiopia capacity — not on the file', gap: true },
    { time: '06:41', text: 'A note, waiting for Leila', gap: false },
  ]
  return (
    <Scene duration={beats.relief.duration} background={palette.paper} fadeIn={8} fadeOut={8}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(circle at 80% 0%, rgba(245,232,196,.45), transparent 34%)' }} />
      <div style={{ position: 'absolute', left: 44, top: 36, bottom: 48, width: 520, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Chapter>The file</Chapter>
        <div style={{ marginTop: 18, position: 'relative', minHeight: 150 }}>
          <CopyBlock opacity={night} lines={['The night writes it down.', 'Before anyone asks.']} />
          <CopyBlock opacity={nameIn} lines={['The draft is not the decision.', 'Your name is.']} />
          <CopyBlock opacity={fileIn} lines={['The file answers', 'when they ask.']} />
        </div>
      </div>
      <Stage title="RFP-2026-041 · Emergency Shelter" crumb="Northstar Relief">
        <div style={{ position: 'relative', height: '100%' }}>
          <div style={{ position: 'absolute', inset: 0, padding: '88px 18px 16px', opacity: night }}>
            <div style={{ fontSize: 18, fontWeight: 730 }}>While you were away</div>
            <div style={{ marginTop: 4, color: palette.muted, fontSize: 13 }}>Sun 23:14 – Mon 06:41</div>
            <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
              {steps.map((step, index) => {
                const enter = clamp(frame, [12 + index * 12, 26 + index * 12], [0, 1])
                return (
                  <div key={step.time} style={{ display: 'grid', gridTemplateColumns: '52px 1fr auto', gap: 8, alignItems: 'center', minHeight: 36, opacity: enter, transform: `translateY(${(1 - enter) * 8}px)` }}>
                    <div style={{ fontFamily: mono, fontSize: 12, color: palette.muted }}>{step.time}</div>
                    <div style={{ fontSize: 14, fontWeight: step.gap ? 730 : 560 }}>{step.text}</div>
                    {step.gap ? <span style={{ padding: '3px 7px', borderRadius: 99, background: palette.amberSoft, color: '#6f4d0f', fontSize: 11, fontWeight: 750 }}>Gap</span> : <Check size={14} color={palette.mintDark} />}
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 14, borderRadius: 12, background: '#e7f6f1', padding: '10px 12px', opacity: clamp(frame, [70, 86], [0, 1]) }}>
              <div style={{ fontSize: 13, fontWeight: 730 }}>Checked against what was left on</div>
              <div style={{ marginTop: 4, color: palette.muted, fontSize: 12 }}>Four sources · including Safeguarding v3.0</div>
            </div>
          </div>
          <div style={{ position: 'absolute', inset: 0, padding: '72px 18px 16px', opacity: nameIn, background: '#fcfbf8' }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: palette.muted }}>RFP-2026-041</div>
            <div style={{ marginTop: 4, fontSize: 20, fontWeight: 730 }}>Your call</div>
            <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
              {([
                ['Request the missing proof', 'Hold until Ethiopia is on the file', true],
                ['Accept the gap', 'Say why kickoff can live with it', false],
                ['Escalate', 'Send it to compliance first', false],
              ] as const).map(([title, hint, selected], index) => (
                <div key={title} style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 12, border: `1.5px solid ${selected ? palette.ink : palette.line}`, background: 'white', opacity: clamp(frame, [180 + index * 6, 192 + index * 6], [0, 1]) }}>
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
            <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 14px', borderRadius: 10, background: confirmed > 0.5 ? palette.mintDark : palette.navy, color: 'white', fontSize: 14, fontWeight: 730, transform: `scale(${1 - click * 0.04})` }}>
              {confirmed > 0.5 ? <Check size={15} /> : null}
              {confirmed > 0.5 ? 'Leila’s call is on the file' : 'Put your name on it'}
            </div>
          </div>
          <div style={{ position: 'absolute', inset: 0, padding: '64px 18px 16px', opacity: fileIn, background: '#fcfbf8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 730 }}>Decision record · RFP-2026-041</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: palette.mintDark, fontSize: 12, fontWeight: 730 }}>
                <Lock size={14} /> Held
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: palette.muted }}>Evidence requested · Leila Hassan · Monday 9:14</div>
            <div style={{ marginTop: 12, borderRadius: 12, background: '#f6f4ef', padding: '10px 12px' }}>
              <div style={{ fontSize: 13, fontWeight: 730 }}>What the file can show</div>
              <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.4 }}>Kenya and Sudan are linked. Ethiopia is the gap she refused to skip.</div>
            </div>
            <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
              {packs.map((pack, index) => (
                <div key={pack.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 10, background: 'white', border: `1px solid ${palette.line}`, opacity: clamp(frame, [360 + index * 6, 372 + index * 6], [0, 1]) }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{pack.name}</span>
                  <span style={{ fontFamily: mono, fontSize: 12, color: palette.muted }}>v{pack.version}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Stage>
      {frame < 175 ? <Cursor x={gapX} y={gapY} label={frame > 96 ? 'The gap' : undefined} /> : null}
      {frame >= 175 && frame < 360 ? <Cursor x={confirmX} y={confirmY} click={click} /> : null}
      <Disclosure />
    </Scene>
  )
}

function CopyBlock({ lines, opacity }: { lines: string[]; opacity: number }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, opacity }}>
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
  const off = clamp(frame, [28, 48], [0, 1])
  const on = off < 0.5
  const travel = clamp(frame, [10, 32], [0, 1])
  const click = clickPulse(frame, 36)
  const x = interpolate(travel, [0, 1], [ui.x + 220, ui.x + 589])
  const y = interpolate(travel, [0, 1], [ui.y + 140, ui.y + 260])
  return (
    <Scene duration={beats.payoff.duration} background={palette.navy} fadeIn={8} fadeOut={8}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(circle at 84% 12%, rgba(120,216,196,.16), transparent 28%)' }} />
      <Guide
        dark
        chapter="The file"
        lines={['Tomorrow you can change your mind.', "The file doesn't have to."]}
      />
      <Stage title="RFP-2026-041" crumb="The next morning">
        <div style={{ padding: '16px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 12px', borderRadius: 12, background: 'white', border: `1px solid ${on ? palette.line : '#e4d7b0'}` }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 730 }}>Safeguarding policy v3.0</div>
              <div style={{ marginTop: 3, color: palette.muted, fontSize: 13 }}>{on ? 'Still on for new awards' : 'Off for tomorrow’s awards'}</div>
            </div>
            <Switch on={on} position={1 - off} />
          </div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, color: palette.mintDark, fontSize: 13, fontWeight: 730, opacity: off }}>
            <Lock size={14} /> This award still shows v3.0
          </div>
          <div style={{ marginTop: 10, borderRadius: 12, overflow: 'hidden', border: `1px solid ${palette.line}` }}>
            {packs.map((pack, index) => {
              const hold = pack.category === 'Safeguarding'
              return (
                <div key={pack.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: hold && off > 0.4 ? '#e7f6f1' : 'white', borderTop: index === 0 ? 'none' : `1px solid ${palette.line}`, fontSize: 13 }}>
                  <span style={{ fontWeight: 700 }}>{pack.name}</span>
                  <span style={{ fontFamily: mono, color: palette.muted }}>v{pack.version}{hold ? ' · still here' : ''}</span>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.4, opacity: off }}>
            <AlertTriangle size={15} color="#8a641b" style={{ marginTop: 1 }} />
            <span>You can change your mind tomorrow. This file still answers what was checked.</span>
          </div>
        </div>
      </Stage>
      <Cursor x={x} y={y} click={click} />
      <Disclosure dark />
    </Scene>
  )
}

function EndScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const logo = spring({ frame: frame - 6, fps, config: snap })
  const line = spring({ frame: frame - 14, fps, config: snap })
  const second = spring({ frame: frame - 22, fps, config: snap })
  return (
    <Scene duration={beats.end.duration} background={palette.lavender} fadeIn={8} fadeOut={0}>
      <AbsoluteFill
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 32%, rgba(255,255,255,.86), transparent 34%), linear-gradient(rgba(33,0,61,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(33,0,61,.04) 1px, transparent 1px)',
          backgroundSize: 'auto, 46px 46px, 46px 46px',
        }}
      />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 168, display: 'flex', justifyContent: 'center', opacity: logo, transform: `translateY(${(1 - logo) * 14}px)` }}>
        <TraceliMark dark />
      </div>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 250, textAlign: 'center' }}>
        <div style={{ opacity: line, transform: `translateY(${(1 - line) * 16}px)`, color: palette.plum, fontFamily: display, fontSize: 68, letterSpacing: '-.05em', lineHeight: 1 }}>
          Before you sign.
        </div>
        <div style={{ marginTop: 10, opacity: second, transform: `translateY(${(1 - second) * 16}px)`, color: palette.plum, fontFamily: display, fontSize: 68, letterSpacing: '-.05em', lineHeight: 1 }}>
          Have something to show.
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 92, display: 'flex', justifyContent: 'center', opacity: clamp(frame, [48, 64], [0, 1]) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 12, background: palette.plum, color: 'white', padding: '12px 16px 12px 18px', fontSize: 14, fontWeight: 720 }}>
          Open Award desk
          <span style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', borderRadius: 99, background: palette.mint, color: palette.plum }}>
            <ArrowRight size={14} />
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
      <Sequence from={beats.open.from} durationInFrames={beats.open.duration}><OpenScene /></Sequence>
      <Sequence from={beats.pain.from} durationInFrames={beats.pain.duration}><PainScene /></Sequence>
      <Sequence from={beats.turn.from} durationInFrames={beats.turn.duration}><TurnScene /></Sequence>
      <Sequence from={beats.relief.from} durationInFrames={beats.relief.duration}><ReliefScene /></Sequence>
      <Sequence from={beats.payoff.from} durationInFrames={beats.payoff.duration}><PayoffScene /></Sequence>
      <Sequence from={beats.end.from} durationInFrames={beats.end.duration}><EndScene /></Sequence>
    </AbsoluteFill>
  )
}

/** Payoff, once the morning switch is off and the file still lists v3.0. */
export const awardDeskPosterFrame = 1208
