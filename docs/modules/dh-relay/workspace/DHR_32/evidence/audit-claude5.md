# audit-claude5（2026-08-29 · 脱敏）

## 命令解析

- 解析形态：`function`；PATH 同时可解析到 `cmd-shim` `%USERPROFILE%\\bin\\claude5.cmd`。
- Function 为 9 行，设置/清理的环境变量名为 `CLAUDE_CONFIG_DIR`、`ANTHROPIC_API_KEY`、`ANTHROPIC_AUTH_TOKEN`、`ANTHROPIC_BASE_URL`、`CLAUDECODE`，并转发参数。其目标 Claude 可执行文件当前不存在；未收录 shim 正文或任一变量值。
- 两级解析中，`where.exe claude5` 成功；此仅证明入口命令存在，不证明其目标 CLI 可用。

## 版本与产品

- `claude5 --version` 失败：目标 CLI 文件不存在。版本与产品不可证，注册表产品标为 `unverified`。

## 配置来源

- 配置目录：`%USERPROFILE%\\.claude-account5`（只读）。存在 `.claude.json`、`settings.json` 和历史版本目录。
- 仅登记字段名：`.claude.json` 的 `mcpServers`、`userID`；`settings.json` 的 `model`、`permissions`、`env`。未读取任何认证或 `env` 值。

## 身份信号

- 未发现可安全掩码且可归属账号主体的字段值，`expected_identity` 不可证。
- `account_alias`：`acct-claude5`。

## 能力位

- `interactive`、`resume`、`readonly`、`headless`、`structured_result`、`user_input_passthrough`：均不可证；目标 CLI 当前不可执行。

## quota 样本

- 样本缺，不可证；未为取样运行消耗额度的命令。

## fallback

- 与 claude 主入口的关系待证；未登记切换关系。

## Herdr 启动

- 若 CLI 恢复可用，claude 系入口使用 `herdr pane run` 后自动识别并 rename；当前实际可启动性不可证。
- 拉起方式约束：该入口为 Function，必须经 PowerShell shell / `herdr pane run` 拉起；当前目标 CLI 缺失，不能作为可启动证明。

## Linux

- 延后（DHR-B-22 调整①）。
- `supported_platforms:["win32"]` 是「Linux 未证·延后（B-22①）」的保守表达，非否定结论；P6 阶段闸裁决后需回填。

## 不可证项汇总

- 目标 CLI 可用性、版本、产品、账号主体、全部能力位、quota 样本、fallback 关系、Linux 入口。
