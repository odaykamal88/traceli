// Integration suite for fictional fixtures in a disposable loopback PostgreSQL database only.
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import pg from 'pg'
import { getDatabasePool } from '../../lib/db/client.ts'
import { TenderError } from '../../lib/tenders/contract.ts'
import {
  addManualVersion,
  createTender,
  downloadTenderReport,
  issueAssessment,
  issueJudgment,
  issuePacket,
  listTenders,
  readTender,
  readTenderRecord,
  saveDraft,
} from '../../lib/tenders/store.ts'

const databaseUrl = process.env.DATABASE_URL
let parsedUrl
try { parsedUrl = new URL(databaseUrl || 'invalid:') } catch { parsedUrl = new URL('invalid:') }
if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol)
  || !['127.0.0.1', 'localhost', '[::1]'].includes(parsedUrl.hostname)
  || parsedUrl.search || parsedUrl.hash
  || process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  throw new Error('Tender integration tests require an isolated nonproduction loopback PostgreSQL database.')
}

const pool = new pg.Pool({ connectionString: databaseUrl, max: 5 })
const run = randomUUID().replaceAll('-', '')
const org = `org_tender_test_${run}`
const otherOrg = `org_tender_other_${run}`
const director = { id: `tender-director-${run}`, name: 'Fictional director', email: 'director@example.invalid', organizationId: org, role: 'Procurement Director', mode: 'demo' }
const officer = { ...director, id: `tender-officer-${run}`, role: 'Procurement Officer' }
const panel = { ...director, id: `tender-panel-${run}`, role: 'Panel Member' }
const panelReviewer = { ...director, id: `tender-panel-reviewer-${run}`, role: 'Panel Member' }
const auditor = { ...director, id: `tender-auditor-${run}`, role: 'Auditor' }
  const outsider = { ...director, organizationId: otherOrg }
  let officerOwnId
  let secondPacketId
  let secondDraftId
  let secondAssessmentId
let checks = 0
async function check(name, fn) { await fn(); checks++; console.log(`PASS ${name}`) }
function tenderError(code, status) {
  return error => error instanceof TenderError && error.code === code && (status === undefined || error.status === status)
}
function invalidInput(error) {
  return error instanceof TenderError && error.status === 400 || error?.name === 'ZodError'
}
function errorChainIncludes(error, needle) {
  const seen = new Set()
  for (let current = error; current && !seen.has(current); current = current.cause) {
    seen.add(current)
    if (String(current.message ?? '').includes(needle)) return true
  }
  return false
}
function key(label) { return `${label}-${randomUUID()}` }
function bytes(text) { return new TextEncoder().encode(text) }
function sha256(value) { return createHash('sha256').update(value).digest('hex') }
async function inTenant(organizationId, fn) {
  const client = await pool.connect()
  try {
    await client.query('begin')
    await client.query('set local role traceli_app')
    await client.query("select set_config('app.organization_id',$1,true)", [organizationId])
    const value = await fn(client)
    await client.query('commit')
    return value
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally { client.release() }
}
async function seedAccess(tenderId, viewer, access) {
  await pool.query('insert into tender_access (organization_id, procurement_id, user_id, access, granted_by) values ($1,$2,$3,$4,$5)', [org, tenderId, viewer.id, access, director.id])
}
async function create(viewer, title, idempotencyKey = key('create')) {
  return createTender(viewer, { title, primaryPackId: 'global-fund', idempotencyKey })
}
async function total(table, column, value) {
  const result = await pool.query(`select count(*)::int as count from ${table} where ${column}=$1`, [value])
  return result.rows[0].count
}

try {
  await pool.query('insert into organizations(id,name) values($1,$3),($2,$3)', [org, otherOrg, 'Disposable fictional tender integration organization'])
  const first = await create(director, 'Synthetic tender A')
  const firstId = first.tender.id
  const second = await create(director, 'Synthetic tender B')
  const secondId = second.tender.id

  await check('create replay returns the original tender; changed input or actor conflicts', async () => {
    const idempotencyKey = key('create-replay')
    const created = await create(director, 'Idempotency fixture', idempotencyKey)
    assert.equal((await create(director, 'Idempotency fixture', idempotencyKey)).tender.id, created.tender.id)
    await assert.rejects(create(director, 'Altered title', idempotencyKey), tenderError('idempotency_conflict', 409))
    await assert.rejects(create({ ...director, id: `${director.id}-other` }, 'Idempotency fixture', idempotencyKey), tenderError('idempotency_conflict', 409))
  })

  await check('organization and tender grants scope every read and write', async () => {
    await seedAccess(firstId, officer, 'review')
    await seedAccess(firstId, panel, 'read')
    await seedAccess(firstId, panelReviewer, 'review')
    await seedAccess(firstId, auditor, 'read')
    assert.equal((await readTender(officer, firstId)).tender.id, firstId)
    await assert.rejects(readTender(officer, secondId), tenderError('unavailable', 404))
    await assert.rejects(readTender(outsider, firstId), tenderError('unavailable', 404))
    assert.equal((await readTender(auditor, firstId)).capabilities.canEdit, false)
    await assert.rejects(issuePacket(auditor, firstId, { fileName: 'fixture.txt', mediaType: 'text/plain', bytes: bytes('synthetic'), classification: 'synthetic', expectedRevision: 0, idempotencyKey: key('auditor-write') }), tenderError('forbidden', 403))
    await assert.rejects(issuePacket(panel, firstId, { fileName: 'fixture.txt', mediaType: 'text/plain', bytes: bytes('synthetic'), classification: 'synthetic', expectedRevision: 0, idempotencyKey: key('read-only-write') }), tenderError('forbidden', 403))
    const reviewerDetail = await readTender(panelReviewer, firstId)
    assert.equal(reviewerDetail.capabilities.canEdit, true)
    assert.equal(reviewerDetail.capabilities.canAssess, false)
    await assert.rejects(issueAssessment(panelReviewer, firstId, { expectedRevision: 0, idempotencyKey: key('panel-assess') }), tenderError('forbidden', 403))
    await assert.rejects(create(auditor, 'Auditor cannot create'), tenderError('forbidden', 403))
    assert.equal((await readTender(director, secondId)).tender.id, secondId)
    const own = await create(officer, 'Officer-owned synthetic tender')
    officerOwnId = own.tender.id
    await pool.query('delete from tender_access where organization_id=$1 and procurement_id=$2 and user_id=$3', [org, officerOwnId, officer.id])
    assert.equal((await readTender(officer, officerOwnId)).tender.id, officerOwnId)
    await assert.rejects(issuePacket(officer, officerOwnId, { fileName: 'fixture.txt', mediaType: 'text/plain', bytes: bytes('synthetic'), classification: 'synthetic', expectedRevision: 0, idempotencyKey: key('revoked-owner-write') }), tenderError('forbidden', 403))
  })

  await check('authorized list pagination skips newer unassigned tenders before filling the page', async () => {
    for (let index = 0; index < 4; index++) await create(director, `Unassigned recent tender ${index}`)
    const page = await listTenders(officer, { limit: 1 })
    assert.equal(page.items.length, 1)
    assert.equal(page.items[0].id, officerOwnId)
  })

  const secret = 'TENDER_SOURCE_SECRET_SENTINEL_MUST_NOT_BE_RETAINED'
  const source = bytes(secret)
  const packet = await issuePacket(director, firstId, {
    fileName: 'fictional-annex.txt', mediaType: 'text/plain', bytes: source, classification: 'synthetic',
    expectedRevision: 0, idempotencyKey: key('packet'),
  })

  await check('packet receipt retains server hash and bounded extraction, never source bytes', async () => {
    assert.equal(packet.sourceSha256, sha256(source))
    assert.equal(packet.checklist.sourceFileHash, packet.sourceSha256)
    const stored = await pool.query('select payload::text as payload, pack_definition::text as pack, source_sha256 from tender_packet_receipts where id=$1', [packet.receiptId])
    assert.equal(stored.rows[0].source_sha256, sha256(source))
    assert.equal(`${stored.rows[0].payload}${stored.rows[0].pack}`.includes(secret), false)
    await assert.rejects(issuePacket(director, firstId, {
      fileName: 'customer.txt', mediaType: 'text/plain', bytes: source, classification: 'customer',
      expectedRevision: 0, idempotencyKey: key('customer-packet'),
    }), tenderError('retention_gate', 403))
  })

  const rows = packet.checklist.rows
  assert.ok(rows.length >= 2, 'fixture pack must provide rows for missing/negative round-trip')
  const missingDecision = { key: rows[0].key, action: 'missing', value: '', page: '', quote: '', note: '' }
  const incompleteNegative = { key: rows[1].key, action: 'negative', value: '', page: '', quote: '', note: '' }
  const incompleteDraftInput = {
    packetReceiptId: packet.receiptId,
    decisions: [missingDecision, incompleteNegative],
    manualVersionIds: [],
    expectedRevision: 0,
    idempotencyKey: key('draft-incomplete'),
  }
  const incomplete = await saveDraft(director, firstId, incompleteDraftInput)

  await check('incomplete correction round-trips with no reviewed hash and cannot be assessed', async () => {
    assert.equal(incomplete.draft.reviewedSnapshotHash, null)
    const reloaded = await readTender(director, firstId)
    assert.equal(reloaded.draft.reviewedSnapshotHash, null)
    assert.equal(reloaded.draft.decisions.find(item => item.key === rows[1].key)?.action, 'negative')
    await assert.rejects(issueAssessment(director, firstId, { expectedRevision: reloaded.revision, idempotencyKey: key('assessment-incomplete') }), tenderError('incomplete_draft', 400))
  })

  const negativeDecision = { ...incompleteNegative, page: '2', note: 'Fictional packet does not support this item.' }
  const initialDraftInput = {
    packetReceiptId: packet.receiptId,
    decisions: [missingDecision, negativeDecision],
    manualVersionIds: [],
    expectedRevision: incomplete.revision,
    idempotencyKey: key('draft-complete'),
  }
  const saved = await saveDraft(director, firstId, initialDraftInput)

  await check('persisted draft keeps missing distinct from explicit negative', async () => {
    const reloaded = await readTender(director, firstId)
    const byKey = new Map(reloaded.draft.decisions.map(item => [item.key, item.action]))
    assert.equal(byKey.get(rows[0].key), 'missing')
    assert.equal(byKey.get(rows[1].key), 'negative')
    assert.ok(reloaded.draft.reviewedSnapshotHash)
    assert.notEqual(reloaded.draft.reviewedSnapshotHash, packet.checklist.snapshotHash)
    assert.equal(reloaded.revision, saved.revision)
  })

  await check('strict draft rejects client-supplied actor, tenant, or provenance', async () => {
    for (const field of ['organizationId', 'actorId', 'sourceSha256', 'packVersion', 'snapshotHash']) {
      await assert.rejects(saveDraft(director, firstId, { ...initialDraftInput, idempotencyKey: key('tamper'), [field]: 'forged' }), invalidInput)
    }
    await assert.rejects(saveDraft(director, firstId, {
      ...initialDraftInput, idempotencyKey: key('tamper-row'),
      decisions: [{ ...missingDecision, reviewedBy: 'forged-user', provenance: { sourceId: 'foreign' } }],
    }), invalidInput)
  })

  let replayCommand
  await check('same-command replay is stable; modified input and changed actor conflict', async () => {
    const replayKey = key('draft-replay')
    replayCommand = { ...initialDraftInput, idempotencyKey: replayKey, expectedRevision: saved.revision }
    const firstReplay = await saveDraft(director, firstId, replayCommand)
    const repeated = await saveDraft(director, firstId, replayCommand)
    assert.equal(repeated.draft.id, firstReplay.draft.id)
    await assert.rejects(saveDraft(director, firstId, { ...replayCommand, decisions: [] }), tenderError('idempotency_conflict', 409))
    await assert.rejects(saveDraft(officer, firstId, replayCommand), tenderError('idempotency_conflict', 409))
  })

  await check('same-revision parallel saves serialize with one winner', async () => {
    const current = await readTender(director, firstId)
    const make = suffix => saveDraft(director, firstId, {
      packetReceiptId: packet.receiptId, decisions: current.draft.decisions,
      manualVersionIds: [], expectedRevision: current.revision, idempotencyKey: key(`parallel-${suffix}`),
    })
    const outcomes = await Promise.allSettled([make('a'), make('b')])
    assert.equal(outcomes.filter(item => item.status === 'fulfilled').length, 1)
    const rejected = outcomes.find(item => item.status === 'rejected')
    assert.ok(rejected)
    assert.equal(rejected.reason instanceof TenderError, true)
    assert.equal(rejected.reason.status, 409)
    assert.equal(rejected.reason.latestRevision, current.revision + 1)
    const after = await readTender(director, firstId)
    assert.equal(after.revision, current.revision + 1)
  })

  await check('stale expected revision cannot overwrite the saved draft', async () => {
    const current = await readTender(director, firstId)
    await assert.rejects(saveDraft(director, firstId, {
      packetReceiptId: packet.receiptId, decisions: [], manualVersionIds: [],
      expectedRevision: current.revision - 1, idempotencyKey: key('stale'),
    }), error => error instanceof TenderError && error.status === 409 && error.latestRevision === current.revision)
    assert.equal((await readTender(director, firstId)).revision, current.revision)
  })

  await check('old idempotent retry after a newer save does not roll the tender cursor back', async () => {
    const latest = await readTender(director, firstId)
    await assert.rejects(saveDraft(director, firstId, replayCommand), error => error instanceof TenderError && error.code === 'stale_revision' && error.latestRevision === latest.revision)
    assert.equal((await readTender(director, firstId)).draft.id, latest.draft.id)
  })

  const secondManual = await addManualVersion(director, secondId, {
    fileName: 'fictional-manual.txt', mediaType: 'text/plain', bytes: source, label: 'Fictional manual',
    expectedRevision: 0, idempotencyKey: key('manual'),
  })
  await check('manual metadata is immutable, server-hashed, and cannot cross-link tenders', async () => {
    assert.equal(secondManual.hashKind, 'server_verified_upload')
    assert.equal(secondManual.sha256, sha256(source))
    assert.equal(await total('tender_manual_versions', 'id', secondManual.id), 1)
    await assert.rejects(saveDraft(director, firstId, {
      packetReceiptId: packet.receiptId, decisions: [], manualVersionIds: [secondManual.id],
      expectedRevision: (await readTender(director, firstId)).revision, idempotencyKey: key('cross-manual'),
    }), error => error instanceof TenderError && [400, 404].includes(error.status))
    await assert.rejects(inTenant(org, client => client.query('insert into tender_draft_manuals (organization_id,procurement_id,draft_id,manual_version_id) values($1,$2,$3,$4)', [org, firstId, saved.draft.id, secondManual.id])), /foreign key/)
    await assert.rejects(inTenant(org, client => client.query('update tender_manual_versions set label=label where id=$1', [secondManual.id])), /permission denied|immutable/)
    await assert.rejects(inTenant(org, client => client.query('delete from tender_manual_versions where id=$1', [secondManual.id])), /permission denied|immutable/)
  })

  const beforeAssessment = await readTender(director, firstId)
  const assessment = await issueAssessment(director, firstId, { expectedRevision: beforeAssessment.revision, idempotencyKey: key('assessment') })

  await check('assessment is server-issued with server-controlled lineage', async () => {
    const stored = await readTenderRecord(director, firstId, assessment.id)
    assert.equal(stored.payload.recordId, assessment.id)
    assert.equal(stored.payloadHash, assessment.payloadHash)
  })

  const cleanAssessment = assessment
  const judgmentInput = {
    expectedRevision: (await readTender(director, firstId)).revision,
    assessmentId: cleanAssessment.id,
    assessmentHash: cleanAssessment.payloadHash,
    action: 'request',
    reason: 'Fictional reviewer requests one additional source before deciding.',
    idempotencyKey: key('judgment'),
  }
  const judgment = await issueJudgment(director, firstId, judgmentInput)

  await check('judgment binds to exact server assessment; mismatch and exception remain bounded', async () => {
    assert.equal(judgment.parentRecordId, cleanAssessment.id)
    await assert.rejects(issueJudgment(director, firstId, { ...judgmentInput, assessmentHash: 'a'.repeat(64), idempotencyKey: key('judgment-mismatch') }), error => error instanceof TenderError && [400, 409].includes(error.status))
    const secondPacket = await issuePacket(director, secondId, {
      fileName: 'fictional-annex-b.txt', mediaType: 'text/plain', bytes: source, classification: 'synthetic',
      expectedRevision: 0, idempotencyKey: key('packet-b'),
    })
    secondPacketId = secondPacket.receiptId
    const secondDraft = await saveDraft(director, secondId, {
      packetReceiptId: secondPacket.receiptId, decisions: [], manualVersionIds: [],
      expectedRevision: 0, idempotencyKey: key('draft-b'),
    })
    secondDraftId = secondDraft.draft.id
    const secondAssessment = await issueAssessment(director, secondId, { expectedRevision: secondDraft.revision, idempotencyKey: key('assessment-b') })
    secondAssessmentId = secondAssessment.id
    const proposed = await issueJudgment(director, secondId, {
      expectedRevision: (await readTender(director, secondId)).revision, assessmentId: secondAssessment.id,
      assessmentHash: secondAssessment.payloadHash, action: 'exception',
      reason: 'Fictional exception proposal; approval authority has not been recorded.', idempotencyKey: key('exception'),
    })
    assert.equal(proposed.kind, 'exception_proposal')
    assert.equal(proposed.payload.status, 'approval_not_recorded')
  })

  await check('list progress follows current retained state, roles and exact record lineage', async () => {
    const fixture=await create(director, 'Synthetic progress fixture')
    const tenderId=fixture.tender.id
    await seedAccess(tenderId, auditor, 'read')
    await seedAccess(tenderId, panelReviewer, 'review')
    const summaryFor=async viewer=>{
      const page=await listTenders(viewer,{limit:50})
      const item=page.items.find(item=>item.id===tenderId)
      assert.ok(item)
      assert.deepEqual(item.progress,(await readTender(viewer,tenderId)).tender.progress)
      return item
    }
    let summary=await summaryFor(director)
    assert.equal(summary.owner.label,'You')
    assert.equal(summary.progress.status,'No packet retained')
    assert.equal(summary.progress.nextAction,'Add a synthetic fixture packet')
    const readSummary=await summaryFor(auditor)
    assert.match(readSummary.owner.label,/^Member [a-f0-9]{8}$/)
    assert.equal(readSummary.owner.id,director.id)
    assert.equal(readSummary.owner.isCurrentUser,false)
    assert.equal(readSummary.progress.nextAction,'View evidence')
    const receipt=await issuePacket(director,tenderId,{fileName:'progress-fixture.txt',mediaType:'text/plain',bytes:source,classification:'synthetic',expectedRevision:0,idempotencyKey:key('progress-packet')})
    assert.equal((await summaryFor(director)).progress.status,'Packet retained · review not saved')
    assert.equal((await summaryFor(auditor)).progress.nextAction,'View packet checklist')
    const correction={key:receipt.checklist.rows[0].key,action:'negative',value:'',page:'',quote:'',note:''}
    const incomplete=await saveDraft(director,tenderId,{packetReceiptId:receipt.receiptId,decisions:[correction],manualVersionIds:[],expectedRevision:0,idempotencyKey:key('progress-incomplete')})
    assert.equal((await summaryFor(director)).progress.status,'Saved review has incomplete corrections')
    assert.equal((await summaryFor(auditor)).progress.nextAction,'View checklist corrections')
    const missing={...correction,action:'missing'}
    const reviewed=await saveDraft(director,tenderId,{packetReceiptId:receipt.receiptId,decisions:[missing],manualVersionIds:[],expectedRevision:incomplete.revision,idempotencyKey:key('progress-ready')})
    assert.equal((await summaryFor(director)).progress.status,'Saved review ready for assessment')
    assert.equal((await summaryFor(panelReviewer)).progress.nextAction,'View saved review')
    const issued=await issueAssessment(director,tenderId,{expectedRevision:reviewed.revision,idempotencyKey:key('progress-assessment')})
    summary=await summaryFor(director)
    assert.equal(summary.progress.status,'Assessment issued · human decision needed')
    assert.equal(summary.latestRecordKind,'assessment')
    assert.equal((await summaryFor(auditor)).progress.nextAction,'View assessment')
    const decision=await issueJudgment(director,tenderId,{expectedRevision:reviewed.revision,assessmentId:issued.id,assessmentHash:issued.payloadHash,action:'request',reason:'Synthetic review requests another source before the next decision.',idempotencyKey:key('progress-decision')})
    assert.equal((await summaryFor(director)).progress.status,'Human decision recorded')
    const later=await saveDraft(director,tenderId,{packetReceiptId:receipt.receiptId,decisions:[missing],manualVersionIds:[],expectedRevision:reviewed.revision,idempotencyKey:key('progress-later')})
    summary=await summaryFor(director)
    assert.equal(summary.progress.status,'Saved review ready for assessment')
    assert.equal(summary.latestRecordKind,null)
    assert.ok(later.records.some(row=>row.id===decision.id))
    // Same-tender foreign keys alone cannot establish currentness after a later draft.
    await pool.query('update tender_workspaces set current_assessment_id=$1,current_judgment_id=$2 where organization_id=$3 and procurement_id=$4',[issued.id,decision.id,org,tenderId])
    try {
      await assert.rejects(listTenders(director,{limit:50}),tenderError('integrity',500))
      await assert.rejects(readTender(director,tenderId),tenderError('integrity',500))
    } finally {
      await pool.query('update tender_workspaces set current_assessment_id=NULL,current_judgment_id=NULL where organization_id=$1 and procurement_id=$2',[org,tenderId])
    }
    const laterAssessment=await issueAssessment(director,tenderId,{expectedRevision:later.revision,idempotencyKey:key('progress-assessment-later')})
    await issueJudgment(director,tenderId,{expectedRevision:later.revision,assessmentId:laterAssessment.id,assessmentHash:laterAssessment.payloadHash,action:'exception',reason:'Synthetic proposal awaits separately recorded approval authority.',idempotencyKey:key('progress-exception')})
    summary=await summaryFor(director)
    assert.equal(summary.progress.status,'Exception proposed · approval not recorded')
    assert.equal(summary.latestRecordKind,'exception_proposal')
    assert.equal(summary.progress.nextAction,'View exception proposal')
  })

  await check('same-organization cross-tender receipt, draft, issued-record, and cursor links fail closed', async () => {
    const current = await readTender(director, firstId)
    await assert.rejects(saveDraft(director, firstId, {
      packetReceiptId: secondPacketId, decisions: [], manualVersionIds: [],
      expectedRevision: current.revision, idempotencyKey: key('cross-packet'),
    }), tenderError('invalid_link', 400))
    await assert.rejects(inTenant(org, client => client.query(
      'insert into tender_draft_revisions (id,organization_id,procurement_id,revision,parent_draft_id,packet_receipt_id,payload,payload_hash,actor_id) values($1,$2,$3,98,NULL,$4,$5,$6,$7)',
      [randomUUID(), org, firstId, secondPacketId, {}, 'a'.repeat(64), director.id],
    )), /foreign key/)
    await assert.rejects(inTenant(org, client => client.query(
      "insert into tender_issued_records (id,organization_id,procurement_id,kind,draft_id,parent_record_id,payload,snapshot_hash,packs_hash,payload_hash,issued_by) values($1,$2,$3,'human_judgment',$4,$5,$6,$7,$8,$9,$10)",
      [randomUUID(), org, firstId, saved.draft.id, secondAssessmentId, {}, 'a'.repeat(64), 'b'.repeat(64), 'c'.repeat(64), director.id],
    )), /foreign key/)
    await assert.rejects(inTenant(org, client => client.query(
      'update tender_workspaces set current_draft_id=$1 where organization_id=$2 and procurement_id=$3',
      [secondDraftId, org, firstId],
    )), /foreign key/)
    await assert.rejects(inTenant(org, client => client.query(
      'update tender_workspaces set current_assessment_id=$1 where organization_id=$2 and procurement_id=$3',
      [secondAssessmentId, org, firstId],
    )), /foreign key/)
  })

  await check('PDF export uses only an authorized server record id and stores its byte hash', async () => {
    const report = await downloadTenderReport(director, firstId, judgment.id)
    assert.ok(report.bytes.length > 0)
    const digest = sha256(report.bytes)
    const receipts = await pool.query('select pdf_sha256 from tender_export_receipts where organization_id=$1 and procurement_id=$2 and record_id=$3 order by exported_at desc limit 1', [org, firstId, judgment.id])
    assert.equal(receipts.rows[0]?.pdf_sha256, digest)
    const unassigned = { ...director, id: `tender-unassigned-${run}`, role: 'Procurement Officer' }
    await assert.rejects(downloadTenderReport(unassigned, firstId, judgment.id), tenderError('unavailable', 404))
    // The route accepts only path IDs; extra browser state is not part of its interface.
    const repeated = await downloadTenderReport(director, firstId, judgment.id, { payload: { forged: true } })
    assert.equal(sha256(repeated.bytes), digest)
  })

  await check('append-only draft, receipt, record, command, and export tables reject mutation', async () => {
    const immutable = ['tender_packet_receipts', 'tender_draft_revisions', 'tender_draft_manuals', 'tender_issued_records', 'tender_commands', 'tender_export_receipts']
    for (const table of immutable) {
      await assert.rejects(inTenant(org, client => client.query(`update ${table} set organization_id=organization_id where organization_id=$1`, [org])), /permission denied|immutable/)
      await assert.rejects(inTenant(org, client => client.query(`delete from ${table} where organization_id=$1`, [org])), /permission denied|immutable/)
    }
  })

  await check('detail retains the current draft packet and manuals beyond the bounded 50-row summaries', async () => {
    const history = await create(director, 'Synthetic bounded-history fixture')
    const historyId = history.tender.id
    const pinnedPacket = await issuePacket(director, historyId, {
      fileName: 'pinned-history-packet.txt', mediaType: 'text/plain', bytes: source, classification: 'synthetic',
      expectedRevision: 0, idempotencyKey: key('history-packet-pinned'),
    })
    const pinnedManual = await addManualVersion(director, historyId, {
      fileName: 'pinned-history-manual.txt', mediaType: 'text/plain', bytes: source,
      expectedRevision: 0, idempotencyKey: key('history-manual-pinned'),
    })
    await saveDraft(director, historyId, {
      packetReceiptId: pinnedPacket.receiptId, decisions: [], manualVersionIds: [pinnedManual.id],
      expectedRevision: 0, idempotencyKey: key('history-draft'),
    })
    for (let index = 0; index < 51; index++) {
      await issuePacket(director, historyId, {
        fileName: `later-packet-${index}.txt`, mediaType: 'text/plain', bytes: source, classification: 'synthetic',
        expectedRevision: 1, idempotencyKey: key(`history-packet-${index}`),
      })
      await addManualVersion(director, historyId, {
        fileName: `later-manual-${index}.txt`, mediaType: 'text/plain', bytes: source,
        expectedRevision: 1, idempotencyKey: key(`history-manual-${index}`),
      })
    }
    const detail = await readTender(director, historyId)
    assert.ok(detail.packets.length <= 51)
    assert.ok(detail.packets.some(item => item.receiptId === pinnedPacket.receiptId))
    assert.ok(detail.manuals.length <= 51)
    assert.ok(detail.manuals.some(item => item.id === pinnedManual.id))
    assert.equal(detail.draft.packetReceiptId, pinnedPacket.receiptId)
    assert.deepEqual(detail.draft.manualVersionIds, [pinnedManual.id])
  })

  await check('tampered retained source, pack, actor, or assessment payload fails integrity verification', async () => {
    const packetRow = await pool.query('select source_sha256, pack_definition_hash from tender_packet_receipts where id=$1', [packet.receiptId])
    await pool.query('alter table tender_packet_receipts disable trigger tender_no_mutation')
    try {
      await pool.query("update tender_packet_receipts set source_sha256=$2 where id=$1", [packet.receiptId, 'b'.repeat(64)])
    } finally { await pool.query('alter table tender_packet_receipts enable trigger tender_no_mutation') }
    await assert.rejects(readTender(director, firstId), tenderError('integrity', 500))
    await assert.rejects(listTenders(director, { limit: 50 }), tenderError('integrity', 500))
    await pool.query('alter table tender_packet_receipts disable trigger tender_no_mutation')
    try {
      await pool.query('update tender_packet_receipts set source_sha256=$2 where id=$1', [packet.receiptId, packetRow.rows[0].source_sha256])
      await pool.query("update tender_packet_receipts set pack_definition_hash=$2 where id=$1", [packet.receiptId, 'c'.repeat(64)])
    } finally { await pool.query('alter table tender_packet_receipts enable trigger tender_no_mutation') }
    await assert.rejects(readTender(director, firstId), tenderError('integrity', 500))
    await assert.rejects(listTenders(director, { limit: 50 }), tenderError('integrity', 500))
    await pool.query('alter table tender_packet_receipts disable trigger tender_no_mutation')
    try {
      await pool.query('update tender_packet_receipts set pack_definition_hash=$2 where id=$1', [packet.receiptId, packetRow.rows[0].pack_definition_hash])
    } finally { await pool.query('alter table tender_packet_receipts enable trigger tender_no_mutation') }

    const issuedRow = await pool.query('select issued_by from tender_issued_records where id=$1', [assessment.id])
    await pool.query('alter table tender_issued_records disable trigger tender_no_mutation')
    try {
      await pool.query('update tender_issued_records set issued_by=$2 where id=$1', [assessment.id, 'forged-actor'])
    } finally { await pool.query('alter table tender_issued_records enable trigger tender_no_mutation') }
    await assert.rejects(readTenderRecord(director, firstId, assessment.id), tenderError('integrity', 500))
    await pool.query('alter table tender_issued_records disable trigger tender_no_mutation')
    try {
      await pool.query('update tender_issued_records set issued_by=$2 where id=$1', [assessment.id, issuedRow.rows[0].issued_by])
    } finally { await pool.query('alter table tender_issued_records enable trigger tender_no_mutation') }

    await pool.query('alter table tender_issued_records disable trigger tender_no_mutation')
    try {
      await pool.query("update tender_issued_records set payload=jsonb_set(payload,'{tamperMarker}','\"forged\"'::jsonb) where id=$1", [assessment.id])
    } finally { await pool.query('alter table tender_issued_records enable trigger tender_no_mutation') }
    await assert.rejects(readTenderRecord(director, firstId, assessment.id), tenderError('integrity', 500))
  })

  await check('failure after command insert rolls back draft and assessment rows, cursor, audit, and command', async () => {
    const rollbackTender = await create(director, 'Synthetic transaction rollback tender')
    const rollbackId = rollbackTender.tender.id
    const rollbackPacket = await issuePacket(director, rollbackId, {
      fileName: 'rollback-packet.txt', mediaType: 'text/plain', bytes: source, classification: 'synthetic',
      expectedRevision: 0, idempotencyKey: key('rollback-packet'),
    })
    const draftKey = key('rollback-draft')
    const triggerFunction = `tender_command_fail_${run}`
    const triggerName = `tender_command_fail_${run}`
    await pool.query(`create function ${triggerFunction}() returns trigger language plpgsql as $$ begin if NEW.action in ('draft','assessment') then raise exception 'Synthetic tender command rollback'; end if; return NEW; end $$`)
    await pool.query(`create trigger ${triggerName} after insert on tender_commands for each row execute function ${triggerFunction}()`)
    try {
      await assert.rejects(saveDraft(director, rollbackId, {
        packetReceiptId: rollbackPacket.receiptId, decisions: [], manualVersionIds: [], expectedRevision: 0, idempotencyKey: draftKey,
      }), error => errorChainIncludes(error, 'Synthetic tender command rollback'))
      const unchanged = await readTender(director, rollbackId)
      assert.equal(unchanged.revision, 0)
      assert.equal(unchanged.draft, null)
      assert.equal(await total('tender_draft_revisions', 'procurement_id', rollbackId), 0)
      assert.equal(await total('tender_commands', 'idempotency_key', draftKey), 0)
      assert.equal((await pool.query('select count(*)::int as count from audit_events where procurement_id=$1 and event_type=$2', [rollbackId, 'tender.draft_saved'])).rows[0].count, 0)
    } finally {
      await pool.query(`drop trigger ${triggerName} on tender_commands`)
      await pool.query(`drop function ${triggerFunction}()`)
    }
    const committedDraft = await saveDraft(director, rollbackId, {
      packetReceiptId: rollbackPacket.receiptId, decisions: [], manualVersionIds: [], expectedRevision: 0, idempotencyKey: draftKey,
    })
    const assessmentKey = key('rollback-assessment')
    const assessmentFunction = `tender_assess_fail_${run}`
    const assessmentTrigger = `tender_assess_fail_${run}`
    await pool.query(`create function ${assessmentFunction}() returns trigger language plpgsql as $$ begin if NEW.action='assessment' then raise exception 'Synthetic assessment command rollback'; end if; return NEW; end $$`)
    await pool.query(`create trigger ${assessmentTrigger} after insert on tender_commands for each row execute function ${assessmentFunction}()`)
    try {
      await assert.rejects(issueAssessment(director, rollbackId, { expectedRevision: committedDraft.revision, idempotencyKey: assessmentKey }), error => errorChainIncludes(error, 'Synthetic assessment command rollback'))
      const workspace = await pool.query('select current_assessment_id from tender_workspaces where organization_id=$1 and procurement_id=$2', [org, rollbackId])
      assert.equal(workspace.rows[0].current_assessment_id, null)
      assert.equal(await total('tender_issued_records', 'procurement_id', rollbackId), 0)
      assert.equal(await total('tender_commands', 'idempotency_key', assessmentKey), 0)
      assert.equal((await pool.query('select count(*)::int as count from audit_events where procurement_id=$1 and event_type=$2', [rollbackId, 'tender.assessment_issued'])).rows[0].count, 0)
    } finally {
      await pool.query(`drop trigger ${assessmentTrigger} on tender_commands`)
      await pool.query(`drop function ${assessmentFunction}()`)
    }
    assert.equal((await issueAssessment(director, rollbackId, { expectedRevision: committedDraft.revision, idempotencyKey: assessmentKey })).kind, 'assessment')
  })

  await check('audit failure rolls create, tender, audit, and idempotency receipt back together', async () => {
    const rollbackActor = `rollback-${run}`
    const triggerName = `tender_test_fail_${run}`
    await pool.query(`create function ${triggerName}() returns trigger language plpgsql as $$ begin if NEW.actor_id = '${rollbackActor}' then raise exception 'Synthetic tender audit rollback'; end if; return NEW; end $$`)
    await pool.query(`create trigger ${triggerName} before insert on audit_events for each row execute function ${triggerName}()`)
    const actor = { ...director, id: rollbackActor }
    const idempotencyKey = key('rollback')
    const before = await total('procurements', 'organization_id', org)
    try {
      await assert.rejects(create(actor, 'Rollback fixture', idempotencyKey), error => errorChainIncludes(error, 'Synthetic tender audit rollback'))
      assert.equal(await total('procurements', 'organization_id', org), before)
      assert.equal(await total('tender_commands', 'idempotency_key', idempotencyKey), 0)
      assert.equal(await total('tender_workspaces', 'owner_id', rollbackActor), 0)
    } finally {
      await pool.query(`drop trigger ${triggerName} on audit_events`)
      await pool.query(`drop function ${triggerName}()`)
    }
    assert.ok((await create(actor, 'Rollback fixture', idempotencyKey)).tender.id)
  })

  console.log(`Tender PostgreSQL integration: ${checks} checks passed; synthetic fixtures retained for disposable-DB inspection.`)
} finally {
  await pool.end()
  await getDatabasePool().end()
}
