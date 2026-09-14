<!-- dh:v1 -->
# plan review — RLT_21 W

## 审阅对象

- 角色：`rlt21-audit`，模式 A（只审 `task_plan`）。
- 候选 SHA：`73023033a14c99e25a3bd970a2637d813d4e9d3a`。
- 权威输入：DevPlan §RLT_21；design/01 §3.4、§4.2、§5.2.1、§7.3、§11.1 A69/A96/A107/A112/A113/A114/A137～A143；design/evidence/09 裁决表；RLT_12 Linux dry-run DR-F-001～006；现状 `relay_log.py`、`test_relay_log.py` 与 skill 五件。
- 边界：只审计划的 oracle 一致性与可执行性；未施工、未运行未来新增测试、未作 normal 正式复核。

## F-001 裁定 — A138 与 A69/A114

**裁定：案 A 是唯一一致的行为读法；B2 直接按案 A 施工，不再因 F-001 `BLOCKED`。**

依据如下：

1. A138 明定前序为同一 `(node, agent-name)` 连续 `attempt_max` 次 `agent_lost note=...NOT_RUN`，随后合法 `stage_result outcome=blocked ref=<agent>#<attempt_max>:agent_lost`，再由编排交用户；用户裁决后，监工才在被耗尽的该 agent 名下记录 `user_decision launch_fix=<token>`。因此这条 `user_decision` 不是 A114 decider 链或 strategist 链的一环，也不得强造 `blocked → escalate → decision`。
2. A69 仍然约束事件归属：`user_decision` 必须记在被阻塞/被触发的 agent 名下，不能记在 monitor、orchestrator、decider 或 strategist 名下。A138 只新增进入该事件的窄授权前置，不豁免归属闸。
3. A114 冻结的是 decider/strategist 两条决策链：decider 的 `user_decision` 受 mode 控制，strategist 的 `user_decision` 永远必需。把 A138 授权送进任一链都会增加 oracle 未要求的 helper/decision 事件并改变 mode 语义；把所有含 `launch_fix=` 的 `user_decision` 全局放行又会削弱 A60/A69/A114。两者均不一致。
4. 因而实现必须是窄分支：仅当当前事件 agent 精确对应 A137 blocked `ref=` 所指的最后一个耗尽实例，且该 `(node, agent-name)` 的基线组恰有连续 `attempt_max` 条 NOT_RUN、尚无既有 fix 组、token 恰一个且非空时，允许该 post-terminal `user_decision`；随后仍执行 A69 归属校验。授权只覆盖同 token 的下一组，单组最多 `attempt_max` 次，总启动数不超过 `2 * attempt_max`。

`findings.md` 的案 B 若仅表示把上述窄谓词抽成独立 helper，属于内部代码组织，可接受；它不能形成不同的事件序列、前置或归属语义。因此在合同层没有第二案，施工口径仍统一称为案 A。

## 七条 HC 与批次可执行性

| HC | task_plan 的行为命令与判据 | oracle 对照 | 结论 |
|---|---|---|---|
| A137 | B1 点名 lifecycle 新用例与既有 stage 收尾用例；覆盖 blocked/failed 正例、缺 ref/不存在/已覆盖三反例及 A112/A118 保持 | 与 §3.4、§5.2.1、A112/A137 逐项一致；A112 既有用例只把真正属于 A112 的 `done` 顺序断言收窄，未改 A118/A123 | PASS |
| A138 | B2 点名授权/预算与不可关闭原因两用例；覆盖无授权、同 token、异 token、第二组、总预算与分组计数 | 与 A107/A138 的单 token、单 fix 组、`≤2*attempt_max` 一致；F-001 已按上节裁定闭合 | PASS |
| A139 | B2 点名 status 精确 schema 与 plan launch/lint 无耦合用例 | 与 §4.2、A139 的运行事实、无 `plan_amend`、无 lint 比对一致 | PASS |
| A140 | B3 点名配置默认/显式/非法、注入时钟阈值、三模板结构用例 | 只产生 `ledger_silent` 提示，不写 error、不改 closable/loss_stop/attempt；20 分钟接收者节拍与 30 分钟静默提示明确并存 | PASS |
| A141 | B4 点名两 adapter 结构用例，冻结 start→idle→prompt→末行、Enter 一次、账本事件监听/两分钟告警及沙箱替代三件 | 与 A141 原文一致；告警不写账、不等于 `agent_lost`，替代启动明确要求先有 A138 用户授权 | PASS |
| A142 | B5 点名两条去 skip 负例、cancelled 正反归属及 A96/A97/A113/A114 保持用例 | mode 只作用 decider 链；strategist 与一般 cancelled 分离，`cancelled` 纳入 A69 而不破坏 A113 | PASS |
| A143 | B4 点名核心模板结构用例及 dry-run `review.plan.md` 复算 | light 的 P2 非阻断、四类 P1 与 heavy/normal 不变均有结构判据；历史复算见下表 | PASS |

五批均给出具体文件/符号、测试方法、有效行为 RED、GREEN 判据、批出口全量与四集合命令。allowed-paths 与 DevPlan 闭集一致；`install_skill.py`、`tools/tests/**`、design、DevPlan、`.gitignore`、其他 workspace 和用户级 skill 均明确排除。B1→小审→B2…B5→另派收束的节点边界清楚，施工者不会自行进入正式复核。

## A143 dry-run 预演复算

来源：首轮报告 commit `3a008365133f226df830a5f2db3ac3c60982eff4`，第二轮/最终报告 commit `c424afcc3d2a7d622efe2c4f035be85ec65d572c`。按 A143 把同源断言归并后：

| 复算项 | 原报告来源 | A143 新分级 |
|---|---|---|
| `progress.md` 多写入者、coder zero-context 残留与 builder 写 lesson 三个同源项 | P1-03、P1-03R、P1-04 | 归并为 1 个写入者边界 P1 |
| 目标文字从 `__pycache__/` 扩成双规则 | P1-01 的目标差异 | P2 |
| 双规则扩围缺少派单授权说明 | P1-01 的授权部分 | P2 |
| commit 授权来源说明缺失 | P1-02 | P2 |
| “只读/不改任何工件”与允许写本角色报告的措辞歧义 | P2-01 | P2 |

复算结果：**1 P1 + 4 P2**。这是对历史报告断言单元的重分级，不修改 dry-run 分支；B4 应把同表与两个源 commit 登记为 E-ID 证据。

## Findings

### P0

无。

### P1

无。

### P2

无。

### P3

无。

## 最终结论

**PASS**。task_plan 对 A137～A143 的命令、判据、批次、allowed-paths、RED→GREEN 与停止边界均可执行且与 oracle 一致。F-001 已形成确定裁决：B2 按案 A 的窄授权语义施工，不再 `BLOCKED`；内部可抽 helper，但不得改变案 A 的前置、事件归属或预算闭集。

DONE task=RLT_21 role=audit batch=W status=PASS evidence=review.plan.md next=orchestrator
