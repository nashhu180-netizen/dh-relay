<!-- dh:v1 · execution_strategy.md -->
# execution_strategy — RLT_30

## 操作模型

- 主会话（Claude Code，Opus 5.5）直接施工，不派 headless worker，不开 relay run/ledger。
- 单验收单元、单施工批：先改测试断言（RED）→ 改 skill 五件 / AGENTS / relay_log 显示层 / as-built（GREEN）→ grep 检查 → 全量回归。

## 子 agent 授权（复核）

- normal 三路：code-round1（E2 `code_review`，single-full-targeted）、需求方向、教训；各派 fresh subagent（Claude Code Agent 工具，general-purpose），未参与施工、不继承主会话上下文，只读仓内工件。
- 仓内未配置只读复核后端，按「侦测型降级、非机器只读」执行：prompt 明令只读，复核后主会话以 `git status --short` 核零写入。
- code_review 出现 open P0/P1 时由主会话整改一次，并对**同一 reviewer 会话**（SendMessage 续派）做 attempt 2 定向复查；不第三派。
- 有效单测变异由主会话施加、复核实例复核记录（normal 卡不强制轮 2 选点）。

## 收尾铁律

- 合入走 PR #71 squash；E10 证据包经用户确认后才合入。
- 合入后同步四份用户级副本并核 LF 哈希；清理 worktree。
