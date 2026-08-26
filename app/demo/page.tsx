import type { Metadata } from 'next'

import TenderWorkbench from '@/components/tender-workbench'
import { demoWorkspaceViewer } from '@/lib/workspace-viewer'

export const metadata: Metadata = {
  title: 'Interactive demo — Traceli',
  description: 'Explore Traceli with a clearly labelled fictional procurement scenario.',
}

export default function DemoWorkspacePage() {
  return (
    <TenderWorkbench
      initialView="overview"
      viewer={demoWorkspaceViewer}
      workspaceMode
    />
  )
}
