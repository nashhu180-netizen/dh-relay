// herdr-cli.mjs — Herdr CLI 的无状态、安全包装。不会拼接 shell 命令。

import { spawnSync } from 'node:child_process';

function failure(detail, { missing = false } = {}) {
  return { ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail, missing };
}

function jsonValue(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function envArgs() {
  try {
    const value = JSON.parse(process.env.DH_RELAY_HERDR_ARGS ?? '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function makeHerdrCli({ herdrBin = process.env.DH_RELAY_HERDR_BIN ?? 'herdr', herdrArgs = envArgs(), timeoutMs = 10_000 } = {}) {
  const invoke = (args, { json = true, timeoutMs: callTimeoutMs = timeoutMs } = {}) => {
    const child = spawnSync(herdrBin, [...herdrArgs, ...args], {
      encoding: 'utf8', timeout: callTimeoutMs, windowsHide: true,
    });
    if (child.error) return failure(`spawn:${child.error.code ?? child.error.message}`);
    if (child.signal) return failure(`timeout-or-signal:${child.signal}`);
    if (child.status !== 0) {
      const detail = `exit:${child.status}:${String(child.stderr ?? '').trim().slice(-1000)}`;
      return failure(detail, { missing: /not found|no such|unknown (agent|pane)/i.test(detail) });
    }
    const text = String(child.stdout ?? '').trim();
    if (!json) return { ok: true, value: text };
    const value = jsonValue(text);
    // Herdr CLI envelopes successful data in `{ id, result, type }`; adapter callers consume result only.
    return value === null ? failure('json-parse') : { ok: true, value: value && typeof value === 'object' && 'result' in value ? value.result : value };
  };
  return {
    paneSplit({ cwd, direction = 'right' }) { return invoke(['pane', 'split', '--current', '--no-focus', '--direction', direction, '--cwd', cwd]); },
    paneRun({ paneId, command, args = [] }) { return invoke(['pane', 'run', String(paneId), String(command), ...args]); },
    agentStart({ name, kind, paneId, args = [] }) {
      return invoke(['agent', 'start', name, '--kind', kind, '--pane', String(paneId), '--', ...args]);
    },
    agentList() { return invoke(['agent', 'list']); },
    agentRename({ target, name }) { return invoke(['agent', 'rename', String(target), String(name)]); },
    agentGet(name) { return invoke(['agent', 'get', name]); },
    agentRead(name, { lines = 120, source = 'recent-unwrapped' } = {}) {
      return invoke(['agent', 'read', name, '--source', source, '--lines', String(lines)], { json: false });
    },
    agentSendKeys(name, keys) { return invoke(['agent', 'send-keys', name, ...keys]); },
    agentPrompt(name, text) { return invoke(['agent', 'prompt', name, text]); },
    paneGet(paneId) { return invoke(['pane', 'get', String(paneId)]); },
    paneKill(paneId, { timeoutMs: killTimeoutMs } = {}) { return invoke(['pane', 'close', String(paneId)], { timeoutMs: killTimeoutMs }); },
    version() { return invoke(['--version'], { json: false }); },
  };
}
