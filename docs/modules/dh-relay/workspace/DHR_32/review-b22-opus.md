<!-- dh:v1 · workspace/DHR_32/review-b22-opus.md -->
# DHR-B-22 B-调整预审 + DHR_32 brief/task_plan 预审 — fresh 只读复核

> 复核者：claude（fresh worker，只读）。日期：2026-08-29。
> 审对象：`dev_plan/P6-Herdr多账号执行底座-开发方案.md`（§0.2 B-22 节 + 任务表 DHR_32 行 + 相关正文）、`workspace/DHR_32/brief.md`、`workspace/DHR_32/task_plan.md`。
> 形态：只读复核，除本文件外零改动、零 git 操作、零派活。为核实事实读取了 `relay-core/package.json`、`relay-core/tools/`、`relay-core/test/` 目录与 `tools/audit-contracts.mjs`、`tools/capability-baseline.mjs`、`tools/fixture-manifest.mjs`、`test/control-plane-imports.test.mjs`（均只读）。

## 结论摘要

- **brief 完成条件与 DevPlan §3.2 DHR_32 验收口径逐字比对：一致**（四条全对，仅链接相对深度不同）。唯一瑕疵是第 2 条引用的「§2.3」在 brief 内无对应节（见 P2-11）。
- **不可放行项集中在三处**：①B-22 调整① 的 Linux 延后只写在事件段，计划正文六处硬口径（含 §4.3 解锁规则）未回写，等于阶段闸规则自相矛盾；②task_plan 对 `npm test` 的跑法判断是**事实错误**，新增测试根本不会被 `npm test` 拾取，四条机器证里最硬的一条（有效单测必红/必绿）当场落空；③禁改边界写的是「仓根 `tools/**`」，而 worker 实际会碰的是 `relay-core/tools/**`，三份基线全在后者，目前无保护。
- **脱敏白名单有两个实打实的漏口**：shim 允许全文引用（`claude-grok` 网关壳恰是最可能藏 key 的对象），以及凭据扫描正则漏 `sk-ant-` 与 base64 长串（后者是 B-22 调整② 明文要求但未落地）。
- 验收口径①「注册表条目解析到真实 cli/config_dir」与 §2.3 字段闭集**互斥**，当前无论 worker 怎么干都无法兑现该条机器证，需主控先裁决（P1-8）。

---

## P1（阻断：不修则 worker 会做出无法验收或有泄露风险的结果）

### P1-1 · `npm test` 不会跑到新测试，步骤 5「有效单测」与步骤 8.1「全绿」双双落空
- **位置**：`task_plan.md:11`（Context Packet「测试跑法：`cd relay-core && npm test`（node --test，自动拾取 `test/*.test.mjs`）」）、`task_plan.md` 步骤 5 / 步骤 8.1；实际事实见 `relay-core/package.json:12`。
- **问题**：`package.json` 的 `test` 脚本是**显式文件清单**（`node --test --test-concurrency=4 test/contracts.test.mjs test/store.test.mjs …` 共 17 个文件写死），不是目录通配。新建的 `test/profiles.test.mjs` 不在清单里，`npm test` 永远不会执行它。连锁后果：步骤 5 要求「改坏 → 跑测试记录红 → 还原 → 记录绿」，按 task_plan 给的跑法**改坏也会绿**，有效单测登记会变成一条假证据；步骤 8.1 的「全绿」也证明不了新增覆盖。而 `relay-core/package.json` 既不在 brief 的 allowed-paths 里、也不在禁改清单里，worker 无授权改它。
- **建议**：二选一并写死进 brief——(a) allowed-paths 增列 `relay-core/package.json`，且限定「只允许在 `scripts.test` 末尾追加 `test/profiles.test.mjs` 一个 token，不得改动其他任何键」；或 (b) 改用 `cd relay-core && node --test test/profiles.test.mjs` 作为新测的跑法，并在步骤 8.1 明确「存量回归 `npm test` + 新测单跑，两条命令输出都贴 progress」，同时在 findings 登记「新测未进 npm test 清单，DHR_33 需补挂」。顺带修正 `task_plan.md:11` 的「自动拾取」表述。

### P1-2 · 调整① 与 §4.3 解锁 P7 规则直接冲突，正文未回写
- **位置**：DevPlan `:46`（调整①「解锁 P7 时 P6-M6 只能记『延后/受限』」）vs `:197`（§4.3「P6-M1、M2、M3、M5、M6、M7 **必须通过**；P6-M4 可以是通过或用户明确接受的受限」）。
- **问题**：§4.3 是阶段闸的唯一判定规则，白纸黑字要求 M6 必须通过，且例外名额只给了 M4。调整① 单方面把 M6 也放进「可受限」，却没有改 §4.3。等到 P6 阶段闸真要裁决时，两条规则打架，主控只能再开一次 B-调整，或者被迫按 §4.3 判 P6 不通过。B-调整的意义是**先把口径改到正文**，不是在事件段里另立一条。
- **建议**：在 §4.3 增补一句并标注来源，例如「P6-M6 因 `DHR-B-22` 调整① 用户指示延后 Linux，允许记『延后』并由用户在阶段闸裁决受理或指定补录卡；受理前 P7 不解锁」。修改点必须落在 §4.3 正文，事件段只做指针。

### P1-3 · 禁改边界指错对象：`relay-core/tools/**` 与三份基线实际无保护
- **位置**：`brief.md:30`（禁改列「仓根 `tools/**`」「三份基线（fixture-manifest / capability-baseline / structural-tokens）」）；`task_plan.md` 步骤 3（「参照 `tools/validate.mjs`」）与步骤 8.2（`node tools/audit-contracts.mjs`）。
- **问题**：实测仓根确有 `tools/`（内容是 `adapters/ contracts/ dogfood/ host/ policy/ runner/ tests/`），但 worker 在本卡里会接触的 `validate.mjs`、`audit-contracts.mjs`、`forbidden-types.txt`、`structural-tokens.txt`、`fixture-manifest.mjs`、`capability-baseline.mjs` **全部位于 `relay-core/tools/`**。禁改清单点名了三份基线却没圈住它们所在的目录，而 task_plan 里两次让 worker 去 `relay-core/tools/` 下取用文件——一个 cwd 在 `relay-core` 的 worker 完全可能把「仓根 tools 禁改」理解成「我这个 tools 不算」。
- **建议**：禁改清单把「仓根 `tools/**`」改成「`tools/**`（仓根）**与** `relay-core/tools/**`（含 `validate.mjs` / `audit-contracts.mjs` / `forbidden-types.txt` / `structural-tokens.txt` / `fixture-manifest.mjs` / `capability-baseline.mjs`）」，并在 task_plan 步骤 3 明写「可 `import { loadAjv } from '../tools/validate.mjs'`，只读引用，禁止任何编辑」。

### P1-4 · 凭据扫描正则漏 `sk-ant-` 与 base64 长串，后者是 B-22 明文要求未落地
- **位置**：`task_plan.md` 步骤 3 规则 3（`/(sk-[A-Za-z0-9]{8,}|eyJ[A-Za-z0-9_-]{10,}|Bearer\s+\S+|[A-Fa-f0-9]{40,})/`）与步骤 7 的 rg 命令；对照 DevPlan `:49`（「`sk-`、`eyJ`、`Bearer`、40+ 位**十六进制/base64** 连续串」）。
- **问题**：两处硬缺陷。①`sk-[A-Za-z0-9]{8,}` 要求 `sk-` 后紧跟 **8 位连续字母数字**，而 Anthropic key 形如 `sk-ant-api03-…`，`sk-` 后只有 `ant` 三位就遇到连字符——**不命中**。本卡审计对象里有三个 claude 系入口，这正是最该拦的一类。②DevPlan 要求扫「十六进制**/base64** 连续串」，task_plan 与校验器只实现了 `[A-Fa-f0-9]{40,}` 的 hex 分支，base64 分支整条漏实现（cookie、refresh token 多是 base64）。这条不是风格问题，是 B-调整冻结的要求没落到执行件。
- **建议**：统一改为（校验器与 rg 命令两处同步）`sk-[A-Za-z0-9_-]{16,}`、`eyJ[A-Za-z0-9_-]{10,}`、`Bearer\s+\S+`、`[A-Fa-f0-9]{40,}`、`[A-Za-z0-9+/_-]{40,}={0,2}`（base64/base64url）。最后一条会有噪声（sha256、fixture id），所以配套要求：命中逐条在 progress 归类，并在 `profiles.test.mjs` 里对 golden 文本单独跑一遍这五条。

### P1-5 · 凭据扫描范围漏掉注册表本体与新测试文件
- **位置**：`task_plan.md` 步骤 7（`--glob "docs/modules/dh-relay/workspace/DHR_32/**" --glob "relay-core/profiles/**"`）。
- **问题**：验收②的原话是「**注册表**只含 §2.3 允许字段；Token / API Key / Cookie / 认证材料零出现（扫描 + 白名单脱敏双证）」。而注册表本体按步骤 6 落在 `~/.dh-relay/executor-profiles.json`（仓外），rg 在工作树根跑，**根本扫不到它**——被验收的那个文件恰恰没被扫。另外交付物 `relay-core/test/profiles.test.mjs` 也不在两个 glob 内。
- **建议**：步骤 7 拆成两跑并都贴 progress——①仓内：glob 增列 `relay-core/test/profiles.test.mjs`；②仓外：对 `~/.dh-relay/executor-profiles.json` 单独跑同一组正则（`rg <pattern> "$HOME/.dh-relay/executor-profiles.json"`），并记录该文件的 `Get-FileHash` 与扫描输出，作为「双证」的第二证。

### P1-6 · shim 允许全文引用 = 白名单里最大的口子，且规则是「读后判」
- **位置**：`task_plan.md` 步骤 1.1（「用 `Get-Content` 读 shim 正文（shim 属非敏感结构，**可全文引用**，但若 shim 内出现 token/key 值一律以 `<REDACTED>` 替换）」）。
- **问题**：整份白名单只有这一处开了「全文引用」的口子，而它指向的恰是最可能内联凭据的对象——`claude-grok` 是网关壳，`claude5` 归属未定，这类 shim 常见写法就是在正文里 `set ANTHROPIC_AUTH_TOKEN=…` 或直接拼 URL 带 key。当前规则是「先全文抄进 evidence，再靠 worker 肉眼判断哪些是 token 并替换」——顺序反了：默认动作是泄露，脱敏靠自觉。一旦 worker 判漏一处，凭据就已经落进 evidence 文件了，后面的 rg 扫描能不能兜住取决于 P1-4 那组正则（而它现在有洞）。
- **建议**：反转默认。步骤 1.1 改为：shim 正文**默认不入仓**，只登记「①调用的真实可执行文件路径（家目录按 P2-5 掩码）；②出现的环境变量名清单（只名不值）；③控制流骨架的自然语言描述（几行、是否转发参数、是否设 baseUrl）」。确需引用某行时，逐行判定后引用，且该行必须先过 P1-4 的五条正则。

### P1-7 · 缺「本机配置目录只读」的硬约束，仓外写入点未闭集
- **位置**：`brief.md:25-35`（非目标/硬边界 + allowed-paths）、`task_plan.md` 步骤 1.3 / 步骤 6。
- **问题**：本卡是**唯一**会去翻 `~/.codex`、`~/.claude` 这些凭据目录的任务，档位定「标准」的理由也正是「触及本机凭据环境的读取，属权限安全红线相邻区」（DevPlan `:130`）。但 brief 的边界只管住了「仓内改哪些文件」和「不许写凭据值」，**没有一句禁止对本机配置目录的写入**。步骤 1.4 让 worker 跑 `codex login status` 这类命令——这类命令有可能触发刷新写回配置；步骤 1.3 让 worker 用 `ConvertFrom-Json` 处理 `auth.json`，一个手滑就是回写。同时 allowed-paths 只声明了 `~/.dh-relay/` 一个仓外写点，但没声明「仓外只此一个写点」。
- **建议**：brief 硬边界增两条：①「本机 AI 配置目录（`~/.codex`、`~/.claude`、`~/.claude*`、各 shim 所在目录）**一律只读**：禁止任何写入、重命名、删除、`--login`/`--logout`/会触发凭据刷新的子命令；只跑 `--version`/`--help`/只读 status 类命令，且执行前在 progress 登记该命令为何是只读的」；②「仓外可写点闭集 = `~/.dh-relay/` 一处，其余一律不可写」。

### P1-8 · 验收口径①「解析到真实 cli/config_dir」与 §2.3 字段闭集互斥，当前无法兑现
- **位置**：DevPlan `:125` / `brief.md:14`（「注册表条目解析到真实 cli/config_dir、脱敏账号主体与 expected_identity 匹配」+「每个启用 Profile 有**可重复身份探测**或明确标记不可证」）vs DevPlan `:97` / `brief.md:23` 的字段闭集。
- **问题**：字段闭集里**没有**任何字段能承载 cli 路径、config_dir，也没有字段能承载「可重复身份探测」的探测命令/探测器 id（`quota_detector_id` 只管额度，不管身份）。也就是说：要兑现这条机器证，注册表必须存这些信息 → 违反验收②的字段闭集；要守住闭集 → 这条机器证在注册表层面无从判定，只能退回 evidence 文档（人读散文，不是机器证）。task_plan 两边都没接：步骤 2 的 schema 没有解析类字段，步骤 3 的校验器没有任何「解析 command_alias 回真实可执行文件」或「身份探测可复跑」的断言，步骤 5 的测试也没有对应断言。worker 照着做完，第 1 条完成条件会是四条里唯一无证据的一条，而它恰好是承接 P6-M2 的那条。
- **建议**：需主控**先裁决**再放 worker 往下走，三条路选一并回写 DevPlan：
  (a) 认定 `config_fingerprint_rule` 就是解析载体——则必须定义其形态（如 `{"kind":"file-exists","path_template":"${USERPROFILE}/.codex/config.toml","fields":["model","profiles"]}`，路径模板只允许环境变量占位，不落真实用户名），并在校验器加规则 5「`config_fingerprint_rule` 指向的路径模板展开后必须存在，否则 `E_UNRESOLVED_CONFIG`」，在测试加对应 negative fixture；同理 `command_alias` 加规则「`Get-Command` 可解析，否则 `E_UNRESOLVED_ALIAS`」（可标 skip-on-CI）。**推荐这条**——不扩字段，把解析做成校验器行为而不是注册表内容。
  (b) 扩闭集两个字段（`cli_resolution` / `identity_probe_id`）——但那要同步改 DevPlan §2.3，且触发验收②「只含 §2.3 允许字段」的重新对齐，成本更高。
  (c) 主控明确把「解析到真实 cli/config_dir」降级为 evidence 级人证，在 DevPlan §3.2 验收口径里把它从「机器证」挪走并登记理由——但这会削弱 P6-M2，需在阶段闸如实反映。

---

## P2（应修：不修会留下口径漂移或复查时说不清的证据）

### P2-1 · Linux 延后未回写正文，五处硬口径仍在
- **位置**：DevPlan `:58`（交付清单⑦「Linux Headless/SSH 上至少一条 Herdr 持久会话 smoke」）、`:66`（前置条件「DHR_35 收口前**必须**补真实 SSH smoke」）、`:144`（DHR_33 实施提示「不得以 fixture 冒充真实 SSH 证据」）、`:164`（DHR_35 验收口径 H9「**真实 SSH，不接受 fixture 替代**」）、`:114`（任务表 DHR_35 备注「须补真实 SSH smoke」）。
- **问题**：这五处全部是「必须/不接受」的硬口径，全部未标延后。调整① 只在 §0.2 事件段里说了延后，读正文的人（尤其是 DHR_33/35 开工时的 worker）会按正文办事，要么白等 Linux 环境，要么以为自己违规。B-11 的「延后语义 = 只推迟收敛裁决、不推迟事实登记」要求的正是**事实登记到位**，而现在事实只登记在事件段。
- **建议**：五处各加一句尾注「（`DHR-B-22` 调整① 延后，汇合点 = P6 阶段闸裁决）」，措辞保持原口径不变——延后的是执行时点，不是标准的松动。

### P2-2 · P6-M 表与完工 checklist 未登记 M6 例外
- **位置**：DevPlan `:187`（§4.1 P6-M6 行）、`:214`（§7「P6-M1~M7 全部有等价 pass 证据（M4 允许用户接受的受限）」）。
- **问题**：同 P2-1 的另一面。§4.1 承接卡列 `DHR_33 / DHR_35` 未标延后；§7 的括号只给 M4 开了例外，M6 没有。计划完工 checklist 是销户前逐条勾的东西，现在它会在 M6 上卡死。
- **建议**：§4.1 P6-M6 行「承接卡」列或新增备注标「延后（B-22 ①）」；§7 括号改为「（M4 允许用户接受的受限；M6 因 B-22 ① 延后，允许记延后/受限并由用户裁决）」。

### P2-3 · 回填指针与本次输出文件名不一致
- **位置**：DevPlan `:52`（「结论与裁决回填于此：见 workspace/DHR_32/review.md「B-22 预审」节」）vs 本次派发指定的输出文件 `workspace/DHR_32/review-b22-opus.md`。
- **问题**：DevPlan 里的指针指向 `review.md`，而本文件叫 `review-b22-opus.md`。若主控不处理，DevPlan 留下一个断链，后续复查（尤其阶段闸复盘）找不到审核记录。
- **建议**：主控二选一——把 DevPlan `:52` 的指针改成 `workspace/DHR_32/review-b22-opus.md`，或在 `review.md` 里建「B-22 预审」节并写「结论见 review-b22-opus.md」做转发。别两边都不动。

### P2-4 · 验收④「能力位对应真实 CLI 实现」缺机器断言
- **位置**：`brief.md:17`（完成条件 4）、`task_plan.md` 步骤 1.5 / 步骤 2 / 步骤 5。
- **问题**：schema 只校验 capabilities 的值属于 `supported/unsupported/unproven` 三态枚举，**不校验 `supported` 是否附了依据**。步骤 1.5 要求「+ 依据命令行开关」，但依据只写在 evidence 的散文里，没有任何机器手段防止 worker 在证据不足时随手标 `supported`。B15⑤ 的原意正是「可信只读承载 = 注册表能力位而非 prompt」——能力位若不可机器复核，等于把 prompt 型判断搬进了注册表。
- **建议**：步骤 5 加一条可机器化的交叉断言（不改字段闭集）：对 golden 里每个 entry 的每个值为 `supported` 的能力位，`evidence/audit-<command_alias>.md` 中必须存在该能力位对应的开关字符串（在测试里维护一张 `能力位 → 期望开关正则` 的表，如 `readonly → /--sandbox\s+read-only/`、`headless → /\bexec\b|-p\b|--print/`、`resume → /--resume|--continue|\bresume\b/`），缺失即断言失败。这一条同时把「不支持者明确标不支持」变成可复跑事实。

### P2-5 · 路径脱敏无规则，task_plan 自身就在正文写真实用户名路径
- **位置**：DevPlan `:90` / `:127`（「路径与环境输出经白名单脱敏」）vs `brief.md:19-23`（白名单只覆盖凭据、账号主体、环境变量名）、`task_plan.md` 步骤 6（「`C:\Users\nash\.dh-relay\executor-profiles.json`」）、步骤 1.1（「记录最终真实可执行文件路径」）。
- **问题**：验收③ 明写「路径……经白名单脱敏」，但 brief 的脱敏白名单**只字未提路径**，掩码规则只给了邮箱。结果 task_plan 步骤 1.1 直接要求记录真实可执行文件路径（必然含 `C:\Users\nash\…`），步骤 6 更是把真实用户名写进了说明书正文。五份 evidence + golden fixture 都会带上真实用户名。这不是凭据，但确实踩了验收③ 的字面要求，复查时会被追问。
- **建议**：brief 白名单增一条掩码规则：「家目录一律写 `~` 或 `%USERPROFILE%`，程序目录写 `%LOCALAPPDATA%` / `%ProgramFiles%` 等标准变量；evidence 与注册表中不出现真实用户名字面量」；task_plan 步骤 6 的路径改写为 `%USERPROFILE%\.dh-relay\executor-profiles.json`。

### P2-6 · `config.toml` / `settings.json`「摘录非敏感字段」仍是人判，有已知漏口
- **位置**：`brief.md:21`、`task_plan.md` 步骤 1.3。
- **问题**：白名单给的是「模型名、profile 节名、baseUrl 域名部分、feature 开关」，但这两类文件里有几处结构天然贴着凭据：`~/.codex/config.toml` 的 `[mcp_servers.*].env`、`model_providers.*.http_headers` / `env_key`；`~/.claude/settings.json` 的 `env` 段与 `apiKeyHelper`；MCP server 定义里的 `headers`。它们既不是 `auth.json` 也不长得像 token 字段名，很容易被当成「非敏感结构」摘出来。另外「baseUrl 域名部分」没说清边界——URL 里的 userinfo（`https://user:key@host`）和 query（`?key=…`）都可能带凭据。
- **建议**：把这两类文件降到与 `auth.json` 同级处理：默认只登记顶层/节名与字段名，**需要摘录值时逐个对照允许清单**（当前允许清单 = 模型名、profile/节名、URL 的 `scheme://host`、布尔型 feature 开关）。并显式点名黑名单键路径：`env`、`http_headers`、`headers`、`env_key`、`apiKeyHelper`、`*.token`、`*.key` —— 一律只记键名不记值。URL 处理明确为「只取 `scheme://host`，强制剥掉 userinfo、path、query、fragment」。

### P2-7 · `profiles/` 目录落位与 DevPlan §2.1 表述不一致
- **位置**：DevPlan `:77`（实现单元表「入口 / 主要文件：Runtime `profiles/`」）、`:88`（§2.2「Runtime `executors/`、`profiles/`、`cli/` — 扩展」）、`:129`（变更范围「Runtime `profiles/` schema」）vs `brief.md:32`（`relay-core/profiles/**`）。
- **问题**：DevPlan 三处都写「Runtime `profiles/`」。实测 `relay-core/` 下确有 `runtime/` 目录，按字面读应是 `relay-core/runtime/profiles/`；而 brief 落在 `relay-core/profiles/`（与 `runtime/` 平级）。更麻烦的是 brief 禁改清单里含 `relay-core/runtime/**` —— 若 DevPlan 的字面意思为准，worker 的交付物位置正好落在自己的禁改区。两种读法都能自圆其说，但只能有一种是对的。
- **建议**：主控明确落位并让两边一致。倾向 brief 的 `relay-core/profiles/`（本卡不接 Runtime 逻辑，只出 schema + 校验器 + fixture，与 `contracts/` 平级更自洽），若采纳则把 DevPlan `:77`/`:88`/`:129` 的「Runtime `profiles/`」改为「`relay-core/profiles/`（与 contracts 平级；Runtime 侧接线在 DHR_33/34）」。

### P2-8 · allowed-paths 与禁改清单并存，「未列即可改」的歧义 + 未禁 git 危险动作
- **位置**：`brief.md:30-35`、`task_plan.md` 步骤 8.3。
- **问题**：两份清单并列时，worker 的自然读法是「禁改清单是黑名单，没上榜的就能动」——而 P1-3 已经证明黑名单本身写漏了目标。另外步骤 8.3 只说了 `git add` + `git commit`，没有一句禁止 `git push` / `git checkout` 切分支 / `git rebase` / 改 master。本卡在 worktree 里跑，一次误 push 或误切分支的代价远大于本卡收益。
- **建议**：brief 加一句语义声明：「**allowed-paths 是闭集：未列出的路径一律禁改（含新建与删除）；下方禁改清单只是重点提示，不是穷举**」。task_plan 步骤 8 加一条：「只允许 `git add <allowed-paths 内的具体文件>` 与 `git commit`；禁止 `push` / `checkout` 切分支 / `rebase` / `reset --hard` / 任何对 master 的操作；提交前先 `git status --short` 贴 progress，出现 allowed-paths 外的条目立即停并写 findings」。

### P2-9 · 有效单测「改坏再还原」缺还原校验
- **位置**：`task_plan.md` 步骤 5 末段。
- **问题**：流程是「临时改坏 `validate-profiles.mjs` → 跑测试记红 → 还原 → 跑测试记绿」。绿了只能说明测试通过，**不能说明还原到了原样**（比如把黑名单分支注释掉后又补了个等价实现、或还原时多删一行注释）。一旦还原不彻底且恰好仍绿，坏代码会被步骤 8.3 提交进仓。
- **建议**：步骤 5 增加「改坏前先 `Get-FileHash validate-profiles.mjs` 记 sha256，还原后再算一次，两值必须相同并都贴 progress」；步骤 8 提交前再 `git diff --stat` 确认该文件相对红测前无残留差异。

### P2-10 · quota 样文脱敏只剔 token/请求头，未剔身份类标识
- **位置**：`brief.md:21`（「quota 报错样文（剔除 token/请求头）」）、`task_plan.md` 步骤 1.6。
- **问题**：真实的额度/限流报错体里除了 token 和请求头，常见还有 `request_id`、`organization_id`、账号邮箱、内部 endpoint 全路径。这些不是凭据但属身份信息，与本卡「账号主体入册前必须掩码为别名」的立场矛盾——掩码了注册表里的邮箱，却在 quota 样文里原样贴出来，等于白掩码。
- **建议**：白名单改为「剔除 token / 请求头 / `request_id` / `organization_id` / 账号邮箱 / 完整 endpoint 路径；只保留 HTTP 状态码、错误码、可复用的错误短语模式」——后者才是 `quota_detector_id` 真正需要的东西。

### P2-11 · brief 完成条件 2 的「§2.3」在 brief 内是悬空引用
- **位置**：`brief.md:15`（「注册表只含 §2.3 允许字段」）。
- **问题**：brief 是只读副本，内部没有 §2.3 这个节。worker 若只读 brief（task_plan `:6` 明写「边界与脱敏白名单以 `brief.md` 为准」），会不知道 §2.3 指什么。实际上 `brief.md:23` 的「注册表可存字段闭集」就是 §2.3 的内容，但两处没有互相声明等同。
- **建议**：`brief.md:15` 的「§2.3」后加括注「（= 本文件『注册表可存字段闭集』一节，逐字同源于 DevPlan §2.3）」。逐字复制的验收口径本身不动，只加括注，不破坏「逐字一致」。

---

## P3（提示：不影响放行，但建议在证据里如实登记）

### P3-1 · 复核形态的两处「如实登记」义务
- **位置**：DevPlan `:51`（调整③「复核 = claude opus 经 Herdr（`pane run`），复核形态为侦测型只读（提示词硬约束 + 主控回收后 diff 核对，非机器只读，如实登记）」）。
- **问题**：两件事值得留痕。①本次预审的**实际形态**是主 session 内的 fresh 只读 worker，不是 `herdr pane run` 拉起的独立 pane——与调整③ 冻结的形态不一致，主控需在事件段如实登记实际形态（或说明本批预审不适用调整③，调整③ 只约束代码轮复核）。②调整③ 承认复核是 prompt 型只读，而本卡验收④ 承接的 B15⑤ 恰恰主张「可信只读承载 = 注册表能力位而非 prompt」——不构成矛盾（B15⑤ 约束的是 Profile 能力位，不是复核流程），但阶段闸复盘大概率会被问到「你自己的复核为什么可以用 prompt 型只读」，提前备好答案比事后解释省事：本卡产出的 `readonly` 能力位一旦冻结，DHR_33 起的复核就应改走机器只读（如 codex `--sandbox read-only`）。
- **建议**：在 DevPlan `:51` 后补一行实际形态登记；并在本卡 findings 记一条「复核形态迁移路径：DHR_33 起复核改用注册表中标 `readonly=supported` 的 Profile 执行」。

### P3-2 · `~/.dh-relay/executor-profiles.json` 未规定「已存在时怎么办」
- **位置**：`task_plan.md` 步骤 6。
- **问题**：步骤 6 是直接「写到」该路径。若文件已存在（早期试验遗留或用户手工建过），会被静默覆盖，且这是仓外文件、没有 git 兜底。
- **建议**：加一句「写入前 `Test-Path`；已存在则先复制为 `executor-profiles.json.bak-<yyyyMMdd-HHmm>` 并在 progress 登记原文件 sha256，再写新文件」。

### P3-3 · 步骤 3 的「参照 tools/validate.mjs 的引入方式」可以更明确
- **位置**：`task_plan.md` 步骤 3 第 1 条。
- **问题**：`relay-core/tools/validate.mjs` 实际**导出了 `loadAjv`**（`audit-contracts.mjs` 就是 `import { loadAjv } from './validate.mjs'` 用的），也就是说不必「参照写法」，可以直接复用。task_plan 说「参照……但不要改动 tools/ 下任何文件」，容易被读成「不许 import，自己另写一份 ajv 装配」——那反而会出现两份 ajv 配置漂移。
- **建议**：改为「直接 `import { loadAjv } from '../tools/validate.mjs'` 复用既有 ajv 装配（`relay-core` 已声明 `ajv ^8.20.0` / `ajv-formats ^3.0.1` 依赖，无需安装任何新包）；只读引用，禁止修改该文件；**禁止改动 `package.json` / `package-lock.json` 的依赖段**」。

### P3-4 · cwd 与 allowed-paths 的相对基准未写明
- **位置**：`brief.md:31-35`、`task_plan.md:4`（cwd = `.dh-worktrees/DHR_32`）、步骤 7（「在工作树根执行」）。
- **问题**：allowed-paths 写的是 `relay-core/profiles/**` 这类相对路径，但没说相对谁。worker 的 cwd 是 worktree 根，步骤 1 又要 `cd relay-core`，步骤 7 要回工作树根 —— 三个基准在文中来回切换，容易把 `docs/…` 相对成 `relay-core/docs/…`。
- **建议**：brief allowed-paths 段开头加一句「以下路径均相对**工作树根**（`.dh-worktrees/DHR_32/`）」，task_plan 每个步骤的命令前标注执行目录。

---

## 附：核实过的事实（供主控复算）

| 断言 | 核实方式 | 结果 |
|---|---|---|
| `npm test` 是显式文件清单，不通配 | 读 `relay-core/package.json:12` | 属实，17 个文件写死 |
| `ajv` 已在 relay-core 依赖 | 读 `relay-core/package.json:19-22` | 属实（`ajv ^8.20.0` + `ajv-formats ^3.0.1`），无需装包 |
| `validate.mjs` / `audit-contracts.mjs` / 三份基线位于 `relay-core/tools/` 而非仓根 | `ls relay-core/tools`、`ls tools` | 属实，仓根 `tools/` 是另一批内容（adapters/contracts/dogfood/host/policy/runner/tests） |
| `tools/validate.mjs` 导出 `loadAjv` 可直接复用 | 读 `tools/audit-contracts.mjs:14` | 属实 |
| 步骤 8.2 的 `audit-contracts.mjs` 不会被新增 `profiles/` 误伤 | 读 `tools/audit-contracts.mjs:21-22`（`CONTRACTS = join(ROOT,'contracts')`） | 属实，只扫 `contracts/` |
| `capability-baseline.mjs` / `fixture-manifest.mjs` 不会被新目录误伤 | 读两者扫描根（`../contracts/`、`../fixtures/`） | 属实 |
| `control-plane-imports.test.mjs` 不扫 `profiles/` | 读其 `CONTROL_PLANE_DIRS` 与第二钉的目录列（cli/adapters/rpc/runtime/store） | 属实，新目录不触发 |
| brief 完成条件 1~4 与 DevPlan `:125-128` 逐字一致 | 逐条比对 | 一致（仅链接相对深度不同） |
| `relay-core/test/profiles.test.mjs` 尚不存在 | `ls relay-core/test` | 属实，18 个既有测试文件中无此文件 |

REVIEW-DONE 共23条
