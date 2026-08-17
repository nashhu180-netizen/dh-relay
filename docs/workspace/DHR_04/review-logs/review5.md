# review5 — DHR_04（二次返工后第一轮复审）

- 复核者：Claude Opus 5（1M 上下文）｜ 会话：二次返工棒之后的独立会话（node=review5 / attempt=1 / launch=L-0002）
- 复核范围：二次返工 delta（6 笔提交 · 5 文件）+ **完整代码复核**（`Get-RelayPolicyPath` 是三 verdict 共用地基，按 brief 要求不只看 delta）+ 完整回归复验 + 变异探针 13 条 + 黑盒 CLI 探针 80 余条 + 两条 brief 未点名的输入形态独立砸
- 复核基准：DevPlan `#### DHR_04` 三条机器证 · design/02 §6.1 B9 整行 · `task_plan.md` · 二次返工 brief 五项
- 纪律：**全部亲跑复现，未采信 fix2 handoff 自述**；变异探针一律在 scratchpad 副本 `…\scratchpad\mut\relay\` 上做，每条做完还原并逐字节比对（`RESTORED pol=True cli=True`），复核结束 `git status --porcelain` 为空、`$env:TEMP` 下 `relay-policy-*` 残留 COUNT=0、scratchpad 副本已删

## 逐条验返工

| 原发现 | 是否真修好 | 我的复现证据（命令 + 输出） |
|---|---|---|
| **R4-01（P1）非相对路径静默放行** | **真修好** | `relay-policy.ps1:7-15` 在反斜杠归一之后、逐段处理之前四类判据任一命中即 `throw "policy-path-not-relative: $Path"`。**纯函数 33 种非相对形态 × 三 verdict = 99 次调用全部 THROW**（review4 点名 9 种 + 我自造 24 种，见下表）；**CLI 15 种输入 × 4 模式 = 60 次亲跑，非相对形态一律 `EXIT=3`**，无一条 exit 0。四类判据我逐类单独变异，**每一类都各自有断言钉住**（M5-B/D/E/K，见变异表）——不是"只判 `IsPathRooted` 漏掉盘符相对"的写法。 |
| **R4-02（P3）绝对路径 reason 语义不准** | **真消解**（自然消解，代码未动，与 handoff 自述一致） | 亲跑 `D:/repo/.dh-runtime/n.json`、`D:/repo/docs/modules/dh-crew/x.md`：纯函数三 verdict 全 `THROW: policy-path-not-relative: <原文>`，CLI `dev-isolation` / `content` / `landing` / `all` 全 `EXIT=3`。两条都在 `Test-RelayPolicyUnderRoot` 的 `StartsWith` 之前就被拦掉，不再误报 `unclassified-path`。**分支走向与 handoff 自述一致**（我用纯函数逐条打印规范化结果核对，非采信）。 |
| **R3-02（P3）`..` 三条红测不钉 exit 3** | **真修好，且真有牙** | `tests/relay-policy.ps1:126/131/138` 现为 `Assert-True ($LASTEXITCODE -eq 3)`。**我自己重做 M-H 变异**（scratchpad 副本 CLI catch 里把 `policy-path-dotdot` 路由到 `Exit-RelayPolicyInputError`=exit 2）→ **`SUITE FAIL (3)`**，恰红 `dev-isolation/content/landing rejects path with ..`。review4 同一变异当时是 `SUITE PASS` 无红——**这次是真变红了**。 |
| **R3-03（P3）守卫异常不带路径原文** | **行为真修好；断言只钉住一半**（见 R5-03） | `relay-policy.ps1:14/19` 两处 throw 均为 `"<code>: $Path"`。CLI stderr 亲跑实测：`relay-policy: guard error: policy-path-dotdot: tools/relay/../protocol/evil.ps1`、`relay-policy: guard error: policy-path-not-relative: D:/repo/.dh-runtime/n.json`——**两种 throw 都能定位到具体哪条路径**。断言侧：`dotdot` 半边有 `.Contains('tools/relay/../protocol/evil.ps1')` 钉死（M5-G 变异 → 恰红 1 条）；**`not-relative` 半边无任何断言钉路径原文**（M5-F 变异 → `SUITE PASS` 无红）。 |
| **R4-03（P3）git 引号形态输入契约** | **头部契约写了；"只文档不加固"的决定建立在一个不成立的前提上**（见 R5-02） | `Invoke-RelayPolicyCheck.ps1:3-11` 写明只收仓库相对路径 + 须 `-z`/`core.quotePath=false` + 两条可照抄命令 + 三点比较提示，位置紧挨退出码契约，属实。剥引号加固未做，handoff 写了理由（半剥盖不住 `\xxx` 八进制），理由本身站得住。**但我自造 git 引号路径喂进去发现：review4「方向 fail-closed（不放行）」的判断只在 `dev-isolation`/`content` 成立，在 `landing` 是静默 `EXIT=0`**——引号形态的 `.dh-runtime/relay/新.json`、`docs/modules/alpha/relay/新.json`、`docs/modules/alpha/workspace/A_01/relay/新.json` 三条 B9 红线路径全部被 landing 盖章放行。 |
| **主控已放行的 R3-04** | 已按要求记账，不当未修问题报 | `findings.md` F-004 在场（`33b7c0a` 加入），写明"主控已裁决放行，不补测试"，并交代了 review4 的独立验真结论。测试未改，符合放行口径。 |

## 非相对路径形态穷举实测

纯函数三 verdict（`Get-RelayDevIsolationVerdict` / `Get-RelayContentPolicyVerdict` / `Get-RelayLandingVerdict`，landing 传 `$markTrue`）。**下表每一行三个 verdict 结果完全一致**，故合并成一列。

| 输入 | 期望 | 实际（纯函数 ×3） | CLI ×4 模式 | 判定 |
|---|---|---|---|---|
| `/.dh-runtime/n.json` | 拒 | THROW `policy-path-not-relative: /.dh-runtime/n.json` | EXIT=3 ×4 | ✅ |
| `D:/repo/.dh-runtime/n.json` | 拒 | THROW not-relative | EXIT=3 ×4 | ✅ |
| `C:\repo\.dh-runtime\n.json` | 拒 | THROW not-relative | EXIT=3 ×4 | ✅ |
| **`D:.dh-runtime/n.json`（盘符相对）** | 拒 | THROW not-relative | EXIT=3 ×4 | ✅ |
| `~/.dh-runtime/n.json` | 拒 | THROW not-relative | EXIT=3 ×4 | ✅ |
| `//server/share/.dh-runtime/n.json`（UNC） | 拒 | THROW not-relative | EXIT=3 ×4 | ✅ |
| `//.dh-runtime/n.json` | 拒 | THROW not-relative | EXIT=3 ×4 | ✅ |
| `\\?\C:\repo\.dh-runtime\n.json`（verbatim） | 拒 | THROW not-relative | EXIT=3 ×4 | ✅ |
| `D:/r/docs/modules/alpha/relay/x.json`（盘符模块） | 拒 | THROW not-relative | EXIT=3 ×4 | ✅ |
| **`/docs/modules/alpha/relay/x.json`（前导斜杠模块）** | 拒 | THROW not-relative | EXIT=3 ×4 | ✅ **与上条口径一致，review4 记的自相矛盾已消失** |

**我自造、brief 与 review4 都没点名的 24 种变体**（全部纯函数 ×3 THROW `policy-path-not-relative`，未做 CLI 复跑的以纯函数为准）：

`d:/repo/.dh-runtime/n.json`（小写盘符）、`Z:\x\.dh-runtime\n.json`、`D:`、`D:/`、`D:\`、`/`、`//`、`///.dh-runtime/n.json`、`~`、`~x/.dh-runtime/n.json`、`~$tmp.docx`、`\\server\share\x.ts`、`\\.\C:\repo\x.ts`（设备命名空间）、`\\?\UNC\server\share\x.ts`、` /.dh-runtime/n.json`（前导空格）、`  D:/repo/x.ts  `（前后空格）、`\.dh-runtime\n.json`（单反斜杠根）、`D:src/alpha/a.ts`、`C:src/alpha/a.ts`、`\\?\D:.dh-runtime/n.json`

**非相对 + `..` 同时出现（优先级）**：

| 输入 | 实际 reason | 与 handoff 自述是否一致 |
|---|---|---|
| `D:/repo/../x` | `policy-path-not-relative` | ✅ 一致（非相对赢） |
| `/repo/../.dh-runtime/n.json` | `policy-path-not-relative` | ✅ |
| `~/../x` | `policy-path-not-relative` | ✅ |
| `//srv/share/../x` | `policy-path-not-relative` | ✅ |
| `../D:/x`（`..` 在前、盘符在中段） | `policy-path-dotdot` | ✅ 正确（它本来就是相对路径，非相对判据不该命中） |

**优先级有断言钉住**：`non-relative wins over dotdot when both present`（`tests/relay-policy.ps1:18`，输入 `D:/repo/../.dh-runtime/n.json`），且经 **M5-M 变异实证有牙**（把非相对检查搬到段遍历之后 → 恰红这一条）。

**非字母盘符不误杀**（顺带核 `^[A-Za-z]:` 没写宽）：`1:foo` / `中:x` / `ab:foo` / `docs/a:b.md` 均正常规范化放行，`[IO.Path]::IsPathRooted` 对它们也是 `False`——两条判据口径一致，无缝隙也无误杀。

## 回归复验（原来对的东西还对吗）

| 项 | 结论 | 证据 |
|---|---|---|
| 1. `..` 的 14 种变体仍全部 THROW / exit 3 | **仍对** | review4 那张表照抄跑，14 条纯函数 ×3 全 `THROW: policy-path-dotdot: <原文>`（含反斜杠 `tools\relay\..\protocol\evil.ps1`、`a\..\b`、`..\..\evil.ps1`，大小写混合 `SRC/Alpha/../Gamma/X.TS`，`a/..//b`，尾随空格 `.. `）；CLI `tools/relay/../protocol/evil.ps1` ×4 模式 EXIT=3 |
| 2. 内部 `./` 消解仍正确 | **仍对** | `src/./alpha/a.ts` → `src/alpha/a.ts`、content **ALLOW**；`tools/./relay/x.ps1` → dev-iso **ALLOW**；`.dh-relay/./RUN-x/events.jsonl` → `.dh-relay/run-x/events.jsonl`、content **ALLOW**（隐藏目录没被 `~`/`/` 新判据牵连） |
| 3. 两条不得误杀反例仍放行 | **仍对** | `docs/modules/relay/design/01.md` landing ALLOW；`docs/modules/relay/workspace/X/progress.md` landing ALLOW；run 前已存在的同名目录 `docs/modules/alpha/relay/x.json`（在 BeforePaths 里）→ 套件 `pre-existing module relay folder is not a hit` PASS。**并经 M5-J 变异复证护栏仍有牙**（`$parts[5] -eq 'relay'`→`-contains` → 恰红 2 条） |
| 4. 卡授权业务代码路径仍可写 | **仍对** | `src/alpha/a.ts` content ALLOW；`src/beta/util.ts`（精确文件 scope）ALLOW；`src/beta/other.ts` reject `content-policy-violation:outside-allow-set` |
| 5. 五处 fail-closed 仍真拒 | **仍对** | 全量回归里五条断言全 PASS：`null snapshot is missing-authority` / `content mode without args exits 2` / `unknown path is unclassified` / `unprobed marker is fail-closed` / `unknown category is unclassified` |
| 6. legacy 根规范相对形态仍无条件拒 | **仍对** | `.dh-runtime/relay/new.json` → landing `legacy-root-write`、dev-iso `forbidden-root`、content `outside-allow-set`；`.dh-runtime//relay/new.json`（双斜杠）同样三拒 |
| 7. `-Mode all` 顶层 `policy-violation:multi` 仍自洽 | **仍对** | 多 verdict 失败 → 顶层 `"reason": "policy-violation:multi"`；**单 verdict 失败仍用原码**：`docs/modules/dh-relay/design/03.md` 只 content 失败 → 顶层 `content-policy-violation:outside-allow-set`（亲跑） |
| 8. 退出码四态契约仍 0/1/2/3 分明 | **仍对** | 0=`docs/modules/dh-relay/design/03.md` dev-iso；1=违规带 JSON 报告；2=缺参 / 空 AfterPath；3=`..` / 非相对 / 畸形 snapshot。60 次 CLI 亲跑无一态错位 |
| 9. 接线仍正确 | **仍对** | 全量输出里 `=== relay-policy.ps1 ===` 排在 `=== relay-contract-reason-coverage.ps1 ===` **之前**（第 15/16 位）；`relay-contract-reason-coverage.ps1:57` `$productionRoots` 含 `'../policy'`；闸门 `PASS  production reason codes covered: 70`。新码 `policy-path-not-relative` 是守卫 throw、不落 `reason=` 赋值行，与既有 `policy-path-dotdot`/`policy-path-empty` 同待遇不进闸门统计——**闸门口径未被新码打乱**（我读了 `:55-76` 的采集规则确认，非仅凭 70 这个数） |
| 10. E-008 自举复跑 | **仍 EXIT=0** | `git -c core.quotePath=false diff --name-only -z master...HEAD` + `status --porcelain -z --untracked-files=all` 按 NUL 拆开、去重 **12 条** → `-Mode dev-isolation` → **EXIT=0**（与 handoff 自述的 12 条一致） |
| 11. 单套件 / 全量回归 | **全绿零回归** | 单套件 `ASSERTIONS 63` / `SUITE PASS`；清 `RELAY_*` 子进程跑全量 → 16 套件、零 FAIL、末行 `RELAY ALL PASS (SKIPPED: 1)` / EXIT=0 |
| 12. reason 码断言有没有漏改成假绿 | **没漏改** | 全仓 grep `policy-path-(dotdot\|not-relative\|empty)`：生产侧 4 处 throw、测试侧 4 条断言，**没有任何残留的 `-eq 'policy-path-…'` 全等断言**，别的套件零引用。④ 把 3 条全等改 `StartsWith` 是必要的、也改全了；代价见 R5-03 |

## 变异探针

全部在 scratchpad 副本上做（副本基线先验 `ASSERTIONS 63 / SUITE PASS`）；每条都先校验锚点命中数 `=1` 才采信结论（避免 review3 记过的"锚点没命中导致假无红"），做完还原并逐字节比对 `RESTORED pol=True cli=True`。

| 变异 | 套件反应 | 结论 |
|---|---|---|
| **M5-A** 整个非相对检查去掉（`if ($false)`） | **`SUITE FAIL (6)`**：drive-relative / leading-slash+drive-module / priority / dev-iso exit3 / content exit3 / landing exit3 | R4-01 六条新断言全部有牙；**恰好复现 handoff 自述的"先红 SUITE FAIL (6)"** ✅ |
| **M5-B** 只留 `IsPathRooted` 兜底（去掉三条显式判据） | **`SUITE FAIL (1)`**：`content rejects tilde path with exit 3` | `~` 这一类判据被单独钉住 ✅ |
| **M5-C** 去掉 `IsPathRooted` 兜底（留三条显式判据） | `SUITE PASS` 无红 | 兜底是**纯冗余**（见下方"扫过但不记 finding"的推演 + 实测），非缺牙 |
| **M5-D** 只留 `StartsWith('/')` | **`SUITE FAIL (5)`** | 盘符 / 盘符相对 / `~` 三类都被钉住 ✅ |
| **M5-E** 盘符判据收窄成 `^[A-Za-z]:[\\/]`（只认绝对盘符）+ 去兜底 | **`SUITE FAIL (1)`**：`Get-RelayPolicyPath throws on drive-relative path` | **brief 点名要单独试的那一类**：盘符相对确实被独立断言钉住，不是"只判 IsPathRooted 蒙对的" ✅ |
| **M5-K** 去掉 `StartsWith('/')` + 去兜底 | **`SUITE FAIL (2)`**：leading-slash+drive-module / landing exit3 | 前导斜杠类被钉住 ✅ |
| **M5-M** 非相对检查搬到段遍历**之后**（优先级反转） | **`SUITE FAIL (1)`**：`non-relative wins over dotdot when both present` | 优先级本身被钉住 ✅ |
| **M5-F** `throw "policy-path-not-relative: $Path"` → `throw 'policy-path-not-relative'` | `SUITE PASS` **无红** | **R5-03**：not-relative 的路径原文没有断言钉住 ❌ |
| **M5-G** `throw "policy-path-dotdot: $Path"` → 去掉 `$Path` | **`SUITE FAIL (1)`**：`guard error message includes the offending path` | dotdot 半边有牙 ✅ |
| **M5-L** `..` 的 throw 整个去掉 | **`SUITE FAIL (4)`**：三条 `rejects path with ..` + 消息含路径 | `..` 拒绝仍有牙（③ 改成 `-eq 3` 没削弱它） ✅ |
| **M5-H** CLI catch 把 `policy-path-dotdot` 路由到 exit 2（review4 的 M-H 原样重做） | **`SUITE FAIL (3)`**：三条 `rejects path with ..` | **R3-02 实锤修好**：review4 同一变异当时 `SUITE PASS` 无红 ✅ |
| **M5-I** CLI catch 把 `policy-path-not-relative` 路由到 exit 2 | **`SUITE FAIL (3)`**：三条新增 `… with exit 3` | 新增三条 CLI 红测钉的是 3 不是"非 0" ✅ |
| **M5-J** workspace 谓词 `$parts[5] -eq 'relay'` → `-contains` | **`SUITE FAIL (2)`**：两条不得误杀断言 | R1-02 护栏经本次地基改动后仍有牙 ✅ |

## 新发现

| ID | 级别 | 问题 | 证据（命令 + 输出） | 建议 |
|----|------|------|------|------|
| **R5-01** | **P1** | **NUL 分隔清单被当成一条路径，前缀吞掉后面全部路径 → B9 红线静默 `EXIT=0`。** ⑤ 在 CLI 头部把 `-z` 写成推荐命令，但 `Read-RelayPolicyPathFile`（`Invoke-RelayPolicyCheck.ps1:41-49`）只按 `\r?\n` 拆行、**不认 NUL**：整份 `-z` 输出会变成"一条含 NUL 的超长路径"，而 `Test-RelayPolicyUnderRoot` 是纯前缀匹配——只要这坨东西的**开头**落在 `tools/relay/`（production_root）或 `docs/modules/dh-relay/`（doc_root），dev-isolation 就 `continue` 放行；landing 同理（开头不是 `.dh-runtime/`、段 0 不是 `docs` 就全放行）。**方向是"静默放行"，不是 fail-closed。** | ① 最小复现：文件内容 `tools/relay/a.ps1\0.dh-runtime/relay/new.json\0` → `-Mode dev-isolation` **EXIT=0**、`-Mode landing` **EXIT=0**（同一条 `.dh-runtime/relay/new.json` 单独喂则分别 exit 1 / exit 1）。② **照 CLI 头部推荐命令的真实复现**：`git -c core.quotePath=false diff --name-only -z master...HEAD` 的原始输出直接落盘（不拆 NUL）+ 追加 `docs/modules/dh-crew/x.md\0.dh-runtime/relay/new.json\0` → `-Mode dev-isolation` **EXIT=0**、`-Mode landing` **EXIT=0**。首条是 `docs/modules/dh-relay/workspace/DHR_04/findings.md`（doc_root）→ 整坨被判 inDoc 放行。③ `-Mode all` 这几例恰好 exit 1，但那是 content 白名单顺手拦的**偶然**，不是守卫逮住了——本卡三条机器证里 **E-008 用的正是 `-Mode dev-isolation` 单模式**。 | `Read-RelayPolicyPathFile` 的拆分改成同时认 NUL（`-split "[\0\r\n]+"`），推荐命令即可原样使用；再在 `Get-RelayPolicyPath` 里对控制字符（`\0` 等）`throw`（如 `policy-path-control-char`）做纵深防御 + 三条红测钉 exit 3。**判定权在主控**：也可判"喂入形态由调用方保证"并写 `findings.md` 明确豁免——但按 R4-01 先例（landing 静默放行、且"今天不可达"仍被判 P1），这条**更可达**（推荐命令直接产出该形态）且**波及 dev-isolation 主模式**，不修不算收敛。 |
| **R5-02** | **P1** | **git 引号形态在 landing 是静默放行，不是 review4 说的 fail-closed** ——⑤ 之所以敢"只写文档不加固"，依据是 review4 R4-03 记的「方向 fail-closed（不放行）」。该判断只在 `dev-isolation`/`content` 成立；**landing 一族对带引号的 B9 红线路径一律 `EXIT=0`**。本仓中文文件名大量存在，`git status --porcelain`（不加 `-z`/`quotePath=false`）必然产出该形态——第一次返工的 E-008 用的就是这个不带开关的命令。 | 亲跑 `-Mode landing`：`".dh-runtime/relay/\346\226\260.json"` → **EXIT=0**；`"docs/modules/alpha/relay/\346\226\260.json"` → **EXIT=0**；`"docs/modules/alpha/workspace/A_01/relay/\346\226\260.json"` → **EXIT=0**。对照：不带引号的 `.dh-runtime/relay/new.json` → EXIT=1 `landing-violation:legacy-root-write`。三条正是 B9 的 legacy 根 / 模块 relay 目录 / 卡工作区 relay 目录三条红线。（dev-iso/content 侧确如 review4 所记为 exit 1 fail-closed，问题只在 landing。） | 与 R5-01 同一处收：在 `Get-RelayPolicyPath` 对**前导/尾随双引号**同样 `throw`（如 `policy-path-quoted`，比"剥引号"更简单也更诚实——handoff 说得对，半剥盖不住 `\xxx` 八进制，那就别剥、直接拒），配 landing 一条红测钉 exit 3。这样 ⑤ 的"正确做法在调用方"立得住：调用方喂错了会红，而不是拿到一个绿章。 |
| **R5-03** | P3 | ④ 把三条 `-eq 'policy-path-not-relative'` 放宽成 `.StartsWith('policy-path-not-relative')` 是必要的（消息尾部加了路径），但**没有任何断言钉住 not-relative 消息里的路径原文**——dotdot 半边补了 `Contains` 断言，not-relative 半边漏了。任何把 `throw "policy-path-not-relative: $Path"` 改回不带路径的改动都能悄悄溜过，R3-03 的加固只落实一半。 | M5-F 变异（`throw 'policy-path-not-relative'`）→ `SUITE PASS` **无红**（对照 M5-G 同款变异打 dotdot → 恰红 1 条）。 | 把 `:11` 或 `:15` 任一条补成 `-and $msg.Contains('D:.dh-runtime/n.json')`，或照 `:21` 再加一条。属加固，不影响本卡语义。 |
| **R5-04** | P3 | `~` 判据写成"前导 `~` 一律拒"，比"家目录相对"宽：**任何仓库相对、文件名以 `~` 开头的路径都会 exit 3**，典型是 Office 锁文件 `~$xxx.docx` / `~$xxx.xlsx`。这类文件在 `git status --untracked-files=all` 里会出现，一旦混进后续卡的证据清单，整份清单直接变守卫异常（exit 3），而不是被正常分类。方向 fail-closed（不误放），但会让后续卡的机器证被一个临时文件卡死、且错误消息说的是"非相对路径"。 | 亲跑 `~$tmp.docx` → 纯函数三 verdict 全 `THROW: policy-path-not-relative: ~$tmp.docx`，CLI ×4 模式全 EXIT=3。`~x/.dh-runtime/n.json`、`~` 同。 | 收窄成 `^~($\|[\\/])`（只拦 `~` 与 `~/…`），或在头部注释里点明这一条边界。不阻塞本卡。 |

**扫过但判定没问题、不单列 finding 的**：

- **`IsPathRooted` 兜底是纯冗余，不是缺牙**（M5-C 无红的正解）：Windows 下 `Path.IsPathRooted` 为真只有两种情形——首字符是 `\` 或 `/`，或第 2 字符是 `:` 且第 1 字符是**合法盘符字母**。前者必被 `$normalized.StartsWith('/')` 命中（反斜杠已先归一），后者必被 `^[A-Za-z]:` 命中。我实测 `1:foo` / `中:x` / `ab:foo` 三种"像盘符但不是"的输入 `IsPathRooted` 均为 `False`、也确实放行——**两条判据的边界完全重合，兜底行写不出行为红测属正常**（同 dh-crew 教训 L-DCR58-05 的纵深防御口径），已用推演 + 实测定性留痕，不记 finding。
- **范围零漂移（逐笔核过）**：二次返工 6 笔提交触及文件仅 5 个——`tools/relay/policy/relay-policy.ps1`、`tools/relay/policy/Invoke-RelayPolicyCheck.ps1`、`tools/relay/tests/relay-policy.ps1`、本卡 `progress.md`、本卡 `findings.md`。**未碰** `tools/relay/tests/relay-agent-tool.ps1`（`DHR-BL-4` 明令禁止）、未碰 `contracts`/`runner`/`host`/`adapters` 任何文件、未碰 dh-crew、`D:\relay-stage0\`、DevPlan 状态列、`review.md`、`review-logs/*`。全卡 `git diff --name-only master...HEAD` 共 12 个文件，全部在授权面内。`docs/modules/dh-relay/as-built/` 下仍只有 `relay-contracts.md` / `relay-psmux-host.md` / `relay-runner.md`——**没有偷建 `relay-policy.md`**（正确留给收口棒）。
- **分件与流程**：五件各自一笔 `fix`（①`61662df` ②`5ff75c5` ③`9c7361c` ④`4cf0775` ⑤`33b7c0a`）+ 一笔全量回归账本 `40ba904`，与 handoff 的 ①~⑤ 对得上；`progress.md` 日志区每件一行、每行挂一个新 E-ID（E-019~E-023 + E-024/E-025），账本区逐条在场。②（R4-02）只动 `progress.md` 属正确——它本来就是"①之后自然消解、不改代码"。
- **R3-04 放行已照要求落账**：`findings.md` F-004（`33b7c0a`），状态 open、处理写"观察记录；本卡不改测试"，符合"主控已裁决放行"的记法。本轮**不当未修问题报**。
- **`policy-path-not-relative` 未进覆盖闸不算漏**：闸门（`relay-contract-reason-coverage.ps1:55-76`）只采集 `New-RelayValidationError` 参数、`reason =` 赋值以及含 `verdict|reason` 字样的行上的引号 kebab 码；守卫 `throw` 不在采集面内，`policy-path-dotdot`/`policy-path-empty` 历来同待遇。闸门数 70 未变属正确，不是"新码漏登记"。
- **E-019/E-021 账本记 `ASSERTIONS 62`、E-022 起记 63**：④ 加了 1 条，序号递进自洽，非账本错记。
- R1-07②（`-Mode landing/all` 恒传 `$null` MarkerProbe，`module-relay-folder`/`workspace-relay-folder` 两码在 CLI 生产路径不可达）本轮仍未动，沿用 review1~4 的 P3 判定，留给接真实 marker 探针的卡。**注意它与 R5-02 叠加**：landing 在 CLI 侧本来就只剩 legacy 根这一条真闸，而引号形态恰好把它绕过去了。
- R1-05 / `DHR-BL-4`（`relay-agent-tool.ps1` 夹具在 attempt 进程里假红）本轮再次实证仍在，我的全量回归一律走"清 `RELAY_*` 子进程"配方。本卡未改该文件，符合边界。

## 结论

**changes-requested（P0=0 P1=2 P2=0 P3=2）**

**brief 点名的五项，返工本身做得扎实，我逐条亲手复现过，没有一条采信 handoff 自述**：R4-01 是真修好且**四类判据各自有独立断言钉住**（M5-B/D/E/K 逐类变异各自见红，尤其 brief 担心的"盘符相对被写成只判 `IsPathRooted`"经 M5-E 排除）；33 种非相对形态 × 三 verdict 全 THROW、60 次 CLI 亲跑非相对形态一律 exit 3；review4 记的"同一绝对形态两条规范化口径自相矛盾"已消失（前导斜杠模块与盘符模块现在都 throw）。R4-02 随 ① 自然消解，分支走向与自述一致。R3-02 是本轮最硬的一条——**review4 那条 `SUITE PASS` 无红的 M-H 变异，我原样重做现在是 `SUITE FAIL (3)`**。R3-03 行为侧两种 throw 都带出了路径原文、CLI stderr 能定位到具体哪条路径。R4-03 头部契约写清了，理由也站得住。回归面同样干净：`..` 十四变体、内部 `./`、两条不得误杀（M5-J 复证有牙）、卡授权路径、五处 fail-closed、legacy 根、`multi` 与单码、四态退出码、接线顺序与扫描根全部保持，全量 16 套件 `RELAY ALL PASS (SKIPPED: 1)`，断言 56→63，闸门 70，E-008 自举 EXIT=0，范围零漂移。

**需要主控拍板的是两条 P1，它们同源、同一处可收**：本卡把"路径**内容**不规范"（`..`、非相对）堵死了，但"路径**清单条目**不规范"整条线没设防，而这条线上有两种由 git 命令直接产出的形态会让守卫**静默盖绿章**在 B9 红线上——**R5-01**：`-z` 输出原样落盘（CLI 头部自己推荐的命令）会被当成一条超长路径，前缀落在 doc_root 上就整坨放行，`-Mode dev-isolation` 与 `-Mode landing` 实测 **EXIT=0**，而 E-008 用的正是单模式 dev-isolation；**R5-02**：git 引号形态在 landing 一律 **EXIT=0**，review4 记的「方向 fail-closed」只在 dev-iso/content 成立——**⑤ 决定"只写文档不加固"所依据的那个前提，实测不成立**。两条按 R4-01 的先例都够 P1（R4-01 当时只在 landing 静默放行、且交底"今天不可达"仍被判 P1；这两条更可达、且 R5-01 波及 dev-isolation 主模式）。修法都很小：`Read-RelayPolicyPathFile` 拆分认 NUL + `Get-RelayPolicyPath` 对控制字符和前导/尾随引号 `throw`，配红测钉 exit 3——**拒绝比剥离更简单也更诚实**，handoff 说"正确做法在调用方"是对的，但调用方喂错时应该拿到红，而不是绿章。若主控判"喂入形态由 DHR_12 宿主侧保证"，请照 R4-01 的规矩写进 `findings.md` 明确豁免，别静默留着。

**R5-03/R5-04 两条 P3 不阻塞**：前者是 ④ 放宽断言留下的半边缺牙（not-relative 消息的路径原文没钉住，M5-F 无红），后者是 `~` 判据比语义宽、会被 `~$xxx.docx` 这类锁文件误伤（方向仍 fail-closed）。
