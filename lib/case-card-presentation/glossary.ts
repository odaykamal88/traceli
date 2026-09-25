/**
 * Acronyms shown on Trace-li case card pages.
 * One short sentence each. Wording follows this repo’s research articles,
 * SOURCES notes, and pack docs. Where those sources use the acronym without
 * spelling it, the sentence uses the UN or Global Fund name and does not
 * add a procedure the sources do not state.
 */

export const glossary = [
  {
    id: 'hact',
    label: 'HACT',
    // content/research/unfpa/SOURCES.md S-04, S-07, S-08; app/research/unfpa/article-body.ts (micro-assessments and HACT audits). The repo does not spell the acronym. Name: UN Harmonized Approach to Cash Transfers.
    definition: 'UN Harmonized Approach to Cash Transfers.',
  },
  {
    id: 'rfq',
    label: 'RFQ',
    // app/research/unfpa/article-body.ts: “request for quotation that the vendor received.”
    definition: 'Request for quotation.',
  },
  {
    id: 'rir',
    label: 'RIR',
    // lib/field-registry/packs/unfpa.ts “Receiving and inspection report”; app/research/unfpa/article-body.ts “receipt and inspection reports”; content/research/unfpa/SOURCES.md incomplete-RIR note.
    definition: 'Receiving and inspection report.',
  },
  {
    id: 'crc',
    label: 'CRC',
    // content/research/unfpa/SOURCES.md A-06; lib/field-registry/packs/unfpa.ts “Contracts Review Committee gate”; app/research/unfpa/article-body.ts “contracts review committees.”
    definition: 'Contracts Review Committee.',
  },
  {
    id: 'lta',
    label: 'LTA',
    // content/research/unfpa/SOURCES.md A-03; app/research/unfpa/article-body.ts “long-term agreements for recurring purchases.”
    definition: 'Long-term agreement.',
  },
  {
    id: 'unpp',
    label: 'UNPP',
    // app/research/unfpa/article-body.ts “United Nations Partner Portal”; lib/field-registry/packs/unfpa.ts “UNPP profile complete and validated.”
    definition: 'United Nations Partner Portal.',
  },
  {
    id: 'onegms',
    label: 'OneGMS',
    // lib/field-registry/packs/ocha-cbpf.ts “OneGMS project status” and “OneGMS selection record”; content/research/ocha-cbpf/SOURCES.md C-11 and C-13; docs/case-factory-unfpa-ocha.md. The repo does not spell the acronym. Name: OCHA One Grant Management System.
    definition: 'OCHA’s One Grant Management System.',
  },
  {
    id: 'vrc',
    label: 'VRC',
    // app/research/unfpa/article-body.ts and content/research/unfpa/SOURCES.md X-06: the Vendor Review Committee recommends a vendor-sanctions decision to the Chief Procurement Official.
    definition: 'UNFPA Vendor Review Committee.',
  },
  {
    id: 'iprc',
    label: 'IPRC',
    // app/research/unfpa/article-body.ts “Implementing Partner Review Committee reviews a partner after an investigation report”; content/research/unfpa/SOURCES.md X-06.
    definition: 'UNFPA Implementing Partner Review Committee.',
  },
  {
    id: 'psea',
    label: 'PSEA',
    // lib/field-registry/packs/unfpa.ts “PSEA capacity assessment status on the IP file.” The repo does not spell the acronym. Name: protection from sexual exploitation and abuse.
    definition: 'Protection from sexual exploitation and abuse.',
  },
  {
    id: 'face',
    label: 'FACE',
    // lib/field-registry/packs/unfpa.ts “FACE or workplan linkage named before payment”; app/research/unfpa/article-body.ts mentions FACE without spelling it. Name: Funding Authorization and Certificate of Expenditure.
    definition: 'Funding Authorization and Certificate of Expenditure.',
  },
  {
    id: 'idd',
    label: 'IDD',
    // docs/eng/donor-packs-v1.md and docs/eng/donor-pack-global-fund-v1.md “integrity due diligence”; lib/field-registry/packs/global-fund.ts “Restrictive Measures / IDD”. Trace-li does not fetch lists.
    definition: 'Integrity due diligence.',
  },
  {
    id: 'cbpf',
    label: 'CBPF',
    // content/research/ocha-cbpf/SOURCES.md “Country-based Pooled Funds Global Guidelines.”
    definition: 'Country-based pooled fund.',
  },
  {
    id: 'oais',
    label: 'OAIS',
    // app/research/unfpa/article-body.ts “Office of Audit and Investigation Services”; UNFPA case-card publisher line.
    definition: 'UNFPA Office of Audit and Investigation Services.',
  },
  {
    id: 'oios',
    label: 'OIOS',
    // OCHA case-card publisher “United Nations Office of Internal Oversight Services”; app/research/ocha-cbpf/article-body.ts.
    definition: 'United Nations Office of Internal Oversight Services.',
  },
  {
    id: 'oig',
    label: 'OIG',
    // lib/case-cards/gf-oig-25-005.ts “Global Fund Office of the Inspector General”; app/research/global-fund/article-body.ts.
    definition: 'Global Fund Office of the Inspector General.',
  },
  {
    id: 'ip',
    label: 'IP',
    // app/research/unfpa/article-body.ts uses “implementing partner” and “IP” for the same role, including Annex 4 entry 13.
    definition: 'Implementing partner.',
  },
  {
    id: 'po',
    label: 'PO',
    // lib/field-registry/packs/unfpa.ts “Binding purchase order or contract required before delivery”; Sudan case card and the UNFPA research note use “purchase order.”
    definition: 'Purchase order.',
  },
  {
    id: 'coi',
    label: 'COI',
    // lib/field-registry/packs/unfpa.ts and global-fund.ts conflict-of-interest rule titles; app/research/unfpa/article-body.ts “conflict of interest.”
    definition: 'Conflict of interest.',
  },
] as const

export type GlossaryId = (typeof glossary)[number]['id']

export const glossaryById = Object.fromEntries(glossary.map(entry => [entry.id, entry])) as {
  [Id in GlossaryId]: Extract<(typeof glossary)[number], { id: Id }>
}

const glossaryPattern = new RegExp(
  `\\b(${[...glossary].sort((left, right) => right.label.length - left.label.length).map(entry => entry.label).join('|')})s?\\b`,
  'g',
)

const glossaryByLabel = new Map<string, (typeof glossary)[number]>(glossary.map(entry => [entry.label, entry]))

export type GlossaryPart =
  | { type: 'text'; text: string }
  | { type: 'term'; id: GlossaryId; surface: string }

/**
 * Split reader-facing prose so known acronyms can carry an expansion.
 * `seen` is the page’s first-occurrence set, filled in document order.
 * A later use of the same acronym stays plain text.
 */
export function takeGlossaryTerms(text: string, seen: Set<GlossaryId>): GlossaryPart[] {
  return splitGlossary(text).map(part => {
    if (part.type !== 'term') return part
    if (seen.has(part.id)) return { type: 'text', text: part.surface }
    seen.add(part.id)
    return part
  })
}

/** Split reader-facing prose so known acronyms can carry an expansion. */
export function splitGlossary(text: string): GlossaryPart[] {
  const parts: GlossaryPart[] = []
  let last = 0
  for (const match of text.matchAll(glossaryPattern)) {
    const index = match.index ?? 0
    if (index > last) parts.push({ type: 'text', text: text.slice(last, index) })
    const label = match[1] ?? match[0]
    const entry = glossaryByLabel.get(label)
    if (!entry) {
      parts.push({ type: 'text', text: match[0] })
    } else {
      parts.push({ type: 'term', id: entry.id, surface: match[0] })
    }
    last = index + match[0].length
  }
  if (last < text.length) parts.push({ type: 'text', text: text.slice(last) })
  if (parts.length === 0) parts.push({ type: 'text', text })
  return parts
}
