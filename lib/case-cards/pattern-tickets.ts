import { patternTicketSchema, type PatternTicket } from '@/lib/field-registry/case-card'

/**
 * Minimal Pattern ticket store. Stable ids are the contract for later
 * pack, registry, and judgment changes. Status `stub` means the ticket
 * is seeded from a public case and has not been accepted into a pack.
 */
const patternTickets = patternTicketSchema.array().parse([
  {
    schemaVersion: 'pattern-ticket-v1',
    ticketId: 'pt:gf-oig-25-005:competition-exception-docs',
    title: 'Competition or exemption must be on the file',
    statement:
      'When a restricted or single-source method is used, the file needs the exemption and the authorization before signature. GF-OIG-25-005 §4.4 found three such awards were not consistently documented, including files that lacked the justifying authorization.',
    status: 'stub',
    packId: 'global-fund',
    ruleId: 'gf_procurement_competition_docs',
    fieldKey: 'procurement.competition_or_exemption_documented',
    sourceCaseSlugs: ['gf-oig-25-005'],
  },
  {
    schemaVersion: 'pattern-ticket-v1',
    ticketId: 'pt:gf-oig-25-005:procurement-file-completeness',
    title: 'Execution file: delivery, reception, validation',
    statement:
      'A non-health procurement file should show delivery to the final user, reception, and validation of works. The Global Fund pack checks award rationale, not this execution file. Seeded from the €2.7 million incomplete-file sample in GF-OIG-25-005 §4.4.',
    status: 'stub',
    packId: 'global-fund',
    ruleId: null,
    fieldKey: 'procurement.file_completeness',
    sourceCaseSlugs: ['gf-oig-25-005'],
  },
  {
    schemaVersion: 'pattern-ticket-v1',
    ticketId: 'pt:gf-oig-25-005:extension-authority',
    title: 'Contract extension needs a named authorizer',
    statement:
      'An extension needs a named authorizing authority and a record of that authorization, not only a manual clause on duration and cost. Seeded from GF-OIG-25-005 §4.4, where 30% of extensions ran for as long as 18 months.',
    status: 'stub',
    packId: 'global-fund',
    ruleId: null,
    fieldKey: 'procurement.extension_authority_documented',
    sourceCaseSlugs: ['gf-oig-25-005'],
  },
])

const byId = new Map(patternTickets.map(ticket => [ticket.ticketId, ticket]))

export function listPatternTickets(): readonly PatternTicket[] {
  return patternTickets
}

export function getPatternTicket(ticketId: string): PatternTicket | undefined {
  return byId.get(ticketId)
}

/** Resolve ids in the caller’s order. Throws if any id is missing. */
export function patternTicketsFor(ticketIds: readonly string[]): PatternTicket[] {
  return ticketIds.map(ticketId => {
    const ticket = byId.get(ticketId)
    if (!ticket) throw new Error(`Unknown pattern ticket: ${ticketId}`)
    return ticket
  })
}
