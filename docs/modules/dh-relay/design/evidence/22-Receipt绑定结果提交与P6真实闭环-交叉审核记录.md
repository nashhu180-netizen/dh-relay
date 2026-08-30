# Receipt 绑定结果提交与 P6 真实闭环：交叉审核记录

> 事件：`DHR-A-26`（A-full）。正式输入：[design/12](../12-Receipt绑定结果提交与P6真实闭环-契约调整.md)。本记录保存审核、理解对齐与整版确认；不授权 B-adjust、代码、用户级配置写入、真实 Agent、verify、推送或部署。

## 1. 需求理解对齐

- 用户确认的语义：Result 必须经 Receipt 绑定的结构化提交进入 Relay；Herdr `done` 只是一项观测，不能直接代表成功。
- 主会话将它收窄为：固定字段、服务端生成 Result、无自由 structured/log 上传、已有 OS-user capability 与 current Receipt 双层授权。
- Registry 的 `E_UNRESOLVED_CONFIG` 继续独立 fail-closed；Linux SSH 继续 B-22 `延后/受限`，没有把 fixture 当真实 SSH 证据。

<a id="review-a26"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-26 artifact=design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md kind=review -->
## 2. fresh-context 审核

审核实例：`/root/a26_fresh_review`；只读，未参与候选起草，未编辑文件、未启动 Herdr/Agent、未读取或改写用户级配置。

首轮结论：`changes-requested`，P0=0、P1=6、P2=2。六项 P1 为：Result 多文件写入非原子、gate 无耐久归属/重启恢复、Herdr done 存在直写 Result 路径、driver 未检查 Store Ack、固定 structured 与 quota/fallback 信号冲突、旧 capture 的自由 structured 仍可能入账。

## 3. 主会话裁决与候选修订

全部 P1 采纳并写入候选：

1. D1.1 将 result/event/state 统一纳入 `relay.store-mutation/v1`，prepared 必须恢复后才可成功或幂等。
2. immutable Attempt Receipt 新增 `result_submission_mode:"receipt-bound/v1"`，service bootstrap 重建 receiver driver gate；未恢复仅回 `E_SERVICE_NOT_READY`。
3. 封禁全部 `herdrJudge/captureHerdrResult → recordResult` 及自动 quota/fallback 支路；首版失败固定为 `E_EXECUTOR_REPORTED_FAILURE`，恢复可信 quota source 必须另走设计。
4. driver 对 `appendResult` Ack 必检，只有 committed `ok=true` 或同 digest 幂等才能推进。
5. bridge 输入与 Result structured 固定，DHR_35 证据仅记录 Receipt 摘要/截断关联符；不接收自由文本或日志。
6. `awaiting_result` 只为 driver 内存接收期；超时使用既有 `human_input_requested → waiting_human/needs_you`，新增 `E_EXECUTOR_RESULT_MISSING` 入 reason-code 全集。

## 4. 窄复核

同一独立审核人只复核上述六项，结论 `approved`：P0=0、P1=0。其 P2 已在候选中进一步收紧：v2 成功 result 明确引用现有 `relay.result/v2`；Receipt 明文禁令限定为公开/对外证据；Linux 不引入专用 gate 或环境动作，仍不得把 Windows 结论外推为 Linux 已验证。

结论：候选可进入用户整版确认。

<a id="understanding-a26"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-26 artifact=design/12-Receipt绑定结果提交与P6真实闭环-契约调整.md kind=understanding -->
## 5. 理解问题与整版确认

- 理解问题：当 Herdr 显示 `done` 但 Agent 没有提交 Receipt-bound Result，是否应保持“等待人工处理”，而非自动失败或 fallback？
- 用户回答：`是的`。据此冻结 `human_input_requested:E_EXECUTOR_RESULT_MISSING → waiting_human/needs_you`，并明确不自动失败或 fallback。
- 整版确认：用户对 A-26 整版晋升正式输入明确回答 `是的`。本确认授权将候选原子晋升为 `design/12`、更新 `designInputs[]` 并继续起草 B-adjust；不授权 B-adjust 定稿、任何卡 D-start、真实 Agent、Registry 写入、verify、推送或部署。
