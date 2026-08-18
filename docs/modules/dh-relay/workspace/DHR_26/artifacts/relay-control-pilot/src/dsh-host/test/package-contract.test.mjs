import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const text = name => readFileSync(join(root, name), 'utf8')
const manifest = JSON.parse(text('package.json'))

test('package is an installable profile bundle without a second Cordis package identity', () => {
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(manifest.dependencies, undefined)
  assert.equal(manifest.peerDependencies, undefined)
  assert.equal(manifest.exports['./client'], undefined)
})

test('Host runtime imports only the public installation-owned Cordis service API', () => {
  const source = `${text('index.mjs')}\n${text('probe.mjs')}\n${text('fixture-store.mjs')}`
  const runtimeImports = [...source.matchAll(/from\s+['"](@deepseek-ai\/[^'"]+)['"]/g)].map(match => match[1])
  assert.deepEqual([...new Set(runtimeImports)], ['@deepseek-ai/cordis'])
  assert.doesNotMatch(source, /@deepseek-ai\/dsh-/)
})

test('service has no route/event/timer/process registration side channel', () => {
  const source = text('index.mjs')
  assert.doesNotMatch(source, /\.on\(|\.effect\(|setInterval|setTimeout|webServer|process\.on|loader\.create/)
  assert.match(source, /super\(ctx, 'relayPilot'\)/)
})

test('patches expose one persistent row plus explicit probe/disable/enable overlays', () => {
  assert.match(text('cordis.patch.yml'), /id: relay-pilot-host/)
  assert.match(text('cordis.patch.yml'), /RELAY_PILOT_FIXTURE_ROOT/)
  assert.match(text('probe.patch.yml'), /@personal\/dsh-relay-host\/probe/)
  assert.match(text('disable.patch.yml'), /disabled: true/)
  assert.match(text('enable.patch.yml'), /disabled: false/)
})
