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

test('probe emits ordinary JSON and requests bounded DSH exit', async () => {
  const ctx = makeContext()
  let transcript = ''
  const originalWrite = process.stdout.write
  process.stdout.write = (chunk, callback) => {
    transcript += String(chunk)
    if (typeof callback === 'function') callback()
    return true
  }
  try {
    await probe(ctx)
  } finally {
    process.stdout.write = originalWrite
  }
  assert.match(transcript, /^\[relay-pilot-probe\] /)
  const payload = JSON.parse(transcript.replace(/^\[relay-pilot-probe\] /, ''))
  assert.equal(payload.service, 'ctx.relayPilot')
  assert.equal(payload.plain_json, true)
  assert.deepEqual(ctx.exitCodes, [0])
})


test('probe fails closed when the DSH launcher exit seam is missing', async () => {
  const ctx = makeContext()
  ctx.get = () => undefined
  await assert.rejects(() => probe(ctx), /did not provide ctx\.appExit/)
})
