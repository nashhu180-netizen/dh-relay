<!-- dh:v1 · review.md — RLT_29 验收靶与两层复核登记。 -->
# review — RLT_29

## 独立复核区

### workflow-final review 层（single-task）

> heavy 五路一条不少；每条 path 的每次整改后复审必须是 fresh reviewer，施工者不得复核自己。最多返工 2 轮。此区不得写 dev-harness targeted receipt。

| path | review_round | remediation_count | reviewer identity/session | fresh 相对上一轮 | 输入 SHA/diff | findings | 结论 | durable signal |
|---|---:|---:|---|---|---|---|---|---|
| code-round1 | 1 | 0 | r29-wf-code1-r1 · w41:tC/pC | 是 | 93d65cb→wt/RLT_29，全量 diff | P0/P1=0 | PASS | `DONE.workflow-final.code-round1.review-round-1.md` |
| code-round2 | 1 | 0 | r29-wf-code2-r1 · w41:tD/pD | 是 | 93d65cb→wt/RLT_29，全量 diff + code-round1 | P0/P1=0 | PASS | `DONE.workflow-final.code-round2.review-round-1.md` |
| requirement | 1 | 0 | r29-wf-requirement-r1 · w41:tE/pE | 是 | 93d65cb→wt/RLT_29，验收/场景证据 | P0/P1=0 | PASS | `DONE.workflow-final.requirement.review-round-1.md` |
| consistency | 1 | 0 | r29-wf-consistency-r1 · w41:tF/pF | 是 | 93d65cb→wt/RLT_29，兄弟合同 | P0/P1=0 | PASS | `DONE.workflow-final.consistency.review-round-1.md` |
| lesson | 1→2 | 0→1 | r29-wf-lesson-r1 · w41:tG/pG → fresh r29-wf-lesson-r2 · w41:tH/pH | 是 | 93d65cb→wt/RLT_29，lesson_candidates/知识对照 | round-1 P1=4 → 候选 L01–L04 整改闭合；round-2 P0/P1=0 | PASS | `DONE.workflow-final.lesson.review-round-1.md` FAIL；`DONE.workflow-final.lesson.review-round-2.md` PASS |

### dev-harness E2 `code_review` 层

> marker=`dh:review-policy:v1 mode=single-full-targeted max_attempts=2`。full 初审使用 fresh reviewer；仅 open P0/P1 后允许 attempt 2，且必须同一 `reviewer_session_id`。本区与 workflow-final 分开取证；fresh 与 same-reviewer 条件相斥时禁止合并。

**code_review 初审结论**：PASS（P0=0、P1=0、P2=7 登记不阻断）｜reviewer_session_id=`r29-e2-code-review-a1`（fresh 实例，w41:tJ/pJ，Devin SWE-2 Max，实观测 argv=`devin --model swe-2-max --permission-mode dangerous`）｜2026-09-23

| attempt | kind | review_round | remediation_count | reviewer_session_id | baseline/target/diff | findings mapping | 结论/receipt/signal |
|---:|---|---:|---:|---|---|---|---|
| 1 | full | 1 | 0 | `r29-e2-code-review-a1` | baseline `93d65cb` → worktree `wt/RLT_29`（`/home/nash/work/dh-relay/.dh-worktrees/RLT_29`）：tracked 7 件 +462/-26 + untracked 三类（workspace/RLT_29、as-built 快照、design/evidence/13）全量复核 | P0=0/P1=0；P2-1～P2-7 见下 | PASS / `DONE.e2-code-review.attempt-1.md` |
| 2 | targeted（仅 open P0/P1） | 2 | 1 | 必须与 attempt 1 相同 | 待整改 | 仅 P0/P1 ref | not-dispatched / `DONE.e2-code-review.attempt-2.md` |

### E2 attempt-1 复核记录（独立证据层，不合并 workflow-final 身份或结论）

- **身份与边界**：reviewer#e2-attempt-1 = `r29-e2-code-review-a1`（w41:tJ/pJ），fresh——未参与 RLT_29 施工/规划/批次复核/decision/任何 workflow-final 路。本棒唯二写入为本区与 `DONE.e2-code-review.attempt-1.md`。RELAY_RECEIPT preflight 未命中（`env | grep '^RELAY_'` 无输出），未清任何 `RELAY_*`。
- **前置门（五路 workflow-final durable PASS 齐备）**：code-round1/code-round2/requirement/consistency 均 round-1 PASS；lesson round-1 FAIL（P1=4）→ `coder#lesson-remediation-1` READY → fresh `r29-wf-lesson-r2` round-2 PASS。六件 `DONE.workflow-final.*` signal + 六份独立 review 工件均在，identity/session 与本层分开登记。
- **本棒独立自跑**（cwd=worktree 根，非引用前人结论）：B-01 `Ran 19 tests / OK` exit 0；B-02 discover `Ran 240 tests / OK` exit 0；B-03 pwsh `RELAY ALL PASS (SKIPPED: 1)` exit 0；plan/log 扫描 0 命中；`relay_log.py` + `docs/modules/relay-light/relay/**` + `roles.toml` 对 93d65cb 零 diff；`git diff --check` 净；§6 allowed-path audit PASS（changed=138 全在闭集）；fresh `dh relay-light` exit 1 `59 失败/35 警告` 与 `evidence/batch-3/post-b04-rerun-1/B-04.txt` **逐字节一致**、0 条 RLT_29-owned；`DONE.plan-review.round-2.md` SHA-256 `9f6cf3a3…ed62f` 与 §4 冻结例外逐字一致。
- **独立变异核验**：/tmp 只读副本将 SKILL gate 行「未获明确确认不得启动任何 agent」改为「可以先启动再补确认」，`RELAY_LIGHT_SKILL_DIR` 重定向后 `FAILED (failures=2)`——结构断言对弱化实际咬人。
- **证据链核验**：B-04 全链闭合且原件未覆盖（`BLOCKED.batch-3.coder.md`→`decision.batch-3-b04.md` RESOLVED→ledger READY→builder attempt-2 READY→`DONE.plan-review.batch-3-b04.md` targeted PASS→`DONE.batch-3.coder.b04-rerun-1.md` READY→`DONE.batch-3.review.md` PASS）；`post-b04-rerun-1/comparison.json` 17 项守卫全 ok（owned=0、canonical inherited Counter=baseline 59、P/S 逐字锚、post L 六路径 ⊆ D 且 tracked-before==after）；`post/comparison.json` verdict=BLOCKED 如实留痕；Evidence Ledger E-301～E-304 SHA-256 抽查与原件逐字一致；安装双副本 10/10 MATCH、roles.toml 源字节零 diff；Herdr 实态 w41 单 workspace 具名 tab/pane 与 `execution_strategy.md` 快照逐项一致（本实例 tJ/pJ 实测在场）；RED 快照五文件与 `git show 93d65cb:` 逐字节一致。
- **findings**：P0：无。P1：无。P2 七条均登记不阻断（收口建议级；与 workflow-final 各层已登记项同源，本层独立确认属实）：
  1. design/01 §7.5.5 标头示例滞留旧 5 值 `phase=<plan|batch|final|decision|monitor>`，与运行期 9 值闭集字面不齐；现役合同与结构测试以 9 值为权威且显式排除该串，无实害。
  2. DevPlan §5「§14 同步项对照」缺第 8 行（RLT_21 项），与「九个同步项均有 owner」汇总行不齐；RLT_29 承接的第 9 项在表且证据链完整。
  3. as-built §4 B-04 行记初跑 66 未过、无指向 `post-b04-rerun-1/` 解决链的回链；时点快照如实，E10 备料须并列 rerun comparison 防误读。
  4. 结构断言为 presence-based：对已满足节内追加型矛盾及 AGENTS.md（不在 `ALL_SINGLE_TASK_DOCS`）不可见；删除/弱化/重排/丢字段均 fail-loud，方向非假绿。
  5. review.md workflow-final 五行与完成条件表 1/3/4/6/8/10 证据格仍为「待派/待 batch-3/待 final」占位——五路 durable PASS 与三批证据均已交付，收口/E10 备料时应刷新为实际引用。
  6. workflow-final 整改 signal `DONE.workflow-final.lesson.coder-remediation-1.md` 不在 task_plan §4 冻结文件名表，`agent=coder#lesson-remediation-1` 为派单别名（物理实例实为 r29-b3-coder 同 session 复用，满足「同 coder」实质）；被正确消费、无路由实害。
  7. design/evidence/13 §二.6 保留被 §七用户更正 supersede 的旧 monitor 合同且无行内回链；§七已明记更正前后合同，属形成史留痕。
- **verdict**：PASS（无 open P0/P1）。targeted attempt 2 **不需要、不派出**（仅 open P0/P1 才允许，且须同一 `reviewer_session_id`）。本 PASS 仅为 dev-harness E2 `code_review` 层初审结论，不代表 E10、人验、verify、PR/merge、Issue close 或任务收口。

**需求复核结论**：PASS｜r29-wf-requirement-r1｜`DONE.workflow-final.requirement.review-round-1.md` 与独立 review 原件；P0/P1=0。

**教训复核结论**：PASS｜r29-wf-lesson-r2（fresh）｜`DONE.workflow-final.lesson.review-round-2.md` 与独立 review 原件；round-1 P1=4 已整改闭合。

## 一致性复核块

<!-- dh:consistency-review:v1 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| single-task skill / 双 adapter / DevPlan 合同 | 完整 relay 路径与 heavy Recipe | 是；独立 reviewer 已核对 | PASS | r29-wf-consistency-r1；`DONE.workflow-final.consistency.review-round-1.md` |

## Recipe 完成谓词

- [x] workflow-final heavy 五路全部 PASS；lesson 经一次整改由 fresh reviewer round-2 PASS。
- [x] E2 code_review attempt-1 独立 PASS，P0/P1=0；attempt-2 不适用。
- [x] 两层 reviewer 身份、session、输入和结论分别登记。
- [x] 无施工者复核自己的施工。
- [x] 最终汇总无 open P0/P1；七条 P2 按用户 2026-09-23 裁决转验收池。

## AI 提交区

- 提交范围：RLT_29 / Issue #56；以 DevPlan `dh:allowed-paths:v1 task=RLT_29` 精确核对，不包含 RLT_27 等并行 WIP。
- 机器证据：E-301（19 tests OK）、batch-3 `post-b04-rerun-1/comparison.json`（RLT_29-owned=0、canonical inherited=59）、三批 reviewer PASS、workflow-final 五路 PASS、E2 attempt-1 PASS；完整 relay 回归见 E2 记录 `RELAY ALL PASS (SKIPPED: 1)`。
- 用户验收：2026-09-23 对话在 E10 证据摘要与明确的 single-task 可用性确认口之后答复「认可收口」；H19 整卡结论为认可，E11 本地收口授权包生效。七条非阻断 P2 同日选择「进入验收池（推荐）」。
- 版本动作：待实际 commit / PR / CI / merge 后回填；此区不预写未来 SHA 或结果。

## 完成条件逐条挂证据

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| 1 | `single-task` 与完整 relay 并列且互斥，不创建/读写 `relay_plan.md`、`relay_log.jsonl`，不使用 W/C/R/X/F；完整模式模板与行为不回归。 | AI | `check.batch-3.md`、`review.workflow-final.code-round1.review-round-1.md`、E2 独立复核；full relay runner `RELAY ALL PASS (SKIPPED: 1)` | 满足 |
| 2 | 一任务一 Herdr workspace、每角色实例一独立具名 tab/pane；orchestrator 启动前展示全部拟启动角色/实例模型与推理档表并询问确认，未确认不得启动任何 agent；用户可逐角色修改，确认写入 `execution_strategy.md`，恢复沿用未变确认，新增/换角色或实例、模型/推理档需重问；真实询问→确认→Herdr tab/model 与快照一致；最大工具权限不扩张 Git/发布/verify/人验授权。 | AI | E-303：`evidence/batch-3/model-allocation.md` + `execution_strategy.md`；workflow-final 五路与 E2 实例逐行登记；`review.workflow-final.requirement.review-round-1.md` 与 E2 复核实测 w41 实态 | 满足 |
| 3 | 生命周期固定为 workspace/task_plan → plan review → 分批开发+batch review → 按 `task_type` 展开的 final review → 主会话人验；batch 与 final 是两道独立闸。 | AI | `DONE.plan-review.monitor-contract.round-3.md`、三批 `DONE.batch-*.review.md`、五路 workflow-final signal、E2 signal；2026-09-23 用户「认可收口」 | 满足 |
| 4 | plan/batch review 各最多整改 2 轮，FAIL 回同 builder/coder、原 reviewer 复审；workflow-final 每条适用 path 最多返工 2 轮且每轮 fresh reviewer；超限按合同分路。 | AI | `review.plan.md`、`decision.plan-round-3.md`、三批 `check.batch-*.md`；lesson round-1 FAIL→coder remediation-1 READY→fresh round-2 PASS | 满足 |
| 5 | monitor 对 repo/workspace 完全只读，只在 Herdr wait/get/read 并 prompt 通知 orchestrator，通知不落盘；恢复依据 durable signals + review/decision + `execution_strategy.md` + Herdr 实态；`progress.md` 仅由当前 batch coder 写施工里程碑/证据引用。 | AI | E-304：`check.batch-2.md`、`DONE.batch-2.review.md`；E-303：`evidence/batch-3/model-allocation.md`；`review.workflow-final.consistency.review-round-1.md` 文件归因核验；`progress.md` 仅三批里程碑和授权 ledger | 满足 |
| 6 | monitor 每 120 秒 wait/get，无变化静默；Enter 三条件同时成立才发送一次并复验，失败通知 orchestrator/换 fresh，禁止连按。 | AI | `check.batch-2.md` 项 5、`review.workflow-final.requirement.review-round-1.md` 条件 6、SKILL/双 adapter；运行态通知不落文档 | 满足（合同及场景观察，非终端全量日志证明） |
| 7 | single-task 标头字段合法且与完整 relay 标头互斥；产出型 builder/coder/reviewer/decider 在 DONE/BLOCKED 后即停。RELAY_RECEIPT 分流 fail closed：产出型角色只写精确 BLOCKED 后停；monitor 只用 Herdr prompt 非 durable 通知 orchestrator 后停，repo/workspace 零写入、不写 BLOCKED；均不清 RELAY_*。 | AI | E-304：`check.batch-2.md`、`DONE.batch-2.review.md`；`check.batch-3.md` 与 workflow-final/E2 各自独立 signal、review；现役 SKILL/双 adapter 分流合同 | 满足 |
| 8 | 全部适用 `task_type` Recipe path PASS 或可核查 N/A、最终无 open P0/P1；单一 final reviewer 不替代 Recipe。 | AI | 上方五路独立 review/signal；E2 attempt-1 PASS（P0/P1=0） | 满足 |
| 9 | durable signal 与路由不依赖终端状态；orchestrator 只分发/路由，产出型 builder/coder/reviewer/decider 写信号后停止；monitor 只发非 durable Herdr prompt 通知。 | AI | E-304：`check.batch-2.md`、`DONE.batch-2.review.md`；三批、五路及 E2 durable signals 与 `execution_strategy.md`、Herdr 实态交叉核对 | 满足 |
| 10 | 仓内 skill 单源、双 adapter、安装副本一致性与 as-built 覆盖 single-task；`roles.toml` 不为凑改动写死模型。 | AI | E-301、`check.batch-3.md` 安装双副本 10/10 MATCH、`as-built/single-task-实现快照.md`、E2 独立复核；`roles.toml` 零 diff | 满足 |
| 11 | 用户查看含模型分配询问、确认及实际 Herdr tab/model 与快照一致链的真实 Herdr heavy single-task 自举证据，判断该模式是否清楚、可控、值得日常使用。 | 人 | E-303 + `execution_strategy.md`、三批和五路 review/signal、E2 PASS；2026-09-23 对话 E10 证据摘要与确认口后用户答复「认可收口」 | 已认可（整卡人验；非逐条人判） |

## 需求对齐证据

| 需求/人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| 启动前模型分配确认与实际配置一致 | 读取用户 2026-09-22 确认快照，再以 `herdr workspace list`、`tab list --workspace w41`、`agent list`、`pane process-info --pane w41:pN` 逐个核对已启动实例 | E-303；原件 `evidence/batch-3/model-allocation.md`、`evidence/batch-3/herdr/`；后续实态见 `execution_strategy.md`、requirement/E2 review | 已发生实例一致；后续启动实例由独立 reviewer 实测，非 E-303 原采集覆盖 |
| monitor 零写、durable signal 分流与四类恢复依据 | batch-reviewer#b2 独立读取双 adapter、SKILL、signals、`execution_strategy.md` 与前批工件，并实际执行结构/禁改/allowlist/diff 检查 | E-304；原件 `check.batch-2.md`、`DONE.batch-2.review.md` | 局部满足：batch-2 合同及命令核验 PASS；不等于真实 heavy 端到端演示、batch-3/final/E2 PASS，H19 整体待人验 |

> E-303/E-304 由 batch-3 coder 在 `progress.md` Evidence Ledger 登记，仅证明各自原采集范围；final/E2 与用户确认由后续独立工件及 2026-09-23 对话补证。verify 仅以实际提交为准。

## 人类签名区

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| 用户查看含模型分配询问、确认及实际 Herdr tab/model 与快照一致链的真实 Herdr heavy single-task 自举证据，判断该模式是否清楚、可控、值得日常使用。 | E10 时查看模型分配询问与确认来源、w41 一任务一 workspace/逐角色 tab-pane-model 实态及 `execution_strategy.md` 快照、durable signals 与独立 review/decision、仅由 batch coder 登记且不作为运行真相的 progress 证据索引、workflow-final 五路与 E2 两层证据、无 plan/log 审计及完整模式回归；不得以 monitor 通知或 progress 替代 durable 证据 | 用户确认实际链条完整，且判断 single-task 清楚、可控、值得日常使用；缺 workflow-final/E2/E10 任一环或未获用户明确确认均不通过 | [x] 2026-09-23 用户「认可收口」；整卡认可，未逐条签 |

- 确认记录：2026-09-23 用户在 E10 摘要与明确的人验问题后回复「认可收口」；E11 本地收口授权包生效。七条 P2 同日选择「进入验收池（推荐）」；已登记 ACC-2026-09-23-01～07（`dh accept list --all` 可查）。
- verify 提交 SHA：待授权动作实际执行后回填。
- 当前状态：E11 人验已认可，workflow-final 五路与 E2 均 PASS；待版本合入、集成复验、verify 和销户，未预写完成。
