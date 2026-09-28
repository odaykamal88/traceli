import { z } from 'zod'
import { createTender, listTenders } from '@/lib/tenders/store'
import { readTenderCommand, requireTenderViewer, tenderHttpError, tenderJson } from '@/lib/tenders/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const viewer = await requireTenderViewer()
    const query = new URL(request.url).searchParams
    const input = z.strictObject({ limit: z.coerce.number().int().min(1).max(100).optional(), cursor: z.string().max(200).optional() }).parse(Object.fromEntries(query))
    return tenderJson(await listTenders(viewer, input))
  } catch (error) { return tenderHttpError(error) }
}
export async function POST(request: Request) {
  try { return tenderJson(await createTender(await requireTenderViewer(), await readTenderCommand(request)), 201) }
  catch (error) { return tenderHttpError(error) }
}
