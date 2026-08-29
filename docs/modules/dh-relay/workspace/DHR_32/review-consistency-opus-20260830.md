<!-- dh:v1 · workspace/DHR_32/review-consistency-opus-20260830.md -->
# DHR_32 · 一致性复核（2026-08-30，独立只读）

> **模型身份双证（候选-40 口径，冲突照实登记）**
> · 派工身份：DHR_32 一致性复核，按 `--model opus` 语义派出，只读。
> · SessionStart hook 告知：**`claude-fable-5[1m]`**。
> · 系统提示自述：`Opus 5 / claude-opus-5`。
> · 两证冲突未决，**不自称 Opus**，是否满足「复核=opus」形态由用户按候选-40 裁定。
> · 另需登记：本实例在同一 session 内已先做过 DHR_62 的需求方向复核，**对 DHR_32 而言仍是首次接触**（此前未读 DHR_32 的任何复核输出），但**不是全新 session**，请按此折算独立性。
>
> 工作树：`.dh-worktrees/DHR_62`（含 DHR_62 本轮未提交的治理改动）。
> 核查面：`workspace/DHR_32/` 全部工件、实现提交 `2667f4a` 范围、`as-built/relay-core.md` 相关段、DevPlan P6 §2.3/§3.2 与任务表、本轮治理未提交改动。
> 只读自证：除本文件外零写入、零 git 写操作、零派活；唯一执行的产品命令是 `node --test test/profiles.test.mjs`（只读跑测）。

---

## 一、结论

**changes-requested**（P1×1 + P2×4 + P3×5）。

七条链路（schema / validator / tests / evidence / DevPlan / findings / as-built）主干是**咬合的**，而且咬得比一般卡紧——字段闭集三处逐字同源、不可证身份有机读绑定、变异单测两轮哈希齐全，我实跑 12/12 全绿。问题集中在两类接缝：①**「已确认」这三个字没有对话依据**，而它恰好解除了本卡在 R13 上的咬合；②**机读层表达不了「ninth 不可派」**，而 as-built 和 findings 都已经把这句话当结论写下去了。

---

## 二、P1

### P1-1 · findings F-3 标「（已确认）」，但同卡另外两处仍写「待用户」，且确认依据是概括性授权

- **位置**
  - `workspace/DHR_32/findings.md:10`（本轮未提交改动）：状态由 `open` 改为 **`遗留→DHR_35（已确认）`**，处置栏依据写「2026-08-30 用户授权主控代决策并持续施工」。
  - `workspace/DHR_32/review.md:80`（本轮新增人类签名表）：「ninth 遗留处置 | 查看 findings F-3 与 DHR_35 前置动作 | 认可…三选一 | **[ ]**」。
  - `dev_plan/P6-…-开发方案.md:10` 待用户段：「②DHR_32 E10+verify、**F-3（ninth 未登录）**」。
- **冲突**：同一件事，findings 说「已确认」，review 签名区说「待勾」，DevPlan 说「待用户」。二比一，多数口径是未确认。
- **为什么这条是 P1 而不是措辞问题**：`dh-check.mjs:1281-1283` 写明，R13 的合法遗留路径是把 findings 该行状态从字面 `open` 改成 `遗留→<去处>（已确认）`，`:1296` 的失败文案更明写要求「标"遗留→<去处>（已确认）"**+用户对话确认**」。本轮同时把 DevPlan 任务表 DHR_32 状态从 `进行中` 提回 `待验收`（`:123`）——`待验收` 正是 R13 开始咬 open P0/P1 的状态。也就是说：**这一行改动是本卡此刻不被 R13 判失败的唯一原因**，而它引用的「用户 2026-08-30 授权」是「持续治理与代决策」的概括性委托，不是对 F-3「遗留到 DHR_35」这一具体处置的对话确认。AGENTS 宪章 #4 正对着这个位置。
- **处置建议**（择一并留痕）：(a) 拿到用户对 F-3 的明文/点选确认后再标「已确认」；(b) 暂时写成 `遗留→DHR_35（待确认）` 之类不触发豁免的形态，让 R13 如实报出来；(c) 保持现状但在 `DHR_62/findings.md` 明记「此豁免依据为概括性授权、非 F-3 专项确认，待用户回归追认」。**当前三样都没有，且 review 签名区还留着同一件事的空框，等于自己承认没确认。**

---

## 三、P2

### P2-1 · 注册表把「不可派」的 ninth 记成六项全 supported，机读层与 evidence/findings/as-built 三处结论相反

- **位置**：`relay-core/profiles/fixtures/golden-registry.json:16-25`
  ```
  herdr.codex.ninth · capabilities 六项全 "supported" · headless_supported: true
  · 无 expected_identity · 无 config_fingerprint_rule · 是 herdr.codex.main 的唯一 fallback
  ```
- **对照**：`evidence/audit-codex-ninth.md:26`「`codex-ninth login status` 返回「Not logged in」。`expected_identity` 不可证」；`findings.md:10` F-3「未登录 → DHR_35 阻断风险」；`findings.md:13` F-6「fallback 互指成环且 ninth 不可用，fallback 链当前不成立」；`as-built/relay-core.md` 新增 §6.4a「**`codex-ninth` 当前未登录，不能视为可派 Profile**」。
- **判定**：evidence 本身没撒谎——它记的是 **CLI 二进制的开关集合**，与登录态无关，这在事实层是对的。问题在于**注册表是给下游机器读的**，DHR_33/34 从 `golden-registry.json` 只能读到「六项全支持、headless 可用、是 main 的合法 fallback」，读不到任何不可派信号；`config_fingerprint_rule` 又按 rework-1 第 1 条被移除，连 `E_UNRESOLVED_CONFIG` 都不会对它触发。于是 as-built 写下的那句硬结论，**没有任何消费者能从产品数据里推出来**。
- **F-4 已经识别了这个缺口**（「字段闭集无法表达 Profile 当前可派/停用」），但它被定为 P2 且「交 DHR_33 前的 B-事件裁决」——而 as-built 已经先把结论落盘了。建议：要么把 as-built 那句改成「注册表机读层不表达可派性，ninth 不可派仅见 findings F-3/F-4」，要么把 F-4 提前到 DHR_33 开工前必裁。

### P2-2 · 能力位交叉断言的 headless 正则与冻结规格不符，落地版按 evidence 措辞裁剪

- **规格**：`workspace/DHR_32/rework-1.md:15`（主控 2026-08-29 裁决，明写）——「`headless` 正则**回归规格** `/\bexec\b|-p\b|--print/`」。
- **落地**：`relay-core/test/profiles.test.mjs:60` —— `headless: /\bexec\b|-p\/--print/`。
- **差异**：规格的 `-p\b` 与 `--print` 是两个独立备选；落地版把它们合成了字面串 `-p/--print`。当前之所以全绿，是因为 `evidence/audit-claude.md:29` 和 `audit-claude-grok.md:27` 恰好都写成「Help 列出 `-p/--print`」——**断言被裁剪到刚好贴合现有证据措辞**。任何一份 evidence 改写成「支持 `--print`」，这条断言就抓不住了；反过来，规格想覆盖的两种写法现在只认一种。
- **性质**：这正是本卡教训复核点名的「声明已做实未做」复发面（review.md:51 漏-A/漏-C 同族）。且无任何工件登记该偏离。

### P2-3 · 产品测试套件被钉死在本机真实环境 + 本卡工作区文档上，未登记为限制

- **位置**：`relay-core/test/profiles.test.mjs:24`（golden 测开 `resolveAlias: true`）、`:57`（`evidenceRoot = ROOT/../docs/modules/dh-relay/workspace/DHR_32/evidence`）、`:65` `readFileSync(audit-${command_alias}.md)`；配合 `validate-profiles.mjs:88` 的 `existsSync` 与 `:51-63` 的 `where.exe`/`pwsh` 探测。
- **后果**（两条都已进 `npm test` 的显式清单，`package.json` 本卡追加）：
  1. golden 断言要求本机真实存在 `~/.codex/config.toml`、`~/.claude/settings.json`、`~/.claude-grok/settings.json`、`~/.claude-account5/settings.json` **四个家目录配置**，且五个别名全部可解析——换机、CI、别的开发者一律红。
  2. 产品测试**硬依赖 `docs/modules/dh-relay/workspace/DHR_32/evidence/*.md` 的存在与措辞**。哪天这个工作区被归档或改名（DHR_53 就刚被归档过），`npm test` 直接红在一个与代码无关的原因上。
- **findings 覆盖度**：F-9 只登记了「alias 解析非 hermetic 且**慢**」，没登记不可移植与文档耦合。task_plan 步骤 5 断言 1 确实是这么要求的，所以**不是施工方跑偏**——但一个「按规格做出来的已知限制」没进 findings，就等于没交接。
- **建议**：补一条 finding（可派 DHR_33 前处理），说明该测试的环境前提与耦合面，并给出后续解耦方向（如把 evidence 断言改读一份入仓的机读摘要）。

### P2-4 · DevPlan「变更范围」与实际合入范围不符，而 review 声称已全量回写

- **位置**：`dev_plan/P6-…-开发方案.md:142`「**变更范围**：`relay-core/profiles/` schema、用户级注册表候选、`workspace/DHR_32/evidence/`；不动业务代码」。
- **实际** `2667f4a` 还包含 `relay-core/test/profiles.test.mjs`（新增 95 行）与 `relay-core/package.json`（`scripts.test` 追加一个 token）。后者是 B-22 预审 P1-1 裁决方案 (a) 明确授权的，`brief.md:46-47` 也已列入 allowed-paths。
- **冲突点**：`review.md:42`（B-22 裁决段）写「全部采纳项已回写 **DevPlan** / brief.md / task_plan.md（同批提交）」——brief 与 task_plan 确实回写了，DevPlan 这一行没有。
- **判定**：不是越界施工（授权链完整），是权威计划的范围登记漏了一次同步，且被一句「全部已回写」盖住。

---

## 四、P3

| # | 位置 | 事实 |
|---|---|---|
| P3-1 | `relay-core/profiles/validate-profiles.mjs:80-82` | `headless_supported === (capabilities.headless === 'supported')` 这条一致性规则**只登记在 `rework-1.md:20`**，未回流 `task_plan.md` 步骤 3 的规则清单（那里仍只有 6 条），as-built 也没提。且它复用 `E_SCHEMA` 码，与其余四条「一规则一码」的风格不齐，F-10 未覆盖此点 |
| P3-2 | `evidence/audit-codex-ninth.md:7` vs `:44` | 命令解析段写「`where.exe codex-ninth` **成功**，故不需 PowerShell fallback」（即 PATH 上确有 `.cmd` shim），拉起方式约束却写「按别名拉起**必须经 PowerShell shell**」。两句在同一份 evidence 里，读者无法判断 spawn 策略 |
| P3-3 | `evidence/audit-claude5.md:25` | 六个能力位挤在一行「均不可证」。`rework-1.md:15` 的规格是「按 `` `<capability>` `` 定位到**该能力位自己那一行**」；测试 `.find()` 对六个能力位返回同一行，因含「不可证」而全部通过。断言强度低于规格意图 |
| P3-4 | `task_plan.md:93` vs `validate-profiles.mjs:11` / `profiles.test.mjs:13` | review.md:30（E-3202）称「五条正则**四处一致**」。实际步骤 7 的 rg 命令用 `Bearer \S+`，代码/测试/步骤 3 用 `Bearer\s+\S+`，字面不同（语义近似）。「四处一致」宜改为「四处等效，一处字面差异已知」 |
| P3-5 | `progress.md` 本轮新增证据账本 | E-3201~E-3205 是 DHR_62 本轮补录（未提交），内容与 review.md 验收表对得上，属正当回填。但 E-3202 写「**七组** negative fixtures」，而 `task_plan.md:69` 冻结的是五组；多出的 `negative-unresolved-alias` / `negative-username-path` 来自 `rework-1.md:14/17`，账本未标这一出处，读者会以为 task_plan 写的就是七组 |

---

## 五、已核对通过（clean，写下来免得下一棒重查）

1. **字段闭集三处逐字同源**：`brief.md:33` = `DevPlan:108` = `executor-profile.schema.json` 的 12 个 properties，一个不多一个不少；顶层与 entry **双** `additionalProperties:false`（`:6` / `:50`）。超集即违规这条真的焊住了。
2. **验收口径逐字复制属实**：brief 完成条件 1~4 与 `DevPlan:136-139` 四条机器证逐字一致，brief 抬头「逐字复制自 DevPlan」不是空话。
3. **七组 negative fixture ↔ 校验器错误码一一对上**：`E_CREDENTIAL_FIELD` / `E_CREDENTIAL_VALUE` / `E_DANGLING_FALLBACK` / `E_SCHEMA`（unknown-field 与 username-path 各一）/ `E_UNRESOLVED_ALIAS` / `E_UNRESOLVED_CONFIG`，`.expect.json` 全部与实际返回码吻合。
4. **12/12 我独立复跑通过**：`node --test test/profiles.test.mjs` → `pass 12 / fail 0`，与 progress.md:42 的记录一致，不是转述。
5. **package.json 改动确属最小授权面**：`git show 2667f4a -- relay-core/package.json` 只在 `scripts.test` 末尾多了 ` test/profiles.test.mjs` 一个 token，其余键零改动，与 P1-1 方案 (a) 精确吻合。
6. **零凭据是双向钉住的**，不是靠自觉：`validate-profiles.mjs:29/33` 键名黑名单 + 值模式，`profiles.test.mjs:38-54` 对 golden 全文再扫一遍；`expected_identity` schema 强制含 `***`（`:58`）；`path_template` 强制 `${VAR}` 开头（`:39`）并有 `negative-username-path` 钉住。
7. **「不可证身份」有机读绑定**：`profiles.test.mjs:81-87` —— golden 里缺 `expected_identity` 的 profile，其 `audit-<alias>.md` 必须含「不可证」字样。这是完成条件 1「明确标记不可证」少见的可执行落法，比写在文档里强。
8. **能力位反向护栏到位**：`profiles.test.mjs:71-76` 正向要开关正则、反向要否定词，`unsupported`/`unproven` 不写否定词就红。代码轮 P1-2 报的三例 FALSE-PASS 确实堵上了（正则裁剪问题见 P2-2，不影响这条机制成立）。
9. **没有伪造 quota**：全表零 `quota_detector_id`，与 F-5「正反样本 0 条入册」和 evidence「样本缺，不可证」完全一致。
10. **claude5 三处自洽**：`product: unverified` + 六项全 `unproven` + `headless_supported: false`，对上 `audit-claude5.md:25`「目标 CLI 当前不可执行」。brief「不决定 claude5 产品归属（由证据决定）」被遵守了。
11. **变异有效单测两轮都完整**：`progress.md:17`（旧点 `E_CREDENTIAL_FIELD`）与 `:42`（复核裁决后改到 `CREDENTIAL_VALUE` 正则数组）各有「改前 sha256 → 红 → 还原 → sha256 两值相同 → 绿」三段，哈希前后逐字相同。改变异点的理由（旧点有 schema 冗余保护、证据力不足）也在 review.md:33 记着。
12. **BLOCKED-1/2 的处理是诚实的**：BLOCKED-1 用两级 alias 解析解决，明确驳回了「造假式降级」；BLOCKED-2 用 master 上同样红来坐实是既有抖动，机器门槛改判为「不伪称全绿」并把抖动本体记 F-2。两条都没有把环境问题算成本卡通过。
13. **本轮治理对 DHR_32 的改动，有两处是修正而非漂绿**：`review.md:8-10` 的复核者列从「Opus fresh」改成「`--model opus`；SessionStart=fable-5（候选-40待裁）」，教训路从「Opus 独立路径」改成「复用需求轮实例（inline）」——与同文件正文 `:37/:44/:50` 的如实登记一致了。

---

## 六、不可证项

| # | 命题 | 为什么不可证 |
|---|---|---|
| U-1 | 「用户 2026-08-30 授权」是否覆盖 F-3 的遗留处置 | 授权原文未落仓，只在 findings/review 里被转述为「持续治理与代决策」；范围边界属用户裁决域 |
| U-2 | 仓外 `%USERPROFILE%\.dh-relay\executor-profiles.json` 当前内容与 golden 是否仍一致 | 只读复核不出仓，progress.md:41 登记的新 hash `E5F8A8…` 无法在本工作树内复算 |
| U-3 | 五份 evidence 的原始命令输出 | evidence 是脱敏后的转述，原始终端输出未入仓（这是脱敏白名单要求的结果，非缺陷），只能核内部自洽 |
| U-4 | 全量 `npm test` 当前是否绿 | 未跑（F-2 已登记既有抖动，且 P2-3 的环境耦合会让结果与机器状态强相关）；只跑了 `profiles.test.mjs` |
| U-5 | 复核者（含我）真实模型 | 候选-40 双证冲突未决 |

---

## 七、最短处置路径

1. **P1-1**：先定 F-3 的「已确认」是拿确认、还是退回未豁免形态，并让 findings / review 签名区 / DevPlan 待用户三处口径统一。
2. **P2-1**：as-built §6.4a 那句「不能视为可派 Profile」要么标注「仅见 findings、机读层不表达」，要么把 F-4 提到 DHR_33 开工前必裁。
3. **P2-2**：headless 正则按 `rework-1.md:15` 规格改回 `/\bexec\b|-p\b|--print/`，或明确登记「按现有 evidence 措辞收窄」的裁决。
4. **P2-3**：补一条 finding，交接 `npm test` 的环境前提与 docs 耦合。
5. **P2-4**：DevPlan:142 变更范围补 `relay-core/test/profiles.test.mjs` 与 `package.json`。
6. P3 五条可并入同一次修订，不单独起轮。

> 本报告只写事实与级别，不替主控做验收裁决，不代签 verify，不勾人类签名区。

---

# 返工复查（2026-08-30，同实例只读）

> 复查对象：本报告 P1-1 / P2-1~P2-4 / P3-1~P3-5 的整改，落在当前工作树（未提交改动）。
> 模型身份双证同上（SessionStart `claude-fable-5[1m]` / 系统提示自述 `Opus 5`，冲突未决，不自称 Opus）。
> 复查动作：读 `git diff` 全量、重跑 `node --test test/profiles.test.mjs`、重跑 `dh dh-relay`。除本文件外零写入。

## 结论

**approved**（无 P0/P1/P2 遗留；两条 P3 级备注，不阻塞）。

十项逐条都落到了实处，而且是**改到本卡该改的那一层为止**——生产正则与测试环境耦合按用户决策登记成 F-11/F-12 移交 DHR_35，没有在治理卡里顺手动生产代码，符合本卡 docs-only 边界。

## 逐条核销

| 原编号 | 判定 | 核销依据 |
|---|---|---|
| **P1-1** 三处口径冲突 | **已闭合** | 三处现已同向：`findings.md:10` F-3 = `遗留→DHR_35（已确认）`；`review.md` 签名区那行由「ninth 遗留**处置**／认可三选一」改为「ninth **当前状态**／看清『未登录、机读层不表达可派性、DHR_35 必须先裁』三项事实」——不再是一个与「已确认」打架的待批项，而是信息确认项；`DevPlan:10` 待用户段改为「F-3 已按 2026-08-30 用户**「有决策你来进行」**授权移交 DHR_35，未登录事实不变」。关键改进是**授权依据从转述变成了用户原话直引**，与 `DevPlan:47` 记的 2026-08-29 授权同源。用户本轮又明文重申该移交属其决策授权，按此我不再保留 P1；两个签名框仍是 `[ ]`，没有代签 |
| **P2-1** 注册表表达不了 ninth 不可派 | **已闭合** | `as-built/relay-core.md` §6.4a 改为「注册表机读层目前不表达「当前可派/停用」；`codex-ninth` 未登录、当前不可派只由 DHR_32 evidence/findings 记录，**下游不得仅凭六项 CLI 能力位推导它可派**」。这正是我要的那句限定——结论仍在，但读者知道它不是机读事实 |
| **P2-2** headless 正则窄于冻结规格 | **已闭合（转 F-11 遗留）** | `findings.md` 新增 F-11（P2，`遗留→DHR_35（已确认）`），如实写明「实际 `/-p\/--print/` 比 rework-1 冻结的 `/-p\b|--print/` 窄；当前因 evidence 恰写 `-p/--print` 而绿」，并交代 DHR_35 前修正正则并重跑能力位反例。本卡不改生产测试，符合 docs-only |
| **P2-3** 测试钉死本机环境 + 本卡文档 | **已闭合（转 F-12 遗留）** | 新增 F-12（P2，同遗留形态），两个面都写到了：真实 alias/config 解析、直接读 `workspace/DHR_32/evidence/*.md`、换机/CI/工作区归档会红；去向给了具体方向（入仓机读摘要，或 hermetic fixture 与环境测试分层） |
| **P2-4** DevPlan 变更范围漏项 | **已闭合** | `DevPlan:142` 改为「`relay-core/profiles/` schema/校验器/fixtures、`relay-core/test/profiles.test.mjs`、`relay-core/package.json` 的 test script 单 token、用户级注册表候选、`workspace/DHR_32/`」。我对着 `2667f4a` 的 33 个文件复核过，这份清单现在是完整且不超集的 |
| **P3-1** headless_supported 规则未回流合同 | **已闭合** | `task_plan.md` 步骤 3 补规则 7，并注明「由 rework-1 补入实现，DHR_62 治理补回施工合同索引」——出处链没断 |
| **P3-2** ninth evidence 自相矛盾 | **已闭合** | 命令解析段改为「校验器不需 PowerShell fallback；同时 `Get-Command` 还可见同名 Function，**二者是两种可用入口形态**」；拉起方式约束改为「若解析到 Function 必须经 PowerShell shell；若显式用 `where.exe` 命中的 `.cmd` shim，可由支持 cmd shim 的启动器直接执行」。两句现在互补而非互斥 |
| **P3-3** claude5 六能力位挤一行 | **已闭合** | 拆成六行，每行各带「不可证」，与 rework-1「该能力位自己那一行」的意图对齐 |
| **P3-4** 「五条正则四处一致」 | **已闭合** | `review.md` E-3202 证据栏改为「五条模式四处**语义等效**，其中 rg 的 `Bearer \S+` 与代码的 `Bearer\s+\S+` **字面不同**」 |
| **P3-5** 账本未标七组 fixture 出处 | **已闭合** | 账本 E-3202 补「初始五组见 task_plan；unresolved-alias 与 username-path 两组来自 rework-1」 |

## 复查期机器复证（我自己跑的，非转述）

- `node --test test/profiles.test.mjs` → **pass 12 / fail 0**。这一跑是必要的：P3-2/P3-3 改的两份 evidence 正是能力位交叉断言与「不可证」绑定断言的**输入文件**，改措辞有打破断言的真实风险，实测没有。
- `dh dh-relay` → **0 失败 / 61 警告 / exit 0**。与我上一轮看到的「0 失败 / 71 警告」相比，含义变了：那时 DHR_32/33 挂在 `进行中`，R13/R18 根本不咬；现在两卡已回到 `待验收`，两道闸**实际生效**并通过——F-3 走的是 R13 明文写的遗留豁免路径，F-11/F-12 是 P2 本就不在 R13 计数内。这是同一个绿的诚实版本。警告 71→61 属治理副产品，不在本卡口径。

## 剩余备注（P3 级，不阻塞放行）

| # | 位置 | 事实 |
|---|---|---|
| R-1 | `DevPlan` 头部 `阻塞:` 行 | 「findings 下游移交：F-3/F-5→DHR_34/35、F-6/F-7/**F-11**→DHR_35、F-9/F-10→DHR_61」这行未同步本轮新增的 DHR_32 F-11/F-12。且此处的 `F-11` 原指 DHR_33 的 F-11，与 DHR_32 新 F-11 **跨卡同号**，读者容易串。建议移交清单标卡号（如 `DHR_32:F-11`） |
| R-2 | `review.md` 新增「一致性复核（2026-08-30 治理补审）」块 | 裁决措辞（「P1 口径统一；…遗留 DHR_35」）在本复查出结论**之前**就已写下。内容与事实相符、派出证据指向本报告，不构成失实；只是落账顺序上是先写结论后拿复核，下次宜等复核回执再回填 |

> 说明：F-11 描述里把正则简写成 `/-p\/--print/` 与 `/-p\b|--print/`（省略了共同前缀 `\bexec\b|`），与实际代码不冲突，不另立条目。

## 不可证项更新

- **U-1（授权范围）**：此前记为不可证。现状是——`DevPlan:10` 已把依据换成用户原话直引「有决策你来进行」，且用户在本轮对话中再次明文认可 F-3/F-11/F-12 移交 DHR_35 属其决策授权。据此**不再作为阻塞项**，但授权原文仍未落仓，最终范围解释权归用户。
- U-2~U-5 维持原状（仓外注册表现值、evidence 原始输出、全量 `npm test`、复核者真实模型）。

> 复查同样只写事实与级别，不代签 verify、不勾人类签名区。approved 仅指一致性这一路收敛，E10 与 verify 仍待用户。
