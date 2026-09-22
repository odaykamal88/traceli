import { pipelineStatusForDonorPacks } from '@/lib/field-registry/packs'
import type { AwardRegistrySnapshot, PackToggle, PipelineStatus } from '@/lib/field-registry/schema'

/**
 * P3 playbook runtime boundary.
 * `evaluate` reads registry fields and pack toggles. It has no file-byte parameter.
 * Donor packs (`global-fund` | `fcdo-prime`) resolve to JudgmentRule[] and run through
 * evaluateJudgment — same Finding / JudgmentResult / freeze path as P4.
 */
export type PlaybookInput = {
  snapshot: AwardRegistrySnapshot
  packs: readonly PackToggle[]
}

export type PlaybookEvaluate = (input: PlaybookInput) => PipelineStatus

/**
 * Thin playbook evaluator: donor packs in `packs` become judgment rules.
 * Non-donor toggles (synthetic shelter, org manuals) do not contribute rules here;
 * readiness stays `unknown` when no donor pack is selected.
 */
export const evaluatePlaybook: PlaybookEvaluate = (input) => {
  return pipelineStatusForDonorPacks(input.snapshot, input.packs)
}
