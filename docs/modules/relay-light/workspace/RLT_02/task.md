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
| | | |

## 验收

- AI 自评：完成条件逐条达成？证据在上表哪几行？
- 关闭方式：AI 自评 + 用户口头确认即可；做完回 DevPlan 任务表销户。
- 复核（`light` Recipe）：教训 + 一致性两路，不要求单测。

> 任务变重了（碰到生产接入/迁移/上线/接线/数据口径）就升级标准档 8 件套，走 verify 闸门。
