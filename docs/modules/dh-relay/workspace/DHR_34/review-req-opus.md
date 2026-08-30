<!-- dh:v1 -->
# DHR_34 · 需求方向复核（独立 · fresh）

## 0. 启动形态（矛盾即标待证）

| 来源 | 自报 |
|---|---|
| SessionStart hook | `claude-fable-5[1m]` |
| 本实例系统提示 | `Opus 5` / model id `claude-opus-5` |
| 派发意图（brief/task_plan:28） | Opus 独立实例 |

两条自报来源互相矛盾，与 `findings.md` F-005、DHR_33 候选-40 同一现象。**本轮形态记为「待证」，不得登记为「已核验 Opus」。** 本轮为 fresh 只读需求方向路径：未改任何代码、测试、计划状态或既有工件，唯一写入为本文件。

## 1. 复核范围与纪律

- 输入：`AGENTS.md`；`workspace/DHR_34/` 全套（brief / task_plan / progress / findings / review / review-code1-opus）；`design/11` 起因段 + D3 + P6-IQ-A2/A4；`design/02` B4/B5；`design/06` §11 H12；`dev_plan/P6…` §2.3、§3.1、§3.2 DHR_34。
- 被审对象：当前工作树全部 diff 与 untracked（`workflow-driver.mjs`、`package.json`、新建 `executors/identity/fallback.mjs`、`executors/quota/classifier.mjs`、`test/identity-quota.test.mjs`、workspace 工件）。
- 纪律：只判「是否逐条满足已冻结需求」，不判代码风格；不重复代码轮 1 已闭合项；不派活、不问用户、不改任何被审文件。

## 2. 本轮自取证据（只读）

| ID | 命令 / 位置 | 观察 |
|---|---|---|
| Q-E01 | `git status --short`、`git diff --stat` | 7 改 + 4 新增；`contracts/**`、`store/**`、`rpc/**`、`profiles/**`、`runtime/service.mjs` 零 diff，禁改边界成立 |
| Q-E02 | `grep -rn "startWorkflowDriver" --include=*.mjs relay-core/ \| grep -v /test/` | 生产唯一构造点 `runtime/service.mjs:284-288`，**不传 `herdrJudge`** |
| Q-E03 | `grep -rn "quota_signal" relay-core/` | 全仓仅 `workflow-driver.mjs:250` 读取处与 `test/identity-quota.test.mjs` 注入处，**零生产产出方** |
| Q-E04 | `grep -rn "quota_detector_id" relay-core/` | schema 允许（`profiles/executor-profile.schema.json:69`）；`profiles/fixtures/golden-registry.json` **零条登记**；唯一出现是凭据负例 fixture |
| Q-E05 | `relay-core/profiles/fixtures/golden-registry.json:4-24` | 唯一 fallback 对 `herdr.codex.main → herdr.codex.ninth`，而 `ninth` **无 `config_fingerprint_rule`** |
| Q-E06 | `workspace/DHR_32/findings.md` F-5、`DHR_32/review-code1-opus.md:118-119` | 「quota 正反样本 0 条入册」仍 open；全仓唯一真实脱敏样本是 `claude-grok` 的 **HTTP 502** 短语模式 |
| Q-E07 | `store/store.mjs:412-438,477-513`、`store/state.mjs:4,10` | canonical pause 由 Store 独立复算三个派生 ID 并校验保序子序列；`fallback_pause_created → waiting_human → needs_you` 投影成立 |

未执行任何写操作、未跑测试（代码轮 1 已取 E-006~E-013 同族证据；本轮不重复占用）。

## 3. 逐条对照冻结需求

### 3.1 完成条件 1（P6-IQ-A2 + design/02 B5 · P6-M4）

| 子命题 | 判定 | 依据 |
|---|---|---|
| 普通 / 权限 / 网络 / 不可分类错误不切 | **满足** | `quota/classifier.mjs:9`（未登记 detector → `unknown`）、`:10-13`（signal 非结构化 → `unknown`）、`:17`（码不符 → `not_quota`）；driver `workflow-driver.mjs:252` 仅 `quota_confirmed` 进入切换分支，`:249` 仅 `outcome==='failed'` 才分类 |
| 高置信才切 | **满足（形式）**，可达性见 P1-1 | `classifier.mjs:14-16` 要求 `429` 与 `usage_limit_reached` 双证据同时成立 |
| 无合法 fallback 不自动切换 | **满足** | `workflow-driver.mjs:268-281` 走 canonical pause 后 `return`，路径上无 `recordResult` |
| `registry unavailable` 与 `fallback unavailable` 两个独立负例 | **不满足** | 见 P2-1 |
| 结论按 DevPlan 记 `passed / constrained` | **不满足** | 见 P1-2 |

### 3.2 完成条件 2（P6-IQ-A4 + design/02 B4 · P6-M2/M7 控制客户端不改身份链）

- **满足，且实为增强**：`workflow-driver.mjs:425-426` 恢复时以已签 Receipt 的 `executor_identity.executor_profile_id` 为权威，并据此改写 handle 的 `executor_profile_id`（`:433`），控制面写的 event detail 不再能改写执行身份；`:429` 使 fallback 身份恢复后不重获自动切换权（对应 F-006）。
- 本卡对 Herdr adapter、RPC、read model、`profiles/**` 零 diff（Q-E01），A4 指定的自动证据（既有 adapter / agent-node 回归）成立。
- 证据成色缺口见 P3-1（task_plan 步骤 4 承诺的回归补充实际未发生）、P3-3（旧式 Receipt 的回落来源）。

### 3.3 完成条件 3（design/06 H12 · fallback 必须 fresh Attempt、不续用旧身份链）

- **满足**：`workflow-driver.mjs:261-265` 递归开新 Attempt，`openAttempt:95-118` 生成新 `attempt_id`/`receipt_id`/新身份快照；`:260` 在开新 Attempt 前先把旧 Attempt 落终态，旧链的迟到写由 Store 的 `E_IDENTITY_MISMATCH` / `late_result_quarantined` / `E_ATTEMPT_FENCED` 隔离（`test/identity-quota.test.mjs:144-152` 已钉）。
- H12 后半句「重新经过相同质量链」成立：fallback 是同一 node 的新 Attempt，下游 verify/gate 依赖关系不变。
- 例外路径见 P1-3（选中合格候选后仍可能既不开 Attempt 也不 pause）。

### 3.4 首个合格 snapshot / fresh 与旧写隔离 / 无 fallback canonical pause

- 选择规则严格「按 Receipt 快照原序取首个合格项」：`identity/fallback.mjs:15-23`，不排序、不重算、不查当前 registry 扩集；合格四要素（条目在、平台匹配、有投影规则、四字段全等）齐备（`:17-20`）。
- canonical pause 三个派生 ID 的协议前缀与拼接顺序与 `design/11:54,56,57` 逐字一致（`fallback.mjs:32,36,41`），并被 Store 独立复算（Q-E07），漂移可被硬拒；`manual_retry_profiles` 只从冻结快照原序派生（`fallback.mjs:44`）。
- pause 写失败一律 fail-closed、不落终态 Result、不造自由文本 Attention（`workflow-driver.mjs:269-280,304`），闭合 F-009；但同类降级在另一分支复现，见 P1-3 第二段。

### 3.5 二次 quota 等待人工

- 机制成立（`workflow-driver.mjs:253,263` 的与门），但**语义未在冻结需求内**，且账面理由与事实不符，见 P2-2。

### 3.6 真实 quota 样本不可证边界

- 方向正确的部分：分类器只吃上游已脱敏结构化信号，明确拒绝 raw terminal 文本（`classifier.mjs:6,10-13`），未伪造样本文本，未读取凭据；变更路径凭据形态零命中（E-010）。
- 越界的部分：detector **规则本身**（`429 + usage_limit_reached`）没有任何入册样本支撑，且新增了一条与全仓唯一真实样本相矛盾的 `claude-usage-limit/v1`，见 P1-2。

## 4. 结论清单

### P0（0 项）

无。禁改边界、凭据红线、fresh Attempt 身份链、canonical pause 合同均未被突破。

### P1（3 项）

**P1-1 · D3 编排在真实链路上零可达，而工件按「已达成」呈现**

- 位置：`relay-core/runtime/workflow-driver.mjs:246-251`；`relay-core/runtime/service.mjs:284-288`；`relay-core/profiles/fixtures/golden-registry.json:4-24`。
- 三条互相独立的断链，任一条成立即整个 D3 分支在真实运行中不可达：
  1. quota 分类的入口条件是 `captured.verdict`，而 `verdict` 只由 `herdrJudge` 产生（`executors/herdr/herdr-executor.mjs:82`）；生产唯一 driver 构造点 `service.mjs:284-288` **不传 judge**（Q-E02），真实 Herdr 节点 `done` 后 `verdict` 恒 `null`，走 `:287-292` 的静默超时 Attention，永不进入分类。
  2. 分类输入 `structured.quota_signal` 全仓**没有任何生产产出方**（Q-E03），只有本卡测试注入。
  3. 即便前两条补齐：`golden-registry.json` 五条 profile **零 `quota_detector_id`**（Q-E04）→ `classifyQuota` 恒 `unknown`；且唯一登记的 fallback 对 `main → ninth` 中 `ninth` 无 `config_fingerprint_rule`（Q-E05），`workflow-driver.mjs:147-148` 的前置门会让 **source Attempt 都开不出来**。
- 为什么算需求问题：完成条件 1/3 的机器证目前只在「自建 registry + 注入 judge」的定向夹具里成立，真实注册表 + 真实运行路径上一次都不成立。`review.md:44-45,51-53` 把它记为「machine 通过 / 候选通过」而未标注该边界，进 P6 阶段闸时会被读成「自动切号已可用」。
- 这不等于本卡越界补 judge（那属 DHR_35 真实闭环），但**边界必须显式登记**。
- 清洁条件：①`findings.md` 新增一条（P1，open · 移交 DHR_35）明记「D3 输入契约 = judge 产出 `structured.quota_signal`，本仓零生产实现；golden registry 零 detector 登记、唯一 fallback 对因缺投影规则不可用」；②`review.md` 完成条件 1/3 的达成栏注明「仅在定向夹具成立，真实链路未接通」。

**P1-2 · P6-M4 未按 DevPlan 记 `constrained`，且 detector 规则无任何入册样本来源**

- 位置：`relay-core/runtime/executors/quota/classifier.mjs:1-4`；`workspace/DHR_34/findings.md` F-002；`review.md:44,51`；`dev_plan/P6…` §3.1 DHR_34 备注 + §3.2 实施提示。
- 事实链：DHR_32 F-5「quota 正反样本 **0 条入册**」至今 open；全仓唯一一份真实脱敏样本是 `claude-grok` 的 **HTTP 502** 短语模式（Q-E06），按本卡规则会被判 `not_quota`。而 `classifier.mjs:1-4` 硬编码了两条 detector，规则统一为 `429 + usage_limit_reached`——其中 `claude-usage-limit/v1` **没有任何样本依据**，是对真实产品行为的未证断言。
- 风险方向恰是 P6-M4 要防的那一侧：若某产品的 `429` 实为短时限流而非额度耗尽，双证据会同时成立并触发**误判切号**；fail-closed 的护栏在这一点上不生效。
- DevPlan 已预留 `P6-M4 可 passed / constrained`，但 `review.md` 通篇只有「machine 通过 / 候选通过」，无 `constrained` 字样，F-002 的处置也把规则写得像已验证口径。
- 清洁条件：①F-002 补一句「detector 规则（状态码 + 错误码）未经任何入册样本证实」；②`review.md` 的完成条件表与 AI 提交区显式写 **P6-M4 = constrained**，受限原因三条（0 条入册样本、规则未证、真实链路未接通）；③`claude-usage-limit/v1` 二选一：删除，或在 findings 明标「未证实占位，DHR_35 前不得用于真实账号切换」。

**P1-3 · 选中合格 fallback 后仍可能既不开 fresh Attempt 也不 pause（静默落空 / 自由文本 Attention）**

- 位置：`relay-core/runtime/workflow-driver.mjs:259-265` → 递归内 `:145-149`；异常变体 `:110-113` → `:303-311`。
- 主路径：`selectQualifiedFallback` 只判候选**自身**是否合格，不判候选**能否开出 Attempt**。递归进入 `driveHerdrNode` 后，`:147-148` 用候选自己的 fallback 链再做一次前置门：任一「孙 fallback」缺 `config_fingerprint_rule` 即 `return`。此时 `:260` 已把 source 落成 failed 终态 → 节点停在 `failed`，**无 fresh Attempt、无 pause、无 Attention、无任何解释**。直接违反完成条件 1/3 与 `design/11` D2「高置信 quota + 无合法 fallback → pause」的二选一闭集。
- 变体：孙 fallback 有规则但配置不可解析时，`openAttempt:113` 的 `freezeProfileIdentity` 抛错，穿到 `:303-311` 的通用 catch，对**已终态的旧 attempt** 写自由文本 `human_input_requested`——正是 `design/11:95-96` 与 F-009 明令禁止、代码轮 1 刚在 pause 分支闭合的形态，在 fallback 开立分支上原样复现。
- 触发所需的 registry 完全 schema 合法，且 `golden-registry.json` 已经存在「有 fallback 引用但被引用方无投影规则」的真实形状（Q-E05）。
- 清洁条件：把「候选自身能开出 Attempt」纳入合格判据（或让递归失败回落 canonical pause 而非 `return` / 通用 catch），并补一条 driver 级反例：合格候选 + 其孙 fallback 缺规则 → 断言 `fallback_pause_created=1` 且 `human_input_requested=0`。

### P2（3 项）

**P2-1 · `registry unavailable` 与 `fallback unavailable` 在最常见形态下并不独立**

- 位置：`relay-core/runtime/executors/herdr/profile-registry.mjs:19`；`runtime/executors/identity/fallback.mjs:14`；`test/identity-quota.test.mjs:231-247`。
- `loadExecutorProfiles` 把注册表文件缺失（ENOENT）归一成 `{ok:true, registry:{profiles:[]}}`；`selectQualifiedFallback:14` 判 `registry?.profiles` 为真 → 走完空循环 → 返回 **`fallback_unavailable`**。也就是说「注册表不见了」这一最常见的不可用形态，被记成「没有 fallback」——`design/11:72` 要求二者是两个独立负例，`§5` 反例也点名不得混淆。
- 现有 driver 级用例名为「distinct fail-closed pause path」，但其断言（`:244-246`）与 `fallback_unavailable` 用例（`:167-170`）完全同形，未证明任何可区分事实；两条路径在账上同为 `E_FALLBACK_UNAVAILABLE`。
- 缓解事实：两条路径都不自动切换，安全方向一致；因此定级 P2 而非 P1。
- 清洁条件：ENOENT 归 `registry_unavailable`（或在 findings 明记「归并为 fallback_unavailable 是有意裁决及其理由」），并让该用例断言真正可区分的事实，否则改名以免充当假证据。

**P2-2 · 一跳上限使 pause 的 `reason_code` 与事实不符，且该语义不在冻结需求内**

- 位置：`relay-core/runtime/workflow-driver.mjs:253,263`；`runtime/executors/identity/fallback.mjs:27`；`progress.md:31,33`。
- `design/11` D3 只冻结「高置信 + 合格预登记条目才可开新 Attempt」，**未冻结跳数上限**；一跳上限是本卡代码轮 1 整改时形成的实现裁决。方向偏保守、可接受，但后果是：第二次高置信 quota 时即便 `manual_retry_profiles` 里躺着合格候选，账上仍写 `E_FALLBACK_UNAVAILABLE`——「确实没有候选」与「有候选但策略上限」在耐久账上不可区分，与 F-008 的可审计缺口叠加。
- 清洁条件：登记为需求级产品语义裁决（findings 或 backlog），并进人验区由用户确认「第二次额度耗尽应停等人工」；`reason_code` 的语义扩展属 `contracts/**`，本卡不得改，只能登记移交。

**P2-3 · 人验区错配：机器已证项占位，真正需要人裁的三条缺席**

- 位置：`review.md:55-61`；对照 `design/11:84`、`dev_plan/P6…` §3.1 DHR_34 备注 / §3.2 实施提示。
- `design/11:84` 说「人类验收栏为空」是就**该协议调整**而言（只冻结机器可证语义）；但 DHR_34 作为任务卡，恰恰有三件只能由用户裁决的事：①P6-M4 判 `passed` 还是 `constrained`；②二次 quota 停等人工（P2-2）这一未冻结的产品语义；③无样本 detector 的受限接受（P1-2）。
- 现唯一人验项「查看脱敏正反样本与 Attention 展示 / 认可不自动切号」是机器已证内容，签它并不能覆盖上面三条。
- 结论（回答「人验是否应为空」）：**不应为空，但应换人**——把现有单项替换/扩充为上述三条裁决项。宪章#4 仍适用：未经用户对话明确确认不得代勾。

### P3（5 项 · 登记即可，不阻塞）

- **P3-1 · 完成条件 2 的证据成色**：`task_plan.md` 步骤 4 承诺「补 DHR_33 语义回归」，实际 `test/herdr-adapter.test.mjs`、`test/agent-node.test.mjs` 零 diff（Q-E01）；E-007 把它们的通过列为本卡证据，但它们证明的是「没打破」，A4 的**新**证据实为 `test/identity-quota.test.mjs:249-278` 的恢复用例。建议收口前把证据归属写准。
- **P3-2 · driver 级负例只覆盖 permission**：network / 普通失败 / **未登记 detector** 只有单元级断言（`classifier.mjs:9,17`）。而真实注册表恰恰是「零 detector」形态（Q-E04），这条最该有 driver 级反例反而没有。
- **P3-3 · 旧式 Receipt 恢复回落来源**：`workflow-driver.mjs:426` 的 `?? fields.profile` 取自 `host_observation_changed` 的 detail 自由文本，与 `design/11:94` 反例相邻。兼容取舍可接受（旧式 Receipt 本就无身份快照），但 F-006 的处置只写「既有账上 profile」，未点明来源是事件 detail，建议补明。
- **P3-4 · E-008 成色**：代码轮 1（P3-6）未复现 244/244，定性为 `service.test.mjs` 高并发抖动。完成条件三条都挂着 E-008，建议收口前重取一次稳定全绿或就地注明已知抖动。
- **P3-5 · F-008 与 P1-1 应互引**：分类理由不可审计（F-008）与真实链路未接通（P1-1）同属移交 DHR_35 的可观测性债，建议在 findings 里互相指认，避免下游只捡到其中一条。

## 5. 已核对且 clean 的需求项

| # | 需求项 | 依据 |
|---|---|---|
| R-1 | 普通 / 权限 / 网络 / unknown 一律不切 | `classifier.mjs:9,10-13,17`；driver `:249,252` 双重与门 |
| R-2 | raw terminal 文本不参与判定 | `classifier.mjs:6,10-13`；driver 只读 `structured.quota_signal`，不解析终端输出 |
| R-3 | 首个合格 snapshot、按 Receipt 原序 | `fallback.mjs:15-23`，不排序、不重算、不扩集 |
| R-4 | 合格四要素齐备 | `fallback.mjs:17`（条目 + 平台 + 投影规则）、`:19-20`（四字段全等）；registry 已过 `validateProfiles` |
| R-5 | fresh Attempt 不复用旧 id / 旧快照 | `openAttempt:95-118`；`test:135-141` |
| R-6 | 旧 Attempt 迟到写被隔离 | `test:144-152`（`E_IDENTITY_MISMATCH` / `late_result_quarantined`）；pause 路径由 Store fence 承担 |
| R-7 | 无 fallback 走既有 `waiting_human/needs_you`，不新增 `paused` | `store/state.mjs:10,4`；`test:170` |
| R-8 | canonical pause 三对象原子、ID 可复算 | `fallback.mjs:26-46` 与 `store.mjs:412-438` 独立复算一致 |
| R-9 | `manual_retry_profiles` 只从冻结快照派生 | `fallback.mjs:44`；`store.mjs:429-438` 保序子序列校验 |
| R-10 | pause 落账失败不降级为自由文本 | `workflow-driver.mjs:269-280,304`；`test:173-194` |
| R-11 | 暂停节点不会被 resume 自动重开 | 可重驱状态集仅 `pending/failed/orphaned`（`:451-452`） |
| R-12 | 控制客户端不改身份链，恢复以 Receipt 为权威 | `:425-426,433`；`:429` 不重获自动切换权 |
| R-13 | 禁改边界与凭据红线 | Q-E01；异常信息只含 pointer 名与 profile id；`fallback.mjs:21` 的 catch 不打印 |
| R-14 | 不做自由账号切换 / 自动登录 / 写用户注册表 | 全链只读 registry，写入仅限 Store 合同 |
| R-15 | `package.json` 仅登记测试入口，且已按 F-007 标失序补录 | diff 仅 `scripts.test` 一行 |

## 6. 证据缺口清单（收口前应补齐）

1. 真实链路可达性的显式登记（P1-1）——现无任何工件说明 D3 在生产中不可达。
2. detector 规则的来源说明与 `constrained` 结论（P1-2）——现无「规则未证」的字样。
3. 合格候选 + 孙 fallback 缺规则的 driver 级反例（P1-3）。
4. 可区分 `registry_unavailable` / `fallback_unavailable` 的断言（P2-1）。
5. 未登记 detector 的 driver 级负例（P3-2）。
6. 稳定的全量回归终态或已知抖动注记（P3-4）。

## 7. Clean 条件（本路径转 APPROVED 的充要清单）

- P1-1：findings 新增可达性边界条目 + review 完成条件 1/3 注明「仅定向夹具成立」。
- P1-2：F-002 补「规则未经入册样本证实」；review 显式记 **P6-M4 = constrained** 及三条受限原因；`claude-usage-limit/v1` 删除或明标未证实占位。
- P1-3：合格判据纳入「候选可开 Attempt」或递归失败回落 canonical pause，并补 driver 级反例（`fallback_pause_created=1` 且 `human_input_requested=0`）。
- P2-1 / P2-2 / P2-3：按各条清洁条件登记或修正；P2-3 须在人验区换成三条真正需要用户裁决的项。
- P3 五条：登记 findings / backlog 即可，不阻塞。

---

REQ_RULING: **CHANGES_REQUIRED**

- open P0：0
- open P1：3（P1-1 真实链路零可达未披露；P1-2 P6-M4 未记 constrained 且 detector 规则无样本来源；P1-3 合格 fallback 后静默落空 / 自由文本 Attention）
- open P2：3 · open P3：5
- 人验区裁决：**不应为空**，但现有单项应替换为「P6-M4 passed/constrained 裁决」「二次 quota 停等人工的产品语义」「无样本 detector 的受限接受」三条。

（以上为初审结论，保留原样；整改后的复验见第 8 节，最终裁决以文末为准。）

## 8. 复验（同一 reviewer · 只读 · 范围限于原清洁条件）

形态同 §0（SessionStart `claude-fable-5[1m]` vs 系统提示 `Opus 5`，仍为**待证**）。本节只读复核第二批整改增量，未改任何代码、测试、计划状态或既有工件；未跑测试（Review Batch pane 静止期由施工侧取 E-017，重复占用会重演 F-016 的并发抖动）。

### 8.0 复验取证

| ID | 位置 / 命令 | 观察 |
|---|---|---|
| RQ2-E01 | `git status --short`、`git diff --stat` | 新增 `as-built/relay-core.md`、`lesson_candidates.md` 与四份 review 工件；`contracts/**`、`store/**`、`rpc/**`、`profiles/**`、`runtime/service.mjs` 仍零 diff |
| RQ2-E02 | `grep -rn "usage-limit\|quotaDetectors" relay-core/` | 生产代码零产品 detector 名；`workflow-driver.mjs:36` 默认 `quotaDetectors = {}`，`service.mjs` 不注入 → 生产恒 `unknown` |
| RQ2-E03 | `runtime/executors/quota/classifier.mjs:2-6` | 内置表已删除，改 `hasOwnProperty` 查调用方注入表；未注入即 `unknown` |
| RQ2-E04 | `runtime/executors/identity/fallback.mjs:21-28` | 选号阶段预冻结候选自身的有序 nested snapshots，任一不可签即 `signable=false` 并跳过该候选 |
| RQ2-E05 | `workflow-driver.mjs:149,169-171,258-262` | `fallbackProfileSnapshots` 贯通：递归跳过重复前置门、`openAttempt` 直接复用已冻结快照，不二次 freeze |
| RQ2-E06 | `test/identity-quota.test.mjs` 共 12 个用例；`progress.md` E-016/E-017 | 12/12；quiet 全量 249/249 exit 0 |
| RQ2-E07 | 计数复算：E-008 `244`（当时本文件 7 例）+ E-012 `+3` + E-016 `+2` = **249** | E-017 的 249 与增量账自洽，非估数 |

### 8.1 P1-1（生产不可达 → constrained + 移交 DHR_35）—— **闭合**

- `findings.md` F-011（P1 · transferred）逐条写明三断链：service 未注入 judge、零生产 `quota_signal` 产出方、golden registry 零 detector 登记；处置明文「不宣称真实自动换号可用」，承接卡为 DHR_35。
- `review.md` 完成条件 1 记「定向夹具通过；生产链路未接通，`constrained`」，完成条件 3 记「真实执行闭环归 DHR_35」，需求对齐表 P6-M4 行写 **constrained** 并列出未完成项。
- `as-built/relay-core.md:184,204` 同步：「生产 judge、真实 detector 与样本仍由 DHR_35 接线」「该 seam 的机器证来自受控注入，不能解读为真实账号自动换号已可达」——快照层不再有「已可用」的读法。
- 代码侧的姿态也一致：`quotaDetectors` 默认空表（RQ2-E02），生产路径 fail-closed 到 `unknown`，不靠文档口头约束。

### 8.2 P1-2（删除无样本产品 detector → 显式注入 + constrained）—— **闭合**

- `classifier.mjs` 内置 `codex-usage-limit/v1` / `claude-usage-limit/v1` 已删除（RQ2-E03）；全仓不再有任何产品名 detector（RQ2-E02），测试改用 `synthetic-usage-limit/v1`（`test:16-19`），不再把未证规则挂在真实产品名下。
- F-002 由 `open` 改 `constrained`，并补上关键一句「状态码+错误码规则未经入册样本证实」，与 DHR_32 F-5「0 条入册」不再打架。
- 判别力同步补强：`test:46-47` 新增 `429+rate_limited`、`503+usage_limit_reached` 两条交叉负例，双证据合取规则被真正咬住（此前只有码/态同时不符的负例，单侧不符无覆盖）。
- 人验区第 3 项「无真实样本时的 detector 策略」承接受限接受的裁决权，未代签。

### 8.3 P1-3（嵌套 fallback 不可签 → 回落 canonical pause）—— **闭合**

- 合格判据已扩到「候选自身能完整签发」：`fallback.mjs:21-28` 在返回 `selected` 前预冻结候选的 nested snapshots，任一缺 `config_fingerprint_rule` 或冻结抛错即跳过该候选、继续下一个快照，全数不合格才 `fallback_unavailable` → canonical pause。
- 递归侧同步：`workflow-driver.mjs:149` 在传入 `fallbackProfileSnapshots` 时跳过原前置门，`openAttempt:110-119` 直接复用已冻结快照——既消掉了原静默 `return` 的入口，也没有引入二次 freeze 的 TOCTOU。
- driver 级反例 `test:249-267` 断言 `attempt_started=1`、`attempt_failed=0`、`fallback_pause_created=1`、`human_input_requested=0`，比初审要求的清洁条件更严（连 source 终态都不落）。判别力核对：若撤掉 nested 预冻结，控制流会回到「先落 source failed → 递归被前置门挡下」，该用例的前两条断言即变红——不是「新增即绿」的空用例。
- 原「自由文本 Attention 变体」随之消失：递归内 `openAttempt` 不再重算身份/快照，唯一残留抛点是 Store 侧 `E_REQUEST_CONFLICT`（新 UUID receipt，实际不可达），见 8.6 残留-1。

### 8.4 P2 三条

| 条 | 判定 | 依据 |
|---|---|---|
| P2-1 registry/fallback 负例不独立 | **按备选方案闭合** | F-015（P3 · accepted）明记「loader 把文件缺失归一为空 registry，故内部路径归 fallback unavailable」，并声明本卡不改既有 loader（`runtime/executors/herdr/**` 本就不在允许路径）；两条路径安全结果同为 canonical pause。残留见 8.6 残留-2 |
| P2-2 一跳上限与 reason 不可区分 | **闭合（登记 + 人验）** | F-013（P2 · transferred）明写「二次 quota 即使有候选也停等人工，当前 reason 与『无候选』不可区分；空 `manual_retry_profiles` 也无协议内出口」，reason 扩展与产品语义移交 DHR_35；人验第 2 项承接该语义 |
| P2-3 人验区错配 | **闭合** | `review.md:59-63` 三项与初审建议逐条对应（受限结论 / 二次 quota 语义 / 无样本 detector 策略），旧的机器已证占位项已移除；三项均未勾选，宪章#4 未被绕过 |

### 8.5 初审 P3 的处置

- P3-2（未登记 detector 无 driver 级负例）→ **闭合**：`test:231-247` 补齐，真实注册表最常见的「零 detector」形态现在有端到端反例。
- P3-4（E-008 成色）→ **闭合**：E-017 quiet 全量 249/249 exit 0，计数与增量账自洽（RQ2-E07）；E-018 另取 audit/selftest/fixture/capability 与 `git diff --check`。并发抖动本身升为 F-016 并明记「并发尝试不计绿色证据」。
- P3-1（完成条件 2 的证据归属）→ 仍开：完成条件 2 依旧只挂 E-007~E-010，未点明 A4 的**新**证据其实是恢复用例；且该用例这轮已被加强（`test:323` 故意让 event detail 写 source、Receipt 写 backup，Receipt 权威断言才有判别力），反而更值得被点名引用。
- P3-3（旧式 Receipt 回落 `fields.profile`）、P3-5（F-008 与 F-011 未互引）→ 仍开，均为登记类，不阻塞。

### 8.6 本轮新增残留（均不阻塞）

- **残留-1（P3）**：递归 `openAttempt` 的 Store ack 冲突仍会穿到外层通用 catch，对已终态旧 Attempt 写自由文本 `human_input_requested`。触发需新 UUID receipt 撞车，实际不可达；与 F-009 同族，建议并入其记录而非再开条目。
- **残留-2（P3）**：`test:289` 用例名仍称 `distinct fail-closed pause path`，而 F-015 的处置写的是「测试名只主张 fail-closed，不把内部状态当可观察差异」——名与处置差半句。改名或在 F-015 说明保留理由皆可。
- **残留-3（P3 · 跨路径）**：允许路径第二次扩张（`as-built/relay-core.md`）已按一致性路径 P2-3 的方案 a 补进 brief，但**没有**按其明文条件「同 F-007 的补录方式留痕」新增失序补录条目。归一致性路径复验闭合，**不计入本路径 open P1**。
- **残留-4（P3）**：证据引用与节点状态略滞后——完成条件表仍止于 E-016，未引最强的 E-017/E-018；`progress.md` 「当前节点」仍写「等待……quiet 全量」，而 E-017 已取到；E-017 的「取代 E-016 所述并发未终态尝试」实际指向的是同日 bullet 而非 E-016 行。
- **残留-5（P3 · 收口待办）**：F-011 / F-013 / F-014 三条 `transferred` 目前只停在本卡工件；DevPlan §3.2 DHR_35 未登记这三条承接。移交要成立需主控在收口时回填（本卡与本路径均无权改 DevPlan）。
- **残留-6（P3）**：`progress.md` 早期 bullet「2026-08-30 设计裁决」仍把 `429 + usage_limit_reached` 写成 D3 的既定规则；该规则现已只存在于测试的 synthetic detector 中，建议加一句「该组合为受控合成样本，非已入册产品规则」，避免与 F-002 的新口径对读时产生歧义。

### 8.7 复验小结

三条 P1 全部按初审清洁条件闭合，且闭合方式都落在**代码或断言**上，不是只改文案：detector 内置表真删、嵌套快照真预冻结、反例真有判别力。两条 P2 以「登记 + 移交 + 人验」闭合（P2-1 走的是初审已认可的备选方案），P2-3 的人验三项逐条对上。需求侧现在的呈现是诚实的：完成条件 1/3 明写「定向夹具通过、生产链路未接通」，P6-M4 明写 `constrained`，as-built 明写「不能解读为真实账号自动换号已可达」——不再存在「读成端到端可用」的入口。

余下六条残留全为登记 / 引用 / 命名类，无一触及身份链、quota 判定或 pause 合同的实现语义，不阻塞本路径转 APPROVED。人验区仍为三条未勾选项，收口前须由用户在对话中明确裁决，AI 不得代签（宪章#4）。

---

RECHECK_RULING: **APPROVED**

- open P0：0
- open P1：0（初审 P1-1 / P1-2 / P1-3 全部闭合）
- open P2：0（P2-1 备选方案闭合、P2-2 登记+人验闭合、P2-3 闭合）
- open P3：8（初审残留 P3-1 / P3-3 / P3-5 + 本轮残留-1~-4、-6；残留-3、-5 分属一致性路径与主控收口，不计本路径阻塞）
- 人验区：三项到位且均未勾选，符合初审裁决；收口仍以用户明文确认为准。
