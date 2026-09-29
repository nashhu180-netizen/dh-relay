# 立户执行事实

- 任务 ID：`issue-94-decision-placement`
- Issue：https://github.com/nashhu180-netizen/dh-relay/issues/94
- 状态：本地实施与验证、独立复核已完成；未 PR/合入/安装。

## 立户阶段执行事实（历史）

- 基线：`a1710e0ae6509220528bee3aac867737b3c846ce`；本地 master 与 GitHub refs/heads/master 已实时核对相同，根工作区干净。
- 分支：`docs/issue-94-decision-placement`。
- worktree：`/home/nash/work/dh-relay/.dh-worktrees/issue-94-decision-placement`。
- workspace：`docs/modules/relay-light/workspace/issue-94-decision-placement/`。
- 进树：`git rebase master`，up to date，无变化。
- 执行者：本次 Codex 受派立户会话；发起/回报目标：`wfp03-orch2`。
- 模式：仅按手动派单做立户，不启动 single-task 或完整 relay 运行；未配置或确认实施模型，不创建任何角色实例。
- 总表：无（本次独立立户；未获 WFP/OBD 卡级总表维护授权）。
- 授权/停止线：只建 Issue 与任务工作区；回报后停止，实施需后续授权。
- 决定与问题来源：见 findings.md；建议验收和候选改动位置见 brief.md。
- 提交/checkpoint SHA：无新提交；HEAD 为上述基线。无 push/PR/merge/verify，Issue 保持 OPEN。
- GitHub CLI 读取/创建 Issue 成功；web-access 的浏览器连接检查超时，本任务通过已可用的 GitHub CLI 完成，不需要浏览器页面。
- 回报：待工件核验后执行 `herdr agent prompt wfp03-orch2`；不把通知成功等同于实施验收。

- 立户核验：七文件齐全，全部含 Issue #94 链接，无行尾空白；tracked diff 为空，未跟踪文件仅本工作区七文件。GitHub 回读 #94 为 OPEN。


## 实施恢复事实（2026-09-29）

- 本会话用户已授权继续，授权来源及边界指向 findings.md D-94-01；brief 当前实施合同优先于历史立户段。
- worktree/branch 与立户一致；进树 rebase master 无变化，基线仍为 a1710e0ae6509220528bee3aac867737b3c846ce。
- 上轮 Herdr 回报已成功返回 agent_prompted；本轮不默认再次发送消息。
- 执行：主会话直接施工；按 dev-harness light 派独立一致性/教训复核，不开启 relay-light 运行。


## 当前交付事实

- 三产品文档完成；验证和复核见 review.md，决定/接续见 findings.md。
- 独立复核实例：只读CLI 01a0eb91-ad80-7d31-863a-aa762f1ce3b9 未取得结果；有效实例 /root/review_issue94，两路PASS。
- 最终提交只含本卡允许路径；提交号以本分支 git log 的 fix(relay-light): keep decisions in findings 为准，避免在同一提交内自引用未知SHA。
- 不 push/PR/merge/install/cleanup，Issue仍OPEN。


## 远端交付恢复

- 授权更新见 findings.md D-94-02；当前本卡源提交17e907a2ddea6e010dc3aca572ccf9362d7f75e4，master仍为a1710e0ae6509220528bee3aac867737b3c846ce。
- GitHub权限ADMIN，master未配置保护、rulesets为空；仍执行AGENTS要求的三项必需CI，不使用bypass。CI workflow无部署步骤。
- 安装目标按现有副本核验：ThinkPad和ThinkBook，各.claude/.codex/.agents三个relay-light目录；仅同步既有五文件和manifest，不扩大到其它技能。
