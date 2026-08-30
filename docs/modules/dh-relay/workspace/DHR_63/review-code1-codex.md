<!-- dh:v1 · workspace/DHR_63/review-code1-codex.md -->
# DHR_63 代码轮 1 — fresh 只读复核

> 复核者：Codex fresh review worker；日期：2026-08-30。
> 审查对象：`wt/DHR_63` 当前 HEAD `a080989`、相对 `master` 的全部差异，以及用户级 registry 的脱敏结构/错误码结果。
> 对照合同：`brief.md` 完成条件 1–3、`task_plan.md`、DevPlan §3.2 DHR_63、`design/12` P6-RI-A5。
> 形态：只读审查；未修改生产代码、schema/validator、正式 registry 或配置正文，未启动真实 Agent，未提交/合并/verify。

## 结论

**changes-requested（P1×3，P3×1）**。

当前最终 registry 状态与字段闭集可以复现，定向 profiles 测试也通过；但是现有证据不能证明 P6-RI-A5 的“坏条目拒绝真实启动”，且当前 registry 的 Codex fallback 关系会让下游 Windows Codex 节点在 driver 启动前直接返回。normal 配方的有效变异测试登记仍为空，因此本卡不能据此进入通过/收口裁决。

## P1（阻断）

### P1-1 · 运行时 registry loader 对坏 alias 采取 fail-open，E-6305 不是“拒绝真实启动”证据

- **位置**：`relay-core/runtime/executors/herdr/profile-registry.mjs:12-20`，尤其第 15 行固定调用 `validateProfiles(registry, { resolveAlias: false, environment })`。
- **事实**：DHR63 的 E-6305（`workspace/DHR_63/progress.md:21`）只记录 `validateProfiles` 对完整 registry 副本的负例结果；它没有经过运行时 `loadExecutorProfiles`。
- **机器证**（只用临时副本，未启动 Agent）：当前正式 registry 的坏 alias 内存变体得到 `validateProfiles(..., {resolveAlias:true}) => E_UNRESOLVED_ALIAS`，但同一变体经 `loadExecutorProfiles` 得到 `ok=true`、即 `RUNTIME_LOADER_BAD_ALIAS=ACCEPTED`。对应的坏 config 变体则分别为 `E_UNRESOLVED_CONFIG` 与 loader `REJECTED`，说明差异确实来自 alias 检查被关闭，而不是测试脚本误读。
- **影响**：完成条件 2 和 P6-RI-A5 要求任一已登记坏条目整体 fail-closed 并拒绝真实启动；E-6305 只能证明独立 validator 的行为，不能证明 canonical runtime 启动入口的行为。DHR63 明确禁止改生产 loader，本条应保持阻断并交主控按合同边界处理，不能以 E-6305 代替。

### P1-2 · 当前 Codex fallback 结构使“目标 Profile 校验通过”不能转化为 Codex 可启动

- **位置**：`relay-core/runtime/workflow-driver.mjs:151-155` 在 `launchHerdrAgent`（`:173`）之前，若当前 Profile 或任一 fallback 没有 `config_fingerprint_rule` 就直接返回。
- **外部脱敏结构证**：当前正式 registry 结构投影为：`herdr.codex.main` 的 fallback 是 `herdr.codex.ninth` 且自身有 rule；`herdr.codex.ninth` 的 fallback 是 `herdr.codex.main`，但自身 rule 已按 E-6303（`progress.md:19`）移除。
- **推论**：选择 `herdr.codex.main` 时，`:154` 会因 `herdr.codex.ninth` 缺 rule 返回；选择 `herdr.codex.ninth` 时，`:152` 会因自身缺 rule 返回。两条 Codex 入口都不会到达 `launchHerdrAgent`。这与 E-6304 的“目标数量 2 / TARGET_PROFILES=PASS”不矛盾：前者只是 validator 级 PASS，后者是 driver 的运行时前置条件。
- **影响**：DHR35 需要的 Windows Codex 实录仍没有可用启动路径；`findings.md:6` 只写了身份/独立配置根“不可证”，没有写明该 fallback 关系造成的实际 driver 阻断。DHR63 不得把本状态表述为已解除 DHR35 的 Codex 前置。

### P1-3 · normal 配方要求的有效单测/变异证明缺失

- **位置**：`task_plan.md:25` 明确 normal 配方包含“有效单测”；`review.md:28-30` 的“有效单测·变异点登记”仍为“待代码轮 1 选定”，整行没有变异点、命令、施加/还原 hash 或红测结果。
- **事实**：E-6306（`progress.md:22`）只有 `node --test relay-core/test/profiles.test.mjs` 的 14/14 通过；普通绿测不能证明某个断言在关键逻辑被破坏时会变红，也不能替代 normal recipe 的有效变异证据。
- **影响**：这是启动时冻结的 normal 复核门槛，当前缺失会阻断“代码轮 1 完成”的机械结论。复核者没有修改 validator 或生产代码来补做变异，需由主控在不越过 DHR63 边界的前提下补齐可核查证据，或明确登记不可适用及其裁决。

## P3（不阻断但需如实登记）

### P3-1 · 全量测试本轮未取得终态

`npm test` 本轮只收到中段测试输出，没有 terminal summary/exit 证据，因此不作为全量通过依据。定向 `node --test relay-core/test/profiles.test.mjs` 的终态是 14 pass、0 fail；`dh dh-relay` 的终态是 0 failure、66 warnings。

## 已独立核对通过的项

1. `git diff master...HEAD` 只含 `workspace/DHR_63/findings.md` 与 `progress.md` 的账本变更；无 tracked production/schema/validator 改动。审查结束时除本复核文件外没有其他工作树改动。
2. 正式 registry validator 运行结果为 `PASS`；当前 profile 数量为 5，目标 Profile 数量为 2；正式 registry 与 golden 的 profile ID/字段集合匹配，去掉 `config_fingerprint_rule` 后其余非敏感字段值匹配，rule 差异为 0。
3. 在不输出 registry 值的前提下，完整 registry 的 alias 坏条目与 config 坏条目分别可复现 `E_UNRESOLVED_ALIAS`、`E_UNRESOLVED_CONFIG`；这证明 validator 负例自身有效，但不改变 P1-1 对 runtime loader 的结论。
4. `node --test relay-core/test/profiles.test.mjs` 独立终态为 14/14 pass；`git diff --check` 通过。
5. 正式 registry 与 DHR63 workspace 工件的凭据模式扫描均为 0；未读取配置正文、凭据值或账号状态，也未启动真实 Agent。

## 复核边界与交接

本报告只写事实与级别，不替主控做验收裁决，不代签 verify，不勾人类签名区。P1-1/P1-2 涉及 DHR63 明确列为 out-of-scope 的 runtime/生产代码或下游合同处理，不能在本复核工作树顺手修复；DHR35 仍应保持 blocked，直到主控完成相应裁决与前置闭合。
