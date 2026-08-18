# P7-DevHarness 单卡完整流水 开发方案

<!-- dh:plan-type: 开发 -->
<!-- dh:planning-event:v1 id=DHR-B-07 stage=B-adjust artifact=dev_plan/P7-DevHarness单卡完整流水-开发方案.md review=../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b07 understanding=../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#understanding-b07 -->
<!-- dh:status
汇报: P7 已按 design/06 改为多控制面单卡流水：一张真实标准卡在 DSH 关闭状态下由 CLI + Herdr 跑完 S0~E13 并出 verify；等 P6 阶段闸
现状: DHR_36~40 均未开始
进行到: P7 ▸ 阶段闸阻塞（P6 未通过）
下一步: P6 通过并经用户放行后，依据真实 Executor Profile、CLI/SSH 与 Herdr 证据做 B-调整 → fresh 审核 → 用户选真实卡 → 用户确认
看什么: design/02、design/05 §9、design/06、design/04 Workflow Contract 部分、P6 证据
阻塞: P6 Gate 未通过；真实卡尚未由用户选择
-->

## 0. B 方案审核与理解确认

### 0.1 白话说明：这个阶段做啥、解决啥、做完得到啥

- **要解决的问题**：前面搭好了内核和执行底座，但还没跑过一张真正按 dev-harness 规矩走的任务卡（开工 S0~S3、收口 E0~E13、两轮复核、人验、verify）。P7 要把 dev-harness 的流程规矩变成机器能执行的「工作流合同」，用一张真实任务卡从头到尾跑通，全程只用命令行也能完成。

| 任务 | 用大白话说在做啥 | 解决什么问题 |
|---|---|---|
| DHR_36 | 把 dev-harness 的节点表和规则翻译成一份机器可读的冻结「工作流合同」，并做一个适配器去调用现有 dh 检查工具、返回结构化结果 | 内核不用重新实现 dh 规则，只按合同调用，规矩改了合同跟着改 |
| DHR_37 | 做「授权启动」流程：任何客户端提交启动请求 → 内核校验 → 给你看启动预览 → 你确认 → 冻结授权快照 → AI 规划师出计划提案 → 编译成可执行计划 | 开工必须经过你确认，且确认的内容被冻结、事后可追溯 |
| DHR_38 | 跑开工阶段 S0~S3：建工作树和工作区、AI 写 brief 和施工计划、Herdr + Codex/Claude Code 施工、分批 checkpoint 和小审；到达「S0~S3 完成 + 首轮机器闸」的中途证据点 | 真实任务卡的施工阶段能被内核编排 |
| DHR_39 | 跑收口阶段 E0~E10：机器闸、两轮换人复核、需求复核、教训复核、as-built、交付材料准备；生成交付摘要给你看 | 收口的仪式全部机器化，命令行和 DSH 只是不同的显示方式 |
| DHR_40 | 跑最后三步 E11 你批准 → E12 合入主干并打 verify → E13 销户；DSH 关闭状态下用命令行走全程，DSH 可用时只验证显示一致 | 一张真实任务卡从头到尾在内核里闭环 |

- **完成后你手里有什么**：
  1. 一份机器可读的 dev-harness 工作流合同（以后新卡都按它跑）。
  2. 一张真实任务卡在接力内核里完整跑完、打上 verify 的实证。
  3. 启动 / 待处理提醒 / 批准这三类要你出面的动作，都有持久记录，任何客户端都能处理。
  4. 为 P8 多卡并行打下基础。

### 0.2 审核与确认记录

- **事件类型**：B-新建（2026-08-18 从 design/05 阶段主线拆出，接管冻结 P2 的单卡流水责任）+ 同日 B-调整（按 design/06 要求 DSH 关闭下完成核心路径、Start Preview / Attention / E11 Approval 均可由 CLI 完成、必经角色须有非 DSH-only Executor）。同一未确认事件内修订。
- **审核记录**：已做闸前路线图级 fresh 审核——2026-08-18 claude-grok（fresh、只读、`--model grok-4.5`）R-P79 一致性与承接审，结论「有条件通过」；原文与只读形态见 [evidence/09](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b07)。P6 阶段闸通过、用户放行后，依据前序证据再做定向 B-调整 + 复审（不是「闸前不能审」）。
- **主会话裁决**：已做——逐条采纳 / 待用户决定见 [evidence/09 §2 裁决总表](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#2-主会话裁决总表2026-08-18)；已采纳项已回写本计划正文，「待用户决定」项在正文显式标注。
- **讲解记录**：待补——重点讲清授权从哪进（authorization-request → Start Preview → 用户确认 → Authority Snapshot）、领域真相在业务仓 / 运行真相在 `.dh-relay`、E11 Receipt 承诺什么、如何用宿主外检查独立验证 verify、失败时怎么从 CLI 看到卡在哪。
- **理解问题**：待补（候选：「E11 放行确认在纯终端里只给你 releasePacket 摘要 + 证据路径，你能据此签字吗？还是必须看到图形证据页？」）。
- **用户回答 / 解释**：待补。
- **调整与复审**：待补。
- **用户确认**：待补。**DHR_36~40 为预留编号，落盘不等于 B 确认，也不构成开工授权；真实卡由用户在 P7 开工前选择，计划不代选。**

## 1. 概述

- **交付什么 / 不含什么**：
  - 交付：①`dev-harness/task-standard@1` Workflow Contract；②DevHarness Contract Exporter 或受控人工 fixture；③Gate Adapter 与结构化 Gate Result；④Authorization Request、Authority Snapshot、Plan Proposal；⑤控制客户端中立的 Start Preview / Attention / Approval；⑥S0~S3 施工路径；⑦E0~E10 机器闸、两轮复核、需求与教训复核、收口备料；⑧E11 持久 Approval、E12 Finalizer、E13 销户；⑨一张真实卡的完整 verify 闭环；⑩同一 Run 在 CLI 与任一增强客户端中状态一致的证明。
  - 不含：多卡调度、卡级重编排（用户 2026-08-18 拍板：重编排从 P8 起；P7 单卡路径命中依赖阻塞时暂停并留持久 Attention，不做卡内 replan；design/06 §10「P7」已同步改为「Start Preview、Attention 和 E11 Approval 均可由 Relay CLI 完成」）、通用诊断 Agent、周报 Outbox、run 级跨卡归档、远端 test push、Linux 完整产品定型、GUI 专属的流程完成条件。
- **必须证明的核心路径**：DSH 完全关闭 → Relay CLI 发起和观察 Run → Herdr + Codex/Claude Code 施工 → CLI 处理 Attention 与 E11 Approval → Finalizer 完成 verify。DSH / Pi 可同时连接同一 Run 提供更好展示，但不能是单卡闭环的唯一入口。
- **承接设计**（拆计划输入 = `design/README.md` 白名单）：
  - [design/06](../design/06-多控制面与Headless-SSH运行-设计补充.md) · 「验收命题」节 **H2 / H6 / H7 / H8 / H10 / H11 / H12**（全称或主承接）以及 **H1 / H3 / H4 的单卡子集**（DSH 关闭下完整授权链 / CLI 与 DSH·Pi 对同一 Start Preview 一致 / 终端断开重连不取消 Run；全称分别由 P5、P8/P9 关闭）+ §6 Headless 下的人机交互与 Approval、§7 证据模型与无 GUI 场景、§8 更换终端对流程和结果的影响、§10「P7」。
  - [design/05](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md) · §8.4 DevHarness 节点路由建议、§9 DevHarness 接入、§10.3 预运行请求、§10.4 Git 留档。
  - [design/02](../design/02-完整流水-产品设计与验收.md) · **B2**（脚本节点机器事实）、**B3**（两轮复核 + 汇合 + 需求复核调度顺序）、**B8 子集**（只继承 Finalizer 幂等 / 崩溃续跑 / 快进前置校验谓词；B8 中 psmux 窗口截图、`decision_ack`、固定短语窗口作答等护栏在多控制面下由 design/06 H8 的 Relay Approval Receipt 取代——design/02 决策 6「不再有 relay approve」是否正式退役**待用户决定**）、**B11**（复核身份链与工件不可变）、**B13**（人判 verdict 留痕）、**B14**（授权工件与授权边界）、**B17**（落户棒完整性）、**B18**（教训复核棒真实执行）；人验 **H3**（自举跑真实卡）的单卡子集——作为契约 Oracle。**B16 / H5（远端 test push）本阶段不交付。**
- **前置条件**：P6 Gate 通过；至少一个 Codex 与一个 Claude Code Executor Profile 已实测；Relay CLI、Store、Runtime 恢复与无 DSH 路径已通过 P5/P6；用户选择真实标准档任务卡；DevHarness Contract 来源 commit 与 Gate Bundle 可冻结；用户明确放行 P7。
- **实施策略一句话**：Relay 不复制 DevHarness 全文、不重实现 `dh` 规则，而是冻结 Contract + 经 Gate Adapter 调冻结版本工具；先在 S0~S3 + E0/E1 设中途证据点尽早验真卡，再补 E2~E10 与 E11~E13。
- **任务前缀 / 模块 slug**：`DHR_` / `dh-relay`。
- **批次**：批次 1=`DHR_36 → DHR_37`（Contract + 授权链）；批次 2=`DHR_38`（S0~S3 + E0/E1 中途证据点）；批次 3=`DHR_39 → DHR_40`（E0~E10 + E11~E13，第一个端到端 demo 在 DHR_40 真实卡 verify）。

## 2. 工程切分

### 2.1 实现单元

| 单元 | 职责 | 入口 / 主要文件 | 关联任务 |
|---|---|---|---|
| dh-contract | `dev-harness/task-standard@1` Contract；Exporter 或受控 fixture；hard_required / default_enabled / optional / dynamic / crosscut_action 分类；节点能力声明 | Runtime `workflows/dev-harness/`、dev-harness 仓 Exporter | DHR_36 |
| gate-adapter | 调冻结版本 `dh` 工具，返回结构化 Gate Result；source commit / Contract hash / Gate digest 变化检测 | Runtime `gates/dev-harness/` | DHR_36 / DHR_39 |
| authority | authorization-request、Start Preview、Authority Snapshot、Plan Proposal、Compiler → ResolvedPlan | Runtime `authority/`、`planner/` | DHR_37 |
| cli-devharness | `relay start preview --request <file>`、`relay start confirm <request_id>`、`relay plan show <run_id>`、`relay approve`（或等价窄命令）、`relay inspect` 显示 releasePacket 摘要 | `cli/` | DHR_37 / DHR_39 / DHR_40 |
| build-path | S0 worktree + 工作区骨架；S1/S2 Planner/Author Profile；S3 Herdr 施工；checkpoint / 小审 / 修复动态展开 | Runtime `workflows/dev-harness/nodes/s*` | DHR_38 |
| closeout-path | E0~E10 机器闸、两轮 fresh 复核、requirement / lesson review、miner、as-built、releasePacket | Runtime `workflows/dev-harness/nodes/e0-e10` | DHR_39 |
| approval-finalizer | E11 持久 Approval Request / Receipt；E12 Privileged Process Finalizer（暂存分支 squash / 复验 / 回填 / verify / CAS 快进 / journal 恢复）；E13 销户 | Runtime `approval/`、`finalizer/` | DHR_40 |
| real-card-evidence | 真实卡从 Start Preview 到 verify 的事件链、宿主外核对 | `workspace/DHR_40/evidence/` | DHR_40 |

### 2.2 复用与禁改边界

| 路径 | 禁改 / 扩展 / 新建 | 说明 |
|---|---|---|
| Runtime `workflows/`、`gates/`、`authority/`、`approval/`、`finalizer/`、`cli/` | 扩展 / 新建 | 在 P5/P6 Runtime 上增加 DevHarness 领域接入 |
| dev-harness 仓 `dh-check` / 节点表 / 动作细则 | 只读（冻结版本调用） | Gate Adapter 调用冻结 commit 的工具；Contract 从机读锚点与节点表生成 |
| 业务仓 DevPlan / workspace / review / progress / as-built / knowledge / Git commit / verify trailer | 领域真相，只由对应节点或 Finalizer 按 dev-harness 规矩写 | Relay 不改 DevPlan 目标 / 验收；Agent 不能直接调 Finalizer |
| `<repo>/.dh-relay/<run_id>/` | 运行真相 | 每个 Run 冻结 `source_repo / source_commit / contract_id / contract_version / contract_content_hash / gate_bundle_id / gate_bundle_digest / required_capabilities / allowed_control_clients / executor_profile_candidates` |
| 远端 push（test / master / main） | 禁止 | 本阶段不交付 B16 |
| DSH 页面 / Pi TUI | 增强渲染 | `allowed_control_clients` 只描述可连接与提交请求的客户端种类，不赋予直接写 Store 的权限 |

### 2.3 阶段专属约束

- **角色 → 能力路由**（不映射到唯一产品）：planner / brief / task plan（只读输入、结构化 Proposal、工件写入范围 → Pi / DSH Native / Herdr Agent）；build（交互、续接、编码、用户输入 → Herdr + Codex/Claude Code）；fresh review（独立上下文、通常只读 → Pi / DSH one-shot / fresh Herdr）；lead / requirement / lesson（结构化 verdict → Pi / DSH Native / fresh Herdr）；machine gate（确定性 → Process / Gate Adapter）；finalizer（高权限、幂等、Receipt 绑定 → Privileged Process）。任何 hard_required 角色在本次 Run 候选集合中至少一个非 DSH-only Profile；首选 DSH Executor 不可用时只允许预登记且能力等价的 fallback，无 fallback 则暂停 + Attention。
- **授权流程**：任一合法控制客户端选择项目与任务卡 → authorization-request → Relay 校验仓 / 卡 / 状态 / Git / Contract → 客户端中立 Start Preview → DSH / Pi / CLI 渲染同一 Preview → 用户确认 → Relay 原子生成 Authority Snapshot → 选定 Planner Profile 生成 Proposal → Compiler 生成 ResolvedPlan。用户确认前不创建正式 Run 与跨仓索引。
- **E11**：Relay 持久化 Approval Request，绑定 releasePacket hash / allowed effects / excluded effects / expected state；DSH / Pi / CLI 均可展示；用户回答由 Relay 保存不可变 Approval Receipt；客户端临时 Approval 不能替代 Relay Receipt。
- **E12/E13**：只有 Runner 校验 Receipt 后签发 Privileged Process Receipt；Finalizer 在暂存分支执行 squash、复验、回填、verify，再一次 CAS 快进；崩溃从 journal 最后完成步恢复。
- **中途证据点**（DHR_38 末）：S0~S3 完成 + E0/E1 Gate 运行，不执行 E11/E12/E13；用于尽早验真实代码 / 工件 / Gate 接线，不构成 P7 完成。

## 3. 任务表

### 3.1 索引

<!-- dh:tasks -->

| 任务 ID | 一句话 | 档位（轻/标准） | 状态 | 依赖 | 工作区 | 验收时间 / verify SHA | 备注 |
|---|---|---|---|---|---|---|---|
| DHR_36 | 发布 DevHarness 标准档 Contract 与 Gate Adapter | 标准 | 未开始 | P6 阶段闸（P6-M 通过 + 用户放行） | <开工时回填 workspace/…> | | 阶段闸阻塞：blocked-by-phase-gate P6 |
| DHR_37 | 接通客户端中立授权、Authority Snapshot 与棒 0 Proposal | 标准 | 未开始 | DHR_36 | <开工时回填 workspace/…> | | 阶段闸阻塞 |
| DHR_38 | 跑通 S0~S3 落户与 Herdr 施工（含 E0/E1 中途证据点） | 标准 | 未开始 | DHR_37 | <开工时回填 workspace/…> | | 阶段闸阻塞；开工 B-调整时预计拆卡 |
| DHR_39 | 接通 E0~E10 机器闸、复核与收口备料 | 标准 | 未开始 | DHR_38 | <开工时回填 workspace/…> | | 阶段闸阻塞；预计拆卡 |
| DHR_40 | 接通多控制面 E11~E13 并用真实卡完成 verify | 标准 | 未开始 | DHR_39 | <开工时回填 workspace/…> | | 阶段闸阻塞；第一个端到端 demo；真实卡由用户选 |

> 状态列只填五枚举，阶段闸阻塞写「备注」列。P6 未通过时 DHR_36~40 均不得开工。

### 3.2 任务卡

#### DHR_36

- **目标**：从 DevHarness 机读锚点、节点表与动作细则生成或维护冻结的 `dev-harness/task-standard@1` Contract（区分 hard_required / default_enabled / optional / dynamic / crosscut_action，声明节点所需能力而非写死 DSH 页面或某 Agent 产品），并实现 Gate Adapter 调冻结版本工具返回结构化 Gate Result。
- **非目标**：不重实现 `dh` 全部机器规则；不做授权链（DHR_37）；不跑真实卡。
- **验收口径**：
  - **机器证**：[design/05 §9 DevHarness 接入](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#9-devharness-接入) · 本计划 P7-M1：S0~S3、E0~E13 与源节点表可追溯；两轮独立复核、E11、E12、E13 等硬节点不可省略；source commit、Contract hash、Gate digest 变化被检测；旧 Run 继续绑定旧版本，新 Run 不静默切换。
  - **机器证**：[design/06 H10](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)：Headless 不具备视觉能力时相关节点启动前拒绝或路由，不静默通过。
  - **机器证**：[design/06 H6](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)：Contract 每个 hard_required 角色的能力声明可被至少一个非 DSH-only Profile 满足（静态校验）。
  - **机器证**：[design/02 B2](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)：Gate Result 为机器事实——exit 0 → pass、非 0 → fail 分支、超时 → error；Agent 伪造 gate_outcome 被拒。
- **变更范围**：Runtime `workflows/dev-harness/`、`gates/dev-harness/`、dev-harness 仓 Exporter（若采用）；本卡 `workspace/DHR_36/`。
- **档位**：标准（领域契约冻结 + 组件接线）。
- **实施提示**：Contract 只声明能力不绑产品；Gate Adapter 只调用不复制规则；Exporter 做不成用受控人工 fixture 但须标注来源 commit。

#### DHR_37

- **目标**：接通 §2.3 授权流程：任一合法控制客户端提交 authorization-request → Relay 校验 → 客户端中立 Start Preview → 用户确认 → 原子生成 Authority Snapshot → Planner Profile 生成 Proposal → Compiler 生成 ResolvedPlan；CLI 至少提供 `relay start preview --request <file>`、`relay start confirm <request_id>`、`relay plan show <run_id>`；DSH Bridge 与 Pi Extension 调用同一服务合同。
- **非目标**：不实现 S0~S3；不做重编排（P8）；不让 Agent 生成 Snapshot。
- **验收口径**：
  - **机器证**：[design/02 B14](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏) · P7-M2：Agent 只能写 request 与 proposal、不能生成 snapshot；未授权卡、目标变更、验收引用变化、范围越界被拒；ResolvedPlan 与 Authority、Contract、Profile 能力、effect 一致；用户确认前不创建正式 Run 与跨仓索引。
  - **机器证**：[design/06 H3 / H11](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)：CLI 与 DSH/Pi 对同一 Start Preview 的任务卡、effect、hash 一致；更换控制客户端不改变 Authority / ResolvedPlan。
  - **机器证**：[design/06 H1](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P7-M8（授权段）：DSH 不启动时可完成完整授权链。
  - **机器证**：[design/05 §10.3 预运行请求](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#103-预运行请求)：棒 0 Proposal 只含允许字段，不写 Relay state 与业务仓工件。
- **变更范围**：Runtime `authority/`、`planner/`、`cli/`（start preview/confirm、plan show）；本卡 `workspace/DHR_37/`。
- **档位**：标准（授权边界属权限红线相邻）。
- **实施提示**：复用 P1 DHR_01/DHR_04 的 authority / snapshot 契约与守卫作 Oracle；具体命令名可在本卡冻结但服务合同唯一。

#### DHR_38

- **目标**：S0 确定性创建任务 worktree 与工作区骨架；S1/S2 由已选 Planner/Author Profile 生成 brief 与 task plan（首选可为 Pi / DSH Native / Herdr）；S3 长时间施工用 Herdr + Codex/Claude Code，按批次动态展开 checkpoint / 小审 / 修复；在真实卡上到达「S0~S3 完成 + E0/E1 Gate 运行」中途证据点。
- **非目标**：不执行 E2~E13；不做多卡；中途证据点不构成 P7 完成。
- **验收口径**：
  - **机器证**：[design/02 B17](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)：工作区文件齐备且非占位（逐文件谓词）。
  - **机器证**：[design/02 B9 ①/②](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)（单卡子集）：一卡一 worktree，普通节点不写主工作树；写入 ⊆ 授权范围。
  - **机器证**：[design/06 H7 / H12](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P7-M3/M9：build Receipt 绑定 Executor Profile、账号、Contract 与 Authority；Agent `done` 且无合法 Result 时保持 `awaiting_result`；DSH Executor 丢失只中断对应 Attempt，预登记 fallback 产生 fresh Attempt。
  - **机器证**：[design/06 H2](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)：CLI 可显示当前节点、Herdr host_ref 与 Attention。
  - **机器证**：中途证据点——真实卡 S0~S3 完成、E0/E1 Gate 结果为结构化事实，落 `workspace/DHR_38/evidence/`。
- **变更范围**：Runtime `workflows/dev-harness/nodes/s*`、E0/E1 接线；本卡 `workspace/DHR_38/`（拆卡后各自）。
- **档位**：标准（真实卡施工接线；开工 B-调整时拆卡）。
- **实施提示**：真实卡由用户选、不代选；S3 复用 P6 Herdr Adapter 不另起宿主；中途证据点尽早暴露 Gate 接线问题。

#### DHR_39

- **目标**：E0/E1 使用 Process 与 Gate Adapter；代码复核两轮 fresh、施工者不复核自己；requirement review、lesson review、miner、as-built、证据挂接、交付材料按 Contract 执行；fresh review 通过能力匹配选 Pi / DSH one-shot / fresh Herdr；E9/E10 生成可序列化交付摘要与证据索引，DSH 页面与 CLI 只是不同渲染器。
- **非目标**：不做 E11~E13；不做通用诊断 Agent；不做周报 Outbox。
- **验收口径**：
  - **机器证**：[design/02 B3](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏) · P7-M4：R2 只在 R1 完成后 ready，汇合只在两轮齐全后 ready；rework 用 fresh Attempt 并重走受影响 Gate 与复核。
  - **机器证**：[design/02 B11](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)：复核工件身份链与不可变。
  - **机器证**：[design/02 B18](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)：lesson review 真正 launch 且诚实区分有候选 / 无候选 / 失败。
  - **机器证**：[design/02 B13](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)（人判 verdict 留痕子集）：需人判 E-ID 必须携带用户原文 verdict，Agent 不得代填。
  - **机器证**：[design/06 H10](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)：E10 生成绑定候选、证据与 effect 的 releasePacket；`relay inspect` 在纯终端显示 releasePacket 摘要与证据路径；无图形界面不能导致 E9/E10 被跳过。
- **变更范围**：Runtime `workflows/dev-harness/nodes/e0-e10`、`cli/`（inspect releasePacket）；本卡 `workspace/DHR_39/`（拆卡后各自）。
- **档位**：标准（复核链与收口备料接线；预计拆卡）。
- **实施提示**：复核角色能力匹配不绑产品，但 fresh review 所需的 Pi / DSH one-shot / fresh Herdr Profile 必须已在 P6 DHR_32 名册登记（缺则本卡开工 B-调整前先补登，不得临时手写）；rework 是 fresh Attempt 不是续跑；releasePacket 结构承接 dev-harness design/05 E10 定义。

#### DHR_40

- **目标**：E11 持久 Approval Request / Receipt（DSH UI、Pi TUI、CLI `relay approve` 均可展示与提交同一请求）；E12 Privileged Process Finalizer（暂存分支 squash → 复验 → 回填 → verify → 一次 CAS 快进，崩溃从 journal 恢复）；E13 销户；用用户选定的真实卡走必测路径：DSH 关闭 → CLI Start Preview 与确认 → Herdr 施工 → CLI 查看 E9/E10 → CLI 提交 E11 → E12/E13 → `verify(<scope>)`；DSH 可用时再连接同一 Run 只验展示一致性。
- **非目标**：不做远端 push；不做多卡；不把两次不同 Run 拼成结论。
- **验收口径**：
  - **机器证**：[design/06 H8](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P7-M5：E11 Receipt 绑定 releasePacket hash / allowed effects / excluded effects / expected state；同一 Approval Request 从 CLI 或 DSH 提交时 Receipt 语义与 hash 绑定一致；客户端临时 Approval 不能替代 Relay Receipt。
  - **机器证**：[design/02 B8 子集](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)（仅 Finalizer 谓词；确认闸以 [design/06 H8](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) Approval Receipt 为准，不按 B8 窗口截图取证）· P7-M6：只有 Runner 校验 Receipt 后签发 Privileged Process Receipt；Agent 不能直接调 Finalizer；每步后模拟崩溃再续跑不重复 squash/verify；master 在快进前未动；外部提交后快进拒绝 → `closeout_blocked`。
  - **机器证**：[design/06 H1 / H2 / H4 / H11](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题) · P7-M7/M8：DSH 完全关闭时 CLI 完成 Start、Attention、E11 与最终查询；控制终端断开、SSH 重连、Herdr 重连、DSH 重启或缺席均不改变 Run 真相；DSH / Pi / CLI / Herdr 状态均不能越权改写 DevHarness 完成事实。
  - **机器证**：[design/02 B10](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)（单卡子集）：宿主外检查核对 candidate、manifest、DevPlan、verify trailer 与 worktree 清理；从 Start Preview 到 verify 的事件链完整。
  - **人判**：[design/02 H3](../design/02-完整流水-产品设计与验收.md#62-人类验收栏)（单卡子集；人判问题已按 design/06 改写，**不再以「不敲命令行 / 窗口作答」为通过标准**）· P7-H：向用户展示真实卡时间线、每次 Attention / E11 的 CLI 实录、E11 在终端与（若可用）图形界面的证据展示、verify 提交；用户判断真实单卡体验是否优于手动多终端接力、纯 CLI/SSH 路径的体验与证据是否够格作为日常正式控制面之一（产品位已定为与 DSH 并行，不再问「算不算备用」）、DSH/Pi 与 Herdr 切换是否清楚、E11 证据在两种界面是否都可信易懂、失败时能否知道卡在哪。
- **变更范围**：Runtime `approval/`、`finalizer/`、`cli/`（approve）、E13 回填；`workspace/DHR_40/evidence/`。
- **档位**：标准（高权限 Finalizer + 真实卡 verify + 人判；生产接入类高危）。
- **实施提示**：DSH 关闭路径先测；同一 Run 再连 DSH 只验一致性；真实卡的 verify scope 由其 authority snapshot 冻结的 `verify_scope` 决定，不是 `dh-relay`。

### 3.3 标准档共同收口条件

同 P5/P6：两轮独立换人复核；需求境证据（DHR_38/40 须有真实卡终端实录，Approval 若有图形界面须截图）；`dh dh-relay` 与证据命令可复跑；P0/P1 清零；用户对话确认后才 `verify(dh-relay):`。DHR_40 属高危：无 verify 提交不得标完成。

## 4. P7 阶段闸

### 4.1 核心机器闸 P7-M

| ID | 命题 | 承接卡 |
|---|---|---|
| P7-M1 | DevHarness Contract 与冻结源一致，硬节点不可省略 | DHR_36 |
| P7-M2 | Authority、Proposal、ResolvedPlan 权限链闭合 | DHR_37 |
| P7-M3 | S0~S3 在真实卡上完成，Herdr 施工 Result 合法 | DHR_38 |
| P7-M4 | E0~E10 的机器闸和复核链完整 | DHR_39 |
| P7-M5 | E11 Receipt 绑定 releasePacket、effect 和 expected state | DHR_40 |
| P7-M6 | E12/E13 崩溃恢复幂等，最终产生 verify | DHR_40 |
| P7-M7 | DSH、Pi、CLI 和 Herdr 状态均不能越权改写 DevHarness 完成事实 | DHR_40 |
| P7-M8 | DSH 完全关闭时，CLI 完成 Start、Attention、E11 和最终查询 | DHR_37 / DHR_40 |
| P7-M9 | 必经角色均有非 DSH-only Executor，fallback 产生 fresh Attempt | DHR_36 / DHR_38 |

### 4.2 增强验收 P7-X 与人类闸 P7-H

- **P7-X**（决定日常首选体验，不决定单卡核心闭环）：DSH 图形化展示同一真实 Run；Pi TUI 处理一次 Attention 或 review；DSH 到 Herdr 的 pane 聚焦。
- **P7-H**（用户判断，见 DHR_40 人判项）。

### 4.3 解锁 P8 的规则

P7-M 全部通过 ∧ P7-H 明确 ∧ 用户对话同意进入 P8；P7-X 可以是通过 / 受限 / 不适用。

## 5. 从旧 P2 吸收的责任

P7 吸收旧 P2 的：workspace 八件套、标准流水节点、脚本 Gate、两轮代码复核、需求复核、教训复核、收口确认、Finalizer、Authority Snapshot、单卡真实垂直闭环。多卡、重编排、诊断、归档与 Oracle 留给 P8。旧 P2 文件级 PowerShell 实施提示不迁移。

## 6. 覆盖、颗粒度与依赖查漏

| 检查 | 结论 |
|---|---|
| 覆盖 | design/06 H2/H6/H7/H8/H10/H11/H12 由 DHR_36~40 承接，H1/H3/H4 只承接单卡子集（见 §1）；卡内重编排按用户拍板归 P8（§1 不含）；design/05 §9/§10.3 由 DHR_36/37 承接；design/02 B2/B3/B8/B11/B13/B14/B17/B18 与 H3 单卡子集作 Oracle 由 DHR_36~40 承接（B16/H5 明示本阶段不交付）；P7-M1~M9 每条至少一张卡 |
| 颗粒度 | DHR_36=Contract + Gate 验收单元；DHR_37=授权链验收单元；DHR_38=施工路径 + 中途证据点单元；DHR_39=收口备料链单元；DHR_40=E11~E13 + 真实卡人判单元；DHR_38~40 开工时按安全边界拆卡 |
| 依赖 | `DHR_36 → DHR_37 → DHR_38 → DHR_39 → DHR_40` 单链无环；DHR_36 额外依赖 P6 阶段闸；DHR_38 起额外依赖用户已选真实卡 |

## 7. 计划完工

- [ ] DHR_36~40 全部销户。
- [ ] P7-M1~M9 全部有等价 pass 证据；P7-X 三态已登记。
- [ ] 端到端证据：一张真实卡从 Start Preview 到 `verify(<scope>)` 的完整事件链 + 宿主外核对可复查；DSH 关闭路径实录。
- [ ] P7-H 已向用户展示并由用户判断；P8 是否解锁由用户明确表态。
- [ ] `dev_plan/README.md` 活跃计划表状态已更新。
