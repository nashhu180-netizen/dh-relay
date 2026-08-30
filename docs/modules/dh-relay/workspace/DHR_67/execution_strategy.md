<!-- dh:v1 -->
# execution_strategy — DHR_67

## 操作模型

先以 fake Herdr 红测钉住 Claude 与 Codex 的分支差异和同 pane 失败关闭，再增加最小 CLI wrappers，最后在 executor 仅为 Claude 接入受支持序列。任何不唯一、超时或 rename 失败均 fail-closed；测试只消费 fake 记录，不运行真实 Claude 或 DHR35。

## 收尾铁律

- Herdr 的 `done`、pane 文本、exit code 与 agent detection 均不是 Result 来源。
- 任何失败只能关闭本卡刚创建的 pane；不可关闭调用方、既有 pane 或其他 Agent。
- 所有生产代码与测试修改均限制在 DevPlan DHR_67 的逐条允许路径。
