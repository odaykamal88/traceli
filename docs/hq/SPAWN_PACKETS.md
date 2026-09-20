# Dispatch packets and manual Supervisor runbook

Read Constitution and the relevant charter before dispatch. Each job in data/jobs.json is the canonical bounded task; the eight charters include output contracts, memory, stop conditions and tools. No special framework is necessary to run a supervised manual cycle.

## Exact dispatch template

“Execute {job.id} as {job.owner}/{job.persona}, charter {job.charter_version}. Objective: {job.objective}. Read only {inputs_context} and {allowed_memory.read}. Use only {allowed_tools}. Write only {expected_output.path} and approved proposal/history paths. Return a structured envelope matching schemas/output.schema.json plus the human artifact. Meet each {acceptance_criteria}; list unsupported or unavailable evidence. Stop at the earlier charter/job limit, max {limits.max_tool_calls} calls and {deadline_sla.active_minutes} active minutes. No recursive spawning, external sends, paid services, customer-data expansion, canonical memory promotion, acceptance of your own output or production action. Submit to {reviewer}. If a permission/input is missing, return a blocker and partial evidence rather than improvising.”

## First supervised sequence

1. Publish charters, record jobs and bind temporary executor identity. No identity is a permanent employee.
2. Run HQ-D01 Investigator and HQ-B01 Editor independently while Builder prepares HQ-G01. Editor may proceed to HQ-C01 sequentially; do not run two Editor jobs concurrently.
3. Investigator output goes to a separate Auditor review HQ-D02; Editor copy uses only accepted claims. Auditor may block one account while accepting the others.
4. Product’s A01/E01 specs prepare the sanitized test. F01 remains blocked until the original Operating Room records and scope exist. Do not pretend a customer conversation happened.
5. Auditor reviews HQ-G03 after implementation. Supervisor accepts only after fixes and relevant verification.
6. Librarian proposes canonical changes with exact diffs; Supervisor records approval before promotion.
7. Save results, reviews, events and next owner, then release the temporary workers. Write a brief of accepted outputs, important decisions, unknowns and next assignments. Recurring loops stay disabled.

The present session’s workers use the current host allowance. Job-level cost is unavailable unless the host supplies it. Hard platform budgets cannot be claimed as enforced by prose; a future unattended runner must enforce them mechanically before enabling timers.

## Path resolution

Resolve job output and result paths from the repository root; do not prepend docs/hq to an already rooted path. Resolve human document links relative to their containing document. Tool/memory scope strings are permissions to be resolved by the host, not arbitrary paths supplied by a model. Enforce canonical resolved paths in a future runner.
