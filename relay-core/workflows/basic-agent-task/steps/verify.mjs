// verify — 机器校验：拿 prepare 的原始输入独立复算 process-task 的结论。
//
// 它**不**信任 process-task 说的「我成了」，而是逐条重算：条数、大小写变换、长度、
// 总长、checksum。任一条不符即以非 0 退出，让 Runtime 把这个 Attempt 记成 failed。
// 「exit 0 就算通过」的写法能让整条闭环在结果全错时依然全绿——那就没有闭环可言。

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

function readContext() {
  try {
    const text = readFileSync(0, 'utf8').trim();
    return text === '' ? {} : JSON.parse(text);
  } catch {
    return {};
  }
}

const context = readContext();
const prepared = context.upstream?.prepare;
const outcome = context.upstream?.['process-task'];

const checks = [];
const failures = [];
const check = (name, ok) => {
  checks.push(name);
  if (!ok) failures.push(name);
};

check('prepare-present', Array.isArray(prepared?.items) && prepared.items.length > 0);
check('process-present', Array.isArray(outcome?.processed));

if (failures.length === 0) {
  const items = prepared.items.map(item => String(item));
  check('count-matches-input', outcome.count === items.length && outcome.processed.length === items.length);
  check('tokens-uppercased', items.every((item, index) => outcome.processed[index]?.token === item.toUpperCase()));
  check('lengths-match', items.every((item, index) => outcome.processed[index]?.length === item.length));
  check('total-length-matches', outcome.total_length === items.reduce((sum, item) => sum + item.length, 0));
  check('checksum-recomputes',
    outcome.checksum === createHash('sha256').update(JSON.stringify(outcome.processed), 'utf8').digest('hex'));
}

if (failures.length > 0) {
  process.stderr.write(`verify: 未通过的断言 = ${failures.join(', ')}\n`);
  process.exit(1);
}

process.stdout.write(JSON.stringify({
  workflow: 'relay/basic-agent-task@1',
  node: 'verify',
  verified: true,
  checks,
  checked_count: checks.length,
}));
