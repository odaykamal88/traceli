import type { Metadata } from 'next'
import s from '../product.module.css'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Workspace settings for Traceli.',
  robots: { index: false, follow: false },
}

export default function WorkspaceSettingsPage() {
  return (
    <section className={s.screen} aria-labelledby="settings-title">
      <p className={s.eyebrow}>Settings</p>
      <h1 id="settings-title" className={s.hero}>Workspace settings</h1>
      <p className={s.heroHelp}>
        Roles, tenant provisioning and starter-pack onboarding will live here.
        They are not part of this Rule library release.
      </p>
      <div className={s.card} style={{ padding: '24px 26px' }}>
        <h2 className={s.title}>Coming later</h2>
        <p className={s.muted} style={{ marginTop: 10, maxWidth: '48ch' }}>
          Starter-pack onboarding is a known follow-on. For now, add packs from the Trace catalog
          or upload your own from Rule library.
        </p>
      </div>
      <p className={s.demoNote}>Workspace · Fictional data</p>
    </section>
  )
}
