# wf-analytics-platform 接力计划总入口

每个子目录 `<模块>/<plan_id>/` 一份计划：`relay_plan.md`（计划）、`relay_log.jsonl`（账本，运行时生成）、`orchestrator-prompt.md`（人拉编排的派单文案）、`config/`（本计划 roles.toml + dh-mapping.toml，所有 relay_log 调用的 `--config-dir`）。

## RLT_29 试跑：监工拆成「阶段主控 + watcher」

2026-09-21 用户决定先用 agent 试跑拆分，跑通后再把 watcher 换成脚本。本轮不改 SKILL.md 角色表，只靠本目录各计划的 `config/roles.toml` 多出一个 `[watcher]` 段，以及下面的分工约定。

| 阶段主控（roles.toml:monitor，账本身份 `monitor#<n>`） | watcher（roles.toml:watcher，账本身份沿用同一个 `monitor#<n>`） |
|---|---|
| 写派单 prompt 文件、开 tab、起 agent、发指针 | 派单后读 pane 末行确认投递；出现 queued 或输入框未清空补 `send-keys enter` 并复核 |
| 读 check / blocked / decision 文件，决定 checkpoint、decider、escalate 走向 | 对每个在场 agent 挂 `herdr agent wait <名> --until idle`，返回后核 pane 末行与允许路径产出 |
| attempt / 返工轮数到顶时拉 strategist | 按观察结果写账本：`agent_launch`（主控起完后由 watcher 落账）、`done`、`node_close`（双判据成立时） |
| 拉 planner-amend、跑 before/after 守门 | ledger_silent 三条件（Herdr 非 working、pane 无 Running tools、账本无新行）同时成立才写 `agent_lost` 并通知主控重拉 |
| 汇总并写 `stage_result` | `monitor_restart` 时盘点在场 agent 并回报主控 |

规则：watcher 只写上面列的五种事件，不写 `checkpoint` / `blocked` / `escalate` / `decision` / `stage_result`；判断类信号一律回报主控，由主控落账。主控起 watcher 的派单文案：

```text
[relay-light] watcher · plan=<plan_dir> · stage=<stage_id> · identity=monitor#<n>
读：<plan_dir>/README.md「RLT_29 试跑」分工表、<plan_dir>/relay_plan.md 本阶段节点与 agent 表。
你只做分工表右栏的机械动作；每条账本写入用 python3 <RELAY_LOG> add ... --config-dir <plan_dir>/config/。
凡是要读产出内容做判断的，不写账本，把观察结果打一行发给主控 pane（herdr agent prompt <主控名> "<一行观察>"）。
`wait` 返回后先核 pane 与账本再动作；不得凭 pane done 单独判 agent_lost。凭据永不写入任何工件。
```
