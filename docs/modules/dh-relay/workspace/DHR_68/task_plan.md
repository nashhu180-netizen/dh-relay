<!-- dh:v1 -->
# task_plan — DHR_68

## 要读的上下文（Context Packet）

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | DevPlan §3.2 DHR_68 + §0 `B-32` | 冻结四条验收口径、逐条允许路径、以及三条用户裁决（安全暂停语义 / 60s 且不暴露配置面 / DHR_67 保持已完成）。 |
| C-002 | `workspace/DHR_35/evidence/f3508-root-cause/production-defects.json`（分支 `wt/DHR_35`，用 `git show wt/DHR_35:<path>` 读） | 三条缺陷的**真实**观测：A 的耗时分布与 `spawn:ETIMEDOUT`、B 的 `pane_run_exit=0 / stdout_length=0`、C 的 `agent_start_exit=1 / error_code=agent_not_ready`。这是本卡唯一的真实宿主证据源。 |
| C-003 | `relay-core/runtime/executors/herdr/herdr-cli.mjs` | `makeHerdrCli` 的 `timeoutMs = 10_000` 被所有命令共用；`invoke` 的失败分支只有 `spawn:` / `timeout-or-signal:` / `exit:`，且只有 `missing` 一个语义位。`paneRun` 走默认 `json:true`。 |
| C-004 | `relay-core/runtime/executors/herdr/herdr-executor.mjs` | `launchHerdrAgent` 的 `!start.ok → closeFailedPane(start)` 是 A/C 两条缺陷的共同落点；`renameClaudeAgent` 的有界 `agentList` 轮询是 B 的既有正确部分，不能动。ready-poll 尾部的 `blind` 判定是 C 在 driver 侧的输入。 |
| C-005 | `relay-core/runtime/workflow-driver.mjs` L235~L290（launch 段）与 L279~L345（poll 段） | `!launch.ok → E_EXECUTOR_HOST_LOST`；`if (blind)` 分支把 detail 硬写成 `'unknown'`；`lastStatus` 初始化为 ready 观测值，poll 段 blocked 分支只在 `lastStatus !== 'blocked'` 时写事件（这就是"启动即 blocked 写不出 Attention"的第二半）。 |
| C-006 | `relay-core/test/helpers/fake-herdr.mjs`、`relay-core/test/herdr-adapter.test.mjs` | fake 在 **CLI wrapper 之上**建模（直接返回 `{ok,value}`），所以它的返回形态就是验收项 D 的对象；`paneRunResult` 现默认 `{ok:true,value:{}}`，与真实 exit 0 + 空 stdout 不符。 |
| C-007 | `knowledge/herdr-派活操作.md` | 真实 herdr 各动词的实测语法与已知坑，probe 脚本据此写。 |

## 关键事实（起草时已核实，worker 不要重新推测）

1. **Windows 上 spawnSync 超时走 `child.error.code === 'ETIMEDOUT'`，不是 `child.signal`。** DHR_35 实测 `observed_failure = "E_BAD_VALUE:HERDR_CLI;spawn:ETIMEDOUT;pane-kill=ok"` 证明命中的是 `if (child.error)` 分支。现役 `timeout-or-signal:` 分支在 Windows 上根本没走到——只按 `child.signal` 判超时会漏判。
2. **`agent_not_ready` 不会被现役 `missing` 正则 `/not found|no such|unknown (agent|pane)/i` 命中**，所以 C 需要新的语义位，不能复用 `missing`。
3. **Claude 分支的启动调用是 `paneRun`，不是 `agentStart`**；B 与 C 在 Claude 路径上的表现不同（Claude 的信任框出现在 `pane run` 成功**之后**，由观测报 `blocked`）。

## 施工步骤

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 0 | Record · `workspace/DHR_68/evidence/real-herdr-command-shapes.json` | 写并跑 `scripts/probe-command-shapes.mjs`：对本卡触及的每个动词（`pane split` / `pane run` / `pane close` / `agent start` / `agent list` / `agent get` / `agent rename` / `agent prompt` / `agent send-keys` / `agent read`）用**真实 herdr** 各跑一次，逐条记录 `exit_code`、`stdout_is_json`、`stdout_len`、`stderr_head`。`agent start` 的慢启动样本直接引用 C-002 已有的 6 轮真实数据，**不重复拉真实产品 Agent**。拿不到就 fail-closed 停下回报。 | 产出 JSON 存在且逐命令齐；这是验收项 D 的证据本体。 |
| 1 | Test · `relay-core/test/helpers/fake-herdr.mjs` | 按 step 0 的对照结果修返回形态：`paneRunResult` 默认改为 `{ ok: true, value: '' }`（对齐 exit 0 + 空 stdout + `json:false`）。新增可编程入参：`agentStartResult` 允许表达 `{ ok:false, reason:'E_BAD_VALUE:HERDR_CLI', detail:'spawn:ETIMEDOUT', timedOut:true }` 与 `{ ok:false, detail:'exit:1:agent_not_ready', notReady:true }`；新增 `agentGetResult`（或 `agentGetSequence`）让"超时后 agent 存在 / 不存在"两支可分别表达。不得为让测试变绿而伪造真实没有的字段。 | `node --test relay-core/test/herdr-adapter.test.mjs` 仍能跑；step 0 的对照表与 fake 默认值逐条一致。 |
| 2 | Test（红）· `relay-core/test/herdr-adapter.test.mjs` | 先写会失败的红测，三组：<br>**A**：`agentStart` 返回 `timedOut` 且 `agentGet` 命中 → 断言 `paneKills === 0`、返回 `ok:true` 且 handle 的 `agent_name`/`pane_id` 正确、`calls` 里 `agentStart` **恰好一次**（钉死"不重试"）；`agentStart` 返回 `timedOut` 且 `agentGet` 未命中 → 断言 `paneKills === 1` 且关闭的是本卡创建的 `pane-1`。<br>**B**：Claude profile 全程用 `paneRunResult = { ok:true, value:'' }` → 断言仍走 `paneRun → agentList 唯一识别 → agentRename` 并返回 handle；同一用例断言 Codex 的 `agentStart` argv 与返回处理不变。<br>**C**：`agentStart` 返回 `notReady` → 断言 adapter `ok:true`、`paneKills === 0`、handle 齐备、`launch` 标出 blocked；driver 级用例断言事件序列里 `human_input_requested` **恰好一条**且 detail 含 `herdr_status=blocked`、**无** `E_EXECUTOR_HOST_LOST`、**无** completion instruction（`fake.sent` 为空）。 | 三组全红，且失败原因必须是"缺该能力"，不是测试自身写错。 |
| 3 | Modify · `relay-core/runtime/executors/herdr/herdr-cli.mjs` | ①`failure(detail, { missing, timedOut, notReady })` 扩两个语义位。②`invoke` 里超时判定改为 `child.error?.code === 'ETIMEDOUT' \|\| child.signal` → `timedOut:true`（保留原 detail 文本形态）。③非零退出分支加 `notReady: /agent_not_ready/i.test(detail)`。④`makeHerdrCli` 增参 `startTimeoutMs = 60_000`（**函数默认值，不读环境变量、不进 registry、不加 CLI flag**），仅 `agentStart` 用它：`invoke([...], { timeoutMs: startTimeoutMs })`；其余动词一律不动、继续用 `timeoutMs = 10_000`。⑤`paneRun` 改为 `invoke([...], { json: false })`。 | 定向断言：`agentStart` 的 argv 不变、超时上限为 60000；其它动词上限仍 10000；`paneRun` 不再 `json-parse`。 |
| 4 | Modify · `relay-core/runtime/executors/herdr/herdr-executor.mjs` | 在 `launchHerdrAgent` 的 `if (!start.ok)` 之前插入两段，**顺序固定**：<br>①**超时对账**：`start.timedOut` 为真时，调**一次**对账读——Codex 走 `cli.agentGet(agentName)`、Claude 走 `cli.agentList()` 按 `paneId` 过滤——命中则视为启动已成功、继续既有 handle 路径；未命中才 `closeFailedPane(start)`。**禁止重发 `agentStart` / `paneRun`**（会拉起第二个真实 agent）。<br>②**启动期 blocked**：`start.notReady` 为真时，**不关 pane**、不重试，直接进入既有 handle 构造，并让返回对象带 `launch_blocked: true`。<br>ready-poll 段不动；`blind` 的语义保持。 | fake A 两支 + C 正例断言：调用序列、`paneKills` 计数、关闭 ID = 创建 ID、`agentStart` 调用次数 = 1。 |
| 5 | Modify · `relay-core/runtime/workflow-driver.mjs`（**仅**启动期 blocked 事件路径） | ①launch 段：`launch.ok` 且 blocked 时，**跳过** `sendToHerdrAgent(receiptSubmissionInstruction(...))`，改置一个 `instructionPending = true`。②`if (blind)` 分支的 detail 从硬写 `'unknown'` 改为 `readyObservation?.herdr_status ?? 'unknown'`，使启动即 blocked 写出的那一条带真实 blocked 观测。③poll 段：状态首次离开 `blocked`（变 `working`/`idle`）且 `instructionPending` 为真时补发一次 completion instruction 并清标志。**不动** Result 判定、`done/idle` 分支与 `waitForExecutorResult`。 | driver 事件序列断言：blocked 场景下 `human_input_requested` 恰好 1 条且 detail 含 `herdr_status=blocked`；无 `E_EXECUTOR_HOST_LOST`；`fake.sent` 在解除 blocked 前为空、之后恰好 1 条。 |
| 6 | Test · `relay-core/test/herdr-adapter.test.mjs` | 施加由**第二轮复核实例指定**的 production-code 变异点（候选：超时对账的"命中/未命中"分支、`startTimeoutMs` 常量、`instructionPending` 的清除时机），确认指定测试变红后还原。九个硬字段齐备。 | mutant = 断言失败；还原后定向 + 既有 Herdr/driver 回归均有终态。 |
| 7 | Record · `workspace/DHR_68/**` | 记红绿、mutation、逐命令真实形态对照、`git diff --check`、凭据形态扫描、`dh dh-relay` 与五路复核派出账。 | 各项均有终态。 |

## 关键决策

- **Worktree：是**（宪章#7 一卡一树）。分支 `wt/DHR_68`，目录 `.dh-worktrees/DHR_68`，基线 = B-32 落盘后的 `master@fa66d8f`。
- **不分批**：主会话自干、过程可见，三条缺陷落在同一段启动接线上，分批只会让 reviewer 视野变碎。收口时跑完整代码轮 1 + 轮 2。
- **派子 agent：施工不派**。heavy 收口必须另派 fresh-context 的代码轮 1、代码轮 2、需求、教训、一致性五路；施工者不复核自己的卡。派发走 [knowledge/herdr-派活操作.md](../../knowledge/herdr-派活操作.md)，只读复核用 codex `--sandbox read-only` 并在派出前后比对 git 基线。
- **不可证的话不说**：60 秒是按 DHR_35 实测 max 29482 ms 留的余量，只声称"覆盖已观测样本形态"，不声称覆盖任意未来启动。
- **DHR_68 只是 P6-RI-A4 的启动前置**，不承接 A4 本身；真实闭环实录仍归 DHR_35。
