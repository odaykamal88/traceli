# MDB source inventory — World Bank and ADB

21 September 2026 · HQ-M04 / task #49 · draft for independent source review.

**Five official PDFs are retained and hashed:** one World Bank IPF regulations bundle and one ADB bundle covering its policy, current directive, current technical instruction and legacy regulations. This is a completed bounded inventory, not an admitted rules corpus. All project applicability remains **unknown** until the governing project records and qualified review establish it. [SOURCES.json](SOURCES.json) carries exact URLs, locators, date facts, custody, hashes and limitations under the accepted [M02 contract](../../HQ-M02/drafts/DECISION_CORPUS_CONTRACT_V0_1.md).

## Sources and version findings

| Source | Verified metadata and locator | Use boundary |
|---|---|---|
| [World Bank IPF Regulations](https://thedocs.worldbank.org/en/doc/c84273d1b230aeb2b0b8134de5dc8cd7-0290012025/original/Procurement-Regulations-7th-Edition-Sep-2025.pdf) | Seventh Edition, September 2025; cover and PDF p.2. Official framework currently links this edition. | Publication month is not a universal effective date. Agreement, funding type, procedure dates, procurement plan/PPSD and overlays remain missing. Applicability: PDF p.23, printed p.3, §§2.1–2.3. |
| [ADB Procurement Policy](https://www.adb.org/sites/default/files/institutional-document/1144596/adb-procurement-policy.pdf) | Published 2017, PDF p.3; dedicated publisher page dates it October 2017 and identifies concept notes approved on/after 1 July 2017. | Financing agreement and borrower scope: PDF p.4, printed p.1, §§1–2 and footnote 2. No project has been mapped to it. |
| [ADB Procurement Directive](https://www.adb.org/sites/default/files/institutional-document/1144641/procurement-directive-adb-borrowers.pdf) | January 2026; §1.1 and footnote 1 on PDF p.9, printed p.1, establish supersession of the Regulations and reference transition from 1 January 2026. | Agreement-dependent scope and financing exclusions: PDF pp.9–10, §1.3 footnote 3 and §§2.1–2.4. Transition still requires domain review for the selected project. |
| [ADB Technical Instruction](https://www.adb.org/sites/default/files/institutional-document/1144631/technical-instruction-borrower-administered-procurement.pdf) | Effective **1 September 2026**, PDF p.1, Section I §1. Sovereign-operation scope: §2. | Dedicated landing agrees with the PDF; the framework’s Technical Instruction card still says January 2026. Preserve this discrepancy and obtain any required predecessor/transition evidence. |
| [ADB legacy Regulations](https://www.adb.org/sites/default/files/procurement-regulations-adb-borrowers.pdf) | 2017 publication, PDF p.3; exact intermediate amendment state unverified. | Historical evidence only. Old landing redirects to the Directive; these legacy bytes were retrieved separately. Not the current default. |

All five are official English publications; Traceli produced no translation. ADB’s pre-July-2017 guidelines and World Bank project-specific earlier editions remain outside this first bundle.

## Custody and reuse

Original PDFs and HTTP headers are retained outside git at `/private/tmp/traceli-source-bytes/mdb/`. Four official HTML metadata pages are also retained. The manifest records full SHA-256 hashes, byte lengths, retrieval times, MIME types and page counts. All nine final downloads returned HTTP 200; the first default-sandbox World Bank request failed DNS resolution before a permitted network retrieval succeeded.

This is **temporary local custody**, not durable approved storage or cloud execution. A hash proves the saved bytes’ identity, not legal applicability or completeness. Neither originals nor full extracted text are redistributed in this repository. Reading aids remain alongside the temporary originals.

World Bank PDF p.2 permits attributed noncommercial reproduction without modification. ADB Policy/Regulations PDF p.3 and Directive PDF p.4 state CC BY-NC-ND 3.0 IGO, with third-party exclusions. The Technical Instruction’s explicit license remains unverified. **Commercial corpus use, derivative rule extraction and redistribution are not cleared by this intake.** Resolve the intended use and permissions before admission.

## Next action and acceptance

1. Independently review this exact inventory, manifest, source bytes and cited locators; then obtain qualified domain review for a selected project.
2. Supply the agreement, financing and entity scope, concept/procedure dates, procurement plan and relevant overlays. Keep applicability unknown until resolved; no universal donor-over-local precedence is assumed.
3. Resolve reuse and durable custody; check amendments/corrigenda and necessary earlier regimes. Extract a bounded clause batch only after those source gates are satisfied.

Five PDFs parsed; hashes and metadata were checked. Relevant date/scope pages were read and rendered. No obligations, rule profiles or benchmark cases were admitted; no provider API was called; no queue, publishing or production action was performed by this inventory producer. Cloud delivery must have its own execution receipt.
