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
4. Enable saved-work entry and deploy. Verify a fictional packet through the actual invited session, Talonic, saved/reopened review, human disposition and PDF. Check anonymous boundaries and the authenticated daily job.
5. Keep the cron configuration active if the UI rollout is disabled. Disabling a feature must not disable its approved retention cleanup. Schema rollback is not a data recovery mechanism.
