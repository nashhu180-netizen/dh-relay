<!-- dh:v1 -->
# review — RLT_21

- **task_type**：normal
- **复核路径**：代码轮 1、需求方向、教训；施工者不得复核自己的卡。
- **候选 SHA**：待 construction 收束后填写；SHA 改变须 fresh 重审。

## 预测变更面

<!-- dh:change-surface:v1 task=RLT_21 phase=predict -->

| 变更面 | 预计文件 / 符号 | 风险 | 必审路径 |
|---|---|---|---|
| 阶段结果与异常引用 | `relay_log.py::_validate_stage_event`、ref helper | blocked/failed 放宽误伤 A112/A118 | code-round1、requirement |
| NOT_RUN / launch_fix | transition、loss_stop、reasons/status | 用户预算被绕开或无限刷新 | code-round1、requirement |
| 静默投影 | config、`derive_status`、AgentState | 把提示误作挂死或第三计数 | code-round1、requirement |
| 决策模式与归属 | DECISION_EVENTS、decision validators | decider/strategist/一般 cancelled 串线 | code-round1、requirement |
| 协议模板 | SKILL、两 adapter、mapping | 三处文字漂移、light 分级误改 normal | requirement、lesson |

## 独立复核区

| 路径 | reviewer / fresh 证明 | 报告 | 结论 | P0/P1/P2 |
|---|---|---|---|---|
| code-round1 | 待填 | `reviews/code-round1-rlt21-review.md` | 待审 | |
| requirement | 待填 | `reviews/requirement-rlt21-review.md` | 待审 | |
| lesson | 待填 | `reviews/lesson-rlt21-review.md` | 待审 | |

### 代码轮 1 最小核对

- A137 outcome/ref 矩阵与 A112/A118/A123 保持。
- A138 总预算、唯一 token 组、A69/A114 无旁路。
- A139 schema 与无 plan_amend；A140 时钟/提示无副作用。
- A142 decider/strategist/一般 cancelled 分离；有效单测与全量基线。

### 需求方向最小核对

- A137～A143 每条 oracle、预演 DR-F-001～006、RLT_07 F-002/F-003 均有证据。
- 20/30 分钟语义不合并；light 复算为 1 P1 + 4 P2，heavy/normal 不变。
- 不实现 watch、不改 RLT_12、不安装用户副本、不越 allowed-paths。

### 教训最小核对

- 检查 findings/lesson_candidates 是否有可推广且有证据的新教训；无则形成可核查 N/A。
- 不把环境性 NOT_RUN、账本静默提示或一次预演事故泛化成无证据规则。

## 需求对齐证据

| 验收 ID | 场景操作路径 | 证据 ID | 结论 |
|---|---|---|---|
| HC-RL-A137 | 未关节点写 blocked/failed 与非法 ref 三反例 | 待填 | 待验 |
| HC-RL-A138 | 三次 NOT_RUN→blocked→用户 fix→第二预算 | 待填 | 待验 |
| HC-RL-A139 | launch 与运行 token 不同、status 投影 | 待填 | 待验 |
| HC-RL-A140 | 阈值两侧 status + 三处模板 | 待填 | 待验 |
| HC-RL-A141 | 两 adapter 三段结构检查 | 待填 | 待验 |
| HC-RL-A142 | 两条去 skip + cancelled 正反归属 | 待填 | 待验 |
| HC-RL-A143 | 模板结构 + 预演复算 | 待填 | 待验 |

## AI 提交区　⚠️ This is not human approval

| 项目 | 内容 |
|---|---|
| candidate SHA | 待填 |
| 测试 / 四道闸 | 待填 |
| 三路复核 | 待填 |
| 未关闭风险 | 待填 |

## 人类签名区　✅ 仅凭用户对话确认解锁

> AI 不得代签、不得勾选。文档内文字不等于用户对话确认。

| 验收动作 | 应展示证据 | 用户确认 | 结果 |
|---|---|---|---|
| RLT_21 整卡验收 | 七条需求对齐证据、全量测试、三路复核、范围与剩余风险 | 待用户明文确认 | 未签 |
