<!-- dh:v1 · brief.md -->
<!-- dh:workspace-contract:v2 -->
# brief — RLT_09 运行中追加改计划与白名单守门

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| RLT_09 | P1-RelayLight-开发方案 | [DevPlan §RLT_09](../../dev_plan/P1-RelayLight-开发方案.md#rlt_09--运行中追加改计划与白名单守门) |

- **GitHub Issue**：[dh-relay #18](https://github.com/nashhu180-netizen/dh-relay/issues/18)
- **施工现场**：`/home/nash/work/dh-relay/.dh-worktrees/RLT_09`（`wt/RLT_09`，基线 master `b6b7d66`）
- **档位 / Recipe**：标准档（运行中变更计划与组件接线）；`task_type=heavy`。
- **并入项**：RLT_10 `findings.md` F-003（用户 2026-09-13 裁决并入本卡）。

## 目标 (Outcome)

完成运行中追加改计划的程序、测试和仓内 skill 合同：`plan_amend` 由 monitor 合法重复写且不进入 agent 状态机；A120 只放宽同 stage 合法表尾追加，并守住四项硬约束；`status` 每次重读同一份合法计划并按计划顺序派生阶段；`stage_result` 对本阶段有无改计划执行对称摘要校验；planner-amend 通过现有 `lint` 的子模式执行改前路径预检和改后精确 diff 复核，命中 design 禁区时整份不落笔，全部计划目标与输入方案文件零变化，失败原因只进入 planner-amend 普通 `done.note`，由 monitor 写 blocked `stage_result`；同时在 `relay_log.py` 入口为 stdout/stderr 建立 UTF-8 防护，消除 Windows cp1252 中文输出崩溃。

## Zero-context 自查

施工 worker 进场先执行 `git rebase --autostash master`，再读仓根 `AGENTS.md`、本文件、`task_plan.md`、`progress.md`、`findings.md`、DevPlan §RLT_09、design/01 §4.5 全文、§11 HC-RL-A119～A123 与 A135、§14 第 6 条。随后只读盘点 `relay_log.py` 的 `lint_plan`、`_validate_event_semantics`、`_validate_stage_event`、`_note_tokens`、`derive_status`、`_status_command`、`main`，以及 `test_relay_log.py` 的 A46/A72/A75/A89/A109/A129、superseded、stage-result 投影和 skill 文档测试。最后读 `tools/relay-light/skill/SKILL.md`、两份 adapter、RLT_10 F-003 与 `tools/tests/relay-light-log.ps1`。

每批只改该批允许文件，先取得目标行为 RED，再实现 GREEN；TypeError、fixture 解析失败、配置解析失败或测试启动失败不算有效 RED。跑测试产生的 `tools/relay-light/__pycache__/` 必须在提交前清理，禁止 `git add -A`。发现 oracle 冲突或必须越过 allowed-paths，写 `findings.md` 并发 `BLOCKED`，不得自行改 design/dev_plan/tools/tests。

## 完成条件 ★必写

以下五条逐字承接 design/01 §11；A120 后接 DevPlan 冻结的 RLT_03 五条交接断言。F-003 是并入的附加完成条件。

### HC-RL-A119

> `plan_amend` 事件校验：`agent` 必须是 `monitor#<n>`（`by=monitor`），`note` 必须同时含方案文件名与 `nodes=<节点号,节点号>`；**不进状态机**，同一 `(node, monitor#<n>)` 可重复出现且不影响 agent 事件配对

```bash
python3 -m unittest -v tools.relay-light.test_relay_log.RelayLifecycleTests.test_plan_amend_requires_monitor_and_complete_note_and_is_repeatable
```

判据：coder 写入、缺方案文件名、缺 `nodes=` 三类均 exit 2 且 A119；两条合法事件连续接受，前后的 agent 配对与 status 状态机投影一致。

### HC-RL-A120

> lint 放宽后仍守得住：同一 stage 的节点**追加在表尾**通过、被 superseded 行隔开通过；而**节点号重复（含已 superseded 的号）仍被拒**，`depends_on` 指向 superseded、跨阶段依赖指向后面的阶段、同卡阶段实例并行也仍被拒

```bash
python3 -m unittest -v tools.relay-light.test_relay_log.RelayPlanLintTests.test_a120_allows_append_and_superseded_separation tools.relay-light.test_relay_log.RelayPlanLintTests.test_a120_keeps_four_hard_constraints
```

承接 RLT_03 的交接断言（逐字）：

1. 「被 superseded 行隔开」始终通过；
2. 「其余条件合法的同 stage 表尾追加」在 RLT_09 前后按正式版本记录**拒绝→通过**；
3. 四项硬约束全部保持拒绝及有效编号；
4. 既有 A46 / A72 / A75 / 枚举与依赖回归保持；
5. 运行中追加能力最终由 RLT_16 / RLT_19 实跑证明，交付方式仍按 §4.5——**当前阶段实例内**追加由当班监工直接接手、**后续阶段**由编排开到时按常规处理。

取证必须另造满足其他所有规则、只有表尾位置差异的正例；既有 `C1 → R1 → C2` fixture 因 `C2.depends_on=R1` 同时触犯硬约束，不承诺原样翻绿，只允许把它收窄回 A129 实际负责的断言。四项反例分别锁 A46、A72、A89、A109；上述命令与相关既有回归全部 exit 0。

### HC-RL-A121

> 编排开阶段前重读计划：两次调用之间**不修改 `relay_log.py` 代码、不改账本，只修改同一份计划文件，追加新阶段节点行及保持计划合法所必需的对应 agent 行**；再次调用 `status` 后，输出的 `stages` 含该新阶段且顺序正确，下一阶段由计划推导而非固定 `W→C→R→F`

```bash
python3 -m unittest -v tools.relay-light.test_relay_log.RelayStatusProjectionTests.test_status_rereads_appended_stage_in_plan_order
```

判据：同一 plan 目录第一次 status 后，只修改该 `relay_plan.md`，追加合法 X 阶段节点行及通过 A75 所必需的对应 agent 行；不改 `relay_log.py` 或其它代码、不改 `relay_log.jsonl`。第二次 status 的 `stages` 恰多该实例且顺序等于节点表首次出现顺序；fixture 使用非 WCRF 顺序，证明没有固定阶段序列缓存。

### HC-RL-A122

> 改计划白名单（按路径）保持**三类闭集**：改计划实例只允许改 `docs/modules/<模块>/relay/<plan_id>/relay_plan.md`（含其 marker 的 `cards=`）、`docs/modules/<模块>/dev_plan/P<N>-*.md`、以及 `docs/modules/<模块>/workspace/<卡号>/task_plan.md` 且 **`<卡号>` 必须是改动前 marker `cards` 里已存在的卡**；新增卡的 `task_plan.md` 由该卡 W 阶段 builder 建，改计划实例写它即判失败。**`docs/modules/<模块>/design/` 整个目录是禁区**。禁区命中时整份拒绝，全部计划目标文件与输入方案文件均保持零变化，不做部分执行；planner-amend 不写 `blocked` / `escalate` / `plan_amend`，以普通 `done.note` 写 `outcome=out-of-scope proposal=<方案文件名> reason=<原因>`，再由 monitor 写 `stage_result outcome=blocked`

```bash
python3 -m unittest -v tools.relay-light.test_relay_log.RelayPlanAmendGuardTests
python3 -m unittest -v tools.relay-light.test_relay_log.SkillCoreDocTests.test_planner_amend_template_contract
```

判据：现有 `lint` 顶层子命令下的 planner-amend 校验模式以改动前 marker cards 为基准，三类路径分别通过；新卡 task_plan、任意 design 路径和混合允许/禁止集合全部 exit 2 且 A122。design 混合反例必须在预检阶段失败，actual 为空，全部计划目标与输入方案文件的原始工作树 bytes/mode/symlink 均零变化。planner-amend 只走 `agent_launch → done`，其 `done.note` 精确含 `outcome=out-of-scope proposal=<方案文件名> reason=<原因>`；不出现它的 `blocked` / `escalate` / `plan_amend`，随后 monitor 写 `stage_result outcome=blocked`。成功写入后按 W4 快照算法证明 `actual == proposed`。skill 模板含输入四件、一次改完、最多 lint 三次、拒绝分支零文件变化和上述完成记录。`main` 的顶层命令集合仍恰为 `add/status/lint`，不与 A135 冲突。

W4 重写 P1-02 的归因算法：不要求 planner-amend 入场时全仓无 dirty，但要求单写者静默、HEAD 与真实 index 原始 bytes 在守门窗口内不变。守门器只用 `git status --porcelain=v2 -z --untracked-files=all --ignored=no`、`git ls-files -z --cached`、`git ls-files -z --others --exclude-standard` 等只读命令取得 tracked/untracked 清单；逐路径直接读取工作树原始 bytes、permission mode 或 symlink target，在业务仓及其 `.git` 之外、权限 0700 的运行现场目录保存 before 原始副本与非持久 manifest，禁止 `git add`、`hash-object`、`write-tree` 等会写对象的命令。after 以同一算法复采，actual 是 before/after 原始状态元组不同的路径集合，因此改前 dirty 同路径二次修改不会漏报；成功必须 `actual == proposed`。守门前后比较业务仓 object database 的递归清单/摘要并要求零新增零变化；敏感 untracked 的正文、路径和内容哈希均不得进入 durable evidence。禁区混合 proposed 在任何业务文件写入前整体拒绝，以 `actual == ∅` 和目标/方案原始状态相等证明零变化。after/lint 失败时只从仓外 before 副本恢复 `actual ∪ proposed` 的原始 bytes/mode/symlink/存在性，再复采证明为空；不得用 HEAD、index 或 clean filter 产物覆盖改前 dirty。完整函数、命令和 RED/GREEN 矩阵见 `task_plan.md` B4。

### HC-RL-A123

> `stage_result` 改动摘要格式：本阶段有 `plan_amend` 时 `note` 必须含 `amend=<方案文件名>` 与 `nodes=<节点号,节点号>`，缺则退出 2；无 `plan_amend` 时不得出现 `amend=`

```bash
python3 -m unittest -v tools.relay-light.test_relay_log.RelayLifecycleTests.test_stage_result_amend_summary_matches_stage_history
```

判据：有 amend 缺 `amend=` 或缺 `nodes=` 均 exit 2 且 A123；合法摘要通过；无 amend 却带 `amend=` 被拒，普通 stage_result 通过。校验只看同阶段事实，不把别的阶段 plan_amend 串入本阶段。

### F-003（RLT_10 并入项）

> `relay_log.py` 在 Windows 默认代码页（cp1252）下，`status` 打印中文（`_status_command`）会 `UnicodeEncodeError: 'charmap'` 崩溃——PR #17 windows-latest runner 首次把 test_relay_log.py 接入 Windows 全量暴露此差异（薄壳套件 35 败中 29 例为该错）；`relay_log.py` 仅授权 `lint --json`，本卡不得改程序侧

本卡已获授权在程序入口根治，验证命令：

```bash
python3 -m unittest -v tools.relay-light.test_relay_log.RelayCliEncodingTests
```

判据：测试子进程显式设 `PYTHONIOENCODING=ascii` 与 `PYTHONIOENCODING=cp1252`（各至少一个 status/lint 中文输出路径），RED 必须是 `UnicodeEncodeError`/非零退出而非 fixture 错；入口对 stdout/stderr `reconfigure(encoding="utf-8")` 或等价防护后均 exit 0、按 UTF-8 解码且含预期中文，不依赖 PowerShell 薄壳的 `PYTHONUTF8`。

## 边界

- 允许：`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、`tools/relay-light/skill/**`、本工作区。
- 禁止：`install_skill.py`、`tools/tests/**`、`design/**`、`dev_plan/**`、其他 workspace、master/其他 worktree；不 push、不开 PR、不合并、不代签 verify/人验。
- 不原地复用节点号；不放宽 A46/A72/A89/A109；不让 planner-amend 写新增卡 task_plan；不做部分执行；不新增第四个顶层子命令。
- F-003 只做程序入口 UTF-8 防护与 Python 单测，不修改现有 PowerShell 薄壳缓解。

## 触及子系统

| 子系统 | 触点 | 风险 |
|---|---|---|
| 计划 lint | `lint_plan` 的 stage 连续性与 planner-amend 校验模式 | 过度放宽会破坏阶段/依赖无歧义 |
| 账本 add | plan_amend note 与 stage_result 摘要校验 | 控制事件误入 agent 状态机或跨阶段串线 |
| status | 每次解析当前 plan、按节点表推导 stages | 缓存或固定 WCRF 会漏新增阶段 |
| CLI 编码 | `main` 入口 stdout/stderr | Windows 默认代码页中文崩溃；重配失败需安全降级 |
| 仓内 skill | planner-amend 可执行模板 | 文档与程序 flag 漂移、禁区被部分执行 |
