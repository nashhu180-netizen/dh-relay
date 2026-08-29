<!-- dh:v1 · workspace/DHR_32/task_plan.md · 施工说明书（worker 可照做粒度） -->
# DHR_32 · 施工说明书

> 执行者：headless worker（codex gpt-5.6-terra high，Herdr 交互终端，cwd = `.dh-worktrees/DHR_32`）。
> 先读任务树根 `AGENTS.md` 编排协议段自我约束：你是 worker 不是主控，只做本卡，跑偏只记 progress，卡住写 findings 后停。
> 边界与脱敏白名单以 `brief.md` 为准，本文件只给步骤。

## Context Packet

- 仓库：dh-relay（PowerShell 7 + Node/TS relay-core）。本卡不动存量业务代码，只新建 `relay-core/profiles/**` + 一个测试文件 + 本工作区 evidence。
- 测试跑法：`cd relay-core && npm test`（node --test，自动拾取 `test/*.test.mjs`）。存量测试必须保持全绿。
- 参考：`relay-core/contracts/` 里的 schema 风格（draft 2020-12、`additionalProperties:false`、`$id`）；`docs/modules/dh-relay/knowledge/herdr-派活操作.md`（五入口的 Herdr 启动方式实测已有部分结论，可引用）。
- 本机审计工具：PowerShell `Get-Command <名> -All`、`where.exe`、各 CLI `--version` / `--help`。

## 步骤 1 · 五入口逐个审计（产出 evidence/audit-<alias>.md × 5）

对 `codex`、`codex-ninth`、`claude`、`claude-grok`、`claude5` 五个别名，逐个执行并把结果写进 `docs/modules/dh-relay/workspace/DHR_32/evidence/audit-<alias>.md`（模板见下）。**查不到的项写「不可证」，禁止猜。**

每个别名做：

1. **命令解析**：`Get-Command <alias> -All | Format-List Name,CommandType,Source`；若是 `.cmd`/`.ps1` shim，用 `Get-Content` 读 shim 正文（shim 属非敏感结构，可全文引用，但**若 shim 内出现 token/key 值一律以 `<REDACTED>` 替换**，只保留变量名与结构）。记录最终真实可执行文件路径。
2. **版本与产品**：`<alias> --version`（claude 系列若卡交互则用 `--version` 单独进程）；记录产品（Codex CLI / Claude Code / 网关壳）与版本号。
3. **配置来源**：列配置目录文件清单（`ls ~/.codex`、`ls ~/.claude` 等，只记文件名与大小，不 cat 凭据文件）；对 `config.toml` / `settings.json` 只摘录**非敏感字段**（模型名、profile 节名、baseUrl 域名部分、feature 开关）；`auth.json` 类文件只登记「存在 + 顶层字段名」（用 `jq keys` 或 PowerShell `ConvertFrom-Json | Get-Member` 取字段名，**不输出值**）。
4. **账号身份信号**：codex 用 `codex login status`（或 `--help` 里等价命令）；claude 用配置内的账号主体字段名与掩码值。邮箱/组织统一掩码：保留首 2 字符 + `***` + 域名（如 `hy***@gmail.com`）。给每个入口起 `account_alias`（如 `acct-codex-main` / `acct-codex-ninth` / `acct-claude-main` / `acct-grok-gw` / `acct-claude5`）。
5. **能力位**（逐项给出「支持/不支持/不可证」+ 依据命令行开关）：
   - `interactive`（TUI 可交互）
   - `resume`（会话续接：codex `resume`/`--continue`、claude `--resume/--continue`）
   - `readonly`（codex `--sandbox read-only`；claude 侧如无等价机器只读则标不支持并注明「侦测型只读」不算）
   - `headless`（codex `exec`、claude `-p/--print`）
   - `structured_result`（`--output-format json` 之类）
   - `user_input_passthrough`（Herdr `agent prompt`/`send-keys` 可达，引用 herdr-派活操作.md 实测）
6. **quota 样本**：只从既有输出/文档找真实样文（如 claude-grok 的 502 记录、codex 的 rate limit 报错样式）；找不到就写「样本缺，不可证」。**不要为了造样本去烧额度。**
7. **fallback 关系**：只登记「预登记候选」事实（如 codex 主号 ↔ codex-ninth 互为备选、claude 主号与 claude5 关系待证），不做切换逻辑。
8. **Herdr 启动方式**：codex 系 = `herdr agent start --kind codex`（直接可用）；claude 系 = `herdr pane run` + 自动识别 + rename（PATH shim 坑）。引用 knowledge/herdr-派活操作.md，不重测。
9. **Linux 入口**：一律写「延后（DHR-B-22 调整①）」。

evidence 模板（每份都用）：

```markdown
# audit-<alias>（2026-08-29 · 脱敏）
## 命令解析 / ## 版本与产品 / ## 配置来源 / ## 身份信号 / ## 能力位 / ## quota 样本 / ## fallback / ## Herdr 启动 / ## Linux
## 不可证项汇总
```

## 步骤 2 · Profile schema（Create `relay-core/profiles/executor-profile.schema.json`）

- JSON Schema draft 2020-12，`$id: "relay/executor-profile.v1"`。
- 顶层：`{ "profiles": [ <entry>... ] }`，`additionalProperties:false`。
- entry 必填：`executor_profile_id`（pattern `^(herdr|process|pi-agent)\.[a-z0-9-]+\.[a-z0-9-]+$`）、`backend`（enum：`herdr`/`process`/`pi-agent`）、`product`（enum：`codex-cli`/`claude-code`/`unverified`）、`command_alias`、`account_alias`、`capabilities`（对象：`interactive/resume/readonly/headless/structured_result/user_input_passthrough`，值 enum `supported/unsupported/unproven`）、`supported_platforms`（数组，enum `win32`/`linux`）、`headless_supported`（boolean）。
- 可选：`expected_identity`（只允许掩码形态：pattern 强制含 `***`，防真实邮箱入册）、`config_fingerprint_rule`、`quota_detector_id`、`fallback_profile_ids`。
- entry 级 `additionalProperties:false` ——字段闭集即 brief 白名单，**多一个字段都不行**。

## 步骤 3 · 校验器（Create `relay-core/profiles/validate-profiles.mjs`）

- 复用 relay-core 既有 ajv 依赖形式（参照 `tools/validate.mjs` 的引入方式，但**不要改动 tools/ 下任何文件**）。
- 导出 `validateProfiles(json) -> { ok, errors }`，规则：
  1. schema 校验（fail-closed：未知字段、未知枚举即错）。
  2. **凭据字段名黑名单拒收**：任何层级出现 key 匹配 `/token|api[_-]?key|cookie|secret|password|authorization|bearer/i` → 直接 `ok:false`，error code `E_CREDENTIAL_FIELD`。
  3. **凭据值模式拒收**：任何字符串值匹配 `/(sk-[A-Za-z0-9]{8,}|eyJ[A-Za-z0-9_-]{10,}|Bearer\s+\S+|[A-Fa-f0-9]{40,})/` → `ok:false`，error code `E_CREDENTIAL_VALUE`。
  4. `fallback_profile_ids` 引用必须能在本注册表内解析，否则 `E_DANGLING_FALLBACK`。
- CLI 入口：`node profiles/validate-profiles.mjs <文件路径>`，exit 0/1。

## 步骤 4 · fixture（Create `relay-core/profiles/fixtures/`）

- `golden-registry.json`：脱敏后的真实五入口注册表候选（步骤 1 事实的机读版；`unproven` 如实标）。
- `negative-credential-field.json`（带 `api_key` 字段）、`negative-credential-value.json`（expected_identity 塞一个假 `sk-xxxxxxxxxxxx`）、`negative-dangling-fallback.json`、`negative-unknown-field.json` —— 各配 `.expect.json` 写死期望 error code（参照 `fixtures/negative/` 的既有做法，但放在 `profiles/fixtures/` 下，**不进冻结 fixture 目录、不动 manifest**）。

## 步骤 5 · 测试（Create `relay-core/test/profiles.test.mjs`）

- node --test 风格（参照 `test/contracts.test.mjs` 的结构）。断言：
  1. golden 过校验。
  2. 四份 negative 各命中期望 error code。
  3. golden 内不含黑名单字段名、不含凭据值模式（对整个 JSON 文本再扫一遍）。
- **有效单测登记（写入 progress.md）**：变异点 = `validate-profiles.mjs` 中 `E_CREDENTIAL_FIELD` 的黑名单检查（把该分支注释/短路），指定测试 = `test/profiles.test.mjs` 的 negative-credential-field 断言，期望 = 变异后必红（断言失败）。实际做法：临时改坏 → 跑测试记录红 → 还原 → 跑测试记录绿，三步输出都贴进 progress.md。

## 步骤 6 · 用户级注册表候选（仓外）

- 把 `golden-registry.json` 内容写到 `~/.dh-relay/executor-profiles.json`（`C:\Users\nash\.dh-relay\executor-profiles.json`）。
- 在 evidence 里登记该路径 + 文件 sha256（`Get-FileHash`）。

## 步骤 7 · 凭据扫描（双证之一）

在工作树根执行并把命令+输出贴进 progress.md：

```powershell
rg -n -e "sk-[A-Za-z0-9]{8,}" -e "eyJ[A-Za-z0-9_-]{10,}" -e "Bearer " -e "api[_-]?key" -e "(?i)token" --glob "docs/modules/dh-relay/workspace/DHR_32/**" --glob "relay-core/profiles/**"
```

- 期望：命中只允许是黑名单规则/文档自述（如 validate 器源码、本说明书），零真实凭据。逐条命中要在 progress.md 给一句归类说明。

## 步骤 8 · 回归与收尾

1. `cd relay-core && npm test` 全绿（存量 + 新增）。
2. `node tools/audit-contracts.mjs` 仍 0 违规（本卡没动 contracts，跑一遍证明零漂移）。
3. `git add` 只加 allowed-paths 内文件；`git commit -m "feat(dh-relay): DHR_32 executor profile 审计与注册表候选（wt/DHR_32）"`。
4. 在 `progress.md` 末尾写结构化 DONE 段：`## DONE`（完成条件逐条自评 + 证据指针 + 未决/不可证清单）。**不改 DevPlan、不进入复核、不删 worktree。**

## 卡住怎么办

写 `findings.md` 一条 `BLOCKED-<序号>`（现象 + 已试 + 需要什么），然后在 `progress.md` 记「blocked」，停在原地等主控，不要回头问、不要越界自救。
