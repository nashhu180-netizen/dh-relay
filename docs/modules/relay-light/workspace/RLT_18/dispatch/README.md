# RLT_18 派单总览（single-task 模式 · orchestrator 维护 · worker 只读）

本卡走 relay-light **`single-task` 单卡接力模式**（用户 2026-09-23 指定「走简单版」）。协议以 `tools/relay-light/skill/SKILL.md`「`single-task` 单卡接力模式」节与 `references/adapter-claude-code.md` 同名节为准：**不创建/读写 `relay_plan.md` / `relay_log.jsonl`，不使用 W/C/R/X/F 阶段词**。

## 身份与合同

- 任务卡：`RLT_18 — watch（第 5 批）`（DevPlan `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md`「#### RLT_18」段约第 644 行起；任务表第 137 行）
- 设计与验收（`docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md`，逐字为准）：§3.6 `watch`（约 480–491）；§7.2 等待与节奏（约 894–908）；第 115、140、189、1436–1439 行；机器证 `HC-RL-A82`/`A83`/`A101`（约 1351–1353）；人判 `HC-RL-H11`/`H12`（约 1408–1409）；`A125`（约 1280，本卡只做终局重同步回归，不重复承接）
- 注意：master 已有 `efb252c`（#62）把 SKILL 角色改名 stage-lead、新增 watcher 并写明「`relay_log.py watch` 程序落地后由程序承担」——adapter 改写须与现行 SKILL 术语一致
- GitHub Issue **#65**（高危，收口写 `Relates to #65`）；分支/worktree `wt/RLT_18` @ `/home/nash/work/dh-relay/.dh-worktrees/RLT_18`（基线 origin/master `5ab3bba`）
- 档位：**标准 · 高危**；`task_type=heavy`；有效单测硬要求；workflow-final **heavy 五路**（code-round1 / code-round2 / requirement / consistency / lesson）；收口前须 `verify(relay-light):`
- D-start：用户 2026-09-23 对话点选；**前置豁免** RLT_13/RLT_17（用户 2026-09-23），三条已知影响：①RLT_17 将在带 watch 的 adapter 上跑；②本机只有 Linux，Windows 两副本同步与 A125 终局回归挂起；③verify 可能被 dev-harness 模块级钩子拦（同 RLT_27 F-001）→ 本卡最多到「待验收」

## 生命周期（single-task 固定）

七件套 + `task_plan.md`（phase=plan）→ plan-review → 分批开发（**最多 3 批**，batch=1|2|3）+ 每批 batch-review → workflow-final heavy 五路 → E2 code_review → 主会话人验（H11/H12、验收）。
- plan-review / batch-review 各最多整改 2 轮：FAIL 回同一 builder/coder，原 reviewer 复审；超限交 decider，方向/范围/验收/数据语义/安全/生产影响六类交用户。
- batch PASS 且工件齐全后 orchestrator 对本批 coder 与 batch reviewer 各 `/clear` 一次再开下一批；FAIL/整改期间不 clear。
- workflow-final 每路每轮 fresh reviewer；E2 首次 fresh，只在有 open P0/P1 时同一 reviewer 做 targeted attempt 2。施工者不复核自己的施工。

## 允许路径（闭集，越界即 FAIL）

worker 可写：
```
tools/relay-light/relay_log.py
tools/relay-light/test_relay_log.py
tools/relay-light/skill/references/adapter-claude-code.md
tools/relay-light/skill/references/adapter-codex.md
tools/relay-light/skill/SKILL.md               （UD-2：仅 watcher 表述与「watch 未实现」过时措辞）
docs/modules/relay-light/workspace/RLT_18/**   （execution_strategy.md 除外，仅 orchestrator 写）
```
仅 orchestrator 可写：`execution_strategy.md`、DevPlan 第 137 行 RLT_18 任务行。用户级 skill 副本（`~/.claude/skills/relay-light/**`、`~/.codex/skills/relay-light/**` 及 Windows 两处）**worker 一律不碰**，由 orchestrator 收口时展示目标、取得用户当次授权后同步。
**不动**：design/、AGENTS.md、SKILL.md 中 UD-2 以外内容及 skill 其它文件、`install_skill.py`、`docs/modules/relay-light/relay/**`（字节不得变）、as-built、其它卡工作区。范围外发现只记 `findings.md`。

## 写者边界（sole writer）

- `execution_strategy.md`：仅 orchestrator。
- `progress.md`：仅当前 batch coder 在**自己 batch 完成时追加一条**施工里程碑 + 证据引用（builder 在 plan 阶段建空骨架）；不记 pane/agent 状态、轮询、通知。reviewer/decider/monitor/orchestrator 不写 progress。
- review/check/decision 工件：对应 reviewer/decider 自写。monitor 对 repo/workspace **完全只读**。

## durable signal（每个产出型 worker 的收口物，写完即停）

独立文件、单行，放 `docs/modules/relay-light/workspace/RLT_18/`：
```
DONE|BLOCKED task=RLT_18 phase=<p> agent=<role>#<i> batch=<1|2|3|na> path=<path|na> review_round=<n> remediation_count=<0|1|2> verdict=<v> evidence=<repo相对路径[,...]>
```
BLOCKED 另含 `reason=<snake_case>`；值无空白。文件名：
| 场景 | 文件 |
|---|---|
| builder 初稿 / 第 k 次整改 | `DONE.builder.md` / `DONE.builder.plan-remediation-<k>.md` |
| plan-reviewer 初审 / 第 k 轮复审 | `DONE.plan-review.md` / `DONE.plan-review.round-<k>.md` |
| batch n coder 初交 / 第 k 次整改 | `DONE.batch-<n>.coder.md` / `DONE.batch-<n>.coder.remediation-<k>.md` |
| batch n reviewer 初审 / 第 k 轮复审 | `DONE.batch-<n>.review.md` / `DONE.batch-<n>.review.round-<k>.md` |
| decider | `DONE.decision.<tag>.md` |
| workflow-final 某路第 k 轮 | `DONE.workflow-final.<path>.review-round-<k>.md` |
| E2 | `DONE.e2-code-review.attempt-<n>.md` |
| 阻塞 | 同名把 `DONE` 换成 `BLOCKED` |

verdict：builder/coder 用 `READY`；reviewer 用 `PASS|FAIL`；decider 用 `AUTO|CONSULT`。

## RELAY_RECEIPT preflight

开工第一步 `env | grep -c '^RELAY_RECEIPT='`：命中则产出型角色只写本角色精确 `BLOCKED.*.md`（`reason=relay_receipt_present`）后停止；monitor 命中则零写入、只 prompt 通知 orchestrator 后停。均不得清除任何 `RELAY_*`。

## 环境事实（Linux ThinkPad，照抄勿改）

- 单测入口不能写 dotted 路径：
  ```
  cd tools/relay-light && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest test_relay_log
  PYTHONDONTWRITEBYTECODE=1 pwsh -NoProfile -File tools/tests/run-relay-tests.ps1
  ```
- 每条测试命令都带 `PYTHONDONTWRITEBYTECODE=1`；已有 `__pycache__` 不删，只登记 pre-existing。
- 单测一律**打桩** herdr 与时钟，不调真实 `herdr`，不真 sleep。
- 需取旧实现当基线：钉死 SHA `5ab3bba` + `git cat-file -e` 探测 + 缺失时 `git fetch --depth=1 origin <sha>`，失败 `self.fail` 不 skip（CI 浅克隆下 `git show master:` 会崩）。
- `gh` 不支持 `--json` 的子命令多，worker 不碰 gh。本机 codex 需 `--dangerously-bypass-approvals-and-sandbox` 才能起。

## 实测批（H11/H12）的特别授权

H11/H12 要真实拉起「被通知的监工」与 watch 进程。这是 worker「不拉终端」的**唯一例外**，只在 task_plan 指定的实测批、orchestrator 派单明写「实测批」时生效：只在 herdr workspace `w4B` 开 tab，agent 名以 `rlt18-probe-` 开头，用完关闭；探针计划放 `workspace/RLT_18/evidence/` 下自建 fixture；只写「展示了什么、时刻、内容」，人判结论留给用户。

## worker 铁律（AGENTS.md 编排协议段）

你是 worker：除实测例外不拉终端、不派活、不回头问用户（含 AskUserQuestion）；只做派单指向的这一件事，别自行加载 dev-harness skill；卡住写 BLOCKED signal 不憋死；凭据值不入任何文件；完成即停。

## Git 纪律

只有 builder 与 coder 提交（各自产出 + 自己的 signal）；reviewer/decider 只写不提交，由 orchestrator 代 add 提交。只 add 点名文件，禁止 `git add -A`/`.`；scope `relay-light`；不 push、不 rebase、不动 master 与其它 worktree。

## 派单文件

| phase | 角色 | brief |
|---|---|---|
| plan | builder | `plan-builder.md` |
| plan-review | plan-reviewer | `plan-review.md` |
| batch | coder | `batch-coder.md` |
| batch-review | batch reviewer | `batch-review.md` |
| decision | decider | `decision.md` |
| monitor | monitor（watcher） | `monitor.md` |
| workflow-final / e2-code-review | reviewer | 批次全部 PASS 后由 orchestrator 另写 |
