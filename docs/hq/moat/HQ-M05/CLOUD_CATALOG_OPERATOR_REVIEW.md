# Cloud catalog and operator review supplement

2026-09-21T08:00:28.099Z · Reviewer: gulf_inventory · Runtime/operator author: coordinating agent. This supplement leaves the producer inventory and independent M05 audit unchanged.

**PASS for the exact Saudi/UAE catalog and bounded operator script below.** No remaining material findings in this scope. This does not replace the separate runtime/SQL review or verify a live cloud result.

| File | SHA-256 |
|---|---|
| workers/hq/source-collector.mjs | `62270cb590559e75e499c047da56b93bebf1d37cfc4cf37ad65e898fdfcf839a` |
| scripts/hq/source-admin.mjs | `ce6ad51a373c5fcf346d60fb0bf8d5f8a8627fda4342324b97641e1c910012ab` |

The collector's Saudi base-law URL and SHA-256 exactly match retained M05 source `ksa-law-ncgr` (893,363 bytes); the UAE entry now correctly uses the **Arabic Federal Law 11/2023**, source `uae-law-ar-mof` (1,379,542 bytes). Both hashes were independently recomputed from originals and both objects are below the 4 MiB limit. No English regulation or UAE guide is silently represented as the Arabic law. This is the final catalog selection for these two entries; prior candidate suggestions are not dispatch evidence.

Operator review found two issues, reported to the author and corrected before this disposition:

- Captured Railway CLI error output or invalid URL parsing could expose credential values through an uncaught error. The author added generic catches. An independent local harness executed the exact revised catch snippets with synthetic secret-bearing errors/invalid URLs; neither final error exposed the marker. No real credentials were read for the harness.
- Migration DDL previously committed before its migration-journal insert, leaving a crash window. The revised operator strips the reviewed SQL's outer transaction and performs DDL plus journal insert under one transaction, with an advisory transaction lock and an in-lock checksum recheck. The reviewer verified the stripped SQL body has no remaining top-level BEGIN/COMMIT. This is static verification; no database migration was executed by the reviewer.

Also checked: the environment-file path is caller-provided; database binding compares the configured runner and admin host/database and requires verified TLS; provisioning restricts task IDs to 49/50, uses fixed catalogs and parameterized statements, and checks any existing manifest; readback emits source metadata rather than raw source bytes; operator code is excluded from the worker deployment file list. Existing expiration/manifest differences do not automatically authorize replacement jobs.

No operator command, credential lookup, queue mutation, provider call or cloud source request was made by this review. Original-language source/domain review, edition/currentness and actual cloud execution receipts remain separate.
