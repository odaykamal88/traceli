# WorkOS upload desk

Status: reviewer-checklist reconciliation candidate, 27 September 2026. Supports mock or Talonic extraction; active deployment configuration must be checked separately.
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
POST /api/desk/checklist
        ├─ readDeskPacket           file + packId; organization is not accepted
        ├─ extractParsedUpload      same provider entry as POST /api/extract
        └─ one checklist row per pack key
        │
        ▼
checklist on /desk                  confirm, or mark present / negative / stated absent / missing
        │
        ▼
POST /api/desk/freeze
        ├─ apply reviewer edits     reviewer_attested, original extract kept
        ├─ evaluateDonorPack        recomputed from the reviewed snapshot
        └─ freezeAtJudgment → verifyFrozenRecord
        │
        ▼
results on /desk                    readiness, then Your judgment
        │
        ▼
POST /api/desk/disposition          same snapshot, new freeze, supersedesRecordId
        │
        ▼
POST /api/desk/pilot-report         reviewed snapshot + matching human judgment → PDF
```

`POST /api/desk` still freezes in one step with no reviewer edits. The signed-in page uses the checklist. A freeze that confirms every row, or leaves already-missing rows missing, reproduces that one-step snapshot hash when both use the same clock.

When `TRACE_EXTRACTION_PROVIDER` is unset or `mock`, the mock hashes the file and returns a stub fragment. It does not read the document body. Pack fields the stub does not map stay `missing`. Missing is not a negative finding. Judgment on that snapshot is red, and the freeze records `request_evidence`. With `talonic`, the live adapter supplies extracted fragments; the same mapping and review rules apply.

## Routes

| Path | Who | What |
| --- | --- | --- |
| `GET /login` | Public | Product sign-in. Return path is `/desk`. A signed-in visitor goes straight to the desk, unless the URL is exactly `?switch=1` or it carries an invitation or password-reset token. `switch=1` signs out first, then starts AuthKit with an account choice. Tokens always continue into AuthKit and are not dropped for `switch`. If WorkOS is not configured, sends the browser to `/desk?auth=unavailable`. |
| `GET /auth/login` | AuthKit | Initiate login URL. Always starts AuthKit sign-in and returns to `/desk`. Password-reset and invitation emails that begin on AuthKit finish here. |
| `GET /invite` and `GET /sign-up` | Invite email | User invitation URL. A single valid `invitation_token` starts AuthKit sign-in for that invite and returns to `/desk`. Any other visit shows the invitation-only page. Public self-serve signup is closed. |
| `GET /reset-password` | Reset email | Password reset URL. A single `token` (or `password_reset_token`) is handed to AuthKit as `password_reset_token`, then the user returns to `/desk`. Without a token, the page asks for the email link. |
| `GET /auth/callback` | AuthKit | Already present. Honors the sealed return path, otherwise `/workspace`. No new callback. |
| `GET /auth/switch` | Public | Account switch. Always starts AuthKit for `/desk` with `prompt: 'consent'`. A signed-in visitor is signed out first and is not sent to the desk. |
| `GET /auth/signed-out` | Public | Calm page after sign-out. Sign in and the public walkthrough are links. This page does not start AuthKit. |
| `GET /hub` | Trace session | Knowledge hub. Seeded packs, plus organisation manual labels kept in this browser. |
| `GET /hub/tender` | Trace session | Name a tender, choose one seeded pack, attach manuals, continue to `/desk`. |
| `GET /desk` | Trace session | Pack choice, file input, and the frozen record. `?pack=` preselects a seeded pack. `?engagement=` shows the tender. |
| `POST /api/desk` | Trace session | Multipart upload, pack judgment, auto freeze with no reviewer edits. The page does not call this. |
| `POST /api/desk/checklist` | Trace session | Multipart upload. Returns the checklist. Does not freeze. |
| `POST /api/desk/freeze` | Trace session | Reviewed checklist. Recomputes findings, then freezes. |
| `POST /api/desk/disposition` | Trace session | Human disposition. Re-freezes the returned snapshot and supersedes the assessment record. |
| `POST /api/desk/pilot-report` | Trace session | PDF from the assessment's reviewed snapshot and its matching human disposition; checks organization, hashes, and recomputed findings. |
| `POST /desk/sign-out` | WorkOS session | Clears the AuthKit session and returns to `/auth/signed-out`. |
| `POST /desk/switch-account` | WorkOS session | Clears the AuthKit session and returns to `/auth/switch`, which starts a different sign-in. |
| `GET /demo` | Public | Unchanged scripted Award desk. |

`/api/extract` still accepts only `file` and optional `awardId`. The desk allowlist adds `packId` and optional `procurementReference`. A client `organizationId` is rejected.

Proxy treats `/desk` and `/hub` like the workspace when WorkOS is configured: no session redirects to AuthKit. `/api/desk` is not redirected; `requireTraceViewer` returns 403. Local Trace on a loopback host skips AuthKit for `/desk`, `/hub`, and `/api/desk`, the same way `/workspace/trace` does.

## Knowledge hub

`/hub` is the signed-in start of one tender. The lede states the outcome first: choose a Trace-li seeded pack, add manuals only if they need to be on the record, name one tender, and freeze a citeable golden thread. The path reads Knowledge hub → New tender → Award desk → Golden thread. The four live packs are seeded and read-only. The page calls them Trace-li public-control synthesis, not official UN, Global Fund, FCDO, or OCHA manuals. One pack drives the freeze.

Organisation manuals are optional and visually quieter than the seeded packs. The empty state says a seeded pack alone is enough. An organisation can add a manual using the same file types as the desk, at most 8 MB, up to 12 files. The browser store `traceli.knowledgeHub.v1` keeps the label, file name, size, media type, and SHA-256, scoped to the session `organizationId`. It does not keep the bytes. Nothing is written to Postgres, and nothing is compiled into `JudgmentRule`s. A manual from another organisation is dropped on read. After a manual is added, the page still says the upload is not compiled into pack rules.

`/hub/tender` is one piece of work. It saves an engagement in that store. One primary seeded pack is required. Manuals are optional conditions in play, and their absence is not a blocker. Continue opens `/desk?pack=<id>&engagement=<id>`. The desk shows the tender name and pack as the continuation of that path, preselects that pack, and sends the tender name as `procurementReference`. `evaluateDonorPack` still runs that one pack only. Attached manuals stay visible on the desk and on the decision record as conditions in play, not evaluated.

After disposition, the decision record leads with the golden thread: the citeable pre-signature freeze for this tender. Humans dispose; Trace-li freezes the proof.

Login still returns to `/desk`. A cold desk visit shows one line, “New here? Start in the Knowledge hub.” It does not redirect. The desk shell links to the hub.

## Auth

`requireTraceViewer()` in `lib/trace/access.ts`.

| Mode | When the desk opens |
| --- | --- |
| `TRACELI_TRACE_MODE=workos` | WorkOS is configured. The user has a verified email, one active organization membership, no impersonator, and a Trace role: workspace admin, procurement director, procurement officer, panel member, or auditor. |
| `TRACELI_TRACE_MODE=local` | Development only, loopback database URL with no query string, loopback request host, and `VERCEL` unset. The desk uses the fixture reviewer. |
| Anything else | `/desk` explains that sign-in is not turned on and links to `/demo`. |

The freeze actor is the session user id. The snapshot `organizationId` is the session organization. The client cannot choose either.

Current authority boundary: any accepted Trace role can enter this desk flow; there is no separate reviewer or exception-approval policy here. The returned checklist and record are browser-held copies. Recomputing their hashes detects inconsistent payloads, but a client can recompute those hashes too: this does not prove server issuance. Durable server-held records, award-level authorization, and verified reviewer/approver separation remain pilot-readiness requirements.

## Pack select and freeze

The form sends one `packId` (`global-fund`, `fcdo-prime`, `unfpa`, or `ocha-cbpf`) plus one file (pdf, docx, xlsx, eml, msg, txt, png, jpg, jpeg, at most 8 MB).

The file control is a navy button labelled Choose file, associated with the packet file input. Extract packet calls `POST /api/desk/checklist`. While that request is in flight the submit control is disabled and the page shows a spinner with Working…. The checklist comes back before any freeze. Freeze assessment calls `POST /api/desk/freeze`. The page does not pretend to know which stage inside a request is current.

`snapshotFromUpload` does four things:

1. `fragmentsTowardRegistryDraft` still maps hinted fragments onto generic registry fields (`pricing.table`, `waiver.noted`, and the other draft targets). On a pack snapshot those generic keys are not copied in. The fragment counts as unmapped. `fragmentCount` remains the number of fragments Talonic or the mock returned.
2. `alignPackFields` reads fragments tagged `document_text` onto the selected pack's keys. A match needs the field key plus a stated `missing:` / `present:` value, or a full-phrase statement for that key. Words that merely overlap a key do not count. An absence is not stored as present or true. The stored quote is that sentence, with running header and footer text, `Page N` markers, and markdown `**` removed. The page id on the source ref stays the page the marker named.
3. Every pack key that step 2 did not fill is stored as `missing`, reason `Not extracted from this packet.`, provenance hash of the uploaded file, `verificationMethod: adapter_extract`. A Talonic JSON value for that key is not copied in, including when the value begins with the key name.
4. The mapper currently stamps `classification: synthetic` for either provider. The organization id is still the session org. Pack versions are unchanged. The snapshot fields are that pack's keys only. Customer-file classification and custody are not implemented by this path.

The checklist shows every pack key with the human title from the pack rule, the state (present, missing, or negative), the value, the quote, and the page. The reviewer can confirm the extract, mark present (value, page, quote), mark negative (note and page), mark stated absent (quote and page), or leave the row missing. A page is required for a reviewer-set present, negative, or stated-absent value. Confirming a row, or leaving a row that is already missing, does not change provenance.

A real edit sets `verificationMethod` to `reviewer_attested` and keeps the extracted value on `provenance.extractedValue`, plus `extractedSourceRef`, `extractedVerificationMethod`, `reviewedBy` (the session user id), and `reviewedAt`. It does not overwrite the adapter extract. Findings and readiness are computed again from that snapshot before `freezeAtJudgment`. The frozen field list badges reviewer-attested rows and extracted rows. The public Case Card already prints `verificationMethod` on each registry row, so the same distinction is in the JSON export without a separate Case Card presentation change.

`evaluateDonorPack` supplies `pipelineStatus`. `freezeAtJudgment` then `verifyFrozenRecord`. Green readiness would record `accept_assessment`. Any other readiness records `request_evidence`. The mock walk is the second case.

The JSON response is a view: provider id, file name, file hash, pack, findings, field states, the registry snapshot, record id, snapshot hash, packs hash. It does not include file bytes or a vendor payload. The browser keeps that view in `sessionStorage` (`traceli.uploadDesk.frozen.v2`) until the next packet. Nothing is written to Postgres. The file is not retained. There is no server cache of the frozen record.

After the assessment freeze, the same page asks for a human disposition: Request evidence, Accept with exception, or Escalate. The reason is drafted from readiness, the top findings, and missing pack fields. Confirm calls `POST /api/desk/disposition`. The server checks the session organization and actor, recomputes the snapshot hash, and writes a new verified freeze with `supersedesRecordId` set to the assessment record. The assessment record is not mutated. Accept with exception adds a desk-session waiver stub (`waiver.desk.<short>`, authority is the signed-in actor). That note is not an organization waiver system. The decision record stays in `sessionStorage` with the assessment. Start another packet clears both.

Download pilot report sends that reviewed assessment view and the human judgment to `POST /api/desk/pilot-report`. The human record must cite the reviewed assessment's record id and snapshot hash; pairing it with the earlier extraction snapshot is refused. Reviewer-attested fields retain their original extraction value and provenance, and the PDF labels them with reviewer identity and time. An incomplete reviewer audit object is rejected. Existing published freezes without reviewer edits retain their hashes.

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
| `DATABASE_URL` | Pooled Postgres URL. The desk does not query it. `pnpm validate:env` still requires it whenever Trace mode is `workos`, because `/api/trace` does. A Vercel preview build may continue when this pair is set and the WorkOS secrets are absent, because those secrets are Production-only. Signed-in Trace-li stays closed on that preview. Production still refuses the build if WorkOS is incomplete. |
| `DATABASE_URL_UNPOOLED` | Direct Postgres URL. Same validation rule. |
| `TRACE_EXTRACTION_PROVIDER` | Supported values: `mock` (default) or `talonic`. Read the deployment configuration to determine which is active. This reconciliation does not change it. |
| `TRACE_TALONIC_API_KEY` | Required for the Talonic provider. Read state through authorized deployment tooling; do not copy the value into the repo. Unused while the provider is mock. |
| `TRACE_TALONIC_BASE_URL` | Talonic endpoint, normally `https://api.talonic.com/v1`. Unused while the provider is mock. |

Signup stays closed. Trace-li does not offer a public registration form. AuthKit sign-up in the dashboard Authentication section stays off. A valid invitation still opens registration for that email, including when signup is disabled. After acceptance, the desk still requires a verified email, one active organization membership, and a Trace role. An invitation alone does not grant the desk.

WorkOS hosts the password and invitation screens. This app only starts those flows and receives the callback. No new environment variable. The callback path is still `/auth/callback`.

### Dashboard Redirects the founder confirms

Application: **Traceli Pilot**, for the environment whose API key is on Production `traceli-new`. One Initiate login URL, one User invitation URL, and one Password reset URL per environment. Redirect URIs and sign-out returns are lists. Do not change Production `NEXT_PUBLIC_WORKOS_REDIRECT_URI`; confirm it already equals the www callback below.

| Dashboard field | Production (`www.trace-li.com`) | Local (Staging environment, if used) |
| --- | --- | --- |
| Redirect URI | `https://www.trace-li.com/auth/callback` | `http://localhost:3000/auth/callback` |
| Redirect URI, apex alias | `https://trace-li.com/auth/callback` | — |
| Initiate login URL | `https://www.trace-li.com/auth/login` | `http://localhost:3000/auth/login` |
| Sign-out redirect (signed-out page) | `https://www.trace-li.com/auth/signed-out` | `http://localhost:3000/auth/signed-out` |
| Sign-out redirect, apex alias | `https://trace-li.com/auth/signed-out` | — |
| Sign-out redirect (account switch) | `https://www.trace-li.com/auth/switch` | `http://localhost:3000/auth/switch` |
| Sign-out redirect, apex alias | `https://trace-li.com/auth/switch` | — |
| User invitation URL | `https://www.trace-li.com/invite` | `http://localhost:3000/invite` |
| Password reset URL | `https://www.trace-li.com/reset-password` | `http://localhost:3000/reset-password` |

Authentication section, same environment: **Sign up** off.

`/sign-up` is not a public signup URL. If the dashboard has a separate sign-up URL field, set it to `https://www.trace-li.com/sign-up` (local: `http://localhost:3000/sign-up`). Without an invitation token that page explains that accounts are by invitation.

The product Login link remains `/login`. It is not the Initiate login URL, because a signed-in visitor is sent to the desk. AuthKit must be able to land on `/auth/login` and start a fresh sign-in.

Sign-out no longer returns to `/login`. That path starts AuthKit as soon as the session cookie is gone, so a denied visitor was sent back through the same account. Add both Sign-out redirects above. `/login` can stay in the list, but it is not the return URL the app sends.

Preview deployments need their own redirect URI, matching `NEXT_PUBLIC_WORKOS_REDIRECT_URI`, plus their own initiate, invitation, reset, and sign-out URLs if that preview sends mail. The sign-out URLs are `https://<preview-host>/auth/signed-out` and `https://<preview-host>/auth/switch`. There is no wildcard and no new callback path.

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
pnpm test:pilot-report
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

- Changing Production `TRACE_EXTRACTION_PROVIDER` in this reconciliation. See [extraction-adapter.md](./extraction-adapter.md).
- A tenant table for frozen upload-desk records
- Public case studies, homepage, or film changes
- Rule library workspace productization
- Multi-tenant billing
