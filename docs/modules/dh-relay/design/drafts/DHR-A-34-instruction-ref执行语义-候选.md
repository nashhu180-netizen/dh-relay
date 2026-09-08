<!-- dh:planning-no-event:v1 artifact="design/drafts/DHR-A-34-instruction-ref执行语义-候选.md" reason="DHR-A-34 A-full 共创草案，未生效；等待 fresh review 与用户整版确认" -->
# DHR-A-34 · `instruction_ref` 执行语义（共创草案 · 未生效）

## 1. 人话目标与已确认取舍

用户原话“授权”启动本候选链，随后以“按你的建议”选择：**保留指针、正文不复制；统一 sender 的固定包络明确命令 Agent 先打开并执行 `instruction_ref` 指向的任务文件。** 两句话只确认需求取舍，不构成设计整版确认、B-adjust 确认、DHR_81/DHR_35 D-start 或新的真实 Agent 授权。

本次只修“任务指针如何被 Agent 消费”的最小语义，不恢复 A31/A32 的 timeline、cursor、跨重启 prompt 重建或事务设计，也不改变 A33 的单一 sender、60 秒最多补发一次、恢复不自动重发、发送前持久占次与人工处理边界。

## 2. 事实与问题

- DHR_78 已实现并收口：Run node 持有 `{path,sha256}`，Runtime 在 Attempt/Herdr 前验证仓根内路径与摘要，Host Adapter 是唯一物理 sender。
- DHR_35 `wt/DHR_35@ee31082` 的真实 Codex 证据显示：`startup_dispatch_outcome=accepted`、`send_count=1`、外围 prompt=0、host_ref 精确匹配、46 条 checkpoint；但任务文件指定 wrapper 的 `wrapper_invoked=false`，Agent 最终提交 committed `failed/E_EXECUTOR_REPORTED_FAILURE`。
- 现有固定包络只列“任务指针：path (sha256:...)”和 Result 提交命令，没有明确动词要求 Agent 打开并执行该文件。现有证据不能区分 Agent 未打开文件与打开后未执行；本设计只修可直接观察到的契约缺口，不伪造模型内因。

## 3. 最小合同调整

### 3.1 启动包络

在现有仓根与任务指针行后加入固定、无业务义的执行顺序：

1. **先打开任务指针文件，并把文件正文作为本 Attempt 的唯一业务任务。**
2. **严格执行该文件；启动包络中的 Receipt 命令只规定结果提交方式，不是业务任务。**
3. **任务实际完成才提交 `succeeded`；业务任务执行失败，或 `instruction_ref` 无法读取/使用，均按既有 `failed/E_EXECUTOR_REPORTED_FAILURE` 报告交付失败。**
4. **若不能打开或不能确定已读取该文件，不执行其它任务、不提交成功。**

正文仍只存在于 `instruction_ref` 文件，不嵌入 prompt，不新增字段、公开协议、错误码或状态枚举。Runtime 已在发送前校验摘要；Agent 侧不要求重新计算 SHA-256，避免把壳层验证伪装成安全边界。

### 3.2 不变边界

- 单一 Host Adapter sender；外围 runner prompt=0。
- 首发 accepted 后 60 秒无 Store 进展最多原样补发一次；永无第三发。
- 发送前持久占次；重启、接管、发送结果不明与占次后调用前崩溃仍 fail closed，不自动补发。
- Result 只由 Receipt-bound committed Ack 推进；pane、checkpoint、Agent 自述或退出码不能替代。
- 不改用户 registry、凭据、Herdr 产品、checkpoint/Result 事务、公开 event/RPC/read-model。

## 4. 验收清单

### AI 自动验收栏

| ID | 命题与验证 |
|---|---|
| HC-SD-A13 | 启动包络明确规定“打开指针 → 执行文件任务 → 按实际结果提交”的顺序，并明确 Receipt 命令不是业务任务；快照断言验证完整文本与顺序。 |
| HC-SD-A14 | 任务正文仍不进入启动 prompt、发送记录、公开协议或证据；指针缺失/越界/摘要变化继续在 Attempt/Agent 前拒绝，敏感形态扫描为 0。 |
| HC-SD-A15 | fake 正反例证明唯一 sender 发送同一包络、外围调用为 0、正文不复制；既有 A10/A11/A12 回归保持自然终态绿色。本项不声称 sender 能观察或强制业务副作用。 |
| HC-SD-A16 | DHR_35 在修复后的同一 committed SHA 上分别用真实 Codex 与 Claude Profile 完成 task-file 读取/执行、checkpoint、Receipt submission、committed succeeded Ack、Result 与 `attempt_succeeded`；每条实录以 wrapper 的现有安全 stage 字段作为具体 task side effect，证明 `wrapper_invoked=true` 早于 succeeded Ack，不接受 Agent 自述或通用账本成功替代；只保留脱敏证据。 |

### 人类验收栏

| ID | AI/用户动作 → 展示 → 用户判断 |
|---|---|
| HC-SD-H4 | AI 展示 DHR_35 修改前 Codex committed failure 与修改后 Codex/Claude committed success 的安全对照，列出实际发送次数、外围 prompt 数、task side effect、Ack/Result 和失败处置；用户判断“指针不复制正文”的日常行为是否清楚、够简单。 |

## 5. 实现与计划影响

- 正式设计若获确认，只在现有 `design/15` 上做 A34 版本增量；保留 A33 形成史与已完成证据，不把 DHR_78 历史结论改写为“当时已通过真实 Agent”。
- B-adjust 应新增一张标准/heavy 维护卡（候选编号 DHR_81），仅拥有固定包络生成与相应专项/受影响测试；DHR_35 增加 `blocked-by:DHR_81`，维护卡完成后仍须 DHR_35 自己在同一新基线重跑真实 Codex/Claude。
- 预计生产落点仅 `relay-core/runtime/startup-dispatch.mjs`；测试落点优先 `relay-core/test/dhr78-startup-dispatch.test.mjs`。如施工前发现需其它路径，必须在 B/D 阶段列精确理由，不以本草案预授权。

## 6. 退场与故障发现

- 本调整不新增持久化产物；继续使用现有 `instruction_ref` 文件与私有 `startup-dispatch.json`，跟随 Run 既有保留/删除策略。
- 静态/fixture 绿但真实 Agent 仍未执行任务时，DHR_35 若取得 committed Result 则保存脱敏 Result；若没有 Result，则保存脱敏 Attempt/账本状态与 Result 缺失事实。两种情况均保存 task-side-effect 缺失证据、保持 P6-M1 不通过；不得以 prompt accepted、checkpoint 或模型自述替代。
- 若真实 Codex/Claude 对同一包络表现分歧，先如实登记 Profile 差异，不加产品专属 prompt 分支；新分支须另走设计确认。

## 7. 当前审核状态

- 需求理解对齐：2026-09-08 用户原话“按你的建议”，即保留指针、正文不复制、明确命令先打开并执行；只确认取舍，不授权后续闸。
- fresh review：`/root/a34_review` 在 `master@8e1e19e` 只读审核，P1×2、P2/理解风险×3，主控全部采纳并修订；见 `design/evidence/52-A34-instruction-ref执行语义-交叉审核记录.md`。
- 正式设计：未确认、未生效。
