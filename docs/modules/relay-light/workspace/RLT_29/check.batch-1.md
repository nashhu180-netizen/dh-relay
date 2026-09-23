# check.batch-1 — RLT_29 batch-1 独立复核

- 复核者：batch-reviewer#b1（Devin SWE-2 Max，tab w41:t7/p7）；phase=batch-review；batch=1；review_round=1；remediation_count=0。
- 日期：2026-09-22。本文件为 batch-1 reviewer 唯一业务输出之一（另一为 DONE/BLOCKED 单行 signal）。

## 0. RELAY_RECEIPT preflight

- `env | grep -E '^RELAY_'` → 无输出，未命中；走正常复核路径，不写 BLOCKED.preflight。

## 1. scope 与输入

- 基线：`master@93d65cb`；输入 diff = `git diff 93d65cb`（tracked）+ untracked 清单。
- batch-1 允许业务输出（task_plan §3 矩阵/§7）：`AGENTS.md`、`tools/relay-light/skill/SKILL.md`、`evidence/baseline/**`、`evidence/batch-1/**`、`progress.md` 单条 batch-1 里程碑、`DONE.batch-1.coder.md`/`BLOCKED.batch-1.coder.md`。
- 输入工件：brief.md、task_plan.md（含 §0.2/§1.1/§5/§6/§7）、design/01 §7.5 与 §11 A159–A168/H19、decision.batch-1.quotepath.md + DONE.decision.batch-1.quotepath.md、decision.plan-round-3.md、历史 BLOCKED.batch-1.coder.md、baseline/summary 两件、batch-1 evidence 五件、完整 diff。

## 2. diff 归属核查（对应审核项 1）

tracked 改动 4 件 + untracked 2 类，全部落 DevPlan `dh:allowed-paths:v1 task=RLT_29` 闭集（复核自跑 §6 修订命令 `allowed-path audit: PASS`，changed_count=54——含后续新增 workspace 信号/证据，属时点增量）：

| 路径 | mtime | 归属判定 |
|---|---|---|
| AGENTS.md (+6/-0) | 23:33 | batch-1 coder |
| SKILL.md (+45/-0) | 23:34 | batch-1 coder |
| progress.md（单条里程碑行） | 23:36 | batch-1 coder |
| DONE.batch-1.coder.md / BLOCKED.batch-1.coder.md | 23:35 / 21:52 | batch-1 coder signal |
| evidence/baseline/**（含 B-06-rerun、两 summary） | 20:43–23:32 | batch-1 coder（baseline 先行 + 裁决后重跑） |
| evidence/batch-1/** | ~23:3x | batch-1 coder |
| design/01、DevPlan、evidence/13、brief、task_plan、execution_strategy | 21:24–23:28 | plan 阶段 builder#2/decider#1 授权写（decision.plan-round-3 §修改清单 + §3 decider 例外 + decision.batch-1.quotepath §边界）；非 batch-1 coder |

越界核查：`tools/relay-light/relay_log.py`、`docs/modules/relay-light/relay/**`、双 adapter、`roles.toml`、`test_install_skill.py`、`as-built/**` 全部零 diff（复核自跑 `git diff --exit-code 93d65cb -- tools/relay-light/relay_log.py docs/modules/relay-light/relay` exit 0）。无越界。

## 3. 逐项证据

### 项 1 — 实际改动仅本批允许

- AGENTS.md 仅新增 `### single-task 单卡接力段` 一节（+6 行，插于 relay-light 编排协议段尾、worker 铁律段前），full relay 段零改动——满足「不改 full 标头段语义」。
- SKILL.md 仅新增 `## single-task 单卡接力模式` 一节（+45 行，含 6 个子节），完整模式五阶段模板与账本合同零改动。
- progress.md 恰一条里程碑行（batch=1, coder#b1），内容限于施工摘要+证据引用，无 pane/轮询/通知记录。
- DONE/BLOCKED.batch-1.coder.md 均单行新 schema（`task/phase/agent/batch/path/review_round/remediation_count/verdict[/reason]/evidence`），BLOCKED 原文保留未被覆盖。
- **结论：满足，无 adapter/test/as-built/relay_log/roles 越界。**

### 项 2 — model-allocation gate

SKILL「model-allocation gate（启动任何 agent 之前的硬闸）」逐点命中：全角色/实例模型+推理档提案表→明确询问确认；**未获明确确认不得启动任何 agent**；用户可逐角色修改；确认来源/分配/实际 Herdr tab/pane 由 orchestrator 机械写入 `execution_strategy.md`；恢复沿用未变确认快照；新增/换角色或实例、换模型/推理档必须重问；超时/静默/最大工具权限不推定确认；默认仅提案不写死；最大权限不扩张 commit/push/PR/merge/deploy/verify/人验授权。与 design §7.5.1、task_plan §0.2、execution_strategy.md 写入合同一致；A160 要求的全部正反例要素在文案中可定位。**满足。**

### 项 3 — monitor 零写入/不路由/不派活；receipt 分流

- SKILL「durable signal 与写者边界」+「monitor 节拍与安全 Enter」：monitor 对 repo/workspace 完全只读，不写 signal/progress/execution_strategy/轮询日志/通知日志/任何文档，不路由、不分派、不启动 agent。
- RELAY_RECEIPT 分流（SKILL 标头节 + AGENTS single-task 段）：产出型 builder/coder/reviewer/decider 命中只写本角色精确 `BLOCKED.*.md` 单行后停；monitor 命中保持 repo/workspace 零写入、只 Herdr prompt 非 durable 通知 orchestrator 后停、不写 BLOCKED；两分支均不清 `RELAY_*`。
- durable 状态只来自产出型角色自写工件（SKILL「恢复依据」、design §7.5.3 同口径）。**满足。**

### 项 4 — Devin busy/queued 的安全 Enter 与投递口径

SKILL「安全 Enter」三条件同时成立才发一次并复验：①本次派单文本仍停在输入框（**明文含 Devin queued 指令仍排队未发出**）②`state_change_seq` 未推进 ③非审批/确认 UI；任一不满足即不按；一次仍失败通知 orchestrator 并换 fresh、禁止连按。「prompt 已发但文本仍排队」正是条件①的检测面，发送后复验兜底投递；既有 SKILL §派活纪律「未确认投递不得当作已通知」（line 36）未被本 diff 削弱，monitor 通知按 A167 本就是非 durable、真相在 durable signal。**满足。**

### 项 5 — progress / execution_strategy 写者

- `progress.md` 仅当前 batch coder 追加一条里程碑（实际文件恰一行、batch-1、coder#b1，简洁、纯证据引用）。
- `execution_strategy.md` 仅 orchestrator 机械维护（SKILL 写者边界 + 文件头写入合同一致；mtime 21:24 属 plan 阶段授权写，coder 未触碰）。
- reviewer/monitor/orchestrator 不写 progress 的禁令在 SKILL 与 progress 头双落。**满足。**

### 项 6 — batch PASS 后会话清理闸

SKILL「batch PASS 后会话清理闸」逐点命中：仅当本批 reviewer durable PASS **且**工件齐全（交付物/验证证据/coder signal/review 产物/reviewer durable PASS）后，orchestrator 对本批 coder 与 batch reviewer **各一次** `/clear` 并分别复验，再启动下一批；终端 idle/done 或 coder DONE 不替代此门；FAIL/整改禁止 clear、保留原 session 不清零计数；清理失败/无法复验不得启动下一批、不盲目重发；monitor 常驻不 clear、decider 按需。与 task_plan §1.1、decision.batch-1.quotepath 追加裁决一致；当前 batch-1 未 PASS，无 clear 发生，正确。**满足。**

### 项 7 — full relay 零回归与合同边界齐全

- 零回归：AGENTS/SKILL 两 diff 均为纯插入段，full 标头段、worker 铁律、五阶段模板、账本合同、派活纪律原有字节未动（diff 删除行全为 design/DevPlan 头部事件滚动与计数行，见 §2 归属）。
- 互斥与标头：AGENTS/SKILL 首行样式 `[relay-light:single-task] worker · phase=… · agent=<role>#<instance> · batch=<n|na> · round=<n> · workspace=…` 一致，与 `[relay-light] worker · node=…` 双向互斥；phase 闭集 9 值与 batch=1|2|3|na 在 SKILL 明列。
- 计数：review_round/remediation_count 分离、plan/batch 各最多整改 2 轮回同 builder/coder+原 reviewer、超限交 decider、六类方向问题交用户——SKILL「生命周期与计数」与 task_plan §2 一致。
- 两证据层：workflow-final 每轮换 fresh reviewer vs E2 `code_review` open P0/P1 后同一 `reviewer_session_id` targeted attempt 2；条件相斥不得合并；heavy 五路（code-round1/code-round2/requirement/consistency/lesson）一条不少、单一 reviewer/batch PASS/E2 receipt 不替代 Recipe；施工者不复核自己。**满足。**
- 历史例外完好：`DONE.plan-review.round-2.md` SHA-256 实测 `9f6cf3a3b0d73f2060f2483d0d79342862cf0302b9bc687b57cf8dd7921ed62f`，与冻结值逐字一致；round-3 起新 schema（round-3 文件含 batch=na path=na）。

### 项 8 — baseline/rerun 真实、summary 不伪绿、复核自跑验证

- baseline 证据真实且诚实：B-01 exit 0（7 tests OK）、B-02 exit 0（228 tests OK）、B-03 exit 0（RELAY ALL PASS, SKIPPED:1）；B-04 exit 1 如实记录 66 failures = 59 inherited + 7 RLT_29-owned，分类 `expected-nonzero`，未伪装绿；B-05 PASS；B-06 原 FAIL（quotepath 转义误报三条 allowlist 内中文路径）原样保留于 B-06.txt + summary 原条目，diagnostic 与 rerun 链完整。
- 裁决链成立：BLOCKED(reason=allowed_path_audit_quotepath_env) → decider#1 RESOLVED（§6 两 git 调用加 `-c core.quotepath=false`，不放宽 allowlist、不豁免真实越界）→ coder 21:52 BLOCKED 后按裁决于 23:32 用修订命令 verbatim 重跑 → `B-06-rerun-quotepath.txt` PASS + `summary-rerun-quotepath.json` 引用原记录与 decision_ref，随后才改 AGENTS(23:33)/SKILL(23:34)/DONE(23:35)/progress(23:36)，次序符合裁决「重跑通过才恢复施工」。
- 复核自跑（本 reviewer 独立重跑，非引用 coder 证据）：

| 命令（cwd=仓根） | exit |
|---|---:|
| `PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=tools/relay-light python3 -m unittest tools/relay-light/test_install_skill.py` | 0（7 tests, OK） |
| plan/log 审计（§7 Python 块） | 0（`plan/log audit: PASS`） |
| `git diff --exit-code 93d65cb -- tools/relay-light/relay_log.py docs/modules/relay-light/relay` | 0 |
| `git diff --check` | 0（无输出） |
| §6 allowed-path audit（修订命令 verbatim，`-c core.quotepath=false`） | 0（`allowed-path audit: PASS`，changed_count=54） |
| `env \| grep -E '^RELAY_'` | 空（preflight 未命中） |

**满足。**

## 4. findings

- P0：无。
- P1：无。
- P2-1（非阻断，归 plan/decider 层，不挡 batch-1）：design/01 §7.5.5 标头示例枚举 `phase=<plan|batch|final|decision|monitor>`（5 值，源自 evidence/13 §二.8 原始确认合同），而运行期权威闭集为 9 值（task_plan §1、SKILL single-task 节：plan/plan-review/batch/batch-review/workflow-final/e2-code-review/decision/monitor/human-acceptance）；本棒派单 `phase=batch-review` 即不在 design 字面值内。建议后续由 decider/orchestrator 把 design 该处改为泛指或同步 9 值闭集，避免 batch-3 结构测试误以 5 值为 oracle。design/01 非 batch-1 coder 写者范围，故不记入本批整改。
- P2-2（证据硬度建议）：`evidence/batch-1/` 仅 install 有 `.exit`；plan-log/allowed-path 两脚本以 PASS 行文可推 exit 0，但 forbidden-diff/diff-check 的空文件不独立证明 exit 0（已由本 reviewer 自跑确认 exit 0 补齐事实）。建议 batch-2/3 按「每条 stdout/stderr 与 exit 写本批 evidence」为每条命令落 exit。
- P2-3（观察，已裁决历史）：user-adjust 轮次信号使用 `review_round=user-adjust[-N]` 非纯数字取值，与 §4 `review_round=<n>` 字面有出入；属 plan 阶段已审结的既有事实（monitor-contract round-3 已 PASS），非本批引入，仅登记备查。

## 5. 结论

P0=0、P1=0 → **PASS**。batch-1 差异（AGENTS single-task 分流段 + SKILL single-task 节 + baseline/batch-1 证据 + 单条 progress 里程碑 + coder signal）满足 task_plan §7 全部要求，B-06 quotepath 裁决链闭环，无越界、无伪绿、full relay 零回归。
