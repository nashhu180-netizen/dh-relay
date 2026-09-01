// herdr-shape-probe.mjs — DHR_69 机器证 E-1。
//
// 取样对象是 `pane split` 出来的普通 shell pane，不启动任何产品 Agent。
// 采 `herdr pane get` / `herdr agent get` 的 exit、stdout 是否 JSON、
// `agent_status` 的字段路径与取值域。产物只留形态。
//
// 用法：node docs/modules/dh-relay/workspace/DHR_69/evidence/scripts/herdr-shape-probe.mjs

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERDR = process.env.DH_RELAY_HERDR_BIN ?? 'herdr';
const here = dirname(fileURLToPath(import.meta.url));
const outPath = join(here, '..', 'herdr-command-shapes.json');
const probes = [];
const failures = [];

function run(label, args, { timeoutMs = 15_000, note = null } = {}) {
  const startedAt = Date.now();
  const child = spawnSync(HERDR, args, { encoding: 'utf8', timeout: timeoutMs, windowsHide: true });
  const stdout = String(child.stdout ?? '');
  const stderr = String(child.stderr ?? '');
  let parsed = null;
  try { parsed = JSON.parse(stdout.trim()); } catch { parsed = null; }
  const result = parsed?.result && typeof parsed.result === 'object' ? parsed.result : null;
  const pane = result?.pane && typeof result.pane === 'object' ? result.pane : null;
  const agent = result?.agent && typeof result.agent === 'object' ? result.agent : null;
  const record = {
    label,
    argv: args,
    elapsed_ms: Date.now() - startedAt,
    exit_code: child.status,
    spawn_error_code: child.error?.code ?? null,
    signal: child.signal ?? null,
    stdout_is_json: parsed !== null,
    stdout_top_level_keys: parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? Object.keys(parsed) : null,
    has_result_envelope: parsed !== null && typeof parsed === 'object' && parsed !== null && 'result' in parsed,
    result_keys: result ? Object.keys(result) : null,
    agent_status_field_path: pane && 'agent_status' in pane ? 'result.pane.agent_status'
      : agent && 'agent_status' in agent ? 'result.agent.agent_status'
      : null,
    agent_status_value: pane?.agent_status ?? agent?.agent_status ?? null,
    stderr_head: stderr.trim().slice(0, 200),
    stdout_head: stdout.trim().slice(0, 200),
    note,
  };
  probes.push(record);
  return { record, parsed, child };
}

function assert(label, cond, detail) {
  if (!cond) failures.push({ label, detail });
}

const scratch = mkdtempSync(join(tmpdir(), 'DHR69-probe-'));
let paneId = null;

try {
  const version = run('version', ['--version'], { note: '确认 herdr 在 PATH；json:false' });
  assert('herdr-present', version.child.error == null && version.record.exit_code === 0,
    version.child.error?.code ?? `exit=${version.record.exit_code}`);

  const split = run('pane-split', [
    'pane', 'split', '--current', '--no-focus', '--direction', 'right', '--cwd', scratch,
  ], { note: '普通 shell pane，不启动产品 Agent' });
  paneId = split.parsed?.result?.pane?.pane_id ?? null;
  assert('pane-split-json', split.record.exit_code === 0 && split.record.stdout_is_json === true,
    `exit=${split.record.exit_code} json=${split.record.stdout_is_json}`);
  assert('pane-split-id', typeof paneId === 'string' && paneId.length > 0, `paneId=${paneId}`);

  if (paneId) {
    const got = run('pane-get', ['pane', 'get', String(paneId)], { note: 'E-1 主对象：空壳 pane 的 agent_status 字段路径' });
    assert('pane-get-json', got.record.exit_code === 0 && got.record.stdout_is_json === true,
      `exit=${got.record.exit_code} json=${got.record.stdout_is_json}`);
    assert('pane-get-agent-status-path', got.record.agent_status_field_path === 'result.pane.agent_status',
      `path=${got.record.agent_status_field_path}`);
    assert('pane-get-agent-status-string', typeof got.record.agent_status_value === 'string',
      `value=${got.record.agent_status_value}`);
  }

  const missingPane = run('pane-get-missing', ['pane', 'get', 'pane-does-not-exist-dhr69'], {
    note: '错误形态：JSON 在 stderr，exit 1',
  });
  assert('pane-get-missing-exit', missingPane.record.exit_code === 1, `exit=${missingPane.record.exit_code}`);

  const missingAgent = run('agent-get-missing', ['agent', 'get', 'agent-does-not-exist-dhr69'], {
    note: '空壳 pane 没有 agent；用缺失名采 agent get 错误形态，不启动产品 Agent',
  });
  assert('agent-get-missing-exit', missingAgent.record.exit_code === 1, `exit=${missingAgent.record.exit_code}`);
} finally {
  if (paneId) run('pane-close', ['pane', 'close', String(paneId)], { note: '清理本脚本自建 pane' });
  try { rmSync(scratch, { recursive: true, force: true }); } catch { /* ignore */ }
}

const payload = {
  probed_at: new Date().toISOString(),
  herdr_bin: HERDR,
  purpose: 'DHR_69 E-1：普通 shell pane 上 pane get / agent get 的形态（不启动产品 Agent）',
  notes: {
    blocked_value_source: 'evidence/32 §2 F-6809；本 probe 不取 blocked 取值',
    wrapper_unwrap: 'herdr-cli.mjs 拆掉 {id,result} 信封，fake.value 对齐 result',
  },
  probes,
  assertions: failures.length === 0 ? 'pass' : 'fail',
  failures,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

if (failures.length > 0) {
  console.error(`DHR_69 E-1 FAIL ${failures.length}: ${JSON.stringify(failures)}`);
  process.exit(1);
}
console.log(`DHR_69 E-1 PASS ${outPath}`);
