import { readTender, deleteTender } from '@/lib/tenders/store'
import { readTenderCommand, requireTenderViewer, tenderHttpError, tenderJson } from '@/lib/tenders/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { return tenderJson(await readTender(await requireTenderViewer(), (await params).id)) }
  catch (error) { return tenderHttpError(error) }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { return tenderJson(await deleteTender(await requireTenderViewer(), (await params).id, await readTenderCommand(request))) }
  catch (error) { return tenderHttpError(error) }
}
