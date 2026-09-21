import { z } from 'zod'

export const operatingSourceId = 'appgprj_6a94833e5918819180fb17a031f5711e'
const text = (max: number) => z.string().max(max)
const timestamp = z.string().datetime({ offset: true })
const id = text(200).min(1)
const integer = z.number().int().nonnegative().max(1000000)
const unique = (rows: { id: string | number }[]) => new Set(rows.map(row => row.id)).size === rows.length
export const operatingTaskSchema = z.object({
  id: z.number().int().positive(), title: text(300), owner: z.enum(['Oday', 'Codex']), lane: text(100),
  status: z.enum(['todo', 'doing', 'blocked', 'done', 'review']), due: text(40), week: text(20), updated_at: timestamp,
  // Optional so older source packets and dated snapshots remain readable.
  // Notes and review packets stay in the owner-only Operating Room.
  priority: z.enum(['normal', 'later']).optional(),
  revision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
}).strict()
export type OperatingTask = z.infer<typeof operatingTaskSchema>
export const operatingRecordsSchema = z.object({
  tasks: z.array(operatingTaskSchema).max(500).refine(unique),
  metrics: z.array(z.object({ id, label: text(200), current: integer, target: integer, sort_order: integer }).strict()).max(100).refine(unique),
  reviews: z.array(z.object({ id, task_id: z.number().int().positive(), title: text(300), status: z.enum(['pending', 'accepted', 'changes']), created_at: timestamp, reviewed_at: timestamp.nullable() }).strict()).max(500).refine(unique),
  receipt_count: integer,
  latest: z.array(z.object({ id, job_id: text(100).min(1), at: timestamp, outcome: z.enum(['Completed', 'Passed', 'Failed', 'Missing inputs', 'Findings open', 'Gate unmet']) }).strict()).max(100).refine(unique),
}).strict().superRefine((records, ctx) => {
  const tasks = new Set(records.tasks.map(task => task.id))
  if (records.reviews.some(review => !tasks.has(review.task_id))) ctx.addIssue({ code: 'custom', message: 'Review task missing' })
  if (records.receipt_count < records.latest.length || new Set(records.latest.map(r => r.job_id)).size !== records.latest.length) ctx.addIssue({ code: 'custom', message: 'Invalid latest receipt set' })
})
export const operatingPacketSchema = z.object({
  schema_version: z.literal(1), source_id: z.literal(operatingSourceId), captured_at: timestamp, records: operatingRecordsSchema,
}).strict()
export const operatingSnapshotSchema = z.object({
  source: z.object({ captured_at: timestamp, received_at: timestamp, content_hash: z.string().regex(/^[a-f0-9]{64}$/), records: operatingRecordsSchema }).nullable(),
  checks: z.array(z.object({ id: z.string(), checked_at: timestamp, status: z.string(), content_hash: z.string().nullable(), model_eligible: z.boolean() })),
})
export type OperatingSnapshot = z.infer<typeof operatingSnapshotSchema>
