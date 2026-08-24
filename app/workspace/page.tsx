import TenderWorkbench from '@/components/tender-workbench'
import { getWorkspaceViewer } from '@/lib/workspace-access'

export const dynamic = 'force-dynamic'

export default async function WorkspacePage() {
  const viewer = await getWorkspaceViewer()
  const initialView = viewer.role.toLowerCase().includes('officer') ? 'overview' : 'portfolio'

  return <TenderWorkbench initialView={initialView} viewer={viewer} workspaceMode />
}
