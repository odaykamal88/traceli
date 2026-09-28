import assert from 'node:assert/strict'
import { test } from 'node:test'
import { guardedDestination } from '../../lib/tenders/unsaved-navigation.ts'

const here = 'https://app.example/work/fixture?view=review'
test('unsaved guard prompts only for an ordinary same-origin route change', () => {
  assert.equal(guardedDestination('/work', here), '/work')
  assert.equal(guardedDestination('/hub#packs', here), '/hub#packs')
  assert.equal(guardedDestination('?view=record', here), '/work/fixture?view=record')
  for (const href of ['#review', here, 'https://evil.example/work', '//evil.example', 'javascript:alert(1)', 'mailto:someone@example.com', 'http://app.example/work']) {
    assert.equal(guardedDestination(href, here), null)
  }
})
