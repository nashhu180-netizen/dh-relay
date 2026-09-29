# 立户任务计划

> 当前交付：PR #95 已合入，双设备六份 skill 已安装并核验；CI/合入态复验/收口边界见 [closeout.md](closeout.md)。下文旧状态按其记录时点保留。

- 任务 ID：`issue-94-decision-placement`
- Issue：https://github.com/nashhu180-netizen/dh-relay/issues/94
- 状态：本地实施与验证、独立复核已完成；未 PR/合入/安装。

## 当前立户

- [x] 阅读派单与 AGENTS.md，核对仓库、master 基线及远端权限。
- [x] 先创建 Issue #94。
- [x] 从已核对的 master 建独立分支/worktree，进树 rebase master（无变化）。
- [x] 建七件套，回填 Issue、范围、建议验收及影响清单。
- [x] 核验七件套完整性、Issue 链接与改动范围。
- [x] 立户阶段已以 Herdr 回报 wfp03-orch2，返回 agent_prompted；随后本会话用户授权继续实施。

## 立户时的后续实施计划（历史，已由下方继续授权承接）

1. 用户确认实施范围、轻档/Recipe 与完整模式兼容口径。
2. 修改核心技能与双 adapter；检查内嵌派单模板与安装契约断言。
3. 验证决定来源可追溯、写者错开、恢复不误读摘要、完整模式与 single-task 无冲突。
4. 按冻结 Recipe 做独立一致性/教训复核，再按后续授权交付。

本计划不是 D-start，不派施工/复核，不改既有 DevPlan 任务表状态。


## 已授权实施步骤（2026-09-29）

1. 更新核心写者边界，细分 findings 决定记录与基线归因；补 execution_strategy 内容范围、single-task progress 禁记决定、完整模式差异。
2. 核心恢复/人验收口补 findings 来源回溯；双 adapter 同步写者、执行策略维护时机和派单字段。
3. 冻结产品文档，串行运行既有 test_install_skill.py，做来源缺失、用户遗留决定、并发写入、恢复与完整模式五类场景走读；git diff --check。
4. 派独立实例复核一致性和教训，回收结论并处理必要问题；最终精确提交本卡允许路径，停在本地已验证交付，不 push/PR/merge/install。


## 执行结果

四步已实施、验证与独立复核完成，证据见 review.md；随后精确提交本卡允许路径，停止于本地交付。未推送、PR、合入或安装。
