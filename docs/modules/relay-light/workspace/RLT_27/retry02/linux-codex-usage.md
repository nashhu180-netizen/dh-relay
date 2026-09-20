# RLT_27 retry02 — Linux Codex / Herdr 运行说明

本说明记录 2026-09-20 ThinkPad Linux 当前实况，只覆盖 RLT_27 的最小 W/C/R/F 试跑。它不是通用 Herdr 能力背书，也不把进程状态当成 relay-light 的 durable 完成证据。

## 本次运行身份与路径

- retry：`retry02`
- coordinator correction / retry intervention：`1`
- attempt01：`preserved`；旧账本、旧输出和旧 monitor 报告保持原样，不 resume、不重写、不把旧 worker 用于 retry02
- Herdr session：`rlt27-linux-codex-01`
- worktree / 所有 agent cwd：`/home/nash/work/dh-relay/.dh-worktrees/RLT_27`
- retry workspace：`/home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/workspace/RLT_27/retry02`
- retry plan-dir：`/home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/relay/rlt27-linux-codex-01/retry02`
- dedicated config-dir：`/home/nash/work/dh-relay/.dh-worktrees/RLT_27/docs/modules/relay-light/workspace/RLT_27/config`
- Herdr client：`/home/nash/.local/bin/herdr`，实测 `herdr 0.9.0`
- Codex launcher：`/home/nash/.local/bin/codex`，解析到 `/home/nash/.codex/packages/standalone/releases/0.155.1-x86_64-unknown-linux-musl/bin/codex`，实测 `codex-cli 0.155.1`
- Python：`/usr/bin/python3`，解析到 `/usr/bin/python3.12`，实测 `Python 3.12.3`
- Herdr config：`/home/nash/.config/herdr/config.toml`
- 本 session socket：`/home/nash/.config/herdr/sessions/rlt27-linux-codex-01/herdr.sock`

`roles.toml` 当前把 planner、orchestrator、monitor、builder、plan-reviewer、coder、scribe、checker、decider、reviewer、strategist 的 `launch` 都设为 `codex`；本次不传新模型，不覆盖用户全局 Codex 配置。

## 当前已核实的现场

以下命令均为只读：

```bash
command -v herdr codex python3
readlink -f /home/nash/.local/bin/herdr
readlink -f /home/nash/.local/bin/codex
herdr --version
codex --version
python3 --version
herdr --session rlt27-linux-codex-01 status --json
herdr --session rlt27-linux-codex-01 workspace list
herdr --session rlt27-linux-codex-01 agent list
```

核验时 session server 为 `running`，client/server 均为 `0.9.0`、protocol `22`，兼容且不需要 restart。retry02 的 C 阶段 workspace 为 `w4` / `RLT27-retry02-C`，含三个 pane；monitor `r27b-c-monitor` 在 `w4:p1`，coder `r27b-c-coder` 在 `w4:p2`，checker `r27b-c-checker` 在 `w4:p3`，三者 cwd 均为上述 worktree。`w4`、`p1` 等编号是本 session 的本次现场值，不可写死到下一次运行。

## 创建空间并启动 Codex

主控或当阶段 monitor 执行；worker 不执行这些命令。全局参数 `--session` 必须放在子命令前，避免误操作其他 session。

```bash
RLT27_SESSION='rlt27-linux-codex-01'
RLT27_WT='/home/nash/work/dh-relay/.dh-worktrees/RLT_27'

herdr --session "$RLT27_SESSION" workspace create \
  --cwd "$RLT27_WT" \
  --label 'RLT27-retry02-C' \
  --no-focus

herdr --session "$RLT27_SESSION" workspace list
herdr --session "$RLT27_SESSION" pane list --workspace '<workspace_id>'
```

`workspace create` 先给出根 shell pane；monitor 使用根 pane。需要 coder/checker 时，由 monitor 在该 workspace 内对精确 pane 做 `pane split`，然后重新 `pane list` 读取真实 pane id，不根据旧运行猜编号：

```bash
herdr --session "$RLT27_SESSION" pane split '<root_pane_id>' \
  --direction right --ratio 0.5 --cwd "$RLT27_WT" --no-focus
```

在确认目标 pane 处于交互式 shell prompt 后启动 Codex。`agent start` 的成功判据只是同一终端内检测到 Codex 且可交互，不代表任务已经执行或完成。

```bash
herdr --session "$RLT27_SESSION" agent start 'r27b-c-coder' \
  --kind codex \
  --pane '<coder_pane_id>' \
  --timeout 300000

herdr --session "$RLT27_SESSION" agent get 'r27b-c-coder'
```

worker prompt 必须含四字段 relay-light 标头、精确 retry02 workspace、允许写入路径和唯一完成信号；不得复用 attempt01 的 agent。将 prompt 放进 shell 变量时不要把任何凭据值写入 prompt、工件或终端证据。

## 前台等待

无 watch。本次必须让调用者在前台接收返回，不能发起等待后结束回合。对 idle/ready 的 agent，可把提交与等待合为一个前台命令：

```bash
herdr --session "$RLT27_SESSION" agent prompt 'r27b-c-coder' "$RLT27_PROMPT" \
  --wait \
  --until idle \
  --until done \
  --until blocked \
  --timeout 1800000
```

若 prompt 已由当前接收者成功提交，则用独立的前台等待：

```bash
herdr --session "$RLT27_SESSION" agent wait 'r27b-c-coder' \
  --until idle \
  --until done \
  --until blocked \
  --timeout 1800000
```

`agent prompt --wait` 不跟踪 turn：目标若提交前已是 `working`，另一个正在进行的 turn 结束也可能满足等待条件。因此，不向 working agent重复提交 prompt；先用 `agent get` 核实状态。超时或 `blocked` 是实际阻塞，不静默重试、不关闭安全机制，由 monitor 按协议记录并路由。

## 完成判据

Herdr 返回 `idle`、`done` 或 `blocked` 只是终端检测状态，不是 durable 完成。C1 coder 的完成必须同时满足：

1. 本文件已落在 `docs/modules/relay-light/workspace/RLT_27/retry02/linux-codex-usage.md`；
2. 唯一信号 `docs/modules/relay-light/workspace/RLT_27/retry02/evidence/done.C1.coder.md` 已写明 `PASS` 或结构化 `BLOCKED`；
3. 信号明确记录 `retry02`、`intervention=1`、`attempt01=preserved`，以及偏离/findings；
4. worker 在终端输出“做了什么 / 证据 / 偏离与 findings / 下一步”四行后立即停止，不等 `node_closed`；
5. monitor 读取产物和唯一信号后，才可代表 coder 写账本终态。worker 不写账本。

C1 节点完成还需要独立 checker 对真实环境与文档判定 PASS，并由 monitor 按计划的 close predicate 写 `node_close`；coder 的 Herdr `done` 不能替代 checker 或账本闭合。

## 已知限制与未验证能力

- 本轮使用现有用户默认 Codex 启动模式；没有改变 permission mode。不得声称 restricted sandbox 已验证。
- 历史 Linux `bwrap` 失败不能证明本轮必然失败；本轮也没有专门执行 restricted-sandbox / `bwrap` 验证。
- `agent start` 只验证交互就绪；`agent wait` 和 `agent prompt --wait` 只验证检测状态，不验证目标文件内容、唯一完成信号、checker 结论或账本时序。
- `agent prompt --wait` 对已经 working 的目标不提供 turn 归属保证。
- workspace/pane id 是 session-local 动态值；只能从本 session 的 `workspace list`、`pane list`、`agent get` 重新读取。
- watch 推送未实现，本轮仅验证前台等待路径；后台退出唤醒未验证。
- retry02 在写本文时只运行到 C1；R/F 闭环、超时恢复、agent lost/restart、权限拒绝后的完整 escalation、远程 SSH Herdr、非 Codex agent、normal/heavy recipe 均未由本文验证。
- 前置 `224` 个 Python 测试的自然退出 0 是 retry02 工作区记录的既有 Linux 证据，本 C1 未重跑 408 秒基线，也不把它外推为 Herdr 端到端闭环成功。
- 本轮不验证或授权 Git、commit/push/PR/merge/verify、全局 Skill 修改、生产代码修改、权限放宽或资源清理。
