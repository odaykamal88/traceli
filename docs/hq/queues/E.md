# E · Development sequence

State: active queue (does not imply running workers). Owner: Product Steward / product.

## Objective

Trace model, shareable artifact and recipient workflow before broad integrations.

## Handoffs and review

Product reconciles existing plan; Listener supplies discovery evidence; Builder implements accepted narrow scope; Auditor checks.

## Constraints

Preserve current customer discovery and existing code; no rewrite of the product.

## Work queue

### HQ-E01 · Adjust development sequencing around the Trace and discovery

Owner: Product Steward. Initial status: ready. Authority: Green. Output: `specs/DEVELOPMENT_SEQUENCE.md`.

Dependencies: none. SLA: 45 active minutes after dispatch; review within 24 hours; no invented calendar deadline.

Acceptance:

- Trace model → beautiful artifact → recipient view → secure sharing → evidence workflow → new Trace → export → integrations
- Reconcile existing implementation plan explicitly
- Protect existing dated discovery commitments

### HQ-E02 · Implement accepted thin slice after sharing feedback

Owner: Builder. Initial status: blocked. Authority: Green. Output: `artifacts/product-change-packet`.

Dependencies: HQ-A03, HQ-E01. SLA: 60 active minutes after dispatch; review within 24 hours; no invented calendar deadline.

Acceptance:

- Use existing repository and approved evidence-based scope
- Tests cover access boundaries before real sharing
- Production deployment remains Red

Runtime status and evidence live in [jobs.json](../data/jobs.json). Charter limits override broader job defaults.

## 20 September moat increment

See [the mapped moat packages](../moat/DISPATCH_2026-09-20.md) for actual source task IDs, eligible phases, U/M/G batches and Jev readiness. Existing work and review states are preserved.
