<!-- dh:v1 · execution_strategy.md — 分工。🟡 开工时定一次。solo 任务可只填操作模型一行。 -->
# execution_strategy — DHR_27

## 操作模型

主会话（Opus）solo 施工，按 task_plan 三批推进；机械/可并行节点按 2026-08-20 用户确认的默认委托表派 subagent。

## 子 agent 授权（若派单）

| 子 agent | 范围（只读 / 可写哪些文件） | 谁批准 |
|---------|---------------------------|--------|
| S1 brief 起草 | 可写 `workspace/DHR_27/brief.md`、`review.md`（预填区） | 用户 2026-08-20 默认委托确认 |
| 批次小审 ×3（轮 1 前移） | 只读本批 diff 与证据 | 同上 |
| E2 轮 2 增量复核 | 只读（fresh-context，不继承施工会话） | 同上 |
| E4 需求复核 / E5 教训复核 / E14 一致性复核 / E6 miner / E7 as-built | 只读 + 各自登记位 | 同上 |

## 收尾铁律

- 证据不全 / 有 P0–P1 未关闭前，不许标"待验收"。
- 子 agent 默认无写权，要人批准。
- v1 现场（`D:\MyFiles\ai-workflow\dh-crew\.dh-runtime\relay\`）对所有 agent 一律只读；任何 agent 不得向该目录写入。
