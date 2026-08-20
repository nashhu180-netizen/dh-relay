# P4-DSH 优先的多控制面最小 Pilot 开发方案

<!-- dh:plan-type: 开发 -->
<!-- dh:planning-event:v1 id=DHR-B-11 stage=B-adjust artifact=dev_plan/P4-DSH工作台最小Pilot-开发方案.md review=../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b11 understanding=../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#understanding-b11 -->
<!-- dh:status
汇报: 命令行看真实任务已验收可用（DHR_27 全验收通过，用户判 CLI 够格作独立控制面、值得继续建 Runtime）；桌面版还剩面板一张卡加收尾一张卡
现状: DHR_25 已完成、DHR_26 已 verify（`c90cf88`，任务行回填由桌面轨 session 收尾）、DHR_27 已完成（2026-08-20，verify `252a131`，release_mode=full，H1/H4 均通过）；DHR_49 已开工（并行 session，工作区 workspace/DHR_49/ 已建）；DHR_50 未开始
进行到: P4 ▸ CLI 收口支全部完成；桌面轨 DHR_49 施工中
下一步: P5 解锁条件只剩「用户明确同意进 P5」（§4.5，CM1/2/3/5/6a 全绿 + 主报告已落盘 + CM4 已如实延后登记）；桌面轨 DHR_49→DHR_50 并行推进
看什么: design/evidence/10 P4 主报告（CM 结论 + H1/H4 + DM-deferred-facts 锚点）、workspace/DHR_27/review.md
阻塞: 无
-->

> 文件名沿用首次落盘时的「DSH工作台最小Pilot」，标题与责任已按 design/06 更新为多控制面 Pilot；是否改名统一放 P9 处置，避免链接噪声。

## 0. B 方案审核与理解确认

### 0.1 白话说明：这个阶段做啥、解决啥、做完得到啥

- **要解决的问题**：以后你指挥 AI 干活的「控制台」长啥样，现在只是嘴上说「命令行和 DSH 桌面工作台并行、可配置替换」，没人验证过。P4 用一个不设工期硬闸的小实验把这件事验证清楚，免得 P5~P9 押错方向（工作量不作约束，止损只看事实条件）。

| 任务 | 用大白话说在做啥 | 解决什么问题 |
|---|---|---|
| DHR_25 | 先定一份「任务状态说明书」的统一格式（哪个任务、跑到哪一步、卡在哪、等谁处理），写一个最简单的命令行小工具，在 Windows 终端和远程 SSH 到 Linux 笔记本上都能把同一份数据打印出来 | 证明命令行这条必备控制面独立成立、不依赖 DSH（只到「读同一份 fixture」这一层，不是 Runtime 级证明） |
| DHR_26 | 给 DSH 装一个**后台外挂**（不改 DSH 自身代码），让 DSH 内部能拿到 DHR_25 那份数据；顺手把本机 DSH 从 rc.6 升到 rc.7 并记下升级前后有什么变化 | 证明「不魔改上游就能给 DSH 加东西」这半件事成立，并把树外插件怎么装、怎么卸摸清楚，给下一张卡当施工依据 |
| DHR_49 | 在 DSH 里真的弄出一个小面板，先做**列表屏**（所有接力一览）、再做**详情屏**（一条接力的内部结构），显示的还是 DHR_25 那两份一模一样的数据 | 证明 DSH 这条桌面控制面成立：外挂界面能装、卸得干净、构建配方换台机器也能跑；做不出来允许**诚实停下并交判否事实**（最后是「能用 / 不能用」由你在 DHR_50 拍板，B-11 前为 DHR_27），判否不阻断 P5 |
| DHR_27 | 拿一条你以前跑过的真实历史任务，只读不改地投进统一格式，用命令行显示出来，写 Pilot 主报告（CLI 部分） | 证明 CLI 控制面对真实历史数据也成立，把 P5 需要的裁决材料先交出来；不再等 DSH 面板（B-11 缩范围） |
| DHR_50 | 等 DSH 面板做出来（或判否）后，把命令行和 DSH 面板对同一份数据摆在一起对比，由你拍板 DSH「可以用 / 不能用」，写进报告附录 | 补上跨客户端一致性证据和 DSH 最终结论；它不挡 P5 开工，只挡 P5 里「接 DSH」的那一小块（B-11 新建） |

- **完成后你手里有什么**：
  1. 一份冻结的 Pilot 版「状态说明书」格式（Read Model v1）与正反样例，作为 P5 协议设计的输入（P5 仍可能调整，不是最终合同）。
  2. 一个能用的命令行工具，Windows 本机和远程 SSH 都能看进度。
  3. DSH 能不能用、值不值得当 Windows 日常工作台的三选一结论（能 / 能但有限制 / 不行）。（B-11 起由 DHR_50 交付，可晚于 P5 开工）
  4. 一份带截图和实耗的 Pilot 报告，由你拍板四件事：命令行+SSH 够不够作为独立控制面？DSH 值不值得日常用？DSH 不行的话 P5 默认控制面是纯命令行还是预定补 Pi 终端界面？这套体验值不值得继续往下建？（Pi 探索属 P4-X 可选项，不是标配产出；B-11 起报告分主报告（DHR_27，答第 1、4 问）与附录（DHR_50，答第 2、3 问）两段交付）

### 0.2 审核与确认记录

- **事件类型**：B-新建（2026-08-18 从 design/05 阶段主线拆出首份落盘）+ 同日 B-调整 `DHR-B-04`（按 design/06 把 DSH 从「唯一工作台」改为「可判否的桌面控制面轨」，新增 CLI/SSH 必备控制面轨）+ **B-调整 `DHR-B-10`（2026-08-18，本轮）**。B-10 三件事：①把 DHR_26 拆成 Host 轨（DHR_26）与 Client 轨（DHR_49）两卡；②补四处终点空白（DSH 版本基线、三态裁定归属、「可复现」判据、面板渲染哪份 Read Model）；③回写 DHR_25 的实际交付范围（列表投影 / 三种排布 / `group` 等新字段）。任务数 3 → 4，依赖链改为 `DHR_25 → DHR_26 → DHR_49 → DHR_27`。

- **B-10 白名单例外（经用户明文批准，2026-08-18）**：列表投影 `relay.pilot-run-list/v1` 是 DHR_25 施工中由用户逐条授权新增的，`design/README.md`「拆计划依据」白名单正文（design/01、02、05、06）**没有它的字段级定义**。主会话向用户说明缺口与两条路径（(a) 批例外推进 / (b) 先 A′ 再重走 B）后，**用户选择 (a) 并批准本次例外**，口径如下：

  > **Pilot 期列表投影以 DHR_25 的人判 H1（2026-08-18 用户答「暂时够了」）与本计划 §2.3 为暂定真源；design 层的字段级契约由 P5 `DHR_30` 正式补齐。**

  这是一次**显式的白名单例外**，不是遗漏：本计划 DHR_49 / DHR_27 中凡涉列表投影的验收，回链口径统一为「design/06 H3 子集『客户端读同一 Read Model』+ 本例外」。理由记录：列表投影本就排在 P5 DHR_30，Pilot 期产物在本计划中定位为「P5 的输入，不是最终合同」，此刻补进 design 正文将在 P5 重写一遍。**后续任何人翻 design 发现缺列表定义时，以本条为准——是特批，不是漏写。**
- **审核记录**：已做——2026-08-18 claude-grok（fresh、只读、`--model grok-4.5`）深审，结论「有条件通过」（3 P0 / 6 P1 / 3 P2）；原文与只读形态见 [evidence/09 §3](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b04)。独立于 A 阶段对 design/05、design/06 的审核。
- **主会话裁决**：已做——逐条采纳 / 待用户决定见 [evidence/09 §2 裁决总表](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#2-主会话裁决总表2026-08-18)；已采纳项已回写本计划正文，「待用户决定」项在正文显式标注。
- **讲解记录 / 理解问题 / 用户回答 / 复审**：B-04 事件已于 2026-08-18 由用户整版确认闭合，过程留痕见 [evidence/09 §3~§4](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#understanding-b04)；本块不再单独维护「待补」占位（B-10 第 3 轮复审指出旧占位与同节「已确认」并存造成读感混乱，机械刷新）。
- **用户确认**：已确认——2026-08-18 用户对话「P4确认，提交和推送」（见 [evidence/09 §4](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#understanding-b04)）。**B-04 事件闭合；DHR_25 已于同日完工销户**；DHR_26 / DHR_49 / DHR_27 仍须逐卡按 DevHarness 入口闸单独分流、确认落点与范围后才可开工。

**`DHR-B-10` 事件记录（2026-08-18，本轮）**

- **触发**：DHR_25 收口后用户提出两问——「任务卡对复杂需求会不会太简单、不确定性是否增加」与「DHR_26 凭什么会写 DSH 插件」。主会话据此审 DHR_26 的**终点**（非路径），查出四处空白；用户当场拍板拆卡、锁 rc.7、可复现取「清净重跑 + 换机重跑」两条、面板两屏都做且**列表屏优先**；三态中间档经用户裁决改为不设机器判据、由人判收敛为「可以用 / 不能用」。
- **审核记录**：已做——2026-08-18 claude-grok（fresh、独立会话、未参与本草案，`--model grok-4.5`）headless 只读深审，结论「有条件通过」（1 P0 / 4 P1 / 4 P2）；派出前后 Git 基线均为 `610bf5c`、变更集不变，reviewer 零写入。只读为进程层参数强制的**侦测型降级**（非机器只读），已按 `references/复核只读派发.md` 登记。原文与派单形态见 [evidence/09 §17](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b10)。
- **主会话裁决**：已做——9 条逐条裁决见 [evidence/09 §17.6](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b10)：7 条采纳并已回写正文（含把 `P4-DM4/DM5` 拆分退役为 `DM4a/DM4b`、`DM5a/DM5b`），3 条属产品取舍**不由主会话代裁**、提交用户并已全部获答（列表投影白名单例外 → 用户批例外；换机重跑失败是否触发止损 → 用户选只降级不停轨；rc.7 升级失败处置 → 用户选先直接升，失败分支保留 §4.4 默认剧本）。未采纳项：无。
- **讲解记录**：已做——四层讲解（全局地图 → 两份契约 → 三条机器可判的验证判据 → 止损与判否处置），另单独解释「白名单」的含义与作用。全文见 [evidence/09 §18](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#understanding-b10)。
- **理解问题**：已做（一次一问）——「列表屏做出来后你若判断『还不如 CLI 好用』，详情屏还做不做？」给出三条走法（照做完 / 就地停 / 停下来重问）及各自代价。
- **用户回答 / 解释**：用户选**「停下来重问」**——把「不好用」拆成 DSH 渲染能力问题（属 DM 事实）与信息组织问题（属 P5 契约设计输入），二者对 P5 含义相反。**该回答暴露了原草案的缺口**：早交付只规定「做出来给用户看」，未规定「用户看完不满意怎么走」。据此在 DHR_49 新增正式的**「列表屏中途闸」人判验收项**（只暂停、不自动终止，判定权在用户，未表态时默认续做详情屏不空转）。
- **调整与复审**：已做两轮——第 1 轮全面审（1 P0 / 4 P1 / 4 P2，有条件通过），裁决后第 2 轮**定向复审**只审实质调整（无新增 P0，2 P1 + 5 P2 全为连带句未刷干净，已全部回写）。「列表屏中途闸」系第 2 轮派出后新增，另派第 3 轮增量复审。
- **用户确认**：已确认——2026-08-18 用户对话「落盘提交」。`DHR-B-10` 事件闭合。**DHR_26 / DHR_49 / DHR_27 仍未授权开工**，每张卡开工前仍按 DevHarness 入口闸单独分流、确认落点与范围。

**`DHR-B-11` 事件记录（2026-08-20，本轮）**

- **触发**：用户提出「P4~P9 继续跑的同时，先把核心接力能力用起来」，经对话收敛为「P5（常驻内核 + 正式 Relay CLI）尽快开工换可用性，DSH 轨不放弃、与 P5 并行」。现行 §4.5 把「DSH 三态已收敛」写成 P5 解锁前置，与该取舍冲突；且 DHR_27 依赖 DHR_49，CLI-only 收口被 DSH 轨拖住。用户 2026-08-20 在对话中确认方向两点：①按「解耦 §4.5 + DHR_27 缩范围 + 汇合点后移」调整；②P4-CM 收口后 P5 与 DSH 轨并行。另用户同日指示：任务卡定稿后的具体施工派 Opus 模型执行（派工偏好，不改卡内容）。
- **调整三件事**：①把原 DHR_27 拆成 CLI-only 收口（DHR_27 保 ID 缩范围，依赖降为 DHR_25）与对证/三态补录（DHR_50 新建，依赖 DHR_49 + DHR_27）；CM6 随之拆分退役为 CM6a（CLI 主线，DHR_27）/ CM6b（桌面轨复验，DHR_50），CM4 承接卡改 DHR_50 并新增「延后（DHR_50）」合法状态。②§4.5 解锁 P5 改为不等 DSH 三态收敛。③汇合点钉在 P5 DHR_30 的 DSH Bridge 条件部分与 DHR_31 的 DSH 附加客户端项——DHR_50 未收敛前该两处不得开工/执行，CLI 主线不受影响（P5 计划同步修订，README 机械同步）。
- **审核记录**：已做——2026-08-20 claude-grok（fresh、独立会话、未参与本草案，`--model grok-4.5`）headless 只读深审，结论「有条件通过」（0 P0 / 5 P1 / 2 P2）；派出前后 Git 基线均为 `a4584ee`、变更集不变，reviewer 零写入。只读为进程层参数强制的**侦测型降级**（非机器只读），已按 `references/复核只读派发.md` 登记。原文与派单形态见 [evidence/09 §19](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b11)。
- **主会话裁决**：已做——8 条逐条裁决见 [evidence/09 §19.6](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#review-b11)：6 条采纳并已回写正文（延后诚实锚点 `DM-deferred-facts:` 与 DHR_50 诚实差额、DHR_30 H4 条件化、CM6a/6b 审计范围与冻结、残留旧口径三处、README 对齐、依赖满足条件）；1 条（DHR_50 档位）属产品取舍不由主会话代裁、提交用户；1 条（并行窗口止损事实披露落点）主会话采默认（findings + 附录、不回改主报告）并向用户明示可推翻。
- **讲解记录**：已做——四层（两支地图 → 「延后」定义与 `DM-deferred-facts:` 锚点 → 解锁 / 汇合点验证机制 → 止损与 `honesty-gap` 处置），全文见 [evidence/09 §20](../design/evidence/09-P4至P9阶段计划-交叉审核记录.md#understanding-b11)。
- **理解问题 / 用户回答**：已做（一次一问）——「P5 DHR_30 开工时 DHR_50 未收敛，Bridge 部分怎么走？」三选一；用户选**「Bridge 记『未执行』，DHR_30 照常收口」**（= 草案默认，确认汇合点语义无歧义）。另两项用户裁决：DHR_50 档位 = 轻档 + CM4 记 pass 前两轮独立只读对证（审核方案 B 原样）；并行窗口披露落点默认（findings + 附录、不回改主报告）用户未推翻。
- **调整与复审**：回写均为 reviewer 逐条处方原样落地或其直接机械化，未引入新设计选择；档位选择亦为审核开出的方案 B 原样，主会话判定不另派第 2 轮复审。
- **用户确认**：已确认——2026-08-20 用户点选「直接落盘提交」。`DHR-B-11` 事件闭合。**DHR_26 / DHR_49 / DHR_27 / DHR_50 均未授权开工**，每张卡开工前仍按入口闸单独分流（施工按用户同日指示派 Opus 执行）。

## 1. 概述

- **交付什么 / 不含什么**：
  - 交付：①客户端中立的**两份** Read Model 契约与 fixture——详情 `relay.pilot-read-model/v1` 与列表 `relay.pilot-run-list/v1`（后者含必填 `group`，见 §2.3）；②一次性 Relay Pilot CLI（`show` 详情 + `list` 列表，各支持文本 / JSON，文本再分 `split` / `table` / `grouped` 三种排布）；③Windows 终端渲染 fake run 与冻结的 v1 历史 run；Linux SSH 会话渲染同一 fake fixture（条件允许时同时读取复制到 testdata 的 v1 fixture）；④树外 DSH Host Plugin（DHR_26）与树外 Client Plugin 最小 Relay 面板（DHR_49，列表屏 + 详情屏；构建链触发止损时诚实判否）；⑤CLI 与 DSH 对**两份** Read Model 的一致性报告（B-11 起由 DHR_50 补录，可晚于 P5 开工）；⑥可选 DSH Native Agent 棒 0 Proposal 试验（不阻断 P5；B-11 起归 DHR_50）；⑦Pilot 报告，B-11 起分两段交付——主报告（DHR_27：CLI 结论与 P5 默认控制面裁决材料）+ 附录（DHR_50：DSH 继续 / 调整 / 退出）。
  - 不含：relay/v2 完整协议、Detached Relay Runtime、Workflow Contract / Executor Profile 正式实现、Herdr Adapter、DevHarness S0~E13、Named Pipe / Unix Domain Socket、正式 Pi Extension、完整工作台首页 / 项目管理 / 流程编辑器、agent-console 迁移或删除。
- **承接设计**（拆计划输入 = `design/README.md` 白名单）：
  - [多控制面、Headless 与 SSH 运行：设计补充](../design/06-多控制面与Headless-SSH运行-设计补充.md) · §10「阶段计划调整 · P4」是本阶段的直接设计依据（「同一 fake/v1 Read Model 可由通用 CLI 在 Windows 和 SSH 终端读取；DSH 是并行的首选 UI Pilot」）。**本阶段不承接「验收命题」节任何全称命题**：H1（Runtime 无 DSH 可运行）、H4（断开不取消 Run）、H9（Linux 仅 SSH 可跑 Runtime/CLI/Herdr/工作流）都以 Runtime 存在为前提，P4 没有 Runtime，只做 fixture 级铺垫，全称由 P5 / P6 / P9 承接；H3（DSH/Pi/CLI 读同一 Read Model）在 P4 只能于 DSH 通过时由 DHR_50 证明其 CLI↔DSH 子集（B-11 前为 DHR_27）。
  - [DeepSeek Harness 插件化与专属工作台](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md) · §5 DSH 插件形态、§14 专属工作台产品面、§15 阶段交付主线、§18 风险和停止条件（05 未编验收 ID，按节回链）。
  - 参考（**非拆计划输入**，只作裁决背景）：[evidence/07 阶段计划评估](../design/evidence/07-P4至P8阶段计划评估与pi替代评估-待第三方评估.md)、[evidence/08 Pi 对比评估](../design/evidence/08-Pi-Agent替代DSH-独立对比评估.md)。
- **实施策略一句话**：仓外一次性实验，先用普通终端 + SSH 证明「同一 Read Model 不靠 DSH 也能看」，再叠加 DSH 树外插件验证增强体验，用双轨隔离避免 DSH 单点失败拖垮 Relay 主线判断。
- **任务前缀 / 模块 slug**：`DHR_` / `dh-relay`（verify scope=`dh-relay`）。
- **批次**（B-11 修订）：批次 1=`DHR_25`（必备控制面轨，已完成）；批次 2=`DHR_27`（CLI-only 收口 + P4 主报告，端到端 CLI demo 在本卡，不再依赖桌面轨）；批次 3=`DHR_26 → DHR_49 → DHR_50`（桌面控制面轨 + 对证与三态补录，与 P5 并行推进）。批次 3 内按确定性排序：`DHR_26`（Host 轨，有官方教程与本机 30 余个官方 client 插件产物可对照，确定性高）先行并产出侦察结论，`DHR_49`（Client 轨，构建配方是本阶段唯一真未知）后行且允许判否，`DHR_50` 收对证与三态。工作量不设硬预算（用户 2026-08-18 拍板「工作量不重要」）：只如实记录——DHR_25 记录实际开工时间，DHR_27 报告真实耗时；DSH 探路的止损只看 §4.4 的事实条件，不按天数。

## 2. 工程切分

### 2.1 实现单元

| 单元 | 职责 | 入口 / 主要文件 | 关联任务 |
|---|---|---|---|
| read-model | 详情 `relay.pilot-read-model/v1` 与列表 `relay.pilot-run-list/v1` 两份 schema、fake fixture、v1 → Read Model 投影 | `<experiment-root>/relay-control-pilot/src/read-model/`、`testdata/fake/`、`testdata/v1/` | DHR_25 / DHR_27 |
| pilot-cli | 一次性 CLI，`show` / `list` 两个子命令，text / json 两种渲染（text 再分三种排布），只消费 Read Model | `src/cli/`、`src/render/` | DHR_25 |
| dsh-host | 树外 Host Plugin，暴露 `ctx.relayPilot` 服务，只传普通 JSON | `src/dsh-host/` | DHR_26 |
| dsh-client | 树外 Client Plugin + 最小 Relay 面板（列表屏 + 详情屏）；可复现构建配方 | `src/dsh-client/` | DHR_49 |
| pilot-evidence | 截图 / 终端转录、fixture hash、一致性对证、Pilot 报告（主报告 + 附录） | `evidence/` + `docs/modules/dh-relay/design/evidence/10-P4-多控制面Pilot报告.md`（09 号已被交叉审核记录占用） | DHR_27（主报告）/ DHR_50（对证 + 附录） |

### 2.2 复用与禁改边界

| 路径 | 禁改 / 扩展 / 新建 | 说明 |
|---|---|---|
| `<experiment-root>/relay-control-pilot/`（dh-relay 仓外） | 新建 | Pilot 全部代码落此；一次性验证客户端，不锁定 P5 Runtime 语言与正式命令。**`<experiment-root>` = `D:\MyFiles\ai-workflow\dh-relay-p4-pilot\`**（DHR_25 开工闸由用户给定，B-10 机械回填）；Linux 目标真机 `ssh thinkpad` |
| `<experiment-root>/dsh-home/` | 新建 | DSH 独立 Home，与用户日常 DSH 配置隔离 |
| DeepSeek Harness 上游源码 | 禁改 | 只允许树外插件；出现「必须改上游 / 只能在 monorepo 内构建」即触发止损 |
| `.dh-runtime/relay/`（v1 现场） | 只读 | 先复制成冻结 fixture；活现场只做一次零写入演示 |
| `docs/modules/dh-relay/`（除 evidence/10 Pilot 报告与本计划回填） | 禁改 | Pilot 不改 DevPlan、workspace、design 契约 |
| `tools/`（现役 P1 代码） | 禁改 | 本阶段不动生产代码 |

### 2.3 阶段专属约束

- **Read Model 构成**（DHR_25 冻结，2026-08-18 人判 H1 签收）：两份客户端中立契约，任一客户端只渲染、不推导状态。
  - **详情** `relay.pilot-read-model/v1`：`schema_version / run_id / source_kind / workflow_name / run_status / updated_at / nodes[] / attentions[] / source_refs[] / started_at / elapsed_seconds / trigger / trigger_by / log_locator / summary / labels[]`。
  - **列表** `relay.pilot-run-list/v1`：`schema_version / source_kind / updated_at / runs[] / source_refs[]`；`runs[]` 含必填 **`group`** 与 `progress / attention_count / max_attention_severity / top_attention_summary / current_node_id / current_node_title / started_at / elapsed_seconds / trigger / trigger_by / attempt / log_locator / summary / labels`。
  - **架构约束（跨全部客户端）**：分堆与排序**由源头 `group` 给**，客户端一律不得从 `run_status` 推导；词表外的 `group` 自成一节原样打印。两条镜像断言钉住：改 `group` 必须移动、只改 `run_status` 必须逐字不变。CLI 侧已由变异测试验证断言会咬；**跨客户端成立与否由 DHR_49 的列表屏首次真正验证**。
  - 两份 `run_id` 为关联键；同一 `run_id` 下 `attention_count` 必须等于详情 `attentions[]` 条数，`progress` 必须等于详情节点实际计数，`workflow_name / run_status / started_at / trigger / trigger_by / attempt / log_locator` 必须逐字相同。
  - DSH RC 私有类型不得进入任何一份。`cost`（token / 费用）经用户裁决不进 v1。
  - **设计层缺口（已处置）**：列表投影无 design 白名单正文的字段级定义，已由 §0.2 的**显式白名单例外**（用户 2026-08-18 批准）承接——Pilot 期以本节 + DHR_25 人判 H1 为暂定真源，P5 `DHR_30` 正式补 design。
- **DSH 版本基线**：本阶段锁 `dsh-v0.1.0-rc.7`（= design/05 §20 研究基线 `99f6f02`）。本机现装 0.1.0-rc.6，升级动作与升级前后现场快照由 DHR_26 承接。**一切 DSH 结论必须标注所在版本**；跨 rc 差异写进 findings，作 design/05 §3.3「DSH 仍处于快速迭代期」的实测证据。
- **DSH 桌面控制面轨终态枚举**：`passed / passed-with-constraints / stopped-by-pilot`；`stopped-by-pilot` 必须写清阻塞事实，不包装为通过。**三态之间不设机器判据**——DHR_26 / DHR_49 只如实登记事实（构建配方全文、外部前提、止损条件逐条命中与否），三态归属由 DHR_50 人判环节由用户收敛为「可以用 / 不能用」（2026-08-18 用户裁决：机器不自行裁定中间档；B-11 起收敛环节由 DHR_27 移至 DHR_50）。
- **棒 0 Proposal**（DHR_50 可选，B-11 前属 DHR_27）只允许含：任务摘要 / 候选节点 / 建议执行角色 / 依赖 / 未决问题；不得写 Relay state、业务仓工件或执行命令。
- Pi TUI 只作候选控制面登记，本阶段不建正式 Pi Extension。

## 3. 任务表

### 3.1 索引

<!-- dh:tasks -->

| 任务 ID | 一句话 | 档位（轻/标准） | 状态 | 依赖 | 工作区 | 验收时间 / verify SHA | 备注 |
|---|---|---|---|---|---|---|---|
| DHR_25 | 冻结客户端中立 Read Model、fixture 与 Windows/SSH CLI 必备控制面 | 轻 | 已完成 | - | [workspace/DHR_25/](../workspace/DHR_25/task.md) | 2026-08-18（轻档人判签收，无 verify 提交） | 必备控制面轨；开工前需用户对话确认；轻档 + 人判签收（用户 2026-08-18 拍板） |
| DHR_26 | 树外装载 DSH Host Plugin、升级到 rc.7 并完成树外插件现场侦察 | 标准 | 已完成 | DHR_25 | [workspace/DHR_26/](../workspace/DHR_26/review.md) | `c90cf88`（2026-08-20 user-signed） | 桌面控制面轨 · Host 半程；DM1 / DM4a / DM5a 与版本基线事实已登记，未贴三态标签（三态归 DHR_50，B-11 前为 DHR_27）；侦察落档已交付，DHR_49 开工输入齐备；B-10 由原 DHR_26 缩范围而来 |
| DHR_49 | 找到树外 Client Bundle 可复现构建配方并做出列表屏 + 详情屏面板 | 标准 | 进行中 | DHR_26 | [workspace/DHR_49/](../workspace/DHR_49/brief.md) | | 桌面控制面轨 · Client 半程；2026-08-20 开工（用户对话确认：标准档、不开 worktree、委托全留主会话，两轮换人复核仍派 fresh agent）；本阶段唯一真未知；允许命中止损并交**判否事实**（三态标签只在 DHR_50 由人判落——B-11 前为 DHR_27，本卡状态机仍用「已完成（含判否事实）」或「已取消并留因」）；B-10 新建（讨论中称「26b」） |
| DHR_27 | 接 v1 只读投影并完成 CLI 控制面收口与 P4 主报告 | 标准 | 已完成 | DHR_25 | [workspace/DHR_27/](../workspace/DHR_27/brief.md) | 2026-08-20 / `252a131`（release_mode=full） | 必备控制面轨 · CLI 收口；CM3/CM6a/B1子集全绿、CM4 记「延后（DHR_50）」；H1「够，认可」+ H4「值得，继续」（用户 2026-08-20 点选）；两轮换人复核（3 批小审+E2 增量）+E4/E14 全闭合；尾巴入池 ACC-2026-08-20-01/02 |
| DHR_50 | 补录 CLI↔DSH 跨客户端对证、由用户收敛 DSH 三态并写 P4 报告附录 | 轻 | 未开始 | DHR_49（通过或已落判否证据）、DHR_27 | <开工时回填 workspace/…> | | 桌面控制面轨收口；与 P5 并行，本卡是 P5 DHR_30 DSH Bridge 条件部分的开工前置（汇合点）；轻档 + 人判签收，但 CM4 记 pass 前强制两轮独立只读对证复核（用户 2026-08-20 拍板）（B-11 新建） |

> 状态列只填「未开始 / 进行中 / 待验收 / 已完成 / 已取消」，阶段闸与前置说明一律进「备注」列。工作区列开工时回填；验收时间 / verify SHA 收口销户时回填。

### 3.2 任务卡

#### DHR_25

- **目标**：冻结 fake run 与 v1 run 的统一查询结构（Read Model v1，构成见 §2.3），做出一个 text/json 双输出的一次性 CLI，在 Windows 普通终端与 Linux SSH 会话里对同一 fake fixture 渲染出语义相同的结果，证明「看状态」不依赖 DSH。
- **实际交付范围（B-10 回写，原卡未含）**：本卡施工中由用户在对话里逐条授权扩了范围，实际多交付三项——①**列表投影** `relay.pilot-run-list/v1` 与 `relay-pilot list` 子命令（列表页原排在 P5 DHR_30，AI 说明取舍后用户点选「补，现在就做」）；②**三种文本排布** `split`（默认，多表）/ `table`（单表）/ `grouped`（分区），详情页同步做减法；③由排布问题逼出的**架构结论「分堆与排序必须由源头给」**，据此给列表 schema 加必填 `group` 并新增 `progress / attention_count / max_attention_severity / top_attention_summary / current_node_id / current_node_title / attempt / log_locator` 等字段，配两条镜像断言与变异测试。原始留痕见 [workspace/DHR_25/task.md](../workspace/DHR_25/task.md)（六轮范围变更）。
- **非目标**：不实现 Relay Runtime、不做 v2 协议、不锁定 P5 的实现语言与正式命令；不做 v1 活现场投影（归 DHR_27）；不做任何写入；`cost`（token / 费用）不进 v1（用户裁决，留 v2）。
- **验收口径**：
  - **机器证**：[design/06 §10 P4](../design/06-多控制面与Headless-SSH运行-设计补充.md#10-阶段计划调整) · 本计划 P4-CM1/CM2：Windows 与 Linux SSH 对同一 fixture 输出规范化后相同的 JSON；文本输出只经唯一 render 函数从 Read Model 生成，测试断言 render 不读取 fixture 之外的旁路字段、不含第二套状态推导。（不承接 H3 全称；CLI↔DSH 一致性归 DHR_50，B-11 前为 DHR_27）
  - **机器证**：[design/06 §10 P4](../design/06-多控制面与Headless-SSH运行-设计补充.md#10-阶段计划调整) · P4-CM5：DSH 完全不启动时本卡全部产出可完成。（fixture 级，不是 H1 的 Runtime 级证明）
  - **机器证**：SSH 会话断开、重连后 fixture 内容与 hash 不变，远端无新增持久文件。（只证明本 Pilot 无副作用，不承接 H4「不取消 Run」）
  - **机器证**：健壮性与安全——未知字段、损坏 fixture、非法状态给出明确错误；testdata 零凭据、零本机敏感路径（承接 AGENTS 宪章#6）。
  - **机器证**：记录 OS / Shell / Node 或临时运行依赖版本，但只作证据，不写成 Runtime 决策。
  - **机器证（B-10 回写）**：列表投影的两条镜像断言必须由变异测试证明「会咬」——把分节改成按 `run_status` 推导时断言立即失败；词表外的 `group` 自成一节原样打印。
  - **人判**：Read Model v1 的字段（§2.3，含 B-10 回写的列表投影）是否足以作为 P5 协议设计的起点——向用户展示 fake / v1 fixture 与字段说明，用户对话确认后 schema 才进入 P5 输入。**已达成**：2026-08-18 用户答「暂时够了」。
- **变更范围**：`<experiment-root>/relay-control-pilot/src/read-model/`、`src/cli/`、`src/render/`、`testdata/fake/`、`testdata/bad/`；本卡 `workspace/DHR_25/`。
- **档位**：轻 + 人判签收（用户 2026-08-18 拍板）：仓外一次性只读验证，不接线、不动生产代码；因本卡冻结的 Read Model 会作为 P5 协议输入，收口前增加人判项「最小字段是否够 P5 沿用」，由用户在对话里确认后才把 schema 交给 P5；开工仍需用户对话确认。
- **实施提示**：CLI 与后续所有客户端只渲染、不推导状态；fixture 先于 CLI 冻结；Read Model schema 与正反 fixture 作为 P5 协议设计的输入（P5 可改），CLI 本身不进。

#### DHR_26（桌面控制面轨 · Host 半程）

- **目标**：不修改 DSH 上游源码，把最小 `ctx.relayPilot` Host Service 以树外方式装进独立 Home 的 DSH，使 DSH 进程内可取到 DHR_25 的两份 fake Read Model；同期完成 rc.6 → rc.7 升级留证与树外插件现场侦察，产出 DHR_49 的施工依据。
- **非目标**：不做任何 Client 插件与面板 UI；不做 v1 投影；不接 Relay 运行写权；不修改 DSH 上游源码；不判断 Client bundle 构建配方是否可行（留 DHR_49）。
- **验收口径**：
  - **机器证**：[design/05 §5 DSH 插件形态](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#5-dsh-插件形态) · P4-DM1：不修改 DSH 上游仓库即可加载 Host Plugin（`--patch` overlay 或 profile 安装）；`ctx.relayPilot` 在 DSH 进程内可被调用，**两份 schema 原样透传**，Host 不做二次加工、不推导状态。
  - **机器证**：P4-DM4a：Host Plugin 可安装 / 卸载；上游有显式启用 / 禁用机制则一并验证，无则如实记「未验证」（不造假失败）；卸载后服务与事件注册得到清理。
  - **机器证**：P4-DM5a：Host 只传普通 JSON，不传 Cordis 活动对象；DSH RC 私有类型不进 Read Model。
  - **机器证 · 版本基线**（§2.3）：本机 DSH 由 `0.1.0-rc.6` 升到 `0.1.0-rc.7`；升级前后各留一份现场快照（`dsh --version`、内置包逐个版本号、安装目录结构），差异写进 `findings.md` 作 design/05 §3.3 的实测证据。**升级前快照已于 2026-08-18 B-10 期间预先采集**（只读，落 `<experiment-root>/evidence/dsh-version-baseline/rc6-before-upgrade.txt`，245 行含 194 个内置包版本），本卡开工后只需采升级后快照并对差。**证据来源须显式登记为「B-10 预采前快照 + 本卡升级后快照」**（跨事件证据链），且开工第一步必须复验版本未漂；漂则作废预采、就地重采。
  - **机器证 · 侦察落档**：树外插件的构建与安装事实写进 `findings.md`——官方 client 插件的 `dsh.client` 声明形态、`exports["./client"]` 产物形态、profile 的 client 扫描锚点、本机可用类型定义位置、`--patch` 与 profile 安装各自的适用边界。此件是 DHR_49 `task_plan.md` 的输入，缺则 DHR_49 不得开工。
  - **机器证 · 事实登记（不裁定）**：本卡只登记事实，不自行给出三态结论（§2.3）。
- **变更范围**：`src/dsh-host/`、`<experiment-root>/dsh-home/`；本卡 `workspace/DHR_26/`。
- **档位**：标准（组件接线：DSH 插件生命周期 + 独立 Home + 本机版本升级）。
- **实施提示**：DSH 用独立 Home 隔离，不碰日常配置；升级放本卡第一步，但**前快照已由 B-10 预采**——开工时先复验预采文件仍在且 `dsh --version` 仍为 `0.1.0-rc.6`（版本未漂）即可直接升；**若版本已漂则作废预采、就地重采前快照再升**；侦察只读、不改上游。**早交付**：`ctx.relayPilot` 首次在 DSH 进程内被调用并返回 fake Read Model 时，立即产出一份终端转录给用户看，不等本卡收口。**早交付仅让进度可见，不代替待验收前的双轮换人复核与人判，也不构成任何部分签收。**

#### DHR_49（桌面控制面轨 · Client 半程）

- **目标**：找到并记录**树外** Client Bundle 的可复现构建配方，在 DSH 里装出最小 Relay 面板，**先列表屏、后详情屏**，两屏均从 DHR_25 冻结的同一组 fixture 重建；证明 DSH 能作增强工作台而不需 fork 上游。命中止损条件时诚实登记判否事实。
- **非目标**：不做完整工作台首页 / 项目管理 / 流程编辑器；不做 v1 投影；不接 Relay 运行写权；不修改 DSH 上游源码；**不评判面板视觉质量**（视觉属 P4-X 非阻塞，最小面板阶段判视觉为时过早）。
- **验收口径**：
  - **机器证**：[design/05 §5 DSH 插件形态](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#5-dsh-插件形态) · P4-DM2：Client Plugin 以**可重复构建**的产物加载。可复现判据**两条都要**：①**清净重跑**——删除产物与依赖缓存后在本机按配方重跑，产出可再次加载的 bundle；②**换机重跑**——在 Linux 目标真机（`ssh thinkpad`）按同一份配方重跑，产出可加载 bundle。②失败而①成立时如实登记「本机可复现、跨机未成立」，**不得记 pass**。
  - **机器证**：[design/06 H3 子集](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)（仅「DSH 读同一 Read Model」这一子命题）**+ §0.2 白名单例外**（列表投影部分）· P4-DM3：面板从统一 Read Model 重建——**列表屏**（`relay.pilot-run-list/v1`）与**详情屏**（`relay.pilot-read-model/v1`）各自可重建；浏览器刷新与 DSH 重启后从同一 fixture 重建相同页面。**中途止损、或中途闸决定不做详情屏时，分屏登记**：详情屏未完成则该屏记 `N/A`，**不得因列表屏已绿宣称 DM3 全过**（与 CM4「按已做出的屏判定」同口径）。
  - **机器证 · 架构约束跨客户端成立**（列表屏专有，§2.3）：面板分节与排序**只读源头 `group`**，不得从 `run_status` 推导；两条镜像断言在 DSH 侧同样成立（改 `group` 必须移动、只改 `run_status` 必须逐字不变），词表外 `group` 自成一节原样打印。**这是本卡最不可替代的产出**——CLI 单客户端时该约束是自证的，DSH 面板是第一个零共享代码的独立客户端。
  - **机器证**：P4-DM4b / P4-DM5b：Bundle 可安装 / 卸载，卸载后 UI 注册得到清理；DSH RC 私有类型没有进入 Read Model。
  - **机器证 · 事实登记（不裁定）**：如实登记构建配方全文、外部前提（是否依赖本机 dsh 安装目录绝对路径、是否需要 monorepo checkout 等）、§4.4 止损条件逐条命中与否。**不自行裁定「能用 / 带约束能用」**，三态归属由 DHR_50 人判收敛（§2.3，B-11）。
  - **人判 · 列表屏中途闸**（B-10 理解问答产出，用户 2026-08-18 选定）：列表屏首次渲染成功即**暂停扩张**，把**可复跑的操作路径**交用户，由用户**自己跑起来实际用一下**再对体验表态（不以截图代替亲跑；截图只作同步留痕）。用户若判「不如 CLI 好用」，主会话**必须把评价拆成两类、不得混谈**——
    - **(i) DSH 渲染能力 / 机制问题**（表格渲染不出、刷新丢状态、布局或样式不可控、性能不可接受等）→ 属 **P4-DM 事实**，登记进 DM 结论；命中 §4.4 条件时按下方「止损优先」处理。
    - **(ii) 信息组织 / 字段问题**（该显示的没显示、分组或排序不合用、字段命名有歧义等）→ **不属 DM**，属 Read Model 契约的设计问题，登记为 **P5 协议设计输入**（带往 DHR_30），不影响 DM 判定、不触发止损。
    - **(iii) 控制面偏好**（渲染没毛病、字段也够，只是更习惯 CLI / 键盘流等主观取向）→ **既不属 DM 也不属契约缺陷**，只如实登记并带往 DHR_50 的 P4-H2 与三态收敛（B-11 前为 DHR_27），**不触发止损、不改 DM 的 pass/fail**。（B-10 第 3 轮复审指出原二分不穷尽后补入；此桶为机械默认，用户可推翻。）

    三类对 P5 的含义各不相同：(i) 说明 DSH 这条控制面不成立，(ii) 说明契约要改而客户端没问题，(iii) 说明两者都成立而选择权在人。**规则三条**：

    1. **可双属，禁揉一句**：一条评价可以同时落进多个桶（例如「分组看不清」可能同时是 (i) 折叠样式不可控与 (ii) `group` 语义不合用）。禁止的是**把不同性质的原因揉成一句结论**，不是禁止一因多属。
    2. **谁来拆**：主会话只提**候选归属表**（逐条列出评价 → 候选桶 → 理由），**由用户逐条点选** (i) / (ii) / (iii) / 双属；**未经用户逐条点选不得视为已拆完**，主会话不得整包代裁。
    3. **止损优先**：分类经用户确认且命中 §4.4 任一条件时，**改走 §4.4 止损收口**——此时不再提供「照做（继续扩张做详情屏）」这一选项，只在「改后做 / 不做」的收口语义内处置。未命中 §4.4 的 (i) 仅作 DM 事实登记，仍回到三选一。

    **等待语义**：提出表态请求后进入等待，**在收到用户明示前不得开工详情屏编码**；用户说「照做 / 先做着 / 回头再说 / 你看着办」等任何形式的放行即视为明示授权续做。**不设超时自动放行**，也**不得以「怕空转」为由自行跳过等待**（等待期间可做不涉详情屏的收尾，如整理配方文档与留痕）。

    **与 DHR_50 的关系**（B-11 前为 DHR_27）：本闸的分类结果与「详情屏做 / 改后做 / 不做」的决定，登记为 **DHR_50 人判的输入事实**；**无新证据时不得在 DHR_50 要求用户推翻重裁同一问题**。
  - **需求境证据 · 主证据 = 用户亲跑端到端**（用户 2026-08-18 定：「不用截图，端到端的测试我看下效果」）：本卡必须交付一条**可复跑的场景操作路径**——从起 DSH（独立 Home）、装 Host/Client 插件、载入 fixture 到打开面板两屏的完整命令序列，写进 `review.md` 需求境证据栏，**用户照着敲就能自己跑起来看**，可点击、可刷新、可重启。用户跑完的结论即本卡人判主证据。
  - **需求境证据 · 附属留痕**：AI 首次跑通时顺手留两屏渲染产物（截图或屏幕录制均可）入 `<experiment-root>/evidence/`。**它不再是主证据，只为零上下文复核 worker 提供可核对的渲染事实**——复核 worker 只读仓库、看不到用户屏幕，没有留痕就无法核 DM3。单测、DOM 存在性断言与代码复核仍不可替代任何一项（承接 AGENTS 宪章#3「场景操作路径 + 等价渲染证据」两项要求）。
- **变更范围**：`src/dsh-client/`、`<experiment-root>/dsh-home/`；本卡 `workspace/DHR_49/`。
- **档位**：标准（组件接线 + UI 需求境证据 + 带未知的构建链探路）。
- **实施提示**：施工顺序固定 **列表屏 → 详情屏**——列表屏承载架构约束的跨客户端验证，中途判否时它已产出可证伪结论，详情屏先做则判否时只剩「能读 JSON」；命中 §4.4 任一止损条件即停止扩张、诚实收口为判否事实，不为「做出来」硬拗；判否不阻断 DHR_50 的三态收敛，更不阻断已并行的 P5。**早交付即中途闸**：列表屏一渲染出来就把**可复跑的操作路径**交给用户、让其亲自跑（不等详情屏、不等 DHR_27），并按验收口径的「列表屏中途闸」暂停扩张、请用户表态、把评价拆成 DM 事实与 P5 契约输入两类后再续做。**该预览仅让进度可见，不代替待验收前的双轮换人复核与人判，也不构成任何部分签收。**

#### DHR_27（必备控制面轨 · CLI 收口，B-11 缩范围）

- **目标**：把冻结的 v1 fixture 与一条活 v1 历史现场（零写入）投影为统一 Read Model，由 Pilot CLI 渲染，完成 CLI 必备控制面收口；写 P4 主报告——含 CM 结论、截至本卡的 DM 事实登记、以及「CM4 / 三态收敛延后至 DHR_50」的显式登记；向用户交 P4-H 中不涉 DSH 两问（H1 / H4）的人判材料。
- **非目标**：不做 CLI↔DSH 对证（归 DHR_50）；不收敛 DSH 三态（归 DHR_50）；不做棒 0 Proposal（B-11 起归 DHR_50 可选）；不 resume 任何 v1 run；不创建 v2 Run；不改业务仓 DevPlan / workspace。
- **验收口径**：
  - **机器证**：[design/06 §10 P4](../design/06-多控制面与Headless-SSH运行-设计补充.md#10-阶段计划调整) · P4-CM3：冻结 v1 fixture 与活 v1 现场只读投影成功，源文件零写入（前后 hash 对证）。
  - **机器证**：P4-CM6a（B-11 由 CM6 拆分）：截至本卡收口，CLI 主线全程不引入 Relay 运行写权、不 fork DSH；审计范围 = DHR_25 / DHR_27 变更范围（`src/cli/`、`src/read-model/`、`src/render/`、`testdata/`）（§4.1）。
  - **机器证**：[design/02 B1 子集](../design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏)（只取「legacy 根只读、零新写」子命题，B1 全项不在 P4 关闭）：`.dh-runtime/relay/` 零新写。
  - **机器证 · 延后登记**：主报告中 CM4 显式登记为「延后（DHR_50）」、DM 组登记为「事实截至本卡、三态未收敛」；不得写成通过、N/A 或省略（延后不得掩盖失败，§4.5）。**主报告必须含可 grep 锚点 `DM-deferred-facts:`**，其值三选一并附清单：`dm-failures-present`（已有 DM 失败 / 止损命中，逐条列出）/ `stoploss-not-triggered`（已有 DM 事实、止损未命中）/ `no-dm-facts-yet`（桌面轨尚无事实）。（B-11 复审回写）
  - **人判**：[design/05 §14 专属工作台产品面](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#14-专属工作台产品面) · P4-H1 / P4-H4：向用户展示真实终端转录、fixture hash、CLI 输出、版本与实耗；用户判断 ①CLI+SSH 是否足以作为一条独立、正式的控制面（与 DSH 并行、可配置替换，不是保底） ④当前体验是否值得继续建 Relay Runtime。（H2 / H3 涉 DSH，归 DHR_50。）
- **变更范围**：`src/read-model/`（v1 投影）、`testdata/v1/`、`evidence/`、`docs/modules/dh-relay/design/evidence/10-P4-多控制面Pilot报告.md`（主报告）；本卡 `workspace/DHR_27/`。
- **档位**：标准（触碰 v1 真实现场 + 人判）。
- **实施提示**：v1 活现场只做一次只读演示，主输入是冻结 fixture；主报告给 P5 的裁决只覆盖「CLI 作默认控制面」，DSH 相关裁决留 DHR_50 附录；CM 失败不得被任何 DM 进展掩盖。

#### DHR_50（桌面控制面轨 · 对证与三态补录，B-11 新建）

- **目标**：DHR_49 交付（通过或判否证据）后，比较 CLI 与 DSH 面板对**两份** Read Model 的字段一致性（P4-CM4 补录），摆全 DHR_26 / DHR_49 登记的事实由用户把 DSH 桌面控制面轨收敛为三态之一，并把结论与 P4-H2 / H3 人判写进 P4 报告附录；条件允许时顺带验证 DSH Native Agent 棒 0 Proposal（P4-X）。
- **非目标**：不重跑 DHR_27 已收口的 CLI 主线验收；不 resume v1；不接 Relay 运行写权；不因 DSH 结论回改主报告的 CM 结论。
- **验收口径**：
  - **机器证 · CM4 补录**：[design/06 H3 子集](../design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题)（CLI↔DSH）**+ §0.2 白名单例外**（列表投影部分）：DSH 通过时，CLI 与 DSH 面板对**两份** Read Model 字段级一致——详情屏比节点 / 状态 / Attention，列表屏比 `group / progress / attention_count / max_attention_severity / current_node_*` 及 §2.3 列出的逐字相同字段；DSH 仅做出列表屏时，CM4 按**已做出的屏**判定并如实登记未覆盖屏。DSH 判否时 CM4 记 `N/A（无第二客户端）`，跨客户端一致性延后到 P5（DSH Bridge / 其他客户端）再证。**加严（B-11 裁决，用户拍板）**：本项记 pass 前须两轮独立只读对证复核（第二轮 fresh-context、不继承第一轮上下文），缺轮不得记 pass；记 N/A 时不适用。
  - **机器证**：P4-CM6b（B-11 由 CM6 拆分）：桌面控制面轨全程（DHR_26 / DHR_49 / 本卡）未引入 Relay 运行写权、未 fork DSH；审计范围 = `src/dsh-host/`、`src/dsh-client/`、`<experiment-root>/dsh-home/` 与 DHR_26/49/50 三卡工作区（§4.1）。
  - **机器证 · 诚实差额**：附录须核对主报告 `DM-deferred-facts:` 登记与桌面轨实际事实；发现遗漏时在附录显式标 `honesty-gap` 并列出差额，不得静默补绿。主报告落盘后新增的桌面轨事实进 findings 并列入附录「主报告后新增事实」节，不回改主报告（留痕原则）。（B-11 复审回写）
  - **机器证**（可选 P4-X）：DSH Native Agent 读取冻结输入并输出非权威 `plan-proposal` fixture，内容仅限 §2.3 允许字段；未做则登记「未验证」。
  - **人判 · 三态收敛**（§2.3）：主会话摆出 DHR_26 / DHR_49 登记的全部事实（构建配方全文、外部前提、止损条件逐条命中与否、两屏证据、版本基线、列表屏中途闸分类结果），由用户把 DSH 桌面控制面轨收敛成 `passed / passed-with-constraints / stopped-by-pilot` 之一。**主会话不得代裁中间档**；用户口径按「可以用 / 不能用」表达时，主会话据此登记对应终态并写明所附约束。
  - **人判**：[design/05 §14](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#14-专属工作台产品面) · P4-H2 / P4-H3：②DSH 页面若通过是否值得成 Windows 日常首选 ③DSH 判否时选 CLI-first 还是 P5 后加 Pi TUI。
- **变更范围**：`evidence/`、`docs/modules/dh-relay/design/evidence/10-P4-多控制面Pilot报告.md`（附录节）；本卡 `workspace/DHR_50/`。
- **档位**：轻 + 人判签收（只读对证与报告附录，不接线、不动生产代码，核心产出是用户人判；开工仍需用户对话确认）。**CM4 例外加严**（用户 2026-08-20 拍板）：CM4 记 pass 前强制两轮独立只读对证复核，缺轮不得记 pass；CM4 判 N/A 时不需要。
- **实施提示**：本卡是 P5 DHR_30 DSH Bridge 条件部分与 DHR_31 DSH 附加客户端项的开工前置（汇合点，§4.5）；DHR_49 判否时本卡仍要做（收三态 + 写附录），只是 CM4 记 N/A；附录不得回改主报告 CM 结论。

### 3.3 标准档共同收口条件

每张标准卡进入「待验收」前必须：两轮独立换人复核（轮 1 全面排查，轮 2 fresh-context 对抗）；有需求境证据——DHR_26 的插件装卸、DHR_49 的两屏面板、DHR_27 的 v1 投影与 CLI 渲染必须有真实截图 / 终端转录，单测不能替代；`dh dh-relay` 与本卡证据命令可复跑；P0/P1 清零；只停在待人验，用户对话确认后才 `verify(dh-relay):` 收口。DHR_25 为轻档，AI 自评 + 用户口头确认已关闭。DHR_50 为轻档 + 人判签收（B-11）：不套标准档复核仪式，但 CM4 对证仍须真实截图 / 终端转录留档，三态收敛必须是用户对话表态；且 CM4 记 pass 前必须过两轮独立只读对证复核（fresh-context、未参与施工，只读形态按 `references/复核只读派发.md`），缺轮不得记 pass（用户 2026-08-20 拍板，采审核方案 B）。

## 4. P4 阶段闸

### 4.1 必备控制面机器闸 P4-CM（CM1/2/3/5/6a 全部通过才证明 CLI 控制面独立成立、不依赖 DSH；CM4 见三分规则，B-11）

| ID | 命题 | 承接卡 |
|---|---|---|
| P4-CM1 | 同一 fake Read Model 可由 Windows CLI 渲染文本和 JSON | DHR_25 |
| P4-CM2 | 同一 fake fixture 可在 Linux SSH 终端读取，JSON 语义一致 | DHR_25 |
| P4-CM3 | 冻结 v1 fixture 与活 v1 现场只读投影成功，源文件零写入 | DHR_27 |
| P4-CM4 | DSH 通过时：CLI 与 DSH 对同一 Read Model 字段级一致；DSH 判否时：记 N/A；DHR_50 未收口前：记「延后（DHR_50）」——三种状态均不计入「CM 全绿」判定、不阻塞 §4.5 解锁（B-11） | DHR_50（B-11 前为 DHR_27） |
| P4-CM5 | DSH 完全不启动时，P4 必备控制面轨仍可完成 | DHR_25 |
| ~~P4-CM6~~ | **已拆分退役，ID 不复用**（原「全程不引入 Relay 运行写权，不 fork DSH」；B-11） | — |
| P4-CM6a | 截至 CLI 收口，CLI 主线全程不引入 Relay 运行写权、不 fork DSH（审计范围=DHR_25/27 变更范围：`src/cli/`、`src/read-model/`、`src/render/`、`testdata/`） | DHR_27 |
| P4-CM6b | 桌面控制面轨全程不引入 Relay 运行写权、不 fork DSH（审计范围=`src/dsh-host/`、`src/dsh-client/`、`dsh-home/` 与 DHR_26/49/50 工作区） | DHR_50 |

> **CM6a 范围冻结**（B-11 复审回写）：DHR_27 销户后 CM6a 审计范围与结论冻结；此后任何对该范围内路径的改动按维护任务分流并重验 CM6a，不得只靠 CM6b 兜底或静默沿用旧结论。

### 4.2 DSH 桌面控制面轨 P4-DM（决定 DSH 是否成为 Windows 首选桌面控制面，不是 P5 生死闸）

| ID | 命题 | 承接卡 |
|---|---|---|
| P4-DM1 | Windows 上树外 Host Plugin 可加载 | DHR_26 |
| P4-DM2 | 树外 Client Bundle 有可重复构建配方并可加载（判据 = 清净重跑 ∧ 换机重跑，见 DHR_49 验收口径） | DHR_49 |
| P4-DM3 | 最小面板可从统一 Read Model 重建（契约版本随 §2.3 升级为**两份** schema：列表屏与详情屏各自可重建；ID 保留，契约扩展） | DHR_49 |
| ~~P4-DM4~~ | **已拆分退役，ID 不复用**（原「安装、卸载和资源清理有证据」） | — |
| P4-DM4a | Host Plugin 安装、卸载和服务 / 事件注册清理有证据 | DHR_26 |
| P4-DM4b | Client Bundle 安装、卸载和 UI 注册清理有证据 | DHR_49 |
| ~~P4-DM5~~ | **已拆分退役，ID 不复用**（原「DSH RC 私有类型没有进入 Read Model」） | — |
| P4-DM5a | Host 只传普通 JSON，不传 Cordis 活动对象；RC 私有类型不进 Read Model | DHR_26 |
| P4-DM5b | 面板消费路径上 RC 私有类型没有进入 Read Model | DHR_49 |
| P4-DM6 | 「分堆与排序只读源头 `group`」这条架构约束在第二个独立客户端上成立（两条镜像断言在 DSH 侧同样咬） | DHR_49 |

> **DM 组终态**：DM1 / DM2 / DM3 / DM4a / DM4b / DM5a / DM5b / DM6 的机器结果只作事实登记，`passed / passed-with-constraints / stopped-by-pilot` 的归属在 DHR_50 由用户人判收敛（§2.3，B-11 前为 DHR_27），主会话不代裁。

### 4.3 非阻塞探索 P4-X 与人类闸 P4-H

- **P4-X**（失败不阻断 P5，只进报告）：DSH Native Agent 棒 0 Proposal；Pi TUI 读取同一 JSON；外部页面视觉质量。
- **P4-H**（用户判断；B-11 起 H1 / H4 见 DHR_27 人判项，H2 / H3 见 DHR_50 人判项）：H1=CLI+SSH 是否足以作为与 DSH 并行、可配置替换的独立正式控制面；H2=DSH 页面是否值得成 Windows 日常首选；H3=DSH 判否时选 CLI-first 或 Pi TUI；H4=是否值得继续建 Relay Runtime。

### 4.4 风险与止损

命中任一即停止 DSH 桌面控制面轨扩张、进入裁决：Client Bundle 只能在 DSH monorepo checkout 内构建（变相 fork）；**构建配方在清净重跑下不可复现**（同机删除产物与缓存后无法再产出可加载 bundle——此条比换机失败更硬，换机失败只降级为「带约束」不触发止损）；Windows 下 Profile 或插件生命周期不稳定；单个最小面板要求大范围导入未公开内部模块；DSH 重启后无法从普通 JSON 重建页面；**面板必须自行从 `run_status` 推导分组才能渲染**（即 §2.3 架构约束在第二客户端上不成立，说明 Read Model 设计有缺陷，须回 P5 重新设计而非硬改客户端）；或用户在对话中明确喊停。不设天数止损（用户拍板工作量不作约束）。

止损命中后仍须把已取得的事实登记完整（配方现状、失败点、版本基线），供 DHR_50 人判收敛（B-11 前为 DHR_27）；**止损 ≠ 本卡无产出**。

**rc.7 升级失败的处置**（不属止损条件）：如实登记升级失败的版本事实与报错；Host 验证可在 rc.6 上继续，但**结论只能标注为 rc.6 结论，不得宣称 rc.7 基线成立**；design/05 §3.3「快速迭代期」的证据改由「升级失败本身」承接。是否因此停掉 DSH 轨，临场交用户裁决；**在用户表态前默认剧本即本段**。

命中任一则 P4 整体不能通过：通用 CLI 无法在 DSH 不启动时读取统一 Read Model；Windows 与 Linux SSH 对同一 fixture 得到冲突状态；Pilot 对 v1 现场产生写入；CLI 与 DSH 各自实现一套状态判断。

### 4.5 解锁 P5 的规则（B-11 修订）

P4-CM1/2/3/5/6a 全部通过 ∧ P4-CM4 为「通过」「N/A（DSH 判否）」或「延后（DHR_50）」且已如实登记 ∧ P4 主报告（CM 部分）已落盘、其中显式登记 DM 组与三态收敛的延后状态 ∧ 风险与未验证项已记录 ∧ 用户在对话中明确同意进入 P5。

**DSH 三态收敛不再是 P5 解锁前置**（B-11）：DSH 轨（DHR_26 → DHR_49 → DHR_50）与 P5 并行推进，汇合点 = P5 DHR_30 的 DSH Bridge 条件部分与 DHR_31 的 DSH 附加客户端项——该两处开工 / 执行前必须已有 DHR_50 的三态结论，未有则该部分记「未执行，待 DHR_50」，P5 的 CLI 主线不受影响。DHR_50 收敛前，P5 阶段默认控制面为 Relay CLI（阶段默认，不是把 CLI 定位为回退）；DSH 判否时 DSH Bridge 转可选或暂停；P5~P9 不因 DSH 不可用整体终止。

**延后不得掩盖失败**：DHR_26 / DHR_49 已命中的止损事实与已登记的 DM 失败照常披露在 P4 主报告与 findings，不因并行推迟；「延后」只推迟收敛裁决，不推迟事实登记。

## 5. 覆盖、颗粒度与依赖查漏

| 检查 | 结论 |
|---|---|
| 覆盖 | 直接设计依据 design/06 §10「P4」由 DHR_25/27 承接；design/06「验收命题」节全称命题 **一条都不在 P4 关闭**（H1/H4/H9 归 P5/P6/P9；H3 仅 CLI↔DSH 子集在 DSH 通过时由 DHR_50 证明，B-11 前为 DHR_27）；design/02 B1 仅 legacy 零写子集（DHR_27）；design/05 §5 插件形态由 DHR_26（Host）+ DHR_49（Client）承接、§20 版本基线由 DHR_26 承接、§3.3 快速迭代期风险由 DHR_26 升级留证承接、§14 产品面由 DHR_27（H1/H4）+ DHR_50（H2/H3）分侧承接；P4-CM1/2/3/5/6a/6b/CM4 / DM1 / DM2 / DM3 / DM4a / DM4b / DM5a / DM5b / DM6 每条恰好一张卡承接（无共享承接，避免两侧互相以为对方已验；CM6 已拆分退役）；evidence/07、08 未参与拆计划。**白名单例外（已批准）**：列表投影 `relay.pilot-run-list/v1` 无 design 白名单正文的字段级定义，按 design/06 H3 子集 + §0.2 显式例外承接（用户 2026-08-18 批准，非漏写） |
| 颗粒度 | DHR_25=只读投影 + 跨终端一致性验收单元；DHR_26=Host 插件生命周期 + 版本基线 + 侦察落档验收单元；DHR_49=Client 构建配方 + 面板重建验收单元（本阶段唯一带真未知的单元，独立签收使判否不污染 Host 侧已成立的结论）；DHR_27=真实现场 + CLI 收口 + 主报告验收单元；DHR_50=跨客户端对证 + 三态人判 + 报告附录验收单元（B-11 拆出，使 CLI 收口不被桌面轨拖住）；可分别开工与签收 |
| 依赖 | B-11 起两支：CLI 收口支 `DHR_25 → DHR_27`；桌面轨支 `DHR_25 → DHR_26 → DHR_49 → DHR_50`，且 DHR_50 另依赖 DHR_27（满足条件 = `evidence/10` 主报告已落盘且 DHR_27 状态 ∈ {待验收, 已完成}，B-11 复审回写）。无环。DHR_49 对 DHR_26 的依赖是硬依赖（缺侦察落档不得开工）；DHR_50 对 DHR_49 的依赖接受「判否证据」作为满足条件，DSH 失败不阻断三态裁决 |

## 6. 计划完工

- [ ] DHR_25 / DHR_26 / DHR_49 / DHR_27 / DHR_50 全部销户（状态=已完成 或 已取消并留因）。
- [ ] P4-CM1/2/3/5/6a 全部有等价 pass 证据；CM4 与 CM6b 由 DHR_50 补录为 pass 或如实登记 N/A；P4-DM1 / DM2 / DM3 / DM4a / DM4b / DM5a / DM5b / DM6 事实已登记（缺侧一律记 N/A，不得由另一侧代绿）且三态由用户在 DHR_50 人判收敛完毕；P4-X 结论已记录。**P5 解锁不等本条整体完成**（§4.5，B-11）——只等 CM1/2/3/5/6a + 主报告 + 用户放行。
- [ ] DSH 版本基线（rc.6 → rc.7）与升级前后差异已落 findings；一切 DSH 结论均标注所在版本。
- [ ] P4 报告 `design/evidence/10-P4-多控制面Pilot报告.md` 落盘：主报告（DHR_27，CLI 结论 + 延后登记）与附录（DHR_50，对证 + 三态）两段齐备，含真实截图 / 终端转录、fixture hash、CLI 输出、DSH 结果、版本、实耗与裁决。
- [ ] P4-H 已向用户展示并由用户在对话中判断（H1/H4 随 DHR_27，H2/H3 随 DHR_50）；P5 是否解锁由用户明确表态。
- [ ] `dev_plan/README.md` 活跃计划表状态已更新。
