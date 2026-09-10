<!-- dh:v1 -->
# RLT_03 · Batch 3 rework=1 独立只读复验（Codex）

## 结论

**verdict: approved**

| 级别 | 数量 |
|---|---:|
| P0 | 0 |
| P1 | 0 |
| P2 | 0 |
| P3 | 0 |

`batch-3-sol.md` 的四项 rework 要求均已闭环：A69 helper 启动后的决策事件仍绑定原 triggering/blocked agent；A60 禁止原 agent 跳过 `resume` 直接 `done` 且保留 helper `launch -> done`；A58 在合法重拉前因后单独咬住精确 `+1`；A17 在 close agent 已 done 时仍会拒绝另一已 launch 但未终态的 agent。四个对应回退变异均转红，42 条 focused tests 全绿。

本批复验仅批准 **Batch 3 rework=1**，不是 RLT_03 整卡验收、verify、Batch 4 或 RLT_05 启动信号。

## 复验基线与边界

| 项 | 实测 |
|---|---|
| worktree | `/home/nash/work/dh-relay/.dh-worktrees/RLT_03` |
| branch / HEAD | `wt/RLT_03` / `baf2aad6aa5cf5b8fc0941411bbb30a0ebac8a6b` |
| 生产文件 SHA-256 | `relay_log.py` = `5be63d4b0ce96ac8a82b3feff51f0deffccea87a9129d7c575b0e0351cb11e11` |
| 测试文件 SHA-256 | `test_relay_log.py` = `4ca871e38a693d409e7e5fc56218f9602e476f7d091e805c3feac8f76c28cd76` |
| 权威口径 | DevPlan RLT_03 > design/01 §3.1–3.5、§5.1–5.3、§9.1–9.4、RLT_03 验收表 > workspace task plan |
| 唯一写入 | 本报告 `reviews/batch-3-recheck-sol.md` |
| 禁止边界 | 未改生产/测试/DevPlan/progress/findings/旧 review；未 commit、未派活、未进 Batch 4/RLT_05 |

## 前轮 finding 闭环表

| 前轮 finding | 结果 | 实现核心 | 独立行为证据 | 变异证据 |
|---|---|---|---|---|
| P1-1 / F-025 · A69 决策事件归属 | **closed** | `_validate_decision_ownership()` 在 agent transition 前执行（`relay_log.py:554-591, 672-674`）；helper 名只能在 note，已 launch helper 不能成为决策事件 owner | decider/strategist 两条链中，helper-owned `escalate` 与 `decision` 均 rc=2 + A69；原 coder-owned `decision` 均 rc=0 | 删除 ownership validator 调用后，`test_decider_and_strategist_escalations_stay_with_the_triggering_agent` 失败 |
| P1-2 / F-026 · A60 `decision/user_decision -> done` | **closed** | `done` 只接受 `agent_launch/checkpoint/resume` 为前驱（`relay_log.py:622-634`） | 原 coder 在 `decision` 或 `user_decision` 后直接 done 均 rc=2 + A60；`resume -> done` 均 rc=0；decider/strategist `launch -> done` 均 rc=0 | 把 `decision/user_decision` 加回 done 前驱后，`test_decision_and_user_decision_must_resume_before_original_agent_done` 失败 2 个 subtest |
| P2-1 / F-027 · A58 精确 `+1` 判别力 | **closed** | `agent_launch` 对 prior attempt 执行精确 `prior + 1` 校验（`relay_log.py:597-613`） | `agent_lost` 与 `cancelled` 两种合法前因后，重号 `#1` 和跳号 `#3` 均 rc=2 + A58，精确 `#2` rc=0 | 删除 exact `+1` 闸后，`test_relaunch_attempt_increment_is_exact_after_terminal_causes` 失败 2 个 subtest |
| P2-2 / F-028 · A17 条件 1 判别力 | **closed** | close 遍历本节点全部已 launch instances，逐个要求最新事件为终态（`relay_log.py:637-653`） | close agent `checker#1` 已 done，但另一已 launch `coder#1` 仍 open 时，`node_close` rc=2 + A17 且错误点名 `coder#1` | 将 launched-agent 遍历换成空集后，`test_node_close_names_a_nonterminal_launched_agent_even_when_close_agent_is_done` 失败 |

## 独立复跑证据

### E-B3R1-SOL-01 · full focused suite

```text
python3 -m unittest tools/relay-light/test_relay_log.py -v
Ran 42 tests in 17.724s
OK
exit 0
```

`python3 -m py_compile tools/relay-light/relay_log.py tools/relay-light/test_relay_log.py` 与 `git diff --check` 均 exit 0。

### E-B3R1-SOL-02 · 目标对抗序列

```text
A69 decider helper escalation: rc=2 HC-RL-A69
A69 decider helper decision:   rc=2 HC-RL-A69
A69 decider original decision: rc=0
A60 decider helper done:       rc=0

A69 strategist helper escalation: rc=2 HC-RL-A69
A69 strategist helper decision:   rc=2 HC-RL-A69
A69 strategist original decision: rc=0
A60 strategist helper done:       rc=0

A60 owner done after decision:      rc=2 HC-RL-A60
A60 owner done after user_decision: rc=2 HC-RL-A60
A60 owner resume -> done:            rc=0 -> rc=0

A58 after agent_lost: #1 rc=2, #3 rc=2, exact #2 rc=0
A58 after cancelled:  #1 rc=2, #3 rc=2, exact #2 rc=0

A17 close-agent done + coder open: node_close rc=2 HC-RL-A17, message names coder#1
```

以上均通过真 CLI `add` 写入 `TemporaryDirectory` 中的计划/账本，未直接调用内部 validator 伪造结果。

### E-B3R1-SOL-03 · 四项回退变异

| 变异 | 目标测试 | 结果 |
|---|---|---|
| 删除 `_validate_decision_ownership(...)` 调用 | A69 ownership | exit 1 / FAILED (1 failure) |
| 恢复 `decision/user_decision -> done` | A60 resume gate | exit 1 / FAILED (2 failures) |
| 删除 `attempt == prior + 1` | A58 exact increment | exit 1 / FAILED (2 failures) |
| 删除 all-launched-terminal 遍历 | A17 condition 1 | exit 1 / FAILED (1 failure) |

变异只在 `/tmp/rlt03-b3r1-recheck.*` 副本执行；副本与临时目录已删除，仓内生产/测试字节未被复验者改动。

## 范围、持久化与卫生检查

- 生产源码仍只以 `open(ledger_path, "a", encoding="utf-8", newline="")` 追加一行 JSON + `\n`（`relay_log.py:696-697`）。
- 生产源码对 `.lower(` / `.casefold(` / lock APIs / `tempfile` / `mkstemp` / replace/rename/move / `pane` 扫描零命中；import 仅 Python 标准库。
- `relay_log.py` / `test_relay_log.py` 对 Batch 4/RLT_05 的 A43/A44/A61/A62/A65/A80/A81/A85/A89/A93/A94/A96/A97/A102/A103/A105–A108/A110–A114/A116/A118–A123 与 `roles.toml` / `dh-mapping` 扫描零命中；未扩展非空账本 status stub。
- 当前 worktree 边界仍是入场已有的 DevPlan WIP + RLT_03 workspace + `tools/relay-light/`；本 reviewer 只新增本报告。
- focused suite / py_compile 产生的两个 `.pyc` 已精确删除，空 `__pycache__` 目录已删除；最终 `find tools/relay-light -name __pycache__ -o -name '*.pyc'` 无输出。`.gitignore` 仍不在本卡授权内，后续精确暂存时仍须避免带入生成物。

## 复验结语

前轮 2 条 P1 与 2 条 P2 均有当前实现、真 CLI 对抗序列和可判别变异三重证据，未发现 rework=1 引入的新 P0–P3。**Batch 3 rework=1 approved**；停在本节点，由主控决定后续。
