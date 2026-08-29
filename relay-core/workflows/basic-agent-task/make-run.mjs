// make-run.mjs — 由 run.template.json 生成一份可直接 `relay start` 的 run 文档。
//
// 存在的理由只有一个：模板里的 `ref` 是**业务仓相对路径**，而 Workflow 未必躺在业务仓根下
// （在 dh-relay 仓里它在 `relay-core/` 下），所以生成时得按实际位置补前缀。把这件事写成
// README 里的一行 `node -e '…'`，跨 bash / PowerShell 的引号与换行转义会各挂各的——
// 断连实录当场调命令是最不该发生的事。
//
// 用法（cwd = 业务仓根）：
//   node relay-core/workflows/basic-agent-task/make-run.mjs --out run-slow.json --delay-ms 35000
//
//   --out        输出文件路径（默认 run-basic-agent-task.json）
//   --delay-ms   process-task 的额外耗时，供慢跑实录用（默认 0 = 不加延时）
//   --prefix     Workflow 目录相对业务仓根的前缀；默认按本文件位置自动推导
//
// 生成的 run_id 是模板里的占位串——Runtime 会按仓级序号重新发号覆盖它，不必手改。

import { readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DELAY_LABEL = 'basic-agent-task.delay_ms';
const here = fileURLToPath(new URL('.', import.meta.url));
const templatePath = fileURLToPath(new URL('./run.template.json', import.meta.url));

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) throw new Error(`未知参数：${token}`);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) throw new Error(`--${token.slice(2)} 需要一个值`);
    options[token.slice(2)] = value;
    index += 1;
  }
  return options;
}

/**
 * 默认前缀 = 本 Workflow 目录相对 cwd（业务仓根）的位置。
 * 一律转成正斜杠：`ref` 是 locator，Windows 反斜杠会被 locator 守卫按绝对路径形态拒掉。
 */
function defaultPrefix() {
  const rel = relative(resolve(process.cwd()), resolve(here, '..', '..')).split('\\').join('/');
  return rel === '' ? '' : `${rel}/`;
}

const options = parseArgs(process.argv.slice(2));
const outPath = options.out ?? 'run-basic-agent-task.json';
const delayMs = Number(options['delay-ms'] ?? 0);
if (!Number.isFinite(delayMs) || delayMs < 0) throw new Error(`--delay-ms 需要非负毫秒数：${options['delay-ms']}`);
const prefix = options.prefix ?? defaultPrefix();

const doc = JSON.parse(readFileSync(templatePath, 'utf8'));
doc.nodes = doc.nodes.map(node => ({
  ...node,
  executor_profiles: node.executor_profiles.map(profile => ({ ...profile, ref: `${prefix}${profile.ref}` })),
}));
if (delayMs > 0) {
  doc.summary = `basic-agent-task 慢跑 ${delayMs}ms（断连/重连实录用）`;
  // labels 的规范性约束：按 key 升序、key 唯一（relay.run/v2 的 labels 字段说明）。这里只有一条。
  doc.labels = [{ key: DELAY_LABEL, value: String(delayMs) }];
}
writeFileSync(outPath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');

const refs = doc.nodes.map(node => node.executor_profiles[0].ref);
process.stdout.write(`wrote ${outPath}\n  delay_ms=${delayMs}\n  refs=\n${refs.map(ref => `    ${ref}\n`).join('')}`);
