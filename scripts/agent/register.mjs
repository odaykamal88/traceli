// Resolve the app's TypeScript aliases in Node 24's native type-stripping runtime.
// The react-server condition honors server-only for this local server process.
import { registerHooks } from 'node:module'
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('../../', import.meta.url))
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const path = resolve(root, specifier.slice(2)) + '.ts'
    if (existsSync(path)) return nextResolve(pathToFileURL(path).href, context)
  }
  return nextResolve(specifier, context)
} })
