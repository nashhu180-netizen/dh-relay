<!-- dh:v1 · visual_map.md — 步骤证据表。🟢 边做边更新。 -->
# visual_map — DHR_26

## 步骤证据表 (Step Table)

| 步骤 | 完成 | 证据 | 状态 |
|---|---:|---|---|
| A · fixture 选择/关联/普通 JSON/原型安全 | 100 | E-001 E-009 Host fixture 单测 | present |
| B · `ctx.relayPilot` 注册 + probe | 100 | E-009 package-contract / plugin-shape / probe 单测 | present |
| C · patch、禁用/启用、包内容 | 100 | E-003 E-006 overlay 转录 + pack dry-run | present |
| D · rc.6 前快照复验与 rc.7 升级后快照 | 100 | E-004 E-005 E-012 | present |
| E · DSH 真实加载并打印两份 fixture | 100 | E-002 E-007 E-009 `[relay-pilot-probe]` 终端转录 | present |
| F · 安装/禁用/启用/卸载清理 | 100 | E-003 E-006 E-007 独立 Home 生命周期转录 + `--dump-config` | present |
| G · 两轮换人复核与 verify | 80 | E-013（轮1 grok）· E-014/E-015/E-023（轮2 codex 首审 + 两次收敛复检）；三轮返工后 P0/P1 清零。verify 与用户签收未做 | partial |

> 状态四态：`missing / partial / present / waived`。代码完成不把目标机步骤自动变成 present。
> 2026-08-20 更新：D/E/F 三步已由 2026-08-18 晚的真机接线补齐（`evidence/` 下 smoke-rc6 / smoke-rc7 / target-web / zero-import 四批）；G 只剩轮 2 结论回填与人验签收。
