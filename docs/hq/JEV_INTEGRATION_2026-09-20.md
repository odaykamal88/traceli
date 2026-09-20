# HQ-M09: Jev API integration

20 September 2026 · Planning amendment following Oday's explicit reminder to include Jev through TypeSafe or Vercel · Priority P0 · Owner: Builder; method: Product Steward; independent review: Auditor.

This is an explicit integration work package within the [moat program](MOAT_PROGRAM_2026-09-20.md), extending the earlier spike-only description. Plan and register the implementation now. Select and connect one transport first; preserve a provider-neutral boundary so a second route can be added without rewriting policy or stored decision records. The current handoff remains planning/intake; actual activation uses the applicable credential, data and budget authorization.

## Verified routes

Official documentation checked on 20 September 2026:

| Route | Documented interface | Planning implication |
|---|---|---|
| Direct TypeSafe | `POST https://api.typesafe.ai/v1/systemone`, bearer API key; native `noul`, `choice`, `score` questions. [Quickstart](https://docs.typesafe.ai/introduction/quickstart) | Oday reported existing TypeSafe access in the source conversation. Confirm usable API access in the intended environment; playground access alone does not establish a deployed credential. |
| Vercel AI Gateway, AI SDK | AI SDK 7+ experimental evaluation API with model `typesafe-ai/jev`; boolean, choice and score questions. [Evaluation quickstart](https://vercel.com/docs/ai-gateway/getting-started/evaluation) | Confirm compatible Node/SDK versions and available Gateway authentication/credits. Pin a tested dependency version in an isolated implementation checkout. |
| Vercel AI Gateway, TypeSafe-compatible transport | Base URL `https://ai-gateway.vercel.sh/typesafe`; `POST /typesafe/v1/systemone`; Gateway API key or Vercel OIDC authentication; native TypeSafe request/response shapes. [Compatibility documentation](https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe) | An existing TypeSafe client can retain its question format while changing base URL and credential. This is an alternative Gateway integration route, not a second model. |

The current official Gateway documentation supports HTTP and TypeSafe-compatible routes as well as AI SDK evaluation. Do not perpetuate an older “SDK only” assumption. TypeSafe calls its yes/no primitive `noul`; the AI SDK route calls it `boolean`. Normalize intentionally at the adapter boundary.

Transport choice should follow verified existing access, deployment fit, data terms, dependency effort and measured cost/latency. Existing TypeSafe access makes direct access a useful first candidate; existing Vercel hosting makes Gateway a useful candidate. There is no need to activate both to complete the first integration. Credential values belong in server-side secret storage, never source, browser payloads or chat.

## Deliverables and dependencies

1. **M09a: route and access readiness.** Start during M01, alongside corpus intake. Record available credential references, selected route, verified contract/model identifier, installed versus required packages, data-handling terms, applicable budget and remaining gaps. No wait for the full corpus or all policy profiles. This checkout's package.json currently has neither `ai` nor `@typesafe-ai/sdk`; verify the actual implementation checkout before changing dependencies.
2. **M09b: connected public-data prototype.** After M02's packet contract is reviewed, implement the server-only adapter with input/output validation, bounded timeouts/retries, usage/latency capture and preserved raw provider response. Demonstrate at least one authorized live call; otherwise label connectivity unverified and retain offline fixtures. Connect a small set of explicit questions: evidence presence, satisfaction status, material gap, unresolved ambiguity and record defensibility.
3. **M09c: complete Trace workflow.** Connect evidence/requirement IDs → Jev results → consistency and constraint checks → human disposition → override reason → persisted audit/export record. M07 defines policy handling. Exercise one public/sanitized packet per U/M/G lane. M08 must be accepted before scoring benchmark results or publishing performance claims. Never require 100 cases before making the first connectivity test.

Store the transport/provider/model identifier returned or requested, unavailable-version marker where relevant, exact question/rubric version, input manifest/hash, source/requirement IDs, all returned distributions and confidence fields, policy version, disposition, reviewer decision, override/rationale, timestamps, usage/cost when measurable and later outcome references. A rerun is a linked evaluation of the same decision unit.

## Acceptance

- Successful connection has an actual response receipt, without exposing credentials. A configured key or SDK install is not a successful API integration.
- Direct/native and AI SDK shapes are normalized and validated without collapsing “unknown” into false or silently converting malformed probabilities to zero.
- Missing inputs, invalid output, timeout, authentication failure and exhausted budget have explicit states and cannot produce a clear/approved procurement result.
- Model results pass through Traceli's applicable deterministic constraints. Confidence does not override a mandatory control or authorize an exception. The initial workflow retains human procurement decisions.
- Contradiction checks compare semantically compatible questions; individual question disagreement is preserved for review rather than averaged away.
- Provider/transport changes are versioned and reevaluated. No silent fallback to another model during a benchmark run.
- Reviewer override and acceptance are persisted with provenance, and the exported Trace can reconstruct what was supplied, returned and decided.

Return a selected-route decision, implementation/check results, actual call receipt where authorized, and the remaining activation/deployment dependency. This task has not installed a package, created credentials, activated billing or made a model call.

## Implementation follow-through — 20 September 2026

After Oday confirmed saving `TYPESAFE_API_KEY`, HQ verified hidden secret entries for Preview, Production and Development without retrieving their values. Direct TypeSafe HTTP is the selected transport. The preceding planning-only statement records the original handoff; the following is the subsequent connectivity milestone.

The server-only adapter and fixed synthetic preview test were implemented in the existing HQ branch and independently reviewed by the coordinating task. Adapter/access/route checks passed (27 tests), with focused checks repeated after correcting the form's Referrer-Policy; typecheck and repository CI passed. The test retains exact owner, preview/branch and origin checks, bounded input/output, a 15-second deadline, no automatic retries, and a durable one-attempt reservation. This accepts the narrow synthetic connectivity contract only, not full M02 or procurement policy.

HQ's deployed receipt records **HTTP 200 at 2026-09-20T15:50:55.365Z**, requesting `jev-latest` and returning `jev-1.13.0` in **334 ms**, with **317 input / 21 output tokens**. One provider attempt was made. Reported monetary cost is unavailable. The synthetic receipt-presence question returned `noul=0.99`; policy disposition and human procurement decision remain `not_evaluated`. Raw response hash: `246b96236d4acac0fa4c75e81c237ed3f76f1217340579ef594d764ff8e2f2ea`.

Code: commit `378b9915947b713df62f40fdb4ba62448402a557` in [existing PR #21](https://github.com/odaykamal88/traceli/pull/21). Verified preview deployment: `dpl_AQ53QEt2sP7ridNJXhSwNBPRD4Bo`. [Private saved connection receipt](https://traceli-new-git-codex-trace-li-hq-odaykamal-9099s-projects.vercel.app/api/hq/jev-smoke).

Task #54 remains incomplete: the general reviewed evidence-packet workflow, constraint/policy handling, human disposition and export remain M09b/c work. The successful test establishes preview connectivity; it does not activate production Jev processing or establish procurement performance.
