import { issuePacket } from '@/lib/tenders/store'
import { readTenderUpload, requireTenderViewer, tenderHttpError, tenderJson } from '@/lib/tenders/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 180

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { return tenderJson(await issuePacket(await requireTenderViewer(), (await params).id, await readTenderUpload(request, 'packet')), 201) }
  catch (error) { return tenderHttpError(error) }
}
