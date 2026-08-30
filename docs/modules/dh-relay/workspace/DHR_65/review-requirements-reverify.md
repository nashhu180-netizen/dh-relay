<!-- dh:v1 -->
# DHR_65 · 需求方向 fresh reverify

> 复核者：独立 fresh requirements reviewer（只读）；日期：2026-08-30。
> 对比：`c52feda..2c32180`；对照：DHR_65 DevPlan §3.2、brief、review、progress、design/12 P6-RI-A5。
> 未修改生产代码、测试、plan、progress、review 或其他既有文件；本报告是本轮唯一写入。

## 结论

**PASS（无 P0/P1/P2/P3 新发现）**。

初审 P1/P2 已被针对性整改闭合：fixture 现覆盖正式五 Profile 的 ID/字段形状/fallback 图；loader 对五条 alias 与五条 config 负例逐项拒绝；driver 对 alias/config 各有确定性完成屏障及启动前零副作用断言。mutation 账本、范围卫生与 DHR_35 边界均保持诚实。

## P0

无。

## P1

无。初审 P1（3/5 fixture）已闭合：`relay-core/test/dhr65-registry-loader.test.mjs:37-59` 现包含 `herdr.codex.main`、`herdr.codex.ninth`、`herdr.claude.main`、`herdr.claude.grok`、`herdr.claude.account5` 五条，并保留 Codex main 空 fallback、Codex ninth → Codex main fallback 及各条目的可选字段形状；`profile-registry.mjs` 仍只做 `resolveAlias:false→true`。

## P2

无。初审 P2（driver config/零副作用与异步终态）已闭合：

- `:68-85` 对五个 Profile 分别注入坏 alias 与坏 config，loader 逐项得到 `E_UNRESOLVED_ALIAS` / `E_UNRESOLVED_CONFIG`。
- `:87-158` 对 alias/config 各跑一条完整五 Profile registry 的 driver 场景，等待 `driver.done`；timeout 仅保险且在 settled 时清理；直接计数 Agent/pane，并检查 Attempt 终态事件、`receipts`、`results` 均为空。
- fresh 运行 `node --test --test-concurrency=1 relay-core/test/dhr65-registry-loader.test.mjs`：5/5 pass、exit 0（E-6513）。

默认回归状态核验：B-26 后 `relay-core/package.json` 的显式 `test` script 已包含 `test/dhr65-registry-loader.test.mjs` 且只增加这一项，未改并发、audit 或 validate 脚本；package 解析确认出现次数为 1。实际 `npm test` 输出已展开该文件，但观察到既有 DHR_33/DHR_61 失败，至观察窗口未取得完整汇总/终态，不能作为 green；progress E-6514 明确记为“未得终态、不得记作绿色”，review.md Confidence Challenge 亦未将其写绿。因此这不是未记录的 P2 回归通过声明。

## P3

无新增。`git diff --check c52feda 2c32180` 通过；`git diff --name-only c52feda 2c32180 -- relay-core` 仅为 `relay-core/package.json` 与 DHR_65 专属测试，B-26 的实现范围确实只有向既有显式 test list 接入该文件。其余差异为 DHR_65 工作区/DevPlan 的授权与证据记录，未见 driver、其他 runtime、contracts/store/rpc/service/CLI、用户级 registry/config 或凭据改动。

E-6515 的 `profile-registry.mjs` `resolveAlias:true→false` mutation 已记录为 alias loader 与 driver 断言失败，还原后 5/5 pass；当前 source/blob 与 2c32180 一致。E-6516 的 profiles 14/14、audit 0 errors、`dh dh-relay` 0 failures 及 diff hygiene 证据无反证。

## 完成条件逐条裁决

| # | 条件 | 复核结论 | 证据 |
|---|---|---|---|
| 1 | 完整正式 registry 的结构等价副本；任一已登记 Profile 的坏 alias/config 在 loader/driver 启动前拒绝；零配置正文/凭据 | **满足** | 五 Profile fixture；E-6513、E-6515、E-6508 |
| 2 | 好 registry 可解析 `herdr.codex.main`、`herdr.claude.main`；坏 registry 不创建 Attempt/Agent/pane/Result | **满足** | E-6513：好路径、alias/config driver 零副作用及 receipts/results 空目录 |
| 3 | loader alias-resolve 实现级 mutation 红、还原绿 | **满足** | E-6515：mutant 断言失败，还原后 5/5 pass |

## DHR_35 边界

本次提交未启动真实 Agent、未执行 Windows 真实闭环；DevPlan/brief/review/progress 均保留 DHR_35 blocked，且 P6-RI-A5 仍需 DHR_63 与 DHR_65 各自机器证及复核共同闭合。本 reverify 不解除 DHR_35，不代签 verify。

REQUIREMENTS-REVERIFY-PASS
