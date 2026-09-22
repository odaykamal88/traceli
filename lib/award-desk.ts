/** Fictional Award desk scenario for the public `/demo`. Not a real client, award or finding. */

export const awardDeskSlug = 'rfp-2026-041'

export const awardDeskDecisions = [
  {
    id: 'request',
    label: 'Request evidence',
    hint: 'Hold reconstruction open until Ethiopia capacity is linked',
    recordStatus: 'Reconstruction in progress — evidence requested',
  },
  {
    id: 'exception',
    label: 'Accept with exception',
    hint: 'Document why the gap is accepted for kickoff',
    recordStatus: 'Reconstruction closed — accepted with exception',
  },
  {
    id: 'escalate',
    label: 'Escalate',
    hint: 'Route to compliance lead before programme kickoff',
    recordStatus: 'Reconstruction paused — escalated to compliance',
  },
] as const

export type AwardDeskDecisionId = (typeof awardDeskDecisions)[number]['id']

export const agentDraftReason =
  "Northstar’s award rests on country-specific delivery capacity (Req 07). Kenya and Sudan hubs are evidenced; Ethiopia is named in Annex B but no capacity letter or warehouse schedule is linked to the claim. Request Ethiopia-specific evidence from Northstar before kickoff Thursday, or record a named exception."

export const awardDeskScenario = {
  slug: awardDeskSlug,
  rfp: 'RFP-2026-041',
  title: 'Emergency Shelter & NFI Logistics',
  supplier: 'Northstar Relief',
  owner: 'Sarah Ahmed',
  reviewer: {
    firstName: 'Leila',
    fullName: 'Leila Hassan',
    locale: 'Cairo',
    greetingTime: 'Monday 9:02',
    recordedAtLabel: 'Leila Hassan · Monday 9:14 · Cairo',
  },
  stakes: 'Programme kickoff Thursday. Reviewer asked why Northstar won. The packet is incomplete.',
  requirement: {
    id: '07',
    title: 'Country-specific delivery capacity',
    text: 'Supplier shall demonstrate in-country warehousing and last-mile capacity for each destination country named in Annex B.',
  },
  packet: {
    linked: 23,
    total: 27,
    percent: 86,
    linkedItems: ['regional hub letters (Kenya, Sudan)', 'Northstar claim text'],
    gap: 'no Ethiopia-specific capacity evidence linked to the winning claim',
  },
  agentWindow: 'Done · Sun 23:14 – Mon 06:41',
  agentRange: 'Sun 23:14 – Mon 06:41',
  timeline: [
    { time: '23:14', work: 'Linked governing requirement 07 — country-specific delivery capacity', emphasis: 'requirement 07', gap: false },
    { time: '01:02', work: 'Checked packet — 23/27 evidence items linked (86%)', emphasis: '23/27', gap: false },
    { time: '03:48', work: 'Flagged gap — no Ethiopia-specific capacity evidence linked to Northstar claim', emphasis: null, gap: true },
    { time: '06:41', work: 'Drafted request for missing evidence + draft review disposition note for Leila', emphasis: null, gap: false },
  ],
  fileCanShow: [
    '23 evidence items linked',
    'Northstar claim text attached',
    'Regional hub letters on file (Kenya, Sudan)',
  ],
  stillNeeds: [
    'Ethiopia capacity evidence linked to Northstar’s claim',
    'Documented exception with named approver',
  ],
  quietRows: [
    { title: 'Cold-chain pharma transport · RFP-2026-028', status: 'Locked · award closed' },
    { title: 'WASH kit last-mile · RFP-2026-033', status: 'OK · evidence complete' },
  ],
  classification: 'synthetic' as const,
  fictional: true as const,
  realDecisionEligible: false as const,
  disclaimer: 'Public demo · Fictional data',
  caveats: [
    'Fictional award, supplier, reviewer and evidence only. No live model, upload or real procurement approval.',
    'Frozen registry hashes are a browser-session souvenir only — not an authenticated tenant audit export.',
    'The decision record shows freeze ids and truncated hashes; full method notes live on How Trace reasons.',
  ],
} as const

export type FrozenGoverningPack = {
  id: string
  name: string
  version: string
  category: string
  showOnRecord: boolean
}

export type AwardDeskDisposition = {
  decision: AwardDeskDecisionId
  reason: string
  recordedAtLabel: string
  governingPacks: FrozenGoverningPack[]
}

/** Client-safe summary of a Field Registry freeze. Full record stays server-side / session. */
export type AwardDeskFrozenRecordView = {
  recordId: string
  snapshotHash: string
  packsHash: string
  hashMethod: 'sha256:sorted-json-v1'
  frozenAt: string
  frozenBy: string
  readiness: 'unknown' | 'red' | 'amber' | 'green'
  findingCount: number
  packIds: string[]
  dispositionDecision: string
}

export const awardDeskFrozenStorageKey = ['traceli', 'award-desk', 'frozen', 'v1'].join('.')

export const defaultAwardDeskDisposition: AwardDeskDisposition = {
  decision: 'request',
  reason: agentDraftReason,
  recordedAtLabel: awardDeskScenario.reviewer.recordedAtLabel,
  governingPacks: [],
}

function freezePacks(packs: FrozenGoverningPack[] | undefined) {
  if (!packs) return []
  return packs.map(pack => ({
    id: String(pack.id),
    name: String(pack.name),
    version: String(pack.version),
    category: String(pack.category),
    showOnRecord: Boolean(pack.showOnRecord),
  }))
}

export const awardDeskStorageKey = ['traceli', 'award-desk', 'disposition', 'v1'].join('.')

export function decisionCopy(id: AwardDeskDecisionId) {
  const match = awardDeskDecisions.find(item => item.id === id)
  if (!match) throw new Error('Unknown fictional disposition.')
  return match
}

export function sanitizeDisposition(input: {
  decision: string
  reason: string
  governingPacks?: FrozenGoverningPack[]
}): AwardDeskDisposition {
  const decision = awardDeskDecisions.find(item => item.id === input.decision)
  const reason = input.reason.trim()
  if (!decision) throw new Error('Choose a disposition.')
  if (reason.length < 20 || reason.length > 2000) {
    throw new Error('Enter a reason between 20 and 2,000 characters.')
  }
  return {
    decision: decision.id,
    reason,
    recordedAtLabel: awardDeskScenario.reviewer.recordedAtLabel,
    governingPacks: freezePacks(input.governingPacks),
  }
}

const readinessLevels = new Set(['unknown', 'red', 'amber', 'green'])

export function sanitizeFrozenRecordView(input: unknown): AwardDeskFrozenRecordView {
  if (!input || typeof input !== 'object') throw new Error('Missing frozen registry record.')
  const body = input as Record<string, unknown>
  const recordId = String(body.recordId ?? '')
  const snapshotHash = String(body.snapshotHash ?? '')
  const packsHash = String(body.packsHash ?? '')
  const hashMethod = String(body.hashMethod ?? '')
  const frozenAt = String(body.frozenAt ?? '')
  const frozenBy = String(body.frozenBy ?? '')
  const readiness = String(body.readiness ?? '')
  const dispositionDecision = String(body.dispositionDecision ?? '')
  const findingCount = Number(body.findingCount)
  const packIds = Array.isArray(body.packIds) ? body.packIds.map(id => String(id)) : []
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(recordId)) throw new Error('Invalid frozen record id.')
  if (!/^[a-f0-9]{64}$/.test(snapshotHash) || !/^[a-f0-9]{64}$/.test(packsHash)) {
    throw new Error('Invalid frozen record hashes.')
  }
  if (hashMethod !== 'sha256:sorted-json-v1') throw new Error('Unknown frozen hash method.')
  if (!frozenAt || !frozenBy) throw new Error('Frozen record is missing actor or time.')
  if (!readinessLevels.has(readiness)) throw new Error('Unknown pipeline readiness.')
  if (!Number.isInteger(findingCount) || findingCount < 0 || findingCount > 64) {
    throw new Error('Invalid finding count.')
  }
  if (!dispositionDecision) throw new Error('Frozen disposition is missing.')
  return {
    recordId,
    snapshotHash,
    packsHash,
    hashMethod: 'sha256:sorted-json-v1',
    frozenAt,
    frozenBy,
    readiness: readiness as AwardDeskFrozenRecordView['readiness'],
    findingCount,
    packIds,
    dispositionDecision,
  }
}

export function shortHash(hash: string) {
  if (hash.length < 16) return hash
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`
}

export function awardDeskHeroCopy() {
  return [
    awardDeskScenario.reviewer.firstName,
    awardDeskScenario.title,
    awardDeskScenario.stakes,
    awardDeskScenario.disclaimer,
    ...awardDeskScenario.timeline.map(item => item.work),
    ...awardDeskDecisions.map(item => `${item.label} ${item.hint}`),
    agentDraftReason,
  ].join('\n')
}
