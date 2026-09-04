<!-- dh:v1 -->
# execution_strategy — DHR_75

## 操作模型

主会话在独立 worktree 施工；S1 brief 由 fresh agent 校核，收口阶段按 heavy 配方委托五路只读复核、miner 与 as-built 草案。各 agent 只处理明确节点，不推进下一节点。

## 子 agent 授权（若派单）

| 子 agent | 范围（只读 / 可写哪些文件） | 谁批准 |
|---|---|---|
| S1 brief 校核 | 只读，返回差异建议，不改文件 | 用户 D-start + 节点表默认委托 |
| 收口 reviewers/miner/as-built | 到达对应节点后逐单冻结；reviewer 只读代码，工件写权另行精确指定 | 用户 D-start + 节点表默认委托 |

## 收尾铁律

- 证据不全 / 有 P0–P1 未关闭前，不许标“待验收”。
- DHR_75 实录不替代 DHR_72 机器证 F 或 DHR_35 P6-M1。
- 无用户 E11 明文确认，不打 verify、不合入、不清理、不启动下一卡。
