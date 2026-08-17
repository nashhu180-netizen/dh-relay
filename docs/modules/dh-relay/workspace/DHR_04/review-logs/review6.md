# review6 — DHR_04（二次返工后第二轮换人复审）

- 复核者：Claude（glm-5.2 模型，relay review6 worker，账号 4）｜ 会话：与 review5 不同账号、不同会话，未继承其上下文（review5=REWORK2 run L-0002/S-0002；本人=REVIEW6 run L-0001，单独重派棒）
- 复核范围：核 review5 全部结论（逐条亲跑复现）+ 独立穷举（非相对 30 形态、`..` 15 变体、异形清单条目、snapshot scope 攻击面）+ 变异探针 11 条（scratchpad 副本）+ 黑盒 CLI 退出码矩阵 + 回归/范围/E-008 逐项核
- 复核基准：DevPlan `#### DHR_04` 三条机器证 · design/02 §6.1 B9 · fix2 handoff（`D:\relay-run-DHR_04\evidence\RELAY-DHR04-REWORK2-20260817095138\attempts\fix2\1\handoff.md`）
- 纪律：**全部亲跑复现，未采信 review5 与 fix2 handoff 自述**；变异探针一律在 `%TEMP%\review6-probe-7d14262f0880421d9d494e153a16726c\relay\`（tools/relay 整树副本）上做，每条先经锚点命中校验（applied≥1 才采信），跑完从 base 副本还原并 SHA256 逐字节比对（restored=True）；复核全程 `git status --porcelain` 为空

## 核 review5

| review5 的判断 | 我的复核（成立 / 不成立 / 级别应改） | 我的证据（全部亲跑） |
|---|---|---|
| R4-01（P1）真修好：33 种非相对形态 × 三 verdict 全 THROW；CLI 非相对一律 exit 3；四类判据各自有断言钉住 | **成立**（形态数我复到 30 种，无一条 exit 0） | 纯函数三 verdict 亲跑：review4 的 9 种点名形态 + review5 自造 24 种中的代表 + 我自造 20 种新形态（`\\?\D:.dh-runtime\n.json`、`\\.\C:\repo\x.ts`、`\\?\UNC\server\share\x.ts`、` /tmp/evil.ps1`、`  D:/repo/x.ts  `、`\.dh-runtime\n.json`、`\server\share\x.ts`、`D:src/alpha/a.ts`、`C:src/alpha/a.ts`、`d:file.ts`、`/x.ts`、`/ /x.ts`、`/./../../etc/passwd`、`~/../.ssh/id_rsa`、`~root/x.ts` 等）**全部 THROW `policy-path-not-relative: <原文>`，无一 ALLOW**。CLI 层 6 种代表形态 × 4 模式 = 24 跑全 EXIT=3。变异 M6-A（整个非相对检查 `if ($false)`）→ `SUITE FAIL (6)` 恰红 6 条新断言；M6-B（只删 `~` 判据）→ FAIL(1) `content rejects tilde path with exit 3`；M6-E（只删盘符正则）→ PASS（盘符类被其余判据+兜底蒙住，见"扫过没问题"）；M6-I（not-relative 路由 exit 2）→ FAIL(3) 三条 CLI 红测各钉 3。 |
| R4-02（P3）随 ① 自然消解、不再误报 `unclassified-path` | **成立** | `D:/repo/.dh-runtime/n.json`、`D:/repo/docs/modules/dh-crew/x.md`（CLI 亲跑）：dev-isolation/content/landing/all 全 EXIT=3 `guard error: policy-path-not-relative: …`，未再出现 `unclassified-path`。与 fix2 E-020 自述一致。 |
| R3-02（P3）`..` 三条红测 `-eq 3` 真有牙（M5-H 重做 SUITE FAIL (3)） | **成立（我独立重做，非抄它）** | 我的 M6-H（CLI catch 把 `policy-path-dotdot` 路由到 `Exit-RelayPolicyInputError`=exit 2，锚点 `Exit-RelayPolicyGuardError ("relay-policy: guard error: " + $_.Exception.Message)` applied=1）→ 副本套件 `SUITE FAIL (3)`，恰红 `dev-isolation/content/landing rejects path with ..` 三条。 |
| R3-03（P3）行为真修好、断言只钉住 dotdot 半边 | **成立** | 行为侧：纯函数 `Get-RelayPolicyPath 'tools/relay/../protocol/evil.ps1'` → `policy-path-dotdot: tools/relay/../protocol/evil.ps1`；`D:.dh-runtime/n.json` → `policy-path-not-relative: D:.dh-runtime/n.json`（消息带原文，亲见）。断言侧：我的 M6-G（dotdot throw 去掉 `$Path`）→ FAIL(1) `guard error message includes the offending path`；M6-F（not-relative throw 去掉 `$Path`）→ **SUITE PASS 无红**。review5 的不对称结论复现成立 → R5-03 维持。 |
| R4-03（P3）头部契约写了，但"只文档不加固"的前提不成立（landing 静默放行） | **成立（前提不成立这点我独立证实）** | `Invoke-RelayPolicyCheck.ps1:3-11` 输入契约在场（含两条可照抄命令 + 三点比较提示）。landing 亲跑：`".dh-runtime/relay/新.json"` EXIT=**0**、`"docs/modules/alpha/relay/新.json"` EXIT=**0**、`"docs/modules/alpha/workspace/A_01/relay/新.json"` EXIT=**0**、`"docs/modules/dh-crew/x.md"` EXIT=**0**；对照不带引号 `.dh-runtime/relay/new.json` EXIT=1 `landing-violation:legacy-root-write`。dev-iso/content 侧带引号形态确为 exit 1 fail-closed。→ R5-02 维持。 |
| R5-01（P1）NUL 分隔清单被当成一条路径 → dev-isolation/landing 静默 EXIT=0 | **成立（两条腿都独立复现）** | ① 最小复现：文件内容 `tools/relay/a.ps1<NUL>.dh-runtime/relay/new.json<NUL>` → dev-isolation **EXIT=0**、landing **EXIT=0**、content EXIT=1、all EXIT=1（后两者是白名单顺手拦的偶然）。② 真实形态：`git -c core.quotePath=false diff --name-only -z master...HEAD` 原始输出 + 追加 `.dh-runtime/relay/new.json` → dev-isolation **EXIT=0**、landing **EXIT=0**。对照：同一条 `.dh-runtime/relay/new.json` 单独喂 → exit 1。 |
| R5-02（P1）git 引号形态 landing 静默放行 | **成立**（见上行证据，四条 quoted 输入 landing 全 0） | 同上。另测**无引号纯八进制** `.dh-runtime/relay/\346\226\260.json` → landing EXIT=1（fail-closed）——问题特定于**前导双引号**形态，与 review5 定位一致。 |
| R5-03（P3）not-relative 消息路径原文无断言 | **成立** | M6-F 无红（亲做，见上）。 |
| R5-04（P3）`~` 判据过宽，`~$tmp.docx` 误伤 | **成立** | 纯函数 `~$tmp.docx` 三 verdict 全 THROW `policy-path-not-relative: ~$tmp.docx`；`~root/x.ts`、`~` 同。方向 fail-closed。 |
| 「回归面干净」12 项（`..` 14 变体、内部 `./`、两条不得误杀、卡授权路径、五处 fail-closed、legacy 根、multi 与单码、四态退出码、接线顺序、E-008、全量回归、无假绿残留断言） | **成立，一处口径需修正**（见下） | `..` 15 变体（含 review4 全部 14 + 尾随空格）三 verdict 全 THROW；内部 `./` 消解正常（`src/./alpha/a.ts`→content ALLOW 等）；两条不得误杀 landing ALLOW（M6-J 变异 `-eq`→`-contains` → FAIL(2) 复证护栏有牙）；`src/alpha/a.ts`、`src/beta/util.ts` content ALLOW，`src/beta/other.ts` 拒；legacy 根三模式三拒 + 双斜杠同；四态退出码矩阵 7 场景分明无重叠；全量回归（brief 铁律命令，清 `RELAY_*` 子进程）16 套件 `RELAY ALL PASS (SKIPPED: 1)` EXIT=0、relay-policy `ASSERTIONS 63`、闸门 `PASS production reason codes covered: 70`、`=== relay-policy.ps1 ===` 在 coverage 之前（第 15/16 位）；E-008 三点+NUL 去重 13 条 → dev-isolation EXIT=0；grep 无残留 `-eq 'policy-path-…'` 全等断言。**口径修正**：review5 第 7 行称「单 verdict 失败仍用原码」，我在 CLI 亲测 5 组单族失败（gamma-only / module-relay-only / prod-outside-only / dh-crew-only / beta-sibling-only）**顶层全是 `policy-violation:multi`**——`-Mode all` 下 dev-isolation 对 `src/gamma/a.ts` 等业务路径恒报 `unclassified-path`，单一输入族在三 verdict 里几乎必然多族失败，review5 举的例子（`docs/modules/dh-relay/design/03.md`）恰好是三 verdict 全绿的对照例，不构成"单族失败"反例。此为**表述不准而非代码缺陷**（reason 聚合行为本身自洽、套件有断言钉住），不影响其结论成立。 |
| 「范围零漂移」：二次返工 6 笔提交仅 5 文件、未碰禁改面、无偷建 as-built | **成立** | `git diff --name-only 61662df^..40ba904` 恰 5 文件（relay-policy.ps1 / Invoke-RelayPolicyCheck.ps1 / tests/relay-policy.ps1 / progress.md / findings.md）；review5 提交 `db73aed` 只动 review5.md；全卡 master...HEAD 13 文件全在授权面；`tools/relay/{contracts,runner,host,adapters}/` 与 `relay-agent-tool.ps1` 零触碰（grep diff 实证）；`as-built/` 仍只有 relay-contracts/relay-psmux-host/relay-runner 三件；`git status --porcelain` 空。 |
| 「`policy-path-not-relative` 不进覆盖闸不算漏」 | **成立，且闸门实测真有牙** | 闸门采集面（`relay-contract-reason-coverage.ps1:55-76`）只采 `New-RelayValidationError` 参数、`reason =` 赋值与含 verdict/reason 字样行的引号 kebab 码；守卫 throw 与 `policy-path-dotdot`/`policy-path-empty` 同待遇。我抹掉套件里唯一 `policy-violation:multi` 字面量（scratchpad）→ 闸门 PASS 70 **不变**——咦，这个探针没红；深查：该字面量在 `-match '"reason":\s*"policy-violation:multi"'` 的正则单引号串里，`Add-QuotedKebabCodes` 的正则 `[''"](?<code>…)[''"]` 恰好也能从 `"policy-violation:multi"`（正则里的双引号+kebab+双引号）采到码——抹掉后闸门应 FAIL。我重做时用 `[IO.File]::WriteAllText` 直写确认替换生效（literal count=1 → 写入 multiXX）再跑闸门仍 PASS——说明该码同时被**别处**覆盖（`$report.reason = 'policy-violation:multi'` 生产侧赋值行采集 + 其他测试行的字面量）。改做 GATE-2 变异（CLI 里 `if ($failed.Count -gt 1)` 改 `if ($false)`，即生产侧不再产出 multi）→ 套件 `FAIL mode all multi-verdict reason is policy-violation:multi`，**行为断言有牙**。覆盖闸对"生产侧删码"的检测路径未单验（多码重复覆盖），但行为断言已钉住 multi 语义，review5 的结论方向不受影响。 |
| 「E-019~E-025 账本自洽」 | **成立** | progress.md 账本区逐条在场（E-019 62 断言→E-022 起 63），日志区每件一行挂 E-ID，与 6 笔提交对得上。 |
| R1-07②（landing CLI 恒传 `$null` MarkerProbe）沿用 P3 | **成立** | `Invoke-RelayPolicyCheck.ps1:100` `Get-RelayLandingVerdict $afterPaths $beforePaths $null` 亲读；`docs/modules/alpha/relay/x.json` 新写 → `landing-violation:marker-unprobed`（CLI 亲跑），`module-relay-folder`/`workspace-relay-folder` 在 CLI 生产路径不可达，与 review1~5 判定一致。 |
| R3-04 已按主控放行记 F-004、不当未修问题报 | **成立** | findings.md F-004 在场（`33b7c0a`），写明"主控已裁决放行，不补测试"。本轮同样不当新问题报。 |

## 独立新发现

| ID | 级别 | 问题 | 证据（命令 + 输出） | 建议 |
|----|------|------|------|------|
| **R6-01** | **P1** | **CR-only（U+000D，无 LF）分隔的清单被粘成一条路径 → landing 静默 `EXIT=0`，B9 红线漏检。** `Read-RelayPolicyPathFile` 只按 `\r?\n` 拆行：纯 CR 分隔的清单不拆，两条路径粘成 `src/alpha/a.ts<CR>.dh-runtime/relay/new.json`。粘成条目后开头 `src/alpha/a.ts` 非任何根前缀 → landing 全放行；dev-isolation 侧纯函数对其报 `unclassified-path` exit 1 **纯属偶然**（该 glued 条目以 `.ts` 结尾被 production-ext 谓词扫中）——把首条换成 `tools/relay/x.ps1` 或 `.md` 结尾即同样静默。与 R5-01（NUL）同族：**清单条目分隔符不规范 → 条目粘连 → 前缀匹配失明**。可达性：任何从旧 Mac/某些工具链产出的 CR-only 清单、或调用方用 `` `r `` 而非 `` `n``/`` `r`n `` join 的清单都触发；本卡推荐命令虽是 `-z`，但 CLI 同时接受换行清单（套件自用 `` `n``），输入契约未禁止 CR。 | 最小复现（手写字节 `[byte]13` 分隔，无 LF）：`src/alpha/a.ts<CR>.dh-runtime/relay/new.json<CR>` → `-Mode landing` **EXIT=0**（violations 空）；`-Mode dev-isolation` EXIT=1 且 violations.path 就是整条 glued 路径。split 诊断：`-split '\r?\n'` 后 entry count=1。 | 与 R5-01/R5-02 同一处收：`Read-RelayPolicyPathFile` 拆分改 `-split "[\0\r\n]+"`（一次覆盖 NUL+CR+LF）；`Get-RelayPolicyPath` 对控制字符 throw（`policy-path-control-char`）+ 红测钉 exit 3。若主控判豁免，照 R4-01 规矩写 findings.md 明确豁免。 |
| **R6-02** | P3 | **JSON 数组形态的 AfterPath 对"清单条目不规范"完全无防线，且非字符串条目静默降级**：`Read-RelayPolicyPathFile` 对 `[` 开头走 `ConvertFrom-Json` 后直接 `@(...)`——`[null,"src/alpha/a.ts"]` 的 null 条目与 `[123,…]` 的 int 条目都不抛、不拒，落到 dev-isolation 的 `IsNullOrWhiteSpace($raw)` 分支记 `unclassified-path`（exit 1，方向 fail-closed）；但 `[["nested"]]` 嵌套数组同样只是 `unclassified-path`，**没有任何"条目必须是字符串"的守卫 throw**。危害有限（都 exit 1 不放行），但错误语义是"路径未分类"而非"输入清单畸形"，排障时会误导。 | 亲跑：`[null,"src/alpha/a.ts"]` / `[123,"src/alpha/a.ts"]` / `["src/alpha/a.ts",["nested"]]` → 全 EXIT=1 `dev-isolation-violation:unclassified-path`。 | 在 JSON 分支加一条 `foreach` 类型守卫：非 string 条目 `throw 'policy-list-entry-not-string'`（exit 3），配一条红测。不阻塞。 |
| **R6-03** | P3 | **`-Mode all` 的顶层 reason 事实上恒为 `policy-violation:multi`**（review5"单 verdict 失败仍用原码"的表述与实测不符）：三 verdict 的允许集没有交集包含关系，任何一条会失败的路径在 `all` 下几乎必然跨族——连"纯 content 违规"`src/gamma/a.ts` 都因 dev-isolation 的 `unclassified-path` 而成双族。`multi` 的"单族用原码"分支在 CLI 生产路径**几乎不可达**（只在 dev-iso 与 content 同族同路径失败且 landing 绿这种人造组合下出现）。不是放行漏洞（exit 1 正确、violations 全量在报告里），是 reason 语义的观察精度问题。 | 亲跑 5 组单族意图输入（gamma-only / module-relay-only / prod-outside-only / dh-crew-only / beta-sibling-only）× `-Mode all` → 顶层全 `policy-violation:multi`。GATE-2 变异（禁用 multi 分支）→ 套件恰红 multi 断言，行为有牙。 | 若消费方需要按族分流，考虑 violations 逐条 reason 已足够；或在文档写明 `all` 模式顶层 reason 语义。不阻塞。 |

**扫过但判定没问题、不单列 finding 的**：

- **M6-E（只删盘符正则）SUITE PASS 不是缺牙**：`^[A-Za-z]:` 删掉后，`D:/repo/…`、`D:.dh-runtime/…` 由 `IsPathRooted` 兜底命中（我实测 `IsPathRooted('D:.dh-runtime/n.json')`=True、`IsPathRooted('d:file.ts')`=True），套件无红属**判据冗余**的正确表现——review5 的 M5-E（收窄正则**并**去兜底）才 FAIL(1) 钉住盘符相对，两者互补正说明盘符类有独立断言。同理 M6-C（`IsPathRooted` 换 `$false`）在我这里触发的是 `C` 变异脚本的替换语法 bug（`$false)` 拼坏条件行 → ParserError），修复后等价于 M6-E 镜像，判据冗余结论同。
- **`?C:/repo/x.ts`（NTFS 通配符前缀）**：纯函数当普通相对路径处理 → iso/content reject、landing ALLOW（非红线段）——fail-closed 方向，不单列。
- **URL 编码 / Unicode 同形 / 尾随点 / 尾随空格 / 超长 / 大小写混合**：`src/%2e%2e/evil.ts`、`src/…/evil.ts`（U+2026）、`src/．．/evil.ts`（U+FF0E×2）、`.dh-runtime/n.json.`、`.dh-runtime/RELAY/new.json`、`.DH-RUNTIME/n.json`、250 字符长段——全部 fail-closed（legacy 根三拒 / 大小写不敏感命中 `module-relay-folder`），与 review4 结论一致，无新洞。
- **空段形态**：`.dh-runtime//relay/new.json`、`.dh-runtime///relay/new.json`、`.dh-runtime/new.json//` 三拒；`src//alpha//a.ts`、`src/ /alpha/a.ts` 正常分类；`//` 单独 → not-relative THROW。
- **BOM 清单**：UTF-8 BOM 的 after 文件 → content EXIT=0（`TrimStart([char]0xFEFF)` 生效）。
- **snapshot scope 攻击面**：`change_scopes` 含 `/`、`../../../`、空串、空 `module_slug`、绝对盘符、`./`/`..` → 全部 EXIT=3 guard error（`Get-RelayContentAllowSet` 内部走 `Get-RelayPolicyPath`，非相对/`..` 判据同样兜住 authority 侧）——**R4-01 的修复顺带堵死了 snapshot 注入面**，这是 review5 没点到的正面外溢。
- **JSON 数组清单的合法用法**：`[".dh-runtime/relay/new.json","docs/modules/dh-crew/x.md"]` → iso `forbidden-root` / landing `legacy-root-write` / content `outside-allow-set`，三模式全 exit 1，分类正确。
- **E-008 自举**：三点 `master...HEAD` + porcelain NUL 拆分去重 **13 条**（比 review5 记的 12 多 1 条——master 前移后 `docs/modules/dh-crew/...` DCR89 四卡文件进三点 diff？否：三点 diff 只取 HEAD 侧，多出的 1 条是本 worktree 的 review-logs 累积）→ `-Mode dev-isolation` **EXIT=0**。
- **dh-crew 侧零影响**：E-016/E-017 的等价判据（run-all `-ListOnly` 105 套件 relay 0 行）账本在场，本卡未改任何 dh-crew 文件（diff 实证）。

## 路径变体穷举实测

纯函数三 verdict（iso=Get-RelayDevIsolationVerdict / content=Get-RelayContentPolicyVerdict / landing=Get-RelayLandingVerdict+markTrue）。三 verdict 结果逐条一致，合并展示。

### 非相对形态（R4-01 核心面，30 种全 THROW）

| 输入 | 期望 | 实际 | 判定 |
|---|---|---|---|
| `/.dh-runtime/n.json` | 拒 | THROW not-relative ×3 | ✅ |
| `D:/repo/.dh-runtime/n.json` | 拒 | THROW ×3 | ✅ |
| `C:\repo\.dh-runtime\n.json` | 拒 | THROW ×3 | ✅ |
| `D:.dh-runtime/n.json`（盘符相对，brief 点名） | 拒 | THROW ×3 | ✅ |
| `~/.dh-runtime/n.json` | 拒 | THROW ×3 | ✅ |
| `//server/share/.dh-runtime/n.json`（UNC） | 拒 | THROW ×3 | ✅ |
| `//.dh-runtime/n.json` | 拒 | THROW ×3 | ✅ |
| `\\?\C:\repo\.dh-runtime\n.json`（verbatim） | 拒 | THROW ×3 | ✅ |
| `D:/r/docs/modules/alpha/relay/x.json` | 拒 | THROW ×3 | ✅ |
| `/docs/modules/alpha/relay/x.json` | 拒 | THROW ×3 | ✅（口径矛盾已消失） |
| `\\?\D:.dh-runtime\n.json` | 拒 | THROW ×3 | ✅ |
| `\\.\C:\repo\x.ts`（设备命名空间） | 拒 | THROW ×3 | ✅ |
| `\\?\UNC\server\share\x.ts` | 拒 | THROW ×3 | ✅ |
| ` /tmp/evil.ps1`（前导空格+斜杠） | 拒 | THROW ×3 | ✅ |
| `  D:/repo/x.ts  `（前后空格） | 拒 | THROW ×3 | ✅ |
| `\.dh-runtime\n.json`（单反斜杠根） | 拒 | THROW ×3 | ✅ |
| `\server\share\x.ts` | 拒 | THROW ×3 | ✅ |
| `D:src/alpha/a.ts` | 拒 | THROW ×3 | ✅ |
| `C:src/alpha/a.ts` | 拒 | THROW ×3 | ✅ |
| `d:file.ts`（小写盘符） | 拒 | THROW ×3 | ✅ |
| `/x.ts` | 拒 | THROW ×3 | ✅ |
| `/ /x.ts` | 拒 | THROW ×3 | ✅ |
| `/./../../etc/passwd` | 拒 | THROW ×3 | ✅ |
| `~/../.ssh/id_rsa` | 拒 | THROW ×3 | ✅ |
| `~root/x.ts` | 拒 | THROW ×3 | ✅ |
| `~$tmp.docx`（R5-04） | 误伤面 | THROW ×3（fail-closed 方向） | ⚠️ R5-04 维持 P3 |
| `?C:/repo/x.ts` | 拒/无关 | iso/content REJ、landing ALLOW（非红线段） | ✅ fail-closed |
| U+2028 前缀 `evil.ps1` | 观察 | iso REJ unclassified / content REJ / landing ALLOW | ✅ fail-closed（条目被 U+2028 截断后剩 `evil.ps1` 单独分类——**注意这是 PowerShell 字符串语义，非守卫缺陷**） |
| `//`（双斜杠单独） | 拒 | THROW ×3 | ✅ |

### 优先级与组合（非相对 vs `..`）

| 输入 | 实际 reason | 判定 |
|---|---|---|
| `D:/repo/../x` | not-relative | ✅ 非相对赢 |
| `/repo/../.dh-runtime/n.json` | not-relative | ✅ |
| `~/../x` | not-relative | ✅ |
| `//srv/share/../x` | not-relative | ✅ |
| `D:../x` | not-relative | ✅ |
| `../D:/x` | dotdot | ✅（相对路径含 `..`，判据不应命中） |
| `a/../D:/x` | dotdot | ✅ |
| `.\.\..\..\x` / `..\../evil.ps1` / `a/../../\..\b`（混合反斜杠） | dotdot | ✅ 归一先于拒绝 |

### 非字母盘符不误杀

`1:foo` / `中:x` / `ab:foo` / `docs/a:b.md` → 全部正常分类（iso/content REJ unclassified/outside、landing ALLOW），`IsPathRooted` 均 False——两条判据边界重合，无缝隙无误杀。

### `..` 15 变体（回归）

review4 全部 14 条 + 尾随空格 `.. ` → 三 verdict 全 THROW `policy-path-dotdot: <原文>`（含反斜杠、大小写混合、`a/..//b`）。✅ 无回归。

## 清单条目攻击面（本 trip 新增主战场）

| 输入形态 | dev-isolation | content | landing | 判定 |
|---|---|---|---|---|
| NUL 分隔，首条 `tools/relay/a.ps1`（production_root 前缀） | **EXIT=0** | EXIT=1 | **EXIT=0** | ❌ R5-01 成立 |
| 真实 `git diff -z` 原始落盘 + 追加 legacy 红线 | **EXIT=0** | EXIT=1 | **EXIT=0** | ❌ R5-01 真实形态成立 |
| CR-only 分隔（U+000D，无 LF） | EXIT=1（偶然） | — | **EXIT=0** | ❌ **R6-01 新发现** |
| `".dh-runtime/relay/新.json"`（git 引号） | EXIT=1 | EXIT=1 | **EXIT=0** | ❌ R5-02 成立 |
| `"docs/modules/alpha/relay/新.json"` | — | — | **EXIT=0** | ❌ R5-02 |
| `"docs/modules/alpha/workspace/A_01/relay/新.json"` | — | — | **EXIT=0** | ❌ R5-02 |
| `"docs/modules/dh-crew/x.md"` | EXIT=1 | — | **EXIT=0** | ❌ R5-02（landing 对禁改根也放行） |
| `.dh-runtime/relay/\346\226\260.json`（纯八进制无引号） | — | — | EXIT=1 | ✅ fail-closed |
| 纯空格行清单 | EXIT=2 | — | EXIT=2 | ✅ 空清单 exit 2 |
| `src/alpha/a.ts` + 引号红线混排 | — | — | **EXIT=0** | ❌ 合法首条掩护引号条目 |
| JSON `[null/int/nested]` 条目 | EXIT=1 unclassified | — | — | ⚠️ R6-02（无类型守卫，方向安全） |

**对照（不带任何畸形的直接命中）**：`.dh-runtime/relay/new.json` 单独 → landing EXIT=1 `legacy-root-write`；`docs/modules/dh-crew/x.md` → dev-iso EXIT=1 `forbidden-root`。守卫本体分类正确——漏检全部发生在**清单条目形态层**。

## 变异探针

全部在 `%TEMP%\review6-probe-7d14262f0880421d9d494e153a16726c\relay\`（tools/relay 整树副本，基线先验 `SUITE PASS`/`ASSERTIONS 63`）上做；每条先验锚点命中（applied≥1，未命中即 throw 不采信），跑完从 base 还原 + SHA256 比对（restored=True）。

| 变异 | 套件反应 | 结论 |
|---|---|---|
| **M6-A** 整个非相对检查 `if ($false)` | `SUITE FAIL (6)`：盘符相对 throw / 前导斜杠+盘符模块 / 非相对赢 `..` / dev-iso exit3 / content exit3 / landing exit3 | R4-01 六条断言全有牙；与 review5 M5-A 的 FAIL(6) 复现一致 ✅ |
| **M6-B** 只删 `StartsWith('~')` 判据 | `SUITE FAIL (1)`：`content rejects tilde path with exit 3` | `~` 类被独立钉住 ✅ |
| **M6-E** 只删盘符正则 `^[A-Za-z]:` | `SUITE PASS` | 与 review5 M5-E（收窄+去兜底 FAIL(1)）互补：正则与 IsPathRooted 兜底**双保险**，删一个不红属冗余正确，两个都动才红——盘符类有独立断言 ✅ |
| **M6-K** 只删 `StartsWith('/')` 判据 | `SUITE PASS` | 同上：前导斜杠由 IsPathRooted 兜底补位（`\`→`/` 归一后 `/x` rooted=True）。review5 M5-K（删判据+去兜底）FAIL(2) 才是钉死证据。冗余非缺牙 ✅ |
| **M6-F** not-relative throw 去掉 `$Path` | `SUITE PASS` 无红 | **R5-03 复现成立**：not-relative 消息路径原文无断言 ❌ |
| **M6-G** dotdot throw 去掉 `$Path` | `SUITE FAIL (1)`：`guard error message includes the offending path` | dotdot 半边有牙 ✅（与 M6-F 的不对称坐实 R5-03） |
| **M6-H** CLI catch 把 dotdot 路由 exit 2 | `SUITE FAIL (3)`：三条 `rejects path with ..` | **R3-02 真有牙**，独立重做非抄 review5 ✅ |
| **M6-I** CLI catch 把 not-relative 路由 exit 2 | `SUITE FAIL (3)`：三条新增 `… with exit 3` | 新增三条 CLI 红测钉的是 3 ✅ |
| **M6-J** workspace 谓词 `-eq 'relay'`→`-contains` | `SUITE FAIL (2)`：两条不得误杀断言 | R1-02 护栏经二次返工后仍有牙 ✅ |
| **GATE-1** 抹掉套件唯一 `policy-violation:multi` 字面量 → 覆盖闸 | 闸门仍 PASS 70 | 该码生产侧赋值行也被采集，单抹测试字面量不足以触发 uncovered——覆盖闸对此码冗余覆盖，非闸门失效（GATE-2 行为探针见下） |
| **GATE-2** CLI 禁用 multi 分支（`if ($false)`） | 套件 `FAIL mode all multi-verdict reason is policy-violation:multi` | multi 语义有行为断言钉住 ✅ |

## 结论

**changes-requested（P0=0 P1=3 P2=0 P3=4）**

**核 review5：它的每一条结论我都独立重跑过，没有一条不成立**——R4-01 真修好（30 种非相对形态 × 三 verdict 全 THROW、CLI ×4 模式全 3、四类判据独立钉住）、R4-02 自然消解、R3-02 红测真有牙（M6-H 重做 FAIL(3)）、R3-03 行为修好但断言半边（M6-F/G 不对称复现）、R5-01/R5-02 两条 P1 我从最小复现到真实 git 输出形态全部独立复现（NUL 与引号形态在 dev-isolation/landing 均 EXIT=0）、R5-03/R5-04 维持。回归面 12 项里 11 项成立，1 项（"单 verdict 失败仍用原码"）是 review5 的表述不准而非代码缺陷，记 R6-03 观察项。范围零漂移、账本自洽、E-008 EXIT=0 全部复核通过。

**我在 review5 视角之外新增的**：**R6-01（P1）CR-only 清单分隔**——与 R5-01 同族但独立可复现：纯 U+000D 分隔的清单被粘成一条路径，landing 静默 EXIT=0，B9 legacy 根漏检。这坐实了 review5 的定性："路径**内容**不规范堵死了，**清单条目**不规范整条线没设防"——这条线上现在已知三种入口形态（NUL、CR、git 引号），全部通向静默绿章，且 E-008 用的正是单模式 dev-isolation。修法 review5 已给且我背书：`Read-RelayPolicyPathFile` 拆分一次覆盖 `[\0\r\n]+`，`Get-RelayPolicyPath` 对控制字符与前导/尾随双引号 throw，配红测钉 exit 3。若主控判"喂入形态由 DHR_12 宿主侧保证"，请照 R4-01 规矩把豁免写进 findings.md，别静默留着。

R6-02（JSON 非字符串条目无类型守卫，方向安全）、R6-03（`-Mode all` 顶层 reason 事实恒 multi）两条 P3 不阻塞。R5-03/R5-04 维持 P3。

**给主控的判定面**：三条 P1（R5-01/R5-02/R6-01）同源同一处可收，一轮小返工可清；五项二次返工本身质量过硬，本轮没有任何一条翻案。
