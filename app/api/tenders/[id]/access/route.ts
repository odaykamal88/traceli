import { z } from 'zod'
import { grantTenderAccess, revokeTenderAccess } from '@/lib/tenders/store'
import { idempotencyKeySchema } from '@/lib/tenders/contract'
import { readTenderCommand, requireTenderViewer, tenderHttpError, tenderJson } from '@/lib/tenders/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const memberId = z.string().min(1).max(160).regex(/^[A-Za-z0-9._:-]+$/)
const grant = z.strictObject({ userId: memberId, access: z.enum(['read', 'review']), idempotencyKey: idempotencyKeySchema })
const revoke = z.strictObject({ userId: memberId, idempotencyKey: idempotencyKeySchema })

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { return tenderJson(await grantTenderAccess(await requireTenderViewer(), (await params).id, grant.parse(await readTenderCommand(request)))) }
  catch (error) { return tenderHttpError(error) }
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { return tenderJson(await revokeTenderAccess(await requireTenderViewer(), (await params).id, revoke.parse(await readTenderCommand(request)))) }
  catch (error) { return tenderHttpError(error) }
}
