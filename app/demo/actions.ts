'use server'

import {
  sanitizeFrozenRecordView,
  type AwardDeskFrozenRecordView,
  type FrozenGoverningPack,
} from '@/lib/award-desk'
import { freezeAwardDeskDisposition } from '@/lib/field-registry/award-desk-freeze'

/**
 * Public demo only. Freezes the fictional RFP-2026-041 registry snapshot
 * at disposition. Does not persist a tenant record or accept uploads.
 */
export async function freezeAwardDeskDispositionAction(input: {
  decision: string
  reason: string
  governingPacks?: FrozenGoverningPack[]
}): Promise<AwardDeskFrozenRecordView> {
  const result = freezeAwardDeskDisposition({
    decision: input.decision,
    reason: input.reason,
    governingPacks: input.governingPacks,
  })
  return sanitizeFrozenRecordView(result.view)
}
