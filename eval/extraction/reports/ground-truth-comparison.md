# Ground-truth extraction accuracy

Every number below is **local-text** replay. Poppler `pdftotext` (default mode, one page at a time, prefixed `Page N`) is sent back through `TalonicExtractionProvider` and `snapshotFromUpload`. Talonic was not called. `TRACE_TALONIC_API_KEY` and `TRACE_TALONIC_BASE_URL` are unset.

Live baseline, once the key is set:

```sh
TRACE_TALONIC_API_KEY=... TRACE_TALONIC_BASE_URL=https://api.talonic.com/v1 \
  pnpm eval:extraction -- --mode live \
  --dir eval/extraction/ground-truth \
  --holdout gf-04-npl-sr-continuation.pdf,unfpa-03-jor-ngo-noncompetitive.pdf,ocha-03-afg-consortium-standard.pdf
```

Holdout (not used to write phrases): `gf-04-npl-sr-continuation.pdf`, `unfpa-03-jor-ngo-noncompetitive.pdf`, `ocha-03-afg-consortium-standard.pdf`.

Found rate is recall on keys the answer sheet marks present. False-missing is that same set reported missing. False-present is a non-present key reported present.

## Before (`trace-v4`, local-text)

Saved in `reports/ground-truth-baseline/`.

| Split | Found | False-missing | False-present |
| --- | --- | --- | --- |
| Overall | 0.7% (1/144) | 99.3% (143/144) | 0.0% (0/113) |
| Train (7 files) | 1.0% (1/101) | 99.0% (100/101) | 0.0% (0/79) |
| Test (3 files) | 0.0% (0/43) | 100.0% (43/43) | 0.0% (0/34) |

| Split | Pack | Found | False-missing | False-present |
| --- | --- | --- | --- | --- |
| Train | global-fund | 0/45 | 45/45 | 0/33 |
| Train | ocha-cbpf | 0/28 | 28/28 | 0/20 |
| Train | unfpa | 1/28 | 27/28 | 0/26 |
| Test | global-fund | 0/14 | 14/14 | 0/12 |
| Test | ocha-cbpf | 0/14 | 14/14 | 0/10 |
| Test | unfpa | 0/15 | 15/15 | 0/12 |

## After (`trace-v5`, local-text)

Saved in `reports/ground-truth/`. Mapping change: wider full-phrase statements, a later present sentence can correct an earlier one, and a matched scope sentence is stored even when its tokens are incomplete. Pack rules were not changed.

| Split | Found | False-missing | False-present |
| --- | --- | --- | --- |
| Overall | 75.0% (108/144) | 25.0% (36/144) | 0.0% (0/113) |
| Train (7 files) | 100% (101/101) | 0.0% (0/101) | 0.0% (0/79) |
| Test (3 files) | 16.3% (7/43) | 83.7% (36/43) | 0.0% (0/34) |

| Split | Pack | Found | False-missing | False-present |
| --- | --- | --- | --- | --- |
| Train | global-fund | 45/45 | 0/45 | 0/33 |
| Train | ocha-cbpf | 28/28 | 0/28 | 0/20 |
| Train | unfpa | 28/28 | 0/28 | 0/26 |
| Test | global-fund | 2/14 | 12/14 | 0/12 |
| Test | ocha-cbpf | 4/14 | 10/14 | 0/10 |
| Test | unfpa | 1/15 | 14/15 | 0/12 |

Quote match (whitespace collapsed, case kept) after the change: train 65/133, test 3/57, overall 68/190. Value match overall 50/156. Page match overall 131/190.

The test split did not pick up the train phrasing. False-present stayed zero on both splits.

## Answers that do not sit on a pack rule

These sheets were not edited.

1. `selection.recommendation_differs` has no judgment rule. It only triggers `selection.mismatch_note` when true. The sheets treat `false` as present, not negative (O01 present `false`, O02 missing, O03 present `true`). The mapper stores that boolean when the sentence says so. It does not add a pack rule.
2. `idd.screen_timing` allows only `before_engagement` and `grant_cycle_rerun`. GF-03 is negative `after_engagement`, which is not an allowed token. The mapper stores that negative value. The allow-list was not extended.
3. `misconduct.secretariat_sanctions_regime` must be the string `none`. O03 claims an "OCHA Secretariat partner sanctions list" and the sheet marks that negative, not present `none`.
4. Scope and Annex 7 can be present in prose while `text_must_include` still fails. `idd.ts` states that "United Nations" is not the token `un`. Incomplete scopes (GF-03, and the U03 / O03 cases described in the ground-truth notes) are present on the sheet and still fail the token rule. The mapper stores the sentence; it does not rewrite prose into tokens.
5. Four train negatives are adverse facts the sheet marks `statedAbsent: false` (method not aligned with the threshold on GF-02, GF-03, and UNFPA-02, plus GF-03 `after_engagement`). The desk stores a negative, and the scorer treats every negative as a stated absence, so those four count as false stated-absences. The state itself matches.
