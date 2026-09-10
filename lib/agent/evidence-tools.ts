import 'server-only'

import { z } from 'zod'
import { EvidenceUnavailableError, readEvidenceRecord } from '@/lib/domain/evidence-reads'
import type { WorkspaceViewer } from '@/lib/workspace-viewer'

const identifier = z.string().regex(/^[a-zA-Z0-9_-]{1,160}$/)
const citationSchema = z.object({
  id: z.string().min(1).max(400), requirementId: identifier, documentId: identifier,
  sourceVersionId: identifier, recordedContentHash: z.string().regex(/^[a-f0-9]{64}$/),
  anchor: z.string().min(1).max(500),
}).strict()
const requestSchema = z.discriminatedUnion('tool', [
  z.object({ tool: z.literal('get_evidence_record'), arguments: z.object({ procurementId: identifier }).strict() }).strict(),
  z.object({ tool: z.literal('verify_evidence_citation'), arguments: z.object({
    procurementId: identifier, citation: citationSchema,
  }).strict() }).strict(),
])

export const evidenceToolNames = ['get_evidence_record', 'verify_evidence_citation'] as const

// The viewer comes from a trusted host binding, NEVER from tool arguments.
// No mutation service, arbitrary URL fetch, file path or SQL tool is exposed.
export async function callEvidenceTool(viewer: WorkspaceViewer, input: unknown) {
  const parsed = requestSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'invalid_or_denied_tool_request' }
  try {
    const request = parsed.data
    const record = await readEvidenceRecord(viewer, request.arguments.procurementId)
    if (request.tool === 'get_evidence_record') return { ok: true as const, result: record }
    const candidate = request.arguments.citation
    const matchesStoredReference = record.data.citations.some((citation) =>
      Object.entries(candidate).every(([key, value]) => citation[key as keyof typeof candidate] === value),
    )
    return { ok: true as const, result: {
      matchesStoredReference,
      meaning: 'Exact reference match only; source content and procurement judgment are not verified.',
    } }
  } catch (error) {
    return { ok: false as const, error: error instanceof EvidenceUnavailableError
      ? 'evidence_unavailable' : 'read_failed' }
  }
}
