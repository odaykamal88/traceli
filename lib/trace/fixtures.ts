import "server-only";
import { createHash } from "node:crypto";
import {
  humanDecisionSchema, idSchema, scenarioSchema, traceUnitSchema,
  type DateFact, type HumanDecision, type SourceVersion, type TraceOutcome, type TraceScenario, type TraceUnit,
} from "@/lib/trace/contract";

/** Only JSON values are admitted. Object keys sort lexically; array order is preserved. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
  }
  throw new Error("Trace integrity: only finite JSON values are hashable.");
}
export const hashBytes = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");
export const hashJson = (value: unknown) => hashBytes(canonicalJson(value));
const digestWithout = (value: object, key: string) => hashJson(Object.fromEntries(Object.entries(value).filter(([name]) => name !== key)));
const unknownDate = (reason: string): DateFact => ({ value: null, precision: "unknown", basisRef: null, unknownReason: reason });
const date = (value: string, basisRef: string): DateFact => ({ value, precision: "day", basisRef, unknownReason: null });
const EMPTY_HASH = "0".repeat(64);
const RULE = "FICTIONAL RULE. Before the fictional decision, the reviewer must sign a review note. A supplied packet may be partial; absence from the packet does not establish absence from the underlying process.";
const COMPETING_RULE = "FICTIONAL COMPETING RULE. This instrument claims exclusive authority for the same Entity Q, procedure and decision date. It requires exactly two signatures; the primary instrument requires exactly one. No precedence is established.";
const PRIMARY_CONFLICT = "FICTIONAL PRIMARY RULE. This instrument claims exclusive authority for Entity Q, this procedure and decision date. Before the decision, the review note must have exactly one signature. A supplied packet may be partial.";
const SIGNED_NOTE = "FICTIONAL REVIEW NOTE\nSigned: yes\nSigned date: 2026-08-30\nDecision date: 2026-09-01\nScope: Entity Q, fictional review procedure.\n";
const FAILED_NOTE = "FICTIONAL REVIEW NOTE\nSigned: no\nSigned date: 2026-09-02\nDecision date: 2026-09-01\nScope: Entity Q, fictional review procedure.\n";
const SCOPE = "FICTIONAL SCOPE RECORD\nThis procedure is explicitly excluded from the fictional review-note requirement.\nDecision date: 2026-09-01\n";
const ruleBytes = (content: string, version: number, effectiveKnown: boolean, correction: boolean) => `${content}\nPublication date: 2026-08-01\n${effectiveKnown ? "Effective date: 2026-08-01\n" : "Effective date: unknown\n"}Decision date: 2026-09-01\n${correction ? `Fictional corrected edition ${version}; the substantive signature duty is unchanged.\n` : ""}`;

export type BuildTraceUnitInput = {
  id: string; organizationId: string; procurementId: string; actorId: string; scenario: TraceScenario;
  previousUnitId?: string; previousUnit?: TraceUnit; version?: number; now?: string; revisionKind?: "evidence" | "source_correction";
};

/** A bounded fixture factory, never an intake/parser for arbitrary documents or provider responses. */
export function buildTraceUnit(input: BuildTraceUnitInput): TraceUnit {
  for (const value of [input.id, input.organizationId, input.procurementId, input.actorId]) idSchema.parse(value);
  const previous = input.previousUnit ? validateTraceUnit(input.previousUnit) : undefined;
  if (previous && (previous.organizationId !== input.organizationId || previous.procurementId !== input.procurementId || previous.id === input.id || (input.previousUnitId && input.previousUnitId !== previous.id) || (input.version && input.version !== previous.version + 1))) throw new Error("Trace revision scope or version mismatch.");
  const scenario = scenarioSchema.parse(input.scenario);
  const version = input.version ?? (previous ? previous.version + 1 : 1);
  const previousUnitId = previous?.id ?? input.previousUnitId ?? null;
  if (previousUnitId && !previous) throw new Error("Trace revisions require the complete verified previous unit.");
  const preserveRule = !!previous && input.revisionKind !== "source_correction";
  const now = input.now ?? new Date().toISOString();
  const subId = (name: string) => `${input.id}:${name}`;
  const previousRecords = previous ? [previous, ...previous.sourceVersions, ...previous.evidenceSnapshot.assertions, previous.obligation, previous.profile, ...previous.constraints, previous.policyPack, previous.evidenceSnapshot, previous.evaluation, previous.policyAssessment] : [];
  const envelope = (name: string) => ({
    id: name === "unit" ? input.id : subId(name), version, organizationId: input.organizationId,
    procurementId: input.procurementId, classification: "synthetic" as const, createdAt: now,
    createdBy: input.actorId, sourceJobId: subId("fixture-job"), recordState: "draft" as const,
    supersedesId: previousRecords.find((record) => name === "unit" ? record.id === previous?.id : record.id.endsWith(`:${name}`))?.id ?? null,
  });
  const lane = previous?.lane ?? (scenario === "missing" || scenario === "excluded" ? "U" : scenario === "conflict" || scenario === "unknown_date" ? "G" : "M");
  const ruleText = scenario === "conflict" ? PRIMARY_CONFLICT : RULE;
  function source(name: string, type: SourceVersion["instrumentType"], content: string): SourceVersion {
    const id = subId(name);
    const body = type === "rule" ? ruleBytes(content, version, scenario !== "unknown_date", input.revisionKind === "source_correction") : `${content.trimEnd()}\n`;
    return {
      ...envelope(name), documentId: `${input.procurementId}:${type}`, title: type === "rule" ? "Fictional signed-note requirement" : type === "review_note" ? "Supplied fictional review note" : type === "scope_record" ? "Fictional scope exclusion" : "Fictional competing instrument",
      issuer: "Fictional Trace training office", instrumentType: type, jurisdiction: "Fictional jurisdiction; no real legal applicability",
      entityScope: "Entity Q, fictional review procedure", language: "en", translationStatus: "original", originRef: `${input.procurementId}:fixture-origin`, edition: `Fictional edition ${version}`,
      publicationDate: type === "rule" ? date("2026-08-01", id) : unknownDate("Publication date is not stated in this retained fictional source."),
      effectiveDate: type !== "rule" || scenario === "unknown_date" ? unknownDate("The fixture retains no reliable effective-date statement.") : date("2026-08-01", id),
      repealDate: unknownDate("No repeal date is supplied; absence is not a claim of continuing legal effect."),
      retrievedAt: now, checkedAt: now, storageRef: subId(`retained-${name}`), content: body, byteHash: hashBytes(body),
      hashAlgorithm: "sha256", byteVerification: "verified_retained_utf8", reuseRestrictions: "Synthetic fixture only",
      custody: "Retained in immutable Trace unit", reviewStatus: "fixture_only", realDecisionEligible: false,
    };
  }
  const sourceVersions = preserveRule ? previous!.sourceVersions.filter((item) => item.instrumentType !== "review_note") : [source("source-rule", "rule", ruleText)];
  const notePresent = ["satisfied", "failed", "timeout", "invalid_model"].includes(scenario);
  if (notePresent) sourceVersions.push(source("source-note", "review_note", scenario === "failed" ? FAILED_NOTE : SIGNED_NOTE));
  if (scenario === "excluded" && !sourceVersions.some((item) => item.instrumentType === "scope_record")) sourceVersions.push(source("source-scope", "scope_record", SCOPE));
  if (scenario === "conflict" && !sourceVersions.some((item) => item.instrumentType === "competing_rule")) sourceVersions.push(source("source-competing", "competing_rule", COMPETING_RULE));
  const rule = sourceVersions[0];
  const assertions: TraceUnit["evidenceSnapshot"]["assertions"] = sourceVersions.map((item, index) => ({
    ...envelope(`assertion-${index + 1}`), kind: "source_finding", text: item.instrumentType === "review_note" ? (scenario === "failed" ? "The supplied note records no signature and a date after the decision." : "The supplied note records a signature before the decision.") : item.instrumentType === "scope_record" ? "The supplied scope record explicitly excludes this procedure." : "The fictional instrument asserts a signature duty within the stated scope.",
    sourceVersionIds: [item.id], locator: item.instrumentType === "review_note" ? "Lines 2–4" : "Complete retained fixture",
    limitations: "Describes only these fictional supplied bytes; no real process or rule is asserted.",
    evidenceType: item.instrumentType === "review_note" ? "signed_note" : item.instrumentType === "scope_record" ? "scope_exclusion" : "instrument_claim",
    signed: item.instrumentType === "review_note" ? scenario !== "failed" : null,
    signedAt: item.instrumentType === "review_note" ? date(scenario === "failed" ? "2026-09-02" : "2026-08-30", item.id) : unknownDate("A signature date does not apply to this instrument assertion."),
  }));
  const decisionDate = preserveRule ? previous!.decisionDate : date("2026-09-01", rule.id);
  const sourceManifest = sourceVersions.map(({ id, byteHash }) => ({ sourceVersionId: id, byteHash }));
  const evidenceSnapshot: TraceUnit["evidenceSnapshot"] = {
    ...envelope("snapshot"), caseId: `${input.procurementId}:case`, sourceManifest: sourceManifest.map((entry) => ({ ...entry, locator: "Complete retained fixture" })), assertions,
    missingItems: scenario === "missing" ? [{ code: "signed_review_note", description: "A signed review note dated before the fictional decision.", owner: "Fictional review owner" }] : [],
    asOf: now, completeness: scenario === "missing" ? "partial" : "supplied_for_scoped_check", hash: EMPTY_HASH,
    hashMethod: "sha256:sorted-json-v1", redactionVersion: "none-v1", authorizedPurpose: "Local synthetic workflow verification", permissionRef: "synthetic-local-v1",
  };
  evidenceSnapshot.hash = digestWithout(evidenceSnapshot, "hash");
  const obligation: TraceUnit["obligation"] = preserveRule ? previous!.obligation : {
    ...envelope("obligation"), sourceVersionId: rule.id, locator: "Paragraph 1", excerpt: ruleText,
    normalizedRequirement: "A signed review note must predate the fictional decision.", translationAttribution: "Original English fixture", actor: "Fictional reviewer", stage: "Before fictional decision", family: "review_note", requiredEvidence: "signed_review_note", timing: "Signature date strictly before decision date",
    applicabilityPredicate: "fixture-scope-v1", exceptions: ["fixture-exception-v1"], exceptionAuthorityRef: "fixture-exception-v1", extractionMethod: "fixed_offline_fixture", reviewStatus: "fixture_only", realDecisionEligible: false,
  };
  const applicability = preserveRule ? previous!.profile.result : scenario === "conflict" ? "conflict" : scenario === "unknown_date" ? "unknown" : scenario === "excluded" ? "not_applicable" : "applicable";
  const profile: TraceUnit["profile"] = preserveRule ? previous!.profile : {
    ...envelope("profile"), lane, sourceVersionIds: sourceVersions.filter((item) => item.instrumentType !== "review_note").map((item) => item.id), institution: "Fictional Entity Q", jurisdiction: "Fictional jurisdiction", fundingInstrument: "Fictional funding arrangement", procedure: "Fictional review procedure", procurementMethod: "Fictional method", value: 100, currency: "FIC", thresholdBasis: "Illustrative only; no real threshold", relevantDate: decisionDate,
    overlays: scenario === "conflict" ? [subId("source-competing")] : [], precedenceEvidenceIds: [], languageLimitations: "Original English fixture only", suppliedContext: ["Entity Q", "Fictional review procedure", "Decision occasion explicitly fixed in this fixture"], missingContext: scenario === "conflict" ? ["Precedence", "Competing instrument effective date"] : scenario === "unknown_date" ? ["Effective date"] : [], resolverVersion: "fixture-scope-v1", result: applicability,
    reasonCodes: [scenario === "conflict" ? "competing_exclusive_authority" : scenario === "unknown_date" ? "effective_date_unknown" : scenario === "excluded" ? "explicit_scope_exclusion" : "fictional_scope_confirmed"], humanConfirmation: "unconfirmed_fixture_only", reviewStatus: "fixture_only", realDecisionEligible: false,
  };
  const constraints: TraceUnit["constraints"] = preserveRule ? previous!.constraints : [{
    ...envelope("constraint"), obligationId: obligation.id, kind: "deterministic", implementation: "signed-note-before-decision-v1", inputSchemaVersion: "trace-input-v1", applicabilityRequirement: "applicable", requiredInputs: ["signed_review_note", "decision_date"], missingBehavior: "unknown", conflictBehavior: "conflict", severity: "material", exceptionAuthorityRef: "fixture-exception-v1",
    fixtureCoverage: ["missing", "satisfied", "failed", "excluded", "conflict", "unknown_date", "timeout", "invalid_model"], sourceReview: "fixture_only", technicalReview: "synthetic_spec_review",
  }];
  const policyPack: TraceUnit["policyPack"] = preserveRule ? previous!.policyPack : { ...envelope("policy-pack"), constraintIds: constraints.map(({ id }) => id), obligationIds: [obligation.id], digest: EMPTY_HASH, implementationVersion: "trace-policy-v1", reviewStatus: "fixture_only", realDecisionEligible: false };
  if (!preserveRule) policyPack.digest = hashJson({ pack: Object.fromEntries(Object.entries(policyPack).filter(([key]) => key !== "digest")), constraints, obligation });
  const inputManifest = { snapshotHash: evidenceSnapshot.hash, profileId: profile.id, profileHash: hashJson(profile), obligationId: obligation.id, policyDigest: policyPack.digest, decisionDate };
  const inputHash = hashJson(inputManifest);
  const state = scenario === "timeout" ? "timeout" : scenario === "invalid_model" ? "invalid_response" : "completed";
  const distribution = state !== "completed" ? null : scenario === "missing" || scenario === "conflict" || scenario === "unknown_date" ? { supports: 0.05, doesNotSupport: 0.05, unknown: 0.9 } : { supports: 0.97, doesNotSupport: 0.02, unknown: 0.01 };
  const rawOutput = scenario === "invalid_model" ? { supports: 1.2, doesNotSupport: -0.2, unknown: 0.3 } : state === "timeout" ? { error: "fixture_timeout" } : distribution;
  const evaluation: TraceUnit["evaluation"] = {
    ...envelope("evaluation"), unitId: input.id, attemptKey: subId("offline-attempt"), inputHash, inputManifest,
    questionId: "fixture-review-note-v1", question: "Does the supplied packet support a signed review note before this fictional decision?", questionType: "categorical", rubricVersion: "fixture-rubric-v1", sourceVersionIds: sourceVersions.map(({ id }) => id),
    provider: "offline_fixture", transport: "none", requestedModel: "mock-v1", returnedModel: "mock-v1", startedAt: now, finishedAt: now, usage: { requests: 0, cost: 0, measurement: "offline_no_provider" }, state, distribution, rawOutputRef: null, rawOutputHash: hashJson(rawOutput), normalizationVersion: "fixture-normalization-v1",
    semanticFindings: scenario === "failed" ? ["High mock support conflicts with affirmative failed evidence; deterministic failure remains visible."] : [], errorCode: state === "timeout" ? "fixture_timeout" : state === "invalid_response" ? "invalid_distribution" : null, retryOf: null,
  };
  const deterministic = evaluateDeterministic({ profile, evidenceSnapshot, decisionDate });
  const presentation = presentResult(deterministic.outcome, state, applicability);
  const policyAssessment: TraceUnit["policyAssessment"] = {
    ...envelope("assessment"), unitId: input.id, inputHash, hash: EMPTY_HASH, policyPackId: policyPack.id, policyDigest: policyPack.digest,
    evaluationIds: [evaluation.id], applicability, result: deterministic.outcome, checks: [{ constraintId: constraints[0].id, outcome: deterministic.outcome, reasonCode: deterministic.reasonCode, evidenceIds: assertions.map(({ id }) => id) }],
    unresolvedGaps: [...evidenceSnapshot.missingItems.map(({ description }) => description), ...profile.missingContext], ...presentation, realDecisionEligible: false,
  };
  policyAssessment.hash = digestWithout(policyAssessment, "hash");
  const unit: TraceUnit = {
    ...envelope("unit"), schemaVersion: "trace-unit-v1", hashMethod: "sha256:sorted-json-v1", scenario, lane,
    title: "Fictional signed review note", logicalUnitId: `${input.procurementId}:review-note`, caseId: `${input.procurementId}:case`, issueId: `${input.procurementId}:issue`, decisionOccasion: "Fictional review decision on 1 September 2026", decisionDate,
    previousUnitId, supersedesId: previousUnitId, changeReason: previousUnitId ? preserveRule ? "A signed fictional note is supplied; the governing source and policy versions are unchanged." : "An explicit fictional source correction creates a new source and policy version." : null,
    benchmarkEligible: false, realDecisionEligible: false, artifactHash: EMPTY_HASH, inputHash, sourceVersions, sourceManifest, obligation, profile, constraints, policyPack, evidenceSnapshot, evaluation, policyAssessment,
    laterOutcome: { status: "unknown", reason: "No real or later outcome is asserted by this synthetic fixture." },
    limitations: ["Synthetic local workflow only; no real source, legal applicability, customer decision or benchmark outcome.", "Model probabilities are offline fixtures and are not calibrated performance estimates.", "Human acceptance concerns this assessment only; actual procurement authorization remains external."],
  };
  unit.artifactHash = digestWithout(unit, "artifactHash");
  return validateTraceUnit(unit);
}

/** The sole allowlisted implementation uses supplied facts; it never executes stored strings. */
export function evaluateDeterministic(unit: Pick<TraceUnit, "profile" | "evidenceSnapshot" | "decisionDate">): { outcome: TraceOutcome; reasonCode: string } {
  if (unit.profile.result === "conflict") return { outcome: "conflict", reasonCode: "competing_exclusive_authority" };
  if (unit.profile.result === "unknown") return { outcome: "unknown", reasonCode: "effective_date_unknown" };
  if (unit.profile.result === "not_applicable") return { outcome: "not_applicable", reasonCode: "explicit_scope_exclusion" };
  const note = unit.evidenceSnapshot.assertions.find((assertion) => assertion.evidenceType === "signed_note");
  if (!note || note.signed === null || !note.signedAt.value || !unit.decisionDate.value) return { outcome: "unknown", reasonCode: "signed_note_not_supplied" };
  if (!note.signed || note.signedAt.value >= unit.decisionDate.value) return { outcome: "not_satisfied", reasonCode: !note.signed ? "note_unsigned" : "note_late" };
  return { outcome: "satisfied", reasonCode: "signed_before_decision" };
}

function presentResult(result: TraceOutcome, state: TraceUnit["evaluation"]["state"], applicability: TraceUnit["profile"]["result"]): Pick<TraceUnit["policyAssessment"], "reason" | "nextAction" | "proposedDisposition"> {
  if (state !== "completed") return { reason: state === "timeout" ? "The offline model fixture timed out. The deterministic check remains visible, but the requested combined assessment is incomplete." : "The offline model fixture returned an invalid probability distribution. The deterministic check remains visible.", nextAction: "Request review of the failed evaluation; no clearance is issued.", proposedDisposition: "cannot_evaluate" };
  if (applicability === "unknown") return { reason: "The governing instrument’s effective date is unknown, so applicability cannot be confirmed.", nextAction: "Obtain effective-date evidence and request rule review.", proposedDisposition: "needs_rule_review" };
  const messages = {
    satisfied: { reason: "The supplied fictional note is signed before the decision date.", nextAction: "Review the cited note and record your scoped decision.", proposedDisposition: "ready_for_review" },
    not_satisfied: { reason: "The supplied fictional note is unsigned and dated after the decision. High model confidence does not change this failure.", nextAction: "Review the failure and record the appropriate response.", proposedDisposition: "needs_rule_review" },
    unknown: { reason: "The supplied packet has no signed review note. This does not establish that the underlying requirement failed.", nextAction: "Request the signed review note dated before the fictional decision.", proposedDisposition: "needs_evidence" },
    not_applicable: { reason: "The supplied fictional scope record explicitly excludes this procedure. This is not a passed check.", nextAction: "Review the cited exclusion and acknowledge its scope.", proposedDisposition: "ready_for_review" },
    conflict: { reason: "Two fictional instruments claim exclusive authority with incompatible signature requirements; precedence remains unresolved.", nextAction: "Request qualified rule review and precedence evidence.", proposedDisposition: "needs_rule_review" },
  } as const;
  return messages[result];
}

function integrity(condition: unknown): asserts condition {
  if (!condition) throw new Error("Trace integrity verification failed.");
}

/** Re-run after persistence as well as before it; a stored digest alone is insufficient. */
export function validateTraceUnit(value: unknown): TraceUnit {
  integrity(Buffer.byteLength(canonicalJson(value), "utf8") <= 128 * 1024);
  const unit = traceUnitSchema.parse(value);
  const records = [...unit.sourceVersions, ...unit.evidenceSnapshot.assertions, unit.obligation, unit.profile, ...unit.constraints, unit.policyPack, unit.evidenceSnapshot, unit.evaluation, unit.policyAssessment];
  integrity(new Set([unit.id, ...records.map(({ id }) => id)]).size === records.length + 1);
  records.forEach((record) => integrity(record.organizationId === unit.organizationId && record.procurementId === unit.procurementId && record.version <= unit.version));
  integrity(unit.previousUnitId !== unit.id && unit.previousUnitId === unit.supersedesId && (unit.previousUnitId === null ? unit.version === 1 && unit.changeReason === null : unit.version > 1 && unit.changeReason !== null));
  const sources = new Map(unit.sourceVersions.map((source) => [source.id, source]));
  const knownSource = (id: string) => integrity(sources.has(id));
  for (const source of unit.sourceVersions) {
    integrity(Buffer.byteLength(source.content, "utf8") <= 16 * 1024 && hashBytes(source.content) === source.byteHash);
    const allowed = source.instrumentType === "rule" ? [RULE, PRIMARY_CONFLICT].flatMap((rule) => [ruleBytes(rule, source.version, source.effectiveDate.value !== null, false), ruleBytes(rule, source.version, source.effectiveDate.value !== null, true)]) : source.instrumentType === "review_note" ? [SIGNED_NOTE, FAILED_NOTE] : source.instrumentType === "scope_record" ? [SCOPE] : [`${COMPETING_RULE}\n`];
    integrity(allowed.includes(source.content));
    if (source.instrumentType === "rule") integrity(source.publicationDate.value === "2026-08-01" && (source.effectiveDate.value === null || source.effectiveDate.value === "2026-08-01"));
    else integrity(source.publicationDate.value === null && source.effectiveDate.value === null);
    for (const fact of [source.publicationDate, source.effectiveDate, source.repealDate]) if (fact.basisRef) knownSource(fact.basisRef);
  }
  const manifest = unit.sourceVersions.map(({ id, byteHash }) => ({ sourceVersionId: id, byteHash }));
  integrity(hashJson(manifest) === hashJson(unit.sourceManifest));
  integrity(hashJson(manifest) === hashJson(unit.evidenceSnapshot.sourceManifest.map(({ sourceVersionId, byteHash }) => ({ sourceVersionId, byteHash }))));
  integrity(unit.evidenceSnapshot.caseId === unit.caseId && unit.evaluation.unitId === unit.id && unit.policyAssessment.unitId === unit.id);
  unit.evidenceSnapshot.assertions.forEach((assertion) => {
    assertion.sourceVersionIds.forEach(knownSource);
    if (assertion.signedAt.basisRef) integrity(assertion.sourceVersionIds.includes(assertion.signedAt.basisRef));
    if (assertion.evidenceType === "signed_note") {
      const source = sources.get(assertion.sourceVersionIds[0])!;
      integrity(source.instrumentType === "review_note" && assertion.sourceVersionIds.length === 1);
      integrity(source.content === (assertion.signed ? SIGNED_NOTE : FAILED_NOTE));
      integrity(assertion.signedAt.value === (assertion.signed ? "2026-08-30" : "2026-09-02"));
    }
    if (assertion.evidenceType === "scope_exclusion") integrity(sources.get(assertion.sourceVersionIds[0])!.content === SCOPE);
  });
  knownSource(unit.obligation.sourceVersionId);
  integrity(sources.get(unit.obligation.sourceVersionId)!.content.includes(unit.obligation.excerpt));
  unit.profile.sourceVersionIds.forEach(knownSource);
  unit.profile.overlays.forEach(knownSource);
  unit.evaluation.sourceVersionIds.forEach(knownSource);
  integrity(hashJson(unit.evaluation.sourceVersionIds) === hashJson([...sources.keys()]));
  if (unit.decisionDate.basisRef) knownSource(unit.decisionDate.basisRef);
  integrity(hashJson(unit.profile.relevantDate) === hashJson(unit.decisionDate) && unit.decisionDate.value === "2026-09-01");
  const rule = sources.get(unit.obligation.sourceVersionId)!;
  const conflict = unit.sourceVersions.some((source) => source.instrumentType === "competing_rule" && source.content === `${COMPETING_RULE}\n`);
  const excluded = unit.evidenceSnapshot.assertions.some((assertion) => assertion.evidenceType === "scope_exclusion");
  const applicability = conflict ? "conflict" : rule.effectiveDate.value === null ? "unknown" : excluded ? "not_applicable" : "applicable";
  integrity(unit.profile.result === applicability && unit.policyAssessment.applicability === applicability);
  unit.constraints.forEach((constraint) => integrity(constraint.obligationId === unit.obligation.id));
  integrity(hashJson(unit.policyPack.constraintIds) === hashJson(unit.constraints.map(({ id }) => id)) && hashJson(unit.policyPack.obligationIds) === hashJson([unit.obligation.id]));
  integrity(unit.policyPack.digest === hashJson({ pack: Object.fromEntries(Object.entries(unit.policyPack).filter(([key]) => key !== "digest")), constraints: unit.constraints, obligation: unit.obligation }));
  integrity(unit.evidenceSnapshot.hash === digestWithout(unit.evidenceSnapshot, "hash"));
  integrity(hashJson(unit.evaluation.inputManifest) === unit.inputHash && unit.evaluation.inputHash === unit.inputHash && unit.policyAssessment.inputHash === unit.inputHash);
  integrity(hashJson(unit.evaluation.inputManifest) === hashJson({ snapshotHash: unit.evidenceSnapshot.hash, profileId: unit.profile.id, profileHash: hashJson(unit.profile), obligationId: unit.obligation.id, policyDigest: unit.policyPack.digest, decisionDate: unit.decisionDate }));
  integrity(unit.evaluation.rawOutputHash === hashJson(unit.evaluation.state === "completed" ? unit.evaluation.distribution : unit.evaluation.state === "timeout" ? { error: "fixture_timeout" } : { supports: 1.2, doesNotSupport: -0.2, unknown: 0.3 }));
  integrity(unit.policyAssessment.policyPackId === unit.policyPack.id && unit.policyAssessment.policyDigest === unit.policyPack.digest && hashJson(unit.policyAssessment.evaluationIds) === hashJson([unit.evaluation.id]));
  const result = evaluateDeterministic(unit);
  integrity(unit.policyAssessment.result === result.outcome && unit.policyAssessment.checks.length === unit.constraints.length);
  unit.policyAssessment.checks.forEach((check, index) => {
    integrity(check.constraintId === unit.constraints[index].id && check.outcome === result.outcome && check.reasonCode === result.reasonCode);
    check.evidenceIds.forEach((id) => integrity(unit.evidenceSnapshot.assertions.some((assertion) => assertion.id === id)));
  });
  const presentation = presentResult(result.outcome, unit.evaluation.state, unit.profile.result);
  integrity(unit.policyAssessment.proposedDisposition === presentation.proposedDisposition && unit.policyAssessment.reason === presentation.reason && unit.policyAssessment.nextAction === presentation.nextAction);
  integrity(unit.policyAssessment.hash === digestWithout(unit.policyAssessment, "hash"));
  integrity(unit.artifactHash === digestWithout(unit, "artifactHash"));
  return unit;
}

export function validateHumanDecision(value: unknown, unit: TraceUnit): HumanDecision {
  const decision = humanDecisionSchema.parse(value);
  integrity(decision.organizationId === unit.organizationId && decision.procurementId === unit.procurementId && decision.unitId === unit.id);
  integrity(decision.unitHash === unit.artifactHash && decision.inputHash === unit.inputHash && decision.policyHash === unit.policyAssessment.hash && decision.originalOutcome === unit.policyAssessment.result);
  decision.citedEvidenceIds.forEach((id) => integrity(unit.evidenceSnapshot.assertions.some((assertion) => assertion.id === id)));
  integrity(new Set(decision.citedEvidenceIds).size === decision.citedEvidenceIds.length);
  integrity(decision.hash === digestWithout(decision, "hash"));
  return decision;
}
