// cli.test.mjs — DHR_30 步骤 4：CLI 七命令的端到端回归。
//
// 全部走**真实** service 进程与真实 CLI 子进程：CLI 自己经 launcher 发现/拉起 service，
// 测试侧只经 RPC 或盘上事实断言，不 mock 任何一层（task_plan 批次 B B-5）。
// 覆盖：七命令 × (text/json) 同一 Read Model、错误渲染二分（failed Receipt vs 结果未知）、
// legacy/孤儿拒绝按服务端原样透传、pending record 崩溃收敛、--follow 断线重连与
// E_CURSOR_GAP 整体重快照、本机凭据缺失的稳定拒绝。

import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { chmod, mkdir, mkdtemp, readFile, readdir, rm, stat, unlink, utimes, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { createTransportClient, createTransportServer, probeEndpoint } from '../rpc/transport.mjs';
import { localCapabilityHash } from '../rpc/capabilities.mjs';
import { readLocalUserCapability } from '../runtime/credentials.mjs';
import { endpointForRepo, repoHash } from '../runtime/endpoint.mjs';
import { requestDigest } from '../runtime/ledger.mjs';
import { ensureRuntimeService } from '../runtime/launcher.mjs';
import { createStore } from '../store/store.mjs';
import { buildRequestEnvelope, requireLocalUserCapability } from '../cli/client.mjs';
import { addPendingRecord, readPendingRecords, removePendingRecord } from '../cli/pending.mjs';

const CLI = fileURLToPath(new URL('../cli/main.mjs', import.meta.url));
const execFileAsync = promisify(execFile);

const runDocument = (runId = 'R001-probe-20260827') => ({
  protocol: 'relay.run/v2', run_id: runId, workflow_name: 'probe', summary: 'probe',
  trigger: 'system', created_at: '2026-08-27T00:00:00Z',
  nodes: [{ node_id: 'node-a', title: 'node', role: 'work', required: false, executor_profiles: [{ kind: 'process', ref: 'bin/probe' }] }],
});

const untilAsync = async (check, timeout = 25_000) => {
  const deadline = Date.now() + timeout;
  for (;;) {
    if (await check()) return true;
    if (Date.now() > deadline) throw new Error('timeout');
    await new Promise(resolve => setTimeout(resolve, 25));
  }
};

async function makeRepo(prefix = 'dhr30-cli-') {
  const repoRoot = await mkdtemp(join(tmpdir(), prefix));
  await writeFile(join(repoRoot, '.gitignore'), '.dh-relay/\n', 'utf8');
  await execFileAsync('git', ['init', '-q'], { cwd: repoRoot });
  return repoRoot;
}

const cliEnv = (repoRoot) => ({
  DH_RELAY_CREDENTIAL_ROOT: join(repoRoot, 'private-credentials'),
  DH_RELAY_INDEX_PATH: join(repoRoot, 'private-runtime', 'runs.json'),
});

const credentialRootOf = (repoRoot) => join(repoRoot, 'private-credentials');

/** 测试侧起真实 service（harness 记 pid），CLI 侧 connect 会复用它。 */
function processHarness(t) {
  const pids = new Set();
  t.after(async () => {
    for (const pid of pids) { try { process.kill(pid, 'SIGKILL'); } catch { /* 已退出 */ } }
  });
  return {
    async launch(repoRoot, options = {}) {
      const outcome = await ensureRuntimeService({
        repoRoot, timeoutMs: 30_000,
        credentialRoot: credentialRootOf(repoRoot),
        env: { ...process.env, ...cliEnv(repoRoot) },
        ...options,
      });
      if (outcome.pid) pids.add(outcome.pid);
      return outcome;
    },
    /** 强杀当前持有端点的 service——crash 用例要的就是不优雅停机。 */
    async kill(endpoint) {
      for (const pid of pids) { try { process.kill(pid, 'SIGKILL'); } catch { /* 已退出 */ } }
      pids.clear();
      await untilAsync(async () => await probeEndpoint(endpoint) !== 'alive', 15_000);
    },
  };
}

/**
 * 清理 CLI 自己拉起的 detached service：它不经 harness，只能按命令行里的唯一临时仓路径找。
 * Windows 用 CIM 查命令行；找不到 = 已退出，不报错。
 */
async function killRepoServices(repoRoot) {
  if (process.platform === 'win32') {
    const marker = repoRoot.replace(/'/g, "''");
    const script = `Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | `
      + `Where-Object { $_.CommandLine -like '*service-main.mjs*' -and $_.CommandLine -like '*${marker}*' } | `
      + `ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`;
    await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script]).catch(() => {});
    return;
  }
  await execFileAsync('pkill', ['-f', `service-main.mjs.*${repoRoot}`]).catch(() => {});
}

async function removeRepo(repoRoot) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try { await rm(repoRoot, { recursive: true, force: true }); return; } catch { await new Promise(done => setTimeout(done, 300)); }
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
    const watchdog = setTimeout(() => child.kill('SIGKILL'), 90_000);
    child.on('close', code => { clearTimeout(watchdog); done({ code, stdout, stderr }); });
  });
}

/** events --follow 用的长命 CLI 子进程：增量收 JSONL 行，可用 stdin 收尾。 */
function spawnCli(args, repoRoot) {
  const child = spawn(process.execPath, [CLI, ...args], {
    env: { ...process.env, ...cliEnv(repoRoot) }, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true,
  });
  const lines = [];
  let buffer = '';
  let stderr = '';
  let exitCode = null;
  child.stdout.on('data', chunk => {
    buffer += chunk;
    let index;
    while ((index = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 1);
      if (line) lines.push(line);
    }
  });
  child.stderr.on('data', chunk => { stderr += chunk; });
  child.on('close', code => { exitCode = code; });
  const jsonLines = () => lines.map(line => JSON.parse(line));
  const waitFor = async (predicate, timeout = 30_000) => {
    const deadline = Date.now() + timeout;
    for (;;) {
      let value;
      try { value = predicate(); } catch { value = null; }
      if (value) return value;
      if (exitCode !== null) {
        throw new Error(`CLI 提前退出（code=${exitCode}）：stdout=${lines.join(' ⏎ ').slice(0, 500)} stderr=${stderr.slice(0, 500)}`);
      }
      if (Date.now() > deadline) throw new Error(`waitFor 超时：stdout=${lines.join(' ⏎ ').slice(0, 500)} stderr=${stderr.slice(0, 500)}`);
      await new Promise(done => setTimeout(done, 50));
    }
  };
  return {
    child, lines, jsonLines, waitFor,
    stderrText: () => stderr,
    closeStdin: () => child.stdin.end(),
    onceClosed: () => new Promise(done => {
      const watchdog = setTimeout(() => done('timeout'), 60_000);
      child.on('close', code => { clearTimeout(watchdog); done(code); });
    }),
  };
}

/** 测试侧的直连 RPC 会话（contracts 首请求），用于对照同一 Read Model 与驱动 Run。 */
async function rpcSession(t, repoRoot, { clientId = 'cli-test-driver' } = {}) {
  const { endpoint, descriptor } = await ensureRuntimeService({
    repoRoot, timeoutMs: 30_000,
    credentialRoot: credentialRootOf(repoRoot),
    env: { ...process.env, ...cliEnv(repoRoot) },
  });
  const capability = await readLocalUserCapability(repoRoot, { credentialRoot: credentialRootOf(repoRoot) });
  assert.ok(capability, 'service 起来后本机私有凭据必须已存在');
  const responses = new Map();
  const notifications = [];
  const client = await createTransportClient(endpoint, {
    onFrame: frame => { if ('id' in frame) responses.set(frame.id, frame); else notifications.push(frame); },
  });
  t.after(() => client.destroy());
  let nextId = 1;
  const send = async (method, params, requestId) => {
    const id = nextId += 1;
    client.send({
      jsonrpc: '2.0', id, method,
      handshake: {
        protocol_version: 'relay.rpc/v1', runtime_version: '0.0.0',
        capability_hash: localCapabilityHash(), client_id: clientId, request_id: requestId ?? `req-${id}`,
      },
      params,
    });
    await untilAsync(() => responses.has(id));
    return responses.get(id);
  };
  const identity = await send('contracts', {
    descriptor_version: descriptor.descriptor_version, repo_id: descriptor.repo_id,
    generation: descriptor.generation, local_user_capability: capability,
  }, 'req-contracts-driver');
  assert.ok(identity.result, `contracts 应通过：${JSON.stringify(identity.error ?? {})}`);
  return { send, notifications, endpoint, descriptor };
}

/** 测试充当「上一届 service」：预先落一份本机私有凭据，供假 service 场景的 CLI 只读。 */
async function seedCredential(repoRoot) {
  const root = credentialRootOf(repoRoot);
  await mkdir(root, { recursive: true });
  await writeFile(join(root, `${repoHash(repoRoot)}.json`),
    `${JSON.stringify({ version: 1, local_user_capability: `cap-${randomUUID()}` })}\n`, 'utf8');
}

/**
 * 最小假 service（RW-5 / F-021 / RW2-3 回归用，真 service 造不出这些场景）：
 * 绑定本仓**推导 endpoint**、按同一份 descriptor 字段回 `contracts` 身份（launcher 的
 * descriptor 回证与 CLI 的连接回证都会通过），其余方法交给 onMethod 自由发挥；
 * onContract 可选，逐帧旁路观察 contracts 握手（RW2-3 的身份断言用）。
 */
async function startFakeService(t, repoRoot, { onMethod, onContract } = {}) {
  const endpoint = endpointForRepo(repoRoot);
  if (process.platform !== 'win32') {
    await mkdir(join(homedir(), '.dh-relay', 'runtime'), { recursive: true });
  }
  const descriptor = {
    descriptor_version: 1,
    repo_id: `sha256:${repoHash(repoRoot)}`,
    endpoint,
    generation: randomUUID(),
    runtime_version: '0.0.0',
    capability_hash: localCapabilityHash(),
    state: 'ready',
  };
  await mkdir(join(repoRoot, '.dh-relay'), { recursive: true });
  await writeFile(join(repoRoot, '.dh-relay', 'runtime.json'), `${JSON.stringify(descriptor, null, 2)}\n`, 'utf8');
  const server = await createTransportServer(endpoint, {
    onFrame: (frame, conn) => {
      if (!frame || typeof frame !== 'object') return;
      if (frame.method === 'contracts') {
        onContract?.(frame);
        conn.send({ jsonrpc: '2.0', id: frame.id, result: descriptor });
        return;
      }
      onMethod?.(frame, conn);
    },
  });
  t.after(() => server.close().catch(() => {}));
  return { descriptor, stop: () => server.close().catch(() => {}) };
}

test('CLI：七命令 text/json 渲染同一 Read Model，receipt 与 client 身份贯通', async (t) => {
  const repoRoot = await makeRepo();
  t.after(async () => { await killRepoServices(repoRoot); await removeRepo(repoRoot); });
  const runDocPath = join(repoRoot, 'run-doc.json');
  await writeFile(runDocPath, JSON.stringify(runDocument()), 'utf8');

  // start --json：CLI 自己发现并拉起 service，回执是 Read Model（operation_receipt）原样。
  const started = await cliOnce(['start', '--run', runDocPath, '--root', repoRoot, '--json'], repoRoot);
  assert.equal(started.code, 0, `start --json 应成功：${started.stderr}`);
  const startReceipt = JSON.parse(started.stdout);
  assert.equal(startReceipt.protocol, 'relay.launch-receipt/v2');
  assert.equal(startReceipt.state, 'committed');
  assert.equal(startReceipt.kind, 'start');
  assert.match(startReceipt.run_id, /^R\d{3}-probe-\d{8}$/);
  const runId = startReceipt.run_id;
  assert.equal(existsSync(join(repoRoot, '.dh-relay', 'private', 'pending-operations.json')), false,
    '确定结果落定后 pending record 必须收回');

  // client 身份跨进程稳定，且就是回执里的 client_id。
  const identityDir = credentialRootOf(repoRoot);
  const [identityFile] = (await readdir(identityDir)).filter(name => name.endsWith('.client.json'));
  assert.ok(identityFile, '客户端身份必须落在用户私有目录');
  const clientId = JSON.parse(await readFile(join(identityDir, identityFile), 'utf8')).client_id;
  assert.equal(startReceipt.client_id, clientId);

  // list --json：run_list 视图原样；--include-legacy 默认关。
  const listed = await cliOnce(['list', '--root', repoRoot, '--json'], repoRoot);
  assert.equal(listed.code, 0, listed.stderr);
  const listModel = JSON.parse(listed.stdout);
  assert.deepEqual(Object.keys(listModel).sort(), ['items', 'protocol', 'view']);
  assert.equal(listModel.view, 'run_list');
  assert.deepEqual(listModel.items.map(item => item.run_id), [runId]);
  assert.equal(listModel.items[0].read_only, false);
  assert.equal(listModel.items[0].source, 'runtime-v2');

  // list --text：同一对象的人读渲染，不得自己算字段。
  const listedText = await cliOnce(['list', '--root', repoRoot], repoRoot);
  assert.equal(listedText.code, 0, listedText.stderr);
  assert.ok(listedText.stdout.includes(runId), 'text 必须渲染同一 run_id');
  assert.ok(listedText.stdout.includes('runtime-v2'));
  assert.ok(listedText.stdout.includes('status='));

  // status --json：与测试侧直连 RPC 的 inspectRun 结果逐字同一（deepEqual，键序无关）。
  const statusJson = await cliOnce(['status', '--root', repoRoot, '--json', runId], repoRoot);
  assert.equal(statusJson.code, 0, statusJson.stderr);
  const cliStatus = JSON.parse(statusJson.stdout);
  const driver = await rpcSession(t, repoRoot);
  const rpcStatus = await driver.send('inspectRun', { run_id: runId, view: 'status' });
  assert.deepEqual(cliStatus, rpcStatus.result, '--json 必须是 Read Model 原样序列化');

  // status --text：同一对象的字段渲染。
  const statusText = await cliOnce(['status', '--root', repoRoot, runId], repoRoot);
  assert.equal(statusText.code, 0, statusText.stderr);
  assert.ok(statusText.stdout.includes(`run_id: ${runId}`));
  assert.ok(statusText.stdout.includes('read_only: false'));
  assert.ok(statusText.stdout.includes('host:'));
  assert.ok(statusText.stdout.includes('state_signature:'));

  // inspect --json / --text：detail 视图带完整 relay.run-state/v1。
  const inspectJson = await cliOnce(['inspect', '--root', repoRoot, '--json', runId], repoRoot);
  assert.equal(inspectJson.code, 0, inspectJson.stderr);
  const inspectModel = JSON.parse(inspectJson.stdout);
  assert.equal(inspectModel.view, 'detail');
  assert.equal(inspectModel.detail.protocol, 'relay.run-state/v1');
  assert.equal(inspectModel.detail.run_id, runId);
  const inspectText = await cliOnce(['inspect', '--root', repoRoot, runId], repoRoot);
  assert.equal(inspectText.code, 0, inspectText.stderr);
  assert.ok(inspectText.stdout.includes('run_status:'), inspectText.stdout);
  assert.ok(inspectText.stdout.includes('- node-a:'), 'node_states 必须逐节点渲染');

  // events --json --after 0：快照一行在前，补发事件按 seq 严格连续。
  const eventsJson = await cliOnce(['events', '--root', repoRoot, '--json', '--after', '0', runId], repoRoot);
  assert.equal(eventsJson.code, 0, eventsJson.stderr);
  const eventLines = eventsJson.stdout.trim().split('\n').map(line => JSON.parse(line));
  const snapshotLine = eventLines[0];
  assert.equal(snapshotLine.view, 'event_stream_snapshot');
  const backfill = eventLines.slice(1).map(frame => frame.seq);
  assert.deepEqual(backfill, Array.from({ length: snapshotLine.next_seq - 1 }, (unused, index) => index + 1),
    '补发必须覆盖 after_seq=0 之后的全部连续 seq');

  // events --text：快照的人读渲染。
  const eventsText = await cliOnce(['events', '--root', repoRoot, runId], repoRoot);
  assert.equal(eventsText.code, 0, eventsText.stderr);
  assert.ok(eventsText.stdout.includes('snapshot_seq:'), eventsText.stdout);
  assert.ok(eventsText.stdout.includes('next_seq:'));

  // start --text：第二个 Run 走人读渲染路径。
  const doc2Path = join(repoRoot, 'run-doc-2.json');
  await writeFile(doc2Path, JSON.stringify(runDocument('R002-second-20260827')), 'utf8');
  const startedText = await cliOnce(['start', '--run', doc2Path, '--root', repoRoot], repoRoot);
  assert.equal(startedText.code, 0, startedText.stderr);
  assert.ok(startedText.stdout.includes('state: committed'), startedText.stdout);
  assert.ok(startedText.stdout.includes('kind: start'));

  // stop --json / resume --text / stop --text：控制回执两种渲染。
  const stopJson = await cliOnce(['stop', '--root', repoRoot, '--json', runId], repoRoot);
  assert.equal(stopJson.code, 0, stopJson.stderr);
  assert.equal(JSON.parse(stopJson.stdout).kind, 'stop');
  const resumeText = await cliOnce(['resume', '--root', repoRoot, runId], repoRoot);
  assert.equal(resumeText.code, 0, resumeText.stderr);
  assert.ok(resumeText.stdout.includes('state: committed'), resumeText.stdout);
  assert.ok(resumeText.stdout.includes('kind: resume'));
  const stopText = await cliOnce(['stop', '--root', repoRoot, runId], repoRoot);
  assert.equal(stopText.code, 0, stopText.stderr);
  assert.ok(stopText.stdout.includes('state: committed'));
  assert.ok(stopText.stdout.includes('kind: stop'));

  // resume --json（F-023 成功路径补齐）：--json 必须是 operation_receipt 原样序列化，
  // 字段集与 relay.launch-receipt/v2 逐字段对齐，client_id 就是本机身份。
  const resumeJson = await cliOnce(['resume', '--root', repoRoot, '--json', runId], repoRoot);
  assert.equal(resumeJson.code, 0, resumeJson.stderr);
  const resumeReceipt = JSON.parse(resumeJson.stdout);
  assert.deepEqual(Object.keys(resumeReceipt).sort(), [
    'attempt_id', 'client_id', 'issued_at', 'issued_by_runtime', 'kind', 'method', 'node_id',
    'protocol', 'reason', 'receipt_id', 'request_digest', 'request_id', 'run_id', 'state',
  ]);
  assert.equal(resumeReceipt.protocol, 'relay.launch-receipt/v2');
  assert.equal(resumeReceipt.state, 'committed');
  assert.equal(resumeReceipt.kind, 'resume');
  assert.equal(resumeReceipt.method, 'control');
  assert.equal(resumeReceipt.run_id, runId);
  assert.equal(resumeReceipt.client_id, clientId);
  assert.equal(resumeReceipt.reason, null);
  assert.match(resumeReceipt.receipt_id, /^[\da-f-]{36}$/);
  assert.match(resumeReceipt.request_digest, /^[\da-f]{64}$/);
});

test('CLI：错误渲染二分——failed Receipt 与「结果未知」措辞可区分', async (t) => {
  const repoRoot = await makeRepo();
  t.after(async () => { await killRepoServices(repoRoot); await removeRepo(repoRoot); });
  const runDocPath = join(repoRoot, 'run-doc.json');
  await writeFile(runDocPath, JSON.stringify(runDocument()), 'utf8');

  const started = await cliOnce(['start', '--run', runDocPath, '--root', repoRoot, '--json'], repoRoot);
  assert.equal(started.code, 0, started.stderr);
  const runId = JSON.parse(started.stdout).run_id;
  const firstStop = await cliOnce(['stop', '--root', repoRoot, '--json', runId], repoRoot);
  assert.equal(firstStop.code, 0, firstStop.stderr);

  // ① 二次 stop：服务端确定失败且带 failed Receipt（E_SERVICE_NOT_READY/no-live-session）。
  //    text 措辞必须是「已确定失败 + 同幂等键重试拿回同一份 failed Receipt」。
  const doubleStopText = await cliOnce(['stop', '--root', repoRoot, runId], repoRoot);
  assert.notEqual(doubleStopText.code, 0, '二次 stop 必须失败');
  assert.ok(doubleStopText.stderr.includes('E_SERVICE_NOT_READY'), doubleStopText.stderr);
  assert.ok(doubleStopText.stderr.includes('同一份 failed Receipt'), doubleStopText.stderr);
  assert.ok(doubleStopText.stderr.includes('receipt_state: failed'), doubleStopText.stderr);
  assert.ok(!doubleStopText.stderr.includes('结果未知'), 'receipt 非 null 时不得出现「结果未知」措辞');
  //    json 模式：错误对象原样，receipt 字段可机器判读。
  const doubleStopJson = await cliOnce(['stop', '--root', repoRoot, '--json', runId], repoRoot);
  assert.notEqual(doubleStopJson.code, 0);
  const failure = JSON.parse(doubleStopJson.stderr);
  assert.equal(failure.error.reason, 'E_SERVICE_NOT_READY');
  assert.equal(failure.error.receipt.state, 'failed');
  assert.ok(typeof failure.error.receipt.receipt_id === 'string');

  // ② 未知 run：服务端明确「操作根本没开始」，receipt 为 null →「结果未知，可安全重试」。
  const unknownText = await cliOnce(['stop', '--root', repoRoot, 'R999-none-20260101'], repoRoot);
  assert.notEqual(unknownText.code, 0);
  assert.ok(unknownText.stderr.includes('E_RUN_NOT_FOUND'), unknownText.stderr);
  assert.ok(unknownText.stderr.includes('结果未知'), unknownText.stderr);
  assert.ok(!unknownText.stderr.includes('同一份 failed Receipt'), 'receipt 为 null 时不得出现 failed Receipt 措辞');
  const unknownJson = await cliOnce(['stop', '--root', repoRoot, '--json', 'R999-none-20260101'], repoRoot);
  assert.notEqual(unknownJson.code, 0);
  assert.equal(JSON.parse(unknownJson.stderr).error.receipt, null);
});

test('CLI：legacy 只读投影与 control 拒绝按服务端原样透传', async (t) => {
  const repoRoot = await makeRepo();
  t.after(async () => { await killRepoServices(repoRoot); await removeRepo(repoRoot); });
  await mkdir(join(repoRoot, '.dh-runtime', 'relay', 'legacy-run'), { recursive: true });

  const listed = await cliOnce(['list', '--root', repoRoot, '--json', '--include-legacy'], repoRoot);
  assert.equal(listed.code, 0, listed.stderr);
  const items = JSON.parse(listed.stdout).items;
  assert.deepEqual(items.map(item => [item.run_id, item.source, item.read_only]),
    [['legacy-run', 'legacy-v1', true]], 'legacy 只投可读事实');

  const defaultList = await cliOnce(['list', '--root', repoRoot, '--json'], repoRoot);
  assert.deepEqual(JSON.parse(defaultList.stdout).items, [], '默认不含 legacy');

  const listedText = await cliOnce(['list', '--root', repoRoot, '--include-legacy'], repoRoot);
  assert.ok(listedText.stdout.includes('[read-only]'), 'legacy 条目必须渲染 read_only:true');
  assert.ok(listedText.stdout.includes('legacy-v1'));

  const stopLegacy = await cliOnce(['stop', '--root', repoRoot, 'legacy-run'], repoRoot);
  assert.notEqual(stopLegacy.code, 0);
  assert.ok(stopLegacy.stderr.includes('E_LEGACY_READ_ONLY'), stopLegacy.stderr);
  const resumeLegacyJson = await cliOnce(['resume', '--root', repoRoot, '--json', 'legacy-run'], repoRoot);
  assert.notEqual(resumeLegacyJson.code, 0);
  const failure = JSON.parse(resumeLegacyJson.stderr);
  assert.equal(failure.error.reason, 'E_LEGACY_READ_ONLY');
  assert.equal(failure.error.receipt, null, 'legacy 拒绝发生在 operation 之前，receipt 必为 null');
});

test('CLI：孤儿 Store 可读，control 拒绝透传 E_ORPHAN_STORE_READ_ONLY', async (t) => {
  const repoRoot = await makeRepo();
  t.after(async () => { await killRepoServices(repoRoot); await removeRepo(repoRoot); });
  const orphanId = 'R900-orphan-20260827';
  const store = await createStore({ root: join(repoRoot, '.dh-relay', orphanId), run: runDocument(orphanId) });
  await store.appendEvent({ kind: 'run_created', at: '2026-08-27T00:00:00Z' });

  const listed = await cliOnce(['list', '--root', repoRoot, '--json'], repoRoot);
  assert.equal(listed.code, 0, listed.stderr);
  const [item] = JSON.parse(listed.stdout).items;
  assert.equal(item.run_id, orphanId);
  assert.equal(item.source, 'runtime-v2');
  assert.equal(item.read_only, true, '孤儿必须投影为只读');

  const inspected = await cliOnce(['inspect', '--root', repoRoot, '--json', orphanId], repoRoot);
  assert.equal(inspected.code, 0, inspected.stderr);
  assert.equal(JSON.parse(inspected.stdout).detail.run_id, orphanId, '孤儿的 detail 是真实 run-state，不得藏');

  const stopOrphan = await cliOnce(['stop', '--root', repoRoot, orphanId], repoRoot);
  assert.notEqual(stopOrphan.code, 0);
  assert.ok(stopOrphan.stderr.includes('E_ORPHAN_STORE_READ_ONLY'), stopOrphan.stderr);
  const resumeOrphan = await cliOnce(['resume', '--root', repoRoot, '--json', orphanId], repoRoot);
  assert.notEqual(resumeOrphan.code, 0);
  const failure = JSON.parse(resumeOrphan.stderr);
  assert.equal(failure.error.reason, 'E_ORPHAN_STORE_READ_ONLY');
  assert.equal(failure.error.receipt, null);
});

test('CLI：pending record 崩溃残留按原幂等键收敛后收回', async (t) => {
  const repoRoot = await makeRepo();
  t.after(async () => { await killRepoServices(repoRoot); await removeRepo(repoRoot); });
  const pendingPath = join(repoRoot, '.dh-relay', 'private', 'pending-operations.json');
  await mkdir(join(repoRoot, '.dh-relay', 'private'), { recursive: true });
  // 模拟「CLI 崩在发出请求之后、收到 Receipt 之前」：盘上留下一条完整的新格式残条
  // （F-018/F-019：client_id 与完整请求、digest 都随条落盘，收敛才能逐字重放原幂等键）。
  const crash = {
    client_id: 'cli-crash-sim',
    request_id: 'req-crash-pending-1',
    method: 'start',
    params: { run: runDocument() },
    at: '2026-08-27T00:00:00Z',
  };
  crash.request_digest = requestDigest(buildRequestEnvelope({
    method: crash.method, params: crash.params, requestId: crash.request_id, clientId: crash.client_id,
  }));
  await writeFile(pendingPath, JSON.stringify({ version: 1, pending: [crash] }, null, 2), 'utf8');

  const listed = await cliOnce(['list', '--root', repoRoot, '--json'], repoRoot);
  assert.equal(listed.code, 0, listed.stderr);
  const items = JSON.parse(listed.stdout).items;
  assert.equal(items.length, 1, '启动时的残条必须先用原幂等键收敛（此处 = 真正建出 Run）');
  const runId = items[0].run_id;

  assert.equal(existsSync(pendingPath), false, '确定结果落定后残条必须收回');

  const operationFiles = await readdir(join(repoRoot, '.dh-relay', runId, 'operations'));
  const receipt = JSON.parse(await readFile(join(repoRoot, '.dh-relay', runId, 'operations', operationFiles[0]), 'utf8'));
  assert.equal(receipt.request_id, 'req-crash-pending-1', '收敛必须复用残条里的原 request_id');
  assert.equal(receipt.client_id, 'cli-crash-sim', '收敛必须复用残条里的原 client_id（F-018）');
  assert.equal(receipt.request_digest, crash.request_digest, '重放帧摘要必须与残条记录逐字一致');

  const again = await cliOnce(['list', '--root', repoRoot, '--json'], repoRoot);
  assert.deepEqual(JSON.parse(again.stdout).items.map(item => item.run_id), [runId], '收敛不得产生第二个 Run');
});

test('CLI：events --follow 断线重连按 after_seq 续传，不重不漏', async (t) => {
  const repoRoot = await makeRepo();
  const harness = processHarness(t);
  t.after(async () => { await killRepoServices(repoRoot); await removeRepo(repoRoot); });
  const first = await harness.launch(repoRoot);

  const driver = await rpcSession(t, repoRoot);
  const started = await driver.send('start', { run: runDocument() }, 'req-follow-start');
  assert.equal(started.result.receipt.state, 'committed');
  const runId = started.result.receipt.run_id;

  const follower = spawnCli(['events', '--root', repoRoot, '--json', '--follow', runId], repoRoot);
  await follower.waitFor(() => follower.jsonLines().find(frame => frame.view === 'event_stream_snapshot'));

  const stopped = await driver.send('control', { run_id: runId, action: 'stop' }, 'req-follow-stop');
  assert.equal(stopped.result.receipt.state, 'committed');
  const seqsAtKillTime = await follower.waitFor(() => {
    const frames = follower.jsonLines();
    const snapshotSeq = frames.find(frame => frame.view === 'event_stream_snapshot')?.snapshot_seq;
    if (typeof snapshotSeq !== 'number') return null;
    const seqs = frames.filter(frame => typeof frame.seq === 'number' && frame.seq > snapshotSeq).map(frame => frame.seq);
    return seqs.length >= 1 ? seqs : null;
  });

  // 强杀 service：CLI 必须自行重连（重新发现并拉起），以 after_seq 续传。
  await harness.kill(first.endpoint);
  await harness.launch(repoRoot);
  const driver2 = await rpcSession(t, repoRoot, { clientId: 'cli-test-driver-2' });
  const resumed = await driver2.send('control', { run_id: runId, action: 'resume' }, 'req-follow-resume');
  assert.equal(resumed.result.receipt.state, 'committed');

  const maxBeforeKill = Math.max(...seqsAtKillTime);
  const seqsAfterReconnect = await follower.waitFor(() => {
    const seqs = follower.jsonLines().filter(frame => typeof frame.seq === 'number').map(frame => frame.seq);
    return seqs.some(seq => seq > maxBeforeKill) ? seqs : null;
  }, 30_000);
  assert.ok(seqsAfterReconnect.length > seqsAtKillTime.length, '重连后必须收到 resume 时代的新事件');

  follower.closeStdin();
  const code = await follower.onceClosed();
  assert.equal(code, 0, `--follow 收尾必须退出码 0：stderr=${follower.stderrText().slice(0, 300)}`);

  // 全程不重不漏：快照之后收到的事件 seq 必须是严格连续区间。
  const frames = follower.jsonLines();
  const snapshots = frames.filter(frame => frame.view === 'event_stream_snapshot');
  assert.ok(snapshots.length >= 1);
  const seqs = frames.filter(frame => typeof frame.seq === 'number').map(frame => frame.seq);
  assert.deepEqual(seqs, Array.from({ length: seqs.length }, (unused, index) => snapshots[0].snapshot_seq + 1 + index),
    '重连续传不得重复、缺口或乱序');
  assert.ok(seqs.every(seq => seq > snapshots[0].snapshot_seq), '快照里已有的事件不得重复推送');
  const kinds = frames.filter(frame => typeof frame.seq === 'number').map(frame => frame.kind);
  assert.ok(kinds.includes('operation_committed'), 'stop/resume 的回执事件必须推达');
});

test('CLI：events --follow 遇 E_CURSOR_GAP 整体重新快照，不拼接补缝', async (t) => {
  const repoRoot = await makeRepo();
  const harness = processHarness(t);
  t.after(async () => { await killRepoServices(repoRoot); await removeRepo(repoRoot); });
  await harness.launch(repoRoot);
  const driver = await rpcSession(t, repoRoot);
  const started = await driver.send('start', { run: runDocument() }, 'req-gap-start');
  const runId = started.result.receipt.run_id;

  const follower = spawnCli(['events', '--root', repoRoot, '--json', '--follow', '--after', '999', runId], repoRoot);
  const snapshot = await follower.waitFor(() => follower.jsonLines().find(frame => frame.view === 'event_stream_snapshot'));
  assert.ok(snapshot.snapshot_seq >= 1);
  assert.ok(!follower.stderrText().includes('E_CURSOR_GAP'), '缺口必须被 CLI 消化成重快照，不得把错误抛给用户');

  follower.closeStdin();
  const code = await follower.onceClosed();
  assert.equal(code, 0);
  assert.equal(follower.jsonLines().filter(frame => frame.view === 'event_stream_snapshot').length, 1,
    '重快照恰一次');
});

test('CLI：本机凭据缺失报 E_LOCAL_USER_UNAUTHORIZED；未知命令给 usage 且退出码非 0', async (t) => {
  const emptyDir = await mkdtemp(join(tmpdir(), 'dhr30-cli-nocred-'));
  t.after(async () => { await rm(emptyDir, { recursive: true, force: true }); });
  await assert.rejects(() => requireLocalUserCapability('D:/any-repo', { credentialRoot: emptyDir }),
    (error) => { assert.equal(error.reason, 'E_LOCAL_USER_UNAUTHORIZED'); return true; },
    '客户端无权创建凭据：缺失只能稳定拒绝');

  const repoRoot = await makeRepo();
  t.after(async () => { await removeRepo(repoRoot); });
  const usage = await cliOnce(['frobnicate'], repoRoot);
  assert.notEqual(usage.code, 0);
  assert.ok(usage.stderr.includes('usage:'), usage.stderr);
});

test('CLI：首次双 CLI 并发采用同一赢家身份；预置身份绝不被覆盖（F-018/F-023·RW2-3）', async (t) => {
  // RW2-3：不再只看「事后文件唯一」——用能记录 handshake 的假 service 断言两个 CLI
  // **实际采用**了同一赢家身份。launcher 的 descriptor 回证帧 client_id 固定
  // 'relay-launcher'，先滤掉，只看 CLI 自己的 contracts 首请求。
  const respondListRuns = (frame, conn) => {
    if (frame.method === 'listRuns') {
      conn.send({ jsonrpc: '2.0', id: frame.id, result: {
        protocol: 'relay.client-read-model/v1', view: 'run_list', items: [],
      } });
    }
  };
  const cliHandshakesOf = recorded => recorded.filter(id => id !== 'relay-launcher');

  // ① 两个首启 CLI 并发：两次 handshake 的 client_id 必须相同，identity 文件内容就是它——
  //    改回「各自生成 + 覆盖写」必双红：两个 handshake 会各报各的新 id。
  const repoRoot = await makeRepo();
  t.after(async () => { await removeRepo(repoRoot); });
  await seedCredential(repoRoot);
  const handshakes = [];
  const fake = await startFakeService(t, repoRoot, {
    onContract: frame => handshakes.push(frame.handshake?.client_id),
    onMethod: respondListRuns,
  });
  const [first, second] = await Promise.all([
    cliOnce(['list', '--root', repoRoot, '--json'], repoRoot),
    cliOnce(['list', '--root', repoRoot, '--json'], repoRoot),
  ]);
  assert.equal(first.code, 0, first.stderr);
  assert.equal(second.code, 0, second.stderr);
  await fake.stop();

  const cliHandshakes = cliHandshakesOf(handshakes);
  assert.equal(cliHandshakes.length, 2, `两个 CLI 各应恰有一次 contracts 首请求：${JSON.stringify(handshakes)}`);
  assert.equal(cliHandshakes[0], cliHandshakes[1],
    `两个并发 CLI 必须采用同一赢家身份：${cliHandshakes.join(' vs ')}`);
  const identityDir = credentialRootOf(repoRoot);
  const identityFiles = (await readdir(identityDir)).filter(name => name.endsWith('.client.json'));
  assert.equal(identityFiles.length, 1, `并发首建后 identity 文件必须恰一份：${identityFiles.join(', ')}`);
  assert.equal(JSON.parse(await readFile(join(identityDir, identityFiles[0]), 'utf8')).client_id,
    cliHandshakes[0], 'identity 文件内容必须就是握手采用的赢家 id');

  // ② 输家不覆盖（负向钉子）：预置已知 client_id 的 identity 文件，再跑 CLI——文件逐字
  //    未变，且 handshake 用的就是预置 id（改回覆盖写必红）。
  const presetRepo = await makeRepo();
  t.after(async () => { await removeRepo(presetRepo); });
  await seedCredential(presetRepo);
  const presetId = `cli-preset-${randomUUID()}`;
  const presetPath = join(credentialRootOf(presetRepo), `${repoHash(presetRepo)}.client.json`);
  const presetText = `${JSON.stringify({ version: 1, client_id: presetId }, null, 2)}\n`;
  await writeFile(presetPath, presetText, 'utf8');
  const presetHandshakes = [];
  const fake2 = await startFakeService(t, presetRepo, {
    onContract: frame => presetHandshakes.push(frame.handshake?.client_id),
    onMethod: respondListRuns,
  });
  const third = await cliOnce(['list', '--root', presetRepo, '--json'], presetRepo);
  await fake2.stop();
  assert.equal(third.code, 0, third.stderr);
  assert.deepEqual(cliHandshakesOf(presetHandshakes), [presetId],
    `CLI 的 contracts 首请求必须用预置 id：${JSON.stringify(presetHandshakes)}`);
  assert.equal(await readFile(presetPath, 'utf8'), presetText, '预置身份文件必须逐字未变（覆盖写必改内容）');
});

test('CLI：pending 账 50 路并发 add/remove 经跨进程锁零丢失（F-019）', async (t) => {
  const repoRoot = await makeRepo();
  t.after(async () => { await removeRepo(repoRoot); });
  const pendingFile = join(repoRoot, '.dh-relay', 'private', 'pending-operations.json');

  // 50 个并发 add 同时起跑：锁把 read-modify-rename 串行化，谁也不许覆盖谁。
  // （无锁的旧实现在这种窗口下会互相覆盖丢条。）
  const adds = Array.from({ length: 50 }, (unused, index) => addPendingRecord(repoRoot, {
    client_id: `cli-concurrent-${index}`,
    request_id: `req-concurrent-${index}`,
    method: 'control',
    params: { run_id: `R001-bulk-20260827`, action: 'stop' },
    request_digest: `d${index}`.padEnd(64, '0'),
    at: '2026-08-27T00:00:00Z',
  }));
  await Promise.all(adds);
  let records = await readPendingRecords(repoRoot);
  assert.equal(records.length, 50, `并发 add 后必须 50 条全在账：${records.length}`);
  assert.equal(new Set(records.map(record => record.request_id)).size, 50, 'request_id 不得丢重');

  // 一半并发 remove（按 request_id 语义选偶数号——锁内完成顺序随机，不能按数组下标选）：
  // 只该收走各自那条，剩下的 25 条原样保留。
  const removedIds = new Set(records
    .map(record => Number(record.request_id.slice('req-concurrent-'.length)))
    .filter(number => number % 2 === 0)
    .map(number => `req-concurrent-${number}`));
  await Promise.all(records.filter(record => removedIds.has(record.request_id))
    .map(record => removePendingRecord(repoRoot, record.request_id)));
  records = await readPendingRecords(repoRoot);
  assert.equal(records.length, 25);
  assert.deepEqual(records.map(record => Number(record.request_id.slice('req-concurrent-'.length)))
    .sort((a, b) => a - b), Array.from({ length: 25 }, (unused, index) => index * 2 + 1), '留下的必须是奇数那批');

  await Promise.all(records.map(record => removePendingRecord(repoRoot, record.request_id)));
  assert.equal(existsSync(pendingFile), false, '全空后连文件一起收走');
});

test('CLI：两个 CLI 并发 mutating——轮询到两条 request_id 都在账才收场，零丢失（F-019/F-023·RW2-3）', async (t) => {
  const repoRoot = await makeRepo();
  t.after(async () => { await killRepoServices(repoRoot); await removeRepo(repoRoot); });
  await seedCredential(repoRoot);
  const pendingFile = join(repoRoot, '.dh-relay', 'private', 'pending-operations.json');
  const pendingLock = join(repoRoot, '.dh-relay', 'private', 'pending-operations.lock');
  // 诱饵残条：让两届 CLI 的启动收敛都有一个**确定会答复**的请求可重放，且假 service 把
  // 答复扣到「两个进程都已重放」才放行——两个 CLI 因此必然都越过 converge 再各自落账，
  // 谁也不会把对方的残条误当自己的收敛目标（否则轮询「两条都在账」会被合法收敛路径
  // 打成概率红）。这才是对 add 互斥零丢失的直接钉子。
  const DECOY_REQUEST_ID = 'req-decoy-converge';
  const decoyRecord = {
    client_id: 'cli-decoy-sim',
    request_id: DECOY_REQUEST_ID,
    method: 'control',
    params: { run_id: 'R001-ghost-20260827', action: 'stop' },
    request_digest: 'd'.repeat(64),
    at: '2026-08-27T00:00:00Z',
  };
  await mkdir(join(repoRoot, '.dh-relay', 'private'), { recursive: true });
  await writeFile(pendingFile, JSON.stringify({ version: 1, pending: [decoyRecord] }, null, 2), 'utf8');

  // 黑洞 service：contracts 放行（startFakeService 内建）；诱饵 request_id 的 control
  // 攒够两笔才回确定失败（receipt:null，合法收敛）；其余 control 永不答复——CLI 停在
  // 「已落 pending、未收 Receipt」。
  const parked = [];
  const releaseDecoys = () => {
    for (const { frame, conn } of parked) {
      conn.send({ jsonrpc: '2.0', id: frame.id, error: {
        code: -32000, message: 'decoy converged',
        data: { reason: 'E_RUN_NOT_FOUND', detail: 'decoy', receipt: null },
      } });
    }
    parked.length = 0;
  };
  const fake = await startFakeService(t, repoRoot, {
    onMethod: (frame, conn) => {
      if (frame.method !== 'control') return;
      if (frame.handshake?.request_id === DECOY_REQUEST_ID) {
        parked.push({ frame, conn });
        if (parked.length >= 2) releaseDecoys();
      } // 其余 control 黑洞：不回
    },
  });
  const children = [
    spawnCli(['stop', '--root', repoRoot, 'R001-ghost-20260827'], repoRoot),
    spawnCli(['resume', '--root', repoRoot, 'R001-ghost-20260827'], repoRoot),
  ];
  t.after(() => { for (const child of children) child.child.kill('SIGKILL'); });

  // 轮询账面直到（去诱饵后）**两条** request_id 都在账、**且锁已释放**——超时即红
  //（RW2-3：不再只钉「至少一条」）。锁判据不可省：两个 CLI 落完账后不再碰锁，锁还在场
  // = 第二位 adder 的释放收尾没走完，此刻 SIGKILL 会把它当场钉死在锁上，留下一把新鲜
  // 陈锁，收口 CLI 的收敛会白白吃满 5s 退避后 E_PENDING_LOCK_BUSY。
  // POSIX 顺带断言真实落盘权限（RW2-2/F-020）：`.dh-relay/` 是假 service 的 descriptor
  // 写入以**默认 ACL** 建的，pending 目录/账面仍必须被 CLI 显式收权。
  await untilAsync(async () => {
    let records = [];
    try { records = JSON.parse(await readFile(pendingFile, 'utf8')).pending ?? []; } catch { return false; }
    const landed = records.filter(record => record?.request_id !== DECOY_REQUEST_ID);
    if (new Set(landed.map(record => record?.request_id)).size < 2) return false;
    try { await stat(pendingLock); return false; } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    if (process.platform !== 'win32') {
      assert.equal((await stat(join(repoRoot, '.dh-relay'))).mode & 0o777, 0o700,
        '.dh-relay 必须被显式收权为 0700（哪怕此前由 descriptor 以默认 ACL 建好）');
      assert.equal((await stat(pendingFile)).mode & 0o777, 0o600, 'pending 账面必须 0600');
    }
    return true;
  }, 30_000);
  for (const child of children) child.child.kill('SIGKILL');

  const records = JSON.parse(await readFile(pendingFile, 'utf8')).pending
    .filter(record => record?.request_id !== DECOY_REQUEST_ID);
  assert.equal(records.length, 2, `两条 mutating 必须零丢失：${JSON.stringify(records)}`);
  assert.equal(new Set(records.map(record => record.request_id)).size, 2, 'request_id 不得互撞');
  assert.ok(records.every(record => record.method === 'control'
    && typeof record.client_id === 'string' && record.client_id.length > 0
    && typeof record.request_digest === 'string' && record.request_digest.length === 64),
  '残条必须持久完整请求');

  // 收敛语义断言（维持一轮既有用例）：黑洞退场、真 service 上位，下届 CLI 用残条里的
  // 原键收敛（run 不存在 → 确定失败也算收敛），残条全部收回。
  await fake.stop();
  // launcher 对 absent 只 spawn 一次，撞上瞬态占用的候选（如 SIGKILL 后管道名多活几百
  // 毫秒）会安静退出且不再重试——全量并发负载下偶发。给 launch 几次独立机会：
  // 每次都先等端点确定空闲、清掉本仓残留 service 候选，任何一次 ready 即继续。
  const harness = processHarness(t);
  let launched = null;
  for (let attempt = 0; attempt < 3 && !launched; attempt += 1) {
    await killRepoServices(repoRoot);
    await untilAsync(async () => (await probeEndpoint(endpointForRepo(repoRoot))) === 'absent', 10_000);
    launched = await harness.launch(repoRoot).catch(error => {
      if (error?.reason !== 'E_SERVICE_NOT_READY') throw error;
      return null;
    });
  }
  assert.ok(launched, '真 service 必须能在重试内上位');
  const after = await cliOnce(['list', '--root', repoRoot, '--json'], repoRoot);
  assert.equal(after.code, 0, after.stderr);
  assert.equal(existsSync(pendingFile), false, '收敛后残条必须全部收回（含诱饵）');
});

test('CLI：凭据缺失走子进程 E2E——端点有活 service 而本机无凭据 → E_LOCAL_USER_UNAUTHORIZED（F-023）', async (t) => {
  const repoRoot = await makeRepo();
  const harness = processHarness(t);
  t.after(async () => { await killRepoServices(repoRoot); await removeRepo(repoRoot); });
  await harness.launch(repoRoot);
  const emptyRoot = join(repoRoot, 'empty-credentials');
  await mkdir(emptyRoot, { recursive: true });

  const outcome = await new Promise((done) => {
    const child = spawn(process.execPath, [CLI, 'list', '--root', repoRoot, '--json'], {
      env: {
        ...process.env,
        DH_RELAY_CREDENTIAL_ROOT: emptyRoot,
        DH_RELAY_INDEX_PATH: join(repoRoot, 'private-runtime', 'runs.json'),
      },
      stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
    });
    let stderr = '';
    child.stderr.on('data', chunk => { stderr += chunk; });
    const watchdog = setTimeout(() => child.kill('SIGKILL'), 60_000);
    child.on('close', code => { clearTimeout(watchdog); done({ code, stderr }); });
  });
  assert.notEqual(outcome.code, 0, '凭据缺失必须非 0 退出');
  assert.ok(outcome.stderr.includes('E_LOCAL_USER_UNAUTHORIZED'), outcome.stderr);
});

test('CLI：error data 缺 receipt 字段按协议违约 fail-closed，pending 保留（RW-5）', async (t) => {
  const repoRoot = await makeRepo();
  t.after(async () => { await killRepoServices(repoRoot); await removeRepo(repoRoot); });
  await seedCredential(repoRoot);
  const pendingFile = join(repoRoot, '.dh-relay', 'private', 'pending-operations.json');
  const fake = await startFakeService(t, repoRoot, {
    onMethod: (frame, conn) => {
      if (frame.method === 'control') {
        // 伪造违约：合同要求 error data 必带 receipt，这里整个字段缺席。
        conn.send({ jsonrpc: '2.0', id: frame.id, error: {
          code: -32000, message: 'fake failure',
          data: { reason: 'E_SERVICE_NOT_READY', detail: 'fake-no-receipt' },
        } });
      }
    },
  });
  const outcome = await cliOnce(['stop', '--root', repoRoot, 'R001-ghost-20260827'], repoRoot);
  await fake.stop();

  assert.notEqual(outcome.code, 0);
  assert.ok(outcome.stderr.includes('E_PROTOCOL_VIOLATION'), outcome.stderr);
  assert.ok(outcome.stderr.includes('E_SERVICE_NOT_READY'), `措辞须含服务端 reason：${outcome.stderr}`);
  assert.ok(outcome.stderr.includes('协议违约：error data 缺 receipt'), outcome.stderr);
  assert.ok(!outcome.stderr.includes('结果未知'), '协议违约不得报成「结果未知，可安全重试」');
  const records = JSON.parse(await readFile(pendingFile, 'utf8')).pending;
  assert.equal(records.length, 1, '协议违约属结果未知，pending 必须保留给下届收敛');
  assert.equal(records[0].method, 'control');
  assert.equal(typeof records[0].request_id, 'string');
});

test('CLI：非 follow events 按 next_seq 精确收齐补发，慢管道不丢事件（RW-4）', async (t) => {
  const repoRoot = await makeRepo();
  t.after(async () => { await killRepoServices(repoRoot); await removeRepo(repoRoot); });
  await seedCredential(repoRoot);
  const sleep = ms => new Promise(done => setTimeout(done, ms));
  const fake = await startFakeService(t, repoRoot, {
    onMethod: async (frame, conn) => {
      if (frame.method !== 'subscribe') return;
      conn.send({ jsonrpc: '2.0', id: frame.id, result: {
        protocol: 'relay.client-read-model/v1', view: 'event_stream_snapshot',
        run_id: frame.params?.run_id ?? 'R001-fake-20260827',
        snapshot: { run_status: 'running' }, snapshot_seq: 10, next_seq: 11,
      } });
      // 先发 3 条，停 900ms（远超旧版 400ms 静默窗——旧实现会在此截断退出），
      // 再发到 next_seq-1：精确计数必须等齐全量，不许把静默当完成。
      const emit = seq => conn.send({ jsonrpc: '2.0', method: 'event', params: { seq, kind: 'fake', detail: `e${seq}` } });
      for (const seq of [1, 2, 3]) { emit(seq); await sleep(30); }
      await sleep(900);
      for (const seq of [4, 5, 6, 7, 8, 9, 10]) { emit(seq); await sleep(30); }
    },
  });
  const outcome = await cliOnce(['events', '--root', repoRoot, '--json', 'R001-fake-20260827'], repoRoot);
  await fake.stop();

  assert.equal(outcome.code, 0, outcome.stderr);
  const lines = outcome.stdout.trim().split('\n').map(line => JSON.parse(line));
  const snapshot = lines.find(frame => frame.view === 'event_stream_snapshot');
  assert.equal(snapshot.next_seq, 11);
  const seqs = lines.filter(frame => typeof frame.seq === 'number').map(frame => frame.seq);
  assert.deepEqual(seqs, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], '补发必须按 next_seq 收齐全部区间，不许静默截断');
});

test('CLI：多余 positional 一律 usage 退出码 1（F-025）', async (t) => {
  const repoRoot = await makeRepo();
  t.after(async () => { await removeRepo(repoRoot); });
  for (const args of [
    ['list', 'junk'],
    ['start', '--run', 'x', 'junk'],
    ['status', 'R001-a-20260827', 'junk'],
    ['inspect', 'R001-a-20260827', 'junk'],
    ['events', 'R001-a-20260827', 'extra'],
    ['stop'],
    ['resume'],
  ]) {
    const outcome = await cliOnce([...args, '--root', repoRoot], repoRoot);
    assert.notEqual(outcome.code, 0, `应拒绝：relay ${args.join(' ')}`);
    assert.ok(outcome.stderr.includes('usage:'), `relay ${args.join(' ')} 必须给 usage：${outcome.stderr}`);
  }
});

test('CLI：pending 落盘显式收权——private/ 独立私有子目录 owner-only（F-020 终稿）', async (t) => {
  const repoRoot = await makeRepo();
  t.after(async () => { await removeRepo(repoRoot); });
  const relayDir = join(repoRoot, '.dh-relay');
  const privateDir = join(relayDir, 'private');
  const pendingFile = join(privateDir, 'pending-operations.json');
  const lockFile = join(privateDir, 'pending-operations.lock');
  // 复刻两轮复审现场并加严（R-F-02）：private/ 与账面先以**宽权限**存在，win32 上还预置
  // 一条 foreign 显式 ACE（Everyone SID，跨语言）——写前必须显式收权且清得掉既有显式 ACE。
  await mkdir(privateDir, { recursive: true });
  await writeFile(pendingFile, `${JSON.stringify({ version: 1, pending: [] }, null, 2)}\n`, 'utf8');
  if (process.platform !== 'win32') {
    await chmod(privateDir, 0o755);
    await chmod(pendingFile, 0o644);
    assert.equal((await stat(privateDir)).mode & 0o777, 0o755, '前置：private 目录确为宽权限');
    assert.equal((await stat(pendingFile)).mode & 0o777, 0o644, '前置：账面确为宽权限');
  } else {
    await execFileAsync('icacls', [privateDir, '/grant', '*S-1-1-0:(R)']);
    const seeded = (await execFileAsync('icacls', [privateDir])).stdout;
    assert.ok(seeded.includes('S-1-1-0') || /Everyone|每个人/i.test(seeded), `前置：foreign ACE 确已种上：${seeded}`);
  }

  const baseRecord = {
    client_id: 'cli-perm-sim', method: 'control',
    params: { run_id: 'R001-perm-20260827', action: 'stop' },
    request_digest: 'd'.repeat(64), at: '2026-08-27T00:00:00Z',
  };
  await addPendingRecord(repoRoot, { ...baseRecord, request_id: 'req-perm-1' });

  if (process.platform !== 'win32') {
    assert.equal((await stat(privateDir)).mode & 0o777, 0o700,
      '已存在的 private/ 必须被显式 chmod 收紧为 0700');
    assert.equal((await stat(pendingFile)).mode & 0o777, 0o600,
      '已存在的 pending 账面必须被显式 chmod 收紧为 0600');
  } else {
    // win32（R-E-02/R-F-02）：mode 位不可靠，owner-only 的真断言走 DACL——private/ 经
    // /reset + /inheritance:r + /grant:r 后，每一条显式 ACE 都必须属于当前用户；预置的
    // Everyone ACE 必须消失；目录级 (OI)(CI) 让 pending/临时/锁文件按对象继承 owner-only。
    assert.deepEqual((await readPendingRecords(repoRoot)).map(record => record.request_id), ['req-perm-1']);
    const { stdout } = await execFileAsync('icacls', [privateDir]);
    assert.ok(!stdout.includes('S-1-1-0') && !/Everyone|每个人/i.test(stdout),
      `预置的 foreign ACE 必须被清除（R-F-02）：${stdout}`);
    const aces = stdout.split(/\r?\n/).map(line => line.trim()).filter(line => line.includes(':('));
    assert.ok(aces.length > 0, `icacls 必须列出显式 ACE：${stdout}`);
    const user = process.env.USERNAME.toLowerCase();
    for (const ace of aces) {
      assert.ok(ace.toLowerCase().includes(`\\${user}:`),
        `pending private 目录只允许当前用户的 ACE，发现：${ace}`);
    }
  }

  // 临界区确定性观测（R-E-03）：beforeRename 测试钩子停在「临时文件已写、锁在手、尚未
  // rename」的瞬间，锁与临时文件都能被确定性 stat 到——不再靠碰运气的高频轮询。
  let observed = null;
  await addPendingRecord(repoRoot, { ...baseRecord, request_id: 'req-perm-2' }, {
    beforeRename: async ({ temporaryPath }) => {
      observed = {
        lockMode: (await stat(lockFile)).mode & 0o777,
        temporaryMode: (await stat(temporaryPath)).mode & 0o777,
      };
    },
  });
  assert.ok(observed, 'beforeRename 钩子必须被调用（临界区观测点）');
  if (process.platform !== 'win32') {
    assert.equal(observed.lockMode, 0o600, '持锁窗口内的锁文件必须 0600');
    assert.equal(observed.temporaryMode, 0o600, '临界区内的临时文件必须 0600');
  }
});

test('CLI：pending 锁零自动回收——外锁一律稳定拒绝并给恢复指引（F-019 终稿）', async (t) => {
  const repoRoot = await makeRepo();
  t.after(async () => { await removeRepo(repoRoot); });
  const privateDir = join(repoRoot, '.dh-relay', 'private');
  const lockFile = join(privateDir, 'pending-operations.lock');
  const baseRecord = {
    client_id: 'cli-lock-sim', method: 'control',
    params: { run_id: 'R001-lock-20260827', action: 'stop' },
    request_digest: 'd'.repeat(64), at: '2026-08-27T00:00:00Z',
  };
  const seedLock = async (token, ageMs, pid = 999_999) => {
    await mkdir(privateDir, { recursive: true });
    await writeFile(lockFile, `${JSON.stringify({ pid, token, at: new Date().toISOString() })}\n`, 'utf8');
    if (ageMs > 0) {
      const past = new Date(Date.now() - ageMs);
      await utimes(lockFile, past, past);
    }
  };

  // ① 死持有者的陈锁也**绝不自动回收**（F-019 用户裁决：任何「检查后删除」都非原子，
  //   绝对互斥优先）：稳定拒绝 + 指引手工删锁（错误信息带 pid 与死亡判定）。退回任何
  //   自动回收实现（只看 mtime 或 mtime+pid 双判据）这里都会静默成功 → 红。
  await seedLock('foreign-stale-dead', 30_000);
  await assert.rejects(() => addPendingRecord(repoRoot, { ...baseRecord, request_id: 'req-stale-1' }),
    error => error?.reason === 'E_PENDING_LOCK_BUSY' && /lock-holder-dead/.test(error?.message ?? '')
      && (error?.message ?? '').includes(lockFile));
  assert.match(await readFile(lockFile, 'utf8'), /foreign-stale-dead/, '死锁遗骸必须原样健在（等人工确认）');
  await unlink(lockFile);

  // ② 活持有者（本进程 pid 冒充，mtime 陈旧模拟冻结）：稳定拒绝且指引措辞明确「持有者
  //   仍在运行、不可删锁」。
  await seedLock('frozen-but-alive', 30_000, process.pid);
  await assert.rejects(() => addPendingRecord(repoRoot, { ...baseRecord, request_id: 'req-frozen-1' }),
    error => error?.reason === 'E_PENDING_LOCK_BUSY' && /lock-holder-alive/.test(error?.message ?? ''));
  assert.match(await readFile(lockFile, 'utf8'), /frozen-but-alive/, '活持有者的锁必须原样健在');
  await unlink(lockFile);

  // ③ 正常并发全景：op1 持锁进临界区的瞬间把锁 mtime 打回陈旧（模拟冻结假象）——op2
  //   不做任何回收、老实退避等 op1 释放后正常抢锁，两条都必须在账、锁最终释放。
  const op1 = addPendingRecord(repoRoot, { ...baseRecord, request_id: 'req-steal-1' });
  const past = new Date(Date.now() - 30_000);
  const deadline = Date.now() + 10_000;
  for (;;) {
    try { await utimes(lockFile, past, past); break; } catch (error) {
      if (error?.code !== 'ENOENT') throw error; // op1 还没建出锁，立即重试
    }
    if (Date.now() > deadline) throw new Error('未能观测到 op1 的持锁窗口');
  }
  const op2 = addPendingRecord(repoRoot, { ...baseRecord, request_id: 'req-steal-2' });
  await Promise.all([op1, op2]);
  const ids = (await readPendingRecords(repoRoot)).map(record => record.request_id).sort();
  assert.deepEqual(ids, ['req-steal-1', 'req-steal-2'], '两条都必须在账（零丢失）');
  assert.equal(existsSync(lockFile), false, '全部完成后锁必须释放');
});
