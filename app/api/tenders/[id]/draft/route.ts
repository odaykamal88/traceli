import { saveDraft } from '@/lib/tenders/store'
import { readTenderCommand, requireTenderViewer, tenderHttpError, tenderJson } from '@/lib/tenders/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { return tenderJson(await saveDraft(await requireTenderViewer(), (await params).id, await readTenderCommand(request))) }
  catch (error) { return tenderHttpError(error) }
}
