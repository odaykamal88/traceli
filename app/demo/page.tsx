import type { Metadata } from 'next'
import { buildPublicDemoPacket } from '@/lib/trace/public-demo-data'
import PublicTraceDemo from './public-trace-demo'

export const metadata: Metadata = {
  title: 'Trace an award decision — interactive demo',
  description: 'Follow fictional evidence through a rule check, human review and downloadable Trace record. Try the current Traceli workflow in your browser.',
  alternates: { canonical: '/demo' },
}

export default function DemoPage() {
  return <PublicTraceDemo packet={buildPublicDemoPacket()} />
}
