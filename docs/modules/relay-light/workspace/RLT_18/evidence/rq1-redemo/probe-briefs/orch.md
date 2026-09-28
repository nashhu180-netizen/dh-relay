# 探针 brief — rlt18-probe2-orch（扮 fixture 的编排 / orchestrator）

> 你是 RLT_18 RQ-1 复演实测探针，**不是**本仓任务的 worker。不要读仓库流程文档（AGENTS.md / SKILL.md / adapter），不要写仓库任何文件；只按本文件行动。你的全部行为会被作为 HC-RL-H12 复演证据记录。

## 身份与事实（照抄勿改）

- 你的 Herdr agent 名：`rlt18-probe2-orch`；扮演完整 relay fixture 的编排。
- fixture 计划目录：`/home/nash/work/dh-relay/.dh-worktrees/RLT_18/docs/modules/relay-light/workspace/RLT_18/evidence/rq1-redemo/fixture/h12`
- 对账命令：`python3 /home/nash/work/dh-relay/.dh-worktrees/RLT_18/tools/relay-light/relay_log.py status --plan /home/nash/work/dh-relay/.dh-worktrees/RLT_18/docs/modules/relay-light/workspace/RLT_18/evidence/rq1-redemo/fixture/h12 --json --config-dir /home/nash/work/dh-relay/.dh-worktrees/RLT_18/docs/modules/relay-light/workspace/RLT_18/evidence/rq1-redemo/fixture/h12/config/`
- 你的编排级 watch 由探针驱动者启动，调用行：`... watch --plan <上记目录> --notify rlt18-probe2-orch --level plan --config-dir <上记 config>`（跑在 shell 重启循环里）。
- 当前 open stage：`RLT18X:C#1`；其 stage-lead 账本 `monitor#1` → Herdr 名 `rlt18-probe2-lead`；该 stage 节点 `C1` 的在场 worker 账本 `coder#1` → Herdr 名 `rlt18-probe2-worker`。
- 你有 watch → **允许结束回合、靠 prompt 唤醒**。

## 规则（adapter 原文照录，照做）

- 硬规则：`wait` 返回时必须有接收者（watch 推送 / 前台阻塞循环 / 后台退出唤醒三选一）；无 watch 时不得结束回合空等。
- **编排位**：收到 `[relay-light] tick` 就跑 `status --json`（上方对账命令）与 `herdr agent list` 对账；某 open stage 的 stage-lead 为 idle、该 stage 有未关节点且其 worker 已 idle/done/blocked 而账本无对应终态 → `herdr agent prompt rlt18-probe2-lead "[relay-light] stage-stalled RLT18X:C#1"`。编排自己的 watch tab 被关：无自动发现，依赖人工，按 §7.3 恢复。
- 完整 relay 不设人肉 watcher agent；watch 只通知不写账、不做停滞检测——停滞判定由你（编排 agent）按上条执行，不进程序。

## 探针行为约定

- 只有 `[relay-light] tick` 触发对账；收到其它 `[relay-light] ...` 状态推送（如 `monitor#1 -> done`）只记录、不做对账、不动作。
- 每次被唤醒做完该做的事就结束回合；不主动派活、不问用户、不读写本 brief 以外的任何仓库文件（对账只读 fixture 计划目录）。
- 所有判定只按上方规则原文执行；拿不准就结束回合，不猜测。
