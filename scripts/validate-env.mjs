const workOSVariables = [
  'WORKOS_CLIENT_ID',
  'WORKOS_API_KEY',
  'WORKOS_COOKIE_PASSWORD',
  'NEXT_PUBLIC_WORKOS_REDIRECT_URI',
]

const databaseVariables = ['DATABASE_URL', 'DATABASE_URL_UNPOOLED']

function isConfigured(name) {
  return Boolean(process.env[name]?.trim())
}

function validateAllOrNone(groupName, names) {
  const configured = names.filter(isConfigured)

  if (configured.length > 0 && configured.length < names.length) {
    const missing = names.filter((name) => !configured.includes(name))
    throw new Error(`${groupName} configuration is incomplete. Missing: ${missing.join(', ')}`)
  }

  return configured.length === names.length
}

function validateUrl(name, protocols) {
  let parsed

  try {
    parsed = new URL(process.env[name])
  } catch {
    throw new Error(`${name} must be a valid URL.`)
  }

  if (!protocols.includes(parsed.protocol)) {
    throw new Error(`${name} must use one of these protocols: ${protocols.join(', ')}`)
  }
}

const workOSConfigured = validateAllOrNone('WorkOS', workOSVariables)
const databaseConfigured = validateAllOrNone('Database', databaseVariables)

if (workOSConfigured) {
  validateUrl('NEXT_PUBLIC_WORKOS_REDIRECT_URI', ['http:', 'https:'])

  if (process.env.WORKOS_COOKIE_PASSWORD.length < 32) {
    throw new Error('WORKOS_COOKIE_PASSWORD must be at least 32 characters.')
  }
}

if (databaseConfigured) {
  for (const name of databaseVariables) {
    validateUrl(name, ['postgres:', 'postgresql:'])
  }
}

if (isConfigured('TRACELI_SEED_ORGANIZATION_ID') && !databaseConfigured) {
  throw new Error('TRACELI_SEED_ORGANIZATION_ID requires complete database configuration.')
}

const hqAccess = process.env.TRACELI_HQ_ACCESS
const traceMode = process.env.TRACELI_TRACE_MODE
if (traceMode && !['disabled', 'local', 'workos'].includes(traceMode)) {
  throw new Error('TRACELI_TRACE_MODE must be disabled, local or workos.')
}
if (traceMode === 'local') {
  const url = new URL(process.env.DATABASE_URL || 'https://invalid')
  if (process.env.NODE_ENV !== 'development' || process.env.VERCEL ||
      !['postgres:', 'postgresql:'].includes(url.protocol) ||
      !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.search || url.hash) {
    throw new Error('Local Trace requires development mode and an isolated loopback PostgreSQL URL without query overrides.')
  }
}
if (traceMode === 'workos' && (!workOSConfigured || !databaseConfigured)) {
  throw new Error('Trace WorkOS access requires complete WorkOS and database configuration.')
}
if (hqAccess && !['disabled', 'local', 'workos'].includes(hqAccess)) {
  throw new Error('TRACELI_HQ_ACCESS must be disabled, local or workos.')
}
if (hqAccess === 'local' && (process.env.VERCEL || process.env.NODE_ENV === 'production')) {
  throw new Error('Local HQ access cannot be enabled on a hosted or production build.')
}
const extractionProvider = process.env.TRACE_EXTRACTION_PROVIDER?.trim()
if (extractionProvider && !['mock', 'talonic'].includes(extractionProvider)) {
  throw new Error('TRACE_EXTRACTION_PROVIDER must be mock or talonic.')
}
if (extractionProvider === 'talonic' && !isConfigured('TRACE_TALONIC_API_KEY')) {
  throw new Error('TRACE_EXTRACTION_PROVIDER=talonic requires TRACE_TALONIC_API_KEY.')
}
if (isConfigured('TRACE_TALONIC_BASE_URL')) {
  validateUrl('TRACE_TALONIC_BASE_URL', ['https:'])
}

if (hqAccess === 'workos') {
  if (!workOSConfigured) throw new Error('HQ WorkOS access requires complete WorkOS configuration.')
  if (!/^user_[A-Z0-9]{26}$/.test(process.env.TRACELI_HQ_OWNER_USER_ID || '')) {
    throw new Error('HQ requires an exact WorkOS owner user ID.')
  }
  if (!/^org_[A-Z0-9]{26}$/.test(process.env.TRACELI_HQ_ORGANIZATION_ID || '')) {
    throw new Error('HQ requires an exact WorkOS organization ID.')
  }
}

console.log(
  `Environment configuration valid: WorkOS ${workOSConfigured ? 'configured' : 'disabled'}; database ${databaseConfigured ? 'configured' : 'disabled'}.`,
)
