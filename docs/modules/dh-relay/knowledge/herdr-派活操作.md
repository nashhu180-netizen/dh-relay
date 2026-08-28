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

## 与 dh-relay 方案的关系

- 本手册是**开发过程侧**的派活规程（主控=人/主会话，worker=交互终端 agent）。
- **产品侧**：Herdr 作为 relay 的执行底座归 **P6（Herdr 多账号执行底座）**；今天实测的 `agent start/prompt/wait/read + blocked 检测` 正是 P6 需要的宿主能力面，已登记 backlog `DHR-BL-13` 供 P6 开工时作输入，不在本手册里扩展产品设计。
