<!-- dh:v1 · visual_map.md — 步骤证据表。🟢 边做边更新。 -->
# visual_map — DHR_04 隔离/禁改/落点守卫

## 步骤证据表 (Step Table)

| 步骤 | 完成% | 要的证据 | 证据状态 |
|------|------|---------|---------|
| 前置 · stage0 冻结驱动器可跑 | 100 | `D:\relay-stage0` 跑 P1 套件 → `RELAY ALL PASS (SKIPPED: 1)` | present |
| 批 A · 路径规范化 + 开发期隔离 | 0 | `relay-policy.ps1` 单套件 PASS（含前缀误吞与未知路径默认拒绝反例） | missing |
| 批 B · 业务仓内容白名单 | 0 | 单套件 PASS（含卡授权业务代码放行正例 + 未授权同目录拒绝反例 + 缺 authority 默认拒绝） | missing |
| 批 C · 落点守卫 + 两条不误杀反例 | 0 | 单套件 PASS（`docs/modules/relay/` 不误杀、run 前已存在目录不误杀、legacy 根新写无条件拒） | missing |
| 批 D · 黑盒 CLI + 真实临时 Git 仓联证 + 接线 | 0 | 全量 `RELAY ALL PASS`；CLI 退出码 0/1/2 三态；`git status` 与快照差集与 policy 结论三者一致 | missing |
| 收口 · 两轮换人复核 | 0 | `review-logs/review1.md`、`review-logs/review2.md`（实例/会话可区分） | missing |
| 收口 · 自举本身的观察 | 0 | relay 事件时间线 + 每棒 receipt/handoff（供 DHR_21 之前的过程参考，不作 H3/H4 验收证据） | missing |

> 证据状态四态：`missing / partial / present / waived`
