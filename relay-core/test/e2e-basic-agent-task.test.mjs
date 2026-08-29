// e2e-basic-agent-task.test.mjs — DHR_31 批 3 · 3.1：**进程级** CLI 走完 basic-agent-task。
//
// 与 workflow.test.mjs 的分工：那边在测试进程内直连 service 证明闭环本身；这里一律经
// `relay` CLI 子进程，证明「一个人坐在终端前」也能起、能看、能确认终态——H1/H2 的人机
// 那一半。CLI 自己经 launcher 发现/拉起 detached service，测试侧不 mock 任何一层。
//
// 渲染纪律沿用 read-model-mirror 的口径（design/08 §1）：--json = Read Model 原样序列化，
// text = **同一对象**的人读渲染。所以这里不写「text 里应该有某某字样」这种弱断言，而是
// 拿 --json 的模型喂给 cli/render.mjs 的同一个渲染函数，与 text 输出逐字比对——
// 弱断言放得过「text 自己算了一个字段」，而那正是这条纪律要禁的事。

import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { renderDetailView, renderEvent, renderEventSnapshot, renderStatusView } from '../cli/render.mjs';
import { localCapabilityHash } from '../rpc/capabilities.mjs';
import { createTransportClient } from '../rpc/transport.mjs';
import { readLocalUserCapability } from '../runtime/credentials.mjs';
import { ensureRuntimeService } from '../runtime/launcher.mjs';
import { settledState } from './helpers/settled-state.mjs';

const CLI = fileURLToPath(new URL('../cli/main.mjs', import.meta.url));
const WORKFLOW_SRC = new URL('../workflows/basic-agent-task/', import.meta.url);
const execFileAsync = promisify(execFile);

const credentialRootOf = (repoRoot) => join(repoRoot, 'private-credentials');
const cliEnv = (repoRoot) => ({
  DH_RELAY_CREDENTIAL_ROOT: credentialRootOf(repoRoot),
  DH_RELAY_INDEX_PATH: join(repoRoot, 'private-runtime', 'runs.json'),
});

const untilAsync = async (check, timeout = 60_000, what = 'condition') => {
  const deadline = Date.now() + timeout;
  for (;;) {
    if (await check()) return true;
    if (Date.now() > deadline) throw new Error(`timeout waiting for ${what}`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
};

async function makeRepo() {
  const repoRoot = await mkdtemp(join(tmpdir(), 'dhr31-e2e-'));
  await writeFile(join(repoRoot, '.gitignore'), '.dh-relay/\n', 'utf8');
  await execFileAsync('git', ['init', '-q'], { cwd: repoRoot });
  return repoRoot;
}

/** Workflow 定义按仓内相对路径就位——run.template.json 的 ref 就是照这个位置写的。 */
async function installWorkflow(repoRoot) {
  await mkdir(join(repoRoot, 'workflows'), { recursive: true });
  await cp(WORKFLOW_SRC, join(repoRoot, 'workflows', 'basic-agent-task'), { recursive: true });
  return JSON.parse(await readFile(join(repoRoot, 'workflows', 'basic-agent-task', 'run.template.json'), 'utf8'));
}

/** CLI 自己拉起的 detached service 不经测试 harness，只能按命令行里的临时仓路径清。 */
async function killRepoServices(repoRoot) {
  if (process.platform === 'win32') {
    const marker = repoRoot.replace(/'/g, "''");
    const script = 'Get-CimInstance Win32_Process -Filter "Name = \'node.exe\'" | '
      + `Where-Object { $_.CommandLine -like '*service-main.mjs*' -and $_.CommandLine -like '*${marker}*' } | `
      + 'ForEach-Object { Stop-Process -Id $_.ProcessId -Force }';
    await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script]).catch(() => {});
    return;
  }
  await execFileAsync('pkill', ['-f', `service-main.mjs.*${repoRoot}`]).catch(() => {});
}

async function removeRepo(repoRoot) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(repoRoot, { recursive: true, force: true });
      return;
    } catch {
      await new Promise(done => setTimeout(done, 300));
    }
  }
}

/** 一次一命令的 CLI 子进程：收齐 stdout/stderr 与退出码。 */
function cliOnce(args, repoRoot) {
  return new Promise((done) => {
    const child = spawn(process.execPath, [CLI, ...args], {
      env: { ...process.env, ...cliEnv(repoRoot) }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    const watchdog = setTimeout(() => child.kill('SIGKILL'), 120_000);
    child.on('close', code => { clearTimeout(watchdog); done({ code, stdout, stderr }); });
  });
}

/** 测试侧直连同一届 service（复用 CLI 拉起的那个），用来与 CLI 的 --json 对证。 */
async function rpcSession(t, repoRoot) {
  const { endpoint, descriptor } = await ensureRuntimeService({
    repoRoot, timeoutMs: 30_000,
    credentialRoot: credentialRootOf(repoRoot),
    env: { ...process.env, ...cliEnv(repoRoot) },
  });
  const capability = await readLocalUserCapability(repoRoot, { credentialRoot: credentialRootOf(repoRoot) });
  assert.ok(capability, 'service 起来后本机私有凭据必须已存在');
  const responses = new Map();
  const client = await createTransportClient(endpoint, {
    onFrame: frame => { if ('id' in frame) responses.set(frame.id, frame); },
  });
  t.after(() => client.destroy());
  let nextId = 1;
  const send = async (method, params, requestId) => {
    const id = (nextId += 1);
    client.send({
      jsonrpc: '2.0', id, method,
      handshake: {
        protocol_version: 'relay.rpc/v1', runtime_version: '0.0.0',
        capability_hash: localCapabilityHash(), client_id: 'e2e-driver', request_id: requestId ?? `req-${id}`,
      },
      params,
    });
    await untilAsync(async () => responses.has(id), 30_000, `${method} response`);
    return responses.get(id);
  };
  const identity = await send('contracts', {
    descriptor_version: descriptor.descriptor_version, repo_id: descriptor.repo_id,
    generation: descriptor.generation, local_user_capability: capability,
  }, 'req-contracts-e2e');
  assert.ok(identity.result, `contracts 应通过：${JSON.stringify(identity.error ?? {})}`);
  return { send };
}

async function readEvents(repoRoot, runId) {
  try {
    const text = await readFile(join(repoRoot, '.dh-relay', runId, 'events.jsonl'), 'utf8');
    return text.split('\n').filter(Boolean).map(line => JSON.parse(line));
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

test('e2e basic-agent-task：CLI 进程级 start → events → status/inspect 走到 succeeded', async (t) => {
  const repoRoot = await makeRepo();
  t.after(async () => { await killRepoServices(repoRoot); await removeRepo(repoRoot); });
  const template = await installWorkflow(repoRoot);
  const runDocPath = join(repoRoot, 'run.json');
  await writeFile(runDocPath, JSON.stringify(template, null, 2), 'utf8');

  // ── relay start ─────────────────────────────────────────────────────────────
  const started = await cliOnce(['start', '--run', runDocPath, '--root', repoRoot, '--json'], repoRoot);
  assert.equal(started.code, 0, `start 应成功：${started.stderr}`);
  const receipt = JSON.parse(started.stdout);
  assert.equal(receipt.protocol, 'relay.launch-receipt/v2');
  assert.equal(receipt.state, 'committed');
  assert.equal(receipt.kind, 'start');
  const runId = receipt.run_id;
  assert.match(runId, /^R\d{3}-relay-basic-agent-task-1-\d{8}$/, `发号 slug 取自 workflow_name：${runId}`);

  // 等闭环跑完只是测试侧的同步手段（盘上事实，零子进程开销）；
  // 「看到闭环」这件事本身仍由下面的 relay events / status / inspect 断言。
  await untilAsync(async () => (await readEvents(repoRoot, runId)).some(e => e.kind === 'run_finished'),
    60_000, 'run_finished');
  // relay status/inspect 读的就是盘上的 state.json，而它落后于 events.jsonl 一个写步。
  // 先等快照追上事件账，否则终态断言会偶发读到上一条事件时的旧快照。
  await settledState(join(repoRoot, '.dh-relay', runId));

  // ── relay events ────────────────────────────────────────────────────────────
  const eventsJson = await cliOnce(['events', '--root', repoRoot, '--json', runId], repoRoot);
  assert.equal(eventsJson.code, 0, eventsJson.stderr);
  const eventLines = eventsJson.stdout.trim().split('\n').map(line => JSON.parse(line));
  // 快照行按内容定位，不按下标。理由是 F-015：并发压力下观察到过一次「第一行不是快照」，
  // 根因假设是 CLI 侧的写序竞态（订阅响应的 promise 续体 vs 同批到达的通知帧同步写 stdout），
  // 未稳定复现、属 DHR_30 的 cli/main.mjs、不在本卡范围。这里按内容取快照并**显式断言它
  // 确实在首行**——真出现乱序时这条会红并把原样输出打出来，而不是悄悄换个下标绕过去。
  const snapshotIndex = eventLines.findIndex(line => line.view === 'event_stream_snapshot');
  assert.notEqual(snapshotIndex, -1,
    `events --json 必须含快照行，实得：
${eventsJson.stdout}
--- stderr ---
${eventsJson.stderr}`);
  const snapshot = eventLines[snapshotIndex];
  assert.equal(snapshotIndex, 0,
    `快照必须先于增量（design/08 §5 · F-015）。实得第 ${snapshotIndex} 行，原样输出：
${eventsJson.stdout}`);
  assert.equal(snapshot.run_id, runId);
  const frames = eventLines.filter((line, index) => index !== snapshotIndex);
  assert.deepEqual(frames.map(frame => frame.seq),
    Array.from({ length: snapshot.next_seq - 1 }, (unused, index) => index + 1),
    'events 必须补齐 after_seq=0 之后的全部连续 seq，不留缺口');

  // 闭环在 CLI 看得见的形态：三节点按依赖序起、三个 attempt 成功、run_finished 收口。
  const kindsOf = kind => frames.filter(frame => frame.kind === kind);
  assert.deepEqual(kindsOf('node_started').map(frame => frame.node_id), ['prepare', 'process-task', 'verify']);
  assert.deepEqual(kindsOf('attempt_succeeded').map(frame => frame.node_id), ['prepare', 'process-task', 'verify']);
  assert.equal(kindsOf('attempt_failed').length, 0);
  assert.equal(kindsOf('run_finished').length, 1);

  // events text 与 --json 同源：快照与每条事件都是同一渲染函数的产物，text 不自己算字段。
  const eventsText = await cliOnce(['events', '--root', repoRoot, runId], repoRoot);
  assert.equal(eventsText.code, 0, eventsText.stderr);
  assert.deepEqual(
    eventsText.stdout.trim().split('\n'),
    [...renderEventSnapshot(snapshot).split('\n'), ...frames.map(frame => renderEvent(frame))],
    'events 的 text 必须逐行等于 --json 模型经 cli/render.mjs 的渲染',
  );

  // ── relay status ────────────────────────────────────────────────────────────
  const statusJson = await cliOnce(['status', '--root', repoRoot, '--json', runId], repoRoot);
  assert.equal(statusJson.code, 0, statusJson.stderr);
  const statusModel = JSON.parse(statusJson.stdout);
  const session = await rpcSession(t, repoRoot);
  const rpcStatus = await session.send('inspectRun', { run_id: runId, view: 'status' });
  assert.deepEqual(statusModel, rpcStatus.result, 'status --json 必须是 Read Model 原样序列化');
  assert.equal(statusModel.status.ledger.run_status, 'succeeded');
  assert.deepEqual(statusModel.status.ledger.progress, { done: 3, total: 3 });
  assert.equal(statusModel.read_only, false);

  const statusText = await cliOnce(['status', '--root', repoRoot, runId], repoRoot);
  assert.equal(statusText.code, 0, statusText.stderr);
  assert.equal(statusText.stdout.trim(), renderStatusView(statusModel),
    'status 的 text 必须等于同一 Read Model 的渲染');

  // ── relay inspect ───────────────────────────────────────────────────────────
  const inspectJson = await cliOnce(['inspect', '--root', repoRoot, '--json', runId], repoRoot);
  assert.equal(inspectJson.code, 0, inspectJson.stderr);
  const inspectModel = JSON.parse(inspectJson.stdout);
  assert.equal(inspectModel.view, 'detail');
  assert.equal(inspectModel.detail.protocol, 'relay.run-state/v1');
  assert.equal(inspectModel.detail.run_status, 'succeeded', '终态必须是 succeeded');
  assert.deepEqual(inspectModel.detail.node_states.map(node => [node.node_id, node.status]), [
    ['prepare', 'succeeded'], ['process-task', 'succeeded'], ['verify', 'succeeded'],
  ]);
  // status 与 inspect 是同一份 state.json 的两个投影：签名必须逐字相同，不是各算各的。
  assert.equal(inspectModel.detail.state_signature, statusModel.status.ledger.state_signature);

  const inspectText = await cliOnce(['inspect', '--root', repoRoot, runId], repoRoot);
  assert.equal(inspectText.code, 0, inspectText.stderr);
  assert.equal(inspectText.stdout.trim(), renderDetailView(inspectModel),
    'inspect 的 text 必须等于同一 Read Model 的渲染');
});
