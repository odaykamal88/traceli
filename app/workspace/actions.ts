'use server'

import { revalidatePath } from 'next/cache'

import { recordFindingDetermination } from '@/lib/domain/finding-commands'
import { getWorkspaceViewer } from '@/lib/workspace-access'

export async function confirmClarificationAction(input: {
  findingId: string
  expectedVersion: number
}) {
  if (!input || typeof input.findingId !== 'string' || !Number.isInteger(input.expectedVersion)) {
    throw new Error('Invalid clarification request.')
  }

  const viewer = await getWorkspaceViewer()
  const result = await recordFindingDetermination(viewer, {
    findingId: input.findingId,
    expectedVersion: input.expectedVersion,
    determination: 'satisfied',
    reason:
      'Reviewer confirmed that the attached Ethiopia distribution plan satisfies the country-specific capacity requirement.',
  })

  revalidatePath('/workspace')

  return {
    success: true as const,
    findingVersion: result.findingVersion,
    auditSequence: result.auditSequence,
  }
}
