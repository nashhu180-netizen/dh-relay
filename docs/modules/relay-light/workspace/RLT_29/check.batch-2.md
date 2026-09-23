# check.batch-2 — RLT_29 batch-2 独立复核

- 复核者：batch-reviewer#b2（Devin SWE-2 Max，tab w41:t9/p9）；phase=batch-review；batch=2；review_round=1；remediation_count=0。
- 日期：2026-09-22（workspace 文件时间跨 23:58–00:00）。本文件为 batch-2 reviewer 唯一业务输出之一（另一为 DONE/BLOCKED 单行 signal）。

## 0. RELAY_RECEIPT preflight

- `env | grep -E '^RELAY_'` → 无输出（count=0），未命中；走正常复核路径，不写 BLOCKED.preflight。

## 1. scope 与输入

- 基线：`master@93d65cb`；输入 diff = `git diff 93d65cb`（tracked）+ untracked 清单。
- batch-2 允许业务输出（task_plan §3 矩阵/§8）：两份 adapter（`tools/relay-light/skill/references/adapter-claude-code.md`、`adapter-codex.md`）、`evidence/batch-2/**`、`progress.md` 单条 batch-2 里程碑、`DONE.batch-2.coder.md`/`BLOCKED.batch-2.coder.md`。`execution_strategy.md` 由 orchestrator 维护，coder 只读。
- 输入工件：brief.md、task_plan.md（§0.1/§0.2/§1.1/§4/§6/§8）、execution_strategy.md、check.batch-1.md + `DONE.batch-1.review.md`（PASS）、batch-2 evidence 12 件、完整 diff、SKILL.md single-task 节（batch-1 已 PASS 的合同源）。

## 2. diff 归属核查（对应审核项 1）

batch-2 时点增量（batch-1 reviewer durable PASS 23:49 之后）全部落允许集：

| 路径 | mtime | 归属判定 |
|---|---|---|
| adapter-claude-code.md（+40/-0，纯插入 single-task 节） | 23:58 | batch-2 coder |
| adapter-codex.md（+40/-0，纯插入 single-task 节） | 23:59 | batch-2 coder |
| progress.md（恰新增一条 batch=2 里程碑行） | 00:00 | batch-2 coder（sole writer 权限内） |
| DONE.batch-2.coder.md（单行 signal） | 00:00 | batch-2 coder |
| evidence/batch-2/**（6 命令 × .txt+.exit 共 12 件） | ~23:59–00:00 | batch-2 coder |
| execution_strategy.md（b2-coder/b2-reviewer 两行 confirmed-pending→observed） | 23:52 | orchestrator 机械维护，非 coder 写入 |

非本批增量的 tracked 改动（AGENTS.md +6 23:33、SKILL.md +45 23:34、design/01 与 DevPlan 21:24–23:28）均为 batch-1/plan 阶段已审结写入，与 check.batch-1.md §2 记录的行数逐字一致（AGENTS +6/-0、SKILL +45/-0 复核自跑 `--stat` 确认），batch-2 未触碰。

越界核查：`tools/relay-light/relay_log.py`、`docs/modules/relay-light/relay/**`、`roles.toml`、`test_install_skill.py`、`as-built/**`、AGENTS.md、SKILL.md 全部零 batch-2 增量 diff。**无越界。**

## 3. 逐项证据

### 项 1 — 实际 diff 仅双 adapter、本批 evidence、progress 单条、coder signal

- §2 归属表逐项满足；progress.md 复核全文：写入合同头 + 恰两条里程碑行（batch-1、batch-2 各一），batch-2 行内容限于施工摘要 + evidence 引用，无 pane/agent 状态、轮询、通知或终端输出。
- **满足。**

### 项 2 — 标头/phase/独立具名 tab-pane/派单流程一致

- 两 adapter 派单模板首行逐字一致：`[relay-light:single-task] worker · phase=<phase> · agent=<角色>#<实例> · batch=<n|na> · round=<n> · workspace=<任务工作区>`，与 AGENTS.md single-task 段及本棒实际派单标头（`phase=batch-review · agent=batch-reviewer#b2 · batch=2 · round=1`）完全吻合；与 `[relay-light] worker · node=...` 双向互斥明写。
- phase 闭集 9 值与 `batch=1|2|3|na` 在两 adapter 与 SKILL.md 三处逐字一致。
- 独立具名隔离：claude 侧 `herdr tab create --workspace <ws> --cwd <wt> --label <角色> --no-focus` + 取 `root_pane.pane_id`、不在同一 tab 内 split——与该文件 line 37 既有完整模式约定一致；codex 侧 `herdr pane split --current --direction right`（第二次起显式传目标 pane）+ claude kind `pane run`+`agent rename` shim 规避——与该文件 line 37–41 既有约定一致。两侧拓扑写法差异恰是各 adapter 的既有惯例，非矛盾。
- **满足。**

### 项 3 — model-allocation gate

两 adapter「启动前 model-allocation gate」节逐点命中：拉起任何 agent 前展示全部拟启动角色/实例的模型+推理档提案表并明确询问；推荐默认仅是提案、不写死模型；用户可逐角色修改；**未获明确确认不得启动任何 agent**（缺询问/先启动后补/按未确认默认拉起/变更免确认四项反例明列为违规）；确认来源/分配由 orchestrator 机械写入 `execution_strategy.md`，未启动 tab/pane 标 pending、启动后补齐实际 Herdr 配置并逐项比对；恢复沿用未变确认快照；新增/换角色或实例、换模型/推理档必须重问；超时/静默/最大工具权限不推定确认，最大权限不扩张 commit/push/PR/merge/deploy/verify/人验授权；询问由当前主会话执行不另启 agent。与 SKILL.md「model-allocation gate」、task_plan §0.2、execution_strategy.md 写入合同一致。**满足。**

### 项 4 — durable signal 与 RELAY_RECEIPT 分角色分流

- signal schema：`DONE|BLOCKED task=<t> phase=<p> agent=<r>#<i> batch=<1|2|3|na> path=<path|na> review_round=<n> remediation_count=<0|1|2> verdict=<v> evidence=<repo 相对路径[,...]>`，BLOCKED 另含 `reason=<snake_case>`、值无空白——与 task_plan §4 一致；产出型写完即停，orchestrator 只按 durable signal + 独立 review/decision 机械路由，不把终端状态当真相。
- RELAY_RECEIPT：产出型 builder/coder/reviewer/decider 命中只写本角色精确 `BLOCKED.*.md` 单行后停；monitor 命中 repo/workspace 零写入、只 Herdr prompt 非 durable 通知 orchestrator 后停、不写 BLOCKED；两分支均不清 `RELAY_*`。与 AGENTS.md、SKILL.md、task_plan §0.1 三处逐字一致。**满足。**

### 项 5 — monitor 节拍与安全 Enter

- 两 adapter：monitor 常驻、对 repo/workspace **完全只读**（不写 signal/progress/execution_strategy/轮询日志/通知日志/任何文档，不路由、不分派、不启动 agent）；每 120 秒 `herdr agent wait <名> --timeout 120000` 返回后 `agent get`+`agent read` 核对；无变化静默、有变化即时 `agent prompt` 通知 orchestrator（非 durable 不落盘）；codex 侧正确标注无 `run_in_background` 只走前台循环。
- 安全 Enter：三条件**同时**成立才发一次 `send-keys enter` 并复验——①派单文本仍停输入框（含 Devin `queued` 指令仍排队未发出）②`state_change_seq` 未推进 ③非审批/确认 UI；任一不满足即不按；一次仍失败通知 orchestrator 并换 fresh 实例、禁止连按。codex 侧补充 TUI enter 可能被吃成多行换行、以 `agent read` 输入框清空为终极复验判据——平台特化合理，不削弱合同。**满足。**

### 项 6 — 恢复权威四类

两 adapter「恢复依据」节逐字一致：权威只有 worker/reviewer/decider 自写 durable signals、独立 review/decision 工件、orchestrator 维护的 `execution_strategy.md`、Herdr 实态四类；`progress.md` 只是施工证据索引、monitor 通知只是即时提示、二者都不是运行真相；本模式不存在 relay 账本。**满足。**

### 项 7 — full relay 零回归

- 两 adapter diff 均为 `## 红线` 前纯插入 40 行，既有字节（含账本命令模板、派活纪律、超时处置）零删除零修改。
- 复核自跑：`git diff --exit-code 93d65cb -- tools/relay-light/relay_log.py docs/modules/relay-light/relay` exit 0；`-- tools/relay-light/skill/roles.toml` exit 0。
- SKILL.md/AGENTS.md 本批零增量（见 §2），batch-1 已验的 full 段语义不被本批触碰。**满足。**

### 项 8 — evidence 真实全绿 + 复核自跑

- `evidence/batch-2/` 12 件：6 条命令各带 `.txt`+`.exit`（落实 batch-1 P2-2 建议），全部 exit=0——install.txt 末 `Ran 7 tests / OK`、plan-log-audit.txt `plan/log audit: PASS`、allowed-path.txt `allowed-path audit: PASS`、forbidden-diff/diff-check/roles-diff 三 .txt 为空配 exit 0。
- 本 reviewer 独立自跑（cwd=仓根，非引用 coder 证据）：

| 命令 | exit |
|---|---:|
| `env \| grep -c '^RELAY_'`（preflight） | 0 个匹配（未命中） |
| `PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=tools/relay-light python3 -m unittest tools/relay-light/test_install_skill.py` | 0（`Ran 7 tests` / `OK`） |
| plan/log 审计（§7 Python 块：workspace 内 relay_plan.md/relay_log.jsonl 扫描） | 0（`plan/log audit: PASS`） |
| `git diff --exit-code 93d65cb -- tools/relay-light/relay_log.py docs/modules/relay-light/relay` | 0 |
| `git diff --exit-code 93d65cb -- tools/relay-light/skill/roles.toml` | 0 |
| `git diff --check` | 0（无输出） |
| §6 allowed-path audit（verbatim，`-c core.quotepath=false`） | 0（`allowed-path audit: PASS`） |

- coder signal `DONE.batch-2.coder.md` 单行新 schema：`phase=batch agent=coder#b2 batch=2 path=na review_round=1 remediation_count=0 verdict=READY evidence=…/evidence/batch-2/`，字段齐、值无空白、证据路径存在。
- §1.1 前置链：batch-1 `DONE.batch-1.review.md` durable PASS（verdict=PASS，evidence=check.batch-1.md）+ execution_strategy 记录 b1 双方 `/clear` 已复验（revision=5），满足「PASS+工件齐全+双方 clear 复验→batch-2」顺序闸。**满足。**

## 4. findings

- P0：无。
- P1：无。
- P2-1（沿用 batch-1 已登记项，非本批引入，仍归 plan/decider 层）：design/01 §7.5.5 标头示例枚举 5 值 `phase=<plan|batch|final|decision|monitor>`，与运行期 9 值闭集（task_plan §1 / SKILL / 两 adapter 均一致）字面不齐；两 adapter 已正确使用 9 值闭集，未把 design 旧字面值当 oracle。建议 batch-3/收口阶段由 decider/orchestrator 口径统一 design 该处。
- P2-2（观察）：两 adapter single-task 节正文几乎逐字相同，仅拓扑（tab vs pane）、claude-kind shim、codex 前台循环/enter 复验四处平台差异；语义单源在 SKILL.md（adapter 首行已声明「协议语义以 SKILL.md 为准」），当前重复度可接受，后续若协议演进需注意双侧同步。

## 5. 结论

P0=0、P1=0 → **PASS**。batch-2 差异（双 adapter 各 +40 纯插入 single-task 节 + evidence/batch-2 十二件 + progress 单条里程碑 + coder signal）满足 task_plan §8 全部要求与派单八项审核点：标头/phase/tab-pane 与派单流程一致、model-allocation 询问确认闸全要素命中、durable signal 与 RELAY_RECEIPT 分角色 fail-closed 正确、monitor 120s 只读节拍与安全 Enter 三条件单次复验换 fresh 齐备、恢复权威四类且 progress/relay_log 非真相、full relay 零回归、证据真实全绿且本 reviewer 自跑复核一致。
