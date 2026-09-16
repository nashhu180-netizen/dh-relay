# P1-RelayLight 开发方案（**正式开发方案 · 更新至 2026-09-11**）

<!-- dh:plan-type: 开发 -->
<!-- dh:planning-event:v1 id=RLT-B-06 stage=B-adjust artifact=dev_plan/P1-RelayLight-开发方案.md review=../design/evidence/07-交叉审核记录-RLT05合同缺口候选.md#review-rlt-b06 understanding=../design/evidence/07-交叉审核记录-RLT05合同缺口候选.md#understanding-rlt-b06 -->

> **历史规划事件索引（B；非活动声明，仅作追溯）**——既有事件的原始可解析 `planning-event` 声明注释已转为本索引；出处、含义与证据路径保持原值，Git 历史中仍可还原。**活动声明只剩上面一条 `RLT-B-06` 与 design/01 的 `RLT-A-06`。B-adjust 本身不改变任务状态、依赖、批次划分与 allowed-paths；随后 2026-09-11 用户另行授权 D-start，RLT_05 才机械进入“进行中”。**
>
> | 事件 | stage | 证据（交叉审核记录） | 处理 |
> |---|---|---|---|
> | `RLT-B-01` | B-new | `../design/evidence/02-交叉审核记录-RelayLight-B拆计划.md#review-rlt-b01` / `#understanding-rlt-b01` | 转历史索引 |
> | `RLT-B-02` | B-adjust | `../design/evidence/03-交叉审核记录-RelayLight仓内skill单源.md#adjust-rlt-b02` / `#understanding-rlt-b02` | 转历史索引 |
> | `RLT-B-03` | B-adjust | `../design/evidence/04-交叉审核记录-RelayLight-B03颗粒度优化.md#review-rlt-b03` / `#understanding-rlt-b03` | 转历史索引 |
> | `RLT-B-04` | B-adjust | `../design/evidence/05-交叉审核记录-RLT03与RLT05验收边界.md#review-rlt-b04` / `#understanding-rlt-b04` | 转历史索引 |
> | `RLT-B-05` | B-adjust | `../design/evidence/06-交叉审核记录-RLT03阶段合同补充.md#review-rlt-b05` / `#understanding-rlt-b05` | 转历史索引 |
>
> 七条 A/B 旧事件（含 design 侧 `RLT-A-02`~`RLT-A-04`）的完整字段、替换缘由与本次确认来源见 [`../design/evidence/06-交叉审核记录-RLT03阶段合同补充.md`](../design/evidence/06-交叉审核记录-RLT03阶段合同补充.md)。
<!-- dh:status
汇报: RLT_09 已完成并 squash 合入 master（PR #19，`c72f124`）；plan_amend/A120 放宽/status 重读/A122 白名单守门与 planner-amend 模板/stage_result amend 摘要落地，并入 F-003 UTF-8 输出防护（Windows CI 已验证）；design/01 经 RLT-A-07 最小 A-adjust 澄清 A121/A122 与 §4.5.2 禁区处理
现状: RLT_01/07/08/10/09 均已合入；**RLT_12 与 RLT_21 已于 2026-09-15 squash 合入 master**（PR #25 `7981556`、PR #27 `124a5c9`）——真计划 `rlt12-win-01` 五阶段 W/C/R/X/F 全闭合、账本 71 行 lint ok，RLT_21 七条验收落地、单测 181 全绿 skipped=0；两卡均有 `verify(relay-light):` 提交；**两卡已于 2026-09-15 由用户整体授权验收通过并授权 AI 代记（原话「授权，你帮我代签」），两份 `review.md` 人类签名区已落记**——用户未逐条给出人判结论，H10「只给账本」的独立展示未实际进行，如需逐条主观判断须另行补签。A143 的 oracle 期望值已按用户同日裁决改为 `3 P1 + 2 P2`（design/01 的 RLT-A-10 最小澄清），RLT_21 findings F-009 随之闭合。**RLT_22 已于 2026-09-16 squash 合入 master**（PR #31 `0a909dd`）——A144~A150 七条验收全部落地，CI 三硬门（relay-light Python、relay-tests ubuntu/windows）全绿，`relay-core` 按 `continue-on-error` 只作观测且与上一 PR 同样因环境 socket 权限失败、本卡未动任何 Node 文件；单测 203 例 OK、仓级 runner `RELAY ALL PASS (SKIPPED: 1)`；有 `verify(relay-light):` 提交；**用户 2026-09-16 明确答复「全部授权」放行 push / PR / 合并 / verify 代签 / skill 两侧重同步，AI 代记；该授权是对放行动作的授权，不构成对 review.md 人类签名区任一行的逐条人判**，各行已记「未逐条人判 · 整体授权放行」，确认结论为「带风险放行」。skill 两侧重同步已于同日自 master 主检出执行完成，五文件源与 `.claude` / `.codex` 两副本 sha256 三处一致
进行到: P1 ▸ 第 1 批 RLT_01/02/03/05/07/08/10/21/12/22 已合入（本批任务卡全部收口） ▸ 第 3 批 RLT_09 提前完成（Linux 可做）
下一步: 第 2 批开工——RLT_11（轻档，回流三条教训并核对持久化退场合同）与 RLT_13（Windows Codex 主控复跑并验证纯配置换协作）。RLT_22 已合入，第 3 批异常路径实跑（RLT_15/RLT_16/RLT_19）的节点内死锁前置已解除。**两条转派项待承接**：`workspace/RLT_22/findings.md` 的 **F-005**（normal 档复核路数三份权威打架：AGENTS.md 宪章#5 三路 vs `dh-mapping.toml` 两路 vs dev-harness 模板第 4 路，对齐落点超出单卡允许路径）与 **F-010**（`as-built/RLT_05-实现快照.md` 的 trigger 口径仍写三态与 `on:done:` 单一前置，未含 A144~A147）
看什么: design/01-RelayLight-产品设计与验收.md + 本文件
阻塞: RLT_07 F-002/F-003（decision_mode 模式门 + cancelled 归属闸）→ RLT_21 承接；RLT_12 Linux 预演 DR-F-001～006 见 workspace/RLT_12/evidence/linux-dry-run/README.md（预演分支）；RLT_08 F-4（visual_map.md 沿先例不建、模块级 knowledge/ 归 RLT_11）；RLT_10 F-002（仓根无 .gitignore 忽略 __pycache__）；RLT_09 findings 见 workspace/RLT_09/findings.md
-->

> **本文件是 relay-light 的正式开发方案，已经用户确认。** 生效范围仅限任务定义与 `RLT_` 号段：**不授权任何任务开工、不授权改代码、verify、合并、推送或部署**，各卡仍按依赖与批次逐张走 D 开工的门。

> **GitHub 关联**：RLT_05 / RLT-A-06 / RLT-B-06 共用 [Issue #8](https://github.com/nashhu180-netizen/dh-relay/issues/8)/PR #9；RLT_01=[Issue #12](https://github.com/nashhu180-netizen/dh-relay/issues/12)/PR #13（`25bdbcb`）；RLT_07=[Issue #10](https://github.com/nashhu180-netizen/dh-relay/issues/10)/PR #11（`6f26c4a`）；RLT_08=[Issue #14](https://github.com/nashhu180-netizen/dh-relay/issues/14)/PR #15（`5cf70b8`）；RLT_10=[Issue #16](https://github.com/nashhu180-netizen/dh-relay/issues/16)/PR #17（`efb1a60`）；RLT_09=[Issue #18](https://github.com/nashhu180-netizen/dh-relay/issues/18)/PR #19（`c72f124`，含 RLT-A-07）。收口 worktree/分支均已删。

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
- **RLT-B-02 调整**：2026-09-10 用户确认仓内 skill 单源 v6；最终窄复审 P0/P1/P2 均为 0。新增 RLT_20，验收 119→121，卡数 19→20（RLT_20 后经 RLT-B-03 并入 RLT_12 首步）；证据见 [`design/evidence/03-交叉审核记录-RelayLight仓内skill单源.md`](../design/evidence/03-交叉审核记录-RelayLight仓内skill单源.md)。
- **RLT-B-03 调整**：2026-09-10 用户确认颗粒度优化 v2.1；fresh 审核 P1=4/P2=1 → 主会话裁决 → v2 → 定向复审 P1=1 → v2.1；卡数 20→17、复核路径 76→63、验收 121 不变；证据见 [`design/evidence/04-交叉审核记录-RelayLight-B03颗粒度优化.md`](../design/evidence/04-交叉审核记录-RelayLight-B03颗粒度优化.md)。
- **RLT-B-04 调整**：2026-09-10 用户明文「你来写入」；fresh Opus 三轮复核最终 `APPROVE`（P0=0、P1=0），把 parser/lint、完整 status、五阶段模板的验收 owner 分别对齐 RLT_03/RLT_05/RLT_07，活动总账 121→122；证据见 [`design/evidence/05-交叉审核记录-RLT03与RLT05验收边界.md`](../design/evidence/05-交叉审核记录-RLT03与RLT05验收边界.md)。
- **RLT-B-05 调整**：RLT_03 收口阶段补齐 fresh A/B 事件证据，未改变任务合同；证据见 [`design/evidence/06-交叉审核记录-RLT03阶段合同补充.md`](../design/evidence/06-交叉审核记录-RLT03阶段合同补充.md)。
- **RLT-B-06 调整**：2026-09-11 基于已晋级 RLT-A-06 的正式输入完成 fresh Opus 复核、v5 窄核 `APPROVE`、讲解与理解校验；用户明确回答“后者，继续”，确认 B06 落盘并另行授权 D-start。RLT_05/RLT_07 验收 owner、配置目录合同及 RLT_12/13/17 证据语义已原子同步；活动总账 122→126。证据见 [`design/evidence/07-交叉审核记录-RLT05合同缺口候选.md`](../design/evidence/07-交叉审核记录-RLT05合同缺口候选.md#understanding-rlt-b06)。
- **RLT-B-07 调整**：2026-09-14 RLT_12 Linux 非正式预演（DRILL_01，分支 `dryrun/rlt12-linux`）暴露六条协议/实现缺口（DR-F-001～006）；升级 RLT-A-08 续发 A137～A143（活动总账 126→133），新增标准档卡 RLT_21 承接并并入 RLT_07 挂账的 F-002/F-003；卡数 17→18；fresh 审核 REVISE P1=5/P2=2 全部采纳后，用户 2026-09-14 裁决：RLT_21 不作 RLT_12 硬依赖、light plan-review 取分级 C，并确认 push + PR 落盘；PR #20 squash 合入（`b078095`）；证据见 [`design/evidence/09-交叉审核记录-RLT-A08-Linux预演回流.md`](../design/evidence/09-交叉审核记录-RLT-A08-Linux预演回流.md)。
- **RLT-A-09 调整**：2026-09-15 RLT_12 真计划 `rlt12-win-01` 在 C1 节点撞上「复核打回后节点内无合法返工路径」——trigger 强制被依赖方终态（A70）、终态不可再挂事件（A60）、终态不可重拉（A49）三条规则互锁，已登记为 `workspace/RLT_12/findings.md` 的 **F-008（P1）**。用户 2026-09-15 裁决方向三句：复核类 agent 的 trigger 不再要求被依赖方处于终态，改为承认一个非终态的「待复核」信号；判定方不判 PASS 不记 `done`；轮次上限沿用 `limits.rework_max_rounds=2`，超限仍走 strategist → 用户闸。候选稿经 fresh-01 全面复核（REVISE，P1=3/P2=5）与定向复审 attempt 2（REVISE，余 P1-1/P1-2/P2-1）两轮整改至 v3，用户就六项开放项逐条裁决：①信号名复用 `checkpoint` + 类型化 token（不动事件层 19 词白名单）；②W 阶段纳入，`plan-reviewer` 进判定角色闭集，W 模板同改；③R 阶段收窄接受，R 模板一字不改；④checker 保持空 trigger，不改 A95；⑤第三套计数只投影，不进 `status --json`；⑥向后兼容只靠模板与纪律，lint 不强制迁移。续发 `HC-RL-A144`～`HC-RL-A150` 七条并修订 A35/A65/A71/A107 四条，活动总账 **133→140**（AI 118→125，人验 15 不变）；新增标准档卡 **RLT_22** 承接，卡数 18→19。本条 DevPlan 侧调整的正式 B 事件号尚未确定（候选稿 §8.5 提议 `RLT-B-08`，待 B 侧另行确认），故顶部 `planning-event` 活动声明本次不动。证据见 [`design/evidence/10-交叉审核记录-RLT-A09-复核触发信号.md`](../design/evidence/10-交叉审核记录-RLT-A09-复核触发信号.md)。

## 1. 概述

- **交付什么**：Python 标准库单文件账本程序 `relay_log.py`（前四批 `add/status/lint`，第 5 批补 `watch`）、仓内单源的 relay-light skill 五件与两侧全量同步安装器、五阶段模板与 dev-harness 映射、仓内协议与测试登记、Windows/ThinkPad 四组合实跑及完整人验证据；`watch` 设计已冻结，**第 5 批必做**，独立成批以免前四批被它拖住。
- **不含什么**：不改 dev-harness；不迁移或替换现役 dh-relay Runner/Ticket/Receipt；不做身份物理校验、停滞检测、锁、无 Herdr 退路、E11/E12/E13 接力；**前四批不依赖 `watch`**，各自可先验收，但 `watch` 本身不是可选项。
- **承接设计**：唯一业务输入为 [`design/01-RelayLight-产品设计与验收.md`](../design/01-RelayLight-产品设计与验收.md)，承接其 125 条 `HC-RL-A*` 与 15 条 `HC-RL-H*`，共 140 条；README、`design/drafts/`、`evidence/` 只用于入口或形成史，不作业务输入。
- **实施策略一句话**：先用只读一致性对照钉住与现役 Runner 的有意差异，再形成可跑的最小账本与 skill，在第一批跑出 Windows Claude 真计划闭环，随后补主控互换、异常/改计划、Linux，第 5 批补 `watch`。
- **任务前缀 / 模块 slug**：`RLT_`（从 `RLT_01` 起，全模块唯一）/ `relay-light`（verify scope=`relay-light`）。
- **落点约束**：skill 五文件唯一源落 `tools/relay-light/skill/`；两个用户级目录只是安装器 `--all` 产出的派生副本，不得就地编辑或反向同步。adapter 显式传本侧用户级副本；直接调用按 design §6.2.1 的五情形解析，不直接读取仓内源。
- **方向决策账判断**：`RLT_01` 负责仓内源与安装器，不碰真实用户目录；首次真实安装作为 `RLT_12` 开工首步，后续需要新内容的实跑卡重新执行 `--all`。`RLT_17` 保留为 Linux 真机与跨机一致性证据卡。

## 2. 工程切分（慢变约束）

### 2.1 实现单元

| 单元 | 职责 | 入口 / 主要文件 | 关联任务 |
|---|---|---|---|
| skill-source | 仓内唯一源、标准库安装器及失败后全量重同步测试 | `tools/relay-light/skill/`、`install_skill.py` | RLT_01 |
| skill-install | 首次同步到当前机器两个用户级目录并校验 | 两个用户级 skill 目录、任务证据 | RLT_12（首步） |
| parity-ledger | 只读对照 relay-light 与现役 Runner 的节点/角色/事件/关闭语义 | `docs/modules/relay-light/as-built/` | RLT_02 |
| relay-plan / relay-log | marker、两表解析、结构 lint、依赖与阶段实例约束；纯追加、七字段、状态机、退出码与错误合同 | `tools/relay-light/relay_log.py`、单测 | RLT_03 |
| status-lifecycle / recipe-config | 状态派生、阶段结果、关闭顺序、写者交接与机械分路；`roles.toml`、`dh-mapping.toml`、Recipe 与两套止损计数 | 程序、仓内 skill 配置、单测 | RLT_05 |
| skill-core | 核心、双 adapter、五阶段模板、提示词与职责边界 | 仓内 skill 唯一源 | RLT_07 |
| repo-governance | relay-light 判定段、索引、双模块身份与 B-adjust 例外 | `AGENTS.md` | RLT_08 |
| plan-amend | 追加改计划、白名单、摘要与 planner-amend 提示词 | 程序、单测、仓内 skill | RLT_09 |
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
| `tools/relay-light/skill/` | 新建 / 增量扩展 | 五文件唯一可编辑源；RLT_05/07/09/18 只在此改内容 |
| `tools/relay-light/install_skill.py` | 新建 | 标准库单向 `--all` 全量同步；失败后整套重跑，不做事务化 |
| 两侧用户级 `relay-light/` | 新建 / 仅由安装器同步 | 派生副本；不得就地编辑、反向同步或软链；真实写入逐卡取用户授权 |
| `AGENTS.md` | 仅追加/修订 relay-light 判定与双模块索引 | 现役 Runner 铁律只加“冻结流水”边界，不重写内容 |
| `tools/runner/`、`tools/host/`、`tools/contracts/` | **禁改** | 只允许 RLT_02 只读对照；不得出现在任何任务的允许路径中 |
| dev-harness 仓与 `~/.claude/skills/dev-harness/` | **禁改** | relay-light 的运行中 B-adjust 例外只写进本仓 AGENTS，不改上游规则 |

## 3. 任务表

### 3.1 索引

<!-- dh:tasks -->

| 任务 ID | 一句话 | 档位（轻/标准） | 状态 | 批次 | 依赖 | 工作区 | 验收时间 / verify SHA | 备注 |
|---|---|---|---|---|---|---|---|---|
| RLT_01 | 建立仓内 skill 单源与全量同步安装器 | 标准 | 已完成 | 1 | — | [workspace/RLT_01](../workspace/RLT_01/) | 2026-09-13 / PR #13 squash 合入（`25bdbcb`） | normal 三路复核全 APPROVE；Issue #12；不写真实用户目录 |
| RLT_02 | 对照 relay-light 与现役 Runner 四类核心语义 | 轻 | 已完成 | 1 | — | [workspace/RLT_02](../workspace/RLT_02/) | 2026-09-10 / light 口头确认 | 单独一致性卡，只读现役实现 |
| RLT_03 | 计划解析/lint 与纯追加账本/状态机 | 标准 | 已完成 | 1 | RLT_02 | [workspace/RLT_03](../workspace/RLT_03/) | 2026-09-10 / **verify `8b67bbdb6f6dfc7881350804edd013d921e8cc2b`** · `release_mode=full` | heavy；合并原 03/04 |
| RLT_05 | status/生命周期与配置/Recipe/止损 | 标准 | 已完成 | 1 | RLT_03 | [workspace/RLT_05](../workspace/RLT_05/) | 2026-09-12 / **verify `7d06678d80cf4265a339329ac04bd15405d72614`** · `release_mode=full` | heavy；Issue #8；PR #9 squash 合入 |
| RLT_07 | 编写仓内 skill、adapter 与五阶段模板 | 标准 | 已完成 | 1 | RLT_01、RLT_02、RLT_05 | [workspace/RLT_07](../workspace/RLT_07/) | 2026-09-13 / PR #11 squash 合入（`6f26c4a`） | heavy 五路复核全闭合；Issue #10；F-002/F-003 排后续卡 |
| RLT_08 | 接入 AGENTS 判定、协议索引与双模块身份 | 标准 | 已完成 | 1 | RLT_07 | [workspace/RLT_08](../workspace/RLT_08/) | 2026-09-13 / PR #15 squash 合入（`5cf70b8`） | normal 三路复核全闭合；Issue #14；显式登记有意绕过 B-adjust |
| RLT_10 | 建立 unittest、PowerShell 薄壳与全量测试入口 | 标准 | 已完成 | 1 | RLT_03、RLT_05、RLT_07 | [workspace/RLT_10](../workspace/RLT_10/) | 2026-09-13 / PR #17 squash 合入（`efb1a60`） | normal 三路复核全闭合；Issue #16；decision.1 选项 A 追加 `relay_log.py` 仅补 `lint --json`；Windows runner 首接入暴露 F-003（status 中文输出 cp1252 崩溃，薄壳以 PYTHONUTF8 兜底，程序侧待后续卡）；RLT_12 准入门已过 |
| RLT_12 | Windows Claude 主控跑首个真计划闭环 | 标准 | 已完成 | 1 | RLT_03、RLT_05、RLT_07、RLT_08、RLT_10 | [workspace/RLT_12](../workspace/RLT_12/) | 2026-09-15 / PR #25 squash 合入（`7981556`） | 高危；首步承接 A32，**第一个端到端 demo**；真计划 rlt12-win-01 五阶段全闭合、账本 71 行；Issue #23；verify `dd3ac3c`；**验收口径按 2026-09-15 三路复核后的事实读**：①三条机器证 A32/A30/A31 **达成**（A32 为时点证据，绑定 HEAD `51d8062`，当前 master 已不成立，见 findings F-016）；②**五条人判 H1/H13/H5/H14/H10 未判定**——用户 2026-09-15 的整体授权是对**放行动作**的授权，不构成对任一条人判的判断内容，review.md 人类签名区五块「结果」列据此落「未判定 · 整体授权放行」，其中 H10 的「只给账本」独立展示**从未进行**；③本卡自身 normal 三路复核（code-round1 / requirement / lesson）**已于落章、合入 master 之后补做**，三路结论**均为 REVISE**、合计 **P1=8 / P2=16**，8 条 P1 已逐条整改或转派（逐条处置见 workspace/RLT_12/review.md「三路复核 P1 处置登记」，报告见同目录 review.code-round1.md / review.requirement.md / review.lesson.md）。本轮暴露的缺口见 workspace/RLT_12/findings.md **F-008~F-022**：F-008 由 RLT-A-09 与 RLT_22 承接，F-019（close 判据看不见结论）并入 RLT_22，F-016（A32 基线失效）落下一张实跑卡开工首步且须取用户当次授权 |
| RLT_21 | 回流 Linux 预演发现：监工异常出口、启动修正记账、静默超时与派活纪律、决策模式门 | 标准 | 已完成 | 1 | RLT_07、RLT_09、RLT_10 | [workspace/RLT_21](../workspace/RLT_21/) | 2026-09-15 / PR #27 squash 合入（`124a5c9`） | RLT-B-07 新增；在 RLT_12 真计划内作唯一业务卡完成；Issue #21；verify `e8eda0e`；单测 181 全绿 skipped=0；**2026-09-15 用户整体授权验收，AI 代记，未逐条签**；原遗留 P2 = findings F-009（A143 复算口径分歧）已由用户 2026-09-15 裁决「修订 oracle 期望值」闭合，design/01 的 A143 改为 `3 P1 + 2 P2`（RLT-A-10 最小澄清）；分支名 `wt/RLT_21-win`（远端 `wt/RLT_21` 另有一条并行工作线未动） |
| RLT_22 | 复核触发改非终态「待复核」信号并打通节点内返工生命周期 | 标准 | 已完成 | 1 | RLT_21 | [workspace/RLT_22](../workspace/RLT_22/) | 2026-09-16 / PR #31 squash 合入（`0a909dd`） | RLT-A-09 新增；承接 F-008 三规则互锁；计划内适用范围 W/C/X（R 模板不动）；输入 `workspace/RLT_12/findings.md` F-008 与账本 `relay/rlt12-win-01/relay_log.jsonl`；Issue #24；verify `04023ad`；normal 三路复核 P0=P1=0（code-round1 经 X1 复看转 APPROVE，requirement / lesson APPROVE_WITH_NITS）；三批小审 + X1 小审全 PASS；单测 203 例 OK、仓级 runner ALL PASS；CI 三硬门绿（`relay-core` 观测项红，环境 socket 权限，本卡未动 Node）；**用户 2026-09-16「全部授权」整体放行，AI 代记，未逐条人判**；skill 两侧重同步已执行、五文件三处哈希一致；转派 F-005（复核路数三份权威打架）与 F-010（as-built trigger 口径待同步） |
| RLT_11 | 回流三条教训并核对持久化退场合同 | 轻 | 未开始 | 2 | RLT_07、RLT_12 | — | — | — |
| RLT_13 | Windows Codex 主控复跑并验证纯配置换协作 | 标准 | 未开始 | 2 | RLT_12 | — | — | — |
| RLT_09 | 实现运行中追加改计划与白名单守门 | 标准 | 已完成 | 3 | RLT_03、RLT_05、RLT_07 | [workspace/RLT_09](../workspace/RLT_09/) | 2026-09-14 / PR #19 squash 合入（`c72f124`） | heavy 五路复核全闭合（code-round2 REQUEST_CHANGES→X1 修复复看 APPROVE）；Issue #18；并入 RLT_10 F-003 UTF-8 输出防护；含 RLT-A-07 最小 A-adjust（decision.1：F-001 选 B、A121 澄清）；A120 承接 RLT_03 交接断言已闭合 |
| RLT_14 | 实跑 blocked/decider 的 auto 与 consult 两路 | 标准 | 未开始 | 3 | RLT_12 | — | — | — |
| RLT_15 | 实跑复核返工超限与 strategist 人闸 | 标准 | 未开始 | 3 | RLT_05、RLT_12 | — | — | — |
| RLT_16 | 实跑卡内追加节点的运行中改计划 | 标准 | 未开始 | 3 | RLT_09、RLT_12、RLT_14 | — | — | — |
| RLT_19 | 实跑新增任务卡并追加阶段 | 标准 | 未开始 | 3 | RLT_09、RLT_12、RLT_16 | — | — | 新卡七件套由 W 阶段 builder 建 |
| RLT_17 | ThinkPad 上完成 Linux 双主控取证账与实跑 | 标准 | 未开始 | 4 | RLT_10、RLT_13、RLT_19 | — | — | 难取证方向账；用户设备依赖 |
| RLT_18 | 实现并实测 watch 通知与兜底 | 标准 | 未开始 | 5 | RLT_05、RLT_07、RLT_13、RLT_17 | — | — | 最终 adapter 后两机重同步 |

> 工作区在 D 开工时按模板回填；本草案未开工，故统一填“—”。状态列仅使用“未开始”。

### 3.2 任务卡

#### RLT_01 — 仓内 skill 单源与安装器

- **目标**：建立 `tools/relay-light/skill/` 五文件唯一源和标准库 Python 安装器。生产命令只提供 `--all`，从当前用户 home 派生 Claude/Codex 两个固定目标并全量覆盖、校验；本卡用临时 home 测试，不写真实用户目录。
- **非目标**：不编写 skill 业务内容；不使用软链；不做历史 manifest、事务化、原子替换、回滚或中断恢复；不改 dev-harness。
- **验收口径**：
  - **机器证**｜来源：[`design/01`](../design/01-RelayLight-产品设计与验收.md) + `HC-RL-A124`｜安装器只有仓内源→两侧副本的单向覆盖；临时 home 注入一次复制中途失败，随后整套重跑，最终两侧五文件与源一致且源未变。
- **变更范围**：仓内 skill 骨架、安装器、安装器测试与本卡方向账。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_01 -->
  - `tools/relay-light/skill/**`
  - `tools/relay-light/install_skill.py`
  - `tools/relay-light/test_install_skill.py`
  - `docs/modules/relay-light/workspace/RLT_01/**`
- **档位**：标准。
- **任务类型**：常规 <!-- dh:task-type:v1 task=RLT_01 type=normal -->
- **实施提示**：Windows 命令 `python tools/relay-light/install_skill.py --all`，Linux 命令 `python3 tools/relay-light/install_skill.py --all`。失败允许留下不同步状态，但必须非零退出；排除原因后整套重跑到退出 0 且两侧哈希一致。每目标只留可覆盖的当前 manifest；生产模式不接受任意目标，测试通过临时 home 覆盖隔离。

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

#### RLT_03 — relay_plan 解析/lint 与纯追加账本/状态机

- **目标**：实现 marker、固定双表、节点/agent/阶段实例/依赖/trigger/close 的 fail-closed 解析与 lint，使合法计划可机械读、非法计划带验收编号拒绝；并实现 `add` 的七字段 JSONL 纯追加、事件白名单、attempt 分配、agent 状态机、触发前置、退出码与统一错误输出。
- **非目标**：不实现模板生成器；不写死下一阶段顺序；不加锁、不做临时文件替换、不做写入者身份真伪校验、不做产出质量判断；**不提前实现 RLT_09 的运行中改计划与 A120 的表尾追加放宽**（本卡只交付去 superseded 后的严格基础 lint）。
- **验收口径**：
  - **解析/lint 组**：
  - **机器证**｜来源：design/01 + `HC-RL-A46`｜节点号含 superseded 在内全计划唯一。
  - **机器证**｜来源：design/01 + `HC-RL-A47`｜close 仅空或 `agent:<同节点已存在名字>`。
  - **机器证**｜来源：design/01 + `HC-RL-A48`｜depends_on 存在且无环。
  - **机器证**｜来源：design/01 + `HC-RL-A72`｜依赖 superseded 节点必拒。
  - **机器证**｜来源：design/01 + `HC-RL-A128`｜**本卡核心**为 parser/lint 派生活跃计划时忽略 superseded（含/不含的结构与退出码对照），并逐项证明 A46 / A72 / A75 三个本卡例外；A120 仅作跨卡兼容引用，其新增表尾放宽与完整「两正四反」集成取证归 RLT_09，不作为本卡已实现能力；四项约束清单不增不减。
  - **机器证**｜来源：design/01 + `HC-RL-A75`｜空节点或 agent 全 superseded 必拒。
  - **机器证**｜来源：design/01 + `HC-RL-A129`｜stage 枚举与分组连续 lint 正确：基础边界**先忽略 superseded 行**——被 superseded 行隔开的重现当前即通过，被其他**活跃** stage 隔断的重现按基础规则拒绝。合法同 stage 表尾追加的放宽与完整运行中追加的终态承诺保留，由 RLT_09 / A120 实现取证（见 design §3.5、§4.3 阶段性交付注记）；本卡的临时拒绝不代表最终产品禁止运行中追加。
  - **机器证**｜来源：design/01 + `HC-RL-A104`｜stage_id 格式、card 前缀及 k 可解析。
  - **机器证**｜来源：design/01 + `HC-RL-A109`｜同卡阶段串行、跨卡并行。
  - **机器证**｜来源：design/01 + `HC-RL-A87`｜card 属于 marker cards，支持跨卡。
  - **机器证**｜来源：design/01 + `HC-RL-A126`｜lint 拒绝 kickoff/verify-signoff node type。
  - **机器证**｜来源：design/01 + `HC-RL-A24`｜固定双表、禁竖线、agent.node/重名/默认依赖合同成立。
  - **机器证**｜来源：design/01 + `HC-RL-A18`｜marker 四个必需字段齐全，decision_mode 缺省为 auto，plan_loaded 带版本。
  - **机器证**｜来源：design/01 + `HC-RL-A130`｜decision_mode parser/default 与 lint 规则编号正确。
  - **机器证**｜来源：design/01 + `HC-RL-A35`｜trigger 三态及引用校验成立。
  - **机器证**｜来源：design/01 + `HC-RL-A71`｜on:done 不能跨节点引用。
  - **账本/状态机组**：
  - **机器证**｜来源：design/01 + `HC-RL-A37`｜连续 20 次 add 的 seq 为 1..20。
  - **机器证**｜来源：design/01 + `HC-RL-A38`｜20 次追加无重复、无覆盖、旧行字节不变。
  - **机器证**｜来源：design/01 + `HC-RL-A39`｜不产生临时文件。
  - **机器证**｜来源：design/01 + `HC-RL-A40`｜无锁实现。
  - **机器证**｜来源：design/01 + `HC-RL-A2`｜19 个事件词 fail closed。
  - **机器证**｜来源：design/01 + `HC-RL-A41`｜枚举严格区分大小写。
  - **机器证**｜来源：design/01 + `HC-RL-A42`｜无 lower/casefold 枚举归一。
  - **机器证**｜来源：design/01 + `HC-RL-A5`｜**解析级**失败（缺文件 / 缺 marker / 缺表头或表结构不合法）三命令（add / status / lint）退 3；计划**已解析成功但违反 lint 规则**时 lint 退 2、add / status 退 3，且拒绝路径账本不增行；节点号重复改由 A46 负例取证；add 自身入参（node/agent/event/时序）非法仍退 2。
  - **机器证**｜来源：design/01 + `HC-RL-A45`｜坏账本 status 退出 4。
  - **机器证**｜来源：design/01 + `HC-RL-A84`｜空账本与首行 plan_loaded 语义正确。
  - **机器证**｜来源：design/01 + `HC-RL-A55`｜每行固定七字段、agent 格式正确。
  - **机器证**｜来源：design/01 + `HC-RL-A50`｜配对键为 `(node, agent)`。
  - **机器证**｜来源：design/01 + `HC-RL-A49`｜attempt 每节点从 1 起、跨节点不累计。
  - **机器证**｜来源：design/01 + `HC-RL-A58`｜attempt 跳号/重号拒绝。
  - **机器证**｜来源：design/01 + `HC-RL-A51`｜账本不含 pane ID。
  - **机器证**｜来源：design/01 + `HC-RL-A59`｜node/agent/event 入参与**四类**豁免正确，四成员并列 `orchestrator#` / `monitor#` / `planner-amend#` / `strategist#`；豁免**仅**限「agent 名属于该节点 agent 表」这一条，node 活跃且非 superseded、event 词表、写者一致、状态机与 attempt、各前置闸一律照常校验。
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
- **变更范围**：计划解析/lint、账本追加与 agent 状态机代码、对应 unittest。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_03 -->
  - `tools/relay-light/relay_log.py`
  - `tools/relay-light/test_relay_log.py`
  - `docs/modules/relay-light/workspace/RLT_03/**`
- **档位**：标准。
- **任务类型**：重核 <!-- dh:task-type:v1 task=RLT_03 type=heavy -->
- **实施提示**：字符串比较区分大小写；解析只逐行扫描与 split，不引入 Markdown 解析依赖；使用 `open(..., 'a')` 一行一 JSON，`by` 只验形态一致性，不声称验真。

#### RLT_05 — status/生命周期与配置/Recipe/止损

- **目标**：从 plan+账本派生节点/阶段/agent 状态、可关闭原因、open_stages、阶段结果与机械分路，并守住 node_close→stage_result→stage_close 的交接偏序；建立可加载的 `roles.toml`/`dh-mapping.toml`，按 marker `recipe=` 机械校验每个 R 实例的 reviewer 集合（Recipe 来源规则由 RLT_07 的 skill 承载）与 attempt/X 两套独立止损。
- **非目标**：不判断产出是否合格；不驱动 Herdr；不缓存或硬编码 W→C→R→F；不把模型名写入流程/模板；不改 dev-harness；不自行给 legacy 缺失任务类型的卡选默认值。
- **验收口径**：
  - **status/生命周期组**：
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
  - **机器证**｜来源：design/01 + `HC-RL-A62`｜status JSON schema、排序与计数结构满足 §3.5；其中 `plan` 精确键含 `decision_mode`，本条不重复 A73 的 superseded 差分证明。
  - **机器证**｜来源：design/01 + `HC-RL-A73`｜superseded 不产生状态、不进三列表；活跃 status 差分等价，唯一允许 `superseded_ignored` 不同。
  - **配置/Recipe/止损组**：
  - **机器证**｜来源：design/01 + `HC-RL-A107`｜attempt 与 X 轮数独立触发 strategist。
  - **机器证**｜来源：design/01 + `HC-RL-A116`｜recipe 三值及实际 reviewer 集合严格匹配配置。
  - **机器证**｜来源：design/01 + `HC-RL-A131`｜roles.toml 角色键与正式 design §6.3 的 11 个角色精确相等，且每个角色的 model/launch 可加载。
  - **机器证**｜来源：design/01 + `HC-RL-A92`｜映射承载阶段、Recipe、limits、on_exceed 四类内容，且 E11/E12/E13 不出现在任何阶段。
  - **机器证**｜来源：design/01 + `HC-RL-A115`｜heavy/normal/light reviewer 集合对齐 dev-harness 节点表。
  - **机器证**｜来源：design/01 + `HC-RL-A99`｜改 `limits.rework_max_rounds` 不改 relay_log 即改变规划出的 X 节点数；模板生成走 lint/skill 内部实现，对外子命令仍只有 add/status/lint；配置来源为 §6.2.1 默认目录。
  - **机器证**｜来源：design/01 + `HC-RL-A134`｜无 checker 的合法合成 plan 仍可通过 lint/status。
  - **机器证**｜来源：design/01 + `HC-RL-A135`｜add/status/lint 均接 `--config-dir`；显式值展开 `~`、规范化为绝对路径并百分号编码记入账本；直接调用走 §6.2.1 五情形 resolver。
  - **机器证**｜来源：design/01 + `HC-RL-A97`｜其它结构合法、唯一违规为 X 超限的合成 plan 被 lint 以 A97 精确拒绝；strategist 链结论必须经 `user_decision` 才能走 resume 或 cancelled，auto 模式亦然。
- **变更范围**：status/lifecycle、程序配置读取/校验与 unittest。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_05 -->
  - `tools/relay-light/relay_log.py`
  - `tools/relay-light/test_relay_log.py`
  - `tools/relay-light/skill/roles.toml`
  - `tools/relay-light/skill/dh-mapping.toml`
  - `docs/modules/relay-light/workspace/RLT_05/**`
- **档位**：标准。
- **任务类型**：重核 <!-- dh:task-type:v1 task=RLT_05 type=heavy -->
- **实施提示**：分路只看 `last_stage_result.outcome`，`suggested_action` 是派生建议不是命令，编排仍自己查表；关终端空间是外部动作，只验证其证据顺序，不伪造程序控制。reviewer 三档取值以正式输入 §6.3 为唯一权威（§6.2 只写结构不写取值），止损节名是 `[limits]` 与 `[limits.on_exceed]`。三个 CLI 均显式支持 `--config-dir`；显式值优先、无显式值时按单侧自动/双侧或零侧 fail closed 的五情形解析，规范化绝对路径百分号编码后写入 `plan_loaded.note`。

#### RLT_07 — skill 核心、adapter 与五阶段模板

- **目标**：在仓内唯一源写齐 skill 五件，冻结角色拉取、等待接收者、五阶段模板、命令模板、密钥红线、职责分工、批内不换人和异常决策链，并承载“Recipe 唯一来自任务卡 task_type、字段缺失即问用户”的规划规则。
- **非目标**：不改 dev-harness；不让流程文档硬编码模型；不实现 `watch`；不把运行计划放进任务工作区。
- **验收口径**：
  - **机器证**｜来源：design/01 + `HC-RL-A12`｜skill 五件与核心小节齐全且落点正确。
  - **机器证**｜来源：design/01 + `HC-RL-A127`｜五阶段模板不生成 kickoff 或 verify 签字节点。
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
  - **机器证**｜来源：design/01 + `HC-RL-A117`｜SKILL.md 规定 Recipe 只来自任务卡 task_type，缺失时停下问用户。
  - **机器证**｜来源：design/01 + `HC-RL-A132`｜skill/adapter/模板/流程不硬编码模型名，只引用角色名。
  - **机器证**｜来源：design/01 + `HC-RL-A133`｜五阶段模板 C 节点默认包含 checker，且与 A95 的 trigger/close 合同一致。
  - **机器证**｜来源：design/01 + `HC-RL-A136`｜两份 adapter 的 add/status/lint 全部命令模板均显式传本侧默认安装副本的 `~/... --config-dir`，由 A135 展开。
- **变更范围**：仓内 skill 五文件及结构测试。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_07 -->
  - `tools/relay-light/skill/**`
  - `tools/relay-light/test_relay_log.py`
  - `docs/modules/relay-light/workspace/RLT_07/**`
- **档位**：标准（Agent 协议接线）。
- **任务类型**：重核 <!-- dh:task-type:v1 task=RLT_07 type=heavy -->
- **实施提示**：改协作只改配置/模板；adapter 必须写无 watch 的前台 wait 回退，因为前四批 `watch` 尚未落地，不得假定它已存在；Claude/Codex adapter 分别显式传本侧默认安装副本的 `--config-dir`。

#### RLT_08 — AGENTS 判定、协议索引与模块身份

- **目标**：新增 relay-light 编排协议段、标头判定、双模块入口与仓内 skill 索引；给现役 Runner 铁律加“冻结流水”边界，并登记运行中改计划有意绕过 B-adjust 的窄例外。
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
- **实施提示**：必须原文表达“有意绕过 B-adjust”，同时声明设计与验收仍走 dev-harness；不得改上游 skill 来消除冲突。A29 的双模块身份与英文 scope `relay-light` 必须先落地，RLT_12 的首次真实安装才可开工。

#### RLT_09 — 运行中追加改计划与白名单守门

- **目标**：实现 `plan_amend`、表尾追加/旧行 superseded、编排重读、`stage_result` amend 摘要，以及 planner-amend 输入四件/一次改完/lint 三次/禁区整份不落笔的提示词与可执行白名单校验。**A120 的两项连续性放宽（同 stage 表尾追加、被 superseded 行隔开）由本卡交付**；RLT_03 交付的是去 superseded 后的**严格基础 lint**，本卡负责覆盖其临时限制。
- **非目标**：不原地复用节点号；不允许 planner-amend 改 `design/`；不把白名单内部分先落笔；不借此改变正式验收 ID。
- **验收口径**：
  - **机器证**｜来源：design/01 + `HC-RL-A119`｜plan_amend 写者、note、可重复与不进状态机正确。
  - **机器证**｜来源：design/01 + `HC-RL-A120`｜两项连续性放宽通过（同 stage 表尾追加、被 superseded 行隔开），四项硬约束仍拒绝并报有效编号。**承接 RLT_03 的交接断言**：①「被 superseded 行隔开」始终通过；②「其余条件合法的同 stage 表尾追加」在 RLT_09 前后按正式版本记录**拒绝→通过**；③四项硬约束全部保持拒绝及有效编号；④既有 A46 / A72 / A75 / 枚举与依赖回归保持；⑤运行中追加能力最终由 RLT_16 / RLT_19 实跑证明，交付方式仍按 §4.5——**当前阶段实例内**追加由当班监工直接接手、**后续阶段**由编排开到时按常规处理。取证须另造**满足全部其他规则、只有表尾位置差异**的合法追加正例；既有 `C1 → R1 → C2` 多违规 fixture 因 `C2.depends_on=R1` 同时违反硬约束，**不承诺原样翻绿**，必要时仅变更其实际负责的规则断言。
  - **机器证**｜来源：design/01 + `HC-RL-A121`｜两次 status 之间不改代码、不改账本，只修改同一计划文件并追加新阶段节点行及保持计划合法所必需的对应 agent 行；status 重读出新阶段与非固定顺序。
  - **机器证**｜来源：design/01 + `HC-RL-A122`｜三类白名单闭集、design 禁区与全有全无守门可执行；拒绝分支全部计划目标及输入方案文件零变化，planner-amend 只以普通 `done.note` 写结构化超范围原因，不写 `blocked` / `escalate` / `plan_amend`，由 monitor 记 `stage_result outcome=blocked`。
  - **机器证**｜来源：design/01 + `HC-RL-A123`｜有/无 plan_amend 时 stage_result 摘要格式正确。
- **变更范围**：程序、单测及仓内 skill 的 planner-amend 模板。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_09 -->
  - `tools/relay-light/relay_log.py`
  - `tools/relay-light/test_relay_log.py`
  - `tools/relay-light/skill/**`
  - `docs/modules/relay-light/workspace/RLT_09/**`
  - （`docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md` 与 `docs/modules/relay-light/design/evidence/08-交叉审核记录-RLT09-oracle澄清.md` 仅限 RLT-A-07 最小 A-adjust，用户 2026-09-13 授权）
- **档位**：标准（运行中变更计划与组件接线）。
- **任务类型**：重核 <!-- dh:task-type:v1 task=RLT_09 type=heavy -->
- **实施提示**：**白名单三类路径全部在本仓 Git 内**，用紧邻本次动作的可复现仓外原始工作树快照（按原始 bytes/mode/symlink 留存）+ 只读 Git 状态核对取精确变更集，成功时 `actual == proposed`；触碰 `design/` 即在动笔前整份拒绝，全部计划目标和输入方案文件零变化，失败原因走 planner-amend `done.note` → monitor `stage_result outcome=blocked`。

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
  - `tools/relay-light/relay_log.py`（2026-09-13 用户对话裁决 decision.1 选项 A 追加，relay-light 运行中白名单追加、有意绕过 B-adjust；用途仅限实现 A80 的 `lint --json` 参数注册、分发与 JSON 输出，不得重写 lint 规则语义、status/add、installer 或 runner）
  - `tools/relay-light/test_relay_log.py`
  - `tools/relay-light/test_install_skill.py`
  - `tools/tests/relay-light-log.ps1`
  - `tools/tests/run-relay-tests.ps1`
  - `docs/modules/relay-light/workspace/RLT_10/**`
- **档位**：标准。
- **任务类型**：常规 <!-- dh:task-type:v1 task=RLT_10 type=normal -->
- **实施提示**：薄壳只 shell out、转发输出/退出码；缺 python 只输出 runner 已识别的 `SUITE SKIP`。全量入口同时登记 relay_log 与 install_skill 两份 unittest，原样透传输出与退出码。

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
  - **机器证**｜来源：design/01 + `HC-RL-A32`｜两个用户级目录的五文件分别与 `tools/relay-light/skill/` 的同名文件逐字节一致。
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
  - `%USERPROFILE%/.claude/skills/relay-light/**`
  - `%USERPROFILE%/.codex/skills/relay-light/**`
  - `docs/modules/relay-light/workspace/RLT_12/**`
- **档位**：标准 · 高危（组件接线 + 真实 Agent 场景与人验）。
- **任务类型**：常规 <!-- dh:task-type:v1 task=RLT_12 type=normal -->
- **实施提示**：**开工首步**：执行 `python tools/relay-light/install_skill.py --all`，开工前展示 `%USERPROFILE%` 解析后的两个绝对目标并取得用户明确授权，记录命令、退出码、最终哈希与两份 manifest；A32 逐字节一致是启动真计划的准入证据，收口前必须有 `verify(relay-light):`。准入证据还必须包括 RLT_10 验收与全量 runner 绿；Claude adapter 显式传 `~/.claude/skills/relay-light/`，由 A135 展开并编码记录，证明使用默认安装副本而非 fixture。凭据/窗口枚举先白名单过滤；阶段收尾必须按完整顺序走完并留证据：**`node_close` → `stage_result` → `stage_close` → 关终端空间 → 工作树收口**，顺序反了会留占用（正式输入 §5.2.1、§12）。

#### RLT_21 — Linux 预演回流：监工异常出口、启动修正记账、静默超时与派活纪律、决策模式门

- **目标**：把 RLT_12 Linux 非正式预演（DRILL_01）暴露的六条缺口落成程序与协议：`stage_result` 按 outcome 分校验并以 `ref=` 引用阻塞/失联事件；环境性 NOT_RUN 的合法出口；`launch_fix=` 运行事实记账；`silence_timeout_min` 配置与监工静默超时模板；两份 adapter 的派活提交/等待纪律与沙箱替代预检；并补齐 RLT_07 挂账的 `decision_mode` 模式门与 `cancelled` 归属闸。
- **非目标**：不实现 `watch`（RLT_18）；不改 dev-harness；不改现役 Runner；不把预演分支 `dryrun/rlt12-linux` 合入 master（其 `.gitignore` 交付另行 cherry-pick 或由本卡顺带承接，见实施提示）；不改动 RLT_12 的目标与验收；DR-F-006 按用户裁决 C 以 A143 承接（只改 plan-reviewer 模板分级，不改 Recipe 路径数）。
- **验收口径**：
  - **机器证**｜来源：design/01 + `HC-RL-A137`｜`stage_result` 的 `done`/`cancelled` 仍要求全节点 closed；`blocked`/`failed` 允许节点未关但必须合法 `ref=`。
  - **机器证**｜来源：design/01 + `HC-RL-A138`｜连续 `attempt_max` 条 NOT_RUN `agent_lost` 后 `blocked` 出口可写；`launch_fix=` 重拉按值分别计数。
  - **机器证**｜来源：design/01 + `HC-RL-A139`｜`launch_fix=` 不触发 `plan_amend`、不被 lint 校验，`status --json` 暴露字段。
  - **机器证**｜来源：design/01 + `HC-RL-A140`｜`limits.silence_timeout_min` 可加载，`status` 静默超限提示，三处监工模板含静默超时原文。
  - **机器证**｜来源：design/01 + `HC-RL-A141`｜两份 adapter 含派活提交确认、事件监听与空闲告警、沙箱替代预检三段原文。
  - **机器证**｜来源：design/01 + `HC-RL-A142`｜`decision_mode` 模式门与 `cancelled` 归属闸在 `add` 路径生效；RLT_07 两条 skip 负例去 skip 即绿。
  - **机器证**｜来源：design/01 + `HC-RL-A143`｜light 档 plan-reviewer 模板分级：纯措辞 P2 不阻断，四类边界项 P1。
- **变更范围**：`relay_log.py` 的 `stage_result`/`agent_launch`/决策链校验与 `status` 输出；`test_relay_log.py`；skill 五件中的 `SKILL.md`、两份 adapter、`dh-mapping.toml`；本卡工作区。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_21 -->
  - `tools/relay-light/relay_log.py`
  - `tools/relay-light/test_relay_log.py`
  - `tools/relay-light/skill/**`
  - `docs/modules/relay-light/workspace/RLT_21/**`
- **档位**：标准。
- **任务类型**：常规 <!-- dh:task-type:v1 task=RLT_21 type=normal -->
- **实施提示**：输入以 `workspace/RLT_12/evidence/linux-dry-run/README.md` 的 DR-F-001～006 与账本 `relay/dryrun-linux-01/relay_log.jsonl`（预演分支）为事实来源，不重跑预演；`ref=` 与 `launch_fix=` 均为 note token，沿用 `_note_tokens` 解析，不新增账本字段；skill 改动后的两侧重同步与 RLT_12 同闸：先展示解析后的两个绝对目标并取得用户当次明确授权，再 `install_skill.py --all`，记录命令、退出码、哈希与两份 manifest；未授权则停在仓内验证（A32 仍由 RLT_12 首步正式取证）。

#### RLT_22 — 复核触发改非终态「待复核」信号与节点内返工生命周期

- **目标**：把 RLT-A-09 裁定的修法落成程序与协议——在**送审方与判定方同处一个节点**的形态（W/C/X）里，把判定方的触发条件从终态 `done` 换成非终态的「待复核」信号：新增 `on:review_ready:<送审方>` 的 trigger 前置（A144）、把 `ready_for_review=` 送审信号写成写入时即校验的合同（A145）、把判定方封口做成写 `done` 时即时生效的配对闸（A146）、给 `loss_stop()` 加第三套只投影不拒写的 `review_rounds` 计数（A147）、钉住向后兼容与同节点混用两种 trigger（A148）、同步 W/C/X 模板与两份 adapter 的封口纪律原文（A149）、把 lint 的 trigger 从三态扩为四态（A150）。判定角色闭集取 `{plan-reviewer, checker, reviewer}`。
- **非目标**：**不改 A2**（事件层 19 词白名单不动，信号复用 `checkpoint` + 类型化 token）；**不改 A62**（`status --json` 冻结 schema 不动，第三套计数只投影、不进 status）；**不改 A95**（C 的 checker 仍留空 trigger）；**不改 A102**（批内往返不加 attempt，其在新模型下成立由 A145 正例证明，不假定自动继承）。**不动 R 阶段模板**与 R 的复核收敛形态。不实现 `watch`（RLT_18）；不改 dev-harness；不改现役 Runner；**不对旧计划强制迁移**（lint 不对 `on:done:<X>` 报错、也不报建议迁移）。不豁免、不削弱 A49/A60/A70 中的任何一条：A49 与 A60 一字不改，A70 保号且语义不改，新前置另立 A144。不改 `roles.toml` 的角色表与模型绑定，不改 `dh-mapping.toml` 的键名与取值。
- **验收口径**：
  - **机器证**｜来源：design/01 + `HC-RL-A144`｜`on:review_ready:<S>` 的拉起前置：写 `agent_launch <Rv>#<n>` 时本节点须存在一条 `checkpoint`，其 `agent` 为 `<S>` 的**当前实例** `<S>#<a>`、`ready_for_review=` 值**恰等于** `<Rv>`，且该 `checkpoint` 是该实例的**最新 agent 事件**；无信号、路由指向另一判定方、旧 attempt 的信号、被普通 `checkpoint` 覆盖、`blocked` 之后、`<S>` 已终态各一反例退 2 报 A144；重复 `agent_launch` 仍由 A58/A49 拦下，编号不串。
  - **机器证**｜来源：design/01 + `HC-RL-A145`｜送审信号写入合同：`checkpoint` 的 `note` 含 `ready_for_review=` 时该前缀 token **恰好一个**（≥2 退 2，防 `_note_tokens` 静默保留首个）；`<Rv>` 须在**本节点** agent 表中且 `role` ∈ 判定角色闭集；写入者自身不得是判定角色；该 `checkpoint` 不伴随 `agent_launch`、attempt 不变；`add` 层**不设轮次硬上限**；`ready_for_review=` 不被 A69 的 helper token 扫描误命中。
  - **机器证**｜来源：design/01 + `HC-RL-A146`｜判定方封口配对闸，**执行位点是 agent `done` 的语义校验，不是 `node_close` 兜底**：当且仅当本节点存在指向该判定方的 ready 信号时生效；生效时 `done` 的 `note` 须含 `reviewed=<S>#<a>` 与 `ready_seq=<n>`，`<n>` 指向的事件须是 `checkpoint` 且其 `agent` **逐字等于** `<S>#<a>`、`ready_for_review=` 等于 `<Rv>`、为该组合下**最新**一条，且 `<S>#<a>` 已 `done` 且其 `seq` 早于本条；跨实例拼接、引用旧轮次、送审方未终态各一反例退 2 报 A146，且该 `done` 不落账。
  - **机器证**｜来源：design/01 + `HC-RL-A147`｜第三套止损计数**只投影、不拒写**：`loss_stop()` 新增 `review_rounds[(node, reviewer)]`（该组合下的 ready 信号条数，首轮计入）与 `review_exhausted`（条数 ≥ `limits.rework_max_rounds` 且该判定方在本节点仍无 `done`）；耗尽时 `LossStop.triggered` 为真，出口仍是 strategist 链 → 用户闸（A97/A114 不变）；超限后第 N+1 条 ready 仍被 `add` 接受且账本增行；`rework_max_rounds` 取 2 与 3 由**同一实现**得出正确停止点；三套计数互不叠加、互不重置。
  - **机器证**｜来源：design/01 + `HC-RL-A148`｜向后兼容：`on:done:<X>` 的 lint 与运行时语义与 A70 **逐字一致**，旧计划原样过 lint、旧账本原样重放逐条被接受；**R 模板与一切无 ready 信号的节点不受 A146 影响**（判定方直接写 `done` 被接受）；同一节点内混用 `on:done:` 与 `on:review_ready:` 两种 trigger 均被接受，两路各按自己的前置校验，反例编号不串。
  - **机器证**｜来源：design/01 + `HC-RL-A149`｜模板与 adapter 同步：`SKILL.md` 的 **X 模板**被打回那路 reviewer 的 trigger 由 `on:done:coder` 改为 `on:review_ready:coder`，**W 模板**按用户裁决同改（`plan-reviewer` 纳入判定角色闭集），**C 模板** trigger 列不改但补「PASS 前不记 `done`」纪律原文，**R 模板三行与现状逐字一致**；`SKILL.md` 硬规则段与两份 adapter 的监工模板各含「PASS 前双方均不记 `done`；FAIL 走 live 判定方的 `checkpoint` 路由回同一送审方；PASS 后按送审方→判定方顺序记终态」原文；另对 W、C 与 X 各跑最小账本序列（与 design/01 `HC-RL-A149` 的「怎么验」列一致；W 纳入为用户 2026-09-15 对开放项②的裁决），覆盖判定方 `agent_lost` 后按 A49 合法重拉并消费新信号、同实例 FAIL→PASS 无第二条 `agent_launch`、两路一 FAIL 一 PASS 互不干扰三种情形。
  - **机器证**｜来源：design/01 + `HC-RL-A150`｜lint 覆盖新 trigger：`trigger` 由三态扩为**四态**（空 / `on:blocked` / `on:done:<名字>` / `on:review_ready:<名字>`），非法值与引用不存在的 agent 名由 **A35 承接**拒绝，跨节点引用由 **A71 承接**拒绝；给没有同节点送审方的节点（R 形态）的 reviewer 写 `on:review_ready:coder` 被 A71 拒——这是 R 不适用本修订的机械证据。
- **变更范围**：`relay_log.py` 的 `_require_trigger`（新增 `on:review_ready:` 分支，`on:done:` 分支不动）、lint 的 trigger 校验、`checkpoint` 与 agent `done` 的语义校验、`loss_stop`/`LossStop` 与按 `role` 取判定角色闭集的读取；`test_relay_log.py`；skill 五件中的 `SKILL.md`（W/C/X 模板与硬规则段）、两份 adapter、`dh-mapping.toml` 的 `[limits.on_exceed].note` 说明文字（「两套计数」改「三套」，键与取值不变）；本卡工作区。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_22 -->
  - `tools/relay-light/relay_log.py`
  - `tools/relay-light/test_relay_log.py`
  - `tools/relay-light/skill/**`
  - `docs/modules/relay-light/workspace/RLT_22/**`
- **档位**：标准。
- **任务类型**：常规 <!-- dh:task-type:v1 task=RLT_22 type=normal -->
- **实施提示**：事实来源是 `workspace/RLT_12/findings.md` 的 **F-008** 与真计划账本 `relay/rlt12-win-01/relay_log.jsonl`（C1 的 seq 16/19/20/21、C2 的 seq 25/26/27/29），**不重跑真计划**。三个 token（`ready_for_review=` / `reviewed=` / `ready_seq=`）沿用 `_note_tokens` 解析，**不新增账本字段、不动 19 词白名单、不动 `_validate_agent_transition` 的迁移表**；A146 落在 `_validate_runtime_event`/`_validate_event_semantics` 一线，**不落 `_validate_node_close`**（后者只在关节点兜底，实现不了即时拒绝）；新校验须改用 `_latest_for_instance`，**不得沿用**按名跨 attempt 的 `_latest_by_name`（这是复核 P1-2 的病根）；`_note_tokens` 的「首个同名 key 胜出」行为不改，改为在写入侧禁止重复 token。A35/A65/A71/A107 四条现有验收的修订由本卡同批承接证据（A150 承接 A35/A71 的扩集与同节点约束，A147 承接 A107 的「两套→三套」，A65 命题不变、补一个 `on:review_ready:` 未触发的同款正例），§6 对照表中这四条的 owner 不变。skill 改动后的两侧重同步与 RLT_12/RLT_21 同闸：**先展示 `%USERPROFILE%` 解析后的两个绝对目标并取得用户当次明确授权**，再 `install_skill.py --all`，记录命令、退出码、哈希与两份 manifest；未授权则停在仓内验证（A32 仍由 RLT_12 首步正式取证）。

#### RLT_13 — Windows Codex 与纯配置换协作

- **目标**：用同一份 skill 由 Codex 主控复跑真计划，并只改 roles/mapping/模板做一次协作方式调整，证明核心代码无需变。
- **非目标**：不改 relay_log 迁就主控；不做 Linux；不把模型名散落到流程模板。
- **验收口径**：
  - **人判**｜来源：design/01 + `HC-RL-H18`｜Codex adapter 显式传入 Codex 默认安装副本的 `~/...` 路径；展示计划、账本、status、产出、两次五文件哈希、adapter 命令及 `config_dir=` 解码路径，用户判断换主控后能否只靠 adapter 跑通且未使用 fixture。
  - **人判**｜来源：design/01 + `HC-RL-H7`｜用户判断只改配置/模板是否真能改变协作方式。
- **变更范围**：本卡受控配置 fixture、真计划/账本与证据。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_13 -->
  - `docs/modules/relay-light/workspace/RLT_13/config-fixture/**`
  - `docs/modules/relay-light/relay/**`
  - `docs/modules/relay-light/workspace/RLT_13/**`
- **档位**：标准。
- **任务类型**：常规 <!-- dh:task-type:v1 task=RLT_13 type=normal -->
- **实施提示**：fixture 从当时仓内五文件复制，核心 `SKILL.md` 与两个 adapter 保持逐字节一致，只允许 `roles.toml`、`dh-mapping.toml` 与明确模板片段变化；Codex adapter 显式传 `~/.codex/skills/relay-light/`，由 A135 展开并编码记录，以承接 H18。真实用户级副本不得由本卡就地修改。

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
- **实施提示**：默认 auto 那一路的 marker **不写 `decision_mode=`**，用以实证「未写即 auto」（`HC-RL-A18`、`HC-RL-A130`）；consult 的用户决定必须是真实对话证据；auto 不得伪造 user_decision。

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
  - `%USERPROFILE%/.claude/skills/relay-light/**`
  - `%USERPROFILE%/.codex/skills/relay-light/**`
  - `docs/modules/relay-light/relay/**`
  - `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md`
  - `docs/modules/relay-light/workspace/RLT_16/**`
- **档位**：标准 · 高危（运行中计划变更 + 组件接线）。
- **任务类型**：重核 <!-- dh:task-type:v1 task=RLT_16 type=heavy -->
- **实施提示**：实跑前先在 Windows 执行 `python tools/relay-light/install_skill.py --all`，确认两目标含 RLT_09 的最新源内容；开工前展示两目标绝对路径并取得用户明确授权，记录命令、退出码与最终哈希，收口前须有 `verify(relay-light):`。**RLT_14 前置依据**：本场景以“施工 `blocked` → decider 提出需要改计划”开头；该 blocked→decider 链由 RLT_14 验证，未先跑通则失败时不能定位是改计划机制还是决策链。**允许路径不得用 `workspace/**` 通配**——按 marker 的 `cards` 逐卡登记精确 `task_plan.md`；任何 `design/` 命中都必须整份不落笔并交用户。

#### RLT_19 — 新增任务卡追加阶段实跑

- **目标**：实跑运行中改计划的**跨卡路径**：`planner-amend` 改开发方案任务行、往 marker `cards` 加新卡号、往 `relay_plan` 追加该卡的 W/C/R/F 阶段行，然后由**编排开到新 W 阶段时才拉监工**，builder 照常建新卡的任务工作区七件套。
- **非目标**：**不由 planner-amend 建新卡的 task_plan 与七件套**——新卡的 `task_plan.md` 由其 W 阶段 builder 建，改计划实例写它即判失败（`HC-RL-A122`）；不改 `design/` 或验收 ID；不重复 RLT_16 的卡内路径。
- **验收口径**：
  - **人判**｜来源：design/01 + `HC-RL-H17`｜用户判断跨卡追加、编排开新阶段与 builder 分工是否顺手。
- **变更范围**：本场景计划与 marker、DevPlan 测试任务行、新卡由 builder 建的任务工作区、账本与证据。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_19 -->
  - `%USERPROFILE%/.claude/skills/relay-light/**`
  - `%USERPROFILE%/.codex/skills/relay-light/**`
  - `docs/modules/relay-light/relay/**`
  - `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md`
  - `docs/modules/relay-light/workspace/RLT_19/**`
- **档位**：标准 · 高危（运行中计划变更 + 组件接线）。
- **任务类型**：重核 <!-- dh:task-type:v1 task=RLT_19 type=heavy -->
- **实施提示**：实跑前在 Windows 再执行一次 `python tools/relay-light/install_skill.py --all`，记录命令、退出码与两目标最终哈希；开工前展示绝对目标并取得用户明确授权，收口前须有 `verify(relay-light):`。**允许路径不得用 `workspace/**` 通配**；新卡的 `task_plan.md` 不在改计划实例白名单内，须由 W 阶段 builder 建。

#### RLT_17 — Linux 双主控实测与取证方向账

- **目标**：先在方向账冻结 ThinkPad 访问、命令、证据回传、失败/中断与隐私处理，再由用户设备分别用 Claude Code 与 Codex 主控跑真计划并直跑同一 Python 测试。
- **非目标**：不以 Windows 模拟或容器替代 ThinkPad；不因设备暂不可用认险放行；不实现 Linux 专属业务分支。
- **验收口径**：
  - **机器证**｜来源：design/01 + `HC-RL-A15`｜ThinkPad 原样展示 `python3 -m unittest` 命令、输出与退出码。
  - **机器证**｜来源：design/01 + `HC-RL-A125`｜Windows 与 ThinkPad 在同一 clean commit 各执行 `--all`，四目录五文件哈希全等，四份当前 manifest 的 source_head/源哈希一致。
  - **人判**｜来源：design/01 + `HC-RL-H3`｜Claude adapter 显式传本侧默认副本；展示 adapter 命令、`config_dir=` 解码路径、默认副本哈希及 `python3 -m unittest` 退出码，供用户判断一致性。
  - **人判**｜来源：design/01 + `HC-RL-H4`｜Codex adapter 显式传本侧默认副本；展示 adapter 命令、`config_dir=` 解码路径与默认副本哈希，供用户判断四组合交付。
- **变更范围**：Windows/ThinkPad 四目标全量同步、Linux 实跑计划/账本、方向账与回传证据。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_17 -->
  - `%USERPROFILE%/.claude/skills/relay-light/**`
  - `%USERPROFILE%/.codex/skills/relay-light/**`
  - `/home/nash/.claude/skills/relay-light/**`
  - `/home/nash/.codex/skills/relay-light/**`
  - `docs/modules/relay-light/relay/**`
  - `docs/modules/relay-light/workspace/RLT_17/**`
- **档位**：标准 · 高危（跨平台真机、组件接线与用户人验）。
- **任务类型**：常规 <!-- dh:task-type:v1 task=RLT_17 type=normal -->
- **实施提示**：两机先到同一 clean commit，Windows 执行 `python ... --all`，ThinkPad 执行 `python3 ... --all`。两机 Claude/Codex adapter 各显式传本侧默认副本；开工前分别展示两机四个绝对目标并取得用户明确授权；progress 记录 adapter 命令、`config_dir=` 解码路径、默认副本哈希、命令退出码、四目录哈希与四份当前 manifest，H3 另展示 `python3 -m unittest` 退出码，收口前须有 `verify(relay-light):`。未得终态就写未得终态。

#### RLT_18 — watch（第 5 批）

- **目标**：在第 5 批实现只通知不写账的 watch，验证 30 秒重挂、状态去重、20 分钟 tick、阶段/计划退出，以及 Claude/Codex 忙时 prompt 与 watch 死亡兜底。**用户 2026-09-09 已裁决 watch 接着做**，前四批完成后直接开工，不再挂「是否启动」的门。
- **非目标**：不把 watch 变成驱动器或写者；不做秒级监控；不把 watch 塞进前四批抢跑。
- **验收口径**：
  - **机器证**｜来源：design/01 + `HC-RL-A82`｜30 秒轮询、终态退出、working 重挂与状态去重正确。
  - **机器证**｜来源：design/01 + `HC-RL-A83`｜20 分钟 tick、无 watch 前台节拍与两层退出条件正确。
  - **机器证**｜来源：design/01 + `HC-RL-A101`｜watch 路径无任何写账调用。
  - **人判**｜来源：design/01 + `HC-RL-H11`｜用户判断 Claude/Codex 监工忙时 prompt 是否可靠。
  - **人判**｜来源：design/01 + `HC-RL-H12`｜用户判断杀 watch 后 20 分钟兜底是否可接受。
- **变更范围**：watch 子命令、打桩测试、仓内两个 adapter、两机四目标终局同步与本卡证据。
- **允许路径**：<!-- dh:allowed-paths:v1 task=RLT_18 -->
  - `tools/relay-light/relay_log.py`
  - `tools/relay-light/test_relay_log.py`
  - `tools/relay-light/skill/references/adapter-claude-code.md`
  - `tools/relay-light/skill/references/adapter-codex.md`
  - `%USERPROFILE%/.claude/skills/relay-light/**`
  - `%USERPROFILE%/.codex/skills/relay-light/**`
  - `/home/nash/.claude/skills/relay-light/**`
  - `/home/nash/.codex/skills/relay-light/**`
  - `docs/modules/relay-light/workspace/RLT_18/**`
- **档位**：标准 · 高危（第 5 批 watch 与组件接线）。
- **任务类型**：重核 <!-- dh:task-type:v1 task=RLT_18 type=heavy -->
- **实施提示**：本卡直接依赖 RLT_17。最终 adapter 改完后，Windows 与 ThinkPad 各执行一次 `--all`，回归四目标最终哈希一致；这是 A125 的终局回归，不重复承接该 ID。开工前展示四个绝对目标并取得用户明确授权，收口前须有 `verify(relay-light):`。不得提前插队，因为 adapter 的无 watch 前台回退要先在前四批被证明过。

## 4. 批次与端到端交付

| 批次 | 任务 | 批末可演示结果 | 开批条件 |
|---|---|---|---|
| 1 | RLT_01、RLT_02、RLT_03、RLT_05、RLT_07、RLT_08、RLT_10、RLT_21、RLT_12、RLT_22 | Windows Claude 主控跑完第一份 W→C→R→F 真计划；仓内 skill 经首次全量安装后与 plan/add/status/lint、Recipe、AGENTS、仓库测试共同成立；C/X 的节点内返工路径（复核打回后同实例整改至 PASS 再依次封口）可演示 | B 方案生效；RLT_12 高危开工另取确认，且准入证据为 RLT_10 验收 + 全量 runner 绿；RLT_21 非 RLT_12 依赖（用户裁决），RLT_12 若先于 RLT_21 开工须在同一确认中写明带 A112/NOT_RUN 已知缺口与证据口径；RLT_22 只依赖 RLT_21，输入（F-008 与 `rlt12-win-01` 账本）已全部落盘，不另以 RLT_12 验收为门 |
| 2 | RLT_11、RLT_13 | 同一核心换 Codex 主控并只改配置改变协作；真计划产物完成退场核对与教训回流 | RLT_12 已合入 master（PR #25 `7981556`）并于 2026-09-15 由用户整体授权放行（记为「已验收（带风险放行）」）；**其五条人判 H1/H13/H5/H14/H10 至今未逐条判定、H10 的「只给账本」独立展示未进行**，三路独立复核系落章后补做（三路均 REVISE，8 条 P1 已整改或转派）。本批开工不以逐条人判为门，但**引用 RLT_12 结论时不得写成「端到端验收通过」**；另：`install_skill.py --all` 的两侧副本自 RLT_21 合入后已失效（findings F-016），本批实跑前须经用户当次授权重装 |
| 3 | RLT_09、RLT_14、RLT_15、RLT_16、RLT_19 | auto/consult、返工超限、卡内追加节点、新增任务卡追加阶段四组异常路径可演示 | **RLT_12 的 H1、H13 至今未逐条判定**（2026-09-15 用户整体授权放行 ≠ 对 H1/H13 的判断内容；证据槽位 E-002/E-003 为空槽）——**第 3 批开工须另取用户对 H1、H13 的明确判断**，不得以「RLT_12 已验收」代替；对应依赖卡已验收；各高危实跑另取确认 |
| 4 | RLT_17 | ThinkPad 上 Claude/Codex 两组合补齐四组合矩阵 | RLT_10、RLT_13、RLT_19 已验收，用户设备与取证窗口可用 |
| 5 | RLT_18 | watch 的忙时推送、重挂、tick 与死亡兜底可演示 | 前四批全部验收 |

**第一个端到端 demo 在第 1 批，完成点为 RLT_12。** 批次按可演示结果切；批内仍严格按任务依赖推进。RLT_20 号已并入 RLT_12 的开工首步，不复用。RLT_18 是设计已冻结的 watch 组件，固定第 5 批。全计划共 **19 张卡**（RLT_01~RLT_19 中去掉 RLT_04/RLT_06，RLT_20 号已并入 RLT_12；RLT-B-07 新增 RLT_21，RLT-A-09 新增 RLT_22）。**RLT_22 排第 1 批**：它与 RLT_21 同形（都是程序/协议缺口回流、依赖只到第 1 批内的卡），输入已全部落盘无须等 RLT_12 验收，且必须赶在第 3 批的异常路径实跑（RLT_15 返工超限、RLT_16 卡内追加节点、RLT_19 新增任务卡）之前落地，否则那三卡会原样复现 C1 的节点内死锁。

## 5. §14 开发方案同步项对照

| §14 项 | 承接任务 | 落法 |
|---|---|---|
| 1. skill 单源与全量同步 | RLT_01、RLT_12、RLT_17 | RLT_01 建仓内源与 `--all` 安装器，RLT_12 开工首步承接首次双目标安装/A32，RLT_17 承接两机四目标/A125；失败后整套重跑，不用软链或事务发布 |
| 2. AGENTS 编排协议段 | RLT_08 | 新增 relay-light 判定段，现役 Runner 标冻结流水 |
| 3. AGENTS 模块身份 | RLT_08 | 双模块描述、显式 slug 与 `dh relay-light` 索引 |
| 4. 与现役 Runner 一致性对照 | RLT_02 | **单独成卡**；节点/角色/事件/关闭逐条裁决 |
| 5. 三条教训候选回流 | RLT_11 | 仅回流 §15 明列三条并回链来源 |
| 6. planner-amend 提示词与白名单 | RLT_09（机制）+ RLT_07（模板承载）+ RLT_16/RLT_19（实跑） | 输入四件、一次改完、lint 三次、禁区整份不落笔；白名单按精确路径登记，新卡 task_plan 不在其中 |
| 7. 有意绕过 B-adjust 写入 AGENTS | RLT_08 | 只允许 relay-light 运行中白名单改计划；design/验收不绕 |

## 6. 验收 ID → 任务卡对照（正好一次）

| 验收 ID | 任务卡 | 验收 ID | 任务卡 |
|---|---|---|---|
| HC-RL-A2 | RLT_03 | HC-RL-A5 | RLT_03 |
| HC-RL-A11 | RLT_10 | HC-RL-A12 | RLT_07 |
| HC-RL-A13 | RLT_11 | HC-RL-A14 | RLT_02 |
| HC-RL-A15 | RLT_17 | HC-RL-A16 | RLT_10 |
| HC-RL-A17 | RLT_03 | HC-RL-A18 | RLT_03 |
| HC-RL-A19 | RLT_07 | HC-RL-A21 | RLT_07 |
| HC-RL-A24 | RLT_03 | HC-RL-A26 | RLT_07 |
| HC-RL-A27 | RLT_07 | HC-RL-A28 | RLT_08 |
| HC-RL-A29 | RLT_08 | HC-RL-A30 | RLT_12 |
| HC-RL-A31 | RLT_12 | HC-RL-A32 | RLT_12 |
| HC-RL-A33 | RLT_08 | HC-RL-A34 | RLT_08 |
| HC-RL-A35 | RLT_03 | HC-RL-A37 | RLT_03 |
| HC-RL-A38 | RLT_03 | HC-RL-A39 | RLT_03 |
| HC-RL-A40 | RLT_03 | HC-RL-A41 | RLT_03 |
| HC-RL-A42 | RLT_03 | HC-RL-A43 | RLT_05 |
| HC-RL-A44 | RLT_05 | HC-RL-A45 | RLT_03 |
| HC-RL-A46 | RLT_03 | HC-RL-A47 | RLT_03 |
| HC-RL-A48 | RLT_03 | HC-RL-A49 | RLT_03 |
| HC-RL-A50 | RLT_03 | HC-RL-A51 | RLT_03 |
| HC-RL-A55 | RLT_03 | HC-RL-A56 | RLT_03 |
| HC-RL-A58 | RLT_03 | HC-RL-A59 | RLT_03 |
| HC-RL-A60 | RLT_03 | HC-RL-A61 | RLT_05 |
| HC-RL-A62 | RLT_05 | HC-RL-A63 | RLT_03 |
| HC-RL-A126 | RLT_03 | HC-RL-A65 | RLT_05 |
| HC-RL-A66 | RLT_07 | HC-RL-A67 | RLT_07 |
| HC-RL-A68 | RLT_03 | HC-RL-A69 | RLT_03 |
| HC-RL-A70 | RLT_03 | HC-RL-A71 | RLT_03 |
| HC-RL-A72 | RLT_03 | HC-RL-A73 | RLT_05 |
| HC-RL-A74 | RLT_03 | HC-RL-A75 | RLT_03 |
| HC-RL-A77 | RLT_03 | HC-RL-A78 | RLT_03 |
| HC-RL-A80 | RLT_10 | HC-RL-A81 | RLT_05 |
| HC-RL-A82 | RLT_18 | HC-RL-A83 | RLT_18 |
| HC-RL-A84 | RLT_03 | HC-RL-A85 | RLT_05 |
| HC-RL-A127 | RLT_07 | HC-RL-A87 | RLT_03 |
| HC-RL-A128 | RLT_03 | HC-RL-A89 | RLT_05 |
| HC-RL-A129 | RLT_03 |  |  |
| HC-RL-A92 | RLT_05 | HC-RL-A93 | RLT_05 |
| HC-RL-A94 | RLT_10 | HC-RL-A95 | RLT_07 |
| HC-RL-A96 | RLT_07 | HC-RL-A97 | RLT_05 |
| HC-RL-A98 | RLT_07 | HC-RL-A99 | RLT_05 |
| HC-RL-A100 | RLT_07 | HC-RL-A101 | RLT_18 |
| HC-RL-A102 | RLT_07 | HC-RL-A103 | RLT_07 |
| HC-RL-A104 | RLT_03 | HC-RL-A105 | RLT_05 |
| HC-RL-A106 | RLT_05 | HC-RL-A107 | RLT_05 |
| HC-RL-A109 | RLT_03 |  |  |
| HC-RL-A110 | RLT_05 | HC-RL-A111 | RLT_05 |
| HC-RL-A112 | RLT_05 | HC-RL-A113 | RLT_07 |
| HC-RL-A114 | RLT_07 | HC-RL-A115 | RLT_05 |
| HC-RL-A116 | RLT_05 | HC-RL-A117 | RLT_07 |
| HC-RL-A118 | RLT_05 | HC-RL-A119 | RLT_09 |
| HC-RL-A120 | RLT_09 | HC-RL-A121 | RLT_09 |
| HC-RL-A122 | RLT_09 | HC-RL-A123 | RLT_09 |
| HC-RL-A124 | RLT_01 | HC-RL-A125 | RLT_17 |
| HC-RL-A130 | RLT_03 |  |  |
| HC-RL-A131 | RLT_05 | HC-RL-A132 | RLT_07 |
| HC-RL-A133 | RLT_07 | HC-RL-A134 | RLT_05 |
| HC-RL-A135 | RLT_05 | HC-RL-A136 | RLT_07 |
| HC-RL-H1 | RLT_12 | HC-RL-H18 | RLT_13 |
| HC-RL-H3 | RLT_17 | HC-RL-H4 | RLT_17 |
| HC-RL-H5 | RLT_12 | HC-RL-H6 | RLT_14 |
| HC-RL-H7 | RLT_13 | HC-RL-H10 | RLT_12 |
| HC-RL-H11 | RLT_18 | HC-RL-H12 | RLT_18 |
| HC-RL-H13 | RLT_12 | HC-RL-H14 | RLT_12 |
| HC-RL-H15 | RLT_15 | HC-RL-H16 | RLT_16 |
| HC-RL-H17 | RLT_19 | HC-RL-A137 | RLT_21 |
| HC-RL-A138 | RLT_21 | HC-RL-A139 | RLT_21 |
| HC-RL-A140 | RLT_21 | HC-RL-A141 | RLT_21 |
| HC-RL-A142 | RLT_21 | HC-RL-A143 | RLT_21 |
| HC-RL-A144 | RLT_22 | HC-RL-A145 | RLT_22 |
| HC-RL-A146 | RLT_22 | HC-RL-A147 | RLT_22 |
| HC-RL-A148 | RLT_22 | HC-RL-A149 | RLT_22 |
| HC-RL-A150 | RLT_22 |  |  |

> 退役 ID 不进入对照表、不复用。附录按活动 ID 排序；实际覆盖集合以正式输入 §11 的 125+15 条为准（RLT-A-09 后）。A35/A65/A71/A107 由 RLT-A-09 修订但 owner 不变，其修订后的证据由 RLT_22 的 A147/A150 与既有单测补例同批承接。

## 7. 正式输入回流与实施证据要求

本节原列 5 条「正式输入的矛盾或缺口」。**前 4 条已由 A′ 增补（2026-09-09）在正式输入中澄清**，第 5 条不是设计缺口而是实施证据问题，改写为对应任务的证据要求。

### 7.1 已由 A′ 增补澄清（4 条）

| 原第 N 条 | 问题 | 现在看哪里 |
|---|---|---|
| 1 | Recipe 权威冲突（`normal` 路数、`[rework]` 节名） | **已澄清**：`design/01` §6.2 改为只写结构不写取值，权威取值在 §6.3；止损节名为 `[limits]` 与 `[limits.on_exceed]`。承接卡 RLT_05 |
| 2 | `status --json` schema 不完整 | **已澄清**：`design/01` §3.5 冻结顶层字段合同（`current_stage`、`last_stage_result`、`suggested_action`、`monitor_relaunch_count`、`pending_nodes`、`superseded_ignored`）。承接卡 RLT_05 |
| 3 | strategist 账本链缺口 | **已澄清**：`design/01` §3.4 补 strategist 链并冻结事件归属与 `user_decision` 永远必需；§9.3 有事件行样例。承接卡 RLT_15 |
| 4 | 配置定位与生成接口未定义 | **已澄清**：`design/01` §6.2.1 定三 CLI 显式 `--config-dir`、单侧自动及双侧/零侧 fail closed 五情形，并要求 `plan_loaded` 百分号编码记录规范化绝对目录；HC-RL-A99 明确模板生成是内部实现、不新增公共 CLI。adapter 显式传本侧默认副本。承接卡 RLT_01、RLT_05、RLT_07 |

A′ 增补的裁决过程见 [`design/evidence/01-交叉审核记录-RelayLight运行中改计划.md`](../design/evidence/01-交叉审核记录-RelayLight运行中改计划.md) 的「A′ 增补 · B 审核回流」一节。**该增补已于 2026-09-09 由用户确认**，与本开发方案同批生效。

### 7.2 实施证据要求（原第 5 条改写）

原第 5 条说「用户级目录不受本仓 Git 管理，白名单 diff 无处取证」。这不是设计缺口——正式输入本就把两类变更集分开，本计划按两条落实：

- **`RLT_01` / `RLT_12` 开工首步｜仓内源用 Git、用户级副本用清单哈希**：RLT_01 在 Git 内实现唯一源与安装器，并用临时 home 证明失败后整套重跑（A124）；RLT_12 开工首步对真实两侧逐文件比对仓内源（A32）。不要求事务回滚或历史收据。
- **`RLT_09`｜白名单守门的变更集只在仓内取证**：改计划实例的白名单三类路径（`relay_plan.md`、`dev_plan/P<N>-*.md`、已登记卡的 `task_plan.md`）**全部在本仓 Git 内**，以紧邻本次动作的仓外原始工作树快照差（before/after 按原始 bytes/mode/symlink 比对）+ 只读 Git 状态核对作为权威变更集；禁区 `design/` 也在仓内。拒绝分支全部计划目标与输入方案文件零变化；planner-amend 的结构化 `done.note` 和 monitor 的 blocked `stage_result` 属账本证据，不能从计划文件差分偷滤第四类文件。用户级 skill 目录**不在改计划白名单里**，因此不需要非 Git 变更集。对应 `HC-RL-A122`。

一句话：**仓内源与改计划路径用 Git 取证，用户级派生副本用最终清单哈希取证，两者不混。**

## 8. 自查

### 8.1 覆盖关

- 从正式输入 §11 机器解析得到活动验收 **125 条 AI + 15 条人验 = 140 条**（RLT-A-08 续发 A137～A143，RLT-A-09 续发 A144～A150）。
- 本文件任务卡与 §6 对照表均按活动 ID 建映射：**140 个唯一 ID、0 漏项、0 重复**；退役 ID 未纳入。全计划 **19 张卡**，首次安装安排已并入 RLT_12，RLT-B-07 新增 RLT_21，RLT-A-09 新增 RLT_22。
- §14 七个同步项全部落到 RLT_01/RLT_02/RLT_07/RLT_08/RLT_09/RLT_11/RLT_12/RLT_17，且第 4 项由 RLT_02 单独成卡。

### 8.2 颗粒度关

- 每卡对应一个可一起实现、一起证明、一起签的验收单元：RLT_03 只签 parser/lint 与账本写入状态机，RLT_05 只签 relay-log、两份 TOML 与合成 plan 行为，RLT_07 只签 skill 文本、adapter 与五阶段模板；A116/A117、A131/A132、A133/A134、A99/A135、A135/A136 均按对象分域且不跨卡半签，A62/A73 不重复。
- 大量断言集中在 RLT_03~RLT_07，是同一生产单元的合同矩阵，不再按单条断言碎卡；实跑人验按用户可一次判断的场景拆为 RLT_12~RLT_19，其中改计划按「卡内追加节点」（RLT_16）与「新增任务卡追加阶段」（RLT_19）分成两张，因为两者的验证动作、允许路径与用户判断点都不同。
- 开工时持任务卡 + 唯一正式输入即可直接写 task_plan；本计划只写边界/验收/依赖，未写函数级动词顺序。

### 8.3 依赖关

- 依赖方向单向：RLT_01 独立并行；RLT_02 收口后，RLT_03 → RLT_05 → RLT_07 → RLT_08 → RLT_10 → RLT_12 构成首 demo 串行 6 卡。随后 RLT_13、RLT_14/RLT_15、RLT_09 → RLT_16 → RLT_19 → RLT_17 → RLT_18；RLT_21 → RLT_22 在第 1 批内串行；RLT_16 依赖 RLT_14 的 blocked→decider 验证，**19 张卡无环**（此处卡数此前停留在 17，未随 RLT-B-07 同步，本次一并修正）。
- 前置未验收不开放依赖卡；批次没有替代依赖列。
- 第一个端到端 demo 明确在**第 1 批 RLT_12**；RLT_18 固定第 5 批，前四批完成后直接开工。

## 9. 计划完工

- [ ] 19 张卡全部销户（RLT_20 号已并入 RLT_12），含第 5 批的 RLT_18（用户已裁决 watch 接着做）。
- [ ] 前四批交付 122 条机器验收与 13 条人验；第 5 批 RLT_18 补齐 watch 的 3 条机器验收与 2 条人验，**总账 140 条全部有等价证据**。
- [ ] Windows/Linux × Claude Code/Codex 四组合证据齐全；用户完成全部 15 条人判，其中 watch 的 2 条在第 5 批完成。
- [ ] `verify(relay-light):` 只能在用户查看证据并明确授权后提交；本方案确认不授权 verify、merge、push 或 deploy，各卡仍单独开工。
