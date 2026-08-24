import type { AuditEvent } from '@/lib/traceli-demo-data'

export type AuditIntegrityRecord = {
  eventId: string
  index: number
  previousHash: string
  hash: string
}

const GENESIS_HASH = '0'.repeat(64)

function canonicalEvent(event: AuditEvent, previousHash: string) {
  return JSON.stringify({
    schema: 'traceli.audit-event.v1',
    previousHash,
    event: {
      id: event.id,
      time: event.time,
      title: event.title,
      actor: event.actor,
      category: event.category,
      source: event.source,
      snapshot: event.snapshot,
    },
  })
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)

  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function buildAuditHashChain(events: AuditEvent[]) {
  const records: AuditIntegrityRecord[] = []
  let previousHash = GENESIS_HASH

  for (const [index, event] of events.entries()) {
    const hash = await sha256(canonicalEvent(event, previousHash))
    records.push({ eventId: event.id, index, previousHash, hash })
    previousHash = hash
  }

  return records
}

export async function verifyAuditHashChain(events: AuditEvent[], records: AuditIntegrityRecord[]) {
  if (events.length !== records.length) return false

  let previousHash = GENESIS_HASH

  for (const [index, event] of events.entries()) {
    const record = records[index]
    if (!record || record.eventId !== event.id || record.previousHash !== previousHash) return false

    const expectedHash = await sha256(canonicalEvent(event, previousHash))
    if (record.hash !== expectedHash) return false
    previousHash = record.hash
  }

  return true
}
