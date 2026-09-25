# Trace-li extraction accuracy

Pipeline `trace-v5`. Mode `local-text`. 10 files.

False-missing is the share of keys that are truly present and that the desk reported missing. That is the rate to drive down. False-present is the share of keys that are not present and that the desk reported present.

A stated absence is detected when the desk stores a missing reason beginning with `Stated absent in this packet:`, or stores `negative` / `false` for a boolean control the packet says is absent. Value match ignores case and collapses whitespace. Page match counts only keys whose answer sheet names a page. Quote match collapses whitespace runs to one space and compares the answer-sheet sentence with the desk quote; it does not fold case.

## Overall

| Metric | Result |
| --- | --- |
| State accuracy | 84.4% (217/257) |
| Recall on present | 75.0% (108/144) |
| False-missing rate | 25.0% (36/144) |
| False-present rate | 0.0% (0/113) |
| Stated-absent detection | 70.0% (28/40) |
| Value match | 32.1% (50/156) |
| Page match | 68.9% (131/190) |
| Quote match | 35.8% (68/190) |
| Keys read from the packet | 140/257 |

## By pack

### global-fund

| Metric | Result |
| --- | --- |
| State accuracy | 87.5% (91/104) |
| Recall on present | 79.7% (47/59) |
| False-missing rate | 20.3% (12/59) |
| False-present rate | 0.0% (0/45) |
| Stated-absent detection | 73.3% (11/15) |
| Value match | 41.5% (27/65) |
| Page match | 71.8% (56/78) |
| Quote match | 34.6% (27/78) |
| Keys read from the packet | 61/104 |

### ocha-cbpf

| Metric | Result |
| --- | --- |
| State accuracy | 84.7% (61/72) |
| Recall on present | 76.2% (32/42) |
| False-missing rate | 23.8% (10/42) |
| False-present rate | 0.0% (0/30) |
| Stated-absent detection | 72.7% (8/11) |
| Value match | 27.3% (12/44) |
| Page match | 68.5% (37/54) |
| Quote match | 44.4% (24/54) |
| Keys read from the packet | 40/72 |

### unfpa

| Metric | Result |
| --- | --- |
| State accuracy | 80.2% (65/81) |
| Recall on present | 67.4% (29/43) |
| False-missing rate | 32.6% (14/43) |
| False-present rate | 0.0% (0/38) |
| Stated-absent detection | 64.3% (9/14) |
| Value match | 23.4% (11/47) |
| Page match | 65.5% (38/58) |
| Quote match | 29.3% (17/58) |
| Keys read from the packet | 39/81 |

## By file

### gf-01-mwi-sr-selection.pdf

Pack `global-fund` 2026.2. 18 pages. Split `train`. Response `local-text`. SHA-256 `a328e41d1141aae10537d34d409c056a1eb6aa4a29acf46315b33178116942f8`.

| Metric | Result |
| --- | --- |
| State accuracy | 100.0% (26/26) |
| Recall on present | 100.0% (15/15) |
| False-missing rate | 0.0% (0/15) |
| False-present rate | 0.0% (0/11) |
| Stated-absent detection | 100.0% (4/4) |
| Value match | 50.0% (8/16) |
| Page match | 100.0% (19/19) |
| Quote match | 47.4% (9/19) |
| Keys read from the packet | 19/26 |

Every scored key matched the answer-sheet state.

### gf-02-moz-lab-reagents-tender.pdf

Pack `global-fund` 2026.2. 25 pages. Split `train`. Response `local-text`. SHA-256 `b919c781d16225394436d1d93469a135e2dd2c896801feb9bd6f4946c23cd581`.

| Metric | Result |
| --- | --- |
| State accuracy | 100.0% (26/26) |
| Recall on present | 100.0% (15/15) |
| False-missing rate | 0.0% (0/15) |
| False-present rate | 0.0% (0/11) |
| Stated-absent detection | 100.0% (3/3) |
| Value match | 50.0% (8/16) |
| Page match | 73.7% (14/19) |
| Quote match | 36.8% (7/19) |
| Keys read from the packet | 19/26 |

| Key | Answer | Desk | False missing | False present | Stated absent (answer / desk) | Answer value | Desk value |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `threshold.method_aligned` | negative | negative |  |  | no / yes | false | false |

### gf-03-cmr-single-source-fleet.pdf

Pack `global-fund` 2026.2. 14 pages. Split `train`. Response `local-text`. SHA-256 `d14dca0105e8b529451d4b330a3389c7fe54535170a32fd065fa15d19055f807`.

| Metric | Result |
| --- | --- |
| State accuracy | 100.0% (26/26) |
| Recall on present | 100.0% (15/15) |
| False-missing rate | 0.0% (0/15) |
| False-present rate | 0.0% (0/11) |
| Stated-absent detection | 100.0% (4/4) |
| Value match | 55.6% (10/18) |
| Page match | 100.0% (21/21) |
| Quote match | 52.4% (11/21) |
| Keys read from the packet | 21/26 |

| Key | Answer | Desk | False missing | False present | Stated absent (answer / desk) | Answer value | Desk value |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `threshold.method_aligned` | negative | negative |  |  | no / yes | false | false |
| `idd.screen_timing` | negative | negative |  |  | no / yes | after_engagement | after_engagement |

### gf-04-npl-sr-continuation.pdf

Pack `global-fund` 2026.2. 32 pages. Split `test`. Response `local-text`. SHA-256 `f5efb7d984f06f759281f7ecbe5e7326fb7f80788a3c7387d19b07d0111835cf`.

| Metric | Result |
| --- | --- |
| State accuracy | 50.0% (13/26) |
| Recall on present | 14.3% (2/14) |
| False-missing rate | 85.7% (12/14) |
| False-present rate | 0.0% (0/12) |
| Stated-absent detection | 0.0% (0/4) |
| Value match | 6.7% (1/15) |
| Page match | 10.5% (2/19) |
| Quote match | 0.0% (0/19) |
| Keys read from the packet | 2/26 |

| Key | Answer | Desk | False missing | False present | Stated absent (answer / desk) | Answer value | Desk value |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `eligibility.contractor_capable` | negative | missing |  |  | no / no | false | null |
| `integrity.coi_disclosed` | present | missing | yes |  | no / no | true | null |
| `procurement.competition_or_exemption_documented` | present | missing | yes |  | no / no | Continuation approval memo CM/2026/07 with 2025 performance review | null |
| `procurement.solicitation_notified` | missing | missing |  |  | yes / no | null | null |
| `documentation.award_rationale_on_file` | present | missing | yes |  | no / no | Performance review 2025: 91% of case-finding target, timely reporting, clean sp… | null |
| `award.contract_value_usd` | missing | missing |  |  | yes / no | null | null |
| `sr.selection_documented` | present | missing | yes |  | no / no | Original competitive selection 2023 (call SPHC/SR/2023/04); continuation decide… | null |
| `sr.capacity_assessed` | present | missing | yes |  | no / no | 2026-01-14 reassessment; overall rating moderate | null |
| `sr.written_agreement_on_file` | present | missing | yes |  | no / no | SR agreement SPHC/SR/2023/04 and amendments 1-2 signed; amendment 3 draft | null |
| `idd.subject` | present | missing | yes |  | no / no | Dawit Qureshal | null |
| `idd.subject_kind` | present | missing | yes |  | no / no | individual | null |
| `idd.subject_role` | present | missing | yes |  | no / no | key_personnel | null |
| `idd.affiliated_persons` | missing | missing |  |  | yes / no | null | null |
| `idd.screen_scope` | present | missing | yes |  | no / no | un ofac us-state switzerland debarment ineligibility | null |
| `idd.screen_result` | present | missing | yes |  | no / no | clear | null |
| `idd.screen_timing` | present | missing | yes |  | no / no | grant_cycle_rerun | null |
| `idd.disposition_decision` | missing | missing |  |  | yes / no | null | null |

### ocha-01-som-standard-allocation.pdf

Pack `ocha-cbpf` 2026.1. 16 pages. Split `train`. Response `local-text`. SHA-256 `cd27b96da8214d3042130ae6fbcd978c0bb615d810d234ed29f0f8d0284a8054`.

| Metric | Result |
| --- | --- |
| State accuracy | 100.0% (24/24) |
| Recall on present | 100.0% (14/14) |
| False-missing rate | 0.0% (0/14) |
| False-present rate | 0.0% (0/10) |
| Stated-absent detection | 100.0% (4/4) |
| Value match | 35.7% (5/14) |
| Page match | 94.4% (17/18) |
| Quote match | 50.0% (9/18) |
| Keys read from the packet | 18/24 |

Every scored key matched the answer-sheet state.

### ocha-02-nga-reserve-allocation.pdf

Pack `ocha-cbpf` 2026.1. 23 pages. Split `train`. Response `local-text`. SHA-256 `5aa3de419420e6dc9c68ee1a66556a4fcf534f84d708053f74d0773ad5b5cc63`.

| Metric | Result |
| --- | --- |
| State accuracy | 100.0% (24/24) |
| Recall on present | 100.0% (14/14) |
| False-missing rate | 0.0% (0/14) |
| False-present rate | 0.0% (0/10) |
| Stated-absent detection | 100.0% (4/4) |
| Value match | 26.7% (4/15) |
| Page match | 94.4% (17/18) |
| Quote match | 72.2% (13/18) |
| Keys read from the packet | 18/24 |

Every scored key matched the answer-sheet state.

### ocha-03-afg-consortium-standard.pdf

Pack `ocha-cbpf` 2026.1. 30 pages. Split `test`. Response `local-text`. SHA-256 `4b28755c829f8f3959296819a54e5965f7039833b69ae325272a67fcb337ad1d`.

| Metric | Result |
| --- | --- |
| State accuracy | 54.2% (13/24) |
| Recall on present | 28.6% (4/14) |
| False-missing rate | 71.4% (10/14) |
| False-present rate | 0.0% (0/10) |
| Stated-absent detection | 0.0% (0/3) |
| Value match | 20.0% (3/15) |
| Page match | 16.7% (3/18) |
| Quote match | 11.1% (2/18) |
| Keys read from the packet | 4/24 |

| Key | Answer | Desk | False missing | False present | Stated absent (answer / desk) | Answer value | Desk value |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `partner.due_diligence_passed` | present | missing | yes |  | no / no | true | null |
| `partner.annex7_declarations` | present | missing | yes |  | no / no | accurate information; compliance; conflict of interest; designated entity; lega… | null |
| `selection.scorecard_or_alternative` | present | missing | yes |  | no / no | Scorecard 64/100, rank 5 of 9 | null |
| `selection.committee_decision` | present | missing | yes |  | no / no | Review committee 14 May 2026 recommended 0588 for funding | null |
| `selection.recommendation_differs` | present | missing | yes |  | no / no | true | null |
| `selection.mismatch_note` | present | missing | yes |  | no / no | Disposition note: recommended for coverage of Warduj-Tar and Yamgan-Bala distri… | null |
| `grant.consortium_controls` | present | missing | yes |  | no / no | Consortium agreement: PVRA passes funds quarterly on verified reports; quarterl… | null |
| `misconduct.annex8_path` | missing | missing |  |  | yes / no | null | null |
| `misconduct.oios_notification_path` | missing | missing |  |  | yes / no | null | null |
| `misconduct.secretariat_sanctions_regime` | negative | missing |  |  | no / no | OCHA Secretariat partner sanctions list (checked, not listed) | null |
| `onegms.project_status` | present | missing | yes |  | no / no | Pending HC approval (19 May 2026) | null |
| `onegms.selection_record` | present | missing | yes |  | no / no | Selection record uploaded to OneGMS 16 May 2026, before recommendation to HC | null |
| `idd.screen_scope` | present | missing | yes |  | no / no | designated-entity | null |
| `idd.evidence_ref` | missing | missing |  |  | yes / no | null | null |

### unfpa-01-uga-ip-workplan.pdf

Pack `unfpa` 2026.1. 20 pages. Split `train`. Response `local-text`. SHA-256 `3ea1fa35a31e6faba84f048fd3d8e56b164f3dab9c4c25d9a373096aa4eaac57`.

| Metric | Result |
| --- | --- |
| State accuracy | 100.0% (27/27) |
| Recall on present | 100.0% (15/15) |
| False-missing rate | 0.0% (0/15) |
| False-present rate | 0.0% (0/12) |
| Stated-absent detection | 100.0% (4/4) |
| Value match | 31.3% (5/16) |
| Page match | 100.0% (19/19) |
| Quote match | 36.8% (7/19) |
| Keys read from the packet | 19/27 |

Every scored key matched the answer-sheet state.

### unfpa-02-bgd-dignity-kits-rfq.pdf

Pack `unfpa` 2026.1. 13 pages. Split `train`. Response `local-text`. SHA-256 `65ca9f2e31fc5badde0733f880602d7f471ddfbbe64e9f8d4edb53b812c6fef7`.

| Metric | Result |
| --- | --- |
| State accuracy | 100.0% (27/27) |
| Recall on present | 100.0% (13/13) |
| False-missing rate | 0.0% (0/13) |
| False-present rate | 0.0% (0/14) |
| Stated-absent detection | 100.0% (5/5) |
| Value match | 35.7% (5/14) |
| Page match | 94.7% (18/19) |
| Quote match | 47.4% (9/19) |
| Keys read from the packet | 19/27 |

| Key | Answer | Desk | False missing | False present | Stated absent (answer / desk) | Answer value | Desk value |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `procurement.method_vs_threshold` | negative | negative |  |  | no / yes | false | false |

### unfpa-03-jor-ngo-noncompetitive.pdf

Pack `unfpa` 2026.1. 27 pages. Split `test`. Response `local-text`. SHA-256 `24e00615ad7caf92690e5af01c08557e35b358e4a7b2f0e92573bdd9f3ee45de`.

| Metric | Result |
| --- | --- |
| State accuracy | 40.7% (11/27) |
| Recall on present | 6.7% (1/15) |
| False-missing rate | 93.3% (14/15) |
| False-present rate | 0.0% (0/12) |
| Stated-absent detection | 0.0% (0/5) |
| Value match | 5.9% (1/17) |
| Page match | 5.0% (1/20) |
| Quote match | 5.0% (1/20) |
| Keys read from the packet | 1/27 |

| Key | Answer | Desk | False missing | False present | Stated absent (answer / desk) | Answer value | Desk value |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ip.competitive_or_waiver` | present | missing | yes |  | no / no | true | null |
| `ip.waiver_or_competition_documented` | present | missing | yes |  | no / no | Non-competitive selection template signed by the Representative 2 April 2026 (A… | null |
| `ip.threshold_approver` | negative | missing |  |  | yes / no | false | null |
| `ip.unpp_profile` | present | missing | yes |  | no / no | UNPP profile validated 20 April 2026; partner ID JO-NGO-77104 | null |
| `ip.hact_micro_assessment` | present | missing | yes |  | no / no | 2026-03-09; high | null |
| `ip.psea_assessment` | present | missing | yes |  | no / no | PSEA capacity assessment 11 March 2026: full capacity (7 of 8 core standards) | null |
| `procurement.plan_line` | present | missing | yes |  | no / no | CO procurement plan 2026 line 22: solar lamps, 1,200 units | null |
| `procurement.contract_split_checked` | negative | missing |  |  | yes / no | false | null |
| `procurement.rir` | missing | missing |  |  | yes / no | null | null |
| `integrity.related_party_checked` | present | missing | yes |  | no / no | Related-party check 12 April 2026: WSWC treasurer shares a residential address … | null |
| `payment.commodity_lines` | present | missing | yes |  | no / no | 1,200 solar lamps; 1,500 dignity kits (in kind) | null |
| `idd.subject` | present | missing | yes |  | no / no | Wadi Sirhan Women's Collective | null |
| `idd.subject_kind` | present | missing | yes |  | no / no | organization | null |
| `idd.screen_scope` | present | missing | yes |  | no / no | UN Consolidated List only | null |
| `idd.screen_date` | present | missing | yes |  | no / no | 2026-04-13 | null |
| `idd.evidence_ref` | missing | missing |  |  | yes / no | null | null |
| `idd.vrc_iprc_status` | present | missing | yes |  | no / no | No VRC or IPRC record; no UNPP flag | null |
| `idd.clearcheck_where_personnel` | missing | missing |  |  | yes / no | null | null |
| `idd.disposition_decision` | present | missing | yes |  | no / no | select | null |

## Train

7 files.

| Metric | Result |
| --- | --- |
| State accuracy | 100.0% (180/180) |
| Recall on present | 100.0% (101/101) |
| False-missing rate | 0.0% (0/101) |
| False-present rate | 0.0% (0/79) |
| Stated-absent detection | 100.0% (28/28) |
| Value match | 41.3% (45/109) |
| Page match | 94.0% (125/133) |
| Quote match | 48.9% (65/133) |
| Keys read from the packet | 133/180 |

## Test

3 files.

| Metric | Result |
| --- | --- |
| State accuracy | 48.1% (37/77) |
| Recall on present | 16.3% (7/43) |
| False-missing rate | 83.7% (36/43) |
| False-present rate | 0.0% (0/34) |
| Stated-absent detection | 0.0% (0/12) |
| Value match | 10.6% (5/47) |
| Page match | 10.5% (6/57) |
| Quote match | 5.3% (3/57) |
| Keys read from the packet | 7/77 |

## Per-key confusion

Each row is one pack key across the files in this run. Readings are answer state to desk state.

| Pack | Key | Files | State | False missing | False present | Readings |
| --- | --- | --- | --- | --- | --- | --- |
| ocha-cbpf | `grant.consortium_controls` | 3 | 2/3 | 1 | 0 | missing->missing × 2; present->missing × 1 |
| ocha-cbpf | `idd.screen_scope` | 3 | 2/3 | 1 | 0 | present->present × 2; present->missing × 1 |
| ocha-cbpf | `onegms.project_status` | 3 | 2/3 | 1 | 0 | present->present × 2; present->missing × 1 |
| ocha-cbpf | `onegms.selection_record` | 3 | 2/3 | 1 | 0 | missing->missing × 2; present->missing × 1 |
| ocha-cbpf | `partner.annex7_declarations` | 3 | 2/3 | 1 | 0 | present->present × 2; present->missing × 1 |
| ocha-cbpf | `partner.due_diligence_passed` | 3 | 2/3 | 1 | 0 | negative->negative × 1; present->missing × 1; present->present × 1 |
| ocha-cbpf | `selection.committee_decision` | 3 | 2/3 | 1 | 0 | present->present × 2; present->missing × 1 |
| ocha-cbpf | `selection.mismatch_note` | 3 | 2/3 | 1 | 0 | missing->missing × 2; present->missing × 1 |
| ocha-cbpf | `selection.recommendation_differs` | 3 | 2/3 | 1 | 0 | missing->missing × 1; present->missing × 1; present->present × 1 |
| ocha-cbpf | `selection.scorecard_or_alternative` | 3 | 2/3 | 1 | 0 | missing->missing × 1; present->missing × 1; present->present × 1 |
| unfpa | `idd.disposition_decision` | 3 | 2/3 | 1 | 0 | missing->missing × 2; present->missing × 1 |
| unfpa | `idd.screen_date` | 3 | 2/3 | 1 | 0 | missing->missing × 1; present->missing × 1; present->present × 1 |
| unfpa | `idd.screen_scope` | 3 | 2/3 | 1 | 0 | present->present × 2; present->missing × 1 |
| unfpa | `idd.subject` | 3 | 2/3 | 1 | 0 | present->present × 2; present->missing × 1 |
| unfpa | `idd.subject_kind` | 3 | 2/3 | 1 | 0 | present->present × 2; present->missing × 1 |
| unfpa | `idd.vrc_iprc_status` | 3 | 2/3 | 1 | 0 | present->present × 2; present->missing × 1 |
| unfpa | `integrity.related_party_checked` | 3 | 2/3 | 1 | 0 | missing->missing × 1; present->missing × 1; present->present × 1 |
| unfpa | `ip.competitive_or_waiver` | 3 | 2/3 | 1 | 0 | missing->missing × 1; present->missing × 1; present->present × 1 |
| unfpa | `ip.hact_micro_assessment` | 3 | 2/3 | 1 | 0 | missing->missing × 1; present->missing × 1; present->present × 1 |
| unfpa | `ip.psea_assessment` | 3 | 2/3 | 1 | 0 | missing->missing × 2; present->missing × 1 |
| unfpa | `ip.unpp_profile` | 3 | 2/3 | 1 | 0 | missing->missing × 1; present->missing × 1; present->present × 1 |
| unfpa | `ip.waiver_or_competition_documented` | 3 | 2/3 | 1 | 0 | missing->missing × 1; present->missing × 1; present->present × 1 |
| unfpa | `payment.commodity_lines` | 3 | 2/3 | 1 | 0 | missing->missing × 1; present->missing × 1; present->present × 1 |
| unfpa | `procurement.plan_line` | 3 | 2/3 | 1 | 0 | missing->missing × 1; present->missing × 1; present->present × 1 |
| global-fund | `documentation.award_rationale_on_file` | 4 | 3/4 | 1 | 0 | present->present × 2; missing->missing × 1; present->missing × 1 |
| global-fund | `idd.screen_result` | 4 | 3/4 | 1 | 0 | present->present × 3; present->missing × 1 |
| global-fund | `idd.screen_scope` | 4 | 3/4 | 1 | 0 | present->present × 3; present->missing × 1 |
| global-fund | `idd.screen_timing` | 4 | 3/4 | 1 | 0 | missing->missing × 2; negative->negative × 1; present->missing × 1 |
| global-fund | `idd.subject` | 4 | 3/4 | 1 | 0 | present->present × 3; present->missing × 1 |
| global-fund | `idd.subject_kind` | 4 | 3/4 | 1 | 0 | present->present × 3; present->missing × 1 |
| global-fund | `idd.subject_role` | 4 | 3/4 | 1 | 0 | present->present × 3; present->missing × 1 |
| global-fund | `integrity.coi_disclosed` | 4 | 3/4 | 1 | 0 | missing->missing × 1; negative->negative × 1; present->missing × 1; present->present × 1 |
| global-fund | `procurement.competition_or_exemption_documented` | 4 | 3/4 | 1 | 0 | present->present × 2; missing->missing × 1; present->missing × 1 |
| global-fund | `sr.capacity_assessed` | 4 | 3/4 | 1 | 0 | missing->missing × 3; present->missing × 1 |
| global-fund | `sr.selection_documented` | 4 | 3/4 | 1 | 0 | missing->missing × 2; present->missing × 1; present->present × 1 |
| global-fund | `sr.written_agreement_on_file` | 4 | 3/4 | 1 | 0 | missing->missing × 3; present->missing × 1 |
| ocha-cbpf | `misconduct.secretariat_sanctions_regime` | 3 | 2/3 | 0 | 0 | present->present × 2; negative->missing × 1 |
| unfpa | `ip.threshold_approver` | 3 | 2/3 | 0 | 0 | missing->missing × 1; negative->missing × 1; present->present × 1 |
| unfpa | `procurement.contract_split_checked` | 3 | 2/3 | 0 | 0 | missing->missing × 1; negative->missing × 1; present->present × 1 |
| global-fund | `eligibility.contractor_capable` | 4 | 3/4 | 0 | 0 | present->present × 3; negative->missing × 1 |
| global-fund | `award.contract_value_usd` | 4 | 4/4 | 0 | 0 | present->present × 3; missing->missing × 1 |
| global-fund | `idd.affiliated_persons` | 4 | 4/4 | 0 | 0 | missing->missing × 3; present->present × 1 |
| global-fund | `idd.disposition_decision` | 4 | 4/4 | 0 | 0 | missing->missing × 3; present->present × 1 |
| global-fund | `idd.disposition_owner` | 4 | 4/4 | 0 | 0 | missing->missing × 3; present->present × 1 |
| global-fund | `idd.disposition_rationale` | 4 | 4/4 | 0 | 0 | missing->missing × 3; present->present × 1 |
| global-fund | `idd.evidence_ref` | 4 | 4/4 | 0 | 0 | present->present × 3; missing->missing × 1 |
| global-fund | `idd.gf_notification` | 4 | 4/4 | 0 | 0 | missing->missing × 3; present->present × 1 |
| global-fund | `idd.list_vintage` | 4 | 4/4 | 0 | 0 | missing->missing × 3; present->present × 1 |
| global-fund | `idd.screen_date` | 4 | 4/4 | 0 | 0 | present->present × 3; missing->missing × 1 |
| global-fund | `idd.screen_modality` | 4 | 4/4 | 0 | 0 | present->present × 3; missing->missing × 1 |
| global-fund | `procurement.competitive_or_exempt` | 4 | 4/4 | 0 | 0 | present->present × 3; negative->negative × 1 |
| global-fund | `procurement.solicitation_notified` | 4 | 4/4 | 0 | 0 | missing->missing × 2; present->present × 2 |
| global-fund | `threshold.method_aligned` | 4 | 4/4 | 0 | 0 | missing->missing × 2; negative->negative × 2 |
| ocha-cbpf | `allocation.modality` | 3 | 3/3 | 0 | 0 | present->present × 3 |
| ocha-cbpf | `allocation.preselection_justification` | 3 | 3/3 | 0 | 0 | missing->missing × 3 |
| ocha-cbpf | `allocation.strategy_on_file` | 3 | 3/3 | 0 | 0 | present->present × 2; missing->missing × 1 |
| ocha-cbpf | `grant.agreement_complete` | 3 | 3/3 | 0 | 0 | missing->missing × 2; present->present × 1 |
| ocha-cbpf | `grant.budget_template` | 3 | 3/3 | 0 | 0 | missing->missing × 2; present->present × 1 |
| ocha-cbpf | `idd.disposition_decision` | 3 | 3/3 | 0 | 0 | missing->missing × 2; present->present × 1 |
| ocha-cbpf | `idd.evidence_ref` | 3 | 3/3 | 0 | 0 | missing->missing × 2; present->present × 1 |
| ocha-cbpf | `idd.screen_result` | 3 | 3/3 | 0 | 0 | present->present × 3 |
| ocha-cbpf | `idd.subject` | 3 | 3/3 | 0 | 0 | present->present × 3 |
| ocha-cbpf | `misconduct.annex8_path` | 3 | 3/3 | 0 | 0 | missing->missing × 3 |
| ocha-cbpf | `misconduct.annex9_notification` | 3 | 3/3 | 0 | 0 | present->present × 2; missing->missing × 1 |
| ocha-cbpf | `misconduct.oios_notification_path` | 3 | 3/3 | 0 | 0 | missing->missing × 2; present->present × 1 |
| ocha-cbpf | `partner.capacity_assessment` | 3 | 3/3 | 0 | 0 | missing->missing × 2; present->present × 1 |
| unfpa | `idd.clearcheck_where_personnel` | 3 | 3/3 | 0 | 0 | missing->missing × 3 |
| unfpa | `idd.evidence_ref` | 3 | 3/3 | 0 | 0 | present->present × 2; missing->missing × 1 |
| unfpa | `idd.screen_result` | 3 | 3/3 | 0 | 0 | present->present × 3 |
| unfpa | `integrity.coi_declared` | 3 | 3/3 | 0 | 0 | missing->missing × 1; negative->negative × 1; present->present × 1 |
| unfpa | `payment.face_workplan_link` | 3 | 3/3 | 0 | 0 | missing->missing × 2; present->present × 1 |
| unfpa | `procurement.crc_gate` | 3 | 3/3 | 0 | 0 | missing->missing × 2; present->present × 1 |
| unfpa | `procurement.lta_rate_reconciliation` | 3 | 3/3 | 0 | 0 | missing->missing × 2; present->present × 1 |
| unfpa | `procurement.method_vs_threshold` | 3 | 3/3 | 0 | 0 | missing->missing × 2; negative->negative × 1 |
| unfpa | `procurement.po_or_contract` | 3 | 3/3 | 0 | 0 | missing->missing × 2; present->present × 1 |
| unfpa | `procurement.rfq_criteria_and_scores` | 3 | 3/3 | 0 | 0 | missing->missing × 2; present->present × 1 |
| unfpa | `procurement.rir` | 3 | 3/3 | 0 | 0 | missing->missing × 3 |

