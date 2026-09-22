import type { AwardRegistrySnapshot, PackToggle, PipelineStatus } from '@/lib/field-registry/schema'

/**
 * P3 playbook runtime boundary. Types only.
 * `evaluate` reads registry fields and pack toggles. It has no file-byte parameter.
 */
export type PlaybookInput = {
  snapshot: AwardRegistrySnapshot
  packs: readonly PackToggle[]
}

export type PlaybookEvaluate = (input: PlaybookInput) => PipelineStatus
