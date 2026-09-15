<!-- dh:v1 -->
# review — RLT_21

> RLT_21 task_type=`normal`。施工者不得复核自己的卡；C 阶段批次小审（check.C1/C2）闭合后，按冻结 Recipe 独立执行代码轮 1、需求方向、教训三路；本卡另有有效单测要求。接力计划（RLT_12 树 `relay/rlt12-win-01/relay_plan.md`）将 R1 编排为 requirement + lesson 双路并行、scribe 先行机器体检与四道闸脚本后汇总——代码轮 1 的独立 fresh 实例是否在 R1 内补派，由 plan-reviewer 与编排按 Recipe 冻结要求裁决，本表先按 Recipe 三路全量登记。

## 预测变更面

<!-- dh:change-surface:v1 task=RLT_21 phase=predict -->

| 变更面 | 预测改动 | 下游消费者 / 风险 | 预定复核证据 |
|---|---|---|---|
| `stage_result` 分 outcome 校验 | `relay_log.py`：blocked/failed 允许节点未关但强制 `ref=`；done/cancelled 保 A112 | 监工收尾路径；ref 引用语义错会放过伪终态或误杀合法 blocked | A137 单测五例（合法 ref / A112 保持 / 三种非法 ref / A118 保持） |
| NOT_RUN 出口与 launch_fix 计数 | `relay_log.py`：attempt_max 后 NOT_RUN blocked 出口；`user_decision`+`launch_fix=` 授权链、每组重新计数、至多一组 | attempt 止损语义；授权链错位会绕过用户闸 | A138 单测（拒第 4 条 / 同 token 接受 / 异 token 拒 / 二组拒 / status 计数） |
| `launch_fix=` 记账与 status 暴露 | `agent_launch` note token + `status --json` agent 条目 `launch_fix` 字段 | 只读记账面；不得触发 plan_amend 或 lint | A139 单测带/不带各一例 + lint 零告警 |
| 静默超时 | `dh-mapping.toml` `limits.silence_timeout_min`（默认 30）+ `status` `ledger_silent` 提示 + 三处监工模板原文 | 只提示不判死；误当中断依据会杀活 agent | 打桩时钟单测；三处模板「三者均无变化」「不得中断」结构检查 |
| adapter 派活纪律 | 两份 adapter 三段原文（idle 后 prompt+pane 末行核提交 / 账本文件事件监听+空闲告警 / 沙箱替代预检） | 双平台主控行为合同；漏段即 A141 不成立 | 结构检查两份各命中三段 |
| decision_mode 模式门 + cancelled 归属闸 | `add` 路径：consult 缺 user_decision 的 resume 退 2、auto 链 user_decision 退 2、cancelled 入 A69 归属 | 决策链完整性；误放行伪造人决 | RLT_07 两条去 skip 负例转绿 + cancelled 正反例 |
| plan-reviewer light 分级 | SKILL.md 模板：措辞类 P2 不阻断、四类边界 P1 | 只影响 light 卡评审口径；heavy/normal 不变 | 结构检查「P2 不阻断」+四类 P1；预演 review.plan.md 复算 1 P1+4 P2 |

## Normal Recipe 路径登记

| 路径 | 时序 / 独立性 | 必审靶子 | reviewer | 证据 | 状态 |
|---|---|---|---|---|---|
| code-round1 | construction 与批次小审闭合后；fresh，非施工者（R1 计划内编排名额见上注，若判定缺独立代码路须由编排补派） | 整卡 diff；行为有效性；ref=/launch_fix/模式门/cancelled 闸与 status 输出合同；allowed-paths | 待编排派 | 待执行 | 待执行 |
| requirement | R1 独立复核路（计划 agent 表 `requirement` 行） | 逐字对齐 A137~A143；承接 F-002/F-003 关闭情况；不冒充 Windows/Linux 真跑 | 待编排派 | `review.requirement.md` | 待执行 |
| lesson | R1 独立复核路（计划 agent 表 `lesson` 行） | 核 lesson 候选现场证据、去重与可复用性；若 absent 形成可核查 N/A | 待编排派 | `review.lesson.md` | 待执行 |

## 批次小审登记

| Batch | audit reviewer | 结论 | 证据 | 状态 |
|---|---|---|---|---|
| W | plan-reviewer（codex） | 待执行 | `review.plan.md` | 待执行 |
| C1 | checker（codex） | 待执行 | `check.C1.md`（只核 A137~A140） | 待执行 |
| C2 | checker（codex） | 待执行 | `check.C2.md`（只核 A141~A143） | 待执行 |

## 有效单测候选（normal 复核核对；最终选点与登记归复核侧）

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应检查 | 行为红预期 | 状态 |
|---|---|---|---|---|---|
| `relay_log.py` stage_result 校验段 ref= 分支 | 要求合法 ref → 跳过校验/恒真 | 改条件 | A137 三例非法 ref 退 2 | 断言失败（ref 缺失/失效被放行） | 候选 · 待复核选点 |
| `relay_log.py` launch_fix 授权比较 | 同 token 比较 → 恒真 | 改条件 | A138 异 token 退 2 | 断言失败（异 token 被放行） | 候选 · 待复核选点 |
| `relay_log.py` consult 模式门 | 缺 user_decision 拒 resume → 放行 | 改条件 | A142 去 skip 负例 | 断言失败（无 user_decision 的 resume 被放行） | 候选 · 待复核选点 |
| `relay_log.py` cancelled 归属闸 | 归属校验含 cancelled → 剔除 cancelled | 改条件 | A142 cancelled 负例 | 断言失败（非触发 agent 的 cancelled 被放行） | 候选 · 待复核选点 |
| `relay_log.py` silence 阈值比较 | `>` → `>=` 或阈值读错 | 改边界 | A140 打桩时钟出现/不出现 | 断言失败（提示边界漂移） | 候选 · 待复核选点 |

## 独立复核区（执行者 ≠ 复核者；只读复核，oracle 与测试由复核者本机重跑）

| 路径 | 复核者（自报身份 / 模型） | 结论 | 发现级别 | 报告 |
|---|---|---|---|---|
| code-round1 | 待派 | | | |
| requirement | 待派 | | | `review.requirement.md` |
| lesson | 待派 | | | `review.lesson.md` |

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：待收口填。任何测试绿、check 小审 PASS 或 review APPROVE 都不等于用户验收、verify、push、PR、CI、merge 或发布。

**需求对齐证据**（收口时填实）

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| HC-RL-A137 | 单测五例 + stage_close/A118 保持 | | |
| HC-RL-A138 | NOT_RUN 计数→blocked 出口→launch_fix 授权链单测组 + status 不可关原因 | | |
| HC-RL-A139 | agent_launch 带/不带 launch_fix 各一例 + status --json 字段 + lint 零告警 | | |
| HC-RL-A140 | 配置加载 + 打桩时钟提示出现/不出现 + 三处模板结构检查 | | |
| HC-RL-A141 | 两份 adapter 三段原文结构检查 | | |
| HC-RL-A142 | 两条去 skip 负例转绿 + cancelled 正反例 | | |
| HC-RL-A143 | 模板结构检查 + 预演 review.plan.md 复算 1 P1+4 P2 | | |

**完成条件逐条挂证据**（收口时补 E-ID 与达成结论）

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | HC-RL-A137 | AI | | |
| 2 | HC-RL-A138 | AI | | |
| 3 | HC-RL-A139 | AI | | |
| 4 | HC-RL-A140 | AI | | |
| 5 | HC-RL-A141 | AI | | |
| 6 | HC-RL-A142 | AI | | |
| 7 | HC-RL-A143 | AI | | |

**材料齐没齐**：[ ]

---

## 人类签名区　✅ 仅凭用户对话确认解锁

本卡无业务人判结果项；收口时向用户展示七条机器证、批次小审与三路复核结论、F-002/F-003 关闭情况，由用户决定后续授权。AI 不得预勾。

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| 整卡收口 | 查看需求对齐证据、测试输出、批次小审与三路复核后对话确认 | 用户明文确认 | |
