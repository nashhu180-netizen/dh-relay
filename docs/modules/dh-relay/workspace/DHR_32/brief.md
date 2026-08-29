<!-- dh:v1 · workspace/DHR_32/brief.md -->
# DHR_32 · 审计本机 Codex/Claude 多账号并冻结 Executor Profile 注册表 — Brief

> 出处（唯一权威）：[dev_plan/P6-Herdr多账号执行底座-开发方案.md](../../dev_plan/P6-Herdr多账号执行底座-开发方案.md) §3.2 DHR_32。本文件是只读副本；口径冲突以 DevPlan 为准。
> 档位：标准。任务类型：**normal**（代码轮1 + 需求方向 + 教训 + 有效单测）。
> 执行者：headless/交互 worker——codex `gpt-5.6-terra`（reasoning high），经 Herdr 交互终端派发；复核 claude opus。

## 目标（一句话）

对本机五类 AI 入口（`codex / codex-ninth / claude / claude-grok / claude5`，别名仅为用户已知叫法，真实映射由审计取得）逐一做**事实审计**，产出脱敏的 Executor Profile 注册表候选与 schema，冻结 Profile 稳定 ID。

## 完成条件（验收口径逐字复制自 DevPlan）

1. **机器证**：[design/02 B4](../../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)（注册表条目解析到真实 cli/config_dir、脱敏账号主体与 expected_identity 匹配）· 本计划 P6-M2：每个启用 Profile 有可重复身份探测或明确标记不可证；不可证身份的 Profile 不用于要求账号身份的验收。
2. **机器证**：[design/05 §7.1 Executor Profile 示例](../../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#71-executor-profile-示例)：注册表只含 §2.3 允许字段；Token / API Key / Cookie / 认证材料零出现（扫描 + 白名单脱敏双证）。
3. **机器证**：审计工件零凭据；路径与环境输出经白名单脱敏（承接 AGENTS 宪章#6）。
4. **机器证**：[design/02 B15 ⑤](../../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)：每个 Profile 的 `readonly` 等能力位对应到真实 CLI 实现（如 codex `--sandbox read-only`），不支持者明确标不支持。

## 审计读取范围与脱敏白名单（已由 `DHR-B-22` 调整②冻结，worker 必须照办）

- **允许读取**：CLI 入口与 shim 链（`Get-Command`/`where.exe`）、`--version`/`--help` 输出、配置目录**文件名清单与非敏感结构**、账号主体标识（入册前掩码为别名，如 `hyf***@gmail.com` → `acct-codex-a`）、模型清单与能力位、quota 报错样文（剔除 token/请求头）。
- **禁止**：读取/复制/引用 `auth.json`、token、cookie、API key 的**值**（只可登记「文件存在、含哪些字段名」）；环境变量只登记**变量名**；任何证据入仓前跑凭据模式扫描并把命令与结果记入 progress。
- **注册表可存字段闭集**（超集即违规）：`executor_profile_id / backend / product / command_alias / account_alias / capabilities / expected_identity / config_fingerprint_rule / quota_detector_id / fallback_profile_ids / supported_platforms / headless_supported`。

## 非目标 / 硬边界

- 不猜测任何配置；查不到、证不了的一律写「不可证」，不许编。
- 不写任何凭据值；不做 Herdr Adapter（DHR_33）；不决定 `claude5` 等别名的产品归属（由证据决定）。
- **Linux 入口列一律记「延后」**（用户 2026-08-29 指示跳过 Linux，见 `DHR-B-22` 调整①）。
- **禁改**：`relay-core/contracts/**`、`relay-core/fixtures/**`、三份基线（fixture-manifest / capability-baseline / structural-tokens）、`relay-core/store|runtime|rpc|cli|adapters|workflows/**`、仓根 `tools/**`、DevPlan 与本工作区外的一切 docs。
- **允许新建/修改**（allowed-paths）：
  - `relay-core/profiles/**`（新目录：schema + 校验器 + fixture）
  - `relay-core/test/profiles.test.mjs`
  - `docs/modules/dh-relay/workspace/DHR_32/**`（evidence / progress / findings）
  - 用户级注册表候选**不入仓**，落 `~/.dh-relay/executor-profiles.json`（路径本卡冻结）。

## 交付物清单

1. `workspace/DHR_32/evidence/audit-<alias>.md` × 5（脱敏审计工件）。
2. `relay-core/profiles/executor-profile.schema.json`（字段闭集、`additionalProperties:false`）+ `relay-core/profiles/validate-profiles.mjs` 校验器 + golden/negative fixture。
3. `~/.dh-relay/executor-profiles.json` 注册表候选（仓外）+ 仓内 fixture 形式的脱敏副本。
4. `relay-core/test/profiles.test.mjs`（含「凭据字段必拒」断言，登记有效单测变异点）。
5. `progress.md` 记凭据扫描命令与结果；`findings.md` 记范围外发现。
