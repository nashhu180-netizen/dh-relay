# DHR-A-19 候选：停滞恢复与术语可读性

> 已由 `DHR-A-19` 审核闭合并晋升为正式输入 `10-薄RelayPlan与显式节点边界-产品设计调整.md`；保留本候选作形成留痕，不授权 B-adjust、开发或运行时启用。

## 目标与范围

补足“Herdr 已拉起 Agent、但 Agent 未接单或长期无持久进展”的检测、诊断与恢复合同；澄清 Role Relay 的投递能力；为现有正式设计补充逐段术语说明和 YAML 中文行注释。不得把 Herdr 终端状态、终端输出或普通聊天提升为业务完成事实。

## 候选合同

1. 每个 Node 在 Resolved Plan 中冻结 `start_deadline`（启动确认时限）和 `checkpoint_deadline`（持久进展时限）；任一缺失则 launch fail-closed。
2. Worker 在读取 Ticket 指向的 worktree、AGENTS 和 workspace 合同后，必须持久提交 `node_started`；长步骤须在 `checkpoint_deadline` 内提交同一 Attempt 的 checkpoint。二者均只证明已接单或仍有可恢复进展，不证明质量或完成。
3. Monitor 结合 Host Observation、`node_started`、checkpoint 和最终工件判断“未接单、停滞、失联”；不能根据 Agent 聊天、`done` 文本或终端退出推断质量/完成。
4. 命中启动/进展时限或 Host 失联时，Host 从 Herdr 读取与当前 Ticket 身份匹配的有限诊断快照：生命周期状态、退出/错误原因、最后活跃时间和经过白名单/脱敏/限长的最后输出。该快照进入 Attention；不保存未经脱敏的原始终端正文、凭据或普通聊天。
5. Workflow Engine 据此原子持久化 `Attention(stalled|exited)`、撤销旧 Ticket 能力并将旧 Attempt 标为 `recovery_pending`；Host 先请求旧 Agent 正常结束，宽限期后强停 Pair。旧 Pair 未确认关闭或容量不足时不得启动替代者，返回/保留 `capacity_wait`。
6. 旧 Attempt 的迟到 checkpoint、Result 或 Role Relay 全部拒绝。旧 Pair 完全释放且 Runner 签发新 Ticket 后，才创建新 Attempt；新 Agent 从 workspace、Handoff、checkpoint 与 Attention 诊断快照恢复。节点不关闭、下游不 ready。
7. Review Batch 只恢复停滞/失联的未完成路径；同一 candidate revision 的已完成路径保持有效。Monitor 失联沿用既有规则：撤销未完成子 Pair，由新 Monitor 接管父 Batch。

## Role Relay 说明

Role Relay 是由 Relay Host 包装 Herdr `agent prompt` 的即时普通消息：先按 Sender Context 解析唯一当前目标，再作投递前后身份校验。Herdr 的 `agent prompt` 是成熟的单次交互入口：它原子提交文本和 Enter，并可报告 `idle`、`working`、`blocked`、`done` 或 `unknown` 等可观测状态；但 Herdr 没有“目标 Agent 身份在整个投递区间保持不变”的 compare-and-send 原语。因此 Relay 不能保证消息必达/已读/执行，也不排队和自动重投。

`target_busy` 的精确含义改为：目标 Agent 已在处理一个回合，Relay 为避免把第二段指令插入正在生成或等待工具的对话而拒绝本次投递；不是“系统崩了”。调用方可稍后重新发，或把不能丢的信息写入权威工件。

“找到对应 Agent”是成熟的 Host 查询动作：Herdr 用唯一 live agent name 或 pane ID 查询当前占用者和生命周期；Relay 再把其与 Run/generation/node/pair/attempt/agent_instance 的 Ticket 身份链比对。查询结果只在检查瞬间成立，目标可在下一瞬替换，故仍须前后复核；替换竞态返回 `delivery_uncertain`，而不是假称精确送达。

## 可读性落法

- 文首新增“阅读约定与核心术语”：英文代码名首次出现紧邻中文含义。
- 每个包含新术语、状态机、身份链或命令的自然段/图表后追加 `> 术语说明：…`；同一段只解释该段新词，已解释的词不机械重复。
- YAML 每个字段以中文行注释说明业务含义；示例明确“字段拼写尚未冻结”。

## 验收补充

- 在 `start_deadline` 内未提交 `node_started`、checkpoint 超时、Herdr 失联分别产出绑定身份的 Attention，且不关闭 Node、不产生下游 ready。
- Herdr 诊断快照只包含白名单字段，先脱敏再限长；聊天/原始窗口正文/凭据值不得进入 runtime 工件。
- 恢复先撤权并释放旧 Pair；旧 Attempt 的迟到写入拒绝；新 Attempt 只有在旧 Pair 释放及容量足够后出现。
- Review Batch 仅重启停滞路径，已 terminal 同 revision 路径不重复。
- Role Relay 覆盖 `target_busy`、`target_offline`、`target_ambiguous`、替换竞态 `delivery_uncertain`；`sent` 后无回复不改变业务状态。
