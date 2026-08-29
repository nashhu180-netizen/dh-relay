<!-- dh:v1 · knowledge/herdr-派活操作.md — Windows 下经 Herdr 拉交互式终端派活的操作手册（主控侧）。
     2026-08-28 DHR_31 施工期实测沉淀；用户当日明文指示「后面派活用 win 下 herdr 拉起交互式终端的方式」。
     与 design/evidence/03-Herdr底座-preflight实测与审核记录.md（2026-08-16 preflight）互补：那份验 herdr 能力边界，本份是派活操作规程。 -->
# Herdr 交互终端派活操作（Windows · 主控侧）

## 前置检查

- 主控会话必须在 Herdr 管的 pane 里：`$env:HERDR_ENV -eq '1'`；上下文在 `$env:HERDR_WORKSPACE_ID / HERDR_TAB_ID / HERDR_PANE_ID`。不在 Herdr 里就不要试图从外部控制它。
- 命令语法以本机 `herdr --help` 与各命令组（`herdr agent` / `herdr pane` 不带子命令打印用法）为准；**别裸跑 `herdr`**（会拉起/附着 TUI）。

## 标准派活流程（四步）

```powershell
# 1. 开侧格（不抢焦点、cwd 钉到任务 worktree）
herdr pane split --current --direction right --cwd "<worktree绝对路径>" --no-focus
#    → 从 JSON .result.pane.pane_id 拿新 pane ID（如 w1:p2）

# 2. 起 agent（名字须唯一、[a-z][a-z0-9_-]{0,31}）
herdr agent start <名> --kind codex --pane <paneID> -- <原生参数...>   # codex 直接可用
#    claude kind 见下方坑：改用 pane run 起 + 自动识别 + rename

# 3. 派活（herdr 会按 bracketed-paste 原子提交文本+回车；中文经 PowerShell argv 实测正常送达）
herdr agent prompt <名> "<指令文本>"          # 长活别加 --wait 卡住自己
#    ⚠️ 发完必须验证真提交了：herdr agent get <名> 看 state_change_seq 有没有动 / status 是否转 working。
#    codex TUI 下长中文 prompt 会落在输入框不提交（herdr 报 agent_prompt_stalled 或 seq 不变）——
#    补一发 herdr agent send-keys <名> enter 即提交（2026-08-28 两次实测）。
#    ⚠️ 一发 enter 可能被吃成多行输入的换行（2026-08-29 实测一次）：补完必须再 agent get 验 seq，
#    没动就再补一发；一律以 state_change_seq 变化 + status 转 working 为「真提交」判据。
#    ⚠️ 但 agent 自身还挂着后台终端时（如 npm test 未终止），status 本来就是 working、seq 也会因
#    后台输出而动——上述判据会误判（2026-08-29 DHR_33 实测漏发一次）。终极判据 = agent read 看
#    **输入框已清空**（提示符回到「Ask Codex to do anything」且 › 后无残留文本）。
herdr agent wait <名> --timeout 5400000       # 挂后台催收：settle 到 idle/done/blocked 即返回

# 4. 收结果
herdr agent read <名> --source recent-unwrapped --lines 120
```

- `blocked` = herdr 识别到审批/提问 UI；`idle`/`done` = 就绪（done 是后台干完未被看见的同态）；`unknown` 不证明完成。
- 收不全长回复（alternate screen 滚出即丢）→ fallback：让 agent 把完整回复写成临时 md 文件、只回文件路径，再直接读文件。

## 已知坑（实测）

1. **`agent start --kind claude` 直接 spawn 会撞 PATH 里无扩展名的 bash shim `claude`**（npm 目录下与 `claude.cmd`/`claude.ps1` 并存），pane 报「不是有效的 Win32 应用程序」+ `agent start` 超时（2026-08-28 实测）。**绕法**：
   ```powershell
   herdr pane run <paneID> "claude --model opus --permission-mode acceptEdits"
   # shell 正确解析 .cmd/.ps1；herdr 数秒内自动识别 pane 里的 claude agent
   herdr agent rename <paneID> <名>
   ```
2. **权限模式**：claude worker 建议 `--permission-mode acceptEdits`——改文件自动放行，bash/git 审批停在 `blocked`，由主控 `agent wait --until blocked` → `agent read` 核对 → `agent send-keys` 放行；权限决定权留主控，不要图省事上 `--dangerously-skip-permissions`（信任弹窗它也盖不住，见 backlog DHR-BL-2）。
3. **worker 纪律**：拉起的交互终端 worker 读任务树里的 `CLAUDE.md`→`AGENTS.md` 编排协议段自我约束；派活 prompt 只给指针（task_plan / brief 路径）+ 硬边界摘要，不重抄业务全文。
4. 老对照：codex 无头形态（companion/exec）在沙箱下**写不了主仓 `.git/worktrees/` 元数据**（DHR_31 F-004，提交要主控代打）且全量测试有 EPERM 假红——herdr 交互终端形态没有这层沙箱，worker 可自己 commit。
5. **codex kind 直接 `agent start` 可用**（shim 坑只在 claude）；复核只读形态传 `-- --sandbox read-only`。
6. **claude 实例的实际运行模型要取证、别只信启动参数**（2026-08-29 DHR_32 实测）：`pane run "claude --model opus"` 拉起、状态栏显示 Opus 5，但实例自报（SessionStart hook）是 fable-5——三个来源可互相矛盾且无一权威。派发形态冻结了模型时，派前后各取一次证据（启动命令 + 让实例自报）记进 review 抬头，矛盾就并存登记标「形态待证」。
7. **PowerShell Function 形态入口（如 `claude-grok`）`where.exe` 查不到、也不能被直接 spawn**，只能经 shell（`pane run`）拉起；探测要用 `pwsh Get-Command -CommandType Application,Function,Alias,ExternalScript`（限定 CommandType 防止把 cmdlet 名也判成可用）。（2026-08-29 DHR_32 BLOCKED-1 实测）
8. **claude 实例输入通道可能整体冻结**（2026-08-29 DHR_33 实测一次）：交互输入框里残留一行未提交文本（人工在 UI 敲的），主控经 `agent send-keys` 送 esc / ctrl+c / ctrl+u / backspace×30 全部 `ok:true` 但屏面与 revision 纹丝不动。**别纠缠**：该实例若任务已完成就弃用（留给用户查看后手动关），要续派活直接开新 pane 拉 fresh 实例。教训：`send-keys` 返回 ok 只代表键已写入 pty，不代表 TUI 消费了它。
9. **codex 模型要用完整 ID**：`terra` 的真名是 **`gpt-5.6-terra`**——裸写 `--model terra` 会 400「not supported when using Codex with a ChatGPT account」（2026-08-28 两种形态实测，曾被误判成账号不支持）。TUI 内 `/model` 选择器可见本账号全表（gpt-5.6-sol / **gpt-5.6-terra** / gpt-5.6-luna / gpt-5.5 / gpt-5.4 / gpt-5.4-mini / gpt-5.3-codex-spark）+ 推理档（Low/Medium/High/Extra high/More）；起进程时传 `-c model_reasoning_effort=high` 或进 TUI 用 `/model` 选。用户点名的复核档 = **gpt-5.6-terra + High**。

## 与 dh-relay 方案的关系

- 本手册是**开发过程侧**的派活规程（主控=人/主会话，worker=交互终端 agent）。
- **产品侧**：Herdr 作为 relay 的执行底座归 **P6（Herdr 多账号执行底座）**；今天实测的 `agent start/prompt/wait/read + blocked 检测` 正是 P6 需要的宿主能力面，已登记 backlog `DHR-BL-13` 供 P6 开工时作输入，不在本手册里扩展产品设计。
