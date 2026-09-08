<!-- dh:v1 -->
# execution_strategy — DHR_82

## 操作模型

主控先落盘计划骨架并开 `wt/DHR_82`；Herdr 中 Luna max 作为施工 worker，只做一批 construction node。

## 子 agent 授权

| 子 agent | 范围 | 谁批准 |
|-----------|------|--------|
| Luna max | DHR_82 allowlist、测试、progress/findings、construction commit；不得复核或进入下一节点 | 用户 2026-09-08 “按此开工” |

## 收尾铁律

- 不运行真实 Agent，不代签 verify，不合并、push、部署或启动 DHR_35。
- P0/P1 或允许路径外需求必须写 findings 并停止。
