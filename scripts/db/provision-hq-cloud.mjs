import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import pg from 'pg'

export const setup = Object.freeze({
  organizationId: 'org_01M2MDYMMMY9SWVAC8VWE52BM3',
  organizationName: 'Trace-li HQ Preview',
  runner: 'traceli_hq_preview_runner', reader: 'traceli_hq_preview_reader',
  mandate: 'institutional-memory', policyEnabled: false, monthlyModelLimit: 0,
})

/** Administrator-only setup after approved staging migrations. Passwords enter
 * through a private stream; never stdout, CLI arguments or repository files. */
export async function provision(client, { runnerPassword, readerPassword, inputs, approvalReference }) {
  if (typeof approvalReference !== 'string' || !approvalReference.trim() || approvalReference.length > 1000) throw new Error('Recorded setup authorization required')
  for (const password of [runnerPassword, readerPassword]) if (typeof password !== 'string' || !/^[A-Za-z0-9_-]{40,128}$/.test(password)) throw new Error('Strong distinct service credentials required')
  if (runnerPassword === readerPassword) throw new Error('Service credentials must be distinct')
  if (!Array.isArray(inputs) || !inputs.length || inputs.length > 20 || Buffer.byteLength(JSON.stringify(inputs)) > 16000 || inputs.some(s => typeof s.ref !== 'string' || typeof s.text !== 'string' || !s.ref || !s.text)) throw new Error('Reviewed source snapshot required')
  await client.query('BEGIN')
  try {
    await client.query("SELECT set_config('app.organization_id',$1,true)", [setup.organizationId])
    await client.query('INSERT INTO organizations(id,name) VALUES($1,$2) ON CONFLICT DO NOTHING', [setup.organizationId, setup.organizationName])
    const organization = await client.query('SELECT name FROM organizations WHERE id=$1', [setup.organizationId])
    if (organization.rows[0]?.name !== setup.organizationName) throw new Error('Preview organization identity mismatch')
    await client.query("INSERT INTO hq_scopes(organization_id,id,kind,mandate_id,name,definition) VALUES($1,$2,'mandate',$2,'Institutional Memory', $3) ON CONFLICT DO NOTHING", [setup.organizationId, setup.mandate, JSON.stringify({ charter: 'cloud-pilot-1', draft_only: true })])
    const scope = await client.query('SELECT kind,mandate_id FROM hq_scopes WHERE organization_id=$1 AND id=$2', [setup.organizationId, setup.mandate])
    if (scope.rows[0]?.kind !== 'mandate' || scope.rows[0]?.mandate_id !== setup.mandate) throw new Error('Mandate scope mismatch')
    for (const [name, password, kind, capability] of [[setup.runner, runnerPassword, 'runner', 'traceli_hq_cloud_runner'], [setup.reader, readerPassword, 'reader', 'traceli_hq_cloud_reader']]) {
      if ((await client.query('SELECT FROM pg_roles WHERE rolname=$1', [name])).rowCount) throw new Error('Service login already exists; inspect or rotate explicitly')
      const create = await client.query("SELECT format('CREATE ROLE %I LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS CONNECTION LIMIT 4 PASSWORD %L',$1::text,$2::text) AS command", [name, password])
      await client.query(create.rows[0].command)
      await client.query(`GRANT ${capability} TO ${name} WITH INHERIT FALSE`)
      await client.query('INSERT INTO hq_cloud_bindings(login_name,kind,organization_id,actor_id,mandate_id,enabled) VALUES($1::text::name,$2,$3,$1::text,$4,$5)', [name, kind, setup.organizationId, setup.mandate, kind === 'reader'])
    }
    await client.query("INSERT INTO hq_cloud_policies(login_name,enabled,monthly_limit_microusd,pricing_valid_until,inputs) VALUES($1,false,0,clock_timestamp(),$2)", [setup.runner, JSON.stringify(inputs)])
    await client.query("INSERT INTO hq_events(organization_id,id,mandate_id,actor_id,event_type,evidence) VALUES($1,gen_random_uuid()::text,$2,current_user,'cloud_credentials_provisioned_disabled',$3)", [setup.organizationId, setup.mandate, JSON.stringify({ setup_reference: approvalReference, execution_authorized: false })])
    await client.query('COMMIT')
    return { status: 'provisioned-disabled', ...setup }
  } catch (error) { await client.query('ROLLBACK'); throw error }
}

async function main() {
  if (process.argv[2] !== '--apply') { console.log(JSON.stringify({ status: 'plan-only', ...setup, migrations: ['0003_hq_operating_memory.sql', '0004_hq_cloud_pilot.sql'], paid_execution: false }, null, 2)); return }
  if (!process.env.HQ_CLOUD_SETUP_APPROVAL_REFERENCE) throw new Error('Recorded staging setup authorization required')
  const address = new URL(process.env.DATABASE_URL_UNPOOLED || '')
  if (address.searchParams.get('sslmode') !== 'verify-full') throw new Error('Verified TLS required')
  let input = ''
  for await (const chunk of process.stdin) { input += chunk; if (Buffer.byteLength(input) > 1000) throw new Error('Credential packet exceeds limit') }
  const credentials = JSON.parse(input)
  const inputs = JSON.parse(await readFile(new URL('../../docs/hq/cloud/pilot-inputs.json', import.meta.url), 'utf8'))
  const client = new pg.Client({ connectionString: address.toString(), connectionTimeoutMillis: 10000, statement_timeout: 10000 })
  try { await client.connect(); console.log(JSON.stringify(await provision(client, { ...credentials, inputs, approvalReference: process.env.HQ_CLOUD_SETUP_APPROVAL_REFERENCE }))) } finally { await client.end() }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(() => { console.error('Cloud setup stopped; inspect privileges and approved configuration without exposing credentials'); process.exitCode = 1 })
