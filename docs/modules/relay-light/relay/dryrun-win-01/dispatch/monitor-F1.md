# monitor#1 · DRILL_02:F#1 · relay-light 监工派单（编排 → 监工）

你是 relay-light 计划 `dryrun-win-01` 的 **F 阶段监工 `monitor#1`**。协议在 `~/.codex/skills/relay-light/SKILL.md`（与仓内 `tools/relay-light/skill/SKILL.md` 逐字节相同），命令模板在 `references/adapter-claude-code.md`（账本一律 `--config-dir ~/.claude/skills/relay-light/`）。**你只管 `DRILL_02:F#1` 的节点 F1**，不写 `stage_close`、不问用户。

- 仓/worktree：`D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\dryrun-rlt12-win`（分支 `dryrun/rlt12-win`）；账本程序：`python tools/relay-light/relay_log.py {add,status,lint} --plan docs/modules/relay-light/relay/dryrun-win-01 --config-dir ~/.claude/skills/relay-light/`（Windows 用 `python`）
- **本计划是非正式 Windows 预演**：F 阶段**不 push、不建 PR、不合并、不改 DevPlan/设计文档**。交接只到「工作区 as-built 就绪」为止。
- F1 唯一 worker：scribe（devin `--model swe-2-medium --permission-mode dangerous`）。允许路径只有 `docs/modules/relay-light/workspace/DRILL_02/**`。
- 硬规则：wait 前台阻塞、非终态提前返回则续等；凭据值永不写进任何地方；`add` 退出 2/3 贴 stderr 停下。

## 顺序

1. `status`（W/C/R 三阶段 closed result=done；F#1 已 stage_start + monitor_launch）。
2. `add --node F1 --event node_start --agent monitor#1 --note "stage_id=DRILL_02:F#1"`。
3. 新 pane（`herdr pane split --current --direction right --cwd "D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\dryrun-rlt12-win" --no-focus`）→ `herdr agent start scribe --kind devin --pane <id> -- --model swe-2-medium --permission-mode dangerous` → `agent_launch --agent scribe#1 --note "launch=devin swe-2-medium"` → 派活（首行 `[relay-light] worker · node=F1 · agent=scribe#1 · workspace=docs/modules/relay-light/workspace/DRILL_02`）：
   - 读 brief / task_plan / progress / findings / lesson_candidates / review / check.C1.md 与账本 `status`；
   - 在 `progress.md` 末尾写「as-built」节：交付物（`.gitignore` 追加 `__pycache__/` 与 `*.pyc` 两条，commit `85af7fb`）、验收两条的证据 E-ID、复核结论（plan-review 复审3 PASS；R1 lesson/consistency 双 PASS，lesson 带 1 条 P2）、未合并说明（预演分支 `dryrun/rlt12-win`，不进 master、不 push/PR）；
   - 在 `findings.md` 补一节「交接状态」：开放项/无；`lesson_candidates.md` 状态列与 R1 处置一致；
   - 写 `done.scribe.md`（F1 行：`DONE task=DRILL_02 role=scribe batch=F1 status=HANDOFF_READY evidence=progress.md#as-built,commit=<SHA> next=monitor`）；
   - `git add` 点名改过的文件并 commit `docs(relay-light): DRILL_02 F1 as-built handoff (dry run, no PR)`；打四行小结即停。
4. `herdr agent wait scribe --until done --until blocked --timeout 1200000` 前台阻塞；读产出 → `done --agent scribe#1 --note "handoff_ready commit=<SHA>"`。
5. `add --node F1 --event node_close --agent monitor#1`。
6. `add --node F1 --event stage_result --agent monitor#1 --note "stage_id=DRILL_02:F#1 outcome=done as-built 就绪 未 push/PR（预演） commit=<SHA>"`。
7. pane 留着不关；打印 `MONITOR_NOTE <异常摘要或 none>` 与 `MONITOR_DONE stage=DRILL_02:F#1`，停止。

## 纪律（同前序阶段）

- 静默 >20 分钟无输出 → `agent_lost` → 同 pane 重拉 `#n+1`；attempt_max=3 用尽仍 NOT_RUN → `stage_result outcome=blocked` 交编排。
- `agent prompt` 后核真提交：seq 变化 + status 转 working；停输入框补 `send-keys enter`；终极判据 `agent read` 输入框空。先 `wait --until idle` 再 prompt。
- checkpoint 只落非终态 agent；`blocked → agent_lost` 合法；done 不得重拉。
