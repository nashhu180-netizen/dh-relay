<!-- dh:v1 -->
# execution_strategy — DHR_65

## 操作模型

主会话在独立 worktree 施工；normal 收口时由未参与施工的独立 reviewer 分别做代码、需求和教训复核。

## 收尾铁律

- 不读取或记录用户级 registry 正文、配置正文或凭据。
- 只按 DevPlan 允许路径提交；需要 driver 或其他 runtime 改动即停止并做 A/B 调整。
- DHR_65 完成不自动启动、解锁或验证 DHR_35。
