import assert from 'node:assert/strict'
import test from 'node:test'
import { groupingSignature, groupRuns, selectDetail, validateSnapshot } from '../src/model.mjs'

function run(run_id, group, run_status = 'running') {
  return { run_id, group, workflow_name: `wf-${run_id}`, run_status, progress: { done: 0, total: 1 } }
}
function detail(run_id) {
  return { schema_version: 'relay.pilot-read-model/v1', run_id, nodes: [], attentions: [] }
}
function snapshot(runs) {
  const details = Object.create(null)
  for (const item of runs) details[item.run_id] = detail(item.run_id)
  return {
    schema_version: 'relay.pilot-snapshot/v1', fixture_hash: 'abc',
    list: { schema_version: 'relay.pilot-run-list/v1', runs, source_refs: [] },
    details,
  }
}

test('preserves first-seen group order and source run order', () => {
  const list = snapshot([run('A', 'active'), run('B', 'waiting'), run('C', 'active')]).list
  assert.deepEqual(groupingSignature(list), [
    { group: 'active', run_ids: ['A', 'C'] },
    { group: 'waiting', run_ids: ['B'] },
  ])
})

test('changing group moves a run', () => {
  const runs = [run('A', 'active'), run('B', 'waiting')]
  const before = groupingSignature(snapshot(runs).list)
  runs[1] = { ...runs[1], group: 'active' }
  const after = groupingSignature(snapshot(runs).list)
  assert.notDeepEqual(after, before)
  assert.deepEqual(after, [{ group: 'active', run_ids: ['A', 'B'] }])
})

test('changing only run_status leaves grouping and order byte-equivalent', () => {
  const runs = [run('A', 'active', 'running'), run('B', 'waiting', 'blocked')]
  const before = JSON.stringify(groupingSignature(snapshot(runs).list))
  const changed = runs.map(item => ({ ...item, run_status: item.run_status === 'running' ? 'failed' : 'completed' }))
  const after = JSON.stringify(groupingSignature(snapshot(changed).list))
  assert.equal(after, before)
})

test('an unknown group is emitted verbatim as its own section', () => {
  const groups = groupRuns(snapshot([run('A', 'operator/custom')]).list)
  assert.equal(groups[0].group, 'operator/custom')
})

test('selectDetail uses own-key lookup for special run ids', () => {
  const value = snapshot([run('__proto__', 'active')])
  assert.equal(selectDetail(value, '__proto__').run_id, '__proto__')
  assert.equal(selectDetail(value, 'missing'), null)
})

test('validator rejects non-JSON and missing detail input', () => {
  const value = snapshot([run('A', 'active')])
  value.extra = () => undefined
  assert.throws(() => validateSnapshot(value), /plain JSON/)
  const missing = snapshot([run('A', 'active')])
  delete missing.details.A
  assert.throws(() => validateSnapshot(missing), /missing detail/)
})
