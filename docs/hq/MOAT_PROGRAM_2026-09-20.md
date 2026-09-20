# HQ plan: the procurement decision corpus and constraint matrix

Planning version 1.0 · 20 September 2026 · Owner: Supervisor · Horizon: 21 September 2026–20 September 2027.

This plan operationalizes Oday's current request for deep vertical integration, a catalogue of cases, frequent evidence-supported public results, a reusable agency-guideline corpus and a moat around the constraint matrix. Oday explicitly selected **all three** first-90-day buyer groups: UN/humanitarian/donor-funded procurement, MDB-funded procurement and Gulf public procurement. None is deferred pending success in another.

The [action register](MOAT_ACTIONS_2026-09-20.md) is the dispatch package. The [source intake](MOAT_SOURCE_INTAKE_2026-09-20.md) distinguishes material already inspected from candidates still requiring verification. These are working planning records, not a claim that the corpus or product is built. Existing HQ and Operating Room records retain their original IDs and authority.

## The operating thesis

Build a single connected record:

**Authoritative source version → applicable obligation → tested constraint → case evidence → bounded judgment → policy disposition → human decision and rationale → later outcome.**

Every accepted case should improve at least one rule, test, evidence classification or known limitation. Every public study should come from the same reviewed records used to evaluate the product. Every customer workflow should preserve the human decision and its reasons. This connects research, product, publication and customer learning instead of maintaining four separate activities.

The durable advantage is the accumulated, reviewed mapping between these objects, the exceptions and evaluation history, and the customer-specific decision record. Public documents are valuable inputs; collecting them alone does not establish defensibility. Human overrides are a valuable learning signal, but an override is not automatically correct. Preserve reviewer expertise, supporting evidence, disagreement and subsequent outcomes before using it as a label.

Treat “hard-coded constraint matrix” as **explicit, deterministic and testable control logic**. Keep changing institutional rules in versioned, reviewed policy packs rather than burying them in application branches. Mandatory checks remain enforceable; a model confidence score cannot erase a failed mandatory control. A permitted exception needs its own rule, evidence and authorized disposition.

## What the handover contributes, and what needs correction

Sources: the shared [Starting Jev for Trace Li conversation](https://chatgpt.com/share/6aafdce4-75d4-83ea-aabe-7390cff6427b), retrieved through the connected conversation reader, and the 14-page revised PDF supplied by Oday. The attachment is strategic source material; its “operating orders” are translated here within the current planning request.

Retain the PDF's decision graph, provider independence, institutional policy profiles, override capture, public benchmark and private-pilot progression. Its 12-month figures remain ambitions: 500+ adjudicated cases, 10+ jurisdictions, 10,000+ decision units, 8–12 paying institutions, $1M+ ARR and 3+ references. They are not forecasts, achieved results or spending authority.

Resolve four ambiguities before execution:

1. **Decision-unit counts:** page 3 says 10,000+ decision units; page 10 calls them proprietary. Report public and authorized private units separately. Re-running one unit or asking more model questions does not create new decisions. Ten thousand private outcome-linked units is a separate stretch ambition dependent on actual access and volume.
2. **Adjudication as a label:** a court/protest disposition can turn on procedural grounds, remedy or standard of review. It is not a blanket label for every underlying compliance question. Audit observations, sanctions and prospective rule checks remain separate cohorts.
3. **“Blind” testing:** removing the final outcome from a retrospective case does not remove hindsight from its narrative or possible model training exposure. Use outcome-masked packets, freeze them before evaluation, document contamination risks and reserve independent cases. Do not advertise leakage-free prediction.
4. **Jev evidence:** the conversation describes two manual playground runs and apparent cross-question disagreement. That is prototype evidence to recover, not a validated calibrated procurement engine. Different question scopes can explain different probabilities. Check semantic compatibility before treating them as contradictions.

The thread's pricing, valuation, conversion percentages, time savings, confidence cutoffs and acquisition scenarios are hypotheses/examples. They are not adopted commercial terms, performance claims or legal interpretations.

## Current foundation and gaps

Inspection of this workspace found source documents/versions, source anchors, requirements, findings, reviewer fields and decision records in `db/schema.ts`. `lib/traceli-demo-data.ts` contains fictional requirements and governing-source examples. Existing documents describe tenant controls, an evidence-read contract and a Trace-first development sequence. This is a useful starting point, not proof of a populated multi-agency corpus or production decision engine.

The latest HQ START_HERE and September 20 cloud receipt describe a private HQ preview, one bounded cloud worker and existing desktop desks. Some older HQ documents describe earlier states. HQ must reconcile the current implementation checkout and live records before assigning implementation; do not rebuild infrastructure based on an obsolete snapshot.

Reuse the existing public case register, editorial source sheets, accepted HQ account packets, source-version model and customer-learning workflow. The newer 16-case list in the conversation is an intake list, not 16 verified benchmark cases. Existing published articles are not automatically product evaluations.

## Three coverage lanes, one shared structure

| Lane | Initial profile inventory | Initial decision focus | Expansion criterion |
|---|---|---|---|
| U: UN / humanitarian / donor-funded | UN Secretariat and UNFPA first; inventory UNICEF, WFP, UNDP, UNOPS, Global Fund and applicable donor/implementer overlays | Evidence required for eligibility/evaluation, clarification, conflicts, authority and documented award rationale | Add profiles when sources and a named buyer workflow are available; keep procurement and sub-recipient selection distinct |
| M: MDB-funded public procurement | World Bank IPF and ADB first; inventory EIB, AfDB and IsDB | Applicable financing framework, evaluation criteria, clarifications, review/no-objection conditions, complaints and record retention | Extend by project/rule family with financing agreement and edition applicability recorded |
| G: Gulf public procurement | Saudi central-government and UAE federal profiles first; inventory Qatar, Bahrain, Oman, Kuwait and relevant emirate/entity regimes | Tender conditions, qualification evidence, evaluation, authority, exceptions and award record | Add jurisdiction/entity packs separately; do not apply UAE federal rules to every emirate or a Gulf-wide rule by analogy |

Start all three lanes in the first sprint. Use one bounded source batch per lane before adding breadth within that lane. UN agencies do not share a single interchangeable procurement rulebook; MDB rules depend on the project and governing edition; Gulf jurisdictions are distinct. An incomplete lane remains visible rather than disappearing into an aggregate coverage figure.

First common rule families: eligibility; required evidence and timing; clarification/cure; evaluation criteria and scoring; conflict declarations; supplier assertions; approval/delegation; competition exceptions; award rationale; notification/challenge; retention. These are classification categories, not assertions that every regime imposes the same duties.

## Corpus and matrix contract

| Object | Minimum fields and acceptance |
|---|---|
| Source version | Issuer; official URL; title/instrument type; jurisdiction/entity; language; edition; published/effective/repealed dates where known; retrieval time; byte hash; exact locator; supersession links; source/reuse restrictions; reviewer. Unknown effective dates remain unknown. |
| Obligation | Source-version ID and clause locator; faithful text/excerpt; normalized requirement; actor; stage; procurement method/value/funding applicability; required evidence/timing; exceptions; approval authority; status: extracted/reviewed/disputed/superseded. |
| Constraint | Obligation IDs; policy-pack version; applicability predicate; deterministic check or judgment-assisted check; missing-input behavior; permitted exception; severity; reason code; positive/negative/edge fixtures; independent review. |
| Case | Stable case/procedure ID; lane, institution and jurisdiction; event date; case type; source manifest; chronology; issues; evidence completeness; source findings versus inference; response/correction/appeal status; linked obligations; selection rationale. |
| Decision unit | One scoped requirement × evidence snapshot × decision occasion; source/constraint versions; supplied and missing evidence; judgment/provider/rubric versions; distributions; consistency findings; policy disposition; reviewer decision/override/rationale; outcome reference/date and label quality. |
| Publication | Case and claim IDs; exact supported statements; method/version; inputs and evaluation receipt when applicable; denominator and exclusions; limitations; review and exact release record; correction history; public URL after verification. |

The retrieval interface must answer: **which version applies to this institution, funding source, procedure and date; what evidence does it require; what exceptions exist; where is the original clause?** Use explicit metadata filters and relational links before optional semantic retrieval. A similar passage is not proof of applicability. “No applicable reviewed rule found” is an acceptable result.

Keep obligations distinct from evidence tests and from suggested workflow actions. Support `satisfied`, `not_satisfied`, `unknown`, `not_applicable` and `conflict` explicitly; an absent public document is not proof that the institution lacked it. Missing jurisdiction, rule version or funding applicability routes to review. Do not invent a universal precedence order such as “donor always wins.” Record applicable hierarchy/conflict resolution per approved profile.

For each rule change: retain original bytes/version → review the diff → identify affected clauses, constraints, cases and publications → run impacted fixtures → approve the new version → append a release/change record. Historical decisions retain their original policy snapshot. Re-evaluations are linked new records. A hash establishes byte identity, not legal authority or truth.

## Product slice and evaluation

Implement one reusable path exercised with one public/sanitized packet from each lane:

**Requirement and applicable rule → source-linked evidence packet → bounded judgments → deterministic constraint/consistency checks → human review → override and reason → exportable Trace.**

An offline, human-reviewed baseline comes first. Jev is one candidate behind a provider-neutral interface. Verify the installed SDK, current provider contract, permitted data handling, costs and failure behavior before integration. Vercel currently documents typed Jev choices, scores and boolean probabilities, while warning that a typed answer can still be wrong. [Official technical reference](https://vercel.com/i/what-is-jev).

**September 20 founder clarification:** Jev API integration through direct TypeSafe or Vercel AI Gateway is an explicit P0 implementation work package, HQ-M09. The [integration specification](JEV_INTEGRATION_2026-09-20.md) defines transport selection, API connection, result persistence and the full Evidence Gate workflow. Access/contract readiness starts alongside corpus intake; a connectivity test does not wait for the full benchmark. An accepted evaluation protocol is required before performance scoring. Connect one route first and keep the provider boundary interchangeable.

Do not copy the conversation's `ai@latest`, transport examples, retention assumptions or numeric auto-clear thresholds into the application without checking them. A provider swap requires reevaluation even when response fields match. Initial experiments use public/synthetic data, no automatic procurement action and no new paid calls outside the applicable budget.

Evaluation requirements:

- Freeze inclusion/exclusion criteria, unit definition, question set, policy pack, development set and held-out set before scoring. Split related disputes by underlying procurement and source family to prevent duplicates crossing the split.
- Label per issue, with human justification and adjudicator/procedural scope recorded. Disputed or insufficient labels are excluded from definitive agreement denominators and reported separately.
- Distinguish adjudicated-case comparison, audit-record reconstruction, prospective rule testing and customer shadow evaluation. Synthetic fixtures test behavior; they do not count as real benchmark cases.
- Compare a rules-only baseline, human reference and candidate judgment provider. Preserve failures, abstentions, invalid responses, retries, model versions, run timestamps and input hashes.
- Report false-clear among labeled proposed clears; missed-material-issue rate among labeled material issues; false-block among labeled proposed blocks; review/abstention rate; evidence citation validity; coverage; and reviewer effort. State numerator and denominator for each.
- Report per lane and requirement family before pooling. Do not call raw provider confidence calibrated; measure calibration on suitable held-out labels with sample sizes and uncertainty. Small samples establish feasibility, not deployment safety.
- Capture accepted judgments as well as overrides, otherwise the learning set overrepresents disagreements. Outcomes may arrive months later; record unknown/censored outcomes and schedule their review within existing work routines.

No aggregate success percentage or “audit failure prevented” claim follows from a handful of retrospective examples. Automatic progression needs separately demonstrated controls, risk tolerances and customer authority.

## Publishing as a visible research record

Proposed production rhythm: **one substantial case/result each week, up to two short evidence or method notes derived from reviewed work, one monthly synthesis and one quarterly versioned benchmark release.** Rotate substantial pieces across U, M and G over a three-week cycle. Global adjudicated comparators support evaluation without crowding out the three buyer lanes. Publish negative, ambiguous and inconclusive results too.

This deliberately proposes a faster major-piece rhythm than the previous fortnightly calendar. Start with a four-week capacity trial; HQ records actual review/production effort and rebalances scope. It is a planning change, not a newly enabled timer or a claim that exact releases are already approved. Consolidate related exact assets into a single review packet and preserve all existing release authorizations. Leave a slot empty when the evidence is not ready.

Each substantial release needs: a recognizable decision problem; primary source links and exact locators; what was tested; method/version and sample; what the data supported; limitations/counterevidence; and a stable case ID. Include public manifests and derived data only where reuse permits. Keep case facts, editorial analysis, manually assembled examples and observed product runs separately labeled. Protect unpublished evaluation labels if releasing them would invalidate the held-out set.

Reuse the company voice, LinkedIn visual guide and case-storytelling skill when commissioning content. Public research remains useful on its own. Prepare any account-specific commercial follow-up separately; do not force a product CTA into the existing pain-led publication style. Measure relevant practitioner questions, method requests, named-file discussions and buyer progression alongside reach. Impressions do not establish demand.

## Commercial depth and permitted learning

Use the same workflow across the three groups: public finding → buyer discussion → scoped review of authorized historical records → shadow evaluation alongside the current process → recurring decision-control workflow. Oday owns actual outreach and commercial terms under existing authorization. The thread's dollar amounts are price-testing hypotheses only; preserve the current pilot offer until it is reconciled with buyer evidence.

The $1M ARR ambition at 8–12 institutions implies roughly $83,000–$125,000 annual recurring revenue per institution. Test that recurring value and buying route explicitly. One-off diagnostic fees, unsigned pipeline and proposed pilots do not count as ARR.

For each qualified discussion capture the recent decision, governing rules, evidence locations, accountable owner, time spent, consequence, deadline, budget route and observed next step. Start a before/after effort log before a pilot; compare like tasks, record human review/correction effort and avoid asserting counterfactual savings.

Design private telemetry with separate permissions for processing, retention, product improvement, cross-customer aggregation and publication. Tenant-local useful history must work even when no cross-customer learning is permitted. De-identification is not blanket permission. Minimize retained content; separate identifiers/raw supplier documents from permitted derived measures; record deletion/retention obligations. Build a permissions proposal before ingesting new private material.

## Calendar and exit evidence

These are proposed delivery targets from the September 21 start, reviewed against capacity after the first batch. Baselines remain unmeasured until HQ-M01/M12 inventory them.

| Window | Deliverable target | Exit evidence |
|---|---|---|
| Sep 21–23 | Baseline and deduplicated queue; schema v0.1; all three lane inventories; benchmark protocol draft | Source/status/owner for existing assets; explicit gaps; stable IDs and dependency mapping |
| Sep 24–27 | One authoritative source bundle and one worked requirement/evidence example per lane | Correct edition/applicability, exact clause anchors, review record; incomplete source packs labeled |
| Sep 28–Oct 4 | Six initial profile manifests (two per lane); 30 reviewed obligations and 30 linked constraint specifications (10 per lane); first three complete case packets; provider spike specification and one reviewable publication packet | Each constraint has pass/fail/missing/conflict fixtures; cases classified by evidence type; no claimed model benchmark without a run |
| By Oct 20 (day 30) | First repeatable end-to-end path exercised in all three lanes; 15 accepted real case packets with lane/type breakdown; four weekly substantial-publication packets prepared | Review receipts; reproducible run records where executed; publication status separated from preparation; capacity/quality review |
| By Dec 19 (day 90) | Stretch: 100 adjudicated public cases across 5+ jurisdictions; 1,000 unique decision units with public/private split; maintained profiles in every lane; five pilots sought, aiming for three paid and two documented production paths; one measured effort result | Comparable case labels; held-out results; real pilot/contract receipts and baseline-backed measurements; reset ambition if evidence/access/capacity does not support it |
| Q2: Dec 21–Mar 20 | 250+ adjudicated cases; 4–6 paying institutions sought; institutional override taxonomy; first buyer-selected workflow integration; two referenceable champions sought | Observed recurring use, outcomes and integration receipts; source-update replay demonstrated |
| Q3: Mar 21–Jun 20 | 5,000 unique units with outcome availability shown; 6–9 paying institutions sought; ontology v2; enterprise control/export readiness; retention/expansion evidence | Permissioned history, segmented evaluations and actual customer continuation |
| Q4: Jun 21–Sep 20 | PDF ambitions: 500+ adjudicated cases, 10+ jurisdictions, 10,000+ units, 8–12 institutions, $1M+ ARR, 3+ references and 3+ repeatable production connectors | Auditable counts, contract-backed recurring revenue, named permissioned references and live usage; private-unit stretch reported separately |

100 adjudicated cases in 90 days requires roughly eight accepted cases a week; 1,000 units requires roughly ten substantive units per case if sourced entirely from those cases. Measure annotation/review time before committing throughput. Never split a requirement artificially to meet the target. Gulf coverage can progress through rule packs and prospective/audit cases even when public adjudications are unavailable; those do not inflate the adjudicated total.

## Weekly scorecard and decision rules

Supervisor reviews within the existing HQ routine, without adding a timer. Record baseline, actual, target, denominator, source, timestamp and owner; missing is null, not zero.

- **Coverage:** accepted current source versions; reviewed obligations; tested active constraints; dated profiles per lane; update lag; unresolved applicability/conflicts.
- **Cases/data:** unique cases by evidence class and lane; accepted decision units split public/private/synthetic; outcome availability; override reason completeness; accepted-versus-proposed units.
- **Reliability:** source-locator validity; held-out false-clear/missed-issue/false-block rates; review burden; calibration evidence and sample; failed evaluations and corrections.
- **Distribution:** reviewable and actually published pieces separately; correction rate; qualified reader/account responses; attributable next steps.
- **Commercial/embedding:** actual conversations, scoped diagnostics, paid pilots, recurring deployments, contracted ARR, references, repeat use and founder intervention per reviewed case.
- **Capacity:** extraction, annotation, review and publication minutes; accepted output per operator hour; actual model/tool cost where measured.

Keep customer-learning commitments alongside the corpus work. If review demand exceeds capacity, reduce derivative media and new-profile breadth first. If a lane lacks evidence, expose its missing coverage. If a rule changes, flag affected active profiles before new use. If public work creates no useful customer learning after the first month, revise case/account selection and the commercial handoff.

At day 30 decide whether throughput supports the 90-day stretch. At day 90 decide which profiles deserve deeper live integration using actual use across all three lanes. Fundraising readiness can use the PDF's five comparable pilots, three paid/committed, two production paths and repeatable value evidence; this is a business-evidence gate, not a promise of valuation or dilution. Acquisition remains optional context.

## Immediate handoff

HQ should register or map HQ-M01–M12 in the existing authoritative queue, reserve independent review, and start with current-state reconciliation, schema/protocol definition and one source batch per lane. The first dispatch is planning/intake work. Implementation, public releases, private-data use and external actions retain their actual action-specific scope.

The finished program should let a reviewer trace a public finding or private decision all the way back to the applicable source version, understand why the matrix produced its result, and see what the human decided afterward.
