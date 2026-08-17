# review-round1 · DHR_02（复核 worker: account4/glm-5.2 · headless · 只读 · 2026-08-15）

VERDICT: approved

## 发现清单

- P2 - 事件 `occurred_at` 的确定性没有任何断言覆盖（task_plan A6⑯ 明确要求"occurred_at 等于注入时钟"，实现只断言了 event_id）——`tools/relay/tests/relay-runner-authority.ps1`（`event id is deterministic` 断言行）——证据：变异探针 P-04 把 `relay-store.ps1` 的 `$event.occurred_at = (& $Run.clock).ToString('o')` 改为 `[DateTimeOffset]::UtcNow.ToString('o')` 后，authority 套件仍 `SUITE PASS`（全 11 套件无一处断言 occurred_at）。实现本身正确（源码 grep 无 `Get-Date|UtcNow|Now` 命中），纯测试牙口缺口。
- P3 - K-8 `resume_from` 校验不完整：只查 `node_id` 指向自己，不校验 `attempt_id` 是否为被阻塞 attempt，也不限制只有 blocked 节点可携带 resume_from——`tools/relay/runner/relay-runner.ps1` `Test-RelayReplanCompatible` 末行——证据：读源码，`if ($new.ContainsKey('resume_from') -and $new.resume_from.node_id -cne $old.node_id)` 是唯一检查；无对应测试。对 P1 回放无害（夹具是手工造的正例），但伪造 proposal 可给任意未阻塞节点塞 resume_from 并透传给 adapter。
- P3 - blocked 路径 `adapter.stop` 返回 `ok=$false` 时被静默丢弃，task_plan B1④ 写明"只记 findings 不改状态"，实际无任何记录——`tools/relay/runner/relay-runner.ps1` `Submit-RelayResultFile` blocked 分支 `[void](& $Run.adapter.stop ...)`——证据：读源码；fake adapter stop 仅在 unknown-session 时返回 ok=false，现有测试不可触发，行为面无后果。

## 探针记录（与主控 E-003 的 5 处探针不重叠）

| # | 变异 | 红了的断言 | 复原 |
|---|------|-----------|------|
| P-01 | `relay-runner.ps1` checkpoint 摄入把 K-5 同状态跳过改为 `$true`（同态也走矩阵） | ingest 套件 `SUITE FAIL (4)`：same state working checkpoint accepted / checkpoint snapshot stored / checkpoint accepted event appended / checkpoint refreshes progress time | `git checkout -- tools/relay` ✓ |
| P-02 | `relay-runner.ps1` 删掉 K-2 的 stale 分类（一律 `result_rejected`） | ingest `SUITE FAIL (1)`（wrong generation classified stale）+ replay-blocked `SUITE FAIL (2)`（milestone subsequence / late A1 stale event） | ✓ |
| P-03 | `relay-runner.ps1` 删掉 blocked 后 `$Run.state.replan_required=$true` | ingest `SUITE FAIL (1)`（blocked result requests replan） | ✓ |
| P-04 | `relay-store.ps1` `occurred_at` 改用 `UtcNow` | **未红**（authority 仍 PASS）→ 记为上方 P2 发现 | ✓ |
| P-05 | `relay-store.ps1` 事件序号偏移（`$count + 2`） | authority `SUITE FAIL (1)`（event id is deterministic） | ✓ |

每支探针后 `git status --short tools/` 均确认干净；最终态干净。

## 亲跑结果

`pwsh tools/relay/tests/run-relay-tests.ps1`（wt/DHR_02 HEAD 55819a0）：

- relay-contract-schema / identity / transitions / redaction / failures：SUITE PASS（41/29/89/19/16 断言，与 DONE 自报一致）
- relay-runner-authority：`ASSERTIONS 42` SUITE PASS
- relay-runner-ingest：`ASSERTIONS 40` SUITE PASS
- relay-runner-failures：`ASSERTIONS 50` SUITE PASS
- relay-runner-replay-blocked：`ASSERTIONS 18` SUITE PASS
- relay-runner-replay-decision：`ASSERTIONS 23` SUITE PASS
- relay-contract-reason-coverage：`production reason codes covered: 47` SUITE PASS
- 末行 `RELAY ALL PASS`，共 368 条 PASS 行，exit 0

## 11 个角度逐条结论

1. **契约调用 vs 复制**：通过——Runner 全部判定走 DHR_01 契约函数（`Test-RelayPlanProposal/Authority/ActivePlan/LaunchReceipt`、`Get-RelayResultVerdict/CheckpointVerdict/NodeFreezeSet/ProbeVerdict/StallVerdict/ExitWithoutResultVerdict`、`Test-RelayTerminalTransition/ResultTransition/TransitionPair`、`New-RelayEvent`、`Get-RelayPlanHash`）；本地逻辑仅 K-2 映射、K-5 同态跳过、K-8 replan 兼容三项，均为 task_plan 明文授权的 Runner 侧决策，非契约判定复制。
2. **A1/A2**：通过——CAS 冲突后 active-plan/authority/relay-state 三文件 `Get-FileHash` 字节级断言不变（authority 套件）；wrong-generation 的 stale 路径同样三文件哈希不变 + `result_status` 不推进（ingest）；duplicate 走 `final-immutable` 且 result.json 哈希不变；事件 kind/reason 逐条对照 K-1/K-2 断言。
3. **A3**：通过——blocked 回放签名精确子序列 11 条与 replay-signatures.txt 一致；A1 迟到结果只产 `result_stale|A|1|stale-plan`、trace 记录提交前后 state 哈希相同、A2 result.json 未变、无对 S-0003 的 stop；A2 launch 调用记录 `node_resume_from={A,1}`（fresh A 拿到 resume_from）；`launches/` 恰 3 张、session 互异。
4. **A4**：通过——t3 decision 后 `C.frozen_by=@('A')`、B 继续 launched、ready 集不含 C；t4 错 session checkpoint `checkpoint_rejected reason=identity-mismatch:session_id` 且冻结/decision 保持；调用日志 suspend/resume 计数=0 + runner 与 replay 源码 `Select-String` 静态扫描 0 命中（双保险）；t5→t6 终端 idle→running 全靠 adapter 磁带（fake 中 probe 即宿主观测通道，矩阵 guard 语义未绕过）。
5. **A5**：通过——succeeded+review 后 `task_state='active'`、node 记录键集合精确等于 14 键白名单（无 completed/done 类键），且 `Test-RelayStateSnapshot` 对多键/坏枚举 fail-closed 有独立断言。
6. **A6**：通过——failures 套件 9 组用例（launch 期限/probe 连败×3/停滞 30 tick/停滞反例（K-4 每 10 tick checkpoint 不触发）/exited 无结果/host 通道 exited/非法跳转/自报 interrupted/quota 兜底）每组均断言 paused + ready 空 + 再 tick probe 计数不增 + active-plan/authority 哈希不变；quota 路径 final 未落盘。
7. **receipt 先于 spawn（K-3）**：通过——`Start-RelayNodeAttempt` 中 receipt CreateNew → Save → `launch_receipt` 事件 → adapter.launch 顺序固定；adapter 在 launch 调用内现场 `Test-Path` 回填 `receipt_present` 并被断言 `$true`；句柄不等 → `launch_failed` reason `launch-handle-mismatch`（探针级断言含精确字面量）。
8. **确定性**：通过（实现）——runner/adapters 源码 grep 无 `Get-Date|UtcNow|[DateTime]::Now`，时间全走 `$run.clock`；事件 ID 探针 P-05 变红证明被断言；拒收路径不调 Save、事件序号取自 events.jsonl 行数不进 state；例外：`occurred_at` 无断言（见 P2）。
9. **测试有牙**：通过——本复核 5 支独立探针中 4 支真红（K-5/K-2/replan_required/事件序号），1 支（occurred_at）不红已升级为 P2 发现；主控 E-003 另有 5 处探针全红。
10. **越界与卫生**：通过——`git diff master..HEAD --name-only` 除 `tools/relay/**` 与本工作区外零文件；contracts 仅 `relay-params.psd1` 追加 `LaunchDeadlineSeconds = 120` 一键；DHR_01 既有夹具/六套件正文、`tools/protocol/**`、`.dh-runtime/` 零触碰；新夹具凭据扫描零命中（全 FAKE 字样）；新 `.ps1` 全部 UTF-8 无 BOM；reason 守卫扩到三目录、白名单 9 条精确行均带注释、47 码全覆盖。附注：`Write-RelayJsonAtomic` 在 task_plan 单次 Move 基础上加了 10×10ms 有界重试（progress 已记录，Windows 瞬时锁竞争），语义未变，不算越界。
11. **亲跑**：通过——见上，11 套件 `RELAY ALL PASS` exit 0，断言数与 DONE 自报逐一套一致。
