// Resolve `@/` while Field Registry tests load TypeScript. Node 24 uses
// registerHooks, the same API as scripts/agent/register.mjs. Node 22 falls
// back to module.register plus resolve-alias.mjs.
import { existsSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const nodeModule = await import('node:module')

function resolveAlias(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const path = resolvePath(root, specifier.slice(2)) + '.ts'
    if (existsSync(path)) return nextResolve(pathToFileURL(path).href, context)
  }
  return nextResolve(specifier, context)
}

if (typeof nodeModule.registerHooks === 'function') {
  nodeModule.registerHooks({ resolve: resolveAlias })
} else {
  await nodeModule.register('./resolve-alias.mjs', import.meta.url)
}
