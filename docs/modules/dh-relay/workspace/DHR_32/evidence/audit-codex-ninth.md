# audit-codex-ninth（2026-08-29 · 脱敏）

## 命令解析

- 解析形态：`function`；PATH 同时可解析到 `cmd-shim` `%USERPROFILE%\\bin\\codex-ninth.cmd`。
- Function 为 9 行，设置环境变量名 `CODEX_HOME` 后转发参数并委派 Codex CLI；未收录 shim 正文或变量值。
- 两级解析中，`where.exe codex-ninth` 成功，故校验器不需 PowerShell fallback；同时 `Get-Command` 还可见同名 Function，二者是两种可用入口形态。

## 版本与产品

- `codex-ninth --version`：`codex-cli 0.150.1`，产品为 Codex CLI。

## 配置来源

- shim 指向的独立配置根存在（证据中以 `%CLI_PROXY_HOME%\\codex-ninth` 脱敏）；只读列名确认有 `config.toml`、`hooks.json`、本地状态文件及缓存目录。
- `config.toml` 存在；未读取任何配置或认证值。
- 配置指纹不可证：配置根仅经 shim 内部变量可达，仓外未冻结该环境变量，故注册表不存 `config_fingerprint_rule`。

## 身份信号

- 已先在 progress 登记只读理由后执行 `codex-ninth login status`；返回「Not logged in」。`expected_identity` 不可证。
- `account_alias`：`acct-codex-ninth`。

## 能力位

- `interactive`：支持；Help 说明未给子命令时转发至 interactive CLI。
- `resume`：支持；Help 列出 `resume`。
- `readonly`：支持；Help 列出 `--sandbox read-only`。
- `headless`：支持；Help 列出 `exec`。
- `structured_result`：支持；同版本 `codex exec --help` 列出 `--json`。
- `user_input_passthrough`：支持；Herdr 操作记录列出 `agent prompt` / `send-keys`。

## quota 样本

- 样本缺，不可证；未为取样运行消耗额度的命令。

## fallback

- 预登记候选：`herdr.codex.main`；未实现切换逻辑。

## Herdr 启动

- `herdr agent start --kind codex`；见 `knowledge/herdr-派活操作.md`。
- 拉起方式约束：若解析到 Function，必须经 PowerShell shell；若显式使用 `where.exe` 命中的 `.cmd` shim，可由支持 cmd shim 的启动器直接执行，但该直接执行形态本卡未实测，须在 DHR_35 真实闭环时验证。不得把 Function 形态当作唯一入口。

## Linux

- 延后（DHR-B-22 调整①）。
- `supported_platforms:["win32"]` 是「Linux 未证·延后（B-22①）」的保守表达，非否定结论；P6 阶段闸裁决后需回填。

## 不可证项汇总

- 账号主体、登录态以外的身份信号、quota 样本、Linux 入口。
