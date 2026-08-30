// 可编程的 Herdr 假宿主；状态在调用方提供的对象中，测试无需真实终端或账号。

export function makeFakeHerdr({ statuses = ['idle'], read = 'result', paneAlive = true, agentAlive = true, missing = false,
  paneKillResult = { ok: true, value: {} }, paneRunResult = { ok: true, value: {} }, agentStartResult = { ok: true, value: { terminal_id: 'term-1' } },
  agentRenameResult = { ok: true, value: {} }, listedAgents = [{ agent: 'claude', name: 'detected-agent', pane_id: 'pane-1', terminal_id: 'term-1' }], listedAgentSnapshots = null, onAgentStart = null } = {}) {
  let index = 0;
  const sent = [];
  let paneSplits = 0;
  let paneKills = 0;
  let agentReads = 0;
  let agentListReads = 0;
  const calls = [];
  const current = () => statuses[Math.min(index++, statuses.length - 1)] ?? 'unknown';
  return {
    sent,
    get paneSplits() { return paneSplits; },
    get paneKills() { return paneKills; },
    get agentReads() { return agentReads; },
    calls,
    cli: {
      paneSplit: ({ cwd }) => { paneSplits += 1; calls.push(['paneSplit', cwd]); return { ok: true, value: { pane_id: 'pane-1' } }; },
      paneGet: () => paneAlive ? { ok: true, value: { pane_id: 'pane-1' } } : { ok: false, detail: 'missing-pane', missing },
      paneKill: (paneId) => { paneKills += 1; calls.push(['paneKill', paneId]); return paneKillResult; },
      paneRun: ({ paneId, command, args = [] }) => { calls.push(['paneRun', paneId, command, args]); return paneRunResult; },
      agentStart: ({ name, kind, paneId, args = [] }) => { calls.push(['agentStart', name, kind, paneId, args]); queueMicrotask(() => onAgentStart?.()); return agentStartResult; },
      agentList: () => {
        calls.push(['agentList']);
        const agents = Array.isArray(listedAgentSnapshots)
          ? listedAgentSnapshots[Math.min(agentListReads++, listedAgentSnapshots.length - 1)]
          : listedAgents;
        return { ok: true, value: { agents } };
      },
      agentRename: ({ target, name }) => { calls.push(['agentRename', target, name]); return agentRenameResult; },
      agentGet: () => agentAlive ? { ok: true, value: { agent_status: current(), state_change_seq: index } } : { ok: false, detail: 'missing-agent', missing },
      agentRead: () => { agentReads += 1; return { ok: true, value: read }; },
      agentSendKeys: (name, keys) => { sent.push({ name, keys }); return { ok: true, value: {} }; },
      agentPrompt: (name, text) => { sent.push({ name, text }); return { ok: true, value: {} }; },
    },
  };
}
