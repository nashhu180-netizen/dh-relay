<!-- dh:v1 · workspace/DHR_32/review-code1-opus.md -->
# DHR_32 代码轮1 — fresh 只读复核（提交 `0269981`）

> 复核者：claude fresh worker（实际模型 `claude-fable-5`，文件名沿用主控冻结的 `review-code1-opus.md`）。日期：2026-08-29。
> 审对象：提交 `0269981d0c7d7dc6f1cc35edeb8feb0cbc4ad182`（本工作树 HEAD）全部 23 个改动文件。
> 对照基准：`workspace/DHR_32/brief.md`（完成条件 1–4、脱敏白名单、allowed-paths 闭集）、`workspace/DHR_32/task_plan.md`（步骤 2–8 规格）。
> 形态：只读复核，除本文件外零改动、零 git 写操作、零派活。为核实事实执行的只读命令见每条发现的「机器证」行。

## 结论摘要

- **边界零越界**：改动面 100% 落在 allowed-paths 内（`profiles/**`、`test/profiles.test.mjs`、`package.json` 仅 `scripts.test` 末尾追加一个 token、workspace/DHR_32/**）。`git status --short` 干净，`relay-core/contracts|tools|store|runtime|...` 零触碰。P1-1 裁决的「只许追加一个 token」被严格执行。
- **脱敏合规**：五份 evidence + golden fixture + 仓外注册表零凭据值、零真实用户名字面量（`rg` 复扫无命中）；shim 正文未入仓，只登记环境变量名；`OPENAI_API_KEY` / `ANTHROPIC_AUTH_TOKEN` 等均为**字段名/变量名**登记，符合白名单。progress 的凭据扫描与有效单测哈希记录完整、口径诚实（全量 `npm test` 190/191 如实留档未伪称全绿）。
- **不可放行项集中在三处，全部可机器复现**：
  1. **golden 与仓外注册表在真实环境下被自己的校验器拒收**（`E_UNRESOLVED_CONFIG`），测试靠注入一个本机根本不存在的 `CLI_PROXY_HOME` 才绿——完成条件 1「注册表条目解析到真实 cli/config_dir」的机器证实际不成立，而且把机器绝对路径硬编码进了仓内测试。
  2. **能力位交叉断言（P2-4 裁决）可被"反向文本"满足**，实测把 claude 的 `readonly` 翻成 `supported` 断言照样通过——这条断言当前不验事实，完成条件 4 的机器证是空的。
  3. **schema 的用户名防线是死代码**，`C:/Users/nash/...` 这类真实用户名绝对路径能合法入册。
- P2 四条集中在**测试覆盖不到位**（凭据检查未被隔离验证、`E_UNRESOLVED_ALIAS` 拒收路径零覆盖）和**「不可证」在机读层无法与「漏填」区分**。

---

## P1（阻断：机器证不成立或防线失效）

### P1-1 · golden / 仓外注册表在真实环境被自己的校验器拒收，测试用注入的假环境变量把它糊绿了

- **位置**：`relay-core/test/profiles.test.mjs:26`（`environment: { ...process.env, CLI_PROXY_HOME: 'D:/MyFiles/ai-workflow/tools/CLIProxyAPI' }`）× `relay-core/profiles/fixtures/golden-registry.json`（`herdr.codex.ninth` 的 `path_template: "${CLI_PROXY_HOME}/codex-ninth/config.toml"`）× `evidence/audit-codex-ninth.md`「配置来源」。
- **机器证**：
  - `node -e "console.log(process.env.CLI_PROXY_HOME)"` → `undefined`。本机**没有** `CLI_PROXY_HOME` 这个环境变量，它是 evidence 里为脱敏临时发明的占位符号。
  - `cd relay-core && node profiles/validate-profiles.mjs profiles/fixtures/golden-registry.json` → `REJECT E_UNRESOLVED_CONFIG`，exit 1。
  - `node profiles/validate-profiles.mjs "$USERPROFILE/.dh-relay/executor-profiles.json"` → 同样 `REJECT E_UNRESOLVED_CONFIG`，exit 1（该文件与 golden 逐字节相同，`diff` 无输出）。
- **问题**：三重后果，逐条都踩到验收口径。
  1. **完成条件 1 的机器证是伪造的**。task_plan 步骤 3 规则 5 要求 `path_template` 展开后路径**必须真实存在**，这正是 P1-8 裁决方案 a 用来承载「解析到真实 config_dir」的唯一机制。现在唯一让它通过的办法是测试在内存里凭空塞一个环境变量——校验器验的是"如果存在一个叫 `CLI_PROXY_HOME` 的变量并且它等于这个值，那么路径存在"，这不是"注册表条目解析到真实 config_dir"，是"测试自己写了答案再对答案"。
  2. **交付物 #3（`~/.dh-relay/executor-profiles.json`）是一个自己校验器判不合格的文件**。DHR_33 的 Adapter 一旦按步骤 3 定义的 CLI 入口去校验它，第一步就红。progress.md:18 把它当成已完成交付登记了，DONE 段完成条件 1 自评「达成」——这条自评不成立。
  3. **脱敏自相矛盾**：evidence 小心把该目录掩码成 `%CLI_PROXY_HOME%`，同一提交却把真实机器绝对路径 `D:/MyFiles/ai-workflow/tools/CLIProxyAPI` 明文写进仓内测试文件。虽不含用户名、不算凭据，但这是完成条件 3「路径与环境输出经白名单脱敏」在**仓内代码**上的漏口，且让 `profiles.test.mjs` 变成只能在这台机器上绿的测试。
- **建议**：三选一，并把选择写进 progress：
  - (a)【推荐】`codex-ninth` 的 `path_template` 改用真实存在的环境变量。它的 shim 实测设置的是 `CODEX_HOME`（见 `audit-codex-ninth.md`「命令解析」），若该变量在 shim 外不可见，则退到 (b)。
  - (b) 承认「该入口配置根无法用环境变量占位表达」，**去掉** `codex-ninth` 的 `config_fingerprint_rule`（可选字段），在 evidence 与 DONE 段如实标「配置指纹不可证」，同时在 findings 立一条待 DHR_33 处理。
  - (c) 若确要保留 `${CLI_PROXY_HOME}`，则必须由用户在环境里真正设置该变量，evidence 登记设置事实，测试**不得**注入 `environment`——注入本身就是把机器证掏空。
  - 无论选哪条，`profiles.test.mjs:26` 的硬编码绝对路径都要移除。

### P1-2 · 能力位交叉断言可被"反向文本"满足，P2-4 裁决要防的正是这个，现在没防住

- **位置**：`relay-core/test/profiles.test.mjs:59-74`（`DHR_32 supported capabilities are anchored in their audit evidence`）。
- **机器证**（只读内存实验，未改任何文件）：把 golden 里非 `supported` 的能力位逐个假设翻成 `supported`，再跑同一套断言逻辑：
  ```
  FALSE-PASS: claude      readonly = unsupported -> 断言仍会通过
  FALSE-PASS: claude-grok readonly = unsupported -> 断言仍会通过
  FALSE-PASS: claude5     resume   = unproven    -> 断言仍会通过
  ```
- **问题**：断言把整份 `audit-<alias>.md` 当一个字符串做全文正则匹配，不区分**证实句**与**证伪句**。`audit-claude.md`「能力位」段写的是「`readonly`：**不支持**；未发现等价于机器 `--sandbox read-only` 的开关」——这句话里含 `--sandbox read-only`，于是把 `readonly` 标成 `supported` 也照样能"锚定到证据"。claude5 更极端：它的能力位段只有一行「`interactive`、`resume`、`readonly`… 均不可证」，能力位名字本身就把 `resume` 的正则喂饱了。task_plan 步骤 5.4 引 P2-4 裁决的原话是「防止证据不足时随手标 supported」，当前实现对这个失效模式的检出率是 0。附带一提，`interactive: /interactive CLI|interactive session/` 这类英文短语在中文 evidence 里唯一的出处就是能力位那一行，等于正则和证据是照着对方写的，循环论证。
- **建议**：把匹配范围从「整份文件」收窄到「该能力位自己那一行」，并加一条**否定词护栏**。最小改法：解析 evidence「## 能力位」段的列表行，按 `` `<capability>` `` 定位到唯一一行，在该行内匹配开关正则，且该行不得含 `不支持` / `不可证` / `未发现` / `无` 等否定词；定位不到该行即断言失败（缺行 = 无证据）。同时补一条反向断言：标 `unsupported`/`unproven` 的能力位，其行内**必须**出现否定词——这样两个方向都焊死。

### P1-3 · schema 的「禁止真实用户名字面量」是死代码，`C:/Users/<user>/…` 能合法入册

- **位置**：`relay-core/profiles/executor-profile.schema.json:39`
  `"^(?![A-Za-z]:\\\\Users\\\\)(?:\\$\\{[A-Z_][A-Z0-9_]*\\}|[A-Za-z]:)?(?:/[A-Za-z0-9._ -]+)+$"`
- **机器证**（直接拿 schema 里的 pattern 编译后逐例试）：
  ```
  ALLOW  "${USERPROFILE}/.codex/config.toml"
  ALLOW  "D:/Users/nash/.codex/config.toml"      ← 真实用户名，放行
  ALLOW  "C:/Users/nash/AppData/x"               ← 真实用户名，放行
  ALLOW  "/home/nash/.codex/config.toml"         ← 真实用户名，放行
  ALLOW  "D:/MyFiles/ai-workflow/tools/CLIProxyAPI/codex-ninth/config.toml"
  REJECT "C:\\Users\\nash\\x"
  ```
- **问题**：两个独立缺陷叠在一起。①负向前瞻 `(?![A-Za-z]:\\Users\\)` 用的是**反斜杠**形态，而 pattern 主体 `(?:/[A-Za-z0-9._ -]+)+` 只接受**正斜杠**——任何带反斜杠的串在主体就已经被拒了，所以这个前瞻**永远不会生效**，是纯死代码（唯一 REJECT 的那例是被主体拒的，不是被前瞻拒的）。②前缀 `[A-Za-z]:` 与占位符 `\$\{VAR\}` 是**或**关系且整段可选，于是"裸盘符绝对路径"和"裸 POSIX 绝对路径"都是合法的，task_plan 步骤 2 明写的「只允许 `${VAR}` 环境变量占位」根本没被强制。合起来：schema 声称守住的那条脱敏防线，一条都没守住。golden 本身没踩（五条都用了 `${VAR}`），所以这是**防线失效**而非**已泄露**——但注册表是要长期演进的资产，防线现在不修，下一张卡加条目时就会漏。
- **建议**：把 pattern 收成「必须以 `${VAR}` 开头」，用户名字面量问题自然消失：
  `^\\$\\{[A-Z_][A-Z0-9_]*\\}(?:/[A-Za-z0-9._ -]+)+$`
  若要保留 Linux 系统级绝对路径（如 `/etc/...`），再显式并上一支白名单前缀，而不是放开任意 `[A-Za-z]:` 与任意 `/…`。改完请补一条 negative fixture（见 P2-2）钉死这个行为。

---

## P2（应修：覆盖不到位 / 机读层信息缺失）

### P2-1 · 两份 credential negative fixture 是 schema 非法文档，凭据检查没被隔离验证

- **位置**：`relay-core/profiles/fixtures/negative-credential-field.json`（`{"api_key":"fixture-only","profiles":[]}`）、`negative-credential-value.json`（`{"expected_identity":"sk-ant-api03-xxxxxxxxxxxxxxxx","profiles":[]}`）。
- **问题**：两份 fixture 都把违规字段挂在**顶层**，而顶层 `additionalProperties:false`——也就是说这两份文档就算凭据检查完全不存在，也会被 schema 拒。progress.md:17 的有效单测记录恰好自证了这一点：短路 `E_CREDENTIAL_FIELD` 分支后「目标反例由预期 `E_CREDENTIAL_FIELD` **退化为 `E_SCHEMA`**，因此红」。测试确实会红（变异登记有效），但它红在"错误码变了"，不是红在"凭据漏过去了"。真正危险的场景——**一份 schema 完全合法的注册表，凭据藏在合法字段的值里**（例如 `quota_detector_id` 或 `account_alias` 塞进一个 `eyJ…` / 40 位 hex）——当前零覆盖。而 fail-closed 的价值恰恰只在这个场景里体现。
- **建议**：把两份 fixture 改成「除违规点外完全合法」的单条 profile：`negative-credential-field` 把 `api_key` 放进 profile entry 内层（如 `capabilities` 同级或 `config_fingerprint_rule` 里）；`negative-credential-value` 把 `sk-ant-api03-…` 放进 `quota_detector_id` 这类合法字符串字段。这样变异后测试红在"凭据被放行"，才是真断言。

### P2-2 · `E_UNRESOLVED_ALIAS` 的拒收路径零测试覆盖

- **位置**：`relay-core/profiles/validate-profiles.mjs:87-89` × `test/profiles.test.mjs:35`（所有 negative 一律 `{ resolveAlias: false }`）。
- **问题**：五份 negative 覆盖了 `E_CREDENTIAL_FIELD` / `E_CREDENTIAL_VALUE` / `E_DANGLING_FALLBACK` / `E_SCHEMA` / `E_UNRESOLVED_CONFIG`，唯独 `E_UNRESOLVED_ALIAS` 只有 golden 的**happy path**被走到。这个 error code 是 BLOCKED-1 裁决的产物、是完成条件 1 的另一半承载，却没有任何测试证明它真的会拒。任何一次重构（比如把 `resolvesAlias` 的返回值取反、或 `spawnSync` 失败时误判为 true）都不会被测出来。
- **建议**：补 `negative-unresolved-alias.json`（`command_alias` 用一个必不存在的串，如 `dhr32-no-such-alias`）+ `.expect.json`，并在测试里**单独**对它开 `resolveAlias: true`（循环里按 fixture 名决定该开关即可，不影响其余四条）。顺带把 P1-3 的建议一起钉：加 `negative-username-path.json` 期望 `E_SCHEMA`。

### P2-3 · 两条解析规则都判 `claude5` 通过，而 evidence 明写它的目标 CLI 不存在

- **位置**：`golden-registry.json`（`herdr.claude.account5`）× `evidence/audit-claude5.md`「版本与产品」× `validate-profiles.mjs:51-64`（`resolvesAlias`）。
- **机器证**：`where.exe claude5` exit 0；但 `claude5 --version` 按 evidence 记载失败（目标文件不存在）。另实测 `pwsh Get-Command` 兜底会把**纯 PowerShell cmdlet** 判为可解析：
  ```
  Get-ChildItem  → pwsh Get-Command OK (fallback)
  ```
- **问题**：`E_UNRESOLVED_ALIAS` 实际证明的是「PowerShell 认识这个名字」，不是完成条件 1 要的「解析到真实 cli」。`claude5` 是活证据——它 alias 解析过、config 指纹解析过、校验器判 PASS，但这个 executor 根本跑不起来。evidence 本身很诚实（明写「此仅证明入口命令存在，不证明其目标 CLI 可用」），问题在于**这个诚实只活在 markdown 里，机读层完全看不到**。这不是 worker 的判断失误（两级解析是 BLOCKED-1 裁决冻结的），但裁决时没意识到兜底会宽到收下 cmdlet。
- **建议**：本卡内可做的最小修：`resolvesAlias` 的 pwsh 兜底加 `-CommandType Application,Function,Alias,ExternalScript`（排掉 Cmdlet），并在 evidence 已登记的「解析形态」基础上，把「入口可解析 ≠ 目标 CLI 可用」写进 DONE 段的未决清单（现在 DONE 只说 claude5「如实标 unproven」，没说它的 alias/config 解析是通过的、因而校验器不会拦它）。若判定超出本卡，请立 findings 交 DHR_33。

### P2-4 · 「不可证身份」在注册表机读层与「漏填」不可区分；`codex-ninth` 未登录却被登记为主号 fallback

- **位置**：`golden-registry.json`（五条里只有 `herdr.claude.main` 有 `expected_identity`）× `evidence/audit-codex-ninth.md`「身份信号」（`codex-ninth login status` → **Not logged in**）× `golden-registry.json` 中 `herdr.codex.main.fallback_profile_ids: ["herdr.codex.ninth"]`。
- **问题**：两件事。①brief 完成条件 1 要求「每个启用 Profile 有可重复身份探测或**明确标记不可证**」。当前的表达方式是"省略 `expected_identity` 即不可证"——但省略同样可能是漏填，机器无从分辨，也没有任何断言把 evidence 里的「不可证」结论与注册表的字段缺省绑起来。字段闭集不许加字段，所以只能靠测试补：可以加一条断言「凡 golden 中缺 `expected_identity` 的 profile，其 `audit-<alias>.md` 必须含『`expected_identity` 不可证』字样」，用现成的 evidence 文本把两边焊上。②`codex-ninth` 实测**未登录**，却被登记为 `codex.main` 唯一的 fallback；完成条件 1 后半句「不可证身份的 Profile 不用于要求账号身份的验收」在机读层没有任何承载物——DHR_33 的 Adapter 拿到这份注册表，会把一个跑不出活的备选当成可用备选。
- **建议**：①按上段补断言；②在 evidence `audit-codex.md` 的 fallback 段和 DONE 段的未决清单里明确写「`herdr.codex.ninth` 当前未登录，登记为预登记候选而非可用备选，DHR_33 切换前必须先验登录态」，并在 findings 立一条。

---

## P3（可延后 / 登记即可）

### P3-1 · `capabilities.headless` 与 `headless_supported` 双写，无一致性校验
`golden-registry.json` 每条都同时有 `capabilities.headless`（三值枚举）与 `headless_supported`（布尔）。当前五条自洽，但 schema 与校验器都不阻止 `{"headless":"unsupported","headless_supported":true}` 这种自相矛盾的条目。字段闭集是 DevPlan 冻结的、不能删字段，建议在 `validate-profiles.mjs` 加一条一致性规则（`headless_supported === (capabilities.headless === 'supported')`，或至少禁止"能力位 unsupported 而 flag true"），错误码沿用 `E_SCHEMA` 或新增一个。

### P3-2 · `errors` 恒长 1，除 schema 外所有规则首错即返
`validate-profiles.mjs:79-90` 的三条规则都是命中即 `return`，`findCredential` 也是找到第一条就停。签名是 `{ ok, errors }` 复数，实际除 `E_SCHEMA` 分支外永远只有一个元素。一份有多处问题的注册表要修好几轮才能暴露完。不影响正确性，但和 `E_SCHEMA` 分支（ajv `allErrors: true`，一次全给）的语义不一致，建议后续统一成收集式。

### P3-3 · profiles 数组无 `minItems`、`executor_profile_id` 无唯一性约束、`fallback_profile_ids` 可自引用
`{"profiles":[]}` 是合法注册表；两条 entry 用同一个 `executor_profile_id` 也合法（`ids` 用 Set 去重，重复 ID 的悬挂检查会失效）；`fallback_profile_ids` 填自己的 ID 也能通过悬挂检查。都不是当前 golden 的问题，属于 schema 演进时的坑，建议补 `minItems: 1` 与 ID 唯一性（`profiles` 上加 `uniqueItems` 不够，需要校验器侧查重）。

### P3-4 · pwsh 兜底不带 `-NoProfile`，校验结果依赖用户 PowerShell 配置文件
`validate-profiles.mjs:55-63` 拉起的是**加载用户 profile 的** pwsh。这在语义上是**必要的**（要覆盖 Function/alias 形态，就得加载定义它们的 profile，`claude-grok` 正是这种），task_plan 步骤 3 规则 6 也是这么写的，所以不算实现偏离。但代价要登记：①校验结果随用户 PS 配置漂移，测试非 hermetic；②每次校验都会执行一遍用户 profile 里的任意代码；③golden 那条测试实测 ~1.7s，五个 alias 串行拉进程。建议在 findings 或 DHR_33 的 Adapter 设计里记一笔：alias 解析结果应该由 Adapter 探测一次后缓存，而不是每次校验都重新拉 shell。

### P3-5 · `claude-grok` 有真实 quota 样文，注册表却没登记 `quota_detector_id`
`evidence/audit-claude-grok.md`「quota 样本」拿到了唯一一份真实脱敏样本（HTTP 502 + 「首跑 502 后改指定具体模型」的可复用短语模式），但 `golden-registry.json` 里 `herdr.claude.grok` 没有 `quota_detector_id`，字段闲置。不是缺陷（该字段可选，且 detector 本体不在本卡范围），但这是全五个入口里**唯一**有样本的一条，建议要么登记一个稳定 ID（如 `grok-gw-502`）把 evidence 和注册表接上，要么在 DONE 段说明"detector 定义留 DHR_33，本卡不预置 ID"。

### P3-6 · task_plan 步骤 5 的 `headless` 正则与实现不一致（更严，非缺陷）
规格写 `headless → /\bexec\b|-p\b|--print/`，实现是 `/\bexec\b|-p\/--print/`（要求字面 `-p/--print` 连写）。当前 evidence 恰好都写成 `-p/--print` 所以能过，但这让断言绑死了 evidence 的书写格式——换个写法（`-p` 与 `--print` 分开列）就会假红。若采纳 P1-2 的改法会顺带解决，否则建议回退到规格写法。

---

## 已核对通过、无需处置的项（留档，免得下一轮重复审）

- **allowed-paths 闭集**：23 个改动文件逐一比对，全部在闭集内；`git status --short` 空。`relay-core/package.json` diff 逐字确认**只有** `scripts.test` 末尾追加 ` test/profiles.test.mjs` 一个 token，依赖段、bin、其余 scripts 零改动（P1-1 裁决严格执行）。`task_plan.md` 的那处改动是 BLOCKED-1 裁决回写，与 findings/progress 记录一致。
- **fail-closed 顺序**：`validateProfiles` 先跑 `findCredential` **再**跑 schema（`validate-profiles.mjs:67-77`），凭据检查不依赖文档结构合法，方向正确。`loadAjv()` 每次 new 一个 Ajv 实例，不存在 `addSchema` 重复注册炸掉的问题。
- **五条凭据正则与步骤 7 rg 命令一致性**：`validate-profiles.mjs:8-14`、`test/profiles.test.mjs:11-17`、`task_plan.md:60`、progress.md:20-21 的实际 rg 命令，四处逐字符比对**完全一致**（`sk-[A-Za-z0-9_-]{16,}` / `eyJ[A-Za-z0-9_-]{10,}` / `Bearer\s+\S+` / `[A-Fa-f0-9]{40,}` / `[A-Za-z0-9+/_-]{40,}={0,2}`）。
- **schema 字段闭集**：entry 与顶层均 `additionalProperties:false`；必填 8 项、可选 4 项，与 brief「注册表可存字段闭集」11 个字段逐一对上，无超集无缺项；`capabilities` 六位齐全且 `additionalProperties:false`、值域三值枚举。
- **fixture ↔ expect 对得上**：五组 negative 实跑 `node --test test/profiles.test.mjs` 8/8 绿，每组返回码与 `.expect.json` 一致（`E_CREDENTIAL_FIELD` / `E_CREDENTIAL_VALUE` / `E_DANGLING_FALLBACK` / `E_SCHEMA` / `E_UNRESOLVED_CONFIG`）。
- **evidence 零凭据泄露**：`rg -i "nash|Users|MyFiles"` 扫 `workspace/DHR_32/evidence/**` 与 `relay-core/profiles/**` 零命中（唯二命中在 `review-b22-opus.md` 与 `task_plan.md`，均为本次提交之前既有的规格正文引用，不是本卡产物）。五份 evidence 只登记字段名/变量名（`OPENAI_API_KEY`、`ANTHROPIC_AUTH_TOKEN`、`env_key` 等），无任何值；shim 正文未入仓，只有行数 + 控制流一句话 + 变量名清单，符合 B-22 P1-6 裁决。路径一律 `%USERPROFILE%` / `%APPDATA%` 形态。**唯一的仓内未脱敏路径在 `test/profiles.test.mjs:26`，已计入 P1-1。**
- **progress 口径诚实**：有效单测三段（改坏前 SHA / 红 / 还原后同 SHA / 绿）完整且两次哈希一致；全量 `npm test` 190/191 如实留档并附 master 基线独立复算，未把单跑绿伪称全量绿。findings 的 BLOCKED-1/2 与 F-1/F-2 记录与实际改动可对上。

---

REVIEW-DONE 共 13 条
