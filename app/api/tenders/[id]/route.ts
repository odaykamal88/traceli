import { readTender } from '@/lib/tenders/store'
import { requireTenderViewer, tenderHttpError, tenderJson } from '@/lib/tenders/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { return tenderJson(await readTender(await requireTenderViewer(), (await params).id)) }
  catch (error) { return tenderHttpError(error) }
}
