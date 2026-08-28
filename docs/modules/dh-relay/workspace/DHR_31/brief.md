<!-- dh:v1 · brief.md — 工作区封面。🔵 前置填。写"终点"，不写路线。完成条件 = 任务卡验收口径的逐字复制 + 出处回链；DevPlan 是唯一权威定义，本文件是施工现场的只读副本，口径变更以 DevPlan 为准、本文件跟改并在 progress 记一笔。 -->
# brief — DHR_31 basic-agent-task 端到端闭环

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---------|---------|-------------|
| DHR_31 | P5 | `dev_plan/P5-Relay-v2持久内核与DSH桥接-开发方案.md` §3.2 DHR_31（另：§3.3 共同收口条件、§4.1 P5-M5/P5-M7、§4.2 P5-X/P5-H） |

## 目标 (Outcome)

以 DSH 全程关闭状态，用 Relay CLI 启动、观察、恢复 `relay/basic-agent-task@1` 的 Process 闭环（prepare → process task → collect structured result → machine verify → succeeded），关闭控制终端后 Runtime 继续或可恢复，重连后读取相同事件 / 状态 / 终态；Process 闭环通过后再尝试一个 Agent 节点（Pi / DSH Native，Executor 消失只中断对应 Attempt）；同时承接 DHR_30 移交的「真实 DSH 渲染 Bridge 活数据 + 截图取证」半部（销 `RISK-DHR30-DSH-RENDER`），并把 P5-H 人判材料完整摆到用户面前。

## Zero-context 自查

执行者先读本文件、P5 DevPlan §2.1/§2.3/§3.2 DHR_31/§3.3/§4.1、design/06 §11 验收命题（H1/H2/H3/H5/H6/H7/H12 原文）、`relay-core/README.md`、`as-built/relay-core.md`、`workspace/DHR_30/review.md` 的「条件 5 取证路径分析」与 DevPlan P5 卡表 DHR_30 行（`RISK-DHR30-DSH-RENDER` 移交原文）、`workspace/DHR_26/findings.md` + DHR_49 workspace（树外 DSH 插件施工依据），再在 `wt/DHR_31` 施工。DevHarness 特有字段、Herdr（P6）、多卡、Attention/Approval 正式版、私改冻结协议均不在范围内。

## 完成条件 ★必写（= 覆盖任务验收口径的并集，标好谁验）

<每条可验证；AI 验 = 命令/测试/对样张可自动证明；人验 = 用户看 AI 在对话中展示的真实证据后确认，或用户亲眼/亲手操作确认。>

| # | 条件 | 谁验（AI / 人） | 出处（任务 ID / 来源设计文档 + 验收 ID） |
|---|------|---------------|--------------------------------|
| 1 | **机器证**：无 DevHarness、无 DSH 时 Process 闭环完整运行；控制终端关闭后 Runtime 继续；重连后事件 / 状态 / 终态一致。 | AI | DHR_31；design/06 H1 / H2 / H5；P5-M5 |
| 2 | **机器证**（若 Agent 节点执行）：Executor 消失只中断对应 Attempt，重试产生 fresh Attempt。 | AI | DHR_31；design/06 H7 / H12；P5-X（Agent Executor basic task，条件项） |
| 3 | **机器证**（`DHR-B-15` 新增，承接 P5-M7 的第二分句）：Workflow 定义期须先做可达性推导（传递闭包）再校验 H6——「被必经节点**传递**依赖的节点，自身也应视为必经」。**判据 = 四例齐，缺一不算做了可达性推导**（四例表逐字见下方附表）。判定逻辑的代码落点：落 `runtime/` 的 `validate(request)`（承接 §2.3「最小 Runtime 接口」），本卡以 basic-agent-task 的 Workflow 定义**行使**并作为验收证据——本卡的 `workflows/` 是行使场景、不是实现落点；若施工时发现须由 DHR_51 / DHR_52 先落桩，按 findings 登记、**不静默扩范围**。 | AI | DHR_31；design/06 H6；P5-M7 分句2（整条归 DHR_31，见 DevPlan §4.1 M7 行与 📍 注） |
| 4 | **机器证**（P5-X）：DSH 在 Run 已存在后作为附加客户端连接并看到同一状态；按 P4 DHR_50 结论执行（B-11）——未收敛时登记「未执行，待 DHR_50」，判否时登记不适用。**执行判定**：DHR_50 已于 2026-08-21 收敛为 `passed-with-constraints`（非未收敛、非判否）→ **本项执行**。**（承接 DHR_30 移交，用户 2026-08-28 对话裁决）**本项同时承接 DHR_30 条件 5 的「真实 DSH 渲染 Bridge 活数据 + 截图取证」半部：改树外 DHR_49 面板数据源经 Bridge 取活数据 → repack → `dsh plugin add` 重装 → 真实渲染截图（G3 需求境证据）。 | AI（截图作需求境证据，随收口在对话展示；对应人判确认见条件 5 目的块） | DHR_31；design/06 H3；P5-X；DHR_30 移交项 `RISK-DHR30-DSH-RENDER`（DHR_30 review「条件 5 取证路径分析」+ DevPlan P5 卡表 DHR_30 行） |
| 5 | **人判**：向用户展示启动 / 资源 / 恢复耗时、终端断连恢复实录与 CLI 输出；用户判断独立 Runtime + CLI 的成本是否可接受、不开 DSH 时终端控制是否足以处理故障、DSH 若可用组合是否仍像统一工作台（本问按 P4 DHR_50 结论：未收敛时延后、判否时记 N/A，不阻塞其余人判，B-11 复审回写）、选定语言是否继续作默认。 | 人 | DHR_31；design/05 §6.1 生命周期；P5-H |
| 6 | **需求境证据硬条**（§3.3）：DHR_31 须有真实终端断连 / 重连实录（落仓可追溯，作条件 1/5 的需求境证据；Bridge 截图义务已并入条件 4）。 | AI | DHR_31；DevPlan §3.3 标准档共同收口条件 |

### 条件 3 附表：H6 可达性推导四例判据（DevPlan §3.2 DHR_31 逐字搬运；少于四例时，下述错实现能全绿）

| # | 形态 | 期望 | 挡住哪种错实现 |
|---|---|---|---|
| 1 | 深度 1（`OPEN-POINTS.md` 原样例）：`gate` `required:false` 且只有 `dsh-agent`；`final` `required:true` 且 `depends_on:["gate"]` | **拒** | 完全不做可达性 |
| 2 | 深度 ≥2 传递链：`gate`(dsh-only, `required:false`) ← `mid`(`required:false`) ← `final`(`required:true`) | **拒** | 只查一层 `depends_on` |
| 3 | 阴性对照：一个 dsh-only 节点**不被任何 `required` 节点（传递）可达**，且**该图含至少一个 `required:true` 节点** | **放行** | 「见 `dsh-agent` 就拒」；以及「图里没 required 就整体跳过校验」——缺后半句它能三例全绿 |
| 4 | H6 的**直接形态**：`required:true` 且 `executor_profiles` 只有 `dsh-agent` | **拒** | 让「分句2 整条归本卡」字面为真；顺带在实现层复证 DHR_28 的 schema 断言仍生效 |

## 边界 (Boundaries)

- In scope：`relay-core/workflows/basic-agent-task/`（新建；DevPlan 变更范围写 `workflows/basic-agent-task/`，落点按 relay-core 顶层代码根实际结构取 `relay-core/` 下，施工时若按 Code Scout 侦察微调，记 progress 不改语义）、e2e 脚本与证据（`relay-core/test/` 端到端用例 + `workspace/DHR_31/evidence/` 实录落仓）、`relay-core/runtime/` 的 `validate(request)`（条件 3 判定逻辑落点）、本卡 `workspace/DHR_31/`；**（承接 DHR_30 截图义务随附，R-P-02 补齐）**树外 DSH Host Plugin（DHR_49 面板数据源改经 Bridge 取活数据）及其 repack / 重装产物——**仅限该承接项**，树外改动照 DHR_26 侦察落档施工、证据回落本卡 workspace。
- Out of scope：任何 DevHarness 特有字段；Herdr（P6）；多卡；Attention / Approval 正式版（P7/P8）；改冻结协议（除非按流程走契约修订批次并重生成三份基线）；完整 DSH Client UI（承接项只改 DHR_49 面板数据源，不新建 UI）；承接项之外的任何树外改动；push / deploy / 环境生产操作。**非目标原文（DevPlan 逐字）**：不使用任何 DevHarness 特有字段；不跑 Herdr（P6）；不做多卡；DSH 作为附加客户端连接只验展示一致性，P4 判否时记不适用。
- 何时必须停下问人：（默认只有 E11 一次性确认本地收口授权包、复核降级请求、P0/P1 三轮不收敛或需人裁决；E12/E13 包内机械步骤不重复索权，"待复核 / 待收口"不是停工理由）另：需改冻结协议或扩大变更范围（含树外承接项之外的树外改动）、条件 3 发现须 DHR_51/DHR_52 先落桩时的范围裁决、DHR_50 约束解释需要改变时。

## 触及子系统（收口时更新其 as-built）

- `as-built/relay-core.md`（workflows / runtime validate / e2e 增量）
- 树外 DSH Host Plugin：本仓无对应 as-built，改动与 repack 证据回落 `workspace/DHR_31/`（照 DHR_26 侦察落档）
