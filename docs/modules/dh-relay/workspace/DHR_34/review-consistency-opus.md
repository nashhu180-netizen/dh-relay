<!-- dh:v1 -->
# DHR_34 · 一致性复核（独立 · fresh · Review Batch）

## 0. 启动形态（来源并列，矛盾即标待证）

| 来源 | 记录 |
|---|---|
| 派发口径 | Review Batch 一致性路径，复核用 Opus |
| SessionStart hook 自报 | `当前模型：claude-fable-5[1m]` |
| 实例可见的系统自报 | `You are powered by the model named Opus 5. The exact model ID is claude-opus-5.` |

**结论：形态待证。** 两条来源互相矛盾，按 `findings.md` F-005 既有口径不得登记为「已核验 Opus」。本文技术结论不依赖该形态判定。

## 1. 范围与纪律

- 范围：`git diff master` 全部内容 + 全部 untracked（`relay-core/runtime/executors/identity/fallback.mjs`、`relay-core/runtime/executors/quota/classifier.mjs`、`relay-core/test/identity-quota.test.mjs`），按一致性视角逐字段 / 逐状态比对，不复述代码轮 1 已闭合的同一结论。
- 已读：仓根 `AGENTS.md`；`workspace/DHR_34/` 的 brief / task_plan / progress / findings / review / review-code1-opus；`design/11` D1~D3 与 P6-IQ-A1~A5；`design/06` HC-CTRL-H12；`dev_plan/P6-…-开发方案.md`（DHR_34 卡面 `:172-183`、`:126`、`:233-235`）；DHR_61 的 `findings.md`、`review-consistency-opus.md`、`review-req-opus.md` 相关段；`as-built/relay-core.md`；被消费的冻结面 `contracts/relay.attempt-receipt.v1.schema.json`、`contracts/relay.fallback-pause.v1.schema.json`、`store/store.mjs`、`store/state.mjs`、`runtime/attempt-retry.mjs`、`runtime/service.mjs` 的 retry 分支、`profiles/{identity,validate-profiles,executor-profile.schema}`、`runtime/executors/herdr/profile-registry.mjs`。
- 纪律：只读。未派活、未问用户、未改任何代码 / 测试 / 计划状态；唯一写入文件为本文件。按主控指令**不重跑全量**（见 §5 证据限制）。

## 2. 本轮自取证据

| ID | 命令 / 动作 | 结果 |
|---|---|---|
| RC-E01 | `node --test test/identity-quota.test.mjs` | 10/10，exit 0，3125.7 ms —— 与 E-013「单文件 10/10」一致 |
| RC-E02 | `node relay-core/tools/audit-contracts.mjs` | 五项检查（meta 分叉 / K-3 内联 pattern / 信封跨边界 / 结构位置 token / 白名单同步）均 0 违规 |
| RC-E03 | `git diff master --stat -- relay-core/{contracts,fixtures,profiles,store,rpc} relay-core/runtime/service.mjs relay-core/runtime/attempt-retry.mjs relay-core/cli` | **空**——禁改面零 diff |
| RC-E04 | `git status --porcelain -uall -- relay-core/{contracts,fixtures,profiles,store,rpc}` | **空**——禁改面无 untracked 新增 |
| RC-E05 | `git diff master --stat`（全量） | 生产面仅 `runtime/workflow-driver.mjs`（+69/-8 形态）与 `package.json`（`scripts.test` 单行）；新增仅两个 executors 子目录与 `test/identity-quota.test.mjs`；文档仅 `workspace/DHR_34/**` |
| RC-E06 | 顶层用例静态计数 `grep -c '^test('` | `identity-quota` 10、`herdr-adapter` 15、`agent-node` 9 = 34，与 E-012 的 34/34 总数自洽 |
| RC-E07 | 一次 `npm test` 的尾部输出（**非完整证据**，见 §5） | `test/service.test.mjs` 三处失败：`E_PENDING_LOCK_BUSY`、`listRuns` timeout、launcher `E_SERVICE_NOT_READY:ready-timeout-30000ms`；均在本卡零 diff 的 `service.mjs`/`launcher.mjs` 面上，与代码轮 1 的 R1-E06 同族，判为四路并发下的定时 / 锁争用，**不归因本 diff** |

## 3. 逐字段 / 逐状态一致性映射（clean）

| # | 比对面 | 结论与锚点 |
|---|---|---|
| M-1 | detector 白名单 ↔ registry 字段 | `quota/classifier.mjs:1-4` 的闭集只认 `codex-usage-limit/v1`、`claude-usage-limit/v1`；detector 值来自冻结 registry 的 `quota_detector_id`（`profiles/executor-profile.schema.json:69`，DHR_61 已冻结的可选字段），本卡未扩 schema。未登记 detector → `unknown`（`classifier.mjs:9`），闸门在消费侧而非配置侧，方向与 design/11 D3「不可分类不触发」一致 |
| M-2 | 双证据口径 ↔ 施工裁决 | `classifier.mjs:14-16` 要求 `http_status===429 && error_code==='usage_limit_reached'` 全等；`progress.md:30` 的设计裁决与 `findings.md` F-002 逐字同口径；形状不合（非对象 / 非整数 / 非字符串）落 `unknown`（`:10-13`），raw message 落 `unknown`（用例 `test/identity-quota.test.mjs:45`） |
| M-3 | 分类触发点 ↔ 结果语义 | `workflow-driver.mjs:249-251` 只在 `verdict.outcome === 'failed'` 时分类，成功路径硬编码 `not_quota`；`orphaned`/`succeeded` 不进 quota 分支，与 D3「只有 quota 高置信才允许换号」同向 |
| M-4 | fallback 选择序 ↔ Receipt 冻结序 | `identity/fallback.mjs:15` 直接遍历 `attemptReceipt.fallback_profile_snapshots`，不排序、不重算、不查当前 registry 扩集；`workflow-driver.mjs:109-114` 的快照按 `fallback_profile_ids` 原序生成。逐字满足 D1「不得重新计算或扩大」与 D3「按原序第一个合格项」 |
| M-5 | 合格判据四要素 | `fallback.mjs:17`（当前 registry 有条目 + 平台匹配 + 有 `config_fingerprint_rule`）+ `:19-20`（重算投影并四字段全等，`sameIdentity` `:5-8` 逐字段比）；registry 整体校验由 `profile-registry.mjs:15-16` 的 `validateProfiles` 前置，与 D3 合格定义逐项对齐 |
| M-6 | 身份派生 ↔ DHR_61 唯一真相 | `fallback.mjs:3` 直接 import `freezeProfileIdentity`/`resolveProfile`，未另起一套哈希；四字段与 `profiles/identity.mjs:130-146` 的 `config-fingerprint/v1`、`executor-capability/v1` 同源。DHR_61 `review-req-opus.md` P2-1 担心的「DHR_34 另起一套身份冻结逻辑」**未发生** |
| M-7 | 选中身份 ↔ 写进 Receipt 的身份 | `workflow-driver.mjs:261-265` 把选号当次的 `registrySnapshot` 与 `executorIdentity` 一并交下去；`openAttempt:103-108` 复用该身份并加 `E_EXECUTOR_IDENTITY_MISMATCH` 防线。使用时刻全等（D3）成立，无二次冻结窗口 |
| M-8 | fresh Attempt ↔ H12 | `openAttempt:95-96` 新 `randomUUID` + `rcpt-` 前缀，新身份快照；`test/identity-quota.test.mjs:135-141` 断言两次 `attempt_started` id 不同、两份 Receipt 的 `executor_identity.executor_profile_id` 分别为 source / backup。对齐 `design/06` HC-CTRL-H12「更换 Executor 产生 fresh Attempt」 |
| M-9 | 旧 Attempt 迟到写 ↔ 两种语义不混用 | 自动 fallback 路径（旧 Attempt 已终态、非当前）迟到 checkpoint → `E_IDENTITY_MISMATCH`、迟到 result → `late_result_quarantined`（`store.mjs:576-608`，用例 `:144-152`）；pause 路径 → `E_ATTEMPT_FENCED`（`store.mjs:508,577,598`）。正是 DHR_61 `review-req-opus.md:101` 提醒「隔离 vs 拒收，DHR_34 别用混」的两种语义，本卡未混用 |
| M-10 | pause 三个派生 ID ↔ Store 复算 | `fallback.mjs:10-11,32,36,41` 的 `sha256(protocol + "\n" + run_id/node_id/attempt_id/receipt_id/reason_code)` 与 `store.mjs:420-426` 的独立复算、design/11 D2 `:54,56,57` 的字面公式三者逐字一致；`raised_at == fence.fenced_at == attention.raised_at`（`fallback.mjs:33,37,42`）满足 `store.mjs:417` 对齐校验；毫秒时间戳形态由 `workflow-driver.mjs:37` 的 `toISOString()` 恒满足 `contracts/relay.fallback-pause.v1.schema.json` 的 `millisecondTimestamp` |
| M-11 | `manual_retry_profiles` ↔ Store 保序子集校验 | `fallback.mjs:44` 原序浅拷贝整份快照，落入 `store.mjs:429-438` 的「必须是当前 Receipt 快照的保序子序列」；容量由 `validate-profiles.mjs:67-93,114-116` 在注册时证明 ≤4096，与 D2 容量条款闭环 |
| M-12 | pause 状态投影 ↔「不是失败」 | `fallback_pause_created` → `state.mjs:10` 投影 `waiting_human` → `state.mjs:4` 组 `needs_you`；无 fallback 路径不落终态 Result（`workflow-driver.mjs:268-281` 无 `recordResult`，用例 `:167-170`）。与 design/11 `:8` 用户确认的「停止自动切号并等待人工，不是任务失败」一致 |
| M-13 | 二次 quota ↔ 一跳上限 | `workflow-driver.mjs:252` 以 `quota_confirmed` 为外层分支、`:253` 的 `allowAutomaticFallback` 只控制「是否允许自动选号」，第二次 quota 落 pause 而非 terminal failed（用例 `:213-229`）。这是代码轮 1 P1-1 的整改形态，与 D2/D3 边界一致 |
| M-14 | 暂停节点 ↔ 不被自动重开 | driver 可重驱状态集只有 `pending/failed/orphaned`（`workflow-driver.mjs:451-452`），恢复届只收 `running`（`:395`）；`waiting_human` 两处都不命中。与 D2「只有人工 `retry-with-profile` 才可创建新 Attempt」一致 |
| M-15 | 恢复身份权威 ↔ 控制客户端写的 detail | `workflow-driver.mjs:425-426` 优先取已签 Receipt 的 `executor_identity.executor_profile_id`，并据此改写 handle 的 `executor_profile_id`（`:433`）。这实际**加强**了 P6-IQ-A4：event.detail 里的 `profile=` 不再能改写执行身份 |
| M-16 | 旧式 Receipt 兼容 | `:426` 的可选链回退 `fields.profile ?? profile.ref`；`test/herdr-adapter.test.mjs:260` 的 legacy `registerReceipt`（无 `executor_identity`）恢复夹具与 `:267-284` 的四条恢复用例仍覆盖该支，DHR_33 语义未被削弱 |
| M-17 | fallback Attempt 恢复 ↔ F-006 不变式 | `:428-429` 的 `allowAutomaticFallback: recoveredProfileRef === profile.ref` 使恢复出的 fallback 身份不再获得自动切号权，用例 `test/identity-quota.test.mjs:249-278` 钉住（第三身份零产生）。与 `findings.md` F-006 处置逐字一致 |
| M-18 | pause 落账失败 ↔ 不造自由文本 Attention | `workflow-driver.mjs:269-280` 打标 + `:304` 穿透通用 catch，用例 `:173-194` 断言 `human_input_requested=0`。与 design/11 `:64`「不得用自由文本或仅有页面文案替代」及 F-009 一致 |
| M-19 | 禁改边界 | RC-E03/RC-E04：`contracts/**`、`fixtures/**`、`profiles/**`、`store/**`、`rpc/**`、签发服务 `runtime/service.mjs` 与 `runtime/attempt-retry.mjs` 全部零 diff、零新增；RC-E02 五项 0 违规。与 brief 禁改段、DevPlan `:180` 一致 |
| M-20 | 允许路径 ↔ 实际改动 | RC-E05 的改动集合是 brief 允许路径的子集；`package.json` 已按 F-007 以「**失序补录**」明文补入（`brief.md:36`），未伪装成正常流程，符合 AGENTS.md 宪章 #1 |
| M-21 | 凭据红线 | 新增面只承载 hash 与已批准脱敏别名；`fallback.mjs:21` 的 catch 不打印任何内容；异常串只含 profile id / pointer 名（`workflow-driver.mjs:100,104,112`）；`store.mjs:604,614` 对写盘 structured 仍过 `redactStructured` |

## 4. 漂移与缺口（P0-P3）

### P0（0 项）

无。

### P1（0 项）

无。代码轮 1 的 P1-1 已整改闭合，本轮独立复看 `workflow-driver.mjs:249-281` 与用例 `:213-229`，语义与 design/11 D2/D3 对齐，不再重开。

### P2（4 项）

**P2-1 · 被选中的 fallback 自身带「无投影规则」下游条目时，静默 `return` 会把节点留在 `failed` 而不是 DHR_61 冻结的「保持 pending / 转 pause」语义**

- 位置：`relay-core/runtime/workflow-driver.mjs:147-149`（递归进入后的前置守卫）；触发前已执行 `:260` 的 source `recordResult`；对照口径 `docs/modules/dh-relay/workspace/DHR_61/findings.md:13`（F-004 处置：「缺规则仅保持该节点 pending」）与其定向用例 `relay-core/test/agent-node.test.mjs:265`。
- 事实链：`selectQualifiedFallback` 的合格判据（`identity/fallback.mjs:17-20`）**不看候选自身的 `fallback_profile_ids`**。若被选中的 backup profile 的下游 fallback 条目缺 `config_fingerprint_rule`（该字段在 `profiles/executor-profile.schema.json` 中是**可选**，`validate-profiles.mjs` 只拒 dangling 与超容量，不强制该规则），递归调用在 `:147-149` 静默 `return`：不开 fresh Attempt、不写 pause、不落 Attention，而 source 已经是 `attempt_failed` 终态 → 节点终态 `failed`。
- 为什么算漂移：同一守卫在**首次开 Attempt** 时的结果是「节点保持 pending、零事件」（DHR_61 F-004 明文口径 + `agent-node.test.mjs:265` 钉住），在 **fallback 递归**时却变成「节点 failed 且无任何等待人工的痕迹」——同一条守卫在两条路径上给出不同的用户可见状态，且后者正是 design/11 `:8` 要排除的「呈现成任务失败」。
- 触发条件是静态 registry 配置而非竞态，方向仍 fail-closed（不会误切号），故不定 P1。
- 登记缺口（本条的真正问题）：代码轮 1 已在 `review-code1-opus.md:181` 把它识别为 P2-1 残留并**建议登记 backlog**，但 `findings.md`（F-001~F-010）与 `docs/modules/dh-relay/backlog.md` 至今**零登记**。按 AGENTS.md 铁律 #5「范围外新想法记 findings/backlog」，这条已识别的残留不能只停在复核文档里。

**P2-2 · E-008「244/244」与当前候选不同步，且两个独立复核环境都未复现全绿**

- 位置：`docs/modules/dh-relay/workspace/DHR_34/progress.md:23`（E-008，取自整改前）；`:27`（E-012 的 34/34 为定向三份，非全量）。
- 事实：E-008 之后，代码轮 1 整改新增了 3 条用例（`test/identity-quota.test.mjs` 由 7 条增至 10 条，RC-E01/RC-E06 可核），因此当前候选的全量数应为 247 而非 244——**E-008 描述的「当前候选全量回归终态通过」在字面上已不指向当前树**。
- 复现状况：代码轮 1 的 R1-E06 未一次全绿（`service.test.mjs:494` ready 超时）；本轮 RC-E07 在四路并发环境下看到同族的三处失败。两次都定性为环境争用、不归因本 diff（`launcher.mjs`/`service.mjs` 零 diff），但结论一致：**「全量终态通过」这条机器证目前没有可复现的当次证据**。
- 处置建议（不在本卡代做）：收口前由主控在**非并发**环境重取一次全量并更新 E-008 的数值与时间，或在 E-008 上明文注记该用例的已知并发抖动与当前候选用例总数变化，避免验收时把它当作本卡引入的回归、或当作已复核过的当前候选证据。

**P2-3 · `as-built/relay-core.md` 未反映本卡的现役实现，且 as-built 不在本卡允许路径内**

- 位置：`docs/modules/dh-relay/as-built/relay-core.md:203`（仍写「DHR_61 不做 quota 分类、自动 fallback 选择或 DHR_34 D3 编排」，语境是「这些留给后续路径」）、`:184`（`workflow-driver.mjs` 的职责描述只有 Process 闭环与 resume/fresh attempt，无 quota 分类、fallback 编排与 canonical pause 分支）、`:279`（`runtime/executors/` 只列 `herdr/`）。
- 事实与先例：AGENTS.md 把 as-built 定为「现役实现是什么样」的快照；**DHR_61 是在自己卡内更新 as-built 的**（squash `84eb2bf` 的文件清单含 `as-built/relay-core.md`）。本卡新增了 `runtime/executors/identity/`、`runtime/executors/quota/` 两个模块与 driver 的 D3 分支，as-built 零改动，`brief.md` 的允许路径也不含 `as-built/**`。
- 因此这是**归属问题而非施工越界**：要么主控裁定把 `as-built/relay-core.md` 补进允许路径（同 F-007 的补录方式留痕），要么明文把 as-built 刷新放到收口动作里。若不处置，合入后 as-built 会与现役实现直接矛盾（`:203` 的句子会变成错的）。

**P2-4 · pause 之后没有任何路径驱动人工 `retry-with-profile` 开出的新 Attempt（跨卡缺口，两卡均未登记）**

- 位置：`relay-core/runtime/service.mjs:745-757` → `runtime/attempt-retry.mjs:36-55`：retry 只在一个事务里追加 resolution 并**开立** Receipt/Attempt，不启动执行器、不起 driver；`store/state.mjs:9,26` 使该节点由 `waiting_human` 折回 `running`、`current_attempt_id` 变为新 Attempt。
- 后果链：此后 driver 主循环只收 `pending/failed/orphaned`（`workflow-driver.mjs:451-452`），不会驱动它；恢复届虽然收 `running`（`:395`），但该 Attempt 没有任何带 `executor_ref` 的观测事件，走 `:401-406` 只补一条 `observation_lost` 就 `continue`。净效果：人工重试后节点停在 `running` + 一个永不被执行的 Attempt。
- 为什么写在本卡的一致性复核里：D3 的 pause 出口（本卡唯一写入者）与 D2-5 的 retry 入口（DHR_61）在树上**接不拢**，这条缝只有把两卡放在一起看才可见。它不属于本卡验收三条的任何一条（本卡不拥有 RPC/Store），也不构成本卡实现漂移，故不判 P1；但 DHR_61 `findings.md` F-005/F-006、本卡 findings 与 backlog 三处都没有它。
- 处置建议：由主控明文登记（findings 或 backlog）并指定承接卡（形态上属 DHR_35 真实闭环），避免「以后自然会有人做」。

### P3（6 项）

- **P3-1 · registry 文件缺失被归入 `fallback_unavailable` 而非 `registry_unavailable`**：`runtime/executors/herdr/profile-registry.mjs:19` 对 ENOENT 返回 `{ok:true, registry:{profiles:[]}}`，于是 `fallback.mjs:14` 的 `registry_unavailable` 只覆盖「存在但校验不过」。两者最终都写同一 `reason_code`（合同 const，非本卡可改），安全方向一致；但 design/11 `:72`「两个独立负例」在账面上只剩一个。代码轮 1 P2-3 已建议把这条区分写进 findings，**至今未落**。
- **P3-2 · `sameIdentity` 双份实现**：`runtime/attempt-retry.mjs:5-8`（DHR_61）与 `runtime/executors/identity/fallback.mjs:5-8`（本卡）逐字相同。本卡禁改 `attempt-retry.mjs`，无法抽公共件，属被冻结路径逼出的重复；风险由 `contracts/relay.attempt-receipt.v1.schema.json` 的 `required` 四字段 + `additionalProperties:false` 兜住，但身份字段将来若扩项，两处必须同步改。建议登记一条，避免下一张卡只改一处。
- **P3-3 · task_plan 步骤 4 与实际改动不符**：`task_plan.md:21` 写「Modify/Test · 允许路径中的回归测试…补 DHR_33 语义回归」，而 `test/herdr-adapter.test.mjs`、`test/agent-node.test.mjs` **零 diff**（RC-E05），相关回归实际补在 `test/identity-quota.test.mjs:249-278`。结论无误（回归确实存在且更集中），只是账面上「怎么改」与实际落点不一致，收口前值得一句更正。
- **P3-4 · 代码轮 1 §6 的 34/34 拆分与实际顶层用例数不符**：`review-code1-opus.md:162` 记「本文件 10 + herdr-adapter 11 + agent-node 13 = 34」，实际顶层 `test()` 为 10 + 15 + 9 = 34（RC-E06）。总数与 E-012 自洽，仅分项归属有误，属账面 nit。
- **P3-5 · 空 `manual_retry_profiles` 的 pause 是无出口的停车位**：源 profile 没有 `fallback_profile_ids`（或恢复中的旧式 Receipt 无快照）时，pause 的人工候选集为空（design/11 D2 明文允许「可为空」），而 D2-5 的 retry 必须从该集合里选（`attempt-retry.mjs:28-29`）。此时节点永久停在 `waiting_human`，没有协议内出口。属设计已允许的形态，但产品侧出口（取消 / 换 Run / 人工终结）无人承接，建议随 P2-4 一并移交 DHR_35。
- **P3-6 · D3 分支在产线上目前不可达，机器证全部来自注入 judge**：`herdrJudge` 全仓只有测试传入（`herdr-adapter.test.mjs:173,180` 与 `identity-quota.test.mjs` 七处），`runtime/` 无生产接线；`captureHerdrResult`（`runtime/executors/herdr/herdr-executor.mjs:78-84`）在无 judge 时 `verdict=null`，永远走不到 `workflow-driver.mjs:249` 的分类。这与 as-built `:279`「判定器语义留 DHR_35」和 DevPlan `:183`「P6-M4 可 passed / constrained」一致，**不是漂移**；但 `review.md` 的「AI 提交区」只写「machine 通过」，建议补一句「依赖注入 judge，产线判定器留 DHR_35」，防止验收时把它读成端到端可用。

## 5. 证据限制（必须随结论一起读）

1. **未跑全量回归**：本轮按主控指令不重跑 `npm test`（四路并发已造成定时 / 锁争用）。RC-E07 只是一次被中断前的尾部输出，**不构成全量证据**，也不足以否证 E-008；它只支撑 P2-2 的「当次未复现」这一事实陈述。
2. **未重跑 `herdr-adapter` / `agent-node` 定向**：E-012 的 34/34 中，属这两份的 24 条本轮只做**静态**核对（RC-E06 顶层用例计数自洽），未取当次运行证据。
3. **一致性视角的边界**：本轮不重复代码轮 1 已闭合项的逐条复验（其复验结论见 `review-code1-opus.md` §6），只在跨路径 / 跨卡 / 文档—实现三个面上取证。
4. **模型形态待证**（§0），不得把本文登记为「已核验 Opus 的一致性轮」。
5. 本轮未做人验、未代签 verify、未改任何计划状态；`review.md` 的一致性行留待主控回填。

## 6. 裁决

- 逐字段 / 逐状态映射 21 项全部 clean：classifier 双证据、fallback 按 Receipt 原序选择、身份四件套同源派生、选中身份直达 Receipt、fresh Attempt 与旧 Attempt 隔离 / 拒收两语义不混用、canonical pause 三 ID 与 Store 复算逐字一致、`waiting_human` 投影与「不自动重开」、恢复以已签 Receipt 为身份权威、旧式 Receipt 兼容、禁改面零 diff。本卡消费的是 DHR_61 冻结合同本身，没有另起第二份真相。
- 4 项 P2 全部落在**登记 / 证据 / 快照同步**面，没有一条是身份链或 quota 判定的实现漂移；其中 P2-1、P2-4 需主控明文登记与指定承接卡，P2-2 需在非并发环境重取或注记全量证据，P2-3 需裁定 as-built 的归属与时点。
- 6 项 P3 为 nit、账面更正与已被设计接受的形态，不阻塞。
- 本轮只读，未改任何生产代码、测试与计划状态。

CONSISTENCY_RULING: APPROVED_WITH_CONDITIONS
open P0: 0
open P1: 0
open P2: 4（P2-1 残留未登记 / P2-2 全量证据与候选不同步 / P2-3 as-built 未同步且归属未裁定 / P2-4 retry 后新 Attempt 无驱动者，跨卡未登记）

---

## 7. 条件闭合复验（同一 reviewer · 只读 · 范围限于四项条件 + 第二批代码增量）

### 7.0 复验取证

| ID | 命令 / 动作 | 结果 |
|---|---|---|
| RC2-E01 | `node --test test/identity-quota.test.mjs` | **12/12**，exit 0，2158.4 ms —— 与 E-016 的「12/12」一致 |
| RC2-E02 | `node relay-core/tools/audit-contracts.mjs` | 五项检查仍 0 违规 |
| RC2-E03 | `git diff master --stat -- relay-core/{contracts,fixtures,profiles,store,rpc} runtime/service.mjs runtime/attempt-retry.mjs cli` + `git status --porcelain -uall` 同路径 | **均空**——第二批增量后禁改面仍零 diff、零 untracked |
| RC2-E04 | `git diff master --stat`（全量） | 生产面仍只有 `runtime/workflow-driver.mjs`、`package.json` 与两个 executors 子目录、`test/identity-quota.test.mjs`；文档新增 `as-built/relay-core.md`（已在 brief 允许路径内）与 `workspace/DHR_34/**` |
| RC2-E05 | 全量数自洽核对（静态，不重跑） | DHR_61 冻结基线 237/237（`workspace/DHR_61/findings.md:11`）+ 本卡 12 条顶层用例 = **249**；E-008 的 244 = 237 + 当时的 7 条。E-017 的 249/249 与两侧计数逐一对得上 |

按主控指令**本轮仍未重跑全量**；E-017 的 quiet 全量由施工侧在复核 pane 静止后取得，本轮只做上述计数自洽与定向复现。

### 7.1 四项条件逐条闭合

**C-1 · nested signability —— CLOSED（实现 + 反例 + findings 三面齐）**

- 实现：`runtime/executors/identity/fallback.mjs:21-29` 在「四字段全等」通过后，继续按候选自己的 `fallback_profile_ids` 原序**预冻结**其嵌套快照；任一条目缺 `config_fingerprint_rule` 即 `signable=false`、跳过该候选并继续看下一个快照，全部不合格才 `fallback_unavailable`。
- 编排：`workflow-driver.mjs:271` 把 `fallback.fallback_profile_snapshots` 交给递归；`openAttempt:105-119` 在给定快照时直接原样冻结进 Receipt，不再二次解析 registry；`driveHerdrNode:146` 的前置守卫改为 `if (!recovery && !fallbackProfileSnapshots)`，避免同一份快照被两套判据重复裁决。
- 关键性质：原 P2-1 的失败形态（source 已落 `attempt_failed`、递归静默 `return`、节点终态 failed 且零 Attention）现在**结构上不可达**——不可签的候选在 `recordResult` 之前就被判不合格，路径直接落 canonical pause。
- 反例：`test/identity-quota.test.mjs:249-268`（`thirdProjection:false`）断言 `attempt_started=1`、`attempt_failed=0`、`fallback_pause_created=1`、`human_input_requested=0`，四条同时钉住「不先终结 source」与「不造自由文本 Attention」。
- 登记：`findings.md` F-012（P1 · closed）。
- 附带的一致性增益：新路径下 Receipt 的 `fallback_profile_snapshots` 要么完整、要么该候选整体不用，**不会出现被截断的快照列表**，与 design/11 D1「唯一完整身份快照」比原实现更贴。

**C-2 · quiet full 249/249 —— CLOSED（证据自洽，未重跑）**

- 证据：`progress.md` E-017（`npm test`，Review Batch pane 静止后，249/249、exit 0、118996.4 ms），并以 E-016 明文标注取代并发期未终态的那次尝试；`findings.md` F-016（P2 · closed）把「并发尝试不计绿色证据」写成口径而非解释。
- 自洽核对：RC2-E05 的 237 + 12 = 249 与 244 = 237 + 7 两条同时成立，说明 E-017 覆盖的正是当前候选（含第二批新增 2 条用例），原 P2-2 的「证据与候选不同步」不再成立。
- 残留（P3，不阻塞）：E-008 那一行仍写「当前候选全量回归终态通过」，字面上现在指向的是整改前的候选。progress 是追加式日志、E-017 在后覆盖，但收口时值得在 E-008 上补一句「指整改前候选」以免验收误读。

**C-3 · as-built 同步 —— CLOSED（含归属补录）**

- `as-built/relay-core.md:184` 的 `workflow-driver.mjs` 职责已重写为含 Herdr Attempt、注入式 detector 分类、按 Receipt 冻结序选可完整签发的 fallback、先落 source 终态再开 fresh Attempt、无合格项 / 二次 quota 写 canonical pause；`:204` 新增「DHR_34 D3 增量」条，明写两个新模块的边界并声明「机器证来自受控注入，不能解读为真实账号自动换号已可达」。
- `:203` 的 DHR_61 边界句因此不再与现役实现矛盾——它说的是 DHR_61 不做，紧邻的新条说明 DHR_34 做了什么。
- 归属按 F-007 同一方式补录：`brief.md:37` 已把 `docs/modules/dh-relay/as-built/relay-core.md`（仅同步已落地的现役 D3 边界）补进允许路径，RC2-E04 确认实际改动就在该权限内，未顺手扩写其它章节。

**C-4 · retry-with-profile 无驱动者已移交 DHR_35 —— CLOSED（登记成立）**

- `findings.md` F-014（P2 · transferred）逐字承接本轮 P2-4 的事实链，并写明处置口径「不把『开出 Attempt』误报成『已执行』」；`progress.md` 的「Review Batch 整改」条同步记录该移交。
- 同批还补齐了我列的其余登记缺口：F-011（P1 · transferred，D3 产线不可达 = 原 P3-6）、F-013（P2 · transferred，一跳上限 + reason 不可区分 + 空 `manual_retry_profiles` 无出口 = 原 P3-5 与 P3-1 的一半）、F-015（P3 · accepted，registry ENOENT 归一为空 registry = 原 P3-1 的另一半）。
- 残留（P3，属主控收口动作）：DevPlan `:12` 的「findings 下游移交」清单目前只登记到 DHR_32/DHR_33/DHR_61，**尚无 DHR_34:F-011/F-013/F-014→DHR_35**。DevPlan 不在本卡允许路径内，故只能在此提示：这条 roll-up 是移交在本卡关闭后仍然可见的唯一入口，建议收口时补。

### 7.2 第二批代码增量的独立一致性核对（原轮未见过的面）

| # | 增量 | 结论与锚点 |
|---|---|---|
| N-1 | detector 由内置白名单改为**显式注入**（`quota/classifier.mjs:2-5`，driver 入参 `quotaDetectors = {}`，`workflow-driver.mjs:36,257-258`） | **方向正确且更保守**。原内置的 `codex-usage-limit/v1` / `claude-usage-limit/v1` 是无入册样本来源的产品断言，与 F-002「本机无获批真实 quota 样本，不伪造来源」实际相抵；改注入后生产默认空表 → 任何 detector id 都落 `unknown` → 永不自动切号，fail-closed。口径已同步进 `findings.md` F-002/F-011 与 as-built `:204` |
| N-2 | 注入表的查表方式 | `classifier.mjs:3` 用 `Object.prototype.hasOwnProperty.call` 取值，`constructor`/`__proto__` 之类原型键不会被误当已登记 detector；未命中一律 `unknown`（`:6`）。与「只有预登记条目才可能判 quota」的口径无缝 |
| N-3 | 429 + `usage_limit_reached` 双证据是否丢失 | 未丢失，只是**从实现搬到调用方**：形状校验（对象 / 整数 status / 字符串 code）仍在 `classifier.mjs:7-10`，全等判定仍在 `:11-13`；用例以合成 `synthetic-usage-limit/v1` 注入同一规则（`test/identity-quota.test.mjs:16-19`）并保留权限 / 网络 / 普通失败与 raw message 负例。`progress.md` 早先「429 + usage_limit_reached 必须同时成立」的裁决条被后一条「不再内置无样本来源的产品 detector」更新，追加式日志后条覆盖前条，无需回改 |
| N-4 | 未登记 detector 的 driver 级负例 | `test/identity-quota.test.mjs:231-247`：不注入 detector 时高置信形态的信号仍走 `attempt_failed=1`、`fallback_pause_created=0`——把「产线默认不切号」钉成回归护栏，而不只是默认参数 |
| N-5 | `platform` 提升为 driver 入参（`workflow-driver.mjs:36,260`） | 仅把原先 `fallback.mjs` 内部的 `process.platform` 默认值外提，使平台不匹配这条合格判据在 Windows 上也能被确定性断言；默认值不变，无行为漂移 |
| N-6 | 快照冻结时点前移到选号阶段 | `fallback.mjs:22-28` 与 `openAttempt:109-119` 现在共用同一次 registry 读、同一次投影读。TOCTOU 面比代码轮 1 整改后又收窄一层：`executor_identity` 与 `fallback_profile_snapshots` 现在来自同一时刻同一份 registry，与 D1「开立 Attempt 时冻结」的意图一致（冻结提前发生在同一次决策内，不跨读） |
| N-7 | 用例新增 `t.after(() => driver.stop())` | 新用例统一挂了停止钩子（如 `:243`、`:261`），减少用例间 pane / 定时器残留——正是 F-016 那类并发抖动的减因，方向正确 |
| N-8 | 禁改面与允许路径 | RC2-E03/RC2-E04：`contracts/**`、`fixtures/**`、`profiles/**`、`store/**`、`rpc/**`、`runtime/service.mjs`、`runtime/attempt-retry.mjs` 仍零 diff；新增文档面 `as-built/relay-core.md` 已先补进 brief 允许路径再改，未再出现一次失序 |

### 7.3 复验后仍开的项（均 P3，不阻塞）

- **R-1**：E-008 行文仍称「当前候选」，实际指整改前候选（见 7.2 C-2 残留）。建议收口时加一句注记。
- **R-2**：DevPlan `:12` 下游移交清单未含 DHR_34:F-011/F-013/F-014（见 7.1 C-4 残留）。主控收口动作。
- **R-3**：`task_plan.md:21` 仍写「Modify/Test · 允许路径中的回归测试…补 DHR_33 语义回归」，而 `test/herdr-adapter.test.mjs`、`test/agent-node.test.mjs` 至今零 diff（RC2-E04），相关回归实际集中在 `test/identity-quota.test.mjs`。账面与落点不符，值得一句更正。
- **R-4**：`sameIdentity` 仍在 `runtime/attempt-retry.mjs:5-8` 与 `runtime/executors/identity/fallback.mjs:5-8` 双份存在（本卡禁改前者，无法抽公共件）。身份字段将来扩项时两处必须同步，建议登记一条。
- **R-5**：`review-code1-opus.md:162` 的 34/34 分项归属（11+13）与实际顶层用例数（15+9）不符，总数无误；已被 E-016/E-017 的新计数取代，纯账面 nit。

### 7.4 复验小结

原 4 项 P2 条件全部闭合，且每一条都不是靠口径说明关掉的：C-1 有结构性不可达 + driver 级反例 + F-012；C-2 有 quiet 全量 E-017 且计数两侧自洽；C-3 有 as-built 实文改动且归属先补录后改；C-4 有 F-011/F-013/F-014/F-015 四条登记，本轮列出的登记缺口无一遗漏。第二批代码增量（注入式 detector、平台入参、快照前移）经独立核对未引入新的口径漂移，且把「无样本来源的产品断言」这一原本埋在实现里的隐患一并清掉，方向比原实现更保守。剩余 5 条均为账面更正或跨卡 roll-up，属收口动作。本轮同样只读，未改任何生产代码、测试与计划状态。

RECHECK_RULING: APPROVED
open P0: 0
open P1: 0
open P2: 0（原 4 项条件全部闭合）
open P3: 5（R-1~R-5，均为账面更正或主控收口动作，不阻塞）
