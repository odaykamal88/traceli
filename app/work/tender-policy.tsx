'use client'

import { useEffect, useId, useState } from 'react'
import { getTenderPolicies, type TenderPolicyAcceptance } from '@/lib/tenders/client'
import type { TenderRetentionPolicy } from '@/lib/tenders/contract'
import s from '@/app/desk/desk.module.css'

export function TenderPolicyDisclosure({ policy, expiresAt }: { policy: TenderRetentionPolicy; expiresAt?: string }) {
  return <div>
    <p><strong>{policy.classification === 'synthetic' ? 'Synthetic demonstration' : 'Sanitized customer documents'}</strong>{expiresAt ? ` · expires ${new Date(expiresAt).toLocaleString()}` : ` · ${policy.retentionDays} days of retention`}</p>
    <p className={s.help}>{policy.description}</p>
    <p className={s.help}>{policy.providerDisclosure}</p>
    <p className={s.help}>Traceli does not retain source file bytes. Access to extracted evidence, quotes, review decisions, issued records and manual metadata ends at expiry. Expired records are queued for removal by the next successful daily cleanup. Backup copies follow the hosting provider’s retention. Keep your original files separately.</p>
    <details><summary>Processing notice details</summary><p className={s.help}>Policy version: {policy.version}. Acknowledging this notice does not establish a legal agreement with a processor.</p></details>
  </div>
}

export default function TenderPolicyChoice({ disabled, onChange }: { disabled: boolean; onChange: (value: TenderPolicyAcceptance | null) => void }) {
  const group = useId()
  const [policies, setPolicies] = useState<TenderRetentionPolicy[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [selected, setSelected] = useState<TenderRetentionPolicy | null>(null)
  const [consent, setConsent] = useState(false)
  useEffect(() => {
    let active = true
    getTenderPolicies().then(result => { if (active) setPolicies(result.policies) })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'The retention policy could not be loaded.') })
    return () => { active = false }
  }, [attempt])
  function choose(policy: TenderRetentionPolicy) {
    setSelected(policy); setConsent(false); onChange(null)
  }
  return <fieldset disabled={disabled}>
    <legend>Documents and retention</legend>
    {policies === null && !error ? <p className={s.help} role="status">Loading the workspace policy…</p> : null}
    {error ? <p className={s.alert} role="alert">{error} <button className={s.secondary} type="button" onClick={() => { setError(null); setAttempt(value => value + 1) }}>Retry policy</button></p> : null}
    {policies?.map(policy => <label className={s.radioOption} key={policy.version}><input type="radio" name={group} checked={selected?.version === policy.version} onChange={() => choose(policy)} />{policy.classification === 'synthetic' ? 'Synthetic demonstration — no real customer data' : 'Sanitized customer documents'}</label>)}
    {policies && !policies.some(policy => policy.classification === 'customer') ? <p className={s.help}>Customer uploads are unavailable until your organization’s retention and processor settings are configured.</p> : null}
    {selected ? <><TenderPolicyDisclosure policy={selected} /><label className={s.radioOption}><input type="checkbox" checked={consent} onChange={event => { const accepted = event.target.checked; setConsent(accepted); onChange(accepted ? { classification: selected.classification, policyVersion: selected.version, consent: true } : null) }} />I understand this retention and processing notice and will upload only {selected.classification === 'synthetic' ? 'synthetic demonstration files' : 'irreversibly sanitized customer material authorized for this processing route'}.</label></> : null}
  </fieldset>
}
