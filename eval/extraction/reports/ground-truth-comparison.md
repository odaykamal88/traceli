# Ground-truth extraction accuracy

Mode: **local-text**. Pipeline: **`trace-v4`**, the desk pipeline on `main`. Poppler `pdftotext` (default mode, one page at a time, prefixed `Page N`) is replayed through `TalonicExtractionProvider` and `snapshotFromUpload`. Talonic was not called. `TRACE_TALONIC_API_KEY` and `TRACE_TALONIC_BASE_URL` are unset.

This is the baseline only. The desk phrase list is the one on `main`. No mapping change is included.

The generated per-file report is `reports/ground-truth/`.

Live baseline, once the key is set:

```sh
TRACE_TALONIC_API_KEY=... TRACE_TALONIC_BASE_URL=https://api.talonic.com/v1 \
  pnpm eval:extraction -- --mode live \
  --dir eval/extraction/ground-truth \
  --holdout gf-04-npl-sr-continuation.pdf,unfpa-03-jor-ngo-noncompetitive.pdf,ocha-03-afg-consortium-standard.pdf
```

Holdout, not used to change the desk: `gf-04-npl-sr-continuation.pdf`, `unfpa-03-jor-ngo-noncompetitive.pdf`, `ocha-03-afg-consortium-standard.pdf`.

Found rate is recall on keys the answer sheet marks present. False-missing is that same set reported missing. False-present is a non-present key reported present.

## Baseline (`trace-v4`, local-text)

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

Of the items that are truly in the file, this pipeline finds 1 of 144. It does not report a non-present key as present (0 of 113).

Quote match (whitespace collapsed, case kept): 0/190. Stated-absent detection: 0/40.

## Generalisation

A phrase list written from the seven training files lifts the train split and leaves the held-out split almost untouched, because each file states the same control in different words. The next change has to work on wording it has not been shown.

Three approaches would aim at the held-out files:

- Send each pack rule to Talonic as the field definition: key, rule title, kind, and allowed values. The model then has to find a supporting sentence in that file. The returned quote still has to occur in the document text. A value that exists only in Talonic `data` is not evidence. This is already the shape of the desk request. What is missing is the rule text itself, not another local phrase list.
- Keep a synonym list per key, taken from the pack IDD vocabulary rather than from these files. That vocabulary is the allowed tokens (`un`, `before_engagement`, `none`). The pack says prose such as "United Nations" does not match `un`, and several answers use a sentence or a token the allow-list does not contain. Synonyms of those tokens will not read a new sentence.
- Retrieve by page, so a long file is not cut into four chunks and a quote stays on its page. That fixes truncation and page numbers. It does not decide whether a sentence is evidence of a control.

Recommendation: send the pack-rule field definitions to Talonic, and keep the document-text check. Measure it with the live command above, on both splits, before changing `alignPackFields`. Do not add training-file sentences to the desk phrase list.

## Answers that do not sit on a pack rule

The sheets were not edited.

- `selection.recommendation_differs` has no judgment rule. `false` is present, not negative.
- `idd.screen_timing` allows only `before_engagement` and `grant_cycle_rerun`. GF-03 is negative `after_engagement`.
- `misconduct.secretariat_sanctions_regime` must be `none`. O03's claimed Secretariat list is negative on the sheet.
- A scope can be present in prose while `text_must_include` still fails. "United Nations" is not the token `un`.
