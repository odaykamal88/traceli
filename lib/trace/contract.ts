import { z } from "zod";

export const scenarioIds = ["missing", "satisfied", "failed", "excluded", "conflict", "unknown_date", "timeout", "invalid_model"] as const;
export const scenarioSchema = z.enum(scenarioIds);
export type TraceScenario = z.infer<typeof scenarioSchema>;
export const scenarioOptions: { id: TraceScenario; label: string; description: string }[] = [
  { id: "missing", label: "Missing note · U", description: "The supplied packet has no signed review note." },
  { id: "satisfied", label: "Signed note · M", description: "A dated signature supports the fictional requirement." },
  { id: "failed", label: "Unsigned, late note · M", description: "Supplied evidence supports a specific failure." },
  { id: "excluded", label: "Outside scope · U", description: "An explicit scope record excludes this procedure." },
  { id: "conflict", label: "Competing instruments · G", description: "Conflicting authority requires qualified review." },
  { id: "unknown_date", label: "Unknown effective date · G", description: "An unavailable effective date leaves applicability unknown." },
  { id: "timeout", label: "Model timeout", description: "The check remains visible when the offline model fixture times out." },
  { id: "invalid_model", label: "Invalid model response", description: "An invalid probability distribution cannot clear a decision." },
];
export const idSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/);
export const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);
const text = z.string().trim().min(1).max(2000);
const instant = z.iso.datetime();
export const outcomeSchema = z.enum(["satisfied", "not_satisfied", "unknown", "not_applicable", "conflict"]);
export type TraceOutcome = z.infer<typeof outcomeSchema>;
export const dateFactSchema = z.strictObject({
  value: z.string().max(10).nullable(), precision: z.enum(["day", "month", "year", "unknown"]),
  basisRef: idSchema.nullable(), unknownReason: text.nullable(),
}).superRefine((date, ctx) => {
  if (date.value === null) {
    if (date.precision !== "unknown" || !date.unknownReason || date.basisRef !== null) ctx.addIssue({ code: "custom", message: "Unknown dates require an honest reason and no invented basis." });
    return;
  }
  const pattern = { day: /^\d{4}-\d{2}-\d{2}$/, month: /^\d{4}-\d{2}$/, year: /^\d{4}$/, unknown: /$a/ }[date.precision];
  const normalized = date.precision === "year" ? `${date.value}-01-01` : date.precision === "month" ? `${date.value}-01` : date.value;
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  if (!pattern.test(date.value) || !Number.isFinite(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== normalized || !date.basisRef || date.unknownReason !== null) ctx.addIssue({ code: "custom", message: "Known dates must be valid calendar facts with their basis." });
});
export type DateFact = z.infer<typeof dateFactSchema>;

const envelope = {
  id: idSchema, version: z.number().int().min(1).max(10000), organizationId: idSchema, procurementId: idSchema,
  classification: z.literal("synthetic"), createdAt: instant, createdBy: idSchema, sourceJobId: idSchema,
  recordState: z.literal("draft"), supersedesId: idSchema.nullable(),
};
export const sourceVersionSchema = z.strictObject({
  ...envelope, documentId: idSchema, title: text, issuer: z.literal("Fictional Trace training office"),
  instrumentType: z.enum(["rule", "review_note", "scope_record", "competing_rule"]),
  jurisdiction: z.literal("Fictional jurisdiction; no real legal applicability"), entityScope: text,
  language: z.literal("en"), translationStatus: z.literal("original"), originRef: idSchema,
  edition: text, publicationDate: dateFactSchema, effectiveDate: dateFactSchema, repealDate: dateFactSchema,
  retrievedAt: instant, checkedAt: instant, storageRef: idSchema, content: z.string().min(1).max(16384),
  byteHash: hashSchema, hashAlgorithm: z.literal("sha256"), byteVerification: z.literal("verified_retained_utf8"),
  reuseRestrictions: z.literal("Synthetic fixture only"), custody: z.literal("Retained in immutable Trace unit"),
  reviewStatus: z.literal("fixture_only"), realDecisionEligible: z.literal(false),
});
export const assertionSchema = z.strictObject({
  ...envelope, kind: z.enum(["fact", "source_finding", "inference", "hypothesis", "human_decision"]),
  text, sourceVersionIds: z.array(idSchema).min(1).max(8), locator: text, limitations: text,
  evidenceType: z.enum(["signed_note", "scope_exclusion", "instrument_claim"]),
  signed: z.boolean().nullable(), signedAt: dateFactSchema,
});
export const snapshotSchema = z.strictObject({
  ...envelope, caseId: idSchema, sourceManifest: z.array(z.strictObject({ sourceVersionId: idSchema, byteHash: hashSchema, locator: text })).min(1).max(8),
  assertions: z.array(assertionSchema).max(16), missingItems: z.array(z.strictObject({ code: z.literal("signed_review_note"), description: text, owner: text })).max(8),
  asOf: instant, completeness: z.enum(["partial", "supplied_for_scoped_check"]), hash: hashSchema,
  hashMethod: z.literal("sha256:sorted-json-v1"), redactionVersion: z.literal("none-v1"),
  authorizedPurpose: z.literal("Local synthetic workflow verification"), permissionRef: z.literal("synthetic-local-v1"),
});
export const obligationSchema = z.strictObject({
  ...envelope, sourceVersionId: idSchema, locator: text, excerpt: text, normalizedRequirement: text,
  translationAttribution: z.literal("Original English fixture"), actor: text, stage: text,
  family: z.literal("review_note"), requiredEvidence: z.literal("signed_review_note"), timing: text,
  applicabilityPredicate: z.literal("fixture-scope-v1"), exceptions: z.array(z.literal("fixture-exception-v1")).max(1),
  exceptionAuthorityRef: z.literal("fixture-exception-v1"), extractionMethod: z.literal("fixed_offline_fixture"),
  reviewStatus: z.literal("fixture_only"), realDecisionEligible: z.literal(false),
});
export const profileSchema = z.strictObject({
  ...envelope, lane: z.enum(["U", "M", "G"]), sourceVersionIds: z.array(idSchema).min(1).max(8),
  institution: text, jurisdiction: text, fundingInstrument: text, procedure: text, procurementMethod: text,
  value: z.number().nonnegative(), currency: z.literal("FIC"), thresholdBasis: text, relevantDate: dateFactSchema,
  overlays: z.array(idSchema).max(8), precedenceEvidenceIds: z.array(idSchema).max(8),
  languageLimitations: text, suppliedContext: z.array(text).min(1).max(8), missingContext: z.array(text).max(8),
  resolverVersion: z.literal("fixture-scope-v1"), result: z.enum(["applicable", "not_applicable", "unknown", "conflict"]),
  reasonCodes: z.array(text).min(1).max(8), humanConfirmation: z.literal("unconfirmed_fixture_only"),
  reviewStatus: z.literal("fixture_only"), realDecisionEligible: z.literal(false),
});
export const constraintSchema = z.strictObject({
  ...envelope, obligationId: idSchema, kind: z.literal("deterministic"), implementation: z.literal("signed-note-before-decision-v1"),
  inputSchemaVersion: z.literal("trace-input-v1"), applicabilityRequirement: z.literal("applicable"),
  requiredInputs: z.tuple([z.literal("signed_review_note"), z.literal("decision_date")]),
  missingBehavior: z.literal("unknown"), conflictBehavior: z.literal("conflict"), severity: z.literal("material"),
  exceptionAuthorityRef: z.literal("fixture-exception-v1"), fixtureCoverage: z.array(scenarioSchema).min(8).max(8),
  sourceReview: z.literal("fixture_only"), technicalReview: z.literal("synthetic_spec_review"),
});
export const policyPackSchema = z.strictObject({
  ...envelope, constraintIds: z.array(idSchema).min(1).max(8), obligationIds: z.array(idSchema).min(1).max(8),
  digest: hashSchema, implementationVersion: z.literal("trace-policy-v1"), reviewStatus: z.literal("fixture_only"), realDecisionEligible: z.literal(false),
});
export const evaluationSchema = z.strictObject({
  ...envelope, unitId: idSchema, attemptKey: idSchema, inputHash: hashSchema,
  inputManifest: z.strictObject({ snapshotHash: hashSchema, profileId: idSchema, profileHash: hashSchema, obligationId: idSchema, policyDigest: hashSchema, decisionDate: dateFactSchema }),
  questionId: z.literal("fixture-review-note-v1"), question: z.literal("Does the supplied packet support a signed review note before this fictional decision?"),
  questionType: z.literal("categorical"), rubricVersion: z.literal("fixture-rubric-v1"), sourceVersionIds: z.array(idSchema).min(1).max(8),
  provider: z.literal("offline_fixture"), transport: z.literal("none"), requestedModel: z.literal("mock-v1"), returnedModel: z.literal("mock-v1"),
  startedAt: instant, finishedAt: instant, usage: z.strictObject({ requests: z.literal(0), cost: z.literal(0), measurement: z.literal("offline_no_provider") }),
  state: z.enum(["completed", "timeout", "invalid_response"]),
  distribution: z.strictObject({ supports: z.number().min(0).max(1), doesNotSupport: z.number().min(0).max(1), unknown: z.number().min(0).max(1) }).nullable(),
  rawOutputRef: z.null(), rawOutputHash: hashSchema, normalizationVersion: z.literal("fixture-normalization-v1"),
  semanticFindings: z.array(text).max(8), errorCode: z.enum(["fixture_timeout", "invalid_distribution"]).nullable(), retryOf: z.null(),
}).superRefine((evaluation, ctx) => {
  if (evaluation.state === "completed") {
    const d = evaluation.distribution;
    if (!d || Math.abs(d.supports + d.doesNotSupport + d.unknown - 1) > 1e-9 || evaluation.errorCode !== null) ctx.addIssue({ code: "custom", message: "Completed model assessments require a complete probability distribution." });
  } else if (evaluation.distribution !== null || evaluation.errorCode !== (evaluation.state === "timeout" ? "fixture_timeout" : "invalid_distribution")) ctx.addIssue({ code: "custom", message: "Execution failures cannot carry normalized probabilities." });
});
export const policyAssessmentSchema = z.strictObject({
  ...envelope, unitId: idSchema, inputHash: hashSchema, hash: hashSchema, policyPackId: idSchema, policyDigest: hashSchema,
  evaluationIds: z.array(idSchema).min(1).max(1), applicability: z.enum(["applicable", "not_applicable", "unknown", "conflict"]),
  result: outcomeSchema, checks: z.array(z.strictObject({ constraintId: idSchema, outcome: outcomeSchema, reasonCode: text, evidenceIds: z.array(idSchema).max(16) })).min(1).max(8),
  unresolvedGaps: z.array(text).max(8), proposedDisposition: z.enum(["ready_for_review", "needs_evidence", "needs_rule_review", "cannot_evaluate"]),
  reason: text, nextAction: text, realDecisionEligible: z.literal(false),
});
export const traceUnitSchema = z.strictObject({
  ...envelope, schemaVersion: z.literal("trace-unit-v1"), hashMethod: z.literal("sha256:sorted-json-v1"),
  scenario: scenarioSchema, lane: z.enum(["U", "M", "G"]), title: text, logicalUnitId: idSchema, caseId: idSchema,
  issueId: idSchema, decisionOccasion: text, decisionDate: dateFactSchema, previousUnitId: idSchema.nullable(), changeReason: text.nullable(),
  benchmarkEligible: z.literal(false), realDecisionEligible: z.literal(false), artifactHash: hashSchema, inputHash: hashSchema,
  sourceVersions: z.array(sourceVersionSchema).min(1).max(8), sourceManifest: z.array(z.strictObject({ sourceVersionId: idSchema, byteHash: hashSchema })).min(1).max(8),
  obligation: obligationSchema, profile: profileSchema, constraints: z.array(constraintSchema).min(1).max(8), policyPack: policyPackSchema,
  evidenceSnapshot: snapshotSchema, evaluation: evaluationSchema, policyAssessment: policyAssessmentSchema,
  laterOutcome: z.strictObject({ status: z.literal("unknown"), reason: z.literal("No real or later outcome is asserted by this synthetic fixture.") }),
  limitations: z.array(text).min(1).max(8),
});
export type TraceUnit = z.infer<typeof traceUnitSchema>;
export type SourceVersion = z.infer<typeof sourceVersionSchema>;
export const decisionActions = ["accept_assessment", "request_evidence", "request_rule_review", "override_assessment", "decline_decision"] as const;
export const decisionInputSchema = z.strictObject({
  unitId: idSchema, expectedUnitHash: hashSchema, expectedInputHash: hashSchema, expectedPolicyHash: hashSchema,
  expectedSequence: z.number().int().min(0), action: z.enum(decisionActions), rationale: z.string().trim().min(20).max(2000),
  citedEvidenceIds: z.array(idSchema).max(16), authorityRef: z.literal("fixture-exception-v1").nullable(), idempotencyKey: z.uuid(),
}).superRefine((decision, ctx) => {
  if (decision.action === "override_assessment" && (decision.citedEvidenceIds.length === 0 || !decision.authorityRef)) ctx.addIssue({ code: "custom", message: "Overrides require cited evidence and the fixture exception authority." });
  if (decision.action !== "override_assessment" && decision.authorityRef !== null) ctx.addIssue({ code: "custom", message: "Exception authority belongs only to an override." });
});
export type DecisionInput = z.infer<typeof decisionInputSchema>;
export const humanDecisionSchema = z.strictObject({
  id: idSchema, unitId: idSchema, organizationId: idSchema, procurementId: idSchema, sequence: z.number().int().min(1),
  classification: z.literal("synthetic"), version: z.number().int().min(1), createdBy: idSchema,
  sourceJobId: z.literal("trace-synthetic-v1"), recordState: z.literal("draft"), supersedesId: idSchema.nullable(),
  actorId: idSchema, actorRole: z.enum(["Procurement Officer", "Procurement Director", "Workspace Admin"]), action: z.enum(decisionActions), rationale: z.string().trim().min(20).max(2000),
  createdAt: instant, unitHash: hashSchema, inputHash: hashSchema, policyHash: hashSchema, citedEvidenceIds: z.array(idSchema).max(16),
  authorityRef: z.literal("fixture-exception-v1").nullable(), originalOutcome: outcomeSchema, hash: hashSchema,
}).superRefine((decision, ctx) => {
  if (decision.version !== decision.sequence || decision.createdBy !== decision.actorId || (decision.sequence === 1 ? decision.supersedesId !== null : !decision.supersedesId) || decision.supersedesId === decision.id) ctx.addIssue({ code: "custom", message: "Human decision provenance must match its actor, sequence and prior decision." });
  if (decision.action === "override_assessment" && (decision.actorRole === "Procurement Officer" || !decision.authorityRef || decision.citedEvidenceIds.length === 0)) ctx.addIssue({ code: "custom", message: "Override authority and evidence are required." });
  if (decision.action !== "override_assessment" && decision.authorityRef !== null) ctx.addIssue({ code: "custom", message: "Exception authority belongs only to an override." });
});
export type HumanDecision = z.infer<typeof humanDecisionSchema>;
export const exportModeSchema = z.enum(["full", "redacted"]);
export type ExportMode = z.infer<typeof exportModeSchema>;
