/**
 * Knowledge hub v0.
 * Seeded donor packs are the only rules a freeze evaluates.
 * Organisation uploads are labels in this browser, scoped to the signed-in
 * organisation. File bytes are not stored and are not compiled into pack rules.
 */
import { donorPackIds, type DonorPackId } from '@/lib/field-registry/packs/types'

export type { DonorPackId }

export const hubStorageKey = 'traceli.knowledgeHub.v1'
export const HUB_BYTE_LIMIT = 8 * 1024 * 1024
export const HUB_UPLOAD_CAP = 12
export const HUB_ENGAGEMENT_CAP = 20
export const HUB_FILE_ACCEPT = '.pdf,.docx,.xlsx,.eml,.msg,.txt,.png,.jpg,.jpeg,application/pdf,text/plain'

const hubMediaByExtension = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  eml: 'message/rfc822',
  msg: 'application/vnd.ms-outlook',
  txt: 'text/plain',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
} as const

export type HubSeedCopy = {
  /** Short line on the award-desk pack picker. */
  blurb: string
  /** Card summary on the Knowledge hub. */
  summary: string
}

export const hubSynthesisNote = 'Trace-li public-control synthesis. These are not official United Nations, Global Fund, FCDO, or OCHA manuals.'

export const hubUploadNote = 'Organisation upload. This version does not compile the file into pack rules.'

export const hubSeedSources: Record<DonorPackId, HubSeedCopy> = {
  'global-fund': {
    blurb: 'PR and sub-recipient award checks.',
    summary: 'Checks for principal-recipient and sub-recipient awards, including Restrictive Measures evidence.',
  },
  'fcdo-prime': {
    blurb: 'Commercial prime checks for FCDO-funded awards.',
    summary: 'Checks for a commercial prime awarding under FCDO-funded work, including UK sanctions evidence.',
  },
  unfpa: {
    blurb: 'UNFPA / OAIS-shaped IP and procurement checks. Public-control synthesis, not a live UNFPA desk run.',
    summary: 'Checks shaped from public UNFPA audit findings on implementing-partner and vendor awards.',
  },
  'ocha-cbpf': {
    blurb: 'CBPF Global Guidelines–shaped reserve and scorecard checks. Not a live OCHA desk run.',
    summary: 'Checks shaped from public CBPF guidance on reserve allocations and partner scorecards.',
  },
}

export type HubUpload = {
  id: string
  fileName: string
  mediaType: string
  byteLength: number
  contentHash: string
  uploadedAt: string
  label: string
}

export type HubEngagement = {
  id: string
  name: string
  primaryPackId: DonorPackId
  attachedUploadIds: string[]
  createdAt: string
}

export type HubLibraryState = {
  organizationId: string
  uploads: HubUpload[]
  engagements: HubEngagement[]
}

export type DeskTenderContext = {
  id: string
  name: string
  primaryPackId: DonorPackId
  uploads: { id: string, label: string, fileName: string }[]
}

const uploadIdPattern = /^upload\.[a-z0-9]{8,32}$/
const engagementIdPattern = /^eng\.[a-z0-9]{8,32}$/
const hashPattern = /^[a-f0-9]{64}$/

export function emptyHubLibrary(organizationId: string): HubLibraryState {
  return { organizationId, uploads: [], engagements: [] }
}

export function isHubPackId(packId: string): packId is DonorPackId {
  return (donorPackIds as readonly string[]).includes(packId)
}

export function hubPackParam(value: string | string[] | undefined): DonorPackId | null {
  const text = Array.isArray(value) ? value[0] : value
  return text && isHubPackId(text) ? text : null
}

export function hubEngagementParam(value: string | string[] | undefined): string | null {
  const text = Array.isArray(value) ? value[0] : value
  if (!text || !engagementIdPattern.test(text)) return null
  return text
}

export function hubMediaType(fileName: string): string | null {
  const base = fileName.trim().toLowerCase()
  const dot = base.lastIndexOf('.')
  if (dot <= 0 || dot === base.length - 1) return null
  const extension = base.slice(dot + 1)
  if (!(extension in hubMediaByExtension)) return null
  return hubMediaByExtension[extension as keyof typeof hubMediaByExtension]
}

export function newHubId(kind: 'upload' | 'eng'): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('')
  return kind === 'upload' ? `upload.${hex}` : `eng.${hex}`
}

function cleanText(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/[\u0000-\u001f]/g, '').slice(0, max)
}

function baseFileName(value: unknown): string {
  const text = cleanText(value, 300)
  const slash = text.replace(/\\/g, '/').split('/').pop() ?? ''
  return slash.trim().slice(0, 240)
}

function isoTime(value: unknown): string | null {
  if (typeof value !== 'string' || value.length < 10 || value.length > 40) return null
  const time = Date.parse(value)
  if (!Number.isFinite(time)) return null
  return new Date(time).toISOString()
}

export function parseHubUpload(input: {
  id: string
  fileName: string
  byteLength: number
  contentHash: string
  uploadedAt: string
  label?: string
}): { ok: true, upload: HubUpload } | { ok: false, error: string } {
  if (!uploadIdPattern.test(input.id)) return { ok: false, error: 'The upload could not be labelled. Nothing was stored.' }
  const fileName = baseFileName(input.fileName)
  const mediaType = fileName ? hubMediaType(fileName) : null
  if (!fileName || !mediaType) {
    return { ok: false, error: 'Choose a PDF, Word, Excel, email, text, or image file.' }
  }
  if (!Number.isInteger(input.byteLength) || input.byteLength < 1) {
    return { ok: false, error: 'The file was empty.' }
  }
  if (input.byteLength > HUB_BYTE_LIMIT) {
    return { ok: false, error: 'That file is larger than 8 MB.' }
  }
  const contentHash = input.contentHash.trim().toLowerCase()
  if (!hashPattern.test(contentHash)) return { ok: false, error: 'The file could not be read. Nothing was stored.' }
  const uploadedAt = isoTime(input.uploadedAt)
  if (!uploadedAt) return { ok: false, error: 'The file could not be labelled. Nothing was stored.' }
  const requested = cleanText(input.label, 80)
  return {
    ok: true,
    upload: {
      id: input.id,
      fileName,
      mediaType,
      byteLength: input.byteLength,
      contentHash,
      uploadedAt,
      label: requested || fileName,
    },
  }
}

export function addHubUpload(state: HubLibraryState, upload: HubUpload): HubLibraryState | 'full' | 'duplicate' {
  if (state.uploads.some(item => item.id === upload.id)) return 'duplicate'
  if (state.uploads.length >= HUB_UPLOAD_CAP) return 'full'
  return { ...state, uploads: [...state.uploads, upload] }
}

export function removeHubUpload(state: HubLibraryState, uploadId: string): HubLibraryState {
  return {
    ...state,
    uploads: state.uploads.filter(item => item.id !== uploadId),
    engagements: state.engagements.map(engagement => ({
      ...engagement,
      attachedUploadIds: engagement.attachedUploadIds.filter(id => id !== uploadId),
    })),
  }
}

export function parseHubEngagement(input: {
  id: string
  name: string
  primaryPackId: string
  attachedUploadIds: readonly string[]
  knownUploadIds: readonly string[]
  createdAt: string
}): { ok: true, engagement: HubEngagement } | { ok: false, error: string } {
  if (!engagementIdPattern.test(input.id)) return { ok: false, error: 'The tender could not be saved.' }
  const name = cleanText(input.name, 80)
  if (!name) return { ok: false, error: 'Name the tender.' }
  if (!isHubPackId(input.primaryPackId)) return { ok: false, error: 'Choose the seeded pack that drives this freeze.' }
  const createdAt = isoTime(input.createdAt)
  if (!createdAt) return { ok: false, error: 'The tender could not be saved.' }
  const known = new Set(input.knownUploadIds)
  const attachedUploadIds: string[] = []
  for (const id of input.attachedUploadIds) {
    if (!uploadIdPattern.test(id) || !known.has(id) || attachedUploadIds.includes(id)) continue
    attachedUploadIds.push(id)
    if (attachedUploadIds.length >= HUB_UPLOAD_CAP) break
  }
  return {
    ok: true,
    engagement: {
      id: input.id,
      name,
      primaryPackId: input.primaryPackId,
      attachedUploadIds,
      createdAt,
    },
  }
}

export function addHubEngagement(state: HubLibraryState, engagement: HubEngagement): HubLibraryState {
  const engagements = [engagement, ...state.engagements.filter(item => item.id !== engagement.id)]
  return { ...state, engagements: engagements.slice(0, HUB_ENGAGEMENT_CAP) }
}

function sanitizeUpload(value: unknown): HubUpload | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (typeof raw.id !== 'string' || typeof raw.fileName !== 'string') return null
  if (typeof raw.byteLength !== 'number' || typeof raw.contentHash !== 'string' || typeof raw.uploadedAt !== 'string') return null
  const parsed = parseHubUpload({
    id: raw.id,
    fileName: raw.fileName,
    byteLength: raw.byteLength,
    contentHash: raw.contentHash,
    uploadedAt: raw.uploadedAt,
    label: typeof raw.label === 'string' ? raw.label : undefined,
  })
  return parsed.ok ? parsed.upload : null
}

export function sanitizeHubLibrary(input: unknown, organizationId: string): HubLibraryState {
  const empty = emptyHubLibrary(organizationId)
  if (!organizationId || !input || typeof input !== 'object') return empty
  const raw = input as Record<string, unknown>
  if (raw.organizationId !== organizationId) return empty
  const uploads: HubUpload[] = []
  if (Array.isArray(raw.uploads)) {
    for (const item of raw.uploads) {
      const upload = sanitizeUpload(item)
      if (!upload || uploads.some(existing => existing.id === upload.id)) continue
      uploads.push(upload)
      if (uploads.length >= HUB_UPLOAD_CAP) break
    }
  }
  const knownUploadIds = uploads.map(upload => upload.id)
  const engagements: HubEngagement[] = []
  if (Array.isArray(raw.engagements)) {
    for (const item of raw.engagements) {
      if (!item || typeof item !== 'object') continue
      const engagement = item as Record<string, unknown>
      if (typeof engagement.id !== 'string' || typeof engagement.name !== 'string' || typeof engagement.primaryPackId !== 'string') continue
      const parsed = parseHubEngagement({
        id: engagement.id,
        name: engagement.name,
        primaryPackId: engagement.primaryPackId,
        attachedUploadIds: Array.isArray(engagement.attachedUploadIds) ? engagement.attachedUploadIds.filter(id => typeof id === 'string') : [],
        knownUploadIds,
        createdAt: typeof engagement.createdAt === 'string' ? engagement.createdAt : '',
      })
      if (!parsed.ok || engagements.some(existing => existing.id === parsed.engagement.id)) continue
      engagements.push(parsed.engagement)
      if (engagements.length >= HUB_ENGAGEMENT_CAP) break
    }
  }
  return { organizationId, uploads, engagements }
}

export function readHubLibrary(organizationId: string): HubLibraryState {
  const result = readHubLibraryResult(organizationId)
  return result.ok ? result.state : emptyHubLibrary(organizationId)
}

export function readHubLibraryResult(organizationId: string):
  | { ok: true, state: HubLibraryState }
  | { ok: false, error: string } {
  if (typeof localStorage === 'undefined') {
    return { ok: false, error: 'Browser storage is unavailable. Saved tenders cannot be opened here.' }
  }
  try {
    const raw = localStorage.getItem(hubStorageKey)
    return { ok: true, state: sanitizeHubLibrary(raw ? JSON.parse(raw) : null, organizationId) }
  } catch {
    return { ok: false, error: 'Saved tenders could not be read from this browser. Check browser storage and try again.' }
  }
}

export function writeHubLibrary(state: HubLibraryState) {
  localStorage.setItem(hubStorageKey, JSON.stringify(state))
}

export function deskTenderContext(state: HubLibraryState, engagementId: string): DeskTenderContext | null {
  const engagement = state.engagements.find(item => item.id === engagementId)
  if (!engagement) return null
  const uploads = engagement.attachedUploadIds.flatMap(id => {
    const upload = state.uploads.find(item => item.id === id)
    return upload ? [{ id: upload.id, label: upload.label, fileName: upload.fileName }] : []
  })
  return {
    id: engagement.id,
    name: engagement.name,
    primaryPackId: engagement.primaryPackId,
    uploads,
  }
}

export function shortContentHash(hash: string) {
  return hash.slice(0, 8)
}

/** Every live pack id has hub copy. Used by tests and the hub page. */
export const hubSeedPackIds = donorPackIds
