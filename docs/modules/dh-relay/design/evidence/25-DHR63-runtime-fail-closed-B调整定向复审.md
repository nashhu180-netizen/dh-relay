# DHR-B-25 · DHR_63 runtime fail-closed 补卡 — 定向 fresh B 复审

> 复审性质：未参与 evidence/24 初审的独立定向复审；只读核查，不代签 B-adjust、D-start、merge、verify 或 DHR_35。复审日期：2026-08-30。

## 1. 复审范围与基线

本次只核查 evidence/24 列出的 P1：DHR_65/DHR_64 精确所有权、P6-RI-A5 的完整正式 registry / 两个指定 Profile / 零敏感证据口径、DHR_63 方案 A 的用户决定记录，以及 DHR_63/DHR_65 独立施工与 DHR_35 三方汇合是否成环。

读取基线：

- `docs/modules/dh-relay/dev_plan/drafts/DHR-B-25-DHR63-fail-closed补卡-调整候选.md:14-40`
- `docs/modules/dh-relay/design/evidence/24-DHR63-runtime-fail-closed-B调整审核记录.md:10-14,22-35`
- `docs/modules/dh-relay/design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md:16-20,41-45,75-89`
- `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md:129-137,194-232,269-271`
- DHR_64 worktree 的只读 `git status` 文件名快照。

## 2. 结论总表

| 项目 | 结论 | 复审判断 |
|---|---|---|
| P0 | 0 | 未见安全绕过、凭据授权、真实 Agent 启动或数据回滚授权；候选仍标明尚未生效（候选:4,17）。 |
| P1-1 精确所有权 | **未闭合** | 候选列出 DHR_65 的文件，但只用文字称 DHR_64 的 Herdr 范围“同步收窄”；现行 DevPlan 仍允许 `runtime/executors/herdr/**` 和对应测试，未显式排除 DHR_65 的测试路径。 |
| P1-2 A5 三项口径 | **合同文字已覆盖，证据汇合仍需落闸** | 候选已写完整正式 registry 的结构等价测试副本、`herdr.codex.main` 与 `herdr.claude.main` 两个稳定 ID、坏 registry 不创建 Attempt/Agent/pane/Result、测试和证据不得落配置正文或凭据（候选:19-21）。共同闭合条件见 P1-4。 |
| P1-3 方案 A 决定 | **已闭合（对话决定）** | 本轮用户明文“按你的推荐走”，即选择方案 A；候选:27-29 也记录了该决定。候选:25 的“待用户决定”标题仍是待清理的状态文字，不改变本轮决定事实。 |
| P1-4 独立与三方汇合 | **部分闭合，仍为 P1** | 候选图上为 `DHR_32,DHR_61 → DHR_63/DHR_65`，DHR_35 等待 DHR_63、DHR_64、DHR_65，拓扑本身无环（候选:34,38-40）；但没有明确写出“DHR_63 registry 证据 + DHR_65 runtime 证据共同闭合 P6-RI-A5”的联合汇合闸。 |

## 3. P1-1：DHR_65 / DHR_64 所有权

候选:22 为 DHR_65 列出 `profile-registry.mjs`、`herdr-adapter.test.mjs`、`profiles.test.mjs` 和独立 workspace，并规定不得改 `herdr-executor.mjs`、contracts、store、rpc、service、workflow-driver 或 CLI；同时把 DHR_64 的 Herdr 接点描述为只保留 `herdr-executor.mjs` completion instruction。该描述比初审的宽范围清楚，但还不是可交叉核验的排他合同：

1. 当前正式 DevPlan 仍把 DHR_64 的变更范围写成 `runtime/executors/herdr/**`、`workflow-driver.mjs` 与“对应定向测试”（DevPlan:216），DHR_64 的当前工作区也已修改 `relay-core/runtime/executors/herdr/herdr-executor.mjs`、`relay-core/runtime/service.mjs`、`relay-core/runtime/workflow-driver.mjs`、`relay-core/test/contracts.test.mjs`，并新增 `relay-core/test/dhr64-result-bridge.test.mjs`。
2. 当前 DHR_64 WIP 文件名快照没有显示 `profile-registry.mjs`、`test/herdr-adapter.test.mjs` 或 `test/profiles.test.mjs`，所以此刻未观察到实际文件重叠；这只能证明当前快照，不等于已冻结后续路径。
3. 候选没有明确把 `relay-core/test/herdr-adapter.test.mjs`、`relay-core/test/profiles.test.mjs` 从 DHR_64 的允许测试集合排除，也没有采用独占测试文件并留下 exact-path 交集证据。按 evidence/24:10 的要求，不能把当前无交集冒充合同已无交集。

因此 P1-1 保持 open。进入施工前，必须在生效合同中把 DHR_64 的测试与 Herdr 路径排除项写成可核对的 exact path，并做一次 DHR_63/DHR_64/DHR_65 合并前交集检查。

## 4. P1-2：P6-RI-A5 完整 registry、两个目标与零敏感证据

design/12:19、83 的正式命题是：任一已登记坏条目整体 fail-closed、两个修复后的指定 Profile 复验通过、零配置正文/凭据进入工件。候选:19-21 已补齐机器证口径：

- 不能用只含目标 Profile 的局部 registry，必须以完整正式 registry 的结构等价测试副本覆盖坏 alias/config；
- 稳定目标明确为 `herdr.codex.main` 与 `herdr.claude.main`；
- 坏 registry 的负例断言真实启动前不创建 Attempt、Agent、pane 或 Result；
- 测试与证据不得落配置正文或凭据，且 loader 分支需要实现级 mutation 证据。

上述三项在候选文字层面已覆盖初审 P1-2；实际施工证据仍须把“DHR_63 修复后的 registry 证据”与“DHR_65 runtime 证据”按下一节的联合条件登记，并保留不可证项的明确登记。不能因为 DHR_65 只使用结构等价副本，就把它解释成已经消费了用户级 registry 或已经完成 A5。

## 5. P1-3：DHR_63 方案 A 用户决定

用户在本轮对话明确回复“按你的推荐走”，对应 evidence/24:32 推荐的方案 A：DHR_63 保持 registry-only，将 `task_type` 调整为 `light`；新增独立 DHR_65 承担 runtime production mutation。候选:27-30 已将方案 A 标为已选并将方案 B 标为未选，故“必须先由用户选择 A/B”的初审 P1 已闭合。

这只闭合选择事实，不等于合同已生效：候选仍标为尚未生效（候选:4），正式 DevPlan 当前仍登记 DHR_63 为 normal、DHR_35 只 blocked-by DHR_63/DHR_64（DevPlan:135,137,203,271）。这些应在 B-adjust 用户确认后由主控同步，不应由本复审代改。

## 6. P1-4：独立施工与 DHR_35 三方汇合

候选:34 的候选图为：

```text
DHR_32,DHR_61 ─→ DHR_63 ─┐
DHR_32,DHR_61 ─→ DHR_65 ─┼─→ DHR_35（blocked-by DHR_63,DHR_64,DHR_65）
DHR_61,DHR_34 ─→ DHR_64 ─┘
```

该图无回边，DHR_63 与 DHR_65 可独立施工，DHR_35 的三方阻塞条件也写明了；这部分拓扑没有发现 P0/P1 环路。

但 evidence/24:33 要求的 A5 联合汇合条件尚未在候选中明写：DHR_65 可以代码上独立施工/收口，但 **P6-RI-A5 不能在 DHR_63 的 registry 证据和零敏感证据、以及 DHR_65 的 runtime fail-closed 证据均闭合前判定完成**。候选:38 只分别说明两卡职责，未写这条 final join。若不增加该汇合闸，就会出现三卡均有“完成”但 A5 证据不能证明同一完整 registry 来源的解释空档。

## 7. 最终裁定

- P0：0。
- P1：仍有 P1-1（所有权合同未排他冻结）和 P1-4（A5 联合汇合闸未写死）；P1-2 的三项合同文字已补齐，P1-3 已由本轮用户选择 A 闭合。
- 当前 **不可进入用户理解问答**。先补齐 DHR_64 对 DHR_65 exact paths 的排除/交集证据，并在候选中写明 DHR_63 registry 证据与 DHR_65 runtime 证据共同闭合 A5 的 final join；修订后再做一次定向 fresh B 复审。
- 本记录未改代码、registry、DevPlan 或候选，未提交；DHR_35 仍不得因本记录启动，Linux 继续按 design/12:20 的延后/受限口径。
