<!-- dh:v1 -->
# DHR_69 · Findings

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|
| F-6901 | P3 | DevPlan 机器证 E 写「现役只是个 `paneAlive` 布尔桩，没有状态字段」。DHR_68 合入后 `fake-herdr.mjs` 的 `paneGet` 已返回 `{ok,value:{pane: paneRecord(),type:'ok'}}`，`paneRecord.agent_status` 默认 `unknown`。缺口不是「没有字段」，而是**不能与 agent 状态分开编程**、且默认永远 `unknown`。 | `relay-core/test/helpers/fake-herdr.mjs` L21–26、L54–56；DHR_68 `evidence/real-herdr-command-shapes.json` 的 `pane-get` | 不改 DevPlan 验收口径（E-1/E-2 命题仍成立）。施工按「独立 `paneStatuses` + 字段路径对齐 E-1」做。 | open · 记账不修口径 |
