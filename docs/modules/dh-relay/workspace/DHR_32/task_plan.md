<!-- dh:v1 · workspace/DHR_32/task_plan.md · 施工说明书（worker 可照做粒度） -->
# DHR_32 · 施工说明书

> 执行者：headless worker（codex gpt-5.6-terra high，Herdr 交互终端，cwd = `.dh-worktrees/DHR_32`）。
> 先读任务树根 `AGENTS.md` 编排协议段自我约束：你是 worker 不是主控，只做本卡，跑偏只记 progress，卡住写 findings 后停。
> 边界与脱敏白名单以 `brief.md` 为准，本文件只给步骤。

## Context Packet

- 仓库：dh-relay（PowerShell 7 + Node/TS relay-core）。本卡不动存量业务代码，只新建 `relay-core/profiles/**` + 一个测试文件 + 本工作区 evidence。
- 测试跑法：`cd relay-core && npm test`。**注意：`package.json` 的 `test` 脚本是显式文件清单（17 个文件写死，不通配）**——你必须按 brief 授权在 `scripts.test` 末尾追加 ` test/profiles.test.mjs` 一个 token（只许这一处改动），否则新测永远不会被跑到。新测单跑用 `cd relay-core && node --test test/profiles.test.mjs`。存量测试必须保持全绿。
- 路径基准：brief 的 allowed-paths 均相对工作树根；下面每步命令注明执行目录，注意步骤间 `cd` 切换。
- 参考：`relay-core/contracts/` 里的 schema 风格（draft 2020-12、`additionalProperties:false`、`$id`）；`docs/modules/dh-relay/knowledge/herdr-派活操作.md`（五入口的 Herdr 启动方式实测已有部分结论，可引用）。
- 本机审计工具：PowerShell `Get-Command <名> -All`、`where.exe`、各 CLI `--version` / `--help`。

## 步骤 1 · 五入口逐个审计（产出 evidence/audit-<alias>.md × 5）

对 `codex`、`codex-ninth`、`claude`、`claude-grok`、`claude5` 五个别名，逐个执行并把结果写进 `docs/modules/dh-relay/workspace/DHR_32/evidence/audit-<alias>.md`（模板见下）。**查不到的项写「不可证」，禁止猜。**

每个别名做：

1. **命令解析**（执行目录：任意）：`Get-Command <alias> -All | Format-List Name,CommandType,Source`；若是 `.cmd`/`.ps1` shim，可 `Get-Content` 读其正文来理解，但 **shim 正文默认不入 evidence**——只登记：①最终真实可执行文件路径（家目录写 `~` 或 `%USERPROFILE%`，不出现真实用户名）；②shim 内出现的环境变量**名**清单（只名不值）；③控制流骨架一句话描述（几行、是否转发参数、是否设 baseUrl）。确需引用某一行时，该行必须先人工比对步骤 7 的五条凭据正则，命中即不得引用。
2. **版本与产品**：`<alias> --version`（claude 系列若卡交互则用 `--version` 单独进程）；记录产品（Codex CLI / Claude Code / 网关壳）与版本号。
3. **配置来源**：列配置目录文件清单（`ls ~/.codex`、`ls ~/.claude` 等，只记文件名与大小，不 cat 凭据文件）。**配置目录一律只读**：禁止任何写入/重命名/删除，禁止 `--login`/`--logout` 类会触发凭据刷新的子命令。`config.toml` / `settings.json` 与 `auth.json` **同级处理**：默认只登记顶层/节名与字段名（`jq keys` 或 `ConvertFrom-Json | Get-Member`，不输出值）；需摘录值时逐个对照允许清单 = 模型名、profile/节名、URL 的 `scheme://host`（剥掉 userinfo/path/query/fragment）、布尔型 feature 开关；黑名单键路径只记键名不记值：`env` / `http_headers` / `headers` / `env_key` / `apiKeyHelper` / `*.token` / `*.key`。
4. **账号身份信号**：codex 用 `codex login status`（只读 status 命令；执行前在 progress 登记「该命令为只读查询、不触发凭据刷新」；如发现它会写回配置则改用 `--help` 推断并标不可证）；claude 用配置内的账号主体字段名与掩码值。邮箱/组织统一掩码：保留首 2 字符 + `***` + 域名（如 `hy***@gmail.com`）。给每个入口起 `account_alias`（如 `acct-codex-main` / `acct-codex-ninth` / `acct-claude-main` / `acct-grok-gw` / `acct-claude5`）。
5. **能力位**（逐项给出「支持/不支持/不可证」+ 依据命令行开关）：
   - `interactive`（TUI 可交互）
   - `resume`（会话续接：codex `resume`/`--continue`、claude `--resume/--continue`）
   - `readonly`（codex `--sandbox read-only`；claude 侧如无等价机器只读则标不支持并注明「侦测型只读」不算）
   - `headless`（codex `exec`、claude `-p/--print`）
   - `structured_result`（`--output-format json` 之类）
   - `user_input_passthrough`（Herdr `agent prompt`/`send-keys` 可达，引用 herdr-派活操作.md 实测）
6. **quota 样本**：只从既有输出/文档找真实样文（如 claude-grok 的 502 记录、codex 的 rate limit 报错样式）；找不到就写「样本缺，不可证」。**不要为了造样本去烧额度。** 样文脱敏：剔除 token / 请求头 / `request_id` / `organization_id` / 账号邮箱 / 完整 endpoint 路径，只保留 HTTP 状态码、错误码、可复用的错误短语模式。
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
- 可选：`expected_identity`（只允许掩码形态：pattern 强制含 `***`，防真实邮箱入册）、`config_fingerprint_rule`（**定形对象**：`{"kind":"file-exists","path_template":"${USERPROFILE}/.codex/config.toml","fields":["model","profiles"]}`——`kind` enum 暂只 `file-exists`，`path_template` pattern 禁止出现 `C:\\Users\\` 等真实用户名字面量、只允许 `${VAR}` 环境变量占位，`fields` 为字符串数组）、`quota_detector_id`、`fallback_profile_ids`。
- entry 级 `additionalProperties:false` ——字段闭集即 brief 白名单，**多一个字段都不行**。

## 步骤 3 · 校验器（Create `relay-core/profiles/validate-profiles.mjs`）

- ajv 装配直接复用：`import { loadAjv } from '../tools/validate.mjs'`（`relay-core` 已声明 `ajv ^8.20.0` / `ajv-formats ^3.0.1`，无需装任何新包）；**只读引用，禁止修改 `relay-core/tools/` 下任何文件，禁止改 `package.json`/`package-lock.json` 依赖段**。
- 导出 `validateProfiles(json) -> { ok, errors }`，规则：
  1. schema 校验（fail-closed：未知字段、未知枚举即错）。
  2. **凭据字段名黑名单拒收**：任何层级出现 key 匹配 `/token|api[_-]?key|cookie|secret|password|authorization|bearer/i` → 直接 `ok:false`，error code `E_CREDENTIAL_FIELD`。
  3. **凭据值模式拒收**（五条正则，与步骤 7 的 rg 命令保持同一组）：任何字符串值匹配 `sk-[A-Za-z0-9_-]{16,}`、`eyJ[A-Za-z0-9_-]{10,}`、`Bearer\s+\S+`、`[A-Fa-f0-9]{40,}`（hex 长串）、`[A-Za-z0-9+/_-]{40,}={0,2}`（base64/base64url 长串）之一 → `ok:false`，error code `E_CREDENTIAL_VALUE`。（最后一条对 sha256 等有噪声：注册表内本就不该出现 40+ 位连续串，命中即拒是预期行为。）
  4. `fallback_profile_ids` 引用必须能在本注册表内解析，否则 `E_DANGLING_FALLBACK`。
  5. **`E_UNRESOLVED_CONFIG`**：`config_fingerprint_rule.path_template` 展开环境变量后路径必须存在（`fs.existsSync`），否则报此错。
  6. **`E_UNRESOLVED_ALIAS`**（BLOCKED-1 裁决①修订，2026-08-29 主控）：`command_alias` 必须可解析，判定为**两级**——先 `where.exe <alias>` 退出码 0；不中则退到受控只读解析 `pwsh -NoLogo -Command "Get-Command <alias> -ErrorAction Stop | Out-Null"` 退出码 0（覆盖 PowerShell Function/alias 形态，与 herdr pane run 经 shell 拉起的真实执行语义一致）；两级都不中才报此错。实现为可选检查（`{ resolveAlias: false }` 可跳过，测试里对 golden 开启）。evidence 里对每个入口登记解析形态（executable / cmd-shim / ps1-shim / function）。
  7. `headless_supported` 必须与 `capabilities.headless === "supported"` 一致；不一致按 schema 类错误拒收。此规则由 rework-1 补入实现，DHR_62 治理补回施工合同索引。
- CLI 入口：`node profiles/validate-profiles.mjs <文件路径>`，exit 0/1。

## 步骤 4 · fixture（Create `relay-core/profiles/fixtures/`）

- `golden-registry.json`：脱敏后的真实五入口注册表候选（步骤 1 事实的机读版；`unproven` 如实标）。
- `negative-credential-field.json`（带 `api_key` 字段）、`negative-credential-value.json`（expected_identity 塞一个假 `sk-ant-api03-xxxxxxxxxxxxxxxx` 形态串，验证 `sk-` 后带连字符也命中）、`negative-dangling-fallback.json`、`negative-unknown-field.json`、`negative-unresolved-config.json`（path_template 指向必不存在的路径）—— 各配 `.expect.json` 写死期望 error code（参照 `fixtures/negative/` 的既有做法，但放在 `profiles/fixtures/` 下，**不进冻结 fixture 目录、不动 manifest**）。

## 步骤 5 · 测试（Create `relay-core/test/profiles.test.mjs`）

- node --test 风格（参照 `test/contracts.test.mjs` 的结构）。断言：
  1. golden 过校验（含 `resolveAlias: true` 与 `E_UNRESOLVED_CONFIG` 路径检查，即 golden 里每条 entry 的 alias/config 都真实可解析）。
  2. 五份 negative 各命中期望 error code。
  3. golden 内不含黑名单字段名、不含五条凭据值模式（对整个 JSON 文本再扫一遍）。
  4. **能力位↔依据交叉断言**（P2-4 裁决）：维护一张 `能力位 → 期望开关正则` 表（如 `readonly → /--sandbox\s+read-only/`、`headless → /\bexec\b|-p\b|--print/`、`resume → /--resume|--continue|\bresume\b/`）；对 golden 里每个值为 `supported` 的能力位，对应 `docs/modules/dh-relay/workspace/DHR_32/evidence/audit-<command_alias>.md` 文本中必须能匹配到该开关正则，匹配不到即断言失败——防止证据不足时随手标 supported。
- **有效单测登记（写入 progress.md）**：变异点 = `validate-profiles.mjs` 中 `E_CREDENTIAL_FIELD` 的黑名单检查（把该分支注释/短路），指定测试 = `test/profiles.test.mjs` 的 negative-credential-field 断言，期望 = 变异后必红（断言失败）。实际做法：改坏前 `Get-FileHash relay-core/profiles/validate-profiles.mjs` 记 sha256 → 临时改坏 → 跑测试记录红 → 还原 → 再算一次 sha256（**两值必须相同**）→ 跑测试记录绿；哈希与三段输出全部贴进 progress.md。测试命令用 `cd relay-core && node --test test/profiles.test.mjs`。

## 步骤 6 · 用户级注册表候选（仓外）

- 把 `golden-registry.json` 内容写到 `%USERPROFILE%\.dh-relay\executor-profiles.json`。
- 写入前 `Test-Path`：若已存在，先复制为 `executor-profiles.json.bak-<yyyyMMdd-HHmm>` 并在 progress 登记原文件 sha256，再写新文件。
- 在 evidence 里登记该路径（写 `%USERPROFILE%` 形态，不落真实用户名）+ 文件 sha256（`Get-FileHash`）。

## 步骤 7 · 凭据扫描（双证之一）

两跑都贴进 progress.md（命令 + 输出）：

①仓内（执行目录：工作树根）：

```powershell
rg -n -e "sk-[A-Za-z0-9_-]{16,}" -e "eyJ[A-Za-z0-9_-]{10,}" -e "Bearer \S+" -e "[A-Fa-f0-9]{40,}" -e "[A-Za-z0-9+/_-]{40,}={0,2}" -e "api[_-]?key" -e "(?i)token" --glob "docs/modules/dh-relay/workspace/DHR_32/**" --glob "relay-core/profiles/**" --glob "relay-core/test/profiles.test.mjs"
```

②仓外注册表本体（被验收的文件必须被扫到）：

```powershell
rg -n -e "sk-[A-Za-z0-9_-]{16,}" -e "eyJ[A-Za-z0-9_-]{10,}" -e "Bearer \S+" -e "[A-Fa-f0-9]{40,}" -e "[A-Za-z0-9+/_-]{40,}={0,2}" "$env:USERPROFILE\.dh-relay\executor-profiles.json"; Get-FileHash "$env:USERPROFILE\.dh-relay\executor-profiles.json"
```

- 期望：仓内命中只允许是黑名单规则/文档自述/测试样例（如 validate 器源码、本说明书、negative fixture）；base64 长串正则命中 sha256 登记值属预期噪声。**逐条命中在 progress.md 归类**（规则自述 / 测试样例 / 哈希噪声 / 其他——「其他」即失败）。仓外那跑期望零命中（rg 无命中时退出码 1，属预期，注明即可）。

## 步骤 8 · 回归与收尾

1. `cd relay-core && npm test` 全绿（此时 `scripts.test` 已含 `test/profiles.test.mjs`，全绿即覆盖新增）；另单跑 `node --test test/profiles.test.mjs`，两条命令输出都贴 progress。
2. `node tools/audit-contracts.mjs`（执行目录 `relay-core/`）仍 0 违规（本卡没动 contracts，跑一遍证明零漂移）。
3. 提交前 `git status --short` 贴 progress；出现 allowed-paths 外的条目**立即停**并写 findings。`git diff relay-core/profiles/validate-profiles.mjs --stat` 确认相对有效单测「红测前」无残留差异。
4. 只允许 `git add <allowed-paths 内的具体文件>` 与 `git commit -m "feat(dh-relay): DHR_32 executor profile 审计与注册表候选（wt/DHR_32）"`。**禁止 `git push` / `checkout` 切分支 / `rebase` / `reset --hard` / 任何对 master 的操作。**
5. 在 `progress.md` 末尾写结构化 DONE 段：`## DONE`（完成条件逐条自评 + 证据指针 + 未决/不可证清单）。**不改 DevPlan、不进入复核、不删 worktree。**

## 卡住怎么办

写 `findings.md` 一条 `BLOCKED-<序号>`（现象 + 已试 + 需要什么），然后在 `progress.md` 记「blocked」，停在原地等主控，不要回头问、不要越界自救。
