<!-- task.md — 轻档（一件套）。日常优化 / 样式 / 小修用。三合一：终点 + 进度 + 验收。 -->
# task — RLT_02 与现役 Runner 一致性对照

> 执行者：headless worker

任务卡权威定义见 [P1-RelayLight 开发方案 §RLT_02](../../dev_plan/P1-RelayLight-开发方案.md#rlt_02)。本文件是只读副本，口径以 DevPlan 为准。

## 完成条件 ★前置（继承任务卡验收口径）

1. **机器证**｜来源：[`design/01`](../../design/01-RelayLight-产品设计与验收.md) + `HC-RL-A14`｜对照文档对「节点 / 角色 / 事件 / 关闭」四类定义**逐项有结论**，每条裁决为「有意差异」或「遗漏」，二选一、不留待定。
2. **机器证**｜来源：`HC-RL-A14`｜`git diff --stat` 对 `tools/runner/`、`tools/host/`、`tools/contracts/` 为空——现役 dh-relay 未被改动。

## 施工步骤 ★精简（🔵 开工那一刻写，3–5 步大方向）

详细施工说明书见同目录 [`task_plan.md`](task_plan.md)。大方向：

1. 只读摸清 relay-light 侧四类定义（design/01 的 §2 / §3.3 / §3.4 / §4.1 / §5.3）。
2. 只读摸清现役 Runner 侧同四类（`tools/contracts/` 枚举 + `tools/runner/` + `tools/host/`，辅以 `docs/modules/dh-relay/as-built/`）。
3. 逐项列表对照并裁决「有意差异 / 遗漏」，写进 `docs/modules/relay-light/as-built/现役Runner一致性对照.md`。
4. 自查禁改路径 diff 为空，把命令与输出贴进下方进度表。

## 进度 + 证据（边做边记）

| 时间 | 做了什么 | 证据（命令/路径/结果） |
|------|---------|----------------------|
| 2026-09-09 | 只读抽取 relay-light 的节点、角色、事件、关闭定义，并与现役 `relay/v1` schema/runner/host 对照；新增只读对照文档。 | `docs/modules/relay-light/as-built/现役Runner一致性对照.md`：四节表格共 29 条；节点 5、角色 11、事件 8、关闭 5；有意差异 29、遗漏 0。来源精确到 `design/01` 节与现役代码路径:行号。 |
| 2026-09-09 | 第 4 步禁改路径自查。 | `git diff --stat -- tools/runner tools/host tools/contracts`；原样 stdout 见紧随本表的专节（为空）。 |
| 2026-09-09 | 第 4 步禁改路径自查。 | `git diff --stat -- relay-core docs/modules/dh-relay`；原样 stdout 见紧随本表的专节（为空）。 |
| 2026-09-09 | 工作区与允许路径核对。 | `git status --short` 显示本棒的 `docs/modules/relay-light/as-built/现役Runner一致性对照.md`（新增）和本卡 `task.md`（修改）；另有预存未跟踪 `docs/modules/relay-light/design/drafts/A02-仓内skill单源-增补候选.md`，未读取、未改动、非本棒产物。 |
| 2026-09-10 | 窄返工：按教训/一致性复核闭合范围、枚举和角色 findings。 | 对照明确本卡 comparator 仅为 C-005～C-007 的 `relay/v1` schema/runner/host；as-built 五份快照已作只读索引阅读，并列的 `relay-core` v2 不在本卡验收 comparator 内。归纳裁决重算为 30（节点 5、角色 12、事件 8、关闭 5），并新增 50 项覆盖矩阵：11 relay-light 角色、19 relay-light 事件、v1 node role 3、receipt role 3、proposal proposer 2、event kind 12，已映射 50、遗漏 0。新增 `replanner ↔ planner-amend` 独立裁决，完整枚举 event kind，并将 README 引用替为 host 活代码。 |
| 2026-09-10 | 窄返工禁改路径与矩阵计数自查。 | `git diff --check -- docs/modules/relay-light/as-built/现役Runner一致性对照.md docs/modules/relay-light/workspace/RLT_02/task.md` 无输出；矩阵计数为 `11 + 3 + 3 + 2 + 19 + 12 = 50`。`git diff --stat -- tools/runner tools/host tools/contracts` 与 `git diff --stat -- relay-core docs/modules/dh-relay` 原样均为空；既有 relay-light 设计/DevPlan WIP 未触碰。 |
| 2026-09-10 | light Recipe 两路复核收敛。 | 教训初审 LES-01/02/03 经返工闭合，复验新增 LES-04 经单点修正后再审 P0/P1/P2/P3=0；一致性初审 P1×1/P2×2 经返工复验全部闭合、P0/P1/P2/P3=0。完整登记见 `review.md`。 |
| 2026-09-10 | 用户口头确认收口，解锁 RLT_03。 | 对话明文“relay-lite 开始开发”；DevPlan 回填 RLT_02 已完成、RLT_03 进行中。 |

### 第 4 步禁改路径命令与原样输出

命令：`git diff --stat -- tools/runner tools/host tools/contracts`

stdout（原样为空）：

```text

```

命令：`git diff --stat -- relay-core docs/modules/dh-relay`

stdout（原样为空）：

```text

```

## 验收

- AI 自评：
  1. 完成条件 1 已达成：对照文档按节点、角色、事件、关闭四类给出 30 个二选一裁决，无待定；覆盖矩阵逐项消费 11 个 relay-light 角色、19 个事件，以及 v1 三套角色枚举和完整 12 个 event kind，50/50 已映射、遗漏 0。证据为 2026-09-10 窄返工行及对照 §5。
  2. 完成条件 2 已达成：`tools/runner/`、`tools/host/`、`tools/contracts/` 的 `git diff --stat` 为空；额外核对 `relay-core/` 与 `docs/modules/dh-relay/` 亦为空。证据为 2026-09-10 禁改路径自查行及紧随其后的原样输出；既有 relay-light 设计/DevPlan WIP 未触碰。
- 关闭方式：AI 自评 + 用户口头确认即可；做完回 DevPlan 任务表销户。
- 复核（`light` Recipe）：教训 + 一致性两路，不要求单测。

> 任务变重了（碰到生产接入/迁移/上线/接线/数据口径）就升级标准档 8 件套，走 verify 闸门。
