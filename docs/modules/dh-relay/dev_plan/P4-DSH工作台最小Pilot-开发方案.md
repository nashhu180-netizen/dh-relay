# P4-DSH 优先的多控制面最小 Pilot 开发方案

<!-- dh:plan-type: 开发 -->
<!-- dh:planning-event:v1 id=DHR-B-04 stage=B-adjust artifact=dev_plan/P4-DSH工作台最小Pilot-开发方案.md review=../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b04 understanding=../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#understanding-b04 -->
<!-- dh:status
汇报: P4 已按 design/06 重写为「CLI 必备控制面轨必过 + DSH 桌面控制面轨可判否」的双轨 Pilot；claude-grok fresh 审核（有条件通过）已按裁决调整，用户 2026-08-18 整版确认；尚未授权任何卡开工
现状: DHR_25~27 均未开始；本计划处于 B-调整后待审核
进行到: P4 ▸ B 已确认（2026-08-18），无卡开工
下一步: 用户决定是否授权 DHR_25 开工（开工闸另确认落点 <experiment-root>）
看什么: design/05、design/06、design/evidence/07、design/evidence/08、dev_plan/README.md
阻塞: 无前置阶段；存在 B 审核确认闸与开工确认闸
-->

> 文件名沿用首次落盘时的「DSH工作台最小Pilot」，标题与责任已按 design/06 更新为多控制面 Pilot；是否改名统一放 P9 处置，避免链接噪声。

## 0. B 方案审核与理解确认

### 0.1 白话说明：这个阶段做啥、解决啥、做完得到啥

- **要解决的问题**：以后你指挥 AI 干活的「控制台」长啥样，现在只是嘴上说「命令行和 DSH 桌面工作台并行、可配置替换」，没人验证过。P4 用 2~3 天做个小实验把这件事验证清楚，免得 P5~P9 押错方向。

| 任务 | 用大白话说在做啥 | 解决什么问题 |
|---|---|---|
| DHR_25 | 先定一份「任务状态说明书」的统一格式（哪个任务、跑到哪一步、卡在哪、等谁处理），写一个最简单的命令行小工具，在 Windows 终端和远程 SSH 到 Linux 笔记本上都能把同一份数据打印出来 | 证明命令行这条必备控制面独立成立、不依赖 DSH（只到「读同一份 fixture」这一层，不是 Runtime 级证明） |
| DHR_26 | 给 DSH 装一个外挂插件（不改 DSH 自身代码），在 DSH 里弄一个小面板，显示的还是 DHR_25 那份一模一样的数据 | 证明 DSH 这条桌面控制面也成立：插件能装、卸得干净、不必魔改上游；做不出来允许诚实判否（三态之一），判否不阻断 P5 |
| DHR_27 | 拿一条你以前跑过的真实历史任务，只读不改地投进统一格式，让命令行和 DSH 面板同时显示、对比一致，然后写 Pilot 报告 | 证明 CLI（以及 DSH 若通过）看的是同一份真相；给 P5 一个明确裁决。DSH 判否时本阶段只交付 CLI 一条控制面，跨客户端一致性留到 P5 用 DSH Bridge / 其他客户端再证 |

- **完成后你手里有什么**：
  1. 一份冻结的 Pilot 版「状态说明书」格式（Read Model v1）与正反样例，作为 P5 协议设计的输入（P5 仍可能调整，不是最终合同）。
  2. 一个能用的命令行工具，Windows 本机和远程 SSH 都能看进度。
  3. DSH 能不能用、值不值得当 Windows 日常工作台的三选一结论（能 / 能但有限制 / 不行）。
  4. 一份带截图和实耗的 Pilot 报告，由你拍板四件事：命令行+SSH 够不够作为独立控制面？DSH 值不值得日常用？DSH 不行的话 P5 默认控制面是纯命令行还是预定补 Pi 终端界面？这套体验值不值得继续往下建？（Pi 探索属 P4-X 可选项，不是标配产出）

### 0.2 审核与确认记录

- **事件类型**：B-新建（2026-08-18 从 design/05 阶段主线拆出首份落盘）+ 同日 B-调整（按 design/06 把 DSH 从「唯一工作台」改为「可判否的桌面控制面轨」，新增 CLI/SSH 必备控制面轨）。两次修订均在同一未确认事件内，任务数、依赖未变，验收契约收紧。
- **审核记录**：已做——2026-08-18 claude-grok（fresh、只读、`--model grok-4.5`）深审，结论「有条件通过」（3 P0 / 6 P1 / 3 P2）；原文与只读形态见 [evidence/09 §3](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b04)。独立于 A 阶段对 design/05、design/06 的审核。
- **主会话裁决**：已做——逐条采纳 / 待用户决定见 [evidence/09 §2 裁决总表](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#2-主会话裁决总表2026-08-18)；已采纳项已回写本计划正文，「待用户决定」项在正文显式标注。
- **讲解记录**：待补——按四层（全局地图 → 契约 → 运作机制 → 代码按需）向用户讲清：Read Model 从哪来、存在哪、CLI 与 DSH 各自承诺什么、如何验证一致、DSH 判否时怎么处置。
- **理解问题**：待补（至少一个非「是否确认」的场景/取舍问题，一次一问；候选：「DSH 桌面控制面轨判否时，你希望 P5 默认控制面是纯 CLI 还是先加 Pi TUI？」）。
- **用户回答 / 解释**：待补。
- **调整与复审**：待补（实质调整须定向复审）。
- **用户确认**：已确认——2026-08-18 用户对话「P4确认，提交和推送」（见 [evidence/09 §4](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#understanding-b04)）。B-04 事件闭合。**DHR_25~27 仍未授权开工**：每张卡开工前仍按 DevHarness 入口闸单独分流、确认落点与范围。

## 1. 概述

- **交付什么 / 不含什么**：
  - 交付：①客户端中立的 `relay.pilot-read-model/v1` fixture 与 schema；②一次性 Relay Pilot CLI（文本 + JSON 输出）；③Windows 终端渲染 fake run 与冻结的 v1 历史 run；Linux SSH 会话渲染同一 fake fixture（条件允许时同时读取复制到 testdata 的 v1 fixture）；④树外 DSH Host Plugin + Client Plugin 最小 Relay 面板（构建链触发止损时诚实判否）；⑤CLI 与 DSH 对同一 Read Model 的一致性报告；⑥可选 DSH Native Agent 棒 0 Proposal 试验（不阻断 P5）；⑦Pilot 报告，给出 DSH 继续 / 调整 / 退出与 P5 默认控制面。
  - 不含：relay/v2 完整协议、Detached Relay Runtime、Workflow Contract / Executor Profile 正式实现、Herdr Adapter、DevHarness S0~E13、Named Pipe / Unix Domain Socket、正式 Pi Extension、完整工作台首页 / 项目管理 / 流程编辑器、agent-console 迁移或删除。
- **承接设计**（拆计划输入 = `design/README.md` 白名单）：
  - [多控制面、Headless 与 SSH 运行：设计补充](../design/06-多控制面与Headless-SSH运行-设计补充.md) · §10「阶段计划调整 · P4」是本阶段的直接设计依据（「同一 fake/v1 Read Model 可由通用 CLI 在 Windows 和 SSH 终端读取；DSH 是并行的首选 UI Pilot」）。**本阶段不承接「验收命题」节任何全称命题**：H1（Runtime 无 DSH 可运行）、H4（断开不取消 Run）、H9（Linux 仅 SSH 可跑 Runtime/CLI/Herdr/工作流）都以 Runtime 存在为前提，P4 没有 Runtime，只做 fixture 级铺垫，全称由 P5 / P6 / P9 承接；H3（DSH/Pi/CLI 读同一 Read Model）在 P4 只能于 DSH 通过时由 DHR_27 证明其 CLI↔DSH 子集。
  - [DeepSeek Harness 插件化与专属工作台](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md) · §5 DSH 插件形态、§14 专属工作台产品面、§15 阶段交付主线、§18 风险和停止条件（05 未编验收 ID，按节回链）。
  - 参考（**非拆计划输入**，只作裁决背景）：[evidence/07 阶段计划评估](../design/evidence/07-P4至P8阶段计划评估与pi替代评估-待第三方评估.md)、[evidence/08 Pi 对比评估](../design/evidence/08-Pi-Agent替代DSH-独立对比评估.md)。
- **实施策略一句话**：仓外一次性实验，先用普通终端 + SSH 证明「同一 Read Model 不靠 DSH 也能看」，再叠加 DSH 树外插件验证增强体验，用双轨隔离避免 DSH 单点失败拖垮 Relay 主线判断。
- **任务前缀 / 模块 slug**：`DHR_` / `dh-relay`（verify scope=`dh-relay`）。
- **批次**：批次 1=`DHR_25`（必备控制面轨，得到跨终端一致的只读投影）；批次 2=`DHR_26 → DHR_27`（桌面控制面轨 + 对证与裁决，第一个端到端 demo 在 DHR_27）。工作量不设硬预算（用户 2026-08-18 拍板「工作量不重要」）：只如实记录——DHR_25 记录实际开工时间，DHR_27 报告真实耗时；DSH 探路的止损只看 §4.4 的事实条件，不按天数。

## 2. 工程切分

### 2.1 实现单元

| 单元 | 职责 | 入口 / 主要文件 | 关联任务 |
|---|---|---|---|
| read-model | `relay.pilot-read-model/v1` schema、fake fixture、v1 → Read Model 投影 | `<experiment-root>/relay-control-pilot/src/read-model/`、`testdata/fake/`、`testdata/v1/` | DHR_25 / DHR_27 |
| pilot-cli | 一次性 CLI，text / json 两种渲染，只消费 Read Model | `src/cli/` | DHR_25 |
| dsh-host | 树外 Host Plugin，暴露 `ctx.relayPilot` 服务，只传普通 JSON | `src/dsh-host/` | DHR_26 |
| dsh-client | 树外 Client Plugin + 最小 Relay 面板；可复现构建配方 | `src/dsh-client/` | DHR_26 |
| pilot-evidence | 截图 / 终端转录、fixture hash、一致性对证、Pilot 报告 | `evidence/` + `docs/modules/dh-relay/design/evidence/10-P4-多控制面Pilot报告.md`（09 号已被交叉审核记录占用） | DHR_27 |

### 2.2 复用与禁改边界

| 路径 | 禁改 / 扩展 / 新建 | 说明 |
|---|---|---|
| `<experiment-root>/relay-control-pilot/`（dh-relay 仓外） | 新建 | Pilot 全部代码落此；一次性验证客户端，不锁定 P5 Runtime 语言与正式命令。**`<experiment-root>` 具体路径待决策**，DHR_25 开工闸确认落点时由用户给定 |
| `<experiment-root>/dsh-home/` | 新建 | DSH 独立 Home，与用户日常 DSH 配置隔离 |
| DeepSeek Harness 上游源码 | 禁改 | 只允许树外插件；出现「必须改上游 / 只能在 monorepo 内构建」即触发止损 |
| `.dh-runtime/relay/`（v1 现场） | 只读 | 先复制成冻结 fixture；活现场只做一次零写入演示 |
| `docs/modules/dh-relay/`（除 evidence/10 Pilot 报告与本计划回填） | 禁改 | Pilot 不改 DevPlan、workspace、design 契约 |
| `tools/`（现役 P1 代码） | 禁改 | 本阶段不动生产代码 |

### 2.3 阶段专属约束

- **Read Model 最小字段**（DHR_25 冻结）：`run_id / source_kind / workflow_name / run_status / nodes[] / attentions[] / updated_at / source_refs[]`。DSH RC 私有类型不得进入 Read Model。
- **DSH 桌面控制面轨终态枚举**：`passed / passed-with-constraints / stopped-by-pilot`；`stopped-by-pilot` 必须写清阻塞事实，不包装为通过。
- **棒 0 Proposal**（DHR_27 可选）只允许含：任务摘要 / 候选节点 / 建议执行角色 / 依赖 / 未决问题；不得写 Relay state、业务仓工件或执行命令。
- Pi TUI 只作候选控制面登记，本阶段不建正式 Pi Extension。

## 3. 任务表

### 3.1 索引

<!-- dh:tasks -->

| 任务 ID | 一句话 | 档位（轻/标准） | 状态 | 依赖 | 工作区 | 验收时间 / verify SHA | 备注 |
|---|---|---|---|---|---|---|---|
| DHR_25 | 冻结客户端中立 Read Model、fixture 与 Windows/SSH CLI 必备控制面 | 轻 | 未开始 | - | <开工时回填 workspace/…> | | 必备控制面轨；开工前需用户对话确认；轻档 + 人判签收（用户 2026-08-18 拍板） |
| DHR_26 | 验证树外 DSH Host/Client Plugin 并渲染同一 Read Model | 标准 | 未开始 | DHR_25 | <开工时回填 workspace/…> | | 桌面控制面轨；允许 `stopped-by-pilot` 终态 |
| DHR_27 | 接 v1 只读投影、做跨客户端对证并完成 Pilot 裁决 | 标准 | 未开始 | DHR_26（通过或已落判否证据） | <开工时回填 workspace/…> | | 端到端 demo + P4 报告 |

> 状态列只填「未开始 / 进行中 / 待验收 / 已完成 / 已取消」，阶段闸与前置说明一律进「备注」列。工作区列开工时回填；验收时间 / verify SHA 收口销户时回填。

### 3.2 任务卡

#### DHR_25

- **目标**：冻结 fake run 与 v1 run 的最小统一查询结构（Read Model v1，最小字段见 §2.3），做出一个 text/json 双输出的一次性 CLI，在 Windows 普通终端与 Linux SSH 会话里对同一 fake fixture 渲染出语义相同的结果，证明「看状态」不依赖 DSH。
- **非目标**：不实现 Relay Runtime、不做 v2 协议、不锁定 P5 的实现语言与正式命令；不做 v1 活现场投影（归 DHR_27）；不做任何写入。
- **验收口径**：
  - **机器证**：[design/06 §10 P4](../design/06-多控制面与Headless-SSH运行-设计补充.md#10-阶段计划调整) · 本计划 P4-CM1/CM2：Windows 与 Linux SSH 对同一 fixture 输出规范化后相同的 JSON；文本输出只经唯一 render 函数从 Read Model 生成，测试断言 render 不读取 fixture 之外的旁路字段、不含第二套状态推导。（不承接 H3 全称；CLI↔DSH 一致性归 DHR_27）
  - **机器证**：[design/06 §10 P4](../design/06-多控制面与Headless-SSH运行-设计补充.md#10-阶段计划调整) · P4-CM5：DSH 完全不启动时本卡全部产出可完成。（fixture 级，不是 H1 的 Runtime 级证明）
  - **机器证**：SSH 会话断开、重连后 fixture 内容与 hash 不变，远端无新增持久文件。（只证明本 Pilot 无副作用，不承接 H4「不取消 Run」）
  - **机器证**：健壮性与安全——未知字段、损坏 fixture、非法状态给出明确错误；testdata 零凭据、零本机敏感路径（承接 AGENTS 宪章#6）。
  - **机器证**：记录 OS / Shell / Node 或临时运行依赖版本，但只作证据，不写成 Runtime 决策。
  - **人判**：Read Model v1 的最小字段（§2.3）是否足以作为 P5 协议设计的起点——向用户展示 fake / v1 两份 fixture 与字段说明，用户对话确认后 schema 才进入 P5 输入。
- **变更范围**：`<experiment-root>/relay-control-pilot/src/read-model/`、`src/cli/`、`testdata/fake/`；本卡 `workspace/DHR_25/`。
- **档位**：轻 + 人判签收（用户 2026-08-18 拍板）：仓外一次性只读验证，不接线、不动生产代码；因本卡冻结的 Read Model 会作为 P5 协议输入，收口前增加人判项「最小字段是否够 P5 沿用」，由用户在对话里确认后才把 schema 交给 P5；开工仍需用户对话确认。
- **实施提示**：CLI 与后续所有客户端只渲染、不推导状态；fixture 先于 CLI 冻结；Read Model schema 与正反 fixture 作为 P5 协议设计的输入（P5 可改），CLI 本身不进。

#### DHR_26

- **目标**：以树外方式给 DSH 装上最小 `ctx.relayPilot` Host Service 与一个 Client 面板，面板渲染 DHR_25 的同一 fake Read Model，并找到可复现的树外 Client Bundle 构建配方，证明 DSH 能作为增强工作台而不需 fork 上游。
- **非目标**：不做完整工作台首页 / 项目管理 / 流程编辑器；不做 v1 投影；不接 Relay 运行写权；不修改 DSH 上游源码。
- **验收口径**：
  - **机器证**：[design/05 §5 DSH 插件形态](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#5-dsh-插件形态) · P4-DM1/DM2：不修改 DSH 上游仓库即可加载 Host Plugin；Client Plugin 用可重复构建产物加载。
  - **机器证**：[design/06 H3 子集](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)（仅「DSH 读同一 Read Model」这一子命题）· P4-DM3/DM5：面板从统一 Read Model 重建；浏览器刷新与 DSH 重启后从 fixture 重建相同页面；Host/Client 只传普通 JSON，不传 Cordis 活动对象，DSH RC 私有类型不进 Read Model。
  - **机器证**：P4-DM4：Bundle 可安装 / 卸载（上游有显式启用 / 禁用机制则一并验证）；卸载后服务、事件、UI 注册得到清理。
  - **机器证**：终态登记为 `passed / passed-with-constraints / stopped-by-pilot` 之一；`stopped-by-pilot` 必须附止损条件命中的事实（见 §4.4）。
- **变更范围**：`src/dsh-host/`、`src/dsh-client/`、`<experiment-root>/dsh-home/`；本卡 `workspace/DHR_26/`。
- **档位**：标准（组件接线：DSH 插件生命周期 + 独立 Home，需两轮复核与需求境截图）。
- **实施提示**：DSH 用独立 Home 隔离；命中 §4.4 任一止损条件即停止扩张、诚实收口为判否，不为「做出来」硬拗；判否不阻断 DHR_27。

#### DHR_27

- **目标**：把冻结的 v1 fixture 与一条活 v1 历史现场（零写入）投影为统一 Read Model，比较 CLI 与 DSH（若通过）对同一 Read Model 的节点 / 状态 / Attention 是否一致，形成 P4 报告并给出 P5 默认控制面与增强控制面的裁决；条件允许时顺带验证 DSH Native Agent 棒 0 Proposal。
- **非目标**：不 resume 任何 v1 run；不创建 v2 Run；不改业务仓 DevPlan / workspace；棒 0 Proposal 做不成只记未验证，不阻断 P5。
- **验收口径**：
  - **机器证**：[design/06 §10 P4](../design/06-多控制面与Headless-SSH运行-设计补充.md#10-阶段计划调整) · P4-CM3：冻结 v1 fixture 与活 v1 现场只读投影成功，源文件零写入（前后 hash 对证）。
  - **机器证**：[design/06 H3 子集](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)（CLI↔DSH）· P4-CM4：DSH 通过时，CLI 与 DSH 面板对同一 Read Model 的节点 / 状态 / Attention 字段级一致；DSH 判否时 CM4 记 `N/A（无第二客户端）`，**不计入「CM 全绿」**，跨客户端一致性延后到 P5（DSH Bridge / 其他客户端）再证。
  - **机器证**：P4-CM6：全程不引入 Relay 运行写权、不 fork DSH。
  - **机器证**：[design/02 B1 子集](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)（只取「legacy 根只读、零新写」子命题，B1 全项不在 P4 关闭）：`.dh-runtime/relay/` 零新写。
  - **机器证**（可选 P4-X）：DSH Native Agent 读取冻结输入并输出非权威 `plan-proposal` fixture，内容仅限 §2.3 允许字段；未做则登记「未验证」。
  - **人判**：[design/05 §14 专属工作台产品面](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#14-专属工作台产品面) · P4-H1~H4：向用户展示真实截图 / 终端转录、fixture hash、CLI 输出、DSH 结果、版本与实耗；用户判断 ①CLI+SSH 是否足以作为一条独立、正式的控制面（与 DSH 并行、可配置替换，不是保底） ②DSH 页面若通过是否值得成 Windows 日常首选 ③DSH 判否时选 CLI-first 还是 P5 后加 Pi TUI ④当前体验是否值得继续建 Relay Runtime。
- **变更范围**：`src/read-model/`（v1 投影）、`testdata/v1/`、`evidence/`、`docs/modules/dh-relay/design/evidence/10-P4-多控制面Pilot报告.md`；本卡 `workspace/DHR_27/`。
- **档位**：标准（触碰 v1 真实现场 + 人判裁决）。
- **实施提示**：v1 活现场只做一次只读演示，主输入是冻结 fixture；报告必须同时给出 P4-CM / P4-DM / P4-X 三组结论，DM 判否不得抹平 CM 通过，CM 失败也不得被 DM 通过掩盖。

### 3.3 标准档共同收口条件

每张标准卡进入「待验收」前必须：两轮独立换人复核（轮 1 全面排查，轮 2 fresh-context 对抗）；有需求境证据——DHR_26 的面板、DHR_27 的对证必须有真实截图 / 终端转录，单测不能替代；`dh dh-relay` 与本卡证据命令可复跑；P0/P1 清零；只停在待人验，用户对话确认后才 `verify(dh-relay):` 收口。DHR_25 为轻档，AI 自评 + 用户口头确认可关闭。

## 4. P4 阶段闸

### 4.1 必备控制面机器闸 P4-CM（CM1/2/3/5/6 全部通过才证明 CLI 控制面独立成立、不依赖 DSH；CM4 见二分规则）

| ID | 命题 | 承接卡 |
|---|---|---|
| P4-CM1 | 同一 fake Read Model 可由 Windows CLI 渲染文本和 JSON | DHR_25 |
| P4-CM2 | 同一 fake fixture 可在 Linux SSH 终端读取，JSON 语义一致 | DHR_25 |
| P4-CM3 | 冻结 v1 fixture 与活 v1 现场只读投影成功，源文件零写入 | DHR_27 |
| P4-CM4 | DSH 通过时：CLI 与 DSH 对同一 Read Model 字段级一致；DSH 判否时：记 N/A，不计入 CM 全绿，延后 P5 | DHR_27 |
| P4-CM5 | DSH 完全不启动时，P4 必备控制面轨仍可完成 | DHR_25 |
| P4-CM6 | 全程不引入 Relay 运行写权，不 fork DSH | DHR_27 |

### 4.2 DSH 桌面控制面轨 P4-DM（决定 DSH 是否成为 Windows 首选桌面控制面，不是 P5 生死闸）

| ID | 命题 | 承接卡 |
|---|---|---|
| P4-DM1 | Windows 上树外 Host Plugin 可加载 | DHR_26 |
| P4-DM2 | 树外 Client Bundle 有可重复构建配方并可加载 | DHR_26 |
| P4-DM3 | 最小面板可从统一 Read Model 重建 | DHR_26 |
| P4-DM4 | 安装、卸载和资源清理有证据 | DHR_26 |
| P4-DM5 | DSH RC 私有类型没有进入 Read Model | DHR_26 |

### 4.3 非阻塞探索 P4-X 与人类闸 P4-H

- **P4-X**（失败不阻断 P5，只进报告）：DSH Native Agent 棒 0 Proposal；Pi TUI 读取同一 JSON；外部页面视觉质量。
- **P4-H**（用户判断，见 DHR_27 人判项）：CLI+SSH 是否足以作为与 DSH 并行、可配置替换的独立正式控制面；DSH 页面是否值得成 Windows 日常首选；DSH 判否时选 CLI-first 或 Pi TUI；是否值得继续建 Relay Runtime。

### 4.4 风险与止损

命中任一即停止 DSH 桌面控制面轨扩张、进入裁决：Client Bundle 只能在 DSH monorepo checkout 内构建（变相 fork）；Windows 下 Profile 或插件生命周期不稳定；单个最小面板要求大范围导入未公开内部模块；DSH 重启后无法从普通 JSON 重建页面；或用户在对话中明确喊停。不设天数止损（用户拍板工作量不作约束）。

命中任一则 P4 整体不能通过：通用 CLI 无法在 DSH 不启动时读取统一 Read Model；Windows 与 Linux SSH 对同一 fixture 得到冲突状态；Pilot 对 v1 现场产生写入；CLI 与 DSH 各自实现一套状态判断。

### 4.5 解锁 P5 的规则

P4-CM1/2/3/5/6 全部通过 ∧ P4-CM4 为「通过」或「N/A（DSH 判否）」且已如实登记 ∧ DSH 桌面控制面轨已有明确 `passed / passed-with-constraints / stopped-by-pilot` 结论 ∧ 风险与未验证项（含 CM4 N/A 时跨客户端一致性延后 P5）已记录 ∧ 用户在对话中明确同意进入 P5。DSH 判否时 P5 阶段默认控制面为 Relay CLI（这是阶段默认，不是把 CLI 定位为回退），DSH Bridge 转可选或暂停；P5~P9 不因 DSH 不可用整体终止。

## 5. 覆盖、颗粒度与依赖查漏

| 检查 | 结论 |
|---|---|
| 覆盖 | 直接设计依据 design/06 §10「P4」由 DHR_25/27 承接；design/06「验收命题」节全称命题 **一条都不在 P4 关闭**（H1/H4/H9 归 P5/P6/P9；H3 仅 CLI↔DSH 子集在 DSH 通过时由 DHR_27 证明）；design/02 B1 仅 legacy 零写子集；design/05 §5 插件形态由 DHR_26 承接、§14 产品面由 DHR_27 人判承接；P4-CM1~6 / DM1~5 每条至少一张卡；evidence/07、08 未参与拆计划 |
| 颗粒度 | DHR_25=只读投影 + 跨终端一致性验收单元；DHR_26=DSH 插件生命周期验收单元；DHR_27=真实现场 + 对证 + 人判裁决单元；可分别开工与签收 |
| 依赖 | `DHR_25 → DHR_26 → DHR_27` 单链无环；DHR_27 对 DHR_26 的依赖接受「判否证据」作为满足条件，DSH 失败不阻断裁决 |

## 6. 计划完工

- [ ] DHR_25~27 全部销户（状态=已完成 或 已取消并留因）。
- [ ] P4-CM1/2/3/5/6 全部有等价 pass 证据，CM4 为 pass 或如实登记 N/A；P4-DM 三态之一已登记；P4-X 结论已记录。
- [ ] P4 报告 `design/evidence/10-P4-多控制面Pilot报告.md` 落盘：含真实截图 / 终端转录、fixture hash、CLI 输出、DSH 结果、版本、实耗与裁决。
- [ ] P4-H 已向用户展示并由用户在对话中判断；P5 是否解锁由用户明确表态。
- [ ] `dev_plan/README.md` 活跃计划表状态已更新。
