<!-- dh:v1 -->
# review-req-opus — DHR_61 需求方向复核（fresh，只读）

## 0. 抬头与模型证据

| 项 | 值 |
|---|---|
| 卡 | DHR_61 · Attempt 身份与暂停重试契约 |
| 复核路径 | heavy 配方 · **需求方向**（fresh reviewer，非施工者、非主控、非代码轮 1/2） |
| 审查对象 | 工作树 `D:/MyFiles/ai-workflow/dh-relay/.dh-worktrees/DHR_61` 的**未提交 diff**，基线 `5999326`（32 改 + 26 新，1176 增 / 86 删） |
| 模式 | 只读。未改任何代码或既有工件、未派活、未提交、未询问用户；本文件是本轮唯一写入 |
| 日期 | 2026-08-30 |

**模型证据（如实记录，含不一致项）**

1. 启动命令：`claude --model opus`（由主控在派活指令中声明）。
2. 状态栏显示：`Opus 5`（由主控在派活指令中声明）。
3. 本 session 自身可见的两条证据互相冲突：系统上下文写明 `You are powered by the model named Opus 5. The exact model ID is claude-opus-5`；而 **SessionStart hook 注入的文本为 `当前模型：claude-fable-5[1m]`**。
4. 结论：第 1、2 项按派活指令如实登记；第 3 项的**内部不一致我无法在 session 内自证**，交主控裁决，本轮不代判。此项与代码轮 1（`review-code1-opus.md` §0）记录的现象一致，说明它不是单次偶发。

## 1. 本轮的职责边界与方法

- **只做需求方向**：逐条对照 brief 完成条件、design/11 的 D1/D2/D3 冻结决策、P6-IQ 验收命题与 DevPlan 的卡面范围，判断"要的东西是否真的被做出来了、有没有做多、有没有做歪"。**不做代码质量裁决**，也不重复代码轮 1 已闭合的条目（`review-code1-opus.md` §7.2 的 P0-1、P1-1~P1-5、P2-1/2/3/5/6、P3-2/3/5 我逐条抽查后确认结论成立，不再复述）。
- 读取：仓根 `AGENTS.md`；`workspace/DHR_61/{brief,task_plan,progress,findings,review,execution_strategy}.md`；`review-code1-opus.md` 全文；`design/11-P6身份与额度治理契约调整.md`；`dev_plan/P6-Herdr多账号执行底座-开发方案.md`（DHR_61 / DHR_34 卡面、§覆盖·颗粒度·依赖）；全部 9 份新增 schema、`store/store.mjs`、`store/state.mjs`、`runtime/{service,workflow-driver,attempt-retry,endpoint}.mjs`、`rpc/bootstrap.mjs`、`profiles/{identity,migrate-profile-registry,validate-profiles,executor-profile.schema}.*`、`test/*` 的全部新增与改动用例、`fixtures/manifest.json`、as-built `relay-core.md` 与 `contracts/OPEN-POINTS.md`。
- 只读取证手段：`git diff` / `git show` 比对冻结面；一支**只读探针**驱动生产模块（`createStore` / `registerAttemptReceipt` / `appendFallbackPause` / `appendFallbackPauseResolution`），全部落系统临时目录，未写入仓库、**未读取用户级 registry 或任何 profile 配置文件**。

### 验收命题归属先对齐（派活指令与 DevPlan 有出入）

派活指令写的是"P6-IQ-A1/A2/A3"，而权威口径是 **DevPlan `P6-Herdr多账号执行底座-开发方案.md:233`：「design/11 P6-IQ-A1/A3/A5 由 DHR_61 承接，A2/A4 由 DHR_34 承接」**，与 brief 完成条件三条（A1/A3/A5）一致。本轮按 DevPlan 口径展开，同时**把 A2/A4 当边界项查**（本卡有没有做多、有没有给 DHR_34 留下无法落地的坑）——结论见 P2-1、P2-2 与 §3 的 clean 项。

| ID | 归属 | 本轮结论 |
|---|---|---|
| P6-IQ-A1 | DHR_61 | 主干成立；两处需求级缺口（P1-2 破坏性变更、P2-6 凭据扫描无可复跑闸） |
| P6-IQ-A3 | DHR_61 | 主干成立；三处缺口（P1-1 派生不变量无强制、P2-2 validator 未交付、P2-4 列表爆炸半径） |
| P6-IQ-A5 | DHR_61 | 主干成立；两处缺口（P1-1 同源、P2-5 registry 不同源） |
| P6-IQ-A2 | DHR_34 | 本卡**未越界实现**（全仓无 quota / 自动选择代码）；但 A2 需要的"开 fresh Attempt"原语没有对外出口 → P2-1 |
| P6-IQ-A4 | DHR_34 | 既有 herdr-adapter / agent-node 回归仍在且断言未被削弱（只补了 fixture 侧的 `config_fingerprint_rule`）；clean |

---

## 2. 结论清单（P0 → P3）

### P0

**0 项。**

---

### P1-1 · `manual_retry_profiles` 不被强制"派生自 Receipt 冻结快照"，本卡最核心的不变量没有强制点

- 位置：`relay-core/store/store.mjs:402-417`（`assertPauseSemantics` 只校验派生 ID、时间戳三点对齐与嵌套 ID 交叉一致）、`relay-core/store/store.mjs:465-468`（`appendFallbackPause` 只比对 `currentReceipt` 的 `receipt_id`/`attempt_id`，**不看 `fallback_profile_snapshots`**）、`relay-core/store/store.mjs:419-433`（`assertResolutionSemantics` 只要求选中项在 `pause.manual_retry_profiles` 里）、`relay-core/contracts/relay.fallback-pause.v1.schema.json:17`（schema 只限 `maxItems:6` 与元素形状）。
- 设计逐字要求：
  - D1：「自动 fallback 和 pause 的人工可选列表**只能从这份 Receipt 快照派生**，重启或 registry 变更**不得重新计算或扩大它**。Attempt Receipt 的 schema 校验、Store 持久化/重放和 checkpoint/result 的当前身份校验**必须消费同一份快照**。」
  - D2：「`manual_retry_profiles` 从 Receipt 的 `fallback_profile_snapshots` **按原序筛选得到**。」
  - D3：「事后 registry 变更**不扩大**原 pause 的选择集。」
- **只读探针实测（RQ-001）**：对一个 `fallback_profile_snapshots: []`（开立时冻结为**零 fallback**）的 Attempt Receipt——

  ```
  registerAttemptReceipt(snapshots=[])                → {"ok":true}
  appendFallbackPause(manual_retry_profiles=[未冻结项]) → {"ok":true,"idempotent":false}
  appendFallbackPauseResolution(选中该未冻结项)         → ok:true
  node status = running | current_attempt = attempt-2 | openAttentions = 0
  ```

  即：**Store 全程接受一个与 Receipt 快照毫无关系的人工可选集，并据此开出 fresh Attempt。**
- 为什么这是需求方向的 P1 而不是代码风格问题：本卡存在的唯一理由（DevPlan `:125-126`、design §4.2）就是"把 contracts/Store/RPC 的协议责任从 DHR_34 拿走，让 DHR_34 只消费"。DHR_34 被明令**禁改 `contracts/**`、签发服务、Store 与 RPC**，所以 pause 载荷必然由 DHR_34 在 D3 里自己拼装——而它拼错、拼宽、或按"当时的 registry"重算一遍，本卡的持久层**一个字都不会拦**。这正是 design §5 止损条款「不能只记录 fence/Attention 文本：缺少所列协议字段、幂等键、重放或拒收规则时一律未满足」要防的形态。
- 现有测试为何全绿：`test/attempt-contract.test.mjs:31` 的 `attemptReceipt()` 固定带 `fallback_profile_snapshots:[identity]`，`:203`/`:251` 传的 `manual_retry_profiles:[identity]` 恰好与之相同；`:221` 的反例是**缩小**（`manual_retry_profiles:[]` → `profile-not-frozen`）。**"扩大"方向零用例。**
- 附带：`runtime/attempt-retry.mjs:30-35` 的"当前 registry 全等"复核比的是**当前** registry，因此一个在 Attempt 开立**之后**才加进 registry 的 profile，既能进 `manual_retry_profiles`、也能通过全等复核——两道闸都不构成对 D3「事后 registry 变更不扩大选择集」的防守。
- 建议方向（不代改）：在 `appendFallbackPause` 内加一条 `manual_retry_profiles` ⊆ `currentReceipt.fallback_profile_snapshots` 且**保持原序**的判定，失败即 `E_FALLBACK_PAUSE_INVALID`；并补"扩大"与"乱序"两条反例。

### P1-2 · 让缺 `config_fingerprint_rule` 的既有 Herdr profile 从"能开 Attempt"变成"整届 driver 停摆"，是超出本卡边界的破坏性变更

- 位置：`relay-core/runtime/workflow-driver.mjs:98`（`throw E_NONSECRET_PROJECTION_MISSING:source-<id>`）、`relay-core/profiles/executor-profile.schema.json:58`（`required` **不含** `config_fingerprint_rule`）、`relay-core/profiles/migrate-profile-registry.mjs`（`migrateProfileRegistry` 只把**已有**规则的 `fields` 字符串数组升级为 `{pointer, classification}`，**不会给缺规则的 profile 补规则**）。
- 事实链：
  1. 整改批（代码轮 1 的 P2-6 闭合）把 source profile 缺规则从"静默退回无身份 Receipt"改成**抛错**。方向本身对——D1 要求开立即冻结身份。
  2. 但 registry schema 仍**不 required** 该字段，于是一份缺规则的 registry 照样通过 `validate-profiles`。
  3. 该抛错位于 `driveHerdrNode` 的 `try` 之前（代码轮 1 的 N-2 已定位机制），沿 `driveNode → drive()` 冒泡，被 `done` 收成 `{ok:false}`——**整届 driver 停摆，同批其余 pending 节点全部不再推进**；而相邻两条同类前置失败（`workflow-driver.mjs:132` registry 不可用、`:134` profile ref 无条目）只是 `return`、跳过该节点。
  4. 本 diff 必须给 `test/agent-node.test.mjs:205` 与 `test/herdr-adapter.test.mjs:144` 的既有 DHR_33 fixture **补上 `config_fingerprint_rule` 才能继续通过**——这本身就是"既有形态被打破"的机器证据。
- 需求判定：DHR_33 的 Herdr 派活能力**已合入 master**。brief 的完成条件、边界与 design/11 都**没有**授权本卡改变"既有 registry 的 Herdr 节点能不能跑"；design D1 说的"拒绝签发"针对的是**规则内容不合法**（Pointer 缺失 / 未标 nonsecret / 命中敏感字段），不是"没配规则"。现在的效果是：任何一份 DHR_32/33 时期留下的、没写 `config_fingerprint_rule` 的 profile，一旦被工作流引用，**整届 driver 停摆**，且既没有 schema 层预警、也没有迁移脚本兜底。
- 建议方向（不代改，三选一由主控裁）：① registry schema 把 `config_fingerprint_rule` 提为 `required` 并给迁移脚本补一条显式失败/提示，让失败前移到注册期（与 P1-1/P1-2 整改批已确立的"注册期证明"口径同源）；② 抛错点降级为与 `:132/:134` 同族的 `return`（只跳过该节点、Run 保持 pending）；③ 明文在 brief 边界与 as-built 里登记这是有意的破坏性变更并给出迁移说明。
- 说明：代码轮 1 记录了机制（P2-6 闭合说明的"残留"与 N-3/N-2），但**没有把它当成对既有能力的兼容性破坏来判**；本轮从需求边界角度定级 P1。

### P1-3 · 收口工件与"需求境证据"链断：三条完成条件与三条需求对齐项全部挂在一条无关证据上

- 位置：`docs/modules/dh-relay/workspace/DHR_61/review.md:44-56`、`docs/modules/dh-relay/workspace/DHR_61/progress.md:14`（日志末行）、`docs/modules/dh-relay/workspace/DHR_61/findings.md:11-12`。
- 事实：
  - `review.md` 的「需求对齐证据」三行（P6-IQ-A1 / A3 / A5）与「完成条件逐条挂证据」三行，**证据列全部写 `E-001`**。而 `E-001` 是 `progress.md:20` 的 `git log -1 --oneline bbf78f9` + 读 DevPlan 卡面，类型 `inspect`、结论 `observed`，内容是"B-23 已入主树、尚未施工"——**与三条验收命题没有任何证明关系**。三行结论仍是"待人验 / 待验证"，「验收项元数据表」的覆盖态仍是"无法取证"。
  - `progress.md` 的日志停在"resolution 的 Store 语义已完成；仍须冻结并接通独立 bootstrap/RPC v2 endpoint 与 retry 的当前 Registry 等值复核"。**bootstrap、RPC v2 端点、v2 read model、v1 强制关闭、retry 接线、以及整个整改批（journal marker、注册期容量证明、双向账本、迁移排序、终态守卫、目录 fsync、fallback 快照回填……）在证据账本里零记录**，也没有全量回归的终态条目。
  - `findings.md` F-003（P1，open）仍描述这些为"未完成"，F-002（P2，open）仍写"全量回归未得终态"——而代码轮 1 已取得 `npm test` 有汇总的终态（其 R-003 为 228/228、V-020 为 233/232+1 抖动，主控口径 233/233）。
- 需求判定：按仓根 `AGENTS.md` 宪章 #3【需求境闸】，标准档进"待验收"前必须有「需求/人验项 + 场景操作路径 + **证据 ID** + 结论」。本卡的人判项为空（design/11 §3 明写"人类验收栏为空"），因此**机器证据 ID 就是唯一的需求境证据**——目前这条链是断的：完成条件既没有对应的可复跑命令，也没有对应的证据编号。同时按宪章 #2【出口闸】，本卡触及"组件接线 / 数据口径"，没有 `verify(dh-relay):` 提交前只能"待验收"。
- 说明：代码轮 1 以 N-5 登记了同一现象但定为"收口工件维护、不是代码缺陷"。从需求方向看它**是本卡能否进入下一档位的硬闸**，故定 P1。本轮同样不代改这三份工件。

---

### P2-1 · A2（自动 fallback 开 fresh Attempt）没有对外原语，DHR_34 一开工就会撞边界

- 位置：`relay-core/runtime/workflow-driver.mjs:92-120`（`openAttempt` 是 `startWorkflowDriver` 内的闭包，**未导出**，也没有"按选定 fallback 开 Attempt"的变体）、`relay-core/runtime/attempt-retry.mjs:15`（唯一导出的 fresh-Attempt 入口，但**以 pause 为前置**：`readFallbackPause` 取不到就 `pause-not-found`）。
- 需求链：DevPlan `:126` 规定 DHR_34「仅 D3，**禁止 `contracts/**`、签发服务、Store 与 RPC**」；design §4.2 同口径。而 P6-IQ-A2 要求"高置信 quota + 合格 fallback **产生新的 Receipt 与 Attempt**"。当前仓里能开出带冻结身份的 fresh Attempt 的路径只有两条：driver 内部的 `openAttempt`（不可达、且属于 DevPlan 明列的"Runtime Receipt 签发接点"= DHR_61 范围），与 `retryWithFrozenProfile`（必须先有 pause，语义是人工重试，A2 的场景里根本没有 pause）。
- 后果：DHR_34 要实现 A2，只能去改 `workflow-driver.mjs`（越过它自己的禁令），或在 D3 里另起一套身份冻结逻辑（正是本卡要消灭的重复真相）。
- 本轮不判定"必须现在补"——这可能是有意留给 B-adjust 的排期问题。但**必须在本卡收口前由主控明文裁定归属**，否则 DHR_34 解除 blocked 的第一动作就是撞墙。
- 附：A2 的另一半"旧 Attempt 的迟到写入被**隔离**"不需要新原语——既有 `E_IDENTITY_MISMATCH` → `late_result_quarantined` 路径可用（`contracts/reason-codes.md` 该行未变）；注意它与本卡新增的 `E_ATTEMPT_FENCED`（拒收、不隔离）是**两种语义**，DHR_34 别用混。

### P2-2 · D2 逐字要求的"解析 detail 后校验"的语义 validator 没有作为可复用契约闸交付

- 位置：`relay-core/tools/validate.mjs`（`grep fallback_pause` **零命中**）、`relay-core/fixtures/manifest.json`（只有独立的 `golden/fallback-pause.v1.json` 与一条负例，**没有任何一条 `relay.event/v2` 载着 canonical pause detail 的 event 级 fixture**）、语义校验只存在于 `relay-core/store/store.mjs:52-95` 的私有 `assertPauseLedger` / `assertResolutionLedger`。
- 设计逐字：D2「前置卡**同时提供** payload schema **与"解析 detail 后校验"的语义 validator**，禁止把对象塞进现有 string 字段或用自由文本替代。」
- 后果：用已发布的 `relay-validate` / `relay.event/v2` 去校验一条 `fallback_pause_created`，只会检查 `detail` 是个 ≤4096 的字符串——**自由文本照过**。Store 侧的写入与重放确实是把守住的（所以账本真相无风险），缺的是"契约消费者（DHR_34、v2 客户端、跨实现）能调用的那一份"。
- 定级理由：不影响本仓数据完整性，但它是 D2 明列的**交付物**，且本卡的定位就是"冻结给别人用的合同"。

### P2-3 · v2 读模型给了 Attention 却没给 `manual_retry_profiles`，D2§5 的人工选择清单在冻结的 v2 方法集里没有直接来源

- 位置：`relay-core/contracts/relay.client-read-model.v2.schema.json:18` 与 `:38`（`open_attentions` 的元素 `$ref` 到 `relay.fallback-pause/v1#/$defs/attention`）、`relay-core/runtime/service.mjs:694-746`（v2 方法集只有 `contracts / listRuns / inspectRun / subscribe / retry-with-profile`，**没有读 pause 的方法**）。
- 事实：`attention` 的字段是 `{attention_id, run_id, node_id, attempt_id, receipt_id, reason_code, state, raised_at}`。
  - `pause_id` **可以**由客户端按 `sha256("fallback-pause/v1\n"+run_id+…+reason_code)` 从这五个字段复算（本轮核对成立），所以 `retry-with-profile` 的入参能凑齐。
  - `manual_retry_profiles` **不可**从 attention 派生。唯一来源是 `fallback_pause_created` 事件的 `detail`，只能靠 v2 `subscribe` 带 `after_seq` 补发到那条事件再自行解析——一条**未写进任何契约、也没有 golden 背书**的隐式路径（且 `after_seq` 的过滤是 `seq > afterSeq`，`seq=0` 的事件取不到）。
- 需求判定：D2§5 明写「UI 只展示 pause 中**已冻结 profile 的脱敏 `account_alias`** 供选择」。本卡冻结的 v2 读模型没有承载这份列表，DHR_35 的 UI 要么改 v2 契约（届时 v2 已冻结、capability hash 已发布），要么走隐式事件解析。建议本卡收口前二选一：把 pause 摘要（`pause_id` + `manual_retry_profiles`）并入 `open_attentions` 元素，或在 `contracts/OPEN-POINTS.md` / backlog 明文登记该缺口与承接卡。

### P2-4 · `listRuns` 现在为每个 Run 全量加载事件账并双向核对；任一 Run 的未恢复 mutation 会让**整张列表**（v1 与 v2 同时）抛错

- 位置：`relay-core/runtime/service.mjs:667`（v1 `listRuns` 对每一项 `await assertV1AttentionCompatible(item.run_id)`）、`:704-707`（v2 `listRuns` 对每一项 `attentionsFor`）、`:324-345`（无 actor 时都落到 `readOpenAttentions`）、`relay-core/store/store.mjs:842-881`（`readOpenAttentions` 每次都做：扫 `mutations/` → 未见 `.committed` 即 `throw E_STORE_MUTATION_RECOVERY_FAILED:recovery-required` → `loadEvents` 全量逐行校验 → 加载 receipts/pauses/resolutions → `assertPauseLedger` + `assertResolutionLedger` 双向全扫）。
- 设计口径：D2「在 mutation 恢复完成前**该 Run** 一律拒绝读写/订阅」——粒度是**单个 Run**。现在的实现让一个坏 Run 把 `listRuns` 整体打成错误响应，其余健康 Run 一个都列不出来。这与 §D2-4「绝不筛掉项目」想保护的目标（客户端要能看见全貌）是同一利益的反面：不是静默丢，而是全盘不可见。
- 附带（与代码轮 1 的 N-3 同源但结论不同）：v1 的 `listRuns` 在本卡之前**不打开任何事件日志**；现在每次列表都是 O(Run 数 × 事件数) 的全量解析 + 逐行 schema 校验。design §D2-4 冻结 v1 的口径是"行为与字节形态保持不变"，字节形态确实没变，但**行为成本**变了一个量级，且这条路径对**没有任何 pause 的老 Run**同样收费。
- 建议方向：把单 Run 的恢复失败降级为该项的局部错误标记（或让 v1 只在命中 Attention 索引时才深读），并给"列表里混一个坏 Run"补一条定向用例。

### P2-5 · Attempt 开立与 retry 复核读的不是同一个 registry 来源

- 位置：`relay-core/runtime/service.mjs:143-144`（本卡**新增** `executorProfileRegistryPath` / `profileEnvironment` 两个 service 选项）、`:740`（只有 `retry-with-profile` 用它们）、`:284`（`driveRun` 调 `startWorkflowDriver({ repoRoot, runId, actor, retryFailed, clock })`——**两个选项都没透传**）；driver 侧因此落回 `runtime/executors/herdr/profile-registry.mjs:10` 的 `defaultRegistryPath()` = `~/.dh-relay/executor-profiles.json` 与 `process.env`。
- 后果：
  1. 只要部署/测试把 `executorProfileRegistryPath` 指到默认路径以外，**冻结身份的 registry** 与 **retry 复核"仍全等"的 registry** 就是两份文件。A5 的核心命题「当前 registry 的该 profile 仍与冻结快照全等」在这种配置下比较的是两个无关来源，既可能假阴（永远 mismatch）也可能假阳。
  2. 正因为如此，"driver 冻结身份 → pause → retry 复核"这条端到端链**没有同源测试**：`test/rpc-service.test.mjs:642` 的 pause 与冻结身份是手工构造的，`test/agent-node.test.mjs` 的 driver 路径又不经 retry。A5 的定向证据实际覆盖的是两段各自的半条链。
- 默认配置（两侧都走 `defaultRegistryPath()`）下不出错，故定 P2；但这是本卡新引入的接线不一致，且直接落在 A5 的判据上。

### P2-6 · A1 的自动证据"凭据模式扫描"没有落成可复跑闸，证据账本里也没有它

- 位置：`relay-core/package.json:11-15`（`scripts` 只有 `test` / `audit` / `validate`）、`relay-core/tools/audit-contracts.mjs`（本卡只加了两条 `CONDITIONALLY_NARROWED` 白名单，无凭据扫描）、`progress.md:19-31`（证据账本 12 条里**没有**一条是凭据模式扫描）。
- 设计逐字：P6-IQ-A1 的自动证据是「schema/`openAttempt`/Store 定向测试 **+ 凭据模式扫描**」；task_plan 步骤 5 也写了"凭据模式扫描"。
- 现状：运行期确实有两道守卫（`profiles/identity.mjs:26-33` 的 `assertSafeProjection`、`validate-profiles.mjs` 的 `E_CREDENTIAL_FIELD`/`E_CREDENTIAL_VALUE`），但它们守的是**投影值**，不等于 A1 要的"Receipt、事件、日志与**测试样本**零敏感值"这一面。目前该面只有代码轮 1 手工 grep 的一次性结论（其 §3-19），**收口后无法复跑、也没有证据 ID**。
- 建议：加一条 `npm run scan-credentials`（或并进 `audit`）覆盖 `contracts/ fixtures/ test/` 的凭据形态，并在 progress 证据账本落一条终态。

### P2-7 · 完成条件 2 的"journal 强杀阶段**均**"与"截断"仍未逐项取证

- 位置：`relay-core/test/attempt-contract.test.mjs:128`（唯一的强杀切点：prepared pause mutation 在开 Store 时补全）、`:145`（缺 mutation 的残缺 pause）、`:157`（篡改 journal 路径）、`:172`（已 committed 的 journal 不重放）。
- 设计逐字：P6-IQ-A3 要「**任一 journal 阶段**强杀均只在恢复补全后才开放该 Run」，自动证据点名「截断、重复、冲突、**各 journal 阶段**强杀恢复、订阅后出现 Attention 的反例」；brief 完成条件 2 同口径（"重复、冲突、损坏、**截断**及 journal 强杀阶段均 fail-closed"）。
- 缺口：`relay.store-mutation/v1` 的四个阶段（blob 已写未发布 / prepared journal 已写未写目标 / 目标部分写 / 目标全写未落 marker）× 两种 mutation（pause、resolution）= 8 个切点，目前只覆盖到其中 1 个，**resolution 侧一个都没有**；"截断"方向没有 pause/resolution 专属反例（现有只有通用事件日志损坏用例与 detail 篡改用例）。
- 说明：代码轮 1 在其 §5 第 6 条提出过同一缺口，整改批**未纳入**（§7.2 表中无此行）。本轮从"完成条件逐字"角度重新登记：这条不补，完成条件 2 就只能算部分达成。

### P2-8 · brief 边界表与实际发生的用户级操作不同步

- 位置：`brief.md:29`（Out of scope 明列「**用户级账号配置**、凭据读写、自动登录」）、`brief.md:30`（"何时必须停下问人"）对比 `progress.md:10`（E-004/E-005：迁移 `C:/Users/nash/.dh-relay/executor-profiles.json` 的 `fields` 结构并生成备份）与 `progress.md:12`（E-009：设置**用户级环境变量** `CODEX_NINTH_HOME`，并为 `herdr.codex.ninth` 登记五个 JSON Pointer）。
- 事实与判定：两次操作 progress 都记了"用户明文授权"，流程上走对了闸（宪章 #1/#4 的确认要求）。问题在**工件没同步**：`brief.md` 的边界表与 `execution_strategy.md` 的子 agent 授权表至今没有登记这两笔例外，收口时从工件读不出"哪些用户级动作被授权、授权到什么范围"。同时这两笔改的是**仓外状态**，squash 合并后不可追溯、不可回滚（只有一份 `.bak-dhr61-*` 留在用户机器上）。
- 建议：在 brief 边界表加一行"已授权例外（含日期、授权原话出处、影响文件与备份路径）"，或在 findings 里开一条 P3 记录，让收口时可核查。**本轮不代改 brief。**
- 另：`profiles/migrate-profile-registry.mjs` 作为**入仓的生产脚本**落在 `relay-core/profiles/**`（in scope），这一点没问题；有问题的只是它被实际执行到用户机器上这件事没有在边界表留痕。

---

### P3-1 · as-built §3.12 的 capability hash 已陈旧

`docs/modules/dh-relay/as-built/relay-core.md`（本卡新增段落）写「新增合同只进入 bootstrap/v2 的 `f1ded3…b79f2`」，而 `relay-core/capability-baseline.json:100` 现为 `fb55f2f85d1db38ca12ed1a729c042e7cb8d80092643eb37532805f644c1d073`。同段的 v1 指纹 `994d5f…c971e` 仍正确。与代码轮 1 的 N-1 同项，本轮确认仍未修，且它落在 as-built（宪章要求收口时更新的工件）里。

### P3-2 · v2 端点不提供 `start` / `control` / `validate`，"新客户端的正式通道"口径需要登记

`relay-core/runtime/service.mjs:694-746` 的 `v2Handlers` 只有五个只读/重试方法。design §D2-4 说的是新客户端"再连接独立 `relay.rpc/v2` endpoint"，没有要求 v2 承载写方法，因此不算违规；但实际效果是**新客户端必须同时挂 v1 与 v2 两条连接**才能既写又看 Attention。这一口径没有写进 as-built 或 OPEN-POINTS，建议登记，免得 DHR_35 按"v2 是完整通道"去设计。

### P3-3 · descriptor 的 `methods_schema` 只是协议名字符串

`relay-core/runtime/service.mjs:797` / `fixtures/golden/rpc-descriptor.v2.json` 的 `methods_schema` 值是 `"relay.rpc-methods/v2"`。design §D2-4 列的是"返回 … `methods_schema`"，没写必须内联 schema 本体，故不判违规；但一个不自带副本的新客户端无法只靠 bootstrap 拿到方法约束（要再连 v2 调 `contracts`）。仅登记口径。

### P3-4 · 两条只能由本卡（或另开卡）关闭的残留

代码轮 1 §7.2 的未整改项 **P2-4**（staging blob 与 prepared journal 从不回收，`events.jsonl` 整份作为 mutation target，磁盘随 pause 次数 O(n²)；design D2「成功后按审计保留规则回收」尚无实现）与 **P3-1**（`relay.subscription-terminal/v1` 已进 capability 基线、`rpc/server.mjs:220` 有 sink 方法、`relay.rpc.v2.schema.json` 有通知分支，但全仓无生产者；design §D2-4 把它列为"v2 才可收到"的对象）——本轮从归属角度补一句：**这两处都落在 Store 与 RPC，而 DHR_34 被明令禁改这两处**，所以它们不会被下游顺手带走。要么本卡收口前关，要么由主控明文转入 backlog 并指定承接卡，不能默认"以后自然会有人做"。

---

## 3. 已核对并确认覆盖的需求项（明确 clean，逐条）

以下是本轮实际逐条对照 design/11 与 brief 后**确认成立**的部分，不是"未看"：

**完成条件 1 / P6-IQ-A1**

1. **身份四件套的冻结时点正确**。`workflow-driver.mjs:92-113` 在 `openAttempt` 内、`launchHerdrAgent` 之前完成 source identity 与有序 fallback 快照的冻结，符合 D1「由 `openAttempt()` 在开立 Attempt 时冻结」。定向证据 `test/agent-node.test.mjs`「Herdr Attempt freezes source and ordered fallback identities before launch」同时断言了顺序与"投影值不入 Receipt"。
2. **两个 hash 的输入与 D1 逐字一致**，且没有混用 Runtime/Host handshake 的 capability hash（`profiles/identity.mjs:130-139`）。
3. **开立 / 持久化 / 重放同一份 `executor_identity`**：`store.mjs:450-454` 的 `registerAttemptReceipt` 先 schema 校验再入 `receipts/`，`openStore` 重放读回同一工件；`test/attempt-contract.test.mjs:87` 钉住。
4. **`launch-receipt/v2` 历史形态仍可读**：该 schema 与其 golden 在 `fixtures/manifest.json` 中零改动，旧 `registerReceipt` 分支保留。与 D1「不得仅升级它而遗漏真正的 Attempt 链」的方向一致——本卡确实新起了 Attempt Receipt，没有拿 launch receipt 顶包。
5. **Receipt 字段闭集与容量上界**符合 D1/D2（`additionalProperties:false`、`maxItems:6`、alias `{1,48}`、profile id `≤96`、hash 64 位小写 hex），且整改后 registry schema 的对应上界已同源（`executor-profile.schema.json:61/65`）。

**完成条件 2 / P6-IQ-A3**

6. **"一次原子暂停事实"成立**：pause 工件 + 单条事件 + `state.json` 走同一个 `commitMutation`（`store.mjs:480-484`），没有拆成多次 append。
7. **三个派生 ID 逐字复算、四个时间戳三点对齐、嵌套 ID 交叉校验**（`store.mjs:402-417`），伪造即 `E_FALLBACK_PAUSE_INVALID`，有反例。
8. **`event.at == raised_at`**、`kind` 的必填 `node_id`/`attempt_id`/`reason=E_FALLBACK_UNAVAILABLE` 已进 `relay.event.v2.schema.json` 的条件分支——符合 D2「扩展既有 `relay.event/v2`，不另起无接收方的事件信封」。
9. **detail 是 canonical JSON 的 UTF-8 文本、仍落在既有 string 字段**，没有把对象塞进去，也没有用自由文本替代（design §5 第 1 条止损点）。
10. **同键幂等按 canonical 字节判定**，任一字节不同即冲突（`store.mjs:461-464`）。
11. **一次成功重放同时导出 fence + `waiting_human` + open Attention**：`state.mjs:10` 接入转移集，fence 集合与 Attention 由 pause 工件派生，且整改后 `assertPauseLedger` 已是**双向**核对，raw `appendEvent` 造两个新 kind 被 `MUTATION_ONLY_KINDS`（`store.mjs:26/439`）拒绝——D2「三者缺一即坏账 fail-closed」成立。
12. **`E_ATTEMPT_FENCED` 的判定位置正确**：`appendResult` 与 `appendCheckpoint` 都在 `currentReceipt()` 判定**之前**查 fence 集（D2 逐字要求的次序），且是拒收不隔离，与 `reason-codes.md` 新增行一致。
13. **`paused` 没有成为新的 Store/Run 枚举**（`state.mjs:3-4` 的 `STATUS_RANK`/`GROUP` 未新增值），Run 投影落在既有 `waiting_human` / `needs_you`——符合 D2 非目标与第 3 条。
14. **v1 冻结面逐字成立**：`relay.rpc/v1`、`relay.rpc-methods/v1`、`relay.client-read-model/v1` 三份契约零 diff；握手 capability hash 仍为 `994d5f…c971e`；v1 端点地址不变（`endpoint.mjs:38-42` 的 `channel='v1'` → 空后缀）。
15. **v1 遇 open Attention 用既有 error 形态整体拒绝、绝不筛项**（`service.mjs:667` 逐项检查后整体抛错，不 `filter`），`subscribe` 的判定整改后已下沉到写队列内（`service.mjs:588-599`），订阅后才出现 Attention 时在**发任何事件帧之前**关闭连接（`service.mjs:556-568`：`closeForAttention` 早于 `sink.event` 与 `runStateChanged`）——D2§4 的 publish barrier 语义成立。
16. **v1 backfill 也过同一道闸**（`service.mjs:619-621` + `:642-650`），两个新 kind 都不会到达冻结的 v1 客户端。

**完成条件 3 / P6-IQ-A5**

17. **参数集与 D2§5 逐字一致**（`relay.rpc-methods.v2.schema.json:37-48` 的 `{run_id, node_id, pause_id, executor_profile_id, retry_request_id}`，`additionalProperties:false`，`retry_request_id` 为 sha256 形态），且**只挂在 v2**、v1 方法表没有它。
18. **单事务 all-or-nothing**：resolution 工件、新 Receipt 工件、两条事件（`fallback_pause_resolved` + `attempt_started`）、`state.json` 共 4 个 target 走同一个 `commitMutation`（`store.mjs:523-528`），任一前置校验失败都在写盘前抛出。
19. **`(pause_id, retry_request_id)` 幂等键成立**，同键返回同一 resolution + 同一 Receipt；同键换 profile 报冲突；**不同键重试已关闭 pause 返回 `E_FALLBACK_PAUSE_CONFLICT`**（整改后与 D2§5「返回冲突」同口径）。
20. **旧 Attempt 永久 fenced，`resume` 不复活**：resolution 后旧 `receipt_id` 的迟到 result 仍 `E_ATTEMPT_FENCED`，有定向断言（`test/attempt-contract.test.mjs:198` 段）。
21. **新 Attempt 不复用旧 ID 或旧身份快照**：`assertResolutionSemantics` 显式拒绝 `attempt_id`/`receipt_id` 与 pause 相同（`store.mjs:426`），`receipts.has(new receipt_id)` 拒重（`:503`）。
22. **resolution 后节点回到 `running`、Attention 关闭**（探针与 `test/attempt-contract.test.mjs:198` 一致），符合 D2「重放该 resolution 才会关闭 Attention」。
23. **retry 的双重复核到位**：`attempt-retry.mjs:28`（必须在冻结集合内）→ `:30-35`（当前 registry 可载、含该 profile、重读非敏感 projection 后四字段全等）→ `store.mjs:429-432` 再独立复核一遍。**注意**：这一条的有效性受 P1-1 与 P2-5 限制。

**边界（做多 / 做歪）**

24. **没有做 quota 分类或自动 fallback 选择**：全仓 `grep quota` 在 `relay-core/` 的 `.mjs` 里零命中（`quota_detector_id` 只作为 registry 的可选字段存在），D3 的选择规则一行未实现——边界守住了。
25. **没有读写凭据、没有自动登录、没有账号配置写入路径进仓**：projection provider 只按已登记 JSON Pointer 取值，TOML 只认 section 之前的顶层键，Pointer 深度 >1 直接拒；`assertSafeProjection` 对键与值双向做凭据形态拒绝。仓内 fixture 与 golden 全部为占位值（`RUN-1` / `aaaa…`）。
26. **不修改历史 design/02、不新增 `paused` 枚举、不让控制客户端改变已冻结身份链**（A4 面）：`herdr-adapter` / `agent-node` 既有回归仍在，断言未被削弱，改动只是给 fixture 补 `config_fingerprint_rule`（其必要性本身构成 P1-2 的证据）。
27. **契约闸自洽**：新增 5 处条件收窄点在 `tools/audit-contracts.mjs` 与 `contracts/OPEN-POINTS.md` 成对登记；`capability-baseline.json` 已随 schema 重算；as-built 新增 §3.12 记录了本卡增量（除 P3-1 的陈旧 hash 外内容与实现相符）。
28. **DHR_34 仍 blocked-by:DHR_61 的事实没有被本卡单方面解除**（DevPlan 与 findings 均未改该依赖）——符合 execution_strategy 的收尾铁律。

---

## 4. 与 brief 完成条件的逐条对照（只陈述事实，不做验收裁决）

| # | 完成条件 | 本轮判定 | 未成立的具体项 |
|---|---|---|---|
| 1 | Attempt Receipt 在开立、持久化与重放中保有同一 `executor_identity`；`launch-receipt/v2` 历史形态仍可读，Receipt、事件、日志与测试样本零敏感值 | **主干成立，两项待处理** | P1-2（把缺规则的既有 Herdr profile 变成整届停摆，超出边界的破坏性变更）；P2-6（"零敏感值"这一面没有可复跑闸与证据 ID） |
| 2 | 单条 canonical `fallback_pause_created` 原子重放 fence、`waiting_human` 与 Attention；重复、冲突、损坏、截断及 journal 强杀阶段均 fail-closed，迟到写入返回 `E_ATTEMPT_FENCED`，v1 不静默丢失 Attention | **主干成立，三项待处理** | P1-1（`manual_retry_profiles` 的派生不变量无任何强制点，实测可造出与 Receipt 无关的选择集）；P2-7（"journal 强杀阶段**均**"只覆盖 8 个切点中的 1 个，resolution 侧为零；"截断"无专属反例）；P2-4（坏 Run 让整张 `listRuns` 抛错，粒度大于设计要求的"该 Run"） |
| 3 | v2 `retry-with-profile` 仅接受冻结且仍匹配的 profile；同键幂等，关闭 pause、快照不匹配和部分失败均有定向反例，旧 Attempt 始终 fenced | **主干成立，两项待处理** | P1-1（"冻结"这个前提本身没被 Store 保证）；P2-5（冻结身份与"当前 registry 全等"复核读的可能是两份 registry，端到端链无同源测试） |
| — | 需求境证据（宪章 #3） | **不成立** | P1-3：三条需求对齐项与三条完成条件的证据列全部指向无关的 `E-001`，progress 证据账本缺整个后半程与整改批，findings F-002/F-003 与现状相反 |

## 5. 交给主控的裁决点（不代判）

1. **P1-2 的三选一**（registry 提 required / 抛错降级为跳过 / 明文登记为破坏性变更 + 迁移说明）。
2. **P2-1 的归属**：A2 需要的 fresh-Attempt 原语是本卡补，还是明文授权 DHR_34 触碰 `workflow-driver.mjs`（届时要同步改 DevPlan `:126` 的禁令）。
3. **P2-3 的取舍**：v2 读模型是否要在冻结前并入 pause 摘要；不并入就需要一条明文的 OPEN-POINTS/backlog 登记，指明 DHR_35 从哪里取 `manual_retry_profiles`。
4. **P3-4 的两条残留**（journal 回收、`subscription-terminal` 无生产者）关在本卡还是转 backlog 并指定承接卡——它们落在 DHR_34 的禁改面上，不会自然被下游带走。
5. **P1-3 的收口顺序**：review.md 的 AI 提交区、progress 证据账本与 findings 状态由谁在何时补齐；在补齐前本卡不具备进入"待验收"的需求境证据。
6. §0 第 3 项的**模型不一致**是否需要主控另行核实。

## 6. 声明

- 本轮只读：未改任何生产代码、未改任何既有工件（含 brief / task_plan / progress / findings / review）、未派活、未提交、未询问用户；探针脚本落在会话 scratchpad 与系统临时目录，运行后即清理，**未写入本仓库、未读取用户级 registry 或任何 profile 配置文件**。
- 本文件只陈述事实与级别，不代主控做验收裁决，不勾人类签名区，不改 DevPlan 状态列。
