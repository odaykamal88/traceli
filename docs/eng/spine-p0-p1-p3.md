# Trace engineering spine: P0, P1, and P3

Status: contract for the sellable service. 22 September 2026.
Audience: engineers building Platform Core, Field Registry, and the Rule Library.

This brief is the ownership and interface contract for the award-assurance service. The schema and freeze helper that implement the Field Registry slice are specified in [field-registry-v1.md](./field-registry-v1.md).

These project names are the service spine. They are separate from HQ work-package ids (`HQ-M01` and the rest) and from operational severity in [AUTONOMOUS_OPERATIONS.md](../AUTONOMOUS_OPERATIONS.md).

## 1. North star

Trace (trace-li.com) proves an award before someone signs it. The buyer opens one award, sees which rules were in force, which source supports each material fact, what is missing, what a person decided, and a record that later pack toggles cannot rewrite.

The service path is:

```text
ingest → Field Registry → rules / playbooks → human judgment → frozen record → audit export
```

That path is the product. A chat window on a folder of PDFs is a different product and is out of scope.

| Build and keep | Rent | Refuse |
| --- | --- | --- |
| Field Registry with provenance on every value | Document and email extraction behind `ExtractionProvider` | Chat as the core experience |
| Deterministic Rule Library and, later, playbook checks over registry fields | Commodity model APIs as workers with a stored receipt | Donor interpretation owned by an outside model or vendor |
| Freeze at judgment | Hosting, identity (WorkOS), and Postgres | Rules that read raw PDFs, spreadsheets, or mail instead of registry fields |
| Contradiction and judgment loop over those fields | SharePoint / ERP connectors, later | A model output as the award decision |
| Immutable audit export | | Silent rewrite of a frozen pack list or snapshot hash |

Missing evidence stays a missing value. A document that supports an adverse fact is a negative value. The product must not collapse those into one "gap" flag.

### What already exists

The public product is already this shape, on fictional data, in the browser:

- Award desk at `/demo` reconstructs one award and records a human disposition (`lib/award-desk.ts`, `app/demo/award-desk.tsx`).
- Rule library at `/workspace/library` is the switchboard for packs in force (`lib/rule-library.ts`).
- Decision records at `/workspace/records` and `/demo/rfp-2026-041/record` show the packs frozen at disposition.

The protected synthetic workflow at `/workspace/trace` is the server-side proof that a frozen unit, a human decision, and an export can share one tenant boundary (`lib/trace/contract.ts`, `lib/trace/store.ts`, `lib/trace/export.ts`). It is fixture-only. Field Registry v1 is the award-shaped contract those surfaces converge on. This brief does not replace the Trace unit schema and does not rewire the demo.

## 2. Ownership

### P0 Platform Core

**Owns**

- Server-derived identity and organization: `getWorkspaceViewer` in `lib/workspace-access.ts`, role labels in `lib/workspace-policy.ts`.
- Tenant scope on every database operation: `withTenant` in `lib/db/tenant.ts` sets `app.organization_id` and the restricted `traceli_app` role. A browser-supplied organization id is not authority.
- The control graph in `db/schema.ts`: organizations, procurements, source documents and versions, requirements, findings, decisions (`lockedAt`, `rootHash`), audit events, outbox events.
- Append-only audit: `appendAuditEvent` in `lib/domain/audit-events.ts`, plus the existing hash chain in `lib/audit-integrity.ts`.
- The synthetic persistence and export path in `lib/trace/store.ts` and `lib/trace/export.ts`, as the pattern for a later registry export.

**Reads**

- The authenticated session's organization, actor, and role.
- Stored snapshots and frozen records, once persistence exists, and only inside `withTenant`.

**Writes**

- Tenant-scoped rows.
- One frozen decision record and its audit event in the same transaction, when that write exists.
- `decisions.rootHash` is the intended anchor for the registry snapshot hash. This brief does not add that column write.

**Hands off**

- To P1: persist `AwardRegistrySnapshot` and `FrozenDecisionRecord` exactly as validated. Call `verifyFrozenRecord` on every read. Do not reshape fields, fill missing values, or recompute packs from the live switchboard.
- To P3: store the pack list P3 passed into `freezeAtJudgment`. Do not toggle `orgDefault` or `showOnRecord` while serving a frozen record.

**Refuses**

- Interpreting donor or procurement text.
- Extracting files.
- Treating a model response as an award.
- Updating `packsInForce`, `snapshotHash`, or `packsHash` on an existing frozen record id. A correction is a new record with `supersedesRecordId` set.

### P1 Field Registry

**Owns**

- `lib/field-registry/`: Zod schemas, `freezeAtJudgment`, `verifyFrozenRecord`, and the type-only extraction and playbook boundaries.
- Provenance on every field value.
- The snapshot hash and the packs hash.
- The distinction between `present`, `missing`, and `negative`.

**Guarantees**

- Schema `award-registry-snapshot-v1` for the snapshot and `frozen-decision-record-v1` for the record.
- Every field carries `sourceFileHash`, `sourceRef` (`page`, `node`, `cell`, or `message`), `extractedAt`, `confidence`, and `verificationMethod`.
- `snapshotHash` is `sha256:sorted-json-v1` over the snapshot alone. Pack toggles are not part of that hash. They have their own `packsHash`.
- `freezeAtJudgment` returns a deep-frozen object. Assignment to the hashes or the pack list throws.
- The helper does not read the session, the database, or a file.

**Hands off**

- Identity checks to P0. The snapshot carries `organizationId` so P0 can reject a mismatch with the session. The helper does not do that check.
- Pack meaning to P3. The registry stores the toggled scope it was given.
- Fragment production to P2. A best-effort draft is described in [extraction-adapter.md](./extraction-adapter.md). A full map onto `RegistryField` inside a snapshot is still later P1 work.

**Refuses**

- Accepting a field with no provenance.
- Storing file bytes on the snapshot or the fragment schema.
- Running OCR, a vendor extraction SDK, or a playbook.

### P3 Rule Library and Playbook Runtime

**Owns**

- The live switchboard: `lib/rule-library.ts`, `app/workspace/(product)/library/rule-library.tsx`.
- The in-force rule: `isPackInForce` is `onBoard && orgDefault`.
- The current demo freeze: `freezeGoverningPacks` copies `id`, `name`, `version`, `category`, and `showOnRecord` onto the Award desk disposition.
- The future `PlaybookEvaluate` function, which will accept `PlaybookInput` (snapshot plus pack toggles) and return `PipelineStatus`.

**Freezes onto a record**

For each pack that is in force at judgment:

| Frozen field | Source today |
| --- | --- |
| `packId`, `version`, `name` | Rule library pack |
| `toggledScope.orgDefault` | Must be on. `freezeAtJudgment` rejects `false`. |
| `toggledScope.showOnRecord` | Same flag the decision record already uses via `packsShownOnRecord` |
| `toggledScope.category` | Pack category id (`procurement`, `donor`, `sanctions`, `past`, `safeguarding`) |
| `frozenAt`, `frozenBy` | Stamped from the judgment, not copied from a later edit |

`packToggleFromRulePack` is the bridge from a `RuleLibraryPack` into that input. The public demo still calls `freezeGoverningPacks` and `sanitizeDisposition`. It does not call the registry helper.

**Hands off**

- Snapshot fields and hashes to P1.
- The stored frozen record to P0.
- File bytes back to P2. Uploads in the library stay scripted mappings (`scriptedUploadMapping`, `createUploadPack`) and still must not retain bytes.

**Refuses**

- Reading a PDF, spreadsheet, or message body from a rule.
- Letting a live `toggleOrgDefault` rewrite `packsInForce` on a record that already froze.
- Treating an illustrative pack (ECHO-style, Global Fund themes, sanctions hygiene) as official donor text. Those fixtures are labeled illustrative in `lib/rule-library.ts`.

## 3. Interface contracts

```text
P2  extract(input) -> ExtractionResult (Fragment[])
        |
        v
P1  map fragments onto AwardRegistrySnapshot fields     (later)
        |
        v
P3  PlaybookEvaluate({ snapshot, packs }) -> PipelineStatus   (later)
        |
        v
P4  human Disposition over those fields                    (stub now)
        |
        v
P1  freezeAtJudgment(snapshot, packs) -> FrozenDecisionRecord
        |
        v
P0  persist record + audit event, verifyFrozenRecord on read
        |
        v
P6  audit export of that record                            (later)
```

`freezeAtJudgment(snapshot, packs)` is the v1 call. `packs` is the judgment bundle, not a bare array:

- `recordId`, `supersedesRecordId`
- `frozenAt`, `frozenBy` (server-derived when P0 calls this)
- `packs[]` with pack id, version, name, and toggled scope
- `disposition` (decision, waiver refs, actor, role, timestamp, rationale)
- optional `pipelineStatus` (defaults to empty flags and readiness `unknown`)

### What Platform reads and writes

| | Contract |
| --- | --- |
| Read | Session organization and actor. Frozen record by id, inside the tenant transaction. |
| Write | Validated snapshot versions and frozen records. Audit event in the same transaction. |
| Check before serve | `verifyFrozenRecord`. Reject a snapshot whose `organizationId` is not the session organization. |
| Leave untouched | Live Rule library board (`traceli.rule-library.board.v1` in the browser today). |

The current Award desk write is `sessionStorage` keys `traceli.award-desk.disposition.v1` and `traceli.award-desk.frozen.v1` after `freezeAwardDeskDisposition` (see [award-desk-freeze.md](./award-desk-freeze.md)). That remains the demo souvenir. P0's server write is the later durable form of the same freeze.

### What the registry guarantees

- Hash method `sha256:sorted-json-v1`, the same canonical JSON as `canonicalJson` in `lib/trace/fixtures.ts` (keys sorted, array order preserved). The copy lives in `lib/field-registry/freeze.ts` so the helper does not import the server fixture module's Trace units.
- `snapshotHash` ignores pack toggles. Two judgments over one snapshot and two pack lists share a snapshot hash and differ in `packsHash`.
- After `freezeAtJudgment`, the returned object's `packsInForce`, `snapshotHash`, and `packsHash` cannot be mutated. A structured clone that changes a pack version or a field value fails `verifyFrozenRecord`.
- `present`, `missing`, and `negative` are different value states. A boolean `false` is a present or negative scalar, not a missing field.
- Classification is `synthetic` or `customer`. Carrying `customer` in the schema does not authorize customer documents. P0 and the document boundary still have to exist first. The public demo stays fictional.

### What the Rule Library freezes

The live board may change after judgment. The frozen record keeps the pack ids, versions, and toggled scope from the call. `toggleOrgDefault` removing a pack from `inForcePacks` changes the next judgment's pack list and `packsHash`. It does not change the earlier record.

Donor-facing display continues to use `showOnRecord`. Packs that were in force but hidden stay on the frozen list so an auditor can see they applied.

Role authorization stays in domain commands such as `recordFindingDetermination` in `lib/domain/finding-commands.ts`. The disposition schema checks shape, including waiver refs for `accept_with_exception` and `override_assessment`. It does not grant a role.

## 4. Sequencing

### In this slice

| Piece | Ships now |
| --- | --- |
| This brief and [field-registry-v1.md](./field-registry-v1.md) | Yes |
| Zod schemas, `freezeAtJudgment`, `verifyFrozenRecord`, unit tests | Yes |
| Bridge from Rule library packs and Award desk decision ids | Yes, pure functions, demo UI unchanged |
| `ExtractionProvider` and `PlaybookEvaluate` | Playbook types only. Extraction: see [extraction-adapter.md](./extraction-adapter.md) |

### Named boundaries beyond this slice

| Project | Boundary | In this pull request |
| --- | --- | --- |
| P2 Ingestion adapter | `extract(input) -> ExtractionResult` of `Fragment` values. Talonic sits behind `ExtractionProvider`. | [extraction-adapter.md](./extraction-adapter.md). Mock provider and `POST /api/extract`. No Talonic SDK. |
| P4 Contradiction and judgment loop | Reads registry fields, emits deterministic flags and semantic anomaly ids, then waits for a human disposition. | v0 scaffold: [contradiction-judgment-v0.md](./contradiction-judgment-v0.md). `evaluateJudgment` fills `PipelineStatus`. Award desk disposition freeze: [award-desk-freeze.md](./award-desk-freeze.md). |
| P5 Server decision record | Durable award record behind Award desk and `/workspace/records`, replacing the sessionStorage souvenir. | Not started. Demo record stays as it is. |
| P6 Immutable audit export | Buyer and donor export of a frozen registry record. `lib/trace/export.ts` is the synthetic precursor. | Not started. |
| P7 Connectors | SharePoint, ERP, and tender-portal adapters over the same domain services. | Named only. |
| P8 Model workers | Commodity models as replaceable workers with a receipt. They may propose field values or anomaly ids. They do not own donor interpretation, and they do not freeze a record. | Named only. |

P2's runnable adapter is [extraction-adapter.md](./extraction-adapter.md). P3's playbook input stays types only. P4's judgment scaffold is [contradiction-judgment-v0.md](./contradiction-judgment-v0.md); disposition UI wiring is later. P5 through P8 have no code in this slice.

## 5. Done when

### P0 Platform Core

- The actor and organization on a frozen record come from the server session.
- The snapshot's `organizationId` matches that session, or the write is rejected.
- The frozen record and its audit event commit in one transaction.
- A read runs `verifyFrozenRecord` and fails closed on a hash mismatch.
- No update path changes `packsInForce`, `snapshotHash`, or `packsHash` for an existing record id.
- Existing tenant-isolation and append-only audit tests still pass.

This pull request records that contract. It does not add the table write.

### P1 Field Registry

- `AwardRegistrySnapshot` accepts versioned project and award ids, donor and framework refs, and typed fields.
- A field without provenance fails validation.
- `present`, `missing`, and `negative` all validate and stay distinct.
- `freezeAtJudgment(snapshot, packs)` returns a `FrozenDecisionRecord`.
- A test proves that toggling a pack off after freeze leaves the frozen pack list and the snapshot hash unchanged.
- The helper stays free of extraction SDKs and model calls.

### P3 Rule Library and Playbook Runtime

- In force remains `onBoard && orgDefault`.
- A frozen pack carries id, version, toggled scope, `frozenAt`, and `frozenBy`.
- Turning a pack off on the live board does not rewrite a frozen record. The current demo test in `scripts/rule-library/test-rule-library.mjs` and the registry test both hold that line.
- When a playbook runtime exists, its input type is `PlaybookInput` and it returns `PipelineStatus`. File bytes are not a parameter.
- Upload mapping still does not keep file bytes.

The runtime itself is later. The type and the freeze bridge are the v1 obligation.

## 6. Map onto the current code

Do not add a second award product beside these modules.

| Surface | Path | Registry relationship |
| --- | --- | --- |
| Award desk scenario and disposition | `lib/award-desk.ts` | `request`, `exception`, and `escalate` map through `dispositionFromAwardDeskDecision` to `request_evidence`, `accept_with_exception`, and `escalate`. The demo still stores `AwardDeskDisposition`. |
| Award desk UI | `app/demo/award-desk.tsx` | On confirm, freezes via `freezeAwardDeskDispositionAction`, stores disposition + frozen view in sessionStorage, shows record id/hashes on `/record`. |
| Prep, disposition, record routes | `app/demo/[awardId]/page.tsx`, `disposition/page.tsx`, `record/page.tsx` | Fictional record. Unchanged. |
| Rule library | `lib/rule-library.ts` | `inForcePacks`, `toggleOrgDefault`, `freezeGoverningPacks`. `packToggleFromRulePack` reads this shape. |
| Library UI | `app/workspace/(product)/library/rule-library.tsx` | Live toggles. Unchanged. |
| Decision records UI | `app/workspace/(product)/records/records-view.tsx` | Reads the session disposition and says a later toggle does not rewrite history. Unchanged. |
| Workspace paths | `lib/workspace-product.ts` | `/demo`, `/workspace/library`, `/workspace/records`. |
| Control graph | `db/schema.ts` | Future store for snapshots and for `decisions.rootHash`. No migration in this slice. |
| Findings command | `lib/domain/finding-commands.ts` | Existing human determination write. Separate from registry freeze until P5. |
| Synthetic Trace unit | `lib/trace/contract.ts` | Sibling contract: evidence snapshot, policy pack, human decision, export. Fixture-only. Shares the hash method, not the award snapshot shape. |
| Tenant and identity | `lib/db/tenant.ts`, `lib/workspace-access.ts` | P0 keeps these as the only identity path. |

`/workspace/trace` remains the local synthetic vertical slice. Field Registry tests do not require Postgres.

## 7. Verification

```sh
pnpm test:field-registry
pnpm test:rule-library
pnpm test:award-desk
```

`pnpm test:field-registry` is in CI next to the Rule library test. The Award desk and Rule library demos are intentionally untouched.
