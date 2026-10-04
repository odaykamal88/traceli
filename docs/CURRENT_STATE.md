# Trace-li current state

Reconciled 27 September 2026; tender workflow sections reconciled with main `ac03f2a` on 4 October 2026. This is a dated evidence register, not an instruction to dispatch work. Refresh external state before releasing or selecting a task. Historical reviewed artifacts retain their original bytes and dates.

## Saved tender workflow — reconciled 4 October 2026

This section was reconciled against code at main `ac03f2a687ec7ae5e9ce93bf36f4ef8a84f117da` and [the managed tender production flow](eng/TENDER_PRODUCTION_FLOW.md). No production system was queried on 4 October; every deployment statement below is a dated observation copied from that record.

### Current capability (code at `ac03f2a`)

- **Saved work.** With `TRACELI_TENDER_WORKSPACES=1`, `/work` is My work, `/work/new` creates a tender and `/work/[id]` opens it through Details → Evidence → Review → Decision → Record. With the flag unset, `/work` redirects to `/hub`. Sprints 1–3 merged on 28 September ([#63](https://github.com/odaykamal88/traceli/pull/63), [#64](https://github.com/odaykamal88/traceli/pull/64), [#66](https://github.com/odaykamal88/traceli/pull/66)), followed by the production flow, activation, live-acceptance and report-pagination changes ([#67](https://github.com/odaykamal88/traceli/pull/67)–[#71](https://github.com/odaykamal88/traceli/pull/71)).
- **Server-issued records.** Review revisions are append-only and concurrency-checked. Assessments, human judgments (Request evidence / Escalate) and exception proposals are issued by the server from the retained revision and packet receipt; browser-supplied records, hashes, actors or organization identifiers are not accepted. PDFs are rendered from the issued record and leave an export receipt. An exception proposal is not approval.
- **Identity and permissions.** Identity and current organization come from verified WorkOS membership. Directors and workspace admins act on any tender in their organization and alone may propose exceptions, grant/revoke access and delete managed tenders. Officers may create tenders and, with a `review` grant (given to the creator), save, assess and record judgments. Panel members may save reviews with a `review` grant but not issue records. Auditors read and export with an explicit grant. Inaccessible tenders return the same unavailable response.
- **Intake boundary.** Hosted intake requires the organization in `TRACELI_TENDER_ORGANIZATIONS`. Customer intake additionally requires `TRACELI_TENDER_CUSTOMER_ORGANIZATIONS`, exactly 30-day retention, a versioned policy and provider disclosure, and the Talonic provider; it accepts only irreversibly sanitized material. Otherwise only fictional fixtures are offered. Uploads are capped at 4 MB. Source file bytes are not retained.
- **Retention.** Each new tender pins its classification, pack, processing notice and an expiry 30 days after creation. At expiry application reads, writes and exports close; the daily `/api/cron/tender-retention` job removes the tender graph (at most 25 tenders per organization per run) and leaves a minimal receipt that expires after a further 30 days. Legacy tenders receive no expiry. Hosting backups, Talonic retention and downloads already taken are outside this policy.
- **Legacy and synthetic paths.** With the flag unset, `/desk` keeps assessment and freeze in browser session storage and `/hub` keeps manual labels/hashes in browser storage. `/workspace/trace` remains a separate synthetic Postgres workflow. These records have not been unified with saved work.

### Dated observed evidence (28 September 2026, not re-verified)

- Production WorkOS was activated for the real Traceli HQ organization, which was the only organization in the intake and retention allowlists, with the 30-day customer policy and a Talonic disclosure. `TRACELI_TENDER_WORKSPACES=1` was restored and a READY deployment was aliased to `www.trace-li.com`. Anonymous tender API requests returned 403, the unauthenticated retention endpoint 401 and `/work` 307; an authenticated retention run returned 200 with zero deletions.
- Live acceptance used the genuine public UNFPA Fiji RFQ 2024/024 solicitation through the production session and Talonic: saved revisions 1–2, an issued assessment, a Request evidence judgment and a verified four-page PDF. All 27 award controls remained missing, consistent with a solicitation that contains no bids. This verified the workflow, not extraction accuracy on completed bid or award evidence, and is not evidence of a customer relationship.
- After [#70](https://github.com/odaykamal88/traceli/pull/70) merged, its production build was recorded READY with PR, post-merge CI and production smoke passing. Hashes, identifiers and receipts are preserved in the [production flow record](eng/TENDER_PRODUCTION_FLOW.md).

### Remaining unknowns

- Production state after 28 September, including whether [#71](https://github.com/odaykamal88/traceli/pull/71) (report pagination) is deployed, the current flag/allowlist values and whether later retention runs succeeded.
- The cause of the first live upload's generic 400 response; a timeout was not established.
- Live extraction accuracy: no live benchmark run is recorded.
- Talonic retention, hosting-backup retention, document custody/scanning and processing agreements.
- Real invited multi-user sessions (second reviewer resume, account switching), 200% zoom and a full assistive-technology audit.
- Customer readiness, sanctions screening and donor approval are not established by any of the above. Missing evidence is not a negative finding.

## Approved merge follow-up

Later on 27 September, Oday approved merging the four reconciliation pull requests. [#57](https://github.com/odaykamal88/traceli/pull/57), [#60](https://github.com/odaykamal88/traceli/pull/60) and [#61](https://github.com/odaykamal88/traceli/pull/61) are merged into main at `18130e8bc513c0a862b85a4ec26bc831ca8e7132`. This baseline is delivered by [#62](https://github.com/odaykamal88/traceli/pull/62). The combined code passed 17 case-card and 8 pilot-report tests; the main-based cloud-startup branch passed [full CI](https://github.com/odaykamal88/traceli/actions/runs/36328378468). Final production deployment and smoke results are a separate post-merge verification; the deployment observation below is the earlier baseline.

## Production and source — before the approved merges

`www.trace-li.com` serves Vercel deployment `dpl_DBJpaKLEHweCJ9UuokCsV6rx9yvG`, READY, production, created 25 September. Its Git commit is main [`09c8ae2e5300982fba87c52788e6594d61d6a9a3`](https://github.com/odaykamal88/traceli/commit/09c8ae2e5300982fba87c52788e6594d61d6a9a3), the merge of [pilot-report PR #59](https://github.com/odaykamal88/traceli/pull/59). This was confirmed through the authenticated Vercel CLI; the connector alone could not establish it.

Production Trace mode is `workos`. WorkOS and extraction configuration keys are present; credential values are not recorded here. The sensitive `TRACE_EXTRACTION_PROVIDER` value was not returned, so the effective production provider remains **unverified**. A credential's presence, the code's mock default, or a historical rehearsal does not resolve that unknown. Production `/hq` is unavailable; private HQ is a separate preview with its own bindings.

[Main CI](https://github.com/odaykamal88/traceli/actions/runs/36148032111) passed on 25 September. [Production smoke](https://github.com/odaykamal88/traceli/actions/runs/36312380118) passed on 27 September. Public smoke covers main routes, redirects, film ranges and anonymous access refusals; it does not prove the authenticated upload/hub/report journey works.

## Product register

| Surface | Implemented at this baseline | Boundary / next evidence |
| --- | --- | --- |
| `/` and `/demo` | Six-week, one-file pilot offer; 52-second film; fictional Award desk, disposition and frozen record | Public fictional request-evidence journey reached verified freeze in the 27 September browser review. |
| `/method` | Eight fictional evidence/policy/human-review scenarios | No live model calls or real award decisions. |
| `/login`, `/desk` | Invitation-based WorkOS entry; packet extraction; one selected donor pack; cited reviewer checklist, assessment, human disposition and pilot PDF | Live login redirect observed. Authenticated end-to-end journey remains to be verified for this release. Since 28 September, the saved `/work` path supersedes this flow when its rollout flag is on (see the 4 October section above). |
| `/hub`, `/hub/tender` | Tender setup, four seeded packs, optional manual metadata | One selected pack is evaluated. Manual bytes/rules are not retained/compiled. |
| Field Registry | Typed values and provenance, deterministic checks, present/missing/negative states, snapshot and pack hashes | At this baseline, new desk freezes remained in browser session storage, without durable server records. Hash validation is not server issuance. Server-issued saved-work records were added on 28 September. |
| `/workspace/trace` | Separate tenant-scoped Postgres workflow with synthetic source versions, decisions and export | Has not converged with the newer upload-desk records. |
| Donor packs | Global Fund, FCDO-prime, UNFPA and OCHA CBPF public-control synthesis | Not official manuals or a complete donor interpretation. Screening-evidence checks are not live sanctions screening. |
| `/cases` and JSON | Three published founder rehearsal freezes; three fixtures awaiting freeze | Institutional findings and synthetic rehearsal evidence remain distinct. |
| Research | Global Fund, UNFPA and OCHA notes plus existing Insights articles | Source-qualified research is not customer validation or proof of prevention. |
| Agent/MCP access | Read-only contract and bounded synthetic integrations | No verified public MCP buyer-agent integration. |

## Extraction and customer readiness

The [checked-in extraction report](../eval/extraction/reports/ground-truth-comparison.md) measured local-text replay over ten synthetic packets: 1/144 present fields found, 143/144 falsely missing, 0/113 falsely present. Held-out present fields found: 0/43. **Talonic was not called.** Preserve this distinction when discussing model or product quality.

Founder rehearsals also remain bounded: Global Fund mapped zero pack fields (22 findings), OCHA zero (20 findings), Sudan four of 27 keys (one negative, three stated absent; 26 findings). All requested evidence. A valid freeze does not establish useful extraction accuracy.

Next readiness work is measured held-out extraction performance, a source-linked reviewer workflow, explicit role/exception authority, and durable tenant-scoped records with transactional audit and authorized export. At this 27 September baseline the newer desk accepted recognized Trace roles and used a session waiver stub. The 28 September saved-work path adds durable records, a role-and-grant action matrix and transactional audit/export receipts; formal exception approval authority is still absent.

Revalidated 4 October 2026: the benchmark's recommendation to send pack-rule field definitions (key, title, kind and allowed values) to Talonic is only partly reflected in code. `talonicPackForm` in `lib/field-registry/pack-schema.ts` sends each pack key with its rule title and quote-only instructions, not rule kind or allowed values, and no live run of `pnpm eval:extraction -- --mode live` is recorded. Treat the recommendation as an unmeasured hypothesis, not a validated fix. The local harness (`pnpm test:extraction-eval`) requires Poppler `pdftotext`. Customer custody, scanning, retention/deletion and approved provider disclosure require their own verification; do not infer them from WorkOS sign-in or a successful PDF.

## Tender workspace follow-up

Update, 4 October 2026: Sprints 1–3 merged on 28 September and the saved-work rollout was activated in production that day; see the 4 October section at the top. The paragraph below is the 27–28 September pre-merge description, kept for history.

The next hub/desk work is organized into [four delivery sprints](eng/TENDER_WORKSPACE_SPRINTS.md). Sprint 1 fixes tender continuity and inaccessible unfinished corrections while retaining an explicitly browser-local boundary. Durable cross-session saving and server-issued records are Sprint 2 work, not capabilities implied by the first fixes. The Sprint 2 branch now implements an opt-in durable path, validated with disposable synthetic fixtures; [its verification record](eng/TENDER_WORKSPACE_SPRINT2_VERIFICATION.md) describes the rollout and customer-data limits. Sprint 3 adds My work, stable tender routes, verified current progress and next actions, plus bounded recovery of pending checklist edits after in-app navigation; [its verification record](eng/TENDER_WORKSPACE_SPRINT3_VERIFICATION.md) records the 28 September synthetic browser/database evidence and remaining live-session checks. These changes remain stacked drafts behind the disabled-by-default rollout flag. This branch does not change the production capability register above.

## Open-change dispositions

| PR / work | Reconciliation disposition |
| --- | --- |
| [#57 Case Card readability](https://github.com/odaykamal88/traceli/pull/57) | Retain the simplified view; correct wording that could turn rehearsal gaps into historical pre-signature facts. Keep the full rehearsal qualification visible. Updated with qualified wording and full ledes; 17 tests, typecheck, production build and desktop browser checks passed. Merged following owner approval; production verification follows the final merge. |
| [#60 reviewer checklist](https://github.com/odaykamal88/traceli/pull/60) | Reconcile with current main and the #59 PDF route. Preserve original extraction provenance; use the reviewed snapshot for checks, disposition and PDF. Schema conflict resolved; 61 targeted tests, typecheck and production build passed. Local synthetic correction → freeze → judgment → PDF flow passed. Merged following owner approval; production verification follows the final merge. |
| [#61 cloud development](https://github.com/odaykamal88/traceli/pull/61) | Merged into main after #60, with a clean five-file setup diff. Automatic database mutation removed from startup; four isolated safety checks passed. No full cloud boot is claimed. Development setup and product readiness are separate. |
| [#29 film source](https://github.com/odaykamal88/traceli/pull/29) | Partially integrated: MP4 is byte-identical to main, but Remotion source/render scripts remain unique. Preserve and reconcile reproducibility work before any closure. |
| [#20 Actions update](https://github.com/odaykamal88/traceli/pull/20) | Still unique: pnpm/action-setup 6.0.10 → 6.1.0. Keep for routine dependency validation. |
| [#9 dev dependencies](https://github.com/odaykamal88/traceli/pull/9) | Keep separate: includes TypeScript 5.7.3 → 7.0.2 and Node types 24 → 26. Green old checks alone do not justify a combined upgrade. |
| [#8 old editorial work](https://github.com/odaykamal88/traceli/pull/8) | Superseded-content candidate after the revised publication in #12; check unique source/approval provenance before closure. |

Merged status does not by itself establish production deployment or customer readiness. No row grants separate publication approval. See the [reconciliation validation record](reconciliation/VALIDATION_2026-09-27.md) for scope and limitations.

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
