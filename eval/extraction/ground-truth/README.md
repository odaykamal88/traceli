# Trace-li ground-truth award files v1 (synthetic)

**Built:** 25 Sep 2026 (Africa/Cairo) · **Purpose:** known-answer test set for Trace-li extraction/alignment accuracy.
Every PDF is a **synthetic test file** (every page footer reads `SYNTHETIC TEST FILE — Trace-li`). All organisations, people, places inside a country, reference numbers and amounts are fictional. Country names are real but generic. Not a UN / Global Fund / OCHA document, not a customer upload.

## Contents

| Path | What |
|---|---|
| `*.pdf` | 10 award files (4 Global Fund, 3 UNFPA, 3 OCHA CBPF), 13–32 pages each |
| `answers/<file>.json` | answer sheet per file, one entry for **every** key of the pack |
| `manifest.json` | file list, pack, pages, sha256, per-state counts |
| `scripts/` | builders (ReportLab, same toolchain as `../scripts/build_unfpa_ia_2025_29_rehearsal.py`) and `verify.py` |

Rebuild + verify (deterministic, `invariant=1`, byte-identical hashes on rebuild):
```
cd scripts && python3 build_all.py && python3 verify.py
```

## Packs (source of the key lists)

From `odaykamal88/traceli` @ `main`, transcribed into `scripts/packs.py`:

| packId | version | keys | source |
|---|---|---|---|
| `global-fund` | 2026.2 | 26 | `lib/field-registry/packs/global-fund.ts` (`GLOBAL_FUND_FIELD_KEYS`, `GLOBAL_FUND_RULES`) |
| `unfpa` | 2026.1 | 27 | `lib/field-registry/packs/unfpa.ts` (`UNFPA_FIELD_KEYS`, `UNFPA_RULES`) |
| `ocha-cbpf` | 2026.1 | 24 | `lib/field-registry/packs/ocha-cbpf.ts` (`OCHA_CBPF_FIELD_KEYS`, `OCHA_CBPF_RULES`) |

Allowed values come from `lib/field-registry/packs/idd.ts`. Value shapes come from `lib/field-registry/schema.ts` (`fieldValueSchema`: present+value / missing+reason / negative+value). Absence vocabulary comes from `lib/field-registry/pack-align.ts` (`STATED_ABSENT_PREFIX = 'Stated absent in this packet: '`).

## Answer-sheet format

```json
{ "file", "packId", "packVersion", "packName", "sha256", "pages", "title", "classification": "synthetic",
  "quoteVerification", "traps": [{"kind","key","description"}],
  "fields": { "<key>": { "state": "present|missing|negative", "statedAbsent": bool, "value": ..., "page": int|null,
                        "quote": "exact sentence"|null, "note": "...", "trap"?: "...",
                        "rule": {"kind","title","severity"},
                        "expectedRegistryValue": {"state":"present","value":...} | {"state":"missing","reason":"..."} | {"state":"negative","value":...} } } }
```

How the states are used (this follows the repo's pack-align treatment):
- **present**: the file evidences the control. `value` is a concrete value: `true` for boolean controls (`value_must_equal` true), the canonical token for `value_must_be_one_of` keys (`organization`, `sr`, `gf_preapproved_vendor`, `potential_match`, `grant_cycle_rerun`, `standard`, `select`, ...), a short normalised string (date; rating; reference) for `required_present` keys. For `text_must_include` scope keys the value is the canonical token string when the scope is complete, or the scope as stated when it is incomplete (see notes).
- **missing, statedAbsent=false**: genuinely not in the file (or only as a requirement in boilerplate). `expectedRegistryValue.reason = "Not in this packet."`
- **missing, statedAbsent=true**: the file says in so many words that the item is absent / not done / not applicable. `reason = "Stated absent in this packet: <quote>"`, same as the desk mapper.
- **negative**: the file supports an adverse fact. Following `pack-align.ts`, an explicit absence on a boolean control expected `true` is recorded **negative `false`** (with `statedAbsent=true`). Adverse facts that are not phrased as absences (method misaligned with threshold, screen done after engagement, invented Secretariat list) are negative with `statedAbsent=false`.
- `page` is 1-based, `quote` is an exact sentence from the PDF. **Pages are not typed by hand**: the builder finds each quote in `pdftotext` output after the build and fails if it is not on exactly one page.
- Quote check: `pdftotext` (poppler, default mode), per page, whitespace runs collapsed to one space (line wraps become spaces). 190 quotes verified; 88 also match with no normalisation at all (the rest wrap across lines or table cells).

## Per-file distribution

Columns: present · missing (silent) · missing (stated absent) · negative (of which stated) · statedAbsent total.

| File | Pack | Pages | Keys | Present | Missing silent | Missing stated | Negative (stated) | statedAbsent |
|---|---|---|---|---|---|---|---|---|
| `gf-01-mwi-sr-selection.pdf` | `global-fund` 2026.2 | 18 | 26 | 15 | 7 | 3 | 1 (1) | 4 |
| `gf-02-moz-lab-reagents-tender.pdf` | `global-fund` 2026.2 | 25 | 26 | 15 | 7 | 3 | 1 (0) | 3 |
| `gf-03-cmr-single-source-fleet.pdf` | `global-fund` 2026.2 | 14 | 26 | 15 | 5 | 3 | 3 (1) | 4 |
| `gf-04-npl-sr-continuation.pdf` | `global-fund` 2026.2 | 32 | 26 | 14 | 7 | 4 | 1 (0) | 4 |
| `ocha-01-som-standard-allocation.pdf` | `ocha-cbpf` 2026.1 | 16 | 24 | 14 | 6 | 4 | 0 (0) | 4 |
| `ocha-02-nga-reserve-allocation.pdf` | `ocha-cbpf` 2026.1 | 23 | 24 | 14 | 6 | 3 | 1 (1) | 4 |
| `ocha-03-afg-consortium-standard.pdf` | `ocha-cbpf` 2026.1 | 30 | 24 | 14 | 6 | 3 | 1 (0) | 3 |
| `unfpa-01-uga-ip-workplan.pdf` | `unfpa` 2026.1 | 20 | 27 | 15 | 8 | 3 | 1 (1) | 4 |
| `unfpa-02-bgd-dignity-kits-rfq.pdf` | `unfpa` 2026.1 | 13 | 27 | 13 | 8 | 5 | 1 (0) | 5 |
| `unfpa-03-jor-ngo-noncompetitive.pdf` | `unfpa` 2026.1 | 27 | 27 | 15 | 7 | 3 | 2 (2) | 5 |

Totals: 10 files, 257 key answers: 144 present (56%), 67 missing silent (26%), 34 missing stated absent (13%), 12 negative (5%, 6 of them stated absences on boolean controls). statedAbsent total 40 (16%).

## Wording variation

The same control is worded differently in each file, e.g. HACT: "The final micro-assessment report issued on 14 March 2026 rates RWHI as moderate risk overall …" (U01) vs "Micro-assessment by an external firm, report dated 9 March 2026: overall risk rating high …" (U03). Restrictive-measures scope: prose list of named lists (GF01, GF04), canonical scope codes (GF02 `un, ofac, us-state, …`; U02 `un / ungm`), and incomplete scopes (GF03, U03). Values sit in body sentences, key/value tables, and late annexes.

## Traps

Trap kinds:
- `boilerplate-requirement-not-evidenced`: policy text says the control is required but nothing shows it was done → **missing** (silent).
- `template-placeholder-date`: a date or date mask only appears in a blank template (`DD/MM/YYYY (e.g. 15/01/2025)`, `[dd.mm.yyyy] e.g. 15.01.2024`, `HFU-DD-______ dated __/__/2026`) → **missing**.
- `conflict-resolved-later`: an earlier statement (cover memo or section) is corrected later, often in an annex → answer = the later value, quote = the correcting sentence.
- `mentioned-not-attached` (GF03): the cover lists a Global Fund non-objection as an attachment; the attachment list says it is not included → missing, stated.
- `invented-regime` (O03): file claims a check against an "OCHA Secretariat partner sanctions list"; pack expects `none` → negative.

**gf-01-mwi-sr-selection.pdf** — Sub-recipient selection file: community case management, Mbalame and Chitsanzo districts
- `boilerplate-requirement-not-evidenced` · `sr.capacity_assessed`: Manual section 5.2 (capacity assessment required before signature) is quoted in the policy section; no capacity assessment of MCHN is on file.
- `conflict-resolved-later` · `award.contract_value_usd`: Cover memo gives US$ 1,248,600; Annex E corrects it to US$ 1,284,600 (true value).
- negatives: `integrity.coi_disclosed` = false

**gf-02-moz-lab-reagents-tender.pdf** — Procurement file: laboratory reagents and consumables for viral load testing, national open tender
- `boilerplate-requirement-not-evidenced` · `integrity.coi_disclosed`: Evaluation policy extract requires signed COI declarations; none are evidenced.
- `template-placeholder-date` · `idd.screen_date`: Annex D blank IDD request form shows "Date of screening: DD/MM/YYYY (e.g. 15/01/2025)"; this is not a screen date.
- negatives: `threshold.method_aligned` = false

**gf-03-cmr-single-source-fleet.pdf** — Direct contracting file: fleet repair and maintenance for TB programme vehicles
- `conflict-resolved-later` · `integrity.coi_disclosed`: Cover memo: "COI declarations ... are pending"; section 6 update of 20 February 2026 records them signed (true = present).
- `mentioned-not-attached` · `procurement.competition_or_exemption_documented`: Cover table lists "Attachment 4: Global Fund non-objection"; the attachment list says not included.
- negatives: `procurement.competitive_or_exempt` = false; `threshold.method_aligned` = false; `idd.screen_timing` = "after_engagement"

**gf-04-npl-sr-continuation.pdf** — Sub-recipient continuation file with key-personnel restrictive measures re-run
- `boilerplate-requirement-not-evidenced` · `idd.evidence_ref`: Section 7 states evidence "must be retained ... and referenced by its screening record number"; no reference is given.
- `conflict-resolved-later` · `sr.capacity_assessed`: Cover memo: last assessment 2023, high risk; Annex B: 14 January 2026 reassessment supersedes it, rating moderate.
- negatives: `eligibility.contractor_capable` = false

**ocha-01-som-standard-allocation.pdf** — Standard allocation project file: emergency WASH in Lower Jubba riverine villages
- `conflict-resolved-later` · `partner.capacity_assessment`: Cover memo and section 3 opening: capacity assessment pending; next paragraph records completion 2 March 2026, medium risk.
- `boilerplate-requirement-not-evidenced` · `grant.consortium_controls`: Section 5 quotes the fund requirement for sub-partner pass-through controls; none described.
- `template-placeholder-date` · `idd.evidence_ref`: Section 7 shows "HFU-DD-______ dated __/__/2026" (template placeholder with date mask); no evidence reference.

**ocha-02-nga-reserve-allocation.pdf** — Reserve allocation file: emergency health response to riverine flooding, north-east (three invited partners)
- `conflict-resolved-later` · `misconduct.annex9_notification`: Cover memo and section 6: 5 working days; Annex B corrects to the Annex 9 48-hour duty (true = present).
- negatives: `partner.due_diligence_passed` = false

**ocha-03-afg-consortium-standard.pdf** — Standard allocation file: consortium project for winterisation and protection, north-eastern provinces
- `boilerplate-requirement-not-evidenced` · `allocation.strategy_on_file`: Section 1 quotes the requirement for an HC-approved allocation strategy on file; none is filed or referenced.
- `invented-regime` · `misconduct.secretariat_sanctions_regime`: File claims a check against an "OCHA Secretariat partner sanctions list"; pack expects none -> negative.
- `conflict-resolved-later` · `onegms.project_status`: Cover table and memo: OneGMS status Draft; Annex A: as of 19 May 2026 Pending HC approval.
- negatives: `misconduct.secretariat_sanctions_regime` = "OCHA Secretariat partner sanctions list (checked, not listed)"

**unfpa-01-uga-ip-workplan.pdf** — Implementing partner selection and 2026 workplan file: maternal health and GBV response, Nyabuhoro and Kigando districts
- `boilerplate-requirement-not-evidenced` · `procurement.crc_gate`: Policy reminder: "contracts ... above US$ 100,000 must be reviewed by the Contracts Review Committee"; no CRC gate recorded.
- `conflict-resolved-later` · `ip.hact_micro_assessment`: Cover memo cites "significant risk"; Annex C final report (14 March 2026) supersedes it: moderate.
- negatives: `integrity.coi_declared` = false

**unfpa-02-bgd-dignity-kits-rfq.pdf** — Vendor award file: local procurement of dignity kits for cyclone preparedness (RFQ)
- `boilerplate-requirement-not-evidenced` · `integrity.related_party_checked`: Vendor policy text requires BO/shared-contact checks before award; none is recorded.
- `template-placeholder-date` · `idd.screen_date`: Annex D screening log shows "Screening date: [dd.mm.yyyy] e.g. 15.01.2024" (placeholder); no real date.
- negatives: `procurement.method_vs_threshold` = false

**unfpa-03-jor-ngo-noncompetitive.pdf** — Implementing partner file: non-competitive engagement of a women-led NGO for GBV case management, Al-Rimal settlement
- `boilerplate-requirement-not-evidenced` · `integrity.coi_declared`: Procedure text requires COI declarations before the selection decision; none is evidenced.
- `conflict-resolved-later` · `ip.unpp_profile`: Cover table and memo: UNPP not validated; Annex B: validation completed 20 April 2026 (present).
- negatives: `ip.threshold_approver` = false; `procurement.contract_split_checked` = false

Other deliberate nuances (see each field's `note`):
- Scope fields that are **present but incomplete** (GF03 `idd.screen_scope`, U03 `idd.screen_scope`, O03 `partner.annex7_declarations`): the field is present, but the pack's `text_must_include` rule should still fail.
- Prose vs canonical tokens: GF01/GF04 scope and O01 Annex 7 are complete in prose only. `idd.ts` notes that prose such as "United Nations" does not match `un`, so a literal token matcher fails there even though the ground truth is complete.
- Conditional keys (`idd.disposition_*`, `idd.gf_notification`, `selection.mismatch_note`, `allocation.preselection_justification`) are answered on their own evidence even when their trigger is not met. Non-clear results with the conditional evidence missing: GF02 (owner missing, notification stated absent), GF03 (decision missing, rationale stated absent), O02 (`unresolved` result, no decision).
- U03 `integrity.related_party_checked` is **present** (the check was done) but records an adverse finding (a shared address with a staff member).

## Pack keys that were ambiguous

1. `selection.recommendation_differs` (ocha-cbpf) has **no rule of its own**. It only triggers `selection.mismatch_note` when true. Answers: O01 present `false`, O03 present `true`, O02 missing. `false` is treated as a normal present value, not as negative.
2. Conditional `required_when_value_in` keys: the pack does not say whether "not applicable" is missing or something else. When the file says so explicitly (e.g. "no disposition decision was taken or recorded" because the result was clear), it is marked missing + statedAbsent; otherwise it is missing silent.
3. Boolean controls with an explicit absence are marked **negative false** as in `pack-align.ts`, so for boolean keys "stated absent" and "negative" overlap. Required-present keys with an explicit absence stay **missing** with a `Stated absent…` reason.
4. `idd.screen_timing` only allows `before_engagement` / `grant_cycle_rerun`. A screen done after signature (GF03) has no token, so it is recorded negative with value `after_engagement`.
5. `misconduct.secretariat_sanctions_regime` expects the string `none`. Any claimed Secretariat list is treated as adverse (negative), not as present.
6. Some keys don't fit some file types (e.g. `sr.*` in a GF goods tender, `procurement.*` in a UNFPA IP workplan, `ip.*` in a UNFPA vendor award). The pack has no N/A state, so they are missing (silent or stated, as worded in the file).
7. `FREEZE_PACKETS_v1.md` and the rehearsal session fixtures also use keys that are **not in the packs** (`audit.procurement_controls_rating`, `audit.sample_scope`, `procurement.file_completeness`, `procurement.extension_authority_documented`, `audit.office_rating`). They are Case Card fixture keys and are left out here.
8. `ip.psea_assessment` / `procurement.po_or_contract` for a UNFPA vendor vs an IP: the IP agreement itself is not treated as `procurement.po_or_contract`, and a supplier code of conduct is not treated as a PSEA assessment.

## Word hygiene note

Unlike the short rehearsal packets, these files use the natural words "Annex", "capacity" and "waiver" (e.g. "waiver of privileges" in agreement clauses). Real files contain them, and they are useful distractors for keyword-based extraction.
