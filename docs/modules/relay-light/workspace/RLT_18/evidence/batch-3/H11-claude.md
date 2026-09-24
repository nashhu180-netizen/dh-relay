# H11 实测证据 — Claude stage-lead 忙碌时 watch 通知是否丢失

> 只取证不判。时刻为系统本地时（+08:00）。原始输出见 `raw/` 引用文件。
> fixture：`fixture/h11-claude`（stage `RLT18X:C#1`，node C1，账本 `coder#1` → Herdr `rlt18-probe-worker`；stage watch `--notify rlt18-probe-lead-claude --level stage`，python PID 3763341，tab w4B:tG，D13 重启循环内运行）。

## 布置

- 07:57:5x 阶段级 watch 启动；启动即向 lead-claude 推送 `[relay-light] coder#1 -> done`（worker 当时 done），lead 8:57 前已收并答「收到 coder#1 -> done 通知…结束回合」（done 7:57）。
- 08:06:22 向 worker 发 `TASK: sleep 150 && echo WORKER_WAKE`；向 lead-claude 连续发 `TASK: seq 1 200000000|300000000|400000000|500000000 | sha256sum` 制造忙碌（claude 对长命令一律后台化，忙碌以「排队 TASK 连串 + 后台命令完成事件」的连续短回合形态出现）。
- 轮询记录（raw/agent-status-poll.log）：worker `working` 08:06:28→08:08:50，`done` 自 08:09:10 起；lead-codex 同期 working；lead-claude 在 08:09:31 起的采样中 working/done 快速交替（微回合间采样到 done）。

## 关键观测（时刻 → 内容）

- ~08:08:5x–08:09:0x：worker done → h11-claude watch 的 wait 返回 → 向 lead-claude 发 `[relay-light] coder#1 -> done`（pane 显示时间线见 raw/pane-lead-claude-0809.txt 第 10 行 `❯ [relay-light] coder#1 -> done`）。
- 08:09:3x pane 读：该通知以 `❯` 排队形态显示在输入区，lead-claude 当时仍在处理后台命令完成事件与排队 TASK（raw/pane-lead-claude-0809.txt 第 8–14 行：上方 `❯ TASK: seq 1 500000000 …` 排队项紧邻其下）。
- 后续（raw/pane-lead-claude-t3.txt 第 23–29 行）：lead-claude 先后显示两条 `❯ [relay-light] coder#1 -> done` 并作答「Watch 存活（pid 3779796）。收到 coder#1 -> done 通知，worker 产出无判定方，仅做形式核，本次不写账。结束回合。」（done 8:09）。
- 即：忙碌窗口内到达的通知未被丢弃——以排队形态滞留并被后续回合处理。

## 附带观测（不作判定）

- lead-claude 收到的第二条 `coder#1 -> done`（pane-lead-claude-t3.txt 第 27 行）与 fixture/h12 阶段级 watch 的短暂 python（08:08:30–08:08:50 存在于进程表，见 H12.md）时间吻合；双通知并列到达亦未被丢弃。
- lead-claude 08:09 的「Watch 存活（pid 3779796）」：当时 fixture/h12 短暂 python 尚在（~08:09:0x 前），pid 可能为真命中；该数字未再出现于之后的进程表。
- claude-code 对长命令自动后台化：`sleep 240`、`python3 -c "time.sleep(150)"` 均「Running in background」后即 done（pane 原文见 raw/pane-lead-claude-0809.txt / -t3.txt）。
- lead-claude 输入框多次出现未提交自然语言草稿（`check the output when it's done`、`Fine, run it in the background then`、`check on PYDONE`），源未确定，见 raw/orch-ghost-tick.txt。

## 原始文件

- `raw/agent-status-poll.log` — 20s 间隔四探针 agent_status + watch 进程快照（08:06:28–08:16）
- `raw/pane-lead-claude-0809.txt` — 08:09:5x lead-claude pane 全文
- `raw/pane-lead-claude-t3.txt` — 08:15:48 lead-claude pane 全文（含 stage-stalled 应答）
- `raw/orch-ghost-tick.txt` — 输入框滞留文本异常记录
- `raw/pgrep-selfmatch.txt` — pgrep -f 自匹配复现

## 人判结论

（留空，由人判）
