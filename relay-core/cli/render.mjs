// render.mjs — CLI 的唯一渲染层：text 与 --json 渲染**同一个** Read Model 对象。
//
// design/08 §1 的硬规则：--json = Read Model 原样序列化；text = 同一对象的人读渲染。
// 本模块因此禁止自己计算任何新字段——每个打印出来的值都必须能在传入对象里逐字找到；
// 源头没给的（null）渲染成 `-`，绝不折算、绝不猜值（progress 的「缺省≠已知」纪律同理）。

const dash = (value) => (value === null || value === undefined ? '-' : value);

const renderProgress = (progress) => {
  if (!progress) return '-';
  if (typeof progress.done === 'number' && typeof progress.total === 'number') {
    return `done=${progress.done} total=${progress.total}`;
  }
  return JSON.stringify(progress);
};

/** run_list 视图：每条 Run 一行；read_only 条目前缀 [read-only]（legacy 与孤儿都走这里）。 */
export function renderRunList(model) {
  return model.items.map((item) => {
    const prefix = item.read_only ? '[read-only] ' : '';
    return `${prefix}${item.run_id}  ${item.source}  status=${dash(item.run_status)}`
      + `  group=${dash(item.group)}  updated=${dash(item.updated_at)}`;
  }).join('\n');
}

/** status 视图（run_status_view）：DHR_51 宿主三态 + 账面摘要 + 事件数。 */
export function renderStatusView(envelope) {
  const status = envelope.status;
  const lines = [
    `run_id: ${status.run_id}`,
    `source: ${status.source}`,
    `read_only: ${status.read_only}`,
    `host: ${dash(status.host)}${status.host_detail ? ` (${status.host_detail})` : ''}`,
  ];
  if (status.ledger) {
    lines.push(
      `run_status: ${status.ledger.run_status}`,
      `group: ${status.ledger.group}`,
      `progress: ${renderProgress(status.ledger.progress)}`,
      `updated_at: ${status.ledger.updated_at}`,
      `state_signature: ${status.ledger.state_signature}`,
    );
  } else {
    lines.push('ledger: -');
  }
  lines.push(`events: ${dash(status.events)}`);
  return lines.join('\n');
}

/** detail 视图：完整 relay.run-state/v1 的逐字段渲染，node_states 逐节点一行。 */
export function renderDetailView(envelope) {
  const detail = envelope.detail;
  const lines = [
    `run_id: ${dash(detail.run_id)}`,
    `run_status: ${dash(detail.run_status)}`,
    `group: ${dash(detail.group)}`,
    `progress: ${renderProgress(detail.progress)}`,
    `updated_at: ${dash(detail.updated_at)}`,
    `state_signature: ${dash(detail.state_signature)}`,
    'node_states:',
  ];
  for (const node of detail.node_states ?? []) {
    lines.push(`  - ${node.node_id}: ${dash(node.status)}`);
  }
  return lines.join('\n');
}

/** event_stream_snapshot 视图：快照行 + 两个 seq 游标。 */
export function renderEventSnapshot(envelope) {
  const snapshot = envelope.snapshot ?? {};
  return [
    `run_id: ${envelope.run_id}`,
    `host: ${dash(snapshot.host)}${snapshot.host_detail ? ` (${snapshot.host_detail})` : ''}`,
    `run_status: ${snapshot.ledger ? snapshot.ledger.run_status : '-'}`,
    `snapshot_seq: ${envelope.snapshot_seq}`,
    `next_seq: ${envelope.next_seq}`,
  ].join('\n');
}

/** event 通知：seq / kind / detail 都取自事件本体。 */
export function renderEvent(params) {
  return `[${params.seq}] ${params.kind}${params.detail ? ` ${params.detail}` : ''}`;
}

/** runStateChanged 通知：状态只来自通知本体，绝不从事件流推导。 */
export function renderRunStateChanged(params) {
  return `state: run_status=${dash(params.state?.run_status)} caused_by_seq=${params.caused_by_seq}`;
}

/** operation_receipt：start/stop/resume 的回执字段逐项渲染。 */
export function renderReceipt(receipt) {
  return [
    `receipt_id: ${receipt.receipt_id}`,
    `state: ${receipt.state}`,
    `kind: ${receipt.kind}`,
    `method: ${receipt.method}`,
    `run_id: ${dash(receipt.run_id)}`,
    `reason: ${dash(receipt.reason)}`,
    `request_id: ${receipt.request_id}`,
    `client_id: ${receipt.client_id}`,
    `issued_at: ${receipt.issued_at}`,
  ].join('\n');
}

// 错误渲染二分（task_plan 批次 B B-2）：RPC error data.receipt 现为必填（Receipt|null）。
// 两段措辞必须可区分且被测试钉住——receipt 非 null 说明这次 operation 已确定失败，
// 凭同幂等键重试拿回的是同一份 failed Receipt；receipt 为 null 说明 operation 根本没开始。
export const RECEIPT_FAILURE_HINT = '操作已确定失败；凭同一幂等键重试将拿回同一份 failed Receipt';
export const RESULT_UNKNOWN_HINT = '结果未知；可安全重试';

/** RPC 稳定拒绝：`{reason, receipt, detail}` 的人读渲染。 */
export function renderRpcError(error) {
  const lines = [`relay: ${dash(error.reason)}: ${error.receipt ? RECEIPT_FAILURE_HINT : RESULT_UNKNOWN_HINT}`];
  if (error.receipt) {
    lines.push(
      `receipt_id: ${error.receipt.receipt_id}`,
      `receipt_state: ${error.receipt.state}`,
      `receipt_reason: ${dash(error.receipt.reason)}`,
    );
  }
  if (error.detail) lines.push(`detail: ${error.detail}`);
  return lines.join('\n');
}

/** 传输层失败（没拿到任何确定响应）：结果未知，残条保留、可安全重试。 */
export function renderTransportFailure(message) {
  return `relay: ${message}: ${RESULT_UNKNOWN_HINT}`;
}
