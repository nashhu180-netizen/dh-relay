<!-- dh:v1 -->
# DHR_63 · Progress

## 日志

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|---|---|---|---|---|
| 2026-08-30 | 主控 | 用户 D-start；建立独立 worktree，rebase 共享 B-24 基线。 | `wt/DHR_63`，HEAD `33219fe` | worker 做零注入脱敏诊断。 |
| 2026-08-30 | DHR_63 worker | 在 `wt/DHR_63` 自 rebase `master`（HEAD `880a30f`）；只读投影正式 registry 字段，确认目标 Profile 为 `herdr.codex.main` 与 `herdr.claude.main`，未读配置正文/凭据。 | E-6301、E-6302 | 修复唯一不可解析的非敏感元数据字段。 |
| 2026-08-30 | DHR_63 worker | 按 DHR_32 脱敏审计结论移除 `herdr.codex.ninth` 的不可展开 `config_fingerprint_rule`；其身份与独立配置根仍登记为「不可证」。 | E-6303、E-6307 | 运行正式 registry 校验、目标 Profile 检查和全量坏条目负例。 |
| 2026-08-30 | DHR_63 worker · 返工1 | 复现完整 registry 坏 alias 经 validator 拒绝、经 runtime loader 接受；该 P1-1 涉及禁改 loader，登记为越界阻塞。 | E-6310 | 不修改 loader/validator；处理 registry fallback 阻断。 |
| 2026-08-30 | DHR_63 worker · 返工1 | 复现 `herdr.codex.main → herdr.codex.ninth` 的实际 fallback 引用与 driver 启动前阻断；将允许字段 `fallback_profile_ids` 收敛为空数组，避免选择不可证 fallback。 | E-6311、E-6312 | 重跑正式校验、完整坏条目负例与定向 profiles 测试。 |
| 2026-08-30 | DHR_63 worker · 返工1 | 用内存 registry 数据变异完成红→还原探针；严格实现级 mutation 仍因本卡禁止改 validator/loader/测试而不可证，登记为 P1-3。 | E-6313、E-6314 | 只提交 DHR_63 工作区账本；不进入复核或 DHR_35。 |
| 2026-08-30 | DHR_63 fresh review worker · 返工1复验 | 复验允许的 `fallback_profile_ids=[]` 最小修复、正式 registry、坏 alias/config 负例、临时非敏感 fixture 下的 driver preflight；确认 loader alias fail-open 与 strict code mutation 仍未闭合。 | E-6320～E-6326；`review-code1-rerun-codex.md` | 保持 P1-1 越界阻塞、P1-3 配方阻塞；不收口、不解锁 DHR_35。 |
| 2026-08-30 | 主控 | 用户确认 B-25：本卡任务类型 normal→light；P6-RI-A5 改为与 DHR_65 的 runtime/mutation 证据联合闭合。 | DevPlan §0.2 B-25、§3.2 DHR_63；evidence/24~26 | 按 light 配方完成教训与一致性复核；DHR_35 继续 blocked，等待 DHR_64/DHR_65。 |
| 2026-08-30 | 主控 | 收口 E0 重跑正式 registry 校验、profiles 定向测试、模块体检与分支差异检查。 | E-6330、E-6331 | 完成 light 的教训与一致性复核；DHR_35 不解锁。 |

## 证据账本

| ID | 类型 | 命令 / 路径 | 结果 | 支撑什么结论 |
|---|---|---|---|---|
| E-6300 | setup | `.dh-worktrees/DHR_63` / `wt/DHR_63` | pass | 独立施工现场已建立。 |
| E-6301 | setup | `git rebase master` | pass：branch `wt/DHR_63`，HEAD `880a30f`，无冲突 | 施工基线与主干一致。 |
| E-6302 | inspect | 零注入 Node 投影正式 registry（仅字段名/稳定 ID/错误码；不读配置正文） | pass：初始正式整体校验唯一终态为 `REJECT E_UNRESOLVED_CONFIG`；alias 解析检查可用 | 定位不可展开的 `config_fingerprint_rule`。 |
| E-6303 | modify | `~/.dh-relay/executor-profiles.json` | pass：仅移除 `herdr.codex.ninth.config_fingerprint_rule`；当时与 `golden-registry.json` 字段差异归零，后续 E-6312 改动使 fallback 值级分歧见 F-6305 | 恢复已冻结 registry 的字段闭集与真实可解析边界。 |
| E-6304 | validate | `node relay-core/profiles/validate-profiles.mjs $registry`；目标 Profile 零注入检查 | pass：正式 registry `PASS` / exit 0；目标数量 2，`TARGET_PROFILES=PASS` / exit 0 | 两个目标 Windows Profile 的 CLI/config 规则可复跑。 |
| E-6305 | negative | 既有 `validateProfiles` 对完整正式 registry 副本分别注入一个 alias 坏条目和一个 config 坏条目 | pass：分别 `REJECT E_UNRESOLVED_ALIAS`、`REJECT E_UNRESOLVED_CONFIG`；`FAIL_CLOSED_PROBE_EXIT=0` | 任一登记坏条目仍使整体 registry fail-closed。 |
| E-6306 | test | `node --test relay-core/test/profiles.test.mjs` | pass：14 tests / 14 pass / 0 fail / exit 0 | 既有 registry schema、凭据和负例定向测试无回归。 |
| E-6307 | scan | 正式 registry 凭据模式扫描；golden 字段差异比对；`git diff --check` | pass：`REGISTRY_CREDENTIAL_PATTERN_MATCHES=0`；当时 `GOLDEN_FIELD_DIFFS=0`，后续 E-6312 的 fallback 值级分歧见 F-6305；diff check pass | registry 与本卡工件无凭据，且修改保持最小。 |
| E-6310 | boundary-repro | 完整 registry 临时副本；既有 `validateProfiles` 与 `loadExecutorProfiles` | pass：坏 alias 为 validator `REJECT E_UNRESOLVED_ALIAS`、loader `ACCEPTED`；坏 config 为 validator `REJECT E_UNRESOLVED_CONFIG`、loader `REJECT E_UNRESOLVED_CONFIG`；`LOADER_FAIL_OPEN_PROBE_EXIT=0` | P1-1 的 loader alias fail-open 可复现；本卡不越界修复。 |
| E-6311 | runtime-repro | `startWorkflowDriver` + fake Herdr + 正式 registry（不启动真实 Agent） | pass：fallback 引用 `herdr.codex.main->herdr.codex.ninth`；`DRIVER_PRESTART=BLOCKED`；`FAKE_PANE_SPLITS=0`；事件仅 `run_created`；`DRIVER_PRESTART_PROBE_EXIT=0` | P1-2 的实际 driver 启动前阻断可复现。 |
| E-6312 | modify/validate | `~/.dh-relay/executor-profiles.json`；零注入 registry 投影与既有 validator/loader | pass：仅将 `herdr.codex.main.fallback_profile_ids` 置空；`CODEX_MAIN_FALLBACK_COUNT=0`、`CODEX_MAIN_HAS_CONFIG=true`、`CODEX_NINTH_HAS_CONFIG=false`、`DRIVER_PREFLIGHT_CONDITION=CLEAR`；loader accepted、validator `PASS`，均 exit 0 | 不再从 Codex main 选择不可证 ninth；ninth 直接选择仍 fail-closed。 |
| E-6313 | mutation | 内存 registry：`herdr.codex.ninth.config_fingerprint_rule` absent→缺失环境变量 rule；恢复用同一 baseline | pass：`MUTATION_BASELINE=PASS`；施加后 `REJECT E_UNRESOLVED_CONFIG`；还原 `PASS`；`REGISTRY_RULE_MUTATION_EXIT=0` | registry 数据负例具判别力；不冒充实现级 code mutation。 |
| E-6314 | mutation | 内存 registry：`herdr.codex.main.fallback_profile_ids` []→[`herdr.codex.ninth`]；workflow-driver:151-155 等价 preflight 投影 | pass：baseline `CLEAR`；mutant `BLOCKED`；`REGISTRY_DATA_MUTATION=RED`；`REGISTRY_DATA_MUTATION_EXIT=0` | fallback 字段变异能检测 P1-2 的启动前阻断；strict normal mutation 仍见 F-6303。 |
| E-6315 | test | `node relay-core/profiles/validate-profiles.mjs $registry`；`node --test relay-core/test/profiles.test.mjs` | pass：formal validator `PASS` / exit 0；14 tests / 14 pass / 0 fail / exit 0 | registry 与既有定向测试无回归。 |
| E-6316 | hygiene | registry/工作区 secret-shaped 模式扫描；`git diff --check` | pass：`REGISTRY_SECRET_SHAPED_MATCHES=0`；`WORKSPACE_SECRET_SHAPED_MATCHES=0`；diff check exit 0 | 返工工件未发现 secret-shaped 值，文档差异无空白错误。 |
| E-6320 | validate | 正式 registry 零注入投影与整体 validator；目标 `herdr.codex.main`、`herdr.claude.main` | pass：目标 2/2 有 rule；Codex main fallback 0；字段闭集 PASS；整体 validator PASS；exit 0 | 返工允许字段和指定目标可解析。 |
| E-6321 | negative | 完整正式 registry 内存注入坏 alias 与坏 config，调用既有 validator | pass：`E_UNRESOLVED_ALIAS`、`E_UNRESOLVED_CONFIG`；exit 0 | 正式整体 validator 的两类负例仍有效。 |
| E-6322 | boundary-repro | 完整正式 registry 变异临时文件；调用 `loadExecutorProfiles` | pass：坏 alias `ACCEPTED`、坏 config `REJECT E_BAD_VALUE:PROFILE_REGISTRY`；探针 exit 0 | P1-1 loader alias fail-open 仍可复现，不越界修复。 |
| E-6323 | runtime-repro | `startWorkflowDriver` + 正式 registry + 临时非敏感 config fixture + fake Herdr | pass：`DRIVER_PREFLIGHT=CLEAR`、pane split/start 各 1、attempt started 1、driver exit 0；无真实 Agent | `fallback_profile_ids` 最小修复解除 driver guard；仅证明 registry/preflight，不冒充真实闭环。 |
| E-6324 | test | `node --test relay-core/test/profiles.test.mjs` | pass：14/14；exit 0 | 定向 profiles 测试无回归；不替代 strict mutation。 |
| E-6325 | hygiene | `git diff --check`；DHR_63 workspace/正式 registry 脱敏值与尾随空白计数 | pass：diff exit 0；secret-shaped value 0；trailing whitespace 0 | fresh 工件无凭据值、无空白错误；ninth 身份仍不可证。 |
| E-6326 | module-check | `dh dh-relay` | pass：0 failure、66 warnings；exit 0 | 本轮复核工件登记满足 R12 机械要求；warnings 为既有历史项。 |
| E-6330 | E0 validate/test | `node relay-core/profiles/validate-profiles.mjs <user registry>`；`node --test relay-core/test/profiles.test.mjs` | pass：registry `PASS` / exit 0；14 pass、0 fail / exit 0 | B-25 后重跑目标 Profile 与 formal validator 机器证。 |
| E-6331 | E0 check | `dh dh-relay`；`git diff --check master...HEAD` | pass：模块 0 failure、66 history warnings / exit 0；diff check exit 0 | 当前 B-25 后任务树体检与差异卫生通过。 |
