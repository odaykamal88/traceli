import type { TenderSummary } from './contract'

export type TenderWorkflowState =
  | 'no_packet'
  | 'packet_ready'
  | 'correction_incomplete'
  | 'review_ready'
  | 'assessment_current'
  | 'human_decision_current'
  | 'exception_proposed'
  | 'unknown'

export type TenderWorkflowCapabilities = { canEdit: boolean; canAssess: boolean; canJudge: boolean }

/** Receives only integrity-checked current state, never historical record counts. */
export function tenderProgress(state: TenderWorkflowState, capabilities: TenderWorkflowCapabilities, fixtureIngestion: boolean): TenderSummary['progress'] {
  switch (state) {
    case 'no_packet': return { stage: 'evidence', status: 'No packet retained', nextAction: capabilities.canEdit && fixtureIngestion ? 'Add a synthetic fixture packet' : 'View evidence', section: 'evidence' }
    case 'packet_ready': return { stage: 'review', status: 'Packet retained · review not saved', nextAction: capabilities.canEdit ? 'Choose packet and review checklist' : 'View packet checklist', section: 'evidence' }
    case 'correction_incomplete': return { stage: 'review', status: 'Saved review has incomplete corrections', nextAction: capabilities.canEdit ? 'Complete checklist corrections' : 'View checklist corrections', section: 'review' }
    case 'review_ready': return { stage: 'review', status: 'Saved review ready for assessment', nextAction: capabilities.canAssess ? 'Issue assessment' : 'View saved review', section: capabilities.canAssess ? 'decision' : 'review' }
    case 'assessment_current': return { stage: 'decision', status: 'Assessment issued · human decision needed', nextAction: capabilities.canJudge ? 'Review assessment and record decision' : 'View assessment', section: 'decision' }
    case 'human_decision_current': return { stage: 'record', status: 'Human decision recorded', nextAction: 'View decision record', section: 'record' }
    case 'exception_proposed': return { stage: 'record', status: 'Exception proposed · approval not recorded', nextAction: 'View exception proposal', section: 'record' }
    default: return { stage: 'review', status: 'Current progress unavailable', nextAction: 'View workspace', section: 'review' }
  }
}

/** A membership identifier is a label fallback, not a verified personal name. */
export function tenderOwner(ownerId: string, viewerId: string): TenderSummary['owner'] {
  // FNV-1a keeps the fallback short and stable without exposing a partial identity.
  let identifier = 2166136261
  for (let index = 0; index < ownerId.length; index++) identifier = Math.imul(identifier ^ ownerId.charCodeAt(index), 16777619)
  const isCurrentUser = ownerId === viewerId
  return { id: ownerId, label: isCurrentUser ? 'You' : `Member ${(identifier >>> 0).toString(16).padStart(8, '0')}`, isCurrentUser }
}
