import type { Metadata } from 'next'
import Link from 'next/link'
import TenderWorkbench from '@/components/tender-workbench'
import { demoWorkspaceViewer } from '@/lib/workspace-viewer'

export const metadata: Metadata = { title: 'Classic procurement walkthrough', robots: { index: false, follow: true } }

export default function ClassicDemoPage() {
  return <>
    <div className="flex flex-wrap items-center justify-center gap-3 bg-[#071d39] px-4 py-3 text-center text-sm text-white">
      <span>Earlier fictional procurement walkthrough</span>
      <Link href="/demo" className="font-semibold text-[#8be1cf] underline underline-offset-4">Open the current Trace demo →</Link>
    </div>
    <TenderWorkbench initialView="overview" viewer={demoWorkspaceViewer} workspaceMode />
  </>
}
