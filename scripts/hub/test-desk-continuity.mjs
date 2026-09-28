import assert from 'node:assert/strict'
import test from 'node:test'

import { deskNavigationHref, deskTenderHref, readActiveDesk, resolveDeskContinuity, writeActiveDesk } from '../../lib/hub/desk-continuity.ts'
import { readHubLibraryResult } from '../../lib/hub/library.ts'

const library = {
  organizationId: 'org-a',
  uploads: [],
  engagements: [
    { id: 'eng.aaaaaaaa', name: 'Tender A', primaryPackId: 'global-fund', attachedUploadIds: [], createdAt: '2026-09-27T00:00:00.000Z' },
    { id: 'eng.bbbbbbbb', name: 'Tender B', primaryPackId: 'unfpa', attachedUploadIds: [], createdAt: '2026-09-27T00:00:00.000Z' },
  ],
}

function resolve(overrides = {}) {
  return resolveDeskContinuity({
    library,
    requestedTenderId: null,
    requestedTenderPresent: false,
    requestedPackId: null,
    requestedPackPresent: false,
    activeTenderId: null,
    activePackId: null,
    storedTenderId: 'eng.aaaaaaaa',
    storedPackId: 'global-fund',
    hasStored: true,
    ...overrides,
  })
}

test('generic desk restores the last tender and its pack', () => {
  const result = resolve()
  assert.equal(result.tender?.name, 'Tender A')
  assert.equal(result.packId, 'global-fund')
  assert.equal(result.restore, true)
  assert.equal(deskTenderHref(result.tender), '/desk?pack=global-fund&engagement=eng.aaaaaaaa')
})

test('a new tender without a packet is resumed from the active browser tab', () => {
  const result = resolve({
    activeTenderId: 'eng.bbbbbbbb', activePackId: 'unfpa',
    storedTenderId: null, storedPackId: null, hasStored: false,
  })
  assert.equal(result.tender?.name, 'Tender B')
  assert.equal(result.packId, 'unfpa')
  assert.equal(result.restore, false)
  assert.equal(deskNavigationHref({
    pathname: '/hub', query: new URLSearchParams(), library,
    active: { engagementId: 'eng.bbbbbbbb', packId: 'unfpa' },
  }), '/desk?pack=unfpa&engagement=eng.bbbbbbbb')
  const previous = globalThis.sessionStorage
  let saved = ''
  try {
    globalThis.sessionStorage = {
      getItem() { return saved || null },
      setItem(_key, value) { saved = value },
    }
    writeActiveDesk('org-a', { engagementId: result.tender.id, packId: result.packId })
    assert.deepEqual(readActiveDesk('org-a'), { engagementId: 'eng.bbbbbbbb', packId: 'unfpa' })
    assert.equal(readActiveDesk('org-b'), null)
  } finally {
    if (previous === undefined) delete globalThis.sessionStorage
    else globalThis.sessionStorage = previous
  }
})

test('header navigation follows a query-only switch from tender A to tender B', () => {
  const href = engagement => deskNavigationHref({
    pathname: '/desk', query: new URLSearchParams(`pack=global-fund&engagement=${engagement}`),
    library, active: { engagementId: 'eng.aaaaaaaa', packId: 'global-fund' },
  })
  assert.equal(href('eng.aaaaaaaa'), '/desk?pack=global-fund&engagement=eng.aaaaaaaa')
  assert.equal(href('eng.bbbbbbbb'), '/desk?pack=unfpa&engagement=eng.bbbbbbbb')
})

test('explicit tender B does not restore tender A, even when the last record exists', () => {
  const result = resolve({ requestedTenderId: 'eng.bbbbbbbb', requestedTenderPresent: true, requestedPackId: 'unfpa', requestedPackPresent: true })
  assert.equal(result.tender?.name, 'Tender B')
  assert.equal(result.packId, 'unfpa')
  assert.equal(result.restore, false)
})

test('explicit pack mismatch cannot restore a record against another pack', () => {
  const result = resolve({ requestedTenderId: 'eng.aaaaaaaa', requestedTenderPresent: true, requestedPackId: 'unfpa', requestedPackPresent: true })
  assert.equal(result.packId, 'global-fund')
  assert.equal(result.restore, false)
  assert.match(result.problem, /does not match/i)
  const noTender = resolve({ requestedPackId: 'unfpa', requestedPackPresent: true })
  assert.equal(noTender.restore, false)
  assert.equal(noTender.tender, null)
  assert.equal(noTender.packId, 'unfpa')
  const stalePack = resolve({ storedPackId: 'unfpa' })
  assert.equal(stalePack.restore, false)
  assert.match(stalePack.problem, /different pack/i)
})

test('unknown and invalid explicit tender links are visible and block upload', () => {
  for (const requestedTenderId of ['eng.cccccccc', null]) {
    const result = resolve({ requestedTenderId, requestedTenderPresent: true })
    assert.equal(result.restore, false)
    assert.equal(result.blockUpload, true)
    assert.match(result.problem, /tender/i)
  }
  const invalidPack = resolve({ requestedPackPresent: true })
  assert.equal(invalidPack.restore, false)
  assert.equal(invalidPack.blockUpload, true)
  assert.match(invalidPack.problem, /pack link is invalid/i)
})

test('browser storage read failures are returned instead of an empty saved list', () => {
  const previous = globalThis.localStorage
  try {
    globalThis.localStorage = { getItem() { throw new Error('blocked') } }
    const result = readHubLibraryResult('org-a')
    assert.equal(result.ok, false)
    assert.match(result.error, /could not be read/i)
  } finally {
    if (previous === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previous
  }
})
