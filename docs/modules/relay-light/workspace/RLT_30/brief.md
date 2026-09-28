<!-- dh:v1 · brief.md -->
<!-- dh:workspace-contract:v2 -->
# brief — RLT_30 角色名统一：monitor → stage-lead / watcher

## 覆盖任务与身份

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| RLT_30 | P1-RelayLight | DevPlan §3.2 `RLT_30`（RLT-B-11）；design/01 RLT-A-15 声明、§6.3、§7.5、§10.3；`HC-RL-A131`、A163～A165、A167、A43、A44、A69、A85、A93、A119、A62 |

- GitHub：Issue #70（`Relates to #70`，收口前不自动关闭）；PR #71（与 RLT-A-15 设计、RLT-B-11 规划同一 PR 合入）。
- 工作树：`/home/nash/work/dh-relay/.dh-worktrees/RLT_A_15`；分支：`plan/RLT_A_15`；基线：`master@7147bca`。
- 档位：标准；非高危五类；`task_type=normal`；review-policy `single-full-targeted max_attempts=2`。
- 操作者：主会话直做（用户 2026-09-28 点选）；复核派 fresh subagent，施工者不复核自己。

## 目标 (Outcome)

新终端启用 relay-lite 时角色层只见 stage-lead / watcher：single-task 观察者 `phase=watcher`；`roles.toml` 模板有 `[stage-lead]` 与 `[watcher]`；完整模式 `status` 文本显示 stage-lead；报错主语称 stage-lead 并带出账本原值；账本值、事件名、JSON 键与枚举一律不动；合入后两机四份 skill 副本同步。

## 完成条件（= DevPlan RLT_30 验收口径逐字副本）

| # | 条件 | 谁验 | 出处 |
|---|---|---|---|
| 1 | `roles.toml` 可由 `tomllib` 加载，角色键与 §6.3 的 12 个角色（含 `stage-lead`、`watcher`）精确相等，每个角色有 `model` 与 `launch`。 | AI | design/01 + `HC-RL-A131`（RLT-A-15 修订） |
| 2 | SKILL/双 adapter/AGENTS relay-light 段中 single-task 观察者称 watcher、标头 phase 九值闭集含 `watcher` 不含 `monitor`；结构测试（`test_install_skill.py` 九值集合、零写入正则等）同步通过。 | AI | design/01 + `HC-RL-A163`～`A165`、`A167`（RLT-A-15 措辞回归，owner 仍 RLT_29） |
| 3 | `status` 文本与 §10.3 样张**逐字一致**：「当班写入者：stage-lead（DHR_90:C#1）」——括号内为 stage_id，status 文本不另带出 `monitor#<n>`（用户 2026-09-28）；`derive_last_writer` 仍返回账本原值 `monitor`。 | AI | design/01 §10.3 + `HC-RL-A43`（样张随 RLT-A-15）、`A44`（原判据回归：固定显示别名仍属转述账本事实） |
| 4 | 错误/告警（含汇入 `status --json` `errors` 的字符串）遵守三条规矩（用户 2026-09-28「卡里写规矩，字面施工定」）：①主语写 stage-lead；②括号带出账本原值（`by=monitor` 或 `monitor#<n>`）；③错误码 HC-RL-Axx 与退出码不变。具体字面由 `task_plan` 定，复核按三条规矩逐条核；含事件名 `monitor_launch` 的报错不改。 | AI | design/01 RLT-A-15 声明 ⑤ + `HC-RL-A69`、`A85`、`A93`、`A119`（错误码不变、字面改）+ `A62`（JSON 键与枚举不变） |
| 5 | 对 skill 五件（SKILL.md、两 adapter、`roles.toml`、`dh-mapping.toml`）与 AGENTS.md relay-light 两段跑 grep：①「监工」= 0；②`monitor` 按 promotion-check 同一正则删去冻结词后，剩余命中只允许落在 `task_plan` 预先登记的**内容锚定白名单行**（stage-lead 账本标识说明句、「监督 / 监控 / monitor」别名句、反引号内 `[monitor]` 旧名兼容句、AGENTS 中「原『监工 monitor』」更名说明句），其余 = 0；③`roles.toml` 无以 `[monitor]` 开头的段头。 | AI | design/01 RLT-A-15 活动声明（角色层统一） |
| 6 | 全量回归：`PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log test_install_skill`（`tools/relay-light/`）与 `pwsh -NoProfile -File tools/tests/run-relay-tests.ps1` 全绿；PR CI 三硬门 success。 | AI | DevPlan RLT_30 |
| 7 | 两机同步：合入后 ThinkPad `/home/nash/.claude/skills/relay-light`、`/home/nash/.codex/skills/relay-light` 与 thinkbook `C:\Users\nash\.claude\skills\relay-light`、`C:\Users\nash\.codex\skills\relay-light` 四份副本经 `install_skill.py --all` 同步（用户 2026-09-28 已授权），五文件与 master 源 LF 归一化哈希一致；thinkbook 不可达时如实挂起并报告。 | AI | DevPlan RLT_30 |

- 人判项：无（H=0）。RLT-A-15 只换措辞的既有 H 行不重判、不重签（B-05 表尾注）。

## 本卡开工授权

- 用户 2026-09-28 对 RLT_30 D-start 回答「确认开工」（问题：「RLT_30 是否开工？开工后我会建工作区和施工计划，在当前分支改代码和文档，跑三路复核和全量回归。合入前会把证据包拿给你看。」）。
- GitHub 动作（Issue / commit / push / PR / 服务端合并）用户 2026-09-28 对本工作项全部授权；两机四份副本同步现已授权。
- 合入前 E10 证据包须给用户查看确认。

## 边界 (Boundaries)

- 允许路径：DevPlan RLT_30 `dh:allowed-paths:v1` 闭集（12 条）。
- 非目标：账本 `agent`/`by` 值、控制事件名、`status --json` 键与枚举、watch 通知格式、状态机与读写逻辑；AGENTS.md Runner 体系段；`docs/relay/` 已开计划产物；`RLT_05-实现快照.md` 等时点快照；as-built 历史证据行只加注不改写。
- 停止线：需改账本值/事件名/JSON 键/状态机；越出允许路径；改 AGENTS relay-light 两段以外内容；`relay_log.py` 显示层以外逻辑 → 停下交用户。

## 触及子系统（收口时更新其 as-built）

- relay-light skill 核心与 Claude/Codex adapter、roles/dh-mapping 模板
- `relay_log.py` 显示层（status 文本、错误/告警字面）
- 仓根 AGENTS relay-light 两段
- as-built：`single-task-实现快照.md` 现役合同行
