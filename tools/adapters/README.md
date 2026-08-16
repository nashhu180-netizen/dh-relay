# Relay terminal adapter v1

Adapter 只翻译终端宿主动词，不持有业务状态、不判断代码质量，也不提供人工输入 API。

六个动词：

- `launch(receipt, node, run) -> { ok, session_id?, reason? }`：必须使用 receipt 指定的精确 session 句柄。
- `probe(session_id) -> { ok, terminal_state?, probe_error, reason? }`：探测精确 session。
- `suspend(session_id) -> { ok, reason? }`：P1 Runner 不调用。
- `resume(session_id) -> { ok, reason? }`：P1 Runner 不调用。
- `stop(session_id) -> { ok, reason? }`：回收精确 session。
- `emit_observation(run) -> [{ session_id, terminal_state }]`：吐出宿主主动观测，可为空。

`fake-adapter.ps1` 消费静态 `launches[]` 剧本。每次 launch 取得一盘 `probes[]` 磁带；磁带项是终端状态或 `{ "probe_error": true }`，用尽后重复末项。`on_stop` 可将磁带替换为 `exited`，`host_observations[]` 可按 probe 序号吐出宿主事件。

真实 `psmux` adapter 由 DHR_03 接入，语义如下。

## psmux adapter

`psmux-adapter.ps1` 实现同一组六动词，并保持与 fake adapter 完全相同的九键外形。
每次 launch 把 receipt 的 `session_id` 映射为 `relay-<run>-<session>`，同时登记
`session_name`、psmux session/pane ID、pane/client PID 和精确窗口标题。

存在性只由 `list-sessions` 输出中的 `session_name` 大小写全等判定；同名多行会
fail closed。不能用前缀、猜 PID 或标题代替句柄。可见且可交互要求 attached 数量
至少为 1，并且 EnumWindows 找到标题全等的可见顶层窗口。

拉起不走 `attach`：本机 psmux `attach -t <name>` 无视目标、总接到当前会话（DHR_03 F-016），所以可见窗口进程直接执行 `psmux new-session -s <name> -n <node> -- <cmd>`（非 -d）拥有会话，adapter 只轮询会话出现、设标题、等 attached 与可见。

回收必须执行 `kill-session -t <裸 session 名>`，随后轮询全等不存在。
本机 psmux 对 `-t =<name>` 会返回成功却不杀会话，因此该写法明确禁用。
adapter 不提供人工输入通道；P1 的 suspend/resume 固定返回 `not-used-in-p1`。

running/idle 判据是**屏幕内容指纹**：probe 对 `capture-pane -p` 文本 + `list-panes` 的
`cursor_y|cursor_x|history_size` 取 SHA-256，与 registry 里的 `activity_fingerprint` 比较；
变了 → `running` 并写回指纹与 `activity_seen_at`，没变且沉默超过 `IdleAfterSeconds` → `idle`。
不用 psmux 的 `#{window_activity}`：实测它只在建会话时写一次、不随 pane 输出更新（DHR_03 F-009）。
`AttachDeadlineSeconds`/`StopDeadlineSeconds` 按负载下 psmux CLI 单次 0.5～3.7s 的实测定为 90/30（首版 30/15，dogfood run2 在 88% 负载下 attach 超时后再放宽·F-014）。

失败分支与失联（DHR_03 复核返工·F-022）：
- launch 任一失败分支都不留孤儿：会话已建则裸名 kill；阶段1（等会话出现）失败/超时还会经 `ClientStopper` 尽力停掉窗口进程；`LaunchCommand`/`ClientLauncher`/registry 落盘抛异常一律收敛为 `psmux-command-failed`，不穿透宿主。
- 列表缺席 ≠ 退出：probe 与 stop 都用 `ProcessProbe` 交叉核对 pane 进程——probe 见"列表无它但进程活"报 `probe_error psmux-command-failed`（有界）；stop 见同样情形照样 kill，并按"列表消失 ∧ 进程消失"确认，只有两者都不在才算 `unknown-session`/`exited`。

可注入缝（生产默认值都在闭包内）：`Exec`（psmux 进程）、`Clock`、`WindowProbe`（EnumWindows 标题全等）、`ProcessProbe`（pane 进程存活）、`ClientLauncher`（窗口进程，默认 `ProcessStartInfo.ArgumentList` 逐参启动 psmux）、`ClientStopper`（默认 `Stop-Process -Force`）、`LaunchCommand`（默认 `pwsh -File relay-worker-entry.ps1 …`）、`Params`、`HandleRoot`。
