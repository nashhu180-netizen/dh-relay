// herdr-cli.mjs — Herdr CLI 的无状态、安全包装。不会拼接 shell 命令。

import { spawn } from 'node:child_process';

/**
 * 启动调用（`agent start`）的专用上限。
 *
 * herdr 自己的 `agent start --timeout` 默认就是 30 000 ms（`herdr agent start --help`，
 * herdr 0.8.2），而 DHR_35 在**已信任**目录里实测的真实耗时是 min 6850 / 中位 10934 /
 * max 29482 ms——旧的 10 秒通用上限低于 herdr 自身的等待窗口，会把 herdr 还在合法等待
 * 的调用砍断，而此时 agent 往往已经建成。60 秒给 herdr 默认窗口留了一倍余量。
 *
 * 这是**代码常量**，不是配置面：不读环境变量、不进 registry、不加 CLI flag，
 * `agent start` 的 argv 一个字节都不变（B-32 用户裁决）。它只覆盖已观测到的启动样本形态，
 * 不声称足以覆盖任意未来启动。
 */
export const HERDR_START_TIMEOUT_MS = 60_000;
const TASKKILL_TIMEOUT_MS = 5_000;

async function terminateProcessTree(child) {
  if (!child?.pid) return;
  if (process.platform !== 'win32') {
    child.kill('SIGKILL');
    return;
  }
  await new Promise((resolve) => {
    let settled = false;
    const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore', windowsHide: true,
    });
    const finish = (fallback) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (fallback) {
        try { child.kill('SIGKILL'); } catch { /* child 已退出 */ }
      }
      resolve();
    };
    const timer = setTimeout(() => {
      try { killer.kill('SIGKILL'); } catch { /* taskkill 已退出 */ }
      finish(true);
    }, TASKKILL_TIMEOUT_MS);
    timer.unref?.();
    killer.once('error', () => finish(true));
    killer.once('close', status => finish(status !== 0));
  });
}

function failure(detail, { missing = false, timedOut = false, notReady = false } = {}) {
  return { ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail, missing, timedOut, notReady };
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

export function makeHerdrCli({ herdrBin = process.env.DH_RELAY_HERDR_BIN ?? 'herdr', herdrArgs = envArgs(),
  timeoutMs = 10_000, startTimeoutMs = HERDR_START_TIMEOUT_MS } = {}) {
  const invoke = (args, { json = true, timeoutMs: callTimeoutMs = timeoutMs } = {}) => new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let spawnError = null;
    let streamError = null;
    let timedOut = false;
    let termination = Promise.resolve();
    let terminationRequested = false;
    const child = spawn(herdrBin, [...herdrArgs, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
    });
    const requestTermination = () => {
      if (terminationRequested) return;
      terminationRequested = true;
      termination = terminateProcessTree(child);
    };
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', chunk => { stdout += chunk; });
    child.stderr?.on('data', chunk => { stderr += chunk; });
    const onStreamError = (error) => {
      streamError ??= error;
      requestTermination();
    };
    child.stdout?.once('error', onStreamError);
    child.stderr?.once('error', onStreamError);
    child.once('error', error => { spawnError = error; });
    const timer = setTimeout(() => {
      timedOut = true;
      requestTermination();
    }, callTimeoutMs);
    timer.unref?.();
    child.once('close', async (status, signal) => {
      clearTimeout(timer);
      await termination;
      // 保留旧 spawnSync 的返回语义，调用方不需要知道底层已异步化。
      if (timedOut) return resolve(failure('spawn:ETIMEDOUT', { timedOut: true }));
      if (spawnError) return resolve(failure(`spawn:${spawnError.code ?? spawnError.message}`, { timedOut: spawnError.code === 'ETIMEDOUT' }));
      if (streamError) return resolve(failure(`spawn:${streamError.code ?? streamError.message}`));
      if (signal) return resolve(failure(`timeout-or-signal:${signal}`, { timedOut: true }));
      if (status !== 0) {
        const detail = `exit:${status}:${String(stderr).trim().slice(-1000)}`;
        // herdr 把错误以 JSON 写 stderr：`{"error":{"code":"agent_not_found"|"agent_not_ready",…}}`。
        // `agent_not_ready` 是**启动期 blocked**（产品自己的目录信任框之类），不是宿主丢失。
        return resolve(failure(detail, {
          missing: /not found|no such|unknown (agent|pane)/i.test(detail),
          notReady: /agent_not_ready/i.test(detail),
        }));
      }
      const text = String(stdout).trim();
      if (!json) return resolve({ ok: true, value: text });
      const value = jsonValue(text);
      // Herdr CLI envelopes successful data in `{ id, result, type }`; adapter callers consume result only.
      return resolve(value === null ? failure('json-parse') : { ok: true, value: value && typeof value === 'object' && 'result' in value ? value.result : value });
    });
  });
  return {
    paneSplit({ cwd, direction = 'right' }) { return invoke(['pane', 'split', '--current', '--no-focus', '--direction', direction, '--cwd', cwd]); },
    // 真实 `pane run` 成功时 exit 0 且 **stdout 为空**，没有 JSON 信封可拆。
    paneRun({ paneId, command, args = [] }) { return invoke(['pane', 'run', String(paneId), String(command), ...args], { json: false }); },
    agentStart({ name, kind, paneId, args = [] }) {
      return invoke(['agent', 'start', name, '--kind', kind, '--pane', String(paneId), '--', ...args], { timeoutMs: startTimeoutMs });
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
