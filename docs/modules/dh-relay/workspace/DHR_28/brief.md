<!-- dh:v1 · brief.md — 工作区封面。🔵 前置填。写"终点"，不写路线。完成条件 = 任务卡验收口径的逐字复制 + 出处回链；DevPlan 是唯一权威定义，本文件是施工现场的只读副本，口径变更以 DevPlan 为准、本文件跟改并在 progress 记一笔。 -->
# brief — DHR_28 Runtime 语言/宿主 ADR 与客户端中立协议冻结

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---------|---------|-------------|
| DHR_28 | P5 | DevPlan §3.2 任务卡 |

## 目标 (Outcome)

依据 P4 控制面证据产出 Runtime 语言 / 独立进程形态 ADR 与 Agent 宿主归属 ADR，冻结 P5 最小协议集（`relay.rpc/v1`、`relay.run/v2`、`relay.event/v2`、`relay.run-state/v1`、`relay.launch-receipt/v2`、`relay.checkpoint/v2`、`relay.result/v2`）、reason code、兼容矩阵与 golden fixture，交付独立校验器，并对 P4 实测的 v1 协议六条缺口给出逐条处置表——作为后续 Runtime（DHR_29）、CLI（DHR_30）与任何客户端的唯一契约来源。

## Zero-context 自查

新 agent 只读本 `brief.md` + DevPlan（`dev_plan/P5-Relay-v2持久内核与DSH桥接-开发方案.md` §1 概述、§2.2 复用与禁改边界、§2.3 阶段专属约束、§3.2 DHR_28 任务卡、§4.1 P5-M 表、§3.3 标准档共同收口条件）即可开工：终点（ADR + 冻结协议 + golden fixture + 独立校验器 + 缺口处置表）、边界（不实现 Runtime/不写 DSH UI/不冻结 P7-P8 正式版本/协议禁入各私有类型/Core 不得嵌入 DSH Web 进程）、谁验（本卡 5 条验收口径全部机器证）、证据口径（正反 fixture 可由独立校验器验证；ADR 需回答 §2.3 四问；缺口处置表需可 grep 锚点 `v1-gap-disposition:`）均已在 brief 与 DevPlan 任务卡中写明，不依赖本次对话的隐含上下文。语言/代码根的裁决方式（ADR 产出后摆给用户点选）已作为「何时必须停下问人」第①条列出，不需要施工者自行判断分流规则。

## 完成条件 ★必写（= 覆盖任务验收口径的并集，标好谁验）

| # | 条件 | 谁验（AI / 人） | 出处（任务 ID / 来源设计文档 + 验收 ID） |
|---|------|---------------|--------------------------------|
| 1 | 协议正反 fixture 可由独立校验器验证；未知字段、未知版本、能力不匹配 fail-closed | AI | DHR_28 / dev_plan/P5-Relay-v2持久内核与DSH桥接-开发方案.md#dhr_28 · design/02-完整流水-产品设计与验收.md#61-ai-自动验收栏 B1 · P5-M6 |
| 2 | 协议不导入 DSH / Cordis / Pi / Herdr / DevHarness 私有类型；DSH 与 Runtime 不共享活动对象或内存状态（fixture 与 schema 静态可证） | AI | DHR_28 / dev_plan/P5-Relay-v2持久内核与DSH桥接-开发方案.md#dhr_28 · design/05-DeepSeek-Harness插件化与专属工作台-可行性评估.md#62-生产协议 |
| 3 | （契约级）任一必经角色不能只声明 `dsh-agent`（schema 层拒绝） | AI | DHR_28 / dev_plan/P5-Relay-v2持久内核与DSH桥接-开发方案.md#dhr_28 · design/06-多控制面与Headless-SSH运行-设计补充.md#11-验收命题 H6 |
| 4 | ADR 落盘且回答 §2.3「Agent 宿主 ADR 必答」四问；语言选择依据引用 P4 报告证据 | AI | DHR_28 / dev_plan/P5-Relay-v2持久内核与DSH桥接-开发方案.md#dhr_28 · §2.3 阶段专属约束「Agent 宿主 ADR 必答」「语言选择原则」 |
| 5 | （B-13 新增）契约文档含对 P4 主报告 §4「v1 协议缺口清单」六条实测缺口的逐条处置表（每条：采纳进 v2 字段 / 显式不采纳 + 理由；含可 grep 锚点 `v1-gap-disposition:`）——缺口含：①run 现场不记录 `workflow_name / summary / trigger / trigger_by`；②无 run 级状态；③无节点 title；④无 run 级 `attempt`（「缺省≠1」语义）；⑤`brief_ref` 等 locator 必须相对/符号化；⑥`terminal_state` 是会话观测态、须与任务结果分字段建模。处置方向由本卡 ADR 定，不预设结论 | AI | DHR_28（B-13） / dev_plan/P5-Relay-v2持久内核与DSH桥接-开发方案.md#dhr_28 · design/evidence/10-P4-多控制面Pilot报告.md §4「v1 协议缺口清单」 |

## 边界 (Boundaries)

- In scope：Runtime 语言 / 独立进程形态 ADR；Agent 宿主归属 ADR（回答 process executor / pi-agent / DSH Native Agent / Herdr Agent 四问）；冻结 P5 最小协议集（`relay.rpc/v1`、`relay.run/v2`、`relay.event/v2`、`relay.run-state/v1`、`relay.launch-receipt/v2`、`relay.checkpoint/v2`、`relay.result/v2`）+ reason code + 兼容矩阵 + golden 正反 fixture；`resolved-plan/host-observation/attention/approval` 只定 v0 形状与 fixture；独立校验器；v1 六条缺口逐条处置表。落点：新 Runtime 代码根（本卡 ADR 裁决）下 `contracts/` 与校验器。
- Out of scope：不实现 Runtime（归 DHR_29）；不写 DSH UI；不冻结 P7/P8 才承重的 `resolved-plan / attention / approval` 正式版本（只定 v0 形状）；不得把 Core 嵌入 DSH Web 进程（design 已拒绝，非可选项，需回 A 才能改）；不改 `tools/`（P1 PowerShell Runner，只读复用为 Oracle）；不改 `.dh-runtime/relay/`（v1 现场，只读发现与投影，不 resume、零新写）；不改 DeepSeek Harness 上游源码（禁改，Bridge 只走树外）；协议不得导入 DSH / Cordis / Pi / Herdr / DevHarness 私有类型；不因 DSH 增强轨结论改变协议中立性。
- 何时必须停下问人：①ADR 草案出来后，语言（Go/TS）与代码根落点摆给用户点选（已由用户 2026-08-20 分流确认走这条路径）；②E11 一次性确认本地收口授权包；③P0/P1 三轮不收敛。

## 触及子系统（收口时更新其 as-built）

无（新建 `contracts/` 与校验器；as-built 首份快照归 DHR_29 起）——理由：本卡是新建协议契约与 ADR 文档，不改动任何现役子系统（`tools/`、`.dh-runtime/relay/` 均只读），没有既有 as-built 快照需要覆盖更新；新 Runtime 代码根本身是全新落点，其首份 as-built 快照留给真正落地实现的 DHR_29 收口时建立。
