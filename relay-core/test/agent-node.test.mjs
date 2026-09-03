// agent-node.test.mjs — DHR_31 批 4：Agent 节点（条件项，**窄路径**）。
//
// DHR_33 起基线 executor_kinds 是 ["herdr-agent","process"]：Herdr Agent 由 Runtime
// 托管；pi-agent / dsh-agent 仍由外部代持（Bridge / 手动），不得被这条窄路径顺带接管。
//
// 要证的三条（design/06 H7 / H12；卡面「Agent 失败不推翻 Process 结论」）：
//   ① 外部代持的 Attempt 其 executor 消失 → **只有那一个 Attempt** 记终态，其他节点与
//      Run 已落定的事实一个字节都不动；两个孤儿码按 reason-codes.md 的语义分别首用：
//        · `E_EXECUTOR_ADAPTER_LOST`（:52）= pi-agent 的 Adapter 进程当场消失 → failed
//        · `E_EXECUTOR_ORPHANED`（:54）  = Runtime 恢复后探活/重连失败、确认已无宿主 → orphaned
//   ② retry 产生 fresh Attempt（H12：换一次执行必换 attempt_id，绝不复用旧 id 续写）；
//   ③ Agent 失败不推翻 Process 结论。
//
// 本批**不改任何生产代码**——窄路径要的正是「Runtime 什么都不用做」。所以这里全是回归：
// 一旦有人把 agent 托管偷偷加进 driver（而不动基线），第一条就会红。

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import { localCapabilityHash } from '../rpc/capabilities.mjs';
import { createTransportClient } from '../rpc/transport.mjs';
import { endpointForRepo } from '../runtime/endpoint.mjs';
import { startRuntimeService } from '../runtime/service.mjs';
import { startWorkflowDriver } from '../runtime/workflow-driver.mjs';
import { createStore, openStore } from '../store/store.mjs';
import { digest } from '../tools/canonical.mjs';
import { dumpDriverScene, untilEvent, withDeadline } from './helpers/bounded-wait.mjs';
import { makeFakeHerdr } from './helpers/fake-herdr.mjs';
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
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// DHR_71：文件级硬上限——三条 herdr driver 用例（`:200` / `:236` / `:272`）自带这个 timeout，
// 于是不带 `--test-timeout` 直接单跑本文件时，挂住的用例也会**在上限内 fail 而不是挂死**。
// 180s 的依据：单条用例里最长的生产上限是 `doneTimeoutMs = 60_000`（workflow-driver.mjs:33），
// 三倍余量覆盖 Windows 上 Store 落盘的抖动；它是安全网，不是正常路径该用满的预算。
const FILE_TEST_TIMEOUT_MS = 180_000;

// 等待上限的共同依据（两条 Codex 启动用例都在等 driver 走完 launch → 首次观测 → 落账这一串）：
// 按 B-36 冻结的规则——沿该用例实际走的 `launchHerdrAgent` 调用链，把每次 Herdr CLI 调用的
// 生产上限逐段相加，再乘 1.5 的余量（Windows 上 createStore / registerReceipt / appendEvent
// 的落盘抖动）：
//   `paneSplit`  per-call `timeoutMs = 10_000`（herdr-cli.mjs:41）
// + `agentStart` 专用 `HERDR_START_TIMEOUT_MS = 60_000`（herdr-cli.mjs:17）
// + 首次 `agentGet` per-call `timeoutMs = 10_000`（herdr-cli.mjs:41）
// = 80_000 × 1.5 = 120_000。
// F-71-CON-01：原先的 30s 只按 `herdrReadyTimeoutMs` 推，漏算了 paneSplit 与 agentStart，
// 小于这条链 80s 的合法上限——一次完全合法的慢启动会被判成失败；且与同为 Codex 启动链、
// 已取 120s 的 `herdr-adapter:510` 横向矛盾。上限的职责是把挂住变成上限内 fail，必须 ≥ 合法上限。
// 与 `FILE_TEST_TIMEOUT_MS = 180_000` 的关系：文件级安全网仍 > 本预算，不动。
const HERDR_FIRST_CHECKPOINT_BUDGET_MS = 120_000;

async function makeRepo(prefix) {
  const repoRoot = await mkdtemp(join(tmpdir(), prefix));
  await writeFile(join(repoRoot, '.gitignore'), '.dh-relay/\n', 'utf8');
  await execFileAsync('git', ['init', '-q'], { cwd: repoRoot });
  return repoRoot;
}

const processNode = (nodeId, ref, dependsOn = [], required = true) => ({
  node_id: nodeId, title: nodeId, role: '执行', required,
  depends_on: dependsOn, executor_profiles: [{ kind: 'process', ref }],
});

/**
 * Agent 节点：只声明一个非 process 的 profile。
 *
 * 两种 kind 都要覆盖（批 4 小审 P1-1）——卡面「Agent 节点（Pi / DSH Native）」是并列的两项，
 * 只证 pi-agent 就等于只证了一半。ref 的语义按 kind 走（ADR-002）：pi-agent 是 adapter_ref，
 * dsh-agent 是 bridge_ref。
 *
 * 一律 `required:false`：H6 禁的是「**必经**角色只有 dsh-agent」，而窄路径下的 Agent 节点
 * 本来就不该是必经的（Runtime 托管不了它，标必经等于让 Run 永远收不了口）。也正因为它不在
 * 任何必经节点的 depends_on 传递闭包里，`assessRunReachability` 放行——这条 schema/可达性
 * 边界本身由 test/reachability.test.mjs 与 service.test.mjs 的 H6 四例守着，这里不重复。
 */
const AGENT_REFS = { 'pi-agent': 'adapters/pi-adapter', 'dsh-agent': 'adapters/dsh-bridge' };
const agentNode = (nodeId, dependsOn = [], kind = 'pi-agent') => ({
  node_id: nodeId, title: nodeId, role: '复核', required: false,
  depends_on: dependsOn, executor_profiles: [{ kind, ref: AGENT_REFS[kind] }],
});

const runDoc = (nodes, runId = 'R001-agent-node-20260828') => ({
  protocol: 'relay.run/v2', run_id: runId,
  workflow_name: 'relay/basic-agent-task@1', summary: '批4 agent 节点窄路径',
  trigger: 'system', created_at: '2026-08-28T00:00:00Z', nodes,
});

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

// ── 外部代持方的两个动作。它不是 Runtime 的一部分——它只是把「我开了一次尝试」和
//    「这次尝试的结论是什么」报给记账方，记账仍然只经 registerReceipt / appendResult。
async function holderOpensAttempt(store, nodeId) {
  const attemptId = `pi-${randomUUID()}`;
  const receiptId = `rcpt-${attemptId}`;
  const ack = await store.registerReceipt({
    receipt_id: receiptId, attempt_id: attemptId, node_id: nodeId, at: new Date().toISOString(),
  });
  assert.deepEqual(ack, { ok: true, idempotent: false });
  return { attemptId, receiptId };
}

/**
 * 代持方报结论。`executorKind` 必须由调用方给——写死成某一种就等于「无论哪种 Agent，
 * 账上记的都是 pi-agent」，dsh 的用例会在自己都没察觉的情况下断言着别人的身份链
 * （批 4 复裁 P1-1 尾巴）。
 */
function holderReports(store, { nodeId, receiptId, attemptId, executorKind, outcome, reason, structured = {} }) {
  assert.ok(executorKind, 'holderReports 必须显式给 executor_kind，不接受默认值');
  return store.appendResult({
    receipt_id: receiptId, node_id: nodeId, attempt_id: attemptId,
    executor_kind: executorKind, outcome, reason: reason ?? null,
    at: new Date().toISOString(), payload_digest: digest(structured), structured,
  });
}

/** 读某次 attempt 落盘的结果工件——`executor_kind` 只存在于这里，见下面的说明。 */
async function readResultArtifact(root, receiptId) {
  return JSON.parse(await readFile(join(root, 'results', `${receiptId}.json`), 'utf8'));
}

test('批4 边界钉：driver 不托管 agent 节点——不开 Attempt、不写任何事件', async (t) => {
  const repoRoot = await makeRepo('dhr31-agent-boundary-');
  const endpoint = endpointForRepo(repoRoot, { runtimeRoot: join(repoRoot, 'private-runtime') });
  const capability = 'dhr31-agent-capability';
  const service = await startRuntimeService({
    repoRoot, endpoint, localUserCapability: capability, indexPath: join(repoRoot, 'runs.json'),
  });
  t.after(async () => { await service.close().catch(() => {}); await rm(repoRoot, { recursive: true, force: true }); });

  await mkdir(join(repoRoot, 'workflows'), { recursive: true });
  await cp(WORKFLOW_SRC, join(repoRoot, 'workflows', 'basic-agent-task'), { recursive: true });
  const prepareRef = 'workflows/basic-agent-task/steps/prepare.mjs';

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
        capability_hash: localCapabilityHash(), client_id: 'agent-test', request_id: requestId,
      },
      params,
    });
    await untilAsync(async () => responses.has(id), 30_000, `${method} response`);
    return responses.get(id);
  };
  const identity = await call('contracts', {
    descriptor_version: service.descriptor.descriptor_version, repo_id: service.descriptor.repo_id,
    generation: service.descriptor.generation, local_user_capability: capability,
  }, 'req-contracts');
  assert.ok(identity.result);

  const started = await call('start', {
    run: runDoc([
      processNode('prepare', prepareRef),
      agentNode('agent-pi', ['prepare'], 'pi-agent'),
      agentNode('agent-dsh', ['prepare'], 'dsh-agent'),
    ]),
  }, 'req-start-agent-boundary');
  assert.ok(started.result, `start 应成功：${JSON.stringify(started.error ?? {})}`);
  const runId = started.result.receipt.run_id;

  await untilAsync(async () => (await readEvents(repoRoot, runId)).some(
    e => e.kind === 'attempt_succeeded' && e.node_id === 'prepare'), 30_000, 'prepare succeeded');
  await sleep(1500); // 给 driver 充分的机会去犯错——它本该什么都不做

  const events = await readEvents(repoRoot, runId);
  assert.deepEqual(kindsOf(events, 'node_started').map(e => e.node_id), ['prepare'],
    'agent 节点不得被 Runtime 起动——托管它就是能力变更，必须先动冻结基线');
  for (const nodeId of ['agent-pi', 'agent-dsh']) {
    assert.equal(events.some(e => e.node_id === nodeId), false,
      `${nodeId} 在事件账里一个字都不该有`);
  }

  const state = await settledState(runRootOf(repoRoot, runId));
  for (const nodeId of ['agent-pi', 'agent-dsh']) {
    const agent = state.node_states.find(node => node.node_id === nodeId);
    assert.equal(agent.status, 'pending', `${nodeId} 必须保持 pending`);
    assert.equal(agent.attempt_count, null,
      `${nodeId} 没开过 Attempt，attempt_count 必须是「没记」而不是 0`);
  }
});

test('DHR_33 窄路径：driver 托管 herdr-agent，开 Attempt、记心跳并按 stop 落 killed', { timeout: FILE_TEST_TIMEOUT_MS, skip: 'F-3520 → DHR_72：现役 driver 在 stop 时写 human_input_requested(E_EXECUTOR_KILLED) 而非 attempt_failed(E_EXECUTOR_KILLED)，用例待按 Receipt-bound 语义重写' }, async (t) => {
  const repoRoot = await makeRepo('dhr33-herdr-driver-');
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const runId = 'R001-herdr-driver-20260829';
  const run = runDoc([{
    node_id: 'agent-herdr', title: 'agent-herdr', role: '执行', required: false, depends_on: [],
    executor_profiles: [{ kind: 'herdr-agent', ref: 'herdr.codex.test' }],
  }], runId);
  const root = runRootOf(repoRoot, runId);
  await mkdir(root, { recursive: true });
  const configHome = join(repoRoot, 'profile-config-dhr33');
  await mkdir(configHome, { recursive: true });
  await writeFile(join(configHome, 'profile.json'), JSON.stringify({ model: 'test-model' }), 'utf8');
  const registryPath = join(repoRoot, 'executor-profiles.json');
  await writeFile(registryPath, JSON.stringify({ profiles: [{
    executor_profile_id: 'herdr.codex.test', backend: 'herdr', product: 'codex-cli', command_alias: 'codex', account_alias: 'acct-test',
    capabilities: { interactive: 'supported', resume: 'supported', readonly: 'supported', headless: 'supported', structured_result: 'supported', user_input_passthrough: 'supported' },
    supported_platforms: ['win32'], headless_supported: true,
    config_fingerprint_rule: { kind: 'file-exists', path_template: '${DHR33_AGENT_CONFIG}/profile.json', fields: [{ pointer: '/model', classification: 'nonsecret' }] },
  }] }), 'utf8');
  const store = await createStore({ root, run });
  await store.appendEvent({ kind: 'run_created', at: '2026-08-29T00:00:00Z' });
  const fake = makeFakeHerdr({ statuses: ['idle', 'working', 'working'] });
  const driver = startWorkflowDriver({ repoRoot, runId, actor: { submitControl: fn => fn(store) },
    herdrCli: fake.cli, herdrRegistryPath: registryPath, profileEnvironment: { DHR33_AGENT_CONFIG: configHome }, herdrPollMs: 5 });
  // 用 `finally` 而不是 `t.after`：等待抛错时下面那行 `driver.stop()` 永远轮不到，而
  // `t.after` 兜底也来不及——node:test 按登记顺序跑 after 钩子，用例体第一行登记的
  // `rm(repoRoot)` 会**先于** stop 执行，于是递归删目录撞上仍在写 `state.json.<uuid>.tmp`
  // 的 driver。F-7103 实测：挂住时活跃句柄只剩一个 `FSReqPromise`（既无 timer 也无子进程）
  // ——挂的是那次 rm，不是轮询定时器。finally 保证 driver 在任何 after 钩子之前已经收口。
  const t0 = Date.now();
  try {
    await untilEvent(() => store.events.some(event => event.kind === 'checkpoint_recorded'),
      { label: 'DHR_33 窄路径 首条 checkpoint_recorded', timeoutMs: HERDR_FIRST_CHECKPOINT_BUDGET_MS,
        dump: () => dumpDriverScene({ store, fake, t0 }) });
  } finally {
    await driver.stop();
  }
  const events = store.events;
  assert.ok(events.some(event => event.kind === 'attempt_started' && event.node_id === 'agent-herdr'));
  assert.ok(events.some(event => event.kind === 'checkpoint_recorded' && event.node_id === 'agent-herdr'));
  assert.equal(events.find(event => event.kind === 'attempt_failed' && event.node_id === 'agent-herdr')?.reason, 'E_EXECUTOR_KILLED');
});

test('DHR_61 D1: Herdr Attempt freezes source and ordered fallback identities before launch', { timeout: FILE_TEST_TIMEOUT_MS }, async (t) => {
  const repoRoot = await makeRepo('dhr61-herdr-receipt-');
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const runId = 'R001-dhr61-herdr-receipt-20260829';
  const run = runDoc([{ node_id: 'agent-herdr', title: 'agent-herdr', role: '执行', required: false, depends_on: [],
    executor_profiles: [{ kind: 'herdr-agent', ref: 'herdr.codex.test' }],
  }], runId);
  const root = runRootOf(repoRoot, runId);
  await mkdir(root, { recursive: true });
  const configHome = join(repoRoot, 'profile-config');
  await mkdir(configHome, { recursive: true });
  await writeFile(join(configHome, 'profile.json'), JSON.stringify({ model: 'test-model', ignored_token: 'not-projected' }), 'utf8');
  const rule = { kind: 'file-exists', path_template: '${DHR61_AGENT_CONFIG}/profile.json', fields: [{ pointer: '/model', classification: 'nonsecret' }] };
  const registryPath = join(repoRoot, 'executor-profiles.json');
  const capabilities = { interactive: 'supported', resume: 'supported', readonly: 'supported', headless: 'supported', structured_result: 'supported', user_input_passthrough: 'supported' };
  await writeFile(registryPath, JSON.stringify({ profiles: [
    { executor_profile_id: 'herdr.codex.test', backend: 'herdr', product: 'codex-cli', command_alias: 'codex', account_alias: 'acct-test', capabilities, supported_platforms: ['win32'], headless_supported: true, config_fingerprint_rule: rule, fallback_profile_ids: ['herdr.codex.fallback'] },
    { executor_profile_id: 'herdr.codex.fallback', backend: 'herdr', product: 'codex-cli', command_alias: 'codex', account_alias: 'acct-fallback', capabilities, supported_platforms: ['win32'], headless_supported: true, config_fingerprint_rule: rule },
  ] }), 'utf8');
  const store = await createStore({ root, run });
  await store.appendEvent({ kind: 'run_created', at: '2026-08-29T00:00:00Z' });
  const fake = makeFakeHerdr({ statuses: ['working', 'working'] });
  const driver = startWorkflowDriver({ repoRoot, runId, actor: { submitControl: fn => fn(store) }, herdrCli: fake.cli,
    herdrRegistryPath: registryPath, profileEnvironment: { DHR61_AGENT_CONFIG: configHome }, herdrPollMs: 5 });
  const t0 = Date.now();
  try { // 同上（F-7103）：driver 必须在 `rm(repoRoot)` 那个 after 钩子之前收口。
    await untilEvent(() => store.events.some(event => event.kind === 'checkpoint_recorded'),
      { label: 'DHR_61 D1 首条 checkpoint_recorded', timeoutMs: HERDR_FIRST_CHECKPOINT_BUDGET_MS,
        dump: () => dumpDriverScene({ store, fake, t0 }) });
  } finally {
    await driver.stop();
  }
  const receiptId = store.events.find(event => event.kind === 'attempt_started')?.detail.replace(/^receipt:/, '');
  const receipt = JSON.parse(await readFile(join(root, 'receipts', `${receiptId}.json`), 'utf8'));
  assert.equal(receipt.protocol, 'relay.attempt-receipt/v1');
  assert.equal(receipt.executor_identity.executor_profile_id, 'herdr.codex.test');
  assert.deepEqual(receipt.fallback_profile_snapshots.map(item => item.executor_profile_id), ['herdr.codex.fallback']);
  assert.equal(JSON.stringify(receipt).includes('test-model'), false, 'receipt must only keep hashes, never projected values');
});

test('DHR_61 D1: a Herdr profile without a projection rule leaves only that node pending', { timeout: FILE_TEST_TIMEOUT_MS }, async (t) => {
  const repoRoot = await makeRepo('dhr61-herdr-projection-missing-');
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const runId = 'R001-dhr61-projection-missing-20260830';
  const run = runDoc([
    { node_id: 'agent-herdr', title: 'agent-herdr', role: '执行', required: false, depends_on: [],
      executor_profiles: [{ kind: 'herdr-agent', ref: 'herdr.codex.legacy' }] },
    processNode('healthy-process', 'healthy.mjs'),
  ], runId);
  const root = runRootOf(repoRoot, runId);
  await mkdir(root, { recursive: true });
  await writeFile(join(repoRoot, 'healthy.mjs'), 'process.stdout.write(JSON.stringify({ ok: true }));\n', 'utf8');
  const registryPath = join(repoRoot, 'executor-profiles.json');
  await writeFile(registryPath, JSON.stringify({ profiles: [{
    executor_profile_id: 'herdr.codex.legacy', backend: 'herdr', product: 'codex-cli', command_alias: 'codex', account_alias: 'acct-legacy',
    capabilities: { interactive: 'supported', resume: 'supported', readonly: 'supported', headless: 'supported', structured_result: 'supported', user_input_passthrough: 'supported' },
    supported_platforms: ['win32'], headless_supported: true,
  }] }), 'utf8');
  const store = await createStore({ root, run });
  await store.appendEvent({ kind: 'run_created', at: run.created_at });
  const fake = makeFakeHerdr();
  const driver = startWorkflowDriver({ repoRoot, runId, actor: { submitControl: fn => fn(store) }, herdrCli: fake.cli, herdrRegistryPath: registryPath });
  const t0 = Date.now();

  // 上限依据：这条只跑一个 process 节点 + 一个停在 pending 的 herdr 节点，`driver.done`
  // 自己的生产上限就是 driver 的 `doneTimeoutMs = 60_000`（workflow-driver.mjs:33）。
  // finally 同上（F-7103）：超限时也要让 driver 先收口，再轮到 `rm(repoRoot)`。
  let doneOutcome;
  try {
    doneOutcome = await withDeadline(driver.done, { label: 'DHR_61 projection-missing driver.done',
      timeoutMs: 60_000, dump: () => dumpDriverScene({ store, fake, t0 }) });
  } finally {
    await driver.stop();
  }
  assert.deepEqual(doneOutcome, { ok: true });
  assert.equal(fake.paneSplits, 0);
  const state = await store.readState();
  assert.equal(state.node_states.find(node => node.node_id === 'agent-herdr').status, 'pending');
  assert.equal(state.node_states.find(node => node.node_id === 'healthy-process').status, 'succeeded');
});

test('DHR_33 分叉顺序：同一节点同时声明 process 与 herdr-agent 时必须先走 process', async (t) => {
  const repoRoot = await makeRepo('dhr33-process-first-');
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  const runId = 'R001-dhr33-process-first';
  const run = runDoc([{
    node_id: 'dual', title: 'dual', role: '执行', required: false, depends_on: [],
    executor_profiles: [{ kind: 'process', ref: 'process-step.mjs' }, { kind: 'herdr-agent', ref: 'herdr.codex.test' }],
  }], runId);
  const root = runRootOf(repoRoot, runId);
  await mkdir(root, { recursive: true });
  await writeFile(join(repoRoot, 'process-step.mjs'), "process.stdout.write(JSON.stringify({ source: 'process' }));\n", 'utf8');
  const registryPath = join(repoRoot, 'executor-profiles.json');
  await writeFile(registryPath, JSON.stringify({ profiles: [{
    executor_profile_id: 'herdr.codex.test', backend: 'herdr', product: 'codex-cli', command_alias: 'codex', account_alias: 'acct-test',
    capabilities: { interactive: 'supported', resume: 'supported', readonly: 'supported', headless: 'supported', structured_result: 'supported', user_input_passthrough: 'supported' },
    supported_platforms: ['win32'], headless_supported: true,
  }] }), 'utf8');
  const store = await createStore({ root, run });
  await store.appendEvent({ kind: 'run_created', at: run.created_at });
  const fake = makeFakeHerdr();
  const driver = startWorkflowDriver({ repoRoot, runId, actor: { submitControl: fn => fn(store) }, herdrCli: fake.cli, herdrRegistryPath: registryPath });
  await driver.done;
  assert.equal(fake.paneSplits, 0);
  assert.ok(store.events.some(event => event.kind === 'attempt_started' && event.node_id === 'dual'));
  assert.ok(store.events.some(event => event.kind === 'attempt_succeeded' && event.node_id === 'dual'));
});

test('批4 ①：外部代持的 Attempt 其 Adapter 消失 → 仅该 Attempt failed(E_EXECUTOR_ADAPTER_LOST)', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr31-agent-lost-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const run = runDoc([processNode('work', 'bin/work'), agentNode('agent-review', ['work'])]);
  const store = await createStore({ root, run });
  await store.appendEvent({ kind: 'run_created', at: '2026-08-28T00:00:00Z' });

  // Process 侧先落一个已定终态的事实——它就是后面「不许被推翻」的那个。
  const work = await holderOpensAttempt(store, 'work');
  assert.deepEqual(await store.appendResult({
    receipt_id: work.receiptId, node_id: 'work', attempt_id: work.attemptId,
    executor_kind: 'process', outcome: 'succeeded', reason: null,
    at: new Date().toISOString(), payload_digest: digest({ ok: true }), structured: { ok: true },
  }), { ok: true, idempotent: false });

  const workResultBefore = await readFile(join(root, 'results', `${work.receiptId}.json`), 'utf8');
  const agentAttempt = await holderOpensAttempt(store, 'agent-review');
  const stateBefore = await store.readState();
  const eventsBefore = store.events;

  // Adapter 进程当场消失：**不假设 Pi 侧会话可续**（reason-codes.md:52），报 failed。
  assert.deepEqual(await holderReports(store, {
    nodeId: 'agent-review', ...agentAttempt, executorKind: 'pi-agent',
    outcome: 'failed', reason: 'E_EXECUTOR_ADAPTER_LOST',
    structured: { adapter_ref: 'adapters/pi-adapter', detail: 'adapter process vanished' },
  }), { ok: true, idempotent: false });

  const events = store.events;
  assert.deepEqual(events.slice(0, eventsBefore.length), eventsBefore, '事件账只许追加，既有条目一字不改');
  const failed = kindsOf(events, 'attempt_failed');
  assert.equal(failed.length, 1);
  assert.equal(failed[0].node_id, 'agent-review');
  assert.equal(failed[0].attempt_id, agentAttempt.attemptId);
  assert.equal(failed[0].reason, 'E_EXECUTOR_ADAPTER_LOST');

  // H7：Attempt 是最小失败单元——别的节点与它已落定的工件一个字节都不动。
  const state = await store.readState();
  assert.deepEqual(state.node_states.find(node => node.node_id === 'work'),
    stateBefore.node_states.find(node => node.node_id === 'work'),
    'Agent 的 Attempt 失败不得改动其它节点的状态');
  assert.equal(await readFile(join(root, 'results', `${work.receiptId}.json`), 'utf8'), workResultBefore,
    '已定终态的结果工件必须逐字节不变');
  assert.equal(state.node_states.find(node => node.node_id === 'agent-review').status, 'failed');
});

test('批4 ①bis：dsh-agent 同形——宿主消失 → 仅该 Attempt orphaned(E_EXECUTOR_HOST_LOST) + fresh retry', async (t) => {
  // 批 4 小审 P1-1：卡面的 Agent 节点是「Pi / DSH Native」并列两项，只证 pi-agent 是证了一半。
  //
  // 码的选择不是照抄 ①：`E_EXECUTOR_ADAPTER_LOST` 按 reason-codes.md:52 专指 **pi-agent 的
  // Adapter 进程**消失，套到 dsh-agent 头上是错的。这里用 :53 的 `E_EXECUTOR_HOST_LOST`
  // ——「承载 Executor 的宿主消失（DSH Native Agent 场景）」，第③问的专指码。
  // **首用授权**：用户 2026-08-28 对话 AskUserQuestion 点选（F-017 闭合）；它是冻结集里
  // 既有的码，首用不算新增，`contracts/` 一个字未动。
  //
  // outcome 仍是 `orphaned` 而不是 `failed`：relay.result/v2 对两者的分界写得很死——
  // `orphaned` = 「确认观察不到了」，`failed` = 「拿到了失败结论」。宿主没了属前者：
  // 我们从来没收到过这次执行的结论。
  //
  // 断言落在**结果工件**而不是事件上：`store.appendResult` 只把 kind/at/node_id/attempt_id/
  // reason/detail 传给 `emitEvent`（store.mjs:279），`executor_kind` 不进事件账。下面把
  // 「事件里它恒为 null」也钉住——否则日后有人把断言挪到事件上，会拿 null===null 白拿一个绿。
  const root = await mkdtemp(join(tmpdir(), 'dhr31-agent-dsh-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const run = runDoc([processNode('work', 'bin/work'), agentNode('agent-dsh', ['work'], 'dsh-agent')]);
  const store = await createStore({ root, run });
  await store.appendEvent({ kind: 'run_created', at: '2026-08-28T00:00:00Z' });

  // Process 侧先落一个已定终态的事实——它就是后面「不许被推翻」的那个。
  const work = await holderOpensAttempt(store, 'work');
  await store.appendResult({
    receipt_id: work.receiptId, node_id: 'work', attempt_id: work.attemptId,
    executor_kind: 'process', outcome: 'succeeded', reason: null,
    at: new Date().toISOString(), payload_digest: digest({ ok: true }), structured: { ok: true },
  });
  const workResultBefore = await readFile(join(root, 'results', `${work.receiptId}.json`), 'utf8');
  const stateBefore = await store.readState();

  const first = await holderOpensAttempt(store, 'agent-dsh');
  assert.deepEqual(await holderReports(store, {
    nodeId: 'agent-dsh', ...first, executorKind: 'dsh-agent',
    outcome: 'orphaned', reason: 'E_EXECUTOR_HOST_LOST',
    structured: { bridge_ref: 'adapters/dsh-bridge', probe: 'host-unreachable' },
  }), { ok: true, idempotent: false });

  const orphaned = kindsOf(store.events, 'attempt_orphaned');
  assert.equal(orphaned.length, 1);
  assert.equal(orphaned[0].node_id, 'agent-dsh');
  assert.equal(orphaned[0].attempt_id, first.attemptId);
  assert.equal(orphaned[0].reason, 'E_EXECUTOR_HOST_LOST');
  assert.equal(orphaned[0].executor_kind, null,
    '冻结事件账不带 executor_kind（store.mjs:279 不传）——身份在结果工件里');
  assert.equal((await readResultArtifact(root, first.receiptId)).executor_kind, 'dsh-agent',
    'dsh 的孤儿结论必须记成 dsh-agent，不得沿用 pi-agent');

  // H7：只中断这一个 Attempt——Process 侧的状态与工件一个字节都不动。
  const stateAfter = await store.readState();
  assert.deepEqual(stateAfter.node_states.find(node => node.node_id === 'work'),
    stateBefore.node_states.find(node => node.node_id === 'work'),
    'dsh-agent 的 Attempt 孤儿化不得改动其它节点的状态');
  assert.equal(await readFile(join(root, 'results', `${work.receiptId}.json`), 'utf8'), workResultBefore,
    '已定终态的结果工件必须逐字节不变');

  // H12：retry 必须是 fresh Attempt，且旧终态锁不住它。
  const second = await holderOpensAttempt(store, 'agent-dsh');
  assert.notEqual(second.attemptId, first.attemptId, 'fresh Attempt 不得复用旧 attempt_id');
  assert.deepEqual(await holderReports(store, {
    nodeId: 'agent-dsh', ...second, executorKind: 'dsh-agent', outcome: 'succeeded', structured: { verdict: 'ok' },
  }), { ok: true, idempotent: false });
  const agent = (await store.readState()).node_states.find(node => node.node_id === 'agent-dsh');
  assert.equal(agent.status, 'succeeded');
  assert.equal(agent.attempt_count, 2);
  assert.equal(agent.current_attempt_id, second.attemptId);
  assert.equal((await readResultArtifact(root, second.receiptId)).executor_kind, 'dsh-agent',
    '重试成功的那次同样记 dsh-agent——身份链两头都不能串味');
  assert.equal(kindsOf(store.events, 'attempt_succeeded').at(-1).executor_kind, null,
    '成功事件同样不带 executor_kind（同上，冻结行为）');
});

test('批4 ②：恢复后探活失败 → orphaned(E_EXECUTOR_ORPHANED)，retry 产生 fresh Attempt', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr31-agent-orphan-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const run = runDoc([processNode('work', 'bin/work'), agentNode('agent-review', ['work'])]);
  const store = await createStore({ root, run });
  await store.appendEvent({ kind: 'run_created', at: '2026-08-28T00:00:00Z' });
  const first = await holderOpensAttempt(store, 'agent-review');

  // Runtime 重启：从事件账重建。此时那个 Attempt 还是「在飞」的。
  const reopened = await openStore({ root });
  assert.equal((await reopened.readState()).node_states.find(n => n.node_id === 'agent-review').status, 'running');

  // 按 ref 探活/重连失败，确认已无宿主（reason-codes.md:54）→ orphaned，不是 failed。
  assert.deepEqual(await holderReports(reopened, {
    nodeId: 'agent-review', ...first, executorKind: 'pi-agent',
    outcome: 'orphaned', reason: 'E_EXECUTOR_ORPHANED',
    structured: { adapter_ref: 'adapters/pi-adapter', probe: 'unreachable' },
  }), { ok: true, idempotent: false });
  const orphaned = kindsOf(reopened.events, 'attempt_orphaned');
  assert.equal(orphaned.length, 1);
  assert.equal(orphaned[0].reason, 'E_EXECUTOR_ORPHANED');
  assert.equal(orphaned[0].attempt_id, first.attemptId);

  // H12：retry 必须是 **fresh** Attempt——新 attempt_id，且旧终态锁不住它。
  const second = await holderOpensAttempt(reopened, 'agent-review');
  assert.notEqual(second.attemptId, first.attemptId, 'fresh Attempt 不得复用旧 attempt_id');
  assert.deepEqual(await holderReports(reopened, {
    nodeId: 'agent-review', ...second, executorKind: 'pi-agent', outcome: 'succeeded', structured: { verdict: 'ok' },
  }), { ok: true, idempotent: false });

  const state = await reopened.readState();
  const agent = state.node_states.find(node => node.node_id === 'agent-review');
  assert.equal(agent.status, 'succeeded', '重试成功后节点状态由 fresh Attempt 决定');
  assert.equal(agent.attempt_count, 2);
  assert.equal(agent.current_attempt_id, second.attemptId);

  // 旧 Attempt 的迟到结论只能进隔离区，绝不改写任何终态（B11）。
  const late = await holderReports(reopened, {
    nodeId: 'agent-review', ...first, executorKind: 'pi-agent',
    outcome: 'failed', reason: 'E_EXECUTOR_ADAPTER_LOST',
  });
  assert.deepEqual(late, { ok: false, reason: 'late_result_quarantined' });
  assert.equal((await reopened.readState()).node_states.find(n => n.node_id === 'agent-review').status, 'succeeded',
    '迟到的旧 Attempt 结论不得把已成功的节点拽回失败');

  // 重放一致：这一串（orphaned → fresh → succeeded → 隔离）跨重启逐字重建。
  const replayed = await openStore({ root });
  assert.deepEqual(await replayed.readState(), await reopened.readState());
});

test('批4 ③：Agent 失败不推翻 Process 结论（真实 driver 跑完闭环后外部代持补记账）', async (t) => {
  const repoRoot = await makeRepo('dhr31-agent-verdict-');
  t.after(() => rm(repoRoot, { recursive: true, force: true }));
  await mkdir(join(repoRoot, 'workflows'), { recursive: true });
  await cp(WORKFLOW_SRC, join(repoRoot, 'workflows', 'basic-agent-task'), { recursive: true });
  const stepRef = name => `workflows/basic-agent-task/steps/${name}.mjs`;

  const endpoint = endpointForRepo(repoRoot, { runtimeRoot: join(repoRoot, 'private-runtime') });
  const capability = 'dhr31-agent-capability';
  const service = await startRuntimeService({
    repoRoot, endpoint, localUserCapability: capability, indexPath: join(repoRoot, 'runs.json'),
  });
  let serviceClosed = false;
  const closeService = async () => {
    if (serviceClosed) return;
    serviceClosed = true;
    await service.close().catch(() => {});
  };
  t.after(closeService);

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
        capability_hash: localCapabilityHash(), client_id: 'agent-verdict', request_id: requestId,
      },
      params,
    });
    await untilAsync(async () => responses.has(id), 30_000, `${method} response`);
    return responses.get(id);
  };
  assert.ok((await call('contracts', {
    descriptor_version: service.descriptor.descriptor_version, repo_id: service.descriptor.repo_id,
    generation: service.descriptor.generation, local_user_capability: capability,
  }, 'req-contracts')).result);

  const started = await call('start', {
    run: runDoc([
      processNode('prepare', stepRef('prepare')),
      processNode('process-task', stepRef('process-task'), ['prepare']),
      processNode('verify', stepRef('verify'), ['process-task']),
      agentNode('agent-review', ['verify']),
    ]),
  }, 'req-start-agent-verdict');
  assert.ok(started.result, `start 应成功：${JSON.stringify(started.error ?? {})}`);
  const runId = started.result.receipt.run_id;

  // Process 闭环照常走完并收口——agent 节点是 required:false，不挡 run_finished。
  await untilAsync(async () => (await readEvents(repoRoot, runId)).some(e => e.kind === 'run_finished'),
    60_000, 'run_finished');
  const eventsBefore = await readEvents(repoRoot, runId);
  const processNodes = ['prepare', 'process-task', 'verify'];
  const stateBefore = await settledState(runRootOf(repoRoot, runId));
  const artifactsBefore = new Map();
  for (const event of kindsOf(eventsBefore, 'attempt_succeeded')) {
    const receiptId = event.detail.replace('receipt:', '');
    artifactsBefore.set(receiptId, await readFile(join(runRootOf(repoRoot, runId), 'results', `${receiptId}.json`), 'utf8'));
  }

  // 控制面退场（Runtime 释放 lease），随后由外部代持方补记 Agent 那一次尝试的结论。
  // 顺序化是刻意的：唯一写者从头到尾只有一个，代持方不是第二个并发写者。
  await closeService();
  const store = await openStore({ root: runRootOf(repoRoot, runId) });
  const agentAttempt = await holderOpensAttempt(store, 'agent-review');
  assert.deepEqual(await holderReports(store, {
    nodeId: 'agent-review', ...agentAttempt, executorKind: 'pi-agent',
    outcome: 'failed', reason: 'E_EXECUTOR_ADAPTER_LOST', structured: { detail: 'adapter gone' },
  }), { ok: true, idempotent: false });

  // 卡面明文：Agent 失败不推翻 Process 结论。
  const eventsAfter = store.events;
  assert.deepEqual(eventsAfter.slice(0, eventsBefore.length), eventsBefore,
    'Agent 的记账只许追加在已有事件账之后，既有条目一字不改');
  assert.equal(kindsOf(eventsAfter, 'run_finished').length, 1, 'run_finished 已落定，不得被撤销或重复');
  const stateAfter = await store.readState();
  for (const nodeId of processNodes) {
    assert.deepEqual(stateAfter.node_states.find(node => node.node_id === nodeId),
      stateBefore.node_states.find(node => node.node_id === nodeId),
      `${nodeId} 的结论不得被 Agent 的失败改动`);
  }
  for (const [receiptId, before] of artifactsBefore) {
    assert.equal(await readFile(join(runRootOf(repoRoot, runId), 'results', `${receiptId}.json`), 'utf8'), before,
      `${receiptId} 的结果工件必须逐字节不变`);
  }
  assert.equal(stateAfter.node_states.find(node => node.node_id === 'agent-review').status, 'failed');
  // progress 的分子只数 succeeded，Agent 失败不该让它倒退。
  assert.equal(stateAfter.progress.done, stateBefore.progress.done);

  // ⚠️ 聚合投影的两处既有语义，本卡是第一张真正撞上它们的卡（第一次产出 run_finished、
  // 第一次有可选的非 process 节点）。**按当前真实行为钉住**，登记 F-013/F-014 交主控裁决：
  // 将来若按 required 收敛聚合，这两条会红——那正是希望它红的时刻，而不是悄悄改掉。
  //   · `aggregate()` 不看 required：一个 required:false 节点失败就把 run_status 拉成 failed，
  //     尽管三个必经节点全绿、run_finished 已经落定；
  //   · 反过来，必经节点全绿但仍有 pending 的可选节点时，run_status 是 pending，
  //     于是「Run 已完成」与「run_status=pending」同时为真。
  assert.equal(stateBefore.run_status, 'pending',
    'F-014：run_finished 已落定，但存在 pending 的可选节点时聚合仍报 pending');
  assert.equal(stateAfter.run_status, 'failed',
    'F-013：aggregate 不看 required，可选节点失败即把整条 Run 拉成 failed');
});
