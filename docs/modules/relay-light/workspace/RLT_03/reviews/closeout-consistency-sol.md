<!-- dh:v1 -->
# RLT_03 · heavy Recipe consistency_review 独立复核

## VERDICT

**CHANGES_REQUESTED**

| 级别 | 数量 |
|---|---:|
| P0 | 0 |
| P1 | 2 |
| P2 | 1 |
| P3 | 0 |

RLT_03 的两条 Python 在本卡 42 个验收 ID 范围内与正式 design、DevPlan、brief/task plan 基本一致，53 个定向测试独立复跑全绿；relay-light 与现役 `relay/v1` 的 plan、ledger、事件和关闭差异也仍是设计明确的有意差异。但两个活动收口工件没有随 RLT-A-04/RLT-B-04 同步：`review.md` 仍要求已改归 RLT_05/RLT_07 的 status/mapping 语义，`现役Runner一致性对照.md` 仍把 `superseded` 写成节点状态并把已取消的 RLT_04/RLT_06 当作承接卡。另有 DevPlan A59 的“三类豁免”与其余活动定义的四个豁免前缀不一致。因此横向一致性不能批准。

## Reviewer / session

| 项 | 实际值 |
|---|---|
| review_path_id | `consistency_review` |
| 角色 | RLT_03 heavy Recipe 独立一致性复核 worker；非主控、非施工者 |
| Herdr workspace / tab / pane | `w15` / `w15:t1` / `w15:pE` |
| Herdr session | `kpi-agg` |
| Codex session | `01a08a6f-9bc8-7ae0-910c-72642a9bac90` |
| 实际模型配置 | 进程命令行：`codex --model gpt-5.6-sol -c model_reasoning_effort=medium --no-alt-screen` |
| branch / HEAD | `wt/RLT_03` / `e4b4cd68c163f32ef4324ea16d49dda53b5f44bc` |
| 入场 WIP | `M docs/modules/relay-light/workspace/RLT_03/progress.md`；本复核未触碰 |
| 唯一允许并实际写入 | `docs/modules/relay-light/workspace/RLT_03/reviews/closeout-consistency-sol.md` |

## 闭集口径与比对清单

闭集先按“当前活动定义”枚举，再把历史材料隔离：活动 relay-light 定义面共 8 个物理成员——正式 design、正式 DevPlan、`brief.md`、`task_plan.md`、`review.md`、生产 Python、测试 Python、现役 Runner 对照；现役 `relay/v1` 代码参考面共 4 个成员——`relay-schema.ps1`、`relay-transitions.ps1`、`relay-store.ps1`、`relay-runner.ps1`。合计 12 个物理成员。`design/drafts/`、`design/evidence/`、`dev_plan/drafts/`、`progress.md`/`findings.md` 的历史流水及 11 份既有 batch review 只作溯源，不与当前合同并列计数；`relay-core/` 是共存的非 `relay/v1` 实现，不属于 RLT_02 对照冻结的比较域。

| 维度 | 找到的同类定义 | 逐成员映射 | 裁决 |
|---|---:|---|---|
| plan parser / lint | relay-light 活动面 8/8；另有 `relay/v1` schema 1 份 | design §4/§11 定 marker、固定双表、stage/type/close/depends/trigger/superseded；DevPlan RLT_03 以 A18/A24/A35/A46-A48/A71/A72/A75/A87/A104/A109/A126/A128-A130 分配；brief/task plan 已同步新 ID；Python 常量/dataclass/lint 与 53-test oracle 对应；review.md 仍保留旧 status/mapping 子句；as-built 的节点形状对照正确但 owner 仍旧；v1 是 JSON DAG `node_id/role/brief_ref/depends_on/next_action/resume_from` | 主实现一致；v1 为有意差异；review/as-built 有遗漏，见 P1 |
| ledger schema / append | relay-light 活动面 7/8（task plan、review 均有边界；as-built 有总括）；`relay/v1` schema/store 2 份 | design 固定 `{seq,ts,node,event,agent,by,note}`、19 词、单写者纯追加；DevPlan/brief 分配 A2/A37-A42/A45/A49-A51/A55/A56/A58；生产 `LEDGER_FIELDS`、`EVENTS`、`open(...,"a",newline="")` 与测试逐项吻合；as-built 正确裁决 v1 的 event envelope/Receipt/state snapshot 为有意差异，但错写承接卡 RLT_04；v1 `Add-RelayEvent` 自有 `relay/v1` schema 与 event_id/identity | 数据形状和追加手法一致；v1 为有意差异；as-built owner 漂移见 P1-2 |
| event / agent / node state | relay-light 活动面 8/8；`relay/v1` schema/transitions/runner 3 份 | design 为 9 control + 10 agent 事件、终态三词、节点状态四词；DevPlan/brief/task plan 分配 A17/A59/A60/A68-A70/A74/A77/A78；生产/测试实现 RLT_03-owned 子集，法定 writer、阶段时序、完整 decision-mode 链按 A85/A89/A114 留给后卡；review.md 的 close 主干正确但 status 子句越界；as-built 把节点状态写成五词并沿用 RLT_04；v1 terminal/scheduling/result 状态是另一层且已明确有意差异 | 生产边界一致；as-built 状态词遗漏、review owner 漂移阻塞；DevPlan 豁免数量文字不一致见 P2 |
| errors / CLI | relay-light 活动面 7/8；现役 v1 不共享此 CLI 合同 | design 公共名为 `add/status/lint`，本卡冻结 add 0/2/3/4、坏 plan 三命令 3、status 坏 ledger 4、统一 stderr；DevPlan/brief/task plan 对应 A5/A45/A56/A63；生产 argparse/命令分流与测试一致；`status` 完整 JSON 归 RLT_05，`lint --json`/完整 lint 合同归 RLT_10，当前未实现是显式延期而非 RLT_03 遗漏 | 一致；后卡边界为有意差异 |

## Findings

### P1-1 · `review.md` 的活动完成条件未随 RLT-B-04 重划同步

`review.md:61,63-65` 仍要求：完整 status 忽略 superseded 且判断 closed/pending、`stages` 顺序、映射不含 E11-E13、marker“五字段”与 decision_mode“可读”。当前正式 owner 已改为：

- RLT_03：parser/lint 的 superseded 行为 A128、stage lint A129、禁止 type A126、四个必填 marker 字段与 parser/default A18/A130；见 DevPlan `:148-157`、brief `:26-30`。
- RLT_05：完整 status A61/A62/A73/A85/A89/A92；RLT_07：五阶段模板 A127；见 DevPlan owner 表 `:537-552` 及 `task_plan.md:55-60` 的禁止越界说明。

这不是未填占位本身，而是收口判据仍承载退役的混合 owner 语义。若按它签，会迫使 RLT_03 越界实现 RLT_05/RLT_07；若忽略它签，`review.md` 又不是当前卡合同。必须先把 `review.md` 的 16 条完成条件同步到现行 brief/42-ID owner 后再复核。

### P1-2 · `现役Runner一致性对照.md` 的 relay-light 侧状态与承接卡已过期

活动对照在 `:17`、`:42` 两处把节点状态列为 `pending/ready/open/closed/superseded`，而正式 design `:211-213` 明确只有四个节点状态，`superseded` 只是计划行废弃标记；A73 `:1130` 进一步要求它不进入 `stages/nodes/agents` 或 closed/pending 派生。生产/测试同样过滤而不生成 superseded 状态。

同一文件还有 10 处 `RLT_04`、6 处 `RLT_06` 活动 owner 引用（例如 `:9,18,25,33,41,43-48,57`），但正式 DevPlan `:88-90,498` 已明确 RLT_04 并入 RLT_03、RLT_06 并入 RLT_05，17 卡集合排除二者；当前账本、agent 状态机与 add-time node close 双闸也已由 RLT_03/A17/A74 实现。现役 v1 一侧的 29 条差异仍可成立，但该对照对 relay-light 一侧的描述和“29 条全为有意差异、遗漏 0”结论已不是当前事实。需更新状态词、承接卡及受影响裁决理由后重新确认 29/29。

### P2-1 · DevPlan A59 写“三类豁免”，其余活动定义均为四个前缀

DevPlan RLT_03 `:176` 写“node/agent/event 入参与三类豁免正确”；正式 design A59 `:1167` 明列 `orchestrator#`、`monitor#`、`planner-amend#`、`strategist#` 四个前缀，task plan `:49` 写“四类豁免”，生产 `RELAUNCH_EXEMPT_AGENT_NAMES` 也恰为四项，测试 `test_agent_authorization_has_four_exempt_prefixes_and_active_nodes` 逐项接受并拒绝第五项。当前行为无歧义，但最高层任务卡数量文字错误，应改为“四类/四个前缀”或直接枚举四项。

## 有意差异 / 非 finding

- A129 的“同 stage 表尾追加”当前按 §11 严格拒绝，而 A120 的放宽归 RLT_09；已有 F-003 与 contract-rework review 明确登记，不重复升级。
- `status --json` 完整生命周期、法定 writer、阶段控制时序分别归 A61/A62/A73/A85/A89（RLT_05）；`lint --json` 归 A80（RLT_10）；完整 auto/consult/strategist 链归 A114（RLT_07）。当前 Python 只实现 RLT_03-owned 子集是有意边界。
- relay-light 与 `relay/v1` 在 plan JSON/Markdown、Receipt/七字段账本、CAS/纯追加、terminal/scheduling/节点状态、单节点/多 agent close 上均不同；逐项可回指 as-built 29 条及 v1 代码，裁决继续为有意差异，不要求复用 v1。

## E-051 · consistency_review 派出证据

| 检查 | 实际结果 |
|---|---|
| 入口 / 身份 | `pwd`、`git branch --show-current`、`git rev-parse HEAD` → 指定 worktree，`wt/RLT_03`，`e4b4cd68c163f32ef4324ea16d49dda53b5f44bc` |
| 定向测试 | `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest tools/relay-light/test_relay_log.py -v` → `Ran 53 tests in 27.714s`，`OK`，exit 0 |
| 活动 owner 集 | DevPlan RLT_03 卡与 §6 owner 表均为同一 42 ID；brief/task plan 使用 A126/A128/A129/A130，完整 status/template/amend 分归 RLT_05/RLT_07/RLT_09 |
| as-built 漂移计数 | `RLT_04` 10 处、`RLT_06` 6 处；`superseded` 被写成节点状态 2 处 |
| 现役 v1 实码核对 | `relay-schema.ps1` 的 JSON DAG/role/event/terminal 枚举，`relay-store.ps1` 的 append event + state snapshot，`relay-runner.ps1` 的 ready/attempt/result 投影与 as-built v1 一侧相符 |
| 写边界 | 测试禁 bytecode；未改代码、review.md、progress.md、findings.md、DevPlan；未 commit/push；仅新增本报告 |

## 收口

当前结论为 **CHANGES_REQUESTED**：先同步 `review.md` 的现行 42-ID 完成条件、修订现役 Runner 对照的四状态与 RLT_03/RLT_05/RLT_07 owner，再修正 DevPlan A59 的豁免数量文字；整改后应重新执行本 consistency_review。本文只给事实与级别，不代主控作验收、verify、合并或状态裁决。
