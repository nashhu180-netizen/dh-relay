<!-- dh:v1 -->
# execution_strategy — DHR_66

## 操作模型

先用既有 identity 专项保留旧 `/profiles` 声明缺键的 fail-closed 基线，再按 B-31 仅从目标用户级 registry projection fields 删除已漂移的 `/profiles`、保留 `/model`；Codex 产品 config 不写且前后 hash 必须相同。随后重跑 live freeze、四类 projection 负例与 DHR65 runtime 零副作用证据。任何需要读取值、扩大 pointer、修改产品 config、schema 或仓内代码的迹象均立即停下并写 findings。

## 收尾铁律

- 工作区、命令输出与提交不得持久化 `/profiles` 投影值、配置正文或凭据。
- 本卡不启动真实 Agent，不创建或绑定 Attempt，也不改变 DHR35 的 blocked 状态。
