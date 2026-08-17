# review-round2b · fresh（返工轮2 复核 · 只读 · 对抗证伪）

VERDICT: approved

> 依据：F-014~F-018 七项全部「真修+锁住」（变异探针 P2B-01~04 删除修复必红，复原后全绿）；F-014/F-015/F-003 要求的探针全部执行且红。亲跑 6 次全量套件：第 1 次 ingest 套件在 F-014 空文件断言处崩溃（与 P1 同签名，见新发现 N-01），第 2~6 次全部 `RELAY ALL PASS`（断言数恒定：59/45/65/18/23 + 守卫 55），另加 15 连跑 ingest 压力全绿。N-01 为唯一未决事实（偶发 1/40+、机制未定位、未复现），已按 P2 报告并注明复现则回升 P1 的判据。只写事实与级别，不做验收裁决。
> 另注：DONE 自报 SHA `5b6ceb9` 与 git log 不符，为笔误（F-019 已记录）；本复核以 git log `ffbaf92` 为准。

---

## 逐条判定：F-014～F-018（返工轮2）

| ID | 级别 | 判定 | 证据 |
|----|------|------|------|
| F-014 | P1 | **真修+锁住** | 修复：`Read-RelayJson`（runner/relay-store.ps1 L53-57）对 `ConvertFrom-Json` 结果加 `if ($value -isnot [hashtable]) { throw 'json-not-object' }`；`Submit-RelayResultFile` L221 与 `Submit-RelayCheckpointFile` L257 的 `try{...}catch{...}` 捕获后分别记 `result_rejected`/`checkpoint_rejected` 事件（reason `unparseable-result`/`unparseable-checkpoint`）并返回 not-ok，不抛出。锁定：ingest 套件 L55-60 三条断言——空 result（0 字节夹具 `fixtures/runner/results/result-empty.json`）、数组 result（`[]` 夹具）、空 checkpoint（`fixtures/runner/checkpoints/ckpt-empty.json`），逐条断言 not-ok + reason + 事件 kind/reason + `[Linq.Enumerable]::SequenceEqual` state 字节前后相等。探针 **P2B-01**（删守卫）→ ingest 崩溃退出 1，崩溃栈 `relay-schema.ps1:18`（`$Value.ContainsKey($key)` 对 $null）与轮2 原 P1 逐字节同号，且与亲跑第 1 次偶发崩溃同签名（见 N-01）。复原后全绿。 |
| F-015 | P2 | **真修+锁住** | 修复：`Open-RelayRun`（runner/relay-runner.ps1 L23-25）读入 state 后立即 `Test-RelayStateSnapshot`，不 ok 则 `throw "state-invalid:<reason>"`——读入即拒，不留半态；`Submit-RelayProposal` L65 深克隆 state（`ConvertTo-Json -Depth 100 -Compress \| ConvertFrom-Json -AsHashtable -DateKind String`）→ L67-71 应用 plan 变更 → **L72-73 在写任何文件之前** `Test-RelayStateSnapshot $candidateState`，不 ok 则 `Add-RelayProposalRejection ... 'proposal-rejected:state-invalid'` 并 return——authority/active-plan/proposal 文件均不落盘。锁定：authority 套件 L59-70——open 对改坏 state（`extra_key`）抛 `state-invalid:*`；submit 对候选态非法拒 `proposal-rejected:state-invalid` 且 authority/active-plan/proposal 三文件零增量、`plan_proposed` 拒绝事件恰 +1。探针 **P2B-02a**（删 Open 校验）→ `FAIL open run rejects invalid state snapshot`，SUITE FAIL (1)；**P2B-02b**（删候选态检查）→ 崩溃于 `Save-RelayState` `state-invalid:unknown-field:extra_key`——即轮2 原 B-5b 部分写路径原样复现（authority/active-plan 已写盘后才炸）。复原后全绿。 |
| F-003 残余 | P2 | **真修+锁住** | 修复：`Test-RelayReplanCompatible` L43 `foreach ($dep in @($old.depends_on)) { if ($dep -cnotin @($new.depends_on)) { return @{ok=$false;node_id=$old.node_id} } }`。锁定：新夹具 `fixtures/runner/plans/plan-v2-bad-drop-dep.json`（v1 A/B/C 中 C depends_on `["A"]`，v2 改为 `[]`，run_id RUN-FAKE-DHR02-DEC、plan_version 2、proposed_by replanner）+ authority 套件 L57 断言拒绝 reason `proposal-rejected:replan-incompatible:C`。探针 **P2B-03**（删 L43）→ `FAIL dropping old dependency rejected at C`，SUITE FAIL (1)——修复轮1 时 P-A1b 全绿的盲区已闭合。复原后全绿。 |
| F-013 | P3 | **真修+锁住** | 修复：relay-contract-reason-coverage.ps1 L72 触发条件扩围为 `$reasonSites.Count -gt 0 -or $line -match '(?i)verdict\|reason\|Add-RelayProposalRejection'`，`Add-RelayProposalRejection ... 'proposal-rejected:<sub>'` 行内调用的原因码由此进入扫描（含 F-016 两处行内 reason 的 allowlist 更新）。探针 **P2B-04**（把 `proposal-rejected:wrong-run` 改 `wrong-run-zzz`）→ `FAIL uncovered-reason: proposal-rejected:wrong-run-zzz`——轮1 时守卫盲区现必红。复原后全绿。 |
| F-016 | P3 | **真修+锁住** | 修复：`Apply-RelayObservation` probe_error 全路径统一「先 Save state 再 Add event」——L158（final_committed）、L162（pair-not-ok，暂停内联后 Save 再先后追加两条事件）、L165-166（普通 probe_error）；同函数 L171/L175/L177 与 `Submit-RelayResultFile` L244/L250、`Submit-RelayCheckpointFile` L273-274、`Start-RelayNodeAttempt` L127-128、`Invoke-RelayTick` L202/L210 均已为 Save-then-Add；README（runner/README.md）新增「落账顺序统一为 state 先于 event。Runner 自身 IO 故障时并非原子双写；对账归目标形态」。锁定：ingest 套件 L78-79 `stop call observes accepted result event already persisted`（`events_lines >= acceptedAt`，blocked 路径先落账后回收的时序断言）；顺序本身以代码结构 + README 约定承载（无 IO 故障注入夹具，轮2 原 B-6 的「半态双向可达」已通过顺序统一单向化：IO 故障时最多 state 领先、事件缺失，事件永不领先——回放以事件为准的语义保持）。对抗回归检查：`git show` 比对旧版（event-first）逐路径事件序列——事件种类、顺序、计数均不变，仅落盘次序翻转，无行为回归；亲跑 6 轮全绿佐证。 |
| F-017 | P3 | **真修+锁住** | 锁定：runner-failures 套件 L30-32——probe-errors-3 + plan-v1-decision-ABC 场景：A paused 后依赖 A 的 C 保持 `scheduling='waiting'`、`Get-RelayReadyNodes` 不返回 C（`paused 依赖者永久 waiting` 断言 + 重 tick 不变式）。行为即轮1 判定「符合预期」，现已有断言锁定。 |
| F-018 | P3 | **真修+锁住** | 修复：fake-adapter.ps1 L39 `stop` 时 `$session.host.Clear()`（清空磁带，且 host 项在 `emit_observation` L52 有 `after_probe_index` 门槛双保险）。锁定：runner-failures 套件 L18——host-exit 夹具 Tick 1 后调 `$x.adapter.stop 'S-0001'`，随后 `emit_observation` 返回 0 条 host 事件。 |

## 新发现

- **N-01（P2 · 偶发·机制未定位）** - 亲跑第 1 次全量套件（2026-08-15 17:18，pristine 树、tools/ 干净）时，ingest 套件在 F-014 空文件断言处崩溃：24 条 PASS 后、`empty result rejects without throw or state change` 断言执行前，抛 `InvalidOperation: You cannot call a method on a null-valued expression`，栈在 `relay-contract-schema.ps1:18`（`$Value.ContainsKey($key)` 对 $null）——与轮2 原 P1 及探针 P2B-01（守卫删除后）崩溃**逐字节同签名**；套件无 ASSERTIONS 行、run 继续执行后续套件、总结果 `RELAY TESTS FAIL (1)`。
  - 后续执行（同一 pristine 树、同一调用方式）：全量套件第 2~6 次全部 `RELAY ALL PASS`；ingest 单套件隔离执行多次全 PASS；ingest 15 连跑（子进程逐次隔离）全 PASS——合计 40+ 次干净代码执行仅此 1 次失败，未复现。
  - 静态分析：守卫在位时（`relay-store.ps1` L53-57）`$null`/数组/`''`/空串输入在 `Read-RelayJson` 内必抛 `json-not-object` 或被 catch 拒收（`unparseable-result`），无任何路径可让 $null 抵达 `Test-RelayRequiredFields`——崩溃与当前代码矛盾，指向首跑时刻的环境瞬态（如文件系统/进程状态）而非代码缺陷。隔离探针确认守卫对 $null 必抛、完整提交流程必拒收。
  - 处置建议（只写事实）：若复现，即视为 P1 F-014 回归并优先排查；已写 `relay-run1.log` 现场。不影响本轮七项「真修+锁住」判定。
- 其余：无（轮1 B 段 9 项之外无新行为缺口；F-013 原守卫盲区已闭合）。

## 变异探针记录（改 `tools/relay` 后运行套件，红后复原）

| 探针 | 操作 | 结果 | 复原 |
|------|------|------|------|
| P2B-01 | 删 `Read-RelayJson` L55 的 `json-not-object` 守卫（F-014） | 红（崩溃）：ingest 在空文件断言处抛 `relay-schema.ps1:18` null 方法调用，退出 1——与 P1 原签名一致 | `git checkout -- tools/relay`；`git status --short tools/` 空（干净） |
| P2B-02a | 删 `Open-RelayRun` L24-25 的 state 校验（F-015 open 半） | 红 1 条：`FAIL open run rejects invalid state snapshot`，SUITE FAIL (1) | 同上，干净 |
| P2B-02b | 删 `Submit-RelayProposal` L72-73 的候选态校验（F-015 submit 半） | 红（崩溃）：`Save-RelayState` 抛 `state-invalid:unknown-field:extra_key`——authority/active-plan 已写盘后才炸，B-5b 部分写路径原样复现 | 同上，干净 |
| P2B-03 | 删 `Test-RelayReplanCompatible` L43 旧 depends_on 被删分支（F-003 残余） | 红 1 条：`FAIL dropping old dependency rejected at C`，SUITE FAIL (1)——轮1 P-A1b 全绿盲区已闭合 | 同上，干净 |
| P2B-04 | reason 码 `wrong-run` 改 `wrong-run-zzz`（F-013 守卫） | 红 1 条：`FAIL uncovered-reason: proposal-rejected:wrong-run-zzz`——轮1 时守卫对该行内调用盲视 | 同上，干净 |

每次探针后均执行 `git checkout -- tools/relay` 复原，并确认 `git status --short tools/` 无输出。最终状态：tools/ 干净。

## 亲跑结果（本人执行 run-relay-tests.ps1）

- 全套件共 11 套：relay-contract-schema / identity / transitions / redaction / failures（无计数）、relay-runner-authority / ingest / failures / replay-blocked / replay-decision（有计数）、relay-contract-reason-coverage（守卫）。
- 第 1 次（17:18）：**`RELAY TESTS FAIL (1)`**——ingest 崩溃于 F-014 空文件断言（详见 N-01），其余套件 PASS（replay-decision 23、reason codes 55 等照常）。
- 第 2~6 次（17:23~17:37）：**`RELAY ALL PASS`**，exit 0，断言数逐次恒定：authority 59 / ingest 45 / failures 65 / replay-blocked 18 / replay-decision 23 / reason codes 55；守卫单条 `production reason codes covered: 55` PASS。与 DONE 自报（59/45/65、55）一致。
- ingest 压力：15 连跑（`pwsh -NoProfile -File` 子进程逐次隔离，`probe-wrap.ps1` 包裹 try/catch）15/15 `STRESS ALL PASS`。
- 探针复验均基于红后复原的干净树。

## 对抗性回归检查（F-016 / F-014 波及面）

1. F-016 顺序统一是否引入回归：`git show` 对比返工前版本，逐路径核对 probe_error（final_committed / pair-not-ok / 普通）、transition-rejected、正常观察、result/checkpoint accepted 的事件序列——种类、顺序、计数均与旧版一致，仅 Save/Add 次序翻转；failures 套件「三连 probe_error 记账」计数断言照常绿。无事件丢失/重复。
2. `Read-RelayJson` 新增 `json-not-object` 是否波及正常路径：`Read-RelayState`/`Read-RelayActivePlan`/`Read-RelayAuthority`/`Read-RelayActivePlanBody` 读入的都是 runner 自身按对象写入的文件，正常路径不受影响（6 轮全量含回放套件全绿佐证）；`Read-RelayEvents` 使用独立逐行解析（relay-store.ps1 L78），不经 Read-RelayJson，不受影响；损坏文件现在 fail-closed 抛出（拒收路径已被 catch 包住）——与 F-014 意图一致。
3. F-015 候选态深克隆：`ConvertTo-Json -Depth 100 -Compress | ConvertFrom-Json -AsHashtable` 为全量深拷贝，`$Run.state=$candidateState`（L86）替换引用，后续 Save 写候选态；authority 套件「replan 激活后 authority/active-plan/state 一致」断言绿，无引用别名残留。
