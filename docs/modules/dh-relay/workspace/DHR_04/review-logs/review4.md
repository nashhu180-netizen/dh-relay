# review4 — DHR_04（返工后第二轮换人复审）

- 复核者：deepseek-v4-flash（relay review4 worker）｜会话：与 review3 不同账号、不同会话，未继承其上下文
- 复核范围：核 review3 全部结论 + 独立砸 `Get-RelayPolicyPath` 路径规范化（39 用例穷举）+ 全量回归复验 + 变异探针 5 条（scratchpad 副本）+ icacls 诚实性独立探针 + 范围/流程逐项核
- 复核基准：DevPlan `#### DHR_04` 三条机器证 · design/02 §6.1 B9 整行 · brief 完成条件 · progress 账本 E-001~E-018
- 纪律：全部亲跑复现，未采信 handoff 自述（fix/1/handoff.md 本会话不可达，见「环境备注」）；变异探针一律在 scratchpad 副本上做，仓库文件零改动；探针脚本放系统 TEMP，复核结束已删净

## 环境备注（更正：env 齐全、交棒通道可用）

1. 本会话 `RELAY_*` 四个环境变量**实际齐全**：`RELAY_RECEIPT=D:\relay-run-DHR_04\runs\RELAY-DHR04-REWORK-20260816233839\launches\L-0003.json`、`RELAY_RUN_ROOT=…\runs\RELAY-DHR04-REWORK-20260816233839`、`RELAY_ATTEMPT_DIR=…\attempts\review4\1`、`RELAY_TOOL=D:\relay-stage0\host\relay-agent-tool.ps1`（stage0 冻结副本）。checkpoint/result 交棒工具可用，本棒已走官方工具通道（`result.json.tmp` + `handoff.md` + `session-tail.txt` 写入 `attempts/review4/1/`）。
2. **DHR_04 的 relay run root 在仓库外 `D:\relay-run-DHR_04\`**（不在 `.dh-runtime/relay/` 下——早前只搜了后者，误判为"不存在"，特此更正）。`attempts/fix/1/` 与 `attempts/review3/1/` 的 checkpoint/handoff/handoff-body/result.json/session-tail 均完整在场；fix/1 result.json 声明 changed_paths 4 条（relay-policy.ps1 / Invoke-RelayPolicyCheck.ps1 / tests/relay-policy.ps1 / progress.md），review3/1 result.json summary=`review3 changes-requested P0=0 P1=0 (P2=1 P3=3) 六项返工全通过`、launch L-0002、session S-0002。复核主体全程独立复现，未依赖任何 attempt 内容。
3. 本机语境：账号 `nash`、**非管理员会话**（`net session` 失败）——icacls 拒绝按 DACL 真实生效（下详）。

## 核 review3

| review3 的判断 | 我的复核（成立 / 不成立 / 级别应改） | 我的证据（全部亲跑，非采信） |
|---|---|---|
| R1-01 `..` 拒绝真修好（throw + CLI exit 3，13 条变体） | **成立** | 我穷举 **14 种 `..` 变体**全部三 verdict THROW（纯函数级）：`tools/relay/../protocol/evil.ps1`、`docs/relay/../../src/gamma/x.ts`、`.dh-relay/../.dh-runtime/n.json`、`src/alpha/../gamma/x.ts`、`a/b/../..`、`../..`、`./..`、`tools/relay/..`、反斜杠 `tools\relay\..\protocol\evil.ps1`、`a\..\b`、`a/..//b`、`..\..\evil.ps1`、大小写混合 `SRC/Alpha/../Gamma/X.TS`、`docs/modules/alpha/workspace/../relay/x.json`。CLI 层 `..` → exit 3 + stderr `relay-policy: guard error: policy-path-dotdot`。**顺序验证**：`\`→`/` 替换在 `..` 检查**之前**（relay-policy.ps1:5→7-9），反斜杠形态全部被逮，顺序无洞。变异 M-A（去掉 throw）→ 套件恰 **3 红**，三条 P1 红测有牙。 |
| R2-02 内部 `./` 消解真修好 | **成立** | `src/./alpha/a.ts` → content verdict **ALLOW**（exit 0）；`tools/./relay/x.ps1` → dev-iso **ALLOW**；`.dh-relay/./RUN-x/events.jsonl` → content **ALLOW**；隐藏目录 `.dh-relay/x` 未受牵连（`.dh-relay/./x` 正常 ALLOW）。 |
| R1-02 误杀护栏真补上 | **成立** | 我自己做 M-B 变异（`relay-policy.ps1:175` `$parts[5] -eq 'relay'` → `$parts -contains 'relay'`，scratchpad 副本）→ 套件 **`SUITE FAIL (2)`**，恰红 `legal module workspace predicate is not a hit` 与 `legal module workspace is not killed by landing`。现役实现两条谓词对合法模块均 False、landing ok=True。 |
| R1-04 受限写环境真实、断言有牙 | **成立（且我独立验了"管理员绕过 DACL"疑点）** | ① 独立探针（不在套件里）：`icacls /deny "nash:(W)"` → exit 0，ACL 里确有 `nash:(DENY)(W)`；同目录 `Set-Content` → **真实 `UnauthorizedAccessException`**（非其它原因），文件不存在；`/remove:d` 后写恢复成功、目录删除成功。本机非管理员，且 ACL 里 `BUILTIN\Administrators:(F)` 在场仍被 DENY 拦住——拒绝确实生效，**断言通过不是因为"恰好因为别的原因"**。② 套件断言结构诚实：`Assert-True $writeDenied` 要求写真的失败（写成功 → 文件存在 → `-not (Test-Path)` 为假 → 红）；`icacls` 失败 → `$lockedAclApplied=false` → 第一条就红。③ 变异 M-C（`/deny`→`/grant`）→ 恰 **2 红**，非恒真。④ 清理复原：finally 先 `/remove:d` 再删目录；本轮我累计触发套件 ≥4 次，`$env:TEMP` 下 `relay-policy-*` 残留 **COUNT=0**。 |
| R2-01 `policy-violation:multi` 真修好 | **成立** | 亲跑 `-Mode all`（`docs/modules/dh-crew/x.md` + `src/gamma/a.ts`）→ exit 1，顶层 `"reason":"policy-violation:multi"`，violations 4 条各带自己的族码（forbidden-root / unclassified-path / outside-allow-set ×2），顶层不再冒充某一族。单 verdict 失败仍用原码。 |
| R1-07①/R1-08 退出码契约真修好 | **成立** | 退出码矩阵 11 个场景亲跑：clean→0；违规→1（JSON 报告）；缺参→2；空 AfterPath→2；snapshot `[]`→3（`guard error: policy-snapshot-not-object`）；snapshot `{"cards":null}`→3（套件断言）；`..`→3；混合「违规+`..`」→**3**（见 R3-03）。 |
| **R3-01（P2）绝对路径/`~` 在 landing 静默放行** | **成立，但级别应改 P2→P1**（见 R4-01） | 见「路径变体穷举实测」——我确认并扩展了形态清单（5→8 种），且 CLI 层实测 `-Mode landing` 对 `D:/repo/.dh-runtime/n.json`、`//server/share/.dh-runtime/n.json` 均 **exit 0**（守卫盖章放行）。 |
| R3-02（P3）`..` 三条红测不钉 exit 3 | **成立，级别不变** | 代码读：tests/relay-policy.ps1:113/118/125 均为 `$LASTEXITCODE -ne 0`。我自己做 M-H 变异（catch 里把 `policy-path-dotdot` 路由到 exit 2）→ 套件 **`SUITE PASS` 无红**（exit 0）。 |
| R3-03（P3）守卫异常整批 throw、不产部分报告 | **成立，级别不变** | 亲跑混合清单（`src/gamma/a.ts` 违规 + `tools/relay/../evil.ps1`）→ exit 3，违规条目不出现于任何输出（stdout 空）。fail-closed 方向：exit 3 ≠ 0，调用方不会误读为通过；但定位坏路径只能靠 stderr 的 `policy-path-dotdot`，不带路径原文。 |
| R3-04（P3）受限写只覆盖单象限 | **成立，级别不变** | 代码读：tests/relay-policy.ps1:191-211 只测「未授权路径 + 环境拒写」象限；「授权路径在同一受限现场仍可写」对照腿确实缺失（授权写靠 :183-184 不受限目录）。`$lockedUser=$env:USERNAME` 环境敏感属实。 |
| 「六项返工全部真修好」总判断 | **成立**（六项逐条独立复现，无一条靠 handoff 自述） | 上表 1-6 行。 |
| 「回归面干净、范围零漂移」 | **成立** | 全量回归 `RELAY ALL PASS (SKIPPED: 1)` / EXIT=0 / `ASSERTIONS 56` / `PASS production reason codes covered: 70`（清 `RELAY_*` 子进程跑，E-018 口径）。E-016/E-017 我复跑逐字一致（`SUITE COUNT: 105` 含 relay 0 行 / `-AffectedBy … SUITE COUNT: 0`）。E-008 自举复跑：`git diff --name-only -z master` + `git status --porcelain -z` 原始路径 16 条 → dev-isolation **EXIT=0**。返工区间 `d10ae42^..HEAD` 恰 5 文件（见 R4-03 注）。`D:\relay-stage0\` 无 `policy/` 目录、无晚于冻结时刻（08-16 09:31）的文件。`as-built/` 下无 `relay-policy.md`。`review.md`/`review-logs/review1/2` 未被返工触碰（提交文件清单实证）。 |

## 独立新发现

| ID | 级别 | 问题 | 证据（命令 + 输出） | 建议 |
|----|------|------|------|------|
| R4-01 | **P1** | **review3 的 R3-01 级别应改 P2→P1**：绝对路径/盘符/`~`/UNC/verbatim 形态在 landing verdict 上静默放行（CLI exit 0），与已被判 P1 的 R1-01 完全同类——同一 B9 红线（legacy 根 `.dh-runtime/` 不得新写）、同一静默放行机制、同一"现役调用方喂相对路径所以今天不可达"的可达性交底（R1-01 当年 P1 时同样注明今天不可达，未降级）。且本守卫是 brief 规定的**后续所有 P2 卡任务级证据命令的常设机器闸**——任何一张后卡用 `Resolve-Path`/`$_.FullName`/`Join-Path` 产物喂入即中招。形态清单经我穷举扩展为 **8 种**（review3 记 5）：`/.dh-runtime/n.json`、`D:/repo/.dh-runtime/n.json`、`C:\repo\.dh-runtime\n.json`、盘符相对 `D:.dh-runtime/n.json`、`~/.dh-runtime/n.json`、UNC `//server/share/.dh-runtime/n.json`、`//.dh-runtime/n.json`、verbatim `\\?\C:\repo\.dh-runtime\n.json`——**全部 landing=ALLOW**。另有自相矛盾点：同一绝对形态 `/.dh-runtime/n.json` 在 legacy 根判定放行，而 `/docs/modules/alpha/relay/x.json` 在 module 谓词却被逮（`Get-RelayPolicyPathSegments` 用 RemoveEmptyEntries、`Test-RelayPolicyUnderRoot` 用原始分段，两条规范化口径不一致）。 | 与 R1-01 同款修：`Get-RelayPolicyPath` 对 `[IO.Path]::IsPathRooted` / 前导 `/` / 前导 `~` 一律 `throw`（如 `policy-path-not-relative`），配 landing/content/dev-iso 三条红测（并钉死 exit 3）。**判定权在主控**：也可判「本卡只认相对路径、输入形态由宿主侧保证」并写进 `findings.md` 明确豁免——但按 R1-01 先例与「任一放行=P0/P1」口径，不修不算收敛。 |
| R4-02 | P3 | 绝对路径在 dev-iso / content 族被拒，但 **reason 语义不准**：`D:/repo/.dh-runtime/n.json` 与 `D:/repo/docs/modules/dh-crew/x.md` 都报 `dev-isolation-violation:unclassified-path`（应为 `forbidden-root`）；content 侧报 `outside-allow-set` 尚可（绝对路径确实不在允许集）。fail-closed 方向无洞，但按顶层 reason 分类的消费方会把"命中禁根"误判成"未知路径"。 | 亲跑：`-Mode dev-isolation -AfterPath` 含 `D:/repo/.dh-runtime/n.json` → `"reason": "dev-isolation-violation:unclassified-path"`；含 `D:/repo/docs/modules/dh-crew/x.md` → 同。根因：`Test-RelayPolicyUnderRoot` 纯字符串 StartsWith，`d:/repo/...` 匹配不上任何根。 | 随 R4-01 修复一并处理（根因同一处：非相对形态未归一化）。不单独立项也行，前提是别把 R4-01 豁免成"不修"。 |
| R4-03 | P3 | **git 引号形态误杀陷阱**：`git diff --name-only` / `git status --porcelain` 对含非 ASCII 的文件名按 `core.quotePath` 输出带引号与 `\xxx` 转义的路径（如 `"docs/modules/dh-relay/design/03-\345\256\214..."`），直接喂入守卫 → 因前导引号匹配不上 `docs/modules/dh-relay/` 根 → 误报 `unclassified-path` / exit 1。**方向 fail-closed（不放行）**，但正是 brief 目标里"后续每张卡任务级证据命令"的典型接线——套件自己的联证（tests/relay-policy.ps1:174）已示范须 `.Trim('"')`，未来卡照抄即踩。 | 亲跑：16 条原始路径（含 3 条非 ASCII）→ EXIT=0；同一清单保留 git 引号 → EXIT=1（3 条 violations 均为带引号的非 ASCII 路径）。附注：`git diff master`（两冒号）对分支落后 master 的拓扑敏感——master 已前移 5 笔（aaf81bd 等），diff 会带出 master 侧文件，E-008 复跑前应先 rebase/merge。 | 在 CLI 头部注释或套件注释里写明「喂入前须 `-z`/剥引号」；或在 `Read-RelayPolicyPathFile` 里识别并剥掉 git 引号形态（可选加固）。不阻塞本卡。 |

## 路径变体穷举实测

纯函数三 verdict（iso=dev-isolation / content / landing，`ALLOW`=放行、`reject`=违规拒绝、`THROW`=抛 policy-path-dotdot）；代表行：

| 输入 | 期望 | 实际 | 判定 |
|---|---|---|---|
| `tools/relay/../protocol/evil.ps1`（brief 点名） | 拒 | THROW×3 | ✅ |
| `docs/relay/../../src/gamma/x.ts`（brief 点名） | 拒 | THROW×3 | ✅ |
| `.dh-relay/../.dh-runtime/n.json`（brief 点名） | 拒 | THROW×3 | ✅ |
| `src/alpha/../gamma/x.ts`（review2 补） | 拒 | THROW×3 | ✅ |
| `a/b/../..` / `../..` / `./..` / `tools/relay/..` / `a/..//b` | 拒 | THROW×3 | ✅ |
| `tools\relay\..\protocol\evil.ps1` / `a\..\b` / `..\..\evil.ps1`（反斜杠） | 拒 | THROW×3 | ✅ 规范化先于拒绝 |
| `SRC/Alpha/../Gamma/X.TS`（大小写混合） | 拒 | THROW×3 | ✅ |
| `docs/modules/alpha/workspace/../relay/x.json` | 拒 | THROW×3 | ✅ |
| `.. `（尾随空格，Trim 后成 `..`） | 拒 | THROW×3 | ✅ |
| `/.dh-runtime/n.json`（前导斜杠） | 拒 | **landing=ALLOW**，iso/content reject | ❌ **R4-01** |
| `D:/repo/.dh-runtime/n.json`（绝对盘符） | 拒 | **landing=ALLOW** | ❌ **R4-01** |
| `C:\repo\.dh-runtime\n.json` | 拒 | **landing=ALLOW** | ❌ **R4-01** |
| `D:.dh-runtime/n.json`（盘符相对） | 拒 | **landing=ALLOW** | ❌ **R4-01** |
| `~/.dh-runtime/n.json` | 拒 | **landing=ALLOW** | ❌ **R4-01** |
| `//server/share/.dh-runtime/n.json`（UNC） | 拒 | **landing=ALLOW** | ❌ **R4-01（新形态）** |
| `//.dh-runtime/n.json` | 拒 | **landing=ALLOW** | ❌ **R4-01（新形态）** |
| `\\?\C:\repo\.dh-runtime\n.json`（verbatim 前缀） | 拒 | **landing=ALLOW** | ❌ **R4-01（新形态）** |
| `D:/r/docs/modules/alpha/relay/x.json`（盘符模块形态） | 拒 | **landing=ALLOW** | ❌ **R4-01** |
| `/docs/modules/alpha/relay/x.json`（前导斜杠模块形态） | 拒 | landing=reject（RemoveEmptyEntries 反被逮） | ⚠️ 与上条口径自相矛盾（见 R4-01） |
| `.dh-runtime/.. /n.json`（点点+空格段） | 拒 | reject×3（under-root 前缀命中） | ✅ fail-closed |
| `src/.. /x.ts` | 拒/无关 | iso/content reject、landing ALLOW（非红线段） | ✅ fail-closed |
| `.dh-runtime/n.json.`（尾随点，Windows 会剥） | 拒 | reject×3 | ✅ fail-closed |
| `src/alpha/a.ts `（尾随空格整体） | 放行 | content ALLOW（Trim 归一） | ✅ |
| `src/%2e%2e/evil.ts`（URL 编码） | 拒 | reject×3（字面段，非遍历） | ✅ fail-closed |
| `src/…/evil.ts`（U+2026）`src/．．/evil.ts`（U+FF0E×2） | 拒 | iso/content reject、landing ALLOW（非红线段，码点已核） | ✅ fail-closed |
| `src/./alpha/a.ts` / `tools/./relay/x.ps1` / `.dh-relay/./RUN-x/events.jsonl` | 放行 | content/iso ALLOW | ✅ R2-02 保持 |
| `.dh-runtime//relay/new.json`（双斜杠） | 拒 | reject×3 | ✅ |
| `docs/relay/runs/RUN-x/index.md` / `src/alpha/a.ts`（正例） | 放行 | content ALLOW | ✅ |

CLI 层复核（退出码矩阵 + 混合场景，11 个场景）：clean→0 / 违规→1（JSON 报告）/ 缺参→2 / 空文件→2 / snapshot `[]`→3 / `..`→3 / **混合「违规+`..`」→3（违规不报，R3-03）** / **landing 绝对路径→0（R4-01 实锤）** / all 混合→1（`policy-violation:multi`）/ content 绝对路径→1（fail-closed）/ **landing UNC→0（R4-01 实锤）**。`..` 在 BeforePath / snapshot scope 同样 exit 3（fail-closed 无残余）。

## 变异探针（全部 scratchpad 副本，仓库零改动；探针目录已删净）

| 变异 | 套件反应 | 结论 |
|---|---|---|
| M-A 去掉 `..` 的 throw | `SUITE FAIL (3)`：三条 P1 红测 | `..` 拒绝有牙 ✅ |
| M-B workspace 谓词 → `-contains` | `SUITE FAIL (2)`：两条不得误杀断言 | R1-02 护栏有牙 ✅ |
| M-C icacls `/deny` → `/grant` | `SUITE FAIL (2)`：写拒与策略一致两条 | 受限写断言非恒真 ✅ |
| M-H dotdot 路由到 exit 2 | `SUITE PASS`（exit 0）**无红** | R3-02 实锤：exit 3 未钉死 ❌ |
| M-I 抹掉 `policy-violation:multi` 唯一字面量 → 覆盖闸 | `FAIL uncovered-reason: policy-violation`（同批另 26 条为精简 scratch 缺兄弟套件所致噪声，可忽略） | 覆盖闸接线真生效 ✅ |

## 结论

**changes-requested（P0=0 P1=1 P2=0 P3=5）**

review3 的全部判断经我独立复现**没有一条不成立**：六项返工（R1-01/R2-02/R1-02/R1-04/R2-01/R1-07①+R1-08）逐条亲验为真修好；R3-02/03/04 三条 P3 我各自用变异或代码读复现；回归面（全量绿、E-016/017/008 复跑一致、覆盖闸 70）、范围（返工恰 5 文件、无 relay-agent-tool.ps1、无 contracts/runner/host/adapters、无 dh-crew、stage0 冻结零改动、as-built 无偷建）全部成立。

**唯一需要主控拍板的是 R4-01（= review3 的 R3-01 升级为 P1）**：landing 对 8 种非相对形态（绝对/盘符/盘符相对/`~`/UNC/`//`/verbatim/模块盘符）静默 exit 0——与 R1-01 同类的静默放行，只是窄在 landing 一族；修法同款（`Get-RelayPolicyPath` 对 rooted/`~` 形态 throw + 三条红测钉 exit 3）。按 R1-01 的 P1 先例和 brief「任一放行=P0/P1」口径，不应以"今天不可达"降级。R4-02（拒绝 reason 语义不准）可随 R4-01 一并收；R4-03（git 引号误杀、fail-closed 方向）建议在 CLI 注释或接线说明里交代。其余 P3（R3-02/03/04）维持 review3 判定，不阻塞。

**流程备注（主控知悉）**：`RELAY_*` env 齐全、run root 在仓库外 `D:\relay-run-DHR_04\`，本棒经 `relay-agent-tool.ps1 result` 官方通道交棒（handoff.md / result.json.tmp / session-tail.txt 落 `attempts/review4/1/`），无环境异常。早前草稿中"env 缺失、run root 不可达"一节为误判（只搜了 `.dh-runtime/relay/`），已更正。
