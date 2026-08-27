import { ImageResponse } from 'next/og'

export const alt = 'Traceli — Prove the award before you sign it'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'stretch',
          background: 'linear-gradient(135deg, #061a33 0%, #0b2d49 58%, #0d3f51 100%)',
          color: '#fbf5ea',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'space-between',
          padding: '64px 72px',
          position: 'relative',
          width: '100%',
        }}
      >
        <div
          style={{
            backgroundImage:
              'linear-gradient(rgba(120,216,196,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(120,216,196,0.10) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            display: 'flex',
            inset: 0,
            maskImage: 'linear-gradient(to bottom right, transparent 15%, black 100%)',
            position: 'absolute',
          }}
        />
        <div style={{ alignItems: 'center', display: 'flex', gap: 18 }}>
          <div
            style={{
              alignItems: 'center',
              border: '1px solid rgba(139,225,207,0.65)',
              borderRadius: 12,
              display: 'flex',
              height: 44,
              justifyContent: 'center',
              transform: 'rotate(45deg)',
              width: 44,
            }}
          >
            <div style={{ background: '#78d8c4', borderRadius: 999, height: 9, width: 9 }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.24em' }}>TRACELI</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 980 }}>
          <div style={{ color: '#8be1cf', fontSize: 20, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Award assurance for donor-funded procurement
          </div>
          <div style={{ fontSize: 78, fontWeight: 600, letterSpacing: '-0.045em', lineHeight: 0.98, marginTop: 26 }}>
            Prove the award before you sign it.
          </div>
          <div style={{ color: 'rgba(251,245,234,0.68)', fontSize: 25, lineHeight: 1.4, marginTop: 28 }}>
            Connect the rule, evidence, human judgment and approval before donor review, complaint or audit.
          </div>
        </div>

        <div style={{ alignItems: 'center', color: 'rgba(251,245,234,0.55)', display: 'flex', fontSize: 18, justifyContent: 'space-between' }}>
          <span>No proof hidden in folders and email.</span>
          <span style={{ color: '#8be1cf', fontWeight: 700 }}>trace-li.com</span>
        </div>
      </div>
    ),
    size,
  )
}
