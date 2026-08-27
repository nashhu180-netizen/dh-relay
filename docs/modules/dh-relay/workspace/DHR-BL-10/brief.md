<!-- dh:v1 · brief.md — 工作区封面。🔵 前置填。写"终点"，不写路线。 -->
# brief — DHR-BL-10 zcode 接进 v1 现役 headless 派活位

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---------|---------|-------------|
| DHR-BL-10 | 计划外维护任务（不进 P1~P9 正式线） | [backlog.md](../../backlog.md) `DHR-BL-10` |

> 本卡是**计划外维护任务**（dev-harness `references/维护任务.md`：维护任务不立项不排批次）。户口 = backlog 条目，本文件是其只读副本；口径以 backlog 条目为准，跟改并在 progress 记一笔。
> 档位 = **标准档**（命中宪章#2「组件接线」高危五类，必须有 `verify(dh-relay):` 提交）；`task_type` = **normal**（代码轮 1 + 需求复核 + 教训复核 + 有效单测；不做代码轮 2）。用户 2026-08-27 在对话里点选确认。

## 目标 (Outcome)

`zcode`（Z.ai 桌面端内置的 GLM-5.3 无头 CLI）成为 v1 relay 的合法第三 executor CLI：`-Cli zcode` 可正式派活，与既有 `claude` / `codex` 两条分支同构且互不影响。**只接 headless 一次性位**，不接常驻交互施工位。

## Zero-context 自查

新 agent 只读本文件 + `task_plan.md` + backlog `DHR-BL-10` 条目，即可知道终点、边界、谁验、证据口径并开工。zcode 的可用参数、已知坑、凭据形态全部写在 backlog 条目与 `task_plan.md` Context Packet 里，不留在对话中。

## 完成条件 ★必写

| # | 条件 | 谁验 | 出处 |
|---|------|------|------|
| 1 | `relay-worker-entry.ps1 -Cli zcode -DryRun` 打印注入的 `RELAY_RECEIPT` / `RELAY_RUN_ROOT` / `RELAY_ATTEMPT_DIR` 三个环境变量，并打印 `zcode --prompt` 形态的命令行而不真拉起 | AI（`tools/tests/relay-agent-tool.ps1` 断言） | backlog DHR-BL-10「改动点」 |
| 2 | `-Cli` 传入 `claude` / `codex` / `zcode` 之外的值仍被 `ValidateSet` 拒绝（参数校验未被放宽成任意字符串） | AI（测试断言） | backlog DHR-BL-10「改动点」 |
| 3 | 既有 `claude` / `codex` 两条分支的命令行拼装**逐字不变**（`claude --dangerously-skip-permissions <prompt>` / `codex --yolo <prompt>`） | AI（既有断言 `worker entry prints brief-derived command without launch` 保持绿） | 回归保护 |
| 4 | `run-dogfood.ps1 -WorkerCli zcode` 参数校验通过（ValidateSet 已含 zcode） | AI（`Get-Command` 参数元数据断言或 dry 调用） | backlog DHR-BL-10「改动点」 |
| 5 | `tools/tests/run-relay-tests.ps1` 全量 16 套件 `RELAY ALL PASS` | AI（一键复跑） | 回归保护 |
| 6 | 仓内 diff 零密钥：`git diff` 不含任何 apiKey / token 字面量，也不含 zcode 安装绝对路径 | AI（grep 断言） | 宪章#6 密钥红线 |
| 7 | 真实拉起一棒 zcode worker，能写出 checkpoint 与 result，Runner 收得到 | 人 | 需求对齐证据（G3）：AI 在对话展示真实 run 的 result 文件内容与 exit code，用户判断这一棒是否真的按 relay 协议交了棒 |
| 8 | 待核风险 F-001（v1 是否被 v2 当 Oracle、宿主层是否在 Oracle 面内）有明确结论 | AI（查证 + findings 登记） | backlog DHR-BL-10「待核风险」 |

## 边界 (Boundaries)

- **In scope**：`tools/host/relay-worker-entry.ps1`、`tools/host/run-dogfood.ps1`、`tools/tests/relay-agent-tool.ps1`。
- **Out of scope**（碰到就停，记 findings 不顺手做）：
  - `relay-core/` 任何文件——zcode 在 v2 里归既有 `executor_kind: process`，**不新增枚举、不改 capability_hash**。
  - `tools/contracts/`、`tools/runner/`、`tools/policy/`、`tools/adapters/`。
  - 常驻交互施工位（`zcode tui` 能否带初始 prompt）——本卡明确不接。
  - 桌面端 `~/.zcode/v2/config.json` 明文存 apiKey 这一既有现状的治理。
  - P5/P6 阶段闸、DevPlan 任何任务卡状态。
- **何时必须停下问人**：E11 一次性确认本地收口授权包；P0/P1 三轮不收敛；越界改动需重新定类。

<!-- dh:allowed-paths:v1 -->
## 允许路径（收口时与实际 diff 精确比较）

- `tools/host/relay-worker-entry.ps1`
- `tools/host/run-dogfood.ps1`
- `tools/tests/relay-agent-tool.ps1`
- `docs/modules/dh-relay/workspace/DHR-BL-10/**`
- `docs/modules/dh-relay/backlog.md`
- `docs/modules/dh-relay/as-built/relay-psmux-host.md`

## 触及子系统（收口时更新其 as-built）

- `as-built/relay-psmux-host.md`——该份 §21/§57 两行明写「启动可见 `claude|codex`」，新增第三个 CLI 分支后必须同步。
