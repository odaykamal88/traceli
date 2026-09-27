# Trace-li extraction accuracy

Pipeline `trace-v4`. Mode `cached`. 3 files.

False-missing is the share of keys that are truly present and that the desk reported missing. That is the rate to drive down. False-present is the share of keys that are not present and that the desk reported present.

A stated absence is detected when the answer sheet sets `statedAbsent` and the desk stores a missing reason beginning with `Stated absent in this packet:`, or stores `negative` for that same key. A negative whose answer sheet sets `statedAbsent` to false is an adverse fact. It is not counted as a false stated-absence. Value match ignores case and collapses whitespace. Page match counts only keys whose answer sheet names a page. Quote match collapses whitespace runs to one space and compares the answer-sheet sentence with the desk quote; it does not fold case.

## Overall

| Metric | Result |
| --- | --- |
| State accuracy | 88.3% (68/77) |
| Recall on present | 25.0% (3/12) |
| False-missing rate | 75.0% (9/12) |
| False-present rate | 0.0% (0/65) |
| Stated-absent detection | 71.4% (5/7) |
| Value match | 35.7% (5/14) |
| Page match | 42.1% (8/19) |
| Quote match | 36.8% (7/19) |
| Keys read from the packet | 8/77 |

## By pack

### global-fund

| Metric | Result |
| --- | --- |
| State accuracy | 84.6% (22/26) |
| Recall on present | 42.9% (3/7) |
| False-missing rate | 57.1% (4/7) |
| False-present rate | 0.0% (0/19) |
| Stated-absent detection | 50.0% (1/2) |
| Value match | 50.0% (4/8) |
| Page match | 44.4% (4/9) |
| Quote match | 44.4% (4/9) |
| Keys read from the packet | 4/26 |

### ocha-cbpf

| Metric | Result |
| --- | --- |
| State accuracy | 79.2% (19/24) |
| Recall on present | 0.0% (0/5) |
| False-missing rate | 100.0% (5/5) |
| False-present rate | 0.0% (0/19) |
| Stated-absent detection | 0.0% (0/1) |
| Value match | 0.0% (0/5) |
| Page match | 0.0% (0/6) |
| Quote match | 0.0% (0/6) |
| Keys read from the packet | 0/24 |

### unfpa

| Metric | Result |
| --- | --- |
| State accuracy | 100.0% (27/27) |
| Recall on present | n/a (no present keys) |
| False-missing rate | n/a (no present keys) |
| False-present rate | 0.0% (0/27) |
| Stated-absent detection | 100.0% (4/4) |
| Value match | 100.0% (1/1) |
| Page match | 100.0% (4/4) |
| Quote match | 75.0% (3/4) |
| Keys read from the packet | 4/27 |

## By file

### gf-short-synthetic.pdf

Pack `global-fund` 2026.2. 2 pages. Split `train`. Response `fixture`. SHA-256 `3d107f98d4e176f4f1ebc4c83482e2a31c5452f38bffbba8ce2095eb7ef05d17`.

| Metric | Result |
| --- | --- |
| State accuracy | 84.6% (22/26) |
| Recall on present | 42.9% (3/7) |
| False-missing rate | 57.1% (4/7) |
| False-present rate | 0.0% (0/19) |
| Stated-absent detection | 50.0% (1/2) |
| Value match | 50.0% (4/8) |
| Page match | 44.4% (4/9) |
| Quote match | 44.4% (4/9) |
| Keys read from the packet | 4/26 |

| Key | Answer | Desk | False missing | False present | Stated absent (answer / desk) | Answer value | Desk value |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `procurement.solicitation_notified` | present | missing | yes |  | no / no | The solicitation was advertised on the national procurement portal on 2 Februar… | null |
| `documentation.award_rationale_on_file` | present | missing | yes |  | no / no | The evaluation panel recorded the award rationale in the bid report dated 12 Ma… | null |
| `award.contract_value_usd` | present | missing | yes |  | no / no | The contract value is USD 184000. | null |
| `sr.capacity_assessed` | missing | missing |  |  | yes / no | null | null |
| `sr.written_agreement_on_file` | present | missing | yes |  | no / no | A signed sub-recipient agreement is attached as Annex B. | null |

### ocha-short-synthetic.pdf

Pack `ocha-cbpf` 2026.1. 2 pages. Split `train`. Response `fixture`. SHA-256 `e1f174b47dd90380d6050f2014e897148c4aaac5322f92cc3d8662c43b05e4f7`.

| Metric | Result |
| --- | --- |
| State accuracy | 79.2% (19/24) |
| Recall on present | 0.0% (0/5) |
| False-missing rate | 100.0% (5/5) |
| False-present rate | 0.0% (0/19) |
| Stated-absent detection | 0.0% (0/1) |
| Value match | 0.0% (0/5) |
| Page match | 0.0% (0/6) |
| Quote match | 0.0% (0/6) |
| Keys read from the packet | 0/24 |

| Key | Answer | Desk | False missing | False present | Stated absent (answer / desk) | Answer value | Desk value |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `partner.due_diligence_passed` | present | missing | yes |  | no / no | true | null |
| `allocation.modality` | present | missing | yes |  | no / no | reserve | null |
| `allocation.strategy_on_file` | present | missing | yes |  | no / no | The humanitarian country team filed the allocation strategy with the reserve cr… | null |
| `selection.scorecard_or_alternative` | missing | missing |  |  | yes / no | null | null |
| `selection.committee_decision` | present | missing | yes |  | no / no | The review committee recommended Partner C on 4 April 2026 after reading the pr… | null |
| `onegms.project_status` | present | missing | yes |  | no / no | OneGMS shows the project as under review. | null |

### unfpa-ia-2025-29-sudan-rehearsal.pdf

Pack `unfpa` 2026.1. 2 pages. Split `train`. Response `fixture`. SHA-256 `be80723e5df1013dfc8c9244bdcc342742db769dabab254ae0d4ddd8e93ad7d2`.

| Metric | Result |
| --- | --- |
| State accuracy | 100.0% (27/27) |
| Recall on present | n/a (no present keys) |
| False-missing rate | n/a (no present keys) |
| False-present rate | 0.0% (0/27) |
| Stated-absent detection | 100.0% (4/4) |
| Value match | 100.0% (1/1) |
| Page match | 100.0% (4/4) |
| Quote match | 75.0% (3/4) |
| Keys read from the packet | 4/27 |

Every scored key matched the answer-sheet state.

## Per-key confusion

Each row is one pack key across the files in this run. Readings are answer state to desk state.

| Pack | Key | Files | State | False missing | False present | Readings |
| --- | --- | --- | --- | --- | --- | --- |
| global-fund | `award.contract_value_usd` | 1 | 0/1 | 1 | 0 | present->missing × 1 |
| global-fund | `documentation.award_rationale_on_file` | 1 | 0/1 | 1 | 0 | present->missing × 1 |
| global-fund | `procurement.solicitation_notified` | 1 | 0/1 | 1 | 0 | present->missing × 1 |
| global-fund | `sr.written_agreement_on_file` | 1 | 0/1 | 1 | 0 | present->missing × 1 |
| ocha-cbpf | `allocation.modality` | 1 | 0/1 | 1 | 0 | present->missing × 1 |
| ocha-cbpf | `allocation.strategy_on_file` | 1 | 0/1 | 1 | 0 | present->missing × 1 |
| ocha-cbpf | `onegms.project_status` | 1 | 0/1 | 1 | 0 | present->missing × 1 |
| ocha-cbpf | `partner.due_diligence_passed` | 1 | 0/1 | 1 | 0 | present->missing × 1 |
| ocha-cbpf | `selection.committee_decision` | 1 | 0/1 | 1 | 0 | present->missing × 1 |
| global-fund | `eligibility.contractor_capable` | 1 | 1/1 | 0 | 0 | present->present × 1 |
| global-fund | `idd.affiliated_persons` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| global-fund | `idd.disposition_decision` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| global-fund | `idd.disposition_owner` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| global-fund | `idd.disposition_rationale` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| global-fund | `idd.evidence_ref` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| global-fund | `idd.gf_notification` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| global-fund | `idd.list_vintage` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| global-fund | `idd.screen_date` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| global-fund | `idd.screen_modality` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| global-fund | `idd.screen_result` | 1 | 1/1 | 0 | 0 | present->present × 1 |
| global-fund | `idd.screen_scope` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| global-fund | `idd.screen_timing` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| global-fund | `idd.subject` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| global-fund | `idd.subject_kind` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| global-fund | `idd.subject_role` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| global-fund | `integrity.coi_disclosed` | 1 | 1/1 | 0 | 0 | negative->negative × 1 |
| global-fund | `procurement.competition_or_exemption_documented` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| global-fund | `procurement.competitive_or_exempt` | 1 | 1/1 | 0 | 0 | present->present × 1 |
| global-fund | `sr.capacity_assessed` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| global-fund | `sr.selection_documented` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| global-fund | `threshold.method_aligned` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| ocha-cbpf | `allocation.preselection_justification` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| ocha-cbpf | `grant.agreement_complete` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| ocha-cbpf | `grant.budget_template` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| ocha-cbpf | `grant.consortium_controls` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| ocha-cbpf | `idd.disposition_decision` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| ocha-cbpf | `idd.evidence_ref` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| ocha-cbpf | `idd.screen_result` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| ocha-cbpf | `idd.screen_scope` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| ocha-cbpf | `idd.subject` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| ocha-cbpf | `misconduct.annex8_path` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| ocha-cbpf | `misconduct.annex9_notification` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| ocha-cbpf | `misconduct.oios_notification_path` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| ocha-cbpf | `misconduct.secretariat_sanctions_regime` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| ocha-cbpf | `onegms.selection_record` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| ocha-cbpf | `partner.annex7_declarations` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| ocha-cbpf | `partner.capacity_assessment` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| ocha-cbpf | `selection.mismatch_note` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| ocha-cbpf | `selection.recommendation_differs` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| ocha-cbpf | `selection.scorecard_or_alternative` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `idd.clearcheck_where_personnel` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `idd.disposition_decision` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `idd.evidence_ref` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `idd.screen_date` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `idd.screen_result` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `idd.screen_scope` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `idd.subject` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `idd.subject_kind` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `idd.vrc_iprc_status` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `integrity.coi_declared` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `integrity.related_party_checked` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `ip.competitive_or_waiver` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `ip.hact_micro_assessment` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `ip.psea_assessment` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `ip.threshold_approver` | 1 | 1/1 | 0 | 0 | negative->negative × 1 |
| unfpa | `ip.unpp_profile` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `ip.waiver_or_competition_documented` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `payment.commodity_lines` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `payment.face_workplan_link` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `procurement.contract_split_checked` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `procurement.crc_gate` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `procurement.lta_rate_reconciliation` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `procurement.method_vs_threshold` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `procurement.plan_line` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `procurement.po_or_contract` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `procurement.rfq_criteria_and_scores` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |
| unfpa | `procurement.rir` | 1 | 1/1 | 0 | 0 | missing->missing × 1 |

