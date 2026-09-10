// A local, fictional-data proof only. Never loads .env.local or a buyer credential.
export function fixtureContext() {
  const url = new URL(process.env.DATABASE_URL || 'invalid:')
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.hostname !== '127.0.0.1' ||
      url.pathname !== '/traceli_agent_demo' || process.env.TRACELI_AGENT_FIXTURE !== '1') {
    throw new Error('Use an explicitly enabled loopback traceli_agent_demo fixture database.')
  }
  return {
    id: 'fixture-reviewer', organizationId: 'org_traceli_relief',
    role: 'Procurement Officer', name: 'Fictional reviewer',
    email: 'fixture@example.invalid', mode: 'demo',
  }
}
