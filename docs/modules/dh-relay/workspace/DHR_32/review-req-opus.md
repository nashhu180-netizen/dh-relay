<!-- dh:v1 · workspace/DHR_32/review-req-opus.md -->
# DHR_32 · 需求方向复核（fresh 只读侦测型）

> 复核对象：提交 `0269981`（五份 evidence + `relay-core/profiles/` schema/校验器/fixture + 仓外注册表候选 `%USERPROFILE%\.dh-relay\executor-profiles.json`）。
> 对照材料：DevPlan §3.2 DHR_32 验收口径 / §2.3、design/02 B4 与 B15⑤、design/05 §7.1。
> 复核形态：只读。未创建/修改除本文件外的任何文件，未做任何 git 写操作，未派活。为核实事实执行了三类只读命令：`Get-ChildItem`/`Get-Content` 读文件、`[Environment]::GetEnvironmentVariable` 查环境变量、`node profiles/validate-profiles.mjs <仓外注册表>`（校验器本身只读）。未读代码轮复核的任何输出。
> 判断范围：不做代码细审，只判「交付是否对准原始需求」。

## 总评（先给结论）

- **诚实性达标**：`claude5` 目标 CLI 不存在如实标 `unverified`/`unproven`、`codex-ninth` 的「Not logged in」如实登记、quota 样本缺如实写「不可证」、全量 `npm test` 190/191 未伪称全绿并另立 F-2 —— 这一项做得好，没有编造。
- **但「不可证项不影响后续使用」不成立**：注册表五条里有两条（`herdr.codex.ninth`、`herdr.claude.account5`）现在派下去必然失败，而注册表**没有任何机器可读的方式表达这一点**，校验器对 golden 仍判 `ok:true`。
- **原始诉求「派活时不靠猜」只兑现了一半**：命令别名、配置指纹、能力位这三样进了机读注册表；但「这条现在能不能派」「该用 `agent start` 还是 `pane run` 拉起」这两个派活时最先要问的问题，仍要人去翻 evidence markdown。
- **最硬的一条**：交付的仓外注册表候选，用校验器默认方式跑**直接被拒**（实测见 P1-1）。完成条件 1 的「达成」自评在这一点上不成立。

---

## P1

### P1-1 · 仓外注册表候选默认校验直接 REJECT，完成条件 1 仅在测试硬编码注入下成立

**事实**（本轮实测）：

```
> node profiles/validate-profiles.mjs "$env:USERPROFILE\.dh-relay\executor-profiles.json"
REJECT E_UNRESOLVED_CONFIG   (exit 1)
```

原因：`herdr.codex.ninth` 的 `config_fingerprint_rule.path_template` = `${CLI_PROXY_HOME}/codex-ninth/config.toml`，而 `CLI_PROXY_HOME` 在本机 **Process / User / Machine 三个作用域全部未设**（实测均为空）。`validate-profiles.mjs:42` 遇到未展开的占位符即返回 `null` → `E_UNRESOLVED_CONFIG`，且是 fail-fast return，整份注册表被拒。

唯一能让它通过的地方是 `test/profiles.test.mjs:26`，测试在调用时硬塞了 `CLI_PROXY_HOME: 'D:/MyFiles/ai-workflow/tools/CLIProxyAPI'`。

**为什么是需求问题**（三层，逐层加重）：

1. **完成条件 1 的机器证是假的**。B4 要的是「注册表条目解析到真实 config_dir」，被验收的对象是**仓外那份注册表**（brief 交付物 3、task_plan 步骤 6/7 都点名它）。现在它在真实环境里解析不了，只在测试自造的环境里解析得了。`progress.md` DONE 第一条写「达成 …… `validateProfiles` 对 golden 执行 config/alias 解析」，回避了「需要注入一个本机不存在的环境变量」这个前提——这句自评应改写。
2. **DHR_33/34 会立刻踩到**。下一张卡消费注册表的最自然写法就是 `validateProfiles(JSON.parse(读 ~/.dh-relay/executor-profiles.json))`，第一步就红。而它会红在 `codex-ninth` 这条——恰好是 B4 点名要「真实拉起一棒」的那条。
3. **脱敏被自己绕过去了**。evidence（`audit-codex-ninth.md:15`）刻意把该路径掩码成 `%CLI_PROXY_HOME%`，`golden-registry.json` 也守住了模板形态；结果 `test/profiles.test.mjs` 把明文本机绝对路径 `D:/MyFiles/ai-workflow/tools/CLIProxyAPI` 写进了仓内。虽然不含真实用户名、不违反 brief 的「不出现真实用户名字面量」字面规则，但它让掩码这件事在同一次提交里失效了，且这个路径会随仓库走。

**建议处置**（择一，都不需要扩字段闭集）：

- (a) 把 `codex-ninth` 的 `path_template` 换成 `${USERPROFILE}` 相对可展开的真实形态（若该配置根实际不在家目录下则不适用）；
- (b) 由本卡冻结「注册表消费方必须提供的环境变量清单」并落进 evidence + DevPlan §2.3 备注，同时把测试里的硬编码改为从该清单读取、缺失即 skip 并标注，不再把本机绝对路径写死进仓；
- (c) 若二者都不成立，则完成条件 1 对 `codex-ninth` 应如实记「受限达成（依赖未冻结的外部环境变量）」而不是「达成」。

**倾向 (b)**：它同时解掉「假机器证」和「脱敏被绕过」，代价最小。

### P1-2 · P6-M2「可重复身份探测」的规定承载物缺失

DevPlan §2.3 写死了承载方式：**「『可重复身份探测』由 evidence 登记探测命令 + 掩码输出承载，注册表侧只存 `expected_identity` 掩码值。」**

实际：

| 入口 | evidence 里的探测命令 | expected_identity |
|---|---|---|
| codex | `codex login status` ✅ | 不可证 |
| codex-ninth | `codex-ninth login status` ✅ | 不可证 |
| claude | **无命令**（只写「字段 `oauthAccount.email` 存在，脱敏值为 `hy***@gmail.com`」） | `hy***@gmail.com` |
| claude-grok | 无命令 | 不可证 |
| claude5 | 无命令 | 不可证 |

**唯一一条写进注册表、且 B4 要求「脱敏账号主体与 expected_identity 匹配」的 Profile（claude 主号），恰恰是没有登记探测命令的那条。** 两条有命令的反而都不可证。

后果：DHR_34 要做「Receipt 记 account_alias 且与 expected_identity 匹配」时，没有一条可复跑的探测入口——只能自己重新去猜「读 `.claude.json` 的哪个字段、怎么掩码」，而掩码规则（保留首 2 字符 + `***` + 域名）目前只写在 task_plan 里，没进 evidence 也没进注册表。这正是本卡要消灭的「靠猜」。

**建议**：在 `audit-claude.md` 补一条可复跑的只读探测命令 + 其掩码输出（形如「读 `~/.claude/.claude.json` 的 `oauthAccount.email` → 掩码规则 → `hy***@gmail.com`」，命令化到能直接粘贴执行），并把掩码规则一并落进 evidence。其余四条如实保留「不可证」。

### P1-3 · 注册表无法表达「这条现在能不能派」，两条必失败的 Profile 混在里面且校验通过

五条 Profile 的真实可派性：

| Profile | 现在派下去会怎样 | 注册表里怎么表达的 |
|---|---|---|
| `herdr.codex.main` | 可派 | 正常 |
| `herdr.claude.main` | 可派 | 正常 |
| `herdr.claude.grok` | 可派 | 正常 |
| `herdr.codex.ninth` | **必失败**（`login status` = Not logged in） | 与可派的三条**外观完全一致**，`capabilities` 六项全 `supported` |
| `herdr.claude.account5` | **必失败**（目标 CLI 文件不存在） | `product: unverified` + 全 `unproven` + `headless_supported:false` |

三个问题：

1. **`codex-ninth` 的未登录状态在注册表里零表达**。它的能力位六项全标 `supported`，`fallback_profile_ids` 还被 `codex.main` 指着当备选。一个未登录的账号，`--help` 当然列得出 `--sandbox read-only` 和 `exec`——能力位交叉断言（`profiles.test.mjs:59`）查的是 help 文本，查不出「这个账号根本用不了」。**「能力位可用」与「这个 Profile 现在可派」被混成了一件事。**
2. **`claude5` 只能靠「`product:unverified` + 全 `unproven`」隐含表达不可用**，这是个约定，不是契约——没有任何文档说明「消费方看到什么就该跳过这条」。DHR_33 的 Adapter 作者要自己发明这条规则。
3. **`E_UNRESOLVED_ALIAS` 只证「入口名可解析」，不证「目标可执行」**。`audit-claude5.md:7` 自己点破了这一点（「此仅证明入口命令存在，不证明其目标 CLI 可用」），很诚实——但这个洞没有被任何机制补上，校验器对 `claude5` 照样放行。

**与 P6-M2 的直接冲突**：P6-M2 说「每个**启用** Profile 有可重复身份探测或明确标记不可证；不可证身份的 Profile 不用于要求账号身份的验收」。注册表根本**没有「启用/停用」这个概念的表达手段**（§2.3 字段闭集里没有 `enabled`/`state`），所以「启用 Profile」这个限定词在本卡交付上落不了地。

**与 B4 的直接冲突（这条最该上报）**：B4 的机器证原文是「同一 run 内 claude 与 codex（**ninth**）各一棒交棒 …… 取不到/不匹配则本项不通过，**不得宣称 ninth**」。现在 `codex-ninth` 未登录且身份不可证 → 按 P6-M2 它不得用于要求账号身份的验收 → **B4 / P6-M1 在 DHR_35 将无法通过**。这是个跨卡阻断风险，evidence 里如实记了原始事实，但**没有升级为 `findings.md` 条目、也没有回写 DevPlan 备注**，主控和用户看不到它。findings.md 现在只有 F-1（复核形态迁移）、F-2（测试抖动）两条 open，都不涉及这个。

**建议**：

- (a) 立即在 `findings.md` 加一条 P1/open：「`codex-ninth` 未登录 → B4 点名的 ninth 一棒与 P6-M1 存在阻断风险，需用户回归后决定：登录该账号 / 换 B4 的目标 Profile / 记受限」——这是**本卡范围内就该做完的登记动作**，不需要改代码。
- (b) 「怎么表达一条 Profile 当前不可派」需要一次 B-事件（扩 §2.3 字段闭集加 `enabled` 或等价物，或明文冻结「`product:unverified`/全 `unproven` = 消费方必须跳过」的约定）。本卡不该自行扩字段，但应把这个缺口作为 findings 上报给 DHR_33。

---

## P2

### P2-1 · 「工作目录规则」这个需求项在传导中被静默丢掉了

DevPlan §3.2 DHR_32 **目标**原文：「逐一核对实际命令、**配置来源与工作目录规则**、账号身份可观测信号 ……」
design/02 B4 原文：「注册表条目解析到真实 `cli/config_dir/`**`work_dir_root`** 并被实际使用」。

实际：全仓检索 `work_dir` / `工作目录` —— **只在 DevPlan:123 那一处出现**。brief 的完成条件（逐字复制自验收口径）里没有、task_plan 步骤 1 的 evidence 模板里没有、五份 evidence 里没有、§2.3 字段闭集里没有、注册表里没有。

也就是说：验收口径这一条在从 B4 抄进 DevPlan §3.2 时已经把 `work_dir_root` 摘掉了，brief 忠实复制了摘掉后的版本，于是整条需求消失得无声无息。**这不是执行者的问题，是需求传导的问题**，但复核方向上必须点出来。

要注意 `CODEX_HOME`（codex-ninth）和 `CLAUDE_CONFIG_DIR`（grok/claude5）都是 **config_dir**，不是 work_dir——所以不能说「evidence 里已经有了」。真正的 work_dir_root（run 在哪个仓/哪个目录起）目前无人承接。

**建议**：明确二选一并落档——(a) 在 DevPlan 备注写「`work_dir_root` 归 DHR_33（Adapter launch 时决定），本卡不承接」；(b) 本卡补 evidence 一节。倾向 (a)，但不能就这么没了。

### P2-2 · 「怎么把它拉起来」这个派活最关键的事实没进注册表

evidence 里有两条极有价值的实测结论：

- codex 系 = `herdr agent start --kind codex`（直接可用）；
- claude 系 = `herdr pane run` + 自动识别 + rename（**因为 claude kind 有 PATH shim 坑**）。

这正是「派活时不靠猜」的核心内容，但它们只以自然语言躺在五份 markdown 里，注册表字段闭集（§2.3）没有承载位。DHR_33 写 Adapter 的 `launch` 时，仍然得有人去读 `audit-*.md` 才知道两类入口拉起方式不同。

同类还有一条更隐蔽的：**`claude-grok` 是 PowerShell Function，`where.exe` 不命中**（BLOCKED-1 的起因）。这意味着它**只能经 shell 拉起，不能被直接 spawn**。主控在 BLOCKED-1 裁决里意识到了这点（task_plan 步骤 3 规则 6 写了「与 herdr pane run 经 shell 拉起的真实执行语义一致」），但 `audit-claude-grok.md` 只登记了「解析形态 = function、fallback 可解析」，**没有把「因此不可直接 spawn」这个可执行性约束写出来**。DHR_33 若用 `child_process.spawn('claude-grok')` 会直接失败，而注册表和 evidence 都不会警告他。

**建议**：evidence 里对每个入口补一行「拉起方式约束」（可 spawn / 必须经 shell / 必须经 `pane run`），并作为 findings 上报 DHR_33——字段闭集是否要扩由 B-事件决定，本卡不自行扩。

### P2-3 · quota 维度 5/5 全空，DHR_34/B5 没有任何输入且未显性登记

`quota_detector_id` 在字段闭集里，但 golden 五条**零使用**。五份 evidence 的 quota 节：四条「样本缺，不可证」，`claude-grok` 有一条真实 502 记录但自评「可复用 quota detector 不可证」（判断正确——502 是网关错误不是额度耗尽，不该硬凑成 detector）。

结论本身是诚实的，**「不为了造样本去烧额度」也是对的**。问题在于：DHR_34 的验收口径是「冻结正反样本——高置信 quota → fallback fresh Attempt；非额度错误 → 不判 quota」，本卡是它的上游，现在交付了一个 quota 输入完全为空的注册表，而 `findings.md` 里**没有一条记录这个前置缺口**。DHR_34 开工时才发现「上游没给样本」，就晚了。

**建议**：`findings.md` 补一条 P2/open，写明「quota 正反样本 0 条入册，DHR_34 开工前需先决定取样方式（真实触发额度耗尽 / 从历史日志捞 / 记受限）」。

### P2-4 · fallback 互指成环，且指向一条不可用的 Profile

`herdr.codex.main.fallback_profile_ids = ["herdr.codex.ninth"]`，`herdr.codex.ninth.fallback_profile_ids = ["herdr.codex.main"]`。校验器只查 dangling（`E_DANGLING_FALLBACK`），不查环、也不查被指向者是否可用。

叠加 P1-3：`codex.main` 额度耗尽 → 切 `ninth` → ninth 未登录必失败 → 按互指关系又切回 `main`（已耗尽）。B5/design/06 H12 要的「fallback 产生 fresh Attempt」在这份注册表上跑不通。

**建议**：evidence/findings 登记该约束（「codex 侧 fallback 链在 ninth 登录前不成立」），并把「fallback 环检测」作为 DHR_34 校验器需求上报。本卡不必现在实现。

### P2-5 · schema 的 ID 空间排斥 `dsh.*`，与本卡点名的 Oracle（design/05 §7.1）不一致

完成条件 2 点名 design/05 §7.1 作为 Oracle。§7.1 的 Executor Profile 示例清单是：

```
herdr.codex.default / herdr.codex.ninth / herdr.claude.default / herdr.claude.grok / herdr.claude.minimax
dsh.native.planner / dsh.review.codex-one-shot / dsh.review.claude-one-shot / dsh.diagnoser.readonly
process.gate / process.finalizer
```

而 schema 的 `executor_profile_id` pattern 是 `^(herdr|process|pi-agent)\.[a-z0-9-]+\.[a-z0-9-]+$`，`backend` enum 是 `herdr|process|pi-agent` —— **`dsh.*` 四条被硬拒**。

其中 `dsh.diagnoser.readonly` 尤其要紧：它正是完成条件 4 的 Oracle（B15⑤「诊断 agent 只读承载 = 注册表能力位」）里那个角色。本卡冻结的 schema 装不下它。

不阻断 DHR_33（herdr-only），但 §2.3「角色两分」把 `dsh.*` 明确划在 executor 侧（「`executor_profile`（herdr.codex.* / herdr.claude.* / pi-agent.* / process.*）」——注意这里 §2.3 自己就已经把 `dsh.*` 从 executor 列表里去掉了，与 design/05 §7.1 冲突）。**两份权威文档对 `dsh.*` 归属的说法不一致，本卡按 §2.3 实现是对的，但这个冲突应该被记下来**，否则 DHR_34/35 做 diagnoser 时会撞上。

**建议**：findings 记一条「design/05 §7.1 与 DevPlan §2.3 对 `dsh.*` 是否属 executor profile 的口径冲突，待 B-事件澄清」。

### P2-6 · 零凭据红线的「有效单测」没有证明红线本身有效

两份凭据 negative fixture 都打在**顶层**、`profiles: []`：

```json
{"api_key":"fixture-only","profiles":[]}
{"expected_identity":"sk-ant-api03-xxxxxxxxxxxxxxxx","profiles":[]}
```

而顶层已有 `additionalProperties:false`，这两个字段**本来就会被 schema 拒**。变异测试的记录（`progress.md:17`）也印证了这点：短路 `E_CREDENTIAL_FIELD` 分支后，测试之所以红，是因为 error code 从 `E_CREDENTIAL_FIELD` **退化成了 `E_SCHEMA`**——也就是说，黑名单分支即使完全失效，这份 fixture 依然被拒。

**变异测试证明的是「error code 会变」，不是「零凭据红线会破」。** 而 brief 交付物 4 要的是「含『凭据字段必拒』断言」。

真正未被覆盖的、也是现实里最可能发生的形态：凭据值出现在**合法 entry 的自由字符串字段值里**（`account_alias` / `command_alias` / `quota_detector_id` 都是 `minLength:1` 的自由 string，schema 拦不住，只有 `CREDENTIAL_VALUE` 正则拦得住）。这个场景零测试。

注：这条可能与代码轮复核重叠，但它是完成条件 2/3 的证据强度问题，从需求侧必须点出。

**建议**：补一份 negative fixture——合法 entry 内 `account_alias: "sk-ant-api03-<16位以上>"`，期望 `E_CREDENTIAL_VALUE`；并把变异点从「黑名单分支」换成「`CREDENTIAL_VALUE` 数组」，这样变异后才是真红。

### P2-7 · `product` 分不出「真 Anthropic 账号」与「第三方网关壳」

`herdr.claude.main` 与 `herdr.claude.grok` 在注册表里：`product` 同为 `claude-code`，`capabilities` 六项**逐项完全相同**，`backend` 相同。机器上唯一的差别是 `account_alias` 字符串和 config 路径。

但 evidence 自己写清楚了 grok 是「Claude Code **网关壳**入口」——它的 shim 设 `ANTHROPIC_BASE_URL` 改道第三方网关，后端模型不是 Anthropic 的。派同一个只读诊断任务给这两条，行为和失败模式都不同（网关侧有 502、需指定具体模型等已知坑）。

B4 要「Claude 多入口配置边界**可观察**」。现在配置边界（config_dir）可观察，**但「后端是谁」不可观察**。消费方要区分只能靠 `account_alias` 里 `-gw` 这个人肉命名约定。

**建议**：至少在 evidence 显式登记「grok 为网关壳、后端非 Anthropic、已知需指定模型」，并作为字段闭集缺口上报（是否需要 `backend_vendor` 之类由 B-事件定）。

### P2-8 · `headless_supported`(bool) 与 `capabilities.headless`(三值) 语义错配

`claude5`：`capabilities.headless = "unproven"`，但 `headless_supported = false`。

三值枚举里的「未证」被布尔字段压成了「不支持」。对 `claude5` 这条本来就整体不可用，影响有限；但这是**字段闭集的结构性问题**——任何将来 `unproven` 的入口都会被迫在这个布尔上表态，把「不知道」写成「不行」。消费方读 `headless_supported:false` 会当成确定结论。

另外这两个字段本身语义重复（`capabilities.headless` 已经涵盖）。§2.3 冻结了闭集，本卡不能改，但应上报。

**建议**：findings 记一条，交 DHR_33/34 合并或明确二者优先级。

---

## P3

### P3-1 · `supported_platforms:["win32"]` 把「Linux 未证」表达成了「不支持 Linux」

Linux 按 B-22 调整①**延后**，evidence 五份都如实写了「延后」。但注册表里的表达是「数组里没有 linux」= 不支持。这是保守方向的失真（fail-closed，不会误派），可接受，但语义有损：DHR_33/35 补证 Linux 后，需要有人记得回来改这五条。

**建议**：evidence 或 findings 加一句「win32-only 是『Linux 未证·延后』的保守表达，非否定结论；P6 阶段闸裁决后需回填」。

### P3-2 · 能力位交叉断言只做正向，守不住「误标不支持」

`profiles.test.mjs:69` 只对 `state === 'supported'` 的能力位去 evidence 里找开关正则。B15⑤ 的原文是「`readonly` 等能力位对应到真实 CLI 实现 ……**不支持者明确标不支持**」——后半句同样是验收内容。

现在如果有人把 `codex` 的 `readonly` 误标成 `unsupported`，测试照样绿。断言防住了「证据不足时随手标 supported」（P2-4 裁决的原意），但没防住反方向。

**建议**：对 `unsupported` 加一条反向断言——evidence 中若能匹配到该能力的开关正则则失败，或至少要求 evidence 里出现「不支持」字样 + 理由。低成本。

### P3-3 · F-1 的机器只读复核迁移路径实际只剩单点

F-1 计划「DHR_33 起复核改走注册表中 `readonly=supported` 的 Profile 执行机器只读」。但注册表现状：claude 系三条全 `readonly=unsupported`，codex 两条 `supported` 而 `codex-ninth` 未登录 → **实际可用的机器只读复核 Profile 只有 `herdr.codex.main` 一条**。

这与 §3.3「两轮独立换人复核」有张力：要机器只读就只能用 codex 主号，两轮就换不了人；要换人就有一轮回到 prompt 型侦测只读。

不是本卡的缺陷（是事实使然），但 F-1 写下的迁移路径在当前注册表上走不通，应该在 F-1 条目里补这个约束，免得 DHR_33 开工时以为路已经铺好了。

---

## 对四个判断点的直接回答

**① 四条完成条件是否各有真实证据支撑**

| 完成条件 | 结论 | 依据 |
|---|---|---|
| 1（解析到真实 cli/config_dir + 身份可证或标不可证） | **不达成** | 仓外注册表默认校验 REJECT（P1-1）；「可重复身份探测」的规定承载物缺失（P1-2） |
| 2（字段闭集 + 零凭据） | **达成，但证据强度不足** | 闭集与 `additionalProperties:false` 到位、仓外扫描零命中；但红线的有效单测没证明红线本身有效（P2-6） |
| 3（工件零凭据 + 白名单脱敏） | **基本达成，有一处自我绕过** | evidence 掩码执行到位、shim 正文未入仓；但 test 把 evidence 掩码掉的本机绝对路径明文写回仓内（P1-1 第 3 层） |
| 4（能力位对应真实 CLI 实现） | **达成** | 六项能力位逐条有 help 依据，claude 无机器只读如实标 `unsupported`、claude5 如实标 `unproven`，且有机读交叉断言。唯一弱点是只做正向（P3-2） |

**② 不可证项的处理是否诚实、是否不影响后续使用**

- **诚实：是。** 三类不可证（claude5 不可执行、部分账号主体不可证、quota 样本缺）全部如实登记，没有一处编造，没有把单跑绿伪称全量绿，没有为凑样本去烧额度。这一点应当明确肯定。
- **不影响后续使用：否。** 三处会实打实传导下去：`codex-ninth` 未登录直接威胁 B4/P6-M1（P1-3）、身份探测命令缺失卡住 DHR_34 的 Receipt 身份链（P1-2）、quota 全空使 DHR_34 无输入（P2-3）。**共同的病根是同一个：这些事实只躺在 evidence 的叙述里，没有一条升进 `findings.md`，也没有回写 DevPlan 备注**——主控和用户在收口时看不见它们。findings.md 现有四条里，两条是已 resolved 的 BLOCKED、两条是测试抖动与复核形态，没有一条是「本卡审计出的、会阻断下游的事实」。

**③ golden-registry 能否真支撑「派活时不靠猜」**

**部分支撑，但在最该不靠猜的地方还得靠猜。**

- 已经不用猜的：命令别名、配置指纹路径模板、六项能力位（且带机读交叉断言）、product、account_alias、稳定 ID 命名。这部分做得扎实。
- 仍然要猜的三件事，恰好是派活时最先要问的：
  1. **「这条现在能不能派？」** —— 五条里两条必失败，注册表外观上看不出来（P1-3）。
  2. **「用什么命令把它拉起来？」** —— codex 用 `agent start`、claude 用 `pane run`、grok 还必须经 shell，全在 markdown 里（P2-2）。
  3. **「它额度耗尽长什么样、该切给谁？」** —— quota 全空，fallback 链互指成环且指向不可用者（P2-3、P2-4）。

**④ 需求层面的遗漏或方向偏差**

- **遗漏**：`work_dir_root` / 「工作目录规则」在传导中静默消失（P2-1）——这是本轮最该抓的方向性问题，因为它不是执行没做好，是需求在文档间传递时丢了。
- **偏差（轻）**：把「五类入口」直接一比一做成了五条 Profile。DevPlan §1 说的是「别名仅为用户已知叫法，**真实映射由审计取得**」——审计的真实结论其实是「本机当前只有 3 条可派、1 条未登录、1 条目标缺失」，注册表却仍按别名平铺了五条同构条目。这不算错（保留占位有价值），但「由证据决定」这句话在结构上没有体现出来。
- **口径冲突（需上报）**：design/05 §7.1 与 DevPlan §2.3 对 `dsh.*` 是否属 executor profile 说法不一致（P2-5）。

---

## 收口建议（按性价比排序）

1. **零代码改动、立刻能做**：把 P1-3(a)、P2-3、P2-4、P2-5、P2-8、P3-1、P3-3 作为 findings 条目补进 `findings.md` —— 这是本卡审计价值传给下游的唯一通道，现在这条通道是空的。
2. **必须改**：P1-1（仓外注册表默认校验被拒）与 P1-2（claude 主号探测命令缺失）—— 这两条直接决定完成条件 1 成不成立。
3. **应改**：P2-6（把变异点换到真正的红线上）、P2-1（`work_dir_root` 归属明确落档）。
4. **可延后**：P2-2、P2-7 的字段闭集扩展交 B-事件；P3-2 的反向断言随手补。

---

REVIEW-DONE 共14条
