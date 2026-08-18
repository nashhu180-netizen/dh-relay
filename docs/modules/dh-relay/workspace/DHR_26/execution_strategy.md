# execution_strategy — DHR_26

## 执行策略

DHR_26 采取“仓内治理工件 + 仓外实验代码 + 本机 DSH 证据”的方式推进。仓内只保存标准档工作区、施工计划、静态源包和审查记录；真正的 DSH 安装、升级、独立 Home 与进程内 smoke 全部发生在 `<experiment-root>` 下。

## 改动边界

- 允许：`docs/modules/dh-relay/workspace/DHR_26/`。
- 允许作为实验输入：`docs/modules/dh-relay/workspace/DHR_26/artifacts/src/dsh-host/`。
- 禁止：`tools/` 现役生产代码。
- 禁止：DeepSeek Harness 上游源码。
- 禁止：日常 DSH Home 与用户凭据目录。

## 风险控制

1. 版本风险：所有 DSH 事实必须写明 `0.1.0-rc.7`，并保留 rc.6 到 rc.7 的差异证据。
2. 类型污染风险：Host Service 返回值只允许普通 JSON；源包静态测试禁止导入 `@deepseek-ai/dsh-*` 私有运行类型。
3. 路径泄露风险：仓内证据不得写入密钥、token、账号目录下的敏感路径。必须记录路径时，用 `<experiment-root>`、`<dsh-home>`、`<dsh-install>` 等占位。
4. 结论越界风险：DHR_26 只登记 Host 侧事实，不给 DSH 桌面控制面三态结论。

## 本轮 GitHub 侧可交付

- 标准档工作区骨架。
- DHR_26 源包草案。
- 静态契约测试。
- 本机执行计划与证据回填位置。

## 本轮 GitHub 侧不可交付

- 本机 `dsh --version` 复验。
- rc.6 到 rc.7 升级。
- DSH 独立 Home 安装和卸载。
- DSH 进程内 `ctx.relayPilot` 调用证据。
- 两轮独立复核与 verify。
