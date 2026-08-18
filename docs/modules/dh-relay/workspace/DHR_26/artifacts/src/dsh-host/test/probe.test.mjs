import assert from 'node:assert/strict'
import test from 'node:test'
import { apply as probe } from '../probe.js'

function makeContext() {
  const exitCodes = []
  return {
    exitCodes,
    relayPilot: {
      async listRuns() {
        return { schema_version: 'relay.pilot-run-list/v1', runs: [] }
      },
      async inspectRun() {
        return { schema_version: 'relay.pilot-read-model/v1', run_id: 'run-1' }
      },
    },
    get(name) {
      if (name === 'appExit') return code => exitCodes.push(code)
      return this[name]
    },
  }
}

async function captureStdout(callback) {
  let transcript = ''
  const originalWrite = process.stdout.write
  process.stdout.write = (chunk, encoding, callbackArg) => {
    transcript += String(chunk)
    const done = typeof encoding === 'function' ? encoding : callbackArg
    if (typeof done === 'function') done()
    return true
  }
  try {
    await callback()
  } finally {
    process.stdout.write = originalWrite
  }
  return transcript
}

test('probe emits ordinary JSON and requests bounded DSH exit', async () => {
  const ctx = makeContext()
  const transcript = await captureStdout(() => probe(ctx))
  assert.match(transcript, /^\[relay-pilot-probe\] /)
  const payload = JSON.parse(transcript.replace(/^\[relay-pilot-probe\] /, ''))
  assert.equal(payload.service, 'ctx.relayPilot')
  assert.equal(payload.plain_json, true)
  assert.deepEqual(ctx.exitCodes, [0])
})

test('probe fails closed when the launcher seam is missing or a fixture read fails', async () => {
  const missingExit = makeContext()
  missingExit.get = () => undefined
  await assert.rejects(() => probe(missingExit), /did not provide ctx\.appExit/)

  const readFailure = makeContext()
  readFailure.relayPilot.listRuns = async () => {
    throw new Error('fixture read failed')
  }
  const transcript = await captureStdout(() => probe(readFailure))
  assert.match(transcript, /^\[relay-pilot-probe-error\] /)
  const payload = JSON.parse(transcript.replace(/^\[relay-pilot-probe-error\] /, ''))
  assert.equal(payload.event, 'relay-pilot-host-error')
  assert.equal(payload.error.message, 'fixture read failed')
  assert.deepEqual(readFailure.exitCodes, [1])
})
