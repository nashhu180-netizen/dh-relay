<!-- dh:v1 -->
# task_plan — DHR_67

## 要读的上下文（Context Packet）

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | DevPlan §3.2 DHR_67；design/12 P6-RI-A4 | 冻结 Claude 启动顺序、同一 pane 失败关闭和 Result 不可由观测推导的边界。 |
| C-002 | `relay-core/runtime/executors/herdr/herdr-cli.mjs` | 当前只包装 `pane split`、`agent start` 等既有命令；新增 wrapper 必须保留 JSON/failure 语义。 |
| C-003 | `relay-core/runtime/executors/herdr/herdr-executor.mjs` | `launchHerdrAgent` 目前统一 `paneSplit → agentStart`，且已有 `closeFailedPane`；Claude 分支只能复用同一 pane 的关闭纪律。 |
| C-004 | `relay-core/test/herdr-adapter.test.mjs`、`test/helpers/fake-herdr.mjs` | 用 fake Herdr 记录精确命令和副作用，覆盖 Codex 不变及 Claude 成功/失败序列，不启动真实 Agent。 |
| C-005 | 当前 Herdr CLI help（2026-08-30） | 已核实受支持原语：`pane run <PANE_ID> <COMMAND>...`、`agent list`、`agent rename <TARGET> <NAME>` 与 `pane close <pane_id>`。 |

## 施工步骤

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---|---|---|
| 1 | Test · `relay-core/test/herdr-adapter.test.mjs`、`relay-core/test/helpers/fake-herdr.mjs` | 先为 Claude 写精确红测：新 pane 内 `paneRun`，由 `agentList` 按该 pane ID 找到唯一 agent，再 `agentRename`；断言 Codex 仍只有既有 `agentStart`。补可编程 fake：零、多个、超时、rename 失败均可表达且记录 pane ID。 | `node --test relay-core/test/herdr-adapter.test.mjs` 先红，失败必须是缺 Claude 支持而非测试错误。 |
| 2 | Modify · `relay-core/runtime/executors/herdr/herdr-cli.mjs` | 以既有 `invoke` 包装精确 CLI：`pane run`、`agent list`、`agent rename`；不改变已有 `agentStart` 或 failure/JSON 解析语义。 | CLI wrapper fixture 断言 argv 与错误传播，原 Codex argv 不变。 |
| 3 | Modify · `relay-core/runtime/executors/herdr/herdr-executor.mjs` | 仅 Claude profile 分支：已有 `paneSplit` 后在同一 pane `paneRun`，轮询/等待到有界 deadline 的 `agentList`，以 pane ID 过滤且只接受唯一对象，`agentRename` 成功后才构造 handle；零/多/超时/rename 失败调用既有同 pane `closeFailedPane`。 | 成功时调用序列/handle 正确；每个失败态 pane close 计数恰为 1、关闭 ID 等于新 pane、Attempt/Result 副作用为零。 |
| 4 | Test · `herdr-adapter.test.mjs` | 施加由第二轮复核者指定的 production-code 语义 mutation（例如唯一性判断或失败关闭条件），确认精确断言失败后还原。 | mutant 为断言失败；还原后定向测试与 Codex 回归均有终态。 |
| 5 | Modify · `relay-core/package.json`；Record · `workspace/DHR_67/**` | 仅在必要时将已有 adapter test 纳入现有默认测试入口；记录红绿、mutation、命令 argv、失败关闭、卫生与需求对齐证据。 | 定向测试、相关回归、audit、secret-shaped 扫描、`git diff --check` 与 `dh dh-relay` 均有终态。 |

## 关键决策

- Worktree：是；分支 `wt/DHR_67`，目录 `.dh-worktrees/DHR_67`，基线为 B-29 已落主干的 `7bb423f`。
- 派子 agent：否；本会话施工。heavy 收口必须另派 fresh-context 的代码轮 1、代码轮 2、需求、教训与一致性复核者，施工者不复核自己的卡。
- Review：heavy 配方五路齐全；第二轮复核者选择并登记有效 mutation 点。DHR67 只满足 Claude 启动前置，不替代 DHR35 的 Receipt-bound Result 实录。
