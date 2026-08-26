export type WorkspaceSnapshot = {
  organization: {
    id: string
    name: string
  }
  procurement: {
    id: string
    reference: string
    title: string
    region: string
    status: string
    evidenceCoverage: number
    blockerSummary: string
    version: number
  }
  primaryFinding: {
    id: string
    status: string
    version: number
  } | null
  assurance: {
    requirementCount: number
    openFindingCount: number
    auditEventCount: number
    lastEventAt: string | null
  }
  source: 'postgres'
}
