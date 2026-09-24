/**
 * Fictional Rule library fixtures for the workspace switchboard.
 * Illustrative Trace-authored summaries — not official policy text, not a live sanctions feed.
 * Starter-pack onboarding is out of MVP; the Add-a-pack drawer covers day-2 adds.
 * Names and versions follow classic policy-hub / drafting-source fixtures in traceli-demo-data.
 */

export const ruleLibraryCategories = [
  { id: 'procurement', label: 'Procurement' },
  { id: 'donor', label: 'Donor' },
  { id: 'sanctions', label: 'Sanctions & integrity' },
  { id: 'past', label: 'Past flags' },
  { id: 'safeguarding', label: 'Safeguarding' },
] as const

export type RuleLibraryCategoryId = (typeof ruleLibraryCategories)[number]['id']

export type RuleLibraryObligation = {
  title: string
  anchor: string
  note: string
}

export type RuleLibraryAwardCite = {
  name: string
  when: string
}

export type RuleLibraryPack = {
  id: string
  name: string
  plain: string
  category: RuleLibraryCategoryId
  version: string
  effective: string
  orgDefault: boolean
  showOnRecord: boolean
  onBoard: boolean
  curated: boolean
  lastUsed: string
  source: 'seed' | 'catalog' | 'upload'
  illustrative: boolean
  obligations: RuleLibraryObligation[]
  usedBy: RuleLibraryAwardCite[]
}

export type FrozenGoverningPack = {
  id: string
  name: string
  version: string
  category: RuleLibraryCategoryId
  showOnRecord: boolean
}

const categoryIds = new Set<string>(ruleLibraryCategories.map(item => item.id))

const kenyaShelter = {
  name: 'Kenya Shelter RFP-2026-041',
  when: 'Prep · tonight',
}

export const curatedRuleLibraryPacks: readonly RuleLibraryPack[] = [
  {
    id: 'procurement-manual',
    name: 'Procurement manual v4.1',
    plain: 'How your org runs competitive tenders and evaluation panels.',
    category: 'procurement',
    version: '4.1',
    effective: '1 Mar 2026',
    orgDefault: true,
    showOnRecord: true,
    onBoard: true,
    curated: true,
    lastUsed: 'Tonight · Kenya Shelter',
    source: 'seed',
    illustrative: true,
    obligations: [
      { title: 'Competitive threshold for goods above USD 50,000', anchor: '§4.2 Competitive methods', note: 'Open tender unless waiver logged.' },
      { title: 'Evaluation criteria published with RFP', anchor: '§6.1 Evaluation', note: 'Weights disclosed before receipt of bids.' },
      { title: 'Conflict of interest declaration by panel', anchor: '§3.4 Integrity', note: 'Panelists sign before scoring.' },
    ],
    usedBy: [
      kenyaShelter,
      { name: 'Somalia WASH framework 2024', when: 'Disposition · locked' },
    ],
  },
  {
    id: 'echo-donor-conditions',
    name: 'ECHO-style donor conditions',
    plain: 'Donor conditions Trace may check when funds are framed as ECHO-style.',
    category: 'donor',
    version: '2026.2',
    effective: '12 Jan 2026',
    orgDefault: true,
    showOnRecord: true,
    onBoard: true,
    curated: true,
    lastUsed: 'Tonight · Kenya Shelter',
    source: 'seed',
    illustrative: true,
    obligations: [
      { title: 'Eligibility aligned to ECHO financing decision', anchor: 'Art. 2 Eligibility', note: 'Illustrative framing — not official ECHO text.' },
      { title: 'Visibility of EU humanitarian funding', anchor: 'Visibility annex', note: 'Marking on communications and signage.' },
      { title: 'No double funding of same cost', anchor: 'Art. 9 Costs', note: 'Cross-check against other instruments.' },
    ],
    usedBy: [kenyaShelter],
  },
  {
    id: 'sanctions-hygiene',
    name: 'Multilateral sanctions hygiene',
    plain: 'Basic sanctions and integrity hygiene — illustrative, not a live list feed.',
    category: 'sanctions',
    version: '1.0',
    effective: '8 Feb 2026',
    orgDefault: true,
    showOnRecord: true,
    onBoard: true,
    curated: true,
    lastUsed: 'Tonight · Kenya Shelter',
    source: 'seed',
    illustrative: true,
    obligations: [
      { title: 'Screen beneficial owners against consolidated lists', anchor: 'Hygiene §1', note: 'Fixture list — not a live sanctions feed.' },
      { title: 'Document screening date and list version', anchor: 'Hygiene §2', note: 'Frozen onto decision record at disposition.' },
      { title: 'Escalate unresolved matches before award', anchor: 'Hygiene §4', note: 'Human disposition required.' },
    ],
    usedBy: [
      kenyaShelter,
      { name: 'Regional logistics LTA 2025', when: 'Prep · last week' },
    ],
  },
  {
    id: 'global-fund',
    name: 'Global Fund Grant Regulations v1',
    plain: 'Thin Grant Regulations–aligned checks for PR/SR awards, including Restrictive Measures evidence. Trace-li rules over registry fields; no live list fetch.',
    category: 'donor',
    version: '2026.2',
    effective: '—',
    orgDefault: false,
    showOnRecord: true,
    onBoard: false,
    curated: true,
    lastUsed: '—',
    source: 'catalog',
    illustrative: true,
    obligations: [
      { title: 'Contracts awarded on a transparent and competitive basis (or documented exemption)', anchor: 'Grant Regulations §5.1(a)', note: 'Maps to procurement.competitive_or_exempt + competition docs fields.' },
      { title: 'Conflict of interest disclosure for suppliers and panel', anchor: 'Supplier Code / COI policy', note: 'Maps to integrity.coi_disclosed.' },
      { title: 'Sub-recipient selection, capacity, and written agreement before flow-down', anchor: 'Grant Regulations · Sub-recipients', note: 'Maps to sr.selection_documented, sr.capacity_assessed, sr.written_agreement_on_file.' },
      { title: 'Restrictive Measures / IDD evidence before signature', anchor: 'SR and Supplier IDD Guidelines · Restrictive Measures', note: 'Attested scope, date, vintage, modality, and result. A non-clear result needs a disposition communicable to the Global Fund. Trace-li does not fetch lists.' },
    ],
    usedBy: [],
  },
  {
    id: 'fcdo-prime',
    name: 'FCDO commercial prime award desk v1',
    plain: 'Thin supplier-code checks for commercial primes awarding under FCDO, plus UK sanctions evidence. Not an FCDO HQ sales pack, and not a live list feed.',
    category: 'donor',
    version: '2026.2',
    effective: '—',
    orgDefault: false,
    showOnRecord: true,
    onBoard: false,
    curated: true,
    lastUsed: '—',
    source: 'catalog',
    illustrative: true,
    obligations: [
      { title: 'Conflicts declared and managed; Business Appointment Rules for ex-Crown staff', anchor: 'Supply Partner Code · Conflicts', note: 'Maps to integrity.coi_declared and integrity.business_appointment_checked.' },
      { title: 'Fair open competition or documented direct award before signature', anchor: 'Supply Partner Code · Competition hygiene', note: 'Maps to procurement.fair_open_or_documented_direct + docs fields.' },
      { title: 'Compliance declaration and delivery-chain partners on file', anchor: 'Code Annex 1b / delivery chain', note: 'Maps to documentation.compliance_declaration_on_file and delivery_chain.partners_identified.' },
      { title: 'UK Sanctions List and connected-persons evidence', anchor: 'UK Sanctions List', note: 'Attested uk-sanctions scope plus Procurement Act debarment or exclusion evidence. Thinner than the Global Fund IDD gate. Trace-li does not fetch lists.' },
    ],
    usedBy: [],
  },
  {
    id: 'unfpa',
    name: 'UNFPA OAIS-shaped award desk v0',
    plain: 'Thin IP and procurement checks shaped from public OAIS controls. Not a UNFPA manual and not a live UN desk run. Trace-li does not fetch VRC, IPRC, or UNGM lists.',
    category: 'donor',
    version: '2026.1',
    effective: '—',
    orgDefault: false,
    showOnRecord: true,
    onBoard: false,
    curated: true,
    lastUsed: '—',
    source: 'catalog',
    illustrative: true,
    obligations: [
      { title: 'Competitive IP path or documented waiver, with the threshold approver', anchor: 'IA/2025-29 ¶33', note: 'Regional Director when cumulative workplan amounts are expected to exceed US$0.5 million, as that audit states the policy. Maps to ip.competitive_or_waiver, ip.waiver_or_competition_documented, and ip.threshold_approver.' },
      { title: 'UNPP profile, HACT micro-assessment, and PSEA status', anchor: 'OAIS IP assurance', note: 'Maps to ip.unpp_profile, ip.hact_micro_assessment, and ip.psea_assessment. Overdue HACT is not a negative capacity finding.' },
      { title: 'RFQ criteria and individual scores, purchase order, CRC gate, and a contract-split check', anchor: 'OAIS procurement controls', note: 'Maps to procurement.rfq_criteria_and_scores, procurement.po_or_contract, procurement.crc_gate, and procurement.contract_split_checked.' },
      { title: 'Conflict of interest and related-party check', anchor: 'Annex 4 entries 13 and 21', note: 'Maps to integrity.coi_declared and integrity.related_party_checked. Region-banded public cases are not client files.' },
      { title: 'VRC, IPRC, UNPP flag, and UNGM evidence', anchor: 'Vendor and IP review policies', note: 'Attested status only. Trace-li does not fetch lists. A referral or a UNPP flag is not a completed recovery.' },
    ],
    usedBy: [],
  },
  {
    id: 'ocha-cbpf',
    name: 'OCHA CBPF Global Guidelines-shaped award desk v0',
    plain: 'Thin reserve, scorecard, and eligibility checks shaped from public CBPF Global Guidelines. Not a live OCHA desk run, and not a Secretariat partner-sanctions list.',
    category: 'donor',
    version: '2026.1',
    effective: '—',
    orgDefault: false,
    showOnRecord: true,
    onBoard: false,
    curated: true,
    lastUsed: '—',
    source: 'catalog',
    illustrative: true,
    obligations: [
      { title: 'Annex 7 due diligence, capacity, and declarations', anchor: 'CBPF Global Guidelines Annex 7', note: 'Includes conflict of interest and designated-entity tokens. Maps to partner.due_diligence_passed, partner.capacity_assessment, and partner.annex7_declarations.' },
      { title: 'Reserve pre-selection justification, especially single-source', anchor: 'OIOS 2025/098 ¶25', note: 'Maps to allocation.preselection_justification when modality is reserve. A missing justification is a file gap, not an ineligibility finding.' },
      { title: 'Scorecard or alternative selection document before recommendation', anchor: 'CBPF Guidelines Annex 4; OIOS 2025/098 ¶31–32', note: 'Maps to selection.scorecard_or_alternative. An accepted OneGMS action is not the same as the feature being in force.' },
      { title: 'Annex 9 notification path, and no invented Secretariat sanctions list', anchor: 'Annex 9 §3 and OIOS 2025/098 ¶37', note: 'The 48-hour duty is the guidance-note text. misconduct.secretariat_sanctions_regime must read none.' },
      { title: 'OneGMS project status and selection record', anchor: 'OneGMS selection fields', note: 'Intake keys only. A forensic audit completed after payment does not satisfy these gates.' },
    ],
    usedBy: [],
  },
  {
    id: 'kenya-shelter-precedent',
    name: 'Past precedent Kenya Shelter RFP 2025',
    plain: 'A locked fictional lesson from last year’s Kenya Shelter RFP.',
    category: 'past',
    version: 'locked',
    effective: '—',
    orgDefault: false,
    showOnRecord: true,
    onBoard: false,
    curated: true,
    lastUsed: '—',
    source: 'catalog',
    illustrative: true,
    obligations: [
      { title: 'Prior Kenya Shelter RFP flag: incomplete COI pack', anchor: 'Precedent KE-SH-2025', note: 'Locked fictional precedent for demo.' },
      { title: 'Re-check panel declarations when scope changes', anchor: 'Precedent note 2', note: 'Scope change restarts COI clock.' },
    ],
    usedBy: [{ name: kenyaShelter.name, when: 'Cited as precedent' }],
  },
  {
    id: 'safeguarding-policy',
    name: 'Safeguarding policy v3.0',
    plain: 'Safeguarding contacts, SEA channels, and child-risk screens for field awards.',
    category: 'safeguarding',
    version: '3.0',
    effective: '20 Nov 2025',
    orgDefault: true,
    showOnRecord: true,
    onBoard: true,
    curated: true,
    lastUsed: 'Tonight · Kenya Shelter',
    source: 'seed',
    illustrative: true,
    obligations: [
      { title: 'Safeguarding focal point named on award file', anchor: 'Policy §2.1', note: 'Contact on cover sheet.' },
      { title: 'SEA reporting channel visible to contractors', anchor: 'Policy §5', note: 'Clause in contract pack.' },
      { title: 'Child safeguarding risk screen for field awards', anchor: 'Policy §3.4', note: 'When activities involve minors.' },
    ],
    usedBy: [kenyaShelter],
  },
]

const mappedUploadObligations: RuleLibraryObligation[] = [
  { title: 'Documented competitive method for this award class', anchor: '§ mapped · p. 4', note: 'Scripted mapping from upload.' },
  { title: 'Eligibility exclusions mirrored into RFP pack', anchor: '§ mapped · p. 7', note: 'Scripted mapping from upload.' },
  { title: 'Record retention period for evaluation notes', anchor: '§ mapped · annex B', note: 'Scripted mapping from upload.' },
]

export const ruleLibraryStorageKey = ['traceli', 'rule-library', 'board', 'v1'].join('.')
export const ruleLibraryPrepSignatureKey = ['traceli', 'rule-library', 'prep-signature', 'v1'].join('.')

export function categoryLabel(id: string) {
  return ruleLibraryCategories.find(item => item.id === id)?.label ?? id
}

export function clonePack(pack: RuleLibraryPack): RuleLibraryPack {
  return {
    ...pack,
    obligations: pack.obligations.map(item => ({ ...item })),
    usedBy: pack.usedBy.map(item => ({ ...item })),
  }
}

export function seedRuleLibraryBoard(): RuleLibraryPack[] {
  return curatedRuleLibraryPacks.map(clonePack)
}

export function isPackInForce(pack: Pick<RuleLibraryPack, 'onBoard' | 'orgDefault'>) {
  return pack.onBoard && pack.orgDefault
}

export function inForcePacks(board: readonly RuleLibraryPack[]) {
  return board.filter(isPackInForce).map(clonePack)
}

export function boardPacks(board: readonly RuleLibraryPack[], category: 'all' | RuleLibraryCategoryId) {
  return board.filter(pack => pack.onBoard && (category === 'all' || pack.category === category)).map(clonePack)
}

export function catalogAvailable(board: readonly RuleLibraryPack[]) {
  return board.filter(pack => pack.curated && !pack.onBoard).map(clonePack)
}

export function inForceSignature(board: readonly RuleLibraryPack[]) {
  return inForcePacks(board)
    .map(pack => `${pack.id}@${pack.version}`)
    .sort()
    .join('|')
}

export function freezeGoverningPacks(packs: readonly (Pick<RuleLibraryPack, 'id' | 'name' | 'version' | 'category' | 'showOnRecord'> | FrozenGoverningPack)[]): FrozenGoverningPack[] {
  return packs.map(pack => ({
    id: String(pack.id),
    name: String(pack.name),
    version: String(pack.version),
    category: categoryIds.has(pack.category) ? pack.category : 'procurement',
    showOnRecord: Boolean(pack.showOnRecord),
  }))
}

export function packsShownOnRecord<T extends { showOnRecord: boolean }>(packs: readonly T[]) {
  return packs.filter(pack => pack.showOnRecord)
}

export function seedInForcePacks() {
  return inForcePacks(seedRuleLibraryBoard())
}

export function seedFrozenGoverningPacks() {
  return freezeGoverningPacks(seedInForcePacks())
}

export function addCatalogPack(board: RuleLibraryPack[], id: string, effective = '21 Sep 2026') {
  return board.map(pack => {
    if (pack.id !== id || !pack.curated) return clonePack(pack)
    return {
      ...clonePack(pack),
      onBoard: true,
      orgDefault: true,
      effective: pack.effective === '—' ? effective : pack.effective,
      lastUsed: 'Added today',
      source: 'seed' as const,
    }
  })
}

export function toggleOrgDefault(board: RuleLibraryPack[], id: string) {
  return board.map(pack => {
    if (pack.id !== id) return clonePack(pack)
    const orgDefault = !pack.orgDefault
    return {
      ...clonePack(pack),
      orgDefault,
      onBoard: orgDefault ? true : pack.onBoard,
    }
  })
}

export function toggleShowOnRecord(board: RuleLibraryPack[], id: string) {
  return board.map(pack => (pack.id === id ? { ...clonePack(pack), showOnRecord: !pack.showOnRecord } : clonePack(pack)))
}

export function scriptedUploadMapping(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, '').trim() || 'Uploaded pack'
  return {
    name: /\bv?\d/i.test(base) ? base : `${base} v1.0`,
    obligations: mappedUploadObligations.map(item => ({ ...item })),
  }
}

export function createUploadPack(input: {
  id: string
  fileName: string
  category: RuleLibraryCategoryId
  orgDefault: boolean
  effective?: string
}): RuleLibraryPack {
  const mapped = scriptedUploadMapping(input.fileName)
  return {
    id: input.id,
    name: mapped.name,
    plain: 'Your uploaded pack — obligations mapped for review.',
    category: input.category,
    version: '1.0',
    effective: input.effective ?? '21 Sep 2026',
    orgDefault: input.orgDefault,
    showOnRecord: true,
    onBoard: true,
    curated: false,
    lastUsed: '—',
    source: 'upload',
    illustrative: false,
    obligations: mapped.obligations,
    usedBy: [],
  }
}

type StoredPackPatch = {
  id: string
  orgDefault?: boolean
  showOnRecord?: boolean
  onBoard?: boolean
  lastUsed?: string
  effective?: string
  name?: string
  category?: RuleLibraryCategoryId
  version?: string
  source?: RuleLibraryPack['source']
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.slice(0, 200) : fallback
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

export function sanitizeStoredBoard(input: unknown): RuleLibraryPack[] {
  const board = seedRuleLibraryBoard()
  if (!input || typeof input !== 'object') return board
  const raw = input as { packs?: unknown; uploads?: unknown }
  const patches = Array.isArray(raw.packs) ? raw.packs : []

  for (const patch of patches) {
    if (!patch || typeof patch !== 'object') continue
    const item = patch as StoredPackPatch
    const index = board.findIndex(pack => pack.id === item.id)
    if (index < 0) continue
    const current = board[index]
    const category = categoryIds.has(String(item.category)) ? (item.category as RuleLibraryCategoryId) : current.category
    board[index] = {
      ...current,
      orgDefault: asBoolean(item.orgDefault, current.orgDefault),
      showOnRecord: asBoolean(item.showOnRecord, current.showOnRecord),
      onBoard: asBoolean(item.onBoard, current.onBoard),
      lastUsed: asString(item.lastUsed, current.lastUsed) || current.lastUsed,
      effective: asString(item.effective, current.effective) || current.effective,
      name: asString(item.name, current.name) || current.name,
      category,
      version: asString(item.version, current.version) || current.version,
    }
  }

  const uploads = Array.isArray(raw.uploads) ? raw.uploads.slice(0, 20) : []
  const extra: RuleLibraryPack[] = []
  for (const upload of uploads) {
    if (!upload || typeof upload !== 'object') continue
    const item = upload as StoredPackPatch & { fileName?: string }
    const id = asString(item.id)
    if (!id.startsWith('upload-') || extra.some(pack => pack.id === id) || board.some(pack => pack.id === id)) continue
    const category = categoryIds.has(String(item.category)) ? (item.category as RuleLibraryCategoryId) : 'procurement'
    extra.push(createUploadPack({
      id,
      fileName: asString(item.fileName || item.name, 'Uploaded pack') || 'Uploaded pack',
      category,
      orgDefault: asBoolean(item.orgDefault, true),
      effective: asString(item.effective, '21 Sep 2026') || '21 Sep 2026',
    }))
  }

  extra.reverse()
  return [...extra, ...board]
}

export function serializeBoard(board: readonly RuleLibraryPack[]) {
  return {
    packs: board.filter(pack => pack.curated).map(pack => ({
      id: pack.id,
      orgDefault: pack.orgDefault,
      showOnRecord: pack.showOnRecord,
      onBoard: pack.onBoard,
      lastUsed: pack.lastUsed,
      effective: pack.effective,
    })),
    uploads: board.filter(pack => pack.source === 'upload').map(pack => ({
      id: pack.id,
      name: pack.name,
      fileName: pack.name,
      category: pack.category,
      orgDefault: pack.orgDefault,
      showOnRecord: pack.showOnRecord,
      effective: pack.effective,
    })),
  }
}

export function nextUploadId(board: readonly RuleLibraryPack[]) {
  const used = board
    .map(pack => pack.id)
    .filter(id => id.startsWith('upload-'))
    .map(id => Number(id.slice('upload-'.length)))
    .filter(n => Number.isInteger(n) && n > 0)
  return `upload-${(used.length ? Math.max(...used) : 0) + 1}`
}

export function ruleLibraryHeroCopy() {
  return [
    'What is checking tonight?',
    'These are the rule packs Trace may cite when reconstructing an award.',
    ...curatedRuleLibraryPacks.map(pack => `${pack.name} ${pack.plain}`),
  ].join('\n')
}
