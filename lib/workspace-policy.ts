// Shared role vocabulary for authenticated workspace access and read adapters.
export const workspaceRoleLabels: Record<string, string> = {
  'procurement-officer': 'Procurement Officer',
  'panel-member': 'Panel Member',
  'procurement-director': 'Procurement Director',
  auditor: 'Auditor',
  'workspace-admin': 'Workspace Admin',
}

export function hasWorkspaceReadRole(role: string) {
  return Object.values(workspaceRoleLabels).includes(role)
}
