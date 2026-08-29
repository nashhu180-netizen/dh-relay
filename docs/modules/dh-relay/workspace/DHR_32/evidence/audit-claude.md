# audit-claude（2026-08-29 · 脱敏）

## 命令解析

- 解析形态：`ps1-shim` `%APPDATA%\\npm\\claude.ps1`；PATH 另有 cmd shim 与 Claude 可执行文件。
- PowerShell shim 为 17 行、转发参数并委派 Claude Code；无专属环境变量。未收录 shim 正文。
- 两级解析中，`where.exe claude` 成功，故不需 PowerShell fallback。

## 版本与产品

- `claude --version`：`2.1.251 (Claude Code)`，产品为 Claude Code。

## 配置来源

- 配置目录：`%USERPROFILE%\\.claude`（只读）。存在 `.claude.json`、`.credentials.json`、`settings.json` 及会话/缓存目录。
- `.claude.json` 仅登记字段名：`oauthAccount`、`userID`、`mcpServers`；`settings.json` 仅登记字段名：`model`、`permissions`、`env`。未读取任何认证或 `env` 值。

## 身份信号

- 账号主体字段 `oauthAccount.email` 存在，脱敏值为 `hy***@gmail.com`。
- `account_alias`：`acct-claude-main`；`expected_identity` 使用相同脱敏值。
- 可复跑只读探测（只输出掩码）：`$email=(Get-Content -Raw "$HOME\\.claude\\.claude.json" | ConvertFrom-Json).oauthAccount.email; if ($email -match '^(.{2}).*@(.+)$') { "$($Matches[1])***@$($Matches[2])" }`。掩码规则：保留本地部分前 2 字符 + `***` + 域名；当前结果 `hy***@gmail.com`。

## 能力位

- `interactive`：支持；Help 说明默认启动 interactive session。
- `resume`：支持；Help 列出 `--resume` 与 `--continue`。
- `readonly`：不支持；未发现等价于机器 `--sandbox read-only` 的开关；侦测型只读不计入支持。
- `headless`：支持；Help 列出 `-p/--print`。
- `structured_result`：支持；Help 列出 `--output-format json`。
- `user_input_passthrough`：支持；Herdr 操作记录列出 `agent prompt` / `send-keys`。

## quota 样本

- 样本缺，不可证；未为取样运行消耗额度的命令。

## fallback

- 与 `claude5` 的 fallback 关系待证；未登记切换关系。

## Herdr 启动

- `herdr pane run` 后自动识别并 rename；原因是 claude kind 的 PATH shim 坑，见 `knowledge/herdr-派活操作.md`。
- 拉起方式约束：必须经 `herdr pane run` 的 shell 拉起，再自动识别/rename；不直接 spawn PATH shim。

## Linux

- 延后（DHR-B-22 调整①）。
- `supported_platforms:["win32"]` 是「Linux 未证·延后（B-22①）」的保守表达，非否定结论；P6 阶段闸裁决后需回填。

## 不可证项汇总

- quota 样本、claude5 fallback 关系、Linux 入口。
