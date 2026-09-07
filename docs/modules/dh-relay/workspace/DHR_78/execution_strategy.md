<!-- dh:v1 -->
# execution_strategy — DHR_78

## 操作模型

主会话施工；每个独立行为点结束后先取得测试终态、记录进度，再进入下一点。重核卡收口时由未参与施工的 fresh 实例完成独立复核。

## 子 agent 授权

当前 construction Node 不派子 agent。复核阶段再按 heavy Recipe 单独派发只读任务。

## 收尾铁律

- 证据不全或 P0/P1 未关闭前，不许标待验收。
- 不启动真实 Codex/Claude Agent，不读取凭据或用户级 registry。
- 不扩大 DevPlan 明列的允许路径。
