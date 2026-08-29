// settled-state.mjs — 读一份**已经追上事件账**的 state.json。
//
// 为什么需要它：Store 的写序是「先 append `events.jsonl`、后 writeAtomic `state.json`」
// （store.mjs 的 emitEvent → persistState）。测试若靠轮询事件账判「这一步做完了」，紧接着
// 读快照就可能读到上一条事件时的旧快照。机器闲时这个窗口只有几毫秒，全量并发跑起来就会
// 现形——DHR_31 批 4 全量首次就撞红了一条（期望 run_status=failed，实得 running）。
//
// 等的条件是**不变量**（快照签名 === 事件账重放出来的签名），而不是「等出我要断言的那个
// 值」。所以后续断言仍然是真断言：实现错了会等到超时，而不是等到它变对。

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { replayRun } from '../../store/state.mjs';
import { readEventLog } from '../../store/store.mjs';

export async function settledState(runRoot, { timeoutMs = 30_000 } = {}) {
  const run = JSON.parse(await readFile(join(runRoot, 'run.json'), 'utf8'));
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const events = await readEventLog({ root: runRoot, run });
    const state = JSON.parse(await readFile(join(runRoot, 'state.json'), 'utf8'));
    if (state.state_signature === replayRun({ run, events }).state_signature) return state;
    if (Date.now() > deadline) {
      throw new Error(`settledState: ${runRoot} 的 state.json 在 ${timeoutMs}ms 内没有追上事件账`);
    }
    await new Promise(resolve => setTimeout(resolve, 25));
  }
}
