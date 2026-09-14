# rlt21-build — W 阶段 builder

你是 RLT_21 的 builder。**只做本文件这一件事**，不写程序、不写测试、不复核、不派活、不问用户。

## 先读
1. 仓根 `AGENTS.md`（宪章 + relay-light 编排协议段 + worker 铁律）。
2. `dispatch/README.md`（本卡协议、允许路径、信号）。
3. `docs/modules/relay-light/dev_plan/P1-RelayLight-开发方案.md` §RLT_21 卡全文。
4. `docs/modules/relay-light/design/01-RelayLight-产品设计与验收.md`：§11.1 A137～A143 原文与 A112（收窄后）、A96 / A114 / A69 / A107 / A113 原文；正文 §3.4 `stage_result` 行、§4.2 `launch` 列、§5.2.1「环境性 NOT_RUN 出口」、§7.3「静默超时」、§14 第 8 项。
5. `docs/modules/relay-light/design/evidence/09-交叉审核记录-RLT-A08-Linux预演回流.md`（发现→结论对照、两轮审核裁决——特别是 `launch_fix` 预算只能由 `user_decision` 开、`ledger_silent` 只是提示）。
6. 事实来源：`docs/modules/relay-light/workspace/RLT_12/evidence/linux-dry-run/README.md` DR-F-001～006；`workspace/RLT_07/findings.md` F-002 / F-003。
7. 现状代码：`tools/relay-light/relay_log.py`（`stage_result` 校验约 1959–2050 行、`agent_launch` attempt 校验、`loss_stop()`、`derive_status()` 的 `idle_seconds`、`DECISION_EVENTS`、`_note_tokens`、`RelayConfig.limits`）；`tools/relay-light/test_relay_log.py`（两条 `@unittest.skip` 负例 `test_a114_*`、既有 A112 / A113 / A107 用例——盘点哪些断言因 A112 收窄**必须**改、哪些必须保持）。
8. `tools/relay-light/skill/SKILL.md`、`references/adapter-claude-code.md`、`references/adapter-codex.md`、`dh-mapping.toml`（模板与配置落点）。
9. 模板：`docs/modules/relay-light/workspace/RLT_10/`（七件、证据账本、check/reviews 格式，normal 档）与 `RLT_09/`（分批 task_plan 写法）。

## 产出（全部落 `docs/modules/relay-light/workspace/RLT_21/`）
- `brief.md`：任务表、Issue #21、施工现场、目标、Zero-context 自查、**完成条件**（A137～A143 七条逐字承接 + 每条可执行验证命令）、边界、触及子系统。
- `task_plan.md`：**分批、worker 可照做粒度**。建议批次（可合并/拆分但说明理由）：
  - B1 **A137 + A112 收窄**：`stage_result` 按 outcome 分校验；`blocked`/`failed` 的 `ref=<agent>#<n>:<blocked|agent_lost>` 解析与三种非法 ref 反例；A112 既有用例改为 `done` 顺序颠倒；`stage_close` 对 blocked 仍拒 A118。
  - B2 **A138 + A139**：NOT_RUN 计数（连续 `attempt_max` 条 `agent_lost` 且 note 含 `NOT_RUN`）→ 第 `attempt_max+1` 条 `agent_launch` 拒；`user_decision`（该 agent 名下，note 含 `launch_fix=<token>`）后同 token `agent_launch` 接受、异 token 拒、第二组拒；`launch_fix=` 不触发 plan_amend、lint 不校验；`status --json` agent 条目暴露 `launch_fix`（无则 null）与不可关原因里的 NOT_RUN 计数/fix 组。注意：`user_decision` 现有归属/链校验（A69/A114）如何容纳「无 blocked 起头、由监工代记的 launch_fix 授权」——若 oracle 间有张力，写 findings 给两案不选边。
  - B3 **A140**：`limits.silence_timeout_min`（默认 30）加载；`status` 按账本静默标 `ledger_silent` 提示；SKILL.md 与两份 adapter 监工模板加「ledger_silent → 三处核验 → 三者均无变化才中断 → agent_lost silent_timeout → 同 pane 重拉」原文与「任一仍在变化不得中断」。
  - B4 **A141 + A143（skill 文档批）**：两份 adapter 加派活提交确认（start → wait idle → prompt → 读 pane 末行 → 必要时 send-keys Enter 一次）、编排事件监听与「监工空闲 ≥2 分钟且无新账本行」告警、沙箱型只读不可用时的替代预检三段；SKILL.md plan-reviewer 模板加 light 分级（纯措辞 P2 不阻断；allowed-paths / 写入者边界 / 节点阶段边界 / 验收命令与完成信号 四类 P1），并写明 heavy/normal 不变；用预演 `review.plan.md`（`git show dryrun/rlt12-linux:docs/modules/relay-light/workspace/DRILL_01/review.plan.md`）复算为 1 P1 + 4 P2 作为证据。结构检查用例落 `test_relay_log.py` 既有 skill 结构测试风格。
  - B5 **A142**：`decision_mode` 模式门（consult 缺 `user_decision` 写 `resume` 拒；auto 下 decider 链出现 `user_decision` 拒）与 `cancelled` 进入 `DECISION_EVENTS` 归属校验；RLT_07 两条 skip 去掉即绿；`cancelled` 归属正反各一例。
  每批：改哪个函数 / 加哪些用例名 / 验证命令 / 红→绿判据 / audit 小审输入清单。全量回归 + `pwsh run-relay-tests.ps1` 作为每批出口。
- `execution_strategy.md`：角色/写权限/禁止事项表（dispatch/README.md 六角色 + normal 三路复核），批次同步点，信号格式。
- `progress.md`：日志表首行记你本次 W 动作；「证据账本」「信号」节预留。
- `findings.md`、`lesson_candidates.md`：空表头 + 说明。
- `review.md`：normal 三路（代码轮 1 / 需求方向 / 教训）骨架，含 `<!-- dh:change-surface:v1 task=RLT_21 phase=predict -->` 块与独立复核区 / AI 提交区 / 需求对齐证据表 / 人类签名区。

## 硬边界
- 只写上述工作区文件；**不改 tools/ 下任何代码、不改 dev_plan、不改 design、不碰 `.gitignore`**。
- 发现合同冲突（A138 的 `user_decision` 授权与 A69/A114 归属链、A139 与 A121 plan_amend 边界、A140 与 A83 的 20 分钟节拍等）→ 写进 findings.md 并在 task_plan 标注，不自行选边。
- 完成后 `git add docs/modules/relay-light/workspace/RLT_21 && git commit -m "docs(relay-light): RLT_21 W workspace seven-piece and task_plan"`，在 progress.md 追加信号 `DONE task=RLT_21 role=builder batch=W status=W_READY evidence=<文件列表,commit> next=orchestrator`，再把同一行信号打印到终端，**停止**。
