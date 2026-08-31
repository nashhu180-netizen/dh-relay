<!-- dh:v1 -->
# visual_map — DHR_69

## 步骤证据表

| 步骤 | 完成% | 要的证据 | 证据状态 |
|---|---:|---|---|
| E-1 普通 shell pane 形态 probe | 0 | `herdr pane get` / `agent get` 的 exit / 是否 JSON / `agent_status` 字段路径与取值域；产物 `evidence/herdr-command-shapes.json` | missing |
| fake `paneGet` 可独立编状态（E-2） | 0 | fake 返回形态对齐 E-1；`paneStatuses` 与 agent `statuses` 可分开 | missing |
| 红测 A/B/C/D/F | 0 | 六组行为失败终态（缺能力，不是测试写错） | missing |
| 观测层交叉核对 + detail 三键 | 0 | `idle+blocked` 派生 blocked；非 idle 时 paneGet 次数=0 | missing |
| recovery 先观测再决定是否发指令 | 0 | blocked 时 sent=0；离开 blocked 后 sent=1 | missing |
| 持续不一致升级 Attention | 0 | T 后恰一条 `conflict_escalation=idle_blocked`；不放行、不判失败 | missing |
| Codex `agent_not_ready` 负例 | 0 | argv 与行为逐字不变 | missing |
| 卫生与范围 | 0 | 允许路径精确比对；`git diff --check`；凭据形态扫描 | missing |
