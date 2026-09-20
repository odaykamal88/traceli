# Keeping the Operating Room current

The landing page is a decision view, not an activity counter. It should answer: what blocks the next milestone, how much outcome evidence exists, what Oday needs to do, and what changed.

## Sources and freshness

- Signed cloud feed: source API reads/changes push minimized metadata into Postgres. HQ reads that mirror after owner authentication. Source capture and cloud check times are distinct; stale sources pause paid drafts. See `EFFICIENT_CLOUD_LOOP.md`.
- `data/operating-room.json`: fallback minimized snapshot from the existing private Operating Room. Preserve original task/review IDs and the actual read timestamp. The UI labels it a snapshot and flags it for refresh after 24 hours. Page refresh does not reread the remote board.
- `data/control-room.json`: Supervisor-reviewed milestone definitions, blockers, requests, workstream handoffs, channel evidence and lessons. Each item has an evidence link or original task IDs; `reviewed_at` dates the brief. Update this alongside new accepted evidence.
- `data/events.json`: dated event history. Add outcomes, exceptions and decisions with evidence; do not rewrite earlier checkpoints to imply they were known sooner.
- Cloud status: the existing authenticated read-only Postgres reader supplies current saved runs, review states and budget reservations. The source bridge uses a separate restricted ingest identity; the dashboard reader cannot write or approve records.
- LinkedIn/X: dated release and feedback records only. No live analytics connector is installed. Missing reach or response metrics stay unavailable. An original board task marked done cannot establish publication without the URL/receipt.

## Supervisor update procedure

1. Read the original board through its owner-authorized connector; follow pagination to exhaustion for the selected tables. Keep task, review and metric metadata only. Do not import prospect or conversation content implicitly.
2. Preserve IDs, units, original observation dates and the new read timestamp. Keep recorded zero distinct from missing data and unlogged activity. Store a summary of any owner update with its date and source.
3. Reconcile the milestone and blockers with the new evidence. A scope is qualified only by a real task, owner, current need and purchasing route. Do not infer a delivery percentage or a completion date from activity volume.
4. Record each lesson as observation, change, next check and evidence. Label proposed rules and already-applied changes separately. Canonical memory promotion remains under the Constitution.
5. Check all document links, typecheck and browser behavior. Commit and deploy the private HQ preview under its existing scope. Do not alter the source board, approve its packets or widen worker permissions as a side effect of updating this view.

## Interaction boundaries

“Needs Oday” links to the existing review/task authority and discloses the exact requested input. It is not a pretend approval or submit button. Business status remains visibly dated. Infrastructure, full run details and routine definitions are under Systems; charters, jobs, decisions, memory and the library remain under Records & reference.

The company landing page combines the business milestone, supporting cloud milestone, dated owner asks, recent event history, A–G handoffs, channel outcomes and evidence-backed lessons. The cloud checklist counts readiness gates, not percent of desk migration or elapsed engineering effort.
