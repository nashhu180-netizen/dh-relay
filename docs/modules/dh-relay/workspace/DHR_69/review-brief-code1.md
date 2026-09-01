<!-- dh:v1 -->
# DHR_69 · 代码复核轮 1 · review brief

> 你是**复核 worker**，不是主控。只做本文件指定的这一件事：只读复核，不改任何文件、不拉终端、不派活、不问用户。
> 完成方式：把结论**直接写在你的回复正文里**（不要用 heredoc 打印，TUI 会折叠），按下方「产出格式」。
> 只读形态：`codex --sandbox read-only`。写文件会被沙盒拒绝，不要试图落盘。

## 你在哪、看什么

- 仓库：`D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_69`（分支 `wt/DHR_69`）
- 待复核提交：`140f21f`；对照基线 `master@3b147d7`（本卡 D-start）
- 先读：仓根 `AGENTS.md` → `docs/modules/dh-relay/workspace/DHR_69/brief.md` → `task_plan.md` → `progress.md` → `findings.md`
- 主 diff：`git diff 3b147d7..140f21f -- relay-core/`
- 权威验收：`docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md` §3.2 `DHR_69`

## 这张卡在干什么（一句话）

Claude 卡在产品对话框时，Herdr 的 `agent get` 报 `idle`、`pane get` 报 `blocked`。现役两条启动期检测都被这个假 idle 打穿；轮询会把 Attempt 错判成 `E_EXECUTOR_RESULT_MISSING`；recovery 无条件先发提交指令。本卡只在观测层修：仅当 `agent get=idle` 时多读一次 `pane get`，派生 blocked 后落到 DHR_68 已有的人工暂停。

## 验收口径（逐条判）

- **A** 启动期假就绪：`agent start` exit 0 + `agent get=idle` + `pane get=blocked` → `launch_blocked=true`、保留 handle、不关 pane、不额外创建 Attempt/Result；driver 不发提交指令、恰写一次带 blocked 观测的 `human_input_requested`、不写 `E_EXECUTOR_HOST_LOST`。Codex `agent_not_ready` 路径 argv 与行为逐字不变。
- **B** 轮询期：启动正常、中途假 idle → 不得进 `done||idle` 分支、不得写 `E_EXECUTOR_RESULT_MISSING`、不得结束 Attempt；走 blocked 分支恰一条 Attention。
- **C** recovery：发提交指令之前先观测；blocked 则扣住；离开 blocked 后**同一 driver 届内**恰补发一次。跨进程重启重复发送是明示接受的已知限制。
- **D** `host_observation_changed` 同时留下 `agent_get` / `pane_get` / 派生 `herdr_status`；仅 idle 时才调 `pane get`（working/done/unknown 次数为 0）。三者进 `detail` 的 `k=v;k=v`，不改 schema。
- **E** E-1 可复跑 probe（普通 shell pane，不启动产品 Agent）+ E-2 fake `paneGet` 按 E-1 形态。`blocked` 取值以 evidence/32 §2 为事实基准，probe 不取。
- **F** idle∧blocked 持续超过 T=60_000 ms（driver 入参 `signalConflictMs`，默认 60s，不新增配置面）→ 指令始终未发；初始 Attention 恰 1；超时后恰 1 条升级 Attention（`conflict_escalation=idle_blocked`，`reason` 空）；恢复一致后恰补发一次；不得改信 `agent get` 放行、不得自动判失败。

## 硬边界（越界即 P0）

- 允许路径仅：`herdr-executor.mjs`、`workflow-driver.mjs`、`herdr-adapter.test.mjs`、`test/helpers/fake-herdr.mjs`、`test/dhr69-false-ready.test.mjs`、`package.json`（只追加一个测试文件名）、`workspace/DHR_69/**`。
- **不得改** `herdr-cli.mjs`、`profile-registry.mjs`、`service.mjs`、Store、RPC、contracts、用户级 registry、DHR_35 / DHR_68 工作区。
- `workflow-driver.mjs` 只可改观测→事件路径与 recovery 发送时机。不得改 Receipt-bound Result、等待超时与 `E_EXECUTOR_RESULT_MISSING` 的**语义**；允许因派生 blocked 使该分支不可达（那正是 B）。
- 零按键：全路径无新增 `send-keys` / `send-text`。不跑真实 Agent。不新增协议 reason code。

## D-start 冻结的键与覆盖规则（不得改口）

- 原六键不动：`herdr_status` / `agent` / `pane` / `seq` / `work_dir_root` / `profile`
- 新加：`agent_get`、`pane_get`（未调用=`-`，失败=`error`）
- 覆盖规则**唯一**：仅 `agent_get=idle` ∧ `pane_get=blocked` → 派生 `herdr_status=blocked`。pane 其它取值不覆盖。
- 升级 Attention 另加 `conflict_escalation=idle_blocked`，`reason` 留空。

## 请重点核这几条

1. `observeHerdrAgent` 是否真的只在 idle 时读 pane get；working/done/unknown 有没有漏读或误读。
2. 覆盖规则有没有被写反（用 pane 覆盖非 blocked、或用 agent idle 直接放行）。
3. recovery 是否真的在 `sendToHerdrAgent` **之前**观测；blocked 时 `instructionPending` 是否置位；离开 blocked 是否仍走既有 `!== 'blocked'` 恰补发一次。
4. `done||idle` 分支是否因派生 blocked 而不可达（机器证 B），且 `waitForExecutorResult` 文本有没有被改。
5. 升级 Attention 是否可能在真 blocked（`agent_get=blocked`）上误触发；是否可能写出多条。
6. Codex `agent_not_ready` 负例是否仍走 DHR_68/C，且该支 `paneGets=0`。
7. E-1 probe 是否启动了产品 Agent（越界）。
8. 允许路径 vs `git diff --name-only 3b147d7..140f21f`。

## 已知、不用重复报

- `herdr-adapter.test.mjs` 有 3 例 DHR_33 失败，在未改代码的 master 上同名同因（DHR_68 已登记）。
- 本仓 `npm test --test-concurrency=4` 基线不稳（F-6806）。
- `DHR_68/C driver 启动即 blocked` 在整文件串行下可能超时，单跑通过（E-6903）；不要把负载竞态当本卡回归。
- DevPlan 机器证 E 仍写「paneAlive 布尔桩」——DHR_68 后已是 pane 记录，缺口是不能独立编状态。F-6901 已记账，不改 DevPlan。

## 产出格式

```
## 结论：PASS / FAIL
## 逐条验收判定
- A：满足 / 不满足 + 一句依据
- B：…
- C：…
- D：…
- E：…
- F：…
## 发现（按级别，P0 最重）
| ID | 级别 | 文件:行 | 问题 | 为什么是问题 | 建议 |
## 越界检查
- 改动文件是否全在允许路径：是/否
- 是否改了 Result 语义 / 新增 reason code / 启动了真实 Agent：是/否
## 我实际跑了什么
```

级别：P0 正确性/安全/越界；P1 会导致验收不成立；P2 可维护性/证据不足；P3 建议。
只写事实与级别，不替主控做验收裁决，不改任何文件。
