<!-- dh:v1 · brief.md -->
<!-- dh:workspace-contract:v2 -->
# brief — RLT_05 status/生命周期与配置/Recipe/止损

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| RLT_05 | P1-RelayLight-开发方案 | [DevPlan §3.2 `RLT_05`](../../dev_plan/P1-RelayLight-开发方案.md#rlt_05--status生命周期与配置recipe止损) |

- **GitHub Issue**：[dh-relay #8](https://github.com/nashhu180-netizen/dh-relay/issues/8)
- **施工现场**：`/home/nash/work/dh-relay/.dh-worktrees/RLT_05`（`wt/RLT_05`）

## 目标 (Outcome)

在 RLT_03 已交付的 plan parser、structural lint、append-only ledger 与 agent/node 状态机上，完成可机械消费的完整 `status` 生命周期派生、阶段控制事件时序与写者交接守门、配置加载与 Recipe 一致性，以及 attempt/X 两套独立止损；公开 CLI 仍只有 `add` / `status` / `lint`。

## Zero-context 自查

施工者只读本文件、`task_plan.md`、DevPlan RLT_05 卡和 Context Packet 即可定位任务。RLT-A-06/RLT-B-06 合同已闭合；2026-09-11 用户已另行授权 D-start，当前只开放 Batch 1。权威分工为：DevPlan 定 owner、任务边界、依赖与 allowed-paths；design/01 §11 定逐条 oracle 原文与证法，相关正文定义行为；二者冲突时停下写 findings，不由施工者选边。`task_plan.md` 只冻结获确认后的施工顺序，不能改写正式合同。

## 完成条件 ★必写

以下 25 条逐字承接 DevPlan RLT_05 的验收口径；任何一条缺证都不构成施工完成。

### status/生命周期组

- **机器证**｜来源：design/01 + `HC-RL-A43`｜status 六项齐并与样张一致。
- **机器证**｜来源：design/01 + `HC-RL-A44`｜status 不含产出合格性判断。
- **机器证**｜来源：design/01 + `HC-RL-A110`｜重复阶段实例结果独立。
- **机器证**｜来源：design/01 + `HC-RL-A111`｜open_stages 支持跨卡多个、同卡至多一个。
- **机器证**｜来源：design/01 + `HC-RL-A112`｜阶段收尾偏序非法即拒。
- **机器证**｜来源：design/01 + `HC-RL-A105`｜stage_result 四 outcome、可多写且最新生效。
- **机器证**｜来源：design/01 + `HC-RL-A118`｜blocked 后 done/cancelled 终局正确。
- **机器证**｜来源：design/01 + `HC-RL-A106`｜`last_stage_result.outcome` 派生 `suggested_action` 五枚举（`open_next_stage`/`wait_user`/`relaunch_monitor`/`notify_user`/`none`），`monitor_relaunch_count` 使 failed 最多重拉一次。
- **机器证**｜来源：design/01 + `HC-RL-A85`｜控制/agent 事件写入者一致性守门。
- **机器证**｜来源：design/01 + `HC-RL-A93`｜编排与监工 seq 区间不交错。
- **机器证**｜来源：design/01 + `HC-RL-A89`｜阶段级事件、关闭与跨阶段依赖时序正确。
- **机器证**｜来源：design/01 + `HC-RL-A65`｜未触发 agent 不算悬空。
- **机器证**｜来源：design/01 + `HC-RL-A61`｜当前节点与 pending/ready/open 派生正确。
- **机器证**｜来源：design/01 + `HC-RL-A81`｜closed 只读 node_close，closable 独立计算。
- **机器证**｜来源：design/01 + `HC-RL-A62`｜status JSON schema、排序与计数结构满足 §3.5；其中 `plan` 精确键含 `decision_mode`，本条不重复 A73 的 superseded 差分证明。
- **机器证**｜来源：design/01 + `HC-RL-A73`｜superseded 不产生状态、不进三列表；活跃 status 差分等价，唯一允许 `superseded_ignored` 不同。

### 配置/Recipe/止损组

- **机器证**｜来源：design/01 + `HC-RL-A107`｜attempt 与 X 轮数独立触发 strategist。
- **机器证**｜来源：design/01 + `HC-RL-A116`｜recipe 三值及实际 reviewer 集合严格匹配配置。
- **机器证**｜来源：design/01 + `HC-RL-A131`｜roles.toml 角色键与正式 design §6.3 的 11 个角色精确相等，且每个角色的 model/launch 可加载。
- **机器证**｜来源：design/01 + `HC-RL-A92`｜映射承载阶段、Recipe、limits、on_exceed 四类内容，且 E11/E12/E13 不出现在任何阶段。
- **机器证**｜来源：design/01 + `HC-RL-A115`｜heavy/normal/light reviewer 集合对齐 dev-harness 节点表。
- **机器证**｜来源：design/01 + `HC-RL-A99`｜改 `limits.rework_max_rounds` 不改 relay_log 即改变规划出的 X 节点数；模板生成走 lint/skill 内部实现，对外子命令仍只有 add/status/lint；配置来源为 §6.2.1 默认目录。
- **机器证**｜来源：design/01 + `HC-RL-A134`｜无 checker 的合法合成 plan 仍可通过 lint/status。
- **机器证**｜来源：design/01 + `HC-RL-A135`｜add/status/lint 均接 `--config-dir`；显式值展开 `~`、规范化为绝对路径并百分号编码记入账本；直接调用走 §6.2.1 五情形 resolver。
- **机器证**｜来源：design/01 + `HC-RL-A97`｜其它结构合法、唯一违规为 X 超限的合成 plan 被 lint 以 A97 精确拒绝；strategist 链结论必须经 `user_decision` 才能走 resume 或 cancelled，auto 模式亦然。

## 边界 (Boundaries)

- In scope 闭集：`tools/relay-light/relay_log.py`、`tools/relay-light/test_relay_log.py`、`tools/relay-light/skill/roles.toml`、`tools/relay-light/skill/dh-mapping.toml`、`docs/modules/relay-light/workspace/RLT_05/**`。
- Out of scope：不判断产出合格性；不驱动 Herdr；不缓存或硬编码 W→C→R→F；不把模型名写入流程/模板；不改 dev-harness；不为 legacy 缺失任务类型选默认值；不实现 RLT_07 的 `SKILL.md`、adapters、五阶段模板；不实现 RLT_09 的 plan-amend/表尾追加；不实现 RLT_18 的 watch。
- 本卡 task_type=`heavy`。施工完成不等于复核、验证、签收、verify、合并、push 或部署。
- 施工路线冻结于 `task_plan.md`；跑偏只记 `progress.md`，不得回写计划。
- 当前 25 条 owner/count 已按 RLT-B-06 正式同步；A117 归 RLT_07，A91/A108 退役，本卡新增 A131/A134/A135。D-start 已单独授权，但只开放当前派单的 Batch 1，不得越批。
- 本卡按手动派活运行：每批 worker 把结构化 `DONE` 追加到 `progress.md` 后立即停止，不等待 `node_closed`；后续批次由主控重新派发。

## 触及子系统

- relay-light `status-lifecycle` / `recipe-config`；收口阶段才由独立节点考虑 as-built，本 W 阶段不触碰。
