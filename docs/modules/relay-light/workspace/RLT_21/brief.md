<!-- dh:v1 · brief.md -->
<!-- dh:workspace-contract:v2 -->
# brief — RLT_21 Linux 预演回流

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| RLT_21 | P1-RelayLight-开发方案 | DevPlan §RLT_21；design/01 §11.1 HC-RL-A137～A143 |

- **GitHub Issue**：[dh-relay #21](https://github.com/nashhu180-netizen/dh-relay/issues/21)
- **施工现场**：`/home/nash/work/dh-relay/.dh-worktrees/RLT_21`（`wt/RLT_21`，D-start 基线 master `51d8062`）
- **档位 / Recipe**：标准档；`task_type=normal`。

## 目标 (Outcome)

把 RLT_12 Linux 非正式预演的六条发现与 RLT_07 F-002/F-003 回流为可执行合同：让异常阶段可合法 blocked、NOT_RUN 重拉有用户开启且有上限的 `launch_fix` 预算、账本静默只产生提示并触发三处核验、两侧 adapter 固化派活与替代预检纪律，同时补齐决策模式门、`cancelled` 归属闸和 light plan-review 分级。

## Zero-context 自查

施工 worker 进入本 worktree 后先执行 `git rebase --autostash master`，再读仓根 `AGENTS.md`、本文件、`task_plan.md`、`progress.md`、`findings.md` 与派单指定 Batch；按该批 Context Packet 读取 design oracle、预演事实和现状函数/用例。只在 dispatch/README.md 的 allowed-paths 闭集内修改，并只处理当次派单批次。合同张力只登记 finding 并发 `BLOCKED`，不得自行改 design/DevPlan、扩大授权、复核自己的施工、安装用户级 skill、push/PR/merge/verify。

## 完成条件 ★必写

以下七条逐字承接 design/01 §11.1；每条命令名是本卡冻结的可执行验收入口，施工可在对应类中补齐同名方法，不得以 setup/fixture/参数错误冒充行为 RED。

### HC-RL-A137

> `clarifies: HC-RL-A112`；`stage_result` 分 outcome 校验节点关闭：`done`/`cancelled` 仍要求本实例全部节点 `closed`（A112）；`blocked`/`failed` 允许节点未关，但 `note` 必须含 `ref=<agent>#<n>:blocked` 或 `ref=<agent>#<n>:agent_lost` 且该引用在本实例内存在、为该 agent 最新事件；缺 `ref=`、引用不存在或引用已被 `resume`/终态覆盖均退出 2 并报 A137。

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.RelayLifecycleTests.test_a137_stage_result_validates_outcome_and_latest_ref \
  tools.relay-light.test_relay_log.RelayLifecycleTests.test_stage_result_and_close_preconditions_exit_two
```

判据：合法 blocked/failed ref 在节点未关时接受；`done` 顺序颠倒报 A112；三种非法 ref 报 A137；最新 blocked 仍不能 `stage_close`，报 A118。

### HC-RL-A138

> 环境性 NOT_RUN 出口：同一 `(node, agent)` 连续 `attempt_max` 条 `agent_lost` 且 `note` 均含 `NOT_RUN` 后，第 `attempt_max+1` 条 `agent_launch` 被拒（A107 attempt 止损）；此时 `stage_result outcome=blocked ref=<agent>#<attempt_max>:agent_lost` 被接受。**新预算只能由用户开**：编排把 blocked 交用户后，监工以该 agent 名下一条 `user_decision`（`note` 含 `launch_fix=<token>`）记录裁决，随后带同一 `launch_fix=<token>` 的 `agent_launch` 才被接受，attempt 继续递增，止损对该 token 组重新计 `attempt_max`；**每条 `user_decision` 只授权一个 token，每个 `(node, agent)` 最多一个 `launch_fix` 组**（总预算 ≤ 2×`attempt_max`），无授权引用、token 不一致或第二组均退出 2。

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.RelayLifecycleTests.test_a138_not_run_budget_and_launch_fix_authorization \
  tools.relay-light.test_relay_log.RelayStatusProjectionTests.test_a138_not_run_unclosable_reason_reports_count_and_fix_group
```

判据：三连 NOT_RUN 后无授权第四次启动拒绝；合法 blocked 出口与同 token `#4` 接受；异 token、无授权、第二组拒绝；总启动预算不超过 `2*attempt_max`。

### HC-RL-A139

> `launch_fix=` 记账：`agent_launch.note` 可含 `launch_fix=<token>`；`add` 不校验其与计划 `launch` 列的关系、不要求 `plan_amend`；`status --json` 在该 agent 条目暴露 `launch_fix` 字段（无则为 null）。

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.RelayStatusProjectionTests.test_a139_status_exposes_launch_fix_or_null \
  tools.relay-light.test_relay_log.RelayPlanLintTests.test_a139_launch_fix_does_not_require_plan_amend_or_lint_match
```

判据：带/不带 token 的 agent 精确字段分别为字符串/null；计划 `launch` 与账本 token 不同仍可 add/lint，且无 `plan_amend`。

### HC-RL-A140

> 静默超时配置：`dh-mapping.toml` 的 `limits.silence_timeout_min` 可加载（默认 30）；`status` 只按**账本**最近事件计算静默，超过该值时该 agent 行标 `ledger_silent` **提示**（不是挂死判定）；skill 核心与两份 adapter 的监工模板含「`ledger_silent` → 核 Herdr 状态 + pane 末行 + 允许路径产出三者是否也无变化 → 三者均无变化才中断并记 `agent_lost silent_timeout` → 同 pane 重拉 `#n+1`；任一仍在变化不得中断」原文。

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.RelayConfigTests.test_a140_silence_timeout_default_and_load \
  tools.relay-light.test_relay_log.RelayStatusProjectionTests.test_a140_ledger_silent_uses_injected_clock \
  tools.relay-light.test_relay_log.SkillAdapterTests.test_a140_silence_timeout_protocol_in_three_templates
```

判据：默认 30、显式值可加载；打桩时钟下阈值两侧提示准确且仅据账本；三处模板同时命中“两句硬规则”。

### HC-RL-A141

> 派活提交与等待纪律写进两份 adapter：`agent start` 后 `wait --until idle` 再 `prompt`，prompt 后读取 pane 末行确认已提交（未提交则 `send-keys Enter` 一次并复核）；编排等待优先用账本文件事件监听，附「监工连续空闲 ≥2 分钟且无新账本行」告警；沙箱型只读启动不可用时的替代（bypass 沙箱 + 提示词只读约束 + `launch_fix=`）写进 adapter 环境预检。

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.SkillAdapterTests.test_a141_dispatch_wait_event_listener_and_sandbox_preflight
```

判据：两份 adapter 各自命中派活确认、账本监听/两分钟告警、沙箱替代预检三段，且 Enter 只补一次再复核。

### HC-RL-A142

> `decision_mode` 模式门与 `cancelled` 归属闸在 `add` 路径实现：`consult` 下 `decision` 后无 `user_decision` 即写 `resume` 退出 2；`auto` 下 decider 链出现 `user_decision` 退出 2；`cancelled` 进入决策类归属校验（A69），非触发 agent 名下的 `cancelled` 退出 2。

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.SkillTemplateTests.test_a114_consult_resume_without_user_decision_rejected \
  tools.relay-light.test_relay_log.SkillTemplateTests.test_a114_auto_mode_rejects_user_decision_on_decider_chain \
  tools.relay-light.test_relay_log.SkillTemplateTests.test_a142_cancelled_decision_ownership_positive_and_negative
```

判据：RLT_07 两条用例去 skip 后按 oracle exit 2；`cancelled` 记在触发 agent 名下接受、记在 helper/其他 agent 名下报 A69。

### HC-RL-A143

> light 档 plan-review 分级（用户 2026-09-14 裁决 C）：skill 核心的 plan-reviewer 模板写明——纯措辞/格式/引用陈旧项一律 P2、不阻断 PASS；allowed-paths、写入者边界（谁写 progress/findings/lesson）、节点/阶段边界、验收命令与完成信号缺失或矛盾仍为 P1 阻断；模板附「light 只按此分级，heavy/normal 不变」。

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.SkillCoreDocTests.test_a143_light_plan_review_severity_contract
git show dryrun/rlt12-linux:docs/modules/relay-light/workspace/DRILL_01/review.plan.md
```

判据：结构检查命中“P2 不阻断”、四类 P1 与 heavy/normal 不变；把预演两轮同源项合并复算，写入者边界为 1 个 P1，目标/授权/只读措辞等 4 个非四类边界项为 P2，即 `1 P1 + 4 P2`。

## 边界 (Boundaries)

- In scope 闭集：`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、`tools/relay-light/skill/**`、`docs/modules/relay-light/workspace/RLT_21/**`。
- Out of scope：`install_skill.py`、`tools/tests/**`、design、DevPlan、`.gitignore`、其他 workspace、用户级 skill 副本、现役 Runner 与 watch 实现。
- `ref=`、`launch_fix=` 沿用 `_note_tokens`，不增加账本字段；`ledger_silent` 是 status 提示，不是挂死裁决或第三套止损计数。
- 不重跑 Linux 预演；事实只读取既有 evidence 与 `dryrun/rlt12-linux`。
- 每批必须有效 RED→GREEN、有效单测、全 Python 与 PowerShell 全量、四集合 allowed-paths 检查；全量失败按测试名与 master 基线比较。
- normal 三路复核、verify、验收、push、PR、CI、merge、安装与清理均为后续独立闸门。

## 触及子系统

- `relay_log.py`：阶段结果、attempt/NOT_RUN、决策链、配置加载、status 投影。
- `test_relay_log.py`：行为回归、时钟打桩、skill/adapters 结构检查。
- `skill/SKILL.md` 与两份 adapter：监工模板、派活/等待、环境预检、light plan-review 分级。
- `skill/dh-mapping.toml`：`limits.silence_timeout_min` 默认值。
