<!-- dh:v1 -->
# task_plan — DHR_69

## 要读的上下文（Context Packet）

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | DevPlan §3.2 DHR_69 + §0 `B-33` | 冻结六条验收、逐条允许路径、三项用户裁决（观测层 / 并入 F-6807 / DHR_35 等本卡）。 |
| C-002 | `design/evidence/32-A27-目录信任能力矩阵-实测.md` §2 | F-6809 事实：Claude 信任框时 `agent start` exit 0、`agent get=idle`、`pane get=blocked`。`blocked` **取值**的事实基准，E-1 不重复取。 |
| C-003 | `relay-core/runtime/executors/herdr/herdr-executor.mjs` L111–121、L44–46、L96–108 | `observeHerdrAgent` 只读 `agentGet`；就绪轮询在 `idle/working` 立即退出，故假 idle 打穿启动期第二条检测。`observationDetail` 现役六键。 |
| C-004 | `relay-core/runtime/workflow-driver.mjs` L261–280、L346–364 | 启动期 blocked 已扣指令；**recovery 无条件先发指令**（F-6807）；轮询 `done\|\|idle` 会写 `E_EXECUTOR_RESULT_MISSING`。 |
| C-005 | `relay-core/test/helpers/fake-herdr.mjs` L21–26、L54–56 | DHR_68 后 `paneGet` 已返回 pane 记录，默认 `agent_status=unknown`，**不能与 agent 状态分开编**。 |
| C-006 | `relay-core/test/herdr-adapter.test.mjs` 的 `runtimeFixture` / `recoveryFixture` 与 DHR_68/C 用例 | 复用夹具；driver 测试等**派生状态**而不是事件数组（DHR_68 F-6804）。 |
| C-007 | DHR_68 `evidence/real-herdr-command-shapes.json` 的 `pane-get` / `agent-get` 条 | 参考字段路径；**不可替代**本卡 E-1（取样对象与冻结脚本路径不同）。 |

## 关键事实（起草时已核实，不要重新推测）

1. **修在 `observeHerdrAgent`，三时点共用派生结论。** 启动期 `launch_blocked = startBlocked \|\| readyObservation.herdr_status === 'blocked'` 已存在；只要派生把假 idle 变成 blocked，启动期 adapter 侧就接通。driver 轮询读的也是同一函数。recovery **不会**自动接通——它在进轮询前无条件 `sendToHerdrAgent`，必须单独改发送时机。
2. **覆盖规则唯一**：仅 `agent_get=idle` ∧ `pane_get=blocked` → 派生 `blocked`。evidence/32 已记录正常工作时 `agent get` 与 `pane get` 会短暂 working/idle 不一致，其它 pane 取值一律不覆盖。
3. **`herdr-cli.mjs` 已有 `paneGet()`**，本卡不得改它。
4. **Codex `agent_not_ready` 是真 blocked**（`agent get` 自己就会报 blocked 或 start 带 `notReady`），交叉核对不会发起 pane get。负例必须钉死 argv 与 `launch_blocked` 行为不变。
5. **T 的测试入口**是 driver 函数入参 `signalConflictMs`（默认 60_000），与 `observationLostMs` 同形态。测试里传几十毫秒，禁止新环境变量。

## 施工步骤

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 0 | Create · `workspace/DHR_69/evidence/scripts/herdr-shape-probe.mjs` | 只读 probe：`pane split` 一个**普通 shell pane**（cwd=临时目录），再跑 `herdr pane get <id>` 与 `herdr agent get`（对这个无 agent 的 pane / 一个不存在的名字，用来采 exit 与错误形态）。**禁止** `agent start` / `pane run` 拉产品 Agent。自带断言：成功 `pane get` 的 stdout 是 JSON、`agent_status` 字段路径可解析（现役信封是 `result.pane.agent_status`，以实测为准）。产物写 `workspace/DHR_69/evidence/herdr-command-shapes.json`（只留形态：exit / 是否 JSON / 字段路径 / 取值；正文脱敏）。拿不到 herdr 或断言失败 → fail-closed 停下，不写 fake。结束时 `pane close` 自己建的 pane。 | `node docs/modules/dh-relay/workspace/DHR_69/evidence/scripts/herdr-shape-probe.mjs` exit 0；JSON 存在且含 `pane-get` 字段路径。 |
| 1 | Modify · `relay-core/test/helpers/fake-herdr.mjs` | 按 E-1 形态：`paneGet` 继续返回 `{ok,value:{pane,type}}`（已对齐 DHR_68），但 `paneRecord.agent_status` 改由新入参 `paneStatuses`（数组，粘性最后一项，与 agent `statuses` **独立**）驱动。新增 `paneGets` 计数写入 `calls`。默认 `paneStatuses=['unknown']`（空壳 pane）。调用失败支保持现役 `pane_not_found` detail。不得为测试变绿伪造 E-1 没有的字段。 | 现役 `herdr-adapter.test.mjs` 仍能加载；后续 E-2 断言字段路径。 |
| 2 | Test（红）· `relay-core/test/dhr69-false-ready.test.mjs` | 先写会失败的红测，再改生产代码。最低集合：<br>**A** Claude profile：`paneRun` 成功 + agent `idle` + pane `blocked` → `launch_blocked=true`、`paneKills=0`、handle 在；driver 节点 `waiting_human`、`human_input_requested` 恰 1 条且 `herdr_status=blocked;agent_get=idle;pane_get=blocked`、`sent=0`、无 `E_EXECUTOR_HOST_LOST`。**负例**：Codex `agentStartResult.notReady` 路径 argv 与 `launch_blocked` 行为与现役 DHR_68/C 一致，且该支 `paneGets=0`。<br>**B** 启动 `working` 后中途 agent `idle` + pane `blocked` → 不得出现 `E_EXECUTOR_RESULT_MISSING`、Attempt 不结束、恰一条 blocked Attention。<br>**C** `recoveryFixture` 接到假 idle/真 blocked → `sent` 在观测为 blocked 期间为 0；切到 working 后 `sent===1`。<br>**D** `working`/`done`/`unknown` 三态 `paneGets===0`；`idle` 态 `paneGets>=1`；`host_observation_changed.detail` 可解析出三键。<br>**E-2** 读 E-1 JSON：fake `paneGet().value.pane` 含相同字段路径；`typeof agent_status === 'string'`。<br>**F** `signalConflictMs` 传小值（如 40ms）+ 粘性 idle∧blocked → 初始 Attention 1 条 + 升级 Attention 1 条（`conflict_escalation=idle_blocked`、`reason` 空、两原始信号都在）；`sent=0`；节点不是 failed；再切 working 后 `sent===1`。 | 全红，失败原因是「缺该能力」。 |
| 3 | Modify · `relay-core/runtime/executors/herdr/herdr-executor.mjs` | ①`observationDetail` 在原六键后追加 `;agent_get=${agentGet ?? '-'};pane_get=${paneGet ?? '-'}`，若传入 `conflictEscalation` 再追加 `;conflict_escalation=${conflictEscalation}`。②`observeHerdrAgent`：读 `agentGet` 得 `agent_get`；**仅当** `agent_get==='idle'` 时调 `cli.paneGet(handle.pane_id)`；成功则取 `entity(value)` 的 `agent_status`/`status` 为 `pane_get`，失败为 `error`；未调用为 `-`。派生：`idle`∧`blocked` → `herdr_status='blocked'`，否则 `herdr_status=agent_get`。observation 对象带上 `agent_get`/`pane_get`/`pane_get_called`。 | step 2 的 A adapter + D 开始转绿。 |
| 4 | Modify · `relay-core/runtime/workflow-driver.mjs` | ①`startWorkflowDriver` 增参 `signalConflictMs = 60_000`（函数默认值）。②`herdrDetail` 传入 observation 的 `agentGet`/`paneGet`。③**recovery**：`if (receiptBound && recovery)` 改为先 `observeHerdrAgent`；派生 blocked 则 `instructionPending=true` 且**不发**指令，并按 DHR_68 启动期同样写一次 blocked Attention（避免 lastStatus 初始化为 null 导致重复或漏写）；非 blocked 才发指令。④轮询：用派生 `herdr_status` 进既有 blocked / done-idle 分支（于是 B 自动避开 `E_EXECUTOR_RESULT_MISSING`）。⑤持续 mismatch（`agent_get=idle` ∧ `pane_get=blocked`）用 `clock()` 计时，超过 `signalConflictMs` **恰写一条**升级 Attention（`conflict_escalation=idle_blocked`，`reason` 空）；离开 mismatch 后清计时。⑥离开 blocked 且 `instructionPending` 时沿用既有「`!== 'blocked'` 恰补发一次」。**禁止**改 `waitForExecutorResult` 与 Result 提交语义。 | A driver / B / C / F 转绿。 |
| 5 | Modify · `relay-core/test/herdr-adapter.test.mjs` | 现役精确串 `observationDetail(...)` 与 `/;profile=...$/` 会因追加两键而需要**最小**更新（改期望串 / 锚点），不得顺手改 DHR_33/68 行为断言。Codex `agent_not_ready` 负例若放本文件亦可，但本卡新行为以 `dhr69-false-ready.test.mjs` 为准。 | 既有 DHR_68/C 与 DHR_33 定向不因本卡变红（除上述期望串）。 |
| 6 | Modify · `relay-core/package.json` | 只向 `scripts.test` 追加一个 token：`test/dhr69-false-ready.test.mjs`。 | `node --test relay-core/test/dhr69-false-ready.test.mjs` 被默认 `npm test` 拾取。 |
| 7 | Record · `workspace/DHR_69/**` | 记红绿、E-1 JSON、调用账本、`git diff --check`、凭据形态扫描、允许路径核对。变异点**留空**等第二轮复核实例选点。 | 证据账本有终态。 |

## 关键决策

- **Worktree：是**（用户点选）。分支 `wt/DHR_69`，目录 `.dh-worktrees/DHR_69`，基线 = D-start 提交后的 master。
- **不分批**：主会话自干、过程可见；一个功能点（观测层交叉核对）覆盖三时点。
- **派子 agent：施工不派**。heavy 收口另派 fresh 五路；施工者不复核自己的卡。
- **不跑真实 Agent**：E-1 只碰普通 shell pane；关闭判据是受控回归夹具。
- **DHR_69 只是 A-27 的硬前置 / P6-RI-A4 的启动观测前置**，不承接 `A27-M7` 本身，也不承接 DHR_35 真实闭环。
