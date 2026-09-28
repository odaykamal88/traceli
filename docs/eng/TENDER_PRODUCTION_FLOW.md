# Managed tender production flow

Owner-approved scope, 28 September 2026: new tenders in explicitly admitted organizations use 30-day retention. Directors and workspace admins may delete a whole managed tender. A daily job removes expired tender evidence, reviews, records and related metadata. Existing records remain outside this policy.

## Behavior

The saved workflow is creation → packet → saved review → assessment → human disposition → verified record/PDF. Initial extraction now immediately saves the first review; receipt-only recovery offers the latest retained packet. Next-open-item navigation moves keyboard focus to the next unresolved review item. Policy responses are validated before the browser permits intake. Every tender pins its classification, pack, processing notice and expiry. Packet/manual uploads are limited to 4 MiB to fit the hosted request limit with multipart overhead.

Hosted intake requires an operator-maintained organization allowlist. Sanitized customer intake additionally requires the exact 30-day configuration, versioned provider disclosure and Talonic route. Identity and current organization come from verified WorkOS membership. The protected setup page shows the current organization reference to its workspace admin for support; it cannot activate an organization.

Source file bytes are not retained by Traceli. Extracted values, bounded quotes, file/manual metadata, review revisions, records, audit/outbox metadata and export receipts are part of the managed tender graph. At expiry, application reads, writes and exports close immediately; physical removal follows the next successful daily cleanup. The daily batch processes at most 25 tenders per configured organization. Minimal deletion receipts expire after a further 30 days. Downloads already taken are outside this deletion path. Hosting backups and Talonic retention are separate and are not established by this policy. Sensitive customer files are outside this rollout.

Legacy tenders have no newly assigned expiry or deletion eligibility. Immutable evidence still rejects ordinary mutation. A dedicated non-login role owns narrowly scoped purge functions, cannot bypass row isolation, and is not granted to the application role. Unsupported cross-domain references cause a complete rollback rather than partial deletion.

## Verification before activation

- Tender request, state, policy, environment and cron boundary suite: 31 passed.
- Existing database workflow/isolation suite: 22 passed; current WorkOS grant negative check: 1 passed.
- Retention lifecycle suite: 13 passed, including restricted login-role checks, expiry access, legacy preservation, graph removal, concurrent issuance, receipt expiry and atomic failure.
- Atomic migration runner: 3 passed.
- Production-order rehearsal: 3 passed. The observed ledger (0001–0009 plus 0011) accepted 0010/0012/0013 atomically, preserved original legacy source fingerprints and replayed as a no-op. A separate pre-0013 tender retained its payload/timestamps and acquired no expiry. Oversized manual metadata was rejected.
- Desk/reviewer regressions: 22 passed. Report regressions: 8 passed.
- Type checking, production compilation and diff checks passed.

Database and extraction checks above use disposable local fixtures, including mocked Talonic. Live provider and production browser verification are recorded separately in release evidence; these checks alone do not establish extraction accuracy or customer readiness.

## Local browser evidence

Created a fictional Global Fund tender, selected its 30-day notice, uploaded the synthetic PDF through the browser, and observed the initial review saved as revision 1. Next open item moved keyboard focus to the first unresolved row. Issued an assessment and a Request evidence disposition, refreshed, returned through My work and reopened the retained human decision. Prepared and downloaded a valid three-page PDF (6,845 bytes). The in-app browser download-event listener timed out, but the downloaded file was present and parsed successfully. The final UI exposes an explicit prepared-download link with bounded in-memory lifetime.

## Deployment packaging

The deployment ignore rule is anchored to the repository-root `/work/` scratch directory. It must not omit application routes under `app/work/`. The secret-scan exclusion names only the historical fingerprint of a fictional cron test constant; no live credential or entire file/path is excluded.

## Release sequence

1. Apply the reviewed additive migrations through the atomic runner; compare the old source-history fingerprint and row counts before/after.
2. Deploy the candidate with saved-work rollout disabled. Verify the signed-in admin's current organization through the protected setup page.
3. Provision only that verified organization if absent. Configure its explicit admission, CRON_SECRET, and approved processing policy. Never infer admission from another tenant or the HQ preview organization.
4. Enable saved-work entry and deploy only after production identity and the customer processing policy are ready. Verify an authorized real, sanitized procurement packet (or a suitable real public procurement document) through the production session, Talonic, saved/reopened review, human disposition and PDF. Keep regression fixtures confined to automated checks; they are not evidence of real-world acceptance. Check anonymous boundaries and the authenticated daily job.
5. Keep the cron configuration active if the UI rollout is disabled. Disabling a feature must not disable its approved retention cleanup. Schema rollback is not a data recovery mechanism.


## Real-world activation status — 28 September 2026

The owner clarified that this rollout is for real procurement work. WorkOS Production is now active, and the website uses production client `client_01M0SG5FRTWQ8ZWVG82AC72R3Z`. Its real organization is **Traceli HQ**, `org_01M3KPP7CN81TAVMNG4MEGAAB9`. After explicit owner approval, `oday.kamal@gmail.com` received one active `workspace-admin` membership. The owner's email is verified, and a hosted WorkOS session was established at `2026-09-28T12:03:37Z`. The corrected-key deployment `dpl_BrcqJAN7RUoDgRfaQEFQas9beQvj` then established a successful production Traceli session as Workspace Admin. No verification flag was set administratively.

Production has the five application roles and six permissions matching the reviewed access model. Default Member privileges were not expanded. Callback, initiate-login, invitation/reset and logout destinations are configured for the production website. Public signup is disabled; Magic Auth is enabled and MFA is optional. The initial callback was blocked by expired 10-minute sign-in state, then by `invalid_client` from the stale staging `WORKOS_API_KEY`. The owner saved the complete production key as `WORKOS_API_KEY2`; an authenticated CLI operation securely transferred it in memory to the SDK's required `WORKOS_API_KEY`. Both entries are stored as Secrets in Vercel. No key was printed or persisted locally.

The matching database organization row was provisioned without copying staging data. The original legacy organization's procurement, source-document, source-version, requirement and finding counts remain two each. The original source-history fingerprint is unchanged. The earlier database label `Relief Operations` belongs to WorkOS's staging `Test Organization`, and `Trace-li HQ Preview` is also staging. Neither is admitted by the production customer policy.

Only the real production organization is in the intake and retention allowlists. Saved work is enabled with the approved 30-day customer policy and an explicit Talonic processing disclosure. Customer intake remains limited to irreversibly sanitized material; provider retention and hosting backups remain separate from the application policy.

After application sign-in, `TRACELI_TENDER_WORKSPACES` was found absent from production. Its approved value `1` was restored and deployment `dpl_tdBUSde8uKCB7ujgLmd59do6kS8p` became READY at `https://traceli-l5afd74ql-odaykamal-9099s-projects.vercel.app`, aliased to `www.trace-li.com`. Anonymous tender list, policy and detail requests return generic 403 responses; the unauthenticated retention endpoint returns 401 and `/work` redirects with 307. The earlier authenticated retention run returned 200 with zero deletions, zero expired receipts and zero failures.

The live acceptance document is the genuine public [UNFPA Fiji RFQ 2024/024](https://pacific.unfpa.org/sites/default/files/submissions/rfq_no_unfpa_fji_rfq_2024_024.pdf): 1,077,507 bytes, 13 pages, SHA-256 `b167d7d41f28067fcb958902def4e2271829d0c49828e61327d125493a742f8f`. It is a public solicitation, not a submitted customer bid or evidence of a customer relationship. Tender `8174da2c-fa41-42d2-b35b-8ea0bf495e31` was created at `2026-09-28T12:57:45.110Z`, expires at `2026-10-28T12:57:45.110Z` (exactly 720 hours), and pins policy `customer-30d-2026-09-28-9abcac7c7897b2194e1ce81c`.

The first live upload returned a generic 400 “required fields” response. Its actual cause remains unknown because provider failures were flattened into that response; a timeout has not been established. Retrying the real file through Talonic succeeded with packet receipt `79f54e87-003a-424f-b199-eb7cf7d1a136` and the matching original file hash. Its initial review automatically saved as revision 1. A review confirmation that conflict-of-interest evidence remains missing automatically saved as revision 2. All 27 pack award controls remain missing, consistent with a solicitation that contains no actual bids; missing evidence is not a negative finding.

Assessment `45fafab0-fe64-4364-972a-ff37aeadde63` was issued, followed by a Request evidence human judgment at `2026-09-28T13:24:46Z` with an explicit public-solicitation qualification and no award claim. My work showed the decision record and reopened it. Read-only database checks under `traceli_app` confirmed the production tenant, pinned policy, source hash and revision lineage; the original legacy counts and source-history fingerprint remain unchanged. The first live decision PDF downloaded successfully: four pages, 7,804 bytes, SHA-256 `6ff9350e4a56c0d4261b21ea4b94d7e4c49edd00532149e588942b3894186fc1`. All four rendered pages show customer-record footers without fictional-fixture labels. The PDF preserves the qualified evidence-request rationale, source-file hash and expiry. Its hash matches export receipt `305b5fe7-518e-4397-bf7a-2917bba90a23`; both issued records and both review revisions passed tenant-scoped lineage checks. This verifies the real public-document workflow, not extraction accuracy for a completed bid or award file.

The follow-up HTTP error fix preserves extraction categories and actionable safe messages without exposing provider bodies or credentials. Its 39 tender checks and type checking passed; the original generic response alone does not identify the earlier provider failure.

Customer PDFs derive their classification from retained evidence, show a customer footer on every page, and contain no unconditional fictional-fixture label. Missing, unknown or inconsistent classifications reject export. Synthetic reports remain explicitly marked. Rendered PDF regression checks cover assessment, human judgment and exception-proposal records, including all page footers; regression fixtures are not evidence of real-world acceptance.

The real report review prompted two presentation corrections: opened records now display their retained outcome and reason, and PDF evidence values are plain text with ordinary rows kept together across page boundaries. Missing and negative evidence remain distinct. Rendered report regressions include multi-page rows and oversized values; these presentation changes do not alter the saved evidence or judgment.
