import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

const script = new URL('../scripts/snapshot-dsh.mjs', import.meta.url)

async function writeManifest(path, manifest) {
  await mkdir(path, { recursive: true })
  await writeFile(join(path, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
}

test('captures the installed @deepseek-ai dependency closure without shelling out', async t => {
  const root = await mkdtemp(join(tmpdir(), 'dhr26-snapshot-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const npmRoot = join(root, 'global-node-modules')
  const dshRoot = join(npmRoot, '@deepseek-ai', 'dsh')
  const nestedAlpha = join(dshRoot, 'node_modules', '@deepseek-ai', 'dsh-alpha')
  const cordisRoot = join(npmRoot, '@deepseek-ai', 'cordis')
  await writeManifest(dshRoot, {
    name: '@deepseek-ai/dsh',
    version: '0.1.0-rc.7',
    dependencies: {
      '@deepseek-ai/dsh-alpha': '0.1.0-rc.7',
      '@deepseek-ai/cordis': '4.0.1',
    },
  })
  await writeManifest(nestedAlpha, {
    name: '@deepseek-ai/dsh-alpha',
    version: '0.1.0-rc.7',
    peerDependencies: { '@deepseek-ai/cordis': '4.0.1' },
  })
  await writeManifest(cordisRoot, {
    name: '@deepseek-ai/cordis',
    version: '4.0.1',
  })

  const out = join(root, 'snapshot.json')
  const result = spawnSync(process.execPath, [
    script.pathname,
    '--label', 'test',
    '--out', out,
    '--dsh-version', '0.1.0-rc.7',
    '--npm-root', npmRoot,
    '--install-root', dshRoot,
  ], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const snapshot = JSON.parse(await readFile(out, 'utf8'))
  assert.equal(snapshot.package_count, 3)
  assert.equal(snapshot.unresolved_dependency_count, 0)
  assert.equal(snapshot.install_layout.install_root_realpath, dshRoot)
  assert.ok(snapshot.install_layout.root_entries.some(item => item.name === 'package.json' && item.type === 'file'))
  assert.ok(snapshot.install_layout.nested_deepseek_scope.entries.some(item => item.name === 'dsh-alpha'))
  assert.deepEqual(
    snapshot.packages.map(item => `${item.name}@${item.version}`),
    [
      '@deepseek-ai/cordis@4.0.1',
      '@deepseek-ai/dsh@0.1.0-rc.7',
      '@deepseek-ai/dsh-alpha@0.1.0-rc.7',
    ],
  )
  assert.ok(snapshot.packages.every(item => /^[a-f0-9]{64}$/.test(item.package_json_sha256)))
})

test('rejects a CLI/package version mismatch', async t => {
  const root = await mkdtemp(join(tmpdir(), 'dhr26-snapshot-mismatch-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const npmRoot = join(root, 'global-node-modules')
  const dshRoot = join(npmRoot, '@deepseek-ai', 'dsh')
  await writeManifest(dshRoot, { name: '@deepseek-ai/dsh', version: '0.1.0-rc.6' })
  const result = spawnSync(process.execPath, [
    script.pathname,
    '--label', 'test',
    '--out', join(root, 'snapshot.json'),
    '--dsh-version', '0.1.0-rc.7',
    '--npm-root', npmRoot,
    '--install-root', dshRoot,
  ], { encoding: 'utf8' })
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /CLI\/package version mismatch/)
})
