import 'server-only'

import {
  extractionResultSchema,
  loadExtractionBytes,
  MOCK_EXTRACTED_AT,
  sourceFileHashOf,
  type ExtractionInput,
  type ExtractionProvider,
  type ExtractionResult,
} from '@/lib/field-registry/extract'
import {
  fragmentSchema,
  type FragmentKindHint,
  type SourceRef,
} from '@/lib/field-registry/schema'

/**
 * Offline extractor. Fragments are a pure function of the file name, media type, and bytes.
 * The clock is fixed. The text is a stub. The file body is hashed and then discarded.
 */

const EXTRACTOR_ID = 'extractor.mock'

type MockPlan = {
  kind: FragmentKindHint
  sourceKind: SourceRef['kind']
  sourceId: string
  confidence: number
  channel: string
  text: (fileName: string) => string
}

function planFor(fileName: string, mediaType: string): MockPlan {
  const lower = fileName.toLowerCase()
  if (mediaType === 'message/rfc822' || mediaType === 'application/vnd.ms-outlook') {
    return {
      kind: 'email_header',
      sourceKind: 'message',
      sourceId: 'message-1',
      confidence: 0.75,
      channel: 'email',
      text: name => `Email header stub for ${name}. The message body is not a registry field.`,
    }
  }
  if (lower.includes('waiver')) {
    return {
      kind: 'waiver',
      sourceKind: 'page',
      sourceId: 'page-1',
      confidence: 0.5,
      channel: 'document',
      text: name => `Waiver stub for ${name}. Authority is not decided here.`,
    }
  }
  if (mediaType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || lower.includes('pricing')) {
    return {
      kind: 'pricing_table',
      sourceKind: 'cell',
      sourceId: 'sheet1-a1',
      confidence: 0.625,
      channel: 'spreadsheet',
      text: name => `Pricing table stub for ${name}. Line items are not interpreted.`,
    }
  }
  if (lower.includes('capacity')) {
    return {
      kind: 'capacity_letter',
      sourceKind: 'page',
      sourceId: 'page-1',
      confidence: 0.5,
      channel: 'document',
      text: name => `Capacity letter stub for ${name}. Presence is not a judgment.`,
    }
  }
  if (lower.includes('annex')) {
    return {
      kind: 'annex',
      sourceKind: 'page',
      sourceId: 'page-1',
      confidence: 0.375,
      channel: 'document',
      text: name => `Annex stub for ${name}. The excerpt is not a frozen fact.`,
    }
  }
  if (mediaType === 'image/png' || mediaType === 'image/jpeg') {
    return {
      kind: 'text',
      sourceKind: 'page',
      sourceId: 'page-1',
      confidence: 0.25,
      channel: 'image',
      text: name => `Image stub for ${name}. Pixel text is not read.`,
    }
  }
  return {
    kind: 'text',
    sourceKind: 'page',
    sourceId: 'page-1',
    confidence: 0.5,
    channel: 'document',
    text: name => `Text stub for ${name}. Registry fields are the rule input.`,
  }
}

function spansFor(text: string) {
  const parts = text.split('. ')
  if (parts.length < 2) return undefined
  return parts.map((part, index) => ({
    text: part.endsWith('.') ? part : `${part}.`,
    label: index === 0 ? 'header' : 'body',
  }))
}

export class MockExtractionProvider implements ExtractionProvider {
  readonly providerId = 'mock'

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const loaded = await loadExtractionBytes(input)
    const sourceFileHash = sourceFileHashOf(loaded.bytes)
    const plan = planFor(loaded.fileName, loaded.mediaType)
    const text = plan.text(loaded.fileName)
    const fragment = fragmentSchema.parse({
      fragmentId: `frag.mock.${sourceFileHash.slice(0, 12)}`,
      sourceFileHash,
      sourceRef: { kind: plan.sourceKind, id: plan.sourceId, label: loaded.fileName },
      text,
      extractedAt: MOCK_EXTRACTED_AT,
      confidence: plan.confidence,
      extractorId: EXTRACTOR_ID,
      kind: plan.kind,
      tags: [plan.kind, plan.channel],
      spans: spansFor(text),
    })
    const result = {
      schemaVersion: 'extraction-result-v1' as const,
      providerId: this.providerId,
      extractorId: EXTRACTOR_ID,
      fileName: loaded.fileName,
      mediaType: loaded.mediaType,
      sourceFileHash,
      ...(loaded.input.awardId ? { awardId: loaded.input.awardId } : {}),
      ...(loaded.input.organizationId ? { organizationId: loaded.input.organizationId } : {}),
      fragments: [fragment],
    }
    return extractionResultSchema.parse(result)
  }
}
