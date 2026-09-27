# Tender workspace delivery sprints

Started 27 September 2026 from main `2eae274`, following owner direction to deliver a more robust, navigable hub/desk experience with economical model allocation. The original publishing workspace remains preserved; implementation uses an isolated managed worktree.

## Product outcome

A reviewer can create a named tender, add evidence, pause, resume in another session, resolve cited gaps, record an authorized human decision, and reopen the exact saved record. My work is the eventual entry point; Knowledge hub is the reusable reference library; the desk is scoped to a tender. The path is Details → Evidence → Review → Decision → Record.

## Model and quota policy

The account usage tool reported 22% used / 78% remaining in the weekly window at the start. No separate short-window figure was returned. Quota is shared across the account; there is no reliable fixed quota percentage per sprint or per-model burn-rate forecast.

- GPT-6 Sol is the implementation default. Use medium effort for established patterns and high effort for storage, state restoration and permission-sensitive integration.
- GPT-6 Luna handles bounded UI corrections, focused regression checks, documentation and QA inventories with a precise brief. Move a task to Sol if evidence shows the narrower model is struggling; avoid repeated attempts.
- The coordinating advanced model handles scope, contracts and bounded security/release review. Do not run a second Astra agent for routine implementation or duplicate broad reviews.
- At most three workers run concurrently, each with distinct file ownership and a short task-specific context. Start dependent work only after its contract is settled. Agents do not recursively expand the team.
- Run targeted checks per change and one integrated validation pass per candidate. Repeat only for a new change, failure or unresolved risk. Keep all required security and database checks.
- Read actual account usage at sprint boundaries and adjust concurrency/scope from observed consumption. Preserve room for review and verification; do not assume that remaining quota translates into a guaranteed number of sprints.

This allocation follows [OpenAI model-selection guidance](https://developers.openai.com/api/docs/guides/model-selection); the exact callable versions are those exposed by the current Codex session.

## Delivery sequence

| Sprint | Outcome and scope | Owners | Exit criteria |
| --- | --- | --- | --- |
| 1 — Continuity and review blockers | Preserve tender/pack identity through navigation and restoration; expose existing local tenders honestly; make missing/unknown/save-failure states explicit; keep incomplete reviewer corrections visible. | Sol high: continuity. Luna medium: correction filter. Sol high concurrently prepares Sprint 2 contract. | Tender A/B and explicit-pack regressions pass; named tender survives hub return; no mismatched assessment restore; unfinished edits remain reachable; local-only saving is labelled. Tested draft PR, no production change. |
| 2 — Durable saved work | Tenant-scoped server records for tenders, versioned draft/checklist/reviewer edits, immutable server-issued decision records and source-reference snapshots. Authorized list/read/write/export, optimistic concurrency, save/retry states and deliberate migration of browser-local drafts. | Sol high implements against the agreed contract; coordinator performs a focused data/authorization review; Luna maintains fixtures and operator notes. | Resume across sessions; wrong-tenant/role/tender and tamper/replay/stale-version tests fail closed; writes and audit are atomic; failed saves are recoverable; old frozen case hashes remain valid. Additive migration verified on disposable DB. |
| 3 — My work and a clear workflow | Make a saved-tender list the signed-in entry point. Show status, owner and next action. Keep hub as library; place desk inside each tender with stable links. Select pack once; progressively reveal supporting detail. | Sol medium: integration and UI. Luna medium: copy, accessibility and state inventory. | Create, pause, find, reopen and continue without knowing a URL; empty/loading/error states; readable mobile layout and keyboard navigation; correct org/tender context on every route. Uses Sprint 2 saving, no pretend persistence. |
| 4 — Evidence-focused review and pilot readiness | Pair available source excerpts with review items, add next-unresolved navigation, preserve missing/negative distinctions and versioned references. Verify decision and export permissions plus end-to-end recovery. | Sol high: review integration. Luna medium: bounded regression/QA. Coordinator: one final security and release assessment. | Representative flow reaches saved decision/PDF; refresh and retry do not lose work or duplicate decisions; a second invited session can resume; meaningful extraction evaluation recorded. No customer-readiness claim from synthetic success alone. |

## Scope boundaries

Source file bytes are not automatically retained by this plan. A full page viewer depends on an explicit custody/storage/retention design; available extracted quotes can be used first. Manuals remain clearly reference-only until rules are compiled and verified. A session exception is not a formal organizational waiver. More donors, multi-pack evaluation, automatic manual interpretation and broad analytics follow a dependable core workflow.

Each sprint produces a small reviewable pull request with exact checks and limits. Implementation and draft PR creation are authorized. This plan does not automatically merge future PRs, migrate a live database, enable external file processing, resume paused automations or deploy customer-facing changes. Release actions follow concrete verification and the owner's applicable authorization.

## Current dispatch

- `s1_tender_continuity`: GPT-6 Sol, high effort — Sprint 1 implementation.
- `s1_checklist_filter`: GPT-6 Luna, medium effort — narrow review-blocker fix.
- `s2_persistence_contract`: GPT-6 Sol, high effort — precise schema/API/authorization plan, no database mutation.

Sprint 1 implementation is complete and prepared for draft PR review. The three dispatched workers have finished; they are not running later sprints in the background. The [Sprint 2 persistence contract](tender-workspace-persistence-plan.md) is ready for implementation after review. Later sprints are dependency-ordered delivery units; no calendar duration or quota guarantee is implied.

## Sprint 1 verification — 27 September 2026

- Hub/continuity: 12 tests passed. Upload/reviewer/pack alignment: 22 passed. Pilot report: 8 passed. Type checking and production build passed.
- Local browser, fixture identity and offline mock: created and reopened a named tender, returned through hub/header before upload, selected a fictional packet, extracted the checklist, corrected a missing row while open-only was enabled, kept incomplete inputs visible, retained focus through completion, and filtered the row only after Tab moved to the next item. Refresh retained the correction. The checklist had no horizontal overflow at 375 px and no captured browser warnings/errors.
- The browser held stale development components during live edits; a full refresh loaded the final components before the passing interaction checks. This is local synthetic verification, not an authenticated production or live extraction result.
- Added the hub/continuity regression command to CI. Server/database/production boundaries are unchanged; durable saving is still Sprint 2.
- End-of-implementation account usage: 26% used / 74% remaining weekly. This is an account-wide observation, not a measured per-agent or per-sprint charge. No reset credit was used.
