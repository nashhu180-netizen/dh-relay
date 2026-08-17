# review3 — DHR_04（返工后第一轮复审）

- 复核者：Claude Opus 5（1M 上下文）｜ 会话：返工棒之后的独立会话（node=review3 / attempt=1 / launch=L-0002）
- 复核范围：返工 delta（7 笔提交 · 4 文件）+ **完整代码复核**（`Get-RelayPolicyPath` 是三 verdict 共用地基，按 brief 要求不只看 delta）+ 完整回归复验 + 变异探针 9 条 + 黑盒 CLI 探针 30 余条
- 复核基准：DevPlan `#### DHR_04` 三条机器证 · design/02 第 269 行 B9 整行 · `task_plan.md` 批 A–D · brief 完成条件
- 纪律：**全部亲跑复现，未采信 handoff 自述**；变异探针一律在 scratchpad 副本 `…\scratchpad\mut\relay\` 上做，复核结束逐份比对确认仓库文件与副本一致、工作树 `git status --porcelain` 为空

## 逐条验返工

| 原发现 | 是否真修好 | 我的复现证据（命令 + 输出） |
|---|---|---|
| **R1-01（P1）`..` 绕过** | **真修好** | `Get-RelayPolicyPath` 规范化时遇 `..` 段 `throw 'policy-path-dotdot'`（`relay-policy.ps1:9`），CLI catch → exit 3。黑盒 CLI **13 条**逐条亲跑，**全部 EXIT=3**（无一放行）：brief 点名三条 `tools/relay/../protocol/evil.ps1`(dev-iso) / `docs/relay/../../src/gamma/x.ts`(content) / `.dh-relay/../.dh-runtime/n.json`(landing)；review2 补的 `src/alpha/../gamma/x.ts`(content)；未点名变体 `a/b/../../../c`、`..`、`./..`、`tools/relay/..`、大小写混合 `Tools/Relay/../Protocol/x.ps1`、反斜杠 `tools\relay\..\protocol\evil.ps1`、`-Mode all`、`SRC/Alpha/../Gamma/X.TS`、`docs/modules/alpha/workspace/../relay/x.json`。退出码符合新契约（3=守卫自身异常）。混合清单实测：`Get-RelayDevIsolationVerdict @('tools/relay/a.ps1','docs/modules/dh-crew/x.md','tools/relay/../evil.ps1')` → `THROWS: policy-path-dotdot`，整批无报告 —— fail-closed 方向（另见 R3-03）。 |
| **R2-02（P3）内部 `./`** | **真修好** | `Get-RelayPolicyPath 'src/./alpha/a.ts'` → `'src/alpha/a.ts'`；`'tools/./relay/x.ps1'` → `'tools/relay/x.ps1'`。CLI 亲跑：`-Mode content -AfterPath src/./alpha/a.ts` → **EXIT=0（放行，它确是授权路径）**；`-Mode dev-isolation -AfterPath tools/./relay/x.ps1` → EXIT=0。隐藏目录未受牵连：`Get-RelayPolicyPath '.dh-relay/x'` → `'.dh-relay/x'`。 |
| **R1-02（P2）误杀护栏** | **真修好（护栏真补上）** | 在 scratchpad 副本上做 **M-B**：`relay-policy.ps1:175` `$parts[5] -eq 'relay'` → `$parts -contains 'relay'`，跑副本套件 → **`SUITE FAIL (2)`**，且恰好红在新增的两条：`legal module workspace predicate is not a hit`、`legal module workspace is not killed by landing`。（review1/review2 在同一变异下均为 `43 / SUITE PASS 无红`——护栏确实是这次才补上的。）现役实现两条谓词均 `False`、landing `ok=True`。 |
| **R1-04（P2）受限写环境** | **真有现场，且断言真有牙** | 联证段 `tests/relay-policy.ps1:191-211` 用 `icacls <tmp>/src/gamma/locked /deny "nash:(W)"` 建真限制。亲跑整套件三条相关断言全 PASS：`icacls deny write applied` / `restricted-write environment actually denies write` / `policy agrees with denied write on unauthorized path`。**非恒真**——变异 **M-C**（`/deny`→`/grant`）→ **`SUITE FAIL (2)`**，恰红 `restricted-write environment actually denies write` 与 `policy agrees with denied write on unauthorized path`。**清理复原已核**：`finally` 先 `icacls /remove:d` 再 `Remove-Item`，且 `$gitRoot` 已登记进外层 `$script:roots`（`:151`）由 `:213` 兜底删除；本轮共触发套件 ≥10 次（单跑/全量/9 条变异），跑完 `Get-ChildItem $env:TEMP -Filter 'relay-policy-*' -Force` → **COUNT=0**，无改过 ACL 的残留目录。 |
| **R2-01（P3）`-Mode all` 一致性** | **真修好** | 亲跑多 verdict 失败（`docs/modules/dh-crew/x.md` + `src/gamma/a.ts`）→ EXIT=1，顶层 `"reason": "policy-violation:multi"`，violations 4 条各带自己的族码，**顶层不再冒充某一族**。单 verdict 失败仍用原码：`docs/modules/dh-relay/x.md` → 顶层 `content-policy-violation:outside-allow-set`。**字面量断言存在且是覆盖闸的唯一来源**——变异 **M-I**（把 `tests/relay-policy.ps1:133` 的字面量从断言里抹掉）→ 覆盖闸 **`FAIL uncovered-reason: policy-violation`**；现役闸门 `PASS production reason codes covered: 70`（原 69，+`policy-violation` 族）。 |
| **R1-08 / R1-07①（P3）退出码契约** | **真修好** | 头部注释 `Invoke-RelayPolicyCheck.ps1:2` 写明 `0=通过 / 1=判违规 / 2=输入错误 / 3=守卫自身异常`。**10 态逐条亲跑，10/10 与契约一致**：通过=0；判违规=1；缺 `-AfterPath`=2；缺 `-SnapshotPath`=2；AfterPath 文件不存在=2；空文件=2；纯空白文件=2；after `[]`=2；snapshot `[]`=3；snapshot `{"cards":null}`=3。exit 3 路径输出含 `relay-policy: guard error:`。**有牙**——M-D（guard `exit 3`→`exit 1`）→ `SUITE FAIL (2)`；M-E（去掉空 AfterPath 检查）→ `SUITE FAIL (1)`。注：`..` 三条红测只断言 `-ne 0`，未钉死 3，见 R3-02。 |

## 回归复验（原来对的东西还对吗）

| 项 | 结论 | 证据 |
|---|---|---|
| 1. 两条不得误杀反例 | **仍放行** | `Get-RelayLandingVerdict @('docs/modules/relay/design/01.md') @() $markTrue` → `ok=True`；`@('docs/modules/relay/workspace/X/progress.md')` → `ok=True`；run 前已存在的同名目录 `docs/modules/alpha/relay/x.json`（在 BeforePaths 里）→ `ok=True`。两条谓词对合法模块均 `False`。 |
| 2. 卡授权业务代码可写 | **仍正确** | `src/alpha/a.ts` → `ok=True`；`src/beta/util.ts`（精确文件 scope）→ `ok=True`；`src/beta/other.ts`（同目录兄弟）→ `ok=False` / `content-policy-violation:outside-allow-set`。 |
| 3. 五处 fail-closed | **仍真拒** | 缺 authority（null snapshot）→ `content-policy-violation:missing-authority`；缺参数 → CLI EXIT=2；未知路径 `README-new.md` → `dev-isolation-violation:unclassified-path`；无 MarkerProbe → `landing-violation:marker-unprobed`；未知副作用 category `network` → `ok=False` / `side-effect-unclassified`。另 `docs/modules/dh-crew/x.md` → `forbidden-root`、`tools/dh-console/a.mjs` → `production-outside-relay` 均未退化。 |
| 4. legacy 根新写无条件拒 | **仍拒**（规范相对路径形态） | `Get-RelayLandingVerdict @('.dh-runtime/relay/new.json') @() $markFalse` → `ok=False` / `landing-violation:legacy-root-write`；dev-iso 同路径 → `forbidden-root`。**但绝对路径/前导斜杠形态仍逃逸，见 R3-01。** |
| 5. 接线位置与扫描根 | **仍正确** | 全量输出里 `=== relay-policy.ps1 ===` 排在 `=== relay-contract-reason-coverage.ps1 ===` **之前**；`relay-contract-reason-coverage.ps1:57` `$productionRoots` 含 `'../policy'`（diff 里唯一一行改动）。 |
| 6. 单套件 / 全量回归 | **全绿零回归** | `pwsh -NoProfile -File tools/relay/tests/relay-policy.ps1` → `ASSERTIONS 56` / `SUITE PASS` / EXIT=0（返工前 43）。清 `RELAY_*` 子进程跑全量 → 16 套件、零 FAIL、末行 `RELAY ALL PASS (SKIPPED: 1)`、EXIT=0、`PASS production reason codes covered: 70`。 |
| 7. E-008 自举复跑 | **仍 EXIT=0** | `git diff --name-only master` + `git status --porcelain --untracked-files=all` 合并去重 11 条 → `-Mode dev-isolation` → EXIT=0（`..` 新守卫未把本卡自身证据路径打红）。 |
| 8. E-016 / E-017 复跑 | **与账本逐字一致** | `tools/tests/run-all.ps1 -ListOnly` → `SUITE COUNT: 105`，输出含 `relay` 的行 = **0**；`-AffectedBy 'relay-policy.ps1,Invoke-RelayPolicyCheck.ps1,run-relay-tests.ps1,relay-contract-reason-coverage.ps1,authority-2cards.json' -ListOnly` → `SUITE COUNT: 0`。 |

## 变异探针

全部在 scratchpad 副本上做（副本基线先验：`ASSERTIONS 56 / SUITE PASS`）；每条做完还原并逐字节比对，仓库文件零改动。

| 变异 | 套件反应 |
|---|---|
| **M-A** 去掉 `..` 的 `throw`（`relay-policy.ps1:9` → 空分支） | **`SUITE FAIL (3)`**：`dev-isolation rejects path with ..` / `content rejects path with ..` / `landing rejects path with ..` —— 三条 P1 红测真有牙 |
| **M-B** workspace 谓词 `$parts[5] -eq 'relay'` → `$parts -contains 'relay'` | **`SUITE FAIL (2)`**：两条新增不得误杀断言 —— R1-02 护栏真补上（前两轮同变异无红） |
| **M-G** 取消内部 `.` 段丢弃（`if ($part -eq '.')` → `if ($false)`） | **`SUITE FAIL (1)`**：`collapse internal ./ segments` |
| **M-C** 受限写现场 `icacls /deny` → `/grant` | **`SUITE FAIL (2)`**：`restricted-write environment actually denies write` + `policy agrees with denied write on unauthorized path` —— 受限写断言非恒真 |
| **M-D** 守卫异常分支 `exit 3` → `exit 1` | **`SUITE FAIL (2)`**：`malformed snapshot array exits 3` / `snapshot with null cards exits 3` |
| **M-E** 删掉空 AfterPath 的 exit 2 检查 | **`SUITE FAIL (1)`**：`empty after-path file exits 2` |
| **M-F** 删掉 `if ($failed.Count -gt 1) { $report.reason = 'policy-violation:multi' }` | **`SUITE FAIL (1)`**：`mode all multi-verdict reason is policy-violation:multi` |
| **M-I** 把 `policy-violation:multi` 字面量从断言里抹掉 | 覆盖闸 **`FAIL uncovered-reason: policy-violation`** —— 新码的覆盖闸接线真生效 |
| **M-H** 在 catch 里把 `policy-path-dotdot` 改路由到 exit 2（其它异常仍 3） | **无红，`SUITE PASS`** —— 见 R3-02 |

（M-H 第一次因换行锚点没命中而“假无红”，已重锚复跑确认 `anchor=True / applied=True` 后才记此结论。）

## 新发现

| ID | 级别 | 问题 | 证据 | 建议 |
|----|------|------|------|------|
| **R3-01** | **P2** | 与 R1-01 同类、返工未覆盖的另一种非规范路径形态：**绝对路径 / 盘符路径 / 前导斜杠 / `~` 前缀**在 **landing verdict 上静默放行**，逃过「legacy 根 `.dh-runtime/` 不得新写」这条 B9 明写的红线。review1 在 R1-01 的修复建议里逐字点过「含 `..` / **绝对路径** / `~` 的输入」，返工只做了 `..` 一半。 | 亲跑纯函数（`$markTrue`）：`Get-RelayLandingVerdict @('/.dh-runtime/n.json')` → **ok=True**；`@('D:/repo/.dh-runtime/n.json')` → **ok=True**；`@('C:\repo\.dh-runtime\n.json')` → **ok=True**；`@('~/.dh-runtime/n.json')` → **ok=True**；对照 `@('.dh-runtime//n.json')` → ok=False（正常拒）。模块形态同样逃逸：`@('D:/r/docs/modules/alpha/relay/x.json')` → **ok=True**（而 `/docs/modules/alpha/relay/x.json` 因 `Get-RelayPolicyPathSegments` 用 `RemoveEmptyEntries` 反而被逮到 → `module-relay-folder`，两条路径的规范化口径自相矛盾）。根因：`Test-RelayPolicyUnderRoot` 走纯字符串 `StartsWith`，`Get-RelayPolicyPath`（`relay-policy.ps1:3-14`）对绝对路径不做任何判定。**可达性交底（不夸大）**：dev-isolation 与 content 两族对绝对路径仍 fail-closed（实测 `/docs/modules/dh-crew/x.md`、`D:/repo/docs/modules/dh-crew/x.md`、`~/docs/…` 均出 `unclassified-path` 违规），静默放行只发生在 landing；且现役调用方（套件 `:153-156` 把 `FullName` 显式转相对、E-008 用 `git status/diff`）都喂相对路径，今天不可达。暴露面与 R1-01 同款：后续卡若拿 `Resolve-Path` / `$_.FullName` / `Join-Path` 结果直接喂本守卫即中招。 | 与 `..` 同款处理：`Get-RelayPolicyPath` 对 `[IO.Path]::IsPathRooted`、前导 `/`、前导 `~` 一律 `throw`（如 `policy-path-not-relative`），配 landing/content/dev-iso 三条红测。**判定权在主控**：也可判「本卡只认相对路径、由 DHR_12 宿主侧保证输入形态」并写进 `findings.md` 明确豁免——但别静默留着。 |
| **R3-02** | P3 | `..` 三条红测只断言 `-ne 0`，没钉死新契约的 exit 3。契约在返工⑥里已经定死（头部注释 + 两条 snapshot 断言用 `-eq 3`），唯独 `..` 这三条留了活口：任何把 `..` 改判成 exit 2（输入错误）的改动都能悄悄溜过。 | `tests/relay-policy.ps1:113/118/125` 均为 `Assert-True ($LASTEXITCODE -ne 0)`。变异 **M-H** 实证：在 catch 里给 `policy-path-dotdot` 单独路由到 `Exit-RelayPolicyInputError`（exit 2），套件 **`SUITE PASS` 无红**。 | 三条改成 `-eq 3`（或至少一条钉死）。属加固，不影响本卡语义。 |
| **R3-03** | P3 | 守卫异常（exit 3）只在 stderr 打 `relay-policy: guard error: policy-path-dotdot`，**不带出问题路径**，也不产 JSON 报告；而 `..` 现在是整批 throw——一条坏路径会让整份清单（实测 3 条里 1 条坏）拿不到任何逐条 violation。fail-closed 方向正确，但接线方拿到 exit 3 无法定位是哪条路径坏的。 | 亲跑 `Get-RelayDevIsolationVerdict @('tools/relay/a.ps1','docs/modules/dh-crew/x.md','tools/relay/../evil.ps1')` → `THROWS: policy-path-dotdot`（另两条含真违规的路径完全没进报告）；CLI 侧同输入 → EXIT=3、stdout 空。 | 后续接线卡里把坏路径原文带进错误消息（`throw "policy-path-dotdot: $Path"`），或在 CLI catch 里补一份 `{"ok":false,"reason":"guard-error","detail":…}`。不阻塞本卡。 |
| **R3-04** | P3 | 受限写联证只覆盖「未授权路径 + 环境拒写」一个象限（`src/gamma/locked/`），没有「授权路径在同一受限现场仍可写」的对照腿；「策略与现实一致」的另一半靠的是不受限目录里的 `oracle allows authorized alpha write`（`:183-184`）。另：`icacls` 若在非 NTFS 卷 / 特殊账号下不生效，`$lockedAclApplied` 为假会让套件在别的机器上红——是 fail-closed 的红，但属环境敏感夹具。 | `tests/relay-policy.ps1:191-211` 全段；`:196` `icacls … /deny "${lockedUser}:(W)"`；`$lockedUser=$env:USERNAME`（本机 `nash`）。M-C 已证该象限断言有牙。 | 想补的话加一条：同一 `icacls` 现场下往授权路径写**成功** + 策略 `ok=true`，四象限就闭合。主控可判「一个象限已满足 review1 的原始要求」直接放行。 |

**扫过但判定没问题、不单列 finding 的**：

- **范围零漂移（逐笔核过）**：返工 7 笔提交触及文件**仅 4 个**——`tools/relay/policy/relay-policy.ps1`、`tools/relay/policy/Invoke-RelayPolicyCheck.ps1`、`tools/relay/tests/relay-policy.ps1`、本卡 `progress.md`。**未碰** `relay-agent-tool.ps1`（`DHR-BL-4` 明令禁止）、未碰 `contracts/runner/host/adapters` 任何文件、未碰 dh-crew 模块、`D:\relay-stage0\`、DevPlan、`review.md`、`review-logs/*`。`docs/modules/dh-relay/as-built/` 下仍只有 `relay-contracts.md` / `relay-psmux-host.md` / `relay-runner.md`，**没有偷建 `relay-policy.md`**（正确留给收口棒）。`findings.md` 返工期间零改动（F-001~F-003 仍为建棒原文）。
- **分件与流程**：六件各自一笔 `fix` + 一笔账本 `docs`，与 handoff 的 ①~⑥ 对得上；`progress.md` 日志区每件一行（`:14-20`），证据账本 E-010~E-015 逐件一条 + E-018 全量回归。**主控让抄的两条 dh-crew 证据已照抄进账本**（E-016 `SUITE COUNT: 105`/relay 套件 0、E-017 `-AffectedBy … SUITE COUNT: 0`），且我复跑逐字一致。
- 证据 ID 序列跳过 `E-009`（E-008 直接到 E-010），纯编号空档，不影响可复跑，不记 finding。
- 覆盖闸仍是**族级**粒度（R1-06 原判 P3），`policy-violation:multi` 在闸里只算 `policy-violation` 一族——与 review1/review2 结论一致，本轮未恶化。
- R1-07②（`-Mode landing/all` 恒传 `$null` MarkerProbe，导致 `module-relay-folder`/`workspace-relay-folder` 两码在 CLI 生产路径不可达）返工未动，handoff 已自陈、brief 也未列——沿用 review1 的 P3 判定，留给接真实 marker 探针的卡。
- R1-05（`relay-agent-tool.ps1` 夹具在 attempt 进程里假红 = `DHR-BL-4`）本轮再次实证仍在：我全量回归一律走「清 `RELAY_*` 子进程」。本卡未改该文件，符合边界。
- R1-09（diff 里两个「删除」是分叉伪影）本轮 `git diff --stat master...HEAD` 用三点比较已不再显示，非缺陷。

## 结论

**changes-requested（P0=0 P1=0 P2=1 P3=3）**

**六项返工全部真修好，逐条我都亲手复现过，没有一条是靠 handoff 自述采信的**：R1-01 的 13 条 `..` 变体（含 brief 未点名的 6 种）全部 EXIT=3；R2-02 的内部 `./` 消解后授权路径真放行；R1-02 的护栏经同款变异 M-B 从「前两轮无红」变成「恰红 2 条」；R1-04 有真 `icacls` 受限现场、断言经 M-C 证明非恒真、跑完 ≥10 次后临时目录残留为 0；R2-01 顶层 reason 与 violations 已自洽且新码的覆盖闸接线经 M-I 证明有牙；退出码四态契约 10/10 亲跑一致。回归面同样干净：两条不得误杀、卡授权业务代码、五处 fail-closed、legacy 根、接线顺序与扫描根全部保持，全量 16 套件 `RELAY ALL PASS (SKIPPED: 1)`，policy 套件 43→56 条断言，覆盖闸 69→70，范围零漂移。

**唯一需要主控拍板的是 R3-01（P2）**：返工把 review1 建议里的「`..` / 绝对路径 / `~`」只做了 `..` 一半，绝对路径与前导斜杠形态仍能静默逃过 landing 的 legacy 根红线。它今天不可达（现役调用方全喂相对路径，我已实测确认 dev-iso/content 两族对绝对路径仍 fail-closed），但暴露面与被判 P1 的 R1-01 完全同源——**要么按同款 `throw` 修掉，要么由主控写明「本卡只认相对路径」的豁免**，不建议静默留着。R3-02/03/04 均为加固与取证完整性建议，不阻塞。
