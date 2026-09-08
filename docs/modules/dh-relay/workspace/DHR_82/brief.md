<!-- dh:v1 -->
<!-- dh:workspace-contract:v2 -->
# brief — DHR_82 startup turn-start 提交屏障

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---------|---------|-------------|
| DHR_82 | P6 | P6 DevPlan DHR_82 任务卡 |

## 目标 (Outcome)

仅在 startup 私有判定中以同 host 的 `state_change_seq` 前进确认 turn 已开始，避免把 prompt 裸成功误写为 accepted。

## 完成条件 ★必写（= 覆盖任务验收口径的并集，标好谁验）

| # | 条件 | 谁验 | 出处 |
|---|------|------|------|
| 1 | 同 host 的 seq 严格前进才记录既有 accepted 并保持原 60 秒至多一次补发；冻结 seq 不补发。 | AI | DHR_82 / HC-SD-A10 |
| 2 | seq 缺失、未前进、unknown/失败时保留 authorized，恰一条无新 reason 的屏障 Attention，恢复不重发。 | AI | DHR_82 / HC-SD-A11 |
| 3 | Store、公开协议、Receipt/Result、composer、Enter、`--wait`、第三发与 runner 零越界，专项和定向回归自然终态。 | AI | DHR_82 / HC-SD-A12,D |
| 4 | 展示 seq 前进与不动两例，用户判断不可证即停自动补发的人工代价；不宣称修复物理 Enter。 | 人 | DHR_82 / HC-SD-H3 |

## 边界 (Boundaries)

- In scope：DevPlan allowlist 中的 startup driver/Herdr executor、专项测试、最小 fake seq 钩子和记录。
- Out of scope：真实 Agent、Store/contracts/Receipt/Result、composer/Enter、`--wait`、第三发、runner、DHR_35。
- 何时必须停下问人：允许路径外、P0/P1 三轮不收敛、或 E11 本地收口授权包。

## 触及子系统（收口时更新其 as-built）

`as-built/relay-core.md`。
