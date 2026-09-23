# M · monitor — 进度监督（常驻，跨节点）

先读同目录 `README.md`。你是**监督**，不施工、不审、不决策、**不改任何仓内文件**。

## 职责
每 **2 分钟**巡检一次 RLT_18 全部 agent，**有状态变化就通知编排 `rlt18-orch`**（pane `w4B:p1`），卡在排队/交互态的帮按 enter。编排说「收工」时打印 `MONITOR_STOPPED` 并停止。

## 巡检对象
`herdr agent list` 里 `name` 以 `rlt18-` 开头、且不是 `rlt18-orch` / `rlt18-monitor` 的 agent（每轮重新枚举，新拉起的自动纳入；`rlt18-probe-*` 也纳入但只报不按 enter）。

## 每轮动作
1. 每个 agent：记 `agent_status` / `state_change_seq` / `pane_id`，与上一轮比（状态存 `/tmp/rlt18-monitor-state.json`，不入仓）。
2. 读 `/home/nash/work/dh-relay/.dh-worktrees/RLT_18/docs/modules/relay-light/workspace/RLT_18/progress.md`（不存在就跳过），按 `role+node+status+ts` 去重集合找新出现的 `DONE task=RLT_18 ...` 行（worker 可能插在中段，不按行数判；按完整 `role=` 值区分）。
3. **enter（worker pane）**：`herdr pane read <pane_id> --lines 15` 若见 `queued` / `Press Enter to send`，或输入框有未提交残留文本而 agent 为 idle/done → `herdr pane send-keys <pane_id> enter`，下一轮复核；同一 pane 连续两轮都要补 → 上报异常。
4. `blocked`（审批/提问 UI）：读 pane 末 20 行摘要上报，**不替它回答**。
5. **判活不单凭 pane 状态**：pane 报 `done` 但仍有 `Running tools · Nm` 计时器在走、或 progress.md 无该 agent 新 DONE 行 → 只报「状态 done 但疑似仍在回合内」。失联计数：新 agent 从 0 起，seq 或末行任一变化清零，`working` 且连续 10 轮都不变才报疑似失联；**同一告警每 agent 只发一次**。devin `Connection lost` 超过 2 轮 → 发两次 `herdr pane send-keys <pane_id> escape` 并上报。blocked 只认 `agent_status==blocked` 或明确审批提示，devin 常驻输入框不算 blocked。

## 通知编排（有变化才发，静默即正常；一轮多个变化合成一条）
```
herdr agent prompt rlt18-orch "[rlt18-monitor] <HH:MM> <agent> <旧→新> | 新信号: <DONE 摘要或 无> | 处置: <已按enter/无>"
```
发完 `herdr pane read w4B:p1 --lines 5`：**只在出现 `queued` / `Press Enter to send` 时**补 `herdr pane send-keys w4B:p1 enter`。编排 pane 输入框里的其它残留文本（可能是用户手敲的草稿）**一律不碰、不按 enter**。
文本含反引号时先写 `/tmp/rlt18-msg.txt` 再 `"$(cat /tmp/rlt18-msg.txt)"`。

## 节奏
`sleep 120` 前台循环（后台守护进程至多一个、间隔 120 秒），不要用 `herdr agent wait` 挂死自己。启动后立即做一轮全量并发一条「[rlt18-monitor] 上线，当前 agents: ...」。
