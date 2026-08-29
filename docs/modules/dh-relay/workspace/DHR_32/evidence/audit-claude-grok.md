# audit-claude-grok（2026-08-29 · 脱敏）

## 命令解析

- 解析形态：`function`。`where.exe claude-grok` 不命中；按 BLOCKED-1 裁决的受控只读 fallback，`pwsh -NoLogo -Command Get-Command` 成功。
- Function 为 8 行，设置/清理的环境变量名为 `CLAUDE_CONFIG_DIR`、`ANTHROPIC_API_KEY`、`ANTHROPIC_AUTH_TOKEN`、`ANTHROPIC_BASE_URL`、`CLAUDECODE`；转发参数至 Claude Code。未收录 shim 正文或任一变量值。

## 版本与产品

- `claude-grok --version`：`2.1.251 (Claude Code)`，产品为 Claude Code 网关壳入口。

## 配置来源

- 配置目录：`%USERPROFILE%\\.claude-grok`（只读）。存在 `.claude.json`、`settings.json`、daemon 状态与会话目录。
- 仅登记字段名：`.claude.json` 的 `customApiKeyResponses`、`mcpServers`、`userID`；`settings.json` 的 `model`、`permissions`、`env`。未读取任何认证或 `env` 值。

## 身份信号

- 未发现可安全掩码且可归属账号主体的字段值，`expected_identity` 不可证。
- `account_alias`：`acct-grok-gw`。

## 能力位

- `interactive`：支持；Help 说明默认启动 interactive session。
- `resume`：支持；Help 列出 `--resume` 与 `--continue`。
- `readonly`：不支持；未发现等价于机器 `--sandbox read-only` 的开关；侦测型只读不计入支持。
- `headless`：支持；Help 列出 `-p/--print`。
- `structured_result`：支持；Help 列出 `--output-format json`。
- `user_input_passthrough`：支持；Herdr 操作记录列出 `agent prompt` / `send-keys`。

## quota 样本

- 已有真实历史记录：HTTP `502`，错误短语模式为「首跑 502 后改指定具体模型」。来源 `design/evidence/09-P4至P9阶段计划-交叉审核记录.md`；未记录账号、请求头、request_id、organization_id 或 endpoint 路径。

## fallback

- 未证实 fallback 关系；未实现切换逻辑。

## Herdr 启动

- `herdr pane run` 后自动识别并 rename；原因是 claude kind 的 PATH shim 坑，见 `knowledge/herdr-派活操作.md`。
- 拉起方式约束：该入口为 Function，必须经 `herdr pane run` 的 shell 拉起；不可直接 spawn Function。

## Linux

- 延后（DHR-B-22 调整①）。
- `supported_platforms:["win32"]` 是「Linux 未证·延后（B-22①）」的保守表达，非否定结论；P6 阶段闸裁决后需回填。

## 不可证项汇总

- 账号主体、可复用 quota detector、fallback 关系、Linux 入口。
