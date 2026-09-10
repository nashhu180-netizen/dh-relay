<!-- dh:v1 · B 调整候选 v2.1（已于 2026-09-10 确认并晋级）。事件 RLT-B-03。 -->
# B 调整候选 v2 — RLT-B-03 开发方案颗粒度优化

- **目标文档**：[`dev_plan/P1-RelayLight-开发方案.md`](../P1-RelayLight-开发方案.md)
- **唯一业务输入**：[`design/01-RelayLight-产品设计与验收.md`](../../design/01-RelayLight-产品设计与验收.md) §1.1、§11、§14。
- **状态**：**形成史**。2026-09-10 用户确认后已晋级正式开发方案。

## 1. 目标与依据

正式方案对正式输入的 121 条验收映射是忠实的。本候选仅减去可合并的**实现流程重复**，不缩减功能、不改设计文本、不改验收号；已确认的按场景人判、实跑高危边界和适用 Recipe 默认不推翻。

- 现状为 20 卡、76 条 Recipe 复核路径，首个端到端 demo 前有 9 张串行卡。
- 候选为 17 卡、63 条路径；首个 demo 的关键串行链为 `RLT_02 → RLT_03 → RLT_05 → RLT_07 → RLT_08 → RLT_10 → RLT_12`（RLT_10 与 RLT_08 可并行，故串行 6 卡）。`RLT_01` 独立并行，只作 RLT_07 与 RLT_12 首次安装的前置。
- 复核路径按冻结 Recipe 计算：`heavy=5`、`normal=3`、`light=2`；新卡档位在 D 开工时仍须冻结，施工者不得自审。
- 组件接线及运行中计划变更仍逐卡保留用户开工确认与 `verify(relay-light):` 出口闸；合并实现卡或取消独立安装卡不构成绕闸。

## 2. 逐项调整

### 2.1 二合一：`RLT_03` = 原 03 + 04

- **改什么**：将计划解析/lint（原 RLT_03）与纯追加账本/agent 状态机（原 RLT_04）合为 heavy 的 `RLT_03 — 计划与账本写入合同`。
- **为什么**：两者共同定义 `add` 所接受的计划、节点、agent 与事件；解析成功后才能写入，单独验收 parser 仍不能形成可写账本。
- **省了什么**：2 张 heavy 卡变 1 张，10 条路径变 5 条，减少一次 worktree、一次 D 开工和一轮重核。
- **风险是什么**：合同面变大；本卡按下述 ID 群与两组 unittest 子集分别断言，不得以笼统“全绿”代替。

| 新卡 | 验收 ID 群 | 独立可跑测试入口 | 下游依赖 |
|---|---|---|---|
| RLT_03 | 原 RLT_03：A18/A24/A35/A46-A48/A64/A71-A73/A75/A86-A90/A104/A109；原 RLT_04：A2/A5/A17/A37-A42/A45/A49-A51/A55-A60/A63/A68-A70/A74/A77-A78/A84 | `python -m unittest tools/relay-light/test_relay_log.py` 中 parser/lint 与 add/state-machine 分组；Windows 同文件直跑 | RLT_05、RLT_07、RLT_09、RLT_10、RLT_12 |

### 2.2 二合一：`RLT_05` = 原 05 + 06

- **改什么**：将 status/阶段生命周期（原 RLT_05）与配置/Recipe/止损（原 RLT_06）合为 heavy 的 `RLT_05 — 状态派生与 Recipe 合同`，依赖 RLT_03。
- **为什么**：status 的阶段派生、reviewer 集合和止损分路必须共同读取同一份合法计划和配置；拆开不能形成可由 skill 消费的完整状态合同。
- **省了什么**：2 张 heavy 卡变 1 张，10 条路径变 5 条，减少一次 worktree、一次 D 开工和一轮重核。
- **风险是什么**：配置权威与状态派生可能互相遮蔽；两组验收仍按下述子集独立跑，RLT_05 的变更边界必须包含两个 toml。

| 新卡 | 验收 ID 群 | 独立可跑测试入口 | 下游依赖 |
|---|---|---|---|
| RLT_05 | 原 RLT_05：A43-A44/A61-A62/A65/A81/A85/A89/A93/A105-A106/A110-A112/A118；原 RLT_06：A91-A92/A97/A99/A107-A108/A115-A117 | `python -m unittest tools/relay-light/test_relay_log.py` 中 status/lifecycle 与 config/Recipe/limits 分组；Windows 同文件直跑 | RLT_07、RLT_09、RLT_10、RLT_12、RLT_15、RLT_18 |

### 2.3 `RLT_20` 并入 `RLT_12` 的首步

- **改什么**：取消独立 `RLT_20`；`RLT_12` 开工第一步执行一次 `install_skill.py --all`，展示两个绝对目标、取得用户确认、记录退出码/哈希/manifest，并承接 A32。
- **为什么**：它只是在首次真跑前执行一次已实现的安装命令；同类同步本已是后续实跑卡的卡内步骤。
- **省了什么**：少 1 张 normal 卡、3 条独立路径、1 次只为安装而设的 worktree 与收口。
- **风险是什么**：首次安装被 demo 叙事淹没；RLT_12 仍为高危组件接线，A32 的五文件逐字节比对、`verify(relay-light):` 与**RLT_10 全量 runner 绿**均为启动真计划前的准入证据。A32 的需求方向复核仍适用于合并后的 normal RLT_12，并未取消。

### 2.4 第 3 批改为人判开批门，不合并场景卡

- **改什么**：保留原 RLT_09（机制，heavy）、RLT_16（卡内追加，heavy 高危）、RLT_19（新增任务卡追加阶段，heavy 高危）三张卡及其正式方案中的验收归属和允许路径；第 3 批新增开批条件：RLT_12 的 H1、H13 已由用户判为“值得继续”。
- **为什么**：机制可独立实现和测试；H16 的当班监工接手卡内节点，与 H17 的新 W 阶段才拉监工、builder 建七件套，是不同的验证动作、精确允许路径和用户判断点。
- **省了什么**：不削弱两个已确认的场景签收；只避免在首次真跑价值尚未被用户确认前预设开启第 3 批。
- **风险是什么**：第 3 批被用户判定阻断；这是有意门，而非自动推进。每张高危实跑仍单独展示绝对路径、取得开工确认并分别完成 verify 门。

### 2.5 恢复 `RLT_14`、`RLT_15` 两张 normal 异常实跑卡

- **改什么**：保留 RLT_14 的 auto/consult blocked→decider（H6）与 RLT_15 的返工超限→strategist 人闸（H15）为两张 normal 卡，按正式方案原样独立复核和人判。
- **为什么**：两者虽都产出异常路径证据，但用户判断的问题不同；light 不含需求方向复核，不能替代 normal。
- **省了什么**：不以降低复核强度制造表面路径收益；可在 task_plan 层复用 fixture/公共准备，但不合并验收、review、用户人判或高危授权。
- **风险是什么**：准备成本仍在；以共享且隔离的 fixture 降低搭建成本，不共用账本结果。

### 2.6 恢复测试前置与教训后置

- **改什么**：RLT_10 恢复为第 1 批 normal 测试合同与仓库入口（A11/A16/A80/A94），RLT_12 显式依赖它；RLT_11 恢复为第 2 批 light 的 A13 退场核对与三条教训回流。
- **为什么**：demo 可跑不等于已通过仓库回归；正式输入要求同一 unittest 经薄壳登记进 `run-relay-tests.ps1` 并全量跑绿。A13 则以首个真计划产物为输入，必须在 demo 后。
- **省了什么**：不将验证闸后移；核心二合一和 RLT_20 并入首步仍带来净减卡与路径收益。
- **风险是什么**：首 demo 前多一个前置；以明确的全量 runner 绿和 RLT_10 验收消除真实目录写入前的回归盲区。

### 2.7 `RLT_17`、`RLT_18` 保持不动

- **改什么**：RLT_17 保持 normal、高危，完整承接 A15/A125、H3/H4；RLT_18 保持第 5 批独立 heavy、高危。
- **为什么**：H4 是正式输入活动人验，Windows Codex 不替代 Linux Codex；watch 具有独立实现、测试与 H11/H12 风险面。
- **省了什么**：不以错误合并换取卡数，只避免 RLT_17 重复采集已由 Windows 卡覆盖的证据。
- **风险是什么**：Linux 取证仍依赖用户设备；watch 仍待前四批完成后开工，最终 adapter 后两机 `--all` 只作 A125 回归、不重复 owner。

## 3. 原卡 → 新卡、复核路径与人判对照

本表的“取消”仅指取消独立任务卡；每个验收仍在 §6 正好一次。**本轮没有取消任何适用需求复核，也没有合并任何人判：H1~H17 仍按原场景分别落在原有的 RLT_12/13/14/15/16/19/17/18。**

| 原卡 | v2 新卡 | 处理 | 复核路径变化 | 人判是否仍独立 |
|---|---|---|---|---|
| RLT_01 | RLT_01 | 保留 | normal 3 → 3 | 无 |
| RLT_02 | RLT_02 | 保留 | light 2 → 2 | 无 |
| RLT_03 + RLT_04 | RLT_03 | 合并 | heavy 5+5 → 5；两组机器验收仍分组复核 | 无 |
| RLT_05 + RLT_06 | RLT_05 | 合并 | heavy 5+5 → 5；两组机器验收仍分组复核 | 无 |
| RLT_07 | RLT_07 | 保留 | heavy 5 → 5 | 无 |
| RLT_08 | RLT_08 | 保留 | normal 3 → 3 | 无 |
| RLT_10 | RLT_10 | 保留 | normal 3 → 3 | 无 |
| RLT_20 | RLT_12 首步 | 取消独立卡、并入 | normal 3 → 纳入 RLT_12 的 normal 3；A32 仍受需求方向复核 | 无 |
| RLT_12 | RLT_12 | 保留并承接 A32 | normal 3 → 3 | H1/H5/H10/H13/H14 均保留原卡内独立证据 |
| RLT_11 | RLT_11 | 保留 | light 2 → 2 | 无 |
| RLT_13 | RLT_13 | 保留 | normal 3 → 3 | H2/H7 独立 |
| RLT_09 | RLT_09 | 保留 | heavy 5 → 5 | 无 |
| RLT_14 | RLT_14 | 保留 | normal 3 → 3 | H6 独立 |
| RLT_15 | RLT_15 | 保留 | normal 3 → 3 | H15 独立 |
| RLT_16 | RLT_16 | 保留 | heavy 5 → 5 | H16 独立 |
| RLT_19 | RLT_19 | 保留 | heavy 5 → 5 | H17 独立 |
| RLT_17 | RLT_17 | 保留 | normal 3 → 3 | H3/H4 分别取证 |
| RLT_18 | RLT_18 | 保留 | heavy 5 → 5 | H11/H12 独立 |

## 4. 新任务表

### 4.1 索引

<!-- dh:tasks -->

| 任务 ID | 一句话 | 档位（轻/标准） | 状态 | 批次 | 依赖 | 工作区 | 验收时间 / verify SHA | 备注 |
|---|---|---|---|---|---|---|---|---|
| RLT_01 | 建立仓内 skill 单源与全量同步安装器 | 标准 | 未开始 | 1 | — | — | — | normal；临时 home 测试，A124 |
| RLT_02 | 对照 relay-light 与现役 Runner 四类核心语义 | 轻 | 进行中 | 1 | — | [workspace/RLT_02](../../workspace/RLT_02/) | — | light；只读、保持在途边界 |
| RLT_03 | 计划解析/lint 与纯追加账本/状态机 | 标准 | 未开始 | 1 | RLT_02 | — | — | heavy；合并原 03/04 |
| RLT_05 | status/生命周期与配置/Recipe/止损 | 标准 | 未开始 | 1 | RLT_03 | — | — | heavy；合并原 05/06，含两 toml |
| RLT_07 | 仓内 skill 核心、adapter 与五阶段模板 | 标准 | 未开始 | 1 | RLT_01、RLT_02、RLT_05 | — | — | heavy |
| RLT_08 | AGENTS 判定、协议索引与双模块身份 | 标准 | 未开始 | 1 | RLT_07 | — | — | normal；§14 第 2/3/7 项 |
| RLT_10 | unittest、薄壳与仓库全量测试入口 | 标准 | 未开始 | 1 | RLT_03、RLT_05、RLT_07 | — | — | normal；RLT_12 准入门 |
| RLT_12 | 首次同步后 Windows Claude 首个真计划 demo | 标准 | 未开始 | 1 | RLT_03、RLT_05、RLT_07、RLT_08、RLT_10 | — | — | normal、高危；首步承接 A32，**首个 demo** |
| RLT_11 | 持久化退场核对与教训回流 | 轻 | 未开始 | 2 | RLT_07、RLT_12 | — | — | light；A13 |
| RLT_13 | Windows Codex 与纯配置换协作 | 标准 | 未开始 | 2 | RLT_12 | — | — | normal |
| RLT_09 | 运行中追加改计划与白名单守门 | 标准 | 未开始 | 3 | RLT_03、RLT_05、RLT_07 | — | — | heavy；机制卡，正式允许路径不变 |
| RLT_14 | blocked/decider 的 auto 与 consult 两路实跑 | 标准 | 未开始 | 3 | RLT_12 | — | — | normal；H6 独立 |
| RLT_15 | 返工超限与 strategist 人闸实跑 | 标准 | 未开始 | 3 | RLT_05、RLT_12 | — | — | normal；H15 独立 |
| RLT_16 | 卡内追加节点的运行中改计划实跑 | 标准 | 未开始 | 3 | RLT_09、RLT_12、RLT_14 | — | — | heavy、高危；H16，正式允许路径不变 |
| RLT_19 | 新增任务卡并追加阶段的实跑 | 标准 | 未开始 | 3 | RLT_09、RLT_12、RLT_16 | — | — | heavy、高危；H17，正式允许路径不变 |
| RLT_17 | ThinkPad Linux 双主控取证账与实跑 | 标准 | 未开始 | 4 | RLT_10、RLT_13、RLT_19 | — | — | normal、高危；H3/H4 均保留 |
| RLT_18 | watch 通知与兜底 | 标准 | 未开始 | 5 | RLT_05、RLT_07、RLT_13、RLT_17 | — | — | heavy、高危；保持独立 |

**RLT_16 对 RLT_14 的依赖依据**：RLT_16 的场景以“施工 `blocked` → decider 提出需要改计划”开头；该 blocked→decider 链正由 RLT_14 验证。未先跑通该链，RLT_16 失败时不能定位是改计划机制还是决策链，因此保留此依赖。

**复核路径自查**：`RLT_01 3 + RLT_02 2 + RLT_03 5 + RLT_05 5 + RLT_07 5 + RLT_08 3 + RLT_10 3 + RLT_12 3 + RLT_11 2 + RLT_13 3 + RLT_09 5 + RLT_14 3 + RLT_15 3 + RLT_16 5 + RLT_19 5 + RLT_17 3 + RLT_18 5 = 63`；现状 76 → 候选 63。

### 4.2 新批次与 demo

| 批次 | 任务 | 批末可演示结果 | 开批条件 |
|---|---|---|---|
| 1 | RLT_01、RLT_02、RLT_03、RLT_05、RLT_07、RLT_08、RLT_10、RLT_12 | 首次 `--all` 后，Windows Claude 主控跑完 W→C→R→F 真计划；全量 runner 已登记并绿 | 本 B-adjust 需确认；RLT_12 的高危开工另取用户确认，且准入证据为 RLT_10 验收 + 全量 runner 绿 |
| 2 | RLT_11、RLT_13 | 同一核心换 Windows Codex；完成退场合同与三条教训回流 | RLT_12 已验收 |
| 3 | RLT_09、RLT_14、RLT_15、RLT_16、RLT_19 | 两类异常决策和两类运行中改计划按原场景独立演示 | **RLT_12 的 H1、H13 已由用户判为值得继续**；各高危实跑另取确认 |
| 4 | RLT_17 | ThinkPad Claude/Codex 两组合与两机同步证据完成 | RLT_10、RLT_13、RLT_19 已验收，用户设备/取证窗口可用 |
| 5 | RLT_18 | watch 忙时推送、重挂、tick、死亡兜底可演示 | 前四批全部验收 |

**首个端到端 demo**：第 1 批 `RLT_12`。demo 的可跑证据不等于局部 unittest 绿：启动真计划前必须已有 RLT_10 的 A11/A16/A80/A94 验收和 `run-relay-tests.ps1` 全量绿。依赖仅指向前置卡，无环。

## 5. §14 同步项承接

| §14 项 | 承接任务 | 落法 |
|---|---|---|
| 1. skill 单源与全量同步 | RLT_01、RLT_12、RLT_17 | RLT_01 做单源/安装器与 A124；RLT_12 首次 `--all` 承接 A32；RLT_17 两机四目录承接 A125 |
| 2. AGENTS 编排协议段 | RLT_08 | 新增 relay-light 判定段，现役 Runner 标冻结流水 |
| 3. AGENTS 模块身份 | RLT_08 | 双模块描述、slug、路径、scope 与 `dh relay-light` 索引 |
| 4. 与现役 Runner 一致性对照 | RLT_02 | 单独只读成卡，节点/角色/事件/关闭逐条裁决 |
| 5. 三条教训候选回流 | RLT_11 | 首个 demo 后逐条回链 §15 来源 |
| 6. planner-amend 提示词与白名单 | RLT_09（机制）、RLT_07（模板）、RLT_16/RLT_19（各自实跑） | 输入四件、一次改完、lint、禁区整份不落笔、精确路径白名单 |
| 7. 有意绕过 B-adjust 写入 AGENTS | RLT_08 | 只限 relay-light 运行中白名单改计划；design/验收不绕 |

## 6. 验收 ID → 新卡对照（正好一次）

| 验收 ID | 新卡 | 验收 ID | 新卡 |
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
| HC-RL-A64 | RLT_03 | HC-RL-A65 | RLT_05 |
| HC-RL-A66 | RLT_07 | HC-RL-A67 | RLT_07 |
| HC-RL-A68 | RLT_03 | HC-RL-A69 | RLT_03 |
| HC-RL-A70 | RLT_03 | HC-RL-A71 | RLT_03 |
| HC-RL-A72 | RLT_03 | HC-RL-A73 | RLT_03 |
| HC-RL-A74 | RLT_03 | HC-RL-A75 | RLT_03 |
| HC-RL-A77 | RLT_03 | HC-RL-A78 | RLT_03 |
| HC-RL-A80 | RLT_10 | HC-RL-A81 | RLT_05 |
| HC-RL-A82 | RLT_18 | HC-RL-A83 | RLT_18 |
| HC-RL-A84 | RLT_03 | HC-RL-A85 | RLT_05 |
| HC-RL-A86 | RLT_03 | HC-RL-A87 | RLT_03 |
| HC-RL-A88 | RLT_03 | HC-RL-A89 | RLT_05 |
| HC-RL-A90 | RLT_03 | HC-RL-A91 | RLT_05 |
| HC-RL-A92 | RLT_05 | HC-RL-A93 | RLT_05 |
| HC-RL-A94 | RLT_10 | HC-RL-A95 | RLT_07 |
| HC-RL-A96 | RLT_07 | HC-RL-A97 | RLT_05 |
| HC-RL-A98 | RLT_07 | HC-RL-A99 | RLT_05 |
| HC-RL-A100 | RLT_07 | HC-RL-A101 | RLT_18 |
| HC-RL-A102 | RLT_07 | HC-RL-A103 | RLT_07 |
| HC-RL-A104 | RLT_03 | HC-RL-A105 | RLT_05 |
| HC-RL-A106 | RLT_05 | HC-RL-A107 | RLT_05 |
| HC-RL-A108 | RLT_05 | HC-RL-A109 | RLT_03 |
| HC-RL-A110 | RLT_05 | HC-RL-A111 | RLT_05 |
| HC-RL-A112 | RLT_05 | HC-RL-A113 | RLT_07 |
| HC-RL-A114 | RLT_07 | HC-RL-A115 | RLT_05 |
| HC-RL-A116 | RLT_05 | HC-RL-A117 | RLT_05 |
| HC-RL-A118 | RLT_05 | HC-RL-A119 | RLT_09 |
| HC-RL-A120 | RLT_09 | HC-RL-A121 | RLT_09 |
| HC-RL-A122 | RLT_09 | HC-RL-A123 | RLT_09 |
| HC-RL-A124 | RLT_01 | HC-RL-A125 | RLT_17 |
| HC-RL-H1 | RLT_12 | HC-RL-H2 | RLT_13 |
| HC-RL-H3 | RLT_17 | HC-RL-H4 | RLT_17 |
| HC-RL-H5 | RLT_12 | HC-RL-H6 | RLT_14 |
| HC-RL-H7 | RLT_13 | HC-RL-H10 | RLT_12 |
| HC-RL-H11 | RLT_18 | HC-RL-H12 | RLT_18 |
| HC-RL-H13 | RLT_12 | HC-RL-H14 | RLT_12 |
| HC-RL-H15 | RLT_15 | HC-RL-H16 | RLT_16 |
| HC-RL-H17 | RLT_19 |  |  |

**计数自查**：正式输入活动集合为 106 个 `HC-RL-A*` 与 15 个 `HC-RL-H*`。上表 53 行双列加末行单列 = **121 个 ID**；按 ID 去重为 **121**，缺失 **0**、重复 **0**。退役 ID 不进入本表，也不复用。

## 7. 不采纳项

1. **不采纳将 RLT_16 与 RLT_19 合并**。理由：H16/H17 的用户判断、允许路径、高危授权和监工/Builder 时序不同；默认不推翻 2026-09-09 已确认的按场景切卡裁决。
2. **不采纳将 RLT_14 与 RLT_15 合并或降为 light**。理由：H6/H15 是不同用户判断，且 light 不含需求方向复核。
3. **不采纳四合一 RLT_03~RLT_06**。理由：二合一后仍保留可独立证明的写入合同与状态/Recipe 合同，避免把 60 余机器验收压入不可审的单一签收单元。
4. **不采纳 Linux Codex 的 H4 改为可选**。理由：H4 是正式输入 §11 活动验收，Windows RLT_13 不可替代 Linux Codex。
5. **不采纳合并 RLT_18 或 RLT_02**。理由：watch 是独立风险面；§14 第 4 项要求 RLT_02 独立只读，且它正在进行中。

## 8. 需用户决定

1. **是否明确推翻已确认的“按用户能一次判断的场景切卡”裁决，以换取 v1 的 12 卡？默认：不推翻。** 若选择推翻，须逐项明确确认：
   - H16/H17 是否允许同一签收；
   - H6/H15 是否允许没有需求方向复核；
   - 每个真实目录写入是否仍须逐次单独授权。
2. **首个真实 demo 是否必须在仓库全量测试入口已登记并通过后才允许开始？默认：必须。** 若选择“可以先 demo”，即接受未登记 suite 的回归盲区；须在依赖表和 RLT_12 准入证据中明确改为该风险选择，不能仅以局部 unittest 绿替代。

## 9. 需回 A 项

**无。** 本候选不删减、改号或改变任何正式验收，也不改变设计冻结的功能、watch 分期或 H4 义务；所有调整均是开发方案内的拆分、合并、依赖与档位候选。若用户决定删除 H4 或变更验收内容，应另开 A 调整。

## 10. 备注

- 本稿是 B-adjust 候选，用户确认前不得以其替换正式方案、改变 RLT_02 状态、创建新 worktree 或启动任何新卡。
- RLT_12、RLT_16、RLT_19、RLT_17、RLT_18 的真实用户目录写入仍须各自在开工前展示绝对路径并取得确认；一次已知路径确认不覆盖未知后续目标。
- RLT_09、RLT_16、RLT_19 的验收归属、允许路径与高危边界以正式方案原样为准；本稿仅增加第 3 批 H1/H13“值得继续”开批门。
