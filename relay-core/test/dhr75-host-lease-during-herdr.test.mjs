import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { HERDR_START_TIMEOUT_MS, makeHerdrCli } from '../runtime/executors/herdr/herdr-cli.mjs';
import { createHostSessionActor, runHostSession } from '../runtime/host.mjs';
import { acquireLease, readLease } from '../runtime/lease.mjs';
import { isProcessAlive } from '../runtime/pidalive.mjs';
import { createRunWithNumbering } from '../runtime/startrun.mjs';
import { startWorkflowDriver } from '../runtime/workflow-driver.mjs';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const execFileAsync = promisify(execFile);
const INSTRUCTION = 'DHR75 test task';
const instruction_ref = { path: 'task.md', sha256: createHash('sha256').update(INSTRUCTION, 'utf8').digest('hex') };

const runDoc = () => ({
  protocol: 'relay.run/v2',
  run_id: 'placeholder',
  workflow_name: 'dhr75-lease-during-herdr',
  summary: 'DHR75 async Herdr lease test',
  trigger: 'system',
  trigger_by: null,
  created_at: '2026-09-04T00:00:00Z',
  labels: [],
  nodes: [{ node_id: 'node-a', title: 'A', role: 'executor', required: false, depends_on: [],
    executor_profiles: [{ kind: 'herdr-agent', ref: 'herdr.codex.main' }], instruction_ref }],
});

const capabilities = {
  interactive: 'supported', resume: 'supported', readonly: 'supported', headless: 'supported',
  structured_result: 'supported', user_input_passthrough: 'supported',
};

async function until(check, label, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (!check()) {
    if (Date.now() > deadline) throw new Error(`timeout:${label}`);
    await sleep(50);
  }
}

test('DHR_75/A：真实慢 Herdr 子进程不阻塞同一事件循环的续租节拍', async (t) => {
  assert.equal(HERDR_START_TIMEOUT_MS, 60_000);
  const hostSource = await readFile(new URL('../runtime/host.mjs', import.meta.url), 'utf8');
  assert.match(hostSource, /ttlMs\s*=\s*15_000/, '生产默认 Host TTL 必须仍为 15,000ms');
  const root = await mkdtemp(join(tmpdir(), 'dhr75-async-herdr-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = join(root, 'state.json');
  const bin = fileURLToPath(new URL('./helpers/fake-herdr-bin.mjs', import.meta.url));
  await writeFile(statePath, JSON.stringify({ delay_ms: 180, responses: {
    'agent get': { agent: { agent_status: 'working', state_change_seq: 1 } },
  } }), 'utf8');

  let renewTicks = 0;
  const timer = setInterval(() => { renewTicks += 1; }, 30);
  t.after(() => clearInterval(timer));

  // 本机防护软件会给首次 Node 子进程启动带来数秒抖动；上限只防挂死，不参与 renew 断言。
  const cli = makeHerdrCli({ herdrBin: process.execPath, herdrArgs: [bin, statePath], timeoutMs: 15_000 });
  const pending = cli.agentGet('slow');
  assert.equal(typeof pending?.then, 'function', 'CLI 调用必须返回 Promise，不能同步占住 Host 事件循环');
  const result = await pending;
  clearInterval(timer);

  assert.equal(result.ok, true);
  assert.ok(renewTicks >= 2, `慢调用期间至少应运行两个 renew tick，实际 ${renewTicks}`);
  const calls = JSON.parse(await readFile(statePath, 'utf8')).calls;
  assert.deepEqual(calls, [['agent', 'get', 'slow']]);
});

test('DHR_75/A 对照：仅等待更久不能代替事件循环可调度', async () => {
  let ticks = 0;
  const timer = setInterval(() => { ticks += 1; }, 10);
  const end = Date.now() + 60;
  while (Date.now() < end) {
    // 对照同步阻塞：即使“预算”比操作更长，事件循环仍没有续租机会。
  }
  clearInterval(timer);
  assert.equal(ticks, 0);
  await sleep(0);
});

test('DHR_75/A：Host actor 在真实慢 CLI 调用期间续租，独立 contender 始终被拒', async (t) => {
  const repo = await mkdtemp(join(tmpdir(), 'dhr75-host-repo-'));
  const scratch = await mkdtemp(join(tmpdir(), 'dhr75-host-index-'));
  t.after(() => rm(repo, { recursive: true, force: true }));
  t.after(() => rm(scratch, { recursive: true, force: true }));
  await writeFile(join(repo, '.gitignore'), '.dh-relay/\n', 'utf8');
  await writeFile(join(repo, 'task.md'), INSTRUCTION, 'utf8');
  await execFileAsync('git', ['init', '-q'], { cwd: repo });
  const { run_id: runId, root: runRoot } = await createRunWithNumbering({
    repoRoot: repo, slug: 'async-herdr', run: runDoc(), indexPath: join(scratch, 'runs.json'),
  });

  const statePath = join(scratch, 'state.json');
  const bin = fileURLToPath(new URL('./helpers/fake-herdr-bin.mjs', import.meta.url));
  await writeFile(statePath, JSON.stringify({ delay_ms: 3_000, responses: {
    'agent get': { agent: { agent_status: 'working', state_change_seq: 1 } },
  } }), 'utf8');

  let stop = false;
  const startedAt = Date.now();
  const session = runHostSession({
    repoRoot: repo, runId, ttlMs: 1_500, tickMs: 250,
    shouldStop: () => stop || Date.now() > startedAt + 20_000,
  });
  let before = null;
  const readyDeadline = Date.now() + 10_000;
  while (!before && Date.now() < readyDeadline) {
    before = await readLease(runRoot);
    if (!before) await sleep(50);
  }
  assert.ok(before, 'Host actor 必须先取得 lease');

  const cli = makeHerdrCli({ herdrBin: process.execPath, herdrArgs: [bin, statePath], timeoutMs: 15_000 });
  const observed = await cli.agentGet('slow');
  assert.equal(observed.ok, true);
  const after = await readLease(runRoot);
  assert.ok(after.expires_at_epoch_ms > before.expires_at_epoch_ms, '慢 CLI 期间 expiry 必须被续到更晚');
  assert.ok(after.expires_at_epoch_ms > Date.now(), '慢 CLI 返回时 lease 必须仍新鲜');
  await assert.rejects(
    () => acquireLease({ runRoot, runId, ttlMs: 1_500 }),
    error => error?.message === 'E_LEASE_HELD',
    '独立 contender 不得接管仍新鲜且持有人存活的 lease',
  );

  stop = true;
  const summary = await session;
  assert.ok(summary.renewals >= 2, `慢 CLI 期间至少续租两次，实际 ${summary.renewals}`);
});

test('DHR_75/B：真实慢 CLI 返回后，同一 Host actor 继续落 observation 与 checkpoint', async (t) => {
  const repo = await mkdtemp(join(tmpdir(), 'dhr75-driver-repo-'));
  const scratch = await mkdtemp(join(tmpdir(), 'dhr75-driver-index-'));
  t.after(() => rm(repo, { recursive: true, force: true }));
  t.after(() => rm(scratch, { recursive: true, force: true }));
  await writeFile(join(repo, '.gitignore'), '.dh-relay/\n', 'utf8');
  await writeFile(join(repo, 'task.md'), INSTRUCTION, 'utf8');
  await execFileAsync('git', ['init', '-q'], { cwd: repo });
  const { run_id: runId, root: runRoot } = await createRunWithNumbering({
    repoRoot: repo, slug: 'async-driver', run: runDoc(), indexPath: join(scratch, 'runs.json'),
  });

  const configPath = join(scratch, 'profile.json');
  const registryPath = join(scratch, 'profiles.json');
  await writeFile(configPath, JSON.stringify({ model: 'test-model' }), 'utf8');
  await writeFile(registryPath, JSON.stringify({ profiles: [{
    executor_profile_id: 'herdr.codex.main', backend: 'herdr', product: 'codex-cli',
    command_alias: 'codex', account_alias: 'acct-test', capabilities,
    supported_platforms: ['win32'], headless_supported: true,
    config_fingerprint_rule: {
      kind: 'file-exists', path_template: '${DHR75_PROFILE_HOME}/profile.json',
      fields: [{ pointer: '/model', classification: 'nonsecret' }],
    },
  }] }), 'utf8');
  const statePath = join(scratch, 'state.json');
  const bin = fileURLToPath(new URL('./helpers/fake-herdr-bin.mjs', import.meta.url));
  await writeFile(statePath, JSON.stringify({ delay_ms: 2_000, responses: {
    'agent get': { agent: { agent_status: 'working', state_change_seq: 1, terminal_id: 't1' } },
  } }), 'utf8');

  const actor = createHostSessionActor({ repoRoot: repo, runId, ttlMs: 5_000, tickMs: 250 });
  await actor.ready;
  const leaseBefore = await readLease(runRoot);
  const timeline = [{ kind: 'lease_initial', at: new Date().toISOString(),
    expires_at_epoch_ms: leaseBefore.expires_at_epoch_ms }];
  let lastExpiry = leaseBefore.expires_at_epoch_ms;
  let sampling = false;
  const leaseSampler = setInterval(async () => {
    if (sampling) return;
    sampling = true;
    try {
      const sampled = await readLease(runRoot);
      if (sampled?.expires_at_epoch_ms !== lastExpiry) {
        const previousExpiry = lastExpiry;
        lastExpiry = sampled.expires_at_epoch_ms;
        timeline.push({ kind: 'lease_renewed', at: new Date().toISOString(),
          previous_expires_at_epoch_ms: previousExpiry,
          expires_at_epoch_ms: sampled.expires_at_epoch_ms });
      }
    } finally {
      sampling = false;
    }
  }, 250);
  const slowCli = makeHerdrCli({ herdrBin: process.execPath, herdrArgs: [bin, statePath], timeoutMs: 15_000 });
  // 只把目标边界 agent-get 走真实慢子进程；其余动词用快速 Promise，避免本机进程
  // 安全扫描把无关 launch/cleanup 开销叠加进续租证据窗。
  const cli = {
    paneSplit: async () => ({ ok: true, value: { pane: { pane_id: 'p1' } } }),
    agentStart: async () => ({ ok: true, value: { agent: { terminal_id: 't1' } } }),
    agentGet: async (...args) => {
      timeline.push({ kind: 'cli_started', at: new Date().toISOString(), verb: 'agent get' });
      const result = await slowCli.agentGet(...args);
      timeline.push({ kind: 'cli_finished', at: new Date().toISOString(), verb: 'agent get', ok: result.ok });
      return result;
    },
    agentPrompt: async () => ({ ok: true, value: { type: 'ok' } }),
    paneKill: async () => ({ ok: true, value: { type: 'ok' } }),
  };
  const driver = startWorkflowDriver({
    repoRoot: repo, runId, actor,
    herdrCli: cli,
    herdrRegistryPath: registryPath, profileEnvironment: { DHR75_PROFILE_HOME: scratch },
    herdrPollMs: 50,
  });
  try {
    try {
      await until(() => actor.store.events.some(event => event.kind === 'checkpoint_recorded'),
        'first checkpoint after slow Herdr calls');
    } catch (error) {
      const calls = JSON.parse(await readFile(statePath, 'utf8')).calls;
      throw new Error(`${error.message};events=${JSON.stringify(actor.store.events)};calls=${JSON.stringify(calls)}`);
    }
    const events = actor.store.events;
    const observation = events.find(event => event.kind === 'host_observation_changed'
      && event.observation_status === 'alive');
    const checkpoint = events.find(event => event.kind === 'checkpoint_recorded');
    assert.ok(observation, '慢调用后必须先有 alive Host Observation');
    assert.ok(checkpoint, 'alive 观测后必须继续落 checkpoint');
    assert.ok(events.indexOf(observation) < events.indexOf(checkpoint), 'observation 必须早于 checkpoint');
    timeline.push({ kind: 'host_observation_changed', at: observation.at, seq: observation.seq });
    timeline.push({ kind: 'checkpoint_recorded', at: checkpoint.at, seq: checkpoint.seq });
    const leaseAfter = await readLease(runRoot);
    assert.ok(leaseAfter.expires_at_epoch_ms > leaseBefore.expires_at_epoch_ms, 'driver 慢链期间 lease 必须续期');
    assert.ok(leaseAfter.expires_at_epoch_ms > Date.now(), '首条 checkpoint 落定时 lease 必须仍新鲜');
    await assert.rejects(() => acquireLease({ runRoot, runId, ttlMs: 5_000 }), /E_LEASE_HELD/);
    timeline.push({ kind: 'contender_rejected', at: new Date().toISOString(), reason: 'E_LEASE_HELD' });
    const intervals = [];
    for (let index = 0; index < timeline.length; index += 1) {
      if (timeline[index].kind !== 'cli_started') continue;
      const finished = timeline.slice(index + 1).find(item => item.kind === 'cli_finished');
      if (finished) intervals.push([Date.parse(timeline[index].at), Date.parse(finished.at)]);
    }
    const renewalsDuringCli = timeline.filter(item => item.kind === 'lease_renewed'
      && intervals.some(([startedAt, finishedAt]) => Date.parse(item.at) >= startedAt && Date.parse(item.at) <= finishedAt));
    assert.ok(renewalsDuringCli.length >= 2,
      `真实 CLI 调用区间内至少应记录两次 expiry 推进，实际 ${renewalsDuringCli.length}`);
    assert.ok(renewalsDuringCli.every(item => item.expires_at_epoch_ms > item.previous_expires_at_epoch_ms),
      '每次 renew 都必须逐项记录并推进旧 expiry');
    t.diagnostic(`DHR75 timeline ${JSON.stringify(timeline)}`);
  } finally {
    clearInterval(leaseSampler);
    await driver.stop();
    actor.stop();
    await actor.done;
  }
});

test('DHR_75/C：新 epoch 接管后旧 actor 的 observation、checkpoint 与 Result 全部被 fencing 拒绝', async (t) => {
  const repo = await mkdtemp(join(tmpdir(), 'dhr75-fencing-repo-'));
  const scratch = await mkdtemp(join(tmpdir(), 'dhr75-fencing-index-'));
  t.after(() => rm(repo, { recursive: true, force: true }));
  t.after(() => rm(scratch, { recursive: true, force: true }));
  await writeFile(join(repo, '.gitignore'), '.dh-relay/\n', 'utf8');
  await execFileAsync('git', ['init', '-q'], { cwd: repo });
  const { run_id: runId, root: runRoot } = await createRunWithNumbering({
    repoRoot: repo, slug: 'async-fencing', run: runDoc(), indexPath: join(scratch, 'runs.json'),
  });
  const actor = createHostSessionActor({ repoRoot: repo, runId, ttlMs: 600, tickMs: 50 });
  await actor.ready;
  const oldLease = await readLease(runRoot);
  await writeFile(join(runRoot, 'host-lease.json'), JSON.stringify({
    run_id: runId, holder_pid: process.pid, epoch: oldLease.epoch + 1,
    acquired_at: new Date().toISOString(), expires_at: new Date(Date.now() + 60_000).toISOString(),
    expires_at_epoch_ms: Date.now() + 60_000, hostname: 'dhr75-contender',
  }), 'utf8');
  assert.equal((await actor.done).outcome, 'lost_lease');

  const before = [...actor.store.events];
  const jobs = [
    store => store.appendEvent({ kind: 'host_observation_changed', at: new Date().toISOString(),
      node_id: 'node-a', attempt_id: 'late-attempt', observation_status: 'alive', detail: 'late-observation' }),
    store => store.appendCheckpoint({ receipt_id: 'late-receipt', node_id: 'node-a',
      attempt_id: 'late-attempt', checkpoint_id: 'late-checkpoint', payload_digest: 'a'.repeat(64),
      at: new Date().toISOString() }),
    store => store.appendResult({ receipt_id: 'late-receipt', node_id: 'node-a',
      attempt_id: 'late-attempt', outcome: 'succeeded', reason: null, structured: {} }),
  ];
  for (const job of jobs) {
    await assert.rejects(() => actor.submitControl(job), error => error?.reason === 'E_LEASE_HELD');
  }
  assert.deepEqual(actor.store.events, before, '旧 actor 的三类迟到写均不得进入事件账');
  assert.equal(new Set(actor.store.events.map(event => event.seq)).size, actor.store.events.length,
    '事件账不得出现重复 seq');
  assert.equal((await readLease(runRoot)).epoch, oldLease.epoch + 1, '旧 actor 不得释放新 epoch');
});

test('DHR_75/D：Windows 超时等待 close，并清理 Herdr 子进程及其后代', { skip: process.platform !== 'win32' }, async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr75-timeout-tree-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = join(root, 'state.json');
  const descendantPidPath = join(root, 'descendant.pid');
  const bin = fileURLToPath(new URL('./helpers/fake-herdr-bin.mjs', import.meta.url));
  await writeFile(statePath, JSON.stringify({ delay_ms: 30_000, descendant_pid_path: descendantPidPath }), 'utf8');

  const cli = makeHerdrCli({ herdrBin: process.execPath, herdrArgs: [bin, statePath], timeoutMs: 12_000 });
  const outcome = await cli.agentGet('slow-tree');
  assert.deepEqual(outcome, {
    ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: 'spawn:ETIMEDOUT',
    missing: false, timedOut: true, notReady: false,
  });
  const descendantPid = Number(await readFile(descendantPidPath, 'utf8'));
  const deadline = Date.now() + 5_000;
  while (isProcessAlive(descendantPid) && Date.now() < deadline) await sleep(50);
  assert.equal(isProcessAlive(descendantPid), false, `超时后代进程仍存活：pid=${descendantPid}`);
});

test('DHR_75/D：spawn error、signal 与空 stdout 保持现役失败形状', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'dhr75-cli-errors-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const statePath = join(root, 'state.json');
  const bin = fileURLToPath(new URL('./helpers/fake-herdr-bin.mjs', import.meta.url));

  const missing = await makeHerdrCli({ herdrBin: join(root, 'missing-herdr.exe'), timeoutMs: 1_000 }).version();
  assert.equal(missing.ok, false);
  assert.match(missing.detail, /^spawn:ENOENT$/);

  await writeFile(statePath, JSON.stringify({ signal: 'SIGTERM' }), 'utf8');
  const signalled = await makeHerdrCli({ herdrBin: process.execPath, herdrArgs: [bin, statePath], timeoutMs: 15_000 }).agentGet('signal');
  assert.equal(signalled.ok, false);
  if (process.platform === 'win32') {
    // Windows 把子进程自发 SIGTERM 投影成 exit=1；旧 spawnSync 也是 status=1/signal=null。
    assert.match(signalled.detail, /^exit:1:/);
    assert.equal(signalled.timedOut, false);
  } else {
    assert.match(signalled.detail, /^timeout-or-signal:SIGTERM$/);
    assert.equal(signalled.timedOut, true);
  }

  await writeFile(statePath, JSON.stringify({ empty_stdout: true }), 'utf8');
  const empty = await makeHerdrCli({ herdrBin: process.execPath, herdrArgs: [bin, statePath], timeoutMs: 15_000 }).agentGet('empty');
  assert.deepEqual(empty, {
    ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: 'json-parse',
    missing: false, timedOut: false, notReady: false,
  });
});
