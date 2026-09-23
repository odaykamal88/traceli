import { z } from 'zod'

import { hashJson } from '@/lib/field-registry/freeze'
import {
  awardRegistrySnapshotSchema,
  hashSchema,
  idSchema,
  pipelineStatusSchema,
  sourceRefSchema,
  type AwardRegistrySnapshot,
  type PipelineStatus,
  type RegistryField,
} from '@/lib/field-registry/schema'

/**
 * P4 Contradiction / judgment v0.
 * Reads registry fields only. Emits structured findings and a PipelineStatus
 * suitable for freezeAtJudgment. Never accepts file bytes or vendor payloads.
 */

export const findingSeverities = ['info', 'warning', 'blocker'] as const
export const findingKinds = ['required_missing', 'values_disagree', 'contradiction'] as const

const fieldKeySchema = z.string().trim().regex(/^[a-z][a-z0-9_.]{0,119}$/)
const shortText = z.string().trim().min(1).max(240)
const summaryText = z.string().trim().min(1).max(1000)

/** Provenance pointer only — hash + sourceRef from the registry field, never file bytes. */
export const evidencePointerSchema = z.strictObject({
  fieldId: idSchema,
  fieldKey: fieldKeySchema,
  sourceFileHash: hashSchema,
  sourceRef: sourceRefSchema,
})

export const findingSchema = z.strictObject({
  schemaVersion: z.literal('registry-finding-v0'),
  findingId: idSchema,
  kind: z.enum(findingKinds),
  severity: z.enum(findingSeverities),
  code: z.string().trim().min(1).max(80),
  ruleId: idSchema,
  title: shortText,
  summary: summaryText,
  involvedFieldKeys: z.array(fieldKeySchema).min(1).max(8),
  involvedFieldIds: z.array(idSchema).max(8),
  evidence: z.array(evidencePointerSchema).max(16),
})

/** Contradiction is a Finding with kind contradiction or values_disagree. */
export const contradictionSchema = findingSchema.refine(
  finding => finding.kind === 'contradiction' || finding.kind === 'values_disagree',
  { message: 'Contradiction findings must use kind contradiction or values_disagree.' },
)

export const judgmentResultSchema = z.strictObject({
  schemaVersion: z.literal('judgment-result-v0'),
  evaluatedAt: z.iso.datetime(),
  snapshotHash: hashSchema,
  findings: z.array(findingSchema).max(64),
  pipelineStatus: pipelineStatusSchema,
})

const scalarExpected = z.union([z.string().trim().min(1).max(4000), z.number().finite(), z.boolean()])
/** Whole attested token. Hyphens stay inside the token; matching is exact, not fuzzy. */
const attestedToken = z.string().trim().regex(/^[a-z0-9][a-z0-9-]{0,40}$/)

export const judgmentRuleSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    ruleId: idSchema,
    kind: z.literal('required_present'),
    fieldKey: fieldKeySchema,
    severity: z.enum(findingSeverities).default('blocker'),
    code: z.string().trim().min(1).max(80).default('required_field_missing'),
    title: shortText.optional(),
  }),
  z.strictObject({
    ruleId: idSchema,
    kind: z.literal('values_must_agree'),
    fieldKeys: z.tuple([fieldKeySchema, fieldKeySchema]),
    severity: z.enum(findingSeverities).default('blocker'),
    code: z.string().trim().min(1).max(80).default('fields_disagree'),
    title: shortText.optional(),
  }),
  z.strictObject({
    ruleId: idSchema,
    kind: z.literal('value_must_equal'),
    fieldKey: fieldKeySchema,
    expected: scalarExpected,
    severity: z.enum(findingSeverities).default('blocker'),
    code: z.string().trim().min(1).max(80).default('field_value_mismatch'),
    title: shortText.optional(),
  }),
  z.strictObject({
    ruleId: idSchema,
    kind: z.literal('value_must_be_one_of'),
    fieldKey: fieldKeySchema,
    allowed: z.array(scalarExpected).min(1).max(8),
    severity: z.enum(findingSeverities).default('blocker'),
    code: z.string().trim().min(1).max(80).default('field_value_not_allowed'),
    title: shortText.optional(),
  }),
  z.strictObject({
    ruleId: idSchema,
    kind: z.literal('text_must_include'),
    fieldKey: fieldKeySchema,
    tokens: z.array(attestedToken).min(1).max(8),
    severity: z.enum(findingSeverities).default('blocker'),
    code: z.string().trim().min(1).max(80).default('attested_tokens_missing'),
    title: shortText.optional(),
  }),
  z.strictObject({
    ruleId: idSchema,
    kind: z.literal('required_when_value_in'),
    whenFieldKey: fieldKeySchema,
    whenValues: z.array(scalarExpected).min(1).max(8),
    fieldKey: fieldKeySchema,
    allowedValues: z.array(scalarExpected).min(1).max(8).optional(),
    severity: z.enum(findingSeverities).default('blocker'),
    code: z.string().trim().min(1).max(80).default('conditional_field_missing'),
    title: shortText.optional(),
  }),
])

export type FindingSeverity = (typeof findingSeverities)[number]
export type FindingKind = (typeof findingKinds)[number]
export type EvidencePointer = z.infer<typeof evidencePointerSchema>
export type Finding = z.infer<typeof findingSchema>
export type Contradiction = z.infer<typeof contradictionSchema>
export type JudgmentResult = z.infer<typeof judgmentResultSchema>
export type JudgmentRule = z.infer<typeof judgmentRuleSchema>

export class JudgmentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JudgmentError'
  }
}

/**
 * Synthetic shelter-award rules for RFP-2026-041-shaped fixtures.
 * Illustrative only — not official donor text.
 */
export const SYNTHETIC_SHELTER_RULES: readonly JudgmentRule[] = [
  {
    ruleId: 'rule_capacity_kenya_required',
    kind: 'required_present',
    fieldKey: 'capacity.kenya',
    severity: 'blocker',
    code: 'required_field_missing',
    title: 'Kenya capacity evidence required',
  },
  {
    ruleId: 'rule_capacity_ethiopia_required',
    kind: 'required_present',
    fieldKey: 'capacity.ethiopia',
    severity: 'blocker',
    code: 'required_field_missing',
    title: 'Ethiopia capacity evidence required',
  },
  {
    ruleId: 'rule_coverage_matches_claim',
    kind: 'values_must_agree',
    fieldKeys: ['coverage.declared', 'coverage.supported'],
    severity: 'blocker',
    code: 'fields_disagree',
    title: 'Declared coverage must match supported coverage',
  },
]

function evidenceFromField(field: RegistryField): EvidencePointer {
  return {
    fieldId: field.fieldId,
    fieldKey: field.key,
    sourceFileHash: field.provenance.sourceFileHash,
    sourceRef: field.provenance.sourceRef,
  }
}

function fieldsByKey(snapshot: AwardRegistrySnapshot): Map<string, RegistryField> {
  const map = new Map<string, RegistryField>()
  for (const field of snapshot.fields) {
    if (!map.has(field.key)) map.set(field.key, field)
  }
  return map
}

function findingIdFor(ruleId: string, keys: readonly string[]): string {
  const raw = `finding_${ruleId}_${keys.join('_')}`.replace(/[^A-Za-z0-9._:-]/g, '_')
  return raw.slice(0, 160)
}

function scalarLabel(field: RegistryField): string {
  if (field.value.state === 'missing') return `missing (${field.value.reason})`
  return `${field.value.state}:${JSON.stringify(field.value.value)}`
}

function evaluateRequiredPresent(
  rule: Extract<JudgmentRule, { kind: 'required_present' }>,
  byKey: Map<string, RegistryField>,
): Finding | null {
  const field = byKey.get(rule.fieldKey)
  if (field && field.value.state !== 'missing') return null

  const evidence = field ? [evidenceFromField(field)] : []
  return findingSchema.parse({
    schemaVersion: 'registry-finding-v0',
    findingId: findingIdFor(rule.ruleId, [rule.fieldKey]),
    kind: 'required_missing',
    severity: rule.severity,
    code: rule.code,
    ruleId: rule.ruleId,
    title: rule.title ?? `Required field ${rule.fieldKey} is missing`,
    summary: field
      ? `Field ${rule.fieldKey} is present on the snapshot as missing evidence: ${field.value.state === 'missing' ? field.value.reason : ''}`
      : `No registry field with key ${rule.fieldKey} exists on the snapshot.`,
    involvedFieldKeys: [rule.fieldKey],
    involvedFieldIds: field ? [field.fieldId] : [],
    evidence,
  })
}

function evaluateValuesMustAgree(
  rule: Extract<JudgmentRule, { kind: 'values_must_agree' }>,
  byKey: Map<string, RegistryField>,
): Finding | null {
  const [leftKey, rightKey] = rule.fieldKeys
  const left = byKey.get(leftKey)
  const right = byKey.get(rightKey)

  const leftPresent = left && left.value.state !== 'missing'
  const rightPresent = right && right.value.state !== 'missing'

  if (!leftPresent && !rightPresent) return null

  let disagree = false
  let summary = ''

  if (leftPresent && rightPresent) {
    const leftValue = left!.value.state === 'missing' ? null : left!.value.value
    const rightValue = right!.value.state === 'missing' ? null : right!.value.value
    if (leftValue !== rightValue) {
      disagree = true
      summary = `Fields ${leftKey} (${scalarLabel(left!)}) and ${rightKey} (${scalarLabel(right!)}) must agree.`
    }
  } else if (leftPresent !== rightPresent) {
    disagree = true
    summary = `Fields ${leftKey} and ${rightKey} must both be present with matching values; one side is missing.`
  }

  if (!disagree) return null

  const involved = [left, right].filter((field): field is RegistryField => Boolean(field))
  return findingSchema.parse({
    schemaVersion: 'registry-finding-v0',
    findingId: findingIdFor(rule.ruleId, rule.fieldKeys),
    kind: 'values_disagree',
    severity: rule.severity,
    code: rule.code,
    ruleId: rule.ruleId,
    title: rule.title ?? `Fields ${leftKey} and ${rightKey} disagree`,
    summary,
    involvedFieldKeys: [...rule.fieldKeys],
    involvedFieldIds: involved.map(field => field.fieldId),
    evidence: involved.map(evidenceFromField),
  })
}

function presentScalar(field: RegistryField | undefined): {
  field: RegistryField
  value: string | number | boolean
} | null {
  if (!field || field.value.state === 'missing') return null
  return { field, value: field.value.value }
}

/** Split on anything that is not a letter, digit, or hyphen. `us-state` stays one token. */
function attestedTokenSet(value: string): Set<string> {
  return new Set(value.toLowerCase().split(/[^a-z0-9-]+/).filter(token => token.length > 0))
}

function evaluateValueMustBeOneOf(
  rule: Extract<JudgmentRule, { kind: 'value_must_be_one_of' }>,
  byKey: Map<string, RegistryField>,
): Finding | null {
  const field = byKey.get(rule.fieldKey)
  const scalar = presentScalar(field)
  if (!scalar) {
    const evidence = field ? [evidenceFromField(field)] : []
    return findingSchema.parse({
      schemaVersion: 'registry-finding-v0',
      findingId: findingIdFor(rule.ruleId, [rule.fieldKey]),
      kind: 'required_missing',
      severity: rule.severity,
      code: rule.code,
      ruleId: rule.ruleId,
      title: rule.title ?? `Field ${rule.fieldKey} must be one of the allowed values`,
      summary: field
        ? `Field ${rule.fieldKey} is missing evidence; allowed ${rule.allowed.map(value => JSON.stringify(value)).join(', ')}.`
        : `No registry field with key ${rule.fieldKey} exists; allowed ${rule.allowed.map(value => JSON.stringify(value)).join(', ')}.`,
      involvedFieldKeys: [rule.fieldKey],
      involvedFieldIds: field ? [field.fieldId] : [],
      evidence,
    })
  }
  if (rule.allowed.some(value => value === scalar.value)) return null
  return findingSchema.parse({
    schemaVersion: 'registry-finding-v0',
    findingId: findingIdFor(rule.ruleId, [rule.fieldKey]),
    kind: 'contradiction',
    severity: rule.severity,
    code: rule.code,
    ruleId: rule.ruleId,
    title: rule.title ?? `Field ${rule.fieldKey} must be one of the allowed values`,
    summary: `Field ${rule.fieldKey} is ${scalarLabel(scalar.field)}; allowed ${rule.allowed.map(value => JSON.stringify(value)).join(', ')}.`,
    involvedFieldKeys: [rule.fieldKey],
    involvedFieldIds: [scalar.field.fieldId],
    evidence: [evidenceFromField(scalar.field)],
  })
}

function evaluateTextMustInclude(
  rule: Extract<JudgmentRule, { kind: 'text_must_include' }>,
  byKey: Map<string, RegistryField>,
): Finding | null {
  const field = byKey.get(rule.fieldKey)
  const scalar = presentScalar(field)
  if (!scalar) {
    const evidence = field ? [evidenceFromField(field)] : []
    return findingSchema.parse({
      schemaVersion: 'registry-finding-v0',
      findingId: findingIdFor(rule.ruleId, [rule.fieldKey]),
      kind: 'required_missing',
      severity: rule.severity,
      code: rule.code,
      ruleId: rule.ruleId,
      title: rule.title ?? `Field ${rule.fieldKey} must attest required tokens`,
      summary: field
        ? `Field ${rule.fieldKey} is missing evidence; required tokens: ${rule.tokens.join(', ')}.`
        : `No registry field with key ${rule.fieldKey} exists; required tokens: ${rule.tokens.join(', ')}.`,
      involvedFieldKeys: [rule.fieldKey],
      involvedFieldIds: field ? [field.fieldId] : [],
      evidence,
    })
  }
  if (typeof scalar.value !== 'string') {
    return findingSchema.parse({
      schemaVersion: 'registry-finding-v0',
      findingId: findingIdFor(rule.ruleId, [rule.fieldKey]),
      kind: 'contradiction',
      severity: rule.severity,
      code: rule.code,
      ruleId: rule.ruleId,
      title: rule.title ?? `Field ${rule.fieldKey} must attest required tokens`,
      summary: `Field ${rule.fieldKey} is ${scalarLabel(scalar.field)}; token attestation requires text.`,
      involvedFieldKeys: [rule.fieldKey],
      involvedFieldIds: [scalar.field.fieldId],
      evidence: [evidenceFromField(scalar.field)],
    })
  }
  const have = attestedTokenSet(scalar.value)
  const missing = rule.tokens.filter(token => !have.has(token))
  if (missing.length === 0) return null
  return findingSchema.parse({
    schemaVersion: 'registry-finding-v0',
    findingId: findingIdFor(rule.ruleId, [rule.fieldKey]),
    kind: 'contradiction',
    severity: rule.severity,
    code: rule.code,
    ruleId: rule.ruleId,
    title: rule.title ?? `Field ${rule.fieldKey} must attest required tokens`,
    summary: `Field ${rule.fieldKey} does not attest: ${missing.join(', ')}. Tokens match exactly after splitting on punctuation; this is not a name search.`,
    involvedFieldKeys: [rule.fieldKey],
    involvedFieldIds: [scalar.field.fieldId],
    evidence: [evidenceFromField(scalar.field)],
  })
}

function evaluateRequiredWhenValueIn(
  rule: Extract<JudgmentRule, { kind: 'required_when_value_in' }>,
  byKey: Map<string, RegistryField>,
): Finding | null {
  const triggerField = byKey.get(rule.whenFieldKey)
  const trigger = presentScalar(triggerField)
  if (!trigger) return null
  if (!rule.whenValues.some(value => value === trigger.value)) return null

  const field = byKey.get(rule.fieldKey)
  const scalar = presentScalar(field)
  const involvedFields = [trigger.field, field].filter((item): item is RegistryField => Boolean(item))
  const involvedKeys = [rule.whenFieldKey, rule.fieldKey]
  if (!scalar) {
    return findingSchema.parse({
      schemaVersion: 'registry-finding-v0',
      findingId: findingIdFor(rule.ruleId, involvedKeys),
      kind: 'required_missing',
      severity: rule.severity,
      code: rule.code,
      ruleId: rule.ruleId,
      title: rule.title ?? `Field ${rule.fieldKey} is required for this result`,
      summary: `Field ${rule.fieldKey} is required because ${rule.whenFieldKey} is ${JSON.stringify(trigger.value)}.`,
      involvedFieldKeys: involvedKeys,
      involvedFieldIds: involvedFields.map(item => item.fieldId),
      evidence: involvedFields.map(evidenceFromField),
    })
  }
  if (rule.allowedValues && !rule.allowedValues.some(value => value === scalar.value)) {
    return findingSchema.parse({
      schemaVersion: 'registry-finding-v0',
      findingId: findingIdFor(rule.ruleId, involvedKeys),
      kind: 'contradiction',
      severity: rule.severity,
      code: rule.code,
      ruleId: rule.ruleId,
      title: rule.title ?? `Field ${rule.fieldKey} is not an allowed decision`,
      summary: `Field ${rule.fieldKey} is ${scalarLabel(scalar.field)}; allowed ${rule.allowedValues.map(value => JSON.stringify(value)).join(', ')} when ${rule.whenFieldKey} is ${JSON.stringify(trigger.value)}.`,
      involvedFieldKeys: involvedKeys,
      involvedFieldIds: involvedFields.map(item => item.fieldId),
      evidence: involvedFields.map(evidenceFromField),
    })
  }
  return null
}

function evaluateValueMustEqual(
  rule: Extract<JudgmentRule, { kind: 'value_must_equal' }>,
  byKey: Map<string, RegistryField>,
): Finding | null {
  const field = byKey.get(rule.fieldKey)
  if (!field || field.value.state === 'missing') {
    const evidence = field ? [evidenceFromField(field)] : []
    return findingSchema.parse({
      schemaVersion: 'registry-finding-v0',
      findingId: findingIdFor(rule.ruleId, [rule.fieldKey]),
      kind: 'required_missing',
      severity: rule.severity,
      code: rule.code,
      ruleId: rule.ruleId,
      title: rule.title ?? `Field ${rule.fieldKey} must equal ${JSON.stringify(rule.expected)}`,
      summary: field
        ? `Field ${rule.fieldKey} is missing evidence; expected ${JSON.stringify(rule.expected)}.`
        : `No registry field with key ${rule.fieldKey} exists; expected ${JSON.stringify(rule.expected)}.`,
      involvedFieldKeys: [rule.fieldKey],
      involvedFieldIds: field ? [field.fieldId] : [],
      evidence,
    })
  }

  const actual = field.value.value
  if (actual === rule.expected) return null

  return findingSchema.parse({
    schemaVersion: 'registry-finding-v0',
    findingId: findingIdFor(rule.ruleId, [rule.fieldKey]),
    kind: 'contradiction',
    severity: rule.severity,
    code: rule.code,
    ruleId: rule.ruleId,
    title: rule.title ?? `Field ${rule.fieldKey} must equal ${JSON.stringify(rule.expected)}`,
    summary: `Field ${rule.fieldKey} is ${scalarLabel(field)}; expected ${JSON.stringify(rule.expected)}.`,
    involvedFieldKeys: [rule.fieldKey],
    involvedFieldIds: [field.fieldId],
    evidence: [evidenceFromField(field)],
  })
}

function readinessFromFindings(findings: readonly Finding[]): PipelineStatus['readiness'] {
  if (findings.some(finding => finding.severity === 'blocker')) return 'red'
  if (findings.some(finding => finding.severity === 'warning')) return 'amber'
  return 'green'
}

function pipelineStatusFrom(
  rules: readonly JudgmentRule[],
  findings: readonly Finding[],
): PipelineStatus {
  const failedRuleIds = new Set(findings.map(finding => finding.ruleId))
  const deterministicFlags = rules.map(rule => ({
    flagId: `flag_${rule.ruleId}`.slice(0, 160),
    code: rule.code,
    passed: !failedRuleIds.has(rule.ruleId),
  }))
  const semanticAnomalyIds = findings
    .filter(finding => finding.kind === 'contradiction' || finding.kind === 'values_disagree')
    .map(finding => finding.findingId)

  return pipelineStatusSchema.parse({
    schemaVersion: 'pipeline-status-v1',
    deterministicFlags,
    semanticAnomalyIds,
    readiness: readinessFromFindings(findings),
  })
}

function evaluateRule(rule: JudgmentRule, byKey: Map<string, RegistryField>): Finding | null {
  switch (rule.kind) {
    case 'required_present':
      return evaluateRequiredPresent(rule, byKey)
    case 'values_must_agree':
      return evaluateValuesMustAgree(rule, byKey)
    case 'value_must_equal':
      return evaluateValueMustEqual(rule, byKey)
    case 'value_must_be_one_of':
      return evaluateValueMustBeOneOf(rule, byKey)
    case 'text_must_include':
      return evaluateTextMustInclude(rule, byKey)
    case 'required_when_value_in':
      return evaluateRequiredWhenValueIn(rule, byKey)
  }
}

/**
 * Run deterministic judgment rules over a registry snapshot.
 * Pure: no I/O, no extraction, no model calls.
 */
export function evaluateJudgment(
  snapshot: unknown,
  rules: readonly JudgmentRule[] = SYNTHETIC_SHELTER_RULES,
  options?: { evaluatedAt?: string },
): JudgmentResult {
  const parsedSnapshot = awardRegistrySnapshotSchema.parse(structuredClone(snapshot))
  const parsedRules = rules.map(rule => judgmentRuleSchema.parse(rule))
  if (parsedRules.length > 64) {
    throw new JudgmentError('Judgment accepts at most 64 rules.')
  }

  const byKey = fieldsByKey(parsedSnapshot)
  const findings: Finding[] = []

  for (const rule of parsedRules) {
    const finding = evaluateRule(rule, byKey)
    if (finding) findings.push(finding)
  }

  findings.sort((left, right) => left.findingId.localeCompare(right.findingId))

  return judgmentResultSchema.parse({
    schemaVersion: 'judgment-result-v0',
    evaluatedAt: options?.evaluatedAt ?? parsedSnapshot.asOf,
    snapshotHash: hashJson(parsedSnapshot),
    findings,
    pipelineStatus: pipelineStatusFrom(parsedRules, findings),
  })
}

/** True when every rule passed and readiness is green. */
export function judgmentPassed(result: JudgmentResult): boolean {
  return result.findings.length === 0 && result.pipelineStatus.readiness === 'green'
}

export function isContradiction(finding: Finding): finding is Contradiction {
  return finding.kind === 'contradiction' || finding.kind === 'values_disagree'
}
