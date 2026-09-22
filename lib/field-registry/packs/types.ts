import type { JudgmentRule } from '@/lib/field-registry/judgment'
import type { PackToggle } from '@/lib/field-registry/schema'

/**
 * Trace-owned donor / prime rule packs.
 * Rules run through evaluateJudgment against Field Registry keys only.
 */
export const donorPackIds = ['global-fund', 'fcdo-prime'] as const

export type DonorPackId = (typeof donorPackIds)[number]

export type DonorPackAudience =
  | 'global-fund-pr-sr'
  | 'fcdo-commercial-prime'

export type DonorPack = {
  /** Stable id used as PackToggle.packId and Rule library catalog id. */
  packId: DonorPackId
  version: string
  name: string
  /** One-line eng audience note — not marketing copy. */
  audience: DonorPackAudience
  category: 'donor'
  /** Deterministic checks; max 64 when composed into evaluateJudgment. */
  rules: readonly JudgmentRule[]
}

export function packToggleForDonorPack(pack: DonorPack, options?: {
  showOnRecord?: boolean
}): PackToggle {
  return {
    packId: pack.packId,
    version: pack.version,
    name: pack.name,
    toggledScope: {
      orgDefault: true,
      showOnRecord: options?.showOnRecord ?? true,
      category: pack.category,
    },
  }
}
