<!-- dh:v1 -->
# DHR_65 · 需求方向 fresh 复核

> 复核者：fresh requirements reviewer（只读）；日期：2026-08-30。审查对象：`c52feda` 相对 `a9b39f0`。
> 未修改生产代码、测试、progress、review 或其他文件；本报告是本轮唯一写入。

## 结论

**changes-requested（P1×1，P2×1）**。

提交将 loader 的 `validateProfiles` 调用切换为 `resolveAlias:true`，且定向测试在当前树 fresh 运行得到 4/4 pass；但不能据此通过 DHR_65：专属测试的 registry 不是完整正式 registry 的结构等价副本，遗漏了已登记 Profile，因此“任一已登记 Profile 的坏 alias/config”没有被证明。

## P0

无。

## P1（阻断）

### P1-1 · 测试 registry 不是完整正式 registry，遗漏已登记条目

- **位置**：`relay-core/test/dhr65-registry-loader.test.mjs:37-45,65,68-83`。
- **事实**：`completeRegistry()` 只构造 `herdr.codex.main`、`herdr.claude.main`、`herdr.codex.ninth` 三项，并把长度 3 写成断言；alias/config 负例循环也只遍历这三项。
- **对照**：DHR_63 的受控复核记录 `workspace/DHR_63/review-code1-codex.md:46` 记录正式 registry profile 数量为 5；仓内 `relay-core/profiles/fixtures/golden-registry.json` 也保留五个结构条目，包括 `herdr.claude.grok`、`herdr.claude.account5`。DHR_65 DevPlan §3.2 / design/12 P6-RI-A5 要求完整正式 registry 的任一已登记项，不得用局部 registry 绕过。
- **影响**：当前测试即使通过，也可能在被遗漏的两个条目存在坏 alias/config 时仍为绿；E-6503、review.md 中“完整结构等价三 Profile”“完成条件 1/2 是”的表述超出证据。不能闭合 P6-RI-A5 runtime 部分或本卡完成条件 1。
- **要求**：改为包含正式 registry 全部五个已登记 Profile 的脱敏结构等价 fixture，保持当前 live fallback 语义（Codex main 空 fallback）及各条目的可选字段形状；alias/config 负例遍历全部条目，并重新取得红/绿与启动前零副作用证据。不得读取或记录用户 registry/config 正文或凭据。

## P2

### P2-1 · driver 集成零副作用只直接覆盖坏 alias

- **位置**：`relay-core/test/dhr65-registry-loader.test.mjs:87-114`。
- **事实**：driver 场景只将 `registry.profiles[1].command_alias` 变为坏值；坏 config 仅在 loader 单元场景覆盖，没有对应的 `startWorkflowDriver` + 坏 config + Attempt/Agent/pane/Result 全零断言。
- **判断**：driver 当前实现确实在 `workflow-driver.mjs:201-206` 先调用 loader，故没有看到新增越界代码；但按 DHR_65 完成条件“坏 alias/config 在 driver 创建副作用前拒绝”，缺少坏 config 的 driver 路径机器证。补一条同样的集成负例或明确记录等价覆盖关系后再收口。

## P3

- `c52feda` 的 tracked 差异路径仅为 DHR_65 工作区、`profile-registry.mjs` 和新专属测试，符合 DevPlan 允许路径；loader 改动仅为 `resolveAlias:false→true`，未见 driver/其他 runtime/合同越界。
- fresh 执行 `node --test relay-core/test/dhr65-registry-loader.test.mjs`：4 pass、0 fail、exit 0；`git diff --check a9b39f0 c52feda`：exit 0。
- mutation 账本 E-6505 的 `true→false→true` 与 hash 可由提交内容对应（baseline blob `c7aba8a4a9af89834d37172644fe64bb57e7da3d`，提交 blob `75f0a0f03d726949cbe3087369b73b5d32f1dcc0`）；本轮未改动实现来重复施加 mutation。
- 工件中只见 synthetic 临时 config 内容/路径，未见用户 registry/config 正文或凭据；没有把 DHR_65 表述为 DHR_35 真实 Agent/Windows 闭环，DHR_35 仍应保持 blocked。
- E-6506 的 `npm test` 未取得完整终态，施工账本已诚实记为“未得终态”，不能作为本卡绿色依据；这不是本轮新增 P1。

## 完成条件逐条裁决

| # | 条件 | 事实结论 |
|---|---|---|
| 1 | 完整结构等价 registry；任一已登记 Profile 的坏 alias/config 在 loader/driver 启动前拒绝；零配置正文/凭据 | **未满足/不可证**：fixture 仅三项，正式 registry 为五项；loader 负例与 driver alias 负例均未覆盖遗漏条目。 |
| 2 | 好 registry 解析 `herdr.codex.main`、`herdr.claude.main`；坏 registry 不创建 Attempt/Agent/pane/Result | **部分满足**：两目标存在性与坏 alias 的 driver 零计数已通过；完整 registry 与坏 config 的 driver 零计数未证。 |
| 3 | loader alias-resolve 实现级 mutation 红、还原绿 | **满足（以 E-6505 账本及提交 blob 对照）**。 |

## DHR_35 边界

本提交未启动真实 Agent、未进行 Windows 真实闭环，也没有证据可以解除 DHR_35；DHR_35 仍等待 DHR_63/DHR_64/DHR_65 的各自复核与联合闸。
