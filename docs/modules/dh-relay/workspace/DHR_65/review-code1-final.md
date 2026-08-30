<!-- dh:v1 -->
# DHR_65 · 代码轮 1 · final re-reverify

> 复核者：独立 fresh、只读 reviewer；日期：2026-08-30。
>
> 审查对象：`2c32180..47f7949`，并核对 E-6518/E-6519 与 `a9b39f0` 上下文；未修改其他文件。

## 结论

**PASS（P0/P1/P2/P3 均无新增；初审 P1/P2 已收敛）**。

## P0

无。

## P1

无。最终增量没有生产代码变化；五 Profile synthetic fixture、fallback 图、全量 alias/config loader 负例及两条 driver 负例均保留在 `2c32180` 已复核的实现中。

## P2

无。

### timeout 增量核对

- **位置**：`relay-core/test/dhr65-registry-loader.test.mjs:139`。
- `2c32180..47f7949` 仅把 preflight 保险 timeout 从 `8_000` 改为 `60_000`，未改 loader、driver、fixture、断言或生产行为；这是解决已实测 Windows alias 探测耗时的最小代码增量。
- timeout 仍通过 `reject(new Error(...))` 失败闭合；`driver.done.then` 的 resolve/reject 两路仍 `clearTimeout(timeout)`，测试 teardown 仍以 `t.after(() => driver.stop())` settle driver，不会把超时转成静默成功或遗留后台 driver。
- E-6518 记录 alias driver 约 13.1s、config driver 约 3.1s，均低于 60s；本轮独立 focused 重跑同样通过：driver 2/2、exit 0（alias 4.4s，config 2.0s）。因此 60s 提供有界余量且不改变 fail-closed 语义。

## P3

无新增 P3。

- E-6518 的 loader 组独立重跑：`node --test --test-concurrency=1 --test-name-pattern "loader" test/dhr65-registry-loader.test.mjs`，3/3 pass、exit 0（好 registry、五条 alias 负例、五条 config 负例）。
- E-6518 的 driver 组独立重跑：`node --test --test-concurrency=1 --test-name-pattern "driver rejects" test/dhr65-registry-loader.test.mjs`，2/2 pass、exit 0；两种坏 registry 均断言 Attempt、Agent、pane、Result/receipt 零副作用。
- E-6519 mutation 账本核对：`profile-registry.mjs:15` 的 `resolveAlias:true→false` mutant 断言失败、source 还原后 E-6518 两组均绿；最终增量未覆盖该实现锚点。无须重复修改生产代码。
- `git diff --name-status 2c32180 47f7949` 仅含 DHR_65 workspace 工件和专项测试 timeout 行；`git diff --check` 通过。未见越界生产路径、凭据值或配置正文；DHR_35/真实 Agent/verify 均未被本卡宣称。

## 完成条件逐条结论

| # | 条件 | 结论 |
|---|---|---|
| 1 | 完整五 Profile 结构等价 registry；任一 alias/config 在 loader/driver 启动前拒绝；零凭据 | **PASS**：五 Profile/fallback 与全量 loader 负例已由 E-6518 覆盖，driver 两类负例有稳定终态。 |
| 2 | 好 registry 解析两个目标；坏 registry 不创建 Attempt/Agent/pane/Result | **PASS**：loader 3/3、driver 2/2，零副作用断言通过。 |
| 3 | alias-resolve 实现级 mutation 红、还原绿 | **PASS**：E-6519 mutation 红，E-6518 还原绿。 |

本报告只记录事实与级别，不代主控做验收裁决，不代签 verify。
