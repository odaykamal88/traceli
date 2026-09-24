import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  addHubEngagement,
  addHubUpload,
  deskTenderContext,
  hubEngagementParam,
  hubPackParam,
  hubSeedPackIds,
  hubSeedSources,
  hubSynthesisNote,
  hubUploadNote,
  HUB_UPLOAD_CAP,
  parseHubEngagement,
  parseHubUpload,
  sanitizeHubLibrary,
} from '../../lib/hub/library.ts'

const hash = 'ab'.repeat(32)
const uploadedAt = '2026-09-24T12:00:00.000Z'

function upload(id, fileName = 'manual.pdf', label = 'Procurement manual') {
  const parsed = parseHubUpload({
    id,
    fileName,
    byteLength: 24,
    contentHash: hash,
    uploadedAt,
    label,
  })
  assert.equal(parsed.ok, true)
  if (!parsed.ok) throw new Error('upload')
  return parsed.upload
}

test('every live donor pack has honest hub copy', () => {
  assert.deepEqual([...hubSeedPackIds], ['global-fund', 'fcdo-prime', 'unfpa', 'ocha-cbpf'])
  for (const id of hubSeedPackIds) {
    assert.ok(hubSeedSources[id].summary.length > 20)
    assert.ok(hubSeedSources[id].blurb.length > 10)
  }
  assert.match(hubSynthesisNote, /public-control synthesis/i)
  assert.match(hubSynthesisNote, /not official/i)
  assert.match(hubUploadNote, /does not compile the file into pack rules/i)
})

test('an upload keeps a label and drops file bytes', () => {
  const parsed = upload('upload.abc12345')
  assert.equal(parsed.label, 'Procurement manual')
  assert.equal(parsed.mediaType, 'application/pdf')
  assert.equal('bytes' in parsed, false)
  const rejected = parseHubUpload({
    id: 'upload.abc12345',
    fileName: 'notes.exe',
    byteLength: 10,
    contentHash: hash,
    uploadedAt,
  })
  assert.equal(rejected.ok, false)
  const huge = parseHubUpload({
    id: 'upload.abc12345',
    fileName: 'notes.pdf',
    byteLength: 8 * 1024 * 1024 + 1,
    contentHash: hash,
    uploadedAt,
  })
  assert.equal(huge.ok, false)
  if (!huge.ok) assert.match(huge.error, /8 MB/)
})

test('the library is scoped to one organisation and forgets foreign bytes', () => {
  const state = sanitizeHubLibrary({
    organizationId: 'org_trace_local',
    uploads: [{ ...upload('upload.abc12345'), bytes: 'secret-pdf-bytes' }],
    engagements: [{
      id: 'eng.abc12345',
      name: 'Kenya shelter kits',
      primaryPackId: 'global-fund',
      attachedUploadIds: ['upload.abc12345', 'upload.missing1'],
      createdAt: uploadedAt,
    }],
  }, 'org_trace_local')
  assert.equal(state.uploads.length, 1)
  assert.equal('bytes' in state.uploads[0], false)
  assert.equal(JSON.stringify(state).includes('secret-pdf-bytes'), false)
  assert.deepEqual(state.engagements[0].attachedUploadIds, ['upload.abc12345'])
  const other = sanitizeHubLibrary(state, 'org_other')
  assert.deepEqual(other, { organizationId: 'org_other', uploads: [], engagements: [] })
})

test('a tender keeps one seeded pack and only known manuals', () => {
  const manual = upload('upload.abc12345')
  const parsed = parseHubEngagement({
    id: 'eng.abc12345',
    name: '  Kenya shelter kits  ',
    primaryPackId: 'global-fund',
    attachedUploadIds: ['upload.abc12345', 'upload.notknown'],
    knownUploadIds: [manual.id],
    createdAt: uploadedAt,
  })
  assert.equal(parsed.ok, true)
  if (!parsed.ok) return
  assert.equal(parsed.engagement.name, 'Kenya shelter kits')
  assert.deepEqual(parsed.engagement.attachedUploadIds, ['upload.abc12345'])
  const missingPack = parseHubEngagement({
    id: 'eng.abc12345',
    name: 'Kenya shelter kits',
    primaryPackId: 'usaid',
    attachedUploadIds: [],
    knownUploadIds: [],
    createdAt: uploadedAt,
  })
  assert.equal(missingPack.ok, false)
  let library = { organizationId: 'org_trace_local', uploads: [manual], engagements: [] }
  const added = addHubUpload(library, manual)
  assert.equal(added, 'duplicate')
  library = { organizationId: 'org_trace_local', uploads: [], engagements: [] }
  for (let index = 0; index < HUB_UPLOAD_CAP; index += 1) {
    const next = addHubUpload(library, upload(`upload.${index.toString(16).padStart(8, 'a')}`, `file-${index}.txt`, `Note ${index}`))
    assert.notEqual(next, 'full')
    if (next === 'full' || next === 'duplicate') throw new Error('cap')
    library = next
  }
  const overflow = addHubUpload(library, upload('upload.bbbbbbbb', 'extra.txt', 'Extra'))
  assert.equal(overflow, 'full')
  const saved = addHubEngagement(
    { organizationId: 'org_trace_local', uploads: [manual], engagements: [] },
    parsed.engagement,
  )
  const context = deskTenderContext(saved, 'eng.abc12345')
  assert.equal(context?.name, 'Kenya shelter kits')
  assert.equal(context?.primaryPackId, 'global-fund')
  assert.equal(context?.uploads[0]?.label, 'Procurement manual')
  assert.equal(hubPackParam('global-fund'), 'global-fund')
  assert.equal(hubPackParam('usaid'), null)
  assert.equal(hubEngagementParam('eng.abc12345'), 'eng.abc12345')
  assert.equal(hubEngagementParam('eng.short'), null)
})

test('hub and desk copy keep uploads outside the freeze rules', () => {
  const hub = readFileSync(new URL('../../app/hub/page.tsx', import.meta.url), 'utf8')
  const uploads = readFileSync(new URL('../../app/hub/hub-uploads.tsx', import.meta.url), 'utf8')
  const tenderPage = readFileSync(new URL('../../app/hub/tender/page.tsx', import.meta.url), 'utf8')
  const tender = readFileSync(new URL('../../app/hub/tender/new-tender.tsx', import.meta.url), 'utf8')
  const path = readFileSync(new URL('../../app/hub/path.tsx', import.meta.url), 'utf8')
  const desk = readFileSync(new URL('../../app/desk/upload-desk.tsx', import.meta.url), 'utf8')
  const proxy = readFileSync(new URL('../../proxy.ts', import.meta.url), 'utf8')
  assert.match(hub, /hubSynthesisNote/)
  assert.match(hub, /Before the award/)
  assert.match(hub, /citeable golden thread/)
  assert.match(hub, /Start from a Trace-li pack/)
  assert.match(hub, /One pack drives the freeze/)
  assert.match(hub, /Start a tender/)
  assert.match(uploads, /Your manuals \(optional\)/)
  assert.match(uploads, /seeded pack alone/)
  assert.match(uploads, /not compiled into pack rules yet/)
  assert.match(uploads, /hubUploadNote/)
  assert.match(uploads, /Not a pack rule yet/)
  assert.match(uploads, /data-testid="hub-upload-honesty"/)
  assert.match(tenderPage, /One piece of work/)
  assert.match(tenderPage, /drive judgment/)
  assert.match(tender, /not evaluated as pack rules/)
  assert.match(tender, /A seeded pack alone is enough/)
  assert.match(tender, /Continue to award desk/)
  assert.match(path, /Golden thread/)
  assert.equal(path.includes("label: 'Freeze'"), false)
  assert.match(desk, /data-testid="tender-context"/)
  assert.match(desk, /data-testid="desk-cold-cue"/)
  assert.match(desk, /New here\?/)
  assert.match(desk, /Start in the Knowledge hub/)
  assert.match(desk, /Conditions in play · not evaluated/)
  assert.match(desk, /data-testid="golden-thread"/)
  assert.match(desk, /citeable pre-signature freeze/)
  assert.match(desk, /Humans dispose; Trace-li freezes the proof/)
  assert.match(desk, /name="procurementReference"/)
  assert.match(proxy, /isKnowledgeHubPage/)
  assert.equal(desk.includes('evaluateDonorPack'), false)
})
