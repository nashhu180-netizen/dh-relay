<!-- dh:v1 -->
# DHR_65 · 代码轮 1 · fresh 复核

> 复核者：独立 fresh、只读代码 reviewer；日期：2026-08-30。
>
> 审查对象：`wt/DHR_65` 的 `c52feda` 相对 `a9b39f0`。
>
> 范围：允许路径内的 loader、DHR_65 专属测试、driver 启动前零副作用断言、错误语义、mutation 与密钥/范围卫生；未修改生产代码、测试、progress、review 或其他文件。

## 结论

**changes-requested（P1×1、P2×1；P0=0）**。

`profile-registry.mjs:15` 将 loader 的 `resolveAlias` 打开，方向与 formal validator 一致；当前定向测试 4/4、既有 `profiles.test.mjs` 14/14，`git diff --check` 通过，提交改动路径均在 DHR_65 允许集合内。实现级 mutation 的记录（`true→false` 后 alias/driver 断言失败，再还原为 `true`）与代码差异相符。

但当前新测试没有满足“完整正式 registry 的任一已登记 Profile”这一核心验收证据，且 driver 的零副作用探针存在时序与观测缺口；在补齐前不能把 P6-RI-A5 runtime 证据标为完整通过。

## P0

无。

## P1（阻断）

### P1-1 · DHR_65 fixture 不是完整正式 registry，遗漏已登记 Profile

- **位置**：`relay-core/test/dhr65-registry-loader.test.mjs:37-44` 的 `completeRegistry()`；坏条目循环为 `:68-83`。
- **事实**：正式脱敏 fixture `relay-core/profiles/fixtures/golden-registry.json:2-60` 有 5 个 Profile：`herdr.codex.main`、`herdr.codex.ninth`、`herdr.claude.main`、`herdr.claude.grok`、`herdr.claude.account5`。DHR_65 测试只构造前 3 个，未包含后两个，并且把 `codex.main` 的 fallback 关系改为空、未保留 `codex.ninth` 的 fallback 关系；这不是完整结构等价副本。
- **影响**：`bad alias/config` 负例只遍历这 3 个条目，未证明遗漏的两个已登记 Profile 出现坏 alias/config 时 loader 会拒绝。因此当前 4/4 只能证明局部 fixture，不能满足 DevPlan DHR_65 完成条件 1 / P6-RI-A5 的“任一已登记项整体 fail-closed”。
- **修复要求**：在不落配置正文或凭据的前提下，构造与正式 registry ID、字段闭集及 fallback 关系等价的完整 5 Profile 脱敏副本；对每个条目分别注入坏 alias 与坏 config，并保留全量 registry 断言。

## P2

### P2-1 · driver 零副作用测试以固定 25ms 取样，且没有直接观测 Agent/Result

- **位置**：`relay-core/test/dhr65-registry-loader.test.mjs:106-114`。
- **事实**：测试启动后台 driver 后只 `setTimeout(25)`，没有等待 `driver.done`、`driver.finished` 或带超时的确定性 barrier。若 loader/Store 的异步阶段尚未运行，坏 registry 的旧 fail-open 实现也可能在断言前尚未创建 Attempt，从而假通过；当前实现中 loader 的同步 alias 探测耗时较长，不能把本机一次 4/4 当作时序保证。
- **事实**：断言只检查 `fake.paneSplits` 和两类终态 attempt event；fake 没有 `agentStart` 计数，测试也没有检查 Result 文件/目录或 Receipt 文件。`paneSplit=0` 可因当前 `launchHerdrAgent` 的调用顺序间接推断未启动 Agent，但不构成对合同四类副作用（Attempt、Agent、pane、Result）的逐项观测。
- **修复要求**：用可观测计数/文件快照覆盖 `agentStart`、pane、Attempt/Receipt、Result，并在坏 registry 分支等待 driver 的确定性完成（或使用带明确超时的 `Promise.race`；超时应失败而不是继续断言），使旧 fail-open mutation 必然暴露。

## P3

无新增 P3。

## 已核对通过项

- `relay-core/runtime/executors/herdr/profile-registry.mjs:15` 的改动仅为 `resolveAlias:false→true`；`loadExecutorProfiles` 原有 `E_BAD_VALUE:PROFILE_REGISTRY` reason 与 detail 组织方式未被改变。当前 alias/config 负例均得到对应 `E_UNRESOLVED_ALIAS` / `E_UNRESOLVED_CONFIG` detail。
- `node --test test/dhr65-registry-loader.test.mjs`：4/4 pass，exit 0。
- `node --test test/profiles.test.mjs`：14/14 pass，exit 0。
- `git diff --check`：pass；`git diff --name-status a9b39f0 c52feda` 仅含 DHR_65 workspace、`profile-registry.mjs` 与新测试，未发现越界生产路径或凭据值。diff 扫描唯一 40+ hex 命中是 progress 中登记的 Git 内容 hash，非凭据。
- `progress.md` 的 E-6505 记录了 loader 分支 `true→false→true` mutation：mutant 下 alias/driver 断言失败，还原后 4/4；该记录与审查对象的前后代码值一致。默认 `npm test` 未取得完整终态，未作为本轮绿色依据。

本报告只记录事实与级别，不代主控做验收裁决，不代签 verify，不修改任何越界文件。
