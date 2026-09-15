<!-- dh:v1 · progress.md — 施工日志 + 证据账本。🟢 边做边记；跑偏记这里，不回写 task_plan / DevPlan / design。 -->
# progress — RLT_22 复核触发改非终态「待复核」信号与节点内返工生命周期

> 本文件在 D 开工时只登记开工事实（D-001），**不预填任何运行记录**。所有 E-ID 由实际跑过命令的施工方/复核方追加。

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-09-15 | 编排派出的 workspace builder | D-001 建工作区七件套（见下「D-001 开工事实登记」）；未改任何程序、未跑任何验收命令、未做 git 写操作 | 本目录七个文件 | 编排核七件套 → 派 B1 施工 worker |

## D-001 开工事实登记

**动作 D 开工 · 落户**（本登记不等于 verify、不等于验收，也不授权 push / PR / 合并）

| 项 | 值 |
|---|---|
| 任务卡 | `RLT_22` — 复核触发改非终态「待复核」信号与节点内返工生命周期 |
| 权威定义 | `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` 的 `#### RLT_22` 整段 + §3.1 RLT_22 行 |
| GitHub Issue | [dh-relay #24](https://github.com/nashhu180-netizen/dh-relay/issues/24)（OPEN，正文由卡正文生成） |
| worktree | `D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_22` |
| branch | `wt/RLT_22` |
| 基线 | `544ccdb`（`docs(relay-light): RLT-A-09 晋级——复核触发改非终态「待复核」信号，续发 A144~A150 并新增 RLT_22`） |
| client | claude-code |
| 档位 / 任务类型 | 标准 / 常规（`dh:task-type:v1 task=RLT_22 type=normal`） |
| 规划来源 | `RLT-A-09`（2026-09-15 晋级） |
| 依赖 | `RLT_21`（第 1 批）。输入已全部落盘，**不以 RLT_12 验收为门** |

**用户 2026-09-15 对 F-008 的方向裁决（只有这三句，不多不少）**

1. 复核类 agent 的 trigger 不再要求被依赖方处于终态；改为承认一个**非终态的「待复核」信号**，施工者在整个复核—返工循环中保持 live。
2. 复核方同样留活口——**不判 PASS 不记 `done`**；PASS 后再依次记双方终态，节点方可关闭。
3. 轮次上限沿用 `limits.rework_max_rounds=2`，超限仍走 strategist → 用户闸。

**用户 2026-09-15 对候选稿六项开放项的逐条裁决**（出处：`design/evidence/10-交叉审核记录-RLT-A09-复核触发信号.md` §三；用户全部按候选稿倾向裁决，逐字采纳、不扩大）

| # | 开放项 | 裁决 | 对本卡的约束 |
|---|---|---|---|
| 1 | 信号名 | **复用 `checkpoint` + 类型化 token**，不新增事件词 | A2 的 19 词白名单一字不改 |
| 2 | W 阶段是否纳入 | **纳入** | 判定角色闭集含 `plan-reviewer`；适用范围 = W / C / X；A149 含 W 模板改动 |
| 3 | R 阶段收窄是否接受 | **接受** | R 模板一字不改；A146 对 R 不生效由「无信号即不设闸」保证 |
| 4 | C 的强制性残留是否接受 | **接受，不改 A95** | checker 仍留空 trigger；C 的封口顺序只在信号存在时受 A146 约束 |
| 5 | 第三套计数是否进 `status --json` | **只投影，不进** | A62 冻结 schema 一字不改 |
| 6 | 向后兼容是否强制迁移 | **不强制** | lint 不拒旧写法、不报「建议迁移」 |

**该裁决未授权的事项**（evidence/10 §三末段原文口径）：不含 D-start 之外的施工授权推定、不含 verify 或代签、不含 `RLT-B-08` 的卡号/批次/依赖决定。skill 两侧重同步（`install_skill.py --all`）须在施工当次另取用户明确授权。

## 证据账本 (Evidence Ledger)

<每条「完成」结论挂一条可复跑的命令 / grep / runtime 输出；不能空口说做完了。类型枚举含 `review-dispatch`（派 agent 复核）/ `session-run`（主控本会话直跑复核），大小写精确。派出证据用 `dh dispatch` 落账。>

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|---|---|---|---|---|
| — | — | — | — | <待施工方追加，建工作区期不预填> |

## 信号

<每个角色完成本节点后在本节末追加独占一行；写完即停，不等 `node_closed`，不自行启动下一角色或阶段。>

```text
DONE task=RLT_22 role=<builder|exec|audit|decide|review> batch=<W|1|2|3|R> status=<W_READY|PASS|FAIL|READY_FOR_REVIEW|CONSTRUCTION_DONE|BLOCKED|APPROVE|APPROVE_WITH_NITS|REQUEST_CHANGES> evidence=<逗号分隔> next=orchestrator
```

DONE task=RLT_22 role=builder batch=W status=W_READY evidence=D-001 next=orchestrator
