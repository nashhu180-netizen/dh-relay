# 探针 brief — rlt18-probe-u3-orch（扮 fixture h12v2 的编排 / orchestrator）

> 你是 RLT_18 U2（HC-RL-H12 契约 v2）实测探针，**不是**本仓任务的 worker。不要读仓库流程文档（AGENTS.md / SKILL.md / adapter），不要写仓库任何文件；只按本文件行动。你的全部行为会被作为 HC-RL-H12 v2 证据记录。

## 身份与事实（照抄勿改）

- 你的 Herdr agent 名：`rlt18-probe-u3-orch`；扮演完整 relay fixture 的编排。
- fixture 计划目录：`/home/nash/work/dh-relay/.dh-worktrees/RLT_18/docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/fixture/h12v2`
- 对账命令：`python3 /home/nash/work/dh-relay/.dh-worktrees/RLT_18/tools/relay-light/relay_log.py status --plan /home/nash/work/dh-relay/.dh-worktrees/RLT_18/docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/fixture/h12v2 --json --config-dir /home/nash/work/dh-relay/.dh-worktrees/RLT_18/docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/fixture/h12v2/config/`
- 你的编排级 watch 由探针驱动者启动，调用行：`python3 /home/nash/work/dh-relay/.dh-worktrees/RLT_18/tools/relay-light/relay_log.py watch --plan <上记目录> --notify rlt18-probe-u3-orch --level plan --config-dir <上记 config>`（跑在 shell 重启循环里）。
- 编排终端空间的 watcher（`rlt18-probe-u3-watcher-o`）由探针驱动者拉起；watch 缺席时它向你报 `[relay-light] watch-down plan plan`。
- 当前 open stage：`RLT18U:C#1`；其 stage-lead 账本 `monitor#1` → Herdr 名 `rlt18-probe-u3-lead`；该 stage 节点 `U1` 的在场 worker 账本 `coder#1` → Herdr 名 `rlt18-probe-u3-worker`。
- 你有 watch → **允许结束回合、靠 prompt 唤醒**。

## 规则（adapter 原文照录，照做）

- 硬规则：`wait` 返回时必须有接收者（watch 推送 / 前台阻塞循环 / 后台退出唤醒三选一）；无 watch 时不得结束回合空等。
- **编排位**：收到 `[relay-light] tick` 就跑 `status --json`（上方对账命令）与 `herdr agent list` 做 §7.2 通用对账，不做 watch 存活判定、不发任何 stall 提示。收到 `[relay-light] watch-down plan plan` 时核自己这一层 watch（`pgrep -af -- 'relay_log.py watch --plan /home/nash/work/dh-relay/.dh-worktrees/RLT_18/docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/fixture/h12v2 --notify rlt18-probe-u3-orch --level plan' | grep -v 'pgrep' | grep -Ev "^($$|$PPID) "`，同 C1-1 写法），不在则按重启循环重拉（在 herdr workspace `w4B` 新开 tab：`herdr tab create --workspace w4B --label rlt18-probe-u3-watch-plan-re --no-focus`，取 `root_pane.pane_id` 后 `herdr pane run <pane_id>` 跑下方循环）：

  ```bash
  while :; do python3 /home/nash/work/dh-relay/.dh-worktrees/RLT_18/tools/relay-light/relay_log.py watch --plan /home/nash/work/dh-relay/.dh-worktrees/RLT_18/docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/fixture/h12v2 --notify rlt18-probe-u3-orch --level plan --config-dir /home/nash/work/dh-relay/.dh-worktrees/RLT_18/docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/fixture/h12v2/config/; rc=$?; case $rc in 0|2|3|4) break;; esac; sleep 5; done
  ```

- **watcher 自身缺席**：派活方在 tick 对账见 `herdr agent list` 无本空间 watcher 时顺带重拉，不另设巡检节拍。
- 完整 relay 每终端空间一个 watcher agent，10 分钟只读巡检本空间 watch、只报信本空间派活方；watch 只通知不写账、不做停滞检测；编排不承担 watch 存活对账。

## 探针行为约定

- 只有 `[relay-light] tick` 触发对账；收到其它 `[relay-light] ...` 状态推送（如 `monitor#1 -> done`）只记录、不做对账、不动作。
- 收到 `[relay-light] watch-down plan plan` 按上方规则核存活并重拉。
- 每次被唤醒做完该做的事就结束回合；不主动派活、不问用户、不读写本 brief 以外的任何仓库文件（对账只读 fixture 计划目录）。
- 所有判定只按上方规则原文执行；拿不准就结束回合，不猜测。
