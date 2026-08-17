# as-built · relay-runner（dh-relay 最小 Runner core + fake adapter v1）

> 首份快照：DHR_02（P1 批次 1·实现最小 Runner 与确定性 fake replay）。建立在 DHR_01 契约层之上（见 [relay-contracts.md](relay-contracts.md)）；Runner 全部判定调用契约函数，不复制判定逻辑。对 dh-crew 零引用、不读写 `.dh-runtime`、不进 dh-crew `run-all`。

## 落点

| 类别 | 路径 |
|------|------|
| 运行现场存储 | `tools/runner/relay-store.ps1`：`Get-RelayRunPaths` / `Write-RelayJsonAtomic`（tmp+Move 覆盖·有界重试）/ `Write-RelayJsonCreateNew`（不可变文件·已存在→`file-exists`）/ `Add-RelayEvent`（确定性 `EV-<run_id>-<6 位序号>`·occurred_at 取注入时钟·先过 `Test-RelayEvent`）/ `Test-RelayStateSnapshot`（relay-state 字段白名单 fail-closed）/ `Save-RelayState` / `Read-RelayActivePlanBody`（核 hash） |
| Runner core | `tools/runner/relay-runner.ps1`：`New-RelayRun` / `Open-RelayRun` / `Submit-RelayProposal`（schema→wrong-run→CAS→版本连续→提案人→replan 兼容→proposal 不可变→写 authority→写 active-plan）/ `Get-RelayReadyNodes` / `Start-RelayNodeAttempt`（receipt CreateNew + `launch_receipt` 事件**先于** adapter.launch·句柄精确相等）/ `Invoke-RelayTick`（host 观测→probe→启动期限→停滞）/ `Submit-RelayResultFile` / `Submit-RelayCheckpointFile` |
| 回放驱动器 | `tools/runner/relay-replay.ps1`：`Invoke-RelayReplay` / `Invoke-RelayReplayTick` / `Get-RelayEventSignature -SkipHeartbeat` |
| fake adapter | `tools/adapters/fake-adapter.ps1`：`New-RelayFakeAdapter -Script` → 恰好 9 键（backend/launch/probe/suspend/resume/stop/emit_observation/calls/sessions）；剧本磁带驱动 probe；无任何人工输入 API；`adapters/README.md` 六动词契约 |
| 契约参数追加 | `tools/contracts/relay-params.psd1` 第五键 `LaunchDeadlineSeconds = 120`（有界启动期限唯一冻结点）；DHR_03 再追加三键（见 [relay-psmux-host.md](relay-psmux-host.md)），`relay-runner-authority.ps1` 键数守卫已迁为八键 |
| fixtures | `tools/tests/fixtures/runner/{plans,results,checkpoints,adapter,replay}/`（静态·全 FAKE） |
| 测试 | `tools/tests/relay-runner-{authority,ingest,failures,replay-blocked,replay-decision}.ps1`；`run-relay-tests.ps1` 11 套件 → `RELAY ALL PASS`；reason 守卫扫描范围扩到 `runner/`+`adapters/`，`proposal-rejected:*` 按完整子码比对 |
| 说明 | `tools/runner/README.md`（K-1～K-10 决策摘要） |

## 运行现场目录（Runner 唯一写者）

`<Root>/<run_id>/{plans/relay-plan.vN.proposal.json（不可变）, launches/<launch_id>.json（不可变 receipt）, attempts/<node>/<attempt>/{checkpoint.json（原子替换）, result.json（不可变 final）}, active-plan.json, authority.json, relay-state.json, events.jsonl（只追加）}`。测试一律用临时目录。

## 行为要点（现状）

- **CAS 晋级**：`ExpectedGeneration` 不等→`proposal-rejected:cas-conflict`，active-plan/authority/relay-state 字节不变；generation 从 1 起每次晋级 +1；proposal 被拒只借 `plan_proposed` 事件带 `reason=proposal-rejected:<码>`（v1 event kind 不扩枚举，K-1）；replan 兼容规则 K-8（保留旧节点·role/brief_ref/next_action 不变·旧节点只可新增指向新节点的依赖·resume_from 只能指自己且 attempt_id=被阻塞 attempt）。
- **身份与转换**：result/checkpoint 摄入 = 解析→`Get-Relay*Verdict`（DHR_01）→`Test-RelayResultTransition`→晋级；`verdict=stale` 或 reason ∈ {stale-plan, stale-generation}→`result_stale`，其余非 accept→`result_rejected`（K-2）；final 落盘 CreateNew 保证不可改写；`succeeded` 后 `task_state` 仍 `active`（节点记录恰好 14 键，无完成/失败字段）。
- **decision 挂起**：`decision_required` checkpoint→`Get-RelayNodeFreezeSet` 结果写入被冻节点 `frozen_by[]`；同链后续 working checkpoint / final 解冻；错身份后续 checkpoint 拒；Runner 从不调用 `suspend`/`resume`（调用日志 + 源码扫描双断言）；idle→running 只靠宿主观测；decision 挂起不判停滞。
- **异常 fail-closed（K-6）**：launch 失败/句柄不等/期限超时→`launch_failed`；probe 连败≥阈值→unknown/interrupted_unknown（`probe-lost`）；停滞（心跳不算进展，K-4）→`stall-threshold-exceeded`；exited 无 final→`exit-without-result`；非法观测转换→`transition-rejected:*`；worker 自报 quota→`reserved-target-form` 拒收 + 投影 interrupted_unknown（K-7）；一律 `task_state=paused` 不再调度/probe，authority 不动。**已交棒（final_committed）节点的后续观测只记账不改业务投影、不 pause**（返工轮1 F-005）；blocked 节点 stop 后 replan 复位为 waiting、fresh attempt 拿到 resume_from。
- **确定性**：时间只取 `$run.clock`；事件 ID 序号来自 events.jsonl 行数（拒收路径不改 relay-state.json）；tick 按 active plan 节点顺序遍历；两条回放签名（blocked-replan 11 行 / decision 11 行）与 `workspace/DHR_02/review-logs/replay-signatures.txt` 逐行全等。

## P1 明确不做（留位）

真实 psmux adapter（DHR_03）、review lead / 并行 reviewer、通用 DAG 调度、quota 识别/恢复通道、Runner 调 resume/suspend、诊断 agent 自动拉起、`plan_rejected` 事件 kind（目标形态候选，见 findings F-001）。
