# Jev is connected in the private HQ preview

20 September 2026 · Existing task **#54 / HQ-M09** · Connectivity milestone completed; broader integration remains incomplete.

One fixed synthetic request reached direct TypeSafe and returned a validated response. The persisted receipt was read back through the owner-authenticated deployed route; refreshing showed the same result and removed the run control.

| Observed result | Value |
|---|---|
| Start, UTC | 2026-09-20 15:50:55.365 |
| Provider / transport | TypeSafe / direct HTTPS |
| HTTP status | 200 |
| Requested / returned model | `jev-latest` / `jev-1.13.0` |
| Provider request + response processing | 334 ms |
| Reported tokens | 317 input + 21 output = 338 |
| Monetary cost | Unavailable; no price or zero-cost assumption |
| Synthetic question result | `receipt_present`: `noul=0.99` |
| Provider attempts | One; zero automatic retries |
| Policy / human procurement decision | `not_evaluated` / `not_evaluated` |

[Open the protected persisted result](https://traceli-new-git-codex-trace-li-hq-odaykamal-9099s-projects.vercel.app/api/hq/jev-smoke) · [Exact non-secret receipt](M09_LIVE_RECEIPT_2026-09-20.json) · [Input contract](M09_CONNECTIVITY_CONTRACT.md) · [Independent review](M09_CONNECTIVITY_REVIEW.md).

Input hash: `9a6e8cb0cf7fbb8fceb3be0f8ef37f454d1b48f7a6a80e64d45b15f187b042c7`.
Provider JSON serialization hash: `246b96236d4acac0fa4c75e81c237ed3f76f1217340579ef594d764ff8e2f2ea`.
The full decoded provider JSON and its hash remain server-side in the append-only result event; the owner-visible receipt omits that body. This is not a byte-for-byte HTTP capture or a benchmark result.

## Authority and deployment

Oday confirmed the newly saved key and authorized this concrete preview integration and one minimal synthetic/public-input call. Metadata-only inspection found `TYPESAFE_API_KEY` as Sensitive/Hidden in Preview, Production and Development; its value was not retrieved into this workspace, chat or browser. No Gateway credential or SDK was required. No billing/credit/payment change was made.

Code executed at commit `378b9915947b713df62f40fdb4ba62448402a557`, private preview deployment `dpl_AQ53QEt2sP7ridNJXhSwNBPRD4Bo`, READY, existing `codex/trace-li-hq` branch / [PR #21](https://github.com/odaykamal88/traceli/pull/21). The path denies Production and other branches regardless of where a key is saved. No production promotion or global schedule was activated.

## Verification and correction

- 27/27 adapter, route and existing owner-access tests passed; typecheck passed. After the form-policy correction, all 14 focused tests passed again. Vercel built the corrected preview successfully.
- Actual deployed GET verified current owner authentication, the existing preview database and scoped worker-role read, and key presence before any reservation. The underlying storage uses existing HQ events; no migration or new service credential.
- Initial form POSTs returned 403 before reservation. A boolean-only diagnostic showed `originMatches: false`, `fetchSite: same-origin`. `Referrer-Policy: no-referrer` conflicted with the browser's native form Origin behavior. The independent reviewer approved `same-origin` for this page, preserving both strict request checks and owner access. The corrected form then returned 200 and the provider result persisted.
- A unique reservation commits before dispatch and survives replicas/reloads. Uncertain calls cannot retry automatically. Final event `jev-connectivity-20260920-v1-result` is immutable; GET reads it without a model call. No run control remains after the completed attempt.
- The exported input manifest was validated against the exact code fixture and its saved hash. Failed/malformed output, missing usage and provider errors remain explicit; probabilities are never converted into an approved procurement decision.

## Remaining work under #54

The connection gate is complete. Full M02 corpus contract, task-specific question/rubric coverage, M07 deterministic policy handling, human disposition/override and export flow across U/M/G remain to be implemented/reviewed. M08 must be accepted before benchmark scoring or performance claims. One successful synthetic `noul` request does not validate these capabilities or customer data processing.

The narrow input slice and this implementation had independent review in coordinating task `01a0bf44-7e0d-7391-bed8-8d92674bd0bd`. Full M02/M09 acceptance was not inferred. Current authoritative #54 status/checkpoint and the desk receipt record the remaining dependencies; earlier pending reviews remain unchanged.

Protocol references: [TypeSafe API](https://docs.typesafe.ai/api), [Origin behavior](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Origin). No additional chargeable test is required to establish this connection.
