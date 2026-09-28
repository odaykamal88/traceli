# Tender workspace Sprint 3 verification

Verified 28 September 2026 on an isolated branch stacked on Sprint 2. All database and browser evidence below uses disposable, synthetic local fixtures. This is not a production or live WorkOS rehearsal.

## Delivered behavior

With `TRACELI_TENDER_WORKSPACES=1`, `/work` is My work, `/work/new` creates a tender, and `/work/[id]` opens that specific tender. `/hub` is the reusable library. Login, invitation, reset and account-switch use the fixed product entry; caller-supplied return paths do not become authority. Legacy desk/setup URLs redirect into the new routes. The flag remains off by default; legacy browser-local behavior remains available.

My work shows the authorized tender name, saved progress, owner and next action, with separate loading, empty and unavailable/retry states and bounded pagination. Owners are labelled “You” or a stable “Member” reference when a verified display name is unavailable. Server progress is derived from verified retained inputs and the current assessment/decision lineage, including stale or inconsistent state; historical record counts do not imply a current decision. Missing evidence and incomplete corrections remain distinct. An exception proposal is not approval.

Details, Evidence, Review, Decision and Record form the tender journey. Pack selection is carried from the library into creation. Optional manual, receipt and version details are disclosed progressively. Pending edits and failed saves change the current next action immediately.

## Automated evidence

| Check | Result |
| --- | --- |
| Tender HTTP/client-state, workflow progress, navigation destination and pending-draft regressions | 16 passed |
| Disposable Postgres integration suite, including tenant/role enforcement, stale pointers, tampered lineage, current progress and list query budget | 22 passed |
| AuthKit entry, invitation, reset, account-switch and fixed return paths | 18 passed |
| Hub/continuity regressions | 12 passed |
| Desk/reviewer regressions | 22 passed |
| Type checking | Passed |
| Production build, Next.js 16.3.5 | Passed |
| Whitespace/diff check | Passed |

The first integration run exposed timestamp-dependent comparison of pinned pack identity. The final implementation uses the normalized identity already used by server issuance; the passing integration run includes that fix. CI already runs the extended tender unit and Postgres suites. CI results are separate from these local results.

## Browser evidence

The local fixture used a fictional tender, a fictional packet and the Global Fund pack. No customer input or external extraction provider was used. Packet ingestion was prepared through the local API; the browser journey verified creation, receipt selection, review, saving, issuance and human decision.

- Created “Sprint 3 — fictional navigation review” from a library pack link, with the intended pack preselected and a stable tender URL.
- Saved a cited review correction, then deliberately rejected draft inserts for that one fixture tender. The page displayed an explicit failed-save state and a retry-oriented next action.
- An ordinary My work link opened the in-page confirmation. Initial focus was on Stay; Escape closed it and restored focus to the link. Stay preserved the text. Leave without waiting navigated successfully.
- Browser Back left the tender without this link dialog. My work → resume restored the exact unsaved correction after a fresh authorized read. With the injected failure removed, the restored edit saved as revision 4 and the recovery notice cleared.
- Issued an assessment from the Decision section and recorded Request evidence with a reason. My work then displayed “Human decision recorded”, owner “You”, and a link to that tender’s decision record.
- Temporarily denied list access in the disposable database. My work showed unavailable/retry rather than an empty list. Restoring access and clicking Retry recovered the saved tender and correct next action.
- My work and the tender fit at 375 × 812 CSS pixels without horizontal page overflow. After correcting anchor spacing, the Evidence heading remained below the sticky navigation.
- A fresh `/desk?tender=<id>` visit redirected to the canonical tender URL and reopened the saved correction and record. That fresh tab captured no browser errors or warnings. Earlier injected save/list failures produced expected errors.

The temporary failure trigger and permission denial were removed. Browser tabs were closed and the viewport restored after verification.

## Unsaved-edit boundary

The confirmation covers ordinary same-origin route links. Modified clicks, downloads, non-web/external links and same-page anchors retain their normal behavior. A `beforeunload` warning remains for closing or reloading; that native warning was not exercised in this sprint.

Browser history traversal is covered by short-lived recovery rather than a claimed universal navigation blocker. Pending checklist edits are retained only in JavaScript memory, scoped by organization, viewer and tender, for at most 30 minutes and eight tenders. Reopening requires a fresh authorized tender read and current edit permission. A newer server revision requires explicit conflict resolution; missing manual references are not silently discarded. A stale save acknowledgement cannot clear newer pending edits. Successful matching saves and explicit discard/reload clear the pending copy.

This recovery does not persist through a browser reload/close and does not cover every unsubmitted form, such as a decision reason. No source bytes or pending draft content are written to localStorage, sessionStorage or disk by this recovery mechanism.

## Remaining release evidence

- Real invited WorkOS sessions, including cross-session resume and account switching, were not exercised in this local fixture run.
- Keyboard checks covered the navigation confirmation and its focus restoration; this is not a complete assistive-technology audit. 200% zoom and the dialog changing state while a save finishes were not explicitly browser-tested.
- The unchanged PDF path is covered by database integration checks; browser PDF download was not repeated in Sprint 3.
- No production database migration, rollout flag activation, customer ingestion or merge is included. Source custody, retention, extraction accuracy and customer readiness retain the Sprint 2 limitations.
