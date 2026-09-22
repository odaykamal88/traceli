import type { Fragment } from '@/lib/field-registry/schema'

/**
 * P2 ingestion boundary. Types only.
 * A later adapter (Talonic-class or otherwise) implements `extract`.
 * This module has no vendor SDK, no OCR, and no network call.
 * Fragments are mapped onto registry fields by P1 later. Rules never receive `bytes`.
 */
export type RawFile = {
  fileName: string
  mediaType: string
  bytes: Uint8Array
}

export type ExtractionAdapter = {
  readonly adapterId: string
  extract(rawFile: RawFile): readonly Fragment[]
}
