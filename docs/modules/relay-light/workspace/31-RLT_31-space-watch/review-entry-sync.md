<!-- dh:v1 -->
# RLT_31 同源入口摘要复核

复核范围仅为仓根 `AGENTS.md` single-task watcher 一句的同步；未复审已闭合代码、未执行 Herdr、未改动既有复核报告或 signals。

## 结论：PASS

`AGENTS.md` 已将旧的 watcher「只在 Herdr wait/get/read」表述同步为：watcher 只启动 `space_watch.py` 并巡检存活；脚本每 120 秒按 `workspace_id` 重新发现所在 Herdr workspace 全部成员，仅排 watcher 自己，机械比较 `agent_status` / `state_change_seq`，并 prompt 通知 orchestrator、确认投递。

该摘要与 `tools/relay-light/skill/SKILL.md` 的 watcher 合同及两份 adapter 一致：发现/差分/确认归脚本，watcher 不再自行目测状态；通知对象没有被加入排除集。入口句继续明确 watcher 对 repo/workspace 完全只读，不写 signal、progress 或日志，不路由、不分派；因此未增加 watcher 写权、派活权或恢复权。

RLT_31 DevPlan 已在修改前将 `AGENTS.md` 纳入精确允许路径；brief 范围和 findings F-009 均留有对应说明。该同步限于 single-task，不改变完整模式或既有 SW6 实态验证边界。

