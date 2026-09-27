'use client'

import { useId, useState, type FocusEvent, type RefObject } from 'react'

import {
  decisionIssue,
  checklistRowVisible,
  incompleteCorrectionCount,
  openItemCount,
  reviewerActions,
  type ReviewerAction,
  type ReviewerDecision,
  type UploadChecklist,
} from '@/lib/desk/review'

import s from './desk.module.css'

const actionLabels: Record<ReviewerAction, string> = {
  confirm: 'Confirm as extracted',
  present: 'Mark present',
  negative: 'Mark negative',
  stated_absent: 'Mark stated absent',
  missing: 'Leave missing',
}

function stateLabel(state: UploadChecklist['rows'][number]['state']) {
  if (state === 'present') return 'Present'
  if (state === 'negative') return 'Negative'
  return 'Missing'
}

export default function DeskChecklist({
  checklist,
  decisions,
  freezing,
  error,
  headingRef,
  onDecision,
  onFreeze,
  freezeDisabled = false,
  readOnly = false,
}: {
  checklist: UploadChecklist
  decisions: ReviewerDecision[]
  freezing: boolean
  error: string | null
  headingRef: RefObject<HTMLHeadingElement | null>
  onDecision: (key: string, patch: Partial<ReviewerDecision>) => void
  onFreeze: () => void
  freezeDisabled?: boolean
  readOnly?: boolean
}) {
  const filterId = useId()
  const [openOnly, setOpenOnly] = useState(false)
  const [activeCorrectionKey, setActiveCorrectionKey] = useState<string | null>(null)
  const openCount = openItemCount(checklist.rows, decisions)
  const incompleteCount = incompleteCorrectionCount(checklist.rows, decisions)
  const byKey = new Map(decisions.map(decision => [decision.key, decision]))
  const issues = checklist.rows.flatMap(row => {
    const decision = byKey.get(row.key)
    if (!decision) return []
    const issue = decisionIssue(row.title, decision)
    return issue ? [issue] : []
  })

  return (
    <section className={s.checklist} aria-labelledby="checklist-title" data-testid="checklist">
      <div className={s.sectionHead}>
        <h2 id="checklist-title" ref={headingRef} tabIndex={-1}>Checklist</h2>
        <span className={s.sub} data-testid="open-items" aria-live="polite">
          {openCount === 0 ? 'No open items' : `${openCount} open ${openCount === 1 ? 'item' : 'items'}`}
          {incompleteCount > 0 ? ` · ${incompleteCount} incomplete ${incompleteCount === 1 ? 'edit' : 'edits'}` : ''}
        </span>
        <button
          className={s.primary}
          type="button"
          onClick={onFreeze}
          disabled={freezing || issues.length > 0 || freezeDisabled || readOnly}
          aria-busy={freezing}
          data-testid="freeze-checklist"
        >
          {freezing ? 'Working…' : 'Freeze assessment'}
        </button>
      </div>
      <p className={s.lead}>
        Check every pack row before Trace-li freezes the assessment. Open items are rows the packet did not yield. Confirm the extract, or mark what the file actually says. A page number is required when you mark an item present, negative, or stated absent.
      </p>
      <p className={s.help}>
        {checklist.rows.length} checklist {checklist.rows.length === 1 ? 'row' : 'rows'} · {checklist.fileName} · {checklist.packName}
      </p>
      <div className={s.checklistFilter}>
        <input
          id={filterId}
          type="checkbox"
          checked={openOnly}
          onChange={event => setOpenOnly(event.target.checked)}
        />
        <label htmlFor={filterId}>Show open items only</label>
      </div>
      {error ? <p className={s.alert} role="alert">{error}</p> : null}
      <ol className={s.checklistRows}>
        {checklist.rows.map(row => {
          const decision = byKey.get(row.key)
          if (!decision) return null
          const hidden = !checklistRowVisible(openOnly, row, decision, activeCorrectionKey)
          const issue = decisionIssue(row.title, decision)
          const fieldId = `checklist-${row.key.replaceAll('.', '-')}`
          return (
            <li
              key={row.key}
              className={s.checklistRow}
              hidden={hidden}
              data-field={row.key}
              onFocusCapture={() => setActiveCorrectionKey(row.key)}
              onBlurCapture={(event: FocusEvent<HTMLLIElement>) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setActiveCorrectionKey(null)
              }}
            >
              <div className={s.checklistSummary}>
                <h3>{row.title}</h3>
                <p className={s.key}>{row.key}</p>
                <p className={s.checklistMeta}>
                  <span className={s.badge}>{stateLabel(row.state)}</span>
                  {row.open ? <span className={s.tagGap}>Open item</span> : <span className={s.badge}>Extracted</span>}
                </p>
                <dl className={s.checklistFacts}>
                  <div>
                    <dt>Value</dt>
                    <dd>{row.valueText}</dd>
                  </div>
                  <div>
                    <dt>Page</dt>
                    <dd>{row.page ?? 'No page on the extract'}</dd>
                  </div>
                  <div>
                    <dt>Quote</dt>
                    <dd>{row.quote ?? 'No quote on the extract'}</dd>
                  </div>
                </dl>
              </div>
              <fieldset className={s.checklistActions} disabled={freezing || readOnly}>
                <legend className={s.fieldLabel}>What should this row say?</legend>
                {reviewerActions.map(action => (
                  <label key={action} className={`${s.radioOption} ${decision.action === action ? s.radioSelected : ''}`}>
                    <input
                      type="radio"
                      name={`${fieldId}-action`}
                      value={action}
                      checked={decision.action === action}
                      onChange={() => onDecision(row.key, { action })}
                    />
                    <span className={s.optLabel}>{actionLabels[action]}</span>
                  </label>
                ))}
                {decision.action === 'present' ? (
                  <div className={s.checklistInputs}>
                    <label htmlFor={`${fieldId}-value`}>
                      Value
                      <input
                        id={`${fieldId}-value`}
                        className={s.textInput}
                        value={decision.value}
                        onChange={event => onDecision(row.key, { value: event.target.value })}
                        maxLength={4000}
                        placeholder={row.expectsBoolean ? 'true or false' : 'Value from the file'}
                        required
                      />
                    </label>
                    <label htmlFor={`${fieldId}-page`}>
                      Page
                      <input
                        id={`${fieldId}-page`}
                        className={s.textInput}
                        inputMode="numeric"
                        value={decision.page}
                        onChange={event => onDecision(row.key, { page: event.target.value })}
                        maxLength={5}
                        placeholder="Page number"
                        required
                      />
                    </label>
                    <label htmlFor={`${fieldId}-quote`}>
                      Quote or pointer
                      <textarea
                        id={`${fieldId}-quote`}
                        className={s.textarea}
                        value={decision.quote}
                        onChange={event => onDecision(row.key, { quote: event.target.value })}
                        maxLength={500}
                        rows={3}
                        required
                      />
                    </label>
                  </div>
                ) : null}
                {decision.action === 'negative' ? (
                  <div className={s.checklistInputs}>
                    <label htmlFor={`${fieldId}-note`}>
                      Note
                      <textarea
                        id={`${fieldId}-note`}
                        className={s.textarea}
                        value={decision.note}
                        onChange={event => onDecision(row.key, { note: event.target.value })}
                        maxLength={500}
                        rows={3}
                        required
                      />
                    </label>
                    <label htmlFor={`${fieldId}-page`}>
                      Page
                      <input
                        id={`${fieldId}-page`}
                        className={s.textInput}
                        inputMode="numeric"
                        value={decision.page}
                        onChange={event => onDecision(row.key, { page: event.target.value })}
                        maxLength={5}
                        placeholder="Page number"
                        required
                      />
                    </label>
                    <label htmlFor={`${fieldId}-quote`}>
                      Quote, if you have one
                      <textarea
                        id={`${fieldId}-quote`}
                        className={s.textarea}
                        value={decision.quote}
                        onChange={event => onDecision(row.key, { quote: event.target.value })}
                        maxLength={500}
                        rows={2}
                      />
                    </label>
                  </div>
                ) : null}
                {decision.action === 'stated_absent' ? (
                  <div className={s.checklistInputs}>
                    <label htmlFor={`${fieldId}-quote`}>
                      Quote
                      <textarea
                        id={`${fieldId}-quote`}
                        className={s.textarea}
                        value={decision.quote}
                        onChange={event => onDecision(row.key, { quote: event.target.value })}
                        maxLength={500}
                        rows={3}
                        required
                      />
                    </label>
                    <label htmlFor={`${fieldId}-page`}>
                      Page
                      <input
                        id={`${fieldId}-page`}
                        className={s.textInput}
                        inputMode="numeric"
                        value={decision.page}
                        onChange={event => onDecision(row.key, { page: event.target.value })}
                        maxLength={5}
                        placeholder="Page number"
                        required
                      />
                    </label>
                  </div>
                ) : null}
                {issue ? <p className={s.help} role="status">{issue}</p> : null}
              </fieldset>
            </li>
          )
        })}
      </ol>
      <div className={s.checklistBar}>
        <p>
          {openCount === 0 ? 'No open items' : `${openCount} open ${openCount === 1 ? 'item' : 'items'}`}
          {incompleteCount > 0 ? ` · ${incompleteCount} incomplete ${incompleteCount === 1 ? 'edit' : 'edits'}` : ''}
        </p>
        <button
          className={s.primary}
          type="button"
          onClick={onFreeze}
          disabled={freezing || issues.length > 0 || freezeDisabled || readOnly}
          aria-busy={freezing}
        >
          {freezing ? 'Working…' : 'Freeze assessment'}
        </button>
      </div>
      {issues.length > 0 ? (
        <p className={s.help}>Add the missing page, value, or quote before freezing. Rows you leave as extracted need nothing else.</p>
      ) : (
        <p className={s.help}>Freezing writes the assessment. You record the disposition after that. Rows left as extracted stay on the extract.</p>
      )}
    </section>
  )
}
