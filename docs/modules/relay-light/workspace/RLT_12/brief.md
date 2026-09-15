<!-- dh:v1 · brief.md -->
<!-- dh:workspace-contract:v2 -->
# brief — RLT_12 Windows Claude 首个真计划端到端 demo

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| RLT_12 | P1-RelayLight-开发方案 | [DevPlan §RLT_12](../../dev_plan/P1-RelayLight-开发方案.md#rlt_12--windows-claude-首个真计划端到端-demo) |

- **GitHub Issue**：[dh-relay #23](https://github.com/nashhu180-netizen/dh-relay/issues/23)
- **施工现场**：`D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\RLT_12`（分支 `wt/RLT_12`，基线 master `51d8062`）
- **档位 / Recipe**：标准 · 高危（组件接线 + 真实 Agent 场景与人验）；`task_type=normal`（`<!-- dh:task-type:v1 task=RLT_12 type=normal -->`）
- **接力计划**：`plan_id=rlt12-win-01`，计划目录 `docs/modules/relay-light/relay/rlt12-win-01/`（由 planner 生成 `relay_plan.md`，不在本工作区）
- **计划内唯一业务卡**：RLT_21（[Issue #21](https://github.com/nashhu180-netizen/dh-relay/issues/21)）。用户 2026-09-14 裁决：真计划只跑这一张业务卡；RLT_21 施工在另一棵树 `.dh-worktrees/RLT_21`（分支 `wt/RLT_21`）。
- **D-start**：2026-09-14 用户对话明确授权（授权包四项见下「用户授权与已知缺口接受记录」）。

## 目标 (Outcome)

> 逐字承接 DevPlan §RLT_12「目标」：

在 Windows 由 Claude Code 主控跑完一份 W→C→R→F 真计划，保留全量计划/账本/status/产物与 pane/终端空间证据，并展示 checker 至少一次纠偏；这是第一批的端到端完成点。

## 非目标

> 逐字承接 DevPlan §RLT_12「非目标」：

不跑 Codex/Linux；不含 watch；不进入 E11/E12/E13；不把单测代替真实 Herdr 操作。

## 变更范围

> 逐字承接 DevPlan §RLT_12「变更范围」：

真计划/账本与本卡证据工作区。

## 允许路径

> 逐字承接 DevPlan §RLT_12 的 `<!-- dh:allowed-paths:v1 task=RLT_12 -->` 闭集：

- `docs/modules/relay-light/relay/**`
- `%USERPROFILE%/.claude/skills/relay-light/**`
- `%USERPROFILE%/.codex/skills/relay-light/**`
- `docs/modules/relay-light/workspace/RLT_12/**`

## Zero-context 自查

新 agent 只读本文件 + DevPlan §RLT_12 即可知道：终点是「Windows 上 Claude Code 主控用 relay-light 把一份真计划从 W 跑到 F 并留全量证据」；边界是上面四条允许路径闭集与四条非目标；谁验是 3 条机器证（AI 跑命令自证）+ 5 条人判（用户看展示后判断）；证据口径按「两次预演口径」（Linux 预演 `evidence/linux-dry-run/README.md`，Windows 预演见 PR #22）。

进入 worktree 后第一个 Git 动作是 `git rebase --autostash master`，再读仓根 `AGENTS.md`（宪章 + relay-light 编排协议段）、本文件、`task_plan.md`、`progress.md`、`findings.md`。**本卡的施工形态是「跑一次真计划」而不是「改程序」**：账本程序以本树 `tools/relay-light/relay_log.py` 为准且不改，程序侧缺口由 RLT_21 在它自己的树里承接。

## 完成条件 ★必写（逐字复制 DevPlan §RLT_12「验收口径」8 条）

| # | 条件 | 谁验（AI / 人） | 出处（任务 ID / 来源设计文档 + 验收 ID） |
|---|---|---|---|
| 1 | **机器证**｜来源：design/01 + `HC-RL-A32`｜两个用户级目录的五文件分别与 `tools/relay-light/skill/` 的同名文件逐字节一致。 | AI | [DevPlan §RLT_12](../../dev_plan/P1-RelayLight-开发方案.md#rlt_12--windows-claude-首个真计划端到端-demo) · design/01 `HC-RL-A32` |
| 2 | **机器证**｜来源：design/01 + `HC-RL-A30`｜所有阶段关闭、节点 closed、launch 全有终态。 | AI | [DevPlan §RLT_12](../../dev_plan/P1-RelayLight-开发方案.md#rlt_12--windows-claude-首个真计划端到端-demo) · design/01 `HC-RL-A30` |
| 3 | **机器证**｜来源：design/01 + `HC-RL-A31`｜真账本每行 schema 与全时序合法。 | AI | [DevPlan §RLT_12](../../dev_plan/P1-RelayLight-开发方案.md#rlt_12--windows-claude-首个真计划端到端-demo) · design/01 `HC-RL-A31` |
| 4 | **人判**｜来源：design/01 + `HC-RL-H1`｜用户判断 Claude 主控真计划是否省事和值得继续。 | 人 | [DevPlan §RLT_12](../../dev_plan/P1-RelayLight-开发方案.md#rlt_12--windows-claude-首个真计划端到端-demo) · design/01 `HC-RL-H1` |
| 5 | **人判**｜来源：design/01 + `HC-RL-H13`｜用户判断三层结构、阶段换监工与编排瓶颈。 | 人 | [DevPlan §RLT_12](../../dev_plan/P1-RelayLight-开发方案.md#rlt_12--windows-claude-首个真计划端到端-demo) · design/01 `HC-RL-H13` |
| 6 | **人判**｜来源：design/01 + `HC-RL-H5`｜用户仅看 status 判断阶段、轮到谁、阻塞与静默时长。 | 人 | [DevPlan §RLT_12](../../dev_plan/P1-RelayLight-开发方案.md#rlt_12--windows-claude-首个真计划端到端-demo) · design/01 `HC-RL-H5` |
| 7 | **人判**｜来源：design/01 + `HC-RL-H14`｜用户判断 checker 纠偏效果、批内不换人和成本。 | 人 | [DevPlan §RLT_12](../../dev_plan/P1-RelayLight-开发方案.md#rlt_12--windows-claude-首个真计划端到端-demo) · design/01 `HC-RL-H14` |
| 8 | **人判**｜来源：design/01 + `HC-RL-H10`｜另做"只给账本"展示，用户判断能否复原现场。 | 人 | [DevPlan §RLT_12](../../dev_plan/P1-RelayLight-开发方案.md#rlt_12--windows-claude-首个真计划端到端-demo) · design/01 `HC-RL-H10` |

> DevPlan 是口径的唯一权威定义，本表是施工现场的只读副本。口径变更以 DevPlan 为准，本文件跟改并在 `progress.md` 记一笔。

## 用户授权与已知缺口接受记录（2026-09-14 对话）

用户在 2026-09-14 的对话中给出以下四项裁决/授权，构成本卡 D-start 的确认闸（宪章#1、宪章#4）：

1. **真计划唯一业务卡 = RLT_21**——本卡跑的真计划只承载 RLT_21 这一张业务卡，不并跑其它卡。
2. **创建 Issue**——已建 Issue #23（RLT_12）；RLT_21 为 Issue #21。
3. **接受 A112/NOT_RUN 已知缺口**（DevPlan §3.1 RLT_12 备注要求的「同次确认须写明」）：
   - 监工无合法 `blocked` 终态 agent——A112 会拒绝在无 blocked 终态 agent 时写 `stage_result outcome=blocked`（Linux 预演 DR-F-003）；
   - `NOT_RUN` 只能走 `blocked → agent_lost` 重拉，协议尚无「环境性 NOT_RUN 交编排」的合法出口；
   - `launch_fix=` 仅作 `note` 文本，不是账本字段、不触发 `plan_amend`、不被 lint 校验（DR-F-001 的临时承载方式）。
   上述三条的程序/协议根治归 RLT_21（`HC-RL-A137`/`A138`/`A139`），**本卡不修，按已知缺口跑并记录实际遭遇**。
4. **委托节点按节点表默认**——S1 brief、E4 需求复核、E5 教训复核、E6 miner、E7 as-built 派出；判断节点（施工步骤、代码复核收敛、人闸）留主会话。

**证据口径**：按两次预演口径记——Linux 预演见 `evidence/linux-dry-run/README.md`（本树已有，DR-F-001～006）；Windows 预演见 `evidence/win-dry-run/README.md`（PR #22 已于 2026-09-15 squash 合入 master `6094887`，本树已有，DR-W-001～011）。

## A32 首步证据引用

DevPlan §RLT_12 实施提示把 `python tools/relay-light/install_skill.py --all` 定为**开工首步**，A32 逐字节一致是启动真计划的准入证据。该首步已于 **2026-09-14 23:30** 执行完毕，退出码 0，源与两侧副本五文件 sha256 三处一致，两份 manifest 已记。完整原文见 `progress.md` 证据 **E-001**。

## 边界 (Boundaries)

- **In scope 闭集**：上面四条允许路径；真计划 `docs/modules/relay-light/relay/rlt12-win-01/**`（`relay_plan.md` + 账本）；本卡工作区与 `evidence/`。
- **Out of scope**：不改 `tools/relay-light/relay_log.py` / `install_skill.py` / `skill/**` 源（本卡只消费，不改）；不改 DevPlan 除 §3.1 RLT_12 行与头部 `dh:status` 两处户口回填外的任何内容；不改 `design/`；不改其它卡工作区；不跑 Codex 主控（RLT_13）、不跑 Linux（RLT_17）、不做 watch（RLT_18）。
- **RLT_21 边界**：RLT_21 是计划内被施工的业务卡，它对 `relay_log.py` 的改动发生在 `.dh-worktrees/RLT_21`（分支 `wt/RLT_21`），**不影响本次运行中的计划所用的程序**（本卡账本程序以 RLT_12 树的 `tools/relay-light/relay_log.py` 为准，`--config-dir ~/.claude/skills/relay-light/`）。自指风险已登记 `findings.md` F-004。
- **何时必须停下问人**：①收口前 `verify(relay-light):` 必须由用户在对话中确认后才提交（宪章#2、#4）；②5 条人判条目必须用户亲看证据后判断，AI 不得代勾；③真计划跑出 P0/P1 三轮不收敛或需人裁决时；④出现允许路径以外的必需改动时。其余包内机械步骤不重复索权。

## 触及子系统（收口时更新其 as-built）

- `skill-install`：首次真实安装到两个用户级目录并校验（A32）。
- `evidence`：真计划、账本、status、产出与人验证据（`docs/modules/relay-light/relay/rlt12-win-01/`、本卡工作区）。
- `skill-core` / `status-lifecycle`：本卡只消费其现有行为，不改实现；实跑暴露的缺口记 `findings.md` 并归 RLT_21。
