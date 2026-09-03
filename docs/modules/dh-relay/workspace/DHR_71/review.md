<!-- dh:v1 · review.md — 验收。三区：独立复核区 → AI 提交区 → 人类签名区，物理隔离。 -->
# review — DHR_71

## 独立复核区

本卡任务类型为 **light**（DevPlan `dh:task-type:v1 task=DHR_71 type=light`）：复核配方 = **教训复核 + 一致性复核**两路，无代码轮 1/轮 2，不要求有效单测。施工者（Opus worker）不得复核自己的卡；两路均由未参与施工的 fresh 只读实例完成，主控核结论并登记。

**教训复核**　复核者：`dhr71les`（fresh 只读 codex，未参与施工）　结论：3 条发现——F-71-LES-01（P1）经主控驳回、按候选-26 另派窄审判「部分成立」并按其建议收紧措辞；F-71-LES-02（P2）采纳，条件措辞已固定；F-71-LES-03（P2）采纳，记教训。

**一致性复核**　复核者：`dhr71con`（fresh 只读 codex，未参与施工）　结论：3 条发现——F-71-CON-01 / CON-02（P1）采纳并已整改落盘（`e1074d8`），F-71-CON-03（P2）范围外、遗留 backlog。

**驳回窄审**　复核者：`dhr71les-narrow`（fresh 只读 codex，第三名，独立于上两名）　结论：驳回「部分成立」——主控论证有依据但措辞需收紧，已执行（原文 `review-lessons-narrow-codex.md`，E-7113）。

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

**材料齐没齐**：brief / task_plan / progress(证据) / 独立复核记录 / review 都有了？ [x] —— light 配方两路（教训 / 一致性）+ 驳回窄审各一份原文在工作区；机器证账本见 progress E-7101~E-7119。

**as-built 更新了没**：[x] —— **判定：本卡不改 as-built**。改动面 100% 在 `relay-core/test/**`（有界等待助手 + 三个套件的等待方式 + 4 条语义红隔离），生产代码零改动、契约零变更，`as-built/` 四份快照描述现役实现与契约，无可收敛项。唯一沾边的是绿闸命令（`--test-timeout` 180000 → 300000，F-71-CON-02）——它是验收命令、不是现役实现的一部分，记在 DevPlan §3.2 与本工作区，不进 as-built。

**E6 教训回流**：[x] —— L-7101~L-7107 判重后归并为 `knowledge/教训库-候选.md` 候选-69~74（L-7105 + L-7106 合成候选-73「等待上限逐段推导且方向不能反」），逐条标注与既有候选-31/-35/-51/-57 的关系（`abff757`）。

→ 当前状态：**已收口（用户 2026-09-03 对话确认，见下方人类签名区）**

---

## 人类签名区　✅ 凭你在对话里的确认解锁

本卡四条完成条件**均为机器证**，无人判结果项（H=0）。E11 仍需对话确认本地收口授权包。没有对话确认，AI 不得碰本区。

### 目的一：证明这组定向回归现在是可依赖的绿闸（覆盖 A/B/C/D）

本工作区交付：Herdr 定向回归可重复、可解释（待挂证据）。

| 验什么 | 做什么 | 通过标准 | 结果 |
|---|---|---|---|
| （无人判项）查看机器证包 | 看 E10 展示的独立基线三轮表、skip 核销、签名扫描与保留项 | 机器证均有等价 pass；措辞为「隔离 **4** 条 skip、其余全 pass」（B-36 冻结 2→4） | [x] 通过 |

**E10 人验证据展示区（2026-09-03，实际展示给用户的内容）**：

1. **机器证**：独立基线 `wt/DHR_71@73c43eb`（不含 DHR_74 任何改动）按冻结五文件命令连续三轮 `51 pass / 4 skip / 0 fail`，用例耗时 288.9 / 285.1 / 288.0s，墙钟 296 / 292 / 295s，全部 ≤370s。原始 stdout + JUnit 六份在 `evidence/own-baseline-round{1,2,3}-*`。
2. **skip 核销**：三轮 skip 恰 4 条且为同一批 S1~S4（四条 DHR_33 用例，均挂 `F-3520 → DHR_72` 待按 Receipt-bound 语义重写），按完整用例名逐轮比对一致。
3. **签名扫描**：EPERM / 停顿 / 失败 / 凭据四类签名**零命中**，命令、签名定义与「空扫自证」对照见 `evidence/own-baseline-signature-scan-20260903.md`（两次独立扫描互对）。
4. **合入后复验**：master@84f2514 上同命令 1 轮 `51 pass / 4 skip / 0 fail`、315s（`evidence/postmerge-master-round1-*`）。
5. **保留项（展示时明说、用户知情）**：F-7108 / F-7109 停顿仍 open、已转 `DHR-BL-17` / `DHR_74`；F-71-CON-03（P2 清理顺序隐患）遗留 backlog；**未复现 ≠ 已修复**。
6. **条件措辞**：结论仅在「该五文件冻结命令、`--test-concurrency=1`、2026-09-03 白天本机负载（无并发 worker）」下成立。
7. **诚实边界申报**：两路复核者均为只读沙盒实例、一律静态审，**测试全部由主控跑**。

- 确认记录：用户 2026-09-03 在对话里看完上述展示（含保留项与条件措辞）后，点选「**同意收口，合入 master**」。
- verify 提交 SHA：见本次收口的 `verify(dh-relay): DHR_71 …` 提交
- 签名：hyf（chat-confirm 代签）　　时间：2026-09-03

### 确认记录（append-only）

| 确认时间 | 确认人 | 确认对象=releasePacket | 展示版本(shownVersion) | 证据摘要或哈希(evidenceDigest) | 关联稳定ID列表 | 确认结论(通过\|带风险放行\|否) |
|---|---|---|---|---|---|---|
