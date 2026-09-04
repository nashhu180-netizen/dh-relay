<!-- brief.md — DHR_74 施工合同。本文件是 DevPlan P6 §3.2「DHR_74」的只读副本；冲突以 DevPlan 为准。
     读者：施工者与各路复核。AGENTS.md 编排协议段全文适用。 -->
# brief — DHR_74 · BL-17 停顿诊断与修复（解阻塞 DHR_71 绿闸）

## 一句话

用测试侧探针把 DHR_71 绿闸反复打红的「BL-17 一族」停顿（F-7108 / F-7109）钉到精确 op，按证据落地标准档内修复，使 DHR_71 门禁可重跑出连续三轮合格。

## 覆盖任务

DHR_74（P6 · 标准档 · 任务类型=常规）。承接 backlog `DHR-BL-17` 的 F-7108 / F-7109 两种停顿形态；诊断结论喂 DHR_73，**不替代**其真实启动停摆调查。不改变 D-B35-1 的卡序 71→72→73。

## 完成条件 ★必写

以 DevPlan §3.2 `DHR_74` 为唯一权威口径，本卡三条机器证：

| # | 条件 | 判据 |
|---|---|---|
| A | 停点钉死 | 测试侧探针在复现轮打出停住的**精确 op / 路径 / 耗时 / 现场**，F-7108 或 F-7109 至少一种定位到函数级落点；时间盒内未复现则交付 ≥10 轮 × 2 种负载条件的复现率与对照数据，并**如实登记未钉死** |
| B | 修复落地 | 按证据走决策树：测试侧修复须有**红→绿对照**（修复前复现 / 修复后同条件消失）；环境侧修复只产证据 + 操作指引交用户；Store 语义修复 = 停手走升级条款 |
| C | 门禁重跑 | 冻结五文件命令连续 3 轮 `skip=4（S1~S4 按完整用例名核销）∧ fail=0 ∧ 每轮 ≤370s`，零 BL-17 签名，带条件措辞（F-71-LES-02）；**必须跑在本卡自己的基线**（master 已含 DHR_71 收口 + 本卡改动），组合分支轮次只算过程证据（2026-09-03 用户确认补充） |

## 边界 (Boundaries)

- **不做**：不改 Store 落盘语义（见升级条款）；不动 DHR_72 专属物（`workflow-driver.mjs` 轮询段、`fake-herdr.mjs`、S1~S4 断言重写、共享夹具的结构与断言）；不重写任何语义陈旧用例；不跑真实 Agent；不重跑 DHR_35；不 push、不部署。
- **禁改**：`relay-core/store/**`、`relay-core/runtime/**`、`relay-core/contracts/**`、`package.json`、任何断言与用例语义。
- **停手条件**：诊断若证明必须改 Store 写路径语义（rename 有界重试 / 持久化超时 / 批量持久化），立即停手转主控升高危重新请用户确认。

## 背景（只读输入，权威在引用处）

- `DHR_71` 的 `progress.md` / `findings.md`：F-7108（停于 `attempt_started` 后、fake 全 0，`store.mjs` `registerReceipt` → `persistState` 推断）与 F-7109（停于首次 `host_observation_changed(alive)` 后、启动期 Attention 落账前，fake 非零 `agentGets=1/paneGets=1/paneSplits=1`，driver `workflow-driver.mjs:366` idle∧blocked 判定 → `:372` `appendEvent(human_input_requested)`）。
- 已被实测**否定**的充分修复：清理 `%TEMP%`（清理后仍红）、把 TEMP 隔离到仓内目录（`gate-isolated-temp-round{1,2}`：1 绿 1 红）。⇒ 根因不在「目录在不在 %TEMP%」，别再押注搬目录。
- 写链结构（主控已侦察，供探针设计参考）：driver → `actor.submitControl` 串行队列（`host.mjs:170`）→ Store 全局写队列（`store.mjs:164` `createWriteQueue` + `:357` `guardedJob` 的 `writeGuard`）→ `emitEvent`（appendFile events.jsonl）→ `persistState`（`writeAtomic` = writeFile tmp + rename）。任一环不返回，队列尾全部冻结——这与「事件账恰好停在某一条」的两形态都吻合。
- 夹具清理竞态存疑点：`workflow-driver.mjs:607` `stop()` 只等 `current?.kill()` 与 `done`，**不显式等 Store 写队列排空**——若 stop 返回时仍有在途 rename，后续 `rm(repoRoot)` 可与之相撞（F-7103 同族的新形态）。

## 授权与档位

- 用户 2026-09-03 对话确认（原文）：「要继续解除阻塞，需要按标准档为 DHR-BL-17 立/调专卡，允许诊断并修复 Store 持久化/测试临时目录争用，再重跑 DHR_71 门禁。……继续解决」
- 档位：标准档 · task_type=normal（启动时冻结，不中途升档）。
- **升级条款（硬）**：诊断若证明必须改 `relay-core/store/**` 写路径**语义**（rename 有界重试 / 持久化超时 / 批量持久化——均属契约面），**立即停手**：证据与 B-adjust 候选写 progress/findings，转主控升高危并重新请用户确认。

## 变更范围（允许路径）

本卡范围同步 DevPlan 后补授权：`herdrPollMs` 统一抬到 **20ms 绝对值**（原值 2 或 5，倍率不一）；配对超时仅在语义为「等满 N 次 poll」时同比例放大，墙钟上限（如 `60_000`）保持不变；依赖 poll 推导的注释与预算常量随之更新。此前「12 行 ×10 等比」不是本卡口径。

- `relay-core/test/helpers/**`：新增探针/等待工具；**不含** `fake-herdr.mjs`。
- `relay-core/test/*.test.mjs`：仅「夹具临时目录根、收尾清理顺序、import 探针」类**非断言行**；共享夹具 `runtimeFixture` / `recoveryFixture` 至多动 `mkdtemp` 根一行（B-35 X-03 归属冻结的用户授权例外，复核逐字核对仅此一行）。
- `docs/modules/dh-relay/workspace/DHR_74/**`、backlog 仅 DHR-BL-17 补录、DevPlan 仅状态行列。
- **禁改**：`relay-core/store/**`、`relay-core/runtime/**`、`relay-core/contracts/**`、`package.json`、任何断言与用例语义。

## 机器证（与 DevPlan 同文）

- **A（停点钉死）**：探针捕获 ≥1 次停顿并定位到函数级落点；或 ≥10 轮 × 2 负载条件的复现率数据 + 如实登记未钉死。
- **B（修复落地）**：按证据走决策树；测试侧修复须红→绿对照；环境侧修复只产指引交用户；Store 语义修复 = 停手升级。
- **C（门禁重跑）**：冻结五文件命令连续 3 轮 skip=4 ∧ fail=0 ∧ ≤370s，带负载条件措辞（F-71-LES-02），三轮零 BL-17 签名；撞签名轮作废留证。结果同时记入 DHR_71 证据账。

## 纪律

- 措辞：没拿到证据不得写「根因已消除」「全绿」；未复现 ≠ 已修复。
- 证据：design/12 §2 脱敏，零原 Receipt ID、零凭据；原始 stdout/JUnit 全保留不删；作废轮改名 `.VOID-*` 留证。
- 探针必须可一键卸载：优先 `NODE_OPTIONS=--import` / `--import` 预加载注入，**零测试文件改动**；若必须 import，限 import + install 两行。
- 负例义务：任何「修好了」的主张都要有负例或对照实验撑着。
- blocked 判据：机器证 A/B 按决策树走完仍不可达、或触发升级条款 → 停手写 DONE（status: blocked），不硬凑。
- 施工者不复核本卡；复核 fresh 换人另派。
