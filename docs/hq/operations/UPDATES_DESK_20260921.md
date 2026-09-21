# HQ Updates desk integration — 21 September 2026

## User flow

HQ's **Add an update** link opens the existing owner-private [Updates desk](https://traceli-operating-room.odeyqemal.chatgpt.site/updates). Requests, review rows and the new **Tasks** view link to `/updates?task=ID`. The Operating Room owns note entry, review returns and priority changes; HQ continues to read its signed metadata mirror. No cross-site credential, command outbox, new HQ write role or automatic interpretation of note text is introduced.

Tasks show current work, later work and completed work separately. A missing priority in an older snapshot says **Priority not recorded**. A pending review stays visible when deferred. Current request cards omit deferred/completed members; a partially deferred request uses generic next-step text and links only its remaining current tasks, so old instructions cannot keep requesting deferred work. Snapshot time stays visible.

## Minimal source contract

Keep `schema_version: 1` and every existing packet field. The only optional additions to each task are:

| Field | Permitted value | Meaning |
|---|---|---|
| `priority` | `normal` or `later` | Source-owned planning priority, independent of task status |
| `revision` | Integer from 0 through 9007199254740991 | Source-owned task revision; metadata only in HQ |

Omitted fields remain omitted. Null, unknown enum values, fractional/negative/unsafe revisions and extra fields are rejected. Status remains `todo`, `doing`, `blocked`, `done` or `review`. Note bodies, review packets, note counts and latest-note timestamps are not mirrored. The source must exclude `later` tasks from worker eligibility; HQ does not control source claims.

Migration **0012_hq_task_planning_metadata.sql** replaces only the existing ingestion function. It preserves its identity, owner, grants, source binding, minimized required fields, packet bounds, serialization and replay behavior. Older packets continue to work. Migration 0010 and source collection migration 0011 are not prerequisites for 0012; the verified prerequisite is 0006.

## Verification

- TypeScript and production webpack build passed.
- Ten feed/control tests passed, including legacy/extended packets, malformed and private fields, fixed task links, unknown priority and mixed-priority requests.
- A fresh disposable PostgreSQL 18.4 database applied migrations 0001–0012. Restricted ingestion accepted legacy/extended packets and preserved exact metadata, rejected twelve malformed/private variants without changing the mirror, rejected conflicting replay and revoked identity, and preserved exact-retry behavior. Repeated successfully with SCRAM password authentication, matching CI's authenticated connection requirement.
- Local browser verification at desktop width 1280 and mobile width 390 showed meaningful content, no error overlay, no horizontal overflow, and correct Updates/task links. Temporary local fixtures verified the Later group, pending-review retention, hidden fully deferred requests, and a mixed #38-later/#39-current card containing only the #39 action. Fixtures were restored; no live task changed.
- Independent review initially found missing CI fixture credentials and misleading mixed-priority request copy. Both were fixed and independently rechecked; ten tests passed again, with no remaining release blocker reported. The narrow operator received static review; no hosted migration or deployment was executed in this change.

## Private preview rollout

The existing stable destination is **https://traceli-new-git-codex-trace-li-hq-odaykamal-9099s-projects.vercel.app/hq**, project `traceli-new` (`prj_wzlYEGTiKm6GRNISciGi7E4NeNb2`), team `team_ut14teXSaz7Gby0BTOczrhHT`. Its existing private Git branch is `codex/trace-li-hq`; branch-scoped WorkOS and source settings belong to that branch. Do not promote this work to production or retarget the public domain.

1. Inspect the latest private branch and its deployment identity. The implementation branch starts at `4e9f59753b119e698a94284815752a5a1d2ec368`; the cached private branch is `cd59c74` with identical pre-change HQ page/feed code. Use a reviewed feature commit on the existing private branch, preserving any newer work. A full-history fast-forward is valid only after confirming the current private branch is an ancestor and reviewing the included changes. Otherwise carry the isolated feature commit onto that branch and resolve package/CI context explicitly. Do not force-push or merge main as part of this rollout.
2. Apply only migration 0012 to the already-authorized HQ preview database. The executable operator below loads the existing environment file, looks up the named Railway preview worker through the existing authenticated CLI, binds the admin URL to that worker's database, verifies the active organization/source binding and migration 0006 checksum, and preserves the ingestion function's OID/owner/ACL. DDL and migration journal commit together. It has no seed, provision or migration-glob mode.

   ```sh
   HQ_OPERATOR_ENV_FILE=/absolute/path/to/existing/preview.env node scripts/hq/task-planning-admin.mjs inspect
   HQ_OPERATOR_ENV_FILE=/absolute/path/to/existing/preview.env node scripts/hq/task-planning-admin.mjs migrate
   ```

   Set `RAILWAY_CLI_PATH` only if the existing CLI is not on PATH. Credentials stay in process memory and are never printed. A failed preflight exits without applying the migration. **Do not use `pnpm db:migrate` on the hosted preview:** that would apply unrelated missing migrations, including Trace 0010.
3. Deploy the reviewed commit using the existing `codex/trace-li-hq` preview branch/settings. Confirm the stable alias resolves to that exact commit and retains its WorkOS callback, owner-only access, `private, no-store` and `noindex` behavior. A new feature-branch URL is not a substitute for the stable alias because branch-scoped settings may be absent. Keep Trace mode disabled unless separately authorized.
4. Only after both the receiver code and 0012 are ready, enable the source's optional priority/revision export and Updates desk. Verify one authenticated source read reports synced and the same task status/priority/revision is present in HQ. Old receiver code or schema correctly rejects extended packets; do not widen its allowlist or remove source authentication to resolve a pending delivery.
5. Verify the exact task link, note save, return-to-backlog, defer/resume, active-claim conflict and retry behavior on the source under its own test packet. Refresh HQ after source success. HQ refresh reads its saved mirror; a delayed source delivery must remain visible as stale metadata, not falsely described as an applied update.

Rollback: the source may stop exporting the two optional fields and continue using the original feed. Keep its authoritative notes/history and task decisions intact. Do not roll HQ back to an old strict parser while extended source packets are still being emitted; first restore the old export shape or retain the compatibility parser. The additive 0012 function may remain installed because it accepts both shapes.
