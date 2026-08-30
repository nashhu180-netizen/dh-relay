<!-- dh:v1 -->
# DHR_34 · 代码复核轮 2（独立 · fresh · 与轮 1 不同实例）

## 0. 启动形态（三条来源并列，矛盾即标待证）

| 来源 | 记录 |
|---|---|
| 派发意图（票据） | 「DHR_34 heavy 配方的 fresh 独立代码复核轮 2 worker」，复核路径要求 Opus |
| SessionStart hook 自报 | `当前模型：claude-fable-5[1m]` |
| 实例可见的系统自报 | `You are powered by the model named Opus 5. The exact model ID is claude-opus-5.` |
| 启动屏显 | 实例内不可见，本轮无法自证；不代填 |

**结论：形态待证。** 与轮 1（`review-code1-opus.md` §0）及 `findings.md` F-005 是同一矛盾的第二次复现：系统自报指向 `claude-opus-5`，SessionStart hook 指向 `claude-fable-5[1m]`。按 F-005 既有口径，本轮**不得登记为「已核验 Opus」**。本文件的技术结论不依赖该形态判定；但「fresh 独立实例」这一点成立——本实例未见轮 1 的会话上下文，全部结论由本轮自行读码与取证得出。

## 1. 复核范围与纪律

- 范围：`master`(`dedfbfb`) → 当前工作树的全部 diff（`relay-core/runtime/workflow-driver.mjs`、`relay-core/package.json`、DHR_34 workspace 五份文档）+ 全部 untracked 生产/测试文件（`runtime/executors/identity/fallback.mjs`、`runtime/executors/quota/classifier.mjs`、`test/identity-quota.test.mjs`）。复核对象是**代码轮 1 整改后的最终字节**。
- 已读：仓根 `AGENTS.md`；`workspace/DHR_34/` 的 brief / task_plan / progress / findings / review / `review-code1-opus.md`；`design/11-P6身份与额度治理契约调整.md`（D1/D2/D3 与 P6-IQ-A2/A4）。为判定边界另读了 `store/store.mjs`、`profiles/identity.mjs`、`profiles/validate-profiles.mjs`、`profiles/executor-profile.schema.json`、`runtime/executors/herdr/profile-registry.mjs`。
- 纪律：只读复核。未派活、未问用户、未改任何生产代码 / 测试 / 计划状态；未重跑全量回归。唯一写入文件为本文件。变异只在系统临时目录的 disposable copy 中施加。

## 2. 本轮自取证据

### 2.1 变异取证（heavy 有效单测要求）

- disposable copy 根：`…\scratchpad\mut-032bf99c-9bb1-4bd1-ad04-8700e4399b60`（**全新 UUID 目录，直接 New-Item + robocopy 建立，全程未执行任何删除**）；`node_modules` 为指向 `D:\MyFiles\ai-workflow\dh-relay\node_modules` 的 junction，仅供依赖解析。

| ID | 动作 | 结果 |
|---|---|---|
| R2-M0 | copy 内未变异基线 `node --test test/identity-quota.test.mjs` | tests 10 / pass 10 / fail 0，exit 0，1884.9774 ms |
| R2-M1 | 变异 **`allowAutomaticFallback` pause 门**：`workflow-driver.mjs:253` 的 `if (allowAutomaticFallback) {` → `if (true) {`；文件 hash `F59C3E42…A366A` → `08BEC3C4…BB18EC` | **红**：tests 10 / pass 8 / **fail 2**，exit 1。红的两条正是钉住本卡核心不变式的用例：`fallback quota pauses for human choice and cannot chain to a third identity`、`recovery trusts the fallback Receipt and cannot regain automatic chaining` |
| R2-M1R | 单文件 robocopy 回写还原（不删除） | hash 复原为 `F59C3E42…A366A`；重跑 tests 10 / pass 10 / fail 0，exit 0 |

**判定**：一跳上限门与恢复权限门都是**被测试真实钉住**的，不是靠代码走查成立——去掉该门立刻有两条 driver 级用例转红，还原即绿。轮 1 §6.1/§6.2 对 P1-1、P2-2 的闭合结论在本轮得到独立的变异级确认。

（票据只要求至少一个有效 mutation；针对 quota 双证据的 M2/M3 变异命令在派发侧被拒未执行，相关缺口以**分析结论**形式记在 P2-3，并明确标注未经变异验证。）

### 2.2 shared worktree 未被触碰（before / after 全等）

| 文件 | before | after |
|---|---|---|
| `runtime/executors/quota/classifier.mjs` | `97DEF924…1F189` | `97DEF924…1F189` |
| `runtime/executors/identity/fallback.mjs` | `33B39B2D…6674C` | `33B39B2D…6674C` |
| `runtime/workflow-driver.mjs` | `F59C3E42…A366A` | `F59C3E42…A366A` |
| `test/identity-quota.test.mjs` | `63578E77…E4D2B` | `63578E77…E4D2B` |

四项逐一相等；`git status --short` 的生产面条目与复核开始时一致（本轮结束时新增的 `review-req-opus.md`、`review-lessons-opus.md` 属同一 Review Batch 的其他路径，非本实例写入）。

## 3. 结论清单

### P0（0 项）

无。

### P1（0 项）

无。下节 P2-1 曾被本轮按 P1 权衡过，停在 P2 的理由写在该条内。

### P2（3 项）

**P2-1 · 合格 fallback 已选出，却可能因「下一跳的配置」在开新 Attempt 前静默失败——此时 source 已是 terminal `failed`，既无第二个 Result 也无 Attention**

- 位置：`relay-core/runtime/workflow-driver.mjs:259-265`（先 `recordResult` 再递归）、`:145-150`（递归里的非 recovery 前置守卫，两处 `return` 均静默）、`:109-114`（`openAttempt` 冻结下一跳快照，`:112`/`:113` 均可抛）。
- 事实链：`selectQualifiedFallback` 判定 backup **合格**（`fallback.mjs:17-20`：registry 有条目、平台匹配、有 `config_fingerprint_rule`、四字段全等）后，driver 在 `:260` 先把 source 落成 terminal `failed`，**然后**才进入递归。递归内才第一次检查「backup 自己的 `fallback_profile_ids` 是否个个可冻结」：
  - `:147-148` — 其中任一条目缺 `config_fingerprint_rule` → 直接 `return`，零事件；
  - `:113` — 条目有 rule 但其配置文件不可读 / JSON 损坏 → `freezeProfileIdentity` 抛 `E_NONSECRET_PROJECTION_MISSING:config-file` 或 `E_NONSECRET_PROJECTION_INVALID:config-json`，穿到外层 `:303` 的 catch；该 catch 想补写的 `human_input_requested` 会被 `store.mjs:369-377` 的 LIFECYCLE 终态守卫以 `E_TERMINAL_STATE_CONFLICT` 拒掉（source 已终态），最终只剩 `:310` 的一行 `console.error`。
  两条路径的账面结果相同：**节点停在 source 的 `failed`，第二次 Attempt 一个事件都没有，用户看不到「为什么没切到 B」。**
- 可达性不是理论值：`config_fingerprint_rule` 在 `profiles/executor-profile.schema.json:58` 的 required 清单里**不存在**（可选字段）；`validate-profiles.mjs:110-117` 只拒绝悬空 fallback 与 detail 超限，`:125-127` 只对**存在**该 rule 的 profile 做 `existsSync`，**不解析**配置 JSON。也就是说「C 账号的 config.json 损坏，而 C 只是 B 的下游 fallback」这种普通误配，会让一次本该成功的 A→B 切换变成静默的整节点失败。
- 与冻结口径的关系：这条直接顶到完成条件 1 / `design/11` P6-IQ-A2（`design/11:79`）「高置信 quota + **合格** fallback 产生新的 Receipt 与 Attempt」——判定为合格却没有产生。它也复现了轮 1 P1-1 被否定的那种呈现（「停止自动切号」被呈现成任务失败），只是触发面窄得多。
- 为什么本轮停在 P2 而不是 P1：触发需要一份**合法但残缺**的 registry（下游 profile 缺 rule 或配置损坏），不是 A/B 双限额那种典型路径；方向仍是 fail-closed（绝不会切到未校验身份）；且轮 1 §6.2 已把其中 `config_fingerprint_rule` 变体作为残留公开记录并建议登记 backlog。本轮把**配置文件损坏**这一更易触发的变体和**顺序缺陷**补齐，建议按 P2 登记 findings 而非在本卡强改。
- 建议（低成本、不动禁改边界）：把「新 Attempt 是否真的可开」的前置判定提到 `:260` 的 `recordResult` **之前**——递归前先算一遍下一跳快照可冻结性，不可开就直接走 `:268` 的 `buildFallbackPause`；这样所有「选得出但开不了」的情形都收敛到 `waiting_human` + Attention，与轮 1 采纳的建议 A 同向。

**P2-2 · 二次 quota 的 pause 把人工可选集冻结成「backup 的下游 fallback」；A、B 双限额且 B 无下游时，`retry-with-profile` 没有任何合法参数，`waiting_human` 成死胡同**

- 位置：`relay-core/runtime/executors/identity/fallback.mjs:44`（`manual_retry_profiles` 原序取自**当前 Attempt Receipt** 的 `fallback_profile_snapshots`）；该 Receipt 由 `workflow-driver.mjs:109-114` 在开立 fallback Attempt 时按 **backup 自己的** `fallback_profile_ids` 冻结。
- 事实：轮 1 的整改把第二次高置信 quota 从 terminal failed 改成 canonical pause（正确），但 pause 落在 **fallback Attempt** 上，于是冻结的人工可选集是 B 的下游列表，**既不含 A 也不含 B**。若 B 没有配 `fallback_profile_ids`（`driverFixture` 的默认值就是 `[]`），`manual_retry_profiles` 为空数组：`design/11:62` 的 D2-5 要求 `retry-with-profile` 的 `executor_profile_id` 必须**存在于** `manual_retry_profiles`，空集意味着协议内没有任何合法重试参数，节点永久停在 `waiting_human`，只能靠新开 Run 绕过。
- 边界归属：`manual_retry_profiles` 的派生规则是 DHR_61 冻结的 D2 合同，`store.mjs:429-438` 还会强制它是当前 Receipt 快照的保序子序列——**DHR_34 无法在允许路径内加宽它**。所以这不是「改一行」的代码缺陷，而是轮 1 建议 A 落地后暴露出来的产品语义缺口：`design/11:8` 用户确认的是「停止自动切号并**等待人工**」，而这里的等待没有出口。
- 证据面：现有用例 `test/identity-quota.test.mjs:213-229` 特意用 `fallbackFallbackIds: ['herdr.codex.third']` 把可选集配成非空，**空可选集的分支没有任何用例**，账面上看不出这个死胡同。
- 建议：登记 findings（并入 F-002/F-008 相邻的 DHR_35 移交，或另开一条），由 DHR_35 / D2 调整决定二次 pause 的可选集口径（例如允许含 source 与当前 profile 自身）；本卡不改。可顺手补一条空可选集用例，只断言 pause 仍然成立、`manual_retry_profiles` 为空——把现状钉成可核查事实。

**P2-3 · quota「结构化双证据」这条核心闸门，没有被任何断言独立钉住（分析结论，未执行变异验证）**

- 位置：`relay-core/runtime/executors/quota/classifier.mjs:14`（`signal.http_status === detector.status && signal.error_code === detector.code`）；用例 `relay-core/test/identity-quota.test.mjs:33-46`。
- 事实：该用例的四类样本分别是 `429+usage_limit_reached`（confirmed）、`403+permission_denied` / `503+network_unavailable` / `500+internal_error`（not_quota）、未登记 detector（unknown）、`{message:…}` 无结构（unknown）。**每一条的期望值都能仅凭 `http_status` 判出，也能仅凭 `error_code` 判出**——缺的是两类交叉负例：`429 + 非配额 code`（如 `rate_limited`）与 `503 + usage_limit_reached`。因此把 `:14` 的与门砍成任意一半，这组断言都不会转红，「双证据」实际处于无护栏状态。
- 为什么要紧：`design/11` D3（`design/11:68,72`）与完成条件 1 的安全性完全建立在「必须两个证据同时成立才允许自动换号」上；`findings.md` F-002 也把它写成 constrained 状态下唯一的替代保障。这一条恰好是 heavy 配方「有效单测」最该覆盖的位置。
- 取证状态：本轮针对该点设计的 M2（去掉 `error_code` 合取）/ M3（去掉 `http_status` 合取）变异命令在派发侧被拒、**未执行**，故上述判定为**读码分析结论**，未经变异验证；建议整改时顺带用这两条变异自证。
- 建议：在 `test/identity-quota.test.mjs:33-46` 补两行断言（`{http_status:429, error_code:'rate_limited'}` → `not_quota`；`{http_status:503, error_code:'usage_limit_reached'}` → `not_quota`）。成本一行一条，直接把双证据钉死。

### P3（5 项）

**P3-1 · `quota_detector_id` 取自「当前 registry」而非冻结 Receipt**

`workflow-driver.mjs:250` 用 `registryProfile.quota_detector_id` 做分类，而 `registryProfile` 来自本次加载的 registry（`:139-143`），不是 Attempt Receipt 冻结的身份四件套。也就是说「这次失败算不算配额」的判据可以被运行中改 registry 改变。危害有限——`classifier.mjs:1-4` 是硬编码白名单，改 registry 最多在两个已登记 detector 之间选，未登记一律 `unknown` 不切号——但它与本卡「身份以已签 Receipt 为准」的整体取向不齐。建议记 findings，不必本卡改。

**P3-2 · `recordResult` 全程不看 Store 的 ack**

`workflow-driver.mjs:79-92` 丢弃 `appendResult` 的返回值。在本卡新增的 fallback 分支里，`:260` 的 source 终态是「先落终态、再开新 Attempt」的前提；若该写入被 Store 拒（`E_ATTEMPT_FENCED` / `late_result_quarantined`，见 `store.mjs:598-607`），driver 仍会照常开新 Attempt。当前不可达（此刻 `currentReceipt` 必然是 source），属防御缺位而非现网缺陷。建议记 backlog。

**P3-3 · `selectQualifiedFallback` 的 `platform` 未由 driver 显式传入，driver 级正例首次与宿主 OS 耦合**

`fallback.mjs:13` 的 `platform` 默认 `process.platform`，`workflow-driver.mjs:255-258` 未传。`herdr-executor` 侧没有任何平台闸（grep 零命中），所以这是全仓**第一处**真正消费 `supported_platforms` 的运行时判据。后果是 `test/identity-quota.test.mjs:121-153` 这条正例在非 win32 宿主上会因「fallback 不合格」翻成 pause 而失败。全仓测试本来就普遍硬编码 `supported_platforms: ['win32']`（`agent-node`/`herdr-adapter`/`attempt-contract`/`rpc-service` 均是），故不算新增违例，但耦合是新的。建议记 backlog：要么 driver 显式传入平台，要么在用例里显式传 `platform`。

**P3-4 · 沿用轮 1 的两条 open nit，本轮复读确认代码未动**

`workflow-driver.mjs:161` 与 `:425` 对同一份 Receipt 各读一次，且两处 `JSON.parse(await readFile(...))` 都在 try 之外（整届 fail-closed 已由 `findings.md` F-010 明文 accepted）；`fallback.mjs:21` 的空 catch 仍不留任何跳过原因的代码（与 F-008 相邻）。行为方向均 fail-closed，维持 open/nit。

**P3-5 · E-008 的全量回归证据成色仍为 open**

轮 1 P3-6 记录 `npm test` 在 `--test-concurrency=4` 下 `test/service.test.mjs:494` 出现 30 s ready 超时、单跑通过，已定性为环境抖动。按本轮票据要求未重跑全量，故该条**维持轮 1 的 open 状态**，建议收口前重取一次稳定全绿或在 E-008 上注明该已知抖动。

## 4. 已检查且 clean 的项（逐条 · 本轮独立复核，非引用轮 1 结论）

| # | 检查项 | 结论与依据 |
|---|---|---|
| D-1 | quota 只认预登记 detector | `classifier.mjs:1-4` 硬编码白名单，`:8-9` 未登记 detector 一律 `unknown`；profile 侧的 `quota_detector_id` 只是自由字符串，闸门在分类器，方向正确 |
| D-2 | 结构化信号形态校验 | `classifier.mjs:10-13`：非对象 / 数组 / `http_status` 非整数 / `error_code` 非字符串一律 `unknown`；raw message 用例 `test:45` 断言。（双证据合取本身的护栏缺口见 P2-3） |
| D-3 | raw 终端文本不参与判定 | driver 只读 `captured.verdict.structured?.quota_signal`（`workflow-driver.mjs:250`），全链无终端输出解析 |
| D-4 | 非额度错误不切号 | `classifier.mjs:17` 对 403/503/500 判 `not_quota`；driver 端到端负例 `test:196-211` 断言 `attempt_started=1`、`fallback_pause_created=0` |
| D-5 | 只在失败时分类 | `workflow-driver.mjs:249` 仅 `outcome === 'failed'` 进分类，成功路径硬编码 `not_quota`，不可能因成功而换号 |
| D-6 | fallback 严格按 Receipt 冻结顺序 | `fallback.mjs:15` 直接遍历 `attemptReceipt.fallback_profile_snapshots`，不排序、不重算、不查当前 registry 扩集；`test:48-68` 用「首个平台不符 + 次个投影漂移 + 第三个合格」证明取的是首个**合格**项 |
| D-7 | 合格判据四要素齐全 | `fallback.mjs:17`（registry 有条目 + 平台匹配 + 有 `config_fingerprint_rule`）+ `:19-20`（重算投影并与冻结快照全等）；`sameIdentity`（`:5-8`）逐一比 `executor_profile_id / account_alias / config_fingerprint / executor_capability_hash`，与 `profiles/identity.mjs:140-146` 的四字段定义一一对应，无遗漏 |
| D-8 | 不拿未校验 registry 选号 | `loadExecutorProfiles` 内已跑 `validateProfiles`（`profile-registry.mjs:15-16`），失败即 `ok:false`；driver `:256` 据此传 `null` → `registry_unavailable` |
| D-9 | **已校验 snapshot 单次传递**（轮 1 P2-1 的整改） | `:256` 选号所用的 `currentRegistry.registry` 与 `:264` 递归传入的 `registrySnapshot` 是同一对象；`:139-141` 见 snapshot 即不再二次 `loadExecutorProfiles`；`:264` 同时传 `executorIdentity: fallback.identity`，`openAttempt:106-108` 直接复用该已校验身份签 Receipt 而非重算，`:103-105` 再加一道 `E_EXECUTOR_IDENTITY_MISMATCH` 同源断言。写进新 Receipt 的身份与 `selectQualifiedFallback` 判定全等的那份，确为同一对象，`design/11:68` 的使用时刻全等成立 |
| D-10 | source 旧 Attempt 先落终态、再开 fresh Attempt | `workflow-driver.mjs:260` 的 `recordResult` 在 `:261` 递归之前；`test:142-143` 断言 `attempt_failed=1` + `attempt_succeeded=1`。（顺序本身带来的副作用见 P2-1） |
| D-11 | fallback 必须是 fresh Attempt，不续旧链 | `openAttempt:95-97` 每次新 `randomUUID()` + `rcpt-` 前缀；`test:135-141` 断言两次 `attempt_started` 的 `attempt_id` 不同、两份 Receipt 的 `executor_identity.executor_profile_id` 分别为 source 与 backup（`design/06` H12 与 P6-IQ-A2 成立） |
| D-12 | **旧迟到写隔离** | `test:144-152` 直接对 source Receipt 补投：`appendCheckpoint` → `E_IDENTITY_MISMATCH`（`store.mjs:578-579`），`appendResult` → `late_result_quarantined` 并落隔离区（`store.mjs:599-607`）。切号路径下旧 Attempt 无 fence 对象，靠 `currentReceipt` 判据隔离，符合 A2「旧 Attempt 的迟到写入被隔离」；fence 是 pause 路径的要求（`store.mjs:508,577,598`），两者不混淆 |
| D-13 | **二次 quota 不链第三身份，且落 canonical pause 而非 failed** | `:253` 的 `allowAutomaticFallback` 只控「是否允许自动选号」，`:252` 的外层分支保证 `quota_confirmed` 一律进入 pause/切号二选一；递归以 `allowAutomaticFallback:false` 开立（`:263`），第二跳必落 `:268` 的 `buildFallbackPause`。`test:213-229` 断言 `attempt_started=2`、`attempt_failed=1`、`fallback_pause_created=1`、节点 `waiting_human`。**R2-M1 变异证明该门被真实钉住** |
| D-14 | **恢复权限**（F-006 不变式） | `:425-429`：优先取已签 Receipt 的 `executor_identity.executor_profile_id`，并以 `recoveredProfileRef === profile.ref` 决定是否恢复自动切号权限——恢复出来的 fallback Attempt 拿不回该权限。旧式 Receipt 经 `?? fields.profile ?? profile.ref` 回退，保持 DHR_33 兼容。`test:249-278` 用「Receipt 身份=backup、快照=third」的恢复届再撞高置信 quota，断言 `attempt_started` 仍为 1、`fallback_pause_created=1`。**R2-M1 变异同样使该用例转红，护栏有效** |
| D-15 | **registry invalid 是独立负例** | `test:231-247` 在 judge 内把 registry 改写成 `{`，断言 `attempt_started=1`、`attempt_failed=0`、`fallback_pause_created=1`；与 `test:155-171` 的 `fallback unavailable`（平台不匹配）并列，`design/11:72` 要求的两个独立 driver 级负例各自成立，且都不自动切号。（两者最终写同一 `reason_code`，因合同 const 不可区分，已由 F-008 承接） |
| D-16 | **pause 写失败 fail-closed** | `:269-280`：`appendFallbackPause` 的抛错与 `ok:false` 负 ack 都被打上 `fallbackPauseWriteFailed` 后抛出；`:304` 的通用 catch 首行放行该标记，不再退化成自由文本 `human_input_requested`。`test:173-194` 用 Proxy 强制抛错，断言 `driver.done.ok === false` 且携带原始错误、`attempt_failed=0`、`fallback_pause_created=0`、`human_input_requested=0`，与 `design/11:64` 对齐 |
| D-17 | canonical pause 的 ID 与对齐关系 | `fallback.mjs:26-46` 三个派生 ID 的前缀与拼接顺序（`run_id/node_id/attempt_id/receipt_id/reason_code`）与 `design/11:54,56,57` 逐字一致，并被 `store.mjs:420-426` 独立复算；`raised_at == fence.fenced_at == attention.raised_at`（`fallback.mjs:33,37,42`）满足 `store.mjs:417` 的对齐校验；`manual_retry_profiles` 原序浅拷贝，通过 `store.mjs:429-438` 的保序子序列校验（其**内容口径**问题见 P2-2） |
| D-18 | 暂停节点不会被 resume 自动重开 | `fallback_pause_created` 投影为 `waiting_human`，而 driver 的可重驱状态集只有 `pending/failed/orphaned`（`workflow-driver.mjs:451-452`），恢复届也只处理 `running`（`:395`）。与 D2「只有人工 `retry-with-profile` 才可创建新 Attempt」一致 |
| D-19 | 启动失败不被解释成再次自动切换 | 递归内的 launch 失败走 `:170-179` 的终态 Result，不回到 quota 分支，符合 `design/11:68` 末句 |
| D-20 | 禁改边界与凭据红线 | `git diff master --stat` 显示生产面仅 `runtime/workflow-driver.mjs`（+69/-…）与 `package.json`（仅 `scripts.test` 一行），`contracts/**`、`fixtures/**`、`profiles/**`、`store/**`、`rpc/**` 与签发服务 `runtime/service.mjs` 零 diff；新增两个 executors 子目录与一份测试均在 brief 允许路径内（`package.json` 已按 F-007 完成失序补录）。Receipt / pause 只承载 hash 与已批准脱敏别名；异常串只含 pointer 名与 profile id（`workflow-driver.mjs:100,104,112`），`fallback.mjs:21` 的 catch 不打印任何内容；本轮读到的全部新增代码与用例无凭据形态字面量 |
| D-21 | 卫生 | 新增文件无调试残留、无 `console.log`、无 TODO；`:305,310` 的两处 `console.error` 与同文件既有风格一致 |

## 5. 裁决

- **P0 = 0、P1 = 0。** 本卡的九条重点（quota 双证据、Receipt 顺序与身份全等、已校验 snapshot 单次传递、source 终态后 fresh fallback、二次 quota 不链第三身份、恢复权限、registry invalid、pause 写失败 fail-closed、旧迟到写隔离）在本轮均能在代码与 driver 级用例上逐条对上；其中一跳上限门与恢复权限门另有 **R2-M1 变异红→还原绿**的独立佐证。
- P2-1 是本轮相对轮 1 的新增发现：`recordResult(source)` 早于「新 Attempt 是否真的开得出」的判定，使「选得出但开不了」的误配收敛成静默的整节点 `failed`。方向仍 fail-closed，触发面窄，故不阻塞，但建议在 findings 里明写，并在下次触碰该文件时把前置判定提到终态之前。
- P2-2 是轮 1 建议 A 落地后暴露的语义缺口，且其修法落在 DHR_61 的 D2 禁改边界内，**本卡不应改**；建议登记并移交 DHR_35 / D2 调整。
- P2-3 是 heavy 配方「有效单测」口径下最值得补的两行断言；本轮因变异命令被拒未能自证，故如实标注为分析结论。
- P3 五条为 nit / 证据成色 / 已 accepted 项，登记即可。
- 本轮只读，未派活、未问用户、未改任何生产代码、测试与计划状态；变异仅在新建 UUID 临时目录的 disposable copy 内施加并还原，shared worktree 四个受审文件的 before/after hash 逐一相等。

CODE2_RULING: APPROVED
open P0: 0
open P1: 0

（以上为代码轮 2 初审结论，保留原样；第二批整改后的复验见第 6 节，最终裁决以文末 `RECHECK_RULING` 为准。）

## 6. 第二批整改复验（同一 reviewer · 只读 · 范围限于整改增量与最新终态证据）

### 6.0 复验取证

| ID | 命令 / 动作 | 结果 |
|---|---|---|
| R2R-E01 | `node --test test/identity-quota.test.mjs test/herdr-adapter.test.mjs test/agent-node.test.mjs` | **36/36，exit 0，19847.1152 ms** |
| R2R-E02 | `git diff master --stat` + 全部 untracked 生产/测试文件重读 | 生产面仍只有 `runtime/workflow-driver.mjs`（+92/-…）、`package.json`（仅 `scripts.test` 一行）与两个新增 executors 子目录；`contracts/**`、`fixtures/**`、`profiles/**`、`store/**`、`rpc/**`、`runtime/service.mjs` 保持零 diff |
| R2R-E03 | `grep` 全仓 `startWorkflowDriver` / `quotaDetectors` / `quota_detector_id` 调用点 | 见 6.3 的 N-2 |
| R2R-E04 | 静态计数三份定向文件的顶层 `test(` | 12 / 15 / 9 |

按票据要求未重跑全量、未再施加变异；E-017 的 quiet 全量以**算术自洽性**核对（见 6.3 的 N-1）。本轮同样只读，未派活、未问用户、未改任何生产代码、测试与计划状态。

### 6.1 初审 P2 的处置

**P2-1 · 合格 fallback 已选出却可能在开新 Attempt 前静默失败（source 已 terminal）—— CLOSED**

- 修法正确且落在根因上：`fallback.mjs:21-28` 把「候选自己的有序 fallback snapshots」**提前到选号阶段冻结**——任一 nested 条目缺 `config_fingerprint_rule`（`:25`）或冻结抛错（`:29` 的 catch）即 `signable=false`，该候选被跳过、循环继续找下一个，全找不到才 `fallback_unavailable`。于是全部冻结失败都发生在 `workflow-driver.mjs:264` 的 `recordResult(source)` **之前**。
- 消费侧同步收口：`:268-270` 把 `fallback.fallback_profile_snapshots` 传进递归，`openAttempt:110-113` 直接 `map` 复用并**跳过**原来的 `resolveProfile + freezeProfileIdentity` 循环（`:114-120` 仅在未传时执行）；`driveHerdrNode:150` 的守卫相应改为 `if (!recovery && !fallbackProfileSnapshots)`。递归路径至此对 fallback 身份链**零文件 I/O、零重算**，我初审列的两条抛出路径（`E_NONSECRET_PROJECTION_MISSING:config-file` / `:config-json`）在该路径上不再可达。
- 反例有判别力，不是「新增用例且为绿」：`test/identity-quota.test.mjs:249-267` 用 `thirdProjection:false` 造出「backup 自身合格、但其 nested third 不可签」，断言 `attempt_started=1`、**`attempt_failed=0`**、`fallback_pause_created=1`、`human_input_requested=0`。`attempt_failed=0` 正是钉住「source 没有被先终结」的那一位——若把预冻结退回递归内，这条必红。
- 附带好处：该情形下 pause 落在 source Attempt 上，`manual_retry_profiles` 仍为 source 的快照（含 backup），人工仍可显式选 backup，比初审设想的「静默 failed」优。
- `findings.md` F-012 以 P1/closed 登记，措辞与实现一致。

**P2-2 · 二次 quota 的人工可选集可能为空、`retry-with-profile` 无合法参数 —— transferred（本卡不可闭合，接受移交）**

- `manual_retry_profiles` 的派生规则是 DHR_61 冻结的 D2 合同（`fallback.mjs:52` + `store.mjs:429-438` 的保序子序列校验），本卡允许路径内确实改不动，初审判断成立。
- `findings.md` F-013 已以 P2/transferred 登记，且把三件事写全：一跳上限是保守策略、`reason` 无法区分「有候选但已用满一跳」与「无候选」、空 `manual_retry_profiles` 无协议内出口；`review.md` 人类签名区新增「二次 quota 的产品语义」一行把它交回用户裁决。披露完整，移交对象（DHR_35 / D2 调整）正确。
- 本路径不再持有该条：它是产品语义与上游合同问题，不是代码轮 2 能关的。

**P2-3 · quota「结构化双证据」无断言独立钉住 —— CLOSED**

- `test:46-47` 补了我初审点名的两条交叉负例：`{429, rate_limited}` 与 `{503, usage_limit_reached}`，均断言 `not_quota`。至此砍掉 `classifier.mjs:11` 与门的任一半都会让其中一条翻成 `quota_confirmed` 而转红——双证据从「读码成立」变成「被断言咬住」。这正是我初审因变异未获批而只能标注为分析结论的那个缺口，现已用断言而非说明闭合。
- `lesson_candidates.md` 新增「复核关闭护栏缺口前，要证明错误实现会使断言变红；『新增用例且为绿』本身不证明判别力」——与本条同源，方向对。

### 6.2 初审 P3 的处置

| 初审编号 | 现状 | 依据 |
|---|---|---|
| P3-1 detector 判据取自可变 registry | **大幅改善，残留 nit** | detector **规则表**改为调用方注入（`workflow-driver.mjs:36` `quotaDetectors = {}` → `:257-258`），`classifier.mjs:3-5` 用 `Object.prototype.hasOwnProperty.call` 取值，既挡住 `__proto__`/`toString` 之类原型键，也让缺省态恒为 `unknown`（fail-closed）。registry 现在只能**点名**一个 detector，不能定义它。残留：`detector_id` 仍来自当前 registry 而非冻结 Receipt——纯 nit |
| P3-2 `recordResult` 不看 ack | **open（nit）** | `workflow-driver.mjs:79-92` 未动 |
| P3-3 driver 正例与宿主 OS 耦合 | **CLOSED** | `platform` 提为 driver 入参（`:36` → `:259`），全部 driver 级用例显式传 `platform: 'win32'`（`test:138,173,197,218,237,257,275,295,329`），用例判定不再依赖 `process.platform` |
| P3-4 双读 Receipt / 裸 `JSON.parse` / 空 catch | **open（nit）** | `:167`、`:434` 与 `fallback.mjs:29` 均未动；F-010 accepted、F-008 open，口径一致 |
| P3-5 E-008 全量证据成色 | **CLOSED** | E-017 以 Review Batch pane 静止后的 quiet `npm test` 取得 249/249、exit 0、118996.4266 ms；E-016/F-016 另把并发期的 Herdr timing/锁争用如实记为「不计绿色证据」。并发抖动与 quiet 终态分账登记，是正确处理 |

### 6.3 本轮新增观察

**N-1（P3 · 证据账面数字对不上，建议改正）**

`progress.md` E-016 记「三文件定向 … 12/12；**30/30**」。本轮 R2R-E01 实测同组三文件为 **36/36**（12 + 24）；E-012 的 34/34 对应 identity-quota 为 10 的时期，本批 +2 后必然是 36。`30` 与任何组合都对不上。E-017 的 **249** 反而是自洽的：E-008 的 244 减去当时的 identity-quota 7、再加现在的 12 = 249。建议把 E-016 的定向数字订正为 36/36（可直接引本轮 R2R-E01），避免验收时引用一个错误数字。**不影响任何技术结论**——三文件终态确为全绿。

**N-2（本批新引入的默认值 · 已由 F-011 完整披露，本轮确认披露充分，不作为新 open 项）**

把内置 detector 白名单删掉、改为注入，代价是**生产态该特性恒不触发**：`runtime/service.mjs:282-288` 起 driver 时既不传 `herdrJudge` 也不传 `quotaDetectors`，`profiles/fixtures/golden-registry.json` 零 `quota_detector_id`，故 `classifyQuota` 在生产链路上恒返回 `unknown` → 永不自动换号。方向 fail-closed（宁可不切也不误切），且三处都写明白了：`findings.md` F-011（P1/transferred，逐条列出 service 未注入 judge、零 `structured.quota_signal` 产出方、golden registry 零 detector）、`as-built/relay-core.md` 新增段「该 seam 的机器证来自受控注入，**不能解读为真实账号自动换号已可达**」、`review.md` 完成条件 1/3 标 `constrained` 并新增两行人类签名项。
**提醒（给收口闸，不是给施工）**：完成条件 1 与 3 的「机器证」现在完全建立在注入夹具上，验收必须按 `constrained` 读；F-011 虽是 P1，但它由需求路径提出并已 transferred，接受与否是主控/需求路径与用户的裁决，**不由代码轮 2 关闭或否决**。

**N-3（P3 · nit，建议并入 F-008）**

`classifier.mjs` 不校验注入 detector 的形状。`{status:'429'}`（字符串）、缺字段、甚至 `detectors[id] = true`，都会落到 `not_quota` 而不是 `unknown`——方向安全（绝不会误切），但「注入配置写错」与「确认不是配额」在账上不可分，与 F-008「分类理由不可审计」是同一类。建议并入 F-008 一并交 DHR_35。

**N-4（clean · 值得记一笔）**

- 恢复反例的判别力被**主动加强**：`test:323` 故意把 event detail 的 `profile=` 写成 **source**，而 Receipt 的 `executor_identity` 是 **backup**。若实现回退去信 `fields.profile`，`recoveredProfileRef` 就等于 `profile.ref` → 自动切号权限被恢复 → 链到 third → `attempt_started=2` 转红。这条现在同时钉住「Receipt 身份权威」（P6-IQ-A4）与「fallback 恢复不得重获自动切号权限」（F-006），比初审时强。
- 新增「未登记 detector 不得触发自动换号」driver 级反例（`test:231-247`）**故意不传** `quotaDetectors`，顺带把 `{}` 缺省的 fail-closed 语义也钉住了。
- 全部 driver 级用例补上 `t.after(() => driver.stop())`，对 F-016 记录的并发抖动是正确方向；driver 已收口时 `current` 为 null，`stop()` 无副作用。
- `test:289` 的用例名由「is a distinct fail-closed pause path」改为「fails closed through canonical pause」，与 F-015「测试名只主张 fail-closed，不把内部状态当可观察差异」一致——名实相符，不再暗示账面可区分 registry-unavailable 与 fallback-unavailable。
- 文档同步完整：`brief.md` 允许路径补入 `as-built/relay-core.md`（与 `package.json` 同为显式补录）、`task_plan.md` 施工状态更新、`findings.md` F-001~F-016 状态齐全、`lesson_candidates.md` 补三条、`review.md` 五路复核行与人类签名区均已填。

### 6.4 复验小结

第二批整改把我初审的 P2-1、P2-3 与 P3-1（大部）、P3-3、P3-5 全部闭合，且每一条都由**有判别力的反例**钉住，不是靠口径说明；P2-2 落在上游禁改合同内，已以 F-013 明文 transferred 并交回人验。新引入的「detector 显式注入」使生产态特性不可达，但方向 fail-closed 且在 findings / as-built / review 三处逐字披露，属受控的 `constrained` 交付而非隐瞒。本轮唯一需要动的是 E-016 的一个数字（N-1），不涉技术结论。生产面改动仍严格落在允许路径内，禁改边界零 diff。

RECHECK_RULING: APPROVED
open P0: 0
open P1: 0（本路径；`findings.md` F-011 为需求路径提出的 P1 且状态 `transferred`，其接受与否不由代码轮 2 裁决）
