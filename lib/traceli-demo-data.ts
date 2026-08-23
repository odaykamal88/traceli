export type Tone = 'neutral' | 'teal' | 'amber' | 'blue' | 'ink'

export type Scenario = {
  organization: 'UN agency' | 'INGO' | 'Donor-funded organization'
  procurement: 'Emergency procurement' | 'Standard procurement'
  policy: 'ECHO conditions' | 'Internal procurement manual' | 'World Bank conditions'
  geography: 'Horn of Africa' | 'MENA' | 'West Africa'
  currency: 'EUR' | 'USD'
  role: 'Procurement Director' | 'Panel Member' | 'Auditor'
}

export const defaultScenario: Scenario = {
  organization: 'UN agency',
  procurement: 'Emergency procurement',
  policy: 'ECHO conditions',
  geography: 'Horn of Africa',
  currency: 'EUR',
  role: 'Procurement Director',
}

export const scenarioOptions = {
  organization: ['UN agency', 'INGO', 'Donor-funded organization'],
  procurement: ['Emergency procurement', 'Standard procurement'],
  policy: ['ECHO conditions', 'Internal procurement manual', 'World Bank conditions'],
  geography: ['Horn of Africa', 'MENA', 'West Africa'],
  currency: ['EUR', 'USD'],
  role: ['Procurement Director', 'Panel Member', 'Auditor'],
} as const

export const portfolioCases = [
  {
    id: 'RFP-2026-041',
    title: 'Emergency Shelter & NFI Logistics',
    region: 'Horn of Africa',
    team: 'Regional procurement',
    awardDate: '22 Aug',
    evidenceCoverage: 86,
    readiness: 'Blocked',
    blocker: 'Evidence gap, 2 approvals, 1 declaration',
    policy: 'ECHO · v2026.2',
    tone: 'amber' as Tone,
  },
  {
    id: 'ITB-2026-118',
    title: 'Cholera Response Medical Kits',
    region: 'West Africa',
    team: 'Health procurement',
    awardDate: '24 Aug',
    evidenceCoverage: 94,
    readiness: 'Blocked',
    blocker: 'Donor threshold exception',
    policy: 'Global Fund · v7',
    tone: 'amber' as Tone,
  },
  {
    id: 'RFQ-2026-073',
    title: 'Cash Programme Connectivity',
    region: 'MENA',
    team: 'Digital assistance',
    awardDate: '29 Aug',
    evidenceCoverage: 100,
    readiness: 'Ready for panel',
    blocker: 'No open blockers',
    policy: 'Internal manual · v4.1',
    tone: 'teal' as Tone,
  },
  {
    id: 'RFP-2026-097',
    title: 'Fleet Maintenance Framework',
    region: 'East Africa',
    team: 'Global logistics',
    awardDate: '04 Sep',
    evidenceCoverage: 78,
    readiness: 'In review',
    blocker: '6 evidence links unconfirmed',
    policy: 'Internal manual · v4.1',
    tone: 'blue' as Tone,
  },
]

export const suppliers = [
  {
    name: 'Northstar Relief Logistics',
    evidenceFound: 21,
    status: 'Needs clarification',
    owner: 'Sarah Ahmed',
    filter: 'clarification',
    tone: 'amber' as Tone,
  },
  {
    name: 'Al Safwa Humanitarian Supply',
    evidenceFound: 24,
    status: 'Ready for panel',
    owner: 'David Kimani',
    filter: 'ready',
    tone: 'teal' as Tone,
  },
  {
    name: 'East Africa Response Partners',
    evidenceFound: 19,
    status: 'Missing evidence',
    owner: 'Lina Haddad',
    filter: 'missing',
    tone: 'blue' as Tone,
  },
  {
    name: 'Global Shelter Solutions',
    evidenceFound: 22,
    status: 'Needs clarification',
    owner: 'Sarah Ahmed',
    filter: 'clarification',
    tone: 'amber' as Tone,
  },
]

export const requirements = [
  {
    id: 'REQ-07',
    title: 'Emergency delivery capacity',
    origin: 'Tender · RFP §4.2 p.14',
    owner: 'Programme team',
    policyCheck: '18 Aug 2026 · passed',
    affected: 'Northstar Relief',
    controls: 'CTRL-11 · operational reach',
    state: 'Needs clarification',
    tone: 'amber' as Tone,
  },
  {
    id: 'REQ-14',
    title: 'Conflict-of-interest declarations',
    origin: 'Procurement Manual §8.4',
    owner: 'Panel chair',
    policyCheck: '19 Aug 2026 · exception',
    affected: '1 panel member',
    controls: 'CTRL-04 · panel integrity',
    state: 'Declaration outstanding',
    tone: 'amber' as Tone,
  },
  {
    id: 'REQ-18',
    title: 'Safeguarding and PSEA policy',
    origin: 'Safeguarding Policy §3',
    owner: 'Safeguarding lead',
    policyCheck: '17 Aug 2026 · passed',
    affected: 'Global Shelter',
    controls: 'CTRL-19 · safeguarding',
    state: 'Reviewed',
    tone: 'teal' as Tone,
  },
  {
    id: 'REQ-22',
    title: 'Audited financial statements',
    origin: 'Tender · RFP §6.1',
    owner: 'Finance reviewer',
    policyCheck: '18 Aug 2026 · passed',
    affected: 'East Africa Response',
    controls: 'CTRL-23 · financial standing',
    state: 'In review',
    tone: 'blue' as Tone,
  },
]

export const governingSources = [
  {
    name: 'RFP-2026-041',
    type: 'Tender',
    version: 'Published · 02 Apr 2026',
    owner: 'Regional procurement',
    effective: '02 Apr 2026',
    synced: '19 Aug · 09:14 UTC',
    controls: '24 obligations · 7 criteria',
    repository: 'Tender workspace',
    access: 'Panel + procurement team',
  },
  {
    name: 'Procurement Manual',
    type: 'Internal policy',
    version: 'v4.1 · approved',
    owner: 'Global procurement policy',
    effective: '01 Jan 2026',
    synced: '18 Aug · 22:08 UTC',
    controls: '12 process controls',
    repository: 'SharePoint · controlled',
    access: 'All staff · read only',
  },
  {
    name: 'Donor Procurement Conditions',
    type: 'Donor rule',
    version: 'ECHO · v2026.2',
    owner: 'Grants & compliance',
    effective: '01 Mar 2026',
    synced: '19 Aug · 07:30 UTC',
    controls: '4 thresholds · 3 exceptions',
    repository: 'Donor policy library',
    access: 'Procurement + grants',
  },
  {
    name: 'Safeguarding Policy',
    type: 'Internal policy',
    version: 'v3.0 · approved',
    owner: 'Safeguarding director',
    effective: '15 Oct 2025',
    synced: '18 Aug · 22:08 UTC',
    controls: '5 supplier requirements',
    repository: 'Policy hub · controlled',
    access: 'All staff · read only',
  },
]

export const draftingSources = [
  {
    name: 'Procurement Manual §6.3',
    category: 'Approved policy',
    version: 'v4.1',
    access: 'All staff · read only',
  },
  {
    name: 'ECHO procurement conditions §4',
    category: 'Donor rule',
    version: 'v2026.2',
    access: 'Procurement + grants',
  },
  {
    name: 'Kenya Shelter RFP 2025 · §4.1',
    category: 'Approved precedent',
    version: 'Locked award record',
    access: 'Regional procurement',
  },
  {
    name: 'Somalia NFI framework 2025',
    category: 'Approved precedent',
    version: 'Locked award record',
    access: 'Regional procurement',
  },
  {
    name: 'Emergency Logistics Category Guide',
    category: 'Category source',
    version: 'v2.4',
    access: 'Global logistics',
  },
  {
    name: 'Safeguarding Policy §3',
    category: 'Approved policy',
    version: 'v3.0',
    access: 'All staff · read only',
  },
]

export type AuditCategory = 'Human action' | 'Traceli finding' | 'Approval' | 'Policy change' | 'Supplier event'

export type AuditEvent = {
  id: string
  time: string
  title: string
  actor: string
  category: AuditCategory
  source: string
  snapshot: string
}

export const baseAuditEvents: AuditEvent[] = [
  {
    id: 'evt-01',
    time: '18 Aug · 09:42',
    title: 'REQ-07 extracted from the published tender',
    actor: 'Traceli extraction',
    category: 'Traceli finding',
    source: 'RFP-2026-041 · §4.2 p.14',
    snapshot: 'The supplier must demonstrate delivery capacity across Kenya, Somalia and Ethiopia within 72 hours.',
  },
  {
    id: 'evt-02',
    time: '18 Aug · 10:03',
    title: 'Requirement confirmed and assigned',
    actor: 'Sarah Ahmed · reviewer',
    category: 'Human action',
    source: 'REQ-07 · version 2',
    snapshot: 'Requirement confirmed. Programme team owns the operational-reach determination.',
  },
  {
    id: 'evt-03',
    time: '18 Aug · 11:12',
    title: 'Northstar submission mapped to REQ-07',
    actor: 'Traceli mapping',
    category: 'Traceli finding',
    source: 'SUB-014 · p.38',
    snapshot: 'Regional stock and partner capacity were found, but no Ethiopia-specific passage was located.',
  },
  {
    id: 'evt-04',
    time: '18 Aug · 11:17',
    title: 'Missing Ethiopia evidence flagged',
    actor: 'Traceli finding',
    category: 'Traceli finding',
    source: 'REQ-07 · evidence map',
    snapshot: 'Kenya and Somalia evidence located. Ethiopia distribution plan not located. No compliance inference made.',
  },
  {
    id: 'evt-05',
    time: '18 Aug · 14:08',
    title: 'Clarification issued to Northstar Relief',
    actor: 'Amina Malik · procurement',
    category: 'Human action',
    source: 'CLR-004 · issued copy',
    snapshot: 'Please provide evidence demonstrating operational capacity in Ethiopia under RFP §4.2.',
  },
]

export const modelLedger = [
  {
    task: 'Source extraction',
    route: 'Highest citation recall + layout handling',
    provider: 'Google',
    model: 'Gemini document model',
    version: '2026-08-12',
    result: '24 obligations · 98.2% citation check',
    latency: '14.8 s',
    fallback: 'Not used',
  },
  {
    task: 'Tender drafting',
    route: 'Best grounded drafting score',
    provider: 'Anthropic',
    model: 'Claude reasoning model',
    version: '2026-08-15',
    result: '6 sources used · 0 unsupported claims',
    latency: '9.1 s',
    fallback: 'OpenAI drafting profile',
  },
  {
    task: 'Policy check',
    route: 'Strongest rule reasoning',
    provider: 'OpenAI',
    model: 'GPT reasoning model',
    version: '2026-08-18',
    result: '1 material interpretation surfaced',
    latency: '11.4 s',
    fallback: 'None',
  },
  {
    task: 'Independent challenge',
    route: 'Different model family',
    provider: 'Google',
    model: 'Gemini reasoning model',
    version: '2026-08-12',
    result: 'Agreement after human resolution',
    latency: '7.6 s',
    fallback: 'None',
  },
  {
    task: 'Bulk classification',
    route: 'Lowest acceptable cost + latency',
    provider: 'Mistral',
    model: 'Small classification model',
    version: '2026-08-09',
    result: '312 passages classified',
    latency: '2.3 s',
    fallback: 'OpenAI compact profile',
  },
]
