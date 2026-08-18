import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { DETAIL_SCHEMA, FixtureStore, LIST_SCHEMA } from '../fixture-store.js'
import { isPlainJson } from '../plain-json.js'

async function fixtureFiles(overrides = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'dhr26-'))
  const detail = { schema_version: DETAIL_SCHEMA, run_id: 'run-1', run_status: 'running', nodes: [] }
  const list = { schema_version: LIST_SCHEMA, source_kind: 'fake', runs: [{ run_id: 'run-1', group: 'active' }] }
  const detailPath = join(directory, 'detail.json')
  const listPath = join(directory, 'list.json')
  await writeFile(detailPath, overrides.detailText ?? JSON.stringify(detail, null, 2), 'utf8')
  await writeFile(listPath, overrides.listText ?? JSON.stringify(list, null, 2), 'utf8')
  return { detail, list, detailPath, listPath }
}

test('returns both fixtures field-for-field with ordinary JSON only', async () => {
  const files = await fixtureFiles()
  const store = new FixtureStore({ detailFixture: files.detailPath, listFixture: files.listPath })
  const actualDetail = await store.readDetail()
  const actualList = await store.readList()
  assert.deepEqual(actualDetail, JSON.parse(await readFile(files.detailPath, 'utf8')))
  assert.deepEqual(actualList, JSON.parse(await readFile(files.listPath, 'utf8')))
  assert.equal(isPlainJson(actualDetail), true)
  assert.equal(isPlainJson(actualList), true)
})

test('returns a fresh object on every call, so consumers cannot mutate the source', async () => {
  const files = await fixtureFiles()
  const store = new FixtureStore({ detailFixture: files.detailPath, listFixture: files.listPath })
  const first = await store.readDetail()
  first.run_status = 'mutated'
  const second = await store.readDetail()
  assert.equal(second.run_status, 'running')
})

test('rejects a damaged fixture with an explicit label', async () => {
  const files = await fixtureFiles({ detailText: '{broken' })
  const store = new FixtureStore({ detailFixture: files.detailPath, listFixture: files.listPath })
  await assert.rejects(store.readDetail(), /detail fixture is not valid JSON/)
})

test('rejects a schema swap instead of guessing', async () => {
  const files = await fixtureFiles()
  const store = new FixtureStore({ detailFixture: files.listPath, listFixture: files.detailPath })
  await assert.rejects(store.readDetail(), new RegExp(DETAIL_SCHEMA.replaceAll('/', '\\/')))
  await assert.rejects(store.readList(), new RegExp(LIST_SCHEMA.replaceAll('/', '\\/')))
})

test('requires explicit fixture locations', () => {
  const oldDetail = process.env.RELAY_PILOT_DETAIL_FIXTURE
  const oldList = process.env.RELAY_PILOT_LIST_FIXTURE
  delete process.env.RELAY_PILOT_DETAIL_FIXTURE
  delete process.env.RELAY_PILOT_LIST_FIXTURE
  try {
    assert.throws(() => new FixtureStore(), /detailFixture is required/)
  } finally {
    if (oldDetail !== undefined) process.env.RELAY_PILOT_DETAIL_FIXTURE = oldDetail
    if (oldList !== undefined) process.env.RELAY_PILOT_LIST_FIXTURE = oldList
  }
})
