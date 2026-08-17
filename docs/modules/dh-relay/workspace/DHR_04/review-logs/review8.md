# review8 — DHR_04（三次返工后第二轮换人复审）

- 复核者：Claude（glm-5.2 模型，relay review8 worker，账号 4，第二会话）｜ 会话：与 review7 不同账号、不同会话，未继承其上下文；与 review6 同模型同账号但不同 run/会话，同样零上下文
- 复核范围：核 review7 全部结论（逐条亲跑复现）+ 独立砸新入口（Unicode 分隔符家族、JSON 条目边界、引号混合、空条目、超长路径、BOM）+ 变异探针 6 条（含回读校验）+ 回归矩阵 29 场景 + 范围/账本 E-026~E-035/F-005/F-006 逐项核 + 全量回归（清 `RELAY_*` 子进程）
- 纪律：全部亲跑复现，未采信主控账本与 review7 自述；变异一律在 `%TEMP%\review8-mut-4834…\work\`（tools/relay 整树副本）上做，每条写入后回读 `applied=True` 才跑套件，跑完还原并复跑 `SUITE PASS`；复核全程 `git status --porcelain` 为空，结束删净全部临时目录（`leftovers: 0`）

## 核 review7

| review7 的判断 | 我的复核（成立 / 不成立 / 级别应改） | 我的证据（全部亲跑） |
|---|---|---|
| R5-01（P1）真修好：NUL 分隔拆开、红线被逮 | **成立** | 自造探针（我的文件、非 review7 的）：`docs/…/findings.md\0.dh-runtime/relay/new.json\0` → iso **EXIT=1** `forbidden-root` / landing **EXIT=1** `legacy-root-write`；首条换 `tools/relay/policy/relay-policy.ps1`（production_root）同样双 1；首条 doc_root 后藏 `docs/modules/dh-crew/x.md` → EXIT=1；藏 `tools/dh-console/a.mjs` → EXIT=1 `production-outside-relay`。landing 报告 violPath=`.dh-runtime/relay/new.json`（拆开后逐条判，非前缀匹配）。对照 legacy 单独喂双 1。 |
| R5-02（P1）真修好（拒绝而非剥离） | **成立** | `".dh-runtime/relay/\346\226\260.json"` iso+landing **EXIT=3** `policy-path-quoted`；`"docs/modules/alpha/relay/…"`、`"docs/modules/alpha/workspace/A_01/relay/…"`、`"docs/modules/dh-crew/x.md"` landing/iso 全 EXIT=3。**我加测它没报的三种**：尾随-only 引号（`docs/modules/dh-relay/x.md"`）EXIT=3；前导-only（`"docs/…`）EXIT=3；引号+NUL 混排（`"legacy"\0doc`）EXIT=3（reason=control-char，见优先级表）。 |
| R6-01（P1）真修好：孤立 CR 拆开 | **成立** | 手写字节 `0x0D` 无 LF：`docs/…/findings.md\r.dh-runtime/relay/new.json\r` → iso **EXIT=1** `forbidden-root` / landing **EXIT=1** `legacy-root-write`；首条换 `tools/relay/a.ps1` 同双 1。CRLF+NUL 混合 + 双红线（crew + legacy）→ iso EXIT=1 `forbidden-root`、landing EXIT=1 `legacy-root-write`。 |
| R6-02（P3）JSON 非字符串全 exit 3 not-string | **成立** | `[null,…]` / `[123]` / `[true,false]` / `[{"a":1},…]` / `[["nested"]]` / `[[[["x"]]]]` / `["src/alpha/a.ts",123]` 全 **EXIT=3** `policy-list-entry-not-string`，stderr 带条目 JSON（`null` / `123` / `{"a":1}` / `[["x"]]`）。`[]` / `[""]` → EXIT=2 空清单。 |
| 混合形态优先级（空 > 控制字符 > 引号 > 非相对 > dotdot）与代码一致、无断言 | **成立**（行为一致确认；断言缺口由我的 M3 变异独立坐实） | 纯函数亲测：`"path"\0hidden`→control-char；`"D:/repo/…"`→quoted；`"../evil.ps1"`→quoted；`foo\0../bar`→control-char；`D:/repo\0x`（控制+绝对）→control-char；`~/../x`→not-relative；`D:/repo/../x`→not-relative；尾随引号+NUL→control-char；前导引号+CR→control-char。与 `relay-policy.ps1:6-15` 注释逐一吻合。CLI 侧同输入 `foo\0../bar` 拆成两条后第二条单独 throw `policy-path-dotdot: ../bar`——纯函数层才是优先级的裁判层，两层行为一致。 |
| 「按构造封闭整类」被 U+2028/U+2029/U+0085 证伪（R7-01 P3） | **成立（我独立复现，且加测 landing+production_root 两条腿）** | `docs/…/findings.md`+U+2028+`.dh-runtime/relay/new.json` → iso **EXIT=0** 空报告、landing **EXIT=0** 空报告；U+2029、U+0085 同。纯函数层该 glued 条目 `ALLOW`（规范化原样通过）。换首条 `tools/relay/…` 同样双 0。JSON 字符串条目内嵌 U+2028（`["docs/…/x.md\u2028.dh-runtime/relay/new.json"]`）→ iso **EXIT=0**——**JSON 入口同样粘**。级别 P3 合理：推荐三条 `-z` 命令不产这些码点，NTFS 合法文件名字符拆了会误伤。 |
| R7-02 `~user/` 被放开且无断言（P3） | **成立** | `~root/x.ts` → iso EXIT=1 `unclassified-path`（当普通相对路径分类）；`~root/docs/modules/dh-crew/x.md` → **iso EXIT=1 forbidden-root**（crew 根按前缀匹配仍逮得住——比 review7 记的还稳一点：它只测了 `~root/.dh-runtime/n.json` landing EXIT=0）；`~~/x`、`~.` 同为相对分类。landing 对 `~root/…` 全放行（非红线段）。 |
| R7-03 引号断言只钉两端完全包裹（P3） | **成立（我独立重做变异 G）** | 变异 G：`StartsWith('"') -or EndsWith('"')` → 只留 `StartsWith`，回读 `applied=True` → **SUITE PASS 无红**（red=0）。行为上前导-only/尾随-only 都 throw（我纯函数+CLI 双层测过），缺的是断言。 |
| R7-04 优先级无断言（P3） | **成立（我用真正的顺序对调变异独立坐实——review7 没做成这条变异，只验了行为）** | 变异 M3：把控制字符块与引号块**整块互换顺序**（行级手术，回读 `applied=True`、`quotePos=1128 < ctrlPosAfter=1493` 确认顺序真的反了）→ **SUITE PASS 无红**（red=0）。前四层里任何相邻两层对调，现役 78 条断言一条都不红。 |
| 三条推荐命令产裸路径、porcelain 不是（E-031/E-032） | **成立** | 临时仓实证：`diff --name-only -z master...HEAD` / `HEAD` / `ls-files -z --others --exclude-standard` 输出**零前缀、零引号**（含非 ASCII 未跟踪文件 `未跟踪.txt` 裸出）；`status --porcelain -z` 输出带 ` M ` / `?? ` 前缀，直喂 iso EXIT=1 两条假违规（violations=`M seed.md`、`?? 未跟踪.txt`）——方向 fail-closed，与 E-031 记账吻合。**注意**：不带 `-z` 的 porcelain 对非 ASCII 才产 `\xxx` 八进制引号形态（`"\346\234\252…"`），带 `-z` 的不产——引号防线防的是前者，头部禁荐 porcelain 两条理由都真。真树 E-032 重放：15 条裸路径零预处理直喂 → **EXIT=0**。 |
| 回归面 10 项全保持 | **成立** | 我自己的矩阵（非抄 review7 的）：退出码 0/1/2/3 各态到位且无重叠（干净 0 / 违规 1 / 缺参与空文件 2 / dotdot·绝对·引号·控制字符·非字符串条目 3）；`..` 4 变体（fwd/反斜杠/大小写/尾随空格）全 3；非相对 UNC/verbatim/盘符相对全 3；内部 `./` 消解（`src/./alpha/a.ts`、`.dh-relay/./RUN-x/events.jsonl` content 0）；两条不得误杀 landing 0；卡授权 `src/alpha/a.ts`、`src/beta/util.ts` content 0、`src/beta/other.ts`/`src/gamma/a.ts` 拒 1；legacy 双 1；`-Mode all` multi 1；`tools/dh-console/a.mjs` production-outside 1；JSON 合法清单正常分类。单套件 `ASSERTIONS 78 / SUITE PASS`；清 `RELAY_*` 子进程全量 **`RELAY ALL PASS (SKIPPED: 1)`**、闸门 `PASS production reason codes covered: 70`、`relay-policy.ps1` 在 coverage 之前（run-relay-tests.ps1:18-19 亲读）。 |
| 范围零漂移（b770a4b 恰 5 文件、未碰禁改面、无偷建 as-built） | **成立** | `git show --name-status b770a4b`：恰 5 文件（relay-policy.ps1 / Invoke-RelayPolicyCheck.ps1 / tests/relay-policy.ps1 / progress.md / findings.md），父提交 `392116e` 对。master...HEAD 15 文件全在授权面（其余 10 个是 review1~7 日志 + 更早提交的 fixtures/coverage/run-relay-tests）。`as-built/` 仍三件，无 `relay-policy.md`。`relay-agent-tool.ps1`、contracts/runner/host/adapters、dh-crew、`D:\relay-stage0\`、DevPlan、`review.md` 零触碰。工作区干净。 |
| E-026~E-035 复跑对账（review7 的复现值） | **成立，一处计数差异同它** | 我自己复跑（全新探针）：E-026 NUL+CR 四态全 1 ✅；E-027 双模式 3 ✅；E-028 null/nested 3 ✅；E-029 断言在场（`not-relative guard error also includes the offending path` PASS）✅；E-030 `~$tmp.docx` CLI **EXIT=1 `unclassified-path`**（放行为"普通相对路径"=归入未分类族拒，不是 exit 0——账本记"返回普通相对路径"是纯函数层口径，CLI 层它仍拒，方向 fail-closed，账不算错但两层口径要分清）、`~/…` 3 ✅；E-031 fail(预期) 记法诚实（见上行 porcelain 实证）✅；E-032 EXIT=0（本树 15 条 vs 账本 17 条，差在施工当时脏工作区，review7 判定成立）✅；E-033 78/PASS ✅；E-034 全量绿 ✅；E-035 变异 A=2 ✅（我 redo 同值），D 它说 5 主控记 4——我只重做了 A/G/H/K/L2/M3 六条，D 没单独重做（K 的"只去 NUL"是 D 的半边，红 3），对 D 的 4-vs-5 不采信也不反证。 |
| F-005 / F-006 放行记法合规 | **成立** | F-005 复跑：`src/gamma/a.ts -Mode all` 顶层 `policy-violation:multi`（亲见）。F-006：读 `relay-contract-reason-coverage.ps1:55-76` 采集面，只采 `New-RelayValidationError` 参数 / `reason =` 赋值 / verdict\|reason 行的引号 kebab 码——三个新 throw 码确实不在采集面，与既有守卫码同待遇，闸门 70 属正确非漏。放行记法与 F-004 同型（P3/观察记录/主控裁决/open）。 |
| 「变异 A/B/C/D/F/H 回读后见红」（review7 的表） | **成立**（A/G/H/K/L2 我重做，B/C/D/F 未重做不采信） | 我的 6 条见下方变异表。review7 的 B/C/D/F 我未复制，其结论在本报告中不作为独立证据引用。 |

## 独立新发现

| ID | 级别 | 问题 | 证据（命令 + 输出） | 建议 |
|----|------|------|------|------|
| R8-01 | P3 | **优先级分层完全没有断言钉住——我把前两层整块对调，78 条断言一条不红。** review7 的 R7-04 只验了行为顺序 + 变异 G（引号收窄）；我做了真正的顺序对调变异（M3：控制字符块与引号块互换），套件无红。同理"非相对 vs dotdot"有断言（review5 M5-M 钉过），但 2↔3 层、3↔4 层之间没有任何混合夹具。任何未来重构把 throw 顺序打乱（例如有人"优化"成正则合一），`"path"\0hidden` 会从 `control-char` 静默变成 `quoted`，调用方排障方向被带偏，套件不报警。 | 变异 M3（回读 `applied=True`、`quotePos=1128 < ctrlPosAfter=1493` 确认顺序反转）→ `SUITE PASS` red=0。纯函数层当前顺序正确（9 组混合形态亲测一致）。 | 挑 1~2 条混合夹具进套件：`"path"\0hidden` 断言 reason 前缀是 `policy-path-control-char`（不是 `quoted`）；`"D:/repo/x"` 断言是 `quoted`（不是 `not-relative`）。两行断言封死 2>3>4。 |
| R8-02 | P3 | **U+2028/U+2029/U+0085 粘连入口比 review7 记的多一条腿：JSON 字符串条目内嵌同样粘。** review7 R7-01 只测了纯文本清单；我测了 JSON 形态——`["docs/modules/dh-relay/x.md\u2028.dh-runtime/relay/new.json"]`（一个合法字符串条目，无任何清单层畸形）→ dev-isolation **EXIT=0** 空报告。JSON 分支的 `policy-list-entry-not-string` 守卫管类型不管内容，内容层照样靠 `Get-RelayPolicyPath`，而它只认 C0/DEL。 | `j-2028-string` 探针：EXIT=0。对照同内容纯文本清单（拆分后条目里仍含 U+2028）→ 也 EXIT=0（同根因，`Get-RelayPolicyPath` 放行）。级别维持 review7 的 P3 判断：可达性同样受限于"喂入方得先造出这码点"。 | 与 R7-01 同一处收：要么控制字符集扩到 U+0085/U+2028/U+2029，要么头部契约写明"只认 NUL/CR/LF 为分隔、其余码点当路径字符"。不阻塞。 |
| R8-03 | P3 | **拆分正则与守卫正则对"分隔符"的认定不对称——`Where-Object IsNullOrWhiteSpace` 让"全空白条目"静默消失，而分隔符集合里的 `\t`（TAB）在拆分层不是分隔符、在守卫层却会被 throw，两层对同一字符的答案不同。** 拆分认 `[\0\r\n]+`；TAB/VT/FF 不拆 → 整条进 `Get-RelayPolicyPath` → throw control-char（方向 fail-closed，对）。但一条 `a\tb` 清单会整单 exit 3，错误消息是"路径含控制字符"而不是"清单分隔符疑似 TAB"——排障语义可再准一点。这是观察项不是洞：方向已 fail-closed。 | `vt-ff-tab` 探针：`docs/modules/dh-relay/x.md\x0Bdocs/modules/dh-crew/x.md` → EXIT=3 `policy-path-control-char`（保护住了藏红线）。 | 可选：`Read-RelayPolicyPathFile` 拆分正则加 `\t`（TAB 当分隔符，git/文本工具链里 TAB 分隔清单真实存在），或在头部契约点一句。不阻塞。 |
| R8-04 | P3 | **`E-030` 账本两层口径未分清（账不假，但读账的人会误读）。** 账本写"`~$tmp.docx` 返回普通相对路径（pass）"，这是纯函数层口径；CLI 层同输入是 **EXIT=1 `dev-isolation-violation:unclassified-path`**——仍然拒，只是 reason 从 `not-relative` 变成 `unclassified-path`。R5-04 的意图（"不被一个 Office 锁文件打成 exit 3"）达成了；但"回归为普通仓库相对路径"这句话在 CLI 消费方读来容易被当成"会被放行"，实际不会被放行（iso 的默认拒绝兜底）。 | `t-dollar` 探针 CLI：EXIT=1 `unclassified-path`；纯函数：ALLOW `~$tmp.docx`。landing 单模式对它 EXIT=0（非红线段，与其它任意非红线相对路径一致）。 | 账本 E-030 补一句"CLI 层仍 iso:unclassified-path exit 1"即可。不阻塞。 |

**扫过但判定没问题、不单列 finding 的**：

- **NBSP/U+200B/空格/逗号粘连**：`docs/…/x.md`+NBSP+`legacy` → iso EXIT=0——与 U+2028 同族形状，但这些是 NTFS 合法文件名字符、且非行分隔语义，review7 判"扫过不单列"的口径我沿用（前缀匹配当一条路径处理，红线藏在后面时被吞——同 R7-01/R8-02 的根因面）。归入 R7-01 的修法讨论，不另立 ID。
- **智能引号 U+201C/U+201D 包裹**：纯函数 ALLOW（当普通相对路径），landing 不放行红线段（`.dh-runtime/` 前缀没命中就是没命中）——git quotePath 只产 ASCII `"`，已被拦；智能引号不是喂入通道，不记。
- **引号在条目中间**（`docs/modules/dh-relay/x"md`）：纯函数+CLI 都当普通路径处理 EXIT=0——NTFS 里 `"` 是非法文件名字符，真实 git 输出产不出；属"喂入方造不出来"的形态，同 U+2028 的可达性口径，不单列。
- **超长路径（250 字符段）**：`docs/…/x.md\0`+`a*250/evil.ps1` → EXIT=1 `production-outside-relay`，正常分类无溢出无异常。
- **JSON 顶层非数组**（`{"a":1}`）：`ConvertFrom-Json` 产对象 → `@()` 包裹单元素 → `policy-list-entry-not-string` 面前是 IDictionary → **EXIT=1 unclassified-path**（不是 3）——方向 fail-closed，语义上是"清单非数组"被当"条目未分类"报，与 R8-03 同类小瑕疵，不值得单列。
- **BOM**：BOM+NUL+legacy 双模式 EXIT=1（BOM 剥除生效，红线仍逮）。
- **只有分隔符的文件**：EXIT=2（空清单 fail-closed）。
- **E-008 复跑**：15 条裸路径零预处理直喂 EXIT=0。
- **`~` 收窄后 `~\`（反斜杠形态）**：EXIT=3 `not-relative`——归一（`\`→`/`）发生在判据**之前**，brief 点名的"正则跑在归一前还是后"答案是**之后**，`~\x` 与 `~/x` 同拦。`~` 裸、`~/…` 拦；`~$`、`~x`、`~~`、`~.` 放为相对分类。

## 清单条目形态穷举（含我自己新设计的入口）

| 输入形态 | 期望 | 实际 | 判定 |
|---|---|---|---|
| NUL 分隔 · 首条 doc_root · 藏 legacy | 拆开拒红线 | iso 1 forbidden-root / landing 1 legacy-root-write | ✅ R5-01 封闭 |
| NUL 分隔 · 首条 production_root · 藏 legacy | 同上 | 双 1 | ✅ |
| NUL 分隔 · 藏 forbidden-root（crew） | 拒 | iso 1 | ✅ 藏的不是 legacy 也逮 |
| NUL 分隔 · 藏 production-outside | 拒 | iso 1 production-outside-relay | ✅ |
| 孤立 CR · doc_root 首条 · 藏 legacy | 拆开拒 | 双 1 | ✅ R6-01 封闭 |
| 孤立 CR · prod_root 首条 | 同上 | 双 1 | ✅ |
| CRLF+NUL 混合 · 双红线 | 拆开拒 | iso 1 / landing 1 | ✅ |
| BOM + NUL + legacy | BOM 剥掉仍拆 | 双 1 | ✅ |
| git 引号（两端）· legacy / module-relay / ws-relay / crew | throw quoted / 3 | iso+landing 全 3 | ✅ R5-02 封闭 |
| 尾随-only 引号 | throw quoted | 3 | ✅（review7 只测行为，我 CLI 复核） |
| 前导-only 引号 | throw quoted | 3 | ✅ |
| 引号 + NUL 混排 | 先拆后 throw | 3（control-char，见优先级） | ✅ |
| JSON null / int / bool / object / 嵌套 / 深嵌 / 混串 | throw not-string / 3 | 全 3，stderr 带条目 | ✅ R6-02 封闭 |
| JSON 字符串内嵌 NUL | 守卫逮 | 3 control-char | ✅ |
| `[]` / `[""]` / 纯空 / 只有分隔符 | 空清单 2 | 2 | ✅ fail-closed |
| JSON 顶层对象（非数组） | 拒 | 1 unclassified（非 3） | ✅ 方向安全（见扫过项） |
| **U+2028 / U+2029 / U+0085 粘连（纯文本）** | 证伪整类封闭 | **iso 0 / landing 0 空报告** | ⚠️ R7-01 复现成立 |
| **U+2028 粘连（JSON 字符串条目）** | 同上 | **iso 0** | ⚠️ **R8-02 新腿** |
| NBSP / ZWSP 粘连 | 观察 | iso 0 | 扫过（同根因，NTFS 合法字符） |
| TAB / VT / FF 分隔（C0 非拆分集） | 不拆但守卫 throw | 3 control-char | ✅ 纵深防御（R8-03 观察项） |
| DEL `\x7F` | throw | 3 control-char | ✅ |
| porcelain ` M …` / `?? …` | 不得放行 | 1 假违规（fail-closed 方向） | ✅ |
| 三条推荐 `-z` 命令原始拼接直喂（真树 15 条） | 裸路径 0 | **0** | ✅ E-032 重放 |
| 超长段（250 字符） | 正常分类 | 1 production-outside | ✅ |

## 变异探针（含回读校验）

副本：`%TEMP%\review8-mut-4834…\work`（tools/relay 整树副本），基线先验 `ASSERTIONS 78 / SUITE PASS`。每条 `Restore` → 写变异 → **回读 `applied=True`** 才跑；全部结束后复跑 `FINAL-RESTORED: ASSERTIONS 78 / SUITE PASS`。仓库 `git status --porcelain` 为空。

| 变异 | 变异已生效？ | 套件反应 | 结论 |
|---|---|---|---|
| **A** 控制字符 throw → `if ($false)`（review7/主控同款，redo） | applied=True | **SUITE FAIL (2)**：NUL + CR 两条 control-char | 与主控 E-035 的 A=2、review7 的 A 一致 ✅ |
| **G** 引号判据只留 `StartsWith`（review7 自造款，redo） | applied=True | **SUITE PASS 无红** | R7-03 独立坐实：前导/尾随各自无牙 ❌（行为对，断言缺） |
| **H** JSON 守卫 `-isnot [string]` → `-eq $null`（review7 H 同款，redo） | applied=True | **SUITE FAIL (1)**：`JSON list with nested array entry exits 3` | 嵌套数组有牙；null 条目字面量红测保住它；int/bool 仍无独立断言（CLI 亲验是 3）✅ |
| **K** 拆分正则去掉 NUL 只留 CR/LF（**自造**） | applied=True | **SUITE FAIL (3)**：NUL×2 + porcelain 断言 | NUL 半边被独立钉住 ✅（porcelain 夹具本身是 NUL 分隔，顺带被钉） |
| **L2** `~` 判据退回 `^~`（返工前行为，自造；首版 L 用 `.*` 导致套件崩溃不可读，重做为 `^~`） | applied=True | **SUITE FAIL (1)**：`tilde-dollar lock file is a normal relative path` | 收窄方向有牙 ✅；但"不要把 `~user/` 当相对"无断言（R7-02 维持） |
| **M3** 控制字符块与引号块**整块互换顺序**（自造；review7 没做成这条） | applied=True（行级手术，回读 quotePos=1128 < ctrlPosAfter=1493 确认顺序真反了） | **SUITE PASS 无红** | **R8-01**：优先级 2>3 完全无断言 ❌ |

## 结论

**approved（P0=0 P1=0 P2=0 P3=4）**

三条 P1 我用自己的探针文件从零复现：NUL、孤立 CR、git 引号三种畸形清单形态全部由"静默 EXIT=0"变为 1（红线被逐条逮住，landing 报告里的 violPath 就是红线原文，证明真拆开了）或 3（畸形被 throw），R5-01/R5-02/R6-01 封闭成立。R6-02 JSON 类型守卫七种非字符串形态全 3。变异 A/H/K/L2 回读生效后见红（其中 K、L2、M3 三条是我的新角度），控制字符、NUL 拆分、JSON 嵌套、`~` 收窄四个修复点各自有独立断言——不是"改一处蒙对全部"。回归面 29 场景 + 全量 16 套件 `RELAY ALL PASS (SKIPPED: 1)` + 闸门 70，前七轮确认的行为零回归。范围恰 5 文件、无偷建 as-built、账本 E-026~E-034 我逐条重跑对上（E-035 的 D 条数 4-vs-5 我未重做、不裁决；review7 判 5 与其自述不符那半句我不采信也不反证）。

review7 的判断**没有一条被我推翻**：它的三条 P1 封闭结论、四条 P3（R7-01~04）、范围/账本/推荐命令的复核，我全部独立重跑后吻合。我在它之外加的是：优先级断言缺口的**变异级**坐实（M3 整块对调无红——它只验了行为）、U+2028 家族的 **JSON 入口腿**（R8-02）、拆分/守卫两层对 TAB 认定不对称的观察（R8-03）、E-030 两层口径的读账提示（R8-04）。

四条 P3 都不阻塞：R8-01/R8-02 是断言密度与既有 R7-01 同根的边界，R8-03/R8-04 是排障语义与记账措辞。主控若要收尾清账，R8-01 两行断言 + R7-01 的契约一句话是性价比最高的两针。
