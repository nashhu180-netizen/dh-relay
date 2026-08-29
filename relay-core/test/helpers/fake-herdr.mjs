// 可编程的 Herdr 假宿主；状态在调用方提供的对象中，测试无需真实终端或账号。

export function makeFakeHerdr({ statuses = ['idle'], read = 'result', paneAlive = true, agentAlive = true, missing = false,
  paneKillResult = { ok: true, value: {} }, agentStartResult = { ok: true, value: { terminal_id: 'term-1' } }, onAgentStart = null } = {}) {
  let index = 0;
  const sent = [];
  let paneSplits = 0;
  let paneKills = 0;
  let agentReads = 0;
  const current = () => statuses[Math.min(index++, statuses.length - 1)] ?? 'unknown';
  return {
    sent,
    get paneSplits() { return paneSplits; },
    get paneKills() { return paneKills; },
    get agentReads() { return agentReads; },
    cli: {
      paneSplit: () => { paneSplits += 1; return { ok: true, value: { pane_id: 'pane-1' } }; },
      paneGet: () => paneAlive ? { ok: true, value: { pane_id: 'pane-1' } } : { ok: false, detail: 'missing-pane', missing },
      paneKill: () => { paneKills += 1; return paneKillResult; },
      agentStart: () => { queueMicrotask(() => onAgentStart?.()); return agentStartResult; },
      agentGet: () => agentAlive ? { ok: true, value: { agent_status: current(), state_change_seq: index } } : { ok: false, detail: 'missing-agent', missing },
      agentRead: () => { agentReads += 1; return { ok: true, value: read }; },
      agentSendKeys: (name, keys) => { sent.push({ name, keys }); return { ok: true, value: {} }; },
      agentPrompt: (name, text) => { sent.push({ name, text }); return { ok: true, value: {} }; },
    },
  };
}
