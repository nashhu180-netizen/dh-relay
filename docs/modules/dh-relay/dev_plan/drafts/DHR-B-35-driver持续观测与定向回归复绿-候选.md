<!-- dh:v1 · dev_plan/drafts/DHR-B-35-driver持续观测与定向回归复绿-候选.md -->
# DHR-B-35 候选 · driver 持续观测 / 定向回归复绿 / 启动链静默停摆（三张新卡 + DHR_35 重开合同）

> 状态：**已落盘**。用户 2026-09-02 点选「确认落盘」，本草案 v3 已写进 [P6 正式 DevPlan](../P6-Herdr多账号执行底座-开发方案.md)（§0.2 `B-35` 事件段、§3.1 任务表 `DHR_71/72/73` 行与 `DHR_35` 行、§3.2 三张任务卡与 DHR_35 重开合同、§6/§7），backlog 新增 `DHR-BL-18`，审核账见 [evidence/35](../../design/evidence/35-DHR71-73-driver持续观测与定向回归复绿-B调整交叉审核记录.md)。**落盘后本草案只作历史留痕，不再是权威。**
> 沿革：v1 → 第一轮 fresh 只读审核（`b35rev1`/`b35rev2`）不通过、9 个独立议题全部采纳后修为 v2；第二轮定向复审（`b35ver1`）判 8 条到位、X-03 未到位（共享夹具），采纳后修为 v3；第三轮定向复核（`b35ver2`）判 X-03 到位、**PASS、无新增 P0/P1**。四个 fresh 只读实例、三轮，**10 个独立议题：采纳 10 · 驳回 0**。用户 2026-09-02 对话明文「那就按你的建议走」，授权主控起草并派审；**落盘另需用户对最终版确认**。第一轮审核账见 §8。
> 触发：DHR_35 三轮独立复核后仍有两条收口阻塞（F-3517 / F-3520），用户 2026-09-01 两次裁决「先修 driver 再收 DHR_35」「另开卡修回归」。施工侧候选原文见 [workspace/DHR_35/b-adjust-candidate-single-sample-observation.md](../../workspace/DHR_35/b-adjust-candidate-single-sample-observation.md)（在 `wt/DHR_35` 分支 `3836fd3`，尚未合入 master），本草案是它的**计划层落地版**，并补齐该文件没定的顺序、证据归属、调查拆分、P6-X 挂靠与历史证据登记。
> 上游设计：[design/12](../../design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md) P6-RI-A4、[design/06](../../design/06-多控制面与Headless-SSH运行-设计补充.md) H1/H3/H5。**不触发 A-full**：不改 Receipt/Result/事件合同、不加 reason code、不改 P6-M1~M7 口径。

## 1. 触发事实（DHR_35 实测，独立可打开）

| 事实 | 出处 |
|---|---|
| `workflow-driver.mjs:404-417`：`done`/`idle` 分支是**带 `return` 的终点**。轮询循环「先 observe 再 sleep」（`:335`/`:422`），第一次 observe 紧跟 `sendToHerdrAgent(receiptSubmissionInstruction)`（`:268`）之后；刚 `agent start` 的真实产品必然 `idle`。**这一次采样永久决定不再观测。** | `relay-core/runtime/workflow-driver.mjs`；DHR_35 F-3517 |
| 两条真实实录（Codex E-3532、Claude E-3533）均 `succeeded`，但 `checkpoints/` 全空；受控实录（E-3534，宿主持续 `working`）正常记 9 条 `checkpoint_recorded`。轮询与 checkpoint 逻辑是好的，问题只在「怎样才轮得到」。 | `wt/DHR_35` 的 `workspace/DHR_35/evidence/{windows-codex,windows-claude,controlled-states}/` |
| `E_EXECUTOR_RESULT_MISSING` 写完即 `return`；迟到的 Receipt-bound 提交仍合法推进终态（Codex：seq 6 Attention → seq 7 `attempt_succeeded`）。节点在提交前一直停在 `waiting_human`/`needs_you`，即便宿主其实已在干活。 | 同上 `succeeded-run/events.jsonl` |
| 观测停止后，`observation_lost` / `host_lost` 判定（长在同一循环）永远不再执行。 | `workflow-driver.mjs:337-347` |
| 基线 `master@43e4af9` 定向回归 55 条 **5 红**：2 条**语义**红（`herdr-adapter.test.mjs:242` 传 `herdrJudge` 等它写 Result——该通路已被 DHR_64 删；`:279` 期待 `attempt_failed(E_EXECUTOR_KILLED)`——现役写 `human_input_requested`），3 条**时序**红（`herdr-adapter.test.mjs:354`、`agent-node.test.mjs:198`、`:231`）在不同轮次出没不定；`herdr-adapter.test.mjs:510` 只在隔离跑里红；另一次 `agent-node.test.mjs` 整跑挂死 652s（隔离单跑约 40s）。DHR_35 零生产改动。 | DHR_35 F-3520；`evidence/targeted-tests-*.txt` |
| 四次真实启动两次静默停摆：Codex 第 2 跑 `attempt_started` 后无事件、service 活着却零子进程、pane 未建成（F-3516）；Claude 实录 3m14s 内零 `host_observation_changed`、租约 epoch 1 过期后才由迟到提交推进（F-3519）。`pane split` 探针 8/8 正常（中位 3.0s、最大 6.6s），排除系统性失效。 | DHR_35 E-3530/E-3531/E-3533 |
| master 上 `workspace/DHR_30/evidence/cli-smoke-20260828.txt`（4 处）、`workspace/DHR_31/evidence/e2e-disconnect-20260828.txt`（7 处）、`…-events.jsonl.txt`（12 处）含原 Receipt UUID。这些证据 08-28/29 进仓；「只保留截断/摘要关联符」规则 08-30（`33219fe`，design/12 §2）才立；receipt_id 成为提交入口能力更晚（DHR_64，08-31）。对应 Run 随临时夹具销毁。 | `git grep` master；`git log` 时间线 |

## 2. 一条被现有事实收窄的设计假设（v2 按第一轮 W-02 / X-05 收窄）

state 折叠规则（`relay-core/store/state.mjs:8-14`）已经写着：`checkpoint_recorded` 把节点推回 `running`，`human_input_requested` 推到 `waiting_human`。**只要 driver 在写完 `E_EXECUTOR_RESULT_MISSING` 后继续观测**，宿主一旦再报 `working`、记下一条 checkpoint，节点**折叠状态**就按既有规则回到 `running`（group `needs_you` → `running`）——不需要新事件类型，不需要改合同。

**边界（如实登记，不许说过头）**：
- `human_input_requested` 是不可撤销的历史事件，**不会消失**；本事件不主张「Attention 被清除」，只主张「节点当前状态不再停在它上面」。
- 现役读模型没有为 `human_input_requested` 建独立的 open Attention 对象——`store.mjs` 的 `openAttentions` / `readOpenAttentions` 只装 fallback pause 的 `attention/v1`；CLI `status`/`run_list` 的分堆由 `run-state/v1` 的 `group` 派生（`discovery.mjs` 「不从 run_status 推导、按源头 group 渲染」）。所以「折叠回 running」即是 CLI 侧能看到的全部消解；DHR_72 须用 CLI 投影**实证**这一点（机器证 B (iii)），若发现有别的消费端仍按最后一条 Attention 显示，登记 finding、不扩路径。
- DHR_35 候选 §3 ② 的「显式消解」据此收窄为「继续观测 + 折叠状态回 running + CLI 投影实证」。

## 3. 拟议三张卡（按施工顺序）

### 3.1 DHR_71 · 定向回归复绿（标准 · light）

- **目标**：让 `herdr-adapter` + `agent-node` + `dhr64-driver-observation` + `dhr69-false-ready` + `dhr70-submission-gate` 这组定向回归在本机成为**可重复、可解释**的绿闸：**除冻结隔离清单内的 2 条 skip 外全部 pass、零 fail、零挂死**，为 DHR_72 开工提供可依赖的前置。
- **做什么**：
  - 把 1s–10s 固定小预算的等待改为**事件驱动等待**：每个等待须冻结「等的目标事件/状态」与「有界失败条件」（超上限即 fail 并打印当时状态，**不得**无限等）；或按机器负载放宽预算但同样必须有界。只改测试与 `test/helpers/**`，**不改生产代码**。
  - 定位那次 652s 挂死：给出可复现条件，或证明为测试侧泄漏的定时器/子进程并修掉；每条用例/每个文件加进程级上限（`node --test` 的 `--test-timeout` 或等价），保证挂死表现为 fail 而不是不收口。
  - **显式隔离**两条语义红（`herdr-adapter.test.mjs:242`、`:279`）：`skip` 并在用例内标注 `F-3520 → DHR_72`；**不重写**（重写归 DHR_72）。隔离清单冻结为恰好这 2 条，不得增减。
- **不做 / 边界**：
  - 若某条红的成因落到生产代码（含 driver 语义），**只登记不修**，转 DHR_72 或新 finding；收口时 `git diff --name-only` 不得含 `relay-core/runtime/**`、`store/**`、`contracts/**`。
  - 若成因是 `%TEMP%` 原子重命名 EPERM（[DHR-BL-17](../../backlog.md)），**归 BL-17**，本卡只登记命中次数；不得用重试掩盖。
  - 不动 DHR_72 要改的三条语义用例（`:242`、`:279`、`:305`）的断言（对 `:242`/`:279` 只允许加 skip 标记）。
- **验收口径**：
  - **机器证 A（绿闸）**：五文件 `node --test --test-concurrency=1` 连续 **3 轮**，每轮记录 `pass / skip / fail` 计数、每个文件时长、总时长：**skip 恰为 2（隔离清单）、fail 为 0**，无一轮不收口；每轮总时长 ≤ 隔离单跑之和的 2 倍。三轮原始输出入 `workspace/DHR_71/evidence/`。**不得把这个结果写成「全绿」**，只能写「隔离 2 条 skip、其余全 pass」。
  - **机器证 B（等待有界）**：每个被改的等待都能列出「目标事件 + 上限 + 超限时的失败输出」；人为让目标事件不发生，用例必须在上限内 fail 而不是挂住（至少对 652s 那条做此负例）。
  - **机器证 C（652s）**：挂死已定位（附复现步骤）并修；若指向生产，登记 finding 并注明去向。
  - **机器证 D（路径）**：`git diff --name-only master...HEAD` 仅含 `relay-core/test/**` 与 `workspace/DHR_71/**`。
- **允许路径**（v2 按 X-03 冻结到用例级）：
  - `relay-core/test/herdr-adapter.test.mjs`：仅 `:354`（#10 恢复届 orphaned）、`:510`（DHR_68/C 启动即 blocked）**用例体内**的等待逻辑，以及对 `:242`、`:279` **加 skip 标记**；**不得动共享夹具 `runtimeFixture`（`:203-230`）与 `recoveryFixture`（`:335-352`）**——若 `:510` 的时序修复必须改夹具，只登记并移交 DHR_72，不在本卡改；不得动其余用例断言。
  - `relay-core/test/agent-node.test.mjs`：仅 `:198`（DHR_33 窄路径）、`:231`/`:265`（DHR_61 D1）的等待逻辑，及全文件级超时配置。
  - `relay-core/test/helpers/**` **但不含 `fake-herdr.mjs`**（fake 宿主归 DHR_72）；本卡只可新增/修改等待工具。
  - `docs/modules/dh-relay/workspace/DHR_71/**`。
- **档位 / 类型**：标准 · **light**（教训 + 一致性两路复核）。
- **依赖**：无（基线 master）。

### 3.2 DHR_72 · driver 持续观测（标准 · heavy）

- **目标**：`receiptBound` 时 driver **不因一次 `idle`/`done` 采样退出观测**；等 Result 与继续观测并行；`E_EXECUTOR_RESULT_MISSING` 成为「等超了」的可见提示而非 Attempt 终点；观测出口冻结为五个（见机器证 D）。让真实产品路径上的 `checkpoint_recorded`、`observation_lost`、`host_lost` 重新可得。
- **运行契约（v2 按 W-01 / X-01 明示，对应 D-B35-6）**：宿主长期 `idle`、无提交、无人 `stop`，是**允许人工长期持有的运行态**——节点停在 `waiting_human`/`needs_you`，一条可见的 `E_EXECUTOR_RESULT_MISSING` 是给人的信号，**人工 `stop` 是这种长驻的唯一业务出口**；driver 与 actor 续租随 service 存活。它不是「有界超时」，本事件不引入任何自动放弃/自动失败。
- **非目标**：不改 Receipt/Result/事件合同与 reason code 表；不改 Store 折叠规则（§2）；不改 lease 单写者与 gate（DHR_70 范围）；不改启动段与 adapter（`runtime/executors/herdr/**`）；不动 DHR_69 的 idle∧blocked 派生规则；不跑 Linux；**不替 DHR_35 出 P6-M1 证据**。
- **验收口径**：
  - **机器证 A（不退出）**：fake 宿主序列 `idle → idle → working → working → done`：driver 在首次 `idle` 后**继续轮询**，`working` 期间记下 ≥2 条 `checkpoint_recorded`，节点折叠状态为 `running`；对照现役基线该序列零 checkpoint。
  - **机器证 B（等超提示可被事实覆盖）**：宿主 `idle` 持续超过 `doneTimeoutMs` 且无提交 → 恰写**一次** `E_EXECUTOR_RESULT_MISSING`、节点 `waiting_human`；之后 (i) 宿主转 `working` → 记 checkpoint、节点折叠回 `running`，**不重复写**该 Attention（同一 Attempt 内该 reason 至多一次，除非中间经历过 `working`）；(ii) 迟到 Receipt-bound 提交 → `attempt_succeeded`，此后零观测事件（沿用现役「终态后不再追加」保护）；(iii) **CLI 投影实证**：`relay status --json` / `inspect --json` 在 (i) 之后 `run_status=running`、`group=running`，历史事件账仍含那条 `human_input_requested`（不主张清除）。
  - **机器证 C（对账重新可达）**：首次 `idle` 之后宿主消失 → 走 `reconcileHerdrAgent` 到 `host_lost`，写 `E_EXECUTOR_HOST_LOST` 并退出；现役基线此路径在首次 idle 后不可达。
  - **机器证 D（五出口，各一条用例，退出后零事件追加）**：① committed 提交；② `stop`（`E_EXECUTOR_KILLED` 语义按现役）；③ 对账 `host_lost`；④ Attempt 已终态；⑤ **actor 结束或失租** → driver **fail-closed 退出**、不再以旧 actor 写任何事件；用例须**分别**覆盖两种情形并断言差异：`actor-closed`（可由 DHR_70 的 gate 重建路径接住迟到提交）与真实 `E_LEASE_HELD:lease-lost`（`host.mjs` 写闸原样拒绝、无重建）；`service.mjs` 「只认 actor-closed 重建」条款不变。循环内每轮都检查出口（不得在 `waitForExecutorResult` 里阻塞整轮）。
  - **机器证 E（语义用例归位）**：解除 DHR_71 隔离的 `:242`、`:279` 并按 Receipt-bound 语义重写；`:305`「idle 超阈值单次 Attention 后停止轮询」按新语义重写为「单次 Attention 后**继续**轮询」。收口时定向套件 **0 skip、55/55**（含 DHR_69、DHR_70 用例）。
  - **机器证 F（真实产品实录 · 本卡自己的 verify 证据）**：DSH-off Windows、一个已冻结 Profile（Codex 优先，单条约 2.5 分钟），跑出**至少一条带真实 `checkpoint_recorded`** 的实录；证据按 design/12 §2 脱敏（`rcpt~<摘要>` 关联符，零原 Receipt ID、零凭据）。**该实录只证明本卡的 driver 改动在真实产品上生效，不计入 DHR_35 的 P6-M1**（见 §4）。
  - **机器证 G（守住 B-33，v2 新增）**：负例 `agent_get=idle ∧ pane_get=blocked`（DHR_69 派生 blocked）持续期间：零 `checkpoint_recorded`、节点不回 `running`、提交指令不补发；只有宿主**真实** `working` 才产生 checkpoint。
  - **有效单测**：变异点由第二轮复核实例选点（候选：把「首次 idle 不 return」改回 return / 把 Attention 去重判据改坏 / 把出口⑤去掉），指定用例必须变红。
- **允许路径**（v2 按 X-03 冻结到用例级）：
  - `relay-core/runtime/workflow-driver.mjs`（仅 `driveHerdrNode` 轮询循环 `:330-422` 的 `done`/`idle` 处理、等待与出口结构、Attention 去重；**不得**动 `:205-275` 启动段与 recovery 段的语义）
  - `relay-core/test/herdr-adapter.test.mjs`（仅 `:242`、`:279`、`:305` 三条，及共享夹具 `runtimeFixture` `:203-230` —— **该夹具唯一归属本卡**；解除 DHR_71 加的 skip；改夹具后 `:510` 等既有用例须保持绿）
  - `relay-core/test/dhr72-continuous-observation.test.mjs`（新建，承载机器证 A/B/C/D/G）
  - `relay-core/test/helpers/fake-herdr.mjs`（**唯一归属本卡**；仅当需要建模 `idle→working` 序列）
  - `relay-core/package.json`（只可向 test script 追加本卡测试文件名）
  - `docs/modules/dh-relay/workspace/DHR_72/**`（含从 `wt/DHR_35` 复制来的实录脚本副本，须登记来源 commit；不得反向修改 DHR_35 工作区）
  - `docs/modules/dh-relay/as-built/relay-core.md`、`docs/modules/dh-relay/dev_plan/P6-Herdr多账号执行底座-开发方案.md`
- **不得改**：`contracts/**`、`store/**`、`host.mjs`、`service.mjs`、`launcher.mjs`、`runtime/executors/herdr/**`、DHR_35 工作区、用户级配置。
- **实施提示**：真实实录若撞 F-3516 形态的启动停摆，**重试（≤3 次）并把失败现场原样留给 DHR_73**，不在本卡查。
- **档位 / 类型**：标准（组件接线 · 高危）· **heavy**。
- **依赖**：DHR_71（绿闸）。

### 3.3 DHR_73 · 启动链静默停摆调查（标准 · normal · 纯调查卡 · 定时间盒）

- **目标（v2 按 W-04 / X-04 改写）**：对 F-3516（`attempt_started` 后 service 活着却零子进程、pane 未建成）与 F-3519（Claude 全程零 `host_observation_changed`、租约未续期即过期）做**可复核的调查收口**：要么钉死根因，要么交付可复核的未决登记。**本卡不修生产代码**；修复另开卡。
- **出口（二选一，写死在验收里）**：
  - **(a) 根因钉死**：给出触发条件 + fake/探针负例可稳定复现 + 落点文件/函数；产出一份 B-adjust 候选立**修复卡**（预计 heavy，落点 `runtime/executors/herdr/**` 或 driver 启动段）。
  - **(b) 时间盒内未钉死**：交付复现率（≥ 8 次真实启动的统计）+ 停摆时的进程/pane/租约现场取证 + 一份「启动链有界看门狗」B-adjust 候选。
  - **两种出口下 F-3516 / F-3519 都保持 open**，直到修复卡收口；DHR_35 / P6-H 不得据本卡宣称「启动可靠性已恢复」。
- **时间盒**：真实启动 ≤ 12 次或两个工作时段，先到为准；超盒即走 (b)。
- **非目标**：不改任何 `relay-core/**`；不改 lease 合同；不改 Herdr 产品；不跑 Linux。
- **允许路径**：`docs/modules/dh-relay/workspace/DHR_73/**`（含探针脚本，须带 `HERDR_ENV=1` fail-closed 闸与 DSH-off 预检，沿用 DHR_35 F-3523 教训）。
- **档位 / 类型**：标准 · **normal**（启动时冻结，不中途升档）。
- **依赖**：DHR_72（持续观测落地后停摆更容易被看见）。**DHR_35 重开不等本卡。**

## 4. DHR_35 的重开合同（计划回填，不是新卡）

- 依赖改为 `blocked-by:DHR_72`（经 DHR_71 链式）。DHR_73 不阻塞。
- **证据归属**：DHR_35 的 P6-M1 证据由 DHR_35 **自己在新基线重跑两条完整实录**取得——与本仓既有做法一致（F-3502/F-3503/F-3505「不能将前置完成冒充实录」；DHR_70 落地后 DHR_35 已把旧证据归档到 `archive-20260901-pre-DHR70/` 并重跑）。DHR_72 的机器证 F 不可被引用为 P6-M1。
- **启动停摆的处理**：重开实录若撞 F-3516 形态，按 DHR_72 同样规则重试并留现场给 DHR_73；两条实录各自 `succeeded` 且带真实 checkpoint 即达成 P6-M1，**但 review 须如实登记本轮启动成功率**，不得把 F-3516/F-3519 写成已消除。
- **P6-X 补录挂本卡重开**：两条 DSH-off 实录跑完后，另起一步启动 DSH 附着其中一条 Run，核对无第二份状态判断；runner 需加「保留 Run」开关（DHR_35 允许路径内）；DSH 必须放最后一步开（已知 DSH 会自动复活 service）。Pi 控制面本机不具备，记「环境不具备」。
- **P6-H 人判**在重开后用新基线数据做。现有数字**不可用作判断**：Codex 150s 含 driver 空等 60s（本候选要修），Claude 393s 含 3m14s 停摆（DHR_73 要查）。

## 5. 历史证据登记（backlog 新条目，不动 master 历史）

新增 `DHR-BL-18`：master 上 DHR_30/DHR_31 三个证据文件共 23 处原 Receipt UUID。**只登记不重写**——规则晚于证据、ID 无可利用性（对应 Run 已销毁，且当时无 Receipt-bound 提交入口）、master 本地领先 origin 106 笔，重写代价与收益完全不对等。附带建议：为 `docs/**` 加裸 Receipt UUID 形态的 pre-commit 扫描，另立 backlog 条目，不并入本事件任何卡。

## 6. 决定点

| ID | 问题 | 主控推荐 | 状态 |
|---|---|---|---|
| D-B35-1 | 卡序 | **DHR_71 → DHR_72 → DHR_73**；DHR_35 重开在 DHR_72 后、不等 DHR_73 | 用户 2026-09-02「按你的建议走」已裁 |
| D-B35-2 | DHR_72 实录是否可被 DHR_35 消费 | **否**：DHR_35 自跑两条 | 同上已裁 |
| D-B35-3 | F-3516/F-3519 是否并入 DHR_72 | **拆为 DHR_73**（纯调查、定时间盒、双出口，修复另开卡） | 同上已裁；v2 按审核把「修复」从 DHR_73 拿出 |
| D-B35-4 | DHR_30/31 历史证据 | **只登记（BL-18）** | 同上已裁 |
| D-B35-5 | P6-X 补录挂哪 | **DHR_35 重开** | 同上已裁 |
| D-B35-6 | 宿主长期 `idle`、无提交、无人 stop 时系统应怎样 | **不设墙钟上限、不自动放弃**：这是允许人工长期持有的运行态，节点停在 `waiting_human` 并带一条可见 Attention，**人工 `stop` 是唯一业务出口**；driver 的机器出口冻结为五个（含 actor 失租/结束 fail-closed）。v1 曾写成「有界出口」，第一轮审核指出那是说过头，v2 改为如实登记 | **待用户确认**（两名审核者均建议按此改写后再确认） |
| D-B35-7 | `E_EXECUTOR_RESULT_MISSING` 后宿主再报 `working`、节点按既有折叠回 `running`，是否与 B-33「不自动收敛」冲突 | **不冲突，但限定**：仅指宿主**真实** `working` + 实际 `checkpoint_recorded` 使折叠状态回 `running`；不包含清除历史 Attention，不包含把 idle∧blocked 推断为 working（机器证 G 负例守住） | **待用户确认**（两名审核者均判「限定后成立」） |

## 7. 查漏（覆盖 / 颗粒度 / 依赖）

- **覆盖**：P6-RI-A4 的 checkpoint 一环由 DHR_72 让实现可达、由 DHR_35 出证；design/06 H1 的真实四态证据在 DHR_72 后可由 DHR_35 重开补真实 `unknown`；H3（P6-X）由 DHR_35 重开承接；F-3516/F-3519 由 DHR_73 调查、修复卡待 DHR_73 出口后立；F-3520 由 DHR_71（时序）+ DHR_72（语义）分担；F-3518（`host_ref` 未冻结）仍摆给 P6 阶段闸，本事件不动。
- **颗粒度**：DHR_71 = 测试绿闸一个单元；DHR_72 = 轮询段语义一个单元；DHR_73 = 启动段调查一个单元（不含修复）。三者按代码段切且**允许路径互斥**（v3 按第二轮 X-03 复核收紧）：`herdr-adapter.test.mjs` 两卡按用例行冻结、串行施工，共享夹具 `runtimeFixture`/`recoveryFixture` 与 `helpers/fake-herdr.mjs` **唯一归属 DHR_72**；`workflow-driver.mjs` 只有 DHR_72 可改；DHR_73 不碰 `relay-core/**`。
- **依赖**：`DHR_71 → DHR_72 → DHR_73`，`DHR_72 → DHR_35`；无环。三卡均须独立 D-start。
- **不变项**：`design/12` P6-RI-A1~A5、Receipt/Result/事件合同与 reason code 表、Store 折叠规则、lease 单写者与 DHR_70 gate 重建条款、B-22① Linux 延后、B-33 观测层派生规则、P6-M1~M7。

## 8. 第一轮审核账（2026-09-02）

| 复审者 | 形态 | 结论 | 议题 → 裁决 |
|---|---|---|---|
| `b35rev1` | codex `gpt-5.6-terra` · high · `sandbox=read-only` · `approval=never` · cwd=仓根 · fresh · 基线 `43e4af9` | 不通过（4×P1） | W-01 无墙钟上限未证有界 → **采纳**，改为如实登记的运行契约 + 出口⑤；W-02 §2 把折叠回 running 说成看板覆盖 → **采纳**，收窄并加 CLI 投影实证；W-03 DHR_71 绿闸未冻结等待上限 → **采纳**，机器证 A/B 改写；W-04 DHR_73 目标与双出口不一致 → **采纳**，改纯调查卡、findings 保持 open |
| `b35rev2` | 同上，同批拉起、互不可见 | 不通过（4×P1 + 1×P2） | X-01 缺 actor 失租/结束出口 → **采纳**（并入出口⑤）；X-02 skip ≠ 全绿 → **采纳**，固定 skip=2 且 DHR_72 收口 0 skip；X-03 允许路径不互斥 → **采纳**，冻结到用例行，`workflow-driver.mjs` 只归 DHR_72；X-04 DHR_73 中途升档违反类型冻结 → **采纳**，normal 纯调查、修复另开卡；X-05 读模型显示未验证 → **采纳**（机器证 B (iii)）；理解风险「idle∧blocked 反例应有专门断言」→ **采纳**（机器证 G） |

- 零写入取证：派出前后 `HEAD=43e4af9`、`git status --porcelain` 仅为本草案与 brief 两个未跟踪文件。
- 两名对 D-B35-7 均判「限定后不冲突」、对 D-B35-6 均要求先改写再确认；均未新增决定点。

## 9. 第二轮定向复审账（2026-09-02）

| 复审者 | 形态 | 结论 | 议题 → 裁决 |
|---|---|---|---|
| `b35ver1` | codex `gpt-5.6-terra` · high · `sandbox=read-only` · `approval=never` · fresh（第三个实例）· 基线 `43e4af9` | 不通过（1×P1） | 9 条逐核：8 条到位；**X-03 未到位**——DHR_71 的 `test/helpers/**` 与 DHR_72 的 `fake-herdr.mjs` 重叠，且 `:510` 与 `:242/:279/:305` 共用 `runtimeFixture`（`:203-230`）→ **采纳**：helpers 排除 `fake-herdr.mjs`、共享夹具唯一归属 DHR_72、DHR_71 只改用例体。独立核对三处均成立：出口⑤与 `host.mjs:62-64` / `service.mjs:448-476` 兼容（但测试须区分 `actor-closed` 与 `lease-lost`，已写进出口⑤）；§2 读模型陈述属实（`store.mjs:648-651,1035-1074`、`state.mjs:8-14,55-62`、`discovery.mjs:175-180,193-216`）。D-B35-6 / D-B35-7 v2 措辞**可交用户确认** |

- 零写入取证：派出前后 `HEAD=43e4af9`、`git status --porcelain` 仅为本草案与两份 brief。

## 10. 第三轮定向复核账（2026-09-02）

| 复审者 | 形态 | 结论 |
|---|---|---|
| `b35ver2` | codex `gpt-5.6-terra` · high · `sandbox=read-only` · `approval=never` · fresh（第四个实例）· 基线 `43e4af9` | **PASS**，无新增 P0/P1。核实 v3 两卡路径互斥：`:510` 的等待在用例体 `:521/:533`，DHR_71 不动夹具即可改；`agent-node.test.mjs` 的 `:198/:231/:265` 等待用本文件 `untilAsync`，只依赖 `fake-herdr` 既有接口，不需改共享 helper |

- 零写入取证：派出前后 `HEAD=43e4af9`、`git status --porcelain` 仅为本草案与三份 brief。

