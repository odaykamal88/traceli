import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export type Receipt = { at: string; outcome: string }
export type Runtime = {
  schema_version: number
  checked_at: string
  connection: 'connected' | 'unavailable'
  schedules: { id: string; job_id: string; name: string; mandate: string; cadence: string; status: string; hq_handoff_configured: boolean }[]
  room: {
    fetched_at: string; task_count: number; pending_reviews: number
    pending_review_task_ids: number[]; unexpired_claims: number; receipt_count: number
    latest_receipts: Record<string, Receipt | null>
  } | null
  pending_local_receipts: number
}

export const operatingRoomUrl = 'https://traceli-operating-room.odeyqemal.chatgpt.site'

export async function readRuntime(): Promise<Runtime | null> {
  if (process.env.NODE_ENV !== 'development') return null
  try {
    const file = process.env.TRACELI_HQ_RUNTIME_FILE || path.join(process.cwd(), 'work/hq/runtime-status.json')
    const raw = await readFile(file, 'utf8')
    if (raw.length > 100_000) return null
    const data: Runtime = JSON.parse(raw)
    if (data.schema_version !== 1 || !Number.isFinite(Date.parse(data.checked_at)) || !Array.isArray(data.schedules)) return null
    if (!data.schedules.every(s => typeof s.id === 'string' && typeof s.job_id === 'string' && typeof s.name === 'string' && typeof s.mandate === 'string' && typeof s.cadence === 'string' && ['ACTIVE','PAUSED','UNKNOWN'].includes(s.status) && typeof s.hq_handoff_configured === 'boolean')) return null
    if (data.room && (!Number.isFinite(Date.parse(data.room.fetched_at)) || ![data.room.task_count,data.room.pending_reviews,data.room.unexpired_claims,data.room.receipt_count].every(n=>Number.isInteger(n)&&n>=0) || !Array.isArray(data.room.pending_review_task_ids) || !data.room.pending_review_task_ids.every(Number.isInteger) || !data.room.latest_receipts || !Object.values(data.room.latest_receipts).every(r=>r===null||(typeof r.outcome==='string'&&Number.isFinite(Date.parse(r.at)))))) return null
    return data
  } catch {
    return null
  }
}

export function isStale(at: string | undefined): boolean {
  return !at || !Number.isFinite(Date.parse(at)) || Date.now() - Date.parse(at) > 2 * 60 * 60 * 1000 || Date.parse(at) > Date.now() + 60_000
}
