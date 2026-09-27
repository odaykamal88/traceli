import { readDeskFreezeBody } from '@/lib/desk/freeze-body'
import { DeskAccessError, freezeReviewedPacket } from '@/lib/desk/freeze-upload'
import { DeskReviewError } from '@/lib/desk/review-apply'
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
 * Freeze a reviewed checklist. Findings are recomputed from the reviewed snapshot.
 * Organization and reviewer id come from the session.
 */
export async function POST(request: Request) {
  try {
    const viewer = await requireTraceViewer()
    const body = await readDeskFreezeBody(request)
    const outcome = freezeReviewedPacket({
      checklist: body.checklist,
      decisions: body.decisions,
      organizationId: viewer.organizationId,
      actorId: viewer.id,
      actorRole: viewer.role,
    })
    return Response.json(outcome.view, { headers: privateHeaders })
  } catch (error) {
    if (error instanceof TraceAccessError || error instanceof DeskAccessError || error instanceof ExtractionAccessError) {
      return Response.json(
        { error: error instanceof ExtractionAccessError ? 'This checklist is unavailable for this request.' : error.message },
        { status: 403, headers: privateHeaders },
      )
    }
    if (error instanceof DeskReviewError) {
      return Response.json({ error: error.message }, { status: 400, headers: privateHeaders })
    }
    if (error instanceof DonorPackError || error instanceof FieldRegistryError || error instanceof JudgmentError || error instanceof ZodError) {
      return Response.json(
        { error: 'The checklist could not be frozen. Extract the packet again.' },
        { status: 400, headers: privateHeaders },
      )
    }
    return Response.json(
      { error: 'The checklist could not be frozen. Try again.' },
      { status: 500, headers: privateHeaders },
    )
  }
}
