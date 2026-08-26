# 三 Agent 终端编排 · 正式晋升决策记录

<!-- dh:planning-event:v1 id=DHR-A-16 stage=A-prime artifact=design/records/01-三Agent终端编排-正式晋升决策记录.md review=../evidence/12-三Agent终端编排正式设计-交叉审核记录.md#review-a16 understanding=../evidence/12-三Agent终端编排正式设计-交叉审核记录.md#understanding-a16 -->

## 决策

- **DR-ID**：`DHR-DR-01`
- **日期**：2026-08-26
- **来源事件**：`DHR-A-15`
- **决定**：用户整版确认后，将 `design/09-三Agent可交互终端与CLI优先编排-产品设计与验收.md` 作为唯一当前正式设计输入；01/02/05/06 保留为历史，不再作为 B 阶段输入。
- **边界**：本决定不授权 B-adjust、resolver 迁移、新根 start、DHR_30 扩范围或任何开发卡开工。

## 旧方案处置

| 原来源 | 状态 | replacement | 适用阶段 |
|---|---|---|---|
| `design/01` | `historical`，其安全基础约束 `retained` | 09 §13.2、§13.4 | P1 历史基线；列出的约束继续生效 |
| `design/02` | `historical/deferred`，其流程安全原则 `retained` | 09 §13.2、§13.5 | P2 历史目标；卡序不自动继承 |
| `design/05` | `deferred` | 09 §13.3；未来统一 Runtime 协议上的新立项 | DSH 后续方向 |
| `design/06` | `superseded/deferred` | 09 §7、§13.3 | CLI + 三终端当前主线；未来客户端另立项 |
| `evidence/11` | `historical` | 09 全文 | 方向形成记录，不是正式合同 |

## 旧验收 ID 的不可变去向

| 旧 canonical ID | 状态 | replacement / 适用阶段 |
|---|---|---|
| `HC-P1-A1`、`HC-P1-A2`、`HC-P1-A5`、`HC-P1-A6`、`HC-P1-A8` | `retained` | 09 §13.4；当前不变量 |
| `HC-P1-A3`、`HC-P1-H1`、`HC-P1-H2` | `historical` | 保留 P1 特定剧本/PoC 事实，不进入当前计划 |
| `HC-P1-A4` | `superseded` | `HC-3AT-A3`、`HC-3AT-A11`、`HC-3AT-A20` |
| `HC-P1-A7` | `superseded` | `HC-3AT-A1`、`HC-3AT-A4`、`HC-3AT-A12`、`HC-3AT-A20`、`HC-3AT-H1` |
| `HC-P2-H3`、`HC-P2-H4` | `superseded` | `HC-3AT-H1` 至 `HC-3AT-H5` |
| `HC-P2-H5` | `deferred` | 未来重新引入远端 test push 时另立设计与人验 |
| `HC-CTRL-H1`、`HC-CTRL-H2`、`HC-CTRL-H3`、`HC-CTRL-H4`、`HC-CTRL-H6` 至 `HC-CTRL-H12` | `retained` | 09 §13.4；按表内适用阶段继续验证 |
| `HC-CTRL-H5` | `superseded` | `HC-3AT-A10`、`HC-3AT-H4`；不得再引用“无人在线自动跨节点” |
| P2 `B1` 至 `B18` | `historical/deferred` | 09 §13.5；后续 B-adjust 按新设计逐项重拆 |

## 映射与实施边界

`acceptance-id-mapping.json` 只登记仍由当前正式输入承载的 legacy canonical ID；本记录保存其余 ID 的历史状态，避免把冻结项伪装成活跃验收。新 `HC-3AT-*` 是 09 的直接 canonical ID，不伪造 legacy mapping。

`dh_relay/plans/` 与 `dh_relay/archive/` 可由 Git 管理，`dh_relay/runtime/` 已精确忽略；resolver 迁移卡完成并验收 `HC-3AT-A19/A22` 前，现役代码仍按旧根合同运行，禁止启用新根 start。
