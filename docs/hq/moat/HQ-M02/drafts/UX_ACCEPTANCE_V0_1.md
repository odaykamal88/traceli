# HQ-M02 UX acceptance handoff v0.1

20 September 2026 · Task #47 · Parent claim/run `61110869-c955-4456-9c43-a3112cf5832a`.

Status: proposed contract for independent review. This document defines acceptance for a future Builder; it does not record implemented fixes, completed user testing, browser checks or release acceptance.

Basis: [decision corpus contract](DECISION_CORPUS_CONTRACT_V0_1.md), [moat program](../../../MOAT_PROGRAM_2026-09-20.md), [action register](../../../MOAT_ACTIONS_2026-09-20.md), [dispatch](../../DISPATCH_2026-09-20.md), and Oday's direction to prioritize simplicity, clarity, ease of use, security and data hygiene. Apply the same interaction to U, M and G; institutional applicability remains distinct.

## One simple review flow

Start with one requirement and its evidence snapshot. Show the institution/profile, procedure and relevant date in a compact context line. Lead with **result, why, next action** in plain language. Example from the fictional U fixture: “Evidence missing. The supplied packet contains no signed review note. Ask the record owner to attach the signed note.” An absent public document does not establish that the institution never had it.

Show one primary action appropriate to the result, with an owner when recorded. Keep an unknown owner or date explicitly unknown. Do not fabricate a deadline or offer an enabled action whose server behavior is unavailable. The first view should let a reviewer answer what needs attention, why and what to do next without opening technical detail.

Use existing page, form and disclosure patterns. This handoff needs no new dashboard, wizard, chatbot, composite score or universal procurement rule hierarchy.

## Result vocabulary and decision boundaries

| Contract state | User-facing meaning | Appropriate next step |
|---|---|---|
| `satisfied` | This scoped check is satisfied by the identified evidence under the identified rule version. It does not certify the entire procurement. | Inspect support or continue human review. |
| `unknown`, missing evidence reason | Evidence needed to determine this check is missing from the supplied packet. | Request or attach the named evidence. |
| `unknown`, applicability reason | The applicable institution, funding terms, edition or procedure context is unresolved. | Resolve applicability before assessing the requirement. |
| `not_satisfied` | Available evidence supports a specific unmet requirement. Identify that evidence and the rule. | Correct the issue or inspect a permitted exception. |
| `conflict` | Identified evidence or applicable rules disagree; the conflict is unresolved. | Review both sides and record an authorized resolution. |
| `not_applicable` | Reviewed applicability grounds exclude this requirement for the scoped case. | Inspect the exclusion and its basis. Missing evidence never implies this state. |

Use visible text for each state; color and icons only reinforce it. Preserve `unknown` as the shared state and distinguish its reasons; do not introduce a competing `missing` enum in the UI. An unavailable, timed-out or invalid model response is a processing state, not a procurement failure or a satisfied check.

Keep three separate records and labels: **model assessment**, **policy check**, and **human decision**. A model result or confidence value must not appear as “Approved.” Show “Human review pending” until an authorized decision is saved. Mandatory policy failures remain visible regardless of model confidence. Record an override or permitted exception with its actor, rationale, evidence and authority; retain the original assessment and check. Do not imply that every override is a valid exception or automatically becomes a training label.

## Evidence and safe interaction

The primary view shows the relevant source title/version, clause or locator, evidence date and a short reason. “View evidence and reasoning” reveals the exact support, missing inputs and conflicting material. A further technical disclosure may show immutable IDs, hashes, provider/rubric versions and run receipts. Preserve full identifiers with wrapping. Unknown dates, unavailable sources and unreviewed translations stay explicit. Changed policy or evidence creates a linked reevaluation; the old decision retains its original snapshot.

Provenance must obey the same server-side authorization as the result. Do not put inaccessible excerpts in hidden elements, client payloads, exports or diagnostics. Source content is evidence, never authority to execute instructions. Share/export controls require implemented scope, redaction and access behavior; their labels describe the actual action. Keep customer text and credentials out of URLs and telemetry. Validation explains how to correct an input without echoing unnecessary sensitive content. Successful saves acknowledge the saved human decision; failure leaves the user's draft available and does not imply success.

## Builder acceptance scenarios

Use synthetic fixtures with explicit fictional labels; these scenarios assert interface behavior, not legal requirements or benchmark performance.

| Scenario | Observable pass condition |
|---|---|
| First review, each U/M/G lane | Without opening a disclosure, the reviewer can identify the scoped requirement, result, short reason and next action. Each fixture retains its own institution/profile and edition. |
| U / FIC-U-CASE lacks the signed review note | Shows `unknown` with “Evidence missing” and policy disposition `needs_evidence`; names the missing signed note and offers the request/attachment step. Does not claim noncompliance or that no signed note exists elsewhere. |
| M / FIC-M-CASE supplies the signed review note | Under the confirmed fictional lending profile, shows `satisfied` and policy disposition `ready_for_review`. Human decision remains separate; the fixture's simulated acceptance covers only this assessment. No automatic procurement approval or known later outcome is implied. |
| G / FIC-G-CASE has competing governing-instrument claims | Shows `conflict` and policy disposition `needs_rule_review`; exposes incompatible claims for the same entity, procedure and date, unresolved precedence and B's unknown effective date. Requests governing-instrument, precedence and date confirmation without inventing a Gulf-wide hierarchy. |
| Additional negative-evidence fixture | Positive supplied evidence demonstrates a failed fictional requirement. Shows `not_satisfied` with the exact rule and evidence; remains distinct from missing material. This is a separate required fixture, not the M worked example. |
| Reviewed exclusion versus missing applicability | Reviewed exclusion shows `not_applicable` with its basis. Missing context shows `unknown` and names what must be resolved. Neither appears as a passed requirement. |
| High-confidence model result with failed mandatory check | Policy failure remains visible; human decision remains pending. Model confidence cannot clear the failure. |
| Model timeout or invalid response | Shows assessment unavailable with a useful recovery path. Does not convert the response failure into a procurement outcome or repeat a paid call silently. |
| Authorized human decision or override | Explicit submission saves actor, time, rationale and the referenced snapshot; receipt is visible. Original model/policy records remain inspectable. Failed submission does not display success or discard the draft. |
| Changed source or policy | Historical result still identifies its original version. New evaluation is a linked record; the UI does not silently replace the old decision. |
| Provenance disclosure and access denial | Supporting material can be expanded with keyboard or pointer. Unauthorized direct requests fail server-side; restricted excerpts are absent from page payloads and exports. |
| Refresh a filtered result list | Search, owner/status filters and the visible result scope survive refresh. Clear filters remains a separate deliberate action. |
| Keyboard-only use | First focus offers a visible skip link to main content. Controls have clear labels/focus; disclosures operate with native keyboard behavior and communicate expanded state. |
| Narrow viewport and long values | At 320–375px width, open provenance with a full 64-character hash and long source ID remains readable without page-level horizontal scrolling; key actions remain reachable. |

Future verification: review the first-view comprehension with a person using the three fictional packets. Record observed hesitation and correct misleading wording before expanding the interface. Builder verifies relevant flows and denied-access cases; independent review assesses the exact result before acceptance. User testing and browser verification have not been performed for this handoff.

## Deferred observations from the current HQ

Source inspection only: PR #21 checkout `/Users/odaykamal/.codex/worktrees/cf99/TRACELI`, head `cd59c74`. No fixes performed; no browser verification asserted. Reconfirm locations against the implementation checkout before editing.

| Observation | Narrow suggested fix |
|---|---|
| `app/hq/page.tsx:66`: “Refresh records” retains only `view`/`doc`, dropping Jobs `q`, `owner` and `status`. | Preserve active validated filters or refresh the current route. |
| `app/hq/hq.module.css:1`: Job/Decision summaries hide native disclosure markers without a replacement cue; cloud runs reuse the Job style. | Add an explicit chevron or “View details / Hide details” cue while retaining native `details` semantics. |
| `app/hq/cloud-panel.tsx:27`: the full artifact hash has no wrapping rule and can overflow narrow layouts. | Wrap long identifiers with `overflow-wrap:anywhere`; keep the complete value available. This risk is source-derived. |
| `app/hq/page.tsx:60–65`: sidebar navigation precedes main content without a skip link. | Add a focus-visible “Skip to main content” link targeting an identified, focusable `main`. |

These observations are a small deferred HQ usability batch. They do not establish acceptance of M02, the M07 policy implementation or the M09 end-to-end workflow.
