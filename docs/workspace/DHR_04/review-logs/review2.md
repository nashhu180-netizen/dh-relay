# review2 — DHR_04（第二轮换人复核）

- 复核者：deepseek-v4-flash（relay review2 worker）｜会话：与 review1 不同账号、不同 psmux 会话，未继承其上下文
- 复核范围：git diff master 全量（4 笔提交 · 11 文件 · +595/−77）+ 核 review1 全部 10 条 + 亲跑两套件 + 变异探针 6 条（scratchpad 副本）+ CLI 边界探针 9 条
- 复核基准：DevPlan `#### DHR_04` 三条机器证 · design/02 B9 整行 · brief 完成条件 1/2/3 · task_plan 批 A–D

## 核第一轮

| review1 的发现 | 我的判断（成立 / 不成立 / 级别应改为 X） | 理由与证据 |
|---|---|---|
| R1-01（P1）`..` 绕过全部三 verdict，唯一静默放行口 | **成立，P1 不变** | 三模式亲测复现：`-Mode dev-isolation` 输入三路径 → violations 只列 `docs/relay/../../src/gamma/x.ts` 与 `.dh-relay/../.dh-runtime/n.json`，`tools/relay/../protocol/evil.ps1` 未被列（放行）；`-Mode content -AfterPath src/alpha/../gamma/x.ts` → **EXIT=0**（解析后是未授权 `src/gamma/x.ts`）；`-Mode landing` 输入 `.dh-relay/../.dh-runtime/n.json` → **EXIT=0**（逃过 legacy 根只读）。根因 `relay-policy.ps1:3-8` 只做 `\`→`/`、去前导 `./`、小写，不消解 `..`。E-008 复跑 EXIT=0（git 输出不含 `..`，当前证据路径不受影响），P1 恰当。 |
| R1-02（P2）workspace 谓词退化无红测 | **成立，P2 不变** | 变异 M12（`$parts[5] -eq 'relay'` → `$parts -contains 'relay'`）在 scratchpad 副本亲测：**ASSERTIONS 43 / SUITE PASS，无红**。`tests/relay-policy.ps1:58` 只断言了 module 谓词；`Test-RelayPolicyWorkspaceRelayFolder` 与 landing 层都没有「合法模块 workspace 形态」断言（`docs/modules/relay/workspace/X/progress.md` 全程零断言）。 |
| R1-03（P2）机器证① 缺 dh-crew run-all 证据 | **成立，P2 不变** | progress.md 证据账本 E-001~E-008 全表无 dh-crew run-all 也无豁免说明；E-007 命令原文是 `run-relay-tests.ps1`。DevPlan 机器证① 逐字含「dh-crew run-all 行为不受影响」。缺口属实，需主控拍板「补证」或「写豁免」。 |
| R1-04（P2）联证缺「受限写环境」一环 | **成立，P2 不变** | B9 取证方式列四项（受限写环境 / 前后快照 / git diff+status / 独立 oracle），D2 联证（`tests/relay-policy.ps1:106-146`）实际只做了三项：临时仓是 `git init` 普通可写目录，无 ACL/只读/沙箱。取证口径缺口，判定权在主控。 |
| R1-05（P2）F-002 全量回归在 attempt 进程假红 | **成立，P2 不变（我亲测复现）** | 本 attempt 进程（`RELAY_RUN_ROOT` 已设）直接跑 `run-relay-tests.ps1` → `FAIL  propose without receipt and run root fails closed` / SUITE FAIL (1) / **EXIT=1**；清掉 `RELAY_*` 的子进程 → `RELAY ALL PASS (SKIPPED: 1)` EXIT=0。代码位置 `tests/relay-agent-tool.ps1:72-75`：`finally` 把 `RELAY_RUN_ROOT` 恢复成调用方原值，下一行断言假定它为空。既有套件夹具卫生缺陷，非本卡回归，P2 + 立 backlog 恰当。 |
| R1-06（P3）reason 覆盖闸只做族级 | **成立，P3 不变** | 亲跑 `PASS  production reason codes covered: 69`（65+4 族）；`relay-contract-reason-coverage.ps1:11` 冒号码截族确认。10 个子码逐条 grep 全部有字面量断言：forbidden-root×2、outside-allow-set×4、production-outside-relay/unclassified-path/missing-authority/legacy-root-write/marker-unprobed/module-relay-folder/workspace-relay-folder/side-effect-unclassified 各×1。当前不缺覆盖。 |
| R1-07（P3）CLI 崩溃与违规同退出码 | **成立，P3 不变** | 亲测 `-SnapshotPath '[]'`（空数组无 ContainsKey 崩溃）→ EXIT=1；`{"cards":null}`（throw policy-snapshot-missing-cards）→ EXIT=1。`Invoke-RelayPolicyCheck.ps1:70` 恒传 `$null` MarkerProbe 确认。fail-closed 方向，P3 恰当。 |
| R1-08（P3）空 AfterPath 文件静默 exit 0 | **成立，P3 不变（注明口径张力）** | 亲测空文件 → EXIT=0。按 brief「输入畸形→放行=P0/P1」字面规则有张力，但空清单本身是合法输入（无路径可查 = 无违规），守卫无法区分「真无改动」与「上游快照命令失败产出空文件」；修复点在调用方先断言快照非空。维持 P3。 |
| R1-09（P3）diff 里两个「删除」是分叉伪影 | **成立，P3 不变** | 亲测：merge-base=78c18b2；`HEAD..master` 恰两笔（c27fe36 backlog.md、1efd954 controller-notes.md）；`master..HEAD` 四笔提交的 --name-status 清单不含这两个文件。施工者未删档。 |
| R1-10（P3）as-built 留收口棒 | **成立，P3 不变** | `as-built/` 下现有 relay-contracts/relay-psmux-host/relay-runner 三份，无 relay-policy.md；brief:34 写明「收口时更新」。 |

## 新发现（第一轮漏掉的）

| ID | 级别 | 问题 | 证据（文件:行 / 命令输出） | 建议 |
|----|------|------|------|------|
| R2-01 | P3 | `-Mode all` 合并报告伪影：顶层 `reason` 只取 `$failed[0]`（恒为 dev-isolation，因其先入列），`violations` 却是三个 verdict 合并——顶层 reason 与逐条 violation 的 reason 族可能不一致，按顶层 reason 分类的消费方会错分。 | 亲测：AfterPath 含 `docs/modules/dh-crew/x.md` + `src/gamma/a.ts`、`-Mode all` → EXIT=1，顶层 `"reason":"dev-isolation-violation:forbidden-root"`，violations 却含 `src/gamma/a.ts`（dev-iso 判 unclassified-path）与 `src/gamma/a.ts`（content 判 outside-allow-set）共 3 条。`Invoke-RelayPolicyCheck.ps1:73-81`（`$report=$failed[0]` + `$merged`）。 | 多 verdict 失败时顶层 reason 改 `multiple`，或逐 verdict 独立输出报告；后续接线卡消费本 CLI 输出前先定契约。 |
| R2-02 | P3 | 内部 `./` 段不消解导致误拒（与 R1-01 同根因、方向相反）：`src/./alpha/a.ts` 解析后是**已授权**的 `src/alpha/a.ts`，却被判 outside-allow-set；`tools/./relay/x.ps1` 同理误判 production-outside-relay。 | 亲测：`-Mode content -AfterPath src/./alpha/a.ts` → **EXIT=1**。`Get-RelayPolicyPath`（`relay-policy.ps1:5`）只 `while StartsWith('./')` 去前导段，不消解内部 `.` 段。 | R1-01 修复时一并消解内部 `.` 段（或明确只收规范路径）。fail-closed 方向，仅误拒不误放，P3。 |

## 亲跑验证

| 命令 | 结果 |
|---|---|
| `pwsh -NoProfile -File tools/relay/tests/relay-policy.ps1` | `ASSERTIONS 43` / `SUITE PASS`（EXIT=0，与 E-006、review1 一致） |
| `pwsh -NoProfile -File tools/relay/tests/run-relay-tests.ps1`（清 `RELAY_*` 子进程） | 末行 `RELAY ALL PASS (SKIPPED: 1)`（EXIT=0）；`=== relay-policy.ps1 ===`（第 568 行）在 `=== relay-contract-reason-coverage.ps1 ===`（第 619 行）**之前**；`PASS  production reason codes covered: 69` |
| `pwsh -NoProfile -File tools/relay/tests/run-relay-tests.ps1`（本 attempt 进程直跑） | `FAIL  propose without receipt and run root fails closed` / `SUITE FAIL (1)` / **EXIT=1** —— F-002 假红亲测复现 |
| E-008 复跑：`git diff --name-only master` + 未跟踪项 → `-Mode dev-isolation` | EXIT=0（本卡 diff 全部落在 `tools/relay/` 与 `docs/modules/dh-relay/`） |
| 变异探针（scratchpad 副本，仓库零改动）：M3 module 谓词→`-contains` | FAIL ×4（含两条不得误杀反例与 newWs）—— 有牙 |
| 变异探针：M9 forbidden-root 短路 `$false` | FAIL ×2（dh-crew / active state）—— 有牙 |
| 变异探针：M10b 文件 scope 扩成父目录前缀 | FAIL ×1 `sibling of exact file scope is rejected` —— 有牙（review1 的 M10 以父目录扩宽编码可复现；EndsWith→`$true` 编码则无红，但该方向唯一过放是「文件当目录」在 git 树语义下不可能存在，无洞） |
| 变异探针：M12 workspace 谓词→`-contains` | **ASSERTIONS 43 / SUITE PASS 无红** —— R1-02 复现 |
| 覆盖闸探针：注释掉 `side-effect-unclassified` 唯一断言后跑 reason-coverage | `FAIL  uncovered-reason: side-effect-unclassified` —— 接线真生效（族级粒度，与 R1-06 一致） |
| CLI `..` 三模式（亲测） | dev-iso：`tools/relay/../protocol/evil.ps1` 放行；content：`src/alpha/../gamma/x.ts` EXIT=0；landing：`.dh-relay/../.dh-runtime/n.json` EXIT=0 —— R1-01 全复现 |
| CLI 边界：畸形 snapshot `[]` / `{"cards":null}` | 均 EXIT=1（崩溃与违规同码，R1-07 复现） |
| CLI 边界：空 AfterPath 文件 | EXIT=0（R1-08 复现） |
| CLI 边界：`-Mode all` 混合违规 | EXIT=1，顶层 reason 与 violations 族不一致（R2-01 新发现） |
| CLI 边界：`src/./alpha/a.ts` | EXIT=1 误拒（R2-02 新发现） |
| git 拓扑：`git merge-base HEAD master` / `git log HEAD..master` | 78c18b2；两笔（c27fe36、1efd954）—— R1-09 复现 |

## 结论

changes-requested（P0=0 P1=1 P2=4 P3=7）

第一轮 10 条全部成立、级别无需调整；R1-01（三模式）与 R1-05（假红）我亲测复现，其余经代码细读 + 亲跑佐证。未发现 review1 被施工者说法带偏之处——E-007/E-008 的账本与我的复跑一致。

独立复核确认：段位判定是位置式而非 `-contains`（M3 有牙）；两条不得误杀反例走**不同**实现分支（beforeSet 跳过 vs 位置谓词）且都在 landing 层有真断言；五处 fail-closed 边界（missing-authority / marker-unprobed / 空值 / 未知路径 / 未知副作用类）真拒；套件接线位置与 reason 扫描根正确、覆盖闸经移除探针验证真生效；范围零漂移（contracts/runner/host/adapters 零改动，dh-crew、stage0、DevPlan、review.md 未触碰，两个「删除」是分叉伪影）。

返工范围与 review1 一致，仍只需两件：R1-01（`..` 消解/拒收 + 三模式红测，建议顺带消解内部 `.` 段收掉 R2-02）与 R1-02（补 workspace 谓词 + landing 层两条红测）。R2-01 留给后续接线卡定消费契约即可。R1-03/R1-04 需主控拍板补证或豁免。另提醒：F-002 假红亲测复现，**后续每张卡在 attempt 进程里跑全量回归必须清 `RELAY_*` env**（findings.md F-002 已记，E-007 亦按此口径执行）。
