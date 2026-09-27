# Cloud development environment

Installation sets up Node 24 and the locked application dependencies. The single
`dev` terminal starts Next.js on port 3000. The public demo can be used without a
database; signed-in features still require their normal access configuration.

Cloud installation and startup do not install or start PostgreSQL, create or
modify `.env.local`, change database users, run migrations, or seed records.
An existing `.env.local` or inherited database URL does not trigger a database
setup command. Next.js still loads application environment variables normally.

Database-dependent tests require a separate, explicitly configured disposable
local database and fictional fixtures. Before running any migration or seed
command, check the effective environment, including inherited variables and
`.env.local`: both database URLs must address the same isolated loopback
PostgreSQL database without query-string or fragment overrides. Do not reuse
hosted or customer database credentials for these tests. See the
[isolated evidence fixture setup](../docs/AGENT_READ_CONTRACT.md) or the
[local upload desk walkthrough](../docs/eng/workos-upload-desk.md) for the chosen
test workflow.

To check the bootstrap boundary without starting services or installing packages:

```bash
node --test .cursor/test-startup.mjs
```
