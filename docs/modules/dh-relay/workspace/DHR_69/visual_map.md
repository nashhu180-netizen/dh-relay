<!-- dh:v1 -->
# visual_map — DHR_69

## 步骤证据表

| 步骤 | 完成% | 要的证据 | 证据状态 |
|---|---:|---|---|
| E-1 普通 shell pane 形态 probe | 100 | `evidence/herdr-command-shapes.json`：路径 `result.pane.agent_status`，空壳 `unknown`（E-6901） | present |
| fake `paneGet` 可独立编状态（E-2） | 100 | `paneStatuses` 与 agent `statuses` 独立；字段路径对齐 E-1 | present |
| 红测 A/B/C/D/F | 100 | `dhr69-false-ready.test.mjs` 8/8（E-6902） | present |
| 观测层交叉核对 + detail 三键 | 100 | idle∧blocked 派生 blocked；working/done/unknown 的 paneGets=0 | present |
| recovery 先观测再决定是否发指令 | 100 | blocked 时 sent=0；离开 blocked 后 sent=1 | present |
| 持续不一致升级 Attention | 100 | 短 T 后恰一条 `conflict_escalation=idle_blocked`；不放行、不判失败；恢复后补发一次 | present |
| Codex `agent_not_ready` 负例 | 100 | paneGets=0，launch_blocked 与 DHR_68/C 一致 | present |
| 卫生与范围 | 90 | `git diff --check` 干净；改动落在允许路径；凭据扫描零命中；变异点待轮 2 选 | partial |
