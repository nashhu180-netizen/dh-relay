// read-model-mirror.test.mjs — P5-M4：Read Model 必须镜像 Store 源头，不给客户端补推导。

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import { localCapabilityHash } from '../rpc/capabilities.mjs';
import { createTransportClient } from '../rpc/transport.mjs';
import { endpointForRepo } from '../runtime/endpoint.mjs';
import { startRuntimeService } from '../runtime/service.mjs';
import { createStore } from '../store/store.mjs';

const execFileAsync = promisify(execFile);
const RUN_SUMMARY_KEYS = ['group', 'read_only', 'run_id', 'run_status', 'source', 'updated_at'];
const runDocument = (runId) => ({
  protocol: 'relay.run/v2', run_id: runId, workflow_name: 'mirror', summary: 'mirror',
  trigger: 'system', created_at: '2026-08-27T00:00:00Z',
  nodes: [{ node_id: 'node-a', title: 'node', role: 'work', required: false, executor_profiles: [{ kind: 'process', ref: 'bin/probe' }] }],
});

async function setup(t) {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr30-mirror-'));
  const credentialRoot = join(repoRoot, 'private-credentials');
  await writeFile(join(repoRoot, '.gitignore'), '.dh-relay/\n', 'utf8');
  await execFileAsync('git', ['init', '-q'], { cwd: repoRoot });
  const stores = new Map();
  for (const runId of ['R001-alpha-20260827', 'R002-beta-20260827']) {
    stores.set(runId, await createStore({ root: join(repoRoot, '.dh-relay', runId), run: runDocument(runId) }));
  }
  const service = await startRuntimeService({
    repoRoot, endpoint: endpointForRepo(repoRoot), credentialRoot,
    indexPath: join(repoRoot, 'private-runtime', 'runs.json'),
  });
  t.after(async () => { await service.close().catch(() => {}); });
  t.after(async () => { await rm(repoRoot, { recursive: true, force: true }); });

  const replies = new Map();
  const client = await createTransportClient(service.descriptor.endpoint, { onFrame: frame => replies.set(frame.id, frame) });
  t.after(() => client.destroy());
  let id = 0;
  const call = async (method, params) => {
    const requestId = ++id;
    client.send({
      jsonrpc: '2.0', id: requestId, method,
      handshake: { protocol_version: 'relay.rpc/v1', runtime_version: '0.0.0', capability_hash: localCapabilityHash(), client_id: 'mirror-test', request_id: `mirror-${requestId}` },
      params,
    });
    const deadline = Date.now() + 15_000;
    for (;;) {
      if (replies.has(requestId)) return replies.get(requestId);
      if (Date.now() > deadline) throw new Error(`RPC call timed out: ${method}`);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  };
  const contracts = await call('contracts', {
    descriptor_version: service.descriptor.descriptor_version, repo_id: service.descriptor.repo_id,
    generation: service.descriptor.generation, local_user_capability: service.localUserCapability,
  });
  assert.deepEqual(contracts.result, service.descriptor);
  return { stores, call };
}

const list = async (call) => (await call('listRuns', { include_legacy: false })).result.items;
const withoutStatus = (items) => items.map(({ run_status, ...item }) => item);

test('Read Model 镜像：源头 group 改变时 run_list 的分组/排序位置必须移动', async (t) => {
  const { stores, call } = await setup(t);
  const alpha = stores.get('R001-alpha-20260827');
  const beta = stores.get('R002-beta-20260827');
  await alpha.appendEvent({ kind: 'run_created', at: '2026-08-27T00:00:00Z' });
  await beta.appendEvent({ kind: 'run_created', at: '2026-08-27T00:00:01Z' });
  await alpha.appendEvent({ kind: 'node_started', node_id: 'node-a', at: '2026-08-27T00:00:02Z' });
  await beta.appendEvent({ kind: 'node_started', node_id: 'node-a', at: '2026-08-27T00:00:03Z' });
  const before = await list(call);
  const beforeBeta = before.find(item => item.run_id === 'R002-beta-20260827');
  assert.deepEqual(before.map(item => [item.run_id, item.group]), [
    ['R001-alpha-20260827', 'running'],
    ['R002-beta-20260827', 'running'],
  ], '改前基线：同属 running 堆时按 run_id 升序');

  await beta.appendEvent({ kind: 'human_input_requested', node_id: 'node-a', at: '2026-08-27T00:00:04Z' });
  const after = await list(call);
  const afterBeta = after.find(item => item.run_id === 'R002-beta-20260827');
  assert.deepEqual(after.map(item => [item.run_id, item.group]), [
    ['R002-beta-20260827', 'needs_you'],
    ['R001-alpha-20260827', 'running'],
  ], '改后差异：R002 进入 needs_you 堆，必须先于 R001');
  assert.deepEqual(afterBeta, {
    ...beforeBeta,
    run_status: 'waiting_human', group: 'needs_you', updated_at: '2026-08-27T00:00:04Z',
  }, 'R002 仅随源头状态更新投影字段；列表位置由源头排序规则移动');
  assert.deepEqual(after.find(item => item.run_id === 'R001-alpha-20260827'), before[0], '未改源头的 R001 不得漂移');
});

test('Read Model 镜像：只改同组 run_status 时，除该字段外投影逐字不变', async (t) => {
  const { stores, call } = await setup(t);
  const alpha = stores.get('R001-alpha-20260827');
  const beta = stores.get('R002-beta-20260827');
  await alpha.appendEvent({ kind: 'run_created', at: '2026-08-27T00:00:00Z' });
  await beta.appendEvent({ kind: 'run_created', at: '2026-08-27T00:00:00Z' });
  const before = await list(call);
  const beforeAlpha = before.find(item => item.run_id === 'R001-alpha-20260827');
  const beforeBeta = before.find(item => item.run_id === 'R002-beta-20260827');
  assert.deepEqual(Object.keys(beforeAlpha).sort(), RUN_SUMMARY_KEYS, '改前基线字段面必须完整且固定');
  assert.equal(beforeAlpha.run_status, 'pending', '改前基线：源头 run_status=pending');
  assert.equal(beforeAlpha.group, 'running', '改前基线：pending 仍在 running 堆');
  await alpha.appendEvent({ kind: 'node_started', node_id: 'node-a', at: '2026-08-27T00:00:00Z' });
  const after = await list(call);
  const afterAlpha = after.find(item => item.run_id === 'R001-alpha-20260827');
  assert.deepEqual(Object.keys(afterAlpha).sort(), RUN_SUMMARY_KEYS, '改后投影字段面必须完整且固定');
  assert.equal(beforeAlpha.group, afterAlpha.group, 'pending/running 都属于源头 group=running');
  assert.deepEqual(afterAlpha, { ...beforeAlpha, run_status: 'running' }, '改后差异恰为 R001.run_status');
  assert.deepEqual(after.find(item => item.run_id === 'R002-beta-20260827'), beforeBeta, '未改的 R002 不得漂移');
  assert.deepEqual(withoutStatus(after), withoutStatus(before), '不能随 run_status 漂移其他 RunSummary 字段');
});
