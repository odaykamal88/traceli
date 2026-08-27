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

console.log(
  `Environment configuration valid: WorkOS ${workOSConfigured ? 'configured' : 'disabled'}; database ${databaseConfigured ? 'configured' : 'disabled'}.`,
)
