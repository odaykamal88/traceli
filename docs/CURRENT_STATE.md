# Trace-li current state

Reconciled 27 September 2026. This is a dated evidence register, not an instruction to dispatch work. Refresh external state before releasing or selecting a task. Historical reviewed artifacts retain their original bytes and dates.

## Production and source

`www.trace-li.com` serves Vercel deployment `dpl_DBJpaKLEHweCJ9UuokCsV6rx9yvG`, READY, production, created 25 September. Its Git commit is main [`09c8ae2e5300982fba87c52788e6594d61d6a9a3`](https://github.com/odaykamal88/traceli/commit/09c8ae2e5300982fba87c52788e6594d61d6a9a3), the merge of [pilot-report PR #59](https://github.com/odaykamal88/traceli/pull/59). This was confirmed through the authenticated Vercel CLI; the connector alone could not establish it.

Production Trace mode is `workos`. WorkOS and extraction configuration keys are present; credential values are not recorded here. The sensitive `TRACE_EXTRACTION_PROVIDER` value was not returned, so the effective production provider remains **unverified**. A credential's presence, the code's mock default, or a historical rehearsal does not resolve that unknown. Production `/hq` is unavailable; private HQ is a separate preview with its own bindings.

[Main CI](https://github.com/odaykamal88/traceli/actions/runs/36148032111) passed on 25 September. [Production smoke](https://github.com/odaykamal88/traceli/actions/runs/36312380118) passed on 27 September. Public smoke covers main routes, redirects, film ranges and anonymous access refusals; it does not prove the authenticated upload/hub/report journey works.

## Product register

| Surface | Implemented at this baseline | Boundary / next evidence |
| --- | --- | --- |
| `/` and `/demo` | Six-week, one-file pilot offer; 52-second film; fictional Award desk, disposition and frozen record | Public fictional request-evidence journey reached verified freeze in the 27 September browser review. |
| `/method` | Eight fictional evidence/policy/human-review scenarios | No live model calls or real award decisions. |
| `/login`, `/desk` | Invitation-based WorkOS entry; packet extraction; one selected donor pack; assessment, human disposition and pilot PDF | Live login redirect observed. Authenticated end-to-end journey remains to be verified for this release. |
| `/hub`, `/hub/tender` | Tender setup, four seeded packs, optional manual metadata | One selected pack is evaluated. Manual bytes/rules are not retained/compiled. |
| Field Registry | Typed values and provenance, deterministic checks, present/missing/negative states, snapshot and pack hashes | New desk freezes remain in browser session storage, without durable server records. Hash validation is not server issuance. |
| `/workspace/trace` | Separate tenant-scoped Postgres workflow with synthetic source versions, decisions and export | Has not converged with the newer upload-desk records. |
| Donor packs | Global Fund, FCDO-prime, UNFPA and OCHA CBPF public-control synthesis | Not official manuals or a complete donor interpretation. Screening-evidence checks are not live sanctions screening. |
| `/cases` and JSON | Three published founder rehearsal freezes; three fixtures awaiting freeze | Institutional findings and synthetic rehearsal evidence remain distinct. |
| Research | Global Fund, UNFPA and OCHA notes plus existing Insights articles | Source-qualified research is not customer validation or proof of prevention. |
| Agent/MCP access | Read-only contract and bounded synthetic integrations | No verified public MCP buyer-agent integration. |

## Extraction and customer readiness

The [checked-in extraction report](../eval/extraction/reports/ground-truth-comparison.md) measured local-text replay over ten synthetic packets: 1/144 present fields found, 143/144 falsely missing, 0/113 falsely present. Held-out present fields found: 0/43. **Talonic was not called.** Preserve this distinction when discussing model or product quality.

Founder rehearsals also remain bounded: Global Fund mapped zero pack fields (22 findings), OCHA zero (20 findings), Sudan four of 27 keys (one negative, three stated absent; 26 findings). All requested evidence. A valid freeze does not establish useful extraction accuracy.

Next readiness work is measured held-out extraction performance, a source-linked reviewer workflow, explicit role/exception authority, and durable tenant-scoped records with transactional audit and authorized export. The newer desk currently accepts recognized Trace roles and uses a session waiver stub. Customer custody, scanning, retention/deletion and approved provider disclosure require their own verification; do not infer them from WorkOS sign-in or a successful PDF.

## Open-change dispositions

| PR / work | Reconciliation disposition |
| --- | --- |
| [#57 Case Card readability](https://github.com/odaykamal88/traceli/pull/57) | Retain the simplified view; correct wording that could turn rehearsal gaps into historical pre-signature facts. Keep the full rehearsal qualification visible. Updated with qualified wording and full ledes; 17 tests, typecheck, production build and desktop browser checks passed. Awaiting merge/release review. |
| [#60 reviewer checklist](https://github.com/odaykamal88/traceli/pull/60) | Reconcile with current main and the #59 PDF route. Preserve original extraction provenance; use the reviewed snapshot for checks, disposition and PDF. Schema conflict resolved; 61 targeted tests, typecheck and production build passed. Local synthetic correction → freeze → judgment → PDF flow passed. Awaiting merge/release review. |
| [#61 cloud development](https://github.com/odaykamal88/traceli/pull/61) | Currently based on #60. Automatic database mutation removed from startup; four isolated safety checks passed. No full cloud boot is claimed. Development setup and product readiness are separate. |
| [#29 film source](https://github.com/odaykamal88/traceli/pull/29) | Partially integrated: MP4 is byte-identical to main, but Remotion source/render scripts remain unique. Preserve and reconcile reproducibility work before any closure. |
| [#20 Actions update](https://github.com/odaykamal88/traceli/pull/20) | Still unique: pnpm/action-setup 6.0.10 → 6.1.0. Keep for routine dependency validation. |
| [#9 dev dependencies](https://github.com/odaykamal88/traceli/pull/9) | Keep separate: includes TypeScript 5.7.3 → 7.0.2 and Node types 24 → 26. Green old checks alone do not justify a combined upgrade. |
| [#8 old editorial work](https://github.com/odaykamal88/traceli/pull/8) | Superseded-content candidate after the revised publication in #12; check unique source/approval provenance before closure. |

No row above claims a candidate is deployed or grants publication approval. See the [reconciliation validation record](reconciliation/VALIDATION_2026-09-27.md) for scope and limitations.

## Operating Room and HQ

Fresh source read on 27 September: **56 tasks: 23 done, 9 todo, 13 blocked, 10 review, 1 doing**. All recorded priorities are normal; there are no active claims. Pending owner reviews are tasks 19, 23, 26, 38, 44, 45, 46, 47, 49 and 50. The source has 144 receipts; its latest execution receipt is dated 21 September. Task counts are not effort-weighted completion or proof of customer readiness.

All six actual local desktop automation configurations are **PAUSED**. The Operating Room registry incorrectly displayed Active; all six labels were corrected to Paused with fresh reads and preservation of all task/review/metric/claim state. The [verified receipt](reconciliation/OPERATIONS_2026-09-27.json) records the bridge acknowledgement at 13:33:23 UTC; hosted HQ parity was not independently checked. The existing signed HQ mirror is the read view; the shared Operating Room database remains authoritative. A bounded Railway worker is a different runtime and does not mean desktop desks are active.

Owner tasks 28, 32, 34 and 35 were marked done on 21 September, while saved Week 4 counters still show zero. Preserve those owner decisions. Actual outreach/conversation denominators remain unresolved; zero counters do not establish no activity. Newer code and research do not automatically close source admission, benchmark or customer-evidence tasks.

## Preserved local work

The old `codex/publishing-assets` checkout was left intact at `be40b4b`. A private, Git-ignored recovery snapshot verifies 751 files and preserves staged/unstaged binary patches and a manifest for the root and nested `internal-ops` repository. It excludes ignored runtime/dependency data and does not publish credentials. Keep that snapshot local.

Comparing preserved files to main found 215 identical files, 28 different source/documentation files, 193 local-only source/documentation files and 315 local-only generated/recovery files. `internal-ops` is a separate nested repository and accounts for much of the local-only source; it must not be bulk-imported into the product repository.

- Retain the original staged work, historical research/approval records, source materials and generated assets for selective recovery.
- Restore missing standing owner instructions and the conditional tool backlog through this reconciliation.
- Local-only About, Contact, Privacy and Terms pages remain unpublished candidates. Review their content against the actual service before exposing them; this register does not treat them as live.
- Old homepage, demo, article and icon implementations must be compared against newer main before reuse.
- Local source inventories and publication drafts do not establish current task completion or permission to publish.

The full per-file comparison stays with the private recovery snapshot, avoiding a repository dump of unrelated personal/generated artifacts.
