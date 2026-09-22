import 'server-only'

export {
  actorRoles,
  awardDeskDecisionIds,
  awardRegistrySnapshotSchema,
  deterministicFlagSchema,
  dispositionDecisions,
  dispositionSchema,
  donorRefSchema,
  entityKinds,
  fieldProvenanceSchema,
  fieldValueSchema,
  fieldValueStates,
  fragmentSchema,
  frameworkRefSchema,
  freezeAtJudgmentInputSchema,
  frozenDecisionRecordSchema,
  hashSchema,
  idSchema,
  packInForceSchema,
  packToggleSchema,
  pipelineStatusSchema,
  readinessLevels,
  registryFieldSchema,
  snapshotClassifications,
  sourceRefKinds,
  sourceRefSchema,
  toggledScopeSchema,
  verificationMethods,
  waiverRefSchema,
} from '@/lib/field-registry/schema'

export type {
  ActorRole,
  AwardDeskDecisionId,
  AwardRegistrySnapshot,
  Disposition,
  FieldProvenance,
  FieldValue,
  Fragment,
  FreezeAtJudgmentInput,
  FrozenDecisionRecordBody,
  PackInForce,
  PackToggle,
  PipelineStatus,
  RegistryField,
  SourceRef,
  ToggledScope,
  WaiverRef,
} from '@/lib/field-registry/schema'

export {
  FIELD_REGISTRY_HASH_METHOD,
  FieldRegistryError,
  canonicalJson,
  dispositionFromAwardDeskDecision,
  freezeAtJudgment,
  hashJson,
  packToggleFromRulePack,
  snapshotHashOf,
  verifyFrozenRecord,
} from '@/lib/field-registry/freeze'

export type { FrozenDecisionRecord } from '@/lib/field-registry/freeze'
export type { ExtractionAdapter, RawFile } from '@/lib/field-registry/extract'
export type { PlaybookEvaluate, PlaybookInput } from '@/lib/field-registry/playbook'
