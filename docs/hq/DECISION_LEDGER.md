# Decision Ledger

The schema is [decision.schema.json](schemas/decision.schema.json); initial records are in [decisions.json](data/decisions.json). Initial accepted policy decisions come from Oday’s current brief; they do not authorize specific future sends, spend or deployment. The original decision time is unknown, so `decided_at` is null and `recorded_at` is the preparation date.

Required: ID, decision/record dates, status, authority and level, scope, exact decision, rationale, alternatives, evidence references, consequences, owner, review trigger, supersedes/superseded-by and whether any execution is actually authorized. Proposal status never counts as approval. Correct by appending a replacement record and linking supersession; preserve rejected options and evidence.

DEC-001–010 record mandate-first organization, Oday authority, Supervisor role, charters before spawn, reviewed memory, ERP boundary, sanitized sharing test, public evidence content, actual commercial evidence and existing-project implementation. DEC-011 is the Supervisor’s reversible local-shell implementation decision. DEC-012 is an allocation proposal, not founder policy or spending authority.
