<!-- dh:v1 · dev_plan/drafts/DHR-B-36-DHR71隔离清单与绿闸范围校正-候选.md -->
# DHR-B-36 候选 · DHR_71 隔离清单 2→4 与绿闸范围校正（DHR_71 / DHR_72 两卡的小调整）

> 状态：**草案 v3，三轮审核闭合（§6），待用户讲解 / 理解问答 / 确认落盘**。v1 → 第一轮 fresh 只读审核（`b36rev1`）不通过（4×P1），四条全部采纳后修为 v2；v2 → 第二轮定向复审（`b36ver1`）判 R1-01/02/03 到位、R1-04 未闭合（1×P1：两条用例走的不是同一条启动路径，统一公式不成立），采纳后修为 v3（§6 审核账）。触发：DHR_71 施工 worker 按 task_plan 的 blocked 判据停手（`wt/DHR_71@b268456`，`construction.DONE status: blocked`），用户 2026-09-02 点选「走小 B-adjust」。
> 上游：[`DHR-B-35`](./DHR-B-35-driver持续观测与定向回归复绿-候选.md)（已落盘）§3.1/§3.2 与其审核 X-03 冻结的用例行级互斥。**不触发 A-full**：不改 design/12 任何验收 ID、不改 Receipt/Result/事件合同、不改 DHR_72 的运行契约（D-B35-6/7）、不改卡序与依赖。
> 施工现场（独立可打开，均在分支 `wt/DHR_71`，未合入 master）：`workspace/DHR_71/construction.DONE`、`progress.md`、`findings.md`、`evidence/gate-round{1,2,3}-20260902T0405Z.txt`、`evidence/hang-repro-20260902T0338Z.txt`、`evidence/baseline-20260902T0316Z.txt`、`evidence/isolated-*-20260902T0322Z.txt`。

## 1. 触发事实（DHR_71 实测，独立可打开）

| 事实 | 出处 |
|---|---|
| 基线复现与 F-3520 逐条同名：五文件 55 条 / 50 pass / **5 fail** / 0 skip，126s，本轮无挂死。 | `evidence/baseline-20260902T0316Z.txt` |
| 隔离单跑之和 **185s**（herdr-adapter 53 / agent-node 27 / dhr64 16 / dhr69 52 / dhr70 37）→ 机器证 A 的每轮上限 370s。 | `evidence/isolated-*-20260902T0322Z.txt` |
| 有界等待落地后三轮绿闸：**51/2/2 → 50/2/3 → 51/2/2**（pass/skip/fail），每轮 102/143/102s，三轮均收口，skip 恰 2。差的只有 fail=0。 | `evidence/gate-round{1,2,3}-20260902T0405Z.txt` |
| **`agent-node.test.mjs`「DHR_33 窄路径」（原 `:198`）三轮全红，红因不是超时**：等待修好后暴露的是断言 `attempt_failed(E_EXECUTOR_KILLED)`（`undefined !== 'E_EXECUTOR_KILLED'`），而现役 driver 在 `stop` 写的是 `human_input_requested(E_EXECUTOR_KILLED)`（`workflow-driver.mjs:425`，全仓 herdr 侧唯一 `E_EXECUTOR_KILLED` 写点）——**与 B-35 已冻结 skip 的 `herdr-adapter.test.mjs:279` 完全同根**。 | `gate-round1` 第 69-73 行；`workflow-driver.mjs:425`；worker `F-7102` |
| **`herdr-adapter.test.mjs`「#10 恢复届」（原 `:354`）三轮全红，红因是语义**：等 `attempt_orphaned`，但 DHR_64 `0dd371d` 已把恢复届「探活 missing → 直写 orphaned」换成 `human_input_requested(E_EXECUTOR_HOST_LOST)`；有界化后的超限 dump 直接打出事件序列 `[…, "host_observation_changed(alive)", "human_input_requested:E_EXECUTOR_HOST_LOST"]`。 | `gate-round1` 第 87-89 行；`workflow-driver.mjs:539-540`（恢复届 `probe.missing` 分支）；worker `F-7104` |
| `dhr69-false-ready.test.mjs:179`「DHR_69/A driver」三轮 绿/红/绿，隔离单跑也红过一次：`until(...,'false-ready waiting_human')` 45s 超时。该文件**不在** `dh:allowed-paths:v1 task=DHR_71`。它与 `herdr-adapter.test.mjs:510` 走同一条「启动期 blocked → `waiting_human`」路径，`:510` 三轮全绿。 | `gate-round2`、`isolated-dhr69-false-ready-20260902T0322Z.txt`；worker `F-7105` |
| **652s 挂死已定位并在测试侧修掉，生产零改动**：用例 `t.after` 里的 `rm(repoRoot,{recursive,force})` 在 `%TEMP%` 上撞见 driver 正在写 `state.json.<uuid>.tmp` 时既不返回也不报错，活跃句柄只剩一个 `FSReqPromise`；`after` 钩子按登记顺序执行，rm 登记在用例体第一行，后登记的 `t.after(stop)` 救不了（负例 A/B 组各 exit=124；B 组复跑 4 轮 2 挂）。修法：`driver.stop()` 放进用例体 `try/finally`，同一负例 5 轮 0 挂（F 组）。 | `evidence/hang-repro-20260902T0338Z.txt`；worker `F-7103`（resolved） |
| B-35 §1 把 `agent-node:198` 与 `herdr-adapter:354` 记为「1s–10s 预算的等待超时，倾向时序脆弱」——**这个归类错了**：两条都是 DHR_64 之后的语义红，超时只是表象。真正的时序红只有 `agent-node:231` 一条（已修，三轮绿）。 | 上两行 + `evidence/baseline` vs `gate-round*` 对照 |

## 2. 调整项（只有这四处）

### 2.1 DHR_71 · 隔离清单 2 → 4，允许路径加一条用例体

- **隔离清单**（冻结，恰 **4** 条；用例内均标 `F-3520 → DHR_72`；**定位锚 = 文件 + 完整用例名 + `master@81f5a53` 基线行号**，行号只作辅助，DHR_71 合入后一律按用例名定位，不得按漂移后的行号猜）：

  | # | 文件 | 完整用例名（`test(...)` 第一个参数，逐字） | 基线行 `master@81f5a53` | 来源 |
  |---|---|---|---|---|
  | S1 | `relay-core/test/herdr-adapter.test.mjs` | `DHR_33 driver #3/#5：done 有界、判定成功与双亡 HOST_LOST` | `:242` | B-35 原有 |
  | S2 | `relay-core/test/herdr-adapter.test.mjs` | `DHR_33 driver：stop 撞 launch 窗口仍杀 pane，失败写 killed Result 且不造 Attention` | `:279` | B-35 原有 |
  | S3 | `relay-core/test/herdr-adapter.test.mjs` | `DHR_33 driver #10：恢复届按账上 ref 判 orphaned 或接管同一 attempt` | `:354` | 本次新增（F-7104） |
  | S4 | `relay-core/test/agent-node.test.mjs` | `DHR_33 窄路径：driver 托管 herdr-agent，开 Attempt、记心跳并按 stop 落 killed` | `:198` | 本次新增（F-7102） |

  S3/S4 **只加 skip 标记、不重写**；DHR_71 已落在其用例体内的有界等待与 `try/finally stop` **保留**。DHR_72 收口的「0 skip、55/55」按此表逐条核销：解除的必须恰是这 4 个用例名，多解少解都不算过。
- **机器证 A 改写**：「skip 恰为 **4**、fail 为 0，无一轮不收口；每轮总时长 ≤ 隔离单跑之和的 2 倍」；措辞只能写「**隔离 4 条 skip、其余全 pass**」，不得写「全绿」。B/C/D 不变。
- **允许路径新增**：`relay-core/test/dhr69-false-ready.test.mjs` —— **限定仅用例 `DHR_69/A driver：假就绪恰写一次 blocked Attention，扣住指令，不写 HOST_LOST`（`master@81f5a53` `:179`）用例体内的等待逻辑**（`until(...,'false-ready waiting_human')` 一处），改法与 `:510` 同款：换 `helpers/bounded-wait.mjs` 的 `untilEvent`、超限 dump。文件级 `until` 助手（`:15`）与其余用例不动。
- **「启动 → `waiting_human`」等待的上限规则（冻结）**：上限不是一个统一常数，而是**按该用例实际走的 `launchHerdrAgent` 调用链，把每次 Herdr CLI 调用的生产上限逐段相加，再乘 1.5 余量**；每次 CLI 调用的生产上限以 `herdr-cli.mjs:41-42` 为准（通用 `timeoutMs = 10_000`；仅 `agent start` 用 `startTimeoutMs = HERDR_START_TIMEOUT_MS = 60_000`，`:17/:70`），ready 等待段按夹具生效的 `herdrReadyTimeoutMs` 计入。两条用例**走的不是同一条链**（第二轮复审 R2-01 指出）：

  | 用例 | Profile / 分支 | 调用链（`herdr-executor.mjs` 行号） | 各段生产上限 | 上限 = 1.5 × Σ |
  |---|---|---|---|---|
  | `herdr-adapter.test.mjs:510` DHR_68/C | Codex；`agentStart` 返回 `notReady` → `startBlocked` 分支（`:75`），**不进** rename、ready 等待 deadline 为 0（`:99`） | `paneSplit`（`:52`）→ `agentStart`（`:70`）→ 首次 `observeHerdrAgent`（`:99-100`：`agentGet` `:114`，DHR_69 规则下 idle 才读 `paneGet` `:125`，此处 blocked 不读） | 10_000 + 60_000 + 10_000 = **80_000** | **120_000ms** |
  | `dhr69-false-ready.test.mjs:179` DHR_69/A | **Claude**（夹具默认 `claudeProfile`，`:33/:35`）；`paneRun` 路径，**不消耗** `HERDR_START_TIMEOUT_MS`；blocked 是 `agent get=idle ∧ pane get=blocked` 在 `observeHerdrAgent` 里**派生**出来的，不是 `startBlocked` | `paneSplit`（`:52`）→ `paneRun`（`:68`）→ `renameClaudeAgent`：`agentList` + `agentRename`（`:29/:33`，`readyTimeoutMs=0` 故恰一轮）→ 首次 `observeHerdrAgent`：`agentGet`（`:114`）+ `paneGet`（`:125`，idle 时读）→ ready 循环 deadline 为 0（`:99`，夹具 `herdrReadyTimeoutMs: 0`，`:55`） | 10_000 × 6 = **60_000** | **90_000ms** |

  两处代入过程与所引行号必须原样写进 DHR_71 `progress.md`（机器证 B 清单的「上限依据」列）。**现有的 45s 不是上限，是当初拍的数**：它小于两条链各自的合法生产上限，既不能证明生产语义错，也覆盖不了合法慢启动——DHR_71 v1 在 `:510` 保留 45s 的理由（「在 60s 之内」）方向反了，本次一并改正。`:510` 第二处「`agentGets ≥ 5`」按同一规则推导：5 轮 × (夹具生效的 `herdrPollMs` + 每轮观测的 CLI 上限 10_000) × 1.5，并写依据。**这些上限是保守上限**（fake 调用瞬时返回，真实耗时远小于此），用途只有一个：把「挂住」变成「上限内 fail + 现场 dump」；它们不是对 45s 超时成因的解释——成因由 dump 给出。
- **该路径的机器证 B 负例**：不改 `fake-herdr.mjs`（DHR_72 唯一归属），用**临时缩小 `timeoutMs`**（如 1ms）让目标状态来不及发生，证明用例在上限内 fail、超限输出含事件序列 / `node_states` / fake 计数器；跑完恢复公式值。上限内成功由三轮绿闸本身证明。
- **若上述公式代入后该用例仍红**：说明红因不是上限，而是生产路径或 EPERM（BL-17）——只登记，去向由主控裁，本卡不再调数字。
- **用例行级限定同步**：`herdr-adapter.test.mjs` 可动行改为「仅 `:354`、`:510` 用例体内的等待逻辑，及对 S1/S2/S3 加 skip 标记」；`agent-node.test.mjs` 可动行改为「仅 `:198`、`:231`、`:265` 的等待逻辑、文件级超时配置，及对 S4 加 skip 标记」。
- **同一用例体内的责任边界（两卡反向禁改，写入两张卡）**：S3/S4 用例体内，**DHR_71 只拥有**等待逻辑（`untilEvent`/`withDeadline` 与上限）、`try/finally stop` 清理顺序、skip 标记三样；**DHR_72 只拥有**移除 skip 标记与按 Receipt-bound 语义改写终态断言两样，**不得回改** DHR_71 落下的等待与清理逻辑（要改须另走用户确认扩路径）。反过来 DHR_71 **不得**碰这两条用例的任何断言。串行顺序（DHR_71 先合入 master）只解决合并冲突，不替代这条边界。
- **登记**：F-3520 的归类校正（4 语义 + 1 时序）写进 DHR_71 卡「实施提示」，作为 DHR_72 机器证 E 的输入。

### 2.2 DHR_72 · 机器证 E 从 2 条扩到 4 条

- **机器证 E 改写**：解除 DHR_71 隔离的 **4 条**（§2.1 冻结表 S1~S4，按用例名逐条核销）并按 Receipt-bound 语义重写；`:305` 重写为「单次 Attention 后继续轮询」。收口时定向套件 **0 skip、55/55**（总数不变：55 条用例本来就在，只是从 skip 回到 pass）。
- **允许路径新增**：`relay-core/test/agent-node.test.mjs` —— 限定仅 S4 一条用例（按用例名定位）。`herdr-adapter.test.mjs` 限定行加 S3。
- **反向禁改**（与 §2.1 对称）：DHR_72 在 S3/S4 用例体内只可移除 skip 与改写终态断言，不得回改 DHR_71 的等待与 `try/finally stop`。
- **明示边界**：`:354` 与「DHR_33 窄路径」的现役语义（`stop` → `human_input_requested(E_EXECUTOR_KILLED)`；恢复届探活 missing → `human_input_requested(E_EXECUTOR_HOST_LOST)`）是 DHR_64 按 design/12「Herdr/judge 不得直写 Result」**有意**改成的，DHR_72 只**重写测试对齐现役**，**不得**为让旧断言变绿去动 `workflow-driver.mjs` 的 recovery 段（`:205-275` 之外的 recovery 逻辑仍在 DHR_72 禁改清单内）。

### 2.3 P6 §0.2 `B-35` 事件段的历史归类显式校正

- 现文：「基线定向回归 55 条 5 红（F-3520：**2 条 DHR_64 前语义陈旧、3 条时序脆弱**，另一次 652s 挂死）」。本次不改写原句（历史留痕），在其后追加一句：「**B-36 校正（2026-09-02）**：DHR_71 有界化取证后，`agent-node:198` 与 `herdr-adapter:354` 亦为 DHR_64 后语义陈旧（F-7102/F-7104），实为 **4 条语义陈旧、1 条时序脆弱**（`agent-node:231`，DHR_71 已修）；原归类已被推翻，DHR_71 隔离清单据此冻结为 4 条。」
- DHR_72 的「55/55、0 skip」数字不变；§6 覆盖表「F-3520 由 DHR_71（时序）+DHR_72（语义）分担」措辞不变，只是分担边界从 2/3 变为 4/1。

### 2.4 backlog `DHR-BL-17` 补一条实测形态

- 在 BL-17 追加：「DHR_71 实测另一形态：`rm(recursive)` 撞上 driver 正在写的 `state.json.<uuid>.tmp` 时**不报 EPERM 而是永不返回**（活跃句柄仅一个 `FSReqPromise`），表现为 `node --test` 整进程不收口（DHR_35 的 652s 挂死即此）。测试侧规避 = 先 `stop` 再 `rm`（`try/finally`），见 `workspace/DHR_71/evidence/hang-repro-20260902T0338Z.txt`」。不改 BL-17 的归属与去向（**保持 open**：DHR_71 修的是测试收尾顺序，不是 `%TEMP%` 原子文件竞争本身）。

## 3. 不动的东西

- 卡序 `DHR_71 → DHR_72 → DHR_73`、`DHR_72 → DHR_35`、DHR_35 重开合同、D-B35-1~7 全部不变。
- DHR_72 的运行契约（无墙钟上限、人工 stop 唯一出口、五出口 fail-closed、机器证 A~D/F/G）、`workflow-driver.mjs:330-422` 唯一归属、共享夹具与 `fake-herdr.mjs` 唯一归属 DHR_72——全部不变。
- DHR_71 的机器证 B/C/D、档位（标准）、任务类型（light）、非目标（不改生产代码、不重写语义用例、不处理 EPERM）不变。
- design/12、design/06、reason code 表、Store 折叠规则不变。

## 4. 决定点

| ID | 问题 | 主控推荐 | 状态 |
|---|---|---|---|
| D-B36-1 | 「skip 恰 2」这个冻结数字是否改为 4 | **改为 4**。理由：数字建立在 F-3520 的错误归类上；两条新发现的红与已 skip 的两条同根（DHR_64 删 judge 直写通路的必然结果），在 DHR_71 允许路径内无法转绿，且按 B-35 的分工「语义重写归 DHR_72」不该由 DHR_71 重写。替代方案（DHR_71 直接重写这两条）会打破 B-35 X-03 冻结的「语义用例归 DHR_72」互斥。**前提**（第一轮审核加的三条，v2 已写入）：四条按用例名冻结可核销；两卡在同一用例体内反向禁改；P6 §0.2 的 2/3 归类显式校正为 4/1。 | 待用户 |
| D-B36-2 | `dhr69-false-ready.test.mjs:179`（DHR_69/A driver）的 45s 超时归谁 | **归 DHR_71**，前提是 §2.1 已按该用例**真实的 Claude `paneRun` 调用链**推出上限（v3 已写，不再与 `:510` 的 Codex `agentStart` 链混用）并冻结负例合同。**如实陈述**：现有证据只证明本机有一次（合跑）+ 一次（隔离）等待超时，**不能**据此说它是「抖动」——同样可能是测试上限（45s）小于产品合法启动时间；v1 写「抖动」说过头了。三条路各自的代价：**归 DHR_71** = 本卡多一处用例体，风险是不能拿未证实的 45s 当上限（已用公式堵住）；**归 DHR_72** = 扩大 DHR_72 的测试责任面（它已是 heavy 卡且允许路径也没这个文件）；**只登记不修** = 绿闸 fail=0 会继续偶发不成立，等于没有绿闸。 | 待用户 |

## 5. 查漏（覆盖 / 颗粒度 / 依赖）

- **覆盖**：F-3520 仍由 DHR_71（时序 + 隔离）+ DHR_72（语义重写）分担，只是分担的边界从 2/3 改为 4/1；P6-RI-A4、P6-M1~M7、design/06 H1/H3 的承接不变。
- **颗粒度**：DHR_71 仍是一个验收单元（绿闸）；DHR_72 机器证 E 只是清单加长，不新增验收单元。
- **依赖 / 互斥**：`herdr-adapter.test.mjs` 两卡仍按用例行冻结、串行施工（DHR_71 先合入 master，DHR_72 再改）；`agent-node.test.mjs` 同理（DHR_71 的等待改动先合入，DHR_72 只重写「DHR_33 窄路径」一条）；`dhr69-false-ready.test.mjs:179` 仅 DHR_71 可动；无环。
- **worker 增量**：两处 skip + 一处等待 + 重跑三轮绿闸 + 更新 progress/findings/DONE；预计 ≤ 30 分钟。

## 6. 审核账

### 6.1 第一轮 fresh 只读审核（2026-09-02，v1 → v2）

| 复审者 | 形态 | 结论 | 议题 → 裁决 |
|---|---|---|---|
| `b36rev1` | codex `gpt-5.6-terra` · high · `--sandbox read-only` · Herdr 交互 pane `w2:pV` · cwd=主树 `master@81f5a53` · fresh（未参与起草） | **不通过**（4×P1） | **R1-01** 四条 skip 只有行号、不是可一一核销的冻结清单 → **采纳**：§2.1 改为「文件 + 完整用例名 + 基线行号」表，按用例名核销。**R1-02** 串行顺序不等于互斥，同一用例体内两卡责任边界未冻结 → **采纳**：§2.1/§2.2 写入反向禁改（DHR_71 只拥有等待/清理/skip，DHR_72 只拥有去 skip/改终态断言）。**R1-03** P6 §0.2 仍写 F-3520 为 2/3，与本草案 4/1 矛盾 → **采纳**：新增 §2.3 显式校正，原句留痕。**R1-04** `dhr69:179` 判「抖动」证据不足，且「上限由生产上限推出」没有可验收公式；启动即 blocked 分支不叠加 ready 等待，45s 覆盖不了合法启动时间 → **采纳**：§2.1 冻结公式 `1.5 × (HERDR_START_TIMEOUT_MS + 夹具生效的 herdrReadyTimeoutMs)`，`:510` 两处一并改正，负例用临时缩小上限；D-B36-2 措辞改为如实陈述并公平列三条路的代价。 |

- 已核事实（与主控独立核对一致）：F-7102/F-7104 确属语义红（`undefined !== 'E_EXECUTOR_KILLED'`；超限现场 `human_input_requested:E_EXECUTOR_HOST_LOST` 与恢复届 `probe.missing` 现役实现一致；`0dd371d` 确删两类直写）；652s 归因与并入 BL-17 合理，BL-17 应保持 open。
- 第三段未新增决定点，对 D-B36-1 建议「改为 4（以三条前提为条件）」、D-B36-2 建议「归 DHR_71（先把上限推导与负例写实）」。
- 派出前后 `git status --porcelain` 均仅为草案 + brief 两个未跟踪文件，HEAD 未动 —— 零写入取证通过。

### 6.2 第二轮定向复审（2026-09-02，v2 → v3）

| 复审者 | 形态 | 结论 | 议题 → 裁决 |
|---|---|---|---|
| `b36ver1` | codex `gpt-5.6-terra` · high · `--sandbox read-only` · Herdr 交互 pane `w2:pW` · cwd=主树 `master@81f5a53` · fresh（第二个实例，未参与起草与第一轮） | **不通过**（1×P1） | R1-01 / R1-02 / R1-03 **到位**（S1~S4 四个用例名与 `:242/:279/:354/:198` 逐字核对一致；反向禁改与 X-03 的夹具 / `fake-herdr.mjs` / `workflow-driver.mjs` 唯一归属相容；§2.3 原句留痕 + 校正）。**R2-01（R1-04 未闭合）**：v2 把 `dhr69:179` 与 `:510` 写成「统一走 agent-start blocked 路径」并共用公式——**不成立**：`dhr69:179` 夹具默认 Claude profile，走 `paneRun → agentList/rename → observe` 链，blocked 是 `idle ∧ pane blocked` 在 `observeHerdrAgent` 里派生的，不进 `startBlocked` 分支、不消耗 `HERDR_START_TIMEOUT_MS`；拿 90s「覆盖」会掩盖漏算的 pane 启动 / 识别 / 重命名 / 观测调用边界 → **采纳**：§2.1 改为「按各自真实调用链逐段相加 × 1.5」的规则 + 两条链的逐段表（`:510` = 120s，`dhr69:179` = 90s，同数不同因），并明写这些是保守上限、不解释成因。D-B36-2 前提同步改写。 |

- 独立核实：`herdr-executor.mjs:99` 的 `startBlocked ? 0 : readyTimeoutMs` 与 `herdr-cli.mjs:17/:41` 的常量引用成立；`:510` 的 Codex `notReady` 形态确属 `startBlocked`，公式对它可作保守上限。
- 第三段未新增决定点；D-B36-1 建议改为 4，D-B36-2 建议归 DHR_71（以按真实链修正上限为前提）。
- 静态核对、未运行测试（只读沙盒）；派出前后 `git status --porcelain` 仅草案 + brief 两个未跟踪文件，HEAD 未动 —— 零写入取证通过。

### 6.3 第三轮定向复核（2026-09-02，v3，仅 R2-01）

| 复核者 | 形态 | 结论 |
|---|---|---|
| `b36ver2` | codex `gpt-5.6-terra` · high · `--sandbox read-only` · Herdr 交互 pane `w2:pX` · cwd=主树 `master@81f5a53` · fresh（第三个实例） | **PASS，未发现 P0/P1**。逐段核对七项全「对」：`:510` 的 `startBlocked`（executor `:75`）成立、Codex 分支不进 `renameClaudeAgent`（`:85-87`）、ready deadline 为 0（`:99`）、首次观测 blocked 不读 `paneGet`（`:114-125`）→ 80s × 1.5 = 120s；`dhr69:179` 默认 Claude（fixture `:33-55`）走 `paneSplit → paneRun → agentList → agentRename → agentGet → paneGet`，`paneRun` 不用 `HERDR_START_TIMEOUT_MS`，六次通用 10s → 90s；`idle ∧ pane blocked` 派生关系与 `observeHerdrAgent :118-132` 一致；`herdr-cli.mjs:17,41-42,70` 取值一致；§2.1 已把「按实际调用链逐段求和 × 1.5」写成冻结规则并明确 45s 不是生产上限。 |

- 零写入取证：派出前后 `git status --porcelain` 仅草案 + brief 两个未跟踪文件，HEAD `81f5a53` 未动。
- **三轮总账**：三名 fresh 只读实例、三轮，**5 个独立议题：采纳 5 · 驳回 0**（R1-01~R1-04、R2-01）。
