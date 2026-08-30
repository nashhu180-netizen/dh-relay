<!-- dh:planning-event:v1 id=DHR-A-26 stage=A-full artifact=design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md review=evidence/22-Receipt绑定结果提交与P6真实闭环-交叉审核记录.md#review-a26 understanding=evidence/22-Receipt绑定结果提交与P6真实闭环-交叉审核记录.md#understanding-a26 -->
# Receipt 绑定结果提交与 P6 真实闭环：契约调整

> 状态：`DHR-A-26` 已完成 fresh 审核、理解对齐与用户整版确认。本文件是 `design/README.md` `designInputs[]` 的正式 P6 补充输入；它冻结契约边界，不授权 B-adjust、代码、用户级配置写入、真实 Agent、verify、推送或部署。
>
> 它在 Result ingress 范围内补充并优先于 `design/07`、`design/08`、`design/11`；未提及部分保持既有合同。

## 1. 目标、边界与决定

### 目标

让当前 Herdr Attempt 的产品 Agent 通过既有同 OS-user 本地授权，提交 Receipt 绑定的最小结论；持 lease 的 workflow driver 以可恢复 Store mutation 写入唯一 `relay.result/v2`，再推进节点。由此 DHR_35 才可分别验证 Windows Codex 和 Claude Code 的真实闭环。

### 冻结决定

1. Herdr `done` / `idle`、pane 文本、进程退出、CLI exit code、Agent 自述与 `herdrJudge/captureHerdrResult` 都只是观测或诊断，**永不直接产生 Result、失败或 fallback**。
2. Agent 未提交 Result 时，driver 只在内存进入 `awaiting_result` 接收期；超时追加既有 `human_input_requested`，reason=`E_EXECUTOR_RESULT_MISSING`，由现役回放导出 `waiting_human/needs_you`。它不自动失败、不自动 fallback。
3. Receipt submission 首版不承载 `quota_signal`；Agent 报 failed 时固定 `E_EXECUTOR_REPORTED_FAILURE`，不得触发自动 quota/fallback。若要恢复可信 quota source，必须另走 A-full/B-adjust。
4. Registry 任一已登记项不合规则继续整体 fail-closed；不得用局部测试 registry 冒充真实 Profile，也不得把 registry 不可用解释为 fallback unavailable。
5. Linux 不新增专用命令、feature gate 或环境动作；本设计不声称 Linux 已验证，DHR_35 的 Linux SSH 仍是 B-22 `延后/受限`。

### 非目标

- 不新增网络端口、跨主机授权、token 透传、账号切换、自动登录或凭据读取/写入。
- 不接收 Agent 自由文本、日志、文件、绝对路径、环境内容或自由 `structured` 上传。
- 不改变 `relay.rpc/v1` endpoint、握手、schema、capability hash 或既有 v1 行为。

## 2. Receipt-bound submission 合同

新增 `relay.executor-result-submission/v1`：

```json
{
  "protocol": "relay.executor-result-submission/v1",
  "receipt_id": "<current-attempt-receipt>",
  "outcome": "succeeded",
  "reason": null
}
```

- 字段闭集仅为 `protocol / receipt_id / outcome / reason`。`outcome` 只能是 `succeeded|failed`；成功的 `reason=null`，失败固定 `E_EXECUTOR_REPORTED_FAILURE`。
- 调用方不得提交 run/node/attempt/executor/time/digest/log locator 或 structured。Relay 仅从已持久的当前 Attempt Receipt、driver 上下文和服务端时钟生成完整 `relay.result/v2`。
- Result 的 `structured` 固定为 `{ "source":"receipt-bound-submission/v1" }`；`payload_digest` 为 Receipt 绑定字段、outcome、reason、固定 structured 与 protocol 的 RFC 8785 JCS + SHA-256。`finished_at` 不参加 digest。
- `receipt_id` 是运行关联能力而非凭据。它可存在于私有 Run Store、受控 completion instruction 和本机 RPC request；公开配置、普通日志、截图及对外证据不得明文记录，DHR_35 只保留截断/摘要关联符。
- Herdr Attempt Receipt 新增 immutable `result_submission_mode:"receipt-bound/v1"`。没有这个持久标记的 Attempt 不得接收该 submission。

## 3. RPC、CLI、单写者与恢复

### RPC / CLI

`relay.rpc/v2` 新增 `submit-executor-result`，参数为 §2 对象，成功结果严格为：

```json
{
  "ok": true,
  "idempotent": false,
  "result": "<完整且仅符合 relay.result/v2 的 server-generated 对象>"
}
```

v2 先完成现役 descriptor、本机 capability 和 `contracts` 回证；CLI `relay submit-result --receipt-id <id> --outcome succeeded|failed [--reason <code>]` 只是薄客户端，只读既有私有 capability，参数以固定 argv 传递，不能显示 capability 或 Receipt 内容。

稳定拒绝：未认证=`E_CLIENT_NOT_AUTHORIZED`；未知/非当前 Receipt=`E_IDENTITY_MISMATCH`；fenced=`E_ATTEMPT_FENCED`；冲突终态=`E_TERMINAL_STATE_CONFLICT`；service/driver 尚未恢复=`E_SERVICE_NOT_READY`。同参数重投仅在 committed Result 同 digest 时返回 `idempotent:true`。

### 唯一 writer 与 Result mutation

service 仅认证并路由，绝不直接 `appendResult`、不判断任务质量。对应 driver gate 通过 actor 的 `submitControl` 调用 Store，逐项检查 `{ok,idempotent,reason}`；只有 mutation 已 committed 且 `ok=true` 才推进节点。

Result 必须复用 `relay.store-mutation/v1`：`results/<receipt_id>.json`、对应 attempt event 和重放后的 `state.json` 写入同一 prepared journal。staging blob、precondition/hash、fsync、prepared/recovery/committed 顺序与 DHR_61 pause/retry 相同；任一 prepared 目标未完成必须先恢复，journal/blob 缺失、摘要冲突或无法补全一律 `E_STORE_MUTATION_RECOVERY_FAILED`。在 committed 前不得发布订阅、回 RPC 成功、声称幂等或推进节点。

### Gate 生命周期

service bootstrap 必须在 ready descriptor 前，对每个非 terminal、当前 Receipt 有 `result_submission_mode:"receipt-bound/v1"` 的 Run 取得 actor/lease、从 Receipt+Store state 重建 receiver driver gate。重建不得新签 Receipt、不得启动第二个 Agent，只恢复提交/推进权；无 lease、Store 待恢复、Receipt 非当前、Run terminal 或无 mode 时一律不接收。正常完成前，service 不得从 drivers map 删除该 receiver gate。

## 4. 验收

| ID | 类型 | 命题 | 自动证据 |
|---|---|---|---|
| P6-RI-A1 | 机器证 | 当前 Receipt 的 submission 仅经 v2 回证、driver actor 队列和可恢复 mutation 写一个完整 Result；身份字段全由 Receipt 派生，CLI 零 capability 输出。 | RPC/CLI/driver/Store 定向测试、prepared 各阶段强杀恢复、敏感词扫描。 |
| P6-RI-A2 | 机器证 | done/idle 无 submission 时只在 timeout 后产生 `human_input_requested:E_EXECUTOR_RESULT_MISSING` 与 `waiting_human/needs_you`；绝不终态或 fallback。 | Herdr adapter/driver 回归。 |
| P6-RI-A3 | 机器证 | 未知、旧、fenced、pause、非当前、终态冲突、未认证、重启中、lease-lost 均不改账；仅 committed 同 digest 可幂等。 | Store/RPC/恢复负例。 |
| P6-RI-A4 | 机器证 | Codex 与 Claude Code 分别在 DSH-off Windows 临时仓完成 Receipt→checkpoint→submission→Result→终态→CLI inspect/events/focus；证据无凭据及原 Receipt ID。 | DHR_35 真实 E2E，fixture 不替代。 |
| P6-RI-A5 | 机器证 | registry 坏条目拒绝真实启动；两个修复后的指定 Profile 复验通过，零配置正文/凭据进入工件。 | 独立 registry 维护卡定向校验。 |

## 5. 拟议 B-adjust（尚未生效）

1. 新增 Registry 维护卡：只修复/复验用户级 executor registry 的非敏感路径和元数据；不读配置正文、不改产品配置/凭据、不登录。
2. 新增 heavy Result bridge 卡：`contracts/**`、Store mutation、v2 RPC/CLI、service/driver、Herdr completion instruction 与定向回归；它承接 P6-RI-A1~A3。
3. DHR_35 保持进行中并依赖两卡；两卡完成且用户另行 D-start 后，才跑 Windows 两条真实产品实录。Linux 不自动恢复。

## 6. 反例与止损

- 不得留下任何 `herdrJudge/captureHerdrResult → recordResult` 直写支路。
- 不得以 prepared result、pane 文本、Agent 自述或结果文件存在作为成功依据。
- 不得让 service 绕过 driver gate 直接开 Store。
- 不得用任意 structured、本机 capability 或测试 registry 充当真实身份/结果证据。
- 任何 Result recovery、v2 兼容或原因码边界不能证明时，停止并新开设计调整；不得把债务转嫁给 DHR_35。
