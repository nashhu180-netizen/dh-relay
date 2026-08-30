<!-- dh:v1 · workspace/DHR_63/review-code1-rerun-codex.md -->
# DHR_63 代码轮 1 · 返工第 1 轮 fresh 复核

> 复核者：Codex fresh review worker；日期：2026-08-30。
> 审查对象：`wt/DHR_63` 当前 HEAD `3b75453`，返工后用户级 registry 的脱敏结构与定向执行结果。
> 对照合同：`brief.md` 完成条件 1–3、`task_plan.md`、DevPlan §3.2 DHR_63、`design/12` P6-RI-A5。
> 形态：只读复核；未修改 registry、生产代码、schema/validator、loader、测试或配置正文，未启动真实 Agent，未提交/合并/verify。

## 结论

**changes-requested（P1×2、P2×1、P3×1）**。

本轮确认 DHR_63 允许范围内的 `fallback_profile_ids` 最小修复有效：正式 registry 通过，指定的 `herdr.codex.main` 与 `herdr.claude.main` 均有可解析 rule，Codex main 不再引用不可证的 ninth；使用临时非敏感配置 fixture 的 driver 探针结果为 `DRIVER_PREFLIGHT=CLEAR`。但运行时 loader 对坏 alias 仍 fail-open，且 normal 配方要求的严格实现级 mutation 仍没有证据；DHR_63 不可据此收口或解锁 DHR_35。

## P0

无。

## P1（阻断）

### P1-1 · runtime loader 对坏 alias 仍 fail-open（越界阻塞）

- **位置**：`relay-core/runtime/executors/herdr/profile-registry.mjs:15` 固定以 `resolveAlias:false` 调用 `validateProfiles`。
- **fresh 事实**：对完整正式 registry 的内存 alias 变异，validator 结果为 `REJECT E_UNRESOLVED_ALIAS`；同一变异写入临时文件后经 `loadExecutorProfiles` 为 `RUNTIME_BAD_ALIAS=ACCEPTED`。坏 config 变异仍由 loader 拒绝，说明差异来自 alias 检查被关闭。
- **结论**：P6-RI-A5 的“坏条目拒绝真实启动”仍不能由 validator 负例替代。DHR_63 brief 明确禁止修改 loader/validator/生产代码，本条保持 `open / 越界阻塞`，不在本卡修复。

### P1-2 · `fallback_profile_ids` 最小修复与 driver preflight fresh 复验通过（registry 部分闭合）

- **位置**：driver guard `relay-core/runtime/workflow-driver.mjs:151-155`；允许字段为用户级 registry 的 `fallback_profile_ids`。
- **fresh 事实**：正式 registry 投影显示目标 Profile 数量 `2`、目标 rule 数量 `2`、`herdr.codex.main` fallback 数量 `0`、字段闭集 `PASS`；整体 validator 为 `PASS`。临时非敏感 fixture 下，`startWorkflowDriver` 经过 fake Herdr 的 pane split/agent start，输出 `DRIVER_PREFLIGHT=CLEAR`、`ATTEMPT_STARTED=1`、命令 exit `0`。该探针未读取用户配置正文、未启动真实 Agent。
- **结论**：返工只使用允许的 `fallback_profile_ids` 最小修复，P1-2 的 registry/preflight 部分可标 `closed`；不将 fake Herdr 启动失败误报为真实 Agent 闭环，也不改变 DHR_35 的 blocked 状态。

### P1-3 · normal 严格 code mutation 仍缺失（配方阻塞）

- **位置**：`task_plan.md:25` 的 normal 配方要求有效单测；`review.md` 的 mutation 表已登记的两项是 registry 输入变异。
- **fresh 事实**：现有 registry 数据变异可复验红→还原，`node --test relay-core/test/profiles.test.mjs` 为 `14/14 pass`；没有 validator/loader/生产代码/既有测试的实现级 mutation 施加、还原和红测终态。
- **结论**：保持 `open / 配方阻塞`。不得把 registry 输入变异或普通绿测表述成严格 code mutation 已闭合。

## P2

### F-6301 · `herdr.codex.ninth` 身份与独立配置根仍不可证

返工未读取配置正文或凭据，ninth 仍无 `config_fingerprint_rule`；该身份事实按已有 findings 继续明确标注「不可证」。这不是本轮允许范围内可消除的证据。

## P3

### P3-1 · full npm test 未在本轮取得终态

本轮只取得 DHR_63 定向 profiles 测试的终态 `14 pass / 0 fail`；未以 `npm test` 的完整回归作为通过依据。`dh dh-relay` 的终态在本轮复核登记完成后为 `0 failure、66 warnings`，warnings 为既有历史项。

## Fresh 复验命令与终态

| ID | 命令/探针 | 终态 |
|---|---|---|
| E-6320 | 零注入读取正式 registry 的字段投影 + `validateProfiles(...,{resolveAlias:true})`；`node relay-core/profiles/validate-profiles.mjs <user registry>` | `TARGET_COUNT=2`、`TARGET_CONFIG_RULES=2`、`CODEX_MAIN_FALLBACK_COUNT=0`、`TARGET_FIELD_CLOSED=PASS`、`FORMAL_FULL_REGISTRY=PASS`、exit `0` |
| E-6321 | 完整正式 registry 内存注入一个坏 alias、一个坏 config，分别调用既有 validator | `NEGATIVE_ALIAS=REJECT E_UNRESOLVED_ALIAS`、`NEGATIVE_CONFIG=REJECT E_UNRESOLVED_CONFIG`、exit `0` |
| E-6322 | 完整正式 registry 变异写入临时文件，分别调用既有 `loadExecutorProfiles`；临时目录在探针 finally 清理 | `RUNTIME_BAD_ALIAS=ACCEPTED`、`RUNTIME_BAD_CONFIG=REJECT E_BAD_VALUE:PROFILE_REGISTRY`、`RUNTIME_LOADER_PROBE=EXPECTED_BOUNDARY`、exit `0`；保留 P1-1 |
| E-6323 | `startWorkflowDriver` + 完整正式 registry + 临时非敏感 config fixture + fake Herdr（不启动真实 Agent） | `DRIVER_DONE=PASS`、`DRIVER_PREFLIGHT=CLEAR`、`FAKE_PANE_SPLITS=1`、`FAKE_AGENT_STARTS=1`、`ATTEMPT_STARTED=1`、exit `0` |
| E-6324 | `node --test relay-core/test/profiles.test.mjs` | `14 pass / 0 fail`，exit `0` |
| E-6325 | `git diff --check`；workspace/registry 脱敏值与尾随空白计数探针 | `GIT_DIFF_CHECK_EXIT=0`、workspace/registry secret-shaped value `0`、trailing whitespace `0`，exit `0` |
| E-6326 | `dh dh-relay` | `0 failure、66 warnings`，exit `0` |

## 当前树状态

- branch：`wt/DHR_63`；HEAD：`3b75453`。
- 相对 `master` 的 tracked 差异仍只在 DHR_63 workspace 账本；本轮新增未提交 `review-code1-rerun-codex.md`，未改 registry/生产代码。
- 本报告只写事实与级别，不代主控做收口裁决，不代签 verify，不勾人类签名区。
