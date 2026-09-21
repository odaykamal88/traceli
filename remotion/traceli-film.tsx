import type { CSSProperties, ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clock3,
  FileCheck2,
  FileText,
  Fingerprint,
  History,
  Link2,
  Lock,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Waypoints,
} from 'lucide-react'
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

export const palette = {
  navy: '#061a33',
  ink: '#071d39',
  ivory: '#fbf5ea',
  paper: '#f7f3eb',
  white: '#fffefb',
  mint: '#78d8c4',
  mintDark: '#2f8876',
  lavender: '#ded8ff',
  lavenderSoft: '#eeeaff',
  plum: '#21003d',
  violet: '#6a2bd4',
  amber: '#d3a13f',
  amberSoft: '#f5e8c4',
  line: '#d9d8d2',
  muted: '#6d777d',
} as const

export const sans = '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'
export const display = 'Georgia, "Times New Roman", serif'
export const mono = 'ui-monospace, "SFMono-Regular", Menlo, Monaco, monospace'
const smooth = Easing.bezier(0.22, 1, 0.36, 1)

export const clamp = (frame: number, input: [number, number], output: [number, number]) =>
  interpolate(frame, input, output, {
    easing: smooth,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

const fadeForScene = (frame: number, duration: number, fadeIn = 18, fadeOut = 18) => {
  if (fadeOut === 0) return clamp(frame, [0, fadeIn], [0, 1])
  return interpolate(
    frame,
    [0, fadeIn, duration - fadeOut, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )
}

export function Scene({
  children,
  duration,
  background = palette.paper,
  fadeIn,
  fadeOut,
}: {
  children: ReactNode
  duration: number
  background?: string
  fadeIn?: number
  fadeOut?: number
}) {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill
      style={{
        background,
        opacity: fadeForScene(frame, duration, fadeIn, fadeOut),
        overflow: 'hidden',
        fontFamily: sans,
        color: palette.ink,
      }}
    >
      {children}
    </AbsoluteFill>
  )
}

export function TraceliMark({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  const size = compact ? 29 : 36
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 10 : 13 }}>
      <div style={{ position: 'relative', width: size, height: size, flex: '0 0 auto' }}>
        <div
          style={{
            position: 'absolute',
            inset: 4,
            transform: 'rotate(45deg)',
            borderRadius: compact ? 6 : 8,
            background: `linear-gradient(145deg, #0d3953, ${palette.ink})`,
            border: `1px solid ${palette.mint}aa`,
            boxShadow: '0 8px 22px rgba(6,26,51,.24), inset 0 1px rgba(255,255,255,.18)',
          }}
        />
        <Waypoints
          size={compact ? 15 : 18}
          strokeWidth={1.8}
          color={palette.ivory}
          style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}
        />
        <div
          style={{
            position: 'absolute',
            width: compact ? 5 : 7,
            height: compact ? 5 : 7,
            right: 1,
            top: 1,
            borderRadius: 99,
            background: palette.mint,
            border: `1px solid ${palette.navy}`,
            boxShadow: `0 0 10px ${palette.mint}`,
          }}
        />
      </div>
      <span
        style={{
          color: dark ? palette.ink : palette.ivory,
          fontFamily: mono,
          fontSize: compact ? 12 : 14,
          fontWeight: 750,
          letterSpacing: '.24em',
          textTransform: 'uppercase',
        }}
      >
        traceli
      </span>
    </div>
  )
}

export function Chapter({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 9,
        padding: '7px 11px',
        borderRadius: 999,
        color: dark ? palette.ivory : palette.ink,
        border: `1px solid ${dark ? 'rgba(255,255,255,.18)' : 'rgba(7,29,57,.13)'}`,
        background: dark ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.68)',
        fontFamily: mono,
        fontSize: 9,
        fontWeight: 750,
        letterSpacing: '.14em',
        textTransform: 'uppercase',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 9, background: palette.mint }} />
      {children}
    </div>
  )
}

export function Disclosure({ dark = false }: { dark?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 48,
        bottom: 24,
        fontFamily: mono,
        fontSize: 8.5,
        letterSpacing: '.07em',
        color: dark ? 'rgba(255,255,255,.34)' : 'rgba(7,29,57,.42)',
        textTransform: 'uppercase',
      }}
    >
      Illustrative product film · fictional tender and supplier data
    </div>
  )
}

export function ProductWindow({
  children,
  style,
  title = 'RFP-2026-041 · Emergency Shelter & NFI Logistics',
  crumb = 'Procurements',
}: {
  children: ReactNode
  style?: CSSProperties
  title?: string
  crumb?: string
}) {
  return (
    <div
      style={{
        borderRadius: 22,
        overflow: 'hidden',
        background: palette.white,
        border: '1px solid rgba(7,29,57,.14)',
        boxShadow: '0 32px 90px rgba(19,8,48,.2), 0 4px 18px rgba(7,29,57,.1)',
        ...style,
      }}
    >
      <div
        style={{
          height: 54,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,.92)',
          borderBottom: `1px solid ${palette.line}`,
        }}
      >
        <TraceliMark dark compact />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: palette.muted, fontSize: 9.5 }}>
            <span style={{ width: 6, height: 6, borderRadius: 8, background: palette.mint }} />
            Fictional demo
          </div>
          <div style={{ width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center', background: palette.navy, color: 'white', fontSize: 8.5, fontWeight: 750 }}>AM</div>
        </div>
      </div>
      <div
        style={{
          height: 36,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '0 20px',
          color: palette.muted,
          fontSize: 9.5,
          borderBottom: `1px solid ${palette.line}`,
          background: '#fbfaf6',
        }}
      >
        {crumb} <ChevronRight size={11} /> <span style={{ color: palette.ink, fontWeight: 650 }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

export function StatCard({
  label,
  value,
  detail,
  tone = 'navy',
  icon,
}: {
  label: string
  value: string
  detail: string
  tone?: 'navy' | 'mint' | 'amber'
  icon?: ReactNode
}) {
  const tones = {
    navy: { bg: '#f4f3ef', fg: palette.ink },
    mint: { bg: '#e0f4ee', fg: '#155f53' },
    amber: { bg: palette.amberSoft, fg: '#755315' },
  }
  const selected = tones[tone]
  return (
    <div style={{ borderRadius: 15, padding: 15, background: selected.bg, border: '1px solid rgba(7,29,57,.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: selected.fg }}>
        <span style={{ fontFamily: mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</span>
        {icon}
      </div>
      <div style={{ marginTop: 12, color: selected.fg, fontSize: 24, fontWeight: 720, letterSpacing: '-.04em' }}>{value}</div>
      <div style={{ marginTop: 4, color: palette.muted, fontSize: 9.5 }}>{detail}</div>
    </div>
  )
}

export function Cursor({ x, y, click = 0, label }: { x: number; y: number; click?: number; label?: string }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `scale(${1 - click * 0.08})`, zIndex: 30 }}>
      {click > 0 && <div style={{ position: 'absolute', width: 34 + click * 24, height: 34 + click * 24, left: -14 - click * 12, top: -14 - click * 12, borderRadius: 99, border: `2px solid ${palette.mint}`, opacity: 1 - click }} />}
      <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
        <path d="M2 2L21 15.2L12.2 17.1L8.1 25L2 2Z" fill="#071d39" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      {label && <div style={{ position: 'absolute', left: 17, top: 20, whiteSpace: 'nowrap', background: palette.ink, color: 'white', padding: '5px 8px', borderRadius: 7, fontSize: 8, fontWeight: 700 }}>{label}</div>}
    </div>
  )
}

function IntroScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const wordSpring = spring({ frame: frame - 15, fps, config: { damping: 18, mass: 0.8, stiffness: 95 } })
  const secondSpring = spring({ frame: frame - 26, fps, config: { damping: 18, mass: 0.8, stiffness: 95 } })
  const windowSpring = spring({ frame: frame - 68, fps, config: { damping: 20, mass: 1.15, stiffness: 88 } })
  const orbital = frame * 0.2
  const chips = [
    { label: 'Tender §4.2', x: 80, y: 162, delay: 5 },
    { label: 'ECHO v2026.2', x: 1010, y: 138, delay: 12 },
    { label: 'Panel record', x: 94, y: 496, delay: 20 },
    { label: 'Evidence map', x: 1040, y: 492, delay: 28 },
  ]
  return (
    <Scene duration={145} background={palette.lavender} fadeIn={8}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(circle at 74% 17%, rgba(255,255,255,.72), transparent 24%), linear-gradient(rgba(33,0,61,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(33,0,61,.045) 1px, transparent 1px)', backgroundSize: 'auto, 44px 44px, 44px 44px', transform: `scale(${1 + frame / 3000})` }} />
      <div style={{ position: 'absolute', left: 52, top: 38 }}><TraceliMark dark /></div>
      <div style={{ position: 'absolute', right: 54, top: 43 }}><Chapter>Procurement assurance</Chapter></div>
      {chips.map((chip, index) => {
        const enter = clamp(frame, [chip.delay, chip.delay + 25], [0, 1])
        const float = Math.sin((orbital + index * 28) / 10) * 5
        return (
          <div key={chip.label} style={{ position: 'absolute', left: chip.x, top: chip.y + float, opacity: enter * 0.74, transform: `translateY(${(1 - enter) * 18}px)`, display: 'flex', alignItems: 'center', gap: 7, border: '1px solid rgba(33,0,61,.14)', background: 'rgba(255,255,255,.48)', padding: '8px 11px', borderRadius: 10, color: palette.plum, fontFamily: mono, fontSize: 8.5, fontWeight: 700 }}>
            <Link2 size={11} />{chip.label}
          </div>
        )
      })}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 135, textAlign: 'center' }}>
        <div style={{ height: 105, overflow: 'hidden' }}>
          <div style={{ transform: `translateY(${(1 - wordSpring) * 115}px)`, opacity: wordSpring, color: palette.plum, fontFamily: display, fontSize: 104, letterSpacing: '-.055em', lineHeight: 1 }}>Every award,</div>
        </div>
        <div style={{ height: 112, overflow: 'hidden', marginTop: -8 }}>
          <div style={{ transform: `translateY(${(1 - secondSpring) * 118}px)`, opacity: secondSpring, color: palette.plum, fontFamily: display, fontSize: 110, letterSpacing: '-.057em', lineHeight: 1 }}>audit ready.</div>
        </div>
        <div style={{ marginTop: 8, color: 'rgba(33,0,61,.62)', fontSize: 16, letterSpacing: '-.01em', opacity: clamp(frame, [48, 72], [0, 1]) }}>Rules, evidence and human decisions. One defensible record.</div>
      </div>
      <div style={{ position: 'absolute', left: 300, right: 300, bottom: -100, height: 195, transform: `translateY(${(1 - windowSpring) * 80}px) scale(${0.94 + windowSpring * 0.06})`, opacity: windowSpring }}>
        <ProductWindow style={{ height: 260 }}>
          <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 12 }}>
            <div style={{ borderRadius: 12, background: palette.navy, padding: 16, color: 'white' }}>
              <div style={{ fontFamily: mono, color: palette.mint, fontSize: 8, textTransform: 'uppercase', letterSpacing: '.12em' }}>Decision readiness</div>
              <div style={{ marginTop: 10, fontFamily: display, fontSize: 26 }}>Why did this supplier win?</div>
            </div>
            <div style={{ borderRadius: 12, border: `1px solid ${palette.line}`, padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700 }}>Source-linked answer</div>
              <div style={{ height: 7, width: '78%', background: '#dfe1dd', borderRadius: 8, marginTop: 12 }} />
              <div style={{ height: 7, width: '54%', background: '#e8e8e5', borderRadius: 8, marginTop: 7 }} />
            </div>
          </div>
        </ProductWindow>
      </div>
      <Disclosure />
    </Scene>
  )
}

function DashboardScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const stageSpring = spring({ frame: frame - 5, fps, config: { damping: 20, stiffness: 92 } })
  const cursorProgress = clamp(frame, [65, 112], [0, 1])
  const click = clamp(frame, [116, 126], [0, 1]) * clamp(frame, [126, 139], [1, 0])
  const x = interpolate(cursorProgress, [0, 1], [1040, 423], { easing: smooth })
  const y = interpolate(cursorProgress, [0, 1], [576, 344], { easing: smooth })
  return (
    <Scene duration={190} background={palette.lavenderSoft}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(circle at 15% 10%, white, transparent 30%), radial-gradient(circle at 85% 85%, rgba(120,216,196,.2), transparent 25%)' }} />
      <div style={{ position: 'absolute', left: 58, top: 44 }}><Chapter>01 · The blocked award</Chapter></div>
      <div style={{ position: 'absolute', left: 58, top: 88, color: palette.plum, fontFamily: display, fontSize: 42, letterSpacing: '-.045em' }}>See the risk before award day.</div>
      <ProductWindow style={{ position: 'absolute', left: 58, right: 58, top: 156, height: 492, transform: `translateY(${(1 - stageSpring) * 42}px) scale(${0.975 + stageSpring * 0.025})`, opacity: stageSpring }}>
        <div style={{ display: 'grid', gridTemplateColumns: '176px 1fr', height: 401 }}>
          <div style={{ padding: 16, borderRight: `1px solid ${palette.line}`, background: '#faf9f5' }}>
            {[
              { label: 'Today', Icon: Clock3 },
              { label: 'Procurements', Icon: FileText },
              { label: 'Suppliers', Icon: Users },
              { label: 'Audit', Icon: History },
              { label: 'Controls', Icon: ShieldCheck },
            ].map(({ label, Icon }, i) => (
              <div key={label} style={{ height: 42, padding: '0 11px', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5, background: i === 1 ? palette.navy : 'transparent', color: i === 1 ? 'white' : palette.muted, fontSize: 10.5, fontWeight: i === 1 ? 700 : 560 }}>
                <Icon size={14} />{label}
              </div>
            ))}
          </div>
          <div style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: mono, fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '.12em', color: palette.mintDark }}>Portfolio control tower</div>
                <div style={{ marginTop: 7, fontSize: 22, fontWeight: 720, letterSpacing: '-.035em' }}>Which awards would be hardest to defend tomorrow?</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${palette.line}`, padding: '8px 11px', borderRadius: 9, color: palette.muted, fontSize: 9 }}><Search size={12} /> Search</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 17 }}>
              <StatCard label="Decision readiness" value="4 blocked" detail="2 awards due this week" tone="amber" icon={<AlertTriangle size={13} />} />
              <StatCard label="Evidence coverage" value="89%" detail="Across active awards" icon={<Link2 size={13} />} />
              <StatCard label="Audit integrity" value="Verified" detail="All server events chained" tone="mint" icon={<ShieldCheck size={13} />} />
            </div>
            <div style={{ marginTop: 14, border: `1px solid ${palette.line}`, borderRadius: 13, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr .7fr .7fr .9fr', padding: '10px 13px', fontFamily: mono, fontSize: 8, textTransform: 'uppercase', letterSpacing: '.07em', color: palette.muted, background: '#f5f4f0' }}><span>Procurement</span><span>Coverage</span><span>Award</span><span>Readiness</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr .7fr .7fr .9fr', padding: '13px', alignItems: 'center', background: frame > 124 ? '#f2f0ff' : 'white', borderTop: `1px solid ${palette.line}`, boxShadow: frame > 124 ? `inset 3px 0 ${palette.violet}` : 'none' }}>
                <div><div style={{ fontFamily: mono, fontSize: 8, color: palette.muted }}>RFP-2026-041</div><div style={{ marginTop: 4, fontSize: 10.5, fontWeight: 700 }}>Emergency Shelter & NFI Logistics</div></div>
                <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 700 }}>86%</div>
                <div style={{ fontSize: 9.5 }}>22 Aug</div>
                <div><span style={{ display: 'inline-flex', padding: '5px 8px', borderRadius: 99, background: palette.amberSoft, color: '#715016', fontSize: 8.5, fontWeight: 750 }}>4 blockers</span></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr .7fr .7fr .9fr', padding: '13px', alignItems: 'center', borderTop: `1px solid ${palette.line}`, opacity: .56 }}>
                <div><div style={{ fontFamily: mono, fontSize: 8 }}>RFQ-2026-073</div><div style={{ marginTop: 4, fontSize: 10.5, fontWeight: 650 }}>Cash Programme Connectivity</div></div><div style={{ fontFamily: mono, fontSize: 12 }}>100%</div><div style={{ fontSize: 9.5 }}>29 Aug</div><div><span style={{ padding: '5px 8px', borderRadius: 99, background: '#dff3ed', color: '#1e6658', fontSize: 8.5, fontWeight: 750 }}>Ready</span></div>
              </div>
            </div>
          </div>
        </div>
        <Cursor x={x} y={y} click={click} label={frame > 118 ? 'Open award' : undefined} />
      </ProductWindow>
      <Disclosure />
    </Scene>
  )
}

function EvidenceScene() {
  const frame = useCurrentFrame()
  const highlight = clamp(frame, [58, 87], [0, 1])
  const mapProgress = clamp(frame, [80, 135], [0, 1])
  const push = clamp(frame, [135, 178], [0, 1])
  return (
    <Scene duration={195} background={palette.paper}>
      <AbsoluteFill style={{ backgroundImage: 'linear-gradient(rgba(7,29,57,.035) 1px, transparent 1px),linear-gradient(90deg,rgba(7,29,57,.035) 1px,transparent 1px)', backgroundSize: '36px 36px' }} />
      <div style={{ position: 'absolute', left: 52, top: 38 }}><Chapter>02 · Follow the golden thread</Chapter></div>
      <div style={{ position: 'absolute', left: 52, top: 84, color: palette.ink, fontFamily: display, fontSize: 48, letterSpacing: '-.05em' }}>One gap. No guesswork.</div>
      <div style={{ position: 'absolute', right: 58, top: 94, width: 360, color: palette.muted, fontSize: 13, lineHeight: 1.55 }}>Traceli links the requirement to the exact tender clause, then shows what supplier evidence supports—and what it does not.</div>
      <ProductWindow style={{ position: 'absolute', left: 52, right: 52, top: 170, height: 478 }} title="REQ-07 · Emergency delivery capacity">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr .92fr', height: 386 }}>
          <div style={{ padding: 23, borderRight: `1px solid ${palette.line}` }}>
            <div style={{ fontFamily: mono, fontSize: 8.5, color: palette.mintDark, textTransform: 'uppercase', letterSpacing: '.12em' }}>Source tender clause · RFP §4.2 p.14</div>
            <div style={{ position: 'relative', marginTop: 13, padding: '16px 18px', borderRadius: 12, background: '#f3f2ed', borderLeft: `3px solid ${palette.ink}`, fontFamily: display, fontSize: 16, lineHeight: 1.42 }}>
              “The supplier must demonstrate capacity to deliver emergency shelter kits within 72 hours across Kenya, Somalia and Ethiopia.”
              <div style={{ position: 'absolute', left: 15, right: 13, bottom: 14, height: 11, background: `rgba(120,216,196,${highlight * .36})`, transform: `scaleX(${highlight})`, transformOrigin: 'left', zIndex: -1 }} />
            </div>
            <div style={{ marginTop: 17, display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{ width: 37, height: 37, borderRadius: 11, background: '#e6f5f0', color: palette.mintDark, display: 'grid', placeItems: 'center' }}><FileCheck2 size={18} /></div>
              <div><div style={{ fontSize: 11, fontWeight: 720 }}>Extracted requirement</div><div style={{ marginTop: 4, color: palette.muted, fontSize: 9.5 }}>Confirmed by Sarah Ahmed · reviewer</div></div>
              <CheckCircle2 size={17} color={palette.mintDark} style={{ marginLeft: 'auto' }} />
            </div>
            <div style={{ marginTop: 15, padding: '12px 14px', borderRadius: 11, border: `1px solid ${palette.line}`, fontSize: 10, lineHeight: 1.5 }}>
              <strong>Human boundary:</strong> Traceli finds and cites evidence. The reviewer determines whether the obligation is satisfied.
            </div>
          </div>
          <div style={{ position: 'relative', padding: 23, background: '#fcfbf8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontFamily: mono, color: palette.muted, fontSize: 8, textTransform: 'uppercase', letterSpacing: '.1em' }}>Submission evidence map</div><div style={{ marginTop: 6, fontSize: 13, fontWeight: 720 }}>Northstar Relief Logistics</div></div>
              <span style={{ padding: '6px 9px', borderRadius: 99, background: palette.amberSoft, color: '#6f4d0f', fontSize: 8, fontWeight: 750 }}>Needs clarification</span>
            </div>
            <svg viewBox="0 0 440 246" style={{ position: 'absolute', left: 22, right: 22, top: 88, width: 440, height: 246, overflow: 'visible' }}>
              <path d="M58 112 C125 112 125 45 205 45 S310 45 376 45" fill="none" stroke="#9bcdbc" strokeWidth="2" strokeDasharray="5 6" strokeDashoffset={40 * (1 - mapProgress)} opacity={mapProgress} />
              <path d="M58 112 C125 112 125 112 205 112 S310 112 376 112" fill="none" stroke="#9bcdbc" strokeWidth="2" strokeDasharray="5 6" strokeDashoffset={40 * (1 - mapProgress)} opacity={mapProgress} />
              <path d="M58 112 C125 112 125 180 205 180 S310 180 376 180" fill="none" stroke="#d9b66d" strokeWidth="2" strokeDasharray="5 6" strokeDashoffset={40 * (1 - mapProgress)} opacity={mapProgress} />
            </svg>
            <div style={{ position: 'absolute', left: 38, top: 176, width: 86, padding: '13px 10px', borderRadius: 12, background: palette.navy, color: 'white', textAlign: 'center', fontSize: 9, fontWeight: 700 }}>REQ-07</div>
            {[
              { top: 113, label: 'Kenya', state: 'Evidence found', ok: true },
              { top: 180, label: 'Somalia', state: 'Evidence found', ok: true },
              { top: 247, label: 'Ethiopia', state: 'Not located', ok: false },
            ].map((node, i) => {
              const enter = clamp(frame, [92 + i * 12, 119 + i * 12], [0, 1])
              return <div key={node.label} style={{ position: 'absolute', right: 28, top: node.top, width: 150, padding: '10px 12px', borderRadius: 11, background: node.ok ? '#e5f4ef' : palette.amberSoft, border: `1px solid ${node.ok ? '#b7ddd2' : '#e0c781'}`, transform: `translateX(${(1 - enter) * 28}px)`, opacity: enter }}><div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, fontWeight: 720 }}>{node.ok ? <CheckCircle2 size={13} color={palette.mintDark} /> : <AlertTriangle size={13} color="#8a641b" />}{node.label}</div><div style={{ marginTop: 3, paddingLeft: 20, color: palette.muted, fontSize: 8.5 }}>{node.state}</div></div>
            })}
          </div>
        </div>
        <div style={{ position: 'absolute', right: 74, bottom: 20, display: 'flex', alignItems: 'center', gap: 9, padding: '10px 15px', borderRadius: 10, color: 'white', background: palette.ink, fontSize: 10.5, fontWeight: 720, transform: `translateY(${(1 - push) * 14}px)`, opacity: push }}>Issue clarification <ArrowRight size={14} /></div>
      </ProductWindow>
      <Disclosure />
    </Scene>
  )
}

function HumanReviewScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const responseSpring = spring({ frame: frame - 20, fps, config: { damping: 17, stiffness: 110 } })
  const review = clamp(frame, [76, 116], [0, 1])
  const coverage = Math.round(interpolate(review, [0, 1], [86, 100]))
  const ring = `${coverage * 3.6}deg`
  return (
    <Scene duration={220} background={palette.navy}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(circle at 16% 14%, rgba(120,216,196,.19), transparent 30%), radial-gradient(circle at 85% 72%, rgba(126,92,220,.2), transparent 34%), linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)', backgroundSize: 'auto, auto, 42px 42px, 42px 42px' }} />
      <div style={{ position: 'absolute', left: 55, top: 42 }}><Chapter dark>03 · Human judgment stays visible</Chapter></div>
      <div style={{ position: 'absolute', left: 55, top: 91, color: palette.ivory, fontFamily: display, fontSize: 50, letterSpacing: '-.05em' }}>Evidence arrives. A human decides.</div>
      <div style={{ position: 'absolute', left: 56, top: 153, color: 'rgba(255,255,255,.52)', fontSize: 13 }}>No automatic compliance decision. Every determination keeps its actor, source and time.</div>
      <ProductWindow style={{ position: 'absolute', left: 55, right: 55, top: 208, height: 440 }} title="CLR-004 · Clarification review">
        <div style={{ display: 'grid', gridTemplateColumns: '.88fr 1.12fr', height: 348 }}>
          <div style={{ padding: 22, borderRight: `1px solid ${palette.line}`, background: '#f8f6f0' }}>
            <div style={{ fontFamily: mono, fontSize: 8, color: palette.muted, textTransform: 'uppercase', letterSpacing: '.12em' }}>Supplier response</div>
            <div style={{ marginTop: 13, padding: 15, background: 'white', border: `1px solid ${palette.line}`, borderRadius: 13, transform: `translateY(${(1 - responseSpring) * 26}px) scale(${0.96 + responseSpring * .04})`, opacity: responseSpring }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 34, height: 34, borderRadius: 10, background: '#ece9ff', color: palette.violet, display: 'grid', placeItems: 'center' }}><MessageSquareText size={17} /></div><div><div style={{ fontSize: 11, fontWeight: 720 }}>Clarification received</div><div style={{ marginTop: 3, color: palette.muted, fontSize: 8.5 }}>19 Aug · 09:26 · CLR-004-R1</div></div></div>
              <div style={{ marginTop: 13, color: palette.ink, fontSize: 10, lineHeight: 1.55 }}>Addis Ababa partner agreement and 72-hour distribution plan attached.</div>
              <div style={{ marginTop: 12, padding: '9px 10px', borderRadius: 8, background: '#f1f0ec', display: 'flex', alignItems: 'center', gap: 8, color: palette.muted, fontSize: 8.5 }}><FileText size={12} /> Ethiopia_distribution_plan.pdf <span style={{ marginLeft: 'auto' }}>1.8 MB</span></div>
            </div>
            <div style={{ marginTop: 15, display: 'flex', gap: 8, alignItems: 'center', color: palette.muted, fontSize: 9 }}><Fingerprint size={13} color={palette.mintDark} /> Attachment snapshot retained</div>
          </div>
          <div style={{ padding: 22, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div><div style={{ fontFamily: mono, fontSize: 8, color: palette.mintDark, textTransform: 'uppercase', letterSpacing: '.12em' }}>Reviewer determination</div><div style={{ marginTop: 6, fontSize: 16, fontWeight: 720 }}>REQ-07 · Emergency delivery capacity</div></div>
              <div style={{ width: 78, height: 78, borderRadius: 99, background: `conic-gradient(${palette.mintDark} ${ring}, #e2e4df 0)`, display: 'grid', placeItems: 'center' }}><div style={{ width: 62, height: 62, borderRadius: 99, background: 'white', display: 'grid', placeItems: 'center', fontFamily: mono, color: palette.ink, fontSize: 15, fontWeight: 750 }}>{coverage}%</div></div>
            </div>
            <div style={{ marginTop: 20, padding: 15, borderRadius: 12, border: `1px solid ${palette.line}`, background: review > .65 ? '#e8f5f1' : '#f6f4ef', transition: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: review > .65 ? palette.mintDark : palette.muted, fontSize: 11, fontWeight: 720 }}>{review > .65 ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}{review > .65 ? 'Satisfied after human review' : 'Awaiting reviewer determination'}</div>
              <div style={{ marginTop: 9, fontSize: 9.5, color: palette.muted, lineHeight: 1.5 }}>Sarah Ahmed confirmed that the named partner and distribution plan satisfy the Ethiopia capacity obligation.</div>
            </div>
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              <div style={{ borderRadius: 10, background: '#f4f3ef', padding: 12 }}><div style={{ color: palette.muted, fontSize: 8 }}>Actor</div><div style={{ marginTop: 5, fontSize: 10, fontWeight: 700 }}>Sarah Ahmed · reviewer</div></div>
              <div style={{ borderRadius: 10, background: '#f4f3ef', padding: 12 }}><div style={{ color: palette.muted, fontSize: 8 }}>Finding version</div><div style={{ marginTop: 5, fontFamily: mono, fontSize: 10, fontWeight: 700 }}>v3 · retained</div></div>
            </div>
            <div style={{ position: 'absolute', right: 22, bottom: 18, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 9, background: review > .65 ? palette.ink : '#b9bdba', color: 'white', fontSize: 9.5, fontWeight: 720, opacity: clamp(frame, [105, 126], [0, 1]) }}><Check size={13} /> Determination recorded</div>
          </div>
        </div>
      </ProductWindow>
      <Disclosure dark />
    </Scene>
  )
}

function ApprovalScene() {
  const frame = useCurrentFrame()
  const items = [
    { title: 'Procurement approval', actor: 'Amina Malik', delay: 30 },
    { title: 'Grants approval', actor: 'David Kimani', delay: 62 },
    { title: 'Conflict declaration', actor: 'Lina Haddad', delay: 94 },
  ]
  const resolved = items.filter((item) => frame > item.delay + 28).length
  return (
    <Scene duration={205} background={palette.lavender}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(circle at 50% 15%, rgba(255,255,255,.82), transparent 34%), linear-gradient(125deg, transparent 48%, rgba(33,0,61,.05) 48%, rgba(33,0,61,.05) 52%, transparent 52%)', backgroundSize: 'auto, 52px 52px' }} />
      <div style={{ position: 'absolute', left: 58, top: 42 }}><Chapter>04 · Complete the human controls</Chapter></div>
      <div style={{ position: 'absolute', left: 58, top: 88, width: 600, color: palette.plum, fontFamily: display, fontSize: 51, lineHeight: .98, letterSpacing: '-.05em' }}>Evidence complete.<br />Decision still human.</div>
      <div style={{ position: 'absolute', right: 64, top: 94, width: 335, color: 'rgba(33,0,61,.6)', fontSize: 13, lineHeight: 1.55 }}>Evidence coverage is never a supplier score. Approvals and declarations remain separate, visible controls.</div>
      <div style={{ position: 'absolute', left: 58, right: 58, top: 228, height: 356, display: 'grid', gridTemplateColumns: '1fr .72fr', gap: 18 }}>
        <div style={{ borderRadius: 23, background: 'rgba(255,255,255,.82)', border: '1px solid rgba(33,0,61,.12)', boxShadow: '0 28px 70px rgba(43,13,74,.13)', padding: 25 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><div style={{ fontFamily: mono, fontSize: 8.5, color: palette.violet, textTransform: 'uppercase', letterSpacing: '.1em' }}>Award control register</div><div style={{ marginTop: 6, fontSize: 18, fontWeight: 720 }}>RFP-2026-041 · panel sign-off</div></div><div style={{ padding: '7px 10px', borderRadius: 99, background: resolved === 3 ? '#dcf1eb' : palette.amberSoft, color: resolved === 3 ? palette.mintDark : '#6f4d0f', fontSize: 9, fontWeight: 750 }}>{resolved === 3 ? 'Ready to lock' : `${3 - resolved} controls open`}</div></div>
          <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
            {items.map((item) => {
              const enter = clamp(frame, [item.delay, item.delay + 20], [0, 1])
              const check = clamp(frame, [item.delay + 18, item.delay + 32], [0, 1])
              const done = frame > item.delay + 28
              return <div key={item.title} style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', alignItems: 'center', gap: 11, borderRadius: 13, padding: '11px 13px', background: done ? '#eff8f5' : '#f3f2ee', border: `1px solid ${done ? '#c3e4da' : palette.line}`, transform: `translateX(${(1 - enter) * 30}px)`, opacity: enter }}><div style={{ width: 36, height: 36, borderRadius: 11, display: 'grid', placeItems: 'center', background: done ? '#d8eee7' : '#e3e2de', color: done ? palette.mintDark : palette.muted }}><CircleUserRound size={17} /></div><div><div style={{ fontSize: 10.5, fontWeight: 720 }}>{item.title}</div><div style={{ marginTop: 3, color: palette.muted, fontSize: 8.5 }}>{item.actor} · human action</div></div><div style={{ width: 25, height: 25, borderRadius: 99, display: 'grid', placeItems: 'center', background: done ? palette.mintDark : '#d2d3cf', color: 'white', transform: `scale(${0.75 + check * .25})` }}>{done ? <Check size={13} /> : <Clock3 size={12} />}</div></div>
            })}
          </div>
        </div>
        <div style={{ borderRadius: 23, background: palette.navy, color: 'white', padding: 26, boxShadow: '0 28px 70px rgba(33,0,61,.18)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: 300, right: -105, bottom: -120, background: 'rgba(120,216,196,.16)' }} />
          <div style={{ fontFamily: mono, color: palette.mint, fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '.11em' }}>Decision readiness</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 15 }}><div style={{ fontFamily: display, fontSize: 64, letterSpacing: '-.06em' }}>{3 - resolved}</div><div style={{ color: 'rgba(255,255,255,.5)', fontSize: 12 }}>controls open</div></div>
          <div style={{ marginTop: 13, height: 7, borderRadius: 8, background: 'rgba(255,255,255,.12)', overflow: 'hidden' }}><div style={{ width: `${resolved / 3 * 100}%`, height: '100%', background: palette.mint, borderRadius: 8 }} /></div>
          <div style={{ marginTop: 18, display: 'grid', gap: 8, fontSize: 9.5, color: 'rgba(255,255,255,.62)' }}><div style={{ display: 'flex', gap: 8 }}><CheckCircle2 size={13} color={palette.mint} /> 100% cited evidence</div><div style={{ display: 'flex', gap: 8 }}><CheckCircle2 size={13} color={palette.mint} /> Reviewer determination retained</div><div style={{ display: 'flex', gap: 8, color: resolved === 3 ? palette.mint : 'rgba(255,255,255,.62)' }}>{resolved === 3 ? <CheckCircle2 size={13} /> : <Clock3 size={13} />} Panel controls complete</div></div>
        </div>
      </div>
      <Disclosure />
    </Scene>
  )
}

function AuditScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const lockSpring = spring({ frame: frame - 120, fps, config: { damping: 14, stiffness: 105 } })
  const events = [
    { time: '09:26', title: 'Clarification attached', type: 'Supplier event', delay: 22 },
    { time: '09:41', title: 'REQ-07 marked satisfied', type: 'Human action', delay: 44 },
    { time: '10:12', title: 'Panel controls completed', type: 'Approval', delay: 66 },
    { time: '10:18', title: 'Decision record locked', type: 'Approval', delay: 88 },
  ]
  return (
    <Scene duration={225} background={palette.navy}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(circle at 78% 16%, rgba(120,216,196,.16), transparent 28%), radial-gradient(circle at 13% 80%, rgba(114,76,210,.18), transparent 30%)' }} />
      <div style={{ position: 'absolute', left: 54, top: 42 }}><Chapter dark>05 · Seal the proof</Chapter></div>
      <div style={{ position: 'absolute', left: 54, top: 89, color: palette.ivory, fontFamily: display, fontSize: 50, letterSpacing: '-.05em' }}>The chronology builds itself.</div>
      <div style={{ position: 'absolute', right: 57, top: 101, width: 360, color: 'rgba(255,255,255,.51)', fontSize: 13, lineHeight: 1.5 }}>Each event keeps its actor, source snapshot and integrity hash—then the final decision record is locked.</div>
      <div style={{ position: 'absolute', left: 54, right: 54, top: 182, bottom: 62, display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 18 }}>
        <div style={{ borderRadius: 22, background: 'rgba(255,255,255,.95)', padding: 23, color: palette.ink, boxShadow: '0 28px 80px rgba(0,0,0,.24)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><div style={{ fontFamily: mono, fontSize: 8.5, color: palette.mintDark, textTransform: 'uppercase', letterSpacing: '.11em' }}>Immutable audit chronology</div><div style={{ marginTop: 6, fontSize: 17, fontWeight: 720 }}>Decision record DR-041</div></div><div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 8.5, color: palette.mintDark, fontWeight: 700 }}><ShieldCheck size={14} /> Chain verified</div></div>
          <div style={{ marginTop: 17, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 18, top: 19, bottom: 19, width: 2, background: '#dce7e3' }} />
            {events.map((event, i) => {
              const enter = clamp(frame, [event.delay, event.delay + 24], [0, 1])
              return <div key={event.title} style={{ position: 'relative', display: 'grid', gridTemplateColumns: '38px 1fr auto', alignItems: 'center', gap: 11, minHeight: 63, opacity: enter, transform: `translateY(${(1 - enter) * 18}px)` }}><div style={{ position: 'relative', zIndex: 2, width: 36, height: 36, borderRadius: 99, background: i === 3 ? palette.mintDark : '#e4f2ed', color: i === 3 ? 'white' : palette.mintDark, border: '4px solid white', display: 'grid', placeItems: 'center' }}>{i === 3 ? <Lock size={13} /> : <Check size={13} />}</div><div><div style={{ fontSize: 10.5, fontWeight: 720 }}>{event.title}</div><div style={{ marginTop: 3, color: palette.muted, fontSize: 8.5 }}>{event.type} · source snapshot retained</div></div><div style={{ textAlign: 'right' }}><div style={{ fontFamily: mono, fontSize: 8.5, fontWeight: 700 }}>{event.time}</div><div style={{ marginTop: 4, fontFamily: mono, color: palette.muted, fontSize: 7.5 }}>84f3…{i === 3 ? 'c91a' : `a${i}7e`}</div></div></div>
            })}
          </div>
        </div>
        <div style={{ borderRadius: 22, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.055)', color: 'white', padding: 25, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div style={{ fontFamily: mono, color: palette.mint, fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '.12em' }}>Audit-ready award</div><BadgeCheck size={18} color={palette.mint} /></div>
            <div style={{ marginTop: 22, display: 'grid', placeItems: 'center' }}>
              <div style={{ width: 124, height: 124, borderRadius: 999, display: 'grid', placeItems: 'center', color: palette.navy, background: palette.mint, boxShadow: `0 0 0 12px rgba(120,216,196,.1), 0 0 45px rgba(120,216,196,.3)`, transform: `scale(${0.68 + lockSpring * .32}) rotate(${(1 - lockSpring) * -8}deg)`, opacity: lockSpring }}><Lock size={45} strokeWidth={1.5} /></div>
            </div>
            <div style={{ marginTop: 24, textAlign: 'center', fontFamily: display, fontSize: 28, letterSpacing: '-.035em', opacity: lockSpring }}>Decision record locked.</div>
            <div style={{ marginTop: 10, textAlign: 'center', color: 'rgba(255,255,255,.5)', fontSize: 9.5, lineHeight: 1.5, opacity: lockSpring }}>100% cited evidence · human approvals complete<br />chronology and source snapshots sealed</div>
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
  const line = clamp(frame, [16, 82], [0, 1])
  const logo = spring({ frame: frame - 24, fps, config: { damping: 16, stiffness: 88 } })
  const headline = spring({ frame: frame - 54, fps, config: { damping: 19, stiffness: 95 } })
  const cta = clamp(frame, [108, 146], [0, 1])
  return (
    <Scene duration={230} background={palette.lavender} fadeOut={0}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(circle at 50% 32%, rgba(255,255,255,.84), transparent 34%), linear-gradient(rgba(33,0,61,.038) 1px,transparent 1px),linear-gradient(90deg,rgba(33,0,61,.038) 1px,transparent 1px)', backgroundSize: 'auto, 46px 46px, 46px 46px' }} />
      <svg viewBox="0 0 1280 720" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <path d="M-80 550 C160 420 290 580 450 390 S720 190 860 350 S1070 520 1360 310" fill="none" stroke="rgba(33,0,61,.12)" strokeWidth="2" />
        <path d="M-80 550 C160 420 290 580 450 390 S720 190 860 350 S1070 520 1360 310" fill="none" stroke={palette.mintDark} strokeWidth="4" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - line} />
      </svg>
      {[{ x: 255, y: 493, delay: 26 }, { x: 454, y: 386, delay: 42 }, { x: 856, y: 346, delay: 58 }, { x: 1092, y: 430, delay: 74 }].map((node, i) => {
        const enter = clamp(frame, [node.delay, node.delay + 15], [0, 1])
        return <div key={i} style={{ position: 'absolute', left: node.x, top: node.y, width: 13, height: 13, borderRadius: 99, background: i === 3 ? palette.plum : palette.mint, border: '3px solid rgba(255,255,255,.85)', boxShadow: `0 0 0 ${enter * 9}px rgba(120,216,196,.12)`, transform: `scale(${enter})` }} />
      })}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 82, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - logo) * 20}px)`, opacity: logo }}><TraceliMark dark /></div>
      <div style={{ position: 'absolute', left: 130, right: 130, top: 169, textAlign: 'center', transform: `translateY(${(1 - headline) * 44}px)`, opacity: headline }}>
        <div style={{ color: palette.plum, fontFamily: display, fontSize: 79, lineHeight: .96, letterSpacing: '-.055em' }}>The portal runs the tender.</div>
        <div style={{ marginTop: 8, color: palette.plum, fontFamily: display, fontSize: 79, lineHeight: .96, letterSpacing: '-.055em' }}>Traceli keeps the proof.</div>
        <div style={{ marginTop: 29, color: 'rgba(33,0,61,.58)', fontSize: 15 }}>Every rule, bid, question, approval and risk signal—linked.</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 82, display: 'flex', justifyContent: 'center', opacity: cta, transform: `translateY(${(1 - cta) * 15}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 23, borderRadius: 13, background: palette.plum, color: 'white', padding: '15px 20px 15px 23px', boxShadow: '0 14px 35px rgba(33,0,61,.18)', fontSize: 11.5, fontWeight: 720 }}>Bring one completed tender <span style={{ width: 29, height: 29, display: 'grid', placeItems: 'center', borderRadius: 99, background: palette.mint, color: palette.plum }}><ArrowRight size={15} /></span></div>
      </div>
      <Disclosure />
    </Scene>
  )
}

export function TraceliFilm() {
  return (
    <AbsoluteFill style={{ background: palette.navy, fontFamily: sans }}>
      <Sequence from={0} durationInFrames={145}><IntroScene /></Sequence>
      <Sequence from={130} durationInFrames={190}><DashboardScene /></Sequence>
      <Sequence from={305} durationInFrames={195}><EvidenceScene /></Sequence>
      <Sequence from={485} durationInFrames={220}><HumanReviewScene /></Sequence>
      <Sequence from={690} durationInFrames={205}><ApprovalScene /></Sequence>
      <Sequence from={880} durationInFrames={225}><AuditScene /></Sequence>
      <Sequence from={1090} durationInFrames={230}><OutroScene /></Sequence>
    </AbsoluteFill>
  )
}
