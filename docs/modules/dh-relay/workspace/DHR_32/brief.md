<!-- dh:v1 · workspace/DHR_32/brief.md -->
# DHR_32 · 审计本机 Codex/Claude 多账号并冻结 Executor Profile 注册表 — Brief

> 出处（唯一权威）：[dev_plan/P6-Herdr多账号执行底座-开发方案.md](../../dev_plan/P6-Herdr多账号执行底座-开发方案.md) §3.2 DHR_32。本文件是只读副本；口径冲突以 DevPlan 为准。
> 档位：标准。任务类型：**normal**（代码轮1 + 需求方向 + 教训 + 有效单测）。
> 执行者：headless/交互 worker——codex `gpt-5.6-terra`（reasoning high），经 Herdr 交互终端派发；复核 claude opus。

## 目标（一句话）

对本机五类 AI 入口（`codex / codex-ninth / claude / claude-grok / claude5`，别名仅为用户已知叫法，真实映射由审计取得）逐一做**事实审计**，产出脱敏的 Executor Profile 注册表候选与 schema，冻结 Profile 稳定 ID。

## 完成条件（验收口径逐字复制自 DevPlan）

1. **机器证**：[design/02 B4](../../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)（注册表条目解析到真实 cli/config_dir、脱敏账号主体与 expected_identity 匹配）· 本计划 P6-M2：每个启用 Profile 有可重复身份探测或明确标记不可证；不可证身份的 Profile 不用于要求账号身份的验收。
2. **机器证**：[design/05 §7.1 Executor Profile 示例](../../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#71-executor-profile-示例)：注册表只含 §2.3 允许字段（§2.3 = 本文件「注册表可存字段闭集」一节，逐字同源于 DevPlan §2.3）；Token / API Key / Cookie / 认证材料零出现（扫描 + 白名单脱敏双证）。
3. **机器证**：审计工件零凭据；路径与环境输出经白名单脱敏（承接 AGENTS 宪章#6）。
4. **机器证**：[design/02 B15 ⑤](../../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)：每个 Profile 的 `readonly` 等能力位对应到真实 CLI 实现（如 codex `--sandbox read-only`），不支持者明确标不支持。

## 审计读取范围与脱敏白名单（已由 `DHR-B-22` 调整②冻结，worker 必须照办）

- **允许读取**：CLI 入口与 shim 链（`Get-Command`/`where.exe`）、`--version`/`--help` 输出、配置目录**文件名清单与非敏感结构**、账号主体标识（入册前掩码为别名，如 `hyf***@gmail.com` → `acct-codex-a`）、模型清单与能力位、quota 报错样文（脱敏规则见下）。
- **禁止**：读取/复制/引用 `auth.json`、token、cookie、API key 的**值**（只可登记「文件存在、含哪些字段名」）；环境变量只登记**变量名**；任何证据入仓前跑凭据模式扫描并把命令与结果记入 progress。
- **shim 正文默认不入仓**（B-22 预审 P1-6 裁决）：只登记①调用的真实可执行文件路径（按下方路径掩码规则）②出现的环境变量**名**清单③控制流骨架的自然语言描述（几行、是否转发参数、是否设 baseUrl）。确需引用某行时逐行判定，且该行必须先过步骤 7 的五条凭据正则。
- **`config.toml` / `settings.json` 与 `auth.json` 同级处理**（P2-6 裁决）：默认只登记顶层/节名与字段名；需摘录值时逐个对照允许清单 = 模型名、profile/节名、URL 的 `scheme://host`（强制剥掉 userinfo/path/query/fragment）、布尔型 feature 开关。黑名单键路径一律只记键名不记值：`env`、`http_headers`、`headers`、`env_key`、`apiKeyHelper`、`*.token`、`*.key`。
- **路径掩码规则**（P2-5 裁决）：家目录一律写 `~` 或 `%USERPROFILE%`，程序目录写 `%LOCALAPPDATA%` / `%ProgramFiles%` 等标准变量；evidence 与注册表中不出现真实用户名字面量。
- **quota 样文脱敏**（P2-10 裁决）：剔除 token / 请求头 / `request_id` / `organization_id` / 账号邮箱 / 完整 endpoint 路径；只保留 HTTP 状态码、错误码、可复用的错误短语模式。
- **注册表可存字段闭集**（超集即违规）：`executor_profile_id / backend / product / command_alias / account_alias / capabilities / expected_identity / config_fingerprint_rule / quota_detector_id / fallback_profile_ids / supported_platforms / headless_supported`。
- **完成条件 1 的「解析到真实 cli/config_dir」由校验器行为承载**（P1-8 裁决方案 a，详见 DevPlan §2.3）：`config_fingerprint_rule` 定形为 `{"kind":"file-exists","path_template":"${USERPROFILE}/...","fields":[...]}`，校验器加 `E_UNRESOLVED_CONFIG` / `E_UNRESOLVED_ALIAS` 规则，不扩字段闭集。

## 非目标 / 硬边界

- 不猜测任何配置；查不到、证不了的一律写「不可证」，不许编。
- 不写任何凭据值；不做 Herdr Adapter（DHR_33）；不决定 `claude5` 等别名的产品归属（由证据决定）。
- **Linux 入口列一律记「延后」**（用户 2026-08-29 指示跳过 Linux，见 `DHR-B-22` 调整①）。
- **本机 AI 配置目录一律只读**（P1-7 裁决）：`~/.codex`、`~/.claude`、`~/.claude*`、各 shim 所在目录，禁止任何写入/重命名/删除，禁止 `--login`/`--logout` 及一切可能触发凭据刷新写回的子命令；只跑 `--version`/`--help`/只读 status 类命令，且执行前在 progress 登记该命令为何只读。
- **仓外可写点闭集 = `~/.dh-relay/` 一处**，其余仓外路径一律不可写。
- **禁改**：`relay-core/contracts/**`、`relay-core/fixtures/**`、仓根 `tools/**` **与** `relay-core/tools/**`（含 `validate.mjs` / `audit-contracts.mjs` / `forbidden-types.txt` / `structural-tokens.txt` / `fixture-manifest.mjs` / `capability-baseline.mjs` 三份基线所在地，只读引用可以、编辑不行）、`relay-core/store|runtime|rpc|cli|adapters|workflows/**`、`relay-core/package-lock.json` 与 `package.json` 依赖段、DevPlan 与本工作区外的一切 docs。
- **允许新建/修改**（allowed-paths；**闭集语义：未列出的路径一律禁改——含新建与删除；上面的禁改清单只是重点提示、不是穷举**。以下路径均相对**工作树根** `.dh-worktrees/DHR_32/`）：
  - `relay-core/profiles/**`（新目录：schema + 校验器 + fixture）
  - `relay-core/test/profiles.test.mjs`
  - `relay-core/package.json` —— **仅允许**在 `scripts.test` 命令末尾追加 ` test/profiles.test.mjs` 一个 token，不得改动其他任何键（P1-1 裁决方案 a：存量 test 脚本是显式文件清单，不追加则新测不会被 `npm test` 拾取）
  - `docs/modules/dh-relay/workspace/DHR_32/**`（evidence / progress / findings）
  - 用户级注册表候选**不入仓**，落 `~/.dh-relay/executor-profiles.json`（路径本卡冻结）。

## 交付物清单

1. `workspace/DHR_32/evidence/audit-<alias>.md` × 5（脱敏审计工件）。
2. `relay-core/profiles/executor-profile.schema.json`（字段闭集、`additionalProperties:false`）+ `relay-core/profiles/validate-profiles.mjs` 校验器 + golden/negative fixture。
3. `~/.dh-relay/executor-profiles.json` 注册表候选（仓外）+ 仓内 fixture 形式的脱敏副本。
4. `relay-core/test/profiles.test.mjs`（含「凭据字段必拒」断言，登记有效单测变异点）。
5. `progress.md` 记凭据扫描命令与结果；`findings.md` 记范围外发现。
