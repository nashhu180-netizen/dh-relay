// process-task — 对 prepare 的输出做一次**确定性**变换并计数。
//
// 「确定性」是这一步的全部意义：verify 节点要在不重跑本步的前提下独立复算同一份结论，
// 所以变换本身不许出现时间、随机数、环境变量或任何外部状态——否则机器校验就退化成
// 「跑没跑过」。下面那个可配置延时**不进入任何被校验的字段**，它只影响这一步耗多久。

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

/**
 * 延时旋钮（DHR_31 批 3 · 供断连/重连实录用）：从 run 文档的 labels 里取毫秒数。
 *
 * 为什么走 label 而不是环境变量：`relay.run/v2` 里 labels 是**唯一**的不透明搭车位，
 * Relay 只存不读、driver 只原样转交，认这个 key 的是本脚本（业务层）。好处是一份
 * run.json 自带全部执行参数——换台机器、换个终端、隔几天重放，跑出来的还是同一条 Run；
 * 环境变量做不到这点：service 是常驻进程，变量在**它**起来那一刻就定死了，后来的
 * `relay start` 改不动它，实录里「我明明设了 30 秒」和「它 1 秒就跑完了」会同时为真。
 */
const DELAY_LABEL = 'basic-agent-task.delay_ms';
const DELAY_MAX_MS = 10 * 60 * 1000; // 上限 10 分钟：手滑多打几个零不至于把 Run 挂死

function delayFromLabels(labels) {
  const entry = (Array.isArray(labels) ? labels : []).find(item => item?.key === DELAY_LABEL);
  if (entry === undefined) return 0;
  const parsed = Number(entry.value);
  // 认得这个 key 就得认真对待它的值：写坏了就失败，绝不当 0 静默跑完——
  // 那会让「延时没生效」伪装成「跑得真快」。
  if (!Number.isFinite(parsed) || parsed < 0) {
    process.stderr.write(`process-task: label ${DELAY_LABEL} 不是非负毫秒数：${JSON.stringify(entry.value)}\n`);
    process.exit(2);
  }
  return Math.min(Math.trunc(parsed), DELAY_MAX_MS);
}

function readContext() {
  try {
    const text = readFileSync(0, 'utf8').trim();
    return text === '' ? {} : JSON.parse(text);
  } catch {
    return {};
  }
}

const context = readContext();
const items = context.upstream?.prepare?.items;

if (!Array.isArray(items) || items.length === 0) {
  process.stderr.write('process-task: 上游 prepare 未提供 items\n');
  process.exit(2);
}

const processed = items.map((item, index) => ({
  index,
  token: String(item).toUpperCase(),
  length: String(item).length,
}));

const delayMs = delayFromLabels(context.labels);
if (delayMs > 0) await new Promise(done => setTimeout(done, delayMs));

process.stdout.write(JSON.stringify({
  workflow: 'relay/basic-agent-task@1',
  node: 'process-task',
  processed,
  count: processed.length,
  total_length: processed.reduce((sum, entry) => sum + entry.length, 0),
  checksum: createHash('sha256').update(JSON.stringify(processed), 'utf8').digest('hex'),
  // 留痕：实录里要能证明「这条 Run 确实被要求慢跑」，而不是靠人记得自己设过。
  delay_ms: delayMs,
}));
