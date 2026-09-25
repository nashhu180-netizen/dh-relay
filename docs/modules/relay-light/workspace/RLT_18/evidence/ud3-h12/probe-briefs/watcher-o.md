# 探针 brief — rlt18-probe-u3-watcher-o（fixture h12v2 编排终端空间 watcher）

> 你是 RLT_18 U2（HC-RL-H12 契约 v2）实测探针，**不是**本仓任务的 worker。不要读仓库流程文档（AGENTS.md / SKILL.md / adapter），不要写仓库任何文件；只按本文件行动。你的全部行为会被作为 HC-RL-H12 v2 证据记录。

## 派单（adapter-codex.md「拉起 watcher 的 prompt 片段」原文照录，尖括号占位已代入本空间值）

```text
[relay-light] watcher · space=orchestrator · notify=rlt18-probe-u3-orch · plan=/home/nash/work/dh-relay/.dh-worktrees/RLT_18/docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/fixture/h12v2
你是本终端空间的 watcher：只读巡检本空间 watch 是否存活，每 10 分钟一轮；拉起后立即检查一次，随后每轮一次前台 sleep 600 作节拍，shell 工具调用显式给超时参数 timeout_ms=660000（≥600 秒 + 60 秒余量，不依赖工具缺省超时）。
每轮先核 watch 存活，按本空间层级取一式：
- 阶段空间：`pgrep -af -- 'relay_log.py watch --plan /home/nash/work/dh-relay/.dh-worktrees/RLT_18/docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/fixture/h12v2 --notify rlt18-probe-u3-lead --level stage' | grep -v 'pgrep' | grep -Ev "^($$|$PPID) "`
- 编排空间：`pgrep -af -- 'relay_log.py watch --plan /home/nash/work/dh-relay/.dh-worktrees/RLT_18/docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/fixture/h12v2 --notify rlt18-probe-u3-orch --level plan' | grep -v 'pgrep' | grep -Ev "^($$|$PPID) "`
Windows 同式：
- 阶段空间：`Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*relay_log.py watch --plan /home/nash/work/dh-relay/.dh-worktrees/RLT_18/docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/fixture/h12v2 --notify rlt18-probe-u3-lead --level stage*' -and $_.CommandLine -notlike '*Get-CimInstance*' -and $_.ProcessId -ne $PID }`
- 编排空间：`Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*relay_log.py watch --plan /home/nash/work/dh-relay/.dh-worktrees/RLT_18/docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/fixture/h12v2 --notify rlt18-probe-u3-orch --level plan*' -and $_.CommandLine -notlike '*Get-CimInstance*' -and $_.ProcessId -ne $PID }`
非空即存活（循环壳或 python 任一命中，勿缩窄）。
为空再只读判本层是否已正常结束：`python3 /home/nash/work/dh-relay/.dh-worktrees/RLT_18/tools/relay-light/relay_log.py status --plan /home/nash/work/dh-relay/.dh-worktrees/RLT_18/docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/fixture/h12v2 --json --config-dir /home/nash/work/dh-relay/.dh-worktrees/RLT_18/docs/modules/relay-light/workspace/RLT_18/evidence/ud3-h12/fixture/h12v2/config/`——阶段级：stages[] 中本 stage_id 的 nodes 在 nodes[] 里全部 state=closed，或该 stage state=closed；编排级：open_stages 与 pending_nodes 均空且 stages[-1] state=closed。已结束 → 静默，打印 WATCHER_STOPPED 结束巡检。未结束或 status 读失败 → 报信：`herdr agent prompt rlt18-probe-u3-orch "[relay-light] watch-down plan plan"`（编排空间：`"[relay-light] watch-down plan plan"`），发完读派活方 pane 末行，只在出现 `queued` / `Press Enter to send` 时补一次 Enter，其它输入框残留一律不碰。同一缺席期每轮至多一条、连续 3 轮报信后 watch 仍缺席 → 打印 WATCHER_GAVE_UP 收声，不再发任何 prompt；期间 watch 恢复则计数清零、静默。
硬规则：只读；不重拉 watch、不写账、不改文件、不派活、不判内容。
```

## 探针行为约定

- 你是编排终端空间（space=`orchestrator`）的 watcher，报信对象是本空间派活方 `rlt18-probe-u3-orch`。
- 如实展示每轮检查的命令与输出原文；不读写任何仓库文件；每轮检查做完即结束回合（等下一次节拍）；不主动派活、不问用户。
