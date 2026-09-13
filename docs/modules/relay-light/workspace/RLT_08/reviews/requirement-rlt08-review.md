# requirement 复核 — RLT_08

- **身份**：rlt08-review（独立复核 worker，未参与施工），复核路 `requirement`（normal Recipe 三路之二）
- **模型自报**：Devin CLI / SWE-2 Max
- **日期**：2026-09-13
- **输入清单**：`dispatch/README.md`、`dispatch/review.md`、`brief.md`、`task_plan.md`、`progress.md`、`findings.md`、`git diff master -- AGENTS.md`、design/01 §11 四条 HC oracle 原文、§0.3、§1.3、§4.5.2/4.5.3、§14 第 7 条、DevPlan §RLT_08 卡（`P1-RelayLight-开发方案.md` L286–301）、两份 adapter 模板首行
- **方法**：只读；oracle 逐字比对，机器证由复核者本机复跑（同 code-round1 记录，此处只引结论）

## 一、四条 HC oracle 逐条对照

| HC | oracle 原文（design/01 §11） | 判定 | 事实 |
|---|---|---|---|
| HC-RL-A33 | 仓内 `AGENTS.md` 阅读矩阵含指向 relay-light skill 的索引行；dev-harness 未被改动 | **命中** | 前半：`## 任务类型阅读矩阵` 边界内恰 1 行（L90）指向仓内 `tools/relay-light/skill/SKILL.md` + 双 adapter。后半：B1 动笔前三摘要基线（head=`00c035c`，tracked/untracked 均为空输入哈希）与 B3 复算 `cmp` 逐项一致——且两端 tracked diff 皆为空哈希，oracle 证法「`git diff` 对 dev-harness 仓为空」字面亦成立（基线摘要法是等价且更严的取证，外部仓本来就 clean） |
| HC-RL-A28 | AGENTS.md 新增 relay-light 编排协议段，且现有 Runner 铁律已标「冻结流水」 | **命中** | `## relay-light 编排协议段` 新增于 L40（Runner 段前，并列互不隶属）；Runner 通用铁律第 2 条行尾标「有 RELAY_RECEIPT 即冻结 Runner 流水，不交叉执行 relay-light」。DevPlan 版附加条件「显式登记 B-adjust 窄例外」同见 L46 |
| HC-RL-A34 | 流水判定：监工 prompt 模板首行含 `[relay-light] worker · node … · agent …#… · workspace …` 标头；AGENTS 段含「见此标头即完成即停不等 node_closed，有 RELAY_RECEIPT 即冻结 Runner 流水」判定句 | **命中** | 两份 adapter ```` ```text ```` 模板首行即该标头（逐字节一致，`adapter_count=2`）；AGENTS L44 含逐字判定句，且内嵌标头与 adapter 首行同一字面量，均可单行 `rg -F` grep |
| HC-RL-A29 | 模块身份落地：slug、`docs/modules/relay-light/`、`tools/relay-light/`、verify scope 英文 `relay-light`；AGENTS 的「本仓只有一个模块」与 `dh` 自动选模块描述已同步改 | **命中** | 四项身份 L12/L97 双处命中（含英文 `` `verify scope = `relay-light` ``）；旧单模块三变体零命中，`dh` 小节改「多个模块须显式指定」；`dh relay-light` 实跑首行 `=== dh-check: relay-light ===` 可解析（25 条存量失败另记 F-4，不混入解析结论） |

四条全命中，无「部分」「未命中」。

## 二、DevPlan §RLT_08 非目标核对（未被越过）

| 非目标 | 结论 | 事实 |
|---|---|---|
| 不重写或弱化现役 Runner 铁律 | **未越过** | 整卡 diff 中宪章七条、Runner 通用铁律 1/3/4/5/6 与施工/复核 worker 小节零 `-` 行；第 2 条原句逐字保留、仅行尾追加冻结分流窄句 |
| 不改 dev-harness | **未越过** | 外部仓三摘要基线前后 `cmp` 全同；本仓 `tools/relay-light/skill/**` 与全部非允许路径零触碰（`master...HEAD` 22 文件 + 三现场集合均只含 `AGENTS.md` 与 RLT_08 workspace） |
| 窄例外不得延伸到设计方案/验收清单或接力之外 | **未越过** | L46 例外闭集 = 任务卡、开发方案任务行、接力计划追加，且「设计与验收仍走 dev-harness」逐字在场；限定语「relay-light 运行中」把例外锁在接力之内，未扩及 Runner 或其他流水 |

## 三、实施提示核对

- **原文表达「有意绕过 B-adjust」**：满足。L46「白名单追加**有意绕过 B-adjust**」字面命中（`rg -F` 可 grep）。
- **同时声明设计与验收仍走 dev-harness**：满足。同行「**设计与验收仍走 dev-harness**」逐字在。
- **不得改上游 skill 来消除冲突**：满足。`tools/relay-light/skill/**` 四集合零触碰，adapter 仅作只读 oracle 使用。
- **A29 双模块身份与英文 scope `relay-light` 先落地**：满足。B1（首个施工批，commit `e4c8592`）即交付双模块身份 + `dh` 入口 + 英文 scope，先于 B2/B3；RLT_12 首次真实安装的前置条件在卡内按序成立。

## 四、附注（不影响命中判定）

- F-1（L95「只有 relay 一份代码」陈旧）、F-3（冻结句两读）、F-4（dh-check 存量失败含 RLT_08 工作区缺口）均为 code-round1 已登记的措辞/体检项，不造成任一 oracle 失命中，留收口裁决。

## 结论

**APPROVE**

四条 HC oracle 逐字对照全部命中；DevPlan 三条非目标均未被越过；实施提示四项全部满足。本路只写事实与级别，不做验收裁决。
