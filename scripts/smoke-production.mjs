import assert from 'node:assert/strict'

const baseUrl = new URL(process.env.TRACELI_BASE_URL ?? 'https://www.trace-li.com')

assert.ok(
  ['http:', 'https:'].includes(baseUrl.protocol),
  'TRACELI_BASE_URL must use http or https.',
)

async function request(path, options = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    ...options,
    headers: {
      'User-Agent': 'Traceli production smoke check',
      ...options.headers,
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(20_000),
  })

  return response
}

async function expectHtml(path, text) {
  const response = await request(path)
  assert.equal(response.status, 200, `${path} returned ${response.status}.`)
  assert.match(
    response.headers.get('content-type') ?? '',
    /^text\/html/i,
    `${path} did not return HTML.`,
  )

  const body = await response.text()
  assert.ok(body.includes(text), `${path} did not contain its expected product marker.`)
  console.log(`PASS ${path} · HTML marker present`)
}

const healthResponse = await request('/api/health')
assert.equal(healthResponse.status, 200, `/api/health returned ${healthResponse.status}.`)
assert.deepEqual(await healthResponse.json(), { service: 'traceli', status: 'ok' })
assert.match(healthResponse.headers.get('cache-control') ?? '', /no-store/i)
console.log('PASS /api/health · live and uncached')

await expectHtml('/', 'Prove the award')
await expectHtml('/demo', 'Fictional demo data')

const videoResponse = await request('/traceli-tender-to-proof.mp4', {
  headers: {
    Range: 'bytes=0-1023',
  },
})
assert.equal(videoResponse.status, 206, `Product film range returned ${videoResponse.status}.`)
assert.match(videoResponse.headers.get('content-range') ?? '', /^bytes 0-1023\//)
console.log('PASS product film · byte ranges supported')

const workspaceResponse = await request('/workspace')
assert.ok(
  workspaceResponse.status >= 300 && workspaceResponse.status < 400,
  `/workspace must redirect anonymous visitors; received ${workspaceResponse.status}.`,
)
assert.ok(workspaceResponse.headers.get('location'), '/workspace redirect had no destination.')
console.log('PASS /workspace · anonymous access redirected')

console.log(`Production smoke checks passed for ${baseUrl.origin}.`)
