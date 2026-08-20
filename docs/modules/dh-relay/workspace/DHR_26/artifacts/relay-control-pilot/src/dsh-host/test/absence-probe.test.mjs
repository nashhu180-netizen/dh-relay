import assert from 'node:assert/strict'
import test from 'node:test'
import * as absenceModule from '../absence-probe.mjs'

/** Verbatim copy of `Loader.unwrapExports` from @deepseek-ai/cordis-plugin-loader. */
function unwrapExports(exports) {
  if (exports === null || exports === undefined) return exports
  exports = exports.default ?? exports
  if (!exports.__esModule) return exports
  return exports.default ?? exports
}

/**
 * Capture only this probe's transcript lines.
 *
 * The capture stays installed across timers, and node:test writes its own
 * reporter protocol to the same stream — swallowing that corrupts the run. So
 * anything that is not ours is passed straight through to the real write.
 */
function captureStdout() {
  const chunks = []
  const original = process.stdout.write.bind(process.stdout)
  process.stdout.write = (chunk, encoding, callback) => {
    const text = String(chunk)
    if (!text.startsWith('[relay-pilot-')) return original(chunk, encoding, callback)
    chunks.push(text)
    const done = typeof encoding === 'function' ? encoding : callback
    if (typeof done === 'function') done(null)
    return true
  }
  return { chunks, restore: () => { process.stdout.write = original } }
}

function fakeContext(services) {
  return { get: name => services[name] }
}

/** Run the probe and settle once its deferred check has requested an exit. */
async function runProbe(services) {
  const exitCodes = []
  const stdout = captureStdout()
  let timer
  try {
    const dispose = await new Promise((resolve, reject) => {
      const ctx = fakeContext({
        ...services,
        appExit: code => {
          exitCodes.push(code)
          resolve(disposer)
        },
      })
      let disposer
      timer = setTimeout(() => reject(new Error('absence probe never called appExit')), 3000)
      try {
        disposer = absenceModule.apply(ctx)
      } catch (error) {
        reject(error)
      }
    })
    return { exitCodes, chunks: stdout.chunks, dispose }
  } finally {
    clearTimeout(timer)
    stdout.restore()
  }
}

test('the absence probe keeps the namespace export shape', () => {
  const plugin = unwrapExports(absenceModule)
  assert.equal(typeof plugin.apply, 'function')
  assert.equal(plugin.name, 'relay-pilot-absence-probe')
  assert.equal(absenceModule.default, undefined)
  // It must NOT inject relayPilot: injecting would make Cordis wait for the
  // service instead of reporting that it is gone.
  assert.equal(absenceModule.inject, undefined)
})

test('reports absence and exits 0 when the service row is gone', async () => {
  const { exitCodes, chunks } = await runProbe({})
  assert.deepEqual(exitCodes, [0])
  assert.equal(chunks.length, 1)
  const payload = JSON.parse(chunks[0].slice('[relay-pilot-absence-probe] '.length))
  assert.equal(payload.event, 'relay-pilot-absence-checked')
  assert.equal(payload.present, false)
})

test('reports presence and exits 1 when the service row is still there', async () => {
  const { exitCodes, chunks } = await runProbe({ relayPilot: { listRuns: () => ({}) } })
  assert.deepEqual(exitCodes, [1])
  const payload = JSON.parse(chunks[0].slice('[relay-pilot-absence-probe] '.length))
  assert.equal(payload.present, true)
})

test('refuses to run without the launcher-provided appExit', () => {
  assert.throws(() => absenceModule.apply(fakeContext({})), /did not provide ctx\.appExit/)
})

test('returns a disposer that cancels the pending check', async () => {
  const exitCodes = []
  const ctx = fakeContext({ appExit: code => exitCodes.push(code) })
  const stdout = captureStdout()
  try {
    const dispose = absenceModule.apply(ctx)
    assert.equal(typeof dispose, 'function')
    dispose()
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally { stdout.restore() }
  // Disposed before the timer fired: no transcript, no exit request.
  assert.deepEqual(exitCodes, [])
  assert.deepEqual(stdout.chunks, [])
})
