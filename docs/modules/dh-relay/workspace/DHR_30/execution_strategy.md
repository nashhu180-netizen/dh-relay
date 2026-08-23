<!-- dh:v1 -->
# execution_strategy — DHR_30 Relay CLI 与可选 DSH/Pi Bridge

## 操作模型

solo：主会话在隔离 worktree 施工；每个独立命令面/Bridge 接缝完成后先跑定向测试与小审，再继续下一批。

## 子 agent 授权（若派单）

| 子 agent | 范围（只读 / 可写哪些文件） | 谁批准 |
|---------|---------------------------|--------|
| — | 本卡开工期不派单。 | — |

## 收尾铁律

- 证据不全 / 有 P0–P1 未关闭前，不许标“待验收”。
- DSH Bridge 只经 RPC；任何客户端不得直接写 Store。
