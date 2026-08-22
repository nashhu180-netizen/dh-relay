import { digest } from '../tools/canonical.mjs';

const STATUS_RANK = ['failed', 'running', 'waiting_human', 'unknown', 'pending', 'succeeded'];
const GROUP = { failed: 'failed', running: 'running', waiting_human: 'needs_you', unknown: 'needs_you', pending: 'running', succeeded: 'done' };

// 各 kind 对节点状态的推进作用。回放 = 按 seq 序把事件折叠到节点状态上；折叠只依赖
// 起始状态与其后的事件——这正是「快照 + 增量回放 ≡ 从零全量回放」逐字节成立的全部前提。
const STATUS_TRANSITIONS = {
  running: new Set(['node_started', 'attempt_started', 'checkpoint_recorded']),
  waiting_human: new Set(['human_input_requested']),
  succeeded: new Set(['attempt_succeeded']),
  failed: new Set(['attempt_failed']),
  orphaned: new Set(['attempt_orphaned']),
};

function emptyNodeState(node) {
  return { node_id: node.node_id, status: 'pending', current_attempt_id: null, attempt_count: null };
}

function foldNode(nodeState, orderedEvents) {
  let { status, current_attempt_id: currentAttemptId, attempt_count: attemptCount } = nodeState;
  for (const event of orderedEvents) {
    if (event.node_id !== nodeState.node_id) continue;
    if (event.attempt_id !== null && event.attempt_id !== undefined) {
      currentAttemptId = event.attempt_id;
      attemptCount = (attemptCount ?? 0) + (event.kind === 'attempt_started' ? 1 : 0);
    }
    for (const [nextStatus, kinds] of Object.entries(STATUS_TRANSITIONS)) {
      if (kinds.has(event.kind)) status = nextStatus;
    }
  }
  return { ...nodeState, status, current_attempt_id: currentAttemptId, attempt_count: attemptCount };
}

function aggregate(nodeStates) {
  for (const status of STATUS_RANK) {
    if (status === 'succeeded') {
      if (nodeStates.every((node) => node.status === 'succeeded')) return status;
      continue;
    }
    if (nodeStates.some((node) => node.status === status || (status === 'failed' && node.status === 'orphaned'))) return status;
  }
  return 'pending';
}

/**
 * 从可选的既有状态（快照；传入前须剥掉 state_signature）出发折叠增量事件。
 * 不给 state 就是从零全量回放。同一事件账下两条路径必须产出逐字节相同的结果，
 * store.test.mjs 的切点矩阵钉住这一不变量。
 */
export function applyEvents({ run, state, events }) {
  const ordered = [...events].sort((left, right) => left.seq - right.seq);
  const priorById = new Map((state?.node_states ?? []).map((nodeState) => [nodeState.node_id, nodeState]));
  const node_states = run.nodes.map((node) => foldNode(priorById.get(node.node_id) ?? emptyNodeState(node), ordered));
  const run_status = aggregate(node_states);
  const updated_at = ordered.at(-1)?.at ?? state?.updated_at ?? run.created_at;
  const next = {
    protocol: 'relay.run-state/v1',
    run_id: run.run_id,
    run_status,
    group: GROUP[run_status],
    progress: { done: node_states.filter((node) => node.status === 'succeeded').length, total: node_states.length },
    elapsed_seconds: state?.elapsed_seconds ?? 0,
    node_states,
    updated_at,
  };
  return { ...next, state_signature: digest(next) };
}

export function replayRun({ run, events }) {
  return applyEvents({ run, events });
}
