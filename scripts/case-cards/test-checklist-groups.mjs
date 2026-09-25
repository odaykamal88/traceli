import assert from 'node:assert/strict'
import test from 'node:test'

import { checklistGroupId, fieldTitle, groupChecklistFields } from '../../lib/case-card-presentation/checklist.ts'
import { splitGlossary } from '../../lib/case-card-presentation/glossary.ts'
import { readerFacingText } from '../../lib/case-card-presentation/reader-text.ts'
import { getCaseCard } from '../../lib/case-cards/catalog.ts'

function field(key, value) {
  return {
    fieldId: `field:${key}`,
    entityKind: 'evidence',
    entityId: `evidence:${key}`,
    key,
    value,
    provenance: {
      sourceFileHash: 'a'.repeat(64),
      sourceRef: { kind: 'page', id: 'page-1', label: 'Page 1' },
      extractedAt: '2026-09-24T00:00:00.000Z',
      confidence: 1,
      verificationMethod: 'unverified',
    },
  }
}

test('checklist groups present, missing, stated absent, and negative separately', () => {
  const fields = [
    field('procurement.plan_line', { state: 'present', value: 'Plan line 14' }),
    field('procurement.po_or_contract', { state: 'missing', reason: 'Not extracted from this packet.' }),
    field('procurement.rir', { state: 'missing', reason: 'Stated absent in this packet: no receiving report.' }),
    field('integrity.coi_declared', { state: 'negative', value: false }),
  ]
  const groups = groupChecklistFields(fields, ['unfpa'])
  const ids = Object.fromEntries(groups.map(group => [group.id, group.rows.map(row => row.key)]))
  assert.deepEqual(ids.present, ['procurement.plan_line'])
  assert.deepEqual(ids.missing, ['procurement.po_or_contract'])
  assert.deepEqual(ids['stated-absent'], ['procurement.rir'])
  assert.deepEqual(ids.negative, ['integrity.coi_declared'])
  assert.equal(checklistGroupId(fields[1]), 'missing')
  assert.equal(checklistGroupId(fields[2]), 'stated-absent')
  assert.equal(groups.find(group => group.id === 'present')?.rows[0].title, 'Annual procurement plan line required')
  assert.equal(groups.find(group => group.id === 'missing')?.rows[0].title, 'Binding purchase order or contract required before delivery')
  assert.equal(groups.find(group => group.id === 'stated-absent')?.rows[0].quote, 'Stated absent in this packet: no receiving report.')
  assert.equal(groups.find(group => group.id === 'negative')?.rows[0].quote, 'No')
  assert.equal(groups.find(group => group.id === 'present')?.rows[0].quote, 'Plan line 14')
})

test('field titles prefer the pack rule, then a ticket title, then the label map', () => {
  assert.equal(
    fieldTitle('idd.screen_scope', ['global-fund']),
    'Restrictive Measures scope must attest UN, OFAC, US State, Switzerland, and debarment',
  )
  assert.equal(fieldTitle('idd.screen_scope', ['ocha-cbpf']), 'Annex 7 designated-entity scope must be attested')
  assert.equal(
    fieldTitle('procurement.file_completeness', ['global-fund'], [{
      fieldKey: 'procurement.file_completeness',
      title: 'Execution file: delivery, reception, validation',
    }]),
    'Execution file: delivery, reception, validation',
  )
  assert.equal(
    fieldTitle('procurement.competition_or_exemption_documented', ['global-fund'], [{
      fieldKey: 'procurement.competition_or_exemption_documented',
      title: 'Competition or exemption must be on the file',
    }]),
    'Competition or sole-source exemption documentation required',
  )
  assert.equal(fieldTitle('audit.office_rating', ['unfpa']), 'Office rating stated in the report')
  assert.equal(fieldTitle('audit.custom_note', ['unfpa']), 'Audit custom note')
})

test('a published card keeps unmapped fields in Missing, with human titles', () => {
  const card = getCaseCard('gf-oig-25-005')
  assert.ok(card?.frozenRecord)
  const groups = groupChecklistFields(
    card.frozenRecord.snapshot.fields,
    card.packsInForce.map(pack => pack.packId),
    card.patternTickets,
  )
  assert.equal(groups.find(group => group.id === 'missing')?.rows.length, card.frozenRecord.snapshot.fields.length)
  assert.equal(groups.find(group => group.id === 'stated-absent')?.rows.length, 0)
  assert.equal(groups.find(group => group.id === 'present')?.rows.length, 0)
  assert.equal(groups.find(group => group.id === 'negative')?.rows.length, 0)
  const scope = groups.find(group => group.id === 'missing')?.rows.find(row => row.key === 'idd.screen_scope')
  assert.equal(scope?.title.includes('Restrictive Measures'), true)
  assert.notEqual(scope?.title, 'idd.screen_scope')
  assert.equal(scope?.quote, 'Not extracted from this packet.')
})

test('reader-facing text swaps checklist and numeric open-item counts only', () => {
  const lede = 'readiness red, 22 findings, and no pack fields mapped from the file.'
  assert.match(readerFacingText(lede), /22 open items/)
  assert.match(readerFacingText(lede), /no checklist fields/)
  assert.match(readerFacingText('Nothing here says Trace-li would have prevented the audit finding.'), /audit finding/)
  assert.match(readerFacingText('Other Sudan findings stay outside this card.'), /Sudan findings/)
  assert.equal(readerFacingText('thin rehearsal packet'), 'thin rehearsal packet')
  assert.equal(readerFacingText('The Global Fund pack checks the file.'), 'The Global Fund checklist checks the file.')
})

test('glossary splits known acronyms without eating longer neighbours', () => {
  const parts = splitGlossary('All four RFQs, one PO, and the IPRC flag on UNPP.')
  const terms = parts.filter(part => part.type === 'term').map(part => part.surface)
  assert.deepEqual(terms, ['RFQs', 'PO', 'IPRC', 'UNPP'])
  assert.equal(splitGlossary('idd.screen_scope').every(part => part.type === 'text'), true)
})
