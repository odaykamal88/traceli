import { readPilotReportBody } from '@/lib/desk/pilot-report-body'
import { DeskAccessError } from '@/lib/desk/freeze-upload'
import { DeskJudgmentError, sanitizeUploadDeskJudgment } from '@/lib/desk/judgment'
import { sanitizeUploadDeskView } from '@/lib/desk/view'
import { ExtractionAccessError } from '@/lib/field-registry/extract'
import { buildPilotReport, pilotReportFileName, PilotReportError } from '@/lib/pilot-report/build'
import { renderPilotReportPdf } from '@/lib/pilot-report/pdf'
import { requireTraceViewer, TraceAccessError } from '@/lib/trace/access'
import { privateHeaders } from '@/lib/trace/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const REFUSE = 'This freeze cannot be read. Extract the packet again.'

/**
 * PDF memo for the signed-in organisation.
 * The freeze stays in the browser. This route checks the session org and
 * recomputes hashes. It does not store the file or the record.
 */
export async function POST(request: Request) {
  try {
    const viewer = await requireTraceViewer()
    const body = await readPilotReportBody(request)
    const view = sanitizeUploadDeskView(body.view)
    const judgment = sanitizeUploadDeskJudgment(body.judgment)
    if (!view || !judgment) throw new DeskJudgmentError(REFUSE)
    if (view.organizationId !== viewer.organizationId || view.snapshot.organizationId !== viewer.organizationId) {
      throw new DeskAccessError('This session cannot download a report for that record.')
    }
    const sameActor = viewer.id === judgment.record.frozenBy
    const report = buildPilotReport({
      view,
      judgment,
      reviewerName: sameActor ? viewer.name : 'Reviewer on the record',
      reviewerRole: sameActor ? viewer.role : null,
    })
    const pdf = await renderPilotReportPdf(report)
    const filename = pilotReportFileName(report.procurementReference)
    return new Response(Buffer.from(pdf), {
      headers: {
        ...privateHeaders,
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    if (error instanceof TraceAccessError || error instanceof DeskAccessError || error instanceof ExtractionAccessError) {
      return Response.json(
        { error: error instanceof DeskAccessError ? error.message : 'This report is unavailable for this session.' },
        { status: 403, headers: privateHeaders },
      )
    }
    if (error instanceof DeskJudgmentError || error instanceof PilotReportError) {
      return Response.json({ error: error.message }, { status: 400, headers: privateHeaders })
    }
    return Response.json(
      { error: 'The pilot report could not be prepared. Try again.' },
      { status: 500, headers: privateHeaders },
    )
  }
}
