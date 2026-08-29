#!/usr/bin/env node
// snapshot-main.mjs — 一次性把某个仓的 Read Model 快照吐成 JSON，然后退出。
//
// 为什么需要这么个东西（DHR_31 批 5 · F-019，用户 2026-08-29 裁决走此路）：
// 树外的 DSH Host 插件有一条自己的**安装拓扑契约**——不许裸说明符、不许 `require`、
// 也不许**计算出来的动态 `import()`**（理由：光读源码核不出它指向哪；那条契约是一次
// `ERR_MODULE_NOT_FOUND` 启动失败逼出来的）。于是插件没法在自己进程里 import 本仓的
// Bridge。折中是：**本仓提供一个进程入口**，插件按绝对路径 `spawn` 它、读它的 stdout。
// `spawn` 不经过模块解析，两边的契约都不必让步。
//
// 边界，三条，都很硬：
//   1. **只做取数转发**。它吐的是原样的 `relay.client-read-model/v1`——不投影、不改名、
//      不补字段。任何「把它整理成某个客户端爱吃的形状」的念头都属于**客户端侧**的事，
//      归调用方（面板那边有 live-store.mjs 做投影）。协议层对客户端中立，这里一旦开始
//      认识某个上层模型，`contracts/` 与 `tools/` 的中立性就名存实亡了（README 硬约束 1）。
//   2. **归 `adapters/`，不进 `runtime/`**。它是客户端侧的取数工具，不是 Runtime 的一部分；
//      放错目录会让 design/07 §4 那条「谁是控制面」的分界线糊掉。
//   3. **只读**。它只调 `listRuns` / `inspect`，不碰 `start` / `control`，也不写任何东西。
//
// 用法：
//   node adapters/dsh-bridge/snapshot-main.mjs --repo <业务仓根> [--credential-root <dir>]
// 退出码：0 = stdout 是一份完整 JSON；非 0 = stderr 有原因，stdout 不可信。

import { connectDshBridge } from './index.mjs';

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) throw new Error(`unexpected argument: ${token}`);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) throw new Error(`--${token.slice(2)} needs a value`);
    options[token.slice(2)] = value;
    index += 1;
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = options.repo;
  if (!repoRoot) throw new Error('usage: snapshot-main.mjs --repo <repoRoot> [--credential-root <dir>]');

  const bridge = await connectDshBridge({
    repoRoot,
    credentialRoot: options['credential-root'],
  });
  try {
    const list = await bridge.listRuns({ includeLegacy: false });
    const items = Array.isArray(list?.items) ? list.items : [];
    const details = {};
    for (const item of items) {
      try {
        const view = await bridge.inspect(item.run_id);
        // legacy / 孤儿 Run 的 detail 合法地是 null——原样透传，不代它编一个。
        details[item.run_id] = view?.detail ?? null;
      } catch (error) {
        // 单条读不到不该让整份快照失败；把稳定 reason 原样带出去，调用方自己决定怎么显示。
        details[item.run_id] = null;
        process.stderr.write(`inspect ${item.run_id} failed: ${error?.data?.reason ?? error?.message ?? error}\n`);
      }
    }
    process.stdout.write(`${JSON.stringify({ list, details })}\n`);
  } finally {
    bridge.close?.();
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    process.stderr.write(`${error?.data?.reason ?? error?.message ?? error}\n`);
    process.exit(1);
  },
);
