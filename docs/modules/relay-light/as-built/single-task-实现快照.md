# single-task 单卡接力模式 — 实现快照（as-built）

> 记录时点：RLT_29 batch-3 施工结束点（2026-09-23）。本快照只写**已实现 / 已实跑**的事实；未发生的一律标「未发生」，不预写 PASS。
> 证据基线：`docs/modules/relay-light/workspace/RLT_29/evidence/batch-3/`（post/、red/、green/、install-consistency/、herdr/、model-allocation.md）。
> 合同源：`tools/relay-light/skill/SKILL.md`「`single-task` 单卡接力模式」节 + `references/adapter-claude-code.md` / `adapter-codex.md` 同节。

## 1. 已实现（文档合同）

| 合同点 | 落点 | 结构断言 |
|---|---|---|
| 与完整 relay 并列互斥；不创建/读写 `relay_plan.md`/`relay_log.jsonl`；不用 W/C/R/X/F | SKILL.md `## \`single-task\` 单卡接力模式`；双 adapter 同节 | `test_single_task_mode_declared_parallel_and_exclusive` |
| 派单标头 `[relay-light:single-task] worker · phase=…`；phase 九值闭集 + `batch=1|2|3|na` | 三文档同文 | `test_phase_closed_set_is_nine_phases_not_legacy_five`（显式排除 design §7.5.5 旧 5 值示例 `plan|batch|final|decision|monitor` 作为 oracle） |
| model-allocation 硬闸：全角色/实例提案表 → 明确询问 → 未确认零启动；默认仅提案；逐角色可改；确认后机械落 `execution_strategy.md`；未变快照可复用；新增/更换角色实例或换模型/推理档重问；超时/静默/最大权限不推定确认、不扩张授权 | 三文档 `model-allocation gate` 节 | `test_model_allocation_gate_hard_contract`、`test_model_allocation_negative_examples`（双 adapter 含「缺询问/先启动后补确认/未确认默认直接拉起/变更免确认，均属违规」明文反例）、`test_model_allocation_gate_precedes_launch_section`（gate 在拉起段之前） |
| `RELAY_RECEIPT` fail closed 分流：产出型 builder/coder/reviewer/decider 写本角色精确 `BLOCKED.*.md` 单行 signal 即停；monitor repo/workspace 零写入、仅 Herdr prompt 非 durable 通知、不写 BLOCKED；两分支均不清 `RELAY_*` | 三文档同一行合同 | `test_relay_receipt_fail_closed_split_monitor_vs_producers` |
| monitor 完全只读：不写 signal/progress/execution_strategy/轮询日志/通知日志/任何文档；不路由不分派不启动 agent；120s wait/get/read + prompt 通知；安全 Enter 三条件 | 三文档 monitor 节 | `test_monitor_repo_workspace_zero_write` |
| 拓扑：一任务一 Herdr workspace；每角色实例独立具名 tab（Claude 侧 `herdr tab create`）/ pane（Codex 侧 `herdr pane split`） | 双 adapter「拓扑与拉起」 | `test_one_workspace_one_named_tab_or_pane_per_instance` |
| durable signal 单行 schema（DONE/BLOCKED + 九字段，BLOCKED 含 `reason=<snake_case>`）；写完即停 | 三文档 | `test_durable_signal_schema_and_stop` |
| 恢复权威仅四类：durable signals、review/decision 工件、`execution_strategy.md`、Herdr 实态；不依赖终端存活状态 | 三文档「恢复依据」 | `test_recovery_authorities_are_durable_only` |
| `roles.toml` 仍为完整模式缺省模板，不为 single-task 写死模型 | adapter 明文 + roles.toml 无 `single-task` 字样 | `test_roles_toml_stays_full_relay_default_template`、`test_roles_toml_replica_bytes_identical_to_source` |

以上断言为纯文本结构断言，落在 `tools/relay-light/test_install_skill.py` 的 `SingleTaskStructureTests`（11 条）+ 安装侧 `test_roles_toml_replica_bytes_identical_to_source`。

## 2. 已实跑（测试与安装证据）

- **RED**：同一测试文件在 `RELAY_LIGHT_SKILL_DIR=evidence/batch-3/red/baseline-skill-93d65cb`（93d65cb 基线快照，无 single-task 内容）下运行：19 tests，11 failures——全部为 `SingleTaskStructureTests` 的断言失败（缺合同文本），8 条安装测试全过；无导入/路径错误。证据 `red/B-structure-RED.txt` + `.exit=1`。
- **GREEN**：默认源运行同文件：19 tests OK。证据 `green/B-structure-GREEN.txt` + `.exit=0`。
- **安装一致性**：临时 home `install_skill.main(["--all"])` 实跑，五文件在 `.claude/skills/relay-light/` 与 `.codex/skills/relay-light/` 双副本 sha256 全部等于源（`install-consistency/sha256-five-files.txt` 10/10 MATCH）；`roles.toml` 源字节与 93d65cb 基线 diff 为空、git status 干净（`install-consistency/roles-toml-source-bytes.txt`）。

## 3. 已实跑（RLT_29 自身 Herdr 运行证据）

实测自 `herdr` CLI（原始输出 `herdr/*.json`、`pane-process-argv.txt`）与 `evidence/batch-3/model-allocation.md`：

- 一任务一 workspace：RLT_29 全部实例在 `w41`（11 tab / 11 pane），无第二任务空间。
- 每角色实例独立具名 tab/pane：orchestrator `w41:t1/p1`、builder `t2/p2`、monitor `t3/p3`、plan-reviewer `t4/p4`、decider `t5/p5`、b1-coder `t6/p6`、b1-reviewer `t7/p7`、b2-coder `t8/p8`、b2-reviewer `t9/p9`、b3-coder `tA/pA`、b3-reviewer `tB/pB`。
- 模型/档位实测 argv 与 `execution_strategy.md`（用户 2026-09-22 明确确认的快照）逐项一致：builder/plan-reviewer `codex -m gpt-5.6-sol … effort=medium`；decider `codex -m gpt-6-astra … medium`；monitor `devin --model swe-2-medium`；b1/b2/b3 coder+reviewer `devin --model swe-2-max`。
- monitor 零写：batch-1～3 期间 monitor 对 repo/workspace 无写入工件；活动仅 Herdr wait/get/read + prompt 通知。
- 无 plan/log：`workspace/RLT_29` 下无 `relay_plan.md`/`relay_log.jsonl`（post B-05 PASS）。
- 已发生的恢复链事实：batch-1、batch-2 各有 reviewer durable PASS → 工件齐全 → coder/reviewer 各一次 `/clear` → 复验（实测四实例 revision 均=5）→ 下一批启动。
- durable signals 实存：`DONE.builder*`、`DONE.plan-review*`、`DONE.decision.*`、`DONE.batch-1/2.coder.md`、`DONE.batch-1/2.review.md`（均 PASS）、`BLOCKED.batch-1.coder.md`（quotepath 事故，已由 `decision.batch-1.quotepath.md` 裁决闭合）。

## 4. 本批验证闸实跑结果（post vs baseline）

| 闸 | baseline | post | 结论 |
|---|---|---|---|
| B-01 install unittest | 7 tests OK | 19 tests OK | PASS |
| B-02 py discover | 228 tests OK | 240 tests OK | PASS |
| B-03 pwsh 套件 | ALL PASS (SKIP 1) | ALL PASS (SKIP 1) | PASS |
| B-05 plan/log + 禁改 diff | PASS/空 | PASS/空 | PASS |
| B-06 allowlist + diff --check | PASS/0 | PASS/0 | PASS |
| B-04 `dh relay-light` | 66 失败（59 inherited + 7 RLT_29-owned） | 66 失败 | **未过**：7/7 RLT_29-owned 仍在（均在 `review.md` R12/R17，本批禁改路径）；1 条 inherited（`RLT_27 R30`）摘要漂移——其越界清单扩张收进了 RLT_29 自己的合法 tracked 写入 |

- open P0/P1：0。完整字段与逐行 diff 见 `post/comparison.json`、`post/B-04.txt` vs `baseline/B-04.txt`。

## 5. 未发生（不预造）

- batch-3 reviewer 复核与 PASS、batch-3 双方 `/clear` 复验：reviewer 实例（`w41:tB/pB`）已拉起待命，复核未开始。
- workflow-final 各路 reviewer、E2 code_review：未拉起，`execution_strategy.md` 记 pending。
- 人验（human-acceptance）：未进行。
