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
        ├─ evaluateDonorPack        global-fund | fcdo-prime | unfpa | ocha-cbpf
        └─ freezeAtJudgment → verifyFrozenRecord
        │
        ▼
results on /desk                    readiness, then Your judgment
        │
        ▼
POST /api/desk/disposition          same snapshot, new freeze, supersedesRecordId
```

`TRACE_EXTRACTION_PROVIDER` stays unset or `mock`. The mock hashes the file and returns a stub fragment. It does not read the document body. Pack fields the stub does not map stay `missing`. Missing is not a negative finding. Judgment on that snapshot is red, and the freeze records `request_evidence`. That is the honest mock walk: a frozen record with evidence gaps, not a faked pass.

## Routes

| Path | Who | What |
| --- | --- | --- |
| `GET /login` | Public | Product sign-in. Return path is `/desk`. A signed-in visitor goes straight to the desk. An `invitation_token` or `password_reset_token` on this URL always continues into AuthKit. If WorkOS is not configured, sends the browser to `/desk?auth=unavailable`. |
| `GET /auth/login` | AuthKit | Initiate login URL. Always starts AuthKit sign-in and returns to `/desk`. Password-reset and invitation emails that begin on AuthKit finish here. |
| `GET /invite` and `GET /sign-up` | Invite email | User invitation URL. A single valid `invitation_token` starts AuthKit sign-in for that invite and returns to `/desk`. Any other visit shows the invitation-only page. Public self-serve signup is closed. |
| `GET /reset-password` | Reset email | Password reset URL. A single `token` (or `password_reset_token`) is handed to AuthKit as `password_reset_token`, then the user returns to `/desk`. Without a token, the page asks for the email link. |
| `GET /auth/callback` | AuthKit | Already present. Honors the sealed return path, otherwise `/workspace`. No new callback. |
| `GET /hub` | Trace session | Knowledge hub. Seeded packs, plus organisation manual labels kept in this browser. |
| `GET /hub/tender` | Trace session | Name a tender, choose one seeded pack, attach manuals, continue to `/desk`. |
| `GET /desk` | Trace session | Pack choice, file input, and the frozen record. `?pack=` preselects a seeded pack. `?engagement=` shows the tender. |
| `POST /api/desk` | Trace session | Multipart upload, pack judgment, auto freeze. |
| `POST /api/desk/disposition` | Trace session | Human disposition. Re-freezes the returned snapshot and supersedes the auto record. |
| `POST /desk/sign-out` | WorkOS session | Clears the AuthKit session and returns to `/login`. |
| `GET /demo` | Public | Unchanged scripted Award desk. |

`/api/extract` still accepts only `file` and optional `awardId`. The desk allowlist adds `packId` and optional `procurementReference`. A client `organizationId` is rejected.

Proxy treats `/desk` and `/hub` like the workspace when WorkOS is configured: no session redirects to AuthKit. `/api/desk` is not redirected; `requireTraceViewer` returns 403. Local Trace on a loopback host skips AuthKit for `/desk`, `/hub`, and `/api/desk`, the same way `/workspace/trace` does.

## Knowledge hub

`/hub` is the signed-in library, separate from any one tender. The four live packs are seeded and read-only. The page calls them Trace-li public-control synthesis, not official UN, Global Fund, FCDO, or OCHA manuals.

An organisation can add a manual using the same file types as the desk, at most 8 MB, up to 12 files. The browser store `traceli.knowledgeHub.v1` keeps the label, file name, size, media type, and SHA-256, scoped to the session `organizationId`. It does not keep the bytes. Nothing is written to Postgres, and nothing is compiled into `JudgmentRule`s. A manual from another organisation is dropped on read.

`/hub/tender` saves an engagement in that store. One primary seeded pack is required. Manuals are optional conditions in play. Continue opens `/desk?pack=<id>&engagement=<id>`. The desk preselects that pack and sends the tender name as `procurementReference`. `evaluateDonorPack` still runs that one pack only. Attached manuals stay visible on the desk and on the decision record, labelled as not evaluated.

After disposition, the decision record has one golden-thread line: the Field Registry freeze is the citeable record. Humans dispose; Trace-li freezes the proof.

Login still returns to `/desk`. The desk shell links to the hub.

## Auth

`requireTraceViewer()` in `lib/trace/access.ts`.

| Mode | When the desk opens |
| --- | --- |
| `TRACELI_TRACE_MODE=workos` | WorkOS is configured. The user has a verified email, one active organization membership, no impersonator, and a Trace role: workspace admin, procurement director, procurement officer, panel member, or auditor. |
| `TRACELI_TRACE_MODE=local` | Development only, loopback database URL with no query string, loopback request host, and `VERCEL` unset. The desk uses the fixture reviewer. |
| Anything else | `/desk` explains that sign-in is not turned on and links to `/demo`. |

The freeze actor is the session user id. The snapshot `organizationId` is the session organization. The client cannot choose either.

## Pack select and freeze

The form sends one `packId` (`global-fund`, `fcdo-prime`, `unfpa`, or `ocha-cbpf`) plus one file (pdf, docx, xlsx, eml, msg, txt, png, jpg, jpeg, at most 8 MB).

The file control is a navy button labelled Choose file, associated with the packet file input. While `POST /api/desk` is in flight the submit control is disabled and the page shows a spinner with Working…. That one request extracts, runs the pack, and freezes. The page does not pretend to know which of those stages is current.

`snapshotFromUpload` does three things:

1. `fragmentsTowardRegistryDraft` maps hinted fragments onto registry fields (`pricing.table`, `capacity.letter`, and the other draft targets). Generic text stays unmapped.
2. Every field key for the selected pack that the draft did not fill is stored as `missing`, reason `Not extracted from this packet.`, provenance hash of the uploaded file, `verificationMethod: adapter_extract`.
3. The snapshot is `classification: synthetic` while this mapper is in front of the mock. The organization id is still the session org.

`evaluateDonorPack` supplies `pipelineStatus`. `freezeAtJudgment` then `verifyFrozenRecord`. Green readiness would record `accept_assessment`. Any other readiness records `request_evidence`. The mock walk is the second case.

The JSON response is a view: provider id, file name, file hash, pack, findings, field states, the registry snapshot, record id, snapshot hash, packs hash. It does not include file bytes or a vendor payload. The browser keeps that view in `sessionStorage` (`traceli.uploadDesk.frozen.v2`) until the next packet. Nothing is written to Postgres. The file is not retained. There is no server cache of the frozen record.

After the assessment freeze, the same page asks for a human disposition: Request evidence, Accept with exception, or Escalate. The reason is drafted from readiness, the top findings, and missing pack fields. Confirm calls `POST /api/desk/disposition`. The server checks the session organization and actor, recomputes the snapshot hash, and writes a new verified freeze with `supersedesRecordId` set to the assessment record. The assessment record is not mutated. Accept with exception adds a desk-session waiver stub (`waiver.desk.<short>`, authority is the signed-in actor). That note is not an organization waiver system. The decision record stays in `sessionStorage` with the assessment. Start another packet clears both.

When extraction fails, the desk uses the same JSON as `POST /api/extract`: `error`, `code`, and `upstream` (`status`, `code`, `message`, `requestId`) when Talonic returned them. The page shows the `error` sentence and that detail. The API key and Authorization header are not included.

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

Signup stays closed. Trace-li does not offer a public registration form. AuthKit sign-up in the dashboard Authentication section stays off. A valid invitation still opens registration for that email, including when signup is disabled. After acceptance, the desk still requires a verified email, one active organization membership, and a Trace role. An invitation alone does not grant the desk.

WorkOS hosts the password and invitation screens. This app only starts those flows and receives the callback. No new environment variable. The callback path is still `/auth/callback`.

### Dashboard Redirects the founder confirms

Application: **Traceli Pilot**, for the environment whose API key is on Production `traceli-new`. One Initiate login URL, one User invitation URL, and one Password reset URL per environment. Redirect URIs and sign-out returns are lists. Do not change Production `NEXT_PUBLIC_WORKOS_REDIRECT_URI`; confirm it already equals the www callback below.

| Dashboard field | Production (`www.trace-li.com`) | Local (Staging environment, if used) |
| --- | --- | --- |
| Redirect URI | `https://www.trace-li.com/auth/callback` | `http://localhost:3000/auth/callback` |
| Redirect URI, apex alias | `https://trace-li.com/auth/callback` | — |
| Initiate login URL | `https://www.trace-li.com/auth/login` | `http://localhost:3000/auth/login` |
| Sign-out redirect | `https://www.trace-li.com/login` | `http://localhost:3000/login` |
| Sign-out redirect, apex alias | `https://trace-li.com/login` | — |
| User invitation URL | `https://www.trace-li.com/invite` | `http://localhost:3000/invite` |
| Password reset URL | `https://www.trace-li.com/reset-password` | `http://localhost:3000/reset-password` |

Authentication section, same environment: **Sign up** off.

`/sign-up` is not a public signup URL. If the dashboard has a separate sign-up URL field, set it to `https://www.trace-li.com/sign-up` (local: `http://localhost:3000/sign-up`). Without an invitation token that page explains that accounts are by invitation.

The product Login link remains `/login`. It is not the Initiate login URL, because a signed-in visitor is sent to the desk. AuthKit must be able to land on `/auth/login` and start a fresh sign-in.

Preview deployments need their own redirect URI, matching `NEXT_PUBLIC_WORKOS_REDIRECT_URI`, plus their own initiate, invitation, reset, and sign-out URLs if that preview sends mail. There is no wildcard and no new callback path.

HQ keeps `/hq/sign-in` for its bound organization. The application Initiate login URL returns to `/desk`, not `/hq`.

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
pnpm test:hub
pnpm test:authkit
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
