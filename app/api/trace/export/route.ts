import { z } from 'zod'
import { requireTraceViewer } from '@/lib/trace/access'
import { downloadTraceExport } from '@/lib/trace/store'
import { privateHeaders, traceHttpError } from '@/lib/trace/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  try {
    const viewer = await requireTraceViewer()
    const parameters = new URL(request.url).searchParams
    if (parameters.size !== 1) throw new z.ZodError([])
    const { grantId } = z.strictObject({ grantId: z.uuid() }).parse(Object.fromEntries(parameters))
    const payload = await downloadTraceExport(viewer, grantId)
    return new Response(JSON.stringify(payload, null, 2), {
      headers: { ...privateHeaders, 'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="traceli-synthetic-${grantId}.json"` },
    })
  } catch (error) { return traceHttpError(error) }
}
