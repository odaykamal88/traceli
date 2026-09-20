import "server-only";
import { z } from "zod";
import { exportModeSchema, idSchema, type ExportMode, type HumanDecision, type TraceUnit } from "@/lib/trace/contract";
import { hashJson, validateHumanDecision, validateTraceUnit } from "@/lib/trace/fixtures";

/** Every disclosed field is selected here. Never spread a unit, record or audit object into a redacted export. */
function redactedUnit(unit: TraceUnit) {
  const reference = (record: { id: string; version: number }) => ({ id: record.id, version: record.version });
  return {
    ...reference(unit), schemaVersion: unit.schemaVersion, classification: unit.classification, scenario: unit.scenario,
    lane: unit.lane, procurementId: unit.procurementId, previousUnitId: unit.previousUnitId, artifactHash: unit.artifactHash,
    inputHash: unit.inputHash, decisionDate: unit.decisionDate, benchmarkEligible: false, realDecisionEligible: false,
    sources: unit.sourceVersions.map((source) => ({
      ...reference(source), documentId: source.documentId, title: source.title, instrumentType: source.instrumentType,
      language: source.language, translationStatus: source.translationStatus, publicationDate: source.publicationDate,
      effectiveDate: source.effectiveDate, repealDate: source.repealDate, content: source.content, byteHash: source.byteHash,
      hashAlgorithm: source.hashAlgorithm, byteVerification: source.byteVerification, reviewStatus: source.reviewStatus,
    })),
    obligation: {
      ...reference(unit.obligation), sourceVersionId: unit.obligation.sourceVersionId, locator: unit.obligation.locator,
      excerpt: unit.obligation.excerpt, normalizedRequirement: unit.obligation.normalizedRequirement,
      requiredEvidence: unit.obligation.requiredEvidence, timing: unit.obligation.timing,
      exceptionAuthorityRef: unit.obligation.exceptionAuthorityRef, reviewStatus: unit.obligation.reviewStatus,
    },
    profile: {
      ...reference(unit.profile), lane: unit.profile.lane, sourceVersionIds: unit.profile.sourceVersionIds,
      result: unit.profile.result, reasonCodes: unit.profile.reasonCodes, suppliedContext: unit.profile.suppliedContext,
      missingContext: unit.profile.missingContext, resolverVersion: unit.profile.resolverVersion,
      humanConfirmation: unit.profile.humanConfirmation, reviewStatus: unit.profile.reviewStatus,
    },
    constraints: unit.constraints.map((constraint) => ({
      ...reference(constraint), obligationId: constraint.obligationId, kind: constraint.kind,
      implementation: constraint.implementation, inputSchemaVersion: constraint.inputSchemaVersion,
      applicabilityRequirement: constraint.applicabilityRequirement, requiredInputs: constraint.requiredInputs,
      missingBehavior: constraint.missingBehavior, conflictBehavior: constraint.conflictBehavior,
      severity: constraint.severity, exceptionAuthorityRef: constraint.exceptionAuthorityRef,
    })),
    policyPack: {
      ...reference(unit.policyPack), digest: unit.policyPack.digest, constraintIds: unit.policyPack.constraintIds,
      obligationIds: unit.policyPack.obligationIds, implementationVersion: unit.policyPack.implementationVersion,
      reviewStatus: unit.policyPack.reviewStatus,
    },
    evidenceSnapshot: {
      ...reference(unit.evidenceSnapshot), hash: unit.evidenceSnapshot.hash, hashMethod: unit.evidenceSnapshot.hashMethod,
      sourceManifest: unit.evidenceSnapshot.sourceManifest, asOf: unit.evidenceSnapshot.asOf,
      completeness: unit.evidenceSnapshot.completeness, missingItems: unit.evidenceSnapshot.missingItems,
      assertions: unit.evidenceSnapshot.assertions.map((assertion) => ({
        ...reference(assertion), kind: assertion.kind, text: assertion.text, sourceVersionIds: assertion.sourceVersionIds,
        locator: assertion.locator, limitations: assertion.limitations, evidenceType: assertion.evidenceType,
        signed: assertion.signed, signedAt: assertion.signedAt,
      })),
    },
    evaluation: {
      ...reference(unit.evaluation), inputHash: unit.evaluation.inputHash, inputManifest: unit.evaluation.inputManifest,
      questionId: unit.evaluation.questionId, question: unit.evaluation.question, rubricVersion: unit.evaluation.rubricVersion,
      provider: unit.evaluation.provider, transport: unit.evaluation.transport, requestedModel: unit.evaluation.requestedModel,
      returnedModel: unit.evaluation.returnedModel, state: unit.evaluation.state, distribution: unit.evaluation.distribution,
      errorCode: unit.evaluation.errorCode, usage: unit.evaluation.usage, rawOutputHash: unit.evaluation.rawOutputHash,
      normalizationVersion: unit.evaluation.normalizationVersion, semanticFindings: unit.evaluation.semanticFindings,
    },
    policyAssessment: {
      ...reference(unit.policyAssessment), hash: unit.policyAssessment.hash, inputHash: unit.policyAssessment.inputHash,
      policyDigest: unit.policyAssessment.policyDigest, policyPackId: unit.policyAssessment.policyPackId,
      evaluationIds: unit.policyAssessment.evaluationIds, applicability: unit.policyAssessment.applicability,
      result: unit.policyAssessment.result, checks: unit.policyAssessment.checks, unresolvedGaps: unit.policyAssessment.unresolvedGaps,
      proposedDisposition: unit.policyAssessment.proposedDisposition, reason: unit.policyAssessment.reason,
      nextAction: unit.policyAssessment.nextAction, realDecisionEligible: false,
    },
    laterOutcome: unit.laterOutcome, limitations: unit.limitations,
  };
}

export function buildTraceExport(input: {
  unit: TraceUnit; decisions: HumanDecision[]; mode: ExportMode; grantId: string; createdAt: string;
  grant: { recipientId: string; purpose: string; grantedAt: string; expiresAt: string };
}) {
  const unit = validateTraceUnit(input.unit);
  const mode = exportModeSchema.parse(input.mode);
  idSchema.parse(input.grantId);
  z.iso.datetime().parse(input.createdAt);
  const grant = z.strictObject({ recipientId: idSchema, purpose: z.string().trim().min(10).max(200), grantedAt: z.iso.datetime(), expiresAt: z.iso.datetime() }).parse(input.grant);
  const grantTime = Date.parse(grant.grantedAt);
  const expiryTime = Date.parse(grant.expiresAt);
  const downloadTime = Date.parse(input.createdAt);
  if (expiryTime <= grantTime || expiryTime - grantTime > 15 * 60 * 1000 || downloadTime < grantTime || downloadTime >= expiryTime) throw new Error("Export grant timing is invalid.");
  const decisions = input.decisions.map((decision) => validateHumanDecision(decision, unit));
  if (decisions.some((decision, index) => decision.sequence !== index + 1 || decision.supersedesId !== (decisions[index - 1]?.id ?? null))) throw new Error("Incomplete or reordered decision history.");
  const payload = {
    schemaVersion: "trace-export-v1", classification: "synthetic", mode, grantId: input.grantId, createdAt: input.createdAt,
    authorization: {
      grantId: input.grantId, action: "download_self", mode,
      grantedAt: grant.grantedAt, expiresAt: grant.expiresAt,
      unitHash: unit.artifactHash, decisionSequence: decisions.length,
      ...(mode === "full" ? { recipientId: grant.recipientId, purpose: grant.purpose } : {}),
    },
    unit: mode === "full" ? unit : redactedUnit(unit),
    decisions: mode === "full" ? decisions : decisions.map((decision) => ({
      id: decision.id, unitId: decision.unitId, sequence: decision.sequence, action: decision.action,
      version: decision.version, classification: decision.classification, recordState: decision.recordState,
      sourceJobId: decision.sourceJobId, supersedesId: decision.supersedesId,
      createdAt: decision.createdAt, unitHash: decision.unitHash, inputHash: decision.inputHash,
      policyHash: decision.policyHash, originalOutcome: decision.originalOutcome,
      citedEvidenceIds: decision.citedEvidenceIds, authorityRef: decision.authorityRef, hash: decision.hash,
    })),
    redactionManifest: mode === "full" ? [] : [
      { path: "unit.*.createdBy (all record envelopes)", reason: "Creator identity withheld", projection: "allowlist-v1" },
      { path: "decisions[*].actorId", reason: "Reviewer identity withheld", projection: "allowlist-v1" },
      { path: "decisions[*].createdBy", reason: "Reviewer identity withheld", projection: "allowlist-v1" },
      { path: "decisions[*].actorRole", reason: "Reviewer identity metadata withheld", projection: "allowlist-v1" },
      { path: "decisions[*].rationale", reason: "Free-text human rationale withheld", projection: "allowlist-v1" },
      { path: "authorization.recipientId", reason: "Authenticated recipient identity withheld", projection: "allowlist-v1" },
      { path: "authorization.purpose", reason: "Free-text export purpose withheld", projection: "allowlist-v1" },
      { path: "internal metadata and annotations", reason: "Not included by the disclosed-field allowlist", projection: "allowlist-v1" },
    ],
    provenance: {
      originalUnitHash: unit.artifactHash, originalSnapshotHash: unit.evidenceSnapshot.hash,
      originalPolicyHash: unit.policyAssessment.hash, sourceByteHashes: unit.sourceManifest,
      decisionHashes: decisions.map(({ id, hash }) => ({ id, hash })), decisionSequence: decisions.length,
      previousUnitId: unit.previousUnitId,
    },
    verification: {
      hashAlgorithm: "sha256", serialization: "sorted-json-v1",
      payloadHashInstructions: "UTF-8 encode canonical JSON of payload: recursively sort object keys lexically, preserve array order, use JSON string/number encoding with no whitespace; calculate SHA-256 and compare to payloadHash.",
      sourceHashInstructions: "UTF-8 encode each disclosed content string exactly, including trailing newlines; its SHA-256 must equal byteHash.",
      reconstruction: mode === "full" ? "The disclosed current unit and complete current-unit human history can be reconstructed. Recompute artifact, snapshot and decision hashes after removing each object's own hash field; pack digest includes constraints and obligation." : "Reconstruct only disclosed source bytes, facts, checks and decision actions. Original hashes identify withheld originals; they do not assert reconstruction of removed bytes. Use payloadHash to verify this materialized projection.",
    },
    limitations: [
      "Synthetic fixture only. This is neither real legal applicability nor procurement authorization.",
      "This export neither publishes the record nor grants access to an underlying source or prior unit.",
      "Prior unit identifiers are provenance links; their complete historical payloads are outside this current-unit export.",
      "A downloaded copy cannot be recalled. Future downloads require a valid current grant and membership.",
    ],
  };
  return { payload, payloadHash: hashJson(payload), hashMethod: "sha256:sorted-json-v1" as const };
}

export type TraceExport = ReturnType<typeof buildTraceExport>;
