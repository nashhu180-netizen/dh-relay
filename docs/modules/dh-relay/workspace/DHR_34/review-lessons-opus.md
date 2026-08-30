<!-- dh:v1 -->
# DHR_34 · 教训复核（独立 · fresh · 只读）

## 0. 启动形态（按候选-40：多源并列，矛盾即标待证）

| 来源 | 记录 |
|---|---|
| SessionStart hook 自报 | `当前模型：claude-fable-5[1m]` |
| 实例可见的系统自报 | `You are powered by the model named Opus 5. The exact model ID is claude-opus-5.` |
| 派发方式 | 主控以本 session 直接下达教训路 review-brief（本实例未见启动命令行与屏显） |
| 会话中用户输入 | 收到一条 `1`（对应 SessionStart 询问的「Opus / Sonnet」选项）；本实例无法自行切换模型，未据此改变任何行为 |

**结论：形态待证**，与 F-005、`review-code1-opus.md` §0 同口径，不得登记为「已核验 Opus」。上下文独立性可证：本实例为 fresh 会话，未继承施工或代码轮 1 的会话上下文（`review-code1-opus.md` 是作为仓内文件读取的）。

## 1. 范围与纪律

- 读入：仓根 `AGENTS.md`；`workspace/DHR_34/` 全部八件（brief / task_plan / progress / findings / review / lesson_candidates / execution_strategy / review-code1-opus）；`design/11-P6身份与额度治理契约调整.md` 全文；`knowledge/教训库-候选.md` 全 55 条（重点核 identity/quota/fallback/Herdr/测试抖动/失序相关条目）；当前 `git diff` 与全部 untracked 文件。
- 纪律：只读。未派活、未问用户、未改任何代码 / 测试 / 计划状态 / `lesson_candidates.md` / 教训库；唯一写入文件为本文件。新候选只写在本文件 §5，供主控搬运。
- 视角：本轮只查「是否重犯在册教训」与「留痕是否诚实」，不重做代码轮 1 的正确性复核；与轮 1 结论重叠处只标注家族关系，不重复计分。

## 2. 本轮自取证据（均为读取类，未跑测试套件）

| ID | 动作 | 结果 |
|---|---|---|
| L-E01 | `git status --short` + `git diff --stat` | 生产面改动仅 `workflow-driver.mjs`（+69/-9 区间）、`package.json`（1 行）、新增 `executors/identity/fallback.mjs`、`executors/quota/classifier.mjs`、`test/identity-quota.test.mjs`；文档面为 DHR_34 workspace 五份 + 新增 `review-code1-opus.md` |
| L-E02 | 行尾核验：逐文件 `wc -l` 对 `grep -c $'\r$'` | `workflow-driver.mjs` 476/476、`package.json` 23/23、`identity-quota.test.mjs` 278/278、`fallback.mjs` 46/46、`classifier.mjs` 18/18 —— 全 CRLF，**零混合行尾**（`core.autocrlf=true`，`git diff` 的 LF→CRLF 提示是规范化告警而非混合证据） |
| L-E03 | 变更路径凭据形态独立复扫（api key / secret / password / authorization / bearer / token / cookie / `sk-` / `eyJ`） | 3 处命中全为 `E_NONSECRET_PROJECTION_MISSING` 与 `classification: 'nonsecret'` 字面量，**零凭据值**；与 E-010 / R1-E05 一致 |
| L-E04 | `grep -rn "usage-limit\|quota_detector_id"` 全仓 | `claude-usage-limit/v1` 仅出现在 `classifier.mjs:3`，测试与 fixture 零引用 |
| L-E05 | 新测试文件计数：`grep -c "^test("`、`grep -c "driver.stop"` | 10 个用例；`driver.stop` 出现 **0** 次 |
| L-E06 | `design/11` 全文检索 `detector` / `usage_limit` / `429` / `双证据` | **零命中** —— detector 白名单与「429 + `usage_limit_reached`」双证据规则无设计出处，来源是 `progress.md:30` 的施工期设计裁决 |

## 3. 结论清单

### P0（0 项）

无。未发现凭据入工件、禁改边界越界、伪造证据或失序掩饰。

### P1（2 项）

**P1-1 · heavy 配方的「有效单测（变异点）」在本卡全部工件里整段缺失 —— 候选-47 / 候选-49 / 候选-6 / 候选-45 家族**

- 位置：`docs/modules/dh-relay/workspace/DHR_34/review.md:49-53`（完成条件表只有 1/2/3 三行，无「有效单测：变异点改坏必红」行）；`review.md:24-28`（代码轮 2 表头未写「变异点选定者」）；`execution_strategy.md:6`（列了五路复核，无有效单测）；`task_plan.md:28`（同）；`progress.md` 证据账本 E-001~E-013 中**无任何变异探针证据**。
- 事实对照：`AGENTS.md:22` 宪章 #5 明写「`heavy/normal` 另有有效单测要求」。同仓两张前卡都把它落成验收表的一行并留了三段式证据 —— DHR_33 `review.md:4` 抬头写「+ 有效单测（变异点由轮 2 实例选定）」、`review.md:56` 记「红→还原(sha256)→绿」并明确履行候选-49 的终基线条款；DHR_32 `review.md:52` 同形。DHR_34 三处该出现的位置一处都没有。
- 为什么是 P1：这正是候选-47 的病灶形态 —— 门槛句/清单没点名的分组，**没有任何流程动作会去看它**。代码轮 2、需求、一致性、教训四路正在同一 Review Batch 并发跑；若轮 2 的派活提示词里也没写「你负责选变异点」，这道闸门会在收口时整段蒸发，而 review.md 的完成条件表全绿看不出缺口。附带地，候选-49（变异证据须以最终提交为基线）在本卡无从谈起 —— 连第一次取证都没有，而本卡已经历一轮整改（`workflow-driver.mjs` 与测试文件在 E-012 后都动过）。
- 与轮 1 的关系：轮 1 未报此项（其票据范围是 diff 正确性），不构成重复计分。
- 可核查的闭合动作（主控侧，非本卡代码问题）：① 在 `review.md` 完成条件表补「有效单测：轮 2 选点变异改坏必红」一行，证据列留待轮 2；② 轮 2 派活文本里明写选点职责与「红→还原(sha256)→绿」三段格式；③ 变异点按候选-45 选在「只有该保护拦得住」的输入上（本卡的天然选点：`classifier.mjs:14` 的双证据合取、`fallback.mjs:20` 的 `sameIdentity` 全等、`workflow-driver.mjs:429` 的 `recoveredProfileRef === profile.ref` 门闩），并按候选-49 记基线 commit。

**P1-2 · 恢复届的护栏用例零判别力，而轮 1 复验已把它判为「钉住了」CLOSED —— 候选-46 重犯 + 候选-12 的复核侧形态**

- 位置：`relay-core/test/identity-quota.test.mjs:258`（预置 Receipt 的 `executor_identity: fallbackIdentity` = `herdr.codex.backup`）与 `relay-core/test/identity-quota.test.mjs:263`（同一届的 `host_observation_changed` detail 里 `profile=${fixture.fallback.executor_profile_id}`，**同样是 backup**）；被测判据在 `relay-core/runtime/workflow-driver.mjs:426`：`attemptReceipt.executor_identity?.executor_profile_id ?? fields.profile ?? profile.ref`。
- 事实链：该用例要钉的是 F-006 / P6-IQ-A4 的核心不变式——**恢复时以已签 Receipt 身份为准，控制客户端写进 event detail 的 `profile=` 不得改写执行身份**。但夹具让 Receipt 身份与 detail 身份取同一个值，于是把 `:426` 的取值顺序对调成 `fields.profile ?? attemptReceipt.executor_identity?...`，`recoveredProfileRef` 仍是 `backup`、`allowAutomaticFallback` 仍是 `false`、三条断言（`attempt_started=1`、`attempt_failed=0`、`fallback_pause_created=1`）**取值完全不变**。这条护栏只能区分「用 Receipt」与「用 `profile.ref`（source）」，区分不了「用 Receipt」与「用客户端写的 detail」——而后者正是 design/11 §1「不让控制客户端的切换改变既有 Attempt / Result 的执行身份」（`design/11:21`）和 `design/11:94`「不能以 `event.detail` 的自由文本替代 Receipt 身份快照」点名要防的那一支。
- 为什么升到 P1（而不是照 DHR_33 同形的 P2）：候选-46 是**上一张卡**（DHR_33 一致性复核 P2-2）刚立的条目，一卡之内原样复发；更关键的是 `review-code1-opus.md:186` 把它写成「这正好钉住了 `recoveredProfileRef` 取值」并据此判 P2-2 CLOSED，而 `review.md:45` 的需求对齐表已把 P6-M2/M7 记成「machine 通过」。护栏无判别力 + 结论按有判别力书写，是候选-12「证据覆盖子集、结论写成整条兑现」在复核侧的翻版。**产品代码本身是对的**（`:426` 的优先级实现无误），缺陷在护栏与结论成色，不是运行时缺陷。
- 可核查的闭合动作：把 `identity-quota.test.mjs:263` 的 detail 改成 `profile=${fixture.source.executor_profile_id}`（与 Receipt 身份不同且恰好是会重新打开自动切号权限的那个值）。此时错误实现（先信 detail）会得到 `recoveredProfileRef=source` → `allowAutomaticFallback=true` → 自动切到 backup → `attempt_started=2`，与正确实现的 `attempt_started=1` + `fallback_pause_created=1` 明确分叉；按候选-46 建议②当场做一次反向变异证红再判闭合。

### P2（3 项）

**P2-1 · 全量套件的一次真实红被「单次单文件重跑」结案为环境抖动，E-008 既未重取也未注记，且未升 findings —— 候选-48 重犯 + 候选-31 / 候选-41**

- 位置：`review-code1-opus.md:30-32`（R1-E06：`npm test --test-concurrency=4` 下 `test/service.test.mjs:494` 报 `E_SERVICE_NOT_READY:ready-timeout-30000ms`，单独重跑 13/13 通过，据此判「并发下的环境抖动」）；`review-code1-opus.md:109-112`（P3-6 建议收口前重取）；`docs/modules/dh-relay/workspace/DHR_34/progress.md:23`（E-008 至今仍是「244/244，exit 0」，无任何注记）；`findings.md`（F-001~F-010 中无此项）。
- 与在册教训的逐条对照：
  - 候选-48 逐字写着「红率约 1/3 时单次绿概率本有 2/3，复跑一次几乎无证伪力」，建议是「①按失败签名分类逐类结论；②复跑次数要能证伪观察到的红率并记账；③硬门槛写成『连续 N 次 exit 0 + 失败签名归因』」。本卡的处置是**单次、且换了运行条件（单文件而非并发全量）的重跑**——恰好是候选-48 点名无效的那种复跑：它连「同一并发条件下还红不红」都没回答。
  - 候选-31 的原始现场就是本仓「套件变大后既有紧预算在更高并行度下偶发超时」，并建议「记一条 backlog 追踪『是否还有下一个紧预算』」。本卡新增了一个测试文件进 `npm test`（`package.json:12`），正是候选-31 描述的触发条件，但没有做「扫一遍既有紧预算」的动作，也没记 backlog。
  - 候选-41：会让某条已冻结验收口径过不去的事实必须升 findings 并点名口径 ID。E-008 是完成条件 1/2/3 共用的机器证之一，「本复核环境未一次复现」这件事只躺在 review 文件里，`findings.md` 与 `progress.md` 均无账 —— 与候选-41 的原始现象（evidence 里躺着、findings 里没有）同形。
- 需要说清的公平话：轮 1 **确实**如实记了 R1-E06 并主动提了 P3-6，没有隐瞒；判「不归因于本 diff」的两条依据（本卡对 `launcher.mjs`/`service.mjs` 零 diff、失败形态是 ready 超时而非断言不符）也成立。缺口在归因之后的**账**：E-008 的成色未被回写，抖动本身未被立项追踪。
- 可核查的闭合动作（三选一，均可留痕）：① 在同一 `--test-concurrency=4` 条件下连续 N≥3 次 `npm test` 并逐次记 exit code + wall-clock + 失败签名，据此给出红率结论；② 保留 E-008 原值但**追加**一条注记，写明该用例在并发 4 下的已知抖动与失败签名（progress 是追加式账本，按候选-10 不改旧句）；③ 把「service ready 30s 紧预算 vs 套件并行度」立成 backlog 条目。

**P2-2 · detector 白名单里的对称变体 `claude-usage-limit/v1` 零断言、零设计出处 —— 候选-33 重犯 + 候选-11 + AGENTS 编排协议 #5**

- 位置：`relay-core/runtime/executors/quota/classifier.mjs:3`；全仓引用见 L-E04（测试、fixture、design 均零引用）；设计侧见 L-E06（`design/11` 全文无 detector 相关字样，规则来源是 `progress.md:30` 的施工期设计裁决）。
- 事实：白名单里两个条目配置完全相同、语义对称，测试只喂 `codex-usage-limit/v1`（`identity-quota.test.mjs:35,41,45,98,101`）。把 `:3` 的 `code` 改成 `'usage_limit'`、或把 `status` 改成 `503`，**没有任何断言会红**。这正是候选-33 描述的「测试构造器写死其中一个变体，另一个的 bug 永远不会变红」，也是候选-11 的「机制补丁只覆盖被举证的那一份」。
- 为什么不只是测试覆盖问题：`DETECTORS` 的每一个条目都是**自动换号的触发面**。`claude-usage-limit/v1` 既无 design/11 出处、又无 DevPlan 出处、也无任何用例，按 AGENTS「编排协议段」通用铁律 #5（范围外新想法记 findings/backlog，不顺手做）它更接近「顺手加的一行」。方向上仍 fail-closed（多一个条目不会放宽双证据判据），所以不是 P1。
- 可核查的闭合动作（二选一）：① 给它补一条与 codex 变体同形的正负样本断言，并在 findings 里写明这两个 detector ID 的出处是施工期裁决而非 design/11；② 若本卡确实只需要 codex 一路，从白名单删除该条目并把「claude 侧 detector 待 DHR_35 按真实样本登记」记进 findings/backlog。

**P2-3 · driver 层 fallback 用例隐式依赖 `process.platform`，本机 Windows 之外全套语义翻转 —— 候选-50 家族（外部环境未强制注入）**

- 位置：`relay-core/runtime/executors/identity/fallback.mjs:13`（`platform = process.platform` 默认参数）；`relay-core/runtime/workflow-driver.mjs:255-257`（driver 调用处只传 `attemptReceipt` / `registry` / `environment`，**不传 `platform`**）；`relay-core/test/identity-quota.test.mjs:27`（夹具 profile 硬编码 `supported_platforms: ['win32']`）。
- 事实：单元用例是干净的 —— `identity-quota.test.mjs:61` 显式传了 `platform: 'win32'`（候选-50 的正解）。但四条 driver 级用例（`:121`、`:213`、`:231`、`:249`）无法注入 platform，只能吃 `process.platform`。在非 win32 宿主上，`fallback.mjs:17` 的平台匹配必然失败，「confirmed quota starts one qualified fallback as a fresh Attempt」会从「切号 + fresh Attempt」翻转成「pause」，用例确定性红；换句话说这一组用例的结论随宿主 OS 漂移，与候选-50「测试结论会随本机状态漂移」同形，只是漂移源从家目录注册表换成了平台常量。
- 现状可接受性：本仓是 Windows 优先，短期不会红；但这是一条没有留痕的隐式前提（`progress.md` 的 E-006~E-008 均未写「取证宿主为 win32」），也拿不到候选-31 要求的「结论带环境条件」。
- 可核查的闭合动作：给 `startWorkflowDriver` 加一个 `platform` 透传参（默认 `process.platform`）由用例注入；或夹具改用 `process.platform` 生成 `supported_platforms` 并在 progress 里注明取证宿主。

### P3（3 项）

**P3-1 · 新测试文件 10 个用例、0 个 `t.after(() => driver.stop())`，与同仓惯例和候选-51 建议①相悖**

- 位置：`relay-core/test/identity-quota.test.mjs:125,158,180,199,216,266`（六处 `startWorkflowDriver`）；L-E05 证 `driver.stop` 零出现。对照 `relay-core/test/herdr-adapter.test.mjs:154,160,170,174,181,186,193,200,220,230` —— 每一个 driver 都配了停止钩子。
- 定性：本文件的用例都 `await driver.done`（drive() 已收口，`fake-herdr` 无真实子进程），残留轮询的风险低，所以是 P3 不是 P2。但候选-51 的原始事故就是本仓「fixture 无 `t.after(driver.stop)` → 全量 `npm test` 多次挂死强杀」，而候选-51 给的正是一条无条件规则（「start 出带循环的对象，同一行下写 `t.after(() => obj.stop())`」）；`:180-194` 的 fail-closed 用例还是在 driver 抛错的路径上收口的，恰是最不该省钩子的一条。这也是候选-55「同仓已有的做法在新文件里被悄悄绕开，且历轮复核都不核它」的形态。
- 闭合动作：六处各补一行 `t.after(() => driver.stop())`。

**P3-2 · 新测试进 `npm test` 只有静态登记，无「用例数增量」留痕 —— 候选-39 的建议未执行**

- 位置：`relay-core/package.json:12`（`scripts.test` 显式清单已插入 `test/identity-quota.test.mjs`）；`progress.md:23`（E-008 只有「244/244」，无变更前基线）。
- 定性：候选-39 要防的风险（显式清单漏登 → 新文件从未被跑过 → 后续所有「全量绿 / 变异必红」都建立在没跑过的文件上）在本卡**实际上不成立** —— 登记行在 diff 里可直接目视核对，L-E05 也证明新文件有 10 个用例、E-007 单独跑过它。所以只是留痕层面的差一步：候选-39 的可核查判据是「对比用例总数增量是否等于新增数」，而 E-008 没有记变更前的基线数（若基线为 234，244 恰好等于 234+10，但账上无从复算）。
- 闭合动作：E-008 补一句基线（`master` 上的 `npm test` 用例数）或直接写「新增 10 = 244−234」。

**P3-3 · `lesson_candidates.md` 停留在立项期的两条泛化条目，未回填本轮真正踩到的坑；task_plan / brief 未点名任何在册教训作为施工约束 —— 候选-13 / 候选-55 家族**

- 位置：`docs/modules/dh-relay/workspace/DHR_34/lesson_candidates.md:4-5`（两条均写于施工前，内容是本卡的**需求性质**复述，不是过程教训）；`task_plan.md:6-12` 的 Context Packet 与 `execution_strategy.md` 全文均无「按候选-NN 做」类冻结引用。
- 事实：本卡与至少四条在册候选强相关（候选-33 对称变体、候选-39 新测试进入口、候选-46 护栏判别力、候选-48 环境抖动归因、候选-50 隐式环境依赖），其中候选-46 / 候选-48 / 候选-50 全部来自**上一张卡 DHR_33**；本卡工件里一次都没引用它们，而本轮复核在这三条上各抓到一处复发（P1-2 / P2-1 / P2-3）。这正是候选-13「写下教训不等于教训生效」与候选-55「冻结引用不写进验收项就没有任何动作会去核它」的合并形态 —— 区别在于本卡连「写下引用」这一步都没做。
- 闭合动作：收口时把本轮实际踩到的坑回填进 `lesson_candidates.md`（本文件 §5 已给出可直接搬运的措辞）；后续 heavy 卡的 task_plan 建议固定加一行「本卡点名遵守的在册候选」，并在复核清单里配一问「点名的教训，代码里守了吗」。

## 4. 已检查且 clean 的项（逐条，含判据）

| # | 检查项（对应在册候选） | 结论与依据 |
|---|---|---|
| C-1 | 模型形态取证（候选-40） | **clean 且属正面示范**：F-005 保持 open 不结案；`review-code1-opus.md:5-13` 四源并列、明写「形态待证」；`review.md:22` 的复核者列也照写「Opus 5 形态（身份来源冲突，待证）」，没有把无法核验的身份写成已核验。本文件 §0 沿用同口径 |
| C-2 | 行尾纪律（候选-53） | **clean**：L-E02 实测五个改动/新增文件均 100% CRLF，零混合行尾；本卡的编辑动作没有留下 git 不可复原的混合字节 —— **【复验更正，见 §7.5 R-0】此结论不成立：L-E02 的测法有误，按字节复测为普遍混合行尾。原句按候选-10 保留不改，以 R-0 为准** |
| C-3 | 文档纠错不偷改历史（候选-10） | **clean**：`progress.md` 的 diff 为纯新增 16 行、零删除；`brief` / `task_plan` / `review` 的改动都是状态推进（blocked→解除、待派→已派、待验证→候选通过），无一处抹掉历史结论。`review-code1-opus.md:150` 还主动写了「以上为第 1 轮结论，保留原样，最终裁决以文末为准」，符合候选-10 的 superseded 写法 |
| C-4 | 失序处理（AGENTS 宪章 #1 / 候选-13 的正面案例） | **clean**：`package.json` 越界这件事被逐字标成「**失序补录**，见 F-007」（`brief.md:36`），F-007 处置里明写「不伪装成正常先修 brief」，`review-code1-opus.md:195-198` 独立复核确认。没有把先改后补包装成正常流程 |
| C-5 | 派工前 fresh 只读预审（候选-54） | **clean 且是该候选的最强佐证**：S1 预审两条 P0（`launch-receipt.v2` 无身份四件套、run-state 无 `paused`）直接把本卡从「按字面施工」拦成 blocked，并催生了前置契约卡 DHR_61（`progress.md:40`、`design/11:8`）。若照原 brief 施工，产出的必然是「形状对、跑不起来」的交付。建议主控在候选-54 下登记这条佐证 |
| C-6 | 自证循环 / oracle 来源（候选-2、候选-7） | **clean**：`identity-quota.test.mjs:34-45` 的期望值是测试内独立硬编码的四组 `{status, code}` 与三个负例，不从 `classifier.mjs` 的 `DETECTORS` 表反推；fallback 选择用例（`:53-65`）用「首个平台不符 + 次个投影漂移 + 第三个合格」三段构造，能真正区分「取首个」与「取首个**合格**」两种实现，判别力真实 |
| C-7 | 家目录 / 外部配置隐式依赖（候选-50 的注册表面） | **clean**：六处 driver 用例全部显式注入 `herdrRegistryPath` 与 `profileEnvironment`（`identity-quota.test.mjs:127,159,182,201,218,268`），没有一条落到 `defaultRegistryPath()` 的 `~/.dh-relay/executor-profiles.json`；`selectQualifiedFallback` 的单元用例也显式传 `environment`。平台维度的缺口另见 P2-3 |
| C-8 | 异步等待条件（候选-35） | **clean**：所有 driver 用例等的是 `driver.done` 这个终态信号，不是轮询「我要断言的那个值出现」；不存在候选-35 描述的自证循环式轮询 |
| C-9 | 断言在咬 / 整改不是口径闭合（候选-6） | **大体 clean**：轮 1 的 P1-1、P2-1、P2-3、P3-5 每条都配了 driver 级反例（Proxy 强制 `appendFallbackPause` 抛错、judge 内把 registry 改写成 `{`、平台不匹配、二次 quota 走 pause），不是靠文字说明闭合。唯二例外是 P1-2（护栏无判别力）与 P1-1（无变异证据），已单列 |
| C-10 | 时钟事实源（候选-27） | **clean**：新用例不做任何按「现在」推导的日期比对；`buildFallbackPause` 的时间戳在单元用例里由参数注入（`:76`），driver 用例只断言计数与状态，不逐字比时间 |
| C-11 | 密钥红线（宪章 #6） | **clean**：L-E03 独立复扫零凭据值；Receipt / pause 只承载 hash 与已批准脱敏别名；`fallback.mjs:21` 的 catch 不打印任何内容；异常文本只含 profile id 与 pointer 名 |
| C-12 | 范围与禁改边界（宪章 #7 / 编排协议 #5） | **clean**：生产面五处改动全部落在（补录后的）允许路径内；`contracts/**`、`fixtures/**`、`profiles/**`、`store/**`、`rpc/**` 零 diff；未读写用户级注册表。唯一擦边的是 P2-2 的白名单条目 |
| C-13 | TDD 红证据的诚实度 | **clean 且值得记一笔**：E-006 不但记了红（3/5、exit 1、两条具体失败），还主动区分「此前夹具重复建账红已先修正，**不计业务红**」—— 没有把夹具自身的红冒充成 TDD 的业务红。同类诚实还有 `progress.md:32`「首次回归因此短暂为 30/31，修正后同组 31/31」 |
| C-14 | 工具链事故留痕（候选-52） | **部分 clean**：`progress.md:37` 记了 `dh wt new` 误从 `origin/master` 建树并重建、`:38` 记了「当前终端没有 Herdr 管理身份故未派发」、`:39` 记了模型身份双证矛盾。虽未用候选-52 建议的 `- [工具链]` 前缀，但事故本身有账，不是零记录 |
| C-15 | 无真实样本时不伪造（候选-36 的诚实半边） | **clean**：F-002 明写「本机无获批真实 quota 样本，不伪造来源」，真实产品样本移交 DHR_35；`review.md:44` 的需求对齐表也逐字写明证据是「受控脱敏结构化样本注入」，没有把合成样本说成真实闭环。这是候选-36「机器证对象 ≠ 验收对象」时的正确处置方式（显式声明差距而非掩盖） |
| C-16 | 证据覆盖面 vs 结论口径（候选-12） | **大体 clean**：`review.md:51-53` 的完成条件表写的是「候选通过，待 Opus 复核」而非「已达成」；F-008 / F-010 如实保持 open / accepted 而非强行 closed。唯一越位处是 P1-2 指出的那条 CLOSED 判定 |

## 5. 可核查的新候选（只写在本文件，供主控裁决后搬运；本轮未改 `lesson_candidates.md` 与教训库）

> 均已按去重要求扫过正册（本仓正册为空）与候选区全 55 条，标注了疑似重复关系。

**新候选 A · 施工期「实现裁决」若填补的是设计未覆盖的第三种情形，必须停下升 findings，不能写进 progress 就算冻结**

- 触发场景：worker 施工中撞到 brief / design 都没写的分支（本卡：source 与 fallback 双双限额时怎么收口），当场作出裁决并只记在 `progress.md`。
- 疑似重复：与候选-42（目标↔验收口径互查）同属「文档传导」家族，但触发形相反 —— 候选-42 是**上游漏抄**被忠实传播，本条是**下游自行补写**并被当成已冻结口径；与候选-26（驳回也是待审对象）角度不同，那条讲裁决方驳回复核发现。建议独立成条。
- 现象：`progress.md:31` 的实现裁决「fallback 启动或执行失败直接终态，不继续链式换号」被写成与设计裁决并列的条目；而 design/11:8 记录的用户已确认语义是「无合法 fallback 时…停止自动切号并等待人工，**不是任务失败或已结束**」。代码轮 1 的 P1-1 逐条论证后指出：实现落在 design 的两个分支之外，属第三种未被设计覆盖的行为，且「一跳上限」只是施工期裁决、不是 design/11 或 DevPlan 的冻结条款。整改后改走 canonical pause 才与用户确认语义对齐。
- 反思：`progress.md` 是账本不是合同。把填补设计空白的判断写进账本，外观上与「已冻结口径」难以区分，收口时读账本的人会把它当既定事实；本卡靠一轮独立代码复核才逮回来，成本是一次整改。
- 建议后续动作：① progress 里凡出现「实现裁决 / 设计裁决」字样，收口自查固定一问「它填补的是设计空白吗？改写了哪条用户已确认的语义？」；② 属于填空白的，当场升 findings 并点名被影响的验收口径 ID（承接候选-41 的判据），由主控决定是走设计调整还是接受；③ 复核清单固定一问「progress 里的裁决条，哪几条在 design/DevPlan 里找不到出处」。

**新候选 B · 复核判「CLOSED」不能只看新用例存在且绿，必须复算护栏的判别力（错误实现下断言取值是否不同）**

- 触发场景：复核者对自己上一轮提出的「缺护栏」类 finding 做整改复验。
- 疑似重复：**候选-46 的复核侧形态**（候选-46 讲施工者补的护栏零判别力），裁决时可考虑并入候选-46 作为第二款，而不是独立成条。
- 现象：`review-code1-opus.md:186` 判 P2-2 CLOSED，理由是「这正好钉住了 `recoveredProfileRef` 取值与 `allowAutomaticFallback` 门闩」；但新用例的 Receipt 身份与 event detail 身份取了同一个值，把两者的优先级对调后全部断言取值不变（详见本文件 P1-2）。复核者读的是「新用例覆盖了这段代码」，没有复算「错误实现下它会不会红」。
- 反思：整改复验天然带着「我提的问题被修了」的确认倾向；而「有用例」与「用例能判别」的差距，恰恰是复核者最该补上的那一步 —— 施工者已经证明不了自己。
- 建议后续动作：① 复核判 CLOSED 前，对每条护栏类整改当场做一次反向变异（把被保护的判据改成错误实现）并记红；② 变异做不了时（只读票据、成本过高），结论只能写「已补用例，判别力待轮 2 变异复算」，不得写「钉住了」；③ 这条可直接并进候选-46 的「建议后续动作」作为第 ④ 款。

**新候选 C · 白名单 / 枚举表每新增一个条目就是新增一份触发面，条目必须同时有「设计出处」与「至少一条断言」**

- 触发场景：给自动化动作（换号、重试、降级、放行）写驱动用的白名单常量表。
- 疑似重复：与候选-33（对称变体逐一参数化）同根，本条给的是**收口判据**而非测试构造法；与候选-1（每个 reason 码 ≥1 条断言）同族，可考虑合并为候选-1 的第二款「白名单条目同样按分支计」。
- 现象：`classifier.mjs:1-4` 的 `DETECTORS` 有两个条目，`claude-usage-limit/v1` 在 design/11、DevPlan、测试、fixture 里全部零出现（本文件 L-E04 / L-E06）；改坏它不会有任何断言变红。
- 反思：白名单条目在阅读时像「配置」，在运行时是「谁能触发这个自动动作」的授权列表；对自动换号这种红线相邻的动作，多一个没人验证过的条目就是多一份没人看过的授权。
- 建议后续动作：驱动自动化的白名单，收口检查两问 —— 每个条目的出处（design/需求 ID）是什么？哪条断言在咬它？两问缺一即删条目或升 findings。

## 6. 裁决

- 未发现 P0：无凭据入工件、无禁改越界、无伪造证据、无失序掩饰；行尾、只读边界、密钥红线、文档 append 纪律均 clean（C-2/C-3/C-4/C-11/C-12）。
- 两条 P1 都不是运行时缺陷，而是**闸门与护栏成色**：P1-1 是 heavy 配方里「有效单测/变异点」这一路在工件层整段缺失（候选-47 形态，且正在并发的 Review Batch 里最容易蒸发），P1-2 是恢复届护栏零判别力却被判 CLOSED（候选-46 一卡之内复发 + 候选-12 的复核侧形态）。两条都有明确、低成本、可当场证红的闭合动作。
- 三条 P2 分别复犯候选-48（单次重跑判环境抖动 + 未升 findings）、候选-33/11（对称变体零断言且无设计出处）、候选-50 家族（driver 用例隐式吃 `process.platform`）。
- 本卡同时是候选-54（派工前 fresh 只读预审）与候选-40（模型形态并列取证）的正面佐证，建议主控在裁决教训库时把这两条佐证一并登记。
- 本轮只读，未派活、未问用户、未跑测试套件、未改任何代码 / 测试 / 计划状态 / `lesson_candidates.md` / 教训库；唯一写入文件为本文件。

LESSONS_RULING: CHANGES_REQUIRED
open P0: 0
open P1: 2（P1-1 有效单测/变异点整段缺失；P1-2 恢复届护栏零判别力且已被判 CLOSED）

## 7. 整改复验（同一路径 · fresh Opus 实例 · 只读 · 范围限于本路径原 P1 两条与票据点名项）

### 7.0 复验形态与纪律

- 启动形态：SessionStart hook 自报 `claude-fable-5[1m]`，实例自报 `Opus 5 / claude-opus-5`；与 §0、F-005 同口径，**形态仍待证**，不登记为已核验 Opus。本实例为 fresh 会话，未继承施工、代码轮 1/2 或本文件初审的会话上下文（初审结论是作为仓内文件读取的）。
- 纪律：只读。**按票据要求未跑任何测试套件、未施加变异、未派活、未问用户**；未改任何代码 / 测试 / 计划状态 / `lesson_candidates.md` / 教训库。唯一写入文件为本文件本节。
- 范围：只核初审 P1-1（有效 mutation 是否已具备）、P1-2（恢复用例是否形成判别力），外加票据点名的 stop 钩子 / platform、内置 detector 删除、lesson candidates、quiet 全量 249。初审 P2/P3 只做顺带状态确认，不重开。

### 7.1 复验取证（均为读取 / 静态复算）

| ID | 动作 | 结果 |
|---|---|---|
| LR2-E01 | `git diff --stat` + 全部 untracked 生产/测试文件重读 | 生产面仍为 `runtime/workflow-driver.mjs`（+92/-…）、`package.json`（仅 `scripts.test`）与两个新增 executors 子目录；文档面新增 `as-built/relay-core.md` 一段 |
| LR2-E02 | 恢复用例判别力静态复算（不跑测试）：`test:311/318` Receipt 身份 vs `test:323` detail `profile=` vs `workflow-driver.mjs:426` 取值链 | 见 7.3，两种实现的断言取值明确分叉 |
| LR2-E03 | 全仓 `grep` `quotaDetectors` / `quota_detector_id` / `DETECTORS` | 无内置白名单；`claude-usage-limit/v1` 全仓零命中；`service.mjs` 零注入（与 F-011 披露一致） |
| LR2-E04 | 静态计数 `test/identity-quota.test.mjs` | 顶层 `test(` **12**；`startWorkflowDriver({` **9**；`t.after(() => driver.stop())` **9**；`platform: 'win32'` **11**（9 driver + 2 单元） |
| LR2-E05 | 行尾复扫（按字节统计 CRLF 与裸 LF 的数量；不用 grep 行匹配——它在本 shell 的引号形态下会静默给出假读数） | **与初审 C-2 结论相反：本卡的改动面普遍混合行尾**。`workflow-driver.mjs` 382 CRLF + **103 裸 LF**；`package.json` 22 CRLF + **1 裸 LF**；`as-built/relay-core.md` 382 CRLF + **3 裸 LF**；三个新增文件（`classifier.mjs` / `fallback.mjs` / `identity-quota.test.mjs`）**整体为 LF**，而同目录未被本卡触碰的 `service.mjs`、`herdr-adapter.test.mjs`、`agent-node.test.mjs` 均 100% CRLF。workspace 六件（brief / findings / lesson_candidates / progress / review / task_plan）同样混合。详见 7.5 的 R-0 |
| LR2-E06 | 用例数算术自洽复算 | E-008 `244`（当时 identity-quota 为 7：E-007 `31` − 另两文件 `24`）→ 现 12 → `244 − 7 + 12 = 249`，与 E-017 的 `249/249` 自洽 |

### 7.2 原 P1-1（有效单测 / 变异点整段缺失）—— **CLOSED**

- **闸门已在工件层出现**：`review.md:24-28` 代码轮 2 行的「范围」列现写「全程与收口增量、**有效 mutation**」，派出证据列指向 E-014~E-016；`progress.md` 证据账本新增 **E-015 = mutation**，三段式齐全（临时副本 baseline 10/10 → mutant 8/10 → restore 10/10，共享工作树 hash 不变）。初审担心的「没有任何流程动作会去看它」（候选-47 病灶）**没有发生**：变异实际做了、账实际记了。
- **变异本身是有效的，不是走查**：`review-code2-opus.md` R2-M1 变异的是 `workflow-driver.mjs` 的 `if (allowAutomaticFallback) {` → `if (true) {`，红的两条正是本卡核心不变式（一跳上限门、恢复权限门），还原即绿；选点落在「只有该保护拦得住」的输入上，符合候选-45。取证在新建 UUID 临时目录的 disposable copy 内施加，四个受审文件 before/after hash 逐一相等，符合只读票据。
- **残留（降为 P2，见 7.5）**：E-015 的基线是**第二批整改之前**的树（identity-quota 10 个用例），最终交付是 12 个用例且 `workflow-driver.mjs` / `fallback.mjs` 在其后又动过（预冻结 nested snapshots、`fallbackProfileSnapshots` 透传、`platform` 提参）；`review-code2-opus.md` §6.0 明写复验阶段「未再施加变异」。这正是候选-49「变异证据须以最终提交为基线」点名的形态。缓解事实：被变异的 `if (allowAutomaticFallback)` 门与两条转红用例在最终树中**逐字仍在**（`test:269`、`test:309`），故结论可迁移性高——但账面基线确实落后一轮。
- **另一处残留（P3）**：`review.md` 完成条件表仍只有 1/2/3 三行，未按初审建议①补「有效单测：轮 2 选点变异改坏必红」一行。闸门现在挂在复核路径表而非完成条件表上——实质已可核查，形式上比 DHR_32/33 少一行。

### 7.3 原 P1-2（恢复届护栏零判别力且已被判 CLOSED）—— **CLOSED**

- **夹具已按初审给出的闭合动作改到位**：`test/identity-quota.test.mjs:318` 的 Receipt `executor_identity` = `fallbackIdentity`（**backup**），`test:323` 的 `host_observation_changed` detail 写 `profile=${fixture.source.executor_profile_id}`（**source**）。两者不再取同一个值。
- **判别力静态复算成立**（LR2-E02，按 `workflow-driver.mjs:426` 的 `attemptReceipt.executor_identity?.executor_profile_id ?? fields.profile ?? profile.ref`）：
  - 正确实现：`recoveredProfileRef = backup ≠ profile.ref(source)` → `:427` 的 `allowAutomaticFallback = false` → 高置信 quota 直接落 canonical pause → `attempt_started=1`、`attempt_failed=0`、`fallback_pause_created=1`，与 `test:337-339` 三条断言一致。
  - 错误实现（先信 detail）：`recoveredProfileRef = source = profile.ref` → `allowAutomaticFallback = true` → 以 Receipt 的 `fallback_profile_snapshots=[thirdIdentity]` 选出 third（该夹具 `thirdProjection` 默认 true，平台 win32、身份全等，必然 `selected`）→ 先 `recordResult(source)` 再开 fresh Attempt → `attempt_started=2`、`attempt_failed=1`，`test:337` 与 `:338` **两条同时红**。
  - 判别方向正是 design/11 §1 与 `design/11:94` 点名要防的那一支（不得以 `event.detail` 自由文本替代 Receipt 身份快照），初审指出的「只能区分 Receipt vs `profile.ref`」缺口已消除。
- **结论口径也已同步**：`review.md:51-53` 完成条件 2 的证据列现逐字写「恢复用例故意令 event detail=source、Receipt=backup」，达成列写「Receipt 权威断言有判别力」——不再是「有用例即钉住」。候选-46 在本卡的复发已闭合；对应的可搬运教训「复核关闭护栏缺口前，要证明错误实现会使断言变红」也已进 `lesson_candidates.md`。
- 附带确认：`review-code2-opus.md` §6.3 N-4 独立记录了同一处加强，与本路径判断一致，非互抄（两路结论各自给出取值链推演）。

### 7.4 票据点名项复核

| 项 | 结论 | 依据 |
|---|---|---|
| stop 钩子（初审 P3-1 / 候选-51） | **CLOSED** | LR2-E04：9 处 `startWorkflowDriver` 对 9 处 `t.after(() => driver.stop())`，一一对应，含 `:187` 的 fail-closed 抛错用例 |
| platform 隐式依赖（初审 P2-3 / 候选-50） | **CLOSED** | `workflow-driver.mjs:36` 增 `platform = process.platform` 入参并透传至 `selectQualifiedFallback`（`:259`）；9 条 driver 用例全部显式传 `platform: 'win32'`，用例判定不再随宿主 OS 漂移 |
| 内置 detector 删除（初审 P2-2 / 候选-33、候选-11） | **CLOSED（但换来一条已披露的新约束）** | LR2-E03：`DETECTORS` 常量表整体删除，改为调用方注入 `detectors = {}`，未登记恒 `unknown`（fail-closed）；无出处的 `claude-usage-limit/v1` 已消失。代价是生产态该特性恒不触发，已由 F-011（P1/transferred）、`as-built` 新段「不能解读为真实账号自动换号已可达」、`review.md` 完成条件 1/3 标 `constrained` 三处逐字披露——**这是候选-36「无真实样本时显式声明差距而非掩盖」的正确处置**，本路径不重复计为缺陷 |
| lesson candidates 回填（初审 P3-3 / 候选-13、候选-55） | **大体 CLOSED** | 初审 §5 的新候选 A/B/C 三条已逐条落进 `lesson_candidates.md`（措辞与本文件 §5 同源）。残留：`task_plan.md` 关键决策仍未加「本卡点名遵守的在册候选」一行，故「冻结引用」这半边仍未成形（P3） |
| quiet 全量 249（初审 P2-1 / 候选-48、候选-41） | **大体 CLOSED** | E-017 在 Review Batch pane 静止后取得 `249/249, exit 0, 118996.4266 ms`，与 LR2-E06 的算术推算完全吻合（244−7+12）；并发期抖动升成 **F-016（P2/closed）** 并明写「不计绿色证据」，正是候选-41 要的「升 findings」动作；本节写入期间主控又把失败签名 `E_SERVICE_NOT_READY:ready-timeout-30000ms` 补进 F-016 并明写「本卡不追并发红率」，候选-48 的「失败签名归因」一半已补齐。残留：仍是**单次 quiet 绿**，未做「同并发条件下连续 N 次 + 红率结论」（P3，见 R-4） |

### 7.5 本轮残留清单（无 P0/P1）

| # | 级别 | 事项 | 建议动作 |
|---|---|---|---|
| R-0 | P2 | **行尾纪律（候选-53）被误判为 clean**：初审 C-2 的 L-E02 与本轮初次 LR2-E05 都用了 grep 行匹配式的行尾检查，在本 shell 的引号形态下给出「100% CRLF」的假读数；按字节复测（LR2-E05 已订正）为——`workflow-driver.mjs` 混入 103 行裸 LF、`package.json` 混入 1 行、`as-built/relay-core.md` 混入 3 行，三个新增生产文件整体为 LF 而同目录未触碰文件均 CRLF，workspace 六件文档同样混合。**功能影响为零**：仓内 `core.autocrlf=true` 且无 `.gitattributes`，提交时 blob 归一为 LF、检出时再展开为 CRLF，故合入后的树是齐的；缺陷在**证据成色与「clean」结论的成色**（候选-12 形态），不在代码 | ① 收口前用字节计数法（而非 grep 行匹配）复测一次并把结果记进 progress；② 若要工作树也齐，按仓内既有形态把三个新增文件与三处混入行统一为 CRLF；③ 把「行尾复扫必须按字节数 CRLF/裸 LF，不用行匹配」写成候选（本轮未改 `lesson_candidates.md`，措辞见 7.5 附注） |
| R-1 | P2 | 变异证据 E-015 的基线落后最终交付一轮（候选-49）；被变异的门与两条转红用例在最终树逐字仍在，故技术结论可迁移，但账面基线不是最终提交 | 收口前在最终树上重做一次同点位变异（成本约一次单文件 12/12），或在 E-015 追加一句「基线为第二批整改前；门与两条红用例在最终树未变，逐字复核见 review-lessons §7.2」 |
| R-2 | P3 | `progress.md` E-016 的账面自相矛盾：命令列写「`node --test relay-core/test/identity-quota.test.mjs`; **三文件定向**」而结果列写「12/12；**30/30**」，但同一组三文件（identity-quota 12 + herdr-adapter 15 + agent-node 9）应为 36/36（代码轮 2 N-1 已指出）。本轮复验期间主控新增 E-019（记「code2 定向 36/36」）并把「当前节点」行改写为「Store/Attempt 定向 30/30、Herdr/agent 定向 36/36」——即把 30/30 重新归属为另一组，但 **E-016 行本身未动**，其「三文件定向」措辞与 30/30 仍不自洽 | 二选一：把 E-016 命令列订正为该 30/30 实际所跑的文件组，或把结果列订正为 36/36 并引 E-019 / `review-code2-opus.md` R2R-E01。progress 是追加式账本，按候选-10 追加注记而非改旧句 |
| R-3 | P3 | `review.md` 完成条件表未补「有效单测 / 变异点」行；闸门只挂在复核路径表 | 收口时补一行并挂 E-015（订正后） |
| R-4 | P3（本节写入期间已由主控收敛，仅余留痕） | 初审要求的两点中，**失败签名已补**：`findings.md` F-016 现逐字含 `E_SERVICE_NOT_READY:ready-timeout-30000ms` 并明写「本卡不追并发红率」。残留只剩：quiet 全量仍是**单次**绿，未做候选-48 要求的「同并发条件下连续 N 次 + 红率结论」，且该「不追红率」的裁决只落在 findings、未在 `review.md` 完成条件表旁注明 | 认可「不追红率」即可（本卡非并发议题），建议收口时在 `review.md` 完成条件表的证据列标一句「全量为 quiet 单次终态，并发红率不在本卡范围，见 F-016」 |
| R-5 | P3 | `task_plan.md` 未点名任何在册候选作为施工约束（候选-55） | 后续 heavy 卡的 task_plan 固定加一行「本卡点名遵守的在册候选」，复核清单配一问「点名的教训，代码里守了吗」 |
| R-6 | P3 | `brief.md:37` 的 `as-built/relay-core.md` 允许路径行未像 `:36` 那样内联标「**失序补录**」，仅 F-017 有记 | 与 `:36` 对齐，行内加「**失序补录**，见 F-017」 |

> **本节写入期间的并发更新**：主控在本实例落盘 §7 的同时更新了 `progress.md`（新增 **E-019**：三路复验 APPROVED、code2 定向 36/36；改写「当前节点」行）与 `review.md`（代码轮 2 / 需求 / 一致性三行回填为 APPROVED，教训行仍标「待复验」）。本节 7.1~7.4 的取证与结论均在更新前后各自成立（LR2-E01~E06 是对代码与测试文件的静态取证，不受这两处文档更新影响）；受影响的只有 R-2 一条，已按最新状态重述。

> **R-0 衍生的可搬运候选（只写在本文件，供主控裁决后搬运）**：候选-53 的**测法**要写死——行尾核查必须比对文件内 CRLF 与裸 LF 的**字节计数**，不能用行匹配式的 grep（引号形态一变就静默给出「100% CRLF」的假读数）；且核查对象要包含「本卡新增的文件是否与同目录既有文件同形态」，不能只看单文件内部是否自洽。本条同时是候选-12 的一个新实例：两轮复核都基于同一条假读数写出了「clean」。

### 7.6 复验小结

- 初审两条 P1 **全部闭合**，且都不是靠文字口径闭合：P1-1 由真实施加并还原的 R2-M1 变异（红 8/10 → 还原 10/10）闭合，P1-2 由夹具改成 `Receipt=backup / detail=source` 后可静态复算出断言分叉闭合。
- 初审三条 P2 中，候选-33/11（对称变体）与候选-50 家族（platform）已闭合；候选-48 家族大体闭合（升 findings + 失败签名 + quiet 终态），残留只在「未测红率」这一点，且已由 F-016 明文裁为不在本卡范围。三条 P3 中 stop 钩子已闭合，用例数增量已可由 244→249 复算，仅 `task_plan` 点名冻结引用未做。
- 初审 §5 的三条新候选已全部落进 `lesson_candidates.md`，措辞与本文件同源；本轮**未再改** `lesson_candidates.md` 或教训库。
- **本轮唯一新增发现是 R-0（P2）**：初审 C-2 判「行尾纪律 clean」所依据的读数是假的，按字节复测为普遍混合行尾。因仓内 `core.autocrlf=true` 且无 `.gitattributes`，提交后的 blob 与检出树都会归一，**功能影响为零**，故不升 P1；但它是候选-12「证据覆盖不足、结论按覆盖充分书写」的又一实例，且这次踩坑的是复核方自己（两轮都基于同一条假读数），值得进教训库。
- 本卡对候选-54（派工前 fresh 只读预审）、候选-40（模型形态并列取证）、候选-36（无真实样本时显式声明差距）的正面佐证依然成立，建议主控裁决教训库时一并登记。
- 本轮只读，未跑测试、未施加变异、未派活、未问用户、未改任何代码 / 测试 / 计划状态 / `lesson_candidates.md` / 教训库；唯一写入文件为本文件第 7 节。

RECHECK_RULING: APPROVED
open P0: 0
open P1: 0（本路径。`findings.md` F-011 为需求路径提出的 P1 且状态 `transferred`，其接受与否由主控/需求路径与用户裁决，不由教训路径关闭或否决）
