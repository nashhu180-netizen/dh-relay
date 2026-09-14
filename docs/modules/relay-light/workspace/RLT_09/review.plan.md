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

---

## W3 复审（2026-09-14）

- 复审候选：W2 `ce14890`；W3 A-adjust `bdd6cc2`；W3 计划同步 `e201158`
- 复审目标：原 P1-01/P1-02/P1-03、RLT-A-07、DevPlan/brief/task_plan 同步及 B3/B4 可执行性
- 结论：**FAIL**

### P0

无。

### P1-01 复审 — oracle 已闭合，但 workspace 的 F-001 仍保留旧 BLOCKED 状态

用户已在 `decision.1` 选择 ①B，RLT-A-07 已把新合同同步到 design §4.5.2、§4.5.3、§9.4、HC-RL-A122、§14 第 6 项和 DevPlan §RLT_09；`brief.md` 与 `task_plan.md` 也一致采用三类闭集、输入方案只读、planner-amend 普通 `done.note`、monitor blocked `stage_result`。原 P1-01 的产品合同冲突已消除。

但 `findings.md` F-001 的状态仍是“B4 动代码前 BLOCKED；待 decider/orchestrator 取得权威裁决”，正文也仍写“两案均需裁决、builder 不选边”。施工 worker 被要求入场读取 `findings.md`，会同时看到 `task_plan.md` 的 CLOSED 与 `findings.md` 的待裁决 BLOCKED，不能无歧义照做。因此 P1-01 尚未在任务工作区完整闭合。

所需整改：保留 F-001 历史发现事实，但把影响、选项结果和状态更新为 `decision.1 ①B + RLT-A-07` 已闭合，并明确 B4 不再有该前置 BLOCKED。

### P1-02 复审 — 临时 index 没有隔离 Git object database，且 tree blob 不能承诺原始 bytes 恢复

W2 已解决“长期 tree-ish 污染”和“改前 dirty 同路径二次修改漏报”：before/after tree 差及 `actual == proposed` 的归因思路成立。但当前固定算法只给子进程设置 `GIT_INDEX_FILE`；`git add -A -- .` 与 `git write-tree` 产生的 blob/tree 仍写入业务仓真实 Git object database。对任意业务仓全量执行 `git add -A` 会把所有未忽略 untracked 文件及 tracked WIP 的内容对象化，即使真实 index 与工作树不变，也可能把凭据或无关敏感内容持久化到 `.git/objects`，与仓根凭据红线不相容；现有回归矩阵没有证明 object database 不受污染。

另一个独立缺口是失败恢复：计划要求仅凭 before tree entry 恢复“精确改前 bytes/mode/存在性”。`git add` 写入 tree 前会经过 `.gitattributes` clean filter、EOL 规范化等 Git 转换，tree blob 不必等于原工作树 bytes；因此从 tree blob 恢复不能普遍证明 bytes 精确相等，尤其本工具面向任意业务仓。

所需整改：B4 必须把临时对象与业务仓 object database 隔离，或采用不把全仓内容写入业务仓 Git objects 的事务/快照方案；同时为原始工作树 bytes、symlink 与 mode 给出可恢复证据，或取得收窄 oracle 的权威裁决。测试至少须覆盖 object database 零新增/外置、带 clean/EOL filter 的改前 dirty 恢复，以及未忽略敏感 untracked 内容不进入业务仓对象库/证据。整改后再审 P1-02。

### P1-03 复审 — CLOSED

RLT-A-07 已把 A121 澄清为：两次 `status` 之间不改代码、不改账本，只修改同一 `relay_plan.md`，追加新阶段节点行及通过 A75 所必需的对应 agent 行。DevPlan、`brief.md` 与 B3 逐字同向；B3 冻结代码/账本 hash、计划文件唯一 diff、两次 status、新实例顺序、非 WCRF 与 A75 回归，命令可执行。原 P1-03 已闭合。

### P2

无。

### P3

无。

### A-adjust 与 planning-event 核对

- `bdd6cc2` 只修改 design/01、增加 evidence/08、机械同步 DevPlan §RLT_09；未改代码、状态、依赖、task_type 或其它模块。
- design 的语义改动只覆盖冲突句及必要镜像：§4.5.2、§4.5.3、§9.4、HC-RL-A121/A122、§14 第 6 项；标题日期、活动事件索引和 RLT-A-07 摘要是 planning-event 登记所需元数据。§4.5.3/§14 与 DevPlan 同步均由 `decision.1` 明列，不构成范围扩张。
- RLT-A-07 声明中的 `review=evidence/08-...#review-rlt-a07` 与 `understanding=evidence/08-...#understanding-rlt-a07` 均指向真实唯一锚点。
- 独立机械复核显示 A-adjust 前后 design 中 `HC-RL-A<n>` 唯一 ID 集合无差异（均为 128 个）；没有新增、删除或改号。
- 三笔候选提交范围的 `git diff --check` 均通过。

### B3/B4 与新 oracle

- B3：**PASS**。文件、用例、命令、目标行为 RED 与 GREEN、A75 回归及证据输入都与新 A121 原文一致，worker 可照做。
- B4 的 F-001 分支：**PASS**。三类闭集、改前 cards、新卡 task_plan 拒绝、design 混合整份预检、输入方案零变化、planner-amend done → monitor blocked 账本链、`lint` 下属模式及 A135 三顶层命令均一致。
- B4 的变更归因/恢复实现：**FAIL**。受 P1-02 的 object database 与原始 bytes 恢复缺口阻断，当前 worker 不能按该算法施工后声称满足凭据红线和零变化合同。

### W3 Verdict

**FAIL**。P1-03 已闭合，P1-01 的 oracle 已闭合但 workspace F-001 状态尚未同步；P1-02 的 before/after 归因方向正确，但当前 Git plumbing 会污染业务仓对象库且不能普遍按原始 bytes 恢复。修订 `findings.md` 与 B4 快照/恢复算法后，重新提交 W plan-review。
---

## W4 定向复审（2026-09-14）

- 复审候选：`0898ab9`
- 复审范围：仅原 P1-01 的 F-001 状态同步、原 P1-02 的 W4 快照/归因/恢复算法
- 结论：**PASS**

### P0

无。

### P1

无。

### P2

无。

### P3

无。

### P1-01 定向复审 — CLOSED

`findings.md` 保留 F-001 的原始冲突事实，同时把影响与状态更新为 `decision.1` ①B + RLT-A-07 已闭合，并明确 B4 不再存在该前置 BLOCKED。其三类闭集、输入方案只读、planner-amend 普通 `done.note` 与 monitor blocked `stage_result` 口径和现行 oracle、`brief.md`、`task_plan.md` 一致；施工 worker 不再收到互相冲突的待裁决指令。

### P1-02 定向复审 — CLOSED

W4 已明确废止临时 Git index/tree 方案。新算法具备以下可执行、可复算边界：

- 对业务仓只调用列明的只读 Git 命令，并统一设置 `GIT_OPTIONAL_LOCKS=0`；禁止 `git add/read-tree/write-tree/hash-object/update-index/checkout-index/commit-tree`。实际抽查确认 `status --porcelain=v2 -z`、`ls-files -z` 与 `rev-parse --git-path` 命令形态在当前 linked worktree 可执行，能分别解析 worktree index、common git dir 与 object directory。
- before/after 直接从工作树以 `lstat`、原始读取采集 regular bytes、permission mode、symlink target 与 absent 状态，仓外 snapshot-dir 使用 0700/0600、拒绝已有目录和 symlink 父链。`actual` 对 before/after 路径并集逐状态元组比较，因此 tracked/untracked、新建/删除和改前 dirty 同路径二次变化均可重算。
- 失败恢复不再依赖 Git blob 或 clean/smudge：regular 用同父目录临时文件、逐字节写入、`fsync`、`fchmod`、`os.replace`；symlink 按原 target 重建；absent 只删除本次 regular/symlink。恢复后复采并要求受影响状态全等且全仓 `actual == ∅`，覆盖 clean/EOL filter 下逐字节、mode、symlink 的原值恢复。
- object database 以递归项名/lstat/size/mtime/SHA-256 完整指纹和 `git count-objects -v` 双证，在 before、成功 after、失败恢复三条路径均要求相等；真实 index 也按原始 bytes/mode 比较。该判据能直接发现业务仓 loose/pack/object 或 index 变化。
- 敏感 untracked 只进入仓外受限的非持久运行快照；生产持久证据仅允许命令、退出码、规则号、集合布尔值、合成用例名和对象库聚合结论，不允许正文、真实路径、symlink target、逐文件哈希或对象名。随机 canary 用例同时扫描业务仓 objects 与 durable evidence，任何正文、敏感式文件名或其逐文件哈希出现即失败；成功后还断言 snapshot-dir 已删除。

三项关键行为都有独立点名命令：

```bash
python3 -m unittest -v \
  tools.relay-light.test_relay_log.RelayPlanAmendGuardTests.test_snapshot_diff_captures_tracked_untracked_and_dirty_same_path_without_git_objects \
  tools.relay-light.test_relay_log.RelayPlanAmendGuardTests.test_failed_amend_restores_raw_bytes_mode_and_symlink_across_clean_eol_filter \
  tools.relay-light.test_relay_log.RelayPlanAmendGuardTests.test_sensitive_untracked_stays_out_of_object_database_and_durable_evidence
```

RED 被限定为接通真实 flags/helper 后的受控 `A122 snapshot-not-implemented` 或目标行为断言失败，排除了未知参数、缺函数、TypeError、fixture/A112 噪声；GREEN 逐项要求对象库零变化、filter 下原始状态恢复与敏感内容不进对象库/证据。批次小审可在合成仓复跑同一命令并重新计算这些断言，不依赖暴露真实敏感值的历史输出。

### W4 Verdict

**PASS**。原 P1-01 与 P1-02 均已闭合；`0898ab9` 只修改 `brief.md`、`findings.md`、`task_plan.md`，`git diff --check` 通过。本结论只解除 W4 定向复审项，不代替后续 B4 RED/GREEN、小审或 heavy 正式复核。
