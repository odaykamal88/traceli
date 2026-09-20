import { ingestOperatingSource } from '@/lib/hq/operating-ingest'

export const runtime = 'nodejs'
export async function POST(request: Request) { return ingestOperatingSource(request) }
