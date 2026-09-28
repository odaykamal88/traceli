import { getTenderPolicies } from '@/lib/tenders/retention'
import { requireTenderViewer, tenderHttpError, tenderJson } from '@/lib/tenders/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try { return tenderJson(getTenderPolicies(await requireTenderViewer())) }
  catch (error) { return tenderHttpError(error) }
}
