<!-- dh:devplan-index:v1 -->
<!-- dh:planning-no-event:v1 artifact="dev_plan/README.md" reason="2026-08-18 索引措辞对齐：状态列机读枚举 + 备注列记阶段闸、P4~P9 事件与证据落点说明、硬约束#1 改为 CLI 与 DSH 并行可配置替换（非回退）；同日随 DHR-B-10 机械同步 P4 行的任务 ID 清单与状态；2026-08-20 随 DHR-B-11 机械同步 P4/P5 行、P4 特殊阶段闸与通用规则的延后措辞（拆卡与闸规则变更本体在 P4/P5 计划正文，本索引不承载）；2026-08-21 随 DHR-B-15 机械同步 P5 行的任务 ID 清单（DHR_28~31 → 增 DHR_51/DHR_52）与状态备注（DHR_28 已 verify、DHR_29 拆三卡），拆卡本体在 P5 计划 §0.2 DHR-B-15 条" -->
# DH Relay DevPlan 入口

## 当前主线

目标产品形态以 [design/05](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md) 和 [design/06](../design/06-多控制面与Headless-SSH运行-设计补充.md) 共同为准：

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

当前交付采用严格的阶段闸：

```text
P4 多控制面最小 Pilot（CLI 必备控制面必过 + DSH 桌面控制面可判否）
  ↓ P4 基线 Gate 通过 + 用户明确放行
P5 Relay v2 持久内核与多控制面桥接
  ↓ P5 Gate 通过 + 用户明确放行
P6 Herdr 多账号与 Headless 执行底座
  ↓ P6 Gate 通过 + 用户明确放行
P7 DevHarness 多控制面单卡完整流水
  ↓ P7 Gate 通过 + 用户明确放行
P8 多卡编排与多控制面运行治理
  ↓ P8 Gate 通过 + 用户明确放行
P9 双平台、多控制面与迁移定型
```

后一阶段已经落盘，只表示路线和责任边界预先可见。前置阶段未通过时，后一阶段任务表的状态列仍填机读枚举「未开始」，阶段闸阻塞记在「备注」列（`blocked-by-phase-gate:Px`），一律不能开工。P4~P9 每份计划文首均带规划事件 marker（事件 `DHR-B-04`~`DHR-B-09`；P4 已于 2026-08-18 二次调整为 `DHR-B-10`、2026-08-20 三次调整为 `DHR-B-11`，P5 随 B-11 同步），审核 / 讲解 / 理解问答证据统一落 `design/evidence/09-P4至P9阶段计划-交叉审核记录.md`，该文件在派出 fresh 审核时创建；未审核前 `dh dh-relay` 的 R29 对这六份计划报红属预期状态。

## 活跃计划

| 计划 | 目标 | 当前状态 | 任务 ID |
|---|---|---|---|
| [P4-DSH工作台最小Pilot](./P4-DSH工作台最小Pilot-开发方案.md) | 先证明 Windows/SSH CLI 必备控制面独立成立，再评估 DSH 树外桌面控制面（可判否，与 P5 并行） | DHR_25 已完成（2026-08-18）；`DHR-B-11`（2026-08-20）拆 DHR_27 为 CLI 收口 + DHR_50 补录、解锁 P5 不等 DSH 三态 | DHR_25、DHR_26、DHR_49、DHR_27、DHR_50 |
| [P5-Relay-v2持久内核与DSH桥接](./P5-Relay-v2持久内核与DSH桥接-开发方案.md) | 建立客户端中立协议、Detached Runtime、参考 CLI、恢复和 basic-agent-task | DHR_28 已完成（verify `0e2dd54`）；`DHR-B-15`（2026-08-21）把 DHR_29 拆为 Store（DHR_29）/ 宿主·lease·发号（DHR_51）/ RPC·握手（DHR_52）三卡 | DHR_28~31、DHR_51、DHR_52 |
| [P6-Herdr多账号执行底座](./P6-Herdr多账号执行底座-开发方案.md) | 接入多账号 Codex/Claude Code，验证 DSH-off 和 Linux SSH Herdr 路径 | blocked-by-phase-gate:P5 | DHR_32~35 |
| [P7-DevHarness单卡完整流水](./P7-DevHarness单卡完整流水-开发方案.md) | 在 DSH 关闭状态下，用 CLI + Herdr 跑通一张标准卡 S0~E13 与 verify | blocked-by-phase-gate:P6 | DHR_36~40 |
| [P8-多卡编排与运行治理](./P8-多卡编排与运行治理-开发方案.md) | 多卡、重编排、诊断、Outbox、归档和 Oracle，治理对象可由 CLI/DSH/Pi处理 | blocked-by-phase-gate:P7 | DHR_41~45 |
| [P9-双平台定型与迁移](./P9-双平台定型与迁移-开发方案.md) | Windows DSH 与 CLI 并行可替换、Linux SSH Headless、发布和遗留处置 | blocked-by-phase-gate:P8 | DHR_46~48 |

文件名保留首次落盘时的 DSH/P5/P9 命名，文件内标题和责任已经按 design/06 更新。后续是否重命名路径放到 P9 统一迁移，当前避免产生额外链接和历史噪声。

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

## 冻结计划

| 计划 | 处置 |
|---|---|
| [P1-最小接力PoC](./P1-最小接力PoC-开发方案.md) | 已完成的历史基线，继续保留 |
| [P2-完整流水](./P2-完整流水-开发方案.md) | 冻结废弃。DHR_04 已完成成果保留，其余旧卡停止生效，能力由 P5~P8 重新承接 |
| [P3-可配置终端后端与Herdr底座](./P3-可配置终端后端与Herdr底座-开发方案.md) | 冻结废弃。Herdr 方向保留，实施由 P6 接管 |

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
