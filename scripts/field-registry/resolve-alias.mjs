import { existsSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'next/headers') return nextResolve('next/headers.js', context)
  if (specifier === 'next/navigation') return nextResolve('next/navigation.js', context)
  if (specifier.startsWith('@/')) {
    const base = resolvePath(root, specifier.slice(2))
    const asFile = `${base}.ts`
    if (existsSync(asFile)) return nextResolve(pathToFileURL(asFile).href, context)
    const asIndex = resolvePath(base, 'index.ts')
    if (existsSync(asIndex)) return nextResolve(pathToFileURL(asIndex).href, context)
  }
  return nextResolve(specifier, context)
}
