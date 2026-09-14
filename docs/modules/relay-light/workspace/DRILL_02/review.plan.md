<!-- dh:v1 -->
# plan review — DRILL_02 · W1 · plan-reviewer#2

## 最新结论（复审 3 · current HEAD `4a718d931da6a6581c233f511d75f15068f8c8a9`）

**PASS**。commit `4a718d931da6a6581c233f511d75f15068f8c8a9` 已闭合 P1-001-R2；当前七件套、独立 durable signal、`task_type=light`、单批 C1、allowed-paths、两条验收及不提前施工/不代签边界一致且可执行。P1/P2/P3 均无当前未闭合项。本结论仅闭合 W1 计划复核，不授权进入 C1、commit、verify 或验收。

## 历史结论（复审 2，保留）

**FAIL**。commit `37370a7158dcddacbc9a011371ab10dee6535adf` 已完成独立 done 文件主结构并迁出 builder 的 W_READY，但 P1-001 未完全闭合：当前执行合同仍有三处要求 construction worker/coder “记 progress”，与 `progress.md` 归 scribe 独占直接冲突。不得进入 C1。

## 历史结论（复审 1，保留）

**FAIL**。计划的目标、范围、单批施工与验收路径可执行，但 durable signal 的写入归属违反最新编排协议，属于进入 C1 前必须整改的 P1。

## 核对结果

| 检查项 | 结论 | 证据 |
|---|---|---|
| 七件套齐全 | PASS | `brief.md`、`task_plan.md`、`progress.md`、`findings.md`、`lesson_candidates.md`、`review.md`、`execution_strategy.md` 均存在 |
| GitHub Issue 豁免 | PASS | 演习卡 README 第 10 行已记录 `GitHub-flow: user-waived (2026-09-14, scope=dryrun-win-01 全部预演工件与 DRILL_02)`；提交 `8e878c64aba8fc34ad64ba195d75dfee3d1722ea` 可核验且为当前 HEAD。仅据此闭合本预演的 GitHub-flow/Issue 闸，不推定 D-start、verify、验收或其他豁免 |
| 档位 / Recipe | PASS | 演习卡 README 第 9 行及 `brief.md` 第 13 行冻结 `task_type=light`；`review.md` 登记 lesson + consistency 两路 |
| 施工批次 | PASS | `task_plan.md` 仅定义一个施工批次 C1；relay plan 节点表为 W1 → C1 → R1 → F1 |
| 计划改动 | PASS | `task_plan.md` 第 46–55 行仅计划在 `.gitignore` 末尾追加 `__pycache__/` 与 `*.pyc`；当前 `.gitignore` 无 working tree/index diff，未提前施工 |
| 验收 | PASS | AC-1 为 `git check-ignore -v tools/relay-light/__pycache__/x.pyc` 命中；AC-2 为实跑 `pwsh tools/tests/relay-light-log.ps1` 到底后 `git status --short` 无 `__pycache__` |
| allowed-paths | PASS | 演习卡 README 第 8 行、`brief.md` 边界及 `task_plan.md` 第 17–24 行均限定为 `.gitignore` 与 `docs/modules/relay-light/workspace/DRILL_02/**` |
| 不提前施工 / 不代签 | PASS | `.gitignore` 当前无 diff；`review.md` 第 47–50 行保持待验/未勾，且第 54–60 行人类签名区为空 |
| durable signal | **FAIL (P1)** | 见下述 P1-001 |

## Findings

### P1-001 — worker durable signal 共写 `progress.md`，破坏角色隔离

- **位置**：`task_plan.md` 第 26–34、38、64 行；`execution_strategy.md` 第 39–47 行；`progress.md` 第 23–24 行。
- **证据**：计划要求 builder、plan-reviewer、coder、checker、scribe、decider、reviewer 全部向 `progress.md` 追加 DONE；builder 的 `DONE ... role=builder ... status=W_READY` 已实际写入 `progress.md`。这与最新编排指令“每角色写自有 `done.<role>.md`，`progress.md` 归 scribe 独占”冲突，也使 read-only reviewer 的业务报告与 durable signal 权限无法分离。
- **整改要求**：将各角色信号改为各自独立 `done.<role>.md`；明确 `progress.md` 仅 scribe 可写。把现有 builder `W_READY` 从 `progress.md` 迁至 `done.builder.md`。同步修正 `task_plan.md` 与 `execution_strategy.md` 中所有共写描述、示例和 coder 收口步骤；各派单/角色输出名保持一致。不得借整改进入 C1 或修改 `.gitignore`。

### P2

无。

### P3

无。

## 复审入口

builder 完成 P1-001 后，应由同一计划复核链重新核对独立 done 文件、`progress.md` 写入归属及所有引用一致性；本次 FAIL 不授权施工、提交、verify、验收或任何额外 GitHub-flow 豁免。

---

## 历史记录 — 复审 2 · commit `37370a7`

### 逐项核实

| 核实项 | 结论 | 当前证据 |
|---|---|---|
| 整改提交 | PASS | `37370a7158dcddacbc9a011371ab10dee6535adf` 为当前 HEAD，diff 仅修改 `brief.md`、`task_plan.md`、`progress.md`、`execution_strategy.md` |
| GitHub-flow 豁免边界 | PASS | `8e878c64aba8fc34ad64ba195d75dfee3d1722ea` 仍为 HEAD 祖先；`brief.md` 已引用该记录并明确不推及 D-start、verify、验收、发布等其他闸 |
| 独立 signal 结构 | PASS | `task_plan.md` 第 28–34 行与 `execution_strategy.md` 第 39–47 行均改为每角色自有 `done.<role>.md`，并声明 `progress.md` 由 scribe 独占 |
| builder W_READY 迁移 | PASS | `progress.md` 已无 DONE 行；未提交工作树中的 `done.builder.md` 存在，信号为 `role=builder batch=W status=W_READY`，evidence 引用 `commit=37370a7` |
| 七件套 / task_type / 单批 / 验收 / allowed-paths | PASS | 七件套仍齐全；`task_type=light`；仅一个 C1；AC-1/AC-2 与演习卡一致；允许路径仍仅 `.gitignore` 和 `DRILL_02/**` |
| 不提前施工 / 不代签 | PASS | `.gitignore` working tree 与 index 均无 diff；`review.md` 验收项仍待验、人类签名区为空 |
| P1-001 全量闭合 | **FAIL** | 见 P1-001-R2 |

### P1-001-R2 — 非 scribe 写 `progress.md` 的残留指令

- **位置与证据**：
  - `brief.md` 第 21 行仍要求 construction worker 在 rebase 被拒后“核查 merge-base 并如实记 progress”。
  - `task_plan.md` 第 6 行仍要求当前 worker“核查 merge-base 并记 progress”，同一行后部却又要求偏离只记 findings 与自有 done 文件。
  - `findings.md` 第 10 行仍指示后续 coder 采用“merge-base 核查 + 记 progress”。
- **影响**：这三处是 construction worker/coder 的直接执行指令，会让其按合同写入 scribe 独占的 `progress.md`；与整改后的 `task_plan.md` 第 28、38、64 行及 `execution_strategy.md` 第 41 行自相矛盾，P1-001 因而仅部分闭合。
- **整改要求**：将上述三处的“记 progress”统一改为记录在该角色获授权的业务产出/自有 `done.<role>.md`，由 scribe 后续汇总进 `progress.md`；完成后全文检索非 scribe 对 `progress.md` 的写入动词，确保只保留“读取”或“由 scribe 汇总/登记”的描述。保留当前 `done.builder.md` 与已迁出的 W_READY，不进入 C1、不修改 `.gitignore`。

### P2 / P3

无新增。

### 本轮停止边界

最新结论为 **FAIL**；只否决 W1 计划闭合，不授权施工、commit、verify、验收或额外 GitHub-flow 豁免。待 builder 闭合 P1-001-R2 后再由同一复核链复审。

---

## 复审 3 记录 — commit `4a718d9`

### 逐项核实

| 核实项 | 结论 | 当前证据 |
|---|---|---|
| 当前 HEAD / 整改 diff | PASS | HEAD=`4a718d931da6a6581c233f511d75f15068f8c8a9`；该提交仅修改 `brief.md`、`task_plan.md`、`findings.md`，4 行新增、4 行删除，与本轮整改声明一致 |
| P1-001-R2 三处残留 | PASS | `brief.md:21`、`task_plan.md:6`、`findings.md:10` 均已改为 construction worker/coder 在自有 `done.<role>.md` 留证、由 scribe 汇总至 `progress.md` |
| C1 coder 改动文件 | PASS | `task_plan.md:48` 仅列 `.gitignore`、`findings.md`、`lesson_candidates.md`、`done.coder.md`，明确 `progress.md` 归 scribe 独占且 coder 不写 |
| 全文 signal / progress 归属 | PASS | 当前七件套中所有 `progress.md` 写入语义仅指向 scribe 汇总/登记；其他角色只读取或写自有 done 文件；`progress.md` 当前无 DONE 行 |
| builder durable signal | PASS | 未提交工作树 `done.builder.md` 存在，内容为 `role=builder batch=W status=W_READY`，evidence 引用 `commit=4a718d9` |
| GitHub-flow 豁免边界 | PASS | `8e878c64aba8fc34ad64ba195d75dfee3d1722ea` 仍为当前 HEAD 祖先；豁免仍仅覆盖已记录的 GitHub-flow 范围，不扩张至 D-start、verify、验收或发布 |
| 整体 W1 计划 | PASS | 七件套齐全；`task_type=light`；施工仅一个 C1；计划只追加 `.gitignore` 的 `__pycache__/` 与 `*.pyc`；AC-1 为 check-ignore 命中，AC-2 为实跑测试后 status 无 `__pycache__`；allowed-paths 仅 `.gitignore` 与 `DRILL_02/**` |
| 不提前施工 / 不代签 | PASS | `.gitignore` working tree 与 index 无 diff；`review.md` 两条验收仍待验，人类签名区为空 |

### Findings

- P1：无当前未闭合项；P1-001 与 P1-001-R2 均已闭合。
- P2：无。
- P3：无。

### 最新停止边界

本轮最新结论为 **PASS**，仅供 monitor 闭合 W1 使用；plan-reviewer 不进入 C1、不修改施工文件、不 commit、不代签 verify 或验收。
