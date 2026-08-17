# review7 — DHR_04（三次返工后第一轮复审）

- 复核者：Grok（relay review7 worker）｜ 会话：独立会话，未继承施工上下文
- 复核范围：三次返工单笔 delta `b770a4b` + 完整回归复验 + 变异探针（主控 4 条重做 + 自造 3 条）+ 新入口证伪
- 纪律：全部亲跑复现，未采信主控账本自述；变异一律在 `%TEMP%\review7-mut\` 副本上做，每条写入后回读 `applied=True oldGone=True` 才跑套件；复核结束 `git status --porcelain` 为空

## 三条 P1 是否真封闭

| 发现 | 是否真修好 | 我的复现证据（命令 + 输出） |
|---|---|---|
| **R5-01** NUL 分隔清单被粘成一条超长路径 | **真修好** | 自造探针（首条落在会放行的根上，后面藏 B9 红线）：`docs/modules/dh-relay/workspace/DHR_04/findings.md\0.dh-runtime/relay/new.json` → `-Mode dev-isolation` **EXIT=1** `dev-isolation-violation:forbidden-root`；`-Mode landing` **EXIT=1** `landing-violation:legacy-root-write`。换首条 `tools/relay/policy/relay-policy.ps1`（production_root）同样双模式 EXIT=1。对照：同一条 `.dh-runtime/relay/new.json` 单独喂 → iso/landing 均 EXIT=1（守卫本体没坏）。`Get-Content -Raw` 诊断：NUL 文件 `Length=30 ContainsNUL=True`，拆分看得到两条，不是截断后只剩前缀。纯函数层把未拆的粘连条目 `throw policy-path-control-char`。 |
| **R5-02** git 引号形态 landing 静默放行 | **真修好（拒绝而非剥离）** | 自造 `".dh-runtime/relay/\346\226\260.json"` → landing **EXIT=3** / dev-isolation **EXIT=3**，stderr `policy-path-quoted`。另测 `"docs/modules/alpha/relay/\346\226\260.json"`、`"docs/modules/alpha/workspace/A_01/relay/\346\226\260.json"` landing 均 EXIT=3。纯函数：前导引号、尾随引号、两端引号一律 `policy-path-quoted`，没有剥引号后放行。 |
| **R6-01** 孤立 CR 分隔同样粘连 | **真修好** | 自造（字节 `0x0D`、无 LF）：`docs/modules/dh-relay/…/findings.md\r.dh-runtime/relay/new.json` → iso **EXIT=1** `forbidden-root`；landing **EXIT=1** `legacy-root-write`。换首条 `tools/relay/a.ps1` 同样双模式 EXIT=1。混合 `CRLF + NUL` 清单同样拆开后逮到 legacy。 |

R6-02（P3，顺手核）：`[null,"src/alpha/a.ts"]` / `[123]` / `[true,…]` / `[{"a":1},…]` / `["src/alpha/a.ts",["nested"]]` / `[[[["x"]]]]` 全部 **EXIT=3** `policy-list-entry-not-string`，不再降级 `unclassified-path`。`[]` 与 `[""]` → EXIT=2（空清单），方向 fail-closed。

## 清单条目形态穷举（含我自己新设计的入口）

「按构造封闭整类」我按两层来砸：① 拆分是否认；② 拆不开时纵深防御是否 throw，而不是前缀匹配放行。

| 输入形态 | 期望 | 实际 | 判定 |
|---|---|---|---|
| NUL 分隔，首条 doc_root / prod_root，藏 `.dh-runtime/relay/new.json` | 拆开并拒红线 | iso/landing EXIT=1，reason 分别为 forbidden-root / legacy-root-write | ✅ R5-01 封闭 |
| 孤立 CR 分隔，同上两套首条 | 拆开并拒 | 双模式 EXIT=1 | ✅ R6-01 封闭 |
| 混合 CRLF+NUL + legacy | 拆开并拒 | 双模式 EXIT=1 | ✅ |
| NUL 空中段（`a\0\0legacy`） | 空段丢弃，红线仍拒 | 双模式 EXIT=1 | ✅ |
| 只有 NUL / 只有 CRLF 的文件 | 空清单 exit 2 | EXIT=2 | ✅ |
| BOM + NUL 分隔 + legacy | BOM 剥掉后仍拆开 | 双模式 EXIT=1 | ✅ |
| git 引号 + 八进制中文 | throw quoted / exit 3 | 双模式 EXIT=3 `policy-path-quoted` | ✅ R5-02 |
| 引号 + NUL 混排（`\"legacy\"\0doc`） | 先拆再对引号条 throw | 双模式 EXIT=3 | ✅ |
| JSON null / 数字 / bool / object / 嵌套数组 / 深层嵌套 | throw not-string / exit 3 | 全 EXIT=3 `policy-list-entry-not-string` | ✅ R6-02 |
| JSON 合法双红线 | 分类拒，exit 1 | EXIT=1 forbidden-root | ✅ |
| JSON `""` / `[]` | 空 → exit 2 | EXIT=2 | ✅ fail-closed（空串被 Where-Object 滤掉，不走 `policy-path-empty`） |
| TAB / VT / FF 分隔（C0） | 不拆，但控制字符 throw | 双模式 EXIT=3 `policy-path-control-char` | ✅ 纵深防御（非法路径字符） |
| DEL `\x7F` | throw control-char | 纯函数 `policy-path-control-char` | ✅ |
| **U+2028 LINE SEPARATOR 分隔**（首条 doc_root 或 prod_root，藏 legacy） | 证伪「整类封闭」 | **iso EXIT=0 空报告；landing EXIT=0 空报告**。content EXIT=1 是白名单顺手拦（violations.path 是整条 glued，含 `\u2028`），与 R5-01 修前同一偶然。单独喂 legacy → 双模式 EXIT=1，说明漏检发生在条目层。 | ⚠️ **R7-01** |
| **U+2029 PARAGRAPH SEPARATOR** 同上 | 同上 | iso/landing **EXIT=0** 空报告 | ⚠️ R7-01 |
| **U+0085 NEL** 同上 | 同上 | iso/landing **EXIT=0** 空报告 | ⚠️ R7-01 |
| U+00A0 NBSP / U+200B ZWSP / 空格 / 逗号「分隔」 | 观察 | 双模式 EXIT=0（这些是 NTFS 合法文件名字符，当一条路径做前缀匹配） | 扫过：不是行分隔符，不单列 |
| 智能引号 U+201C/U+201D、单引号包裹的 legacy | 观察 | 纯函数 ALLOW（当相对路径，匹配不上 `.dh-runtime/` 根） | 扫过：git quotePath 产出的是 ASCII `"`，已被 R5-02 拦住 |
| porcelain ` M tools/relay/…` | 不得当 production_root 放行 | EXIT=1 `production-outside-relay`（前缀 ` M ` 打偏根） | ✅ 方向 fail-closed |
| 推荐命令三条 `-z` 原始拼接 | 裸路径、零预处理 EXIT=0 | 本树 `master...HEAD` 14 条全是 `tools/relay/` 或 `docs/modules/dh-relay/`，concat → **EXIT=0**。临时仓实证：`ls-files -z --others` 对 `未跟踪.txt` **无引号**；`status --porcelain -z` 为 `?? 未跟踪.txt`（有前缀） | ✅ 头部三条命令确实产裸路径；porcelain 确实不是 |

**混合形态与注释里的优先级**（空 > 控制字符 > 引号 > 非相对 > dotdot），纯函数亲测：

| 混合输入 | 实际 reason | 与注释是否一致 | 有无断言 |
|---|---|---|---|
| `"path"\0hidden`（引号+NUL） | `policy-path-control-char` | ✅ 控制字符 > 引号 | ❌ 无 |
| `"D:/repo/.dh-runtime/n.json"`（引号+绝对） | `policy-path-quoted` | ✅ 引号 > 非相对 | ❌ 无 |
| `"../evil.ps1"`（引号+dotdot） | `policy-path-quoted` | ✅ 引号 > dotdot | ❌ 无 |
| `foo\0../bar`（控制+dotdot） | `policy-path-control-char` | ✅ | ❌ 无 |
| `D:/repo\0.dh-runtime/n.json`（控制+绝对） | `policy-path-control-char` | ✅ | ❌ 无 |

代码实现与注释一致；**没有任何断言钉住优先级**（见变异 G：把引号收成只判前导，套件仍 PASS）。

## 回归复验

| 项 | 结论 | 证据 |
|---|---|---|
| 1. `..` 十几种变体仍全部 throw / exit 3 | **仍对** | 15 种（`tools/relay/../…`、反斜杠、`a/../b`、`..\..\evil.ps1`、大小写混合、`a/..//b`、尾随空格 `.. `、`./../x`、`foo/bar/../../x`、`a/./../b`、`x/..`、`../`、`..`、`a\..\b`、`.\.\..\..\x`）纯函数 iso+content 全 `policy-path-dotdot`。CLI `a/../b` → EXIT=3。套件三条 `rejects path with ..` 仍绿。 |
| 2. 非相对 30 余种仍全部 throw | **仍对** | 24 种亲跑（前导 `/`、盘符绝对/相对、UNC、verbatim `\\?\`、`~`/`~/`、`D:`/`D:/`、`/`、`//`、`D:src/…`、`~/../x`、`D:/repo/../x` 等）全 `policy-path-not-relative`。非相对仍赢 `..`。 |
| 3. 内部 `./` 消解；`.dh-relay/./RUN-x/events.jsonl` 仍放行 | **仍对** | `src/./alpha/a.ts` → `src/alpha/a.ts`。`.dh-relay/./RUN-x/events.jsonl` → content **EXIT=0**（固定根 `.dh-relay/`）；iso 报 unclassified（CLI 隔离策略本来不含该根，与 review5 测的是 content 一致）。隐藏目录没被控制字符/引号判据牵连。 |
| 4. `~` 收窄有没有开新口子 | **收窄本身成立；`~user/` 被放开且无断言** | `~` / `~/` / `~/x` / `~\x` 仍 throw not-relative；`~$tmp.docx` / `~$` / `~x` 放行（R5-04 意图）。**`~root/x`、`~Administrator/x`、`~~`、`~.` 现为普通相对路径**；`~root/.dh-runtime/n.json` landing **EXIT=0**（匹配不上 `.dh-runtime/` 根）。见 R7-02。 |
| 5. 两条不得误杀 + 卡授权路径 | **仍对** | `docs/modules/relay/design/01.md` landing EXIT=0；`docs/modules/relay/workspace/X/progress.md` landing EXIT=0。content：`src/alpha/a.ts` EXIT=0、`src/beta/util.ts` EXIT=0、`src/beta/other.ts` EXIT=1 `outside-allow-set`。套件对应断言全绿。 |
| 6. 五处 fail-closed + legacy 根 | **仍对** | 套件 `null snapshot` / `content mode without args exits 2` / `unknown path is unclassified` / `unprobed marker` / `unknown category` 全 PASS。legacy 单独喂 iso/landing EXIT=1。 |
| 7. 四态退出码；新 throw 码有没有挤占 | **仍分明** | 亲跑：干净 iso EXIT=0；forbidden EXIT=1；content 缺 snapshot EXIT=2；`..` EXIT=3。新码 `policy-path-control-char` / `policy-path-quoted` / `policy-list-entry-not-string` 全部走 `Exit-RelayPolicyGuardError` → **只占 3**，不与 0/1/2 重叠。 |
| 8. 接线 + 覆盖闸 | **仍对** | `run-relay-tests.ps1:18-19`：`relay-policy.ps1` 在 `relay-contract-reason-coverage.ps1` 之前。`productionRoots` 含 `../policy`。全量末行 `PASS  production reason codes covered: 70`。新 throw 码与既有守卫码一样不进采集面（F-006 成立）。 |
| 9. E-008 自举 + 三条推荐命令是否真产裸路径 | **仍 EXIT=0；命令本身核过** | `git -c core.quotePath=false diff --name-only -z master...HEAD` 14 条裸路径（无引号、无 porcelain 前缀）→ iso EXIT=0。临时仓：`ls-files -z --others` 产出裸 `未跟踪.txt`；`diff --name-only -z` 产出裸 `tools-rel.txt`；`status --porcelain -z` 产出 `?? 未跟踪.txt`。**头部改掉 porcelain 推荐是对的，没有在同一处再犯。** 本树 `diff -z HEAD` 与 `ls-files --others` 为空（工作区干净），故 concat 条目数是 14 不是账本写的 17——差在施工当时的未提交/未跟踪，不是命令错。 |
| 10. 单套件 / 全量回归 | **全绿** | `relay-policy.ps1`：`ASSERTIONS 78` / `SUITE PASS`。清 `RELAY_*` 子进程全量：16 套件、`RELAY ALL PASS (SKIPPED: 1)`、闸门 70。本壳 `RELAY_*` 仍在。 |

## 变异探针（含回读校验）

副本：`%TEMP%\review7-mut\work`，基线先验 `ASSERTIONS 78 / SUITE PASS`。每条 `Restore` → 写变异 → **回读 `applied=True oldGone=True`** 再跑；全部结束后 SHA256 `RESTORED pol=True cli=True tst=True`。仓库 `git status --porcelain` 为空。

| 变异 | 变异已生效？ | 套件反应 | 结论 |
|---|---|---|---|
| **A** 控制字符 throw 改 `if ($false)`（主控同款） | applied=True oldGone=True | **SUITE FAIL (2)**：`path containing NUL throws control-char` + `path containing bare CR throws control-char with path` | 与主控 E-035 的 FAIL(2) 一致，有牙 ✅ |
| **B** 引号 throw 改 `if ($false)`（主控同款） | applied=True | **SUITE FAIL (3)**：纯函数 quoted + landing exit 3 + iso exit 3 | 与 E-035 FAIL(3) 一致 ✅ |
| **D** 拆分退回 `\r?\n`（主控同款） | applied=True | **SUITE FAIL (5)**：NUL×2 + CR×2 + **porcelain 那条** | 有牙 ✅；主控记 FAIL(4)，漏数了同批加的 porcelain 断言（见 E-035 复验） |
| **C** `~` 退回 `StartsWith('~')`（主控同款） | applied=True | **SUITE FAIL (1)**：`tilde-dollar lock file is a normal relative path` | 与 E-035 FAIL(1) 一致；try/catch 包住没把套件炸死 ✅ |
| **F** 控制字符正则改成只拦 `\x0A\x0D`、不拦 `\0`（自造） | applied=True | **SUITE FAIL (1)**：恰红 NUL 那条，CR 条仍绿 | NUL 半边被独立钉住，不是「拦了 CR 就蒙对 NUL」✅ |
| **G** 引号判据改成只判 `StartsWith`、不判 `EndsWith`（自造） | applied=True oldGone=True | **SUITE PASS 无红** | **R7-03**：现役夹具是两端都有 `"` 的完全包裹串，收成只判前导/只判尾随都看不见。行为上两端都拒（我纯函数测过），缺的是断言 ❌ |
| **H** JSON 守卫 `-isnot [string]` 改成 `-eq $null`（自造） | applied=True | **SUITE FAIL (1)**：`JSON list with nested array entry exits 3` | 嵌套数组有牙；null 条带 `policy-list-entry-not-string` 字面量，改成只拦 null 时它仍绿——数字/bool 没有独立断言（我 CLI 亲跑过它们确为 exit 3） |

主控 E-035 自称 A/B/C/D/E = 2/3/1/4/2。A/B/C 我复现一致；D 实际是 5 不是 4；E（去整个 JSON 类型守卫）我改做成更窄的 H，仍见红。

## 新发现

| ID | 级别 | 问题 | 证据 | 建议 |
|----|------|------|------|------|
| R7-01 | P3 | **Unicode 行分隔符（U+2028 / U+2029 / U+0085）仍会把清单粘成一条路径，doc_root / production_root 前缀吞掉后面的 B9 红线，iso 与 landing 静默 EXIT=0。** 主控「按构造封闭整类」对 *不能出现在 Windows 路径里的* 分隔符（NUL/CR/LF + 其余 C0/DEL throw）成立；对 Unicode 行终止符不成立。content 拦是白名单偶然，与 R5-01 修前同一形状。可达性低于 NUL/CR：推荐的三条 git `-z` 命令不产出这些字符；它们又是 NTFS 合法文件名字符，自动当分隔符拆会误伤真文件名。故不按 R5-01 口径升 P1。 | 自造文件 `docs/modules/dh-relay/…/findings.md` + U+2028 + `.dh-runtime/relay/new.json` → iso **EXIT=0 空报告**、landing **EXIT=0 空报告**；换首条 `tools/relay/policy/relay-policy.ps1` 同样双 0。U+2029 / U+0085 同。对照 legacy 单独喂双 1。content 报告里的 path 带 `\u2028`，证明没拆开。 | 若要真正「整类」封闭行终止符，拆分/控制字符集扩到 U+0085/U+2028/U+2029（接受误伤合法文件名），或在头部契约写明「只认 NUL/CR/LF，其它码点当路径字符、前缀匹配自负」。不阻塞。 |
| R7-02 | P3 | **R5-04 收窄 `^~($\|/)` 把 POSIX `~user/` 家目录形态放开了，且无断言。** review6 当时 `~root/x.ts` 是 THROW not-relative；现在 `~root/`、`~Administrator/`、`~~`、`~.` 都当普通相对路径。`~root/.dh-runtime/n.json` landing EXIT=0（匹配不上 `.dh-runtime/`）。`~\` 归一后仍拦，这一侧是对的。 | 纯函数：`~root/x` → ALLOW；CLI `~root/.dh-runtime/n.json` landing EXIT=0、iso EXIT=1 unclassified。套件只钉 `~$tmp.docx` 放行和 `~/` 仍拒。变异 C 只能钉「不要退回一律拦」，钉不住「不要把 `~user/` 当相对」。 | 若 `~user/` 要继续当相对路径，写进头部契约 + 补一条「`~root/` 不 throw」正例；若要当非相对，判据改 `^~($\|[^$])` 一类并补红测。不阻塞。 |
| R7-03 | P3 | **引号断言的夹具是两端都有 `"` 的完全包裹串，前导-only / 尾随-only 各自没牙。** 行为上 `StartsWith` 与 `EndsWith` 都写了（我纯函数：`foo.json"` 与 `"foo.json` 都 throw quoted）。 | 变异 G：`StartsWith('"') -or EndsWith('"')` → 只留 `StartsWith`，回读确认生效 → **SUITE PASS 无红**。 | 补一条只尾随 `"` 的红测（或只前导、不含尾随）。不阻塞。 |
| R7-04 | P3 | **注释里写的拒绝优先级（控制字符 > 引号 > 非相对 > dotdot）没有断言。** 实现与注释一致（见上表五条混合），但把顺序对调套件看不见。 | 现役套件没有任何「既引号又 NUL / 既引号又绝对」夹具。我亲跑混合形态确认当前顺序，未采信注释。 | 挑 1～2 条混合夹具钉死外层 reason。不阻塞。 |

**扫过但判定没问题、不单列 finding 的**：

- **范围零漂移**：`b770a4b` 恰 5 文件（`relay-policy.ps1` / `Invoke-RelayPolicyCheck.ps1` / `tests/relay-policy.ps1` / 本卡 `progress.md` / `findings.md`）。未碰 `relay-agent-tool.ps1`、`contracts/`/`runner/`/`host/`/`adapters/`、dh-crew、`D:\relay-stage0\`、DevPlan 状态列、`review.md`、`review-logs/*`。`as-built/` 仍只有 contracts / psmux-host / runner 三件，**没有偷建 `relay-policy.md`**。
- **E-026～E-035 复跑对账**（只信我跑出来的）：E-026 返工后态我复现为双模式 EXIT=1（未 checkout 父提交去验「返工前 EXIT=0」，那半句不采信也不反证）；E-027 EXIT=3 quoted ✅；E-028 EXIT=3 not-string ✅；E-029 断言在场且套件绿 ✅；E-030 `~$tmp.docx` ALLOW / `~/` throw ✅；**E-031 `fail(预期)` 记法诚实**——porcelain 不是裸路径，方向 fail-closed；我这边工作区干净，live `status --porcelain -z` 为空，改用临时仓看到 `?? 未跟踪.txt`、合成 ` M tools/relay/…` → EXIT=1；E-032 推荐命令裸路径 + 本树 concat EXIT=0（14 条 vs 账本 17 条，差在当时脏工作区）；E-033 `ASSERTIONS 78` ✅；E-034 全量 `RELAY ALL PASS (SKIPPED: 1)` / 闸门 70 ✅；E-035 变异有牙，但 D 的条数记成 4、我复现是 5。
- **F-005 / F-006**：放行记法与 F-004 同型（P3 / 观察记录 / 主控裁决放行 / open）。F-005 我复跑 `src/gamma/a.ts -Mode all` 顶层确为 `policy-violation:multi`。F-006 对照采集器 `:55-76`，守卫 throw 确不在采集面。markdown 上 F-005/F-006 前多了一行空行，表头断了，不影响内容。
- **JSON 数字/bool 无独立断言**：CLI 亲跑是 exit 3；套件只钉 null（带字面量）和 nested（只钉 exit 3）。属断言密度，不单列。
- **R1-07②** landing CLI 仍传 `$null` MarkerProbe，沿用前六轮 P3，本卡未动。
- **R6-03 / 覆盖闸采集面** 按 brief 不修，F-005/F-006 在场。

## 结论

**approved（P0=0 P1=0 P2=0 P3=4）**

三次返工要收的三条 P1（R5-01 NUL / R5-02 引号 / R6-01 孤立 CR）我用自己的探针文件重跑，**全部由「会静默绿章」变成非 0**（1 或 3），不是账本说修好就算修好。R6-02 JSON 非字符串、R5-03 not-relative 消息含路径、R5-04 `~$` 放行 / `~/` 仍拒、头部三条推荐命令产裸路径、porcelain 不再被写成推荐——这些也是真的。回归面（`..`、非相对、内部 `./`、不得误杀、卡授权、五处 fail-closed、legacy、四态退出码、接线、闸门 70、E-008、全量 16 套件）没有被这单笔改坏。变异 A/B/C/D/F/H 回读后见红，断言有牙。

「按构造封闭整类」对 **ASCII 非法路径字符** 那一类成立（NUL/CR/LF 拆开，其余 C0/DEL throw，推荐 `-z` 可直喂）；被我证伪的是把它读成「任何能当行结束的 Unicode 码点」——U+2028/U+2029/U+0085 仍能粘连并让 iso/landing 盖绿章，记 R7-01 P3。另外三件 P3 都是收窄/`~user/` 边界没写清、以及新 throw 的优先级/引号两端缺独立断言，不阻塞。
