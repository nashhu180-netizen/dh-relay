<!-- dh:planning-no-event:v1 artifact="design/evidence/52-A34-instruction-ref执行语义-交叉审核记录.md" reason="DHR-A-34 共创草案的 fresh review、裁决与用户问答记录；正式设计确认前不生效" -->
# DHR-A-34 · `instruction_ref` 执行语义交叉审核记录

## 需求理解

<a id="需求理解"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-34 artifact=design/15-Herdr-Agent单一启动内容与有限重发.md kind=understanding -->

- 2026-09-08 用户原话“授权”：启动标准档维护卡的立项/修复链，不代替设计、B-adjust、D-start 或真实 Agent 的后续独立闸。
- 用户随后原话“按你的建议”：选择“保留指针、正文不复制；统一 sender 明确命令先打开并执行”。

## review-a34 · fresh 只读审核

<a id="review-a34--fresh-只读审核"></a>
<!-- dh:planning-evidence:v1 event=DHR-A-34 artifact=design/15-Herdr-Agent单一启动内容与有限重发.md kind=review -->

- reviewer：`/root/a34_review`，fresh-context、未参与起草。
- 基线：`master@8e1e19ed8c74db74bc785fc77380aaaea25b704d`；前后 HEAD 相同，状态均仅候选稿未跟踪；未写文件、未运行真实 Agent、未读取用户配置或凭据。
- 独立核查：正式 design/15、`startup-dispatch.mjs`、DHR_78 专项测试，以及 `wt/DHR_35` 的 F-3529/E-3573。

### 方案问题

| ID | 级别 | finding | 主控裁决 |
|---|---|---|---|
| A34-R1 | P1 | “只有已实际尝试业务任务才可 failed”与“指针打不开也 failed”自相矛盾。 | 采纳：failed 明确覆盖业务执行失败或指针交付失败；不新增错误码/状态。 |
| A34-R2 | P1 | sender 无法观察业务副作用，A15 若要求成功前强制观察会隐含扩到 Result/执行层。 | 采纳：A15 只验包络；具体 wrapper side effect 先于 succeeded 的证明移到 DHR_35/A16。 |
| A34-R3 | P2 | 退场只写 committed Result，漏掉零 Result 的 `waiting_human` 形态。 | 采纳：分 committed Result 与 Result 缺失两支保存脱敏事实，均不通过 P6-M1。 |

### 用户理解风险

| ID | 级别 | finding | 主控裁决 |
|---|---|---|---|
| A34-U1 | P1 | “task side effect”无具体对象，可能退化为 Agent 自述。 | 采纳：DHR_35 冻结现有 wrapper safe stage 的 `wrapper_invoked=true`，并要求早于 succeeded Ack。 |
| A34-U2 | P2 | 未逐字保留“授权”“按你的建议”，易被误读为后续闸已授权。 | 采纳：草案和本记录逐字登记，并明确只确认需求取舍。 |

### 需要用户决定的问题

1. `failed/E_EXECUTOR_REPORTED_FAILURE` 是否包含“无法读取/使用 instruction_ref”的交付失败？reviewer 与主控建议：是，保持现有错误码。
2. task side effect 先于 succeeded 是 Runtime 强制门，还是 DHR_35 真实闭环验收证据？reviewer 与主控建议：后者，避免扩大 DHR_81。

## 主控修订状态

- A34-R1/R2/R3/U1/U2 已全部写入候选 v2。
- 用户决定 1：2026-09-08 明文“是”——`failed/E_EXECUTOR_REPORTED_FAILURE` 包含无法读取/使用 `instruction_ref` 的交付失败；保持现有错误码，证据区分交付失败与业务执行失败。与候选 v2 一致，无须定向复审。
- 用户决定 2：2026-09-08 明文“采用”——task side effect 先于 succeeded 只作 DHR_35 真实闭环验收证据，不扩成 Runtime 强制门。与候选 v2 及 reviewer/主控建议一致，无须定向复审。
- 设计整版确认：2026-09-08 用户明文“确认”；只授权 DHR-A-34 正式晋级，不授权 B-adjust、DHR_81 D-start、DHR_35 新实跑或其它闸。
- 正式晋级落点：`design/15-Herdr-Agent单一启动内容与有限重发.md`，planning event=`DHR-A-34`。
