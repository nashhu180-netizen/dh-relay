<!-- dh:v1 · review.md — 验收。三区：独立复核区 → AI 提交区 → 人类签名区，物理隔离。 -->
# review — DHR_71

## 独立复核区

本卡任务类型为 **light**（DevPlan `dh:task-type:v1 task=DHR_71 type=light`）：复核配方 = **教训复核 + 一致性复核**两路，无代码轮 1/轮 2，不要求有效单测。施工者（Opus worker）不得复核自己的卡；两路均由未参与施工的 fresh 只读实例完成，主控核结论并登记。

**教训复核结论**：｜命中条目｜由 ｜派出=

## 一致性复核

<!-- dh:consistency-review:v1 task=DHR_71 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| 有界等待工具的口径（等目标事件不等断言值） | 新 `helpers/bounded-wait.mjs` vs 既有 `helpers/settled-state.mjs` vs `herdr-adapter.test.mjs` `runtimeUntil`（`:204-210`，冻结）vs `agent-node.test.mjs` `untilAsync`（`:39`） | | | |
| 等待上限与生产默认值的关系 | 各用例的 `timeoutMs` vs `workflow-driver.mjs:33-34` 的 `herdrPollMs`/`herdrReadyTimeoutMs`/`doneTimeoutMs`/`observationLostMs` 与 `HERDR_START_TIMEOUT_MS` | | | |
| driver 生命周期兜底（`t.after(() => driver.stop())`） | 本卡改的 `agent-node.test.mjs:198/231/265` vs 同文件其余 `startWorkflowDriver` 调用点 vs `herdr-adapter.test.mjs` 各用例（`:510` 已有 `t.after(() => driver.stop())`） | | | |
| skip 标记的形态与理由措辞 | `:242`/`:279` 的 `{ skip: 'F-3520 → DHR_72：…' }` vs 仓内既有 skip 用法 vs DevPlan DHR_72 机器证 E「解除 DHR_71 隔离」 | | | |
| 绿闸命令与证据口径 | task_plan 固定的五文件命令 vs DevPlan 机器证 A 原文 vs `evidence/gate-round*.txt` 实际命令行 | | | |
| 允许路径 vs 实际 diff（含用例行级限定） | DevPlan `dh:allowed-paths:v1 task=DHR_71` + X-03 行级冻结 vs `git diff --name-only master...HEAD` + 逐 hunk 行号 | | | |

## AI 提交区　⚠️ This is not human approval

**Confidence Challenge**：
- 尚未施工，无信心声明。

**设计契约传导声明**：
- 契约无变化：本卡只改测试，不动 `contracts/**`、`store/**`、`runtime/**`；不改任何 design 文档。

**需求对齐证据**（本卡无人判项；四条机器证全部用本机真实 `node --test` 跑出）：

| 需求 / 人验项 | 场景与操作路径 | 证据 (E-00x) | 结论（满足 / 不满足 / 待人验） |
|---|---|---|---|
| F-3520 时序部分：定向回归每次跑都一个结果 | 五文件绿闸命令连续 3 轮 | E-7101 | 待人验 |
| F-3520 652s 挂死：挂死变成失败而不是不收口 | 负例（目标事件不发生）在上限内 fail 且进程退出 | E-7102 | 待人验 |

**完成条件逐条挂证据**

| # | 完成条件 | 谁验 | 证据 (E-00x) | 达成? |
|---|---|---|---|---|
| A | **机器证 A（绿闸）**：五文件 `node --test --test-concurrency=1` 连续 3 轮，每轮记录 pass / skip / fail、每文件时长、总时长：**skip 恰为 4（B-36 冻结表 S1~S4）、fail 为 0**，无一轮不收口；每轮总时长 ≤ 隔离单跑之和的 2 倍；三轮原始输出入 `workspace/DHR_71/evidence/`。只能写「隔离 4 条 skip、其余全 pass」，**不得写「全绿」**。 | machine | | |
| B | **机器证 B（等待有界）**：每个被改的等待能列出「目标事件 + 上限 + 超限失败输出」；人为让目标事件不发生，用例在上限内 fail 而不是挂住（至少对 652s 那条做此负例）。 | machine | | |
| C | **机器证 C（652s）**：已定位（附复现步骤）并修；若指向生产，登记 finding 并注明去向。 | machine | | |
| D | **机器证 D（路径）**：`git diff --name-only master...HEAD` 仅含 `relay-core/test/**` 与 `workspace/DHR_71/**`。 | machine | | |

**验收项元数据表**

| 命题 | 事实证明方式 | 最终裁决者(machine\|human) | 稳定 ID | 覆盖态(等价覆盖\|部分\|否\|无法取证) | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 定向五文件连续 3 轮结果一致且收口 | 固定命令连跑 3 轮，逐轮记 pass/skip/fail 与时长 | machine | DHR_71-A | | skip=2 ∧ fail=0 ∧ 三轮均退出 ∧ 每轮总时长 ≤ 隔离单跑之和 × 2 | | 本地 Node 24 · Windows 11 · `--test-concurrency=1` | `node --test` reporter 原始输出 | 本机以外的机器不由本卡取证；EPERM（BL-17）轮次作废重跑需如实登记 | DevPlan DHR_71 | 脚本 | 自动化 |
| 每个被改的等待都有目标事件与上限 | 清单 + 负例运行 | machine | DHR_71-B | | 清单逐条有「目标事件 / 上限 / 超限输出」；负例在上限内 fail 且进程退出 | | 本地 Node | 负例原始输出 | 未被改的等待不在本卡范围 | DevPlan DHR_71 | 脚本 | 自动化 |
| 652s 挂死已定位 | 复现步骤 + 对照运行（挂 / 不挂） | machine | DHR_71-C | | 有可复现条件；修法在测试侧则修，指向生产则登记去向 | | 本地 Node | 对照两份输出 | 若成因为生产侧，本卡不证修复 | DevPlan DHR_71 | 脚本 | 自动化 |
| diff 不越允许路径与用例行级冻结 | `git diff --name-only master...HEAD` + 逐 hunk 行号核对 | machine | DHR_71-D | | 文件集 ⊆ 允许路径；`herdr-adapter.test.mjs` hunk 仅落 import 区 / `:242`/`:279` 头行 / `:354-364` / `:510-538` | | git | DevPlan `dh:allowed-paths:v1 task=DHR_71` | 无 | DevPlan | 脚本 | 自动化 |

**风险放行账表**

| 接受人 | 授权依据 | 范围 | 影响 | 期限或复审点 | 恢复条件 | 持久去处 |
|---|---|---|---|---|---|---|
| 无 | | | | | | |

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [ ]
**as-built 更新了没**：本卡只改测试；`as-built/relay-core.md` 是否需要补绿闸命令一句，收口时判。 [ ]

→ 当前状态：**进行中（D-start）**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

本卡四条完成条件**均为机器证**，无人判结果项（H=0）。E11 仍需对话确认本地收口授权包。没有对话确认，AI 不得碰本区。

### 目的一：证明这组定向回归现在是可依赖的绿闸（覆盖 A/B/C/D）

本工作区交付：Herdr 定向回归可重复、可解释（待挂证据）。

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| （无人判项）查看机器证包 | 看 E10 展示的三轮绿闸表、等待清单、652s 对照与越界自查 | 四条机器证均有等价 pass；措辞为「隔离 2 条 skip、其余全 pass」 | [ ] |

- 确认记录：
- verify 提交 SHA：
- 签名：hyf（<chat-confirm 代签 / 本人敲 git>）　　时间：

### 确认记录（append-only）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---|---|---|---|---|---|---|
