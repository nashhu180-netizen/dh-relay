// herdr-executor.mjs — 纯 Herdr adapter：不导入 Store、不认识节点依赖。

export const HERDR_STATUS_MAPPING = Object.freeze({
  working: { status: 'running', event: 'checkpoint_recorded' },
  blocked: { status: 'waiting_human', event: 'human_input_requested' },
  done: { status: 'running', event: 'host_observation_changed' },
  idle: { status: 'running', event: 'host_observation_changed' },
  unknown: { status: 'running', event: 'host_observation_changed' },
  observation_lost: { status: 'running', event: 'host_observation_changed' },
});

const agentKind = (profile) => profile.product === 'claude-code' ? 'claude' : 'codex';
const field = (value, ...names) => names.map(name => value?.[name]).find(item => item !== undefined && item !== null);
const agentNameOf = (attemptId) => `herdr-${String(attemptId).replace(/[^a-z0-9_-]/gi, '').toLowerCase().slice(0, 26)}`;
const entity = (value) => value?.agent ?? value?.pane ?? value;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export const ATTACH_PREFIX = 'herdr agent attach ';

export function observationDetail({ herdrStatus, agentName, paneId, seq, workDirRoot, profileId }) {
  return `herdr_status=${herdrStatus};agent=${agentName};pane=${paneId};seq=${seq ?? '-'};work_dir_root=${workDirRoot};profile=${profileId}`;
}

export async function launchHerdrAgent({ cli, registryProfile, runId, nodeId, attemptId, workDirRoot, args = [], readyTimeoutMs = 10_000, readyPollMs = 100 }) {
  if (!workDirRoot) return { ok: false, reason: 'E_BAD_VALUE:WORK_DIR_ROOT', detail: 'work_dir_root-required' };
  const split = cli.paneSplit({ cwd: workDirRoot });
  if (!split.ok) return split;
  const paneId = field(entity(split.value), 'pane_id', 'id');
  const closeFailedPane = (failure) => {
    const killed = cli.paneKill(paneId);
    const killDetail = killed?.ok ? 'pane-kill=ok' : `pane-kill=${killed?.detail ?? killed?.reason ?? 'failed'}`;
    return { ...failure, detail: [failure.detail, killDetail].filter(Boolean).join(';') };
  };
  if (!paneId) return closeFailedPane({ ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: 'pane-id-missing' });
  // Herdr agent names are lowercase and at most 32 chars; attempt_id supplies the unique suffix.
  const agentName = agentNameOf(attemptId);
  const start = cli.agentStart({ name: agentName, kind: agentKind(registryProfile), paneId, args });
  if (!start.ok) return closeFailedPane(start);
  const handle = {
    agent_name: agentName,
    pane_id: String(paneId),
    terminal_id: String(field(entity(start.value), 'terminal_id', 'pane_id') ?? paneId),
    work_dir_root: workDirRoot,
    executor_profile_id: registryProfile.executor_profile_id,
    started_at: new Date().toISOString(),
    launch_constraints: registryProfile.product === 'claude-code' ? ['claude-requires-pane-run'] : [],
  };
  const deadline = Date.now() + readyTimeoutMs;
  let observed = await observeHerdrAgent({ cli, handle });
  while (observed.ok && !['idle', 'working'].includes(observed.observation.herdr_status) && Date.now() < deadline) {
    await sleep(readyPollMs);
    observed = await observeHerdrAgent({ cli, handle });
  }
  const readyObservation = observed.ok ? observed.observation : null;
  const blind = readyObservation !== null && !['idle', 'working'].includes(readyObservation.herdr_status);
  return { ok: true, handle, blind, ready_observation: readyObservation,
    ready_state_change_seq: readyObservation?.state_change_seq ?? null, ready_timeout_ms: readyTimeoutMs };
}

export async function observeHerdrAgent({ cli, handle }) {
  const found = cli.agentGet(handle.agent_name);
  if (!found.ok) return found;
  const status = field(entity(found.value), 'agent_status', 'status');
  if (typeof status !== 'string') return { ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: 'agent-status-missing' };
  return { ok: true, observation: {
    herdr_status: status,
    state_change_seq: field(entity(found.value), 'state_change_seq', 'seq') ?? 0,
    observed_at: new Date().toISOString(),
  } };
}

export async function reconcileHerdrAgent({ cli, handle, lastSeq = null }) {
  const observed = await observeHerdrAgent({ cli, handle });
  if (observed.ok && observed.observation.herdr_status !== 'unknown') return { kind: 'alive', observation: observed.observation, lastSeq };
  const pane = typeof cli.paneGet === 'function' ? cli.paneGet(handle.pane_id) : { ok: false, missing: false };
  return observed?.missing === true && pane?.missing === true ? { kind: 'host_lost' } : { kind: 'observation_lost' };
}

export async function captureHerdrResult({ cli, handle, lines = 120, judge = null }) {
  const read = cli.agentRead(handle.agent_name, { lines, source: 'recent-unwrapped' });
  if (!read.ok) return read;
  const text = read.value;
  const verdict = typeof judge === 'function' ? judge(text) : null;
  return { ok: true, text, verdict: verdict ?? null };
}

export async function sendToHerdrAgent({ cli, handle, text = null, keys = null }) {
  if (text !== null) return cli.agentPrompt(handle.agent_name, String(text));
  return cli.agentSendKeys(handle.agent_name, Array.isArray(keys) ? keys : [String(keys)]);
}

export function attachHerdrAgent({ handle }) {
  return { agent_name: handle.agent_name, pane_id: handle.pane_id, instruction: `${ATTACH_PREFIX}${handle.agent_name}` };
}

export async function stopHerdrAgent({ cli, handle, timeoutMs = 2_000 }) {
  return cli.paneKill(handle.pane_id, { timeoutMs });
}
