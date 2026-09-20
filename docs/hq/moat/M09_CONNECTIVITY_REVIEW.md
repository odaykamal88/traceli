# Independent M09 connectivity review

20 September 2026 · Reviewer: coordinating planning task `01a0bf44-7e0d-7391-bed8-8d92674bd0bd`, separate from the implementation producer.

Disposition: cleared for the single fixed synthetic preview connection test, after passing fixtures and a deployed owner/storage GET preflight. The narrow input contract is accepted only for that test. Full M02 corpus, M07/M08 policy/benchmark and M09c workflow remain unaccepted.

Reviewer inspected the contract, adapter, route, reservation, existing owner policy/database schema and both fixture suites. Required one fix: detect an escaped credential in parsed JSON before preserving raw output. Implemented with a regression fixture; no remaining blocking findings reported. Error/unknown responses cannot authorize procurement, GET cannot generate, exact preview/branch and active owner gates apply, and a durable reservation commits before fetch. Interrupted/uncertain calls consume the allowance without automatic retry.

Validation: 27/27 tests pass across new adapter/route suites and existing HQ access suite; typecheck passes. Includes probability/choice/fractional-score semantics, invalid output, missing usage, provider errors, timeout, plain/escaped credential redaction, origin/owner/preview gates, duplicate/concurrent suppression and uncertain reserved attempt. Actual storage and provider connectivity are not established by mocks; those checks follow in the live receipt.

Reviewed file hashes:
- `docs/hq/moat/M09_CONNECTIVITY_CONTRACT.md`: `2635199a83a07cb6cd66f6fd8b3526f6612bd6e22add1106463c90fc2116d468`
- `lib/hq/jev.ts`: `f78e94dbc263160e28c3f1976cd58e76c2d5322c1135527fb7eba7e28832b03d`
- `lib/hq/jev-smoke.ts`: `ec4b4cd2036099cab5a5786708a73fe6e4564c5413c84dfc0efe100511c90618`
- `app/api/hq/jev-smoke/route.ts`: `849033306d7e0d5a3f914a74c700d2521dca9a8773a4db3d680abdd1f26a4f9c`
- `scripts/hq/test-jev.mjs`: `6e6593b91e867b08f195d26dba1b5a229d7b9b2fadc4052979d85f494b341265`
- `scripts/hq/test-jev-smoke.mjs`: `a7645f7b1a1027527086774a221f3b05b35cc05081c6784e0a002e8248757c58`

Authority: Oday confirmed the saved TypeSafe key and authorized the concrete preview connection plus one minimal synthetic/public-input smoke test, relayed by the coordinating task. No billing, new payment settings, private-data processing, global schedules or production promotion.
