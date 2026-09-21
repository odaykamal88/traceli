'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  awardDeskScenario,
  awardDeskStorageKey,
  decisionCopy,
  sanitizeDisposition,
  type AwardDeskDisposition,
} from '@/lib/award-desk'
import { categoryLabel, packsShownOnRecord } from '@/lib/rule-library'
import { workspaceProductPaths } from '@/lib/workspace-product'
import s from '../product.module.css'

function readRecord(): AwardDeskDisposition | null {
  try {
    const raw = sessionStorage.getItem(awardDeskStorageKey)
    if (!raw) return null
    return sanitizeDisposition(JSON.parse(raw) as { decision: string; reason: string; governingPacks?: AwardDeskDisposition['governingPacks'] })
  } catch {
    return null
  }
}

export default function DecisionRecords() {
  const [recorded, setRecorded] = useState<AwardDeskDisposition | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setRecorded(readRecord())
    setReady(true)
  }, [])

  const copy = recorded ? decisionCopy(recorded.decision) : null
  const packs = recorded ? packsShownOnRecord(recorded.governingPacks) : []

  return (
    <section className={s.screen} aria-labelledby="records-title">
      <p className={s.eyebrow}>Decision records</p>
      <h1 id="records-title" className={s.hero}>What you can show a donor</h1>
      <p className={s.heroHelp}>
        When you record disposition on Award desk, this list freezes which packs applied.
        Turning a pack off later does not rewrite history.
      </p>
      {!ready ? (
        <p className={s.muted}>Loading records…</p>
      ) : recorded && copy ? (
        <article className={`${s.card} ${s.recordCard}`} data-testid="workspace-decision-record">
          <p className={s.eyebrow}>{awardDeskScenario.rfp}</p>
          <h2 className={s.title}>{awardDeskScenario.title}</h2>
          <p className={s.muted} style={{ marginTop: 6 }}>{copy.recordStatus}</p>
          <h3 className={s.eyebrow} style={{ marginTop: 22 }}>Governing packs at disposition</h3>
          {packs.length ? (
            <table className={s.packTable}>
              <thead>
                <tr>
                  <th>Pack</th>
                  <th>Version</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {packs.map(pack => (
                  <tr key={pack.id}>
                    <td>{pack.name}</td>
                    <td>{pack.version}</td>
                    <td>{categoryLabel(pack.category)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={s.muted}>No packs were marked to show on this record.</p>
          )}
          <p className={s.freezeNote}>Frozen at disposition. The live switchboard can change without rewriting this record.</p>
          <div style={{ marginTop: 18 }}>
            <Link className={`${s.btn} ${s.btnSecondary}`} href={workspaceProductPaths.awardRecord}>Open shareable record</Link>
          </div>
        </article>
      ) : (
        <div className={s.empty}>
          <strong>No disposition recorded in this tab yet</strong>
          Record a disposition on Award desk. The pack list freezes then.
          <br />
          <Link className={`${s.btn} ${s.btnPrimary} ${s.btnSm}`} href={workspaceProductPaths.awardPrep}>Open Award desk</Link>
        </div>
      )}
      <p className={s.demoNote}>Workspace · Fictional data · Kept in this browser tab</p>
    </section>
  )
}
