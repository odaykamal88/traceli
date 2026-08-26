export type WorkspaceViewer = {
  id: string
  name: string
  email: string
  organizationId: string
  role: string
  mode: 'workos' | 'demo'
}

export const demoWorkspaceViewer: WorkspaceViewer = {
  id: 'demo-user-procurement-officer',
  name: 'Leila Mansour',
  email: 'fictional.demo@traceli.app',
  organizationId: 'demo-humanitarian-organization',
  role: 'Procurement Officer',
  mode: 'demo',
}
