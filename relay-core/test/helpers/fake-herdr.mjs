// 可编程的 Herdr 假宿主；状态在调用方提供的对象中，测试无需真实终端或账号。
//
// DHR_68 验收项 D：本文件每个命令的**返回形态**必须与真实 herdr 一致。对照证据见
// `docs/modules/dh-relay/workspace/DHR_68/evidence/real-herdr-command-shapes.json`
// （herdr 0.8.2 实测）。要点：
//   - CLI wrapper 已拆掉 `{id,result}` 信封，所以这里的 `value` 等于真实的 `result`。
//   - `pane run` / `agent read` / `--version` 走 `json:false`，成功时 `value` 是**字符串**；
//     `pane run` 成功的真实 stdout 是**空串**（DHR_67 的 fake 曾返回 JSON，掩盖了真实缺陷）。
//   - `agent send-keys` / `pane close` 的 result 只有 `{type:'ok'}`；但 `agent prompt` /
//     `agent rename` 会把**整个 agent 记录**一起返回（`{agent:{…},type}`）——别把它们混为一类。
//   - 失败时 herdr 把 JSON 错误写 **stderr** 且 exit 1，wrapper 折成 `exit:1:{"error":{"code":…}}`。
//   - `agent list` 里**自动识别**出来的 agent **没有 `name` 字段**，只有 named agent 才有。

const agentRecord = ({ agent = 'codex', agentStatus = 'idle', paneId = 'pane-1', name = undefined, seq = 0 } = {}) => ({
  agent, agent_status: agentStatus, cwd: 'C:/work', focused: false, pane_id: paneId,
  revision: 0, state_change_seq: seq, tab_id: 'tab-1', terminal_id: 'term-1',
  terminal_title: 'fake', terminal_title_stripped: 'fake', workspace_id: 'ws-1',
  ...(name === undefined ? {} : { name }),
});

const paneRecord = ({ paneId = 'pane-1', agentStatus = 'unknown' } = {}) => ({
  agent: null, agent_status: agentStatus, cwd: 'C:/work', focused: false, pane_id: paneId,
  revision: 0, scroll: { max_offset: 0, offset: 0 }, tab_id: 'tab-1', terminal_id: 'term-1',
  terminal_title: 'fake', terminal_title_stripped: 'fake', workspace_id: 'ws-1',
});

// 真实 herdr 的错误串形态：wrapper 把 exit 1 + stderr JSON 折成 `exit:1:<stderr>`。
export const herdrErrorDetail = (code, message) => `exit:1:{"error":{"code":"${code}","message":"${message}"},"id":"cli:fake"}`;

export function makeFakeHerdr({ statuses = ['idle'], paneStatuses = ['unknown'], read = 'result', paneAlive = true, agentAlive = true, missing = false,
  agentGetFailAfter = null, terminalIds = null,
  paneKillResult = { ok: true, value: { type: 'ok' } },
  paneRunResult = { ok: true, value: '' },
  agentStartResult = { ok: true, value: { agent: agentRecord(), argv: [], type: 'ok' } },
  agentRenameResult = { ok: true, value: { agent: agentRecord({ agent: 'claude' }), type: 'ok' } },
  listedAgents = [agentRecord({ agent: 'claude', paneId: 'pane-1' })], listedAgentSnapshots = null, onAgentStart = null } = {}) {
  let index = 0;
  let paneIndex = 0;
  let agentStatusSeq = statuses;
  let paneStatusSeq = paneStatuses;
  const sent = [];
  let paneSplits = 0;
  let paneKills = 0;
  let paneGets = 0;
  let agentReads = 0;
  let agentListReads = 0;
  let agentGets = 0;
  const calls = [];
  const current = () => agentStatusSeq[Math.min(index++, agentStatusSeq.length - 1)] ?? 'unknown';
  const currentPane = () => paneStatusSeq[Math.min(paneIndex++, paneStatusSeq.length - 1)] ?? 'unknown';
  return {
    sent,
    get paneSplits() { return paneSplits; },
    get paneKills() { return paneKills; },
    get paneGets() { return paneGets; },
    get agentReads() { return agentReads; },
    get agentGets() { return agentGets; },
    setStatuses(next) { agentStatusSeq = next; index = 0; },
    setPaneStatuses(next) { paneStatusSeq = next; paneIndex = 0; },
    calls,
    cli: {
      paneSplit: ({ cwd }) => { paneSplits += 1; calls.push(['paneSplit', cwd]); return { ok: true, value: { pane: paneRecord(), type: 'ok' } }; },
      paneGet: (paneId) => {
        paneGets += 1;
        calls.push(['paneGet', paneId]);
        return paneAlive
          ? { ok: true, value: { pane: paneRecord({ paneId: paneId ?? 'pane-1', agentStatus: currentPane() }), type: 'ok' } }
          : { ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: herdrErrorDetail('pane_not_found', 'pane pane-1 not found'), missing };
      },
      paneKill: (paneId) => { paneKills += 1; calls.push(['paneKill', paneId]); return paneKillResult; },
      paneRun: ({ paneId, command, args = [] }) => { calls.push(['paneRun', paneId, command, args]); return paneRunResult; },
      agentStart: ({ name, kind, paneId, args = [] }) => { calls.push(['agentStart', name, kind, paneId, args]); queueMicrotask(() => onAgentStart?.()); return agentStartResult; },
      agentList: () => {
        calls.push(['agentList']);
        const agents = Array.isArray(listedAgentSnapshots)
          ? listedAgentSnapshots[Math.min(agentListReads++, listedAgentSnapshots.length - 1)]
          : listedAgents;
        return { ok: true, value: { agents, type: 'ok' } };
      },
      agentRename: ({ target, name }) => { calls.push(['agentRename', target, name]); return agentRenameResult; },
      agentGet: () => {
        agentGets += 1;
        if (typeof agentGetFailAfter === 'number' && agentGets > agentGetFailAfter) {
          return { ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: herdrErrorDetail('agent_not_ready', 'agent get failed after probe') };
        }
        const record = agentRecord({ agentStatus: current(), seq: index });
        if (Array.isArray(terminalIds) && terminalIds.length > 0) {
          record.terminal_id = terminalIds[Math.min(agentGets - 1, terminalIds.length - 1)];
        }
        return agentAlive
          ? { ok: true, value: { agent: record, type: 'ok' } }
          : { ok: false, reason: 'E_BAD_VALUE:HERDR_CLI', detail: herdrErrorDetail('agent_not_found', 'agent target herdr-x not found'), missing };
      },
      agentRead: () => { agentReads += 1; return { ok: true, value: read }; },
      agentSendKeys: (name, keys) => { sent.push({ name, keys }); return { ok: true, value: { type: 'ok' } }; },
      agentPrompt: (name, text) => { sent.push({ name, text }); return { ok: true, value: { agent: agentRecord(), type: 'ok' } }; },
    },
  };
}
