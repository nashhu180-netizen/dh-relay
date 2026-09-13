<!-- dh:v1 -->
# review — RLT_08

> RLT_08 task_type=`normal`。施工者不得复核自己的卡；CONSTRUCTION_DONE 且批次小审闭合后，代码轮 1、需求方向、教训三路按冻结 Recipe 独立执行。

## 预测变更面

<!-- dh:change-surface:v1 task=RLT_08 phase=predict -->

| 变更面 | 预测改动 | 下游消费者 / 风险 | 预定复核证据 |
|---|---|---|---|
| 仓库模块身份 | `AGENTS.md` 项目概况、落点/slug、`dh` 命令三处从单模块改双模块 | `dh` 使用者；错误保留自动选中叙述会误导入口 | 旧句零命中；slug/路径/scope 四项命中；`dh relay-light` 模块标头 |
| worker 流水分流 | 新增 relay-light 标头判定与完成即停；Runner 铁律只加 receipt 冻结边界 | relay-light worker 与 Runner worker；误判会造成等待死锁或双流水同时执行 | A34 原文 grep；adapter 两标头同构；Runner 原铁律保留 diff |
| 运行中计划政策 | 明记有意绕过 B-adjust 的白名单窄例外 | planner-amend / orchestrator；例外外溢到 design/验收会绕开用户闸 | 两句必备原文 + 三项白名单与两项禁区语义审查 |
| 仓内权威索引 | 阅读矩阵新增 relay-light skill/adapter 行 | 后续 planner/orchestrator/monitor/worker；错链接会读到派生副本或无关流程 | 矩阵内精确一行，指向 `tools/relay-light/skill/SKILL.md` |
| 外部不变量 | dev-harness 必须零新改动；skill/adapter 只读 | 上游 dev-harness 和 RLT_07 已交付合同 | 进场前后 status/diff 对比；本卡 name-only 闭集 |

## Normal Recipe 路径登记

| 路径 | 时序 / 独立性 | 必审靶子 | reviewer | 证据 | 状态 |
|---|---|---|---|---|---|
| code-round1 | construction 与批次小审闭合后；fresh，非施工者 | 整卡 diff；三批插入位置；旧 Runner 条款未被弱化；grep/结构脚本是否能真防回归；allowed-paths | `rlt08-review`（独立复核 worker · Devin CLI / SWE-2 Max） | `reviews/code-round1-rlt08-review.md` | APPROVE_WITH_NITS |
| requirement | 与 normal Review Batch 独立执行 | 逐字对齐 HC-RL-A28/A29/A33/A34；B-adjust 例外不外溢；双模块语义与 `dh` 实际行为一致 | `rlt08-review`（独立复核 worker · Devin CLI / SWE-2 Max） | `reviews/requirement-rlt08-review.md` | APPROVE |
| lesson | 与 normal Review Batch 独立执行 | 核 `lesson_candidates.md` 的现场证据、去重与可复用性；若 absent，形成可核查 N/A | `rlt08-review2`（fresh 复核实例 · Devin CLI / SWE-2 Max） | `reviews/lesson-rlt08-review.md` | APPROVE_WITH_NITS |

## 批次小审登记

| Batch | audit reviewer | 结论 | 证据 | 状态 |
|---|---|---|---|---|
| W | `rlt08-audit` | 三轮：FAIL→FAIL→PASS | `review.plan.md`（P1-1~P1-4 等五项全 CLOSED） | 已闭合 |
| 1 | `rlt08-audit` | 初判 FAIL（仅 E-ID 登记缺失）→ 补记后 PASS | `check.C1.md` | 已闭合 |
| 2 | `rlt08-audit` | PASS | `check.C2.md` | 已闭合 |
| 3 | `rlt08-audit` | PASS | `check.C3.md` | 已闭合 |

## 有效单测候选（normal 复核核对）

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应检查 | 行为红预期 | 状态 |
|---|---|---|---|---|---|
| A34 判定句 `RELAY_RECEIPT` | `即冻结`→`不冻结` | 流水分流 | 整卡 `rg -F` 原文检查 | 原文命中失败 | 待复核实施 |
| relay-light verify scope | `relay-light`→`relay_light` | 模块身份 | scope 精确 grep | 英文 scope 检查失败 | 待复核实施 |

## 独立复核区（执行者 ≠ 复核者；normal Recipe 三路）

三路均由未参与施工的独立复核实例执行，只读复核；oracle 机检由复核者本机逐字复跑（非引用 exec 证据）。

| 路径 | 复核者（自报身份 / 模型） | 结论 | 发现级别 | 报告 |
|---|---|---|---|---|
| code-round1 | `rlt08-review`（独立复核 worker，未参与施工）· Devin CLI / SWE-2 Max | APPROVE_WITH_NITS | P2×1（F-1：L95 陈旧叙述，X1 已整改）、P3×2（F-3 冻结句两读，X1 已整改；F-4 dh-check 存量缺口，收口裁决见 findings） | `reviews/code-round1-rlt08-review.md` |
| requirement | `rlt08-review`（独立复核 worker，未参与施工）· Devin CLI / SWE-2 Max | APPROVE | 四条 HC oracle 逐字全命中；DevPlan 三条非目标未越过；实施提示四项全满足 | `reviews/requirement-rlt08-review.md` |
| lesson | `rlt08-review2`（fresh 复核实例，未参与施工/计划/小审）· Devin CLI / SWE-2 Max | APPROVE_WITH_NITS | P2×3（LC-4/LC-5/LC-6 该登记未登记，X1 已补登）、P3×2 非阻塞 | `reviews/lesson-rlt08-review.md` |

批次小审：plan-review 三轮 W FAIL→W2 FAIL→W3 PASS（`review.plan.md`）；施工批 B1 初判 FAIL（仅 E-ID 登记缺失，补记后重审 PASS）、B2/B3 PASS（`check.C1.md`/`check.C2.md`/`check.C3.md`）。

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：normal Recipe 三路复核均已回且收敛（code-round1 `APPROVE_WITH_NITS`、requirement `APPROVE`、lesson `APPROVE_WITH_NITS`），无 P0/P1 阻断项；四项 nits——F-1 陈旧叙述、F-3 冻结句两读、LC-4~LC-6 未登记、本文件三区与需求对齐表缺口——已按编排裁决在 X1 收口批逐项整改，B3 整卡机检复跑仍全绿（E-016）。但三路复核收敛**不构成**整卡验收、verify、merge、push 或发布：人类签名区保持未勾；`dh relay-light` 存量失败按 F-4 收口裁决处置（R4/R12 已由本批补齐；`visual_map.md` 沿 RLT_07 先例不建，模块级 knowledge/ 归 RLT_11 教训回流卡）。

**需求对齐证据**

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| HC-RL-A33：阅读矩阵含指向 relay-light skill 的索引行；dev-harness 未被改动 | awk 截取 `## 任务类型阅读矩阵` 边界内 `rg -F -c 'tools/relay-light/skill/SKILL.md'` 恰 1 行（AGENTS.md L90）；B1 动笔前冻结 dev-harness 三摘要，B3/X1 复算逐项 `cmp` 一致 | E-009、E-010、E-012、E-013、E-016；requirement 路逐字对照「命中」 | 满足 |
| HC-RL-A28：新增 relay-light 编排协议段，且现有 Runner 铁律已标「冻结流水」 | `rg -n -F` 逐字命中 `## relay-light 编排协议段`、判定句、「有意绕过 B-adjust」、「设计与验收仍走 dev-harness」；`git diff` 显示 Runner 原条款纯增量未弱化 | E-005、E-007、E-013、E-016；requirement 路逐字对照「命中」 | 满足 |
| HC-RL-A34：adapter 标头同构 + AGENTS 判定句逐字 | 两份 adapter ```text 块首行与期望标头逐字节一致（`adapter_count=2`）；判定句单行 `rg -F` 命中 L44 | E-006、E-007、E-013、E-016；requirement 路逐字对照「命中」 | 满足 |
| HC-RL-A29：双模块身份四项 + 旧描述同步改 + `dh relay-light` 可解析 | slug/文档根/代码根/英文 verify scope 双处命中，旧单模块变体零命中，`dh` 小节改「多个模块须显式指定」；`dh relay-light` 首行 `=== dh-check: relay-light ===` | E-001、E-003、E-011、E-013、E-016；requirement 路逐字对照「命中」 | 满足 |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | HC-RL-A33：矩阵恰 1 行 + dev-harness 三摘要 cmp 全同 | AI | E-009、E-010、E-012、E-013、E-016 | 是 |
| 2 | HC-RL-A28：四模式命中 + Runner 铁律纯增量 | AI | E-005、E-007、E-013、E-016 | 是 |
| 3 | HC-RL-A34：`adapter_count=2` 逐字节一致 + 判定句命中 | AI | E-006、E-013、E-016 | 是 |
| 4 | HC-RL-A29：五项身份命中 + 旧句零命中 + dh 标头 | AI | E-001、E-003、E-011、E-013、E-016 | 是 |

**材料齐没齐**：[x]（七件套 + `reviews/` 三份 + `check.C1~C3.md` + `evidence/dev-harness-baseline/` 均在 `docs/modules/relay-light/workspace/RLT_08/` 内；R15 `visual_map.md` 缺口按 F-4 收口裁决沿 RLT_07 先例不建）

---

## 人类签名区　✅ 仅凭用户对话确认解锁

本卡无业务人判结果项；收口时向用户展示机器证（E-001～E-017 证据账本与三路复核报告），由用户确认是否执行本地收口授权包。AI 不得预勾。

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| 整卡收口 | 查看证据账本与三路复核报告后对话确认 | 用户明文确认 | |
