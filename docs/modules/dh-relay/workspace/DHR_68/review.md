<!-- dh:v1 -->
# DHR_68 · Review

## 独立复核区

本卡任务类型为 **heavy**。施工者不得复核自己的卡；代码轮 1、代码轮 2、需求、教训、一致性五路均由未参与施工的独立实例完成，第二轮复核实例负责选择并登记有效变异点。

**第一轮（fresh 独立复核）**

| 复核者 | 范围 | 发现 | 结论 | 派出证据 |
|---|---|---|---|---|
| 待派出 | | | | |

**第二轮（fresh-context 独立复核，未继承第一轮会话）**

| 复核者 | 范围 | 发现 | 结论 | 派出证据 |
|---|---|---|---|---|
| 待派出 | | | | |

**需求复核结论**：待派出
**教训复核结论**：待派出

## 第 4 路·一致性复核

<!-- dh:consistency-review:v1 task=DHR_68 -->

| 比对对象 | 同类路径 | 定义是否一致 | 裁决 | 派出证据 |
|---|---|---|---|---|
| 待派出 | | | | |

## 有效单测·变异点登记

| 变异点 | 语义破坏 | 指定者 | 红测证据 | 还原绿测 | 结论 |
|---|---|---|---|---|---|
| 待第二轮复核实例选点 | | | | | |

## AI 提交区

### 需求对齐证据

| 需求 / 人验项 | 场景与操作路径 | 证据 | 结论 |
|---|---|---|---|
| design/06 H1/H5 的启动期人工暂停 | fake 正负例驱动 driver，核对 blocked 场景的事件序列、Attention 条数与 completion instruction 时序 | 待挂 | 待定 |
| P6-RI-A4 的**启动前置**（不含 A4 本身） | 真实 herdr 逐命令形态对照 + fake 校正后的 Codex/Claude 启动序列 | 待挂 | 待定 |

### 完成条件逐条挂证据

| # | 完成条件 | 谁验 | 证据 | 达成? |
|---|---|---|---|---|
| A | 启动专用超时默认 60 秒且不暴露配置面；其余 CLI 命令仍 10 秒、超时语义不变；以 DHR_35 已有 29482 ms 真实样本形态证明该启动能完成；fake 覆盖"超时后 agent 存在/不存在"两支，前者走既有 handle 路径、后者才关同一 pane；不声称覆盖任意未来启动。 | machine | 待挂 | 待定 |
| B | `paneRun` 不再期待 JSON；以对齐真实形态（exit 0 + 空 stdout）的 fixture 证明 Claude 仍走 `pane run → 唯一识别 → rename → 交既有 Attempt`，且 Codex `agent start` 的 argv 与返回处理不变。 | machine | 待挂 | 待定 |
| C | 启动期 `blocked`（含 `agent_not_ready`）时 adapter 返回 handle、不关 pane、不额外创建 Attempt/Result；driver 不发 completion instruction，恰好写一次带 blocked 观测的 `waiting_human` + `human_input_requested`，不写 `E_EXECUTOR_HOST_LOST`。 | machine | 待挂 | 待定 |
| D | fake-herdr 中被本卡触及的每个命令返回形态与真实 herdr 一致，并留下逐命令真实输出对照证据（exit code + stdout 是否 JSON）。 | machine | 待挂 | 待定 |

### 验收项元数据表

| 命题 | 事实证明方式 | 最终裁决者 | 稳定 ID | 覆盖态 | 等价判据 | 实际执行结果 | 版本环境 | 独立 oracle | 未覆盖边界 | contractVersion | arbiterCapability | arbiterAuthorization |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Herdr adapter/driver 在真实宿主形态下正确接线启动：给足时限、超时先对账、`pane run` 不解 JSON、启动期 blocked 转一次人工暂停 | 真实 herdr 逐命令形态对照 + fake 正负例的调用账本 + driver 事件序列断言 + 第二轮指定 mutation | machine | DHR_68-A/B/C/D | 待定 | 启动上限=60000 且其余动词=10000；超时对账命中不关 pane 且 `agentStart` 调用恰好 1 次、未命中关闭 ID = 创建 ID；Claude 在 `paneRun` 返回空串时仍完成 rename 并返回 handle；blocked 时 `human_input_requested` 恰 1 条且 detail 含 `herdr_status=blocked`、无 `E_EXECUTOR_HOST_LOST`、指令时序正确；fake 每个动词形态与真实对照表一致 | 待挂 | 本地 Node · Windows | fake CLI 调用账本 + Store 事件清单 + 真实 herdr 逐命令 probe | **不跑真实闭环实录**（归 DHR_35）；不声称 60s 覆盖任意未来启动；不碰 Linux/SSH；不代产品做信任决定 | design/06、design/12 | adapter + driver tests | 自动化 |

→ 当前状态：**进行中（D-start 已授权，未进入复核）**

## 人类签名区

本卡四条完成条件**均为机器证**，无人判结果项（H=0）。收口按 G14 走双谓词：谓词 A（人验栏为空：无人判结果项、无 open 方向项、无待认险风险项）∧ 谓词 B（放行资格：全部验收项已分类、机器项均有等价 pass 证据、不可豁免项均满足、无未验证项）。

E11 仍需用户在对话里明确确认后 AI 才可代签 verify；文档勾选不算。

- 确认记录：待补。
- verify 提交 SHA：待补。
- 签名：待补。
