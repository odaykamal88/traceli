/**
 * Client-safe view of an upload-desk freeze.
 * No file bytes, no vendor payload, no server-only imports.
 */

export const uploadDeskStorageKey = 'traceli.uploadDesk.frozen.v1'
export const uploadDeskPackIds = ['global-fund', 'fcdo-prime'] as const

export type UploadDeskPackId = (typeof uploadDeskPackIds)[number]
export type UploadDeskFieldState = 'present' | 'missing' | 'negative'
export type UploadDeskSeverity = 'info' | 'warning' | 'blocker'
export type UploadDeskReadiness = 'unknown' | 'red' | 'amber' | 'green'

export type UploadDeskFieldView = {
  fieldId: string
  key: string
  state: UploadDeskFieldState
  detail: string
  fromPacket: boolean
}

export type UploadDeskFindingView = {
  findingId: string
  severity: UploadDeskSeverity
  code: string
  title: string
  summary: string
}

export type UploadDeskView = {
  schemaVersion: 'upload-desk-result-v1'
  providerId: string
  fileName: string
  mediaType: string
  sourceFileHash: string
  organizationId: string
  awardId: string
  procurementReference: string
  packId: UploadDeskPackId
  packName: string
  packVersion: string
  fragmentCount: number
  unmappedFragmentCount: number
  readiness: UploadDeskReadiness
  findingCount: number
  findings: UploadDeskFindingView[]
  fields: UploadDeskFieldView[]
  record: {
    recordId: string
    snapshotHash: string
    packsHash: string
    hashMethod: 'sha256:sorted-json-v1'
    frozenAt: string
    frozenBy: string
    disposition: 'request_evidence' | 'accept_assessment'
  }
}

const hashPattern = /^[a-f0-9]{64}$/
const idPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/
const fieldStates = new Set<UploadDeskFieldState>(['present', 'missing', 'negative'])
const severities = new Set<UploadDeskSeverity>(['info', 'warning', 'blocker'])
const readinessLevels = new Set<UploadDeskReadiness>(['unknown', 'red', 'amber', 'green'])
const dispositions = new Set(['request_evidence', 'accept_assessment'])

function text(value: unknown, max: number) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max ? value : null
}

function sanitizeField(value: unknown): UploadDeskFieldView | null {
  if (!value || typeof value !== 'object') return null
  const field = value as Record<string, unknown>
  const fieldId = text(field.fieldId, 160)
  const key = text(field.key, 120)
  const detail = text(field.detail, 500)
  if (!fieldId || !idPattern.test(fieldId) || !key || !detail) return null
  if (!fieldStates.has(field.state as UploadDeskFieldState)) return null
  if (typeof field.fromPacket !== 'boolean') return null
  return {
    fieldId,
    key,
    state: field.state as UploadDeskFieldState,
    detail,
    fromPacket: field.fromPacket,
  }
}

function sanitizeFinding(value: unknown): UploadDeskFindingView | null {
  if (!value || typeof value !== 'object') return null
  const finding = value as Record<string, unknown>
  const findingId = text(finding.findingId, 160)
  const code = text(finding.code, 80)
  const title = text(finding.title, 240)
  const summary = text(finding.summary, 1000)
  if (!findingId || !idPattern.test(findingId) || !code || !title || !summary) return null
  if (!severities.has(finding.severity as UploadDeskSeverity)) return null
  return {
    findingId,
    severity: finding.severity as UploadDeskSeverity,
    code,
    title,
    summary,
  }
}

/** Drop a stored view that does not match the desk contract. */
export function sanitizeUploadDeskView(value: unknown): UploadDeskView | null {
  if (!value || typeof value !== 'object') return null
  const view = value as Record<string, unknown>
  if (view.schemaVersion !== 'upload-desk-result-v1') return null
  if (!uploadDeskPackIds.includes(view.packId as UploadDeskPackId)) return null
  if (!readinessLevels.has(view.readiness as UploadDeskReadiness)) return null
  const providerId = text(view.providerId, 160)
  const fileName = text(view.fileName, 240)
  const mediaType = text(view.mediaType, 160)
  const sourceFileHash = text(view.sourceFileHash, 64)
  const organizationId = text(view.organizationId, 160)
  const awardId = text(view.awardId, 160)
  const procurementReference = text(view.procurementReference, 80)
  const packName = text(view.packName, 240)
  const packVersion = text(view.packVersion, 80)
  if (!providerId || !fileName || !mediaType || !sourceFileHash || !hashPattern.test(sourceFileHash)) return null
  if (!organizationId || !idPattern.test(organizationId) || !awardId || !idPattern.test(awardId)) return null
  if (!procurementReference || !packName || !packVersion) return null
  if (!Number.isInteger(view.fragmentCount) || !Number.isInteger(view.unmappedFragmentCount)) return null
  if (!Number.isInteger(view.findingCount)) return null
  if (!Array.isArray(view.findings) || view.findings.length > 64) return null
  if (!Array.isArray(view.fields) || view.fields.length > 256) return null
  const findings = view.findings.map(sanitizeFinding)
  const fields = view.fields.map(sanitizeField)
  if (findings.some(finding => !finding) || fields.some(field => !field)) return null
  if (view.findingCount !== findings.length) return null
  const record = view.record
  if (!record || typeof record !== 'object') return null
  const frozen = record as Record<string, unknown>
  const recordId = text(frozen.recordId, 160)
  const snapshotHash = text(frozen.snapshotHash, 64)
  const packsHash = text(frozen.packsHash, 64)
  const frozenAt = text(frozen.frozenAt, 40)
  const frozenBy = text(frozen.frozenBy, 160)
  if (!recordId || !idPattern.test(recordId) || !snapshotHash || !hashPattern.test(snapshotHash)) return null
  if (!packsHash || !hashPattern.test(packsHash) || frozen.hashMethod !== 'sha256:sorted-json-v1') return null
  if (!frozenAt || !frozenBy || !idPattern.test(frozenBy)) return null
  if (!dispositions.has(frozen.disposition as string)) return null
  return {
    schemaVersion: 'upload-desk-result-v1',
    providerId,
    fileName,
    mediaType,
    sourceFileHash,
    organizationId,
    awardId,
    procurementReference,
    packId: view.packId as UploadDeskPackId,
    packName,
    packVersion,
    fragmentCount: view.fragmentCount as number,
    unmappedFragmentCount: view.unmappedFragmentCount as number,
    readiness: view.readiness as UploadDeskReadiness,
    findingCount: findings.length,
    findings: findings as UploadDeskFindingView[],
    fields: fields as UploadDeskFieldView[],
    record: {
      recordId,
      snapshotHash,
      packsHash,
      hashMethod: 'sha256:sorted-json-v1',
      frozenAt,
      frozenBy,
      disposition: frozen.disposition as 'request_evidence' | 'accept_assessment',
    },
  }
}
