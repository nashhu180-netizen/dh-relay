# DHR-A-26：Receipt 绑定结果提交与 P6 真实闭环候选

> 状态：已由 `DHR-A-26` 审核闭合并获用户整版确认，内容已晋升为正式输入 [design/12](../12-Receipt绑定结果提交与P6真实闭环-契约调整.md)。本文件保留形成过程，不是正式输入，亦不单独授权 B-adjust、代码、用户级配置改写、真实 Agent、verify、推送或部署。
>
> 需求对齐：用户已确认「Result 必须通过 Receipt 绑定的结构化提交进入 Relay；Herdr `done` 仅是观测，不直接成功」。本稿把该确认展开为可审核的最小合同，整版确认前仍可修改。

## 1. 现状、目标与非目标

### 现状

1. `relay.result/v2` 已是 Attempt 唯一终态账；Store 只接受当前 Receipt，fenced Receipt 一律拒绝。
2. Herdr `done`/`idle` 目前只有在注入外部 `judge` 给出 verdict 时才会落 Result；正式 service 没有该注入，故真实产品 Agent 不会自然收口。
3. 本机 Executor Profile registry 当前因 `E_UNRESOLVED_CONFIG` 整体 fail-closed；这是独立前置，不能把它伪装成“无 fallback”或静默跳过坏条目。

### 目标

让已由 Relay 开立且仍为当前 Attempt 的 Herdr 产品 Agent，在既有“当前 OS 用户本地 capability”授权边界内，提交一个**最小、Receipt 绑定、无自由文本**的结论；Relay 再由持 lease 的 driver 写入现有 `relay.result/v2` 并推进节点。DHR_35 据此才能分别验证 Codex 与 Claude Code 的 Windows 真实闭环。

### 非目标

- 不从 Herdr pane 文本、`done`、`idle`、进程退出或模型自然语言推断成功/失败。
- 不新增网络端口、跨主机授权、token 透传、账号切换、自动登录或凭据读取/写入。
- 不建设通用 Agent 输出上传、聊天归档或任意文件回传；首版不接收自由 `structured`、日志正文、绝对路径或环境内容。
- 不改变 registry 的全量 fail-closed 语义；不以测试局部 registry 冒充真实已冻结 Profile。
- Linux SSH 继续按 DHR-B-22 ① `延后/受限`，不进入本设计的真实烟测范围。

## 2. 冻结候选合同

### D1 · `relay.executor-result-submission/v1`

新增仅用于本机 executor→Relay 的请求对象：

```json
{
  "protocol": "relay.executor-result-submission/v1",
  "receipt_id": "<opaque current Attempt receipt id>",
  "outcome": "succeeded",
  "reason": null
}
```

- 字段闭集为 `protocol / receipt_id / outcome / reason`；`outcome` 只能是 `succeeded|failed`，`succeeded` 的 `reason=null`，`failed` 的 `reason` 固定为新协议码 `E_EXECUTOR_REPORTED_FAILURE`。不接受调用方自由挑选其他 reason code。
- 不接收 `run_id`、`node_id`、`attempt_id`、`executor_kind`、`finished_at`、`payload_digest`、自由 `structured`、log locator 或任何凭据/配置字段。它们全部由 Relay 从已持久 Receipt、当前 driver 上下文和服务端时钟生成，调用方无权覆盖。
- Relay 写入的 `relay.result/v2.structured` 固定为 `{ "source":"receipt-bound-submission/v1" }`；`payload_digest` 对 Receipt 绑定字段、outcome、reason、固定 structured 和 protocol 作 RFC 8785 JCS + SHA-256，`finished_at` 由持 lease 的 writer 取值但不参加 digest。这样同一参数的重投复用现有 `appendResult` 幂等，而冲突 outcome/reason 仍是终态冲突。
- Receipt ID 是运行关联能力，不是凭据；它可存在于私有 Run Store、受控 completion 指令和本机 RPC request，却永不明文写入公开配置、普通日志、截图或对外证明工件。DHR_35 证据只可使用截断/摘要后的 Receipt 关联符。既有 OS-user local capability 仍是调用端授权，Receipt 当前性仍是业务授权，二者都缺一不可。

### D1.1 · Result 原子提交与恢复

Receipt-bound Result 是对现有 Store 的耐久语义收紧，不可沿用“先 results 文件、后 event/state”的多步写：Result bridge 必须把 `results/<receipt_id>.json`、对应 `attempt_succeeded|attempt_failed` event 及重放后的 `state.json` 纳入既有 `relay.store-mutation/v1` prepared journal。staging blob、precondition/hash、fsync、prepared/recovery/committed 的顺序和 DHR_61 pause/retry 完全同源：

- Result file、event append 或 state 任一目标尚未到 staging hash 时，`openStore` 必须恢复补全；缺 journal/blob、摘要冲突或无法补全一律 `E_STORE_MUTATION_RECOVERY_FAILED`，不得返回“幂等成功”。
- 只有整笔 mutation committed 后才发布订阅通知、解析为 terminal 或回 RPC success。重投同一 D1 请求必须先得到已提交的同 digest Result；若只见 prepared，先恢复而非直接复用内存 map。
- `appendResult` 返回的 `{ok,idempotent,reason}` 是 driver 的必检 Ack：只有 `ok=true` 才能推进节点；`ok=false` 原样映射稳定拒绝且不得宣称 Agent 成功。

### D2 · 受控 RPC 与 CLI 路径

`relay.rpc/v1` 和所有既有方法、schema、capability hash 均冻结不变。`relay.rpc/v2` 增加方法 `submit-executor-result`，参数是 D1 对象，成功结果为：

```json
{
  "ok": true,
  "idempotent": false,
  "result": { "protocol": "relay.result/v2", "run_id": "...", "node_id": "...", "attempt_id": "...", "receipt_id": "...", "executor_kind": "herdr-agent", "outcome": "succeeded", "reason": null, "finished_at": "...", "structured": { "source": "receipt-bound-submission/v1" }, "log_locator": null, "payload_digest": "...", "quarantined": false }
}
```

正式 schema 以既有 `relay.result/v2` 为 result 字段唯一引用；上例所有 `...` 是该既有 schema 的 server-generated 值示意，不是开放字段或可由调用方提交的值。

该方法的唯一入口是现有 v2 endpoint：先走 descriptor/本地 capability/`contracts` 回证，再按同一 Run actor 的队列分派到 driver。新增 CLI `relay submit-result --receipt-id <id> --outcome succeeded|failed [--reason <code>]` 只是该 RPC 的薄客户端：

- CLI 只读取既有私有 local capability，缺失保持 `E_LOCAL_USER_UNAUTHORIZED`；不得显示 capability、Receipt 内容或用户配置。
- 参数解析为固定 argv，不经 shell 拼接；completion prompt 中仅可嵌入已校验的 Receipt ID 和枚举值。
- 未认证=`E_CLIENT_NOT_AUTHORIZED`、未知/非当前 Receipt=`E_IDENTITY_MISMATCH`、fenced=`E_ATTEMPT_FENCED`、相同参数重投=原 Result 的 `idempotent:true`、冲突终态=`E_TERMINAL_STATE_CONFLICT`、service/driver 恢复未就绪=`E_SERVICE_NOT_READY`；任何拒绝都不得落 Result、不得把 `done` 改成成功。

### D3 · driver 是唯一业务 writer 与推进者

service 不直接 `appendResult`，也不替 executor 判断任务质量。每个 active/recovery Herdr Attempt 由 workflow driver 注册一个 receipt-bound submission gate：

1. Herdr Attempt Receipt 新增 immutable `result_submission_mode:"receipt-bound/v1"`。开立并持久化此 Receipt 后，启动 Agent；启动成功才用已有 Herdr prompt 通道发送固定 completion 指令。指令要求 Agent 在完成已分配低风险任务后调用 `relay submit-result`；它不包含凭据、任务输出或任意命令片段。
2. `working` 继续产生现有 checkpoint；`blocked` 继续产生 Attention；`unknown` 继续走既有对账。`done` / `idle` 只让 driver 进入内存的 `awaiting_result` 接收期，绝不写 Result、绝不新增 Run/Node 状态枚举；持久 Run 投影仍只使用既有状态合同。
3. `herdr-agent` 的 `captureHerdrResult` / `herdrJudge`、pane 文本、terminal status、Agent 自述和 CLI exit code 均不得再直接调用 `recordResult` 或触发 quota/fallback；它们最多保留为观测/诊断。DHR_34 当前的 quota 信号原本来自 capture verdict；Receipt submission 首版没有 `quota_signal`，因此该模式下失败只写 `E_EXECUTOR_REPORTED_FAILURE`，绝不自动 fallback。恢复真实 quota source 是独立设计输入，不得借 bridge 偷接不受控 Agent 内容。
4. v2 handler 只把经回证的 D1 提交交给对应 driver gate。driver 以其 actor 的 `submitControl` 调 Store `appendResult`，逐项检查 Ack；只有 mutation committed 的 `ok=true`（含同 digest idempotent）才推进节点；同 Receipt 的并发提交序列化，不能出现两个终态。
5. Gate 的归属不在内存 map：service bootstrap 对每个非 terminal、当前 Receipt 标有 `result_submission_mode:"receipt-bound/v1"` 的 Run，先安全取得 actor/lease、从 Receipt+Store state 重建 receiver driver，再发布 ready descriptor。重建不会启动第二个 Agent、不会重新签发 Receipt；仅恢复接收/推进权。不能取 lease、Store 需恢复、Receipt 非当前、Run terminal 或没有已持久 mode 时一律不接收。driver normal completion 前不得从 service `drivers` map 删除该 receiver gate。
6. `done` 后在有界等待内仍无有效 D1 提交时，持久化既有 `human_input_requested`（reason=`E_EXECUTOR_RESULT_MISSING`），由既有回放得出 `waiting_human/needs_you`；它不是失败，也不触发 fallback。后续有效同 Receipt 提交仍可通过当前或重建的 gate 收口。`E_EXECUTOR_RESULT_MISSING` 与 `E_EXECUTOR_REPORTED_FAILURE` 必须同批登记进 reason-code 全集，并各有与 host-lost、observation-lost 和 terminal-conflict 的边界反例。
7. service/driver 重启后只按上款恢复 gate；旧 Receipt、fence、pause/retry、lease 丢失与 terminal Run 均沿既有拒绝面 fail-closed。driver 不存在或尚未恢复时，handler 返回 `E_SERVICE_NOT_READY` 而不自行开 Store 或代替 driver 写入。

### D4 · registry 前置的独立处置

本设计不放宽 `loadExecutorProfiles()`：任何已登记 profile 违反 schema、alias 或非敏感 config-fingerprint rule 时，registry 继续整体 fail-closed。

为恢复 DHR_35 的真实 Windows 前置，B-adjust 必须单列一个**配置维护卡**，仅允许：读取验证错误码、读取注册表中已允许的脱敏字段、核对两个指定 profile 的 command alias 与 nonsecret path-template 是否存在，并在用户已经授权的范围内修复**用户级 executor registry 的非敏感路径/元数据**。它不得读取配置内容、不得改写 Codex/Claude/Herdr 产品配置或凭据、不得登录，任何不可证路径继续阻塞真实启动。

## 3. 验收与反例

| ID | 命题 | 自动证据 |
|---|---|---|
| ER-A1 | 合法且当前 Receipt 的 D1 提交只能经 v2 回证、对应 driver actor 队列以可恢复 mutation 落一个 `relay.result/v2`；run/node/attempt/identity 均取自 Receipt，CLI 无 capability 输出。 | RPC/CLI/driver/Store 定向测试 + prepared 各阶段强杀恢复 + 敏感词扫描。 |
| ER-A2 | Herdr `done`/`idle` 无提交时只经过 driver 内存接收期，随后留下既有 `human_input_requested`/`E_EXECUTOR_RESULT_MISSING` 与 `waiting_human/needs_you`；不能成为 succeeded、failed 或 fallback 依据。 | 真 Herdr adapter fixture + driver 回归。 |
| ER-A3 | 未知、旧、fenced、暂停、非当前、终态冲突、未认证、重启中和 lease-lost 的提交均不改账；同参数重投只在 committed mutation 后得幂等回执。 | Store/RPC/恢复负例。 |
| ER-A4 | 真实 DSH-off Windows 路径中，Codex 和 Claude Code 各在独立低风险临时仓接收 completion 指令、执行最小任务并提交成功；每条有 Receipt→checkpoint→result→终态→CLI inspect/events/focus 脱敏实录。 | DHR_35 后续 E2E，非 fixture 替代。 |
| ER-A5 | 默认 registry 任一条目不合规则拒绝真实启动；修复后的两个指定 profile 重新验证通过且零凭据/配置正文进入工件。 | 维护卡定向校验及证据白名单审计。 |

反例：禁止把 Herdr terminal status、pane 文本、Agent 自述、`result` 文件存在或 CLI 退出码当作 D1 提交的替代；禁止保留任何 `herdrJudge/captureHerdrResult → recordResult` 直写支路；禁止让 service 为绕开 driver gate 而直接开 Store；禁止在 prepared result 上回成功或推进；禁止用测试 profile registry、任意 `structured` 内容或本地 capability 值作为真实身份/结果证据。

## 4. 正式输入与 B-adjust 影响（尚未生效）

整版确认后，原子更新现役正式输入：

1. `design/11-P6身份与额度治理契约调整.md`：补 D1 Receipt 对 Result ingress 的唯一来源、Receipt current/fence/retry 约束与 ER-A1~A5。
2. `design/08-DHR30-RPC与ReadModel合同.md`：冻结 v2 `submit-executor-result` 参数、结果、错误与 v1 不变性；正式列入两条新增 protocol reason code。
3. `design/07-DHR30-Runtime服务.md`：明确 service 只认证并路由 submission 到 driver，不取得 executor 业务裁决或额外 Store writer 身份；bootstrap 必须恢复 Receipt gate 后才 ready。

B-adjust 随后拟新增两张前置卡，编号当次唯一发放：

- **Registry 维护卡**：上述 D4 的最小非敏感 registry 修复/复验；独立 worktree，用户级 registry 是唯一仓外变更面。
- **Result bridge 卡**：D1~D3 的 contracts、v2 RPC、CLI、service/driver、Herdr completion prompt 与定向回归；预计 heavy，因为触及协议、认证边界、Runtime 接线与 Store 终态语义。

DHR_35 保持进行中但被两张前置卡阻塞；它在两卡已收口、用户另行 D-start 后只跑 Windows 两条真实实录。Linux 不因本设计自动恢复。

本协议不引入 Linux 专用命令、feature gate 或环境动作；若后续同一 v2 RPC/CLI 在 Linux UDS 上可达，仍须另行真实验证，不能从 Windows 结论外推。**本次不声称 Linux 已验证、也不触发 SSH/环境动作**；DHR_35 仅以 Windows 为真实验收环境，Linux 继续 B-22 `延后/受限`。

## 5. 待确认的整版理解

请在正式晋级前确认这五点是否完整表达了你的决定：

1. Herdr `done` 永远只是 `awaiting_result` 观测，不能直接成功。
2. 结果由同一 OS-user 本机授权下、携带当前 Receipt 的固定结构提交；Relay 补齐身份与时间。
3. 首版只允许结论，不允许 Agent 上传自由文本、日志或文件内容。
4. registry 坏条目继续 fail-closed，必须独立修复/复验，不能为 DHR_35 放宽。
5. DHR_35 在前置维护与 bridge 卡完成前不启动真实 Agent；Linux 仍延后。
