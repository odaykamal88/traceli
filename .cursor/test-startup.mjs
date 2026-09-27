import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const source = dirname(fileURLToPath(import.meta.url))
const configuration = JSON.parse(readFileSync(join(source, 'environment.json'), 'utf8'))

test('cloud configuration has a single development launch', () => {
  assert.equal(configuration.start, undefined)
  assert.equal(configuration.terminals.length, 1)
  assert.equal(configuration.terminals[0].command, 'bash .cursor/start.sh')
})

for (const scenario of ['no database configuration', 'hosted env file', 'hosted inherited configuration']) {
  test(`install and start do not touch a database: ${scenario}`, () => {
    const fixture = mkdtempSync(join(tmpdir(), 'traceli-cloud-startup-'))
    try {
      const cursor = join(fixture, '.cursor')
      const bin = join(fixture, 'bin')
      const nvmDir = join(fixture, 'nvm')
      for (const directory of [cursor, bin, nvmDir]) mkdirSync(directory)
      for (const name of ['install.sh', 'start.sh']) {
        copyFileSync(join(source, name), join(cursor, name))
        // Cover absolute database tool paths too; PATH stubs cover bare commands.
        const commands = readFileSync(join(cursor, name), 'utf8').replace(/^\s*#.*$/gm, '')
        assert.doesNotMatch(commands, /\b(?:initdb|pg_ctl|pg_isready|psql|createdb|dropdb)\b|db:migrate|db:seed/)
      }
      writeFileSync(join(nvmDir, 'nvm.sh'), `nvm() {
  case "$*" in
    'install 24'|'alias default 24') return 0 ;;
    'which 24') printf '%s/node\\n' "$TRACELI_TEST_BIN" ;;
    *) return 90 ;;
  esac
}
`)
      // Do not create runtime shims or directories outside the disposable fixture.
      const bashEnv = join(fixture, 'bash-env.sh')
      writeFileSync(bashEnv, `ln() { return 0; }
mkdir() { return 0; }
node() { [ "$*" = '-v' ] && printf 'v24.0.0\\n'; }
`)
      writeFileSync(join(bin, 'corepack'), `#!/bin/bash
printf '%s\\n' "$*" >> "$TRACELI_TEST_COMMAND_LOG"
case "$*" in
  'enable'|'pnpm install --frozen-lockfile'|'pnpm dev') exit 0 ;;
  *) exit 91 ;;
esac
`, { mode: 0o755 })
      for (const command of ['initdb', 'pg_ctl', 'pg_isready', 'psql', 'createdb', 'dropdb', 'sudo', 'apt-get']) {
        writeFileSync(join(bin, command), `#!/bin/bash
printf 'database or system setup attempted\\n' >> "$TRACELI_TEST_FORBIDDEN_LOG"
exit 92
`, { mode: 0o755 })
      }
      const envPath = join(fixture, '.env.local')
      const hostileFile = 'DATABASE_URL="postgres://fictional:fixture@hosted.example.invalid/customer?host=remote"\nDATABASE_URL_UNPOOLED="postgres://fictional:fixture@other.example.invalid/customer"\n'
      if (scenario !== 'no database configuration') writeFileSync(envPath, hostileFile)
      const env = {
        PATH: `${bin}:/usr/bin:/bin`,
        HOME: process.env.HOME,
        NVM_DIR: nvmDir,
        BASH_ENV: bashEnv,
        TRACELI_TEST_BIN: bin,
        TRACELI_TEST_COMMAND_LOG: join(fixture, 'commands.log'),
        TRACELI_TEST_FORBIDDEN_LOG: join(fixture, 'forbidden.log'),
      }
      if (scenario === 'hosted inherited configuration') {
        env.DATABASE_URL = 'postgres://fictional:fixture@inherited.example.invalid/live'
        env.DATABASE_URL_UNPOOLED = 'postgres://fictional:fixture@127.0.0.1/other?host=remote'
        env.PGHOST = 'inherited.example.invalid'
        env.PGDATABASE = 'customer'
        env.TRACELI_SEED_ORGANIZATION_ID = 'org_do_not_seed'
      }
      for (const script of ['install.sh', 'start.sh']) {
        const run = spawnSync('/bin/bash', [join(cursor, script)], { cwd: fixture, env, encoding: 'utf8' })
        assert.equal(run.status, 0, `${script}: ${run.stderr}${run.stdout}`)
      }
      assert.deepEqual(readFileSync(env.TRACELI_TEST_COMMAND_LOG, 'utf8').trim().split('\n'), [
        'enable', 'pnpm install --frozen-lockfile', 'pnpm dev',
      ])
      assert.equal(existsSync(env.TRACELI_TEST_FORBIDDEN_LOG), false)
      if (scenario === 'no database configuration') assert.equal(existsSync(envPath), false)
      else assert.equal(readFileSync(envPath, 'utf8'), hostileFile)
    } finally {
      rmSync(fixture, { recursive: true, force: true })
    }
  })
}
