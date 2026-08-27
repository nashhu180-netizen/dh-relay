# e2e provenance — 2026-08-27 G3 provenance 复跑（zcode 第 3 棒）

本目录为 RQ-3 收敛证据：证明 `../run3-prov/` 七份工件由**真实 zcode 进程**在本次运行窗内产生，而非静态手写。
配套工件目录：`../run3-prov/`（checkpoint.json / result.json / handoff.md / session-tail.txt / worker-stdout.log / worker-stderr.log / one-shot-brief.md / exit-code.txt）。

## 三条时间线（一律 UTC）

| 记录方 | 值 |
|---|---|
| ① OS 进程账（Start-Process -PassThru ＋ 存活期 Win32_Process CommandLine 抓取） | pid=45680 · start **14:01:49.6083986Z** · exit **14:04:07.3704556Z** · exit_code=0（见 `process.txt`、`launch-command.txt`） |
| ② zcode 自有会话日志（`~/.zcode/cli/rollout/`，repo 之外，由 zcode CLI 写出） | `model-io-sess_011c9160-….jsonl` 在 spawn 时的预快照中**不存在**、最后写入 **14:04:01.1993113Z** —— 生存期内创建并写入（见 `zcode-session.txt`，只含元信息） |
| ③ relay 协议工件 written_at | checkpoint **14:03:12.4460367Z** · result **14:03:45.1028672Z**（见 `../run3-prov/*.json`） |

**咬合关系**：③ ∈ ① ⊂ ②——工件两个 written_at 落在进程生存期中段；进程整段生存期又落在 zcode 会话文件的创建～最后写入窗内（rollout 末次写入 14:04:01 早于进程退出 14:04:07，其后进程只做 `cli exited 0` 回显与收尾退出）。三个记录方相互独立：OS 进程表（进程存活时抓取）、zcode CLI 自己的会话日志（仓外文件）、relay-agent-tool 写出的协议工件。

## 如何交叉验证（不信任本仓记录的重跑法）

1. 取 `launch-command.txt` 的 canonical replay form，在**新沙盒**原样重跑（把三个路径换成新沙盒路径）。
2. 重跑前后各对 `~/.zcode/cli/rollout/` 做 `Get-ChildItem -Filter model-io-sess_*.jsonl` 元信息快照（只取 Name/Length/LastWriteTime）：应出现**一份 spawn 时不存在的新 jsonl**，其 mtime 落在新进程生存期内、早于进程退出时刻。
3. 新 attempt 目录里 checkpoint.json / result.json 的 `written_at` 应落在新进程生存期内，且 checkpoint 早于 result。
4. 退出码从 `Start-Process -PassThru` 对象读 `ExitCode`，应为 0（`pwsh -File` 无 `-NoExit` 形态下尾部 `exit $code` 生效）。

## 为什么静态伪造难以同时满足

- 事后手写工件可以随意填 `written_at`，但**变不出**①的进程生存期（OS 记录在进程存活期间抓取，含 Win32_Process 原始 CommandLine）与②的仓外会话日志（zcode CLI 写在 `~/.zcode/cli/rollout/`，不在本仓提交面内）。
- 反过来，仅有的②文件 mtime 也无法孤立伪造叙事：它必须同时落进①的生存期、又晚于③的全部 written_at。
- 三者必须**同窗协调**才自洽；任意一份事后补造，都会与另外两份的既有时间戳错位。

## 边缘排除（透明登记）

窗口边缘还有一份 `model-io-sess_50e60d0f-….jsonl`（预快照已存在、最后写入早于 spawn 2.8 秒），属编排方交互会话的滚动写入，已从本棒归因集排除——判定细节见 `zcode-session.txt`。

## 密钥闸

八份文件拷入仓前按值形态模式逐份扫描（`api[_-]?key: 值` / `sk-…` / `Bearer …` / `ZCODE_API_KEY=值` / `password=值` / zcode 安装绝对路径），全部零命中；`zcode-session.txt` 只含文件名/字节数/mtime，无任何内容摘录。
