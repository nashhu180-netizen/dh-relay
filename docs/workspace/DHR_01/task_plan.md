<!-- dh:v1 · task_plan.md — 施工图（实施方案的家）。🔵 开工那一刻才写，一次性消耗品：跑偏了去 progress.md 记实际，不回头改这里。 -->
# task_plan — DHR_01 冻结接力权威、双维状态与异常契约

## 要读的上下文 (Context Packet) ★前置

> **执行契约头（zero-context）**：执行者默认"只知道本文件 + `brief.md` + DevPlan 任务卡"，不得靠脑补上下文施工；按步骤照做，偏离路线只记 `progress.md` 不回写本文件；每批结束先跑本批验证、按批提交 commit，再继续下一批。
> **worker 铁律**：你是 worker 不是主控——不拉终端、不派活、不回头问用户；卡住/有疑问按 blocked 写 DONE（见文末交付动作）；范围外新想法只记 `findings.md` 不顺手做。

| ID | 来源 (path / url) | 为什么 |
|----|------------------|--------|
| C-001 | `docs/modules/dh-relay/design/01-产品设计与验收.md` §3.1～§3.4 | 状态枚举、转换规则、身份链、文件所有权、控制事件的**唯一权威语义**；本计划所有字段/边都出自这里，冲突以它为准 |
| C-002 | 同上 §6.1 验收清单 A1/A2/A4/A5/A6/A8 | 测试断言的验收靶子 |
| C-003 | `docs/modules/dh-relay/workspace/DHR_01/brief.md` | 完成条件与边界 |
| C-004 | `tools/protocol/boundary-validator.ps1` + `tools/tests/protocol-boundary.ps1`（**只读样板**） | 本仓校验器/测试套件的代码风格样板：纯函数 + 断言助手 + 失败即非零退出；照它的风格写，不 import 它 |
| C-005 | `tools/relay/`（当前不存在） | 全新命名空间，本卡创建；禁改 `tools/protocol/**`、`tools/tests/**`、`tools/dh-loop.ps1` 等一切 dh-crew 既有文件 |

**通用约定（全批适用）**：

- 所有 `.ps1` 用 UTF-8（无 BOM）编码；PowerShell 7；文件头 `$ErrorActionPreference = 'Stop'` 不需要（校验器是点源库），测试套件需要。
- 校验器全部是**纯函数库**（function 定义，无顶层副作用），测试套件用 `. $PSScriptRoot\...\xxx.ps1` 点源加载。
- 校验函数统一返回 hashtable：`@{ ok = $true }` 或 `@{ ok = $false; reason = '<机器可读原因码>' }`；原因码用 kebab-case 英文（如 `missing-field:plan_version`、`unknown-enum:result_status`、`edge-not-listed`、`identity-mismatch:session_id`）。
- 测试套件断言助手统一写法（每个套件文件顶部自带，不共享）：

```powershell
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$script:failed = 0
function Assert-True([bool]$cond, [string]$name) {
  if ($cond) { Write-Host "PASS  $name" } else { Write-Host "FAIL  $name"; $script:failed++ }
}
# 文件末尾：
if ($script:failed -gt 0) { Write-Host "SUITE FAIL ($script:failed)"; exit 1 } else { Write-Host 'SUITE PASS'; exit 0 }
```

- fixtures 全部是静态 JSON/文本文件进仓库，测试只读它们，不在测试里动态生成后再当"夹具"（半写夹具就是一个内容被截断的 `.json` 文件）。fixture 内**严禁真实凭据值**，密钥形状字段一律用明显假值（如 `sk-FAKE000000000000`、`hunter2-fake`）。
- 时间戳字段一律 ISO-8601 字符串；校验只验格式不验时钟。

## 施工步骤 (Steps)　★详细级

### 批A：契约参数 + 计划/权威/回执 schema（A1 前半 + A2 地基）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---------|--------|--------|
| A1 | Create · `tools/relay/contracts/relay-params.psd1` | 冻结契约参数（psd1 hashtable）：`@{ SchemaVersion = 'relay/v1'; SessionTailMaxBytes = 65536; ProbeMaxConsecutiveFailures = 3; StallThresholdSeconds = 1800 }`。这是 `session_tail_max_bytes` 默认值与 probe/停滞阈值的唯一冻结点；合法覆盖入口=调用方显式传参（见批D `-MaxBytes`），不允许环境变量。 | 批A套件加载断言四键存在且类型正确 |
| A2 | Create · `tools/relay/contracts/relay-schema.ps1` | 纯函数库，本批实现 4 个校验器（后批续加）。字段表见下方【schema 冻结表】。签名：`function Test-RelayPlanProposal([hashtable]$Plan)`、`function Test-RelayActivePlan([hashtable]$Ptr)`、`function Test-RelayAuthority([hashtable]$Auth)`、`function Test-RelayLaunchReceipt([hashtable]$Receipt)`。共同规则：缺必填字段→`missing-field:<名>`；未知枚举→`unknown-enum:<名>`；类型错→`bad-type:<名>`；**多余未知字段→`unknown-field:<名>`（fail-closed，v1 不允许扩展字段）**。另实现 `function Get-RelayPlanHash([hashtable]$Plan)`：对 plan 除 `plan_hash` 外字段做规范化 JSON（键排序、无空白）后 SHA256 十六进制小写；`Test-RelayPlanProposal` 内部重算 hash 与 `plan_hash` 字段比对，不符→`plan-hash-mismatch`。nodes 依赖闭包校验：`depends_on` 引用不存在 node→`unknown-dep:<id>`；成环→`dependency-cycle`（DFS 检测）。 | 批A套件 |
| A3 | Create · `tools/relay/tests/fixtures/plans/plan-v1-good.json`、`plan-v1-cycle.json`、`plan-v1-badhash.json`、`plan-v1-unknown-field.json` | good：3 节点 A/B/C，`B depends_on []`、`A depends_on []`、`C depends_on ["A","B"]`，plan_hash 填正确值（先写 fixture 再用 Get-RelayPlanHash 算出回填，progress 记一笔）；cycle：A↔B 互依赖；badhash：内容同 good 但 plan_hash 改一位；unknown-field：多一个 `"extra": 1`。 | 批A套件 |
| A4 | Create/Test · `tools/relay/tests/relay-contract-schema.ps1`（本批先覆盖 4 校验器） | 断言（≥14 条）：①good plan 通过；②cycle→`dependency-cycle`；③badhash→`plan-hash-mismatch`；④unknown-field→`unknown-field:extra`；⑤proposal 含 `authority_generation` 字段→拒（proposal 不自带 generation，reason=`unknown-field:authority_generation`）；⑥active-plan 好例通过、缺 `plan_hash` 拒；⑦authority 好例通过、`authority_generation=0` 拒（`bad-value:authority_generation`，从 1 起）；⑧receipt 好例通过、缺 `launch_id`/`session 无关字段混入` 各拒；⑨plan_version 非正整数拒。 | `pwsh tools/relay/tests/relay-contract-schema.ps1` → `SUITE PASS`，exit 0 |
| A5 | Record | 按路径 commit：`git add tools/relay docs/modules/dh-relay/workspace/DHR_01 && git commit -m "feat(dh-relay): DHR_01 批A 契约参数+计划/权威/回执 schema"`；progress 记证据行。 | `git log --oneline -1` |

### 批B：result / checkpoint / handoff / 事件 schema + 身份链绑定与迟到拒收（A2 + A4 边界 + A5 不可改写）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---------|--------|--------|
| B1 | Modify · `tools/relay/contracts/relay-schema.ps1`（追加） | 追加：`Test-RelayResult`（final result；`result_status` 只允许 `succeeded/dependency_blocked/interrupted_unknown/quota_exhausted`，**出现 `decision_required`/`working` → `illegal-final-status:<值>`**；`git_snapshot` 只允许 `commit/changed_paths/diff_stat` 三键）、`Test-RelayCheckpoint`（`status` 只允许 `working/decision_required`；`decision_required` 必带 `question` 与非空 `options[]`）、`Test-RelayEvent`（`kind` 枚举：`plan_proposed/plan_activated/launch_receipt/observation/checkpoint_accepted/checkpoint_rejected/result_accepted/result_stale/result_rejected/control/launch_failed/diagnosis`；`kind='control'` 必带 `actor/source/nonce`，非 control 带 nonce → `unknown-field:nonce`）、`Test-RelayHandoffHeader([string]$Text)`（handoff.md 首行起的 `<!-- dh:relay-handoff v1 plan_version=.. plan_hash=.. authority_generation=.. node_id=.. attempt_id=.. launch_id=.. session_id=.. -->` 注释头，解析出 7 个身份字段返回 `@{ ok=$true; identity=<hashtable> }`，缺任一→`missing-identity:<名>`）。身份链公共字段（result/checkpoint 必带全部 7 个）：`plan_version/plan_hash/authority_generation/node_id/attempt_id/launch_id/session_id`。 | 批B套件 |
| B2 | Create · `tools/relay/contracts/relay-identity.ps1` | 纯函数库：①`function Get-RelayResultVerdict([hashtable]$Result,[hashtable]$Authority,[hashtable]$ActivePlan,[hashtable]$Current)`——`$Current` = `@{ node_id; attempt_id; launch_id; session_id; final_committed = $true/$false }`（该节点当前已受理的 attempt 现场）。判定顺序（先到先判）：schema 不过→`@{verdict='rejected'; reason=<schema原因>}`；`plan_version/plan_hash` 与 ActivePlan 不符→`rejected`,`stale-plan`；`authority_generation` 与 Authority 不符→`rejected`,`stale-generation`；`node_id` 不符→`rejected`,`wrong-node`；`attempt_id < Current.attempt_id`→`stale`,`stale-attempt`；`launch_id/session_id` 不符→`rejected`,`identity-mismatch:<字段>`；`Current.final_committed -and 身份链完全相同`→`rejected`,`final-immutable`（**A5：final 不可改写**）；全对→`accept`。返回 `@{ verdict='accept'|'stale'|'rejected'; reason=... }`。②`function Get-RelayCheckpointVerdict(...)` 同参：身份错/旧 attempt 同上拒；身份全对且 status ∈ working/decision_required→accept（**后续 checkpoint 可更新投影**）；`Current.final_committed` 后再来 checkpoint→`rejected`,`attempt-closed`。③`function New-RelayEvent([string]$Kind,[hashtable]$Identity,[string]$Reason)` 产出过 `Test-RelayEvent` 的事件对象（stale/rejected 落账用）。④`function Get-RelayNodeFreezeSet([hashtable]$Plan,[string]$NodeId)`——返回**传递闭包**依赖集合：所有直接/间接 `depends_on` 包含 NodeId 的节点 id 数组（排序）；不含 NodeId 自身；无依赖者不在集合（**A4：只冻结依赖节点、无依赖并行节点继续**）。 | 批B套件 |
| B3 | Create · fixtures `tools/relay/tests/fixtures/results/`：`result-good.json`（succeeded+next_action=review，身份链与 authority-good 匹配）、`result-stale-attempt.json`（attempt_id=1，Current=2）、`result-wrong-generation.json`、`result-wrong-session.json`、`result-duplicate.json`（与 good 完全相同，用于 final_committed 重复提交）、`result-final-decision.json`（result_status=decision_required 非法终态）；`fixtures/checkpoints/`：`ckpt-decision.json`（decision_required+question/options）、`ckpt-working-followup.json`（同身份链 working，覆盖回 working）、`ckpt-wrong-session.json`、`ckpt-stale-attempt.json`；`fixtures/authority/authority-good.json`、`active-plan-good.json`（与 plan-v1-good 对应） | 各 fixture 身份链数值自洽：plan_version=1、generation=1、node_id="A"、attempt_id=2（Current 基准）、launch_id="L-0002"、session_id="S-0002"；stale/wrong 各变异一个字段。 | 批B套件 |
| B4 | Create/Test · `tools/relay/tests/relay-contract-identity.ps1` | 断言（≥16 条）：①good→accept；②stale-attempt→verdict=stale,reason=stale-attempt；③wrong-generation→rejected,stale-generation；④wrong-session→rejected,identity-mismatch:session_id；⑤duplicate 且 final_committed=true→rejected,final-immutable；⑥final=decision_required→rejected（schema 层 illegal-final-status）；⑦ckpt-decision→accept；⑧working followup 同链→accept（投影可更新）；⑨ckpt 错 session→rejected；⑩ckpt 旧 attempt→rejected；⑪final_committed 后 ckpt→attempt-closed；⑫New-RelayEvent('result_stale',…) 过 Test-RelayEvent；⑬FreezeSet(plan-good,'B')=['C']（C 依赖 B）；⑭FreezeSet(plan-good,'A')=['C']；⑮A 阻塞时 B 不在冻结集（无依赖并行继续的契约面）；⑯handoff 头解析：好头通过、缺 session_id 的头→missing-identity:session_id。 | `pwsh tools/relay/tests/relay-contract-identity.ps1` → SUITE PASS |
| B5 | Modify/Test · `tools/relay/tests/relay-contract-schema.ps1`（追加 result/checkpoint/event/handoff 的 schema 正反例 ≥8 条） | 含：result 好例过、git_snapshot 带 `patch` 键拒（`unknown-field:patch`）、event 非 control 带 nonce 拒、control 缺 nonce 拒。 | 同套件重跑 PASS |
| B6 | Record | commit：`feat(dh-relay): DHR_01 批B result/checkpoint/事件/handoff schema + 身份链判定`；progress 记证据。 | `git log --oneline -1` |

### 批C：机器可读穷举转换矩阵（A1 核心）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---------|--------|--------|
| C1 | Create · `tools/relay/contracts/transition-matrix.json` | 机器可读矩阵，结构：`{ "schema_version":"relay/v1", "terminal_state": { "states":[6态], "terminal":["exited"], "edges":[{from,to,guard,p1}] }, "result_status": { "states":[6态], "edges":[{from,to,guard,p1}] } }`。**terminal_state 合法边（p1=true，逐条照 design §3.1）**：launching→running/exited/unknown；running→idle/stopped/exited/unknown；idle→running(guard=host-observed-new-turn)/stopped/exited/unknown；stopped→running(guard=trusted-resume)/exited/unknown；unknown→running/idle/stopped/exited(guard=trusted-probe-or-diagnosis)。**result_status 合法边**：working→decision_required(guard=checkpoint)；working→succeeded/dependency_blocked/interrupted_unknown(guard=final-result)；decision_required→working(guard=same-chain-working-checkpoint)；decision_required→succeeded/dependency_blocked(guard=same-chain-final-result)；decision_required→interrupted_unknown(guard=probe-lost)；**quota 预留边（p1=false）**：working→quota_exhausted、quota_exhausted→working(guard=trusted-recovery)。无任何自环；未列边一律非法。 | 批C套件 |
| C2 | Create · `tools/relay/contracts/relay-transitions.ps1` | 纯函数库：`function Get-RelayTransitionMatrix()`（读同目录 json，缓存到 script 变量）；`function Test-RelayTerminalTransition([string]$From,[string]$To)`、`function Test-RelayResultTransition([string]$From,[string]$To)`——未知状态名→`unknown-state:<名>`；边不在矩阵→`edge-not-listed`；**边存在但 `p1=false`→`reserved-target-form`（P1 降级：quota 通道不实现，fail-closed）**；合法→ok。`function Test-RelayTransitionPair([hashtable]$TerminalMove,[hashtable]$ResultMove)`——两维各自校验，**任一维不 ok 则整体 `@{ok=$false; reason='dual-dimension-fail-closed:'+<维>}`，另一维不得单独推进**；$null 表示该维本步不动（跳过该维校验）。 | 批C套件 |
| C3 | Create/Test · `tools/relay/tests/relay-contract-transitions.ps1` | **穷举断言（程序生成，不手写逐条）**：读矩阵→对 terminal 6×6=36 与 result 6×6=36 全组合逐一调用 Test-*：组合在矩阵且 p1=true→断言 ok；在矩阵且 p1=false→断言 reason=reserved-target-form；不在矩阵→断言 reason=edge-not-listed。再加定向断言：①exited 出边数=0（终态）；②自环全部非法（6+6 条已含在穷举中，但单独再断言 matrix.edges 里不存在 from==to，防矩阵文件被改坏）；③unknown 的 4 条出边 guard 全为 trusted-probe-or-diagnosis；④TransitionPair：terminal 合法+result 非法→dual-dimension-fail-closed:result；terminal 非法+result 合法→dual-dimension-fail-closed:terminal；双合法→ok；⑤working→quota_exhausted→reserved-target-form（A4/A6 的 P1 降级证据）；⑥矩阵 json 与 relay-params.psd1 的 SchemaVersion 一致。 | `pwsh tools/relay/tests/relay-contract-transitions.ps1` → SUITE PASS（穷举 72 组合 + 定向 ≥10 条全绿） |
| C4 | Record | commit：`feat(dh-relay): DHR_01 批C 穷举转换矩阵+双维 fail-closed`。 | `git log --oneline -1` |

### 批D：脱敏规则 + 失败路径夹具 + 独立 runner（A8 + A5/A6 收尾）

| # | 改动文件 | 怎么改 | 怎么验 |
|---|---------|--------|--------|
| D1 | Create · `tools/relay/contracts/relay-redaction.ps1` | 纯函数库：`function Invoke-RelayTailSanitize([string]$Text,[int]$MaxBytes = 0)`——MaxBytes≤0 时取 relay-params.psd1 的 SessionTailMaxBytes（唯一合法覆盖入口=显式传参）。**顺序固定：先脱敏、再限长**（限长=UTF-8 字节数截尾保尾部——session tail 语义是"输出尾部"，超限时保留末尾 MaxBytes 字节，从字符边界截）。三类 detector（regex，命中**值整体替换**为 `<REDACTED:api_key>`/`<REDACTED:private_key>`/`<REDACTED:password>`，不保留任何前缀/后缀字符）：api_key=`(?i)\b(?:api[_-]?key|apikey|x-api-key)\b\s*[:=]\s*["']?([A-Za-z0-9_\-]{8,})["']?` 捕获组替换 + 独立模式 `\bsk-[A-Za-z0-9_\-]{10,}\b` 整串替换；private_key=`(?s)-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----` 整块替换；password=`(?i)\b(?:password|passwd|pwd)\b\s*[:=]\s*["']?([^\s"']{4,})["']?` 捕获组替换。返回 `@{ text=<结果>; hits=@(@{kind;count}...) }`。另 `function Test-RelayArtifactClean([string]$Text,[string[]]$SecretValues)`——任一原值子串残留→`@{ok=$false; reason='secret-residue:<kind>'}`（供"final 工件残留即失败"断言复用）。 | 批D套件 |
| D2 | Create · fixtures `tools/relay/tests/fixtures/tails/`：`tail-api-key.txt`（含 `api_key = "sk-FAKE0000000000000000"` 与 `X-Api-Key: FAKEKEY12345678`）、`tail-private-key.txt`（假 PEM 块，BEGIN/END 中间填 `FAKEFAKE` base64 样行）、`tail-password.txt`（`password=hunter2-fake`）、`tail-oversize-boundary.txt`（构造 >70KB 文本：一个假 api_key 值恰好横跨"末尾 65536 字节"的截断边界——若先截断后脱敏，边界处残留半截密钥值可被检出；文件内注释行说明构造方式与偏移） | 假值唯一且可 grep（全带 FAKE/fake 字样）；oversize 夹具生成脚本一次性用完即弃，最终只进静态 txt。 | 批D套件 |
| D3 | Create · fixtures `tools/relay/tests/fixtures/failures/`：`result-halfwritten.json`（合法 result 内容在中途截断，非法 JSON）、`result-badjson.json`（可解析但 result_status 为未知值 `finished`）、`event-probe-error.json`（observation 事件带 probe_error=true 与连续失败计数）、`state-no-progress.json`（快照：terminal=running、result=working、last_event_at 距 now 超 StallThresholdSeconds）、`exit-no-result.json`（快照：terminal=exited、无 final result） | 半写夹具：取 result-good.json 前 60% 字节存盘。 | 批D套件 |
| D4 | Create/Test · `tools/relay/tests/relay-contract-redaction.ps1` | 断言（≥10 条）：①三类 tail 各：脱敏后原值零残留（用 Test-RelayArtifactClean 反查）、含对应 `<REDACTED:kind>` 标记、hits.kind 正确；②`sk-` 整串替换后不残留 `sk-FAKE` 前缀片段；③PEM 块整块消失；④**顺序证明**：oversize 夹具经 Invoke-RelayTailSanitize 后（a）输出 ≤65536 字节（b）全文无任何原密钥值子串——若实现为先截断后脱敏，边界半截值会残留，此断言必红；⑤MaxBytes 显式传参 1024 时输出 ≤1024 字节（合法覆盖入口）；⑥无密钥文本原样通过、hits 为空。 | `pwsh tools/relay/tests/relay-contract-redaction.ps1` → SUITE PASS |
| D5 | Create/Test · `tools/relay/tests/relay-contract-failures.ps1` | 断言（≥8 条）：①halfwritten：`ConvertFrom-Json` 抛错被 catch→按契约判 `@{verdict='rejected'; reason='unparseable-result'}`（在 relay-identity.ps1 补 `function Get-RelayResultFileVerdict([string]$Path,...)`：先读文件+try parse，失败即 rejected/unparseable-result，成功则转 Get-RelayResultVerdict）；②badjson→rejected,unknown-enum:result_status；③probe-error 事件过 Test-RelayEvent（observation 带 probe_error 合法字段）且连续失败数≥ProbeMaxConsecutiveFailures 时契约函数 `Get-RelayProbeVerdict` 判 `terminal→unknown, result→interrupted_unknown`（新增于 relay-transitions.ps1，输入=连续失败计数+params）；④no-progress 快照：`Get-RelayStallVerdict`（同文件新增：输入快照+now+params）判 stalled=true→按 A6 fail-closed 走 interrupted_unknown 路径（返回建议转换，且该转换过 Test-RelayTransitionPair）；⑤exit-no-result 快照→interrupted_unknown（无可信原因不得猜测）；⑥succeeded result 的 next_action=review 时——契约断言其 verdict=accept 但**不产生任何"任务完成"字段**（result schema 无 task_state 字段即为证：断言 Test-RelayResult 对带 `task_state` 键的变体拒收 `unknown-field:task_state`，A5 契约面）。 | `pwsh tools/relay/tests/relay-contract-failures.ps1` → SUITE PASS |
| D6 | Create · `tools/relay/tests/run-relay-tests.ps1` | 独立 runner（不动 dh-crew run-all）：内置套件清单 `@('relay-contract-schema.ps1','relay-contract-identity.ps1','relay-contract-transitions.ps1','relay-contract-redaction.ps1','relay-contract-failures.ps1')`，逐个 `pwsh -File` 跑，任一非零整体非零，全绿末行打印 `RELAY ALL PASS`。 | `pwsh tools/relay/tests/run-relay-tests.ps1` → `RELAY ALL PASS`，exit 0 |
| D7 | Create · `tools/relay/contracts/README.md` | ≤60 行：v1 契约文件清单、各校验器一句话职责、矩阵文件与 params 是"唯一冻结点"、指回 design/01 §3。 | 人读 |
| D8 | Record | commit：`feat(dh-relay): DHR_01 批D 脱敏规则+失败路径夹具+relay 测试 runner`；progress 汇总四批证据。 | `git log --oneline -1` |

## 关键决策（一句话各一行）

- Worktree：是，分支 = `wt/DHR_01`，目录 = `.dh-worktrees/DHR_01`（主控已建，worker 在树内施工，cwd=树根）
- 派子 agent：是——codex headless 施工（本文件即其施工说明书）；批次小审与两轮复核由主控另派
- Review：第一轮=批次小审（主控派 fresh 小审看各批 diff），第二轮=收口换人 headless 复核（codex 不复核自己）
- TDD：每批先写套件跑红再实现转绿；fixtures 是静态文件，测试不生成夹具
- quota/nonce 重放/jwt 等检测：P1 明确降级不做（design/01 2026-08-15 修订），矩阵中 quota 边 p1=false 留位

## 交付动作（worker 必做，照 AGENTS.md 编排协议段）

1. 每批完成：跑本批套件 + commit + 在 `docs/modules/dh-relay/workspace/DHR_01/progress.md` 日志表和证据账本各记一行（证据=套件命令+PASS/exit 0）。
2. 全部批次完成：跑 `pwsh tools/relay/tests/run-relay-tests.ps1` 确认 `RELAY ALL PASS`，progress 记 E-0xx 总证据行。
3. 写 `docs/modules/dh-relay/workspace/DHR_01/DONE`（文本即可）：首行 `status: done` 或 `status: blocked`；后跟本次 commit SHA 列表、套件结果一句话、阻塞原因（如有）。**不改 DevPlan 任务表状态列**，不动本工作区以外的 docs。
4. 卡住/缺信息：不要空等——把 `status: blocked` + 具体问题写进 DONE，停止施工。
