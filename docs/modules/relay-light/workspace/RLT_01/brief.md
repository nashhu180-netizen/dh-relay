<!-- dh:v1 · brief.md -->
<!-- dh:workspace-contract:v2 -->
# brief — RLT_01 仓内 skill 单源与安装器

## 覆盖任务

| 任务 ID | 所属计划 | 验收口径出处 |
|---|---|---|
| RLT_01 | P1-RelayLight-开发方案 | [DevPlan §3.2 `RLT_01`](../../dev_plan/P1-RelayLight-开发方案.md#rlt_01--仓内-skill-单源与安装器) |

- **GitHub Issue**：[dh-relay #12](https://github.com/nashhu180-netizen/dh-relay/issues/12)
- **施工现场**：`/home/nash/work/dh-relay/.dh-worktrees/RLT_01`（`wt/RLT_01`）

## 目标 (Outcome)

建立 `tools/relay-light/skill/` 五文件唯一源——`roles.toml`/`dh-mapping.toml` 已由 RLT_05 交付，本卡补 `SKILL.md`、`references/adapter-claude-code.md`、`references/adapter-codex.md` 三件**骨架占位**（不写业务内容，归 RLT_07）——以及标准库 Python 安装器 `install_skill.py`：生产命令只提供 `--all`，从当前用户 home 派生两个固定目标并全量覆盖、校验哈希；本卡用临时 home 测试，不写真实用户目录。

## Zero-context 自查

施工者只读本文件、`task_plan.md`、DevPlan RLT_01 卡和 Context Packet 即可定位任务。权威分工为：DevPlan 定 owner、任务边界、依赖与 allowed-paths；design/01 §8.1 与 §11 定安装器合同与 oracle 原文；冲突时停下写 findings，不由施工者选边。`task_plan.md` 只冻结获确认后的施工顺序，不能改写正式合同。

## 完成条件 ★必写

- **机器证**｜来源：design/01 + `HC-RL-A124`｜仓内目录是唯一可编辑源；安装器只有仓内源→两侧副本的单向全量同步。临时 home 中人为改一侧副本并注入一次五文件复制中途失败，断言失败非零且仓内源未变；再次执行 `--all`，断言两侧五文件均与仓内源一致。

关联约束（为其他卡的验收提供前提，本卡只负责落地形态）：

- manifest 每目标一份**可解析当前值**，下次成功同步直接覆盖；字段 `source_head`、`source_dirty`、五文件相对路径与哈希、`installed_to`、`installed_at`（design §8.1）。
- A32（RLT_12 首步）与 A125（RLT_17）依赖本安装器与 manifest 形态取证。

## 边界 (Boundaries)

- In scope 闭集：`tools/relay-light/skill/**`（仅新增三件骨架；两 TOML 只读不动）、`tools/relay-light/install_skill.py`、`tools/relay-light/test_install_skill.py`、`docs/modules/relay-light/workspace/RLT_01/**`。
- Out of scope：不编写 skill 业务内容；不使用软链；不做历史 manifest、事务化、原子替换、回滚或中断恢复；不改 dev-harness、`relay_log.py`、`test_relay_log.py`、两 TOML、AGENTS 与其他卡工作区；不写真实用户目录。
- 本卡 task_type=`normal`。施工完成不等于复核、验证、签收、verify、合并、push 或部署。
- 施工路线冻结于 `task_plan.md`；跑偏只记 `progress.md`，不得回写计划。
- 与 RLT_07 同触 `tools/relay-light/skill/**`：本卡先建骨架，RLT_07 rebase 后填业务内容，互不覆盖。
- 本卡按手动派活运行：worker 把结构化 `DONE` 追加到 `progress.md` 后立即停止，不等待 `node_closed`。

## 触及子系统

- relay-light `skill-source`；收口阶段才由独立节点考虑 as-built，本 W 阶段不触碰。
