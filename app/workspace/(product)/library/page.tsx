import type { Metadata } from 'next'
import RuleLibrary from './rule-library'

export const metadata: Metadata = {
  title: 'Rule library',
  description: 'See which governing packs are in force tonight, add a Trace catalog pack, or upload your own.',
  robots: { index: false, follow: false },
}

export default function RuleLibraryPage() {
  return <RuleLibrary />
}
