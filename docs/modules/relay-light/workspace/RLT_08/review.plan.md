<!-- dh:v1 -->
# review.plan — RLT_08 task_plan 模式 A 审核

- 审核对象：builder `W_READY`，commit `f790a1d`
- 对照：`brief.md`、DevPlan §RLT_08、design/01 §0.3 / §1.3 / §7.1 / §11 的 HC-RL-A28/A29/A33/A34、两份 adapter 首行、`dispatch/exec.md`
- 结论：**FAIL**

## P0

无。

## P1

### P1-1 — B3 完成信号顺序与 coder 派活合同冲突

- `task_plan.md:24-30,166` 要求 B3 正常直接写 `CONSTRUCTION_DONE`，随后才由 audit 审 B3。
- `dispatch/exec.md:12,15` 要求每批先写 `READY_FOR_REVIEW`；最后一批须在 audit PASS **之后**，由编排再次派令才写 `CONSTRUCTION_DONE`。
- 影响：coder 无法同时遵守两份当前节点合同；若按 task_plan 执行，会在 checker 小审前宣告施工完成；若按 exec brief 执行，则违反 task_plan 的 B3 durable signal。
- 整改：统一为唯一顺序。建议按专门 coder brief：`B3 READY_FOR_REVIEW -> audit B3 PASS -> orchestrator 明确再派 -> CONSTRUCTION_DONE`，并同步修改 task_plan 的批次段、最终交接清单及 execution_strategy 中对应流程。

### P1-2 — HC-RL-A33 的命令不能证明索引位于阅读矩阵且唯一

- oracle 原文要求“`AGENTS.md` 阅读矩阵含指向 relay-light skill 的索引行”（design/01 `HC-RL-A33`）。
- `task_plan.md:128,137` 仅在整个文件执行 `rg -F`；任意小节中的一次或多次命中都可通过。它与 `task_plan.md:35,131` 声称的“限定所在小节”“精确一行”不一致。
- 影响：索引放错段或重复登记仍可 GREEN，不能按 oracle 机械裁决。
- 整改：把命令限定在“任务类型阅读矩阵”表的边界内，并显式断言命中数恰为 1；B3 红绿和整卡脚本须使用同一条结构断言。

### P1-3 — dev-harness 未改动的基线策略没有可执行命令

- `task_plan.md:117` 正确写了“若进场前已有用户改动，用进场前后对比证明本卡无新改动”，但 `task_plan.md:152` 只有一次当前态 `git status --short`。
- oracle 的证明方式是“`git diff` 对 dev-harness 仓为空”；单次 status 既不能把既有用户改动与本卡新增改动分开，也没有保存可比较的进场基线。
- 影响：dev-harness 若原本非 clean，worker 没有可执行的 PASS/FAIL 方法；若当前 clean，也缺少与进场基线配对的证据链。
- 整改：在 B1 动笔前保存 dev-harness 的 HEAD、tracked diff 与 untracked 路径基线，B3 用同样命令重取并逐项比较；若合同坚持必须 clean，则删除“允许既有改动”的分支并在 B1 前 fail closed，二者择一冻结。

## P2

### P2-1 — HC-RL-A34 的整卡断言只校验标头前缀

- `task_plan.md:147-149` 只 grep `[relay-light] worker · node=`，没有断言 `agent=<角色>#<实例>`、`workspace=<任务工作区>` 或整行首行格式。
- 影响：缺 agent/workspace 字段的坏模板仍能让整卡脚本退出 0，不完全覆盖 HC-RL-A34。
- 整改：对两份 adapter 抽出的派活 prompt 首行做整行固定字符串比较，或用锚定表达式覆盖四段及顺序，并断言恰好两份都通过。

### P2-2 — 允许路径总检未覆盖 index/worktree 的全部状态

- `task_plan.md:154` 的 `master...HEAD` 只检查已提交历史；共通约束 `task_plan.md:36` 的裸 `git diff --name-only` 又只覆盖未暂存工作树，未明确覆盖 staged/untracked。
- 影响：整卡机检可漏掉已暂存未提交或 untracked 的越界文件。
- 整改：明确分别检查 `master...HEAD`、working tree、index 与 untracked 路径，并对四者统一应用 allowed-paths 闭集。

## P3

- 四条 HC 均已逐字抄入 `brief.md`，A28/A29 的主体命令与 oracle 方向一致。
- B1→B2→B3 的功能切分清楚，位置、样板、红绿目标和 batch audit 输入基本齐全。
- “有意绕过 B-adjust”与“设计与验收仍走 dev-harness”均以原文进入 B2；白名单限制未扩张到 design/验收。
- 计划明确只增量接入 relay-light，并要求用上下文 diff 核对现役 Runner 铁律不被重写或弱化。

## 裁决

**FAIL**。先闭合 P1-1～P1-3，再重新执行模式 A plan-review；P2 建议同时修正，以免整卡脚本产生假绿。
