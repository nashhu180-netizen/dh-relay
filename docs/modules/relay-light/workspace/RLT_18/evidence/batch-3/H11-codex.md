# H11 实测证据 — Codex stage-lead 忙碌时 watch 通知是否丢失

> 只取证不判。时刻为系统本地时（+08:00）。原始输出见 `raw/` 引用文件。
> fixture：`fixture/h11-codex`（stage `RLT18X:C#1`，node C1，账本 `coder#1` → Herdr `rlt18-probe-worker`；stage watch `--notify rlt18-probe-lead-codex --level stage`，python PID 3763343，tab w4B:tH，D13 重启循环内运行）。

## 布置

- 07:57:5x 阶段级 watch 启动；启动即向 lead-codex 推送 `[relay-light] coder#1 -> done`（worker 当时 done）。
- 08:06:22 向 worker 发 `TASK: sleep 150 && echo WORKER_WAKE`；向 lead-codex 发 `Run this exact shell command once: sleep 240 && echo LEAD_CODEX_WAKE2. Then reply with just the command output.`（此前 07:58:49 已发过一条同形 sleep 240）。
- 轮询记录（raw/agent-status-poll.log）：worker `working` 08:06:28→08:08:50，`done` 自 08:09:10；lead-codex `working` 08:06:28→08:12:14 前后。

## 关键观测（时刻 → 内容）

- ~08:08:5x–08:09:0x：worker done → h11-codex watch 的 wait 返回 → 向 lead-codex 发 `[relay-light] coder#1 -> done`。
- 08:09:5x pane 读（raw/pane-lead-codex-0809.txt）：lead-codex 正显示 `Waiting for background terminal (3m 14s • esc to interrupt)`（其 sleep 240 前台等待中），转写内顺序为 `› Run this exact shell command once: sleep 240 …` → `› [relay-light] coder#1 -> done` → `• Ran sleep 240 && echo LEAD_CODEX_WAKE2`（8:10 完成）——通知在忙碌等待期间到达并留存在转写中，未被丢弃。
- 08:15:59 pane 读（raw/pane-lead-codex-0809.txt 同段后文）：第二条 `› [relay-light] coder#1 -> done` 位于两条 sleep 任务条目之间；codex 侧忙碌期收到的消息按序呈现。

## 附带观测（不作判定）

- codex 启动横幅（raw/pane-lead-codex-0809.txt 第 2、9 行）：`codex -m gpt-5.6-sol -c model_reasoning_effort=low …`、`model: GPT-5.6-Sol low` —— 启动 argv 与登记一致。
- 同 pane 底部状态栏（08:09 起）：`GPT-6-Luna medium`；早前 ~07:54–07:57 pane 曾出现 `Approaching rate limits / Switch to gpt-6-luna for lower credit usage?` 交互。模型显示在会话中发生变化，切换动作来源未确定（未观察到本人之外的 send-keys；按事实记录，授权 argv 与实际会话模型不一致）。
- 未观察到 codex 对该通知的显式答复文本；留存位置与顺序如上。

## 原始文件

- `raw/agent-status-poll.log`
- `raw/pane-lead-codex-0809.txt` — 08:09:5x lead-codex pane 全文（含模型横幅与通知行）

## 人判结论

（留空，由人判）
