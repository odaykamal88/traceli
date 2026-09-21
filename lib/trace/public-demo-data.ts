import 'server-only'

import { buildTraceUnit, hashJson } from '@/lib/trace/fixtures'
import type { TraceScenario, TraceUnit } from '@/lib/trace/contract'
import { publicScenarioOptions, type PublicDemoCase, type PublicDemoPacket, type PublicDemoSnapshot } from '@/lib/trace/public-demo'

/** Public allowlist: no protected identities, storage claims, customer records or runtime access. */
function projectFixture(unit: TraceUnit): PublicDemoCase {
  const snapshot: PublicDemoSnapshot = {
    schemaVersion: 'trace-public-snapshot-v1', id: unit.id, scenario: unit.scenario, lane: unit.lane,
    version: unit.version, previousSnapshotId: unit.previousUnitId,
    provenance: 'Fixed fictional example generated for the public Trace demo', classification: 'synthetic',
    realDecisionEligible: false, benchmarkEligible: false, decisionDate: unit.decisionDate,
    rule: { text: unit.obligation.normalizedRequirement, sourceId: unit.obligation.sourceVersionId, locator: unit.obligation.locator },
    sources: unit.sourceVersions.map(source => ({ id: source.id, title: source.title, edition: source.edition, content: source.content, byteHash: source.byteHash, effectiveDate: source.effectiveDate })),
    evidence: unit.evidenceSnapshot.assertions.map(assertion => ({ id: assertion.id, text: assertion.text, sourceIds: assertion.sourceVersionIds, locator: assertion.locator, limitations: assertion.limitations })),
    missingEvidence: unit.evidenceSnapshot.missingItems.map(item => item.description),
    policy: { result: unit.policyAssessment.result, reason: unit.policyAssessment.reason, nextAction: unit.policyAssessment.nextAction, disposition: unit.policyAssessment.proposedDisposition, applicability: unit.policyAssessment.applicability, implementationVersion: unit.policyPack.implementationVersion },
    model: { state: unit.evaluation.state, distribution: unit.evaluation.distribution, findings: unit.evaluation.semanticFindings, externalRequests: 0 },
  }
  return { snapshot, snapshotHash: hashJson(snapshot) }
}

export function buildPublicDemoPacket(): PublicDemoPacket {
  const base = { organizationId: 'org_public_demo', actorId: 'fictional-demo-author', now: '2026-09-21T00:00:00.000Z' }
  const fixtures = Object.fromEntries(publicScenarioOptions.map(({ id: scenario }) => [scenario, buildTraceUnit({ ...base, id: `public-demo-${scenario}-v1`, procurementId: `fictional-${scenario}`, scenario })])) as Record<TraceScenario, TraceUnit>
  const revised = buildTraceUnit({ ...base, id: 'public-demo-missing-v2', procurementId: 'fictional-missing', scenario: 'satisfied', previousUnit: fixtures.missing })
  return { cases: Object.fromEntries(publicScenarioOptions.map(({ id }) => [id, projectFixture(fixtures[id])])) as PublicDemoPacket['cases'], revisedMissing: projectFixture(revised) }
}
