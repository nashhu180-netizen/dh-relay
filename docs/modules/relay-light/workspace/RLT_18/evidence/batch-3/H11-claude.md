# H11 实测证据 — Claude stage-lead 忙碌时 watch 通知是否丢失

> 只取证不判。时刻为系统本地时（+08:00）。原始输出见 `raw/` 引用文件。
> fixture：`fixture/h11-claude`（stage `RLT18X:C#1`，node C1，账本 `coder#1` → Herdr `rlt18-probe-worker`；stage watch `--notify rlt18-probe-lead-claude --level stage`，python PID 3763341，tab w4B:tG，D13 重启循环内运行）。

## 布置

- 07:57:5x 阶段级 watch 启动；启动即向 lead-claude 推送 `[relay-light] coder#1 -> done`（worker 当时 done）。当时 pane 读显示 lead 已收并答「收到 coder#1 -> done 通知…结束回合」（done 7:57）；**该应答的 pane 原文未保存**，现存最早快照为 pane-lead-claude-0809.txt（08:09:58）。
- 08:06:22 向 worker 发 `TASK: sleep 150 && echo WORKER_WAKE`；向 lead-claude 连续发 `TASK: seq 1 200000000|300000000|400000000|500000000 | sha256sum` 制造忙碌（claude 对长命令一律后台化，忙碌以「排队 TASK 连串 + 后台命令完成事件」的连续短回合形态出现）。
- 轮询记录（raw/agent-status-poll.log）：worker `working` 08:06:28→08:08:50，`done` 自 08:09:10 起；lead-codex 同期 working；lead-claude 在 08:09:31 起的采样中 working/done 快速交替（微回合间采样到 done）。

## 关键观测（时刻 → 内容）

- ~08:08:5x–08:09:0x：worker done → h11-claude watch 的 wait 返回 → 向 lead-claude 发 `[relay-light] coder#1 -> done`。
- raw/pane-lead-claude-0809.txt（08:09:58 快照）：转写中 `❯ [relay-light] coder#1 -> done`（第 4 行）已随 `Ran 1 shell command`（第 6 行）作答「Watch 存活（pid 3779796）…」（第 8 行，done 8:09 于第 10 行）；当时输入框为空 `❯`（第 43 行）。同快照可见其后 `seq 300M/400M/500M` 与 `python3 … PYDONE` 后台命令完成事件按序处理（第 12–38 行）。
- raw/pane-lead-claude-t3.txt（08:15:48 快照，含更早滚动区）：同一转写区域此时呈**两条** `❯ [relay-light] coder#1 -> done` 按序出现（第 23、27 行），中间夹 `Ran 1 shell command`（第 25 行），随后作答（第 29 行，done 8:09 于第 31 行）——第二条渲染入转写的时间介于两次快照（08:09:58→08:15:48）之间，来源未定（见附带观测）。
- 08:09:3x 另一次 pane 读曾显示该通知以 `❯` 排队形态滞留输入区，**该次 pane 原文未保存**；排队预览机制另见 raw/orch-ghost-tick.txt 的同期记录。
- 即：忙碌窗口内到达的通知未被丢弃——在转写中按序出现并被后续回合处理。

## 附带观测（不作判定）

- lead-claude 收到的第二条 `coder#1 -> done`（pane-lead-claude-t3.txt 第 27 行）来源未定：poll log 自 08:08:30 采样起无 h12-stage python（见 H12.md 中间观测），候选为未被 20s 轮询采到的短命重拉、去重缺口或其它来源；已登记 findings 待复核项，不作结论。
- lead-claude 08:09 的「Watch 存活（pid 3779796）」：3779796 未出现于任何已存进程快照；其时 h12 阶段级 watch 已死（pane 08:08:14 关闭），不能排除与 08:14 同类（pgrep -f 自匹配，复现见 raw/pgrep-selfmatch.txt）；亦不能排除曾命中未被采样的短命进程——来源未定，如实记录。
- claude-code 对长命令自动后台化：`sleep 240`、`python3 -c "time.sleep(150)"` 均「Running in background」后即 done（pane 原文见 raw/pane-lead-claude-0809.txt / -t3.txt）。
- lead-claude 输入框多次出现未提交自然语言草稿（`check the output when it's done`、`Fine, run it in the background then`、`check on PYDONE`），源未确定，见 raw/orch-ghost-tick.txt。

## 原始文件

- `raw/agent-status-poll.log` — 20s 间隔四探针 agent_status + watch 进程快照（08:06:28–08:16）
- `raw/pane-lead-claude-0809.txt` — 08:09:5x lead-claude pane 全文
- `raw/pane-lead-claude-t3.txt` — 08:15:48 lead-claude pane 全文（含 stage-stalled 应答）
- `raw/orch-ghost-tick.txt` — 输入框滞留文本异常记录
- `raw/pgrep-selfmatch.txt` — pgrep -f 自匹配复现

## 人判结论

用户 2026-09-24 人判（orchestrator 逐字转录，非代签）：「H11 接受，后台 watch 可以」——忙时推送可靠性接受，不退回前台循环。知悉项：F-008 多发方向、codex 首通 pane 不可见（RQ-2/RQ-3）。
