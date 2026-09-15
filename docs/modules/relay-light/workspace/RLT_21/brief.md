<!-- dh:v1 · brief.md -->
<!-- dh:workspace-contract:v2 -->
# brief — RLT_21 Linux 预演回流：监工异常出口、启动修正记账、静默超时与派活纪律、决策模式门

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| RLT_21 | P1-RelayLight-开发方案 | [DevPlan §RLT_21](../../dev_plan/P1-RelayLight-开发方案.md#rlt_21--linux-预演回流监工异常出口启动修正记账静默超时与派活纪律决策模式门) |

- **GitHub Issue**：[dh-relay #21](https://github.com/nashhu180-netizen/dh-relay/issues/21)；本卡走完整 GitHub-flow（任务分支 → push → PR → CI → 人工合并），**不豁免**。预演六缺口的背景口径另见 Issue #23。
- **施工现场**：`D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_21`（分支 `wt/RLT_21`，基线 master `6094887`）
- **档位 / Recipe**：标准档；`task_type=normal`（复核 Recipe 三路：代码轮 1、需求方向、教训；另有有效单测要求）。
- **依赖**：RLT_07（skill 五件、五阶段模板与 `test_relay_log.py` 内两条 `@unittest.skip` 钉住负例）、RLT_09（`plan_amend`/白名单守门与 `launch_fix=` 不触发改计划的语义边界）、RLT_10（lint/CLI 测试合同与 PowerShell 薄壳入口）——三卡均已合入 master。
- **输入事实**：`workspace/RLT_12/evidence/linux-dry-run/README.md` 的 DR-F-001～006（事实来源，不重跑预演；预演账本 `relay/dryrun-linux-01/relay_log.jsonl` 在预演分支）；`workspace/RLT_07/findings.md` F-002 / F-003（随本卡关闭）。

## 目标 (Outcome)

把 RLT_12 Linux 非正式预演（DRILL_01）暴露的六条缺口落成程序与协议：`stage_result` 按 outcome 分校验并以 `ref=` 引用阻塞/失联事件（DR-F-003）；环境性 NOT_RUN 的合法出口（DR-F-001/003）；`launch_fix=` 运行事实记账（DR-F-001）；`limits.silence_timeout_min` 配置与监工静默超时模板（DR-F-002）；两份 adapter 的派活提交/等待纪律与沙箱替代预检（DR-F-004/005、DR-F-001）；并补齐 RLT_07 挂账的 `decision_mode` 模式门与 `cancelled` 归属闸（F-002/F-003）；light 档 plan-reviewer 模板按裁决 C 分级（DR-F-006）。

## 非目标

- 不实现 `watch`（RLT_18）；不改 dev-harness；不改现役 Runner。
- 不把预演分支 `dryrun/rlt12-linux` 合入 master；其 `.gitignore` 交付另行 cherry-pick 或由本卡顺带承接（见 task_plan）。
- 不改动 RLT_12 的目标与验收。
- DR-F-006 按用户裁决 C 只改 plan-reviewer 模板分级（A143），不改 Recipe 路径数。
- 不重跑 Linux 预演、不冒充 Windows 真跑证据；skill 改动后的两侧用户级重同步需用户当次明确授权，未授权停在仓内验证（A32 仍归 RLT_12 首步）。

## Zero-context 自查

施工 worker 进入本 worktree 后第一个 Git 动作执行 `git rebase master`；被同一 worktree 的 WIP 拒绝时按 task_plan 契约头 DR-W-008 处置（merge-base 核查 HEAD 是否已含 master 顶点，成立则 no-op 记一行，不强推、不清 WIP、不 `--autostash`）。再读仓根 `AGENTS.md`、本文件、`task_plan.md`、`progress.md`、`findings.md`、DevPlan §RLT_21 与 §2.2、design/01 §11 的 HC-RL-A137～A143 及 §3.4/§3.5/§6 相关段、`workspace/RLT_12/evidence/linux-dry-run/README.md`、`workspace/RLT_07/findings.md` F-002/F-003。随后只读盘点 `relay_log.py`（`stage_result`/`agent_launch`/决策链/`status`/配置加载与 `_note_tokens`）、`test_relay_log.py`（含两条 skip 负例）、skill 五件（SKILL.md 监工与 plan-reviewer 模板、两份 adapter、`dh-mapping.toml` limits）。DevPlan 决定 allowed-paths 与 normal Recipe，design §11 是 oracle；合同与现状冲突只落 `findings.md` 并发阻塞信号，不改 allowed-paths 外文件。

## 完成条件 ★必写

以下七条逐字承接 design/01 §11（RLT-A-08 续发）；证法列同为 oracle 一部分。

### HC-RL-A137 — stage_result 按 outcome 分校验与 ref=

> `clarifies: HC-RL-A112`；`stage_result` 分 outcome 校验节点关闭：`done`/`cancelled` 仍要求本实例全部节点 `closed`（A112）；`blocked`/`failed` 允许节点未关，但 `note` 必须含 `ref=<agent>#<n>:blocked` 或 `ref=<agent>#<n>:agent_lost` 且该引用在本实例内存在、为该 agent 最新事件；缺 `ref=`、引用不存在或引用已被 `resume`/终态覆盖均退出 2 并报 A137

证法（oracle）：单测——节点未关时 `blocked`+合法 ref 接受、`done` 仍拒 A112；三种非法 ref 各一例退出 2 报 A137；`stage_close` 对 `blocked` 仍拒 A118。

### HC-RL-A138 — 环境性 NOT_RUN 出口

> 环境性 NOT_RUN 出口：同一 `(node, agent)` 连续 `attempt_max` 条 `agent_lost` 且 `note` 均含 `NOT_RUN` 后，第 `attempt_max+1` 条 `agent_launch` 被拒（A107 attempt 止损）；此时 `stage_result outcome=blocked ref=<agent>#<attempt_max>:agent_lost` 被接受。**新预算只能由用户开**：编排把 blocked 交用户后，监工以该 agent 名下一条 `user_decision`（`note` 含 `launch_fix=<token>`）记录裁决，随后带同一 `launch_fix=<token>` 的 `agent_launch` 才被接受，attempt 继续递增，止损对该 token 组重新计 `attempt_max`；**每条 `user_decision` 只授权一个 token，每个 `(node, agent)` 最多一个 `launch_fix` 组**（总预算 ≤ 2×`attempt_max`），无授权引用、token 不一致或第二组均退出 2

证法（oracle）：单测——三连 NOT_RUN 后第四条无授权拒；`user_decision launch_fix=bypass_sandbox` 后同 token `#4` 接受、异 token 拒；第二组 `user_decision` 拒；`status` 不可关原因列出 `NOT_RUN` 计数与 fix 组。

### HC-RL-A139 — launch_fix= 记账

> `launch_fix=` 记账：`agent_launch.note` 可含 `launch_fix=<token>`；`add` 不校验其与计划 `launch` 列的关系、不要求 `plan_amend`；`status --json` 在该 agent 条目暴露 `launch_fix` 字段（无则为 null）

证法（oracle）：单测——带/不带 `launch_fix` 各一例，断言 `status --json` 字段；lint 不因 launch 列与账本不一致报错。

### HC-RL-A140 — 静默超时配置与监工模板

> 静默超时配置：`dh-mapping.toml` 的 `limits.silence_timeout_min` 可加载（默认 30）；`status` 只按**账本**最近事件计算静默，超过该值时该 agent 行标 `ledger_silent` **提示**（不是挂死判定）；skill 核心与两份 adapter 的监工模板含「`ledger_silent` → 核 Herdr 状态 + pane 末行 + 允许路径产出三者是否也无变化 → 三者均无变化才中断并记 `agent_lost silent_timeout` → 同 pane 重拉 `#n+1`；任一仍在变化不得中断」原文

证法（oracle）：单测——打桩时钟断言提示出现/不出现；结构检查三处模板命中「三者均无变化」与「不得中断」两句。

### HC-RL-A141 — adapter 派活提交/等待纪律与沙箱替代预检

> 派活提交与等待纪律写进两份 adapter：`agent start` 后 `wait --until idle` 再 `prompt`，prompt 后读取 pane 末行确认已提交（未提交则 `send-keys Enter` 一次并复核）；编排等待优先用账本文件事件监听，附「监工连续空闲 ≥2 分钟且无新账本行」告警；沙箱型只读启动不可用时的替代（bypass 沙箱 + 提示词只读约束 + `launch_fix=`）写进 adapter 环境预检

证法（oracle）：结构检查两份 adapter 各命中三段原文。

### HC-RL-A142 — decision_mode 模式门与 cancelled 归属闸

> `decision_mode` 模式门与 `cancelled` 归属闸在 `add` 路径实现：`consult` 下 `decision` 后无 `user_decision` 即写 `resume` 退出 2；`auto` 下 decider 链出现 `user_decision` 退出 2；`cancelled` 进入决策类归属校验（A69），非触发 agent 名下的 `cancelled` 退出 2

证法（oracle）：RLT_07 钉住的两条 `@unittest.skip` 负例去 skip 即绿；新增 `cancelled` 归属正反各一例。

### HC-RL-A143 — light 档 plan-reviewer 模板分级

> light 档 plan-review 分级（用户 2026-09-14 裁决 C）：skill 核心的 plan-reviewer 模板写明——纯措辞/格式/引用陈旧项一律 P2、不阻断 PASS；allowed-paths、写入者边界（谁写 progress/findings/lesson）、节点/阶段边界、验收命令与完成信号缺失或矛盾仍为 P1 阻断；模板附「light 只按此分级，heavy/normal 不变」

证法（oracle）：结构检查——模板命中「P2 不阻断」与四类 P1 原文；预演 `review.plan.md` 两轮 P1 按新分级重判可复算为 1 P1 + 4 P2。

## 边界 (Boundaries)

- In scope 闭集：`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、`tools/relay-light/skill/**`、`docs/modules/relay-light/workspace/RLT_21/**`。
- Out of scope：DevPlan、design、AGENTS、其他卡工作区、`tools/tests/`、现役 Runner（`tools/runner/`、`tools/host/`、`tools/contracts/`）、dev-harness 仓与用户级 skill 副本、RLT_12 树的全部文件（含 `relay/rlt12-win-01/` 计划与账本——那是另一棵树的监工辖区）。
- `ref=` 与 `launch_fix=` 均为 note token，沿用 `_note_tokens` 解析，**不新增账本字段**。
- 每批 exec 完成并落信号后立即停止；checker 小审 PASS 前不得续批。发现需改越界文件，发 BLOCKED，由 decider/编排裁决。
- normal 三路复核、verify、验收、push、PR、CI、merge 与发布均是后续闸门；施工测试绿不自动解锁。

## 触及子系统

- `relay-plan / relay-log`：`stage_result` 分 outcome 校验与 `ref=`、`agent_lost`/`NOT_RUN` 出口与 `launch_fix` 计数、`agent_launch` note token、`status`/`status --json` 输出（`launch_fix` 字段、`ledger_silent` 提示、NOT_RUN 计数与 fix 组）、`add` 路径 decision_mode 模式门与 `cancelled` 归属闸、配置加载新增 `limits.silence_timeout_min`。
- `skill-core`：SKILL.md 监工静默超时模板与 plan-reviewer light 分级；两份 adapter 的静默超时、派活提交/等待纪律、沙箱替代预检三段；`dh-mapping.toml` 新增 `limits.silence_timeout_min`。
- `test-entry`：`test_relay_log.py` 新增/去 skip 用例（薄壳与 `$suites` 登记不动）。
