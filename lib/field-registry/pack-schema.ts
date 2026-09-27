import { getDonorPack } from '@/lib/field-registry/packs'
import { FCDO_PRIME_FIELD_KEYS } from '@/lib/field-registry/packs/fcdo-prime'
import { GLOBAL_FUND_FIELD_KEYS } from '@/lib/field-registry/packs/global-fund'
import { OCHA_CBPF_FIELD_KEYS } from '@/lib/field-registry/packs/ocha-cbpf'
import { UNFPA_FIELD_KEYS } from '@/lib/field-registry/packs/unfpa'
import type { DonorPackId } from '@/lib/field-registry/packs/types'
import type { JudgmentRule } from '@/lib/field-registry/judgment'

/**
 * Pack schema sent to Talonic on the signed-in desk.
 * Talonic quotes. Trace-li decides present, missing, or negative.
 * Properties are not listed as required: a required array makes some
 * Talonic deployments invent a value for every key.
 */

const fieldKeysByPack = {
  'global-fund': GLOBAL_FUND_FIELD_KEYS,
  'fcdo-prime': FCDO_PRIME_FIELD_KEYS,
  unfpa: UNFPA_FIELD_KEYS,
  'ocha-cbpf': OCHA_CBPF_FIELD_KEYS,
} as const

export const TALONIC_PACK_INSTRUCTIONS = [
  'Quote the document. Do not decide whether a control passes.',
  'For each schema key, return a verbatim contiguous quote, or an empty string when the document does not state that control.',
  'Do not paraphrase. Do not guess. Do not fill a key because a related word appears.',
  'If the document says a control is absent, missing, blank, not on file, not met, not approved, or not certified, quote that sentence.',
  'Do not return true, yes, or a satisfied value for a control the document says is absent.',
].join(' ')

export function fieldKeysForDonorPack(packId: DonorPackId): readonly string[] {
  return fieldKeysByPack[packId]
}

/** Human title from the pack rule. The key is the fallback when a rule has no title. */
export function packFieldTitle(packId: DonorPackId, key: string): string {
  return ruleTitle(getDonorPack(packId).rules, key)
}

export function packFieldExpectsBoolean(packId: DonorPackId, key: string): boolean {
  for (const rule of getDonorPack(packId).rules) {
    if ('fieldKey' in rule && rule.fieldKey === key && rule.kind === 'value_must_equal') {
      return typeof rule.expected === 'boolean'
    }
  }
  return false
}

function ruleTitle(rules: readonly JudgmentRule[], key: string) {
  for (const rule of rules) {
    if ('fieldKey' in rule && rule.fieldKey === key && rule.title) return rule.title
  }
  return key
}

export function talonicPackForm(packId: DonorPackId): { schema: string, instructions: string, options: string } {
  const pack = getDonorPack(packId)
  const properties: Record<string, { type: 'string', description: string }> = {}
  for (const key of fieldKeysForDonorPack(packId)) {
    const title = ruleTitle(pack.rules, key)
    properties[key] = {
      type: 'string',
      description: `Verbatim quote for "${title}", or empty if the document does not state it. If the document says this control is absent, quote that absence. Do not return true or yes.`,
    }
  }
  return {
    schema: JSON.stringify({ type: 'object', properties }),
    instructions: TALONIC_PACK_INSTRUCTIONS,
    options: JSON.stringify({ strict: false, include_raw_text: true }),
  }
}
