// A-27 D-1 前置：目录信任能力矩阵只读实测
//
// 边界（对应 AGENTS.md 宪章 #6 密钥红线 / DevPlan B-22②）：
//   - 不读、不写任何产品配置或凭据文件
//   - 不回答任何信任框（回答=写产品配置）；只观察它出现与否
//   - 落盘文本先按白名单过滤，不靠事后扫描兜底
//   - 每个探针 pane 用完即关，每个临时目录用完即删

import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REPO = 'D:\\MyFiles\\ai-workflow\\dh-relay';
const PROBE_ROOT = join(REPO, '.ai-workspace', 'a27-probe');
const OUTSIDE = join(tmpdir(), `A27-outside-${Date.now()}`);
const START_TIMEOUT_MS = 60_000;

const herdr = (args, timeoutMs = 90_000) => {
  const t0 = Date.now();
  const r = spawnSync('herdr', args, { encoding: 'utf8', timeout: timeoutMs, windowsHide: true, shell: false });
  return {
    status: r.status, signal: r.signal, err: r.error ? String(r.error.code ?? r.error.message) : null,
    stdout: r.stdout ?? '', stderr: r.stderr ?? '', elapsed_ms: Date.now() - t0,
  };
};
const herdrJson = (args, timeoutMs) => {
  const r = herdr(args, timeoutMs);
  try { r.json = JSON.parse(r.stdout); } catch { r.json = null; }
  return r;
};

// —— 白名单过滤器：只放行「像信任/审批框」的行，其余一律丢弃 ——
// 明确排除任何可能承载账号/凭据的行。
const ALLOW = [
  /trust/i, /信任/, /do you (trust|want)/i, /allow/i, /允许/,
  /folder|directory|目录|文件夹/i, /yes[,、]?\s|no[,、]?\s/i, /^\s*[1-9][.)]\s/,
  /proceed/i, /approve|approval/i, /确认|是否/, /esc to/i, /press enter/i,
];
const DENY = [
  /@/,                       // 邮箱
  /[A-Za-z0-9_-]{24,}/,      // 长串 token 形
  /sk-|api[_-]?key|token|bearer|password|secret|cookie/i,
  /logged in|signed in|account/i,
];
const filterText = (raw) => {
  const kept = [];
  for (const line of String(raw).split(/\r?\n/)) {
    const s = line.replace(/\u001b\[[0-9;?]*[A-Za-z]/g, '').trimEnd();
    if (!s.trim()) continue;
    if (DENY.some((re) => re.test(s))) continue;
    if (!ALLOW.some((re) => re.test(s))) continue;
    kept.push(s.trim().slice(0, 160));
    if (kept.length >= 14) break;
  }
  return kept;
};

const CASES = [
  { id: 'root',     dim: '对照·已信任仓根',              cwd: REPO },
  { id: 'subdir',   dim: '已信任 git 仓的普通子目录',     cwd: join(PROBE_ROOT, 'plain-child') },
  { id: 'nested',   dim: '已信任仓内的嵌套 git 仓',       cwd: join(PROBE_ROOT, 'nested-repo') },
  { id: 'worktree', dim: '已信任仓的 git worktree',       cwd: join(REPO, '.dh-worktrees', 'DHR_35') },
  { id: 'outside',  dim: '完全外部的非仓目录（基线）',     cwd: OUTSIDE },
];
const KINDS = ['codex', 'claude'];

// —— 准备目录 ——
mkdirSync(join(PROBE_ROOT, 'plain-child'), { recursive: true });
writeFileSync(join(PROBE_ROOT, 'plain-child', 'README.txt'), 'a27 probe\n');
mkdirSync(join(PROBE_ROOT, 'nested-repo'), { recursive: true });
spawnSync('git', ['init', '-q'], { cwd: join(PROBE_ROOT, 'nested-repo'), encoding: 'utf8' });
mkdirSync(OUTSIDE, { recursive: true });
writeFileSync(join(OUTSIDE, 'README.txt'), 'a27 probe\n');

const observations = [];

for (const kind of KINDS) {
  for (const c of CASES) {
    const name = `a27${kind}${c.id}`.slice(0, 24);
    const rec = { product: kind, case: c.id, dimension: c.dim, cwd_class: c.id, name };

    if (!existsSync(c.cwd)) { rec.skipped = 'cwd missing'; observations.push(rec); continue; }

    const split = herdrJson(['pane', 'split', '--current', '--direction', 'down', '--ratio', '0.35', '--cwd', c.cwd], 20_000);
    const paneId = split.json?.result?.pane?.pane_id ?? split.json?.result?.pane_id ?? null;
    if (!paneId) { rec.error = `split failed: ${split.status}`; observations.push(rec); continue; }
    rec.pane_id = paneId;

    const start = herdr(['agent', 'start', name, '--kind', kind, '--pane', paneId, '--timeout', String(START_TIMEOUT_MS)], START_TIMEOUT_MS + 30_000);
    rec.start_exit = start.status;
    rec.start_elapsed_ms = start.elapsed_ms;
    let errCode = null;
    try { errCode = JSON.parse(start.stdout || start.stderr)?.error?.code ?? null; } catch {}
    if (!errCode) {
      const m = /"code"\s*:\s*"([a-z_]+)"/.exec(start.stdout + start.stderr);
      errCode = m ? m[1] : null;
    }
    rec.error_code = errCode;

    const got = herdrJson(['agent', 'get', name], 15_000);
    rec.agent_status = got.json?.result?.agent?.agent_status ?? null;
    rec.agent_visible = got.status === 0;

    const pget = herdrJson(['pane', 'get', paneId], 15_000);
    rec.pane_agent_status = pget.json?.result?.pane?.agent_status ?? null;
    rec.pane_agent = pget.json?.result?.pane?.agent ?? null;

    const pinfo = herdrJson(['pane', 'process-info', '--pane', paneId], 15_000);
    const fg = pinfo.json?.result?.process_info?.foreground_processes?.[0] ?? null;
    rec.process_info = fg ? { name: fg.name ?? null, pid: fg.pid ?? null, cwd: fg.cwd ?? null } : null;

    const read = herdr(['pane', 'read', paneId, '--source', 'recent-unwrapped', '--lines', '80'], 15_000);
    let rawText = read.stdout;
    try { rawText = JSON.parse(read.stdout)?.result?.text ?? read.stdout; } catch {}
    rec.filtered_text_lines = filterText(rawText);

    herdr(['pane', 'close', paneId], 15_000);
    observations.push(rec);
    console.error(`[done] ${kind}/${c.id} exit=${rec.start_exit} err=${rec.error_code} status=${rec.agent_status}`);
  }
}

// —— 清理 ——
try { rmSync(PROBE_ROOT, { recursive: true, force: true }); } catch {}
try { rmSync(OUTSIDE, { recursive: true, force: true }); } catch {}

const out = {
  probed_at: new Date().toISOString(),
  question: 'A-27 D-1 前置：两产品 × 目录形态，目录信任框是否出现 / 信任以什么为单位',
  herdr_version: herdr(['--version'], 10_000).stdout.trim(),
  start_timeout_ms: START_TIMEOUT_MS,
  observations,
  boundaries_respected: [
    '未读取、未写入任何 Codex / Claude 产品配置或凭据文件',
    '未回答任何目录信任框（回答等于写产品配置）',
    '落盘文本按白名单正则先过滤再入仓，非事后扫描兜底',
    '每个探针 pane 已关闭，每个临时目录已删除',
  ],
};
console.log(JSON.stringify(out, null, 2));
