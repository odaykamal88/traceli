import 'server-only'

import { ExtractionError } from '@/lib/field-registry/extract'
import { readMultipartForm, uploadFromMultipartForm } from '@/lib/field-registry/extract-upload'
import { donorPackIds, isDonorPackId, type DonorPackId } from '@/lib/field-registry/packs'

const deskFields = new Set(['file', 'awardId', 'packId', 'procurementReference'])

export type DeskPacket = {
  fileName: string
  mediaType: string
  bytes: Uint8Array<ArrayBuffer>
  awardId?: string
  packId: DonorPackId
  procurementReference?: string
}

function textField(value: FormDataEntryValue | null, label: string) {
  if (value === null) return undefined
  if (typeof value !== 'string') throw new ExtractionError('invalid_input', `${label} must be text.`)
  const trimmed = value.trim()
  return trimmed || undefined
}

/**
 * Multipart packet for the upload desk.
 * `packId` is required. Organization is not accepted from the client.
 * File bytes stay on this object until the provider hashes them.
 */
export async function readDeskPacket(request: Request): Promise<DeskPacket> {
  const form = await readMultipartForm(
    request,
    deskFields,
    'Send the file, a donor pack, and an optional award id.',
  )
  const upload = await uploadFromMultipartForm(form)
  if (!upload.bytes || upload.bytes.byteLength < 1) {
    throw new ExtractionError('invalid_input', 'The file is empty.')
  }
  const packText = textField(form.get('packId'), 'Donor pack')
  if (!packText || !isDonorPackId(packText)) {
    throw new ExtractionError('invalid_input', `Choose a donor pack: ${donorPackIds.join(', ')}.`)
  }
  const procurementReference = textField(form.get('procurementReference'), 'Procurement reference')
  if (procurementReference && (procurementReference.length > 80 || /[\u0000-\u001f]/.test(procurementReference))) {
    throw new ExtractionError('invalid_input', 'Procurement reference must be 80 characters or fewer.')
  }
  return {
    fileName: upload.fileName,
    mediaType: upload.mediaType,
    bytes: upload.bytes,
    ...(upload.awardId ? { awardId: upload.awardId } : {}),
    packId: packText,
    ...(procurementReference ? { procurementReference } : {}),
  }
}
