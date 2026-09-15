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
| code-round1 | construction 与批次小审闭合后；fresh，非施工者（R1 计划内编排名额见上注，若判定缺独立代码路须由编排补派） | 整卡 diff；行为有效性；ref=/launch_fix/模式门/cancelled 闸与 status 输出合同；allowed-paths | 待编排补派（requirement 路 P1-2 裁决确认缺口：R1 两路不含代码轮 1，须由编排派 fresh 非施工者） | `review.requirement.md` P1-2 | 未执行 · 待补派 |
| requirement | R1 独立复核路（计划 agent 表 `requirement` 行） | 逐字对齐 A137~A143；承接 F-002/F-003 关闭情况；不冒充 Windows/Linux 真跑 | requirement#1（codex gpt-5.6-sol · fresh · 非施工者） | `review.requirement.md` | FAIL（P1=2 P2=3） |
| lesson | R1 独立复核路（计划 agent 表 `lesson` 行） | 核 lesson 候选现场证据、去重与可复用性；若 absent 形成可核查 N/A | lesson#1（codex gpt-5.6-sol · fresh · 非施工者） | `review.lesson.md` | FAIL（P1=3 P2=0） |

## 批次小审登记

| Batch | audit reviewer | 结论 | 证据 | 状态 |
|---|---|---|---|---|
| W | plan-reviewer（codex） | PASS（P1=0 P2=0） | `review.plan.md` | 已闭合 |
| C1 | checker（codex） | FAIL（P1=3 P2=0） | `check.C1.md`（只核 A137~A140） | FAIL · 三 P1 已转 C2 整改并在代码层闭合（F-004/F-007/F-008a）；C1 文件仍保留 FAIL 原判，durable 复审缺口 = requirement 路 P1-1，待编排裁决 |
| C2 | checker（codex） | PASS（P1=0 P2=1） | `check.C2.md`（只核 A141~A143） | 已闭合；残留 P2-1 = A143 复算口径分歧，待编排/用户裁决 |

## 有效单测候选（normal 复核核对；最终选点与登记归复核侧）

| 变异点锚点 | 原值→变异值 | 语义类别 | 对应检查 | 行为红预期 | 状态 |
|---|---|---|---|---|---|
| `relay_log.py` stage_result 校验段 ref= 分支 | 要求合法 ref → 跳过校验/恒真 | 改条件 | A137 三例非法 ref 退 2 | 断言失败（ref 缺失/失效被放行） | 候选 · 待复核选点 |
| `relay_log.py` launch_fix 授权比较 | 同 token 比较 → 恒真 | 改条件 | A138 异 token 退 2 | 断言失败（异 token 被放行） | 候选 · 待复核选点 |
| `relay_log.py` consult 模式门 | 缺 user_decision 拒 resume → 放行 | 改条件 | A142 去 skip 负例 | 断言失败（无 user_decision 的 resume 被放行） | 候选 · 待复核选点 |
| `relay_log.py` cancelled 归属闸 | 归属校验含 cancelled → 剔除 cancelled | 改条件 | A142 cancelled 负例 | 断言失败（非触发 agent 的 cancelled 被放行） | 候选 · 待复核选点 |
| `relay_log.py` silence 阈值比较 | `>` → `>=` 或阈值读错 | 改边界 | A140 打桩时钟出现/不出现 | 断言失败（提示边界漂移） | 候选 · 待复核选点 |

> 按 R1 已有报告登记：requirement 路 P1-2 指明 code-round1 未执行、有效单测选点随之悬空；以上五条仅保持候选，不替补派的代码轮 reviewer 预选点。

## 独立复核区（执行者 ≠ 复核者；只读复核，oracle 与测试由复核者本机重跑）

| 路径 | 复核者（自报身份 / 模型） | 结论 | 发现级别 | 报告 |
|---|---|---|---|---|
| code-round1 | 未派（待编排补派 fresh 非施工者，见 `review.requirement.md` P1-2） | 未执行 | — | — |
| requirement | requirement#1（codex `gpt-5.6-sol` reasoning=medium · fresh · 非施工者，自报于报告 :10） | FAIL | P1=2 P2=3 | `review.requirement.md` |
| lesson | lesson#1（codex `gpt-5.6-sol` reasoning=medium · fresh · 非施工者，派单 `monitor-R1.md:88-113`） | FAIL | P1=3 P2=0 | `review.lesson.md` |

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：R1 两路独立复核均 FAIL——requirement 路 P1=2（C1 durable 复审闭环缺失、code-round1 未执行）P2=3；lesson 路 P1=3（三条协议/交互/监控教训未进候选）。任何测试绿、check 小审 PASS 或 review 结论都不等于用户验收、verify、push、PR、CI、merge 或发布；A143 数值 oracle 与冻结计级规则的冲突（P2-1）须编排提交用户裁决，worker 未改 oracle。

**需求对齐证据**（收口时填实）

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| HC-RL-A137 | 单测五例 + stage_close/A118 保持 | E11、E14（181 tests OK skipped=0）；`review.requirement.md` A137 PASS | 达成（机器证） |
| HC-RL-A138 | NOT_RUN 计数→blocked 出口→launch_fix 授权链单测组 + status 不可关原因 | E11、E14；`review.requirement.md` A138 PASS | 达成（机器证） |
| HC-RL-A139 | agent_launch 带/不带 launch_fix 各一例 + status --json 字段 + lint 零告警 | E11、E14；`review.requirement.md` A139 PASS | 达成（机器证） |
| HC-RL-A140 | 配置加载 + 打桩时钟提示出现/不出现 + 三处模板结构检查 | E11、E14、E15（三处模板行号命中）；`review.requirement.md` A140 PASS | 达成（附 P2-2 终态范围澄清待裁决） |
| HC-RL-A141 | 两份 adapter 三段原文结构检查 | E11、E14、E16（两 adapter 各三段行号）；`review.requirement.md` A141 PASS | 达成（机器证） |
| HC-RL-A142 | 两条去 skip 负例转绿 + cancelled 正反例 | E11、E14（skipped=0 实证去钉）；`review.requirement.md` A142 PASS | 达成（机器证） |
| HC-RL-A143 | 模板结构检查 + 预演 review.plan.md 复算 1 P1+4 P2 | E11、E14、E16（SKILL.md:57 命中）；F-009 逐条复算 = 3 P1+2 P2；`review.requirement.md` A143 PARTIAL | 部分达成：模板结构 PASS；复算期望与冻结计级不可兼得（P2-1），待裁决 |

**完成条件逐条挂证据**（收口时补 E-ID 与达成结论）

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | HC-RL-A137 | AI | E11/E14 + requirement 路 PASS | 是（机器证） |
| 2 | HC-RL-A138 | AI | E11/E14 + requirement 路 PASS | 是（机器证） |
| 3 | HC-RL-A139 | AI | E11/E14 + requirement 路 PASS | 是（机器证） |
| 4 | HC-RL-A140 | AI | E11/E14/E15 + requirement 路 PASS | 是（附 P2-2 澄清项） |
| 5 | HC-RL-A141 | AI | E11/E14/E16 + requirement 路 PASS | 是（机器证） |
| 6 | HC-RL-A142 | AI | E11/E14 + requirement 路 PASS | 是（机器证） |
| 7 | HC-RL-A143 | AI | E11/E14/E16 + F-009 + requirement 路 PARTIAL | 部分：结构达成；数值 oracle 待裁决 |

**材料齐没齐**：[ ]（requirement/lesson 两路 FAIL 未闭合、code-round1 未执行、C1 durable 复审缺失，不齐）

## scribe 体检（R1 · 四道闸）

> 本仓无 dev-harness dh CLI，四道闸按具名命令等价执行。

- **闸1 全量单测**：`python -m unittest -v tools/relay-light/test_relay_log.py`（`PYTHONDONTWRITEBYTECODE=1`）→ 自然终态尾部 `Ran 181 tests in 500.043s` / `OK`，exit=0；无 `skipped=` 行即 skipped=0，与 requirement 路「无 skip 装饰器、唯一 `self.skipTest` 未触发」一致。
- **闸2 模板/adapter 结构**（grep + 行号）：
  - A140「三者均无变化」「不得中断」：`tools/relay-light/skill/SKILL.md:173`、`references/adapter-claude-code.md:95`、`references/adapter-codex.md:94` 三处均命中。
  - A141 两 adapter 各三段：claude adapter `:49`（沙箱替代预检+launch_fix 记账）、`:72`（idle→prompt→pane 末行核提交）、`:84`（账本文件事件监听+空闲 ≥2min 告警）；codex adapter 对应 `:48`、`:71`、`:83`。
  - A143：`SKILL.md:57` 命中「P2 不阻断」与四类 P1（allowed-paths 越界 / 写入者边界 / 节点/阶段边界 / 验收命令与完成信号）。
- **闸3 diff 边界**：`git diff --check`、`git diff --check master...HEAD`、`git diff --cached --check` 均 exit=0。四集合 name-only：base `master...HEAD` 仅 `tools/relay-light/{relay_log.py,test_relay_log.py,skill/**}` 与本工作区；working tree 仅 `progress.md`；index 空；untracked 全部位于本工作区。无 allowed-paths 外项。
- **闸4 账本侧（监工报告口径）**：监工已在 RLT_12 树跑 `lint`=ok；`status` 显示 R1 open、requirement/lesson 两路 done、scribe live。scribe 不跨树跑账本，本闸按监工派单口径登记。

## miner 段（去重候选汇总 · 不写 knowledge）

素材：`findings.md` F-001~F-009、`lesson_candidates.md` L-001~L-004、`progress.md`、`review.lesson.md`。

| 候选 | 来源现场 | 去重结论 | 状态 |
|---|---|---|---|
| L-001 | F-005：归属事件顶掉 latest-event，A49 重拉资格被拒 | 可迁移，与新增 P1-1 不同源（数据语义 vs 编排时序） | 保留（lesson 路判定） |
| L-002 | F-004：oracle 连接句被误读为条件绑定 | 可迁移，与 L-004 计级口径不同 | 保留 |
| L-003 | F-009：复核工件按轮覆盖丢历史轮证据 | 可迁移，覆盖证据留存面 | 保留 |
| L-004 | F-009：期望计数依赖未冻结的归并口径 | 可迁移，「到点」 | 保留 |
| （新）done 时机切断返工边 | review.lesson.md P1-1：C1 coder/checker 先 done 后 FAIL，返工只能推 C2；RLT_12 C2 派单已冻结「PASS 前保持 live」 | 与 L-001 不同源，独立候选 | 待 coder 补登入 `lesson_candidates.md` |
| （新）审批菜单编号漂移 | review.lesson.md P1-2：固定数字误选，须按文案动态定位+发后复读 | L-001~L-004 未覆盖 UI 语义定位，独立候选 | 待 coder 补登 |
| （新）`herdr agent wait` PermissionDenied 退避 | review.lesson.md P1-3：Os code 5 轮询/退避/不判 agent_lost | 与 L-003 的证据留存不同源，独立候选 | 待 coder 补登 |

miner 汇总：既有候选 4 条全部保留（无应并项）；lesson 路新识别候选缺口 3 条；合计 **7 条**（4 在册 + 3 待登）。scribe 只汇总不改 `lesson_candidates.md`（A67 写入者边界）。

---

## 人类签名区　✅ 仅凭用户对话确认解锁

本卡无业务人判结果项；收口时向用户展示七条机器证、批次小审与三路复核结论、F-002/F-003 关闭情况，由用户决定后续授权。AI 不得预勾。

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| 整卡收口 | 查看需求对齐证据、测试输出、批次小审与三路复核后对话确认 | 用户明文确认 | |
