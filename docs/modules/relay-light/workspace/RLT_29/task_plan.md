<!-- dh:v1 · task_plan.md -->
# task_plan — RLT_29 single-task（user-adjust：monitor repo-read-only）

## 0. Zero-context 执行入口

固定仓根：`/home/nash/work/dh-relay/.dh-worktrees/RLT_29`。每个 single-task 角色的**第一条业务前动作**都是按 §0.1 执行 `RELAY_RECEIPT` preflight；产出型角色与 monitor 的命中动作不同。所有普通命令块首行必须是：

```bash
cd /home/nash/work/dh-relay/.dh-worktrees/RLT_29
```

worker 默认只读本文件、`brief.md`、DevPlan `RLT_29` 卡、design/01 §7.5/A159～A168/H19、evidence/13 与矩阵列出的输入。所有路径均为 repo-root 相对路径。Python 命令统一显式设置 `PYTHONPATH=tools/relay-light`，理由是保持 cwd 在仓根，同时让 `relay_log` / `install_skill` 等仓内模块可导入；不得用 `cd tools/relay-light` 改变后续 PowerShell 路径语义。

### 0.1 RELAY_RECEIPT fail-closed preflight

产出型 builder/coder/reviewer/decider 每次派单都须把本角色精确 `BLOCKED.*.md` 文件名代入 `<blocked-signal>`，然后先执行：

```bash
cd /home/nash/work/dh-relay/.dh-worktrees/RLT_29
if [[ -n "${RELAY_RECEIPT:-}" ]]; then
  printf '%s\n' 'BLOCKED task=RLT_29 phase=<phase> agent=<role>#<instance> batch=<n|na> path=<path|na> review_round=<n> remediation_count=<0|1|2> verdict=BLOCKED reason=relay_receipt_present evidence=<blocked-signal>' > 'docs/modules/relay-light/workspace/RLT_29/<blocked-signal>'
  exit 0
fi
```

产出型角色命中时除该允许的 BLOCKED signal 外**零业务写入**，不得读取/写入 full relay plan/log，不得清除任何 `RELAY_*` 环境变量，写信号后立即停止。未命中才读取业务输入和执行后续命令。

monitor 的 preflight 不代入 `<blocked-signal>`。若 monitor 环境存在 `RELAY_RECEIPT`，必须保持 repo/workspace diff 为空，只用 Herdr prompt 向 orchestrator 发送非 durable 通知后立即停止；不得写 `BLOCKED`、其它 signal 或任何 repo/workspace 文档，不得清除任何 `RELAY_*` 环境变量。未命中才进入 monitor 的 Herdr wait/get/read 循环。

### 0.2 model-allocation gate（orchestrator 启动责任）

single-task 启动前，orchestrator 必须展示全部拟启动角色/实例的模型与推理档表并明确询问用户确认；用户可逐角色修改，未确认不得启动任何 agent。推荐默认仅是提案，模型不写死。确认后先将确认来源、角色/实例、模型、推理档写入 `execution_strategy.md`；启动后补齐实际 Herdr workspace/tab/pane 与观察来源并逐项比对。恢复时可沿用已有明确确认且分配未变的快照；新增/更换角色或实例、换模型或推理档必须再次询问确认，不能由超时或最大工具权限推定确认。

启动及任何角色/实例更换时，由 orchestrator 机械维护用户已确认的分配、确认来源与实际 Herdr 启动配置（未启动的 tab/pane 标 pending）。monitor 对 `execution_strategy.md` 和全部 repo/workspace 只读。当前主会话负责询问，不为询问另启 agent。

## 1. 固定边界

- single-task 运行 phase 闭集：`plan`、`plan-review`、`batch`、`batch-review`、`workflow-final`、`e2-code-review`、`decision`、`monitor`、`human-acceptance`；`batch=1|2|3|na`。完整 relay 的五阶段词只允许出现在“被回归测试的既有合同”语境，不得作为本模式路由 phase 或文件名。
- 允许路径以 DevPlan `dh:allowed-paths:v1 task=RLT_29` 为唯一闭集；`tools/relay-light/relay_log.py`、`docs/modules/relay-light/relay/**`、dev-harness 与 full relay plan/log 禁改。
- `roles.toml` 计划为零改动：逐角色选择保存在 `execution_strategy.md`，由 orchestrator 在启动/更换角色时机械维护。若实证发现机制不足，产出型 builder/coder/reviewer/decider 写自己的 BLOCKED signal 交 orchestrator 路由，不为凑改动修改。
- monitor 对 repo/workspace 完全只读：只在 Herdr wait/get/read，状态变化即时 prompt orchestrator，通知不是 durable artifact；不写 progress/execution_strategy/DONE/BLOCKED/轮询日志/通知日志或任何 workspace 文档。
- `progress.md` 仅是施工进展与验证证据索引；当前顺序执行的 batch coder 在自己 batch 追加一条简洁里程碑/证据引用。不记 pane/agent 状态、轮询、通知或终端输出；reviewer/monitor/orchestrator 不写。`decision.batch-3-b04-evidence-id.md` 仅授权原 coder#b3 在保留既有里程碑原字节的前提下追加一次 Evidence Ledger 附录，登记既有证据索引；该附录仍不是运行真相，也不扩张任何其他角色或后续 batch 的写权。
- 恢复权威为实际 worker/reviewer/decider 自写 durable signals、独立 review/decision、`execution_strategy.md` 配置与 Herdr 实态；`progress.md` 不是运行真相。
- 旧 `DONE.plan-review.post-decision.md` PASS 已被本 user-adjust 规划变更取代，本调整独立 plan-review PASS 前不放行施工。
- batch review 与 workflow-final 是独立闸；batch-3 只交付 batch-3 coder 产物，不等待、不写 workflow-final/E2 产物。

### 1.1 batch PASS 后的会话清理闸（用户追加规则）

每个 batch 仅在该批 batch reviewer 的 durable signal 为 PASS 且本批工件齐全后，由 orchestrator 对该批 coder 与 batch reviewer 各执行一次 `/clear`，并分别复验已清理，之后才可启动下一批。工件齐全包括本批交付物、验证证据、coder signal、review 产物与 reviewer durable PASS；终端 idle/done 或 coder DONE 不替代此门。FAIL/整改期间禁止 `/clear`，保持原 coder/原 reviewer session，不借清理清零整改计数。monitor 常驻、不 clear；decider 按需，不纳入每批固定 clear。清理失败或无法复验时不得启动下一批，也不盲目重复发送 `/clear`。batch-3 同样先完成本批 PASS/工件齐全/双方 clear 复验，再进入后续 workflow-final；清理不改变 durable 工件或复核结论。

本次追加时 batch-1 尚未 PASS，不得现在 clear。该规则由 batch-1 coder 纳入 SKILL，实际清理只由 orchestrator 在门槛满足后执行；本 decider 仅修订合同。

## 2. review_round 与 remediation_count

| 流程 | 初审 | 第一次整改复审 | 第二次整改复审 | 超限谓词与接收者 |
|---|---|---|---|---|
| plan review | `review_round=1 remediation_count=0` | 同 builder 整改；原 reviewer：`review_round=2 remediation_count=1` | 同 builder 整改；原 reviewer：`review_round=3 remediation_count=2` | 在 `remediation_count=2` 的复审仍 FAIL 时，不得再整改；交 decider。不得产生 `remediation_count>2` 的业务写入。 |
| 每批 batch review | 同 batch coder + 原 reviewer，计数同上 | 同 coder + 原 reviewer | 同 coder + 原 reviewer | 同上；交 decider。 |
| workflow-final 每 path | fresh 初审：`review_round=1 remediation_count=0` | 同 coder 整改；**fresh reviewer**：`review_round=2 remediation_count=1` | 同 coder 整改；再次 **fresh reviewer**：`review_round=3 remediation_count=2` | 第二次整改复审仍 FAIL 则交 decider；六类方向问题交用户。 |
| E2 code_review | full fresh：attempt 1，`review_round=1 remediation_count=0` | 仅 open P0/P1 后，同一 `reviewer_session_id` targeted attempt 2，`review_round=2 remediation_count=1` | 不存在 | attempt 2 仍不收敛即按 dev-harness 停止，不派第三次。 |

workflow-final 与 E2 是两个证据层：分别记录 identity/session、输入 diff、finding、结论；fresh 与 same-session 条件相斥时不得合并。heavy 五路固定为 `code-round1`、`code-round2`、`requirement`、`consistency`、`lesson`；施工者不得复核自己的施工。

## 3. phase / batch / path sole-writer 矩阵

| phase / batch / path | sole writer | 只读输入 | 唯一业务输出 | 下一接收者 |
|---|---|---|---|---|
| plan remediation 1 | builder#1 | review.plan.md、历史输入 `DONE.plan-review.md`、现有规划工件 | brief.md、task_plan.md、execution_strategy.md、review.md 的合同修订；`DONE.builder.plan-remediation-1.md` | 原 `plan-reviewer#1` targeted recheck round 2 |
| plan-review round 2 / remediation 1 | 原 plan-reviewer#1 | 上述规划工件、`DONE.builder.plan-remediation-1.md`、round-1 历史输入 | review.plan.md 追加 targeted 结论；新建不可覆盖的 `DONE.plan-review.round-2.md` 或 `BLOCKED.plan-review.round-2.md` | orchestrator 读取后：PASS→下一步；FAIL 且 count<2→同 builder；否则 decider |
| plan remediation 2 | 原 builder#1 | review.plan.md round-2 targeted 结论、`DONE.plan-review.round-2.md`、现有规划工件 | 仅修残余 finding；`DONE.builder.plan-remediation-2.md` 或对应 BLOCKED | 原 `plan-reviewer#1` targeted recheck round 3 |
| plan-review round 3 / remediation 2 | 原 plan-reviewer#1 | 上述规划工件、`DONE.builder.plan-remediation-2.md`、全部历史 signals | review.plan.md 追加 targeted 结论；新建不可覆盖的 `DONE.plan-review.round-3.md` 或 `BLOCKED.plan-review.round-3.md` | orchestrator 读取后：PASS→下一步；FAIL→decider，不得再整改 |
| batch-3 B-04 evidence-ledger 前置 attempt 1 | 原 coder#b3 / r29-b3-coder | 两份 B-04 decision、E-301…E-304 原件、`progress.md` | 仅在 progress 末尾追加唯一 Evidence Ledger；`DONE.batch-3.coder.evidence-ledger.attempt-1.md` 或对应 BLOCKED | orchestrator 读取 READY 后恢复原 builder#2 attempt 2；不触发 batch review/clear |
| batch-3 B-04 合同修订 attempt 2 | 原 builder#2 / r29-builder | 两份 B-04 decision、ledger READY、progress 与 E-301…E-304 原件 | 仅 `review.md` 指定段与 `task_plan.md` 指定段；`DONE.builder.batch-3-b04-contract.attempt-2.md` 或对应 BLOCKED | 原 plan-reviewer#2 targeted 核验 |
| batch-3 B-04 targeted plan-review | 原 plan-reviewer#2 / r29-plan-reviewer | builder attempt-2 signal、两份 decision、ledger、原件及两件修订 | `review.plan.batch-3-b04.md`；`DONE.plan-review.batch-3-b04.md` 或对应 BLOCKED | orchestrator 读取：PASS→恢复原 coder#b3；FAIL→decider |
| batch-3 B-04 rerun 1 | 原 coder#b3 / r29-b3-coder | targeted durable PASS、baseline/post 原件、两份 decision、修订合同 | `evidence/batch-3/post-b04-rerun-1/**`；`DONE.batch-3.coder.b04-rerun-1.md` 或对应 BLOCKED；不改 review/task_plan | 原 batch-3 reviewer（仅全部批内门满足时） |
| batch 1 | batch-1 coder | AGENTS、skill、brief/task_plan、baseline | AGENTS.md、SKILL.md、coder signal、`evidence/baseline/**`、progress 中的 batch-1 施工里程碑 | batch-1 reviewer |
| batch-review 1 | 原 batch-1 reviewer | batch-1 diff、baseline、brief/task_plan | `check.batch-1.md`、review signal | orchestrator 读取后：PASS 且工件齐全→按 §1.1 双方 clear 并复验→batch-2 coder；FAIL→同 batch-1 coder |
| batch 2 | batch-2 coder | batch-1 PASS、双 adapter、execution 配置 | 两份 adapter、coder signal、progress 中的 batch-2 施工里程碑 | batch-2 reviewer |
| batch-review 2 | 原 batch-2 reviewer | batch-2 diff、brief/task_plan | `check.batch-2.md`、review signal | orchestrator 读取后：PASS 且工件齐全→按 §1.1 双方 clear 并复验→batch-3 coder；FAIL→同 batch-2 coder |
| batch 3 | batch-3 coder | batch-1/2 PASS、测试、安装器、as-built 现状 | test_install_skill.py、`evidence/batch-3/**`、single-task as-built、coder signal、progress 中的 batch-3 施工里程碑 | batch-3 reviewer |
| batch-review 3 | 原 batch-3 reviewer | batch-3 diff、三批证据、baseline/post 比较 | `check.batch-3.md`、review signal | orchestrator 读取后：PASS 且工件齐全→按 §1.1 双方 clear 并复验→workflow-final fan-out；FAIL→同 batch-3 coder |
| workflow-final / code-round1 | 本轮 fresh reviewer，非施工者 | 完整任务 diff、brief/task_plan、三批 checks | `review.workflow-final.code-round1.review-round-<n>.md` + path signal | orchestrator 读取后：PASS→汇总；FAIL→coder；超限→decider |
| workflow-final / code-round2 | 本轮 fresh reviewer，非施工者且独立于上一轮 | 同上 + code-round1 | `review.workflow-final.code-round2.review-round-<n>.md` + path signal | 同上 |
| workflow-final / requirement | 本轮 fresh reviewer，非施工者 | 正式验收、需求境证据、完整 diff | `review.workflow-final.requirement.review-round-<n>.md` + path signal | 同上 |
| workflow-final / consistency | 本轮 fresh reviewer，非施工者 | 本次改动与兄弟定义 | `review.workflow-final.consistency.review-round-<n>.md` + path signal | 同上 |
| workflow-final / lesson | 本轮 fresh reviewer，非施工者 | 教训库、lesson_candidates、完整 diff | `review.workflow-final.lesson.review-round-<n>.md` + path signal | 同上；空库只可形成可核 N/A |
| E2 code_review attempt 1 | fresh E2 reviewer，非施工者 | workflow-final 五路闭合、完整 diff | review.md E2 attempt-1 区 + `DONE.e2-code-review.attempt-1.md` | orchestrator 读取后：PASS→人验备料；open P0/P1→同 reviewer targeted |
| E2 targeted attempt 2 | attempt 1 同 `reviewer_session_id` | 原 findings、repair diff、完整受影响面 | review.md E2 attempt-2 区 + `DONE.e2-code-review.attempt-2.md` | orchestrator 读取后：PASS→人验备料；否则 decider/用户闸 |
| monitor | monitor 当前实例 | Herdr 实态与 repo 内 durable 工件（均只读） | 无 repo/workspace 输出；仅 Herdr prompt 通知 orchestrator | orchestrator |
| decision | decider | BLOCKED signal、相关输入/证据 | `decision.<n>.md` + `DONE.decision-<n>.md` | orchestrator 读取后：可继续→指定角色；六类方向问题→用户 |

本次用户显式授权的 decision 例外：decider#1 仅可写 design/01、evidence/13、DevPlan 的 RLT_29 段，以及 brief/task_plan/execution_strategy、decision.plan-round-3.md、DONE.decision.plan.md；不写 review.plan、历史 DONE、progress 或代码。完成交原 plan-reviewer 核验；remediation_count 保持 2，既不派第三次 builder 整改，也不把 decision RESOLVED 当 plan PASS。

任何 reviewer 只写自己这一行的 review 与 signal；monitor/orchestrator 不代写 reviewer 结论。coder 不写 `check.*`、workflow-final 或 E2；只有当前 batch coder 可在 progress 追加自己 batch 的一条施工里程碑/证据引用。

## 4. durable signal 合同

每个 signal 文件**只有一行**；值中不得含空白，多个证据路径用逗号分隔；常规新信号使用 repo-root 相对路径。本次用户精确指定的 decision signal 以 workspace 相对 `decision.plan-round-3.md` 为 evidence，orchestrator 固定从本工作区解析，不搜索其它目录；历史 plan-review 的 `review.plan.md` 同理。

```text
DONE task=RLT_29 phase=<phase> agent=<role>#<instance> batch=<1|2|3|na> path=<path|na> review_round=<n> remediation_count=<0|1|2> verdict=<READY|PASS|FAIL|RESOLVED> evidence=<path[,path...]>
BLOCKED task=RLT_29 phase=<phase> agent=<role>#<instance> batch=<1|2|3|na> path=<path|na> review_round=<n> remediation_count=<0|1|2> verdict=BLOCKED reason=<snake_case_token> evidence=<path[,path...]>
```

| 角色/时点 | DONE 文件名 | BLOCKED 文件名 | sole writer | 接收者 |
|---|---|---|---|---|
| plan builder 初稿 | `DONE.builder.md`（round-1 历史初稿保留，不覆盖） | `BLOCKED.builder.md` | builder | plan-reviewer |
| plan builder 整改 1 | `DONE.builder.plan-remediation-1.md` | `BLOCKED.builder.plan-remediation-1.md` | 原 builder#1 | 原 plan-reviewer#1 round 2 |
| plan builder 整改 2 | `DONE.builder.plan-remediation-2.md` | `BLOCKED.builder.plan-remediation-2.md` | 原 builder#1 | 原 plan-reviewer#1 round 3 |
| plan review 每轮 | `DONE.plan-review.round-<review_round>.md` | `BLOCKED.plan-review.round-<review_round>.md` | 原 plan-reviewer#1 | orchestrator 读取后按 remediation_count 分路 |
| batch-3 evidence ledger attempt 1 | `DONE.batch-3.coder.evidence-ledger.attempt-1.md` | `BLOCKED.batch-3.coder.evidence-ledger.attempt-1.md` | 原 coder#b3 | orchestrator 仅在 READY 后恢复原 builder#2 attempt 2 |
| batch-3 B-04 builder attempt 2 | `DONE.builder.batch-3-b04-contract.attempt-2.md` | `BLOCKED.builder.batch-3-b04-contract.attempt-2.md` | 原 builder#2 | 原 plan-reviewer#2 targeted 核验 |
| batch-3 B-04 targeted plan-review | `DONE.plan-review.batch-3-b04.md` | `BLOCKED.plan-review.batch-3-b04.md` | 原 plan-reviewer#2 | orchestrator：PASS→原 coder#b3 rerun；FAIL→decider |
| batch-3 B-04 rerun 1 | `DONE.batch-3.coder.b04-rerun-1.md` | `BLOCKED.batch-3.coder.b04-rerun-1.md` | 原 coder#b3 | 原 batch-3 reviewer；不得由 targeted PASS 替代 batch review |
| batch n coder | `DONE.batch-<n>.coder.md` | `BLOCKED.batch-<n>.coder.md` | 该 batch coder | 原 batch reviewer |
| batch n review | `DONE.batch-<n>.review.md` | `BLOCKED.batch-<n>.review.md` | 原 batch reviewer | orchestrator 读取后路由 coder/decider/下一批 |
| workflow-final path | `DONE.workflow-final.<path>.review-round-<n>.md` | `BLOCKED.workflow-final.<path>.review-round-<n>.md` | 本轮 fresh path reviewer | orchestrator 读取后路由 coder/decider/汇总 |
| E2 attempt n | `DONE.e2-code-review.attempt-<n>.md` | `BLOCKED.e2-code-review.attempt-<n>.md` | E2 reviewer | orchestrator 读取后路由 decider/人验备料 |
| 本次 plan round-3 超限裁决 | `DONE.decision.plan.md` | `BLOCKED.decision.plan.md` | decider#1 | orchestrator 转原 plan-reviewer 验点；不是 plan PASS |
| decision n | `DONE.decision-<n>.md` | `BLOCKED.decision-<n>.md` | decider | orchestrator/用户 |

`DONE.plan-review.md` 继续仅作 round-1 旧 schema 历史输入。唯一新增兼容例外是 RLT_29 的 `DONE.plan-review.round-2.md`：它在新 schema 冻结前已产生，保留原字节，既不补字段也不伪装为新 schema 合格样本。orchestrator 仅当精确文件名及旧字段 `task=RLT_29 phase=plan-review agent=plan-reviewer#1 review_round=2 remediation_count=1 verdict=FAIL p0=0 p1=1 evidence=review.plan.md` 全部匹配，且 SHA-256 为 `9f6cf3a3b0d73f2060f2483d0d79342862cf0302b9bc687b57cf8dd7921ed62f` 时，将其识别为该次历史 FAIL；由 plan-review 语境只在读取解释层得到 batch/path 不适用，不回写文件、不改变 FAIL 或整改计数。文件名提供轮次定位，旧字段提供任务、角色、轮次、结论与证据定位，二者交叉核对足以唯一识别；不匹配即阻断。自 round 3 及未来所有 DONE/BLOCKED signal 强制新 schema（包括 `batch/path`，plan-review 为 `batch=na path=na`）；不存在面向未来的缺字段兼容。每轮 plan-review 新建带轮号且不可覆盖的文件，产出型 reviewer 写完 signal 即停。

## 5. 施工前 baseline 与施工后比较门

### 5.1 baseline 分类表（batch-1 首次业务写入前）

batch-1 coder sole-write `docs/modules/relay-light/workspace/RLT_29/evidence/baseline/`：

| 命令 ID | cwd | 命令 | expected baseline exit | 保存内容 |
|---|---|---|---:|---|
| B-01 | repo root | install unittest | 0 | stdout/stderr、exit、测试数 |
| B-02 | repo root | relay-light Python discover | 0 | stdout/stderr、exit、测试数 |
| B-03 | repo root | PowerShell repo runner | 0 | stdout/stderr、exit、suite 摘要 |
| B-04 | repo root | `dh relay-light` | 当前允许非零，但须精确记录 | stdout/stderr、exit、稳定 failure IDs/摘要；分成 inherited noise 与 `RLT_29` task-owned failures |
| B-05 | repo root | plan/log + forbidden-path audit | 0 | 禁止对象为空、禁改路径 diff 为空 |
| B-06 | repo root | allowed-path audit | 0 | 实际变化全部落在 DevPlan allowlist |

`baseline/summary.json` 最小字段：`command_id`、`cwd`、`command`、`exit`、`failure_ids`、`classification`、`captured_at`。inherited noise 闭集只认当次 baseline 中**不属于 RLT_29**且有稳定 ID/完整摘要的项；不能用“存量”散文兜底。

### 5.2 可复制 baseline 命令

```bash
cd /home/nash/work/dh-relay/.dh-worktrees/RLT_29
mkdir -p docs/modules/relay-light/workspace/RLT_29/evidence/baseline
PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=tools/relay-light python3 -m unittest tools/relay-light/test_install_skill.py > docs/modules/relay-light/workspace/RLT_29/evidence/baseline/B-01.txt 2>&1
PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=tools/relay-light python3 -m unittest discover -s tools/relay-light -p 'test*.py' > docs/modules/relay-light/workspace/RLT_29/evidence/baseline/B-02.txt 2>&1
PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=tools/relay-light pwsh -NoProfile -File tools/tests/run-relay-tests.ps1 > docs/modules/relay-light/workspace/RLT_29/evidence/baseline/B-03.txt 2>&1
dh relay-light > docs/modules/relay-light/workspace/RLT_29/evidence/baseline/B-04.txt 2>&1; printf '%s\n' "$?" > docs/modules/relay-light/workspace/RLT_29/evidence/baseline/B-04.exit
python3 - <<'PY'
from pathlib import Path
root=Path('docs/modules/relay-light/workspace/RLT_29')
bad=[str(p) for p in root.rglob('*') if p.name in {'relay_plan.md','relay_log.jsonl'}]
if bad: raise SystemExit('forbidden single-task plan/log: '+','.join(bad))
PY
git diff --exit-code 93d65cb -- tools/relay-light/relay_log.py docs/modules/relay-light/relay
git diff --check
```

逐命令期望：B-01/B-02/B-03 exit 0 且输出含 `OK`/`PASS`；B-04 的命令实际 exit 与 failure IDs 写入 summary，不要求假绿；plan/log 扫描、禁改路径 diff、`git diff --check` 均 exit 0。每个真实 exit 必须另写 summary，不能因重定向或后续命令覆盖。

### 5.3 post 比较门（batch-3 结束前）

batch-3 用**相同 cwd、环境、命令和参数**重跑 B-01～B-06。原 `evidence/batch-3/post/` 与 comparison 保留；本次 targeted PASS 后的重跑写 `evidence/batch-3/post-b04-rerun-1/`。B-01/B-02/B-03 均须 exit 0 且无新增失败；plan/log 扫描为空，`relay_log.py` 与 `docs/modules/relay-light/relay/**` diff 为空；allowed-path audit 与 `git diff --check` 均 exit 0；任一 open P0/P1 阻断。B-04 必须执行下列版本固定为 `rlt29-b04-r30-paths-v1` 的 Counter/多重集 oracle：

1. 从 B-04 原始输出的 `❌ 失败 N:` 区提取全部失败行，只去格式缩进与行终止符，不 trim/替换正文，不混入警告；解析条数必须等于 N 及原输出合计，重复项按次数保留，无法解析、缺行或重复丢失即阻断。baseline Counter 必须同时与 `evidence/baseline/summary.json` 的 59 inherited + 7 RLT_29-owned 一致。
2. 先按诊断 subject/task 划分 owned：subject 为 `workspace/RLT_29` 或其子路径，或正文明确 `task=RLT_29`，均为 owned；subject/task 不清或矛盾即阻断，baseline 未知的新失败不得默认 inherited。post 中任何 RLT_29-owned（含新 rule，不限原 7 条）必须为 0，绝不归一化或转为 inherited。
3. 唯一可归一化的 inherited 行必须逐字匹配前缀 P 与后缀 S，且两者之间只允许路径清单 L；baseline 与 post 均须恰好一条。P/S、rule、subject、task、`light`、停止结论或条数任一变化均阻断：

```text
P = workspace/RLT_27　R30 任务「RLT_27」类型=light 的实际改动超出任务卡登记的允许路径：
S = ——**停下，由用户重新定类**（非自动升级、非自动放行）；若属登记遗漏，先补进任务卡「变更范围」再继续
```

4. 以中文顿号 `、` 分割 L；结果必须非空、无重复且每项为精确 repo 相对路径，不做 substring 删除、路径解码猜测或吞未知字段。baseline L 必须逐字等于 `docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md`。post L 必须非空且为闭集 D 的子集：

```text
AGENTS.md
docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md
tools/relay-light/skill/SKILL.md
tools/relay-light/skill/references/adapter-claude-code.md
tools/relay-light/skill/references/adapter-codex.md
tools/relay-light/test_install_skill.py
```

   D 只是该诊断允许归一化的动态字段闭集，不扩大 §6 allowlist。每个 post L 路径还必须同时出现在 B-04 前后均用 `git -c core.quotepath=false diff --name-only 93d65cb --` 捕获且完全相同的 tracked diff 名单中，并通过 §6 allowed-path 与任务归属核对；前后名单不同则重新采集，未知路径一律阻断。baseline 单路径只按原始 baseline 证据核验，不拿当前 diff 代替。
5. 仅在全部守卫通过后，把这一条的 L 替换为固定字面量 `<RLT29_APPROVED_DYNAMIC_PATHS>`，canonical=`P + marker + S`；comparison 必须保存 baseline/post raw 正文、raw diff、L、归一化理由、版本与 `decision.batch-3-b04.md` 引用。其余 inherited 失败正文逐字不变。
6. 用 canonical inherited Counter 比较，必须与 baseline 完全相等且基线计数为 59；新增/缺失 rule、task、failure，重复次数变化或其它正文变化均阻断。新的/残留的 owned failure 必须为 0，不能用总数抵消。旧 66 不是 post 硬要求；7 条 owned 修复且 inherited 不变时预计 post 为 59。`dh` exit=1 可由 59 条 inherited 解释，但 exit 本身不是 PASS；异常退出、截断或未分类失败均阻断。

以上 oracle 与 B-01/B-02/B-03、真实 scope 审计、forbidden diff、open P0/P1、allowed-path、plan/log、diff-check 同时成立才可写 coder READY；不得修改 dev-harness、旧卡、DevPlan 或 design 来消除失败。

## 6. allowed-path audit

三批均运行下列脚本；expected exit=0、stdout=`allowed-path audit: PASS`，证据写入本批 evidence。脚本同时检查 tracked diff 与 untracked 文件：

两个 Git 调用均显式使用 `-c core.quotepath=false`，使中文路径比较不依赖机器全局配置；不写 Git 配置、不扩大 allowlist、不豁免真实越界。baseline 与所有批次统一复用本节命令。原 B-06 FAIL、diagnostic 与原 summary 保留历史；batch-1 coder 恢复后用本节新命令重跑，另写新证据与新 summary（引用旧记录及本次裁决），后续 post 比较使用该次同命令重跑结果，不能把历史 FAIL 改成 PASS。

```bash
cd /home/nash/work/dh-relay/.dh-worktrees/RLT_29
python3 - <<'PY'
from pathlib import Path
import subprocess
allowed_exact={
 'AGENTS.md',
 'docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md',
 'docs/modules/relay-light/design/evidence/13-交叉审核记录-single-task模式.md',
 'docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md',
 'tools/relay-light/skill/SKILL.md',
 'tools/relay-light/skill/references/adapter-claude-code.md',
 'tools/relay-light/skill/references/adapter-codex.md',
 'tools/relay-light/skill/roles.toml',
 'tools/relay-light/test_install_skill.py',
}
allowed_prefix=('docs/modules/relay-light/workspace/RLT_29/','docs/modules/relay-light/as-built/')
changed=set(subprocess.check_output(['git','-c','core.quotepath=false','diff','--name-only','93d65cb','--'],text=True).splitlines())
changed.update(subprocess.check_output(['git','-c','core.quotepath=false','ls-files','--others','--exclude-standard'],text=True).splitlines())
bad=sorted(p for p in changed if p not in allowed_exact and not p.startswith(allowed_prefix))
if bad: raise SystemExit('out-of-scope: '+','.join(bad))
print('allowed-path audit: PASS')
PY
```

## 7. batch-1 — 协议归属、AGENTS 与 skill 核心

**sole writer**：batch-1 coder；**前置**：plan-review PASS、RELAY_RECEIPT preflight 通过、baseline B-01～B-06 已保存。**只读**：brief/task_plan、design/DevPlan、full mode skill 现状。**业务输出**：仅 AGENTS.md、SKILL.md、`evidence/baseline/**`、coder signal。

1. AGENTS 增 single-task 标头分流、互斥、产出型 builder/coder/reviewer/decider 的 DONE/BLOCKED 即停、RELAY_RECEIPT 按角色 fail-closed 分流；monitor 命中 receipt 时只用 Herdr prompt 通知且 repo diff 为空。不得改 full 标头段语义。
2. SKILL 必须先实现 §0.2 model-allocation gate（全角色/实例提案表→询问→明确确认→orchestrator 维护配置→启动），新增 single-task 拓扑、phase、计数、sole writer、信号 schema、恢复四类权威输入、monitor repo 完全只读、batch coder 写 progress 施工证据索引、两证据层、heavy 完成谓词、授权边界；不改 full 五阶段模板。SKILL 必须实现 §1.1 的 batch reviewer durable PASS + 工件齐全→orchestrator 对本批 coder/reviewer 各一次 `/clear`→双方复验→下一批的顺序闸，并明确 FAIL/整改保留原 session、monitor 常驻不 clear、decider 按需。RELAY_RECEIPT 正反例必须分别断言：产出型 builder/coder/reviewer/decider 仍只写精确 BLOCKED 后停，不得削弱其 preflight；monitor 只有 Herdr prompt 非 durable 通知且 repo diff 必须为空，不写 BLOCKED。
3. 运行 B-01、B-05、B-06 与 `git diff --check`。expected：B-01/05/06=0，结构断言中本批条目满足；证据落 `evidence/batch-1/`。
4. 成功写 `DONE.batch-1.coder.md`；失败写 `BLOCKED.batch-1.coder.md`。原 batch-1 reviewer sole-write `check.batch-1.md` 与 `DONE.batch-1.review.md`/BLOCKED；PASS、工件齐全及 §1.1 双方 clear 复验完成前不得进入 batch-2。

**batch-1 可复制验证块**（preflight 未命中后执行；每条 stdout/stderr 与 exit 写本批 evidence）：

```bash
cd /home/nash/work/dh-relay/.dh-worktrees/RLT_29
mkdir -p docs/modules/relay-light/workspace/RLT_29/evidence/batch-1
PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=tools/relay-light python3 -m unittest tools/relay-light/test_install_skill.py > docs/modules/relay-light/workspace/RLT_29/evidence/batch-1/install.txt 2>&1; rc=$?; printf '%s\n' "$rc" > docs/modules/relay-light/workspace/RLT_29/evidence/batch-1/install.exit; test "$rc" -eq 0
python3 - <<'PY' > docs/modules/relay-light/workspace/RLT_29/evidence/batch-1/plan-log-audit.txt
from pathlib import Path
bad=[str(p) for p in Path('docs/modules/relay-light/workspace/RLT_29').rglob('*') if p.name in {'relay_plan.md','relay_log.jsonl'}]
if bad: raise SystemExit(','.join(bad))
print('plan/log audit: PASS')
PY
git diff --exit-code 93d65cb -- tools/relay-light/relay_log.py docs/modules/relay-light/relay
git diff --check
```

预期依次 exit `0/0/0/0`；输出含 unittest `OK`、`plan/log audit: PASS`，禁改路径无 diff，diff-check 无输出。allowed-path 脚本另按 §6 运行并把 stdout 保存为 `evidence/batch-1/allowed-path.txt`，expected=`allowed-path audit: PASS`、exit 0。任一不符写 BLOCKED，不写 DONE。

## 8. batch-2 — 双 adapter、模型选择、monitor/Enter/恢复

**sole writer**：batch-2 coder；**前置**：batch-1 review durable PASS、本批工件齐全且 §1.1 双方 clear 复验完成、RELAY_RECEIPT preflight。**只读**：batch-1 产物、brief/task_plan、两 adapter、`execution_strategy.md`。**业务输出**：两 adapter、coder signal、progress 中的 batch-2 施工里程碑；`execution_strategy.md` 由 orchestrator 维护，coder/monitor 只读。

1. 两 adapter 增 single-task 启动/派单合同：新标头、§0.2 模型分配询问确认闸及 orchestrator 配置写者、独立 tab/pane、durable signal；不得用 relay_log 或 progress 作为 single-task 运行真相。
2. 写 monitor 120 秒 wait/get/read、无变化静默、变化即 prompt orchestrator；Enter 三条件、只发一次、复验、失败通知 orchestrator 并换 fresh。明确 monitor 对 repo/workspace 完全只读，不写 progress/execution_strategy/DONE/BLOCKED/轮询日志/通知日志或任何文档。
3. 从 repo root 运行 B-01、B-05、B-06、`git diff --check`；expected 均 exit 0，`roles.toml` diff 为空；证据落 `evidence/batch-2/`。
4. 成功/失败分别写 `DONE.batch-2.coder.md` / `BLOCKED.batch-2.coder.md`。原 reviewer 写 `check.batch-2.md` 与 review signal；PASS、工件齐全及 §1.1 双方 clear 复验完成前不得进入 batch-3。

**batch-2 可复制验证块**：

```bash
cd /home/nash/work/dh-relay/.dh-worktrees/RLT_29
mkdir -p docs/modules/relay-light/workspace/RLT_29/evidence/batch-2
PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=tools/relay-light python3 -m unittest tools/relay-light/test_install_skill.py > docs/modules/relay-light/workspace/RLT_29/evidence/batch-2/install.txt 2>&1; rc=$?; printf '%s\n' "$rc" > docs/modules/relay-light/workspace/RLT_29/evidence/batch-2/install.exit; test "$rc" -eq 0
git diff --exit-code 93d65cb -- tools/relay-light/skill/roles.toml
git diff --exit-code 93d65cb -- tools/relay-light/relay_log.py docs/modules/relay-light/relay
git diff --check
```

预期四条 exit 0；unittest 输出 `OK`，三个 git 命令无输出。再按 §6 运行 allowlist audit，stdout 保存到 `evidence/batch-2/allowed-path.txt`，expected PASS/0。plan/log 不存在审计复用 batch-1 Python 块但输出改存 `evidence/batch-2/plan-log-audit.txt`。任一不符写 BLOCKED。

## 9. batch-3 — 结构测试、安装一致性、真实 Herdr batch 证据、as-built

**sole writer**：batch-3 coder；**前置**：batch-2 review durable PASS、本批工件齐全且 §1.1 双方 clear 复验完成、RELAY_RECEIPT preflight。**只读**：前两批产物、baseline、现有测试/as-built、`execution_strategy.md`。**业务输出**：`test_install_skill.py`、`evidence/batch-3/**`、`docs/modules/relay-light/as-built/single-task-实现快照.md`、coder signal、progress 中的 batch-3 施工里程碑。**明确排除**：workflow-final review、E2 receipt、它们的 signals、execution_strategy。

1. `test_install_skill.py` 加纯文本结构断言，先取得有效 RED（断言失败，不是导入/路径错误），完成实现后 GREEN；不加依赖。结构测试逐项覆盖 SKILL/双 adapter 的全角色实例表、明确询问和确认先于启动、未确认零启动、逐角色修改、未变确认恢复复用、新增/换角色或实例及模型/推理档重问、默认仅提案、最大权限不替代确认；必须包含缺询问/先启动/未确认默认选择/变更免确认等反例。另必须以 RELAY_RECEIPT 正反例断言：monitor 分支只用 Herdr prompt 通知、repo diff 必须为空、不写 progress/execution_strategy/DONE/BLOCKED/轮询或通知日志；产出型 builder/coder/reviewer/decider 分支仍必须写本角色精确 BLOCKED，不能因 monitor 例外而削弱。
2. 以现有临时 home 安装测试证明五文件源/双副本一致；`roles.toml` 源字节无计划外变化。
3. 真实 Herdr 自举只完成到三批及 batch-3 durable signal；记录一任务一 workspace、独立 tab/pane、按 durable signals + review/decision + execution 配置 + Herdr 实态恢复、monitor repo 零写入、plan/log 不存在。`evidence/batch-3/model-allocation.md` 必须引用真实提案表与询问、用户明确确认来源/时点、orchestrator 维护的配置、实际 Herdr workspace/tab/pane/model/推理档的白名单观察，逐角色实例比对并给结论；缺确认、缺实际观察或不一致均阻断 A160/H19，不用结构测试替代。保留已核实的 w41 配置，不得推定尚未启动实例已观察。后续 workflow-final/E2 由矩阵中的 reviewer 自写，不由 batch-3 coder 预造。
   后续真实演示必须提供逐批清理证据链：reviewer durable PASS 引用、工件齐全核对、本批 coder/reviewer 的精确 tab/session、orchestrator 各一次 `/clear` 的实际操作与双方清理后复验、下一批启动时点；证明顺序成立，并核对 FAIL/整改期间原 session 保留、monitor 未 clear、decider 按需。batch-3 coder 只能引用已发生的前批清理事实；本批尚未 review PASS 时不得预造自身清理证据，batch-3 的后置清理由 orchestrator 执行并在后续真实演示展示实际记录。
4. as-built 只写已实现/实跑事实，不写 future PASS。
5. 初次按 §5.3 用相同命令生成 post/comparison；运行 B-01～B-06、`git diff --check`。B-04 blocker 裁决后的恢复须先取得原 plan-reviewer 对本定向合同修订的 durable PASS，再由原 coder#b3 新建 `evidence/batch-3/post-b04-rerun-1/`，在 B-04 前后分别保存 `git -c core.quotepath=false diff --name-only 93d65cb --` 的 `tracked-before.txt`/`tracked-after.txt`，另存 B-04/B-06/diff-check 的 stdout/stderr 与 exit，并生成不覆盖旧件的新 `comparison.json`。expected：Python/install/PowerShell 既有证据仍有效或按受影响面重跑全绿；B-04 严格通过 `rlt29-b04-r30-paths-v1`，RLT_29-owned=0、canonical inherited Counter=baseline 59；前后 tracked diff 完全一致；禁改/allowlist/plan-log/diff-check 审计=0。B-01/B-02/B-03/B-05 仅在原路径、哈希和受影响面仍有效时可引用并注明未重跑，否则必须另存新证据。
6. 全部门通过才写 `DONE.batch-3.coder.md`；否则写 `BLOCKED.batch-3.coder.md`。原 reviewer 写 `check.batch-3.md` 与 review signal；PASS 后由 orchestrator 读取 batch-3 reviewer durable PASS signal，核对工件齐全并按 §1.1 完成双方 clear 复验，再分派 heavy 五路 workflow-final。monitor 只观察 Herdr 变化并 prompt 通知，不读取 durable 工件、不路由、不分派或启动 agent。

**batch-3 可复制 post 验证块**：

```bash
cd /home/nash/work/dh-relay/.dh-worktrees/RLT_29
mkdir -p docs/modules/relay-light/workspace/RLT_29/evidence/batch-3/post
PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=tools/relay-light python3 -m unittest tools/relay-light/test_install_skill.py > docs/modules/relay-light/workspace/RLT_29/evidence/batch-3/post/B-01.txt 2>&1; rc=$?; printf '%s\n' "$rc" > docs/modules/relay-light/workspace/RLT_29/evidence/batch-3/post/B-01.exit; test "$rc" -eq 0
PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=tools/relay-light python3 -m unittest discover -s tools/relay-light -p 'test*.py' > docs/modules/relay-light/workspace/RLT_29/evidence/batch-3/post/B-02.txt 2>&1; rc=$?; printf '%s\n' "$rc" > docs/modules/relay-light/workspace/RLT_29/evidence/batch-3/post/B-02.exit; test "$rc" -eq 0
PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=tools/relay-light pwsh -NoProfile -File tools/tests/run-relay-tests.ps1 > docs/modules/relay-light/workspace/RLT_29/evidence/batch-3/post/B-03.txt 2>&1; rc=$?; printf '%s\n' "$rc" > docs/modules/relay-light/workspace/RLT_29/evidence/batch-3/post/B-03.exit; test "$rc" -eq 0
dh relay-light > docs/modules/relay-light/workspace/RLT_29/evidence/batch-3/post/B-04.txt 2>&1; printf '%s\n' "$?" > docs/modules/relay-light/workspace/RLT_29/evidence/batch-3/post/B-04.exit
git diff --exit-code 93d65cb -- tools/relay-light/relay_log.py docs/modules/relay-light/relay
git diff --check
```

B-01/B-02/B-03 expected exit 0 且输出 `OK`/`PASS`；B-04 的 expected 由 baseline 精确 failure IDs 决定，不能只比 exit。禁改 diff 与 diff-check expected 0/无输出。随后运行 §6 allowlist audit和 plan/log Python 审计，将输出存 post，生成 comparison.json；严格应用 §5.3 阻断谓词。

## 10. workflow-final、E2 与人验入口

batch-3 review durable PASS、工件齐全且 §1.1 双方 clear 复验完成后，orchestrator 读取 durable review signal 并按矩阵并发/顺序派 heavy 五路 workflow-final；monitor 只观察 Herdr 变化并 prompt 通知，不写 repo。每路初审 remediation_count=0；整改后 reviewer 必须 fresh。五路全部 PASS 或可核 N/A、open P0/P1=0 后，另派 E2 attempt 1；如有 open P0/P1，仅同 session targeted attempt 2。两层均闭合后才备料 E10/H19；任何单一 reviewer、batch PASS、E2 receipt 均不得替代 heavy 五路。
