<!-- dh:v1 -->
# review.plan — RLT_09 模式 A

- 审核者：`rlt09-audit`
- 候选：`aaa2700`（W 七件套与五批 `task_plan`）
- 审核范围：`brief.md`、`task_plan.md`、DevPlan §RLT_09、design/01 §4.5 与 HC-RL-A119～A123/A135、现状 `relay_log.py` / `test_relay_log.py`、RLT_10 F-003
- 结论：**FAIL**

## Findings

### P0

无。

### P1-01 — F-001 被正确识别，但 B4 仍不是可执行批次

design §4.5.2 同时冻结了以下三件事：planner-amend 只可修改三类路径；命中禁区时整份计划改动不落笔；planner-amend 还要在输入方案文件写「超出范围」。方案文件通常是 `workspace/**/decision.<n>.md` 或 strategist 文件，不属于三类白名单；HC-RL-A122 又要求全仓 `git diff --name-only` 的实际变更集是三类白名单子集。因此 `findings.md` F-001 的冲突判断成立。

`task_plan.md` 的前置 `BLOCKED` 与 A/B 两个权威修订方向是安全且可操作的停止边界，但它只描述了如何停，并未让 B4 本身变成可施工计划。B4 后文仍同时要求“白名单仅三类”和“命中禁区只向方案文件追加超出范围”，两者不能由 exec 同时实现。A122 在权威合同完成裁决并同步、B4 随之重写前，不满足模式 A 的“每条 HC 都有可执行验证命令”要求，不能给 W PASS。

所需闭合：由 orchestrator 取得用户的合同裁决；若选扩白名单，须精确限定“当前输入方案文件的单一超范围追加”；若选保持三类闭集，须删除 planner-amend 写方案文件的要求。裁决必须先同步 oracle，再重写 B4 的程序、模板和反例判据，随后重新 plan-review。

### P1-02 — A122 的 actual diff 基线不足以证明“本次改计划”的精确集合

B4 提议 `--base <tree-ish>` 后直接执行 `git diff --name-only <base>`，但计划没有冻结 `<base>` 必须代表紧邻本次 planner-amend 的改前状态，也没有处理改前已有 dirty 路径。方案文件本身在 planner-amend 入场前就由 decider/strategist 写成，天然可能已在全仓 diff 中；其它既有 WIP 也会污染集合。单个 tree-ish 对比因此不能等价于 oracle 所说的“改前/改后比对”，也不能可靠归因到本次改计划。

所需闭合：B4 必须冻结可复现的改前快照/洁净前提与改后取集算法，并证明已在改前 dirty 的同一路径发生二次修改时也不会漏报；同时明确 tracked 与 untracked 的处理。成功例应证明本次 actual 集合与 proposed 集合精确相等，禁区混合例应证明 planner-amend 的计划目标文件零变化。

### P1-03 — A121 用例擅自把“仅追加节点行”扩成“节点表和 agent 表一起追加”

HC-RL-A121 原文及验收描述均要求第一次 `status` 后仅追加新 X 阶段节点行，再次调用 `status`。`task_plan.md` B3 改为同时追加节点表和 agent 表行。现状 `status` 经 `_runtime_plan()` 调用 `lint_plan()`，而 A75 会拒绝没有 active agent 的新节点，所以按 oracle 字面执行无法得到第二次 status exit 0；但 worker 也不能自行改写 oracle 来绕过该冲突。

所需闭合：把这一冲突登记为 finding 并取得权威澄清——明确 A121 的“节点行”是否包含维持计划合法所必需的 agent 行，或给出不改 oracle 且能通过 A75 的合法 fixture。未澄清前不得以“节点 + agent 行”测试冒充逐字满足 A121。

### P2

无。

### P3

无。

## 已通过的计划检查

- A119/A123：目标函数、目标用例、RED/GREEN 与同阶段隔离方向可执行；没有把 `plan_amend` 纳入 agent 状态机。
- A120：另造仅有表尾位置差异的合法正例、保留 superseded 隔开正例、四项硬约束及 A46/A72/A75/A89/A109 回归的安排符合 RLT_03 交接断言；RLT_16/RLT_19 被正确留作后续实跑。
- A122/A135：把 planner-amend 守门实现为现有顶层 `lint` 的 flags/helper 是成立的。当前 CLI 顶层集合恰为 `add/status/lint`；新增 `lint` 下属模式不会形成第四个顶层子命令，且计划保留了三命令 `--config-dir` 回归。
- F-003：入口统一配置 stdout/stderr、用真实 CLI 子进程强制 ascii/cp1252 取得 `UnicodeEncodeError` 真 RED、再按 UTF-8 bytes 解码的路线可执行，且未越到 PowerShell 薄壳。
- 范围：`aaa2700` 仅含 RLT_09 workspace 七件套；计划实现路径未授权 `install_skill.py`、`tools/tests/**`、design 或 dev_plan。

## Verdict

**FAIL**。P1-01/P1-02 阻断 HC-RL-A122，P1-03 阻断 HC-RL-A121 的逐字取证；先完成权威裁决与 task_plan 修订，再重新提交 W plan-review。
