import { notFound } from 'next/navigation'
import { requireTraceViewer, TraceAccessError } from '@/lib/trace/access'
import TraceWorkbench from './workbench'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Trace a decision', robots: { index: false, follow: false } }

export default async function TracePage() {
  try {
    const viewer = await requireTraceViewer()
    return <TraceWorkbench role={viewer.role} local={viewer.mode === 'demo'} />
  } catch (error) {
    if (error instanceof TraceAccessError) notFound()
    throw error
  }
}
