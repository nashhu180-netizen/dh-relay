<!-- brief.md — DHR_74 施工合同。本文件是 DevPlan P6 §3.2「DHR_74」的只读副本；冲突以 DevPlan 为准。
     读者：施工者与各路复核。AGENTS.md 编排协议段全文适用。 -->
# brief — DHR_74 · BL-17 停顿诊断与修复（解阻塞 DHR_71 绿闸）

## 一句话

用测试侧探针把 DHR_71 绿闸反复打红的「BL-17 一族」停顿（F-7108 / F-7109）钉到精确 op，按证据落地标准档内修复，使 DHR_71 门禁可重跑出连续三轮合格。

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
