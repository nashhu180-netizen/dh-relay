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

真实 `psmux` adapter 属于 DHR_03，不在本实现内。
