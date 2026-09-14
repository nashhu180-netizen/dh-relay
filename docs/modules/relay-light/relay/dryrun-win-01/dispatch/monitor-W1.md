# monitor#1 · DRILL_02:W#1 · relay-light 监工派单（编排 → 监工）

你是 relay-light 计划 `dryrun-win-01` 的 **W 阶段监工 `monitor#1`**。协议全文在 `~/.codex/skills/relay-light/SKILL.md`（与仓内 `tools/relay-light/skill/SKILL.md` 逐字节相同），命令模板在 `references/adapter-claude-code.md`（本计划主控侧按 Claude 适配，账本一律 `--config-dir ~/.claude/skills/relay-light/`）。**你只管本阶段实例 `DRILL_02:W#1` 的节点 W1**，不跨阶段、不写 `stage_close`、不回头问用户。

- 仓/worktree：`D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\dryrun-rlt12-win`（分支 `dryrun/rlt12-win`）
- 计划目录：`docs/modules/relay-light/relay/dryrun-win-01/`（`relay_plan.md` + `relay_log.jsonl`）
- 账本程序：`python tools/relay-light/relay_log.py {add,status,lint} --plan docs/modules/relay-light/relay/dryrun-win-01 --config-dir ~/.claude/skills/relay-light/`（Windows 命令名是 `python`，不是 `python3`）
- 演习卡 DRILL_02 的定义（目标 / 允许路径 / 档位 light / 验收）：`docs/modules/relay-light/workspace/RLT_12/evidence/win-dry-run/README.md`
- 任务工作区（builder 要建的）：`docs/modules/relay-light/workspace/DRILL_02/`
- 硬规则：`wait` 返回时必须有接收者（watch 推送 / 前台阻塞循环 / 后台退出唤醒三选一）；watch 未实现时不得结束回合空等。凭据/密钥值永不写进 note、工件、账本。

## 你要按顺序做的事

1. `status` 看现场（应见 `plan_loaded`、`stage_start`、`monitor_launch` 三行）。
2. 账本 `add --node W1 --event node_start --agent monitor#1 --note "stage_id=DRILL_02:W#1"`。
3. 拉 builder：`herdr pane split --current --direction right --cwd "D:\MyFiles\ai-workflow\dh-relay\.dh-worktrees\dryrun-rlt12-win" --no-focus` 取 pane id → `herdr agent start builder --kind devin --pane <id> -- --model swe-2-max --permission-mode dangerous` → 账本 `add --node W1 --event agent_launch --agent builder#1 --note "launch=devin swe-2-max"` → `herdr agent prompt builder "<派活 prompt>"`。派活 prompt 首行必须是 `[relay-light] worker · node=W1 · agent=builder#1 · workspace=docs/modules/relay-light/workspace/DRILL_02`，正文照 adapter「派活 prompt 模板」：读 AGENTS.md 与演习卡 README；建七件套（brief / task_plan / progress / findings / lesson_candidates / review / execution_strategy，格式照 `docs/modules/relay-light/workspace/RLT_10/`）；task_plan 单批：仓根 `.gitignore` 追加忽略段（含 `__pycache__/`、`*.pyc`）、验证命令 `git check-ignore -v tools/relay-light/__pycache__/x.pyc`；允许路径只有 `.gitignore` 与 `workspace/DRILL_02/**`；commit；完成后打四行小结并在 progress.md 追加 `DONE task=DRILL_02 role=builder batch=W status=W_READY evidence=... next=monitor`，即停。
4. **等待**：`herdr agent wait builder --until done --until blocked --timeout 1200000` 前台阻塞；返回后先读产出判合格，再写账本：合格 `add --node W1 --event done --agent builder#1 --note "<产出摘要>"`；卡住则 `blocked`→`escalate`（本计划 W 无 decider，直接在 note 写原因并 `stage_result outcome=blocked` 交编排）。
5. builder done 后拉 plan-reviewer（trigger `on:done:builder`）：`herdr pane split` 新 pane → `herdr agent start plan-reviewer --kind codex --pane <新 pane> -- -m gpt-5.6-sol -c model_reasoning_effort=medium --sandbox read-only` → 账本 `agent_launch --agent plan-reviewer#1` → 派活（标头 `agent=plan-reviewer#1`，只读，产出 `workspace/DRILL_02/review.plan.md`，结论 PASS/FAIL，信号 `DONE task=DRILL_02 role=plan-reviewer batch=W status=<PASS|FAIL>`）→ 同样 wait → 读产出 → 账本 `done`。FAIL 则把 P1 项 prompt 回 builder（builder 同一实例，账本记 `checkpoint`，不新增 attempt），再让 plan-reviewer 复审，直到 PASS。
6. 双判据成立后 `add --node W1 --event node_close --agent monitor#1`。
7. `add --node W1 --event stage_result --agent monitor#1 --note "stage_id=DRILL_02:W#1 outcome=done builder 七件套+task_plan 已建、plan-review PASS"`。
8. 把 builder / plan-reviewer 的 pane 留着不关（编排关终端空间）；在终端打印 `MONITOR_DONE stage=DRILL_02:W#1`，停止。

## 两条新增纪律（承接 Linux 预演 DR-F-002 / DR-F-004）

- **静默超时**：worker 状态 `working` 但 pane 输出 **>20 分钟无变化** → 账本 `agent_lost` → 同 pane 关掉重拉 `#n+1`；`attempt_max=3` 用尽仍 NOT_RUN → 在写 `stage_result` 前先 `add --node W1 --event escalate --agent monitor#1 --note "decider=monitor#1 <原因>"`（A112 出口：worker 从未起来时由监工直接 escalate 交编排），再 `stage_result outcome=blocked` 交回编排。
- **真提交核验**：`herdr agent prompt` 发出后必须核「真提交」——`herdr agent get <名>` 看 `state_change_seq` 变化 + `status` 转 `working`；停在输入框（seq 不动 / agent_prompt_stalled）就补 `herdr agent send-keys <名> enter` 再复验，终极判据 = `herdr agent read` 看输入框已清空。拉起的 agent 先 `herdr agent wait <名> --until idle` 再 prompt。

每一步 `add` 若退出 2/3，把 stderr 原样贴到终端并停下，不要绕过校验。
