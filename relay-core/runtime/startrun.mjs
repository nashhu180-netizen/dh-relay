// Run 创建 + D23 发号（P5-M8b）：
//   slug 规范化 → .gitignore 前置闸 → 仓级锁内读 runs.json 该仓分段 max+1 → 复合键查重
//   → 建 <repo>/.dh-relay/<run_id>/（createStore）→ 记 run_created → 锁内原子回写索引。
//
// runs.json 是用户级跨仓索引（仓外，不入任何仓；design/02 §1.3-10）。本卡只定最小内部形状：
//   { version: 1, repos: { [<canonicalRepoPath>]: { max_seq, runs: [{ run_id, summary, created_at }] } } }
// 形状演进归后续卡的 Read Model / 控制台需求；唯一性以 (canonicalRepoPath, run_id) 复合键在代码里强制。
// 索引路径可注入——测试永不触真 home。
//
// 地位（design/07 §3.3）：本原语是 DHR_51 宿主/引导侧交付物；生产控制路径禁止直接调用——
// RPC handler 与 CLI 建 Run 的唯一合法路径是 service 的 operation ledger（保留号→建 Store→Receipt）。
// 该禁令由 test/control-plane-imports.test.mjs 静态钉住（含 service 自身，无豁免）。

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { createStore } from '../store/store.mjs';
import { assertStoreRootIgnored } from './gitignore.mjs';
import { acquireRepoLock } from './repolock.mjs';
import { formatRunId, localDateStamp, normalizeThemeSlug } from './runid.mjs';

export function defaultIndexPath() {
  return join(homedir(), '.dh-relay', 'runs.json');
}

function emptyIndex() {
  return { version: 1, repos: {} };
}

async function readRunsIndex(indexPath) {
  try {
    const parsed = JSON.parse(await readFile(indexPath, 'utf8'));
    if (!parsed || parsed.version !== 1 || typeof parsed.repos !== 'object' || parsed.repos === null) {
      throw new Error('E_STORE_CORRUPT:runs-index-shape');
    }
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') return emptyIndex();
    throw error;
  }
}

async function writeRunsIndexAtomic(indexPath, index) {
  await mkdir(resolve(indexPath, '..'), { recursive: true });
  const tmp = `${indexPath}.tmp-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
  await writeFile(tmp, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
  await rename(tmp, indexPath);
}

/**
 * 规范化创建一个 Run 并发号。返回 { run_id, root, seq, store }。
 * 抛 E_RUN_ID_INVALID / E_GITIGNORE_MISSING / E_REPO_LOCK_TIMEOUT /
 * E_REQUEST_CONFLICT:run-id-exists / E_REQUEST_CONFLICT:run-root-exists。
 */
export async function createRunWithNumbering({
  repoRoot,
  slug,
  run,
  indexPath = defaultIndexPath(),
  clock = () => Date.now(),
  gitBin = 'git',
}) {
  if (!run || typeof run !== 'object') throw new Error('E_BAD_VALUE:run-required');
  const cleanSlug = normalizeThemeSlug(slug);
  // 前置闸必须先于一切落盘：.dh-relay/ 目录本身也要等闸过了才允许创建。
  await assertStoreRootIgnored({ repoRoot, gitBin });
  const canonicalRepo = resolve(repoRoot);
  // 发号锁锁的是「索引的读-改-写」，不是仓——锁必须放索引旁（E14 一致性复核遗漏项）：
  // 每仓一把锁只能串行化同仓并发，跨仓两个 start 同时读写同一 runs.json 会丢分段
  // （后写覆盖先写的 bucket）。`<indexPath>.lock` 让任意仓的建 run 共享同一把锁。
  const lockPath = `${indexPath}.lock`;
  const lock = await acquireRepoLock({ path: lockPath, clock });
  try {
    const index = await readRunsIndex(indexPath);
    const bucket = index.repos[canonicalRepo] ?? { max_seq: 0, runs: [] };
    const seq = bucket.max_seq + 1;
    const runId = formatRunId({ seq, slug: cleanSlug, date: localDateStamp(clock()) });
    if (bucket.runs.some((entry) => entry.run_id === runId)) {
      throw new Error(`E_REQUEST_CONFLICT:run-id-exists:${runId}`);
    }
    const root = join(repoRoot, '.dh-relay', runId);
    // fail-closed：Run 根已存在（哪怕是没有 run.json 的残缺目录）一律拒绝——本原语在
    // operation ledger 之外，无从对账残缺现场的来处，接管等于在 fencing 外续写无主目录（F-036）。
    await mkdir(join(repoRoot, '.dh-relay'), { recursive: true });
    try {
      await mkdir(root);
    } catch (error) {
      if (error?.code === 'EEXIST') throw new Error(`E_REQUEST_CONFLICT:run-root-exists:${runId}`);
      throw error;
    }
    const store = await createStore({ root, run: { ...run, run_id: runId } });
    await store.appendEvent({ kind: 'run_created', at: new Date(clock()).toISOString() });
    bucket.max_seq = seq;
    bucket.runs.push({ run_id: runId, summary: String(run.summary ?? ''), created_at: new Date(clock()).toISOString() });
    index.repos[canonicalRepo] = bucket;
    await writeRunsIndexAtomic(indexPath, index);
    return { run_id: runId, root, seq, store };
  } finally {
    await lock.release();
  }
}
