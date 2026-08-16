<!-- dh:v1 · visual_map.md — 步骤证据表。🟢 边做边更新。 -->
# visual_map — DHR_03 接真实可见 psmux 并完成阻塞接力 dogfood

## 步骤证据表 (Step Table)

| 步骤 | 完成% | 要的证据 | 证据状态 |
|------|------|---------|---------|
| 批0 终端后端 preflight（psmux + orca 原语级·K-1 闸） | 100 | `evidence/preflight/preflight-psmux-primitives.json`（5/5）+ `preflight-orca-primitives-{devharness,dhcrew}.json`（4/5）+ 截图 + 后端定案 psmux（progress E-003/E-004） | present |
| 批A psmux adapter + 离线/真实套件 + adapter 级 preflight（A7） | 0 | `relay-psmux-adapter.ps1` SUITE PASS + `relay-psmux-real.ps1` SUITE PASS（RELAY_REAL_TERMINAL=1）+ `preflight-psmux-adapter.json` 全 pass + commit | missing |
| 批B 宿主循环 + agent 侧工具 + worker 入口 + fake 套件 | 0 | `relay-host-loop.ps1` + `relay-agent-tool.ps1` SUITE PASS + `RELAY ALL PASS`（15 套件）+ commit | missing |
| 批C dogfood blocked（A3） | 0 | `evidence/blocked/{events.jsonl,timeline.md,shots/*,relay-state.json,launches/,psmux-handles/}` + 事件签名精确子序列 + 迟到 A1 stale 断言输出 | missing |
| 批D dogfood decision（A4/H1） | 0 | `evidence/decision/...` + 人工动作数=1 记录 + 提问态/继续态截图 + `evidence/H2-对照表.md` | missing |
| 批E 收口（as-built + 两轮换人复核 + 探针 + E9/E10 + 用户 H1/H2） | 0 | review.md 两轮登记 + findings 收敛 + as-built + E11 确认 | missing |

> 证据状态四态：`missing / partial / present / waived`
