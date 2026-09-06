<!-- dh:v1 -->
# execution_strategy — DHR_77

## 操作模型

S0～S2 由主会话在主树落户；骨架提交后建立独立 `wt/DHR_77` worktree。用户随后已明确 D-start：从主会话右侧 Herdr 可交互终端派一个 construction worker，负责全部允许代码路径，避免原子兼容链被拆成各自可宣称完成的子卡；主会话挂 wait。该 worker 不是唯一参与者，不得回退或覆盖其他人的改动，不得复核自己的卡。

## 子 agent 授权（若派单）

| 子 agent | 范围（只读 / 可写哪些文件） | 谁批准 |
|---------|---------------------------|--------|
| construction worker（右侧 Herdr pane，待启动命名） | 只读 brief/task_plan/DevPlan/正式设计与 AGENTS；只写 DHR_77 `dh:allowed-paths` 内生产、测试、fixture、workspace 路径；不得改 DevPlan 状态、启动真实产品 Agent、派活或进入复核 | 用户 2026-09-06 明文 D-start |
| heavy 五路 reviewer（待施工后 fresh 派出） | 只读候选 diff、测试证据与各自 review path；只在授权的独立 review 落点写结论 | DHR_77 D-start 后按自动收口段执行 |

## 收尾铁律

- 当前授权包含 S3 construction Node；worker 收口后主会话再处理下一节点，不由 worker自行推进。
- 证据不全 / 有 P0–P1 未关闭前，不许标“待验收”。
- 代码轮2、需求、教训、一致性不得删路径或降级；施工者不复核自己的卡。
- 未经用户 E11 明确确认，不 squash、不 verify、不销户；push/deploy/下一卡始终包外。
