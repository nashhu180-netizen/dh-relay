# DHR-A-29 · Herdr `host_ref` 正式冻结与 DSH-off 可验证展示（共创草案 · 未生效）

> 本文只用于 A-full 讨论和独立审核；不在 `design/README.md` 的正式输入白名单中，不能拆计划、不能授权代码或工作区。

## 1. 目标、已知事实与核心决定

### 人话目标

DSH 关闭时，Relay CLI 必须能说明“当前这条 Herdr 观测关联的是哪个安全的 Herdr 会话”，而不是只显示 agent 名、pane 文本或诊断 `detail`。该标签让操作者核对 CLI 所见与实际 Herdr 会话是否对应，但不携带路径、账号、凭据或可用于提交 Result 的能力。

### 已知事实

- `relay.host-observation/v1` 目前只是 v0 shape，虽预留 `host_ref`，却未被冻结为承重契约。
- `relay.event/v2` 的 `host_observation_changed` 实际写入 `executor_ref` 与 `detail`，没有独立 `host_ref` 字段；`additionalProperties: false` 意味着补字段是契约变更，不是证据文案修订。
- DHR35 的新实录已补 P6-M1，但正确 `host_ref` 仍未证，故 P6-M5 保持未通过。

### 拟冻结决定

1. `host_ref` 是**被当前观测关联的 Herdr 会话**的非敏感符号引用；不是 pane 名、Windows 路径、Agent 显示名、executor profile、Receipt、Result 或任何凭据。
2. 每个 `host_observation_changed` 必须有 `host_ref`。`observation_lost` 中的值表示“最后一次成功关联的会话”，CLI 必须标为历史观测，不能声称会话仍存活。
3. 同一 Herdr 会话的普通轮询和 driver 重启后的成功恢复**保留**原 `host_ref`；只有 Herdr 会话被重建、替换或重新附着到不同会话时才产生新值。旧事件保留原值，只作为历史账本，不覆盖或改写。
4. 推荐格式为固定前缀加不可逆的短摘要，例如 `herdr-session/<digest>`；摘要输入来自 Herdr 会话身份，且实现须通过测试证明它不等于原始 agent 名、pane 文本、绝对路径或 Receipt。CLI 与受控 Herdr 对照面展示同一安全标签，操作者只比较两端标签是否相同，不需要看原始会话名称。
5. `host_ref` 只进入观测事件与由其只读派生的 CLI/read-model 展示；它**不得**驱动或修改 Result、run_status、Attention、lease、fencing、Executor Profile 或账号/fallback 决策。

### 恢复责任边界

`executor_ref` 继续是 driver 对 Herdr 查询、恢复和重建连接的内部 locator；`host_ref` 仅是持久、可展示的观测标签。恢复逻辑先用既有 `executor_ref` 查询同一会话：成功则原样带回既有 `host_ref`，失败后新建/附着到不同会话才生成新值。任何实现不得从 `detail` 解析 `host_ref`，也不得反过来用 `host_ref` 发起 Herdr 操作。

## 2. 契约、兼容与范围

实施固定采用以下兼容路径：将 `host_ref` 纳入 `relay.event/v2` 的正式字段集，并对 `host_observation_changed` 要求非空；同时更新 capability/descriptor 指纹。旧账本缺该字段时只回放为“未提供 host_ref”的历史事实，不伪造标签；携带旧 capability 的客户端必须在握手/descriptor 校验处被拒绝或要求刷新，不能静默接受新事件。v0 shape 同批晋级为正式字段定义的镜像，字段语义只以冻结 schema 为准。

不做：用户 registry/凭据读取或写入、真实 Agent 启动、Linux SSH、P6-X、DHR35 的证据重跑、Result/Receipt 协议或 lease/fencing 语义改动。DHR35 继续仅消费新能力取证，不承接本次生产改动。

## 3. 验收清单

| ID | 类型 | 命题 | 自动证据 / 人判动作 |
|---|---|---|---|
| HR-A1 | 机器证 | 正式 schema/descriptor 明确定义 `host_ref`，只允许非敏感符号格式；非法路径、pane/agent 原文、Receipt 形态及缺字段均被拒绝。 | schema/contract 反例与 capability/compatibility 回归。 |
| HR-A2 | 机器证 | 启动、观测丢失、同会话 driver 恢复、不同会话重附着各自产生符合语义的观测账：同会话保持 ref，不同会话换 ref，旧 ref 留在历史事件。 | Herdr fixture 定向事件账测试，含“错误复用旧 ref”与“恢复拿展示标签查询”两类变异必须变红。 |
| HR-A3 | 机器证 | DSH-off CLI/read-model 展示最新观测 ref，并把 lost 显示为历史；展示值可由同一事件账及受控 Herdr 对照面的安全标签复核。 | CLI/read-model 定向测试与一条低风险 DSH-off 真实/等价演示。 |
| HR-A4 | 机器证 | `host_ref` 不可改变 Result、run_status、Attention、lease、fencing、Profile 或 fallback。 | 负例/变异测试与既有 Receipt-bound、lease 及状态回归。 |
| HR-A5 | 机器证 | 新 capability 的客户端接受带 ref 的事件；旧 capability 客户端被显式拒绝/要求刷新；旧账本回放不伪造 ref。 | descriptor/handshake 与新旧账本双读回归。 |
| HR-H1 | 人判 | 用户查看一份 DSH-off CLI 展示与对应 Herdr 会话的脱敏对照，判断标签是否足以定位会话而不泄露信息。 | AI 展示截图/终端证据，用户在对话中判断。 |

## 4. 后续拆卡建议（尚未生效）

若本草案通过 A-full，B-adjust 新增一张标准档、`task_type=heavy` 的实施卡：范围预计包括正式 contracts/descriptor、Herdr driver 的观测写入、CLI/read-model 投影、精确测试与该卡工作区；不把 DHR35、registry、Linux/P6-X 或 DHR73 的启动诊断塞入该卡。实施卡须另行 D-start。

## 5. 失败处理与退场

- 不能证明摘要不泄露原始会话身份，或无法保持客户端兼容时，停止在设计/候选，不降级为 `detail` 文本。
- 新增的测试 fixture、临时 run 和截图仅保存脱敏材料；由实施卡的收口按项目证据保留规则处理，不在本草案执行删除。
- 真实验证无法取得时，如实记“未验证”；不得用 DHR35 的现有 `executor_ref` 或 pane 文本冒充 `host_ref`。
