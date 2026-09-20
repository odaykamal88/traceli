import { z } from 'zod'
import { requireTraceViewer } from '@/lib/trace/access'
import { createTraceUnit, listTraceUnits, readTraceUnit, recordTraceDecision, createTraceExport, revokeTraceExport } from '@/lib/trace/store'
import { privateHeaders, readTraceCommand, traceHttpError } from '@/lib/trace/http'
import { idSchema } from '@/lib/trace/contract'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const querySchema = z.strictObject({ unitId: z.uuid().optional(), sourceId: idSchema.optional() })
const commandSchema = z.strictObject({ operation: z.enum(['create', 'decide', 'grant', 'revoke']), input: z.unknown() })

export async function GET(request: Request) {
  try {
    const viewer = await requireTraceViewer()
    const parameters = new URL(request.url).searchParams
    if (new Set(parameters.keys()).size !== parameters.size) throw new z.ZodError([])
    const query = querySchema.parse(Object.fromEntries(parameters))
    if (query.sourceId && !query.unitId) throw new z.ZodError([])
    if (!query.unitId) return Response.json(await listTraceUnits(viewer), { headers: privateHeaders })
    const record = await readTraceUnit(viewer, query.unitId)
    if (query.sourceId) {
      const source = record.unit.sourceVersions.find(s => s.id === query.sourceId)
      if (!source) return Response.json({ error: 'Source unavailable.' }, { status: 404, headers: privateHeaders })
      return Response.json(source, { headers: privateHeaders })
    }
    return Response.json(record, { headers: privateHeaders })
  } catch (error) { return traceHttpError(error) }
}

export async function POST(request: Request) {
  try {
    const viewer = await requireTraceViewer()
    const command = commandSchema.parse(await readTraceCommand(request))
    let result: unknown
    switch (command.operation) {
      case 'create': result = await createTraceUnit(viewer, command.input); break
      case 'decide': result = await recordTraceDecision(viewer, command.input); break
      case 'grant': result = await createTraceExport(viewer, command.input); break
      case 'revoke': {
        const { grantId } = z.strictObject({ grantId: z.uuid() }).parse(command.input)
        result = await revokeTraceExport(viewer, grantId)
      }
    }
    return Response.json(result, { headers: privateHeaders })
  } catch (error) { return traceHttpError(error) }
}
