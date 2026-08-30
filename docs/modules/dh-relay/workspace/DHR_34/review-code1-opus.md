<!-- dh:v1 -->
# DHR_34 · 代码复核轮 1（独立 · fresh）

## 0. 启动形态（三条来源并列，矛盾即标待证）

| 来源 | 记录 |
|---|---|
| 派发启动命令 | `claude --model opus` |
| 屏显 | `Opus 5 with high effort` |
| SessionStart hook 自报 | `当前模型：claude-fable-5[1m]` |
| 实例可见的系统自报 | `You are powered by the model named Opus 5. The exact model ID is claude-opus-5.` |

**结论：形态待证。** 屏显与系统自报两条指向 Opus 5 high effort，SessionStart hook 一条指向 `claude-fable-5[1m]`，来源互相矛盾，按 F-005 既有口径不得登记为「已核验 Opus」。本文件的技术结论不依赖该形态判定。

## 1. 复核范围与纪律

- 范围：`git diff master` 全部内容 + 全部 untracked 文件（`relay-core/runtime/executors/identity/fallback.mjs`、`relay-core/runtime/executors/quota/classifier.mjs`、`relay-core/test/identity-quota.test.mjs`）。
- 已读：仓根 `AGENTS.md`；`workspace/DHR_34/` 的 brief / task_plan / progress / findings / review；`design/11-P6身份与额度治理契约调整.md` 的 D3、P6-IQ-A2、P6-IQ-A4（并连带核对 D1/D2 冻结字段与 store 复算）。
- 纪律：只读复核。未派活、未问用户、未改任何生产代码 / 测试 / 计划状态；唯一写入文件为本文件。

## 2. 本轮自取证据

| ID | 命令 | 结果 |
|---|---|---|
| R1-E01 | `node --test test/identity-quota.test.mjs test/herdr-adapter.test.mjs test/agent-node.test.mjs` | 31/31，exit 0，13929.6 ms — 与 E-007 一致 |
| R1-E02 | `node tools/audit-contracts.mjs` | 五项检查（meta 分叉 / K-3 内联 pattern / 信封跨边界 / 结构位置 token / 白名单同步）均 0 违规 |
| R1-E03 | `git diff --check` | exit 0，无空白错误 |
| R1-E04 | `git status --short` | 改动仅 `relay-core/runtime/workflow-driver.mjs`、`relay-core/package.json`、新增两个 executors 子目录与 `test/identity-quota.test.mjs`，加 DHR_34 workspace 五份文档 |
| R1-E05 | 变更路径凭据形态定向扫描（api key / token / cookie / secret / password / authorization / bearer / `sk-` / `eyJ`） | 零命中（唯一匹配是 `'nonsecret'` 字面量） |
| R1-E06 | `npm test`（`--test-concurrency=4`） | **未一次全绿**：`test/service.test.mjs:494`「launcher：service 被强杀后重启…」报 `E_SERVICE_NOT_READY:ready-timeout-30000ms:absent`（耗时 31865.8 ms）；单独重跑 `node --test test/service.test.mjs` 为 13/13、exit 0、该用例 2093.7 ms |

R1-E06 的定性：本卡未触碰 `runtime/launcher.mjs`、`runtime/service.mjs`（R1-E04 已证零 diff），失败形态是 30 s ready 超时而非断言不符，单独重跑同一用例 2.1 s 通过 —— 判为并发下的环境抖动，**不归因于本 diff**；但它意味着 E-008 的「244/244」在本复核环境未一次复现，见 P3-6。

## 3. 结论清单

### P0（0 项）

无。

### P1（1 项）

**P1-1 · 第二次高置信 quota 落 terminal `failed`，绕开了 canonical pause / Attention / 人工重试路径，与 design/11 已确认的产品语义冲突**

- 位置：`relay-core/runtime/workflow-driver.mjs:242`（`allowAutomaticFallback && quota.classification === 'quota_confirmed'` 的与门）、`relay-core/runtime/workflow-driver.mjs:260`（落到普通 `recordResult`）；被现有用例冻结在 `relay-core/test/identity-quota.test.mjs:179-194`（断言 `attempt_started=2`、`attempt_failed=2`、`fallback_pause_created=0`）。
- 事实链：fallback Attempt 以 `allowAutomaticFallback:false` 开立（`workflow-driver.mjs:252`）。当该 Attempt 再次拿到高置信 quota 时，`:242` 的与门直接为假，代码**既不选择 fallback，也不评估是否存在合格 fallback，更不写 pause**，径直走 `:260` 把 quota 失败记成终态 Result；节点状态经 `store/state.mjs:12` 投影为 `failed`。
- 为什么是 P1：
  1. design/11 §起因逐字写明用户已确认的业务语义 ——「无合法 fallback 时…含义是**停止自动切号并等待人工，不是任务失败或已结束**」（`docs/modules/dh-relay/design/11-P6身份与额度治理契约调整.md:8`）。当前实现在「停止自动切号」的同时把结果呈现成任务失败，正是该语义要排除的那一种。
  2. 该路径不是边角：用户配了 A→B 两个账号、两个都被限额，是最典型的场景。此时 fallback Receipt 里已经冻结了可用的 `fallback_profile_snapshots`（`workflow-driver.mjs:104-112`），本可以直接构成 `manual_retry_profiles` 让人工挑；现在这份冻结清单被丢弃，`retry-with-profile`（design/11 D2-5）在这条路径上完全够不着。
  3. 它落在 design 的两个分支之外：D3（`design/11:68`）说「合格预登记 fallback 才允许开新 Attempt」，D2（`design/11:51`）说「高置信 quota 但没有可用且预登记的 fallback 就 pause」。本实现在「高置信 quota + 存在预登记 fallback」时既不切也不 pause，属于第三种未被设计覆盖的行为。「自动 fallback 最多一跳」是 `progress.md:28` 的施工期实现裁决，不是 design/11 或 DevPlan 的冻结条款。
- 建议处置（二选一，均需在本卡内闭合）：
  - **A（推荐，改动最小）**：`workflow-driver.mjs:242` 的分支条件改为「`quota_confirmed` 即进入」，只把 `allowAutomaticFallback` 用作**是否允许自动选择 fallback**的开关；`false` 时跳过 `selectQualifiedFallback` 直接走 `:255` 的 `buildFallbackPause`。这样一跳上限保持不变（仍不会自动开第三身份），但第二次 quota 收在 `waiting_human` + open Attention + 冻结的 `manual_retry_profiles` 上，与 D2 语义一致；同步改 `test/identity-quota.test.mjs:191-193` 的断言为 `attempt_failed=1` + `fallback_pause_created=1`。
  - **B**：若坚持「二次 quota 即终态失败」，必须先走设计/DevPlan 调整并取得用户明文确认（因为它改写的是用户已确认的产品语义），不能只由施工期裁决承担；在此之前本卡不应据此收口。

### P2（4 项）

**P2-1 · 选中 fallback 后没有复用已校验的身份，重新加载 registry、重新冻结身份来开 Attempt（TOCTOU + 静默降级）**

- 位置：`relay-core/runtime/workflow-driver.mjs:243-253` 与 `relay-core/runtime/workflow-driver.mjs:133-155`；`relay-core/runtime/executors/identity/fallback.mjs:20`。
- 事实：`selectQualifiedFallback` 已经返回了通过全等校验的 `{ profile, identity }`（`fallback.mjs:20`），但 driver 只取 `fallback.profile.executor_profile_id`（`:251`）丢弃其余；递归进入 `driveHerdrNode` 后又完整重来一遍 —— `:133` 重新 `loadExecutorProfiles`、`:135` 重新 resolve、`:155` 的 `openAttempt` 再次读配置文件并重算 `config_fingerprint`。**真正写进新 Receipt 的身份，从未与 `:244` 校验过的那份快照比对过。**
- 两个后果：① 两次读取之间 registry 或 profile 配置发生漂移时，新 Attempt 会以一份未经「与冻结快照全等」校验的身份启动，而 design/11:68 的合格判据要求的正是使用时刻的全等；② 若这一窗口内 registry 变得不可加载或 profile 消失，递归在 `:134` / `:136` 静默 `return`，节点停在 P1-1 之前刚写下的 `failed` 终态上，既无 fallback 也无 Attention，用户看不到任何「为什么没切」的痕迹。
- 建议：把 `fallback.identity` 传进递归，在 `openAttempt` 冻结出身份后与之做一次 `sameIdentity` 断言，不等则不启动、走 pause 分支；递归里可直接复用已加载的 `currentRegistry`，顺带省掉一次 registry 加载。

**P2-2 · F-006 的核心不变式（恢复以已签 Receipt 身份为准 + fallback Attempt 不恢复自动 fallback 权限）零自动化断言**

- 位置：`relay-core/runtime/workflow-driver.mjs:401-405`（`recoveredProfileRef` 与 `allowAutomaticFallback: recoveredProfileRef === profile.ref`）。
- 事实：新增的这段逻辑分两支。旧式 Receipt 支（`executor_identity` 缺失 → 回退 `fields.profile`）由 `test/herdr-adapter.test.mjs:260` 的 legacy `registerReceipt` 恢复用例覆盖，绿。**新式 `relay.attempt-receipt/v1` 支完全没有用例**：全仓没有一个测试在 `receipts/` 里放一份带 `executor_identity` 的 Receipt 再触发 `recoverHerdrAttempts`；`test/agent-node.test.mjs:245-262` 只验证 Receipt 内容，不走恢复路径。
- 为什么要紧：这一支正是 findings F-006 声明「已 closed」的那条安全规则（宿主重启后 fallback Attempt 不得重新获得自动切号权限，从而串到第三身份）。目前它靠代码走查成立，没有回归护栏，任何后续改动都可能无声破坏它。
- 建议：补一条恢复用例 —— 预置一份 `executor_profile_id` 为 fallback 的 attempt Receipt + `attempt_started` + `host_observation_changed`，让恢复届再遇高置信 quota，断言不产生第三个 `attempt_started`。

**P2-3 · `registry unavailable` 与 `fallback unavailable` 在 driver 侧合流，缺 driver 级独立负例**

- 位置：`relay-core/runtime/workflow-driver.mjs:243-247`（`currentRegistry.ok ? … : null`）；`relay-core/runtime/executors/identity/fallback.mjs:14`（`registry_unavailable`）与 `fallback.mjs:23`（`fallback_unavailable`）；`relay-core/test/identity-quota.test.mjs:65-66`。
- 事实：两种状态在 `:248` 之后被同一个 `if` 收口成同一份 pause，`reason_code` 只能是 `E_FALLBACK_UNAVAILABLE`（合同 `contracts/relay.fallback-pause.v1.schema.json:13` 是 const，这一点不是本卡能改的）。安全性上没问题 —— 两者都不自动切号，符合 design/11:97 的止损条款。问题在**证据**：design/11:72 明确要求「`registry unavailable` 与 `fallback unavailable` 必须是两个独立负例」，而现在只有 `fallback.mjs` 单元层断言了 `registry_unavailable` 这个返回值，driver 层（真正决定切不切、写不写 pause 的地方）只有 `fallback_unavailable` 一条用例（`test/identity-quota.test.mjs:144-160`）。
- 另需注意：`loadExecutorProfiles` 对 ENOENT 返回 `{ok:true, profiles:[]}`（`runtime/executors/herdr/profile-registry.mjs:19`），所以「registry 文件不见了」实际走的是 `fallback_unavailable` 而不是 `registry_unavailable`；真正触发后者的只有「registry 存在但 schema/校验不过」。这条区分建议写进 findings，别只留在代码里。
- 建议：补一条 driver 级用例 —— 开 Attempt 后把 registry 改成非法内容，断言 quota_confirmed 时 `attempt_started` 仍为 1、`attempt_failed=0`、`fallback_pause_created=1`。

**P2-4 · `relay-core/package.json` 不在 brief 冻结的允许路径内，且 brief 未按其自带程序修订**

- 位置：`relay-core/package.json:12`（`test` 脚本插入 `test/identity-quota.test.mjs`）；`docs/modules/dh-relay/workspace/DHR_34/brief.md:29-36`（允许路径清单，逐条列举，无 `package.json`）。
- 事实：brief 的允许路径段落写着「施工前冻结；侦察若证明不足，停下修订本 brief」。本次改动确实必要（不接进 `npm test` 入口，新测试就不进全量回归），且已在 `progress.md` 的 E-010 里如实披露，但 brief 的允许路径至今未修订 —— 走的是「先改、后披露」而不是「停下修订 brief」。
- 建议：这是文档面的闸门问题，不是代码缺陷。收口前把 `relay-core/package.json`（仅 `scripts.test` 入口登记）补进 brief 允许路径，并在 findings 里留一条「允许路径事后补录」的可核查记录；不建议回退这一行改动。

### P3（6 项）

**P3-1 · 恢复时读 Receipt 文件无任何防御，单份工件不可读会炸掉整届 driver**

- 位置：`relay-core/runtime/workflow-driver.mjs:401`（以及 `:153` 同样的裸读）。
- 两处 `JSON.parse(await readFile(...))` 都在 `try` 之外，异常会一路穿过 `recoverHerdrAttempts` → `drive()`，让 `done` 直接变 `{ok:false}` —— 本届 driver 一个节点都不推进。对照同文件 `:56-60` `readSucceededOutputs` 的既有风格：「单份工件不可读不该让整条闭环停摆」。触发条件窄（`openStore` 会校验 receipts 目录里存在的文件，但不校验「事件引用的 receipt 文件是否还在」），属于健壮性回退而非现网缺陷。建议按同文件既有风格 try/catch 后按旧式回退处理。

**P3-2 · 同一份 Receipt 被读两次**

- 位置：`relay-core/runtime/workflow-driver.mjs:401` 与 `:153`。恢复届先在 `recoverHerdrAttempts` 读一次拿 `executor_profile_id`，进 `driveHerdrNode` 后对同一路径再读一次。可由 `recovery` 对象顺带传入，省一次 I/O，也顺带收敛 P3-1 的两个入口为一个。

**P3-3 · quota 判定结果不落任何账，产线上无法追溯「为什么切 / 为什么没切」**

- 位置：`relay-core/runtime/executors/quota/classifier.mjs:9,12,15,17`（返回里带 `detector_id`）；`relay-core/runtime/workflow-driver.mjs:239-241`（只用 `.classification`，`detector_id` 直接丢弃）。
- 整条链路上没有任何事件/工件记录「本次判定为 quota_confirmed，依据 detector X」。自动切号成功时账上只看到两次 Attempt，没有切换理由；判定为 `not_quota`/`unknown` 而没切时更是零痕迹。P6-M4 的「误判不切换」将来要靠人验（DHR_35）复盘，这条缺失会让复盘只能读代码。建议记 findings/backlog：切换与暂停时把 `{classification, detector_id}` 带进已有的 Result `structured` 或 pause 侧信息（注意仍不得承载原始文本）。

**P3-4 · `selectQualifiedFallback` 的空 catch 吞掉全部候选错误且不留痕**

- 位置：`relay-core/runtime/executors/identity/fallback.mjs:21`。
- 「一个不可用候选不该掩盖后面的合格候选」这个取舍是对的，也不泄露凭据（错误里只有 pointer 名）。但它同时吞掉了 `E_NONSECRET_PROJECTION_UNSAFE`（配置里出现疑似密钥形态）这类值得知道的信号，且不留任何计数或痕迹。行为 fail-closed，属可接受，建议至少在返回值里带上跳过原因的**代码**（非文本）供上层记账。

**P3-5 · pause 落账失败时降级为只写 `human_input_requested`**

- 位置：`relay-core/runtime/workflow-driver.mjs:256-257` 抛出后被 `:280-287` 的通用 catch 接住。
- 此时节点仍会因 `human_input_requested` 投影成 `waiting_human`（`store/state.mjs:10`），也没有落终态 Result，方向上是安全的；但账上没有 fence、没有 pause、没有 Attention 对象，与 design/11:64「不得用自由文本或仅有页面文案替代」的口径不齐。现实触发条件很窄（`assertPauseSemantics`、detail 容量、`attempt-not-current` 都由上游合同或单写者纪律挡住）。建议记 findings，不必在本卡改。

**P3-6 · E-008 的「244/244」在本复核环境未一次复现**

- 位置：`docs/modules/dh-relay/workspace/DHR_34/progress.md:23`（E-008）；复现见 R1-E06。
- `test/service.test.mjs:494` 在 `--test-concurrency=4` 下 ready 超时 30 s 失败，单独重跑同一文件 13/13 通过、该用例 2.1 s。已定性为环境抖动、与本 diff 无关（本卡对 `launcher.mjs`/`service.mjs` 零 diff）。但 E-008 作为「全量回归终态通过」的机器证，建议收口前重取一次稳定全绿，或在 E-008 上注明该用例在高并发下的已知抖动，避免验收时把它当成本卡引入的回归。

## 4. 已检查且 clean 的项（逐条）

| # | 检查项 | 结论与依据 |
|---|---|---|
| C-1 | 只有预登记 detector 才可能判 quota | `runtime/executors/quota/classifier.mjs:1-4` 为硬编码白名单，`:8-9` 未登记 detector 一律 `unknown`；profile schema 的 `quota_detector_id` 只是自由字符串（`profiles/executor-profile.schema.json:69`），闸门在分类器侧，方向正确 |
| C-2 | 必须结构化双证据才 `quota_confirmed` | `classifier.mjs:10-16`：signal 非对象、`http_status` 非整数、`error_code` 非字符串一律 `unknown`；只有 `429` 且精确 `usage_limit_reached` 才 confirmed |
| C-3 | raw 文本不切号 | `classifier.mjs:11` 对 `{message:'usage limit reached'}` 判 `unknown`，用例 `test/identity-quota.test.mjs:44` 断言；driver 侧只读 `structured.quota_signal`（`workflow-driver.mjs:240`），不解析终端输出 |
| C-4 | 非额度错误不切号 | `classifier.mjs:17` 对 403/503/500 判 `not_quota`（`test:36-40`）；driver 端到端负例 `test:162-177` 断言 `attempt_started=1`、`fallback_pause_created=0` |
| C-5 | 只在失败时才分类 | `workflow-driver.mjs:239` 仅 `outcome === 'failed'` 进分类，成功路径硬编码 `not_quota` |
| C-6 | fallback 严格按 Receipt 冻结顺序 | `runtime/executors/identity/fallback.mjs:15` 直接遍历 `attemptReceipt.fallback_profile_snapshots`，不排序、不重算；`test:47-64` 用「首个平台不符 + 次个投影漂移 + 第三个合格」证明取的是首个**合格**项 |
| C-7 | 合格判据四要素齐 | `fallback.mjs:17`（当前 registry 有条目 + 平台匹配 + 有 `config_fingerprint_rule`）+ `:19-20`（重算投影并四字段全等）；四字段定义见 `profiles/identity.mjs:140-146`，`sameIdentity`（`fallback.mjs:5-8`）逐字段比，无遗漏 |
| C-8 | registry 整体校验 | `selectQualifiedFallback` 收到的 registry 来自 `loadExecutorProfiles`，其内已跑 `validateProfiles`（`runtime/executors/herdr/profile-registry.mjs:15-16`），失败即 `ok:false` → driver 传 `null` → `registry_unavailable`，不会拿未校验 registry 选号 |
| C-9 | source 旧 Attempt 先终态 | `workflow-driver.mjs:249` 在递归开新 Attempt **之前** `recordResult`；`test:140-141` 断言 `attempt_failed=1` + `attempt_succeeded=1` |
| C-10 | fallback 必须 fresh Attempt | `workflow-driver.mjs:250-253` → `openAttempt:95-124` 生成新 `attemptId`/`receiptId`/新身份快照，不复用旧 id、不续写旧链；`test:133-139` 断言两次 `attempt_started` 的 id 不同、两份 Receipt 的 `executor_identity.executor_profile_id` 分别是 source 与 backup（design/06 H12 命题成立） |
| C-11 | 自动 fallback 最多一跳（机制本身） | `workflow-driver.mjs:252` 递归时 `allowAutomaticFallback:false`，`:242` 与门保证第二跳不再自动切；`test:179-194` 覆盖。机制无误，**语义争议见 P1-1** |
| C-12 | fallback 启动失败不被解释成再次自动切换 | 递归内启动失败走 `workflow-driver.mjs:160-169` 的终态 Result，不回到 quota 分支，符合 design/11:68 末句 |
| C-13 | 无合格 fallback 时不先落 terminal Result | `workflow-driver.mjs:255-258` 直接 `appendFallbackPause` 后 `return`，路径上没有 `recordResult`；`test:156-159` 断言 `attempt_failed=0` 且 `fallback_pause_created=1` |
| C-14 | 写的是 DHR_61 canonical pause / fence / Attention | `fallback.mjs:26-46` 三个 ID 的前缀与拼接顺序（`run_id/node_id/attempt_id/receipt_id/reason_code`）与 design/11:54,56,57 逐字一致，并被 `store/store.mjs:420-426` 独立复算通过；`raised_at == fence.fenced_at == attention.raised_at`（`fallback.mjs:33,37,42`）满足 `store.mjs:417` 的对齐校验 |
| C-15 | pause 时间戳形态合规 | `raisedAt` 取 `nowIso()`（`workflow-driver.mjs:37`，`toISOString()` 恒带毫秒），满足 `contracts/relay.fallback-pause.v1.schema.json:22-27` 的毫秒时间戳 pattern |
| C-16 | `manual_retry_profiles` 只从 Receipt 冻结快照派生 | `fallback.mjs:44` 原序浅拷贝，不查当前 registry、不扩大集合；通过 `store.mjs:429-438` 的「必须是快照的保序子序列」校验，也在 `maxItems=6` 与 detail ≤4096（`store.mjs:481`）之内 |
| C-17 | pause 后旧 Attempt 被 fence | `store.mjs:508` 在同一持久化提交里加入 fenced 集合，`store.mjs:577,598` 让迟到 checkpoint/result 以 `E_ATTEMPT_FENCED` 拒收；driver 在 `:258` 立即返回，不再写任何东西 |
| C-18 | 暂停节点不会被 resume 自动重开 Attempt | `fallback_pause_created` 投影为 `waiting_human`（`store/state.mjs:10`）→ Run 组 `needs_you`（`state.mjs:4`），而 driver 的可重驱状态集只有 `pending/failed/orphaned`（`workflow-driver.mjs:427-428`），与 design/11 D2「只有人工 retry-with-profile 才可创建新 Attempt」一致 |
| C-19 | 恢复以已签 Receipt 身份为准 | `workflow-driver.mjs:401-402` 优先取 `attemptReceipt.executor_identity.executor_profile_id`，并据此改写 handle 的 `executor_profile_id`（`:409`），控制客户端写的 event detail 不再能改写执行身份 —— 这一改动实际**加强**了 P6-IQ-A4；旧式 Receipt 经可选链回退 `fields.profile ?? profile.ref`（`:402`），DHR_33 恢复用例（`test/herdr-adapter.test.mjs:248-284`）全绿。断言缺口见 P2-2 |
| C-20 | 客户端变化不改身份链（P6-IQ-A4） | `herdr-adapter.test.mjs` + `agent-node.test.mjs` 既有回归在 R1-E01 中全绿；本 diff 未触碰 Herdr adapter、RPC 与 read model |
| C-21 | 禁改边界 | `contracts/**`、`fixtures/**`、`profiles/**`、`store/**`、`rpc/**` 与签发服务 `runtime/service.mjs` 全部零 diff（R1-E04），`audit-contracts` 五项 0 违规（R1-E02）；未读取或写入用户级注册表、账号状态 |
| C-22 | 凭据红线 | 变更路径凭据形态扫描零命中（R1-E05）；Receipt/pause 只承载 hash 与已批准脱敏别名（`profiles/identity.mjs:130-146`）；异常信息只含 pointer 名与 profile id（`workflow-driver.mjs:100,107`），投影值不进日志；`selectQualifiedFallback` 的 catch 不打印任何内容（`fallback.mjs:21`） |
| C-23 | fail-closed 方向 | detector 未登记 / 信号残缺 → `unknown` → 不切；registry 不可加载 → `null` → 不切并 pause；候选冻结失败 → 跳过；pause 落账失败 → 不落终态（见 P3-5）。所有失败方向都收敛到「不自动换号」，无相反方向的开口 |
| C-24 | 卫生 | `git diff --check` 干净（R1-E03）；新增文件无遗留调试代码、无 `console.log`、无 TODO |

## 5. 裁决

- P1-1 是唯一阻塞项：它不是实现瑕疵，而是「二次高置信 quota 的收口语义」与 design/11 已获用户确认的产品语义之间的偏差，必须按建议 A 收口或按建议 B 走设计调整后再确认。
- P2-1 建议随 P1-1 一并改（同一处分支重构即可覆盖）；P2-2、P2-3 是护栏补测，属 heavy 配方「有效单测」要求内；P2-4 是文档闸门补录。
- P3 六条建议登记 findings / backlog，不必在本卡内全部闭合；其中 P3-6 影响的是 E-008 的证据成色，建议收口前重取。
- 本轮只读，未改任何生产代码、测试与计划状态。

（以上为第 1 轮结论，保留原样；整改后的复验见第 6 节，最终裁决以文末为准。）

## 6. 整改复验（同一 reviewer · 只读 · 范围限于原 P1 / P2 / P3-5）

### 6.0 复验取证

| ID | 命令 / 动作 | 结果 |
|---|---|---|
| R1V-E01 | `node --test test/identity-quota.test.mjs` | 10/10，exit 0，1192.3 ms |
| R1V-E02 | `git diff master -- relay-core/runtime/workflow-driver.mjs` + 全部 untracked 文件重读 | 见下逐条 |
| R1V-E03 | `git status --short` | 生产面改动仍只有 `workflow-driver.mjs`、`package.json` 与两个新增 executors 子目录；`contracts/**`、`fixtures/**`、`profiles/**`、`store/**`、`rpc/**`、`runtime/service.mjs` 保持零 diff |

E-012 的 34/34 与本轮一致：本文件 10 + `herdr-adapter` 11 + `agent-node` 13 = 34，且单文件 10/10 由 R1V-E01 直接复现。按票据要求未重跑全量与另两份定向。

### 6.1 P1

**P1-1 · 二次高置信 quota 落 terminal `failed` —— CLOSED**

- 采纳的是建议 A：`workflow-driver.mjs:249` 现在以 `quota.classification === 'quota_confirmed'` 作为外层分支，`allowAutomaticFallback` 降级为**仅控制是否允许自动选号**（`:250`）；不允许自动选号、或选号未 `selected` 时，一律落到 `:263` 的 `buildFallbackPause`。一跳上限未被削弱 —— 第二跳仍然不会自动开第三身份。
- 语义修正到位：第二次 quota 现在收在 `waiting_human` + open Attention + 冻结的 `manual_retry_profiles` 上，`retry-with-profile`（design/11 D2-5）在这条路径上重新可达，与 design/11:8 用户已确认的「停止自动切号并等待人工，不是任务失败」一致。
- 用例已同向改写：`test/identity-quota.test.mjs:213-229`（原「cannot chain to a third identity」改名为「pauses for human choice and cannot chain」）断言 `attempt_started=2`、`attempt_failed=1`（只有 source 落终态，fallback Attempt 不落）、`fallback_pause_created=1`、节点 `waiting_human`。
- 非阻塞备注：`progress.md` 早先那条「实现裁决：fallback 启动或执行失败直接终态，不继续链式换号」已被同文件更晚的「代码轮 1 整改」条目更新。progress 是追加式日志，后条覆盖前条，无需回改；只在此备一笔以免验收时误读旧口径。

### 6.2 P2

**P2-1 · 选中 fallback 后重新加载 registry / 重新冻结身份（TOCTOU + 静默降级）—— CLOSED**

- `driveHerdrNode` 新增 `registrySnapshot` 与 `executorIdentity` 两个入参（`workflow-driver.mjs:137-141`）：传入 snapshot 时直接 `{ ok: true, registry: registrySnapshot }`，不再二次 `loadExecutorProfiles`。
- 递归调用把选号当次的两样东西一并交下去（`:258-262`：`registrySnapshot: currentRegistry.registry`、`executorIdentity: fallback.identity`），不再只传一个 profile id。
- `openAttempt` 用已校验身份签 Receipt 而非重算（`:103-109`），并加了一道 `E_EXECUTOR_IDENTITY_MISMATCH` 防御断言（`:103-105`），保证传下来的身份与实际解析到的 profile 同源。至此「写进新 Receipt 的身份」与「`selectQualifiedFallback` 判定全等的那份快照」是同一个对象，design/11:68 的使用时刻全等成立。
- 原 P2-1 的后果②（窗口内 registry 变化导致递归静默 `return`、只剩一个 failed 终态）同时消失：snapshot 直接复用，`resolveProfile` 必然命中。
- 残留（不阻塞，不建议本卡处理）：若被选中的 fallback profile **自身**的 `fallback_profile_ids` 指向一个没有 `config_fingerprint_rule` 的条目，`:145-148` 仍会静默 `return`，此时 source 已是 failed 终态而没有 Attention。这是 DHR_61/F-007 时代就有的 registry 配置类守卫（`config_fingerprint_rule` 在 `profiles/executor-profile.schema.json` 中是可选字段），触发条件是静态配置而非竞态，且方向仍是 fail-closed；建议登记 backlog 而不是在 D3 范围内改。

**P2-2 · fallback Receipt 恢复路径零断言 —— CLOSED**

- 新增 `test/identity-quota.test.mjs:249-278`：预置一份 `executor_identity` 为 `herdr.codex.backup`、快照为 `herdr.codex.third` 的 `relay.attempt-receipt/v1`（`:255-259`），配上 `host_observation_changed`（`:260-264`），让恢复届再撞高置信 quota。
- 断言 `attempt_started` 仍为 1（不产生第三身份）、`attempt_failed=0`、`fallback_pause_created=1`。这正好钉住了 `workflow-driver.mjs:426-428` 的 `recoveredProfileRef` 取值与 `allowAutomaticFallback: recoveredProfileRef === profile.ref` 门闩 —— F-006 的核心不变式从此有回归护栏，且顺带证明恢复后的 fallback Attempt 走的是 pause 而不是失败。
- 旧式 Receipt 兼容支仍由 `herdr-adapter.test.mjs` 的恢复用例覆盖（E-012 同组 34/34 内）。

**P2-3 · `registry unavailable` 缺 driver 级独立负例 —— CLOSED**

- 新增 `test/identity-quota.test.mjs:231-247`：在 judge 内把 registry 文件改写成 `{`（`:238`）制造「存在但校验不过」，断言 `attempt_started=1`、`attempt_failed=0`、`fallback_pause_created=1`。
- 与 `:155-171` 的 `fallback unavailable`（平台不匹配）用例并列，design/11:72 要求的两个独立负例在 driver 层各自成立，且都不自动切号。
- 保留说明：两者最终仍写同一 `reason_code`（合同 const，非本卡可改），账面不可区分这一点已在 6.4 的 P3 处置里以 findings 形式承接。

**P2-4 · `relay-core/package.json` 越出冻结允许路径 —— CLOSED**

- `brief.md:36` 已补入该路径，并逐字标注「**失序补录**，见 F-007」；权限限定为「仅把新增定向测试登记进既有 `scripts.test` 全量入口」。
- `findings.md` F-007 同步登记为 P2/closed，处置里明写「不伪装成正常先修 brief」。符合 AGENTS.md 宪章 #1 对失序的处理要求：可以补录，但必须留痕不得掩饰。

### 6.3 P3-5

**P3-5 · pause 落账失败降级为纯文本 Attention —— CLOSED**

- `workflow-driver.mjs:264-275`：`appendFallbackPause` 的抛错与 negative ack 都被打上 `fallbackPauseWriteFailed` 标记后抛出；`:304` 的通用 catch 首行 `if (error?.fallbackPauseWriteFailed) throw error;` 让它穿透，不再退化成 `human_input_requested`。
- 新增 `test/identity-quota.test.mjs:173-194` 用 Proxy 让 `appendFallbackPause` 必抛，断言 `driver.done.ok === false` 且携带原始错误、`attempt_failed=0`、`fallback_pause_created=0`、**`human_input_requested=0`**。与 design/11:64「不得用自由文本或仅有页面文案替代」对齐。
- 取舍记录（可接受）：整届 driver 因此 `done.ok=false` 且节点停在 `running`，靠宿主对 driver 错误的上报暴露。考虑到能走到这一步意味着 Store mutation 本身已不可信，fail-closed 优于制造一条名不副实的 Attention；`findings.md` F-009 已登记该口径。

### 6.4 未在本次复验范围内的原 P3（状态如实登记）

| 原编号 | 现状 | 依据 |
|---|---|---|
| P3-1 恢复读 Receipt 无防御 | **open · accepted** —— 已作为 F-010 明文接受：Receipt 是 Attempt 身份权威，不可读即按坏账纪律整届 fail-closed，不回退 event.detail 猜身份 | `findings.md` F-010 |
| P3-2 同一 Receipt 读两次 | **open（nit）** —— 代码未动，`workflow-driver.mjs:158` 与 `:426` 仍各读一次；纯 I/O 冗余，不影响正确性 | 本轮重读 diff |
| P3-3 quota 判定不落账 | **open** —— 已登记 F-008 并明确移交 DHR_35，不在 D3 内扩合同 | `findings.md` F-008 |
| P3-4 `selectQualifiedFallback` 空 catch | **open（nit）** —— `fallback.mjs:21` 未动；行为仍 fail-closed 且不泄露凭据 | 本轮重读 diff |
| P3-6 E-008 全量证据成色 | **open** —— 按票据要求本轮未重跑全量，E-008 维持原值；建议收口前按第 1 轮建议重取一次稳定全绿或注明该用例并发抖动 | 票据约束 |

### 6.5 复验小结

原 1 项 P1、4 项 P2、以及点名的 P3-5 全部 closed，且每一条都有对应的 driver 级反例钉住，不是靠口径说明闭合。其余 P3 均为 nit 或已按 findings 明文 open/accepted 承接，不构成阻塞。生产面改动仍严格落在允许路径内（package.json 已完成失序补录），禁改边界零 diff。本轮同样只读，未改任何生产代码、测试与计划状态。

CODE1_RULING: APPROVED
open P0: 0
open P1: 0
