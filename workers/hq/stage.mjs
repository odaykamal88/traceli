import { copyFile, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Assemble only reviewed runtime files. Never upload the application workspace,
// its .env files, local databases or an incidental research directory.
const repo = fileURLToPath(new URL('../../', import.meta.url))
const output = await mkdtemp(join(tmpdir(), 'traceli-hq-worker-'))
const files = ['workers/hq/package.json', 'workers/hq/package-lock.json', 'workers/hq/worker.mjs', 'workers/hq/source-collector.mjs', 'workers/hq/Dockerfile']
const hashes = {}
for (const name of files) {
  const target = join(output, name)
  await mkdir(dirname(target), { recursive: true })
  await copyFile(join(repo, name), target)
  hashes[name] = createHash('sha256').update(await readFile(target)).digest('hex')
}
await copyFile(join(repo, 'workers/hq/Dockerfile'), join(output, 'Dockerfile'))
await writeFile(join(output, '.dockerignore'), '**\n!Dockerfile\n!workers/\n!workers/hq/\n' + files.map(name => '!' + name).join('\n') + '\n')
console.log(JSON.stringify({ output, files: [...files, 'Dockerfile', '.dockerignore'], sha256: hashes }, null, 2))
