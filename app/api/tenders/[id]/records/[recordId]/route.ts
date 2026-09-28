import { readTenderRecord } from '@/lib/tenders/store'
import { requireTenderViewer, tenderHttpError, tenderJson } from '@/lib/tenders/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; recordId: string }> }) {
  try {
    const viewer = await requireTenderViewer()
    const { id, recordId } = await params
    return tenderJson(await readTenderRecord(viewer, id, recordId))
  } catch (error) { return tenderHttpError(error) }
}
