# Independent final review — synthetic Trace workflow

20 September 2026 · reviewer: `technical_review` subagent. The reviewer authored the specification-review and final-review artifacts only, not the application, migration, fixture, export or test implementation.

**PASS for delivery of the complete bounded synthetic/local workflow as a draft PR. No unresolved material findings remain.** This accepts the implemented scope: source-linked retained fictional evidence, deterministic checks, distinct offline model assessment, version-bound human review/override, linked evidence/source revisions, and authorized full/redacted export. It is not acceptance of real rules, customer processing, live WorkOS deployment or production promotion.

## Exact reviewed version

The 45 reviewed code, specification, test and verification files are individually bound in [FINAL_REVIEW_MANIFEST.json](FINAL_REVIEW_MANIFEST.json). Its SHA-256 is `04e6490bbcd71b392d2920ec5ce853e9bf6fcb9843931f1ef213ee76df79e75f`. The manifest excludes this review and itself to avoid circular hashes. A substantive change to a bound implementation or evidence file requires review of the changed content before reusing this disposition.

The accepted M02 contract, field map and UX handoff retain their accepted hashes. The independently accepted narrow implementation specification remains the design authority for this synthetic slice.

## Review and evidence

Inspected the final auth/local-mode policy, server identity resolution, command parser, API routes, proxy integration, workbench and stylesheet, strict schemas, fixture factory and validators, SQL migration, store transactions, export projection, test scripts, CI changes and run instructions. Read the installed Next.js route/server-function guidance and existing tenant/audit architecture before review.

| Area | Result and evidence |
|---|---|
| Identity and command boundary | Pass. Server-derived identity, fresh current-membership checks, removed-role/outage denial, explicit development-only loopback fixture mode, strict bounded commands, origin validation, private/no-store responses and generic errors. Independently reran all 11 access tests against the final code. |
| Evidence and policy | Pass. Exact retained UTF-8 byte hashes remain distinct from canonical snapshot/input/profile/policy hashes. Scoped references are checked on ingestion/read/export; unknown dates and model processing failures remain explicit. Only fixed synthetic bytes enter the feature. Independently reran all 9 contract tests against the final code. |
| Persistence and authorization | Pass for the tested disposable PostgreSQL instance. Inspected the scripts and saved results: 17 persistence groups cover RLS, tenant/procurement boundaries, immutable history, stale/concurrent writes, actor-bound idempotency, rollback/retry, source integrity, export expiry/revocation/recipient/role checks and redaction. These DB results were produced by the implementation agent; the reviewer did not repeat DB writes. |
| Migration and compatibility | Pass. Inspected fresh migration 0001–0010 output, three dedicated preflight/upgrade checks, 14 existing evidence-reader tests and the tenant/audit regression result. Invalid legacy cross-procurement links abort migration; asserted dates and metadata hashes remain unverified rather than being relabeled as byte/legal provenance. |
| Human decisions and export | Pass. Actions bind exact unit/input/policy hashes and sequence, retain rationale and authenticated actor, preserve adverse policy output and require elevated exception authority for overrides. The store validates the immutable decision chain. Exports require a saved decision and bind grant/action/mode/expiry/version; full output includes recipient/purpose, while the allowlisted redacted projection omits identities, rationale and free-text purpose with explicit redactions. |
| Complete browser flow | Pass based on inspection of the executable browser suite and its final 15-check report, with no page errors. Coverage includes missing evidence, immutable U-context revision, review, full/redacted downloads, revocation, stale draft preservation/reload, high-confidence failed-check override, unknown/conflict/model-error states, denied source/origin requests and lost-response retry without duplicate creation. |
| Visual and keyboard behavior | Pass for the observed local fixture UI. Independently inspected final desktop, 320px and 375px captures. Result, reason and next action are clear; history is progressively disclosed, long hashes wrap and controls remain within the narrow layout. Browser evidence verifies skip-link focus and keyboard disclosure operation. This is not a human comprehension study. |
| Build | Pass based on the inspected optimized Next.js 16.3.3 build output, including successful TypeScript compilation and dynamic Trace routes. The build used disabled Trace access; no production migration/deployment is inferred. CI wiring is reviewed, but this document does not claim a future GitHub CI result. |

The final local access/contract rerun passed **20/20**. Saved verification evidence is linked in [VERIFICATION.md](VERIFICATION.md); the checked-in browser report and screenshots byte-match those independently inspected from the browser run directory. `git diff --check` passed at review time.

## Material findings resolved

1. PostgreSQL `CHECK` expressions initially allowed NULL date provenance and JSON scope comparisons. The final predicates require `IS TRUE`, trim required date reasons/bases, bind creator identity and have direct SQL rejection tests.
2. The initial “add signed note” revision silently changed U to M and changed governing source bytes. Evidence-only revisions now retain exact lane, case, source, profile, obligation and pack versions. Explicit source correction is a separate versioned command; repeated evidence revisions preserve the decision-date basis.
3. Initial stored-human-decision validation omitted checks already available in the shared validator. Reads now verify SQL/payload identity and scope, exact hashes, original policy outcome, valid cited evidence, actor/envelope coherence and predecessor sequence; export validates the same chain.

The implementation also aligned the review-before-export rule across UI/server, added an authorization manifest without leaking free-text purpose into redacted output, preserved a pending command key for uncertain network retries, and updated legacy tests to assert the stronger storage guards. No remaining P0/P1/P2 issue was found in the bounded enabled flow.

## Remaining limits

All evidence and rules are fictional and ineligible for real decisions or benchmarks. No official source recovery/admission, customer processing, external model request, renewed paid allowance, benchmark claim, production migration or deployment occurred as part of this verification. Live WorkOS integration has mocked boundary tests, not a live authenticated browser result. No human comprehension study was conducted. Sensitive-payload retention/deletion and backup restoration remain outside the enabled intake scope.

The UI lists 40 recent units; historical authorized reads remain available by ID. Exports reconstruct the current disclosed unit and its human history; prior units are referenced rather than embedded. Downloaded copies cannot be recalled. Retry-key recovery is limited to the current page session. These limitations are documented rather than presented as completed production capabilities.

Real-source/domain requirements for M07/M09, the original M02 human queue disposition, customer permission and production release authority remain separate from this synthetic implementation acceptance.
