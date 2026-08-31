// probe-command-shapes.mjs — DHR_68 验收项 D 的证据本体。
//
// 对本卡触及的每个 herdr 动词跑一次**真实** CLI，逐条记录 exit code、stdout 是否为 JSON、
// stdout 长度与 stderr 头部，用来校正 `relay-core/test/helpers/fake-herdr.mjs` 的返回形态。
// DHR_67 正是因为 fake 的 `paneRun` 返回 JSON、而真实 herdr 返回空 stdout，才让 Claude 路径
// 在真实宿主上从未跑通却被记为已完成。
//
// 纪律：不读任何产品配置或凭据；只记结构（exit / JSON 与否 / 长度 / 顶层键名），
// 不记 `agent read` 的正文；结束时关闭本脚本自己创建的 pane。

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HERDR = process.env.DH_RELAY_HERDR_BIN ?? 'herdr';
// 已被产品信任的 fixture 根（DHR_35 建立并保留）；避免再次触发目录信任框。
const TRUSTED_ROOT = join(tmpdir(), 'DHR35-fixture-herdr-codex-main');
const probes = [];

function run(label, args, { timeoutMs = 90_000, note = null, redactStdout = false } = {}) {
  const startedAt = Date.now();
  const child = spawnSync(HERDR, args, { encoding: 'utf8', timeout: timeoutMs, windowsHide: true });
  const stdout = String(child.stdout ?? '');
  const stderr = String(child.stderr ?? '');
  let parsed = null;
  try { parsed = JSON.parse(stdout.trim()); } catch { parsed = null; }
  const record = {
    label,
    argv: args,
    elapsed_ms: Date.now() - startedAt,
    exit_code: child.status,
    spawn_error_code: child.error?.code ?? null,
    signal: child.signal ?? null,
    stdout_len: stdout.length,
    stdout_is_json: parsed !== null,
    stdout_top_level_keys: parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? Object.keys(parsed) : null,
    has_result_envelope: parsed !== null && typeof parsed === 'object' && parsed !== null && 'result' in parsed,
    result_keys: parsed?.result && typeof parsed.result === 'object' && !Array.isArray(parsed.result) ? Object.keys(parsed.result) : null,
    // 只留结构性头部，够判 `missing` / `agent_not_ready` 正则即可。
    stderr_head: stderr.trim().slice(0, 200),
    stdout_head: redactStdout ? '<redacted: terminal text not recorded>' : stdout.trim().slice(0, 200),
    note,
  };
  probes.push(record);
  return { record, parsed };
}

const scratch = mkdtempSync(join(tmpdir(), 'DHR68-probe-'));
let paneId = null;
let agentPaneId = null;
const agentName = `dhr68probe${Math.floor(Math.random() * 100000)}`;

try {
  run('version', ['--version'], { note: 'wrapper 以 json:false 调用' });

  // --- pane 系：不需要任何 AI 产品 ---
  const split = run('pane-split', ['pane', 'split', '--current', '--no-focus', '--direction', 'right', '--cwd', scratch]);
  paneId = split.parsed?.result?.pane?.pane_id ?? split.parsed?.result?.pane_id ?? split.parsed?.pane_id ?? null;
  if (paneId) {
    run('pane-get', ['pane', 'get', String(paneId)]);
    // 这是缺陷 B 的对象：真实 `pane run` 成功时 exit 0 且 stdout 为空。
    run('pane-run', ['pane', 'run', String(paneId), 'echo', 'dhr68-probe']);
  }
  run('pane-get-missing', ['pane', 'get', 'pane-does-not-exist-dhr68'], { note: '错误形态：判 missing 正则' });

  // --- agent 系：需要一个真实 agent；用 DHR_35 已信任的 fixture 根，避免触发信任框 ---
  const agentSplit = run('pane-split-for-agent', ['pane', 'split', '--current', '--no-focus', '--direction', 'right', '--cwd', TRUSTED_ROOT]);
  agentPaneId = agentSplit.parsed?.result?.pane?.pane_id ?? agentSplit.parsed?.result?.pane_id ?? null;

  run('agent-get-missing', ['agent', 'get', 'agent-does-not-exist-dhr68'], { note: '错误形态：判 missing 正则' });

  if (agentPaneId) {
    // 这是缺陷 A/C 的对象：真实耗时与 agent_not_ready 形态。
    run('agent-start', ['agent', 'start', agentName, '--kind', 'codex', '--pane', String(agentPaneId), '--'],
      { note: 'herdr 自带 --timeout 默认 30000ms；本调用不传 --timeout，保持 argv 不变' });
    run('agent-list', ['agent', 'list']);
    run('agent-get', ['agent', 'get', agentName]);
    run('agent-rename', ['agent', 'rename', String(agentPaneId), `${agentName}r`]);
    run('agent-prompt', ['agent', 'prompt', `${agentName}r`, 'probe: reply with the single word ok']);
    run('agent-send-keys', ['agent', 'send-keys', `${agentName}r`, 'enter']);
    run('agent-read', ['agent', 'read', `${agentName}r`, '--source', 'recent-unwrapped', '--lines', '5'],
      { redactStdout: true, note: 'wrapper 以 json:false 调用；正文不入证据' });
  }
} finally {
  for (const id of [paneId, agentPaneId]) {
    if (id) run(`pane-close-${id}`, ['pane', 'close', String(id)], { note: '清理本脚本自建 pane' });
  }
  try { rmSync(scratch, { recursive: true, force: true }); } catch { /* best effort */ }
}

process.stdout.write(JSON.stringify({
  probed_at: new Date().toISOString(),
  herdr_bin: HERDR,
  purpose: 'DHR_68 验收项 D：fake-herdr 返回形态必须与真实 herdr 逐命令一致',
  agent_start_own_timeout: { default_ms: 30_000, max_ms: 300_000, source: 'herdr agent start --help (herdr 0.8.2)' },
  probes,
}, null, 2));
