<!-- findings.md — RLT_18 问题清单；范围外发现只登记，不顺手修改。 -->
# findings — RLT_18

## 问题

| ID | 级别 | 问题 | 证据 | 处理 | 状态 |
|---|---|---|---|---|---|
| F-001 | 风险（前置豁免） | 用户 2026-09-23 豁免 RLT_13/RLT_17 前置：RLT_17（Linux 双主控取证）将在带 watch 的 adapter 上跑，而非 DevPlan 原排序「前四批先证无 watch 前台回退」。 | DevPlan RLT_18 任务行备注、「实施提示」末句；`dispatch/README.md` D-start 条 | 本卡 adapter 保留并写明无 watch 回退（batch 2 R-A83-8）；RLT_17 开跑时需知悉 | 已登记 |
| F-002 | 挂起（前置豁免） | 本机只有 Linux：Windows 两副本（`%USERPROFILE%/.claude|.codex/skills/relay-light/**`）同步与 `HC-RL-A125` 终局回归（两机 `--all` 四目标哈希一致）无法在本卡完成。 | DevPlan RLT_18「实施提示」；design/01 A125 | 挂起待 Windows 机；Linux 两副本由 orchestrator 收口时另取用户授权同步 | 挂起 |
| F-003 | 风险（前置豁免） | `verify(relay-light):` 可能被 dev-harness 模块级钩子拦截（同 RLT_27 F-001）→ 本卡最多到「待验收」。 | `dispatch/README.md` D-start 条 | 收口时如实记录，不绕过钩子 | 已登记 |
| F-004 | P2（范围外） | `tools/relay-light/skill/SKILL.md` 硬规则 8「watch 未实现时不得结束回合空等」与「放弃项」中「不做 watch 推送的实现；watch 未实现时一律走前台 `wait` 回退」在本卡 watch 落地后将过期；SKILL.md 不在 RLT_18 允许路径。 | SKILL.md 硬规则 8、「放弃项」第 5 条；DevPlan RLT_18 允许路径 | 不在本卡改；交 orchestrator 路由（后续卡或用户裁决扩界） | 待路由 |
| F-005 | 信息 | 现有 `test_relay_log.py::test_a21_wait_receiver_and_three_methods` 断言 adapter 含「未实现」；batch 2 改写 adapter 后该断言语义过期，计划内替换为不弱于原意的新断言（task_plan R-A83-9）。 | test_relay_log.py 约第 6293–6307 行 | batch 2 承接 | 计划内 |

## design 解读（待 plan-review 确认）

task_plan §2 D1～D11 为本计划对 design §3.6 未冻结机制的解读，不改 design。
