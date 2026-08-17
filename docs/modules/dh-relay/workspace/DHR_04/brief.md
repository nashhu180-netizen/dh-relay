<!-- dh:v1 · brief.md — 工作区封面。🔵 前置填。写"终点"，不写路线。完成条件 = 任务卡验收口径的逐字复制 + 出处回链；DevPlan 是唯一权威定义，本文件是施工现场的只读副本，口径变更以 DevPlan 为准、本文件跟改并在 progress 记一笔。 -->
# brief — DHR_04 把隔离、禁改与业务仓落点守卫前置成全程机器护栏

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---------|---------|-------------|
| DHR_04 | P2-完整流水 | [DevPlan §3.2 任务卡 DHR_04](../../dev_plan/P2-完整流水-开发方案.md#dhr_04) |

## 目标 (Outcome)

在任何 P2 生产实现之前，建立一个**可独立执行的 fail-closed 守卫**（`tools/relay/policy/`），同时约束三件事：① dh-relay 自身开发期的改动隔离（生产代码只落 `tools/relay/`，dh-crew 代码与 active state 零改动）；② relay 跑在业务仓时的**内容写入**必须是允许集合的子集（`.dh-relay/**` ∪ `docs/relay/**` ∪ ⋃各卡「authority snapshot 冻结的变更范围 ∪ module_slug 派生的 dev-harness 路径」，**必须含卡授权的业务代码路径**）；③ 宿主外副作用（Git refs/worktrees、`~/.dh-relay/`、CLI 配置与会话、psmux 进程）按类分账登记、**不混入**②的内容白名单。守卫默认拒绝，允许集只能从固定根和 authority fixture 推导；后续每张卡的任务级证据命令都必须调用本守卫，不在后卡重写第二套策略。

## Zero-context 自查

新 agent 只读本 brief + DevPlan 任务卡 + `task_plan.md` 即可开工：终点 = `tools/relay/policy/` 落地（决策纯函数 + `-File` 黑盒 CLI 入口）+ `tools/relay/tests/relay-policy.ps1` 新套件接进 `run-relay-tests.ps1` 且全绿 + P1 既有 15 套件零回归；边界 = 只动 `tools/relay/policy/**`（新建）、`tools/relay/tests/**`（新套件 / 新夹具 / 清单 / reason 扫描根）、本工作区 `docs/modules/dh-relay/workspace/DHR_04/`；谁验 = B9 三条机器证（本卡无人判项，H3/H4 归 DHR_21）；证据口径 = 套件 PASS 输出 + 真实临时 Git 仓的前后快照 / `git status` / 独立检查四者交叉。策略语义权威在 [design/02 B9](../../design/02-完整流水-产品设计与验收.md)，落点与禁改边界在 [DevPlan §2.2](../../dev_plan/P2-完整流水-开发方案.md)，现役代码风格在 [as-built/relay-contracts.md](../../as-built/relay-contracts.md)。

## 完成条件 ★必写（= 覆盖任务验收口径的并集，标好谁验）

| # | 条件 | 谁验（AI / 人） | 出处（任务 ID / 来源设计文档 + 验收 ID） |
|---|------|---------------|--------------------------------|
| 1 | 【机器证·B9①】以变更前后路径集和回归命令证明 P2 生产代码只改 `tools/relay/`，dh-crew 代码与 active state 零改动，dh-crew run-all 行为不受影响。 | AI | DHR_04 / [产品设计与验收 B9](../../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏) |
| 2 | 【机器证·B9②】用合成 authority snapshot、受限写环境、前后快照、`git diff`/`git status` 与独立检查结果共同证明业务仓内容写入是允许集合的子集；**卡授权的业务代码路径必须可写，未授权路径必须拒绝**。 | AI | DHR_04 / [产品设计与验收 B9](../../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏) |
| 3 | 【机器证·B9③】本次 run 在 `docs/modules/<模块>/relay/`、`workspace/<卡>/relay/` 等模块下新建带 relay archive/runtime schema 或 marker 的文件夹即失败，legacy 根新写亦失败；分别用"run 前已存在的同名目录"和"合法模块 `docs/modules/relay/`"两条反例证明不得误杀；Git、用户级目录、CLI 与 psmux 副作用分账可观察。 | AI | DHR_04 / [产品设计与验收 B9](../../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏) |

## 边界 (Boundaries)

- In scope：`tools/relay/policy/`（新建：路径规范化、开发期隔离判定、业务仓内容白名单派生与判定、落点守卫、副作用分账、`-File` 黑盒 CLI 入口）、`tools/relay/tests/relay-policy.ps1` + `tools/relay/tests/fixtures/policy/`（合成 authority snapshot 与前后快照夹具）、`tools/relay/tests/run-relay-tests.ps1`（登记新套件）、`tools/relay/tests/relay-contract-reason-coverage.ps1`（生产扫描根加 `../policy`）、本卡 `workspace/DHR_04/`。
- Out of scope：**不生成 authority snapshot**（DHR_12 才做，本卡只消费合成夹具）；不实现最终收口 oracle（DHR_20）；不替业务仓修改 `.gitignore`；不实现 `.gitignore` 锚定前置闸（DHR_09）；不做跨模块留档唯一性搜索（DHR_19/DHR_20）；不改 DHR_01 契约函数与矩阵、DHR_02 Runner core 判定、DHR_03 adapter/宿主循环的既有分支语义（只允许新增文件与新增函数）；不改 dh-crew 任何代码或 `.dh-runtime/` active state；不把凭据值写进任何工件。
- 何时必须停下问人：策略语义与 design/02 B9 出现无法自洽的解释歧义；需要改动 P1 既有判定才能落地；两轮复核 P0/P1 三轮不收敛；E11 一次性确认本地收口授权包。

## 触及子系统（收口时更新其 as-built）

- `tools/relay/policy/`（新建子系统）——收口时新建 `docs/modules/dh-relay/as-built/relay-policy.md` 首份快照，登记允许集推导规则、reason 码表与 CLI 入口契约；`as-built/relay-contracts.md` 补一行指针"落点与隔离策略见 relay-policy.md"。
