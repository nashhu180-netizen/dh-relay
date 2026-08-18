import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
const runtimeFiles = await Promise.all(
  ['index.js', 'service-factory.js', 'fixture-store.js', 'plain-json.js', 'probe.js']
    .map(async name => [name, await readFile(new URL(`../${name}`, import.meta.url), 'utf8')]),
)

test('is an installable DSH bundle with a removable profile layer', () => {
  assert.equal(packageJson.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(packageJson.exports['./probe'], './probe.js')
  assert.equal(packageJson.peerDependencies['@deepseek-ai/cordis'], '^4.0.0')
  assert.match(patch, /id: relay-pilot-host/)
  assert.match(patch, /RELAY_PILOT_HOST_DISABLED/)
  assert.match(patch, /RELAY_PILOT_PROBE/)
  assert.match(runtimeFiles.find(([name]) => name === 'probe.js')[1], /ctx\.get\('appExit'\)/)
})

test('runtime imports no DSH private package and contains no write-side filesystem API', () => {
  for (const [name, source] of runtimeFiles) {
    assert.doesNotMatch(source, /from ['"]@deepseek-ai\/dsh-/u, `${name} imports a DSH private package`)
    assert.doesNotMatch(source, /\b(writeFile|appendFile|createWriteStream|rm|unlink|rename|mkdir)\b/u, `${name} contains a write API`)
  }
})

test('the service adapter exposes the public Cordis seam only', async () => {
  const index = runtimeFiles.find(([name]) => name === 'index.js')[1]
  assert.match(index, /from '@deepseek-ai\/cordis'/)
  assert.doesNotMatch(index, /@deepseek-ai\/dsh-/)
})
