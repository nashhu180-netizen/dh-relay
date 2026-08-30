# DHR-B-25 · DHR_63 runtime fail-closed 补卡 — 二次定向复审交叉审核记录

> 复审性质：独立 fresh B-25 定向复审；只读核查，不代签 B-adjust、D-start、merge、verify 或 DHR_35。复审日期：2026-08-30。
>
> 本记录只新增本证据文件；未改代码、用户 registry、候选、正式 DevPlan 或任一工作区账本，未执行 Git 写入操作。

<a id="review-b25"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-25 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=review -->

## 1. 复审范围与基线

本轮针对 evidence/24、evidence/25 遗留的五项问题复核：

1. 方案 A 的 DHR_63（`light`、registry-only）与 DHR_65（`normal`、runtime loader fail-closed）的职责、依赖和路径是否互斥；
2. DHR_64 正式宽范围是否在候选中被明确收窄为精确路径，未列路径是否仍归 DHR_64；
3. P6-RI-A5 是否有足够的联合闭合条件，禁止 DHR_63 单卡解除 DHR_35；
4. registry 配置正文、凭据和敏感值是否被排除；
5. 本次调整是否改变 design/12 的正式产品语义，因而需要 A-full。

读取基线：

- `docs/modules/dh-relay/dev_plan/drafts/DHR-B-25-DHR63-fail-closed补卡-调整候选.md:4,14-45`；
- `docs/modules/dh-relay/design/evidence/24-DHR63-runtime-fail-closed-B调整审核记录.md:10-15,27-35`；
- `docs/modules/dh-relay/design/evidence/25-DHR63-runtime-fail-closed-B调整定向复审.md:21-35,37-46,54-72`；
- `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md:135-137,194-232,265-271`；
- `docs/modules/dh-relay/workspace/DHR_64/task_plan.md:15-20`；
- `docs/modules/dh-relay/design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md:4-6,14-26,75-89`。

## 2. P0-P3 结论总表

| 级别 | 数量 | 结论 |
|---|---:|---|
| P0 | 0 | 未见安全绕过、凭据授权、真实 Agent 启动或回滚授权；候选仍明确为尚未生效。 |
| P1 | 0 | 候选文字已补齐方案 A、DHR64 精确路径、DHR65 独占路径和 A5 联合闭合条件；没有遗留会使候选本身无法成立的 P1。 |
| P2 | 1 | 正式 DevPlan、DHR63/DHR64 工作区仍是旧合同，候选尚未生效；这是实施前必须完成的同步与交集检查，不得被报告为已切换。另见 §3.2、§4。 |
| P3 | 0 | 本次未发现新的产品语义、Linux、Result bridge 或证据卫生问题。 |

## 3. 定向核查

### 3.1 方案 A 与 DHR65 的责任、依赖、路径

- 正式 DHR63 仍定义为只维护两个已冻结 Windows Profile 的非敏感 registry 元数据，禁止 schema/validator、Runtime、Store、RPC、Herdr 和编排改动（`dev_plan/P6-Herdr多账号执行底座-开发方案.md:194-204`；`workspace/DHR_63/brief.md:26-35`）。候选已明确选用方案 A：DHR63 保持 registry-only，`task_type` 改为 `light`，不再以 registry 输入 mutation 冒充 normal 的实现 mutation（候选 `:26-31`）。
- DHR65 的目标是 runtime registry loader 对 alias/config 指纹执行 fail-closed，并由 driver 负例证明在创建 Attempt/Agent/pane/Result 前止损；其非目标明确排除用户级 registry、Agent 配置、凭据、Receipt/Store/RPC/Result bridge、DHR35 和 Linux（候选 `:14-21`）。它承担独立的 runtime production mutation，类型为 `normal`（候选 `:14-24`）。
- 两卡允许共同依赖 DHR32、DHR61 但无先后边，DHR63 与 DHR65 可独立施工；DHR35 需等待三卡（候选 `:33-35`）。路径上，DHR63 是用户级 registry 与 `workspace/DHR_63/**`，DHR65 是 `profile-registry.mjs`、独占的 `dhr65-registry-loader.test.mjs` 和 `workspace/DHR_65/**`（候选 `:22`），没有把 DHR63 的 registry 写入权扩给 DHR65，也没有把 runtime loader 权扩给 DHR63。
- DHR65 明确不得修改 `herdr-executor.mjs`、`workflow-driver.mjs`、contracts/store/rpc/service 或 CLI（候选 `:22`）；因此“driver fail-closed”在本候选中是既有消费者的启动前机器证，不是向 DHR65 偷渡 driver 改造。若实际需要改 driver，必须停下重新做范围审核。

结论：候选层面的 A/B 责任和允许路径已分离，无 DHR63/DHR65 交叠。

### 3.2 DHR64 宽范围与精确路径替换

- 当前正式 DevPlan 仍保留 DHR64 的宽范围：`runtime/executors/herdr/**`、对应 CLI/定向测试以及 contracts/store/rpc/service/workflow-driver（`dev_plan/P6-Herdr多账号执行底座-开发方案.md:206-218`）；现有 DHR64 task plan 也仍写 `relay-core/test/**` 和 `executors/herdr/**`（`workspace/DHR_64/task_plan.md:15-20`）。这与候选“尚未生效”的状态一致（候选 `:4`），不能把当前正式状态误报为已收窄。
- 候选已把原来的两处宽口径改成可核对的精确清单：DHR64 的 Herdr 路径仅为 `relay-core/runtime/executors/herdr/herdr-executor.mjs`；CLI/定向测试与基线文件逐项列为 `relay-core/cli/client.mjs`、`relay-core/cli/main.mjs`、`relay-core/test/dhr64-result-bridge.test.mjs`、`relay-core/test/contracts.test.mjs`、`relay-core/package.json`、`relay-core/capability-baseline.json`、`relay-core/tools/capability-baseline.mjs`、`relay-core/tools/structural-tokens.txt`（候选 `:23`）。
- 同一条款明确 contracts/store/rpc/service/workflow-driver 的其余 DHR64 既有路径维持原归属；DHR64 不得改 `profile-registry.mjs` 或 DHR65 新测试，DHR65 不得改上述 DHR64 精确路径（候选 `:23`）。因此候选已经回答了“未列的既有 bridge 路径留在 DHR64、DHR65 新 loader/test 独占”的归属问题，也闭合 evidence/25 的原 P1-1（`evidence/25:27-35`）。

结论：候选层面精确替换充分；生效前仍必须把该条款同步回正式 DevPlan、DHR64 brief/task plan，并做一次三卡 exact-path 交集检查。该同步缺口为 P2，不是候选文本上的 P1。

### 3.3 P6-RI-A5 联合解锁是否阻止 DHR63 单独解除 DHR35

- design/12 的正式 A5 要求：任一已登记坏 registry 条目阻止真实启动、两个修复后的指定 Profile 复验通过、工件零配置正文和凭据（`design/12:19,75-83`）。
- 候选将 A5 拆成两个不可单独宣称的证据集合：DHR63 提供已冻结 registry 的非敏感修复、`herdr.codex.main`/`herdr.claude.main` 两目标可解析、完整 registry 的 validator 坏 alias/config 证据和零敏感证据；DHR65 在完整正式 registry 的结构等价测试副本上证明同样的坏 alias/config 在 runtime loader/driver 创建 Attempt/Agent/pane/Result 前被拒，并完成 loader 实现级 mutation（候选 `:37-39`）。
- 候选明确规定两组机器证均 pass、DHR63 与 DHR65 各自完成复核后才共同闭合 P6-RI-A5，否则 DHR35 继续阻塞（候选 `:37-40`）。同时 DHR35 的候选依赖是 `DHR_63,DHR_64,DHR_65` 三卡（候选 `:33-35`）。所以即使 DHR63 已完成，缺 DHR65 时 A5 不能闭合，缺 DHR64 时 DHR35 也不能解除；DHR63 不具备单卡解锁权限。
- “结构等价副本”只能用于不泄露敏感值的 runtime 机器证，不能解释为已经读取或发布用户 registry 正文。最终证据应交叉登记同一脱敏结构/坏条目测试口径的证据 ID，不得把配置正文、凭据或完整 Receipt 内容写入工件；这属于施工验收的证据绑定要求，不改变 design/12 语义。

结论：联合闸足以禁止 DHR63 单独解除 DHR35；DHR35 仍需三卡和后续独立放行。

### 3.4 registry 正文、凭据与敏感值

- 候选继续声明“不改变用户级 registry/凭据/真实 Agent”，并把测试与证据排除配置正文和凭据（候选 `:4,17,19-20`）。
- 正式 DHR63 口径也只允许已冻结 Profile 的非敏感字段，工件仅错误码、字段名、脱敏摘要；若身份不能证明必须写「不可证」（`dev_plan/P6-Herdr多账号执行底座-开发方案.md:196-204`）。design/12 同样禁止凭据读取/写入、token 透传和自由配置/环境上传（`design/12:22-26,41-45`）。
- 本复审只检查了上述合同文字，没有读取 registry 配置正文、凭据值、环境变量或真实 Agent 状态。候选中出现的两个 Profile ID 仅作为已冻结的稳定标签，不构成凭据披露。

结论：未发现候选泄露 registry config/body/credentials 的问题；实施和证据回收仍须按白名单与零敏感扫描闭合。

### 3.5 是否需要 A-full

- design/12 已是完成 fresh 审核、理解对齐和用户整版确认的正式 P6 输入，且明确“未提及部分保持既有合同”（`design/12:4-6`）。A5 的语义、Result/Receipt/RPC 边界和 Linux 延后口径均已冻结（`design/12:14-26,75-89`）。
- 本候选只做任务拆分、`task_type`/复核配方、允许路径和依赖/联合闸调整；DHR65 的 mutation 是为证明既有 A5 语义，不新增 registry 字段、Result/Receipt/RPC 语义、身份模型、Linux 行为或用户产品命题（候选 `:14-24,33-45`）。

结论：当前 **不需要 A-full**；B-adjust 足够。若后续要改 A5 语义、registry 字段闭集、Receipt/Result/RPC、driver 生产责任或 Linux 口径，应停止并另走相应的 A-full/B-adjust，不能借本候选扩 scope。

## 4. 最终裁定与生效边界

**候选层面：有条件通过，P0=0、P1=0、P2=1、P3=0。** evidence/25 遗留的职责分离、DHR64 精确路径和 A5 联合闭合文字已补齐，可以进入用户理解/确认阶段；本记录不代替用户确认，也不构成 B-adjust、D-start 或 DHR35 放行。

在候选真正生效前，主控必须完成以下机械同步并重新检查：

1. 将 DHR63 的 `task_type=light`、DHR65 新卡及 DHR35 三卡阻塞回写正式 DevPlan；同步 DHR63 brief/task plan/review recipe，以及 DHR64 brief/task plan 的 exact paths。
2. 对 DHR63、DHR64、DHR65 做 exact-path 交集检查；DHR65 只取得候选列出的 loader/独占测试/workspace 路径，不取得 DHR64 的 bridge 路径，也不取得 DHR63 的用户 registry 写入路径。
3. 分别取得调整后的卡级 D-start；只有 DHR63 registry 证据和 DHR65 runtime 证据均 pass、各自复核完成，且 DHR64 也完成时，才允许 DHR35 进入后续独立放行流程。

## 5. 用户讲解、理解与确认

<a id="understanding-b25"></a>
<!-- dh:planning-evidence:v1 event=DHR-B-25 artifact=dev_plan/P6-Herdr多账号执行底座-开发方案.md kind=understanding -->

- **讲解**：主会话按全局地图、合同、运作和验证边界说明：DHR_63 只修受限 registry；DHR_65 在 runtime loader 层阻止坏完整 registry 进入 Attempt/Agent/pane/Result；DHR_64 独立保存 Receipt-bound Result；DHR_35 必须等待三卡。无配置正文、凭据、真实 Agent 或 Linux 动作。
- **理解问题**：即使 DHR_63 的 registry 校验通过，只要 DHR_65 未证明 runtime 会在创建 Attempt/Agent/pane/Result 前拒绝坏 alias/config，DHR_35 是否仍必须保持 blocked？
- **用户回答**：2026-08-30，用户回答「是的」。
- **最终确认**：2026-08-30，用户明文「确认」DHR_63→light、新增 DHR_65→normal、DHR_64 收窄为精确路径、DHR_35 同时依赖 DHR_63/DHR_64/DHR_65。该确认仅授权 B-25 计划/工件落盘，不授权 DHR_65 D-start、代码、真实 Agent、Linux、verify、合并、推送、部署或环境动作。
