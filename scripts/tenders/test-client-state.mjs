import assert from 'node:assert/strict'
import { test } from 'node:test'

import { sameManualVersions, sameReviewerDecision, sameReviewerDecisions } from '../../lib/tenders/client-state.ts'

test('reviewer decisions compare editable values across property and row order', () => {
  const sent = [
    { key: 'supplier.name', action: 'present', value: 'Example supplier', page: '2', quote: 'Supplier named here', note: '' },
    { key: 'supplier.sanctions', action: 'missing', value: '', page: '', quote: '', note: '' },
  ]
  const returned = [
    { note: '', quote: '', page: '', value: '', action: 'missing', key: 'supplier.sanctions' },
    { note: '', quote: 'Supplier named here', page: '2', value: 'Example supplier', action: 'present', key: 'supplier.name' },
  ]
  assert.equal(sameReviewerDecisions(sent, returned), true)
  assert.equal(sameReviewerDecisions(sent, returned.map(item => item.key === 'supplier.name' ? { ...item, page: '3' } : item)), false)
  assert.equal(sameReviewerDecisions([sent[0], sent[0]], sent), false)
  assert.equal(sameReviewerDecision(sent[0], { ...sent[0], quote: 'Different pointer' }), false)
  assert.equal(sameManualVersions(['manual-b', 'manual-a'], ['manual-a', 'manual-b']), true)
  assert.equal(sameManualVersions(['manual-b', 'manual-a'], ['manual-a', 'manual-c']), false)
})
