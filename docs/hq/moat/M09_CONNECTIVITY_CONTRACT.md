# M09 connectivity contract v0.1

20 September 2026. Narrow M02 prerequisite for one synthetic connectivity test; not acceptance of the full corpus schema, benchmark protocol or procurement policy.

Owner: Builder. Independent reviewer: coordinating planning task / Supervisor. Authority: Oday confirmed the saved TypeSafe key and authorized one minimal synthetic/public-input live smoke test. Direct TypeSafe transport selected. Metadata confirms Sensitive keys in Preview, Production and Development; values are neither retrieved nor exported. The executable verification path is preview-only.

Input envelope: `version`, `case_id`, `classification` (synthetic/public only), `source_ids`, `requirement_ids`, and a bounded native request (`model`, text `state`, 1–5 typed questions). Stable IDs and the SHA-256 of the complete envelope bind the receipt to the exact packet. The exposed route accepts only its baked-in fixture identifier, never a supplied packet, URL, model or credential.

Fixture: SYN-JEV-001; synthetic evidence says a receipt is present and a signature is absent. Ask one `noul` question about the explicitly present receipt. This measures connection/shape preservation only. The probability is not converted to a Boolean procurement approval.

Adapter: fixed `https://api.typesafe.ai/v1/systemone`, server-only bearer key, `jev-latest` requested and exact returned model saved, 15-second deadline, zero automatic retries, bounded response size. Validate keyed noul/choice/score types; reject missing/extra answers, invalid distributions, unknown choices, malformed usage and incompatible score/legend values. Noul remains a probability; scores may be fractional. Missing usage is explicitly unavailable. Invalid/missing output remains an error, never a clear/approved decision. No provider fallback.

Receipt: provider, transport, requested/returned model, contract version, complete input manifest/hash, time/latency, HTTP status, normalized results with distributions/confidence, reported usage or unavailable marker, monetary cost unavailable, raw successful response/hash retained server-side. Error bodies and exception strings are not persisted or logged. Any response containing the credential is discarded. The owner-visible view omits raw provider bodies. Policy disposition and human procurement decision remain `not_evaluated`.

Controls: verified current HQ owner membership; exact Preview environment and existing `codex/trace-li-hq` branch; same-origin POST with a fixed fixture ID; no execution from GET. An append-only reservation in existing scoped HQ events commits before the request and permits only one attempt for this approval. Concurrent/repeated clicks, timeout or interrupted persistence cannot retry automatically. Fail closed if identity, storage or key is missing. A successful/failed receipt is a second immutable event; a reserved attempt without a final receipt stays `unknown` for review. No schema migration, new service credential, schedule or production activation.

Checks: input rejection, all three answer types, fractional score, missing/malformed probabilities/answers/usage, HTTP authentication/budget/throttle errors, timeout, credential redaction, preview/owner/origin gates, durable reservation and repeated-call suppression. Full M02/M07/M08 and M09c remain outstanding.

Official contracts inspected: [TypeSafe API](https://docs.typesafe.ai/api), [quickstart](https://docs.typesafe.ai/introduction/quickstart). Documentation lists response model/usage; absent usage is recorded as unavailable, not invented.
