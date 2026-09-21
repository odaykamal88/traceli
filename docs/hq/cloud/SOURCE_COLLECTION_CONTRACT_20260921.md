# Bounded cloud source collection — 21 September 2026

Oday authorized proceeding with cloud execution, the MDB/Gulf inventories, pilot verification and housekeeping in the current task. This increment uses the existing private Railway preview service and existing hosting allowance. Model calls: zero. It does not authorize production promotion or real-rule admission.

## Concrete milestone

A Railway invocation retrieves a specifically approved official document, verifies the downloaded bytes against the independently captured source digest, saves the original bytes and an immutable source inventory receipt in Postgres, stops at review, and displays the source URL, size, digest and unresolved applicability in authenticated HQ. A manual first invocation and a scheduled invocation are recorded separately.

## Authority and bounds

- Supervisor provisions one fixed job under the existing runner identity, naming original task 49 or 50, the exact claim/reference, authorization window and reviewed manifest. Runner cannot add jobs, change manifests, approve results or access procurement data.
- Runtime URL allowlist is code-owned, immutable and exact. Only HTTPS, default port, no credentials/fragments, no redirects or cookies; only identity content encoding. All returned DNS addresses must be public, and the TLS connection pins one validated address while verifying the original hostname. Maximum four PDFs, 4 MiB each and 45 seconds per request. The collection deadline is the earliest of 100 seconds, remaining lease minus 15 seconds, and the overall worker deadline minus 15 seconds; this reserves time for atomic submission even after connection delays. Reject wrong MIME/signature, oversized data and digest mismatch; preserve failure as missing/unverified evidence, never a negative procurement finding.
- Public source bytes remain private in the HQ evidence store. No public source publication, arbitrary document upload, executable extraction, provider calls or customer-data intake.
- Claim is serialized under the runner binding. Two-minute leases; at most two attempts per authorized job. An expired attempt stays visibly expired. A later tick may recover once; valid completed submissions replay the exact saved artifact without downloading again. Revocation/policy pause and expired authorization stop claim/submission.
- Successful submission checks the lease, immutable manifest digest, exact source IDs and hashes, server-side decoded byte hashes and limits. Source rows, summary artifact and run/job transition commit atomically. No partial result is a completed job. Each expected source receives a success or bounded failure status. A partial inventory stops at review.
- HQ reads summary metadata through its existing restricted reader. Retained raw bytes are not exposed to the dashboard or logs. No secrets in inputs or receipts.

## Review and verification

Independent technical review precedes preview rollout. Meaningful checks cover denied roles, unauthorized jobs, wrong tenant/lease, concurrent claim, pause/expiry, malformed results, changed-byte rejection, source immutability, transaction rollback/lost-response replay and expired-run recovery. Runtime checks cover URL/DNS/redirect/MIME/byte/time bounds. A successful cloud run must be read back through the restricted HQ snapshot and its exact stored hash.

Source collection establishes provenance and retrieval, not current legal applicability. Official editions/amendments, financing/entity scope, translation limits and qualified domain review remain explicit in the associated M04/M05 inventories. Real rules remain drafts.
