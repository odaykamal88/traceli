# Independent runtime activation review

Risk / Auditor · 2026-09-15T06:55:59.396866+00:00 · Local read-only bridge review. No credentials were read and no live API, schedule or task was mutated by this reviewer.

**Interim result: revise pending correction checks.** The architecture keeps the HQ page read-only and preserves consequential-action gates. Four concrete exporter defects and one governing-document conflict were reported to Supervisor:

| Finding | Evidence / required correction |
|---|---|
| Cache minimization | A synthetic private sentinel in a previous version-1 room survived a failed fetch. Whitelist cached fields and receipt outcomes before retaining old evidence. |
| Chronological ordering | Same-second `...56Z` was selected over later `...56.9Z`. Compare parsed instants for latest receipts and claim expiry. |
| Exact source identity | The existing ops client accepts a localhost override. The actual exporter must reject that override before identifying the result as the owner-private room. |
| Malformed local evidence | An outbox file containing a JSON array raised AttributeError, preventing refresh. Count malformed shapes as unconfirmed; also validate the previous snapshot's top-level shape. |
| Current charter state | Historical charters say manual-only/loops disabled while the new handoff directs existing scheduled desks to use them. Add explicit dated precedence for the six existing bounded schedules without enabling new timers or Red actions. |

The first four existing unit tests passed, but the first two synthetic adversarial checks reproduced the cache and ordering defects; a separate temporary-outbox check reproduced malformed-shape failure. Fixes to cache projection, parsed-time comparison and exact source were subsequently inspected; final retest remains to be recorded.

## Verified boundaries

- `sync_runtime.py` calls the existing client with no request body, so the bridge requests reads. It exports aggregate counts, task IDs, known job identifiers, timestamps and allowlisted outcomes; it does not expose a send/approval/task mutation function. Error bodies and credentials are not persisted. The existing client's token is taken from process environment and passed through curl stdin rather than argv.
- Independently read minimized schedule metadata: all six named existing schedules are ACTIVE, use the stated cadences and include the HQ handoff reference. This establishes configuration, not successful execution after the amendment.
- The permitted saved snapshot was inspected: aggregate room state and dated receipt outcomes are distinct from schedule state. Its location is ignored by the original Git repository. The reviewer did not inspect lead rows, raw task descriptions, receipt bodies, hosting credentials or `.env` files.
- The page and runtime reader reject production before loading runtime records. RuntimeRefresh rereads the saved snapshot for a visible browser tab every 30 seconds; it does not run an agent. The UI distinguishes last settings check, room-read freshness, latest saved result and pending reviews. Two-hour/future-time freshness logic was inspected in source.
- Handoff preserves original Operating Room IDs, dependencies, lease protocol, at-most-two-task/45-minute limits, actual receipts, separate review and exact external approvals. It distinguishes existing local workers from cloud storage and gives real app-based pause instructions. It does not claim technical enforcement that the HQ page lacks.

## Limits and next owner

This independent review covers source, local configuration metadata, the already minimized saved snapshot and isolated tests. Browser/build and production-route execution checks belong to the Supervisor's parallel verification; no independent browser result is claimed here. Existing automation prompt preservation is based on current configurations and Supervisor's tool-update account; no prior/after prompt audit or successful post-amendment schedule execution is asserted.

Supervisor should apply fixes in the checkout, synchronize the installed exporter and current handoff to the original workspace, rerun focused tests and refresh the snapshot through the authorized existing path. Retest and hashes will be appended below before passing the bridge. Runtime status never authorizes publication, messages, commercial commitments, spend, customer-data expansion or production changes.
