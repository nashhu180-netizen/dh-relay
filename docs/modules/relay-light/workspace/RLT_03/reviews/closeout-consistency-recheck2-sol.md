<!-- dh:v1 -->
# RLT_03 · consistency_review 原路径独立复验 2

## VERDICT

**APPROVE**

| 级别 | 数量 |
|---|---:|
| P0 | 0 |
| P1 | 0 |
| P2 | 0 |
| P3 | 1 |

Astra `REVISE` 六项已由 DeepSeek E-070 按七个精确文档路径传导完整。上一份 recheck 的 as-built owner/状态、DevPlan A59、A5/A128/A129 blocker 均已闭合；两条 Python hash 未变，RLT_05 仍未开始且未被提前实现。唯一 P3 是 DevPlan 抬头的阶段文案滞后，不阻塞本 consistency_review 批准。

## Reviewer / session

| 项 | 实际值 |
|---|---|
| review_path_id | `consistency_review` |
| 角色 | RLT_03 heavy Recipe consistency_review 原路径独立复验 worker；非主控、非施工者 |
| Herdr workspace / tab / pane | `w15` / `w15:t1` / `w15:pE` |
| Herdr session | `kpi-agg` |
| Codex session | `01a08a6f-9bc8-7ae0-910c-72642a9bac90` |
| 实际模型配置 | `codex --model gpt-5.6-sol -c model_reasoning_effort=medium --no-alt-screen` |
| branch / HEAD | `wt/RLT_03` / `e4b4cd68c163f32ef4324ea16d49dda53b5f44bc` |
| 当前 Python SHA256 | `relay_log.py=f484ffba38504424d5be3c3080b71d83186e31c0d5c6b6e5ed01cbbf117ceb1e`；`test_relay_log.py=8c2098fcb0e59bb18dcaa9a6912da2373d71b315252fa32a85c531a7e2300dbd` |
| 唯一允许并实际写入 | `docs/modules/relay-light/workspace/RLT_03/reviews/closeout-consistency-recheck2-sol.md` |

## 比对闭集

活动合同闭集为 9 个物理成员：正式 design/01、正式 DevPlan、as-built、`brief.md`、`review.md`、`progress.md`、`findings.md`、生产 Python、测试 Python。另以 Astra 报告、上一份 consistency recheck 与 E-070 七文件 diff 作变更依据；`task_plan.md`、候选稿和历史 evidence 未被 E-070 改写，不提升为本轮活动合同。

E-070 当前七个文档 diff 恰为：design/01、DevPlan、as-built、`brief.md`、`review.md`、`progress.md`、`findings.md`；`task_plan.md`、drafts、历史 evidence 无新增 diff。`git diff --check` 为 0。两条 Python 当前 hash与 Astra 报告、E-065、E-070 完全相同，证明本轮合同同步未改变已复核代码字节；本轮不冒称重新执行测试。

## 逐项复验

### 1. 节点四态与 superseded 标记分离 — 一致

| 成员 | 当前定义 | 裁决 |
|---|---|---|
| design `:209-215` | 节点状态仅 `pending/ready/open/closed`；superseded 是计划行废弃标记 | 一致 |
| design `:292-300`、A73 `:1136` | status 派生跳过 superseded；其不进入状态列表 | 一致；完整投影归 RLT_05 |
| as-built `:17,:42` | 两处均改为四态，并明确 superseded 不属于状态层 | 上轮 2 处 blocker CLOSED |
| brief `:26-28`、review `:82-84`、progress `:116-118,130` | parser/lint 先排除 superseded；状态投影不冒充本卡实现 | 一致 |
| Python | `active_nodes` 先过滤 superseded；`_status_command` 仅保留 A84 最小空账本投影 | 与 RLT_03 阶段边界一致 |

### 2. 原 RLT_04 / RLT_06 owner 的每个活动成员 — 16/16 语义化更新

旧号现仅在 as-built `:9` 的“原 RLT_04/RLT_06 已并入”历史说明各出现 1 次，不是活动 owner。原 16 个活动引用逐成员映射如下：

| 原 owner 成员 | 当前位置 | 当前语义 owner |
|---|---|---|
| RLT_04 总括 | `:9` | plan parser + ledger/agent 状态机 → RLT_03；生命周期/关闭派生 → RLT_05 |
| attempt | `:18` | RLT_03 |
| decider 账本归属 | `:33` | RLT_03；提示词/模式 → RLT_07 |
| Herdr 状态边界 | `:41` | RLT_03 仅守账本词表，不驱动 Herdr |
| control events | `:43` | RLT_03 |
| agent lifecycle | `:44` | RLT_03 |
| decider 链 | `:45` | RLT_03 基础账本守门；RLT_07 模式顺序；RLT_05 status 投影 |
| strategist 链 | `:46` | RLT_03 账本归属；RLT_07 提示词；RLT_15 实跑 |
| ledger schema/append | `:48` | RLT_03 写入合同；RLT_05 派生消费 |
| agent close | `:57` | RLT_03 终态/状态机；RLT_05 closable 派生 |
| RLT_06 总括 | `:9` | 角色配置/Recipe → RLT_05；提示词/模板 → RLT_07 |
| planner | `:25` | RLT_05 配置；RLT_07 提示词/模板 |
| builder | `:28` | RLT_05 配置；RLT_07 模板 |
| scribe | `:31` | RLT_05 配置；RLT_07 skill/模板 |
| reviewer | `:34` | RLT_05 Recipe/止损；RLT_07 workflow/提示词 |
| strategist | `:35` | RLT_05 配置/止损；RLT_07 提示词；RLT_15 实跑 |

未发现机械替换造成的 owner 扩大或功能整条错归。

### 3. node_close A17/A74：写前校验归 RLT_03，派生归 RLT_05 — 一致

- design A17/A74 `:1181-1182`、DevPlan RLT_03 `:183-184` 与 owner 表 `:520,:544` 将双条件写前守门给 RLT_03。
- 生产 `_validate_node_close` `relay_log.py:678-694` 在 `append_event` 真正落行前执行：A17 要求全部已 launch agent 终态，A74 要求 `close=agent:x` 的 x 必为 `done`；测试 `test_relay_log.py:1006-1012,1027-1042` 分别钉住两闸。
- design `:292`、A61/A81 `:1183-1184` 与 DevPlan RLT_05 `:214-217` 把 `closed/closable/reasons` 的 status 派生留给 RLT_05。
- as-built `:54,:57` 已按同一边界表述。上轮指出的 as-built 关闭 owner 漏项 CLOSED。

### 4. A59 四成员，且只豁免 agent 表成员要求 — 一致

design `:281-282,:1173`、DevPlan `:176`、brief `:36`、review `:54,:92`、progress `:126` 均枚举同一四成员：`orchestrator`、`monitor`、`planner-amend`、`strategist`，并把豁免严格限定为“agent 名存在于本节点 agent 表”。

生产常量 `relay_log.py:53-55` 恰为四项；`_authorize_agent` `:528-537` 只跳过成员查表，之前仍有 `_active_node`/event 校验，之后 agent event 仍进入状态机与 attempt/前置校验。测试 `test_relay_log.py:926-941` 接受四项、拒绝第五项并拒绝不存在节点。A85 的逐事件法定 writer 一致性整体归 RLT_05、当前对所有 agent 均未实现；这不是四成员获得了额外豁免。

### 5. A5 / A128 / A129 正式合同与 workspace — 一致

| ID | 正式合同 | workspace / Python | 裁决 |
|---|---|---|---|
| A5 | design `:184,:1128` 与 DevPlan `:168`：解析级失败三命令 3；已解析规则违反 lint=2、add/status=3；重复号归 A46 | brief `:34`、review `:51,:90`、progress `:124,:130`、F-016 `findings:24` 与 `_lint_command`/`_runtime_plan`、测试 `:728-751` 同口径 | 上轮 blocker CLOSED |
| A128 | design `:1135` 与 DevPlan `:148`：RLT_03 负责活跃 parser/lint 核心及 A46/A72/A75；A120 仅跨卡兼容引用，集成取证归 RLT_09 | brief `:26`、review `:52,:82`、progress `:116,:130`、F-003 `findings:11` 与 active-node 过滤/现有测试一致 | 上轮 blocker CLOSED |
| A129 | design `:411-417,:496-502,:590,:1138`：产品终态保留表尾放宽；RLT_03 基础 lint 先忽略 superseded、拒绝被其他活跃 stage 隔断；RLT_09/A120 接手合法表尾放宽 | DevPlan RLT_03 `:141,:150`、RLT_09 `:288-292`，brief `:28`、review `:53,:84`、progress `:118,:130` 与代码 `:311,324-329` 一致；既有 `C1→R1→C2` 明记为多违规 fixture，不承诺原样翻绿 | 上轮 blocker CLOSED；阶段性差异是明示边界，不是遗漏 |

F-003/F-016 当前 `resolved-pending-recheck` 是等待本次独立复验的状态；其内容已经闭合，不构成新的合同冲突。

### 6. RLT_05 仍未开始，且无提前实现 — 一致

- DevPlan 任务表 `:89` 仍为 `RLT_05 | 未开始`，依赖 RLT_03；RLT_09 `:96` 也未开始。
- `docs/modules/relay-light/workspace/RLT_05/`、`tools/relay-light/skill/roles.toml`、`dh-mapping.toml` 均不存在。
- 对两条 Python 闭集检索 RLT_05 的 status/Recipe 字段与验收 ID，仅命中 `relay_log.py:762-765` 的显式占位注释；无 `open_stages`、`suggested_action`、`last_stage_result`、`monitor_relaunch_count`、`superseded_ignored`、`idle_seconds` 或配置读取实现。
- `_status_command` `:755-771` 只实现 A84 所需的空账本最小投影；`stage_result` 的现有读取只用于 RLT_03 attempt 重拉原因，不形成 RLT_05 生命周期投影。

因此 E-070 的 doc-only 声明成立，未以合同同步偷开 RLT_05。

### 7. `b7f4ecc` 一次性例外不继承 — 一致

独立 `git show --numstat b7f4eccbcd1e0a1ba522fd19fdd07b4918701131` 复算得到同一父提交 `baf2aad6...`、同一五份越界治理 patch及 **336 插入 / 44 删除**。progress `:132-150` 精确绑定提交全号、五路径与各自 numstat，并明确：

- 只收纳该提交相对父提交的既有治理 patch，不授权五文件今后任意内容；
- 不含通配、目录放行或未来继承；
- RLT_03 原 allowed paths 在 DevPlan `:188-191` 保持三条不变；
- 机械闸若不消费例外，保留原始 fail，不伪称原闸通过；
- E-070 七文件同步来自本次单独精确授权，不从 `b7f4ecc` 例外推导；
- 不改变 design A122 的 planner-amend 禁区。

该例外边界精确，未发现扩散。

## Findings

### P3-1 · DevPlan 抬头阶段文案滞后

DevPlan `:11-12` 仍写“进行到 RLT_03 施工 / 下一步完成第 4 批窄返工再复核”，而 progress 已到 E-070 合同同步及本轮原路径复验。任务表 `:88-89` 的 RLT_03“进行中”与 RLT_05“未开始”仍正确，故仅为非阻塞导航元数据漂移，不影响上述合同裁决。

以下位置是等待本报告回填的预期交接标记，不计 finding：`review.md:43,62,70,82,84,90,100,104` 的“待一致性原路径复验/部分/as-built 未勾”，`findings.md:11,24` 的 `resolved-pending-recheck`，以及 `progress.md:130` 的“矩阵尚未闭合”。复核 worker 按边界不修改这些主控工件。

## E-072 · consistency_review 派出证据

| 检查 | 结果 |
|---|---|
| 入口 / 身份 | 指定 worktree；`wt/RLT_03`；HEAD `e4b4cd68c163f32ef4324ea16d49dda53b5f44bc` |
| 七文件闭集 | 当前文档 diff 恰为 design、DevPlan、as-built、brief/review/progress/findings；task_plan/drafts/evidence 无新增 diff；`git diff --check` exit 0 |
| as-built 旧 owner | 16/16 活动成员语义化更新；RLT_04/RLT_06 各仅剩 1 个“原卡已并入”历史说明 |
| 状态 / close / A59 | 四态与 superseded 分离；A17/A74 写前校验/派生 owner 分开；A59 四成员且仅免 agent 表成员要求 |
| A5/A128/A129 | design、DevPlan、workspace、当前 Python 行为边界一致；F-003/F-016 可由主控在本复验后收敛 |
| Python hash | 两条当前 SHA256 与 Astra/E-065/E-070 完全一致；本轮未改代码、未冒称重跑测试 |
| RLT_05 | DevPlan 未开始；workspace/两配置不存在；源码仅一处显式占位注释，无完整 status/Recipe 实现 |
| `b7f4ecc` | 五份 patch、336+/44- 独立复算一致；原三条 allowed paths 未扩；无未来继承 |
| 写边界 | 未改代码、正式合同、workspace 主工件或既有 review；未 commit/push；只新增本报告 |

## 收口

本 consistency_review 原路径复验结论为 **APPROVE**。P3-1 可由主控后续整理，不阻塞本路径；本报告不代主控验收、更新状态、verify、commit、push、merge 或启动 RLT_05。
