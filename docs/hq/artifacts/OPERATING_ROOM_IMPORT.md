# Operating Room import contract

State: blocked on original records and scope. This is an empty import template, not a report of customer progress.

For every existing row preserve original ID, board/source URL or file reference, author, recorded date and observation date. Capture account, named real owner, actual last action, send evidence, reply evidence, conversation evidence, recent task, steps, hours, workaround, consequence, deadline, buying route, willingness-to-pay support, unknown fields, commercial next step, next-step owner/date and observable done criterion. Append the HQ ID mapping; never overwrite the source board.

Import event type must be one of observed_send, observed_reply, observed_conversation, explicit_commitment, next_step_agreed or unknown. Drafts, intended sends and silence do not enter observed counters. Report sends, replies and conversations as separate event counts, de-duplicated by original message/event ID; report buying evidence separately. Privacy scope and permitted storage must be known before ingestion. Share only redacted summaries with Product/Editor.

Reconciliation acceptance: source row count reconciled; duplicate/conflicting entries flagged; quantities have units and provenance; next step has actual date/owner or is explicitly unagreed; source remains intact; Supervisor reviews before metrics update. No broad inbox scan is authorized by this import template.
