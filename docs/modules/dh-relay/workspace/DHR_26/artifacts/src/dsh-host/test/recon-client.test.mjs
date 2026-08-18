import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

const script = new URL('../scripts/recon-client.mjs', import.meta.url)

async function write(path, content = '') {
  await mkdir(join(path, '..'), { recursive: true })
  await writeFile(path, content, 'utf8')
}

test('records client declaration, export shape, type paths, and profile anchor without a feasibility verdict', async t => {
  const root = await mkdtemp(join(tmpdir(), 'dhr26-client-recon-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const npmRoot = join(root, 'node_modules')
  const dshRoot = join(npmRoot, '@deepseek-ai', 'dsh')
  const clientRoot = join(dshRoot, 'node_modules', '@deepseek-ai', 'dsh-client-modules')
  const dshHome = join(root, 'dsh-home')
  await write(join(dshRoot, 'package.json'), JSON.stringify({
    name: '@deepseek-ai/dsh',
    version: '0.1.0-rc.7',
    dependencies: { '@deepseek-ai/dsh-client-modules': '0.1.0-rc.7' },
  }))
  await write(join(clientRoot, 'package.json'), JSON.stringify({
    name: '@deepseek-ai/dsh-client-modules',
    version: '0.1.0-rc.7',
    types: './lib/types/index.d.ts',
    exports: {
      './client': {
        types: './lib/types/client/index.d.ts',
        default: './lib/client.js',
      },
    },
    dsh: { client: { platform: 'web', inject: [], immediately: true } },
  }))
  await write(join(clientRoot, 'lib', 'types', 'index.d.ts'), 'export {}\n')
  await write(join(clientRoot, 'lib', 'types', 'client', 'index.d.ts'), 'export {}\n')
  await write(join(clientRoot, 'lib', 'client.js'), 'module.exports = {}\n')
  await write(join(dshHome, 'profiles', 'relay-pilot', 'cordis.yml'), '[]\n')
  const out = join(root, 'report.json')
  const result = spawnSync(process.execPath, [
    script.pathname,
    '--npm-root', npmRoot,
    '--install-root', dshRoot,
    '--dsh-home', dshHome,
    '--profile', 'relay-pilot',
    '--out', out,
  ], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const report = JSON.parse(await readFile(out, 'utf8'))
  assert.equal(report.dsh_client_declaration.platform, 'web')
  assert.equal(report.client_export.default, './lib/client.js')
  assert.equal(report.local_type_definitions.client.exists, true)
  assert.equal(report.profile_scan_anchor.directory, join(dshHome, 'profiles', 'relay-pilot'))
  assert.equal(report.feasibility_judgement, null)
})
