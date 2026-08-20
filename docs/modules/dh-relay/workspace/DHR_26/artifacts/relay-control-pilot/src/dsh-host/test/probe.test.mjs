import assert from 'node:assert/strict'
import test from 'node:test'
import * as probeModule from '../probe.mjs'
import { RelayPilotRepository } from '../fixture-store.mjs'
import { realConfig } from './real-fixtures.mjs'

/**
 * Verbatim copy of `Loader.unwrapExports` from @deepseek-ai/cordis-plugin-loader.
 * A `export default apply` in probe.mjs collapses the namespace to a bare
 * function here, which is how `inject` got dropped and the probe ended up
 * failing with `cannot get property "relayPilot" without inject`.
 */
function unwrapExports(exports) {
  if (exports === null || exports === undefined) return exports
  exports = exports.default ?? exports
  if (!exports.__esModule) return exports
  return exports.default ?? exports
}

function captureStdout() {
  const chunks = []
  const original = process.stdout.write
  process.stdout.write = (chunk, encoding, callback) => {
    chunks.push(String(chunk))
    const done = typeof encoding === 'function' ? encoding : callback
    if (typeof done === 'function') done(null)
    return true
  }
  return { chunks, restore: () => { process.stdout.write = original } }
}

function fakeContext(services) {
  const ctx = { get: name => services[name] }
  return Object.assign(ctx, services)
}

test('the probe survives the Cordis loader unwrap with inject intact', () => {
  const plugin = unwrapExports(probeModule)
  assert.equal(typeof plugin.apply, 'function')
  assert.deepEqual(plugin.inject, ['relayPilot'])
  assert.equal(plugin.name, 'relay-pilot-probe')
})

test('the probe module exports no default, which is what preserves inject', () => {
  assert.equal(probeModule.default, undefined)
})

test('the probe refuses to run without the launcher-provided appExit', async () => {
  const ctx = fakeContext({ relayPilot: new RelayPilotRepository(realConfig()) })
  await assert.rejects(() => probeModule.apply(ctx), /did not provide ctx\.appExit/)
})

test('the probe emits one transcript over real fixtures and exits 0 through appExit', async () => {
  const exitCodes = []
  const ctx = fakeContext({
    relayPilot: new RelayPilotRepository(realConfig()),
    appExit: code => exitCodes.push(code),
  })
  const stdout = captureStdout()
  try {
    await probeModule.apply(ctx)
  } finally { stdout.restore() }

  assert.deepEqual(exitCodes, [0])
  assert.equal(stdout.chunks.length, 1)
  const prefix = '[relay-pilot-probe] '
  assert.ok(stdout.chunks[0].startsWith(prefix))
  const payload = JSON.parse(stdout.chunks[0].slice(prefix.length))
  assert.equal(payload.event, 'relay-pilot-host-ready')
  assert.equal(payload.plain_json, true)
  assert.equal(payload.list_schema, 'relay.pilot-run-list/v1')
  assert.equal(payload.detail_present_schema, 'relay.pilot-read-model/v1')
  assert.equal(payload.detail_missing_run_id, 'fake-run-0007')
  assert.equal(payload.detail_missing_returns_null, true)
  // Pin the exact diagnostic sets rather than "at least one", so a regression
  // that silently drops or invents a code cannot pass.
  const byCode = code => payload.diagnostics.filter(d => d.code === code).map(d => d.run_id).sort()
  assert.deepEqual(byCode('detail-missing'), ['fake-run-0006', 'fake-run-0007'])
  assert.deepEqual(byCode('detail-unlisted'), ['fake-run-0003', 'fake-run-0004'])
})

test('the probe reports a service failure through appExit(1) instead of hanging', async () => {
  const exitCodes = []
  const ctx = fakeContext({
    relayPilot: { snapshot() { throw new Error('boom') } },
    appExit: code => exitCodes.push(code),
  })
  const stdout = captureStdout()
  try {
    await probeModule.apply(ctx)
  } finally { stdout.restore() }

  assert.deepEqual(exitCodes, [1])
  assert.ok(stdout.chunks[0].startsWith('[relay-pilot-probe-error] '))
})
