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

---

## 第二轮

- 审核对象：builder 整改 commit `1d77159`（当前分支另有 builder W2 信号提交 `023b9b0`）
- 审核范围：逐项回归首轮 P1-1～P1-3、P2-1～P2-2，并重新对照四条 HC、DevPlan §RLT_08、design/01 指定段落、adapter 首行、allowed-paths 与施工派活合同
- 结论：**FAIL**

### 首轮发现回归

#### P1-1 — CLOSED

`task_plan.md`、`execution_strategy.md` 已统一为：B3 首次只发 `READY_FOR_REVIEW`，audit B3 PASS 后须由 orchestrator 再次明确派令，exec 才单独发 `CONSTRUCTION_DONE`。该顺序与 `dispatch/exec.md` 第 12、15 行一致，不再提前宣告施工完成。

#### P1-2 — CLOSED

B3 红绿命令与整卡脚本现用 `awk` 截取“任务类型阅读矩阵”小节，再断言 `tools/relay-light/skill/SKILL.md` 命中数恰为 1。实测当前未施工 AGENTS 得到预期 RED；命令能够拒绝缺失、重复及小节外假阳性。

#### P1-3 — CLOSED

B1 动笔前现冻结 dev-harness 的 HEAD、`git diff --binary HEAD` 摘要与 untracked 路径集合摘要；B3 重算后三项逐一 `cmp`。这为外部仓原本非 clean 的情形提供了可执行的前后同态证据，并避免把外部文件内容写入本仓。

#### P2-1 — CLOSED

A34 现对 adapter 派活 prompt 首行做整行字节比较，并断言 adapter 数恰为 2。只读实测两份 adapter 均等于 oracle 样板，`adapter_exact_count=2`。

#### P2-2 — CLOSED

整卡路径检查已分别覆盖 `master...HEAD`、working tree、index、untracked 四个集合，并以同一 allowed-paths 正则拒绝越界；只读试跑当前四集合无范围外路径。

### 全面复看新增发现

#### P0

无。

#### P1-4 — 施工 worker 的第一 Git 动作合同仍冲突

- 仓根 `AGENTS.md` 的 worktree 铁律要求“worker 进场第一动作自 rebase master”；`task_plan.md:6` 进一步明确“第一个 Git 动作是 `git rebase --autostash master`”。
- 但 coder 的专门派活合同 `dispatch/exec.md:6-7` 要求第一步先执行 `git status && git branch --show-current`，第二步才读取 task_plan；全文没有 rebase 步骤。
- 影响：新进场的 exec 无法同时遵守专门 brief 与 task_plan/仓根铁律；若逐步照 `dispatch/exec.md` 做，第一 Git 动作已经不是 rebase，且直到读 task_plan 后才会知道遗漏。
- 整改：在 `dispatch/exec.md` 第一步把 `git rebase --autostash master` 放到 `git status` / `git branch --show-current` 之前，并明确 rebase 失败即写 `BLOCKED` 信号后停止。不要仅在 task_plan 重复要求，因为 coder 的读取顺序晚于专门 brief 第一步。

#### P2

无新增 P2。

#### P3

- 四条 HC 均有可执行命令；A28/A29 的判据保持与 oracle 一致，A33/A34 的结构断言已消除首轮假绿窗口。
- B1/B2/B3 的位置、样板、红绿、audit 输入与串行停点完整；B3 收束信号已与 checker 顺序对齐。
- “有意绕过 B-adjust”与“设计与验收仍走 dev-harness”原文仍在 B2，例外闭集未扩张到 design/验收。
- Runner 现役铁律只允许增量加入冻结分流，计划仍要求 audit 检查上下文 diff，未授权重写或弱化。
- allowed-paths 仍严格限制为 `AGENTS.md` 与 `docs/modules/relay-light/workspace/RLT_08/**`；本轮所审 builder commit 仅触及工作区内三份计划工件。

### 第二轮裁决

**FAIL**。首轮五项均已闭合；只需闭合新增 P1-4 后再审。未发现其它阻断项。
