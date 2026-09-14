# monitor#1 · DRILL_02:R#1 · relay-light 监工派单（编排 → 监工）

你是 relay-light 计划 `dryrun-win-01` 的 **R 阶段监工 `monitor#1`**。协议全文在 `~/.codex/skills/relay-light/SKILL.md`（与仓内 `tools/relay-light/skill/SKILL.md` 逐字节相同），命令模板在 `references/adapter-claude-code.md`（账本一律 `--config-dir ~/.claude/skills/relay-light/`）。**你只管本阶段实例 `DRILL_02:R#1` 的节点 R1**，不跨阶段、不写 `stage_close`、不回头问用户。

- 仓/worktree：`D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\dryrun-rlt12-win`（分支 `dryrun/rlt12-win`）
- 计划目录：`docs/modules/relay-light/relay/dryrun-win-01/`；账本程序：`python tools/relay-light/relay_log.py {add,status,lint} --plan docs/modules/relay-light/relay/dryrun-win-01 --config-dir ~/.claude/skills/relay-light/`（Windows 用 `python`）
- 复核对象：C1 施工提交 `85af7fb`（仓根 `.gitignore` 末尾追加 `__pycache__/`、`*.pyc`）与 `docs/modules/relay-light/workspace/DRILL_02/`（task_plan / progress / findings / lesson_candidates / check.C1.md / review.md / done.*.md）。
- 档位 light，Recipe 两路并行：`lesson`（复盘 lesson_candidates 的取舍与教训是否成立、是否与既有 lessons 重复）与 `consistency`（施工是否与 task_plan/brief/演习卡 README 一致、allowed-paths 与四集合边界、progress 与账本一致）。两路都是 fresh reviewer、不是施工者。
- 允许路径：reviewer 各自只写 `workspace/DRILL_02/review.lesson.md` / `review.consistency.md` 与自有 `done.lesson.md` / `done.consistency.md`；scribe 只写 `workspace/DRILL_02/review.md`（汇总节）、`done.scribe.md`（及 findings.md 补 P2 行）。不得改 `.gitignore`、任何源码、账本。
- **环境事实（W1/C1 已验）**：Windows 上 codex `--sandbox read-only` 能起能读但**写不了任何文件**——reviewer 要落 `review.<路>.md`，一律 `--sandbox workspace-write` 启动，约束由派活 prompt 承担（"除本角色列名产物外不得创建/修改任何文件，不 git add/commit"）；账本 `agent_launch` note 写 `launch=codex gpt-5.6-sol workspace-write`。scribe 用 devin `--model swe-2-medium --permission-mode dangerous`。
- 硬规则：wait 前台阻塞、非终态提前返回则续等；凭据值永不写进任何地方；`add` 退出 2/3 贴 stderr 停下。

## 你要按顺序做的事

1. `status` 看现场（W#1、C#1 closed result=done；R#1 已 stage_start + monitor_launch）。
2. `add --node R1 --event node_start --agent monitor#1 --note "stage_id=DRILL_02:R#1"`。
3. 并行拉两路 reviewer，各自新 pane（`herdr pane split --current --direction right --cwd "D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\dryrun-rlt12-win" --no-focus`）：
   - `herdr agent start lesson --kind codex --pane <id> -- -m gpt-5.6-sol -c model_reasoning_effort=medium --sandbox workspace-write` → `agent_launch --agent lesson#1 --note "launch=codex gpt-5.6-sol workspace-write"` → 派活（首行 `[relay-light] worker · node=R1 · agent=lesson#1 · workspace=docs/modules/relay-light/workspace/DRILL_02`；读 AGENTS.md、lesson_candidates.md、findings.md、progress.md、`git show 85af7fb` 与 `git log` 本卡相关提交；产出 `review.lesson.md`：逐条候选给 采纳/驳回/合并 + 理由，P1/P2 分级，结论 PASS/FAIL；DONE 信号写 `done.lesson.md`（`DONE task=DRILL_02 role=reviewer batch=R1 status=<PASS|FAIL>`）；除这两个文件外不改任何文件，不 commit）。
   - `herdr agent start consistency --kind codex --pane <id2> -- -m gpt-5.6-sol -c model_reasoning_effort=medium --sandbox workspace-write` → `agent_launch --agent consistency#1` → 派活（同标头 agent=consistency#1；核 `git diff master...HEAD -- .gitignore` 仅末尾追加、四集合边界、task_plan 步骤逐条对账、progress 记录与账本 status 一致、check.C1.md 证据可复现（自己重跑 `git check-ignore -v tools/relay-light/__pycache__/x.pyc`）；产出 `review.consistency.md` + `done.consistency.md`，同样分级与信号）。
4. 等两路：先 `herdr agent wait lesson --until done --until blocked --timeout 1200000`，再 `herdr agent wait consistency ...`；各自返回后读产出，账本 `done --agent lesson#1 --note "<PASS|FAIL P1=n>"`、`done --agent consistency#1 ...`。
5. **任一 FAIL 且含 P1**（本计划 R 无 decider、无 coder，X 修复由编排另开）：照拉 scribe 把 FAIL 结论如实汇总进 review.md → 双判据满足后 `node_close` → `stage_result outcome=blocked --note "stage_id=DRILL_02:R#1 outcome=blocked <路> FAIL P1=<摘要>"` → 打印 `MONITOR_DONE stage=DRILL_02:R#1 outcome=blocked` 停止。只有 P2 视为 PASS 带备注。**不要写 blocked/escalate 到 reviewer 名下**——复核如实交付 FAIL 就是 done，stage_result 的 outcome=blocked 承担交回语义。
6. 两路 PASS 后拉 scribe：新 pane → `herdr agent start scribe --kind devin --pane <id> -- --model swe-2-medium --permission-mode dangerous` → `agent_launch --agent scribe#1 --note "launch=devin swe-2-medium"` → 派活：读两份 review.*.md，在 `review.md` 的汇总节写 R1 结论表（路 / 结论 / P1 / P2 / 处置），P2 项转记 findings.md 一行（允许），写 `done.scribe.md`（`DONE task=DRILL_02 role=scribe batch=R1 status=REVIEW_DONE evidence=review.lesson.md,review.consistency.md next=monitor`）；`git add` 点名 review.md review.lesson.md review.consistency.md done.*.md（及 findings.md 若改）并 commit `docs(relay-light): DRILL_02 R1 light review`；即停。wait → `done --agent scribe#1 --note "commit=<SHA>"`。
7. `add --node R1 --event node_close --agent monitor#1`。
8. `add --node R1 --event stage_result --agent monitor#1 --note "stage_id=DRILL_02:R#1 outcome=done lesson PASS consistency PASS review.md 汇总 commit=<SHA>"`。
9. pane 留着不关；打印 `MONITOR_NOTE <异常摘要或 none>` 与 `MONITOR_DONE stage=DRILL_02:R#1`，停止。

## 纪律（承接 DR-F-002/DR-F-004 与本预演 W1 实测）

- **静默超时**：worker `working` 但 pane 输出 >20 分钟无变化 → `agent_lost` → 同 pane 重拉 `#n+1`；attempt_max=3 用尽仍 NOT_RUN → `stage_result outcome=blocked` 交编排。
- **真提交核验**：`agent prompt` 后核 `state_change_seq` 变化 + `status` 转 `working`；停在输入框补 `send-keys enter` 再复验，终极判据 = `agent read` 输入框清空。先 `wait --until idle` 再 prompt。
- **checkpoint/blocked 边界**：checkpoint 只能落非终态 agent（A60）；`blocked → agent_lost` 合法；done 终态不得重拉（A113）；escalate 的 helper 只认 `decider=decider#<n>` / `strategist=strategist#<n>`。
