# WorkOS upload desk

Status: signed-in mock path. 22 September 2026.
Code: `app/login/route.ts`, `app/desk/`, `app/api/desk/route.ts`, `lib/desk/`.
Session: the same Trace gate as [`/api/trace`](../../lib/trace/access.ts) and [`/api/extract`](../../app/api/extract/route.ts).
Spine: [extraction-adapter.md](./extraction-adapter.md), [field-registry-v1.md](./field-registry-v1.md), [donor-packs-v1.md](./donor-packs-v1.md), [award-desk-freeze.md](./award-desk-freeze.md).

## Why

`/demo` stays the public scripted walkthrough. This desk is the signed-in path: one packet, one donor pack, one frozen record. It is not a chatbot. Talonic runs only when `TRACE_EXTRACTION_PROVIDER=talonic`. The default remains the mock.

```text
/login  → AuthKit (existing /auth/callback, return path /desk)
        │
        ▼
/desk   requireTraceViewer          same session as /api/trace
        │
        ▼
POST /api/desk
        ├─ readDeskPacket           file + packId; organization is not accepted
        ├─ extractParsedUpload      same provider entry as POST /api/extract
        ├─ fragmentsTowardRegistryDraft
        ├─ pack keys not in the draft → missing evidence
        ├─ evaluateDonorPack        global-fund | fcdo-prime
        └─ freezeAtJudgment → verifyFrozenRecord
        │
        ▼
results on /desk                    findings + record id + snapshot hash + packs hash
```

`TRACE_EXTRACTION_PROVIDER` stays unset or `mock`. The mock hashes the file and returns a stub fragment. It does not read the document body. Pack fields the stub does not map stay `missing`. Missing is not a negative finding. Judgment on that snapshot is red, and the freeze records `request_evidence`. That is the honest mock walk: a frozen record with evidence gaps, not a faked pass.

## Routes

| Path | Who | What |
| --- | --- | --- |
| `GET /login` | Public | Starts AuthKit sign-in. Return path is `/desk`. If WorkOS is not configured, sends the browser to `/desk?auth=unavailable`. |
| `GET /auth/callback` | AuthKit | Already present. Honors the sealed return path, otherwise `/workspace`. No new callback. |
| `GET /desk` | Trace session | Pack choice, file input, and the frozen record. |
| `POST /api/desk` | Trace session | Multipart upload, judgment, freeze. |
| `POST /desk/sign-out` | WorkOS session | Clears the AuthKit session and returns to `/login`. |
| `GET /demo` | Public | Unchanged scripted Award desk. |

`/api/extract` still accepts only `file` and optional `awardId`. The desk allowlist adds `packId` and optional `procurementReference`. A client `organizationId` is rejected.

Proxy treats `/desk` like the workspace when WorkOS is configured: no session redirects to AuthKit. `/api/desk` is not redirected; `requireTraceViewer` returns 403. Local Trace on a loopback host skips AuthKit for `/desk` and `/api/desk`, the same way `/workspace/trace` does.

## Auth

`requireTraceViewer()` in `lib/trace/access.ts`.

| Mode | When the desk opens |
| --- | --- |
| `TRACELI_TRACE_MODE=workos` | WorkOS is configured. The user has a verified email, one active organization membership, no impersonator, and a Trace role: workspace admin, procurement director, procurement officer, panel member, or auditor. |
| `TRACELI_TRACE_MODE=local` | Development only, loopback database URL with no query string, loopback request host, and `VERCEL` unset. The desk uses the fixture reviewer. |
| Anything else | `/desk` explains that sign-in is not turned on and links to `/demo`. |

The freeze actor is the session user id. The snapshot `organizationId` is the session organization. The client cannot choose either.

## Pack select and freeze

The form sends `packId` `global-fund` or `fcdo-prime` plus one file (pdf, docx, xlsx, eml, msg, txt, png, jpg, jpeg, at most 8 MB).

`snapshotFromUpload` does three things:

1. `fragmentsTowardRegistryDraft` maps hinted fragments onto registry fields (`pricing.table`, `capacity.letter`, and the other draft targets). Generic text stays unmapped.
2. Every field key for the selected pack that the draft did not fill is stored as `missing`, reason `Not extracted from this packet.`, provenance hash of the uploaded file, `verificationMethod: adapter_extract`.
3. The snapshot is `classification: synthetic` while this mapper is in front of the mock. The organization id is still the session org.

`evaluateDonorPack` supplies `pipelineStatus`. `freezeAtJudgment` then `verifyFrozenRecord`. Green readiness would record `accept_assessment`. Any other readiness records `request_evidence`. The mock walk is the second case.

The JSON response is a view: provider id, file name, file hash, pack, findings, field states, record id, snapshot hash, packs hash. It does not include file bytes or a vendor payload. The browser keeps that view in `sessionStorage` until the next packet. Nothing is written to Postgres. The file is not retained.

## Env vars on Vercel

No new variables. Use the existing WorkOS and Trace contract.

| Name | Value |
| --- | --- |
| `WORKOS_CLIENT_ID` | WorkOS client id |
| `WORKOS_API_KEY` | WorkOS API key |
| `WORKOS_COOKIE_PASSWORD` | At least 32 characters |
| `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | `https://<host>/auth/callback` |
| `TRACELI_TRACE_MODE` | `workos` |
| `DATABASE_URL` | Pooled Postgres URL. The desk does not query it. `pnpm validate:env` still requires it whenever Trace mode is `workos`, because `/api/trace` does. |
| `DATABASE_URL_UNPOOLED` | Direct Postgres URL. Same validation rule. |
| `TRACE_EXTRACTION_PROVIDER` | Leave unset, or set `mock`, until the founder flips Production to `talonic` after the live client is merged. The key and base URL may already be set; they are unused while the provider is mock. |
| `TRACE_TALONIC_API_KEY` | Already set on Production `traceli-new`. Do not copy it into the repo. Unused while the provider is mock. |
| `TRACE_TALONIC_BASE_URL` | Production value `https://api.talonic.com/v1`. Unused while the provider is mock. |

WorkOS Redirects for each host you sign in from:

| Setting | Value |
| --- | --- |
| Redirect URI | `https://<host>/auth/callback` (local: `http://localhost:3000/auth/callback`). Must equal `NEXT_PUBLIC_WORKOS_REDIRECT_URI`. |
| Sign-in start | The app uses `/login`. AuthKit hosts the password screen. |
| Sign-out return | `https://<host>/login`. The desk sends that absolute URL. If the dashboard allowlist rejects it, add it. |

Preview deployments need their own redirect URI and matching `NEXT_PUBLIC_WORKOS_REDIRECT_URI`. There is no new callback path.

The signed-in user needs an organization and one of the Trace role slugs above. `org-hq-owner` is not a Trace role. Email verification has to be complete. Impersonation is denied.

Local fixture, without WorkOS:

```bash
TRACELI_TRACE_MODE=local \
NODE_ENV=development \
DATABASE_URL=postgres://trace:trace@127.0.0.1:5432/trace \
pnpm dev
```

Open `http://127.0.0.1:3000/desk`. The database URL only has to be a loopback Postgres URL with no query string. This desk does not connect.

## Tests

```sh
pnpm test:upload-desk
pnpm test:extraction
pnpm test:award-desk
pnpm test:award-desk-freeze
pnpm test:field-registry
pnpm test:contradiction
pnpm test:donor-packs
pnpm test:rule-library
pnpm typecheck
```

## Non-goals

- Flipping Production `TRACE_EXTRACTION_PROVIDER` to `talonic` in this desk change. The founder does that after the live client is merged. See [extraction-adapter.md](./extraction-adapter.md).
- A tenant table for frozen upload-desk records
- Public case studies, homepage, or film changes
- Rule library workspace productization
- Multi-tenant billing
