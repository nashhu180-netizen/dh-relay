<!-- dh:v1 -->
# check.B1 — RLT_22 Batch 1

- 候选提交：`7d677bd`（`feat(relay-light): RLT_22 B1 trigger 四态扩集与送审信号写入合同`）
- 对照：`task_plan.md` Batch 1、`progress.md` E-002～E-006、design/01 A145/A150 与 B1 的 A144 fail-closed 占位
- 结论：**FAIL**

## 独立复跑

1. `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log`
   - exit 0
   - `Ran 186 tests in 389.875s`，`OK`
2. `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`
   - exit 0
   - `RELAY ALL PASS (SKIPPED: 1)`
   - relay-light 段：186 例 `test_relay_log` + 7 例 `test_install_skill` 全部 OK；唯一 skip 为需显式开启的 `relay-psmux-real`

复跑后无 `tools/relay-light/__pycache__`；`git diff --check` 无输出。

## 核查结果

### P0

无。

### P1-1 — A145 的 A69 helper 隔离用例没有执行其声称的断言

- `task_plan.md:107` 要求同一 note 内 `ready_for_review=` 与 `decider=` 并存时，**断言 A69 只认后者**。
- `test_relay_log.py:1793-1805` 的 `test_a145_helper_scan_sees_decider_only` 只调用 `run_add("checkpoint", note="ready_for_review=plan-reviewer decider=decider#1")` 并断言返回 0。
- 但 `_validate_decision_ownership()` 对 `checkpoint` 在 `event not in DECISION_EVENTS` 时立即返回；该路径不会调用 `_decision_helper()` 或 `_validate_decision_helper()`。因此即使未来 A69 helper 扫描错误地把 `ready_for_review=` 纳入，该用例仍可能保持 GREEN。
- 影响：E-003 所称“`decider=` 并存正例证明 A69 扫描不误命中”没有被测试实际证明；A145 oracle 中“三个新 token 不进 A69 helper 扫描集”的回归证据缺口仍在。
- 整改：保留现有端到端 checkpoint 正例，并新增直接解析断言，例如对同一 note 断言 `relay_log._decision_helper(...) == "decider#1"`，以及由 `_validate_decision_helper(...)` 返回同一实例；同时加入仅含 `ready_for_review=` / `reviewed=` / `ready_seq=` 时不会被识别为 helper 的断言。整改后重跑目标用例、186 例全量与仓级 runner，并更新 E-003/E-004/E-005 的实际计数。

### P2

无。

### 已满足项

- **A150 四态**：空、`on:blocked`、`on:done:<名>`、`on:review_ready:<名>` 正例已覆盖；不存在引用/非法拼写/空目标报 A35，跨节点与 R 形态报 A71；design §3.5 映射表 A35/A71 两行有结构断言。
- **A145 写入合同主体**：合法信号接受；重复 token、目标不存在、目标非判定角色、判定角色自写均退 2 报 A145；连续 3 条信号可写，未设 add 上限。
- **A102 显式正例**：三次 ready checkpoint 后 builder 仍仅有 `#1` launch，lost 后合法重拉为 `builder#2`，证明 checkpoint 往返不消耗 attempt。
- **B1 A144 占位**：无 ready 与已有合法外观 ready 两态下，`on:review_ready:` launch 均退 2 报 A144；stderr 不串 A70，被拒 launch 不落账、账本字节不变。
- **既有编号边界**：`on:done:` 仍由 A70；终态封口、attempt 与重拉相关全量回归保持绿。除 P1-1 的 A69 未形成真实断言外，未发现 A35/A71/A144/A145 编号串线。
- **允许路径**：`7d677bd` 只修改 `relay_log.py`、`test_relay_log.py` 与本卡 `progress.md` / `findings.md` / `lesson_candidates.md`，均在闭集内；`master...HEAD` 仅含本卡工作区、上述两份程序文件，working tree/index/untracked 均无越界项。

## 裁决

**FAIL**。B1 行为实现与两条全量复跑均绿，但 P1-1 使 A145/A69 隔离证据产生假绿窗口。补上真实 helper 解析断言、更新证据并重新派 B1 小审后再进入 B2。

---

## 第二轮

- 复审对象：`e26ba55`（B1 P1-1 整改）
- 结论：**PASS**

### P1-1 — CLOSED

- `test_relay_log.py:1808-1810` 对同一混合 note 直接断言 `_decision_helper(mixed)` 与 `_validate_decision_helper(mixed)` 均只返回 `decider#1`，不再依赖不会进入 A69 helper 的 `checkpoint` 事件路径。
- `test_relay_log.py:1811-1819` 直接覆盖仅含 `ready_for_review=` 以及同时含 `reviewed=` / `ready_seq=` 的 note：低层 helper 返回 `None`，校验 helper 报 `HC-RL-A69`。三个新 token 均被钉在 A69 扫描集之外。
- E-007 的定向变异有效：临时把新 token 纳入两个 helper 的扫描前缀后，同一用例因混合 note 被解析为两个 helper token 而 exit 1；复原后单例通过。该 RED 直接击中新增断言，不是 setup、fixture 或旁路失败；生产文件 `relay_log.py` 无净改动。

### 证据计数与独立复跑

- E-003 的目标集仍为 7 例：整改是在既有 `test_a145_helper_scan_sees_decider_only` 内新增断言，没有新增测试方法，计数保持 7 正确。
- 独立复跑 `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log`：exit 0，`Ran 186 tests in 347.053s`，`OK`；与 E-004 的 186 例口径一致。
- 独立复跑 `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`：exit 0；relay-light 段 186 例 `test_relay_log` 与 7 例 `test_install_skill` 全部 OK，最终 `RELAY ALL PASS (SKIPPED: 1)`；与 E-005 计数一致。

### 新问题与范围

- `e26ba55` 仅在测试中补足 P1-1 的解析层 oracle，并更新本卡证据工件；未修改生产实现。
- `git diff --check` 无输出；复跑未产生 `__pycache__`。未发现编号串线、证据计数漂移或新的 P1/P2 问题。

### 第二轮裁决

**PASS**。第一轮 P1-1 已闭合，E-007 证明断言改坏必红，B1 可交回编排进入下一节点。
