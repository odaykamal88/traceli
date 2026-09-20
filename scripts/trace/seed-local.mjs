import pg from 'pg'

const value = process.env.DATABASE_URL
if (!value) throw new Error('Set DATABASE_URL to the isolated local PostgreSQL instance.')
const url = new URL(value)
if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.search || url.hash || process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  throw new Error('Synthetic seeding is restricted to nonproduction loopback PostgreSQL.')
}
const pool = new pg.Pool({ connectionString: value })
try {
  await pool.query("insert into organizations(id,name) values ('org_trace_local','Fictional Trace training organization') on conflict (id) do nothing")
  console.log('Created local synthetic organization. Open /workspace/trace with explicit local mode enabled.')
} finally { await pool.end() }
