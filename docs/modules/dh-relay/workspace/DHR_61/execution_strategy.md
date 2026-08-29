<!-- dh:v1 -->
# execution_strategy — DHR_61

## 操作模型

重核单卡、独立 worktree。施工使用 Herdr 中的 Codex `gpt-5.6-terra`（reasoning high）；主会话保留协议裁决与收敛责任。S1/E4/E5/E14/E6/E7 使用未参与施工的独立 Herdr 实例，代码轮 2 必须 fresh 且不继承轮 1 会话。

## 子 agent 授权

| 子 agent | 范围（只读 / 可写哪些文件） | 谁批准 |
|---------|---------------------------|--------|
| S1 / E4 / E5 / E14 / E6 / E7 独立实例 | 只读指定 brief、task plan、diff 与证据；仅可回写获分配的 review/候选工件 | 用户已确认 DHR_61 D 开工；主会话逐次派发 |

## 收尾铁律

- 未达到三条机器证、五路复核与有效变异点前，不许标待验收。
- 不读取或记录凭据值；DHR_34 保持 blocked-by:DHR_61。
