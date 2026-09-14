# monitor#1 · DRILL_02:C#1 · relay-light 监工派单（编排 → 监工）

你是 relay-light 计划 `dryrun-win-01` 的 **C 阶段监工 `monitor#1`**。协议全文在 `~/.codex/skills/relay-light/SKILL.md`（与仓内 `tools/relay-light/skill/SKILL.md` 逐字节相同），命令模板在 `references/adapter-claude-code.md`（本计划主控侧按 Claude 适配，账本一律 `--config-dir ~/.claude/skills/relay-light/`）。**你只管本阶段实例 `DRILL_02:C#1` 的节点 C1**，不跨阶段、不写 `stage_close`、不回头问用户。

- 仓/worktree：`D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\dryrun-rlt12-win`（分支 `dryrun/rlt12-win`）
- 计划目录：`docs/modules/relay-light/relay/dryrun-win-01/`（`relay_plan.md` + `relay_log.jsonl`）
- 账本程序：`python tools/relay-light/relay_log.py {add,status,lint} --plan docs/modules/relay-light/relay/dryrun-win-01 --config-dir ~/.claude/skills/relay-light/`（Windows 命令名是 `python`，不是 `python3`）
- 施工计划（W 阶段已 PASS，权威）：`docs/modules/relay-light/workspace/DRILL_02/task_plan.md`（单批 C1）、`brief.md`、`execution_strategy.md`；演习卡定义 `docs/modules/relay-light/workspace/RLT_12/evidence/win-dry-run/README.md`
- 允许路径闭集：`.gitignore`（仓根）与 `docs/modules/relay-light/workspace/DRILL_02/**`。`relay_log.jsonl` 由账本程序独占，任何 worker 不得 stage。
- **环境事实（W 阶段已验，编排裁决）**：Windows + codex-cli 0.154.0 上 `--sandbox read-only` 能启动、能读，但**写不了任何文件**（含复核产出）。因此本阶段所有需要写产出文件的 codex 角色（checker / decider）一律 `--sandbox workspace-write` 启动，约束改由派活 prompt 承担（"除本角色产物外不得创建/修改任何文件，不 git add/commit"）；账本 `agent_launch` note 写 `launch=codex workspace-write`。devin worker 用 `--permission-mode dangerous`。
- 硬规则：`wait` 返回时必须有接收者（前台阻塞循环）；wait 若在非终态提前返回，续开同一等待，不写伪终态。凭据/密钥值永不写进 note、工件、账本。每步 `add` 若退出 2/3，把 stderr 原样贴到终端并停下，不要绕过校验。

## 你要按顺序做的事

1. `status` 看现场（应见 W#1 closed result=done、C#1 已 `stage_start`、`monitor_launch`）。
2. 账本 `add --node C1 --event node_start --agent monitor#1 --note "stage_id=DRILL_02:C#1"`。
3. 拉 coder：`herdr pane split --current --direction right --cwd "D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\dryrun-rlt12-win" --no-focus` 取 pane id → `herdr agent start coder --kind devin --pane <id> -- --model swe-2-max --permission-mode dangerous` → 账本 `agent_launch --agent coder#1 --note "launch=devin swe-2-max"` → `herdr agent prompt coder "<派活 prompt>"`。派活 prompt 首行 `[relay-light] worker · node=C1 · agent=coder#1 · workspace=docs/modules/relay-light/workspace/DRILL_02`，正文照 adapter 模板：先读 AGENTS.md、task_plan.md（含契约头）、brief.md、progress.md、findings.md；按 task_plan「Batch C1」步骤 1–7 执行；只改 `.gitignore` 末尾追加段与 workspace/DRILL_02 内 coder 获准的 findings/lesson_candidates/done.coder.md；**不写 progress.md**（scribe 独占）；只 `git add` 点名文件；完成后写 `done.coder.md` 信号 + 四行小结即停。
4. 同时拉 checker（批内同在场）：新 pane → `herdr agent start checker --kind codex --pane <id> -- -m gpt-5.6-sol -c model_reasoning_effort=medium --sandbox workspace-write` → 账本 `agent_launch --agent checker#1 --note "launch=codex gpt-5.6-sol workspace-write"`。checker 派活等 coder done 后再发（见第 6 步）。
5. **等待 coder**：`herdr agent wait coder --until done --until blocked --timeout 1200000` 前台阻塞。若静默 >20 分钟无输出：账本 `agent_lost --agent coder#1 --note "silent_timeout ..."`，同 pane 关掉重拉 `coder#2`（note `relaunch_of=coder#1`）并重发派活（补一句先看已有部分产物）。返回后读产出判合格 → 账本 `done --agent coder#1 --note "<摘要 commit=SHA>"`。
6. coder done 后向 checker 派活：标头 `agent=checker#1`，按 task_plan「checker 小审输入」逐项核：`.gitignore` diff 仅末尾追加段、`git check-ignore -v tools/relay-light/__pycache__/x.pyc` exit 0 命中、`pwsh tools/tests/relay-light-log.ps1` 跑完后 `git status --short` 零 `__pycache__`/`*.pyc`（测试约 10~11 分钟属正常）、四集合边界、commit SHA；产出 `workspace/DRILL_02/check.C1.md` 与 `done.checker.md`（`DONE task=DRILL_02 role=checker batch=C1 status=<PASS|FAIL>`）；除这两个文件外不得改任何文件、不 commit。wait → 读产出 → 账本 `done --agent checker#1`。FAIL 则把 P1 项 prompt 回 coder（同一实例，账本 `checkpoint` 记 checker 名下 routed_to=coder#1），再让 checker 复核直到 PASS。
7. checker PASS 后拉 scribe：新 pane → `herdr agent start scribe --kind devin --pane <id> -- --model swe-2-medium --permission-mode dangerous` → 账本 `agent_launch --agent scribe#1 --note "launch=devin swe-2-medium"` → 派活：读 task_plan / findings / check.C1.md / 账本 status，在 `workspace/DRILL_02/progress.md` 落 C1 批次记录（做了什么、证据 E-ID、commit、checker 结论）并写 `done.scribe.md`（`DONE task=DRILL_02 role=scribe batch=C1 status=CONSTRUCTION_DONE evidence=... next=monitor`）；只 `git add` progress.md、done.scribe.md 与 check.C1.md/done.checker.md（若 checker 未提交）并 commit；除 progress.md 外不得改文件。wait → 账本 `done --agent scribe#1`。
8. decider（codex gpt-6-astra，`--sandbox workspace-write`）**只在** coder/checker 写 blocked 时拉起：账本 `blocked` → `escalate`（note 恰含 `decider=decider#1`）→ 拉 decider 派活产出 `decision.1.md` → `decision`（记被阻塞 agent 名下，note 复述同一 helper）→ decider `done` → `resume`。无 blocked 则不拉，不记 launch。
9. 三者 done 后 `add --node C1 --event node_close --agent monitor#1`。
10. `add --node C1 --event stage_result --agent monitor#1 --note "stage_id=DRILL_02:C#1 outcome=done .gitignore 追加 __pycache__/*.pyc、checker PASS、progress 已记 commit=<SHA>"`。
11. pane 留着不关（编排关终端空间）；打印 `MONITOR_NOTE <本阶段异常摘要或 none>` 与 `MONITOR_DONE stage=DRILL_02:C#1`，停止。

## 纪律（承接 Linux DR-F-002/DR-F-004 与本预演 W1 实测）

- **静默超时**：worker 状态 `working` 但 pane 输出 **>20 分钟无变化** → 账本 `agent_lost` → 同 pane 关掉重拉 `#n+1`；`attempt_max=3` 用尽仍 NOT_RUN → 把可用终态写完后 `stage_result outcome=blocked` 交编排（若任何 agent 处于 blocked 且须走决策链：escalate 的 helper 只能是 `decider=decider#<n>`——decider 在 C1 表内可拉；monitor/orchestrator 不是合法 helper）。
- **真提交核验**：`herdr agent prompt` 发出后必须核「真提交」——`herdr agent get <名>` 看 `state_change_seq` 变化 + `status` 转 `working`；停在输入框（seq 不动 / agent_prompt_stalled）就补 `herdr agent send-keys <名> enter` 再复验，终极判据 = `herdr agent read` 看输入框已清空。拉起的 agent 先 `herdr agent wait <名> --until idle` 再 prompt。
- **checkpoint/blocked 边界**：checkpoint 只能落在非终态 agent（A60）；`blocked → agent_lost` 合法（实例产出不了交付物时按失联处置重拉）；done 终态不得重拉（A113）。
