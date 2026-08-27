<!-- progress.md — 施工日志 + 证据账本。🟢 边做边记。 -->
# progress — DHR-BL-10

## 日志 (Log)

| 时间 | 谁 | 做了什么 | 证据 | 下一步 |
|------|----|---------|------|--------|
| 2026-08-27 | 主控(Claude Opus) | 摸清 zcode 形态：非 PATH CLI，是 Electron 桌面端内置的 `resources/glm/zcode.cjs`（zcode 0.16.5 / GLM-5.3）。反推出 CLI 独立配置 schema 并跑通无头调用 | E-001 | 落户 + 建工作区 |
| 2026-08-27 | 主控(Claude Opus) | 机器准备：建 PATH shim `%APPDATA%\npm\zcode.cmd`；凭据放进 zcode 私有配置 `~/.zcode/cli/config.json`（与 `~/.claude`、`~/.codex/auth.json` 同构的环境自带认证）；干净 shell 验证 | E-002 | 派 zcode 施工 |
| 2026-08-27 | 主控(Claude Opus) | 用户对话确认档位（标准档 · normal）与接线形态（只接 headless 位）；backlog 立 `DHR-BL-10`；工作区八件套落主树 | E-003 | 开 worktree 派活 |

## 证据账本 (Evidence Ledger)

| ID | 类型 | 命令 / 路径 | 结果 (pass/fail/observed/waived) | 支撑什么结论 |
|----|------|-----------|------|------|
| E-001 | probe | `zcode --prompt "..." --cwd <tmp> --json`（经 shim） | observed：返回 `sessionId` / `usage` / `contextWindow=1000000`；另测 `-c` 续会话、写文件+跑 python 均成功；`--max-turns` 报 `Unknown option` | zcode 无头能力可用（F-002 由此登记） |
| E-002 | probe | `pwsh -NoProfile -Command "Remove-Item Env:ZCODE_API_KEY -EA SilentlyContinue; zcode --prompt '只回复两个字：就绪' --no-color"` | pass：输出 `就绪` | zcode 具备与 claude/codex 同构的环境自带认证，worker-entry 无需任何凭据注入 |
| E-003 | decision | 对话内 AskUserQuestion 点选 | observed：接线形态=只接 headless 位；档位=标准档 · `task_type=normal` | 入口闸（宪章#1 / G1）已过，开工获授权 |
