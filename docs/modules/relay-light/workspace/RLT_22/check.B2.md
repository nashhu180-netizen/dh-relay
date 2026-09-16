# RLT_22 · Batch 2 小审

- 审核对象：`e9c1599`（A144 拉起前置 + A146 封口配对闸）
- 审核模式：`dispatch/audit.md` 模式 B · batch-check
- 结论：**PASS**

## P0

无。

## P1

无。

## P2

无。

## 三项重点核查

### 1. A144 反例编号不串

- `_require_trigger()` 的 `on:review_ready:` 分支在 `on:done:` 分支之前独立处理并只报 `HC-RL-A144`；合法信号可放行，B1 的无条件拒绝占位已完整替换。
- `test_a144_rejects_without_a_current_instance_signal` 覆盖九种拒绝序列：无 agent 事件、仅普通 checkpoint、送审方 done / agent_lost / cancelled、信号指向另一判定方、旧 attempt 信号、被后续普通 checkpoint 覆盖、信号后 blocked；均断言 exit 2、A144，且不含 A70。
- `test_a144_launch_gate_replaces_b1_placeholder` 同时证明合法当前实例信号可拉起；重复 reviewer launch 继续由迁移逻辑报 A58 / A49，不串为 A144。

### 2. A146 位点与实例配对

- `_validate_review_pairing()` 由 `_validate_event_semantics()` 的 `AGENT_EVENTS` 分支调用，位于 `_validate_agent_transition()` 之后；`_validate_node_close()` 未加入 A146 逻辑。因此错配在 reviewer 写 `done` 当场退 2，而不是延迟到 node_close。
- `append_event()` 先执行 `_validate_runtime_event()`，通过后才打开账本追加；A146 抛错时不存在落账路径。`test_a146_rejects_at_done_write_time` 另以拒绝前后账本字节完全相同钉住这一点，并证明修正后的 done 可写。
- 旧轮次 `ready_seq`、跨实例拼接、送审实例尚未终态或为 agent_lost 等反例均断言 A146；组合查找同时绑定 node、完整 sender 实例、reviewer 名与最新 signal。

### 3. `_latest_for_instance` 与“最新 agent 事件”

- A144 先从本节点 sender 的 launch 求最大 attempt，再用 `_latest_for_instance(entries, node, sender#max)` 读取当前实例的最新 agent 事件；只有该事件本身是指向目标 reviewer 的 checkpoint 才放行。旧 attempt、普通 checkpoint 覆盖、blocked 与终态覆盖均因此正确拒绝。
- A146 用 `_latest_for_instance(entries, node, reviewed)` 要求被 review 的完整实例最新事件为 done；没有退化为 `_latest_by_name` 的跨 attempt 查询。`ready_seq` 另须是 `(node, reviewed instance, reviewer)` 组合的最新信号，旧轮次与跨实例拼接均无法通过。

## 兼容与预备边界

- 节点内没有任何指向该 reviewer 的 ready 信号时，A146 完全不生效；`test_a146_gate_is_inert_without_a_signal_for_this_agent` 覆盖无信号直接 done，以及节点有指向其他 reviewer 的信号时当前 reviewer 直接 done，两者均接受，满足 A148 预备边界。
- `_validate_agent_transition` 的迁移表、既有 `on:done:` 分支和 `_validate_node_close` 未改；未发现 A60/A70/A58/A49 编号或语义被削弱。

## 验证与范围

- 独立复跑 `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log`：exit 0，`Ran 192 tests in 404.021s`，`OK`。
- 独立复跑 `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`：exit 0；relay-light 段 192 例 `test_relay_log` + 7 例 `test_install_skill` 全部 OK；最终 `RELAY ALL PASS (SKIPPED: 1)`。
- E-008～E-014 的 RED/GREEN、计数与本次静态核查及独立复跑一致。
- `e9c1599` 仅修改 `relay_log.py`、`test_relay_log.py` 与本卡 `progress.md` / `findings.md` / `lesson_candidates.md`，均在允许路径闭集内；`git diff --check` 无输出，未产生 `__pycache__`。

## 裁决

**PASS**。B2 未偏离 task_plan，A144/A146 的编号、校验位点与实例绑定均闭合，未发现新问题，可交回编排进入下一节点。
