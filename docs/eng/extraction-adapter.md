# Extraction adapter

Status: P2 interface, offline mock, Talonic skeleton. 22 September 2026.
Code: `lib/field-registry/extract.ts` and the `extract-*.ts` modules beside it.
Registry schema: [field-registry-v1.md](./field-registry-v1.md).
Ownership: [spine-p0-p1-p3.md](./spine-p0-p1-p3.md).

Extraction is rented. The Field Registry, the Rule library, and freeze stay Trace IP.

A vendor may read a PDF, spreadsheet, or message. Trace keeps the normalized `Fragment` and the registry field that a person can freeze. Rules never import a Talonic type. `freezeAtJudgment` never sees file bytes or a vendor payload. Award desk is not wired to this adapter.

## Buy versus build

| Rent | Keep |
| --- | --- |
| OCR, layout, and mail parsing behind `ExtractionProvider` | `Fragment`, provenance, and `fragmentsTowardRegistryDraft` |
| A later Talonic call, when credentials exist | Rule packs, playbook input, and `freezeAtJudgment` |
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
| unset or `mock` | `MockExtractionProvider`. Deterministic fragments from the file name, media type, and bytes. No network. Fixed clock `2026-09-22T00:00:00.000Z`. |
| `talonic` | `TalonicExtractionProvider`. Skeleton only. |

The mock does not read pixels or spreadsheet cells. It stamps a kind hint so demos and tests have a stable shape. The file body is hashed and dropped.

The Talonic class has no SDK and no HTTP client. It still rejects a file type outside the allowlist, and it does not read the file.

| Environment | Required |
| --- | --- |
| `TRACE_EXTRACTION_PROVIDER` | `mock` or `talonic`. Unset means mock. |
| `TRACE_TALONIC_API_KEY` | Required only when the provider is `talonic`. Not read by the mock. |
| `TRACE_TALONIC_BASE_URL` | https URL, no userinfo and no query. Required only when the provider is `talonic`. |

Do not commit key values. `.env.example` lists the names empty.

Until both Talonic variables are set, `extract` throws `ExtractionError` with code `not_configured`. When they are set, it throws `unimplemented`. Neither path sends the file. A later change should map the vendor response into `fragmentSchema` and leave `lib/field-registry/freeze.ts`, `lib/field-registry/playbook.ts`, and `lib/rule-library.ts` untouched.

## Upload

`POST /api/extract` accepts multipart form data with a `file` field and an optional `awardId`. The caller needs the same Trace session as `/api/trace`. Without that session the route returns 403 and does not run a provider.

Allowed names: `.pdf`, `.docx`, `.xlsx`, `.eml`, `.msg`, `.txt`, `.png`, `.jpg`, `.jpeg`. The media type must match the extension, or be empty or `application/octet-stream` so the extension can decide. Anything else is `unsupported_media`. The file must be non-empty and at most 8 MB. A larger declared body is `too_large` (413).

The JSON response is an `ExtractionResult`. It is not stored.

The signed-in upload desk (`POST /api/desk`) calls the same `extractParsedUpload` helper and then `fragmentsTowardRegistryDraft`. It does not change the default provider. See [workos-upload-desk.md](./workos-upload-desk.md).

For an offline file on the machine running the app:

```sh
pnpm extract:stub -- --file=./packet.txt
```

`pnpm extract:stub --file=./packet.txt` works when pnpm forwards the flag. The `--` form is the reliable one.

That command uses the same `getExtractionProvider()` path as the route. It prints fragments and does not call Talonic.

## Tests

```sh
pnpm test:extraction
pnpm test:field-registry
```

The extraction suite checks stable mock provenance, the default provider, one fragment schema for a mock result and a Talonic-shaped result, the skeleton's `not_configured` and `unimplemented` errors, and that freeze and the Rule library source do not mention Talonic.
