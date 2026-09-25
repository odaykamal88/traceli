# Extraction accuracy

This harness measures how well Trace-li reads an award file onto a donor pack. It uses the same path as the signed-in desk: `TalonicExtractionProvider` with the pack schema, then `snapshotFromUpload` (`alignPackFields` plus an unread `missing` for every pack key the packet did not fill).

It does not freeze a record and it does not change pack rules.

## Run

```sh
pnpm eval:extraction
pnpm eval:extraction -- --dir eval/extraction/fixtures/packets --mode cached
pnpm eval:extraction -- --mode local-text --dir eval/extraction/ground-truth \
  --holdout gf-04-npl-sr-continuation.pdf,unfpa-03-jor-ngo-noncompetitive.pdf,ocha-03-afg-consortium-standard.pdf
pnpm eval:extraction -- --mode live --dir eval/extraction/ground-truth \
  --holdout gf-04-npl-sr-continuation.pdf,unfpa-03-jor-ngo-noncompetitive.pdf,ocha-03-afg-consortium-standard.pdf
```

`--mode` is `cached` (the default), `local-text`, or `live`. Reports are written to `eval/extraction/reports/` as `extraction-accuracy.md` and `extraction-accuracy.json`. `--out` changes that directory. `--cache` changes the gitignored response cache (default `eval/extraction/.cache/`).

Cached mode never calls Talonic. It replays a stored Talonic body. Local-text mode never calls Talonic either: it reads each page with poppler `pdftotext` (default mode), prefixes `Page N`, and replays that markdown through `TalonicExtractionProvider`. The report labels that source `local-text`. Live mode calls Talonic, one file at a time.

## Answer sheets

Put one PDF and one JSON sheet in the same directory, or put the sheet in `answers/` beside the PDFs. The sheet name is the PDF name with `.json`. A sibling sheet wins when both exist.

```json
{
  "file": "x.pdf",
  "packId": "unfpa",
  "packVersion": "2026.1",
  "sha256": "…64 hex chars…",
  "pages": 12,
  "split": "train",
  "fields": {
    "<pack key>": {
      "state": "present",
      "statedAbsent": false,
      "value": "exact value or null",
      "page": 3,
      "quote": "exact sentence",
      "note": "why this label is right"
    }
  }
}
```

`fields` must list every key of that pack and no others. `state` is `present`, `missing`, or `negative`. `split` is optional (`train` or `test`). `--holdout` forces those file names onto the test split for the report.

`packVersion` must match the pack version in the repo. A pack bump fails the run until the sheet is updated, so a silent rule change cannot be scored as extraction.

Label the document, not the current extractor. A key the packet states and the desk misses is a false missing. A key the packet does not state is `missing` with `statedAbsent: false` and `value: null`. A boolean control the packet says is absent is `negative` / `false` with `statedAbsent: true`, because that is how the desk records it. A `required_present` control the packet says is absent stays `missing` with `statedAbsent: true`.

## Metrics

Reported per file, per pack, and overall. When any file is in the test split, the report also gives train and test.

| Metric | Meaning |
| --- | --- |
| State accuracy | Desk state equals the answer sheet. |
| Recall on present | Truly present keys the desk also reported present. |
| False-missing rate | Truly present keys the desk reported missing. This is the rate to drive down. |
| False-present rate | Keys that are not present and the desk reported present. Do not raise this to cut false-missing. |
| Stated-absent detection | Answer sheet `statedAbsent: true`, and the desk stored `Stated absent in this packet:` or `negative` / `false`. |
| Value match | Normalised equality where the sheet gives a value. Case is folded, whitespace is collapsed, and a numeric string matches a number. |
| Page match | Desk page equals the sheet page, only where the sheet gives a page. |
| Quote match | Desk quote equals the sheet quote after whitespace runs collapse to one space. Case is kept. Compared only where the sheet gives a quote. |
| Keys read | Pack keys the desk filled from the packet, including stated absences. Unread keys stay `Not extracted from this packet.` |

The JSON report also includes `statedAbsentFalseRate` (the desk marked a stated absence the sheet does not) and a per-key confusion table (`answer -> desk`).

A present key predicted `negative` counts against state accuracy and recall. It is not a false missing. False-missing is only `present` predicted `missing`.

## Cache and live Talonic

The cache key is the pipeline version, the pack id, and the file SHA-256:

`eval/extraction/.cache/trace-v5/{packId}/{sha256}.json`

The version is `TALONIC_PACK_PIPELINE_VERSION` in `lib/field-registry/extract-talonic.ts` (`trace-v5`). It is the same generation as the desk idempotency key `trace-v5-{packId}-{sha}`. Bump that version when the Talonic request or the mapping of its body changes, so an old cached run is not reused. Then re-run live, or the cached scorer will refuse the old files. `trace-v5` is the later-sentence alignment. `trace-v4` was quote cleaning and pack-only snapshots.

The cached body is the completed Talonic JSON (markdown and `data`), not the mapped fragments. Replay sends that body back through `TalonicExtractionProvider`, so mapping changes are scored without another Talonic call. The cache is gitignored.

Live mode reads `TRACE_TALONIC_API_KEY` and `TRACE_TALONIC_BASE_URL` the same way the desk client does. An empty base URL uses `https://api.talonic.com/v1`. The key is not written into the cache. A missing key fails before any request.

This environment has no Talonic key. `pnpm eval:extraction` runs the committed fixtures in cached mode. The 10-file ground-truth set has no stored Talonic body, so its baseline here is local-text replay, not a live extract.

One command for the live ground-truth baseline, once the key is set:

```sh
TRACE_TALONIC_API_KEY=... TRACE_TALONIC_BASE_URL=https://api.talonic.com/v1 \
  pnpm eval:extraction -- --mode live \
  --dir eval/extraction/ground-truth \
  --holdout gf-04-npl-sr-continuation.pdf,unfpa-03-jor-ngo-noncompetitive.pdf,ocha-03-afg-consortium-standard.pdf
```

A later cached run uses those stored bodies. Delete `eval/extraction/.cache` to fall back to the committed fixture envelopes. The same holdout with `--mode local-text` repeats the poppler replay and does not need the key.

## Fixtures

`fixtures/packets` has three packets:

- `unfpa-ia-2025-29-sudan-rehearsal.pdf` is the rehearsal packet already in `fixtures/desk/`. The sheet labels the four controls that packet states, and marks the other 23 UNFPA keys unread.
- `gf-short-synthetic.pdf` and `ocha-short-synthetic.pdf` are hand-made. The Global Fund and OCHA rehearsal PDFs are not in the repo (only their published freeze snapshots are). These two stand in so the harness runs end to end. Their prose includes controls the current phrase list does not read, so the baseline false-missing rate is above zero.

`fixtures/envelopes/trace-v5/` holds a Talonic-shaped body per file. The `trace-v4/` copies are the previous generation and are not read while the pipeline version is `trace-v5`. The markdown is the packet text. `data` on the UNFPA and OCHA fixtures includes a value the packet does not support, so a change that trusts `data` over the markdown shows up in the score. These envelopes are not live Talonic responses.

## Holdout

`eval/extraction/ground-truth/` is the 10-file synthetic set. Score it with these three files held out, and do not tune on them:

`gf-04-npl-sr-continuation.pdf`, `unfpa-03-jor-ngo-noncompetitive.pdf`, `ocha-03-afg-consortium-standard.pdf`.

```sh
pnpm eval:extraction -- --mode local-text \
  --dir eval/extraction/ground-truth \
  --out eval/extraction/reports/ground-truth \
  --holdout gf-04-npl-sr-continuation.pdf,unfpa-03-jor-ngo-noncompetitive.pdf,ocha-03-afg-consortium-standard.pdf
```

Use the train split to change prompts, schemas, or mapping. Report both splits. Bump `TALONIC_PACK_PIPELINE_VERSION` if the Talonic request or the mapped output changes. The checked-in ground-truth numbers are local-text replay through the desk client. They are not live Talonic scores. `reports/ground-truth-baseline/` is the `trace-v4` run before the phrase change. `reports/ground-truth/` is the `trace-v5` run. `reports/ground-truth-comparison.md` puts both splits, both packs, and the answer-sheet tensions in one place.

`pnpm test:extraction-eval` checks the scorer, the fixture baseline, cache replay, and that live mode does not call the network when the key is missing.

The checked-in `reports/extraction-accuracy.md` is that cached fixture run.
