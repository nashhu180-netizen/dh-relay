<!-- dh:v1 -->
# DHR_68 · 代码复核轮 1 · review brief

> 你是**复核 worker**，不是主控。只做本文件指定的这一件事：只读复核，不改任何文件、不拉终端、不派活、不问用户。
> 完成方式：把结论**直接写在你的回复正文里**（不要用 heredoc 打印，TUI 会折叠），按下方「产出格式」。

## 你在哪、看什么

- 仓库：`D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_68`（分支 `wt/DHR_68`）
- 待复核提交：`051b4f8`；对照基线 `master@d6358dc`
- 先读：仓根 `AGENTS.md` → `docs/modules/dh-relay/workspace/DHR_68/brief.md` → `task_plan.md` → `progress.md` → `findings.md`
- 主 diff：`git diff d6358dc..051b4f8 -- relay-core/`

## 这张卡在干什么（一句话）

DHR_35 用**真实** Codex / Claude Code 在 Windows 上跑首次实录，暴露出三条只有真实宿主才看得见的 Herdr adapter/driver 缺陷（fake 当时的返回形态与真实 herdr 不一致，所以测试全绿却跑不通）。本卡逐条接线修复，并把「fake 形态必须对齐真实 CLI」升级成验收项。

## 验收口径（逐条判，DevPlan §3.2 DHR_68 为唯一权威）

- **A**：启动调用用**启动专用**超时默认 **60 秒**（不暴露配置面：不新增环境变量、不进 registry、不加 CLI flag），其余 CLI 命令仍用 10 秒、超时语义不变；fake 覆盖「超时后 agent 存在」与「超时后 agent 不存在」两支，前者走既有 handle 路径、后者才关**本卡创建的同一 pane**。不得声称 60s 覆盖任意未来启动。
- **B**：`paneRun` 不再期待 JSON；以对齐真实形态（exit 0 + 空 stdout）的 fixture 证明 Claude 仍走 `pane run → 唯一识别 → rename → 交既有 Attempt`，且 Codex `agent start` 的 **argv 与返回处理不变**。
- **C**：`agent start` 返回启动期 `blocked`（含 `agent_not_ready`）时——adapter 返回 handle、不关 pane、不额外创建 Attempt/Result；driver 不发 completion instruction，并**恰好写一次**带 blocked 观测的 `waiting_human` + `human_input_requested`，不写 `E_EXECUTOR_HOST_LOST`。
- **D**：`fake-herdr.mjs` 中被本卡触及的每个命令，返回形态须与真实 herdr 一致，并留下逐命令真实输出对照证据。

## 硬边界（越界即 P0）

- 允许路径**仅**：`herdr-cli.mjs`、`herdr-executor.mjs`、`workflow-driver.mjs`、`herdr-adapter.test.mjs`、`test/helpers/fake-herdr.mjs`、`workspace/DHR_68/**`。
- `workflow-driver.mjs` **只可**改启动期 blocked 的事件路径，**不得**动 Result 判定。
- 不得把 Herdr `done` / pane 文本 / exit code 当 Result；不得代产品做信任决定或自动确认目录信任。
- 超时对账**不得**退化成重试启动（会在真实宿主上拉起第二个 Agent 进程）。

## 请重点核这几条（主控自认为风险最高的地方）

1. **对账的正确性**：`launchHerdrAgent` 里超时对账的判定是否可能把「别人的 agent」或「上一次残留的 agent」误判成本次启动成功？Codex 走 `cli.agentGet(agentName)`——`agentName` 由 `attemptId` 派生，是否足够唯一？Claude 走 `cli.agentList()` 按新 pane 过滤——新 pane 里是否可能已有非本次启动的对象？
2. **不重试**：确认代码路径上不存在任何形式的启动重发（包括循环、递归、回退分支）。
3. **只关自己的 pane**：所有失败分支关闭的 pane ID 是否都等于本次 `paneSplit` 创建的那个。
4. **driver 越界**：逐行确认 driver 的改动只在启动期 blocked 事件路径上，`done/idle` 分支、`waitForExecutorResult`、Result 判定、恢复届逻辑一律未受影响。
5. **`instructionPending` 的时序**：blocked → working 补发恰好一次；若中途 observation_lost 再恢复、或 stop 撞进来，会不会漏发/重发？（主控这里最没把握。）
6. **验收 D 的取证是否够**：`evidence/real-herdr-command-shapes.json` 是否真的覆盖了本卡触及的每个动词；`fake-herdr.mjs` 的每个返回值是否逐条对得上。见 `findings.md` F-6805——主控因 `fake-herdr-bin.mjs` 不在允许路径而未改它，用三段链条替代，请判定该链条是否足以支撑验收 D。
7. **`notReady` 正则的鲁棒性**：`/agent_not_ready/i` 命中 stderr 里的 JSON 错误码；会不会与 `missing` 判定互相污染，或漏掉真实 herdr 的其它 blocked 表达。

## 已知的、不用重复报的事

- `relay-core/test/herdr-adapter.test.mjs` 有 3 例 DHR_33 失败，在**未改代码的 master** 上同名同因复现（见 `progress.md` E-6803/E-6806），不可归因本卡。
- 本仓 `npm test` 在 `--test-concurrency=4` 下基线本身不稳（F-6806），不要用全量结果做判定。
- F-6802（blocked 解除后补发指令）已由用户对话点选确认为「延后补发」，不是主控自作主张。

## 产出格式（写在回复正文里）

```
## 结论：PASS / FAIL
## 逐条验收判定
- A：满足 / 不满足 + 一句依据
- B：…
- C：…
- D：…
## 发现（按级别，P0 最重）
| ID | 级别 | 文件:行 | 问题 | 为什么是问题 | 建议 |
## 越界检查
- 改动文件是否全在允许路径：是/否（列出越界项）
- driver 是否只动启动期 blocked 事件路径：是/否
## 我实际跑了什么
（列出你执行的只读命令与结果；没跑就写没跑）
```

级别口径：P0 = 正确性/安全/越界；P1 = 会导致验收不成立；P2 = 可维护性/证据不足；P3 = 建议。
只写事实与级别，**不替主控做验收裁决**，不改任何文件。
