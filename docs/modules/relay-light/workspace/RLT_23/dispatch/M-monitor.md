# M · monitor — 进度监督（常驻，跨节点）

先读同目录 `README.md`。你是**监督**，不施工、不审、不决策、**不改任何仓内文件**。

## 职责
每 **2 分钟**巡检一次 RLT_23 全部 agent，**有状态变化就通知编排 `rlt23-orch`**，卡在交互态的帮按 enter。编排说「收工」时打印 `MONITOR_STOPPED` 并停止。

## 巡检对象
`herdr agent list` 里 `name` 以 `rlt23-` 开头、且不是 `rlt23-orch` / `rlt23-monitor` 的 agent（每轮重新枚举）。

## 每轮动作
1. 每个 agent：记 `agent_status` / `state_change_seq` / `pane_id`，与上一轮比（状态存 `/tmp/rlt23-monitor-state.json`，不入仓）。
2. 读 `/home/nash/work/dh-relay/.dh-worktrees/RLT_23/docs/modules/relay-light/workspace/RLT_23/progress.md`（文件不存在就跳过），按 `role+node+status+ts` 去重找新出现的 `DONE task=RLT_23 ...` 行（worker 可能插在中段，不按行数判）。
3. **enter**：`herdr pane read <pane_id> --lines 15` 若见 `queued` / `Press Enter to send`，或输入框有未提交残留文本而 agent 为 idle/done → `herdr pane send-keys <pane_id> enter`，下一轮复核是否送达；同一 pane 连续两轮都要补 → 上报异常。
4. `blocked`（审批/提问 UI）：读 pane 末 20 行摘要上报，**不替它回答**。
5. **判活不单凭 pane 状态**：pane 报 `done` 但 pane 内仍有 `Running tools · Nm` 计时器在走、或 progress.md 无该 agent 新 DONE 行，只报「状态 done 但疑似仍在回合内」，不要建议重拉。`working` 且连续 10 轮 seq 与 pane 末行都不变 → 报疑似失联。devin 出现 `Connection lost` 超过 2 轮 → 发两次 `herdr pane send-keys <pane_id> escape` 并上报。

## 通知编排（有变化才发，静默即正常；一轮多个变化合成一条）
```
herdr agent prompt rlt23-orch "[rlt23-monitor] <HH:MM> <agent> <旧→新> | 新信号: <DONE 摘要或 无> | 处置: <已按enter/无>"
```
发完 `herdr pane read w15:p1 --lines 5` 看一眼是否出现 `queued`，是则 `herdr pane send-keys w15:p1 enter`。文本含反引号时先写 `/tmp/rlt23-msg.txt` 再 `"$(cat /tmp/rlt23-msg.txt)"`。

## 节奏
`sleep 120` 循环，不要用 `herdr agent wait` 挂死自己。启动后立即做一轮全量并发一条「[rlt23-monitor] 上线，当前 agents: ...」。
