import { requireTraceViewer, TraceAccessError } from '@/lib/trace/access'
import { privateHeaders } from '@/lib/trace/http'
import { extractionResultSchema } from '@/lib/field-registry/extract'
import { extractUploadedFile, extractionHttpError } from '@/lib/field-registry/extract-upload'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const viewer = await requireTraceViewer()
    const result = extractionResultSchema.parse(await extractUploadedFile(request, {
      organizationId: viewer.organizationId,
    }))
    return Response.json(result, { headers: privateHeaders })
  } catch (error) {
    if (error instanceof TraceAccessError) {
      return Response.json({ error: error.message }, { status: 403, headers: privateHeaders })
    }
    return extractionHttpError(error)
  }
}
