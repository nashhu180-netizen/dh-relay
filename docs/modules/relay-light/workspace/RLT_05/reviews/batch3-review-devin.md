# RLT_05 Batch 3 小审 — Devin SWE-2 Max

- 派出：E-061
- reviewer：`rlt05-b3-review-devin`，Devin CLI `SWE-2 Max`，fresh，非施工者
- 形态：`/tmp/rlt05-b3-devin.c1ranR/repo` hash-matched 隔离副本；Plan 模式；仓内只读
- 范围：Batch 3 的 A110/A111/A112/A105/A118/A106/A85/A93/A89 与 B3-F2；不含 Batch 4/heavy 最终复核
- 结论：`CHANGES_REQUIRED`
- 计数：P0=0，P1=1，P2=3，open=4

## 动态与边界

- 两份 Python 与 E-060 哈希一致；两 TOML 与 E-007 一致；`git diff --check` exit 0；无 `__pycache__`。
- 全文件动态为 90/94 通过；4 个 ERROR 均因只读快照的 `0444` TOML 被 `copytree` 保留权限，测试随后尝试改写临时副本而触发 `PermissionError`，属环境假红。Batch 3 focused 10/10、Batch 2 status 12/12 与 RLT_03 回归均通过。
- reviewer 未修改代码、Git、配置或计划工件，未进入 Batch 4/heavy review。

## Findings

| ID | 级别 | 位置 | 事实与影响 | 最小闭合 |
|---|---|---|---|---|
| F-B3-PRESTART-INTERVAL | P1 | `tools/relay-light/relay_log.py:925-949,1012-1097,1292-1332`；design §3.4/§3.7/A93 | A93 只封 `stage_close` 后的右边界，没有要求 monitor-owned 事件发生在本实例 `stage_start` 后。真实 CLI 中 C#1 的 `node_start→agent_launch→done→node_close→stage_result(done)` 全部可在 C#1 `stage_start` 前成功，之后补 `stage_start` 与零 `monitor_launch` 的 `stage_close` 也成功；`status.errors=[]`。同样可在 C#1 尚 open 时启动未 start 的 R#1。 | add 侧为 monitor-owned 事件补实例 `stage_start` 下界；status 侧镜像报警；`stage_close` 要求本实例至少一次 `monitor_launch`；补有效红及 focused/full/CLI 证据。 |
| F-B3-CURRENT-STAGE-MIDPLAN | P2 | `tools/relay-light/relay_log.py:1444-1455`；design §3.5/§7.3 | W→C→R 中，C 已 `stage_result done` 但未 `stage_close`、R 未启动时，status 却给 `current_stage=R#1`、`last_stage_result=null`、`suggested_action=none`，恢复路由看不到 C 的待消费结果。B3-F2 的 all-closed fallback 本身获 reviewer 接受，但同一理由也适用于此中间窗口。 | 主控裁决 `current_stage` 权威口径；若取 open 实例优先，补中段 fixture 并统一投影。 |
| F-B3-RELAUNCH-COUNT | P2 | `tools/relay-light/relay_log.py:1411-1412,1456`；design §3.5/§7.3 | `monitor_relaunch_count=max(0, monitor_launch数-1)` 会把监工崩溃恢复也算成“因 failed 重拉”，可能提前耗尽 A106 的一次重拉机会。 | 区分 failed 因果，或由主控显式接受 Batch 4 延后并在本批合同中登记。 |
| F-B3-A89-BRANCH-EVIDENCE | P2 | `tools/relay-light/test_relay_log.py:2423`；`tools/relay-light/relay_log.py:1045-1058` | “monitor_launch 必须晚于本实例 stage_start”的测试使用未知 R#1，实际在 unknown-stage 分支已退出，没有命中目标分支；删除目标检查也不会让该测试失败。 | 换成已知但未 start 的实例，先取目标分支有效红，再恢复绿。 |

## P3 记录

- `_open_stage_ids()` 不含 `monitor_launch`，使 `relay_log.py:1053` 的 launch-in-seen 分支不可达。
- `_stage_of()` note-first 归属允许 closed W#1 节点事件通过携带 open C#1 的 `stage_id=` 绕过 A93；真实 CLI 已复现。
- stage 级事件未核 `node` 是否为实例首节点；部分 legacy ledger 异常未进入 `status.errors`。
- A85 测试矩阵仍缺 monitor→`stage_close`/`monitor_launch` 两格；A89 同字母跨实例依赖语义仍有歧义。

## B3-F2 与 fixture 裁决

- **B3-F2：接受。** 全部节点已关但实例尚未 `stage_close` 时，以最新 `stage_start` 的 open 实例兜底 `current_stage`，可让 A106 的结果分路保持可判定；实例关闭后回到 null/none 合理。需另行闭合 `F-B3-CURRENT-STAGE-MIDPLAN` 的相邻窗口。
- **E-058：接受。** 三条旧 fixture 都依赖新合同明确禁止的旧行为；改写保留原 HC-ID 断言并增加 A85 判别，没有削弱仍有效合同。
- **E-059：接受。** helper 拆分、latest-result 期望修正与 B3-F2 对齐均有合同依据。

## Verdict

`CHANGES_REQUIRED`。先由独立施工会话闭合 P1，并对三个 P2 给出实现或显式裁决；随后使用 fresh reviewer 做定向复审。Batch 4 保持锁定。
