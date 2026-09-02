<!-- dh:v1 · brief.md — 工作区封面。完成条件 = 任务卡验收口径的逐字复制 + 出处回链；DevPlan 是唯一权威，本文件是只读副本。 -->
<!-- dh:workspace-contract:v2 -->
# brief — DHR_71 · Herdr 定向回归复绿（可重复绿闸）

> 出处（唯一权威）：[P6 开发方案](../../dev_plan/P6-Herdr多账号执行底座-开发方案.md) §3.2 DHR_71。本文件是只读副本；冲突以 DevPlan 为准。
> 档位：标准。任务类型：**light**（复核只做教训 + 一致性两路，无代码轮次、不要求有效单测）。
> 开工授权：用户 2026-09-02 对话点选「开工授权」，承接 B-35 已确认的卡合同。分流：开树 `wt/DHR_71`（基线 `master@5408f1e`）；施工派 **Opus** 交互式 Herdr pane（主控左、worker 右上）；委托节点 S1 brief 主控自写，E5 教训 / E14 一致性派 fresh 只读实例，E6 miner / E7 as-built 沿默认。授权至 **E10 人验备料**；**不含** verify、合并、推送、生产代码、真实 Agent、DHR_35 重跑、用户级 registry/凭据读写。

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| DHR_71 | P6 Herdr 多账号执行底座 | DevPlan §3.2 DHR_71；`DHR-B-35` D-B35-1 / X-03（用例行级冻结）；DHR_35 F-3520 |

## 目标 (Outcome)

让 `herdr-adapter` + `agent-node` + `dhr64-driver-observation` + `dhr69-false-ready` + `dhr70-submission-gate` 这组定向回归在本机成为**可重复、可解释**的绿闸：除冻结隔离清单内的 2 条 skip 外全部 pass、零 fail、零挂死，为 DHR_72 开工提供可依赖的前置。承接 DHR_35 F-3520 的时序部分与 652s 挂死。

## Zero-context 自查

只读本文件 + DevPlan §3.2 DHR_71：这是一张**只改测试**的卡。终点是「每次跑都一个结果」——等具体事件而不是等固定秒数，挂死要变成失败而不是没完没了。两条语义红（`:242`/`:279`）**只 skip 不重写**（归 DHR_72）；红因若落到生产代码或 `%TEMP%` EPERM（BL-17），**只登记不修**。共享夹具、`fake-herdr.mjs`、`workflow-driver.mjs` 一个字都不能动。验收四条全是机器证，**没有人验项**。

## 完成条件 ★必写

> 逐字复制自 DevPlan §3.2 DHR_71「验收口径」，四条均为**机器证**。

| # | 条件 | 谁验 | 出处 |
|---|---|---|---|
| A | **机器证 A（绿闸）**：五文件 `node --test --test-concurrency=1` 连续 3 轮，每轮记录 pass / skip / fail、每文件时长、总时长：**skip 恰为 2、fail 为 0**，无一轮不收口；每轮总时长 ≤ 隔离单跑之和的 2 倍；三轮原始输出入 `workspace/DHR_71/evidence/`。只能写「隔离 2 条 skip、其余全 pass」，**不得写「全绿」**。 | machine | DHR_71 |
| B | **机器证 B（等待有界）**：每个被改的等待能列出「目标事件 + 上限 + 超限失败输出」；人为让目标事件不发生，用例在上限内 fail 而不是挂住（至少对 652s 那条做此负例）。 | machine | DHR_71 |
| C | **机器证 C（652s）**：已定位（附复现步骤）并修；若指向生产，登记 finding 并注明去向。 | machine | DHR_71 |
| D | **机器证 D（路径）**：`git diff --name-only master...HEAD` 仅含 `relay-core/test/**` 与 `workspace/DHR_71/**`。 | machine | DHR_71 |

## 边界 (Boundaries)

- **In scope**（DevPlan `dh:allowed-paths:v1 task=DHR_71` + 用例行级限定）：
  - `relay-core/test/herdr-adapter.test.mjs`：仅 `:354`（#10 恢复届 orphaned）、`:510`（DHR_68/C 启动即 blocked）**用例体内**的等待逻辑；对 `:242`、`:279` **加 skip 标记**（用例内标注 `F-3520 → DHR_72`，冻结恰 2 条）。
  - `relay-core/test/agent-node.test.mjs`：仅 `:198`、`:231`/`:265` 的等待逻辑及文件级超时配置。
  - `relay-core/test/helpers/**`：只可新增/修改等待工具，**不含 `fake-herdr.mjs`**。
  - `docs/modules/dh-relay/workspace/DHR_71/**`；DevPlan P6 文件（仅状态回填）。
- **Out of scope**：`relay-core/runtime/**`、`store/**`、`contracts/**`、`package.json`（不在允许路径，`--test-timeout` 走命令行）；`herdr-adapter.test.mjs` 共享夹具 `runtimeFixture`（`:203-230`，含 `runtimeSleep`/`runtimeUntil`）与 `recoveryFixture`（`:335-352`）；`:242`/`:279`/`:305` 的断言；`dhr64-driver-observation` / `dhr69-false-ready` / `dhr70-submission-gate` 三个文件（在绿闸里但不在允许路径——它们若红只登记）；`%TEMP%` EPERM（BL-17）；真实 Agent。
- **红线**：不得为了变绿而放宽断言或把等待改成「等出我要的值」（`helpers/settled-state.mjs` 头注释是这条的正面样板）；不得把语义红改写成 pass（只许 skip 恰 2 条）；`:510` 若必须改夹具才能修 → 只登记并移交 DHR_72。
- **何时必须停下问人（worker 写 blocked，不回头问）**：红因落到生产代码且无法只靠测试侧有界化收口；允许路径不够用；隔离清单需要增减。

## 触及子系统（收口时更新其 as-built）

- 本卡只改测试，`as-built/relay-core.md` 预计**无实现变化**；若定位 652s 时发现生产侧问题只登记 finding，不改 as-built 正文（可在 §测试基线小节补一句绿闸命令）。
