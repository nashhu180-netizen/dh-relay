<!-- dh:devplan-index:v1 -->
<!-- dh:planning-no-event:v1 artifact="dev_plan/README.md" reason="2026-08-18 索引措辞对齐：状态列机读枚举 + 备注列记阶段闸、P4~P9 事件与证据落点说明、硬约束#1 改为 CLI 与 DSH 并行可配置替换（非回退）；不改阶段顺序、任务 ID 与闸规则" -->
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

后一阶段已经落盘，只表示路线和责任边界预先可见。前置阶段未通过时，后一阶段任务表的状态列仍填机读枚举「未开始」，阶段闸阻塞记在「备注」列（`blocked-by-phase-gate:Px`），一律不能开工。P4~P9 每份计划文首均带规划事件 marker（事件 `DHR-B-04`~`DHR-B-09`），审核 / 讲解 / 理解问答证据统一落 `design/evidence/09-P4至P9阶段计划-交叉审核记录.md`，该文件在派出 fresh 审核时创建；未审核前 `dh dh-relay` 的 R29 对这六份计划报红属预期状态。

## 活跃计划

| 计划 | 目标 | 当前状态 | 任务 ID |
|---|---|---|---|
| [P4-DSH工作台最小Pilot](./P4-DSH工作台最小Pilot-开发方案.md) | 先证明 Windows/SSH CLI 必备控制面独立成立，再评估 DSH 树外桌面控制面（可判否） | B 已审核并由用户确认（2026-08-18），未授权开工 | DHR_25~27 |
| [P5-Relay-v2持久内核与DSH桥接](./P5-Relay-v2持久内核与DSH桥接-开发方案.md) | 建立客户端中立协议、Detached Runtime、参考 CLI、恢复和 basic-agent-task | blocked-by-phase-gate:P4-CM | DHR_28~31 |
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

只有 P4-CM 是 P5 核心主线的硬前置（CM4 跨客户端一致性在 DSH 判否时记 N/A、延后 P5）。P4-DM 可以通过、受限或判否。DSH 判否时，P5 阶段默认控制面为 Relay CLI（阶段默认，不是把 CLI 定位为回退），后续再决定是否建设 Pi TUI 或其他客户端。

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

可选客户端（DSH / Pi）验收可以是通过、受限或不适用，不能掩盖核心失败，也不能因 DSH 单点失败否决已经证明独立可用的 Relay Runtime 主线。

设计总方向的确认不等于 P4~P9 全部开工授权。每张任务卡仍按 DevHarness 入口闸单独分流、确认和施工。

## 任务 ID 纪律

- `DHR_04`：P2 已完成成果，继续作为策略和迁移 Oracle。
- `DHR_05~DHR_24`：冻结计划中的历史编号，不复用。
- `DHR_25` 起：多控制面与 Headless 阶段主线。
