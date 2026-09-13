<!-- dh:v1 -->
# check.C3 — RLT_10 Batch 3 checker

- 审核对象：exec commit `3db8ad8`，READY_FOR_REVIEW 信号 commit `dc05e50`
- 审核边界：仅判断 B3 是否偏离 task_plan、是否越 allowed-paths、A11 验证是否真绿
- 结论：**FAIL**

## 1. 是否偏离 task_plan

**FAIL（实现与执行顺序通过，证据账有一处事实误记）。**

- 新壳按 `python` 后 `python3` 顺序取第一个 Application；两者均缺时输出固定 `SUITE SKIP` 并 exit 0；从 `$PSScriptRoot` 上溯仓根，顺序 shell out 两份 Python unittest，首个非零以 `$LASTEXITCODE` 退出。没有复制测试或在 PowerShell 中重写断言。
- `run-relay-tests.ps1` 只在 `$suites` 原末项补逗号并追加 `'relay-light-log.ps1'`；`foreach`、失败/skip 计数及最终总结完全未改。
- B3 在 B2 audit PASS 后开始，先取入口缺席 RED；施工后写 READY_FOR_REVIEW 并停止，没有提前写 CONSTRUCTION_DONE。
- 但 READY 信号引用的 E-B3-004 把薄壳原始结果记为“`test_relay_log` 148 项 + `test_install_skill` 4 项 OK”。审核者实际复跑显示两份文件分别为 **141 项**与 **7 项**，合计 148；因此该 E-ID 的分项测试数不是原始输出事实。

### 可整改项

1. 不改写历史 READY 信号；在 `progress.md` 追加更正证据，明确薄壳独立运行的真实分项为 `test_relay_log.py: Ran 141 tests, OK (skipped=2)`、`test_install_skill.py: Ran 7 tests, OK`，薄壳 exit 0。
2. 追加一条新的 Batch 3 READY_FOR_REVIEW 信号，引用更正后的稳定 E-ID、E-B3-003/E-B3-005/E-B3-007 与施工 commit `3db8ad8`，再申请定向复审。

## 2. 是否越允许路径

**PASS。**

- `3db8ad8` 只新增 `tools/tests/relay-light-log.ps1`、修改 `tools/tests/run-relay-tests.ps1`，并更新 RLT_10 `progress.md` / `lesson_candidates.md`；均在 allowed-paths 闭集内。
- `dc05e50` 只向 RLT_10 `progress.md` 追加 READY_FOR_REVIEW 信号。
- B3 对 `relay_log.py`、`install_skill.py` 和其它 suite 零 diff；runner 循环架构未改。
- 两个提交的 `git diff --check` 均通过。独立复跑产生的 `__pycache__` 已按测试前干净基线清理，working tree、index、untracked 三集合随后均为空。

## 3. B3 验证命令是否真绿

**PASS。** 审核者在 `dc05e50` 上独立复跑：

- 缺解释器隔离分支：stdout 恰一行 `SUITE SKIP relay-light-log (python/python3 missing)`，stderr 0 字节，exit 0。
- 非零透传隔离分支：把 `python` 指向 `/bin/false`，薄壳 exit 1，证明首个 Python 非零退出码未被吞掉。
- 薄壳独立运行：exit 0；`test_relay_log.py` Ran 141 tests，OK (skipped=2)；`test_install_skill.py` Ran 7 tests，OK。
- 全量 runner：exit 0；第 740 行命中 `=== relay-light-log.ps1 ===`，第 1000 行为 `RELAY ALL PASS (SKIPPED: 1)`；其中薄壳同样显示 141 + 7 项全绿。
- E-B3-005 的 suite 标头、最终总结与行号可复现；E-B3-003 的 SKIP/透传结论可复现。E-B3-004 只有分项计数误记，不改变真实 GREEN。

## 裁决

**FAIL**。薄壳实现、runner 登记、循环保护、允许路径、缺 Python 分支、非零透传和真实全量运行均通过；仅 E-B3-004 的分项测试数与原始输出不一致。按上述两项更正证据并重新发 READY_FOR_REVIEW 后，可作定向复审。

---

## 定向复审

- 审核对象：整改 commit `3209efb`；施工仍为 `3db8ad8`
- 审核范围：仅核 E-B3-008 分项计数与新 READY_FOR_REVIEW 信号；其余结论不重审
- 结论：**PASS**

### 可整改项 1 — CLOSED

E-B3-008 追加记录薄壳复跑的原始分项：`test_relay_log.py` Ran 141 tests、OK (skipped=2)；`test_install_skill.py` Ran 7 tests、OK；合计 148，薄壳 exit 0。该分项与审核者首轮独立复跑取得的 141 + 7 结构一致，已明确更正 E-B3-004 的 148 + 4 误记；历史证据未被改写。

### 可整改项 2 — CLOSED

历史 READY_FOR_REVIEW 信号保持原样，其后已追加新信号：

```text
DONE task=RLT_10 role=exec batch=3 status=READY_FOR_REVIEW evidence=E-B3-008,E-B3-003,E-B3-005,E-B3-007,commit=3db8ad8 next=orchestrator
```

新信号正确引用更正证据 E-B3-008、缺解释器/非零透传 E-B3-003、全量 runner E-B3-005、边界 E-B3-007，以及原施工 commit `3db8ad8`。

### 复审裁决

**PASS**。两项可整改项均已闭合；本轮未重开 Batch 3 其他已通过结论。
