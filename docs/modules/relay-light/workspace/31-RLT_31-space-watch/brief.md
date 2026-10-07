<!-- dh:v1 -->
<!-- dh:workspace-contract:v2 -->
# RLT_31 · single-task workspace watcher

Issue: #151 https://github.com/nashhu180-netizen/dh-relay/issues/151
档位：标准（通知组件接线）；task_type=normal；verify scope=relay-light。
授权：2026-10-07 用户交接明确方案并说“claude 被冻结了，这是最后的留言，继续操作”。承接方案 1–3 与 GitHub Issue/任务分支/worktree/PR/CI/master 交付。此前未落户的新维护卡现在落户，不重启/接管 w68，真实运行仍依环境闸。
目标仓库：nashhu180-netizen/dh-relay；remote=origin；分支=wt/RLT_31-issue-151；目标=master。
worktree=/home/nash/work/dh-relay/.dh-worktrees/RLT_31；client=codex-cli。
范围：脚本、行为测试、AGENTS watcher 入口摘要、SKILL/两 adapter watcher 片段和派单模板、安装器与对应安装测试、本卡工件与 DevPlan。完整模式、业务仓、生产/部署、模型分配不在范围。

## 完成条件（来源：P1 DevPlan RLT_31，用户交接 / Issue #151）

| ID | 命题 | 事实证明方式 | 谁验 |
|---|---|---|---|
| SW1 | 按 workspace_id 每轮重新列全部 agent，只排除 watcher 自己；外部通知对象不纳入 | 单元测试、CLI fixture | 机器 |
| SW2 | agent_status 或 state_change_seq 改变、新增/离开机械通知；无变化静默 | 状态序列 fixture | 机器 |
| SW3 | 通知提交确认；失败不提交比较基线，不自动 Enter | subprocess/失败注入 | 机器 |
| SW4 | watcher 只起脚本和巡检；三份文档和派单模板一致；安装器提供脚本 | 文本检查、临时 home 安装 | 机器 |
| SW5 | 环境/RELAY_RECEIPT fail closed，零日志写入，独立复核和必需 CI PASS | 注入测试、复核、GitHub CI | 机器 |
| SW6 | 真实 Herdr workspace 状态变化与通知送达验证 | Herdr 管理会话实跑 | 机器 |

真实 w68 演练保留历史漏报；SW6 无环境不可假称 PASS，mock 与实跑分开。通知不是 durable 放行信号，不推动下一节点。
