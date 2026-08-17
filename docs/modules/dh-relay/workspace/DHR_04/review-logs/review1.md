# review1 — DHR_04（第一轮独立复核）

- 复核者：Claude Opus 5（1M 上下文）｜ 会话：relay build 之后的独立可见终端会话（node=review1 / attempt=1 / launch=L-0002）
- 复核范围：`git diff master` 全量（4 笔提交 · 9 文件 · +528/−28）+ 亲跑单套件与全量回归 + 变异探针 10 条 + CLI 黑盒边界探针 9 条
- 复核基准：DevPlan `#### DHR_04` 三条机器证（唯一权威）· design/02 B9 整行 · brief 完成条件 1/2/3 · task_plan 批 A–D

## 扫了什么（逐条对表）

| 检查项 | 结论 |
|---|---|
| 机器证① 隔离/禁改落到代码 | `Get-RelayDevIsolationVerdict` 默认拒绝（不在 `tools/relay/` / `docs/modules/dh-relay/` 的一律出 violation），forbidden-root 优先级最高；E-008 自举复跑退出码 0 —— **达成，但有 R1-01 绕过口与 R1-03 证据缺口** |
| 机器证② 内容白名单 | 允许集 = 固定两根 + 逐卡 `change_scopes` + 四条 harness 派生；`src/alpha/a.ts` 放行、`src/beta/util.ts` 精确放行、`src/beta/other.ts` / `src/gamma/*` 拒、null snapshot → `missing-authority` —— **核心语义达成（"卡授权业务代码必须可写"有真断言），四者交叉缺"受限写环境"一环（R1-04）** |
| 机器证③ 落点 + 两条不得误杀 + 副作用分账 | 段位判定是**位置式**（`$parts[3]` / `$parts[5]`）不是 `-contains`，合法模块 `docs/modules/relay/` 与预存同名目录都真放行；legacy 根新写无条件拒；marker 探不到 → `marker-unprobed` fail-closed —— **达成，但反例②在 workspace 形态上无红测保护（R1-02）** |
| 假绿/没牙 | 10 条变异探针（在 scratchpad 副本上做，未碰仓库文件）9 条被套件逮红，详见「变异探针」表 —— **断言总体有牙** |
| fail-closed 边界 | 缺 authority → `missing-authority`；缺参数 → exit 2（亲跑证实）；未知路径 → `unclassified-path`；无 MarkerProbe → `marker-unprobed`；未知副作用 category → `side-effect-unclassified` —— **五处都真拒**，唯一放行口是 R1-01 |
| 范围漂移 | `contracts/runner/host/adapters` 既有函数**零改动**；`tests/` 只动两行接线（`$suites` 插一行、`$productionRoots` 加 `'../policy'`）；dh-crew、`D:\relay-stage0\`、DevPlan 状态列、`review.md` 均未触碰 —— **无漂移** |
| 分批与流程 | 四笔提交与 task_plan 批 A–D 一一对应（`296a7e9`/`1498835`/`fedf873`/`30febb3`），每批 `progress.md` 记一行；findings 记了 F-002/F-003 —— **无攒堆、无跳步** |
| 证据账本可复跑 | E-003~E-008 六条命令我逐条亲跑复现，结果与账本一致 —— **可一键复跑** |

## 发现

| ID | 级别 | 问题 | 证据（文件:行 / 命令输出） | 建议 |
|----|------|------|------|------|
| R1-01 | **P1** | `Get-RelayPolicyPath` 只做「`\`→`/` + 去 `./` + 小写」，**不消解 `..` 段**，导致三个 verdict 全部可被一个 `..` 绕过——包括本卡第一红线 forbidden-root。`tools/relay/../protocol/evil.ps1` 被判「在 `tools/relay/` 下」直接放行，`docs/relay/../../src/gamma/x.ts` 被判「在 `docs/relay/` 允许根下」直接放行，`.dh-relay/../.dh-runtime/n.json` 逃过 legacy 根守卫。守卫的立项前提是「默认拒绝」，这是唯一一处静默放行。 | `tools/relay/policy/relay-policy.ps1:3-8`（无 `..` 处理）、`:19`、`:117`、`:182`。黑盒 CLI 实测（不是脑推）：`Invoke-RelayPolicyCheck.ps1 -Mode dev-isolation -AfterPath <含两条路径>` → violations **只列** `docs/relay/../../src/gamma/x.ts`，`tools/relay/../protocol/evil.ps1` 未被列（放行）；`-Mode content` → violations **只列** `tools/relay/../protocol/evil.ps1`，`docs/relay/../../src/gamma/x.ts` 未被列（放行）。纯函数级：`Get-RelayContentPolicyVerdict @('src/alpha/../gamma/x.ts') $snap`.ok = `True`。 | 在 `Get-RelayPolicyPath` 里对含 `..` 段的输入直接 `throw`（与空值同款 fail-closed），或在三个 verdict 入口把含 `..` / 绝对路径 / `~` 的输入判成对应族的 fail-closed 码；配套三条红测（iso/content/landing 各一）。**可达性交底**：`git status/diff` 的输出不含 `..`，所以今天的 E-008 自举路径不受影响；暴露面是 CLI 接受任意路径清单文件、以及后续卡若用字符串拼接构造路径喂本守卫。 |
| R1-02 | P2 | 「不得误杀合法模块 `docs/modules/relay/`」这条反例只在 **module 谓词**上有断言，**workspace 谓词与 landing verdict 层没有**。把 `Test-RelayPolicyWorkspaceRelayFolder` 的第 6 段判定退化成 `-contains 'relay'`（正是 brief 点名要防的「段位写死/写错」退化），合法模块的 `docs/modules/relay/workspace/X/progress.md` 会被误杀成 `landing-violation:workspace-relay-folder`，而**整套 43 条断言全绿**。 | 变异 M12：`relay-policy.ps1:169` `$parts[5] -eq 'relay'` → `$parts -contains 'relay'`，跑副本套件 → `ASSERTIONS 43 / SUITE PASS`（无红）。变异后行为实测：`Test-RelayPolicyWorkspaceRelayFolder 'docs/modules/relay/workspace/X/progress.md'` = `True`，`Get-RelayLandingVerdict` 返回 `ok=False reason=landing-violation:workspace-relay-folder`。现役实现该路径 = `False` / `ok=True`（**实现是对的，缺的是护栏**）。套件 `tests/relay-policy.ps1:58` 只断言了 module 谓词。 | 在套件补 1~2 条：`Get-RelayLandingVerdict @('docs/modules/relay/workspace/X/progress.md') @() $markTrue` → `ok=$true`；以及 `Test-RelayPolicyWorkspaceRelayFolder 'docs/modules/relay/workspace/X/progress.md'` → `$false`。 |
| R1-03 | P2 | 机器证① 逐字含「**dh-crew run-all 行为不受影响**」，证据账本无对应 E-ID：E-007 跑的是 relay 自己的 `tools/relay/tests/run-relay-tests.ps1`，不是 dh-crew 的 run-all；也没写明为何可免。 | `progress.md:19-26` 证据账本 E-001~E-008 全表；E-007 命令原文 = `run-relay-tests.ps1`。DevPlan `P2-完整流水-开发方案.md` DHR_04 机器证第 1 条原文。 | 二选一并留痕：① 跑一次 dh-crew run-all（或其与本卡零交集的快速子集）记 E-009；② 由主控在 `progress.md` 明确写豁免理由（本卡 diff 对 dh-crew 文件零改动 + 该 run-all 已知耗时/环境风险，见历史 OOM 记录）——**不要静默略过**。 |
| R1-04 | P2 | 机器证② 的取证方式是「合成 snapshot + **受限写环境** + 前后快照 + `git diff`/`status` + 独立检查」五者交叉，实际只做到四者：D2 联证用例里**没有任何写限制现场**（临时 Git 仓是可自由写的普通目录）。 | `tests/relay-policy.ps1:106-146` 联证段：`git init` 普通临时目录，无 ACL/只读/沙箱；`task_plan.md` D2 亦未列该项；`progress.md` E-006 描述里同样没有。 | 补一个最小受限写现场并记 E-ID（例如临时目录设只读 ACL 后验证越权写真的失败），或由主控明确判定本卡记 `N/A（纯守卫卡·受限写环境归宿主侧 DHR_09/DHR_12）` 并写进 `findings.md`。判定权在主控，我只登记缺口。 |
| R1-05 | P2 | F-002 属实，且影响面比它记的更大。`relay-agent-tool.ps1` 的 `finally` 把 `RELAY_RUN_ROOT` **恢复成调用方原值**，紧接着的断言假定它为空——意味着**全量回归在任何 relay attempt 进程里跑都会假红**，而 P2 后续每张卡的证据命令恰恰要在 attempt 里跑。这是既有套件的夹具卫生缺陷，非本卡回归（本卡未改该文件）。 | `tools/relay/tests/relay-agent-tool.ps1:72-75`：`$oldRunRoot=$env:RELAY_RUN_ROOT; ... finally{...else{$env:RELAY_RUN_ROOT=$oldRunRoot}}` → 下一行断言 `'propose without receipt and run root fails closed'`。我本轮全量回归是在**清掉 `RELAY_*` 的子进程**里跑的，结果 `RELAY ALL PASS (SKIPPED: 1)`。 | 不在本卡改（越界）。建议主控把它立成 dh-relay backlog 一条：该用例改为显式 `Remove-Item Env:RELAY_RUN_ROOT` 而非恢复调用方值；在 relay 自举流水铺开前修掉。 |
| R1-06 | P3 | reason 覆盖闸对本卡新码只做**族级**覆盖：`Add-NormalizedReason` 把非 `proposal-rejected:` 的冒号子码截断成族名，10 个新码在闸门里只算 4 个（65→**69**，与 handoff 一致）。所以「69」不代表 10 个子码都被断言把住。 | `tests/relay-contract-reason-coverage.ps1:11` `elseif ($code.Contains(':')) { $code = $code.Split(':', 2)[0] }`；全量输出 `PASS  production reason codes covered: 69`。**我逐条核过**：10 个子码在套件里各自都有字面量断言（forbidden-root / production-outside-relay / unclassified-path / outside-allow-set / missing-authority / module-relay-folder / workspace-relay-folder / legacy-root-write / marker-unprobed / side-effect-unclassified），**当前不缺覆盖**。 | 不阻塞本卡。后续若给 `*-violation:` 族新增子码，闸门不会提醒——可在协议卡里评估是否比照 `proposal-rejected:` 保留子码粒度。 |
| R1-07 | P3 | CLI 契约边缘两处：① 畸形 snapshot（`[]` / `{"cards":null}`）走**未捕获异常**退出 1，与「有 violation」同码，调用方无法区分「守卫崩了」和「判违规」；② `-Mode landing`/`all` 的 `MarkerProbe` 恒为 `$null`，生产路径永远只可能产 `marker-unprobed`，`module-relay-folder`/`workspace-relay-folder` 两码在生产不可达（handoff 已自陈）。两者都 fail-closed，不放行。 | 实测：`-SnapshotPath <'[]'>` → EXIT=1；`-SnapshotPath <'{"cards":null}'>` → EXIT=1。`Invoke-RelayPolicyCheck.ps1:70` 传 `$null` 给 MarkerProbe。 | 后续接线卡里给崩溃留独立退出码（如 3），并在接入真实 marker 探针时补两条生产可达性断言。 |
| R1-08 | P3 | 空白 AfterPath 文件 → `Read-RelayPolicyPathFile` 返回 `@()` → 判 ok → **exit 0**。若上游取快照的命令失败产出空文件，守卫会静默盖章放行。 | 实测：`-Mode content -SnapshotPath <fixture> -AfterPath <空文件>` → EXIT=0。`Invoke-RelayPolicyCheck.ps1:22`。 | 后续接线方对「空快照」另判（上游先断言快照非空），或 CLI 对 0 行输入至少打一条可识别的 warning。 |
| R1-09 | P3 | 非缺陷、供主控知悉：分支落后 master 两笔文档提交（`1efd954` controller-notes.md、`c27fe36` backlog.md），所以 `git diff master --stat` 会把 `controller-notes.md` 显示成「删除 27 行」。**不是施工者删的**。 | `git merge-base HEAD master` = `78c18b2`；`git log --oneline HEAD..master` = 两笔；`git log --name-status master..HEAD` 四笔均未触及该文件。 | 收口前 rebase/merge 一次即可，别把这条误读成越界删档。 |
| R1-10 | P3 | `as-built/relay-policy.md` 未新建、`as-built/relay-contracts.md` 的指针行未加（brief §触及子系统 写的是「收口时」）。handoff 已自陈留给收口棒，此处仅登记以免漏。 | `brief.md:34`；工作树 `docs/modules/dh-relay/as-built/` 下无 `relay-policy.md`。 | 收口棒补，别在返工棒顺手做（会污染本卡 diff 边界）。 |

## 变异探针（证明断言有牙 · 全部在 scratchpad 副本上做，仓库文件零改动）

| 变异 | 套件反应 |
|---|---|
| M2 `MarkerProbe` 为 `$null` 时改成放行 | FAIL `unprobed marker is fail-closed` |
| M3 module 谓词 `$parts[3] -eq 'relay'` → `-contains 'relay'` | FAIL ×4（含两条不得误杀反例） |
| M4 null snapshot 改成返回 ok | FAIL `null snapshot is missing-authority` |
| M6 允许集不再吸收 `change_scopes` | FAIL ×6（含 CLI 与联证） |
| M7 `unclassified-path` 改成放行 | FAIL `unknown path is unclassified` |
| M9 forbidden-root 判定短路成 `$false` | FAIL ×2 |
| M10 精确文件 scope 退化成目录前缀 | FAIL `sibling of exact file scope is rejected` |
| M11 legacy 根判定短路成 `$false` | FAIL `new legacy root write is rejected` |
| M13 缺 `module_slug` 不再 throw | FAIL `incomplete snapshot throws` |
| **M12 workspace 谓词 `$parts[5] -eq 'relay'` → `-contains 'relay'`** | **无红（→ R1-02）** |

## 亲跑验证

| 命令 | 结果 |
|---|---|
| `pwsh -NoProfile -File tools/relay/tests/relay-policy.ps1` | `ASSERTIONS 43` / `SUITE PASS`（EXIT=0，43 条逐条 PASS） |
| `pwsh -NoProfile -File tools/relay/tests/run-relay-tests.ps1`（子进程清掉 `RELAY_RECEIPT`/`RELAY_RUN_ROOT`/`RELAY_ATTEMPT_DIR`/`RELAY_TOOL`） | 末行原文：`RELAY ALL PASS (SKIPPED: 1)`（EXIT=0）；16 套件含 `=== relay-policy.ps1 ===` 且排在 `relay-contract-reason-coverage.ps1` 之前；`PASS  production reason codes covered: 69`；`SUITE SKIP relay-psmux-real (set RELAY_REAL_TERMINAL=1)` |
| E-008 复跑：`git diff --name-only master` + `git status --porcelain --untracked-files=all` 未跟踪项 → `Invoke-RelayPolicyCheck.ps1 -Mode dev-isolation` | EXIT=0（10 条输入路径全部落在 `tools/relay/` 或 `docs/modules/dh-relay/`） |
| CLI 边界：`-Mode content`（缺参） | EXIT=2（`Write-Error` + fail-closed） |
| CLI 边界：畸形 snapshot `[]` / `{"cards":null}` | EXIT=1（崩溃与违规同码，见 R1-07） |
| CLI 边界：空 AfterPath 文件 | EXIT=0（见 R1-08） |
| CLI 边界：`..` 穿越两路径 × `-Mode content` / `-Mode dev-isolation` | 各放行一条（见 R1-01） |
| 变异探针 10 条（scratchpad 副本） | 9 红 1 存活（见上表） |

## 结论

changes-requested（P0=0 P1=1 P2=4 P3=5）

主干实现是对的：三条机器证的语义都落到了代码上，段位判定是位置式而非 `-contains`，两条不得误杀反例在实现层真放行，五处 fail-closed 边界都真拒，43 条断言经 10 条变异探针检验有牙，范围零漂移，全量回归零回归。**返工只需两件小事**：R1-01（`..` 穿越绕过守卫，三行修 + 三条红测）与 R1-02（补 workspace 谓词的不得误杀红测）。R1-03/R1-04 是取证口径缺口，需主控拍板「补证」还是「写明豁免」，不是施工者能自判的。R1-05 是既有套件缺陷，建议立 backlog、不在本卡改。
