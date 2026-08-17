# rework-round2 · DHR_02 返工轮2（codex 施工 · 只修 findings 列出的项）

你是被派进本仓库的施工 worker（headless）。当前目录=任务工作树根（分支 wt/DHR_02）。零上下文，读本文件 + `docs/modules/dh-relay/workspace/DHR_02/task_plan.md`（通用约定/K 决策）+ `findings.md`（F-003 reopen、F-013～F-018 原文）+ `review-logs/review-round2.account9.md`（复核者证据）即可开工。不拉终端、不派活、不回头问人；卡住写 `status: blocked` 到 DONE。

## 必修

- **F-014（P1）**：`tools/relay/runner/relay-store.ps1` `Read-RelayJson`：解析结果不是 `[hashtable]`（$null / 数组 / 标量）→ `throw 'json-not-object'`；`Submit-RelayResultFile` / `Submit-RelayCheckpointFile` 现有 try/catch 因而走 `unparseable-result` / `unparseable-checkpoint`（事件 + 不改 state + 不抛）。夹具：`tools/relay/tests/fixtures/runner/results/result-empty.json`（0 字节静态文件）、`fixtures/runner/checkpoints/ckpt-empty.json`（0 字节）、`fixtures/runner/results/result-array.json`（内容 `[]`）；ingest 套件各 1 断言（事件 kind/reason + relay-state.json 字节不变 + 不抛）。注意 `Read-RelayJson` 也被 `Read-RelayActivePlan` 等用到——那些路径遇非对象抛出是正确的 fail-closed（Runner 自己写的文件被改坏）。
- **F-015（P2）**：`Open-RelayRun` 读入 state 后立刻 `Test-RelayStateSnapshot`，不过→`throw "state-invalid:<reason>"`。`Submit-RelayProposal`：把"更新后 state"先算在**克隆副本**上（`$Run.state` 深拷贝或按需构造），跑 `Test-RelayStateSnapshot`，不过→`Add-RelayProposalRejection ... 'proposal-rejected:state-invalid'` 且**不写任何文件**；通过后再写 proposal/authority/active-plan/state。断言（authority 套件）：①往 fresh run 的 relay-state.json 加 `extra_key` 后 `Open-RelayRun` 抛且消息含 `state-invalid`；②同一 run 直接（不经 Open，手改 `$run.state.extra_key=1`）提交 v1 → ok=false reason `proposal-rejected:state-invalid`，authority.json/active-plan.json 不存在、events 只多 1 条 plan_proposed。
- **F-003 残余（P2）**：新夹具 `fixtures/runner/plans/plan-v2-bad-drop-dep.json`：以 `plan-v1-decision-ABC.json` 为 v1（C depends_on ["A"]），v2=replanner、v2、保留 A/B/C 并加新节点 D，但 C 的 depends_on 改为 []（删旧依赖）→ 拒于 C；authority 断言 reason=`proposal-rejected:replan-incompatible:C`；删掉 `Test-RelayReplanCompatible` 的「旧 depends_on 被删」那行必须红。

## 顺带

- **F-013**：`relay-contract-reason-coverage.ps1` 生产扫描触发条件 `(?i)verdict|reason` 改为 `(?i)verdict|reason|Add-RelayProposalRejection`；跑守卫确认所有 `proposal-rejected:<sub>` 子码进 productionReasons 且各有 Assert 覆盖（缺的补断言）。自验：临时把 `wrong-run` 改 `wrong-run-zzz` 守卫应红，复原。
- **F-016**（主控裁 P3）：`relay-runner.ps1` 三处「先 Add event 再 Save」（Apply-RelayObservation probe_error 分支等）改为统一「先 Save state 再 Add event」；`tools/relay/runner/README.md` 加一段"落账顺序：state 先于 event；Runner 自身 IO 故障下两者不原子，对账归目标形态"。不新增对账逻辑。
- **F-017**：failures 套件加 1 用例/≥2 断言：用 `plan-v1-decision-ABC`，A 拉起后 probe 连败×3 → A paused；断言 C.scheduling='waiting' 且 `Get-RelayReadyNodes` 不含 C；再 tick 仍如此。
- **F-018**：fake adapter `stop` 时清空该 session 的 `host` 队列；断言 1 条（host-exit 类夹具 stop 后 emit_observation 不再吐该 session）。

## 交付

- TDD；`pwsh tools/relay/tests/run-relay-tests.ps1` 必须 `RELAY ALL PASS`（DHR_01 六套件不动）。
- 一个 commit：`fix(dh-relay): DHR_02 返工轮2——F-014 空文件 fail-closed / F-015 state 校验前置 / F-003 残余 / F-013 守卫触发 / F-016~F-018`；`git add tools/relay docs/modules/dh-relay/workspace/DHR_02`。
- `findings.md` 对应行状态回写 `resolved（返工轮2 <sha>）`（F-016 写 `resolved（返工轮2 <sha>·顺序统一+文档；对账→backlog）`）；`progress.md` 日志+证据各记一行；覆盖 `DONE`（status: done + SHA + 各套件断言数）。写完 DONE 即结束。
