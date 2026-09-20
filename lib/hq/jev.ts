import 'server-only'
import { createHash } from 'node:crypto'
import { z } from 'zod'

const id = z.string().regex(/^[A-Za-z0-9_-]{1,80}$/)
const text = z.string().min(1).max(2000)
const probability = z.number().finite().min(0).max(1)
const question = z.discriminatedUnion('type', [
  z.object({ type: z.literal('noul'), instructions: text }).strict(),
  z.object({ type: z.literal('choice'), instructions: text, criteria: z.record(id, text).refine(x => Object.keys(x).length >= 2 && Object.keys(x).length <= 10) }).strict(),
  z.object({ type: z.literal('score'), instructions: text, criteria: z.array(text).min(2).max(10) }).strict(),
])
export const jevPacketSchema = z.object({
  version: z.literal('jev-connectivity-v0.1'), case_id: id,
  classification: z.enum(['synthetic', 'public']), source_ids: z.array(id).min(1).max(10), requirement_ids: z.array(id).min(1).max(10),
  request: z.object({ model: z.literal('jev-latest'), state: z.string().min(1).max(8000), questions: z.record(id, question).refine(x => Object.keys(x).length >= 1 && Object.keys(x).length <= 5) }).strict(),
}).strict()
export const JEV_SMOKE_ID = 'jev-connectivity-20260920-v1'
export const jevSmokePacket = jevPacketSchema.parse({
  version: 'jev-connectivity-v0.1', case_id: 'SYN-JEV-001', classification: 'synthetic', source_ids: ['SYN-EVIDENCE-001'], requirement_ids: ['SYN-RECEIPT-001'],
  request: { model: 'jev-latest', state: 'Fictional test record SYN-EVIDENCE-001. A delivery receipt is present. A reviewer signature is absent. This is synthetic test data, not a real procurement.', questions: { receipt_present: { type: 'noul', instructions: 'Does the supplied record explicitly state that a delivery receipt is present?' } } },
})
const usageSchema = z.object({ input_tokens: z.number().int().nonnegative(), output_tokens: z.number().int().nonnegative() })
const answerSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('noul'), noul: probability }),
  z.object({ type: z.literal('choice'), choice: text, confidence: probability, probabilities: z.record(z.string(), probability) }),
  z.object({ type: z.literal('score'), score: z.number().finite(), confidence: probability, probabilities: z.record(z.string(), probability), legend: z.record(z.string(), text) }),
])
const responseSchema = z.object({ model: z.string().regex(/^jev[-a-zA-Z0-9.]{1,80}$/), answers: z.record(id, answerSchema), usage: usageSchema.optional() })
export type JevReceipt = {
  status: 'ok' | 'invalid_input' | 'missing_key' | 'authentication_error' | 'budget_error' | 'rate_limited' | 'provider_error' | 'timeout' | 'network_error' | 'invalid_output'
  provider: 'TypeSafe'; transport: 'direct-http'; requested_model: string; returned_model: string | null
  contract_version: string; input_hash: string; input_manifest: unknown; started_at: string; latency_ms: number; http_status: number | null
  normalized: z.infer<typeof responseSchema>['answers'] | null; usage: z.infer<typeof usageSchema> | null; usage_status: 'reported' | 'unavailable'; cost_usd: null
  policy_disposition: 'not_evaluated'; human_decision: 'not_evaluated'; raw_response: unknown | null; raw_response_hash: string | null
}
export function jsonHash(value: unknown) { return createHash('sha256').update(JSON.stringify(value)).digest('hex') }
function sameKeys(a: object, b: object) { return Object.keys(a).sort().join('\0') === Object.keys(b).sort().join('\0') }
function validAnswers(packet: z.infer<typeof jevPacketSchema>, response: z.infer<typeof responseSchema>) {
  if (!sameKeys(packet.request.questions, response.answers)) return false
  for (const [key, q] of Object.entries(packet.request.questions)) {
    const a = response.answers[key]
    if (q.type !== a.type) return false
    if (a.type === 'noul') continue
    const expected = q.type === 'choice' ? q.criteria : Object.fromEntries((q.type === 'score' ? q.criteria : []).map((v, i) => [String(i), v]))
    if (!sameKeys(expected, a.probabilities) || Math.abs(Object.values(a.probabilities).reduce((s, v) => s + v, 0) - 1) > 0.00001) return false
    if (a.type === 'choice' && (!(a.choice in expected) || a.probabilities[a.choice] + 0.00001 < Math.max(...Object.values(a.probabilities)))) return false
    if (a.type === 'score') {
      if (!sameKeys(expected, a.legend) || Object.entries(expected).some(([k, v]) => a.legend[k] !== v)) return false
      const score = Object.entries(a.probabilities).reduce((s, [k, v]) => s + Number(k) * v, 0)
      if (Math.abs(score - a.score) > 0.00001) return false
    }
  }
  return true
}
export async function evaluateJev(input: unknown, options: { apiKey?: string; fetcher?: typeof fetch; timeoutMs?: number } = {}): Promise<JevReceipt> {
  const started = Date.now()
  const parsed = jevPacketSchema.safeParse(input)
  const base: JevReceipt = { status: 'invalid_input', provider: 'TypeSafe', transport: 'direct-http', requested_model: 'jev-latest', returned_model: null, contract_version: 'jev-connectivity-v0.1', input_hash: parsed.success ? jsonHash(parsed.data) : '', input_manifest: parsed.success ? parsed.data : null, started_at: new Date(started).toISOString(), latency_ms: 0, http_status: null, normalized: null, usage: null, usage_status: 'unavailable', cost_usd: null, policy_disposition: 'not_evaluated', human_decision: 'not_evaluated', raw_response: null, raw_response_hash: null }
  if (!parsed.success) return base
  const apiKey = options.apiKey ?? process.env.TYPESAFE_API_KEY
  if (!apiKey) return { ...base, status: 'missing_key' }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000)
  try {
    const res = await (options.fetcher ?? fetch)('https://api.typesafe.ai/v1/systemone', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data.request), signal: controller.signal, redirect: 'error', cache: 'no-store' })
    base.http_status = res.status
    if (!res.ok) return { ...base, status: res.status === 401 || res.status === 403 ? 'authentication_error' : res.status === 402 ? 'budget_error' : res.status === 429 ? 'rate_limited' : 'provider_error', latency_ms: Date.now() - started }
    const reader = res.body?.getReader()
    if (!reader) return { ...base, status: 'invalid_output', latency_ms: Date.now() - started }
    const chunks: Uint8Array[] = []; let size = 0
    for (;;) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > 32000) { await reader.cancel(); return { ...base, status: 'invalid_output', latency_ms: Date.now() - started } }; chunks.push(part.value) }
    const body = Buffer.concat(chunks).toString('utf8')
    if (body.includes(apiKey)) return { ...base, status: 'invalid_output', latency_ms: Date.now() - started }
    let raw: unknown
    try { raw = JSON.parse(body) } catch { return { ...base, status: 'invalid_output', latency_ms: Date.now() - started } }
    if (JSON.stringify(raw).includes(apiKey)) return { ...base, status: 'invalid_output', latency_ms: Date.now() - started }
    base.raw_response = raw; base.raw_response_hash = jsonHash(raw)
    const output = responseSchema.safeParse(raw)
    if (!output.success || !validAnswers(parsed.data, output.data)) return { ...base, status: 'invalid_output', latency_ms: Date.now() - started }
    return { ...base, status: 'ok', returned_model: output.data.model, normalized: output.data.answers, usage: output.data.usage ?? null, usage_status: output.data.usage ? 'reported' : 'unavailable', latency_ms: Date.now() - started }
  } catch { return { ...base, status: controller.signal.aborted ? 'timeout' : 'network_error', latency_ms: Date.now() - started } }
  finally { clearTimeout(timer) }
}

export function publicJevReceipt(receipt: JevReceipt) { const { raw_response: _raw, ...safe } = receipt; return safe }
