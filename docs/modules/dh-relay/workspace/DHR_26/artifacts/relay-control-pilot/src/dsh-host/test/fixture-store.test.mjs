import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import {
  RelayPilotFixtureError,
  RelayPilotRepository,
  canonicalJson,
  loadPilotSnapshot,
  sha256Canonical,
} from '../fixture-store.mjs'

function fixturePair(runId = 'RUN-1', overrides = {}) {
  const detail = {
    schema_version: 'relay.pilot-read-model/v1',
    run_id: runId,
    source_kind: 'fake',
    workflow_name: 'pilot',
    run_status: 'running',
    updated_at: '2026-08-18T00:00:00Z',
    started_at: '2026-08-18T00:00:00Z',
    trigger: 'manual',
    trigger_by: 'tester',
    attempt: 1,
    log_locator: 'logs/run-1',
    elapsed_seconds: 10,
    summary: 'summary',
    labels: ['pilot'],
    nodes: [{ node_id: 'N1', title: 'one', status: 'running', depends_on: [] }],
    attentions: [],
    source_refs: [],
    ...overrides.detail,
  }
  const listRun = {
    run_id: runId,
    group: 'active',
    workflow_name: detail.workflow_name,
    run_status: detail.run_status,
    progress: { done: 0, total: detail.nodes.length },
    attention_count: detail.attentions.length,
    max_attention_severity: null,
    top_attention_summary: null,
    current_node_id: 'N1',
    current_node_title: 'one',
    started_at: detail.started_at,
    elapsed_seconds: detail.elapsed_seconds,
    trigger: detail.trigger,
    trigger_by: detail.trigger_by,
    attempt: detail.attempt,
    log_locator: detail.log_locator,
    summary: detail.summary,
    labels: detail.labels,
    ...overrides.listRun,
  }
  return { detail, listRun }
}

function createRoot({ runs = [fixturePair()] } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'dhr26-'))
  for (const [index, pair] of runs.entries()) {
    writeFileSync(join(root, `detail-${index}.json`), JSON.stringify(pair.detail))
  }
  const active = {
    schema_version: 'relay.pilot-run-list/v1',
    source_kind: 'fake',
    updated_at: '2026-08-18T00:00:00Z',
    runs: runs.map(pair => pair.listRun),
    source_refs: [],
  }
  writeFileSync(join(root, 'runs-active.json'), JSON.stringify(active))
  writeFileSync(join(root, 'runs-empty.json'), JSON.stringify({ ...active, runs: [] }))
  return root
}

test('selects the populated list and returns correlated detail JSON', () => {
  const root = createRoot()
  try {
    const repository = new RelayPilotRepository({ fixtureRoot: root })
    assert.equal(repository.listRuns().runs.length, 1)
    assert.equal(repository.getRun('RUN-1').workflow_name, 'pilot')
    assert.equal(repository.getRun('missing'), null)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('public results are detached and cannot mutate the frozen repository snapshot', () => {
  const root = createRoot()
  try {
    const repository = new RelayPilotRepository({ fixtureRoot: root })
    const first = repository.snapshot()
    first.list.runs[0].group = 'tampered'
    first.details['RUN-1'].nodes.length = 0
    const second = repository.snapshot()
    assert.equal(second.list.runs[0].group, 'active')
    assert.equal(second.details['RUN-1'].nodes.length, 1)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('rejects a list/detail attention mismatch instead of deriving a value', () => {
  const root = createRoot({ runs: [fixturePair('RUN-X', { listRun: { attention_count: 2 } })] })
  try {
    assert.throws(
      () => loadPilotSnapshot({ fixtureRoot: root }),
      error => error instanceof RelayPilotFixtureError && error.code === 'fixture-correlation-mismatch',
    )
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('rejects a missing detail instead of fabricating one', () => {
  const root = createRoot()
  try {
    const requested = {
      schema_version: 'relay.pilot-run-list/v1', source_kind: 'fake', updated_at: 'x',
      runs: [fixturePair('RUN-MISSING').listRun], source_refs: [],
    }
    writeFileSync(join(root, 'requested.json'), JSON.stringify(requested))
    assert.throws(
      () => loadPilotSnapshot({ fixtureRoot: root, listFixture: 'requested.json' }),
      error => error instanceof RelayPilotFixtureError && error.code === 'detail-fixture-not-found',
    )
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('preserves group verbatim when only run_status changes', () => {
  const pair = fixturePair('RUN-G', {
    detail: { run_status: 'blocked' },
    listRun: { run_status: 'blocked', group: 'operator-defined-group' },
  })
  const root = createRoot({ runs: [pair] })
  try {
    const repository = new RelayPilotRepository({ fixtureRoot: root })
    assert.equal(repository.listRuns().runs[0].group, 'operator-defined-group')
    assert.equal(repository.listRuns().runs[0].run_status, 'blocked')
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('treats __proto__ as an ordinary run id without prototype pollution', () => {
  const root = createRoot({ runs: [fixturePair('__proto__')] })
  try {
    const snapshot = loadPilotSnapshot({ fixtureRoot: root })
    assert.equal(Object.getPrototypeOf(snapshot.details), null)
    assert.equal(Object.hasOwn(snapshot.details, '__proto__'), true)
    const repository = new RelayPilotRepository({ fixtureRoot: root })
    assert.equal(repository.getRun('__proto__').run_id, '__proto__')
    assert.equal({}.polluted, undefined)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('canonical hash is key-order independent', () => {
  assert.equal(sha256Canonical({ b: 2, a: { z: 1, y: 0 } }), sha256Canonical({ a: { y: 0, z: 1 }, b: 2 }))
  assert.equal(canonicalJson({ b: 2, a: 1 }), '{"a":1,"b":2}')
})
