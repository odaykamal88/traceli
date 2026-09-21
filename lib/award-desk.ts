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
    'This public desk does not create a server record, authenticated export or audit-ready pack.',
    'Hashes and method details live on How Trace reasons — not on this path.',
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
