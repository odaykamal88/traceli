import { readDeskJudgmentBody } from '@/lib/desk/disposition-body'
import { DeskAccessError, supersedeUploadedPacket } from '@/lib/desk/freeze-upload'
import { DeskJudgmentError } from '@/lib/desk/judgment'
import { ExtractionAccessError } from '@/lib/field-registry/extract'
import { FieldRegistryError } from '@/lib/field-registry/freeze'
import { JudgmentError } from '@/lib/field-registry/judgment'
import { DonorPackError } from '@/lib/field-registry/packs'
import { requireTraceViewer, TraceAccessError } from '@/lib/trace/access'
import { privateHeaders } from '@/lib/trace/http'
import { ZodError } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Record a human disposition as a new verified freeze.
 * Organization and actor come from the session. The assessment snapshot is
 * rehydrated from the client souvenir; this route does not store file bytes.
 */
export async function POST(request: Request) {
  try {
    const viewer = await requireTraceViewer()
    const body = await readDeskJudgmentBody(request)
    const outcome = supersedeUploadedPacket({
      view: body.view,
      decision: body.decision,
      reason: body.reason,
      organizationId: viewer.organizationId,
      actorId: viewer.id,
      actorRole: viewer.role,
    })
    return Response.json(outcome.judgment, { headers: privateHeaders })
  } catch (error) {
    if (error instanceof TraceAccessError || error instanceof DeskAccessError || error instanceof ExtractionAccessError) {
      return Response.json(
        { error: error instanceof ExtractionAccessError ? 'This judgment is unavailable for this request.' : error.message },
        { status: 403, headers: privateHeaders },
      )
    }
    if (error instanceof DeskJudgmentError) {
      return Response.json({ error: error.message }, { status: 400, headers: privateHeaders })
    }
    if (error instanceof DonorPackError || error instanceof FieldRegistryError || error instanceof JudgmentError || error instanceof ZodError) {
      return Response.json(
        { error: 'The judgment could not be frozen. Extract the packet again.' },
        { status: 400, headers: privateHeaders },
      )
    }
    return Response.json(
      { error: 'The judgment could not be frozen. Try again.' },
      { status: 500, headers: privateHeaders },
    )
  }
}
