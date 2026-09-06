<!-- dh:planning-event:v1 id=DHR-A-29 stage=A-full artifact=design/14-Herdr-host-ref正式冻结与DSH-off可验证展示.md review=evidence/40-A29-host-ref-交叉审核记录.md#review-a29 understanding=evidence/40-A29-host-ref-交叉审核记录.md#understanding-a29 -->
# Herdr `host_ref` 正式冻结与 DSH-off 可验证展示

> 状态：`DHR-A-29` 已完成 fresh 审核、理解对齐与用户整版确认。本文件是 `design/README.md` `designInputs[]` 的正式输入；它冻结 host-observation 边界，不授权 B-adjust、任务卡、工作区、代码、真实 Agent、凭据读取/写入、verify、合并、推送或部署。
>
> 本文件在 Herdr host-observation 范围内补充 `design/06`、`design/07`、`design/08` 与 `design/12`；未提及的 Result、Receipt、lease、fencing、Profile、fallback 与 Linux 合同保持不变。

## 1. 目标、范围与冻结决定

### 目标

DSH 关闭时，Relay CLI 必须能够展示“当前这条 Herdr 观测关联的是哪个安全 Herdr 会话”。它不能以 agent 名、pane 文本或诊断 `detail` 充当该身份，也不得泄露路径、账号、凭据、Receipt 或 Result 提交能力。

### 冻结决定

1. `host_ref` 是被 `host_observation_changed` 关联的 Herdr 会话的非敏感符号引用；推荐形状为 `herdr-session/<不可逆短摘要>`。它不是 pane 名、Windows 路径、Agent 显示名、executor profile、Receipt、Result 或凭据。
2. 每个 `host_observation_changed` 必须有非空 `host_ref`。`observation_lost` 的值代表最后一次成功关联的会话；CLI 必须显示为历史观测，不得称其仍存活。
3. 同一 Herdr 会话的普通轮询和 driver 重启后的成功恢复保持同一 `host_ref`；只有会话被重建、替换或重新附着到不同会话时才生成新 ref。旧事件保留旧 ref，不回写历史。
4. `executor_ref` 继续只作 driver 对 Herdr 查询、恢复和连接重建的内部 locator。恢复成功时沿用已持久的 `host_ref`；恢复到不同会话时生成新值。不得从 `detail` 解析 `host_ref`，也不得用 `host_ref` 调用 Herdr。
5. `host_ref` 只描述宿主观测，只进入观测事件和由其只读派生的 CLI/read-model 展示；不得推导或改变 Result、run_status、Attention、lease、fencing、Executor Profile、账号或 fallback。

### 兼容边界

`relay.event/v2` 的封闭字段集新增 `host_ref`，并针对 `host_observation_changed` 要求非空；能力/descriptor 指纹同批更新。旧账本缺字段时只回放“未提供 host_ref”的历史事实，不伪造标签；旧 capability 客户端必须在握手或 descriptor 校验处显式拒绝或要求刷新，禁止静默接受新事件。原 v0 `relay.host-observation/v1` shape 同批晋级为正式字段镜像，以冻结 schema 为准。

### 非目标

- 不读写用户 registry、凭据或账号；不启动真实 Agent。
- 不补 Linux SSH、P6-X、DHR35 的既有实录或 DHR73 的启动停摆调查。
- 不改变 Result/Receipt 协议、lease/fencing、Profile、fallback 或任务状态推导。

## 2. 验收清单

| ID | 类型 | 命题 | 自动证据 / 人判动作 |
|---|---|---|---|
| HR-A1 | 机器证 | 正式 schema/descriptor 定义 `host_ref` 的非敏感符号格式；路径、pane/agent 原文、Receipt 形态、缺字段均被拒绝。 | schema/contract 负例与 capability 回归。 |
| HR-A2 | 机器证 | 启动、lost、同会话 driver 恢复、不同会话重附着的事件账符合语义：同会话保留 ref，不同会话换 ref，旧 ref 保留历史。 | Herdr fixture 事件账测试；错误复用旧 ref、恢复拿展示标签查询两种变异均须变红。 |
| HR-A3 | 机器证 | DSH-off CLI/read-model 展示最新 ref，并把 lost 显示为历史；同一安全标签可由事件账与受控 Herdr 对照面核对。 | CLI/read-model 定向测试与低风险 DSH-off 演示。 |
| HR-A4 | 机器证 | `host_ref` 不改变 Result、run_status、Attention、lease、fencing、Profile 或 fallback。 | 负例/变异与既有 Receipt-bound、lease、状态回归。 |
| HR-A5 | 机器证 | 新 capability 客户端接受带 ref 的事件；旧 capability 客户端显式拒绝/刷新；旧账本回放不伪造 ref。 | descriptor/handshake 与新旧账本双读回归。 |
| HR-H1 | 人判 | 用户查看 DSH-off CLI 与受控 Herdr 对照面展示的同一脱敏标签，判断能否定位会话且不泄露信息。 | AI 展示终端/截图证据；用户在对话中判断。 |

## 3. 失败处理与退场

- 不能证明摘要不泄露原始会话身份，或不能维持兼容边界时，停止实施并回到新的设计调整；不得降级为 `detail` 文本。
- 测试 fixture、临时 Run 和截图仅保存脱敏材料；实施卡在收口时按项目证据保留规则处理。
- 真实验证不可得时如实记未验证；不得用 DHR35 现有 `executor_ref` 或 pane 文本冒充 `host_ref`。
