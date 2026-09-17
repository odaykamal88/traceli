# HQ private preview and cloud handoff

Updated 17 September 2026. This increment concerns the private dashboard. A hosted dashboard is separate from an unattended worker and its durable job state.

Preview address: [Trace-li HQ preview](https://traceli-new-git-codex-trace-li-hq-odaykamal-9099s-projects.vercel.app/hq). The exact callback is registered in WorkOS; existing callbacks are preserved. The private feature branch `codex/trace-li-hq` is saved on GitHub. Branch-scoped Preview settings are configured for WorkOS mode. Deployment readiness and Oday's real sign-in have now been verified.

Deployment is now READY and its signed-out access/redirect checks pass. The browser reaches the correct hosted login. Oday's actual hosted login is now verified; HQ renders Private owner access. [Draft PR #21](https://github.com/odaykamal88/traceli/pull/21) and [hosted verification](reviews/access-verification.md#hosted-preview-evidence) contain the release evidence. The live production website has not been promoted to this branch.

## Confirmed account and project

The signed-in Vercel dashboard and Vercel CLI both identify `traceli-new`, project `prj_wzlYEGTiKm6GRNISciGi7E4NeNb2`, in team `team_ut14teXSaz7Gby0BTOczrhHT`. Its live production domain is `www.trace-li.com`, serving commit `0130366`. The saved local project link is correct. The connector returns 404 for this same project, so use the authenticated CLI for this rollout; do not recreate or relink the website based on that connector result.

Vercel already has `DATABASE_URL` and `DATABASE_URL_UNPOOLED` through Neon for pre-production environments. WorkOS variables were absent before this increment. No production database connectivity or migration is established by their presence in preview.

## Owner access boundary

`requireHQViewer()` runs before every HQ document/data read. Hosted access is disabled by default. Explicit WorkOS mode requires a configured identity provider, an exact owner user ID, an exact organization ID, a verified non-impersonated session in that organization, and a fresh active organization membership with role `org-hq-owner`. Current user verification and membership are fetched from WorkOS on each read. Removed membership, removed role and provider failure deny access. Procurement roles, email matches, browser parameters and model-provided identities confer no HQ authority.

This viewer grants read access to the curated operating package only. It grants no database broker principal, job execution, approval, send, publication or deployment capability. Worker service identity must remain separate from Oday's interactive login. The existing `/workspace` flow and procurement permissions are unchanged.

Local development retains the existing review mode when `NODE_ENV=development` and not hosted on Vercel. Run that server on loopback. `local` mode is refused on production/hosted environments. HQ responses are private/no-store and noindex. The package's markdown and JSON are traced into the server bundle, not put in `public/`.

## Preview identity and configuration

The existing WorkOS staging environment is `environment_01M0SG5F45VQC9V13DPYMSPZEG`, client `client_01M0SG5FDPTEYMRGNF5YMKNHKV`.

- Dedicated preview organization: `org_01M2MDYMMMY9SWVAC8VWE52BM3`, Trace-li HQ Preview. No domains or automatic domain admission.
- Owner application user: `user_01M2MDYWCDDT13QGCTJHHSYD1C`, using Oday's existing WorkOS account email. Email verification must be completed by Oday through AuthKit; dashboard sign-in is not application sign-in.
- Organization role: `role_01M2MDZ8A7TND5F7P9G99X1AQN`, slug `org-hq-owner`, with no procurement/admin permission grants. It is not the default member role.

Vercel variables belong only to Preview and branch `codex/trace-li-hq`:

| Variable | Value source / handling |
|---|---|
| `WORKOS_CLIENT_ID` | Existing staging client above |
| `WORKOS_API_KEY` | Existing staging credential, transferred without printing or committing it |
| `WORKOS_COOKIE_PASSWORD` | Fresh preview-only generated secret |
| `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | Exact registered preview callback URL |
| `TRACELI_HQ_ACCESS` | `disabled` while establishing the preview URL; `workos` only with complete bindings |
| `TRACELI_HQ_OWNER_USER_ID` | Exact owner application user above |
| `TRACELI_HQ_ORGANIZATION_ID` | Exact dedicated preview organization above |
| `HQ_READER_DATABASE_URL` | Separate restricted verified-TLS login; installed on this branch Preview only |

Preserve the existing WorkOS redirect URIs when adding the exact preview callback. Do not add a wildcard. The sign-in route fixes both organization and return destination (`/hq`), ignoring URL-provided return/role values. The existing callback uses the SDK's protected state to return to HQ.

## Remaining cloud work

1. Owner hosted sign-in is verified. Complete the real non-owner denial check; fictional-policy tests do not substitute for that separate check.
2. HQ migrations and separate runner/reader credentials are installed in pre-production. Actual restricted-login denial checks pass. Refresh the preview deployment and verify its live read-only status panel.
3. The bounded adapter, immutable drafts, identity-bound database functions and conservative budget reservations are implemented and locally verified. The disabled cloud deployment is verified. Complete the first funded run described in the [pilot factsheet](CLOUD_WORKER_PILOT.md) before scheduling it.
4. Select one actual workload, then provision its cloud runtime with Oday's confirmed spending limit. Existing desktop schedules continue to need the laptop until their selected job is cut over and its duplicate timer is paused.
5. Prepare the exact production deployment/migration packet and rollback. Oday retains production authority.

Oday approved the additional $20/month pilot, and the API account is funded with an $8 project hard limit and automatic recharge off. The Railway trial is active; no paid Railway subscription or $10 hosting cap is established yet. The worker remains paused pending its key and first live acceptance. No Pro upgrade is required by this setup. AWS memory banks, eight databases and a new agent framework are unnecessary for this increment; keep scoped memory on the existing Postgres foundation. Revoke owner access by removing the preview membership/role; disable the preview by setting its branch-specific `TRACELI_HQ_ACCESS=disabled` and redeploying. None of these preview settings are production settings.

[Access verification](reviews/access-verification.md) · [Postgres foundation](POSTGRES_FOUNDATION.md) · [Backlog](IMPLEMENTATION_BACKLOG.md)
