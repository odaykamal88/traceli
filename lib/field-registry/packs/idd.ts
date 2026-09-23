/**
 * Shared IDD vocabulary for donor-pack controls.
 * These are exact registry tokens. They are not sanctions-list entries and
 * they are not a matcher against OFAC, UN, UK, or Swiss names.
 */

export const iddSubjectKinds = ['organization', 'individual'] as const
export const iddScreenResults = ['clear', 'potential_match', 'confirmed_hit', 'unresolved'] as const
export const iddHitResults = ['potential_match', 'confirmed_hit', 'unresolved'] as const
export const iddDispositionDecisions = ['select', 'continue', 'terminate'] as const

export const gfIddSubjectRoles = ['sr', 'supplier', 'signatory', 'key_personnel'] as const
export const gfIddModalities = ['in_house', 'gf_preapproved_vendor', 'other'] as const
export const gfIddScreenTimings = ['before_engagement', 'grant_cycle_rerun'] as const
/** Canonical scope tokens. Prose such as "United Nations" does not match `un`. */
export const gfIddScopeTokens = ['un', 'ofac', 'us-state', 'switzerland', 'debarment', 'ineligibility'] as const
export const gfIddScopeAttestation = 'un ofac us-state switzerland debarment ineligibility'

export const fcdoIddScopeTokens = ['uk-sanctions'] as const
export const fcdoIddScopeAttestation = 'uk-sanctions'
