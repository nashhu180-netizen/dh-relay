<!-- dh:v1 -->
# RLT_03 · Batch 4 recheck2 equality mutation gap 独立复验（Codex）

## VERDICT

**P2-1 closed. Implementation findings open = 0. Card remains blocked by F-030/F-031/F-032.**

| 本轮 implementation finding | P0 | P1 | P2 | P3 |
|---|---:|---:|---:|---:|
| open | 0 | 0 | 0 | 0 |

本轮只复验 `batch-4-recheck-sol.md` 新增的 A69 equality mutation test gap。候选测试已补齐 decider/strategist 两路的 `decision` 与 `user_decision`：helper token 的 kind 与格式均合法，但实例由 escalate 的 `#1` 换成 `#2` 时，真实实现均 rc=2、错误编号 A69、账本字节不变。精确失效 `note_helper != owners[agent]` 比较后，目标测试和完整 53 tests 均因错误接受 rc=0 而 exit 1；无 A60、kind 校验或异常崩溃代杀。

这只关闭 implementation/test finding F-035。F-030、F-031、F-032 三项 formal planning-contract conflicts 未被修改也未被本轮重新裁决，仍使 RLT_03 Batch 4/card 保持 blocked；本报告不是整卡 approved/complete。

## 候选差异与生产不变性

- 生产 `tools/relay-light/relay_log.py` SHA-256 复验前后均为 `3d6f251009a5caa7dbc5228b1602ee7902643a9d7ce58eb758effb90ef1cb774`，与 `batch-4-recheck-sol.md` 基线一致。
- 当前 `tools/relay-light/test_relay_log.py` SHA-256 为 `cf69e63c1845bf390565489755770059deb95e314fa4b71fc3d4f43fe78e1863`；新增断言位于 `test_decision_events_carry_the_same_helper_token_as_the_escalate`（`test_relay_log.py:1045-1102`）。
- 候选记录 F-035 resolved，并声明仅测试与 workspace 账本变化；本 reviewer 未修改生产、测试、progress、findings、DevPlan、design、旧 review 或 `review.md`。

## 状态顺序与四条直证

测试对每个 helper kind 使用独立账本，并先建立合法前置：

```text
plan_loaded(skill=0.1.0) -> node_start -> coder#1 agent_launch
decider: blocked -> escalate(decider=decider#1)
strategist: escalate(strategist=strategist#1)
```

随后在合法 `escalate` 状态尝试错误实例的 `decision`；确认被拒且不落行后，写入正确 `decision #1`，再完成 helper 的合法 launch（strategist 另有 done），最后在合法 `decision` 状态尝试错误实例的 `user_decision`。因此两种事件都抵达各自允许的 A60 前驱，token 又通过 kind/格式校验，失败只能归因于 equality guard。

独立真 CLI 结果：

```text
decider decision(decider=decider#2):           rc=2 A69=true no_write=true
decider user_decision(decider=decider#2):      rc=2 A69=true no_write=true
strategist decision(strategist=strategist#2):  rc=2 A69=true no_write=true
strategist user_decision(strategist=strategist#2): rc=2 A69=true no_write=true
```

测试源码在每次错误 `decision` / `user_decision` 前保存 ledger bytes，并在 rc=2、stderr A69 后断言字节完全相等（`test_relay_log.py:1064-1077,1083-1097`）。

## 独立 suite

```text
python3 -m unittest tools/relay-light/test_relay_log.py -v
Ran 53 tests in 25.268s
OK
exit 0
```

命令未使用管道、tee、`|| true` 或其它退出码掩蔽。

## 精确 mutation

### M1 · 通用 equality guard 失效

隔离副本只作以下变化，token 数量、格式、kind 校验及状态机均保持原样：

```python
if note_helper != owners[agent]:
# ->
if False and note_helper != owners[agent]:
```

结果：

```text
target test: Ran 1 test; FAILED (failures=2); exit 1
full suite:  Ran 53 tests; FAILED (failures=2); exit 1
```

两处失败均位于 `wrong_instance_decision.returncode`，decider/strategist 的合法 `#2` token 被 mutation 错误接受为 rc=0，断言明确显示 `2 != 0`。没有 RelayError 编号变化、A60、kind 校验或 IndexError 等次生失败。

### M2 · 仅放过 user_decision equality

为确认后半链也有独立判别力，另一隔离副本保留 decision equality，只令 user_decision 绕过 equality：

```python
if note_helper != owners[agent]:
# ->
if event == "decision" and note_helper != owners[agent]:
```

目标测试 exit 1，decider/strategist 两处都准确失败在 `wrong_instance_user_decision.returncode`，实际 rc=0、期望 rc=2；前面的 wrong-instance decision 仍由 A69 正常拒绝，所以测试确实到达合法 decision 前驱后才揭示 user_decision 回退。该结果排除了 A60/kind 次生杀死。

两个 mutation 均只存在于 `/tmp/rlt03-b4r2-sol-mutation.*` 副本，现已删除。

## Scope / hygiene

- branch / HEAD：`wt/RLT_03` / `baf2aad6aa5cf5b8fc0941411bbb30a0ebac8a6b`。
- `python3 -m py_compile tools/relay-light/relay_log.py tools/relay-light/test_relay_log.py` exit 0；`git diff --check` exit 0。
- suite、py_compile 和 mutation 生成的 `.pyc` 已精确删除，空 `__pycache__` 已删除；最终 pycache 扫描无输出。
- 复验前存在的 DevPlan WIP、RLT_03 workspace 与 `tools/relay-light/` 状态保持；本 reviewer 唯一持久写入为本报告。
- 未 commit、verify、启动 RLT_05 或下一卡。

## Closure

**F-035 / batch-4-recheck P2-1: closed.** 真实四路径、无写入断言、通用 equality mutation 与 user_decision-only mutation 共同证明新增回归网能区分该 guard。

**Implementation findings open: 0.**

**Card status: blocked.** F-030（A73 vs §3.5/A62）、F-031（A90 vs A62 exact schema）、F-032（A88 mapping vs RLT_05 allowed paths）仍 open，故 RLT_03 不得 approved/complete。
