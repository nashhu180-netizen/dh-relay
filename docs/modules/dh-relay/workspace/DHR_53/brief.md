<!-- dh:v1 -->
# brief — DHR_53 薄 Plan、Resolver 与运行历史关联

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---------|---------|-------------|
| DHR_53 | P7 | `dev_plan/P7-DevHarness单卡完整流水-开发方案.md` §3.2 DHR_53 |

## 目标 (Outcome)

冻结版本化的 **薄 RelayPlan / Resolved Plan / Run 关联** 三份契约，并交付一个**确定性 Resolver**：给定一份薄计划源，它能唯一展开出本次运行要跑的 node、依赖、复核 Recipe、applicability 与 execution mode，并把 `plan_id + task_id`（Run 根不可变）与 `resolved_plan_digest`（每 generation）钉死；同时把新根路由、旧根只读发现、永久保留与 history/active 区分做成 fail-closed 的机器事实。

## Zero-context 自查

执行者只读本文件 + `task_plan.md` + DevPlan §3.2 DHR_53 + `design/10` §2/§3/§7/§8 即可开工。**必须先读仓根 `AGENTS.md`**（尤其「编排协议段 · worker 铁律」）。`continue`、Ticket 派发、外部 Agent、Review Batch、Role Relay、停滞恢复**都不在本卡**；`wt/DHR_30` 的未合入代码**不得消费**。

## 完成条件 ★必写（= 任务卡验收口径的逐字承接，标好谁验）

| # | 条件 | 谁验（AI / 人） | 出处（任务 ID / 来源设计文档 + 验收 ID） |
|---|------|---------------|--------------------------------|
| 1 | 冻结版本化 RelayPlan / Resolved Plan / Run 关联 schema；`plans/` 计划源只含任务与 workspace locator、大阶段 flow 与必要覆盖，不维护目标/验收/allowlist/task_plan 的可漂移副本。 | AI | DHR_53；design/10 `HC-3AT-A23`、`HC-P1-A1` |
| 2 | Resolver 确定性读取 DevPlan 任务行、`task_type`、workspace 静态输入、Git/worktree 事实与 Profile registry，展开**唯一** node/依赖/Recipe/applicability/mode，并冻结源摘要。 | AI | DHR_53；design/10 `HC-3AT-A21`、`HC-3AT-A23` |
| 3 | 新根 `dh_relay/plans/`、`dh_relay/archive/` 可被 Git 跟踪、`dh_relay/runtime/` 按 Git 语义忽略；旧根 `.dh-relay/`、`.dh-runtime/relay/` 只读发现、不原地改名/迁移/删除；用户级 `~/.dh-relay/` 不变；tracked Plan 变化不改 active generation。 | AI | DHR_53；design/10 `HC-3AT-A19` |
| 4 | Run 根不可变保存 `plan_id + task_id`，每个 generation 保存 `resolved_plan_digest`；同一 Plan 可产生多个 Run，Plan 不反写 `run_id`；同一 Run 的新 generation 不得改变 `plan_id`/`task_id`；缺关联字段或 digest 错配 fail-closed。 | AI | DHR_53；design/10 `HC-3AT-A31` |
| 5 | Run 进入 terminal 后其 runtime 目录及工件**不被 Runner 删除**；terminal runtime 可被 history 只读定位，但从 active/可恢复集合排除，且**不计入 Agent/Pair 容量**；目录缺失/半写沿既有只读错误面 fail-closed 且不删除其他历史 Run。 | AI | DHR_53；design/10 `HC-3AT-A30` |
| 6 | 反例矩阵全绿：坏计划、缺 workspace、locator 越界、静态输入 digest 漂移、Recipe 缺路 / 非法降级 / 缺 N/A 依据、错 Plan/Task/digest、旧根写入、历史误计 active 或容量、任何自动删除路径——逐条有反例且 fail-closed。 | AI | DHR_53；design/10 §8.4 `A19/A21/A23/A30/A31` |
| 7 | 同一 Plan 连续解析两次产生**不同 Run**，旧 generation 元数据与 digest 不被改写。 | AI | DHR_53 验收 |
| 8 | 三份基线（`fixtures/manifest.json`、`capability-baseline.json`、`tools/structural-tokens.txt`）已按改动重生成，`npm test` / `validate --selftest` / `audit-contracts` / `fixture-manifest` / `capability-baseline` 全绿。 | AI | `relay-core/README.md` 「改了什么就要重生成哪份基线」 |
| 9 | 人判：展示一份含 dedicated / inline / `lessons-absent` N/A 的 Recipe 解析结果，确认必做路径没有因 Binding 或 N/A 被删；以及三类终态 Run 的历史目录仍可查、不 active、不占容量。 | 人 | DHR_53 验收「人判承接 `HC-3AT-H5/H10` 的计划与历史子集」 |

## 边界 (Boundaries)

- **In scope**：`relay-core/contracts/`（Plan / Resolved Plan / Run 关联 schema + reason code 增补）、新建 `relay-core/resolver/`、`relay-core/runtime/` 的精确根与关联适配、`relay-core/fixtures/`、`relay-core/test/`、必要的 `.gitignore` 断言、`workspace/DHR_53/`。
- **Out of scope**：`continue` / Ticket 派发 / 外部 Agent / Launcher / Review Batch 执行 / Role Relay / 停滞恢复；删除 / 压缩 / 配额治理；修改 DHR_30 任务卡或消费 `wt/DHR_30` 未合入代码；修改 design/10 或 P7 计划正文；**创建正式 `dh_relay/runtime/` 目录或用新根 start**（design/10 §10-5 新根闸）；push / deploy / 环境操作。
- **何时必须停下问人**：需要改动已冻结协议或扩大范围、需要消费 DHR_30 未合入接口、P0/P1 三轮不收敛、或 E11 本地收口授权包。**本卡今晚不代签 verify、不合入 master**（见 `decisions.md` D-001/D-005）。

## 触及子系统（收口时更新其 as-built）

- `as-built/relay-contracts.md`
- `as-built/relay-core.md`
