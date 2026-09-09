# P1-RelayLight 开发方案（**正式开发方案 · 2026-09-09 用户确认**）

<!-- dh:plan-type: 开发 -->
<!-- dh:planning-event:v1 id=RLT-B-01 stage=B-new artifact=dev_plan/P1-RelayLight-开发方案.md review=../design/evidence/02-交叉审核记录-RelayLight-B拆计划.md#review-rlt-b01 understanding=../design/evidence/02-交叉审核记录-RelayLight-B拆计划.md#understanding-rlt-b01 -->
<!-- dh:status
汇报: RelayLight P1 开发方案已生效，19 张任务卡待按批次开工
现状: 19 卡 5 批覆盖正式输入 119 条验收；用户 2026-09-09 确认，尚无任务开工
进行到: P1 ▸ B-新建已落盘
下一步: 第 1 批按依赖开工，批末 RLT_12 交付首个端到端 demo
看什么: design/01-RelayLight-产品设计与验收.md + 本文件
阻塞: 无
-->

> **本文件是 relay-light 的正式开发方案，已经用户确认。** 生效范围仅限任务定义与 `RLT_` 号段：**不授权任何任务开工、不授权改代码、verify、合并、推送或部署**，各卡仍按依赖与批次逐张走 D 开工的门。

## 0. B 方案审核与理解确认

审核、裁决、讲解、理解问答与确认的完整记录见 [`design/evidence/02-交叉审核记录-RelayLight-B拆计划.md`](../design/evidence/02-交叉审核记录-RelayLight-B拆计划.md)。

- **事件类型**：B-新建（首次为 relay-light 建 DevPlan、发 `RLT_` 号段并切五批），事件 ID `RLT-B-01`。
- **审核记录**：**已完成**。codex 只读沙盒、gpt-5.6-terra high、fresh context 未参与起草，机器强制只读；结论需回 A，P0=0、P1=6、P2=3。见 evidence/02 §一。
- **主会话裁决**：**已完成**，9 条逐条裁决、无驳回。4 条设计缺口加 1 条路径授权升 A′ 增补，3 条计划问题 AI 已修，1 条误读改写为实施证据要求，2 条产品决定交用户。见 evidence/02 §二。
- **讲解记录**：**已完成**，四层讲解覆盖五批地图与五问（入口、状态落点、行为承诺、独立验证、失败处置），并讲了三个理解风险。见 evidence/02 §四。
- **理解问题**：**已完成**，一次一问——「新增任务卡场景里，新卡工作区七件套谁建、何时建」。见 evidence/02 §四。
- **用户回答 / 解释**：用户答「接力计划增加这张卡的节点，之后按正常任务跑」，判定理解正确（W 阶段 builder 建）；用户另问「19 卡是否太多」，主会话按 6 实现 + 4 基础设施 + 8 实跑 + 1 watch 解释，建议保持，用户确认。见 evidence/02 §四。
- **调整与复审**：**已完成两轮定向复审**。第一轮 4 P1 + 1 P2 全采纳并修复，第二轮 4 处残留全修，修后主会话 grep 与机械自查复核闭合。见 evidence/02 §三。
- **用户确认**：**2026-09-09 用户明文「确认」**，B 计划与 A′ 增补同批生效。

## 1. 概述

- **交付什么**：Python 标准库单文件账本程序 `relay_log.py`（前四批 `add/status/lint`，第 5 批补 `watch`）、两侧同源的 relay-light skill 五件、五阶段模板与 dev-harness 映射、仓内协议与测试登记、Windows/ThinkPad 四组合实跑及完整人验证据；`watch` 设计已冻结，**第 5 批必做**，独立成批以免前四批被它拖住。
- **不含什么**：不改 dev-harness；不迁移或替换现役 dh-relay Runner/Ticket/Receipt；不做身份物理校验、停滞检测、锁、无 Herdr 退路、E11/E12/E13 接力；**前四批不依赖 `watch`**，各自可先验收，但 `watch` 本身不是可选项。
- **承接设计**：唯一业务输入为 [`design/01-RelayLight-产品设计与验收.md`](../design/01-RelayLight-产品设计与验收.md)，承接其 104 条 `HC-RL-A*` 与 15 条 `HC-RL-H*`，共 119 条；README、`design/drafts/`、`evidence/` 只用于入口或形成史，不作业务输入。
- **实施策略一句话**：先用只读一致性对照钉住与现役 Runner 的有意差异，再形成可跑的最小账本与 skill，在第一批跑出 Windows Claude 真计划闭环，随后补主控互换、异常/改计划、Linux，第 5 批补 `watch`。
- **任务前缀 / 模块 slug**：`RLT_`（从 `RLT_01` 起，全模块唯一）/ `relay-light`（verify scope=`relay-light`）。
- **落点约束**：skill 仅落用户级 `~/.claude/skills/relay-light/` 与 `~/.codex/skills/relay-light/`，两侧同源；仓内 relay-light 只放文档、`tools/relay-light/relay_log.py` 及测试/测试入口；仓内不另存第三份 skill 源。
- **方向决策账判断**：`RLT_01` 必须成卡，因为它要改用户级目录、须在开工时取得用户授权并留可重建证据（同步方式本身已由本计划定为复制脚本 + 清单哈希，不再是方向岔路）；`RLT_17` 必须成卡，因为 Linux 证据只能在用户 ThinkPad 上取得。其余 Windows 场景、Recipe、阶段合同已由正式输入冻结，没有新的方向岔路，不另造方向卡。

## 2. 工程切分（慢变约束）

### 2.1 实现单元

| 单元 | 职责 | 入口 / 主要文件 | 关联任务 |
|---|---|---|---|
| sync-ledger | 冻结两侧 skill 同源方式并给可重建、可比对证据 | 两个用户级 skill 目录、任务方向账 | RLT_01 |
| parity-ledger | 只读对照 relay-light 与现役 Runner 的节点/角色/事件/关闭语义 | `docs/modules/relay-light/as-built/` | RLT_02 |
| relay-plan | marker、两表解析、结构 lint、依赖与阶段实例约束 | `tools/relay-light/relay_log.py`、单测 | RLT_03 |
| relay-log | 纯追加、七字段、状态机、退出码与错误合同 | 同上 | RLT_04 |
| status-lifecycle | 状态派生、阶段结果、关闭顺序、写者交接与机械分路 | 同上 | RLT_05 |
| recipe-config | `roles.toml`、`dh-mapping.toml`、Recipe 与两套止损计数 | 两侧 skill 配置、单测 | RLT_06 |
| skill-core | 核心、双 adapter、五阶段模板、提示词与职责边界 | 两侧用户级 skill | RLT_07 |
| repo-governance | relay-light 判定段、索引、双模块身份与 B-adjust 例外 | `AGENTS.md` | RLT_08 |
| plan-amend | 追加改计划、白名单、摘要与 planner-amend 提示词 | 程序、单测、两侧 skill | RLT_09 |
| test-entry | unittest、PowerShell 薄壳、仓库全量测试登记 | `tools/relay-light/test_relay_log.py`、`tools/tests/` | RLT_10 |
| evidence | 真计划、账本、状态、方向/异常/跨平台人验 | `docs/modules/relay-light/relay/`、任务工作区 | RLT_12~RLT_17、RLT_19 |
| watch | 只通知的 watch 与忙时/死亡兜底实测（第 5 批） | 程序、测试、adapter | RLT_18 |

### 2.2 复用与禁改边界

| 路径 | 禁改 / 扩展 / 新建 | 说明 |
|---|---|---|
| `tools/relay-light/relay_log.py` | 新建 / 增量扩展 | Python ≥3.11，仅标准库；P1 只做 add/status/lint |
| `tools/relay-light/test_relay_log.py` | 新建 / 增量扩展 | Windows 与 Linux 直跑同一份 unittest |
| `tools/tests/relay-light-log.ps1` | 新建 | Windows 测试薄壳，原样转发退出码 |
| `tools/tests/run-relay-tests.ps1` | 仅登记套件 | 不顺手改 runner 逻辑 |
| 两侧用户级 `relay-light/` | 新建 / 同源同步 | 五文件逐字节一致，不在仓内存第三份 skill 源 |
| `AGENTS.md` | 仅追加/修订 relay-light 判定与双模块索引 | 现役 Runner 铁律只加“冻结流水”边界，不重写内容 |
| `tools/runner/`、`tools/host/`、`tools/contracts/` | **禁改** | 只允许 RLT_02 只读对照；不得出现在任何任务的允许路径中 |
| dev-harness 仓与 `~/.claude/skills/dev-harness/` | **禁改** | relay-light 的运行中 B-adjust 例外只写进本仓 AGENTS，不改上游规则 |

## 3. 任务表

### 3.1 索引

<!-- dh:tasks -->

| 任务 ID | 一句话 | 档位（轻/标准） | 状态 | 批次 | 依赖 | 工作区 | 验收时间 / verify SHA | 备注 |
|---|---|---|---|---|---|---|---|---|
| RLT_01 | 冻结并落实两侧 skill 同源方式 | 标准 | 未开始 | 1 | — | — | — | 方向决策账 |
| RLT_02 | 对照 relay-light 与现役 Runner 四类核心语义 | 轻 | 未开始 | 1 | — | — | — | 单独一致性卡，只读现役实现 |
| RLT_03 | 实现 relay_plan 解析与结构 lint | 标准 | 未开始 | 1 | RLT_02 | — | — | — |
| RLT_04 | 实现纯追加账本与 agent 状态机 | 标准 | 未开始 | 1 | RLT_03 | — | — | — |
| RLT_05 | 实现 status、阶段生命周期与写者交接 | 标准 | 未开始 | 1 | RLT_03、RLT_04 | — | — | — |
| RLT_06 | 落地角色/映射配置、Recipe 与止损计数 | 标准 | 未开始 | 1 | RLT_03、RLT_05 | — | — | — |
| RLT_07 | 编写两侧同源 skill、adapter 与五阶段模板 | 标准 | 未开始 | 1 | RLT_01、RLT_02、RLT_05、RLT_06 | — | — | — |
| RLT_08 | 接入 AGENTS 判定、协议索引与双模块身份 | 标准 | 未开始 | 1 | RLT_07 | — | — | 显式登记有意绕过 B-adjust |
| RLT_10 | 建立 unittest、PowerShell 薄壳与全量测试入口 | 标准 | 未开始 | 1 | RLT_03、RLT_04、RLT_05、RLT_06、RLT_07 | — | — | — |
| RLT_12 | Windows Claude 主控跑首个真计划闭环 | 标准 | 未开始 | 1 | RLT_01、RLT_03、RLT_04、RLT_05、RLT_06、RLT_07、RLT_08、RLT_10 | — | — | **第一个端到端 demo** |
| RLT_11 | 回流三条教训并核对持久化退场合同 | 轻 | 未开始 | 2 | RLT_07、RLT_12 | — | — | — |
| RLT_13 | Windows Codex 主控复跑并验证纯配置换协作 | 标准 | 未开始 | 2 | RLT_12 | — | — | — |
| RLT_09 | 实现运行中追加改计划与白名单守门 | 标准 | 未开始 | 3 | RLT_03、RLT_04、RLT_05、RLT_06、RLT_07 | — | — | — |
| RLT_14 | 实跑 blocked/decider 的 auto 与 consult 两路 | 标准 | 未开始 | 3 | RLT_12 | — | — | — |
| RLT_15 | 实跑复核返工超限与 strategist 人闸 | 标准 | 未开始 | 3 | RLT_06、RLT_12 | — | — | — |
| RLT_16 | 实跑卡内追加节点的运行中改计划 | 标准 | 未开始 | 3 | RLT_09、RLT_12、RLT_14 | — | — | — |
| RLT_19 | 实跑新增任务卡并追加阶段 | 标准 | 未开始 | 3 | RLT_09、RLT_12、RLT_16 | — | — | 新卡七件套由 W 阶段 builder 建 |
| RLT_17 | ThinkPad 上完成 Linux 双主控取证账与实跑 | 标准 | 未开始 | 4 | RLT_10、RLT_13、RLT_19 | — | — | 难取证方向账；用户设备依赖 |
| RLT_18 | 实现并实测 watch 通知与兜底 | 标准 | 未开始 | 5 | RLT_05、RLT_07、RLT_13 | — | — | **第 5 批，前四批完成后直接开工** |

> 工作区在 D 开工时按模板回填；本草案未开工，故统一填“—”。状态列仅使用“未开始”。

### 3.2 任务卡

#### RLT_01 — 两侧 skill 同源方向决策与落地

- **目标**：落实两侧 skill 同源机制并给可重建、可比对的证据。**同步方式是计划内技术选择，不作为用户裁决项**：默认走**复制脚本 + 五文件清单哈希校验**（Windows 与 Linux 都可用、可回滚、可重建）；**软链仅当两个平台都支持时**作为可选优化，不支持即回落复制。方向账记录选型依据、回滚与重建命令、失败表现。
- **非目标**：不编写 skill 业务内容；不在仓内新建第三份 skill 源；不改 dev-harness。
- **验收口径**：
  - **机器证**｜来源：[`design/01`](../design/01-RelayLight-产品设计与验收.md) + `HC-RL-A32`｜两侧五文件逐一哈希一致；方向账记录选项、裁决、回滚/重建命令与失败表现。
- **变更范围**：两个用户级 skill 目录及本卡方向账。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_01 -->
  - `~/.claude/skills/relay-light/**`
  - `~/.codex/skills/relay-light/**`
  - `docs/modules/relay-light/workspace/RLT_01/**`
- **档位**：标准（用户级能力接线与方向裁决）。
- **任务类型**：常规 <!-- dh:task-type:v1 task=RLT_01 type=normal -->
- **实施提示**：同步方式由本计划直接定为「复制脚本 + 清单哈希」，不再挂用户裁决；但**实际改动用户目录（`~/.claude/`、`~/.codex/`）仍须在开工时经用户授权**，授权范围写进 task_plan 并留对话证据。不得把凭据值写入方向账。

#### RLT_02 — 与现役 Runner 一致性对照

- **目标**：单独产出 relay-light 与现役 Runner 对“节点、角色、事件、关闭”的逐项对照，逐条裁决为“有意差异”或“遗漏”，给后续代码卡固定边界。
- **非目标**：只读现役 Runner/Ticket/Receipt，不修改、不迁移、不复用其代码；不借对照扩大 relay-light 首版范围。
- **验收口径**：
  - **机器证**｜来源：[`design/01`](../design/01-RelayLight-产品设计与验收.md) + `HC-RL-A14`｜对照文档四类定义逐项有结论，且现役 `tools/runner/`、`tools/host/`、`tools/contracts/` diff 为空。
- **变更范围**：新增 relay-light as-built 对照文档与本卡工作区。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_02 -->
  - `docs/modules/relay-light/as-built/现役Runner一致性对照.md`
  - `docs/modules/relay-light/workspace/RLT_02/**`
- **档位**：轻（只读对照 + 文档）。
- **任务类型**：轻量 <!-- dh:task-type:v1 task=RLT_02 type=light -->
- **实施提示**：跨语言只借纯追加手法和枚举命名，不复用现役实现；禁改路径不得进入 diff。

#### RLT_03 — relay_plan 解析与结构 lint

- **目标**：实现 marker、固定双表、节点/agent/阶段实例/依赖/trigger/close 的 fail-closed 解析与 lint，使合法计划可机械读、非法计划带验收编号拒绝。
- **非目标**：不实现账本写入与状态机；不实现模板生成器；不写死下一阶段顺序。
- **验收口径**：
  - **机器证**｜来源：design/01 + `HC-RL-A46`｜节点号含 superseded 在内全计划唯一。
  - **机器证**｜来源：design/01 + `HC-RL-A47`｜close 仅空或 `agent:<同节点已存在名字>`。
  - **机器证**｜来源：design/01 + `HC-RL-A48`｜depends_on 存在且无环。
  - **机器证**｜来源：design/01 + `HC-RL-A72`｜依赖 superseded 节点必拒。
  - **机器证**｜来源：design/01 + `HC-RL-A64`｜status/lint 忽略 superseded 行。
  - **机器证**｜来源：design/01 + `HC-RL-A73`｜superseded 不算 closed/pending。
  - **机器证**｜来源：design/01 + `HC-RL-A75`｜空节点或 agent 全 superseded 必拒。
  - **机器证**｜来源：design/01 + `HC-RL-A86`｜阶段枚举、分组连续与 stages 顺序正确。
  - **机器证**｜来源：design/01 + `HC-RL-A104`｜stage_id 格式、card 前缀及 k 可解析。
  - **机器证**｜来源：design/01 + `HC-RL-A109`｜同卡阶段串行、跨卡并行。
  - **机器证**｜来源：design/01 + `HC-RL-A87`｜card 属于 marker cards，支持跨卡。
  - **机器证**｜来源：design/01 + `HC-RL-A88`｜禁止 kickoff/verify-signoff，映射不含 E11~E13。
  - **机器证**｜来源：design/01 + `HC-RL-A24`｜固定双表、禁竖线、agent.node/重名/默认依赖合同成立。
  - **机器证**｜来源：design/01 + `HC-RL-A18`｜marker 五字段齐全，plan_loaded 带版本。
  - **机器证**｜来源：design/01 + `HC-RL-A90`｜decision_mode 仅 auto/consult 且 status 可读。
  - **机器证**｜来源：design/01 + `HC-RL-A35`｜trigger 三态及引用校验成立。
  - **机器证**｜来源：design/01 + `HC-RL-A71`｜on:done 不能跨节点引用。
- **变更范围**：计划解析/lint 代码与对应 unittest。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_03 -->
  - `tools/relay-light/relay_log.py`
  - `tools/relay-light/test_relay_log.py`
  - `docs/modules/relay-light/workspace/RLT_03/**`
- **档位**：标准。
- **任务类型**：重核 <!-- dh:task-type:v1 task=RLT_03 type=heavy -->
- **实施提示**：字符串比较区分大小写；解析只逐行扫描与 split，不引入 Markdown 解析依赖。

#### RLT_04 — 纯追加账本与 agent 状态机

- **目标**：实现 `add` 的七字段 JSONL 纯追加、事件白名单、attempt 分配、agent 状态机、触发前置、退出码与统一错误输出。
- **非目标**：不加锁、不做临时文件替换、不做写入者身份真伪校验、不做产出质量判断。
- **验收口径**：
  - **机器证**｜来源：design/01 + `HC-RL-A37`｜连续 20 次 add 的 seq 为 1..20。
  - **机器证**｜来源：design/01 + `HC-RL-A38`｜20 次追加无重复、无覆盖、旧行字节不变。
  - **机器证**｜来源：design/01 + `HC-RL-A39`｜不产生临时文件。
  - **机器证**｜来源：design/01 + `HC-RL-A40`｜无锁实现。
  - **机器证**｜来源：design/01 + `HC-RL-A2`｜19 个事件词 fail closed。
  - **机器证**｜来源：design/01 + `HC-RL-A41`｜枚举严格区分大小写。
  - **机器证**｜来源：design/01 + `HC-RL-A42`｜无 lower/casefold 枚举归一。
  - **机器证**｜来源：design/01 + `HC-RL-A5`｜plan 缺失/坏计划三命令退出 3。
  - **机器证**｜来源：design/01 + `HC-RL-A45`｜坏账本 status 退出 4。
  - **机器证**｜来源：design/01 + `HC-RL-A84`｜空账本与首行 plan_loaded 语义正确。
  - **机器证**｜来源：design/01 + `HC-RL-A55`｜每行固定七字段、agent 格式正确。
  - **机器证**｜来源：design/01 + `HC-RL-A50`｜配对键为 `(node, agent)`。
  - **机器证**｜来源：design/01 + `HC-RL-A49`｜attempt 每节点从 1 起、跨节点不累计。
  - **机器证**｜来源：design/01 + `HC-RL-A58`｜attempt 跳号/重号拒绝。
  - **机器证**｜来源：design/01 + `HC-RL-A51`｜账本不含 pane ID。
  - **机器证**｜来源：design/01 + `HC-RL-A59`｜node/agent/event 入参与三类豁免正确。
  - **机器证**｜来源：design/01 + `HC-RL-A60`｜agent 状态机与终态封口正确。
  - **机器证**｜来源：design/01 + `HC-RL-A68`｜node_start/node_close/monitor_restart 时序正确。
  - **机器证**｜来源：design/01 + `HC-RL-A69`｜控制事件分类与升级链 agent 归属正确。
  - **机器证**｜来源：design/01 + `HC-RL-A70`｜on:done 只接受同节点已 done。
  - **机器证**｜来源：design/01 + `HC-RL-A77`｜on:blocked 只接受未 resume 的阻塞现场。
  - **机器证**｜来源：design/01 + `HC-RL-A78`｜依赖未闭合/node 未开始时拒绝启动。
  - **机器证**｜来源：design/01 + `HC-RL-A17`｜节点关闭双条件合取。
  - **机器证**｜来源：design/01 + `HC-RL-A74`｜close 条件 2 只认 done。
  - **机器证**｜来源：design/01 + `HC-RL-A63`｜错误只进 stderr 且格式统一。
  - **机器证**｜来源：design/01 + `HC-RL-A56`｜add 的 0/2/3/4 可复现。
- **变更范围**：账本追加与 agent 状态机代码、单测。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_04 -->
  - `tools/relay-light/relay_log.py`
  - `tools/relay-light/test_relay_log.py`
  - `docs/modules/relay-light/workspace/RLT_04/**`
- **档位**：标准。
- **任务类型**：重核 <!-- dh:task-type:v1 task=RLT_04 type=heavy -->
- **实施提示**：使用 `open(..., 'a')` 一行一 JSON；`by` 只验形态一致性，不声称验真。

#### RLT_05 — status、阶段生命周期与写者交接

- **目标**：从 plan+账本派生节点/阶段/agent 状态、可关闭原因、open_stages、阶段结果与机械分路，并守住 node_close→stage_result→stage_close 的交接偏序。
- **非目标**：不判断产出是否合格；不驱动 Herdr；不缓存或硬编码 W→C→R→F。
- **验收口径**：
  - **机器证**｜来源：design/01 + `HC-RL-A43`｜status 六项齐并与样张一致。
  - **机器证**｜来源：design/01 + `HC-RL-A44`｜status 不含产出合格性判断。
  - **机器证**｜来源：design/01 + `HC-RL-A110`｜重复阶段实例结果独立。
  - **机器证**｜来源：design/01 + `HC-RL-A111`｜open_stages 支持跨卡多个、同卡至多一个。
  - **机器证**｜来源：design/01 + `HC-RL-A112`｜阶段收尾偏序非法即拒。
  - **机器证**｜来源：design/01 + `HC-RL-A105`｜stage_result 四 outcome、可多写且最新生效。
  - **机器证**｜来源：design/01 + `HC-RL-A118`｜blocked 后 done/cancelled 终局正确。
  - **机器证**｜来源：design/01 + `HC-RL-A106`｜`last_stage_result.outcome` 派生 `suggested_action` 五枚举（`open_next_stage`/`wait_user`/`relaunch_monitor`/`notify_user`/`none`），`monitor_relaunch_count` 使 failed 最多重拉一次。
  - **机器证**｜来源：design/01 + `HC-RL-A85`｜控制/agent 事件写入者一致性守门。
  - **机器证**｜来源：design/01 + `HC-RL-A93`｜编排与监工 seq 区间不交错。
  - **机器证**｜来源：design/01 + `HC-RL-A89`｜阶段级事件、关闭与跨阶段依赖时序正确。
  - **机器证**｜来源：design/01 + `HC-RL-A65`｜未触发 agent 不算悬空。
  - **机器证**｜来源：design/01 + `HC-RL-A61`｜当前节点与 pending/ready/open 派生正确。
  - **机器证**｜来源：design/01 + `HC-RL-A81`｜closed 只读 node_close，closable 独立计算。
  - **机器证**｜来源：design/01 + `HC-RL-A62`｜status JSON 顶层字段按 §3.5 冻结键名齐全（`current_stage`/`last_stage_result`/`suggested_action`/`monitor_relaunch_count`/`pending_nodes`/`superseded_ignored`/`open_stages`）且空值语义正确、排序满足合同。
- **变更范围**：status/lifecycle 代码与 unittest。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_05 -->
  - `tools/relay-light/relay_log.py`
  - `tools/relay-light/test_relay_log.py`
  - `docs/modules/relay-light/workspace/RLT_05/**`
- **档位**：标准。
- **任务类型**：重核 <!-- dh:task-type:v1 task=RLT_05 type=heavy -->
- **实施提示**：分路只看 `last_stage_result.outcome`，`suggested_action` 是派生建议不是命令，编排仍自己查表；关终端空间是外部动作，只验证其证据顺序，不伪造程序控制。

#### RLT_06 — 角色/映射配置、Recipe 与止损

- **目标**：建立可加载的 `roles.toml`/`dh-mapping.toml`，以任务卡 `任务类型` 为 Recipe 唯一来源，机械校验 reviewer 集合与 attempt/X 两套独立止损。
- **非目标**：不把模型名写入流程/模板；不改 dev-harness；不自行给 legacy 缺失任务类型的卡选默认值。
- **验收口径**：
  - **机器证**｜来源：design/01 + `HC-RL-A107`｜attempt 与 X 轮数独立触发 strategist。
  - **机器证**｜来源：design/01 + `HC-RL-A116`｜recipe 三值及实际 reviewer 集合严格匹配配置。
  - **机器证**｜来源：design/01 + `HC-RL-A117`｜Recipe 只来自任务类型，缺失时停下问用户。
  - **机器证**｜来源：design/01 + `HC-RL-A91`｜roles.toml 全角色可加载，模板无硬编码模型。
  - **机器证**｜来源：design/01 + `HC-RL-A92`｜映射承载阶段、Recipe、limits、on_exceed 四类内容。
  - **机器证**｜来源：design/01 + `HC-RL-A115`｜heavy/normal/light reviewer 集合对齐 dev-harness 节点表。
  - **机器证**｜来源：design/01 + `HC-RL-A99`｜改 `limits.rework_max_rounds` 不改 relay_log 即改变规划出的 X 节点数；模板生成走 lint/skill 内部实现，对外子命令仍只有 add/status/lint。
  - **机器证**｜来源：design/01 + `HC-RL-A108`｜checker 默认有、删除后仍可 lint/status。
  - **机器证**｜来源：design/01 + `HC-RL-A97`｜X 超限拒绝；strategist 链结论必须经 `user_decision` 才能走 resume 或 cancelled，auto 模式亦然。
- **变更范围**：两侧配置与程序读取/校验单测。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_06 -->
  - `~/.claude/skills/relay-light/roles.toml`
  - `~/.claude/skills/relay-light/dh-mapping.toml`
  - `~/.codex/skills/relay-light/roles.toml`
  - `~/.codex/skills/relay-light/dh-mapping.toml`
  - `tools/relay-light/relay_log.py`
  - `tools/relay-light/test_relay_log.py`
  - `docs/modules/relay-light/workspace/RLT_06/**`
- **档位**：标准。
- **任务类型**：重核 <!-- dh:task-type:v1 task=RLT_06 type=heavy -->
- **实施提示**：reviewer 三档取值以正式输入 §6.3 为唯一权威（§6.2 已改为只写结构不写取值），止损节名是 `[limits]` 与 `[limits.on_exceed]`；配置定位按 §6.2.1 的优先级实现——`--config-dir` 优先，其次读当前平台自己的 skill 目录，**不做跨目录比对**，并把实际使用目录写进 `plan_loaded` 的 note。

#### RLT_07 — skill 核心、adapter 与五阶段模板

- **目标**：写齐两侧同源 skill 五件，冻结角色拉取、等待接收者、五阶段模板、命令模板、密钥红线、职责分工、批内不换人和异常决策链。
- **非目标**：不改 dev-harness；不让流程文档硬编码模型；不实现 `watch`；不把运行计划放进任务工作区。
- **验收口径**：
  - **机器证**｜来源：design/01 + `HC-RL-A12`｜skill 五件与核心小节齐全且落点正确。
  - **机器证**｜来源：design/01 + `HC-RL-A19`｜Linux 收口前直跑测试并原样记 progress 的硬规则存在。
  - **机器证**｜来源：design/01 + `HC-RL-A21`｜两 adapter/模板均写 wait 返回必须有接收者及三种方式。
  - **机器证**｜来源：design/01 + `HC-RL-A26`｜双平台命令、claude kind 起法与 stalled 处置冻结。
  - **机器证**｜来源：design/01 + `HC-RL-A27`｜核心与派活模板均含凭据值禁写规则。
  - **机器证**｜来源：design/01 + `HC-RL-A66`｜coder 四行小结、scribe 三素材优先级与禁写边界齐全。
  - **机器证**｜来源：design/01 + `HC-RL-A67`｜findings/lesson 归 coder，progress 归 scribe。
  - **机器证**｜来源：design/01 + `HC-RL-A95`｜场景一四角色 trigger 与 close 正确。
  - **机器证**｜来源：design/01 + `HC-RL-A102`｜批内 checkpoint 往返不增加 attempt。
  - **机器证**｜来源：design/01 + `HC-RL-A113`｜仅实例失联/取消/阶段失败后可增加 attempt。
  - **机器证**｜来源：design/01 + `HC-RL-A103`｜节点级返工才换实例，C/X 各自 #1。
  - **机器证**｜来源：design/01 + `HC-RL-A114`｜auto/consult 决策链顺序严格。
  - **机器证**｜来源：design/01 + `HC-RL-A96`｜两模式 resume 原 coder 且不新增 launch。
  - **机器证**｜来源：design/01 + `HC-RL-A98`｜计划/账本落模块 relay 目录，不落任务工作区。
  - **机器证**｜来源：design/01 + `HC-RL-A100`｜“终端空间/任务工作区”术语不混用。
- **变更范围**：两侧 skill 五文件及结构测试。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_07 -->
  - `~/.claude/skills/relay-light/**`
  - `~/.codex/skills/relay-light/**`
  - `tools/relay-light/test_relay_log.py`
  - `docs/modules/relay-light/workspace/RLT_07/**`
- **档位**：标准（Agent 协议接线）。
- **任务类型**：重核 <!-- dh:task-type:v1 task=RLT_07 type=heavy -->
- **实施提示**：改协作只改配置/模板；adapter 必须写无 watch 的前台 wait 回退，因为前四批 `watch` 尚未落地，不得假定它已存在。

#### RLT_08 — AGENTS 判定、协议索引与模块身份

- **目标**：新增 relay-light 编排协议段、标头判定、双模块入口与 skill 索引；给现役 Runner 铁律加“冻结流水”边界，并登记运行中改计划有意绕过 B-adjust 的窄例外。
- **非目标**：不重写或弱化现役 Runner 铁律；不改 dev-harness；窄例外不得延伸到设计方案/验收清单或接力之外。
- **验收口径**：
  - **机器证**｜来源：design/01 + `HC-RL-A33`｜AGENTS 有 skill 索引，dev-harness diff 为空。
  - **机器证**｜来源：design/01 + `HC-RL-A28`｜relay-light 协议段存在，现役铁律标冻结流水，且显式登记 B-adjust 窄例外。
  - **机器证**｜来源：design/01 + `HC-RL-A34`｜worker 标头与 RELAY_RECEIPT 分流句可 grep。
  - **机器证**｜来源：design/01 + `HC-RL-A29`｜slug/路径/scope 与双模块 `dh relay-light` 解析正确。
- **变更范围**：仓根 AGENTS 与本卡工作区。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_08 -->
  - `AGENTS.md`
  - `docs/modules/relay-light/workspace/RLT_08/**`
- **档位**：标准（常驻 Agent 行为合同）。
- **任务类型**：常规 <!-- dh:task-type:v1 task=RLT_08 type=normal -->
- **实施提示**：必须原文表达“有意绕过 B-adjust”，同时声明设计与验收仍走 dev-harness；不得改上游 skill 来消除冲突。

#### RLT_09 — 运行中追加改计划与白名单守门

- **目标**：实现 `plan_amend`、表尾追加/旧行 superseded、编排重读、stage_result amend 摘要，以及 planner-amend 输入四件/一次改完/lint 三次/禁区整份不落笔的提示词与可执行白名单校验。
- **非目标**：不原地复用节点号；不允许 planner-amend 改 `design/`；不把白名单内部分先落笔；不借此改变正式验收 ID。
- **验收口径**：
  - **机器证**｜来源：design/01 + `HC-RL-A119`｜plan_amend 写者、note、可重复与不进状态机正确。
  - **机器证**｜来源：design/01 + `HC-RL-A120`｜两项连续性放宽通过，四项硬约束仍拒绝。
  - **机器证**｜来源：design/01 + `HC-RL-A121`｜仅追加计划后 status 重读出新阶段与非固定顺序。
  - **机器证**｜来源：design/01 + `HC-RL-A122`｜三类白名单、design 禁区与全有全无守门可执行。
  - **机器证**｜来源：design/01 + `HC-RL-A123`｜有/无 plan_amend 时 stage_result 摘要格式正确。
- **变更范围**：程序、单测及两侧 skill 的 planner-amend 模板。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_09 -->
  - `tools/relay-light/relay_log.py`
  - `tools/relay-light/test_relay_log.py`
  - `~/.claude/skills/relay-light/**`
  - `~/.codex/skills/relay-light/**`
  - `docs/modules/relay-light/workspace/RLT_09/**`
- **档位**：标准（运行中变更计划与组件接线）。
- **任务类型**：重核 <!-- dh:task-type:v1 task=RLT_09 type=heavy -->
- **实施提示**：**白名单三类路径全部在本仓 Git 内**，直接用 `git diff --name-only` 取改前/改后的精确变更集校验；触碰 `design/` 即整份拒绝。

#### RLT_10 — 测试合同与仓库入口

- **目标**：让 lint 规则编号全量可触发、核心仅标准库，并以薄壳把同一 unittest 文件接入 Windows 全量 runner，保持退出码与输出透明。
- **非目标**：不改 `run-relay-tests.ps1` 的循环架构；不把 Python 测试改写成 PowerShell；本卡不冒充 Linux 真机证据。
- **验收口径**：
  - **机器证**｜来源：design/01 + `HC-RL-A80`｜lint 0/2/3、stderr 行与 JSON 合同齐全。
  - **机器证**｜来源：design/01 + `HC-RL-A94`｜每条 lint 规则可触发且编号属于验收表。
  - **机器证**｜来源：design/01 + `HC-RL-A11`｜薄壳登记入 suites，全量测试绿。
  - **机器证**｜来源：design/01 + `HC-RL-A16`｜relay_log 仅导入标准库。
- **变更范围**：单测、薄壳与 suite 登记。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_10 -->
  - `tools/relay-light/test_relay_log.py`
  - `tools/tests/relay-light-log.ps1`
  - `tools/tests/run-relay-tests.ps1`
  - `docs/modules/relay-light/workspace/RLT_10/**`
- **档位**：标准。
- **任务类型**：常规 <!-- dh:task-type:v1 task=RLT_10 type=normal -->
- **实施提示**：薄壳只 shell out、转发输出/退出码；缺 python 只输出 runner 已识别的 `SUITE SKIP`。

#### RLT_11 — 持久化退场核对与教训回流

- **目标**：用首个真计划产物核对“谁删/何时删/删失败怎么办”与只写不删选择，并把正式输入 §15 的三条新教训逐条提进教训库候选。
- **非目标**：不删除历史账本/计划/证据；不把教训扩写成新需求；不改 dev-harness。
- **验收口径**：
  - **机器证**｜来源：design/01 + `HC-RL-A13`｜设计与实现均声明退场路径，status 无自动删除；三条 §15 教训候选逐条落账并回链来源。
- **变更范围**：共享教训库候选、本卡工作区与必要的 relay-light as-built 说明。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_11 -->
  - `docs/modules/dh-relay/knowledge/教训库-候选.md`
  - `docs/modules/relay-light/as-built/**`
  - `docs/modules/relay-light/workspace/RLT_11/**`
- **档位**：轻（文档回流）。
- **任务类型**：轻量 <!-- dh:task-type:v1 task=RLT_11 type=light -->
- **实施提示**：只提 §15 已明确的三条，不顺手整理既有教训库。

#### RLT_12 — Windows Claude 首个真计划端到端 demo

- **目标**：在 Windows 由 Claude Code 主控跑完一份 W→C→R→F 真计划，保留全量计划/账本/status/产物与 pane/终端空间证据，并展示 checker 至少一次纠偏；这是第一批的端到端完成点。
- **非目标**：不跑 Codex/Linux；不含 watch；不进入 E11/E12/E13；不把单测代替真实 Herdr 操作。
- **验收口径**：
  - **机器证**｜来源：design/01 + `HC-RL-A30`｜所有阶段关闭、节点 closed、launch 全有终态。
  - **机器证**｜来源：design/01 + `HC-RL-A31`｜真账本每行 schema 与全时序合法。
  - **人判**｜来源：design/01 + `HC-RL-H1`｜用户判断 Claude 主控真计划是否省事和值得继续。
  - **人判**｜来源：design/01 + `HC-RL-H13`｜用户判断三层结构、阶段换监工与编排瓶颈。
  - **人判**｜来源：design/01 + `HC-RL-H5`｜用户仅看 status 判断阶段、轮到谁、阻塞与静默时长。
  - **人判**｜来源：design/01 + `HC-RL-H14`｜用户判断 checker 纠偏效果、批内不换人和成本。
  - **人判**｜来源：design/01 + `HC-RL-H10`｜另做“只给账本”展示，用户判断能否复原现场。
- **变更范围**：真计划/账本与本卡证据工作区。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_12 -->
  - `docs/modules/relay-light/relay/**`
  - `docs/modules/relay-light/workspace/RLT_12/**`
- **档位**：标准（真实 Agent 场景与人验）。
- **任务类型**：常规 <!-- dh:task-type:v1 task=RLT_12 type=normal -->
- **实施提示**：凭据/窗口枚举先白名单过滤；阶段收尾必须按完整顺序走完并留证据：**`node_close` → `stage_result` → `stage_close` → 关终端空间 → 工作树收口**，顺序反了会留占用（正式输入 §5.2.1、§12）。

#### RLT_13 — Windows Codex 与纯配置换协作

- **目标**：用同一份 skill 由 Codex 主控复跑真计划，并只改 roles/mapping/模板做一次协作方式调整，证明核心代码无需变。
- **非目标**：不改 relay_log 迁就主控；不做 Linux；不把模型名散落到流程模板。
- **验收口径**：
  - **人判**｜来源：design/01 + `HC-RL-H2`｜用户判断换 Codex 后能否只靠 adapter 跑通。
  - **人判**｜来源：design/01 + `HC-RL-H7`｜用户判断只改配置/模板是否真能改变协作方式。
- **变更范围**：本卡临时配置差异、真计划/账本与证据。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_13 -->
  - `~/.claude/skills/relay-light/**`
  - `~/.codex/skills/relay-light/**`
  - `docs/modules/relay-light/relay/**`
  - `docs/modules/relay-light/workspace/RLT_13/**`
- **档位**：标准。
- **任务类型**：常规 <!-- dh:task-type:v1 task=RLT_13 type=normal -->
- **实施提示**：改动前后均须恢复/证明两侧同源；展示核心代码 diff 为空。

#### RLT_14 — blocked/decider 双模式实跑

- **目标**：在同一 Windows 基线分别跑两路 blocked→decider→原 coder resume：一路用**默认 auto**（marker 不写 `decision_mode=`，验证按 auto 解析），一路**显式声明 `consult`**，给用户比较两种模式手感。
- **非目标**：不触发改计划；不换 coder；默认值已由用户裁决为 auto，本卡只验证行为，不重开默认值讨论。
- **验收口径**：
  - **人判**｜来源：design/01 + `HC-RL-H6`｜展示两条完整事件链与 decision 文件：**默认 auto 路**（marker 省略 `decision_mode=`，账本无 `user_decision`）与**显式 consult 路**（`decision` 后必有 `user_decision` 才 `resume`）两路都实跑，用户判断两种模式手感。
- **变更范围**：场景计划/账本、decision 与本卡证据。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_14 -->
  - `docs/modules/relay-light/relay/**`
  - `docs/modules/relay-light/workspace/RLT_14/**`
- **档位**：标准。
- **任务类型**：常规 <!-- dh:task-type:v1 task=RLT_14 type=normal -->
- **实施提示**：默认 auto 那一路的 marker **不写 `decision_mode=`**，用以实证「未写即 auto」（`HC-RL-A18`、`HC-RL-A90`）；consult 的用户决定必须是真实对话证据；auto 不得伪造 user_decision。

#### RLT_15 — 返工超限与 strategist 人闸实跑

- **目标**：实跑 R→X1→R→X2 仍不过或等价 attempt 上限路径，拉 strategist 后停在人闸，展示全部 review 与全局方案。
- **非目标**：不自授权超限继续；不把 strategist 结论当用户裁决；不以风险接受绕过复核完整性。
- **验收口径**：
  - **人判**｜来源：design/01 + `HC-RL-H15`｜用户判断 X 上限 2 是否合适及 strategist 输入是否足够。
- **变更范围**：场景计划/账本、review/strategist 方案与本卡证据。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_15 -->
  - `docs/modules/relay-light/relay/**`
  - `docs/modules/relay-light/workspace/RLT_15/**`
- **档位**：标准。
- **任务类型**：常规 <!-- dh:task-type:v1 task=RLT_15 type=normal -->
- **实施提示**：按正式输入 §3.4 的 strategist 链落账——`escalate` → `agent_launch strategist#n` → `decision` → `user_decision` → (`resume` 或 `cancelled`)，其中**决策类事件（`escalate`/`decision`/`user_decision`/`resume`/`cancelled`）记在触发时最后一个 X 阶段 coder 名下，`agent_launch` 与 `done` 记在 `strategist#n` 名下**，`user_decision` 永远必需；人闸必须记录真实用户裁决，不自造事件。

#### RLT_16 — 卡内追加节点实跑

- **目标**：实跑运行中改计划的**卡内路径**：施工 `blocked` → decider 提「需要改计划」→ 过门 → `planner-amend` 在当前阶段实例内追加节点、旧行标 superseded → **当班监工直接接手**跑完，验证白名单、全有全无与有意绕过 B-adjust 的实际手感。
- **非目标**：不新增任务卡（那是 RLT_19）；不改 `design/` 或验收 ID；不把例外推广到接力外。
- **验收口径**：
  - **人判**｜来源：design/01 + `HC-RL-H16`｜用户判断卡内追加、B-adjust 例外与禁区拦截是否可靠。
- **变更范围**：本场景计划、DevPlan 测试任务行、**已登记卡**的 task_plan、账本与证据。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_16 -->
  - `docs/modules/relay-light/relay/**`
  - `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md`
  - `docs/modules/relay-light/workspace/RLT_16/**`
- **档位**：标准（运行中计划变更）。
- **任务类型**：重核 <!-- dh:task-type:v1 task=RLT_16 type=heavy -->
- **实施提示**：**允许路径不得用 `workspace/**` 通配**——开工时按本场景计划 marker 的 `cards` 逐卡登记精确的 `task_plan.md` 路径，写进 task_plan 并在开工确认时给用户过目。该卡明确、有意绕过 B-adjust；任何 `design/` 命中都必须整份不落笔并交用户。

#### RLT_19 — 新增任务卡追加阶段实跑

- **目标**：实跑运行中改计划的**跨卡路径**：`planner-amend` 改开发方案任务行、往 marker `cards` 加新卡号、往 `relay_plan` 追加该卡的 W/C/R/F 阶段行，然后由**编排开到新 W 阶段时才拉监工**，builder 照常建新卡的任务工作区七件套。
- **非目标**：**不由 planner-amend 建新卡的 task_plan 与七件套**——新卡的 `task_plan.md` 由其 W 阶段 builder 建，改计划实例写它即判失败（`HC-RL-A122`）；不改 `design/` 或验收 ID；不重复 RLT_16 的卡内路径。
- **验收口径**：
  - **人判**｜来源：design/01 + `HC-RL-H17`｜用户判断跨卡追加、编排开新阶段与 builder 分工是否顺手。
- **变更范围**：本场景计划与 marker、DevPlan 测试任务行、新卡由 builder 建的任务工作区、账本与证据。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_19 -->
  - `docs/modules/relay-light/relay/**`
  - `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md`
  - `docs/modules/relay-light/workspace/RLT_19/**`
- **档位**：标准（运行中计划变更）。
- **任务类型**：重核 <!-- dh:task-type:v1 task=RLT_19 type=heavy -->
- **实施提示**：**允许路径不得用 `workspace/**` 通配**——开工时按 marker `cards` 逐卡登记精确的 `task_plan.md` 路径；新卡在改计划那一刻还不在 `cards` 里，所以它的 `task_plan.md` 一定不在改计划实例的白名单内，须由 W 阶段 builder 建。

#### RLT_17 — Linux 双主控实测与取证方向账

- **目标**：先在方向账冻结 ThinkPad 访问、命令、证据回传、失败/中断与隐私处理，再由用户设备分别用 Claude Code 与 Codex 主控跑真计划并直跑同一 Python 测试。
- **非目标**：不以 Windows 模拟或容器替代 ThinkPad；不因设备暂不可用认险放行；不实现 Linux 专属业务分支。
- **验收口径**：
  - **机器证**｜来源：design/01 + `HC-RL-A15`｜ThinkPad 原样展示 `python3 -m unittest` 命令、输出与退出码。
  - **人判**｜来源：design/01 + `HC-RL-H3`｜Claude Code 主控 Linux 计划与测试证据供用户判断一致性。
  - **人判**｜来源：design/01 + `HC-RL-H4`｜Codex 主控 Linux 计划证据供用户判断四组合交付。
- **变更范围**：Linux 实跑计划/账本、方向账与回传证据；不要求在 ThinkPad 仓外路径落永久实现。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_17 -->
  - `docs/modules/relay-light/relay/**`
  - `docs/modules/relay-light/workspace/RLT_17/**`
- **档位**：标准（跨平台真机与用户人验）。
- **任务类型**：常规 <!-- dh:task-type:v1 task=RLT_17 type=normal -->
- **实施提示**：正式输入已冻结设备、两主控与命令，所以方向账只解决取证路径，不重开产品方向；未得终态就写未得终态。

#### RLT_18 — watch（第 5 批）

- **目标**：在第 5 批实现只通知不写账的 watch，验证 30 秒重挂、状态去重、20 分钟 tick、阶段/计划退出，以及 Claude/Codex 忙时 prompt 与 watch 死亡兜底。**用户 2026-09-09 已裁决 watch 接着做**，前四批完成后直接开工，不再挂「是否启动」的门。
- **非目标**：不把 watch 变成驱动器或写者；不做秒级监控；不把 watch 塞进前四批抢跑。
- **验收口径**：
  - **机器证**｜来源：design/01 + `HC-RL-A82`｜30 秒轮询、终态退出、working 重挂与状态去重正确。
  - **机器证**｜来源：design/01 + `HC-RL-A83`｜20 分钟 tick、无 watch 前台节拍与两层退出条件正确。
  - **机器证**｜来源：design/01 + `HC-RL-A101`｜watch 路径无任何写账调用。
  - **人判**｜来源：design/01 + `HC-RL-H11`｜用户判断 Claude/Codex 监工忙时 prompt 是否可靠。
  - **人判**｜来源：design/01 + `HC-RL-H12`｜用户判断杀 watch 后 20 分钟兜底是否可接受。
- **变更范围**：watch 子命令、打桩测试、两侧 adapter 与本卡证据。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_18 -->
  - `tools/relay-light/relay_log.py`
  - `tools/relay-light/test_relay_log.py`
  - `~/.claude/skills/relay-light/references/adapter-claude-code.md`
  - `~/.claude/skills/relay-light/references/adapter-codex.md`
  - `~/.codex/skills/relay-light/references/adapter-claude-code.md`
  - `~/.codex/skills/relay-light/references/adapter-codex.md`
  - `docs/modules/relay-light/workspace/RLT_18/**`
- **档位**：标准（第 5 批 watch 接线）。
- **任务类型**：重核 <!-- dh:task-type:v1 task=RLT_18 type=heavy -->
- **实施提示**：本卡排第 5 批，前四批全部验收后直接开工；不得提前插队，因为 adapter 的无 watch 前台回退要先在前四批被证明过。

## 4. 批次与端到端交付

| 批次 | 任务 | 批末可演示结果 | 开批条件 |
|---|---|---|---|
| 1 | RLT_01~RLT_08、RLT_10、RLT_12 | Windows Claude 主控跑完第一份 W→C→R→F 真计划；plan/add/status/lint、Recipe、skill、AGENTS 与仓库测试共同成立 | B 方案生效；各卡按依赖开工 |
| 2 | RLT_11、RLT_13 | 同一核心换 Codex 主控并只改配置改变协作；真计划产物完成退场核对与教训回流 | RLT_12 已验收 |
| 3 | RLT_09、RLT_14~RLT_16、RLT_19 | auto/consult、返工超限、卡内追加节点、新增任务卡追加阶段四组异常路径可演示 | 对应依赖卡已验收 |
| 4 | RLT_17 | ThinkPad 上 Claude/Codex 两组合补齐四组合矩阵 | 用户设备与取证窗口可用；RLT_13/RLT_19 已验收 |
| 5 | RLT_18 | watch 的忙时推送、重挂、tick 与死亡兜底可演示 | 前四批全部验收 |

**第一个端到端 demo 在第 1 批，完成点为 RLT_12。** 批次按可演示结果切；批内仍严格按任务依赖推进。RLT_18 是设计已冻结的 watch 组件，固定第 5 批，用户已裁决接着做。全计划共 **19 张卡**（RLT_01~RLT_19）。

## 5. §14 开发方案同步项对照

| §14 项 | 承接任务 | 落法 |
|---|---|---|
| 1. skill 两侧同步方式 | RLT_01 | 计划内定为复制脚本 + 五文件清单哈希；软链仅双平台都支持时可选 |
| 2. AGENTS 编排协议段 | RLT_08 | 新增 relay-light 判定段，现役 Runner 标冻结流水 |
| 3. AGENTS 模块身份 | RLT_08 | 双模块描述、显式 slug 与 `dh relay-light` 索引 |
| 4. 与现役 Runner 一致性对照 | RLT_02 | **单独成卡**；节点/角色/事件/关闭逐条裁决 |
| 5. 三条教训候选回流 | RLT_11 | 仅回流 §15 明列三条并回链来源 |
| 6. planner-amend 提示词与白名单 | RLT_09（机制）+ RLT_07（模板承载）+ RLT_16/RLT_19（实跑） | 输入四件、一次改完、lint 三次、禁区整份不落笔；白名单按精确路径登记，新卡 task_plan 不在其中 |
| 7. 有意绕过 B-adjust 写入 AGENTS | RLT_08 | 只允许 relay-light 运行中白名单改计划；design/验收不绕 |

## 6. 验收 ID → 任务卡对照（正好一次）

| 验收 ID | 任务卡 | 验收 ID | 任务卡 |
|---|---|---|---|
| HC-RL-A2 | RLT_04 | HC-RL-A5 | RLT_04 |
| HC-RL-A11 | RLT_10 | HC-RL-A12 | RLT_07 |
| HC-RL-A13 | RLT_11 | HC-RL-A14 | RLT_02 |
| HC-RL-A15 | RLT_17 | HC-RL-A16 | RLT_10 |
| HC-RL-A17 | RLT_04 | HC-RL-A18 | RLT_03 |
| HC-RL-A19 | RLT_07 | HC-RL-A21 | RLT_07 |
| HC-RL-A24 | RLT_03 | HC-RL-A26 | RLT_07 |
| HC-RL-A27 | RLT_07 | HC-RL-A28 | RLT_08 |
| HC-RL-A29 | RLT_08 | HC-RL-A30 | RLT_12 |
| HC-RL-A31 | RLT_12 | HC-RL-A32 | RLT_01 |
| HC-RL-A33 | RLT_08 | HC-RL-A34 | RLT_08 |
| HC-RL-A35 | RLT_03 | HC-RL-A37 | RLT_04 |
| HC-RL-A38 | RLT_04 | HC-RL-A39 | RLT_04 |
| HC-RL-A40 | RLT_04 | HC-RL-A41 | RLT_04 |
| HC-RL-A42 | RLT_04 | HC-RL-A43 | RLT_05 |
| HC-RL-A44 | RLT_05 | HC-RL-A45 | RLT_04 |
| HC-RL-A46 | RLT_03 | HC-RL-A47 | RLT_03 |
| HC-RL-A48 | RLT_03 | HC-RL-A49 | RLT_04 |
| HC-RL-A50 | RLT_04 | HC-RL-A51 | RLT_04 |
| HC-RL-A55 | RLT_04 | HC-RL-A56 | RLT_04 |
| HC-RL-A58 | RLT_04 | HC-RL-A59 | RLT_04 |
| HC-RL-A60 | RLT_04 | HC-RL-A61 | RLT_05 |
| HC-RL-A62 | RLT_05 | HC-RL-A63 | RLT_04 |
| HC-RL-A64 | RLT_03 | HC-RL-A65 | RLT_05 |
| HC-RL-A66 | RLT_07 | HC-RL-A67 | RLT_07 |
| HC-RL-A68 | RLT_04 | HC-RL-A69 | RLT_04 |
| HC-RL-A70 | RLT_04 | HC-RL-A71 | RLT_03 |
| HC-RL-A72 | RLT_03 | HC-RL-A73 | RLT_03 |
| HC-RL-A74 | RLT_04 | HC-RL-A75 | RLT_03 |
| HC-RL-A77 | RLT_04 | HC-RL-A78 | RLT_04 |
| HC-RL-A80 | RLT_10 | HC-RL-A81 | RLT_05 |
| HC-RL-A82 | RLT_18 | HC-RL-A83 | RLT_18 |
| HC-RL-A84 | RLT_04 | HC-RL-A85 | RLT_05 |
| HC-RL-A86 | RLT_03 | HC-RL-A87 | RLT_03 |
| HC-RL-A88 | RLT_03 | HC-RL-A89 | RLT_05 |
| HC-RL-A90 | RLT_03 | HC-RL-A91 | RLT_06 |
| HC-RL-A92 | RLT_06 | HC-RL-A93 | RLT_05 |
| HC-RL-A94 | RLT_10 | HC-RL-A95 | RLT_07 |
| HC-RL-A96 | RLT_07 | HC-RL-A97 | RLT_06 |
| HC-RL-A98 | RLT_07 | HC-RL-A99 | RLT_06 |
| HC-RL-A100 | RLT_07 | HC-RL-A101 | RLT_18 |
| HC-RL-A102 | RLT_07 | HC-RL-A103 | RLT_07 |
| HC-RL-A104 | RLT_03 | HC-RL-A105 | RLT_05 |
| HC-RL-A106 | RLT_05 | HC-RL-A107 | RLT_06 |
| HC-RL-A108 | RLT_06 | HC-RL-A109 | RLT_03 |
| HC-RL-A110 | RLT_05 | HC-RL-A111 | RLT_05 |
| HC-RL-A112 | RLT_05 | HC-RL-A113 | RLT_07 |
| HC-RL-A114 | RLT_07 | HC-RL-A115 | RLT_06 |
| HC-RL-A116 | RLT_06 | HC-RL-A117 | RLT_06 |
| HC-RL-A118 | RLT_05 | HC-RL-A119 | RLT_09 |
| HC-RL-A120 | RLT_09 | HC-RL-A121 | RLT_09 |
| HC-RL-A122 | RLT_09 | HC-RL-A123 | RLT_09 |
| HC-RL-H1 | RLT_12 | HC-RL-H2 | RLT_13 |
| HC-RL-H3 | RLT_17 | HC-RL-H4 | RLT_17 |
| HC-RL-H5 | RLT_12 | HC-RL-H6 | RLT_14 |
| HC-RL-H7 | RLT_13 | HC-RL-H10 | RLT_12 |
| HC-RL-H11 | RLT_18 | HC-RL-H12 | RLT_18 |
| HC-RL-H13 | RLT_12 | HC-RL-H14 | RLT_12 |
| HC-RL-H15 | RLT_15 | HC-RL-H16 | RLT_16 |
| HC-RL-H17 | RLT_19 |  |  |

> 退役 ID 不进入对照表、不复用。附录按活动 ID 排序；实际覆盖集合以正式输入 §11 的 104+15 条为准。

## 7. 正式输入回流与实施证据要求

本节原列 5 条「正式输入的矛盾或缺口」。**前 4 条已由 A′ 增补（2026-09-09）在正式输入中澄清**，第 5 条不是设计缺口而是实施证据问题，改写为对应任务的证据要求。

### 7.1 已由 A′ 增补澄清（4 条）

| 原第 N 条 | 问题 | 现在看哪里 |
|---|---|---|
| 1 | Recipe 权威冲突（`normal` 路数、`[rework]` 节名） | **已澄清**：`design/01` §6.2 改为只写结构不写取值，权威取值在 §6.3；止损节名为 `[limits]` 与 `[limits.on_exceed]`。承接卡 RLT_06 |
| 2 | `status --json` schema 不完整 | **已澄清**：`design/01` §3.5 冻结顶层字段合同（`current_stage`、`last_stage_result`、`suggested_action`、`monitor_relaunch_count`、`pending_nodes`、`superseded_ignored`）。承接卡 RLT_05 |
| 3 | strategist 账本链缺口 | **已澄清**：`design/01` §3.4 补 strategist 链并冻结事件归属与 `user_decision` 永远必需；§9.3 有事件行样例。承接卡 RLT_15 |
| 4 | 配置定位与生成接口未定义 | **已澄清**：`design/01` §6.2.1 定解析优先级并要求 `plan_loaded` 记录实际配置目录；HC-RL-A99 明确模板生成是内部实现、不新增公共 CLI。承接卡 RLT_01、RLT_06 |

A′ 增补的裁决过程见 [`design/evidence/01-交叉审核记录-RelayLight运行中改计划.md`](../design/evidence/01-交叉审核记录-RelayLight运行中改计划.md) 的「A′ 增补 · B 审核回流」一节。**该增补已于 2026-09-09 由用户确认**，与本开发方案同批生效。

### 7.2 实施证据要求（原第 5 条改写）

原第 5 条说「用户级目录不受本仓 Git 管理，白名单 diff 无处取证」。这不是设计缺口——正式输入本就把两类变更集分开，本计划按两条落实：

- **`RLT_01`｜用户级目录的变更证据用清单哈希，不用 Git**：两侧 skill 五文件维护一份清单（路径 + 内容哈希），同步前后各出一次，比对即证明一致与可重建；回滚靠重新执行复制脚本。对应 `HC-RL-A32`。
- **`RLT_09`｜白名单守门的变更集只在仓内取证**：改计划实例的白名单三类路径（`relay_plan.md`、`dev_plan/P<N>-*.md`、已登记卡的 `task_plan.md`）**全部在本仓 Git 内**，`git diff --name-only` 即权威变更集；禁区 `design/` 也在仓内。用户级 skill 目录**不在改计划白名单里**，因此不需要非 Git 变更集。对应 `HC-RL-A122`。

一句话：**用户级目录用清单哈希取证（RLT_01），仓内路径用 Git 变更集取证（RLT_09），两者不混。**

## 8. 自查

### 8.1 覆盖关

- 从正式输入 §11 机器解析得到活动验收 **104 条 AI + 15 条人验 = 119 条**。
- 本文件任务卡与 §6 对照表均按活动 ID 建映射：**119 个唯一 ID、0 漏项、0 重复**；退役 ID 未纳入。全计划 **19 张卡**（RLT_01~RLT_19）。
- §14 七个同步项全部落到 RLT_01/RLT_02/RLT_07/RLT_08/RLT_09/RLT_11，且第 4 项由 RLT_02 单独成卡。

### 8.2 颗粒度关

- 每卡对应一个可一起实现、一起证明、一起签的验收单元：解析、追加状态机、status 生命周期、配置 Recipe、skill 合同、治理入口、改计划、测试入口和各实跑场景互不混签。
- 大量断言集中在 RLT_03~RLT_07，是同一生产单元的合同矩阵，不再按单条断言碎卡；实跑人验按用户可一次判断的场景拆为 RLT_12~RLT_19，其中改计划按「卡内追加节点」（RLT_16）与「新增任务卡追加阶段」（RLT_19）分成两张，因为两者的验证动作、允许路径与用户判断点都不同。
- 开工时持任务卡 + 唯一正式输入即可直接写 task_plan；本计划只写边界/验收/依赖，未写函数级动词顺序。

### 8.3 依赖关

- 依赖方向单向：只读边界/同步 → parser → add/status → 配置/skill/AGENTS/测试 → 首个 demo → 互换主控 → 异常/改计划（RLT_14 → RLT_16 → RLT_19）→ Linux → 第 5 批 watch；**19 张卡无环**。
- 前置未验收不开放依赖卡；批次没有替代依赖列。
- 第一个端到端 demo 明确在**第 1 批 RLT_12**；RLT_18 固定第 5 批，前四批完成后直接开工。

## 9. 计划完工

- [ ] RLT_01~RLT_19 全部销户，含第 5 批的 RLT_18（用户已裁决 watch 接着做）。
- [ ] 前四批交付 101 条机器验收与 13 条人验；第 5 批 RLT_18 补齐 watch 的 3 条机器验收与 2 条人验，**总账 119 条全部有等价证据**。
- [ ] Windows/Linux × Claude Code/Codex 四组合证据齐全；用户完成全部 15 条人判，其中 watch 的 2 条在第 5 批完成。
- [ ] `verify(relay-light):` 只能在用户查看证据并明确授权后提交；本草案不授权 verify、merge、push、deploy 或下一卡开工。
