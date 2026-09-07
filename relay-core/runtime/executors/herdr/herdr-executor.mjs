// herdr-executor.mjs — 纯 Herdr adapter：不导入 Store、不认识节点依赖。

import { createHash } from 'node:crypto';

export const HERDR_STATUS_MAPPING = Object.freeze({
  working: { status: 'running', event: 'checkpoint_recorded' },
  blocked: { status: 'waiting_human', event: 'human_input_requested' },
  done: { status: 'running', event: 'host_observation_changed' },
  idle: { status: 'running', event: 'host_observation_changed' },
  unknown: { status: 'running', event: 'host_observation_changed' },
  observation_lost: { status: 'running', event: 'host_observation_changed' },
});

const agentKind = (profile) => profile.product === 'claude-code' ? 'claude' : 'codex';
const isClaudeProfile = (profile) => profile.product === 'claude-code';
const field = (value, ...names) => names.map(name => value?.[name]).find(item => item !== undefined && item !== null);
const agentNameOf = (attemptId) => `herdr-${String(attemptId).replace(/[^a-z0-9_-]/gi, '').toLowerCase().slice(0, 26)}`;
const entity = (value) => value?.agent ?? value?.pane ?? value;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export const ATTACH_PREFIX = 'herdr agent attach ';

export function deriveHerdrHostRef(terminalId) {
  if (typeof terminalId !== 'string' || terminalId.length === 0) return null;
  const digest = createHash('sha256').update(`dh-relay.host-ref/v1\0${terminalId}`, 'utf8').digest('hex');
  return `herdr-terminal/sha256-${digest}`;
}

const terminalIdentity = (value) => {
  const terminalId = field(entity(value), 'terminal_id');
  const hostRef = deriveHerdrHostRef(terminalId);
  return hostRef === null ? null : { terminalId, hostRef };
};

const invalidTerminalIdentity = () => ({
  ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: 'terminal-id-missing-or-invalid',
});

function paneCandidates(value, paneId) {
  const agents = Array.isArray(value) ? value : value?.agents;
  if (!Array.isArray(agents)) return [];
  return agents.filter(agent => String(agent?.pane_id ?? '') === String(paneId));
}

async function renameClaudeAgent({ cli, paneId, agentName, readyTimeoutMs, readyPollMs }) {
  const deadline = Date.now() + readyTimeoutMs;
  while (true) {
    const listed = await cli.agentList();
    if (!listed.ok) return listed;
    const candidates = paneCandidates(listed.value, paneId);
    if (candidates.length === 1 && candidates[0]?.agent === 'claude') {
      const renamed = await cli.agentRename({ target: paneId, name: agentName });
      if (!renamed.ok) return renamed;
      const identity = terminalIdentity(renamed.value);
      return identity === null ? invalidTerminalIdentity() : { ok: true, ...identity };
    }
    if (Date.now() >= deadline) {
      return { ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: `claude-agent-identification-not-unique:${candidates.length}` };
    }
    await sleep(readyPollMs);
  }
}

export function observationDetail({ herdrStatus, agentName, paneId, seq, workDirRoot, profileId,
  agentGet = '-', paneGet = '-', conflictEscalation = null }) {
  const base = `herdr_status=${herdrStatus};agent=${agentName};pane=${paneId};seq=${seq ?? '-'};work_dir_root=${workDirRoot};profile=${profileId};agent_get=${agentGet};pane_get=${paneGet}`;
  return conflictEscalation ? `${base};conflict_escalation=${conflictEscalation}` : base;
}

export async function launchHerdrAgent({ cli, registryProfile, runId, nodeId, attemptId, workDirRoot, args = [], readyTimeoutMs = 10_000, readyPollMs = 100 }) {
  if (!workDirRoot) return { ok: false, reason: 'E_BAD_VALUE:WORK_DIR_ROOT', detail: 'work_dir_root-required' };
  const split = await cli.paneSplit({ cwd: workDirRoot });
  if (!split.ok) return split;
  const paneId = field(entity(split.value), 'pane_id', 'id');
  const closeFailedPane = async (failure) => {
    const killed = await cli.paneKill(paneId);
    const killDetail = killed?.ok ? 'pane-kill=ok' : `pane-kill=${killed?.detail ?? killed?.reason ?? 'failed'}`;
    return { ...failure, detail: [failure.detail, killDetail].filter(Boolean).join(';') };
  };
  if (!paneId) return await closeFailedPane({ ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: 'pane-id-missing' });
  // Herdr agent names are lowercase and at most 32 chars; attempt_id supplies the unique suffix.
  const agentName = agentNameOf(attemptId);
  const start = isClaudeProfile(registryProfile)
    ? await (async () => {
      if (typeof registryProfile.command_alias !== 'string' || registryProfile.command_alias.length === 0) {
        return { ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: 'claude-command-alias-missing' };
      }
      return await cli.paneRun({ paneId, command: registryProfile.command_alias, args });
    })()
    : await cli.agentStart({ name: agentName, kind: agentKind(registryProfile), paneId, args });
  // DHR_68/A：启动调用**超时**不等于启动失败——真实 herdr 自己的 `agent start` 等待窗口
  // 默认就有 30 秒，超时时 agent 往往已经建成。先只读对账一次，再决定是否回滚。
  // DHR_68/C：启动期 `agent_not_ready`（产品自己的目录信任框之类）是要人处理的暂停，
  // 不是启动失败——保留 handle、不关 pane，由 driver 写一条 Attention。
  const startBlocked = start.notReady === true;
  let reconciledStart = null;
  if (!start.ok && !startBlocked) {
    if (start.timedOut !== true) return await closeFailedPane(start);
    // 对账**只读**。绝不重发启动调用：那会在真实宿主上拉起第二个 Agent 进程。
    const listed = isClaudeProfile(registryProfile) ? await cli.agentList() : null;
    reconciledStart = isClaudeProfile(registryProfile)
      ? (listed.ok === true && paneCandidates(listed.value, paneId).length > 0 ? listed : null)
      : await cli.agentGet(agentName);
    if (!reconciledStart?.ok) return await closeFailedPane(start);
  }
  if (startBlocked && !isClaudeProfile(registryProfile) && terminalIdentity(start.value) === null) {
    reconciledStart = await cli.agentGet(agentName);
    if (!reconciledStart?.ok) return await closeFailedPane(start);
  }
  const renamed = isClaudeProfile(registryProfile)
    ? await renameClaudeAgent({ cli, paneId, agentName, readyTimeoutMs, readyPollMs })
    : (() => {
      const identity = terminalIdentity(reconciledStart?.value ?? start.value);
      return identity === null ? invalidTerminalIdentity() : { ok: true, ...identity };
    })();
  if (!renamed.ok) return await closeFailedPane(renamed);
  const handle = {
    agent_name: agentName,
    pane_id: String(paneId),
    terminal_id: renamed.terminalId,
    host_ref: renamed.hostRef,
    work_dir_root: workDirRoot,
    executor_profile_id: registryProfile.executor_profile_id,
    started_at: new Date().toISOString(),
    launch_constraints: isClaudeProfile(registryProfile) ? ['claude-requires-pane-run'] : [],
  };
  // 已知启动期就 blocked 时不必再等就绪：等不到，只会把该给人的 Attention 拖后。
  const deadline = Date.now() + (startBlocked ? 0 : readyTimeoutMs);
  let observed = await observeHerdrAgent({ cli, handle });
  while (observed.ok && !['idle', 'working'].includes(observed.observation.herdr_status) && Date.now() < deadline) {
    await sleep(readyPollMs);
    observed = await observeHerdrAgent({ cli, handle });
  }
  const readyObservation = observed.ok ? observed.observation : null;
  const blind = readyObservation !== null && !['idle', 'working'].includes(readyObservation.herdr_status);
  // Claude 的信任框出现在 `pane run` 成功**之后**，所以启动期 blocked 也可能只由观测报出来。
  const launchBlocked = startBlocked || readyObservation?.herdr_status === 'blocked';
  return { ok: true, handle, blind, launch_blocked: launchBlocked, ready_observation: readyObservation,
    ready_state_change_seq: readyObservation?.state_change_seq ?? null, ready_timeout_ms: readyTimeoutMs };
}

export async function observeHerdrAgent({ cli, handle }) {
  const found = await cli.agentGet(handle.agent_name);
  if (!found.ok) return found;
  const identity = terminalIdentity(found.value);
  if (identity === null) return invalidTerminalIdentity();
  const status = field(entity(found.value), 'agent_status', 'status');
  if (typeof status !== 'string') return { ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: 'agent-status-missing' };
  // DHR_69：仅当 agent get 报 idle 时才读 pane get。覆盖规则唯一：idle ∧ pane blocked → 派生 blocked。
  // pane 的其它取值不覆盖——evidence/32 已记录正常工作时两个信号会短暂不一致。
  let paneGet = '-';
  let paneGetCalled = false;
  let herdrStatus = status;
  if (status === 'idle') {
    paneGetCalled = true;
    const pane = typeof cli.paneGet === 'function' ? await cli.paneGet(handle.pane_id) : { ok: false };
    if (!pane?.ok) {
      paneGet = 'error';
    } else {
      const paneStatus = field(entity(pane.value), 'agent_status', 'status');
      paneGet = typeof paneStatus === 'string' ? paneStatus : 'error';
      if (paneGet === 'blocked') herdrStatus = 'blocked';
    }
  }
  return { ok: true, observation: {
    host_ref: identity.hostRef,
    herdr_status: herdrStatus,
    agent_get: status,
    pane_get: paneGet,
    pane_get_called: paneGetCalled,
    state_change_seq: field(entity(found.value), 'state_change_seq', 'seq') ?? 0,
    observed_at: new Date().toISOString(),
  } };
}

export async function reconcileHerdrAgent({ cli, handle, lastSeq = null }) {
  const observed = await observeHerdrAgent({ cli, handle });
  if (observed.ok && observed.observation.herdr_status !== 'unknown') return { kind: 'alive', observation: observed.observation, lastSeq };
  const pane = typeof cli.paneGet === 'function' ? await cli.paneGet(handle.pane_id) : { ok: false, missing: false };
  return observed?.missing === true && pane?.missing === true ? { kind: 'host_lost' } : { kind: 'observation_lost' };
}

export async function captureHerdrResult({ cli, handle, lines = 120, judge = null }) {
  const read = await cli.agentRead(handle.agent_name, { lines, source: 'recent-unwrapped' });
  if (!read.ok) return read;
  const text = read.value;
  const verdict = typeof judge === 'function' ? judge(text) : null;
  return { ok: true, text, verdict: verdict ?? null };
}

export async function sendToHerdrAgent({ cli, handle, text = null, keys = null }) {
  if (text !== null) return await sendStartupInstruction({ cli, handle, text: String(text) });
  return await cli.agentSendKeys(handle.agent_name, Array.isArray(keys) ? keys : [String(keys)]);
}

/** The sole transport boundary for an immutable startup instruction. */
export async function sendStartupInstruction({ cli, handle, text }) {
  if (typeof text !== 'string' || text.length === 0) throw new Error('E_BAD_VALUE:startup-instruction-required');
  return await cli.agentPrompt(handle.agent_name, text);
}

/**
 * Completion is deliberately a transport instruction, not a result payload.  The
 * worker must submit the closed Receipt-bound object through the Relay v2 bridge;
 * pane text, captured output, and host status never become a Result by inference.
 */
export function attachHerdrAgent({ handle }) {
  return { agent_name: handle.agent_name, pane_id: handle.pane_id, instruction: `${ATTACH_PREFIX}${handle.agent_name}` };
}

export async function stopHerdrAgent({ cli, handle, timeoutMs = 2_000 }) {
  return await cli.paneKill(handle.pane_id, { timeoutMs });
}
