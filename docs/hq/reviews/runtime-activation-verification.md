# Runtime connection verification

Supervisor · 15 September 2026 · Operating Room task #44.

The existing six schedules are ACTIVE and now read the visible HQ handoff and relevant charters. A before/after comparison confirmed that only prompt text and the configuration update timestamp changed: IDs, cadence, target, model, execution environment and notification settings are preserved. The old one-off continuation remains paused.

The connection was manually exercised against the owner-private Operating Room with a fresh credential held only in process memory. Its ignored status snapshot contains schedule metadata, counts, review task IDs and dates/outcomes. This verifies the bridge; it does not establish a scheduled run after the prompt amendment. The prior task lease expired during the interrupted session; finalization must re-read and acquire a fresh lease before submitting the packet.

## Checks completed

- Seven focused exporter tests pass: fresh and cached minimization, enabled-versus-result distinction, paused configuration, failed authentication retaining the old evidence timestamp, fractional timestamp ordering, expired claims, exact live-origin restriction, malformed outbox/cached shapes.
- Type checking and production build pass in the isolated HQ checkout.
- Browser at 1440×1000 and 390×844 renders the updated banner and connected handoff status without horizontal overflow or browser errors.
- The production `/hq` route returns 404 before records are read; production `/` returns 200. An attempted document traversal returns 404.
- All eight current charters and the constitution have explicit v1.1 activation amendments. Historical v1.0 bytes are retained under `history/bootstrap-2026-09-14`.
- The original workspace has the same current docs and installed exporter. No application dependency or production database change was needed for the bridge.

## Independent review and disposition

The [independent Auditor review](runtime-activation-review.md) identified four exporter defects and a charter-state conflict. Supervisor corrected all five findings and added focused regression checks. The Auditor's turn then hit its usage limit before recording a final retest; its interim report remains unchanged. This file records Supervisor verification, not a fabricated independent final approval. The task is submitted for review with the exact files and checks; it is not self-accepted.

## Remaining limits

HQ is a development-only reader. Existing local schedules need the computer and desktop app available. The browser refreshes saved status; only a supervised or scheduled desk run refreshes the evidence from the room. Customer sends/replies are still needed for the Week 4 buyer baseline. No new agent timer, publication, send, spending, production deployment or customer-data expansion was enabled.
