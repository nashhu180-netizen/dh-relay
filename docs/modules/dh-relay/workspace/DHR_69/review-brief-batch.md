<!-- dh:v1 -->
# DHR_69 · Review Batch（代码轮 2 / 需求 / 教训 / 一致性）

> 你是**复核 worker**，不是主控。只做本文件里**分配给你那一节**的事：只读复核，不改任何文件、不拉终端、不派活、不问用户。
> 结论**直接写在回复正文里**。只写事实与级别，不替主控做验收裁决。
> 只读形态：`codex --sandbox read-only`。写文件会被沙盒拒绝。

## 公共上下文

- 仓库：`D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_69`（`wt/DHR_69`）
- 生产 diff：`git diff 3b147d7..140f21f -- relay-core/`（D-start `3b147d7` → 施工 `140f21f`）
- 必读：`AGENTS.md` → `workspace/DHR_69/brief.md` → `task_plan.md` → `progress.md` → `findings.md` → `review.md` → 轮 1 结论（若已落 `review-code1-*.md` 或 `review.md` 第一轮区）
- 权威验收：DevPlan §3.2 `DHR_69` 六条机器证 A–F

**硬边界（越界即 P0）**：允许路径仅 `herdr-executor.mjs`、`workflow-driver.mjs`、`herdr-adapter.test.mjs`、`fake-herdr.mjs`、`dhr69-false-ready.test.mjs`、`package.json`（只加一个测试文件名）、`workspace/DHR_69/**`。不得改 `herdr-cli.mjs`、Store、RPC、contracts。零按键、不跑真实 Agent、不新增 reason code。`workflow-driver.mjs` 不得改 Result **语义**。

**冻结键**：`herdr_status`=派生结论；`agent_get`/`pane_get` 为原始值；覆盖规则唯一 = idle∧blocked → 派生 blocked；升级 Attention 用 `conflict_escalation=idle_blocked`，`reason` 空。

**已知、不用重复报**：herdr-adapter 3 例 DHR_33 基线失败；`npm test` 并发不稳（F-6806）；DHR_68/C 整文件串行可能超时、单跑绿（E-6903）；F-6901 是 DevPlan 措辞滞后。

---

## 【A 路】代码复核轮 2（fresh-context，未继承轮 1 会话）

全程都要看，**不是只看增量**。重点：

1. 轮 1 发现是否闭合（若轮 1 PASS 且无整改，核「有没有漏看」）。
2. recovery 发送时机：是否可能在观测失败时误发；`instructionPending` 在 recovery+启动两条入口是否会双发。
3. 真 `agent_get=blocked` 会不会误升 `conflict_escalation`。
4. `waitForExecutorResult` / `E_EXECUTOR_RESULT_MISSING` 文本是否被改。
5. 允许路径精确比对。

**你还必须选定并登记一个有效单测变异点**（生产代码语义，不是测试）。给出：文件+函数+具体改法、预期变红测试名、为什么代表本卡核心语义。不要自己施加变异。

产出：`## 结论`、`## 逐条验收判定`、`## 轮 1 复验`、`## 发现表`、`## 指定变异点`、`## 我实际跑了什么`

---

## 【B 路】需求方向复核

判「做出来的是不是需求要的」。重点：

1. 六条验收是否被证据真正打中，有没有「测试很多但没打中命题」。
2. 有没有说过头：不承诺自动收敛、不声称本卡完成 A-27、不声称真实 Claude 已通。
3. 用户理解「停下来等你按，按完接着干」是否被实现守住。
4. 零按键 / 不碰产品配置 / 不跑真实 Agent 是否被突破。

产出：`## 结论`、`## 逐条命题-证据对齐表`、`## 发现`、`## 有没有说过头`、`## 我实际跑了什么`

---

## 【C 路】教训复核

读 `docs/modules/dh-relay/knowledge/教训库.md` 与 `教训库-候选.md`。判本卡有没有重蹈；`lesson_candidates.md` 是否漏记。重点对照：fake 形态必须对真（候选-6/36/L-6801）、补丁只治被指出的实例（候选-11，正是 F-6807 并入的理由）、延后动作不要用有限白名单（L-6805）。

产出：`## 结论`、`## 命中的在册条目`、`## 重蹈/未重蹈`、`## 漏记候选`、`## 我实际跑了什么`

---

## 【D 路】一致性复核

横向：本次碰到的口径在别处有没有兄弟。至少比对：

1. 假就绪判定 vs DevPlan/brief/`observeHerdrAgent`/driver 三时点
2. `detail` 三键 vs `observationDetail` 与升级 Attention
3. 「恰补发一次」届内限制 vs F-6807 文字
4. Codex `agent_not_ready` 负例 vs DHR_68/C
5. 允许路径 vs 实际 diff

「全部一致」也要列表。不一致逐条裁「有意差异」或「遗漏」。

产出：`## 结论`、`## 比对清单`（五列表头：比对对象 / 同类路径 / 定义是否一致 / 裁决 / 派出证据占位）、`## 发现`、`## 我实际跑了什么`

级别：P0 正确性/安全/越界；P1 验收不成立；P2 可维护性/证据；P3 建议。
