import { DeskAccessError, freezeUploadedPacket } from '@/lib/desk/freeze-upload'
import { readDeskPacket } from '@/lib/desk/packet'
import { extractionResultSchema } from '@/lib/field-registry/extract'
import { extractParsedUpload, extractionHttpError } from '@/lib/field-registry/extract-upload'
import { DonorPackError } from '@/lib/field-registry/packs'
import { FieldRegistryError } from '@/lib/field-registry/freeze'
import { JudgmentError } from '@/lib/field-registry/judgment'
import { requireTraceViewer, TraceAccessError } from '@/lib/trace/access'
import { privateHeaders } from '@/lib/trace/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
/** Poll budget is 170s, including one 20s extension. 180s lets that call finish with its own error. */
export const maxDuration = 180

/**
 * Thin wrapper around the same extraction provider as POST /api/extract.
 * Organization and actor come from the Trace session. File bytes are hashed
 * by the provider and are not written onto the frozen record.
 */
export async function POST(request: Request) {
  try {
    const viewer = await requireTraceViewer()
    const packet = await readDeskPacket(request)
    const extraction = extractionResultSchema.parse(await extractParsedUpload({
      fileName: packet.fileName,
      mediaType: packet.mediaType,
      bytes: packet.bytes,
      ...(packet.awardId ? { awardId: packet.awardId } : {}),
    }, { organizationId: viewer.organizationId }))
    const outcome = freezeUploadedPacket({
      extraction,
      packId: packet.packId,
      organizationId: viewer.organizationId,
      actorId: viewer.id,
      actorRole: viewer.role,
      ...(packet.procurementReference ? { procurementReference: packet.procurementReference } : {}),
    })
    return Response.json(outcome.view, { headers: privateHeaders })
  } catch (error) {
    if (error instanceof TraceAccessError || error instanceof DeskAccessError) {
      return Response.json({ error: error.message }, { status: 403, headers: privateHeaders })
    }
    if (error instanceof DonorPackError || error instanceof FieldRegistryError || error instanceof JudgmentError) {
      return Response.json(
        { error: 'The packet could not be frozen. Check the donor pack and try again.' },
        { status: 400, headers: privateHeaders },
      )
    }
    return extractionHttpError(error)
  }
}
