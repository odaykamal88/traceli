import { downloadTenderReport } from '@/lib/tenders/store'
import { privateHeaders, requireTenderViewer, tenderHttpError } from '@/lib/tenders/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; recordId: string }> }) {
  try {
    const viewer = await requireTenderViewer()
    const { id, recordId } = await params
    const report = await downloadTenderReport(viewer, id, recordId)
    return new Response(Buffer.from(report.bytes), { headers: { ...privateHeaders, 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${report.fileName}"` } })
  } catch (error) { return tenderHttpError(error) }
}
