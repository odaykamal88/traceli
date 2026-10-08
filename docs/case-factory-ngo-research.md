# IFRC, Human Rights Watch, and IRC case cards

Prepared 8 October 2026 for Oday’s request to extend `/cases`. Owner: Oday. Source review: Codex, 8 October 2026. Next routine source review: 8 January 2027, or before publication if the wording or source status changes.

These three cards use the existing case-card page and JSON contract. Each is a **research fixture awaiting founder freeze**, with proposed review questions. No readiness, human disposition, frozen record, or freeze hash has been fabricated. The proposed checklist identifiers are not registered donor rule packs. HRW is the research publisher, not the subject of a procurement-failure allegation.

## The three stories

| Card | Decision and interruption | Practical review question |
| --- | --- | --- |
| [IFRC](../lib/case-cards/ifrc-ebola-supplier-payments.ts) | Operational services supported the Guinea Ebola response; a later financial disclosure identified supplier payments that lacked justification and documentation. | Can the reviewer follow a payment back to its approved service and supporting record? |
| [Human Rights Watch / SLDP](../lib/case-cards/hrw-sldp-syria-procurement.ts) | UN teams needed supplies in Syria; the authors’ 2022 guide questioned whether sanctions screening adequately addressed human-rights risks. | What separate assessment supports the decision after a sanctions check? |
| [International Rescue Committee](../lib/case-cards/irc-syria-procurement-settlement.ts) | Procurement supported cross-border relief into Syria; the independence of bids and staff–vendor relationships later came under investigation. | What supports bid independence, the handling of conflicts, and the price? |

## Claim map

The [source manifest](editorial/sources/ngo-cases-2026-10-08/manifest.json) records the URL, publisher, document date, locator, retrieval timestamp, file name, and SHA-256 for every retained source. Source files are retained under `docs`, not served as public assets. The HTML hash is labelled HTML; none is a freeze hash.

| Claim | Primary source and location | Required qualification |
| --- | --- | --- |
| IFRC-01: CHF 354,500 supplier-payment disclosure | IFRC combined Ebola appeal financial statements, note 9a, printed p. 12 / PDF p. 13; auditor report dated 3 September 2019 | Included within approximately CHF 1.5 million of confirmed and at-risk Guinea losses. Do not add the amounts or call the whole total proven theft. |
| IFRC-02: accounting and investigation status | Same note | Adjustment relates to the 2016 statements. Local-investigation status is as of the report, not October 2026. Later recovery or final legal resolution was not established in the reviewed sources. |
| HRW-01: scope and assessment | HRW/SLDP guide, 27 January 2022, introduction and question 6, phases 0 and II | Attributed NGO research about examined UN procurement practices in Syria. Not a UN audit, finding against HRW, current sanctions analysis, or finding about every procurement. |
| HRW-02: response and recommendations | Guide introduction, question 6, and recommendations | The guide reflects UN responses and describes the Regional Dialogue Mechanism. Proposed measures are not verified implementation. |
| IRC-01: civil settlement and procurement allegations | DOJ release 21-040, 19 March 2021, PDF p. 1, paragraphs 1–4 | Agreed settlement of US$6,934,500; not a criminal verdict, criminal fine, or total aid loss. Invoicing period described is October 2012–December 2015. |
| IRC-02: later audit recommendation status | USAID OIG report 8-000-21-001-P public tracker, recommendations 1–4, retrieved 8 October 2026 | Corrective-action assessment recommendation closed 10 June 2021; last of four closed 5 December 2024. Closure is not a reported recovered amount or proof of sustained control effectiveness. The audit is separate from the settlement. |

All checklist questions are Trace-li analysis. A record missing from this public packet does not establish that it was missing from the original transaction file. No customer relationship, endorsement, prevention outcome, new institutional policy, or actual award judgment is asserted.

## Routes and review

- `/cases/ifrc-ebola-supplier-payments`
- `/cases/hrw-sldp-syria-procurement`
- `/cases/irc-syria-procurement-settlement`

Each also has `.json` and `/api/cases/<slug>` exports. Fixture pages retain `noindex`, and exports retain the existing fixture status headers. The source facts, later status, practical question, boundaries, and citations are in the expandable “Check this record yourself” section.

The research and drafting requested in this chat are complete. Oday explicitly authorized public release and deployment on 8 October 2026: “make them live and deploy”. This authorizes publication of the reviewed research fixtures; it does not represent independent legal/comms review or a founder-confirmed desk freeze. Before promotion to a frozen record, define and review the applicable rules, perform the actual desk exercise, and obtain the founder’s real disposition.

Validation completed 8 October 2026: all 18 case-card checks passed, including retained-source hashes and null-freeze checks; type check and production build passed. Local HTTP checks passed for all three HTML pages, JSON aliases, API parity, fixture headers, and an unknown-slug 404. Browser review covered all three pages, desktop IFRC, mobile HRW and IRC without horizontal overflow, and keyboard expansion of the HRW source notes. Production publication is authorized and proceeds through PR #76 and Vercel; deployment completion requires a ready production deployment and live route checks.

Release maintenance: the first CI run identified the existing Next.js 16.3.6 dependency as affected by [GHSA-cjq9-62q9-8jv4](https://github.com/advisories/GHSA-cjq9-62q9-8jv4). The release updates Next.js to the patched 16.3.8 version and retains the dependency audit gate.
