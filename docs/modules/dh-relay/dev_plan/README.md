<!-- dh:devplan-index:v1 -->
# DH Relay DevPlan 入口

## 当前主线

目标产品形态以 [design/05](../design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md) 为准：DeepSeek Harness 承担专属工作台，独立 Relay Runtime 承担持久受控工作流，Herdr 承担 Codex、Claude Code 等外部交互式施工 Agent。

当前交付采用严格的阶段闸：

```text
P4 DSH 工作台最小 Pilot
  ↓ P4 Gate 通过 + 用户明确放行
P5 Relay v2 持久内核与 DSH Bridge
  ↓ P5 Gate 通过 + 用户明确放行
P6 Herdr 多账号执行底座
  ↓ P6 Gate 通过 + 用户明确放行
P7 DevHarness 单卡完整流水
  ↓ P7 Gate 通过 + 用户明确放行
P8 多卡编排与运行治理
  ↓ P8 Gate 通过 + 用户明确放行
P9 双平台定型与迁移
```

后一阶段已经落盘，只表示路线和责任边界预先可见。前置阶段未通过时，后一阶段状态一律为 `blocked-by-phase-gate`，不能开工。

## 活跃计划

| 计划 | 目标 | 当前状态 | 任务 ID |
|---|---|---|---|
| [P4-DSH工作台最小Pilot](./P4-DSH工作台最小Pilot-开发方案.md) | 验证树外 Host/Client 插件、最小 UI、v1/fake 只读桥接和 Windows 体验 | 待 fresh 审核，未授权开工 | DHR_25~27 |
| [P5-Relay-v2持久内核与DSH桥接](./P5-Relay-v2持久内核与DSH桥接-开发方案.md) | 建立平台无关协议、Detached Runtime、恢复与最小端到端任务 | blocked-by-phase-gate:P4 | DHR_28~31 |
| [P6-Herdr多账号执行底座](./P6-Herdr多账号执行底座-开发方案.md) | 接入本机多账号 Codex/Claude Code、身份与 fallback、真实施工 | blocked-by-phase-gate:P5 | DHR_32~35 |
| [P7-DevHarness单卡完整流水](./P7-DevHarness单卡完整流水-开发方案.md) | 用一张真实标准档卡跑通 S0~E13 与 verify | blocked-by-phase-gate:P6 | DHR_36~40 |
| [P8-多卡编排与运行治理](./P8-多卡编排与运行治理-开发方案.md) | 多卡、重编排、诊断、Outbox、归档和独立 Oracle | blocked-by-phase-gate:P7 | DHR_41~45 |
| [P9-双平台定型与迁移](./P9-双平台定型与迁移-开发方案.md) | Windows/Linux 定型、升级兼容、遗留处置与发布 | blocked-by-phase-gate:P8 | DHR_46~48 |

## 冻结计划

| 计划 | 处置 |
|---|---|
| [P1-最小接力PoC](./P1-最小接力PoC-开发方案.md) | 已完成的历史基线，继续保留 |
| [P2-完整流水](./P2-完整流水-开发方案.md) | 冻结废弃。DHR_04 已完成成果保留，其余旧卡停止生效，能力由 P5~P8 重新承接 |
| [P3-可配置终端后端与Herdr底座](./P3-可配置终端后端与Herdr底座-开发方案.md) | 冻结废弃。Herdr 方向保留，实施由 P6 接管 |

旧任务 ID 不复用。历史计划全文可从 Git 历史读取。

## 阶段闸通用规则

下一阶段解除阻塞必须同时满足：

1. 前一阶段机器验收全部通过。
2. 前一阶段要求的人类体验判断已经记录。
3. 未验证项和风险已明确，不用下一阶段掩盖当前失败。
4. 用户在对话中明确同意进入下一阶段。

设计总方向的确认不等于 P4~P9 全部开工授权。每张任务卡仍按 DevHarness 入口闸单独分流、确认和施工。

## 任务 ID 纪律

- `DHR_04`：P2 已完成成果，继续作为策略和迁移 Oracle。
- `DHR_05~DHR_24`：冻结计划中的历史编号，不复用。
- `DHR_25` 起：DSH 阶段主线。
