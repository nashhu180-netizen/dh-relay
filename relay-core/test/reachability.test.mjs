import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assessRunReachability } from '../runtime/reachability.mjs';

const dshOnly = [{ kind: 'dsh-agent', ref: 'bridge/dsh' }];
const processOnly = [{ kind: 'process', ref: 'bin/x' }];

const depthOneSample = {
  nodes: [
    { node_id: 'gate', title: '闸', role: '复核', required: false,
      executor_profiles: [{ kind: 'dsh-agent', ref: 'bridge/dsh' }] },
    { node_id: 'final', title: '终', role: '执行', required: true,
      depends_on: ['gate'],
      executor_profiles: [{ kind: 'process', ref: 'bin/x' }] },
  ],
};

test('H6 可达性：OPEN-POINTS 深度 1 原样例拒绝 dsh-only 事实必经节点', () => {
  assert.deepEqual(assessRunReachability(depthOneSample), {
    valid: false, reason: 'E_DSH_ONLY_REQUIRED_ROLE', at: '/nodes/0/executor_profiles',
  });
});

test('H6 可达性：深度 >=2 的传递依赖仍拒绝 dsh-only 事实必经节点', () => {
  const run = { nodes: [
    { node_id: 'gate', required: false, executor_profiles: dshOnly },
    { node_id: 'mid', required: false, depends_on: ['gate'], executor_profiles: processOnly },
    { node_id: 'final', required: true, depends_on: ['mid'], executor_profiles: processOnly },
  ] };
  assert.deepEqual(assessRunReachability(run), {
    valid: false, reason: 'E_DSH_ONLY_REQUIRED_ROLE', at: '/nodes/0/executor_profiles',
  });
});

test('H6 可达性：不被任何 required 节点传递可达的 dsh-only 节点放行', () => {
  const run = { nodes: [
    { node_id: 'optional-dsh', required: false, executor_profiles: dshOnly },
    { node_id: 'required-process', required: true, executor_profiles: processOnly },
  ] };
  assert.deepEqual(assessRunReachability(run), { valid: true, reason: null });
});

test('H6 可达性：直接形态复用冻结 negative fixture 并拒绝', async () => {
  const fixture = JSON.parse(await readFile(
    new URL('../fixtures/negative/h6-dsh-only-required-role.json', import.meta.url), 'utf8'));
  assert.deepEqual(assessRunReachability(fixture), {
    valid: false, reason: 'E_DSH_ONLY_REQUIRED_ROLE', at: '/nodes/0/executor_profiles',
  });
});

test('图校验：depends_on 引用不存在节点时 fail-closed', () => {
  const run = { nodes: [
    { node_id: 'final', required: true, depends_on: ['missing'], executor_profiles: processOnly },
  ] };
  assert.deepEqual(assessRunReachability(run), {
    valid: false, reason: 'E_BAD_VALUE', at: '/nodes/0/depends_on',
  });
});

test('图校验：depends_on 成环时 fail-closed', () => {
  const run = { nodes: [
    { node_id: 'a', required: true, depends_on: ['b'], executor_profiles: processOnly },
    { node_id: 'b', required: false, depends_on: ['a'], executor_profiles: processOnly },
  ] };
  assert.deepEqual(assessRunReachability(run), {
    valid: false, reason: 'E_BAD_VALUE', at: '/nodes/1/depends_on',
  });
});

test('图校验：self-loop 时 fail-closed', () => {
  const run = { nodes: [
    { node_id: 'self', required: true, depends_on: ['self'], executor_profiles: processOnly },
  ] };
  assert.deepEqual(assessRunReachability(run), {
    valid: false, reason: 'E_BAD_VALUE', at: '/nodes/0/depends_on',
  });
});
