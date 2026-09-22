import assert from 'node:assert/strict'
import test from 'node:test'
import {
  addCatalogPack,
  catalogAvailable,
  createUploadPack,
  freezeGoverningPacks,
  inForcePacks,
  inForceSignature,
  ruleLibraryCategories,
  ruleLibraryHeroCopy,
  sanitizeStoredBoard,
  scriptedUploadMapping,
  seedFrozenGoverningPacks,
  seedInForcePacks,
  seedRuleLibraryBoard,
  serializeBoard,
  toggleOrgDefault,
  curatedRuleLibraryPacks,
} from '../../lib/rule-library.ts'
import { isWorkspaceProductPath } from '../../lib/workspace-product.ts'
import { sanitizeDisposition } from '../../lib/award-desk.ts'

test('Rule library seeds four packs in force and keeps three in the catalog', () => {
  const board = seedRuleLibraryBoard()
  assert.equal(curatedRuleLibraryPacks.length, 7)
  assert.deepEqual(ruleLibraryCategories.map(item => item.id), [
    'procurement',
    'donor',
    'sanctions',
    'past',
    'safeguarding',
  ])
  assert.equal(inForcePacks(board).length, 4)
  assert.equal(catalogAvailable(board).length, 3)
  assert.ok(inForcePacks(board).every(pack => pack.onBoard && pack.orgDefault))
  assert.ok(board.every(pack => pack.illustrative === pack.curated || pack.source === 'upload'))
  assert.match(board.find(pack => pack.id === 'procurement-manual')?.name || '', /Procurement manual/)
  assert.match(board.find(pack => pack.id === 'echo-donor-conditions')?.name || '', /ECHO/)
  assert.match(board.find(pack => pack.id === 'sanctions-hygiene')?.name || '', /sanctions/i)
  assert.match(board.find(pack => pack.id === 'safeguarding-policy')?.name || '', /Safeguarding/)
  assert.match(board.find(pack => pack.id === 'global-fund')?.name || '', /Global Fund/)
  assert.match(board.find(pack => pack.id === 'fcdo-prime')?.name || '', /FCDO/)
})

test('Add from catalog turns the pack on for tonight', () => {
  const board = seedRuleLibraryBoard()
  const availableBefore = catalogAvailable(board).length
  const [first] = catalogAvailable(board)
  const next = addCatalogPack(board, first.id)
  assert.equal(catalogAvailable(next).length, availableBefore - 1)
  const added = next.find(pack => pack.id === first.id)
  assert.equal(added?.onBoard, true)
  assert.equal(added?.orgDefault, true)
  assert.ok(inForcePacks(next).some(pack => pack.id === first.id))
})

test('Org-default off stops overnight prep from citing a pack', () => {
  const board = seedRuleLibraryBoard()
  const id = 'procurement-manual'
  const next = toggleOrgDefault(board, id)
  assert.equal(next.find(pack => pack.id === id)?.orgDefault, false)
  assert.ok(!inForcePacks(next).some(pack => pack.id === id))
  assert.equal(board.find(pack => pack.id === id)?.orgDefault, true)
})

test('Upload mapping is scripted and does not keep file bytes', () => {
  const mapped = scriptedUploadMapping('field-ops-policy.pdf')
  assert.match(mapped.name, /field-ops-policy/)
  assert.equal(mapped.obligations.length, 3)
  const pack = createUploadPack({
    id: 'upload-1',
    fileName: 'field-ops-policy.pdf',
    category: 'procurement',
    orgDefault: true,
  })
  assert.equal(pack.source, 'upload')
  assert.equal(pack.onBoard, true)
  assert.doesNotMatch(JSON.stringify(pack), /file bytes|arrayBuffer|content:/i)
})

test('Stored board sanitizes unknown patches and restores seed packs', () => {
  const stored = sanitizeStoredBoard({
    packs: [{ id: 'procurement-manual', orgDefault: false, onBoard: true, showOnRecord: false }],
    uploads: [{ id: 'upload-1', name: 'Local finance rules', category: 'donor', orgDefault: true }],
  })
  assert.equal(stored.find(pack => pack.id === 'procurement-manual')?.orgDefault, false)
  assert.ok(stored.some(pack => pack.id === 'upload-1' && pack.category === 'donor'))
  const junk = sanitizeStoredBoard({ packs: [{ id: 'not-a-pack', orgDefault: true }], uploads: [{ id: 'evil' }] })
  assert.equal(junk.length, seedRuleLibraryBoard().length)
  assert.deepEqual(serializeBoard(seedRuleLibraryBoard()).packs.map(item => item.id).sort(), seedRuleLibraryBoard().map(item => item.id).sort())
})

test('Decision records freeze pack list and versions independently of later toggles', () => {
  const original = seedFrozenGoverningPacks()
  assert.equal(original.length, 4)
  const board = toggleOrgDefault(seedRuleLibraryBoard(), original[0].id)
  const stillFrozen = freezeGoverningPacks(original)
  assert.equal(stillFrozen[0].id, original[0].id)
  assert.ok(!inForcePacks(board).some(pack => pack.id === original[0].id))
  const recorded = sanitizeDisposition({
    decision: 'request',
    reason: 'Request Ethiopia-specific evidence and keep the overnight reconstruction open for the reviewer.',
    governingPacks: original,
  })
  assert.deepEqual(recorded.governingPacks.map(pack => `${pack.id}@${pack.version}`), original.map(pack => `${pack.id}@${pack.version}`))
  assert.equal(seedFrozenGoverningPacks().length, 4)
  assert.notEqual(inForceSignature(board), inForceSignature(seedRuleLibraryBoard()))
})

test('Workspace product paths are the library, not the protected tender workbench', () => {
  assert.equal(isWorkspaceProductPath('/workspace/library'), true)
  assert.equal(isWorkspaceProductPath('/workspace/library/upload'), true)
  assert.equal(isWorkspaceProductPath('/workspace/records'), true)
  assert.equal(isWorkspaceProductPath('/workspace/settings'), true)
  assert.equal(isWorkspaceProductPath('/workspace'), false)
  assert.equal(isWorkspaceProductPath('/workspace/trace'), false)
  assert.equal(isWorkspaceProductPath('/demo'), false)
})

test('Rule library copy stays approachable and does not invent a second product', () => {
  const copy = ruleLibraryHeroCopy()
  assert.match(copy, /What is checking tonight/)
  assert.doesNotMatch(copy, /MCP|Trust Center|SOC 2|In force \| Catalog \| Uploads/i)
  assert.doesNotMatch(JSON.stringify(curatedRuleLibraryPacks), /World Bank|ANAO|OLAF|UNMISS/)
})
