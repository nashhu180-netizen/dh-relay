import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createStore, openStore } from '../store/store.mjs';
import { startWorkflowDriver } from '../runtime/workflow-driver.mjs';
import { makeFakeHerdr } from './helpers/fake-herdr.mjs';

const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');
const until = async (check, label) => {
  const deadline = Date.now() + 30_000;
  while (!(await check())) {
    if (Date.now() >= deadline) throw new Error(`timeout waiting for ${label}`);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
};
const startupDispatchOf = store => {
  const receiptId = store.events.find(event => event.kind === 'attempt_started')?.detail?.replace(/^receipt:/, '');
  return receiptId ? store.getStartupDispatch(receiptId) : null;
};

async function fixture(t, instructionRef, { statuses = ['idle'], clock = () => Date.now(), monotonicClock = clock,
  instructionText = null, outsideInstructionText = null, startupInstructionLoader = undefined, terminalIds = null,
  actorFactory = store => ({ submitControl: fn => fn(store) }), agentPrompt = null } = {}) {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr78-'));
  const runId = 'R001-dhr78';
  const root = join(repoRoot, '.dh-relay', runId);
  const profilePath = join(repoRoot, 'profile.json');
  const registryPath = join(repoRoot, 'profiles.json');
  await mkdir(root, { recursive: true });
  await writeFile(profilePath, JSON.stringify({ model: 'test-model' }), 'utf8');
  if (instructionText !== null) await writeFile(join(repoRoot, instructionRef.path), instructionText, 'utf8');
  const outsideInstruction = outsideInstructionText === null ? null : join(repoRoot, instructionRef.path);
  if (outsideInstruction !== null) await writeFile(outsideInstruction, outsideInstructionText, 'utf8');
  await writeFile(registryPath, JSON.stringify({ profiles: [{
    executor_profile_id: 'herdr.codex.test', backend: 'herdr', product: 'codex-cli', command_alias: 'codex', account_alias: 'acct-test',
    capabilities: { interactive: 'supported', resume: 'supported', readonly: 'supported', headless: 'supported', structured_result: 'supported', user_input_passthrough: 'supported' },
    supported_platforms: ['win32'], headless_supported: true,
    config_fingerprint_rule: { kind: 'file-exists', path_template: '${DHR78_PROFILE_HOME}/profile.json', fields: [{ pointer: '/model', classification: 'nonsecret' }] },
  }] }), 'utf8');
  const run = { protocol: 'relay.run/v2', run_id: runId, workflow_name: 'relay/dhr78@1', summary: 'startup dispatch', trigger: 'system', created_at: '2026-09-07T00:00:00Z', nodes: [{
    node_id: 'herdr', title: 'herdr', role: 'executor', required: false, depends_on: [],
    executor_profiles: [{ kind: 'herdr-agent', ref: 'herdr.codex.test' }],
    ...instructionRef === undefined ? {} : { instruction_ref: instructionRef },
  }] };
  const store = await createStore({ root, run });
  await store.appendEvent({ kind: 'run_created', at: run.created_at });
  const fake = makeFakeHerdr({ statuses, terminalIds });
  if (agentPrompt) fake.cli.agentPrompt = agentPrompt;
  const driver = startWorkflowDriver({ repoRoot, runId, actor: actorFactory(store, fake, repoRoot), herdrCli: fake.cli,
    herdrRegistryPath: registryPath, profileEnvironment: { DHR78_PROFILE_HOME: repoRoot }, herdrPollMs: 5, clock,
    monotonicClock, ...(startupInstructionLoader ? { startupInstructionLoader } : {}) });
  t.after(async () => {
    await driver.stop();
    await driver.done;
    if (outsideInstruction !== null) await rm(outsideInstruction, { force: true });
    await rm(repoRoot, { recursive: true, force: true });
  });
  return { fake, driver, root, repoRoot, registryPath, store };
}

test('DHR_78：没有 instruction_ref 的 Herdr node 不得开 Attempt 或启动 Agent', async (t) => {
  const { fake, driver } = await fixture(t);
  await new Promise(resolve => setTimeout(resolve, 500));
  const outcome = await driver.stop();
  assert.equal(outcome.ok, true, String(outcome.error));
  assert.equal(fake.calls.some(([kind]) => kind === 'agentStart'), false);
});

test('DHR_78：越出仓根的 instruction_ref 不得开 Attempt 或启动 Agent', async (t) => {
  const instruction = '仓外任务内容';
  const path = `../dhr78-outside-${process.pid}.md`;
  const { fake, driver, store } = await fixture(t, { path, sha256: sha256(instruction) }, { outsideInstructionText: instruction });
  await new Promise(resolve => setTimeout(resolve, 200));
  assert.equal(store.events.some(event => event.kind === 'attempt_started'), false);
  assert.equal(fake.calls.some(([kind]) => kind === 'agentStart'), false);
  await driver.stop();
});

test('DHR_78：摘要不匹配的 instruction_ref 不得开 Attempt 或启动 Agent', async (t) => {
  const { fake, driver, store } = await fixture(t, { path: 'task.md', sha256: sha256('expected') }, { instructionText: 'changed' });
  await new Promise(resolve => setTimeout(resolve, 200));
  assert.equal(store.events.some(event => event.kind === 'attempt_started'), false);
  assert.equal(fake.calls.some(([kind]) => kind === 'agentStart'), false);
  await driver.stop();
});

test('DHR_78：首发和无进展补发使用同一启动内容，并在发送前持久占次', async (t) => {
  const instruction = '只在这里保存业务任务内容。';
  const now = { value: 0 };
  const instructionRef = { path: 'task.md', sha256: sha256(instruction) };
  const { fake, driver, root, repoRoot, store } = await fixture(t, instructionRef, { clock: () => now.value, instructionText: instruction });
  await until(() => fake.sent.length === 1, 'first startup prompt');
  const receiptId = fake.sent[0].text.match(/relay submit-result --receipt-id (rcpt-[^ ]+) --outcome succeeded/)?.[1];
  assert.ok(receiptId, 'startup envelope has a Receipt submission command');
  assert.equal(fake.sent[0].text, [
    `任务仓根：${repoRoot}`,
    `任务指针：task.md (sha256:${instructionRef.sha256})`,
    '先打开任务指针；其中正文是本 Attempt 唯一业务任务，执行其中正文；完成任务后再提交 Receipt-bound 结果；Receipt 提交命令不是业务任务：',
    `relay submit-result --receipt-id ${receiptId} --outcome succeeded`,
    `或：relay submit-result --receipt-id ${receiptId} --outcome failed --reason E_EXECUTOR_REPORTED_FAILURE`,
    '重复收到本指令时，从持久事实续做；不要通过 pane 输出、日志、退出码或其它通道代替该提交。',
  ].join('\n'));
  assert.equal(fake.sent[0].text.includes(instruction), false, 'instruction body is not copied into the startup envelope');
  await until(() => startupDispatchOf(store)?.outcome === 'accepted', 'first dispatch outcome');
  const firstRecord = JSON.parse(await readFile(join(root, 'startup-dispatch.json'), 'utf8'));
  assert.equal(firstRecord.records[0].send_count, 1);
  assert.equal(firstRecord.records[0].outcome, 'accepted');
  const probesAfterFirstSend = fake.agentGets;
  await until(() => fake.agentGets > probesAfterFirstSend, 'post-first-send observation at zero time');
  now.value = 60_000;
  await until(() => fake.sent.length === 2, 'one startup retry');
  assert.equal(fake.sent[1].text, fake.sent[0].text);
  const secondRecord = JSON.parse(await readFile(join(root, 'startup-dispatch.json'), 'utf8'));
  assert.equal(secondRecord.records[0].send_count, 2);
  assert.equal(secondRecord.records[0].prompt_digest, firstRecord.records[0].prompt_digest);
  now.value = 120_000;
  await new Promise(resolve => setTimeout(resolve, 80));
  assert.equal(fake.sent.length, 2, 'a third startup prompt is forbidden');
  await driver.stop();
});

test('DHR_78：发送前 host identity 变化时已占次数但不调用 Agent', async (t) => {
  const instruction = '任务内容';
  const { fake, driver, root, store } = await fixture(t, { path: 'task.md', sha256: sha256(instruction) }, {
    instructionText: instruction, terminalIds: ['term-1', 'term-2'],
  });
  await until(() => startupDispatchOf(store)?.outcome === 'authorized', 'identity-change dispatch reservation');
  await driver.stop();
  assert.equal(fake.sent.length, 0);
  const record = JSON.parse(await readFile(join(root, 'startup-dispatch.json'), 'utf8')).records[0];
  assert.equal(record.send_count, 1);
  assert.equal(record.outcome, 'authorized');
});

test('DHR_78：最终调用前重新进入 blocked 时已占次数但不调用 Agent', async (t) => {
  const instruction = '任务内容';
  const { fake, driver, root, store } = await fixture(t, { path: 'task.md', sha256: sha256(instruction) }, {
    instructionText: instruction, statuses: ['idle', 'blocked'],
  });
  await until(() => startupDispatchOf(store)?.outcome === 'authorized', 'blocked dispatch reservation');
  await driver.stop();
  assert.equal(fake.sent.length, 0);
  const record = JSON.parse(await readFile(join(root, 'startup-dispatch.json'), 'utf8')).records[0];
  assert.equal(record.send_count, 1);
  assert.equal(record.outcome, 'authorized');
});

test('DHR_78：发送前失租时已占次数但不调用 Agent', async (t) => {
  const instruction = '任务内容';
  const actorFactory = store => ({
    submitControl: async fn => fn(new Proxy(store, { get(target, property) {
      if (property === 'confirmStartupDispatch') return async () => { throw new Error('E_LEASE_LOST'); };
      return Reflect.get(target, property);
    } })),
  });
  const { fake, driver, root } = await fixture(t, { path: 'task.md', sha256: sha256(instruction) }, {
    instructionText: instruction, actorFactory,
  });
  const outcome = await driver.done;
  assert.equal(outcome.ok, false);
  assert.match(outcome.error.message, /E_LEASE_LOST/);
  assert.equal(fake.sent.length, 0);
  const record = JSON.parse(await readFile(join(root, 'startup-dispatch.json'), 'utf8')).records[0];
  assert.equal(record.send_count, 1);
  assert.equal(record.outcome, 'authorized');
});

test('DHR_78：Store 最终确认后源摘要漂移时不调用 Agent', async (t) => {
  const instruction = '任务内容';
  const actorFactory = (store, _fake, repoRoot) => ({
    submitControl: async fn => fn(new Proxy(store, { get(target, property) {
      if (property === 'confirmStartupDispatch') return async input => {
        const confirmed = await target.confirmStartupDispatch(input);
        await writeFile(join(repoRoot, 'task.md'), 'changed-after-confirm', 'utf8');
        return confirmed;
      };
      return Reflect.get(target, property);
    } })),
  });
  const { fake, driver, store } = await fixture(t, { path: 'task.md', sha256: sha256(instruction) }, {
    instructionText: instruction, actorFactory,
  });
  await until(() => startupDispatchOf(store)?.outcome === 'authorized', 'post-confirm source drift');
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(fake.sent.length, 0);
  await driver.stop();
});

test('DHR_78：Store 最终确认后 host 状态漂移时不调用 Agent', async (t) => {
  const instruction = '任务内容';
  const actorFactory = (store, fake) => ({
    submitControl: async fn => fn(new Proxy(store, { get(target, property) {
      if (property === 'confirmStartupDispatch') return async input => {
        const confirmed = await target.confirmStartupDispatch(input);
        fake.setStatuses(['blocked']);
        return confirmed;
      };
      return Reflect.get(target, property);
    } })),
  });
  const { fake, driver, store } = await fixture(t, { path: 'task.md', sha256: sha256(instruction) }, {
    instructionText: instruction, actorFactory,
  });
  await until(() => startupDispatchOf(store)?.outcome === 'authorized', 'post-confirm host drift');
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(fake.sent.length, 0);
  await driver.stop();
});

test('DHR_78：Herdr 首发失败后不自动重试', async (t) => {
  const instruction = '任务内容';
  let prompts = 0;
  const now = { value: 0 };
  const { driver, root, store } = await fixture(t, { path: 'task.md', sha256: sha256(instruction) }, {
    instructionText: instruction, clock: () => now.value,
    agentPrompt: () => { prompts += 1; return { ok: false, reason: 'E_EXECUTOR_TIMEOUT' }; },
  });
  await until(() => startupDispatchOf(store)?.outcome === 'failed', 'failed startup dispatch');
  now.value = 120_000;
  await new Promise(resolve => setTimeout(resolve, 80));
  assert.equal(prompts, 1);
  await driver.stop();
});

test('DHR_78：当前 Attempt 已有 checkpoint 时，60 秒后不补发', async (t) => {
  const instruction = '任务内容';
  const now = { value: 0 };
  const { fake, driver, store } = await fixture(t, { path: 'task.md', sha256: sha256(instruction) }, {
    instructionText: instruction, statuses: ['idle', 'working'], clock: () => now.value,
  });
  await until(() => fake.sent.length === 1, 'first startup prompt');
  await until(() => store.events.some(event => event.kind === 'checkpoint_recorded'), 'current attempt checkpoint');
  now.value = 60_000;
  await new Promise(resolve => setTimeout(resolve, 80));
  assert.equal(fake.sent.length, 1);
  await driver.stop();
});

test('DHR_78：60 秒时 host 为 working 但 Store 尚无进展仍补发一次', async (t) => {
  const instruction = '任务内容';
  const now = { value: 0 };
  const { fake, driver, store } = await fixture(t, { path: 'task.md', sha256: sha256(instruction) }, {
    instructionText: instruction, clock: () => now.value,
  });
  await until(() => fake.sent.length === 1, 'first startup prompt');
  await until(() => startupDispatchOf(store)?.outcome === 'accepted', 'first startup outcome');
  const probesAfterSend = fake.agentGets;
  await until(() => fake.agentGets > probesAfterSend, 'post-send observation at zero time');
  assert.equal(store.events.some(event => event.kind === 'checkpoint_recorded'), false);
  now.value = 60_000;
  fake.setStatuses(['working']);
  await until(() => fake.sent.length === 2, 'working without Store progress retry');
  assert.equal(fake.sent[1].text, fake.sent[0].text);
  await driver.stop();
});

test('DHR_78：首发后转为 blocked，即使满 60 秒也不得补发', async (t) => {
  const instruction = '任务内容';
  const now = { value: 0 };
  const { fake, driver } = await fixture(t, { path: 'task.md', sha256: sha256(instruction) }, {
    instructionText: instruction, clock: () => now.value,
  });
  await until(() => fake.sent.length === 1, 'first startup prompt');
  fake.setStatuses(['blocked']);
  now.value = 60_000;
  await new Promise(resolve => setTimeout(resolve, 80));
  assert.equal(fake.sent.length, 1);
  await driver.stop();
});

test('DHR_78：首发后源摘要变化时停止自动补发', async (t) => {
  const instruction = '任务内容';
  const now = { value: 0 };
  const { fake, driver, repoRoot } = await fixture(t, { path: 'task.md', sha256: sha256(instruction) }, {
    instructionText: instruction, clock: () => now.value,
  });
  await until(() => fake.sent.length === 1, 'first startup prompt');
  await writeFile(join(repoRoot, 'task.md'), 'changed', 'utf8');
  now.value = 60_000;
  await new Promise(resolve => setTimeout(resolve, 80));
  assert.equal(fake.sent.length, 1);
  await driver.stop();
});

test('DHR_78：恢复当前旧 Attempt 继续观测，但绝不重发启动内容', async (t) => {
  const instruction = '任务内容';
  const { fake, driver, root, repoRoot, registryPath, store } = await fixture(t,
    { path: 'task.md', sha256: sha256(instruction) }, { instructionText: instruction });
  await until(() => fake.sent.length === 1, 'first startup prompt');
  await driver.stop();
  const probesBeforeResume = fake.agentGets;
  const resumed = startWorkflowDriver({ repoRoot, runId: 'R001-dhr78', actor: { submitControl: fn => fn(store) }, herdrCli: fake.cli,
    herdrRegistryPath: registryPath, profileEnvironment: { DHR78_PROFILE_HOME: repoRoot }, herdrPollMs: 5 });
  await until(() => fake.agentGets > probesBeforeResume, 'recovery observation');
  assert.equal(fake.sent.length, 1);
  await resumed.stop();
  await resumed.done;
  assert.equal(JSON.parse(await readFile(join(root, 'startup-dispatch.json'), 'utf8')).records[0].send_count, 1);
});

test('DHR_78：占次后、发送前 stop 时不调用 Agent，恢复明确提示可能未送达', async (t) => {
  const instruction = '任务内容';
  const instructionRef = { path: 'task.md', sha256: sha256(instruction) };
  let receiptReads = 0;
  let releaseBeforeSend;
  const beforeSend = new Promise(resolve => { releaseBeforeSend = resolve; });
  const loader = async input => {
    if (input.receiptId !== null && input.receiptId !== undefined) receiptReads += 1;
    if (receiptReads === 2) await beforeSend;
    const { loadStartupInstruction } = await import('../runtime/startup-dispatch.mjs');
    return await loadStartupInstruction(input);
  };
  const { fake, driver, root, repoRoot, registryPath, store } = await fixture(t, instructionRef, {
    instructionText: instruction, startupInstructionLoader: loader,
  });
  await until(() => startupDispatchOf(store)?.outcome === 'authorized', 'dispatch reservation');
  const stopped = driver.stop();
  releaseBeforeSend();
  await stopped;
  assert.equal(fake.sent.length, 0);
  const resumed = startWorkflowDriver({ repoRoot, runId: 'R001-dhr78', actor: { submitControl: fn => fn(store) }, herdrCli: fake.cli,
    herdrRegistryPath: registryPath, profileEnvironment: { DHR78_PROFILE_HOME: repoRoot }, herdrPollMs: 5 });
  await until(() => store.events.some(event => event.detail === 'startup-instruction-may-not-have-been-delivered; inspect-current-attempt; stop-old-attempt-before-explicit-new-attempt'), 'uncertain delivery attention');
  assert.equal(fake.sent.length, 0);
  await resumed.stop();
  await resumed.done;
});

test('DHR_78：私有发送账字段封闭，损坏记录在重开时 fail-closed', async (t) => {
  const instruction = '任务内容';
  const { fake, driver, root } = await fixture(t, { path: 'task.md', sha256: sha256(instruction) }, { instructionText: instruction });
  await until(() => fake.sent.length === 1, 'first startup prompt');
  await driver.stop();
  const document = JSON.parse(await readFile(join(root, 'startup-dispatch.json'), 'utf8'));
  document.records[0].unexpected = 'must-not-be-kept';
  await writeFile(join(root, 'startup-dispatch.json'), JSON.stringify(document), 'utf8');
  await assert.rejects(() => openStore({ root }), /E_STORE_CORRUPT:startup-dispatch/);
});
