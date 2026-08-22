// DHR_51 runtime 套件：run_id 规范化 / 仓级锁 / lease+fencing / gitignore 前置 / 发号（含真并发）/
// detached 宿主与 M3 强杀恢复 / 三态读数。
// 惯例与 store.test.mjs 一致：临时 root、注入时钟、精确断言、变异级反例。

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { test } from 'node:test';

import { runHostSession, runRootOf, startDetachedHost } from '../runtime/host.mjs';
import { acquireLease, inspectHost, leasePath, readLease } from '../runtime/lease.mjs';
import { isProcessAlive } from '../runtime/pidalive.mjs';
import { acquireRepoLock } from '../runtime/repolock.mjs';
import { assertValidRunId, formatRunId, isValidRunId, normalizeThemeSlug } from '../runtime/runid.mjs';
import { createRunWithNumbering } from '../runtime/startrun.mjs';
import { readHostStatus } from '../runtime/status.mjs';
import { createStore, openStore } from '../store/store.mjs';
import { loadAjv, validateOne } from '../tools/validate.mjs';

const execFileAsync = promisify(execFile);
const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
const DEAD_PID = 2_000_000_000; // 现实中不存在的 pid（ESRCH）

const runDoc = () => ({
  protocol: 'relay.run/v2',
  run_id: 'placeholder',
  workflow_name: 'runtime-test',
  summary: 'DHR_51 runtime test',
  trigger: 'system',
  trigger_by: null,
  created_at: '2026-08-22T00:00:00Z',
  labels: [],
  nodes: [{ node_id: 'node-a', title: 'A', required: true, executor_profiles: [{ kind: 'process', ref: 'worker.mjs' }] }],
});

async function tempDir(t, prefix) {
  const root = await mkdtemp(join(tmpdir(), prefix));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

/** 建一个已 git init 的临时仓；ignoreLines 为写入 .gitignore 的行（可空）。.gitignore 本身入首提交，porcelain 才有「干净」语义。 */
async function initGitRepo(t, { ignoreLines = [] } = {}) {
  const repo = await tempDir(t, 'dhr51-repo-');
  await writeFile(join(repo, '.gitignore'), `${ignoreLines.join('\n')}${ignoreLines.length ? '\n' : ''}`, 'utf8');
  await execFileAsync('git', ['init', '-q'], { cwd: repo });
  await execFileAsync('git', ['config', 'user.email', 'test@example.invalid'], { cwd: repo });
  await execFileAsync('git', ['config', 'user.name', 'relay-test'], { cwd: repo });
  await execFileAsync('git', ['add', '.gitignore'], { cwd: repo });
  await execFileAsync('git', ['commit', '-qm', 'init'], { cwd: repo });
  return repo;
}

const readEventsFile = (root) => readFile(join(root, 'events.jsonl'), 'utf8').catch(() => '');

// ─────────────────────────── run_id 规范化（P5-M8b） ───────────────────────────

test('runid：正例成形、R 序号三位补零、完整 run_id 可回验', () => {
  assert.equal(normalizeThemeSlug('kpi-alignment'), 'kpi-alignment');
  assert.equal(normalizeThemeSlug('a'), 'a', '单字符 slug 首尾即自身，合法');
  assert.doesNotThrow(() => normalizeThemeSlug('a'.repeat(30)), '长度恰 30 必须放行');
  assert.equal(formatRunId({ seq: 7, slug: 'kpi-alignment', date: '20260822' }), 'R007-kpi-alignment-20260822');
  assert.equal(formatRunId({ seq: 1234, slug: 'x', date: '20260822' }), 'R1234-x-20260822', '超千号不截断位数');
  assert.equal(isValidRunId('R007-kpi-alignment-20260822'), true);
  assert.equal(isValidRunId('R07-kpi-20260822'), false, '序号至少三位');
  assert.equal(assertValidRunId('R001-a-20260101'), 'R001-a-20260101');
});

test('runid：五反例逐个拒绝且报错携带原输入（证明无静默截断/转写，P5-M8b 反例集）', () => {
  const cases = [
    ['中文主题', 'slug-charset'],
    ['Kpi-Alignment', 'slug-uppercase'],
    ['has space', 'slug-charset'],
    ['a'.repeat(31), 'slug-too-long'],
    ['-lead', 'slug-edge-hyphen'],
    ['trail-', 'slug-edge-hyphen'],
  ];
  for (const [bad, why] of cases) {
    try {
      normalizeThemeSlug(bad);
      assert.fail(`${JSON.stringify(bad)} 必须被拒绝`);
    } catch (error) {
      const message = String(error.message);
      assert.ok(message.startsWith('E_RUN_ID_INVALID'), `${bad} 必须以 E_RUN_ID_INVALID 拒绝，实得 ${message}`);
      assert.ok(message.includes(why), `${bad} 必须以 ${why} 拒绝，实得 ${message}`);
      assert.ok(message.includes(JSON.stringify(bad.slice(0, 48))), `报错必须携带原输入以证明未静默改写：${message}`);
    }
  }
});

// ─────────────────────────── 仓级锁（P5-M8b · 实施提示 5） ───────────────────────────

test('repolock：活锁超时拒、陈旧锁（死 pid）立即回收、释放后可重取', async (t) => {
  const dir = await tempDir(t, 'dhr51-lock-');
  const path = join(dir, 'repo.lock');

  const first = await acquireRepoLock({ path, clock: () => Date.now() });
  await assert.rejects(
    () => acquireRepoLock({ path, timeoutMs: 150, retryMs: 10, clock: () => Date.now() }),
    /E_REPO_LOCK_TIMEOUT/,
    '持有人活着的锁必须等超时后拒绝',
  );
  await first.release();

  await writeFile(path, `${JSON.stringify({ pid: DEAD_PID, acquired_at: '2026-08-22T00:00:00Z', expires_at: '2036-01-01T00:00:00Z', expires_at_epoch_ms: Date.now() + 3.15e12 })}\n`, 'utf8');
  const reclaimed = await acquireRepoLock({ path, clock: () => Date.now() });
  assert.equal(reclaimed.pid, process.pid, '死持有人的陈旧锁必须被立即回收');
  await reclaimed.release();

  const again = await acquireRepoLock({ path, clock: () => Date.now() });
  assert.equal(again.pid, process.pid, '释放后必须可重新取得');
  await again.release();
});

test('repolock：TTL 过期按时钟回收；release 只删仍属于自己的锁', async (t) => {
  const dir = await tempDir(t, 'dhr51-repolock2-');
  const path = join(dir, 'repo.lock');
  let now = 1_000_000;
  const clock = () => now;
  const first = await acquireRepoLock({ path, ttlMs: 500, clock });
  now += 501;
  const second = await acquireRepoLock({ path, ttlMs: 500, clock });
  assert.equal(second.pid, process.pid, '过期锁必须按时钟回收');
  // 锁被换手后，原持有人 release 不得删除新持有人的锁
  await second.release();
  const third = await acquireRepoLock({ path, ttlMs: 500, clock });
  const before = await readFile(path, 'utf8');
  await first.release(); // first 的锁早已被 second 回收，release 必须无操作
  assert.equal(await readFile(path, 'utf8'), before, '非持有人的 release 不得删除锁文件');
  await third.release();
});

test('repolock：空文件=在途锁不得被偷（双持有人窗口回归——E14 @ReviewRound1 实证）', async (t) => {
  const dir = await tempDir(t, 'dhr51-inflight-');
  const path = join(dir, 'repo.lock');
  await writeFile(path, '', 'utf8'); // 模拟 open-wx 后、writeFile 前的窗口
  await assert.rejects(
    () => acquireRepoLock({ path, timeoutMs: 150, retryMs: 10, clock: () => Date.now() }),
    /E_REPO_LOCK_TIMEOUT/,
    '在途锁必须等超时而不是被当成陈旧立即回收（偷锁=双持有人）',
  );
  // 在途者完成写入后（内容含死 pid → 陈旧），才允许回收。
  await writeFile(path, `${JSON.stringify({ pid: DEAD_PID, acquired_at: '2026-08-22T00:00:00Z', expires_at: '2036-01-01T00:00:00Z', expires_at_epoch_ms: Date.now() + 3.15e12 })}\n`, 'utf8');
  const reclaimed = await acquireRepoLock({ path, clock: () => Date.now() });
  assert.equal(reclaimed.pid, process.pid);
  await reclaimed.release();
});

test('pidalive：死 pid 判死、自 pid 判活、非法入参判死', () => {
  assert.equal(isProcessAlive(DEAD_PID), false);
  assert.equal(isProcessAlive(process.pid), true);
  assert.equal(isProcessAlive(0), false);
  assert.equal(isProcessAlive(null), false);
});

// ─────────────────────────── lease 与 fencing（P5-M3 · 移交②） ───────────────────────────

test('lease：首取 epoch=1；第二宿主 E_LEASE_HELD；优雅释放后 inspect=dead', async (t) => {
  const runRoot = await tempDir(t, 'dhr51-lease-');
  const lease = await acquireLease({ runRoot, runId: 'R001-x-20260822', ttlMs: 60_000 });
  assert.equal(lease.epoch, 1);
  assert.equal(lease.tookOver, false);
  assert.equal((await inspectHost({ runRoot })).state, 'alive');
  await assert.rejects(() => acquireLease({ runRoot, runId: 'R001-x-20260822', ttlMs: 60_000 }), /E_LEASE_HELD/, '同 Run 第二宿主必须被拒');
  await lease.release();
  assert.equal((await inspectHost({ runRoot })).state, 'dead');
});

test('lease：TTL 过期可接管 epoch 递增；旧持有人 renew 不得覆盖接管者', async (t) => {
  const runRoot = await tempDir(t, 'dhr51-ttl-');
  let now = 1_000_000;
  const clock = () => now;
  const first = await acquireLease({ runRoot, runId: 'R001-x-20260822', ttlMs: 500, clock });
  assert.equal((await inspectHost({ runRoot, clock })).state, 'alive');
  now += 501; // 越过 expires_at
  assert.equal((await inspectHost({ runRoot, clock })).state, 'lease_expired');
  const second = await acquireLease({ runRoot, runId: 'R001-x-20260822', ttlMs: 500, clock });
  assert.equal(second.tookOver, true, '过期租约必须可接管');
  assert.equal(second.previousEpoch, 1);
  assert.equal(second.epoch, 2, '接管后 epoch 必须递增');
  now += 100;
  await second.renew();
  const renewed = await readLease(runRoot);
  assert.equal(renewed.epoch, 2);
  assert.ok(Date.parse(renewed.expires_at) > now, '续租必须推迟 expires_at');
  assert.equal((await inspectHost({ runRoot, clock })).state, 'alive');
  await first.renew().catch(() => {}); // 旧持有人 renew 不应改写新持有人的租约
  assert.equal((await readLease(runRoot)).epoch, 2, '旧持有人不得覆盖接管者的租约');
});

test('lease：持有人进程已死视同过期可接管（强于字面 TTL，等价性结论明示此项）', async (t) => {
  const runRoot = await tempDir(t, 'dhr51-deadpid-');
  await writeFile(leasePath(runRoot), `${JSON.stringify({ run_id: 'R001-x-20260822', holder_pid: DEAD_PID, epoch: 7, acquired_at: '2026-08-22T00:00:00Z', expires_at: '2036-01-01T00:00:00Z', expires_at_epoch_ms: Date.now() + 3.15e12 })}\n`, 'utf8');
  const inspected = await inspectHost({ runRoot });
  assert.equal(inspected.state, 'lease_expired', '租约未到期的死持有人必须报 lease_expired 而非 alive');
  const takeover = await acquireLease({ runRoot, runId: 'R001-x-20260822', ttlMs: 60_000 });
  assert.equal(takeover.tookOver, true);
  assert.equal(takeover.previousEpoch, 7);
  assert.equal(takeover.epoch, 8);
});

test('lease：僵尸持有者——租约被换手后 verify 失效、 renew 拒绝（fencing 本体）', async (t) => {
  const runRoot = await tempDir(t, 'dhr51-zombie-');
  const lease = await acquireLease({ runRoot, runId: 'R001-x-20260822', ttlMs: 60_000 });
  assert.equal(await lease.verify(), true);
  // 模拟换手：文件被第三方覆写（新 epoch）
  await writeFile(leasePath(runRoot), `${JSON.stringify({ run_id: 'R001-x-20260822', holder_pid: DEAD_PID, epoch: 99, acquired_at: '2026-08-22T00:00:01Z', expires_at: '2036-01-01T00:00:00Z', expires_at_epoch_ms: Date.now() + 3.15e12 })}\n`, 'utf8');
  assert.equal(await lease.verify(), false, '原持有人的 verify 必须失败');
  await assert.rejects(() => lease.renew(), /E_LEASE_HELD:lease-lost/, '失去租约的 renew 必须拒绝');
  assert.equal((await readLease(runRoot)).epoch, 99, '旧持有人的 renew 不得覆写接管者的租约（R1-03 回归）');
});

test('lease：过期租约不得续租——陈旧宿主 renew 被新鲜度闸拒绝且不碰文件（R1-03 闭合）', async (t) => {
  const runRoot = await tempDir(t, 'dhr51-expired-');
  let now = 1_000_000;
  const clock = () => now;
  const lease = await acquireLease({ runRoot, runId: 'R001-x-20260822', ttlMs: 500, clock });
  now += 501; // 过期
  const contentBefore = await readFile(leasePath(runRoot), 'utf8');
  await assert.rejects(() => lease.renew(), /E_LEASE_HELD:lease-lost/, '已过期租约续租必须被新鲜度闸拒绝');
  assert.equal(await readFile(leasePath(runRoot), 'utf8'), contentBefore, '被拒的 renew 不得 unlink/重建租约文件');
  assert.equal((await readLease(runRoot)).epoch, 1, '文件仍是我方原租约');
});

test('lease：空/损坏租约文件可被回收，不再无限自旋（P1 修复——open-wx 与 writeFile 之间被强杀即触发）', async (t) => {
  const runRoot = await tempDir(t, 'dhr51-corrupt-');
  // 模拟「wx 创建成功但内容未写入」：空文件。旧实现 readLease→null→wx EEXIST→死循环。
  await writeFile(leasePath(runRoot), '', 'utf8');
  const before = Date.now();
  const lease = await acquireLease({ runRoot, runId: 'R001-x-20260822', ttlMs: 60_000, timeoutMs: 2_000 });
  assert.ok(Date.now() - before < 1_500, '损坏租约必须立即回收而不是转圈到超时');
  assert.equal(lease.epoch, 1, '损坏租约无代次可继承，从 1 起');
  assert.equal(lease.tookOver, true, '文件存在（哪怕损坏）即视为接管');
  assert.equal((await inspectHost({ runRoot })).state, 'alive');
  await lease.release();
});

test('lease：持久无法创建的损坏现场走有界超时，绝不无限自旋', async (t) => {
  const runRoot = await tempDir(t, 'dhr51-hang-');
  await import('node:fs/promises').then(({ mkdir }) => mkdir(join(runRoot, 'host-lease.json'))); // 目录占位：读=损坏、unlink 失败、wx 永远 EEXIST
  await assert.rejects(
    () => acquireLease({ runRoot, runId: 'R001-x-20260822', ttlMs: 60_000, timeoutMs: 300, backoffMs: 10 }),
    /E_LEASE_ACQUIRE_TIMEOUT/,
    '不可恢复的损坏现场必须抛有界超时而不是挂死',
  );
});

test('lease：inspect 三态与 acquire 成败构成不变量（B7 三态半条）', async (t) => {
  const runRoot = await tempDir(t, 'dhr51-invariant-');
  // dead：无 lease → acquire 必成功
  assert.equal((await inspectHost({ runRoot })).state, 'dead');
  const first = await acquireLease({ runRoot, runId: 'R001-x-20260822', ttlMs: 60_000 });
  // alive ⇔ acquire 被拒
  assert.equal((await inspectHost({ runRoot })).state, 'alive');
  await assert.rejects(() => acquireLease({ runRoot, runId: 'R001-x-20260822', ttlMs: 60_000 }), /E_LEASE_HELD/);
  await first.release();
  assert.equal((await inspectHost({ runRoot })).state, 'dead');
});

test('移交②：P1 恢复锁/CAS Oracle 复验——旧权威代次的写者被拒 ≙ 失去 lease 的陈旧写者被 fencing 拒（compat-matrix §6 第 1 条）', async (t) => {
  // Oracle：v1 权威代次机制（result-A1-wrong-generation.json）。v1 以 authority_generation
  // 表达权威代次，携带旧代次的 result 在写时被 CAS 拒收、不得改写状态。
  const fixture = JSON.parse(await readFile(new URL('../../tools/tests/fixtures/runner/results/result-A1-wrong-generation.json', import.meta.url), 'utf8'));
  assert.equal(fixture.authority_generation, 2, 'Oracle 锚点：夹具携带的是旧代次 2');

  // v2 映射：陈旧写者 = 失去 lease（fencing 失守）的宿主；其任何写必须在 writeGuard 处被拒，
  // 强度 ≥ v1 的 CAS 拒收（v1 只在 result 入口做代次比较，v2 在一切变更入口做持有人重验）。
  const root = await mkdtemp(join(tmpdir(), 'dhr51-m2-oracle-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  let authorityValid = true; // 合法宿主持有期
  const store = await createStore({
    root,
    run: runDoc(),
    writeGuard: async () => {
      if (!authorityValid) throw new Error('E_LEASE_HELD:lease-lost');
    },
  });
  await store.registerReceipt({ receipt_id: 'receipt-r1', node_id: 'node-a', attempt_id: 'attempt-1' });
  await store.appendResult({ receipt_id: 'receipt-r1', node_id: 'node-a', attempt_id: 'attempt-1', outcome: 'succeeded', payload_digest: fixture.plan_hash, at: fixture.written_at });
  const stateAfterOwnerWrite = await store.readState();

  authorityValid = false; // 换手：旧权威失效 ≙ 夹具的 authority_generation=2 已不是当前代次
  await assert.rejects(
    () => store.appendEvent({ kind: 'node_started', node_id: 'node-a', at: '2026-08-22T00:00:02Z' }),
    /E_LEASE_HELD:lease-lost/,
    '陈旧写者的事件写必须被拒（≥ v1 CAS 拒收旧代次）',
  );
  await assert.rejects(
    () => store.appendResult({ receipt_id: 'receipt-r1', node_id: 'node-a', attempt_id: 'attempt-1', outcome: 'failed', payload_digest: 'x'.repeat(64), at: '2026-08-22T00:00:03Z' }),
    /E_LEASE_HELD:lease-lost/,
    '陈旧写者的结果写必须被拒（≥ v1 CAS）',
  );
  assert.deepEqual(await store.readState(), stateAfterOwnerWrite, '陈旧写者的任何尝试不得改变状态');

  authorityValid = true; // 新权威接手后可正常写
  assert.deepEqual(
    await store.appendResult({ receipt_id: 'receipt-r1', node_id: 'node-a', attempt_id: 'attempt-1', outcome: 'succeeded', payload_digest: fixture.plan_hash, at: fixture.written_at }),
    { ok: true, idempotent: true },
    '当前权威的重投仍按幂等收敛',
  );
});

// ─────────────────────────── .gitignore 前置与发号（P5-M8a/M8b） ───────────────────────────

test('startRun：缺忽略前置 → E_GITIGNORE_MISSING 且零落盘；任意深度模式放行（F-009 反例）', async (t) => {
  const without = await initGitRepo(t, { ignoreLines: ['node_modules/'] });
  await assert.rejects(
    () => createRunWithNumbering({ repoRoot: without, slug: 'probe', run: runDoc() }),
    /E_GITIGNORE_MISSING/,
    '未忽略 .dh-relay/ 的仓必须拒绝启动',
  );
  const probeRead = await readFile(join(without, '.dh-relay', 'repo.lock'), 'utf8').then(() => 'exists', (error) => error.code ?? 'unknown');
  assert.notEqual(probeRead, 'exists', '拒绝路径不得创建 .dh-relay/ 下任何东西');

  // F-009 反例本体：.gitignore 是任意深度 `.dh-relay/`（不含字面量 `/.dh-relay/`）。
  // 字面量匹配实现会在这里假阴性拒启动；按 git check-ignore 语义必须放行。
  // 注：indexPath 必须注入——放行分支会真建 run，落到默认索引会写真实 ~/.dh-relay/runs.json
  // （E4 复核 F 项实测污染 13 条测试仓记录，已清理并加此注）。
  const scratch = await tempDir(t, 'dhr51-f009-');
  const withAnyDepth = await initGitRepo(t, { ignoreLines: ['.dh-relay/'] });
  const issued = await createRunWithNumbering({ repoRoot: withAnyDepth, slug: 'probe', run: runDoc(), indexPath: join(scratch, 'runs.json') });
  assert.match(issued.run_id, /^R001-probe-\d{8}$/);
});

test('startRun：slug 违例在闸前被拒（E_RUN_ID_INVALID）', async (t) => {
  const repo = await initGitRepo(t, { ignoreLines: ['.dh-relay/'] });
  await assert.rejects(() => createRunWithNumbering({ repoRoot: repo, slug: '中文主题', run: runDoc() }), /E_RUN_ID_INVALID/);
});

test('startRun：同仓连发序号递增、复合键入账；零误跟踪双证（P5-M8a/M8b）', async (t) => {
  const repo = await initGitRepo(t, { ignoreLines: ['.dh-relay/'] });
  const indexPath = join(await tempDir(t, 'dhr51-idx-'), 'runs.json');
  const first = await createRunWithNumbering({ repoRoot: repo, slug: 'alpha', run: runDoc(), indexPath });
  const second = await createRunWithNumbering({ repoRoot: repo, slug: 'beta', run: runDoc(), indexPath });
  assert.equal(first.seq, 1);
  assert.equal(second.seq, 2);
  assert.notEqual(first.run_id, second.run_id);
  assert.equal(runRootOf({ repoRoot: repo, runId: first.run_id }), first.root, 'Store 根必须落 <repo>/.dh-relay/<run_id>/');

  const index = JSON.parse(await readFile(indexPath, 'utf8'));
  const bucket = index.repos[join(repo)];
  assert.equal(bucket.max_seq, 2);
  assert.deepEqual(bucket.runs.map((entry) => entry.run_id), [first.run_id, second.run_id]);

  const { stdout: lsFiles } = await execFileAsync('git', ['ls-files', '--', '.dh-relay'], { cwd: repo });
  assert.equal(lsFiles.trim(), '', '零误跟踪证据一：ls-files 对 .dh-relay 必须为空');
  const { stdout: porcelain } = await execFileAsync('git', ['status', '--porcelain'], { cwd: repo });
  assert.equal(porcelain.trim(), '', '零误跟踪证据二：porcelain 必须干净（.dh-relay 被忽略）');
});

test('startRun：真并发两进程同时发号——不同序号、无跳号无重号（实施提示 4）', async (t) => {
  const repo = await initGitRepo(t, { ignoreLines: ['.dh-relay/'] });
  const scratch = await tempDir(t, 'dhr51-conc-');
  const indexPath = join(scratch, 'runs.json');
  const helperPath = fileURLToPath(new URL('./helpers/concurrent-issue.mjs', import.meta.url));

  const runHelperOnce = async (tag) => {
    const outPath = join(scratch, `result-${tag}.json`);
    await execFileAsync(process.execPath, [helperPath, repo, indexPath, outPath], { windowsHide: true });
    return JSON.parse(await readFile(outPath, 'utf8'));
  };
  const outcomes = await Promise.all([runHelperOnce('a'), runHelperOnce('b')]);

  assert.deepEqual(outcomes.map((outcome) => outcome.ok).sort(), [true, true], '两个并发 start 都必须成功');
  const seqs = outcomes.map((outcome) => outcome.seq).sort((left, right) => left - right);
  assert.deepEqual(seqs, [1, 2], '并发各得不同序号、无跳号无重号');
  assert.notEqual(outcomes[0].run_id, outcomes[1].run_id, 'run_id 不得重号');
  const index = JSON.parse(await readFile(indexPath, 'utf8'));
  assert.equal(index.repos[join(repo)].max_seq, 2, '索引账面必须与实发一致');
});

test('startRun：跨仓并发建 run 共享索引锁——两仓分段都入账、不丢分段（E14 遗漏修复）', async (t) => {
  const repoA = await initGitRepo(t, { ignoreLines: ['.dh-relay/'] });
  const repoB = await initGitRepo(t, { ignoreLines: ['.dh-relay/'] });
  const scratch = await tempDir(t, 'dhr51-cross-');
  const indexPath = join(scratch, 'runs.json');
  const helperPath = fileURLToPath(new URL('./helpers/concurrent-issue.mjs', import.meta.url));

  const runHelperOnce = async (tag, repoRoot) => {
    const outPath = join(scratch, `result-${tag}.json`);
    await execFileAsync(process.execPath, [helperPath, repoRoot, indexPath, outPath], { windowsHide: true });
    return JSON.parse(await readFile(outPath, 'utf8'));
  };
  const outcomes = await Promise.all([runHelperOnce('x', repoA), runHelperOnce('y', repoB)]);

  assert.deepEqual(outcomes.map((outcome) => outcome.ok).sort(), [true, true], '两个跨仓并发 start 都必须成功');
  assert.equal(outcomes[0].seq, 1, 'A 仓分段从 1 起');
  assert.equal(outcomes[1].seq, 1, 'B 仓分段从 1 起');
  const index = JSON.parse(await readFile(indexPath, 'utf8'));
  const keys = Object.keys(index.repos).sort();
  assert.deepEqual(keys, [join(repoA), join(repoB)].sort(), '两个仓的分段都必须入账——锁若只挂在仓内，后写会覆盖先写的 bucket（丢分段）');
  assert.equal(index.repos[join(repoA)].max_seq, 1);
  assert.equal(index.repos[join(repoB)].max_seq, 1);
});

// ─────────────────────────── detached 宿主与 M3 强杀恢复 ───────────────────────────

test('host：detached 宿主存活可读（P5-M1 机器面）；强杀 -9 后 Store 重建逐字节同签名（P5-M3）', async (t) => {
  const repo = await initGitRepo(t, { ignoreLines: ['.dh-relay/'] });
  const scratch = await tempDir(t, 'dhr51-m3-');
  const indexPath = join(scratch, 'runs.json');
  const { run_id: runId, root } = await createRunWithNumbering({ repoRoot: repo, slug: 'm3', run: runDoc(), indexPath });

  const readStateJson = async () => JSON.parse(await readFile(join(root, 'state.json'), 'utf8'));

  const pid = startDetachedHost({ repoRoot: repo, runId });
  assert.equal(typeof pid, 'number');
  let status = null;
  const aliveDeadline = Date.now() + 15_000;
  while (Date.now() < aliveDeadline) {
    status = await readHostStatus({ repoRoot: repo, runId });
    if (status.host === 'alive') break;
    await sleep(100);
  }
  assert.equal(status.host, 'alive', 'detached 宿主必须独立于测试进程存活并可被读数看见');

  // 等 detached 宿主把本任 lease_acquired(epoch:1) 写进事件账再杀——否则杀在 openStore
  // 与记账之间，事件序列断言会缺首任事件（测试竞态，非产品缺陷）。
  const eventDeadline = Date.now() + 10_000;
  let eventCount = 0;
  while (Date.now() < eventDeadline) {
    const text = await readEventsFile(root);
    eventCount = text.trim() === '' ? 0 : text.trim().split('\n').length;
    if (eventCount >= 2) break;
    await sleep(100);
  }
  assert.ok(eventCount >= 2, 'detached 宿主的 lease_acquired 必须已落账');

  // 等事件账静默（300ms 无增长）再取「杀前」基准：宿主每次追加都会重写 state.json，
  // 基准必须取自最后一次追加之后，否则 updated_at 差异会造成假红。
  let preKill;
  const quietDeadline = Date.now() + 10_000;
  for (;;) {
    const first = await readEventsFile(root);
    await sleep(300);
    const second = await readEventsFile(root);
    if (first === second || Date.now() > quietDeadline) {
      preKill = JSON.parse(await readFile(join(root, 'state.json'), 'utf8'));
      break;
    }
  }

  process.kill(pid, 'SIGKILL'); // 强杀：不走优雅路径，租约因持有人死亡即刻可接管
  const takeoverDeadline = Date.now() + 5_000;
  while (Date.now() < takeoverDeadline) {
    status = await readHostStatus({ repoRoot: repo, runId });
    if (status.host === 'lease_expired') break;
    await sleep(100);
  }
  assert.equal(status.host, 'lease_expired', '死持有人的租约必须呈现为 lease_expired（可接管）');

  // P5-M3 本体：重建（尚未追加任何新事件）必须与强杀前逐字节一致。
  const rebuilt = await openStore({ root });
  assert.deepEqual(await rebuilt.readState(), preKill, '强杀后 openStore 重建的 state.json 必须与杀前逐字节相同');

  // 新宿主会话走接管路径补记 lease 事件；业务状态投影不得被租约簿记推动。
  const summary = await runHostSession({ repoRoot: repo, runId, shouldStop: () => true });
  assert.equal(summary.took_over, true, '新宿主必须走接管路径');
  assert.equal(summary.previous_epoch, 1);
  assert.equal(summary.epoch, 2);

  const after = await readStateJson();
  assert.deepEqual(after.node_states, preKill.node_states, 'lease 簿记不得改变任何节点状态');
  assert.equal(after.run_status, preKill.run_status, 'lease 簿记不得改变 run_status');
  assert.deepEqual(after.progress, preKill.progress);

  // 事件账：全量过契约；kind 序列 = run_created → lease_acquired(e1) → lease_expired(e1) → lease_acquired(e2)
  const { ajv, byId } = loadAjv();
  const events = (await readEventsFile(root)).trim().split('\n').map((line) => JSON.parse(line));
  for (const event of events) assert.equal(validateOne(ajv, byId, 'relay.event/v2', event).ok, true, 'lease 事件也必须过冻结契约');
  assert.deepEqual(events.map((event) => event.kind), ['run_created', 'lease_acquired', 'lease_expired', 'lease_acquired']);
  assert.equal(events[1].detail, 'epoch:1');
  assert.equal(events[2].detail, 'epoch:1');
  assert.equal(events[3].detail, 'epoch:2');
});

test('host：shouldStop 会话优雅停机并释放租约', async (t) => {
  const repo = await initGitRepo(t, { ignoreLines: ['.dh-relay/'] });
  const scratch = await tempDir(t, 'dhr51-host-');
  const indexPath = join(scratch, 'runs.json');
  const { run_id: runId } = await createRunWithNumbering({ repoRoot: repo, slug: 'grace', run: runDoc(), indexPath });
  const summary = await runHostSession({ repoRoot: repo, runId, shouldStop: () => true });
  assert.equal(summary.took_over, false);
  assert.equal(summary.graceful, true);
  assert.equal((await inspectHost({ runRoot: runRootOf({ repoRoot: repo, runId }) })).state, 'dead', '优雅停机必须释放租约');
  // 优雅释放后可被再次取得（epoch 从 1 重来：无僵尸持有者，无需代次延续）
  const again = await acquireLease({ runRoot: runRootOf({ repoRoot: repo, runId }), runId, ttlMs: 60_000 });
  assert.equal(again.epoch, 1);
  await again.release();
});

test('host：会话在宿主层真实续租（E5 MUT-C 空洞修复——删 renew 调用此断言红）', async (t) => {
  const repo = await initGitRepo(t, { ignoreLines: ['.dh-relay/'] });
  const scratch = await tempDir(t, 'dhr51-wire-');
  const indexPath = join(scratch, 'runs.json');
  const { run_id: runId, root } = await createRunWithNumbering({ repoRoot: repo, slug: 'wire', run: runDoc(), indexPath });

  let stop = false;
  const startedAt = Date.now();
  // shouldStop 带 5s 兜底：断言提前红时会话也能自己退出，避免 node --test 挂死（探针友好）。
  // ttl=800ms：比续租周期(120ms)宽裕，满载下仍有余量；检查时点(等 1000ms)必须晚于 ttl——
  // 不续租则租约已过期（断言红），续租则始终在未来（断言绿）。
  const sessionPromise = runHostSession({ repoRoot: repo, runId, ttlMs: 800, tickMs: 120, shouldStop: () => stop || Date.now() > startedAt + 5_000 });
  const acquireDeadline = Date.now() + 10_000;
  let lease = null;
  while (Date.now() < acquireDeadline) {
    lease = await readLease(root);
    if (lease) break; // 会话已取得租约即可；续租与否由下一步的「过期后仍在」判定
    await sleep(60);
  }
  assert.ok(lease, '会话必须持有租约');
  await sleep(1_000); // 越过 ttl(800ms)：续租者 expires_at 仍在未来，不续租者已过期
  const freshLease = await readLease(root);
  assert.ok(
    freshLease && Date.parse(freshLease.expires_at) > Date.now(),
    `会话续租必须让 expires_at 保持在未来（实得 ${freshLease?.expires_at}，此刻 ${new Date().toISOString()}）——删掉 host.mjs tick 循环里的 lease.renew() 后本断言必须红`,
  );
  stop = true;
  const summary = await sessionPromise;
  assert.equal(summary.graceful, true, 'shouldStop 后必须优雅停机');
  assert.ok(summary.renewals >= 2, `续租计数必须 ≥2（实得 ${summary.renewals}）`);
});

test('host：租约被换手后旧会话自动停机且不释放别人的租约（lost_lease 路径）', async (t) => {
  const repo = await initGitRepo(t, { ignoreLines: ['.dh-relay/'] });
  const scratch = await tempDir(t, 'dhr51-lost-');
  const indexPath = join(scratch, 'runs.json');
  const { run_id: runId, root } = await createRunWithNumbering({ repoRoot: repo, slug: 'lost', run: runDoc(), indexPath });

  let stop = false;
  const startedAt = Date.now();
  // 停机期限兜底：任何断言提前红时会话也能自己退出，避免 node --test 挂死。
  const sessionPromise = runHostSession({ repoRoot: repo, runId, ttlMs: 2_000, tickMs: 120, shouldStop: () => stop || Date.now() > startedAt + 8_000 });
  const aliveDeadline = Date.now() + 10_000;
  let hostState = null;
  while (Date.now() < aliveDeadline) {
    hostState = (await inspectHost({ runRoot: root })).state;
    if (hostState === 'alive') break;
    await sleep(60);
  }
  assert.equal(hostState, 'alive', '会话必须先持有租约');

  // 模拟第三方接管：直接覆写 lease 文件（换 pid+epoch）——不走 acquire（acquire 会被 E_LEASE_HELD 拒，
  // 因为原持有人还活着；真实场景是原宿主被强杀/暂停，这里用覆写模拟「文件已被换手」的结果态）。
  await writeFile(leasePath(root), `${JSON.stringify({ run_id: runId, holder_pid: DEAD_PID, epoch: 99, acquired_at: '2026-08-22T00:00:01Z', expires_at: '2036-01-01T00:00:00Z', expires_at_epoch_ms: Date.now() + 3.15e12 })}\n`, 'utf8');

  const summary = await sessionPromise;
  assert.equal(summary.lost_lease, true, '换手后旧会话必须在下一个 tick 停机');
  assert.equal(summary.graceful, false, '失租不是优雅停机');
  const after = await readLease(root);
  assert.equal(after.epoch, 99, '旧会话不得释放/覆盖接管者的租约');
});

// ─────────────────────────── 三态读数（status） ───────────────────────────

test('status：读数区分三态并带账面；run 缺失报 E_RUN_NOT_FOUND', async (t) => {
  const repo = await initGitRepo(t, { ignoreLines: ['.dh-relay/'] });
  const scratch = await tempDir(t, 'dhr51-status-');
  const indexPath = join(scratch, 'runs.json');
  const { run_id: runId, root } = await createRunWithNumbering({ repoRoot: repo, slug: 'stat', run: runDoc(), indexPath });

  const none = await readHostStatus({ repoRoot: repo, runId });
  assert.equal(none.host, 'dead', '建 run 后未起宿主 → dead');
  assert.equal(none.ledger.run_status, 'pending', '账面来自 Store 的 state.json');
  assert.equal(none.events, 1, 'run_created 已入账');

  const lease = await acquireLease({ runRoot: root, runId, ttlMs: 60_000 });
  assert.equal((await readHostStatus({ repoRoot: repo, runId })).host, 'alive', '本进程持租 → alive');
  await lease.release();

  await assert.rejects(() => readHostStatus({ repoRoot: repo, runId: 'R999-nope-20260101' }), /E_RUN_NOT_FOUND/);
});
