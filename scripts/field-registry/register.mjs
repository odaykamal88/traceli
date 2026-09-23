// Resolve `@/` while Field Registry tests load TypeScript. Node 24 uses
// registerHooks, the same API as scripts/agent/register.mjs. Node 22 falls
// back to module.register plus resolve-alias.mjs.
import { existsSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const nodeModule = await import('node:module')

function resolveAliasPath(specifier) {
  if (!specifier.startsWith('@/')) return null
  const base = resolvePath(root, specifier.slice(2))
  const asFile = `${base}.ts`
  if (existsSync(asFile)) return asFile
  const asIndex = resolvePath(base, 'index.ts')
  if (existsSync(asIndex)) return asIndex
  return null
}

function resolveAlias(specifier, context, nextResolve) {
  if (specifier === 'next/headers') return nextResolve('next/headers.js', context)
  if (specifier === 'next/navigation') return nextResolve('next/navigation.js', context)
  const resolved = resolveAliasPath(specifier)
  if (resolved) return nextResolve(pathToFileURL(resolved).href, context)
  return nextResolve(specifier, context)
}

if (typeof nodeModule.registerHooks === 'function') {
  nodeModule.registerHooks({ resolve: resolveAlias })
} else {
  await nodeModule.register('./resolve-alias.mjs', import.meta.url)
}
