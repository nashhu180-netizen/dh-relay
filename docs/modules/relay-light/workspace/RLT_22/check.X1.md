# RLT_22 · X1 整改批小审

- 审核对象：`2a8f7e6`（ready_seq 畸形输入 fail-closed + P3-1 注释清理）
- 结论：**PASS**

## P0

无。

## P1

无。

## P2 / P3 闭合核查

### 1. 畸形 `ready_seq` — CLOSED

- `_validate_review_pairing()` 的守卫已由单独 `isdigit()` 加严为 `isascii() and isdigit()`；只有 ASCII 十进制串会进入后续 `int()`，Unicode 数字及混合畸形值均在语义校验处以 `HC-RL-A146` fail closed。
- `test_a146_malformed_ready_seq_exits_two_not_crash` 覆盖 `²`、`四`、`½`、`①`、ASCII 数字与 Unicode 数字混合、带千分位六种输入；每例均断言 exit 2 且 stderr 以 `HC-RL-A146` 开头，循环后断言账本与基线逐字节相同。
- E-022 是有效真反例：修复前 `²`、`①`、`6²` 被 `str.isdigit()` 放过，随后 `int()` 抛 `ValueError`，进程 exit 1；修复后目标类与本次全量复跑均绿，不是仅凭静态推断。

### 2. P3-1 陈旧注释 — CLOSED

- `test_runtime_trigger_and_dependency_gates` 已删除 “the B1 placeholder” 陈旧描述，现准确表述为：缺少 `ready_for_review` 信号时 A144 fail closed，且不落入 A70 的 `on:done:` 分支。
- 当前 `test_relay_log.py` 已无 `B1 placeholder` / `the B1 placeholder` 命中。

## 回归与范围

- 独立复跑 `cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log`：exit 0，`Ran 203 tests in 584.606s`，`OK`。
- 独立复跑 `PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1`：exit 0；relay-light 段 203 例 `test_relay_log` + 7 例 `test_install_skill` 全部 OK；最终 `RELAY ALL PASS (SKIPPED: 1)`。
- `2a8f7e6` 仅修改本卡 `progress.md`、`tools/relay-light/relay_log.py` 与 `tools/relay-light/test_relay_log.py`，全部位于允许路径闭集；`git diff --check` 无输出，复跑未产生 `__pycache__`。
- 未发现 A146 编号串线、账本落行、越界修改或行为回归。

## 裁决

**PASS**。X1 整改完整闭合，可交回编排继续 R 批复核。
