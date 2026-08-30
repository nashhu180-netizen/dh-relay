<!-- dh:v1 · workspace/DHR_35/task_plan.md -->
# task_plan — DHR_35

## 要读的上下文（Context Packet）

| ID | 来源 | 为什么 |
|---|---|---|
| C-001 | `docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md` §2.3、§3.1 DHR_35、§3.2 DHR_35、§4 | 唯一的目标、验收、Linux 延后语义与 P6 阶段闸。 |
| C-002 | `docs/modules/dh-relay/workspace/DHR_32/brief.md`、`workspace/DHR_33/brief.md`、`workspace/DHR_34/brief.md` 及 open findings | 只消费已冻结 Profile、Herdr Adapter 与 Receipt/fallback 合同；移交问题不静默略过。 |
| C-003 | `relay-core/test/e2e-basic-agent-task.test.mjs` | 临时仓、CLI 子进程、Run 终态与清理的既有低风险模式。 |
| C-004 | `relay-core/runtime/workflow-driver.mjs`、`runtime/executors/herdr/*.mjs`、`cli/main.mjs` | 准确读取现有 launch/observe/checkpoint/result/focus 行为，不改动它。 |
| C-005 | `AGENTS.md`、Herdr skill | 凭据红线、worktree 纪律以及仅在 `HERDR_ENV=1` 时控制当前 Herdr 会话的边界。 |
| C-006 | `design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md`、DHR_63/DHR_64 完成证据 | 只消费 Receipt submission bridge 与已验证 registry；不得用 Herdr/judge 直写结果替代。 |

## 施工步骤（一次性施工合同）

> 当前门禁：`blocked-by:DHR_63,DHR_64`。下列步骤冻结为后续施工合同，未获两卡完成与用户重新 D-start 前不得执行步骤 1–6。

| # | 改动文件（Create/Modify/Test + 路径） | 怎么改 | 怎么验（命令 → 预期输出） |
|---|---|---|---|
| 1 | Create · `workspace/DHR_35/scripts/run-windows-closure.ps1`；Test · `workspace/DHR_35/scripts/test-run-windows-closure.ps1` | 只用临时 `DHR35-*` Git 仓，复制既有 workflow 模板并按已经冻结的 Profile 标识生成两份 run 文档；脚本必须拒绝 DSH 启用、只记录允许字段、每次独立 `DH_RELAY_*` 根；终于或失败时回收本卡启动的 Node service 与临时目录。 | 脚本静态自检 + `powershell -NoProfile -File ...test-run-windows-closure.ps1` → 终态 0；敏感键扫描为 0。 |
| 2 | Record · `workspace/DHR_35/evidence/preflight-*.json` | 只读核验 `HERDR_ENV`、现有 Herdr CLI、两个 registry Profile 的可解析性、DSH 未启动；缺任一前置即记录 reason 后停止，不猜别名或配置。 | 预检命令 → 明确 pass 或 fail-closed 的 reason；无凭据/完整环境输出。 |
| 3 | Run/Record · `workspace/DHR_35/evidence/windows-codex/**` | 在临时仓启动一条 Codex Profile 实际节点；保存脱敏 Receipt 关联符、events/status/inspect/focus、Herdr 状态序列、`submit-executor-result` committed Ack 与 pane 交互时间。Herdr/judge 只作观测，不能直写 Result。 | `relay start/events/status/inspect/focus --json` 全部有记录；Receipt/Profile/Attempt/Result 身份链一致且节点终态仅由 committed submission Ack 推进。 |
| 4 | Run/Record · `workspace/DHR_35/evidence/windows-claude/**` | 对独立临时仓重复步骤 3，目标为一个已冻结 Claude Code Profile；不得复用 Codex 产物或将同一 Agent 冒充两条路径。 | 同步骤 3；两份 run 的 root、run id、Receipt 关联符和 agent/pane 证据彼此独立。 |
| 5 | Test/Record · `workspace/DHR_35/evidence/controlled-states/**` | 以受控 shell fixture 或已有 Herdr test fixture补 working/blocked/done/unknown 的可观测证据；只证明状态映射/Attention，不能作为真实产品闭环替代。 | 定向 `node --test test/herdr-adapter.test.mjs test/agent-node.test.mjs test/e2e-basic-agent-task.test.mjs` → 必有终态摘要与退出码 0。 |
| 6 | Record · `workspace/DHR_35/progress.md`、`review.md`、`findings.md` | 记录 DSH-off、P6-X 判定、Linux B-22 延后、证据索引与发现；不改人类签名，不写 verify。 | `git diff --check`；`rg` 凭据敏感键扫描仅报告脚本的防护规则、不得匹配值或证据内容。 |

## 关键决策

- Worktree：是；分支 `wt/DHR_35`；目录 `D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_35`，已 rebase 至当前 `master`。
- 施工：当前暂停；DHR_63/DHR_64 完成并获用户重新放行后才由主会话执行；不启动 Linux/SSH，不读写凭据或账号配置。
- Review：存量标准卡按 legacy 两轮独立代码复核，另做需求、教训、一致性复核；施工者不复核自己的卡。
- TDD：生产代码不在范围；步骤 1 的脚本先由受控 test script 验证其 fail-closed 防护，再运行真实产品路径。
