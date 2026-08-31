<!-- dh:v1 -->
# DHR_68 · Review Batch（代码轮 2 / 需求 / 教训 / 一致性）· review brief

> 你是**复核 worker**，不是主控。只做本文件里**分配给你那一节**的事：只读复核，不改任何文件、不拉终端、不派活、不问用户。
> 结论**直接写在你的回复正文里**（不要用 heredoc 打印，TUI 会折叠）。
> 只写事实与级别，**不替主控做验收裁决**。级别口径：P0 正确性/安全/越界；P1 会导致验收不成立；P2 可维护性/证据不足；P3 建议。

## 公共上下文（四路都先读这段）

- 仓库：`D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_68`（分支 `wt/DHR_68`）
- 复核对象：`git diff d6358dc..HEAD -- relay-core/`（`d6358dc` = 本卡开工基线）
- 必读：仓根 `AGENTS.md` → `workspace/DHR_68/brief.md` → `task_plan.md` → `progress.md` → `findings.md` → `review.md`
- 权威验收口径：`docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md` §3.2 `DHR_68`（四条 A/B/C/D，全为机器证）

**这张卡在干什么**：DHR_35 用真实 Codex / Claude Code 在 Windows 上跑首次实录，暴露三条只有真实宿主才看得见的 Herdr adapter/driver 缺陷（fake 当时的返回形态与真实 herdr 不一致，测试全绿却跑不通）。本卡逐条接线修复，并把「fake 形态必须对齐真实 CLI」升级为验收项 D。

**硬边界（越界即 P0）**：允许路径仅 `herdr-cli.mjs`、`herdr-executor.mjs`、`workflow-driver.mjs`、`herdr-adapter.test.mjs`、`test/helpers/fake-herdr.mjs`、`workspace/DHR_68/**`；`workflow-driver.mjs` 只可改**启动期 blocked 的事件路径**，不得动 Result 判定；不得把 Herdr `done`/pane 文本/exit code 当 Result；不得代产品做信任决定；超时对账不得退化成重试启动。

**已知、不用重复报**：
- `herdr-adapter.test.mjs` 有 3 例 DHR_33 失败，在**未改代码的 master** 上同名同因复现。
- `agent-node.test.mjs` 的 `DHR_61 D1` 在**两棵树上各跑 3 次**证明是双向抖动（等待窗口仅 1000ms），非本卡引入。
- 本仓 `npm test` 在 `--test-concurrency=4` 下基线本身不稳（F-6806）。
- 复核轮 1 已判 FAIL、两条发现已采纳整改（`8030709`），见 `review.md` 第一轮区。

**待你裁决的三个 open 项**（`findings.md` 里）：
- **F-6805**：验收 D 理想上还应让可执行桩 `fake-herdr-bin.mjs` 吐「exit 0 + 空 stdout」，但它**不在允许路径**，主控未改，改用「真实 probe → fake 编码 → 桩测断言返回字符串」三段链条 + 新增的 `DHR_68/D` 机器比对测试替代。这条链条够不够支撑验收 D？
- **F-6807**：`workflow-driver.mjs` 的 **recovery** 分支（`if (receiptBound && recovery)`）无条件发 completion instruction，若 agent 仍停在信任框上有同类缺陷。主控判定"恢复届不是启动期"、不擅自扩范围，只登记。该判定对不对？
- **F-6806**：默认测试入口并发不稳，主控记账不修（越界）。

---

## 【A 路】代码复核轮 2（fresh-context，未继承轮 1 会话）

全程 + 轮 1 整改增量都要看，**不是只看增量**。除公共项外，重点：

1. 轮 1 两条整改是否真的闭合，有没有引入新问题。
2. `launchHerdrAgent` 超时对账是否可能把**别人的/上一次残留的** agent 误判成本次启动成功；`agentName` 由 `attemptId` 派生是否足够唯一；Claude 走 `agentList` 按新 pane 过滤时，新 pane 里是否可能已有非本次启动的对象。
3. 代码路径上是否存在**任何形式**的启动重发（循环、递归、回退分支）。
4. 所有失败分支关闭的 pane ID 是否都等于本次 `paneSplit` 创建的那个。
5. `instructionPending` 时序：blocked→observation_lost→working、blocked→stop、blocked→idle、已有 Result 提交等路径下，会不会漏发/重发。
6. `notReady` 正则 `/agent_not_ready/i` 与 `missing` 判定是否互相污染。

**你还必须做一件事**：**选定并登记一个有效单测变异点**。要求：指向**生产代码**的语义（不是测试代码、不是常量重命名），破坏后必须有**指定的测试**变红。给出：
- 变异点（文件 + 函数 + 具体改法，例如「`herdr-executor.mjs` 超时对账的 `reconciled` 取反」）
- 预期变红的测试名
- 为什么这个点能代表本卡的核心语义

不要自己去改代码执行变异——只**指定**，由主控执行并回报红/绿。

产出格式：
```
## 结论：PASS / FAIL
## 逐条验收判定（A/B/C/D 各一句依据）
## 轮 1 整改复验：闭合 / 未闭合
## 发现（表：ID | 级别 | 文件:行 | 问题 | 为什么是问题 | 建议）
## 三个 open 项的意见（F-6805 / F-6806 / F-6807）
## 指定变异点（变异点 / 预期变红测试 / 理由）
## 我实际跑了什么
```

---

## 【B 路】需求方向复核

判「做出来的东西是不是需求要的东西」，不判代码风格。除公共项外，重点：

1. 四条验收口径逐条：证据是否**真的**证明了那条命题，有没有"证据看起来很多但没打中命题"。
2. **不可证的话有没有说过头**：卡片明令「不得声称 60s 足以覆盖任意未来启动」。检查代码注释、progress、review 里有没有超出证据的断言。
3. 本卡与上下游的边界：DHR_68 只是 P6-RI-A4 的**启动前置**，不承接 A4 本身；真实闭环实录仍归 DHR_35。有没有把本卡的成果表述成"闭环已通"。
4. design/06 H1/H5 的「启动期人工暂停」语义是否被满足：一次持久 Attention、不代产品做信任决定、不自动重试。
5. 用户已定的产品语义：新项目信任 = **安全暂停 + 人工确认**，**不做受控自动信任**。检查实现有没有偷偷往自动信任方向滑。
6. F-6802 已由用户点选确认为「延后补发」；检查实现与该确认是否一致。

产出格式：`## 结论：PASS/FAIL`、`## 逐条命题-证据对齐表`、`## 发现（同上表头）`、`## 有没有说过头（逐条列出可疑表述）`、`## 我实际跑了什么`。

---

## 【C 路】教训复核

判「这次踩的坑，仓里既有的教训有没有覆盖；有没有重蹈已记录的坑」。除公共项外：

1. 读 `docs/modules/dh-relay/knowledge/教训库-候选.md` 与 `knowledge/herdr-派活操作.md`，判断本卡踩的坑是否是**重蹈**（重蹈=P1）。
2. 本卡 `lesson_candidates.md` 里那条方向（"测试替身的返回形态必须与真实依赖逐命令对齐，否则覆盖率是假的"）是否与既有候选**重复**；若不重复，帮忙把它写成可复用的一句话教训（含触发信号 + 检查动作）。
3. `progress.md` 里还有没有值得沉淀但没被提炼的坑（例如：Windows spawnSync 超时走 ETIMEDOUT 不走 signal；herdr 自身 agent start 默认 30s 窗口；测试竞态该改测试不该改生产代码）。

产出格式：`## 结论：PASS/FAIL`、`## 是否重蹈既有教训：是/否 + 依据`、`## 候选去重结论`、`## 建议沉淀的教训（每条：触发信号 / 检查动作 / 出处）`、`## 发现（同上表头）`。

---

## 【D 路】一致性复核

判「同一概念在不同地方的定义是否一致」。除公共项外，重点比对：

1. **超时语义**：`herdr-cli.mjs` 的 `timeoutMs` / `startTimeoutMs` / `HERDR_START_TIMEOUT_MS`，与 herdr 自身 `agent start --timeout` 的关系，在代码注释、`task_plan.md`、`progress.md`、DevPlan 卡片四处的表述是否一致、有无矛盾。
2. **失败语义位**：`missing` / `timedOut` / `notReady` 三个位的定义与使用是否处处一致；`E_EXECUTOR_HOST_LOST` / `E_EXECUTOR_RESULT_MISSING` / `human_input_requested` 的适用场景有没有被本卡改动搞混。
3. **"启动期 blocked"的定义**：adapter 的 `launch_blocked`、driver 的 `launchBlocked`、`blind`、`HERDR_STATUS_MAPPING.blocked` 四处语义是否自洽；Claude（信任框在 `pane run` 之后）与 Codex（`agent_not_ready`）两条路径是否被同一套语义覆盖。
4. **fake 与真实的对齐**：`fake-herdr.mjs` 的注释、`evidence/real-herdr-command-shapes.json` 的记录、`DHR_68/D` 测试的断言，三者是否一致；有没有哪个命令在其中一处被写错（轮 1 就抓到过一处）。
5. **允许路径**：DevPlan 的 `dh:allowed-paths:v1 task=DHR_68` 与实际 `git diff --name-only d6358dc..HEAD` 是否逐条吻合。

产出格式：`## 结论：PASS/FAIL`、`## 比对表（比对对象 | 涉及路径 | 是否一致 | 依据）`、`## 发现（同上表头）`、`## 我实际跑了什么`。
