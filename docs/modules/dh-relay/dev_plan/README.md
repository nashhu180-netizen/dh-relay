<!-- dh:devplan-index:v1 -->
<!-- dh:planning-no-event:v1 artifact="dev_plan/README.md" reason="2026-08-18 索引措辞对齐；2026-08-20 随 DHR-B-11 同步 P4/P5；2026-08-21 随 DHR-B-15 同步 P5 拆卡；2026-08-26 随 DHR-B-19/B-20 同步 P7/P8；2026-08-27 随已确认 DHR-B-21 机械同步 P7/P8 当前范围、P8 由冻结改为阶段阻塞、DHR_44 取消和 P5/P6 不扩范围边界；同日机械回填 DHR_53 旧现场已归档删除；2026-08-30 DHR_62 机械同步 DHR_32/33 待验收、DHR_34 阻塞、DHR_35 未开始及 P6 任务列表补回 DHR_61 的已有计划状态，不形成新 planning event；2026-08-31 随已确认 DHR-B-33 机械同步 P6 行（DHR_32~34/61/63~68 已完成、新增 DHR_69、DHR_35 blocked-by:DHR_69），不形成新 planning event；同日机械回填 DHR_69 D-start 进行中，不形成新 planning event；2026-09-01 随已确认 DHR-B-34 机械同步 P6 行（DHR_69 已完成、新增 DHR_70、DHR_35 改 blocked-by:DHR_70），不形成新 planning event；2026-09-02 随已确认 DHR-B-35 机械同步 P6 行（DHR_70 已完成、新增 DHR_71/72/73、DHR_35 改 blocked-by:DHR_72），不形成新 planning event；同日随已确认 DHR-B-36 机械同步 P6 行（DHR_71 进行中、隔离清单 2→4），不形成新 planning event；2026-09-04 随已确认 DHR-B-40 机械同步 P6 行（新增 DHR_75、DHR_72 进行中且 blocked-by:DHR_75），不形成新 planning event；2026-09-05 随已确认 DHR-B-41 机械同步 P6 行（新增 DHR_76、DHR_75 blocked-by:DHR_76、DHR_72 继续 blocked-by:DHR_75）；同日随已确认 DHR-B-42 机械同步 DHR_76 异常清理失败返回合同；同日随用户认可releasePacket机械同步DHR_76已完成并解除DHR_75的blocked-by，不形成本索引自己的planning event；2026-09-06 随已确认 DHR-B-43 机械同步 P6 新增 DHR_77、DHR_35 改 blocked-by:DHR_77，不形成本索引自己的 planning event" -->
# DH Relay DevPlan 入口

## 当前主线

当前阶段的唯一正式设计基准是 [design/10 薄 RelayPlan 与显式节点边界](../design/10-薄RelayPlan与显式节点边界-产品设计调整.md)。[design/05](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md) 与 [design/06](../design/06-多控制面与Headless-SSH运行-设计补充.md) 是已冻结的历史方向资料，不再作为当前阶段的拆计划依据。

```text
Detached Relay Runtime
  持有持久受控工作流和运行真相

Relay CLI
  所有平台必须具备的参考控制客户端

DeepSeek Harness
  Windows 首选桌面工作台，可替换、可缺席

Pi
  可选 TUI 客户端与 Native Agent Executor

Herdr
  Codex、Claude Code 等外部交互式施工宿主
```

本套方案不依赖 DSH 生存。DSH 未安装、启动失败、升级失败或主动关闭时，Relay Runtime、Herdr、Process、Gate 和 Finalizer 继续运行；用户通过 Relay CLI、Pi 或其他实现稳定协议的客户端操作。Linux 笔记本以 SSH + Relay CLI/Pi + Herdr 为正式 Headless 路径。

## 当前总约束：design/10

[design/10 薄 RelayPlan 与显式节点边界](../design/10-薄RelayPlan与显式节点边界-产品设计调整.md) 是当前阶段的产品设计基准。P7 实施通用基础与单任务实卡，P8 实施真实多任务/跨项目调度和运行中 Plan change。P5~P9 必须围绕这份基准协作，不得创建与其冲突的 Plan、Ticket、Workflow、Pair、Review Batch、Role Relay、恢复或运行历史语义。

| 计划 | 与 design/10 的关系 | 当前边界 |
|---|---|---|
| P5 | 前置基础 | DHR_30/31 只提供稳定 Runtime、CLI、Read Model 与 basic-agent-task 基础；不得倒灌 P7 的业务 Workflow、Pair 或 Review Batch。 |
| P6 | 前置执行底座 | 提供 P7 所需的 Herdr/Profile 能力与真实执行证据；宿主观测不能替代 design/10 规定的业务状态或 Result。 |
| P7 | 基础实施 | 以 design/10 为唯一正式设计输入，实施 DHR_53~60；Core 不读取 dev-harness task_type/Recipe。 |
| P8 | 跨项目实施 | 实施 DHR_41/42/43/45；DHR_44 历史 Hook/Outbox/周报已取消。P7 Gate 通过只解除阻塞，不自动开工。 |
| P9 | 范围外暂缓 | 双平台定型、发布和迁移未被 design/10 承接；当前冻结暂缓。 |

本节是跨计划的当前协作约束，不修改任何任务卡的目标、验收、依赖、状态或开工授权。各计划若要实质调整其范围或验收，仍须在对应阶段执行 B-adjust、审核与用户确认。

当前交付采用严格的阶段闸：

```text
P4 多控制面最小 Pilot（CLI 必备控制面必过 + DSH 桌面控制面可判否）
  ↓ P4 基线 Gate 通过 + 用户明确放行
P5 Relay v2 持久内核与多控制面桥接
  ↓ P5 Gate 通过 + 用户明确放行
P6 Herdr 多账号与 Headless 执行底座
  ↓ P6 Gate 通过 + 用户明确放行
P7 通用显式接力基础与单任务实卡
  ↓ P7 Gate 通过 + 用户明确放行
P8 跨项目多任务编排与运行中计划调整
  ↓ P8 Gate 通过不自动解锁 P9
P9 仍冻结暂缓
```

后一阶段已经落盘，只表示路线和责任边界预先可见。前置阶段未通过时，任务状态仍使用五枚举，阶段闸阻塞写在备注（`blocked-by-phase-gate:Px`）。P8 已有正式范围，但 P7 Gate 通过只解除阻塞，仍须用户另行授权开工；P9 继续冻结，须新的正式设计输入和 B-adjust 才能恢复。P7/P8 最新调整统称 `DHR-B-21`，机器事件分别为 `DHR-B-21-P7/P8`；审核、理解与确认见 [evidence/18](../design/evidence/18-P7P8通用节点与跨项目任务编排-交叉审核记录.md)。

## 活跃计划

| 计划 | 目标 | 当前状态 | 任务 ID |
|---|---|---|---|
| [P4-DSH工作台最小Pilot](./P4-DSH工作台最小Pilot-开发方案.md) | 先证明 Windows/SSH CLI 必备控制面独立成立，再评估 DSH 树外桌面控制面（可判否，与 P5 并行） | DHR_25 已完成（2026-08-18）；`DHR-B-11`（2026-08-20）拆 DHR_27 为 CLI 收口 + DHR_50 补录、解锁 P5 不等 DSH 三态 | DHR_25、DHR_26、DHR_49、DHR_27、DHR_50 |
| [P5-Relay-v2持久内核与DSH桥接](./P5-Relay-v2持久内核与DSH桥接-开发方案.md) | 建立客户端中立协议、Detached Runtime、参考 CLI、恢复和 basic-agent-task | **G01-P5 阶段闸已过（2026-08-29 用户对话放行）**；六卡全部完成有 verify | DHR_28~31、DHR_51、DHR_52 |
| [P6-Herdr多账号执行底座](./P6-Herdr多账号执行底座-开发方案.md) | 接入多账号 Codex/Claude Code，验证 DSH-off 和 Linux SSH Herdr 路径 | 已解锁（2026-08-29）；DHR_32/33/34/61/63~72/74/76 已完成；DHR_75 待验收；DHR_73、DHR_77 未开始；DHR_35 进行中且 `blocked-by:DHR_77` | DHR_32~35、DHR_61、DHR_63~77（DHR_62 不属任务卡） |
| [P7-DevHarness单卡完整流水](./P7-DevHarness单卡完整流水-开发方案.md) | 建立 PlanHome/TaskRef/通用节点与 Result 基础，并用一张真实外部任务验通 | `DHR-B-21` 已确认；DHR_53 旧实现已归档并删除 worktree/branch，当前暂停待前置 Gate 与新施工授权；DHR_54~60 未开始；blocked-by-phase-gate:P6，并等待 DHR_30 稳定接口 | DHR_53~60 |
| [P8-多卡编排与运行治理](./P8-多卡编排与运行治理-开发方案.md) | 实现真实跨项目多 TaskRef 调度、Decision/B-adjust 后 Plan change、PlanHome archive 与独立 Oracle | `DHR-B-21` 已确认；DHR_41/42/43/45 未开始且 blocked-by-phase-gate:P7；DHR_44 已取消；未授权开工 | DHR_41~45 |

文件名保留首次落盘时的 DSH/P5/P9 命名，文件内标题和责任已经按 design/06 更新。后续是否重命名路径放到 P9 统一迁移，当前避免产生额外链接和历史噪声。

P7 旧 `DHR_36~40/P7-M1~M9` 作为 `DHR-B-07` 历史保留，状态为已取消且不复用；只有当前 P7 Gate 能解除 P8 的阶段阻塞。

## 控制面硬约束

所有阶段共同遵守：

1. Relay CLI 是必备客户端，DSH 和 Pi 是可选客户端；CLI 与 DSH 是并行、可配置替换的两种控制面，CLI 不是保底或应急路径。
2. 客户端断开不能取消 Run。
3. 没有客户端在线时，自动节点继续；需要用户输入时留下持久 Attention 并暂停。
4. 必经 Workflow 角色不得只有 DSH-only Executor。
5. Start、Attention、Replan 和 Approval 由 Relay 保存请求和 Receipt。
6. DSH、Pi 和 CLI 读取同一 Read Model，不能各自推导业务状态。
7. Linux 无 GUI、仅 SSH 是正式支持路径，不属于降级演示。
8. GUI 强证据缺失时必须拒绝、路由或暂停，不能误报通过。

## P4 的特殊阶段闸

P4 分为：

```text
P4-CM 必备控制面闸（CLI）
  普通 CLI + Windows + Linux SSH + fake/v1 Read Model

P4-DM 桌面控制面轨（DSH，可判否）
  Host/Client Plugin 与最小 Web 面板
```

只有 P4-CM 是 P5 核心主线的硬前置（B-11 口径：CM1/2/3/5/6a + 主报告落盘；CM4 跨客户端一致性可记「延后（DHR_50）」或 DSH 判否时记 N/A）。P4-DM 可以通过、受限或判否，且其三态收敛（DHR_50）**与 P5 并行、不再是 P5 解锁前置**——汇合点在 P5 DHR_30 的 DSH Bridge 条件部分与 DHR_31 的 DSH 附加客户端项（须有 DHR_50 结论才执行，详见 P4 §4.5，B-11）。DHR_50 收敛前或 DSH 判否时，P5 阶段默认控制面为 Relay CLI（阶段默认，不是把 CLI 定位为回退），后续再决定是否建设 Pi TUI 或其他客户端。P4 解锁 P5 所要求的「人类体验判断已记录」仅指 H1/H4（随 DHR_27 主报告）；H2/H3 随 DHR_50 补录，不阻塞 P5（B-11，与下方通用规则第 2 条的适用关系以此为准）。

## 冻结或暂缓计划

| 计划 | 处置 |
|---|---|
| [P1-最小接力PoC](./P1-最小接力PoC-开发方案.md) | 已完成的历史基线，继续保留 |
| [P2-完整流水](./P2-完整流水-开发方案.md) | 冻结废弃。DHR_04 已完成成果保留，其余旧卡停止生效，能力由 P5~P8 重新承接 |
| [P3-可配置终端后端与Herdr底座](./P3-可配置终端后端与Herdr底座-开发方案.md) | 冻结废弃。Herdr 方向保留，实施由 P6 接管 |
| [P9-双平台定型与迁移](./P9-双平台定型与迁移-开发方案.md) | 冻结暂缓。双平台定型、发布与迁移不在 design/10 当前范围；DHR_46~48 保留历史计划身份，不得开工 |

旧任务 ID 不复用。历史计划全文可从 Git 历史读取。

## 阶段闸通用规则

下一阶段解除阻塞必须同时满足：

1. 前一阶段核心机器验收全部通过。
2. 前一阶段要求的人类体验判断已经记录。
3. 未验证项和风险已明确，不用下一阶段掩盖当前失败。
4. 用户在对话中明确同意进入下一阶段。

可选客户端（DSH / Pi）验收可以是通过、受限、不适用，或**延后**（B-11：延后必须在来源计划里显式钉住汇合点与补录卡，延后只推迟收敛裁决、不推迟失败事实的登记与披露），不能掩盖核心失败，也不能因 DSH 单点失败否决已经证明独立可用的 Relay Runtime 主线。

设计总方向的确认不等于 P4~P9 全部开工授权。每张任务卡仍按 DevHarness 入口闸单独分流、确认和施工。

## 任务 ID 纪律

- `DHR_04`：P2 已完成成果，继续作为策略和迁移 Oracle。
- `DHR_05~DHR_24`：冻结计划中的历史编号，不复用。
- `DHR_25` 起：多控制面与 Headless 阶段主线。

