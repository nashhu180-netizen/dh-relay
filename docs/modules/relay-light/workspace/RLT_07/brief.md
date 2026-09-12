<!-- dh:v1 · brief.md -->
<!-- dh:workspace-contract:v2 -->
# brief — RLT_07 skill 核心、adapter 与五阶段模板

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| RLT_07 | P1-RelayLight-开发方案 | [DevPlan §3.2 `RLT_07`](../../dev_plan/P1-RelayLight-开发方案.md#rlt_07--skill-核心adapter-与五阶段模板) |

- **GitHub Issue**：[dh-relay #10](https://github.com/nashhu180-netizen/dh-relay/issues/10)
- **施工现场**：`/home/nash/work/dh-relay/.dh-worktrees/RLT_07`（`wt/RLT_07`）

## 目标 (Outcome)

在仓内唯一源 `tools/relay-light/skill/` 写齐 skill 五件中的业务内容——`SKILL.md` 核心（角色表 / 五阶段模板 / 账本用法 / 拓扑布局 / 硬规则 / 放弃项）与 `references/adapter-claude-code.md`、`references/adapter-codex.md` 两份 adapter——冻结角色拉取、等待接收者、命令模板、密钥红线、职责分工、批内不换人与异常决策链，并承载「Recipe 唯一来自任务卡 task_type、字段缺失即问用户」的规划规则。`roles.toml`/`dh-mapping.toml` 已由 RLT_05 交付，本卡只读对齐、不覆盖。

## Zero-context 自查

施工者只读本文件、`task_plan.md`、DevPlan RLT_07 卡和 Context Packet 即可定位任务。权威分工为：DevPlan 定 owner、任务边界、依赖与 allowed-paths；design/01 §11 定逐条 oracle 原文与证法，相关正文定义行为；二者冲突时停下写 findings，不由施工者选边。`task_plan.md` 只冻结获确认后的施工顺序，不能改写正式合同。

## 完成条件 ★必写

以下 20 条逐字承接 DevPlan RLT_07 的验收口径；任何一条缺证都不构成施工完成。

### skill 核心组

- **机器证**｜来源：design/01 + `HC-RL-A12`｜skill 五件与核心小节齐全且落点正确。
- **机器证**｜来源：design/01 + `HC-RL-A117`｜SKILL.md 规定 Recipe 只来自任务卡 task_type，缺失时停下问用户。
- **机器证**｜来源：design/01 + `HC-RL-A132`｜skill/adapter/模板/流程不硬编码模型名，只引用角色名。
- **机器证**｜来源：design/01 + `HC-RL-A100`｜「终端空间/任务工作区」术语不混用。
- **机器证**｜来源：design/01 + `HC-RL-A98`｜计划/账本落模块 relay 目录，不落任务工作区。
- **机器证**｜来源：design/01 + `HC-RL-A19`｜Linux 收口前直跑测试并原样记 progress 的硬规则存在。
- **机器证**｜来源：design/01 + `HC-RL-A27`｜核心与派活模板均含凭据值禁写规则。
- **机器证**｜来源：design/01 + `HC-RL-A66`｜coder 四行小结、scribe 三素材优先级与禁写边界齐全。
- **机器证**｜来源：design/01 + `HC-RL-A67`｜findings/lesson 归 coder，progress 归 scribe。

### 五阶段模板与运行时合同组

- **机器证**｜来源：design/01 + `HC-RL-A95`｜场景一四角色 trigger 与 close 正确。
- **机器证**｜来源：design/01 + `HC-RL-A133`｜五阶段模板 C 节点默认包含 checker，且与 A95 的 trigger/close 合同一致。
- **机器证**｜来源：design/01 + `HC-RL-A127`｜五阶段模板不生成 kickoff 或 verify 签字节点。
- **机器证**｜来源：design/01 + `HC-RL-A102`｜批内 checkpoint 往返不增加 attempt。
- **机器证**｜来源：design/01 + `HC-RL-A113`｜仅实例失联/取消/阶段失败后可增加 attempt。
- **机器证**｜来源：design/01 + `HC-RL-A103`｜节点级返工才换实例，C/X 各自 #1。
- **机器证**｜来源：design/01 + `HC-RL-A114`｜auto/consult 决策链顺序严格。
- **机器证**｜来源：design/01 + `HC-RL-A96`｜两模式 resume 原 coder 且不新增 launch。

### adapter 组

- **机器证**｜来源：design/01 + `HC-RL-A21`｜两 adapter/模板均写 wait 返回必须有接收者及三种方式。
- **机器证**｜来源：design/01 + `HC-RL-A26`｜双平台命令、claude kind 起法与 stalled 处置冻结。
- **机器证**｜来源：design/01 + `HC-RL-A136`｜两份 adapter 的 add/status/lint 全部命令模板均显式传本侧默认安装副本的 `~/... --config-dir`，由 A135 展开。

## 边界 (Boundaries)

- In scope 闭集：`tools/relay-light/skill/**`（新建 `SKILL.md`、`references/adapter-claude-code.md`、`references/adapter-codex.md`；`roles.toml`、`dh-mapping.toml` 只读对齐）、`tools/relay-light/test_relay_log.py`、`docs/modules/relay-light/workspace/RLT_07/**`。
- Out of scope：不改 dev-harness；不硬编码模型名；不实现 `watch`；不把运行计划放进任务工作区；不改 `relay_log.py`、两份 TOML、安装器（RLT_01）与 AGENTS。
- 本卡 task_type=`heavy`。施工完成不等于复核、验证、签收、verify、合并、push 或部署。
- 施工路线冻结于 `task_plan.md`；跑偏只记 `progress.md`，不得回写计划。
- 正式依赖 RLT_01（未开始）/ RLT_02 / RLT_05（均已完成）：D-start 前须由主控裁决 RLT_01 依赖消解方式；两 TOML 已存在部分直接利用，不重建。
- 本卡按手动派活运行：每批 worker 把结构化 `DONE` 追加到 `progress.md` 后立即停止，不等待 `node_closed`；后续批次由主控重新派发。

## 触及子系统

- relay-light `skill-core`；收口阶段才由独立节点考虑 as-built，本 W 阶段不触碰。
