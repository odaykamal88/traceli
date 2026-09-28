import TenderWorkbench from '@/components/tender-workbench'
import {
  getWorkspaceSnapshot,
  WorkspaceDataUnavailableError,
} from '@/lib/dal/workspace'
import { getWorkspaceViewer } from '@/lib/workspace-access'
import { redirect } from 'next/navigation'
import { tenderWorkspacesEnabled } from '@/lib/tenders/config'

export const dynamic = 'force-dynamic'

export default async function WorkspacePage() {
  if (tenderWorkspacesEnabled()) redirect('/work')
  const viewer = await getWorkspaceViewer()
  let workspaceSnapshot

  try {
    workspaceSnapshot = await getWorkspaceSnapshot(viewer)
  } catch (error) {
    if (error instanceof WorkspaceDataUnavailableError) {
      redirect('/workspace/setup-required')
    }

    throw error
  }

  return (
    <TenderWorkbench
      initialView="overview"
      viewer={viewer}
      workspaceMode
      workspaceSnapshot={workspaceSnapshot}
    />
  )
}
