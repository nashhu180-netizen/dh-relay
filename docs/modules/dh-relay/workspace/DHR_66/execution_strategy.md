<!-- dh:v1 -->
# execution_strategy — DHR_66

## 操作模型

先用既有 identity 专项确认缺失投影的 fail-closed 基线，再在已声明 nonsecret 的单一 `/profiles` 路径做最小修复，随后重跑正负例。任何需要读取值、扩大 pointer、修改 schema 或仓内代码的迹象均立即停下并写 findings。

## 收尾铁律

- 工作区、命令输出与提交不得持久化 `/profiles` 投影值、配置正文或凭据。
- 本卡不启动真实 Agent，不创建或绑定 Attempt，也不改变 DHR35 的 blocked 状态。
