import test from 'node:test'
import assert from 'node:assert/strict'
import { clearPendingDraft, clearPendingDraftIfMatching, keepPendingDraft, readPendingDraft } from '../../lib/tenders/pending-draft.ts'
const scope = id => ({organizationId:'org-a', viewerId:'viewer-a', tenderId:id})
const value = {packetReceiptId:'packet-a', decisions:[{key:'row', action:'confirm', value:'', page:'', quote:'', note:''}], manualVersionIds:['manual-a'], expectedRevision:2}
test('pending edits are isolated by tenant, viewer and tender and copied defensively', () => {
 const key=scope('isolation'); keepPendingDraft(key,value,100)
 for (const changed of [{...key,organizationId:'org-b'},{...key,viewerId:'viewer-b'},{...key,tenderId:'other'}]) assert.equal(readPendingDraft(changed,101),null)
 const read=readPendingDraft(key,101); read.decisions[0].note='changed'; read.manualVersionIds.push('other')
 assert.deepEqual(readPendingDraft(key,102),value); clearPendingDraft(key)
})
test('pending edits expire at thirty minutes', () => {
 const key=scope('expires'); keepPendingDraft(key,value,100)
 assert.ok(readPendingDraft(key,100+30*60*1000-1)); assert.equal(readPendingDraft(key,100+30*60*1000),null)
})
test('cache holds at most eight drafts and explicit clear removes only the selected copy', () => {
 for(let i=0;i<9;i++) keepPendingDraft(scope(`bounded-${i}`),value,100+i)
 assert.equal(readPendingDraft(scope('bounded-0'),110),null)
 for(let i=1;i<9;i++) assert.ok(readPendingDraft(scope(`bounded-${i}`),110))
 clearPendingDraft(scope('bounded-8')); assert.equal(readPendingDraft(scope('bounded-8'),110),null); assert.ok(readPendingDraft(scope('bounded-7'),110))
 for(let i=1;i<9;i++) clearPendingDraft(scope(`bounded-${i}`))
})

test('a newer pending copy survives an older save acknowledgment', () => {
 const key=scope('save-race'); keepPendingDraft(key,value,100)
 const newer={...value, decisions:value.decisions.map(item => ({...item,note:'Newer unsaved edit'}))}
 keepPendingDraft(key,newer,101)
 assert.equal(clearPendingDraftIfMatching(key,value,102),false)
 assert.deepEqual(readPendingDraft(key,103),newer)
 assert.equal(clearPendingDraftIfMatching(key,newer,104),true)
 assert.equal(readPendingDraft(key,105),null)
})
