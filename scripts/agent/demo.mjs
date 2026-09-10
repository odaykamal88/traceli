import { fixtureContext } from './fixture-context.mjs'
const viewer = fixtureContext()
const { callEvidenceTool } = await import('../../lib/agent/evidence-tools.ts')
const { getDatabasePool } = await import('../../lib/db/client.ts')

// One JSON request on stdin, one result on stdout. This is a transport-neutral
// local contract demonstration, not an MCP server or a buyer-client integration.
let input = ''
try {
  for await (const chunk of process.stdin) {
    input += chunk
    if (Buffer.byteLength(input) > 8192) throw new Error('Input exceeds fixture limit.')
  }
  console.log(JSON.stringify(await callEvidenceTool(viewer, JSON.parse(input)), null, 2))
} finally {
  await getDatabasePool().end()
}
