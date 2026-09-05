// redact-receipt-ids.mjs — 把本卡工作区里的**原 Receipt / Attempt ID** 换成截断摘要关联符。
//
// 为什么必须做：design/12 §4 的 P6-RI-A4 逐字要求「证据无凭据及**原 Receipt ID**」，
// §2 又写明「`receipt_id` 是运行关联能力…公开配置、普通日志、截图及对外证据不得明文记录，
// DHR_35 只保留截断/摘要关联符」。本卡 task_plan 步骤 3 也早写了「保存**脱敏** Receipt 关联符」。
// 施工时漏了这一条，由第 4 路复核（需求）以 P1 指出。
//
// 为什么 Receipt ID 算能力而不是普通标识：`relay submit-result --receipt-id <id>` 就是提交入口，
// 持有当前 Receipt ID + 本机 user capability 即可推进他人 Run 的终态。所以它不能明文进对外工件。
//
// 关联符设计（保住可复查性，不保留原值）：
//   attempt_id = <uuid>            → att~<sha256(uuid) 前 12 位>
//   receipt_id = rcpt-<同一 uuid>  → rcpt~<同一 12 位>
// 两者共享同一摘要，所以「Receipt 与 Attempt 对得上」「Result 的 receipt_id 与 Receipt 一致」
// 这些链路断言仍然能在脱敏后逐条复核；反推原值需要暴力搜 UUID 空间，等价于不可得。
// 名字里嵌了 attempt_id 前缀的 agent（`herdr-<前 26 位>`）按前缀一并替换，避免留半截原值。
//
// 明确**不动**的东西：`config_fingerprint` / `executor_capability_hash` / `payload_digest` /
// `state_signature`（都是 64 位摘要，本身就是非敏感投影，正是身份链证据）；
// `client_id` / `request_id` / `generation` / `repo_id` / operation id 不是 Receipt 能力，保留原样。
//
// 用法：node redact-receipt-ids.mjs [--dry-run]
// 幂等：已经脱敏过的文件再跑一次不会变化（原值已不存在，匹配不到）。

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const rootArgIndex = process.argv.indexOf('--root');
const rootArg = rootArgIndex >= 0 ? process.argv[rootArgIndex + 1] : null;
if (rootArgIndex >= 0 && !rootArg) throw new Error('--root requires a path');
const CARD_ROOT = rootArg ? resolve(rootArg) : join(HERE, '..');
const dryRun = process.argv.includes('--dry-run');

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const digestOf = id => createHash('sha256').update(id.toLowerCase()).digest('hex').slice(0, 12);

/** 递归收所有普通文件；跳过 .git 之类。 */
function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

const files = walk(CARD_ROOT);
const isBinary = buffer => buffer.includes(0);

// ── 第一遍：只从**结构化字段**里认领敏感 ID，不靠猜。 ───────────────────────────
// 认领来源：任何 JSON/JSONL 里 receipt_id / attempt_id / current_attempt_id 的值，
// 以及任何 `rcpt-<uuid>` 形态的字符串（含文件名）。
const sensitive = new Set();
const claimFromValue = (value) => {
  if (typeof value !== 'string') return;
  const bare = value.startsWith('rcpt-') ? value.slice(5) : value;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bare)) sensitive.add(bare.toLowerCase());
};
const claimDeep = (node) => {
  if (Array.isArray(node)) { node.forEach(claimDeep); return; }
  if (node === null || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node)) {
    if (['receipt_id', 'attempt_id', 'current_attempt_id'].includes(key)) claimFromValue(value);
    claimDeep(value);
  }
};

for (const file of files) {
  const raw = readFileSync(file);
  if (isBinary(raw)) continue;
  const text = raw.toString('utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) continue;
    try { claimDeep(JSON.parse(trimmed)); } catch { /* 非完整 JSON 行，交给下面的 rcpt- 扫描 */ }
  }
  // 散落在散文、文件名与半截 JSON 里的 `rcpt-<uuid>`
  for (const hit of text.matchAll(/rcpt-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi)) {
    sensitive.add(hit[1].toLowerCase());
  }
  for (const hit of file.matchAll(/rcpt-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi)) {
    sensitive.add(hit[1].toLowerCase());
  }
}

const ids = [...sensitive].sort();
const mapping = new Map(ids.map(id => [id, digestOf(id)]));

/** 一个 id 的全部形态：完整、rcpt- 前缀、以及 ≥16 位的截断前缀（agent name 用 26 位）。 */
function replaceAll(text) {
  let out = text;
  for (const [id, digest] of mapping) {
    out = out.split(`rcpt-${id}`).join(`rcpt~${digest}`);
    out = out.split(id).join(`att~${digest}`);
    // `herdr-<attempt 前 26 位>` 这类截断残留；从长到短，避免短前缀先吃掉长的。
    for (let length = 32; length >= 16; length -= 1) {
      const prefix = id.slice(0, length);
      if (prefix.length < 16) break;
      out = out.split(prefix).join(`att~${digest}~t${length}`);
    }
  }
  // Bare launch Receipt UUIDs do not carry the `rcpt-` prefix. The generic
  // replacement above therefore looks like an Attempt until the field gives
  // us the missing role information.
  out = out.replace(/("receipt_id"\s*:\s*")att~([0-9a-f]{12})(")/gi, '$1rcpt~$2$3');
  return out;
}

let changedFiles = 0;
let renamed = 0;
for (const file of files) {
  const raw = readFileSync(file);
  if (isBinary(raw)) continue;
  const text = raw.toString('utf8');
  const next = replaceAll(text);
  if (next !== text) {
    changedFiles += 1;
    if (!dryRun) writeFileSync(file, next, 'utf8');
  }
}
// 文件名与**目录名**里也可能嵌了原 ID（`receipts/rcpt-<uuid>.json`、`checkpoints/rcpt-<uuid>/`）。
// 只改 basename、且**由深到浅**：改整条路径会在父目录尚未改名时指向不存在的目标（实测崩过一次）。
function allEntries(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) allEntries(full, out);
    out.push(full);
  }
  return out;
}
const entries = allEntries(CARD_ROOT).sort((a, b) => b.split(/[\\/]/).length - a.split(/[\\/]/).length);
for (const entry of entries) {
  const parent = dirname(entry);
  const base = entry.slice(parent.length + 1);
  let nextBase = replaceAll(base);
  if (/^att~[0-9a-f]{12}\.json$/i.test(nextBase) && statSync(entry).isFile()) {
    try {
      const record = JSON.parse(readFileSync(entry, 'utf8'));
      if (record?.protocol === 'relay.launch-receipt/v2') nextBase = nextBase.replace(/^att~/i, 'rcpt~');
    } catch { /* 非 JSON 或不完整证据不靠文件名猜角色。 */ }
  }
  if (nextBase !== base) {
    renamed += 1;
    if (!dryRun) renameSync(entry, join(parent, nextBase));
  }
}

const manifest = {
  redacted_at: new Date().toISOString(),
  rule: 'design/12 §2 与 §4 P6-RI-A4：证据只保留截断/摘要关联符，不留原 Receipt ID',
  algorithm: 'correlator = sha256(lowercase(attempt_uuid)).hex[0:12]；receipt 记 rcpt~<c>，attempt 记 att~<c>，两者共享同一 <c>',
  reversible: false,
  correlators: [...mapping.values()].sort(),
  distinct_ids_redacted: mapping.size,
  files_changed: changedFiles,
  files_renamed: renamed,
  note: '本清单只列关联符，不含任何原值。原值随临时 fixture 根一并销毁，已不可用。',
};
if (!dryRun) {
  const manifestPath = rootArg ? join(CARD_ROOT, 'redaction-manifest.json') : join(CARD_ROOT, 'evidence', 'redaction-manifest.json');
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}
process.stdout.write(`${JSON.stringify({ dry_run: dryRun, ...manifest }, null, 2)}\n`);
