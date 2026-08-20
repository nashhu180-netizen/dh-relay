import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { delimiter, join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import {
  RelayPilotFixtureError,
  RelayPilotRepository,
  canonicalJson,
  loadPilotSnapshot,
  sha256Canonical,
} from '../fixture-store.mjs'
import { DETAIL_FIXTURES, FIXTURE_ROOT, LIST_FIXTURE, realConfig } from './real-fixtures.mjs'

const readReal = name => JSON.parse(readFileSync(join(FIXTURE_ROOT, name), 'utf8'))

test('loads the real DHR_25 fixture set, whose list and details do not line up 1:1', () => {
  const snapshot = loadPilotSnapshot(realConfig())
  const listed = snapshot.list.runs.map(run => run.run_id)
  const detailed = Object.keys(snapshot.details)

  // The upstream samples were never a matched pair: two listed runs have no
  // detail, two details describe runs the list does not carry. Loading must
  // still succeed — this is the case that took the whole plugin tree down.
  assert.ok(listed.some(runId => !detailed.includes(runId)))
  assert.ok(detailed.some(runId => !listed.includes(runId)))
  assert.equal(snapshot.list_fixture, LIST_FIXTURE)
  assert.deepEqual([...snapshot.detail_fixtures].sort(), [...DETAIL_FIXTURES].sort())
})

test('reports the mismatch as diagnostics rather than throwing', () => {
  const snapshot = loadPilotSnapshot(realConfig())
  const missing = snapshot.diagnostics.filter(item => item.code === 'detail-missing').map(item => item.run_id)
  const unlisted = snapshot.diagnostics.filter(item => item.code === 'detail-unlisted').map(item => item.run_id)
  assert.deepEqual(missing, ['fake-run-0007', 'fake-run-0006'])
  assert.deepEqual(unlisted.sort(), ['fake-run-0003', 'fake-run-0004'])
})

test('a listed run without a detail reads back as null, and every other run resolves', () => {
  const repository = new RelayPilotRepository(realConfig())
  assert.equal(repository.getRun('fake-run-0007'), null)
  assert.equal(repository.getRun('fake-run-0006'), null)
  for (const runId of ['fake-run-0001', 'fake-run-0002', 'fake-run-0005']) {
    assert.equal(repository.getRun(runId).run_id, runId)
  }
})

test('an unlisted detail stays reachable through getRun — the other half of the contract', () => {
  // detail-unlisted must not mean "hidden". If someone ever filters `details`
  // down to the listed runs, this is the test that goes red.
  const repository = new RelayPilotRepository(realConfig())
  for (const runId of ['fake-run-0003', 'fake-run-0004']) {
    assert.equal(repository.getRun(runId).run_id, runId)
  }
  assert.deepEqual(repository.getRun('fake-run-0003'), readReal('run-empty.json'))
})

test('passes the real list and detail models through byte-identical', () => {
  const repository = new RelayPilotRepository(realConfig())
  assert.deepEqual(repository.listRuns(), readReal(LIST_FIXTURE))
  assert.deepEqual(repository.getRun('fake-run-0005'), readReal('run-chinese.json'))
  // No field is derived: group, progress and attention counts are whatever the
  // list said, even where the detail would imply something else.
  const run0006 = repository.listRuns().runs.find(run => run.run_id === 'fake-run-0006')
  assert.equal(run0006.group, 'done')
  assert.equal(run0006.progress.total, 6)
})

test('real snapshot results are detached from the frozen internal state', () => {
  const repository = new RelayPilotRepository(realConfig())
  const first = repository.snapshot()
  first.list.runs[0].group = 'tampered'
  first.details['fake-run-0001'].nodes.length = 0
  const second = repository.snapshot()
  assert.notEqual(second.list.runs[0].group, 'tampered')
  assert.ok(second.details['fake-run-0001'].nodes.length > 0)
})

test('the same real fixture set hashes identically across loads', () => {
  assert.equal(
    loadPilotSnapshot(realConfig()).fixture_hash,
    loadPilotSnapshot(realConfig({ detailFixtures: [...DETAIL_FIXTURES].reverse() })).fixture_hash,
  )
})

test('accepts every documented form of detailFixtures, including absolute paths', () => {
  const baseline = loadPilotSnapshot(realConfig()).fixture_hash
  const absolute = DETAIL_FIXTURES.map(name => join(FIXTURE_ROOT, name))
  const forms = {
    newline: DETAIL_FIXTURES.join('\n'),
    // On win32 path.delimiter is ';', not ':' — an absolute path's drive-letter
    // colon must never be mistaken for a separator.
    'platform delimiter': DETAIL_FIXTURES.join(delimiter),
    'json array': JSON.stringify(DETAIL_FIXTURES),
    'absolute array': absolute,
    'absolute delimiter string': absolute.join(delimiter),
    'absolute json array': JSON.stringify(absolute),
  }
  for (const [label, detailFixtures] of Object.entries(forms)) {
    assert.equal(loadPilotSnapshot(realConfig({ detailFixtures })).fixture_hash, baseline, label)
  }
})

test('loads with no detail fixtures at all and degrades every run', () => {
  const repository = new RelayPilotRepository(realConfig({ detailFixtures: [] }))
  assert.equal(repository.listRuns().runs.length, 5)
  assert.equal(repository.getRun('fake-run-0001'), null)
  assert.equal(repository.diagnostics().length, 5)
})

test('requires listFixture instead of picking one for you', () => {
  assert.throws(
    () => loadPilotSnapshot({ fixtureRoot: FIXTURE_ROOT }),
    error => error instanceof RelayPilotFixtureError && error.code === 'fixture-path-invalid',
  )
})

test('rejects a wrong-schema document named as the list', () => {
  assert.throws(
    () => loadPilotSnapshot(realConfig({ listFixture: 'run-basic.json' })),
    error => error instanceof RelayPilotFixtureError && error.code === 'list-fixture-invalid',
  )
})

test('rejects a wrong-schema document named as a detail', () => {
  assert.throws(
    () => loadPilotSnapshot(realConfig({ detailFixtures: [LIST_FIXTURE] })),
    error => error instanceof RelayPilotFixtureError && error.code === 'detail-fixture-invalid',
  )
})

test('rejects two detail fixtures claiming the same run_id', () => {
  assert.throws(
    () => loadPilotSnapshot(realConfig({ detailFixtures: ['run-basic.json', 'run-basic.json'] })),
    error => error instanceof RelayPilotFixtureError && error.code === 'duplicate-run-id',
  )
})

test('reports unreadable and unparsable fixtures with their own codes', () => {
  const root = mkdtempSync(join(tmpdir(), 'dhr26-'))
  try {
    writeFileSync(join(root, 'corrupt.json'), '{ not json')
    assert.throws(
      () => loadPilotSnapshot({ fixtureRoot: root, listFixture: 'corrupt.json' }),
      error => error instanceof RelayPilotFixtureError && error.code === 'bad-json',
    )
    assert.throws(
      () => loadPilotSnapshot({ fixtureRoot: root, listFixture: 'absent.json' }),
      error => error instanceof RelayPilotFixtureError && error.code === 'fixture-read-failed',
    )
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('treats __proto__ as an ordinary run id without prototype pollution', () => {
  const root = mkdtempSync(join(tmpdir(), 'dhr26-'))
  try {
    const detail = { ...readReal('run-empty.json'), run_id: '__proto__' }
    const list = { ...readReal(LIST_FIXTURE), runs: [{ run_id: '__proto__', group: 'active' }] }
    writeFileSync(join(root, 'detail.json'), JSON.stringify(detail))
    writeFileSync(join(root, 'list.json'), JSON.stringify(list))
    const snapshot = loadPilotSnapshot({
      fixtureRoot: root, listFixture: 'list.json', detailFixtures: ['detail.json'],
    })
    assert.equal(Object.getPrototypeOf(snapshot.details), null)
    assert.equal(Object.hasOwn(snapshot.details, '__proto__'), true)
    assert.equal(snapshot.diagnostics.length, 0)
    const repository = new RelayPilotRepository({
      fixtureRoot: root, listFixture: 'list.json', detailFixtures: ['detail.json'],
    })
    assert.equal(repository.getRun('__proto__').run_id, '__proto__')
    assert.equal({}.polluted, undefined)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('canonical hash is key-order independent', () => {
  assert.equal(sha256Canonical({ b: 2, a: { z: 1, y: 0 } }), sha256Canonical({ a: { y: 0, z: 1 }, b: 2 }))
  assert.equal(canonicalJson({ b: 2, a: 1 }), '{"a":1,"b":2}')
})
