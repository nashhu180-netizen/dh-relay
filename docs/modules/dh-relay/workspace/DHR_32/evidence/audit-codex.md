# audit-codex（2026-08-29 · 脱敏）

## 命令解析

- 解析形态：`function`；PATH 同时可解析到 `cmd-shim` `%USERPROFILE%\\.local\\bin\\codex.cmd`。
- Function 为 3 行、转发参数并委派 Codex CLI；无 shim 环境变量。未收录 shim 正文。
- 两级解析中，`where.exe codex` 成功，故不需 PowerShell fallback。

## 版本与产品

- `codex --version`：`codex-cli 0.150.1`，产品为 Codex CLI。

## 配置来源

- 配置目录：`%USERPROFILE%\\.codex`（只读）。存在 `config.toml`、`auth.json`、模型缓存及本地状态文件。
- `config.toml` 仅登记节名/字段名：`model`、`model_reasoning_effort`、`sandbox_mode`、`profiles`；发现黑名单字段名 `env_key`，未读取任何值。
- `auth.json` 存在，字段名含 `auth_mode`、`OPENAI_API_KEY`、`tokens`；未读取任何值。

## 身份信号

- 已先在 progress 登记只读理由后执行 `codex login status`；返回「Logged in using ChatGPT」。未返回可安全入册的账号主体，故 `expected_identity` 不可证。
- `account_alias`：`acct-codex-main`。

## 能力位

- `interactive`：支持；Help 说明未给子命令时转发至 interactive CLI。
- `resume`：支持；Help 列出 `resume`。
- `readonly`：支持；Help 列出 `--sandbox read-only`。
- `headless`：支持；Help 列出 `exec`。
- `structured_result`：支持；`codex exec --help` 列出 `--json`。
- `user_input_passthrough`：支持；Herdr 操作记录列出 `agent prompt` / `send-keys`。

## quota 样本

- 样本缺，不可证；未为取样运行消耗额度的命令。

## fallback

- 预登记候选：`herdr.codex.ninth`；未实现切换逻辑。该入口当前未登录，系预登记候选而非可用备选；DHR_33 切换前必须先验登录态。

## Herdr 启动

- `herdr agent start --kind codex`；见 `knowledge/herdr-派活操作.md`。
- 拉起方式约束：可经 `herdr agent start --kind codex` 直接 spawn。

## Linux

- 延后（DHR-B-22 调整①）。
- `supported_platforms:["win32"]` 是「Linux 未证·延后（B-22①）」的保守表达，非否定结论；P6 阶段闸裁决后需回填。

## 不可证项汇总

- 脱敏账号主体、quota 样本、Linux 入口。
