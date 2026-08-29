// workflow-driver.mjs — DHR_31：按 Run 文档的依赖图推进 Process 节点。
//
// 唯一写者纪律（design/07 §3.2 · P5-M3）：driver **不持有 Store 句柄**，一切读写都经
// `actor.submitControl(store => …)` 排进宿主 actor 自己的串行队列。于是「谁在写这个 Run」
// 的答案没有变——还是那一届持 lease 的宿主；driver 只是坐在它旁边决定下一步做什么。
// 失租之后 actor 队列会直接拒绝，driver 的迟到写因此不可能落盘（host.mjs 的最后一道闸）。
//
// 记账纪律：
//   · attempt 的**开始**经 `store.registerReceipt()`（它自己发 `attempt_started`）；
//   · attempt 的**终态**只经 `store.appendResult()`——raw `appendEvent` 写 attempt_* 会被
//     `E_TERMINAL_STATE_CONFLICT` 硬拒（store.mjs:20），这是设计不是 bug；
//   · `run_finished` 是 Run 级事件、不带 node/attempt，走 `appendEvent` 合法。

import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { digest } from '../tools/canonical.mjs';
import { runRootOf } from './host.mjs';
import { classifyStepOutcome, resolveStepEntry, startProcessStep } from './process-executor.mjs';

/**
 * 起一届 driver。**不阻塞调用方**：`start`/`resume` 的 RPC 应答不该等业务节点跑完。
 *
 * @param retryFailed resume 语义——对当前 attempt 已定为 failed/orphaned 的节点开 fresh attempt
 *                    （H12：换一次执行必换 attempt_id，绝不复用旧 id 续写）。
 */
export function startWorkflowDriver({ repoRoot, runId, actor, retryFailed = false, clock = () => Date.now() }) {
  const runRoot = runRootOf({ repoRoot, runId });
  const nowIso = () => new Date(clock()).toISOString();

  let stopping = false;
  let current = null; // 正在跑的步骤子进程句柄（stop 要够得着它）

  /** 读当前快照——state.json 由 Store 在每次变更后重算，driver 不自己折叠事件。 */
  const readState = () => actor.submitControl(store => store.readState());

  /** 已成功节点的结构化产出：node_id -> structured。跨重启可用，因为它读的是盘上工件。 */
  async function readSucceededOutputs() {
    const outputs = new Map();
    let names;
    try {
      names = await readdir(join(runRoot, 'results'));
    } catch {
      return outputs;
    }
    for (const name of names.filter(file => file.endsWith('.json')).sort()) {
      try {
        const artifact = JSON.parse(await readFile(join(runRoot, 'results', name), 'utf8'));
        if (artifact?.outcome === 'succeeded' && artifact.node_id) {
          outputs.set(artifact.node_id, artifact.structured ?? {});
        }
      } catch { /* 单份工件不可读不该让整条闭环停摆；Store 的完整性校验另有其人 */ }
    }
    return outputs;
  }

  /** `depends_on` 的**传递闭包**——verify 只直接依赖 process-task，但它要复算 prepare 的输入。 */
  function upstreamClosure(run, node) {
    const byId = new Map(run.nodes.map(item => [item.node_id, item]));
    const seen = new Set();
    const pending = [...(node.depends_on ?? [])];
    while (pending.length > 0) {
      const id = pending.pop();
      if (seen.has(id)) continue;
      seen.add(id);
      pending.push(...(byId.get(id)?.depends_on ?? []));
    }
    return [...seen];
  }

  async function recordResult({ nodeId, receiptId, attemptId, outcome, reason, structured }) {
    const payload = structured ?? {};
    await actor.submitControl(store => store.appendResult({
      receipt_id: receiptId,
      node_id: nodeId,
      attempt_id: attemptId,
      executor_kind: 'process',
      outcome,
      reason: reason ?? null,
      at: nowIso(),
      payload_digest: digest(payload),
      structured: payload,
    }));
  }

  async function driveNode({ run, node, firstAttempt }) {
    const profile = (node.executor_profiles ?? []).find(item => item?.kind === 'process');
    // 非 Process 节点（pi-agent / dsh-agent / herdr-agent）由外部代持，本卡不驱动它们。
    if (!profile) return;

    // 落点判定按**解析完符号链接之后**的真实路径做（F-009）：词法上待在仓内、实际指向仓外
    // 的 ref 与 `../` 同途，都是逃逸。
    const resolved = await resolveStepEntry({ repoRoot, ref: profile.ref });
    // ref 在本仓解析不到可执行文件 = 这个执行入口不在这儿。保持 pending、不开 Attempt：
    // Runtime 不该为一个自己启动不了的入口凭空造一次尝试（F-007，批 2 小审已裁保持不收紧）。
    if (resolved.ok && !resolved.runnable) return;

    const attemptId = randomUUID();
    const receiptId = `rcpt-${attemptId}`;
    await actor.submitControl(async (store) => {
      // node_started 在终态之后会被终态守卫拒（LIFECYCLE_KINDS），所以它只属于第一次尝试；
      // 重试的可见性由 registerReceipt 发的 attempt_started 承担。
      if (firstAttempt) await store.appendEvent({ kind: 'node_started', at: nowIso(), node_id: node.node_id });
      const ack = await store.registerReceipt({
        receipt_id: receiptId, attempt_id: attemptId, node_id: node.node_id, at: nowIso(),
      });
      if (ack?.ok === false) throw new Error(`${ack.reason ?? 'E_REQUEST_CONFLICT'}:receipt-${receiptId}`);
    });

    // 逃逸的 ref（词法上跳或符号链接指出仓外）是 Run 文档本身有问题：必须响亮地失败成一个
    // 可见终态，不能静默跳过——也绝不能先跑一把再说。
    if (!resolved.ok) {
      await recordResult({
        nodeId: node.node_id, receiptId, attemptId, outcome: 'failed', reason: resolved.reason,
        structured: { executor_ref: profile.ref, detail: resolved.detail },
      });
      return;
    }

    const outputs = await readSucceededOutputs();
    const context = {
      run_id: runId,
      workflow_name: run.workflow_name,
      node_id: node.node_id,
      attempt_id: attemptId,
      // labels **原样转交**，driver 不读也不筛（`relay.run/v2` 的 labels 是不透明标签，
      // 「Relay 只存不读」）。转交不等于解释：上层的私有参数只能以 label 搭车，而步骤脚本
      // 是业务层——由它认自己的 key。少了这一条，一份 run 文档就没法自带任何执行参数，
      // 参数只能从环境变量绕进来，run.json 也就不再是可复现的完整真相。
      labels: Array.isArray(run.labels) ? run.labels : [],
      upstream: Object.fromEntries(upstreamClosure(run, node).map(id => [id, outputs.get(id) ?? null])),
    };

    const handle = startProcessStep({ scriptPath: resolved.path, cwd: repoRoot, context });
    current = handle;
    if (stopping) handle.kill(); // stop 与 spawn 撞在一起时不留活口
    let raw;
    try {
      raw = await handle.done;
    } finally {
      current = null;
    }
    const verdict = classifyStepOutcome(raw);
    await recordResult({ nodeId: node.node_id, receiptId, attemptId, ...verdict });
  }

  /**
   * Run 级收口。判据是「**存在**必经节点且它们全部 succeeded」——
   * 少了前半句，一份零 required 节点的 Run 会因为 `[].every()` 恒真而被立刻标完成。
   */
  async function finishIfComplete(run) {
    await actor.submitControl(async (store) => {
      if (store.events.some(event => event.kind === 'run_finished')) return;
      const required = run.nodes.filter(node => node.required === true);
      if (required.length === 0) return;
      const state = await store.readState();
      const statusOf = id => state.node_states.find(item => item.node_id === id)?.status;
      if (!required.every(node => statusOf(node.node_id) === 'succeeded')) return;
      await store.appendEvent({ kind: 'run_finished', at: nowIso() });
    });
  }

  async function drive() {
    const run = JSON.parse(await readFile(join(runRoot, 'run.json'), 'utf8'));
    // 一届 driver 里每个节点最多驱动一次：失败不原地自旋，重试由下一次 resume 显式发起。
    const driven = new Set();
    while (!stopping) {
      const state = await readState();
      const statusOf = id => state.node_states.find(item => item.node_id === id)?.status ?? 'pending';
      const attemptCountOf = id => state.node_states.find(item => item.node_id === id)?.attempt_count ?? null;
      const node = run.nodes.find((item) => {
        if (driven.has(item.node_id)) return false;
        const status = statusOf(item.node_id);
        const eligible = status === 'pending'
          || (retryFailed && (status === 'failed' || status === 'orphaned'));
        if (!eligible) return false;
        return (item.depends_on ?? []).every(dep => statusOf(dep) === 'succeeded');
      });
      if (!node) break;
      driven.add(node.node_id);
      await driveNode({ run, node, firstAttempt: attemptCountOf(node.node_id) === null });
    }
    await finishIfComplete(run);
  }

  // driver 是后台推进器：它的失败（失租、Run 根被删、工件损坏）不该炸穿 RPC 调用栈，
  // 也不该变成未处理拒绝——收进 done 的返回值，由调用方按需读取。
  const done = drive().then(() => ({ ok: true }), error => ({ ok: false, error }));

  return {
    done,
    /** 请求停止：先杀在跑的子进程（它会被记成 E_EXECUTOR_KILLED），再等本届收口。 */
    async stop() {
      stopping = true;
      current?.kill();
      return done;
    },
  };
}
