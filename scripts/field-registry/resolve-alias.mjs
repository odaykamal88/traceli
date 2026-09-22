import { existsSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const path = resolvePath(root, specifier.slice(2)) + '.ts'
    if (existsSync(path)) return nextResolve(pathToFileURL(path).href, context)
  }
  return nextResolve(specifier, context)
}
