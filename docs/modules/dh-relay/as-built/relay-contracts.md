# as-built · relay-contracts（dh-relay 接力契约层 v1）

> 首份快照：DHR_01（P1 批次 1·冻结接力权威、双维状态与异常契约）。全 greenfield，`tools/` 新命名空间；对 dh-crew 零引用（不点源 `tools/protocol/**`、不读 `.dh-runtime`、不进 dh-crew `run-all`）。

## 落点

| 类别 | 路径 |
|------|------|
| 契约参数（唯一冻结点） | `tools/contracts/relay-params.psd1`：`SchemaVersion=relay/v1`、`SessionTailMaxBytes=65536`、`ProbeMaxConsecutiveFailures=3`、`StallThresholdSeconds=1800`；DHR_02 追加 `LaunchDeadlineSeconds=120`（有界启动期限）；DHR_03 追加 `IdleAfterSeconds=5`（屏幕指纹沉默窗）、`StopDeadlineSeconds=30`、`AttachDeadlineSeconds=90`（psmux 真实时延实测定值，见 [relay-psmux-host.md](relay-psmux-host.md)） |
| 转换矩阵（唯一冻结点） | `tools/contracts/transition-matrix.json`：terminal 6 态 / result 6 态，边带 `guard` + `p1` 布尔 |
| schema 校验器 | `tools/contracts/relay-schema.ps1`：`Test-RelayPlanProposal / Test-RelayActivePlan / Test-RelayAuthority / Test-RelayLaunchReceipt / Test-RelayResult / Test-RelayCheckpoint / Test-RelayEvent / Test-RelayHandoffHeader`、`Get-RelayPlanHash` |
| 身份链判定 | `tools/contracts/relay-identity.ps1`：`Get-RelayResultVerdict / Get-RelayCheckpointVerdict / Get-RelayResultFileVerdict / New-RelayEvent / Get-RelayNodeFreezeSet` |
| 转换判定 | `tools/contracts/relay-transitions.ps1`：`Test-RelayTerminalTransition / Test-RelayResultTransition / Test-RelayTransitionPair / Get-RelayProbeVerdict / Get-RelayStallVerdict / Get-RelayExitWithoutResultVerdict` |
| 脱敏 | `tools/contracts/relay-redaction.ps1`：`Invoke-RelayTailSanitize`（先脱敏再限长）、`Test-RelayArtifactClean` |
| fixtures | `tools/tests/fixtures/{plans,authority,results,checkpoints,tails,artifacts,failures}/`（静态文件·全 FAKE 假值） |
| 测试 | `tools/tests/relay-contract-{schema,identity,transitions,redaction,failures}.ps1`；runner `tools/tests/run-relay-tests.ps1` → `RELAY ALL PASS` |
| 说明 | `tools/contracts/README.md` |

## 契约要点（现状）

- **字段白名单 fail-closed**：所有对象顶层带 `schema_version="relay/v1"`；未知字段→`unknown-field:<名>`；枚举/schema_version 用 Ordinal 精确比对（`-cnotin`/`-cne`）；ISO 时间须 `yyyy-MM-ddTHH:mm:ss` 前缀。字段全表见 `workspace/DHR_01/task_plan.md`【schema 冻结表】。
- **身份链 7 字段**：`plan_version / plan_hash / authority_generation / node_id / attempt_id / launch_id / session_id`；result / checkpoint / handoff 头 / receipt 复用。proposal 不自带 generation；generation 从 1 起。
- **判定顺序**（`Get-RelayResultVerdict`）：schema → stale-plan → stale-generation → wrong-node → attempt（小于 Current=`stale`；不等且 launch/session 同→`identity-mismatch:attempt_id`）→ launch/session mismatch → `final-immutable`（final 已提交且同链再来）→ accept。checkpoint 同序；final 提交后再来 checkpoint→`attempt-closed`；ckpt 旧 attempt 判 `stale`（与 result 对齐）。
- **FreezeSet**：`Get-RelayNodeFreezeSet` 返回传递闭包依赖集合，不含自身、无依赖节点不入（A4 只冻依赖节点）。
- **矩阵**：terminal 18 合法边（`unknown` 出边 guard 全为 `trusted-probe-or-diagnosis`，`idle→running` guard=`host-observed-new-turn`、无任何 resume guard，`exited` 零出边，无自环）；result 边含 `working→decision_required(checkpoint)`、`decision_required→working/succeeded/dependency_blocked/interrupted_unknown`、quota 三条边 `p1=false`（`working→quota`、`decision_required→quota`、`quota→working`）→ `reserved-target-form`。测试内独立硬编码 design §3.1 oracle，断言矩阵边集合==oracle（F-011 修复后）。
- **双维 fail-closed**：`Test-RelayTransitionPair` 任一维不 ok→`dual-dimension-fail-closed:<维>`。
- **异常判定**：连续 probe 失败≥阈值→(`unknown`, `interrupted_unknown`)，支持 `-CurrentTerminal/-CurrentResult`（含 decision_required 挂起）；无进展超阈值→stalled→interrupted_unknown 路径；exited 无 final→interrupted_unknown；半写/坏 JSON→`unparseable-result`/`unknown-enum`。
- **脱敏**：三类 detector（api_key 含 `sk-` 整串 / PEM 私钥块 / password）命中值整体替换为 `<REDACTED:kind>`；顺序固定先脱敏再按 UTF-8 字节限长保尾部；`MaxBytes` 显式传参为唯一合法覆盖入口。四类工件（handoff/result/event/session-tail）各有含凭据夹具断言零残留。

## P1 明确不做（留位）

quota 识别/恢复通道（矩阵边 p1=false 留位）、nonce 逐项重放测试（仅冻结 control 事件三字段）、jwt/env_secret/bearer_token detector、Runner 主循环、任何 adapter。行为面"Runner 不读回答/不 resume"在本层只有契约缺席证明 + 矩阵 guard 断言，行为验证归 DHR_02 A3/A4 与 DHR_03 真跑。
