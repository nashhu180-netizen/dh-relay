# review-round2 · account9（轮2 换人增量复核 · fresh · 只读 · 对抗证伪）

VERDICT: changes-requested

> 依据：B 段新发现含 1 条 P1（空文件 result/checkpoint 提交抛异常而非 fail-closed，违反 brief B-4 明示要求）+ 2 条 P2（外部改坏 state 后 accept 路径部分写、事件追加与状态 CAS 无事务边界双向半态）。只写事实与级别，不做验收裁决。

---

## A 段：核轮1 结论 F-003～F-013 逐条判定

| ID | 级别 | 判定 | 证据 |
|----|------|------|------|
| F-003 | P2 | **修了未锁** | 修复在 `Test-RelayReplanCompatible` L39~42（role/brief_ref/next_action、旧 depends_on 被删、新增指向旧节点依赖、resume_from 四分支）。变异探针 **P-A1a**（删 L42 resume_from 校验）→ **红 2 条**（bad-resume-attempt 夹具 attempt_id=9 的 proposal 反而激活，cas-conflict 级联使「compatible replan activates」也红）；**P-A1b**（删 L40「旧 depends_on 被删」校验）→ **全绿 0 条红**。该分支无任何夹具/断言锁定（现有 fixtures：bad-role/bad-next-action/bad-resume-other/bad-resume-attempt/bad-dep-to-old；`plan-v2-bad-drops-A.json` 是「丢旧节点」非「删旧依赖」，走 L37 不走 L40）。 |
| F-004 | P2 | **真修+锁住** | 变异探针 **P-A2**（删入口 schema 拒收/immutable 分支）→ **红 1 条**。修复：badhash（schema 拒收）与 proposal-immutable 的 Runner 级断言入 `relay-runner-authority.ps1`；reason 归一化守卫保留 `proposal-rejected:<sub>` 前缀（relay-contract-reason-coverage.ps1）。 |
| F-005 | P2 | **真修+锁住** | 变异探针 **P-A3**（删 `Apply-RelayObservation` L151 final_committed 守卫）→ **红 5 条**（blocked-stop-ignore-probe-errors 夹具：stop 后 probe_error 只记账不判罚）。修复 L148~151。 |
| F-006 | P3 | **真修+锁住** | 两条回放套件改用 `Get-RelayEventSignature` 全量逐字节相等（replay-decision「decision replay full signature exact equality」PASS）。B-1 独立佐证：decision 回放连跑 3 次 events/state hash 与全签名逐字节相同。 |
| F-007 | P3 | **真修+锁住** | authority 套件含「receipt 写入后 terminal_state='launching'」投影断言（53 条之一）。 |
| F-008 | P3 | **真修+锁住** | `Invoke-RelayTick` L186 改按 plan 顺序遍历（`@($activePlan.nodes.node_id)`）。B-1：多节点同 tick 3 次回放签名逐字节相同；B-2：Open-RelayRun 重开与不重开签名/状态逐字节一致；静态扫描已覆 `adapters/`（replay-decision「replay and fake adapter expose no input API」PASS）。 |
| F-009 | P3 | **真修+锁住** | L44 校验 `$new.resume_from.attempt_id -ne $oldState.attempt_id`（P-A1a 证明删之必红）；ingest 套件含 stop `events_lines >= acceptedAt`（先 ack 后回收）。 |
| F-010 | P3 | **真修+锁住** | L196 `result_status -cne 'decision_required'` stall 守卫；failures 62 断言含 decision-wait 用例（decision 挂起超阈值不判 stalled）。 |
| F-011 | P2 | **真修+锁住** | 变异探针 **P-A4**（`Add-RelayEvent` occurred_at 改 UtcNow）→ **红 2 条**（authority 套件两处注入时钟断言）。修复：relay-store.ps1 L61 `(& $Run.clock).ToString('o')`。 |
| F-012 | P3 | **真修+锁住** | L237 blocked 路径 stop 失败记 `stop-failed:<reason>` observation 事件；ingest 套件含 stop-failed 记录断言。 |
| F-013 | P3 | **未修（open，预期）** | 生产扫描触发条件仍为 `(?i)verdict|reason`（relay-contract-reason-coverage.ps1 L72）；`Add-RelayProposalRejection $Run $Proposal 'proposal-rejected:<sub>'` 行内无 verdict/reason 字样，不进扫描。findings 表已计划「返工轮2 顺带」修复；本轮只读未改。行为断言仍红（守卫盲区非行为缺陷）。 |

## B 段：新发现清单（9 个新角度，未重复轮1）

- **P1 - 空文件 result/checkpoint 提交抛异常而非 fail-closed** - `Submit-RelayResultFile` L213 / `Submit-RelayCheckpointFile` L249（runner/relay-runner.ps1）· `Read-RelayJson`（runner/relay-store.ps1 L54）· `Get-RelayResultVerdict`（contracts/relay-schema.ps1 L18）
  - 证据（探针 B-4b）：0 字节空文件提交 → 抛 `RuntimeException: You cannot call a method on a null-valued expression`，栈在 relay-schema.ps1:18（`$Value.ContainsKey($key)` 对 $null）。根因：`ConvertFrom-Json ''` 返回 $null、Read-RelayJson 不抛，$null 穿过 try/catch。事件 0 追加（before=4 mid=4 after=4）、状态不变。不存在路径/目录路径均正确走 `unparseable-result`（no throw + 事件 + 状态不变）；未知节点走 `unknown-node` 且事件 0 增量。仅空文件漏网——违反 brief B-4「不抛出、有 result_rejected/checkpoint_rejected 事件」明示要求，且调用方收不到拒收事件。
- **P2 - 外部改坏 relay-state.json 后 accept 路径部分写（authority/active-plan 先于 Save 校验）** - `Submit-RelayProposal` L73~79（runner/relay-runner.ps1）
  - 证据（探针 B-5b）：fresh run 的 state 加 `extra_key` → `Open-RelayRun` 不抛（L23 读入时不校验）→ accept 路径先 `Write-RelayJsonAtomic` authority.json（gen=1, plan_version=1）+ active-plan.json + proposal 文件，随后 `Save-RelayState` 抛 `state-invalid:unknown-field:extra_key`。事后磁盘不一致：state 仍 plan_version=0/gen=0（extra_key 原样）、事件 0 条，而 authority 声称 gen=1 已激活——回放事件无法复现 authority 内容，且 run 卡死（accept 重试每次都在同一处抛；`Get-RelayReadyNodes` 因 plan_version=0 返回空）。对照：reject 路径 no-throw（仅追加事件）；tick/result 提交在写前抛（authority 字节不变，fail-closed 正确）。「读入时呢？」答案：不校验；「Save 前 Test 抛？」答案：抛，但在 authority/active-plan 已写盘之后。
- **P2 - 事件追加与状态 CAS 无事务边界：半态双向可达，违反「事件追加与状态 CAS 可重放」** - runner/relay-runner.ps1（Save→Add 为主：L79→81/83、L112→114、L163/169、L236/242、L266；Add→Save 反序：L151/155/167）
  - 证据（探针 B-6a）：events.jsonl 不可追加（换成目录）时，checkpoint 提交 → checkpoint.json 已写 + relay-state.json 已 Save（字节变）→ `Add-RelayEvent` 抛（relay-store.ps1 L59 读目录失败）→ 事件缺失：state 领先于事件。
  - 证据（探针 B-6b）：relay-state.json 不可写（换成目录）时，blocked 节点（final_committed）probe_error → `observation(probe_error)` 事件已追加（+1 条）→ `Save-RelayState` 抛（Move 覆盖目录失败）→ 事件领先于 state。
  - 评估：IO 失败时两半永久分叉，无补偿、`Open-RelayRun` 无状态-事件对账；replay 从事件重建的状态与磁盘 state 必然不一致。
- **P3 - paused 节点依赖者永久 waiting：行为符合预期，但零断言** - `Get-RelayReadyNodes` L94（runner/relay-runner.ps1）
  - 证据（探针 B-7）：A paused（probe 连败 + 剧本耗尽）后，依赖 A 的 C 保持 scheduling='waiting'、ready 集合空。预期行为成立，但测试无「paused 依赖者保持 waiting」用例锁定。
- **P3 - fake adapter `emit_observation` 对已 stop 的 session 仍吐 host 事件** - adapters/fake-adapter.ps1 L45~58
  - 证据（探针 B-8）：`stop` 后（stopped=$true）`emit_observation` 仍返回 host 项；stop 时 `on_stop='exited'` 会把磁带换成 exited，runner 侧照常收到 exited 观察。无业务状态外写（calls 仅 run 目录内）、9 键集合正确、无 fixture 外读取——越界面干净，仅停止语义缺陷。
- **P3 - F-003「旧 depends_on 被删」分支零断言**（并入 A 段 F-003 判定，P-A1b 全绿）

## 探针记录

### A 段变异探针（改 `tools/relay` 后运行套件，红后复原）

| 探针 | 操作 | 结果 | 复原 |
|------|------|------|------|
| P-A1a | 删 `Test-RelayReplanCompatible` L42（resume_from 校验） | 红 2 条：bad-resume-attempt（attempt_id=9）proposal 反被激活；cas-conflict 级联使「compatible replan activates」也红 | `git checkout -- tools/relay` + `git status --short tools/` 干净 |
| P-A1b | 删 L40（旧 depends_on 被删校验） | **全绿 0 条红**（→ F-003 该分支未锁） | 同上，干净 |
| P-A2 | 删 F-004 入口 schema 拒收/immutable 分支 | 红 1 条 | 同上，干净 |
| P-A3 | 删 F-005 `Apply-RelayObservation` L151 final_committed 守卫 | 红 5 条（blocked-stop-ignore-probe-errors 场景） | 同上，干净 |
| P-A4 | `Add-RelayEvent` occurred_at 改 `UtcNow` | 红 2 条（注入时钟断言 ×2） | 同上，干净 |

### B 段探针（全部在 `%TEMP%\relay-probe-*` 临时目录，未触碰代码树）

- **B-1**：decision 回放连跑 3 次 → events hash / state hash / 全签名逐字节相同（确定性成立）。
- **B-2**：中途 Open-RelayRun 重开 vs 不重开 → 继续 tick+摄入后全签名与状态逐字节一致。
- **B-3**：blocked→replan v2 → fresh A 的 L-0003.json 绑定 v2 plan_hash、authority_generation=2、attempt=2；旧身份链（v1/gen1/attempt1/L-0001/S-0001）迟到 checkpoint → `checkpoint_rejected`（stale-plan），state 字节不变，fresh A 不被暂停。
- **B-4/B-4b**：不存在路径 / 目录 → `unparseable-result`（no throw、状态不变、有事件）；**空文件 → 抛异常（P1）**；未知节点 → `unknown-node` 事件 0 增量。
- **B-5/B-5b**：state 加 `extra_key` → Open 不抛；reject 路径 no-throw；tick/result 提交在写前抛（authority 字节不变）；**accept 路径部分写（P2）**；`task_state='done'` → ready=0、Start 报 `node-not-ready`。
- **B-6a/B-6b**：events.jsonl 换目录 → state 已存事件缺失；relay-state.json 换目录 → 事件已追加 state 未存（P2 双向半态）。
- **B-7**：A paused → C 永久 waiting、ready 空（P3 无断言）。
- **B-8**：stop 后 `emit_observation` 仍吐 host 项（P3）；无 fixture 外读写；9 键。
- **B-9**：`git diff master..HEAD --name-only` 全在允许路径（DHR_02 workspace 文档 + tools/relay）；diff 下 contracts/ 仅 `relay-params.psd1` 一个新文件（5 键，F-002 已知）；`tools/relay` 内 `.dh-runtime` 零引用（grep 命中均在 tools/protocol、tools/tests 等模块外）；夹具凭据全 FAKE 占位（sk-FAKE*/FAKEHANDOFFKEY*/hunter2-fake 等）；`.ps1/.psd1` 无 BOM（efbbbf 零命中）。

## C 段：亲跑结果

命令：`pwsh tools/relay/tests/run-relay-tests.ps1`（2026-08-15 本会话亲跑，两遍：计数一遍 + 退出码一遍）

- 末行：`RELAY ALL PASS`；退出码 0；PASS 行共 393。
- 套件断言数：relay-runner-authority **53** / relay-runner-ingest **42** / relay-runner-failures **62** / relay-runner-replay-blocked **18** / relay-runner-replay-decision **23**；relay-contract-reason-coverage 覆盖 **48** 个生产 reason 码；5 个 contract 套件（schema/identity/transitions/redaction/failures）全 SUITE PASS（无 ASSERTIONS 计数行）。
- 与 progress.md E-006 记录一致（53/42/62/18/23、48 码）。

## 附：只读声明

本轮未对 `tools/` 做任何保留性修改；所有变异探针均已 `git checkout -- tools/relay` 复原，最终 `git status --short tools/` 为空。结论文件写毕即结束。
