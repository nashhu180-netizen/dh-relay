<!-- dh:v1 -->
# DHR_65 · 代码轮 1 · fresh reverify

> 复核者：独立 fresh、只读 reviewer；日期：2026-08-30。
>
> 审查对象：`c52feda..2c32180`，并以 `a9b39f0` 为基线；未修改生产、测试、plan/progress/review 或其他文件。

## 结论

**changes-requested（P2×1；P0/P1=0）**。

初审 P1（五 Profile fixture）已实质关闭，初审 P2（driver config/零副作用/default test 清单）也已补齐；但独立 fresh 专项测试未取得绿终态：alias driver 负例触发 8 秒 timeout。故本轮不能把 DHR_65 标为 PASS，需先处理测试的有界等待与 Windows alias 探测耗时，或取得可复核的稳定终态。

## P0

无。

## P1

无新增 P1；初审 P1 已关闭，证据如下。

### 初审 P1 · 五 Profile synthetic fixture / fallback

- **位置**：`relay-core/test/dhr65-registry-loader.test.mjs:45-57`。
- **fresh 静态核对**：`completeRegistry()` 现在枚举 `herdr.codex.main`、`herdr.codex.ninth`、`herdr.claude.main`、`herdr.claude.grok`、`herdr.claude.account5` 五项；fallback 图保留 `codex.main=[]`、`codex.ninth→codex.main`，其余无 fallback；各条目的 capability、headless、config field 形状与脱敏正式 fixture 等价，临时配置内容为 synthetic 值。
- **覆盖核对**：`relay-core/test/dhr65-registry-loader.test.mjs:80-97` 的 alias/config 负例循环遍历 `completeRegistry().profiles` 全部五项，并且好路径断言 profile 数量为 5（`:71-78`）。因此此前“仅 3/5、fallback 图缺失”的 P1 已关闭。

## P2

### P2-1 · alias driver 负例的 8s timeout 低于实际 loader 探测耗时，fresh 专项仍失败

- **位置**：`relay-core/test/dhr65-registry-loader.test.mjs:99-158`，尤其 `:138-143`。
- **fresh 证据**：独立执行 `node --test --test-concurrency=1 test/dhr65-registry-loader.test.mjs`，结果 `4 pass / 1 fail`、exit `1`；失败项为 `DHR_65 driver rejects a bad alias ...`，报 `timeout:alias:driver-preflight`（测试行 `:155`）。同一次运行中，五 Profile alias loader 负例耗时约 `29.5s`，config loader 负例约 `11.1s`；独立单 Profile alias 探测实测可达约 `40s`。因此 8s barrier 在当前 Windows 环境不能保证坏 alias driver 已完成 loader 校验，当前 E-6513 的 `5/5` 不能由 fresh run 重现。
- **判断**：这是返工后新增的测试可靠性缺口，不是已发现的 runtime 绕过；config driver 分支本次通过。但测试在 alias 路径失败，尚无本轮完整 machine green 证据。
- **要求**：使 alias driver 负例在当前受支持环境取得稳定终态（例如为该同步外部探测设置与实测上界一致的有界等待并确保 timeout 清理，或设计不依赖慢别名探测的确定性测试替身）；timeout 必须失败而非静默通过，修复后重新取得专项 5/5。

### 初审 P2 · driver config / Attempt、Agent、pane、Result、receipt 零副作用

**结构上已关闭，待 P2-1 修复后重取全套绿证。** `:99-158` 已同时构造 alias/config 两种坏 registry；`hostCalls.agents/panes`、`attempt_started/succeeded/failed`、`receipts` 与 `results` 均有直接断言（`:145-151`），并等待 `driver.done` 而非固定短 sleep。config driver 场景本次 fresh 通过。

### 初审 P2 · B-26 默认 test 清单接入

**已关闭（接入事实 PASS，完整 suite 仍不宣称绿色）。** `relay-core/package.json:12` 的显式 `npm test` 清单已包含 `test/dhr65-registry-loader.test.mjs`；本轮启动 `npm test` 的实际命令行输出也列出了该文件。全量命令随后在既有 DHR_33/DHR_61 失败及长时间无输出后未取得终态，不能作为本卡 green，也不归因于 B-26。

## P3

- `profile-registry.mjs` 在 `c52feda..2c32180` 未发生越界改动，loader 仍以 `validateProfiles(..., { resolveAlias: true, environment })` 执行；原有 `E_BAD_VALUE:PROFILE_REGISTRY` reason/detail 组织未被改写。
- mutation 账本 E-6515 仍登记 `true→false→true`、mutant 下 alias loader/driver 断言失败、还原后 5/5；当前提交未覆盖或伪造该锚点。需在 alias timeout 修复后重取一次最终还原绿证。
- `git diff --name-status c52feda 2c32180` 的实现/测试变更为 `relay-core/package.json` 与 DHR65 专属测试；其余变更为 DHR_65 workspace 及 B-26 授权记录，未见 driver/其他 runtime/contracts 越界。未发现新增凭据或配置正文披露；synthetic 临时 JSON 只在测试运行时写入临时目录并由 `t.after` 清理。
- 本轮没有启动真实 Agent、没有改变用户级 registry、没有 verify/合并；DHR_35 仍保持 blocked。

## 完成条件逐条结论

| # | 条件 | 本轮结论 |
|---|---|---|
| 1 | 完整五 Profile 结构等价 registry；任一 alias/config loader 与 driver 启动前拒绝；零凭据 | **结构已满足；机器终态待补**：五项及 loader 全量循环已核对，但专项 alias driver timeout，不能宣称整套绿。 |
| 2 | 好 registry 解析两个目标；坏 registry 不创建 Attempt/Agent/pane/Result | **部分满足**：config driver 与直接零副作用断言通过；alias driver 未在 timeout 内取得完成态。 |
| 3 | alias-resolve 实现级 mutation 红、还原绿 | **账本满足，最终 reverify 待补**：E-6515 已记录；本轮未重新施加 mutation。 |

本报告只记录事实与级别，不代主控做验收裁决，不代签 verify。
