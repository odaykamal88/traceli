# Website and Trace reconciliation — 21 September 2026

## Finding

The public domain was serving current main `96c9ff095f89d64a60cd3bcddc946aab2a7078fb` through Vercel production deployment `dpl_5XbyYoXUs2V2ZLcNv9kE24N9NAjK`, created at 13:07 UTC on 21 September. The public `/demo` route still rendered the older `TenderWorkbench`. The newer synthetic Trace workflow had merged in PR #23 but remained behind the separate, disabled-by-default `/workspace/trace` route. This was a missing public product connection, not a stale domain alias.

The original working directory was also behind production, at `be40b4b`, with substantial unrelated local and staged work. Repairs were isolated from current main rather than deploying that older directory.

## Public release scope

- `/demo` becomes the current fictional Trace walkthrough: inspect supplied evidence and rule, distinguish deterministic checks from an offline model assessment, add a signed-note evidence revision, simulate a reasoned human review, and download a clearly labelled demonstration record.
- `/demo/classic` retains the previous procurement walkthrough. Its fixed August date no longer masquerades as today.
- Public documentation explains what visitors can try now and which private/customer capabilities remain gated. It uses the already reconciled OIOS source locator.
- Production smoke checks distinguish the new demo from the classic one, inspect research/docs availability, and verify anonymous Trace API denial.

## Data and access boundary

The public demonstration has fixed fictional sources and no uploads, provider calls, authenticated actors, database writes or durable human decisions. Review notes remain in tab memory and the user-selected download. The public export format is distinct from the protected Trace export. Source-byte matching is not an assertion of legal authority or real-source custody. Demo records remain ineligible for real decisions and benchmarks.

Protected Trace authorization, tenant isolation, export permissions and runtime feature flags are unchanged. No database migration or production Trace activation is part of this release. Positive hosted WorkOS verification, official-rule admission, customer permissions, retention and restoration remain governed by [the pilot-readiness record](PILOT_READINESS_2026-09-21.md).

## Verification and release

- `pnpm test:trace`: 24 contract, access and public-demo checks passed, including independent source/snapshot hash reconstruction, immutable evidence revision and version-bound export.
- `pnpm typecheck` and `pnpm build`: passed; `/demo` and `/demo/classic` are statically generated.
- Expanded `smoke:production` against the production build: passed for public demo, classic demo, documentation, research, video ranges, workspace redirect and anonymous Trace API/export denial.
- Independent code review: no remaining actionable findings.
- Browser verification script: `scripts/trace/test-public-demo.mjs`. Use `PUBLIC_DEMO_TEST_URL` and an installed `PLAYWRIGHT_MODULE`; the script performs public UI actions only and independently validates downloaded hashes. The release task retains desktop and 320/375px screenshots and the check report.
- Before release, both published research articles and the booking destination returned 200; the replacement OIOS URL returned 200 with PDF content type.

The final live deployment and post-release browser result are attached to the release pull request/task.
