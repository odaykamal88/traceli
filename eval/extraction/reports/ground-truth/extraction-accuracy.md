# Trace-li extraction accuracy

Pipeline `trace-v4`. Mode `local-text`. 10 files.

False-missing is the share of keys that are truly present and that the desk reported missing. That is the rate to drive down. False-present is the share of keys that are not present and that the desk reported present.

A stated absence is detected when the answer sheet sets `statedAbsent` and the desk stores a missing reason beginning with `Stated absent in this packet:`, or stores `negative` for that same key. A negative whose answer sheet sets `statedAbsent` to false is an adverse fact. It is not counted as a false stated-absence. Value match ignores case and collapses whitespace. Page match counts only keys whose answer sheet names a page. Quote match collapses whitespace runs to one space and compares the answer-sheet sentence with the desk quote; it does not fold case.

## Overall

| Metric | Result |
| --- | --- |
| State accuracy | 39.7% (102/257) |
| Recall on present | 0.7% (1/144) |
| False-missing rate | 99.3% (143/144) |
| False-present rate | 0.0% (0/113) |
| Stated-absent detection | 0.0% (0/40) |
| Value match | 0.0% (0/156) |
| Page match | 0.5% (1/190) |
| Quote match | 0.0% (0/190) |
| Keys read from the packet | 1/257 |

## By pack

### global-fund

| Metric | Result |
| --- | --- |
| State accuracy | 37.5% (39/104) |
| Recall on present | 0.0% (0/59) |
| False-missing rate | 100.0% (59/59) |
| False-present rate | 0.0% (0/45) |
| Stated-absent detection | 0.0% (0/15) |
| Value match | 0.0% (0/65) |
| Page match | 0.0% (0/78) |
| Quote match | 0.0% (0/78) |
| Keys read from the packet | 0/104 |

### ocha-cbpf

| Metric | Result |
| --- | --- |
| State accuracy | 38.9% (28/72) |
| Recall on present | 0.0% (0/42) |
| False-missing rate | 100.0% (42/42) |
| False-present rate | 0.0% (0/30) |
| Stated-absent detection | 0.0% (0/11) |
| Value match | 0.0% (0/44) |
| Page match | 0.0% (0/54) |
| Quote match | 0.0% (0/54) |
| Keys read from the packet | 0/72 |

### unfpa

| Metric | Result |
| --- | --- |
| State accuracy | 43.2% (35/81) |
| Recall on present | 2.3% (1/43) |
| False-missing rate | 97.7% (42/43) |
| False-present rate | 0.0% (0/38) |
| Stated-absent detection | 0.0% (0/14) |
| Value match | 0.0% (0/47) |
| Page match | 1.7% (1/58) |
| Quote match | 0.0% (0/58) |
| Keys read from the packet | 1/81 |

## By file

### gf-01-mwi-sr-selection.pdf

Pack `global-fund` 2026.2. 18 pages. Split `train`. Response `local-text`. SHA-256 `a328e41d1141aae10537d34d409c056a1eb6aa4a29acf46315b33178116942f8`.

| Metric | Result |
| --- | --- |
| State accuracy | 38.5% (10/26) |
| Recall on present | 0.0% (0/15) |
| False-missing rate | 100.0% (15/15) |
| False-present rate | 0.0% (0/11) |
| Stated-absent detection | 0.0% (0/4) |
| Value match | 0.0% (0/16) |
| Page match | 0.0% (0/19) |
| Quote match | 0.0% (0/19) |
| Keys read from the packet | 0/26 |

| Key | Answer | Desk | False missing | False present | Stated absent (answer / desk) | Answer value | Desk value |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `eligibility.contractor_capable` | present | missing | yes |  | no / no | true | null |
| `integrity.coi_disclosed` | negative | missing |  |  | yes / no | false | null |
| `procurement.competitive_or_exempt` | present | missing | yes |  | no / no | true | null |
| `procurement.competition_or_exemption_documented` | present | missing | yes |  | no / no | Call CHP/SR/2026/01, applicant register, opening minutes and evaluation report … | null |
| `procurement.solicitation_notified` | present | missing | yes |  | no / no | Call published 12 January 2026 in two national newspapers and on the CHP websit… | null |
| `documentation.award_rationale_on_file` | present | missing | yes |  | no / no | Recommendation rationale: highest score, only applicant covering all 38 catchme… | null |
| `award.contract_value_usd` | present | missing | yes |  | no / no | 1284600 | null |
| `sr.selection_documented` | present | missing | yes |  | no / no | Two-stage evaluation by five-member committee, 17-18 March 2026; consensus scor… | null |
| `sr.written_agreement_on_file` | missing | missing |  |  | yes / no | null | null |
| `idd.subject` | present | missing | yes |  | no / no | Mbalame Community Health Network | null |
| `idd.subject_kind` | present | missing | yes |  | no / no | organization | null |
| `idd.subject_role` | present | missing | yes |  | no / no | sr | null |
| `idd.affiliated_persons` | missing | missing |  |  | yes / no | null | null |
| `idd.screen_scope` | present | missing | yes |  | no / no | un ofac us-state switzerland debarment ineligibility | null |
| `idd.screen_date` | present | missing | yes |  | no / no | 2026-03-24 | null |
| `idd.screen_modality` | present | missing | yes |  | no / no | in_house | null |
| `idd.screen_result` | present | missing | yes |  | no / no | clear | null |
| `idd.evidence_ref` | present | missing | yes |  | no / no | CHP-IDD-2026-014 | null |
| `idd.disposition_decision` | missing | missing |  |  | yes / no | null | null |

### gf-02-moz-lab-reagents-tender.pdf

Pack `global-fund` 2026.2. 25 pages. Split `train`. Response `local-text`. SHA-256 `b919c781d16225394436d1d93469a135e2dd2c896801feb9bd6f4946c23cd581`.

| Metric | Result |
| --- | --- |
| State accuracy | 38.5% (10/26) |
| Recall on present | 0.0% (0/15) |
| False-missing rate | 100.0% (15/15) |
| False-present rate | 0.0% (0/11) |
| Stated-absent detection | 0.0% (0/3) |
| Value match | 0.0% (0/16) |
| Page match | 0.0% (0/19) |
| Quote match | 0.0% (0/19) |
| Keys read from the packet | 0/26 |

| Key | Answer | Desk | False missing | False present | Stated absent (answer / desk) | Answer value | Desk value |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `eligibility.contractor_capable` | present | missing | yes |  | no / no | true | null |
| `procurement.competitive_or_exempt` | present | missing | yes |  | no / no | true | null |
| `procurement.competition_or_exemption_documented` | present | missing | yes |  | no / no | Tender dossier, bid opening record and evaluation report filed under PSM/2026/L… | null |
| `procurement.solicitation_notified` | present | missing | yes |  | no / no | Invitation published 2 March 2026 in Noticias and on the national procurement p… | null |
| `documentation.award_rationale_on_file` | missing | missing |  |  | yes / no | null | null |
| `award.contract_value_usd` | present | missing | yes |  | no / no | 2317452.8 | null |
| `threshold.method_aligned` | negative | missing |  |  | no / no | false | null |
| `sr.selection_documented` | missing | missing |  |  | yes / no | null | null |
| `idd.subject` | present | missing | yes |  | no / no | Tavira Diagnostics Lda | null |
| `idd.subject_kind` | present | missing | yes |  | no / no | organization | null |
| `idd.subject_role` | present | missing | yes |  | no / no | supplier | null |
| `idd.screen_scope` | present | missing | yes |  | no / no | un ofac us-state switzerland debarment ineligibility | null |
| `idd.list_vintage` | present | missing | yes |  | no / no | Lists as downloaded 28 April 2026 (provider dataset release 2026-04-27) | null |
| `idd.screen_modality` | present | missing | yes |  | no / no | gf_preapproved_vendor | null |
| `idd.screen_result` | present | missing | yes |  | no / no | potential_match | null |
| `idd.evidence_ref` | present | missing | yes |  | no / no | NDC-2026-0917 | null |
| `idd.disposition_decision` | present | missing | yes |  | no / no | select | null |
| `idd.disposition_rationale` | present | missing | yes |  | no / no | Different date of birth and nationality from the listed individual (passport co… | null |
| `idd.gf_notification` | missing | missing |  |  | yes / no | null | null |

### gf-03-cmr-single-source-fleet.pdf

Pack `global-fund` 2026.2. 14 pages. Split `train`. Response `local-text`. SHA-256 `d14dca0105e8b529451d4b330a3389c7fe54535170a32fd065fa15d19055f807`.

| Metric | Result |
| --- | --- |
| State accuracy | 30.8% (8/26) |
| Recall on present | 0.0% (0/15) |
| False-missing rate | 100.0% (15/15) |
| False-present rate | 0.0% (0/11) |
| Stated-absent detection | 0.0% (0/4) |
| Value match | 0.0% (0/18) |
| Page match | 0.0% (0/21) |
| Quote match | 0.0% (0/21) |
| Keys read from the packet | 0/26 |

| Key | Answer | Desk | False missing | False present | Stated absent (answer / desk) | Answer value | Desk value |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `eligibility.contractor_capable` | present | missing | yes |  | no / no | true | null |
| `integrity.coi_disclosed` | present | missing | yes |  | no / no | true | null |
| `procurement.competitive_or_exempt` | negative | missing |  |  | yes / no | false | null |
| `procurement.competition_or_exemption_documented` | missing | missing |  |  | yes / no | null | null |
| `procurement.solicitation_notified` | missing | missing |  |  | yes / no | null | null |
| `documentation.award_rationale_on_file` | present | missing | yes |  | no / no | Justification memo of 5 February 2026: urgency, prior servicing history, worksh… | null |
| `award.contract_value_usd` | present | missing | yes |  | no / no | 309800 | null |
| `threshold.method_aligned` | negative | missing |  |  | no / no | false | null |
| `idd.subject` | present | missing | yes |  | no / no | Nkolbo Motors SARL | null |
| `idd.subject_kind` | present | missing | yes |  | no / no | organization | null |
| `idd.subject_role` | present | missing | yes |  | no / no | supplier | null |
| `idd.affiliated_persons` | present | missing | yes |  | no / no | Owner-manager (sole shareholder) and workshop manager | null |
| `idd.screen_scope` | present | missing | yes |  | no / no | UN consolidated list; OFAC SDN; World Bank debarment | null |
| `idd.screen_date` | present | missing | yes |  | no / no | 2026-02-11 | null |
| `idd.screen_modality` | present | missing | yes |  | no / no | other | null |
| `idd.screen_result` | present | missing | yes |  | no / no | potential_match | null |
| `idd.screen_timing` | negative | missing |  |  | no / no | after_engagement | null |
| `idd.evidence_ref` | present | missing | yes |  | no / no | LEG/2026/031 | null |
| `idd.disposition_owner` | present | missing | yes |  | no / no | Director of Programmes, FMKS | null |
| `idd.disposition_rationale` | missing | missing |  |  | yes / no | null | null |
| `idd.gf_notification` | present | missing | yes |  | no / no | Country Team informed by email 19 February 2026 (ref. FMKS/CT/2026/012) | null |

### gf-04-npl-sr-continuation.pdf

Pack `global-fund` 2026.2. 32 pages. Split `test`. Response `local-text`. SHA-256 `f5efb7d984f06f759281f7ecbe5e7326fb7f80788a3c7387d19b07d0111835cf`.

| Metric | Result |
| --- | --- |
| State accuracy | 42.3% (11/26) |
| Recall on present | 0.0% (0/14) |
| False-missing rate | 100.0% (14/14) |
| False-present rate | 0.0% (0/12) |
| Stated-absent detection | 0.0% (0/4) |
| Value match | 0.0% (0/15) |
| Page match | 0.0% (0/19) |
| Quote match | 0.0% (0/19) |
| Keys read from the packet | 0/26 |

| Key | Answer | Desk | False missing | False present | Stated absent (answer / desk) | Answer value | Desk value |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `eligibility.contractor_capable` | negative | missing |  |  | no / no | false | null |
| `integrity.coi_disclosed` | present | missing | yes |  | no / no | true | null |
| `procurement.competitive_or_exempt` | present | missing | yes |  | no / no | true | null |
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
| `idd.screen_date` | present | missing | yes |  | no / no | 2026-02-09 | null |
| `idd.screen_result` | present | missing | yes |  | no / no | clear | null |
| `idd.screen_timing` | present | missing | yes |  | no / no | grant_cycle_rerun | null |
| `idd.disposition_decision` | missing | missing |  |  | yes / no | null | null |

### ocha-01-som-standard-allocation.pdf

Pack `ocha-cbpf` 2026.1. 16 pages. Split `train`. Response `local-text`. SHA-256 `cd27b96da8214d3042130ae6fbcd978c0bb615d810d234ed29f0f8d0284a8054`.

| Metric | Result |
| --- | --- |
| State accuracy | 41.7% (10/24) |
| Recall on present | 0.0% (0/14) |
| False-missing rate | 100.0% (14/14) |
| False-present rate | 0.0% (0/10) |
| Stated-absent detection | 0.0% (0/4) |
| Value match | 0.0% (0/14) |
| Page match | 0.0% (0/18) |
| Quote match | 0.0% (0/18) |
| Keys read from the packet | 0/24 |

| Key | Answer | Desk | False missing | False present | Stated absent (answer / desk) | Answer value | Desk value |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `partner.due_diligence_passed` | present | missing | yes |  | no / no | true | null |
| `partner.capacity_assessment` | present | missing | yes |  | no / no | Capacity assessment completed 2 March 2026; risk level medium | null |
| `partner.annex7_declarations` | present | missing | yes |  | no / no | accurate-info compliance coi designated-entity legal-process disability psea | null |
| `allocation.modality` | present | missing | yes |  | no / no | standard | null |
| `allocation.strategy_on_file` | present | missing | yes |  | no / no | SA1 allocation strategy paper approved by the HC on 3 February 2026 (Annex A) | null |
| `selection.scorecard_or_alternative` | present | missing | yes |  | no / no | Scorecard total 78/100 for project 0213 | null |
| `selection.committee_decision` | present | missing | yes |  | no / no | Strategic review committee 12 March 2026 recommended 0213 for funding | null |
| `selection.recommendation_differs` | present | missing | yes |  | no / no | false | null |
| `grant.agreement_complete` | missing | missing |  |  | yes / no | null | null |
| `grant.budget_template` | missing | missing |  |  | yes / no | null | null |
| `misconduct.annex9_notification` | present | missing | yes |  | no / no | Partner must notify the HFU within 48 hours of becoming aware of suspected frau… | null |
| `misconduct.oios_notification_path` | missing | missing |  |  | yes / no | null | null |
| `misconduct.secretariat_sanctions_regime` | present | missing | yes |  | no / no | none | null |
| `onegms.project_status` | present | missing | yes |  | no / no | Under technical review | null |
| `onegms.selection_record` | missing | missing |  |  | yes / no | null | null |
| `idd.subject` | present | missing | yes |  | no / no | Juba Riverine Relief Organisation | null |
| `idd.screen_scope` | present | missing | yes |  | no / no | designated-entity | null |
| `idd.screen_result` | present | missing | yes |  | no / no | clear | null |

### ocha-02-nga-reserve-allocation.pdf

Pack `ocha-cbpf` 2026.1. 23 pages. Split `train`. Response `local-text`. SHA-256 `5aa3de419420e6dc9c68ee1a66556a4fcf534f84d708053f74d0773ad5b5cc63`.

| Metric | Result |
| --- | --- |
| State accuracy | 37.5% (9/24) |
| Recall on present | 0.0% (0/14) |
| False-missing rate | 100.0% (14/14) |
| False-present rate | 0.0% (0/10) |
| Stated-absent detection | 0.0% (0/4) |
| Value match | 0.0% (0/15) |
| Page match | 0.0% (0/18) |
| Quote match | 0.0% (0/18) |
| Keys read from the packet | 0/24 |

| Key | Answer | Desk | False missing | False present | Stated absent (answer / desk) | Answer value | Desk value |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `partner.due_diligence_passed` | negative | missing |  |  | yes / no | false | null |
| `partner.capacity_assessment` | missing | missing |  |  | yes / no | null | null |
| `partner.annex7_declarations` | present | missing | yes |  | no / no | accurate-info compliance coi designated-entity legal-process disability psea | null |
| `allocation.modality` | present | missing | yes |  | no / no | reserve | null |
| `allocation.preselection_justification` | missing | missing |  |  | yes / no | null | null |
| `allocation.strategy_on_file` | present | missing | yes |  | no / no | Reserve allocation strategy note 8 August 2026 with pre-selection criteria | null |
| `selection.scorecard_or_alternative` | missing | missing |  |  | yes / no | null | null |
| `selection.committee_decision` | present | missing | yes |  | no / no | Review committee 22 August 2026 recommended funding of all three projects | null |
| `grant.agreement_complete` | present | missing | yes |  | no / no | Grant agreement NGA-26/HFU/R2/H/NNGO/0417 signed 29 August 2026 with budget, wo… | null |
| `grant.budget_template` | present | missing | yes |  | no / no | Budget on standard fund template (annex 2 of agreement) | null |
| `misconduct.annex9_notification` | present | missing | yes |  | no / no | Annex 9: partner reports suspected fraud to the HFU within 48 hours | null |
| `misconduct.oios_notification_path` | present | missing | yes |  | no / no | Allegations involving UN personnel reported to OIOS through the HFU | null |
| `misconduct.secretariat_sanctions_regime` | present | missing | yes |  | no / no | none | null |
| `onegms.project_status` | present | missing | yes |  | no / no | Approved by HC; grant agreement signed | null |
| `idd.subject` | present | missing | yes |  | no / no | Northern Floodplain Health Response Initiative | null |
| `idd.screen_scope` | present | missing | yes |  | no / no | designated-entity | null |
| `idd.screen_result` | present | missing | yes |  | no / no | unresolved | null |
| `idd.evidence_ref` | present | missing | yes |  | no / no | HFU screening note HFU/NGA/DD/2026/118 | null |

### ocha-03-afg-consortium-standard.pdf

Pack `ocha-cbpf` 2026.1. 30 pages. Split `test`. Response `local-text`. SHA-256 `4b28755c829f8f3959296819a54e5965f7039833b69ae325272a67fcb337ad1d`.

| Metric | Result |
| --- | --- |
| State accuracy | 37.5% (9/24) |
| Recall on present | 0.0% (0/14) |
| False-missing rate | 100.0% (14/14) |
| False-present rate | 0.0% (0/10) |
| Stated-absent detection | 0.0% (0/3) |
| Value match | 0.0% (0/15) |
| Page match | 0.0% (0/18) |
| Quote match | 0.0% (0/18) |
| Keys read from the packet | 0/24 |

| Key | Answer | Desk | False missing | False present | Stated absent (answer / desk) | Answer value | Desk value |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `partner.due_diligence_passed` | present | missing | yes |  | no / no | true | null |
| `partner.annex7_declarations` | present | missing | yes |  | no / no | accurate information; compliance; conflict of interest; designated entity; lega… | null |
| `allocation.modality` | present | missing | yes |  | no / no | standard | null |
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
| `idd.subject` | present | missing | yes |  | no / no | Pamir Valley Rural Aid and Kokcha Women's Association | null |
| `idd.screen_scope` | present | missing | yes |  | no / no | designated-entity | null |
| `idd.screen_result` | present | missing | yes |  | no / no | potential_match | null |
| `idd.evidence_ref` | missing | missing |  |  | yes / no | null | null |
| `idd.disposition_decision` | present | missing | yes |  | no / no | continue | null |

### unfpa-01-uga-ip-workplan.pdf

Pack `unfpa` 2026.1. 20 pages. Split `train`. Response `local-text`. SHA-256 `3ea1fa35a31e6faba84f048fd3d8e56b164f3dab9c4c25d9a373096aa4eaac57`.

| Metric | Result |
| --- | --- |
| State accuracy | 44.4% (12/27) |
| Recall on present | 6.7% (1/15) |
| False-missing rate | 93.3% (14/15) |
| False-present rate | 0.0% (0/12) |
| Stated-absent detection | 0.0% (0/4) |
| Value match | 0.0% (0/16) |
| Page match | 5.3% (1/19) |
| Quote match | 0.0% (0/19) |
| Keys read from the packet | 1/27 |

| Key | Answer | Desk | False missing | False present | Stated absent (answer / desk) | Answer value | Desk value |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ip.competitive_or_waiver` | present | missing | yes |  | no / no | true | null |
| `ip.waiver_or_competition_documented` | present | missing | yes |  | no / no | CFEI notice, panel scoring sheets and selection memo (Annex B) | null |
| `ip.threshold_approver` | present | missing | yes |  | no / no | true | null |
| `ip.unpp_profile` | present | missing | yes |  | no / no | UNPP partner ID UG-NGO-48213; profile complete; verified 30 January 2026 | null |
| `ip.psea_assessment` | missing | missing |  |  | yes / no | null | null |
| `procurement.plan_line` | missing | missing |  |  | yes / no | null | null |
| `integrity.coi_declared` | negative | missing |  |  | yes / no | false | null |
| `integrity.related_party_checked` | present | missing | yes |  | no / no | Related-party and beneficial-ownership check 10 March 2026: no shared addresses… | null |
| `payment.face_workplan_link` | present | missing | yes |  | no / no | FACE advances linked to WP-UGA-2026-RWHI-01 | null |
| `payment.commodity_lines` | present | missing | yes |  | no / no | 2,400 dignity kits; 60 midwifery kits; 12 clinical management of rape kits (in … | null |
| `idd.subject` | present | missing | yes |  | no / no | Rwenzo Women's Health Initiative | null |
| `idd.subject_kind` | present | missing | yes |  | no / no | organization | null |
| `idd.screen_scope` | present | missing | yes |  | no / no | un ungm | null |
| `idd.screen_date` | present | missing | yes |  | no / no | 2026-03-11 | null |
| `idd.screen_result` | present | missing | yes |  | no / no | clear | null |
| `idd.evidence_ref` | present | missing | yes |  | no / no | Screening printout UGA-RM-2026-031 | null |
| `idd.vrc_iprc_status` | present | missing | yes |  | no / no | No VRC sanction, no IPRC case, no UNPP flag | null |
| `idd.clearcheck_where_personnel` | missing | missing |  |  | yes / no | null | null |

### unfpa-02-bgd-dignity-kits-rfq.pdf

Pack `unfpa` 2026.1. 13 pages. Split `train`. Response `local-text`. SHA-256 `65ca9f2e31fc5badde0733f880602d7f471ddfbbe64e9f8d4edb53b812c6fef7`.

| Metric | Result |
| --- | --- |
| State accuracy | 48.1% (13/27) |
| Recall on present | 0.0% (0/13) |
| False-missing rate | 100.0% (13/13) |
| False-present rate | 0.0% (0/14) |
| Stated-absent detection | 0.0% (0/5) |
| Value match | 0.0% (0/14) |
| Page match | 0.0% (0/19) |
| Quote match | 0.0% (0/19) |
| Keys read from the packet | 0/27 |

| Key | Answer | Desk | False missing | False present | Stated absent (answer / desk) | Answer value | Desk value |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ip.unpp_profile` | missing | missing |  |  | yes / no | null | null |
| `procurement.plan_line` | present | missing | yes |  | no / no | 2026 procurement plan item 14: dignity kits, 18,000 units, est. US$ 396,000 (tw… | null |
| `procurement.method_vs_threshold` | negative | missing |  |  | no / no | false | null |
| `procurement.crc_gate` | present | missing | yes |  | no / no | Local CRC meeting 16 June 2026, minutes LCRC/2026/22, recommended award | null |
| `procurement.contract_split_checked` | present | missing | yes |  | no / no | true | null |
| `procurement.rfq_criteria_and_scores` | present | missing | yes |  | no / no | Criteria in RFQ: technical compliance pass/fail; delivery time 20; price 80. In… | null |
| `procurement.po_or_contract` | present | missing | yes |  | no / no | PO BGD10-2026-0381 approved 24 June 2026 | null |
| `procurement.rir` | missing | missing |  |  | yes / no | null | null |
| `procurement.lta_rate_reconciliation` | present | missing | yes |  | no / no | Offered US$ 23.878/kit vs PSB global LTA reference US$ 22.10 + US$ 1.95 freight… | null |
| `integrity.coi_declared` | present | missing | yes |  | no / no | true | null |
| `payment.face_workplan_link` | missing | missing |  |  | yes / no | null | null |
| `payment.commodity_lines` | missing | missing |  |  | yes / no | null | null |
| `idd.subject` | present | missing | yes |  | no / no | Meghna Supply House Ltd | null |
| `idd.subject_kind` | present | missing | yes |  | no / no | organization | null |
| `idd.screen_scope` | present | missing | yes |  | no / no | un ungm | null |
| `idd.screen_result` | present | missing | yes |  | no / no | clear | null |
| `idd.evidence_ref` | present | missing | yes |  | no / no | Screen log SCL-BGD-2026-0602-3 | null |
| `idd.vrc_iprc_status` | present | missing | yes |  | no / no | Not on VRC sanctions list; no UNGM ineligibility flag | null |
| `idd.clearcheck_where_personnel` | missing | missing |  |  | yes / no | null | null |

### unfpa-03-jor-ngo-noncompetitive.pdf

Pack `unfpa` 2026.1. 27 pages. Split `test`. Response `local-text`. SHA-256 `24e00615ad7caf92690e5af01c08557e35b358e4a7b2f0e92573bdd9f3ee45de`.

| Metric | Result |
| --- | --- |
| State accuracy | 37.0% (10/27) |
| Recall on present | 0.0% (0/15) |
| False-missing rate | 100.0% (15/15) |
| False-present rate | 0.0% (0/12) |
| Stated-absent detection | 0.0% (0/5) |
| Value match | 0.0% (0/17) |
| Page match | 0.0% (0/20) |
| Quote match | 0.0% (0/20) |
| Keys read from the packet | 0/27 |

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
| `idd.screen_result` | present | missing | yes |  | no / no | potential_match | null |
| `idd.evidence_ref` | missing | missing |  |  | yes / no | null | null |
| `idd.vrc_iprc_status` | present | missing | yes |  | no / no | No VRC or IPRC record; no UNPP flag | null |
| `idd.clearcheck_where_personnel` | missing | missing |  |  | yes / no | null | null |
| `idd.disposition_decision` | present | missing | yes |  | no / no | select | null |

## Train

7 files.

| Metric | Result |
| --- | --- |
| State accuracy | 40.0% (72/180) |
| Recall on present | 1.0% (1/101) |
| False-missing rate | 99.0% (100/101) |
| False-present rate | 0.0% (0/79) |
| Stated-absent detection | 0.0% (0/28) |
| Value match | 0.0% (0/109) |
| Page match | 0.8% (1/133) |
| Quote match | 0.0% (0/133) |
| Keys read from the packet | 1/180 |

## Test

3 files.

| Metric | Result |
| --- | --- |
| State accuracy | 39.0% (30/77) |
| Recall on present | 0.0% (0/43) |
| False-missing rate | 100.0% (43/43) |
| False-present rate | 0.0% (0/34) |
| Stated-absent detection | 0.0% (0/12) |
| Value match | 0.0% (0/47) |
| Page match | 0.0% (0/57) |
| Quote match | 0.0% (0/57) |
| Keys read from the packet | 0/77 |

## Per-key confusion

Each row is one pack key across the files in this run. Readings are answer state to desk state.

| Pack | Key | Files | State | False missing | False present | Readings |
| --- | --- | --- | --- | --- | --- | --- |
| global-fund | `idd.screen_result` | 4 | 0/4 | 4 | 0 | present->missing × 4 |
| global-fund | `idd.screen_scope` | 4 | 0/4 | 4 | 0 | present->missing × 4 |
| global-fund | `idd.subject` | 4 | 0/4 | 4 | 0 | present->missing × 4 |
| global-fund | `idd.subject_kind` | 4 | 0/4 | 4 | 0 | present->missing × 4 |
| global-fund | `idd.subject_role` | 4 | 0/4 | 4 | 0 | present->missing × 4 |
| global-fund | `eligibility.contractor_capable` | 4 | 0/4 | 3 | 0 | present->missing × 3; negative->missing × 1 |
| global-fund | `procurement.competitive_or_exempt` | 4 | 0/4 | 3 | 0 | present->missing × 3; negative->missing × 1 |
| ocha-cbpf | `allocation.modality` | 3 | 0/3 | 3 | 0 | present->missing × 3 |
| ocha-cbpf | `idd.screen_result` | 3 | 0/3 | 3 | 0 | present->missing × 3 |
| ocha-cbpf | `idd.screen_scope` | 3 | 0/3 | 3 | 0 | present->missing × 3 |
| ocha-cbpf | `idd.subject` | 3 | 0/3 | 3 | 0 | present->missing × 3 |
| ocha-cbpf | `onegms.project_status` | 3 | 0/3 | 3 | 0 | present->missing × 3 |
| ocha-cbpf | `partner.annex7_declarations` | 3 | 0/3 | 3 | 0 | present->missing × 3 |
| ocha-cbpf | `selection.committee_decision` | 3 | 0/3 | 3 | 0 | present->missing × 3 |
| unfpa | `idd.screen_result` | 3 | 0/3 | 3 | 0 | present->missing × 3 |
| unfpa | `idd.screen_scope` | 3 | 0/3 | 3 | 0 | present->missing × 3 |
| unfpa | `idd.subject` | 3 | 0/3 | 3 | 0 | present->missing × 3 |
| unfpa | `idd.subject_kind` | 3 | 0/3 | 3 | 0 | present->missing × 3 |
| unfpa | `idd.vrc_iprc_status` | 3 | 0/3 | 3 | 0 | present->missing × 3 |
| global-fund | `award.contract_value_usd` | 4 | 1/4 | 3 | 0 | present->missing × 3; missing->missing × 1 |
| global-fund | `documentation.award_rationale_on_file` | 4 | 1/4 | 3 | 0 | present->missing × 3; missing->missing × 1 |
| global-fund | `idd.evidence_ref` | 4 | 1/4 | 3 | 0 | present->missing × 3; missing->missing × 1 |
| global-fund | `idd.screen_date` | 4 | 1/4 | 3 | 0 | present->missing × 3; missing->missing × 1 |
| global-fund | `idd.screen_modality` | 4 | 1/4 | 3 | 0 | present->missing × 3; missing->missing × 1 |
| global-fund | `procurement.competition_or_exemption_documented` | 4 | 1/4 | 3 | 0 | present->missing × 3; missing->missing × 1 |
| ocha-cbpf | `misconduct.secretariat_sanctions_regime` | 3 | 0/3 | 2 | 0 | present->missing × 2; negative->missing × 1 |
| ocha-cbpf | `partner.due_diligence_passed` | 3 | 0/3 | 2 | 0 | present->missing × 2; negative->missing × 1 |
| global-fund | `integrity.coi_disclosed` | 4 | 1/4 | 2 | 0 | present->missing × 2; missing->missing × 1; negative->missing × 1 |
| ocha-cbpf | `allocation.strategy_on_file` | 3 | 1/3 | 2 | 0 | present->missing × 2; missing->missing × 1 |
| ocha-cbpf | `misconduct.annex9_notification` | 3 | 1/3 | 2 | 0 | present->missing × 2; missing->missing × 1 |
| ocha-cbpf | `selection.recommendation_differs` | 3 | 1/3 | 2 | 0 | present->missing × 2; missing->missing × 1 |
| ocha-cbpf | `selection.scorecard_or_alternative` | 3 | 1/3 | 2 | 0 | present->missing × 2; missing->missing × 1 |
| unfpa | `idd.evidence_ref` | 3 | 1/3 | 2 | 0 | present->missing × 2; missing->missing × 1 |
| unfpa | `idd.screen_date` | 3 | 1/3 | 2 | 0 | present->missing × 2; missing->missing × 1 |
| unfpa | `integrity.related_party_checked` | 3 | 1/3 | 2 | 0 | present->missing × 2; missing->missing × 1 |
| unfpa | `ip.competitive_or_waiver` | 3 | 1/3 | 2 | 0 | present->missing × 2; missing->missing × 1 |
| unfpa | `ip.unpp_profile` | 3 | 1/3 | 2 | 0 | present->missing × 2; missing->missing × 1 |
| unfpa | `ip.waiver_or_competition_documented` | 3 | 1/3 | 2 | 0 | present->missing × 2; missing->missing × 1 |
| unfpa | `payment.commodity_lines` | 3 | 1/3 | 2 | 0 | present->missing × 2; missing->missing × 1 |
| unfpa | `procurement.plan_line` | 3 | 1/3 | 2 | 0 | present->missing × 2; missing->missing × 1 |
| global-fund | `procurement.solicitation_notified` | 4 | 2/4 | 2 | 0 | missing->missing × 2; present->missing × 2 |
| global-fund | `sr.selection_documented` | 4 | 2/4 | 2 | 0 | missing->missing × 2; present->missing × 2 |
| unfpa | `integrity.coi_declared` | 3 | 1/3 | 1 | 0 | missing->missing × 1; negative->missing × 1; present->missing × 1 |
| unfpa | `ip.threshold_approver` | 3 | 1/3 | 1 | 0 | missing->missing × 1; negative->missing × 1; present->missing × 1 |
| unfpa | `procurement.contract_split_checked` | 3 | 1/3 | 1 | 0 | missing->missing × 1; negative->missing × 1; present->missing × 1 |
| global-fund | `idd.screen_timing` | 4 | 2/4 | 1 | 0 | missing->missing × 2; negative->missing × 1; present->missing × 1 |
| ocha-cbpf | `grant.agreement_complete` | 3 | 2/3 | 1 | 0 | missing->missing × 2; present->missing × 1 |
| ocha-cbpf | `grant.budget_template` | 3 | 2/3 | 1 | 0 | missing->missing × 2; present->missing × 1 |
| ocha-cbpf | `grant.consortium_controls` | 3 | 2/3 | 1 | 0 | missing->missing × 2; present->missing × 1 |
| ocha-cbpf | `idd.disposition_decision` | 3 | 2/3 | 1 | 0 | missing->missing × 2; present->missing × 1 |
| ocha-cbpf | `idd.evidence_ref` | 3 | 2/3 | 1 | 0 | missing->missing × 2; present->missing × 1 |
| ocha-cbpf | `misconduct.oios_notification_path` | 3 | 2/3 | 1 | 0 | missing->missing × 2; present->missing × 1 |
| ocha-cbpf | `onegms.selection_record` | 3 | 2/3 | 1 | 0 | missing->missing × 2; present->missing × 1 |
| ocha-cbpf | `partner.capacity_assessment` | 3 | 2/3 | 1 | 0 | missing->missing × 2; present->missing × 1 |
| ocha-cbpf | `selection.mismatch_note` | 3 | 2/3 | 1 | 0 | missing->missing × 2; present->missing × 1 |
| unfpa | `idd.disposition_decision` | 3 | 2/3 | 1 | 0 | missing->missing × 2; present->missing × 1 |
| unfpa | `ip.hact_micro_assessment` | 3 | 2/3 | 1 | 0 | missing->missing × 1; present->missing × 1; present->present × 1 |
| unfpa | `ip.psea_assessment` | 3 | 2/3 | 1 | 0 | missing->missing × 2; present->missing × 1 |
| unfpa | `payment.face_workplan_link` | 3 | 2/3 | 1 | 0 | missing->missing × 2; present->missing × 1 |
| unfpa | `procurement.crc_gate` | 3 | 2/3 | 1 | 0 | missing->missing × 2; present->missing × 1 |
| unfpa | `procurement.lta_rate_reconciliation` | 3 | 2/3 | 1 | 0 | missing->missing × 2; present->missing × 1 |
| unfpa | `procurement.po_or_contract` | 3 | 2/3 | 1 | 0 | missing->missing × 2; present->missing × 1 |
| unfpa | `procurement.rfq_criteria_and_scores` | 3 | 2/3 | 1 | 0 | missing->missing × 2; present->missing × 1 |
| global-fund | `idd.affiliated_persons` | 4 | 3/4 | 1 | 0 | missing->missing × 3; present->missing × 1 |
| global-fund | `idd.disposition_decision` | 4 | 3/4 | 1 | 0 | missing->missing × 3; present->missing × 1 |
| global-fund | `idd.disposition_owner` | 4 | 3/4 | 1 | 0 | missing->missing × 3; present->missing × 1 |
| global-fund | `idd.disposition_rationale` | 4 | 3/4 | 1 | 0 | missing->missing × 3; present->missing × 1 |
| global-fund | `idd.gf_notification` | 4 | 3/4 | 1 | 0 | missing->missing × 3; present->missing × 1 |
| global-fund | `idd.list_vintage` | 4 | 3/4 | 1 | 0 | missing->missing × 3; present->missing × 1 |
| global-fund | `sr.capacity_assessed` | 4 | 3/4 | 1 | 0 | missing->missing × 3; present->missing × 1 |
| global-fund | `sr.written_agreement_on_file` | 4 | 3/4 | 1 | 0 | missing->missing × 3; present->missing × 1 |
| global-fund | `threshold.method_aligned` | 4 | 2/4 | 0 | 0 | missing->missing × 2; negative->missing × 2 |
| unfpa | `procurement.method_vs_threshold` | 3 | 2/3 | 0 | 0 | missing->missing × 2; negative->missing × 1 |
| ocha-cbpf | `allocation.preselection_justification` | 3 | 3/3 | 0 | 0 | missing->missing × 3 |
| ocha-cbpf | `misconduct.annex8_path` | 3 | 3/3 | 0 | 0 | missing->missing × 3 |
| unfpa | `idd.clearcheck_where_personnel` | 3 | 3/3 | 0 | 0 | missing->missing × 3 |
| unfpa | `procurement.rir` | 3 | 3/3 | 0 | 0 | missing->missing × 3 |

