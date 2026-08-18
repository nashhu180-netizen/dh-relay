import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { DETAIL_SCHEMA, LIST_SCHEMA } from '../fixture-store.js'
import { createRelayPilotService } from '../service-factory.js'

class FakeContext {
  #disposers = []

  register(name, value) {
    this[name] = value
    this.#disposers.push(() => delete this[name])
  }

  dispose() {
    for (const dispose of this.#disposers.reverse()) dispose()
  }
}

class FakeService {
  constructor(ctx, name) {
    this.ctx = ctx
    this.name = name
    ctx.register(name, this)
  }
}

async function files() {
  const directory = await mkdtemp(join(tmpdir(), 'dhr26-service-'))
  const detailPath = join(directory, 'detail.json')
  const listPath = join(directory, 'list.json')
  await writeFile(detailPath, JSON.stringify({ schema_version: DETAIL_SCHEMA, run_id: 'run-1' }), 'utf8')
  await writeFile(listPath, JSON.stringify({ schema_version: LIST_SCHEMA, runs: [{ run_id: 'run-1' }] }), 'utf8')
  return { detailFixture: detailPath, listFixture: listPath }
}

test('registers ctx.relayPilot and removes it with the provider lifecycle', async () => {
  const paths = await files()
  const RelayPilotService = createRelayPilotService(FakeService)
  const ctx = new FakeContext()
  const service = new RelayPilotService(ctx, paths)
  assert.equal(ctx.relayPilot, service)
  assert.equal((await ctx.relayPilot.listRuns()).schema_version, LIST_SCHEMA)
  assert.equal((await ctx.relayPilot.inspectRun('run-1')).schema_version, DETAIL_SCHEMA)
  ctx.dispose()
  assert.equal(ctx.relayPilot, undefined)
})

test('inspectRun rejects a run id that the selected fixture does not contain', async () => {
  const paths = await files()
  const RelayPilotService = createRelayPilotService(FakeService)
  const ctx = new FakeContext()
  new RelayPilotService(ctx, paths)
  await assert.rejects(ctx.relayPilot.inspectRun('other'), /fixture does not contain run other/)
})
