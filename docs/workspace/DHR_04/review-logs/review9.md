# review9 — DHR_04（收口前终轮复核）

- 复核者：Grok（relay review9 worker）｜ 会话：独立会话，未继承施工上下文
- 复核范围：收口前小修 `63131e8` + 回归复验 + 范围裁决独立判断 + 可收口性逐条核
- 纪律：全部亲跑复现，未采信主控账本自述；变异一律在 `%TEMP%\review9-mut\work` 副本上做，每条写入后回读确认才跑套件；复核结束 `git status --porcelain` 为空

## 四条小修

| 条目 | 是否真做对 | 我的复现证据（命令 + 输出） |
|---|---|---|
| **R7-02** `~` 判据改 `^~($\|[^/]*/)`，`~user/` 收回、`~$tmp.docx` 仍放行 | **真做对** | 纯函数亲跑：必须拦的 `~` / `~/x` / `~root/x` / `~Administrator/.dh-runtime/n.json` / `~\x` **全部 THROW `policy-path-not-relative`**；必须放行的 `~$tmp.docx` / `~x` / `~$` **全部 ALLOW**。CLI：`~root/x.ts`、`~Administrator/…`、`~`、`~/x`、`~\x` 双模式 **EXIT=3**；`~x` iso EXIT=1 unclassified / landing EXIT=0（当普通相对路径分类，不是家目录）。`~\x` 亦 THROW → **判据跑在反斜杠归一之后**（源码 L28 先 `-replace '\\','/'`，L39 才 match；不是看注释）。边界：`~$tmp.docx/sub/a.ts` 与 `~$tmp.docx\sub\a.ts` **THROW not-relative**（有斜杠即当家目录）。无此边界断言。Office 锁文件是文件不是目录，子目录里的真锁文件会写成 `docs/foo/~$tmp.docx`（`~` 不在开头，我测 ALLOW）。与「判别子是斜杠」一致，行为可接受。变异 M-tilde-old（判据退回 `^~($\|/)`，回读 `applied=True`）→ **恰红 `posix ~user/ throws not-relative`**；M-tilde-all（退回 `StartsWith('~')`）→ **恰红 `tilde-dollar lock file is a normal relative path`**。两侧各自有牙。 |
| **R7-03** 前导-only / 尾随-only 各补一条 | **真做对** | 纯函数：`".dh-runtime/relay/a.json` 与 `.dh-runtime/relay/a.json"` 均 THROW `policy-path-quoted`。变异 M-QS（只留 `StartsWith`，回读 L22=`if ($trimmed.StartsWith('"'))`）→ **SUITE FAIL (1) 恰红 `trailing-only quote throws quoted`**；M-QE（只留 `EndsWith`，回读确认 `EndsWith` 且无 `StartsWith`）→ **SUITE FAIL (1) 恰红 `leading-only quote throws quoted`**。两侧各自有牙，不再是「两端包裹夹具蒙过去」。 |
| **R7-04 + R8-01** 相邻三层各一条混合夹具 | **主目标做对；中间层夹具没钉住顺序** | 纯函数现役顺序：`".dh-runtime/a.json\0hidden"` → `control-char`；`"D:/repo/.dh-runtime/n.json"` → `quoted`；`D:/repo/../.dh-runtime/n.json` → `not-relative`。变异 M3（行级把控制字符块与引号块整块对调，回读 `qLine=19 < cLine=25`）→ **SUITE FAIL (1) 恰红 `control-char outranks quoted`**。这正是 review8 那条「78 条一条不红」的原样变异，现已有牙。第三层夹具输入与既有 `non-relative wins over dotdot when both present` **相同**，是重复钉，不是新牙。中间层见 R9-01。 |
| **R8-04** E-030 两层口径 | **账本订正与实测对得上** | 纯函数 `Get-RelayPolicyPath '~$tmp.docx'` → `~$tmp.docx`（ALLOW）。CLI 同输入：`-Mode dev-isolation` **EXIT=1** `dev-isolation-violation:unclassified-path`（path=`~$tmp.docx`）；`-Mode content` EXIT=1 `outside-allow-set`；`-Mode landing` EXIT=0（非红线段，与任意非红线相对路径一致）。**不是放行**——iso 仍走默认拒绝兜底。与订正后 E-030 记法一致。 |

## 回归复验（含三条 P1 仍封闭）

| 项 | 结论 | 证据 |
|---|---|---|
| 1. 三条 P1 仍封闭 | **仍封闭** | 自造探针（非账本文件）：NUL `docs/…/findings.md\0.dh-runtime/relay/new.json` → iso **EXIT=1** `forbidden-root` / landing **EXIT=1** `legacy-root-write`，violPath 是拆开后的 `.dh-runtime/relay/new.json`（真拆开，不是前缀匹配）。孤立 CR（字节 `0x0D`、无 LF）同样双模式 EXIT=1。git 引号 `".dh-runtime/relay/\346\226\260.json"` 双模式 **EXIT=3** `policy-path-quoted`。 |
| 2. `..` 十几种变体仍 exit 3；非相对仍 exit 3 | **仍对** | 纯函数 15 种（正斜杠/反斜杠/`a/../b`/`..\..\evil.ps1`/大小写混合/`a/..//b`/尾随空格 `.. `/`./../x`/`foo/bar/../../x`/`a/./../b`/`x/..`/`../`/`..`/`a\..\b`/`.\.\..\..\x`）全 `policy-path-dotdot`。CLI `tools/relay/../protocol/evil.ps1` 三模式 EXIT=3。非相对：盘符绝对/盘符相对/`D:`/`D:/`/`/`/`//`/UNC/verbatim `\\?\`/`~/`/`C:\repo\…` 全 THROW not-relative；CLI 绝对/UNC/前导斜杠 EXIT=3。 |
| 3. 内部 `./` 消解；`.dh-relay/./RUN-x/events.jsonl` 仍放行 | **仍对** | 套件 `collapse internal ./ segments` PASS。CLI content：`src/./alpha/a.ts` EXIT=0；`.dh-relay/./RUN-x/events.jsonl` EXIT=0。 |
| 4. JSON 非字符串仍 exit 3 | **仍对** | `[null,"src/alpha/a.ts"]` / `["src/alpha/a.ts",["nested"]]` / `[123]` 均 EXIT=3 `policy-list-entry-not-string`。 |
| 5. 两条不得误杀 + 卡授权路径 | **仍对** | landing：`docs/modules/relay/design/01.md` EXIT=0；`docs/modules/relay/workspace/X/progress.md` EXIT=0。content：`src/alpha/a.ts` EXIT=0；`src/beta/other.ts` EXIT=1 `outside-allow-set`。套件对应断言全绿。 |
| 6. 五处 fail-closed + legacy + 退出码四态 | **仍对** | 套件 `null snapshot` / `content mode without args exits 2` / `unknown path is unclassified` / `unprobed marker` / `unknown category` 全 PASS。legacy 单独喂 iso EXIT=1 / landing EXIT=1。亲跑四态：干净 iso EXIT=0；forbidden/unclassified EXIT=1；缺 AfterPath EXIT=2；`..`/绝对/引号/控制字符/非字符串 EXIT=3。新 throw 只占 3。 |
| 7. 接线 + 覆盖闸 | **仍对** | `run-relay-tests.ps1:18-19`：`relay-policy.ps1` 在 `relay-contract-reason-coverage.ps1` 之前。全量输出里 `=== relay-policy.ps1 ===` 之后才是 coverage。闸门原文 `PASS  production reason codes covered: 70`。 |
| 8. E-008 自举 | **仍 EXIT=0** | 三条推荐命令（`diff --name-only -z master...HEAD` + `diff --name-only -z HEAD` + `ls-files -z --others --exclude-standard`）原始字节拼接、零预处理直喂 `-Mode dev-isolation` → **16 条裸路径、EXIT=0**。16 条全在 `tools/relay/` 或 `docs/modules/dh-relay/`。 |
| 9. 单套件 / 全量 | **全绿** | `relay-policy.ps1`：`ASSERTIONS 85` / `SUITE PASS`。清 `RELAY_*` **子进程**全量：末行原文 `RELAY ALL PASS (SKIPPED: 1)`。本壳 `RELAY_*` 仍在。 |

## 变异探针（含回读校验）

副本：`%TEMP%\review9-mut\work`（`tools/relay` 整树），基线先验 `ASSERTIONS 85 / SUITE PASS`。每条 Restore → 写变异 → **回读确认**再跑。全部结束后 work==pristine（hashEqual=True）。仓库 `git status --porcelain` 为空。

| 变异 | 变异已生效？ | 套件反应 | 结论 |
|---|---|---|---|
| **M-QS** 引号只留 `StartsWith` | 回读 L22=`if ($trimmed.StartsWith('"'))` | **SUITE FAIL (1)**：恰红 `trailing-only quote throws quoted` | R7-03 尾随侧有牙 ✅ |
| **M-QE** 引号只留 `EndsWith` | 回读 `EndsWith([char]34)` 且无 `StartsWith` | **SUITE FAIL (1)**：恰红 `leading-only quote throws quoted` | R7-03 前导侧有牙 ✅ |
| **M3** 控制字符块与引号块整块对调（review8 原样） | 回读 `qLine=19 < cLine=25`（引号块在前） | **SUITE FAIL (1)**：恰红 `control-char outranks quoted` | R8-01 现已有牙。对照 review8 同变异 78 条零红 ✅ |
| **M-tilde-old** 判据退回 `^~($\|/)` | 回读 L39=`$normalized -match '^~($\|/)' -or` | **SUITE FAIL (1)**：恰红 `posix ~user/ throws not-relative` | R7-02「不要把 `~user/` 当相对」有牙 ✅ |
| **M-tilde-all** 退回 `StartsWith('~')` | 回读 `StartsWith([char]126)` 且无 `[^/]` | **SUITE FAIL (1)**：恰红 `tilde-dollar lock file is a normal relative path` | 「不要一律拦」另一侧有牙 ✅ |
| **M-QR** 引号块整块移到 not-relative 块之后（仍在 `Get-RelayPolicyPath` 内） | 回读 `quoteThrowL=42 > relThrowL=36`，函数头可见 not-relative 在前、引号在后 | **SUITE PASS 无红**（85 全绿） | 中间层夹具钉不住顺序，见 R9-01 |

## 范围裁决是否成立（我的独立判断）

先读 DevPlan `#### DHR_04` 与 design/02 B9 原文，再亲跑三条现象，**不采信 F-007 / E-036 自述**。

DevPlan 本卡目标是「可独立执行的 fail-closed 守卫」；实施提示逐字：「业务仓策略先做成只消费正式设计字段的**纯守卫**，用合成 snapshot 验收」。三条机器证的主语都是**路径集上的判定**（变更前后路径集 / 写入 ⊆ 允许集 / 落点反例），没有一条规定守卫如何从字节流取得路径集。B9 取证方式写的是「受限写环境 + 前后快照 + git diff/status + 独立 oracle 四者交叉」——`git diff/status` 是**取证通道**，不是守卫的输入契约。

亲跑：

| 现象 | 文本清单（推断分隔符） | 结构化 JSON 两字符串 | 一条 JSON 字符串里嵌该码点 |
|---|---|---|---|
| U+2028 / U+2029 / U+0085 粘连（首条 doc_root，藏 legacy） | iso=0 / landing=0 | iso=1 / landing=1（红线被逮） | iso=0 / landing=0 |
| TAB 夹在两条之间 | EXIT=3 `policy-path-control-char` | （无拆分层） | TAB 是 C0，谓词仍 throw |

**R7-01（文本 U+2028 家族）该划给 DHR_22，成立。** 只存在于「读文本 + 按 `[\0\r\n]+` 推断分隔符」。换成 JSON 字符串数组（两条分开）后现象**消失**（我亲跑双 1），不是被藏起来。

**R8-02（JSON 字符串内嵌 U+2028）该划给 DHR_22，成立，但要说清：它不会「消失」，会被重新定性。** 一条 JSON 字符串就是一条路径。`docs/…/x.md<U+2028>.dh-runtime/…` 作为**一个文件名**前缀落在 doc_root 上，纯守卫放行是正确判定。U+2028 是 NTFS 合法文件名字符；本卡谓词从未把 Unicode 行终止符列入非法路径字符（只认 C0/DEL）。把它留在本卡，等于临时把「清单该怎么切」塞进路径谓词，和「纯守卫」实施提示相反。

**R8-03（TAB 认定不对称）该划给 DHR_22，成立。** 不对称的两端是拆分正则 vs 守卫正则。守卫层对 TAB 的答案是 throw（方向 fail-closed，我亲跑 EXIT=3）。删掉分隔符推断后只剩守卫层，不对称消失；TAB-in-path 仍拒，不是漏洞被转走。

**三条机器证会不会因此不再成立？不会。** ① 路径集来自 `git diff/status`/`-z`，推荐命令不产这些码点，我 E-008 16 条裸路径 EXIT=0。②③ 用合成 snapshot + 已知路径做谓词判定，不依赖文本切分是否认 U+2028。没有一条是谓词面的洞被错误划出去。

F-007 把这三条写成「不是遗留缺陷，是待删面上的现象」，技术上站得住。「用户 2026-08-17 拍板拆卡」四字我无法从仓库核验，不影响面归属判断。

## 可收口性

| DHR_04 机器证 | 已覆盖 / 部分 / 未覆盖 | 证据 ID |
|---|---|---|
| ① 变更前后路径集 + 回归命令：生产代码只改 `tools/relay/`，dh-crew 零改动，run-all 不受影响 | **已覆盖** | 我亲跑 `git diff --name-only master...HEAD`：16 文件 = `tools/relay/policy|tests` + 本卡 workspace（含 review-logs）。无 dh-crew、无 `contracts/`/`runner/`/`host/`/`adapters/`、无 `relay-agent-tool.ps1`。E-008 三条 `-z` 拼接 iso **EXIT=0**。`run-all.ps1 -AffectedBy 'relay-policy.ps1,Invoke-RelayPolicyCheck.ps1,run-relay-tests.ps1,relay-contract-reason-coverage.ps1,authority-2cards.json' -ListOnly` → **`SUITE COUNT: 0`**（与 E-016/E-017 同一等价判据，本轮重跑）。全量 `RELAY ALL PASS (SKIPPED: 1)`。对应账本 E-008 / E-016 / E-017 / E-040（账本自述不采信，以上是我的复跑）。 |
| ② 合成 snapshot + 受限写环境 + 前后快照 + git diff/status + 独立检查 → 写入 ⊆ 允许集；卡授权可写、未授权拒 | **已覆盖** | 套件亲跑全绿：`authorized business code is writable` / `sibling of exact file scope is rejected` / `unauthorized business path is rejected` / `icacls deny write applied` / `restricted-write environment actually denies write` / `policy agrees with denied write on unauthorized path` / `git status matches after-before snapshot` / `oracle rejects unauthorized gamma write` / `oracle allows authorized alpha write` / `CLI independent check matches oracle`。CLI 复跑：`src/alpha/a.ts` content EXIT=0，`src/beta/other.ts` EXIT=1。对应 E-004 / E-006 / E-013。 |
| ③ 模块下新建 relay 文件夹即失败、legacy 根新写亦失败；两条不得误杀；副作用分账可观察 | **已覆盖** | 套件亲跑：`new module relay folder with marker is rejected` / `new workspace relay folder with marker is rejected` / `new legacy root write is rejected` / `legal module docs/modules/relay is not killed` / `legal module workspace is not killed by landing` / `pre-existing module relay folder is not a hit` / `five side-effect categories split` / `git observation stays in git bucket` / `git ref is not fed to content policy`。CLI：legacy 双模式 EXIT=1；两条不得误杀 landing EXIT=0。对应 E-005。 |

## 新发现

| ID | 级别 | 问题 | 证据 | 建议 |
|----|------|------|------|------|
| R9-01 | P3 | **「引号 > 非相对」那条混合夹具钉不住顺序。** 主控声称「把任意两层对调都必须见红」。我把引号块整块移到 not-relative 块之后（回读确认 `quoteThrowL=42 > relThrowL=36`，仍在 `Get-RelayPolicyPath` 内）→ **85 条一条不红**。根因：夹具 `'"D:/repo/.dh-runtime/n.json"'` 带前导 `"`，`^[A-Za-z]:` 不命中，`[IO.Path]::IsPathRooted` 对带引号串返回 **False**（亲测 `q=["D:/…"] IsPathRooted=False`）。两个谓词对这一条输入不是「都会命中、只是谁先」——只有引号层会命中，对调后仍报 `quoted`。第三层夹具还与既有 `non-relative wins over dotdot` 同输入。真正新增的顺序牙只有 M3 钉住的「控制字符 > 引号」。 | 变异 M-QR：回读函数头可见 not-relative 在 L32–37、引号在 L38–43 → `ASSERTIONS 85 / SUITE PASS`。对照 M3 同手法恰红 1 条。 | 若要真钉 引号>非相对，夹具改成**两端谓词都会命中**的串，例如尾随-only 引号+盘符 `D:/repo/.dh-runtime/n.json"`（EndsWith `"` 且 `^[A-Za-z]:` 也中）。不阻塞。 |

**扫过但判定没问题、不单列 finding 的**：

- **`~$tmp.docx/sub/a.ts` 边界**：THROW not-relative，无断言。与「判别子是斜杠」一致；真 Office 锁文件不会以目录形态出现在仓库根。可接受。
- **`~root` / `~user` / `~~` / `~.`（无斜杠）**：ALLOW，当文件名。与新口径一致；POSIX 无斜杠的 `~root` 也是家目录引用，但本卡明确用斜杠当判别子，不把「无斜杠的 ~user」收回。
- **CLI 头部仍写 `~ or ~/`**（`Invoke-RelayPolicyCheck.ps1:10`）：与新谓词（含 `~user/`）不完全对齐。本笔未改该文件，不是 `63131e8` 引入，不单列。
- **范围零漂移**：`63131e8` 恰 4 文件（`relay-policy.ps1` / `tests/relay-policy.ps1` / 本卡 `progress.md` / `findings.md`）。未碰 `relay-agent-tool.ps1`、`contracts/`/`runner/`/`host/`/`adapters/`、dh-crew、`D:\relay-stage0\`、DevPlan 状态列、`review.md`、`review-logs/*`。`as-built/` 仍三件，**没有偷建 `relay-policy.md`**。
- **E-036～E-040 复跑对账**（只信我跑出来的）：E-036 是观察项，面归属我独立判成立（见上）。E-037 / E-038 / E-039 的「现役行为 + 对应变异见红」我复现一致；E-039「任意两层对调都见红」不成立，见 R9-01。E-040：`ASSERTIONS 85` / 全量 `RELAY ALL PASS (SKIPPED: 1)` / 闸门 70 / E-008 EXIT=0，对得上。
- **F-007 记法**：P3 / open / 处理=转 `DHR_22`，与 F-004/F-005/F-006 同型。表前空行把 markdown 表切断（F-005 起就有），不影响内容。
- **断言 78→85**：新增 7 条（`~user/`、裸 `~`、前导引号、尾随引号、三层混合），套件亲数 85。

## 结论

**approved（P0=0 P1=0 P2=0 P3=1）**

四条小修我亲跑：R7-02 两侧边界（拦 `~user/`、放 `~$tmp.docx`）行为与变异牙都在；R7-03 前导/尾随各自恰红对应那条；R7-04/R8-01 的 M3（review8 原样对调）现已恰红；R8-04 两层口径与订正后 E-030 一致。三条 P1（NUL / 孤立 CR / git 引号）用自己的探针复跑仍非 0。回归面（`..`、非相对、内部 `./`、不得误杀、卡授权、fail-closed、legacy、四态退出码、接线、闸门 70、E-008、全量 16 套件）没被这一笔改坏。

范围裁决 **成立**：R7-01 / R8-02 / R8-03 属清单解析面，划出后三条机器证不受损；没有谓词面的洞被误划。

**本卡可以收口。** 三条机器证均已覆盖。R9-01 是断言密度 P3，不挡销户。
