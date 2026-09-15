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

**Confidence Challenge**：X1 收口复审两路全 PASS——requirement 路 P1=0 P2=4（按编排裁决合并承担 code-round1 职责，变异实验 RED→GREEN 已验）、lesson 路 P1=0 P2=0；R1 打回的五条 P1 全部闭合（check.C1 三条旧 P1 由 requirement 路独立裁决 CLOSED，证据 F-010~F-012；三条教训 L-005~L-007 已进 `lesson_candidates.md`）。任何测试绿、check 小审 PASS 或 review 结论都不等于用户验收、verify、push、PR、CI、merge 或发布；F-009/A143 口径分歧（冻结四类逐条计级 3 P1+2 P2 vs oracle 期望 1 P1+4 P2）待用户二选一裁决，worker 未改 oracle/期望数字。

**需求对齐证据**（收口时填实）

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| HC-RL-A137 | 单测五例 + stage_close/A118 保持 | commit `a80fcde`（实现）+ `0e0f24a`（check.C1 返工：blocked/failed 无条件强制合法最新 ref=，见 F-004/F-010）；用例组 `RelayStageResultRefTests`（5 例，含 `test_a137_fully_closed_stage_result_still_requires_ref`、`test_a137_stage_close_after_blocked_still_rejected`）；复跑 `python -m unittest -v tools/relay-light/test_relay_log.py -k RelayStageResultRefTests` → `Ran 5 tests` `OK` exit=0（X1 实测 28.492s/32.192s）；E11、E14 全量 181 OK；`review.requirement.X1.md` §1 三旧 P1-1/P1-2 裁 CLOSED | 达成（机器证） |
| HC-RL-A138 | NOT_RUN 计数→blocked 出口→launch_fix 授权链单测组 + status 不可关原因 | commit `a80fcde`；用例组 `RelayNotRunRetryTests`（4 例）；复跑 `-k RelayNotRunRetryTests` → `Ran 4 tests` `OK` exit=0（X1 实测 22.075s/29.602s）；E11、E14 全量 181 OK | 达成（机器证） |
| HC-RL-A139 | agent_launch 带/不带 launch_fix 各一例 + status --json 字段 + lint 零告警 | commit `a80fcde`；用例组 `RelayLaunchFixStatusTests`（2 例）；复跑 `-k RelayLaunchFixStatusTests` → `Ran 2 tests` `OK` exit=0（X1 实测 6.409s/9.591s）；监工 lint=ok（E18、F1 账本原文） | 达成（机器证） |
| HC-RL-A140 | 配置加载 + 打桩时钟提示出现/不出现 + 三处模板结构检查 | commit `a80fcde`；用例组 `RelayLedgerSilenceTests`（3 例）；复跑 `-k RelayLedgerSilenceTests` → `Ran 3 tests` `OK` exit=0（X1 实测 0.073s/0.058s）；E15 三处模板行号命中（SKILL.md:173、adapter-claude-code.md:95、adapter-codex.md:94） | 达成（附 P2-2 终态范围澄清待裁决） |
| HC-RL-A141 | 两份 adapter 三段原文结构检查 | commit `0e0f24a`；用例 `SkillAdapterTests.test_a141_dispatch_wait_and_sandbox_fallback_discipline`（原始 RED `Ran 1 test` `FAILED (failures=10)` exit=1，F-008a 在案）；E16 结构检查两 adapter 各三段行号（claude :49/:72/:84、codex :48/:71/:83）；`check.C2.md` PASS | 达成（机器证） |
| HC-RL-A142 | 两条去 skip 负例转绿 + cancelled 正反例 | commit `0e0f24a`；用例 `test_a114_consult_resume_without_user_decision_rejected`、`test_a114_auto_mode_rejects_user_decision_on_decider_chain`（RLT_07 两钉去 skip 即绿）、`test_a114_cancelled_uses_triggering_agent`；E11 `skipped=0` 实证去钉；变异实验 E21 RED→GREEN | 达成（机器证） |
| HC-RL-A143 | 模板结构检查 + 预演 review.plan.md 复算 1 P1+4 P2 | commit `0e0f24a`+`4105da8`（整改：逐条复算卡点登记）；用例 `SkillCoreDocTests.test_a143_light_plan_review_severity_classification`；E16 `SKILL.md:57` 命中「P2 不阻断」+四类 P1；F-009 按冻结四类逐条复算 = 3 P1+2 P2，与 oracle 1 P1+4 P2 不可兼得；X1 requirement 路维持「合同口径冲突、非施工缺陷」（`review.requirement.X1.md` P2-1） | 部分达成：模板结构 PASS；复算期望与冻结计级不可兼得（P2-1），待用户裁决 |

**完成条件逐条挂证据**（收口时补 E-ID 与达成结论）

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | HC-RL-A137 | AI | `a80fcde`+`0e0f24a`（返工）；`-k RelayStageResultRefTests` → `Ran 5` `OK` exit=0；E11/E14/E20；`review.requirement.X1.md` §1 CLOSED | 是（机器证） |
| 2 | HC-RL-A138 | AI | `a80fcde`；`-k RelayNotRunRetryTests` → `Ran 4` `OK` exit=0；E11/E14/E20 | 是（机器证） |
| 3 | HC-RL-A139 | AI | `a80fcde`；`-k RelayLaunchFixStatusTests` → `Ran 2` `OK` exit=0；E11/E14/E20；lint=ok | 是（机器证） |
| 4 | HC-RL-A140 | AI | `a80fcde`；`-k RelayLedgerSilenceTests` → `Ran 3` `OK` exit=0；E11/E14/E15 三处模板命中 | 是（附 P2-2 澄清项） |
| 5 | HC-RL-A141 | AI | `0e0f24a`；`SkillAdapterTests.test_a141_dispatch_wait_and_sandbox_fallback_discipline`；E16 两 adapter 各三段 | 是（机器证） |
| 6 | HC-RL-A142 | AI | `0e0f24a`；两条去 skip 负例 + `test_a114_cancelled_uses_triggering_agent`；E11 skipped=0；变异 E21 | 是（机器证） |
| 7 | HC-RL-A143 | AI | `0e0f24a`+`4105da8`；`SkillCoreDocTests.test_a143_light_plan_review_severity_classification`；E16 `SKILL.md:57`；F-009 复算 3 P1+2 P2 | 部分：结构达成；数值 oracle 待用户裁决 |

**材料齐没齐**：[ ]（AI侧材料齐备；用户验收未做；F-009/A143口径分歧待裁决）

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

> X1 后补记：三条待登候选已由 coder 落 `lesson_candidates.md` L-005/L-006/L-007，lesson 路复审全部 CLOSED；在册合计 7 条（L-001~L-007）。

## 交付汇报（F1 收口备料）

### 阶段用时（账本原文口径）

| 阶段实例 | 区间 | 用时 |
|---|---|---|
| W#1 | 2026-09-15T10:10:21+08:00（seq2）→ 10:31:26（seq11） | 约21分钟 |
| C#1 | 10:37:08（seq12）→ 14:41:20（seq34） | 约4小时04分（C1 10:38:23→11:50:29 约72分；C2 11:59:29→14:40:17 约161分） |
| R#1 | 14:51:11（seq35）→ 15:33:36（seq51） | 约42分 |
| X#1 | 15:45:02（seq52）→ 16:28:36（seq63） | 约44分 |
| 合计 | — | 约6小时18分 |

### 收口漏斗

- W1：七件套 + task_plan 建齐，`review.plan.md` PASS（commit `424807f`）。
- C1：小审 FAIL p1=3——A49/A60 使节点内返工不可行，三条 P1 带入 C2（commit `a80fcde`）。
- C2：整改后复审 PASS p1=0 p2=1（commits `0e0f24a` + `4105da8`），关闭 C1 三条 P1。
- R1：requirement FAIL p1=2 p2=3 + lesson FAIL p1=3，合 5 条 P1 打回；scribe 四道闸全过（commit `fc70185`）。R1 outcome=done 仅表示复核阶段完成，不等于「通过」。
- X1：coder 返工零代码改动（证据补录 F-010~F-012 + 教训候选 L-005~L-007）；requirement 路 PASS p1=0 p2=4、lesson 路 PASS p1=0 p2=0；5 条 P1 全闭合；变异实验 RED→GREEN 已验（commit `435fad6`）。
- F1：本节点收口备料，commit 见 `done.scribe.F1.md` 与 progress E25。

### 遗留项（逐条，未闭合/待裁决）

- F-009/A143：按冻结四类逐项计级 3 P1+2 P2，与 oracle 期望 1 P1+4 P2 不可兼得；X1 requirement 路维持原判「合同口径冲突、非施工缺陷」，收口责任在用户——待用户二选一（修订 A143 复算期望或给出去重/折级规则）。
- X1 requirement 路 p2=4：P2-1 上述口径分歧；P2-2 A140 `ledger_silent` 终态提示范围；P2-3 normal 三路与 R-stage 两 reviewer 的层级术语差异；P2-4 派单 `-k "A or B or C"` 不被 unittest 解析（0 tests/exit 1，已用三条独立 `-k` 补足证据）。
- R1 requirement 路 p2=3（P2-1~P2-3，同上述口径面）；C2 小审残留 p2=1（同 A143 口径分歧）。
- F-003：仓根 `.gitignore` 忽略 `__pycache__/` 的归属待裁决（不在本卡 allowed-paths，未动）。

### 未做且需用户明确授权（逐项）

- push 到 GitHub `origin`
- 创建目标为 `master` 的 PR 并关联 Issue #21
- 服务端合并 / CI / merge 入 master
- `verify(relay-light):` 收口提交
- 两侧用户级 skill 重同步（`install_skill.py --all`，须先展示解析后两个绝对目标并取得用户当次明确授权）
- 用户验收签字（人类签名区结果列全部留空，AI 未预勾）

## 证据展示区（F1 收口备料）

- 全量基线：`python -m unittest -v tools/relay-light/test_relay_log.py` → `Ran 181 tests` `OK` skipped=0 exit=0（scribe R1 复跑 500.043s；requirement X1 变异前 523.509s / 恢复后 478.237s；F1 复跑见 E23）。
- 变异实验（有效单测）：选点 `relay_log.py:63` `DECISION_EVENTS` 剔除 `cancelled`；命令 `python -m unittest -v tools/relay-light/test_relay_log.py -k test_a114_cancelled_uses_triggering_agent` → 自然终态 `Ran 1 test in 4.711s` `FAILED (failures=1)` exit=1；恢复后同命令 `Ran 1 test in 5.960s` `OK` exit=0，随后全量 181 `OK` exit=0（`review.requirement.X1.md` §2、E21）。
- 三集合 `git diff --check`（working / `master...HEAD` / cached）+ 四集合边界：R1 E17、X1 E22、F1 E24 均 exit=0 无越界。
- 账本原文（监工在 RLT_12 树核验，scribe 不跨树跑账本）：计划 `docs/modules/relay-light/relay/rlt12-win-01` skill=0.1.0 session=rlt12-win-01；卡 RLT_21 `decision_mode=auto`；当班写入者 orchestrator（RLT_21:F#1）；W/C/R/X 均 closed result=done；F#1 open result=—；节点 F1 handoff ready；`lint: ok`；F1 `stage_start`/`monitor_launch` 均有 `stage_id=RLT_21:F#1`。

---

## 人类签名区　✅ 仅凭用户对话确认解锁

本卡无业务人判结果项；收口时向用户展示七条机器证、批次小审与三路复核结论、F-002/F-003 关闭情况，由用户决定后续授权。AI 不得预勾。

> **代记说明（2026-09-15，落记依据）**
>
> **用户 2026-09-15 在对话中明确授权整体验收通过并授权 AI 代记（原话：『授权，你帮我代签』）。用户未逐条给出人判结论；本区各条的『结果』由 AI 依该授权统一落记为通过，判断内容非 AI 自行判定、亦非 AI 代拟。如需逐条主观判断，须由用户另行补签。**

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| 整卡收口 | 查看需求对齐证据、测试输出、批次小审与三路复核后对话确认 | 用户明文确认 | 通过（依 2026-09-15 用户整体授权代记） |

- 确认记录：确认方式 = 对话 chat-confirm（2026-09-15）。用户答复原话「授权，你帮我代签」——整体授权验收通过并授权 AI 代记，未逐条给出结论。同一次对话中用户就 F-009/A143 口径分歧裁决「改」，即取「修订 oracle 期望值」出口，design/01 的 A143 已改为 `3 P1 + 2 P2`（RLT-A-10 最小澄清）。
- verify 提交 SHA：`e8eda0e`（`verify(relay-light): RLT_21 机器闸取证——A137~A143 七条与全量单测`）；`git log --grep="^verify"` 可查
- 签名：hyf（chat-confirm 代签）　　时间：2026-09-15

→ 解锁状态：**已验收**（2026-09-15 用户整体授权、AI 代记，未逐条签；verify `e8eda0e` 在案）
