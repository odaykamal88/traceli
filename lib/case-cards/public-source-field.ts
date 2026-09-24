import type { RegistryField } from '@/lib/field-registry/schema'

export function sourceField(
  fieldId: string,
  entityId: string,
  key: string,
  value: RegistryField['value'],
  hash: string,
  retrievedAt: string,
  pageId: string,
  label: string,
): RegistryField {
  return {
    fieldId,
    entityKind: 'evidence',
    entityId,
    key,
    value,
    provenance: {
      sourceFileHash: hash,
      sourceRef: { kind: 'page', id: pageId, label },
      extractedAt: retrievedAt,
      confidence: 1,
      verificationMethod: 'unverified',
    },
  }
}
