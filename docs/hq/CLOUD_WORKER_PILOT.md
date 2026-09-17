# First cloud worker: HQ readiness brief

Updated 17 September 2026 · Charter supplement `cloud-pilot-1` · **First cloud run completed and accepted under Oday’s one-time review exception; bounded daily cloud check enabled.**

This is a bounded extension of [Institutional Memory](charters/institutional-memory.md), supervised by Supervisor and reviewed by Auditor. Oday approved this bounded funding packet on 17 September under [approval `oday-hq-pilot-2026-09-17`](cloud/FUNDING_APPROVAL.md). This supplement permits only the specified pilot spend; the general charter's other restrictions remain in force.

## Visible factsheet

| Field | Pilot contract |
|---|---|
| Objective | Turn an explicitly approved HQ source snapshot into a short readiness brief with source-linked observations and unresolved questions |
| Owner / persona | `institutional-memory` / replaceable Librarian worker |
| Inputs | At most 20 reviewed internal/public source excerpts, 16 KB total; no customer records, inbox, account credentials or arbitrary files |
| Tools | One fixed OpenAI Responses call; save a draft through a narrow Postgres function. No model-selected tools, shell, SQL, browser, connectors, email, publication or deployment |
| Model | `gpt-5.6-luna`, no reasoning, at most 2,048 output tokens, no retained provider response (`store:false`) |
| Memory | Approved source snapshot plus this mandate's durable run/draft history; no automatic writes to canonical Company Memory |
| Output | JSON brief: summary, observations with exact approved source references, open questions. Immutable database bytes and database-computed SHA-256 |
| Review | Every successful run stops at `review`; Supervisor accepts with independent evidence. Auditor checks material claims and source mapping. No self-acceptance or promotion capability |
| Trigger | Daily at 06:00 UTC after the verified first run and Oday’s explicit recurrence approval. Maximum one daily job; no model call for an unchanged snapshot already in review/accepted |
| Time | Two attempts at most; each lease at most 120 seconds, cumulative elapsed ceiling 240 seconds from first attempt. Model call at most 60 seconds and shorter near lease expiry |
| Approved model allowance | $0.05 reserved before each possible billable call; at most $0.10 for a daily job; approved $8 per UTC month for this one worker |
| Approved infrastructure allowance | Railway trial first; if needed, Hobby within $10/month hosting and the additional $20 envelope. $2 contingency. Trial credit currently applies; a paid hosting cap is not yet configured |
| Stop | Missing/expired funding or pricing authority, revoked login, pause, insufficient lease, budget exhausted, invalid/refused output, missing sources, provider error, two failed attempts |
| Handoff | Saved draft → Auditor/Supervisor review → separate exact canonical-promotion packet if useful. External and customer actions remain Red |
| KPIs | Accepted useful briefs / reviewed briefs; unsupported claims; unresolved exceptions; estimated versus reconciled cost; unauthorized actions (target zero). No production baseline yet |

## Current evidence

The first real cloud run completed on 17 September: one Railway attempt, 2,925 input and 1,216 output tokens, immutable draft saved in Neon, status `review`. The owner-authenticated hosted HQ displayed that draft and the $0.05 held reservation. Estimated model cost is $0.002191; final billing is unreconciled. [Live run receipt](cloud/LIVE_RUN_20260917.md) preserves the exact evidence.

Actual restricted runner and reader login denial checks passed. The OpenAI project has an $8 hard spend limit and automatic recharge OFF. Railway has one replica, a daily 06:00 UTC check and restart `NEVER` with zero retries; it remains on its trial. Source-packet Auditor review passed. The separate output review hit the account's Codex usage limit, so Supervisor paused execution. Oday then approved a one-time exception for the exact draft and a bounded daily check. Supervisor accepted that draft, re-enabled the worker and verified the schedule. Future outputs retain their ordinary review requirement.

All A–G workstreams remain active queues with their existing owners and reviewed initial artifacts. This pilot does not execute all seven queues, replace the six desktop desk schedules, access their customer records, or establish any send/reply/customer outcome.

## Permission and storage boundary

The existing `createHQStore` broker roles are not remote service credentials. Remote runner and reader logins are `NOINHERIT`, without superuser, role/database creation or RLS bypass. An administrator-owned mapping binds the authenticated `session_user` to the exact preview organization, actor and institutional-memory mandate. Caller-supplied identity settings cannot expand that mapping.

The runner can execute only claim/reserve/submit functions. It cannot select tables or obtain another attempt's lease token. Claiming can instantiate only the complete approved fixed template; an existing job with a different contract is rejected. A reader can execute only a redacted snapshot function, with no lease tokens, credentials or private input bodies. HQ still checks Oday's current WorkOS identity and membership before reading that snapshot.

The database stores jobs/runs/events in the existing foundation, with new private binding/policy, cost reservation and immutable artifact tables. No AWS memory bank, vector database or extra agent framework is needed. The model sees source text only; database and provider credentials remain in the fixed runner. It cannot choose SQL or tools.

## Cost and failure handling

Each reservation is serialized under the worker policy lock and unique to one attempt. There are no automatic API retries. A timeout, crash, invalid response or ambiguous provider outcome keeps the full reservation counted. Settlement stores token counts and a conservative price estimate, but does not free spending room on the worker's assertion. Invoice-reconciled actual cost remains unknown. Prior-month charges remain in history when the UTC budget period rolls over.

The price estimate uses the verified 16 September model rates, conservatively allowing the cache-write input premium. Pricing must be rechecked before the configured expiry. Bounds apply to this fixed runner and key usage; unrelated account activity is outside its control. Hosting has a separate platform limit. Railway's compute hard limit stops all workloads in the selected workspace, so inspect that workspace before setting it. Do not activate Railway Agent usage for this pilot.

## Exact activation sequence

1. Review this factsheet, source snapshot, migration and test record. Confirm Oday's cloud setup and funding reference, scope, expiry and $20 maximum additional monthly envelope before any paid service/API activation.
2. In the existing Neon **pre-production** database, verify migration checksums and retain the schema inventory and checked original migration sources. The completed additive migration used one transaction including checksum records; this inventory is not a full database backup or provider restore point. Apply migrations 0003–0004 only once after the reviewed setup authorization; do not migrate production or import customer data. Confirm the function owner's inherited staff grants under forced RLS.
3. Create separate new runner and reader LOGINs with only their matching cloud capability role, `INHERIT FALSE`, no administration option, and verified-TLS URLs. Register both under the existing dedicated preview organization. Default runner and policy disabled; reader enabled. A prepared provisioning module is in `scripts/db/provision-hq-cloud.mjs`.
4. Railway service: repository `odaykamal88/traceli`, branch `codex/trace-li-hq`, reviewed runtime bundle from that branch, settings `workers/hq/railway-service.json`; `workers/hq/stage.mjs` puts the reviewed Dockerfile at the isolated upload root, one replica, no automatic restarts, **no public domain or cron**. Read back the actual service settings; the new service rejected the deprecated TOML configuration path. Use explicit service settings and the isolated root-Dockerfile bundle; see `workers/hq/DEPLOY.md`. Deploy with `HQ_WORKER_ENABLED=false` first; the process must exit with `disabled` and no DB/API call.
5. Put `HQ_WORKER_DATABASE_URL` and a dedicated project/service-account `OPENAI_API_KEY` only in Railway's secret variables. Put `HQ_READER_DATABASE_URL` only in Vercel Preview for this branch. Never install the Neon owner or WorkOS secret in the worker. Oday creates/authorizes new provider credentials through the official interface; do not paste keys into chat or commit them.
6. Read back the hosting cap and provider project controls. Store the exact funding reference, model allowance, reviewed inputs and pricing expiry in the database policy. Enable that worker and start **one** bounded run. Verify the saved draft, hash, token counts, reservation and review state in owner-authenticated hosted HQ after disconnecting local execution.
7. Only after a useful accepted result, configure a small cloud recurrence. First replace one specifically selected desktop job after its inputs/connectors/receipts are equivalent and verified; then pause its desktop duplicate. This pilot alone does not make the entire company independent of the laptop.

## Pause and recovery

Set the policy's enabled flag false to deny claim, reservation and submission; disable the binding to revoke the identity entirely. Disable Railway execution and remove a schedule if later configured. An already-issued provider request may still cost money, so retain its reservation. Expired/replaced attempts cannot submit. Preserve all artifacts, charges and events; do not delete history to reset a budget. Rotate passwords on the same bound LOGIN when replacing a runtime, rather than creating a new budget identity.

Rollback the HQ preview to the last verified branch deployment if necessary. Retain the additive database tables with access disabled; destructive down-migration is unnecessary. Production website and original Operating Room remain separate.

[OpenAI model and pricing](https://developers.openai.com/api/docs/models/gpt-5.6-luna) · [Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs) · [Railway plans](https://docs.railway.com/pricing/plans) · [Railway cost controls](https://docs.railway.com/pricing/cost-control)
