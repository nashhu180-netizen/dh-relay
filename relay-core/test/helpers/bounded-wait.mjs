// bounded-wait.mjs — 有界等待：**等目标事件，不等断言值**。
//
// 为什么需要它（DHR_71 · 承接 DHR_35 `F-3520`）：定向回归里的等待原来是「轮询到超时就抛
// `timeout waiting for X`」，超时预算 1s / 10s 全是拍出来的，超时输出只有一句 label——
// 于是同一份代码在不同负载下时红时绿，而红了也说不出「它到底停在哪一步」。本文件把每个
// 等待钉成三件事：**目标事件是什么 · 上限是多少 · 超限时把现场打出来**。
//
// 口径与 `settled-state.mjs` 同源，那份注释是这条纪律的正面样板：等的必须是**不变量或目标
// 事件**（「这一步做完了」），而不是「等出我要断言的那个值」。所以后面的断言仍然是真断言：
// 实现错了会等到超时并 fail，而不是等到它变对。
//
// 反面用法（本文件不做、也不许绕过去做）：
//   · 把 check 写成断言本身（`events.at(-1).reason === 'X'`）——那是在等实现变对；
//   · 上限拍脑袋。上限必须由**生产侧的对应上限**推出来（herdrReadyTimeoutMs / doneTimeoutMs /
//     HERDR_START_TIMEOUT_MS …），并把依据写进 workspace 的 progress.md。

import { createHash } from 'node:crypto';

/**
 * 轮询直到 `check()` 为真；超 `timeoutMs` 抛错并附上 `dump()` 的现场。
 *
 * @param {() => (boolean | Promise<boolean>)} check 目标事件是否已发生
 * @param {{ label: string, timeoutMs: number, pollMs?: number, dump?: () => (string | Promise<string>) }} options
 */
export async function untilEvent(check, { label, timeoutMs, pollMs = 25, dump } = {}) {
  const start = Date.now();
  const deadline = start + timeoutMs;
  for (;;) {
    if (await check()) return true;
    if (Date.now() > deadline) {
      const scene = dump ? await safeDump(dump) : '';
      throw new Error(`bounded-wait: ${label} 在 ${timeoutMs}ms 内未发生`
        + `（实测等了 ${Date.now() - start}ms）\n${scene}`);
    }
    await new Promise(resolve => setTimeout(resolve, pollMs));
  }
}

/**
 * 给一个已经在飞的 promise 套上限。定时器 `unref()` 且在 promise 先落定时 `clearTimeout`
 * ——否则这个「防挂死」的工具自己就成了让进程收不了口的那根 timer。
 *
 * @template T
 * @param {Promise<T>} promise
 * @param {{ label: string, timeoutMs: number, dump?: () => (string | Promise<string>) }} options
 * @returns {Promise<T>}
 */
export async function withDeadline(promise, { label, timeoutMs, dump } = {}) {
  const start = Date.now();
  let timer;
  const deadline = new Promise((_resolve, reject) => {
    timer = setTimeout(() => {
      void (async () => {
        const scene = dump ? await safeDump(dump) : '';
        reject(new Error(`bounded-wait: ${label} 在 ${timeoutMs}ms 内未落定`
          + `（实测等了 ${Date.now() - start}ms）\n${scene}`));
      })();
    }, timeoutMs);
    timer.unref?.();
  });
  try {
    return await Promise.race([promise, deadline]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 超限时打印的现场。三样东西缺一不可：**事件 kind 序列**（driver 走到哪了）、**派生状态**
 * （事件先入内存、state.json 稍后收敛，两边都要看）、**fake 宿主的计数器**（有没有真的在
 * 轮询、有没有发指令、有没有关 pane）。
 *
 * @param {{ store?: object, fake?: object, t0?: number, extra?: string }} scene
 */
export async function dumpDriverScene({ store, fake, t0, extra } = {}) {
  const lines = [];
  if (typeof t0 === 'number') lines.push(`  elapsed_ms=${Date.now() - t0}`);
  if (store) {
    const events = store.events ?? [];
    lines.push(`  events(${events.length})=${JSON.stringify(events.map(
      event => event.kind + (event.reason ? `:${event.reason}` : '')
        + (event.observation_status ? `(${event.observation_status})` : '')))}`);
    try {
      const state = await store.readState();
      lines.push(`  node_states=${JSON.stringify((state.node_states ?? []).map(
        node => ({ node_id: node.node_id, status: node.status, attempt_count: node.attempt_count })))}`);
      lines.push(`  run_status=${state.run_status}`);
    } catch (error) {
      lines.push(`  node_states=<readState failed: ${String(error?.message ?? error)}>`);
    }
  }
  if (fake) {
    lines.push(`  fake: agentGets=${fake.agentGets} paneGets=${fake.paneGets} agentReads=${fake.agentReads}`
      + ` paneSplits=${fake.paneSplits} paneKills=${fake.paneKills} sent=${fake.sent?.length ?? 0}`);
    const lastSent = fake.sent?.at(-1);
    if (lastSent) lines.push(`  fake.sent[-1]=${redactIds(JSON.stringify(lastSent)).slice(0, 240)}`);
  }
  if (extra) lines.push(`  ${extra}`);
  return lines.join('\n');
}

/**
 * 超限现场是要进 `workspace/**\/evidence/` 的，所以**在打印这一步**就把 Receipt / Attempt /
 * agent 名里的原始 ID 换成关联符——不能事后靠扫描兜底（AGENTS.md 宪章 #6）。
 *
 * Receipt ID 不是普通标识而是**运行关联能力**（`relay submit-result --receipt-id <id>` 就是
 * 提交入口），design/12 §2 明令它不得进公开证据；DHR_35 的 `F-3521`/`F-3522` 就是漏了这条，
 * 代价是一次分支历史重写。换法沿用 F-3521 的口径：同一个 ID 恒定映射到 `~<sha256 前 12>`，
 * 于是「Receipt ↔ Attempt ↔ Result 对得上」这件事仍然可核，值本身却不再可用。
 */
export function redactIds(text) {
  return String(text).replace(/[0-9a-f]{8}(?:-[0-9a-f]{2,12}){1,4}/gi,
    match => `~${createHash('sha256').update(match).digest('hex').slice(0, 12)}`);
}

async function safeDump(dump) {
  try {
    return await dump();
  } catch (error) {
    return `  <dump failed: ${String(error?.message ?? error)}>`;
  }
}
