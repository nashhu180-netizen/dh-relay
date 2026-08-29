// workflow.test.mjs — DHR_31 批 2：basic-agent-task 的 Process 执行闭环。
//
// 命题（brief 完成条件 1 / design/06 H1·H2·H5 / P5-M5）：
//   ① 无 DevHarness、无 DSH 时，Workflow 定义能被 Runtime 按依赖序推进到 run_finished；
//   ② 终态只经 store.appendResult 记账，节点/attempt 身份链完整；
//   ③ 事件账是真相——重放（run.json + events.jsonl）与盘上 state.json 逐字一致；
//   ④ 失败只中断对应 attempt（E_EXECUTOR_EXIT_NONZERO），run 不得被标 succeeded；
//   ⑤ stop 能中断在跑的子进程（E_EXECUTOR_KILLED）；
//   ⑥ resume 从事件账重建进度，对失败节点开 fresh attempt（H12 的 Process 侧形态）；
//   ⑦ executor ref 只允许仓内相对路径——目录逃逸 fail-closed。

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import { localCapabilityHash } from '../rpc/capabilities.mjs';
import { createTransportClient } from '../rpc/transport.mjs';
import { endpointForRepo } from '../runtime/endpoint.mjs';
import { classifyStepOutcome, resolveStepEntry, resolveStepRef } from '../runtime/process-executor.mjs';
import { startRuntimeService } from '../runtime/service.mjs';
import { readEventLog } from '../store/store.mjs';
import { replayRun } from '../store/state.mjs';
import { settledState } from './helpers/settled-state.mjs';

const execFileAsync = promisify(execFile);
const WORKFLOW_SRC = new URL('../workflows/basic-agent-task/', import.meta.url);

const untilAsync = async (check, timeout = 30_000, what = 'condition') => {
  const end = Date.now() + timeout;
  for (;;) {
    if (await check()) return true;
    if (Date.now() > end) throw new Error(`timeout waiting for ${what}`);
    await new Promise(resolve => setTimeout(resolve, 25));
  }
};

async function makeRepo(prefix) {
  const repoRoot = await mkdtemp(join(tmpdir(), prefix));
  await writeFile(join(repoRoot, '.gitignore'), '.dh-relay/\n', 'utf8');
  await execFileAsync('git', ['init', '-q'], { cwd: repoRoot });
  return repoRoot;
}

/** 把 Workflow 定义（含 steps）按仓内相对路径落到目标仓——ref 就是这么被解析的。 */
async function installWorkflow(repoRoot) {
  const dst = join(repoRoot, 'workflows', 'basic-agent-task');
  await mkdir(join(repoRoot, 'workflows'), { recursive: true });
  await cp(WORKFLOW_SRC, dst, { recursive: true });
  return JSON.parse(await readFile(join(dst, 'run.template.json'), 'utf8'));
}

async function writeStep(repoRoot, name, source) {
  await mkdir(join(repoRoot, 'steps'), { recursive: true });
  await writeFile(join(repoRoot, 'steps', `${name}.mjs`), source, 'utf8');
  return `steps/${name}.mjs`;
}

const processNode = (nodeId, ref, dependsOn = []) => ({
  node_id: nodeId, title: nodeId, role: '执行', required: true,
  depends_on: dependsOn, executor_profiles: [{ kind: 'process', ref }],
});

const runDoc = (nodes) => ({
  protocol: 'relay.run/v2', run_id: 'R001-workflow-probe-20260828',
  workflow_name: 'relay/basic-agent-task@1', summary: 'batch2 process 闭环',
  trigger: 'system', created_at: '2026-08-28T00:00:00Z', nodes,
});

/** 一条已完成 contracts 回证的连接；同一连接连发多个方法。 */
async function connect(t, endpoint, descriptor, capability, clientId = 'workflow-test') {
  const responses = new Map();
  const client = await createTransportClient(endpoint, {
    onFrame: frame => { if ('id' in frame) responses.set(frame.id, frame); },
  });
  t.after(() => client.destroy());
  let nextId = 0;
  const call = async (method, params, requestId) => {
    const id = (nextId += 1);
    client.send({
      jsonrpc: '2.0', id, method,
      handshake: {
        protocol_version: 'relay.rpc/v1', runtime_version: '0.0.0',
        capability_hash: localCapabilityHash(), client_id: clientId, request_id: requestId,
      },
      params,
    });
    await untilAsync(async () => responses.has(id), 30_000, `${method} response`);
    return responses.get(id);
  };
  const identity = await call('contracts', {
    descriptor_version: descriptor.descriptor_version, repo_id: descriptor.repo_id,
    generation: descriptor.generation, local_user_capability: capability,
  }, 'req-contracts');
  assert.ok(identity.result, `contracts 应通过：${JSON.stringify(identity.error ?? {})}`);
  return { call };
}

async function bootService(t, prefix) {
  const repoRoot = await makeRepo(prefix);
  const endpoint = endpointForRepo(repoRoot, { runtimeRoot: join(repoRoot, 'private-runtime') });
  const capability = 'dhr31-workflow-capability';
  const service = await startRuntimeService({
    repoRoot, endpoint, localUserCapability: capability, indexPath: join(repoRoot, 'runs.json'),
  });
  t.after(async () => { await service.close(); await rm(repoRoot, { recursive: true, force: true }); });
  const session = await connect(t, endpoint, service.descriptor, capability);
  return { repoRoot, service, session };
}

const runRootOf = (repoRoot, runId) => join(repoRoot, '.dh-relay', runId);

async function readEvents(repoRoot, runId) {
  try {
    const text = await readFile(join(runRootOf(repoRoot, runId), 'events.jsonl'), 'utf8');
    return text.split('\n').filter(Boolean).map(line => JSON.parse(line));
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

const kindsOf = (events, kind) => events.filter(event => event.kind === kind);


const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 本机能建哪种链接。
 *
 * 文件符号链接在 Windows 上需要开发者模式或 `SeCreateSymbolicLinkPrivilege`，普通账号会 EPERM；
 * **目录 junction 不需要特权**，而它对本命题是等价的——`steps/outlink/evil.mjs` 同样是「词法上
 * 待在仓内、realpath 之后落在仓外」。所以先试文件链接，不行退到目录 junction，两者都不行才
 * **显式 skip 并留因**（静默变绿等于没有这条 P0 回归）。
 */
async function linkCapability() {
  const probe = await mkdtemp(join(tmpdir(), 'dhr31-linkcap-'));
  const reasons = [];
  try {
    try {
      await writeFile(join(probe, 'target.txt'), 'x', 'utf8');
      await symlink(join(probe, 'target.txt'), join(probe, 'link.txt'), 'file');
      return { ok: true, kind: 'file', reason: null };
    } catch (error) {
      reasons.push(`file-symlink: ${error?.code ?? ''} ${error?.message ?? error}`.trim());
    }
    try {
      await mkdir(join(probe, 'dir'), { recursive: true });
      await symlink(join(probe, 'dir'), join(probe, 'dirlink'), 'junction');
      return { ok: true, kind: 'dir', reason: null };
    } catch (error) {
      reasons.push(`dir-junction: ${error?.code ?? ''} ${error?.message ?? error}`.trim());
    }
    return { ok: false, kind: null, reason: reasons.join(' | ') };
  } finally {
    await rm(probe, { recursive: true, force: true });
  }
}

/** 等事件账不再增长——driver 一轮跑完不发任何事件，只能靠「稳定」来判它已经停手。 */
async function settledEvents(repoRoot, runId, quietMs = 1200) {
  let before = (await readEvents(repoRoot, runId)).length;
  for (;;) {
    await sleep(quietMs);
    const events = await readEvents(repoRoot, runId);
    if (events.length === before) return events;
    before = events.length;
  }
}

test('basic-agent-task：三节点 Process 闭环按依赖序推进到 run_finished', async (t) => {
  const { repoRoot, session } = await bootService(t, 'dhr31-wf-happy-');
  const template = await installWorkflow(repoRoot);

  const started = await session.call('start', { run: template }, 'req-start-happy');
  assert.ok(started.result, `start 应成功：${JSON.stringify(started.error ?? {})}`);
  const runId = started.result.receipt.run_id;

  await untilAsync(async () => (await readEvents(repoRoot, runId)).some(e => e.kind === 'run_finished'),
    30_000, 'run_finished');
  const events = await readEvents(repoRoot, runId);

  assert.deepEqual(kindsOf(events, 'node_started').map(e => e.node_id), ['prepare', 'process-task', 'verify'],
    '节点必须按 depends_on 依赖序推进');
  assert.deepEqual(kindsOf(events, 'attempt_succeeded').map(e => e.node_id), ['prepare', 'process-task', 'verify']);
  assert.equal(kindsOf(events, 'attempt_failed').length, 0);
  for (const event of events.filter(e => e.kind.startsWith('attempt_'))) {
    assert.ok(event.node_id, `${event.kind} 必须带 node_id`);
    assert.ok(event.attempt_id, `${event.kind} 必须带 attempt_id`);
  }
  // attempt_started 由 registerReceipt 落账、attempt_succeeded 由 appendResult 落账：
  // 两者一一配对，说明终态没有走 raw appendEvent 的旁路。
  assert.deepEqual(
    kindsOf(events, 'attempt_started').map(e => e.attempt_id),
    kindsOf(events, 'attempt_succeeded').map(e => e.attempt_id),
  );

  const state = await settledState(runRootOf(repoRoot, runId));
  assert.equal(state.run_status, 'succeeded');
  assert.deepEqual(state.progress, { done: 3, total: 3 });

  // verify 节点的结构化结果必须是机器可验的断言产物，不是一句「跑过了」。
  const run = JSON.parse(await readFile(join(runRootOf(repoRoot, runId), 'run.json'), 'utf8'));
  const receiptId = events.find(e => e.kind === 'attempt_succeeded' && e.node_id === 'verify').detail.replace('receipt:', '');
  const verifyResult = JSON.parse(await readFile(join(runRootOf(repoRoot, runId), 'results', `${receiptId}.json`), 'utf8'));
  assert.equal(verifyResult.outcome, 'succeeded');
  assert.equal(verifyResult.executor_kind, 'process');
  assert.equal(verifyResult.structured.verified, true);
  assert.ok(verifyResult.structured.checked_count >= 5, '机器校验须逐条断言，不能只有一条');

  // 事件账才是真相：从 run.json + events.jsonl 重放必须与盘上快照逐字一致。
  const replayed = replayRun({ run, events: await readEventLog({ root: runRootOf(repoRoot, runId), run }) });
  assert.deepEqual(replayed, state, '重放结果必须与 state.json 逐字一致');
});

test('basic-agent-task：步骤非 0 退出 → attempt_failed + E_EXECUTOR_EXIT_NONZERO，run 不得 succeeded', async (t) => {
  const { repoRoot, session } = await bootService(t, 'dhr31-wf-fail-');
  const okRef = await writeStep(repoRoot, 'ok', 'process.stdout.write(JSON.stringify({ ok: true }));\n');
  const badRef = await writeStep(repoRoot, 'bad', 'process.stderr.write("boom\\n"); process.exit(3);\n');
  const doc = runDoc([
    processNode('prepare', okRef),
    processNode('process-task', badRef, ['prepare']),
    processNode('verify', okRef, ['process-task']),
  ]);

  const started = await session.call('start', { run: doc }, 'req-start-fail');
  const runId = started.result.receipt.run_id;
  await untilAsync(async () => (await readEvents(repoRoot, runId)).some(e => e.kind === 'attempt_failed'),
    30_000, 'attempt_failed');

  const events = await readEvents(repoRoot, runId);
  const failed = kindsOf(events, 'attempt_failed');
  assert.equal(failed.length, 1);
  assert.equal(failed[0].node_id, 'process-task');
  assert.equal(failed[0].reason, 'E_EXECUTOR_EXIT_NONZERO');
  assert.equal(kindsOf(events, 'run_finished').length, 0, '有必经节点失败时不得写 run_finished');
  assert.deepEqual(kindsOf(events, 'node_started').map(e => e.node_id), ['prepare', 'process-task'],
    '下游节点不得在依赖失败后启动');

  const state = await settledState(runRootOf(repoRoot, runId));
  assert.equal(state.run_status, 'failed');
  assert.equal(state.node_states.find(n => n.node_id === 'prepare').status, 'succeeded',
    '一个 attempt 失败不得污染其它节点（H7）');
});

test('basic-agent-task：resume 从事件账重建进度，对失败节点开 fresh attempt', async (t) => {
  const { repoRoot, session } = await bootService(t, 'dhr31-wf-resume-');
  const okRef = await writeStep(repoRoot, 'ok', 'process.stdout.write(JSON.stringify({ ok: true }));\n');
  // 首跑失败、留下 marker；第二次（fresh attempt）读到 marker 即成功。
  const flakyRef = await writeStep(repoRoot, 'flaky', [
    "import { existsSync, writeFileSync } from 'node:fs';",
    "const marker = new URL('./flaky.marker', import.meta.url);",
    'if (existsSync(marker)) { process.stdout.write(JSON.stringify({ retried: true })); }',
    "else { writeFileSync(marker, 'x'); process.stderr.write('first run fails\\n'); process.exit(1); }",
  ].join('\n'));
  const doc = runDoc([
    processNode('prepare', okRef),
    processNode('process-task', flakyRef, ['prepare']),
    processNode('verify', okRef, ['process-task']),
  ]);

  const started = await session.call('start', { run: doc }, 'req-start-resume');
  const runId = started.result.receipt.run_id;
  await untilAsync(async () => (await readEvents(repoRoot, runId)).some(e => e.kind === 'attempt_failed'),
    30_000, 'attempt_failed');
  const beforeResume = await readEvents(repoRoot, runId);
  const failedAttemptId = kindsOf(beforeResume, 'attempt_failed')[0].attempt_id;

  const resumed = await session.call('control', { run_id: runId, action: 'resume' }, 'req-resume');
  assert.ok(resumed.result, `resume 应成功：${JSON.stringify(resumed.error ?? {})}`);

  await untilAsync(async () => (await readEvents(repoRoot, runId)).some(e => e.kind === 'run_finished'),
    30_000, 'run_finished after resume');
  const events = await readEvents(repoRoot, runId);
  const attempts = kindsOf(events, 'attempt_started').filter(e => e.node_id === 'process-task');
  assert.equal(attempts.length, 2, '重试必须产生第二个 attempt');
  assert.notEqual(attempts[1].attempt_id, failedAttemptId, 'fresh attempt 不得复用失败 attempt 的 id（H12）');

  const state = await settledState(runRootOf(repoRoot, runId));
  assert.equal(state.run_status, 'succeeded');
  assert.equal(state.node_states.find(n => n.node_id === 'process-task').attempt_count, 2);
});

test('basic-agent-task：stop 中断在跑的子进程 → attempt_failed + E_EXECUTOR_KILLED', async (t) => {
  const { repoRoot, session } = await bootService(t, 'dhr31-wf-stop-');
  const okRef = await writeStep(repoRoot, 'ok', 'process.stdout.write(JSON.stringify({ ok: true }));\n');
  const hangRef = await writeStep(repoRoot, 'hang', [
    "import { writeFileSync } from 'node:fs';",
    "writeFileSync(new URL('./hang.started', import.meta.url), 'x');",
    'setInterval(() => {}, 1000);',
  ].join('\n'));
  const doc = runDoc([
    processNode('prepare', okRef),
    processNode('process-task', hangRef, ['prepare']),
  ]);

  const started = await session.call('start', { run: doc }, 'req-start-stop');
  const runId = started.result.receipt.run_id;
  await untilAsync(async () => {
    try { await readFile(join(repoRoot, 'steps', 'hang.started'), 'utf8'); return true; } catch { return false; }
  }, 30_000, 'hang step to start');

  const stopped = await session.call('control', { run_id: runId, action: 'stop' }, 'req-stop');
  assert.ok(stopped.result, `stop 应成功：${JSON.stringify(stopped.error ?? {})}`);

  const events = await readEvents(repoRoot, runId);
  const failed = kindsOf(events, 'attempt_failed');
  assert.equal(failed.length, 1, 'stop 必须给被中断的 attempt 一个终态，而不是让它悬着');
  assert.equal(failed[0].node_id, 'process-task');
  assert.equal(failed[0].reason, 'E_EXECUTOR_KILLED');
  assert.equal(kindsOf(events, 'run_finished').length, 0);
});

test('executor ref：仓内相对路径守卫拒绝目录逃逸，驱动侧记 attempt_failed', async (t) => {
  // ① 纯函数判据（跨平台，不依赖真实文件）
  const repo = process.platform === 'win32' ? 'C:\\repo' : '/repo';
  assert.equal(resolveStepRef({ repoRoot: repo, ref: 'steps/x.mjs' }).ok, true);
  assert.equal(resolveStepRef({ repoRoot: repo, ref: './steps/x.mjs' }).ok, true);
  assert.equal(resolveStepRef({ repoRoot: repo, ref: '../outside.mjs' }).ok, false, '上跳必须拒');
  assert.equal(resolveStepRef({ repoRoot: repo, ref: 'steps/../../outside.mjs' }).ok, false, '折叠后越界必须拒');
  assert.equal(resolveStepRef({ repoRoot: repo, ref: '/etc/passwd' }).ok, false, 'POSIX 绝对路径必须拒');
  assert.equal(resolveStepRef({ repoRoot: repo, ref: 'C:\\evil.mjs' }).ok, false, 'Windows 盘符必须拒');
  assert.equal(resolveStepRef({ repoRoot: repo, ref: '~/evil.mjs' }).ok, false, '家目录展开必须拒');
  assert.equal(resolveStepRef({ repoRoot: repo, ref: '' }).ok, false);
  assert.equal(resolveStepRef({ repoRoot: repo, ref: '..' }).ok, false);
  assert.equal(resolveStepRef({ repoRoot: repo, ref: '..foo/x.mjs' }).ok, true, '目录名以点开头不是逃逸');
  assert.equal(resolveStepRef({ repoRoot: repo, ref: '../outside.mjs' }).reason, 'E_BAD_VALUE');

  // ② 结果分类（纯函数）
  assert.deepEqual(classifyStepOutcome({ code: 0, stdout: '{"a":1}' }),
    { outcome: 'succeeded', reason: null, structured: { a: 1 } });
  assert.equal(classifyStepOutcome({ code: 0, stdout: 'not json' }).reason, 'E_BAD_VALUE');
  assert.equal(classifyStepOutcome({ code: 2, stdout: '' }).reason, 'E_EXECUTOR_EXIT_NONZERO');
  assert.equal(classifyStepOutcome({ code: null, killed: true, stdout: '' }).reason, 'E_EXECUTOR_KILLED');

  // ③ 端到端：逃逸 ref 必须 fail-closed 成一个可见终态，而不是静默不跑
  const { repoRoot, session } = await bootService(t, 'dhr31-wf-escape-');
  const okRef = await writeStep(repoRoot, 'ok', 'process.stdout.write(JSON.stringify({ ok: true }));\n');
  const doc = runDoc([
    processNode('prepare', okRef),
    processNode('process-task', '../escape.mjs', ['prepare']),
  ]);
  const started = await session.call('start', { run: doc }, 'req-start-escape');
  const runId = started.result.receipt.run_id;
  await untilAsync(async () => (await readEvents(repoRoot, runId)).some(e => e.kind === 'attempt_failed'),
    30_000, 'attempt_failed for escaping ref');
  const failed = kindsOf(await readEvents(repoRoot, runId), 'attempt_failed');
  assert.equal(failed[0].node_id, 'process-task');
  assert.equal(failed[0].reason, 'E_BAD_VALUE');
});

test('executor ref：符号链接指向仓外必须与词法逃逸同途 fail-closed（F-009）', async (t) => {
  const capability = await linkCapability();
  if (!capability.ok) {
    console.log(`[skip] F-009 链接逃逸回归未执行：本机既不能建文件符号链接也不能建目录 junction（${capability.reason}）`);
    t.skip(`本机无法创建任何链接：${capability.reason}`);
    return;
  }
  console.log(`[F-009] 链接逃逸回归以 ${capability.kind === 'file' ? '文件符号链接' : '目录 junction'} 形态执行`);

  const { repoRoot, session } = await bootService(t, 'dhr31-wf-symlink-');
  // 仓外的「恶意」脚本：一旦被执行就会留下 marker——断言它从未留下，才是真的没跑。
  const outside = await mkdtemp(join(tmpdir(), 'dhr31-outside-'));
  t.after(() => rm(outside, { recursive: true, force: true }));
  const marker = join(outside, 'executed.marker');
  await writeFile(join(outside, 'evil.mjs'), [
    "import { writeFileSync } from 'node:fs';",
    `writeFileSync(${JSON.stringify(marker)}, 'executed');`,
    'process.stdout.write(JSON.stringify({ escaped: true }));',
  ].join('\n'), 'utf8');

  const okRef = await writeStep(repoRoot, 'ok', 'process.stdout.write(JSON.stringify({ ok: true }));\n');

  // 两种形态的落点完全等价：词法上待在 steps/ 里，realpath 之后落在仓外。
  let escapingRef;
  let insideRef;
  if (capability.kind === 'file') {
    await symlink(join(outside, 'evil.mjs'), join(repoRoot, 'steps', 'link.mjs'), 'file');
    await symlink(join(repoRoot, 'steps', 'ok.mjs'), join(repoRoot, 'steps', 'inside-link.mjs'), 'file');
    escapingRef = 'steps/link.mjs';
    insideRef = 'steps/inside-link.mjs';
  } else {
    await symlink(outside, join(repoRoot, 'steps', 'outlink'), 'junction');
    await mkdir(join(repoRoot, 'inside-dir'), { recursive: true });
    await writeFile(join(repoRoot, 'inside-dir', 'ok2.mjs'),
      'process.stdout.write(JSON.stringify({ ok: true }));\n', 'utf8');
    await symlink(join(repoRoot, 'inside-dir'), join(repoRoot, 'steps', 'insidelink'), 'junction');
    escapingRef = 'steps/outlink/evil.mjs';
    insideRef = 'steps/insidelink/ok2.mjs';
  }

  assert.equal(resolveStepRef({ repoRoot, ref: escapingRef }).ok, true,
    '前提：词法守卫看不出问题——这正是 F-009 能存在的原因');
  const entry = await resolveStepEntry({ repoRoot, ref: escapingRef });
  assert.deepEqual({ ok: entry.ok, reason: entry.reason }, { ok: false, reason: 'E_BAD_VALUE' },
    '真实落点守卫必须拒绝经链接的逃逸');

  const doc = runDoc([
    processNode('prepare', okRef),
    processNode('process-task', escapingRef, ['prepare']),
  ]);
  const started = await session.call('start', { run: doc }, 'req-start-symlink');
  const runId = started.result.receipt.run_id;
  await untilAsync(async () => (await readEvents(repoRoot, runId)).some(e => e.kind === 'attempt_failed'),
    30_000, 'attempt_failed for linked ref');

  const events = await readEvents(repoRoot, runId);
  const failed = kindsOf(events, 'attempt_failed');
  assert.equal(failed.length, 1);
  assert.equal(failed[0].node_id, 'process-task');
  assert.equal(failed[0].reason, 'E_BAD_VALUE');
  assert.equal(kindsOf(events, 'run_finished').length, 0);
  // 最硬的一条：仓外脚本一次都不许被执行。
  await assert.rejects(() => readFile(marker, 'utf8'), /ENOENT/,
    '仓外脚本绝不允许被执行——记了终态但先跑了一把，等于没防住');

  // 阴性对照：指向**仓内**的链接是合法的，不能被误伤成逃逸。
  const insideEntry = await resolveStepEntry({ repoRoot, ref: insideRef });
  assert.equal(insideEntry.ok, true, '仓内链接不得被误判为逃逸');
  assert.equal(insideEntry.runnable, true);
});

test('executor ref：仓内合法但文件不存在 → 节点保持 pending，零 node_started / 零 attempt_started（F-010）', async (t) => {
  const { repoRoot, session } = await bootService(t, 'dhr31-wf-missing-');
  const okRef = await writeStep(repoRoot, 'ok', 'process.stdout.write(JSON.stringify({ ok: true }));\n');
  const missingRef = 'steps/never-written.mjs';
  assert.equal(resolveStepRef({ repoRoot, ref: missingRef }).ok, true, '前提：这是一个仓内合法 ref');
  assert.deepEqual(
    await resolveStepEntry({ repoRoot, ref: missingRef }).then(entry => ({ ok: entry.ok, runnable: entry.runnable })),
    { ok: true, runnable: false },
    '不存在 ≠ 越界：它是「不可驱动」，不是错误',
  );

  const doc = runDoc([
    processNode('prepare', okRef),
    processNode('process-task', missingRef, ['prepare']),
    processNode('verify', okRef, ['process-task']),
  ]);
  const started = await session.call('start', { run: doc }, 'req-start-missing');
  const runId = started.result.receipt.run_id;
  await untilAsync(async () => (await readEvents(repoRoot, runId)).some(
    e => e.kind === 'attempt_succeeded' && e.node_id === 'prepare'), 30_000, 'prepare succeeded');

  // 这条语义是 DHR_30 兼容的保护栏（既有 Run 的 bin/probe、golden 的 bin/fix.sh 全靠它保持
  // 事件账逐字不变）。它不产生任何事件，所以只能等事件账稳定下来再断言「什么都没多」。
  const events = await settledEvents(repoRoot, runId);
  assert.deepEqual(kindsOf(events, 'node_started').map(e => e.node_id), ['prepare'],
    '不可驱动的节点不得写 node_started');
  assert.deepEqual([...new Set(kindsOf(events, 'attempt_started').map(e => e.node_id))], ['prepare'],
    '不可驱动的节点不得开 Attempt');
  assert.equal(kindsOf(events, 'attempt_failed').length, 0, '不可驱动 ≠ 失败：不得凭空造一个失败终态');
  assert.equal(kindsOf(events, 'run_finished').length, 0);

  const state = await settledState(runRootOf(repoRoot, runId));
  assert.equal(state.node_states.find(n => n.node_id === 'process-task').status, 'pending');
  assert.equal(state.node_states.find(n => n.node_id === 'process-task').attempt_count, null);
  assert.equal(state.node_states.find(n => n.node_id === 'verify').status, 'pending',
    '下游同样保持 pending，不被上游的「不可驱动」推成任何终态');
  assert.deepEqual(state.progress, { done: 1, total: 3 });
});

const withDelayLabel = (template, value) => ({
  ...template,
  labels: [{ key: 'basic-agent-task.delay_ms', value: String(value) }],
});

test('basic-agent-task：delay_ms label 让 process-task 真的慢跑，且计入结构化结果（批 3 · 3.2 备料）', async (t) => {
  const { repoRoot, session } = await bootService(t, 'dhr31-wf-delay-');
  const template = await installWorkflow(repoRoot);
  const delayMs = 1500;

  const started = await session.call('start', { run: withDelayLabel(template, delayMs) }, 'req-start-delay');
  assert.ok(started.result, `start 应成功：${JSON.stringify(started.error ?? {})}`);
  const runId = started.result.receipt.run_id;
  await untilAsync(async () => (await readEvents(repoRoot, runId)).some(e => e.kind === 'run_finished'),
    60_000, 'run_finished');

  const events = await readEvents(repoRoot, runId);
  const startedAt = events.find(e => e.kind === 'attempt_started' && e.node_id === 'process-task');
  const succeededAt = events.find(e => e.kind === 'attempt_succeeded' && e.node_id === 'process-task');
  const elapsed = Date.parse(succeededAt.at) - Date.parse(startedAt.at);
  // 事件账里的两个时间戳就是 3.2 实录要读的那两个数——所以这里按它们断言，
  // 而不是按测试自己掐的表：后者证明不了「账上看得出这条 Run 慢」。
  assert.ok(elapsed >= delayMs, `process-task 的 attempt 应至少耗 ${delayMs}ms，实测 ${elapsed}ms`);

  const receiptId = succeededAt.detail.replace('receipt:', '');
  const result = JSON.parse(await readFile(join(runRootOf(repoRoot, runId), 'results', `${receiptId}.json`), 'utf8'));
  assert.equal(result.structured.delay_ms, delayMs, '延时必须在结果里留痕，不能只靠人记得设过');
  assert.equal(result.structured.count, 4, '延时不得改变被校验的载荷');

  const state = await settledState(runRootOf(repoRoot, runId));
  assert.equal(state.run_status, 'succeeded', '慢跑的 Run 照样要走到 succeeded');
});

test('basic-agent-task：delay_ms label 值非法时 fail-closed，不得当 0 静默跑完', async (t) => {
  const { repoRoot, session } = await bootService(t, 'dhr31-wf-delaybad-');
  const template = await installWorkflow(repoRoot);

  const started = await session.call('start', { run: withDelayLabel(template, 'soon') }, 'req-start-delay-bad');
  const runId = started.result.receipt.run_id;
  await untilAsync(async () => (await readEvents(repoRoot, runId)).some(e => e.kind === 'attempt_failed'),
    30_000, 'attempt_failed');

  const events = await readEvents(repoRoot, runId);
  const failed = kindsOf(events, 'attempt_failed');
  assert.equal(failed.length, 1);
  assert.equal(failed[0].node_id, 'process-task');
  assert.equal(failed[0].reason, 'E_EXECUTOR_EXIT_NONZERO');
  assert.equal(kindsOf(events, 'run_finished').length, 0,
    '延时参数写坏了却「跑得飞快」并标成功，是最坏的一种绿');
});
