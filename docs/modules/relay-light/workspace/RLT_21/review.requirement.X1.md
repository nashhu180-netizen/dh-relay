<!-- dh:v1 -->
# X1 requirement 独立复审 — RLT_21

## 总结论

PASS

- P1（阻断）：0
- P2（不阻断）：4
- 范围：X1 requirement 路；独立承担 P1-1 durable 裁决、编排合并的代码轮 1 职责，以及 P1-3～P1-5 的候选存在性/原文核对。未替 lesson 路判断候选深度，未裁决 F-009/A143、A140 终态提示范围或两路/三路术语。

## 1. P1-1 durable 裁决：A137～A140 与 C1 三条旧 P1

本路最终结论：**PASS**。`check.C1.md` 的三条旧 P1 均 **CLOSED**；F-010～F-012 成立，且三条状态都明确写成“待 requirement 路裁决”，coder 没有自封 CLOSED（`findings.md:20-22`）。

### 旧 P1-1 — A137 全节点已关时未强制 `ref=`：CLOSED

- 实现已让 `blocked`/`failed` 无论节点是否全关都无条件进入 `_validate_result_ref`：`tools/relay-light/relay_log.py:2086-2130,2183-2193`。
- `test_a137_fully_closed_stage_result_still_requires_ref` 钉住全关场景：blocked/failed 缺 ref 均报 A137，合法最新 `agent_lost` ref 接受（`tools/relay-light/test_relay_log.py:5300-5338`）。
- 独立复跑：`python -m unittest -v tools/relay-light/test_relay_log.py -k RelayStageResultRefTests` → `Ran 5 tests in 32.192s`，`OK`，exit 0。
- 若未来回归，整改动作是恢复 `relay_log.py:2190-2193` 对所有 blocked/failed 的无条件 ref 校验；复跑上条命令。

### 旧 P1-2 — blocked 后 `stage_close` 未精确报 A118：CLOSED

- `_validate_stage_event` 先取得最新 stage_result，并在节点全关通用检查前对 blocked 报 A118：`tools/relay-light/relay_log.py:2244-2254`。
- `test_a137_stage_close_after_blocked_still_rejected` 精确断言 A118：`tools/relay-light/test_relay_log.py:5285-5298`；同属上述 5 项目标组，独立复跑为 `OK`、exit 0。
- 若未来回归，整改动作是保持 `relay_log.py:2244-2246` 位于 `:2247-2254` 之前；复跑 A137 目标组及全量。

### 旧 P1-3 — C1 原始 RED 证据缺口：CLOSED

- F-007/F-012 没有伪造原始记录：明确写“原始 RED 逐字终端输出不可证”，把遗留四行小结、重建 RED、现态 GREEN 分层登记；重建 RED 为 `Ran 14 tests`、`FAILED (failures=11, errors=3)`、exit 1，且标明“非冒充原始”（`findings.md:16,22`）。这满足 `check.C1.md:30` 冻结的不可恢复时处置。
- F-012 当前仍为“证据登记 · 待 requirement 路裁决”，未越权自封闭合（`findings.md:22`）。
- 若证据表述未来回归，整改动作是恢复 `findings.md:16,22` 的“不可证/重建/现态”三层边界；用 `rg -n "原始 RED.*不可证|重建 RED|非冒充原始|现态" docs/modules/relay-light/workspace/RLT_21/findings.md` 复核。

### 独立测试证据

- 派单原命令 `python -m unittest -v tools/relay-light/test_relay_log.py -k "RelayNotRunRetryTests or RelayLaunchFixStatusTests or RelayLedgerSilenceTests"` → `Ran 0 tests in 0.000s`，`NO TESTS RAN`，exit 1；本报告不把它记作 GREEN。
- 独立补跑：`-k RelayNotRunRetryTests` → `Ran 4 tests in 29.602s`，`OK`，exit 0；`-k RelayLaunchFixStatusTests` → `Ran 2 tests in 9.591s`，`OK`，exit 0；`-k RelayLedgerSilenceTests` → `Ran 3 tests in 0.058s`，`OK`，exit 0。
- 变异前全量：`python -m unittest -v tools/relay-light/test_relay_log.py` → `Ran 181 tests in 523.509s`，`OK`，exit 0，skipped=0。
- 恢复后全量：同命令 → `Ran 181 tests in 478.237s`，`OK`，exit 0，skipped=0。

## 2. 代码轮职责：整卡 diff、实现行为、变异与边界

本报告的代码轮职责系编排裁决的合并口径

只读 `git diff master...HEAD` 与现态实现后，代码轮结论为 **PASS，P1=0**：

- `ref=`：正则只接受 `blocked|agent_lost`，引用必须属于同一 stage instance 且为该实例最新事件（`relay_log.py:2086-2130`）；blocked/failed 始终调用该闸，done/cancelled 仍走 A112 全节点关闭要求（`:2181-2193`）。
- `launch_fix`：NOT_RUN 连续预算、单个用户授权 token、同 token 重拉、每 `(node,agent)` 最多一组及组内重新止损均在 `relay_log.py:1814-1901,1914-1956,1970-1975`；`status` 的不可关原因同时展示 NOT_RUN 计数与 fix 组（`:2466-2503`）。
- 模式门与 `cancelled` 归属：`cancelled` 在 `DECISION_EVENTS`（`relay_log.py:63`）；A69 归属闸与 consult/auto 分路分别在 `:1748-1793`，strategist 的 user_decision 终局要求保持在 `:1796-1811`。
- status 输出合同：`launch_fix`/`ledger_silent` 字段定义在 `relay_log.py:2384-2396`，从 launch note 与最新事件投影在 `:2720-2747`；严格 `idle > threshold`，仅非终态实例标提示。`limits.silence_timeout_min=30` 在 `skill/dh-mapping.toml:27`，SKILL 与两 adapter 均含“三者均无变化”及“不得中断”原文（`skill/SKILL.md:170-173`、`adapter-claude-code.md:90-95`、`adapter-codex.md:89-94`）。
- allowed paths：`master...HEAD` 的累计差异只在 `tools/relay-light/{relay_log.py,test_relay_log.py,skill/**}` 与 `docs/modules/relay-light/workspace/RLT_21/**`；working tree 与 index 在变异恢复后均无 tracked 差异。untracked 中除既有 `done.coder.X1.md`、`done.scribe.R1.md` 外，出现并行 lesson 路的 `review.lesson.X1.md`、`done.lesson.X1.md`；均位于本卡 workspace，本路未读改或背书。
- `git diff --check master...HEAD`、working tree `git diff --check`、index `git diff --cached --check` 均自然无输出、exit 0。

### 有效单测变异

- 选点：`review.md:43` 的 A142 cancelled 归属闸；临时把 `relay_log.py:63` 的 `DECISION_EVENTS` 中 `cancelled` 剔除。
- 变异命令：`python -m unittest -v tools/relay-light/test_relay_log.py -k test_a114_cancelled_uses_triggering_agent` → `Ran 1 test in 4.711s`，`FAILED (failures=1)`，exit 1；目标断言明确变红：`test_relay_log.py:4949` 期望非触发 `checker#1` 被 A69 拒绝（rc 2），实际被放行（rc 0）。
- 恢复后同命令 → `Ran 1 test in 5.960s`，`OK`，exit 0；随后全量 `Ran 181 tests in 478.237s`，`OK`，exit 0。
- 恢复完整性：`git hash-object tools/relay-light/relay_log.py` 与 `git rev-parse HEAD:tools/relay-light/relay_log.py` 同为 `1dd7c7197a3ea90f75bf78e55c400b533912c5b2`；working tree 不再含该文件差异。

### P2（只复述，不裁决）

- P2-1：F-009/A143 按冻结四类逐条计级得到 `3 P1 + 2 P2`，与 oracle 的 `1 P1 + 4 P2` 不可兼得；维持待编排/用户二选一，不改 oracle 或期望数（`findings.md:19`、`check.C2.md:27-37`）。
- P2-2：A140 当前只给非终态在场 agent 标 `ledger_silent`，终态提示范围仍是待裁决口径；只复述，不改实现（`findings.md:15`、`relay_log.py:2742-2746`）。
- P2-3：AGENTS 的 normal 三路与 `dh-mapping.toml` R-stage 两 reviewer 行是层级术语差异；X1 已由编排把 code-round1 合并进 requirement 路，不改 Recipe、不另建第三路（RLT_12 `dispatch/monitor-X1.md:529-536`）。
- P2-4：派单给出的单个 `-k "A or B or C"` 在当前 Python unittest 不解析布尔 OR，实际 0 tests/exit 1；本轮已用三个独立 `-k` 与两次 181 项全量补足证据。后续派单可改为三条命令，或使用多个 `-k` 参数并先验证匹配数。

## 3. P1-3～P1-5：L-005～L-007 存在性与规则原文

本节仅判“存在且规则原文正确”，三项均 **CLOSED**；候选深度、迁移价值与最终收录留给 lesson 路。

- P1-3 / L-005：**存在且正确**（`lesson_candidates.md:14`）。规则原文完整包含 checker 出结论前 coder/checker 均不记 done、FAIL 时 live checker 逐条 checkpoint 且 `routed_to` 同一 coder、同实例整改/复审不新增 attempt/launch、PASS 后 coder→checker 终态。来源事实可由 RLT_12 `dispatch/monitor-C2.md:193-208` 复核。
- P1-4 / L-006：**存在且正确**（`lesson_candidates.md:15`）。规则原文完整包含按菜单文案动态定位 `Yes (Approve once)`、发送后复读确认菜单消失、禁止 bypass/全放行等；来源事实为 RLT_12 `dispatch/monitor-R1.md:347-350`。
- P1-5 / L-007：**存在且正确**（`lesson_candidates.md:16`）。规则原文完整包含长等改用 get+read 轮询、PermissionDenied/Os code 5 退避 5～10 秒重试、连续 3 次前不判 agent_lost、等待必须有接收者；来源事实为 RLT_12 `dispatch/monitor-R1.md:49-50,210-215,351-353`。

四行小结：
做了什么：独立裁决 C1 三条旧 P1、合并执行整卡代码轮职责、核 L-005～L-007 原文。
证据：A137 5 项、A138/A139/A140 分组、有效 cancelled 变异、恢复后 181 项全量均给出自然终态与 exit code。
偏离与 findings：无 P1；P2 共 4 条，其中三条只复述既有口径，新增一条记录派单 `-k` OR 命令匹配 0 项。
下一步：monitor 收取本报告与完成信号；本 reviewer 即停，不进入 F1、verify、提交或远端动作。
