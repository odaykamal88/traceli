import { DeskAccessError, prepareUploadChecklist } from '@/lib/desk/freeze-upload'
import { readDeskPacket } from '@/lib/desk/packet'
import { extractionResultSchema } from '@/lib/field-registry/extract'
import { extractParsedUpload, extractionHttpError } from '@/lib/field-registry/extract-upload'
import { DonorPackError } from '@/lib/field-registry/packs'
import { FieldRegistryError } from '@/lib/field-registry/freeze'
import { requireTraceViewer, TraceAccessError } from '@/lib/trace/access'
import { privateHeaders } from '@/lib/trace/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
/** Poll budget is 170s, including one 20s extension. 180s lets that call finish with its own error. */
export const maxDuration = 180

/**
 * Extract a packet into a checklist. Does not freeze.
 * Organization comes from the Trace session. File bytes are not returned.
 */
export async function POST(request: Request) {
  try {
    const viewer = await requireTraceViewer()
    const packet = await readDeskPacket(request)
    const extraction = extractionResultSchema.parse(await extractParsedUpload({
      fileName: packet.fileName,
      mediaType: packet.mediaType,
      bytes: packet.bytes,
      packId: packet.packId,
      ...(packet.awardId ? { awardId: packet.awardId } : {}),
    }, { organizationId: viewer.organizationId }))
    const checklist = prepareUploadChecklist({
      extraction,
      packId: packet.packId,
      organizationId: viewer.organizationId,
      ...(packet.procurementReference ? { procurementReference: packet.procurementReference } : {}),
    })
    return Response.json(checklist, { headers: privateHeaders })
  } catch (error) {
    if (error instanceof TraceAccessError || error instanceof DeskAccessError) {
      return Response.json({ error: error.message }, { status: 403, headers: privateHeaders })
    }
    if (error instanceof DonorPackError || error instanceof FieldRegistryError) {
      return Response.json(
        { error: 'The packet could not be read into a checklist. Check the donor pack and try again.' },
        { status: 400, headers: privateHeaders },
      )
    }
    return extractionHttpError(error)
  }
}
