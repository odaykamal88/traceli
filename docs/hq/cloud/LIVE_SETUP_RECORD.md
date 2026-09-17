# Cloud setup checkpoint · 17 September 2026

This is a dated Supervisor setup record, not a claim of a live model result. Reviewed source commit: `2014eebdf7e9b0dab11b13ad8dacf6d25a51fd1a`.

- Oday approved the $20/month pilot: $10 hosting, $8 model API, $2 contingency. Approval reference: `oday-hq-pilot-2026-09-17`.
- Owner-authenticated HQ runs on the private Vercel preview; production website remains on its previous release.
- Neon pre-production has checksum-recorded HQ migrations 0003 and 0004. Separate runner and reader logins cannot read procurement records, job tables or policy tables. The reader can obtain only the redacted cloud snapshot. Runner identity and spending policy are paused.
- Railway project `traceli-hq-preview`, environment `preview`, service `hq-readiness-brief` completed deployment `649268b7-e3e0-4f51-8299-abc01e94d922`. Its process logged `disabled`; no model call occurred. Actual service settings read one replica, no cron, restart `NEVER`, zero retries. No public domain is configured.
- The worker database secret is stored only in Railway; the reader secret is stored only in Vercel branch Preview. The API key handoff remains outstanding at this checkpoint.
- OpenAI project `Trace-li HQ Pilot` has a verified $8 hard spend limit. The billing page shows $8 available credit; automatic recharge is verified OFF. Railway remains on its $5/30-day trial. A paid hosting cap is not yet available without a subscription.
- A successful first cloud run must save an immutable source-linked draft, token usage and cost reservation to Postgres, stop at review, and be visible to the authenticated HQ owner. No paid API run or accepted cloud output is established by this record.
- All A–G workstreams have charters/queues and reviewed initial internal outputs. Their ongoing customer/distribution work is not complete. Six existing desktop schedules have not been cut over; this pilot is not yet a complete laptop-independent company.

Next evidence: direct key handoff, one bounded cloud run, independent source review and hosted readback. Recurrence and any desktop replacement follow that evidence. Consequential sends, publication, production changes and customer-data processing remain approval-gated.

[Funding](FUNDING_APPROVAL.md) · [Pilot factsheet](../CLOUD_WORKER_PILOT.md)
