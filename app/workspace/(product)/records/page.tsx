import type { Metadata } from 'next'
import DecisionRecords from './records-view'

export const metadata: Metadata = {
  title: 'Decision records',
  description: 'Frozen governing packs from Award desk dispositions.',
  robots: { index: false, follow: false },
}

export default function DecisionRecordsPage() {
  return <DecisionRecords />
}
