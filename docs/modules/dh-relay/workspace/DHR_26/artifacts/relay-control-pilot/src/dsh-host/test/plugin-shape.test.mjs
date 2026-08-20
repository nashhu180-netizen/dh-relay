import assert from 'node:assert/strict'
import test from 'node:test'
import * as hostModule from '../index.mjs'
import { realConfig } from './real-fixtures.mjs'

/** Verbatim copy of `Loader.unwrapExports` from @deepseek-ai/cordis-plugin-loader. */
function unwrapExports(exports) {
  if (exports === null || exports === undefined) return exports
  exports = exports.default ?? exports
  if (!exports.__esModule) return exports
  return exports.default ?? exports
}

/** Minimal stand-in for the parts of a Cordis context this plugin touches. */
function fakeContext() {
  const provided = new Map()
  return {
    provided,
    provide(name, value) {
      if (provided.has(name)) throw new Error(`service "${name}" already registered`)
      provided.set(name, value)
      return () => provided.delete(name)
    },
    get: name => provided.get(name),
  }
}

test('the Host survives the Cordis loader unwrap as an object plugin', () => {
  const plugin = unwrapExports(hostModule)
  // registry.resolve() takes the function branch first, then `{ apply }` objects.
  assert.equal(typeof plugin, 'object')
  assert.equal(typeof plugin.apply, 'function')
  assert.equal(plugin.name, 'relay-pilot-host')
  assert.equal(hostModule.default, undefined)
})

test('apply publishes ctx.relayPilot with the five read-only methods', () => {
  const ctx = fakeContext()
  hostModule.apply(ctx, realConfig())
  const api = ctx.get('relayPilot')
  assert.ok(api)
  for (const method of ['fixtureHash', 'diagnostics', 'listRuns', 'getRun', 'snapshot']) {
    assert.equal(typeof api[method], 'function', `missing ${method}`)
  }
  assert.equal(api.listRuns().runs.length, 5)
  assert.equal(api.getRun('fake-run-0001').run_id, 'fake-run-0001')
  assert.equal(api.getRun('fake-run-0007'), null)
})

test('the published surface exposes no write path and no live objects', () => {
  const ctx = fakeContext()
  hostModule.apply(ctx, realConfig())
  const api = ctx.get('relayPilot')
  // Nothing beyond the five queries — no set/update/write/dispose handle leaks.
  assert.deepEqual(
    Object.keys(api).sort(),
    ['diagnostics', 'fixtureHash', 'getRun', 'listRuns', 'snapshot'],
  )
  // Successive reads are detached from each other.
  const first = api.listRuns()
  first.runs.length = 0
  assert.equal(api.listRuns().runs.length, 5)
})

test('apply fails fast when no list fixture is configured', () => {
  const ctx = fakeContext()
  const previous = process.env.RELAY_PILOT_LIST_FIXTURE
  delete process.env.RELAY_PILOT_LIST_FIXTURE
  try {
    assert.throws(() => hostModule.apply(ctx, { fixtureRoot: realConfig().fixtureRoot }), /listFixture/)
    assert.equal(ctx.get('relayPilot'), undefined)
  } finally {
    if (previous !== undefined) process.env.RELAY_PILOT_LIST_FIXTURE = previous
  }
})

test('createRelayPilotApi works without any context at all', () => {
  // The boundary must be testable — and reusable — without Cordis present.
  const api = hostModule.createRelayPilotApi(realConfig())
  assert.equal(typeof api.fixtureHash(), 'string')
})
