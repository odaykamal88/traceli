import TenderWorkbench from '@/components/tender-workbench'
import { getWorkspaceViewer } from '@/lib/workspace-access'

export const dynamic = 'force-dynamic'

export default async function WorkspacePage() {
  const viewer = await getWorkspaceViewer()

  return <TenderWorkbench initialView="portfolio" viewer={viewer} workspaceMode />
}
