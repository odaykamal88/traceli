# Extraction adapter

Status: P2 interface, offline mock, live Talonic HTTP client. 23 September 2026.
Code: `lib/field-registry/extract.ts` and the `extract-*.ts` modules beside it.
Registry schema: [field-registry-v1.md](./field-registry-v1.md).
Ownership: [spine-p0-p1-p3.md](./spine-p0-p1-p3.md).

Extraction is rented. The Field Registry, the Rule library, and freeze stay Trace IP.

A vendor may read a PDF, spreadsheet, or message. Trace keeps the normalized `Fragment` and the registry field that a person can freeze. Rules never import a Talonic type. `freezeAtJudgment` never sees file bytes or a vendor payload. Award desk is not wired to this adapter.

## Buy versus build

| Rent | Keep |
| --- | --- |
| OCR, layout, and mail parsing behind `ExtractionProvider` | `Fragment`, provenance, and `fragmentsTowardRegistryDraft` |
| The Talonic HTTP call, when `TRACE_EXTRACTION_PROVIDER=talonic` | Rule packs, playbook input, and `freezeAtJudgment` |
| Hosting for that call | The decision that a field is present, missing, or negative |

Adding a vendor means implementing `extract` and mapping that vendor's JSON into the existing fragment schema. It does not mean a new rule dialect or a new freeze format.

## Contract

```ts
interface ExtractionProvider {
  readonly providerId: string
  extract(input: ExtractionInput): Promise<ExtractionResult>
}
```

`ExtractionInput` carries a file name, a media type, and either bytes or a server path. Optional `awardId` and `organizationId` are registry ids. The HTTP route fills `organizationId` from the signed-in Trace session and does not accept a client path or a client organization id.

`ExtractionResult` (`extraction-result-v1`) carries `providerId`, `extractorId`, the file name, the normalized media type, `sourceFileHash`, and one or more `Fragment` values. The hash is SHA-256 of the bytes. The body is not on the result.

Every provider returns the same `fragmentSchema` from `lib/field-registry/schema.ts`:

| Field | Meaning |
| --- | --- |
| `fragmentId`, `extractorId` | Registry ids. Not a vendor record id. |
| `sourceFileHash` | Same 64-hex hash as field provenance. |
| `sourceRef` | `page`, `node`, `cell`, or `message`, plus a location id. |
| `text` | Normalized text. This is the string a later mapper may copy. |
| `extractedAt`, `confidence` | When the fragment was produced, and a 0–1 score. |
| `kind` | Optional hint: `text`, `pricing_table`, `waiver`, `email_header`, `capacity_letter`, `annex`. |
| `tags` | Optional closed labels for the same hint. |
| `spans` | Optional structured pieces of `text`. |

Unknown keys fail validation. A Talonic block, a raw OCR tree, or `bytes` cannot ride along inside a fragment.

`fragmentsTowardRegistryDraft(fragments)` returns `registry-entity-draft-v1`. Hinted kinds become evidence or criterion fields with `verificationMethod: adapter_extract`. `text` stays in `unmappedFragmentIds`. The draft omits donor, framework, and the rest of a snapshot on purpose. Passing it to `freezeAtJudgment` fails schema validation.

## Providers

`getExtractionProvider()` reads `TRACE_EXTRACTION_PROVIDER`.

| Value | Behavior |
| --- | --- |
| unset, empty, or `mock` | `MockExtractionProvider`. Deterministic fragments from the file name, media type, and bytes. No network. Fixed clock `2026-09-22T00:00:00.000Z`. This is the safe default. |
| `talonic` | `TalonicExtractionProvider`. Real HTTPS call. No SDK. |

The mock does not read pixels or spreadsheet cells. It stamps a kind hint so demos and tests have a stable shape. The file body is hashed and dropped.

| Environment | Required |
| --- | --- |
| `TRACE_EXTRACTION_PROVIDER` | `mock` or `talonic`. Unset means mock. |
| `TRACE_TALONIC_API_KEY` | Required only when the provider is `talonic`. Not read by the mock. Never log or commit it. |
| `TRACE_TALONIC_BASE_URL` | https URL, no userinfo and no query. When the provider is `talonic` and this is empty, the client uses `https://api.talonic.com/v1`. |

Do not commit key values. `.env.example` lists the names empty.

Missing `TRACE_TALONIC_API_KEY` throws `not_configured` and does not read the file or send a request. A non-https base URL, or one with userinfo or a query, throws `invalid_input` and does not send a request. Talonic `401` or `403` throws `unauthorized`. A request that exceeds the poll budget, including a document that is still processing, throws `timeout`. Other vendor failures throw `upstream`. `POST /api/extract` and `POST /api/desk` map those to 502, 504, and 501. The JSON error does not include the key.

The client `POST`s the file to `{base}/extract` as multipart, with `include_markdown=true`. `POST /api/extract` sends no pack, so Talonic auto-discovers fields. Its `Idempotency-Key` is `trace-v2-` plus the file SHA-256, cut to 64 characters. The signed-in desk sends the selected pack: a JSON Schema whose properties are the pack keys (not listed as `required`), natural-language `instructions`, and `options` `{ "strict": false, "include_raw_text": true }`. That idempotency key is `trace-v3-` plus the pack id and the file hash, cut to 64 characters, so a schema-less cached call is not replayed. The client does not send `include_provenance`. Provenance is still mapped when the body includes it. Redirects are not followed. Poll and result links must stay on the configured host and under `/v1` (or the base path).

Talonic is asked to return a verbatim quote or an empty string. Trace-li does not treat that JSON as the field value. On a pack extract, markdown is stored as one or more `document_text` fragments (up to four chunks of 14,000 characters). `alignPackFields` reads only those fragments. A pack key is filled when the text names that key and a `missing:` / `present:` state, or when a full-phrase statement for that key matches. A shared word is not a match. An explicit absence is never stored as present or true. A boolean control that the pack expects to be true is stored as negative `false`, which still fails `value_must_equal`. A `required_present` control the packet says is absent stays `missing`, with reason `Stated absent in this packet: …`, because a negative value would not raise that rule. Keys the packet does not state stay `missing` with `Not extracted from this packet.` If Talonic returns no markdown, pack keys stay missing even when `data` names them. Generic kind hints (`waiver`, `pricing_table`, and the others) still map, and fragments that are not pack fields stay unmapped.

A Talonic error keeps a calm sentence on `error` and, when the response supplied them, an `upstream` object with HTTP `status`, Talonic `code`, a short scrubbed `message`, and `requestId`. The API key and the Authorization header are not copied into that JSON. HTTP 500, 502, and 503 each use their own sentence, and that sentence includes the status. The upload desk shows the sentence and the upstream detail to the signed-in operator.

A 200 body is mapped immediately. Each non-empty `data` entry becomes one fragment. `null` and empty strings are skipped, so a missing vendor field stays missing rather than becoming a negative finding. The fragment id is `frag.talonic.{file hash}.{index}`, not the vendor extraction id. Confidence comes from `confidence.fields`, then a flat confidence map, then `confidence.overall`, then `0.5`. `created_at` becomes `extractedAt` when it parses. Kind is inferred from the field key (`waiver`, `capacity`, `annex`, `pricing` / `line_item` / `unit_price`, `email` / `subject` / `message_id`). Other keys stay `text` and `fragmentsTowardRegistryDraft` leaves them unmapped. Provenance `page` / `page_index` and `raw_text` / `source_text` become `sourceRef` and `spans` when present.

`MAX_EXTRACTION_FRAGMENTS` is 256. That is the extraction-result ceiling, and the same ceiling as a registry draft's `fields` and `unmappedFragmentIds` and an award snapshot's `fields`. The previous cap of 64 rejected schema-less discovery on ordinary multi-page terms of reference. The motivating packet is the UNICEF Amman long-term arrangement for local ride transport services, "TOR Ride Transport services - 7 June 2026 - Final Version.pdf": about six pages, text-extractable, and the caliber of award PDF the desk will see routinely. A result at or under 256 usable fields is stored in full. Above that, Trace-li keeps the 256 highest-confidence non-empty fields and continues, so the desk can still freeze. Equal confidence keeps the earlier field key. Empty values do not take a slot. The kept fields stay in key order. The extract does not ask the operator to narrow a normal award PDF. If a mapped result still cannot be stored because it is over that ceiling, the error names the 256 limit and the field count Talonic returned.

When `data` has no usable values and the call has no pack, `markdown` becomes one fragment. Its kind uses `document.type_detected` when that matches a hint, otherwise the same filename hints as the mock. A pack extract keeps markdown as `document_text` even when `data` has fields, and does not let the file name turn that corpus into a waiver or pricing fragment.

A 202, or a 200 that is still `processing`, polls `poll_url` (or `GET {base}/documents/{id}`) until `completed`, then `GET {base}/extractions/{latest_extraction_id}`. The primary poll budget is 150 seconds. If the document is still processing, the client waits at most 8 seconds more and polls once. That extension sits inside a 20 second reserve, so the whole client budget is 170 seconds. It does not poll again after that, and it does not follow Talonic's five-minute recommendation. Redirects stay manual. Poll links stay on the configured host.

A document that is still processing after that budget throws `timeout`. The sentence names the Talonic document id and request id when the response included them, and it tells the operator to try again. The same `upstream` object from a vendor error (`status`, `code`, `message`, `requestId`) is kept when the poll body had them. The API key is scrubbed.

`POST /api/extract` and `POST /api/desk` set `maxDuration` to 180 so the function can return that timeout instead of the platform cutting the invocation off. Fluid Compute's maximum is 300 seconds on Hobby and Pro; 180 stays under that cap and leaves about 10 seconds after the client budget for the desk to freeze. Webhooks are not implemented.

`lib/field-registry/freeze.ts`, `lib/field-registry/playbook.ts`, and `lib/rule-library.ts` stay free of Talonic types.

### Enabling Talonic

Local and CI stay on the mock. Leave `TRACE_EXTRACTION_PROVIDER` unset or set it to `mock`.

```sh
TRACE_EXTRACTION_PROVIDER=talonic
TRACE_TALONIC_API_KEY=...
TRACE_TALONIC_BASE_URL=https://api.talonic.com/v1
```

Production project `traceli-new` already has the Talonic key and base URL. This change does not edit Vercel env vars. After this pull request is merged, the founder sets Production `TRACE_EXTRACTION_PROVIDER` to `talonic`. Until that flip, Production keeps the mock.

### Assumptions to confirm against the live API

- `include_provenance` is not sent. The POST form lists `include_markdown` and the official Node SDK form builder does not append `include_provenance`. Mapping still accepts provenance when the body includes it. Pack extracts send `options.include_raw_text` instead.
- `POST /api/extract` sends no schema. The desk sends an inline JSON Schema for the selected pack. Public docs say schema is optional. The Node SDK auto-fills `required` when a JSON Schema omits it; this client does not use the SDK and does not send `required`, because a required key can come back invented. Talonic's quote is not accepted unless it is grounded in the markdown and matches a pack statement or an explicit field-key state.
- Async completion is `GET /v1/documents/:id` until `completed`, then `GET /v1/extractions/:id`. `GET /v1/documents/:id/extractions` is used only when `latest_extraction_id` is absent. Confirm that list returns either full `data` or a `links.self` to the extraction.
- Trace still accepts `.xlsx`, `.eml`, and `.msg`. Talonic's POST page lists PDF, PNG, JPG, TIFF, WEBP, DOCX, TXT, and CSV. The other three are forwarded and surface `unsupported_media` when Talonic returns `unsupported_file_type`.
- `Idempotency-Key` for a schema-less call is `trace-v2-` plus the file SHA-256, sliced to 64 characters (Talonic's documented maximum). The `v2` prefix avoids replaying a cached call from the earlier key, which was `trace-` plus the full hash (70 characters) and sent `include_provenance`. A desk call sends `trace-v3-` plus the pack id and the hash, also sliced to 64, so a schema-less result is not replayed for that file. A failed call can still be cached for 24 hours under the key that was sent. The desk error includes the Talonic status, code, message, and request id when Talonic returns them.
- The quick-extract envelope has no cell coordinate. Spreadsheet fragments use a page source ref, not an invented cell id.

## Upload

`POST /api/extract` accepts multipart form data with a `file` field and an optional `awardId`. The caller needs the same Trace session as `/api/trace`. Without that session the route returns 403 and does not run a provider.

Allowed names: `.pdf`, `.docx`, `.xlsx`, `.eml`, `.msg`, `.txt`, `.png`, `.jpg`, `.jpeg`. The media type must match the extension, or be empty or `application/octet-stream` so the extension can decide. Anything else is `unsupported_media`. The file must be non-empty and at most 8 MB. A larger declared body is `too_large` (413).

The JSON response is an `ExtractionResult`. It is not stored.

The signed-in upload desk (`POST /api/desk`) calls the same `extractParsedUpload` helper with the selected `packId`, then `fragmentsTowardRegistryDraft` and `alignPackFields`. It does not change the default provider. See [workos-upload-desk.md](./workos-upload-desk.md).

For an offline file on the machine running the app:

```sh
pnpm extract:stub -- --file=./packet.txt
```

`pnpm extract:stub --file=./packet.txt` works when pnpm forwards the flag. The `--` form is the reliable one.

That command uses the same `getExtractionProvider()` path as the route. With the default mock it prints fragments and does not call Talonic. With `TRACE_EXTRACTION_PROVIDER=talonic` it sends the file.

## Tests

```sh
pnpm test:extraction
pnpm test:field-registry
```

The extraction suite checks stable mock provenance, the default provider, one fragment schema, the Talonic HTTP client with a mocked `fetch` (no live network), auth, timeout, redirect, and async poll behavior, and that freeze and the Rule library source do not mention Talonic.
