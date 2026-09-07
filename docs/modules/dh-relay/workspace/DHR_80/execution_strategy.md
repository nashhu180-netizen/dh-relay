<!-- dh:v1 -->
# execution_strategy — DHR_80

## 操作模型

主控在当前左侧 Herdr pane 负责范围、批次放行、定期监控和证据裁决；右侧独立可交互 pane 的 Luna max 只承担 construction，按 `task_plan.md` 一次执行一个批次。每批结束必须停住，主控检查 diff、终态和账本后再决定返工或下一批。

## 子 agent 授权（若派单）

| 子 agent | 范围（只读 / 可写哪些文件） | 谁批准 |
|---------|------------------------------|--------|
| Herdr Luna max construction worker | 仅 DevPlan `dh:allowed-paths:v1 task=DHR_80`；一次只写当前获派批次需要的路径；不得改 DevPlan 状态、复核/验收/verify/合并/push | 用户已在对话授权施工方式；主控逐批放行 |

## 收尾铁律

- 证据不全 / 有 P0–P1 未关闭前，不许标“待验收”。
- Luna 施工者不复核自己的卡；每批检查与 heavy 收口复核使用独立实例。
- `done` / `idle`、pane 文本或命令局部输出不等于 Receipt-bound Result，也不等于测试终态。
