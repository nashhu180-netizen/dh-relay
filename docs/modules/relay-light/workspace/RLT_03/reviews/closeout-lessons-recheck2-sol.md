<!-- dh:v1 -->
# RLT_03 · heavy Recipe lessons detail-rework=2 同路径复验（Sol）

## 复验身份与基线

| 项 | 实测 |
|---|---|
| review_path_id | `lessons` |
| 角色 | lessons 同路径第二次复验 worker；非主控、非施工者 |
| pane / session | `w15:pD` / `kpi-agg` |
| Codex session | `01a08a6f-9b1d-7d41-b261-b04e675deeb8` |
| 实际模型配置 | `gpt-5.6-sol`，`model_reasoning_effort=medium` |
| worktree | `/home/nash/work/dh-relay/.dh-worktrees/RLT_03` |
| branch / HEAD | `wt/RLT_03` / `e4b4cd68c163f32ef4324ea16d49dda53b5f44bc` |
| 当前生产 / 测试 SHA-256 | `relay_log.py=f484ffba…7ceb1e`；`test_relay_log.py=8c2098fc…00dbd` |
| 唯一写入 | 本报告；未改代码、findings/progress/lesson/review、DevPlan，未 commit/push |

## VERDICT

**VERDICT=APPROVE**

| 级别 | open |
|---|---:|
| P0 | 0 |
| P1 | 0 |
| P2 | 0 |
| P3 | 0 |

`closeout-lessons-recheck-sol.md` 遗留的 `P2-LESSONS-2` 已由 detail-rework=2 真正闭合：旧断言在仅改诊断 detail 时产生 3 个纯 regex 假红；新断言面对同一 production 变异不假红；rc、错误 code、stdout 与账本零写入/字节不变等行为判据仍在。F-042 的 `resolved` 与 L-003 的更新均有 E-063 支撑。

## E-063 复验

### 1. 当前 diff 与整改目标一致

`tools/relay-light/test_relay_log.py` 的两处目标变化为：

| 位置 | 旧断言 | 新断言 | 保留/新增的稳定行为判据 |
|---|---|---|---|
| 空 `cards` CLI | `^error: HC-RL-A18 marker cards=` | `^error: HC-RL-A18 ` | rc=3、stdout 空 |
| 坏账本行 | `^error: ledger line 1: ` | `^error: ledger ` | rc=4、stdout 空；新增执行前后 ledger bytes 相等 |

生产文件在 detail-rework=2 中没有改动；F-042 精确登记两处残留及 E-063 红绿，L-003 也把“E-054 只关四处、E-063 才完成同类枚举闭合”的过程事实保留下来，没有把中间态证据改写成一次完成。

### 2. 同一 detail-only 变异的旧红 / 新绿

本复验在独立临时副本中只改生产诊断文字：

- `marker cards= must contain at least one card` → `cards list must contain at least one card`；
- 七处 `line {expected_seq}: ...` → `record {expected_seq}: ...`。

code、退出码和拒绝行为均未改。然后以同一变异生产文件分别运行旧、新两版目标断言：

```text
旧断言：Ran 2 tests in 0.522s
FAILED (failures=3)
old_rc=1；3/3 均为 Regex didn't match

新断言：Ran 2 tests in 0.554s
OK
new_rc=0
```

旧版的 3 个 failure 来自空 cards 一次，以及坏账本用例的两个 subTest；没有 fixture/setup/import/TypeError 或行为码变化。新断言在完全相同的 production detail 变异上通过，直接证明这两处不再把合法诊断改写误判为行为回归。临时副本已移入系统回收站，仓内文件未修改。

### 3. 行为判据没有因放宽 detail 而丢失

- 空 cards 用例仍要求 rc=3、stdout 为空、stderr 以稳定 `HC-RL-A18` code 开头。
- 坏账本两个 subTest 仍要求 rc=4、stdout 为空、stderr 使用稳定 `ledger` code；并在读取前保存 bytes、命令后断言 bytes 完全相等。
- 全测试文件对旧的 `marker cards=` / `ledger line 1:` 断言扫描为零命中。
- `HC-RL-A17 .*coder#1` 保留是正确的：A17 冻结合同要求不可关原因列出具体未终态 agent，它不是任意 detail 绑定。

## 独立测试结果

```text
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tools/relay-light/test_relay_log.py \
  -k empty_cards_is_a_plan_parse_error -k ledger_read_rejects_extra_keys
Ran 2 tests in 0.632s
OK
exit 0

PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tools/relay-light/test_relay_log.py -q
Ran 54 tests in 64.137s
OK
exit 0
```

未生成 `__pycache__` / `*.pyc`；目标报告 `git diff --check` 通过。

## P0～P3 扫描

- P0：0。无安全、数据破坏或发布阻断问题。
- P1：0。两处整改没有移除 fail-closed 行为判据，54 tests 全绿。
- P2：0。旧断言假红、新断言同变异不假红、零 mutation 与全量绿均有独立证据；F-042 可保持 resolved。
- P3：0。L-003 对两轮整改的叙述准确，未发现新的非阻塞 lessons 缺口。

## 派出证据 E-064

| ID | 类型 | 手段 | 结果 |
|---|---|---|---|
| E-064 | lessons detail-rework=2 independent recheck | 回读 E-063/F-042/L-003、当前 test diff 与前轮报告；隔离副本复现相同 detail-only 变异的旧红新绿；真实树目标 2 tests 与全量 54 tests；旧字符串、pycache、diff-check 扫描 | `VERDICT=APPROVE`；P0=0/P1=0/P2=0/P3=0；旧断言 2 tests/3 regex failures，新断言同变异 2 tests OK；真实树 54 tests OK；P2-LESSONS-2 closed |

本报告只批准 lessons detail-rework=2，不替主控裁决整卡，不代签 verify，不启动下一节点。
