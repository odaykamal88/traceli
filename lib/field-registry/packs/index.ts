import { evaluateJudgment, type JudgmentResult, type JudgmentRule } from '@/lib/field-registry/judgment'
import { FCDO_PRIME_PACK, FCDO_PRIME_RULES } from '@/lib/field-registry/packs/fcdo-prime'
import {
  fcdoPrimeFailSnapshot,
  fcdoPrimeIddHitDispositionedSnapshot,
  fcdoPrimeIddHitSnapshot,
  fcdoPrimeIddMissingSnapshot,
  fcdoPrimePassSnapshot,
  globalFundFailSnapshot,
  globalFundIddHitDispositionedSnapshot,
  globalFundIddHitSnapshot,
  globalFundIddMissingSnapshot,
  globalFundPassSnapshot,
  ochaCbpfFailSnapshot,
  ochaCbpfPassSnapshot,
  unfpaFailSnapshot,
  unfpaPassSnapshot,
} from '@/lib/field-registry/packs/fixtures'
import { GLOBAL_FUND_PACK, GLOBAL_FUND_RULES } from '@/lib/field-registry/packs/global-fund'
import { OCHA_CBPF_PACK, OCHA_CBPF_RULES } from '@/lib/field-registry/packs/ocha-cbpf'
import { UNFPA_PACK, UNFPA_RULES } from '@/lib/field-registry/packs/unfpa'
import {
  donorPackIds,
  packToggleForDonorPack,
  type DonorPack,
  type DonorPackId,
} from '@/lib/field-registry/packs/types'
import type { AwardRegistrySnapshot, PackToggle, PipelineStatus } from '@/lib/field-registry/schema'

export { FCDO_PRIME_FIELD_KEYS, FCDO_PRIME_PACK, FCDO_PRIME_RULES } from '@/lib/field-registry/packs/fcdo-prime'
export {
  fcdoPrimeFailSnapshot,
  fcdoPrimeIddHitDispositionedSnapshot,
  fcdoPrimeIddHitSnapshot,
  fcdoPrimeIddMissingSnapshot,
  fcdoPrimePassSnapshot,
  globalFundFailSnapshot,
  globalFundIddHitDispositionedSnapshot,
  globalFundIddHitSnapshot,
  globalFundIddMissingSnapshot,
  globalFundPassSnapshot,
} from '@/lib/field-registry/packs/fixtures'
export { GLOBAL_FUND_FIELD_KEYS, GLOBAL_FUND_PACK, GLOBAL_FUND_RULES } from '@/lib/field-registry/packs/global-fund'
export { OCHA_CBPF_FIELD_KEYS, OCHA_CBPF_PACK, OCHA_CBPF_RULES } from '@/lib/field-registry/packs/ocha-cbpf'
export { UNFPA_FIELD_KEYS, UNFPA_PACK, UNFPA_RULES } from '@/lib/field-registry/packs/unfpa'
export {
  ochaCbpfFailSnapshot,
  ochaCbpfPassSnapshot,
  unfpaFailSnapshot,
  unfpaPassSnapshot,
} from '@/lib/field-registry/packs/fixtures'
export {
  donorPackIds,
  packToggleForDonorPack,
  type DonorPack,
  type DonorPackAudience,
  type DonorPackId,
} from '@/lib/field-registry/packs/types'

const packsById: Record<DonorPackId, DonorPack> = {
  'global-fund': GLOBAL_FUND_PACK,
  'fcdo-prime': FCDO_PRIME_PACK,
  unfpa: UNFPA_PACK,
  'ocha-cbpf': OCHA_CBPF_PACK,
}

export class DonorPackError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DonorPackError'
  }
}

export function listDonorPacks(): readonly DonorPack[] {
  return donorPackIds.map(id => packsById[id])
}

export function getDonorPack(packId: string): DonorPack {
  if (!donorPackIds.includes(packId as DonorPackId)) {
    throw new DonorPackError(`Unknown donor pack id: ${packId}`)
  }
  return packsById[packId as DonorPackId]
}

export function isDonorPackId(packId: string): packId is DonorPackId {
  return donorPackIds.includes(packId as DonorPackId)
}

/** Rules for one pack, or a stable merge when several donor packs are selected. */
export function rulesForDonorPackIds(packIds: readonly string[]): JudgmentRule[] {
  const seen = new Set<string>()
  const rules: JudgmentRule[] = []
  for (const packId of packIds) {
    if (!isDonorPackId(packId)) continue
    for (const rule of getDonorPack(packId).rules) {
      if (seen.has(rule.ruleId)) continue
      seen.add(rule.ruleId)
      rules.push(rule)
    }
  }
  return rules
}

export function rulesForPackToggles(packs: readonly PackToggle[]): JudgmentRule[] {
  return rulesForDonorPackIds(packs.map(pack => pack.packId))
}

/**
 * Run evaluateJudgment with the selected donor pack(s).
 * Unknown pack ids are ignored so synthetic shelter packs stay harmless.
 */
export function evaluateDonorPacks(
  snapshot: AwardRegistrySnapshot | unknown,
  packIds: readonly DonorPackId[] | readonly string[],
  options?: { evaluatedAt?: string },
): JudgmentResult {
  const rules = rulesForDonorPackIds([...packIds])
  if (rules.length === 0) {
    throw new DonorPackError('evaluateDonorPacks requires at least one known donor pack id.')
  }
  return evaluateJudgment(snapshot, rules, options)
}

/** Convenience: judgment for a single selectable pack id. */
export function evaluateDonorPack(
  snapshot: AwardRegistrySnapshot | unknown,
  packId: DonorPackId,
  options?: { evaluatedAt?: string },
): JudgmentResult {
  return evaluateDonorPacks(snapshot, [packId], options)
}

export function packToggleForId(packId: DonorPackId): PackToggle {
  return packToggleForDonorPack(getDonorPack(packId))
}

/** Fixture snapshots keyed by pack + expected outcome. */
export const donorPackFixtures = {
  'global-fund': {
    pass: globalFundPassSnapshot,
    fail: globalFundFailSnapshot,
    rules: GLOBAL_FUND_RULES,
    pack: GLOBAL_FUND_PACK,
  },
  'fcdo-prime': {
    pass: fcdoPrimePassSnapshot,
    fail: fcdoPrimeFailSnapshot,
    rules: FCDO_PRIME_RULES,
    pack: FCDO_PRIME_PACK,
  },
  unfpa: {
    pass: unfpaPassSnapshot,
    fail: unfpaFailSnapshot,
    rules: UNFPA_RULES,
    pack: UNFPA_PACK,
  },
  'ocha-cbpf': {
    pass: ochaCbpfPassSnapshot,
    fail: ochaCbpfFailSnapshot,
    rules: OCHA_CBPF_RULES,
    pack: OCHA_CBPF_PACK,
  },
} as const

/** PipelineStatus-only adapter used by PlaybookEvaluate. */
export function pipelineStatusForDonorPacks(
  snapshot: AwardRegistrySnapshot,
  packs: readonly PackToggle[],
): PipelineStatus {
  const rules = rulesForPackToggles(packs)
  if (rules.length === 0) {
    return {
      schemaVersion: 'pipeline-status-v1',
      deterministicFlags: [],
      semanticAnomalyIds: [],
      readiness: 'unknown',
    }
  }
  return evaluateJudgment(snapshot, rules).pipelineStatus
}
