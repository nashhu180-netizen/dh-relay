<!-- dh:v1 -->
# review — RLT_09

> RLT_09 `task_type=heavy`。施工者不得复核自己的卡；代码轮 1 及必要整改闭合后，代码轮 2、需求方向、一致性、教训四路进入同一 Review Batch 并发执行。任何 audit/review 绿不等于用户验收、verify、push、PR、CI、合并或发布。

## 预测变更面

<!-- dh:change-surface:v1 task=RLT_09 phase=predict -->

| 变更面 | 预测改动 | 下游消费者 / 风险 | 预定复核证据 |
|---|---|---|---|
| plan_amend 账本合同 | A119 写者/note/可重复/不进状态机 | monitor、status；错误纳入 agent 配对会封口失败 | 合法重复前后 agent/status 投影；三类反例编号 |
| stage_result 摘要 | A123 按同阶段 plan_amend 历史对称校验 | orchestrator 只靠摘要决定重读 | 有/无/缺失/不一致矩阵；跨阶段隔离 |
| A120 lint | 同 stage 表尾追加的窄放宽 | 计划拓扑；过宽会破坏 A46/A72/A89/A109 | 正式拒绝→通过、两正四反、既有回归 |
| status 重读 | 同目录计划追加后重算 stages | orchestrator 下一阶段选择 | 两次 status、非 WCRF 顺序、无缓存 |
| A122 守门 | lint 下属 amend 校验 + git name-only | planner-amend；路径穿越/新卡越权/部分落笔 | 三类正例、禁区混合反例零 diff、cards 改前快照 |
| planner-amend 模板 | skill 输入/动作/三次 lint/超范围 | monitor 派活；文档实现漂移 | 核心 skill 结构测试、adapter 引用同构 |
| UTF-8 入口 | stdout/stderr reconfigure | Windows 默认 cp1252；异常处理可能吞输出 | ascii/cp1252 子进程 RED→GREEN、bytes UTF-8 解码 |

## Heavy Recipe 路径登记

| 路径 | 时序 / 独立性 | 必审靶子 | reviewer | 证据 | 状态 |
|---|---|---|---|---|---|
| code-round1 | CONSTRUCTION_DONE 后先行；fresh、非施工者 | 整卡 diff、RED 有效性、A119/A123 状态机边界、A120 算法、A122 fail-closed、编码入口、allowed-paths | `rlt09-review` | `reviews/code-round1-rlt09-review.md` | APPROVE_WITH_NITS（P3×5） |
| code-round2 | code-round1 与必要整改闭合后；fresh | 针对轮 1 高风险点独立重审，复跑定向与全量；不得只核整改 diff | `rlt09-review` 的 fresh 后续实例 | `reviews/code-round2-rlt09-review.md` | REQUEST_CHANGES（P2-1 → X1 整改；P3×5） |
| requirement | 与后四路同批并发；独立 | 逐字核 A119～A123、RLT_03 五条交接、F-003；RLT_16/19 实跑不被本卡冒领 | `rlt09-review2` | `reviews/requirement-rlt09-review.md` | APPROVE（P3×2） |
| consistency | 与后四路同批并发；fresh | design §4.5/§11/§14、DevPlan、relay_log、SKILL、adapter、AGENTS 例外句一致；A135 三命令不漂 | `rlt09-review3` | `reviews/consistency-rlt09-review.md` | APPROVE_WITH_NITS（P2-1 → X1 整改；P3×4） |
| lesson | 与后四路同批并发；独立 | 核候选现场证据、去重、Binding/Mode；若 absent 形成可核查 N/A | `rlt09-review2` | `reviews/lesson-rlt09-review.md` | APPROVE_WITH_NITS（P2-1 → X1 整改；P3×2） |

## 批次小审登记

| Batch | audit reviewer | 结论 | 证据 | 状态 |
|---|---|---|---|---|
| W | `rlt09-audit` | PASS（W4 复审闭合 P1-01/P1-02/P1-03） | `review.plan.md` | 已执行 |
| 1 | `rlt09-audit` | PASS | `check.C1.md` | 已执行 |
| 2 | `rlt09-audit` | PASS | `check.C2.md` | 已执行 |
| 3 | `rlt09-audit` | PASS | `check.C3.md` | 已执行 |
| 4 | `rlt09-audit` | PASS | `check.C4.md` | 已执行 |
| 5 | `rlt09-audit` | PASS | `check.C5.md` | 已执行 |

## 有效单测候选（heavy 复核核对）

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应检查 | 行为红预期 | 状态 |
|---|---|---|---|---|---|
| plan_amend 控制事件 | 不进 AGENT_EVENTS→进入 | 状态机边界 | A119 重复事件与 agent 配对投影 | 合法重复或配对不变断言失败 | 待复核实施 |
| 表尾追加判定 | 仅合法尾追加→任意 stage 重现 | 拓扑约束 | A120 两正四反 | A89/A109 至少一项反例失守 | 待复核实施 |
| cards 授权快照 | 改动前 cards→改动后 cards | 权限/TOCTOU | 新卡 task_plan 反例 | A122 预检错误地通过 | 待复核实施 |
| 禁区集合 | any-invalid 全拒→过滤非法后部分执行 | 原子边界 | design + allowed 混合反例 | 白名单文件出现 diff | 待复核实施 |
| stdio 防护 | stdout+stderr→仅 stdout | 跨平台 I/O | cp1252 lint stderr 子例 | UnicodeEncodeError/非零 | 待复核实施 |

## 独立复核区（执行者 ≠ 复核者；heavy Recipe 五路）

| 路径 | 复核者（自报身份 / 模型） | 结论 | 发现级别 | 报告 |
|---|---|---|---|---|
| code-round1 | `rlt09-review`（Devin 会话 / swe-2-max） | APPROVE_WITH_NITS | P0/P1/P2 无；P3-1..P3-5 | `reviews/code-round1-rlt09-review.md` |
| code-round2 | `rlt09-review` fresh 后续实例（Devin 会话 / swe-2-max） | REQUEST_CHANGES | P2-1（A123 孤儿化 → X1 整改）；P3-1..P3-5 | `reviews/code-round2-rlt09-review.md` |
| requirement | `rlt09-review2`（Devin 会话 / swe-2-max） | APPROVE | P0/P1/P2 无；P3-1..P3-2 | `reviews/requirement-rlt09-review.md` |
| consistency | `rlt09-review3`（Devin 会话 / swe-2-max） | APPROVE_WITH_NITS | P2-1（DevPlan 快照措辞 → X1 整改）；P3-1..P3-4 | `reviews/consistency-rlt09-review.md` |
| lesson | `rlt09-review2`（Devin 会话 / swe-2-max） | APPROVE_WITH_NITS | P2-1（两条未登记现场 → X1 整改）；P3-1..P3-2 | `reviews/lesson-rlt09-review.md` |

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：五批施工、批次小审与 heavy 五路复核均已执行并回填；code-round2 P2-1（A123 supersede 孤儿化）经 X1 整改并补回归用例，待复核复看后闭合。机器测试、audit PASS、review APPROVE 均不授权 verify、人验、push、PR、CI、合并或发布。

### 需求对齐证据

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| HC-RL-A119 | `add plan_amend`：非 monitor 名 / 缺方案文件名 / 缺或空 `nodes=` 逐项拒绝；monitor 合法重复落账前后 agent/status 投影不变 | E-B1-01..E-B1-05、`check.C1.md`、round2 账本探针 41 步全符预期 | 满足 |
| HC-RL-A120 + RLT_03 五条交接 | `lint`：superseded 隔开正例与表尾追加正例放行；A46/A72/A89/A109 在追加语境逐项 exit 2；交接五条见 consistency 报告闭合表 | E-B2-01（基线 `b6b7d66` RED）..E-B2-05、`check.C2.md`、round2 lint 探针 21 例 | 满足 |
| HC-RL-A121 | 同一 `relay_plan.md` 追加 X#2 + agent 行后 `status --json` 按节点表序投影新实例；代码/账本 sha256 冻结 | E-B3-01..E-B3-05、`check.C3.md` | 满足 |
| HC-RL-A122 | `lint --amend-check before|after`：三类闭集、design/ 禁区整份拒绝零变化、仓外原始快照与恢复、object database 指纹、结构化 done.note | E-B4-01..E-B4-05、`check.C4.md` | 满足 |
| HC-RL-A123 | `add stage_result`：有/无/缺失/不一致矩阵 + X1 补「supersede 载体节点」边界——改后无 `amend=` 的 stage_result 被 A123 拒 | E-B1、E-X1-01（RED 复现）/E-X1-02（GREEN）、`check.C1.md`、round2 P2-1 探针复现 | 满足（X1 整改后，待复看） |
| F-003 | `PYTHONIOENCODING=ascii/cp1252` 子进程八路（status 文本/JSON、lint stderr/JSON）中文输出 | E-B5-01（RED `UnicodeEncodeError`）..E-B5-06、`check.C5.md` | 满足 |

### 完成条件逐条挂证据

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | HC-RL-A119 | AI | E-B1-01..E-B1-05、`check.C1.md` PASS、code-round1/round2/requirement 复核 | 是 |
| 2 | HC-RL-A120 | AI | E-B2-01..E-B2-05、`check.C2.md` PASS、RLT_03 五条交接逐条闭合（consistency 表） | 是 |
| 3 | HC-RL-A121 | AI | E-B3-01..E-B3-05、`check.C3.md` PASS | 是 |
| 4 | HC-RL-A122 | AI | E-B4-01..E-B4-05、`check.C4.md` PASS | 是 |
| 5 | HC-RL-A123 | AI | E-B1 矩阵 + E-X1-01..E-X1-05（P2-1 整改）、`check.C1.md` PASS | 是（X1 待复核复看） |
| 6 | F-003 | AI | E-B5-01..E-B5-06、`check.C5.md` PASS | 是 |

**材料齐没齐**：[ ]（施工、批次小审、heavy 五路复核已执行并回填；code-round2 P2-1 经 X1 整改，收束证据待复核复看闭合后补齐）

---

## 人类签名区　✅ 仅凭用户对话确认解锁

AI 不得预勾。组件接线类任务即使全部机器证与复核通过，仍只到待验收；verify、PR/CI/merge 各自是独立闸门。

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| 整卡收口 | 查看五条 HC、F-003、五路复核、范围与回归证据后对话确认 | 用户明文确认 | |
