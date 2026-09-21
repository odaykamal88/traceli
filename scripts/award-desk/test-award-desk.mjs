import assert from 'node:assert/strict'
import test from 'node:test'
import {
  agentDraftReason,
  awardDeskDecisions,
  awardDeskHeroCopy,
  awardDeskScenario,
  awardDeskSlug,
  decisionCopy,
  defaultAwardDeskDisposition,
  sanitizeDisposition,
} from '../../lib/award-desk.ts'

test('Award desk is a single fictional reconstruction, not a method chooser', () => {
  assert.equal(awardDeskScenario.fictional, true)
  assert.equal(awardDeskScenario.realDecisionEligible, false)
  assert.equal(awardDeskScenario.classification, 'synthetic')
  assert.equal(awardDeskSlug, 'rfp-2026-041')
  assert.equal(awardDeskScenario.rfp, 'RFP-2026-041')
  assert.equal(awardDeskScenario.supplier, 'Northstar Relief')
  assert.match(awardDeskScenario.disclaimer, /Public demo · Fictional data/)
  assert.equal(awardDeskScenario.packet.linked, 23)
  assert.equal(awardDeskScenario.packet.total, 27)
  assert.equal(awardDeskScenario.timeline.length, 4)
  assert.ok(awardDeskScenario.timeline.some(item => item.gap))
  assert.deepEqual(awardDeskDecisions.map(item => item.id), ['request', 'exception', 'escalate'])
})

test('hero-path copy keeps hashes and model probabilities off the Award desk', () => {
  const hero = awardDeskHeroCopy()
  assert.doesNotMatch(hero, /SHA-?256/i)
  assert.doesNotMatch(hero, /classic vs interactive|interactive sandbox|5\/5\/90|probability/i)
  assert.doesNotMatch(JSON.stringify(awardDeskScenario), /ANAO|GF Togo|UNMISS|OLAF|World Bank/)
  assert.match(hero, /Good morning|Leila|Ethiopia/i)
})

test('disposition requires a reasoned human judgment and does not invent authority', () => {
  assert.throws(() => sanitizeDisposition({ decision: 'request', reason: 'too short' }))
  assert.throws(() => sanitizeDisposition({ decision: 'invent', reason: agentDraftReason }))
  const recorded = sanitizeDisposition({ decision: 'escalate', reason: agentDraftReason })
  assert.equal(recorded.decision, 'escalate')
  assert.equal(recorded.reason, agentDraftReason)
  assert.equal(recorded.recordedAtLabel, awardDeskScenario.reviewer.recordedAtLabel)
  assert.equal(decisionCopy('request').recordStatus, 'Reconstruction in progress — evidence requested')
  assert.equal(defaultAwardDeskDisposition.decision, 'request')
  assert.deepEqual(recorded.governingPacks, [])
})

test('Award desk freeze keeps the supplied pack snapshot', () => {
  const packs = [
    { id: 'procurement-manual', name: 'Procurement manual v4.1', version: '4.1', category: 'procurement', showOnRecord: true },
    { id: 'echo-donor-conditions', name: 'ECHO-style donor conditions', version: '2026.2', category: 'donor', showOnRecord: true },
  ]
  const recorded = sanitizeDisposition({
    decision: 'escalate',
    reason: agentDraftReason,
    governingPacks: packs,
  })
  assert.deepEqual(recorded.governingPacks, packs)
  packs[0].name = 'changed later'
  assert.equal(recorded.governingPacks[0].name, 'Procurement manual v4.1')
})
