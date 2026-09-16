# YC Software QM assessment for Trace-li

Reviewed 15 September 2026 at commit `1cdad4c49e76ad679306355bad60d0a25a98bf6e`. Public source was read in an isolated checkout; no QM installer, model, connector, sandbox or deployment was started. This is a fit assessment, not an independent security certification or a live integration test.

## Recommendation

Keep Trace-li's HQ contracts and reviewed memory as the company authority. Evaluate QM as a replaceable worker runtime once a single cloud job is justified. Its interfaces are worth using as a design reference now. Adopting the whole application is not needed to extend the existing Postgres foundation.

QM's [README](https://github.com/yc-software/qm/blob/1cdad4c49e76ad679306355bad60d0a25a98bf6e/README.md) describes scoped personal/shared workspaces, Slack and web surfaces, swappable harnesses including Codex, Postgres persistence and background work. Those capabilities align with the requested company feed and durable mandate model. Its license is MIT except where otherwise noted; any future source reuse must retain applicable notices.

## Useful fit and remaining work

| Trace-li requirement | What the inspected source offers | Trace-li integration requirement |
|---|---|---|
| Scoped memory | [Provider routing](https://github.com/yc-software/qm/blob/1cdad4c49e76ad679306355bad60d0a25a98bf6e/docs/memory-providers.md) separates recall, explicit writes and automatic capture; external providers can have separate read/write credentials. | Map authenticated QM scopes to our tenant/mandate IDs. Company recall should use a read-only provider with automatic capture off, no direct write operation, and explicit failure behavior. |
| Worker replacement and durable execution | [Swarm documentation](https://github.com/yc-software/qm/blob/1cdad4c49e76ad679306355bad60d0a25a98bf6e/docs/swarms.md) describes worker identities, transcripts, budgets, durable reservations and new blank computers. | Publish the charter before assigning one worker. Supply only its input bundle and scoped broker capability. A replacement inherits the mandate's approved records, not another worker's credentials. |
| Recoverable jobs | [Postgres run store](https://github.com/yc-software/qm/blob/1cdad4c49e76ad679306355bad60d0a25a98bf6e/src/runs/postgres-run-store.ts) uses leases and locked queue claims. | Bind one QM run to one HQ attempt and deduplication key. A runtime terminal response is a submitted output; Trace-li review still decides acceptance. Avoid two schedulers dispatching the same job. |
| Versioned memory | [Postgres memory service](https://github.com/yc-software/qm/blob/1cdad4c49e76ad679306355bad60d0a25a98bf6e/src/memory/postgres-memory-service.ts) implements revisions and conditional replacement. | Keep Supervisor review and Librarian promotion in the HQ broker. QM's notebook and company canonical memory have different authority. |
| Shared learning | [Scratch promotion strategy](https://github.com/yc-software/qm/blob/1cdad4c49e76ad679306355bad60d0a25a98bf6e/src/memory/strategies/scratch-promote.ts) includes automated capture and model-curated notebook updates. | Do not point automatic promotion at canonical Company Memory. Workers submit proposals with sources and expected versions. |

## Approval and security implications

The pinned [security policy](https://github.com/yc-software/qm/blob/1cdad4c49e76ad679306355bad60d0a25a98bf6e/SECURITY.md) explicitly calls QM early and experimental. It targets authenticated internal organizations, and identifies limits including bypassable shell-command classification, browser actions outside some central approval gates, plaintext credentials while in use, and incomplete organization-wide kill-switch/governance controls.

Consequently, a QM posture setting cannot substitute for Trace-li's Red approval boundary. Start with no outbound, production, spending or customer credentials in the worker. Enforce allowed effects through narrow server tools and least-privilege credentials. Keep approval decisions outside agent-reachable APIs. A future trial needs deployment-specific review, especially for browsers, egress, retention and any shared scope.

## Smallest useful trial

Use one Builder worker, one fictional Trace task, one isolated scope, one short lease and an explicit model/sandbox cost cap. Give it read-only approved Company Memory and its assigned inputs, plus a proposal/submission tool. Test restart recovery, duplicate dispatch, expired-lease submission, cross-scope reads, attempted canonical writes and a rejected external action. The output must reach the existing review queue with its artifact hash and evidence.

Only after that passes should one eligible job class move from the existing desktop desk to QM. Leave other schedules intact until each has an explicit owner and cutover. Cloud storage and a cloud worker are separate requirements; QM still requires deployment configuration, authenticated providers and operational responsibility. No AWS resources or new paid service were provisioned by this assessment.
