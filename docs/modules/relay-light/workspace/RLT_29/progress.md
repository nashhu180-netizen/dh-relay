<!-- progress.md — 施工进展与验证证据索引；不是运行真相 -->
# progress — RLT_29

## 写入合同

- 仅当前顺序执行的 batch coder 可在自己 batch 追加一条简洁施工里程碑与证据引用。
- monitor、reviewer、orchestrator 禁止写本文件。
- 禁止记录 pane/agent 状态、轮询、通知、终端输出或运行快照。
- 恢复权威是 durable signals + 独立 review/decision 工件 + `execution_strategy.md` 配置 + Herdr 实态；本文件只作施工证据索引。

## 施工里程碑

| batch | coder | 里程碑 | 证据引用 | 结论 |
|---|---|---|---|---|
| 1 | coder#b1 | AGENTS 增 single-task 分流/互斥/RELAY_RECEIPT 分角色 fail-closed 段；SKILL 增 single-task 节（model-allocation 启动前闸、phase/计数/sole writer、signal schema、monitor repo 只读与安全 Enter、batch PASS 清理闸、恢复四类权威、授权边界）；baseline B-01..B-06 与 §7 验证全绿（B-06 按裁决修订命令重跑 PASS） | docs/modules/relay-light/workspace/RLT_29/evidence/baseline/summary.json; docs/modules/relay-light/workspace/RLT_29/evidence/baseline/summary-rerun-quotepath.json; docs/modules/relay-light/workspace/RLT_29/evidence/batch-1/ | 已验证 |
| 2 | coder#b2 | 双 adapter 各增 single-task 节：启动/派单标头与 phase 闭集、model-allocation 询问确认闸（未确认零启动/逐角色修改/变更重问/默认仅提案/最大权限不替代确认）、独立具名 tab/pane、durable signal 单行 schema 与 RELAY_RECEIPT 分角色 fail-closed、monitor 120 秒 wait/get/read 无变化静默+安全 Enter 三条件单次复验失败换 fresh、monitor repo/workspace 零写入、四类恢复权威；§8 验证全绿（install OK、roles.toml/禁改路径零 diff、diff-check/allowlist/plan-log PASS，各命令 exit 落证据） | docs/modules/relay-light/workspace/RLT_29/evidence/batch-2/ | 已验证 |
| 3 | coder#b3 | test_install_skill.py 增 SingleTaskStructureTests 11 条纯文本结构断言（model-allocation 闸正反例/RELAY_RECEIPT 分角色 fail-closed/monitor 零写/拓扑/signal schema/恢复权威/roles.toml 不写死）+ roles.toml 字节一致断言；对 93d65cb 快照有效 RED（11 断言失败）→ 现状 GREEN（19 tests OK）；五文件双副本 sha256 全 MATCH、roles.toml 零 diff；落 model-allocation 实态核对与 as-built 快照；post B-01/02/03/05/06 全绿，B-04 未过（7 条 RLT_29-owned review.md R12/R17 仍在 + RLT_27 R30 inherited 摘要漂移，均在本批禁改路径上） | docs/modules/relay-light/workspace/RLT_29/evidence/batch-3/; docs/modules/relay-light/as-built/single-task-实现快照.md | BLOCKED |

> 模板：`| <1|2|3> | <coder instance> | <简洁施工进展> | <repo-relative evidence paths> | <已验证|进行中|BLOCKED> |`

## 证据账本（Evidence Ledger）

本次按 `decision.batch-3-b04-evidence-id.md` 裁决由原 batch-3 coder（coder#b3，同会话）对既有证据做索引补登记：原执行者/采集时间与本次核对登记者/登记时间分开记录；账本只作证据索引，不作运行真相。登记前已逐件只读核对来源存在与事实；ID 闭集 E-301..E-304，不登记未核实项。

| ID | 类型 | command/scenario | result | path | 登记来源与范围 |
|---|---|---|---|---|---|
| E-301 | test | `cd /home/nash/work/dh-relay/.dh-worktrees/RLT_29` 后 `PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=tools/relay-light python3 -m unittest tools/relay-light/test_install_skill.py`（原执行 coder#b3，2026-09-23 采集） | exit=0，19 tests OK（8 install + 11 single-task 结构断言）；仅为测试结果，不表示需求场景满足 | docs/modules/relay-light/workspace/RLT_29/evidence/batch-3/post/B-01.txt（sha256 e5fb50b1f6dae3d6ca02b40af7aea213ac8644a1ac56137777aa13fa949f25c5）；docs/modules/relay-light/workspace/RLT_29/evidence/batch-3/post/B-01.exit（sha256 9a271f2a916b0b6ee6cecb2426f0b3206ef074578be55d9bc94f6f3fe3ab86aa） | 原执行 coder#b3；本次核对登记 coder#b3（2026-09-23）；范围仅本条命令的真实输出与退出码 |
| E-302 | diagnostic | `cd /home/nash/work/dh-relay/.dh-worktrees/RLT_29` 后 `dh relay-light`，并按 §5.3 与 baseline failure 集合比对（原执行 coder#b3，2026-09-23 采集） | exit=1；66 失败、36 警告；comparison verdict=fail——如实失败未收敛：7/7 RLT_29-owned（review.md R12+6×R17）仍在，另 1 条 inherited（RLT_27 R30）摘要漂移 | docs/modules/relay-light/workspace/RLT_29/evidence/batch-3/post/B-04.txt（sha256 50d91639ad52f82e5b9075124ca7887decde820f760aca6079dabdebbc409664）；docs/modules/relay-light/workspace/RLT_29/evidence/batch-3/post/comparison.json（sha256 0167aadc91c61b86bc98bcec26db51318c43e7c82017e993ad05e0344ef2df2d） | 原执行 coder#b3；本次核对登记 coder#b3（2026-09-23）；范围仅 B-04 诊断与 baseline/post 比对，不代表其它闸结果 |
| E-303 | scenario | 场景：核对 model-allocation gate 实态——读 `execution_strategy.md`（用户 2026-09-22 明确确认快照）并对 `herdr workspace list`/`tab list --workspace w41`/`agent list`/`pane process-info --pane w41:pN` 实测逐实例比对（原执行 coder#b3，2026-09-23 采集） | 有限满足：一任务一 w41 workspace、11 个角色实例各具名 tab/pane、已启动实例 argv 与快照模型/推理档逐项一致；仅覆盖已启动实例与已发生事实，不覆盖 workflow-final/E2/人验（均未发生） | docs/modules/relay-light/workspace/RLT_29/evidence/batch-3/model-allocation.md（sha256 b10e4b806afe0d4cc9146b35e8dff4fe135571c656ebdbca976644bd16e8e622）；原始捕获 docs/modules/relay-light/workspace/RLT_29/evidence/batch-3/herdr/ | 原执行 coder#b3；本次核对登记 coder#b3（2026-09-23）；范围为模型分配询问/确认来源与实态配置核对的有限需求场景 |
| E-304 | review | 场景：batch-reviewer#b2 对 batch-2 增量的独立复核（原执行 batch-reviewer#b2，2026-09-22，durable signal verdict=PASS） | PASS 且已发生：diff 归属零越界、标头/phase/具名 tab-pane 一致、model-allocation 闸、signal 与 RELAY_RECEIPT 分流、monitor 节拍与安全 Enter、恢复权威、完整模式零回归；覆盖范围限于 batch-2 合同核验，不表示 batch-3 已复核 | docs/modules/relay-light/workspace/RLT_29/check.batch-2.md（sha256 9cdee4d4ed772fadcc0256a1f45f8ef445d3de3e8b7670916a14b45774a0e430）；docs/modules/relay-light/workspace/RLT_29/DONE.batch-2.review.md（sha256 ae89bd3a6b6bcc8fec1f448e6ffba980113dfe539d1e9ee08e47244f2e36ab71） | 原执行 batch-reviewer#b2；本次由 coder#b3 核对原件后引用登记（2026-09-23），不冒称原执行者 |
