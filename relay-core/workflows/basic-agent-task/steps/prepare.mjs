// prepare — relay/basic-agent-task@1 的第一个节点：产出**确定性**输入清单。
//
// 步骤脚本合同（见 ../README.md）：
//   stdin  一个 JSON 上下文对象；stdout 一个 JSON 对象（成为 relay.result/v2 的 structured）；
//   exit 0 = 成功，非 0 = 该 Attempt 失败。
// 零依赖：只用 Node 标准库——步骤脚本会被复制进业务仓，不该拖 relay-core 的实现细节。

import { readFileSync } from 'node:fs';

const ITEMS = ['alpha', 'bravo', 'charlie', 'delta'];

function readContext() {
  try {
    const text = readFileSync(0, 'utf8').trim();
    return text === '' ? {} : JSON.parse(text);
  } catch {
    return {};
  }
}

const context = readContext();

process.stdout.write(JSON.stringify({
  workflow: 'relay/basic-agent-task@1',
  node: 'prepare',
  run_id: context.run_id ?? null,
  items: ITEMS,
  item_count: ITEMS.length,
}));
