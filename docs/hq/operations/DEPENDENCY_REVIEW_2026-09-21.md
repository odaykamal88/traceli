# Dependency PR #24 — 21 September 2026

**No concrete defect found; 56 targeted tests pass on the exact candidate dependency install. Hosted authentication/UI checks remain outstanding because the candidate preview redirects to Vercel SSO.** This is an assessment, not a merge, release or production approval.

[PR #24](https://github.com/odaykamal88/traceli/pull/24) was open, non-draft and mergeable when read through the GitHub connector on 21 September. Exact head `87f1cd919ae450e65684c70e801072f456271394`; base `88d1ab1c2242884fd4cc882fbf65d1eb3b445dd4`. One commit changes only `package.json` and `pnpm-lock.yaml` (+271/-256). Recheck head and checks if the bot updates it.

## Scope and observed checks

| Dependency | Locked before → proposed |
|---|---|
| `@base-ui/react` | 1.5.0 → 1.8.0 |
| `@vercel/analytics` | 1.6.1 → 2.0.1 |
| `@vercel/functions` | 3.9.5 → 3.9.8 |
| `@workos-inc/authkit-nextjs` | 4.3.1 → 4.3.2 |
| `@workos-inc/node` | 10.10.0 → 10.13.0 |
| `lucide-react` | 1.17.0 → 1.47.0 |
| `next` | 16.3.3 → 16.3.5 |
| `react`, `react-dom` | 19.2.4 → 19.3.0, paired |
| `tailwind-merge` | 3.4.0 → 3.7.0 |

React remains `^19` in the manifest; the lock also updates both React type packages to 19.3.0 and scheduler to 0.28.0. Remotion remains 4.0.517 but resolves against the new React pair. TypeScript remains 5.7.3; this is not the older development-dependency PR proposing TypeScript 7/Node 26 types. No application code, migration, workflow, registry or install-script change appears in this diff.

[CI run 35551687610](https://github.com/odaykamal88/traceli/actions/runs/35551687610), attached to this head, completed successfully. The connector returned both jobs and their successful steps:

- Build and tenant isolation: frozen install, environment validation, typecheck, production build, migration, tenant/audit and evidence tests, Trace contract/access tests, Trace PostgreSQL tests and migration preflight.
- Dependency and secret checks: gitleaks and `pnpm audit --audit-level=high` passed. This is a thresholded audit result, not evidence that no lower-severity advisory exists.

All three Vercel statuses (`traceli-new`, `traceli-vwsq`, `traceli`) reported success. Build/deployment statuses do not prove authenticated interactions. The CI workflow does not run the HQ access/worker/Jev suites, the Trace browser suite or a Remotion render.

## Upstream changes relevant here

| Area | Primary-source finding and implication |
|---|---|
| Analytics major | The [2.0 release](https://github.com/vercel/analytics/releases/tag/v2.0.0) identifies a license switch to MIT and a Nuxt integration change, plus dynamic configuration and relative-path fixes. Traceli imports `@vercel/analytics/next`, so the documented Nuxt migration does not apply. Verify analytics still loads without expanding collection on private pages. |
| Next patch | [16.3.4](https://github.com/vercel/next.js/releases/tag/v16.3.4) restores AVIF optimization and fixes testmode/build/manifest behavior. [16.3.5](https://github.com/vercel/next.js/releases/tag/v16.3.5) fixes image-cache empty entries, standalone tracing, CSP nonces on loading/template scripts and cache-signal retention. No migration is named in these release notes. Check images, callback routing and private response behavior on the candidate. |
| React minor | [19.3.0](https://github.com/react/react/releases/tag/v19.3.0) changes transition scheduling, enables Trusted Types integration and adds APIs including ViewTransition/Fragment refs. Traceli uses `useTransition` in the tender workbench; preserve pending/error behavior under repeated actions. New APIs need not be adopted. |
| AuthKit patch | [4.3.2](https://github.com/workos/authkit-nextjs/releases/tag/v4.3.2) changes failed-success-callback cookie cleanup and initial token-refresh timing. This directly merits a staging sign-in/callback/session-refresh smoke check; mocked membership tests alone cannot demonstrate cookie behavior. |
| WorkOS SDK | The [10.10–10.13 changelog](https://raw.githubusercontent.com/workos/workos-node/v10.13.0/CHANGELOG.md) adds API features and improves 422 error details. No breaking membership API change is listed. Existing generic error responses should continue to hide provider details. |
| UI and class merging | [Base UI 1.8](https://github.com/mui/base-ui/releases/tag/v1.8.0) includes focus, label and interaction corrections. Traceli currently imports its Button primitive. [tailwind-merge 3.7](https://github.com/dcastil/tailwind-merge/releases/tag/tailwind-merge%403.7.0) corrects several class conflicts; 3.6 adds Tailwind 4.3 support, matching this repo. Check buttons, narrow layouts and disabled/pending controls. |
| Vercel functions | The available [upstream changelog](https://raw.githubusercontent.com/vercel/vercel/main/packages/functions/CHANGELOG.md) ends at 3.9.5, so it does not explain 3.9.6–3.9.8. The diff shows OIDC/CLI-config transitive updates. Because `lib/db/client.ts` calls `attachDatabasePool`, a deployed scoped DB read is the concrete remaining compatibility check. Do not invent a security-fix claim for this bump. |

No named security advisory was established by the inspected release notes. The successful audit supports routine maintenance priority; it does not justify calling this an emergency security fix. Icon rendering and Remotion compatibility are behavioral checks rather than demonstrated failures.

## Recommended completion

On this exact candidate, run the existing HQ access/worker/Jev tests and the fixed-fixture Trace browser journey; inspect the public landing page and private HQ at desktop and narrow widths. Through the existing staging preview, verify sign-in/callback and a scoped read without changing roles or ingesting customer data. Test token-refresh/cookie failure behavior in an isolated staging test session if available. If publishing video assets is imminent, render one existing fixed Remotion frame.

Record those results and any failed/blocked live checks, then decide the merge through the existing release process. Retain the current lockfile for rollback. The initial review above did not change the PR or run a deployment, dependency installation, database write or paid call. Its initial shell read could not reach GitHub; the authorized read-only GitHub connector supplied the exact diff and checks instead. The later isolated installation and test evidence follows.

## Exact-candidate verification follow-up

Independent verifier: `mdb_inventory`, 21 September 2026, completed at 08:06 UTC. Fetched PR #24 and created a detached worktree at `/private/tmp/traceli-pr24-review`, **HEAD `87f1cd919ae450e65684c70e801072f456271394`**, parent `88d1ab1c2242884fd4cc882fbf65d1eb3b445dd4`. The final tracked worktree is clean; no PR/branch/merge mutation was performed.

Installed with pnpm **11.19.0**, Node **24.14.1**, `--frozen-lockfile --ignore-scripts` and a separate temporary store `/private/tmp/traceli-pr24-pnpm-store`. No main-worktree `node_modules` was shared. The first install passed its 619-entry supply-chain policy scan but ended with registry download timeout after 493 packages. One cache-reusing retry with `--fetch-timeout=180000 --network-concurrency=8` completed successfully. Lifecycle scripts were disabled; this was not a native build or rendering check.

Installed package metadata independently matches all ten proposed versions in the table above, including Next 16.3.5, React/ReactDOM 19.3.0, AuthKit 4.3.2 and WorkOS SDK 10.13.0. Frozen input hashes remained unchanged:

- `package.json`: `45a1b45e37f406ed8d6ca1c2c1d395fbe8df57de3496ffaa3a934689c0bedc95`.
- `pnpm-lock.yaml`: `be0d6d97595995222f648c49f84d815af39e261fb0faae393b0d773006c8c963`.

Ran the existing package-script Node commands directly, with their declared module-mock/react-server/TypeScript-loader flags. Tests use synthetic fixtures and mocked identity/provider/database boundaries; no live provider call or database write occurred.

| Existing suite | Result | Temporary full log |
|---|---|---|
| HQ access | **13/13 pass** | `/private/tmp/traceli-pr24-hq-access-tests.log` |
| HQ worker | **9/9 pass** | `/private/tmp/traceli-pr24-hq-worker-tests.log` |
| HQ Jev and smoke | **14/14 pass** | `/private/tmp/traceli-pr24-hq-jev-tests.log` |
| Trace access and contract | **20/20 pass** | `/private/tmp/traceli-pr24-trace-tests.log` |

**Total: 56 pass, zero failed, skipped or cancelled.** These cover fail-closed membership/access, fixed sign-in configuration, spend/reservation/replay boundaries, malformed provider responses, tenant/case linkage, version hashes, reviewer inputs and redacted exports. They do not prove actual hosted WorkOS callback cookies or session refresh.

The PR's bot-linked [traceli-new candidate preview](https://traceli-new-git-dependabot-npma-01af53-odaykamal-9099s-projects.vercel.app) was probed anonymously with HTTP GET only. `/`, `/hq`, `/hq/sign-in`, `/auth/callback`, `/trace` and `/api/trace` each returned **302**; `/hq` explicitly redirected to `vercel.com/sso-api`. This establishes deployment protection, not successful application routing/authentication. No bypass, sign-in, callback exchange or customer-data request was attempted. The mutable preview alias was not independently tied to an immutable deployment SHA; exact-head local test evidence remains separate.

Remaining checks: an authorized candidate-preview session for sign-in/callback/session-refresh and a scoped DB read; fixed-fixture browser interaction/layout checks; and a Remotion frame if imminent video delivery requires it. No additional build or PostgreSQL suite was rerun here; the earlier exact-head CI receipt remains the evidence for those checks. The dependency review is complete within this bounded scope, with these release-confidence gaps explicit.
