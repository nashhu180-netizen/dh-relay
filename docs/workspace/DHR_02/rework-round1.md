# rework-round1 · DHR_02 返工轮1（codex 施工 · 只修 findings 列出的项）

你是被派进本仓库的施工 worker（headless）。当前目录=任务工作树根（分支 wt/DHR_02）。零上下文，读本文件 + `docs/modules/dh-relay/workspace/DHR_02/task_plan.md`（通用约定/K 决策/数据形状）+ `findings.md`（F-003～F-012 原文）即可开工。不拉终端、不派活、不回头问人；卡住写 `status: blocked` 到 DONE。

## 必修（P2）

- **F-005（行为缺陷·先修）**：`tools/relay/runner/relay-runner.ps1` `Apply-RelayObservation`：节点 `final_committed=$true`（已交棒：succeeded/blocked）时，后续观测**只记账**——probe_error 仍累计计数并追加 observation 事件，但**不**触发 `Get-RelayProbeVerdict` 的业务投影、**不** pause；成功观测仍按矩阵更新终端维（合法边）并记事件；非法边照旧只记 `transition-rejected` 事件但**不** pause 已交棒节点。同时 `Submit-RelayProposal` 复位规则不变。新夹具 `fixtures/runner/adapter/blocked-stop-ignore-probe-errors.json`（launch1 probes ["running","running",{probe_error},{probe_error},{probe_error}]，on_stop "ignore"）；在 `relay-runner-failures.ps1` 加用例：A 提交 blocked → tick×4 → 断言 A.scheduling 仍 'blocked'、task_state 'active'、result_status 'dependency_blocked'、无 `probe-lost`；再提交 v2 replan（`plans/plan-v2-replan-B-before-A.json`，gen 1）→ ok，A.scheduling='waiting'，`Get-RelayReadyNodes` 含 B；再 tick 后 B 拉起。≥5 断言。
- **F-003**：新夹具 `fixtures/runner/plans/`（前三个基于 `plan-v2-replan-B-before-A.json` 改一处、重算 hash）：`plan-v2-bad-role.json`（A role→reviewer）、`plan-v2-bad-next-action.json`（A next_action→none）、`plan-v2-bad-resume-other.json`（A resume_from.node_id→"B"）；第四个 `plan-v2-bad-dep-to-old.json`：以 `plan-v1-decision-ABC.json` 为 v1（run_id RUN-FAKE-DHR02-DEC，先在测试里晋级它），v2=replanner、v2 版本、保留 A/B/C 并新增节点 D（depends_on []），但 B 的 depends_on 改为 ["A"]（新增指向**旧**节点的依赖）→ 拒于 B。authority 套件各断言 reason=`proposal-rejected:replan-incompatible:<node>` 1 条（共 ≥4 条；每条须让删掉 `Test-RelayReplanCompatible` L39～L42 对应行会红）。
- **F-004**：authority 套件：提交 DHR_01 `fixtures/plans/plan-v1-badhash.json`（gen 0）→ 断言 reason=`proposal-rejected:plan-hash-mismatch` 且无 active-plan.json；先成功晋级 v1 后，把同 plan_version=1、内容不同的对象（读 plan-v1-single-A 后改 summary/proposed_at 并重算 hash 写成 `plans/plan-v1-single-A-variant.json` 夹具）用 `-ExpectedGeneration 0` 提交→先撞 cas-conflict——所以 `proposal-immutable` 只能在文件已存在但 CAS 通过时触发：构造方式=新 run 里先手工把 variant 写到 `plans/relay-plan.v1.proposal.json`（测试直接复制文件进 run 目录，模拟编排 agent 先落盘的候选），再 `Submit-RelayProposal plan-v1-single-A gen 0` → 断言 reason=`proposal-rejected:proposal-immutable`。**守卫**：`relay-contract-reason-coverage.ps1` 对 `proposal-rejected:` 前缀改为按**完整码**（`proposal-rejected:<sub>` 到冒号后第一个非字面处）比对——最小实现：`Add-NormalizedReason` 若前缀 ∈ @('proposal-rejected') 则保留到第二段（`proposal-rejected:cas-conflict`），子码含 `$` 变量的（如 `proposal-rejected:$($schema.reason)`）归一为 `proposal-rejected:<dynamic>` 并要求测试侧至少有一条 `proposal-rejected:plan-hash-mismatch` 类真实子码断言即视覆盖；把新增规则写进守卫顶部注释。
- **F-011**：authority 套件断言 `Add-RelayEvent` 事件 `occurred_at` == 注入时钟 `.ToString('o')`；再断言 tick 时钟步进后新事件 occurred_at 随之变化。

## 顺带（P3，能修则修，每项 ≥1 断言）

- F-006：两条回放测试改为与硬编码全序列**逐行全等**（不再 Assert-Subsequence；保留 `-SkipHeartbeat`）。
- F-007：authority 套件 launch 后（tick 前）断言 `terminal_state -eq 'launching'`。
- F-008：`Invoke-RelayTick` 改按 active plan `nodes[]` 顺序遍历（无 active plan 时按 Keys 排序）；加 `Open-RelayRun` 重开后 state 与文件一致断言 1 条；无输入 API 静态扫描加 `adapters/fake-adapter.ps1`（模式排除 `verb='resume'`/`verb='suspend'` 与 `$resume =`/`$suspend =` 定义行——最简单：扫 `answer|question|options|input` 四词即可）。
- F-009：`Test-RelayReplanCompatible` 校验 `resume_from.attempt_id -eq 该旧节点当前 attempt_id`（从 `$Run.state.nodes`）且仅 `scheduling='blocked'` 的节点可带 resume_from；夹具 `plan-v2-bad-resume-attempt.json`（attempt_id 9）断言 1 条；ack-stop 顺序：fake adapter stop 调用记录里加 `events_lines`（调用时 events.jsonl 行数），ingest 断言 stop 记录的 events_lines ≥ result_accepted 事件序号。
- F-010：failures 套件加：decision 挂起 40 tick 不判 stalled（A ckpt decision 后 tick×40，task_state active）；decision 挂起期间 probe 连败×3 → terminal unknown/result interrupted_unknown/paused probe-lost（用 `probe-errors-3` 类夹具 + decision ckpt）。
- F-012：blocked 分支 `adapter.stop` 返回 ok=false → 追加 `observation` 事件 reason=`stop-failed:<reason>`（terminal_state=当前），不改状态；fake 夹具无法直接造 unknown-session——在 ingest 里用 `Submit-RelayResultFile` 前手动 `$adapter.sessions.Remove($sid)` 制造，断言事件存在。

## 交付

- 每步 TDD；跑 `pwsh tools/relay/tests/run-relay-tests.ps1` 必须 `RELAY ALL PASS`（DHR_01 六套件不动）。
- 一个 commit：`fix(dh-relay): DHR_02 返工轮1——F-003~F-012（已交棒节点观测只记账/replan 谓词与 schema 拒收断言/occurred_at 确定性/回放全等等）`；`git add tools/relay docs/modules/dh-relay/workspace/DHR_02`。
- `findings.md` 各行「处理/状态」列回写 `resolved（返工轮1 <sha>）`（不改级别/问题列）；`progress.md` 日志+证据各记一行；覆盖 `DONE`（status: done + commit SHA + 各套件断言数）。写完 DONE 即结束。
